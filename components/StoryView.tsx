"use client";

import { useEffect, useRef, useState } from "react";
import { parseStory, toBlocks } from "@/lib/story";
import { speak, cancelSpeech, isSpeechSupported } from "@/lib/speech";
import StoryArticle from "./StoryArticle";
import BehindTheStory from "./BehindTheStory";
import ReadingControls, { useReadingPrefs, useWakeLock } from "./ReadingControls";
import { BTN_ACCENT, BTN_PRIMARY, BTN_SECONDARY } from "./ui";
import type { Fable } from "@/lib/fables";

export type StoryStatus = "streaming" | "done" | "error";

export default function StoryView({
  raw,
  status,
  errorMessage,
  saved,
  onSave,
  onRegenerate,
  onNew,
  onStop,
  behindTheStory,
}: {
  raw: string;
  status: StoryStatus;
  errorMessage?: string;
  saved: boolean;
  onSave: () => void;
  onRegenerate: () => void;
  onNew: () => void;
  onStop: () => void;
  /** The curated fable this story was grown from, when there is one. */
  behindTheStory?: Fable;
}) {
  const [speaking, setSpeaking] = useState(false);
  const { title, body } = parseStory(raw);
  const speechOK = isSpeechSupported();
  const { prefs, update } = useReadingPrefs();

  // Keep the screen on while the story is being written or read aloud.
  useWakeLock(status === "streaming" || speaking);

  // Always stop any narration when this view goes away.
  useEffect(() => () => cancelSpeech(), []);

  const endRef = useRef<HTMLDivElement | null>(null);
  const followRef = useRef(true);

  // Follow the stream down the page, but stop the moment the reader scrolls up
  // themselves — fighting someone for control of their own scroll position is
  // worse than not following at all.
  useEffect(() => {
    function onScroll() {
      const fromBottom =
        document.documentElement.scrollHeight -
        window.scrollY -
        window.innerHeight;
      followRef.current = fromBottom < 120;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (status !== "streaming" || !followRef.current) return;
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [raw, status]);

  function stopNarration() {
    cancelSpeech();
    setSpeaking(false);
  }

  function toggleReadAloud() {
    if (speaking) {
      cancelSpeech();
      setSpeaking(false);
      return;
    }
    const spoken = [title, body].filter(Boolean).join(". ");
    speak(spoken, { rate: 0.9, onEnd: () => setSpeaking(false) });
    setSpeaking(true);
  }

  // Error with nothing rendered yet: show a gentle error card.
  if (status === "error" && toBlocks(body).length === 0 && !title) {
    return (
      <div
        data-testid="story-error"
        className="mx-auto max-w-xl rounded-2xl border border-amber/30 bg-surface/70 p-6 text-center sm:p-8"
      >
        <p className="mb-2 text-4xl" aria-hidden="true">
          🌙
        </p>
        <p className="mb-6 text-lg text-starlight">{errorMessage}</p>
        <div className="grid grid-cols-1 gap-3 sm:flex sm:justify-center">
          <button
            type="button"
            data-testid="regenerate-button"
            onClick={onRegenerate}
            className={BTN_PRIMARY}
          >
            Try again
          </button>
          <button
            type="button"
            data-testid="new-tale-button"
            onClick={onNew}
            className={BTN_SECONDARY}
          >
            New tale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl" data-testid="story-view">
      <div className="no-print mb-3 flex justify-end">
        <ReadingControls prefs={prefs} update={update} />
      </div>

      <StoryArticle
        title={title}
        body={body}
        streaming={status === "streaming"}
        note={status === "error" ? errorMessage : undefined}
      />
      <div ref={endRef} aria-hidden="true" />

      {/* Actions. A 2-up grid on a phone so nothing orphans onto its own row. */}
      <div className="no-print mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
        {status === "streaming" ? (
          <button
            type="button"
            data-testid="stop-button"
            onClick={onStop}
            className={`${BTN_SECONDARY} col-span-2`}
          >
            Stop
          </button>
        ) : (
          <>
            <button
              type="button"
              data-testid="save-button"
              onClick={onSave}
              disabled={saved}
              className={`${BTN_ACCENT} col-span-2 sm:col-span-1`}
            >
              {saved ? "Saved ✓" : "Save to Library"}
            </button>
            {speechOK && (
              <button
                type="button"
                data-testid="read-aloud-button"
                aria-pressed={speaking}
                onClick={toggleReadAloud}
                className={`${BTN_SECONDARY} col-span-2 sm:col-span-1`}
              >
                {speaking ? "Stop reading" : "Read aloud"}
              </button>
            )}
            <button
              type="button"
              data-testid="regenerate-button"
              onClick={() => {
                stopNarration();
                onRegenerate();
              }}
              className={BTN_SECONDARY}
            >
              Another one
            </button>
            <button
              type="button"
              data-testid="new-tale-button"
              onClick={() => {
                stopNarration();
                onNew();
              }}
              className={BTN_SECONDARY}
            >
              New tale
            </button>
            <button
              type="button"
              data-testid="print-button"
              onClick={() => window.print()}
              className={`${BTN_SECONDARY} col-span-2 sm:col-span-1`}
            >
              Print
            </button>
          </>
        )}
      </div>

      {/*
        Only once the tale has finished. A provenance panel that appears while
        a child is being read to is a distraction; afterwards it is exactly
        where a curious parent looks.
      */}
      {behindTheStory && status !== "streaming" && (
        <BehindTheStory fable={behindTheStory} />
      )}
    </div>
  );
}
