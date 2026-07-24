import { describe, it, expect } from "vitest";
import { taleRequestSchema } from "@/lib/schema";

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
});
