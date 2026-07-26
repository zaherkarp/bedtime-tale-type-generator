"""Build, validate and atomically swap the published projection (§6.8).

Acceptance criterion #14 — a failed or partial ingestion cannot silently replace
a valid published dataset — is the best line in the proposal and the one it
never gave a mechanism. This is the mechanism:

1. Build ``publish_v{n}`` as a *fresh versioned schema*.
2. Validate it while nothing is pointing at it.
3. Repoint the ``publish`` alias in a single transaction.

Postgres DDL is transactional, so the swap is atomic, rollback is trivial, and a
failed run cannot degrade a good dataset — it simply never becomes live.

The license filter runs *inside* the build, over the set of contributions to
each record, so a restricted field cannot be requested into existence by a
consumer (§6.9 rule 3).
"""

from __future__ import annotations

import json
from typing import Any

import psycopg
from psycopg import sql

from atukb.db import fetch_all, fetch_one, scalar
from atukb.rights.gates import effective_license
from atukb.rights.register import RightsRegister


class PublishAbandoned(RuntimeError):
    """Validation failed. The previous ``publish`` stays live."""


def _next_schema(conn: psycopg.Connection) -> tuple[int, str]:
    n = (scalar(conn, "SELECT coalesce(max(build_id), 0) FROM core.publish_build") or 0) + 1
    return n, f"publish_v{n}"


def _write_policy(
    conn: psycopg.Connection, schema: str, register: RightsRegister
) -> None:
    """Materialise the register's per-class decisions so SQL can join on them."""
    conn.execute(
        sql.SQL(
            """
            CREATE TABLE {}.field_class_policy (
                source_key   text NOT NULL,
                field_class  text NOT NULL,
                publishable  boolean NOT NULL,
                spdx         text NOT NULL,
                share_alike_required boolean NOT NULL,
                commercial_ok boolean NOT NULL,
                attribution  text,
                withheld_reason text,
                PRIMARY KEY (source_key, field_class)
            )
            """
        ).format(sql.Identifier(schema))
    )
    rows = []
    for entry in register:
        for field_class, decision in entry.publication.items():
            eff = effective_license(register, {(entry.key, field_class)})
            rows.append(
                (
                    entry.key,
                    field_class,
                    eff.redistribution_ok,
                    eff.spdx,
                    eff.share_alike_required,
                    eff.commercial_ok,
                    entry.attribution_text_required,
                    None if eff.redistribution_ok else eff.reason,
                )
            )
    with conn.cursor() as cur:
        cur.executemany(
            sql.SQL(
                "INSERT INTO {}.field_class_policy VALUES (%s,%s,%s,%s,%s,%s,%s,%s)"
            ).format(sql.Identifier(schema)),
            rows,
        )


#: Every published entity's contributions, as ``(entity, id, source_key,
#: field_class)``. The license is computed over these *sets*, never per source
#: independently — that is the whole point of §6.7's last paragraph.
_CONTRIBUTIONS = """
CREATE TEMP VIEW contribution AS
SELECT 'motif' AS entity, m.motif_id AS id, s.key AS source_key, m.field_class
  FROM core.motif m
  JOIN core.source_version v ON v.source_version_id = m.source_version_id
  JOIN core.source s ON s.source_id = v.source_id
UNION
SELECT 'motif', l.motif_id, s.key, l.field_class
  FROM core.motif_label l
  JOIN core.source_version v ON v.source_version_id = l.source_version_id
  JOIN core.source s ON s.source_id = v.source_id
UNION
SELECT 'tale_type_record', r.record_id, s.key, r.field_class
  FROM core.tale_type_record r
  JOIN core.source_version v ON v.source_version_id = r.source_version_id
  JOIN core.source s ON s.source_id = v.source_id
UNION
SELECT 'tale_type_record', n.record_id, s.key, n.field_class
  FROM core.tale_type_name n
  JOIN core.source_version v ON v.source_version_id = n.source_version_id
  JOIN core.source s ON s.source_id = v.source_id
UNION
SELECT 'tale_type_record', a.record_id, s.key, a.field_class
  FROM core.tale_type_attestation a
  JOIN core.source_version v ON v.source_version_id = a.source_version_id
  JOIN core.source s ON s.source_id = v.source_id
"""


