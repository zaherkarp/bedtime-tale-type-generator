"""The ``/v0`` read API (assessment §6.9).

Three contract rules, each carrying a finding from the assessment:

1. **Every value-bearing response embeds its provenance** — source,
   source_version, locator, derivation, review_status. Not on a separate
   endpoint, not opt-in. Provenance a consumer can forget to ask for is
   provenance that will be dropped (§6.9 rule 1).
2. **``/v0/`` is explicitly unstable**, and says so in a response header. The API
   ships early because it is the only reliable test of whether the model can
   answer the questions it was built for — but an unstable marker is not a
   promise (§6.9 rule 2, §8).
3. **Exports are license-filtered server-side.** Every endpoint reads from
   ``publish``, never from ``core`` (§6.9 rule 3).

The label default is the safe one: ``display_label`` unless ``?labels=source`` is
asked for explicitly, and the content advisory travels with either (§6.5).
"""

from __future__ import annotations

from typing import Any, Literal

from fastapi import FastAPI, HTTPException, Query, Request, Response

from atukb.codes import tmi
from atukb.db import connect, fetch_all, fetch_one

app = FastAPI(
    title="ATU folklore knowledge base",
    version="0.1.0",
    description=(
        "Tale types and motifs with field-level provenance. /v0 is unstable: "
        "the model is still being reconciled and the contract may change "
        "without notice."
    ),
)


@app.middleware("http")
async def mark_unstable(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-API-Stability"] = "unstable"
    response.headers["Warning"] = (
        '299 - "/v0 is an unstable contract; do not depend on it in production"'
    )
    return response


def _publish_exists() -> bool:
    with connect() as conn:
        return bool(
            fetch_one(
                conn,
                "SELECT 1 AS ok FROM information_schema.schemata "
                "WHERE schema_name = 'publish'",
            )
        )


def _require_publish() -> None:
    if not _publish_exists():
        raise HTTPException(
            status_code=503,
            detail="no published dataset yet; run `atukb publish`",
        )


# ---------------------------------------------------------------------------
# Motifs
# ---------------------------------------------------------------------------

@app.get("/v0/motifs/{code}")
def get_motif(
    code: str,
    labels: Literal["display", "source"] = Query(
        "display",
        description=(
            "The Motif-Index labels material in the terminology of the 1930s. "
            "'display' is project-authored and safe to render; 'source' is "
            "verbatim and is returned only on explicit request, with its "
            "advisory attached."
        ),
    ),
) -> dict[str, Any]:
    _require_publish()
    with connect() as conn:
        motif = fetch_one(conn, "SELECT * FROM publish.motif WHERE code = %s", (code,))
        if motif is None:
            raise HTTPException(status_code=404, detail=f"no motif {code!r}")
        ancestors = fetch_all(
            conn,
            "SELECT code, display_label FROM publish.motif "
            "WHERE text2ltree(path) @> text2ltree(%s) AND code <> %s "
            "ORDER BY sort_key",
            (motif["path"], code),
        )
        children = fetch_all(
            conn,
            "SELECT code, display_label FROM publish.motif "
            "WHERE text2ltree(path) ~ %s ORDER BY sort_key LIMIT 200",
            (f"{motif['path']}.*{{1}}",),
        )
        payload = _motif_payload(motif, ancestors, children)
        if labels == "source":
            payload["source_label"] = fetch_one(
                conn,
                "SELECT source_label, language_code, source, source_locator "
                "FROM publish.motif_source_label WHERE code = %s",
                (code,),
            )
        payload["lineage"] = _lineage(conn, motif["source_version"])
    return payload


def _motif_payload(motif: dict, ancestors: list[dict], children: list[dict]) -> dict:
    return {
        "code": motif["code"],
        "label": motif["display_label"],
        "label_kind": "display_label",
        "hierarchy": {
            "path": motif["path"],
            "depth": motif["depth"],
            "chapter": motif["chapter"],
            "ancestors": ancestors,
            "children": children,
        },
        "content_advisory": (
            {"reason": motif["content_advisory"], "terms": motif["content_advisory_terms"]}
            if motif["content_advisory"]
            else None
        ),
        # Rule 1: provenance is embedded, never a separate lookup.
        "provenance": {
            "source": motif["source"],
            "source_version": motif["source_version"],
            "locator": motif["source_locator"],
            "derivation": motif["derivation"],
            "review_status": motif["review_status"],
        },
        "license": {
            "spdx": motif["spdx"],
            "attribution": motif["attribution"],
            "share_alike_required": motif["share_alike_required"],
            "contributing_sources": motif["contributing_sources"],
        },
    }


@app.get("/v0/motifs")
def search_motifs(
    q: str | None = None,
    under: str | None = Query(
        None, description="an ltree prefix, e.g. D600 — a subtree browse"
    ),
    lang: str = "en",
    limit: int = Query(50, le=500),
) -> dict[str, Any]:
    _require_publish()
    clauses = ["language_code = %s"]
    params: list[Any] = [lang]
    if under:
        # The whole point of deriving the hierarchy from the code: this is an
        # index scan over data that cannot contradict its own identifiers.
        clauses.append("text2ltree(path) <@ text2ltree(%s)")
        params.append(_subtree_prefix(under))
    if q:
        clauses.append("(unaccent(display_label) ILIKE unaccent(%s) OR code ILIKE %s)")
        params.extend([f"%{q}%", f"{q}%"])
    params.append(limit)
    with connect() as conn:
        rows = fetch_all(
            conn,
            f"SELECT code, display_label, path, derivation, review_status, source, "  # noqa: S608
            f"content_advisory FROM publish.motif WHERE {' AND '.join(clauses)} "
            f"ORDER BY sort_key LIMIT %s",
            params,
        )
    return {"count": len(rows), "results": rows}


def _subtree_prefix(under: str) -> str:
    """Resolve ``?under=`` to a full ``ltree`` prefix.

    An ltree containment test is a prefix test, so ``A1600`` on its own matches
    nothing — the path is ``A.A1600``. Resolving the argument through the same
    parser that built the paths is what keeps the query surface and the stored
    hierarchy from drifting apart.
    """
    text = under.strip()
    if len(text) == 1 and text in tmi.TMI_CHAPTERS:
        return text
    try:
        return tmi.parse(text).path
    except tmi.TmiCodeError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"`under` must be a Motif-Index code or chapter letter: {exc}",
        ) from None


