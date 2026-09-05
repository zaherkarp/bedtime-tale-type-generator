/**
 * Beats for the tale types that arrived from the knowledge base with a title
 * and a blurb and nothing else.
 *
 * ## Why this file exists
 *
 * `lib/atu-extended.ts` is generated: 146 tale types that passed the safety
 * screens in `scripts/build-catalogue.ts` and a human read-through, carrying a
 * canonical scholarly title, an emoji and a one-line blurb. They are browsable
 * and generatable, but a request for one reaches `atuSourceLines()` in
 * `lib/prompt.ts` and falls through to the catalogue-only branch, where the
 * brief is the title, the division, the blurb, and an instruction to soften
 * anything frightening. That produces a story. It does not produce a story of
 * the same quality as the 62 types that carry beats.
 *
 * This file closes that gap the same way `lib/tale-types-curated.ts` closed it
 * for the previous fifty: by promoting entries out of the generated tier into
 * the hand-authored registry, with beats, signature elements, a tone and an
 * opener. An id that appears here is filtered out of the generated tier in
 * `lib/atu-index.ts`, so the catalogue never lists it twice.
 *
 * ## What changes on promotion, and what does not
 *
 * The ATU number is carried across unchanged — it is the identity. Everything
 * else is rewritten for a bedtime audience:
 *
 * - **`label` replaces the canonical title.** `lib/atu-extended.ts` carries the
 *   scholarly title verbatim ("Animal Captor Persuaded to Talk", "The Wolf
 *   Dives into the Water for Reflected Cheese") because nothing in the
 *   generated tier is retitled for children. The hand-authored tiers are
 *   retitled, so a promoted entry gets a name a parent would say out loud. The
 *   canonical title is not lost: `lib/atu-canonical.ts` still carries it with
 *   its source and licence, and the browse card still shows it.
 * - **The emoji is re-chosen.** The generated tier assigns emoji from a small
 *   rotation per division, so a wolf story can arrive carrying a turtle. Once
 *   a human is writing the beats anyway, the emoji is picked to match the tale.
 * - **The blurb becomes the card text, the tagline orients the storyteller.**
 *   Same split as the curated tier: `lib/atu-index.ts` keeps showing the
 *   original blurb on the browse card, and the `tagline` here is written for
 *   whoever is reading the brief.
 *
 * ## Written as the gentle telling, not the faithful one
 *
 * This follows `lib/tale-types-curated.ts` exactly, and for the same reason.
 * These are animal tales, and the traditional tellings are full of animals
 * eaten, tricked into mutilation, and left to freeze. `SYSTEM_PROMPT` forbids
 * all of it. Writing the beats faithfully and leaving the storyteller to soften
 * them at generation time only sets the brief arguing with the safety rules,
 * and the brief loses less predictably than it would if it had never asked.
 *
 * So the beats describe the telling this app would produce anyway. The trick
 * still works, the mistake is still made, the lesson still lands — but nobody
 * is eaten, nobody is maimed, and the last beat of every set finishes somewhere
 * warm and still, because that is where the wind-down arc has to end.
 *
 * ## No source text was fetched
 *
 * As with the curated fifty, nothing was downloaded and nothing is quoted.
 * These shapes are written from the tale type's own title and blurb plus
 * general knowledge of the pattern the type names. Every `exampleOpener` is
 * newly written. That carries the ordinary risk of writing from knowledge
 * rather than from an edition: a detail may be wrong in a way reading the text
 * would have caught. They are checked against the shape of the tale type, not
 * against any published version of it.
 */

import type { TaleType } from "./tale-types";

