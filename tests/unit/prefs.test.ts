import { getContinue, dueFlashcards } from '@/lib/prefs';

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
