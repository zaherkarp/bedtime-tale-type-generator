/**
 * The fable half of the storyteller's brief.
 *
 * `lib/prompt.ts` owns the parts that are true of every story — the persona,
 * the wind-down arc, the sanitized user details, the audience and length lines,
 * and the injection guard. This module owns only the source-specific section
 * for a curated fable, which is where the two families genuinely differ.
 *
 * ## The shape of a fable brief
 *
 * Three blocks, in this order:
 *
 * 1. **THE FABLE KERNEL** — the causal spine that must stay recognisable, to be
 *    played once, cleanly, in the middle of the story.
 * 2. **BEDTIME ADAPTATION** — the corpus's own instructions for this fable's
 *    difficult material: what to preserve, soften, substitute and remove. This
 *    is deliberately *data*, not a general plea to be child-friendly.
 * 3. **BEDTIME EXPANSION** — where the length is allowed to come from, and,
 *    just as importantly, where it is not.
 *
 * ## What is deliberately absent
 *
 * The fable's `source` block — collection, collector, year, designations, URL —
 * never appears here. It is provenance for a parent reading the "Behind the
 * story" panel, not an instruction to a storyteller, and putting a citation in
 * a generation brief invites the model to write about the citation. There is a
 * test asserting it stays out.
 */

import type { Fable } from "./fables";
import { getFable, isBelowAgeFloor } from "./fables";
import type { FableTaleRequest } from "./schema";
import type { LengthConfig } from "./length";

/**
 * The default expansion grammar: a bedtime shape that grows a fable without
 * touching its middle. Deliberately offered as a shape rather than a checklist
 * — ten literal beats produces ten mechanical paragraphs.
 */
const EXPANSION_SHAPE: readonly string[] = [
  "establish the hero's ordinary world — home, the people and creatures in it, what an ordinary day is like",
  "give a gentle reason to travel, wander, or look into something",
  "approach the central encounter, so it arrives somewhere and not out of nowhere",
  "play the fable kernel once, cleanly, exactly as set out above",
  "let the result settle: what changes, who notices, what is different afterwards",
  "give the hero room to understand what happened, without anyone explaining it to them",
  "begin the journey home",
  "narrow the senses step by step — fewer sights, softer sounds, slower sentences",
  "arrive somewhere safe and warm",
  "sleep",
];

function numbered(items: readonly string[]): string[] {
  return items.map((item, i) => `  ${i + 1}. ${item}`);
}

function bulleted(items: readonly string[]): string[] {
  return items.map((item) => `  - ${item}`);
}

/**
 * The kernel block: the sequence that makes this fable this fable.
 *
 * The instruction not to repeat it is the load-bearing one. Asked for 1,200
 * words from a 200-word pattern, the obvious failure is to run the encounter
 * three times; that produces length and destroys the fable, because a reversal
 * that happens repeatedly is not a reversal.
 */
function kernelLines(fable: Fable): string[] {
  const lines: string[] = [];
  lines.push("THE FABLE KERNEL — the traditional causal sequence.");
  lines.push(
    "This is the spine of the traditional tale and it must stay recognisable. " +
      "Play it through ONCE, in order, in the middle of the story. Do not repeat " +
      "it, do not stage the same encounter more than once, and do not add a " +
      "second problem of the same kind to fill space.",
  );
  lines.push(...numbered(fable.coreBeats));
  if (fable.characters?.length) {
    lines.push(
      `Traditional cast (roles, not names — invent your own): ${fable.characters.join("; ")}.`,
    );
  }
  lines.push(
    `Traditional themes: ${fable.themes.join("; ")}. Let these arrive through what happens ` +
      "and through what the hero quietly notices afterwards. Do not end with a stated " +
      'moral, a "MORAL:" line, or a closing sentence that explains the story back to the ' +
      "listener; the last words belong to the wind-down, not to a lesson.",
  );
  return lines;
}

/**
 * The adaptation block, built from the fable's own metadata.
 *
 * Every line here comes from `lib/fables.ts`, which is the point of Phase 3:
 * the corpus carries the judgement, in a file a person can review, instead of
 * the prompt asking the model to improvise it per request.
 */
