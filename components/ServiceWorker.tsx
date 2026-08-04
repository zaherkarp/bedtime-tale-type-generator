"use client";

import { useEffect, useState } from "react";

/**
 * Registers `public/sw.js` and offers the update rather than taking it.
 *
 * A service worker that calls `skipWaiting()` on its own can swap the page's
 * assets out mid-session. In an app whose main screen is a story arriving one
 * word at a time, that is a real way to lose a bedtime. So the new worker sits
 * in `waiting` until someone taps the nudge below.
 */
export default function ServiceWorker() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    // Registering during load competes with the first paint and, more to the
    // point, with the first story request.
    let registration: ServiceWorkerRegistration | undefined;

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        if (registration.waiting) setWaiting(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const installing = registration?.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            // `controller` is null on the very first install; that is not an
            // update, it is this page becoming offline-capable for the first
            // time, and there is nothing to tell anyone about.
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(installing);
            }
          });
        });
      } catch {
        // No service worker (private mode, insecure origin, unsupported).
        // Everything still works; it just will not work offline.
      }
    };

    if (document.readyState === "complete") void register();
    else window.addEventListener("load", () => void register(), { once: true });
  }, []);

  if (!waiting) return null;

  return (
    <div className="no-print fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-xl border border-amber/40 bg-surface-2/95 p-3 shadow-lg backdrop-blur">
      <p className="mb-2 text-sm text-starlight">
        A new version is ready.
      </p>
      <button
        type="button"
        onClick={() => {
          waiting.postMessage("skip-waiting");
          waiting.addEventListener("statechange", () => {
            if (waiting.state === "activated") window.location.reload();
          });
        }}
        className="min-h-10 rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-night hover:bg-amber-soft"
      >
        Reload to update
      </button>
    </div>
  );
}
