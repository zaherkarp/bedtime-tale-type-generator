import { describe, it, expect } from "vitest";
import { ATU_EXTENDED } from "@/lib/atu-extended";
import { ATU_INDEX, atuCategory } from "@/lib/atu-index";
import { TALE_TYPES } from "@/lib/tale-types";

describe("generated ATU tier", () => {
  it("is a substantial expansion of the hand-authored catalogue", () => {
    expect(ATU_EXTENDED.length).toBeGreaterThan(100);
    const handAuthored = ATU_INDEX.filter((e) => e.tier !== "extended");
    expect(ATU_EXTENDED.length).toBeGreaterThan(handAuthored.length);
  });

  it("has a well-formed record for every entry", () => {
    for (const e of ATU_EXTENDED) {
      expect(e.id, e.atu).toMatch(/^atu-[a-z0-9-]+$/);
      expect(e.atu, e.id).toMatch(/^\d+[A-Z]*\*{0,3}$/);
      expect(e.title.length, e.id).toBeGreaterThan(0);
      expect(e.emoji.length, e.id).toBeGreaterThan(0);
      // No blurb is the norm here; an empty string would be a bug.
      if (e.blurb !== undefined) expect(e.blurb.length).toBeGreaterThan(0);
    }
  });

  it("never collides with a hand-authored entry", () => {
    const handAuthored = ATU_INDEX.filter((e) => e.tier !== "extended");
    const numbers = new Set(handAuthored.map((e) => e.atu));
    const ids = new Set(handAuthored.map((e) => e.id));
    for (const e of ATU_EXTENDED) {
      expect(numbers.has(e.atu), `ATU ${e.atu} duplicated`).toBe(false);
      expect(ids.has(e.id), `id ${e.id} duplicated`).toBe(false);
    }
  });

  it("draws from no excluded division", () => {
    // Anecdotes and Jokes (1200–1999) and Tales of the Stupid Ogre (1000–1199)
    // are built on humiliation and on harming an ogre. `SYSTEM_PROMPT` promises
    // the opposite of both, so the generator never proposes from them — this is
    // the assertion that keeps a future regeneration honest about it.
    for (const e of ATU_EXTENDED) {
      const n = parseInt(e.atu, 10);
      expect(Number.isFinite(n), e.atu).toBe(true);
      expect(n >= 1000 && n <= 1999, `${e.atu} is in an excluded range`).toBe(false);
      expect(
        ["Anecdotes and Jokes", "Tales of the Stupid Ogre"],
        `${e.atu} division`,
      ).not.toContain(atuCategory(e.atu));
    }
  });

  it("never shadows a featured type", () => {
    const featured = new Set(TALE_TYPES.map((t) => t.atuNumber.replace(/^ATU\s+/i, "")));
    for (const e of ATU_EXTENDED) {
      expect(featured.has(e.atu), `${e.atu} shadows a featured type`).toBe(false);
    }
  });
});
