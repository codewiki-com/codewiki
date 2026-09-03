import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../../../scripts/content/lib/frontmatter';
import type { Mapping } from '../../../scripts/content/lib/mapping';
import {
  claimPath,
  importPair,
  isImportDropped,
  type ImportablePair,
  type ImportResult,
} from '../../../scripts/content/import';

const fixtureRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../fixtures/old');

function mapping(overrides: Partial<Mapping> = {}): Mapping {
  return {
    categories: { python: 'python', rust: 'rust' },
    subcategories: { 'python::函数式编程': { track: 'python', section: 'functions-deeper' } },
    overrides: {},
    drop: {},
    ...overrides,
  };
}

/** A pair carrying only the fields the importer reads. */
function pair(overrides: Partial<ImportablePair> = {}): ImportablePair {
  return {
    id: 'python/closures',
    category: 'python',
    slug: 'closures',
    en: { path: 'python/closures.en.md', subcategory: '' },
    zh: { path: 'python/closures.zh.md', subcategory: '函数式编程' },
    divergence: 0.12345,
    issues: [],
    ...overrides,
  };
}

interface FrontmatterFields {
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  difficulty?: string;
  order?: number;
  lastUpdated?: string;
}

/** Build an old-corpus document from a few frontmatter fields plus a body. */
function doc(fields: FrontmatterFields, body = 'Body text.\n'): string {
  const lines = Object.entries(fields).map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  return `---\n${lines.join('\n')}\n---\n\n${body}`;
}

/** The staged pair, or a test failure when the pair was dropped. */
function staged(result: ImportResult): { en: string; zh: string } {
  if (isImportDropped(result)) throw new Error(`unexpectedly dropped: ${result.dropped}`);
  return { en: result.en.text, zh: result.zh.text };
}

describe('importPair', () => {
  it('swaps the titles and descriptions when both sides are in the wrong language', () => {
    const result = importPair(pair(), mapping(), {
      en: doc({ title: 'Python 闭包', description: '深入理解 Python 闭包与自由变量' }),
      zh: doc({ title: 'Python Closures', description: 'A guide to closures' }),
    });
    const { en, zh } = staged(result);
    expect(parseFrontmatter(en).data.title).toBe('Python Closures');
    expect(parseFrontmatter(en).data.description).toBe('A guide to closures');
    expect(parseFrontmatter(zh).data.title).toBe('Python 闭包');
    expect(parseFrontmatter(zh).data.description).toBe('深入理解 Python 闭包与自由变量');
    expect(parseFrontmatter(en).data.issues).not.toContain('title-language');
  });

  it('keeps a one-sided wrong title and records the issue', () => {
    const result = importPair(pair(), mapping(), {
      en: doc({ title: 'Python 闭包' }),
      zh: doc({ title: 'Python 闭包' }),
    });
    const { en, zh } = staged(result);
    expect(parseFrontmatter(en).data.title).toBe('Python 闭包');
    expect(parseFrontmatter(zh).data.title).toBe('Python 闭包');
    expect(parseFrontmatter(en).data.issues).toContain('title-language');
    expect(parseFrontmatter(zh).data.issues).toContain('title-language');
  });

  it('lowercases difficulty and rewrites expert as advanced', () => {
    const result = importPair(pair(), mapping(), {
      en: doc({ title: 'Closures', difficulty: 'Expert' }),
      zh: doc({ title: '闭包', difficulty: 'Expert' }),
    });
    const { en } = staged(result);
    expect(parseFrontmatter(en).data.difficulty).toBe('advanced');
    expect(parseFrontmatter(en).data.issues).not.toContain('difficulty-defaulted');
  });

  it('defaults an unknown difficulty to intermediate and records the issue', () => {
    const result = importPair(pair(), mapping(), {
      en: doc({ title: 'Closures', difficulty: 'wizard' }),
      zh: doc({ title: '闭包' }),
    });
    const { en, zh } = staged(result);
    expect(parseFrontmatter(en).data.difficulty).toBe('intermediate');
    expect(parseFrontmatter(zh).data.difficulty).toBe('intermediate');
    expect(parseFrontmatter(en).data.issues).toContain('difficulty-defaulted');
  });

  it('takes the difficulty from the English side when the two disagree', () => {
    const result = importPair(pair(), mapping(), {
      en: doc({ title: 'Closures', difficulty: 'beginner' }),
      zh: doc({ title: '闭包', difficulty: 'advanced' }),
    });
    const { en, zh } = staged(result);
    expect(parseFrontmatter(en).data.difficulty).toBe('beginner');
    expect(parseFrontmatter(zh).data.difficulty).toBe('beginner');
  });

  it('strips the first H1 and leaves the rest of the body untouched', () => {
    const source = '# Python Closures\n\nIntro paragraph.\n\n## Concept\n\n```md\n# not a heading\n```\n';
    const result = importPair(pair(), mapping(), {
      en: doc({ title: 'Closures' }, source),
      zh: doc({ title: '闭包' }, source),
    });
    const { en } = staged(result);
    const body = en.slice(en.indexOf('\n---\n') + 5);
    expect(body).toBe('\nIntro paragraph.\n\n## Concept\n\n```md\n# not a heading\n```\n');
  });

  it('writes the new frontmatter keys in the agreed order', () => {
    const result = importPair(pair(), mapping(), {
      en: doc({ title: 'Closures', category: 'Python', order: 7, lastUpdated: '2026-01-07' }),
      zh: doc({ title: '闭包', category: 'Python', subcategory: '函数式编程', order: 7 }),
    });
    const { en } = staged(result);
    expect(Object.keys(parseFrontmatter(en).data)).toEqual([
      'title',
      'description',
      'track',
      'section',
      'difficulty',
      'tags',
      'status',
      'origin',
      'divergence',
      'issues',
      'legacy',
    ]);
  });

  it('sets track, section, status, origin, divergence and the staging paths', () => {
    const result = importPair(pair(), mapping(), {
      en: doc({ title: 'Closures', tags: ['Python', 'Closures'] }),
      zh: doc({ title: '闭包', tags: ['Python', '闭包'] }),
    });
    if (isImportDropped(result)) throw new Error('unexpectedly dropped');
    expect(result.en.relPath).toBe('python/closures.en.md');
    expect(result.zh.relPath).toBe('python/closures.zh.md');
    const en = parseFrontmatter(result.en.text).data;
    const zh = parseFrontmatter(result.zh.text).data;
    expect(en.track).toBe('python');
    expect(en.section).toBe('functions-deeper');
    expect(en.status).toBe('imported');
    expect(en.origin).toBe('old/src/content/docs/python/closures.en.md');
    expect(zh.origin).toBe('old/src/content/docs/python/closures.zh.md');
    expect(en.divergence).toBe(0.123);
    expect(en.tags).toEqual(['Python', 'Closures']);
    expect(zh.tags).toEqual(['Python', '闭包']);
  });

  it('carries the inventory issues over and preserves the legacy metadata', () => {
    const result = importPair(pair({ issues: ['missing-subcategory-en', 'divergent'] }), mapping(), {
      en: doc({
        title: 'Closures',
        category: 'Python',
        difficulty: 'beginner',
        order: 7,
        lastUpdated: '2026-01-07',
      }),
      zh: doc({
        title: '闭包',
        category: 'Python',
        subcategory: '函数式编程',
        difficulty: 'beginner',
        order: 9,
      }),
    });
    const { en, zh } = staged(result);
    expect(parseFrontmatter(en).data.issues).toEqual(['missing-subcategory-en', 'divergent']);
    expect(parseFrontmatter(en).data.legacy).toEqual({
      category: 'Python',
      subcategory: '',
      order: 7,
      lastUpdated: '2026-01-07',
    });
    // `order` disagrees between the two sides, so the English value wins on both.
    expect(parseFrontmatter(zh).data.legacy).toEqual({
      category: 'Python',
      subcategory: '函数式编程',
      order: 7,
      lastUpdated: null,
    });
  });

  it('returns the drop reason instead of files for a dropped pair', () => {
    const result = importPair(
      pair(),
      mapping({ drop: { 'python/closures': 'duplicate of python/closures-guide' } }),
      { en: doc({ title: 'Closures' }), zh: doc({ title: '闭包' }) },
    );
    expect(result).toEqual({ dropped: 'duplicate of python/closures-guide' });
    expect(isImportDropped(result)).toBe(true);
  });

  it('files a pair with no mapped subcategory under the category fallback', () => {
    const result = importPair(
      pair({
        id: 'rust/cargo',
        category: 'rust',
        slug: 'cargo',
        zh: { path: 'rust/cargo.zh.md', subcategory: '工具链' },
      }),
      mapping(),
      { en: doc({ title: 'Cargo' }), zh: doc({ title: 'Cargo 包管理器' }) },
    );
    if (isImportDropped(result)) throw new Error('unexpectedly dropped');
    expect(result.en.relPath).toBe('rust/cargo.en.md');
    expect(parseFrontmatter(result.en.text).data.section).toBe('unsorted');
  });
});

