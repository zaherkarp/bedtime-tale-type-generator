# Procedural assembly: a combined Short/Dias architecture

Status: layers 1 and 3 are built, with one tale type's corpus and the audit gate.
The bake script exists but has never run against the live API. See **What building
it changed** at the end: four things in this document were wrong, and the
corrections are recorded there rather than quietly edited in above.

## What problem this solves

A GitHub Pages deployment cannot run `app/api/tale/route.ts`: Pages serves
static files, and the static-export guide in
`node_modules/next/dist/docs/01-app/02-guides/static-exports.md` lists route
handlers that read `Request`, and `cookies()`, as unsupported. Generation must
therefore move from request time to build time.

Baking whole finished stories works but fixes the prose: every child who picks
Cinderella at 6-8 / medium gets the same tale with a different name swapped in.
This document describes the alternative — bake *interchangeable fragments*, and
assemble a telling in the browser — and it does so by combining two bodies of
prior art rather than inventing one.

## The two sources, and what each contributes

**Bruno Dias, Improv** (written for *Voyageur*, a shipped commercial game whose
planet descriptions are recombined from hand-written loose sentences) supplies
the *selection engine*. Its vocabulary, which this design adopts verbatim so
that anyone who knows the prior art can read our code:

| Improv concept  | What it does                                                       |
| --------------- | ------------------------------------------------------------------ |
| `groups`        | A set of interchangeable `phrases` sharing a tag set               |
| `tags`          | Hierarchical markers, each an increasingly specific array          |
| filters         | Functions scoring groups against a world model                     |
| salience formula| How fuzzy the ranking is — top score only, or a band               |
| `bind`          | Freeze a snippet's first selection; later references reuse it      |
| `reincorporate` | Fold a chosen phrase's tags into the model, constraining later picks|
| `audit`         | Per-phrase usage counts, to find over- and under-used fragments    |

**Emily Short, *The Annals of the Parrigues*** and her survey of procedural text
in IF supply the *authorial altitude* and a layer Improv does not have. Two
points from that work drive this design:

1. Match author-written **paragraphs** to salient state. Do not assemble prose
   from clauses. Clause-level assembly is where seams and agreement bugs live.
2. Vary **what is narrated and in what order**, not only how it is worded.
   (Her Room Description Control is the worked example: selecting and ordering
   the information to narrate, rather than always narrating all of it.)

Those two pull against each other at one point, and resolving it is the central
decision here. Improv's machinery is perfectly capable of sub-sentence
composition; Short's advice is that you should not use it that way for prose
you want to read well.

### Decision: paragraph granularity, selection only

Fragments are whole paragraphs. The engine chooses between them and never
composes below the paragraph. Improv's apparatus is used for *selection,
binding and consistency*, never for grammar. Personal details (name, pronouns,
companion, setting) are substituted by a slot layer that the prose fragments
never have to agree with each other about.

## Three layers

### Layer 1 — Narration plan (Short)

A pure function: `(source, ageBand, length) → ordered slot list`. It decides
which beats are told, in what order, and how many expansion slots sit between
them. This is where perceived variety actually comes from, because omission and
reordering change meaning in a way that rewording does not.

The registries already carry the right distinction, and it differs by family:

- **ATU** (`lib/tale-types.ts`): `beats` is the causal spine. All of it plays,
  in order — that is what makes the tale recognisable as its type. The elastic
  is the number of expansion slots and which `signatureElements` get foregrounded
  in them.
- **Fables** (`lib/fables.ts`): the distinction is already explicit and
  documented. `coreBeats` play once, cleanly, and must not repeat for length;
  `expansionBeats` name exactly where growth is invited. The plan reads those
  fields directly rather than inferring anything.

Length drives slot count, not paragraph padding. This preserves the argument
already made in `lib/length.ts`: a fable gets to 1,450 words by building a
world around the kernel, never by re-staging the encounter four times.

### Layer 2 — Tagged fragment store (Dias)

Each slot resolves to a group of paragraph variants. Tag dimensions, each an
array from general to specific, per Improv's convention:

```
['slot', 'spine', '3']            the fourth spine beat
['slot', 'expansion', 'burrow']   a named expansion beat
['age', '6-8']
['tone', 'tender']                from TaleType.tone
['element', 'shimmering-gift']    foregrounds one signatureElement
['setting', 'forest']             selects a variant, rather than substituting text
['carries', 'helper']             introduces a continuity carrier
['concern', 'predation']          fable softening, so the choice is auditable
```

