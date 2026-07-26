# ATU folklore knowledge base

A provenance-first, edition-aware knowledge base of folktale types (ATU) and
narrative motifs (TMI), built to the architecture in
[`../docs/atu-kb-assessment.md`](../docs/atu-kb-assessment.md). Phases 0–3 of
its revised sequence (§8) are implemented.

It is **separate from the bedtime-story app in this repository** and knows
nothing about it. The app consumes a generated snapshot of the factual fields;
see [`../docs/atu-kb-decisions.md`](../docs/atu-kb-decisions.md) §5 for the
boundary.

> The two upstream rights questions the assessment raises are not resolved here.
> They are recorded as data, surfaced by `GET /v0/sources`, and summarised in
> `../docs/atu-kb-decisions.md` §3. Nothing in this repository is legal advice.

## The shape

Three layers, with physical boundaries between them:

| Layer | Holds | Enforced by |
|---|---|---|
| `raw` | source rows exactly as retrieved, **including** columns the register withholds | immutable — a statement-level trigger refuses UPDATE/DELETE/TRUNCATE |
| `core` | normalised records; every value carries its own source, `derivation` and `review_status` | `NOT NULL` on the provenance columns |
| `publish` | a license-filtered projection | rebuilt as `publish_v{n}`, validated, then swapped in one transaction |

Three gates, because "complete the rights register before downloading anything"
is a deadlock — a license lives inside the artifact you are not yet allowed to
fetch (§3.3):

| Gate | Permits | Requires |
|---|---|---|
| **acquire** | download, checksum, preserve to quarantine | nothing |
| **ingest** | parse into `raw`, normalise into `core` | a reviewed register entry |
| **publish** | appear in `publish`, the API, or any export | an `effective_license` permitting redistribution |

## Quick start

```bash
# Postgres 16 with ltree, pg_trgm and unaccent
createdb atukb
export ATUKB_DSN=postgresql://atukb:atukb@127.0.0.1:5432/atukb

python -m venv .venv && .venv/bin/pip install -e "kb[dev]"
cd kb

alembic upgrade head        # raw + core
atukb gates                 # what each gate currently permits, and why
atukb acquire               # ~28 MB into kb/artifacts/ (quarantine)
atukb ingest                # raw -> core, with the §6.8 gates
atukb publish               # build publish_v1, validate, swap
atukb export                # license-filtered JSONL into kb/export/
atukb serve                 # the /v0 API on :8000
pytest                      # schema invariants, gates, grammars, pipeline
```

`atukb status` prints what is in the database; `atukb review --out q.csv` and
`atukb review --apply q.csv` are the curator round-trip.

## Sources

| Key | License | Role | Upstream rights |
|---|---|---|---|
| `wikidata_p2540` | CC0-1.0 | tale-type spine (§5.4) | clear |
| `tmi_mellmann` | CC-BY-4.0 | motif codes, labels, hierarchy (§5.1) | **unresolved** |
| `trilogy` | CC-BY-SA-4.0 | second, non-canonical ATU source (§5.2) | **unresolved** |

Ingesting Wikidata *and* trilogy is the deliberate centrepiece: a provenance
architecture that has never held two sources disagreeing about one title has not
been tested, only described (§7). `GET /v0/tale-types/{code}` shows both titles,
each cited, neither overwritten.

## Layout

```
atukb/
  codes/         ATU and TMI code grammars — total parsers, no guessing
  rights/        the register (Pydantic over YAML) and the three gates
  acquire/       content-addressed quarantine store + acquisition plans
  ingest/        raw loading, normalisation, §6.8 gates, derivational lineage
  publish/       versioned build, validation, atomic swap, license-filtered export
  api/           the /v0 read API (FastAPI)
  review/        the review queue as data — table, views, CSV round-trip
data/
  rights_register/  one reviewed YAML per source
  code_corpus/      versioned code-grammar corpora; changing a row is a breaking change
migrations/         Alembic, with hand-written SQL in migrations/sql/
```

## Things that are deliberately absent

- **`confidence`.** Nothing in the sources emits a calibrated probability, so
  the column would only ever hold an intuition rendered as `0.8` that a consumer
  then filters on and believes (§3.4). `derivation` and `review_status` carry
  the same information honestly, and are `NOT NULL`.
- **`necessity`.** "Which motifs are required for this tale type" is a
  story-generator question wearing folklore clothing; no source asserts it, and
  acceptance criterion #11 keeps generator-specific fields out of `core` (§3.5).
- **A generic `assertion` write table.** Typed tables are the sole write path;
  `publish.assertion` is a `UNION ALL` view over them, so it cannot disagree
  with them (§6.2). `core.assertion_staging` is a narrow escape hatch with a
  measurable promotion rule.
- **A `motif_hierarchy` edge table.** TMI codes encode their own hierarchy, so
  it is derived into an `ltree` path and validated against the source's own
  division headings (§3.6, §6.6).
- **dbt, an ORM, a graph store, a vector store, Elasticsearch** (§6.6).

`pytest kb/tests/test_schema.py` fails if any of the first four reappears.