def _build_tables(conn: psycopg.Connection, schema: str) -> None:
    def q(stmt: str) -> None:
        """Run a statement, filling every ``{}`` with the build's schema name."""
        conn.execute(
            sql.SQL(stmt).format(*([sql.Identifier(schema)] * stmt.count("{}")))
        )

    conn.execute(_CONTRIBUTIONS)

    # -- the license decision per entity, computed over its contribution set ---
    conn.execute(
        sql.SQL(
            """
            CREATE TABLE {}.effective_license AS
            SELECT c.entity,
                   c.id,
                   bool_and(p.publishable) AS redistribution_ok,
                   max(CASE p.spdx WHEN 'CC-BY-SA-4.0' THEN 3
                                   WHEN 'CC-BY-4.0'    THEN 2
                                   WHEN 'CC0-1.0'      THEN 1 ELSE 9 END) AS spdx_rank,
                   bool_or(p.share_alike_required) AS share_alike_required,
                   bool_and(p.commercial_ok) AS commercial_ok,
                   array_remove(array_agg(DISTINCT p.attribution), NULL) AS attribution,
                   array_agg(DISTINCT p.source_key || ':' || p.field_class
                             ORDER BY p.source_key || ':' || p.field_class)
                       AS contributing_sources,
                   string_agg(DISTINCT p.withheld_reason, '; ') AS withheld_reason
              FROM contribution c
              JOIN {}.field_class_policy p
                ON p.source_key = c.source_key AND p.field_class = c.field_class
             GROUP BY c.entity, c.id
            """
        ).format(sql.Identifier(schema), sql.Identifier(schema))
    )
    q("ALTER TABLE {}.effective_license ADD COLUMN spdx text")
    q(
        "UPDATE {}.effective_license SET spdx = CASE spdx_rank "
        "WHEN 3 THEN 'CC-BY-SA-4.0' WHEN 2 THEN 'CC-BY-4.0' "
        "WHEN 1 THEN 'CC0-1.0' ELSE 'NOASSERTION' END"
    )
    q("ALTER TABLE {}.effective_license DROP COLUMN spdx_rank")
    q("CREATE INDEX ON {}.effective_license (entity, id)")

    # -- motifs ------------------------------------------------------------
    q(
        """
        CREATE TABLE {}.motif AS
        SELECT m.code_canonical                AS code,
               m.code_raw,
               m.path::text                    AS path,
               nlevel(m.path)                  AS depth,
               subpath(m.path, 0, 1)::text     AS chapter,
               m.sort_key,
               dl.text                         AS display_label,
               dl.language_code,
               m.derivation::text              AS derivation,
               m.review_status::text           AS review_status,
               s.key                           AS source,
               sv.version_label                AS source_version,
               m.source_locator,
               el.spdx, el.attribution, el.share_alike_required,
               el.contributing_sources,
               adv.reason                      AS content_advisory,
               adv.terms                       AS content_advisory_terms
          FROM core.motif m
          JOIN core.source_version sv ON sv.source_version_id = m.source_version_id
          JOIN core.source s          ON s.source_id = sv.source_id
          JOIN {}.effective_license el
            ON el.entity = 'motif' AND el.id = m.motif_id AND el.redistribution_ok
          LEFT JOIN core.motif_label dl
            ON dl.label_id = m.preferred_label_id
          LEFT JOIN LATERAL (
                SELECT a.reason, a.terms
                  FROM core.content_advisory a
                 WHERE a.entity_type = 'motif_subtree'
                   AND m.path <@ text2ltree(a.entity_ref)
                 ORDER BY nlevel(text2ltree(a.entity_ref)) DESC
                 LIMIT 1) adv ON true
         WHERE NOT EXISTS (SELECT 1 FROM core.retraction r
                            WHERE r.entity_type = 'motif' AND r.entity_id = m.motif_id)
        """
    )
    q("CREATE UNIQUE INDEX ON {}.motif (code)")
    q("CREATE INDEX ON {}.motif USING gist (text2ltree(path))")
    q("CREATE INDEX ON {}.motif USING gin (display_label gin_trgm_ops)")

    # §6.5: the verbatim label lives in its own table so that serving it is an
    # explicit act. The API returns it only for ?labels=source, with the
    # advisory attached.
    q(
        """
        CREATE TABLE {}.motif_source_label AS
        SELECT m.code_canonical AS code, l.text AS source_label, l.language_code,
               s.key AS source, l.source_locator
          FROM core.motif m
          JOIN core.motif_label l ON l.motif_id = m.motif_id
                                 AND l.label_kind = 'source_label'
          JOIN core.source_version sv ON sv.source_version_id = l.source_version_id
          JOIN core.source s ON s.source_id = sv.source_id
          JOIN {}.effective_license el
            ON el.entity = 'motif' AND el.id = m.motif_id AND el.redistribution_ok
        """
    )
    q("CREATE UNIQUE INDEX ON {}.motif_source_label (code)")

    # -- tale-type records, concepts and their names -----------------------
    q(
        """
        CREATE TABLE {}.tale_type AS
        SELECT r.record_id,
               e.label                     AS edition,
               r.code_canonical            AS code,
               r.code_raw,
               r.code_sort_key,
               r.code_kind,
               r.division,
               r.concept_id,
               pn.text                     AS preferred_title,
               pn.language_code            AS preferred_title_language,
               pns.key                     AS preferred_title_source,
               r.derivation::text          AS derivation,
               r.review_status::text       AS review_status,
               -- True while the review queue holds an unresolved disagreement
               -- about this code's title. A consumer that has its own editorial
               -- voice — the bedtime app is one — needs to know the difference
               -- between "the sources agree" and "we picked one".
               EXISTS (SELECT 1 FROM core.review_queue q
                        WHERE q.item_type = 'tale_type_record'
                          AND q.item_ref = r.code_canonical
                          AND q.status = 'open'
                          AND q.reason = 'sources disagree about the English title')
                                           AS title_disputed,
               el.spdx, el.attribution, el.share_alike_required,
               el.contributing_sources
          FROM core.tale_type_record r
          JOIN core.edition e ON e.edition_id = r.edition_id
          JOIN {}.effective_license el
            ON el.entity = 'tale_type_record' AND el.id = r.record_id
           AND el.redistribution_ok
          LEFT JOIN core.tale_type_name pn ON pn.name_id = r.preferred_name_id
          LEFT JOIN core.source_version pnv
            ON pnv.source_version_id = pn.source_version_id
          LEFT JOIN core.source pns ON pns.source_id = pnv.source_id
         WHERE NOT EXISTS (SELECT 1 FROM core.retraction rt
                            WHERE rt.entity_type = 'tale_type_record'
                              AND rt.entity_id = r.record_id)
        """
    )
    q("CREATE UNIQUE INDEX ON {}.tale_type (edition, code)")
    q("CREATE INDEX ON {}.tale_type (concept_id)")
    q("CREATE INDEX ON {}.tale_type (code)")

    # Every name, from every source, each independently cited. This is where
    # "two sources disagreeing about one title, neither overwritten" is visible.
    q(
        """
        CREATE TABLE {}.tale_type_name AS
        SELECT n.record_id, t.code, t.edition, n.text AS title, n.language_code,
               n.label_kind::text AS label_kind,
               s.key AS source, sv.version_label AS source_version,
               n.source_locator, n.derivation::text AS derivation,
               n.review_status::text AS review_status,
               (n.name_id = r.preferred_name_id) AS is_preferred
          FROM core.tale_type_name n
          JOIN core.tale_type_record r ON r.record_id = n.record_id
          JOIN {}.tale_type t ON t.record_id = n.record_id
          JOIN core.source_version sv ON sv.source_version_id = n.source_version_id
          JOIN core.source s ON s.source_id = sv.source_id
        """
    )
    q("CREATE INDEX ON {}.tale_type_name (record_id)")
    q("CREATE INDEX ON {}.tale_type_name (code)")
    q("CREATE INDEX ON {}.tale_type_name USING gin (title gin_trgm_ops)")

    q(
        """
        CREATE TABLE {}.concordance AS
        SELECT c.concordance_id, f.code AS from_code, f.edition AS from_edition,
               t.code AS to_code, t.edition AS to_edition,
               c.relation::text AS relation,
               s.key AS source, sv.version_label AS source_version,
               c.source_locator, c.derivation::text AS derivation,
               c.review_status::text AS review_status
          FROM core.tale_type_concordance c
          JOIN {}.tale_type f ON f.record_id = c.from_record_id
          JOIN {}.tale_type t ON t.record_id = c.to_record_id
          JOIN core.source_version sv ON sv.source_version_id = c.source_version_id
          JOIN core.source s ON s.source_id = sv.source_id
        """
    )

    # -- edges -------------------------------------------------------------
    q(
        """
        CREATE TABLE {}.tale_type_motif AS
        SELECT t.code AS tale_type_code, t.edition, mo.code AS motif_code,
               mo.display_label AS motif_label, e.tale_variant, e.sequence_position,
               e.derivation::text AS derivation, e.review_status::text AS review_status,
               s.key AS source, sv.version_label AS source_version, e.source_locator,
               ev.evidence_kind::text AS evidence_kind
          FROM core.tale_type_motif e
          JOIN {}.tale_type t ON t.record_id = e.record_id
          JOIN core.motif m ON m.motif_id = e.motif_id
          JOIN {}.motif mo ON mo.code = m.code_canonical
          JOIN core.source_version sv ON sv.source_version_id = e.source_version_id
          JOIN core.source s ON s.source_id = sv.source_id
          LEFT JOIN LATERAL (
                SELECT evidence_kind FROM core.assertion_evidence a
                 WHERE a.subject_table = 'core.tale_type_motif' AND a.subject_id = e.id
                 LIMIT 1) ev ON true
        """
    )
    q("CREATE INDEX ON {}.tale_type_motif (tale_type_code)")
    q("CREATE INDEX ON {}.tale_type_motif (motif_code)")

    q(
        """
        CREATE TABLE {}.tale_type_relation AS
        SELECT f.code AS from_code, t.code AS to_code, r.relation_kind,
               r.derivation::text AS derivation, r.review_status::text AS review_status,
               s.key AS source, sv.version_label AS source_version, r.source_locator
          FROM core.tale_type_relation r
          JOIN {}.tale_type f ON f.record_id = r.from_record_id
          JOIN {}.tale_type t ON t.record_id = r.to_record_id
          JOIN core.source_version sv ON sv.source_version_id = r.source_version_id
          JOIN core.source s ON s.source_id = sv.source_id
        """
    )
    q("CREATE INDEX ON {}.tale_type_relation (from_code)")

    # -- the rights register, as data (§6.9) --------------------------------
    q(
        """
        CREATE TABLE {}.source AS
        SELECT s.key, s.name, s.homepage_url, s.description,
               rr.license_asserted_spdx, rr.license_reviewed_spdx,
               rr.reviewed_by, rr.reviewed_at,
               rr.redistribution_ok, rr.commercial_ok, rr.share_alike_required,
               rr.attribution_text_required,
               rr.upstream_rights_status, rr.database_right_status,
               rr.open_questions, rr.gate_status,
               a.sha256 AS license_evidence_sha256,
               a.url    AS license_evidence_url,
               rr.entry -> 'publication' AS publication,
               rr.entry -> 'withheld_fields' AS withheld_fields
          FROM core.source s
          JOIN core.rights_register rr ON rr.source_id = s.source_id
          LEFT JOIN core.artifact a ON a.artifact_id = rr.license_asserted_evidence
        """
    )
    q("CREATE UNIQUE INDEX ON {}.source (key)")

    # Derivational lineage, flattened so a citation renders the whole chain
    # rather than stopping at the convenient dataset (§3.7).
    q(
        """
        CREATE TABLE {}.lineage AS
        WITH RECURSIVE chain AS (
            SELECT v.source_version_id AS start_id, v.source_version_id,
                   v.version_label, 0 AS depth
              FROM core.source_version v
            UNION ALL
            SELECT c.start_id, p.source_version_id, p.version_label, c.depth + 1
              FROM chain c
              JOIN core.source_version v ON v.source_version_id = c.source_version_id
              JOIN core.source_version p
                ON p.source_version_id = v.derives_from_source_version_id
        )
        SELECT v.version_label AS source_version,
               array_agg(c.version_label ORDER BY c.depth) AS chain
          FROM chain c
          JOIN core.source_version v ON v.source_version_id = c.start_id
         GROUP BY v.version_label
        """
    )
    q("CREATE UNIQUE INDEX ON {}.lineage (source_version)")

    q(
        """
        CREATE TABLE {}.attribution AS
        SELECT DISTINCT unnest(attribution) AS text FROM {}.effective_license
         WHERE redistribution_ok
        """
    )

    # §6.2: `assertion` is a VIEW — a projection over the typed tables into
    # subject/predicate/object shape. Derived, and therefore incapable of
    # disagreeing with the tables it came from.
    q(
        """
        CREATE VIEW {}.assertion AS
        SELECT tale_type_code AS subject, 'has_motif' AS predicate,
               motif_code AS object, derivation, review_status, source, source_locator
          FROM {}.tale_type_motif
        UNION ALL
        SELECT from_code, relation_kind, to_code, derivation, review_status,
               source, source_locator
          FROM {}.tale_type_relation
        UNION ALL
        SELECT code, 'alternate_title', title, derivation, review_status,
               source, source_locator
          FROM {}.tale_type_name
        UNION ALL
        SELECT from_code, relation, to_code, derivation, review_status,
               source, source_locator
          FROM {}.concordance
        """
    )


