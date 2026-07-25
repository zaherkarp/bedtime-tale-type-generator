# Pre-Implementation Assessment: ATU Folklore Knowledge Base

A critical review of the proposed provenance-first, versioned, edition-aware
folklore knowledge base — the data product intended to sit upstream of a
story-generation system.

> **On the legal content in this document.** Nothing here is legal advice, and
> none of it is stated as settled. Where a rights question matters, it is
> flagged as **uncertain** along with the specific evidence that would resolve
> it. Several of these questions need a professional review before any
> publication decision, not a confident engineer.

---

## 1. Executive assessment

**Verdict: viable with modifications — and, secondarily, poorly sequenced.**

The instinct is right on the three things that usually sink projects like this.
Separating the knowledge base from the generator is correct. Refusing to build
Version 1 on PDF extraction from the ATU volumes is correct. Choosing Postgres
over a graph store at this scale is correct, and not a close call.

The proposal is not too ambitious in *ambition*. It is too ambitious in
*simultaneity*: six entity domains, an assertion layer, an editorial workflow,
licensing enforcement, edition-awareness, search, and an API, all landing in one
"MVP." Each piece is defensible. The set is not.

Three specific things are wrong, and they are wrong in a way that ordinary
iteration will not fix:

1. **`core.tale_type` conflates edition-bound records with stable concepts.**
   This is the one genuinely irreversible mistake in the document. Everything
   else can be migrated.
2. **The assertion layer duplicates the typed relation tables** with two write
   paths and no rule for what happens when they disagree.
3. **"Complete the rights register before downloading anything" is a deadlock**,
   and by conflating three different gates into one it hides the gate that
   actually matters.

Beneath those sits a fourth problem that is not a design flaw but a project
risk: the two flagship sources both derive from compilations that are plausibly
still in copyright, and the proposal treats their downstream license
declarations as settled. That assumption is load-bearing for the entire
redistribution story, and it is the least examined claim in the document.

The good news is that the reduced MVP in §7 is roughly a third of the proposed
scope, tests every architectural question that matters, and can be built on
source material whose licensing is not in doubt.

---

## 2. What is strong

Credit where the proposal is genuinely ahead of the field:

- **The three-way distinction — source facts / normalized records / derived
  assertions — is the correct spine.** Most folklore datasets collapse these
  and become unciteable. Holding the line here is the project's entire value
  proposition.
- **Refusing PDF extraction as the Version 1 foundation.** This single decision
  avoids the failure mode that has killed comparable efforts: a beautiful
  database that cannot be published.
- **Acceptance criterion #14** — a failed or partial ingestion cannot silently
  replace a valid published dataset — is the best line in the document. It is
  the criterion most projects discover only after an incident.
- **Acceptance criterion #11** — no story-generator-specific fields in the core
  model — is the right boundary, correctly drawn. (§4 notes one place the
  proposal violates it.)
- **"Records should not be merged solely because their titles are similar."**
  Correct, and the discipline most likely to be abandoned under schedule
  pressure.
- **Preserving `original_license_text` alongside interpreted license fields.**
  Rare and right. §6 extends it.
- **The `is_verbatim` flag and the rule that generated summaries must never be
  represented as source-authored.** Correct instinct; §5 argues the model does
  not yet enforce it.
- **Postgres, and the explicit list of things not to start with.** At the
  expected scale — on the order of 2,400 ATU types and 46,000 TMI motifs — a
  graph database would add operational burden and buy nothing. The proposal
  resisted a fashionable mistake.

---

## 3. What is flawed or risky

### 3.1 Tale types are modeled as stable entities. They are not.

This is the most important finding in this review.

`core.tale_type` has one row per type, keyed by `canonical_code`, carrying
`canonical_title` and `current_status`. That model cannot represent the thing
the project exists to represent.

Consider the concrete case the proposal itself invites — "have classifications
changed between sources or editions?" When a type in AT (1961) is split across
several types in ATU (2004), the single-entity model has three options, all bad:

- Keep one row and overwrite it, destroying the historical classification.
- Create rows for the new codes and mark the old one `superseded`, at which
  point `superseded` is a property of an *entity* when the actual fact is a
  property of a *relationship* between two editions' records.
- Invent a project-authored "canonical" that no edition ever asserted, and
  attach the summaries of several editions to it.

The proposal's `current_status` / `historical_status` enum (`active`,
`deprecated`, `merged`, `split`, `superseded`, `uncertain`) is an entity-level
answer to an edge-level question. "Merged" is not a fact about a type; it is a
fact about a pair of types under a pair of editions. Storing it on the entity
loses the other end of the edge, the direction, and the source that says so.

Why this is irreversible: every foreign key in the model points at
`tale_type_id`. Once `tale_type_motif`, `tale_type_relation`,
`tale_type_description`, and `tale_annotation` all reference a conflated
entity, splitting it later means rewriting every relationship row with a
judgment call about which sense of the type each row meant — a judgment the data
no longer contains. The fix costs a day now. Later it costs a re-curation.

The revised model is in §6.1.

### 3.2 The assertion layer and the typed relation tables are the same data

