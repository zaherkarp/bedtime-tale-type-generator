"""``atukb`` — acquire, ingest, publish, export, serve.

The command names are the three gates plus what they enable, because the gates
are the part of this system a operator has to hold in their head (§6.4).
"""

from __future__ import annotations

import argparse
import json
import sys

from atukb.acquire.artifact_store import ArtifactStore
from atukb.acquire.plans import PLANS
from atukb.config import settings
from atukb.db import connect, fetch_all
from atukb.rights.gates import check_acquire, check_ingest
from atukb.rights.register import load_register


def cmd_acquire(args: argparse.Namespace) -> int:
    """Gate 1. Permitted unconditionally — you must fetch to read a license."""
    from atukb.ingest.gates import IngestionHalt, gate_checksum_unchanged

    register = load_register()
    store = ArtifactStore(settings.artifact_store)
    keys = args.sources or list(PLANS)
    changed: list[str] = []
    for key in keys:
        entry = register[key]
        check_acquire(entry)
        print(f"acquiring {key} …", file=sys.stderr)
        for name, artifact in PLANS[key].acquire(store).items():
            print(f"  {name:16s} {artifact.bytes_len:>10,} B  {artifact.sha256[:12]}")
            # §6.8: an unannounced upstream change is never routine. It halts,
            # and re-running with --accept-changes is the deliberate act that
            # records the new version.
            with connect() as conn:
                try:
                    gate_checksum_unchanged(conn, key, name, artifact.sha256)
                except IngestionHalt as halt:
                    if not args.accept_changes:
                        print(f"\nHALT: {halt}", file=sys.stderr)
                        print(
                            "Re-run with --accept-changes once you have reviewed the "
                            "diff, or restore the previous artifact.",
                            file=sys.stderr,
                        )
                        return 2
                    changed.append(f"{key}/{name}")
    for label in changed:
        print(f"accepted a changed artifact: {label}", file=sys.stderr)
    return 0


def cmd_ingest(args: argparse.Namespace) -> int:
    """Gate 2. Requires a reviewed rights-register entry."""
    from atukb.ingest.pipeline import ingest_all

    register = load_register()
    store = ArtifactStore(settings.artifact_store)
    with connect() as conn:
        reports = ingest_all(
            conn, register, store, only=args.sources or None, strict=args.strict
        )
        conn.commit()
    for report in reports:
        print(json.dumps(report.as_dict(), indent=2))
    return 0


def cmd_publish(args: argparse.Namespace) -> int:
    """Gate 3. Builds a fresh versioned schema, validates it, then swaps."""
    from atukb.publish.build import build_and_swap, prune_old_builds

    register = load_register()
    with connect() as conn:
        result = build_and_swap(conn, register, fail_validation=args.fail_validation)
        if args.prune and result["status"] == "live":
            # Keep the last few versioned schemas so a rollback is a rename
            # away; drop the rest.
            result["pruned"] = prune_old_builds(conn, keep=args.keep)
        conn.commit()
    print(json.dumps(result, indent=2, default=str))
    return 0 if result["status"] == "live" else 1


def cmd_export(args: argparse.Namespace) -> int:
    from atukb.publish.export import export_all

    with connect() as conn:
        written = export_all(conn, settings.export_dir)
    for path, count in written.items():
        print(f"{count:>8,}  {path}")
    return 0


