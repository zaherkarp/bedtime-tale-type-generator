import { describe, it, expect } from "vitest";
import {
  TALE_TYPE_SUMMARIES,
  ORIGINAL_TALE_TYPE_SUMMARIES,
  CURATED_TALE_TYPE_SUMMARIES,
} from "@/lib/tale-types-catalogue";
import { TALE_TYPES, ORIGINAL_TALE_TYPES } from "@/lib/tale-types";

describe("tale-type catalogue summary", () => {
  it("carries exactly one summary per featured tale type, in the same order", () => {
    expect(TALE_TYPE_SUMMARIES.map((t) => t.id)).toEqual(
      TALE_TYPES.map((t) => t.id),
    );
    expect(ORIGINAL_TALE_TYPE_SUMMARIES.map((t) => t.id)).toEqual(
      ORIGINAL_TALE_TYPES.map((t) => t.id),
    );
    expect(TALE_TYPE_SUMMARIES).toEqual([
      ...ORIGINAL_TALE_TYPE_SUMMARIES,
      ...CURATED_TALE_TYPE_SUMMARIES,
    ]);
  });

  it("matches the full registry on every picker-card field", () => {
    const byId = new Map(TALE_TYPES.map((t) => [t.id, t]));
    for (const s of TALE_TYPE_SUMMARIES) {
      const full = byId.get(s.id);
      expect(full, `${s.id} in full registry`).toBeTruthy();
      expect(s.label).toBe(full!.label);
      expect(s.atuNumber).toBe(full!.atuNumber);
      expect(s.category).toBe(full!.category);
      expect(s.emoji).toBe(full!.emoji);
      expect(s.tagline).toBe(full!.tagline);
    }
  });

  it("never carries a prompt-only field", () => {
    // The entire point of this file: a "use client" component can import it
    // without pulling beats, signature elements, tone, or an example opener
    // into the browser bundle. If any of those ever appear here, the split
    // has failed.
    const promptOnlyFields = ["beats", "signatureElements", "tone", "exampleOpener"];
    for (const s of TALE_TYPE_SUMMARIES) {
      for (const field of promptOnlyFields) {
        expect(s, `${s.id} has no ${field}`).not.toHaveProperty(field);
      }
    }
  });
});
