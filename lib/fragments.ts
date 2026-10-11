/**
 * The tagged fragment store — the data half of the assembly engine.
 *
 * ## What a fragment is
 *
 * One whole paragraph of bedtime prose, interchangeable with its siblings in
 * the same group. The engine chooses between fragments and never composes
 * below the paragraph. That boundary is the central decision in
 * `docs/procedural-assembly-design.md`: Improv's machinery is perfectly able
 * to assemble clauses, and Emily Short's advice is not to use it that way for
 * prose meant to read well. Seams and agreement bugs live below the paragraph.
 *
 * ## Tags, and why they are arrays
 *
 * A tag is an array of strings from general to specific, which is Improv's
 * convention and is kept verbatim here so anyone who knows that prior art can
 * read this code. `["age", "6-8"]` is a tag; so is
 * `["slot", "spine", "3"]`. The array shape is what gives us *specificity
 * fallback*: a fragment tagged `["setting", "forest"]` beats one tagged
 * `["setting"]` when the model carries `["setting", "forest", "night"]`, and
 * the general one still covers every setting nobody wrote a specific fragment
 * for. That is the same idea as the most-specific-rule-wins ranking in Valve's
 * dynamic dialog system.
 *
 * ## What is NOT in a fragment
 *
 * No child's name, no pronouns, no companion, no place name. Those arrive
 * through `{{slot}}` placeholders resolved at assembly time, so two fragments
 * never have to agree with each other about a detail — only with the slot
 * table, which is machine-checked. See `SLOT_PATTERN` below.
 */

/** A tag: category first, then increasingly specific values. */
export type Tag = readonly string[];

/**
 * One interchangeable paragraph.
 *
 * `id` is stable and is what the audit counts and what a saved telling records,
 * so it must not be regenerated when the file is rebaked. The bake script
 * derives it from the slot id plus an index.
 */
export interface Fragment {
  id: string;
  /** The prose, with `{{placeholder}}` slots. Exactly one paragraph. */
  text: string;
  /**
   * Alternative *bundles* of values this fragment introduces and freezes.
   *
   * This is Improv's `bind`, with one change that writing a real corpus forced.
   * The obvious shape is per-key candidates — `{helper: [...], gift: [...]}` —
   * and it is wrong. Drawing each key independently let a telling hand over a
   * stitched cloak in one paragraph and leave a glass slipper on the step three
   * paragraphs later. The keys are correlated, so they have to be chosen
   * together: one bundle wins and every key in it is frozen at once.
   *
   * Keys already bound earlier in the telling are left alone, so the first
   * fragment to offer a key owns it.
   */
  binds?: readonly BindBundle[];
}

/**
 * The grammatical forms a bound value needs.
 *
 * One string per value is not enough, and reading the first assembled tellings
 * is how that became obvious. A value is introduced once ("a cloak stitched out
 * of dusk") and referred to afterwards ("the cloak"); using the introduction
 * form on a second mention produces "a cloak stitched out of dusk did what it
 * had come to do", which is not English. A fragment asks for the form it needs
 * with `{{gift}}` or `{{gift:the}}`.
 *
 * A plain string is still allowed for values that need no inflection — a place
 * name like "the lantern-lit barn" reads correctly in every position.
 */
export interface BindForms {
  /** First mention, with its own article: "a cloak stitched out of dusk". */
  a: string;
  /** Later mentions: "the cloak". */
  the: string;
}

export type BindValue = string | BindForms;

/**
 * One correlated set of frozen values.
 *
 * Correlated because the keys describe one object between them: a telling that
 * hands over a pair of glass-grey slippers must leave a glass-grey slipper on
 * the step, not a pearl button. Drawing each key independently produced exactly
 * that mismatch, so a bundle is chosen whole.
 */
export type BindBundle = Readonly<Record<string, BindValue>>;

/**
 * A set of fragments sharing one tag set.
 *
 * Groups exist rather than per-fragment tags because that is the unit the bake
 * writes: one API call produces K interchangeable paragraphs for one
 * (slot, age, condition) combination, and they share their tags by
 * construction. Flattening tags onto fragments would let the bake drift into
 * writing K paragraphs that are *not* interchangeable.
 */
export interface FragmentGroup {
  tags: readonly Tag[];
  fragments: readonly Fragment[];
}

/** Everything available for one slot. */
export interface SlotFragments {
  slotId: string;
  groups: readonly FragmentGroup[];
}

