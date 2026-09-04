import { topicSchema } from '@/schemas/topic';
import { issueKind, quizSchema } from '@/schemas/quiz';
import { interviewSchema } from '@/schemas/interview';
import { termSchema } from '@/schemas/glossary';
import { pathSchema } from '@/schemas/path';
import { cheatsheetSchema } from '@/schemas/cheatsheet';

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
        issues: [{ line: 1, kind: 'correctness', note: { en: 'n', zh: '注' } }],
      }),
    ).not.toThrow();
    expect(() => parse({ ...shared, id: 'q4', type: 'predict', code: 'x', lang: 'python' })).toThrow();
    expect(() => parse({ ...shared, id: 'q5', type: 'essay' })).toThrow();
  });
  it('requires at least one item', () => {
    expect(() => quizSchema.parse({ id: 'a/b', topic: 'a/b', items: [] })).toThrow();
  });
  it('restricts review issue kinds to the closed list', () => {
    const shared = { prompt: item.prompt, explanation: item.explanation, difficulty: 'beginner' };
    const review = (kind: string) => ({
      ...shared,
      id: 'q6',
      type: 'review',
      code: 'x = 1',
      lang: 'python',
      issues: [{ line: 1, kind, note: { en: 'n', zh: '注' } }],
    });
    const parse = (i: unknown) => quizSchema.parse({ id: 'a/b', topic: 'a/b', items: [i] });
    expect(() => parse(review('bug'))).toThrow();
    expect(() => parse(review('edge-case'))).not.toThrow();
  });
  it('accepts a full review item with task, right and a checklist', () => {
    const quiz = quizSchema.parse({
      id: 'a/b',
      topic: 'a/b',
      items: [
        {
          id: 'q7',
          type: 'review',
          prompt: item.prompt,
          explanation: item.explanation,
          difficulty: 'advanced',
          code: 'x = 1',
          lang: 'python',
          task: { en: 'Cache the results', zh: '缓存结果' },
          right: { en: 'The signature is correct', zh: '签名是正确的' },
          checklist: [{ en: 'Run the tests', zh: '运行测试' }],
          tests: 'pytest -q',
          minutes: 6,
          issues: [
            { line: 1, lines: 3, kind: 'security', note: { en: 'n', zh: '注' } },
            { line: 5, kind: 'edge-case', note: { en: 'n', zh: '注' } },
          ],
        },
      ],
    });
    const parsed = quiz.items[0]!;
    expect(parsed.type).toBe('review');
    if (parsed.type !== 'review') throw new Error('expected a review item');
    expect(parsed.checklist).toHaveLength(1);
    expect(parsed.task?.en).toBe('Cache the results');
    expect(parsed.right?.zh).toBe('签名是正确的');
    expect(parsed.issues[0]!.lines).toBe(3);
    expect(parsed.minutes).toBe(6);
  });
  it('defaults the review checklist to empty', () => {
    const quiz = quizSchema.parse({
      id: 'a/b',
      topic: 'a/b',
      items: [
        {
          id: 'q8',
          type: 'review',
          prompt: item.prompt,
          explanation: item.explanation,
          difficulty: 'beginner',
          code: 'x = 1',
          lang: 'python',
          issues: [{ line: 1, kind: 'readability', note: { en: 'n', zh: '注' } }],
        },
      ],
    });
    const parsed = quiz.items[0]!;
    if (parsed.type !== 'review') throw new Error('expected a review item');
    expect(parsed.checklist).toEqual([]);
  });
  it('accepts review titles alongside issue spans, tests and positive minutes', () => {
    const quiz = quizSchema.parse({
      id: 'a/b',
      topic: 'a/b',
      items: [
        {
          id: 'q9',
          type: 'review',
          title: { en: 'Review a cache', zh: '审查缓存' },
          prompt: item.prompt,
          explanation: item.explanation,
          difficulty: 'intermediate',
          code: 'x = 1',
          lang: 'python',
          task: { en: 'Cache the results', zh: '缓存结果' },
          right: { en: 'The signature is correct', zh: '签名是正确的' },
          checklist: [{ en: 'Run the tests', zh: '运行测试' }],
          tests: 'pytest -q',
          minutes: 3,
          issues: [{ line: 1, lines: 2, kind: 'readability', note: { en: 'n', zh: '注' } }],
        },
      ],
    });
    expect(quiz.items[0]).toMatchObject({
      title: { en: 'Review a cache' },
      minutes: 3,
      checklist: [{ en: 'Run the tests' }],
    });
  });
  it('exports the closed issue-kind vocabulary', () => {
    expect(issueKind.options).toEqual(['security', 'correctness', 'edge-case', 'readability', 'performance']);
    expect(() => issueKind.parse('bug')).toThrow();
  });
});

