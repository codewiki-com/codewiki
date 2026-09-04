/**
 * The pure half of search — spec §6.2 (`recents`) and the command palette of §7.
 *
 * Pagefind only exists in the browser, against an index that `pnpm build` writes, so everything
 * that can be decided without it lives here: how a result set is split into the groups the palette
 * shows, and the "recently opened" list it offers before anything has been typed. Both are
 * unit-tested directly; `src/islands/Palette.tsx` keeps only the parts that need the DOM.
 *
 * Nothing in this module may import `@/i18n` — the palette bundles it, and the dictionaries are
 * page-level data the island receives as props.
 */
import { KEYS, type RecentPage, type Recents } from '@/lib/prefs';

/** The fields of Pagefind's `data()` payload the palette reads. Everything else is ignored. */
export interface PagefindResultData {
  url: string;
  /** Highlighted HTML around the match; shown when a result carries no track of its own. */
  excerpt?: string;
  /** `title` is Pagefind's own; `type` and `track` come from `data-pagefind-meta`. */
  meta?: Record<string, string | undefined>;
}

export type GroupName = 'topics' | 'glossary' | 'paths' | 'other';

export type GroupedResults = Record<GroupName, PagefindResultData[]>;

/** Display order of the groups, so the palette and `/search/` list them the same way. */
export const GROUP_ORDER: GroupName[] = ['topics', 'glossary', 'paths', 'other'];

/**
 * `meta.type` as a page declares it, mapped onto the group it appears under. Anything a page
 * types that is not listed here — cheatsheets and comparisons, which P1 does not build yet —
 * still shows, under `other`, rather than disappearing from the results.
 */
const GROUP_OF: Record<string, GroupName> = {
  topic: 'topics',
  glossary: 'glossary',
  term: 'glossary',
  path: 'paths',
};

/** Splits one result set into the palette's groups, keeping Pagefind's ranking inside each. */
export function groupResults(results: PagefindResultData[]): GroupedResults {
  const grouped: GroupedResults = { topics: [], glossary: [], paths: [], other: [] };
  for (const result of results) {
    grouped[GROUP_OF[result?.meta?.type ?? ''] ?? 'other'].push(result);
  }
  return grouped;
}

/** Spec §6.2 keeps the recents list short; the oldest entry is dropped first. */
export const RECENTS_LIMIT = 8;

/** True for a value that has the shape the palette can render. Storage is visitor-editable. */
function isPage(value: unknown): value is RecentPage {
  const page = value as RecentPage | null;
  return (
    typeof page === 'object' &&
    page !== null &&
    typeof page.url === 'string' &&
    page.url.length > 0 &&
    typeof page.title === 'string'
  );
}

/**
 * The pages this browser opened from the palette, most recent first.
 *
 * A missing store (server render, private window, blocked storage), unparseable JSON and entries
 * of the wrong shape all read back as "no recents" rather than throwing.
 */
export function recentPages(storage: Storage | null | undefined): RecentPage[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(KEYS.recents);
    if (raw === null) return [];
    const parsed = JSON.parse(raw) as Recents | null;
    const pages = parsed?.pages;
    return Array.isArray(pages) ? pages.filter(isPage).slice(0, RECENTS_LIMIT) : [];
  } catch {
    return [];
  }
}

/**
 * Records that `url` was opened, and returns the list as it now stands.
 *
 * A page already listed moves back to the front under its new title instead of appearing twice.
 * The list is returned even when the write fails, so the palette can show it for this session.
 */
export function pushRecent(
  storage: Storage | null | undefined,
  url: string,
  title: string,
  now: Date = new Date(),
): RecentPage[] {
  const pages = [
    { url, title, at: now.toISOString() },
    ...recentPages(storage).filter((page) => page.url !== url),
  ].slice(0, RECENTS_LIMIT);

  try {
    storage?.setItem(KEYS.recents, JSON.stringify({ pages } satisfies Recents));
  } catch {
    /* quota exceeded or storage disabled — the visitor keeps browsing */
  }
  return pages;
}