The proposal specifies both `tale_type_motif` / `tale_type_relation` /
`tale_type_name` **and** a generic `assertion` table. Its own examples give the
collision away:

```
ATU 313  | has_motif               | D672        → tale_type_motif
ATU 313  | commonly_combined_with  | ATU 400     → tale_type_relation
ATU 510A | alternate_title         | Cinderella  → tale_type_name
```

Every example assertion is a row that already has a typed home. So: two write
paths for the same fact, no stated arbiter, and no constraint that can keep them
consistent. In practice one of three things happens — the assertion table decays
into a write-only audit log nobody queries, the typed tables decay into a stale
cache of the assertion table, or they silently diverge and the provenance claim
becomes false.

The same defect appears one level down, and is easier to miss:
`core.tale_type.canonical_title` duplicates the `tale_type_name` table. A
scalar `canonical_title` cannot answer "which source supports this title?" —
which is one of the project's stated questions.

### 3.3 The rights register cannot precede acquisition

Phase 0 says: build the source and rights register — including explicit license,
attribution requirements, and redistribution status — and only then, in Phase 1,
ingest. But you cannot determine a dataset's license without retrieving the
artifact: the license lives in a `LICENSE` file, a README, a data dictionary, or
a journal article that ships *with* the thing you are not yet allowed to fetch.

As written, Phase 0 is unimplementable, so in practice it will be quietly
violated — which is worse than not having had the rule, because the register
then documents a process that did not happen.

The deeper problem is that "before ingestion" collapses three genuinely
different gates. §6.4 separates them.

### 3.4 Numeric confidence is fake precision

`confidence` appears on `tale_type_motif`, `tale_type_relation`, and
`assertion`. Nothing in the proposed sources emits a calibrated probability.
What will actually populate this column is a developer's intuition rendered as
`0.8`, which then propagates downstream where a consumer filters `confidence >
0.75` and believes the result means something.

The proposal itself names "false confidence in inferred relationships" as a risk
to assess. This column is that risk, in the schema.

### 3.5 `necessity` is a generator requirement wearing a folklore costume

The `necessity` field (`required` / `common` / `optional` / `referenced` /
`unknown`) has no source. Uther does not mark motifs as required. The proposal
half-admits this — "should not be populated unless explicitly supported by a
source" — which describes a column that will be `unknown` in every row.

More importantly, look at what it is *for*. "Which motifs are required for this
tale type" is precisely the question a story generator asks. It is also on the
proposal's own exclusion list, as "automatic extraction of required story
beats." Acceptance criterion #11 says no generator-specific fields in the core
model. `necessity` is that field, and it arrived early enough to look native.

### 3.6 The motif hierarchy is stored twice and validated never

`motif_hierarchy(parent_motif_id, child_motif_id, relationship_type,
source_version_id)` models the TMI hierarchy as free-form edges. But TMI codes
*encode* their own hierarchy: `D672` sits under the `D600`s, which sit under
`D`. The structure is a function of the identifier.

Storing it as independent edges means the edge table and the codes can disagree,
with nothing to say which is right. And it makes the one query users actually
run — "give me everything under `D`" — a recursive CTE over a table that might
be wrong, rather than a prefix match that cannot be.

### 3.7 Provenance that stops at the immediate source is provenance theater

`assertion_evidence` records which source version and locator supports a claim.
For `trilogy`, that yields: "this motif association is supported by
`trilogy/atu_seq` row 918."

That is true and nearly useless. `trilogy` did not observe that association; it
transcribed it from Uther, who compiled it from Aarne and Thompson, who compiled
it from national indexes and collectors. A citation that terminates at the
convenient dataset misrepresents where the knowledge came from — and for a
project whose entire premise is citability, that is the most damaging possible
failure.

The proposal has `source_version.supersedes_version_id` (a *temporal* link
between versions of one source) but nothing for the *derivational* link between
one source and the earlier source it transcribes.

### 3.8 Everything is reviewable and nobody is the reviewer

`review_status` appears on nine tables. No phase names a reviewer, estimates
review volume, or defines what happens to unreviewed rows. Phase 5 — the
curator tool — is last.

The arithmetic is unkind. Automated entity resolution across ~2,400 ATU types
and ~46,000 motifs will produce thousands of items in the "automated suggestion
requiring review" bucket that the ingestion flow's own resolution priority
creates. If review is a prerequisite for publication, the project stalls. If it
is not, `review_status` is decoration.

### 3.9 The Motif-Index contains terminology the project cannot pass through unexamined

The TMI, compiled in the 1930s and revised in the 1950s, organizes and labels
material using ethnic and racial terminology that no contemporary publication
would reproduce without framing — including categories defined by ethnic group
in ways that carry the prejudices of their period.

This is not a diversity-statement concern; it is a schema concern, and the
proposal has no field for it. The project has exactly two options, and both are
wrong on their own:

- Store the labels verbatim and serve them. Provenance is intact; the API now
  publishes slurs.
- Clean the labels. The API is safe; the provenance claim is now false, and the
  project has silently edited a historical document.

The resolution requires a third label kind and an advisory flag, not an
editorial policy. See §6.5.

### 3.10 Smaller flaws

