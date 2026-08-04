/**
 * The Aarne–Thompson–Uther (ATU) index — the app's browsable tale-type catalogue.
 *
 * This is a curated, *bedtime-safe* slice of the real ATU index. The full index
 * contains a great deal of adult and frightening material (murder, horror, bawdy
 * anecdotes); none of that appears here. Every entry is a gentle, child-friendly
 * tale type that the storyteller can turn into an original wind-down bedtime story.
 *
 * Numbers and canonical titles follow the ATU index (cross-checked against CC0
 * Wikidata property P2540 and the open `trilogy` dataset). The one-line `blurb`s
 * are our own gentle descriptions — never the academic/Uther summaries verbatim.
 *
 * The twelve "featured" types (rich beats, signature elements, tone) live in
 * `lib/tale-types.ts`; they are folded in here so the catalogue and the generator
 * share one id space. Adding a new browsable type is as simple as appending one
 * object to EXTRA_TYPES below.
 */

import { TALE_TYPES } from "./tale-types";
import { ATU_CANONICAL_TITLES, type AtuCanonicalTitle } from "./atu-canonical";
import { ATU_EXTENDED } from "./atu-extended";

/** The seven top-level divisions of the ATU index, in order. */
export const ATU_CATEGORIES = [
  "Animal Tales",
  "Tales of Magic",
  "Religious Tales",
  "Realistic Tales",
  "Tales of the Stupid Ogre",
  "Anecdotes and Jokes",
  "Formula Tales",
] as const;

export type AtuCategory = (typeof ATU_CATEGORIES)[number];

export interface AtuIndexEntry {
  /** Stable identifier used in the API request and URLs (matches a featured id when featured). */
  id: string;
  /** The ATU type number, bare of the "ATU " prefix, e.g. "510A". */
  atu: string;
  /** Canonical tale-type title. */
  title: string;
  /** The top-level ATU division this type belongs to. */
  category: AtuCategory;
  /** A single emoji used as the catalogue-card icon. */
  emoji: string;
  /**
   * Our own gentle, bedtime-framed one-line description.
   *
   * Optional, because the generated tier does not have one. Nobody has read
   * those tales closely enough to describe them, and an invented description
   * printed beside a real ATU number reads as authoritative when it is not.
   */
  blurb?: string;
  /** True when a rich, hand-authored TaleType (with beats) backs this entry. */
  featured: boolean;
  /**
   * How this entry got here, which is really a statement about how much it has
   * been vouched for:
   *
   * - `featured`  — hand-authored, with narrative beats driving the prompt.
   * - `curated`   — hand-authored title, blurb and emoji; no beats.
   * - `extended`  — generated from the knowledge base and passed automatically
   *   through the screens in `lib/safety.ts`. Nobody read it.
   */
  tier: "featured" | "curated" | "extended";
  /**
   * The canonical scholarly title, generated from the ATU knowledge base in
   * `kb/`, carrying the source that asserted it. Undefined where the knowledge
   * base has no record for this number yet.
   *
   * Deliberately separate from `title`. The canonical title of ATU 328 is "The
   * Boy Steals the Ogre's Treasure"; the title a child should see is "Jack and
   * the Beanstalk". The knowledge base owns the first and this app owns the
   * second — the same split between a verbatim source label and a safe display
   * label that the knowledge base makes internally.
   */
  canonical?: AtuCanonicalTitle;
}

/**
 * Map an ATU number (which may carry a letter suffix, e.g. "510A") to its
 * top-level category by numeric range.
 */
export function atuCategory(atu: string): AtuCategory {
  const n = parseInt(atu, 10);
  if (n >= 1 && n <= 299) return "Animal Tales";
  if (n >= 300 && n <= 749) return "Tales of Magic";
  if (n >= 750 && n <= 849) return "Religious Tales";
  if (n >= 850 && n <= 999) return "Realistic Tales";
  if (n >= 1000 && n <= 1199) return "Tales of the Stupid Ogre";
  if (n >= 1200 && n <= 1999) return "Anecdotes and Jokes";
  return "Formula Tales"; // 2000–2399
}

/** The raw shape for a non-featured catalogue entry (category is derived). */
type ExtraType = Omit<AtuIndexEntry, "category" | "featured" | "tier">;

/**
 * Curated bedtime-safe tale types beyond the twelve featured ones. Darker famous
 * types (e.g. Snow White·709, Little Red Riding Hood·333, The Juniper Tree·720)
 * are deliberately omitted per the app's no-peril promise.
 */