describe('interview schema', () => {
  const base = {
    track: 'python',
    items: [
      {
        id: 'closures-late-binding',
        question: {
          en: 'Why do loop closures capture the last value?',
          zh: '为什么循环闭包捕获最后一个值？',
        },
        answer: { en: 'They close over the variable, not its value.', zh: '它们捕获的是变量，而不是值。' },
        topics: ['python/closures'],
        level: 'intermediate',
      },
    ],
  };
  it('accepts an item carrying a section and a frequency', () => {
    const parsed = interviewSchema.parse({
      ...base,
      items: [
        {
          ...base.items[0],
          section: { en: 'Language core', zh: '语言核心' },
          frequency: 'common',
        },
      ],
    });
    expect(parsed.items[0]!.section?.en).toBe('Language core');
    expect(parsed.items[0]!.frequency).toBe('common');
  });
  it('leaves section and frequency optional and rejects an unknown frequency', () => {
    const parsed = interviewSchema.parse(base);
    expect(parsed.items[0]!.section).toBeUndefined();
    expect(parsed.items[0]!.frequency).toBeUndefined();
    expect(() =>
      interviewSchema.parse({ ...base, items: [{ ...base.items[0], frequency: 'sometimes' }] }),
    ).toThrow();
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
  it('accepts a localized rationale', () => {
    expect(
      pathSchema.parse({ ...path, rationale: { en: 'Why this order.', zh: '为何采用这个顺序。' } }).rationale,
    ).toEqual({ en: 'Why this order.', zh: '为何采用这个顺序。' });
  });
  it('rejects unknown levels and malformed topic ids', () => {
    expect(() => pathSchema.parse({ ...path, level: { from: 'expert', to: 'god' } })).toThrow();
    expect(() =>
      pathSchema.parse({ ...path, milestones: [{ ...path.milestones[0], topics: ['variables-types'] }] }),
    ).toThrow();
  });
});

describe('cheatsheet schema', () => {
  const sheet = {
    title: 'Python cheatsheet',
    description: 'The syntax that belongs on one printed page.',
    track: 'python',
    verified: { version: 'Python 3.14', date: '2026-09-04' },
    reviewed: '2026-09-04',
    status: 'reviewed',
  };

  it('parses dates and defaults terms, tags and alignment', () => {
    const parsed = cheatsheetSchema.parse(sheet);
    expect(parsed.verified.date).toBeInstanceOf(Date);
    expect(parsed.reviewed).toBeInstanceOf(Date);
    expect(parsed.terms).toEqual([]);
    expect(parsed.tags).toEqual([]);
    expect(parsed.aligned).toBe(false);
  });

  it('accepts calibration tags and rejects long descriptions or malformed slugs', () => {
    expect(cheatsheetSchema.parse({ ...sheet, tags: ['calibration'] }).tags).toEqual(['calibration']);
    expect(() => cheatsheetSchema.parse({ ...sheet, description: 'x'.repeat(161) })).toThrow();
    expect(() => cheatsheetSchema.parse({ ...sheet, track: 'Python Core' })).toThrow();
  });
});
