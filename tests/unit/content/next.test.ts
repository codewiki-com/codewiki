import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadTiers, parseArgs } from '../../../scripts/content/next';

/** Write a tier list into a throwaway directory and return its path. */
async function tiersFile(body: string): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'next-tiers-'));
  const file = path.join(root, 'tiers.yaml');
  await writeFile(file, body, 'utf8');
  return file;
}

describe('loadTiers', () => {
  it('reads the tiers block', async () => {
    const file = await tiersFile('tiers:\n  1:\n    - python/closures\n  2: []\n  3: []\n');
    expect(await loadTiers(file)).toEqual({ 1: ['python/closures'], 2: [], 3: [] });
  });

  it('names the file and the fix when the tier list is missing', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'next-tiers-'));
    await expect(loadTiers(path.join(root, 'tiers.yaml'))).rejects.toThrow(
      /not found; run pnpm content:tiers/,
    );
  });

  it('fails loudly on a tier list that does not parse', async () => {
    const file = await tiersFile('tiers:\n  1: [unclosed\n');
    await expect(loadTiers(file)).rejects.toThrow(/not valid YAML/);
  });

  it('fails loudly on a tier list with no tiers block', async () => {
    const file = await tiersFile('generatedAt: 2026-09-04\n');
    await expect(loadTiers(file)).rejects.toThrow(/no tiers block/);
  });
});

describe('parseArgs', () => {
  it('defaults to four topics of the polish step', () => {
    expect(parseArgs([])).toEqual({ n: 4, step: 'polished', only: [] });
  });

  it('reads --n, --tier, --step and a trailing --only list', () => {
    expect(parseArgs(['--n', '2', '--tier', '1', '--step', 'aligned', '--only', 'a/b', 'c/d'])).toEqual({
      n: 2,
      tier: 1,
      step: 'aligned',
      only: ['a/b', 'c/d'],
    });
  });

  it('rejects nonsense', () => {
    expect(() => parseArgs(['--n', '0'])).toThrow(/positive integer/);
    expect(() => parseArgs(['--tier', '9'])).toThrow(/--tier takes/);
    expect(() => parseArgs(['--step', 'burnished'])).toThrow(/unknown step/);
    expect(() => parseArgs(['--only'])).toThrow(/at least one topic id/);
    expect(() => parseArgs(['--what'])).toThrow(/unknown argument/);
  });
});
