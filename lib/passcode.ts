import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

/**
 * The shared passcode that stands between a deployed copy of this app and
 * whoever finds the URL.
 *
 * **Server only.** Nothing here may be imported from a client component: the
 * passcode is read from `process.env.PARENT_PASSCODE`, which is not a
 * `NEXT_PUBLIC_` variable and must never be bundled.
 *
 * The threat is mundane and worth being clear about. `/api/tale` spends the
 * deploy owner's Anthropic key on every request and has no rate limiting, so an
 * unauthenticated public deployment is an open invitation to spend someone
 * else's money. This is a door with a lock on it, not an identity system: there
 * are no accounts, everyone shares one code, and it is exactly as strong as the
 * code chosen.
 *
 * When `PARENT_PASSCODE` is unset the app is **open**, which is how it behaves
 * today and what keeps local development and the Playwright suite working with
 * no extra setup.
 */

const COOKIE_NAME = "btg_unlocked";

/** Thirty days: long enough that a phone is unlocked once and then forgotten. */
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** The configured passcode, or undefined when the app is deliberately open. */
export function configuredPasscode(): string | undefined {
  const raw = process.env.PARENT_PASSCODE?.trim();
  return raw ? raw : undefined;
}

/** True when requests must carry a valid unlock cookie. */
export function isLockEnabled(): boolean {
  return configuredPasscode() !== undefined;
}

export { COOKIE_NAME };

/**
 * Compare two secrets without leaking their contents through timing.
 *
 * Both sides are hashed first so the comparison is over two equal-length
 * digests. `timingSafeEqual` throws on a length mismatch, which would itself
 * disclose the passcode's length.
 */
function secretsMatch(a: string, b: string): boolean {
  const salt = "btg-passcode-compare";
  const ha = createHmac("sha256", salt).update(a).digest();
  const hb = createHmac("sha256", salt).update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * The signing key for unlock tokens.
 *
 * Derived from the passcode itself rather than from a second secret, which
 * means changing the passcode invalidates every token already issued — the
 * behaviour you want from "I changed the code". Falls back to a per-process
 * random key when the app is open, so a stray token can never validate.
 */
function signingKey(): Buffer {
  const passcode = configuredPasscode();
  if (!passcode) return EPHEMERAL_KEY;
  return createHmac("sha256", "btg-unlock-token-v1").update(passcode).digest();
}

const EPHEMERAL_KEY = randomBytes(32);

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

/** Mint a token that proves the passcode was entered, valid for TOKEN_TTL_MS. */
export function issueToken(now = Date.now()): string {
  const expiresAt = String(now + TOKEN_TTL_MS);
  return `${expiresAt}.${sign(expiresAt)}`;
}

/** True when the token is well-formed, correctly signed, and unexpired. */
export function verifyToken(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;

  const expiresAt = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!/^\d+$/.test(expiresAt)) return false;

  const expected = sign(expiresAt);
  // Same length by construction (both base64url SHA-256), but guard anyway
  // rather than let a malformed cookie throw out of a route handler.
  if (expected.length !== signature.length) return false;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return false;

  return Number(expiresAt) > now;
}

/** True when the supplied passcode is the configured one. */
export function passcodeMatches(supplied: string): boolean {
  const passcode = configuredPasscode();
  if (!passcode) return false;
  return secretsMatch(supplied, passcode);
}

/**
 * Whether a request may generate a story.
 *
 * Open when no passcode is configured; otherwise the cookie must verify.
 */
export function isUnlocked(cookieValue: string | undefined): boolean {
  if (!isLockEnabled()) return true;
  return verifyToken(cookieValue);
}

/** The `Set-Cookie` attributes for the unlock cookie. */
export function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    // `lax` is enough: the cookie only ever accompanies same-site requests
    // from the app's own fetch, and it keeps the cookie surviving a link tap.
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: Math.floor(TOKEN_TTL_MS / 1000),
  };
}

export { TOKEN_TTL_MS };
