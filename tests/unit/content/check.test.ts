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
  it('reports JSX-like angle brackets in prose as numbered MDX findings', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'codewiki-mdx-check-'));
    await mkdir(path.join(root, 'python'), { recursive: true });
    const en = await readFile(path.join(TOPICS, 'python/closures.en.mdx'), 'utf8');
    const zh = await readFile(path.join(TOPICS, 'python/closures.zh.mdx'), 'utf8');
    const fixture = fileURLToPath(new URL('../../fixtures/invalid-mdx.mdx', import.meta.url));
    const invalidProse = (await readFile(fixture, 'utf8')).trimEnd().split('\n').at(-1);
    expect(invalidProse).toContain('a < b</p>');
    await writeFile(path.join(root, 'python/closures.en.mdx'), `${en}\n${invalidProse}\n`);
    await writeFile(path.join(root, 'python/closures.zh.mdx'), `${zh}\n${invalidProse}\n`);

    const result = await checkTopic('python/closures', { noLinks: true, relaxed: true, root });

    expect(result.ok).toBe(false);
    expect(failedChecks(result.failures)).toEqual([9]);
    expect(result.failures.join('\n')).toMatch(
      /9\. en MDX compile: .*closures\.en\.mdx:\d+:\d+: Unexpected closing slash/,
    );
  }, 120_000);

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

  it('reports the full Zod path for a null tag anywhere in the track interview bank', async () => {
    const interviewRoot = await mkdtemp(path.join(tmpdir(), 'codewiki-interview-'));
    await writeFile(
      path.join(interviewRoot, 'python.yaml'),
      [
        'track: python',
        'items:',
        '  - id: closures-capture',
        '    question: { en: What is captured?, zh: 捕获了什么？ }',
        '    answer: { en: The binding., zh: 是绑定。 }',
        '    topics: [python/closures]',
        '    level: intermediate',
        '    tags: [closures, null]',
        '',
      ].join('\n'),
    );

    const result = await checkTopic('python/closures', {
      noLinks: true,
      relaxed: true,
      interviewRoot,
    });

    expect(result.ok).toBe(false);
    expect(failedChecks(result.failures)).toEqual([7]);
    expect(result.failures.join('\n')).toMatch(/interview "python": items\.0\.tags\.1: .*null/i);
  }, 120_000);

  it('validates the complete per-topic glossary proposal shape', async () => {
    const proposalsRoot = await mkdtemp(path.join(tmpdir(), 'codewiki-proposals-'));
    await writeFile(
      path.join(proposalsRoot, 'python-closures.yaml'),
      [
        'terms:',
        '  - id: closure-cell',
        '    en: Closure cell',
        '    zh: 闭包单元',
        '    aliases: [cell, null]',
        '    short: { en: A stored binding., zh: 保存的绑定。 }',
        '    topics: [python/closures]',
        '',
      ].join('\n'),
    );

    const result = await checkTopic('python/closures', {
      noLinks: true,
      relaxed: true,
      proposalsRoot,
    });

    expect(result.ok).toBe(false);
    expect(failedChecks(result.failures)).toEqual([7]);
    expect(result.failures.join('\n')).toMatch(
      /glossary proposal "python-closures": terms\.0\.aliases\.1: .*null/i,
    );
  }, 120_000);
});
