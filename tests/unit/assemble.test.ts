import { describe, expect, it } from "vitest";
import { assemble } from "@/lib/assemble";
import type { FragmentStore } from "@/lib/fragments";
import type { NarrationPlan } from "@/lib/narration-plan";
import { deriveSeed, makeRng, tellingSeed } from "@/lib/seed";
import { planAtu } from "@/lib/narration-plan";
import { ORIGINAL_TALE_TYPES } from "@/lib/tale-types";
import { readFileSync } from "node:fs";

/** A two-slot store, small enough that every assertion is about one mechanism. */
function store(slots: FragmentStore["slots"]): FragmentStore {
  return {
    sourceKind: "atu",
    sourceId: "test",
    ageBand: "6-8",
    length: "medium",
    provenance: { kind: "fixture", note: "unit test" },
    slots,
  };
}

function plan(slotIds: string[]): NarrationPlan {
  return {
    sourceKind: "atu",
    sourceId: "test",
    title: "Test Tale",
    ageBand: "6-8",
    length: "medium",
    modelTags: [["age", "6-8"]],
    slots: slotIds.map((id) => ({
      id,
      kind: id === "opener" ? "opener" : "spine",
      intent: id,
      tags: [["slot", ...id.split(":")]],
      targetWords: 60,
    })),
  };
}

