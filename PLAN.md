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
  with read-aloud, save-to-library, print, and regenerate.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test` (31 unit tests), `npm run build`
  all pass. Unit tests cover the registry integrity, schema accept/reject,
  prompt assembly + injection framing, length mapping, and story parsing.
- `npm run test:e2e` (Playwright, mock mode) covers the happy path
  (pick → fill → streamed story → save → library), the empty-library state, and
  a gentle error state.
- CI (`.github/workflows/ci.yml`) runs lint → typecheck → unit tests → build on
  every push and PR. (E2e runs locally against mock mode.)

## Backlog (not built)

Surprise-me tale roulette · a faster Haiku "quick tale" mode · share-as-image ·
localisation · accounts and shared libraries · richer TTS voices · rate limiting
and auth for public deployments.
