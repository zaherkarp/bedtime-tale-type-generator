import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * WCAG 2.1 contrast-ratio audit for the app's colour tokens (app/globals.css).
 *
 * Everything here is derived from the CSS at test time — no hex values are
 * hardcoded — so a future palette tweak that reintroduces a contrast failure
 * fails this suite instead of shipping silently. See the deep-night
 * accessibility audit this test codifies for the full pair-by-pair math.
 *
 * Backgrounds model real usage: cards are `bg-surface/NN` composited over the
 * starfield's brightest radial-gradient stop (the page's real worst-case
 * backdrop), not the flat `--color-night` token in isolation.
 */

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CSS = readFileSync(join(ROOT, "app/globals.css"), "utf8");

type RGB = [number, number, number];

function extractBlock(css: string, selector: RegExp): string {
  const match = css.match(selector);
  if (!match) throw new Error(`CSS block not found for ${selector}`);
  return match[1];
}

function parseTokens(block: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  const re = /--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    tokens[m[1]] = m[2].toLowerCase();
  }
  return tokens;
}

function extractStarfieldPeak(css: string, selector: RegExp): string {
  const block = extractBlock(css, selector);
  const m = block.match(/radial-gradient\([^,]+,\s*(#[0-9a-fA-F]{6})/);
  if (!m) throw new Error(`starfield peak not found for ${selector}`);
  return m[1].toLowerCase();
}

const NORMAL_TOKENS = parseTokens(extractBlock(CSS, /@theme\s*{([^}]*)}/));
const DEEP_OVERRIDES = parseTokens(
  extractBlock(CSS, /:root\[data-deep-night="true"\]\s*{([^}]*)}/),
);
const DEEP_TOKENS = { ...NORMAL_TOKENS, ...DEEP_OVERRIDES };

const NORMAL_PEAK = extractStarfieldPeak(CSS, /\.starfield\s*{([^}]*)}/);
const DEEP_PEAK = extractStarfieldPeak(
  CSS,
  /:root\[data-deep-night="true"\]\s*\.starfield\s*{([^}]*)}/,
);

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function compositeOver(fg: RGB, alpha: number, bg: RGB): RGB {
  return fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha))) as RGB;
}

