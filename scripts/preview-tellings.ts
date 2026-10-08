/**
 * Assemble a handful of tellings and print them, so a person can read the seams.
 *
 * This is the only honest test of the architecture. The audit in
 * `scripts/audit-fragments.ts` can prove that fragments all fire and that
 * tellings differ by some measure; it cannot tell you whether the prose reads as
 * one story or as paragraphs taking turns. That judgement is a reading
 * judgement, and this script exists to make it cheap to make.
 *
 * Usage:
 *   npm run tellings:preview -- --id cinderella --age 6-8 --length medium --count 3
 *   npm run tellings:preview -- --id cinderella --hero Ada --seeds 1,2,3
 */

import { readFileSync } from "node:fs";
import { ORIGINAL_TALE_TYPES, getTaleType, type AgeBand, type TaleLength } from "../lib/tale-types.ts";
import { planAtu } from "../lib/narration-plan.ts";
import { assemble } from "../lib/assemble.ts";
import { deriveSeed, makeRng, tellingSeed } from "../lib/seed.ts";
import type { FragmentStore } from "../lib/fragments.ts";

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const id = arg("id", "cinderella");
const ageBand = arg("age", "6-8") as AgeBand;
const length = arg("length", "medium") as TaleLength;
const count = Number(arg("count", "3"));
const heroArg = arg("hero", "");

const storePath = `data/fragments/${id}.${ageBand}.${length}.json`;
const store: FragmentStore = JSON.parse(readFileSync(storePath, "utf8"));

const taleType = getTaleType(id) ?? ORIGINAL_TALE_TYPES.find((t) => t.id === id);
if (!taleType) throw new Error(`Unknown tale type: ${id}`);

// Different heroes by default, because that is the real comparison: two
// different children picking the same tale on the same night. Passing --hero
// pins the name so you are instead comparing "another one, please" for one child.
const heroes = heroArg
  ? Array.from({ length: count }, () => heroArg)
  : ["Ada", "Bo", "Caleb", "Dilnoza", "Esme", "Finn"].slice(0, count);

console.log(`# ${store.sourceId} · ${store.ageBand} · ${store.length}`);
console.log(
  `Provenance: ${store.provenance.kind}` +
    (store.provenance.kind === "generated"
      ? ` (${store.provenance.model}, via ${store.provenance.via}, ${store.provenance.at})`
      : ` — ${store.provenance.note}`),
);

heroes.forEach((hero, i) => {
  const seed = tellingSeed({
    heroName: hero,
    sourceId: id,
    ageBand,
    length,
    nonce: heroArg ? String(i) : "",
  });

  // The plan is drawn from the same seed as the assembly, so a telling is
  // reproducible end to end from one number.
  const plan = planAtu(taleType, ageBand, length, makeRng(deriveSeed(seed, "plan")));
  const telling = assemble({
    plan,
    store,
    seed,
    details: { heroName: hero },
  });

  console.log(`\n${"=".repeat(72)}`);
  console.log(`seed ${seed} · ${plan.slots.length} paragraphs · ${wordCount(telling.text)} words`);
  console.log(`plan: ${plan.slots.map((s) => s.id).join(" > ")}`);
  console.log(`bindings: ${JSON.stringify(telling.bindings)}`);
  if (telling.unresolved.length) {
    console.log(`UNRESOLVED: ${telling.unresolved.join(", ")}`);
  }
  console.log(`${"=".repeat(72)}\n`);
  console.log(telling.text);
});

function wordCount(text: string): number {
  return text.replace(/^#.*$/m, "").trim().split(/\s+/).length;
}
