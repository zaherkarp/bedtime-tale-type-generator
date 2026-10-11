import { describe, expect, it } from "vitest";
import { planAtu, planFable, slotSpace, slugify } from "@/lib/narration-plan";
import { makeRng } from "@/lib/seed";
import { ORIGINAL_TALE_TYPES } from "@/lib/tale-types";
import { FABLES } from "@/lib/fables";

const cinderella = ORIGINAL_TALE_TYPES.find((t) => t.id === "cinderella")!;
const lionAndMouse = FABLES.find((f) => f.expansionBeats && f.expansionBeats.length > 2)!;

/** Every seed a plan might be built from, for the property-style assertions. */
const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

describe("planAtu", () => {
  it("narrates every spine beat, in order, exactly once", () => {
    // The product depends on this. An ATU telling that drops or reorders a beat
    // stops being recognisable as its tale type, which is the whole offer.
    for (const seed of SEEDS) {
      const plan = planAtu(cinderella, "6-8", "long", makeRng(seed));
      const spine = plan.slots.filter((s) => s.kind === "spine").map((s) => s.id);
      expect(spine).toEqual(cinderella.beats.map((_, i) => `spine:${i}`));
    }
  });

  it("opens with the opener and lands on the coda", () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const plan = planAtu(cinderella, "3-5", "medium", makeRng(seed));
      expect(plan.slots[0].kind).toBe("opener");
      expect(plan.slots[plan.slots.length - 1].kind).toBe("coda");
    }
  });

  it("never puts an expansion between the final beat and the coda", () => {
    // A digression after the resolution is exactly how a wind-down loses its
    // landing, so the last spine beat and the coda must stay adjacent.
    for (const seed of SEEDS) {
      const plan = planAtu(cinderella, "9-12", "long", makeRng(seed));
      const kinds = plan.slots.map((s) => s.kind);
      expect(kinds[kinds.length - 2]).toBe("spine");
    }
  });

  it("spends more slots on a longer story and none on a short one", () => {
    const count = (length: "short" | "medium" | "long") =>
      planAtu(cinderella, "6-8", length, makeRng(5)).slots.filter(
        (s) => s.kind === "expansion",
      ).length;
    expect(count("short")).toBe(0);
    expect(count("medium")).toBe(2);
    expect(count("long")).toBe(4);
  });

  it("varies which beats are dwelt on between seeds", () => {
    // This is the layer that is supposed to carry perceived variety. If every
    // seed produced the same shape, only wording would differ and the output
    // would be oatmeal however many fragments existed.
    const shapes = new Set(
      SEEDS.slice(0, 40).map((seed) =>
        planAtu(cinderella, "6-8", "medium", makeRng(seed))
          .slots.map((s) => s.id)
          .join(">"),
      ),
    );
    expect(shapes.size).toBeGreaterThan(3);
  });

  it("is reproducible from the same seed", () => {
    const a = planAtu(cinderella, "6-8", "medium", makeRng(99));
    const b = planAtu(cinderella, "6-8", "medium", makeRng(99));
    expect(b).toEqual(a);
  });

  it("only ever asks for slots that slotSpace promises", () => {
    // The bake writes fragments for `slotSpace`. If a plan could ask for a slot
    // outside it, that slot would be permanently empty and assembly would throw
    // at bedtime — and the audit could not catch it, because the fragments would
    // not exist to be counted as dead.
    const promised = new Set(
      slotSpace({ spine: cinderella.beats, expansions: "positional" }).slotIds,
    );
    for (const seed of SEEDS) {
      for (const length of ["short", "medium", "long"] as const) {
        for (const slot of planAtu(cinderella, "6-8", length, makeRng(seed)).slots) {
          expect(promised.has(slot.id)).toBe(true);
        }
      }
    }
  });

  it("foregrounds signature elements as model tags, never as slots", () => {
    // The ordering bug this encodes: signature elements are plot motifs, and a
    // motif cannot be dwelt on before the beat that introduces it. They belong
    // in the selection model, not the running order.
    const plan = planAtu(cinderella, "6-8", "long", makeRng(11));
    expect(plan.modelTags.some((t) => t[0] === "element")).toBe(true);
    expect(plan.slots.every((s) => !s.id.includes("element"))).toBe(true);
  });
});

describe("planFable", () => {
  it("plays every core beat once and keeps expansion beats in authored order", () => {
    // `lib/fables.ts` documents coreBeats as playing once, cleanly, and never
    // repeating for length; expansionBeats are authored as a sequence (a walk
    // home belongs after the encounter), so their relative order is meaningful.
    for (const seed of SEEDS.slice(0, 60)) {
      const plan = planFable(lionAndMouse, "6-8", "long", makeRng(seed));
      expect(plan.slots.filter((s) => s.kind === "spine").map((s) => s.id)).toEqual(
        lionAndMouse.coreBeats.map((_, i) => `spine:${i}`),
      );

      const authoredOrder = lionAndMouse.expansionBeats!.map((b) => `expansion:${slugify(b)}`);
      const used = plan.slots.filter((s) => s.kind === "expansion").map((s) => s.id);
      const positions = used.map((id) => authoredOrder.indexOf(id));
      expect(positions).toEqual(positions.slice().sort((a, b) => a - b));
    }
  });

  it("gives a fable more room than a folktale at the same length", () => {
    const fable = planFable(lionAndMouse, "6-8", "short", makeRng(1)).slots.filter(
      (s) => s.kind === "expansion",
    ).length;
    const folktale = planAtu(cinderella, "6-8", "short", makeRng(1)).slots.filter(
      (s) => s.kind === "expansion",
    ).length;
    expect(fable).toBeGreaterThan(folktale);
  });
});

describe("slugify", () => {
  it("produces a stable, tag-safe key from a beat", () => {
    expect(slugify("A small token that leads to a warm recognition")).toBe(
      "a-small-token-that",
    );
  });
});
