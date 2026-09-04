import type { SavedTale } from "@/lib/library";
import { getAtuEntry } from "@/lib/atu-index";
import { getFable } from "@/lib/fables";
import { parseStory } from "@/lib/story";

export default function LibraryCard({
  tale,
  onRead,
  onDelete,
}: {
  tale: SavedTale;
  onRead: () => void;
  onDelete: () => void;
}) {
  // `taleTypeId` holds an ATU id or a fable id depending on which door the
  // tale came through; both lookups miss quietly, and the moon is the fallback.
  const emoji =
    getAtuEntry(tale.taleTypeId)?.emoji ??
    getFable(tale.taleTypeId)?.emoji ??
    "🌙";
  const { body } = parseStory(tale.text);
  const preview = body.replace(/\n+/g, " ").slice(0, 130).trim();
  const date = new Date(tale.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-surface/60 p-5">
      <div className="mb-2 flex items-start gap-3">
        <span className="text-3xl" aria-hidden="true">
          {emoji}
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-serif text-lg text-starlight">
            {tale.title}
          </h3>
          <p className="text-xs text-muted">
            {tale.taleTypeLabel} · {date}
          </p>
        </div>
      </div>
      <p className="mb-4 flex-1 text-sm text-muted">{preview}…</p>
      <div className="flex gap-2">
        <button
          type="button"
          data-testid={`read-${tale.id}`}
          onClick={onRead}
          className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-night hover:bg-amber-soft"
        >
          Read
        </button>
        <button
          type="button"
          data-testid={`delete-${tale.id}`}
          onClick={onDelete}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-starlight hover:bg-surface-2"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
