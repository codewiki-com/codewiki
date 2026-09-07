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

/** Remove one H2 and its body while keeping the following H2. */
function withoutSection(source: string, heading: string): string {
  const start = source.indexOf(`## ${heading}\n`);
  if (start < 0) return source;
  const nextDepth = source.indexOf('\n<Depth ', start);
  const nextHeading = source.indexOf('\n## ', start + heading.length + 4);
  const end = [nextDepth, nextHeading].filter((position) => position >= 0).sort((a, b) => a - b)[0];
  if (end === undefined) return source.slice(0, start);
  return `${source.slice(0, start)}${source.slice(end + 1)}`;
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

  it('accepts a substantive topic without an AI-era section below 400 lines', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'codewiki-optional-ai-section-'));
    await mkdir(path.join(root, 'python'), { recursive: true });
    const enBase = withoutSection(
      await readFile(path.join(TOPICS, 'python/closures.en.mdx'), 'utf8'),
      'In the AI era',
    );
    const zhBase = withoutSection(
      await readFile(path.join(TOPICS, 'python/closures.zh.mdx'), 'utf8'),
      'AI 时代',
    );
    const enWithAi = enBase.replace(
      '<Depth level="deep">',
      '## In the AI era\n\nLegacy review advice.\n\n<Depth level="deep">',
    );
    const zhWithAi = zhBase.replace(
      '<Depth level="deep">',
      '## AI 时代\n\n旧版审查建议。\n\n<Depth level="deep">',
    );
    expect(enWithAi).toContain('## In the AI era');
    expect(zhWithAi).toContain('## AI 时代');
    const en = withoutSection(enWithAi, 'In the AI era');
    const zh = withoutSection(zhWithAi, 'AI 时代');
    expect(en).not.toContain('## In the AI era');
    expect(zh).not.toContain('## AI 时代');
    expect(en.length).toBeLessThan(enWithAi.length);
    expect(zh.length).toBeLessThan(zhWithAi.length);
    expect(en.trimEnd().split('\n').length).toBeGreaterThanOrEqual(100);
    expect(en.trimEnd().split('\n').length).toBeLessThan(400);
    expect(zh.trimEnd().split('\n').length).toBeGreaterThanOrEqual(100);
    expect(zh.trimEnd().split('\n').length).toBeLessThan(400);
    await writeFile(path.join(root, 'python/closures.en.mdx'), en);
    await writeFile(path.join(root, 'python/closures.zh.mdx'), zh);

    const result = await checkTopic('python/closures', { noLinks: true, root });

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  }, 120_000);

  it('rejects a topic missing a required core section in both languages', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'codewiki-missing-core-section-'));
    await mkdir(path.join(root, 'python'), { recursive: true });
    const en = withoutSection(
      await readFile(path.join(TOPICS, 'python/closures.en.mdx'), 'utf8'),
      'How it works',
    );
    const zh = withoutSection(
      await readFile(path.join(TOPICS, 'python/closures.zh.mdx'), 'utf8'),
      '工作原理',
    );
    expect(en).not.toContain('## How it works');
    expect(zh).not.toContain('## 工作原理');
    await writeFile(path.join(root, 'python/closures.en.mdx'), en);
    await writeFile(path.join(root, 'python/closures.zh.mdx'), zh);

    const result = await checkTopic('python/closures', { noLinks: true, root });

    expect(result.ok).toBe(false);
    expect(failedChecks(result.failures)).toEqual([6]);
    expect(result.failures).toContain('6. en: no "## How it works" section');
    expect(result.failures).toContain('6. zh: no "## 工作原理" section');
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