/**
 * A baked file: the fragments for one (source, age band, length).
 *
 * `provenance` is not decoration, and it follows the precedent already set by
 * `TaleType.source` and `FableSource.confidence` in this repository: a reader
 * is entitled to know whether prose was written by a person or generated, and
 * by what. A fixture hand-written to exercise the engine is a different thing
 * from a bake, and averaging the two together in one unmarked file is exactly
 * the mistake the per-entry `source` field was introduced to stop.
 */
export interface FragmentStore {
  sourceKind: "atu" | "fable";
  sourceId: string;
  ageBand: string;
  length: string;
  provenance: FragmentProvenance;
  slots: readonly SlotFragments[];
}

export type FragmentProvenance =
  | {
      kind: "generated";
      /** The exact model id that wrote these fragments. */
      model: string;
      /**
       * How it was produced. `"bake-script"` is `scripts/bake-fragments.ts`;
       * `"session"` means a model wrote them directly in a working session,
       * which is the same authorship but not the same reproducibility, and the
       * difference is worth recording rather than averaging away.
       */
      via: "bake-script" | "session";
      /** ISO date, so a stale corpus is visible. */
      at: string;
      note?: string;
    }
  | {
      kind: "fixture";
      /** Why a hand-written fixture exists, in one line. */
      note: string;
    };

/**
 * Placeholders the assembler resolves: a name, optionally with a grammatical
 * form after a colon (`{{gift}}`, `{{gift:the}}`). Anything else is a bug in the
 * bake, and `scripts/audit-fragments.ts` fails the build on an unknown one
 * rather than letting `{{whatever}}` reach a child.
 */
export const SLOT_PATTERN = /\{\{([a-z][a-z0-9]*)(?::([a-z]+))?\}\}/g;

/**
 * The placeholders every fragment may use without declaring anything.
 *
 * `they`/`them`/`their` are here because grammatical agreement is the slot
 * layer's job. A fragment writes "{{they}} tiptoed" and the table supplies a
 * consistent set; a fragment that wrote "she tiptoed" would be unusable for
 * half the children who pick it, and no amount of careful generation makes
 * that safe.
 */
export const UNIVERSAL_SLOTS = [
  "hero",
  "they",
  "them",
  "their",
  "theirs",
  "themself",
  "companion",
  "setting",
] as const;

/** How well a group's tags match the model. See the module note on tags. */
export interface TagMatch {
  /** Sum of matched tag lengths. Higher is more specific. */
  score: number;
  /** True when some group tag contradicts the model and the group is out. */
  excluded: boolean;
}

/**
 * Score one group against the model's tags.
 *
 * Three outcomes per group tag, and the middle one is the interesting one:
 *
 * - The model has no tag in this category → neutral. The group is still
 *   eligible. This is what lets a fragment tagged `["element", "gift"]` sit in
 *   the pool for a telling that never decided anything about elements.
 * - The model has a tag in this category and the group tag is a prefix of it →
 *   a match worth `tag.length`, so longer (more specific) agreement wins.
 * - The model has a tag in this category and the group tag diverges → the
 *   group is excluded outright. A fragment written for a forest must not be
 *   offered for a telling already committed to the sea.
 */
export function scoreGroup(group: FragmentGroup, model: readonly Tag[]): TagMatch {
  let score = 0;

  for (const groupTag of group.tags) {
    const category = groupTag[0];
    const modelTags = model.filter((m) => m[0] === category);
    if (modelTags.length === 0) continue; // neutral

    const best = modelTags.reduce<number>((acc, modelTag) => {
      // Prefix test: every element the group names must agree with the model.
      const agrees = groupTag.every((part, i) => modelTag[i] === part);
      return agrees ? Math.max(acc, groupTag.length) : acc;
    }, -1);

    if (best < 0) return { score: 0, excluded: true };
    score += best;
  }

  return { score, excluded: false };
}

/** Flatten a store into a slot lookup, for the assembler's inner loop. */
export function indexSlots(
  store: FragmentStore,
): ReadonlyMap<string, readonly FragmentGroup[]> {
  return new Map(store.slots.map((s) => [s.slotId, s.groups]));
}

/** Every fragment id in a store, for the audit's dead-fragment check. */
export function allFragmentIds(store: FragmentStore): string[] {
  return store.slots.flatMap((slot) =>
    slot.groups.flatMap((group) => group.fragments.map((f) => f.id)),
  );
}
