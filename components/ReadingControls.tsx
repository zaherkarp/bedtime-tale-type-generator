"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_PREFS,
  TEXT_SCALES,
  clampScaleIndex,
  loadPrefs,
  savePrefs,
  scaleFor,
  type ReadingPrefs,
} from "@/lib/reading";
import { BTN_ICON } from "./ui";

/**
 * Reading preferences, applied to the document rather than to a subtree.
 *
 * `--story-scale` and `data-deep-night` both land on `<html>` so the print
 * stylesheet and the starfield can respond too, and so the setting survives
 * navigating from the generator to the library.
 */
export function useReadingPrefs() {
  const [prefs, setPrefs] = useState<ReadingPrefs>(DEFAULT_PREFS);
  const [mounted, setMounted] = useState(false);

  // Read after mount: localStorage does not exist during SSR, and applying a
  // stored scale during render would mismatch the server's markup.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setPrefs(loadPrefs());
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.style.setProperty("--story-scale", String(scaleFor(prefs.scaleIndex)));
    if (prefs.deepNight) root.dataset.deepNight = "true";
    else delete root.dataset.deepNight;
  }, [prefs, mounted]);

  const update = useCallback((next: Partial<ReadingPrefs>) => {
    setPrefs((cur) => savePrefs({ ...cur, ...next }));
  }, []);

  return { prefs, update, mounted };
}

/**
 * Keep the screen awake while a story is on it.
 *
 * A phone that locks itself two paragraphs from "goodnight" is the single most
 * annoying thing this app could do, and the API is cheap. Feature-detected —
 * Safari only shipped it recently and it is absent on desktop Firefox.
 */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let cancelled = false;

    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          void lock.release();
          return;
        }
        lockRef.current = lock;
      } catch {
        // Denied, or the tab is not visible. Not worth telling anyone about.
      }
    };

    // The lock is dropped whenever the tab is hidden, so re-take it on return.
    const onVisibility = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [active]);
}

export default function ReadingControls({
  prefs,
  update,
}: {
  prefs: ReadingPrefs;
  update: (next: Partial<ReadingPrefs>) => void;
}) {
  const atMin = prefs.scaleIndex <= 0;
  const atMax = prefs.scaleIndex >= TEXT_SCALES.length - 1;

  return (
    <div
      className="no-print flex items-center gap-2"
      role="group"
      aria-label="Reading settings"
    >
      <button
        type="button"
        data-testid="text-smaller"
        onClick={() => update({ scaleIndex: clampScaleIndex(prefs.scaleIndex - 1) })}
        disabled={atMin}
        className={BTN_ICON}
        aria-label="Smaller text"
      >
        <span aria-hidden="true" className="text-sm">
          A
        </span>
      </button>
      <button
        type="button"
        data-testid="text-larger"
        onClick={() => update({ scaleIndex: clampScaleIndex(prefs.scaleIndex + 1) })}
        disabled={atMax}
        className={BTN_ICON}
        aria-label="Larger text"
      >
        <span aria-hidden="true" className="text-xl">
          A
        </span>
      </button>
      <button
        type="button"
        data-testid="deep-night-toggle"
        onClick={() => update({ deepNight: !prefs.deepNight })}
        aria-pressed={prefs.deepNight}
        className={BTN_ICON}
        aria-label="Deep night mode"
        title="Deep night — dim everything further"
      >
        <span aria-hidden="true">{prefs.deepNight ? "🌑" : "🌙"}</span>
      </button>
    </div>
  );
}
