/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by `npm run sync:atu` from the ATU knowledge base's
 * license-filtered export (`kb/export/tale-types.jsonl`). Every title here is
 * the canonical scholarly title of the tale type, carried with the source that
 * asserted it and the licence that applies to it.
 *
 * These are NOT the app's user-facing titles. The catalogue's own `title` is a
 * bedtime label chosen for children — "Jack and the Beanstalk", not "The Boy
 * Steals the Ogre's Treasure" — and stays hand-authored in `lib/atu-index.ts`.
 *
 * `disputed` is true where the knowledge base's sources disagree about the
 * English title and a curator has not yet decided, so a consumer can tell
 * "the sources agree" apart from "we picked one".
 */

export interface AtuCanonicalTitle {
  /** The canonical scholarly title of the tale type. */
  title: string;
  /** The knowledge-base source that asserted it. */
  source: string;
  /** The effective licence of the record it came from. */
  spdx: string;
  /** True when sources disagree and the disagreement is still open. */
  disputed: boolean;
}

/** Canonical titles for the ATU numbers this catalogue carries, keyed by number. */
export const ATU_CANONICAL_TITLES: Readonly<Record<string, AtuCanonicalTitle>> = {
  "2": { title: "The Tail-Fisher", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "57": { title: "Raven with Cheese in his Mouth", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "59": { title: "The Fox and the Sour Grapes", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "60": { title: "The Fox and the Stork", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "70": { title: "More Cowardly than the Hare", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "76": { title: "The Wolf and the Crane", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "77": { title: "The Stag Admires Himself in a Spring", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "85": { title: "The Mouse, the Bird, and the Sausage", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "105": { title: "The Cat's Only Trick", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "110": { title: "Belling the Cat", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "112": { title: "Country Mouse Visits Town Mouse", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "123": { title: "The Wolf and the Kids", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "124": { title: "Blowing the House In", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "130": { title: "The Animals in Night Quarters", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "200": { title: "The Dog's Certificate", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "221": { title: "The Election of King of Birds", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "227": { title: "Geese Ask for Respite for Prayer", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "275": { title: "The Race between Two Animals", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "298": { title: "The Contest of Wind and Sun", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "300": { title: "The Dragon-Slayer", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "306": { title: "The Twelve Dancing Princesses", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "310": { title: "The Maiden in the Tower", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "313": { title: "The Sea Tsar and Vasilisa the Wise", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "328": { title: "The Boy Steals the Ogre’s Treasure", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "402": { title: "The Frog Princess", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "410": { title: "Sleeping Beauty", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "425A": { title: "The Animal as Bridegroom", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "425C": { title: "Beauty and the Beast", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "440": { title: "The Frog King Or Iron Henry", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "480": { title: "Mare's Head", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "500": { title: "The Name of the Supernatural Helper", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "501": { title: "The Three Old Spinning Women", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "510A": { title: "Cinderella", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "511": { title: "Kroshechka Havroshechka", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "513": { title: "The Extraordinary Companions", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "545B": { title: "Puss in Boots", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "550": { title: "Bird, Horse and Princess", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "551": { title: "Water of Life", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "555": { title: "The Fisherman and His Wife", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "560": { title: "The Magic Ring", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "561": { title: "Aladdin and the Wonderful Lamp", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "563": { title: "The Table, the Donkey and the Stick", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "565": { title: "The Magic Mill", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "570": { title: "The Rabbit-Herd", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "571": { title: "“All Stick Together”", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "585": { title: "Spindle, Shuttle, and Needle", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "700": { title: "Thumbling", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "704": { title: "Princess on the Pea", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "875": { title: "The Clever Farmgirl", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "900": { title: "King Thrushbeard", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "923": { title: "Love Like Salt", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: false },
  "1415": { title: "Lucky Hans", source: "trilogy", spdx: "CC-BY-SA-4.0", disputed: false },
  "1430": { title: "The Man and his Wife Build Air Castles", source: "trilogy", spdx: "CC-BY-SA-4.0", disputed: false },
  "1548": { title: "Axe kasha", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "2015": { title: "The Goat who Would Not Go Home", source: "trilogy", spdx: "CC-BY-SA-4.0", disputed: false },
  "2025": { title: "Kolobok", source: "wikidata_p2540", spdx: "CC-BY-SA-4.0", disputed: true },
  "2030": { title: "The Old Woman and her Pig", source: "trilogy", spdx: "CC-BY-SA-4.0", disputed: false },
  "2031": { title: "Stronger and Strongest", source: "trilogy", spdx: "CC-BY-SA-4.0", disputed: false },
  "2035": { title: "The House that Jack Built", source: "trilogy", spdx: "CC-BY-SA-4.0", disputed: false },
  "2044": { title: "Pulling Up the Turnip", source: "trilogy", spdx: "CC-BY-SA-4.0", disputed: false },
  "2300": { title: "Endless Tales", source: "trilogy", spdx: "CC-BY-SA-4.0", disputed: false },
};
