/**
 * Generate a fragment corpus at build time.
 *
 * This is the step with no precedent, and it is worth being plain about why. In
 * every piece of prior art this engine is built from — Improv in *Voyageur*,
 * *The Annals of the Parrigues*, Ink's shuffles, Valve's dialog database — a
 * person wrote the fragments, and wrote them already knowing they were writing
 * interchangeable pieces. Bruno Dias describes that as a distinctly different
 * activity from writing static prose. Asking a model to do it to a tag contract
 * is the unproven half of the architecture, so the prompt below is the real
 * deliverable of this file: it has to demand explicitly what a human fragment
 * author knows implicitly.
 *
 * Three rules the prompt insists on, each of which exists because breaking it
 * produces a specific visible seam:
 *
 * 1. **Interchangeable with its siblings.** Every variant must be able to follow
 *    any variant of the previous beat. A variant that assumes the previous
 *    paragraph mentioned a cat is unusable in the two-thirds of tellings where
 *    it did not.
 * 2. **Invent nothing beyond the declared binds.** Concrete objects — the
 *    helper, the gift, the token — come from `binds` so that every paragraph
 *    agrees about them. A variant that invents its own helper contradicts the
 *    one the telling already chose.
 * 3. **Hand off a state the next beat can pick up.** The spine is fixed, so each
 *    paragraph has to end somewhere the next beat can begin, whichever variant
 *    of it runs.
 *
 * ## What this script does not generate
 *
 * Bind bundles. They are the tale's cast of concrete objects, there are only a
 * handful per tale, and they need the same human review that `lib/fables.ts`
 * already insists on for adaptation decisions: "make it child-friendly" hands
 * the whole judgement to the model on every request, and naming the objects in a
 * reviewed file makes the judgement checkable in a pull request. So bundles live
 * in `data/fragments/<id>.binds.json`, hand-authored, and this script reads them
 * and tells the model which keys it may use.
 *
 * Usage:
 *   npm run fragments:bake -- --id cinderella --age 6-8 --length medium --variants 6
 *   npm run fragments:bake -- --id cinderella --age 6-8 --length medium --dry-run
 *
 * Needs ANTHROPIC_API_KEY, or an `ant auth login` profile, except with --dry-run.
 */

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { getAgeBand } from "../lib/age-bands.ts";
import type { BindBundle, FragmentGroup, FragmentStore, SlotFragments } from "../lib/fragments.ts";
import { getLength } from "../lib/length.ts";
import { planAtu, slotSpace } from "../lib/narration-plan.ts";
import { makeRng } from "../lib/seed.ts";
import {
  ORIGINAL_TALE_TYPES,
  getTaleType,
  type AgeBand,
  type TaleLength,
} from "../lib/tale-types.ts";

/**
 * The model that writes the fragments.
 *
 * Deliberately not the `claude-opus-4-8` that `app/api/tale/route.ts` uses for
 * live storytelling: that choice was made for latency on a request a child is
 * waiting through, and nothing is waiting here. A bake runs in CI, once, for
 * prose that will be read hundreds of times, so it should use the most capable
 * model available rather than the fastest acceptable one.
 */
const MODEL = "claude-opus-5-5";

/** One generated paragraph and the keys it leans on. */
const fragmentSchema = z.object({
  text: z
    .string()
    .describe("One paragraph of bedtime prose, using {{placeholder}} slots only."),
});

const batchSchema = z.object({
  variants: z
    .array(fragmentSchema)
    .describe("Interchangeable paragraphs for this one slot."),
});

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const id = arg("id", "cinderella");
const ageBand = arg("age", "6-8") as AgeBand;
const length = arg("length", "medium") as TaleLength;
const variants = Number(arg("variants", "6"));
const dryRun = flag("dry-run");

const taleType = getTaleType(id) ?? ORIGINAL_TALE_TYPES.find((t) => t.id === id);
if (!taleType) throw new Error(`Unknown tale type: ${id}`);

const outPath = `data/fragments/${id}.${ageBand}.${length}.json`;
// A dry run writes nothing, so the overwrite guard must not block it.
if (existsSync(outPath) && !flag("force") && !dryRun) {
  const existing: FragmentStore = JSON.parse(readFileSync(outPath, "utf8"));
  // A corpus written by hand, or written in a session rather than by this
  // script, is not this script's to silently replace.
  if (existing.provenance.kind === "fixture" || existing.provenance.via === "session") {
    throw new Error(
      `${outPath} was not produced by this script (${existing.provenance.kind}). Pass --force to replace it.`,
    );
  }
}

/**
 * The reviewed cast file: `{ "introducedAt": "spine:1", "bundles": [ ... ] }`.
 *
 * `introducedAt` names the slot whose paragraphs first mention the cast, and so
 * the slot the bundles attach to. It is declared rather than inferred because it
 * is a judgement about this tale: the first slot that *could* mention the helper
 * is not the one that *should*.
 */
interface BindsFile {
  introducedAt: string;
  bundles: BindBundle[];
}

const bindsPath = `data/fragments/${id}.binds.json`;
const binds: BindsFile = existsSync(bindsPath)
  ? JSON.parse(readFileSync(bindsPath, "utf8"))
  : { introducedAt: "", bundles: [] };
const bindKeys = [...new Set(binds.bundles.flatMap((b) => Object.keys(b)))];

// One plan, only to learn the per-slot word target: it is a function of slot
// count, which is a function of length, so any seed gives the same answer.
const referencePlan = planAtu(taleType, ageBand, length, makeRng(1));
const targetWords = referencePlan.slots[0].targetWords;
const slotIds = slotSpace({ spine: taleType.beats, expansions: "positional" }).slotIds;