# ---------------------------------------------------------------------------
# Tale types
# ---------------------------------------------------------------------------

@app.get("/v0/tale-types/{code}")
def get_tale_type(code: str, edition: str | None = None) -> dict[str, Any]:
    """One edition's record, with *every* source's title, each cited.

    This endpoint is the assessment's Phase 2 exit criterion: two sources
    disagreeing about one title, each cited, neither overwritten.
    """
    _require_publish()
    with connect() as conn:
        record = fetch_one(
            conn,
            "SELECT * FROM publish.tale_type WHERE code = %s "
            "AND (%s::text IS NULL OR edition = %s::text) ORDER BY edition LIMIT 1",
            (code, edition, edition),
        )
        if record is None:
            raise HTTPException(status_code=404, detail=f"no tale type {code!r}")
        names = fetch_all(
            conn,
            "SELECT title, language_code, source, source_version, source_locator, "
            "derivation, review_status, is_preferred FROM publish.tale_type_name "
            "WHERE record_id = %s ORDER BY is_preferred DESC, language_code, source",
            (record["record_id"],),
        )
        siblings = fetch_all(
            conn,
            "SELECT code, edition, preferred_title FROM publish.tale_type "
            "WHERE concept_id = %s AND record_id <> %s ORDER BY edition",
            (record["concept_id"], record["record_id"]),
        )
        return {
            "code": record["code"],
            "code_raw": record["code_raw"],
            "edition": record["edition"],
            "division": record["division"],
            "concept_id": record["concept_id"],
            "preferred_title": {
                "text": record["preferred_title"],
                "language": record["preferred_title_language"],
                "source": record["preferred_title_source"],
            },
            # Every title from every witness. Nothing is overwritten, and
            # "which source supports this title?" is answerable here rather
            # than lost to a scalar canonical_title (§6.2, §3.2).
            "titles": names,
            "sources_disagree": len({n["title"].casefold() for n in names if n["language_code"] == "en"}) > 1,
            "other_editions": siblings,
            "provenance": {
                "derivation": record["derivation"],
                "review_status": record["review_status"],
                "contributing_sources": record["contributing_sources"],
            },
            "license": {
                "spdx": record["spdx"],
                "attribution": record["attribution"],
                "share_alike_required": record["share_alike_required"],
            },
        }


@app.get("/v0/tale-types")
def search_tale_types(
    q: str | None = None,
    category: str | None = None,
    edition: str | None = None,
    limit: int = Query(50, le=500),
) -> dict[str, Any]:
    _require_publish()
    clauses: list[str] = ["1=1"]
    params: list[Any] = []
    if edition:
        clauses.append("edition = %s")
        params.append(edition)
    if category:
        clauses.append("division = %s")
        params.append(category)
    if q:
        clauses.append(
            "(unaccent(coalesce(preferred_title, '')) ILIKE unaccent(%s) OR code ILIKE %s)"
        )
        params.extend([f"%{q}%", f"{q}%"])
    params.append(limit)
    with connect() as conn:
        rows = fetch_all(
            conn,
            f"SELECT code, edition, division, preferred_title, preferred_title_source, "  # noqa: S608
            f"spdx, review_status FROM publish.tale_type WHERE {' AND '.join(clauses)} "
            f"ORDER BY code_sort_key LIMIT %s",
            params,
        )
    return {"count": len(rows), "results": rows}