- **`code_numeric` + `code_suffix` cannot hold real ATU codes.** Ranges
  (`300–359`), compound classifications (`327A + 328`), and `cf.` references all
  appear in the literature. Two scalar columns model the easy 90%.
- **No `sort_key` on tale types**, though motifs have one. `510A` must sort
  after `510` and before `511`; lexical and numeric sorts both get this wrong.
- **`geographic_group` as a normalized entity** bakes a specific, Euro-centric
  regional taxonomy into the schema as if it were neutral ground truth.
- **`to_tsvector('english', …)`** will not survive a multilingual tale corpus,
  and no per-language configuration is specified.
- **dbt Core and the SQLAlchemy ORM** are both weight this project does not
  need. See §6.6.

---

## 4. Ranked risk register

Ranked by severity × likelihood. "Irreversible" means the cost is a
re-curation, not a migration.

| # | Risk | Severity | Likelihood | Reversible? |
|---|------|----------|------------|-------------|
| 1 | **Upstream rights invalidate redistribution.** TMI CSV and `trilogy` both derive from compilations plausibly still in copyright; their downstream license declarations cannot grant rights their compilers did not hold. | Critical — could void publication of the whole KB | High | No (project-level) |
| 2 | **Edition/concept conflation in `tale_type`** (§3.1). Every FK points at a conflated entity. | Critical | High if unaddressed | **Irreversible** |
| 3 | **Derived data laundered as stated** (§3.7, §5.2). `atu_seq` ordering and any transcribed association presented as source-asserted fact. | Critical to credibility | High | Partly — re-derivable if raw is kept |
| 4 | **Dual write paths, assertion vs typed tables** (§3.2). | High | Certain if built as specified | Yes, but costly once populated |
| 5 | **Curation burden exceeds capacity** (§3.8). Review queue grows unbounded; publication either stalls or ignores review. | High | High | Yes |
| 6 | **EU/UK sui generis database right.** Distinct from copyright; protects substantial investment in a compilation even where individual facts are unprotectable. ATU is published in Finland. | High | Medium — **uncertain**, see §6.7 | No |
| 7 | **Offensive terminology published unframed** (§3.9). | High (reputational, ethical) | High if unhandled | Yes |
| 8 | **Fake-precision confidence propagates downstream** (§3.4). | Medium-high | High | Yes |
| 9 | **Source disappearance destroys license evidence.** GitHub datasets vanish; a license asserted in a since-deleted README leaves no proof of the right you relied on. | Medium-high | Medium | No, once gone |
| 10 | **Code canonicalization errors** (§3.10) corrupt joins silently — a mis-parsed `327A + 328` becomes a wrong edge, not an error. | Medium | High | Yes, if raw is immutable |
| 11 | **Source lock-in to `trilogy`'s shape.** Modeling `core` around `atu_df`'s columns makes a second ATU source expensive to add. | Medium | Medium | Yes |
| 12 | **Multilingual search inadequacy.** | Low-medium | Medium | Yes |
| 13 | **Stack overhead (dbt, ORM).** | Low | Medium | Yes |

The ranking has a clear implication for sequencing: risks 1 and 6 are *legal*,
*upstream*, and *unfixable by good engineering* — yet the proposal's phase order
addresses them last (Phase 4). §8 inverts this.

---

## 5. Source-by-source assessment

Each source is classified as **authoritative** (may set a canonical value),
**source-specific assertion** (recorded and attributed, never canonical alone),
or **reference-only** (consulted by humans, never ingested).

### 5.1 Thompson Motif Index CSV

| | |
|---|---|
| **Usefulness** | High. Motif codes, labels, and hierarchy are the KB's most tractable content and a genuinely good architecture test. |
| **Limitations** | The TMI is a *finding aid*, not a semantic ontology. Motifs are inconsistently granular, the category boundaries reflect 1930s assumptions, and coverage skews heavily toward European and North American material. |
| **Data quality** | Expect encoding damage, inconsistent bibliographic abbreviations, and hierarchy references to codes that do not exist as rows. |
| **Licensing** | **Uncertain, and it matters.** The revised edition was published 1955–58. US works of that period required renewal; if renewed, protection runs 95 years from publication. A CSV transcription is a derivative of that compilation, and a permissive license applied by the transcriber cannot convey rights the transcriber did not hold. **Resolving evidence:** the renewal record in the Catalog of Copyright Entries (or the Stanford Copyright Renewal Database) for the 1955–58 edition, plus the transcriber's own statement of what they transcribed from. |
| **Verdict** | **Authoritative for codes, labels, and hierarchy** — *conditional on the renewal question*. Bibliographic notes and extended annotations are the thicker, more clearly copyrightable content: treat as **source-specific assertion**, and gate redistribution separately. |

### 5.2 `trilogy` datasets

