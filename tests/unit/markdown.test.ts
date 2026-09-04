import { readFileSync } from 'node:fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import type { Root as MdastRoot } from 'mdast';
import type { Root as HastRoot, Element } from 'hast';
import { remarkCallouts } from '@/markdown/remark-callouts';
import { remarkDepth } from '@/markdown/remark-depth';
import { rehypeCodebox } from '@/markdown/rehype-codebox';
import { rehypeDepthHeadings } from '@/markdown/rehype-depth-headings';
import { rehypeMermaidDiagrams } from '@/markdown/mermaid';
import { rehypeSectionActions } from '@/markdown/rehype-section-actions';
import { parseFenceMeta } from '@/markdown/shiki-meta';

describe('parseFenceMeta', () => {
  it('parses run and title', () => {
    expect(parseFenceMeta('run title="make_counter.py"')).toEqual({ run: true, title: 'make_counter.py' });
    expect(parseFenceMeta('')).toEqual({ run: false });
    expect(parseFenceMeta('title="a b.py" highlight="2-3"')).toEqual({
      run: false,
      title: 'a b.py',
      highlight: '2-3',
    });
  });
});

describe('remarkCallouts', () => {
  it('turns a GitHub-style alert into an aside', async () => {
    const out = await unified()
      .use(remarkParse)
      .use(remarkCallouts)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process('> [!PITFALL]\n> Do not do this.');
    expect(String(out)).toContain('<aside class="callout callout-pitfall"');
    expect(String(out)).toContain('Do not do this.');
  });

  it('emits the label paragraph and the localisation hooks', async () => {
    const out = String(
      await unified()
        .use(remarkParse)
        .use(remarkCallouts)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process('> [!PITFALL]\n> Do not do this.'),
    );
    expect(out).toContain('role="note"');
    expect(out).toContain('data-callout="pitfall"');
    expect(out).toContain('<p class="callout-label" data-i18n="callout.pitfall">Pitfall</p>');
  });

  it('renders the initial label in Chinese when requested', async () => {
    const out = String(
      await unified()
        .use(remarkParse)
        .use(remarkCallouts, { locale: 'zh' })
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process('> [!PITFALL]\n> 不要这样做。'),
    );
    expect(out).toContain('<p class="callout-label" data-i18n="callout.pitfall">陷阱</p>');
  });

  it('supports every documented type and leaves plain blockquotes alone', async () => {
    const run = async (source: string) =>
      String(
        await unified()
          .use(remarkParse)
          .use(remarkCallouts)
          .use(remarkRehype, { allowDangerousHtml: true })
          .use(rehypeStringify, { allowDangerousHtml: true })
          .process(source),
      );

    expect(await run('> [!NOTE]\n> n')).toContain('callout-note');
    expect(await run('> [!TIP]\n> n')).toContain('callout-tip');
    expect(await run('> [!WARNING]\n> n')).toContain('callout-warning');
    expect(await run('> [!AI]\n> n')).toContain('callout-ai');
    expect(await run('> just a quote')).toContain('<blockquote>');
  });
});

/** Runs the mdast half of the pipeline and hands back the transformed tree plus the vfile data. */
function runDepth(source: string, path = 'topic.en.mdx') {
  const processor = unified().use(remarkParse).use(remarkMdx).use(remarkDepth);
  const file = { value: source, path, data: { astro: { frontmatter: {} as Record<string, unknown> } } };
  const tree = processor.runSync(processor.parse(file), file) as MdastRoot;
  return { tree, frontmatter: file.data.astro.frontmatter };
}

