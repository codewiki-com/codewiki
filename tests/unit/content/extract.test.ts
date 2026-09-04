import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { interviewSchema } from '../../../src/schemas/interview';
import { mergeGlossaryProposals, validateSidecars } from '../../../scripts/content/extract';

/** A scratch pair of directories for one merge case. */
async function dirs(): Promise<{ proposals: string; glossary: string }> {
  const root = await mkdtemp(path.join(tmpdir(), 'extract-test-'));
  const proposals = path.join(root, 'proposals');
  const glossary = path.join(root, 'glossary');
  await mkdir(proposals, { recursive: true });
  await mkdir(glossary, { recursive: true });
  return { proposals, glossary };
}

/** Write `{ terms: [...] }` to one proposal file. */
async function proposal(dir: string, name: string, terms: unknown[]): Promise<void> {
  await writeFile(path.join(dir, `${name}.yaml`), YAML.stringify({ terms }, { lineWidth: 0 }));
}

/** Write one existing glossary term, exactly as the hand-written files are laid out. */
async function term(dir: string, id: string, body: string): Promise<void> {
  await writeFile(path.join(dir, `${id}.yaml`), body);
}

const CLOSURE = [
  'en: Closure',
  'zh: 闭包',
  'aliases: [Lexical closure]',
  "short: { en: 'A function that keeps its defining scope.', zh: '保留定义作用域的函数。' }",
  'topics: [python/closures]',
  '',
].join('\n');

const FREE_VARIABLE = {
  id: 'free-variable',
  en: 'Free variable',
  zh: '自由变量',
  short: { en: 'A name a function uses but does not bind itself.', zh: '函数使用但并非自己绑定的名字。' },
  topics: ['python/closures'],
};

