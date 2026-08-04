/**
 * Generate `lib/atu-extended.ts` — the catalogue's third tier.
 *
 * Tiers one and two (`lib/tale-types.ts` and the `EXTRA_TYPES` in
 * `lib/atu-index.ts`) are hand-authored: someone chose the bedtime title, wrote
 * the blurb, picked the emoji, and vouched for the tale type. That does not
 * scale past a few dozen entries, and the knowledge base holds two thousand.
 *
 * So tier three is generated, and everything about it is arranged so that a
 * mistake fails closed:
 *
 * 1. A tale type must survive the stem screen on its **canonical title**
 *    (`scripts/propose-catalogue.ts`).
 * 2. It must have **motif data**. No motifs means nothing to screen, and
 *    "we couldn't check" is not a reason to include something — 452 candidates
 *    are dropped on this rule alone.
 * 3. Not one of its motifs may carry a **content advisory** from the knowledge
 *    base (period racial framing, sexual content, and so on).
 * 4. Not one of its **motif labels** may trip the stem screen. Labels are far
 *    more descriptive than titles — "Cruel stepmother" says what "Cinderella"
 *    does not — so this is where most of the real filtering happens.
 *
 * ## No invented prose
 *
 * A tier-three entry carries **no blurb**. The obvious move would be to have a
 * model write one for each of the five hundred-odd types, and the first version
 * of this plan did exactly that. But a generated blurb is an unsourced claim
 * about a tale nobody involved has read, printed next to real ATU numbers and
 * real canonical titles, where it reads as being just as authoritative. The
 * catalogue is better off saying less and meaning all of it.
 *
 * If reviewed blurbs are ever written — by hand, or by a model with a human
 * reading the output — dropping them into `data/atu-blurbs.reviewed.json` as
 * `{ entries: { "<atu>": { verdict, blurb } } }` picks them up. A record there
 * can *veto* an entry but never resurrect one: anything the deterministic
 * screens rejected is already gone before this file is consulted.
 *
 * Run with:  npm run catalogue:build   (add --check to fail instead of writing)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { unsafeTermsIn } from "../lib/safety.ts";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const EXPORT_DIR = process.env.ATUKB_EXPORT_DIR ?? resolve(REPO_ROOT, "kb/export");
const CANDIDATES_PATH = resolve(REPO_ROOT, "data/atu-candidates.json");
const BLURBS_PATH = resolve(REPO_ROOT, "data/atu-blurbs.reviewed.json");
const OUTPUT_PATH = resolve(REPO_ROOT, "lib/atu-extended.ts");

/** Export files this script cannot run without. */
const REQUIRED_EXPORTS = ["motifs.jsonl", "tale-type-motifs.jsonl"];

interface Candidate {
  atu: string;
  canonicalTitle: string;
  division: string;
  source: string;
  spdx: string;
  disputed: boolean;
}

/**
 * Emoji per ATU division. Picked from the division's palette by hashing the
 * tale-type number, so the grid has some variety and a given type always shows
 * the same face.
 */
const DIVISION_EMOJI: Record<string, readonly string[]> = {
  "Animal Tales": ["🦊", "🐻", "🐺", "🐰", "🐦", "🐭", "🦁", "🐢"],
  "Tales of Magic": ["✨", "🪄", "🏰", "🧚", "🌙", "🔮", "🗝️", "🌟"],
  "Religious Tales": ["🕊️", "⛪", "🌾", "🙏", "🕯️"],
  "Realistic Tales": ["🧭", "🎒", "🏡", "🛤️", "🧵"],
  "Tales of the Stupid Ogre": ["🗿", "⛰️", "🪨", "🌲"],
  "Anecdotes and Jokes": ["😄", "🎭", "🪁", "🎪", "🃏"],
  "Formula Tales": ["🔁", "🪜", "🧩", "🎶", "♾️"],
};

const FALLBACK_EMOJI = "📖";

/**
 * ATU divisions the generated tier never draws from, whatever the screens say.
 *
 * This is not squeamishness about a few entries — it is that the *organising
 * principle* of these two divisions is at odds with what the app promises.
 *
 * - **Anecdotes and Jokes (1200–1999)** are funny because someone is made
 *   ridiculous, cuckolded, robbed or exposed. `SYSTEM_PROMPT` says "Humour is
 *   warm and never mean. Nobody is humiliated." There is no version of ATU 1417,
 *   "The Cut-off Nose", that honours both.
 * - **Tales of the Stupid Ogre (1000–1199)** turn on tricking, injuring or
 *   working an ogre to death. The featured tier's dragon is *worried, not
 *   wicked*, and is met with kindness; this division is the opposite bargain.
 *
 * The hand-curated tier reached the same verdict long before this script
 * existed: 3 of its 50 entries come from Anecdotes and none at all from the
 * ogre tales. A term list will always be one unfamiliar word behind — ATU 1417
 * got through the first version of the screen because nobody had thought to
 * deny "cut off" — so the structural rule does the work the word list cannot.
 */
