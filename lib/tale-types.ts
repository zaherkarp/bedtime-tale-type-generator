import { CURATED_TALE_TYPES } from "./tale-types-curated.ts";
import { EXTENDED_TALE_TYPES } from "./tale-types-extended-authored.ts";

/**
 * The tale-type registry — the heart of the generator.
 *
 * Each entry is a real folkloric *tale type* from the Aarne–Thompson–Uther (ATU)
 * Index, softened for a gentle bedtime telling. An entry fully drives both the UI
 * (picker card) and prompt assembly, so adding a new tale type is as simple as
 * appending one object here; nothing else needs to change.
 */

export type AgeBand = "3-5" | "6-8" | "9-12";
export type TaleLength = "short" | "medium" | "long";

export interface TaleType {
  /** Stable identifier used in the API request and URLs. */
  id: string;
  /** Human-facing name shown on the picker card. */
  label: string;
  /** The Aarne–Thompson–Uther type designation, e.g. "ATU 510A". */
  atuNumber: string;
  /** The ATU top-level category this type belongs to, e.g. "Tales of Magic". */
  category: string;
  /** A single emoji used as the card's icon. */
  emoji: string;
  /** One-line description shown under the label. */
  tagline: string;
  /** The narrative skeleton the storyteller should follow, in order. */
  beats: string[];
  /** Recurring motifs that give this type its flavour. */
  signatureElements: string[];
  /** A short description of the voice and mood. */
  tone: string;
  /** An illustrative opening line (guides style, never copied verbatim). */
  exampleOpener: string;
  /**
   * What the beats above were written from.
   *
   * Optional because the twelve originals and the fifty curated predate the
   * field; absent means the same thing `"knowledge"` does, and the file each
   * entry lives in records which. New entries should set it explicitly.
   *
   * - `{ kind: "edition", ... }` — a public-domain text was read while writing
   *   these beats, and is named so the claim can be checked.
   * - `{ kind: "knowledge" }` — written from general knowledge of the pattern
   *   the tale type names, with no text consulted.
   *
   * This exists because the two are genuinely different and the difference was
   * previously averaged away in a file-level caveat. Only about a fifth of the
   * generated tier has an English public-domain text that can be located and
   * matched to its ATU number at all: the index's long tail is regional oral
   * material that was never translated, and the concordance that would map the
   * rest is Uther 2004, which this repository deliberately does not use.
   *
   * A consumer that wants to show only what has been checked can filter on it.
   */
  source?: TaleTypeSource;
}

/** Where a tale type's beats came from. See `TaleType.source`. */
export type TaleTypeSource =
  | {
      kind: "edition";
      /** The collection, as it titles itself. */
      work: string;
      /** The tale's title in that edition, which often differs from the ATU title. */
      taleTitle: string;
      /** Project Gutenberg ebook number, so the exact text is retrievable. */
      gutenbergId: number;
    }
  | { kind: "knowledge" };

/**
 * The twelve types this app shipped with, hand-authored from scratch.
 *
 * Exported so tests can assert them by name: they are the reference
 * implementation of the shape, and the fifty added later were written to match
 * them rather than the other way round.
 */