#: Checks that must all pass before a build may become live. A failure abandons
#: the build; the previous ``publish`` stays exactly where it was.
VALIDATIONS: tuple[tuple[str, str], ...] = (
    ("motifs are present", "SELECT count(*) > 1000 FROM {schema}.motif"),
    ("tale types are present", "SELECT count(*) > 100 FROM {schema}.tale_type"),
    (
        "every published row carries its provenance",
        "SELECT NOT EXISTS (SELECT 1 FROM {schema}.motif "
        "WHERE source IS NULL OR source_locator IS NULL OR source_version IS NULL)",
    ),
    (
        "every published row carries derivation and review status",
        "SELECT NOT EXISTS (SELECT 1 FROM {schema}.tale_type_motif "
        "WHERE derivation IS NULL OR review_status IS NULL)",
    ),
    (
        "no published row cites a withheld field class",
        """
        SELECT NOT EXISTS (
            SELECT 1
              FROM (SELECT contributing_sources FROM {schema}.motif
                    UNION ALL
                    SELECT contributing_sources FROM {schema}.tale_type) r
              CROSS JOIN LATERAL unnest(r.contributing_sources) AS cs
              JOIN {schema}.field_class_policy p
                ON cs = p.source_key || ':' || p.field_class
             WHERE NOT p.publishable)
        """,
    ),
    (
        "at least one field class is actually being withheld",
        # Guards the check above against passing because nothing is restricted.
        "SELECT EXISTS (SELECT 1 FROM {schema}.field_class_policy "
        "WHERE NOT publishable)",
    ),
    (
        "every motif path is consistent with its code",
        "SELECT NOT EXISTS (SELECT 1 FROM {schema}.motif "
        "WHERE replace(split_part(path, '.', nlevel(text2ltree(path))::int), '_', '.') "
        "      <> code)",
    ),
    (
        "atu_seq edges are never presented as stated",
        "SELECT NOT EXISTS (SELECT 1 FROM {schema}.tale_type_motif "
        "WHERE source = 'trilogy' AND source_version LIKE '%atu_seq%' "
        "AND derivation <> 'inferred')",
    ),
    (
        "no tale type is published without an effective license",
        "SELECT NOT EXISTS (SELECT 1 FROM {schema}.tale_type WHERE spdx IS NULL)",
    ),
)


