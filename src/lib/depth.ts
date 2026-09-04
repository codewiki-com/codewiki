/**
 * The depth dial — spec §5.2. A topic is written once and read at three depths: Quick is the
 * TL;DR and one example, Standard adds the mechanics, Deep adds the internals.
 *
 * The rendered article carries the level of every block as `data-depth`, and the level of every
 * heading as `data-depth` on the heading itself (`rehype-depth-headings.ts`). Setting
 * `data-depth-mode` on the article root is all it takes to switch depth: the rules in `global.css`
 * do the hiding. This module is the pure half — reading the wanted depth and filtering a table of
 * contents — so it is unit-tested directly and imported by both the island and the page.
 */

export type Depth = 'quick' | 'standard' | 'deep';

export const DEPTHS: Depth[] = ['quick', 'standard', 'deep'];

/** The depth a reader lands on when nothing says otherwise, and what the server renders. */
export const DEFAULT_DEPTH: Depth = 'standard';

/** Storage key of the preferences blob. Must stay in step with `KEYS.prefs` in `prefs.ts`. */
const PREFS_KEY = 'cw:v1:prefs';

/** Only the two methods this module needs, so a plain object stands in for `localStorage`. */
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function isDepth(value: unknown): value is Depth {
  return value === 'quick' || value === 'standard' || value === 'deep';
}

/**
 * The depth to open a topic at: `?depth=` first — a shared link carries the depth it was shared
 * at — then the stored preference, then Standard. A blocked or corrupted store is not an error
 * the reader should see.
 */
export function readDepth(storage: StorageLike | null, urlSearch: string): Depth {
  const fromUrl = new URLSearchParams(urlSearch).get('depth');
  if (isDepth(fromUrl)) return fromUrl;

  try {
    const raw = storage?.getItem(PREFS_KEY);
    const stored = raw ? (JSON.parse(raw) as { depth?: unknown }).depth : undefined;
    if (isDepth(stored)) return stored;
  } catch {
    /* private mode, disabled storage or a hand-edited value: fall through to the default */
  }
  return DEFAULT_DEPTH;
}

/** Switches the article to `depth`. Every visibility rule in `global.css` keys on this attribute. */
export function applyDepth(root: Element | null, depth: Depth): void {
  root?.setAttribute('data-depth-mode', depth);
}

/** One entry of the table of contents, before filtering. `level` is the block the heading sits in. */
export interface TocHeading {
  slug: string;
  text: string;
  /** Heading rank: 2 for `h2`, 3 for `h3`. */
  depth: number;
  /** The depth level of the block the heading belongs to; `standard` when it declares none. */
  level: Depth;
}

/** A heading as the table of contents renders it: `dimmed` marks one the current depth hides. */
export interface FilteredHeading extends TocHeading {
  dimmed: boolean;
}

/**
 * The headings the table of contents shows at `mode`:
 *
 * - Quick shows no section headings at all — the reader is looking at the TL;DR and the
 *   checkpoint, which the contents links separately.
 * - Standard lists everything, with the Deep-only headings dimmed: they are named so the reader
 *   knows the article continues, and clicking one is what switches depth.
 * - Deep lists everything, undimmed.
 */
export function filterHeadings(headings: TocHeading[], mode: Depth): FilteredHeading[] {
  if (mode === 'quick') return [];
  return headings.map((heading) => ({ ...heading, dimmed: mode === 'standard' && heading.level === 'deep' }));
}
