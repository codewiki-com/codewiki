import { describe, expect, it } from 'vitest';
import type { Track, TrackKind } from '../../../src/data/tracks';
import {
  assignTier,
  buildTiers,
  parseOverrides,
  serializeTiers,
  type TierablePair,
} from '../../../scripts/content/tiers';

/** A track carrying only the fields the tiering reads; names are filler. */
function track(slug: string, kind: TrackKind, sections: string[]): Track {
  return {
    slug,
    kind,
    glyph: slug.slice(0, 2),
    name: { en: slug, zh: slug },
    description: { en: slug, zh: slug },
    sections: sections.map((section) => ({ slug: section, name: { en: section, zh: section } })),
  };
}

// Declared section order deliberately differs from alphabetical order (`objects` before
// `concurrency`), and `frontend` precedes `python` alphabetically but follows it here, so the
// sort tests can tell registry order apart from string order.
const TRACKS: Track[] = [
  track('python', 'language', ['basics', 'functions-deeper', 'objects', 'concurrency']),
  track('frontend', 'domain', ['html-css', 'react', 'performance']),
  track('ai-era', 'pillar', ['tooling', 'judgement']),
];

function pair(id: string, track: string, section: string, difficulty = 'intermediate'): TierablePair {
  return { id, track, section, difficulty };
}

describe('assignTier', () => {
  it('puts the first two sections of a language track in tier 1, whatever the difficulty', () => {
    expect(assignTier(pair('python/a', 'python', 'basics', 'advanced'), TRACKS)).toBe(1);
    expect(assignTier(pair('python/b', 'python', 'functions-deeper', 'advanced'), TRACKS)).toBe(1);
  });

  it('puts only the first section of a domain track in tier 1', () => {
    expect(assignTier(pair('frontend/a', 'frontend', 'html-css', 'advanced'), TRACKS)).toBe(1);
    expect(assignTier(pair('frontend/b', 'frontend', 'react', 'intermediate'), TRACKS)).toBe(2);
  });

  it('puts every section of a pillar track in tier 1', () => {
    expect(assignTier(pair('ai-era/a', 'ai-era', 'tooling'), TRACKS)).toBe(1);
    expect(assignTier(pair('ai-era/b', 'ai-era', 'judgement', 'advanced'), TRACKS)).toBe(1);
  });

  it('puts the remaining beginner and intermediate topics in tier 2', () => {
    expect(assignTier(pair('python/c', 'python', 'objects', 'beginner'), TRACKS)).toBe(2);
    expect(assignTier(pair('python/d', 'python', 'concurrency', 'intermediate'), TRACKS)).toBe(2);
  });

  it('puts the remaining advanced topics in tier 3', () => {
    expect(assignTier(pair('python/e', 'python', 'objects', 'advanced'), TRACKS)).toBe(3);
    expect(assignTier(pair('frontend/c', 'frontend', 'performance', 'advanced'), TRACKS)).toBe(3);
  });

  it('puts a topic with an unsorted or unknown section in tier 3', () => {
    expect(assignTier(pair('python/f', 'python', 'unsorted', 'beginner'), TRACKS)).toBe(3);
    expect(assignTier(pair('python/g', 'python', 'no-such-section', 'beginner'), TRACKS)).toBe(3);
    expect(assignTier(pair('nope/h', 'nope', 'basics', 'beginner'), TRACKS)).toBe(3);
  });
});

