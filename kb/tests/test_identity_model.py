"""The AT 313 -> ATU 313A/B/C split (assessment §6.1, §8 Phase 0 exit).

This is the case that decides the architecture. When a type in AT (1961) is
split across several types in ATU (2004), a single-entity model keyed by
canonical code has three options and all of them are bad:

* keep one row and overwrite it, destroying the historical classification;
* create rows for the new codes and mark the old one ``superseded``, at which
  point ``superseded`` is a property of an *entity* when the actual fact is a
  property of a *relationship* between two editions' records;
* invent a project-authored "canonical" that no edition ever asserted.

The record/concept/concordance split makes it three ``split_into`` rows, each
independently sourced, with nothing overwritten and nothing invented. This test
walks that through against the real schema and rolls it back.
"""

from __future__ import annotations

import pytest

from atukb.codes import atu
from atukb.db import fetch_all, fetch_one, scalar

from .conftest import requires_db

pytestmark = requires_db


@pytest.fixture
def editions(conn):
    """AT-1961 and ATU-2004 editions, inside a rolled-back savepoint."""
    conn.execute("SAVEPOINT split_walkthrough")
    versions = {
        row["version_label"]: row["source_version_id"]
        for row in fetch_all(
            conn,
            "SELECT version_label, source_version_id FROM core.source_version "
            "WHERE version_label IN ('AT-1961', 'ATU-2004', 'trilogy/atu_df')",
        )
    }
    if len(versions) < 3:
        pytest.skip("sources are not registered; run `atukb ingest`")
    ids = {}
    for label, year in (("AT-1961", 1961), ("ATU-2004", 2004)):
        ids[label] = scalar(
            conn,
            "INSERT INTO core.edition (label, source_version_id, publication_year) "
            "VALUES (%s, %s, %s) ON CONFLICT (label) DO UPDATE "
            "SET publication_year = EXCLUDED.publication_year RETURNING edition_id",
            (label, versions[label], year),
        )
    yield ids, versions
    conn.execute("ROLLBACK TO SAVEPOINT split_walkthrough")


def _record(conn, edition_id: int, code: str, version_id: int, locator: str) -> int:
    parsed = atu.parse(code)
    return scalar(
        conn,
        """
        INSERT INTO core.tale_type_record (edition_id, code_raw, code_canonical,
                                           code_sort_key, code_kind, division,
                                           source_version_id, source_locator,
                                           field_class, derivation, review_status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'thin_facts', 'stated', 'accepted')
        ON CONFLICT (edition_id, code_raw) DO UPDATE SET code_raw = EXCLUDED.code_raw
        RETURNING record_id
        """,
        (
            edition_id,
            code,
            parsed.canonical,
            parsed.sort_key,
            parsed.kind,
            atu.division(parsed),
            version_id,
            locator,
        ),
    )


def test_an_at_to_atu_split_loses_nothing(conn, editions) -> None:
    ids, versions = editions
    at, atu_ed = ids["AT-1961"], ids["ATU-2004"]
    witness = versions["trilogy/atu_df"]

    old = _record(conn, at, "313", versions["AT-1961"], "AT 1961 p.104")
    new = {
        code: _record(conn, atu_ed, code, witness, f"atu_df.csv:{i}")
        for i, code in enumerate(("313A", "313B", "313C"), start=1)
    }

    for code, record_id in new.items():
        conn.execute(
            """
            INSERT INTO core.tale_type_concordance
                (from_record_id, to_record_id, relation, source_version_id,
                 source_locator, field_class, derivation, review_status)
            VALUES (%s, %s, 'split_into', %s, %s, 'thin_facts', 'curated', 'accepted')
            """,
            (old, record_id, witness, f"Uther 2004, entry {code}"),
        )

    # 1. The historical record still exists, unchanged and still AT-1961's.
    survivor = fetch_one(
        conn,
        "SELECT r.code_canonical, e.label FROM core.tale_type_record r "
        "JOIN core.edition e USING (edition_id) WHERE r.record_id = %s",
        (old,),
    )
    assert survivor == {"code_canonical": "313", "label": "AT-1961"}

    # 2. The change is three edges, each with a direction and its own source.
    edges = fetch_all(
        conn,
        """
        SELECT t.code_canonical AS to_code, c.relation::text AS relation,
               c.source_locator, c.derivation::text AS derivation
          FROM core.tale_type_concordance c
          JOIN core.tale_type_record t ON t.record_id = c.to_record_id
         WHERE c.from_record_id = %s
         ORDER BY t.code_canonical
        """,
        (old,),
    )
    assert [e["to_code"] for e in edges] == ["313A", "313B", "313C"]
    assert {e["relation"] for e in edges} == {"split_into"}
    assert all(e["source_locator"].startswith("Uther 2004") for e in edges)
    # The split is a curatorial reading of the two editions, and says so.
    assert {e["derivation"] for e in edges} == {"curated"}

    # 3. No entity anywhere carries a `superseded` status, because the fact is
    #    not a property of an entity.
    assert "status" not in {
        c["column_name"]
        for c in fetch_all(
            conn,
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = 'core' AND table_name = 'tale_type_record'",
        )
    }


def test_the_two_editions_can_share_one_concept_without_merging(conn, editions) -> None:
    """Identity spans editions; attributes do not.

    The concept links the AT record to one of its ATU successors, and gains no
    code, title or status by doing so — which is exactly what stops the split
    collapsing back into a conflated entity.
    """
    ids, versions = editions
    old = _record(conn, ids["AT-1961"], "313", versions["AT-1961"], "AT 1961 p.104")
    new = _record(
        conn, ids["ATU-2004"], "313A", versions["trilogy/atu_df"], "atu_df.csv:1"
    )
    concept = scalar(
        conn,
        "INSERT INTO core.tale_type_concept (notes) VALUES "
        "('the magic flight complex') RETURNING concept_id",
    )
    conn.execute(
        "UPDATE core.tale_type_record SET concept_id = %s WHERE record_id IN (%s, %s)",
        (concept, old, new),
    )

    rows = fetch_all(
        conn,
        "SELECT e.label, r.code_canonical FROM core.tale_type_record r "
        "JOIN core.edition e USING (edition_id) WHERE r.concept_id = %s "
        "ORDER BY e.label",
        (concept,),
    )
    assert rows == [
        {"label": "AT-1961", "code_canonical": "313"},
        {"label": "ATU-2004", "code_canonical": "313A"},
    ]

    stored = fetch_one(
        conn, "SELECT * FROM core.tale_type_concept WHERE concept_id = %s", (concept,)
    )
    assert set(stored) == {"concept_id", "minted_at", "notes"}


def test_a_record_cannot_be_its_own_successor(conn, editions) -> None:
    ids, versions = editions
    record = _record(conn, ids["AT-1961"], "313", versions["AT-1961"], "AT 1961 p.104")
    conn.execute("SAVEPOINT self_edge")
    with pytest.raises(Exception, match="concordance_is_between_two_records"):
        conn.execute(
            """
            INSERT INTO core.tale_type_concordance
                (from_record_id, to_record_id, relation, source_version_id,
                 source_locator, field_class, derivation, review_status)
            VALUES (%s, %s, 'same_as', %s, 'x', 'thin_facts', 'curated', 'accepted')
            """,
            (record, record, versions["AT-1961"]),
        )
    conn.execute("ROLLBACK TO SAVEPOINT self_edge")
