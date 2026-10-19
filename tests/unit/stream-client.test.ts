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

afterEach(() => {
  vi.restoreAllMocks();
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
