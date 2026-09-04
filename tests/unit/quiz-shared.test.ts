import { gradeFill, gradeLines, gradeOptions, optionKey, persist } from '@/islands/quiz-shared';
import {
  EMPTY_FLASHCARDS,
  EMPTY_PROGRESS,
  KEYS,
  readStore,
  type Flashcards,
  type Progress,
} from '@/lib/prefs';
import type { QuizItem } from '@/schemas/quiz';

const localized = (en: string) => ({ en, zh: `中：${en}` });
const shared = {
  id: 'item',
  prompt: localized('Question'),
  explanation: localized('Explanation'),
  difficulty: 'beginner' as const,
  tags: [],
};

const fill: Extract<QuizItem, { type: 'fill' }> = {
  ...shared,
  type: 'fill',
  answer: 'a | B',
};

const spotbug: Extract<QuizItem, { type: 'spotbug' }> = {
  ...shared,
  type: 'spotbug',
  code: 'line\n'.repeat(20),
  lang: 'text',
  issues: [
    { line: 4, kind: 'correctness', note: localized('First') },
    { line: 14, lines: 17, kind: 'edge-case', note: localized('Span') },
  ],
};

/** Minimal in-memory `Storage` for the guarded preference helpers. */
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

describe('quiz answer grading', () => {
  it('maps option indexes to the 1–9 keyboard row', () => {
    expect(Array.from({ length: 9 }, (_, index) => optionKey(index))).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ]);
    expect(optionKey(9)).toBe('');
  });

  it('grades an option against the one authored correct answer', () => {
    const item: Extract<QuizItem, { type: 'mcq' }> = {
      ...shared,
      type: 'mcq',
      options: [
        { text: localized('No'), correct: false },
        { text: localized('Yes'), correct: true },
      ],
    };
    expect(gradeOptions(item, 1)).toEqual({ correct: true, correctIndex: 1 });
    expect(gradeOptions(item, 0)).toEqual({ correct: false, correctIndex: 1 });
  });

  it('accepts trimmed, case-insensitive fill alternatives', () => {
    expect(gradeFill(fill, ' b ')).toBe(true);
    expect(gradeFill(fill, 'C')).toBe(false);
  });
});

describe('line issue grading', () => {
  it('finds a spanning issue from a mark inside its inclusive range', () => {
    const result = gradeLines(spotbug, [15]);
    expect(result.found).toEqual([spotbug.issues[1]]);
    expect(result.missed).toEqual([spotbug.issues[0]]);
    expect(result).toMatchObject({ score: 1, total: 2 });
  });

  it('does not count marks on non-issue lines', () => {
    expect(gradeLines(spotbug, [13])).toEqual({
      found: [],
      missed: spotbug.issues,
      score: 0,
      total: 2,
    });
  });
});

describe('quiz persistence', () => {
  beforeEach(() => vi.stubGlobal('localStorage', fakeStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it('writes both stores and enqueues a quiz card only on a miss', () => {
    const now = new Date('2026-09-04T10:00:00Z');
    persist('python/closures', fill.id, 1, 1, fill, now);

    expect(readStore<Progress>(KEYS.progress, EMPTY_PROGRESS).quizzes['python/closures#item']).toEqual({
      score: 1,
      total: 1,
      at: now.toISOString(),
    });
    expect(localStorage.getItem(KEYS.flashcards)).not.toBeNull();
    expect(readStore<Flashcards>(KEYS.flashcards, EMPTY_FLASHCARDS).cards).toEqual([]);

    localStorage.clear();
    persist('python/closures', fill.id, 0, 1, fill, now);
    expect(readStore<Flashcards>(KEYS.flashcards, EMPTY_FLASHCARDS).cards).toEqual([
      {
        id: 'quiz:python/closures#item',
        kind: 'quiz',
        ref: 'quiz:python/closures#item',
        source: 'quiz',
        interval: 0,
        ease: 2.2,
        reps: 0,
        due: now.toISOString(),
      },
    ]);
  });
});
