/**
 * SM-2-lite (spec §2.6). Intervals live on the 1 · 3 · 7 · 14 · 30 day ladder for a new card
 * and are multiplied by ease afterwards; ease stays inside [1.3, 2.5] and intervals inside
 * [1, 30] days. Pure functions: the island owns the store.
 */
import type { Flashcard } from '@/lib/prefs';

export type Rating = 'again' | 'hard' | 'good' | 'easy';
export const RATINGS: Rating[] = ['again', 'hard', 'good', 'easy'];
export const LADDER = [1, 3, 7, 14, 30];
export const EASE_MIN = 1.3;
export const EASE_MAX = 2.5;
export const INTERVAL_MAX = 30;
const DAY = 86_400_000;

export const NEW_CARD: Pick<Flashcard, 'interval' | 'ease' | 'reps'> = { interval: 0, ease: 2.2, reps: 0 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Next interval in days for a card at `interval` rated `rating`. */
export function nextInterval(interval: number, ease: number, rating: Rating): number {
  if (rating === 'again') return 1;
  if (interval === 0) return rating === 'hard' ? 1 : rating === 'good' ? LADDER[1] : LADDER[2];
  const factor = rating === 'hard' ? 1.2 : rating === 'good' ? ease : ease * 1.3;
  return clamp(Math.round(interval * factor), 1, INTERVAL_MAX);
}

export function nextEase(ease: number, rating: Rating): number {
  const delta = rating === 'again' ? -0.2 : rating === 'hard' ? -0.15 : rating === 'easy' ? 0.15 : 0;
  return Math.round(clamp(ease + delta, EASE_MIN, EASE_MAX) * 100) / 100;
}

export function rate(card: Flashcard, rating: Rating, now: Date): Flashcard {
  const interval = nextInterval(card.interval, card.ease, rating);
  return {
    ...card,
    interval,
    ease: nextEase(card.ease, rating),
    reps: card.reps + 1,
    due: new Date(now.getTime() + interval * DAY).toISOString(),
  };
}

export function isDue(card: Flashcard, now: Date): boolean {
  return !card.suspended && Date.parse(card.due) <= now.getTime();
}

/** Cards due per day for the next seven days; overdue cards count as today. */
export function dueOn(cards: Flashcard[], now: Date): number[] {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  for (const c of cards) {
    if (c.suspended) continue;
    const day = Math.floor((Date.parse(c.due) - start.getTime()) / DAY);
    const i = clamp(day, 0, 6);
    if (day <= 6) buckets[i]++;
  }
  return buckets;
}

/** Interval label for a rating button, e.g. "7 days". */
export function previewInterval(card: Flashcard, rating: Rating): number {
  return nextInterval(card.interval, card.ease, rating);
}
