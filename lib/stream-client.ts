import type { TaleRequest } from "./schema";

export type TaleErrorCode =
  | "invalid"
  | "setup"
  | "rate_limit"
  | "overloaded"
  | "connection"
  | "refusal"
  | "api"
  | "unknown";

export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (code: TaleErrorCode) => void;
}

/** Friendly, child-appropriate copy for each error code. */
export const ERROR_MESSAGES: Record<TaleErrorCode, string> = {
  invalid: "Something in the story details needs a tweak. Please check and try again.",
  setup: "The storyteller is still getting ready. (An ANTHROPIC_API_KEY needs to be set up.)",
  rate_limit: "So many bedtime stories tonight! Please wait a moment and try again.",
  overloaded: "The storyteller is a little sleepy right now. Please try again in a moment.",
  connection: "We couldn't reach the storyteller. Please check your connection and try again.",
  refusal: "Let's try that with slightly different details — the storyteller wasn't sure about that one.",
  api: "Something went a bit sideways. Please try again.",
  unknown: "Something unexpected happened. Please try again.",
};

function codeFromStatus(status: number): TaleErrorCode {
  if (status === 400) return "invalid";
  if (status === 503) return "setup";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "overloaded";
  return "unknown";
}

/**
 * POST a tale request and drive the NDJSON stream into the callbacks.
 * Aborting via `signal` resolves quietly without calling onError.
 */
export async function streamTale(
  req: TaleRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/tale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal,
    });
  } catch (err) {
    if (isAbort(err)) return;
    callbacks.onError("connection");
    return;
  }

  if (!res.ok || !res.body) {
    callbacks.onError(codeFromStatus(res.status));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line) dispatch(line, callbacks);
      }
    }
    const tail = buffer.trim();
    if (tail) dispatch(tail, callbacks);
  } catch (err) {
    if (isAbort(err)) return;
    callbacks.onError("connection");
  }
}

function dispatch(line: string, callbacks: StreamCallbacks): void {
  let event: unknown;
  try {
    event = JSON.parse(line);
  } catch {
    return;
  }
  if (typeof event !== "object" || event === null) return;
  const e = event as { t?: string; text?: string; code?: string };
  if (e.t === "delta" && typeof e.text === "string") {
    callbacks.onDelta(e.text);
  } else if (e.t === "done") {
    callbacks.onDone();
  } else if (e.t === "error") {
    callbacks.onError((e.code as TaleErrorCode) ?? "unknown");
  }
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}
