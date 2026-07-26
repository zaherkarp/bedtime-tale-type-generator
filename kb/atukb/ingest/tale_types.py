"""Tale-type identity, and the type<->motif edges (assessment §6.1, §5.2).

The shape here is the answer to the proposal's own question — *stable entities or
edition-bound records?* — which is **both, in two layers, and the layers must not
share columns**:

* ``core.tale_type_record`` is what one edition says. ATU-2004 has a record for
  ``510A``; AT-1961 would have its own. Records are never merged.
* ``core.tale_type_concept`` is project-minted identity, carrying no code, no
  title and no status, because every attribute came from an edition.
* ``core.tale_type_concordance`` carries edge-level change — ``split_into`` and
  friends — each row independently sourced.

Wikidata and trilogy both report the ATU-2004 edition. They are two *witnesses*
to one edition's record, not two records, so their disagreements live where
disagreements belong: in the multi-valued name table, one sourced row each,
neither overwriting the other. When they disagree the conflict is routed to the
review queue rather than resolved by whoever ran last.
"""

from __future__ import annotations

import io
from collections import defaultdict

import psycopg

from atukb.codes import atu, tmi
from atukb.db import fetch_all, scalar
from atukb.ingest.gates import (
    GateReport,
    gate_resolution_is_stable,
    quarantine_row,
    route_to_review,
)
from atukb.rights.register import SourceRights

#: Every source here is a witness to Uther's 2004 edition. The edition is a
#: property of the classification; the source is a property of how we heard
#: about it. Conflating the two is what §6.1 is about.
ATU_EDITION = "ATU-2004"

#: Preference order for choosing which sourced label a record's
#: ``preferred_name_id`` points at. English first because the app and the API
#: default to it; the pointer is a curated choice and is recorded as such.
LANGUAGE_PREFERENCE = ("en", "de", "fr", "es", "it", "ru", "fi", "sv", "und")


def ensure_edition(
    conn: psycopg.Connection, label: str, source_version_id: int, year: int | None
) -> int:
    return scalar(
        conn,
        """
        INSERT INTO core.edition (label, source_version_id, publication_year)
        VALUES (%s, %s, %s)
        ON CONFLICT (label) DO UPDATE SET publication_year = EXCLUDED.publication_year
        RETURNING edition_id
        """,
        (label, source_version_id, year),
    )


def _atu_edition_id(conn: psycopg.Connection) -> int:
    version_id = scalar(
        conn,
        "SELECT source_version_id FROM core.source_version WHERE version_label = %s",
        (ATU_EDITION,),
    )
    return ensure_edition(conn, ATU_EDITION, version_id, 2004)


def _upsert_record(
    conn: psycopg.Connection,
    *,
    edition_id: int,
    code: atu.AtuCode,
    source_version_id: int,
    locator: str,
    field_class: str,
) -> int:
    """Create the edition's record for this code, or return the existing one.

    ``source_version_id`` on the record names the first witness; every witness,
    including that one, also gets an attestation row, so nothing about "who says
    this exists" depends on insertion order.
    """
    record_id = scalar(
        conn,
        """
        INSERT INTO core.tale_type_record (edition_id, code_raw, code_canonical,
                                           code_sort_key, code_kind, division,
                                           source_version_id, source_locator,
                                           field_class, derivation, review_status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'stated', 'unreviewed')
        ON CONFLICT (edition_id, code_raw) DO UPDATE
            SET code_canonical = EXCLUDED.code_canonical
        RETURNING record_id
        """,
        (
            edition_id,
            code.raw,
            code.canonical,
            code.sort_key,
            code.kind,
            atu.division(code),
            source_version_id,
            locator,
            field_class,
        ),
    )
    conn.execute(
        """
        INSERT INTO core.tale_type_attestation (record_id, source_version_id,
                                                source_locator, field_class,
                                                derivation, review_status)
        VALUES (%s, %s, %s, %s, 'stated', 'unreviewed')
        ON CONFLICT (record_id, source_version_id) DO NOTHING
        """,
        (record_id, source_version_id, locator, field_class),
    )
    return record_id


