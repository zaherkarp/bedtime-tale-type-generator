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
      // The real ATU grammar: a number, optional letters, optional asterisks
      // ("2B", "6*", "1525K*", "1730***"). The hand-authored tiers use a much
      // narrower slice of it, asserted separately below.
      expect(e.atu, `${e.id} atu`).toMatch(/^\d+[A-Z]*\*{0,3}$/);
      expect(e.title.length, `${e.id} title`).toBeGreaterThan(0);
      expect(e.emoji.length, `${e.id} emoji`).toBeGreaterThan(0);
      expect(ATU_CATEGORIES, `${e.id} category`).toContain(e.category);
      // The declared category must match the one implied by the ATU number.
      expect(atuCategory(e.atu), `${e.id} category range`).toBe(e.category);
    }
  });

  it("gives every hand-authored entry a blurb and a simple ATU number", () => {
    // Only the generated tier is allowed to go without a description; someone
    // wrote every featured and curated entry by hand and owes it a sentence.
    for (const e of ATU_INDEX.filter((x) => x.tier !== "extended")) {
      expect(e.blurb?.length, `${e.id} blurb`).toBeGreaterThan(0);
      expect(e.atu, `${e.id} atu`).toMatch(/^\d+[A-Z]?$/);
    }
  });

  it("labels every entry with the tier that says how vouched-for it is", () => {
    for (const e of ATU_INDEX) {
      expect(["featured", "curated", "extended"], `${e.id} tier`).toContain(e.tier);
      // `featured` is the old boolean and must never disagree with the tier.
      expect(e.featured, `${e.id} featured/tier agree`).toBe(e.tier === "featured");
    }
    for (const tier of ["featured", "curated", "extended"] as const) {
      expect(ATU_INDEX.some((e) => e.tier === tier), `${tier} present`).toBe(true);
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
    // The regression net. It mattered less when the catalogue was 62 entries
    // somebody had read; with a generated tier in the hundreds it is the thing
    // that catches a bad regeneration, so it lists the well-known grim types
    // across every division rather than a token handful.
    // Every number below was either cut by the read-through recorded in
    // data/atu-blurbs.reviewed.json, or was never a candidate. Together they
    // are the net that catches a regeneration quietly restoring one.
    const unsafe = [
      "35B*", "67**", "75*", "80A*", "93", "107", "136A*", "159*", "168A",
      "184", "204", "215", "236*", "277A", "278", "285B", "285E", "288B**",
      "289", "293", "296", "314A", "321", "325", "401A*", "412", "425*",
      "425D", "425E", "434*", "460A", "471A", "476**", "514", "514**", "552",
      "556F*", "570*", "593", "660", "678", "682", "706D", "708", "736A",
      "737B*", "754**", "760***", "766", "767", "768", "770A*", "772*",
      "774", "774D", "774L", "774P", "798", "802", "804", "805", "813*",
      "827", "830B", "830C", "843*", "853", "853A", "854", "857", "859",
      "862", "871*", "874*", "875*", "877", "879", "879A", "880", "886",
      "890**", "901", "903C*", "920D", "921F", "925", "926", "926C*",
      "927C*", "929A", "934F", "935*", "938", "938A", "938B", "939", "947",
      "958F*", "960C", "980", "2010", "2013", "2019", "2019*", "2031B",
      "2031C", "2250", "2302", "2335",
      // Known-grim types that never reached the generated tier at all.
      "300A", "311", "312", "312A", "315", "327A", "327B", "333", "363",
      "365", "407", "451", "461", "590", "706", "709", "720", "725", "746",
      "756B", "760", "762", "769", "780", "781", "785", "830", "838",
      "883A", "890", "899", "930", "931", "950", "955", "956B", "990",
      "992", "1030A", "1119", "1131", "1191", "1350", "1353", "1360C",
      "1417", "1420", "1425", "1510", "1511", "1516", "1525A", "1730",
      "1740", "1791", "1804", "1825", "1831",
    ];
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
