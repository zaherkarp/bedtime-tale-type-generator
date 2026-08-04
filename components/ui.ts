/**
 * Shared control styling.
 *
 * Every button in the app is at least 44px tall, which is the smallest target
 * a thumb hits reliably. Keeping the classes here means the phone-sized tweaks
 * land once instead of in each of the five places that render a button row.
 */

const BTN_BASE =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 " +
  "text-center transition select-none";

/** The single most important action on a screen. */
export const BTN_PRIMARY = `${BTN_BASE} bg-amber font-semibold text-night hover:bg-amber-soft`;

/** A positive action that isn't the primary one — saving, mostly. */
export const BTN_ACCENT =
  `${BTN_BASE} bg-lavender font-semibold text-night hover:brightness-105 ` +
  "disabled:cursor-default disabled:opacity-60";

/** Everything else. */
export const BTN_SECONDARY = `${BTN_BASE} border border-white/15 text-starlight hover:bg-surface-2`;

/**
 * A small square control (font size, close, and friends). Still 44px, because
 * being visually small is not a reason to be hard to tap.
 */
export const BTN_ICON =
  "inline-flex size-11 items-center justify-center rounded-xl border " +
  "border-white/15 text-starlight transition hover:bg-surface-2 " +
  "disabled:cursor-default disabled:opacity-40";
