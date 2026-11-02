import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const origin = "https://story.example";
const asset = "/_next/static/chunks/library.js";
const html = `<html><link rel="stylesheet" href="/_next/static/chunks/app.css"><script src="${asset}"></script></html>`;

function worker(failAsset = false, failWrite = false) {
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
    put: async (request: Request | string, response: Response) => {
      if (failWrite) throw new Error("quota exhausted");
      entries.set(urlOf(request), response.clone());
    },
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
    request: (path: string, mode: string) => new Promise<Response>((resolve, reject) => {
      handlers.get("fetch")!({
        request: { url: origin + path, method: "GET", mode },
        respondWith: (promise: Promise<Response>) => promise.then(resolve, reject),
      });
    }),
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

describe("online responses when offline storage is unavailable", () => {
  it("returns fetched assets despite cache write rejection", async () => {
    const response = await worker(false, true).request(asset, "cors");
    expect(await response.text()).toBe("asset");
  });
  it("returns the new page, not a stale fallback, despite cache write rejection", async () => {
    const sw = worker(false, true);
    sw.entries.set(origin + "/library", new Response("stale page"));
    const response = await sw.request("/library", "navigate");
    expect(await response.text()).toBe(html);
  });
});
