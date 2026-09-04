import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { checkContent } from '../../../scripts/content/check';
import {
  identityFor,
  outputPathsFor,
  renderWriteBrief,
  WRITE_KINDS,
  writeVarsFor,
  type WriteBriefOptions,
} from '../../../scripts/content/lib/write-brief';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
let root: string;
let options: WriteBriefOptions;

async function put(relative: string, text: string): Promise<string> {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text, 'utf8');
  return file;
}

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'codewiki-write-brief-'));
  const stagingRoot = path.join(root, 'staging');
  const topicsRoot = path.join(root, 'topics');
  const glossaryRoot = path.join(root, 'glossary');
  options = {
    stagingRoot,
    topicsRoot,
    glossaryRoot,
    templatesRoot: repo,
    today: '2026-09-04',
    inventoryRef: null,
  };
  await put('staging/python/closures.en.md', '---\ntitle: Staged closures\nsection: functions-deeper\n---\n');
  await put('staging/python/closures.zh.md', '---\ntitle: 闭包\nsection: functions-deeper\n---\n');
  await put('staging/python/generators.en.md', '---\ntitle: Generators\n---\n');
  await put('topics/python/context-managers.en.mdx', '---\ntitle: Context managers\n---\n');
  await put('topics/python/closures.en.mdx', '---\ntitle: Reviewed closures\n---\n');
  await put('topics/python/closures.zh.mdx', '---\ntitle: 已审查的闭包\n---\n');
  for (const id of ['closure', 'free-variable', 'generator', 'iterator', 'scope', 'yield-expression']) {
    await put(`glossary/${id}.yaml`, `en: ${id}\n`);
  }
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('write brief variables', () => {
  it('prefers live topic paths and combines staged and live inventory with titles', async () => {
    const vars = await writeVarsFor('quiz', 'python/closures', options);
    expect(vars.EN_PATH).toContain('topics/python/closures.en.mdx');
    expect(vars.ZH_PATH).toContain('topics/python/closures.zh.mdx');
    expect(vars.INVENTORY).toContain('python/generators — Generators');
    expect(vars.INVENTORY).toContain('python/context-managers — Context managers');
    expect(vars.INVENTORY).toContain('python/closures — Staged closures');
    expect(vars.SIBLINGS).not.toContain('python/closures —');
    expect(vars.GLOSSARY_IDS).toContain('- yield-expression');
    expect(vars.TRACK_SECTIONS).toContain('functions-deeper — Functions in depth / 函数进阶');
  });

  it('normalizes topic, track and scoped path ids without guessing unknown scopes', () => {
    expect(identityFor('quiz', 'python/closures')).toMatchObject({ track: 'python', slug: 'closures' });
    expect(identityFor('interview', 'python')).toMatchObject({ track: 'python', slug: 'python' });
    expect(identityFor('path', 'python/python-from-zero')).toMatchObject({
      track: 'python',
      slug: 'python-from-zero',
    });
    expect(identityFor('cheatsheet', 'python')).toMatchObject({ track: 'python', slug: 'python' });
    expect(() => identityFor('quiz', 'closures')).toThrow('needs a {track}/{slug} id');
    expect(() => identityFor('path', 'mystery-route')).toThrow('needs a {track}/{slug} scope');
  });
});

describe('write prompt rendering', () => {
  const ids = {
    quiz: 'python/closures',
    kata: 'python/closures',
    interview: 'python',
    path: 'python/python-route',
    cheatsheet: 'python',
  } as const;

  it.each(WRITE_KINDS)('renders the complete %s prompt with no unresolved variables', async (kind) => {
    const brief = await renderWriteBrief(kind, ids[kind], options);
    expect(brief).not.toMatch(/\{\{[A-Z0-9_]+\}\}/);
    expect(brief).toContain('2026-09-04');
    expect(brief).toContain(`WRITE DONE ${ids[kind]}`);
    expect(brief).toContain(`WRITE FAILED ${ids[kind]}: reason`);
  });

  it.each(WRITE_KINDS)('keeps the %s template within the 120-line limit', async (kind) => {
    const template = await readFile(
      path.join(
        repo,
        `prompts/${
          kind === 'quiz'
            ? 'write-quiz-bank'
            : kind === 'kata'
              ? 'write-review-kata'
              : kind === 'interview'
                ? 'write-interview-bank'
                : `write-${kind}`
        }.md`,
      ),
      'utf8',
    );
    expect(template.trimEnd().split('\n').length).toBeLessThanOrEqual(120);
  });
});

