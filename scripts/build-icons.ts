/**
 * Generate the app's icon set from one procedural source.
 *
 * The mark is a crescent moon over the same night sky the app itself uses, so
 * the home-screen icon and the first screen agree with each other.
 *
 * Two variants, because they are genuinely different pictures:
 *
 * - **any** — a rounded square, drawn to its own edges. This is what a browser
 *   tab and a desktop shortcut show.
 * - **maskable** — full-bleed background with the moon shrunk into the middle
 *   40% of the canvas. Android crops a maskable icon to whatever shape the
 *   launcher likes (circle, squircle, teardrop), and anything outside the
 *   central safe zone can be cut off. A single icon cannot serve both: drawn
 *   for one, it is either clipped or lost in space in the other.
 *
 * Run with:  npm run build:icons
 *
 * `sharp` comes in via Next.js rather than as a direct dependency. That is fine
 * here and only here: this is a manual authoring step whose PNGs are committed,
 * so neither `npm run build` nor CI ever needs it.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const REPO_ROOT = resolve(import.meta.dirname, "..");

const NIGHT = "#0b1026";
const NIGHT_DEEP = "#070b1c";
const AMBER = "#ffc46b";
const AMBER_DEEP = "#e2a24a";
const STARLIGHT = "#e8ecff";

/** Stars, as fractions of the canvas: [x, y, radius, opacity]. */
const STARS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0.16, 0.2, 0.014, 0.9],
  [0.3, 0.36, 0.009, 0.65],
  [0.12, 0.55, 0.011, 0.75],
  [0.24, 0.75, 0.008, 0.55],
  [0.42, 0.86, 0.012, 0.8],
  [0.68, 0.8, 0.009, 0.6],
  [0.84, 0.62, 0.013, 0.85],
  [0.78, 0.26, 0.008, 0.5],
  [0.56, 0.14, 0.011, 0.7],
];

/**
 * @param size      canvas edge in px
 * @param scale     how much of the canvas the mark occupies (1 = fills it)
 * @param rounded   draw a rounded-square plate rather than full bleed
 */
function icon(size: number, scale: number, rounded: boolean): string {
  const c = size / 2;
  // The moon sits slightly above centre — optically centred beats measured
  // centred once the crescent's mass is all on one side.
  const moonR = size * 0.29 * scale;
  const moonX = c - size * 0.02 * scale;
  const moonY = c - size * 0.015 * scale;
  // The bite that makes it a crescent.
  const biteR = moonR * 0.9;
  const biteX = moonX + moonR * 0.46;
  const biteY = moonY - moonR * 0.34;

  const stars = STARS.map(([sx, sy, sr, op]) => {
    // Push the stars outward from the middle in the maskable variant, then let
    // the launcher's crop decide how many survive.
    const x = c + (sx - 0.5) * size * (rounded ? 1 : 1.05);
    const y = c + (sy - 0.5) * size * (rounded ? 1 : 1.05);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(sr * size).toFixed(1)}" fill="${STARLIGHT}" opacity="${op}"/>`;
  }).join("\n    ");

  const radius = rounded ? size * 0.22 : 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${NIGHT}"/>
      <stop offset="100%" stop-color="${NIGHT_DEEP}"/>
    </linearGradient>
    <radialGradient id="glow" cx="${(moonX / size) * 100}%" cy="${(moonY / size) * 100}%" r="55%">
      <stop offset="0%" stop-color="${AMBER}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${AMBER}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="moon" cx="35%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#ffd89b"/>
      <stop offset="55%" stop-color="${AMBER}"/>
      <stop offset="100%" stop-color="${AMBER_DEEP}"/>
    </radialGradient>
    <mask id="crescent">
      <rect width="${size}" height="${size}" fill="black"/>
      <circle cx="${moonX}" cy="${moonY}" r="${moonR}" fill="white"/>
      <circle cx="${biteX}" cy="${biteY}" r="${biteR}" fill="black"/>
    </mask>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#sky)"/>
  <g${rounded ? ` clip-path="inset(0 round ${radius}px)"` : ""}>
    ${stars}
    <rect width="${size}" height="${size}" fill="url(#glow)"/>
    <rect width="${size}" height="${size}" fill="url(#moon)" mask="url(#crescent)"/>
  </g>
</svg>
`;
}

interface Target {
  path: string;
  size: number;
  scale: number;
  rounded: boolean;
}

const TARGETS: Target[] = [
  { path: "public/icon-192.png", size: 192, scale: 1, rounded: true },
  { path: "public/icon-512.png", size: 512, scale: 1, rounded: true },
  // 0.62 keeps the mark inside the central 80% that every launcher mask
  // preserves, with room to spare for the aggressive circular crops.
  { path: "public/icon-maskable-512.png", size: 512, scale: 0.62, rounded: false },
  { path: "app/apple-icon.png", size: 180, scale: 1, rounded: true },
];

async function main(): Promise<void> {
  // The scalable icon Next.js links from <head>, via the app/icon convention.
  const svgPath = resolve(REPO_ROOT, "app/icon.svg");
  writeFileSync(svgPath, icon(512, 1, true), "utf8");
  console.log(`build-icons: wrote ${svgPath}`);

  for (const t of TARGETS) {
    const out = resolve(REPO_ROOT, t.path);
    const svg = Buffer.from(icon(t.size, t.scale, t.rounded), "utf8");
    // Palette mode with dithering *off*. The art is smooth gradients, and
    // dithering scatters them into per-pixel noise that PNG cannot pack —
    // it made the 512 file five times larger, not smaller. Flat banding
    // across 128 colours is invisible at icon size and compresses hard.
    await sharp(svg, { density: 384 })
      .png({ compressionLevel: 9, palette: true, colors: 128, dither: 0, effort: 10 })
      .toFile(out);
    console.log(`build-icons: wrote ${out} (${t.size}×${t.size})`);
  }
}

await main();
