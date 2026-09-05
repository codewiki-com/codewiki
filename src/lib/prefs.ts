/**
 * The local-storage layer — spec §6.2. Everything the visitor accumulates (settings, reading
 * progress, flashcards, recents) lives in their browser under the `cw:v1:` prefix and never
 * leaves the machine.
 *
 * The pure helpers at the bottom carry no browser dependency, so they are unit-tested directly;
 * the read/write pair is guarded so a page rendered on the server, a private window with storage
 * disabled or a corrupted value all degrade to the fallback instead of throwing.
 *
 * The self-contained pre-paint bootstraps repeat only the key and their small validation rules;
 * every importable reader and writer, including the theme controls, goes through this module.
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
export type Plan = 15 | 30 | 60;
export type BilingualLayout = 'paired' | 'side';
export type RevealMode = 'one' | 'all';

/**
 * What this browser has downloaded for offline reading. The pages themselves live in the service
 * worker's caches; this is only the bookkeeping the buttons render their state from, so a cleared
 * cache and a stale entry here disagree harmlessly — pressing Save again fixes it.
 */
export interface OfflineState {
  /** Track slug → how many URLs the last successful save stored. */
  tracks: Record<string, number>;
  /** True once the optional Python and SQL runtimes are in the cache. */
  runtimes: boolean;
}

export interface Prefs {
  theme: Theme;
  depth: Depth;
  bilingual: BilingualMode;
  fontSize: FontSize;
  /** Last language the visitor chose, used to offer the other locale. */
  lang?: Locale;
  /** Minutes a day the reader plans to spend; drives the "about N weeks" line on paths. */
  plan?: Plan;
  bilingualLayout?: BilingualLayout;
  interviewReveal?: RevealMode;
  /** Flashcard sources; every source defaults to on when the key is absent. */
  cardSources?: { terms: boolean; quiz: boolean; manual: boolean };
  /** Absent until the reader saves something for offline reading. */
  offline?: OfflineState;
}

/** One entry per topic read, keyed by `${track}/${slug}`. */
export interface TopicProgress {
  readPct: number;
  completedAt?: string;
  lastAt: string;
  termsAdded?: boolean;
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
  /** `glossary:{term}` or `quiz:{track}/{slug}#{item}` — what the card is about. */
  ref: string;
  /** ISO date the card comes back, compared against "now" as a date. */
  due: string;
  interval: number;
  ease: number;
  reps: number;
  suspended?: boolean;
  /** Where the card came from, for the source toggles. */
  source?: 'terms' | 'quiz' | 'manual';
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
  plan: 30,
  bilingualLayout: 'paired',
  interviewReveal: 'one',
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function oneOf<T extends string>(value: unknown, choices: readonly T[], fallback: T): T {
  return typeof value === 'string' && choices.includes(value as T) ? (value as T) : fallback;
}

function isDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function validEntries(value: unknown, valid: (entry: unknown) => boolean): boolean {
  return isRecord(value) && Object.values(value).every(valid);
}

function isTopicProgress(value: unknown): value is TopicProgress {
  if (!isRecord(value)) return false;
  return (
    typeof value.readPct === 'number' &&
    Number.isFinite(value.readPct) &&
    value.readPct >= 0 &&
    value.readPct <= 100 &&
    isDate(value.lastAt) &&
    (value.completedAt === undefined || isDate(value.completedAt)) &&
    (value.termsAdded === undefined || typeof value.termsAdded === 'boolean')
  );
}

function isQuizProgress(value: unknown): value is QuizProgress {
  if (!isRecord(value)) return false;
  return (
    typeof value.score === 'number' &&
    Number.isFinite(value.score) &&
    value.score >= 0 &&
    typeof value.total === 'number' &&
    Number.isFinite(value.total) &&
    value.total > 0 &&
    value.score <= value.total &&
    isDate(value.at)
  );
}

function isPathProgress(value: unknown): value is PathProgress {
  return isRecord(value) && isDate(value.startedAt);
}

function isProgress(value: Record<string, unknown>): boolean {
  return (
    validEntries(value.topics, isTopicProgress) &&
    validEntries(value.quizzes, isQuizProgress) &&
    validEntries(value.paths, isPathProgress) &&
    (value.feedback === undefined ||
      validEntries(value.feedback, (entry) => entry === 'yes' || entry === 'not-quite'))
  );
}

function isFlashcard(value: unknown): value is Flashcard {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    (value.kind === 'term' || value.kind === 'quiz') &&
    typeof value.ref === 'string' &&
    value.ref.length > 0 &&
    isDate(value.due) &&
    typeof value.interval === 'number' &&
    Number.isFinite(value.interval) &&
    value.interval >= 0 &&
    typeof value.ease === 'number' &&
    Number.isFinite(value.ease) &&
    value.ease > 0 &&
    typeof value.reps === 'number' &&
    Number.isInteger(value.reps) &&
    value.reps >= 0 &&
    (value.suspended === undefined || typeof value.suspended === 'boolean') &&
    (value.source === undefined || ['terms', 'quiz', 'manual'].includes(String(value.source)))
  );
}

