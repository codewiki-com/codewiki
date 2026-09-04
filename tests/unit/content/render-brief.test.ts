import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { briefVarsFor, renderBrief } from '../../../scripts/content/render-brief';

/** A staged pair plus its lint report, in a throwaway directory. */
async function fixture(
  options: {
    section?: string;
    enSection?: string;
    zhSection?: string;
    canonicalHint?: 'en' | 'zh';
  } = {},
) {
  const root = await mkdtemp(path.join(tmpdir(), 'render-brief-'));
  const staging = path.join(root, 'staging');
  await mkdir(path.join(staging, 'python'), { recursive: true });
  const fallback = options.section ?? 'functions-deeper';
  const frontmatter = (title: string, section: string) =>
    `---\ntitle: ${title}\ntrack: python\nsection: ${section}\n---\n\nbody\n`;
  await writeFile(
    path.join(staging, 'python/closures.en.md'),
    frontmatter('Closures', options.enSection ?? fallback),
  );
  await writeFile(
    path.join(staging, 'python/closures.zh.md'),
    frontmatter('闭包', options.zhSection ?? fallback),
  );
  await writeFile(path.join(staging, 'python/decorators.en.md'), frontmatter('Decorators', fallback));
  await writeFile(path.join(staging, 'python/decorators.zh.md'), frontmatter('装饰器', fallback));
  await writeFile(path.join(staging, 'python/generators.en.md'), '---\ntrack: python\n---\n\nbody\n');
  await writeFile(path.join(staging, 'python/generators.zh.md'), frontmatter('生成器', fallback));
  const topics = path.join(root, 'topics');
  await mkdir(path.join(topics, 'python'), { recursive: true });
  await writeFile(path.join(topics, 'python/scope-legb.en.mdx'), frontmatter('Scope and LEGB', fallback));
  const report = path.join(root, 'python__closures.json');
  await writeFile(
    report,
    JSON.stringify({ id: 'python/closures', canonicalHint: options.canonicalHint ?? 'zh' }),
  );
  return { root, staging, topics, report };
}

describe('renderBrief', () => {
  it('replaces every placeholder, including repeated ones', () => {
    const out = renderBrief('{{A}} and {{B}}, again {{A}}.', { A: 'one', B: 'two' });
    expect(out).toBe('one and two, again one.');
  });

  it('throws listing every placeholder it could not replace', () => {
    expect(() => renderBrief('{{A}} {{MISSING}} {{ALSO_MISSING}}', { A: 'one' })).toThrow(
      /ALSO_MISSING.*MISSING|MISSING.*ALSO_MISSING/,
    );
  });

  it('leaves text that only looks like a placeholder alone', () => {
    const out = renderBrief('{ {A} } {{lower}} ${A}', { A: 'one' });
    expect(out).toBe('{ {A} } {{lower}} ${A}');
  });

  it('substitutes values verbatim, without re-scanning or expanding replacement patterns', () => {
    const out = renderBrief('{{A}}', { A: 'literal {{B}} and $& and $1' });
    expect(out).toBe('literal {{B}} and $& and $1');
  });
});

