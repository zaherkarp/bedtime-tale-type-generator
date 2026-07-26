# ATU knowledge base — decisions and readiness

The decisions taken while implementing `docs/atu-kb-assessment.md`, and the
current state of its §9 readiness checklist.

> **Nothing here is legal advice.** The two upstream rights questions the
> assessment raises are *not* resolved by this implementation. They are recorded
> as data in the rights register, surfaced verbatim by `GET /v0/sources`, and
> listed below with the evidence that would settle them. They need a
> professional review before any publication decision.

---

## 1. The five changes §10 asks for, and where they live

| # | Change | Where |
|---|---|---|
| 1 | Split `tale_type` into record + concept + concordance | `kb/migrations/sql/0001_initial.sql`, `kb/atukb/ingest/tale_types.py` |
| 2 | One write path — typed tables; `assertion` demoted to a view | typed tables in `core`, `publish.assertion` built in `kb/atukb/publish/build.py` |
| 3 | Resolve upstream rights; make Wikidata CC0 the spine | §3 below; `kb/data/rights_register/*.yaml`; Wikidata ingested first in `kb/atukb/ingest/pipeline.py` |
| 4 | Replace `confidence` with `derivation` + `review_status`; delete `necessity` | enum types in the migration; absence asserted by `kb/tests/test_schema.py` |
| 5 | Add derivational lineage and the three gates | `kb/atukb/ingest/lineage.py`, `kb/atukb/rights/gates.py` |

## 2. Decisions that go beyond the assessment

**Publication decisions belong to a field class, not to a source.** §5.1 gates
the Motif-Index's structural data and its bibliographic annotations separately —
"treat as source-specific assertion, and gate redistribution separately" — which
a single per-source `gate_status` cannot express. So `SourceRights.publication`
is a map from field class to decision, every provenance-bearing row in `core`
records the class it came from, and `effective_license` runs over the set of
`(source, field_class)` contributions to a record.

**Attestation is its own table.** Wikidata and trilogy both report ATU 510A.
They are two witnesses to one edition's record, not two records, so
`core.tale_type_attestation` holds one sourced row per witness. Putting "who
says this exists" in a column on the record would have forced the second source
to arrive to overwrite the first — the exact failure §6.1 is about, one level
down.

**The motif path has no "tens" level.** §6.6's worked example is `D672` →
`D.D600.D672`, and building the extra level was a mistake worth recording: the
printed sections are variable-width (`A70. Creator – miscellaneous` runs to
A99), so a decade bucket derived from the code is not the index's own section,
and a level derived from the *heading* would make the path depend on a column
that can disagree with the identifier. The path stays a pure function of the
code; the headings are kept as an independent witness that validates it.

**`raw` immutability is a statement-level trigger, not a grant.** §9 says to
revoke UPDATE/DELETE, but the table owner bypasses grants. The trigger is
statement-level rather than row-level so that an UPDATE matching nothing is
still refused — otherwise the guarantee is "immutable when populated".

**The API's label default is the safe one.** `display_label` unless
`?labels=source` is passed, with the content advisory attached either way
(§6.5).

**The Wikidata spine is restricted to `P31 = tale type (Q47451145)`.** P2540 is
carried by individual stories as well as by the types themselves — "this tale is
an instance of ATU 500" — and roughly a third of the property's subjects are
instances. Without the filter the spine takes a variant's title as the type's
canonical title, and ATU 500 comes back as "Whuppity Stoorie" rather than
"Rumpelstiltskin". Tale *examples* are deferred to v1.1 (§7 Out).

**The app gets a `canonical` field rather than an overwritten `title`.** The
Appendix proposes regenerating the catalogue's factual fields, and running that
the first time is what showed the two fields are genuinely different: the
canonical title of ATU 328 is "The Boy Steals the Ogre's Treasure" and of ATU
500 "The Name of the Supernatural Helper". Both are correct; neither is what you
say to a five-year-old. So `npm run sync:atu` writes a separate generated file,
`lib/atu-canonical.ts`, carrying the canonical title with its source, licence
and a `disputed` flag, and the hand-authored `title` stays untouched. This is the
same source-label/display-label split §6.5 makes inside the knowledge base,
applied one layer out — and it means the generator never rewrites authored
lines, so no regex can quietly mangle curated content.

**`publish.tale_type.title_disputed` is a first-class field.** It is true while
the review queue holds an unresolved disagreement about a code's English title.
A consumer with its own editorial voice needs to tell "the sources agree" apart
from "we picked one", and without the flag a generated title looks equally
settled either way.

## 3. The open rights questions

Both are recorded in the register with `upstream_rights_status: unresolved` and
non-empty `open_questions`, and both are visible in the API and in
`kb/export/attribution.json`.

### 3.1 Thompson Motif-Index, 1955–58 revised edition

`tmi_mellmann` is CC-BY-4.0 as a transcription. That license governs the
transcription; it cannot convey rights in the underlying compilation that the
transcriber did not hold.

- **Question:** was the 1955–58 revised edition's copyright renewed? If it was,
  protection runs 95 years from publication.
- **Resolving evidence:** the renewal record in the Catalog of Copyright Entries,
  or the Stanford Copyright Renewal Database, for the six volumes.
- **What is published anyway, and why:** codes, short labels and the hierarchy
  the codes encode — the thin factual layer §5.3 identifies. The
  `annotations` field class (the `bibliographies` column) is `withheld`, is never
  normalised into `core`, and could not be published even if it were.
