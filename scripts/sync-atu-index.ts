/**
 * Generate `lib/atu-canonical.ts` from the knowledge base's license-filtered
 * export.
 *
 * The boundary this keeps is the one the assessment's appendix draws:
 *
 * - **The KB owns the folkloric facts.** ATU number, canonical title and
 *   division are short factual identifiers — the thin-copyright layer §5.3
 *   identifies — and they come from `kb/export/tale-types.jsonl`, which the
 *   publish gate has already license-filtered.
 * - **The app owns the bedtime voice.** `id`, `emoji`, `blurb` and the
 *   user-facing `title` are original content written for this product. The KB
 *   does not model them and this script does not touch them.
 *
 * Those really are two different fields, and running this the first time is
 * what proved it: the canonical title of ATU 328 is "The Boy Steals the Ogre's
 * Treasure", and of ATU 500 "The Name of the Supernatural Helper". Both are
 * right, and neither is what you say to a five-year-old. So the generated file
 * carries the canonical title *alongside* the authored one rather than
 * overwriting it, and `lib/atu-index.ts` exposes both — the same
 * source-label/display-label split §6.5 makes inside the knowledge base, one
 * layer out.
 *
 * Generated output lives in its own file. Nothing here rewrites hand-authored
 * lines, so there is no way for a regex to quietly mangle curated content.
 *
 * Run with:  npm run sync:atu   (add --check to fail instead of writing)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const INDEX_PATH = resolve(REPO_ROOT, "lib/atu-index.ts");
const OUTPUT_PATH = resolve(REPO_ROOT, "lib/atu-canonical.ts");
const EXPORT_PATH = resolve(
  process.env.ATUKB_EXPORT_DIR ?? resolve(REPO_ROOT, "kb/export"),
  "tale-types.jsonl",
);

interface ExportedTaleType {
  code: string;
  edition: string;
  division: string | null;
  preferred_title: string | null;
  preferred_title_source: string | null;
  title_disputed: boolean;
  spdx: string | null;
}

/** The ATU numbers the catalogue actually carries, in file order. */
const CATALOGUE_ATU_RE = /\batu: "([^"]+)"/g;

function catalogueCodes(): string[] {
  const source = readFileSync(INDEX_PATH, "utf8");
  const codes = new Set<string>();
  for (const match of source.matchAll(CATALOGUE_ATU_RE)) codes.add(match[1]);
  // The twelve featured types declare their number as "ATU 510A" instead.
  for (const match of readFileSync(resolve(REPO_ROOT, "lib/tale-types.ts"), "utf8")
    .matchAll(/\batuNumber: "ATU\s+([^"]+)"/g)) {
    codes.add(match[1]);
  }
  return [...codes];
}

function readExport(): Map<string, ExportedTaleType> {
  const byCode = new Map<string, ExportedTaleType>();
  for (const line of readFileSync(EXPORT_PATH, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as ExportedTaleType;
    if (row.preferred_title && !byCode.has(row.code)) byCode.set(row.code, row);
  }
  return byCode;
}

function render(rows: ExportedTaleType[]): string {
  const entries = rows
    .map((r) => {
      const title = JSON.stringify(r.preferred_title);
      const source = JSON.stringify(r.preferred_title_source ?? "unknown");
      const spdx = JSON.stringify(r.spdx ?? "NOASSERTION");
      return (
        `  ${JSON.stringify(r.code)}: { title: ${title}, source: ${source}, ` +
        `spdx: ${spdx}, disputed: ${r.title_disputed} },`
      );
    })
    .join("\n");

  return `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by \`npm run sync:atu\` from the ATU knowledge base's
 * license-filtered export (\`kb/export/tale-types.jsonl\`). Every title here is
 * the canonical scholarly title of the tale type, carried with the source that
 * asserted it and the licence that applies to it.
 *
 * These are NOT the app's user-facing titles. The catalogue's own \`title\` is a
 * bedtime label chosen for children — "Jack and the Beanstalk", not "The Boy
 * Steals the Ogre's Treasure" — and stays hand-authored in \`lib/atu-index.ts\`.
 *
 * \`disputed\` is true where the knowledge base's sources disagree about the
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
${entries}
};
`;
}

function main(): number {
  const check = process.argv.includes("--check");

  if (!existsSync(EXPORT_PATH)) {
    // A no-op without the export, so `npm run build` never depends on Postgres.
    console.log(
      `sync-atu-index: no export at ${EXPORT_PATH}; leaving lib/atu-canonical.ts ` +
        `as it stands. Run \`cd kb && atukb publish && atukb export\` first.`,
    );
    return 0;
  }

  const exported = readExport();
  const codes = catalogueCodes();
  const rows: ExportedTaleType[] = [];
  const missing: string[] = [];

  for (const code of codes) {
    const row = exported.get(code);
    // Wikidata's ATU coverage is incomplete by design (§5.4). A gap is a gap,
    // never a reason to drop a curated catalogue entry.
    if (row?.preferred_title) rows.push(row);
    else missing.push(code);
  }
  rows.sort((a, b) => a.code.localeCompare(b.code, "en", { numeric: true }));

  const rendered = render(rows);
  const existing = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, "utf8") : "";
  const dirty = rendered !== existing;
  const disputed = rows.filter((r) => r.title_disputed);

  console.log(
    `sync-atu-index: ${rows.length} canonical title(s) from the knowledge base, ` +
      `${disputed.length} still disputed between sources, ` +
      `${missing.length} catalogue entr(ies) not yet covered`,
  );
  if (missing.length) console.log(`  not covered: ${missing.join(", ")}`);
  if (disputed.length) {
    console.log(`  disputed: ${disputed.map((r) => r.code).join(", ")}`);
  }

  if (check) {
    if (dirty) {
      console.error(
        "sync-atu-index: lib/atu-canonical.ts is out of date with the knowledge " +
          "base. Run `npm run sync:atu`.",
      );
      return 1;
    }
    console.log("sync-atu-index: lib/atu-canonical.ts is up to date.");
    return 0;
  }

  if (dirty) {
    writeFileSync(OUTPUT_PATH, rendered, "utf8");
    console.log(`sync-atu-index: wrote ${OUTPUT_PATH}`);
  }
  return 0;
}

process.exit(main());