def _add_name(
    conn: psycopg.Connection,
    *,
    record_id: int,
    text: str,
    language_code: str,
    source_version_id: int,
    locator: str,
    field_class: str,
) -> int | None:
    if not text.strip():
        return None
    existing = scalar(
        conn,
        """
        SELECT name_id FROM core.tale_type_name
         WHERE record_id = %s AND source_version_id = %s AND language_code = %s
        """,
        (record_id, source_version_id, language_code),
    )
    if existing is not None:
        conn.execute(
            "UPDATE core.tale_type_name SET text = %s, source_locator = %s "
            "WHERE name_id = %s",
            (text.strip(), locator, existing),
        )
        return existing
    name_id = scalar(
        conn,
        """
        INSERT INTO core.tale_type_name (record_id, label_kind, text, language_code,
                                         source_version_id, source_locator,
                                         field_class, derivation, review_status)
        VALUES (%s, 'source_label', %s, %s, %s, %s, %s, 'stated', 'unreviewed')
        RETURNING name_id
        """,
        (record_id, text.strip(), language_code, source_version_id, locator, field_class),
    )
    conn.execute(
        """
        INSERT INTO core.assertion_evidence (subject_table, subject_id,
                                             source_version_id, source_locator,
                                             evidence_kind)
        VALUES ('core.tale_type_name', %s, %s, %s, 'transcribed_from')
        ON CONFLICT DO NOTHING
        """,
        (name_id, source_version_id, locator),
    )
    return name_id


def _refresh_preferred_name(conn: psycopg.Connection, record_id: int) -> None:
    """Point ``preferred_name_id`` at the best sourced label (§6.2, §6.5).

    A pointer, never a copy: "why this title?" resolves to a citation. The
    ordering prefers a CC0 witness over a share-alike one so that a record's
    display title does not gratuitously make the whole record share-alike.
    """
    candidates = fetch_all(
        conn,
        """
        SELECT n.name_id, n.language_code, s.key AS source_key
          FROM core.tale_type_name n
          JOIN core.source_version v ON v.source_version_id = n.source_version_id
          JOIN core.source s ON s.source_id = v.source_id
         WHERE n.record_id = %s AND n.label_kind = 'source_label'
        """,
        (record_id,),
    )
    if not candidates:
        return
    cc0_first = {"wikidata_p2540": 0}

    def rank(row: dict) -> tuple[int, int, int]:
        language = row["language_code"] or "und"
        lang_rank = (
            LANGUAGE_PREFERENCE.index(language)
            if language in LANGUAGE_PREFERENCE
            else len(LANGUAGE_PREFERENCE)
        )
        # name_id breaks remaining ties, so the pointer is a function of the
        # data rather than of the order rows came back in. Without it, two runs
        # over identical input could name different titles, which would make the
        # idempotency property quietly false.
        return (lang_rank, cc0_first.get(row["source_key"], 1), row["name_id"])

    best = min(candidates, key=rank)
    conn.execute(
        "UPDATE core.tale_type_record SET preferred_name_id = %s WHERE record_id = %s",
        (best["name_id"], record_id),
    )


