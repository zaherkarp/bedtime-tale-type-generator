"use client";

import { useState } from "react";
import Link from "next/link";
import {
  searchAtu,
  PRESENT_CATEGORIES,
  ATU_INDEX,
  type AtuCategory,
} from "@/lib/atu-index";

type CategoryFilter = AtuCategory | "All";

export default function BrowsePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const results = searchAtu({ query, category, featuredOnly });

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
          href="/library"
          className="rounded-lg px-3 py-1.5 text-sm text-lavender hover:bg-surface/60"
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

        <input
          type="search"
          data-testid="browse-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, ATU number, or category…"
          className="mb-4 w-full rounded-xl border border-white/15 bg-surface/70 px-4 py-3 text-starlight placeholder:text-muted/70 focus:border-amber/60 focus:outline-none"
        />

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Chip active={category === "All"} onClick={() => setCategory("All")}>
            All
          </Chip>
          {PRESENT_CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
          <button
            type="button"
            data-testid="browse-featured-toggle"
            aria-pressed={featuredOnly}
            onClick={() => setFeaturedOnly((v) => !v)}
            className={`ml-auto rounded-full border px-3 py-1.5 text-sm transition ${
              featuredOnly
                ? "border-amber/70 bg-surface-2 text-starlight"
                : "border-white/15 text-muted hover:border-white/25"
            }`}
          >
            ★ Featured only
          </button>
        </div>

        <p className="mb-4 text-sm text-muted" data-testid="browse-count">
          {results.length} {results.length === 1 ? "tale type" : "tale types"}
        </p>

        {results.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-surface/50 p-10 text-center text-muted">
            No tale types match that search. Try another word.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((e) => (
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
                    {e.featured && (
                      <span
                        className="rounded-full bg-amber/15 px-2 py-0.5 text-xs font-medium text-amber"
                        title="Featured — a hand-crafted telling"
                      >
                        ★ Featured
                      </span>
                    )}
                  </div>
                  <span className="font-serif text-xl text-starlight">
                    {e.title}
                  </span>
                  <span className="mt-0.5 text-xs font-medium uppercase tracking-wide text-lavender/80">
                    ATU {e.atu} · {e.category}
                  </span>
                  <span className="mt-1 text-sm text-muted">{e.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="mt-10 pb-4 text-center text-xs text-muted">
        Sweet dreams. Every tale ends in sleep. 💫
      </footer>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-amber/70 bg-surface-2 text-starlight"
          : "border-white/15 text-muted hover:border-white/25"
      }`}
    >
      {children}
    </button>
  );
}
