import type { Metadata } from "next";
import Link from "next/link";
import { CREDITED_SOURCES, CREDITS_NOTE } from "@/lib/credits";
import { ATU_INDEX } from "@/lib/atu-index";
import { MOTIF_CODES } from "@/lib/motifs";

export const metadata: Metadata = {
  title: "Sources & credits · Bedtime Tales",
  description:
    "The folklore sources behind this app's tale types and motifs, the licences they carry, and the rights questions still open against them.",
};

export default function CreditsPage() {
  return (
    <div className="page-shell mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="mb-8 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="font-serif text-lg text-starlight transition hover:text-amber-soft sm:text-xl"
        >
          🌙 Bedtime Tales
        </Link>
        <Link
          href="/browse"
          className="rounded-lg px-3 py-2 text-sm text-lavender hover:bg-surface/60"
        >
          Browse
        </Link>
      </header>

      <main className="flex-1">
        <h1 className="mb-2 font-serif text-3xl text-starlight sm:text-4xl">
          Sources &amp; credits
        </h1>
        <p className="mb-8 text-muted">
          The stories are written fresh every time and belong to nobody. The
          folklore scaffolding they hang on — {ATU_INDEX.length} tale types and{" "}
          {MOTIF_CODES.size} motifs — comes from the open datasets below, and
          carries their licences with it.
        </p>

        <section className="mb-8 rounded-2xl border border-white/10 bg-surface/50 p-5 sm:p-6">
          <h2 className="mb-2 font-serif text-xl text-starlight">
            Why this page exists
          </h2>
          <p className="text-sm leading-relaxed text-muted">{CREDITS_NOTE}</p>
        </section>

        <ul className="space-y-5">
          {CREDITED_SOURCES.map((s) => (
            <li
              key={s.key}
              className="rounded-2xl border border-white/10 bg-surface/50 p-5 sm:p-6"
            >
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-serif text-xl text-starlight">{s.name}</h2>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-lavender">
                  {s.license}
                </span>
              </div>

              <a
                href={s.homepageUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-lavender underline-offset-2 hover:underline"
              >
                {s.homepageUrl}
              </a>

              {s.attribution && (
                <p className="mt-3 border-l-2 border-amber/40 pl-3 text-sm leading-relaxed text-starlight/90">
                  {s.attribution}
                </p>
              )}

              {s.openQuestions.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-muted">
                    {s.openQuestions.length} unresolved rights{" "}
                    {s.openQuestions.length === 1 ? "question" : "questions"}{" "}
                    recorded against this source
                  </summary>
                  <ul className="mt-2 space-y-2 pl-4 text-sm text-muted">
                    {s.openQuestions.map((q, i) => (
                      <li key={i} className="list-disc leading-relaxed">
                        {q}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </ul>

        <section className="mt-8 rounded-2xl border border-white/10 bg-surface/50 p-5 text-sm leading-relaxed text-muted sm:p-6">
          <h2 className="mb-2 font-serif text-xl text-starlight">
            A note on what this data is, and isn&apos;t
          </h2>
          <p className="mb-3">
            The links between a tale type and its motifs are recorded as{" "}
            <em>inferred</em>, not asserted. Uther&apos;s index lists motifs per
            type largely without narrative ordering, so a motif being associated
            with a tale type does not mean it happens, or happens in that place.
          </p>
          <p>
            Two of the three sources carry unresolved questions about the rights
            in the compilations underneath them. Those questions are recorded as
            data rather than settled by assertion, and nothing here is legal
            advice.
          </p>
        </section>
      </main>

      <footer className="mt-10 pb-4 text-center text-xs text-muted">
        Sweet dreams. Every tale ends in sleep. 💫
      </footer>
    </div>
  );
}
