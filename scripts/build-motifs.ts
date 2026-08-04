/**
 * Generate `lib/motifs.ts` — a small, screened slice of the Thompson
 * Motif-Index, keyed by the ATU numbers the catalogue actually carries.
 *
 * The knowledge base holds 46,224 motifs and 592,685 tale-type→motif edges.
 * Almost none of that belongs in a phone's JavaScript bundle, and much of it
 * belongs nowhere near a bedtime story, so this script cuts it down hard:
 *
 * - only ATU numbers in the catalogue;
 * - only motifs whose label survives the stem screen in `lib/safety.ts`;
 * - only motifs with no content advisory from the knowledge base;
 * - only *short* labels. Thompson's longer entries are plot summaries rather
 *   than motifs ("A woman leaves her husband's bed and has another woman take
 *   her place…"), and handing one to the storyteller is asking it to retell a
 *   specific tale instead of inventing one;
 * - at most a handful per tale type.
 *
 * ## Licensing
 *
 * These labels are real data with real obligations. The motif labels come from
 * Katja Mellmann's TMI transcription (CC-BY-4.0) and the edges that attach them
 * to tale types come from trilogy (CC-BY-SA-4.0), which is share-alike and
 * contagious. That is why `/credits` exists and is linked from every page
 * footer; it is generated from the same export's `attribution.json`.
 *
 * Run with:  npm run motifs:build   (add --check to fail instead of writing)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { unsafeTermsIn } from "../lib/safety.ts";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const EXPORT_DIR = process.env.ATUKB_EXPORT_DIR ?? resolve(REPO_ROOT, "kb/export");
const OUTPUT_PATH = resolve(REPO_ROOT, "lib/motifs.ts");
const CREDITS_PATH = resolve(REPO_ROOT, "lib/credits.ts");

/** Longer than this and it is a plot summary, not a motif. */
const MAX_LABEL = 90;
/** Enough for variety across re-rolls without bloating the bundle. */
const MAX_PER_TYPE = 6;

function readJsonl<T>(name: string): T[] {
  const path = resolve(EXPORT_DIR, name);
  if (!existsSync(path)) return [];
  const out: T[] = [];
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (line.trim()) out.push(JSON.parse(line) as T);
  }
  return out;
}

/** Trim the scholarly full stop and any trailing parenthetical cross-reference. */
function tidy(label: string): string {
  return label
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/\.\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Every ATU number the catalogue carries, read out of the source files by
 * regex rather than by importing them.
 *
 * `lib/atu-index.ts` imports its siblings without file extensions, which
 * TypeScript and Next resolve happily and bare Node ESM does not. Scraping the
 * numbers keeps this script from depending on a bundler, exactly as
 * `scripts/sync-atu-index.ts` already does.
 */
function catalogueCodes(): Set<string> {
  const codes = new Set<string>();
  const read = (rel: string) => readFileSync(resolve(REPO_ROOT, rel), "utf8");
  for (const m of read("lib/atu-index.ts").matchAll(/\batu: "([^"]+)"/g)) codes.add(m[1]);
  for (const m of read("lib/atu-extended.ts").matchAll(/\batu: "([^"]+)"/g)) codes.add(m[1]);
  for (const m of read("lib/tale-types.ts").matchAll(/\batuNumber: "ATU\s+([^"]+)"/g)) {
    codes.add(m[1]);
  }
  return codes;
}

function build(): Map<string, Array<{ code: string; label: string }>> {
  const wanted = catalogueCodes();

  const advisory = new Set<string>();
  for (const m of readJsonl<{ code: string; content_advisory: string | null }>(
    "motifs.jsonl",
  )) {
    if (m.content_advisory) advisory.add(m.code);
  }

  const byType = new Map<string, Array<{ code: string; label: string }>>();
  const seen = new Map<string, Set<string>>();

  for (const e of readJsonl<{
    tale_type_code: string;
    motif_code: string;
    motif_label: string;
    sequence_position: number;
  }>("tale-type-motifs.jsonl")) {
    if (!wanted.has(e.tale_type_code)) continue;
    if (advisory.has(e.motif_code)) continue;

    const label = tidy(e.motif_label);
    if (!label || label.length > MAX_LABEL) continue;
    if (unsafeTermsIn(label).length > 0) continue;

    let list = byType.get(e.tale_type_code);
    if (!list) byType.set(e.tale_type_code, (list = []));
    let codes = seen.get(e.tale_type_code);
    if (!codes) seen.set(e.tale_type_code, (codes = new Set()));

    if (codes.has(e.motif_code)) continue;
    if (list.length >= MAX_PER_TYPE) continue;
    codes.add(e.motif_code);
    list.push({ code: e.motif_code, label });
  }

  return byType;
}

