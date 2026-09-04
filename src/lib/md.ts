import { createMarkdownProcessor, rehypeHeadingIds } from '@astrojs/markdown-remark';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

import { rehypeCodebox } from '@/markdown/rehype-codebox';
import { rehypeDepthHeadings } from '@/markdown/rehype-depth-headings';
import { rehypeMermaidDiagrams } from '@/markdown/mermaid';
import { remarkCallouts } from '@/markdown/remark-callouts';
import { remarkDepth } from '@/markdown/remark-depth';
import { rehypeSectionActions } from '@/markdown/rehype-section-actions';
import { shikiMetaTransformer } from '@/markdown/shiki-meta';

/** One renderer and one result per distinct answer for the lifetime of a static build. */
const renderer = createMarkdownProcessor({
  remarkPlugins: [remarkCallouts, remarkDepth],
  rehypePlugins: [
    rehypeHeadingIds,
    rehypeMermaidDiagrams,
    rehypeCodebox,
    rehypeDepthHeadings,
    rehypeSectionActions,
  ],
  syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
  shikiConfig: { theme: 'css-variables', transformers: [shikiMetaTransformer] },
});
const rendered = new Map<string, Promise<string>>();

/** Renders authored Markdown through the same remark, rehype and Shiki pipeline as topic pages. */
export function renderMarkdown(markdown: string): Promise<string> {
  let html = rendered.get(markdown);
  if (!html) {
    html = renderer.then((processor) => processor.render(markdown)).then((result) => result.code);
    rendered.set(markdown, html);
  }
  return html;
}

const plainParser = unified().use(remarkParse);

interface MarkdownNode {
  type: string;
  value?: string;
  alt?: string | null;
  children?: MarkdownNode[];
}

/** Block containers need a word boundary between children; inline containers preserve source spaces. */
const BLOCK_NODES = new Set(['root', 'blockquote', 'list', 'listItem', 'table', 'tableRow']);

function visibleText(node: MarkdownNode): string {
  if (node.type === 'html') return '';
  if (node.type === 'image') return node.alt ?? '';
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(visibleText).join(BLOCK_NODES.has(node.type) ? ' ' : '');
}

/** Markdown reduced to the words a reader sees, for structured data and other plain-text uses. */
export function stripMarkdown(markdown: string): string {
  return visibleText(plainParser.parse(markdown) as MarkdownNode)
    .replace(/\s+/g, ' ')
    .trim();
}
