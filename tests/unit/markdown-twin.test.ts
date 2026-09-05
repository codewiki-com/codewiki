import { readdirSync, readFileSync } from 'node:fs';
import { extractCheatsheetRows, toPlainMarkdown } from '@/lib/markdown-twin';

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

  it('keeps the label when a code fence splits a callout', () => {
    const out = toPlainMarkdown(
      '<Callout type="pitfall">\n\nDo not do this:\n\n```python\nx = 1\n```\n\nIt rebinds.\n\n</Callout>\n',
      page,
    );
    expect(out).toContain('> **Pitfall:** Do not do this:');
    // The fence stays a fence, inside the blockquote the callout became.
    expect(out).toContain('> ```python\n> x = 1\n> ```');
    expect(out).toContain('> It rebinds.');
    expect(out).not.toMatch(/<\/?[A-Z]/);
  });

  it('keeps the cell label when a code fence splits the TL;DR', () => {
    const out = toPlainMarkdown(
      '<TLDR>\n\n<TLDRCell label="what">\n\nAn inner function:\n\n```python\nx = 1\n```\n\n</TLDRCell>\n\n</TLDR>\n',
      page,
    );
    expect(out).toContain('> - **what**: An inner function:');
    expect(out).toContain('> ```python');
    expect(out).not.toMatch(/<\/?[A-Z]/);
  });

  it('leaves the checkpoint as a link back to the page', () => {
    const out = toPlainMarkdown('<Checkpoint id="python/closures" />\n', page);
    expect(out).toContain('[Checkpoint: python/closures](https://codewiki.com/python/closures/#checkpoint)');
  });

  it('converts Sheet and Row components into a cheatsheet heading and bullet', () => {
    const source = '<Sheet title="Basics">\n<Row code="x: int = 5">annotation is a hint</Row>\n</Sheet>\n';
    const out = toPlainMarkdown(source, { ...page, title: 'Python cheatsheet' });
    expect(out).toContain('## Basics\n\n- `x: int = 5` — annotation is a hint');
    expect(out).not.toContain('<Row');
  });

  it('converts a Row whose code attribute uses single quotes', () => {
    const source = `<Sheet title="Dockerfile foundations">
<Row code='ENTRYPOINT ["node", "app.mjs"]'>start Node without a shell wrapper</Row>
</Sheet>
`;
    const out = toPlainMarkdown(source, { ...page, title: 'Docker cheatsheet' });
    expect(out).toContain(
      '## Dockerfile foundations\n\n- `ENTRYPOINT ["node", "app.mjs"]` — start Node without a shell wrapper',
    );
    expect(extractCheatsheetRows(source)).toEqual([
      {
        section: 'Dockerfile foundations',
        code: 'ENTRYPOINT ["node", "app.mjs"]',
        note: 'start Node without a shell wrapper',
      },
    ]);
  });

  it('keeps escaped matching quotes inside either Row attribute style', () => {
    const source = String.raw`<Sheet title="Quotes">
<Row code="say \"hello\"">double quoted</Row>
<Row code='say \'hello\''>single quoted</Row>
</Sheet>`;
    expect(extractCheatsheetRows(source)).toEqual([
      { section: 'Quotes', code: String.raw`say \"hello\"`, note: 'double quoted' },
      { section: 'Quotes', code: String.raw`say \'hello\'`, note: 'single quoted' },
    ]);
  });

  it('extracts section, code and note from cheatsheet source without compiling MDX', () => {
    const source = '<Sheet title="Comparisons">\n<Row code="0 &lt; x">read left to right</Row>\n</Sheet>\n';
    expect(extractCheatsheetRows(source)).toEqual([
      { section: 'Comparisons', code: '0 < x', note: 'read left to right' },
    ]);
  });

  it('drops the fence meta and only names the file inside a code fence', () => {
    const js = toPlainMarkdown('```js run title="a.js"\nlet a = 1;\n```\n', page);
    // `#` is not a comment in JavaScript, so the file line uses the language's own syntax.
    expect(js).toContain('```js\n// file: a.js\nlet a = 1;\n```');

    const text = toPlainMarkdown('```text\n1 2 3\n```\n', page);
    expect(text).toContain('```text\n1 2 3\n```');
  });

  it('keeps a Mermaid fence as authored source', () => {
    const source = '```mermaid\nflowchart LR\n  Source --> SVG\n```\n';
    const out = toPlainMarkdown(source, page);
    expect(out).toContain(source.trim());
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
    expect(out).toContain('## What it is and why it exists');
    expect(out).toContain('> - **what**: A closure is a function associated with enclosing lexical bindings');
    expect(out).toContain('> **Pitfall:** "A closure saves the variable\'s value at that moment"');
    expect(out).toContain('```python\n# file: label_factory.py\ndef make_labeler(prefix):');
    expect(out).toContain('<!-- deep -->');
    expect(out).toContain('<!-- /deep -->');
    expect(out).toContain('[Checkpoint: python/closures](https://codewiki.com/python/closures/#checkpoint)');
  });

  it('converts every authored cheatsheet row into its Markdown twin and API data', () => {
    const directory = new URL('../../src/content/cheatsheets/', import.meta.url);
    for (const file of readdirSync(directory)
      .filter((name) => name.endsWith('.mdx'))
      .sort()) {
      const source = readFileSync(new URL(file, directory), 'utf8');
      const authoredRows = (source.match(/<Row\b/g) ?? []).length;
      const locale = file.endsWith('.zh.mdx') ? 'zh' : 'en';
      const markdown = toPlainMarkdown(source, {
        locale,
        title: file,
        url: `https://codewiki.com/cheatsheets/${file.replace(/\.(?:en|zh)\.mdx$/, '')}.md`,
      });
      const twinRows = (markdown.match(/^- `+/gm) ?? []).length;

      expect({ file, apiRows: extractCheatsheetRows(source).length, twinRows }).toEqual({
        file,
        apiRows: authoredRows,
        twinRows: authoredRows,
      });
    }
  });
});
