import { z } from "zod";
import { ATU_TYPE_IDS } from "./atu-index";
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

export const taleRequestSchema = z.object({
  taleTypeId: z
    .string()
    .refine((id) => ATU_TYPE_IDS.includes(id), "Unknown tale type."),
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
  /**
   * Thompson Motif-Index codes to weave in. Validated against the motifs this
   * app actually carries — `lib/motifs.ts` is already screened, so an unknown
   * code is either a stale client or someone trying their luck, and neither
   * gets to put arbitrary text into the storyteller's brief.
   */
  motifCodes: z
    .array(z.string().refine((c) => MOTIF_CODES.has(c), "Unknown motif."))
    .max(MAX_MOTIFS, `At most ${MAX_MOTIFS} motifs.`)
    .optional(),
});

/** A validated request to generate a tale. */
export type TaleRequest = z.infer<typeof taleRequestSchema>;
