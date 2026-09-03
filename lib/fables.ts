/**
 * Curated fables and wisdom tales — the app's second story family.
 *
 * ## Why this is not an ATU tale type
 *
 * The ATU catalogue in `lib/atu-index.ts` is an *index of patterns*: a number,
 * a canonical title, and (for the featured tier) our own gentle beats. It says
 * nothing about who told the tale, in what collection, or under what licence,
 * because for a folktale pattern there is no single answer.
 *
 * A fable is the opposite. "The Lion and the Mouse" is Perry 150 of the
 * Aesopic corpus; "The Quails and the Net" is Jātaka 33. The tradition, the
 * collection, and the index designation are the interesting facts, and a story
 * family that cannot record them would be throwing away the thing that makes
 * fables worth having. Forcing them into ATU would also lie twice over: it
 * would assign numbers the index does not assign, and it would flatten
 * Panchatantra, Jātaka and Aesopic transmission into one European scheme.
 *
 * So fables get their own small registry: no ATU number, no Thompson motifs,
 * and their child-safety story carried as per-fable metadata rather than the
 * stem screen in `lib/safety.ts` — a curated corpus of a dozen items can be
 * read by a person, and has been.
 *
 * ## What is stored here, and what is not
 *
 * Stored: structured factual metadata (tradition, collection, designation) and
 * **our own summaries** of the traditional causal structure.
 *
 * Not stored, ever: the prose of any telling. Not a public-domain translation,
 * and emphatically not a modern copyrighted retelling. `coreBeats` are a
 * skeleton in our own words; the app generates original prose over them.
 *
 * ## coreBeats vs expansionBeats
 *
 * - `coreBeats` are the causal spine — the sequence that makes the traditional
 *   fable recognisable. Drop one and it stops being that fable. The generated
 *   story must play them once, cleanly, and must not repeat them for length.
 * - `expansionBeats` are the opposite: places where an original bedtime
 *   adaptation is *invited* to grow. A 200-word fable becomes a 1,200-word
 *   bedtime story by building a world around the kernel, never by re-staging
 *   the encounter four times.
 *
 * ## Bundle size
 *
 * Unlike `lib/tale-types.ts` (~55KB of prompt-only prose, deliberately split
 * into a generated client-safe summary file), this module is a few KB for
 * eleven entries, so the picker and the prompt share it. If the corpus grows
 * past roughly fifty fables, split it the same way `tale-types-catalogue.ts`
 * splits the ATU registry — not before.
 */

/**
 * The traditions represented in the corpus, named specifically.
 *
 * "African folktale" is not a tradition, it is a continent; the same is true
 * of "Asian". Each entry here names a people, a language community, or a
 * specific textual tradition, because that is what provenance means.
 */
export const FABLE_TRADITIONS = [
  "Aesopic (Greek–Mediterranean)",
  "Buddhist Jātaka",
  "Panchatantra",
  "Hitopadesha",
  "Kalīla wa Dimna",
  "Akan (Asante)",
  "Chinese (Daoist classics)",
  "Japanese",
  "Korean",
] as const;

export type FableTradition = (typeof FABLE_TRADITIONS)[number];

/**
 * Categories of traditional material that must not reach a sleeping child.
 *
 * These are recorded per fable so the corpus, not the prompt, carries the
 * knowledge. "Make it child-friendly" hands the whole judgement to the model
 * on every request; naming `predation` and then saying exactly what to do
 * about it makes the judgement reviewable in a pull request.
 */
export const ADAPTATION_CONCERNS = [
  "death",
  "injury",
  "predation",
  "threat",
  "abandonment",
  "betrayal",
  "humiliation",
  "punishment",
  "coercion",
  "frightening-transformation",
  "hunger-peril",
] as const;

export type AdaptationConcern = (typeof ADAPTATION_CONCERNS)[number];

/**
 * Where the traditional story comes from.
 *
 * `confidence` is not decoration. Perry index numbers are well attested;
 * the authorship of the Liezi is disputed by people who have spent careers on
 * it; the exact task-sequence of an oral Anansi tale varies between tellings.
 * Recording "high" everywhere would be inventing precision, so anything below
 * `high` must carry a `note` saying what is actually uncertain, and the note
 * is shown to parents in the "Behind the story" panel.
 */