def _mint_concept(conn: psycopg.Connection, record_id: int, note: str) -> int:
    """Give a record an identity, if it does not already have one.

    The concept carries no code, no title and no status. That emptiness is the
    point: a concept is an identity, not a merged summary (§6.1).

    Resolution today is trivial — one record, one concept — so the stability
    gate below can never fire. It is wired in anyway, because the moment
    resolution grows the ability to match records *across* editions into one
    concept, an unstable match is how identity silently drifts between runs
    (§6.8), and a gate added after that point is a gate added after the damage.
    """
    existing = scalar(
        conn,
        "SELECT concept_id FROM core.tale_type_record WHERE record_id = %s",
        (record_id,),
    )
    if existing is not None:
        gate_resolution_is_stable(conn, record_id, existing)
        return existing
    concept_id = scalar(
        conn,
        "INSERT INTO core.tale_type_concept (notes) VALUES (%s) RETURNING concept_id",
        (note,),
    )
    gate_resolution_is_stable(conn, record_id, concept_id)
    conn.execute(
        "UPDATE core.tale_type_record SET concept_id = %s WHERE record_id = %s",
        (concept_id, record_id),
    )
    return concept_id


# ---------------------------------------------------------------------------
# Wikidata P2540 — the CC0 spine (§5.4)
# ---------------------------------------------------------------------------

def normalise_wikidata(
    conn: psycopg.Connection,
    *,
    source_version_id: int,
    rights: SourceRights,
    report: GateReport,
) -> GateReport:
    dataset = "p2540"
    field_class = rights.field_class(dataset, "atu_code") or "identity"
    edition_id = _atu_edition_id(conn)

    by_code: dict[str, list[dict]] = defaultdict(list)
    rows = fetch_all(
        conn,
        "SELECT row_number, data FROM raw.record "
        "WHERE source_version_id = %s AND dataset = %s ORDER BY row_number",
        (source_version_id, dataset),
    )
    for row in rows:
        report.rows_seen += 1
        by_code[row["data"].get("atu", "")].append(row)

    touched: set[int] = set()
    for raw_code, entries in by_code.items():
        locator = f"{dataset}:{entries[0]['row_number']}"
        try:
            code = atu.parse(raw_code)
        except atu.AtuCodeError as exc:
            for entry in entries:
                quarantine_row(
                    conn,
                    source_version_id=source_version_id,
                    dataset=dataset,
                    source_locator=f"{dataset}:{entry['row_number']}",
                    reason=str(exc),
                    payload=entry["data"],
                    report=report,
                )
            route_to_review(
                conn,
                item_type="tale_type_code",
                item_ref=raw_code,
                reason="unparseable ATU code in source",
                detail={"source": "wikidata_p2540", "error": str(exc)},
                report=report,
            )
            continue

        if not code.is_citable_type:
            # A range or a compound is *about* types; it is not a type, and
            # giving it a record would invent an entity no edition asserts.
            quarantine_row(
                conn,
                source_version_id=source_version_id,
                dataset=dataset,
                source_locator=locator,
                reason=f"{code.canonical} is a {code.kind}, not a single tale type",
                payload=entries[0]["data"],
                report=report,
                reason_class="not_a_single_type",
            )
            continue

        record_id = _upsert_record(
            conn,
            edition_id=edition_id,
            code=code,
            source_version_id=source_version_id,
            locator=locator,
            field_class=field_class,
        )
        _mint_concept(conn, record_id, "minted from Wikidata P2540 (CC0)")
        for entry in entries:
            _add_name(
                conn,
                record_id=record_id,
                text=entry["data"].get("label", ""),
                language_code=entry["data"].get("lang", "und"),
                source_version_id=source_version_id,
                locator=f"{dataset}:{entry['row_number']}",
                field_class=field_class,
            )
        touched.add(record_id)
        report.rows_normalised += 1

    for record_id in touched:
        _refresh_preferred_name(conn, record_id)
    return report


# ---------------------------------------------------------------------------
# trilogy/atu_df — the deliberately conflicting second source (§7)
# ---------------------------------------------------------------------------