describe('remarkDepth', () => {
  it('counts words per depth level and writes cumulative reading times', () => {
    const { frontmatter } = runDepth(
      [
        '<Depth level="quick">',
        '',
        'alpha beta gamma',
        '',
        '</Depth>',
        '',
        'delta epsilon',
        '',
        '<Depth level="deep">',
        '',
        'zeta',
        '',
        '</Depth>',
      ].join('\n'),
    );

    expect(frontmatter.words).toEqual({ quick: 3, standard: 2, deep: 1 });
    // 6 words total, well under one minute at 220 wpm, so every level floors at one minute.
    expect(frontmatter.readingTime).toEqual({ quick: 1, standard: 1, deep: 1 });
  });

  it('counts a code fence as four words a line and the TL;DR as quick', () => {
    const { frontmatter } = runDepth(
      [
        '<TLDR>',
        '  <TLDRCell label="what">alpha beta</TLDRCell>',
        '</TLDR>',
        '',
        '```python',
        'print(1)',
        'print(2)',
        '```',
      ].join('\n'),
    );

    expect(frontmatter.words).toEqual({ quick: 2, standard: 8, deep: 0 });
  });

  it('counts Chinese characters when the file is the zh translation', () => {
    const { frontmatter } = runDepth('闭包很有用。\n', 'topic.zh.mdx');
    expect((frontmatter.words as Record<string, number>).standard).toBe(6);
  });

  it('wraps top-level runs in a standard group but leaves Depth and TLDR alone', () => {
    const { tree } = runDepth(
      [
        '<TLDR>',
        '  <TLDRCell label="what">alpha</TLDRCell>',
        '</TLDR>',
        '',
        '## Heading',
        '',
        'paragraph one',
        '',
        '<Depth level="deep">',
        '',
        'deep text',
        '',
        '</Depth>',
        '',
        'trailing paragraph',
      ].join('\n'),
    );

    expect(tree.children.map((child) => child.type)).toEqual([
      'mdxJsxFlowElement',
      'depthGroup',
      'mdxJsxFlowElement',
      'depthGroup',
    ]);
    const group = tree.children[1] as unknown as {
      data: { hName: string; hProperties: unknown };
      children: unknown[];
    };
    expect(group.data.hName).toBe('div');
    expect(group.data.hProperties).toEqual({ 'data-depth': 'standard' });
    expect(group.children).toHaveLength(2);
  });

  it('leaves the checkpoint unwrapped so no depth mode can hide it', () => {
    const { tree, frontmatter } = runDepth(
      ['alpha beta', '', '<Checkpoint id="python/closures" />', '', 'gamma'].join('\n'),
    );

    expect(tree.children.map((child) => child.type)).toEqual([
      'depthGroup',
      'mdxJsxFlowElement',
      'depthGroup',
    ]);
    // Unwrapped, but still part of the Standard reading estimate.
    expect(frontmatter.words).toEqual({ quick: 0, standard: 3, deep: 0 });
  });
});

/** Minimal hast fixture: the `<pre>` Shiki hands to `rehype-codebox`, with the meta already applied. */
function preFixture(properties: Record<string, string>): Element {
  return {
    type: 'element',
    tagName: 'pre',
    properties: { className: ['astro-code'], ...properties },
    children: [
      { type: 'element', tagName: 'code', properties: {}, children: [{ type: 'text', value: 'print(1)' }] },
    ],
  };
}

