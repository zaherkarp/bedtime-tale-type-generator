/**
 * Layer 1 — the narration plan. Emily Short's contribution to the architecture.
 *
 * ## What this layer is for
 *
 * Improv has no equivalent of this. Its model answers "which phrasing of this
 * thing?" — a question about wording. Short's procedural text work turns on a
 * different question: *what gets narrated at all, and in what order?* Her Room
 * Description Control is the worked example — selecting and ordering the
 * information to narrate, rather than always narrating all of it.
 *
 * That distinction is the main defence against Kate Compton's 10,000 bowls of
 * oatmeal. Rewording a fixed sequence of events produces tellings that are
 * mathematically distinct and perceptually identical. Changing which events are
 * dwelt on, how long, and in what order is a difference a tired parent can
 * actually hear.
 *
 * ## What is fixed and what is elastic
 *
 * The spine is fixed. Both registries already carry this distinction and the
 * plan reads it rather than inventing anything:
 *
 * - `TaleType.beats` is the causal skeleton of an ATU type. Drop one and the
 *   story stops being recognisable as that type, which is the whole product.
 * - `Fable.coreBeats` is documented in `lib/fables.ts` as exactly that, with
 *   the explicit rule that it plays once, cleanly, and is never repeated for
 *   length — and `Fable.expansionBeats` names where growth is invited instead.
 *
 * So the plan always emits every spine beat, in order, exactly once. What
 * varies per telling is the number of expansion slots, where they sit, and
 * which material they dwell on.
 *
 * ## Length is slot count plus word budget, never padding
 *
 * `lib/length.ts` already argues that a fable reaches 1,450 words by building a
 * world around its kernel rather than re-staging the encounter four times. The
 * plan honours that by spending a length budget two ways: more expansion slots,
 * and a higher per-paragraph word target that the bake is told about. Nothing
 * here ever pads a beat.
 */

import type { Tag } from "./fragments.ts";
import { getLength, type StoryFamily } from "./length.ts";
import type { AgeBand, TaleLength, TaleType } from "./tale-types.ts";
import type { Fable } from "./fables.ts";
import { shuffled, type Rng } from "./seed.ts";

export type SlotKind = "opener" | "spine" | "expansion" | "coda";

export interface Slot {
  /** Stable across tellings and across rebakes: the key a fragment file uses. */
  id: string;
  kind: SlotKind;
  /**
   * What this slot narrates, in the registry's own words.
   *
   * This is the string the bake prompt is built from, so it has to be the beat
   * itself and not a paraphrase. Keeping the registry text verbatim means a
   * reviewer reading a generated fragment can check it against the beat it was
   * written for.
   */
  intent: string;
  /** Tags carried while this slot is resolved. See `lib/fragments.ts`. */
  tags: readonly Tag[];
  /** Roughly how long this paragraph should be. Guidance for the bake. */
  targetWords: number;
}

export interface NarrationPlan {
  sourceKind: "atu" | "fable";
  sourceId: string;
  /** The tale's own title, used for the generated H1. */
  title: string;
  ageBand: AgeBand;
  length: TaleLength;
  /**
   * Tags true of the whole telling, seeded into the selection model before the
   * first slot. Per-slot tags are on each `Slot`.
   */
  modelTags: readonly Tag[];
  slots: readonly Slot[];
}

/**
 * How many expansion slots each length gets, per family.
 *
 * The fable row is higher at every length for the reason `lib/length.ts` gives:
 * the fable family's "short" is longer than the folktale family's "long",
 * because a 200-word kernel has to support a bedtime story and the extra length
 * is supposed to come from the surrounding world.
 */
const EXPANSION_SLOTS: Record<StoryFamily, Record<TaleLength, number>> = {
  folktale: { short: 0, medium: 2, long: 4 },
  fable: { short: 2, medium: 4, long: 6 },
};

/** How many signature elements a telling foregrounds. See `planAtu`. */
const FOREGROUND_ELEMENTS: Record<TaleLength, number> = {
  short: 1,
  medium: 1,
  long: 2,
};

/** Keep a paragraph a paragraph, whatever the arithmetic says. */
const MIN_WORDS_PER_SLOT = 40;
const MAX_WORDS_PER_SLOT = 150;