| Dataset | Verdict | Reasoning |
|---|---|---|
| `atu_df` | **Source-specific assertion** — not canonical | Derives from Uther (2004), which is unambiguously in copyright. Useful and probably accurate; its accuracy is not the issue. |
| `atu_seq` | **Source-specific assertion, marked `inferred`** | Uther lists motifs per type largely *without* narrative ordering. A `sequence_position` column therefore encodes ordering that the underlying authority may not assert. **Uncertain — resolving evidence:** `trilogy`'s own documentation of how `atu_seq` was constructed. If the order is derived, storing it as a stated fact is exactly the laundering described in §3.7. |
| `atu_combos` | **Source-specific assertion** | Co-occurrence is a statistical claim about a corpus. It needs the corpus and the method attached, or it is a number without a referent. |
| `aft` | **Assertion + reference-only text** | Annotations are usable; the tale texts carry their own separate rights. |
| `tmi` | **Redundant** with 5.1 — pick one and record the other as a cross-check, don't ingest both as peers. |

The general principle: **`trilogy` is excellent scaffolding and a poor
authority.** Its value is that it lets you build and test the pipeline without
touching the books. Its limitation is that everything in it is a transcription
of something else, so a citation chain that stops at `trilogy` is incomplete by
construction.

### 5.3 Published ATU volumes

**Reference-only for Version 1.** The proposal's conclusion is correct and
should be held firmly. "Open access" describes *reading*, and reading rights
have almost nothing to do with extraction, transformation, redistribution, or
commercial reuse rights.

Note the asymmetry that should drive scope: ATU *codes and canonical titles* are
short factual identifiers with thin copyright protection at most. Uther's
*summaries, editorial apparatus, and bibliographic essays* are the creative work
— and they are also the most tempting content. The parts you most want are the
parts you most clearly may not take.

### 5.4 Wikidata (P2540) — missing from the proposal, and it should not be

**Authoritative, and the correct spine for tale-type identity in Version 1.**

Wikidata is CC0. That single fact makes it the only proposed-or-unproposed ATU
source with no rights question attached. It carries ATU identifiers, labels in
many languages (addressing the multilingual requirement for free), stable
Q-identifiers, and links to Wikisource texts.

Its limitations are real and manageable: coverage is incomplete, quality is
uneven, and it is community-edited, so a version pin and checksum are
mandatory. But "incomplete and CC0" beats "complete and unpublishable" for a
project whose deliverable is a *redistributable* database.

That this source is absent from the proposal is notable given that this
repository already relies on it — see `lib/atu-index.ts:9-11`.

### 5.5 Other sources worth registering

| Source | Verdict | Note |
|---|---|---|
| **Multilingual Folk Tale Database** (mftd.org) | Requires review | Genuinely multilingual with ATU annotations; terms need reading before any ingestion. |
| **Project Gutenberg / Wikisource** | Authoritative for tale *texts* | Public-domain collections (Grimm, Lang, Afanasyev in old translations). The cleanest path to real tale examples. Watch for modern translations still in copyright. |
| **Ashliman's Folktexts** | **Reference-only** | Widely and wrongly assumed open. It is a personally maintained compilation; some translations are Ashliman's own work. Do **not** ingest without explicit permission. |

---

## 6. Revised architecture

Changes are ordered by how expensive they are to defer.

### 6.1 Split tale-type identity into record and concept

Replace the single `core.tale_type` with two entities and a concordance.

```
core.edition
  edition_id, label,              -- 'AT-1961', 'ATU-2004', 'KHM', 'Baughman'
  source_version_id, publication_year

core.tale_type_record             -- what ONE edition says. Never merged.
  record_id, edition_id,
  code_raw,                       -- verbatim, e.g. '327A + 328'
  code_canonical, code_sort_key,
  concept_id NULL,                -- FK; NULL until resolved
  source_version_id, source_locator

core.tale_type_concept            -- project-minted stable identity
  concept_id, minted_at, notes
  -- deliberately thin: it carries NO code, NO title, NO status

core.tale_type_concordance        -- edge-level change, with a source
  from_record_id, to_record_id,
  relation,                       -- same_as | split_into | merged_into
                                  -- renumbered_to | partial_overlap
  source_version_id, source_locator,
  derivation, review_status
```

What this buys, concretely:

- **AT 313 → ATU 313A/B/C** is three `split_into` rows, each independently
  sourced. Nothing is overwritten and nothing is invented.
- **"Which edition supplied this?"** is answered by construction rather than by
  a column that must be remembered.
- **`tale_type_motif` and friends hang off `record_id`**, not a conflated
  entity — so a motif association is always scoped to the edition that asserted
  it. This is the property that makes the model migratable later; the proposed
  model does not have it.
- **`tale_type_concept` carries no attributes at all.** Every attribute belongs
  to a record, because every attribute came from an edition. A concept is an
  identity, not a merged summary. This is the discipline that keeps the split
  from silently collapsing back.

Answering the proposal's question directly — *stable entities or edition-bound
records?* — **both, in two layers, and the layers must not share columns.**

### 6.2 One write path: typed tables, with `assertion` as a view

- **Typed relation tables are the sole write target** for known predicates.
  They get foreign keys, real indexes, `NOT NULL`, and queries a human can read.
- **`publish.assertion` becomes a view** — a `UNION ALL` projection over the
  typed tables into subject/predicate/object shape, for generic traversal,
  audit, and RDF-ish export. Derived, therefore incapable of disagreeing.