function adaptationLines(fable: Fable, ageBandId: string): string[] {
  const a = fable.adaptation;
  const lines: string[] = [];
  lines.push("");
  lines.push(
    "BEDTIME ADAPTATION — this is an original bedtime story built on the traditional " +
      "pattern, not a retelling of it. Never reproduce or quote any published version, " +
      "and invent all names and specifics yourself.",
  );
  if (a.concerns.length) {
    lines.push(
      `The traditional tale contains material a small child should not hear: ${a.concerns.join(", ")}. ` +
        "Handle it exactly as follows.",
    );
  }
  lines.push("PRESERVE — these are why the fable works; losing them empties the story:");
  lines.push(...bulleted(a.preserve));
  if (a.soften?.length) {
    lines.push("SOFTEN — keep these, at a lower temperature:");
    lines.push(...bulleted(a.soften));
  }
  if (a.substitute?.length) {
    lines.push("SUBSTITUTE — swap these for the given replacement, which carries the same weight:");
    lines.push(...bulleted(a.substitute));
  }
  if (a.remove?.length) {
    lines.push("REMOVE ENTIRELY — leave these out; nothing takes their place:");
    lines.push(...bulleted(a.remove));
  }
  lines.push(
    "Softening is not the same as emptying. Something real must still happen, go wrong, " +
      "and be put right by the hero. Do not resolve the problem before it has been felt.",
  );
  if (isBelowAgeFloor(fable, ageBandId)) {
    lines.push(
      `This tale is usually kept for listeners of about ${a.ageFloor} and up, and tonight's ` +
        "listener is younger. Apply every softening and removal above in full, keep the " +
        "problem short and the reassurance close behind it, and use the plainest words you have.",
    );
  }
  return lines;
}

/**
 * The expansion block: where the length comes from.
 *
 * A traditional fable pattern is 150–300 words and the product wants roughly
 * 900–1,500, so this block is doing the real work of Phase 4. Note that it
 * allocates the *architecture*, not the token count: the middle third is
 * capped by instruction, and the growth is pushed outward into setting,
 * travel, routine, relationship, aftermath, reflection and the sleepy return.
 */
function expansionLines(fable: Fable, length: LengthConfig): string[] {
  const lines: string[] = [];
  lines.push("");
  lines.push(
    "BEDTIME EXPANSION — a traditional fable is only a couple of hundred words long. " +
      `Tonight's story is roughly ${length.targetWords}. Every extra word must come from ` +
      "the world AROUND the kernel, never from stretching the kernel itself.",
  );
  lines.push("Grow the story here:");
  lines.push(
    ...bulleted([
      "setting — the place, its weather, its light, its smells and small sounds",
      "travel — getting there and back, and what the way is like",
      "ordinary routines — meals, chores, errands, the shape of a normal day",
      "relationships — who the hero lives among, and how they talk to each other",
      "discovery — small noticings along the way that have nothing to prove",
      "aftermath — the hours after the encounter, and what is different in them",
      "reflection — the hero turning it over quietly, arriving at the meaning themselves",
      "the sleepy return — the last third, growing softer and slower all the way down",
    ]),
  );
  lines.push(
    "Do NOT grow it here: repeated conflict, extra encounters with the same problem, " +
      "a second telling of the reversal, restated lessons, or long stretches of dialogue " +
      "circling the same point.",
  );
  lines.push("A shape that works (a guide, not a checklist — merge or skip beats where the story wants to):");
  lines.push(...numbered(EXPANSION_SHAPE));
  lines.push(
    "Rough proportions: about a third of the words before the encounter, about a third " +
      "for the kernel and its immediate aftermath, and a full third for understanding, " +
      "going home, and falling asleep.",
  );
  if (fable.expansionBeats?.length) {
    lines.push("Places this particular tale grows well:");
    lines.push(...bulleted(fable.expansionBeats));
  }
  return lines;
}

/**
 * The source-specific portion of the brief for a fable request.
 * `lib/prompt.ts` appends the shared story details, audience, length and guard.
 */
export function fableSourceLines(
  request: FableTaleRequest,
  length: LengthConfig,
): string[] {
  const fable = getFable(request.fableId);
  if (!fable) throw new Error(`Unknown fable: ${request.fableId}`);

  const lines: string[] = [];
  lines.push(
    `Tell an original bedtime story built on the traditional fable pattern known as ` +
      `"${fable.title}", from the ${fable.tradition} tradition.`,
  );
  lines.push("");
  lines.push(...kernelLines(fable));
  lines.push(...adaptationLines(fable, request.ageBand));
  lines.push(...expansionLines(fable, length));
  return lines;
}
