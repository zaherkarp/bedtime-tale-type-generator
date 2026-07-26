-- The knowledge base schema, built to docs/atu-kb-assessment.md §6.
--
-- Three layers, and the boundaries between them are physical:
--
--   raw      source facts exactly as retrieved. Immutable, enforced by trigger.
--   core     normalised records. Every value carries its own source.
--   publish  a license-filtered projection, rebuilt and swapped atomically.
--
-- Two absences are deliberate and are asserted by tests/test_schema.py:
--
--   * No `confidence` column anywhere. Nothing in the sources emits a
--     calibrated probability, so the column would only ever hold a developer's
--     intuition rendered as 0.8, which a consumer then filters on and believes
--     (§3.4). `derivation` and `review_status` carry the same information
--     honestly, as ordinals, and are NOT NULL so a consumer cannot receive an
--     edge without knowing whether a human ever asserted it.
--   * No `necessity` column. "Which motifs are required for this tale type" is
--     a story-generator question wearing folklore clothing, no source asserts
--     it, and acceptance criterion #11 forbids generator-specific fields in the
--     core model (§3.5).

CREATE EXTENSION IF NOT EXISTS ltree;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS core;


-- ---------------------------------------------------------------------------
-- Vocabularies. Fixed here rather than as free text, because §9 requires the
-- `derivation` and `review_status` vocabularies to be settled before code.
-- ---------------------------------------------------------------------------

-- Where did this come from? (§6.3, replacing numeric confidence)
CREATE TYPE core.derivation AS ENUM ('stated', 'curated', 'inferred');

CREATE TYPE core.review_status AS ENUM
    ('unreviewed', 'accepted', 'rejected', 'disputed');

-- How does the evidence relate to the claim? A citation that terminates at the
-- convenient dataset misrepresents where the knowledge came from (§3.7).
CREATE TYPE core.evidence_kind AS ENUM
    ('direct', 'transcribed_from', 'inferred_from');

-- §6.5. `source_label` is verbatim and never rendered by default;
-- `display_label` is project-authored and safe to render. `preferred_label` is
-- not a kind at all — it is a pointer, held as a column on the entity.
CREATE TYPE core.label_kind AS ENUM ('source_label', 'display_label');

-- Edge-level classification change, with a direction and a source (§6.1). This
-- is the vocabulary the proposal put on the entity as `current_status`, where
-- it lost the other end of the edge, the direction, and the source that says so.
CREATE TYPE core.concordance_relation AS ENUM
    ('same_as', 'split_into', 'merged_into', 'renumbered_to', 'partial_overlap');

-- A source version is either something we retrieved or a bibliographic ancestor
-- we cite but never hold. The second kind is what makes a derivational chain
-- renderable (§6.3).
CREATE TYPE core.source_version_kind AS ENUM ('retrieved', 'bibliographic');


-- ---------------------------------------------------------------------------
-- Provenance spine
-- ---------------------------------------------------------------------------

-- Content-addressed quarantine store contents (§6.4 "Acquire").
CREATE TABLE core.artifact (
    artifact_id         text PRIMARY KEY,
    source_key          text        NOT NULL,
    name                text        NOT NULL,
    url                 text        NOT NULL,
    sha256              text        NOT NULL,
    bytes_len           bigint      NOT NULL,
    media_type          text        NOT NULL,
    retrieved_at        timestamptz NOT NULL,
    -- §6.7's license_asserted_evidence: the LICENSE/README as retrieved. A
    -- license you can no longer prove was granted is a license you do not have.
    is_license_evidence boolean     NOT NULL DEFAULT false
);

CREATE TABLE core.source (
    source_id    serial PRIMARY KEY,
    key          text NOT NULL UNIQUE,
    name         text NOT NULL,
    homepage_url text NOT NULL,
    description  text NOT NULL DEFAULT ''
);