- **A narrow `core.assertion_staging` table survives** as an escape hatch for
  predicates that have no typed table yet, with a promotion rule written into
  the contributing guide: *a predicate that exceeds a few hundred rows, or
  survives one release, gets a typed table.* Without a promotion rule, escape
  hatches become the architecture.

Answering the proposal's question — *are polymorphic subject/object fields
advisable?* **Not as a write path.** As a read projection, they are useful and
safe.

Correspondingly: drop `canonical_title` from the record and add
`preferred_name_id` (FK → `tale_type_name`). The preferred title then *is* a
sourced row, and "why this title?" resolves to a citation rather than an
assertion.

### 6.3 Provenance: keep it field-level, and make it honest about chains

Field-level provenance is the right target and is already achievable — the
proposal's own design puts multi-valued fields (`tale_type_name`,
`tale_type_description`) in their own tables, where each row carries its own
`source_version_id` and `source_locator`. That *is* field-level provenance, and
it costs nothing extra. Do not build an EAV layer to achieve what the relational
model already gives you.

Three additions:

**Derivational lineage.** `source_version` has `supersedes_version_id` (temporal)
but needs `derives_from_source_version_id` (derivational), so a citation can
render `trilogy/atu_seq → Uther 2004 → Aarne-Thompson 1961`. Pair it with an
evidence kind:

```
core.assertion_evidence
  ..., evidence_kind    -- direct | transcribed_from | inferred_from
```

**Replace `confidence` with ordinals.** Two non-nullable columns on every
relationship:

```
derivation     -- stated | curated | inferred      (where did this come from?)
review_status  -- unreviewed | accepted | rejected | disputed
```

Non-nullable matters: a consumer must be *unable* to receive an edge without
knowing whether a human ever asserted it. Reintroduce a numeric score only for
methods that emit a calibrated one, in a separate, clearly-named column.

**Retraction, not deletion.** Add `core.retraction (entity_type, entity_id,
retracted_at, reason, superseded_by)`. A value that was published and later
found wrong must be removable *while leaving a record that it existed* —
otherwise downstream consumers who cached it have no way to learn they should
not have.

### 6.4 Three gates, not one

Replace "the rights register precedes ingestion" with three explicit gates:

| Gate | Permits | Requires |
|---|---|---|
| **Acquire** | Download, checksum, preserve to a quarantine artifact store. No parsing, no `core`, no exposure. | Nothing. You must fetch the artifact to read its license. |
| **Ingest** | Parse into `raw`, normalize into `core`. | A rights-register entry with a *reviewed* license and status `approved_for_ingestion`. |
| **Publish** | Appear in `publish.*`, the API, or any export. | Computed `effective_license` permitting redistribution, **mechanically enforced** by the export path. |

This makes Phase 0 implementable, and it puts the enforcement where it belongs —
at publication, which is the only point where a rights error becomes a rights
problem.

### 6.5 Three label kinds, and a content advisory flag

Answering the proposal's question about canonical / preferred / source-specific /
display labels — the four-way distinction is right but incomplete, because it has
no way to hold §3.9:

```
source_label     -- verbatim from the source. Immutable. Never rendered by default.
display_label    -- project-authored, safe to render. Its own provenance: 'editorial'.
preferred_label  -- a POINTER to whichever sourced label wins, not a copy.
content_advisory -- flag + reason on motif, category, and tale
```

The API returns `display_label` by default and `source_label` only on explicit
request (`?labels=source`), with the advisory attached. This satisfies both
constraints at once: the historical record is preserved unaltered, and a casual
consumer of the API does not get handed a slur. Neither policy alone can do
that; only the schema can.

### 6.6 Postgres specifics

- **Derive the motif hierarchy from the codes.** Parse `D672` → path
  `D.D600.D672`, store it in an **`ltree`** column, and add a validation that
  the materialized hierarchy matches the parse. Subtree browse becomes
  `path <@ 'D'` — an index scan instead of a recursive CTE over a table that
  might disagree with its own identifiers. Keep the edge table only for genuine
  exceptions and cross-references.
- **Add `unaccent` and per-language FTS configurations.** Store a `language_code`
  next to every searchable text and pick the `tsvector` configuration from it.
- **`pg_trgm` on titles** for fuzzy lookup — correct as proposed.
- **Drop dbt Core.** It introduces a second modeling language and a build system
  for what is a handful of transformations. Alembic for schema plus pytest with
  SQL assertions covers it. Revisit if the transformation count grows past what
  one person can hold in their head.
- **Prefer psycopg + explicit SQL + Pydantic at the boundaries** over the
  SQLAlchemy ORM. This is an ingest-and-read-only-API shape where SQL *is* the
  model; an ORM mostly adds a layer to see through. (SQLAlchemy Core for query
  construction is fine.)
- **Confirmed: no graph database, no vector store, no Elasticsearch.** At this
  scale the proposal's judgment is correct.

### 6.7 What the rights register must store

Extending the proposal's list with the fields that experience says get missed:

