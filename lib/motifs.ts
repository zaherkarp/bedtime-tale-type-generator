/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by `npm run motifs:build` from the ATU knowledge base's
 * license-filtered export. 340 motifs across 137 tale types.
 *
 * A *motif* is the smallest recurring unit folklorists index — "grateful
 * animal helper", "magic object", "the youngest succeeds". These are the real
 * ones recorded against each tale type, filtered to those short and gentle
 * enough to hand a bedtime storyteller.
 *
 * Attribution is required and is shown at `/credits`: motif labels come from
 * Katja Mellmann's TMI transcription (CC BY 4.0) and the tale-type links from
 * j-hagedorn/trilogy (CC BY-SA 4.0). The links are recorded as *inferred*, not
 * asserted — Uther lists motifs per type largely without narrative order — so
 * treat them as "associated with", never as "this is the plot".
 */

export interface Motif {
  /** The Thompson Motif-Index code, e.g. "B350". */
  code: string;
  /** The motif's short label, tidied of trailing punctuation. */
  label: string;
}

/** Motifs by ATU number. Absent for tale types with nothing safe and short. */
export const MOTIFS_BY_ATU: Readonly<Record<string, readonly Motif[]>> = {
  "20C": [
    { code: "J1812", label: "Other sounds misunderstood" },
  ],
  "31": [
    { code: "K652", label: "Fox climbs from pit on wolf's back" },
  ],
  "32": [
    { code: "K651", label: "Wolf descends into well in one bucket and rescues fox in the other" },
  ],
  "41": [
    { code: "K1022.1", label: "Wolf overeats in the cellar (smokehouse). Cannot escape through the entrance hole" },
  ],
  "43": [
    { code: "J741.1", label: "Bear builds house of wood; fox of ice. Fox's house fails him in summer" },
  ],
  "50A": [
    { code: "J644.1", label: "Fox sees all tracks going into lion's den but none coming out. He saves himself" },
  ],
  "53*": [
    { code: "U113", label: "Big voice: little creature" },
  ],
  "57": [
    { code: "A2426.2.6", label: "Cawing of crow" },
  ],
  "58": [
    { code: "B555", label: "Animals serve as bridge across stream" },
    { code: "K579.2", label: "Monkey in danger on bridge of crocodiles pretends that the king has ordered them counted" },
  ],
  "59": [
    { code: "J871", label: "The fox and the sour grapes. Pretends that the grapes he cannot reach are sour" },
    { code: "J2066.1", label: "The hungry fox waits in vain for horse's scrotum (lips) to fall off" },
  ],
  "67": [
    { code: "J873", label: "Fox in swollen river claims to be swimming to distant town" },
  ],
  "70": [
    { code: "A2342.1", label: "Why hare's lip is split" },
  ],
  "75": [
    { code: "B545.1", label: "Deer in net freed by friendly animals, a crow, a mouse and a tortoise" },
    { code: "B437.2", label: "Helpful mouse" },
    { code: "B371.1", label: "Lion spared mouse: mouse grateful. Later releases lion from net" },
    { code: "B363", label: "Animal grateful for rescue from net" },
  ],
  "75A": [
    { code: "B491.4", label: "Helpful worm" },
  ],
  "77": [
    { code: "L461", label: "Stag scorns his legs but is proud of his horns. Caught by his horns in trees" },
  ],
  "78A": [
    { code: "K713.1.1", label: "Animal allows himself to be tied so as to avoid being carried off by storm" },
  ],
  "85": [
    { code: "J512.7", label: "Mouse, bird, and sausage keep house together. When they exchange duties all goes wrong" },
  ],
  "112": [
    { code: "J211.2", label: "Town mouse and country mouse. Latter prefers poverty with safety" },
  ],
  "112**": [
    { code: "J132", label: "Mouse teaches her child to fear quiet cats but not noisy cocks" },
  ],
  "116": [
    { code: "J1762.2", label: "Bear on haywagon (on horse) thought to be the preacher" },
  ],
  "121": [
    { code: "J2133.6", label: "Wolves climb on top of one another to tree: lowest runs away and all fall" },
  ],
  "122C": [
    { code: "K561.2", label: "Sheep persuade the wolf to sing. Dogs are summoned" },
  ],
  "123": [
    { code: "J144", label: "Well-trained kid does not open to wolf" },
    { code: "K1832", label: "Disguise by changing voice" },
    { code: "K1839.1", label: "Wolf puts flour on his paw to disguise himself" },
  ],
  "130": [
    { code: "N776", label: "Light seen from tree lodging place at night leads to adventures" },
    { code: "B296", label: "Animals go a-journeying" },
  ],
  "135*": [
    { code: "B295.1", label: "Mouse makes boat of bread-crust. Takes animals and birds into boat. It capsizes" },
  ],
  "152": [
    { code: "K1013.3", label: "\"Painting\" with a red hot iron" },
    { code: "J2211", label: "Differences in animal nature overlooked" },
  ],
  "156A": [
    { code: "B301.8", label: "Faithful lion follows man who saved him" },
  ],
  "158": [
    { code: "B831", label: "Animals try in vain to repair sleigh. They get unsatisfactory materials" },
  ],
  "159": [
    { code: "B278", label: "Captured animal ransoms self" },
  ],
  "162": [
    { code: "J582.1", label: "Hidden goat discovered by his horn protruding above ground" },
  ],
  "183*": [
    { code: "K571.1", label: "Hare promises to dance if doorway is left free: escapes" },
  ],
  "185": [
    { code: "B786", label: "Monkeys always copy men" },
  ],
  "186": [
    { code: "J369.2", label: "Ape throws away nut because of its bitter rind" },
  ],
  "200": [
    { code: "A2494.1.1", label: "Enmity between cat and mouse" },
  ],
  "200A": [
    { code: "A2471.1", label: "Why dogs look at one another under tail" },
    { code: "A2275.5.5", label: "Dog loses his patent right; seeks it: why dogs look at one another under the tail" },
  ],
  "214": [
    { code: "J2413.1", label: "Ass tries to caress his master like the dog. He is driven off" },
  ],
  "214B": [
    { code: "K362.5", label: "Hare in lion's skin gets meat from lioness" },
    { code: "J951.1", label: "Ass in lion's skin unmasked when he raises his voice" },
  ],
  "218": [
    { code: "J1908.2", label: "Cat transformed to maiden runs after mouse" },
  ],
  "219F*": [
    { code: "J243.1", label: "Dog and hog dispute over their children: worth lies not in speed" },
  ],
  "219H*": [
    { code: "J1061.1", label: "The cock and the pearl: prefers a single corn to a peck of pearls" },
  ],
  "220": [
    { code: "B238.1", label: "Bird council assigns place and work to all. Eagle as judge. (Cf. B232)" },
  ],
  "221": [
    { code: "B242.1.2", label: "Wren king of birds. Wins contest for kingship" },
    { code: "B236.1", label: "Election of king of birds" },
    { code: "B236.0.1", label: "Animal king chosen as result of a contest" },
  ],
  "224": [
    { code: "B282", label: "Bird wedding" },
  ],
  "230*": [
    { code: "A2250.1", label: "Cock and ptarmigan in contest: winner to live in town" },
  ],
  "232": [
    { code: "J215.3", label: "Heathcock prefers home with hardships to travel in foreign lands" },
  ],
  "232D*": [
    { code: "J101", label: "Crow drops pebbles into water jug so as to be able to drink" },
  ],
  "233B": [
    { code: "K581.4.1", label: "Birds caught in net fly away with it" },
  ],
  "233D": [
    { code: "J869.1", label: "Doves in net console themselves because they think trapper's tears are from pity for them" },
  ],
  "235": [
    { code: "A2313.1", label: "Origin of cuckoo's feathers" },
  ],
  "235C*": [
    { code: "K233.1", label: "Bird has new clothes made: flies away without paying" },
  ],
  "236": [
    { code: "A2271.1", label: "Thrush teaches dove to build nest" },
  ],
  "238": [
    { code: "K85", label: "Contest in seeing" },
    { code: "K86", label: "Contest in hearing" },
  ],
  "239": [
    { code: "K642.1", label: "Crow and rat release deer from snare" },
  ],
  "240": [
    { code: "A2247.4", label: "Dove and magpie exchange eggs – dove's seven for magpie's two: why dove has two eggs" },
  ],
  "244": [
    { code: "J1062.1", label: "Frog as beauty doctor unable to cure his own ugliness" },
    { code: "J951.2", label: "Jay in peacock's (pigeon's) skin unmasked" },
  ],
  "253": [
    { code: "L331", label: "Little fishes escape from the net. The large are caught" },
  ],
  "276": [
    { code: "J1063.1", label: "Mother crab blames her children for not walking straight" },
    { code: "U121.1", label: "Crab walks backward: learned from his parents" },
  ],
  "282B*": [
    { code: "A2332.1.2", label: "How fly got his eyes" },
  ],
  "298C*": [
    { code: "J832", label: "Reeds bend before wind (flood). Save themselves while oak is uprooted" },
  ],
  "299": [
    { code: "U114", label: "Mountain in labor brings forth a mouse" },
  ],
  "300": [
    { code: "B312.2", label: "Helpful animals obtained by exchange" },
    { code: "H83", label: "Rescue tokens. Proof that hero has succeeded in rescue" },
    { code: "K1932", label: "Impostors claim reward (prize) earned by hero" },
    { code: "K1933", label: "Impostor forces oath of secrecy. Hero or heroine swears not to tell of imposture" },
    { code: "R111.1.3", label: "Rescue of princess (maiden) from dragon" },
    { code: "D1978.2", label: "Waking from magic sleep by letting tear fall on sleeper" },
  ],
  "302C*": [
    { code: "C611", label: "Forbidden chamber. Person allowed to enter all chambers of house except one" },
  ],
  "306": [
    { code: "F1015.1.1", label: "The danced-out shoes. Every morning girl's shoes are danced to pieces" },
    { code: "H80", label: "Identification by tokens" },
    { code: "L161", label: "Lowly hero marries princess" },
    { code: "H508.2", label: "Bride offered to man who can find answer to question" },
    { code: "F87", label: "Journey to otherworld to secure bride" },
    { code: "D1980", label: "Magic invisibility" },
  ],
  "310": [
    { code: "D642.7", label: "Transformation to elude pursuers" },
    { code: "N455", label: "Overheard (human) conversation" },
    { code: "F848.1", label: "Girl's long hair as ladder into tower. Rapunzel" },
    { code: "L162", label: "Lowly heroine marries prince (king)" },
    { code: "G204", label: "Girl in service of witch" },
    { code: "S222.1", label: "Woman promises her unborn child to appease offended witch" },
  ],
  "313": [
    { code: "D2006.1.3", label: "Forgotten fiancée reawakens husband's memory by having magic doves converse" },
    { code: "D1611", label: "Magic object answers for fugitive. Left behind to impersonate fugitive and delay pursuit" },
    { code: "H335.0.1", label: "Bride helps suitor perform his tasks" },
    { code: "H1154.8", label: "Task: capturing magic horse" },
    { code: "H1113", label: "Task: bailing out a pond" },
    { code: "H1104", label: "Task: building castle in one night" },
  ],
  "328": [
    { code: "G514.1", label: "Ogre trapped in box (cage)" },
    { code: "H1172", label: "Task: bringing an ogre to court" },
    { code: "D1233", label: "Magic violin (fiddle)" },
    { code: "H911", label: "Tasks assigned at suggestion of jealous rivals" },
  ],
  "369": [
    { code: "H1381.2.2.1", label: "Son seeks unknown father" },
  ],
  "402": [
    { code: "B493.1", label: "Helpful frog" },
    { code: "B422", label: "Helpful cat" },
    { code: "D700", label: "Person disenchanted" },
    { code: "H1301.1", label: "Quest for the most beautiful bride" },
    { code: "H1242", label: "Youngest brother alone succeeds on quest" },
    { code: "B437.2", label: "Helpful mouse" },
  ],
  "408": [
    { code: "D150", label: "Transformation: man to bird" },
    { code: "K1911.3", label: "Reinstatement of true bride" },
    { code: "D721.5", label: "Disenchantment from fruit (flower) by opening it" },
    { code: "K1911.2.2", label: "True bride pushed into water by false" },
    { code: "D170", label: "Transformation: man to fish" },
    { code: "D610", label: "Repeated transformation. Transformation into one form after another" },
  ],
  "410": [
    { code: "F771.4.4", label: "Castle in which everyone is asleep" },
    { code: "M370", label: "Vain attempts to escape fulfillment of prophecy" },
    { code: "B211.7.1", label: "Speaking frog" },
    { code: "D1978.5", label: "Waking from magic sleep by kiss" },
    { code: "N711.2", label: "Hero finds maiden in (magic) castle" },
    { code: "D1967.1", label: "Person in magic sleep surrounded by protecting hedge" },
  ],
  "425A": [
    { code: "C421", label: "Tabu: revealing secret of supernatural husband" },
    { code: "D2006.1.4", label: "Forgotten fiancée buys place in husband's bed and reawakens his memory" },
    { code: "S228", label: "Daughter promised to monster as bride to secure flower (bird) she has asked for" },
    { code: "S252", label: "Vain attempt to save promised child" },
    { code: "C758.1", label: "Monster born because of hasty (inconsiderate) wish of parents" },
    { code: "T111", label: "Marriage of mortal and supernatural being" },
  ],
  "425C": [
    { code: "C761.2", label: "Tabu: staying too long at home" },
    { code: "D735.1", label: "Beauty and the beast. Disenchantment of animal by being kissed by woman (man)" },
  ],
  "426": [
    { code: "D763", label: "Disenchantment by destroying enchanter" },
    { code: "F451.2.3.1", label: "Long-bearded dwarf" },
    { code: "K1111.1", label: "Ogre's (dwarf's) beard caught fast" },
    { code: "F451.6.1", label: "Dwarf caught by beard in cleft of tree" },
    { code: "F451.5.2.1", label: "Ungrateful dwarf" },
  ],
  "430": [
    { code: "D721.3", label: "Disenchantment by destroying skin (covering)" },
    { code: "B641.4", label: "Marriage to person in ass form" },
  ],
  "440": [
    { code: "D789", label: "Other means of disenchantment" },
    { code: "C41.2", label: "Tabu: letting ball fall into water" },
    { code: "B211.7.1", label: "Speaking frog" },
    { code: "S215.1", label: "Girl promises herself to animal suitor" },
    { code: "D735.1", label: "Beauty and the beast. Disenchantment of animal by being kissed by woman (man)" },
    { code: "D743", label: "Disenchantment by sexual intercourse. Man disenchants woman in form of a bear" },
  ],
  "442": [
    { code: "D1076", label: "Magic ring" },
    { code: "L162", label: "Lowly heroine marries prince (king)" },
    { code: "D431.2", label: "Transformation: tree to person" },
  ],
  "465": [
    { code: "B642", label: "Marriage to person in bird form" },
    { code: "H911", label: "Tasks assigned at suggestion of jealous rivals" },
    { code: "H1211", label: "Quests assigned in order to get rid of hero" },
    { code: "H1335", label: "Quest for the living harp" },
    { code: "H1090", label: "Tasks requiring miraculous speed" },
    { code: "H1023.3", label: "Task: bringing berries (fruit, roses) in winter" },
  ],
  "476": [
    { code: "F342.1", label: "Fairy gold. Fairies give coals (wood, earth) that turns to gold" },
    { code: "D475.1.1", label: "Transformation: coals to gold" },
    { code: "N532", label: "Light indicates hidden treasure" },
  ],
  "480": [
    { code: "H1192", label: "Task: combing hair of fairies" },
    { code: "N791", label: "Adventures from pursuing object carried off by river" },
    { code: "N777.4", label: "Spindle dropped into well leads to adventures" },
    { code: "H934.3", label: "Tasks assigned by stepmother" },
    { code: "D1658", label: "Grateful objects" },
    { code: "B350", label: "Grateful animals" },
  ],
  "500": [
    { code: "H1092", label: "Task: spinning impossible amount in one night" },
    { code: "N475", label: "Secret name overheard by eavesdropper" },
    { code: "C432.1", label: "Guessing name of supernatural creature gives power over him. (Tom-Tit-Tot)" },
    { code: "H1021.8", label: "Task: spinning gold" },
    { code: "D2183", label: "Magic spinning. Usually performed by a supernatural helper" },
    { code: "S222.1", label: "Woman promises her unborn child to appease offended witch" },
  ],
  "501": [
    { code: "G201.1", label: "Three witches (hags) deformed from much spinning" },
    { code: "H1092", label: "Task: spinning impossible amount in one night" },
    { code: "D2183", label: "Magic spinning. Usually performed by a supernatural helper" },
    { code: "G244", label: "Witch spins" },
  ],
  "510A": [
    { code: "H36.1", label: "Slipper test. Identification by fitting of slipper" },
    { code: "N711.6", label: "Prince sees heroine at ball and is enamored" },
    { code: "B450", label: "Helpful birds" },
    { code: "N815", label: "Fairy as helper" },
    { code: "C761.3", label: "Tabu: staying too long at ball. Must leave before certain hour" },
    { code: "F823.2", label: "Glass shoes" },
  ],
  "511": [
    { code: "B535.0.1", label: "Cow as nurse cares for children" },
    { code: "D830.1", label: "Attempt to learn about magic object by spying" },
    { code: "L162", label: "Lowly heroine marries prince (king)" },
    { code: "F811.1", label: "Trees of extraordinary material" },
    { code: "C513", label: "Tabu: breaking twig" },
    { code: "B505", label: "Magic object received from animal" },
  ],
  "513B": [
    { code: "N825.2", label: "Old man helper" },
    { code: "F601.2", label: "Extraordinary companions help hero in suitor tests" },
    { code: "F601", label: "Extraordinary companions. A group of men with extraordinary powers travel together" },
    { code: "D1533.1.1", label: "Magic land and water ship" },
    { code: "H331", label: "Suitor contests: bride offered as prize" },
    { code: "L161", label: "Lowly hero marries princess" },
  ],
  "515": [
    { code: "Q42", label: "Generosity rewarded" },
    { code: "L161", label: "Lowly hero marries princess" },
  ],
  "517": [
    { code: "M312.0.2", label: "Prophecy of future greatness given by animals" },
    { code: "B216", label: "Knowledge of animal languages. Person understands them" },
    { code: "N682", label: "Prophecy of future greatness fulfilled when hero returns home unknown. Parents serve him" },
    { code: "M373", label: "Expulsion to avoid fulfillment of prophecy" },
    { code: "B143", label: "Prophetic bird" },
    { code: "B215.1", label: "Bird language" },
  ],
  "545B": [
    { code: "B435.2", label: "Helpful jackal" },
    { code: "B441.1", label: "Helpful monkey" },
    { code: "B581", label: "Animal brings wealth to man" },
    { code: "K1917.3", label: "Penniless wooer: helpful animal reports master wealthy and thus wins girl for him" },
    { code: "F771.4.1", label: "Castle inhabited by ogres" },
    { code: "B422", label: "Helpful cat" },
  ],
  "550": [
    { code: "H1471", label: "Watch for devastating monster. Youngest alone successful" },
    { code: "H1210.1", label: "Quest assigned by father" },
    { code: "B560", label: "Animals advise men" },
    { code: "B184.1", label: "Magic horse" },
    { code: "H1241", label: "Series of quests. One quest can be accomplished when a second is finished, etc" },
    { code: "B435.1", label: "Helpful fox" },
  ],
  "551": [
    { code: "L161", label: "Lowly hero marries princess" },
    { code: "H1381.2.1", label: "Woman seeks unknown father of her child" },
    { code: "K1932", label: "Impostors claim reward (prize) earned by hero" },
    { code: "W154.12.3", label: "Ungrateful brothers plot against rescuer" },
    { code: "H81.1", label: "Hero lies by sleeping girl and leaves identification token with her" },
    { code: "T475.2", label: "Hero lies by princess in magic sleep and begets child" },
  ],
  "554": [
    { code: "H982", label: "Animals help man perform task" },
    { code: "B582.2", label: "Animals help hero win princess" },
    { code: "B571", label: "Animals perform tasks for man" },
  ],
  "555": [
    { code: "B375.1", label: "Fish returned to water: grateful" },
    { code: "D1761.0.1", label: "Wishes granted without limit" },
    { code: "B170", label: "Magic birds, fish, reptiles, etc" },
    { code: "J514", label: "One should not be too greedy" },
  ],
  "560": [
    { code: "D840", label: "Magic object found" },
    { code: "D1662.1", label: "Magic ring works by being stroked" },
    { code: "D1131.1", label: "Castle produced by magic" },
    { code: "D2136.2", label: "Castle magically transported" },
    { code: "K2213", label: "Treacherous wife" },
    { code: "B421", label: "Helpful dog" },
  ],
  "561": [
    { code: "L161", label: "Lowly hero marries princess" },
    { code: "D860", label: "Loss of magic object" },
    { code: "D2136.2", label: "Castle magically transported" },
    { code: "D881", label: "Magic object recovered by using second magic object" },
    { code: "D1470.1.5", label: "Magic wishing-apple" },
    { code: "D840", label: "Magic object found" },
  ],
  "563": [
    { code: "B103.1.1", label: "Gold-producing ass. Droppings of gold" },
    { code: "J2355.1", label: "Fool loses magic objects by talking about them" },
    { code: "D1472.1.22", label: "Magic bag (sack) supplies food" },
    { code: "D1030.1", label: "Food supplied by magic. Most of the references in D1030 also belong here" },
    { code: "K2241", label: "Treacherous inn-keeper" },
    { code: "D1472.1.7", label: "Magic table supplies food and drink" },
  ],
  "565": [
    { code: "D1601.21.1", label: "Self-grinding salt-mill" },
    { code: "D1472.1.9", label: "Magic pot supplies food and drink" },
    { code: "D1651", label: "Magic object obeys master alone" },
    { code: "D1651.3", label: "Magic cooking-pot obeys only master" },
    { code: "D1601.10.1", label: "Self-cooking pot" },
  ],
  "570": [
    { code: "H335", label: "Tasks assigned suitors. Bride as prize for accomplishment" },
    { code: "H1112", label: "Task: herding rabbits" },
    { code: "D1441.1.2", label: "Magic pipe calls animals together" },
    { code: "H1045", label: "Task: filling a sack full of lies (truths)" },
    { code: "T68", label: "Princess offered as prize" },
  ],
  "570A": [
    { code: "K1837", label: "Disguise of woman in man's clothes" },
  ],
  "571": [
    { code: "D2171.5", label: "Persons magically stick together" },
    { code: "D817", label: "Magic object received from grateful person" },
    { code: "T68", label: "Princess offered as prize" },
    { code: "D2171.3.1", label: "Magic adhesion to goose" },
    { code: "D1413", label: "Magic object holds person fast" },
    { code: "H341.1", label: "Princess brought to laughter by people sticking together" },
  ],
  "585": [
    { code: "H1311.2", label: "Quest for bride richest and poorest" },
    { code: "D1425.1", label: "Magic spindle brings back prince for heroine" },
    { code: "D1484.1", label: "Magic shuttle makes road" },
    { code: "D1337.1.7", label: "Magic needle transforms a room from plainness to beauty" },
    { code: "D1485.1", label: "Magic shuttle makes carpet" },
  ],
  "715A": [
    { code: "B103.1", label: "Treasure-dropping animals" },
  ],
  "736": [
    { code: "N421", label: "Lucky bargain" },
  ],
  "745": [
    { code: "D1602.11", label: "Self-returning magic coin. Keeps coming back" },
    { code: "D1288", label: "Magic coin" },
  ],
  "756E*": [
    { code: "V410.1", label: "Charity rewarded above prayer or hearing of masses" },
  ],
  "759E": [
    { code: "P411.1", label: "Peasant refuses to sell possessions to king" },
  ],
  "775": [
    { code: "J2072.1", label: "Short-sighted wish: Midas's touch. Everything to turn to gold" },
  ],
  "779H*": [
    { code: "F962.3", label: "Star drops from heaven: is money" },
  ],
  "875": [
    { code: "H1053", label: "Task: coming neither on horse nor on foot (riding nor walking)" },
    { code: "H631.1", label: "What is the strongest? A horse" },
    { code: "H561.1", label: "Clever peasant girl asked riddles by king" },
    { code: "H630", label: "Riddles of the superlative" },
    { code: "H1010", label: "Impossible tasks" },
    { code: "H1023.1.1", label: "Task: hatching boiled eggs; countertask: sowing cooked seeds and harvesting the crop" },
  ],
  "875B": [
    { code: "H1010", label: "Impossible tasks" },
    { code: "H1021.9", label: "Task: sewing a shirt of stone" },
    { code: "H1024.1", label: "Task: milking a bull" },
    { code: "H1024.1.1.1", label: "Task: making a bull bear a calf. Reductio ad absurdum: have a man prepare for childbirth" },
    { code: "H1023.25.1", label: "Task: bringing well to king; countertask: sending his own well to accompany it" },
    { code: "H1021.2", label: "Task: making a rope of chaff" },
  ],
  "875E": [
    { code: "J1191", label: "Reductio ad absurdum of judgment" },
  ],
  "887A*": [
    { code: "T52", label: "Bride purchased" },
  ],
  "900": [
    { code: "T62", label: "Princess to marry first man who asks for her" },
    { code: "H181", label: "Recognition by unmasking" },
    { code: "L113.1.0.1", label: "Heroine endures hardships with menial husband. Rewarded by his success" },
    { code: "T251.2", label: "Taming the shrew. By outdoing his wife in shrewishness the husband renders her obedient" },
    { code: "T76", label: "Princess calls her suitors ugly names" },
  ],
  "910": [
    { code: "J163.4", label: "Good counsels bought" },
    { code: "J21", label: "Counsels proved wise by experience" },
  ],
  "910E": [
    { code: "H588.7", label: "Father's counsel: find treasure within a foot of the ground" },
  ],
  "910G": [
    { code: "J163.1", label: "Man buys a pennyworth of wit" },
  ],
  "915A": [
    { code: "H588.11", label: "Always eat bread with \"honey\"" },
    { code: "H588.12", label: "\"Never greet anyone.\"" },
    { code: "H588.13", label: "\"Always wear new shoes.\"" },
  ],
  "920A": [
    { code: "K1921.1", label: "Son of the king and of the smith exchanged" },
    { code: "H1023.1.1", label: "Task: hatching boiled eggs; countertask: sowing cooked seeds and harvesting the crop" },
  ],
  "920E": [
    { code: "J462.3.1", label: "Father leaves sons three jewels – Christianity, Judaism, Mohammedanism. All to be used" },
    { code: "J80", label: "Wisdom (knowledge) taught by parable" },
  ],
  "921B": [
    { code: "H1065", label: "Task: bringing best friend, worst enemy, best servant, greatest pleasure-giver" },
  ],
  "921C": [
    { code: "H771", label: "Riddle: why is the hair gray before the beard?" },
  ],
  "921C*": [
    { code: "L144.2", label: "Farmer surpasses astronomer and doctor in predicting weather and choosing food" },
  ],
  "921E": [
    { code: "H1182", label: "Task: letting king hear something that neither he nor his subjects have ever heard" },
  ],
  "923A": [
    { code: "H592.1.1", label: "\"Love like wind in hot sun.\" Husband offended but later learns wife's meaning" },
  ],
  "924": [
    { code: "J1804", label: "Conversation by sign language mutually misunderstood" },
  ],
  "935": [
    { code: "L161", label: "Lowly hero marries princess" },
    { code: "K1815", label: "Humble disguise. (Cap o' Rushes, Peau d'âne Allerleirauh.) Usually in rough clothing" },
    { code: "K1837", label: "Disguise of woman in man's clothes" },
  ],
  "936*": [
    { code: "K521.1.1", label: "Man sewed in animal's hide carried off by birds" },
    { code: "B31.1", label: "Roc. A giant bird which carries off men in its claws" },
  ],
  "940*": [
    { code: "Q68.2", label: "Honesty rewarded" },
  ],
  "945": [
    { code: "H343", label: "Suitor test: bringing dumb princess to speak" },
    { code: "F954.2.1", label: "Dumb princess is brought to speech by tale ending with a question to be solved" },
    { code: "D435.1.1", label: "Transformation: statue comes to life" },
    { code: "F1023", label: "Creation of a person by cooperation of skillful men" },
    { code: "Z16.1", label: "Four brothers construct a woman. Whose is she?" },
  ],
  "945A*": [
    { code: "N183", label: "Money lost twice: recovered third time" },
    { code: "N421", label: "Lucky bargain" },
  ],
  "967": [
    { code: "B523.1", label: "Spider-web over hole saves fugitive" },
  ],
  "987": [
    { code: "K1963.1", label: "False magician exposed by clever girl" },
  ],
  "1430": [
    { code: "J2060", label: "Absurd plans. Air-castles" },
    { code: "J2061.1.2", label: "Air-castle: basket of eggs to be sold. In her excitement she breaks all the eggs" },
    { code: "J2061.1.1", label: "Air-castle: basket of glassware to be sold. In his excitement he breaks the glassware" },
    { code: "J2061.1", label: "Air-castle: the jar of honey to be sold. In his excitement he breaks the jar" },
    { code: "J2061", label: "Air-castle shattered by lack of forethought" },
  ],
  "1548": [
    { code: "K112.2", label: "\"Soup stone\" sold. It needs only the addition of a few vegetables and a bit of meat" },
  ],
  "2016": [
    { code: "Z39.2", label: "There was a wee wee woman who had a wee wee cow, etc" },
  ],
  "2030": [
    { code: "Z41.7.1", label: "Boy dirties his shoe and asks the hay stack to wipe it clean" },
    { code: "Z41.4.1", label: "Mouse bursts open when crossing a stream. Series of helpers similar to Z41.4" },
    { code: "Z41.3", label: "Conflict between fowl and thistle. Wind obeys and breaks the chain" },
  ],
  "2031": [
    { code: "L392", label: "Mouse stronger than wall, wind, mountain" },
  ],
  "2031A": [
    { code: "H631.4", label: "What is strongest? Woman" },
    { code: "H631.9", label: "What is strongest? The king" },
    { code: "Z42.1", label: "The Esdras chain: stronger and strongest, wine, king, woman, truth" },
    { code: "H631.5", label: "What is strongest? Truth" },
    { code: "H631.8", label: "What is strongest? Wine" },
  ],
  "2301": [
    { code: "Z11.1", label: "Endless tale: corn carried away grain at a time" },
  ],
};

/** Every motif code this app knows about, for validating a request. */
export const MOTIF_CODES: ReadonlySet<string> = new Set(
  Object.values(MOTIFS_BY_ATU).flatMap((ms) => ms.map((m) => m.code)),
);

/** Look up a motif's label by code, or undefined if we don't carry it. */
export function getMotifLabel(code: string): string | undefined {
  for (const ms of Object.values(MOTIFS_BY_ATU)) {
    const hit = ms.find((m) => m.code === code);
    if (hit) return hit.label;
  }
  return undefined;
}

/** The motifs available for a tale type, or an empty list. */
export function motifsFor(atu: string): readonly Motif[] {
  return MOTIFS_BY_ATU[atu] ?? [];
}
