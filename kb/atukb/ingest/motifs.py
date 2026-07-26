"""Normalise the Motif-Index from ``raw`` into ``core`` (assessment §6.6, §6.5).

Three things happen here that the proposal's design did not provide for:

1. **The hierarchy is derived, then checked against the source's own witness.**
   The path comes from the code; the CSV's chapter/division/section columns are
   an independent statement of the same structure. Where they disagree the row
   is quarantined, because there is no basis for preferring either one.
2. **Labels are split into `source_label` and `display_label` (§6.5).** The
   Motif-Index labels material using ethnic and racial terminology of its
   period. Serving it verbatim publishes slurs; editing it falsifies the
   provenance claim. Keeping both, with an advisory, is the only arrangement
   that does neither.
3. **Withheld columns never arrive.** `bibliographies` stays in `raw`; the
   normaliser cannot reach it, because the register decides what it may read.
"""

from __future__ import annotations

import json
import re

import psycopg

from atukb.codes import tmi
from atukb.db import scalar
from atukb.ingest.gates import (
    GateReport,
    gate_canonicalisation_is_idempotent,
    quarantine_row,
    route_to_review,
)
from atukb.rights.register import SourceRights

DATASET = "tmi"

#: Columns of the published CSV, by the names it actually uses.
COL_CODE = "code"
COL_LABEL = "MOTIF"
COL_CHAPTER = "chapter"
COL_DIVISIONS = ("division1", "division2", "division3", 'section ("tens")')

#: A motif label is printed as "D672. Obstacle flight." — the code repeats
#: inside the label text. The display label drops the redundant prefix; the
#: source label keeps it, because that is what the page says.
_LABEL_PREFIX_RE = re.compile(r"^\s*[A-Z]\d+(?:\.\d+)*\.?\s*")


def display_label_for(source_label: str) -> str:
    """Project-authored, safe-to-render label (§6.5).

    Deliberately conservative: it removes the repeated code prefix and collapses
    whitespace, and does nothing else. Rewriting the wording would be silently
    editing a historical document, which is the failure mode §3.9 names.
    """
    text = _LABEL_PREFIX_RE.sub("", source_label or "")
    return re.sub(r"\s+", " ", text).strip()


#: §3.9. The Motif-Index organises material under headings defined by ethnic
#: group in ways that carry the prejudices of the 1930s. These are the subtrees
#: whose *labels* need framing before a consumer sees them; the advisory travels
#: with the data rather than living in a policy document nobody reads.
#:
#: This list is a starting point recorded by a named flagger, not a claim to be
#: exhaustive. Adding to it is a data edit, not a code change.
ADVISORY_SUBTREES: tuple[tuple[str, str, tuple[str, ...]], ...] = (
    (
        "A1600",
        "Origin-of-peoples motifs are organised and worded using period ethnic "
        "and racial categories, including labels no contemporary publication "
        "would reproduce unframed.",
        ("ethnic categorisation", "period racial terminology"),
    ),
    (
        "F500",
        "Motifs for 'remarkable persons' include entries that describe real "
        "peoples and disabled people in the pejorative terms of the period.",
        ("disability", "period racial terminology"),
    ),
    (
        "P200",
        "Motifs about social and family structure encode the compilers' "
        "assumptions about which arrangements are normal.",
        ("period social assumptions",),
    ),
    (
        "T500",
        "Motifs on conception and sexuality include material inappropriate for "
        "general audiences and framed in the terms of the period.",
        ("sexual content",),
    ),
)


def seed_content_advisories(conn: psycopg.Connection, flagged_by: str) -> int:
    """Record the advisories, keyed by ``ltree`` path rather than by bare code.

    ``entity_ref`` has to be the full path — ``A.A1600``, not ``A1600`` — because
    an ltree containment test is a prefix test, and a bare label is not a prefix
    of the path it sits inside. Deriving it with the same parser that built the
    path is what keeps the two from drifting apart.
    """
    seeded = 0
    for code, reason, terms in ADVISORY_SUBTREES:
        path = tmi.parse(code).path
        inserted = scalar(
            conn,
            """
            INSERT INTO core.content_advisory (entity_type, entity_ref, reason,
                                               terms, flagged_by)
            VALUES ('motif_subtree', %s, %s, %s, %s)
            ON CONFLICT (entity_type, entity_ref) DO UPDATE
                SET reason = EXCLUDED.reason, terms = EXCLUDED.terms
            RETURNING advisory_id
            """,
            (path, reason, list(terms), flagged_by),
        )
        seeded += int(inserted is not None)
    return seeded