const EXCLUDED_DIVISIONS: ReadonlySet<string> = new Set([
  "Anecdotes and Jokes",
  "Tales of the Stupid Ogre",
]);

/** The ATU number ranges those two divisions occupy. */
const EXCLUDED_RANGES: ReadonlyArray<readonly [number, number]> = [
  [1000, 1199], // Tales of the Stupid Ogre
  [1200, 1999], // Anecdotes and Jokes
];

/**
 * True when a tale type falls in an excluded division by *either* the label the
 * knowledge base gives it or the range its number falls in.
 *
 * Both, because the two disagree in the data — ATU 934D1 is filed under
 * Realistic Tales while its number sits in the Formula range — and a single
 * disagreement in the other direction would be a silent hole.
 */
function isExcludedDivision(atu: string, division: string): boolean {
  if (EXCLUDED_DIVISIONS.has(division)) return true;
  const n = parseInt(atu, 10);
  if (!Number.isFinite(n)) return true; // unparseable: fail closed
  return EXCLUDED_RANGES.some(([lo, hi]) => n >= lo && n <= hi);
}

function emojiFor(atu: string, division: string): string {
  const palette = DIVISION_EMOJI[division];
  if (!palette?.length) return FALLBACK_EMOJI;
  let hash = 0;
  for (const ch of atu) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

/** A stable, readable id from the canonical title, disambiguated by number. */
function idFor(atu: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .slice(0, 6)
    .join("-");
  const suffix = atu.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return slug ? `atu-${suffix}-${slug}` : `atu-${suffix}`;
}

/**
 * True when the knowledge-base export this script reads from is present.
 *
 * `kb/export/` is gitignored and takes a Postgres pipeline to produce, so it is
 * absent in CI and in any fresh clone. Without this guard `--check` sees zero
 * motif rows, decides every candidate has no motif data, and reports the
 * committed file as out of date — which is how it failed the first CI run on
 * this branch. `scripts/sync-atu-index.ts` has always no-opped this way; these
 * two now match it.
 */
function exportPresent(): boolean {
  return REQUIRED_EXPORTS.every((name) => existsSync(resolve(EXPORT_DIR, name)));
}

function readJsonl<T>(name: string): T[] {
  const path = resolve(EXPORT_DIR, name);
  if (!existsSync(path)) return [];
  const out: T[] = [];
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (line.trim()) out.push(JSON.parse(line) as T);
  }
  return out;
}

interface Selected extends Candidate {
  id: string;
  emoji: string;
  blurb?: string;
}

export function select(): { kept: Selected[]; dropped: Record<string, number> } {
  const candidates: Candidate[] = JSON.parse(
    readFileSync(CANDIDATES_PATH, "utf8"),
  ).candidates;

  const advisory = new Set<string>();
  for (const m of readJsonl<{ code: string; content_advisory: string | null }>(
    "motifs.jsonl",
  )) {
    if (m.content_advisory) advisory.add(m.code);
  }

  const motifs = new Map<string, Map<string, string>>();
  for (const e of readJsonl<{
    tale_type_code: string;
    motif_code: string;
    motif_label: string;
  }>("tale-type-motifs.jsonl")) {
    let m = motifs.get(e.tale_type_code);
    if (!m) motifs.set(e.tale_type_code, (m = new Map()));
    m.set(e.motif_code, e.motif_label);
  }

  const blurbs: Record<string, { blurb?: string; verdict?: string }> =
    existsSync(BLURBS_PATH)
      ? JSON.parse(readFileSync(BLURBS_PATH, "utf8")).entries ?? {}
      : {};

  const dropped = {
    excludedDivision: 0,
    noMotifData: 0,
    contentAdvisory: 0,
    motifLabelScreen: 0,
    reviewedUnsafe: 0,
  };
  const kept: Selected[] = [];
  const seenIds = new Set<string>();

  for (const c of candidates) {
    if (isExcludedDivision(c.atu, c.division)) {
      dropped.excludedDivision++;
      continue;
    }
    const ms = motifs.get(c.atu);
    if (!ms || ms.size === 0) {
      dropped.noMotifData++;
      continue;
    }
    if ([...ms.keys()].some((code) => advisory.has(code))) {
      dropped.contentAdvisory++;
      continue;
    }
    if ([...ms.values()].some((label) => unsafeTermsIn(label).length > 0)) {
      dropped.motifLabelScreen++;
      continue;
    }
    // An optional reviewed pass can veto, but never resurrect: a type the
    // deterministic screen rejected is already gone by this point.
    const reviewed = blurbs[c.atu];
    if (reviewed?.verdict && reviewed.verdict !== "safe") {
      dropped.reviewedUnsafe++;
      continue;
    }
    // A reviewed blurb still has to pass the screen on its own text.
    const blurb =
      reviewed?.blurb && unsafeTermsIn(reviewed.blurb).length === 0
        ? reviewed.blurb
        : undefined;

    let id = idFor(c.atu, c.canonicalTitle);
    while (seenIds.has(id)) id += "-alt";
    seenIds.add(id);

    kept.push({ ...c, id, emoji: emojiFor(c.atu, c.division), blurb });
  }

  kept.sort((a, b) => a.atu.localeCompare(b.atu, "en", { numeric: true }));
  return { kept, dropped };
}

