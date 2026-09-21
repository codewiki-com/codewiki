import {
  cardSources,
  dueFlashcards,
  flushStore,
  getContinue,
  readStore,
  writeStoreDebounced,
  DEFAULT_PREFS,
  EMPTY_FLASHCARDS,
  EMPTY_PROGRESS,
  EMPTY_RECENTS,
  KEYS,
  type Flashcards,
  type Prefs,
  type Progress,
  type Recents,
} from '@/lib/prefs';

/** Minimal in-memory `Storage`, so the browser-guarded helpers have something to talk to. */
function fakeStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    key: (index: number) => [...entries.keys()][index] ?? null,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
    removeItem: (key: string) => void entries.delete(key),
    clear: () => entries.clear(),
  };
}

describe('prefs helpers', () => {
  it('picks the most recently read topic', () => {
    expect(
      getContinue({
        topics: {
          'python/closures': { readPct: 38, lastAt: '2026-09-02T10:00:00Z' },
          'go/basics': { readPct: 90, lastAt: '2026-09-01T10:00:00Z' },
        },
        quizzes: {},
        paths: {},
      }),
    ).toEqual({ id: 'python/closures', readPct: 38 });
    expect(getContinue({ topics: {}, quizzes: {}, paths: {} })).toBeNull();
  });

  it('counts due cards', () => {
    const now = new Date('2026-09-03T00:00:00Z');
    expect(
      dueFlashcards(
        [
          { id: 'a', kind: 'term', ref: 'x', due: '2026-09-01', interval: 1, ease: 2.5, reps: 1 },
          {
            id: 'suspended',
            kind: 'term',
            ref: 'z',
            due: '2026-09-01',
            interval: 1,
            ease: 2.5,
            reps: 1,
            suspended: true,
          },
          { id: 'b', kind: 'term', ref: 'y', due: '2026-09-09', interval: 7, ease: 2.5, reps: 2 },
        ],
        now,
      ),
    ).toBe(1);
  });
});

describe('guarded preference reads', () => {
  beforeEach(() => vi.stubGlobal('localStorage', fakeStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ['null', 'null'],
    ['array', '[]'],
    ['theme: purple value', JSON.stringify({ theme: 'purple' })],
  ])('returns defaults for a stored %s', (_label, raw) => {
    localStorage.setItem(KEYS.prefs, raw);
    expect(readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS)).toEqual(DEFAULT_PREFS);
  });

  it('replaces invalid preference fields with their defaults', () => {
    localStorage.setItem(
      KEYS.prefs,
      JSON.stringify({
        theme: 'purple',
        depth: 'quick',
        fontSize: 'huge',
        plan: 45,
        interviewReveal: 'sometimes',
      }),
    );
    expect(readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS)).toEqual({
      ...DEFAULT_PREFS,
      depth: 'quick',
    });
  });

  it('preserves valid learning-layer preferences and ignores retired reading options', () => {
    const stored: Prefs = {
      ...DEFAULT_PREFS,
      plan: 60,
      interviewReveal: 'all',
      cardSources: { terms: false, quiz: true, manual: false },
    };
    localStorage.setItem(
      KEYS.prefs,
      JSON.stringify({ ...stored, bilingual: 'zh-en', bilingualLayout: 'side' }),
    );
    expect(readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS)).toEqual(stored);
  });

  it('keeps the offline bookkeeping and replaces a broken track map whole', () => {
    localStorage.setItem(
      KEYS.prefs,
      JSON.stringify({ ...DEFAULT_PREFS, offline: { tracks: { python: 42 }, runtimes: true } }),
    );
    expect(readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS).offline).toEqual({
      tracks: { python: 42 },
      runtimes: true,
    });

    localStorage.setItem(
      KEYS.prefs,
      JSON.stringify({ ...DEFAULT_PREFS, offline: { tracks: { python: 42, go: 'many' } } }),
    );
    expect(readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS).offline).toEqual({
      tracks: {},
      runtimes: false,
    });
  });

  it('reads a malformed offline value as nothing saved', () => {
    localStorage.setItem(KEYS.prefs, JSON.stringify({ ...DEFAULT_PREFS, offline: 'yes' }));
    expect(readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS)).toEqual(DEFAULT_PREFS);
  });

  it('defaults invalid flashcard source fields to on', () => {
    localStorage.setItem(
      KEYS.prefs,
      JSON.stringify({ ...DEFAULT_PREFS, cardSources: { terms: false, quiz: 'yes' } }),
    );
    const prefs = readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS);
    expect(cardSources(prefs)).toEqual({ terms: false, quiz: true, manual: true });
    expect(cardSources(DEFAULT_PREFS)).toEqual({ terms: true, quiz: true, manual: true });
  });
});

