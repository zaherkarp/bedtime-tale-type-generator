/**
 * The oatmeal gate: a build check over a baked fragment corpus.
 *
 * ## Why this has to be machinery
 *
 * Kate Compton's 10,000 bowls of oatmeal problem is the failure mode that would
 * kill assembly: ten thousand mathematically unique bowls, one perceived bowl of
 * oatmeal. Combination count proves nothing about perceived variety.
 *
 * Neither of the approaches this engine is built from had to mechanise that
 * check. In *Voyageur* and in *The Annals of the Parrigues* a person wrote every
 * fragment and read it as they wrote it, so a dead or dominant phrase was
 * visible in the writing. A generated corpus is written in bulk and read by
 * nobody, so Improv's `audit` — a debugging aid there — becomes a build gate
 * here. That is the one place this design asks more of the technique than its
 * sources did.
 *
 * ## What it checks
 *
 * 1. **Coverage** — every slot the plan can ask for has fragments. A hole here
 *    is a crash at bedtime, which is the worst possible place to find it.
 * 2. **Unknown placeholders** — a fragment that says `{{grandmother}}` when
 *    nothing binds `grandmother`. Caught here, it is a build failure; shipped,
 *    it is a missing word in a story being read aloud.
 * 3. **Unresolved placeholders** — the same thing proven by running, which also
 *    catches ordering mistakes: a fragment using `{{token}}` in a slot that can
 *    run before anything binds it.
 * 4. **Dead fragments** — never chosen across N tellings. Either its tags are
 *    unreachable, or `salience` is too tight. Both are data bugs, and a dead
 *    fragment is corpus you paid to generate and will never read.
 * 5. **Dominant fragments** — chosen in more than `--max-share` of the tellings
 *    that reached its slot, meaning the slot has no real variety whatever the
 *    fragment count says.
 * 6. **Distinctness** — mean pairwise trigram similarity between tellings. This
 *    is the crude, honest version of the oatmeal question. It cannot tell you
 *    whether the prose reads well — `scripts/preview-tellings.ts` and a person
 *    are the only way to know that — but it does catch a corpus whose tellings
 *    are quantitatively near-identical.
 *
 * Usage:
 *   npm run fragments:audit
 *   npm run fragments:audit -- --tellings 200 --max-share 0.6 --max-similarity 0.55
 */

import { readFileSync, readdirSync } from "node:fs";
import { UNIVERSAL_SLOTS, type FragmentStore } from "../lib/fragments.ts";
import { planAtu, slotSpace } from "../lib/narration-plan.ts";
import { assemble, placeholdersIn } from "../lib/assemble.ts";
import { deriveSeed, makeRng, tellingSeed } from "../lib/seed.ts";
import { getTaleType, ORIGINAL_TALE_TYPES, type AgeBand, type TaleLength } from "../lib/tale-types.ts";

function numArg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : fallback;
}

const TELLINGS = numArg("tellings", 120);
const MAX_SHARE = numArg("max-share", 0.6);
const MAX_SIMILARITY = numArg("max-similarity", 0.55);

const DIR = "data/fragments";

/**
 * Corpus files only: `<sourceId>.<ageBand>.<length>.json`.
 *
 * The directory also holds reviewed cast files (`<sourceId>.binds.json`), which
 * are authoring input rather than corpora and carry no slots to audit. Matching
 * the corpus shape is better than excluding the known exception, because the next
 * kind of companion file will be skipped without anyone having to remember.
 */
const CORPUS_FILE = /^[a-z0-9-]+\.\d+-\d+\.(short|medium|long)\.json$/;
const failures: string[] = [];

