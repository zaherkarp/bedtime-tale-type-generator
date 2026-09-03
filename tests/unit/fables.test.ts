import { describe, it, expect } from "vitest";
import {
  FABLES,
  FABLE_IDS,
  FABLE_TRADITIONS,
  ADAPTATION_CONCERNS,
  PRESENT_TRADITIONS,
  getFable,
  isBelowAgeFloor,
} from "@/lib/fables";
import { ATU_TYPE_IDS } from "@/lib/atu-index";

describe("the curated fable corpus", () => {
  it("is a small, hand-modelled seed corpus", () => {
    // Deliberately bounded. The architecture is the deliverable here, not the
    // collection; a test that fires when this quietly becomes a scrape is
    // worth more than the two seconds it costs.
    expect(FABLES.length).toBeGreaterThanOrEqual(6);
    expect(FABLES.length).toBeLessThanOrEqual(12);
  });

  it("has unique ids that never collide with an ATU tale-type id", () => {
    expect(new Set(FABLE_IDS).size).toBe(FABLE_IDS.length);
    // The two families share the `taleTypeId` field in saved library entries,
    // so an id in both catalogues would make a saved tale ambiguous.
    for (const id of FABLE_IDS) {
      expect(ATU_TYPE_IDS).not.toContain(id);
    }
  });

  it("represents several named traditions, none of them a continent", () => {
    expect(PRESENT_TRADITIONS.length).toBeGreaterThanOrEqual(5);
    for (const t of FABLE_TRADITIONS) {
      expect(t).not.toMatch(/^(African|Asian|European)$/i);
    }
  });

  it("gives every fable the fields the picker and the prompt both need", () => {
    for (const f of FABLES) {
      expect(f.id).toMatch(/^[a-z0-9-]+$/);
      expect(f.title.length).toBeGreaterThan(0);
      expect(f.emoji.length).toBeGreaterThan(0);
      expect(FABLE_TRADITIONS).toContain(f.tradition);
      expect(f.setup.length).toBeGreaterThan(20);
      expect(f.themes.length).toBeGreaterThan(0);
      // A kernel needs enough beats to have a cause and a consequence.
      expect(f.coreBeats.length).toBeGreaterThanOrEqual(4);
      expect(f.expansionBeats?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("names something to preserve for every fable, and a concern is never left unanswered", () => {
    for (const f of FABLES) {
      const a = f.adaptation;
      // The anti-sterilisation rule: an adaptation that only subtracts has no
      // way to say what made the fable worth telling.
      expect(a.preserve.length).toBeGreaterThan(0);
      for (const c of a.concerns) expect(ADAPTATION_CONCERNS).toContain(c);
      if (a.concerns.length > 0) {
        const handled =
          (a.soften?.length ?? 0) +
          (a.substitute?.length ?? 0) +
          (a.remove?.length ?? 0);
        expect(handled).toBeGreaterThan(0);
      }
    }
  });

  it("records provenance honestly: anything less than certain says what is uncertain", () => {
    for (const f of FABLES) {
      if (!f.source) continue;
      expect(["high", "medium", "low"]).toContain(f.source.confidence);
      if (f.source.confidence !== "high") {
        expect(f.source.note?.length ?? 0).toBeGreaterThan(20);
      }
    }
  });

  it("stores no traditional prose — beats are summaries, not text", () => {
    for (const f of FABLES) {
      for (const beat of [...f.coreBeats, ...(f.expansionBeats ?? [])]) {
        // Quoted speech would be the first sign that someone pasted a telling
        // in rather than describing the structure.
        expect(beat).not.toMatch(/[“”"]/);
      }
    }
  });

  it("looks a fable up by id and misses quietly", () => {
    expect(getFable("lion-and-the-mouse")?.title).toBe("The Lion and the Mouse");
    expect(getFable("no-such-fable")).toBeUndefined();
  });
});

describe("isBelowAgeFloor", () => {
  const withFloor = getFable("monkey-and-the-crocodile")!;
  const withoutFloor = getFable("the-old-man-and-the-mountains")!;

  it("flags a listener younger than the fable's floor", () => {
    expect(withFloor.adaptation.ageFloor).toBe(6);
    expect(isBelowAgeFloor(withFloor, "3-5")).toBe(true);
    expect(isBelowAgeFloor(withFloor, "6-8")).toBe(false);
    expect(isBelowAgeFloor(withFloor, "9-12")).toBe(false);
  });

  it("never flags a fable whose floor is at or below the youngest band", () => {
    expect(isBelowAgeFloor(withoutFloor, "3-5")).toBe(false);
  });
});