```
-- Distinguish what is claimed from what was checked
license_asserted_spdx        license_reviewed_spdx
license_asserted_evidence    -- artifact_id of the LICENSE/README AS RETRIEVED
reviewed_by, reviewed_at, review_reasoning

-- The rights that are actually distinct from each other
reading_ok, extraction_ok, transformation_ok,
redistribution_ok, commercial_ok, share_alike_required,
attribution_text_required

-- The two that most projects forget
upstream_rights_status       -- what does THIS source derive from, and
                             -- did its compiler hold the rights it granted?
database_right_status        -- EU/UK sui generis right: protects substantial
                             -- investment in a compilation independently of
                             -- copyright in its contents. UNCERTAIN and
                             -- jurisdiction-dependent; ATU is published in
                             -- Finland, so this needs professional review.
open_questions               -- free text; must be empty to reach 'approved'
```

`license_asserted_evidence` is the field that survives §4 risk 9: snapshot the
license text *and the repository state that contained it*, not just the data
file. A license you can no longer prove was granted is a license you do not
have.

**Combining differently-licensed sources** deserves its own register field.
Share-alike obligations are contagious; a single CC-BY-SA source can determine
the license of any output it materially contributes to. The `effective_license`
computation must therefore run over the *set* of sources contributing to a
record, not each source independently. This is the mechanism behind acceptance
criterion #12, and nothing in the proposed model implements it.

### 6.8 Ingestion gates and failure behavior

The proposal's Acquire → Profile → Normalize → Resolve → Publish flow is sound.
What it lacks is defined failure behavior at each step. Concretely:

| Gate | Check | On failure |
|---|---|---|
| Acquire | Checksum differs from last run | **Halt.** An unannounced upstream change is never routine. |
| Parse | Row count deviates > 2% from previous version | **Halt**, emit a diff report. Catches silent truncation — the failure mode that looks like success. |
| Parse | Any row fails code-grammar validation | **Quarantine the row**, continue. Publish the quarantine count in the validation report. |
| Normalize | Canonicalization is not idempotent (`f(f(x)) ≠ f(x)`) | **Halt.** A non-idempotent normalizer corrupts data on every re-run. |
| Resolve | Match confidence below threshold | **Route to review queue.** Never auto-merge. |
| Resolve | A previously-resolved entity resolves differently | **Halt.** This is how identity silently drifts between runs. |
| Publish | Any record's `effective_license` forbids redistribution | **Exclude the record**, log it, continue. |
| Publish | Validation suite fails | **Abandon the build.** The previous `publish` stays live. |

That last row is acceptance criterion #14, and it needs a mechanism the proposal
never names: **build `publish_v{n}` as a fresh versioned schema, validate it, and
repoint the `publish` alias in a single transaction.** Atomic swap, trivial
rollback, and a failed run cannot degrade a good dataset — it simply never
becomes live.

Add **differential testing between source versions** as a first-class artifact:
every ingestion emits a diff against the prior version (entities added, removed,
changed, re-resolved). Re-classification is the signal this project exists to
capture; it should not require a query to notice.

### 6.9 A minimal, stable API contract

```
GET /v0/motifs/{code}                        motif + hierarchy path + provenance
GET /v0/motifs?q=&under=&lang=               search; `under` = ltree subtree
GET /v0/tale-types/{code}                    ?edition= (default: latest resolved)
GET /v0/tale-types/{code}/motifs             ?derivation=&review_status=
GET /v0/tale-types/{code}/concordance        the edition history of this concept
GET /v0/tale-types?q=&category=&edition=
GET /v0/concepts/{id}                        all edition records for one concept
GET /v0/sources                              the rights register, as data
GET /v0/attribution?for=                     machine-readable attribution report
GET /v0/export/{entity}.jsonl                license-filtered bulk export
```

Three contract rules, each carrying a finding from above:

1. **Every value-bearing response embeds its provenance** — `source`,
   `source_version`, `locator`, `derivation`, `review_status`. Not on a separate
   endpoint, not opt-in. Provenance a consumer can forget to ask for is
   provenance that will be dropped.
2. **`/v0/` is explicitly unstable**, and says so in a response header. Build
   the API early — it is the forcing function that reveals whether the model is
   actually queryable — but do not promise a contract before reconciliation is
   mature.
3. **Exports are license-filtered server-side.** A consumer cannot request the
   restricted fields into existence.

---

## 7. Revised MVP

The smallest build that proves or disproves the architecture.

### In

| Component | Why it earns its place |
|---|---|
| Source & rights register, with the three gates (§6.4) | Tests the licensing spine before anything depends on it |
| TMI motifs: `raw` → `core` → `publish` | Exercises **one hierarchy** (§6.6, `ltree`) |
| Tale-type records from **Wikidata P2540 (CC0)** | Exercises identity on material with no rights question |
| `trilogy/atu_df` as a **second, non-canonical source** | Exercises *conflicting sources for the same field* — the single most important architectural test in the project |
| `tale_type_record` / `concept` / `concordance` (§6.1) | The irreversible decision. Must be in v1. |
| Type↔motif edges from `atu_seq`, marked `inferred` | Exercises **one many-to-many** |
| Code grammar + parser + versioned test corpus | Prevents §4 risk 10 |
| Field-level provenance + derivational lineage (§6.3) | The product's reason to exist |
| `/v0/tale-types/{code}` and `/v0/motifs/{code}` | **One consumer interface** |
| Atomic publish swap + the §6.8 gates | Acceptance criterion #14, mechanized |
| Review queue **as data** (table + views + CSV round-trip) | Workflow without a UI project |