describe('rehypeCodebox', () => {
  it('wraps a runnable fence in the codebox figure', () => {
    const tree: HastRoot = {
      type: 'root',
      children: [preFixture({ 'data-lang': 'python', 'data-title': 'make_counter.py', 'data-run': 'true' })],
    };
    rehypeCodebox()(tree);

    const figure = tree.children[0] as Element;
    expect(figure.tagName).toBe('figure');
    expect(figure.properties).toEqual({
      className: ['codebox'],
      'data-lang': 'python',
      'data-title': 'make_counter.py',
      'data-run': 'true',
    });

    const [head, pre, out] = figure.children as Element[];
    expect(head.tagName).toBe('div');
    expect(head.properties.className).toEqual(['codehead']);
    const title = (head.children[0] as Element).children[0];
    expect(title).toEqual({ type: 'text', value: 'make_counter.py' });

    const buttons = (head.children[1] as Element).children as Element[];
    expect(buttons).toHaveLength(2);
    expect(buttons[0].properties).toEqual({
      type: 'button',
      className: ['act', 'act-sm'],
      'data-copy': '',
      'data-i18n': 'code.copy',
    });
    expect(buttons[1].properties).toEqual({
      type: 'button',
      className: ['run'],
      'data-run': '',
      'data-i18n': 'code.run',
    });

    expect(pre.tagName).toBe('pre');
    expect(out.tagName).toBe('div');
    expect(out.properties).toEqual({ className: ['out'], hidden: true });
  });

  it('omits the Run button and the output slot when the fence is not runnable', () => {
    const tree: HastRoot = { type: 'root', children: [preFixture({ 'data-lang': 'js' })] };
    rehypeCodebox()(tree);

    const figure = tree.children[0] as Element;
    expect(figure.properties).toEqual({ className: ['codebox'], 'data-lang': 'js' });
    expect(figure.children).toHaveLength(2);

    const head = figure.children[0] as Element;
    const title = (head.children[0] as Element).children[0];
    // Without a title the header falls back to the language's display name.
    expect(title).toEqual({ type: 'text', value: 'JavaScript' });
    expect((head.children[1] as Element).children).toHaveLength(1);
  });

  it('localizes server-rendered controls before hydration', () => {
    const tree: HastRoot = {
      type: 'root',
      children: [preFixture({ 'data-lang': 'python', 'data-run': 'true' })],
    };
    rehypeCodebox({ locale: 'zh' })(tree);

    const head = (tree.children[0] as Element).children[0] as Element;
    const buttons = (head.children[1] as Element).children as Element[];
    expect(buttons.map((item) => item.children[0])).toEqual([
      { type: 'text', value: '复制' },
      { type: 'text', value: '运行' },
    ]);
  });

  it('renders a text fence as a headerless output box', () => {
    const tree: HastRoot = { type: 'root', children: [preFixture({ 'data-lang': 'text' })] };
    rehypeCodebox()(tree);

    const figure = tree.children[0] as Element;
    expect(figure.properties).toEqual({ className: ['codebox', 'codebox-output'] });
    expect(figure.children).toHaveLength(1);
    expect((figure.children[0] as Element).tagName).toBe('pre');
  });

  it("reads the language that Astro's own transformer sets when no meta was parsed", () => {
    const tree: HastRoot = { type: 'root', children: [preFixture({ dataLanguage: 'sql' })] };
    rehypeCodebox()(tree);
    expect((tree.children[0] as Element).properties).toEqual({ className: ['codebox'], 'data-lang': 'sql' });
  });

  it('leaves a preformatted prose block without a code child alone', () => {
    const pre: Element = {
      type: 'element',
      tagName: 'pre',
      properties: { dataLanguage: 'python' },
      children: [{ type: 'text', value: 'not a code fence' }],
    };
    const tree: HastRoot = { type: 'root', children: [pre] };
    rehypeCodebox()(tree);
    expect(tree.children[0]).toBe(pre);
  });
});

describe('rehypeMermaidDiagrams', () => {
  it('renders Mermaid fences as semantic inline SVG and leaves Python fences alone', async () => {
    const source = readFileSync(new URL('../fixtures/mermaid.mdx', import.meta.url), 'utf8');
    const out = String(
      await unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeMermaidDiagrams)
        .use(rehypeStringify)
        .process(source),
    );

    expect(out.match(/<figure class="diagram"/g)).toHaveLength(3);
    expect(out.match(/<svg [^>]*data-diagram=""/g)).toHaveLength(3);
    const svgTags = out.match(/<svg\b[^>]*>/g) ?? [];
    expect(svgTags).toHaveLength(3);
    for (const svg of svgTags) {
      const viewBox = svg.match(/viewBox="[^"]*\s([\d.]+)\s([\d.]+)"/);
      expect(viewBox).not.toBeNull();
      expect(svg).toContain(`width="${viewBox?.[1]}"`);
      expect(svg).toContain(`height="${viewBox?.[2]}"`);
    }
    expect(out).toContain('role="img" aria-label="sequenceDiagram"');
    expect(out).toContain('role="img" aria-label="flowchart LR"');
    expect(out).toContain('role="img" aria-label="classDiagram"');
    expect(out).not.toContain('language-mermaid');
    expect(out).toContain('<pre><code class="language-python">print("ordinary code")');
  });
});

