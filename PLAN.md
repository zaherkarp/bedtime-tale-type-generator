# Project Plan — Bedtime Tale Generator

## What this is

A web app that generates custom children's bedtime stories. A parent or child
picks a **tale type**, names a hero, and the app streams an original story from
the Claude API. The product's defining idea: **every tale is engineered to end
in sleep** — a global "wind-down arc" in the storyteller's prompt makes every
story, regardless of type, decelerate into a soft goodnight.

## Decisions

| Decision           | Choice                                   | Why                                                       |
| ------------------ | ---------------------------------------- | -------------------------------------------------------- |
| Product            | AI bedtime-story generator (web app)     | The best reading of the repo name; shippable end product |
| Stack              | Next.js 16 (App Router) + TS + Tailwind 4 | One deployable full-stack app                            |
| Model              | `claude-opus-4-8`, adaptive thinking, `effort: low` | High-quality prose; low effort keeps latency down |
| Streaming          | Route handler → web `ReadableStream` → NDJSON | Tokens reach the child as they're written           |
| Persistence        | `localStorage` only (no DB)              | Privacy — a child's name never sits on a server          |
| Offline/testing    | `MOCK_TALE=1` canned storyteller         | Hermetic dev, demos, and e2e without an API key          |
| Auth / rate limits | None in MVP                              | Personal-deploy scope; documented as a risk              |
| Second story family | Curated fables in their own registry, not ATU | Fables have provenance ATU cannot express |
| Fable request shape | `kind`-tagged discriminated union, untagged ⇒ `atu` | New family opts in; every old request still validates |
| Fable corpus scale  | 11 hand-modelled seeds, transparent TS data | Architecture is the deliverable; no DB, scraper or CMS |

## Core design

- **Tale-type registry** (`lib/tale-types.ts`) is the heart of the app. Each of
  the 8 entries carries everything the UI and the prompt need (`beats`,
  `signatureElements`, `tone`, `exampleOpener`). Adding a type = one object.
- **Prompt** (`lib/prompt.ts`): a static system persona encodes the wind-down
  arc, per-age safety rules, and the output contract (title as a Markdown H1).
  The per-request brief assembles the registry entry + form fields, with user
  input sanitized and explicitly framed as story _data_, never instructions.
- **API route** (`app/api/tale/route.ts`): zod-validates the request, then
  streams either the live Claude story or the mock, emitting NDJSON events.
  Typed SDK errors and `stop_reason` (`refusal`, `max_tokens`) map to gentle,
  child-appropriate copy.
- **UI**: a `pick → form → streaming story` state machine under a CSS night sky,
  with read-aloud, save-to-library, print, and regenerate. The pick step has two
  doors — Folktale and Fable & wisdom tale — that share the form and everything
  after it.

### The second story family (fables & wisdom tales)

- **Registry** (`lib/fables.ts`): 11 curated traditional fables across seven
  named traditions. Each carries provenance (collection, collector, designation,
  and an honest `confidence` with a note when it is not `high`), `coreBeats` (the
  causal kernel), `themes`, `expansionBeats`, and `adaptation` metadata naming
  its `concerns` and what to preserve / soften / substitute / remove. Structured
  metadata and our own summaries only — never traditional or modern prose.
- **Brief** (`lib/fable-prompt.ts`): three blocks — kernel, adaptation,
  expansion — appended to the same shared tail (details, audience, length,
  injection guard) as an ATU brief. `buildUserBrief()` dispatches between two
  source builders rather than growing a conditional. Provenance is deliberately
  excluded from the brief and asserted absent by a test.
- **Length** (`lib/length.ts`): the same three ids reinterpreted for fables
  (600–800 / 900–1,200 / 1,300–1,600 words, with their own token ceilings), so
  the request shape and saved library entries stay compatible while a fable gets
  the room its expansion grammar needs.
- **Provenance UI** (`components/BehindTheStory.tsx`): a collapsed, parent-facing
  panel shown after the tale, keeping the traditional source, our adaptation and
  the generated story visibly distinct.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test` (198 unit tests), `npm run build`
  all pass. Unit tests cover the registry integrity, schema accept/reject for
  both story families, prompt assembly + injection framing, the fable kernel /
  expansion / adaptation blocks, provenance staying out of the brief, length
  mapping, and story parsing.
- `npm run test:e2e` (Playwright, mock mode, 19 tests) covers the happy path
  (pick → fill → streamed story → save → library), the fable door and its
  provenance panel, the empty-library state, and a gentle error state.
- CI (`.github/workflows/ci.yml`) runs lint → typecheck → unit tests → build on
  every push and PR. (E2e runs locally against mock mode.)

## Backlog (not built)

A browse/search page for the fable corpus once it outgrows one screen · fable
themes as a cross-tradition filter ("tonight, a story about patience") ·
measuring generated fable length against its target band ·
a faster Haiku "quick tale" mode · share-as-image ·
localisation · accounts and shared libraries · richer TTS voices · rate limiting
and auth for public deployments.
