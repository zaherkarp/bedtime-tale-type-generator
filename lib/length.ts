import type { TaleLength } from "./tale-types";

/**
 * Which story family a length is being interpreted for.
 *
 * The same three buttons mean different things on either side of the app, and
 * that is deliberate — see FABLE_LENGTHS below.
 */
export type StoryFamily = "folktale" | "fable";

export interface LengthConfig {
  id: TaleLength;
  label: string;
  /** Approximate target word count, used in the prompt. */
  targetWords: number;
  /**
   * The acceptable band around `targetWords`, where the family has one.
   *
   * Fables get a band because their whole length argument is architectural: a
   * 200-word kernel has to support a 1,200-word bedtime story, and "roughly
   * 900–1,200 words" tells the storyteller how much room it is being given to
   * build a world in. The ATU family has always used a single number and
   * changing that would alter every existing tale type's output for nothing.
   */
  minWords?: number;
  maxWords?: number;
  /** Rough read-aloud time, shown to the user. */
  readAloud: string;
  /** Upper bound on generated tokens for this length. */
  maxTokens: number;
}

export const LENGTHS: Record<TaleLength, LengthConfig> = {
  short: {
    id: "short",
    label: "Short",
    targetWords: 300,
    readAloud: "~2½ min",
    maxTokens: 1024,
  },
  medium: {
    id: "medium",
    label: "Medium",
    targetWords: 600,
    readAloud: "~5 min",
    maxTokens: 2048,
  },
  long: {
    id: "long",
    label: "Long",
    targetWords: 900,
    readAloud: "~7 min",
    maxTokens: 4096,
  },
};

/**
 * The same three ids, interpreted for the fable family.
 *
 * A traditional fable pattern is 150–300 words. The bedtime product needs
 * 900–1,500, and the whole point of the expansion grammar is that the extra
 * length comes from the world around the kernel rather than from padding the
 * kernel. So the fable side of the app starts where the folktale side ends:
 * its "Short" is longer than the folktale "Long".
 *
 * The ids are shared so that a request, a saved library entry, and the form's
 * three buttons all keep working across both families. Only the interpretation
 * differs, which is what keeps this backward compatible.
 *
 * `maxTokens` is not a rounding of the word count. Thinking tokens are drawn
 * from the same budget, so each ceiling is roughly double the prose the target
 * needs; a 1,450-word story that runs out of budget at word 1,200 loses its
 * wind-down, which is the one part of the product that cannot be lost.
 */
export const FABLE_LENGTHS: Record<TaleLength, LengthConfig> = {
  short: {
    id: "short",
    label: "Short",
    targetWords: 700,
    minWords: 600,
    maxWords: 800,
    readAloud: "~6 min",
    maxTokens: 2560,
  },
  medium: {
    id: "medium",
    label: "Bedtime",
    targetWords: 1050,
    minWords: 900,
    maxWords: 1200,
    readAloud: "~9 min",
    maxTokens: 3584,
  },
  long: {
    id: "long",
    label: "Long bedtime",
    targetWords: 1450,
    minWords: 1300,
    maxWords: 1600,
    readAloud: "~12 min",
    maxTokens: 5120,
  },
};

export const LENGTH_ORDER: readonly TaleLength[] = ["short", "medium", "long"];

/**
 * Resolve a length id for a story family. The default keeps every existing
 * caller — and every existing ATU story — on exactly the numbers it had.
 */
export function getLength(
  id: TaleLength,
  family: StoryFamily = "folktale",
): LengthConfig {
  return family === "fable" ? FABLE_LENGTHS[id] : LENGTHS[id];
}

/** The length table for a family, for the form's three buttons. */
export function lengthsFor(family: StoryFamily): Record<TaleLength, LengthConfig> {
  return family === "fable" ? FABLE_LENGTHS : LENGTHS;
}