-- The rights register, materialised so that GET /v0/sources can serve it as
-- data (§6.9) and so the publish gate can join against it. `entry` holds the
-- whole reviewed YAML; the promoted columns exist to be queried, not to be a
-- second source of truth.
CREATE TABLE core.rights_register (
    source_id                integer PRIMARY KEY REFERENCES core.source,
    license_asserted_spdx    text    NOT NULL,
    license_reviewed_spdx    text,
    license_asserted_evidence text REFERENCES core.artifact,
    reviewed_by              text,
    reviewed_at              date,
    redistribution_ok        boolean NOT NULL,
    commercial_ok            boolean NOT NULL,
    share_alike_required     boolean NOT NULL,
    attribution_text_required text,
    upstream_rights_status   text    NOT NULL,
    database_right_status    text    NOT NULL,
    open_questions           text[]  NOT NULL DEFAULT '{}',
    gate_status              text    NOT NULL,
    entry                    jsonb   NOT NULL
);

CREATE TABLE core.source_version (
    source_version_id  serial PRIMARY KEY,
    source_id          integer NOT NULL REFERENCES core.source,
    version_label      text    NOT NULL,
    kind               core.source_version_kind NOT NULL DEFAULT 'retrieved',
    retrieved_at       timestamptz,
    artifact_id        text REFERENCES core.artifact,
    dataset            text,
    -- Temporal: this version replaces that one.
    supersedes_version_id integer REFERENCES core.source_version,
    -- Derivational: this version transcribes or is compiled from that one.
    -- Without it a citation stops at `trilogy` rather than reaching Uther and
    -- Aarne-Thompson behind it, which for a project whose premise is citability
    -- is the most damaging possible failure (§3.7).
    derives_from_source_version_id integer REFERENCES core.source_version,
    derivation_note    text NOT NULL DEFAULT '',
    UNIQUE (source_id, version_label),
    CONSTRAINT retrieved_versions_have_an_artifact
        CHECK (kind <> 'retrieved' OR artifact_id IS NOT NULL)
);

CREATE INDEX ON core.source_version (derives_from_source_version_id);

-- Field-level evidence for one row in one typed table (§6.3).
CREATE TABLE core.assertion_evidence (
    evidence_id       bigserial PRIMARY KEY,
    subject_table     text    NOT NULL,
    subject_id        bigint  NOT NULL,
    source_version_id integer NOT NULL REFERENCES core.source_version,
    source_locator    text    NOT NULL,
    evidence_kind     core.evidence_kind NOT NULL,
    -- Idempotency is a property the unique constraint provides, not one the
    -- writers promise. `ON CONFLICT DO NOTHING` has nothing to conflict on
    -- without it, so re-running an ingestion would silently double the evidence
    -- and §9's "two consecutive runs produce identical core" would be false.
    UNIQUE (subject_table, subject_id, source_version_id, source_locator,
            evidence_kind)
);

CREATE INDEX ON core.assertion_evidence (subject_table, subject_id);

-- §6.3. A value that was published and later found wrong must be removable
-- *while leaving a record that it existed*, or downstream consumers who cached
-- it have no way to learn they should not have.
CREATE TABLE core.retraction (
    entity_type   text        NOT NULL,
    entity_id     bigint      NOT NULL,
    retracted_at  timestamptz NOT NULL DEFAULT now(),
    reason        text        NOT NULL,
    superseded_by text,
    PRIMARY KEY (entity_type, entity_id)
);


-- ---------------------------------------------------------------------------
-- Tale-type identity: record / concept / concordance (§6.1)
--
-- The proposal's single `core.tale_type`, keyed by canonical_code and carrying
-- canonical_title and current_status, conflates edition-bound records with
-- stable concepts. That is the one genuinely irreversible mistake in the
-- document: every foreign key points at the conflated entity, so splitting it
-- later means rewriting every relationship row with a judgment call about which
-- sense of the type each row meant — a judgment the data no longer contains.
-- ---------------------------------------------------------------------------

CREATE TABLE core.edition (
    edition_id        serial PRIMARY KEY,
    label             text NOT NULL UNIQUE,   -- 'ATU-2004', 'AT-1961', 'Wikidata'
    source_version_id integer NOT NULL REFERENCES core.source_version,
    publication_year  integer
);

