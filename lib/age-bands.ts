import type { AgeBand } from "./tale-types";

export interface AgeBandConfig {
  id: AgeBand;
  label: string;
  /** Short helper text shown under the option in the form. */
  hint: string;
  /** Age-appropriate guidance injected into the storyteller's brief. */
  guidance: string;
}

export const AGE_BANDS: Record<AgeBand, AgeBandConfig> = {
  "3-5": {
    id: "3-5",
    label: "3–5 years",
    hint: "Simple words, lots of repetition.",
    guidance:
      "Use very simple words and short sentences. Lean on gentle repetition and familiar things (animals, food, bedtime). Nothing scary at all — no tension, no peril, no sad turns.",
  },
  "6-8": {
    id: "6-8",
    label: "6–8 years",
    hint: "A little playful tension, always resolved.",
    guidance:
      "Use clear, lively language with a slightly richer vocabulary. A little playful tension or a small problem is welcome, but resolve it warmly and quickly. No real danger or fear.",
  },
  "9-12": {
    id: "9-12",
    label: "9–12 years",
    hint: "Richer words and a touch of cleverness.",
    guidance:
      "Use a richer vocabulary and a more developed plot with a clever twist or two. Keep everything gentle and cosy — no horror, violence, or romance — and still land softly at bedtime.",
  },
};

export const AGE_BAND_ORDER: readonly AgeBand[] = ["3-5", "6-8", "9-12"];

export function getAgeBand(id: AgeBand): AgeBandConfig {
  return AGE_BANDS[id];
}