function relativeLuminance(rgb: RGB): number {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: RGB, b: RGB): number {
  const [lA, lB] = [relativeLuminance(a), relativeLuminance(b)];
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

/** The real backgrounds content actually sits on: composited cards over the starfield peak. */
function buildBackgrounds(tokens: Record<string, string>, peakHex: string) {
  const page = hexToRgb(peakHex);
  const surface = hexToRgb(tokens["surface"]);
  const amber = hexToRgb(tokens["amber"]);
  const white: RGB = [255, 255, 255];
  const card50 = compositeOver(surface, 0.5, page);
  const card70 = compositeOver(surface, 0.7, page);
  return {
    page,
    card40: compositeOver(surface, 0.4, page),
    card50,
    card60: compositeOver(surface, 0.6, page),
    card70,
    surface2: hexToRgb(tokens["surface-2"]),
    badgeWhite5: compositeOver(white, 0.05, card50),
    badgeAmber15: compositeOver(amber, 0.15, card70),
    amber,
    amberSoft: hexToRgb(tokens["amber-soft"]),
    lavender: hexToRgb(tokens["lavender"]),
  };
}

type Backgrounds = ReturnType<typeof buildBackgrounds>;

interface Pair {
  description: string;
  fgToken: string;
  fgAlpha?: number;
  bgKey: keyof Backgrounds;
  threshold: number;
}

/**
 * Every foreground/background token pair actually used together in the app,
 * with the WCAG threshold each usage falls under (4.5:1 normal text,
 * 3:1 large text / UI components). Sourced from a manual audit of
 * app/**, components/** against app/globals.css.
 */
const PAIRS: Pair[] = [
  // -- Normal text, 4.5:1 --
  { description: "brand links & headings on the page", fgToken: "starlight", bgKey: "page", threshold: 4.5 },
  { description: "details summary text", fgToken: "starlight", bgKey: "card40", threshold: 4.5 },
  { description: "story title and body", fgToken: "starlight", bgKey: "card50", threshold: 4.5 },
  { description: "passcode prompt / library card text", fgToken: "starlight", bgKey: "card60", threshold: 4.5 },
  { description: "tale type picker / browse cards", fgToken: "starlight", bgKey: "card70", threshold: 4.5 },
  { description: "credits attribution blockquote", fgToken: "starlight", fgAlpha: 0.9, bgKey: "card50", threshold: 4.5 },
  { description: "active chip / age-band labels", fgToken: "starlight", bgKey: "surface2", threshold: 4.5 },
  { description: "footers and inactive chips", fgToken: "muted", bgKey: "page", threshold: 4.5 },
  { description: "optional-field labels", fgToken: "muted", bgKey: "card40", threshold: 4.5 },
  { description: "credits body prose", fgToken: "muted", bgKey: "card50", threshold: 4.5 },
  { description: "library card meta text", fgToken: "muted", bgKey: "card60", threshold: 4.5 },
  { description: "tale type category, browse card meta", fgToken: "muted", bgKey: "card70", threshold: 4.5 },
  { description: "active age-band hint", fgToken: "muted", bgKey: "surface2", threshold: 4.5 },
  { description: "\"from the index\" badge", fgToken: "muted", bgKey: "badgeWhite5", threshold: 4.5 },
  { description: "brand mark / credits headings", fgToken: "lavender", bgKey: "page", threshold: 4.5 },
  { description: "tale type picker accent label", fgToken: "lavender", bgKey: "card60", threshold: 4.5 },
  { description: "licence badge", fgToken: "lavender", bgKey: "badgeWhite5", threshold: 4.5 },
  { description: "hero name error", fgToken: "amber", bgKey: "page", threshold: 4.5 },
  { description: "stream-ended note", fgToken: "amber", bgKey: "card50", threshold: 4.5 },
  { description: "passcode prompt accent", fgToken: "amber", bgKey: "card70", threshold: 4.5 },
  { description: "\"featured\" badge", fgToken: "amber", bgKey: "badgeAmber15", threshold: 4.5 },
  { description: "brand link hover", fgToken: "amber-soft", bgKey: "page", threshold: 4.5 },
  // -- Non-text / UI components, 3:1 (WCAG 1.4.11) --
  { description: "focus ring on the page", fgToken: "amber", bgKey: "page", threshold: 3 },
  { description: "focus ring on a card", fgToken: "amber", bgKey: "card70", threshold: 3 },
  { description: "active chip/age-band border", fgToken: "amber", fgAlpha: 0.7, bgKey: "card60", threshold: 3 },
  { description: "active chip/age-band border on its own fill", fgToken: "amber", fgAlpha: 0.7, bgKey: "surface2", threshold: 3 },
  { description: "streaming caret", fgToken: "amber", bgKey: "card50", threshold: 3 },
  { description: "primary button fill", fgToken: "amber", bgKey: "page", threshold: 3 },
  { description: "accent button fill", fgToken: "lavender", bgKey: "page", threshold: 3 },
];

/**
 * Buttons that render night-coloured text on a solid token fill
 * (`ui.ts`'s BTN_PRIMARY / BTN_ACCENT). Modelled separately since the
 * "background" there is an opaque token, not a composited card.
 */
const BUTTON_TEXT_PAIRS: { description: string; bgKey: "amber" | "amberSoft" | "lavender" }[] = [
  { description: "primary button text on amber fill", bgKey: "amber" },
  { description: "primary button hover text on amber-soft fill", bgKey: "amberSoft" },
  { description: "accent button text on lavender fill (Save to Library)", bgKey: "lavender" },
];

/**
 * Borders that are known to sit well under 3:1 in both themes
 * (`white/10`, `white/12`, `white/15` utility borders across ~15 sites).
 * Every control that relies on one of these also carries a compliant
 * starlight label and a compliant amber focus ring, so the control stays
 * identifiable without the border passing on its own. Tracked here rather
 * than asserted so this suite doesn't silently claim full 1.4.11 coverage;
 * follow-up is introducing a `--color-border` token.
 */
const KNOWN_FAILING_BORDERS = "white/10, white/12, white/15 borders — measured ~1.25-1.59:1, both themes";
void KNOWN_FAILING_BORDERS;

function resolveColor(tokens: Record<string, string>, token: string, alpha: number | undefined, bg: RGB): RGB {
  const rgb = hexToRgb(tokens[token]);
  return alpha === undefined ? rgb : compositeOver(rgb, alpha, bg);
}

describe.each([
  ["normal", NORMAL_TOKENS, NORMAL_PEAK],
  ["deep-night", DEEP_TOKENS, DEEP_PEAK],
] as const)("%s theme contrast", (_themeName, tokens, peak) => {
  const backgrounds = buildBackgrounds(tokens, peak);

  it.each(PAIRS)("$description meets $threshold:1", ({ fgToken, fgAlpha, bgKey, threshold }) => {
    const bg = backgrounds[bgKey];
    const fg = resolveColor(tokens, fgToken, fgAlpha, bg);
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(threshold);
  });

  it.each(BUTTON_TEXT_PAIRS)("$description meets 4.5:1", ({ bgKey }) => {
    const bg = backgrounds[bgKey];
    const fg = hexToRgb(tokens["night"]);
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("deep-night dimming intent", () => {
  it("every overridden token is darker in deep-night than in normal dark", () => {
    for (const token of Object.keys(DEEP_OVERRIDES)) {
      const normalLuminance = relativeLuminance(hexToRgb(NORMAL_TOKENS[token]));
      const deepLuminance = relativeLuminance(hexToRgb(DEEP_OVERRIDES[token]));
      expect(deepLuminance, `--color-${token} should be dimmer in deep-night`).toBeLessThan(normalLuminance);
    }
  });
});

describe("no alpha-diluted muted/lavender text", () => {
  it("app/** and components/** never modify text-muted or text-lavender opacity", () => {
    const offenders: string[] = [];
    const re = /(?:placeholder:)?text-(?:muted|lavender)\/\d+/;

    function walk(dir: string) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(path);
        } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
          const contents = readFileSync(path, "utf8");
          if (re.test(contents)) offenders.push(path);
        }
      }
    }

    walk(join(ROOT, "app"));
    walk(join(ROOT, "components"));

    // Diluting `--color-muted` or `--color-lavender` with an opacity modifier
    // pushes an already-marginal token below WCAG AA in deep-night mode —
    // see the deep-night contrast audit. Use the full-opacity token instead.
    expect(offenders).toEqual([]);
  });
});

describe("palette completeness", () => {
  it("every token referenced by the pair table exists in @theme", () => {
    const referenced = new Set(PAIRS.map((p) => p.fgToken));
    for (const token of referenced) {
      expect(NORMAL_TOKENS[token], `--color-${token} missing from @theme`).toBeDefined();
    }
  });

  it("deep-night overrides a non-empty set of tokens", () => {
    expect(Object.keys(DEEP_OVERRIDES).length).toBeGreaterThan(0);
  });
});