function render(byType: Map<string, Array<{ code: string; label: string }>>): string {
  const keys = [...byType.keys()].sort((a, b) =>
    a.localeCompare(b, "en", { numeric: true }),
  );
  const total = keys.reduce((n, k) => n + byType.get(k)!.length, 0);

  const body = keys
    .map((k) => {
      const rows = byType
        .get(k)!
        .map((m) => `    { code: ${JSON.stringify(m.code)}, label: ${JSON.stringify(m.label)} },`)
        .join("\n");
      return `  ${JSON.stringify(k)}: [\n${rows}\n  ],`;
    })
    .join("\n");

  return `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by \`npm run motifs:build\` from the ATU knowledge base's
 * license-filtered export. ${total} motifs across ${keys.length} tale types.
 *
 * A *motif* is the smallest recurring unit folklorists index — "grateful
 * animal helper", "magic object", "the youngest succeeds". These are the real
 * ones recorded against each tale type, filtered to those short and gentle
 * enough to hand a bedtime storyteller.
 *
 * Attribution is required and is shown at \`/credits\`: motif labels come from
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
${body}
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
`;
}

/**
 * Emit `lib/credits.ts` from the export's `attribution.json`.
 *
 * This lives here rather than in its own script because the obligation and the
 * data arrive together: shipping motif labels is exactly what makes the
 * attribution mandatory. Generating them in one step means you cannot add the
 * data and forget the credit.
 */
function renderCredits(): string {
  const path = resolve(EXPORT_DIR, "attribution.json");
  const raw = existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf8")) as {
        note: string;
        sources: Array<Record<string, unknown>>;
      })
    : { note: "", sources: [] };

  return `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by \`npm run motifs:build\` from the knowledge base's
 * \`attribution.json\`. These are the attributions the reviewed licences of the
 * contributing sources actually require, not a courtesy list, which is why the
 * app renders them at /credits rather than burying them in a README.
 *
 * \`openQuestions\` are unresolved upstream rights questions the knowledge base
 * recorded against a source. They are surfaced rather than hidden: a source can
 * be licensed permissively by its transcriber and still rest on a compilation
 * whose status nobody has established.
 */

export interface CreditedSource {
  key: string;
  name: string;
  homepageUrl: string;
  license: string;
  /** The attribution text the licence requires, where it requires one. */
  attribution: string | null;
  upstreamRightsStatus: string;
  openQuestions: readonly string[];
}

export const CREDITS_NOTE = ${JSON.stringify(raw.note)};

export const CREDITED_SOURCES: readonly CreditedSource[] = [
${raw.sources
  .map(
    (s) => `  {
    key: ${JSON.stringify(s.key)},
    name: ${JSON.stringify(s.name)},
    homepageUrl: ${JSON.stringify(s.homepage_url)},
    license: ${JSON.stringify(s.license_reviewed_spdx)},
    attribution: ${JSON.stringify(s.attribution_text_required ?? null)},
    upstreamRightsStatus: ${JSON.stringify(s.upstream_rights_status)},
    openQuestions: ${JSON.stringify(s.open_questions ?? [])},
  },`,
  )
  .join("\n")}
];
`;
}

function main(): number {
  const check = process.argv.includes("--check");
  const byType = build();
  const rendered = render(byType);
  const existing = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, "utf8") : "";
  const total = [...byType.values()].reduce((n, l) => n + l.length, 0);

  console.log(
    `build-motifs: ${total} motifs across ${byType.size} tale types ` +
      `(of ${catalogueCodes().size} in the catalogue)`,
  );

  const credits = renderCredits();
  const existingCredits = existsSync(CREDITS_PATH)
    ? readFileSync(CREDITS_PATH, "utf8")
    : "";

  if (check) {
    if (rendered !== existing || credits !== existingCredits) {
      console.error(
        "build-motifs: lib/motifs.ts or lib/credits.ts is out of date. " +
          "Run `npm run motifs:build`.",
      );
      return 1;
    }
    console.log("build-motifs: lib/motifs.ts and lib/credits.ts are up to date.");
    return 0;
  }
  if (rendered !== existing) {
    writeFileSync(OUTPUT_PATH, rendered, "utf8");
    console.log(`build-motifs: wrote ${OUTPUT_PATH}`);
  }
  if (credits !== existingCredits) {
    writeFileSync(CREDITS_PATH, credits, "utf8");
    console.log(`build-motifs: wrote ${CREDITS_PATH}`);
  }
  return 0;
}

process.exit(main());