def normalise(
    conn: psycopg.Connection,
    *,
    source_version_id: int,
    rights: SourceRights,
    report: GateReport,
) -> GateReport:
    """Read ``raw.record`` for the Motif-Index and write ``core.motif``."""
    if not rights.may_ingest_field(DATASET, COL_CODE):
        raise PermissionError(
            f"{rights.key}: the register does not admit {COL_CODE!r} into core"
        )
    field_class = rights.field_class(DATASET, COL_CODE)

    # §6.8: a non-idempotent normaliser corrupts data on every re-run, so the
    # property is checked before the run, not hoped for after it.
    gate_canonicalisation_is_idempotent(
        lambda s: tmi.parse(s).canonical if _parses(s) else s,
        ["A0", "D672", "A1.1.2", "F255.2", " D672 "],
        what="motif code",
    )
    gate_canonicalisation_is_idempotent(
        display_label_for,
        ["D672. Obstacle flight.", "A1. Identity of creator."],
        what="motif display label",
    )

    seen_codes: set[str] = set()
    with conn.cursor(name="tmi_rows") as cur:
        cur.execute(
            "SELECT row_number, data FROM raw.record "
            "WHERE source_version_id = %s AND dataset = %s ORDER BY row_number",
            (source_version_id, DATASET),
        )
        for row in cur:
            report.rows_seen += 1
            data = row["data"]
            locator = f"{DATASET}.csv:{row['row_number']}"
            raw_code = data.get(COL_CODE, "")

            try:
                code = tmi.parse(raw_code)
            except tmi.TmiCodeError as exc:
                quarantine_row(
                    conn,
                    source_version_id=source_version_id,
                    dataset=DATASET,
                    source_locator=locator,
                    reason=str(exc),
                    payload=data,
                    report=report,
                )
                continue

            if code.canonical in seen_codes:
                # 65 codes repeat in the published CSV. Merging them would pick
                # a winner the source never nominated, so the duplicate is
                # quarantined and a curator decides (§3.8, §6.8).
                quarantine_row(
                    conn,
                    source_version_id=source_version_id,
                    dataset=DATASET,
                    source_locator=locator,
                    reason=f"duplicate motif code {code.canonical!r}",
                    payload=data,
                    report=report,
                    reason_class="duplicate_code",
                )
                route_to_review(
                    conn,
                    item_type="motif",
                    item_ref=code.canonical,
                    reason="duplicate code in source",
                    detail={"locator": locator, "label": data.get(COL_LABEL, "")},
                    report=report,
                )
                continue

            disagreements = _hierarchy_disagreements(data, code)
            if disagreements:
                # §6.6's "validate that the materialised hierarchy matches the
                # parse". Neither witness is privileged, so neither is trusted.
                quarantine_row(
                    conn,
                    source_version_id=source_version_id,
                    dataset=DATASET,
                    source_locator=locator,
                    reason=(
                        f"code {code.canonical} falls outside the division "
                        f"heading(s) the source declares: {disagreements}"
                    ),
                    payload=data,
                    report=report,
                    reason_class="hierarchy_mismatch",
                )
                route_to_review(
                    conn,
                    item_type="motif",
                    item_ref=code.canonical,
                    reason="derived hierarchy disagrees with source headings",
                    detail={"locator": locator, "disagreements": disagreements},
                    report=report,
                )
                continue

            seen_codes.add(code.canonical)
            _write_motif(
                conn,
                code=code,
                data=data,
                locator=locator,
                source_version_id=source_version_id,
                field_class=field_class,
            )
            report.rows_normalised += 1

    return report


