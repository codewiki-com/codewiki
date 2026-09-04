import { EMPTY_PROGRESS, type Progress } from '@/lib/prefs';
import { nextStep, pathProgress, weeksLeft } from '@/lib/paths';

const path = {
  milestones: [
    {
      id: 'm1',
      title: { en: 'One', zh: '一' },
      topics: ['python/a', 'python/b'],
      checkpoint: 'python/checkpoint-1',
    },
    {
      id: 'm2',
      title: { en: 'Two', zh: '二' },
      topics: ['python/c', 'python/d'],
      checkpoint: 'python/checkpoint-2',
    },
  ],
};

const withProgress = (partial: Partial<Progress>): Progress => ({
  ...EMPTY_PROGRESS,
  ...partial,
});

describe('path progress', () => {
  it('makes the first pending topic current and locks later milestones', () => {
    const result = pathProgress(path, EMPTY_PROGRESS);
    expect(result).toMatchObject({ done: 0, total: 4, milestone: 1 });
    expect(result.states).toEqual({
      'python/a': 'cur',
      'python/b': 'open',
      'python/c': 'lock',
      'python/d': 'lock',
    });
    expect(result.checkpoints).toEqual({ m1: 'open', m2: 'locked' });
  });

  it('uses completedAt, not read percentage, and lets done override a lock', () => {
    const progress = withProgress({
      topics: {
        'python/a': { readPct: 100, lastAt: '2026-09-04T00:00:00.000Z' },
        'python/c': {
          readPct: 1,
          completedAt: '2026-09-04T00:00:00.000Z',
          lastAt: '2026-09-04T00:00:00.000Z',
        },
      },
    });
    const result = pathProgress(path, progress);
    expect(result.done).toBe(1);
    expect(result.states['python/a']).toBe('cur');
    expect(result.states['python/c']).toBe('done');
  });

  it('opens the first milestone whose checkpoint has not passed', () => {
    const progress = withProgress({
      quizzes: {
        'python/checkpoint-1': { score: 7, total: 10, at: '2026-09-04T00:00:00.000Z' },
      },
    });
    const result = pathProgress(path, progress);
    expect(result.milestone).toBe(2);
    expect(result.checkpoints).toEqual({ m1: 'passed', m2: 'open' });
    expect(result.states['python/a']).toBe('open');
    expect(result.states['python/c']).toBe('cur');
  });

  it('offers the checkpoint after every topic in the current milestone is done', () => {
    const at = '2026-09-04T00:00:00.000Z';
    const progress = withProgress({
      topics: {
        'python/a': { readPct: 100, completedAt: at, lastAt: at },
        'python/b': { readPct: 100, completedAt: at, lastAt: at },
      },
    });
    expect(nextStep(path, progress)).toEqual({ kind: 'checkpoint', id: 'python/checkpoint-1' });
  });

  it('offers the first incomplete topic of the current milestone', () => {
    expect(nextStep(path, EMPTY_PROGRESS)).toEqual({ kind: 'topic', id: 'python/a' });
  });
});

describe('weeksLeft', () => {
  it('rounds partial weeks up for each study plan', () => {
    expect(weeksLeft(211, 30)).toBe(2);
    expect(weeksLeft(210, 30)).toBe(1);
    expect(weeksLeft(0, 15)).toBe(0);
  });
});
