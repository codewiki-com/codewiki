import { describe, expect, it } from 'vitest';

import { faceOf, parseRef, visibleDeck, type GlossaryCardTerm, type QuizCardBanks } from '@/lib/cards';
import { DEFAULT_PREFS, type Flashcard, type Flashcards } from '@/lib/prefs';

const now = new Date('2026-09-04T10:00:00.000Z');
const term = (id: string, due: string, source: Flashcard['source'] = 'terms'): Flashcard => ({
  id,
  kind: 'term',
  ref: `glossary:${id}`,
  due,
  interval: 0,
  ease: 2.2,
  reps: 0,
  source,
});

describe('parseRef', () => {
  it('parses glossary, quiz and per-issue review references', () => {
    expect(parseRef('glossary:closure')).toEqual({ kind: 'term', term: 'closure' });
    expect(parseRef('quiz:python/closures#predict-loop-binding')).toEqual({
      kind: 'quiz',
      bank: 'python/closures',
      item: 'predict-loop-binding',
    });
    expect(parseRef('quiz:python/closures#predict-loop-binding:14')).toEqual({
      kind: 'quiz',
      bank: 'python/closures',
      item: 'predict-loop-binding',
      line: 14,
    });
    expect(parseRef('not-a-card')).toBeUndefined();
  });
});

describe('visibleDeck', () => {
  it('filters suspended and disabled sources, then puts due cards first in due order', () => {
    const manual = term('manual', '2026-09-03T08:00:00.000Z', 'manual');
    const suspended = { ...term('suspended', '2026-09-01T08:00:00.000Z'), suspended: true };
    const deck: Flashcards = {
      cards: [
        term('future', '2026-09-07T08:00:00.000Z'),
        term('due-later', '2026-09-04T09:00:00.000Z'),
        manual,
        suspended,
        term('due-first', '2026-09-02T08:00:00.000Z'),
      ],
    };
    const prefs = { ...DEFAULT_PREFS, cardSources: { terms: true, quiz: true, manual: false } };

    expect(visibleDeck(deck, prefs, now).map((card) => card.id)).toEqual([
      'due-first',
      'due-later',
      'future',
    ]);
    expect(deck.cards[0]?.id).toBe('future');
  });
});

describe('faceOf', () => {
  const glossary: GlossaryCardTerm[] = [
    {
      id: 'closure',
      en: 'Closure',
      zh: '闭包',
      short: { en: 'A function plus captured bindings.', zh: '函数与其捕获的绑定。' },
      topics: ['python/closures'],
    },
  ];
  const banks: QuizCardBanks = {
    'python/closures': {
      public: {
        id: 'python/closures',
        items: [
          {
            id: 'binding',
            prompt: { en: 'What prints?', zh: '输出什么？' },
            code: 'print(read())',
            url: '/practice/predict/python/closures/binding/',
          },
          {
            id: 'review',
            prompt: { en: 'Review this.', zh: '审查这段代码。' },
            code: 'unsafe()',
            url: '/practice/review/python/closures/review/',
          },
        ],
      },
      answers: {
        id: 'python/closures',
        items: [
          {
            id: 'binding',
            prompt: { en: 'What prints?', zh: '输出什么？' },
            explanation: { en: 'The binding is resolved later.', zh: '绑定会在之后解析。' },
            options: [
              { text: { en: '1', zh: '1' }, correct: false },
              { text: { en: '2', zh: '2' }, correct: true },
            ],
          },
          {
            id: 'review',
            prompt: { en: 'Review this.', zh: '审查这段代码。' },
            explanation: { en: 'Use the safe call.', zh: '应使用安全调用。' },
            issues: [{ line: 14, note: { en: 'This call is unsafe.', zh: '这个调用不安全。' } }],
          },
        ],
      },
    },
  };

  it('builds a bilingual glossary face with section and glossary links', () => {
    const face = faceOf(term('closure', now.toISOString()), glossary, banks);
    expect(face?.front).toMatchObject({ title: 'Closure', alt: '闭包' });
    expect(face?.back).toMatchObject({
      text: 'A function plus captured bindings.',
      textZh: '函数与其捕获的绑定。',
    });
    expect(face?.back.links).toEqual([
      { href: '/python/closures/', kind: 'section' },
      { href: '/glossary/closure/', kind: 'glossary' },
    ]);
  });

  it('uses the public prompt and the answer-bearing bank for a quiz face', () => {
    const card: Flashcard = {
      ...term('quiz', now.toISOString()),
      kind: 'quiz',
      ref: 'quiz:python/closures#binding',
      source: 'quiz',
    };
    const face = faceOf(card, glossary, banks);
    expect(face?.front).toMatchObject({ title: 'What prints?', alt: '输出什么？', code: 'print(read())' });
    expect(face?.back.text).toBe('2\n\nThe binding is resolved later.');
    expect(face?.back.textZh).toBe('2\n\n绑定会在之后解析。');
  });

  it('uses a ReviewKata line suffix to select one issue', () => {
    const card: Flashcard = {
      ...term('review', now.toISOString()),
      kind: 'quiz',
      ref: 'quiz:python/closures#review:14',
      source: 'quiz',
    };
    const face = faceOf(card, glossary, banks);
    expect(face?.back.text).toBe('This call is unsafe.\n\nUse the safe call.');
    expect(face?.back.textZh).toBe('这个调用不安全。\n\n应使用安全调用。');
  });
});
