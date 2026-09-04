import { readFileSync } from 'node:fs';

import { buildContextPackFiles, splitPack, type PackTopic } from '@/lib/packs';
import { extractRules, renderAgentsMd, renderClaudeMd, renderCursorMdc } from '@/lib/rules';

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