Ingesting Wikidata and `trilogy` *both* is the deliberate centerpiece. A
provenance architecture that has never held two sources disagreeing about one
title has not been tested at all — it has only been described.

### Out

| Deferred | Reason |
|---|---|
| Annotated tale examples (`aft`, corpora) | Heaviest licensing burden, largest volume, least architectural novelty. v1.1. |
| Tale-type relation taxonomy — all eight kinds | Keep `combined_with` from `atu_combos` only. The rest await sources that actually assert them. |
| `necessity` | §3.5. Not deferred — **removed**. |
| Numeric `confidence` | §3.4. Removed in favor of ordinals. |
| `geographic_group`, `collector`, `bibliographic_work` as normalized entities | Keep as source-scoped assertions. Normalizing them prematurely encodes one edition's worldview as the schema's. |
| All book-derived content | Phase 4 at the earliest, and only after §6.7 clears. |
| The editorial *interface* | The workflow ships in v1; the UI is indefinite. |
| Everything on the proposal's own exclusion list | Correctly excluded. Hold the line. |

The reduced MVP satisfies every criterion the proposal set for it — provenance,
licensing metadata, one hierarchy, one many-to-many, one consumer interface,
repeatable ingestion and validation, no generator dependency — and adds the
conflicting-sources test the original list omitted.

---

## 8. Revised implementation sequence

Answering the proposal's sequencing questions directly:

**Is motif-first the best vertical slice?** Yes for *implementation* — TMI codes
are self-describing, hierarchical, and tractable. No for *design*. Tale-type
identity (§6.1) is the harder and irreversible modeling problem, and the
proposal freezes the architecture around motifs before confronting it.
**Design type identity first; implement motifs first.**

**Should the rights register precede any download?** No — that is a deadlock
(§3.3). Acquisition may precede it; ingestion and publication may not.

**Should the editorial interface arrive earlier?** The *workflow* yes, from
Phase 1. The *interface* no — possibly never. A review queue table with SQL
views and a CSV round-trip is adequate curator tooling for years, and it is a
week of work rather than a project.

**Should the API precede mature reconciliation?** Yes. It is the only reliable
test of whether the model can answer the questions it was built for. Ship it as
`/v0/`, marked unstable.

**When should book-derived data be considered?** After §6.7 clears, and not
before. If it never clears, the KB is still a useful product — which is the test
of whether the layering is right.

**What should be deferred until the generator needs it?** Everything on the
proposal's exclusion list, plus `necessity`, motif sequence *semantics* (as
opposed to recorded sequence data), and any notion of "beats." If the generator
later needs a required-motif signal, it belongs in the generator's own editorial
layer — never in `core`.

### Revised phases

| Phase | Contents | Exit criterion |
|---|---|---|
| **0. Rights & identity design** | Rights register schema + the three gates; **acquire** artifacts to quarantine; code grammar + test corpus; tale-type identity model on paper with fixtures | Every proposed source has a register row; the identity model survives a written walkthrough of an AT→ATU split |
| **1. Motif slice** | TMI raw → core → publish; `ltree` hierarchy; provenance spine; validation gates; atomic swap; `/v0/motifs/*`; review queue as data | Fresh DB from one command; every published value traces to artifact + locator |
| **2. Tale-type identity** | Wikidata CC0 records; concept + concordance; **then** `trilogy/atu_df` as a conflicting second source; `/v0/tale-types/{code}` | The API shows two sources disagreeing about one title, each cited, neither overwritten |
| **3. Type↔motif edges** | `atu_seq` (marked `inferred`), `atu_combos`; derivational lineage rendering | A citation renders the full chain, not just the immediate source |
| **4. Annotated tales** | Openly-licensed corpus; license-aware text exposure | Export path mechanically refuses restricted text |
| **5. Book-derived content** | Only if §6.7 clears | — |

The key change from the proposal: **the legal risk moves from Phase 4 to Phase
0**, and the *irreversible* modeling decision moves from implicit to Phase 0.
The proposal's ordering discovers both at the point where they are most
expensive.

---

## 9. Readiness checklist

### Required before writing code

- [ ] Tale-type identity model decided — record/concept/concordance (§6.1)
- [ ] Assertion layer decided — typed tables as sole write path (§6.2)
- [ ] ATU + motif code grammar written, with a versioned test corpus covering
      suffixes, ranges, compound codes, and `cf.` references
- [ ] `derivation` and `review_status` vocabularies fixed; `confidence` removed
- [ ] The three gates defined (§6.4)
- [ ] Named reviewer, and a decision on what happens to unreviewed rows
- [ ] Decision recorded: what does this project do if the TMI renewal question
      resolves badly?

### Required before first ingestion

- [ ] Rights register populated for every source, `open_questions` empty
- [ ] `license_asserted_evidence` artifacts snapshotted (license text **and**
      repo state), not merely linked
