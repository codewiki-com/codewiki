// Small pure array helpers shared by pages. No Astro imports, so they are unit-tested directly.

/**
 * The value that occurs most often. Ties are broken by first appearance, which keeps the result
 * stable for callers that pass content in a deterministic order. Returns `undefined` when empty.
 */
export function mostFrequent<T>(values: readonly T[]): T | undefined {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  let best: T | undefined;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}
