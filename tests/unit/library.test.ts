import { describe, it, expect } from "vitest";
import { saveTale, deleteTale } from "@/lib/library";

// These run in a Node environment (no window/localStorage). The library helpers
// degrade gracefully: persistence is skipped, but the pure list operations and
// entry construction still work and are worth locking down.

const draft = {
  taleTypeId: "cinderella" as const,
  taleTypeLabel: "Cinderella",
  heroName: "Amara",
  ageBand: "6-8" as const,
  length: "medium" as const,
  title: "The Kind Tortoise",
  text: "# The Kind Tortoise\n\nOnce by the river.",
};

describe("library helpers (no storage)", () => {
  it("saveTale builds a stamped entry", () => {
    const list = saveTale(draft);
    expect(list).toHaveLength(1);
    const entry = list[0];
    expect(entry.id).toBeTruthy();
    expect(typeof entry.createdAt).toBe("number");
    expect(entry.title).toBe("The Kind Tortoise");
    expect(entry.heroName).toBe("Amara");
  });

  it("deleteTale filters a non-existent id without throwing", () => {
    expect(deleteTale("missing")).toEqual([]);
  });
});