const EXTRA_TYPES: readonly ExtraType[] = [
  // --- Animal Tales (1–299) ---
  { id: "how-the-bear-lost-his-tail", atu: "2", title: "How the Bear Lost His Tail", emoji: "🐻", blurb: "A sly fox, a frozen pond, and how the bear came by his short little tail." },
  { id: "the-fox-and-the-crow", atu: "57", title: "The Fox and the Crow", emoji: "🧀", blurb: "A crow with a tasty morsel and a fox whose flattery hides a gentle lesson." },
  { id: "the-fox-and-the-grapes", atu: "59", title: "The Fox and the Grapes", emoji: "🍇", blurb: "The fox decides the grapes he cannot reach must have been sour anyway." },
  { id: "the-fox-and-the-crane", atu: "60", title: "The Fox and the Crane", emoji: "🍽️", blurb: "Two friends learn to set a table that suits a long beak as well as a snout." },
  { id: "more-timid-than-the-hare", atu: "70", title: "More Timid Than the Hare", emoji: "🐇", blurb: "A worried little hare meets someone even more easily startled, and cheers right up." },
  { id: "the-wolf-and-the-crane", atu: "76", title: "The Wolf and the Crane", emoji: "🕊️", blurb: "A kind crane helps a wolf in trouble and learns the worth of a thank-you." },
  { id: "the-vain-little-stag", atu: "77", title: "The Vain Little Stag", emoji: "🦌", blurb: "A stag who scorns his plain legs learns which parts of him matter most." },
  { id: "the-mouse-the-bird-and-the-sausage", atu: "85", title: "The Mouse, the Bird, and the Sausage", emoji: "🐭", blurb: "Three friends keep house together and find that everyone's own task suits them best." },
  { id: "the-cat-and-the-fox", atu: "105", title: "The Cat and the Fox", emoji: "🐱", blurb: "The fox knows a hundred clever tricks; the cat knows just one — the one that counts." },
  { id: "belling-the-cat", atu: "110", title: "Belling the Cat", emoji: "🔔", blurb: "The mice hatch a clever plan to bell the cat — if only someone dares to try." },
  { id: "town-mouse-and-country-mouse", atu: "112", title: "Town Mouse and Country Mouse", emoji: "🏙️", blurb: "A city mouse and a country mouse trade visits and learn what home really means." },
  { id: "the-three-little-pigs", atu: "124", title: "The Three Little Pigs", emoji: "🐷", blurb: "Three little pigs, three little houses, and a huffing, puffing wolf who meets his match." },
  { id: "how-dogs-and-cats-became-rivals", atu: "200", title: "How Dogs and Cats Became Rivals", emoji: "🐕", blurb: "A long-ago tale of one lost little certificate — and why cats and dogs still squabble." },
  { id: "the-election-of-the-bird-king", atu: "221", title: "The Election of the Bird-King", emoji: "🐦", blurb: "All the birds gather to crown a king, and the very smallest wins by cleverness." },
  { id: "the-geese-and-the-last-prayer", atu: "227", title: "The Geese and the Last Prayer", emoji: "🪿", blurb: "Some quick-thinking geese ask for one last prayer, and their honking saves the day." },
  { id: "the-fox-and-the-crayfish", atu: "275", title: "The Fox and the Crayfish", emoji: "🦀", blurb: "A tiny crayfish out-races a boastful fox by holding fast to his tail." },
  { id: "the-wind-and-the-sun", atu: "298", title: "The Wind and the Sun", emoji: "☀️", blurb: "The wind and the sun see who can coax a traveler's coat off — and gentleness wins." },

  // --- Tales of Magic (300–749) ---
  { id: "the-twelve-dancing-princesses", atu: "306", title: "The Twelve Dancing Princesses", emoji: "👠", blurb: "Twelve sisters slip away to dance each night, and one clever soul uncovers their secret." },
  { id: "rapunzel", atu: "310", title: "Rapunzel", emoji: "🌷", blurb: "A girl in a high tower, a ladder of golden hair, and a song that carries far and wide." },
  { id: "the-magic-flight", atu: "313", title: "The Magic Flight", emoji: "🪄", blurb: "Two friends flee with magic objects that spring into forests, mountains, and seas behind them." },
  { id: "jack-and-the-beanstalk", atu: "328", title: "Jack and the Beanstalk", emoji: "🌱", blurb: "A handful of magic beans, a vine into the clouds, and wonders in a castle up above." },
  { id: "the-animal-bride", atu: "402", title: "The Animal Bride", emoji: "🐭", blurb: "The youngest brother's helper, a little mouse, turns out to be the loveliest bride of all." },
  { id: "east-of-the-sun-west-of-the-moon", atu: "425A", title: "East of the Sun and West of the Moon", emoji: "🌗", blurb: "A brave girl journeys past the very ends of the earth to find someone she loves." },
  { id: "rumpelstiltskin", atu: "500", title: "Rumpelstiltskin", emoji: "🧵", blurb: "Straw spun into gold, and a queen who must guess a strange little man's stranger name." },
  { id: "the-three-spinners", atu: "501", title: "The Three Spinners", emoji: "🧶", blurb: "Three odd little helpers spin an impossible mountain of flax, with a kind twist at the end." },
  { id: "one-eye-two-eyes-three-eyes", atu: "511", title: "One-Eye, Two-Eyes, and Three-Eyes", emoji: "🌳", blurb: "A gentle sister, a magical little goat, and a tree that grows apples of silver and gold." },
  { id: "the-extraordinary-companions", atu: "513", title: "The Extraordinary Companions", emoji: "💪", blurb: "A band of friends with wondrous talents set out and win the day together." },
  { id: "the-golden-bird", atu: "550", title: "The Golden Bird", emoji: "🪶", blurb: "A quest for a bird of pure gold, guided by a clever and faithful fox." },
  { id: "the-water-of-life", atu: "551", title: "The Water of Life", emoji: "💧", blurb: "Three brothers seek a healing water for their father; the kindest one finds the way." },
  { id: "the-fisherman-and-his-wife", atu: "555", title: "The Fisherman and His Wife", emoji: "🐟", blurb: "A magic fish grants wish after wish, until a gentle lesson about 'enough' comes home." },
  { id: "the-magic-ring", atu: "560", title: "The Magic Ring", emoji: "💍", blurb: "A grateful cat and dog set out to win back their master's wonderful wishing ring." },
  { id: "aladdin", atu: "561", title: "Aladdin", emoji: "🪔", blurb: "A boy, a wonderful old lamp, and a genie who grants what the heart most wishes." },
  { id: "the-wishing-table", atu: "563", title: "The Wishing-Table", emoji: "🍽️", blurb: "Three magic gifts: a table that feeds, a friend that gives, and a stick that sets things right." },
  { id: "the-magic-porridge-pot", atu: "565", title: "The Magic Porridge Pot", emoji: "🍲", blurb: "A little pot cooks sweet porridge all on its own — until no one remembers how to stop it." },
  { id: "the-rabbit-herd", atu: "570", title: "The Rabbit Herd", emoji: "🐰", blurb: "A magic pipe, a hundred rabbits to gather, and a kind young shepherd's clever day." },
  { id: "the-golden-goose", atu: "571", title: "The Golden Goose", emoji: "🪿", blurb: "A golden goose everyone sticks fast to, and the very first laugh of a solemn princess." },
  { id: "spindle-shuttle-and-needle", atu: "585", title: "Spindle, Shuttle, and Needle", emoji: "🪡", blurb: "Three humble little tools help a kind, poor girl find her happiness." },
  { id: "the-princess-and-the-pea", atu: "704", title: "The Princess and the Pea", emoji: "🫛", blurb: "A stack of soft mattresses and one tiny pea that reveals a true princess." },

  // --- Realistic Tales (850–999) ---
  { id: "the-clever-peasant-girl", atu: "875", title: "The Clever Peasant Girl", emoji: "🧠", blurb: "A farmer's daughter answers the king's riddles so cleverly she wins his heart." },
  { id: "king-thrushbeard", atu: "900", title: "King Thrushbeard", emoji: "🎻", blurb: "A proud princess learns kindness and warmth, and finds love where she least expects it." },
  { id: "loving-like-salt", atu: "923", title: "Loving Like Salt", emoji: "🧂", blurb: "A daughter says she loves her father like salt — and later he learns how dear that is." },

  // --- Anecdotes and Jokes (1200–1999) ---
  { id: "lucky-hans", atu: "1415", title: "Lucky Hans", emoji: "🍀", blurb: "Hans happily trades his way from a lump of gold all the way down to nothing at all." },
  { id: "castles-in-the-air", atu: "1430", title: "Castles in the Air", emoji: "🏰", blurb: "Two daydreamers plan a grand fortune out loud — and dream just a little too big." },
  { id: "stone-soup", atu: "1548", title: "Stone Soup", emoji: "🥣", blurb: "A clever traveler makes 'soup from a stone' and teaches a whole village to share." },

  // --- Formula Tales (2000–2399) ---
  { id: "the-goat-who-wouldnt-go-home", atu: "2015", title: "The Goat Who Wouldn't Go Home", emoji: "🐐", blurb: "One by one, everyone tries to coax a stubborn little goat back home." },
  { id: "the-old-woman-and-her-pig", atu: "2030", title: "The Old Woman and Her Pig", emoji: "🐖", blurb: "An old woman needs a whole chain of helpers just to get her little pig over the stile." },
  { id: "stronger-and-strongest", atu: "2031", title: "Stronger and Strongest", emoji: "🧱", blurb: "A search for the strongest thing in all the world leads right back home again." },
  { id: "the-house-that-jack-built", atu: "2035", title: "The House That Jack Built", emoji: "🏠", blurb: "The rhyme that stacks up and up: this is the house that Jack built." },
  { id: "the-enormous-turnip", atu: "2044", title: "The Enormous Turnip", emoji: "🥬", blurb: "One giant turnip and everyone — down to the tiniest mouse — pulling together." },
  { id: "the-endless-tale", atu: "2300", title: "The Endless Tale", emoji: "♾️", blurb: "A story with no ending at all, as sheep hop over a wall one… by… one…" },
];

