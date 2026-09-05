import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { buildContextPackFiles, splitPack, type PackTopic } from '@/lib/packs';
import {
  extractRules,
  renderAgentsMd,
  renderClaudeMd,
  renderCursorMdc,
  RULE_MAX_LENGTH,
  type Rule,
} from '@/lib/rules';

const source = readFileSync(new URL('../fixtures/rules.mdx', import.meta.url), 'utf8');
const topic = { title: 'Iterator safety', url: 'https://codewiki.com/python/iterator-safety/' };

describe('rules', () => {
  const rules = extractRules(source, topic);

  it('extracts three pitfalls and the AI-era review checklist fixture', () => {
    expect(rules).toHaveLength(4);
    expect(rules.map((rule) => rule.topic)).toEqual([topic, topic, topic, topic]);
    expect(rules[0]?.why).toContain('The index no longer matches');
    expect(rules[3]?.text).toBe('Verify that iteration order remains stable after each mutation.');
  });

  it('uses the documented small imperative heuristic', () => {
    expect(rules[0]?.text).toBe(
      'Do not assume this is safe: code that mutates a list during iteration skips elements.',
    );
    expect(rules[1]?.text).toBe('Avoid swallowing the exception before logging its cause.');
    expect(rules[2]?.text).toBe('Logout handlers run after the response is committed.');
  });

  it('keeps a long single sentence whole instead of cutting it into a Why: fragment', () => {
    const long =
      '> [!PITFALL]\n' +
      '> Deferring each resource close directly inside a long loop retains all resources until the' +
      ' outer function ends, not until the current iteration ends.\n';
    const [rule] = extractRules(long, topic);
    expect(rule?.text).toBe(
      'Do not assume this is safe: deferring each resource close directly inside a long loop retains' +
        ' all resources until the outer function ends, not until the current iteration ends.',
    );
    expect(rule?.why).toBe('');
  });

  it('never turns a semicolon clause into a reason', () => {
    const source =
      '> [!PITFALL]\n' +
      '> Declaring a nil function variable and then writing `defer cleanup()` does not fail at' +
      ' registration; it panics when the nil function is invoked during exit.\n';
    const [rule] = extractRules(source, topic);
    expect(rule?.text).toContain('it panics when the nil function is invoked during exit.');
    expect(rule?.why).toBe('');
  });

  it('keeps a 200-character sentence intact', () => {
    const source =
      '> [!PITFALL]\n' +
      '> `send(*recipient)` supplies one positional argument per character when `recipient` is a' +
      ' string, and unpacking a generator consumes it before the function body begins.\n';
    const [rule] = extractRules(source, topic);
    expect(rule?.text).toContain('before the function body begins.');
    expect(rule?.text.endsWith('…')).toBe(false);
    expect(rule?.why).toBe('');
  });

  it('renders the three agent formats with sources and track globs', () => {
    expect(renderClaudeMd('python', rules)).toMatch(/^# Python rules/);
    expect(renderAgentsMd('python', rules)).toContain('- Avoid swallowing');
    const cursor = renderCursorMdc('python', rules);
    expect(cursor).toContain('description: Python rules');
    expect(cursor).toContain('globs: "**/*.py"');
    expect(cursor).toContain('[Iterator safety](https://codewiki.com/python/iterator-safety/)');
  });
});

describe('context packs', () => {
  it('splits in source order and counts separators against the byte limit', () => {
    const chunks = splitPack(['a'.repeat(30), 'b'.repeat(30), 'c'.repeat(30)], 70);
    expect(chunks).toEqual([`${'a'.repeat(30)}\n\n---\n\n${'b'.repeat(30)}`, 'c'.repeat(30)]);
    expect(chunks.every((chunk) => new TextEncoder().encode(chunk).byteLength <= 70)).toBe(true);
  });

  it('lists canonical topics and numbered parts in every split file header', () => {
    const topics: PackTopic[] = [
      {
        track: 'python',
        section: 'functions-deeper',
        title: 'One',
        url: 'https://codewiki.com/python/one/',
        markdown: `# One\n\n${'a'.repeat(180)}`,
      },
      {
        track: 'python',
        section: 'functions-deeper',
        title: 'Two',
        url: 'https://codewiki.com/python/two/',
        markdown: `# Two\n\n${'b'.repeat(180)}`,
      },
    ];
    const files = buildContextPackFiles(topics, 1_000);
    expect(files).toHaveLength(1);
    expect(files[0]?.filename).toBe('functions-deeper.md');
    expect(files[0]?.body).toContain('[One](https://codewiki.com/python/one/)');

    const split = buildContextPackFiles(topics, 550);
    expect(split.map((file) => file.filename)).toEqual(['functions-deeper-1.md', 'functions-deeper-2.md']);
    expect(split[0]?.body).toContain('## Parts');
    expect(split[0]?.body).toContain('/packs/python/functions-deeper-2.md');
  });
});

describe('generated rules over the published corpus', () => {
  const topicsDir = new URL('../../src/content/topics/', import.meta.url).pathname;
  const files = readdirSync(topicsDir, { recursive: true, encoding: 'utf8' })
    .map((file) => file.split(path.sep).join('/'))
    .filter((file) => file.endsWith('.en.mdx'))
    .sort();

  const rules: Rule[] = files.flatMap((file) =>
    extractRules(readFileSync(path.join(topicsDir, file), 'utf8'), {
      title: file,
      url: `https://codewiki.com/${file.replace(/\.en\.mdx$/, '')}/`,
    }),
  );

  it('reads a non-trivial number of rules', () => {
    expect(files.length).toBeGreaterThan(100);
    expect(rules.length).toBeGreaterThan(500);
  });

  it('never ends a rule mid-sentence with a Why: fragment underneath', () => {
    const severed = rules.filter((rule) => rule.text.trimEnd().endsWith('…'));
    expect(severed.map((rule) => `${rule.topic.title}: ${rule.text}`)).toEqual([]);
  });

  it('states a reason only when a second sentence supplies one', () => {
    const withWhy = rules.filter((rule) => rule.why);
    expect(withWhy.length).toBeGreaterThan(0);
    for (const rule of withWhy) {
      // Both halves are whole sentences: the rule ends on its own terminator and the reason
      // starts a new one rather than continuing the clause above it.
      expect(rule.text).toMatch(/[.!?。！？]$/u);
      expect(rule.why).toMatch(/[.!?。！？][”’"')\]]?$/u);
    }
  });

  it('keeps almost every rule inside the soft length budget', () => {
    const over = rules.filter((rule) => rule.text.length > RULE_MAX_LENGTH);
    expect(over.length / rules.length).toBeLessThan(0.1);
  });
});
