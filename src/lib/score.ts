import type { Flashcard, Flashcards, Progress } from '@/lib/prefs';
import { NEW_CARD } from '@/lib/srs';

export const PASS_MARK = 0.7;

export function passed(score: number, total: number): boolean {
  return total > 0 && score / total >= PASS_MARK;
}

/** Records a quiz result; keeps the best score for the same id. */
export function recordQuiz(
  progress: Progress,
  id: string,
  score: number,
  total: number,
  now: Date,
): Progress {
  const prev = progress.quizzes[id];
  const better = !prev || score / total >= prev.score / prev.total;
  return {
    ...progress,
    quizzes: { ...progress.quizzes, [id]: better ? { score, total, at: now.toISOString() } : prev },
  };
}

export function completeTopic(progress: Progress, topicId: string, now: Date): Progress {
  const prev = progress.topics[topicId] ?? { readPct: 0, lastAt: now.toISOString() };
  return {
    ...progress,
    topics: {
      ...progress.topics,
      [topicId]: { ...prev, completedAt: prev.completedAt ?? now.toISOString(), lastAt: now.toISOString() },
    },
  };
}

export const quizCardId = (bank: string, item: string) => `quiz:${bank}#${item}`;
export const termCardId = (term: string) => `glossary:${term}`;

/** Adds cards that are not in the deck yet; existing cards (by id) are untouched. */
export function enqueueCards(
  deck: Flashcards,
  cards: Array<Pick<Flashcard, 'id' | 'kind' | 'ref' | 'source'>>,
  now: Date,
): Flashcards {
  const have = new Set(deck.cards.map((c) => c.id));
  const fresh = cards
    .filter((c) => !have.has(c.id))
    .map((c) => ({ ...c, ...NEW_CARD, due: now.toISOString() }));
  return fresh.length ? { cards: [...deck.cards, ...fresh] } : deck;
}
