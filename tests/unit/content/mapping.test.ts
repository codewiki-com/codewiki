import { TRACKS } from '../../../src/data/tracks';
import {
  MAPPING_PATH,
  readMapping,
  resolveMapping,
  subcategoryKey,
  unmappedSubcategories,
  validateMapping,
  type Mapping,
} from '../../../scripts/content/lib/mapping';

/** A pair carrying only the fields the resolver reads. */
function pair(id: string, category: string, en: string, zh: string) {
  return { id, category, slug: id.split('/')[1], en: { subcategory: en }, zh: { subcategory: zh } };
}

function mapping(overrides: Partial<Mapping> = {}): Mapping {
  return {
    categories: { python: 'python', rust: 'rust' },
    subcategories: {},
    overrides: {},
    drop: {},
    ...overrides,
  };
}

describe('subcategoryKey', () => {
  it('joins the old category and subcategory with ::', () => {
    expect(subcategoryKey('python', 'Async IO')).toBe('python::Async IO');
  });
});

describe('resolveMapping', () => {
  it('prefers drop over every other rule', () => {
    const result = resolveMapping(
      pair('python/dupe', 'python', 'Basics', '基础'),
      mapping({
        drop: { 'python/dupe': 'duplicate of python/basics' },
        overrides: { 'python/dupe': { track: 'rust', section: 'basics' } },
        subcategories: { 'python::Basics': { track: 'python', section: 'objects' } },
      }),
    );
    expect(result).toEqual({ drop: 'duplicate of python/basics' });
  });

  it('prefers an override over the subcategory and category rules', () => {
    const result = resolveMapping(
      pair('python/decorators', 'python', 'Basics', '基础'),
      mapping({
        overrides: { 'python/decorators': { track: 'python', section: 'functions-deeper' } },
        subcategories: { 'python::Basics': { track: 'python', section: 'objects' } },
      }),
    );
    expect(result).toEqual({ track: 'python', section: 'functions-deeper' });
  });

  it('prefers the subcategory rule over the category fallback', () => {
    const result = resolveMapping(
      pair('python/gil', 'python', 'Concurrency', '并发'),
      mapping({ subcategories: { 'python::Concurrency': { track: 'python', section: 'concurrency' } } }),
    );
    expect(result).toEqual({ track: 'python', section: 'concurrency' });
  });

  it('falls back to the category with section unsorted', () => {
    expect(resolveMapping(pair('rust/traits', 'rust', 'Traits', 'trait'), mapping())).toEqual({
      track: 'rust',
      section: 'unsorted',
    });
  });

  it('uses the zh subcategory when the en subcategory is missing', () => {
    const result = resolveMapping(
      pair('python/closures', 'python', '', '函数式编程'),
      mapping({ subcategories: { 'python::函数式编程': { track: 'python', section: 'functions-deeper' } } }),
    );
    expect(result).toEqual({ track: 'python', section: 'functions-deeper' });
  });

  it('ignores the zh subcategory when the en subcategory is present', () => {
    const result = resolveMapping(
      pair('python/closures', 'python', 'Functions', '函数式编程'),
      mapping({ subcategories: { 'python::函数式编程': { track: 'python', section: 'functions-deeper' } } }),
    );
    expect(result).toEqual({ track: 'python', section: 'unsorted' });
  });

  it('throws when the old category has no track', () => {
    expect(() => resolveMapping(pair('perl/regex', 'perl', 'Regex', '正则'), mapping())).toThrow(/perl/);
  });
});

describe('validateMapping', () => {
  it('accepts a mapping that only uses known tracks and sections', () => {
    expect(() =>
      validateMapping(
        mapping({
          subcategories: { 'python::Concurrency': { track: 'python', section: 'concurrency' } },
          overrides: { 'python/gil': { track: 'python', section: 'concurrency' } },
        }),
        TRACKS,
      ),
    ).not.toThrow();
  });

  it('rejects an unknown section', () => {
    expect(() =>
      validateMapping(
        mapping({ subcategories: { 'python::Concurrency': { track: 'python', section: 'threads' } } }),
        TRACKS,
      ),
    ).toThrow(/threads/);
  });

  it('rejects unsorted inside subcategories', () => {
    expect(() =>
      validateMapping(
        mapping({ subcategories: { 'python::Concurrency': { track: 'python', section: 'unsorted' } } }),
        TRACKS,
      ),
    ).toThrow(/unsorted/);
  });

  it('rejects unsorted inside overrides', () => {
    expect(() =>
      validateMapping(
        mapping({ overrides: { 'python/gil': { track: 'python', section: 'unsorted' } } }),
        TRACKS,
      ),
    ).toThrow(/unsorted/);
  });

  it('rejects an unknown track in categories', () => {
    expect(() => validateMapping(mapping({ categories: { python: 'pyhton' } }), TRACKS)).toThrow(/pyhton/);
  });

  it('lists every problem in one error', () => {
    let message = '';
    try {
      validateMapping(
        mapping({
          categories: { python: 'pyhton' },
          subcategories: { 'python::Concurrency': { track: 'python', section: 'threads' } },
          overrides: { 'python/gil': { track: 'ruust', section: 'concurrency' } },
        }),
        TRACKS,
      );
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('pyhton');
    expect(message).toContain('threads');
    expect(message).toContain('ruust');
  });
});

describe('unmappedSubcategories', () => {
  const inventory = {
    pairs: [
      pair('python/gil', 'python', 'Concurrency', '并发'),
      pair('python/asyncio', 'python', 'Concurrency', '并发'),
      pair('python/closures', 'python', '', '函数式编程'),
      pair('rust/traits', 'rust', 'Traits', 'trait'),
      pair('rust/none', 'rust', '', ''),
    ],
  };

  it('lists the keys missing from the mapping, sorted, with counts', () => {
    const missing = unmappedSubcategories(
      inventory,
      mapping({ subcategories: { 'rust::Traits': { track: 'rust', section: 'traits-generics' } } }),
    );
    expect(missing).toEqual([
      { key: 'python::Concurrency', count: 2 },
      { key: 'python::函数式编程', count: 1 },
    ]);
  });

  it('is empty when every key is mapped', () => {
    const missing = unmappedSubcategories(inventory, {
      ...mapping(),
      subcategories: {
        'python::Concurrency': { track: 'python', section: 'concurrency' },
        'python::函数式编程': { track: 'python', section: 'functions-deeper' },
        'rust::Traits': { track: 'rust', section: 'traits-generics' },
      },
    });
    expect(missing).toEqual([]);
  });
});

describe('the committed mapping.json', () => {
  it('is valid and covers every old category', async () => {
    const committed = await readMapping(MAPPING_PATH);
    expect(() => validateMapping(committed, TRACKS)).not.toThrow();
    expect(Object.keys(committed.categories)).toHaveLength(20);
    expect(committed.categories.datascience).toBe('datascience');
    expect(Object.keys(committed.drop).length).toBeGreaterThanOrEqual(4);
  });
});