/**
 * Card blurbs for the fifty types that were catalogue-only before they had
 * beats. They keep their hand-written blurb rather than falling back to the
 * `tagline` from the registry: the blurb was written to sell the tale to a
 * parent scanning a grid, and the tagline was written to orient a storyteller.
 * Both are good; they are just aimed at different readers.
 */
const CURATED_BLURBS: Readonly<Record<string, string>> = Object.fromEntries(
  EXTRA_TYPES.map((e) => [e.id, e.blurb!]),
);

/** Featured entries, derived from the rich TaleType registry. */
const FEATURED_ENTRIES: readonly AtuIndexEntry[] = TALE_TYPES.map((t) => {
  const atu = t.atuNumber.replace(/^ATU\s+/i, "");
  return {
    id: t.id,
    atu,
    title: t.label,
    category: t.category as AtuCategory,
    emoji: t.emoji,
    blurb: CURATED_BLURBS[t.id] ?? t.tagline,
    featured: true,
    tier: "featured" as const,
    canonical: ATU_CANONICAL_TITLES[atu],
  };
});

/**
 * Entries still without beats.
 *
 * Anything in `EXTRA_TYPES` that has since acquired a `TaleType` record is
 * dropped here — it is already in `FEATURED_ENTRIES`, and listing it twice
 * would put a duplicate id in the catalogue. As of the curated beats pass this
 * filter removes all fifty, so `EXTRA_ENTRIES` is currently empty; the array
 * stays because the next hand-written catalogue-only type will land in it.
 */