function isFlashcards(value: Record<string, unknown>): boolean {
  return Array.isArray(value.cards) && value.cards.every(isFlashcard);
}

function isRecents(value: Record<string, unknown>): boolean {
  return Array.isArray(value.pages) && value.pages.every((page) => typeof page === 'string');
}

/** Validates each preference independently, so one corrupt field cannot poison the others. */
export function sanitizePrefs(value: Record<string, unknown>): Prefs {
  const lang = oneOf(value.lang, ['en', 'zh'] as const, '' as Locale | '');
  const sources = isRecord(value.cardSources)
    ? {
        terms: typeof value.cardSources.terms === 'boolean' ? value.cardSources.terms : true,
        quiz: typeof value.cardSources.quiz === 'boolean' ? value.cardSources.quiz : true,
        manual: typeof value.cardSources.manual === 'boolean' ? value.cardSources.manual : true,
      }
    : undefined;
  // Validated as a collection, the way `progress` is: a `tracks` map with one bad entry is
  // replaced whole rather than filtered. This module is in the chunk every page downloads and the
  // topic-page script budget is all but full, so the cheap check is the right one — nothing reads
  // this block except the Save button, which re-derives its state from it defensively anyway.
  const offline: OfflineState | undefined = isRecord(value.offline)
    ? {
        tracks: validEntries(value.offline.tracks, (count) => typeof count === 'number' && count > 0)
          ? (value.offline.tracks as Record<string, number>)
          : {},
        runtimes: value.offline.runtimes === true,
      }
    : undefined;
  return {
    theme: oneOf(value.theme, ['system', 'light', 'dark'] as const, DEFAULT_PREFS.theme),
    depth: oneOf(value.depth, ['quick', 'standard', 'deep'] as const, DEFAULT_PREFS.depth),
    bilingual: oneOf(value.bilingual, ['off', 'en-zh', 'zh-en'] as const, DEFAULT_PREFS.bilingual),
    fontSize: oneOf(value.fontSize, ['s', 'm', 'l'] as const, DEFAULT_PREFS.fontSize),
    plan:
      typeof value.plan === 'number' && ([15, 30, 60] as const).includes(value.plan as Plan)
        ? (value.plan as Plan)
        : 30,
    bilingualLayout: oneOf(value.bilingualLayout, ['paired', 'side'] as const, 'paired'),
    interviewReveal: oneOf(value.interviewReveal, ['one', 'all'] as const, 'one'),
    ...(lang ? { lang } : {}),
    ...(sources ? { cardSources: sources } : {}),
    ...(offline ? { offline } : {}),
  };
}

export function cardSources(p: Prefs) {
  return p.cardSources ?? { terms: true, quiz: true, manual: true };
}

/** Reads one key, returning `fallback` for a missing, unreadable or malformed value. */
export function readStore<T>(key: StoreKey, fallback: T): T {
  const store = storage();
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    if (raw === null) return fallback;
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return fallback;
    if (key === KEYS.prefs) return sanitizePrefs(value) as T;
    if (key === KEYS.progress) return (isProgress(value) ? value : fallback) as T;
    if (key === KEYS.flashcards) return (isFlashcards(value) ? value : fallback) as T;
    if (key === KEYS.recents) return (isRecents(value) ? value : fallback) as T;
    return fallback;
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
    return !card.suspended && !Number.isNaN(due) && due <= at;
  }).length;
}