/** A stable, filename- and tag-safe key for a piece of expansion material. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .slice(0, 4)
    .join("-");
}

/**
 * The plan for an ATU tale type.
 *
 * ## Why an ATU expansion is positional, not topical
 *
 * The first version of this function drew expansion material from
 * `signatureElements` and gave each chosen element its own slot. Running it
 * showed why that is wrong: for Cinderella it produced a telling that lingered
 * on "a small token that leads to a warm recognition" immediately after the
 * cindery-chores beat, four paragraphs before any token existed. Signature
 * elements are *plot motifs*, and a motif cannot be dwelt on before the beat
 * that introduces it.
 *
 * So an ATU expansion slot is **positional and atmospheric**: it is "linger on
 * the world around the beat you just heard", which is safe anywhere because it
 * adds texture rather than plot. That is also the altitude Short's expansion
 * writing works at.
 *
 * Signature elements still matter — they are what gives a type its flavour —
 * but they enter as **model tags** rather than slots. A telling foregrounds one
 * or two of them, and a fragment tagged for that element outscores a generic
 * one wherever the bake wrote a specific variant. That is the arrangement the
 * design doc describes, and it keeps the elements out of the ordering problem
 * entirely.
 */
export function planAtu(
  taleType: TaleType,
  ageBand: AgeBand,
  length: TaleLength,
  rng: Rng,
): NarrationPlan {
  // Drawn before the spine so the element choice is part of what varies between
  // two tellings of the same pick.
  const foregrounded = shuffled(taleType.signatureElements, rng).slice(
    0,
    Math.min(FOREGROUND_ELEMENTS[length], taleType.signatureElements.length),
  );

  return buildPlan({
    sourceKind: "atu",
    sourceId: taleType.id,
    title: taleType.label,
    family: "folktale",
    spine: taleType.beats,
    expansions: "positional",
    extraModelTags: foregrounded.map((e) => ["element", slugify(e)] as Tag),
    toneTag: slugify(taleType.tone.split(/[,;]/)[0] ?? ""),
    ageBand,
    length,
    rng,
  });
}

/**
 * The plan for a curated fable.
 *
 * Fables keep **named** expansion slots, because `Fable.expansionBeats` is
 * authored material rather than an inferred list: `lib/fables.ts` documents it
 * as naming exactly where an adaptation is invited to grow, and the entries are
 * written as world-building ("the mouse's burrow, its family, and the small
 * errands of an ordinary day") rather than as plot.
 *
 * They are kept in their authored order and distributed across insertion points
 * in ascending order, because that order is meaningful — a walk home belongs
 * after the encounter, not before it. Which subset a telling spends its slots
 * on still varies with the seed; the relative sequence does not.
 */
export function planFable(
  fable: Fable,
  ageBand: AgeBand,
  length: TaleLength,
  rng: Rng,
): NarrationPlan {
  return buildPlan({
    sourceKind: "fable",
    sourceId: fable.id,
    title: fable.title,
    family: "fable",
    spine: fable.coreBeats,
    expansions: fable.expansionBeats ?? [],
    extraModelTags: [],
    // A fable's themes stand in for the ATU family's `tone`: they are what the
    // telling is *about*, and tagging them lets a fragment written for patience
    // outrank a generic one in a telling that chose patience.
    toneTag: slugify(fable.themes[0] ?? ""),
    ageBand,
    length,
    rng,
  });
}

