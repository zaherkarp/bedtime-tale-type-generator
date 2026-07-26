"""The phase exit criteria from §8, asserted against a real ingested database.

These are the tests that say whether the architecture works, as opposed to
whether the code runs. They need a populated database:

    atukb acquire && atukb ingest && atukb publish
"""

from __future__ import annotations

import pytest

from atukb.db import fetch_all, fetch_one, scalar

from .conftest import requires_db

pytestmark = requires_db


def _published(conn) -> bool:
    return bool(
        scalar(
            conn,
            "SELECT count(*) FROM information_schema.schemata WHERE schema_name = 'publish'",
        )
    )


@pytest.fixture(autouse=True)
def skip_without_data(conn):
    if not scalar(conn, "SELECT count(*) FROM core.motif"):
        pytest.skip("no ingested data; run `atukb acquire && atukb ingest`")


# -- Phase 1: the motif slice -----------------------------------------------

def test_motifs_were_normalised_at_scale(conn) -> None:
    assert scalar(conn, "SELECT count(*) FROM core.motif") > 40_000


def test_every_published_value_traces_to_an_artifact_and_a_locator(conn) -> None:
    """Phase 1's exit criterion, stated as a query."""
    if not _published(conn):
        pytest.skip("nothing published")
    orphan = scalar(
        conn,
        """
        SELECT count(*) FROM core.motif m
          JOIN core.source_version v USING (source_version_id)
         WHERE m.source_locator IS NULL OR v.artifact_id IS NULL
        """,
    )
    assert orphan == 0


def test_subtree_browse_is_a_prefix_match(conn) -> None:
    """§6.6: "everything under D" cannot disagree with the codes themselves."""
    under_d = scalar(
        conn, "SELECT count(*) FROM core.motif WHERE path <@ 'D'::ltree"
    )
    d_codes = scalar(conn, "SELECT count(*) FROM core.motif WHERE chapter = 'D'")
    assert under_d == d_codes > 1000


def test_every_motif_path_reproduces_its_own_code(conn) -> None:
    """The derived hierarchy is a function of the identifier, so it round-trips."""
    mismatched = fetch_all(
        conn,
        """
        SELECT code_canonical, path::text FROM core.motif
         WHERE replace(subpath(path, nlevel(path) - 1)::text, '_', '.') <> code_canonical
         LIMIT 5
        """,
    )
    assert mismatched == []


def test_malformed_rows_were_quarantined_not_dropped(conn) -> None:
    """§6.8: quarantine the row, continue, publish the count."""
    reasons = {
        row["dataset"]: row["n"]
        for row in fetch_all(
            conn, "SELECT dataset, count(*) AS n FROM core.quarantine GROUP BY dataset"
        )
    }
    assert reasons.get("tmi", 0) > 0
    # And the rows are still in raw, because raw keeps everything.
    assert scalar(conn, "SELECT count(*) FROM raw.record WHERE dataset = 'tmi'") == 46302


def test_withheld_columns_never_reached_core(conn) -> None:
    """§5.1/§5.3: the thick content stops at raw, mechanically.

    The bibliographies are *present* in raw — a reviewer resolving the renewal
    question needs to see them — and absent from every published surface.
    """
    assert scalar(
        conn,
        "SELECT count(*) FROM raw.record WHERE dataset = 'tmi' "
        "AND data ->> 'bibliographies' <> ''",
    ) > 0
    if _published(conn):
        columns = fetch_all(
            conn,
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = 'publish' AND table_name = 'motif'",
        )
        names = {c["column_name"] for c in columns}
        assert "bibliographies" not in names


