/**
 * Structural divergence between the two languages of an article pair.
 *
 * The old corpus was written twice rather than translated, so the English and Chinese
 * sides of a pair often disagree on outline and length. The score below turns that
 * disagreement into a single 0..1 number: 0 means "same article", 1 means "unrelated".
 * Only the heading depth sequence and the prose length are compared, because heading
 * text is in different languages and cannot be matched directly.
 */

export interface DivergenceSide {
  /** Depths of the document's ATX headings, in document order. */
  headingDepths: number[];
  /** Rough prose word count (CJK characters count as one word each). */
  words: number;
}

/**
 * Outline similarity of two heading depth sequences, in `0..1` (1 = same outline).
 *
 * Blends two halves: how close the outlines are in size, and how much of the longer
 * outline the longest common depth subsequence covers. Symmetric by construction,
 * since both halves only use `|lenA - lenB|` and the symmetric LCS length. Two empty
 * outlines count as identical.
 */
export function headingSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const longest = Math.max(a.length, b.length, 1);
  const sizeTerm = 1 - Math.abs(a.length - b.length) / longest;
  const orderTerm = lcsLength(a, b) / longest;
  return 0.5 * sizeTerm + 0.5 * orderTerm;
}

/**
 * Divergence of an article pair, in `0..1` (0 = same article).
 *
 * Half the score comes from outline dissimilarity, half from the relative difference
 * in prose length. Symmetric, and defined when either side is empty.
 */
export function divergenceScore(a: DivergenceSide, b: DivergenceSide): number {
  const structure = 1 - headingSimilarity(a.headingDepths, b.headingDepths);
  const longest = Math.max(a.words, b.words);
  const length = longest === 0 ? 0 : Math.min(1, Math.abs(a.words - b.words) / longest);
  return 0.5 * structure + 0.5 * length;
}

/** Length of the longest common subsequence of two numeric sequences. */
function lcsLength(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  // Rolling one-dimensional table: row[j] is the LCS length of a[0..i] and b[0..j].
  let previous = new Array<number>(b.length + 1).fill(0);
  let current = new Array<number>(b.length + 1).fill(0);
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) {
      current[j + 1] = a[i] === b[j] ? previous[j] + 1 : Math.max(current[j], previous[j + 1]);
    }
    [previous, current] = [current, previous];
  }
  return previous[b.length];
}
