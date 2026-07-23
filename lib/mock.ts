import type { TaleRequest } from "./schema";
import { getTaleType } from "./tale-types";

/**
 * A deterministic, offline stand-in for the Claude storyteller.
 *
 * Enabled via the MOCK_TALE=1 environment variable so the app can be run,
 * demoed, and end-to-end tested without an ANTHROPIC_API_KEY. It honours the
 * output contract (H1 title first) and the wind-down arc so the UI behaves
 * exactly as it would with a real story.
 */
export function buildMockTale(request: TaleRequest): string {
  const tale = getTaleType(request.taleTypeId);
  const label = tale?.label ?? "Bedtime";
  const hero = request.heroName || "the little one";
  const setting = request.setting?.trim();
  const where = setting ? ` in ${setting}` : " in a snug little room";

  return `# ${hero} and the Sleepy ${label}

Once, when the sky had pulled its softest blanket of stars across the world, ${hero} was wide awake${where}. The lamp glowed the colour of warm honey, and everything felt calm and kind.

"Tonight," whispered the night, "there is a small and gentle wonder just for you." And so there was. ${hero} followed it on tiptoe, past the curtains and into a story shaped like a ${label.toLowerCase()}.

There were quiet friends to meet and small, kind things to do. Nothing was scary, and nobody was ever in any real trouble. Every little worry was met with a soft word and a softer smile, until it drifted away like a dandelion seed.

Slowly, ever so slowly, the story began to hush. The lights dimmed to the glow of a single candle. The sounds grew smaller — a distant, sleepy hum. ${hero}'s eyes felt heavy and warm.

Back in the snug little room, the blanket was soft and the pillow was cool. ${hero} yawned a wide and wonderful yawn.

Goodnight, ${hero}. Goodnight, little wonder. Goodnight, stars. Sleep now, and dream of gentle things.`;
}