const FEATURED_IDS = new Set(TALE_TYPES.map((t) => t.id));

const EXTRA_ENTRIES: readonly AtuIndexEntry[] = EXTRA_TYPES.filter(
  (e) => !FEATURED_IDS.has(e.id),
).map((e) => ({
  ...e,
  category: atuCategory(e.atu),
  featured: false,
  tier: "curated" as const,
  canonical: ATU_CANONICAL_TITLES[e.atu],
}));

/**
 * The generated tier, from `lib/atu-extended.ts`. Category is derived from the
 * ATU number by the same range rule the curated tier uses, so all three tiers
 * agree about which division a number belongs to.
 */
const EXTENDED_ENTRIES: readonly AtuIndexEntry[] = ATU_EXTENDED.map((e) => ({
  id: e.id,
  atu: e.atu,
  title: e.title,
  category: atuCategory(e.atu),
  emoji: e.emoji,
  blurb: e.blurb,
  featured: false,
  tier: "extended" as const,
  canonical: ATU_CANONICAL_TITLES[e.atu],
}));

/**
 * The full bedtime-safe ATU catalogue, most vouched-for first: the featured
 * types, then the curated ones, then the generated tier.
 */
export const ATU_INDEX: readonly AtuIndexEntry[] = [
  ...FEATURED_ENTRIES,
  ...EXTRA_ENTRIES,
  ...EXTENDED_ENTRIES,
];

/** All valid tale-type ids the generator will accept. */
export const ATU_TYPE_IDS: readonly string[] = ATU_INDEX.map((e) => e.id);

/** Look up a catalogue entry by id, or return undefined if unknown. */
export function getAtuEntry(id: string): AtuIndexEntry | undefined {
  return ATU_INDEX.find((e) => e.id === id);
}

/** The categories actually present in the catalogue, in canonical order. */
export const PRESENT_CATEGORIES: readonly AtuCategory[] = ATU_CATEGORIES.filter(
  (c) => ATU_INDEX.some((e) => e.category === c),
);

/** Filter the catalogue by free-text query, category, and featured flag. */
export function searchAtu(opts: {
  query?: string;
  category?: AtuCategory | "All";
  featuredOnly?: boolean;
} = {}): AtuIndexEntry[] {
  const q = opts.query?.trim().toLowerCase() ?? "";
  return ATU_INDEX.filter((e) => {
    if (opts.featuredOnly && !e.featured) return false;
    if (opts.category && opts.category !== "All" && e.category !== opts.category) {
      return false;
    }
    if (!q) return true;
    return (
      e.title.toLowerCase().includes(q) ||
      e.atu.toLowerCase().includes(q) ||
      `atu ${e.atu}`.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.blurb?.toLowerCase().includes(q) ?? false)
    );
  });
}
