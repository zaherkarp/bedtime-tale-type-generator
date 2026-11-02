/**
 * Service worker — offline reading for the saved library.
 *
 * The point is narrow: a tale saved on the sofa should still be readable in a
 * dark bedroom on a phone with no signal. Saved tales already live in
 * `localStorage`, so all that is missing offline is the shell that renders
 * them, and that is what this caches.
 *
 * Three rules, in priority order:
 *
 * 1. **`/api/*` is never touched.** `/api/tale` is a long-lived NDJSON stream
 *    read chunk by chunk; putting a service worker in front of it risks
 *    buffering the body and turning a story that arrives word by word into one
 *    that arrives all at once, several seconds late. Falling through to the
 *    network also means a request can never be answered from a stale cache,
 *    which for a generated story would be nonsense.
 * 2. **Navigations are network-first.** A story app that silently serves
 *    yesterday's build is worse than one that takes a moment. The cache is the
 *    fallback, not the default.
 * 3. **Build assets are cache-first.** Everything under `/_next/static` is
 *    content-hashed, so a hit is always correct and a miss is always a new URL.
 */

const VERSION = "v2";
const SHELL_CACHE = `btg-shell-${VERSION}`;
const ASSET_CACHE = `btg-assets-${VERSION}`;

/** Routes worth having offline. `/library` is the one that really matters. */
const SHELL_ROUTES = ["/", "/library", "/browse", "/credits"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      const assets = await caches.open(ASSET_CACHE);
      const pendingAssets = new Map();
      async function cacheRoute(route) {
        const request = new Request(route, { cache: "reload" });
        const response = await fetch(request);
        if (!response.ok) throw new Error(`shell unavailable: ${route}`);
        const html = await response.clone().text();
        // Next's generated HTML lists the initial scripts, styles and font
        // preloads. They loaded before this worker registered, so a fetch
        // handler alone cannot make the first saved story available offline.
        const urls = [...html.matchAll(/\b(?:src|href)=["'](\/_next\/static\/[^"']+)["']/g)]
          .map((match) => new URL(match[1], self.location.origin).href);
        await Promise.all(urls.map((url) => {
          if (!pendingAssets.has(url)) {
            pendingAssets.set(url, (async () => {
              if (!(await assets.match(url))) await assets.add(url);
            })());
          }
          return pendingAssets.get(url);
        }));
        await shell.put(request, response);
      }
      // Never activate a replacement that cannot hydrate the saved library.
      // Less essential routes may be temporarily absent during deployment.
      await cacheRoute("/library");
      await Promise.all(SHELL_ROUTES.filter((route) => route !== "/library")
        .map((route) => cacheRoute(route).catch(() => {})));
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, ASSET_CACHE]);
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith("btg-") && !keep.has(n)).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

/**
 * The page asks for the update rather than the worker forcing it, so a story
 * that is mid-stream is never reloaded out from under a child.
 */
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Rule 1: the streaming endpoint is none of our business.
  if (url.pathname.startsWith("/api/")) return;

  // Rule 3: hashed build output.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          try {
            const cache = await caches.open(ASSET_CACHE);
            await cache.put(request, response.clone());
          } catch {
            // Storage quota/private-mode failures must not break online use.
          }
        }
        return response;
      })(),
    );
    return;
  }

  // Rule 2: navigations, and everything else same-origin.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            try {
              const cache = await caches.open(SHELL_CACHE);
              await cache.put(request, response.clone());
            } catch {
              // A successful network navigation still wins if storage fails.
            }
          }
          return response;
        } catch {
          const cached =
            (await caches.match(request)) ?? (await caches.match("/library"));
          if (cached) return cached;
          throw new Error("offline and nothing cached");
        }
      })(),
    );
  }
});
