/**
 * Reading preferences — how the story itself is presented, as opposed to what
 * it says.
 *
 * These are deliberately separate from the library: they are settings about a
 * device (this phone, held at arm's length in a dark room), not about a tale,
 * so they persist under their own key and are never attached to a saved story.
 */

const PREFS_KEY = "btg:reading:v1";

/** Multipliers applied to the story's base font size, smallest first. */
export const TEXT_SCALES = [0.85, 1, 1.15, 1.35, 1.6] as const;

export const DEFAULT_SCALE_INDEX = 1;

export interface ReadingPrefs {
  /** Index into TEXT_SCALES. */
  scaleIndex: number;
  /**
   * Dim everything a further notch — for the last few minutes, when a normal
   * dark theme is still too bright to read next to a sleeping child.
   */
  deepNight: boolean;
}

export const DEFAULT_PREFS: ReadingPrefs = {
  scaleIndex: DEFAULT_SCALE_INDEX,
  deepNight: false,
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

/** Clamp an arbitrary index into the scale table. */
export function clampScaleIndex(index: number): number {
  if (!Number.isFinite(index)) return DEFAULT_SCALE_INDEX;
  return Math.min(TEXT_SCALES.length - 1, Math.max(0, Math.round(index)));
}

/** The multiplier for a (possibly out-of-range) index. */
export function scaleFor(index: number): number {
  return TEXT_SCALES[clampScaleIndex(index)];
}

/** Read the stored preferences. Never throws; falls back to the defaults. */
export function loadPrefs(): ReadingPrefs {
  if (!canUseStorage()) return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_PREFS;
    const v = parsed as Record<string, unknown>;
    return {
      scaleIndex: clampScaleIndex(
        typeof v.scaleIndex === "number" ? v.scaleIndex : DEFAULT_SCALE_INDEX,
      ),
      deepNight: v.deepNight === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** Persist preferences, tolerating a full or unavailable store. */
export function savePrefs(prefs: ReadingPrefs): ReadingPrefs {
  if (canUseStorage()) {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Storage full or unavailable — the in-memory value still applies.
    }
  }
  return prefs;
}
