"use client";

import { useReadingPrefs } from "./ReadingControls";

/**
 * Applies the stored reading preferences to `<html>` on every page.
 *
 * The A−/A+ and deep-night controls only appear on the two screens that show a
 * story, but the preference belongs to the *device*, not to those screens.
 * Without this, walking from a story into the library reset the page to the
 * default size and full brightness — which is precisely the moment you least
 * want the screen to get brighter.
 */
export default function ReadingPrefsBoot() {
  useReadingPrefs();
  return null;
}
