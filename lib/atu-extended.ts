/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by `npm run catalogue:build` from the ATU knowledge base's
 * license-filtered export. Every entry here survived, in order:
 *
 *   1. the stem screen in `lib/safety.ts` applied to its canonical title;
 *   2. having any motif data at all (no data means no way to check, which is
 *      treated as a rejection, not a pass);
 *   3. carrying no motif with a knowledge-base content advisory;
 *   4. the same stem screen applied to every one of its motif labels.
 *
 * ...and then, decisively, a read-through: every entry here has a `"safe"`
 * verdict in `data/atu-blurbs.reviewed.json`, and its `blurb` was written
 * during that read. Roughly a quarter of what the screens produced was cut at
 * that stage, each with its reason recorded in that file.
 *
 * Titles are the canonical scholarly titles from the knowledge base, carried
 * verbatim apart from stripped `(previously ...)` revision notes — unlike the
 * hand-authored tiers, nothing here is retitled for children.
 *
 * What keeps a story from these types gentle is still `SYSTEM_PROMPT` in
 * `lib/prompt.ts`, which applies to every tale regardless of type.
 */

export interface AtuExtendedEntry {
  id: string;
  atu: string;
  title: string;
  emoji: string;
  blurb?: string;
}

/** 146 generated tale types, in ATU order. */
export const ATU_EXTENDED: readonly AtuExtendedEntry[] = [
  { id: "atu-2b-basket-tied-to-wolf-s-tail", atu: "2B", title: "Basket tied to Wolf's Tail", emoji: "🦊", blurb: "A basket, a wolf's tail, and a plan that unravels as fast as it was tied." },
  { id: "atu-5-biting-the-tree-root", atu: "5", title: "Biting the Tree Root", emoji: "🐭", blurb: "A small creature bites at a root and buys itself just enough time." },
  { id: "atu-6-animal-captor-persuaded-to-talk", atu: "6", title: "Animal Captor Persuaded to Talk", emoji: "🦁", blurb: "Caught fast, and talked free — the captor is coaxed into opening his mouth." },
  { id: "atu-6-animal-captor-talks-with-booty-in", atu: "6*", title: "Animal Captor Talks with Booty in His Mouth", emoji: "🐦", blurb: "A captor who cannot resist answering, and loses what he was holding." },
  { id: "atu-7-the-three-tree-names", atu: "7", title: "The Three Tree Names", emoji: "🐢", blurb: "Three trees, three names, and a riddle answered one branch at a time." },
  { id: "atu-20c-the-animals-flee-in-fear-of", atu: "20C", title: "The Animals Flee in Fear of the End of the World", emoji: "🐭", blurb: "The sky seems to be falling, so the animals set off in a worried, hurrying line." },
  { id: "atu-31-fox-climbs-from-the-pit-on", atu: "31", title: "Fox Climbs from the Pit on the Wolf's Back", emoji: "🦁", blurb: "A fox and a wolf in a deep pit, and a way up that only one of them sees." },
  { id: "atu-32-the-wolf-descends-into-the-well", atu: "32", title: "The Wolf Descends into the Well in One Bucket and Rescues the Fox in the Other", emoji: "🐢", blurb: "Two buckets in a well: as one goes down the other comes up, and a friend is lifted out." },
  { id: "atu-34-the-wolf-dives-into-the-water", atu: "34", title: "The Wolf Dives into the Water for Reflected Cheese", emoji: "🐻", blurb: "The moon lies white on the water, and a hungry wolf mistakes it for cheese." },
  { id: "atu-34a-the-dog-drops-his-meat-for", atu: "34A", title: "The Dog Drops His Meat for the Reflection", emoji: "🦊", blurb: "A dog with a fine dinner sees another dog below the bridge, and wants that one too." },
  { id: "atu-34c-the-monkey-with-the-lentils", atu: "34C", title: "The Monkey with the Lentils", emoji: "🐺", blurb: "A monkey with a whole handful of lentils drops the lot chasing one." },
  { id: "atu-41-the-wolf-overeats-in-the-cellar", atu: "41", title: "The Wolf Overeats in the Cellar", emoji: "🐭", blurb: "A wolf who ate his fill in a cellar and cannot fit back out through the gap." },
  { id: "atu-43-the-bear-builds-a-house-of", atu: "43", title: "The Bear Builds a House of Wood; the Fox, of Ice", emoji: "🐢", blurb: "A house of wood and a house of ice, and only one of them still standing in spring." },
  { id: "atu-50a-fox-sees-all-tracks-going-into", atu: "50A", title: "Fox Sees all Tracks going into Lion's Den but none coming out", emoji: "🦁", blurb: "Every footprint leads to the lion's door, and none lead away — so the fox stays outside." },
  { id: "atu-51a-the-fox-has-the-sniffles", atu: "51A", title: "The Fox Has the Sniffles", emoji: "🐭", blurb: "The fox has a cold and a very good excuse ready for everyone." },
  { id: "atu-53-the-fox-investigates-a-roar", atu: "53*", title: "The Fox Investigates a Roar", emoji: "🐦", blurb: "A great roar in the forest, and a fox brave enough to go and look." },
  { id: "atu-58-the-crocodile-carries-the-jackal", atu: "58", title: "The Crocodile Carries the Jackal", emoji: "🐰", blurb: "A crocodile ferries a jackal across the river, and the crossing is not restful." },
  { id: "atu-63-the-fox-rids-himself-of-fleas", atu: "63", title: "The Fox Rids himself of Fleas", emoji: "🐭", blurb: "A fox lowers himself into the water inch by inch until every last flea has hopped off." },
  { id: "atu-67-the-fox-in-a-swollen-river", atu: "67", title: "The Fox in a Swollen River", emoji: "🐻", blurb: "The river rises, and a fox has to decide what to carry and what to let go." },
  { id: "atu-75-the-help-of-the-weak", atu: "75", title: "The Help of the Weak", emoji: "🦁", blurb: "A lion spares a mouse, and one day the mouse gnaws through the net that holds him." },
  { id: "atu-75a-the-lion-and-the-worm", atu: "75A", title: "The Lion and the Worm", emoji: "🐰", blurb: "The greatest of the animals, undone by the smallest, and gentler for learning it." },
  { id: "atu-78a-animal-tied-up-because-of-a", atu: "78A", title: "Animal Tied Up Because of a Storm", emoji: "🦊", blurb: "An animal roped to a tree for safety in a storm, and glad of it by morning." },
  { id: "atu-81-too-cold-for-hare-to-build", atu: "81", title: "Too Cold for Hare to Build House in Winter", emoji: "🐻", blurb: "It is far too cold to build a house in winter, and far too warm to bother in summer." },
  { id: "atu-87a-the-bear-stands-on-a-heap", atu: "87A*", title: "The Bear Stands on a Heap of Wood", emoji: "🦊", blurb: "A bear stands high on a heap of wood, certain he can see the whole world from there." },
  { id: "atu-111-the-cat-and-the-mouse-converse", atu: "111", title: "The Cat and the Mouse Converse", emoji: "🐻", blurb: "A cat and a mouse hold a long, careful conversation from a very safe distance." },
  { id: "atu-112-the-mice-and-the-rooster", atu: "112**", title: "The Mice and the Rooster", emoji: "🐺", blurb: "The mice hold a meeting, and the rooster has opinions about all of it." },
  { id: "atu-116-the-bear-on-the-hay-wagon", atu: "116", title: "The Bear on the Hay-Wagon", emoji: "🦁", blurb: "A bear climbs onto a loaded hay-wagon and rides home in it like a lord." },
  { id: "atu-120-the-first-to-see-the-sunrise", atu: "120", title: "The First to See the Sunrise", emoji: "🐢", blurb: "Who will see the sunrise first? Everyone looks east except the one who looks up." },
  { id: "atu-121-wolves-climb-on-top-of-one", atu: "121", title: "Wolves Climb on Top of One Another", emoji: "🦊", blurb: "Wolves climbing on one another's shoulders, higher and wobblier and higher." },
  { id: "atu-122c-the-sheep-persuades-the-wolf-to", atu: "122C", title: "The Sheep Persuades the Wolf to Sing", emoji: "🐺", blurb: "A sheep asks the wolf to sing first, and the singing brings the shepherd running." },
  { id: "atu-122d-caught-animal-promises-captor-better-prey", atu: "122D", title: "Caught Animal Promises Captor Better Prey", emoji: "🐰", blurb: "A caught animal promises something better just over the hill, and is believed." },
  { id: "atu-122e-wait-for-the-fat-goat", atu: "122E", title: "Wait for the Fat Goat", emoji: "🐦", blurb: "'Wait for the fat goat,' says the thin one — and the fat one never comes." },
  { id: "atu-135-the-mouse-makes-a-boat-of", atu: "135*", title: "The Mouse Makes a Boat of a Bread-Crust", emoji: "🐢", blurb: "A mouse hollows out a bread-crust and sails away in it down the stream." },
  { id: "atu-135a-the-fox-stumbles-over-a-violin", atu: "135A*", title: "The Fox Stumbles over a Violin", emoji: "🐦", blurb: "A fox in the dark stumbles into a violin and leaps at the sound it makes." },
  { id: "atu-152-the-plowman-and-the-animals", atu: "152", title: "The Plowman and the Animals", emoji: "🦁", blurb: "A plowman and his animals, and a long day's work shared out fairly." },
  { id: "atu-156a-the-faith-of-the-lion", atu: "156A", title: "The Faith of the Lion", emoji: "🐢", blurb: "A lion who keeps his word long after everyone expected him to forget it." },
  { id: "atu-157b-the-sparrow-and-his-sons", atu: "157B", title: "The Sparrow and His Sons", emoji: "🐢", blurb: "A sparrow teaches his sons what to be wary of, and they mostly listen." },
  { id: "atu-158-the-wild-animals-on-the-sleigh", atu: "158", title: "The Wild Animals on the Sleigh", emoji: "🐦", blurb: "All the wild animals pile onto one sleigh, and the runners creak alarmingly." },
  { id: "atu-159-straw-bull", atu: "159", title: "Straw Bull", emoji: "🐭", blurb: "A bull made of straw, standing patiently in a field, gathering visitors." },
  { id: "atu-159c-the-lion-and-the-statue", atu: "159C", title: "The Lion and the Statue", emoji: "🦁", blurb: "A lion looks at a statue of a man standing over a lion, and asks who carved it." },
  { id: "atu-162-the-master-looks-more-closely-than", atu: "162", title: "The Master Looks More Closely than the Farmhand", emoji: "🐭", blurb: "The master notices what the farmhand walked straight past." },
  { id: "atu-163-the-singing-wolf", atu: "163", title: "The Singing Wolf", emoji: "🦁", blurb: "A wolf who would rather sing than do anything else, to everyone's cost but his own." },
  { id: "atu-183-the-hare-promises-to-dance", atu: "183*", title: "The Hare Promises to Dance", emoji: "🦁", blurb: "A hare promises to dance, and everyone gathers, and the hare is nowhere." },
  { id: "atu-185-the-nightcap-dealer-and-the-monkeys", atu: "185", title: "The Nightcap Dealer and the Monkeys", emoji: "🦁", blurb: "A cap-seller naps under a tree and wakes to find monkeys wearing his whole stock." },
  { id: "atu-186-the-monkey-and-the-nut", atu: "186", title: "The Monkey and the Nut", emoji: "🐢", blurb: "A monkey and a nut too hard to open, until patience does what force could not." },
  { id: "atu-200a-the-dog-loses-a-certificate", atu: "200A", title: "The Dog Loses a Certificate", emoji: "🐢", blurb: "A dog loses the paper that proved he was in charge, and has been looking ever since." },
  { id: "atu-202-the-two-stubborn-goats", atu: "202", title: "The Two Stubborn Goats", emoji: "🐦", blurb: "Two stubborn goats meet in the middle of a narrow bridge and neither will step back." },
  { id: "atu-214-the-donkey-tries-to-caress-his", atu: "214", title: "The Donkey Tries to Caress His Master", emoji: "🐭", blurb: "A donkey sees the little dog petted and decides to try being a lapdog too." },
  { id: "atu-214b-the-donkey-in-lion-s-skin", atu: "214B", title: "The Donkey in Lion’s Skin", emoji: "🐭", blurb: "A donkey in a lion's costume, roaring grandly, until he forgets and brays." },
  { id: "atu-217-the-cat-with-the-candle", atu: "217", title: "The Cat with the Candle", emoji: "🦊", blurb: "A cat holding a candle very still, for as long as a cat can manage." },
  { id: "atu-218-a-cat-transformed-to-a-maiden", atu: "218", title: "A Cat Transformed to a Maiden Runs after a Mouse", emoji: "🐻", blurb: "A cat turned into a girl who is perfectly poised until a mouse crosses the floor." },
  { id: "atu-219f-the-dog-and-the-sow-argue", atu: "219F*", title: "The Dog and the Sow Argue", emoji: "🦁", blurb: "A dog and a sow arguing about who has the better life, neither giving an inch." },
  { id: "atu-219h-the-rooster-and-the-pearl", atu: "219H*", title: "The Rooster and the Pearl", emoji: "🐦", blurb: "A rooster finds a pearl in the yard and would much rather have found barley." },
  { id: "atu-220-the-council-of-birds", atu: "220", title: "The Council of Birds", emoji: "🦊", blurb: "All the birds gather in council, and everyone has something to say." },
  { id: "atu-224-bird-wedding", atu: "224", title: "Bird (Beetle) Wedding", emoji: "🐦", blurb: "A wedding for the birds, or the beetles — feathers, music and a very small cake." },
  { id: "atu-230-the-race-of-the-rooster-the", atu: "230*", title: "The Race of the Rooster, the Birch-Cock and the Birch-Hen", emoji: "🐰", blurb: "A race between a rooster and two moor-birds, run over the heather." },
  { id: "atu-232-the-birch-cock-and-the-birds", atu: "232", title: "The Birch-Cock and the Birds of Passage", emoji: "🐻", blurb: "The birch-cock watches the travelling birds go, and decides to stay where he is." },
  { id: "atu-232d-a-crow-drops-pebbles-into-a", atu: "232D*", title: "A Crow Drops Pebbles into a Water Jug", emoji: "🐢", blurb: "A thirsty crow drops pebble after pebble until the water rises to meet her." },
  { id: "atu-233b-the-birds-fly-off-with-the", atu: "233B", title: "The Birds Fly Off with the Net", emoji: "🦊", blurb: "The birds lift the net and fly off with the whole thing, all pulling together." },
  { id: "atu-233d-the-birds-and-the-fowler", atu: "233D", title: "The Birds and the Fowler", emoji: "🐺", blurb: "A fowler sets his net, and the birds are wiser than he counted on." },
  { id: "atu-235-the-jay-borrows-the-cuckoo-s", atu: "235", title: "The Jay Borrows the Cuckoo’s Skin", emoji: "🐦", blurb: "A jay borrows the cuckoo's feathers and finds they do not quite suit him." },
  { id: "atu-235c-a-bird-has-new-clothes-made", atu: "235C*", title: "A Bird Has New Clothes Made", emoji: "🐰", blurb: "A bird has new clothes made and cannot decide which way round to wear them." },
  { id: "atu-236-the-magpie-teaches-the-dove-to", atu: "236", title: "The Magpie Teaches the Dove to Build a Nest", emoji: "🐭", blurb: "The magpie shows the dove how to build a nest, and the dove stops watching too soon." },
  { id: "atu-238-the-dove-and-the-frog-boast", atu: "238", title: "The Dove and the Frog Boast to Each Other", emoji: "🐢", blurb: "A dove and a frog boasting to each other, each sure their home is the finer." },
  { id: "atu-239-the-crow-helps-the-deer-escape", atu: "239", title: "The Crow Helps the Deer Escape from the Snare", emoji: "🦊", blurb: "A crow spots the snare and calls until the deer understands and steps clear." },
  { id: "atu-240-the-dove-trades-her-eggs", atu: "240", title: "The Dove Trades Her Eggs", emoji: "🦁", blurb: "A dove who is not happy with her eggs and goes looking to swap them." },
  { id: "atu-244-the-raven-in-borrowed-feathers", atu: "244", title: "The Raven in Borrowed Feathers", emoji: "🐺", blurb: "A raven in borrowed feathers, splendid until the wind picks up." },
  { id: "atu-253-the-fish-in-the-net", atu: "253", title: "The Fish in the Net", emoji: "🦊", blurb: "A fish who slips the net, and the long story he tells about it afterwards." },
  { id: "atu-275a-the-race-between-hare-and-tortoise", atu: "275A", title: "The Race between Hare and Tortoise", emoji: "🐻", blurb: "The hare is faster and knows it; the tortoise simply does not stop." },
  { id: "atu-276-the-crab-walks-backward-learned-from", atu: "276", title: "The Crab Walks Backward: Learned from His Parents", emoji: "🐻", blurb: "A crab told to walk straight, who points out how his parents taught him." },
  { id: "atu-278a-frogs-decide-not-to-jump-into", atu: "278A*", title: "Frogs Decide Not to Jump into the Well", emoji: "🐦", blurb: "The frogs look down into the well and decide, wisely, not to jump in." },
  { id: "atu-280-the-ant-carries-a-load-as", atu: "280", title: "The Ant Carries a Load as Large as Himself", emoji: "🐺", blurb: "An ant carrying a crumb bigger than herself, all the way home without complaint." },
  { id: "atu-282b-conversation-of-fly-and-flea", atu: "282B*", title: "Conversation of Fly and Flea", emoji: "🐦", blurb: "A fly and a flea in conversation, each with a great deal to say." },
  { id: "atu-298c-the-reeds-bend-before-wind", atu: "298C*", title: "The Reeds Bend before Wind (Flood)", emoji: "🦊", blurb: "The reeds bend low and let the storm pass over them, and are standing after." },
  { id: "atu-299-the-mountain-gives-birth-to-a", atu: "299", title: "The Mountain Gives Birth to a Mouse", emoji: "🐺", blurb: "The whole mountain groans and shakes, and out comes one small mouse." },
  { id: "atu-302c-the-magic-horse", atu: "302C*", title: "The Magic Horse", emoji: "🌙", blurb: "A horse that is more than a horse, waiting patiently for the right rider." },
  { id: "atu-369-the-youth-on-a-quest-for", atu: "369", title: "The Youth on a Quest for His Lost Father", emoji: "🗝️", blurb: "A young traveller goes looking for the father he has never met." },
  { id: "atu-408-the-three-oranges", atu: "408", title: "The Three Oranges", emoji: "🌙", blurb: "Three oranges, and inside each one something more wonderful than the last." },
  { id: "atu-426-the-two-girls-the-bear-and", atu: "426", title: "The Two Girls, the Bear, and the Dwarf", emoji: "✨", blurb: "Two sisters, a gentle bear at the door, and a winter that turns out kindly." },
  { id: "atu-430-the-donkey", atu: "430", title: "The Donkey", emoji: "🪄", blurb: "A donkey who is not what he seems, and a household slowly learning to see it." },
  { id: "atu-442-the-old-woman-in-the-forest", atu: "442", title: "The Old Woman in the Forest", emoji: "🏰", blurb: "An old woman deep in the forest who turns out to have been waiting to help." },
  { id: "atu-465-go-i-know-not-whither-and", atu: "465", title: "Go I Know Not Whither and Fetch I Know Not What", emoji: "🧚", blurb: "Sent to fetch a thing that has no name, and finding it anyway." },
  { id: "atu-476-coal-turns-into-gold", atu: "476", title: "Coal Turns into Gold", emoji: "🧚", blurb: "A lump of coal carried home in a pocket, gold by the time the door closes." },
  { id: "atu-513b-the-land-and-water-ship", atu: "513B", title: "The Land and Water Ship", emoji: "🧚", blurb: "A ship that sails as easily over the fields as over the sea." },
  { id: "atu-515-the-shepherd-boy", atu: "515", title: "The Shepherd Boy", emoji: "🪄", blurb: "A shepherd boy who answers the king's impossible questions with plain good sense." },
  { id: "atu-517-the-boy-who-understands-the-language", atu: "517", title: "The Boy Who Understands the Language of Birds", emoji: "🧚", blurb: "A boy who understands what the birds are saying, and is careful who he tells." },
  { id: "atu-554-the-grateful-animals", atu: "554", title: "The Grateful Animals", emoji: "🌙", blurb: "Animals helped along the way who come back, each in their own time, to help in return." },
  { id: "atu-570a-the-princess-and-the-magic-shell", atu: "570A", title: "The Princess and the Magic Shell", emoji: "🧚", blurb: "A princess and a shell that hums with the sound of the whole sea inside it." },
  { id: "atu-681-relativity-of-time", atu: "681", title: "Relativity of Time", emoji: "🌟", blurb: "A moment that lasts a lifetime, and a lifetime that passes in a moment." },
  { id: "atu-715a-the-wonderful-rooster", atu: "715A", title: "The Wonderful Rooster", emoji: "🗝️", blurb: "A rooster whose crowing turns out to be worth more than anyone guessed." },
  { id: "atu-735-the-rich-man-s-and-the", atu: "735", title: "The Rich Man’s and the Poor Man’s Fortune", emoji: "🪄", blurb: "Two men and two very different fortunes, and what each one does with his." },
  { id: "atu-736-luck-and-wealth", atu: "736", title: "Luck and Wealth", emoji: "🏰", blurb: "Luck and wealth argue over which of them is really running things." },
  { id: "atu-739-the-luck-bringing-animal", atu: "739*", title: "The Luck-Bringing Animal", emoji: "🔮", blurb: "A creature that brings good fortune to whichever house takes it in." },
  { id: "atu-745-hatch-penny", atu: "745", title: "Hatch-Penny", emoji: "✨", blurb: "A single small coin that will not stay lost, however often it is spent." },
  { id: "atu-745a-the-predestined-treasure", atu: "745A", title: "The Predestined Treasure", emoji: "🪄", blurb: "A treasure that has been waiting all along for the one it belongs to." },
  { id: "atu-752b-the-forgotten-wind", atu: "752B", title: "The Forgotten Wind", emoji: "🕯️", blurb: "A wind everyone forgot to thank, and what happens the year it forgets them." },
  { id: "atu-754-lucky-poverty", atu: "754", title: "Lucky Poverty", emoji: "🕊️", blurb: "A poor household that turns out to be the luckiest one in the valley." },
  { id: "atu-756e-charity-rewarded", atu: "756E*", title: "Charity Rewarded", emoji: "🙏", blurb: "A kindness given without expecting anything, and repaid many times over." },
  { id: "atu-759e-the-miller-of-sans-souci", atu: "759E", title: "The Miller of Sans Souci", emoji: "🕯️", blurb: "A miller who will not sell his mill, and a king who learns to respect it." },
  { id: "atu-775-midas-short-sighted-wish", atu: "775", title: "Midas’ Short-sighted Wish", emoji: "🙏", blurb: "Everything he touches turns to gold, including his supper, and he wishes it undone." },
  { id: "atu-779h-star-money", atu: "779H*", title: "Star Money", emoji: "⛪", blurb: "A child who gives away everything she has, and finds stars falling into her apron." },
  { id: "atu-821b-chickens-from-boiled-eggs", atu: "821B", title: "Chickens from Boiled Eggs", emoji: "⛪", blurb: "Boiled eggs will not hatch chickens — a quiet answer to a very silly claim." },
  { id: "atu-842c-floating-coins", atu: "842C*", title: "Floating Coins", emoji: "🌾", blurb: "Coins that float instead of sinking, and the honest hand they float towards." },
  { id: "atu-844-the-luck-bringing-shirt", atu: "844", title: "The Luck-Bringing Shirt", emoji: "🕊️", blurb: "The happiest man in the kingdom, who turns out not to own a shirt at all." },
  { id: "atu-875b-the-clever-girl-and-the-king", atu: "875B", title: "The Clever Girl and the King", emoji: "🧭", blurb: "A girl who answers the king's riddles better than any of his counsellors." },
  { id: "atu-875e-the-unjust-decision-the-oil-press", atu: "875E", title: "The Unjust Decision: The Oil Press Gives Birth to a Foal", emoji: "🛤️", blurb: "An impossible judgement met with an even more impossible question." },
  { id: "atu-887a-precious-stones-in-bricks", atu: "887A*", title: "Precious Stones in Bricks", emoji: "🧵", blurb: "Precious stones hidden in ordinary bricks, and a house worth more than it looks." },
  { id: "atu-910-the-clever-precepts", atu: "910", title: "The Clever Precepts", emoji: "🧵", blurb: "Three pieces of advice, each one useless until the moment it is not." },
  { id: "atu-910e-find-the-treasure-in-our-vineyard", atu: "910E", title: "“Find the Treasure in Our Vineyard!”", emoji: "🛤️", blurb: "'The treasure is in the vineyard' — and the digging is the treasure." },
  { id: "atu-910f-the-quarreling-sons-and-the-bundle", atu: "910F", title: "The Quarreling Sons and the Bundle of Twigs", emoji: "🧵", blurb: "One twig snaps easily; the whole bundle will not break at all." },
  { id: "atu-910g-man-buys-a-pennyworth-of-wit", atu: "910G", title: "Man Buys a Pennyworth of Wit", emoji: "🧭", blurb: "A man pays a penny for a piece of wisdom and gets his money's worth." },
  { id: "atu-915-all-depends-on-how-you-take", atu: "915", title: "All Depends on How You Take It", emoji: "🧵", blurb: "The same news, taken two ways, and how much depends on which you choose." },
  { id: "atu-915a-the-misunderstood-precepts", atu: "915A", title: "The Misunderstood Precepts", emoji: "🧵", blurb: "Instructions followed exactly, and everything going sideways because of it." },
  { id: "atu-920a-the-case-of-the-boiled-eggs", atu: "920A", title: "The Case of the Boiled Eggs", emoji: "🧭", blurb: "Boiled eggs, a long-ago loan, and a case argued into good sense." },
  { id: "atu-920b-the-birds-chosen-by-the-sons", atu: "920B", title: "The Birds Chosen by the Sons", emoji: "🎒", blurb: "Each son chooses a bird, and each choice says more than he meant it to." },
  { id: "atu-920e-the-three-rings", atu: "920E", title: "The Three Rings", emoji: "🧵", blurb: "Three rings, identical to the eye, and a father who will not say which is real." },
  { id: "atu-921a-the-sharing-of-bread-or-money", atu: "921A", title: "The Sharing of Bread Or Money", emoji: "🎒", blurb: "Bread or money, shared out by someone who has thought about it more carefully." },
  { id: "atu-921b-best-friend-worst-enemy", atu: "921B", title: "Best Friend, Worst Enemy", emoji: "🏡", blurb: "Who is the best friend and who the worst enemy — and both answers are the same." },
  { id: "atu-921c-why-hair-of-head-is-gray", atu: "921C", title: "Why Hair of Head is Gray before the Beard", emoji: "🛤️", blurb: "Why the hair on your head goes grey before your beard does." },
  { id: "atu-921c-astronomer-and-doctor-at-farmer-s", atu: "921C*", title: "Astronomer and Doctor at Farmer’s House", emoji: "🧭", blurb: "A stargazer and a doctor argue at a farmer's table, and the farmer wins." },
  { id: "atu-921e-never-heard-before", atu: "921E", title: "Never Heard Before", emoji: "🧭", blurb: "An answer nobody in the hall has ever heard before, and cannot argue with." },
  { id: "atu-922b-the-king-s-face-on-the", atu: "922B", title: "The King’s Face on the Coin", emoji: "🛤️", blurb: "Whose face belongs on the coin, and who gets to decide." },
  { id: "atu-923a-like-wind-in-the-hot-sun", atu: "923A", title: "Like Wind in the Hot Sun", emoji: "🛤️", blurb: "Loved like wind in the hot sun — a strange answer that turns out to be the kindest." },
  { id: "atu-924-discussion-in-sign-language", atu: "924", title: "Discussion in Sign Language", emoji: "🧵", blurb: "A whole discussion held in gestures, with both sides sure they understood." },
  { id: "atu-925-the-most-beautiful-in-the-garden", atu: "925*", title: "The Most Beautiful in the Garden", emoji: "🏡", blurb: "The most beautiful thing in the garden, and how long it takes to notice it." },
  { id: "atu-927a-old-saddle-granted-by-the-king", atu: "927A*", title: "“Old Saddle” Granted by the King", emoji: "🧵", blurb: "An old saddle, granted by the king, worth far more than it appears." },
  { id: "atu-928-planting-for-the-next-generation", atu: "928", title: "Planting for the Next Generation", emoji: "🛤️", blurb: "An old man planting trees he will never sit under, for someone he will never meet." },
  { id: "atu-935-the-prodigal-s-return", atu: "935", title: "The Prodigal’s Return", emoji: "🎒", blurb: "A long way from home, and a door still open at the end of it." },
  { id: "atu-936-the-golden-mountain", atu: "936*", title: "The Golden Mountain", emoji: "🧵", blurb: "A golden mountain, and the long slow climb that is the real story." },
  { id: "atu-940-the-forgiven-debt", atu: "940*", title: "The Forgiven Debt", emoji: "🧵", blurb: "A debt forgiven, and the quiet that comes after it." },
  { id: "atu-944-king-for-a-year", atu: "944", title: "King for a Year", emoji: "🎒", blurb: "King for a single year, and what a wise one does with the time." },
  { id: "atu-944-easy-come-easy-go", atu: "944*", title: "“Easy Come, Easy Go!”", emoji: "🛤️", blurb: "Easy come, easy go — a fortune that arrives and leaves by the same door." },
  { id: "atu-945-luck-and-intelligence", atu: "945", title: "Luck and Intelligence", emoji: "🏡", blurb: "Luck and intelligence set out together to see which gets further." },
  { id: "atu-945a-money-and-fortune", atu: "945A*", title: "Money and Fortune", emoji: "🧵", blurb: "Money and fortune, and the discovery that they are not the same thing." },
  { id: "atu-967-the-man-saved-by-a-spider", atu: "967", title: "The Man Saved by a Spider Web", emoji: "🎒", blurb: "A spider spins across the mouth of the cave, and the searchers pass by." },
  { id: "atu-983-the-dishes-of-the-same-flavor", atu: "983", title: "The Dishes of the Same Flavor", emoji: "🧵", blurb: "Dish after dish, all the same flavour, and a point made without a word." },
  { id: "atu-987-false-magician-exposed-by-clever-girl", atu: "987", title: "False Magician Exposed by Clever Girl", emoji: "🛤️", blurb: "A magician's grand illusion undone by one girl who simply looked closely." },
  { id: "atu-2009-origin-of-chess", atu: "2009", title: "Origin of Chess", emoji: "🎶", blurb: "One grain on the first square, two on the next, and the whole kingdom not enough." },
  { id: "atu-2010a-the-twelve-days-of-christmas", atu: "2010A", title: "The Twelve Days (Gifts) of Christmas", emoji: "🔁", blurb: "Twelve days of gifts, piling up verse by verse until nobody can remember them all." },
  { id: "atu-2010i-how-the-rich-man-paid-his", atu: "2010I", title: "How the Rich Man Paid his Servant", emoji: "🎶", blurb: "A rich man's servant paid in a way that gets funnier the longer it goes on." },
  { id: "atu-2010ia-the-animals-with-peculiar-names", atu: "2010IA", title: "The Animals with Peculiar Names", emoji: "🎶", blurb: "A house full of animals with names so peculiar the tale keeps tripping over them." },
  { id: "atu-2016-wee-wee-woman", atu: "2016", title: "Wee Wee Woman", emoji: "🪜", blurb: "A wee wee woman in a wee wee house, and everything just as small as she is." },
  { id: "atu-2031a-the-esdras-chain-stronger-and-strongest", atu: "2031A", title: "The Esdras Chain: Stronger and Strongest", emoji: "🎶", blurb: "A chain of stronger and strongest, each link topping the one before." },
  { id: "atu-2034-the-mouse-regains-its-tail", atu: "2034", title: "The Mouse Regains its Tail", emoji: "🪜", blurb: "A mouse who loses her tail and has to ask everyone in turn to get it back." },
  { id: "atu-2039-the-horseshoe-nail", atu: "2039", title: "The Horseshoe Nail", emoji: "🪜", blurb: "For want of a nail — the smallest thing at the start of the longest chain." },
  { id: "atu-2301-corn-carried-away-one-grain-at", atu: "2301", title: "Corn Carried Away One Grain at a Time", emoji: "🎶", blurb: "Grain by grain by grain, carried away one at a time, for as long as you like." },
];