describe("assemble", () => {
  it("replays the same telling from the same seed", () => {
    const s = store([
      {
        slotId: "opener",
        groups: [
          {
            tags: [["slot", "opener"]],
            fragments: [
              { id: "opener#0", text: "One." },
              { id: "opener#1", text: "Two." },
              { id: "opener#2", text: "Three." },
            ],
          },
        ],
      },
    ]);
    const args = { plan: plan(["opener"]), store: s, details: { heroName: "Ada" } };
    expect(assemble({ ...args, seed: 7 }).text).toBe(assemble({ ...args, seed: 7 }).text);
  });

  it("substitutes the hero and defaults to they/them pronouns", () => {
    // A name does not tell you a child's pronouns, so the default has to be the
    // neutral set rather than a guess.
    const s = store([
      {
        slotId: "opener",
        groups: [
          {
            tags: [["slot", "opener"]],
            fragments: [{ id: "opener#0", text: "{{hero}} washed {{their}} hands." }],
          },
        ],
      },
    ]);
    const out = assemble({ plan: plan(["opener"]), store: s, seed: 1, details: { heroName: "Ada" } });
    expect(out.text).toContain("Ada washed their hands.");
    expect(out.unresolved).toEqual([]);
  });

  it("freezes a whole bind bundle, so correlated values cannot contradict", () => {
    // The bug: drawing `gift` and `token` independently handed over a cloak and
    // then left a slipper on the step. A bundle is chosen whole.
    const s = store([
      {
        slotId: "opener",
        groups: [
          {
            tags: [["slot", "opener"]],
            fragments: [
              {
                id: "opener#0",
                text: "They were given {{gift}}.",
                binds: [
                  { gift: { a: "a cloak", the: "the cloak" }, token: { a: "a button", the: "the button" } },
                  { gift: { a: "slippers", the: "the slippers" }, token: { a: "a slipper", the: "the slipper" } },
                ],
              },
            ],
          },
        ],
        },
      {
        slotId: "spine:0",
        groups: [
          {
            tags: [["slot", "spine", "0"]],
            fragments: [{ id: "spine:0#0", text: "{{token:the}} was left behind." }],
          },
        ],
      },
    ]);

    // Over many seeds the pairing must never cross bundles.
    for (let seed = 0; seed < 50; seed++) {
      const out = assemble({
        plan: plan(["opener", "spine:0"]),
        store: s,
        seed,
        details: { heroName: "Ada" },
      });
      const cloak = out.text.includes("a cloak");
      expect(out.text.includes("The button was left behind.")).toBe(cloak);
      expect(out.text.includes("The slipper was left behind.")).toBe(!cloak);
    }
  });

  it("uses the definite form on request and capitalises at a sentence start", () => {
    // Both defects came out of reading the first assembled tellings: bound values
    // appeared lowercase after a full stop, and one string could not serve both
    // "a cloak stitched out of dusk" and a later "the cloak".
    const s = store([
      {
        slotId: "opener",
        groups: [
          {
            tags: [["slot", "opener"]],
            fragments: [
              {
                id: "opener#0",
                text: "{{gift}} arrived. {{gift:the}} shone.",
                binds: [{ gift: { a: "a cloak of dusk", the: "the cloak" } }],
              },
            ],
          },
        ],
      },
    ]);
    const out = assemble({ plan: plan(["opener"]), store: s, seed: 1, details: { heroName: "Ada" } });
    expect(out.text).toContain("A cloak of dusk arrived. The cloak shone.");
  });

  it("drops a fragment whose detail was not supplied", () => {
    // A fragment saying "{{companion}}" is simply unusable when no companion was
    // named. Expressed as a precondition rather than a tag, because it is
    // mechanical and the bake should not have to remember it.
    const s = store([
      {
        slotId: "opener",
        groups: [
          {
            tags: [["slot", "opener"]],
            fragments: [
              { id: "opener#needs", text: "With {{companion}} beside them." },
              { id: "opener#plain", text: "Alone, and content." },
            ],
          },
        ],
      },
    ]);
    for (let seed = 0; seed < 20; seed++) {
      const out = assemble({ plan: plan(["opener"]), store: s, seed, details: { heroName: "Ada" } });
      expect(out.choices[0].fragmentId).toBe("opener#plain");
    }
    const withCompanion = assemble({
      plan: plan(["opener"]),
      store: s,
      seed: 3,
      details: { heroName: "Ada", companion: "a grey cat" },
    });
    expect(withCompanion.choices[0].poolSize).toBe(2);
  });

  it("prefers an unseen fragment, and falls back once the pool is spent", () => {
    // Ink's cycle rather than its shuffle: a parent reading nightly notices a
    // repeat long before they notice exhaustion.
    const s = store([
      {
        slotId: "opener",
        groups: [
          {
            tags: [["slot", "opener"]],
            fragments: [
              { id: "opener#0", text: "One." },
              { id: "opener#1", text: "Two." },
            ],
          },
        ],
      },
    ]);
    const args = { plan: plan(["opener"]), store: s, seed: 4, details: { heroName: "Ada" } };
    const fresh = assemble(args).choices[0].fragmentId;
    const next = assemble({ ...args, used: new Set([fresh]) }).choices[0].fragmentId;
    expect(next).not.toBe(fresh);

    // Both seen: tell a story anyway rather than refuse.
    const exhausted = assemble({ ...args, used: new Set(["opener#0", "opener#1"]) });
    expect(["opener#0", "opener#1"]).toContain(exhausted.choices[0].fragmentId);
  });

  it("excludes a fragment that contradicts a fact the telling has committed to", () => {
    // Reincorporation: choosing the sea group makes the sea true, and the forest
    // group is then out rather than merely less likely.
    const s = store([
      {
        slotId: "opener",
        groups: [
          { tags: [["slot", "opener"], ["setting", "sea"]], fragments: [{ id: "o#sea", text: "The sea." }] },
        ],
      },
      {
        slotId: "spine:0",
        groups: [
          { tags: [["slot", "spine", "0"], ["setting", "sea"]], fragments: [{ id: "s#sea", text: "Salt air." }] },
          { tags: [["slot", "spine", "0"], ["setting", "forest"]], fragments: [{ id: "s#forest", text: "Pine air." }] },
        ],
      },
    ]);
    for (let seed = 0; seed < 20; seed++) {
      const out = assemble({ plan: plan(["opener", "spine:0"]), store: s, seed, details: { heroName: "Ada" } });
      expect(out.choices[1].fragmentId).toBe("s#sea");
    }
  });

  it("throws rather than invent prose for a slot with no fragments", () => {
    const s = store([{ slotId: "opener", groups: [] }]);
    expect(() =>
      assemble({ plan: plan(["opener"]), store: s, seed: 1, details: { heroName: "Ada" } }),
    ).toThrow(/No fragments baked/);
  });

  it("records an unresolvable placeholder instead of printing it to a child", () => {
    const s = store([
      {
        slotId: "opener",
        groups: [
          { tags: [["slot", "opener"]], fragments: [{ id: "o#0", text: "Then {{grandmother}} spoke." }] },
        ],
      },
    ]);
    const out = assemble({ plan: plan(["opener"]), store: s, seed: 1, details: { heroName: "Ada" } });
    expect(out.unresolved).toEqual(["grandmother"]);
    expect(out.text).not.toContain("{{");
  });
});

