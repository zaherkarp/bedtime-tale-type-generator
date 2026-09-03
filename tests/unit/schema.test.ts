import { describe, it, expect } from "vitest";
import { taleRequestSchema, sourceIdOf } from "@/lib/schema";
import { FABLE_IDS } from "@/lib/fables";

const valid = {
  taleTypeId: "cinderella",
  heroName: "Amara",
  ageBand: "6-8",
  length: "medium",
};

describe("taleRequestSchema", () => {
  it("accepts a minimal valid request", () => {
    const result = taleRequestSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("trims the hero name", () => {
    const result = taleRequestSchema.safeParse({ ...valid, heroName: "  Amara  " });
    expect(result.success && result.data.heroName).toBe("Amara");
  });

  it("rejects a missing / empty hero name", () => {
    expect(taleRequestSchema.safeParse({ ...valid, heroName: "   " }).success).toBe(
      false,
    );
  });

  it("rejects a hero name over 40 characters", () => {
    expect(
      taleRequestSchema.safeParse({ ...valid, heroName: "x".repeat(41) }).success,
    ).toBe(false);
  });

  it("rejects an unknown tale type", () => {
    expect(
      taleRequestSchema.safeParse({ ...valid, taleTypeId: "nope" }).success,
    ).toBe(false);
  });

  it("accepts a non-featured catalogue tale type", () => {
    expect(
      taleRequestSchema.safeParse({ ...valid, taleTypeId: "stone-soup" }).success,
    ).toBe(true);
  });

  it("rejects an invalid age band", () => {
    expect(taleRequestSchema.safeParse({ ...valid, ageBand: "13-18" }).success).toBe(
      false,
    );
  });

  it("rejects an invalid length", () => {
    expect(
      taleRequestSchema.safeParse({ ...valid, length: "epic" }).success,
    ).toBe(false);
  });

  it("turns an empty optional field into undefined", () => {
    const result = taleRequestSchema.safeParse({ ...valid, setting: "   " });
    expect(result.success && result.data.setting).toBeUndefined();
  });

  it("rejects an optional field over 120 characters", () => {
    expect(
      taleRequestSchema.safeParse({ ...valid, companions: "x".repeat(121) })
        .success,
    ).toBe(false);
  });

  it("keeps a valid optional field", () => {
    const result = taleRequestSchema.safeParse({
      ...valid,
      companions: "a sleepy dragon",
    });
    expect(result.success && result.data.companions).toBe("a sleepy dragon");
  });

  it("tags an untagged request as an ATU one", () => {
    // Backward compatibility: every request the app has ever sent, and every
    // shared /?type= deep link, arrives without a `kind`.
    const result = taleRequestSchema.safeParse(valid);
    expect(result.success && result.data.kind).toBe("atu");
  });

  it("accepts an explicitly tagged ATU request", () => {
    expect(taleRequestSchema.safeParse({ ...valid, kind: "atu" }).success).toBe(
      true,
    );
  });
});

describe("taleRequestSchema — fables", () => {
  const validFable = {
    kind: "fable",
    fableId: "lion-and-the-mouse",
    heroName: "Amara",
    ageBand: "6-8",
    length: "medium",
  };

  it("accepts a valid fable request", () => {
    expect(taleRequestSchema.safeParse(validFable).success).toBe(true);
  });

  it("accepts every id in the corpus", () => {
    for (const id of FABLE_IDS) {
      expect(
        taleRequestSchema.safeParse({ ...validFable, fableId: id }).success,
      ).toBe(true);
    }
  });

  it("rejects an unknown fable id", () => {
    expect(
      taleRequestSchema.safeParse({ ...validFable, fableId: "nope" }).success,
    ).toBe(false);
  });

  it("rejects a fable request with an ATU id in the fable field", () => {
    expect(
      taleRequestSchema.safeParse({ ...validFable, fableId: "cinderella" })
        .success,
    ).toBe(false);
  });

  it("rejects a fable request with no fable id at all", () => {
    const withoutId: Record<string, unknown> = { ...validFable };
    delete withoutId.fableId;
    expect(taleRequestSchema.safeParse(withoutId).success).toBe(false);
  });

  it("rejects an unknown story family", () => {
    expect(
      taleRequestSchema.safeParse({ ...validFable, kind: "epic-poem" }).success,
    ).toBe(false);
  });

  it("still validates the shared fields", () => {
    expect(
      taleRequestSchema.safeParse({ ...validFable, heroName: "  " }).success,
    ).toBe(false);
    expect(
      taleRequestSchema.safeParse({ ...validFable, length: "epic" }).success,
    ).toBe(false);
    expect(
      taleRequestSchema.safeParse({ ...validFable, ageBand: "13-18" }).success,
    ).toBe(false);
  });

  it("does not let a fable request smuggle in motif codes", () => {
    // Fables carry no Thompson motif links; the discriminated union simply has
    // no such field, so a stale or hopeful client cannot add free text here.
    const result = taleRequestSchema.safeParse({
      ...validFable,
      motifCodes: ["B350"],
    });
    expect(result.success && "motifCodes" in result.data).toBe(false);
  });

  it("reports the id it refers to, whichever family it is", () => {
    const fable = taleRequestSchema.parse(validFable);
    const atu = taleRequestSchema.parse(valid);
    expect(sourceIdOf(fable)).toBe("lion-and-the-mouse");
    expect(sourceIdOf(atu)).toBe("cinderella");
  });
});
