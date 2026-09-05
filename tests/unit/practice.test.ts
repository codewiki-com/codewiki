import {
  catalogueFrom,
  dailyKataPool,
  dailyKataWindow,
  DEFAULT_MINUTES,
  ITEM_TYPES,
  kataOfTheDay,
  practiceItemTitle,
  practiceUrl,
  stripAnswers,
  typeLabelKey,
  utcDay,
  type ItemType,
  type QuizBank,
} from '@/lib/practice';
import { quizSchema } from '@/schemas/quiz';

const localized = (en: string, zh = `中：${en}`) => ({ en, zh });

function bank(items: unknown[], id = 'python/closures'): QuizBank {
  return {
    id,
    data: quizSchema.parse({ topic: id, items }),
  };
}

const shared = {
  prompt: localized('Question'),
  explanation: localized('Explanation'),
  difficulty: 'beginner' as const,
};

describe('practiceUrl', () => {
  const item = { type: 'review' as const, track: 'python', slug: 'closures', item: 'review-one' };

  it('builds the English and Chinese practice routes', () => {
    expect(practiceUrl(item, 'en')).toBe('/practice/review/python/closures/review-one/');
    expect(practiceUrl(item, 'zh')).toBe('/zh/practice/review/python/closures/review-one/');
  });
});

describe('kataOfTheDay', () => {
  const items = Array.from({ length: 10 }, (_, index) => `kata-${index}`);

  it('is stable throughout the same UTC day', () => {
    expect(kataOfTheDay(items, new Date('2026-09-04T00:00:00Z'))).toBe(
      kataOfTheDay(items, new Date('2026-09-04T23:59:59Z')),
    );
  });

  it('selects at least two different items over 30 consecutive days', () => {
    const picks = new Set(
      Array.from({ length: 30 }, (_, day) => kataOfTheDay(items, new Date(Date.UTC(2026, 8, 1 + day)))),
    );
    expect(picks.size).toBeGreaterThan(1);
  });

  it('returns undefined for an empty list', () => {
    expect(kataOfTheDay([], new Date('2026-09-04T00:00:00Z'))).toBeUndefined();
  });
});

describe('the daily kata pool and window', () => {
  const pool = Array.from({ length: 12 }, (_, index) => `kata-${index}`);

  const typed = (types: ItemType[]) => types.map((type, index) => ({ type, id: `item-${index}` }));

  it('keeps only the code-bearing types', () => {
    const items = typed(['mcq', 'review', 'predict', 'spotbug', 'fill', 'review']);
    expect(dailyKataPool(items).map((item) => item.id)).toEqual(['item-1', 'item-3', 'item-5']);
    expect(dailyKataPool(items).every((item) => item.type === 'review' || item.type === 'spotbug')).toBe(
      true,
    );
  });

  it('returns one entry per day, starting with the kata of the day', () => {
    const date = new Date('2026-09-04T09:12:00Z');
    const window = dailyKataWindow(pool, date);
    expect(window).toHaveLength(7);
    expect(window[0]).toBe(kataOfTheDay(pool, date));
    expect(dailyKataWindow(pool, date, 3)).toHaveLength(3);
  });

  it('depends on the UTC day alone, so every timezone sees the same week', () => {
    // The same instant expressed three ways, then a local midnight in UTC+9 — which is still the
    // previous UTC day and must therefore select the previous day's window.
    const noon = new Date('2026-09-04T12:00:00Z');
    expect(dailyKataWindow(pool, new Date('2026-09-04T00:00:00Z'))).toEqual(dailyKataWindow(pool, noon));
    expect(dailyKataWindow(pool, new Date('2026-09-04T23:59:59Z'))).toEqual(dailyKataWindow(pool, noon));
    expect(dailyKataWindow(pool, new Date('2026-09-04T00:00:00+09:00'))).toEqual(
      dailyKataWindow(pool, new Date('2026-09-03T12:00:00Z')),
    );
    expect(utcDay(new Date('2026-09-04T00:00:00+09:00'))).toBe(utcDay(new Date('2026-09-03T15:00:00Z')));
  });

  it('opens every build on the kata of the day, so the home page and the hub agree', () => {
    for (let day = 0; day < 60; day += 1) {
      const date = new Date(Date.UTC(2026, 8, 1 + day, 7, 30));
      expect(dailyKataWindow(pool, date)[0]).toBe(kataOfTheDay(pool, date));
    }
  });

  it('never repeats yesterday while the pool holds more than one kata', () => {
    for (let size = 2; size <= 12; size += 1) {
      const items = Array.from({ length: size }, (_, index) => `kata-${index}`);
      for (let day = 0; day < 60; day += 1) {
        const window = dailyKataWindow(items, new Date(Date.UTC(2026, 8, 1 + day)));
        const repeated = window.filter((item, index) => index > 0 && item === window[index - 1]);
        expect(repeated, `pool of ${size} on day ${day}`).toEqual([]);
      }
    }
  });

  it('stays on the single kata of a one-item pool and is empty without one', () => {
    expect(dailyKataWindow(['only'], new Date('2026-09-04T00:00:00Z'))).toEqual(Array(7).fill('only'));
    expect(dailyKataWindow([], new Date('2026-09-04T00:00:00Z'))).toEqual([]);
    expect(dailyKataWindow(pool, new Date('2026-09-04T00:00:00Z'), 0)).toEqual([]);
  });
});

