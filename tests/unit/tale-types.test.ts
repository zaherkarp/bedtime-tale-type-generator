import { describe, it, expect } from "vitest";
import { TALE_TYPES, TALE_TYPE_IDS, getTaleType } from "@/lib/tale-types";

describe("tale-type registry", () => {
  it("ships the expected twelve tale types", () => {
    expect(TALE_TYPES).toHaveLength(12);
  });

  it("has unique ids that match TALE_TYPE_IDS", () => {
    const ids = TALE_TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...TALE_TYPE_IDS].sort()).toEqual([...ids].sort());
  });

  it("every entry is fully populated for prompt + UI use", () => {
    for (const tale of TALE_TYPES) {
      expect(tale.id, "id").toMatch(/^[a-z0-9-]+$/);
      expect(tale.label.length, `${tale.id} label`).toBeGreaterThan(0);
      expect(tale.atuNumber, `${tale.id} atuNumber`).toMatch(/^ATU\s\S+/);
      expect(tale.category.length, `${tale.id} category`).toBeGreaterThan(0);
      expect(tale.emoji.length, `${tale.id} emoji`).toBeGreaterThan(0);
      expect(tale.tagline.length, `${tale.id} tagline`).toBeGreaterThan(0);
      expect(tale.tone.length, `${tale.id} tone`).toBeGreaterThan(0);
      expect(tale.exampleOpener.length, `${tale.id} opener`).toBeGreaterThan(0);
      expect(
        tale.beats.length,
        `${tale.id} beats`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        tale.signatureElements.length,
        `${tale.id} signatureElements`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("looks up by id and returns undefined for unknown ids", () => {
    expect(getTaleType("cinderella")?.label).toBe("Cinderella");
    expect(getTaleType("does-not-exist")).toBeUndefined();
  });
});
