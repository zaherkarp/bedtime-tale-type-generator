import { describe, it, expect } from "vitest";
import { ATU_INDEX, getAtuEntry } from "@/lib/atu-index";
import { ATU_CANONICAL_TITLES } from "@/lib/atu-canonical";
import { TALE_TYPES } from "@/lib/tale-types";

/**
 * The catalogue's contract with the ATU knowledge base.
 *
 * The knowledge base supplies the folkloric fact — the canonical scholarly
 * title, with its source and licence. The app supplies the bedtime voice. These
 * tests are the guardrail on the generated file (`lib/atu-canonical.ts`) and,
 * more importantly, on the boundary itself: a future sync must never be able to
 * overwrite authored content.
 */
describe("ATU canonical titles", () => {
  it("attaches a sourced canonical title to catalogue entries", () => {
    const withCanonical = ATU_INDEX.filter((e) => e.canonical);
    expect(withCanonical.length).toBeGreaterThan(40);
    for (const entry of withCanonical) {
      expect(entry.canonical!.title.length, `${entry.atu} title`).toBeGreaterThan(0);
      expect(entry.canonical!.source, `${entry.atu} source`).toMatch(
        /^(wikidata_p2540|trilogy|tmi_mellmann)$/,
      );
      expect(entry.canonical!.spdx, `${entry.atu} spdx`).toMatch(/^CC/);
      expect(typeof entry.canonical!.disputed).toBe("boolean");
    }
  });

  it("keeps every generated key pointing at a real catalogue entry", () => {
    const present = new Set(ATU_INDEX.map((e) => e.atu));
    for (const atu of Object.keys(ATU_CANONICAL_TITLES)) {
      expect(present.has(atu), `generated ${atu} is not in the catalogue`).toBe(true);
    }
  });

  it("never replaces the bedtime title with the scholarly one", () => {
    // ATU 328's canonical title is "The Boy Steals the Ogre's Treasure". That is
    // correct, and it is not what a five-year-old should be shown. Both exist,
    // and the app renders its own.
    const jack = getAtuEntry("jack-and-the-beanstalk");
    expect(jack?.title).toBe("Jack and the Beanstalk");
    expect(jack?.canonical?.title).not.toBe(jack?.title);
  });

  it("leaves featured entries' titles owned by the tale-type registry", () => {
    for (const tale of TALE_TYPES) {
      expect(getAtuEntry(tale.id)?.title).toBe(tale.label);
    }
  });

  it("flags titles the knowledge base's sources still disagree about", () => {
    const disputed = ATU_INDEX.filter((e) => e.canonical?.disputed);
    // A consumer can tell "the sources agree" from "we picked one"; without the
    // flag, a generated title would look equally settled either way.
    expect(disputed.length).toBeGreaterThan(0);
    expect(disputed.length).toBeLessThan(ATU_INDEX.length);
  });

  it("carries the share-alike licence the knowledge base computed", () => {
    // ATU records draw on trilogy (CC-BY-SA-4.0) as well as Wikidata (CC0), and
    // share-alike is contagious — so the effective licence of a title is
    // CC-BY-SA-4.0 even when the title itself came from the CC0 source.
    const cinderella = getAtuEntry("cinderella");
    expect(cinderella?.canonical?.spdx).toBe("CC-BY-SA-4.0");
  });

  it("tolerates a catalogue entry the knowledge base has not covered", () => {
    // Wikidata's ATU coverage is incomplete by design; a gap must never delete
    // curated bedtime content.
    const uncovered = ATU_INDEX.filter((e) => !e.canonical);
    for (const entry of uncovered) {
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.blurb.length).toBeGreaterThan(0);
    }
  });
});