describe('practice catalogue', () => {
  it('defines a default duration for every item type', () => {
    expect(Object.keys(DEFAULT_MINUTES).sort()).toEqual([...ITEM_TYPES].sort());
    expect(ITEM_TYPES.every((type) => DEFAULT_MINUTES[type] > 0)).toBe(true);
  });

  it('maps every item type to its translation key', () => {
    expect(ITEM_TYPES.map(typeLabelKey)).toEqual([
      'practice.type.predict',
      'practice.type.spotbug',
      'practice.type.review',
      'practice.type.mcq',
      'practice.type.fill',
    ]);
  });

  it('catalogues loaded banks in stable order with defaults and language metadata', () => {
    const banks = [
      bank(
        [
          {
            ...shared,
            id: 'z-item',
            title: localized('A named prediction'),
            type: 'predict',
            code: 'print(1)',
            lang: 'python',
            options: [
              { text: localized('1'), correct: true },
              { text: localized('2'), correct: false },
            ],
          },
          { ...shared, id: 'a-item', type: 'fill', answer: 'cell', minutes: 7 },
        ],
        'python/closures',
      ),
    ];

    expect(catalogueFrom(banks)).toEqual([
      {
        bank: 'python/closures',
        track: 'python',
        slug: 'closures',
        item: 'a-item',
        type: 'fill',
        difficulty: 'beginner',
        minutes: 7,
        title: undefined,
        prompt: localized('Question'),
        tags: [],
        lang: undefined,
      },
      {
        bank: 'python/closures',
        track: 'python',
        slug: 'closures',
        item: 'z-item',
        type: 'predict',
        difficulty: 'beginner',
        minutes: DEFAULT_MINUTES.predict,
        title: localized('A named prediction'),
        prompt: localized('Question'),
        tags: [],
        lang: 'python',
      },
    ]);
  });

  it('uses an authored title or derives a compact one from the prompt', () => {
    expect(
      practiceItemTitle(
        { title: localized('Named kata'), prompt: localized('Prompt that is not the title.') },
        'en',
      ),
    ).toBe('Named kata');
    expect(practiceItemTitle({ prompt: localized('A short prompt.') }, 'en')).toBe('A short prompt');

    const long = `${'x'.repeat(94)}.`;
    const derived = practiceItemTitle({ prompt: localized(long) }, 'en');
    expect(Array.from(derived)).toHaveLength(90);
    expect(derived.endsWith('…')).toBe(true);
  });
});

describe('stripAnswers', () => {
  it('removes answer fields recursively and adds a practice URL to every item', () => {
    const source = bank([
      {
        ...shared,
        id: 'mcq',
        type: 'mcq',
        options: [
          { text: localized('A'), correct: true },
          { text: localized('B'), correct: false },
        ],
      },
      {
        ...shared,
        id: 'predict',
        type: 'predict',
        code: 'print(1)',
        lang: 'python',
        options: [
          { text: localized('1'), correct: true },
          { text: localized('2'), correct: false },
        ],
      },
      { ...shared, id: 'fill', type: 'fill', answer: 'cell' },
      {
        ...shared,
        id: 'spotbug',
        type: 'spotbug',
        code: 'x = 1',
        lang: 'python',
        issues: [{ line: 1, kind: 'correctness', note: localized('Wrong') }],
      },
      {
        ...shared,
        id: 'review',
        type: 'review',
        code: 'x = 1',
        lang: 'python',
        issues: [{ line: 1, kind: 'readability', note: localized('Name') }],
        right: localized('One thing was right'),
        checklist: [localized('Check every input')],
      },
    ]);

    const stripped = stripAnswers(source);
    const encoded = JSON.stringify(stripped);
    for (const key of ['correct', 'answer', 'issues', 'explanation', 'right', 'checklist']) {
      expect(encoded).not.toContain(`"${key}"`);
    }
    expect(stripped.items.map((item) => item.url)).toEqual([
      '/practice/mcq/python/closures/mcq/',
      '/practice/predict/python/closures/predict/',
      '/practice/fill/python/closures/fill/',
      '/practice/spotbug/python/closures/spotbug/',
      '/practice/review/python/closures/review/',
    ]);
    expect(stripped.items[0]).toMatchObject({
      type: 'mcq',
      options: [{ text: localized('A') }, { text: localized('B') }],
    });
    expect(stripped.items[3]).toMatchObject({ type: 'spotbug', issueCount: 1 });
    expect(stripped.items[4]).toMatchObject({ type: 'review', issueCount: 1 });
  });
});
