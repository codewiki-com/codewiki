import {
  cardSources,
  dueFlashcards,
  flushStore,
  getContinue,
  readStore,
  writeStoreDebounced,
  DEFAULT_PREFS,
  KEYS,
  type Prefs,
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
        bilingual: 'sideways',
        fontSize: 'huge',
        plan: 45,
        bilingualLayout: 'columns',
        interviewReveal: 'sometimes',
      }),
    );
    expect(readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS)).toEqual({
      ...DEFAULT_PREFS,
      depth: 'quick',
    });
  });

  it('preserves valid learning-layer preferences', () => {
    const stored: Prefs = {
      ...DEFAULT_PREFS,
      plan: 60,
      bilingualLayout: 'side',
      interviewReveal: 'all',
      cardSources: { terms: false, quiz: true, manual: false },
    };
    localStorage.setItem(KEYS.prefs, JSON.stringify(stored));
    expect(readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS)).toEqual(stored);
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
