"""Idempotency, as a structural property rather than a hope (§9, §6.8).

"Two consecutive runs produce identical ``core``" only holds if every table a
normaliser writes into can actually reject a repeat. ``ON CONFLICT DO NOTHING``
with nothing to conflict on is a silent no-op that inserts anyway, which is how
a second ingestion doubled ``core.quarantine`` and ``core.assertion_evidence``
here before these constraints existed.

The full double-ingest is a two-minute manual check (``kb/README.md``); this is
the instant one that stops the invariant regressing.
"""

from __future__ import annotations

import pytest

from atukb.db import fetch_all

from .conftest import requires_db

pytestmark = requires_db

#: ``table -> the natural key a re-run must collide on``. Every table an
#: ingestion writes to more than once appears here.
NATURAL_KEYS: dict[str, set[str]] = {
    "motif": {"code_canonical"},
    "tale_type_record": {"edition_id", "code_raw"},
    "tale_type_attestation": {"record_id", "source_version_id"},
    "tale_type_concordance": {"from_record_id", "to_record_id", "relation"},
    "tale_type_motif": {"record_id", "motif_id", "tale_variant", "sequence_position"},
    "tale_type_relation": {"from_record_id", "to_record_id", "relation_kind"},
    "edition": {"label"},
    "source": {"key"},
    "source_version": {"source_id", "version_label"},
    "artifact": {"artifact_id"},
    "content_advisory": {"entity_type", "entity_ref"},
    "review_queue": {"item_type", "item_ref", "reason"},
    "quarantine": {"source_version_id", "dataset", "source_locator", "reason"},
    "assertion_evidence": {
        "subject_table",
        "subject_id",
        "source_version_id",
        "source_locator",
        "evidence_kind",
    },
}


def _unique_key_sets(conn, table: str) -> list[set[str]]:
    rows = fetch_all(
        conn,
        """
        SELECT c.conname, array_agg(a.attname::text) AS cols
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          JOIN unnest(c.conkey) AS k(attnum) ON true
          JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
         WHERE n.nspname = 'core' AND t.relname = %s AND c.contype IN ('u', 'p')
         GROUP BY c.conname
        """,
        (table,),
    )
    return [set(r["cols"]) for r in rows]


@pytest.mark.parametrize("table,key", sorted(NATURAL_KEYS.items()))
def test_every_rewritten_table_can_reject_a_repeat(conn, table: str, key: set[str]) -> None:
    keys = _unique_key_sets(conn, table)
    assert key in keys, (
        f"core.{table} has no unique constraint on {sorted(key)}; a second "
        f"ingestion would insert duplicates rather than doing nothing. "
        f"Constraints present: {[sorted(k) for k in keys]}"
    )


def test_raw_rows_cannot_be_appended_twice(conn) -> None:
    """``raw`` is append-only, so the guard has to be the unique key."""
    keys = _unique_key_sets(conn, "record")
    rows = fetch_all(
        conn,
        """
        SELECT array_agg(a.attname::text) AS cols
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          JOIN unnest(c.conkey) AS k(attnum) ON true
          JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
         WHERE n.nspname = 'raw' AND t.relname = 'record' AND c.contype = 'u'
         GROUP BY c.conname
        """,
    )
    assert {"source_version_id", "dataset", "row_number"} in [
        set(r["cols"]) for r in rows
    ], keys


def test_no_duplicate_rows_survive_in_the_current_data(conn) -> None:
    """The constraints above, confirmed against whatever is actually loaded."""
    for table, key in NATURAL_KEYS.items():
        if table in {"artifact", "source", "source_version", "edition"}:
            continue
        cols = ", ".join(sorted(key))
        dupes = fetch_all(
            conn,
            f"SELECT {cols}, count(*) AS n FROM core.{table} "  # noqa: S608
            f"GROUP BY {cols} HAVING count(*) > 1 LIMIT 3",
        )
        assert dupes == [], f"core.{table} holds duplicate rows for {cols}"
