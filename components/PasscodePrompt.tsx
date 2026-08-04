"use client";

import { useState } from "react";
import { BTN_PRIMARY } from "./ui";

/**
 * The gate a deployed copy shows when `PARENT_PASSCODE` is set and this device
 * has not been unlocked yet.
 *
 * It is a door, not a login: one shared code, no username, no account. The
 * passcode goes straight to `/api/unlock` and never near `localStorage` — the
 * only thing that persists is the httpOnly cookie the server sets, which the
 * page itself cannot read.
 */
export default function PasscodePrompt({ onUnlocked }: { onUnlocked: () => void }) {
  const [passcode, setPasscode] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "wrong">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode.trim() || state === "checking") return;
    setState("checking");
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        setPasscode("");
        setState("idle");
        onUnlocked();
        return;
      }
      setState("wrong");
    } catch {
      setState("wrong");
    }
  }

  return (
    <form
      onSubmit={submit}
      data-testid="passcode-prompt"
      className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-surface/70 p-6 text-center sm:p-8"
    >
      <p className="mb-2 text-4xl" aria-hidden="true">
        🌙
      </p>
      <h2 className="mb-2 font-serif text-2xl text-starlight">
        The storyteller is asleep
      </h2>
      <p className="mb-6 text-sm text-muted">
        Enter the passcode to wake it. This phone will stay unlocked.
      </p>

      <label htmlFor="passcode" className="sr-only">
        Passcode
      </label>
      <input
        id="passcode"
        data-testid="passcode-input"
        type="password"
        inputMode="text"
        autoComplete="current-password"
        value={passcode}
        onChange={(e) => {
          setPasscode(e.target.value);
          if (state === "wrong") setState("idle");
        }}
        aria-invalid={state === "wrong"}
        aria-describedby={state === "wrong" ? "passcode-error" : undefined}
        className="mb-3 min-h-12 w-full rounded-xl border border-white/15 bg-surface/60 px-4 py-3 text-center text-base text-starlight focus:border-amber/60 focus:outline-none"
      />

      {state === "wrong" && (
        <p id="passcode-error" data-testid="passcode-error" className="mb-3 text-sm text-amber">
          That isn&apos;t the passcode. Try again.
        </p>
      )}

      <button
        type="submit"
        data-testid="passcode-submit"
        disabled={state === "checking" || !passcode.trim()}
        className={`${BTN_PRIMARY} w-full disabled:cursor-default disabled:opacity-60`}
      >
        {state === "checking" ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
