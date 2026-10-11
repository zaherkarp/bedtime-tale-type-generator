/**
 * Layer 3 — the selection engine. Bruno Dias's contribution to the architecture.
 *
 * This is Improv's apparatus, reimplemented with its vocabulary intact and two
 * changes. Why reimplement rather than depend on `improv`: the narration plan in
 * `lib/narration-plan.ts` sits *above* Improv's world model and would fight it;
 * selection has to be seeded so a telling can be replayed from a stored number;
 * and this repository is strictly typed where Improv is untyped JS. The engine
 * is small, and it is the part most worth owning.
 *
 * Improv's concepts, and where each one lands here:
 *
 * | Improv          | Here                                                      |
 * | --------------- | --------------------------------------------------------- |
 * | `groups`        | `FragmentGroup` in `lib/fragments.ts`                     |
 * | `tags`          | `Tag`, scored by `scoreGroup`                             |
 * | filters         | `scoreGroup`'s exclusion rule, plus `meetsPreconditions`  |
 * | salience formula| the `salience` option below                               |
 * | `bind`          | `Fragment.binds`, frozen into `Telling.bindings`          |
 * | `reincorporate` | chosen tags merged into the model between slots           |
 * | `audit`         | `Telling.choices`, consumed by `scripts/audit-fragments.ts`|
 *
 * The two additions are the seeded generator (above) and the deck draw, which
 * is Ink's distinction between a shuffle and a cycle. A shuffle picks
 * independently each time; a cycle exhausts its options before repeating. For a
 * parent reading nightly, a repeat is noticed long before exhaustion is, so the
 * cycle is the right default.
 */

import {
  SLOT_PATTERN,
  UNIVERSAL_SLOTS,
  indexSlots,
  scoreGroup,
  type BindValue,
  type Fragment,
  type FragmentGroup,
  type FragmentStore,
  type Tag,
} from "./fragments.ts";
import type { NarrationPlan, Slot } from "./narration-plan.ts";
import { deriveSeed, makeRng, pick, type Rng } from "./seed.ts";

/**
 * Pronouns for the hero.
 *
 * Defaults to they/them, and the default is load-bearing rather than timid: the
 * form in `lib/schema.ts` collects a name and nothing else, and a name does not
 * tell you a child's pronouns. Guessing from one would misgender a real child
 * in a way the neutral default never does. A caller that *knows* can pass a set.
 */
export interface PronounSet {
  they: string;
  them: string;
  their: string;
  theirs: string;
  themself: string;
  /** Whether the verb agrees as plural ("they were") or singular ("she was"). */
  pluralVerb: boolean;
}

export const THEY_THEM: PronounSet = {
  they: "they",
  them: "them",
  their: "their",
  theirs: "theirs",
  themself: "themself",
  pluralVerb: true,
};

export interface TellingDetails {
  heroName: string;
  /** Optional free text from the form. Absent means fragments needing it are out. */
  companion?: string;
  setting?: string;
}

export interface AssembleInput {
  plan: NarrationPlan;
  store: FragmentStore;
  seed: number;
  details: TellingDetails;
  pronouns?: PronounSet;
  /**
   * The telling seed. Both this and the plan must be derived from it with
   * `deriveSeed`, under different labels.
   */
  /**
   * Fragment ids this reader has seen recently. The deck draw prefers anything
   * else, so a nightly reader works through a pool before seeing a repeat. In
   * the app this comes from `localStorage`; in a test it is a literal set.
   */
  used?: ReadonlySet<string>;
  /**
   * How fuzzy the ranking is. Given the best score available, return the lowest
   * score still acceptable. The default keeps only the most specific matches,
   * which is Improv's default too; `(max) => max - 1` widens the pool by one
   * step of specificity and is the knob to reach for when the audit reports
   * fragments that never fire.
   */
  salience?: (max: number) => number;
}

/** One resolved slot: what was chosen, and from where. The audit trail. */
export interface Choice {
  slotId: string;
  fragmentId: string;
  /** The score the winning group achieved, for debugging a surprising pick. */
  score: number;
  /** How many fragments were eligible. A 1 here means the slot has no variety. */
  poolSize: number;
}

export interface Telling {
  /** Markdown, H1 title first, matching the contract in `lib/prompt.ts`. */
  text: string;
  seed: number;
  choices: readonly Choice[];
  bindings: Readonly<Record<string, BindValue>>;
  /**
   * Placeholders no slot or binding could resolve.
   *
   * At runtime these are dropped quietly rather than shown to a child. The
   * audit treats a non-empty list as a build failure, which is the right place
   * to catch a bake that invented `{{grandmother}}`.
   */
  unresolved: readonly string[];
}