The `concern` dimension matters for review: `FableAdaptation` already records
`concerns`, `preserve`, `soften`, `substitute` and `remove` per fable precisely
so the judgement is reviewable in a pull request rather than delegated to the
model on every request. Tagging fragments with the concern they handle keeps
that property after the move to build time.

### Layer 3 — Seeded selection (Dias, made deterministic)

```
seed = hash(heroName + sourceId + ageBand + length + nonce)
```

Deterministic selection buys three things:

- **Reread.** The same seed replays the same telling, which is what small
  children actually ask for.
- **Cheap library.** A saved entry stores the seed, not the prose.
- **Testability.** Assembly is a pure function of (plan, store, seed).

Three mechanisms from Improv, applied:

- **`bind`** the things that must stay consistent: the helper's identity, the
  token, the companion, the weather. Chosen once at first use, referenced after.
- **`reincorporate`** so that choosing a variant tagged `['element',
  'shimmering-gift']` raises the score of later variants tagged for the same
  element. The telling accrues its own constraints as it proceeds. This is the
  primary defence against seams.
- **Deck draw, not independent random.** Used variant ids persist in
  `localStorage` per source, so a nightly reader exhausts a pool before any
  repeat. This is Ink's distinction between a cycle and a shuffle, and the cycle
  is the right one here: a parent reading every night notices a repeat long
  before they notice exhaustion.

## The oatmeal gate

Kate Compton's 10,000 bowls of oatmeal problem is the thing that would kill
this: ten thousand mathematically unique bowls, one perceived bowl of oatmeal.
Combination count proves nothing. Neither Short nor Dias had to mechanise this
check, because their fragments were hand-written and read as they were written.
Ours are generated in bulk, so the check has to be machinery.

A CI script generates N tellings per source and fails the build on:

- **Dead fragments.** Any variant that never fires across N tellings — a tag
  set unreachable under any plan, which is a data bug.
- **Dominant fragments.** Any variant firing above a threshold share, meaning
  its group is effectively one phrase.
- **Distinctness floor.** A crude pairwise measure between tellings (Jaccard
  over trigram sets is enough) below which the output is oatmeal regardless of
  what the combinatorics say.

This is Improv's `audit` promoted from a debugging aid to a build gate, which is
the one place this design asks more of the technique than its sources did.

## What has no precedent

The assembly half is well-trodden: *Voyageur* shipped on it, *Parrigues* was
written with it, Ink ships the mechanism as language syntax, and Valve's dialog
system (Elan Ruskin, GDC 2012) is the same idea with specificity-ranked rules.

The authoring half is not. In all of that prior art a human wrote the fragments,
and wrote them already knowing they were writing interchangeable pieces — Dias
describes that as a distinctly different activity from writing static prose.
Having a model write them to a tag contract at build time is, as far as I could
find, unproven. The nearest work is Frankentext, which stitches human passages
under a copy-ratio constraint: a different shape.

So the generation prompt is the real risk and the real IP. It has to demand
what a human fragment author knows implicitly: that each variant must be
interchangeable with its siblings, must invent nothing outside its declared
`carries` tags, and must hand off a state the next spine beat can pick up.

## Why not depend on `improv` itself

Reimplement, keeping the vocabulary. Four reasons: the narration plan sits
*above* Improv's world model and would fight it; we need seeded determinism,
which Improv does not promise; a library entry has to serialise the seed; and
the repository is strictly typed where Improv is untyped JS. The engine is on
the order of 150 lines, and it is the part most worth owning.

## Where this lands

| File                              | Role                                            |
| --------------------------------- | ----------------------------------------------- |
| `lib/narration-plan.ts`           | Layer 1. Pure. `(source, age, length) → slots`  |
| `lib/fragments.ts`                | Store types and tag vocabulary                  |
| `lib/assemble.ts`                 | Layer 3. Pure. Seeded selection, bind, reincorporate |
| `data/fragments/<id>.<age>.<len>.json` | Generated, committed                       |
| `scripts/bake-fragments.ts`       | Build-time generation, following `*:build`      |
| `scripts/audit-fragments.ts`      | The oatmeal gate, run in CI                     |
| `lib/stream-client.ts`            | Same signature; replays assembled text          |

`streamTale(req, callbacks, signal)` keeps its exact signature, so every
consumer is untouched, and `lib/mock.ts` already proves that static text
replayed through the word chunker reads as a stream. The `--check` drift guard
pattern exists four times over (`catalogue:build`, `motifs:build`,
`tale-catalogue:build`, `sync:atu`), so the new scripts fit the shape rather
than inventing one.