describe('produced paths', () => {
  it('includes every checkpoint bank discovered in a written path', async () => {
    const pathsRoot = path.join(root, 'paths');
    const quizzesRoot = path.join(root, 'quizzes');
    await put(
      'paths/python-route.yaml',
      YAML.stringify({
        milestones: [{ checkpoint: 'python/checkpoint-1' }, { checkpoint: 'python/checkpoint-2' }],
      }),
    );
    await expect(outputPathsFor('path', 'python/python-route', { pathsRoot, quizzesRoot })).resolves.toEqual([
      path.join(pathsRoot, 'python-route.yaml'),
      path.join(quizzesRoot, 'python/checkpoint-1.yaml'),
      path.join(quizzesRoot, 'python/checkpoint-2.yaml'),
    ]);
  });
});

describe('written quiz checks', () => {
  const localized = { en: 'Text', zh: '文字' };
  const base = { prompt: localized, explanation: localized, difficulty: 'beginner', tags: [] };

  it('rejects a bank with two correct options', async () => {
    const quizzesRoot = path.join(root, 'quizzes');
    await put(
      'quizzes/python/bad-options.yaml',
      YAML.stringify({
        topic: 'python/bad-options',
        items: [
          {
            ...base,
            id: 'two-right',
            type: 'mcq',
            options: [
              { text: localized, correct: true },
              { text: localized, correct: true },
            ],
          },
        ],
      }),
    );
    const result = await checkContent('quiz', 'python/bad-options', { quizzesRoot });
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('expected exactly one correct option, got 2');
  });

  it('rejects a review issue whose line exceeds the code length', async () => {
    const quizzesRoot = path.join(root, 'quizzes');
    const lines = Array.from({ length: 15 }, (_, index) => `const value${index} = ${index};`).join('\n');
    await put(
      'quizzes/python/bad-line.yaml',
      YAML.stringify({
        topic: 'python/bad-line',
        items: [
          {
            ...base,
            id: 'review-lines',
            type: 'review',
            title: localized,
            task: localized,
            right: localized,
            code: lines,
            lang: 'javascript',
            issues: [
              { line: 20, kind: 'correctness', note: localized },
              { line: 2, kind: 'security', note: localized },
              { line: 3, kind: 'readability', note: localized },
            ],
            checklist: [localized, localized, localized],
          },
        ],
      }),
    );
    const result = await checkContent('kata', 'python/bad-line', { quizzesRoot });
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('names line 20, but the code has 15 lines');
  });
});

describe('reviewed placeholder checks', () => {
  it('rejects calibration tags in a reviewed cheatsheet pair', async () => {
    const cheatsheetsRoot = path.join(root, 'cheatsheets');
    const body = Array.from({ length: 9 }, (_, sheet) => {
      const rows = Array.from(
        { length: 5 },
        (_, row) => `  <Row code="example-${sheet}-${row}">Verified note</Row>`,
      ).join('\n');
      return `<Sheet title="Section ${sheet}">\n${rows}\n</Sheet>`;
    }).join('\n\n');
    const frontmatter = {
      title: 'Reference',
      description: 'A compact reference for verified syntax.',
      track: 'python',
      terms: ['closure', 'free-variable', 'generator', 'iterator', 'scope', 'yield-expression'],
      tags: ['calibration'],
      verified: { version: 'Python 3.14', date: '2026-09-04' },
      reviewed: '2026-09-04',
      status: 'reviewed',
      aligned: true,
    };
    for (const lang of ['en', 'zh']) {
      await put(`cheatsheets/reference.${lang}.mdx`, `---\n${YAML.stringify(frontmatter)}---\n\n${body}\n`);
    }
    const result = await checkContent('cheatsheet', 'python/reference', { cheatsheetsRoot });
    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('reviewed file still contains the calibration placeholder');
  });
});