export interface FableSource {
  /** The collection or text this fable is transmitted in. */
  collection?: string;
  /** Compiler, collector, or traditional attribution — stated as such. */
  authorOrCollector?: string;
  /** Year of the cited edition or collection, where there is a meaningful one. */
  year?: number;
  /** True only where the cited edition is unambiguously out of copyright. */
  publicDomain?: boolean;
  /** A stable reference URL, only where we are confident it is the right one. */
  url?: string;
  /** Scholarly designations, e.g. "Perry 150", "Jātaka 33". */
  designations?: readonly string[];
  /** How far the line above can be leaned on. */
  confidence: "high" | "medium" | "low";
  /** Required unless confidence is "high": what exactly is uncertain. */
  note?: string;
}

/**
 * What the bedtime adaptation must do with this fable's difficult material.
 *
 * The four verbs are deliberately different actions, not synonyms:
 * - `preserve` — the reason the fable works. Losing these loses the story.
 * - `soften`  — keep the element, lower its temperature.
 * - `substitute` — swap the element for one that carries the same weight.
 * - `remove` — leave it out entirely; nothing replaces it.
 *
 * `preserve` exists to stop the other three from sterilising the tale. "Safe"
 * must not come to mean "nothing happens": if cleverness beats brute force
 * because a weak character escapes being eaten, the adaptation may remove the
 * eating, but it may not remove the asymmetry, the real problem, the inference,
 * or the escape.
 */
export interface FableAdaptation {
  /**
   * The youngest age band this tale suits, as a number of years. When a parent
   * picks a younger listener the brief says so and asks for the softening list
   * applied in full — the request is never refused, because a parent who knows
   * their child outranks a number in a data file.
   */
  ageFloor?: number;
  concerns: readonly AdaptationConcern[];
  preserve: readonly string[];
  soften?: readonly string[];
  substitute?: readonly string[];
  remove?: readonly string[];
}

export interface Fable {
  /** Stable identifier used in the API request and in URLs. */
  id: string;
  /** Our own English title for the pattern — not any translator's wording. */
  title: string;
  /** A single emoji used as the card icon. */
  emoji: string;
  tradition: FableTradition;
  /** Where the tradition is rooted, in plain words. */
  region?: string;
  source?: FableSource;
  /** The traditional cast, described by role rather than by any given name. */
  characters?: readonly string[];
  /** One parent-facing sentence: what tonight's story is about. */
  setup: string;
  /** The causal skeleton. See the module note on coreBeats vs expansionBeats. */
  coreBeats: readonly string[];
  /** The traditional lesson, as themes rather than a stated moral. */
  themes: readonly string[];
  adaptation: FableAdaptation;
  /** Where this particular tale is allowed to grow into a bedtime length. */
  expansionBeats?: readonly string[];
}

/**
 * The seed corpus.
 *
 * Eleven fables, chosen to exercise different mechanics (reciprocity,
 * persistence, cooperation, presence of mind, greed, misjudgement, humility)
 * across seven traditions, rather than to be a large collection. Quality of
 * modelling is the point: each one has been read, its difficult material named,
 * and its adaptation written so the mechanism survives the softening.
 */
