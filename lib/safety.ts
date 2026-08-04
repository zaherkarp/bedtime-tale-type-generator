/**
 * The deterministic bedtime-safety screen.
 *
 * The catalogue is generated from the full Aarne–Thompson–Uther index, which is
 * a scholarly record of what people actually told each other — murder,
 * mutilation, damnation and a great deal of bawdry included. Most of it has no
 * business in a bedtime app.
 *
 * ## Why stems, not words
 *
 * The first version of this file matched whole words. It passed
 * "The Fox **Rapes** the She-Bear" (ATU 36), because the list held `rape` and
 * `raped` but not `rapes`. Folklore titles inflect freely and a hand-written
 * list will always be one form behind, so matching is now done on **stems**: a
 * term fires when any word in the text *starts with* it. `rape` therefore
 * catches rapes, raping and rapist, and `murder` catches murderess.
 *
 * ## What this screen is, and what it is not
 *
 * It is a floor, not a guarantee. Stemming fixes morphology; it does nothing
 * about vocabulary this list has never heard of — "Eating his own Entrails"
 * (ATU 21) sailed through the word version because neither `eating` nor
 * `entrails` was on it. Assume there are more like it.
 *
 * So it is deliberately blunt and deliberately over-eager, it is applied to a
 * tale type's *motifs* as well as its title (motif labels are far more
 * descriptive than titles, and a grim tale rarely hides all of them), and it is
 * never the only thing between the index and a child:
 *
 * 1. this screen decides what a parent is *offered*;
 * 2. `SYSTEM_PROMPT` in `lib/prompt.ts` forbids death, injury, peril, cruelty,
 *    horror and romance in every story regardless of type, and that is what
 *    decides what a child actually *hears*.
 *
 * A false positive costs one tale type out of thousands. A false negative costs
 * a frightened child. Tune accordingly.
 */

/**
 * Stems that disqualify a tale type. Matched against the start of any word in a
 * lower-cased, punctuation-stripped string; entries containing a space are
 * matched as whole phrases.
 *
 * Keep stems at four characters or more — shorter ones collide with innocent
 * words far too often ("die" would fire on "diet", "sex" on "sextet").
 */
