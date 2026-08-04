"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LibraryCard from "@/components/LibraryCard";
import StoryArticle from "@/components/StoryArticle";
import ReadingControls, {
  useReadingPrefs,
  useWakeLock,
} from "@/components/ReadingControls";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/components/ui";
import { loadLibrary, deleteTale, type SavedTale } from "@/lib/library";
import { parseStory } from "@/lib/story";
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
    <div className="page-shell mx-auto flex min-h-dvh max-w-5xl flex-col">
      <header className="mb-8 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="font-serif text-lg text-starlight transition hover:text-amber-soft sm:text-xl"
        >
          🌙 Bedtime Tales
        </Link>
        <Link
          href="/"
          className="rounded-lg px-3 py-2 text-sm text-lavender hover:bg-surface/60"
        >
          + New tale
        </Link>
      </header>

      <main className="flex-1">
        <h1 className="mb-6 font-serif text-3xl text-starlight">My Library</h1>

        {!mounted ? null : tales.length === 0 ? (
          <div
            data-testid="library-empty"
            className="rounded-2xl border border-white/10 bg-surface/50 p-8 text-center sm:p-10"
          >
            <p className="mb-2 text-4xl" aria-hidden="true">
              📚
            </p>
            <p className="mb-6 text-muted">
              No saved tales yet. Your favourites will appear here.
            </p>
            <Link href="/" className={BTN_PRIMARY}>
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
  const speechOK = isSpeechSupported();
  const { prefs, update } = useReadingPrefs();

  useWakeLock(speaking);
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
    <div className="page-shell mx-auto flex min-h-dvh max-w-2xl flex-col">
      <div className="no-print mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg px-2 py-2 text-sm text-lavender hover:underline"
        >
          ← Back to library
        </button>
        <ReadingControls prefs={prefs} update={update} />
      </div>

      <StoryArticle title={title || tale.title} body={body} />

      <div className="no-print mt-6 grid grid-cols-2 gap-3 sm:flex sm:justify-center">
        {speechOK && (
          <button
            type="button"
            onClick={toggleReadAloud}
            aria-pressed={speaking}
            className={`${BTN_SECONDARY} col-span-2 sm:col-span-1`}
          >
            {speaking ? "Stop reading" : "Read aloud"}
          </button>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className={BTN_SECONDARY}
        >
          Print
        </button>
        <button type="button" onClick={onDelete} className={BTN_SECONDARY}>
          Delete
        </button>
      </div>
    </div>
  );
}