for (const file of readdirSync(DIR).filter((f) => CORPUS_FILE.test(f)).sort()) {
  const store: FragmentStore = JSON.parse(readFileSync(`${DIR}/${file}`, "utf8"));
  console.log(`\n${file}  (${store.provenance.kind})`);

  if (store.sourceKind !== "atu") {
    // The fable path needs `planFable` and a fable lookup. Not yet baked, so
    // skipping is honest; silently passing an unaudited corpus would not be.
    console.log("  SKIP: only the ATU path is audited so far");
    continue;
  }

  const taleType =
    getTaleType(store.sourceId) ?? ORIGINAL_TALE_TYPES.find((t) => t.id === store.sourceId);
  if (!taleType) {
    failures.push(`${file}: unknown tale type ${store.sourceId}`);
    continue;
  }

  // 1. Coverage.
  const expected = slotSpace({ spine: taleType.beats, expansions: "positional" }).slotIds;
  const present = new Set(store.slots.map((s) => s.slotId));
  const missing = expected.filter((id) => !present.has(id));
  if (missing.length) failures.push(`${file}: no fragments for slots ${missing.join(", ")}`);
  console.log(`  coverage: ${present.size}/${expected.length} slots`);

  // 2. Unknown placeholders, from the data alone.
  const boundKeys = new Set<string>();
  for (const slot of store.slots)
    for (const group of slot.groups)
      for (const fragment of group.fragments)
        for (const bundle of fragment.binds ?? [])
          for (const key of Object.keys(bundle)) boundKeys.add(key);

  const allowed = new Set<string>([...UNIVERSAL_SLOTS, ...boundKeys]);
  for (const slot of store.slots)
    for (const group of slot.groups)
      for (const fragment of group.fragments)
        for (const name of placeholdersIn(fragment.text))
          if (!allowed.has(name))
            failures.push(`${file}: fragment ${fragment.id} uses unknown placeholder {{${name}}}`);

  // 3-6. Run the corpus.
  const uses = new Map<string, number>();
  const slotReached = new Map<string, number>();
  const texts: string[] = [];

  for (let i = 0; i < TELLINGS; i++) {
    const heroName = `Hero${i}`;
    const seed = tellingSeed({
      heroName,
      sourceId: store.sourceId,
      ageBand: store.ageBand,
      length: store.length,
      nonce: String(i),
    });
    const plan = planAtu(
      taleType,
      store.ageBand as AgeBand,
      store.length as TaleLength,
      makeRng(deriveSeed(seed, "plan")),
    );

    // No `used` set: each telling is an independent reader, which is the case
    // the distinctness measure is about. The deck draw is exercised by the unit
    // tests instead, where its behaviour can be asserted rather than averaged.
    const telling = assemble({ plan, store, seed, details: { heroName } });

    if (telling.unresolved.length) {
      failures.push(
        `${file}: seed ${seed} left {{${telling.unresolved.join("}}, {{")}}} unresolved`,
      );
    }
    for (const choice of telling.choices) {
      uses.set(choice.fragmentId, (uses.get(choice.fragmentId) ?? 0) + 1);
      slotReached.set(choice.slotId, (slotReached.get(choice.slotId) ?? 0) + 1);
    }
    texts.push(telling.text);
  }

  // 4. Dead fragments.
  const dead: string[] = [];
  for (const slot of store.slots)
    for (const group of slot.groups)
      for (const fragment of group.fragments)
        if (!uses.has(fragment.id)) dead.push(fragment.id);
  if (dead.length) failures.push(`${file}: never chosen in ${TELLINGS} tellings: ${dead.join(", ")}`);

  // 5. Dominant fragments, measured against how often their slot was reached
  // rather than against the telling count — an expansion slot that only appears
  // in a third of plans is not dominant for appearing in all of those.
  for (const [fragmentId, count] of uses) {
    const slotId = fragmentId.split("#")[0];
    const reached = slotReached.get(slotId) ?? 0;
    const share = reached > 0 ? count / reached : 0;
    if (share > MAX_SHARE) {
      failures.push(
        `${file}: ${fragmentId} fills ${(share * 100).toFixed(0)}% of its slot (limit ${(MAX_SHARE * 100).toFixed(0)}%)`,
      );
    }
  }
  console.log(`  fragments: ${uses.size} used, ${dead.length} dead`);

  // 6. Distinctness.
  const { mean, max } = pairwiseSimilarity(texts);
  console.log(`  similarity: mean ${mean.toFixed(3)}, max ${max.toFixed(3)}`);
  if (mean > MAX_SIMILARITY) {
    failures.push(
      `${file}: mean similarity ${mean.toFixed(3)} exceeds ${MAX_SIMILARITY} — this is oatmeal`,
    );
  }
}

if (failures.length) {
  console.error(`\n${failures.length} problem(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("\nAll fragment corpora pass.");

/**
 * Mean and max pairwise Jaccard similarity over word trigrams.
 *
 * Trigrams rather than words because word overlap is dominated by "the" and the
 * hero's name and would read as similar no matter what. Jaccard rather than
 * anything cleverer because the number only has to be comparable to itself over
 * time: it is a regression guard, not a measurement of quality.
 *
 * Sampled above 40 tellings, since the pair count grows quadratically and the
 * mean stabilises long before the full matrix is computed.
 */
function pairwiseSimilarity(texts: readonly string[]): { mean: number; max: number } {
  const sample = texts.slice(0, 40);
  const sets = sample.map((t) => trigrams(t));
  let total = 0;
  let pairs = 0;
  let max = 0;

  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const sim = jaccard(sets[i], sets[j]);
      total += sim;
      pairs++;
      if (sim > max) max = sim;
    }
  }
  return { mean: pairs > 0 ? total / pairs : 0, max };
}

function trigrams(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/^#.*$/m, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + 2 < words.length; i++) out.add(words.slice(i, i + 3).join(" "));
  return out;
}

function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  let shared = 0;
  for (const item of a) if (b.has(item)) shared++;
  return shared / (a.size + b.size - shared);
}
