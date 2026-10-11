import { describe, expect, it } from "vitest";
import { SLOT_PATTERN, scoreGroup, type FragmentGroup, type Tag } from "@/lib/fragments";

function group(...tags: Tag[]): FragmentGroup {
  return { tags, fragments: [{ id: "x", text: "x" }] };
}

describe("scoreGroup", () => {
  it("is neutral about a category the model says nothing about", () => {
    // A fragment written for a forest stays eligible in a telling that has not
    // decided anything about settings. This is what keeps specific fragments in
    // the pool instead of requiring the model to pre-declare every dimension.
    const result = scoreGroup(group(["setting", "forest"]), [["age", "6-8"]]);
    expect(result).toEqual({ score: 0, excluded: false });
  });

  it("scores a match by how specific it is", () => {
    const model: Tag[] = [["slot", "spine", "3"]];
    const general = scoreGroup(group(["slot"]), model);
    const specific = scoreGroup(group(["slot", "spine", "3"]), model);
    expect(specific.score).toBeGreaterThan(general.score);
  });

  it("excludes a group that contradicts the model", () => {
    // The reincorporation guarantee: once a telling commits to a forest, a sea
    // fragment is out, not merely ranked lower.
    const result = scoreGroup(group(["setting", "sea"]), [["setting", "forest"]]);
    expect(result.excluded).toBe(true);
  });

  it("treats a group tag more specific than the model as a contradiction", () => {
    // The model knows `["setting", "forest"]`; a fragment demanding
    // `["setting", "forest", "winter"]` is asking for a fact nobody established.
    const result = scoreGroup(group(["setting", "forest", "winter"]), [
      ["setting", "forest"],
    ]);
    expect(result.excluded).toBe(true);
  });

  it("sums across independent categories", () => {
    const result = scoreGroup(group(["age", "6-8"], ["slot", "opener"]), [
      ["age", "6-8"],
      ["slot", "opener"],
    ]);
    expect(result).toEqual({ score: 4, excluded: false });
  });
});

describe("SLOT_PATTERN", () => {
  it("captures a bare name and a name with a grammatical form", () => {
    const found = [...'{{hero}} held {{gift:the}}'.matchAll(SLOT_PATTERN)].map((m) => [
      m[1],
      m[2],
    ]);
    expect(found).toEqual([
      ["hero", undefined],
      ["gift", "the"],
    ]);
  });
});
