/**
 * Deterministic randomness for assembly.
 *
 * Every choice the assembler makes is drawn from a seeded generator, which buys
 * three things the design doc argues for:
 *
 * - **Reread.** The same seed replays the same telling, word for word. Small
 *   children ask for exactly that, and a generator that cannot do it fails at
 *   the one request bedtime reliably produces.
 * - **A cheap library.** A saved entry stores the seed, not the prose, so the
 *   library stays kilobytes no matter how many tales are in it.
 * - **Testability.** Assembly becomes a pure function of (plan, store, seed),
 *   so a test can assert the output rather than assert around randomness.
 *
 * Neither function here is cryptographic and neither needs to be. The threat
 * model is "two tellings should differ", not "an adversary must not predict the
 * next paragraph".
 */

/** A seeded generator: successive calls return floats in [0, 1). */
export type Rng = () => number;

/**
 * FNV-1a, 32-bit. Chosen because it is ten lines, has no dependencies, works
 * identically in Node and every browser, and spreads short similar strings
 * ("Ada" vs "Adam") into unrelated seeds, which is the only property that
 * matters here.
 */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // The FNV prime, applied with shifts so this stays in 32-bit integer math
    // rather than overflowing into float territory via `*= 16777619`.
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    hash >>>= 0;
  }
  return hash >>> 0;
}

/**
 * mulberry32. A small, well-distributed PRNG whose whole state is one 32-bit
 * integer, so a seed is a number a URL or a library entry can carry.
 */
export function makeRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The seed for one telling.
 *
 * `nonce` is what makes "another one, please" produce a different story for the
 * same child and the same pick: the app passes a counter or a date. Leaving it
 * empty is deliberate and gives the stable "tonight's story for this pick".
 */
export function tellingSeed(parts: {
  heroName: string;
  sourceId: string;
  ageBand: string;
  length: string;
  nonce?: string;
}): number {
  return hashSeed(
    [
      parts.heroName.trim().toLowerCase(),
      parts.sourceId,
      parts.ageBand,
      parts.length,
      parts.nonce ?? "",
    ].join("\u0000"),
  );
}

/**
 * Derive an independent stream from one telling seed.
 *
 * This exists because of a bug the audit caught. The narration plan and the
 * assembler were both seeded with the telling seed directly, so both drew from
 * the *same* sequence starting at the same state: the plan consumed draws 1..k
 * to choose where its expansions went, and the assembler then re-consumed
 * draws 1..k to choose fragments. The two decisions were therefore correlated,
 * and one expansion fragment ended up filling 64% of its slot instead of the
 * 33% three interchangeable fragments should each get.
 *
 * Labelling each consumer gives it its own stream from the same seed, so a
 * telling stays reproducible from one number while the decisions stay
 * independent. Any new consumer of the seed must take a label too.
 */
export function deriveSeed(seed: number, label: string): number {
  return hashSeed(`${seed}:${label}`);
}

/** Pick one item, uniformly. Throws on an empty list rather than return undefined. */
export function pick<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new Error("pick() on an empty list");
  return items[Math.floor(rng() * items.length)];
}

/**
 * Fisher-Yates, on a copy. Used by the narration plan to choose *which*
 * expansion beats a telling spends its slots on.
 */
export function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