def normalise_trilogy(
    conn: psycopg.Connection,
    *,
    source_version_id: int,
    rights: SourceRights,
    report: GateReport,
) -> GateReport:
    """Ingest trilogy's tale-type rows on top of the Wikidata spine.

    Ingesting both is the deliberate centrepiece of the reduced MVP: a
    provenance architecture that has never held two sources disagreeing about
    one title has not been tested at all, it has only been described (§7).
    """
    dataset = "atu_df"
    field_class = rights.field_class(dataset, "atu_id") or "thin_facts"
    edition_id = _atu_edition_id(conn)

    rows = fetch_all(
        conn,
        "SELECT row_number, data FROM raw.record "
        "WHERE source_version_id = %s AND dataset = %s ORDER BY row_number",
        (source_version_id, dataset),
    )
    for row in rows:
        report.rows_seen += 1
        data = row["data"]
        locator = f"{dataset}.csv:{row['row_number']}"
        raw_code = (data.get("atu_id") or "").strip()

        try:
            code = atu.parse(raw_code)
        except atu.AtuCodeError as exc:
            quarantine_row(
                conn,
                source_version_id=source_version_id,
                dataset=dataset,
                source_locator=locator,
                reason=str(exc),
                payload=data,
                report=report,
            )
            continue

        if not code.is_citable_type:
            quarantine_row(
                conn,
                source_version_id=source_version_id,
                dataset=dataset,
                source_locator=locator,
                reason=f"{code.canonical} is a {code.kind}, not a single tale type",
                payload=data,
                report=report,
                reason_class="not_a_single_type",
            )
            continue

        record_id = _upsert_record(
            conn,
            edition_id=edition_id,
            code=code,
            source_version_id=source_version_id,
            locator=locator,
            field_class=field_class,
        )
        _mint_concept(conn, record_id, "minted from trilogy/atu_df")

        title = (data.get("tale_name") or "").strip()
        if title:
            _flag_title_conflict(
                conn,
                record_id=record_id,
                code=code.canonical,
                incoming=title,
                report=report,
            )
            _add_name(
                conn,
                record_id=record_id,
                text=title,
                language_code="en",
                source_version_id=source_version_id,
                locator=locator,
                field_class=field_class,
            )
            _refresh_preferred_name(conn, record_id)
        report.rows_normalised += 1

    return report


def _flag_title_conflict(
    conn: psycopg.Connection,
    *,
    record_id: int,
    code: str,
    incoming: str,
    report: GateReport,
) -> None:
    """Route a title disagreement to review. Never auto-merge.

    "Records should not be merged solely because their titles are similar" — and
    the corollary holds too: neither should a title be silently replaced because
    a second source arrived later. Both titles are kept, both are cited, and a
    human decides which one the pointer names.
    """
    others = fetch_all(
        conn,
        """
        SELECT n.text, s.key AS source_key
          FROM core.tale_type_name n
          JOIN core.source_version v ON v.source_version_id = n.source_version_id
          JOIN core.source s ON s.source_id = v.source_id
         WHERE n.record_id = %s AND n.language_code = 'en'
        """,
        (record_id,),
    )
    conflicting = [
        o for o in others if o["text"].casefold().strip() != incoming.casefold().strip()
    ]
    if not conflicting:
        return
    route_to_review(
        conn,
        item_type="tale_type_record",
        item_ref=code,
        reason="sources disagree about the English title",
        detail={
            "incoming": incoming,
            "existing": [{"text": o["text"], "source": o["source_key"]} for o in conflicting],
        },
        report=report,
    )


# ---------------------------------------------------------------------------
# trilogy/atu_seq and atu_combos — the edges (§5.2, Phase 3)
# ---------------------------------------------------------------------------

def _record_index(conn: psycopg.Connection) -> dict[str, int]:
    edition_id = _atu_edition_id(conn)
    return {
        row["code_canonical"]: row["record_id"]
        for row in fetch_all(
            conn,
            "SELECT code_canonical, record_id FROM core.tale_type_record "
            "WHERE edition_id = %s",
            (edition_id,),
        )
    }


def _motif_index(conn: psycopg.Connection) -> dict[str, int]:
    return {
        row["code_canonical"]: row["motif_id"]
        for row in fetch_all(conn, "SELECT code_canonical, motif_id FROM core.motif")
    }