- **§9's required decision — what if it resolves badly?** Set
  `redistribution_ok: false` in `kb/data/rights_register/tmi_mellmann.yaml` and
  rebuild. Every motif-contributed record leaves `publish` and every export on
  the next `atukb publish`, with no code change. The data stays in `core` and
  `raw` for the reviewer; only the published surface changes. The knowledge base
  is still a useful product with Wikidata alone, which is the test of whether the
  layering is right.

### 3.2 `trilogy`, and Uther 2004 behind it

`trilogy` is CC-BY-SA-4.0 and states its contents are "either in the public
domain, or permissions have been granted by the copyright holder". That is
recorded as the licensor's *assertion*, not accepted as evidence.

- **Questions:** did trilogy's compiler hold the rights it grants over
  Uther-derived content? How was `atu_seq` constructed — is its motif ordering
  asserted or inferred? Was any Ashliman-derived text carried into `atu_df`?
  Does the EU/UK sui generis database right attach to the Uther compilation?
- **What is published:** ATU numbers, short tale names and motif-code
  associations. `tale_type`, `remarks`, `litvar` and `provenance` — Uther's
  summaries and editorial apparatus — are withheld from `core` entirely.
- **What is marked inferred:** every `atu_seq` edge, with
  `derivation = 'inferred'` and `evidence_kind = 'inferred_from'`, enforced by a
  publish validation that fails the build if any such edge is presented as
  stated.
- **The pause switch:** setting `redistribution_ok: false` in
  `kb/data/rights_register/trilogy.yaml` removes every trilogy-contributed record
  from `publish` and from every export. This is §10's "pause the ATU-derived
  portion" made operable, and it is tested in
  `kb/tests/test_rights.py::test_flipping_redistribution_empties_the_source`.

### 3.3 Sources deliberately not ingested

- **Ashliman's Folktexts** — reference-only (§5.5). Widely and wrongly assumed
  open; some translations are Ashliman's own work. No register entry, so no gate
  can evaluate it, so nothing can ingest it by accident.
- **The published ATU volumes** — reference-only for Version 1 (§5.3). Present
  in `core.source_version` as *bibliographic* ancestors so citations can name
  them, with no artifact and nothing retrieved.
- **`trilogy/tmi`** — redundant with `tmi_mellmann` (§5.2). Not ingested as a
  peer.

## 4. §9 readiness checklist

### Required before writing code

- [x] Tale-type identity model decided — record/concept/concordance
- [x] Assertion layer decided — typed tables as sole write path
- [x] ATU and motif code grammars written, with a versioned test corpus covering
      suffixes, ranges, compound codes and `cf.` references
      (`kb/data/code_corpus/`)
- [x] `derivation` and `review_status` vocabularies fixed; `confidence` removed
- [x] The three gates defined
- [ ] **Named reviewer.** The register records `reviewed_by: repository
      maintainer`, which is a placeholder for a person, not a person. Unreviewed
      rows *are* published, labelled `unreviewed`, and a consumer can filter on
      it — the honest option of the two §3.8 offers.
- [x] Decision recorded for a bad TMI renewal outcome (§3.1 above)

### Required before first ingestion

- [ ] `open_questions` empty for every source — **deliberately not met**; see §3
- [x] `license_asserted_evidence` artifacts snapshotted (license text and the
      README as retrieved), not merely linked
- [ ] TMI 1955–58 renewal status researched and recorded — **open**
- [ ] `trilogy` compilation provenance documented — **open**
- [x] Artifact store with checksums; `raw` immutable and enforced
- [x] Validation gates and failure behaviour implemented
- [x] Idempotency test: two consecutive runs produce identical `core`

### Required before publication

- [x] `effective_license` computed per record over the *set* of contributing
      sources, enforced in the export path
- [x] Atomic publish swap with rollback, demonstrated by a deliberately failed
      build (`atukb publish --fail-validation`)
- [x] `source_label` / `display_label` split and `content_advisory` implemented
- [x] Machine-readable attribution report (`kb/export/attribution.json`)
- [x] Inferred content visibly distinguished in every API response
- [x] Retraction mechanism (`core.retraction`, honoured by the publish build)
- [x] Rebuild determinism verified
- [ ] **Professional review of the database-right and upstream-rights
      questions** — open, and the reason nothing here should be treated as a
      publication decision

### Required before downstream generator use

- [ ] Stable `/v1/` contract with a deprecation policy — `/v0` is marked
      unstable in a response header, as §6.9 requires
- [ ] Published version identifiers and a changelog
- [x] Documented guidance that `publish` is the only supported surface
- [x] Confirmation that no generator-specific field entered `core`
      (`kb/tests/test_schema.py`)

### Safe to defer — all deferred

Editorial web UI (CSV round-trip is sufficient), vector search, graph store,
Elasticsearch, `geographic_group`/`collector`/`bibliographic_work` as normalised
entities, community contribution workflow, full tale corpora, dbt.

## 5. Boundary with the bedtime app

The knowledge base holds no bedtime content and the app holds no folklore
provenance.

- `lib/tale-types.ts` — `beats`, `signatureElements`, `tone`, `exampleOpener` —
  is original creative content for bedtime delivery. The KB does not model it,
  and `kb/tests/test_schema.py` fails if a column resembling it appears in
  `core`.
- The `blurb` fields in `lib/atu-index.ts` are deliberately *not* Uther's
  summaries. That is a licensing feature. `scripts/sync-atu-index.ts` never
  touches them.
- Bedtime-safety is an editorial judgement that lives in this repo. The KB's job
  is only to expose enough signal — division, motif codes, `content_advisory` —
  for a consumer to compute a safety flag. The KB stays neutral about what a
  child should hear; the app stays opinionated.
