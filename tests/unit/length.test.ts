import { describe, it, expect } from "vitest";
import {
  LENGTHS,
  FABLE_LENGTHS,
  LENGTH_ORDER,
  getLength,
  lengthsFor,
} from "@/lib/length";

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

  it("leaves the folktale family untouched when no family is given", () => {
    // Existing ATU behaviour is the baseline: adding a second interpretation
    // of these three ids must not move any of the original numbers.
    expect(getLength("short")).toEqual(LENGTHS.short);
    expect(getLength("long", "folktale")).toEqual(LENGTHS.long);
  });
});

describe("fable lengths", () => {
  it("covers the same three ids so requests stay compatible", () => {
    expect(Object.keys(FABLE_LENGTHS).sort()).toEqual(
      [...LENGTH_ORDER].sort(),
    );
  });

  it("targets the bedtime ranges a fable expansion needs", () => {
    expect(FABLE_LENGTHS.short.minWords).toBe(600);
    expect(FABLE_LENGTHS.short.maxWords).toBe(800);
    expect(FABLE_LENGTHS.medium.minWords).toBe(900);
    expect(FABLE_LENGTHS.medium.maxWords).toBe(1200);
    expect(FABLE_LENGTHS.long.minWords).toBe(1300);
    expect(FABLE_LENGTHS.long.maxWords).toBe(1600);
    for (const id of LENGTH_ORDER) {
      const cfg = FABLE_LENGTHS[id];
      expect(cfg.targetWords).toBeGreaterThanOrEqual(cfg.minWords!);
      expect(cfg.targetWords).toBeLessThanOrEqual(cfg.maxWords!);
    }
  });

  it("starts where the folktale family finishes", () => {
    expect(FABLE_LENGTHS.short.targetWords).toBeGreaterThan(
      LENGTHS.long.targetWords - 300,
    );
    expect(FABLE_LENGTHS.long.targetWords).toBeGreaterThan(
      LENGTHS.long.targetWords,
    );
  });

  it("gives every fable length room to finish its wind-down", () => {
    // Thinking tokens come out of the same budget, so the ceiling has to be
    // comfortably more than the prose needs; a story cut off at word 1,200
    // loses the one part of the product that cannot be lost.
    for (const id of LENGTH_ORDER) {
      const cfg = FABLE_LENGTHS[id];
      expect(cfg.maxTokens).toBeGreaterThan(cfg.maxWords! * 1.5);
    }
  });

  it("dispatches by family", () => {
    expect(getLength("long", "fable")).toEqual(FABLE_LENGTHS.long);
    expect(lengthsFor("fable")).toBe(FABLE_LENGTHS);
    expect(lengthsFor("folktale")).toBe(LENGTHS);
  });
});
