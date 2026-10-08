import { describe, expect, it } from "vitest";
import {
  deriveSeed,
  hashSeed,
  makeRng,
  pick,
  shuffled,
  tellingSeed,
} from "@/lib/seed";

describe("hashSeed", () => {
  it("is deterministic", () => {
    expect(hashSeed("cinderella")).toBe(hashSeed("cinderella"));
  });

  it("separates names that differ by one character", () => {
    // The whole point: "Ada" and "Adam" must not get neighbouring streams, or
    // two siblings get near-identical stories.
    expect(hashSeed("Ada")).not.toBe(hashSeed("Adam"));
  });
});

describe("makeRng", () => {
  it("replays the same sequence from the same seed", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const left = [a(), a(), a()];
    const right = [b(), b(), b()];
    expect(left).toEqual(right);
  });

  it("stays in [0, 1)", () => {
    const rng = makeRng(7);
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("distributes uniformly enough to pick fairly between four options", () => {
    // This is the test that would have caught the correlated-stream bug if the
    // streams had genuinely been biased rather than merely coupled, and it
    // guards the `pick` call that chooses a bind bundle.
    const buckets = [0, 0, 0, 0];
    for (let i = 0; i < 20000; i++) {
      buckets[Math.floor(makeRng(hashSeed(`name${i}`))() * 4)]++;
    }
    for (const count of buckets) {
      expect(count).toBeGreaterThan(4500);
      expect(count).toBeLessThan(5500);
    }
  });
});

describe("deriveSeed", () => {
  it("gives each consumer an independent stream from one telling seed", () => {
    // The bug this exists for: the narration plan and the assembler both drew
    // from the raw seed, so their decisions were coupled and one expansion
    // fragment filled 64% of its slot instead of a third.
    const seed = tellingSeed({
      heroName: "Ada",
      sourceId: "cinderella",
      ageBand: "6-8",
      length: "medium",
    });
    const plan = makeRng(deriveSeed(seed, "plan"));
    const prose = makeRng(deriveSeed(seed, "prose"));
    expect([plan(), plan(), plan()]).not.toEqual([prose(), prose(), prose()]);
  });

  it("is still reproducible per label", () => {
    expect(deriveSeed(99, "plan")).toBe(deriveSeed(99, "plan"));
    expect(deriveSeed(99, "plan")).not.toBe(deriveSeed(99, "prose"));
  });
});

describe("tellingSeed", () => {
  it("ignores case and surrounding space in the hero's name", () => {
    const base = { sourceId: "cinderella", ageBand: "6-8", length: "medium" };
    expect(tellingSeed({ ...base, heroName: " Ada " })).toBe(
      tellingSeed({ ...base, heroName: "ada" }),
    );
  });

  it("changes with the nonce, which is what 'another one' depends on", () => {
    const base = {
      heroName: "Ada",
      sourceId: "cinderella",
      ageBand: "6-8",
      length: "medium",
    };
    expect(tellingSeed(base)).not.toBe(tellingSeed({ ...base, nonce: "1" }));
  });
});

describe("pick and shuffled", () => {
  it("pick throws on an empty list rather than returning undefined", () => {
    expect(() => pick([], makeRng(1))).toThrow(/empty/);
  });

  it("shuffled keeps every element and leaves the input alone", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffled(input, makeRng(3));
    expect(out.slice().sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});