def cmd_review(args: argparse.Namespace) -> int:
    """The review queue as data: a CSV round-trip, not a UI project (§8)."""
    from atukb.review.queue import export_queue, import_decisions

    with connect() as conn:
        if args.apply:
            applied = import_decisions(conn, args.apply)
            conn.commit()
            print(f"applied {applied} decision(s)")
        else:
            count = export_queue(conn, args.out)
            print(f"wrote {count} open item(s) to {args.out}")
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    with connect() as conn:
        for label, sql in (
            ("sources", "SELECT key, gate_status FROM core.source "
                        "JOIN core.rights_register USING (source_id) ORDER BY key"),
            ("motifs", "SELECT count(*) AS motifs FROM core.motif"),
            ("tale-type records", "SELECT e.label, count(*) AS records "
                                  "FROM core.tale_type_record r "
                                  "JOIN core.edition e USING (edition_id) "
                                  "GROUP BY e.label ORDER BY e.label"),
            ("concepts", "SELECT count(*) AS concepts FROM core.tale_type_concept"),
            ("type-motif edges", "SELECT count(*) AS edges FROM core.tale_type_motif"),
            ("quarantine", "SELECT dataset, count(*) FROM core.quarantine "
                           "GROUP BY dataset ORDER BY dataset"),
            ("review queue", "SELECT reason, count(*) FROM core.review_queue "
                             "WHERE status = 'open' GROUP BY reason ORDER BY 2 DESC"),
            ("publish", "SELECT schema_name, status, is_live FROM core.publish_build "
                        "ORDER BY build_id DESC LIMIT 5"),
        ):
            print(f"\n== {label}")
            for row in fetch_all(conn, sql):
                print("  " + "  ".join(f"{k}={v}" for k, v in row.items()))
    return 0


def cmd_serve(args: argparse.Namespace) -> int:
    import uvicorn

    uvicorn.run("atukb.api.app:app", host=args.host, port=args.port, log_level="info")
    return 0


def cmd_gates(args: argparse.Namespace) -> int:
    """Print what each gate currently permits, for every registered source."""
    register = load_register()
    for entry in register:
        print(f"\n{entry.key}  [{entry.license_reviewed_spdx or entry.license_asserted_spdx}]")
        print(f"  acquire  : permitted (unconditional, §6.4)")
        try:
            check_ingest(register, entry.key)
            print(f"  ingest   : permitted")
        except Exception as exc:
            print(f"  ingest   : REFUSED — {exc}")
        for field_class, decision in sorted(entry.publication.items()):
            verdict = "permitted" if entry.may_publish_class(field_class) else "REFUSED"
            print(f"  publish  : {field_class:12s} {verdict}")
            for question in decision.open_questions:
                print(f"             open: {question.strip()[:96]}")
        if entry.open_questions:
            print(f"  {len(entry.open_questions)} unresolved rights question(s) recorded")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="atukb", description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("acquire", help="fetch artifacts into quarantine")
    p.add_argument("sources", nargs="*")
    p.add_argument(
        "--accept-changes",
        action="store_true",
        help="record an artifact whose checksum differs from the last run; "
             "without this the acquire gate halts (§6.8)",
    )
    p.set_defaults(func=cmd_acquire)

    p = sub.add_parser("ingest", help="parse into raw and normalise into core")
    p.add_argument("sources", nargs="*")
    p.add_argument(
        "--strict",
        action="store_true",
        help="halt on any quarantined row instead of reporting the count",
    )
    p.set_defaults(func=cmd_ingest)

    p = sub.add_parser("publish", help="build, validate and swap the publish schema")
    p.add_argument(
        "--fail-validation",
        action="store_true",
        help="inject a validation failure, to demonstrate that a failed build "
             "cannot degrade a live dataset (acceptance criterion #14)",
    )
    p.add_argument(
        "--prune", action="store_true", help="drop superseded publish_v* schemas"
    )
    p.add_argument(
        "--keep", type=int, default=2, help="how many builds --prune keeps (default 2)"
    )
    p.set_defaults(func=cmd_publish)

    p = sub.add_parser("export", help="write license-filtered JSONL exports")
    p.set_defaults(func=cmd_export)

    p = sub.add_parser("review", help="round-trip the review queue as CSV")
    p.add_argument("--out", default="review-queue.csv")
    p.add_argument("--apply", help="apply decisions from a CSV")
    p.set_defaults(func=cmd_review)

    p = sub.add_parser("status", help="what is in the database right now")
    p.set_defaults(func=cmd_status)

    p = sub.add_parser("gates", help="what each gate currently permits")
    p.set_defaults(func=cmd_gates)

    p = sub.add_parser("serve", help="run the /v0 API")
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=8000)
    p.set_defaults(func=cmd_serve)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