-- Project-minted stable identity. Deliberately thin: it carries NO code, NO
-- title and NO status, because every attribute belongs to a record — every
-- attribute came from an edition. A concept is an identity, not a merged
-- summary, and that discipline is what keeps the split from silently
-- collapsing back into the model it replaced (§6.1).
CREATE TABLE core.tale_type_concept (
    concept_id serial PRIMARY KEY,
    minted_at  timestamptz NOT NULL DEFAULT now(),
    notes      text NOT NULL DEFAULT ''
);

-- What ONE edition says. Never merged.
CREATE TABLE core.tale_type_record (
    record_id         serial PRIMARY KEY,
    edition_id        integer NOT NULL REFERENCES core.edition,
    code_raw          text    NOT NULL,   -- verbatim, e.g. '327A + 328'
    code_canonical    text    NOT NULL,
    code_sort_key     text    NOT NULL,
    code_kind         text    NOT NULL,   -- single | range | compound | reference
    division          text,               -- the ATU top-level division, if any
    concept_id        integer REFERENCES core.tale_type_concept,  -- NULL until resolved
    preferred_name_id integer,            -- FK added after tale_type_name exists
    source_version_id integer NOT NULL REFERENCES core.source_version,
    source_locator    text    NOT NULL,
    field_class       text    NOT NULL,
    derivation        core.derivation    NOT NULL,
    review_status     core.review_status NOT NULL,
    UNIQUE (edition_id, code_raw)
);

CREATE INDEX ON core.tale_type_record (concept_id);
CREATE INDEX ON core.tale_type_record (code_canonical);
CREATE INDEX ON core.tale_type_record (code_sort_key);

CREATE TABLE core.tale_type_name (
    name_id           bigserial PRIMARY KEY,
    record_id         integer NOT NULL REFERENCES core.tale_type_record ON DELETE CASCADE,
    label_kind        core.label_kind NOT NULL,
    text              text    NOT NULL,
    -- §6.6: store a language next to every searchable text and pick the
    -- tsvector configuration from it. to_tsvector('english', ...) does not
    -- survive a multilingual tale corpus (§3.10).
    language_code     text    NOT NULL DEFAULT 'und',
    source_version_id integer NOT NULL REFERENCES core.source_version,
    source_locator    text    NOT NULL,
    field_class       text    NOT NULL,
    derivation        core.derivation    NOT NULL,
    review_status     core.review_status NOT NULL
);

CREATE INDEX ON core.tale_type_name (record_id);
CREATE INDEX ON core.tale_type_name USING gin (text gin_trgm_ops);

-- Which sources attest that this edition contains this code.
--
-- An edition-bound record can have more than one witness: Wikidata and trilogy
-- both report ATU 510A, and they are two sources speaking about one edition's
-- record rather than two records. Keeping attestation in its own table means
-- "which source told us this type exists?" is answered by rows that each carry
-- their own provenance, instead of by a single column on the record that the
-- second source to arrive would have to overwrite (§6.1, §6.3).
CREATE TABLE core.tale_type_attestation (
    attestation_id    bigserial PRIMARY KEY,
    record_id         integer NOT NULL REFERENCES core.tale_type_record ON DELETE CASCADE,
    source_version_id integer NOT NULL REFERENCES core.source_version,
    source_locator    text    NOT NULL,
    field_class       text    NOT NULL,
    derivation        core.derivation    NOT NULL,
    review_status     core.review_status NOT NULL,
    UNIQUE (record_id, source_version_id)
);

CREATE INDEX ON core.tale_type_attestation (record_id);

-- §6.2: the preferred title is a POINTER to a sourced row, not a copy. A scalar
-- `canonical_title` cannot answer "which source supports this title?", which is
-- one of the project's own stated questions.
ALTER TABLE core.tale_type_record
    ADD CONSTRAINT tale_type_record_preferred_name_fkey
    FOREIGN KEY (preferred_name_id) REFERENCES core.tale_type_name (name_id);