describe('importPair on the fixture corpus', () => {
  it('stages the rust/cargo pair and flags its one-sided wrong-language title', async () => {
    const files = {
      en: await readFile(path.join(fixtureRoot, 'rust/cargo.en.md'), 'utf8'),
      zh: await readFile(path.join(fixtureRoot, 'rust/cargo.zh.md'), 'utf8'),
    };
    const result = importPair(
      pair({
        id: 'rust/cargo',
        category: 'rust',
        slug: 'cargo',
        en: { path: 'rust/cargo.en.md', subcategory: '工具链' },
        zh: { path: 'rust/cargo.zh.md', subcategory: '工具链' },
        issues: ['title-lang-en'],
        divergence: 0.0421,
      }),
      mapping(),
      files,
    );
    if (isImportDropped(result)) throw new Error('unexpectedly dropped');
    const en = parseFrontmatter(result.en.text);
    // Both sides carry the same Chinese title, so there is nothing to swap: keep and flag.
    expect(en.data.title).toBe('Cargo包管理器');
    expect(en.data.issues).toEqual(['title-lang-en', 'title-language']);
    expect(en.data.difficulty).toBe('beginner');
    expect(en.data.status).toBe('imported');
    expect(en.data.origin).toBe('old/src/content/docs/rust/cargo.en.md');
    expect(en.data.divergence).toBe(0.042);
    expect(en.data.legacy).toEqual({
      category: 'Rust',
      subcategory: '工具链',
      order: 9,
      lastUpdated: '2026-01-07',
    });
    // The old body carries no H1, so it survives byte for byte.
    expect(en.body).toBe(parseFrontmatter(files.en).body);
    expect(en.data.draft).toBeUndefined();
  });
});

describe('claimPath', () => {
  it('accepts a path claimed twice by the same pair, once per language', () => {
    const claimed = new Map<string, string>();
    expect(() => {
      claimPath(claimed, 'python/closures.en.md', 'python/closures');
      claimPath(claimed, 'python/closures.zh.md', 'python/closures');
      claimPath(claimed, 'python/closures.en.md', 'python/closures');
    }).not.toThrow();
  });

  it('refuses a path two different pairs would write to', () => {
    const claimed = new Map<string, string>([['python/json.en.md', 'python/json']]);
    expect(() => claimPath(claimed, 'python/json.en.md', 'data/json')).toThrow(/python\/json.*data\/json/);
  });
});
