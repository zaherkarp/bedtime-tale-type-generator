import { afterEach, describe, expect, it, vi } from "vitest";

import type { TaleRequest } from "../../lib/schema";
import { streamTale } from "../../lib/stream-client";

const request = {
  kind: "atu",
  taleTypeId: "cinderella",
  heroName: "Amara",
  ageBand: "6-8",
  length: "short",
} as TaleRequest;

function callbacks() {
  return {
    onDelta: vi.fn(),
    onDone: vi.fn(),
    onError: vi.fn(),
  };
}

function mockStream(...events: string[]) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(events.map((event) => `${event}\n`).join(""), {
      status: 200,
      headers: { "Content-Type": "application/x-ndjson" },
    }),
  );
}

function mockByteStream(chunks: Uint8Array[]) {
  let close!: () => void;
  let markBytesRead!: () => void;
  const bytesRead = new Promise<void>((resolve) => {
    markBytesRead = resolve;
  });
  let nextChunk = 0;
  const body = new ReadableStream<Uint8Array>(
    {
      start(controller) {
        close = () => controller.close();
      },
      pull(controller) {
        if (nextChunk < chunks.length) {
          controller.enqueue(chunks[nextChunk++]);
        } else {
          // The consumer has requested another read, but EOF is held open.
          markBytesRead();
        }
      },
    },
    { highWaterMark: 0 },
  );
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(body, {
      status: 200,
      headers: { "Content-Type": "application/x-ndjson" },
    }),
  );
  return { bytesRead, close };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("streamTale byte boundaries", () => {
  const text = "Goodnight, Amélie 🌙";
  // Encode once: every schedule carries the same bytes, with no final newline.
  const bytes = new TextEncoder().encode(
    `${JSON.stringify({ t: "delta", text })}\n${JSON.stringify({ t: "done" })}`,
  );
  const newline = bytes.indexOf(0x0a);
  const accent = bytes.indexOf(0xc3);
  const moon = bytes.indexOf(0xf0);

  it.each([
    { name: "one-chunk control", boundaries: [] },
    {
      name: "JSON keys, values, and the record delimiter",
      boundaries: [1, 4, 9, newline, newline + 1, bytes.length - 3],
    },
    { name: "inside a two-byte UTF-8 character", boundaries: [accent + 1] },
    {
      name: "inside a four-byte UTF-8 character",
      boundaries: [moon + 1, moon + 2, moon + 3],
    },
    {
      name: "one byte per chunk",
      boundaries: Array.from({ length: bytes.length - 1 }, (_, i) => i + 1),
    },
  ])("handles $name and an unterminated done record at EOF", async ({ boundaries }) => {
    const chunks = [0, ...boundaries].map((start, i) =>
      bytes.slice(start, boundaries[i] ?? bytes.length),
    );
    const stream = mockByteStream(chunks);
    const cb = callbacks();
    const resolved = vi.fn();
    const result = streamTale(request, cb).then(resolved);

    try {
      await stream.bytesRead;
      expect(cb.onDelta).toHaveBeenCalledExactlyOnceWith(text);
      expect(cb.onDone).not.toHaveBeenCalled();
      expect(cb.onError).not.toHaveBeenCalled();
      expect(resolved).not.toHaveBeenCalled();
    } finally {
      stream.close();
      await result;
    }

    expect(resolved).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(cb.onDelta).toHaveBeenCalledExactlyOnceWith(text);
    expect(cb.onDone).toHaveBeenCalledExactlyOnceWith();
    expect(cb.onDelta.mock.invocationCallOrder[0]).toBeLessThan(
      cb.onDone.mock.invocationCallOrder[0],
    );
    expect(cb.onError).not.toHaveBeenCalled();
  });
});

describe("streamTale terminal events", () => {
  it("turns an EOF without a terminal event into a recoverable connection error", async () => {
    mockStream(JSON.stringify({ t: "delta", text: "Once upon a time" }));
    const cb = callbacks();

    await streamTale(request, cb);

    expect(cb.onDelta).toHaveBeenCalledWith("Once upon a time");
    expect(cb.onDone).not.toHaveBeenCalled();
    expect(cb.onError).toHaveBeenCalledOnce();
    expect(cb.onError).toHaveBeenCalledWith("connection");
  });

  it("does not add an error after a completed stream", async () => {
    mockStream(
      JSON.stringify({ t: "delta", text: "Goodnight" }),
      JSON.stringify({ t: "done" }),
    );
    const cb = callbacks();

    await streamTale(request, cb);

    expect(cb.onDone).toHaveBeenCalledOnce();
    expect(cb.onError).not.toHaveBeenCalled();
  });

  it("reports the first terminal event only", async () => {
    mockStream(
      JSON.stringify({ t: "error", code: "overloaded" }),
      JSON.stringify({ t: "done" }),
    );
    const cb = callbacks();

    await streamTale(request, cb);

    expect(cb.onError).toHaveBeenCalledOnce();
    expect(cb.onError).toHaveBeenCalledWith("overloaded");
    expect(cb.onDone).not.toHaveBeenCalled();
  });
});
