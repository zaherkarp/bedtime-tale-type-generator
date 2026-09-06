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
 * ## Where each entry's beats came from, per entry
 *
 * Every entry carries a `source`. Ten say `kind: "edition"` and name a
 * public-domain collection, the tale's title in it, and its Gutenberg id: those
 * beats were written by reading that text. Forty say `kind: "knowledge"` and
 * were written from the tale type's own title and blurb plus general knowledge
 * of the pattern it names, with no text consulted.
 *
 * The split is not laziness, it is the ceiling. Searching eleven public-domain
 * collections — both major Aesop translations, Grimm, Jacobs' English and
 * Celtic, Dasent's Norse, two Lang colour books, two Andersen editions — and
 * confirming each candidate by reading it found a usable English text for only
 * about a fifth of the generated tier. The rest of the ATU long tail is
 * regional oral material that was never translated, and the concordance that
 * would map a type number to a text is Uther 2004, which this repository
 * deliberately does not ingest (see `docs/atu-kb-decisions.md` §3).
 *
 * Matching on titles alone was tried and was roughly 40% wrong: two tales about
 * a fox and a wolf are routinely not the same tale. So a citation here means
 * somebody read the passage, not that a string matched.
 *
 * An entry is only cited if its beats were actually written from that text. Five
 * of these were first written from knowledge and later found to have a matching
 * edition; rather than backdate a citation onto beats that did not come from it,
 * those five were rewritten from the text and cited then.
 *
 * Nothing is quoted either way. Every `exampleOpener` is newly written, and the
 * beats are structural summaries in our own words. The `knowledge` entries carry
 * the ordinary risk of writing without a text: a detail may be wrong in a way
 * reading one would have caught. They are checked against the shape of the tale
 * type, not against any published version of it.
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
    source: { kind: "knowledge" },
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
    source: { kind: "knowledge" },
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
    source: { kind: "knowledge" },
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
    source: { kind: "knowledge" },
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
    source: { kind: "knowledge" },
  },
  {
    id: "atu-20c-the-animals-flee-in-fear-of",
    label: "Henny-Penny and the Falling Sky",
    atuNumber: "ATU 20C",
    category: "Animal Tales",
    emoji: "🐔",
    tagline: "A tap on the head starts a rumor, a fox offers a shortcut, and a whole feathered line escapes together.",
    beats: [
      "Henny-Penny is pecking corn in the yard when something taps her sharply on the head, and she decides at once that the sky must be falling and the king needs to know",
      "Cocky-Locky asks to come along, then Ducky-Daddles, then Goosey-Poosey, then Turkey-Lurkey, until Henny-Penny is leading a whole hurrying line down the road",
      "Foxy-Woxy meets them and offers to show a quicker way to the king, leading the whole procession toward the dark mouth of his cave",
      "As the first of the friends step toward the opening, Henny-Penny catches a gleam in the shadows and calls out that something is wrong",
      "The whole line turns and scurries back the way they came, laughing with relief once they are safely out in the open field",
      "Deciding the king's news can wait until morning, the friends settle down together in the soft grass under the wide, unfallen sky",
    ],
    signatureElements: [
      "a surprise tap from above",
      "a growing line of feathered friends",
      "a fox's shortcut through a dark cave",
      "a gleam spotted just in time",
      "a safe scurry home together",
    ],
    tone: "bustling, suspenseful-but-safe, and warmly reassuring",
    exampleOpener:
      "Henny-Penny had never been tapped on the head by the sky before, so naturally she assumed the worst.",
    source: {
      kind: "edition",
      work: "English Fairy Tales",
      taleTitle: "Henny-Penny",
      gutenbergId: 7439,
    },
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
    source: { kind: "knowledge" },
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
    source: { kind: "knowledge" },
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
    source: { kind: "knowledge" },
  },
  {
    id: "atu-34a-the-dog-drops-his-meat-for",
    label: "The Dog and the Shadow",
    atuNumber: "ATU 34A",
    category: "Animal Tales",
    emoji: "🐕",
    tagline: "A good piece of meat, a flashy reflection, and a dog who learns that grabbing for more can cost what he already has.",
    beats: [
      "A dog trots across a bridge with a fine piece of meat held proudly in his mouth",
      "Looking down into the stream, he spots his own reflection and mistakes it for another dog carrying a piece twice the size",
      "Greedy for the bigger share, he opens his mouth to snap it away from the other dog",
      "His own meat drops into the water and is carried off by the current, and the rival vanishes the moment the ripples settle",
      "He stands blinking at the empty stream for a moment, a little wiser about wanting more than he already had",
      "He wanders on home to his supper dish, finds it filled and waiting, and settles in for a full, sleepy night after all",
    ],
    signatureElements: [
      "a bridge over a running stream",
      "a rival glimpsed in the water",
      "a snap that costs a good meal",
      "ripples settling over an empty stream",
      "a full dish waiting at home",
    ],
    tone: "wry, gentle, and quietly wise",
    exampleOpener:
      "The meat in his mouth was already more than enough, but the dog in the water seemed to have so much more.",
    source: {
      kind: "edition",
      work: "Three hundred Aesop's fables",
      taleTitle: "The Dog and the Shadow",
      gutenbergId: 21,
    },
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
    source: { kind: "knowledge" },
  },
  {
    id: "atu-41-the-wolf-overeats-in-the-cellar",
    label: "The Swollen Fox",
    atuNumber: "ATU 41",
    category: "Animal Tales",
    emoji: "🦊",
    tagline: "A hollow tree full of good things, a gap too narrow for a full belly, and a fox who learns that patience pays off.",
    beats: [
      "A hungry fox discovers a hollow tree stocked with bread and meat left there by some shepherds",
      "He squeezes in through a narrow gap in the trunk and eats until he is delighted and thoroughly full",
      "When he tries to squeeze back out, his full belly is now much too round for the same narrow gap",
      "He whines and frets over being stuck, until another fox passes by and asks what the trouble is",
      "The second fox tells him kindly there is nothing for it but to rest right where he is until he shrinks back to size",
      "The fox settles down inside the cozy, crumb-scented tree, patient and drowsy, and dozes off waiting to slim back down",
    ],
    signatureElements: [
      "a hollow tree stocked with treats",
      "a narrow gap that measures appetite",
      "an overfull, stuck fox",
      "a passing friend's calm advice",
      "a patient wait instead of a panic",
    ],
    tone: "cosy, comic, and unhurried",
    exampleOpener:
      "The fox had planned to eat only a little, but a hollow tree stocked with bread and meat made keeping that promise nearly impossible.",
    source: {
      kind: "edition",
      work: "Aesop's Fables; a new translation",
      taleTitle: "The Swollen Fox",
      gutenbergId: 11339,
    },
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
    source: { kind: "knowledge" },
  },
  {
    id: "atu-50a-fox-sees-all-tracks-going-into",
    label: "The Tracks That Never Came Back",
    atuNumber: "ATU 50A",
    category: "Animal Tales",
    emoji: "🐾",
    tagline: "Tracks that only go one way, a fox too clever to be fooled, and a lion who just wanted some company.",
    beats: [
      "An old lion, too weak now to hunt, curls up in his cave and lets it be known that he is gravely ill",
      "Curious animals who visit to check on him find themselves invited in for such a long, cozy chat that not one of them wanders back out that day",
      "A fox arrives at the cave and notices the ground crowded with tracks, every single one leading in and not a single one leading back out",
      "Rather than step inside, she calls a cheerful greeting from a safe distance and asks how the old lion is feeling",
      "The lion admits, a little sheepishly, that he only wanted company, and had been keeping his visitors talking long past bedtime",
      "The fox laughs at the mystery solved, and joins the whole drowsy gathering curled up together in the cave after a long evening of stories",
    ],
    signatureElements: [
      "a cave and a claimed illness",
      "a doorway of one-way tracks",
      "a puzzle read correctly from a distance",
      "a lonely lion's sheepish confession",
      "a cave full of sleepy visitors",
    ],
    tone: "clever, cosy, and gently reassuring",
    exampleOpener:
      "The fox counted the tracks twice before she went anywhere near the cave, because twice was how sure she liked to be.",
    source: {
      kind: "edition",
      work: "Aesop's Fables; a new translation",
      taleTitle: "The Old Lion",
      gutenbergId: 11339,
    },
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
    source: { kind: "knowledge" },
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
    source: { kind: "knowledge" },
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
    source: { kind: "knowledge" },
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
    source: { kind: "knowledge" },
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
    source: { kind: "knowledge" },
  },
  {
    id: "atu-75-the-help-of-the-weak",
    label: "The Lion and the Mouse",
    atuNumber: "ATU 75",
    category: "Animal Tales",
    emoji: "🦁",
    tagline: "A small kindness remembered, and a great favor returned when it matters most.",
    beats: [
      "A lion asleep in his lair is woken by a small mouse scurrying right across his face",
      "He catches her under one great paw, more startled than truly angry",
      "The mouse begs to be let go, promising that even someone as small as she might repay his kindness one day",
      "Amused by the very idea, the lion laughs and lets her scurry off unharmed",
      "Later the lion gets tangled in a hunter's rope net and roars in frustration, and the mouse hears him and comes running",
      "She gnaws through the ropes strand by strand until he is free, and the two rest together as evening settles, both glad the favor was repaid",
    ],
    signatureElements: [
      "a lion's great, careful paw",
      "a small mouse's bold promise",
      "a tangle of hunter's rope",
      "patient gnawing through the knots",
      "a favor repaid at just the right time",
    ],
    tone: "grand, humble, and gently triumphant",
    exampleOpener:
      "The lion had laughed at the mouse's promise, the way anyone might laugh at a raindrop offering to put out a fire.",
    source: {
      kind: "edition",
      work: "Aesop's Fables; a new translation",
      taleTitle: "The Lion and the Mouse",
      gutenbergId: 11339,
    },
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
    source: { kind: "knowledge" },
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
    source: { kind: "knowledge" },
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
    source: { kind: "knowledge" },
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
    source: { kind: "knowledge" },
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
    source: { kind: "knowledge" },
  },
  {
    id: "atu-112-the-mice-and-the-rooster",
    label: "The Mice Hold a Meeting",
    atuNumber: "ATU 112**",
    category: "Animal Tales",
    emoji: "🐓",
    tagline: "A cozy council of mice, and a rooster who simply must weigh in.",
    beats: [
      "Mice gather in a cozy burrow to plan how to store their winter grain",
      "A rooster strolls by, hears the fuss, and lets himself in with a long list of opinions",
      "He insists mice should crow at dawn and strut about like proper farmyard folk",
      "The mice listen politely, thank him for his thoughts, and quietly go back to their own sensible plan",
      "The rooster, satisfied just to have been heard, settles into a corner of the burrow to rest",
      "Grain sorted and rooster snoring gently, the whole burrow drifts off to sleep together",
    ],
    signatureElements: [
      "a crowded little council",
      "a rooster's uninvited advice",
      "patient nodding",
      "a plan quietly kept",
      "a shared burrow at day's end",
    ],
    tone: "companionable, patient, and quietly funny",
    exampleOpener:
      "The mice had only just called their meeting to order when a rooster let himself in, certain he had something important to add.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-121-wolves-climb-on-top-of-one",
    label: "The Wolves' Wobbly Tower",
    atuNumber: "ATU 121",
    category: "Animal Tales",
    emoji: "🐺",
    tagline: "A basket just out of reach, and a tower of wolves getting wobblier by the minute.",
    beats: [
      "A pack of wolves spot a basket of ripe apples hanging from a high branch",
      "The biggest wolf plants his paws firmly and invites the others to climb up one by one",
      "Wolf after wolf clambers onto the last one's shoulders, the tower swaying higher with each addition",
      "Just as the top wolf stretches for the basket, the bottom wolf shifts to scratch an itch, and the whole tower tips gently into a soft snowbank",
      "They all land in a heap of laughing fur, more amused than annoyed, and decide a low branch will do just as well",
      "They share the apples they can reach and curl up together in the snow's quiet hush to sleep",
    ],
    signatureElements: [
      "a tempting basket just out of reach",
      "a wobbling tower of wolves",
      "one ill-timed itch",
      "a soft landing",
      "apples shared at the end",
    ],
    tone: "silly, teetering, and warmly forgiving",
    exampleOpener:
      "Nobody remembers whose idea the tower was, only that it seemed perfectly sensible at the time.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-122e-wait-for-the-fat-goat",
    label: "The Fox Who Waited for the Fat Goat",
    atuNumber: "ATU 122E",
    category: "Animal Tales",
    emoji: "🐐",
    tagline: "A clever promise of something better later, and a whole afternoon spent waiting for it.",
    beats: [
      "A fox catches a thin young goat wandering near the meadow's edge",
      "The goat points out that she's barely a mouthful and promises her much fatter cousin will pass by soon",
      "The fox, tempted by the idea of a grander meal, lets the thin goat trot away to wait for the better one",
      "He waits by the path all afternoon, watching every rustle hopefully, but no fat goat ever comes",
      "As evening falls, a hedgehog neighbor notices his empty basket and shares a bit of her own supper with him",
      "The fox settles by her fire, grateful for what he has instead of what he waited for, and falls asleep warm and full",
    ],
    signatureElements: [
      "a clever promise of something better later",
      "a long hopeful wait",
      "an empty path at dusk",
      "a neighbor's shared supper",
      "a lesson learned gently",
    ],
    tone: "wry, patient, and gently instructive",
    exampleOpener:
      "The fox had always believed that the best things came to those who waited, and today he intended to test that theory.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-152-the-plowman-and-the-animals",
    label: "The Plowman's Fair Day",
    atuNumber: "ATU 152",
    category: "Animal Tales",
    emoji: "🌾",
    tagline: "A big field, a long day, and a fair way to share out the work.",
    beats: [
      "A plowman sets out at dawn with his ox, his dog, and his rooster to get the big field turned before the rains come",
      "The ox pulls the heavy plow, the dog trots ahead scouting the smoothest ground, and the rooster crows to mark each turn of the row",
      "By midday the ox tires and grumbles that the work isn't shared fairly among them",
      "The plowman stops, listens, and rearranges the day so each animal takes a turn resting while the others carry on",
      "The field is finished just as the sun dips low, every furrow straight and every animal fairly worn out",
      "They share a warm meal together in the barn and settle into the hay, listening to the first rain patter on the roof as they drift to sleep",
    ],
    signatureElements: [
      "a big field to plow before the rain",
      "animal helpers with different jobs",
      "a fair rearranging of the work",
      "a finished field at sunset",
      "a shared meal in the barn",
    ],
    tone: "steady, cooperative, and satisfied",
    exampleOpener:
      "The plowman always said a field this size needed more than one pair of hands, or hooves, or paws.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-158-the-wild-animals-on-the-sleigh",
    label: "Everyone on the Sleigh",
    atuNumber: "ATU 158",
    category: "Animal Tales",
    emoji: "🛷",
    tagline: "A fox with room for one more, and a sleigh piled higher and wobblier by the mile.",
    beats: [
      "The fox finds an old sleigh abandoned in the snow and declares it will carry everyone to the winter feast",
      "She invites the wolf, then the bear, then the rabbit and the hedgehog, counting each one aboard with a cheerful rhyme",
      "The sleigh runners creak louder with every new passenger, and the pile of animals grows higher and wobblier",
      "Just as the fox squeezes on last, the heaviest runner gives a great creak and tips them all gently into a snowdrift",
      "Nobody minds much, since the drift is soft, and they dust each other off with plenty of laughing",
      "They walk the rest of the way together, pulling the empty sleigh behind them, and arrive at the feast just in time to eat, then curl up by the fire to sleep",
    ],
    signatureElements: [
      "an old sleigh in the snow",
      "a rhyme counting each animal aboard",
      "creaking runners",
      "a soft tumble into a drift",
      "a walk finished together",
    ],
    tone: "jolly, crowded, and good-natured",
    exampleOpener:
      "The sleigh had room for exactly one animal, which did not stop the fox from inviting eleven.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-162-the-master-looks-more-closely-than",
    label: "The Master's Second Look",
    atuNumber: "ATU 162",
    category: "Animal Tales",
    emoji: "👀",
    tagline: "A quick glance that misses everything, and a closer look that catches it all.",
    beats: [
      "A farmhand is sent to check the henhouse and reports back that everything looks fine",
      "The master strolls out himself and notices a loose board and a hen nesting somewhere she shouldn't be",
      "The farmhand admits he walked right past both without truly looking",
      "Together they fix the board and move the nest somewhere cozier and safer",
      "The master explains that a good look takes only a moment longer than a quick glance, and the farmhand takes the lesson to heart",
      "That evening the farmhand checks every corner twice out of habit, and the whole farm settles down peacefully for the night",
    ],
    signatureElements: [
      "a quick glance that misses something",
      "a second, closer look",
      "a loose board and a hidden nest",
      "a lesson passed on kindly",
      "a peaceful farm at nightfall",
    ],
    tone: "patient, observant, and quietly instructive",
    exampleOpener:
      "The farmhand had checked the henhouse a thousand times, or so he told himself, without ever really checking.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-185-the-nightcap-dealer-and-the-monkeys",
    label: "The Cap Seller and the Monkeys",
    atuNumber: "ATU 185",
    category: "Animal Tales",
    emoji: "🐒",
    tagline: "A whole stack of caps gone missing, and a tree full of copycats to blame.",
    beats: [
      "A traveling cap seller naps under a shady tree with his tall stack of nightcaps balanced on his head",
      "He wakes to find the stack gone and looks up to see a whole tree of monkeys wearing his caps, one on each head",
      "He waves his arms and shouts for the caps back, but the monkeys simply wave their arms and shout right back at him",
      "Frustrated, he pulls off his own last cap and flings it to the ground without thinking",
      "Every monkey copies him at once, pulling off their caps and dropping them all around his feet",
      "He gathers the caps back into his stack, thanks the monkeys for the game, and settles under the tree to rest before the road home",
    ],
    signatureElements: [
      "a tall stack of nightcaps",
      "a tree full of copycat monkeys",
      "matched shouts and matched gestures",
      "one cap thrown down in frustration",
      "a stack gathered back up",
    ],
    tone: "playful, exasperated-then-delighted, and warm",
    exampleOpener:
      "The cap seller had napped under that very tree a hundred times before, and never once counted the branches above him.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-202-the-two-stubborn-goats",
    label: "The Two Goats on the Bridge",
    atuNumber: "ATU 202",
    category: "Animal Tales",
    emoji: "🌉",
    tagline: "Two goats, one narrow bridge, and neither one willing to step back.",
    beats: [
      "Two goats start across a narrow log bridge from opposite ends at exactly the same moment",
      "They meet in the middle, each certain the other should be the one to back up",
      "Both plant their hooves and refuse to budge, the bridge creaking beneath their stubbornness",
      "A wise old heron watching from the stream below suggests one of them simply kneel down so the other can step gently over",
      "The goats look at each other, laugh at how simple the answer was, and one dips low so her friend can hop across",
      "They finish crossing together on the same side, munching clover side by side until the evening star comes out",
    ],
    signatureElements: [
      "a narrow log bridge",
      "two equally stubborn goats",
      "a creaking standoff",
      "a wise suggestion from below",
      "a simple solution found together",
    ],
    tone: "stubborn, funny, and warmly resolved",
    exampleOpener:
      "The bridge was only wide enough for one goat at a time, a fact both goats discovered at the exact same moment.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-217-the-cat-with-the-candle",
    label: "The Cat Who Held the Candle",
    atuNumber: "ATU 217",
    category: "Animal Tales",
    emoji: "🕯️",
    tagline: "A candle held perfectly still, and a game of nerves nobody really loses.",
    beats: [
      "A cat offers to hold a candle very still so the mice can see to sort their winter stores by its light",
      "The mice tiptoe closer and closer, testing whether the cat is truly as still as she claims",
      "The cat holds perfectly steady, not twitching a whisker, even as a bold young mouse creeps right up to her paw",
      "A little breeze flutters the candle flame, and the cat's whiskers twitch at last, giving the game away with a small laugh",
      "The mice laugh too, unbothered, since no one was ever really in danger, and they finish sorting their stores by the candle's glow",
      "Candle burned low and stores put away, cat and mice settle down together in the warm, flickering dark to sleep",
    ],
    signatureElements: [
      "a candle held very still",
      "mice testing bravery step by step",
      "a twitching whisker giving it away",
      "a shared laugh",
      "a warm flickering dark",
    ],
    tone: "hushed, teasing, and safely resolved",
    exampleOpener:
      "The cat had never held so still in her life, and the mice were determined to find her limit.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-116-the-bear-on-the-hay-wagon",
    label: "The Bear on the Hay-Wagon",
    atuNumber: "ATU 116",
    category: "Animal Tales",
    emoji: "🐻",
    tagline: "A tired bear, a slow-rolling hay-wagon, and a ride home nobody planned on.",
    beats: [
      "A bear ambles out of the woods just as a farmer's hay-wagon creaks by, piled high and fragrant",
      "Too tired to walk another step, the bear clambers up onto the soft hay and settles in like a passenger of importance",
      "The farmer, busy with the reins up front, never notices the extra weight riding along behind him",
      "Villagers along the road point and laugh at the sight of a bear riding home in style",
      "At the farmyard gate the farmer finally turns around, startled, but the bear only yawns and looks entirely at ease",
      "The farmer decides a nap-loving bear is no trouble at all, and lets him doze in the hay until the stars come out",
    ],
    signatureElements: [
      "a hay-wagon piled high",
      "a bear riding along uninvited",
      "an oblivious driver up front",
      "amused onlookers along the road",
      "a dignified, sleepy passenger",
    ],
    tone: "silly, easygoing, and warmly absurd",
    exampleOpener:
      "The hay-wagon looked so comfortable that the bear simply couldn't walk past it.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-122c-the-sheep-persuades-the-wolf-to",
    label: "The Kid Who Asked the Wolf to Sing",
    atuNumber: "ATU 122C",
    category: "Animal Tales",
    emoji: "🐐",
    tagline: "A wandering kid, a request for one last song, and a wolf too vain to refuse.",
    beats: [
      "A little kid wanders too far from the flock and a wolf catches up to her at last",
      "Seeing there is no outrunning him, she politely asks for one small favor before anything else happens",
      "She asks the wolf to play her a tune on his pipe so she might dance to it first",
      "Flattered, the wolf puts down his business and takes up his pipe, playing proudly while she dances",
      "The music carries to the sheepdogs guarding the flock, who come bounding up and chase the wolf off into the trees",
      "The kid trots safely back to the flock, and curls up close to her mother as the last notes fade into the quiet evening",
    ],
    signatureElements: [
      "a kid caught far from the flock",
      "a request for one last song",
      "a wolf too proud of his own music",
      "watchful dogs drawn by the sound",
      "a safe return to the flock",
    ],
    tone: "clever, musical, and quietly triumphant",
    exampleOpener:
      "The kid had never learned to outrun a wolf, but she had learned that a good request rarely hurts.",
    source: {
      kind: "edition",
      work: "Aesop's Fables; a new translation",
      taleTitle: "The Kid and the Wolf",
      gutenbergId: 11339,
    },
  },
  {
    id: "atu-135-the-mouse-makes-a-boat-of",
    label: "The Mouse's Bread-Crust Boat",
    atuNumber: "ATU 135*",
    category: "Animal Tales",
    emoji: "🐭",
    tagline: "A crumb of crust, a hollowed-out hull, and a little sailor bound downstream.",
    beats: [
      "A mouse finds a stale crust of bread washed up at the edge of a stream",
      "She nibbles the middle out carefully until it curves into the shape of a tiny boat",
      "She sets her hollow crust afloat and hops aboard, using a twig for a paddle",
      "The current catches her little vessel and carries her gently along past reeds and pebbles",
      "She waves to a family of ducks who paddle alongside, curious about her strange craft",
      "As the stream slows and the evening cools, she steers to a mossy bank, ties up with a blade of grass, and falls asleep inside her crust-boat",
    ],
    signatureElements: [
      "a hollowed bread-crust hull",
      "a twig for a paddle",
      "a gentle downstream drift",
      "curious river neighbors",
      "a moored boat for the night",
    ],
    tone: "whimsical, floaty, and quietly adventurous",
    exampleOpener:
      "The crust was too stale to eat, which was exactly why the mouse decided to sail it instead.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-156a-the-faith-of-the-lion",
    label: "The Lion Who Remembered a Kindness",
    atuNumber: "ATU 156A",
    category: "Animal Tales",
    emoji: "🦁",
    tagline: "A thorn pulled free in the forest, and a debt a lion never once forgot.",
    beats: [
      "A lion limping through the forest with a thorn in his paw comes upon a shepherd and holds the paw out, asking for help",
      "The shepherd looks closely, finds the thorn, and draws it out with steady, careful hands",
      "Relieved, the lion bounds off into the trees, and the two go their separate ways for a long while",
      "Later, through no fault of his own, the shepherd finds himself brought before a king to answer for something he did not do",
      "As part of his test he is led out to face a lion kept nearby, and it turns out to be the very same lion, who steps forward gently and rests a paw on the shepherd's lap instead of anything else",
      "The king, seeing the old kindness remembered, sends the lion back to his forest and the shepherd home to his flock, and both settle down that night under the same calm sky",
    ],
    signatureElements: [
      "a thorn pulled from a great paw",
      "a debt of gratitude carried quietly for years",
      "an unjust accusation",
      "a lion who recognizes an old friend",
      "a fair ruler who listens to the whole story",
    ],
    tone: "noble, patient, and warmly resolved",
    exampleOpener:
      "The shepherd had pulled a thorn from a paw once, years ago, and thought nothing more of it until the day it mattered most.",
    source: {
      kind: "edition",
      work: "Three hundred Aesop's fables",
      taleTitle: "The Lion and the Shepherd",
      gutenbergId: 21,
    },
  },
  {
    id: "atu-159-straw-bull",
    label: "The Straw Bull in the Field",
    atuNumber: "ATU 159",
    category: "Animal Tales",
    emoji: "🐂",
    tagline: "A bull of straw and tar, standing perfectly still, and a lesson about sticking too close.",
    beats: [
      "A farmer builds a life-sized bull out of bundled straw and sets it to stand in the middle of a field",
      "A curious bear wanders by and greets the strange, silent newcomer, but gets no answer at all",
      "Offended by the silence, the bear gives the straw bull a firm poke and finds his paw stuck fast in the tarry coat beneath the straw",
      "The more he tugs and wriggles to free himself, the more thoroughly stuck he becomes",
      "The farmer ambles over, gently peels the bear loose, and has a good laugh that the bear ends up sharing too",
      "Cleaned off and a little sticky still, the bear settles into the soft grass nearby and drifts off to sleep in the last of the sun",
    ],
    signatureElements: [
      "a straw bull standing eerily still",
      "an offended, curious visitor",
      "a poke that turns into a proper stick",
      "growing frustration met with patience",
      "a good-natured release",
    ],
    tone: "comic, sticky, and good-humored",
    exampleOpener:
      "The straw bull never said a word, which the bear found more insulting than he expected.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-163-the-singing-wolf",
    label: "The Wolf Who Would Rather Sing",
    atuNumber: "ATU 163",
    category: "Animal Tales",
    emoji: "🎶",
    tagline: "A wolf who loves his own voice more than any errand, and neighbors who use that against him kindly.",
    beats: [
      "A wolf discovers he has a real love of singing and takes every chance to burst into song",
      "He agrees to help guard a flock of sheep, promising to bark the alarm if trouble ever came near",
      "Whenever anything the least bit interesting happens, he forgets the barking entirely and breaks into a long, happy song instead",
      "The shepherd, noticing the pattern, starts leaving treats out near a favorite singing rock instead of relying on him to guard anything",
      "The wolf happily trades guard duty for a standing invitation to sing every evening, and everyone gets exactly what they wanted",
      "As dusk falls he sings one last, soft, low song, and even he grows drowsy partway through the final verse",
    ],
    signatureElements: [
      "an irresistible urge to sing",
      "forgotten duties whenever a song comes on",
      "a shepherd who works around it kindly",
      "a favorite singing rock",
      "a soft last verse trailing into sleep",
    ],
    tone: "musical, forgiving, and gently comic",
    exampleOpener:
      "The wolf had been hired to guard the flock, but nobody had warned him how good the evening air was for singing.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-186-the-monkey-and-the-nut",
    label: "The Monkey and the Stubborn Nut",
    atuNumber: "ATU 186",
    category: "Animal Tales",
    emoji: "🥥",
    tagline: "A shell too hard for force, and a monkey who finally tries patience instead.",
    beats: [
      "A monkey finds a large, hard-shelled nut and is determined to crack it open right away",
      "She bangs it against a rock, then a branch, then another rock, without so much as a crack to show for it",
      "Frustrated, she tries chewing, squeezing, and even hurling it, and the nut stays stubbornly whole",
      "An old tortoise passing by suggests she simply leave it in the warm sun and let time do the work instead",
      "The monkey sets the nut down doubtfully, but morning sun and a little patience finally coax the shell to loosen on its own",
      "She cracks it open at last without any fuss at all, shares the sweet inside with the tortoise, and both settle down for a nap in the same patch of sun",
    ],
    signatureElements: [
      "a stubbornly hard-shelled nut",
      "increasingly determined attempts",
      "a wise, unhurried neighbor",
      "patience where force had failed",
      "a shared reward at the end",
    ],
    tone: "patient, gently instructive, and satisfying",
    exampleOpener:
      "The nut was, without question, the hardest thing the monkey had ever tried to open.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-214-the-donkey-tries-to-caress-his",
    label: "The Donkey Who Wanted to Be a Lapdog",
    atuNumber: "ATU 214",
    category: "Animal Tales",
    emoji: "🫏",
    tagline: "A hardworking donkey, a pampered little dog, and a clumsy try at trading places.",
    beats: [
      "A donkey works hard all day grinding corn and hauling wood, while a small lapdog in the same house is petted and given treats for doing nothing at all",
      "Watching the lapdog leap about and be fussed over each evening, the donkey decides he would like some of that same affection",
      "He breaks loose from the stable and trots into the house, trying to prance and nuzzle his master the way the little dog does",
      "His big hooves upset the table and rattle the dishes, and the household springs up in alarm at the commotion",
      "The servants gently but firmly walk him back out to the stable before anyone or anything comes to real harm",
      "Once he is settled back on his fresh straw, his master comes by with an extra scoop of oats and a kind word about staying just as he is, and the donkey, comforted, drifts off to sleep",
    ],
    signatureElements: [
      "a hardworking donkey and a pampered lapdog",
      "envy of an easier, cozier life",
      "a clumsy attempt at being cuddly",
      "an upset table and startled household",
      "a gentle return to the stable",
    ],
    tone: "wry, forgiving, and warmly settled",
    exampleOpener:
      "The donkey had watched the little dog get petted every single evening, and he thought, quite reasonably, that he deserved a turn.",
    source: {
      kind: "edition",
      work: "Three hundred Aesop's fables",
      taleTitle: "The Ass and the Lapdog",
      gutenbergId: 21,
    },
  },
  {
    id: "atu-120-the-first-to-see-the-sunrise",
    label: "Who Sees the Sunrise First?",
    atuNumber: "ATU 120",
    category: "Animal Tales",
    emoji: "🌄",
    tagline: "A meadow full of animals facing east, and one who thinks to look somewhere else entirely.",
    beats: [
      "The animals of the meadow argue over who will be the very first to see the sun come up",
      "Everyone lines up facing east on the hilltop, straining their eyes at the dark horizon",
      "A small snail, too slow to find a spot on the hill, looks straight up instead of ahead",
      "She spots the first pink light touching the underside of a high cloud before anyone else sees the sun itself",
      "The others admit she saw the morning first, just not the part they expected",
      "Everyone settles back down into the dewy grass together to watch the rest of the sunrise arrive slow and golden, and drowse off in its warmth",
    ],
    signatureElements: [
      "a hillside crowded with hopeful faces",
      "everyone looking the same direction",
      "one small animal looking up instead",
      "a cloud lit pink before the sun appears",
      "a shared, unhurried sunrise",
    ],
    tone: "companionable, curious, and softly triumphant",
    exampleOpener:
      "Every animal on the hill was certain they had the very best spot for seeing the sun come up first.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-122d-caught-animal-promises-captor-better-prey",
    label: "The Promise of a Fatter Supper",
    atuNumber: "ATU 122D",
    category: "Animal Tales",
    emoji: "🐑",
    tagline: "A hungry captor, a very convincing promise, and a meal that is never quite over the hill.",
    beats: [
      "A wolf catches a young goat who has wandered a little too far from the flock",
      "Before anything else can happen, the goat says she knows where a much plumper, tastier goat is grazing just past the ridge",
      "The wolf, mouth already watering at the thought, agrees to let her lead the way instead of settling for her",
      "She trots ahead, describing the imaginary goat in more and more delicious detail, leading him in a long loop",
      "By the time they reach the ridge there is no plumper goat, only her own flock's bell ringing for evening, and she slips safely inside the fence",
      "The wolf gives up the chase, grumbling about being outsmarted, and beds down under a bush to sleep off his disappointment",
    ],
    signatureElements: [
      "a captor easily tempted by 'better'",
      "a promise of something tastier just ahead",
      "a long, winding walk instead of a quick meal",
      "a safe fence reached just in time",
    ],
    tone: "sly, breathless, and quietly satisfying",
    exampleOpener:
      "The goat had exactly one idea the moment the wolf's paw came down, and it was a very good one.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-135a-the-fox-stumbles-over-a-violin",
    label: "The Fox and the Singing Box",
    atuNumber: "ATU 135A*",
    category: "Animal Tales",
    emoji: "🎻",
    tagline: "A dark barn, an unexpected twang, and a fox convinced the night has come alive.",
    beats: [
      "A fox slips into a quiet barn after dark, hoping to find something good to nibble",
      "In the pitch black he trips over an old violin left leaning against a hay bale",
      "It lets out a deep, wobbling twang, and the fox leaps straight up in fright, sure some creature has spoken",
      "He circles it cautiously, nudges it again, and hears the same strange voice answer back",
      "Slowly he realizes it is only a box that sings when it is touched, and starts nudging it on purpose just to hear the sound",
      "He curls up right beside it in the hay, giving it one last gentle bump, and falls asleep to its last humming note",
    ],
    signatureElements: [
      "pitch-dark barn rafters",
      "an unexpected musical twang",
      "a startled, leaping fox",
      "curiosity replacing fright",
      "a hay bale bed beside the culprit",
    ],
    tone: "jumpy, funny, and gently curious",
    exampleOpener:
      "The barn was so dark that the fox trusted his paws more than his eyes, which was exactly the trouble.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-157b-the-sparrow-and-his-sons",
    label: "The Sparrow's Warnings",
    atuNumber: "ATU 157B",
    category: "Animal Tales",
    emoji: "🐦",
    tagline: "A father's careful list of dangers, and sons who mostly, but not perfectly, remember it.",
    beats: [
      "An old sparrow gathers his sons on a branch before their first flights alone",
      "He teaches them to watch for swooping shadows, for shiny loops of string, and for cats that sit too still",
      "Most of the sons repeat the lessons back perfectly and fly off with careful eyes",
      "One small son gets distracted by a bright beetle and forgets to check the branch below him before landing",
      "He lands, startles a lazy cat awake, and flutters off in a hurry, more surprised than anything",
      "That evening the whole family gathers back on the home branch, retelling the story with a laugh, and settles in wing to wing for the night",
    ],
    signatureElements: [
      "a father's list of warnings",
      "careful, listening sons",
      "one distracted, forgetful son",
      "a startled but harmless close call",
      "a family retelling the tale together",
    ],
    tone: "instructive, warm, and forgiving",
    exampleOpener:
      "The old sparrow had three warnings for his sons, and he meant to see all three land properly.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-159c-the-lion-and-the-statue",
    label: "The Lion and the Carved Statue",
    atuNumber: "ATU 159C",
    category: "Animal Tales",
    emoji: "🦁",
    tagline: "Two friends arguing over who is stronger, and a carving that only tells one side of it.",
    beats: [
      "A man and a lion walk together through the forest, each boasting a little about who is truly stronger",
      "They come upon an old stone carving showing a man standing tall with his foot upon a lion",
      "The man points to it proudly, as if the matter is now settled for good",
      "The lion looks it over calmly and points out that a man carved this particular stone",
      "He adds that if lions carved statues, the man would be the one shown underneath instead",
      "The two of them laugh at how a single carving can only ever tell one side of a story, and settle down together by the path to rest as the forest goes quiet",
    ],
    signatureElements: [
      "two friendly boasters comparing strength",
      "a stone carving with only one point of view",
      "a calm, clever counterpoint",
      "a story that depends on who tells it",
      "a laugh shared instead of a winner declared",
    ],
    tone: "wry, thoughtful, and good-humored",
    exampleOpener:
      "The carving looked very sure of itself, which was exactly what the lion wanted to talk about.",
    source: {
      kind: "edition",
      work: "Three hundred Aesop's fables",
      taleTitle: "The Man and the Lion",
      gutenbergId: 21,
    },
  },
  {
    id: "atu-183-the-hare-promises-to-dance",
    label: "The Hare Who Promised to Dance",
    atuNumber: "ATU 183*",
    category: "Animal Tales",
    emoji: "🐇",
    tagline: "A grand promise, a gathered crowd, and a dancer who needs a little coaxing to actually begin.",
    beats: [
      "The hare boasts to the whole meadow that he will dance at the gathering tonight, better than anyone has ever seen",
      "Word spreads quickly, and every animal finds a good spot to sit and wait under the lanterns of fireflies",
      "The evening arrives, and there is no hare anywhere to be found, only an empty circle of flattened grass",
      "A patient tortoise finally finds him hiding behind a log, suddenly shy now that everyone is actually watching",
      "She walks him back gently, no teasing in her voice, and reminds him that a small dance counts just as much as a grand one",
      "He does a few hopping little steps to everyone's delight, then the whole meadow settles into the grass together and drifts off under the fireflies",
    ],
    signatureElements: [
      "a grand promise made too loudly",
      "a whole meadow gathering to watch",
      "an empty circle where a dancer should be",
      "a gentle coaxing instead of a scolding",
      "a small dance that turns out to be enough",
    ],
    tone: "sheepish, kind, and warmly resolved",
    exampleOpener:
      "The hare had announced his dance to absolutely everyone, which was, in hindsight, the hardest part.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-200a-the-dog-loses-a-certificate",
    label: "The Dog's Missing Paper",
    atuNumber: "ATU 200A",
    category: "Animal Tales",
    emoji: "📜",
    tagline: "An important paper gone missing, and a search that turns into something better than finding it.",
    beats: [
      "Long ago, the dog is given an important paper that names him keeper of the house and yard",
      "On his way home he sets it down for just a moment to chase a butterfly, and when he turns back it has blown away",
      "He searches every hedge and haystack, asking every creature he meets if they have seen it",
      "The cat, the rooster, and the mouse all help him look, checking corners he never would have thought of",
      "They never do find the paper, but the dog realizes the whole yard already treats him as keeper anyway, paper or not",
      "That is why, it's said, a dog still sniffs every corner of the yard each evening before curling up on the porch to sleep",
    ],
    signatureElements: [
      "an important paper carried carelessly",
      "a sudden gust that carries it off",
      "neighbors who help without being asked",
      "trust that was never really about the paper",
      "a nightly sniffing habit explained",
    ],
    tone: "wistful, communal, and quietly reassuring",
    exampleOpener:
      "The paper was small enough to fit under one paw, which was exactly how the dog nearly lost it.",
    source: { kind: "knowledge" },
  },
  {
    id: "atu-214b-the-donkey-in-lion-s-skin",
    label: "The Donkey in the Lion's Coat",
    atuNumber: "ATU 214B",
    category: "Animal Tales",
    emoji: "🦁",
    tagline: "A borrowed lion's coat, a great deal of swagger, and one small bray that gives it all away.",
    beats: [
      "A donkey finds an old lion's skin draped over a fence and decides to try it on for fun",
      "Dressed up grandly, he struts through the farmyard, and every animal who sees him hurries out of the way, sure a real lion has come",
      "Delighted by how well the trick is working, he cannot help letting out one triumphant bray of joy",
      "A fox nearby, who has heard that particular bray a hundred times before, calls out that she'd know that voice anywhere",
      "The donkey pulls off the skin, laughing at himself along with her, no sting in it at all",
      "The two of them fold the old skin up together and settle down by the fence post, sharing the joke quietly until the farmyard falls asleep around them",
    ],
    signatureElements: [
      "a borrowed lion's skin",
      "a farmyard scattering in surprise",
      "a triumphant bray at just the wrong moment",
      "a friend who recognizes the voice underneath",
      "a shared laugh instead of a scolding",
    ],
    tone: "playful, self-aware, and easily forgiven",
    exampleOpener:
      "The lion's skin was a little big for him, but the donkey thought it draped rather magnificently anyway.",
    source: {
      kind: "edition",
      work: "Aesop's Fables; a new translation",
      taleTitle: "The Ass in the Lion's Skin",
      gutenbergId: 11339,
    },
  },
];
