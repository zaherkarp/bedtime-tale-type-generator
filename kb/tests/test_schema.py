"""Schema-level invariants (assessment §3.4, §3.5, §6.1, §6.3, §9).

These are the assertions that stop the model drifting back into the shape the
assessment argued against. They run against a migrated database and are cheap,
so they are the first thing to fail if someone reintroduces a rejected idea.
"""

from __future__ import annotations

import pytest

from atukb.db import fetch_all, scalar

from .conftest import requires_db

pytestmark = requires_db


RELATIONSHIP_TABLES = (
    "tale_type_record",
    "tale_type_name",
    "tale_type_attestation",
    "tale_type_concordance",
    "tale_type_motif",
    "tale_type_relation",
    "motif",
    "motif_label",
    "assertion_staging",
)


def _columns(conn, table: str) -> dict[str, dict]:
    return {
        row["column_name"]: row
        for row in fetch_all(
            conn,
            """
            SELECT column_name, is_nullable, data_type, udt_name
              FROM information_schema.columns
             WHERE table_schema = 'core' AND table_name = %s
            """,
            (table,),
        )
    }


def test_no_confidence_column_exists_anywhere(conn) -> None:
    """§3.4: numeric confidence is fake precision, and the proposal's own risk.

    Nothing in the sources emits a calibrated probability. A `confidence` column
    would hold a developer's intuition rendered as 0.8, which a consumer then
    filters on and believes.
    """
    offenders = fetch_all(
        conn,
        """
        SELECT table_name, column_name FROM information_schema.columns
         WHERE table_schema IN ('core', 'raw') AND column_name ILIKE '%confidence%'
        """,
    )
    assert offenders == []


def test_no_necessity_column_exists_anywhere(conn) -> None:
    """§3.5: a generator requirement wearing a folklore costume.

    No source marks motifs as required, and acceptance criterion #11 forbids
    generator-specific fields in the core model.
    """
    offenders = fetch_all(
        conn,
        """
        SELECT table_name, column_name FROM information_schema.columns
         WHERE table_schema IN ('core', 'raw')
           AND (column_name ILIKE '%necessit%'
                OR column_name ILIKE '%beat%'
                OR column_name ILIKE '%required_motif%'
                OR column_name ILIKE '%signature%'
                OR column_name ILIKE '%tone%'
                OR column_name ILIKE '%age_band%')
        """,
    )
    assert offenders == []


@pytest.mark.parametrize("table", RELATIONSHIP_TABLES)
def test_derivation_and_review_status_are_not_nullable(conn, table: str) -> None:
    """§6.3: a consumer must be *unable* to receive an edge without knowing
    whether a human ever asserted it."""
    columns = _columns(conn, table)
    for column in ("derivation", "review_status"):
        assert column in columns, f"{table}.{column} is missing"
        assert columns[column]["is_nullable"] == "NO", f"{table}.{column} is nullable"


@pytest.mark.parametrize("table", RELATIONSHIP_TABLES)
def test_every_value_bearing_row_carries_its_source(conn, table: str) -> None:
    columns = _columns(conn, table)
    for column in ("source_version_id", "source_locator", "field_class"):
        assert column in columns, f"{table}.{column} is missing"
        assert columns[column]["is_nullable"] == "NO", f"{table}.{column} is nullable"


def test_concept_carries_no_attributes(conn) -> None:
    """§6.1: a concept is an identity, not a merged summary.

    The moment it grows a code, a title or a status, the record/concept split
    has collapsed back into the conflated entity it replaced.
    """
    columns = set(_columns(conn, "tale_type_concept"))
    assert columns == {"concept_id", "minted_at", "notes"}
    for forbidden in ("code", "canonical_code", "title", "canonical_title", "status",
                      "current_status", "historical_status"):
        assert forbidden not in columns


def test_record_has_no_scalar_canonical_title(conn) -> None:
    """§6.2/§3.2: the preferred title is a pointer to a sourced row."""
    columns = _columns(conn, "tale_type_record")
    assert "canonical_title" not in columns
    assert "preferred_name_id" in columns


def test_motif_hierarchy_is_an_ltree_not_an_edge_table(conn) -> None:
    """§3.6: storing the hierarchy as edges lets it disagree with the codes."""
    assert _columns(conn, "motif")["path"]["udt_name"] == "ltree"
    assert (
        scalar(
            conn,
            "SELECT count(*) FROM information_schema.tables "
            "WHERE table_schema = 'core' AND table_name = 'motif_hierarchy'",
        )
        == 0
    )


def test_source_version_records_both_kinds_of_ancestry(conn) -> None:
    """§6.3: temporal supersession and derivational lineage are different facts."""
    columns = _columns(conn, "source_version")
    assert "supersedes_version_id" in columns
    assert "derives_from_source_version_id" in columns


def test_raw_is_immutable(conn) -> None:
    """§9: raw must be immutable and *enforced*, not merely intended.

    A grant would not do it — the owner bypasses grants — so the enforcement is
    a trigger, and this test is what proves the difference.
    """
    conn.execute("SAVEPOINT probe")
    with pytest.raises(Exception, match="immutable"):
        conn.execute("UPDATE raw.record SET dataset = 'tampered'")
    conn.execute("ROLLBACK TO SAVEPOINT probe")
    with pytest.raises(Exception, match="immutable"):
        conn.execute("DELETE FROM raw.record")
    conn.execute("ROLLBACK TO SAVEPOINT probe")


def test_retraction_table_exists(conn) -> None:
    """§6.3: removing a wrong value must leave a record that it existed."""
    columns = set(_columns(conn, "retraction"))
    assert {"entity_type", "entity_id", "retracted_at", "reason", "superseded_by"} <= columns


def test_assertion_is_a_view_not_a_table(conn) -> None:
    """§6.2: one write path. `assertion` is a projection, so it cannot disagree."""
    kind = scalar(
        conn,
        """
        SELECT table_type FROM information_schema.tables
         WHERE table_name = 'assertion' AND table_schema LIKE 'publish%'
         LIMIT 1
        """,
    )
    if kind is None:
        pytest.skip("nothing published yet")
    assert kind == "VIEW"