-- Edge-level change, with a direction and a source. AT 313 -> ATU 313A/B/C is
-- three `split_into` rows, each independently sourced; nothing is overwritten
-- and nothing is invented (§6.1).
CREATE TABLE core.tale_type_concordance (
    concordance_id    bigserial PRIMARY KEY,
    from_record_id    integer NOT NULL REFERENCES core.tale_type_record,
    to_record_id      integer NOT NULL REFERENCES core.tale_type_record,
    relation          core.concordance_relation NOT NULL,
    source_version_id integer NOT NULL REFERENCES core.source_version,
    source_locator    text    NOT NULL,
    field_class       text    NOT NULL,
    derivation        core.derivation    NOT NULL,
    review_status     core.review_status NOT NULL,
    CONSTRAINT concordance_is_between_two_records
        CHECK (from_record_id <> to_record_id),
    UNIQUE (from_record_id, to_record_id, relation)
);

CREATE INDEX ON core.tale_type_concordance (to_record_id);


-- ---------------------------------------------------------------------------
-- Motifs (§6.6)
--
-- The hierarchy is DERIVED from the code, not stored as free-form edges. TMI
-- codes encode their own structure, so an edge table can disagree with the
-- identifiers and nothing says which is right (§3.6). `path` makes "everything
-- under D" an index scan over data that cannot contradict itself.
-- ---------------------------------------------------------------------------

CREATE TABLE core.motif (
    motif_id           serial PRIMARY KEY,
    code_raw           text  NOT NULL,
    code_canonical     text  NOT NULL UNIQUE,
    path               ltree NOT NULL,
    sort_key           text  NOT NULL,
    chapter            char(1) NOT NULL,
    preferred_label_id bigint,          -- FK added after motif_label exists
    source_version_id  integer NOT NULL REFERENCES core.source_version,
    source_locator     text  NOT NULL,
    field_class        text  NOT NULL,
    derivation         core.derivation    NOT NULL,
    review_status      core.review_status NOT NULL
);

CREATE INDEX motif_path_gist ON core.motif USING gist (path);
CREATE INDEX ON core.motif (sort_key);

CREATE TABLE core.motif_label (
    label_id          bigserial PRIMARY KEY,
    motif_id          integer NOT NULL REFERENCES core.motif ON DELETE CASCADE,
    label_kind        core.label_kind NOT NULL,
    text              text    NOT NULL,
    language_code     text    NOT NULL DEFAULT 'en',
    source_version_id integer NOT NULL REFERENCES core.source_version,
    source_locator    text    NOT NULL,
    field_class       text    NOT NULL,
    derivation        core.derivation    NOT NULL,
    review_status     core.review_status NOT NULL
);

CREATE INDEX ON core.motif_label (motif_id);
CREATE INDEX ON core.motif_label USING gin (text gin_trgm_ops);

ALTER TABLE core.motif
    ADD CONSTRAINT motif_preferred_label_fkey
    FOREIGN KEY (preferred_label_id) REFERENCES core.motif_label (label_id);

-- §3.9/§6.5. The Motif-Index organises and labels material using ethnic and
-- racial terminology no contemporary publication would reproduce without
-- framing. Storing the labels verbatim and serving them publishes slurs;
-- cleaning them falsifies the provenance claim and silently edits a historical
-- document. Neither policy alone can resolve that — only the schema can, by
-- keeping the verbatim label, a project-authored display label, and an advisory
-- that travels with both.
CREATE TABLE core.content_advisory (
    advisory_id serial PRIMARY KEY,
    entity_type text    NOT NULL,   -- 'motif' | 'motif_subtree' | 'tale_type_record'
    entity_ref  text    NOT NULL,   -- a code or an ltree prefix
    reason      text    NOT NULL,
    terms       text[]  NOT NULL DEFAULT '{}',
    flagged_by  text    NOT NULL,
    flagged_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (entity_type, entity_ref)
);