function buildPlan(input: {
  sourceKind: "atu" | "fable";
  sourceId: string;
  title: string;
  family: StoryFamily;
  spine: readonly string[];
  /** `"positional"` for ATU; an ordered list of authored beats for fables. */
  expansions: "positional" | readonly string[];
  extraModelTags: readonly Tag[];
  toneTag: string;
  ageBand: AgeBand;
  length: TaleLength;
  rng: Rng;
}): NarrationPlan {
  const { spine, rng } = input;
  if (spine.length === 0) {
    throw new Error(`${input.sourceId} has no spine beats to narrate`);
  }

  // Expansions may sit after any spine beat except the last. The final beat is
  // the resolution and the coda follows it directly: a digression between the
  // two is exactly how a wind-down loses its landing.
  const insertionPoints = spine.length - 1;
  const positional = input.expansions === "positional";
  // Declared with an explicit type because narrowing `input.expansions` through
  // the separate `positional` boolean is beyond what the compiler tracks.
  const authored: readonly string[] =
    input.expansions === "positional" ? [] : input.expansions;
  const supply = positional ? insertionPoints : authored.length;
  const expansionCount = Math.min(
    EXPANSION_SLOTS[input.family][input.length],
    insertionPoints,
    supply,
  );

  // Where the digressions go. Ascending, so an authored sequence keeps its order.
  const chosenPoints = shuffled(
    Array.from({ length: insertionPoints }, (_, i) => i),
    rng,
  )
    .slice(0, expansionCount)
    .sort((a, b) => a - b);

  // Which authored beats, keeping their authored order. For positional
  // expansions there is nothing to choose: the slot is defined by its position.
  const chosenAuthored = positional
    ? []
    : shuffled(
        authored.map((beat, i) => ({ beat, i })),
        rng,
      )
        .slice(0, expansionCount)
        .sort((a, b) => a.i - b.i)
        .map((e) => e.beat);

  const slotCount = 1 + spine.length + expansionCount + 1; // opener + spine + expansions + coda
  const targetWords = clampWords(
    Math.round(getLength(input.length, input.family).targetWords / slotCount),
  );

  const slots: Slot[] = [
    {
      id: "opener",
      kind: "opener",
      intent: `Open the tale: establish ${input.title} as a gentle night-time world and bring the listener in.`,
      tags: [["slot", "opener"]],
      targetWords,
    },
  ];

  spine.forEach((beat, index) => {
    slots.push({
      id: `spine:${index}`,
      kind: "spine",
      intent: beat,
      tags: [["slot", "spine", String(index)]],
      targetWords,
    });

    // Expansions are attached after the beat they follow, so the ordering is
    // decided here rather than by a later sort.
    chosenPoints.forEach((point, nth) => {
      if (point !== index) return;
      slots.push(
        positional
          ? {
              id: `expansion:after-${index}`,
              kind: "expansion",
              intent: `Linger on the world around the previous beat (${beat}): its sounds, textures, warmth and small kindnesses. Add no new plot.`,
              tags: [["slot", "expansion", `after-${index}`]],
              targetWords,
            }
          : {
              id: `expansion:${slugify(chosenAuthored[nth])}`,
              kind: "expansion",
              intent: chosenAuthored[nth],
              tags: [["slot", "expansion", slugify(chosenAuthored[nth])]],
              targetWords,
            },
      );
    });
  });

  slots.push({
    id: "coda",
    kind: "coda",
    intent:
      "Wind down: dim the story, slow the sentences, and land on a soft goodnight.",
    tags: [["slot", "coda"]],
    targetWords,
  });

  const modelTags: Tag[] = [
    ["age", input.ageBand],
    ["length", input.length],
    ...input.extraModelTags.map((t) => t.slice()),
  ];
  if (input.toneTag) modelTags.push(["tone", input.toneTag]);

  return {
    sourceKind: input.sourceKind,
    sourceId: input.sourceId,
    title: input.title,
    ageBand: input.ageBand,
    length: input.length,
    modelTags,
    slots,
  };
}

function clampWords(n: number): number {
  return Math.min(MAX_WORDS_PER_SLOT, Math.max(MIN_WORDS_PER_SLOT, n));
}

/**
 * Every slot id a given source can ever produce, and the element tags its
 * fragments may be written for.
 *
 * The bake needs this: it has to write fragments for every slot the plan *might*
 * ask for, not only the ones one seeded plan happened to choose. Baking from a
 * single plan would leave unchosen slots permanently empty, and the audit's
 * dead-fragment check could not catch it because those fragments would not exist
 * to be counted.
 */
export function slotSpace(input: {
  spine: readonly string[];
  /** ATU signature elements, or a fable's authored expansion beats. */
  expansions: "positional" | readonly string[];
}): { slotIds: string[]; } {
  const spineIds = input.spine.map((_, i) => `spine:${i}`);
  const expansionIds =
    input.expansions === "positional"
      ? input.spine.slice(0, -1).map((_, i) => `expansion:after-${i}`)
      : input.expansions.map((m) => `expansion:${slugify(m)}`);

  return { slotIds: ["opener", ...spineIds, ...expansionIds, "coda"] };
}