export const FABLES: readonly Fable[] = [
  {
    id: "lion-and-the-mouse",
    title: "The Lion and the Mouse",
    emoji: "🦁",
    tradition: "Aesopic (Greek–Mediterranean)",
    region: "Greece and the wider Mediterranean world",
    source: {
      collection: "The Aesopic corpus",
      authorOrCollector:
        "Traditionally attributed to Aesop; transmitted through later Greek and Latin collections",
      publicDomain: true,
      designations: ["Perry 150"],
      confidence: "high",
      note: "The Perry index number is well attested. 'Aesop' is a traditional attribution rather than an identified author, and no single original text survives — the fable reaches us through many later retellings.",
    },
    characters: ["a lion", "a mouse"],
    setup:
      "A lion lets a mouse go, and much later the mouse turns out to be exactly the help the lion needs.",
    coreBeats: [
      "A very small creature disturbs a very large and powerful one and is caught",
      "The small one asks to be let go and promises that the favour will come back one day; the great one finds the idea funny and releases it anyway",
      "Later the great one is held fast by something its strength is useless against",
      "The small one hears, comes, and frees it by doing the one thing being small is good for",
      "The great one understands that it had misjudged what help looks like",
    ],
    themes: ["kindness returned", "small does not mean useless", "mercy", "gratitude"],
    adaptation: {
      ageFloor: 3,
      concerns: ["predation", "threat"],
      preserve: [
        "the enormous difference in size and strength between the two",
        "the release given freely, before any favour is owed",
        "the great one's freedom genuinely depending on the small one",
        "the quiet reversal: the help arrives from the direction nobody watched",
      ],
      soften: [
        "the lion's first reaction — a great sleepy grumble at being woken, not a threat",
      ],
      substitute: [
        "the hunters' net becomes an old tangle of ropes and creepers nobody set, so nothing is hunting anything",
      ],
      remove: [
        "any suggestion that the lion might eat the mouse",
        "hunters, capture, and any fear of what would happen if the lion stayed caught",
      ],
    },
    expansionBeats: [
      "the mouse's burrow, its family, and the small errands of an ordinary day",
      "the long warm walk across the grassland at dusk to reach the lion's hill",
      "the sounds of the grassland settling for the night while the ropes are gnawed",
      "the slow walk home, and being asked what happened",
    ],
  },
  {
    id: "tortoise-and-the-hare",
    title: "The Tortoise and the Hare",
    emoji: "🐢",
    tradition: "Aesopic (Greek–Mediterranean)",
    region: "Greece and the wider Mediterranean world",
    source: {
      collection: "The Aesopic corpus",
      authorOrCollector:
        "Traditionally attributed to Aesop; transmitted through later Greek and Latin collections",
      publicDomain: true,
      designations: ["Perry 226"],
      confidence: "high",
      note: "The Perry index number is well attested; the attribution to Aesop himself is traditional rather than documented.",
    },
    characters: ["a hare", "a tortoise"],
    setup:
      "The quickest runner in the meadow stops for a nap, and the slowest walker simply keeps going.",
    coreBeats: [
      "A swift creature teases a slow one for how long everything takes it",
      "The slow one proposes a race, and the swift one accepts because the answer seems obvious",
      "The swift one is so far ahead that it lies down to rest",
      "The slow one passes by without stopping, and keeps on going while the other sleeps",
      "The swift one wakes to find that steadiness has already finished what speed had put off",
    ],
    themes: ["steady effort", "pride", "finishing what you begin", "patience"],
    adaptation: {
      ageFloor: 3,
      concerns: ["humiliation"],
      preserve: [
        "the teasing that starts it, so the race has a reason",
        "the genuine gap in speed — the hare really is faster",
        "the choice to stop, made freely and for a good-sounding reason",
        "the slow one never speeding up: the ending is earned by not stopping",
      ],
      soften: [
        "the teasing — playful and silly rather than cutting, and dropped as soon as the race is agreed",
      ],
      remove: [
        "any crowing at the finish, or onlookers laughing at the hare",
      ],
    },
    expansionBeats: [
      "the meadow waking up and the neighbours who hear about the race",
      "the long middle of the course: hedgerows, a stream crossing, a slope in the sun",
      "what the hare's nap is like, told kindly, from the hare's side",
      "the two of them walking home together in the last of the light",
    ],
  },
  {
    id: "quails-and-the-net",
    title: "The Quails and the Net",
    emoji: "🐦",
    tradition: "Buddhist Jātaka",
    region: "South Asia; the Pali Jātaka collection",
    source: {
      collection: "The Jātaka (Pali)",
      authorOrCollector: "Anonymous; compiled within the Pali Buddhist canon",
      publicDomain: true,
      designations: ["Jātaka 33 (Sammodamāna)"],
      confidence: "high",
      note: "The tale is Jātaka 33 in the standard Pali numbering. The collection's own dating is a scholarly question we do not take a position on.",
    },
    characters: ["a flock of quails", "the wisest of the flock", "two who fall out"],
    setup:
      "A flock of small birds can lift a whole net between them — as long as they all lift at once.",
    coreBeats: [
      "A flock keeps getting caught under the same wide net",
      "The wisest among them works out that no single bird can lift it, but all of them together can",
      "They practise, rise as one, carry the net away, and slip out from under it — again and again",
      "Two of them fall to arguing about who does more of the lifting",
      "The next time, everyone pulls in a different direction and the net does not move at all",
      "Only when the arguing stops does the flock rise together again",
    ],
    themes: ["cooperation", "unity", "quarrels cost more than they win", "shared work"],
    adaptation: {
      ageFloor: 3,
      concerns: ["threat", "coercion"],
      preserve: [
        "the net being genuinely too heavy for any one bird",
        "the plan working, repeatedly, so the reader believes in it",
        "the quarrel being small and ordinary — this is how cooperation actually fails",
        "the direct, visible consequence: disagreement, and the net stays put",
      ],
      substitute: [
        "the fowler becomes weather and carelessness: a wide drying-net on shore poles that the evening wind lifts and drops over whoever is feeding beneath it",
      ],
      remove: [
        "the fowler and any person hunting, trapping, selling or eating the birds",
        "the traditional ending in which the quarrelling birds are caught and carried off",
      ],
      soften: [
        "the final trapping — the two who argue simply sit under the net until they stop, and then it lifts",
      ],
    },
    expansionBeats: [
      "the shoreline the flock feeds on and what a day there is like",
      "the practising: learning to lift together, and getting it wrong first",
      "the small thing the argument is really about",
      "the roost in the reeds afterwards, everyone settling wing to wing",
    ],
  },
  {
    id: "the-sound-the-hare-heard",
    title: "The Sound the Hare Heard",
    emoji: "🐇",
    tradition: "Buddhist Jātaka",
    region: "South Asia; the Pali Jātaka collection",
    source: {
      collection: "The Jātaka (Pali)",
      authorOrCollector: "Anonymous; compiled within the Pali Buddhist canon",
      publicDomain: true,
      designations: ["Jātaka 322 (Duddubha)"],
      confidence: "high",
      note: "Jātaka 322 in the standard Pali numbering. It is an early relative of the tale told in English as 'Chicken Little' or 'Henny Penny'.",
    },
    characters: ["a hare who worries", "the animals of the wood", "a calm lion"],
    setup:
      "One thump, one small worry, and half the forest is running — until somebody goes back to look.",
    coreBeats: [
      "A hare dozing under a tree is already wondering, idly, what it would do if the world came apart",
      "Something falls with a thump right behind it, and the hare is certain the world has begun to come apart",
      "It runs, calling the news, and every animal it passes joins in without ever asking where the news came from",
      "A calm, clear-headed one stops the crowd and asks each animal in turn who told them",
      "The question travels back down the line to the hare, who admits it only heard a sound",
      "They go back to the very spot, find the fallen fruit that made the noise, and walk home again",
    ],
    themes: [
      "presence of mind",
      "checking before believing",
      "how a rumour grows",
      "calm is contagious too",
    ],
    adaptation: {
      ageFloor: 3,
      concerns: ["threat", "death"],
      preserve: [
        "the ordinary, believable smallness of the original sound",
        "nobody in the chain asking a single question",
        "the tracing-back, one animal at a time — this is the whole mechanism",
        "the return to the actual place and the plain look at what is really there",
      ],
      soften: [
        "the running — a hurrying, jostling muddle rather than a terrified stampede",
        "the hare's worry — treated tenderly, never as something to be laughed at",
      ],
      remove: [
        "the traditional ending in which the stampede runs into the sea",
        "any animal being hurt, lost, or left behind in the rush",
      ],
    },
    expansionBeats: [
      "the wood before any of it happens: who lives where, and the ordinary evening",
      "the road the crowd takes, and the neighbours it passes and collects",
      "the quiet walk back to the tree, with the crowd growing calmer with every step",
      "everyone going home to their own burrow, nest and hollow as the light goes",
    ],
  },
  {
    id: "monkey-and-the-crocodile",
    title: "The Monkey and the Crocodile",
    emoji: "🐊",
    tradition: "Panchatantra",
    region: "South Asia; Sanskrit narrative tradition",
    source: {
      collection: "Panchatantra, Book IV (Labdhapraṇāśam, 'Loss of Gains')",
      authorOrCollector: "Traditionally attributed to Viṣṇuśarman",
      publicDomain: true,
      designations: ["Panchatantra IV, frame story"],
      confidence: "high",
      note: "The tale is the frame story of the Panchatantra's fourth book. The Panchatantra's date and its original wording are long-standing scholarly questions; a close relative of this tale also appears in the Jātaka collection.",
    },
    characters: ["a monkey in a fruit tree", "a crocodile", "the crocodile's household"],
    setup:
      "A monkey halfway across a wide river works out, very calmly, how to get back to the bank.",
    coreBeats: [
      "A monkey living in a fruit tree by a river makes friends with a river-dweller and sends sweet fruit home with it every day",
      "The river-dweller's household decides it would rather have the monkey itself than the fruit, and presses for it",
      "The river-dweller offers the monkey a ride across the water to visit, and the monkey accepts",
      "Midstream, out of reach of every branch, the river-dweller admits where they are really going",
      "The monkey does not panic; it says, quite reasonably, that the thing they actually want was left behind in the tree, and they will have to go back for it",
      "The river-dweller turns around, the monkey reaches its branch, and the visits are over",
    ],
    themes: [
      "presence of mind",
      "cleverness under pressure",
      "choosing who to trust",
      "a friendship that ends without a fight",
    ],
    adaptation: {
      ageFloor: 6,
      concerns: ["betrayal", "predation", "threat"],
      preserve: [
        "the real friendship first — the betrayal only lands because the fruit-sharing was genuine",
        "the midstream moment: nowhere to go, nothing to climb, no help coming",
        "the monkey solving it by thinking rather than by struggling or shouting",
        "the friendship being genuinely over at the end, warmly but plainly",
      ],
      substitute: [
        "what the household wants becomes the monkey itself, to keep at the bottom of the river and never let home again — the same trap, without anybody being eaten",
      ],
      remove: [
        "eating the monkey, the monkey's heart, and every reference to killing",
      ],
      soften: [
        "the confession midstream — awkward and ashamed rather than menacing; this crocodile is being pushed into it and knows it",
      ],
    },
    expansionBeats: [
      "the fruit tree, the river bank, and the shape of an ordinary shared afternoon",
      "how the friendship was built, one piece of fruit at a time",
      "the crossing itself: the width of the water, the light on it, the sounds",
      "the climb back into the tree afterwards, and a long quiet evening deciding how to feel about it",
    ],
  },
  {
    id: "old-tiger-and-the-golden-bangle",
    title: "The Old Tiger and the Golden Bangle",
    emoji: "🐯",
    tradition: "Hitopadesha",
    region: "South Asia; Sanskrit narrative tradition",
    source: {
      collection: "Hitopadesha, Book I (Mitralābha, 'The Winning of Friends')",
      authorOrCollector: "Traditionally attributed to Nārāyaṇa",
      publicDomain: true,
      designations: ["Hitopadesha I"],
      confidence: "medium",
      note: "The story is securely in the Hitopadesha's first book. The Hitopadesha itself draws on the Panchatantra, and its compiler and date are not firmly established.",
    },
    characters: ["an old tiger", "a traveller", "a muddy pool"],
    setup:
      "Somebody by the water is offering a gold bangle to anyone who will wade out and take it.",
    coreBeats: [
      "An old creature, too slow now to get what it wants the ordinary way, holds up something golden and calls out that whoever wants it may have it",
      "A traveller passing by hears the offer and is tempted",
      "Everything about the scene is wrong, and the traveller notices: the voice, the strangeness of the gift, the churned ground at the water's edge",
      "Greed wins the argument anyway, and the traveller wades in",
      "The mud takes hold, and the offer turns out to have cost far more than it promised",
      "The traveller gets out with nothing, having learned what a too-good offer is made of",
    ],
    themes: ["greed", "judgement", "too good to be true", "listening to your own doubts"],
    adaptation: {
      ageFloor: 6,
      concerns: ["predation", "threat", "coercion"],
      preserve: [
        "the offer being genuinely tempting, not obviously silly",
        "the warning signs being visible the whole time and noticed at the time",
        "greed beating judgement in a way the reader recognises",
        "a real loss at the end — the story means nothing if wading in costs nothing",
      ],
      substitute: [
        "what the tiger is really after becomes the traveller's full bundle and good sandals, not the traveller: the mud swallows them, and the tiger picks over what floats free",
        "the gold bangle turns out to be a twist of polished brass reeds — the promise was never real either",
      ],
      remove: [
        "the traveller being eaten, hurt, or held; the tiger closing in on a stuck person",
      ],
      soften: [
        "the getting-stuck — knee-deep, undignified and cold rather than sinking or frightening; the traveller can always get out",
      ],
    },
    expansionBeats: [
      "the road, the day's walking, and what is in the traveller's bundle and why it matters",
      "the village the traveller is heading for, and who is expecting them",
      "the pool itself: reeds, dragonflies, the flat brown water, the too-quiet birds",
      "the muddy, wiser walk on afterwards, and a kind welcome that does not scold",
    ],
  },
  {
    id: "the-ring-dove-and-the-mouse",
    title: "The Ring-Dove and the Mouse",
    emoji: "🕊️",
    tradition: "Kalīla wa Dimna",
    region: "Arabic transmission of a South Asian cycle",
    source: {
      collection: "Kalīla wa Dimna, the chapter of the ring-dove",
      authorOrCollector:
        "Ibn al-Muqaffaʿ, who put the cycle into Arabic in the eighth century, working from a Middle Persian version of the Panchatantra",
      publicDomain: true,
      designations: [
        "Kalīla wa Dimna, 'The Ring-Dove'",
        "cf. Panchatantra II (Mitrasamprāpti)",
      ],
      confidence: "high",
      note: "The transmission line (Sanskrit → Middle Persian → Arabic) is well established in outline. Ibn al-Muqaffaʿ's dates and the exact contents of the version he worked from are debated.",
    },
    characters: ["a flock of doves", "their leader", "a mouse who is an old friend"],
    setup:
      "A whole flock is caught under one net, and the way out is to stop struggling separately.",
    coreBeats: [
      "A flock spots scattered grain in an open place and comes down for it, against the leader's better judgement",
      "A net comes down over all of them at once, and each bird struggles on its own without shifting it an inch",
      "The leader tells them to stop pulling apart and to lift together, towards a friend it knows",
      "The whole flock rises with the net still over them and flies, as one weight, to the friend's door",
      "The friend begins to free the leader first; the leader asks that everyone else be freed first instead",
      "The last knot is cut, the flock is loose, and someone watching from a tree decides that this is the kind of friend worth having",
    ],
    themes: [
      "cooperation",
      "friendship",
      "leadership that goes last",
      "a plan is worth more than panic",
    ],
    adaptation: {
      ageFloor: 3,
      concerns: ["threat", "hunger-peril"],
      preserve: [
        "the temptation of the grain and the leader's ignored misgiving",
        "solo struggling achieving exactly nothing",
        "the flock flying while still under the net — the image is the whole idea",
        "the leader insisting on being freed last",
      ],
      substitute: [
        "the fowler becomes a fallen drying-net, blown loose from its posts in the wind",
      ],
      remove: [
        "the hunter, the trapping of birds for food or sale, and any hunger driving the flock down",
      ],
    },
    expansionBeats: [
      "the flight before it all happens, and the country passing underneath",
      "how the leader and the mouse came to be friends in the first place",
      "the slow, strange, heavy flight under the net, everyone beating in time",
      "the meal and the roost afterwards, and the newcomer in the tree working up the courage to say hello",
    ],
  },
  {
    id: "anansi-and-the-sky-gods-stories",
    title: "Anansi and the Sky-God's Stories",
    emoji: "🕷️",
    tradition: "Akan (Asante)",
    region: "Ghana; Akan-speaking peoples, and the wider diaspora that carried these tales",
    source: {
      collection: "Akan-Ashanti Folk-Tales",
      authorOrCollector: "R. S. Rattray, who recorded and translated 75 Asante tales in Twi and English",
      year: 1930,
      publicDomain: false,
      designations: ["Anansesem (Anansi stories)"],
      confidence: "medium",
      note: "Anansi stories are a living oral tradition of the Akan-speaking peoples of Ghana, retold across the Caribbean and the Americas; 'Anansesem', the Twi word for folktale, means 'spider stories'. Rattray's 1930 collection is the standard scholarly record of Asante tellings, but the tasks the sky-god sets vary between tellings, and our beat list is not claimed to match any single recorded version. We cite the collection as context, not as a text we have reproduced.",
    },
    characters: ["a small spider", "the sky-god who owns all the stories", "a python", "a swarm of hornets", "a leopard"],
    setup:
      "All the stories in the world belong to somebody else, and the smallest creature going has decided to buy them.",
    coreBeats: [
      "In the beginning nobody owns any stories except the sky-god, so there is nothing to tell in the evenings",
      "The smallest and least powerful creature there is goes up and asks to buy them",
      "The price is a set of impossible errands: bring three of the greatest creatures alive to the sky-god's court",
      "One by one, the small one works out what each great creature most wants — to settle an argument, to get out of the rain, to be helped out of a hole — and lets that do the work",
      "Each great creature arrives at the court having come, in the end, of its own accord",
      "The sky-god hands over the stories, and from that day they belong to everyone who tells them",
    ],
    themes: ["cleverness", "the small outwitting the great", "why we tell stories at all"],
    adaptation: {
      ageFloor: 5,
      concerns: ["threat", "coercion", "humiliation"],
      preserve: [
        "the price being flatly impossible for someone that size",
        "each solution coming from the great creature's own nature and wants, not from force",
        "three distinct problems solved three distinct ways",
        "the small one winning the largest prize there is",
      ],
      substitute: [
        "capture becomes persuasion throughout: the python stretches itself along a pole to settle a friendly argument about its length, the hornets take shelter in a gourd from a sudden shower, the leopard is helped out of a pit it had already fallen into",
      ],
      remove: [
        "tying up, tricking into traps, gum-traps, and any creature being harmed, mocked or held against its will",
      ],
      soften: [
        "the sky-god — remote and amused rather than stern; the errands are a fair price, not a punishment",
      ],
    },
    expansionBeats: [
      "the evenings before there were any stories, and how quiet they were",
      "the long climb or journey up to the sky-god's court",
      "the three errands as three unhurried visits, each with its own weather and its own place",
      "the first evening of story-telling afterwards, everyone settling in to listen",
    ],
  },
  {
    id: "the-old-man-and-the-mountains",
    title: "The Old Man Who Moved the Mountains",
    emoji: "⛰️",
    tradition: "Chinese (Daoist classics)",
    region: "China; classical Daoist literature",
    source: {
      collection: "Liezi, the chapter 'Questions of Tang' (湯問)",
      authorOrCollector: "Attributed to Lie Yukou",
      publicDomain: true,
      designations: ["Yúgōng yíshān 愚公移山"],
      confidence: "medium",
      note: "The story's place in the Liezi's 'Questions of Tang' chapter is not in doubt. The Liezi's authorship and date are genuinely disputed — the attribution to Lie Yukou is traditional, and much of the received text is generally dated considerably later.",
    },
    characters: ["a very old man", "his family", "a clever neighbour", "two mountains"],
    setup:
      "Two mountains stand in the way, and an old man has decided to move them one basket at a time.",
    coreBeats: [
      "Two mountains stand between an old man's door and everywhere he needs to go, and every journey is a long way round",
      "He announces that he will move them, and his family starts carrying earth away in baskets",
      "The distances are absurd: a single trip to tip out the baskets takes a season",
      "A clever neighbour laughs and points out that he will never live to finish it",
      "The old man agrees, and says that is not the point: his sons will go on, and their sons after them, while the mountain does not grow one handful",
      "The work is honoured and the road opens",
    ],
    themes: ["patience", "persistence", "the long view", "work that outlives you"],
    adaptation: {
      ageFloor: 3,
      concerns: [],
      preserve: [
        "the sheer scale of the task, stated plainly rather than shrunk",
        "the neighbour's objection being entirely reasonable",
        "the answer being about time and continuity, not about strength",
        "the road actually opening in the end",
      ],
      soften: [
        "the neighbour — teasing rather than sneering, and won round by the end",
      ],
    },
    expansionBeats: [
      "the household: who carries, who cooks, who is too small to carry and does it anyway",
      "the seasons turning over the work — mud, then dust, then frost on the baskets",
      "the neighbour's visits, growing friendlier each time",
      "the first evening you can see the far valley from the doorway, and everyone sitting down to look at it",
    ],
  },
  {
    id: "the-mouse-who-sought-the-strongest",
    title: "The Mouse Who Looked for the Strongest",
    emoji: "🐭",
    tradition: "Japanese",
    region: "Japan",
    source: {
      collection: "Japanese oral tradition; widely published as 'Nezumi no yomeiri' (ねずみの嫁入り)",
      publicDomain: true,
      confidence: "medium",
      note: "A very widely told Japanese folktale with printed versions going back at least to the Edo period, but no single authoritative text and no identified author. The same chain — sun, cloud, wind, wall — appears in tale patterns recorded far outside Japan, including ATU 2031 in the folktale index this app's other story family uses.",
    },
    characters: ["a mouse family", "the sun", "a cloud", "the wind", "a wall"],
    setup:
      "A mouse family sets out to find the strongest thing in the whole world, and the answer keeps moving.",
    coreBeats: [
      "A mouse family decides that only the greatest thing in the world will do, and sets off to find it",
      "They ask the sun, who says he is not the greatest, because a cloud can cover him",
      "The cloud says the same of the wind, who blows him wherever he likes",
      "The wind says the same of a wall, which he has pushed at all his life and never moved",
      "The wall says that walls are nibbled through by mice, so the greatest thing in the world must be a mouse",
      "The family walks home and finds the answer had been living next door the whole time",
    ],
    themes: ["knowing your own worth", "humility", "the circle home", "looking far for what is near"],
    adaptation: {
      ageFloor: 3,
      concerns: [],
      preserve: [
        "the chain of four, each answer politely handing on to the next",
        "each refusal being honest rather than modest — every one of them has a real reason",
        "the answer arriving back where it started",
      ],
      substitute: [
        "the traditional frame is a search for a bridegroom for the daughter; this app does not tell romances, so the question becomes a young mouse asking who the strongest in the world is, and the family setting out to find out",
      ],
    },
    expansionBeats: [
      "the mouse household, and the question being asked at breakfast",
      "the journey to each of the four, and how you go about getting an audience with the sun",
      "the weather changing around them as they travel from one answer to the next",
      "the walk home along the wall in the last of the light, and supper next door",
    ],
  },
  {
    id: "the-tiger-and-the-dried-persimmon",
    title: "The Tiger and the Dried Persimmon",
    emoji: "🍊",
    tradition: "Korean",
    region: "Korea",
    source: {
      collection: "Korean oral tradition (호랑이와 곶감)",
      authorOrCollector:
        "No identified collector; a widely circulated children's version was written by Ma Hae-song",
      year: 1933,
      publicDomain: false,
      confidence: "medium",
      note: "The oral tale is much older than any printed version and has no single authoritative text. Ma Hae-song's 1933 children's story is a well-known retelling, cited here as context only — nothing of it is reproduced.",
    },
    characters: ["a tiger", "a crying child", "a mother", "a dried persimmon"],
    setup:
      "A tiger listening at the window decides that a dried persimmon must be the most terrifying thing alive.",
    coreBeats: [
      "A tiger, sure it is the most frightening thing in the country, comes close to a house in the dark and listens",
      "Inside, a child is crying, and the mother says the tiger is outside — and the crying does not stop",
      "The tiger is astonished: it has never in its life not been frightening",
      "Then the mother offers a gotgam, a dried persimmon, and the crying stops instantly",
      "The tiger concludes that a gotgam must be a creature far more fearsome than itself, and it would rather not meet one",
      "In the dark something lands on the tiger's back, it is quite certain it knows what, and it leaves the neighbourhood at speed",
      "The joke is that a gotgam is a small, sweet, wrinkled fruit on a string in the eaves",
    ],
    themes: ["misunderstanding", "humility", "fear built out of guesses", "the comfort of the ordinary"],
    adaptation: {
      ageFloor: 5,
      concerns: ["threat"],
      preserve: [
        "the tiger's genuine, wounded astonishment at not being the scariest thing there is",
        "the exact sequence of what the tiger overhears — the whole misunderstanding is built from it",
        "the tiger's own conclusion doing all the work; nobody tricks it",
        "the reveal that the terror is a sweet dried fruit",
      ],
      substitute: [
        "the cow-thief who leaps onto the tiger's back becomes the household's own goat, hopping down off the wall in the dark",
      ],
      remove: [
        "the tiger prowling for the ox or for anyone in the house; it is out in the cold and curious about the light",
        "the thief, and the traditional wild ride that follows",
      ],
      soften: [
        "the child's crying — sleepy and cross rather than distressed",
      ],
    },
    expansionBeats: [
      "the village in the cold, the smell of the eaves, the persimmons drying on their strings",
      "the tiger's own evening before it ever reaches the window",
      "the household inside: supper, the fire, the long business of getting a small person to sleep",
      "the tiger far away on its hillside afterwards, deciding it has had quite enough excitement, and sleeping",
    ],
  },
];

/** All valid fable ids the generator will accept. */
export const FABLE_IDS: readonly string[] = FABLES.map((f) => f.id);

/** Look up a fable by id, or undefined if unknown. */
export function getFable(id: string): Fable | undefined {
  return FABLES.find((f) => f.id === id);
}

/** The traditions actually present in the corpus, in the canonical order above. */
export const PRESENT_TRADITIONS: readonly FableTradition[] =
  FABLE_TRADITIONS.filter((t) => FABLES.some((f) => f.tradition === t));

/**
 * The age band a fable's `ageFloor` rules out, expressed as the lower bound of
 * each band. Kept here rather than in `lib/age-bands.ts` so the ATU family
 * carries none of this.
 */
export function isBelowAgeFloor(fable: Fable, ageBandId: string): boolean {
  if (fable.adaptation.ageFloor === undefined) return false;
  const lower = Number.parseInt(ageBandId, 10);
  return Number.isFinite(lower) && lower < fable.adaptation.ageFloor;
}