def test_source_and_display_labels_are_both_kept(conn) -> None:
    """§6.5/§3.9: preserve the record unaltered *and* do not serve slurs."""
    row = fetch_one(
        conn,
        """
        SELECT sl.text AS source_label, dl.text AS display_label,
               m.preferred_label_id = dl.label_id AS prefers_display
          FROM core.motif m
          JOIN core.motif_label sl ON sl.motif_id = m.motif_id
                                  AND sl.label_kind = 'source_label'
          JOIN core.motif_label dl ON dl.motif_id = m.motif_id
                                  AND dl.label_kind = 'display_label'
         WHERE m.code_canonical = 'D672'
        """,
    )
    assert row is not None
    assert row["source_label"].startswith("D672.")
    assert not row["display_label"].startswith("D672.")
    # The pointer names the safe one, so the API default is safe by construction.
    assert row["prefers_display"] is True


def test_content_advisories_attach_to_subtrees(conn) -> None:
    if not _published(conn):
        pytest.skip("nothing published")
    flagged = scalar(
        conn, "SELECT count(*) FROM publish.motif WHERE content_advisory IS NOT NULL"
    )
    assert flagged > 0


# -- Phase 2: tale-type identity --------------------------------------------

def test_concepts_carry_no_attributes_in_practice(conn) -> None:
    row = fetch_one(conn, "SELECT * FROM core.tale_type_concept LIMIT 1")
    assert set(row) == {"concept_id", "minted_at", "notes"}


def test_two_sources_attest_the_same_record(conn) -> None:
    """§6.1: two witnesses to one edition's record, not two records."""
    row = fetch_one(
        conn,
        """
        SELECT r.code_canonical, count(DISTINCT s.key) AS sources
          FROM core.tale_type_record r
          JOIN core.tale_type_attestation a USING (record_id)
          JOIN core.source_version v ON v.source_version_id = a.source_version_id
          JOIN core.source s ON s.source_id = v.source_id
         GROUP BY r.code_canonical
        HAVING count(DISTINCT s.key) > 1
         LIMIT 1
        """,
    )
    assert row is not None, "no record is attested by more than one source"


def test_the_api_can_show_two_sources_disagreeing_about_one_title(conn) -> None:
    """**Phase 2's exit criterion.**

    Each title cited, neither overwritten. This is the single most important
    architectural test in the project (§7) and the one the original proposal's
    acceptance list omitted.
    """
    row = fetch_one(
        conn,
        """
        SELECT r.code_canonical,
               count(*) AS titles,
               count(DISTINCT lower(n.text)) AS distinct_titles,
               count(DISTINCT s.key) AS sources
          FROM core.tale_type_record r
          JOIN core.tale_type_name n USING (record_id)
          JOIN core.source_version v ON v.source_version_id = n.source_version_id
          JOIN core.source s ON s.source_id = v.source_id
         WHERE n.language_code = 'en'
         GROUP BY r.code_canonical
        HAVING count(DISTINCT lower(n.text)) > 1 AND count(DISTINCT s.key) > 1
         LIMIT 1
        """,
    )
    assert row is not None, "no record holds two sources disagreeing about a title"
    assert row["sources"] >= 2
    assert row["distinct_titles"] >= 2


def test_title_disagreements_are_routed_to_review_not_resolved(conn) -> None:
    """Never auto-merge. A human decides which title the pointer names."""
    n = scalar(
        conn,
        "SELECT count(*) FROM core.review_queue "
        "WHERE reason = 'sources disagree about the English title'",
    )
    assert n > 100


def test_the_preferred_title_is_a_pointer_to_a_sourced_row(conn) -> None:
    """§6.2: "why this title?" resolves to a citation, not to a scalar column."""
    row = fetch_one(
        conn,
        """
        SELECT n.text, n.source_locator, s.key AS source
          FROM core.tale_type_record r
          JOIN core.tale_type_name n ON n.name_id = r.preferred_name_id
          JOIN core.source_version v ON v.source_version_id = n.source_version_id
          JOIN core.source s ON s.source_id = v.source_id
         WHERE r.code_canonical = '510A'
        """,
    )
    assert row is not None
    assert row["source"] and row["source_locator"]


