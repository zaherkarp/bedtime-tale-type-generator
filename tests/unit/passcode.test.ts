import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * `lib/passcode.ts` derives its signing key from `PARENT_PASSCODE`, so each
 * test sets the env and then imports a *fresh* copy of the module.
 *
 * `vi.resetModules()` rather than a cache-busting query string: Vite resolves
 * `lib/passcode.ts?0.123` as an unknown file type and refuses to strip the
 * TypeScript from it.
 */
async function load(passcode?: string) {
  if (passcode === undefined) delete process.env.PARENT_PASSCODE;
  else process.env.PARENT_PASSCODE = passcode;
  vi.resetModules();
  return import("@/lib/passcode");
}

const ORIGINAL = process.env.PARENT_PASSCODE;

beforeEach(() => delete process.env.PARENT_PASSCODE);
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.PARENT_PASSCODE;
  else process.env.PARENT_PASSCODE = ORIGINAL;
});

describe("passcode gate", () => {
  it("is open when no passcode is configured", async () => {
    const m = await load(undefined);
    expect(m.isLockEnabled()).toBe(false);
    // This is what keeps local dev and the Playwright suite working untouched.
    expect(m.isUnlocked(undefined)).toBe(true);
    expect(m.isUnlocked("anything at all")).toBe(true);
  });

  it("treats an all-whitespace passcode as no passcode", async () => {
    const m = await load("   ");
    expect(m.isLockEnabled()).toBe(false);
  });

  it("locks once a passcode is configured", async () => {
    const m = await load("open-sesame");
    expect(m.isLockEnabled()).toBe(true);
    expect(m.isUnlocked(undefined)).toBe(false);
    expect(m.isUnlocked("")).toBe(false);
    expect(m.isUnlocked("not-a-token")).toBe(false);
  });

  it("accepts a token it just issued", async () => {
    const m = await load("open-sesame");
    const token = m.issueToken();
    expect(m.verifyToken(token)).toBe(true);
    expect(m.isUnlocked(token)).toBe(true);
  });

  it("rejects an expired token", async () => {
    const m = await load("open-sesame");
    const issuedAt = 1_000_000;
    const token = m.issueToken(issuedAt);
    expect(m.verifyToken(token, issuedAt + 1000)).toBe(true);
    expect(m.verifyToken(token, issuedAt + m.TOKEN_TTL_MS + 1)).toBe(false);
  });

  it("rejects a token whose expiry has been tampered with", async () => {
    const m = await load("open-sesame");
    const token = m.issueToken();
    const [, signature] = token.split(".");
    // Push the expiry far into the future, keeping the original signature.
    const forged = `${Date.now() + 10 ** 12}.${signature}`;
    expect(m.verifyToken(forged)).toBe(false);
  });

  it("rejects malformed tokens without throwing", async () => {
    const m = await load("open-sesame");
    for (const bad of ["", ".", "abc", "abc.def", ".sig", "123", "123.", "n.n"]) {
      expect(m.verifyToken(bad), bad).toBe(false);
    }
  });

  it("invalidates old tokens when the passcode changes", async () => {
    const before = await load("first-code");
    const token = before.issueToken();
    expect(before.verifyToken(token)).toBe(true);

    // The signing key is derived from the passcode, so changing it is a
    // logout for every device — which is the point of changing it.
    const after = await load("second-code");
    expect(after.verifyToken(token)).toBe(false);
  });

  it("matches the configured passcode and nothing else", async () => {
    const m = await load("open-sesame");
    expect(m.passcodeMatches("open-sesame")).toBe(true);
    expect(m.passcodeMatches("open-sesam")).toBe(false);
    expect(m.passcodeMatches("open-sesame ")).toBe(false);
    expect(m.passcodeMatches("OPEN-SESAME")).toBe(false);
    expect(m.passcodeMatches("")).toBe(false);
    // Length must not be a tell: comparing digests means a wildly wrong guess
    // takes the same path as a nearly-right one.
    expect(m.passcodeMatches("x".repeat(4096))).toBe(false);
  });

  it("never matches when the app is open", async () => {
    const m = await load(undefined);
    expect(m.passcodeMatches("")).toBe(false);
    expect(m.passcodeMatches("anything")).toBe(false);
  });

  it("sets a cookie a browser cannot read, and only marks it secure on https", async () => {
    const m = await load("open-sesame");
    expect(m.cookieOptions(true)).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
    // Reaching the dev server from a phone on the same wifi is plain http; a
    // `secure` cookie there would simply never be stored.
    expect(m.cookieOptions(false).secure).toBe(false);
  });
});
