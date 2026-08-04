import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  cookieOptions,
  isLockEnabled,
  isUnlocked,
  issueToken,
  passcodeMatches,
} from "@/lib/passcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Whether this deployment is locked, and whether this device is already in. */
export async function GET() {
  const jar = await cookies();
  return Response.json({
    locked: isLockEnabled(),
    unlocked: isUnlocked(jar.get(COOKIE_NAME)?.value),
  });
}

/**
 * Exchange the shared passcode for a long-lived unlock cookie.
 *
 * The response deliberately says nothing beyond ok/not-ok — no "wrong length",
 * no "close" — and the comparison in `lib/passcode.ts` is timing-safe, so the
 * only way through is to know the code.
 */
export async function POST(req: Request) {
  if (!isLockEnabled()) {
    // Nothing to unlock. Saying so plainly beats minting a token that means
    // nothing and letting the client believe it is holding something.
    return Response.json({ ok: true, locked: false });
  }

  let passcode = "";
  try {
    const body: unknown = await req.json();
    if (typeof body === "object" && body !== null) {
      const value = (body as Record<string, unknown>).passcode;
      if (typeof value === "string") passcode = value;
    }
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (!passcode || !passcodeMatches(passcode)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(
    COOKIE_NAME,
    issueToken(),
    // `secure` would make the cookie unsettable over plain http, which is how
    // you reach the dev server from a phone on the same wifi.
    cookieOptions(new URL(req.url).protocol === "https:"),
  );

  return Response.json({ ok: true, locked: true });
}

/** Forget this device. */
export async function DELETE() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  return Response.json({ ok: true });
}
