import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const origin = "https://story.example";
const asset = "/_next/static/chunks/library.js";
const html = `<html><link rel="stylesheet" href="/_next/static/chunks/app.css"><script src="${asset}"></script></html>`;

function worker(failAsset = false) {
  const entries = new Map<string, Response>();
  const handlers = new Map<string, (event: unknown) => void>();
  const urlOf = (request: Request | string) => new URL(typeof request === "string" ? request : request.url, origin).href;
  const fetch = async (request: Request | string) => {
    const url = urlOf(request);
    return new Response(url.endsWith(".js") || url.endsWith(".css") ? "asset" : html,
      { status: failAsset && url.endsWith(".js") ? 503 : 200 });
  };
  const cache = {
    match: async (request: Request | string) => entries.get(urlOf(request))?.clone(),
    put: async (request: Request | string, response: Response) => { entries.set(urlOf(request), response.clone()); },
    add: async (request: Request | string) => {
      const response = await fetch(request);
      if (!response.ok) throw new Error("asset unavailable");
      entries.set(urlOf(request), response);
    },
  };
  class RelativeRequest extends Request {
    constructor(input: string, init?: RequestInit) { super(new URL(input, origin), init); }
  }
  runInNewContext(readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8"), {
    self: { location: { origin }, addEventListener: (name: string, fn: (event: unknown) => void) => handlers.set(name, fn) },
    caches: { open: async () => cache, match: cache.match },
    fetch, Request: RelativeRequest, URL, Set, Promise,
  });
  return {
    entries,
    install: () => new Promise<void>((resolve, reject) => {
      handlers.get("install")!({ waitUntil: (promise: Promise<void>) => promise.then(resolve, reject) });
    }),
  };
}

describe("offline library worker installation", () => {
  it("caches the library's first-load scripts and styles, not only its HTML", async () => {
    const sw = worker();
    await sw.install();
    expect(sw.entries.has(origin + "/library")).toBe(true);
    expect(sw.entries.has(origin + asset)).toBe(true);
    expect(sw.entries.has(origin + "/_next/static/chunks/app.css")).toBe(true);
  });
  it("does not activate an incomplete library shell after an asset fetch fails", async () => {
    await expect(worker(true).install()).rejects.toThrow();
  });
});
