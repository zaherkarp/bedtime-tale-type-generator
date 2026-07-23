"use client";

import { useEffect, useState } from "react";
import { parseStory, toBlocks } from "@/lib/story";
import { speak, cancelSpeech, isSpeechSupported } from "@/lib/speech";

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
}: {
  raw: string;
  status: StoryStatus;
  errorMessage?: string;
  saved: boolean;
  onSave: () => void;
  onRegenerate: () => void;
  onNew: () => void;
  onStop: () => void;
}) {
  const [speaking, setSpeaking] = useState(false);
  const { title, body } = parseStory(raw);
  const blocks = toBlocks(body);
  const speechOK = isSpeechSupported();

  // Always stop any narration when this view goes away.
  useEffect(() => () => cancelSpeech(), []);

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
  if (status === "error" && blocks.length === 0 && !title) {
    return (
      <div
        data-testid="story-error"
        className="mx-auto max-w-xl rounded-2xl border border-amber/30 bg-surface/70 p-8 text-center"
      >
        <p className="mb-2 text-4xl" aria-hidden="true">
          🌙
        </p>
        <p className="mb-6 text-lg text-starlight">{errorMessage}</p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            data-testid="regenerate-button"
            onClick={onRegenerate}
            className="rounded-xl bg-amber px-5 py-2.5 font-semibold text-night hover:bg-amber-soft"
          >
            Try again
          </button>
          <button
            type="button"
            data-testid="new-tale-button"
            onClick={onNew}
            className="rounded-xl border border-white/15 px-5 py-2.5 text-starlight hover:bg-surface-2"
          >
            New tale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl" data-testid="story-view">
      <article className="printable rounded-2xl border border-white/10 bg-surface/50 p-6 sm:p-10">
        {title && (
          <h1
            data-testid="story-title"
            className="mb-6 text-center font-serif text-3xl text-starlight sm:text-4xl"
          >
            {title}
          </h1>
        )}
        <div className="story-body" data-testid="story-body">
          {blocks.map((block, i) => (
            <p key={i}>
              {block.split("\n").map((line, j, arr) => (
                <span key={j} className="verse-line">
                  {line}
                  {j < arr.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
          ))}
          {status === "streaming" && (
            <span
              data-testid="streaming-indicator"
              className="ml-1 inline-block h-5 w-2 animate-pulse bg-amber align-middle"
              aria-label="The story is still being written"
            />
          )}
        </div>

        {status === "error" && (blocks.length > 0 || title) && (
          <p className="mt-6 text-center text-sm text-amber">{errorMessage}</p>
        )}
      </article>

      {/* Actions */}
      <div className="no-print mt-6 flex flex-wrap items-center justify-center gap-3">
        {status === "streaming" ? (
          <button
            type="button"
            data-testid="stop-button"
            onClick={onStop}
            className="rounded-xl border border-white/15 px-5 py-2.5 text-starlight hover:bg-surface-2"
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
              className="rounded-xl bg-lavender px-5 py-2.5 font-semibold text-night transition hover:brightness-105 disabled:cursor-default disabled:opacity-60"
            >
              {saved ? "Saved ✓" : "Save to Library"}
            </button>
            {speechOK && (
              <button
                type="button"
                data-testid="read-aloud-button"
                aria-pressed={speaking}
                onClick={toggleReadAloud}
                className="rounded-xl border border-white/15 px-5 py-2.5 text-starlight hover:bg-surface-2"
              >
                {speaking ? "Stop reading" : "Read aloud"}
              </button>
            )}
            <button
              type="button"
              data-testid="print-button"
              onClick={() => window.print()}
              className="rounded-xl border border-white/15 px-5 py-2.5 text-starlight hover:bg-surface-2"
            >
              Print
            </button>
            <button
              type="button"
              data-testid="regenerate-button"
              onClick={() => {
                stopNarration();
                onRegenerate();
              }}
              className="rounded-xl border border-white/15 px-5 py-2.5 text-starlight hover:bg-surface-2"
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
              className="rounded-xl border border-white/15 px-5 py-2.5 text-starlight hover:bg-surface-2"
            >
              New tale
            </button>
          </>
        )}
      </div>
    </div>
  );
}
