/**
 * The tale-type registry — the heart of the generator.
 *
 * Each entry fully drives both the UI (picker card) and prompt assembly.
 * Adding a new bedtime tale type is as simple as appending one object here;
 * nothing else needs to change.
 */

export type AgeBand = "3-5" | "6-8" | "9-12";
export type TaleLength = "short" | "medium" | "long";

export interface TaleType {
  /** Stable identifier used in the API request and URLs. */
  id: string;
  /** Human-facing name shown on the picker card. */
  label: string;
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
}

export const TALE_TYPES: readonly TaleType[] = [
  {
    id: "fairy-tale",
    label: "Fairy Tale",
    emoji: "🏰",
    tagline: "Gentle magic and a happy-ever-after.",
    beats: [
      "Open in an ordinary, cosy world",
      "A small touch of gentle enchantment appears",
      "A kind helper offers a gift or bit of advice",
      "The hero faces one soft, winnable trial",
      "Everything is set right and warmth is restored",
    ],
    signatureElements: [
      "a 'once upon a time' cadence",
      "a friendly magical helper",
      "a small enchanted object",
      "a kind resolution rather than a defeated villain",
    ],
    tone: "warm, wondrous, and reassuring",
    exampleOpener:
      "Once upon a time, in a cottage where the chimney breathed lazy smoke, there lived a child who loved the quiet of evening.",
  },
  {
    id: "fable",
    label: "Fable",
    emoji: "🦊",
    tagline: "Talking animals and one kind little lesson.",
    beats: [
      "Introduce one or two animal characters with clear feelings",
      "A gentle situation invites a small choice",
      "The choice plays out with soft, natural consequences",
      "The animals learn something kind together",
      "Close by naming the gentle moral in one soft line",
    ],
    signatureElements: [
      "animals who speak and feel",
      "a single, kind moral",
      "no punishment — only understanding",
      "a meadow, riverbank, or burrow setting",
    ],
    tone: "wise, tender, and unhurried",
    exampleOpener:
      "In the tall grass by the slow river, a young rabbit and a patient tortoise watched the fireflies wake.",
  },
  {
    id: "adventure-quest",
    label: "Adventure Quest",
    emoji: "🗺️",
    tagline: "A map, three stops, and a treasure worth finding.",
    beats: [
      "The hero finds a hand-drawn map",
      "They visit the first landmark and make a friend",
      "The second landmark asks for a small act of courage",
      "The third landmark reveals the treasure",
      "The treasure turns out to be friendship, home, or belonging",
    ],
    signatureElements: [
      "a treasure map with three marked stops",
      "a loyal companion picked up along the way",
      "gentle wonder instead of danger",
      "a treasure that is really about love or home",
    ],
    tone: "brave, curious, and softly triumphant",
    exampleOpener:
      "The map had three little stars inked upon it, and the last one glowed faintly, as if it had been waiting.",
  },
  {
    id: "lullaby-rhyme",
    label: "Lullaby Rhyme",
    emoji: "🎵",
    tagline: "A drowsy poem that rhymes you to sleep.",
    beats: [
      "Set a soft nighttime scene in the opening couplet",
      "Introduce the sleepy hero and a gentle wish",
      "Drift through two or three calm, rhyming images",
      "Let each verse grow quieter and slower",
      "End on a whispered goodnight couplet",
    ],
    signatureElements: [
      "AABB rhyming couplets",
      "a soothing, repeating refrain",
      "imagery of moon, stars, and soft blankets",
      "a rhythm that slows toward sleep",
    ],
    tone: "musical, hushed, and dreamy",
    exampleOpener:
      "The moon hangs low on a silver thread, / and sleepy stars are off to bed.",
  },
  {
    id: "silly-tale",
    label: "Silly Tale",
    emoji: "🤪",
    tagline: "Giggles that settle softly into calm.",
    beats: [
      "Introduce a delightfully absurd situation",
      "Establish one running gag that repeats and grows",
      "Let the silliness build to a gentle, giggly peak",
      "The nonsense begins to wind down and soften",
      "End cosy and calm, the giggles fading into a yawn",
    ],
    signatureElements: [
      "playful, harmless absurdity",
      "one running gag that repeats",
      "wordplay and funny sounds",
      "laughter that settles into sleepiness",
    ],
    tone: "goofy and giggly, mellowing into calm",
    exampleOpener:
      "It is a well-known fact that penguins cannot juggle — which is exactly why this one was trying so very hard.",
  },
  {
    id: "cozy-mystery",
    label: "Cozy Mystery",
    emoji: "🔍",
    tagline: "A missing thing, gentle clues, a warm reveal.",
    beats: [
      "Something small and beloved goes missing",
      "The hero notices a first gentle clue",
      "A second clue leads somewhere unexpected but safe",
      "The missing thing is found in a heart-warming place",
      "Everyone settles down, mystery happily solved",
    ],
    signatureElements: [
      "a lost object rather than any danger",
      "soft, followable clues",
      "no villains — only misunderstandings",
      "a warm, satisfying reveal",
    ],
    tone: "curious, gentle, and comforting",
    exampleOpener:
      "The little blue teacup was not on its shelf, and that was very strange indeed, for teacups rarely wander.",
  },
  {
    id: "starry-sci-fi",
    label: "Starry Sci-Fi",
    emoji: "🚀",
    tagline: "Soft space wonder, home by starlight.",
    beats: [
      "The hero drifts gently up among the stars",
      "They meet a friendly robot, alien, or star",
      "Together they explore one wondrous, peaceful place",
      "A soft moment of awe at the quiet cosmos",
      "The hero floats safely back to their own warm bed",
    ],
    signatureElements: [
      "a kind robot, alien, or talking star",
      "peaceful, glowing space imagery",
      "wonder instead of peril",
      "a gentle return to the bunk bed by starlight",
    ],
    tone: "dreamy, wondrous, and serene",
    exampleOpener:
      "The spaceship was really just a cardboard box, but tonight, somehow, it lifted off without a sound.",
  },
  {
    id: "origin-myth",
    label: 'Origin Myth ("Why…")',
    emoji: "🌙",
    tagline: "A pourquoi tale — why the world is the way it is.",
    beats: [
      "Pose the gentle question ('why do fireflies glow?')",
      "Long ago, the world was a little different",
      "A kind creature makes a small, generous choice",
      "That choice changes the world in a lasting, lovely way",
      "Return to now, the wonder still visible each night",
    ],
    signatureElements: [
      "a 'why' question about nature answered by story",
      "a long-ago, faraway beginning",
      "a small act of kindness with lasting effect",
      "a tie back to something children can see tonight",
    ],
    tone: "mythic, gentle, and full of wonder",
    exampleOpener:
      "Long, long ago, the fireflies had no light at all, and the summer nights were darker for it.",
  },
] as const;

/** All valid tale-type ids, useful for validation. */
export const TALE_TYPE_IDS: readonly string[] = TALE_TYPES.map((t) => t.id);

/** Look up a tale type by id, or return undefined if unknown. */
export function getTaleType(id: string): TaleType | undefined {
  return TALE_TYPES.find((t) => t.id === id);
}
