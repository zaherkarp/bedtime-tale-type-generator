"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import TaleTypePicker from "@/components/TaleTypePicker";
import StoryForm from "@/components/StoryForm";
import StoryView, { type StoryStatus } from "@/components/StoryView";
import PasscodePrompt from "@/components/PasscodePrompt";
import type { TaleRequest } from "@/lib/schema";
import { getAtuEntry, ATU_TYPE_IDS } from "@/lib/atu-index";
import { parseStory } from "@/lib/story";
import { saveTale } from "@/lib/library";
import {
  streamTale,
  ERROR_MESSAGES,
  type TaleErrorCode,
} from "@/lib/stream-client";

type Step = "pick" | "form" | "story";

export default function Home() {
  const [step, setStep] = useState<Step>("pick");
  const [taleTypeId, setTaleTypeId] = useState<string>("");
  const [request, setRequest] = useState<TaleRequest | null>(null);

  const [raw, setRaw] = useState("");
  const [status, setStatus] = useState<StoryStatus>("streaming");
  const [errorCode, setErrorCode] = useState<TaleErrorCode | null>(null);
  const [saved, setSaved] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  /** The request held back when the storyteller turned out to be locked. */
  const pendingRef = useRef<TaleRequest | null>(null);

  // Deep-link support: /?type=<id> preselects a tale type and jumps to the form,
  // so the "Browse all tale types" catalogue can hand off to the generator.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("type");
    if (requested && ATU_TYPE_IDS.includes(requested)) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setTaleTypeId(requested);
      setStep("form");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, []);

  function generate(req: TaleRequest) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRequest(req);
    pendingRef.current = req;
    setRaw("");
    setStatus("streaming");
    setErrorCode(null);
    setSaved(false);
    setStep("story");

    void streamTale(
      req,
      {
        onDelta: (text) => setRaw((prev) => prev + text),
        onDone: () => setStatus("done"),
        onError: (code) => {
          setErrorCode(code);
          setStatus("error");
        },
      },
      controller.signal,
    );
  }

  function handleStop() {
    abortRef.current?.abort();
    setStatus((s) => (s === "streaming" ? "done" : s));
  }

  function handleSave() {
    if (!request || saved) return;
    const { title, body } = parseStory(raw);
    const typeLabel = getAtuEntry(request.taleTypeId)?.title ?? "Bedtime tale";
    const finalTitle = title || `${request.heroName}'s ${typeLabel}`;
    saveTale({
      taleTypeId: request.taleTypeId,
      taleTypeLabel: typeLabel,
      heroName: request.heroName,
      ageBand: request.ageBand as never,
      length: request.length as never,
      title: finalTitle,
      text: body ? `# ${finalTitle}\n\n${body}` : raw,
    });
    setSaved(true);
  }

  function handleNew() {
    abortRef.current?.abort();
    setStep("pick");
    setTaleTypeId("");
    setRequest(null);
    setRaw("");
    setSaved(false);
  }

  return (
    <div className="page-shell mx-auto flex min-h-dvh max-w-5xl flex-col">
      <header className="no-print mb-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleNew}
          className="font-serif text-lg text-starlight transition hover:text-amber-soft sm:text-xl"
        >
          🌙 Bedtime Tales
        </button>
        <Link
          href="/library"
          data-testid="library-link"
          className="rounded-lg px-3 py-2 text-sm text-lavender hover:bg-surface/60"
        >
          My Library
        </Link>
      </header>

      <main className="flex-1">
        {step === "pick" && (
          <TaleTypePicker
            onSelect={(id) => {
              setTaleTypeId(id);
              setStep("form");
            }}
          />
        )}

        {step === "form" && (
          <StoryForm
            taleTypeId={taleTypeId}
            onGenerate={generate}
            onBack={() => setStep("pick")}
          />
        )}

        {/*
          A locked storyteller is not an error to apologise for — it is a door.
          Show the door, and pick the story back up the moment it opens.
        */}
        {step === "story" && errorCode === "locked" && (
          <PasscodePrompt
            onUnlocked={() => {
              const req = pendingRef.current;
              if (req) generate(req);
            }}
          />
        )}

        {step === "story" && errorCode !== "locked" && (
          <StoryView
            raw={raw}
            status={status}
            errorMessage={errorCode ? ERROR_MESSAGES[errorCode] : undefined}
            saved={saved}
            onSave={handleSave}
            onRegenerate={() => request && generate(request)}
            onNew={handleNew}
            onStop={handleStop}
          />
        )}
      </main>

      <footer className="no-print mt-10 pb-4 text-center text-xs text-muted">
        <Link href="/credits" className="hover:text-lavender">
          Sources &amp; credits
        </Link>
        <span className="mx-2">·</span>
        Sweet dreams. Every tale ends in sleep. 💫
      </footer>
    </div>
  );
}
