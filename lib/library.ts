import type { AgeBand, TaleLength } from "./tale-types";

const LIBRARY_KEY = "btg:library:v1";
const MAX_TALES = 50;

export interface SavedTale {
  id: string;
  createdAt: number;
  taleTypeId: string;
  taleTypeLabel: string;
  heroName: string;
  ageBand: AgeBand;
  length: TaleLength;
  title: string;
  text: string;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

/** Read all saved tales, newest first. Never throws. */
export function loadLibrary(): SavedTale[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedTale);
  } catch {
    return [];
  }
}

function persist(tales: SavedTale[]): SavedTale[] {
  if (canUseStorage()) {
    try {
      window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(tales));
    } catch {
      // Storage full or unavailable — keep the in-memory list.
    }
  }
  return tales;
}

/** Prepend a tale and cap the library, returning the updated list. */
export function saveTale(tale: Omit<SavedTale, "id" | "createdAt">): SavedTale[] {
  const entry: SavedTale = {
    ...tale,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    createdAt: Date.now(),
  };
  const next = [entry, ...loadLibrary()].slice(0, MAX_TALES);
  return persist(next);
}

/** Remove a tale by id, returning the updated list. */
export function deleteTale(id: string): SavedTale[] {
  return persist(loadLibrary().filter((t) => t.id !== id));
}

function isSavedTale(value: unknown): value is SavedTale {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.createdAt === "number" &&
    typeof v.title === "string" &&
    typeof v.text === "string"
  );
}