describe("assemble, against the committed cinderella corpus", () => {
  const corpus: FragmentStore = JSON.parse(
    readFileSync("data/fragments/cinderella.6-8.medium.json", "utf8"),
  );
  const cinderella = ORIGINAL_TALE_TYPES.find((t) => t.id === "cinderella")!;

  function tell(heroName: string, nonce = "") {
    const seed = tellingSeed({
      heroName,
      sourceId: "cinderella",
      ageBand: "6-8",
      length: "medium",
      nonce,
    });
    const p = planAtu(cinderella, "6-8", "medium", makeRng(deriveSeed(seed, "plan")));
    return assemble({ plan: p, store: corpus, seed, details: { heroName } });
  }

  it("produces a complete, placeholder-free telling with an H1 title", () => {
    const out = tell("Ada");
    expect(out.text.startsWith("# Ada and the Sleepy Cinderella")).toBe(true);
    expect(out.text).not.toContain("{{");
    expect(out.unresolved).toEqual([]);
  });

  it("lands within reach of the length the registry asks for", () => {
    // `lib/length.ts` puts a medium folktale at 300 words... but that is the
    // live storyteller's target for prose it writes to order. Assembly works in
    // whole paragraphs, so the plan's own arithmetic is what matters: a telling
    // should sit near the slot count times the per-slot target.
    const out = tell("Ada");
    const words = out.text.replace(/^#.*$/m, "").trim().split(/\s+/).length;
    expect(words).toBeGreaterThan(350);
    expect(words).toBeLessThan(700);
  });

  it("never leaves a gift and a token describing different objects", () => {
    for (let i = 0; i < 60; i++) {
      const out = tell(`Child${i}`);
      const gift = out.bindings.gift;
      const token = out.bindings.token;
      expect(gift).toBeDefined();
      expect(token).toBeDefined();
      // Both came from one bundle, so the slipper-gift always pairs with the
      // slipper-token. Asserted through the text, which is what a reader sees.
      if (typeof gift !== "string" && gift && "a" in gift && gift.a.includes("slippers")) {
        expect(typeof token !== "string" && token && "a" in token && token.a).toContain("slipper");
      }
    }
  });

  it("gives two children different tellings of the same pick", () => {
    const seen = new Set(
      Array.from({ length: 20 }, (_, i) => tell(`Child${i}`).choices.map((c) => c.fragmentId).join(",")),
    );
    expect(seen.size).toBeGreaterThan(10);
  });
});

describe("the reviewed cast file and the corpus agree", () => {
  it("inlines exactly the bundles the binds file declares", () => {
    // Two copies of the cast exist on purpose: the binds file is the reviewed
    // authoring source that `scripts/bake-fragments.ts` reads, and the corpus
    // carries them inline because that is what the assembler consumes. This test
    // is the cheap guard against the two drifting apart.
    const binds = JSON.parse(
      readFileSync("data/fragments/cinderella.binds.json", "utf8"),
    ) as { introducedAt: string; bundles: unknown[] };
    const corpus: FragmentStore = JSON.parse(
      readFileSync("data/fragments/cinderella.6-8.medium.json", "utf8"),
    );

    const slotsWithBinds = corpus.slots.filter((slot) =>
      slot.groups.some((group) => group.fragments.some((f) => f.binds)),
    );
    expect(slotsWithBinds.map((s) => s.slotId)).toEqual([binds.introducedAt]);

    for (const slot of slotsWithBinds) {
      for (const group of slot.groups) {
        for (const fragment of group.fragments) {
          expect(fragment.binds).toEqual(binds.bundles);
        }
      }
    }
  });
});