-- ---------------------------------------------------------------------------
-- Typed relation tables — the sole write path (§6.2)
--
-- The proposal specified both these tables and a generic `assertion` table, and
-- every one of its own example assertions was a row that already had a typed
-- home. Two write paths for the same fact, no stated arbiter, and no constraint
-- that can keep them consistent. Here the typed tables get the foreign keys and
-- the NOT NULLs, and `publish.assertion` is a view over them — derived, and
-- therefore incapable of disagreeing.
-- ---------------------------------------------------------------------------

CREATE TABLE core.tale_type_motif (
    id                bigserial PRIMARY KEY,
    record_id         integer NOT NULL REFERENCES core.tale_type_record,
    motif_id          integer NOT NULL REFERENCES core.motif,
    tale_variant      integer,
    -- Recorded sequence data, not sequence *semantics*. Uther lists motifs per
    -- type largely without narrative ordering, so rows sourced from atu_seq are
    -- stored with derivation = 'inferred' (§5.2).
    sequence_position integer,
    source_version_id integer NOT NULL REFERENCES core.source_version,
    source_locator    text    NOT NULL,
    field_class       text    NOT NULL,
    derivation        core.derivation    NOT NULL,
    review_status     core.review_status NOT NULL,
    UNIQUE (record_id, motif_id, tale_variant, sequence_position)
);

CREATE INDEX ON core.tale_type_motif (record_id);
CREATE INDEX ON core.tale_type_motif (motif_id);

CREATE TABLE core.tale_type_relation (
    id                bigserial PRIMARY KEY,
    from_record_id    integer NOT NULL REFERENCES core.tale_type_record,
    to_record_id      integer NOT NULL REFERENCES core.tale_type_record,
    -- §7 keeps only `combined_with`, from atu_combos. The other seven relation
    -- kinds await sources that actually assert them.
    relation_kind     text    NOT NULL DEFAULT 'combined_with',
    source_version_id integer NOT NULL REFERENCES core.source_version,
    source_locator    text    NOT NULL,
    field_class       text    NOT NULL,
    derivation        core.derivation    NOT NULL,
    review_status     core.review_status NOT NULL,
    CONSTRAINT relation_is_between_two_records
        CHECK (from_record_id <> to_record_id),
    UNIQUE (from_record_id, to_record_id, relation_kind)
);

CREATE INDEX ON core.tale_type_relation (to_record_id);

-- The escape hatch for predicates with no typed table yet (§6.2). The promotion
-- rule lives in the contributing guide and is measurable here: a predicate that
-- exceeds a few hundred rows, or survives one release, gets a typed table.
-- Without a promotion rule, escape hatches become the architecture.
CREATE TABLE core.assertion_staging (
    id                bigserial PRIMARY KEY,
    subject_type      text NOT NULL,
    subject_id        bigint NOT NULL,
    predicate         text NOT NULL,
    object_type       text NOT NULL,
    object_id         bigint,
    object_text       text,
    source_version_id integer NOT NULL REFERENCES core.source_version,
    source_locator    text NOT NULL,
    field_class       text NOT NULL,
    derivation        core.derivation    NOT NULL,
    review_status     core.review_status NOT NULL,
    created_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT staged_object_is_a_reference_or_a_literal
        CHECK (num_nonnulls(object_id, object_text) = 1)
);

CREATE VIEW core.assertion_staging_promotion_due AS
SELECT predicate,
       count(*) AS rows,
       min(created_at) AS first_seen,
       count(*) > 200 AS over_row_threshold
  FROM core.assertion_staging
 GROUP BY predicate;

COMMENT ON VIEW core.assertion_staging_promotion_due IS
    'Predicates in the escape hatch that are due a typed table (§6.2).';


-- ---------------------------------------------------------------------------
-- Operational tables: review as data, quarantine, run history
-- ---------------------------------------------------------------------------

