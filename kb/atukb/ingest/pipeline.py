"""Acquire -> Parse -> Normalise -> Resolve, with the §6.8 gates in place.

Each dataset gets its own ``core.ingestion_run`` row carrying the gate report
and a diff against the previous version, because re-classification is the signal
this project exists to capture and it should not require a query to notice.
"""

from __future__ import annotations

import json

import psycopg

from atukb.acquire.artifact_store import ArtifactStore
from atukb.acquire.plans import PLANS
from atukb.db import fetch_one, scalar
from atukb.ingest import motifs, raw_load, registry, tale_types
from atukb.ingest.gates import (
    GateReport,
    IngestionHalt,
    gate_row_count_stable,
)
from atukb.rights.gates import check_ingest
from atukb.rights.register import RightsRegister

#: Which loader owns which dataset. A dataset with no loader is acquired and
#: kept in quarantine but never reaches core — which is the correct outcome for
#: anything the register has not cleared.
DATASET_LOADERS = {
    "tmi_mellmann": {"tmi": "motifs"},
    "wikidata_p2540": {"p2540": "wikidata_types"},
    "trilogy": {
        "atu_df": "trilogy_types",
        "atu_seq": "type_motif_edges",
        "atu_combos": "type_relations",
    },
}


def ingest_all(
    conn: psycopg.Connection,
    register: RightsRegister,
    store: ArtifactStore,
    *,
    only: list[str] | None = None,
    strict: bool = False,
) -> list[GateReport]:
    versions = registry.register_all(conn, register, store)
    reports: list[GateReport] = []

    # Order matters: motifs and Wikidata tale types are the spine, trilogy's
    # conflicting records land on top of them, and the type<->motif edges need
    # both ends to exist first (§8 phases 1-3).
    order = ["tmi_mellmann", "wikidata_p2540", "trilogy"]
    for source_key in order:
        if only and source_key not in only:
            continue
        entry = check_ingest(register, source_key)
        for dataset, loader in DATASET_LOADERS.get(source_key, {}).items():
            label = f"{source_key}/{dataset}"
            if label not in versions:
                continue
            reports.append(
                _ingest_dataset(
                    conn,
                    register=register,
                    store=store,
                    source_key=source_key,
                    dataset=dataset,
                    loader=loader,
                    source_version_id=versions[label],
                    rights=entry,
                    versions=versions,
                    strict=strict,
                )
            )
    return reports


def _ingest_dataset(
    conn: psycopg.Connection,
    *,
    register: RightsRegister,
    store: ArtifactStore,
    source_key: str,
    dataset: str,
    loader: str,
    source_version_id: int,
    rights,
    versions: dict[str, int],
    strict: bool,
) -> GateReport:
    report = GateReport(source_version_id=source_version_id, dataset=dataset)
    run_id = scalar(
        conn,
        "INSERT INTO core.ingestion_run (source_version_id) VALUES (%s) "
        "RETURNING run_id",
        (source_version_id,),
    )
    before = _snapshot(conn)

    try:
        artifact_name = _artifact_name(source_key, dataset)
        artifact = store.get(source_key, artifact_name)
        if artifact is None:
            raise IngestionHalt(
                f"{source_key}/{artifact_name} has not been acquired; run "
                f"`atukb acquire {source_key}` first (§6.4)."
            )
        if not store.verify(artifact):
            raise IngestionHalt(
                f"{artifact.artifact_id}: stored bytes do not match the manifest "
                f"checksum. The quarantine copy is not trustworthy (§6.8)."
            )

        rows = _read_rows(store, source_key, dataset, artifact_name)
        loaded = raw_load.load_rows(
            conn,
            source_version_id=source_version_id,
            dataset=dataset,
            artifact_id=artifact.artifact_id,
            rows=rows,
        )
        note = gate_row_count_stable(conn, dataset, loaded)
        if note:
            report.notes.append(note)

        if loader == "motifs":
            motifs.normalise(
                conn, source_version_id=source_version_id, rights=rights, report=report
            )
            motifs.seed_content_advisories(conn, flagged_by="repository maintainer")
        elif loader == "wikidata_types":
            tale_types.normalise_wikidata(
                conn, source_version_id=source_version_id, rights=rights, report=report
            )
        elif loader == "trilogy_types":
            tale_types.normalise_trilogy(
                conn, source_version_id=source_version_id, rights=rights, report=report
            )
        elif loader == "type_motif_edges":
            tale_types.normalise_type_motif_edges(
                conn, source_version_id=source_version_id, rights=rights, report=report
            )
        elif loader == "type_relations":
            tale_types.normalise_type_relations(
                conn, source_version_id=source_version_id, rights=rights, report=report
            )

        if strict and report.rows_quarantined:
            raise IngestionHalt(
                f"{dataset}: {report.rows_quarantined} row(s) quarantined and "
                f"--strict was requested"
            )

        conn.execute(
            "UPDATE core.ingestion_run SET status = 'succeeded', finished_at = now(), "
            "stats = %s, diff_report = %s WHERE run_id = %s",
            (
                json.dumps(report.as_dict()),
                json.dumps(_diff(before, _snapshot(conn))),
                run_id,
            ),
        )
    except Exception as exc:
        conn.execute(
            "UPDATE core.ingestion_run SET status = 'failed', finished_at = now(), "
            "stats = %s WHERE run_id = %s",
            (json.dumps({**report.as_dict(), "error": str(exc)}), run_id),
        )
        raise

    return report


def _artifact_name(source_key: str, dataset: str) -> str:
    return "p2540.json" if source_key == "wikidata_p2540" else f"{dataset}.csv"


def _read_rows(store: ArtifactStore, source_key: str, dataset: str, name: str):
    if source_key == "wikidata_p2540":
        payload = json.loads(store.read(source_key, name))
        for binding in payload["results"]["bindings"]:
            yield {k: v["value"] for k, v in binding.items()}
    else:
        yield from raw_load.read_csv_rows(store, source_key, name)


def _snapshot(conn: psycopg.Connection) -> dict[str, int]:
    """Entity counts, for the differential report §6.8 asks for."""
    row = fetch_one(
        conn,
        """
        SELECT (SELECT count(*) FROM core.motif)              AS motifs,
               (SELECT count(*) FROM core.tale_type_record)   AS tale_type_records,
               (SELECT count(*) FROM core.tale_type_concept)  AS concepts,
               (SELECT count(*) FROM core.tale_type_name)     AS names,
               (SELECT count(*) FROM core.tale_type_motif)    AS type_motif_edges,
               (SELECT count(*) FROM core.tale_type_relation) AS type_relations,
               (SELECT count(*) FROM core.quarantine)         AS quarantined
        """,
    )
    return dict(row or {})


def _diff(before: dict[str, int], after: dict[str, int]) -> dict[str, dict[str, int]]:
    return {
        key: {"before": before.get(key, 0), "after": after.get(key, 0),
              "added": after.get(key, 0) - before.get(key, 0)}
        for key in sorted(set(before) | set(after))
        if after.get(key, 0) != before.get(key, 0)
    }
