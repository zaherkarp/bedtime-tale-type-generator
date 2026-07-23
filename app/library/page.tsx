"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LibraryCard from "@/components/LibraryCard";
import { loadLibrary, deleteTale, type SavedTale } from "@/lib/library";
import { parseStory, toBlocks } from "@/lib/story";
import { speak, cancelSpeech, isSpeechSupported } from "@/lib/speech";

export default function LibraryPage() {
  const [mounted, setMounted] = useState(false);
  const [tales, setTales] = useState<SavedTale[]>([]);
  const [selected, setSelected] = useState<SavedTale | null>(null);

  useEffect(() => {
    // localStorage is only available in the browser, so we read it after mount
    // (rather than during render) to stay hydration-safe.
    /* eslint-disable react-hooks/set-state-in-effect */
    setTales(loadLibrary());
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function handleDelete(id: string) {
    setTales(deleteTale(id));
    setSelected((cur) => (cur?.id === id ? null : cur));
  }

  if (selected) {
    return (
      <SavedTaleReader
        tale={selected}
        onBack={() => setSelected(null)}
        onDelete={() => handleDelete(selected.id)}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 py-6 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-xl text-starlight transition hover:text-amber-soft"
        >
          🌙 Bedtime Tales
        </Link>
        <Link
          href="/"
          className="rounded-lg px-3 py-1.5 text-sm text-lavender hover:bg-surface/60"
        >
          + New tale
        </Link>
      </header>

      <main className="flex-1">
        <h1 className="mb-6 font-serif text-3xl text-starlight">My Library</h1>

        {!mounted ? null : tales.length === 0 ? (
          <div
            data-testid="library-empty"
            className="rounded-2xl border border-white/10 bg-surface/50 p-10 text-center"
          >
            <p className="mb-2 text-4xl" aria-hidden="true">
              📚
            </p>
            <p className="mb-6 text-muted">
              No saved tales yet. Your favourites will appear here.
            </p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-amber px-5 py-2.5 font-semibold text-night hover:bg-amber-soft"
            >
              Create a tale
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tales.map((tale) => (
              <li key={tale.id}>
                <LibraryCard
                  tale={tale}
                  onRead={() => setSelected(tale)}
                  onDelete={() => handleDelete(tale.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function SavedTaleReader({
  tale,
  onBack,
  onDelete,
}: {
  tale: SavedTale;
  onBack: () => void;
  onDelete: () => void;
}) {
  const [speaking, setSpeaking] = useState(false);
  const { title, body } = parseStory(tale.text);
  const blocks = toBlocks(body);
  const speechOK = isSpeechSupported();

  useEffect(() => () => cancelSpeech(), []);

  function toggleReadAloud() {
    if (speaking) {
      cancelSpeech();
      setSpeaking(false);
      return;
    }
    speak([title, body].filter(Boolean).join(". "), {
      rate: 0.9,
      onEnd: () => setSpeaking(false),
    });
    setSpeaking(true);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-6 sm:px-6">
      <button
        type="button"
        onClick={onBack}
        className="no-print mb-6 self-start text-sm text-lavender hover:underline"
      >
        ← Back to library
      </button>

      <article className="printable rounded-2xl border border-white/10 bg-surface/50 p-6 sm:p-10">
        <h1 className="mb-6 text-center font-serif text-3xl text-starlight sm:text-4xl">
          {title || tale.title}
        </h1>
        <div className="story-body">
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
        </div>
      </article>

      <div className="no-print mt-6 flex flex-wrap justify-center gap-3">
        {speechOK && (
          <button
            type="button"
            onClick={toggleReadAloud}
            aria-pressed={speaking}
            className="rounded-xl border border-white/15 px-5 py-2.5 text-starlight hover:bg-surface-2"
          >
            {speaking ? "Stop reading" : "Read aloud"}
          </button>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl border border-white/15 px-5 py-2.5 text-starlight hover:bg-surface-2"
        >
          Print
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl border border-white/15 px-5 py-2.5 text-starlight hover:bg-surface-2"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