def test_ranges_and_compounds_never_became_records(conn) -> None:
    """A range is *about* types; giving it a record would invent an entity."""
    assert (
        scalar(
            conn,
            "SELECT count(*) FROM core.tale_type_record WHERE code_kind <> 'single'",
        )
        == 0
    )


# -- Phase 3: edges and lineage ---------------------------------------------

def test_every_atu_seq_edge_is_marked_inferred(conn) -> None:
    """§5.2: Uther largely does not assert narrative ordering.

    Storing that order as a stated fact is exactly the laundering §3.7
    describes, so there is no way for one of these rows to claim otherwise.
    """
    stated = scalar(
        conn,
        """
        SELECT count(*) FROM core.tale_type_motif m
          JOIN core.source_version v USING (source_version_id)
         WHERE v.dataset = 'atu_seq' AND m.derivation <> 'inferred'
        """,
    )
    assert stated == 0
    assert scalar(conn, "SELECT count(*) FROM core.tale_type_motif") > 500_000


def test_edge_evidence_is_marked_inferred_from(conn) -> None:
    kinds = fetch_all(
        conn,
        "SELECT DISTINCT evidence_kind::text AS k FROM core.assertion_evidence "
        "WHERE subject_table = 'core.tale_type_motif'",
    )
    assert [k["k"] for k in kinds] == ["inferred_from"]


def test_a_citation_renders_the_whole_chain(conn) -> None:
    """**Phase 3's exit criterion.**

    A citation that terminates at the convenient dataset misrepresents where the
    knowledge came from (§3.7). trilogy transcribed Uther, who revised
    Aarne-Thompson, and the chain has to say so.
    """
    if not _published(conn):
        pytest.skip("nothing published")
    row = fetch_one(
        conn,
        "SELECT chain FROM publish.lineage WHERE source_version = 'trilogy/atu_seq'",
    )
    assert row is not None
    assert row["chain"] == ["trilogy/atu_seq", "ATU-2004", "AT-1961"]


def test_bibliographic_ancestors_have_no_artifact(conn) -> None:
    """We cite the printed volumes; we never hold them (§5.3)."""
    rows = fetch_all(
        conn,
        "SELECT version_label, artifact_id FROM core.source_version "
        "WHERE kind = 'bibliographic'",
    )
    assert {r["version_label"] for r in rows} >= {"ATU-2004", "AT-1961", "TMI-1955-1958"}
    assert all(r["artifact_id"] is None for r in rows)


# -- publish -----------------------------------------------------------------

def test_share_alike_is_contagious_in_the_published_data(conn) -> None:
    """Acceptance criterion #12, computed over the real contribution sets.

    A tale type whose titles come from CC0 Wikidata *and* CC-BY-SA trilogy is
    CC-BY-SA. Computing per source independently would have got this wrong.
    """
    if not _published(conn):
        pytest.skip("nothing published")
    row = fetch_one(
        conn,
        "SELECT spdx, share_alike_required, contributing_sources "
        "FROM publish.tale_type WHERE code = '510A'",
    )
    assert row is not None
    assert set(row["contributing_sources"]) >= {
        "wikidata_p2540:identity",
        "trilogy:thin_facts",
    }
    assert row["spdx"] == "CC-BY-SA-4.0"
    assert row["share_alike_required"] is True


def test_assertion_is_a_derived_projection(conn) -> None:
    """§6.2: it cannot disagree with the typed tables, because it *is* them."""
    if not _published(conn):
        pytest.skip("nothing published")
    kind = scalar(
        conn,
        "SELECT table_type FROM information_schema.tables "
        "WHERE table_schema = 'publish' AND table_name = 'assertion'",
    )
    assert kind == "VIEW"
    assert scalar(conn, "SELECT count(*) FROM publish.assertion") > 500_000


def test_only_one_build_is_live(conn) -> None:
    if not _published(conn):
        pytest.skip("nothing published")
    assert scalar(conn, "SELECT count(*) FROM core.publish_build WHERE is_live") == 1
