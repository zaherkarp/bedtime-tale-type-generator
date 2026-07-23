import { TALE_TYPES } from "@/lib/tale-types";

export default function TaleTypePicker({
  onSelect,
}: {
  onSelect: (taleTypeId: string) => void;
}) {
  return (
    <section aria-labelledby="picker-heading">
      <h2
        id="picker-heading"
        className="mb-2 text-center font-serif text-3xl text-starlight sm:text-4xl"
      >
        What kind of tale tonight?
      </h2>
      <p className="mb-8 text-center text-muted">
        Pick a story type to begin.
      </p>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TALE_TYPES.map((tale) => (
          <li key={tale.id}>
            <button
              type="button"
              data-testid={`tale-type-${tale.id}`}
              onClick={() => onSelect(tale.id)}
              className="group flex h-full w-full flex-col rounded-2xl border border-white/10 bg-surface/70 p-5 text-left shadow-lg transition hover:-translate-y-0.5 hover:border-amber/50 hover:bg-surface-2/80 focus-visible:border-amber/60"
            >
              <span className="mb-3 text-4xl" aria-hidden="true">
                {tale.emoji}
              </span>
              <span className="font-serif text-xl text-starlight">
                {tale.label}
              </span>
              <span className="mt-1 text-sm text-muted">{tale.tagline}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
