import { describe, expect, it } from 'vitest';
import { completeTopic, enqueueCards, passed, quizCardId, recordQuiz, termCardId } from '@/lib/score';
import { EMPTY_FLASHCARDS, EMPTY_PROGRESS, type Flashcards, type Progress } from '@/lib/prefs';

const now = new Date('2026-09-04T10:00:00Z');

describe('passed', () => {
  it('uses a 70 percent pass mark and rejects an empty quiz', () => {
    expect(passed(7, 10)).toBe(true);
    expect(passed(6, 10)).toBe(false);
    expect(passed(0, 0)).toBe(false);
  });
});

describe('recordQuiz', () => {
  it('keeps the better score and the newer at on a tie', () => {
    const first = recordQuiz(EMPTY_PROGRESS, 'python/closures', 8, 10, now);
    const later = new Date('2026-09-05T10:00:00Z');
    const worse = recordQuiz(first, 'python/closures', 7, 10, later);
    expect(worse.quizzes['python/closures']).toEqual({ score: 8, total: 10, at: now.toISOString() });

    const tie = recordQuiz(first, 'python/closures', 4, 5, later);
    expect(tie.quizzes['python/closures']).toEqual({ score: 4, total: 5, at: later.toISOString() });
  });
});

describe('completeTopic', () => {
  it('never overwrites an existing completedAt', () => {
    const completedAt = '2026-09-01T08:00:00.000Z';
    const progress: Progress = {
      ...EMPTY_PROGRESS,
      topics: {
        'python/closures': { readPct: 100, completedAt, lastAt: '2026-09-02T08:00:00.000Z' },
      },
    };

    expect(completeTopic(progress, 'python/closures', now).topics['python/closures']).toEqual({
      readPct: 100,
      completedAt,
      lastAt: now.toISOString(),
    });
  });
});

describe('card ids', () => {
  it('builds stable ids for quiz items and glossary terms', () => {
    expect(quizCardId('python/closures', 'late-binding')).toBe('quiz:python/closures#late-binding');
    expect(termCardId('closure')).toBe('glossary:closure');
  });
});

describe('enqueueCards', () => {
  it('dedupes by id and returns the same object when nothing is new', () => {
    const existing = {
      id: termCardId('closure'),
      kind: 'term' as const,
      ref: 'glossary:closure',
      due: '2026-09-10T10:00:00.000Z',
      interval: 7,
      ease: 2.4,
      reps: 2,
      source: 'terms' as const,
    };
    const deck: Flashcards = { cards: [existing] };
    const next = enqueueCards(
      deck,
      [
        { id: existing.id, kind: existing.kind, ref: existing.ref, source: existing.source },
        {
          id: quizCardId('python/closures', 'late-binding'),
          kind: 'quiz',
          ref: 'quiz:python/closures#late-binding',
          source: 'quiz',
        },
      ],
      now,
    );

    expect(next.cards).toEqual([
      existing,
      {
        id: 'quiz:python/closures#late-binding',
        kind: 'quiz',
        ref: 'quiz:python/closures#late-binding',
        source: 'quiz',
        interval: 0,
        ease: 2.2,
        reps: 0,
        due: now.toISOString(),
      },
    ]);
    expect(enqueueCards(EMPTY_FLASHCARDS, [], now)).toBe(EMPTY_FLASHCARDS);
    expect(
      enqueueCards(
        deck,
        [{ id: existing.id, kind: existing.kind, ref: existing.ref, source: existing.source }],
        now,
      ),
    ).toBe(deck);
  });
});