@app.get("/v0/tale-types/{code}/motifs")
def get_tale_type_motifs(
    code: str,
    derivation: str | None = None,
    review_status: str | None = None,
    limit: int = Query(200, le=2000),
) -> dict[str, Any]:
    _require_publish()
    clauses = ["tale_type_code = %s"]
    params: list[Any] = [code]
    if derivation:
        clauses.append("derivation = %s")
        params.append(derivation)
    if review_status:
        clauses.append("review_status = %s")
        params.append(review_status)
    params.append(limit)
    with connect() as conn:
        rows = fetch_all(
            conn,
            f"SELECT motif_code, motif_label, tale_variant, sequence_position, "  # noqa: S608
            f"derivation, review_status, evidence_kind, source, source_version, "
            f"source_locator FROM publish.tale_type_motif "
            f"WHERE {' AND '.join(clauses)} "
            f"ORDER BY tale_variant, sequence_position LIMIT %s",
            params,
        )
        lineages = {
            version: _lineage(conn, version)
            for version in {r["source_version"] for r in rows}
        }
    return {
        "tale_type": code,
        "count": len(rows),
        # Criterion #13: inferred content is visibly distinguished, in the
        # response, not in a footnote.
        "note": (
            "Rows with derivation='inferred' encode an ordering the underlying "
            "authority may not assert; Uther lists motifs per type largely "
            "without narrative order."
        ),
        "results": rows,
        "lineage": lineages,
    }


@app.get("/v0/tale-types/{code}/concordance")
def get_concordance(code: str) -> dict[str, Any]:
    """The edition history of this concept — edge-level, each edge sourced."""
    _require_publish()
    with connect() as conn:
        rows = fetch_all(
            conn,
            "SELECT * FROM publish.concordance WHERE from_code = %s OR to_code = %s "
            "ORDER BY from_edition, from_code",
            (code, code),
        )
    return {"tale_type": code, "count": len(rows), "results": rows}


@app.get("/v0/concepts/{concept_id}")
def get_concept(concept_id: int) -> dict[str, Any]:
    """Every edition record for one concept.

    The concept itself has no attributes to return, deliberately: it is an
    identity, not a merged summary (§6.1).
    """
    _require_publish()
    with connect() as conn:
        rows = fetch_all(
            conn,
            "SELECT record_id, edition, code, preferred_title, preferred_title_source "
            "FROM publish.tale_type WHERE concept_id = %s ORDER BY edition, code",
            (concept_id,),
        )
    if not rows:
        raise HTTPException(status_code=404, detail=f"no concept {concept_id}")
    return {"concept_id": concept_id, "records": rows}


# ---------------------------------------------------------------------------
# The register, attribution and lineage
# ---------------------------------------------------------------------------

@app.get("/v0/sources")
def get_sources() -> dict[str, Any]:
    """The rights register, as data — including what is still unresolved."""
    _require_publish()
    with connect() as conn:
        return {"sources": fetch_all(conn, "SELECT * FROM publish.source ORDER BY key")}


@app.get("/v0/attribution")
def get_attribution(for_: str | None = Query(None, alias="for")) -> dict[str, Any]:
    _require_publish()
    with connect() as conn:
        if for_:
            row = fetch_one(
                conn,
                "SELECT attribution, spdx, share_alike_required, contributing_sources "
                "FROM publish.tale_type WHERE code = %s LIMIT 1",
                (for_,),
            ) or fetch_one(
                conn,
                "SELECT attribution, spdx, share_alike_required, contributing_sources "
                "FROM publish.motif WHERE code = %s",
                (for_,),
            )
            if row is None:
                raise HTTPException(status_code=404, detail=f"nothing published for {for_!r}")
            return {"for": for_, **row}
        return {
            "attribution": [r["text"] for r in fetch_all(conn, "SELECT * FROM publish.attribution")],
            "sources": fetch_all(
                conn,
                "SELECT key, license_reviewed_spdx, attribution_text_required, "
                "open_questions FROM publish.source ORDER BY key",
            ),
        }


def _lineage(conn, source_version: str | None) -> list[str] | None:
    """The full derivational chain behind a source version (§3.7)."""
    if not source_version:
        return None
    row = fetch_one(
        conn, "SELECT chain FROM publish.lineage WHERE source_version = %s", (source_version,)
    )
    return row["chain"] if row else None


@app.get("/v0/export/{entity}.jsonl")
def export(entity: str) -> Response:
    """License-filtered bulk export. Reads ``publish``, never ``core``."""
    from atukb.publish.export import EXPORTABLE

    _require_publish()
    if entity not in EXPORTABLE:
        raise HTTPException(
            status_code=404,
            detail=f"unknown entity {entity!r}; try one of {sorted(EXPORTABLE)}",
        )
    import json

    with connect() as conn:
        rows = fetch_all(conn, f"SELECT * FROM {EXPORTABLE[entity]}")  # noqa: S608
    body = "\n".join(json.dumps(r, default=str, ensure_ascii=False) for r in rows)
    return Response(content=body + "\n", media_type="application/x-ndjson")


@app.get("/v0/health")
def health() -> dict[str, Any]:
    with connect() as conn:
        build = fetch_one(
            conn,
            "SELECT schema_name, built_at, status FROM core.publish_build "
            "WHERE is_live ORDER BY build_id DESC LIMIT 1",
        )
    return {"published": build is not None, "live_build": build}
