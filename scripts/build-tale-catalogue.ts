/**
 * Generate `lib/tale-types-catalogue.ts` — the client-facing tale-type summary.
 *
 * `lib/tale-types.ts` (plus `lib/tale-types-curated.ts`) hand-authors a full
 * `TaleType` record for each of the 62 featured tale types: the picker-card
 * fields (label, emoji, tagline, ATU number, category) *and* the prompt-only
 * fields that steer generation (beats, signature elements, tone, an example
 * opener). Only `buildUserBrief()` in `lib/prompt.ts` — server-only — ever
 * reads the prompt-only fields. But `lib/atu-index.ts` and the picker and
 * story-form components import the full registry just to read the six
 * picker-card fields, and because `lib/atu-index.ts` is reached from
 * "use client" components, all ~55KB of beats and openers rides along into
 * the browser for nothing.
 *
 * This file is the fix: the same six picker-card fields and nothing else, so
 * client code can import this instead of the full registry. It is generated
 * rather than hand-duplicated so it can never drift from `lib/tale-types.ts` —
 * `tests/unit/tale-types-catalogue.test.ts` checks that this file matches the
 * source and carries none of the prompt-only fields.
 *
 * Run with:  npm run tale-catalogue:build   (add --check to fail instead of writing)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { ORIGINAL_TALE_TYPES, type TaleType } from "../lib/tale-types.ts";
import { CURATED_TALE_TYPES } from "../lib/tale-types-curated.ts";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const OUTPUT_PATH = resolve(REPO_ROOT, "lib/tale-types-catalogue.ts");

function renderRows(types: readonly TaleType[]): string {
  return types
    .map(
      (t) =>
        `  {\n` +
        `    id: ${JSON.stringify(t.id)},\n` +
        `    label: ${JSON.stringify(t.label)},\n` +
        `    atuNumber: ${JSON.stringify(t.atuNumber)},\n` +
        `    category: ${JSON.stringify(t.category)},\n` +
        `    emoji: ${JSON.stringify(t.emoji)},\n` +
        `    tagline: ${JSON.stringify(t.tagline)},\n` +
        `  },`,
    )
    .join("\n");
}

function render(): string {
  return `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by \`npm run tale-catalogue:build\` from \`lib/tale-types.ts\` and
 * \`lib/tale-types-curated.ts\`. Carries the six fields a picker card or the
 * story form needs — never the beats, signature elements, tone, or example
 * opener that steer the prompt. Those stay in the full \`TaleType\` registry,
 * imported only by \`lib/prompt.ts\` and \`lib/mock.ts\` (both server-only), so
 * that prose never rides along into a "use client" bundle.
 */

export interface TaleTypeSummary {
  id: string;
  label: string;
  atuNumber: string;
  category: string;
  emoji: string;
  tagline: string;
}

/** The twelve original tale types, picker-card fields only. */
export const ORIGINAL_TALE_TYPE_SUMMARIES: readonly TaleTypeSummary[] = [
${renderRows(ORIGINAL_TALE_TYPES)}
];

/** The fifty formerly catalogue-only tale types, picker-card fields only. */
export const CURATED_TALE_TYPE_SUMMARIES: readonly TaleTypeSummary[] = [
${renderRows(CURATED_TALE_TYPES)}
];

/** All 62 featured tale types, picker-card fields only. */
export const TALE_TYPE_SUMMARIES: readonly TaleTypeSummary[] = [
  ...ORIGINAL_TALE_TYPE_SUMMARIES,
  ...CURATED_TALE_TYPE_SUMMARIES,
];
`;
}

function main(): number {
  const check = process.argv.includes("--check");
  const rendered = render();
  const existing = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, "utf8") : "";

  if (check) {
    if (rendered !== existing) {
      console.error(
        "build-tale-catalogue: lib/tale-types-catalogue.ts is out of date. Run `npm run tale-catalogue:build`.",
      );
      return 1;
    }
    console.log("build-tale-catalogue: lib/tale-types-catalogue.ts is up to date.");
    return 0;
  }

  if (rendered !== existing) {
    writeFileSync(OUTPUT_PATH, rendered, "utf8");
    console.log(`build-tale-catalogue: wrote ${OUTPUT_PATH}`);
  } else {
    console.log("build-tale-catalogue: lib/tale-types-catalogue.ts already up to date.");
  }
  return 0;
}

process.exit(main());
