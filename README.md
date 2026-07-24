# 🌙 Bedtime Tale Generator

Pick a real folktale **tale type** — a pattern from the Aarne–Thompson–Uther
(ATU) index — name a hero, and get a custom bedtime story that is _engineered to
end in sleep_. Whatever happens earlier — magic, mischief, a quest, a giggle —
every tale decelerates into a soft "goodnight" cadence, so the last line lands
like a held breath before sleep.

Built with **Next.js (App Router) + TypeScript + Tailwind**, streaming stories
live from the **Claude API** (`claude-opus-4-8`).

![The tale-type picker](docs/screenshots/picker.png)

![A generated story ending in sleep](docs/screenshots/story.png)

## Features

- **Real ATU tale types** — every story is shaped after a genuine tale type from
  the [Aarne–Thompson–Uther folktale index](https://en.wikipedia.org/wiki/Aarne%E2%80%93Thompson%E2%80%93Uther_Index),
  gently softened for bedtime.
  - **12 featured types** with a hand-authored narrative shape, signature motifs,
    and voice — Cinderella (ATU 510A), The Dragon-Slayer (300), The Gingerbread
    Man (2025), and nine more.
  - **A browsable catalogue** (`/browse`) of the full bedtime-safe set — search by
    name or ATU number, filter by category, and turn any type into a story. Darker
    or adult tale types are excluded entirely.
- **The wind-down arc** — a global rule in the storyteller's prompt guarantees
  every story softens toward sleep.
- **Age-aware** — 3–5, 6–8, and 9–12 bands tune vocabulary and gentleness.
- **Live streaming** — the story appears token-by-token as it's written.
- **Read aloud** — a slow, soothing text-to-speech voice (Web Speech API).
- **Local Library** — save favourites to your browser (nothing leaves the
  device); re-read, print, or delete them later.
- **Print-friendly** — a clean stylesheet for a bedside printout.
- **Offline mock mode** — run and test the whole app with no API key.

## Quick start

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Get an API key from the [Anthropic Console](https://console.anthropic.com/).

### No key? Run in mock mode

The app runs fully offline with a canned storyteller — perfect for a demo or
for development:

```bash
MOCK_TALE=1 npm run dev
```

Without a key **and** without mock mode, the app still works but shows a gentle
"the storyteller is getting ready" message instead of a story.

## Scripts

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the dev server                          |
| `npm run build`     | Production build                              |
| `npm run start`     | Serve the production build                     |
| `npm run lint`      | ESLint                                        |
| `npm run typecheck` | `tsc --noEmit`                                |
| `npm test`          | Unit tests (Vitest)                           |
| `npm run test:e2e`  | End-to-end tests (Playwright, runs mock mode) |

## How it works

```
app/
  page.tsx            pick → form → streaming story (client state machine)
  browse/page.tsx     searchable ATU catalogue → hands off to the generator
  library/page.tsx    saved tales (localStorage)
  api/tale/route.ts   validate → Claude stream → newline-delimited JSON
components/           TaleTypePicker, StoryForm, StoryView, Starfield, LibraryCard
lib/
  atu-index.ts        the bedtime-safe ATU catalogue (all browsable tale types)
  tale-types.ts       the 12 featured types with rich, hand-authored beats
  prompt.ts           system persona (wind-down + safety) + per-request brief
  schema.ts           zod validation for the request
  stream-client.ts    browser-side NDJSON consumer
  library.ts          localStorage read/write
  speech.ts           read-aloud helpers
  mock.ts             offline stand-in storyteller
```

The API route validates the request, builds a system prompt (persona, the
wind-down arc, age-appropriate safety rules, and the output contract) plus a
per-request brief, then streams the story from Claude as newline-delimited JSON
events (`{"t":"delta","text":"…"}` … `{"t":"done"}`). User-supplied details are
sanitized and clearly framed as story _data_, never instructions.

### Add a new tale type

- **Catalogue-only type:** append one object to `EXTRA_TYPES` in
  `lib/atu-index.ts` — `id`, `atu`, `title`, `emoji`, and a gentle `blurb`. Its
  category is derived from the ATU number. It appears in `/browse` and can be
  generated immediately (the storyteller works from the title + blurb).
- **Featured type:** also append an object to `TALE_TYPES` in `lib/tale-types.ts`
  (same `id`) with a rich `beats`, `signatureElements`, `tone`, and
  `exampleOpener`. It joins the home picker and drives a richer prompt.

Keep it bedtime-safe: no death, peril, horror, cruelty, or romance. Unit tests
enforce that every entry is complete and that featured types stay in sync with
the catalogue.

### Tale-type data & sources

Tale-type numbers and titles follow the ATU index, cross-checked against
CC0 [Wikidata property P2540](https://www.wikidata.org/wiki/Property:P2540) and
the open [`trilogy`](https://github.com/j-hagedorn/trilogy) dataset. Full
public-domain tale texts (for reference) live at
[Ashliman's Folktexts](https://sites.pitt.edu/~dash/folktexts.html) and the
[Multilingual Folk Tale Database](http://www.mftd.org/). The one-line blurbs in
this repo are original, bedtime-framed descriptions — not the academic ATU
summaries.

## Privacy

Stories and any details you enter (like a child's name) are sent to the Claude
API to generate the tale, and saved tales live only in your browser's
`localStorage`. Nothing is stored on a server by this app.

## Deployment

Deploy anywhere that runs a Node.js Next.js server (e.g. Vercel). Set
`ANTHROPIC_API_KEY` in the environment. The `/api/tale` route streams, so it
must run on the Node.js runtime (it already declares this).

> **Note:** This MVP has no rate limiting — the endpoint uses the deploy owner's
> API key. For a public deployment, add authentication or per-IP limiting first.
