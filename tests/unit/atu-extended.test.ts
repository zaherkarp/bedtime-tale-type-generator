import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { ATU_EXTENDED } from "@/lib/atu-extended";
import { ATU_INDEX, atuCategory } from "@/lib/atu-index";
import { TALE_TYPES } from "@/lib/tale-types";
import { EXTENDED_TALE_TYPES } from "@/lib/tale-types-extended-authored";

interface ReviewRecord {
  verdict: "safe" | "unsafe";
  reason?: string;
  blurb?: string;
}

const review: Record<string, ReviewRecord> = JSON.parse(
  readFileSync("data/atu-blurbs.reviewed.json", "utf8"),
).entries;

describe("the review file", () => {
  it("has a verdict for every entry that ships", () => {
    // The screens decide what reaches the review file; the review file decides
    // what reaches the app. An entry with no record would be one nobody read —
    // which is how ATU 980, "The Ungrateful Son", nearly slipped through after
    // a screen change widened the candidate set.
    for (const e of ATU_EXTENDED) {
      expect(review[e.atu], `ATU ${e.atu} (${e.title}) is unreviewed`).toBeDefined();
      expect(review[e.atu].verdict, `ATU ${e.atu}`).toBe("safe");
    }
  });

  it("records a reason for everything it cut", () => {
    const cut = Object.entries(review).filter(([, r]) => r.verdict !== "safe");
    expect(cut.length).toBeGreaterThan(100);
    for (const [atu, r] of cut) {
      expect(r.reason?.length, `ATU ${atu} has no reason`).toBeGreaterThan(10);
    }
  });

  it("never lets a cut tale type back into the catalogue", () => {
    const shipped = new Set(ATU_EXTENDED.map((e) => e.atu));
    for (const [atu, r] of Object.entries(review)) {
      if (r.verdict !== "safe") {
        expect(shipped.has(atu), `cut ATU ${atu} is still shipping`).toBe(false);
      }
    }
  });

  it("gives every surviving entry a blurb", () => {
    for (const e of ATU_EXTENDED) {
      expect(e.blurb?.length, `ATU ${e.atu} (${e.title})`).toBeGreaterThan(20);
    }
  });
});

describe("generated ATU tier", () => {
  it("still holds every type the pipeline produced, promoted or not", () => {
    // This used to assert the generated tier outnumbered the hand-authored one.
    // It no longer can: every type it produced has since been given beats, so
    // `ATU_INDEX` shows none of them as `extended` any more.
    //
    // What is still worth asserting is that promotion never *removed* anything
    // from this file. It is the record of what the knowledge-base pipeline
    // emitted, and it has to stay complete for `catalogue:check` to detect
    // drift and for the promotion test to have something to trace ids back to.
    // Shrinking it would silently narrow the catalogue instead.
    expect(ATU_EXTENDED.length).toBeGreaterThan(100);
    const promoted = new Set(EXTENDED_TALE_TYPES.map((t) => t.id));
    for (const e of ATU_EXTENDED) {
      expect(
        promoted.has(e.id) || ATU_INDEX.some((x) => x.id === e.id),
        `${e.id} is still reachable`,
      ).toBe(true);
    }
  });

  it("has a well-formed record for every entry", () => {
    for (const e of ATU_EXTENDED) {
      expect(e.id, e.atu).toMatch(/^atu-[a-z0-9-]+$/);
      expect(e.atu, e.id).toMatch(/^\d+[A-Z]*\*{0,3}$/);
      expect(e.title.length, e.id).toBeGreaterThan(0);
      expect(e.emoji.length, e.id).toBeGreaterThan(0);
      expect(e.blurb?.length, e.id).toBeGreaterThan(0);
      // Revision footnotes are not part of a title.
      expect(e.title, e.id).not.toContain("(previously");
    }
  });

  it("never collides with a hand-authored entry it did not itself produce", () => {
    // The original invariant was that the generator must never propose a type
    // somebody had already written by hand — a collision there means two rows
    // for one tale, written by two people who did not know about each other.
    //
    // Promotion is the one legitimate way an id ends up on both sides, and it
    // is the opposite situation: the hand-authored entry exists *because* of
    // the generated one, carries the same id deliberately, and is filtered out
    // of the generated tier by `lib/atu-index.ts`. So promoted ids are excluded
    // here, and `tests/unit/atu-index.test.ts` asserts the filter works.
    const promoted = new Set(EXTENDED_TALE_TYPES.map((t) => t.id));
    const handAuthored = ATU_INDEX.filter(
      (e) => e.tier !== "extended" && !promoted.has(e.id),
    );
    const numbers = new Set(handAuthored.map((e) => e.atu));
    const ids = new Set(handAuthored.map((e) => e.id));
    for (const e of ATU_EXTENDED.filter((x) => !promoted.has(x.id))) {
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

  it("never shadows a featured type it was not promoted into", () => {
    // Same carve-out as the collision test above, one field over: a promoted
    // entry keeps its ATU number, so of course that number is now also a
    // featured one. What must still never happen is the generator proposing a
    // number that a *separately* written featured type already claims.
    const promoted = new Set(EXTENDED_TALE_TYPES.map((t) => t.id));
    const featured = new Set(
      TALE_TYPES.filter((t) => !promoted.has(t.id)).map((t) =>
        t.atuNumber.replace(/^ATU\s+/i, ""),
      ),
    );
    for (const e of ATU_EXTENDED.filter((x) => !promoted.has(x.id))) {
      expect(featured.has(e.atu), `${e.atu} shadows a featured type`).toBe(false);
    }
  });
});
