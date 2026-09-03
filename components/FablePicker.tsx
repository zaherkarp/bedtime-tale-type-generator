"use client";

import { useMemo, useState } from "react";
import { FABLES, PRESENT_TRADITIONS, type FableTradition } from "@/lib/fables";
import { FABLE_LENGTHS } from "@/lib/length";

/**
 * The fable half of the first screen.
 *
 * Deliberately not a world map. The eventual "tonight, travel to…" idea needs
 * a corpus far larger than eleven fables to be worth the interaction cost; a
 * tradition filter over a card grid proves the same architecture and is one tap
 * instead of a pan and a zoom at bedtime.
 *
 * Each card shows the parent-facing metadata — tradition, region, themes,
 * approximate length, one-sentence setup — and nothing scholarly. Provenance
 * lives in "Behind the story", after the tale is told.
 */
export default function FablePicker({
  onSelect,
}: {
  onSelect: (fableId: string) => void;
}) {
  const [tradition, setTradition] = useState<FableTradition | "All">("All");

  const shown = useMemo(
    () =>
      tradition === "All"
        ? FABLES
        : FABLES.filter((f) => f.tradition === tradition),
    [tradition],
  );

  function surpriseMe() {
    const pool = shown.length ? shown : FABLES;
    onSelect(pool[Math.floor(Math.random() * pool.length)].id);
  }

  return (
    <section aria-labelledby="fable-heading">
      <h2
        id="fable-heading"
        className="mb-2 text-center font-serif text-3xl text-starlight sm:text-4xl"
      >
        Tonight, travel to…
      </h2>
      <p className="mb-6 text-center text-muted">
        {FABLES.length} traditional fables and wisdom tales, each grown into an
        original bedtime story that still ends in sleep.
      </p>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
        <Chip active={tradition === "All"} onClick={() => setTradition("All")}>
          All traditions
        </Chip>
        {PRESENT_TRADITIONS.map((t) => (
          <Chip key={t} active={tradition === t} onClick={() => setTradition(t)}>
            {t}
          </Chip>
        ))}
        <button
          type="button"
          data-testid="fable-surprise"
          onClick={surpriseMe}
          className="min-h-10 rounded-full border border-amber/50 px-4 py-2 text-sm text-amber transition hover:bg-surface-2"
        >
          ✨ Surprise me
        </button>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((fable) => (
          <li key={fable.id}>
            <button
              type="button"
              data-testid={`fable-${fable.id}`}
              onClick={() => onSelect(fable.id)}
              className="group flex h-full w-full flex-col rounded-2xl border border-white/10 bg-surface/70 p-5 text-left shadow-lg transition hover:-translate-y-0.5 hover:border-amber/50 hover:bg-surface-2/80 focus-visible:border-amber/60"
            >
              <span className="mb-3 text-4xl" aria-hidden="true">
                {fable.emoji}
              </span>
              <span className="font-serif text-xl text-starlight">
                {fable.title}
              </span>
              <span className="mt-0.5 text-xs font-medium uppercase tracking-wide text-lavender">
                {fable.tradition}
                {fable.region ? ` · ${fable.region.split(";")[0]}` : ""}
              </span>
              <span className="mt-2 flex-1 text-sm text-muted">{fable.setup}</span>
              <span className="mt-3 flex flex-wrap gap-1.5">
                {fable.themes.slice(0, 3).map((theme) => (
                  <span
                    key={theme}
                    className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-lavender"
                  >
                    {theme}
                  </span>
                ))}
              </span>
              <span className="mt-3 text-xs text-muted">
                {FABLE_LENGTHS.medium.readAloud} at bedtime length
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
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