describe('guarded learning-store reads', () => {
  beforeEach(() => vi.stubGlobal('localStorage', fakeStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ['null collections', { quizzes: null, topics: null, paths: null }],
    ['invalid topic entry', { quizzes: {}, topics: { broken: null }, paths: {} }],
    [
      'invalid quiz entry',
      { quizzes: { broken: { score: 1, total: 0, at: 'never' } }, topics: {}, paths: {} },
    ],
    ['invalid path entry', { quizzes: {}, topics: {}, paths: { broken: { startedAt: 42 } } }],
  ])('returns the provided progress default for %s', (_label, stored) => {
    const fallback: Progress = { topics: {}, quizzes: {}, paths: { fallback: { startedAt: '2026-09-04' } } };
    localStorage.setItem(KEYS.progress, JSON.stringify(stored));
    expect(readStore(KEYS.progress, fallback)).toEqual(fallback);
  });

  it.each([
    ['a null cards collection', { cards: null }],
    ['an invalid card entry', { cards: [{ id: 'broken' }] }],
  ])('returns the provided flashcard default for %s', (_label, stored) => {
    localStorage.setItem(KEYS.flashcards, JSON.stringify(stored));
    expect(readStore<Flashcards>(KEYS.flashcards, EMPTY_FLASHCARDS)).toEqual(EMPTY_FLASHCARDS);
  });

  it.each([
    ['a null pages collection', { pages: null }],
    ['a non-string page', { pages: ['/python/', { url: '/go/' }] }],
  ])('returns the provided recents default for %s', (_label, stored) => {
    localStorage.setItem(KEYS.recents, JSON.stringify(stored));
    expect(readStore(KEYS.recents, EMPTY_RECENTS)).toEqual(EMPTY_RECENTS);
  });

  it('keeps valid learning stores', () => {
    const progress: Progress = {
      topics: { topic: { readPct: 50, lastAt: '2026-09-04T10:00:00Z' } },
      quizzes: { quiz: { score: 1, total: 2, at: '2026-09-04T10:00:00Z' } },
      paths: { path: { startedAt: '2026-09-04T10:00:00Z' } },
    };
    const flashcards: Flashcards = {
      cards: [
        {
          id: 'glossary:closure',
          kind: 'term',
          ref: 'glossary:closure',
          due: '2026-09-04T10:00:00Z',
          interval: 1,
          ease: 2.2,
          reps: 1,
        },
      ],
    };
    localStorage.setItem(KEYS.progress, JSON.stringify(progress));
    localStorage.setItem(KEYS.flashcards, JSON.stringify(flashcards));
    localStorage.setItem(KEYS.recents, JSON.stringify({ pages: ['/python/'] }));
    expect(readStore(KEYS.progress, EMPTY_PROGRESS)).toEqual(progress);
    expect(readStore(KEYS.flashcards, EMPTY_FLASHCARDS)).toEqual(flashcards);
    expect(readStore(KEYS.recents, EMPTY_RECENTS)).toEqual({ pages: ['/python/'] });
  });
});

describe('debounced writes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('localStorage', fakeStorage());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('flushes the pending value immediately', () => {
    writeStoreDebounced(KEYS.recents, { pages: ['/python/closures/'] });
    expect(readStore<Recents | null>(KEYS.recents, null)).toBeNull();

    flushStore(KEYS.recents);
    expect(readStore<Recents | null>(KEYS.recents, null)).toEqual({ pages: ['/python/closures/'] });

    // Nothing is left in flight, so the window elapsing must not write again.
    vi.advanceTimersByTime(1000);
    expect(readStore<Recents | null>(KEYS.recents, null)).toEqual({ pages: ['/python/closures/'] });
  });

  it('writes only the last value of a burst, after 500 ms', () => {
    writeStoreDebounced(KEYS.recents, { pages: ['/a/'] });
    writeStoreDebounced(KEYS.recents, { pages: ['/b/'] });
    writeStoreDebounced(KEYS.recents, { pages: ['/c/'] });

    vi.advanceTimersByTime(499);
    expect(readStore<Recents | null>(KEYS.recents, null)).toBeNull();

    vi.advanceTimersByTime(1);
    expect(readStore<Recents | null>(KEYS.recents, null)).toEqual({ pages: ['/c/'] });
  });
});
