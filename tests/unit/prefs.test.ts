import {
  dueFlashcards,
  flushStore,
  getContinue,
  readStore,
  writeStoreDebounced,
  KEYS,
  type Recents,
} from '@/lib/prefs';
import { PREFS_KEY } from '@/lib/theme';

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

  // The pre-paint theme bootstrap cannot import this module, so it keeps its own copy of the key.
  it('agrees with the theme bootstrap on the prefs key', () => {
    expect(KEYS.prefs).toBe(PREFS_KEY);
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