def normalise_type_motif_edges(
    conn: psycopg.Connection,
    *,
    source_version_id: int,
    rights: SourceRights,
    report: GateReport,
) -> GateReport:
    """Load atu_seq as type<->motif edges, every one marked ``inferred``.

    Uther lists motifs per type largely *without* narrative ordering, so a
    ``sequence_position`` column encodes ordering the underlying authority may
    not assert. Storing that as a stated fact is exactly the laundering §3.7
    describes, so the derivation is ``inferred`` and the evidence kind is
    ``inferred_from`` — for every row, with no way to opt out (§5.2).
    """
    dataset = "atu_seq"
    field_class = rights.field_class(dataset, "motif") or "thin_facts"
    records = _record_index(conn)
    motif_ids = _motif_index(conn)

    unknown_types: dict[str, int] = defaultdict(int)
    unknown_motifs: dict[str, int] = defaultdict(int)
    buffer = io.StringIO()
    staged = 0

    with conn.cursor(name="atu_seq_rows") as cur:
        cur.execute(
            "SELECT row_number, data FROM raw.record "
            "WHERE source_version_id = %s AND dataset = %s ORDER BY row_number",
            (source_version_id, dataset),
        )
        for row in cur:
            report.rows_seen += 1
            data = row["data"]
            try:
                code = atu.parse((data.get("atu_id") or "").strip())
                motif_code = tmi.parse((data.get("motif") or "").strip())
            except (atu.AtuCodeError, tmi.TmiCodeError):
                report.quarantined("edge_code_grammar")
                continue

            record_id = records.get(code.canonical)
            motif_id = motif_ids.get(motif_code.canonical)
            if record_id is None:
                unknown_types[code.canonical] += 1
                report.quarantined("edge_unknown_tale_type")
                continue
            if motif_id is None:
                # The Motif-Index CSV has hierarchy references to codes that do
                # not exist as rows (§5.1); an edge to one of them is a dangling
                # reference, not a fact.
                unknown_motifs[motif_code.canonical] += 1
                report.quarantined("edge_unknown_motif")
                continue

            buffer.write(
                f"{record_id}\t{motif_id}\t{_int_or_null(data.get('tale_variant'))}\t"
                f"{_int_or_null(data.get('motif_order'))}\t{source_version_id}\t"
                f"{dataset}.csv:{row['row_number']}\t{field_class}\n"
            )
            staged += 1

    if staged:
        _copy_edges(conn, buffer.getvalue(), source_version_id)
        report.rows_normalised = staged

    _report_dangling(conn, report, unknown_types, unknown_motifs, dataset)
    return report


def _int_or_null(value) -> str:
    try:
        return str(int(str(value).strip()))
    except (TypeError, ValueError):
        return "\\N"


def _copy_edges(
    conn: psycopg.Connection, payload: str, source_version_id: int
) -> None:
    """COPY into a temp table, then insert idempotently.

    593k rows go in as a bulk load; the ON CONFLICT pass is what makes a second
    run produce an identical ``core``, which is the idempotency property §9 asks
    to be tested.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TEMP TABLE staged_edges (
                record_id integer, motif_id integer, tale_variant integer,
                sequence_position integer, source_version_id integer,
                source_locator text, field_class text
            ) ON COMMIT DROP
            """
        )
        with cur.copy("COPY staged_edges FROM STDIN") as copy:
            copy.write(payload)
        cur.execute(
            """
            INSERT INTO core.tale_type_motif (record_id, motif_id, tale_variant,
                                              sequence_position, source_version_id,
                                              source_locator, field_class,
                                              derivation, review_status)
            SELECT record_id, motif_id, tale_variant, sequence_position,
                   source_version_id, source_locator, field_class,
                   'inferred', 'unreviewed'
              FROM staged_edges
            ON CONFLICT (record_id, motif_id, tale_variant, sequence_position)
              DO NOTHING
            """
        )
        # An anti-join against this source version's own edges. Joining back
        # through staged_edges on (record_id, motif_id) would fan out, because
        # one type/motif pair recurs across variants and positions.
        cur.execute(
            """
            INSERT INTO core.assertion_evidence (subject_table, subject_id,
                                                 source_version_id, source_locator,
                                                 evidence_kind)
            SELECT 'core.tale_type_motif', m.id, m.source_version_id,
                   m.source_locator, 'inferred_from'
              FROM core.tale_type_motif m
             WHERE m.source_version_id = %s
               AND NOT EXISTS (
                       SELECT 1 FROM core.assertion_evidence e
                        WHERE e.subject_table = 'core.tale_type_motif'
                          AND e.subject_id = m.id)
            """,
            (source_version_id,),
        )


