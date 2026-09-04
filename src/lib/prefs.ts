/**
 * The local-storage layer — spec §6.2. Everything the visitor accumulates (settings, reading
 * progress, flashcards, recents) lives in their browser under the `cw:v1:` prefix and never
 * leaves the machine.
 *
 * The pure helpers at the bottom carry no browser dependency, so they are unit-tested directly;
 * the read/write pair is guarded so a page rendered on the server, a private window with storage
 * disabled or a corrupted value all degrade to the fallback instead of throwing.
 *
 * The theme is read a second time by `src/lib/theme.ts`, which the pre-paint bootstrap inlines and
 * therefore cannot import from here. `KEYS.prefs` and `PREFS_KEY` must stay the same string.
 */
import type { Locale } from '@/lib/urls';

export const KEYS = {
  prefs: 'cw:v1:prefs',
  progress: 'cw:v1:progress',
  flashcards: 'cw:v1:flashcards',
  recents: 'cw:v1:recents',
} as const;

export type StoreKey = (typeof KEYS)[keyof typeof KEYS];

export type Theme = 'system' | 'light' | 'dark';
export type Depth = 'quick' | 'standard' | 'deep';
export type BilingualMode = 'off' | 'en-zh' | 'zh-en';
export type FontSize = 's' | 'm' | 'l';

export interface Prefs {
  theme: Theme;
  depth: Depth;
  bilingual: BilingualMode;
  fontSize: FontSize;
  /** Last language the visitor chose, used to offer the other locale. */
  lang?: Locale;
}

/** One entry per topic read, keyed by `${track}/${slug}`. */
export interface TopicProgress {
  readPct: number;
  completedAt?: string;
  lastAt: string;
}

export interface QuizProgress {
  score: number;
  total: number;
  at: string;
}

export interface PathProgress {
  startedAt: string;
}

/** The answer to "was this clear?" on a topic page, keyed the same way as `topics`. */
export type Clarity = 'yes' | 'not-quite';

export interface Progress {
  topics: Record<string, TopicProgress>;
  quizzes: Record<string, QuizProgress>;
  paths: Record<string, PathProgress>;
  /** Optional: only pages the visitor actually answered on appear here. */
  feedback?: Record<string, Clarity>;
}

/** One spaced-repetition card. `ref` points at a glossary term or a quiz item. */
export interface Flashcard {
  id: string;
  kind: 'term' | 'quiz';
  ref: string;
  /** ISO date the card comes back, compared against "now" as a date. */
  due: string;
  interval: number;
  ease: number;
  reps: number;
}

export interface Flashcards {
  cards: Flashcard[];
}

/**
 * One page the command palette opened. Spec §6.2 writes `recents` as `{ pages: string[] }`; a URL
 * alone cannot be listed again without re-reading the index, so an entry carries the title it was
 * opened under and the time it was opened. `src/lib/search.ts` owns the read and write.
 */
export interface RecentPage {
  url: string;
  title: string;
  /** ISO timestamp, so an entry can be aged out later without a second key. */
  at: string;
}

export interface Recents {
  pages: RecentPage[];
}

export const DEFAULT_PREFS: Prefs = {
  theme: 'system',
  depth: 'standard',
  bilingual: 'off',
  fontSize: 'm',
};

export const EMPTY_PROGRESS: Progress = { topics: {}, quizzes: {}, paths: {} };

export const EMPTY_FLASHCARDS: Flashcards = { cards: [] };

export const EMPTY_RECENTS: Recents = { pages: [] };

/** False during SSR and wherever storage is unavailable (private mode, blocked cookies). */
function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Reads one key, returning `fallback` for a missing, unreadable or malformed value. */
export function readStore<T>(key: StoreKey, fallback: T): T {
  const store = storage();
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/** Writes one key. A full or unavailable store is not an error the visitor should see. */
export function writeStore<T>(key: StoreKey, value: T): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded or storage disabled — the visitor keeps browsing */
  }
}

/** Spec §6.2: writes are debounced by 500 ms, per key. */
export const WRITE_DEBOUNCE_MS = 500;

/** In-flight debounced writes. The value is kept so `flushStore` can still commit it. */
const pending = new Map<StoreKey, { timer: ReturnType<typeof setTimeout>; value: unknown }>();

/**
 * Coalesces bursts of writes to one key — scroll-driven progress updates are the common case.
 * The last value within the window wins.
 */
export function writeStoreDebounced<T>(key: StoreKey, value: T): void {
  const inFlight = pending.get(key);
  if (inFlight) clearTimeout(inFlight.timer);
  const timer = setTimeout(() => {
    pending.delete(key);
    writeStore(key, value);
  }, WRITE_DEBOUNCE_MS);
  pending.set(key, { timer, value });
}

/**
 * Commits a pending debounced write straight away. Called on `pagehide`, where waiting out the
 * debounce window would lose the write entirely.
 */
export function flushStore(key: StoreKey): void {
  const inFlight = pending.get(key);
  if (!inFlight) return;
  clearTimeout(inFlight.timer);
  pending.delete(key);
  writeStore(key, inFlight.value);
}

/** The topic to offer as "continue reading": the one with the most recent `lastAt`. */
export function getContinue(progress: Progress): { id: string; readPct: number } | null {
  let best: { id: string; readPct: number; at: number } | null = null;
  for (const [id, entry] of Object.entries(progress.topics ?? {})) {
    const at = Date.parse(entry.lastAt);
    if (Number.isNaN(at)) continue;
    if (!best || at > best.at) best = { id, readPct: entry.readPct, at };
  }
  return best ? { id: best.id, readPct: best.readPct } : null;
}

/** How many cards are due at `now`, inclusive of cards due exactly then. */
export function dueFlashcards(cards: Flashcard[], now: Date): number {
  const at = now.getTime();
  return cards.filter((card) => {
    const due = Date.parse(card.due);
    return !Number.isNaN(due) && due <= at;
  }).length;
}