describe('buildTiers', () => {
  const build = (pairs: TierablePair[], options: Parameters<typeof buildTiers>[1] = {}) =>
    buildTiers(pairs, { tracks: TRACKS, generatedAt: '2026-09-04T00:00:00.000Z', ...options });

  it('groups the ids by tier and counts them', () => {
    const file = build([
      pair('python/a', 'python', 'basics'),
      pair('python/c', 'python', 'objects'),
      pair('python/e', 'python', 'objects', 'advanced'),
    ]);
    expect(file.tiers).toEqual({ '1': ['python/a'], '2': ['python/c'], '3': ['python/e'] });
    expect(file.counts).toEqual({ '1': 1, '2': 1, '3': 1 });
    expect(file.generatedAt).toBe('2026-09-04T00:00:00.000Z');
  });

  it('lists topics with an unknown section separately, still in tier 3', () => {
    const file = build([pair('python/f', 'python', 'unsorted'), pair('python/a', 'python', 'basics')]);
    expect(file.unknownSection).toEqual(['python/f']);
    expect(file.tiers['3']).toEqual(['python/f']);
  });

  it('applies the manual overrides last', () => {
    const file = build(
      [
        pair('python/a', 'python', 'basics'),
        pair('python/e', 'python', 'objects', 'advanced'),
        pair('python/c', 'python', 'objects'),
      ],
      { overrides: { 'python/a': 3, 'python/e': 1 } },
    );
    expect(file.tiers).toEqual({ '1': ['python/e'], '2': ['python/c'], '3': ['python/a'] });
    expect(file.counts).toEqual({ '1': 1, '2': 1, '3': 1 });
  });

  it('ignores an override for an id that is not staged', () => {
    const file = build([pair('python/a', 'python', 'basics')], { overrides: { 'python/gone': 3 } });
    expect(file.tiers).toEqual({ '1': ['python/a'], '2': [], '3': [] });
  });

  it('sorts ids by track order, then section order, then slug', () => {
    const file = build([
      pair('frontend/react-b', 'frontend', 'react'),
      pair('python/conc', 'python', 'concurrency'),
      pair('python/obj-b', 'python', 'objects'),
      pair('frontend/react-a', 'frontend', 'react'),
      pair('python/obj-a', 'python', 'objects'),
    ]);
    expect(file.tiers['2']).toEqual([
      'python/obj-a',
      'python/obj-b',
      'python/conc',
      'frontend/react-a',
      'frontend/react-b',
    ]);
  });

  it('sorts unknown sections after the known ones and keeps the order stable', () => {
    const pairs = [
      pair('python/zz', 'python', 'unsorted'),
      pair('python/aa', 'python', 'unsorted'),
      pair('python/adv', 'python', 'objects', 'advanced'),
    ];
    const file = build(pairs);
    expect(file.tiers['3']).toEqual(['python/adv', 'python/aa', 'python/zz']);
    expect(build([...pairs].reverse())).toEqual(file);
  });

  it('carries the dropped ids through, sorted', () => {
    const file = build([], { dropped: ['ai/rag', 'ai/deep-learning'] });
    expect(file.dropped).toEqual(['ai/deep-learning', 'ai/rag']);
  });
});

describe('parseOverrides', () => {
  it('reads the override map', () => {
    expect(parseOverrides('overrides:\n  python/a: 3\n  python/b: 1\n')).toEqual({
      'python/a': 3,
      'python/b': 1,
    });
  });

  it('treats an empty or absent map as no overrides', () => {
    expect(parseOverrides('# nothing yet\noverrides: {}\n')).toEqual({});
    expect(parseOverrides('')).toEqual({});
  });

  it('rejects a tier that is not 1, 2 or 3', () => {
    expect(() => parseOverrides('overrides:\n  python/a: 4\n')).toThrow(/python\/a/);
  });
});

describe('serializeTiers', () => {
  it('writes generatedAt first so diffs stay readable', () => {
    const file = buildTiers([pair('python/a', 'python', 'basics')], {
      tracks: TRACKS,
      generatedAt: '2026-09-04T00:00:00.000Z',
    });
    const text = serializeTiers(file);
    expect(text.split('\n')[0]).toBe('generatedAt: 2026-09-04T00:00:00.000Z');
    expect(text).toContain('python/a');
    expect(text.endsWith('\n')).toBe(true);
  });

  it('changes nothing but generatedAt between runs over the same input', () => {
    const pairs = [pair('python/a', 'python', 'basics'), pair('python/e', 'python', 'objects', 'advanced')];
    const first = serializeTiers(buildTiers(pairs, { tracks: TRACKS, generatedAt: 'A' }));
    const second = serializeTiers(buildTiers(pairs, { tracks: TRACKS, generatedAt: 'B' }));
    expect(second.replace('generatedAt: B', 'generatedAt: A')).toBe(first);
  });
});