def validate(conn: psycopg.Connection, schema: str) -> dict[str, Any]:
    results: dict[str, Any] = {}
    for name, template in VALIDATIONS:
        results[name] = bool(scalar(conn, template.format(schema=schema)))
    return results


def build_and_swap(
    conn: psycopg.Connection, register: RightsRegister, *, fail_validation: bool = False
) -> dict[str, Any]:
    build_id, schema = _next_schema(conn)
    conn.execute(
        "INSERT INTO core.publish_build (build_id, schema_name) VALUES (%s, %s)",
        (build_id, schema),
    )
    conn.execute(sql.SQL("CREATE SCHEMA {}").format(sql.Identifier(schema)))

    _write_policy(conn, schema, register)
    _build_tables(conn, schema)

    results = validate(conn, schema)
    if fail_validation:
        # Deliberate failure, so that "a failed build cannot degrade a live
        # dataset" is demonstrated rather than asserted (§9, criterion #14).
        results["deliberate failure requested"] = False

    if not all(results.values()):
        conn.execute(
            sql.SQL("DROP SCHEMA {} CASCADE").format(sql.Identifier(schema))
        )
        conn.execute(
            "UPDATE core.publish_build SET status = 'abandoned', validation = %s "
            "WHERE build_id = %s",
            (json.dumps(results), build_id),
        )
        live = fetch_one(
            conn,
            "SELECT schema_name FROM core.publish_build WHERE is_live ORDER BY build_id "
            "DESC LIMIT 1",
        )
        return {
            "status": "abandoned",
            "schema": schema,
            "validation": results,
            "live_schema": live["schema_name"] if live else None,
            "note": "the previous publish stays live (acceptance criterion #14)",
        }

    _swap(conn, schema)
    conn.execute(
        "UPDATE core.publish_build SET status = 'live', validation = %s, is_live = true "
        "WHERE build_id = %s",
        (json.dumps(results), build_id),
    )
    conn.execute(
        "UPDATE core.publish_build SET is_live = false WHERE build_id <> %s", (build_id,)
    )
    return {"status": "live", "schema": schema, "validation": results}