- [ ] TMI 1955–58 renewal status researched and recorded
- [ ] `trilogy` compilation provenance documented — what was `atu_seq` derived
      from, and is its ordering asserted or inferred?
- [ ] Artifact store with checksums; raw layer immutable and enforced (revoke
      UPDATE/DELETE on `raw.*`)
- [ ] Validation gates and failure behavior implemented (§6.8)
- [ ] Idempotency test: two consecutive runs produce identical `core`

### Required before publication

- [ ] `effective_license` computed per record, over the *set* of contributing
      sources, enforced in the export path
- [ ] Atomic publish swap with rollback, demonstrated by a deliberately failed
      build
- [ ] `source_label` / `display_label` split and `content_advisory` implemented
      (§6.5)
- [ ] Machine-readable attribution report (criterion #10)
- [ ] Inferred content visibly distinguished in every API response (criterion
      #13)
- [ ] Retraction mechanism (§6.3)
- [ ] Rebuild determinism verified: same artifacts + same code version → same
      publish layer
- [ ] Professional review of the database-right and upstream-rights questions

### Required before downstream generator use

- [ ] Stable `/v1/` contract with a deprecation policy
- [ ] Published version identifiers (`atu-kb-2026.1`) and a changelog
- [ ] Documented guidance that `publish` is the only supported surface
- [ ] Confirmation that no generator-specific field entered `core` (criterion
      #11)

### Safe to defer

- [ ] Editorial web UI — CSV round-trip is sufficient
- [ ] Vector search, graph store, Elasticsearch
- [ ] `geographic_group`, `collector`, `bibliographic_work` as normalized
      entities
- [ ] Community contribution workflow
- [ ] Full tale corpora
- [ ] dbt (adopt only if transformation count outgrows plain SQL)

---

## 10. Final recommendation

**Split decision, because the project has two halves with different risk
profiles:**

> **Run a smaller proof of concept** on the portion whose rights are not in
> question (TMI structure + Wikidata CC0 + the provenance spine), **while
> pausing the ATU-derived portion pending source-rights clarification.**

A single verdict would be misleading here. "Proceed with minor changes"
understates §3.1 and the licensing exposure. "Redesign before implementation"
overstates it — the architecture is mostly right, and three targeted changes fix
it. The honest answer is that the clean half should start now and the encumbered
half should wait for evidence, and the layering in §6 is precisely what makes
that separation possible.

### The five changes to make before implementation begins

1. **Split `tale_type` into record + concept + concordance** (§6.1). The only
   irreversible item on this list. Everything else is a migration; this one is a
   re-curation.
2. **Choose one write path — typed tables — and demote `assertion` to a view**
   (§6.2). Two sources of truth for the same fact is not a provenance
   architecture.
3. **Resolve the upstream rights questions before building on those sources**
   (§5.1, §5.2, §6.7): the TMI renewal record, `trilogy`'s compilation
   provenance, and the EU/UK database-right question. Meanwhile, **make Wikidata
   CC0 the tale-type spine** so progress is not hostage to the answers.
4. **Replace `confidence` with non-nullable `derivation` + `review_status`, and
   delete `necessity`** (§3.4, §3.5, §6.3). Fake precision and a generator
   requirement in folklore clothing.
5. **Add derivational lineage and the three acquire/ingest/publish gates**
   (§6.3, §6.4). Without lineage, citations stop at the convenient source rather
   than the real one; without the gates, Phase 0 is unimplementable and will be
   quietly skipped.

---

## Appendix: relationship to this repository

This assessment sits in the `bedtime-tale-type-generator` repo, so the boundary
with the existing app is worth stating explicitly. It also happens to be a
useful test of §6's layering.

**What the KB should not touch.** `lib/tale-types.ts` holds 12 featured types
with authored `beats`, `signatureElements`, `tone`, and `exampleOpener`. That is
original creative content written for bedtime delivery — not folklore data, and
nothing a provenance model should try to hold. The same goes for the `blurb`
fields across the 53 catalogue entries in `lib/atu-index.ts`: that they are
deliberately *not* Uther's summaries (`lib/atu-index.ts:9-11`) is a licensing
feature, not a gap to be closed by better data.

**What the KB could feed.** The factual catalogue fields — ATU number, canonical
title, category — are exactly the thin-copyright layer identified in §5.3. The
right integration is a **build-time generated snapshot**: a
`scripts/sync-atu-index.ts` that pulls a license-filtered export and regenerates
the `EXTRA_TYPES` array, keeping the app's zero runtime dependency on Postgres.
The existing `tests/unit/atu-index.test.ts` and `tests/unit/tale-types.test.ts`
become the guardrail on the generated file.

**Where bedtime-safety lives.** In this repo, not in the KB. The app's curated,
bedtime-safe slice is an editorial judgment layered on top of the folklore
record — the KB's job is only to expose enough signal (category, motif codes,
`content_advisory` from §6.5) for a downstream consumer to compute a safety
flag. This is the same separation acceptance criterion #11 asks for, seen from
the consumer's side: the KB stays neutral about what a child should hear, and
the app stays opinionated.
