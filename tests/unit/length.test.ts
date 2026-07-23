import { describe, it, expect } from "vitest";
import { LENGTHS, LENGTH_ORDER, getLength } from "@/lib/length";

describe("length config", () => {
  it("defines short, medium, and long in order", () => {
    expect(LENGTH_ORDER).toEqual(["short", "medium", "long"]);
  });

  it("maps each length to increasing word and token targets", () => {
    expect(LENGTHS.short.targetWords).toBeLessThan(LENGTHS.medium.targetWords);
    expect(LENGTHS.medium.targetWords).toBeLessThan(LENGTHS.long.targetWords);
    expect(LENGTHS.short.maxTokens).toBeLessThan(LENGTHS.long.maxTokens);
  });

  it("getLength returns the matching config", () => {
    expect(getLength("medium").maxTokens).toBe(2048);
    expect(getLength("long").readAloud).toBe("~7 min");
  });
});
