import { describe, it, expect } from "vitest";
import { MOTIFS_BY_ATU, MOTIF_CODES, motifsFor } from "@/lib/motifs";
import { unsafeTermsIn } from "@/lib/safety";
import { ATU_INDEX } from "@/lib/atu-index";
import { buildUserBrief } from "@/lib/prompt";
import { taleRequestSchema } from "@/lib/schema";

const baseRequest = {
  taleTypeId: "cinderella",
  heroName: "Amara",
  ageBand: "6-8",
  length: "short",
};

describe("motif data", () => {
  it("carries motifs for a meaningful share of the catalogue", () => {
    expect(Object.keys(MOTIFS_BY_ATU).length).toBeGreaterThan(100);
    expect(MOTIF_CODES.size).toBeGreaterThan(200);
  });

  it("only references ATU numbers the catalogue actually has", () => {
    const known = new Set(ATU_INDEX.map((e) => e.atu));
    for (const atu of Object.keys(MOTIFS_BY_ATU)) {
      expect(known.has(atu), `ATU ${atu} not in the catalogue`).toBe(true);
    }
  });

  it("never carries a label that trips the safety screen", () => {
    for (const [atu, motifs] of Object.entries(MOTIFS_BY_ATU)) {
      for (const m of motifs) {
        expect(unsafeTermsIn(m.label), `${atu} ${m.code}`).toEqual([]);
      }
    }
  });

  it("keeps labels short enough to be a motif rather than a plot", () => {
    for (const motifs of Object.values(MOTIFS_BY_ATU)) {
      for (const m of motifs) {
        expect(m.label.length, m.code).toBeLessThanOrEqual(90);
        expect(m.label.endsWith("."), m.code).toBe(false);
      }
    }
  });

  it("gives no tale type more motifs than the picker can use well", () => {
    for (const [atu, motifs] of Object.entries(MOTIFS_BY_ATU)) {
      expect(motifs.length, atu).toBeLessThanOrEqual(6);
      expect(motifs.length, atu).toBeGreaterThan(0);
      const codes = motifs.map((m) => m.code);
      expect(new Set(codes).size, `${atu} duplicate codes`).toBe(codes.length);
    }
  });
});

describe("motifs in the prompt", () => {
  it("adds nothing when none are requested", () => {
    const brief = buildUserBrief(taleRequestSchema.parse(baseRequest));
    expect(brief).not.toContain("FOLKLORE MOTIFS");
  });

  it("includes the labels of the motifs asked for", () => {
    const available = motifsFor("510A");
    expect(available.length).toBeGreaterThan(0);
    const brief = buildUserBrief(
      taleRequestSchema.parse({
        ...baseRequest,
        motifCodes: [available[0].code],
      }),
    );
    expect(brief).toContain("FOLKLORE MOTIFS");
    expect(brief).toContain(available[0].label);
  });

  it("frames motifs as ingredients rather than a plot to follow", () => {
    const available = motifsFor("510A");
    const brief = buildUserBrief(
      taleRequestSchema.parse({ ...baseRequest, motifCodes: [available[0].code] }),
    );
    // The knowledge base records these links as inferred, not asserted, so the
    // brief must not present them as the tale's sequence of events.
    expect(brief).toContain("not as a plot to follow");
  });

  it("silently ignores a motif that belongs to a different tale type", () => {
    // Valid code, wrong type. It must not leak into another type's brief.
    const other = Object.entries(MOTIFS_BY_ATU).find(([atu]) => atu !== "510A");
    expect(other).toBeTruthy();
    const [, motifs] = other!;
    const brief = buildUserBrief(
      taleRequestSchema.parse({ ...baseRequest, motifCodes: [motifs[0].code] }),
    );
    expect(brief).not.toContain(motifs[0].label);
  });

  it("rejects unknown motif codes at the schema boundary", () => {
    const parsed = taleRequestSchema.safeParse({
      ...baseRequest,
      motifCodes: ["Z999.9-not-real"],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects more motifs than the cap allows", () => {
    const codes = [...MOTIF_CODES].slice(0, 4);
    const parsed = taleRequestSchema.safeParse({ ...baseRequest, motifCodes: codes });
    expect(parsed.success).toBe(false);
  });
});