const SYSTEM = `You write paragraphs for a bedtime story generator that assembles
finished tales from interchangeable pieces. You are not writing a story. You are
writing one slot of one, several times over, so that a program can pick any of
your versions and still get a story that reads as though one person wrote it.

This is a different job from writing prose, and these constraints are the job:

1. INTERCHANGEABLE. Each variant you write must work after ANY variant of the
   preceding beat and before ANY variant of the following one. So: refer to
   nothing a previous paragraph might or might not have mentioned. Open on the
   situation, not on a callback.

2. NO NEW CONCRETE THINGS. Named objects, creatures and places come from
   placeholders, listed below. Do not invent a helper, a gift, a token or a
   place of your own: the telling has already chosen those, and your paragraph
   would contradict them. Scenery, weather, sounds and textures are yours.

3. HAND OFF CLEANLY. End somewhere the next beat can begin from, whatever
   version of it runs.

4. PLACEHOLDERS ONLY. Write {{hero}} for the child's name, {{their}}/{{them}}/
   {{they}} for pronouns — assume they/them and plural agreement, so "{{they}}
   were", never "{{they}} was". Use {{name}} for a first mention of a bound
   object and {{name:the}} for every later mention in the same paragraph.

5. EVERY TALE ENDS IN SLEEP. The whole product is a wind-down arc. Nothing
   frightening, nothing unresolved, no peril. Sentences get shorter and softer as
   the tale goes on, and the final slot lands on a goodnight.

Return exactly the number of variants asked for. Make them genuinely different
from each other: different images, different sentence shapes, different ways in.
Variants that differ only in adjectives are worthless — a reader cannot tell
them apart, and the whole point is that they can.`;

const client = dryRun ? null : new Anthropic();
const slots: SlotFragments[] = [];

for (const slotId of slotIds) {
  const prompt = promptFor(slotId);
  if (dryRun) {
    console.log(`\n${"=".repeat(72)}\n${slotId}\n${"=".repeat(72)}\n${prompt}`);
    continue;
  }

  // `parse()` with `zodOutputFormat` validates the response against the schema,
  // so a malformed batch fails here rather than at assembly time.
  const message = await client!.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: zodOutputFormat(batchSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  // Bedtime prose is about as unlikely to be declined as text gets, but a
  // refusal arrives as HTTP 200 with this stop reason, so it has to be checked
  // before reading content. Server-side `fallbacks` would re-run the request on
  // another model automatically; it is left off here because combining it with
  // `parse()` is not something this script has been able to verify against the
  // live API, and a bake that fails loudly is better than one that quietly
  // changes model.
  if (message.stop_reason === "refusal") {
    throw new Error(`Refused on slot ${slotId}: ${message.stop_details?.explanation ?? ""}`);
  }

  const batch = message.parsed_output;
  if (!batch) throw new Error(`No parsed output for slot ${slotId}`);

  const group: FragmentGroup = {
    tags: [tagsFor(slotId)],
    fragments: batch.variants.map((variant, i) => ({
      id: `${slotId}#g${i}`,
      text: variant.text.trim(),
      ...(slotId === binds.introducedAt ? { binds: binds.bundles } : {}),
    })),
  };

  slots.push({ slotId, groups: [group] });
  console.log(`${slotId}: ${group.fragments.length} variants`);
}

if (dryRun) {
  console.log(`\n(dry run: ${slotIds.length} prompts shown, nothing generated)`);
  process.exit(0);
}

const store: FragmentStore = {
  sourceKind: "atu",
  sourceId: id,
  ageBand,
  length,
  provenance: {
    kind: "generated",
    model: MODEL,
    via: "bake-script",
    at: new Date().toISOString().slice(0, 10),
  },
  slots,
};

mkdirSync("data/fragments", { recursive: true });
writeFileSync(outPath, JSON.stringify(store, null, 2) + "\n");
console.log(`\nWrote ${outPath}. Now run: npm run fragments:audit`);

// ---------------------------------------------------------------------------


function tagsFor(slotId: string): string[] {
  if (slotId === "opener") return ["slot", "opener"];
  if (slotId === "coda") return ["slot", "coda"];
  const [kind, rest] = slotId.split(":");
  return ["slot", kind, rest];
}

function promptFor(slotId: string): string {
  const slot = referencePlan.slots.find((s) => s.id === slotId);
  const intent =
    slot?.intent ??
    (slotId.startsWith("expansion:")
      ? `Linger on the world around beat ${slotId.split("-")[1]}: its sounds, textures, warmth and small kindnesses. Add no new plot.`
      : slotId);

  return [
    `TALE TYPE: ${taleType!.label} (${taleType!.atuNumber}, ${taleType!.category})`,
    `TONE: ${taleType!.tone}`,
    `LISTENER: ${ageBand}. ${getAgeBand(ageBand).guidance}`,
    `TARGET LENGTH: about ${targetWords} words for this paragraph. The whole tale is about ${getLength(length).targetWords} words across ${referencePlan.slots.length} paragraphs.`,
    "",
    "THE FIXED SPINE OF THIS TALE, in order, so you know where your paragraph sits:",
    ...taleType!.beats.map((beat, i) => `  spine:${i}  ${beat}`),
    "",
    `YOUR SLOT: ${slotId}`,
    `WHAT IT NARRATES: ${intent}`,
    "",
    bindKeys.length
      ? `PLACEHOLDERS FOR THIS TALE'S CAST (use these, invent nothing): ${bindKeys
          .map((k) => `{{${k}}}`)
          .join(", ")}`
      : "This tale declares no bound cast, so refer to no named objects at all.",
    "",
    `Write ${variants} interchangeable variants of this one paragraph.`,
  ].join("\n");
}
