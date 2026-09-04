import { readFileSync } from 'node:fs';
import { toPlainMarkdown } from '@/lib/markdown-twin';

const page = { locale: 'en', title: 'Closures', url: 'https://codewiki.com/python/closures/' } as const;

describe('toPlainMarkdown', () => {
  it('converts components to markdown', () => {
    const src = `---\ntitle: Closures\n---\nimport {TLDR} from '@/components/mdx';\n\n<TLDR><TLDRCell label="what">An inner function.</TLDRCell></TLDR>\n\n## What\n\nA <Term id="free-variable">free variable</Term> is…\n\n\`\`\`python run title="a.py"\nprint(1)\n\`\`\`\n\n<Depth level="deep">\n\n## Internals\n\ntext\n\n</Depth>\n`;
    const out = toPlainMarkdown(src, {
      locale: 'en',
      title: 'Closures',
      url: 'https://codewiki.com/python/closures/',
    });
    expect(out.startsWith('# Closures\n\nSource: https://codewiki.com/python/closures/')).toBe(true);
    expect(out).toContain('> - **what**: An inner function.');
    expect(out).toContain('A free variable is…');
    expect(out).toContain('```python\n# file: a.py\nprint(1)\n```');
    expect(out).toContain('<!-- deep -->');
    expect(out).not.toContain('import {TLDR}');
  });

  it('closes the depth comment it opened', () => {
    const out = toPlainMarkdown('<Depth level="deep">\n\ntext\n\n</Depth>\n', page);
    expect(out).toContain('<!-- deep -->\n\ntext\n\n<!-- /deep -->');
  });

  it('closes a depth block that a code fence splits in two', () => {
    const out = toPlainMarkdown('<Depth level="quick">\n\n```python\nprint(1)\n```\n\n</Depth>\n', page);
    expect(out).toContain('<!-- quick -->');
    expect(out).toContain('<!-- /quick -->');
  });

  it('turns a GitHub-style pitfall into a labelled blockquote', () => {
    const out = toPlainMarkdown('> [!PITFALL]\n> Callbacks made in a loop share one binding.\n', page);
    expect(out).toContain('> **Pitfall:** Callbacks made in a loop share one binding.');
    expect(out).not.toContain('[!PITFALL]');
  });

  it('labels the callout in the language the reader is reading', () => {
    const out = toPlainMarkdown('> [!PITFALL]\n> 回调共享同一个绑定。\n', { ...page, locale: 'zh' });
    expect(out).toContain('> **陷阱:** 回调共享同一个绑定。');
  });

  it('converts a Callout component the same way', () => {
    const out = toPlainMarkdown('<Callout type="tip">\n\nUse a default argument.\n\n</Callout>\n', page);
    expect(out).toContain('> **Tip:** Use a default argument.');
  });

  it('leaves the checkpoint as a link back to the page', () => {
    const out = toPlainMarkdown('<Checkpoint id="python/closures" />\n', page);
    expect(out).toContain('[Checkpoint: python/closures](https://codewiki.com/python/closures/#checkpoint)');
  });

  it('drops the fence meta and only names the file inside a code fence', () => {
    const js = toPlainMarkdown('```js run title="a.js"\nlet a = 1;\n```\n', page);
    // `#` is not a comment in JavaScript, so the file line uses the language's own syntax.
    expect(js).toContain('```js\n// file: a.js\nlet a = 1;\n```');

    const text = toPlainMarkdown('```text\n1 2 3\n```\n', page);
    expect(text).toContain('```text\n1 2 3\n```');
  });

  it('leaves component-looking text inside a fence alone', () => {
    const out = toPlainMarkdown('```jsx\n<Term id="x">y</Term>\n```\n', page);
    expect(out).toContain('<Term id="x">y</Term>');
  });

  it('round-trips the real Python closures topic', () => {
    const source = readFileSync(
      new URL('../../src/content/topics/python/closures.en.mdx', import.meta.url),
      'utf8',
    );
    const out = toPlainMarkdown(source, page);

    // Nothing of the MDX shell survives: no frontmatter, no imports, no component tags.
    expect(out.startsWith('# Closures\n\nSource: https://codewiki.com/python/closures/\n\n')).toBe(true);
    expect(out).not.toContain('status: reviewed');
    expect(out).not.toMatch(/<\/?[A-Z]/);

    // Every code fence is still there, and still opens and closes.
    const fences = (input: string) => (input.match(/^```/gm) ?? []).length;
    expect(fences(out)).toBe(fences(source));
    expect(fences(out) % 2).toBe(0);

    // The prose the page shows is the prose the twin carries.
    expect(out).toContain('## What a closure is');
    expect(out).toContain('> - **what**: A closure is a function that keeps access to bindings');
    expect(out).toContain('> **Pitfall:** A function created in a loop');
    expect(out).toContain('```python\n# file: make_counter.py\ndef make_counter():');
    expect(out).toContain('<!-- deep -->');
    expect(out).toContain('<!-- /deep -->');
    expect(out).toContain('[Checkpoint: python/closures](https://codewiki.com/python/closures/#checkpoint)');
  });
});