-- §3.8: `review_status` appeared on nine tables in the proposal and no phase
-- named a reviewer or said what happens to unreviewed rows. The queue is a
-- table with views and a CSV round-trip — adequate curator tooling for years,
-- and a week of work rather than a project (§8).
CREATE TABLE core.review_queue (
    item_id       bigserial PRIMARY KEY,
    item_type     text NOT NULL,
    item_ref      text NOT NULL,
    reason        text NOT NULL,
    detail        jsonb NOT NULL DEFAULT '{}',
    status        text NOT NULL DEFAULT 'open',
    assigned_to   text,
    decided_at    timestamptz,
    decision_note text NOT NULL DEFAULT '',
    created_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (item_type, item_ref, reason),
    CONSTRAINT review_status_is_known
        CHECK (status IN ('open', 'accepted', 'rejected', 'deferred'))
);

CREATE VIEW core.review_queue_open AS
SELECT * FROM core.review_queue WHERE status = 'open' ORDER BY item_type, item_ref;

-- §6.8: "quarantine the row, continue, publish the quarantine count in the
-- validation report". A row that fails code-grammar validation is not dropped
-- and not guessed at; it is kept with the reason it failed.
CREATE TABLE core.quarantine (
    id                bigserial PRIMARY KEY,
    source_version_id integer NOT NULL REFERENCES core.source_version,
    dataset           text NOT NULL,
    source_locator    text NOT NULL,
    reason            text NOT NULL,
    payload           jsonb NOT NULL,
    created_at        timestamptz NOT NULL DEFAULT now(),
    -- Same reasoning as core.assertion_evidence: quarantining is deterministic,
    -- so re-quarantining the same row must be a no-op rather than a second row.
    UNIQUE (source_version_id, dataset, source_locator, reason)
);

CREATE INDEX ON core.quarantine (source_version_id);

CREATE TABLE core.ingestion_run (
    run_id            serial PRIMARY KEY,
    source_version_id integer NOT NULL REFERENCES core.source_version,
    started_at        timestamptz NOT NULL DEFAULT now(),
    finished_at       timestamptz,
    status            text NOT NULL DEFAULT 'running',
    stats             jsonb NOT NULL DEFAULT '{}',
    -- §6.8: every ingestion emits a diff against the prior version.
    -- Re-classification is the signal this project exists to capture; it should
    -- not require a query to notice.
    diff_report       jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE core.publish_build (
    build_id   serial PRIMARY KEY,
    schema_name text NOT NULL UNIQUE,
    built_at   timestamptz NOT NULL DEFAULT now(),
    status     text NOT NULL DEFAULT 'building',
    is_live    boolean NOT NULL DEFAULT false,
    validation jsonb NOT NULL DEFAULT '{}'
);


-- ---------------------------------------------------------------------------
-- raw: source facts exactly as retrieved, including the columns the rights
-- register withholds from core. Immutable — §9 requires UPDATE/DELETE to be
-- revoked, but the owner would bypass a grant, so the enforcement is a trigger.
-- ---------------------------------------------------------------------------

CREATE TABLE raw.record (
    raw_id            bigserial PRIMARY KEY,
    source_version_id integer NOT NULL REFERENCES core.source_version,
    dataset           text NOT NULL,
    row_number        integer NOT NULL,
    data              jsonb NOT NULL,
    artifact_id       text NOT NULL REFERENCES core.artifact,
    ingested_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (source_version_id, dataset, row_number)
);

CREATE INDEX ON raw.record (dataset);

CREATE FUNCTION raw.refuse_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION
        'raw.% is immutable: % is not permitted. Re-ingest under a new '
        'source_version instead (assessment §9).',
        TG_TABLE_NAME, TG_OP
        USING ERRCODE = 'restrict_violation';
END;
$$;

-- Statement-level, so the refusal does not depend on the table having rows: an
-- UPDATE that currently matches nothing must still be refused, or the guarantee
-- is "immutable when populated" rather than "immutable".
CREATE TRIGGER raw_record_is_immutable
    BEFORE UPDATE OR DELETE OR TRUNCATE ON raw.record
    FOR EACH STATEMENT EXECUTE FUNCTION raw.refuse_mutation();

REVOKE UPDATE, DELETE, TRUNCATE ON raw.record FROM PUBLIC;