def _report_dangling(
    conn: psycopg.Connection,
    report: GateReport,
    unknown_types: dict[str, int],
    unknown_motifs: dict[str, int],
    dataset: str,
) -> None:
    if unknown_types:
        report.notes.append(
            f"{len(unknown_types)} tale-type code(s) referenced by {dataset} have "
            f"no record in this edition"
        )
        route_to_review(
            conn,
            item_type="dataset",
            item_ref=dataset,
            reason="edges reference tale types with no record",
            detail={"sample": sorted(unknown_types)[:25], "distinct": len(unknown_types)},
            report=report,
        )
    if unknown_motifs:
        report.notes.append(
            f"{len(unknown_motifs)} motif code(s) referenced by {dataset} have no "
            f"row in the Motif-Index"
        )
        route_to_review(
            conn,
            item_type="dataset",
            item_ref=dataset,
            reason="edges reference motifs with no row",
            detail={"sample": sorted(unknown_motifs)[:25], "distinct": len(unknown_motifs)},
            report=report,
        )


def normalise_type_relations(
    conn: psycopg.Connection,
    *,
    source_version_id: int,
    rights: SourceRights,
    report: GateReport,
) -> GateReport:
    """Load atu_combos as ``combined_with`` relations.

    §7 keeps this one relation kind and defers the other seven until sources
    that actually assert them exist. Co-occurrence is a statistical claim about
    a corpus, so the derivation is ``inferred`` rather than ``stated`` (§5.2).
    """
    dataset = "atu_combos"
    field_class = rights.field_class(dataset, "combos") or "thin_facts"
    records = _record_index(conn)
    pairs: list[tuple] = []

    rows = fetch_all(
        conn,
        "SELECT row_number, data FROM raw.record "
        "WHERE source_version_id = %s AND dataset = %s ORDER BY row_number",
        (source_version_id, dataset),
    )
    for row in rows:
        report.rows_seen += 1
        data = row["data"]
        locator = f"{dataset}.csv:{row['row_number']}"
        try:
            left = atu.parse((data.get("atu_id") or "").strip())
            right = atu.parse((data.get("combos") or "").strip())
        except atu.AtuCodeError:
            report.quarantined("relation_code_grammar")
            continue

        from_id = records.get(left.canonical)
        to_id = records.get(right.canonical)
        if from_id is None or to_id is None or from_id == to_id:
            report.quarantined("relation_unknown_tale_type")
            continue
        pairs.append((from_id, to_id, source_version_id, locator, field_class))

    if pairs:
        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO core.tale_type_relation (from_record_id, to_record_id,
                                                     relation_kind, source_version_id,
                                                     source_locator, field_class,
                                                     derivation, review_status)
                VALUES (%s, %s, 'combined_with', %s, %s, %s, 'inferred', 'unreviewed')
                ON CONFLICT (from_record_id, to_record_id, relation_kind) DO NOTHING
                """,
                pairs,
            )
        report.rows_normalised = len(pairs)
    return report
