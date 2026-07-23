"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import TaleTypePicker from "@/components/TaleTypePicker";
import StoryForm from "@/components/StoryForm";
import StoryView, { type StoryStatus } from "@/components/StoryView";
import type { TaleRequest } from "@/lib/schema";
import { getTaleType } from "@/lib/tale-types";
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

  function generate(req: TaleRequest) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRequest(req);
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
    const tale = getTaleType(request.taleTypeId);
    const finalTitle =
      title || `${request.heroName}'s ${tale?.label ?? "bedtime tale"}`;
    saveTale({
      taleTypeId: request.taleTypeId,
      taleTypeLabel: tale?.label ?? "Bedtime tale",
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
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 py-6 sm:px-6">
      <header className="no-print mb-8 flex items-center justify-between">
        <button
          type="button"
          onClick={handleNew}
          className="font-serif text-xl text-starlight transition hover:text-amber-soft"
        >
          🌙 Bedtime Tales
        </button>
        <Link
          href="/library"
          data-testid="library-link"
          className="rounded-lg px-3 py-1.5 text-sm text-lavender hover:bg-surface/60"
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

        {step === "story" && (
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
        Sweet dreams. Every tale ends in sleep. 💫
      </footer>
    </div>
  );
}