export const UNSAFE_TERMS: readonly string[] = [
  // --- Death, killing, and the dead ---------------------------------------
  "kill", "murder", "slay", "slain", "slaughter", "massacre", "death", "dead",
  "dying", "died", "deceas", "corpse", "cadaver", "carcass", "carrion",
  "grave", "tomb", "buri", "coffin", "funeral", "widow", "orphan", "mourn",
  "execut", "gallows", "hang", "behead", "decapitat", "suicide", "sacrific",
  "martyr", "parricide", "fratricide", "infanticide", "matricide", "homicide",
  "poison", "perish", "drown", "smother", "suffocat", "asphyxi", "strangl",
  "assassin", "slaughterhouse", "undead", "resuscitat", "reviv", "revenant",

  // --- Violence, cruelty, and injury --------------------------------------
  "blood", "bleed", "gore", "wound", "mutilat", "dismember", "disembowel",
  "entrail", "bowel", "intestine", "gut ", "tortur", "torment", "flog",
  "whip", "lash", "scourge", "beaten", "beating", "stab", "pierc", "impal",
  "flay", "skinned alive", "scalp", "maim", "crippl", "lame", "blind",
  "amputat", "sever", "chop", "hack", "slash", "slit", "crush", "trampl",
  "cut off", "cuts off", "cutting off", "razor", "noose", "whipping",
  "devour", "eaten", "eating", "eats", "swallow", "cannibal", "man eater",
  "flesh", "bone", "skull", "vengeance", "reveng", "punish", "curse",
  "cursing", "damn", "cruel", "abus", "captiv", "imprison", "dungeon",
  "enslav", "slave", "kidnap", "abduct", "assault", "attack", "fight",
  "battle", "war ", "weapon", "sword", "knife", "dagger", "axe ", "spear", "arrow",
  "gun ", "shoot", "shot ", "burn", "scald", "freeze to", "starv", "famine",
  "beggar", "thrash", "cudgel", "club ", "strik", "struck", "wrestl",

  // --- Sex, and the bawdy tales -------------------------------------------
  "adulter", "seduc", "lover", "mistress", "concubine", "harlot", "whore",
  "prostitut", "brothel", "bawdy", "obscen", "lewd", "lecher", "ribald",
  "naked", "nude", "pregnan", "impregnat", "conceiv", "conception",
  "virgin", "chastity", "chaste", "rape", "raping", "ravish", "incest", "sodom",
  "castrat", "phallus", "genital", "buttock", "privy", "chamber pot",
  "excrement", "dung", "urine", "piss", "fart", "breast", "copulat",
  "coitus", "bastard", "illegitimate", "cuckold", "wooing", "courtship",
  "elop", "seduct", "paramour", "fornicat", "lust", "erotic",

  // --- Horror and the demonic ---------------------------------------------
  "devil", "satan", "demon", "hell", "fiend", "ghost", "spectre", "specter",
  "phantom", "vampire", "werewolf", "haunt", "possess by", "exorcis",
  "nightmare", "terror", "horror", "horrid", "horrible", "gruesome",
  "grisly", "ghastly", "macabre", "dread", "fright", "plague", "pestilence",
  "leper", "leprosy", "diseas", "sick", "madness", "insane", "lunatic",
  "witch burn", "burned at the stake", "sorcer", "black magic",

  // --- Period slurs and the categories the index files material under ------
  "negro", "gypsy", "gipsy", "jewess", "heathen", "savage", "idiot",
  "imbecile", "madman", "madwoman", "hunchback", "deaf and dumb", "cretin",
  "half wit", "halfwit", "simpleton", "moron",

  // --- Humiliation — the app promises nobody is made a fool of -------------
  "humiliat", "mock", "ridicul", "shame", "shaming", "disgrace", "numskull",
  "numbskull", "noodle", "drunkard", "drunken", "drunk", "stupid", "foolish",
  "trick", "dupe", "duping", "deceiv", "deception", "cheat", "swindl",
  "thief", "thiev",
  "steal", "stole", "rob ", "robber", "theft", "liar", "lying", "betray",
];

/** Lower-case, strip punctuation to spaces, collapse whitespace, pad with spaces. */
export function normaliseForScreen(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

/**
 * Every unsafe term matching the given text. Three kinds of term:
 *
 * - **stem** (`murder`) — matches at the start of any word, so it catches
 *   murders, murdered and murderess.
 * - **whole word** (`war `, written with a trailing space) — matches only that
 *   exact word. Some short terms are real words that are also the start of
 *   perfectly innocent ones, and stemming them is worse than useless: `war`
 *   would reject "warm" and "wary", and `rob` would reject "robin".
 * - **phrase** (`cut off`) — matches the whole phrase.
 *
 * Empty means the text is clean as far as this screen can tell — which, as the
 * header says, is not the same as being safe.
 */
export function unsafeTermsIn(...texts: string[]): string[] {
  const haystack = normaliseForScreen(texts.filter(Boolean).join(" . "));
  const hits = new Set<string>();
  for (const term of UNSAFE_TERMS) {
    const wholeWord = term.endsWith(" ");
    const needle = normaliseForScreen(term).trim();
    if (needle.includes(" ")) {
      // Phrase.
      if (haystack.includes(` ${needle} `)) hits.add(term);
    } else if (wholeWord) {
      if (haystack.includes(` ${needle} `)) hits.add(term);
    } else if (haystack.includes(` ${needle}`)) {
      hits.add(term);
    }
  }
  return [...hits];
}

/** True when nothing in the deterministic denylist matches. */
export function passesScreen(...texts: string[]): boolean {
  return unsafeTermsIn(...texts).length === 0;
}