/** Formerly generated-tier types, now with beats. */
export const EXTENDED_TALE_TYPES: readonly TaleType[] = [
  {
    id: "atu-2b-basket-tied-to-wolf-s-tail",
    label: "The Basket on the Wolf's Tail",
    atuNumber: "ATU 2B",
    category: "Animal Tales",
    emoji: "🧺",
    tagline: "A borrowed basket, a wolf's swishing tail, and a fishing trip that goes sideways.",
    beats: [
      "A fox tells a wolf that the best way to fish is to tie a basket to your own tail and dip it in the stream",
      "The wolf ties the basket on and settles at the water's edge to wait for it to fill",
      "The basket grows heavy with weeds and pebbles instead of fish, and the wolf can hardly lift his tail",
      "He tugs and splashes and finally flops backward onto the bank, basket and all",
      "The fox helps him untangle it, laughing without any meanness in it, and the two share the one small fish they did catch",
      "They dry off by a fire until the wolf's tail is warm again, and both doze off to the sound of the stream",
    ],
    signatureElements: [
      "a basket tied where it should not be",
      "a patient, hopeful wait by the water",
      "a tail grown suddenly heavy",
      "a laugh that includes everyone",
      "a shared catch at the end",
    ],
    tone: "silly, affectionate, and easily forgiven",
    exampleOpener:
      "The wolf had never fished before, which is exactly why the fox's plan sounded so reasonable to him.",
  },
  {
    id: "atu-5-biting-the-tree-root",
    label: "The Mouse Who Kept On Chewing",
    atuNumber: "ATU 5",
    category: "Animal Tales",
    emoji: "🌱",
    tagline: "A pinched paw, a patient bit of gnawing, and a quiet escape nobody notices.",
    beats: [
      "A little mouse gets her tail caught snug between two roots at the base of an old tree",
      "A drowsy badger nearby feels a nibbling and grumbles at her to stop biting his paw",
      "The mouse says sorry, and keeps right on gnawing at the root instead, working her tail loose bit by bit",
      "The badger, only half awake, is satisfied and settles back down without noticing the difference",
      "The mouse frees her tail at last and creeps away into the ferns",
      "She curls up in a mossy hollow nearby, tail tucked safe under her chin, and sleeps",
    ],
    signatureElements: [
      "a tail caught between two roots",
      "a half-asleep neighbor easily reassured",
      "steady, patient gnawing",
      "a quiet escape nobody minds",
    ],
    tone: "cozy, clever, and unhurried",
    exampleOpener:
      "The root did not taste like much, but the mouse kept chewing anyway, because a plan is a plan.",
  },
  {
    id: "atu-6-animal-captor-persuaded-to-talk",
    label: "The Rooster Who Talked His Way Free",
    atuNumber: "ATU 6",
    category: "Animal Tales",
    emoji: "🐓",
    tagline: "Held gently but firmly, and freed by nothing more than a good question.",
    beats: [
      "A fox catches a rooster and carries him off, holding him carefully in his mouth",
      "From the farmyard behind them, the hens call out, wondering where the fox thinks he's going",
      "The rooster suggests the fox shout back that he is taking his prize home for supper",
      "The fox opens his mouth wide to call out proudly across the field",
      "The rooster hops free and flutters up to a low branch, unhurt and unbothered",
      "The fox looks up, admits he was outwitted, and the two trade the story back and forth until the stars come out",
    ],
    signatureElements: [
      "a captor too proud to stay quiet",
      "a clever question planted like a seed",
      "a mouth opened at just the wrong moment",
      "an escape with no hard feelings",
    ],
    tone: "sly, good-humored, and warm underneath",
    exampleOpener:
      "The rooster had always talked his way out of smaller troubles, and he saw no reason this should be different.",
  },
  {
    id: "atu-6-animal-captor-talks-with-booty-in",
    label: "The Bird Who Answered Anyway",
    atuNumber: "ATU 6*",
    category: "Animal Tales",
    emoji: "🐦",
    tagline: "A cheeky remark from the bushes, and a captor who simply cannot help answering back.",
    beats: [
      "A cat catches a small bird and holds her gently, trotting home well pleased with himself",
      "A jay in the hedgerow calls out, teasing the cat about mumbling with his mouth full",
      "The cat, stung by the teasing, opens his mouth to snap back a clever reply",
      "The bird slips out mid-sentence and flutters up into the safety of the hedge",
      "The cat blinks, a little embarrassed but not upset, and admits the jay had a point",
      "All three settle in the hedge as evening comes on, trading jokes instead of grudges until everyone grows sleepy",
    ],
    signatureElements: [
      "a catch held loosely in a proud mouth",
      "a heckler with good timing",
      "an answer that costs more than it's worth",
      "a small escape met with good humor",
    ],
    tone: "playful, teasing, and quick to forgive",
    exampleOpener:
      "The cat was so pleased with his catch that he simply had to tell someone about it, which turned out to be the trouble.",
  },
  {
    id: "atu-7-the-three-tree-names",
    label: "The Three Trees' Names",
    atuNumber: "ATU 7",
    category: "Animal Tales",
    emoji: "🌳",
    tagline: "A riddle asked under three different trees, and a friend who has been listening all along.",
    beats: [
      "A fox meets a young hare in the woods and says he will only let her pass if she can name the tree above them",
      "The hare cannot remember, and wanders on worried, past a second tree and then a third, each with the same question waiting",
      "An owl who has heard the whole thing calls down the answer for all three, one branch at a time",
      "The hare hurries back and names oak, birch, and willow without a single stumble",
      "The fox claps his paws together, delighted by the trick working out fair and square, and lets her pass with a nod",
      "The hare thanks the owl on her way home, and both settle into their nests as the last tree stops rustling for the night",
    ],
    signatureElements: [
      "a riddle repeated under three trees",
      "a helper listening quietly overhead",
      "names remembered just in time",
      "a game played fair in the end",
    ],
    tone: "gentle, riddling, and quietly triumphant",
    exampleOpener:
      "Nobody had ever asked the hare to name a tree before, and it turned out to be harder than it sounded.",
  },
  {
    id: "atu-20c-the-animals-flee-in-fear-of",
    label: "The Day the Animals Ran",
    atuNumber: "ATU 20C",
    category: "Animal Tales",
    emoji: "🐇",
    tagline: "An acorn falls, a rumor grows legs, and a whole forest goes rushing nowhere.",
    beats: [
      "An acorn drops on a rabbit's ear and she decides, quite certainly, that the sky is falling",
      "She tells a squirrel, who tells a hedgehog, who tells a fox, and soon a whole worried line is hurrying through the trees",
      "Each animal adds the story to the next, until half the forest is running behind them, unsure why",
      "A calm old owl asks the rabbit to show her exactly where the sky fell",
      "They all walk back together and find only the one small acorn, resting in the moss",
      "Everyone has a good laugh at themselves, and the whole procession curls up together under the same wide, unfallen sky",
    ],
    signatureElements: [
      "a small alarming bump from above",
      "a rumor that grows with each retelling",
      "a hurrying, worried procession",
      "a calm voice asking to see the evidence",
      "an ordinary explanation, gently revealed",
    ],
    tone: "bustling, funny, and reassuring",
    exampleOpener:
      "It was, in fact, only an acorn, but nobody in the line running behind the rabbit knew that yet.",
  },
  {
    id: "atu-31-fox-climbs-from-the-pit-on",
    label: "Out of the Pit, Together",
    atuNumber: "ATU 31",
    category: "Animal Tales",
    emoji: "🕳️",
    tagline: "A deep pit, a boost from an unlikely ladder, and a debt paid back by evening.",
    beats: [
      "A fox and a wolf both tumble into the same shallow pit while chasing the same rolling apple",
      "They try jumping, one at a time, but the sides are too steep for either alone",
      "The fox has the idea of standing on the wolf's shoulders to peek over the rim",
      "She scrambles out first and, once up, finds a fallen branch to lower back down",
      "The wolf climbs up hand over paw, grumbling good-naturedly about who owes whom now",
      "They walk home together as the sun sets, the debt called even, and share the apple that started it all before falling asleep by the same tree",
    ],
    signatureElements: [
      "a pit deeper than it looks",
      "an unlikely boost between rivals",
      "a lowered branch instead of a grudge",
      "a debt settled with good humor",
    ],
    tone: "wry, cooperative, and companionable",
    exampleOpener:
      "Neither of them had meant to end up in the same hole, but there they were, looking up at the same circle of sky.",
  },
  {
    id: "atu-32-the-wolf-descends-into-the-well",
    label: "Two Buckets in the Well",
    atuNumber: "ATU 32",
    category: "Animal Tales",
    emoji: "🪣",
    tagline: "One bucket down, one bucket up, and a fox who knows exactly how a well works.",
    beats: [
      "A fox finds herself at the bottom of a well, resting in one of its two hanging buckets",
      "A wolf peers over the edge, and the fox tells him this bucket is full of stars worth collecting",
      "The wolf climbs eagerly into the empty bucket up top, and down he goes as her bucket rises",
      "They pass each other halfway, the fox waving cheerfully on her way up into moonlight",
      "The wolf reaches the bottom, finds only cool water and his own rippling reflection, and calls up that he's been had",
      "The fox tips her head over the rim, promises the next trick will be an actual treat, and they share supper by the well before the wolf climbs back out and everyone turns in for the night",
    ],
    signatureElements: [
      "two buckets on one creaking rope",
      "a swap that looks like a trade",
      "starlight mistaken for treasure",
      "a splash of realization at the bottom",
      "a promise kept afterward",
    ],
    tone: "playful, circular, and good-natured",
    exampleOpener:
      "The well had exactly two buckets, and the fox had exactly one idea about what to do with them.",
  },
  {
    id: "atu-34-the-wolf-dives-into-the-water",
    label: "The Wolf and the Moon in the Pond",
    atuNumber: "ATU 34",
    category: "Animal Tales",
    emoji: "🌕",
    tagline: "A round pale shape on the water, and a hungry wolf who is sure it's cheese.",
    beats: [
      "A wolf out walking at night spots a round, pale shape floating on the still pond",
      "Certain it is a wheel of cheese, he wades in and paddles toward it again and again",
      "Each time he reaches the middle, the shape scatters into ripples and slips away",
      "Tired and dripping, he sits back on the bank to catch his breath",
      "A heron nearby nods upward, and the wolf finally looks up to see the moon sitting calmly overhead",
      "He shakes himself dry, a little sheepish but smiling, and settles into the reeds to watch the real moon until his eyes grow heavy",
    ],
    signatureElements: [
      "a pale shape rippling on dark water",
      "cheese that was never really there",
      "repeated, hopeful paddling",
      "a gentle nudge to look up instead",
      "moonlight enjoyed for what it is",
    ],
    tone: "wistful, comic, and softly moonlit",
    exampleOpener:
      "The moon had never once claimed to be cheese, but the wolf was too hungry to ask it directly.",
  },
  {
    id: "atu-34a-the-dog-drops-his-meat-for",
    label: "The Dog and His Reflection",
    atuNumber: "ATU 34A",
    category: "Animal Tales",
    emoji: "🐕",
    tagline: "A good bone, a bright puddle, and a dog who learns to trust his own luck.",
    beats: [
      "A dog trots home from the butcher with a fine bone held proudly in his mouth",
      "Crossing a plank over the stream, he looks down and sees another dog with a bone just as good",
      "He opens his mouth to ask for it, and his own bone tumbles into the water",
      "He watches it drift, a little startled, while the water settles back to a mirror",
      "He notices the evening smells drifting from home, trots on, and finds his bowl already filled and waiting",
    ],
    signatureElements: [
      "a bone carried with pride",
      "a still stream turned to glass",
      "a reflection mistaken for a rival",
      "a bowl waiting at home after all",
    ],
    tone: "gentle, self-forgiving, and quietly wise",
    exampleOpener:
      "The little dog had never owned anything so fine as the bone in his mouth, and he wanted to admire it from every angle.",
  },
  {
    id: "atu-34c-the-monkey-with-the-lentils",
    label: "The Monkey and the Lentil",
    atuNumber: "ATU 34C",
    category: "Animal Tales",
    emoji: "🐒",
    tagline: "A handful of lentils, one rolling seed, and a lap that turns out to hold plenty.",
    beats: [
      "A monkey gathers a whole handful of lentils from beneath the vines",
      "One lentil slips and rolls away, and the monkey sets down the rest to chase it",
      "While she scrambles after the single seed, sparrows quietly carry off the handful",
      "She catches the runaway lentil at last and holds it up, pleased with her small prize",
      "She curls into the crook of a branch, turning the one lentil over in her fingers until her eyes grow heavy and close",
    ],
    signatureElements: [
      "a handful traded for one stray seed",
      "small helpers who make off with the rest",
      "a chase that outweighs its prize",
      "contentment with whatever is left",
    ],
    tone: "light, comic, and easy on itself",
    exampleOpener:
      "Every lentil in the handful was exactly the same size, which made it very strange that one of them mattered so much more.",
  },
  {
    id: "atu-41-the-wolf-overeats-in-the-cellar",
    label: "The Wolf Who Ate Too Much",
    atuNumber: "ATU 41",
    category: "Animal Tales",
    emoji: "🐺",
    tagline: "A cellar full of good things, a gap in the fence, and a belly that needs a night to settle.",
    beats: [
      "A hungry wolf slips through a narrow gap into a cellar stocked with cheeses and jars of honey",
      "He tastes a little of everything, then a little more, until he is pleasantly, thoroughly full",
      "When he tries to leave, the gap that let him in is suddenly much too snug for him",
      "He settles down on the sacks to wait, telling himself a nap will help matters",
      "By morning he has slimmed back to size, slips out unseen, and dozes the rest of the day under a warm hedge",
    ],
    signatureElements: [
      "a cellar of good things",
      "a gap that measures appetite",
      "an overfull, drowsy wolf",
      "a patient wait instead of a scare",
    ],
    tone: "cosy, comic, and unhurried",
    exampleOpener:
      "The wolf had meant to take only a taste, but the cheeses were so companionable that one taste kept leading to another.",
  },
  {
    id: "atu-43-the-bear-builds-a-house-of",
    label: "The House of Wood and the House of Ice",
    atuNumber: "ATU 43",
    category: "Animal Tales",
    emoji: "🏠",
    tagline: "Two neighbours, two houses, and one built to last past the thaw.",
    beats: [
      "A bear builds herself a sturdy house of logs, and a fox builds a dazzling one of ice",
      "The fox teases the bear all winter about her plain, heavy walls",
      "Spring comes softly, and the fox's bright house begins to drip and shrink and sag",
      "The fox arrives at the bear's door, embarrassed but welcomed in without a word of blame",
      "They share the wood house through the last cold nights, and the fox falls asleep by the fire, warm and forgiven",
    ],
    signatureElements: [
      "a house that outlasts the season",
      "a house too pretty to last",
      "a boast that quietly cools",
      "a door opened without scolding",
    ],
    tone: "steady, kind, and softly triumphant",
    exampleOpener:
      "All winter the ice house sparkled so brightly that even the bear had to admit it was lovely to look at.",
  },
  {
    id: "atu-50a-fox-sees-all-tracks-going-into",
    label: "The Tracks That Never Came Back",
    atuNumber: "ATU 50A",
    category: "Animal Tales",
    emoji: "🦶",
    tagline: "Footprints leading one way only, and a fox too sensible to follow them in.",
    beats: [
      "The fox comes to the lion's cave and finds the ground crowded with tracks",
      "Every print leads in through the doorway, and not a single one leads back out",
      "The fox calls a cheerful greeting from a safe distance instead of stepping closer",
      "The old lion calls back that he has simply been resting indoors all week, quite content",
      "The fox laughs at her own caution, and the two chat by firelight in the cave mouth until both grow drowsy",
    ],
    signatureElements: [
      "a doorway of one-way tracks",
      "a puzzle read correctly",
      "caution rewarded, not punished",
      "an evening spent talking instead of fearing",
    ],
    tone: "clever, calm, and reassuring",
    exampleOpener:
      "The fox had learned long ago that the smartest thing a nose could do was count the tracks before the feet went any further.",
  },
  {
    id: "atu-51a-the-fox-has-the-sniffles",
    label: "The Fox's Sniffles",
    atuNumber: "ATU 51A",
    category: "Animal Tales",
    emoji: "🤧",
    tagline: "A stuffy nose, a ready excuse, and neighbours who see through it kindly.",
    beats: [
      "The fox announces to the whole forest that he has caught a terrible cold",
      "He explains, sniffling grandly, why he cannot possibly help with the harvest or the mending today",
      "One by one the animals bring him warm broth and soft blankets instead of chores",
      "The rabbit gently points out that his sniffles seem to vanish whenever cake appears",
      "The fox laughs, admits it, and drifts off under the blankets anyway, fussed over and entirely comfortable",
    ],
    signatureElements: [
      "a very theatrical sniffle",
      "an excuse for every task",
      "neighbours who play along kindly",
      "comfort earned honestly in the end",
    ],
    tone: "playful, affectionate, and a little sly",
    exampleOpener:
      "The fox's cold had a curious habit of getting much worse whenever there was sweeping to be done.",
  },
  {
    id: "atu-53-the-fox-investigates-a-roar",
    label: "The Fox and the Big Roar",
    atuNumber: "ATU 53*",
    category: "Animal Tales",
    emoji: "🌲",
    tagline: "A tremendous noise in the forest, and one small fox brave enough to check.",
    beats: [
      "A roar shakes the treetops and every animal in the forest freezes where it stands",
      "While the others hide, the fox decides someone ought to go and see what it really is",
      "She creeps closer and finds only an old lion practising his loudest yawn for fun",
      "The lion, a bit sheepish, admits he simply likes the sound of his own voice sometimes",
      "The fox spreads the word, the forest settles back down, and everyone sleeps easier for knowing",
    ],
    signatureElements: [
      "a roar that empties the clearing",
      "one brave, curious fox",
      "a harmless explanation",
      "peace restored by simply looking",
    ],
    tone: "brave, funny, and reassuring",
    exampleOpener:
      "It was the kind of roar that made the leaves shiver, and the fox found she was more curious than frightened.",
  },
  {
    id: "atu-58-the-crocodile-carries-the-jackal",
    label: "The Crocodile's Ferry",
    atuNumber: "ATU 58",
    category: "Animal Tales",
    emoji: "🐊",
    tagline: "A river crossing, a hungry rumble, and a jackal who talks his way to the far bank.",
    beats: [
      "The jackal asks the crocodile for a ride across the wide river, and the crocodile agrees",
      "Halfway across, the crocodile's stomach grumbles loudly and he hints that a snack would be nice",
      "The jackal chats brightly about the plump ducks and juicy melons waiting on the far shore",
      "The crocodile, mouth watering at the thought of a proper feast, swims a little faster to get there",
      "They part on the bank as friendly acquaintances, and the jackal watches the river turn silver and calm before curling up to sleep",
    ],
    signatureElements: [
      "a favour asked mid-river",
      "a rumbling hint of hunger",
      "a clever, distracting story",
      "a safe landing on the far bank",
    ],
    tone: "sly, good-humoured, and unruffled",
    exampleOpener:
      "The jackal had crossed rivers on crocodile-back before, and he always brought along a good story just in case.",
  },
  {
    id: "atu-63-the-fox-rids-himself-of-fleas",
    label: "How the Fox Lost His Fleas",
    atuNumber: "ATU 63",
    category: "Animal Tales",
    emoji: "🦊",
    tagline: "An itchy fox, a slow wade into the pond, and a clever way to travel light.",
    beats: [
      "A fox is so itchy with fleas that he can hardly sit still",
      "He picks up a little clump of moss in his teeth and wades toward the pond",
      "Bit by bit he sinks lower, and the fleas creep higher up his fur to stay dry",
      "At last only his nose and the moss poke above the water, and every last flea crowds onto it",
      "The fox lets the moss drift gently away downstream and climbs out, clean at last",
      "He shakes himself dry on the warm bank and curls up there, scratch-free, listening to the water until he sleeps",
    ],
    signatureElements: [
      "a clump of drifting moss",
      "a still pond at evening",
      "fleas climbing to higher ground",
      "a fox's slow, patient wade",
      "a dry and peaceful bank",
    ],
    tone: "patient, itchy-turned-peaceful, and quietly clever",
    exampleOpener:
      "The fox had counted his fleas exactly once, decided the number was far too high, and gone looking for the pond.",
  },
  {
    id: "atu-67-the-fox-in-a-swollen-river",
    label: "The Fox and the Rising River",
    atuNumber: "ATU 67",
    category: "Animal Tales",
    emoji: "🌊",
    tagline: "A river rising fast, an armful of treasures, and the peace of choosing what to keep.",
    beats: [
      "A fox sets out to cross a river with an armful of things she has gathered all day",
      "The water rises faster than she expects, tugging gently but firmly at her paws",
      "She lets the heaviest bundle go, then the next, keeping only the one thing she loves best",
      "Lighter now, she paddles steadily and reaches the far bank without any trouble",
      "Looking back at the current, she finds she does not miss what she let float away",
      "She lays her one saved treasure out to dry in the moonlight and settles beside it to sleep",
    ],
    signatureElements: [
      "an armful of gathered treasures",
      "a river rising by the minute",
      "choices made one at a time",
      "a single treasure kept close",
      "a quiet, moonlit far bank",
    ],
    tone: "brisk, practical, and calmly reassuring",
    exampleOpener:
      "The river had been a friendly trickle that morning, and by afternoon it had opinions of its own.",
  },
  {
    id: "atu-75-the-help-of-the-weak",
    label: "The Lion and the Mouse",
    atuNumber: "ATU 75",
    category: "Animal Tales",
    emoji: "🦁",
    tagline: "A small kindness remembered, and a great favor returned when it matters most.",
    beats: [
      "A lion catches a small mouse under one great paw, more curious than cross",
      "The mouse asks to be let go, promising that even a small friend can help someday",
      "The lion chuckles at the idea but lifts his paw and lets her scamper off anyway",
      "Later the lion gets tangled in a hunter's net and cannot tear himself free",
      "The mouse hears his low, worried rumble, hurries over, and gnaws through rope after rope",
      "Free again, the two of them rest together in a patch of soft grass and watch the first stars come out",
    ],
    signatureElements: [
      "a lion's great, gentle paw",
      "a small mouse's brave promise",
      "a tangle of hunter's rope",
      "patient, careful gnawing",
      "an unlikely friendship",
    ],
    tone: "grand, humble, and gently triumphant",
    exampleOpener:
      "The lion had never once thought a mouse worth noticing, until the day one saved his life.",
  },
  {
    id: "atu-75a-the-lion-and-the-worm",
    label: "The Lion Who Learned to Listen",
    atuNumber: "ATU 75A",
    category: "Animal Tales",
    emoji: "🐛",
    tagline: "A boastful lion, a determined little worm, and a lesson about the smallest creatures.",
    beats: [
      "A lion boasts to the whole meadow that nothing so small as a worm could ever bother him",
      "A tiny worm curled in the grass quietly disagrees, and decides to prove her point",
      "She tucks herself into his thick mane, and her wriggling keeps him sneezing all afternoon",
      "The lion finally stops boasting and asks, quite politely, if she would mind settling down",
      "The worm agrees at once, pleased to have made her point without any hard feelings",
      "The two of them rest together under a shady tree as the lion's breathing slows into a nap",
    ],
    signatureElements: [
      "a boastful lion",
      "a small, determined worm",
      "a tickly, wriggling mane",
      "a lesson in respect",
      "a shared patch of shade",
    ],
    tone: "playful, humbling, and warmly resolved",
    exampleOpener:
      "The lion had a great many opinions about which animals mattered, and a worm was not one of them, yet.",
  },
  {
    id: "atu-78a-animal-tied-up-because-of-a",
    label: "Tied Safe Through the Storm",
    atuNumber: "ATU 78A",
    category: "Animal Tales",
    emoji: "⛈️",
    tagline: "Dark clouds rolling in, a rope tied to a sturdy tree, and morning arriving calm.",
    beats: [
      "Dark clouds gather and the wind begins to hum through the branches",
      "A goat asks a friend to loop a rope around her and tie it to the sturdiest tree nearby",
      "The storm rattles the leaves and rain comes down hard, but the rope holds her steady all night",
      "By morning the storm has blown itself out, and the meadow is washed clean and bright",
      "Her friend unties the rope, half-expecting the goat to feel silly about needing the help",
      "Instead the goat thanks her warmly, and the two watch the sunrise together, drowsy and dry",
    ],
    signatureElements: [
      "gathering storm clouds",
      "a rope tied to a sturdy tree",
      "rain and wind through the night",
      "a calm, anchored animal",
      "a washed-clean morning",
    ],
    tone: "cozy, sheltering, and quietly grateful",
    exampleOpener:
      "The wind had a certain smell that told every animal in the valley to find something solid and hold on.",
  },
  {
    id: "atu-81-too-cold-for-hare-to-build",
    label: "Too Busy Enjoying the Weather to Build a House",
    atuNumber: "ATU 81",
    category: "Animal Tales",
    emoji: "❄️",
    tagline: "Four seasons of good excuses, and a warm burrow shared at last.",
    beats: [
      "In winter, a hare decides it is far too cold to dig and build a proper house",
      "When spring arrives she says the weather is much too fine for such chores",
      "All summer she is too busy playing, and all autumn too busy gathering the last sweet berries",
      "Winter comes back around, and she is still without a house when the first snow falls",
      "A neighborly fox, who built his den long ago, invites her in to share his warm burrow",
      "The two of them settle by a heap of dry leaves, listening to snow tap softly on the roof, and drift off to sleep",
    ],
    signatureElements: [
      "four seasons of good excuses",
      "an unbuilt house",
      "the first snowfall",
      "a generous neighbor's den",
      "a warm, shared burrow",
    ],
    tone: "gently teasing, forgiving, and cozy",
    exampleOpener:
      "The hare had a reason ready for every season, and not one single house to show for it.",
  },
  {
    id: "atu-87a-the-bear-stands-on-a-heap",
    label: "The Bear on Top of the World",
    atuNumber: "ATU 87A*",
    category: "Animal Tales",
    emoji: "🪵",
    tagline: "A tall woodpile, a very big claim, and a friendly correction from smaller eyes.",
    beats: [
      "A bear climbs to the very top of a tall heap of chopped wood behind the barn",
      "From up there he announces to every passing creature that he can see the whole wide world",
      "A small bird flying by asks what lies over the far hill, and the bear has to admit he cannot quite see that far",
      "A squirrel asks about the bottom of the pond, and the bear admits he cannot see that either",
      "He climbs back down, a little wiser about just how big the world really is",
      "That night by the fire he tells the story on himself, laughing along with everyone, until his eyes grow heavy",
    ],
    signatureElements: [
      "a tall heap of wood",
      "a proud view from the top",
      "curious questions from smaller creatures",
      "a graceful climb back down",
      "a warm fireside laugh",
    ],
    tone: "comic, humble, and warmly self-aware",
    exampleOpener:
      "From the top of the woodpile, the bear was fairly sure he could see absolutely everything worth seeing.",
  },
  {
    id: "atu-111-the-cat-and-the-mouse-converse",
    label: "The Cat and the Mouse Have a Chat",
    atuNumber: "ATU 111",
    category: "Animal Tales",
    emoji: "🐭",
    tagline: "A careful conversation across a very safe distance, and a friendship it grows into.",
    beats: [
      "A mouse peeks out of her hole and spots a cat sunning himself a comfortable distance away",
      "Curiosity gets the better of them both, and they start to talk, mouse to cat, across the gap",
      "The cat asks polite questions about life underground, and the mouse asks about naps in sunbeams",
      "Neither one moves an inch closer, but neither one stops talking either",
      "As the sun sinks low, they agree to talk again tomorrow, same safe distance, same friendly tone",
      "Both curl up in their own soft corners, still smiling about the conversation, and fall fast asleep",
    ],
    signatureElements: [
      "a careful, comfortable distance",
      "a sunny afternoon chat",
      "polite, curious questions",
      "two very different daily lives",
      "a promise to talk again",
    ],
    tone: "wary, warm, and companionable",
    exampleOpener:
      "The mouse had never spoken to a cat before, but the distance between them felt exactly right for trying.",
  },
];
