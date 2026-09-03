"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import TaleTypePicker from "@/components/TaleTypePicker";
import FablePicker from "@/components/FablePicker";
import StoryForm from "@/components/StoryForm";
import StoryView, { type StoryStatus } from "@/components/StoryView";
import PasscodePrompt from "@/components/PasscodePrompt";
import type { StorySource, TaleRequest } from "@/lib/schema";
import { sourceIdOf } from "@/lib/schema";
import { getFable, FABLE_IDS } from "@/lib/fables";
import { getAtuEntry, ATU_TYPE_IDS } from "@/lib/atu-index";
import { parseStory } from "@/lib/story";
import { saveTale } from "@/lib/library";
import {
  streamTale,
  ERROR_MESSAGES,
  type TaleErrorCode,
} from "@/lib/stream-client";

type Step = "pick" | "form" | "story";

/** The two doors on the first screen. */
type Family = "folktale" | "fable";

export default function Home() {
  const [step, setStep] = useState<Step>("pick");
  const [family, setFamily] = useState<Family>("folktale");
  const [source, setSource] = useState<StorySource | null>(null);
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
  // /?fable=<id> does the same for the fable corpus. `type` keeps its original
  // meaning, so every link ever shared or bookmarked still lands where it did.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const fable = params.get("fable");
    /* eslint-disable react-hooks/set-state-in-effect */
    if (type && ATU_TYPE_IDS.includes(type)) {
      setSource({ kind: "atu", id: type });
      setStep("form");
    } else if (fable && FABLE_IDS.includes(fable)) {
      setFamily("fable");
      setSource({ kind: "fable", id: fable });
      setStep("form");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
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
    // Saved tales keep the one `taleTypeId` field they have always had; for a
    // fable it holds the fable id. The library only ever uses it to look up a
    // label and an emoji, and both lookups already tolerate a miss.
    const sourceId = sourceIdOf(request);
    const typeLabel =
      (request.kind === "fable"
        ? getFable(request.fableId)?.title
        : getAtuEntry(request.taleTypeId)?.title) ?? "Bedtime tale";
    const finalTitle = title || `${request.heroName}'s ${typeLabel}`;
    saveTale({
      taleTypeId: sourceId,
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
    setSource(null);
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
          <>
            {/*
              The two doors. Both lead to the same form and the same wind-down;
              they differ only in which catalogue you choose from, which is the
              whole architectural claim of the fable family.
            */}
            <div
              role="group"
              aria-label="What kind of story tonight?"
              className="mx-auto mb-8 flex max-w-md gap-2 rounded-2xl border border-white/10 bg-surface/50 p-1.5"
            >
              <FamilyTab
                active={family === "folktale"}
                testId="family-folktale"
                onClick={() => setFamily("folktale")}
              >
                Folktale
              </FamilyTab>
              <FamilyTab
                active={family === "fable"}
                testId="family-fable"
                onClick={() => setFamily("fable")}
              >
                Fable &amp; wisdom tale
              </FamilyTab>
            </div>

            {family === "folktale" ? (
              <TaleTypePicker
                onSelect={(id) => {
                  setSource({ kind: "atu", id });
                  setStep("form");
                }}
              />
            ) : (
              <FablePicker
                onSelect={(id) => {
                  setSource({ kind: "fable", id });
                  setStep("form");
                }}
              />
            )}
          </>
        )}

        {step === "form" && source && (
          <StoryForm
            source={source}
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
            /* Provenance is for the parent, after the tale — never part of it. */
            behindTheStory={
              request?.kind === "fable" ? getFable(request.fableId) : undefined
            }
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

function FamilyTab({
  active,
  onClick,
  testId,
  children,
}: {
  active: boolean;
  onClick: () => void;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-surface-2 text-starlight"
          : "text-muted hover:text-starlight"
      }`}
    >
      {children}
    </button>
  );
}