describe('rehypeDepthHeadings', () => {
  it('copies the nearest depth ancestor onto h2 and h3', () => {
    const heading = (tagName: string): Element => ({
      type: 'element',
      tagName,
      properties: {},
      children: [{ type: 'text', value: 'x' }],
    });
    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'div',
          properties: { 'data-depth': 'standard' },
          children: [heading('h2')],
        },
        {
          type: 'mdxJsxFlowElement',
          name: 'Depth',
          attributes: [{ type: 'mdxJsxAttribute', name: 'level', value: 'deep' }],
          children: [heading('h3'), heading('h4')],
        },
        heading('h2'),
      ],
    } as unknown as HastRoot;

    rehypeDepthHeadings()(tree);

    const standard = (tree.children[0] as Element).children[0] as Element;
    const deep = (tree.children[1] as unknown as Element).children[0] as Element;
    const other = (tree.children[1] as unknown as Element).children[1] as Element;
    expect(standard.properties['data-depth']).toBe('standard');
    expect(deep.properties['data-depth']).toBe('deep');
    // Only h2/h3 reach the table of contents, so nothing else is marked.
    expect(other.properties['data-depth']).toBeUndefined();
    expect((tree.children[2] as Element).properties['data-depth']).toBeUndefined();
  });
});

describe('rehypeSectionActions', () => {
  /** A heading as `rehypeHeadingIds` leaves it: text, and the id the anchors use. */
  const h2 = (id?: string): Element => ({
    type: 'element',
    tagName: 'h2',
    properties: id ? { id } : {},
    children: [{ type: 'text', value: 'Late binding' }],
  });

  it('puts an ask button after every h2, as its sibling', () => {
    const tree: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'div',
          properties: { 'data-depth': 'standard' },
          children: [h2('late-binding'), { type: 'element', tagName: 'p', properties: {}, children: [] }],
        },
      ],
    };
    rehypeSectionActions()(tree);

    const [heading, button, paragraph] = (tree.children[0] as Element).children as Element[];
    expect(heading!.tagName).toBe('h2');
    // The heading keeps its own children: the table of contents reads them.
    expect(heading!.children).toHaveLength(1);
    expect(button!.tagName).toBe('button');
    expect(button!.properties).toEqual({
      type: 'button',
      className: ['sec-ask'],
      'data-section': 'late-binding',
      'data-i18n': 'ai.section',
      'aria-label': 'Ask AI about this section',
    });
    expect(paragraph!.tagName).toBe('p');
  });

  it('leaves the deep teaser and unidentified headings alone', () => {
    const tree: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'div',
          properties: { className: ['depth-teaser'] },
          children: [h2('teased')],
        },
        h2(),
      ],
    };
    rehypeSectionActions()(tree);

    expect((tree.children[0] as Element).children).toHaveLength(1);
    expect(tree.children).toHaveLength(2);
  });

  it('localizes both the visible and accessible section-action labels', () => {
    const tree: HastRoot = { type: 'root', children: [h2('scope')] };
    rehypeSectionActions({ locale: 'zh' })(tree);

    const button = tree.children[1] as Element;
    expect(button.properties['aria-label']).toBe('让 AI 讲讲这一节');
    expect(button.children[0]).toEqual({ type: 'text', value: '让 AI 讲讲这一节' });
  });
});
