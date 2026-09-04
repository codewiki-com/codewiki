import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { interviewSchema } from '../../../src/schemas/interview';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  GLOSSARY_ROOT,
  mergeGlossaryProposals,
  patchTopics,
  serializeTerm,
  validateSidecars,
} from '../../../scripts/content/extract';

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
    // The id lives in the filename, and the layout is the house style, byte for byte.
    const written = await readFile(path.join(glossary, 'free-variable.yaml'), 'utf8');
    expect(written).toBe(
      [
        'en: Free variable',
        'zh: 自由变量',
        'aliases: []',
        "short: { en: 'A name a function uses but does not bind itself.', zh: '函数使用但并非自己绑定的名字。' }",
        'topics: [python/closures]',
        '',
      ].join('\n'),
    );
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
    // Everything but the `topics` line survives untouched, flow style and all.
    const merged = await readFile(path.join(glossary, 'closure.yaml'), 'utf8');
    expect(merged).toBe(
      CLOSURE.replace('topics: [python/closures]', 'topics: [javascript/closures, python/closures]'),
    );
    expect(merged.split('\n').filter((line) => !line.startsWith('topics:'))).toEqual(
      CLOSURE.split('\n').filter((line) => !line.startsWith('topics:')),
    );
  });

  it('keeps a block-style topics list in block style', async () => {
    const { proposals, glossary } = await dirs();
    const blockStyle = [
      '# a hand-written term',
      'en: Closure',
      'zh: 闭包',
      'aliases: []',
      "short: { en: 'A function that keeps its defining scope.', zh: '保留定义作用域的函数。' }",
      'topics:',
      '  - python/closures',
      '',
    ].join('\n');
    await term(glossary, 'closure', blockStyle);
    await proposal(proposals, 'javascript-closures', [
      {
        id: 'closure',
        en: 'Closure',
        zh: '闭包',
        short: { en: 'A function that keeps its defining scope.', zh: '保留定义作用域的函数。' },
        topics: ['javascript/closures'],
      },
    ]);

    await mergeGlossaryProposals(proposals, glossary);

    expect(await readFile(path.join(glossary, 'closure.yaml'), 'utf8')).toBe(
      blockStyle.replace('  - python/closures', '  - javascript/closures\n  - python/closures'),
    );
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
    expect(await readFile(path.join(glossary, 'closure.yaml'), 'utf8')).toBe(CLOSURE);
  });

  it('folds the topics of an alias-matched proposal into the term that covers it', async () => {
    const { proposals, glossary } = await dirs();
    await term(glossary, 'closure', CLOSURE);
    await proposal(proposals, 'javascript-closures', [
      {
        id: 'lexical-closure',
        en: 'lexical closure',
        zh: '词法闭包',
        short: { en: 'A closure, by another name.', zh: '闭包的另一种叫法。' },
        topics: ['javascript/closures', 'python/closures'],
      },
    ]);

    const result = await mergeGlossaryProposals(proposals, glossary);

    expect(result.skipped).toEqual(['lexical-closure']);
    expect(result.notes).toEqual([
      { id: 'lexical-closure', note: 'already covered by closure; merged topics: javascript/closures' },
    ]);
    expect(await readFile(path.join(glossary, 'closure.yaml'), 'utf8')).toBe(
      CLOSURE.replace('topics: [python/closures]', 'topics: [javascript/closures, python/closures]'),
    );
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

describe('serializeTerm', () => {
  it('reproduces every committed glossary term byte for byte', async () => {
    // The committed terms are the definition of the house style, so they are the fixture.
    const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..', GLOSSARY_ROOT);
    const files = (await readdir(root)).filter((name) => name.endsWith('.yaml'));
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      const text = await readFile(path.join(root, name), 'utf8');
      expect(serializeTerm(YAML.parse(text)), name).toBe(text);
    }
  });

  it('quotes only what YAML would otherwise misread, and doubles an apostrophe', () => {
    expect(
      serializeTerm({
        en: "Don't panic",
        zh: '别慌',
        aliases: ['no worries', 'yes'],
        short: { en: "It's fine, really", zh: '没事的。' },
        topics: ['python/a'],
      }),
    ).toBe(
      [
        "en: 'Don''t panic'",
        'zh: 别慌',
        "aliases: [no worries, 'yes']",
        "short: { en: 'It''s fine, really', zh: '没事的。' }",
        'topics: [python/a]',
        '',
      ].join('\n'),
    );
  });
});

describe('patchTopics', () => {
  it('rewrites only the topics line of a flow-style file', () => {
    const text = 'en: Closure\naliases: [a, b]\ntopics: [python/closures]\n';
    expect(patchTopics(text, ['javascript/closures', 'python/closures'])).toBe(
      'en: Closure\naliases: [a, b]\ntopics: [javascript/closures, python/closures]\n',
    );
  });

  it('keeps a block list a block list, at its own indentation', () => {
    const text = 'en: Closure\ntopics:\n    - python/closures\n';
    expect(patchTopics(text, ['a/b', 'python/closures'])).toBe(
      'en: Closure\ntopics:\n    - a/b\n    - python/closures\n',
    );
  });

  it('appends a topics key to a file that has none', () => {
    expect(patchTopics('en: Closure\n', ['python/closures'])).toBe(
      'en: Closure\ntopics: [python/closures]\n',
    );
  });

  it('leaves a nested `topics:` key alone', () => {
    const text = 'en: Closure\ntopics: [x/y]\nmeta:\n  topics: [do/not/touch]\n';
    expect(patchTopics(text, ['a/b'])).toBe('en: Closure\ntopics: [a/b]\nmeta:\n  topics: [do/not/touch]\n');
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
