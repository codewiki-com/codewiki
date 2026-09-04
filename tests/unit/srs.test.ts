import { describe, expect, it } from 'vitest';
import { rate, isDue, dueOn, NEW_CARD, type Rating } from '@/lib/srs';

const now = new Date('2026-09-04T10:00:00Z');
const card = {
  ...NEW_CARD,
  id: 'c1',
  kind: 'term' as const,
  ref: 'glossary:closure',
  due: now.toISOString(),
};

describe('rate', () => {
  it('again resets the interval to one day and lowers ease', () => {
    const next = rate({ ...card, interval: 7, ease: 2.5, reps: 3 }, 'again', now);
    expect(next.interval).toBe(1);
    expect(next.ease).toBeCloseTo(2.3);
    expect(next.reps).toBe(4);
    expect(next.due).toBe('2026-09-05T10:00:00.000Z');
  });
  it('hard grows slowly and lowers ease', () => {
    const next = rate({ ...card, interval: 10, ease: 2.0 }, 'hard', now);
    expect(next.interval).toBe(12);
    expect(next.ease).toBeCloseTo(1.85);
  });
  it('good multiplies by ease', () => {
    expect(rate({ ...card, interval: 3, ease: 2.0 }, 'good', now).interval).toBe(6);
  });
  it('easy multiplies by ease × 1.3 and raises ease', () => {
    const next = rate({ ...card, interval: 3, ease: 2.0 }, 'easy', now);
    expect(next.interval).toBe(8); // round(3 × 2.0 × 1.3) = 8
    expect(next.ease).toBeCloseTo(2.15);
  });
  it('clamps ease to [1.3, 2.5] and interval to [1, 30]', () => {
    expect(rate({ ...card, interval: 1, ease: 1.3 }, 'again', now).ease).toBe(1.3);
    expect(rate({ ...card, interval: 30, ease: 2.5 }, 'easy', now).ease).toBe(2.5);
    expect(rate({ ...card, interval: 30, ease: 2.5 }, 'easy', now).interval).toBe(30);
  });
  it('a new card rated good goes to three days', () => {
    expect(rate(card, 'good', now).interval).toBe(3);
  });
  it('rejects unknown ratings at the type level', () => {
    const r: Rating = 'good';
    expect(['again', 'hard', 'good', 'easy']).toContain(r);
  });
});

describe('isDue / dueOn', () => {
  it('is due when due <= now, not when suspended', () => {
    expect(isDue(card, now)).toBe(true);
    expect(isDue({ ...card, suspended: true }, now)).toBe(false);
    expect(isDue({ ...card, due: '2026-09-05T00:00:00Z' }, now)).toBe(false);
  });
  it('dueOn buckets the next seven days, today first', () => {
    const cards = [
      card,
      { ...card, id: 'c2', due: '2026-09-06T09:00:00Z' },
      { ...card, id: 'c3', due: '2026-08-01T00:00:00Z' },
    ];
    expect(dueOn(cards, now)).toEqual([2, 0, 1, 0, 0, 0, 0]);
  });
});