export const ORIGINAL_TALE_TYPES: readonly TaleType[] = [
  {
    id: "cinderella",
    label: "Cinderella",
    atuNumber: "ATU 510A",
    category: "Tales of Magic",
    emoji: "🩰",
    tagline: "A kind heart, a magical helper, a token found.",
    beats: [
      "A kind-hearted child does the quiet, cindery chores, holding a small hopeful dream",
      "A gentle magical helper appears and offers a shimmering gift",
      "Dressed in wonder, the hero goes to a warm, twinkling gathering",
      "As the hour grows late they slip away, leaving one small token behind",
      "The token leads a friend gently back, kindness is recognised, and the hero is welcomed home to warmth and rest",
    ],
    signatureElements: [
      "a humble hero with a generous heart",
      "a magical helper and a shimmering gift",
      "a joyful gathering full of soft light",
      "a small token that leads to a warm recognition",
    ],
    tone: "tender, hopeful, and quietly magical",
    exampleOpener:
      "Among the cinders and the quiet, a gentle child hummed to the little sparks, for even ashes can hold a dream.",
  },
  {
    id: "kind-and-unkind-girls",
    label: "The Kind and the Unkind Girls",
    atuNumber: "ATU 480",
    category: "Tales of Magic",
    emoji: "🌸",
    tagline: "Small kindnesses along a road, quietly repaid.",
    beats: [
      "A kind child sets out and meets little ones in need along the way",
      "They pause to help each — the over-full tree, the lonely oven, the thirsty stream",
      "Each helped creature offers a small, glowing thank-you",
      "The kindness gathers and returns as an unexpected, gentle gift",
      "The child carries the warmth home and settles softly down to sleep",
    ],
    signatureElements: [
      "a journey full of helpful pauses",
      "creatures and objects that ask for small kindnesses",
      "gifts that quietly reward a gentle heart",
      "kindness given freely and returned",
    ],
    tone: "gentle, generous, and warm",
    exampleOpener:
      "The path wound on, and everything along it seemed to need a small kind hand — so the child gave one, and another, and another.",
  },
  {
    id: "beauty-and-the-beast",
    label: "Beauty and the Beast",
    atuNumber: "ATU 425C",
    category: "Tales of Magic",
    emoji: "🌹",
    tagline: "Kindness that sees past a strange outside.",
    beats: [
      "A kind visitor comes to stay in a grand, quiet house with a shy, curious creature",
      "At first the creature seems strange, but the visitor offers gentle friendship",
      "Day by day, small kindnesses melt an old loneliness away",
      "A caring wish quietly undoes a long-held enchantment",
      "The creature, gentle all along, is freed, and both settle down, cosy and calm",
    ],
    signatureElements: [
      "a misunderstood, gentle creature",
      "kindness that looks past appearances",
      "an enchantment undone by care",
      "friendship in a hushed, candlelit house",
    ],
    tone: "tender, kind, and reassuring",
    exampleOpener:
      "The great house was full of hush and candlelight, and its shy owner had waited a long, lonely while for a friend.",
  },
  {
    id: "sleeping-beauty",
    label: "Sleeping Beauty",
    atuNumber: "ATU 410",
    category: "Tales of Magic",
    emoji: "😴",
    tagline: "A whole kingdom drifting gently off to sleep.",
    beats: [
      "At a joyful welcoming, kind gifts are wished upon a new little one",
      "A gentle spell promises a long, soft sleep when the time is right",
      "One drowsy evening the whole realm begins, sweetly, to yawn",
      "One by one they settle — the guards, the cats, the flickering lamps — into cosy stillness",
      "The castle sleeps beneath a blanket of roses, dreaming warm dreams until morning",
    ],
    signatureElements: [
      "a christening full of kind wishes",
      "a gentle spell of sleep, never harm",
      "an entire kingdom drifting off together",
      "roses growing softly around a dreaming castle",
    ],
    tone: "hushed, dreamy, and deeply calm",
    exampleOpener:
      "It began, as the gentlest tales do, with a wish whispered over a cradle.",
  },
  {
    id: "the-frog-king",
    label: "The Frog King",
    atuNumber: "ATU 440",
    category: "Tales of Magic",
    emoji: "🐸",
    tagline: "A promise kept, and a friend set free.",
    beats: [
      "A treasured golden ball rolls away and splashes into a deep, still well",
      "A friendly little frog offers to fetch it — if only they can be friends",
      "The ball comes back, and though it feels odd, the hero keeps their promise",
      "A small kindness — a warm welcome, a kind goodnight — breaks a hidden spell",
      "The frog, an enchanted friend all along, is freed, and the two settle in to rest",
    ],
    signatureElements: [
      "a golden ball lost in a well",
      "a small, polite, helpful frog",
      "a promise that must be kept",
      "a spell undone by keeping one's word",
    ],
    tone: "gentle, a little funny, and warm",
    exampleOpener:
      "The golden ball went plip into the well, and from the dark water rose the politest little voice.",
  },
  {
    id: "the-dragon-slayer",
    label: "The Dragon-Slayer",
    atuNumber: "ATU 300",
    category: "Tales of Magic",
    emoji: "🐉",
    tagline: "A brave hero, loyal animals, a worried dragon soothed.",
    beats: [
      "A brave, gentle hero sets off with a band of loyal animal friends",
      "They come upon a great dragon, huffing and rumbling with worry",
      "Instead of a fight, the hero offers calm — a soft word, a cool drink, a listening ear",
      "The dragon's trouble is soothed, and it curls up, grateful and sleepy",
      "The hero heads home beneath the stars, loyal friends padding softly alongside",
    ],
    signatureElements: [
      "a gentle hero and loyal animal helpers",
      "a great dragon that is worried, not wicked",
      "courage shown as kindness rather than fighting",
      "a token of thanks and a calm journey home",
    ],
    tone: "brave, kind, and softly triumphant",
    exampleOpener:
      "Everyone said the mountain held a fearsome dragon, but the hero packed a flask of cool water, just in case it was only thirsty.",
  },
  {
    id: "puss-in-boots",
    label: "Puss in Boots",
    atuNumber: "ATU 545B",
    category: "Tales of Magic",
    emoji: "🐈",
    tagline: "A clever cat who winks fortune into being.",
    beats: [
      "A kind but penniless young person inherits only a clever, talking cat",
      "The cat pulls on tiny boots and sets off to help, with a wink and a plan",
      "With gentle cleverness, the cat wins friends and a fine reputation for its master",
      "A grand, empty castle is cleverly and kindly won, its old owner ambling happily off",
      "Master and cat settle by the fire at last, cosy, laughing softly, and safe",
    ],
    signatureElements: [
      "a clever, talking cat in little boots",
      "gentle cleverness instead of force",
      "a humble master lifted by a loyal friend",
      "a fine castle and a warm hearth won",
    ],
    tone: "clever, playful, and warm",
    exampleOpener:
      '"Fetch me a pair of boots," said the cat, quite matter-of-factly, "and leave the rest to me."',
  },
  {
    id: "thumbling",
    label: "Thumbling (Tom Thumb)",
    atuNumber: "ATU 700",
    category: "Tales of Magic",
    emoji: "👣",
    tagline: "A thumb-sized hero and a great big, gentle world.",
    beats: [
      "A beloved, thumb-sized hero sets out to see the great big world",
      "Everything is enormous and full of wonder — a teacup lake, a stair-step mountain",
      "A few tiny mix-ups tumble the small hero somewhere unexpected but safe",
      "Clever and calm, the little one finds the way back toward home",
      "Tucked into a thimble bed, the tiny hero yawns the tiniest of yawns and sleeps",
    ],
    signatureElements: [
      "a hero no bigger than a thumb",
      "an ordinary world made huge and wondrous",
      "small, safe mishaps and clever little escapes",
      "a snug thimble bed at the end",
    ],
    tone: "cosy, wondrous, and gently funny",
    exampleOpener:
      "He was no bigger than a thumb, which is exactly the right size for riding in a coat pocket and seeing everything twice.",
  },
  {
    id: "wolf-and-the-kids",
    label: "The Wolf and the Kids",
    atuNumber: "ATU 123",
    category: "Animal Tales",
    emoji: "🐐",
    tagline: "Clever little ones who see through a sly trick.",
    beats: [
      "A caring mother goat leaves her little ones with one gentle rule: only open for family",
      "A sly wolf comes knocking, trying on softer and softer voices",
      "The clever kids notice the trick each time — a rough paw, a too-deep voice",
      "Outwitted and yawning, the wolf gives up and shuffles off into the dusk",
      "Mother returns to find everyone safe, and tucks her little ones in, warm and proud",
    ],
    signatureElements: [
      "a gentle rule that keeps everyone safe",
      "a wolf who tries (and fails) to disguise itself",
      "clever little ones who notice the details",
      "a safe, cosy reunion at the end",
    ],
    tone: "warm, a little suspenseful, and reassuring",
    exampleOpener:
      '"Open only for me," said Mother Goat, "and you\'ll always know it\'s me, for I will sing you our little song."',
  },
  {
    id: "bremen-town-musicians",
    label: "The Bremen Town Musicians",
    atuNumber: "ATU 130",
    category: "Animal Tales",
    emoji: "🎻",
    tagline: "Four old friends who find a home in a song.",
    beats: [
      "Four older animal friends, feeling unneeded, set off together to make music",
      "The road is long, but their little band grows cosier with every mile",
      "At dusk they find a warm cottage glowing in the woods",
      "With one big, silly, joyful song they surprise the grumbly folk inside, who scurry off giggling",
      "The friends share supper and settle by the fire, their music softening into snores",
    ],
    signatureElements: [
      "older animals finding new purpose together",
      "friendship gathered along the road",
      "a cosy cottage discovered in the woods",
      "a joyful song that becomes a lullaby",
    ],
    tone: "warm, companionable, and merry-then-sleepy",
    exampleOpener:
      "The donkey could no longer carry heavy sacks, but he could still carry a tune, and so he set off to be a musician.",
  },
  {
    id: "the-gingerbread-man",
    label: "The Gingerbread Man",
    atuNumber: "ATU 2025",
    category: "Formula Tales",
    emoji: "🍪",
    tagline: "A runaway treat and a merry, growing chase.",
    beats: [
      "Out of the oven pops a warm little runaway, quick as a wink",
      '"Run, run!" it laughs, and off it goes with a merry little rhyme',
      "One by one, friends join the happy chase — the cat, the cow, the sleepy dog",
      "The refrain repeats and slows as the whole parade grows tired and giggly",
      "At last everyone tumbles home together to share warm milk and drift off",
    ],
    signatureElements: [
      "a freshly baked little runaway",
      "a repeating, sing-song refrain",
      "a growing parade of gentle chasers",
      "a cosy, sharing ending — no gobbling",
    ],
    tone: "bouncy and playful, mellowing into calm",
    exampleOpener:
      '"Run, run, as fast as you can!" giggled the little gingerbread runaway, and the whole kitchen laughed.',
  },
  {
    id: "chicken-little",
    label: "Chicken Little",
    atuNumber: "ATU 2033",
    category: "Formula Tales",
    emoji: "🐤",
    tagline: "A tiny worry that grows, then gently melts away.",
    beats: [
      "A little chick feels a plink on the head and worries the sky is falling",
      "Off it hurries to tell a friend, who worries too and comes along",
      "The worried, waddling parade grows longer with each new friend",
      "A calm, wise old friend shows them it was only an acorn — just a tumbling seed",
      "Relieved and giggling, the whole flock settles down together for the night",
    ],
    signatureElements: [
      "a small worry that grows in the telling",
      "a cumulative parade of worried friends",
      "rhyming, repeating names and a refrain",
      "a calm, reassuring explanation at the end",
    ],
    tone: "gently silly, then soothing and safe",
    exampleOpener:
      'Plink! Something small bonked the little chick right on the head. "The sky!" she gasped. "The sky is falling!"',
  },
] as const;

/**
 * The full featured registry, in order of how long each tier has existed: the
 * twelve originals, then the fifty that were catalogue-only until beats were
 * written for them, then the entries promoted out of the generated tier.
 *
 * All three tiers are the same shape and are treated identically everywhere
 * downstream. The split into three files is about provenance and reviewability
 * — each file's header records how its entries were written and what was
 * softened — not about any behavioural difference between them.
 *
 * The imports sit at the bottom rather than the top because both of those
 * files import the `TaleType` type from this one. They are type-only imports
 * and therefore erased at build time, but keeping the value imports down here
 * makes the one-directional shape obvious to a reader.
 */
export const TALE_TYPES: readonly TaleType[] = [
  ...ORIGINAL_TALE_TYPES,
  ...CURATED_TALE_TYPES,
  ...EXTENDED_TALE_TYPES,
];

/** All valid tale-type ids, useful for validation. */
export const TALE_TYPE_IDS: readonly string[] = TALE_TYPES.map((t) => t.id);

/** Look up a tale type by id, or return undefined if unknown. */
export function getTaleType(id: string): TaleType | undefined {
  return TALE_TYPES.find((t) => t.id === id);
}
