import { topicSchema } from '@/schemas/topic';
import { quizSchema } from '@/schemas/quiz';
import { termSchema } from '@/schemas/glossary';
import { pathSchema } from '@/schemas/path';

describe('topic schema', () => {
  const base = {
    title: 'Closures',
    description: 'x'.repeat(50),
    track: 'python',
    section: 'functions-deeper',
    difficulty: 'intermediate',
    tags: ['closures'],
    status: 'reviewed',
    reviewed: new Date('2026-09-03'),
    verified: { version: 'Python 3.14', date: new Date('2026-09-03') },
  };
  it('accepts a minimal reviewed topic', () => {
    expect(topicSchema.parse(base).status).toBe('reviewed');
  });
  it('rejects unknown track and long descriptions', () => {
    expect(() => topicSchema.parse({ ...base, track: 'cobol' })).toThrow();
    expect(() => topicSchema.parse({ ...base, description: 'x'.repeat(200) })).toThrow();
  });
  it('defaults', () => {
    const t = topicSchema.parse(base);
    expect(t.prerequisites).toEqual([]);
    expect(t.aligned).toBe(false);
  });
  it('requires a reviewed date when status is reviewed', () => {
    expect(() => topicSchema.parse({ ...base, reviewed: undefined })).toThrow();
    expect(topicSchema.parse({ ...base, status: 'draft', reviewed: undefined }).reviewed).toBeNull();
  });
  it('rejects malformed prerequisite and related ids', () => {
    expect(() => topicSchema.parse({ ...base, prerequisites: ['functions'] })).toThrow();
    expect(() => topicSchema.parse({ ...base, related: ['python/decorators/en'] })).toThrow();
  });
});

describe('quiz schema', () => {
  const item = {
    id: 'q1',
    type: 'mcq',
    prompt: { en: 'Q', zh: '问' },
    options: [
      { text: { en: 'a', zh: '甲' }, correct: true },
      { text: { en: 'b', zh: '乙' }, correct: true },
    ],
    explanation: { en: 'e', zh: '解' },
    difficulty: 'beginner',
  };
  it('requires exactly one correct mcq option', () => {
    expect(() =>
      quizSchema.parse({ id: 'python/closures', topic: 'python/closures', items: [item] }),
    ).toThrow();
  });
  it('accepts an mcq item with a single correct option', () => {
    const options = [item.options[0], { text: { en: 'b', zh: '乙' }, correct: false }];
    const quiz = quizSchema.parse({
      id: 'python/closures',
      topic: 'python/closures',
      items: [{ ...item, options }],
    });
    expect(quiz.items[0]!.tags).toEqual([]);
  });
  it('accepts the other item types and rejects missing type fields', () => {
    const shared = { prompt: item.prompt, explanation: item.explanation, difficulty: 'beginner' };
    const parse = (i: unknown) => quizSchema.parse({ id: 'a/b', topic: 'a/b', items: [i] });
    expect(() => parse({ ...shared, id: 'q2', type: 'fill', answer: 'nonlocal' })).not.toThrow();
    expect(() =>
      parse({
        ...shared,
        id: 'q3',
        type: 'review',
        code: 'x = 1',
        lang: 'python',
        issues: [{ line: 1, kind: 'bug', note: { en: 'n', zh: '注' } }],
      }),
    ).not.toThrow();
    expect(() => parse({ ...shared, id: 'q4', type: 'predict', code: 'x', lang: 'python' })).toThrow();
    expect(() => parse({ ...shared, id: 'q5', type: 'essay' })).toThrow();
  });
  it('requires at least one item', () => {
    expect(() => quizSchema.parse({ id: 'a/b', topic: 'a/b', items: [] })).toThrow();
  });
});

describe('glossary schema', () => {
  const term = { en: 'Free variable', zh: '自由变量', short: { en: 's', zh: '短' } };
  it('defaults aliases and topics, and keeps the id optional', () => {
    const t = termSchema.parse(term);
    expect(t.aliases).toEqual([]);
    expect(t.topics).toEqual([]);
    expect(termSchema.parse({ ...term, id: 'free-variable' }).id).toBe('free-variable');
  });
  it('rejects an id that is not a slug', () => {
    expect(() => termSchema.parse({ ...term, id: 'Free Variable' })).toThrow();
  });
  it('caps short definitions at 140 characters in both languages', () => {
    expect(() => termSchema.parse({ ...term, short: { en: 'x'.repeat(141), zh: '短' } })).toThrow();
    expect(() => termSchema.parse({ ...term, short: { en: 's', zh: '短'.repeat(141) } })).toThrow();
    expect(termSchema.parse({ ...term, short: { en: 'x'.repeat(140), zh: '短' } }).short.en).toHaveLength(
      140,
    );
  });
});

describe('path schema', () => {
  const path = {
    id: 'python-from-zero',
    title: { en: 'Python from zero', zh: '从零学 Python' },
    description: { en: 'd', zh: '描述' },
    tracks: ['python'],
    level: { from: 'beginner', to: 'intermediate' },
    hours: 14,
    outcomes: [{ en: 'o', zh: '成果' }],
    milestones: [
      {
        id: 'm1',
        title: { en: 'Foundations', zh: '基础' },
        topics: ['python/variables-types'],
        checkpoint: 'python/checkpoint-1',
      },
    ],
  };
  it('parses a path and defaults its edges', () => {
    expect(pathSchema.parse(path).edges).toEqual([]);
  });
  it('rejects unknown levels and malformed topic ids', () => {
    expect(() => pathSchema.parse({ ...path, level: { from: 'expert', to: 'god' } })).toThrow();
    expect(() =>
      pathSchema.parse({ ...path, milestones: [{ ...path.milestones[0], topics: ['variables-types'] }] }),
    ).toThrow();
  });
});
