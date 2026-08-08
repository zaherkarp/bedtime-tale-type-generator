"use client";

import { useState } from "react";
import { type AgeBand, type TaleLength } from "@/lib/tale-types";
import { getAtuEntry } from "@/lib/atu-index";
import { AGE_BANDS, AGE_BAND_ORDER } from "@/lib/age-bands";
import { LENGTHS, LENGTH_ORDER } from "@/lib/length";
import { motifsFor } from "@/lib/motifs";
import { MAX_MOTIFS, type TaleRequest } from "@/lib/schema";

export default function StoryForm({
  taleTypeId,
  onGenerate,
  onBack,
}: {
  taleTypeId: string;
  onGenerate: (req: TaleRequest) => void;
  onBack: () => void;
}) {
  const tale = getAtuEntry(taleTypeId);
  const [heroName, setHeroName] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("6-8");
  const [length, setLength] = useState<TaleLength>("medium");
  const [companions, setCompanions] = useState("");
  const [setting, setSetting] = useState("");
  const [lesson, setLesson] = useState("");
  const [touched, setTouched] = useState(false);
  const [motifCodes, setMotifCodes] = useState<string[]>([]);

  // The real Thompson motifs recorded for this tale type, already screened.
  const motifs = tale ? motifsFor(tale.atu) : [];

  const heroMissing = heroName.trim().length === 0;

  function toggleMotif(code: string) {
    setMotifCodes((cur) =>
      cur.includes(code)
        ? cur.filter((c) => c !== code)
        : cur.length >= MAX_MOTIFS
          ? cur
          : [...cur, code],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (heroMissing) return;
    onGenerate({
      taleTypeId,
      heroName: heroName.trim(),
      ageBand,
      length,
      companions: companions.trim() || undefined,
      setting: setting.trim() || undefined,
      lesson: lesson.trim() || undefined,
      motifCodes: motifCodes.length ? motifCodes : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-4xl" aria-hidden="true">
          {tale?.emoji}
        </span>
        <div>
          <p className="font-serif text-2xl text-starlight">{tale?.title}</p>
          {tale && (
            <p className="text-xs font-medium uppercase tracking-wide text-lavender">
              ATU {tale.atu} · {tale.category}
            </p>
          )}
          <button
            type="button"
            data-testid="back-button"
            onClick={onBack}
            className="text-sm text-lavender underline-offset-2 hover:underline"
          >
            ← Choose a different tale
          </button>
        </div>
      </div>

      {/* Hero name */}
      <div className="mb-6">
        <label htmlFor="heroName" className="mb-1 block font-medium text-starlight">
          Who is the story about?
        </label>
        <input
          id="heroName"
          data-testid="hero-name"
          type="text"
          maxLength={40}
          value={heroName}
          onChange={(e) => setHeroName(e.target.value)}
          placeholder="A name, e.g. Amara"
          className="w-full rounded-xl border border-white/15 bg-surface/70 px-4 py-3 text-starlight placeholder:text-muted focus:border-amber/60 focus:outline-none"
          aria-invalid={touched && heroMissing}
          aria-describedby={touched && heroMissing ? "heroName-error" : undefined}
        />
        {touched && heroMissing && (
          <p id="heroName-error" className="mt-1 text-sm text-amber">
            Please tell us who the story is about.
          </p>
        )}
      </div>

      {/* Age band */}
      <fieldset className="mb-6">
        <legend className="mb-2 font-medium text-starlight">
          Who is listening?
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {AGE_BAND_ORDER.map((id) => {
            const band = AGE_BANDS[id];
            const active = ageBand === id;
            return (
              <button
                key={id}
                type="button"
                data-testid={`age-band-${id}`}
                aria-pressed={active}
                onClick={() => setAgeBand(id)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  active
                    ? "border-amber/70 bg-surface-2"
                    : "border-white/12 bg-surface/60 hover:border-white/25"
                }`}
              >
                <span className="block font-medium text-starlight">
                  {band.label}
                </span>
                <span className="block text-xs text-muted">{band.hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Length */}
      <fieldset className="mb-6">
        <legend className="mb-2 font-medium text-starlight">How long?</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {LENGTH_ORDER.map((id) => {
            const len = LENGTHS[id];
            const active = length === id;
            return (
              <button
                key={id}
                type="button"
                data-testid={`length-${id}`}
                aria-pressed={active}
                onClick={() => setLength(id)}
                className={`flex min-h-14 flex-row items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left transition sm:flex-col sm:justify-center sm:text-center ${
                  active
                    ? "border-amber/70 bg-surface-2"
                    : "border-white/12 bg-surface/60 hover:border-white/25"
                }`}
              >
                <span className="font-medium text-starlight">{len.label}</span>
                <span className="text-xs text-muted">{len.readAloud}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Folklore motifs — only where the knowledge base has some for this type */}
      {motifs.length > 0 && (
        <fieldset className="mb-6">
          <legend className="mb-1 font-medium text-starlight">
            Add a traditional twist?
          </legend>
          <p className="mb-3 text-sm text-muted">
            Real threads folklorists recorded for this tale type. Pick up to{" "}
            {MAX_MOTIFS} — or none at all.
          </p>
          <div className="flex flex-wrap gap-2">
            {motifs.map((m) => {
              const active = motifCodes.includes(m.code);
              const full = !active && motifCodes.length >= MAX_MOTIFS;
              return (
                <button
                  key={m.code}
                  type="button"
                  data-testid={`motif-${m.code}`}
                  aria-pressed={active}
                  disabled={full}
                  onClick={() => toggleMotif(m.code)}
                  title={`Thompson Motif-Index ${m.code}`}
                  className={`min-h-10 rounded-full border px-4 py-2 text-left text-sm transition ${
                    active
                      ? "border-amber/70 bg-surface-2 text-starlight"
                      : "border-white/15 text-muted hover:border-white/25"
                  } ${full ? "cursor-default opacity-40" : ""}`}
                >
                  {active ? "✨ " : ""}
                  {m.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Optional details */}
      <details className="mb-6 rounded-xl border border-white/10 bg-surface/40 px-4 py-3">
        <summary className="cursor-pointer font-medium text-starlight">
          Add a few details (optional)
        </summary>
        <div className="mt-4 space-y-4">
          <OptionalField
            id="companions"
            label="Companions or friends"
            placeholder="e.g. a sleepy dragon named Pip"
            value={companions}
            onChange={setCompanions}
          />
          <OptionalField
            id="setting"
            label="Setting or place"
            placeholder="e.g. a lighthouse by the sea"
            value={setting}
            onChange={setSetting}
          />
          <OptionalField
            id="lesson"
            label="A gentle lesson"
            placeholder="e.g. it's okay to ask for help"
            value={lesson}
            onChange={setLesson}
          />
        </div>
      </details>

      <button
        type="submit"
        data-testid="generate-button"
        className="min-h-14 w-full rounded-xl bg-amber px-6 py-4 text-lg font-semibold text-night shadow-lg transition hover:bg-amber-soft focus-visible:outline-2"
      >
        Tell me a story ✨
      </button>
    </form>
  );
}

function OptionalField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-muted">
        {label}
      </label>
      <input
        id={id}
        data-testid={`field-${id}`}
        type="text"
        maxLength={120}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/12 bg-surface/60 px-3 py-2 text-starlight placeholder:text-muted focus:border-amber/60 focus:outline-none"
      />
    </div>
  );
}