function render(kept: Selected[]): string {
  const rows = kept
    .map((e) => {
      const parts = [
        `id: ${JSON.stringify(e.id)}`,
        `atu: ${JSON.stringify(e.atu)}`,
        `title: ${JSON.stringify(e.canonicalTitle)}`,
        `emoji: ${JSON.stringify(e.emoji)}`,
      ];
      if (e.blurb) parts.push(`blurb: ${JSON.stringify(e.blurb)}`);
      return `  { ${parts.join(", ")} },`;
    })
    .join("\n");

  return `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by \`npm run catalogue:build\` from the ATU knowledge base's
 * license-filtered export. Every entry here survived, in order:
 *
 *   1. the stem screen in \`lib/safety.ts\` applied to its canonical title;
 *   2. having any motif data at all (no data means no way to check, which is
 *      treated as a rejection, not a pass);
 *   3. carrying no motif with a knowledge-base content advisory;
 *   4. the same stem screen applied to every one of its motif labels.
 *
 * Titles are the canonical scholarly titles from the knowledge base, carried
 * verbatim — unlike the hand-authored tiers, nothing here is retitled for
 * children, because nobody has read these tales to retitle them honestly.
 *
 * \`blurb\` is present only where \`data/atu-blurbs.reviewed.json\` supplies a
 * reviewed one. Most entries have none, and the catalogue shows the ATU number
 * and division instead of inventing a description.
 *
 * These tale types are offered but not vouched for the way the featured ones
 * are. What keeps a story from them gentle is \`SYSTEM_PROMPT\` in
 * \`lib/prompt.ts\`, which applies to every tale regardless of type.
 */

export interface AtuExtendedEntry {
  id: string;
  atu: string;
  title: string;
  emoji: string;
  blurb?: string;
}

/** ${kept.length} generated tale types, in ATU order. */
export const ATU_EXTENDED: readonly AtuExtendedEntry[] = [
${rows}
];
`;
}

function main(): number {
  const check = process.argv.includes("--check");

  if (!exportPresent()) {
    console.log(
      `build-catalogue: no knowledge-base export under ${EXPORT_DIR}; leaving ` +
        `lib/atu-extended.ts as it stands. Run \`cd kb && atukb publish && ` +
        `atukb export\` first.`,
    );
    return 0;
  }

  if (!existsSync(CANDIDATES_PATH)) {
    console.error(
      `build-catalogue: no candidates at ${CANDIDATES_PATH}. ` +
        `Run \`npm run catalogue:propose\` first.`,
    );
    return 1;
  }

  const { kept, dropped } = select();
  const rendered = render(kept);
  const existing = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, "utf8") : "";

  console.log(
    `build-catalogue: ${kept.length} generated entries\n` +
      `  dropped — excluded division  : ${dropped.excludedDivision}\n` +
      `  dropped — no motif data      : ${dropped.noMotifData}\n` +
      `  dropped — content advisory   : ${dropped.contentAdvisory}\n` +
      `  dropped — motif label screen : ${dropped.motifLabelScreen}\n` +
      `  dropped — reviewed as unsafe : ${dropped.reviewedUnsafe}\n` +
      `  with a reviewed blurb        : ${kept.filter((k) => k.blurb).length}`,
  );

  if (check) {
    if (rendered !== existing) {
      console.error(
        "build-catalogue: lib/atu-extended.ts is out of date. Run `npm run catalogue:build`.",
      );
      return 1;
    }
    console.log("build-catalogue: lib/atu-extended.ts is up to date.");
    return 0;
  }

  if (rendered !== existing) {
    writeFileSync(OUTPUT_PATH, rendered, "utf8");
    console.log(`build-catalogue: wrote ${OUTPUT_PATH}`);
  }
  return 0;
}

process.exit(main());