describe('briefVarsFor', () => {
  it('builds the variables the polish brief asks for', async () => {
    const { staging, report } = await fixture({ canonicalHint: 'en' });
    const vars = await briefVarsFor('python/closures', {
      lintReportPath: report,
      root: staging,
      today: '2026-09-04',
    });
    expect(vars.TOPIC_ID).toBe('python/closures');
    expect(vars.TRACK).toBe('python');
    expect(vars.SLUG).toBe('closures');
    expect(vars.SECTION).toBe('functions-deeper');
    expect(vars.SLUG_FLAT).toBe('python__closures');
    expect(vars.TODAY).toBe('2026-09-04');
    expect(vars.CANONICAL_LANG).toBe('en');
    expect(vars.OTHER_LANG).toBe('zh');
    expect(vars.EN_PATH.endsWith('python/closures.en.md')).toBe(true);
    expect(vars.ZH_PATH.endsWith('python/closures.zh.md')).toBe(true);
    expect(vars.LINT_REPORT).toContain('python__closures.json');
  });

  it('lists the sibling topics of the track and leaves the topic itself out', async () => {
    const { staging, topics, report } = await fixture();
    const vars = await briefVarsFor('python/closures', {
      lintReportPath: report,
      root: staging,
      topicsRoot: topics,
    });
    expect(vars.SIBLINGS.split('\n')).toEqual([
      '- python/decorators — Decorators',
      '- python/generators — 生成器',
      '- python/scope-legb — Scope and LEGB',
    ]);
  });

  it('says so in words when a track holds nothing but the topic itself', async () => {
    const { staging, topics, report } = await fixture();
    await mkdir(path.join(staging, 'rust'), { recursive: true });
    const only = '---\ntitle: Ownership\ntrack: rust\nsection: basics\n---\n\nbody\n';
    await writeFile(path.join(staging, 'rust/ownership.en.md'), only);
    await writeFile(path.join(staging, 'rust/ownership.zh.md'), only);
    const vars = await briefVarsFor('rust/ownership', {
      lintReportPath: report,
      root: staging,
      topicsRoot: topics,
    });
    expect(vars.SIBLINGS).toBe('- (none)');
  });

  it('takes the canonical language from the lint report and lets the caller override it', async () => {
    const { staging, report } = await fixture({ canonicalHint: 'zh' });
    const fromReport = await briefVarsFor('python/closures', { lintReportPath: report, root: staging });
    expect(fromReport.CANONICAL_LANG).toBe('zh');
    expect(fromReport.OTHER_LANG).toBe('en');
    const overridden = await briefVarsFor('python/closures', {
      lintReportPath: report,
      root: staging,
      canonical: 'en',
    });
    expect(overridden.CANONICAL_LANG).toBe('en');
  });

  it('falls back to zh when the lint report is missing', async () => {
    const { staging } = await fixture();
    const vars = await briefVarsFor('python/closures', {
      lintReportPath: path.join(staging, 'nope.json'),
      root: staging,
    });
    expect(vars.CANONICAL_LANG).toBe('zh');
  });

  it('dates the brief today when the caller gives no date', async () => {
    const { staging, report } = await fixture();
    const vars = await briefVarsFor('python/closures', { lintReportPath: report, root: staging });
    expect(vars.TODAY).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('rejects a topic with no staged files', async () => {
    const { staging, report } = await fixture();
    await expect(briefVarsFor('python/missing', { lintReportPath: report, root: staging })).rejects.toThrow(
      /python\/missing/,
    );
  });

  it('rejects a staged topic whose frontmatter has no section', async () => {
    const { staging, report } = await fixture({ section: '' });
    await expect(briefVarsFor('python/closures', { lintReportPath: report, root: staging })).rejects.toThrow(
      /section/,
    );
  });

  it('falls through to zh when the en frontmatter has no section', async () => {
    const { staging, report } = await fixture({ enSection: '', zhSection: 'functions-deeper' });
    const vars = await briefVarsFor('python/closures', { lintReportPath: report, root: staging });
    expect(vars.SECTION).toBe('functions-deeper');
  });

  it('renders the real polish brief with no placeholder left', async () => {
    const { staging, report } = await fixture();
    const template = await import('node:fs/promises').then((fs) =>
      fs.readFile(new URL('../../../prompts/polish-topic.md', import.meta.url), 'utf8'),
    );
    const out = renderBrief(
      template,
      await briefVarsFor('python/closures', {
        lintReportPath: report,
        root: staging,
      }),
    );
    expect(out).not.toMatch(/\{\{[A-Z0-9_]+\}\}/);
    expect(out).toContain('POLISH DONE python/closures');
  });
});
