"""License-filtered bulk export (assessment §6.9 rule 3).

Exports read from ``publish``, never from ``core``. That is the whole
enforcement: the license filter already ran when the projection was built, so a
consumer cannot request the restricted fields into existence, and neither can a
future maintainer who forgets to add a WHERE clause.
"""

from __future__ import annotations

import json
from pathlib import Path

import psycopg

from atukb.db import fetch_all

#: ``entity -> the publish relation it exports``. Adding an entity here is the
#: only way to add an export, so there is no ad-hoc export path.
EXPORTABLE = {
    "motifs": "publish.motif",
    "tale-types": "publish.tale_type",
    "tale-type-names": "publish.tale_type_name",
    "tale-type-motifs": "publish.tale_type_motif",
    "tale-type-relations": "publish.tale_type_relation",
    "concordance": "publish.concordance",
    "sources": "publish.source",
    "lineage": "publish.lineage",
}


def export_entity(conn: psycopg.Connection, entity: str, out_dir: Path) -> tuple[Path, int]:
    relation = EXPORTABLE[entity]
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{entity}.jsonl"
    rows = fetch_all(conn, f"SELECT * FROM {relation}")  # noqa: S608 — fixed allow-list
    with path.open("w", encoding="utf-8") as fh:
        for row in rows:
            fh.write(json.dumps(row, default=str, ensure_ascii=False) + "\n")
    return path, len(rows)


def export_all(conn: psycopg.Connection, out_dir: Path) -> dict[Path, int]:
    written: dict[Path, int] = {}
    for entity in EXPORTABLE:
        path, count = export_entity(conn, entity, out_dir)
        written[path] = count
    _write_attribution(conn, out_dir)
    return written


def _write_attribution(conn: psycopg.Connection, out_dir: Path) -> Path:
    """The machine-readable attribution report (acceptance criterion #10)."""
    rows = fetch_all(
        conn,
        """
        SELECT key, name, homepage_url, license_reviewed_spdx,
               attribution_text_required, upstream_rights_status,
               database_right_status, open_questions
          FROM publish.source
         ORDER BY key
        """,
    )
    path = out_dir / "attribution.json"
    path.write_text(
        json.dumps(
            {
                "note": (
                    "Attribution required by the reviewed licenses of every source "
                    "contributing to this export. Sources with a non-empty "
                    "open_questions list have unresolved upstream rights questions "
                    "recorded against them; see docs/atu-kb-decisions.md."
                ),
                "sources": rows,
            },
            indent=2,
            default=str,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    return path