def _swap(conn: psycopg.Connection, schema: str) -> None:
    """Repoint the ``publish`` alias in a single transaction.

    Postgres has no schema alias, so ``publish`` is a schema of views over the
    live versioned build. Recreating those views inside one transaction gives
    the atomic swap the mechanism needs: readers either see the old set or the
    new one, never a half-built mixture.
    """
    conn.execute("DROP SCHEMA IF EXISTS publish CASCADE")
    conn.execute("CREATE SCHEMA publish")
    for row in fetch_all(
        conn,
        """
        SELECT table_name FROM information_schema.tables
         WHERE table_schema = %s AND table_name <> 'field_class_policy'
         ORDER BY table_name
        """,
        (schema,),
    ):
        name = row["table_name"]
        conn.execute(
            sql.SQL("CREATE VIEW publish.{} AS SELECT * FROM {}.{}").format(
                sql.Identifier(name), sql.Identifier(schema), sql.Identifier(name)
            )
        )


def prune_old_builds(conn: psycopg.Connection, keep: int = 2) -> list[str]:
    """Drop superseded versioned schemas, keeping the last few for rollback."""
    rows = fetch_all(
        conn,
        "SELECT schema_name FROM core.publish_build WHERE status = 'live' "
        "ORDER BY build_id DESC OFFSET %s",
        (keep,),
    )
    dropped = []
    for row in rows:
        conn.execute(
            sql.SQL("DROP SCHEMA IF EXISTS {} CASCADE").format(
                sql.Identifier(row["schema_name"])
            )
        )
        dropped.append(row["schema_name"])
    return dropped
