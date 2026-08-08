"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BTN_SECONDARY } from "@/components/ui";
import {
  searchAtu,
  PRESENT_CATEGORIES,
  ATU_INDEX,
  type AtuCategory,
} from "@/lib/atu-index";

type CategoryFilter = AtuCategory | "All";

/**
 * How many cards to put on the page at once.
 *
 * Rendering all several hundred costs a visible pause on a phone. The number
 * is chosen to comfortably clear the hand-authored catalogue — the 12 featured
 * types plus the 50 curated ones, which sort first — so the entries somebody
 * actually vouched for are never behind a "show more".
 */
const PAGE_SIZE = 72;

export default function BrowsePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const results = useMemo(
    () => searchAtu({ query, category, featuredOnly }),
    [query, category, featuredOnly],
  );

  // Any change to the filters starts the list over from the top.
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setLimit(PAGE_SIZE);
  }, [query, category, featuredOnly]);

  const shown = results.slice(0, limit);

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
          href="/library"
          className="rounded-lg px-3 py-2 text-sm text-lavender hover:bg-surface/60"
        >
          My Library
        </Link>
      </header>

      <main className="flex-1">
        <h1 className="mb-2 font-serif text-3xl text-starlight sm:text-4xl">
          Browse tale types
        </h1>
        <p className="mb-6 text-muted">
          {ATU_INDEX.length} gentle tale types from the Aarne–Thompson–Uther
          folktale index. Pick one to tell tonight.
        </p>

        {/*
          The search field sticks to the top on a phone: with a catalogue this
          size, scrolling back up to retype is the most common thing you do.
        */}
        <div className="sticky top-0 z-10 -mx-1 mb-4 bg-night/85 px-1 py-2 backdrop-blur">
          <input
            type="search"
            data-testid="browse-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ATU number, or category…"
            className="min-h-12 w-full rounded-xl border border-white/15 bg-surface/70 px-4 py-3 text-base text-starlight placeholder:text-muted focus:border-amber/60 focus:outline-none"
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Chip active={category === "All"} onClick={() => setCategory("All")}>
            All
          </Chip>
          {PRESENT_CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" data-testid="browse-count">
            {results.length} {results.length === 1 ? "tale type" : "tale types"}
          </p>
          <Chip
            active={featuredOnly}
            onClick={() => setFeaturedOnly((v) => !v)}
            testId="browse-featured-toggle"
          >
            ★ Featured only
          </Chip>
        </div>

        {results.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-surface/50 p-8 text-center text-muted sm:p-10">
            No tale types match that search. Try another word.
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/?type=${e.id}`}
                    data-testid={`browse-type-${e.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-white/10 bg-surface/70 p-5 shadow-lg transition hover:-translate-y-0.5 hover:border-amber/50 hover:bg-surface-2/80"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-4xl" aria-hidden="true">
                        {e.emoji}
                      </span>
                      {e.tier === "featured" && (
                        <span
                          className="rounded-full bg-amber/15 px-2 py-0.5 text-xs font-medium text-amber"
                          title="Featured — a hand-crafted telling"
                        >
                          ★ Featured
                        </span>
                      )}
                      {e.tier === "extended" && (
                        <span
                          className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-muted"
                          title="From the folklore index. Nobody has hand-checked this one — the storyteller's gentleness rules still apply."
                        >
                          From the index
                        </span>
                      )}
                    </div>
                    <span className="font-serif text-xl text-starlight">
                      {e.title}
                    </span>
                    <span className="mt-0.5 text-xs font-medium uppercase tracking-wide text-lavender">
                      ATU {e.atu} · {e.category}
                    </span>
                    {e.blurb && (
                      <span className="mt-1 text-sm text-muted">{e.blurb}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {limit < results.length && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  data-testid="browse-more"
                  onClick={() => setLimit((n) => n + PAGE_SIZE)}
                  className={BTN_SECONDARY}
                >
                  Show more ({results.length - limit} left)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-10 pb-4 text-center text-xs text-muted">
        <Link href="/credits" className="hover:text-lavender">
          Sources &amp; credits
        </Link>
        <span className="mx-2">·</span>
        Sweet dreams. Every tale ends in sleep. 💫
      </footer>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-testid={testId}
      className={`min-h-10 rounded-full border px-4 py-2 text-sm transition ${
        active
          ? "border-amber/70 bg-surface-2 text-starlight"
          : "border-white/15 text-muted hover:border-white/25"
      }`}
    >
      {children}
    </button>
  );
}
