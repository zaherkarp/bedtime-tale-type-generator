"""The ``/v0`` contract rules (assessment §6.9).

These run in-process against the published schema, so they test the same code
path `atukb serve` exposes without needing a server.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from atukb.api.app import app
from atukb.db import connect, scalar

from .conftest import requires_db

pytestmark = requires_db


@pytest.fixture(scope="module")
def client():
    with connect() as conn:
        published = scalar(
            conn,
            "SELECT count(*) FROM information_schema.schemata "
            "WHERE schema_name = 'publish'",
        )
    if not published:
        pytest.skip("nothing published; run `atukb publish`")
    return TestClient(app)


def test_every_response_is_marked_unstable(client) -> None:
    """§6.9 rule 2: /v0 says so in a header, not only in the docs."""
    response = client.get("/v0/health")
    assert response.headers["X-API-Stability"] == "unstable"
    assert "unstable contract" in response.headers["Warning"]


def test_motif_response_embeds_its_provenance(client) -> None:
    """§6.9 rule 1: provenance a consumer can forget to ask for gets dropped."""
    body = client.get("/v0/motifs/D672").json()
    assert body["code"] == "D672"
    for key in ("source", "source_version", "locator", "derivation", "review_status"):
        assert body["provenance"][key], key
    assert body["license"]["spdx"]
    assert body["hierarchy"]["path"] == "D.D600.D672"


def test_the_default_label_is_the_safe_one(client) -> None:
    """§3.9/§6.5: a casual consumer must not be handed a period slur.

    The verbatim label is still available, but only on explicit request and
    with its advisory attached — which is the arrangement that keeps the
    historical record intact *and* the default safe.
    """
    default = client.get("/v0/motifs/A1600").json()
    assert default["label_kind"] == "display_label"
    assert "source_label" not in default
    assert default["content_advisory"]["reason"]

    explicit = client.get("/v0/motifs/A1600", params={"labels": "source"}).json()
    assert explicit["source_label"]["source_label"].startswith("A1600.")
    assert explicit["content_advisory"]["terms"]


def test_subtree_browse_is_a_prefix_match(client) -> None:
    """§6.6: `under` resolves through the same parser that built the paths."""
    body = client.get("/v0/motifs", params={"under": "A1600", "limit": 5}).json()
    assert body["count"] > 0
    assert all(r["path"].startswith("A.A1600") for r in body["results"])


def test_an_unparseable_subtree_is_refused_not_silently_empty(client) -> None:
    assert client.get("/v0/motifs", params={"under": "not-a-code"}).status_code == 400


@pytest.fixture(scope="module")
def disputed_code() -> str:
    """A code the sources actually disagree about, found rather than assumed.

    Which codes disagree is a property of the data, and it moves: tightening the
    Wikidata query to tale-type items settled several of them. Hard-coding one
    tests the fixture, not the architecture.
    """
    with connect() as conn:
        code = scalar(
            conn,
            "SELECT item_ref FROM core.review_queue "
            "WHERE reason = 'sources disagree about the English title' "
            "ORDER BY item_ref LIMIT 1",
        )
    if not code:
        pytest.skip("no title disagreements in the current data")
    return code


def test_tale_type_shows_every_source_disagreeing_about_the_title(
    client, disputed_code: str
) -> None:
    """**Phase 2's exit criterion, through the consumer interface.**"""
    body = client.get(f"/v0/tale-types/{disputed_code}").json()
    assert body["sources_disagree"] is True
    sources = {t["source"] for t in body["titles"]}
    assert {"wikidata_p2540", "trilogy"} <= sources
    english = [t for t in body["titles"] if t["language_code"] == "en"]
    assert len({t["title"] for t in english}) > 1
    # Neither overwritten: both are present, each with its own locator.
    assert all(t["source_locator"] for t in english)
    assert sum(1 for t in body["titles"] if t["is_preferred"]) == 1


def test_inferred_edges_are_visibly_distinguished(client) -> None:
    """Acceptance criterion #13, in the response rather than a footnote."""
    body = client.get("/v0/tale-types/313/motifs", params={"limit": 5}).json()
    assert body["count"] > 0
    assert all(r["derivation"] == "inferred" for r in body["results"])
    assert all(r["evidence_kind"] == "inferred_from" for r in body["results"])
    assert "without narrative order" in body["note"]


def test_a_citation_renders_the_whole_chain(client) -> None:
    """**Phase 3's exit criterion, through the consumer interface.**"""
    body = client.get("/v0/tale-types/313/motifs", params={"limit": 1}).json()
    assert body["lineage"]["trilogy/atu_seq"] == [
        "trilogy/atu_seq",
        "ATU-2004",
        "AT-1961",
    ]


def test_sources_endpoint_publishes_the_open_questions(client) -> None:
    """The unresolved rights questions are served, not buried in a comment."""
    sources = {s["key"]: s for s in client.get("/v0/sources").json()["sources"]}
    assert sources["wikidata_p2540"]["upstream_rights_status"] == "clear"
    assert sources["trilogy"]["upstream_rights_status"] == "unresolved"
    assert len(sources["trilogy"]["open_questions"]) >= 3
    assert sources["tmi_mellmann"]["database_right_status"] == "unresolved"
    assert any(
        "renew" in q.lower() for q in sources["tmi_mellmann"]["open_questions"]
    )


def test_attribution_is_machine_readable(client) -> None:
    """Acceptance criterion #10."""
    body = client.get("/v0/attribution", params={"for": "1"}).json()
    assert body["spdx"] == "CC-BY-SA-4.0"
    assert body["share_alike_required"] is True
    assert any("trilogy" in a for a in body["attribution"])


def test_export_is_ndjson_and_only_from_the_allow_list(client) -> None:
    """§6.9 rule 3: a consumer cannot request restricted fields into existence."""
    ok = client.get("/v0/export/sources.jsonl")
    assert ok.status_code == 200
    assert ok.headers["content-type"].startswith("application/x-ndjson")
    assert client.get("/v0/export/raw.jsonl").status_code == 404
    assert client.get("/v0/export/motif_source_label.jsonl").status_code == 404


def test_unknown_identifiers_are_404_not_empty_success(client) -> None:
    assert client.get("/v0/motifs/ZZ9999").status_code == 404
    assert client.get("/v0/tale-types/999999").status_code == 404
    assert client.get("/v0/concepts/999999").status_code == 404