export function assemble(input: AssembleInput): Telling {
  const {
    plan,
    store,
    seed,
    details,
    pronouns = THEY_THEM,
    used = new Set<string>(),
    salience = (max) => max,
  } = input;

  const slotIndex = indexSlots(store);
  // A labelled stream, not the raw seed: the narration plan draws from this same
  // seed, and sharing one sequence correlated the two sets of decisions. See
  // `deriveSeed`.
  const rng = makeRng(deriveSeed(seed, "prose"));

  // The model starts as the telling's own facts and grows as fragments are
  // chosen. `slot` tags are never merged into it: they describe where we are,
  // not what is true, and merging one would exclude every later slot.
  const model: Tag[] = plan.modelTags.map((t) => t.slice());
  const bindings: Record<string, BindValue> = {};
  const choices: Choice[] = [];
  const unresolved = new Set<string>();
  const paragraphs: string[] = [];

  for (const slot of plan.slots) {
    const groups = slotIndex.get(slot.id);
    if (!groups || groups.length === 0) {
      // A missing slot is a hole in the bake, not something to paper over with
      // invented prose. Fail loudly here; the audit runs this path in CI.
      throw new Error(
        `No fragments baked for slot "${slot.id}" of ${store.sourceId} (${store.ageBand}/${store.length})`,
      );
    }

    const chosen = resolveSlot({
      slot,
      groups,
      model,
      details,
      used,
      salience,
      rng,
    });

    choices.push(chosen.choice);
    paragraphs.push(chosen.fragment.text);

    // `bind`: choose one bundle and freeze every key in it that is still free.
    // Choosing a bundle rather than each key independently is what keeps the
    // gift and the token describing the same object — see `Fragment.binds`.
    const bundles = chosen.fragment.binds;
    if (bundles && bundles.length > 0) {
      const bundle = pick(bundles, rng);
      for (const [key, value] of Object.entries(bundle)) {
        if (!(key in bindings)) bindings[key] = value;
      }
    }

    // `reincorporate`: what this fragment asserted is now true of the telling.
    mergeTags(model, chosen.group.tags);
  }

  const text = [
    `# ${titleFor(plan.title, details.heroName)}`,
    "",
    ...paragraphs.flatMap((p) => [p, ""]),
  ]
    .join("\n")
    .trimEnd()
    .concat("\n");

  return {
    text: substitute(text, { details, pronouns, bindings, unresolved }),
    seed,
    choices,
    bindings,
    unresolved: [...unresolved],
  };
}

function resolveSlot(args: {
  slot: Slot;
  groups: readonly FragmentGroup[];
  model: readonly Tag[];
  details: TellingDetails;
  used: ReadonlySet<string>;
  salience: (max: number) => number;
  rng: Rng;
}): { fragment: Fragment; group: FragmentGroup; choice: Choice } {
  const { slot, groups, model, details, used, salience, rng } = args;

  // Slot tags join the model only for the duration of this resolution, which is
  // what makes `["slot", "spine", "3"]` select the right group without
  // contaminating the telling's facts.
  const scoringModel = [...model, ...slot.tags];

  const scored = groups
    .map((group) => ({ group, ...scoreGroup(group, scoringModel) }))
    .filter((entry) => !entry.excluded)
    // A group that does not claim this slot at all is not a candidate for it.
    .filter((entry) => entry.group.tags.some((t) => t[0] === "slot"));

  if (scored.length === 0) {
    throw new Error(`Every group for slot "${slot.id}" was excluded by its tags`);
  }

  const best = Math.max(...scored.map((s) => s.score));
  const floor = salience(best);

  // Flatten to fragments, dropping any whose placeholders the details cannot
  // satisfy. This is a precondition rather than a tag because it is mechanical:
  // a fragment that says "{{companion}}" is simply unusable when no companion
  // was named, and expressing that as a tag would make the bake responsible for
  // remembering to add it.
  const eligible = scored
    .filter((entry) => entry.score >= floor)
    .flatMap((entry) =>
      entry.group.fragments
        .filter((fragment) => meetsPreconditions(fragment, details))
        .map((fragment) => ({ fragment, group: entry.group, score: entry.score })),
    );

  if (eligible.length === 0) {
    throw new Error(
      `No usable fragment for slot "${slot.id}": every candidate needed a detail that was not supplied`,
    );
  }

  // The deck draw. Prefer anything unseen; fall back to the whole pool once it
  // is exhausted, rather than refusing to tell a story.
  const unseen = eligible.filter((e) => !used.has(e.fragment.id));
  const pool = unseen.length > 0 ? unseen : eligible;
  const drawn = pick(pool, rng);

  return {
    fragment: drawn.fragment,
    group: drawn.group,
    choice: {
      slotId: slot.id,
      fragmentId: drawn.fragment.id,
      score: drawn.score,
      poolSize: eligible.length,
    },
  };
}

