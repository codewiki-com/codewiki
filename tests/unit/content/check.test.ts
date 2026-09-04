import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkTopic } from '../../../scripts/content/check';

const TOPICS = fileURLToPath(new URL('../../../src/content/topics', import.meta.url));

/** The check numbers that produced at least one failure. */
function failedChecks(failures: string[]): number[] {
  return [...new Set(failures.map((failure) => Number(failure.split('.')[0])))].sort((a, b) => a - b);
}

describe('checkTopic', () => {
  it('accepts the polished sample topic', async () => {
    const result = await checkTopic('python/closures', { noLinks: true, relaxed: true });
    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  }, 120_000);

  it('reports the typography and alignment checks on a broken pair', async () => {
    // The sample copied into a scratch tree, then damaged in exactly two ways: a
    // half-width comma in the Chinese prose, and one extra Chinese paragraph that has no
    // English counterpart.
    const root = await mkdtemp(path.join(tmpdir(), 'codewiki-check-'));
    await mkdir(path.join(root, 'python'), { recursive: true });
    const en = await readFile(path.join(TOPICS, 'python/closures.en.mdx'), 'utf8');
    const zh = await readFile(path.join(TOPICS, 'python/closures.zh.mdx'), 'utf8');
    // Damage the body only: a comma in the frontmatter is not what the check reads.
    const bodyAt = zh.indexOf('\n---\n', 4) + '\n---\n'.length;
    const body = zh.slice(bodyAt);
    expect(body).toContain('，');
    const broken = `${zh.slice(0, bodyAt)}${body.replace('，', ',')}\n多出来的一段中文。\n`;
    await writeFile(path.join(root, 'python/closures.en.mdx'), en);
    await writeFile(path.join(root, 'python/closures.zh.mdx'), broken);

    const result = await checkTopic('python/closures', { noLinks: true, relaxed: true, root });
    expect(result.ok).toBe(false);
    expect(failedChecks(result.failures)).toEqual([2, 5]);
  }, 120_000);
});