def _parses(text: str) -> bool:
    try:
        tmi.parse(text)
        return True
    except tmi.TmiCodeError:
        return False


def _hierarchy_disagreements(data: dict, code: tmi.TmiCode) -> list[str]:
    """Which of the source's own headings contradict the derived path?"""
    out: list[str] = []
    for column in (COL_CHAPTER, *COL_DIVISIONS):
        heading = data.get(column) or ""
        if column == COL_CHAPTER:
            letter = heading.strip()[:1]
            if letter and letter != code.chapter:
                out.append(f"{column}={heading.strip()[:24]!r}")
            continue
        verdict = tmi.contains(heading, code)
        if verdict is False:
            out.append(f"{column}={heading.strip()[:24]!r}")
    return out


def _write_motif(
    conn: psycopg.Connection,
    *,
    code: tmi.TmiCode,
    data: dict,
    locator: str,
    source_version_id: int,
    field_class: str,
) -> int:
    motif_id = scalar(
        conn,
        """
        INSERT INTO core.motif (code_raw, code_canonical, path, sort_key, chapter,
                                source_version_id, source_locator, field_class,
                                derivation, review_status)
        VALUES (%s, %s, %s::ltree, %s, %s, %s, %s, %s, 'stated', 'unreviewed')
        ON CONFLICT (code_canonical) DO UPDATE
            SET path = EXCLUDED.path,
                sort_key = EXCLUDED.sort_key,
                source_locator = EXCLUDED.source_locator
        RETURNING motif_id
        """,
        (
            code.raw,
            code.canonical,
            code.path,
            code.sort_key,
            code.chapter,
            source_version_id,
            locator,
            field_class,
        ),
    )

    source_text = (data.get(COL_LABEL) or "").strip()
    display_text = display_label_for(source_text)

    source_label_id = _upsert_label(
        conn,
        motif_id=motif_id,
        kind="source_label",
        text=source_text,
        source_version_id=source_version_id,
        locator=locator,
        field_class=field_class,
        derivation="stated",
    )
    display_label_id = _upsert_label(
        conn,
        motif_id=motif_id,
        kind="display_label",
        text=display_text,
        source_version_id=source_version_id,
        locator=locator,
        field_class=field_class,
        # The display label is project-authored, and says so. §6.5 gives it its
        # own provenance rather than letting it inherit the source's.
        derivation="curated",
    )

    # §6.5: preferred_label is a POINTER to whichever sourced label wins, never
    # a copy. The API's default is the safe one.
    conn.execute(
        "UPDATE core.motif SET preferred_label_id = %s WHERE motif_id = %s",
        (display_label_id or source_label_id, motif_id),
    )

    conn.execute(
        """
        INSERT INTO core.assertion_evidence (subject_table, subject_id,
                                             source_version_id, source_locator,
                                             evidence_kind)
        VALUES ('core.motif', %s, %s, %s, 'transcribed_from')
        ON CONFLICT DO NOTHING
        """,
        (motif_id, source_version_id, locator),
    )
    return motif_id


def _upsert_label(
    conn: psycopg.Connection,
    *,
    motif_id: int,
    kind: str,
    text: str,
    source_version_id: int,
    locator: str,
    field_class: str,
    derivation: str,
) -> int | None:
    if not text:
        return None
    existing = scalar(
        conn,
        "SELECT label_id FROM core.motif_label WHERE motif_id = %s AND label_kind = %s",
        (motif_id, kind),
    )
    if existing is not None:
        conn.execute(
            "UPDATE core.motif_label SET text = %s, source_locator = %s "
            "WHERE label_id = %s",
            (text, locator, existing),
        )
        return existing
    return scalar(
        conn,
        """
        INSERT INTO core.motif_label (motif_id, label_kind, text, language_code,
                                      source_version_id, source_locator,
                                      field_class, derivation, review_status)
        VALUES (%s, %s, %s, 'en', %s, %s, %s, %s, 'unreviewed')
        RETURNING label_id
        """,
        (motif_id, kind, text, source_version_id, locator, field_class, derivation),
    )