describe('mergeGlossaryProposals', () => {
  it('adds a proposed term that no existing term claims', async () => {
    const { proposals, glossary } = await dirs();
    await proposal(proposals, 'python-closures', [FREE_VARIABLE]);

    const result = await mergeGlossaryProposals(proposals, glossary);

    expect(result.added).toEqual(['free-variable']);
    expect(result.skipped).toEqual([]);
    expect(result.conflicts).toEqual([]);
    const written = await readFile(path.join(glossary, 'free-variable.yaml'), 'utf8');
    // The id lives in the filename, and the key order matches the hand-written terms.
    expect(Object.keys(YAML.parse(written))).toEqual(['en', 'zh', 'aliases', 'short', 'topics']);
    expect(YAML.parse(written)).toEqual({
      en: 'Free variable',
      zh: '自由变量',
      aliases: [],
      short: FREE_VARIABLE.short,
      topics: ['python/closures'],
    });
  });

  it('writes nothing on a dry run but still reports what it would add', async () => {
    const { proposals, glossary } = await dirs();
    await proposal(proposals, 'python-closures', [FREE_VARIABLE]);

    const result = await mergeGlossaryProposals(proposals, glossary, { dryRun: true });

    expect(result.added).toEqual(['free-variable']);
    expect(existsSync(path.join(glossary, 'free-variable.yaml'))).toBe(false);
  });

  it('skips a proposal identical to an existing term and leaves the file alone', async () => {
    const { proposals, glossary } = await dirs();
    await term(glossary, 'closure', CLOSURE);
    await proposal(proposals, 'python-closures', [
      {
        id: 'closure',
        en: 'Closure',
        zh: '闭包',
        short: { en: 'Something else entirely.', zh: '完全不同的说法。' },
        topics: ['python/closures'],
      },
    ]);

    const result = await mergeGlossaryProposals(proposals, glossary);

    expect(result.added).toEqual([]);
    expect(result.skipped).toEqual(['closure']);
    expect(result.conflicts).toEqual([]);
    expect(await readFile(path.join(glossary, 'closure.yaml'), 'utf8')).toBe(CLOSURE);
  });

  it('merges new topics into an identical term, sorted, and keeps its other fields', async () => {
    const { proposals, glossary } = await dirs();
    await term(glossary, 'closure', CLOSURE);
    await proposal(proposals, 'javascript-closures', [
      {
        id: 'closure',
        en: 'Closure',
        zh: '闭包',
        short: { en: 'A function that keeps its defining scope.', zh: '保留定义作用域的函数。' },
        topics: ['javascript/closures', 'python/closures'],
      },
    ]);

    const result = await mergeGlossaryProposals(proposals, glossary);

    expect(result.added).toEqual([]);
    expect(result.skipped).toEqual(['closure']);
    expect(result.conflicts).toEqual([]);
    expect(result.notes).toEqual([{ id: 'closure', note: 'merged topics: javascript/closures' }]);
    const merged = YAML.parse(await readFile(path.join(glossary, 'closure.yaml'), 'utf8'));
    expect(merged.topics).toEqual(['javascript/closures', 'python/closures']);
    expect(merged.aliases).toEqual(['Lexical closure']);
    expect(merged.short).toEqual({
      en: 'A function that keeps its defining scope.',
      zh: '保留定义作用域的函数。',
    });
    expect(Object.keys(merged)).toEqual(['en', 'zh', 'aliases', 'short', 'topics']);
  });

  it('skips a proposal an existing term already lists as an alias, whatever the case', async () => {
    const { proposals, glossary } = await dirs();
    await term(glossary, 'closure', CLOSURE);
    await proposal(proposals, 'javascript-closures', [
      {
        id: 'lexical-closure',
        en: 'lexical closure',
        zh: '词法闭包',
        short: { en: 'A closure, by another name.', zh: '闭包的另一种叫法。' },
      },
    ]);

    const result = await mergeGlossaryProposals(proposals, glossary);

    expect(result.added).toEqual([]);
    expect(result.skipped).toEqual(['lexical-closure']);
    expect(result.conflicts).toEqual([]);
    expect(result.notes).toEqual([{ id: 'lexical-closure', note: 'already covered by closure' }]);
    expect(existsSync(path.join(glossary, 'lexical-closure.yaml'))).toBe(false);
  });

  it('conflicts when the id exists with a different zh', async () => {
    const { proposals, glossary } = await dirs();
    await term(glossary, 'closure', CLOSURE);
    await proposal(proposals, 'python-closures', [
      {
        id: 'closure',
        en: 'Closure',
        zh: '封闭体',
        short: { en: 'A function that keeps its defining scope.', zh: '保留定义作用域的函数。' },
      },
    ]);

    const result = await mergeGlossaryProposals(proposals, glossary);

    expect(result.added).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].id).toBe('closure');
    expect(result.conflicts[0].reason).toMatch(/zh/);
    expect(await readFile(path.join(glossary, 'closure.yaml'), 'utf8')).toBe(CLOSURE);
  });

  it('conflicts when a short definition is longer than 140 characters', async () => {
    const { proposals, glossary } = await dirs();
    await proposal(proposals, 'python-closures', [
      { ...FREE_VARIABLE, short: { en: 'x'.repeat(141), zh: '自由变量。' } },
    ]);

    const result = await mergeGlossaryProposals(proposals, glossary);

    expect(result.added).toEqual([]);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].reason).toMatch(/140/);
    expect(existsSync(path.join(glossary, 'free-variable.yaml'))).toBe(false);
  });

  it('conflicts when a proposal does not match the term schema', async () => {
    const { proposals, glossary } = await dirs();
    await proposal(proposals, 'python-closures', [
      { id: 'free-variable', en: 'Free variable', short: { en: 'No zh at all.', zh: '缺少 zh。' } },
    ]);

    const result = await mergeGlossaryProposals(proposals, glossary);

    expect(result.added).toEqual([]);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].id).toBe('free-variable');
    expect(result.conflicts[0].reason).toMatch(/zh/);
    expect(existsSync(path.join(glossary, 'free-variable.yaml'))).toBe(false);
  });

  it('reports no proposals when the directory does not exist', async () => {
    const { glossary } = await dirs();
    const result = await mergeGlossaryProposals(path.join(glossary, 'nope'), glossary);
    expect(result).toEqual({ added: [], skipped: [], conflicts: [], notes: [] });
  });
});

/** A topic pair, a quiz and an interview file laid out the way the site expects them. */
async function sidecarFixture(options: { quiz?: unknown; interview?: unknown; quizRef?: string } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'sidecar-test-'));
  const topicsDir = path.join(root, 'topics');
  const quizzesDir = path.join(root, 'quizzes');
  const interviewDir = path.join(root, 'interview');
  await mkdir(path.join(topicsDir, 'python'), { recursive: true });
  await mkdir(path.join(quizzesDir, 'python'), { recursive: true });
  await mkdir(interviewDir, { recursive: true });

  const quizRef = 'quizRef' in options ? options.quizRef : 'python/closures';
  const frontmatter = [
    '---',
    'title: Closures',
    'track: python',
    ...(quizRef ? [`quiz: ${quizRef}`] : []),
    '---',
    '',
  ];
  for (const lang of ['en', 'zh']) {
    await writeFile(
      path.join(topicsDir, 'python', `closures.${lang}.mdx`),
      `${frontmatter.join('\n')}body\n`,
    );
  }

  const quiz = options.quiz ?? {
    topic: 'python/closures',
    items: [
      {
        id: 'q1',
        type: 'mcq',
        prompt: { en: 'What is captured?', zh: '捕获了什么？' },
        options: [
          { text: { en: 'The binding', zh: '绑定' }, correct: true },
          { text: { en: 'A copy', zh: '副本' }, correct: false },
        ],
        explanation: { en: 'The binding.', zh: '是绑定。' },
        difficulty: 'beginner',
      },
    ],
  };
  await writeFile(path.join(quizzesDir, 'python', 'closures.yaml'), YAML.stringify(quiz, { lineWidth: 0 }));

  const interview = options.interview ?? {
    track: 'python',
    items: [
      {
        id: 'closures-capture',
        question: { en: 'What does a closure capture?', zh: '闭包捕获什么？' },
        answer: { en: 'The binding, not the value.', zh: '捕获绑定，而不是值。' },
        topics: ['python/closures'],
        level: 'intermediate',
      },
    ],
  };
  await writeFile(path.join(interviewDir, 'python.yaml'), YAML.stringify(interview, { lineWidth: 0 }));

  return { topicsDir, quizzesDir, interviewDir };
}

