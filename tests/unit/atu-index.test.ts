import { describe, it, expect } from "vitest";
import {
  ATU_INDEX,
  ATU_TYPE_IDS,
  ATU_CATEGORIES,
  PRESENT_CATEGORIES,
  atuCategory,
  getAtuEntry,
  searchAtu,
} from "@/lib/atu-index";
import { TALE_TYPES } from "@/lib/tale-types";

describe("ATU index", () => {
  it("includes every featured type plus the extra catalogue", () => {
    const featured = ATU_INDEX.filter((e) => e.featured);
    expect(featured).toHaveLength(TALE_TYPES.length);
    expect(ATU_INDEX.length).toBeGreaterThan(TALE_TYPES.length);
  });

  it("has unique ids and unique ATU numbers", () => {
    const ids = ATU_INDEX.map((e) => e.id);
    const atus = ATU_INDEX.map((e) => e.atu);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(atus).size).toBe(atus.length);
    expect([...ATU_TYPE_IDS].sort()).toEqual([...ids].sort());
  });

  it("has a well-formed, category-consistent entry for every type", () => {
    for (const e of ATU_INDEX) {
      expect(e.id, "id").toMatch(/^[a-z0-9-]+$/);
      expect(e.atu, `${e.id} atu`).toMatch(/^\d+[A-Z]?$/);
      expect(e.title.length, `${e.id} title`).toBeGreaterThan(0);
      expect(e.blurb.length, `${e.id} blurb`).toBeGreaterThan(0);
      expect(e.emoji.length, `${e.id} emoji`).toBeGreaterThan(0);
      expect(ATU_CATEGORIES, `${e.id} category`).toContain(e.category);
      // The declared category must match the one implied by the ATU number.
      expect(atuCategory(e.atu), `${e.id} category range`).toBe(e.category);
    }
  });

  it("keeps featured entries in sync with the rich TaleType registry", () => {
    for (const tale of TALE_TYPES) {
      const entry = getAtuEntry(tale.id);
      expect(entry, `${tale.id} in index`).toBeTruthy();
      expect(entry?.featured).toBe(true);
      expect(entry?.title).toBe(tale.label);
      expect(`ATU ${entry?.atu}`).toBe(tale.atuNumber);
      expect(entry?.category).toBe(tale.category);
    }
  });

  it("looks up by id and returns undefined for unknown ids", () => {
    expect(getAtuEntry("cinderella")?.title).toBe("Cinderella");
    expect(getAtuEntry("stone-soup")?.title).toBe("Stone Soup");
    expect(getAtuEntry("does-not-exist")).toBeUndefined();
  });

  it("maps ATU numbers to the correct top-level category", () => {
    expect(atuCategory("1")).toBe("Animal Tales");
    expect(atuCategory("299")).toBe("Animal Tales");
    expect(atuCategory("300")).toBe("Tales of Magic");
    expect(atuCategory("510A")).toBe("Tales of Magic");
    expect(atuCategory("749")).toBe("Tales of Magic");
    expect(atuCategory("750")).toBe("Religious Tales");
    expect(atuCategory("850")).toBe("Realistic Tales");
    expect(atuCategory("1000")).toBe("Tales of the Stupid Ogre");
    expect(atuCategory("1200")).toBe("Anecdotes and Jokes");
    expect(atuCategory("2000")).toBe("Formula Tales");
    expect(atuCategory("2300")).toBe("Formula Tales");
  });

  it("only advertises categories that actually appear", () => {
    expect(PRESENT_CATEGORIES.length).toBeGreaterThan(0);
    for (const c of PRESENT_CATEGORIES) {
      expect(ATU_CATEGORIES).toContain(c);
      expect(ATU_INDEX.some((e) => e.category === c)).toBe(true);
    }
  });

  it("excludes known non-child-safe tale types entirely", () => {
    // Vampire, Eaten Heart, obscene anecdote, Snow White, Red Riding Hood,
    // Juniper Tree, Bluebeard, Rescue by the Sister — none belong in a bedtime app.
    const unsafe = ["363", "992", "1425", "709", "333", "720", "312", "311"];
    const present = new Set(ATU_INDEX.map((e) => e.atu));
    for (const atu of unsafe) {
      expect(present.has(atu), `unsafe ATU ${atu} must be absent`).toBe(false);
    }
  });

  it("searches by text, filters by category, and by featured flag", () => {
    expect(searchAtu({ query: "cinderella" }).some((e) => e.id === "cinderella")).toBe(
      true,
    );
    expect(searchAtu({ query: "2044" }).some((e) => e.id === "the-enormous-turnip")).toBe(
      true,
    );
    const magic = searchAtu({ category: "Tales of Magic" });
    expect(magic.length).toBeGreaterThan(0);
    expect(magic.every((e) => e.category === "Tales of Magic")).toBe(true);

    const featured = searchAtu({ featuredOnly: true });
    expect(featured).toHaveLength(TALE_TYPES.length);
    expect(featured.every((e) => e.featured)).toBe(true);

    expect(searchAtu({ query: "zzzznope" })).toHaveLength(0);
  });
});