/** True when every universal placeholder this fragment uses has a value. */
function meetsPreconditions(fragment: Fragment, details: TellingDetails): boolean {
  for (const name of placeholdersIn(fragment.text)) {
    if (name === "companion" && !details.companion?.trim()) return false;
    if (name === "setting" && !details.setting?.trim()) return false;
  }
  return true;
}

export function placeholdersIn(text: string): string[] {
  return [...text.matchAll(SLOT_PATTERN)].map((m) => m[1]);
}

/**
 * Merge chosen tags into the model: replace within a category, else append.
 *
 * Replacing rather than accumulating is what makes reincorporation a constraint
 * instead of a growing pile of contradictions. Once a telling has committed to
 * a forest, a later sea fragment is excluded by `scoreGroup`.
 */
function mergeTags(model: Tag[], incoming: readonly Tag[]): void {
  for (const tag of incoming) {
    if (tag[0] === "slot") continue;
    const at = model.findIndex((m) => m[0] === tag[0]);
    if (at >= 0) model[at] = tag.slice();
    else model.push(tag.slice());
  }
}

function substitute(
  text: string,
  ctx: {
    details: TellingDetails;
    pronouns: PronounSet;
    bindings: Readonly<Record<string, BindValue>>;
    unresolved: Set<string>;
  },
): string {
  const { details, pronouns, bindings, unresolved } = ctx;
  const table: Record<string, BindValue | undefined> = {
    hero: details.heroName.trim(),
    companion: details.companion?.trim(),
    setting: details.setting?.trim(),
    they: pronouns.they,
    them: pronouns.them,
    their: pronouns.their,
    theirs: pronouns.theirs,
    themself: pronouns.themself,
    ...bindings,
  };

  return text.replace(
    SLOT_PATTERN,
    (match: string, name: string, form: string | undefined, offset: number) => {
      const value = table[name];
      if (value === undefined) {
        unresolved.add(name);
        return "";
      }

      const resolved = selectForm(value, form);
      if (resolved === "") {
        unresolved.add(name);
        return "";
      }

      // A bound value written as "a moth with lamplight wings" is lowercase by
      // construction, so a fragment that opens a sentence with it needs the
      // capital supplied here. The alternative — asking the bake for a
      // capitalised variant of every value — multiplies the corpus for no
      // reason and is a rule the bake would sometimes forget.
      return startsSentence(text, offset) ? capitalise(resolved) : resolved;
    },
  );
}

/** Pick the requested grammatical form, defaulting to first mention. */
function selectForm(value: BindValue, form: string | undefined): string {
  if (typeof value === "string") return value;
  return form === "the" ? value.the : value.a;
}

/** True when this offset begins a sentence (start of text, or after . ! ? or a newline). */
function startsSentence(text: string, offset: number): boolean {
  for (let i = offset - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch === " " || ch === "\t") continue;
    if (ch === "\n") return true;
    return ch === "." || ch === "!" || ch === "?" || ch === '"' || ch === "\u2014";
  }
  return true;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * The H1.
 *
 * Deliberately a template rather than a baked slot. Titles are their own small
 * problem — they want the hero's name, the tale's identity, and no awkward
 * article — and solving it properly means a `title` slot in the plan with its
 * own variants. That is listed as follow-up work rather than half-built here.
 * The shape matches `lib/mock.ts`, which has been producing titles this way
 * since the app shipped.
 */
function titleFor(taleTitle: string, heroName: string): string {
  const short = taleTitle.replace(/^The\s+/i, "");
  return `${heroName.trim()} and the Sleepy ${short}`;
}

/** The universal placeholder names, re-exported for the audit's unknown-slot check. */
export const KNOWN_UNIVERSAL_SLOTS: readonly string[] = UNIVERSAL_SLOTS;
