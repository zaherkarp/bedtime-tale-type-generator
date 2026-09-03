import { z } from "zod";
import { ATU_TYPE_IDS } from "./atu-index";
import { FABLE_IDS } from "./fables";
import { AGE_BAND_ORDER } from "./age-bands";
import { LENGTH_ORDER } from "./length";
import { MOTIF_CODES } from "./motifs";

const OPTIONAL_FIELD_MAX = 120;

/**
 * How many folklore motifs a request may ask for.
 *
 * Three is already a lot to weave into a story that also has to wind down to
 * sleep; more turns the brief into a checklist and the tale into a tour.
 */
export const MAX_MOTIFS = 3;

/** An optional free-text field: trimmed, length-capped, empty → undefined. */
const optionalText = z
  .string()
  .max(OPTIONAL_FIELD_MAX, `Keep it under ${OPTIONAL_FIELD_MAX} characters.`)
  .transform((s) => s.trim())
  .transform((s) => (s.length === 0 ? undefined : s))
  .optional();

/** Everything both story families ask for. */
const commonFields = {
  heroName: z
    .string()
    .transform((s) => s.trim())
    .pipe(
      z
        .string()
        .min(1, "Tell us who the story is about.")
        .max(40, "That name is a little too long."),
    ),
  ageBand: z.enum(AGE_BAND_ORDER as [string, ...string[]]),
  length: z.enum(LENGTH_ORDER as [string, ...string[]]),
  companions: optionalText,
  setting: optionalText,
  lesson: optionalText,
};

/** A request against the ATU tale-type catalogue — the original story family. */
export const atuRequestSchema = z.object({
  kind: z.literal("atu"),
  taleTypeId: z
    .string()
    .refine((id) => ATU_TYPE_IDS.includes(id), "Unknown tale type."),
  /**
   * Thompson Motif-Index codes to weave in. Validated against the motifs this
   * app actually carries — `lib/motifs.ts` is already screened, so an unknown
   * code is either a stale client or someone trying their luck, and neither
   * gets to put arbitrary text into the storyteller's brief.
   *
   * ATU-only: the curated fables carry no motif links, because the Thompson
   * index records motifs against tale types and nobody has done that work for
   * this corpus. Inventing the links would be worse than not having them.
   */
  motifCodes: z
    .array(z.string().refine((c) => MOTIF_CODES.has(c), "Unknown motif."))
    .max(MAX_MOTIFS, `At most ${MAX_MOTIFS} motifs.`)
    .optional(),
  ...commonFields,
});

/** A request against the curated fable corpus in `lib/fables.ts`. */
export const fableRequestSchema = z.object({
  kind: z.literal("fable"),
  fableId: z.string().refine((id) => FABLE_IDS.includes(id), "Unknown fable."),
  ...commonFields,
});

/**
 * The request the generator accepts, tagged by story family.
 *
 * The `preprocess` step is the backward-compatibility hinge: every request the
 * app has ever sent omits `kind` and carries `taleTypeId`, and saved deep links
 * (`/?type=<id>`) still produce exactly that shape. Stamping `kind: "atu"` onto
 * an untagged body keeps all of them valid, while new fable requests opt in
 * explicitly. A discriminated union underneath means a wrong `fableId` still
 * gets the fable schema's error rather than a pile of union failures.
 */
export const taleRequestSchema = z.preprocess(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !("kind" in value)
      ? { ...(value as Record<string, unknown>), kind: "atu" }
      : value,
  z.discriminatedUnion("kind", [atuRequestSchema, fableRequestSchema]),
);

/** A validated request to generate a tale, of either story family. */
export type TaleRequest = z.infer<typeof taleRequestSchema>;
export type AtuTaleRequest = z.infer<typeof atuRequestSchema>;
export type FableTaleRequest = z.infer<typeof fableRequestSchema>;

/**
 * What the UI has picked, before any of the form's details exist.
 *
 * The small boring version of a `StorySource` union: a family tag and an id.
 * It is what the picker hands to the form, and it is all the form needs to
 * know which catalogue to look the selection up in.
 */
export type StorySource =
  | { kind: "atu"; id: string }
  | { kind: "fable"; id: string };

/** The id a request refers to, whichever family it belongs to. */
export function sourceIdOf(request: TaleRequest): string {
  return request.kind === "fable" ? request.fableId : request.taleTypeId;
}