Deleted along the way: `app/api/tale/route.ts`, `app/api/unlock/route.ts`,
`lib/passcode.ts`, `components/PasscodePrompt.tsx`. With no server key to spend,
there is nothing to protect, and the rate-limiting gap in the README closes by
subtraction.

## Open questions

1. **Free-text fields.** `companions`, `setting` and `lesson` currently reach
   the model as prose. Under assembly they become either slot substitutions
   (safe, limited) or tag selectors over pre-baked variants (richer, bounded by
   what was baked). Motif selection has the same question. This is the one real
   product decision and it is not a technical one.
2. **Variant count per slot.** Six is a guess. The audit gate measures whether
   it is enough; nothing else will.
3. **Fragment budget.** 208 ATU types plus 11 fables, times 3 age bands, times
   3 lengths, times slots, times variants. The incremental nightly bake makes
   this affordable over time but the total is worth costing before starting.

## What building it changed

Layers 1 and 3 are now in `lib/`, with 42 unit tests, a corpus for one tale type,
and the audit gate running clean. Four things the design above got wrong only
became visible once the code ran, which is the argument for having built the
prototype before the rest.

### 1. ATU expansion slots cannot be topical

The plan originally drew expansion material from `TaleType.signatureElements` and
gave each chosen element its own slot. The first run produced a Cinderella telling
that lingered on "a small token that leads to a warm recognition" immediately
after the cindery-chores beat — four paragraphs before any token existed. Signature
elements are plot motifs, and a motif cannot be dwelt on before the beat that
introduces it.

An ATU expansion is now **positional and atmospheric**: "linger on the world
around the beat you just heard", which is safe anywhere. Signature elements enter
as model tags instead, which is what this document said in the first place; the
implementation had quietly promoted them to slots.

Fables are unaffected, because `expansionBeats` is authored world-building rather
than plot. They keep named slots, distributed in their authored order, since that
order is meaningful: a walk home belongs after the encounter.

### 2. Binds must be correlated bundles, not per-key candidates

The obvious shape for `bind` is per-key candidate lists, and it is wrong. Drawing
`gift` and `token` independently produced a telling that handed over a stitched
cloak and then left a glass slipper on the step. The keys describe one object
between them, so a whole bundle is chosen at once.

### 3. One string per bound value is not enough

Reading the first assembled tellings turned up two defects in one line:
`a cloak stitched out of dusk did what it had come to do`. A bound value needs an
introduction form and a later-mention form (`{{gift}}` and `{{gift:the}}`), and
the substituter has to supply a capital when a value opens a sentence. Asking the
bake for capitalised variants of every value would multiply the corpus for nothing
and is a rule the bake would sometimes forget.

### 4. The plan and the assembler needed separate streams

The audit gate earned its place on its first run by reporting that one expansion
fragment filled 64% of its slot where three interchangeable fragments should each
get a third. The cause was not bias in the generator: the narration plan and the
assembler were both seeded with the telling seed directly, so both drew from the
same sequence from the same state, and their decisions were coupled. `deriveSeed`
now gives each consumer a labelled stream. Any new consumer of the seed must take
a label too.

This is also the clearest evidence for the gate itself. The skew was invisible in
the prose, would never have been caught by reading, and was a real defect.

### What the numbers say, and what they do not

Over 120 tellings of the committed corpus (37 fragments across 11 slots): no dead
fragments, no fragment above the 60% dominance limit, mean pairwise trigram
similarity 0.143 with a maximum of 0.544. Those are regression baselines, not
evidence of quality. Whether the prose reads as one story is a reading judgement,
and `npm run tellings:preview` exists to make it cheap to make.

### Still unproven

The corpus committed here was written by a model (Claude Opus 5) directly in a
working session, to the tag contract, because the environment had no API key. Its
provenance records `via: "session"` rather than `via: "bake-script"`, and the
difference is deliberate: it is the same authorship but not the same
reproducibility. So the architecture's central unknown is **narrower** than it
was — a model can write interchangeable paragraph variants, and the three rules
in `scripts/bake-fragments.ts` are what it needed to be told — but it is not
closed. Whether the bake script elicits the same quality unsupervised, at 208 tale
types times three age bands times three lengths, is the next thing to find out,
and it needs a key.

### Still deliberately not built

Title variants (the H1 is a template, as in `lib/mock.ts`), the fable path through
the audit, per-pronoun-set corpora, and the three open questions below.
