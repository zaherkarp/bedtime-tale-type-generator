import Anthropic from "@anthropic-ai/sdk";
import { taleRequestSchema, type TaleRequest } from "@/lib/schema";
import { SYSTEM_PROMPT, buildUserBrief } from "@/lib/prompt";
import { getLength } from "@/lib/length";
import { buildMockTale } from "@/lib/mock";

// The storyteller reads the request body and streams — never statically cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

/** One newline-delimited-JSON event. */
function ndjson(event: TaleEvent): Uint8Array {
  return encoder.encode(JSON.stringify(event) + "\n");
}

/** Events streamed to the client, one JSON object per line. */
type TaleEvent =
  | { t: "delta"; text: string }
  | { t: "done" }
  | { t: "error"; code: TaleErrorCode };

type TaleErrorCode =
  | "rate_limit"
  | "overloaded"
  | "connection"
  | "refusal"
  | "api"
  | "unknown";

function streamHeaders(): HeadersInit {
  return {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-store, no-transform",
    // Discourage proxy buffering so tokens arrive as they are produced.
    "X-Accel-Buffering": "no",
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Split text into small groups of words so mock streaming feels alive. */
function chunkForStreaming(text: string): string[] {
  const pieces = text.match(/\s*\S+/g) ?? [text];
  const chunks: string[] = [];
  for (let i = 0; i < pieces.length; i += 2) {
    chunks.push(pieces.slice(i, i + 2).join(""));
  }
  return chunks;
}

function classifyError(err: unknown): TaleErrorCode {
  if (err instanceof Anthropic.RateLimitError) return "rate_limit";
  if (err instanceof Anthropic.APIConnectionError) return "connection";
  if (err instanceof Anthropic.APIError) {
    return err.status && err.status >= 500 ? "overloaded" : "api";
  }
  return "unknown";
}

/** Offline stand-in used when MOCK_TALE=1 — no API key required. */
function mockStream(req: TaleRequest): ReadableStream<Uint8Array> {
  const chunks = chunkForStreaming(buildMockTale(req));
  return new ReadableStream({
    async start(controller) {
      for (const c of chunks) {
        controller.enqueue(ndjson({ t: "delta", text: c }));
        await sleep(10);
      }
      controller.enqueue(ndjson({ t: "done" }));
      controller.close();
    },
  });
}

/** Live storyteller backed by the Claude API. */
function liveStream(req: TaleRequest): ReadableStream<Uint8Array> {
  const client = new Anthropic();
  const length = getLength(req.length as never);

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: "claude-opus-4-8",
          max_tokens: length.maxTokens,
          thinking: { type: "adaptive" },
          output_config: { effort: "low" },
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildUserBrief(req) }],
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(ndjson({ t: "delta", text: event.delta.text }));
          }
        }

        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(ndjson({ t: "error", code: "refusal" }));
        } else {
          if (final.stop_reason === "max_tokens") {
            controller.enqueue(
              ndjson({
                t: "delta",
                text: "\n\n…and there, gently, we shall leave the rest for tomorrow night. Goodnight.\n",
              }),
            );
          }
          controller.enqueue(ndjson({ t: "done" }));
        }
      } catch (err) {
        controller.enqueue(ndjson({ t: "error", code: classifyError(err) }));
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "That request didn't look right." }, { status: 400 });
  }

  const parsed = taleRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Please check the story details and try again.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }
  const req = parsed.data;

  if (process.env.MOCK_TALE === "1") {
    return new Response(mockStream(req), { headers: streamHeaders() });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        error:
          "The storyteller is still getting ready — an ANTHROPIC_API_KEY needs to be set up first.",
      },
      { status: 503 },
    );
  }

  return new Response(liveStream(req), { headers: streamHeaders() });
}
