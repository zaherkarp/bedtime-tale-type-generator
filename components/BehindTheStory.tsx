import type { Fable } from "@/lib/fables";

/**
 * The parent-facing provenance panel.
 *
 * Three things have to stay visibly distinct, because conflating them would be
 * a small lie about what the child just heard:
 *
 * 1. the traditional source and pattern (someone else's, centuries old);
 * 2. our structured adaptation (ours, reviewable in `lib/fables.ts`);
 * 3. the story itself (generated fresh tonight, belonging to nobody).
 *
 * So the copy says "inspired by", never "this is the Jātaka version". Where a
 * source's `confidence` is below "high" the uncertainty note is printed rather
 * than smoothed over — a citation that looks more certain than it is does more
 * damage than no citation.
 *
 * It is a collapsed `<details>` and it never interrupts the story: a child
 * being read to should not have to sit through a bibliography.
 */
export default function BehindTheStory({ fable }: { fable: Fable }) {
  const a = fable.adaptation;
  const src = fable.source;

  return (
    <details
      data-testid="behind-the-story"
      className="no-print mt-8 rounded-2xl border border-white/10 bg-surface/40 px-5 py-4"
    >
      <summary className="cursor-pointer font-medium text-starlight">
        Behind the story
      </summary>

      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
        <p>
          This bedtime story is <strong className="text-starlight">original</strong>,
          written fresh tonight. It was inspired by the traditional fable pattern
          known as{" "}
          <span className="text-starlight">&ldquo;{fable.title}&rdquo;</span>, from
          the {fable.tradition} tradition
          {fable.region ? ` (${fable.region})` : ""}. It is not a translation or a
          retelling of any published version, and it is not an authentic
          traditional telling.
        </p>

        <p>
          <span className="text-starlight">Traditional themes:</span>{" "}
          {fable.themes.join(", ")}.
        </p>

        {src && (
          <div>
            <p>
              <span className="text-starlight">Where the tale comes from:</span>{" "}
              {[
                src.collection,
                src.authorOrCollector,
                src.year ? String(src.year) : undefined,
              ]
                .filter(Boolean)
                .join(" · ")}
              {src.designations?.length ? ` · ${src.designations.join(", ")}` : ""}
            </p>
            {src.note && (
              <p className="mt-2 border-l-2 border-amber/40 pl-3">
                <span className="text-starlight">
                  {src.confidence === "high"
                    ? "A note on this source:"
                    : "What we are not sure of:"}
                </span>{" "}
                {src.note}
              </p>
            )}
            {src.url && (
              <p className="mt-2">
                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-lavender underline-offset-2 hover:underline"
                >
                  {src.url}
                </a>
              </p>
            )}
          </div>
        )}

        <div>
          <p className="text-starlight">Our bedtime adaptation</p>
          {a.concerns.length > 0 && (
            <p className="mt-1">
              The traditional tale carries material we keep away from bedtime:{" "}
              {a.concerns.join(", ")}.
            </p>
          )}
          <ul className="mt-2 space-y-1 pl-4">
            <Line label="Preserved" items={a.preserve} />
            <Line label="Softened" items={a.soften} />
            <Line label="Substituted" items={a.substitute} />
            <Line label="Removed" items={a.remove} />
          </ul>
          {a.ageFloor !== undefined && (
            <p className="mt-2">
              Usually kept for listeners of about {a.ageFloor} and up.
            </p>
          )}
        </div>
      </div>
    </details>
  );
}

function Line({
  label,
  items,
}: {
  label: string;
  items?: readonly string[];
}) {
  if (!items?.length) return null;
  return (
    <li className="list-disc">
      <span className="text-starlight">{label}:</span> {items.join("; ")}.
    </li>
  );
}
