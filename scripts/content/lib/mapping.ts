/**
 * Mapping from the legacy taxonomy (20 directories, free-text subcategories) onto the
 * new taxonomy of tracks and sections declared in `src/data/tracks.ts`.
 *
 * The mapping itself lives in `scripts/content/mapping.json`; this module only decides
 * what it means. Resolution goes `drop` → `overrides` → `subcategories` → `categories`,
 * so a hand-written decision about one article always beats the bulk rules above it.
 */
import { readFile } from 'node:fs/promises';
import { TRACKS, getSection, type Track } from '../../../src/data/tracks';
import { repoPath } from './paths';

/** Section assigned to a pair that only matched its old category. */
export const UNSORTED = 'unsorted';

/** Repository-relative location of the committed mapping. */
export const MAPPING_PATH = repoPath('scripts/content/mapping.json');

/** A destination in the new taxonomy. */
export interface SectionRef {
  track: string;
  section: string;
}

export interface Mapping {
  /** Old corpus directory (lower case) → track slug; the fallback for every pair. */
  categories: Record<string, string>;
  /** `${oldCategory}::${oldSubcategory}` → destination. */
  subcategories: Record<string, SectionRef>;
  /** `${oldCategory}/${slug}` → destination, for articles the bulk rules get wrong. */
  overrides: Record<string, SectionRef>;
  /** `${oldCategory}/${slug}` → why the article is not imported. */
  drop: Record<string, string>;
}

/** The inventory fields {@link resolveMapping} reads; `InventoryPair` satisfies it. */
export interface MappablePair {
  id: string;
  category: string;
  en: { subcategory: string };
  zh: { subcategory: string };
}

export type Resolution = SectionRef | { drop: string };

/** Narrows a {@link Resolution} to the dropped case. */
export function isDropped(resolution: Resolution): resolution is { drop: string } {
  return 'drop' in resolution;
}

/** The `subcategories` key for one old category and subcategory string. */
export function subcategoryKey(category: string, subcategory: string): string {
  return `${category}::${subcategory}`;
}

/**
 * The subcategory a pair is filed under: the English one, or the Chinese one when the
 * English frontmatter has none. Empty when neither side carries a subcategory.
 */
export function pairSubcategory(pair: MappablePair): string {
  return pair.en.subcategory || pair.zh.subcategory;
}

/** Where one pair belongs in the new taxonomy, or why it is dropped. */
export function resolveMapping(pair: MappablePair, mapping: Mapping): Resolution {
  const dropped = mapping.drop[pair.id];
  if (dropped !== undefined) return { drop: dropped };

  const override = mapping.overrides[pair.id];
  if (override) return { ...override };

  const subcategory = pairSubcategory(pair);
  if (subcategory) {
    const bySubcategory = mapping.subcategories[subcategoryKey(pair.category, subcategory)];
    if (bySubcategory) return { ...bySubcategory };
  }

  const track = mapping.categories[pair.category];
  if (!track) throw new Error(`No track mapped for old category "${pair.category}" (pair ${pair.id})`);
  return { track, section: UNSORTED };
}

/**
 * Check every destination against the track registry. Reports all problems at once so a
 * hand-edited or model-generated mapping can be fixed in a single pass. `unsorted` is
 * only produced by the `categories` fallback, so it is rejected everywhere else.
 */
export function validateMapping(mapping: Mapping, tracks: Track[] = TRACKS): void {
  const known = new Map(tracks.map((track) => [track.slug, track]));
  const problems: string[] = [];

  for (const [category, track] of Object.entries(mapping.categories)) {
    if (!known.has(track)) problems.push(`categories["${category}"]: unknown track "${track}"`);
  }
  for (const [key, ref] of Object.entries(mapping.subcategories)) {
    problems.push(...checkRef(`subcategories["${key}"]`, ref, known));
  }
  for (const [id, ref] of Object.entries(mapping.overrides)) {
    problems.push(...checkRef(`overrides["${id}"]`, ref, known));
  }

  if (problems.length > 0) {
    throw new Error(`Invalid mapping (${problems.length} problem(s)):\n  ${problems.join('\n  ')}`);
  }
}

/** Problems with one destination: unknown track, unknown section, or a stray `unsorted`. */
function checkRef(where: string, ref: SectionRef, known: Map<string, Track>): string[] {
  const track = known.get(ref.track);
  if (!track) return [`${where}: unknown track "${ref.track}"`];
  if (ref.section === UNSORTED) {
    return [`${where}: section "${UNSORTED}" is only allowed as the categories fallback`];
  }
  if (!getSection(track, ref.section)) {
    return [`${where}: unknown section "${ref.section}" in track "${ref.track}"`];
  }
  return [];
}

/** One old subcategory the mapping says nothing about, and how many pairs use it. */
export interface UnmappedSubcategory {
  key: string;
  count: number;
}

/**
 * The `Category::Subcategory` keys the inventory contains but the mapping does not,
 * sorted by key. An empty result means every subcategory has an explicit destination.
 */
export function unmappedSubcategories(
  inventory: { pairs: MappablePair[] },
  mapping: Mapping,
): UnmappedSubcategory[] {
  const counts = new Map<string, number>();
  for (const pair of inventory.pairs) {
    const subcategory = pairSubcategory(pair);
    if (!subcategory) continue;
    const key = subcategoryKey(pair.category, subcategory);
    if (mapping.subcategories[key]) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** Read a mapping file; the shape is checked, the destinations are not. */
export async function readMapping(file: string = MAPPING_PATH): Promise<Mapping> {
  const parsed: unknown = JSON.parse(await readFile(file, 'utf8'));
  if (!isMapping(parsed))
    throw new Error(`${file} is not a mapping: expected categories, subcategories, overrides and drop`);
  return parsed;
}

function isMapping(value: unknown): value is Mapping {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return ['categories', 'subcategories', 'overrides', 'drop'].every(
    (key) => typeof record[key] === 'object' && record[key] !== null,
  );
}