describe('validateSidecars', () => {
  it('accepts a valid quiz and interview file', async () => {
    const fixture = await sidecarFixture();
    expect(await validateSidecars('python/closures', fixture)).toEqual({ ok: true, errors: [] });
  });

  it('rejects an interview item pointing at a topic that does not exist', async () => {
    const fixture = await sidecarFixture({
      interview: {
        track: 'python',
        items: [
          {
            id: 'closures-capture',
            question: { en: 'What does a closure capture?', zh: '闭包捕获什么？' },
            answer: { en: 'The binding.', zh: '捕获绑定。' },
            topics: ['python/does-not-exist'],
            level: 'intermediate',
          },
        ],
      },
    });

    const result = await validateSidecars('python/closures', fixture);

    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toMatch(/python\/does-not-exist/);
  });

  it('rejects a quiz whose item has no correct option', async () => {
    const fixture = await sidecarFixture({
      quiz: {
        topic: 'python/closures',
        items: [
          {
            id: 'q1',
            type: 'mcq',
            prompt: { en: 'What is captured?', zh: '捕获了什么？' },
            options: [
              { text: { en: 'The binding', zh: '绑定' }, correct: false },
              { text: { en: 'A copy', zh: '副本' }, correct: false },
            ],
            explanation: { en: 'The binding.', zh: '是绑定。' },
            difficulty: 'beginner',
          },
        ],
      },
    });

    const result = await validateSidecars('python/closures', fixture);

    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toMatch(/correct option/);
  });

  it('reports a missing quiz file that the frontmatter references', async () => {
    const fixture = await sidecarFixture({ quizRef: 'python/missing' });
    const result = await validateSidecars('python/closures', fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toMatch(/python\/missing/);
  });

  it('passes when the topic references no quiz and the track has no interview file', async () => {
    const fixture = await sidecarFixture({ quizRef: '' });
    const result = await validateSidecars('python/closures', {
      ...fixture,
      interviewDir: path.join(fixture.interviewDir, 'absent'),
    });
    expect(result).toEqual({ ok: true, errors: [] });
  });
});

describe('interviewSchema', () => {
  const item = {
    id: 'closures-capture',
    question: { en: 'q', zh: '问' },
    answer: { en: 'a', zh: '答' },
    topics: ['python/closures'],
    level: 'intermediate',
  };

  it('accepts a well-formed file and defaults the tags', () => {
    const parsed = interviewSchema.parse({ track: 'python', items: [item] });
    expect(parsed.items[0].tags).toEqual([]);
  });

  it('rejects an unknown track', () => {
    expect(interviewSchema.safeParse({ track: 'cobol', items: [item] }).success).toBe(false);
  });

  it('rejects an empty item list', () => {
    expect(interviewSchema.safeParse({ track: 'python', items: [] }).success).toBe(false);
  });

  it('rejects an item without topics', () => {
    expect(interviewSchema.safeParse({ track: 'python', items: [{ ...item, topics: [] }] }).success).toBe(
      false,
    );
  });

  it('rejects a topic reference that is not `track/slug`', () => {
    const items = [{ ...item, topics: ['closures'] }];
    expect(interviewSchema.safeParse({ track: 'python', items }).success).toBe(false);
  });

  it('rejects an unknown level', () => {
    const items = [{ ...item, level: 'expert' }];
    expect(interviewSchema.safeParse({ track: 'python', items }).success).toBe(false);
  });

  it('rejects a monolingual answer', () => {
    const items = [{ ...item, answer: { en: 'a' } }];
    expect(interviewSchema.safeParse({ track: 'python', items }).success).toBe(false);
  });
});
