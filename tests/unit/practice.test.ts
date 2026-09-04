import {
  catalogueFrom,
  DEFAULT_MINUTES,
  ITEM_TYPES,
  kataOfTheDay,
  practiceItemTitle,
  practiceUrl,
  stripAnswers,
  typeLabelKey,
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
      },
    ]);

    const stripped = stripAnswers(source);
    const encoded = JSON.stringify(stripped);
    for (const key of ['correct', 'answer', 'issues', 'explanation']) {
      expect(encoded).not.toContain(`"${key}"`);
    }
    expect(stripped.items.map((item) => item.url)).toEqual([
      '/practice/mcq/python/closures/mcq/',
      '/practice/predict/python/closures/predict/',
      '/practice/fill/python/closures/fill/',
      '/practice/spotbug/python/closures/spotbug/',
      '/practice/review/python/closures/review/',
    ]);
    expect(stripped.items[0]!.options).toEqual([{ text: localized('A') }, { text: localized('B') }]);
  });
});
