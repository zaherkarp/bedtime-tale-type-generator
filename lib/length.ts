import type { TaleLength } from "./tale-types";

export interface LengthConfig {
  id: TaleLength;
  label: string;
  /** Approximate target word count, used in the prompt. */
  targetWords: number;
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

export const LENGTH_ORDER: readonly TaleLength[] = ["short", "medium", "long"];

export function getLength(id: TaleLength): LengthConfig {
  return LENGTHS[id];
}
