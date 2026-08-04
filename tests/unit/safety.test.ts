import { describe, it, expect } from "vitest";
import { UNSAFE_TERMS, passesScreen, unsafeTermsIn } from "@/lib/safety";
import { ATU_EXTENDED } from "@/lib/atu-extended";

describe("bedtime-safety screen", () => {
  it("matches stems, not whole words", () => {
    // The regression that prompted the rewrite. The word-matching version held
    // `rape` and `raped` but not `rapes`, so ATU 36 — titled, in the index,
    // "The Fox Rapes the She-Bear" — was proposed as a bedtime tale type.
    expect(unsafeTermsIn("The Fox Rapes the She-Bear")).toContain("rape");
    expect(unsafeTermsIn("Murderess Confesses")).toContain("murder");
    expect(unsafeTermsIn("The Killing of the Goat")).toContain("kill");
    expect(unsafeTermsIn("Torturing the Prisoner")).toContain("tortur");
  });

  it("catches the terms that leaked through earlier versions", () => {
    expect(passesScreen("Eating his own Entrails")).toBe(false);
    expect(passesScreen("The Cut-off Nose (Hair)")).toBe(false);
  });

  it("only matches at word boundaries, so innocent words survive", () => {
    // A substring scan would fire on every one of these.
    // A plain substring scan fires on every one of these: "grape" contains
    // "rape", "change" contains "hang", "assist" contains "assault"'s prefix
    // only at a boundary, and so on.
    expect(passesScreen("The Grape Harvest"), "grape/rape").toBe(true);
    expect(passesScreen("A Change of Heart"), "change/hang").toBe(true);
    expect(passesScreen("The Exchange of Gifts"), "exchange/hang").toBe(true);
    expect(passesScreen("A Basket of Grapes"), "grapes/rape").toBe(true);
  });

  it("passes the gentle tale types the catalogue is built on", () => {
    for (const title of [
      "The Three Little Pigs",
      "Stone Soup",
      "The Endless Tale",
      "Jack and the Beanstalk",
      "The Kind and the Unkind Girls",
      "The Enormous Turnip",
      "Castles in the Air",
    ]) {
      expect(passesScreen(title), title).toBe(true);
    }
  });

  it("keeps every stem long enough not to collide by accident", () => {
    for (const term of UNSAFE_TERMS) {
      if (term.includes(" ")) continue;
      expect(term.length, `stem "${term}"`).toBeGreaterThanOrEqual(4);
      expect(term, `stem "${term}"`).toBe(term.toLowerCase());
    }
  });

  it("never lets a generated catalogue entry through that trips the screen", () => {
    // The whole point of the generated tier: whatever the pipeline did, the
    // text that actually ships has to be clean on its own terms.
    for (const e of ATU_EXTENDED) {
      const hits = unsafeTermsIn(e.title, e.blurb ?? "");
      expect(hits, `${e.atu} ${e.title}`).toEqual([]);
    }
  });
});
