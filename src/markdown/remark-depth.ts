/**
 * The depth dial, mdast half. Two jobs on one pass over the top-level nodes:
 *
 * 1. Tally the words each depth level contributes and write `words` and cumulative `readingTime`
 *    onto the frontmatter, where `render(entry).remarkPluginFrontmatter` exposes them.
 * 2. Wrap every run of top-level nodes that is neither a `<Depth>` section nor the `<TLDR>` block
 *    in `<div data-depth="standard">`, so the CSS in `global.css` can hide Standard prose in Quick
 *    mode. `<Depth>` marks itself through its own component.
 *
 * The wrapper is a custom mdast node: `mdast-util-to-hast` turns an unknown node into a `<div>` and
 * applies `data.hName` / `data.hProperties`, which works in both the Markdown and the MDX pipeline.
 */
import type { Root, RootContent } from 'mdast';
import type { VFile } from 'vfile';
// Relative rather than the `@/` alias: Astro loads this file through its config loader, which
// does not apply the tsconfig path mapping.
import { WORDS_PER_CODE_LINE, computeReadingTime, countWords } from '../lib/reading-time';
import type { Locale } from '../lib/urls';

export type DepthLevel = 'quick' | 'standard' | 'deep';

/** Words per level, before the cumulative roll-up. */
export type DepthWords = Record<DepthLevel, number>;

/** The MDX JSX nodes this plugin recognises, typed structurally to avoid an mdast-util-mdx import. */
interface JsxNode {
  type: 'mdxJsxFlowElement';
  name: string | null;
  attributes: { type: string; name?: string; value?: unknown }[];
  children: RootContent[];
}

/** A generic mdast node as far as the word counter cares. */
interface AnyNode {
  type: string;
  value?: string;
  children?: AnyNode[];
}

function isJsx(node: { type: string }): node is JsxNode {
  return node.type === 'mdxJsxFlowElement';
}

/** The string value of a JSX attribute, when it was written as a plain string. */
function attribute(node: JsxNode, name: string): string | undefined {
  for (const attr of node.attributes) {
    if (attr.type === 'mdxJsxAttribute' && attr.name === name && typeof attr.value === 'string') {
      return attr.value;
    }
  }
  return undefined;
}

/** The level a top-level node belongs to: `<Depth level>` and `<TLDR>` mark themselves. */
function levelOf(node: RootContent): DepthLevel {
  if (!isJsx(node)) return 'standard';
  if (node.name === 'TLDR') return 'quick';
  if (node.name !== 'Depth') return 'standard';
  const level = attribute(node, 'level');
  return level === 'quick' || level === 'deep' ? level : 'standard';
}

/**
 * Components that stay top-level instead of joining a `standard` group. `<Depth>` and `<TLDR>`
 * declare their own `data-depth`; `<Checkpoint>` declares none on purpose, because the checkpoint
 * has to stay on the page at every depth. Its words still count towards Standard.
 */
const UNWRAPPED = new Set(['Depth', 'TLDR', 'Checkpoint']);

/** Nodes that carry no reading weight: raw HTML, imports and expressions. */
const SKIPPED = new Set(['html', 'mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression']);

/** Words in a subtree, in the unit the locale reads in. Code counts by the line. */
export function countNodeWords(node: AnyNode, locale: Locale): number {
  if (SKIPPED.has(node.type)) return 0;
  if (node.type === 'code') return (node.value ?? '').split('\n').length * WORDS_PER_CODE_LINE;
  if (typeof node.value === 'string') return countWords(node.value, locale);
  if (!node.children) return 0;
  return node.children.reduce((total, child) => total + countNodeWords(child, locale), 0);
}

/** The locale a content file is written in: `closures.zh.mdx` is Chinese, everything else English. */
export function localeOfPath(path: string | undefined): Locale {
  return path?.includes('.zh.') ? 'zh' : 'en';
}

/** The `<div data-depth="standard">` wrapper around a run of unmarked top-level nodes. */
function standardGroup(children: RootContent[]): RootContent {
  return {
    type: 'depthGroup',
    data: { hName: 'div', hProperties: { 'data-depth': 'standard' } },
    children,
  } as unknown as RootContent;
}

export function remarkDepth() {
  return (tree: Root, file: VFile): void => {
    const locale = localeOfPath(file.path);
    const words: DepthWords = { quick: 0, standard: 0, deep: 0 };
    const grouped: RootContent[] = [];
    let run: RootContent[] = [];

    const flush = () => {
      if (run.length) grouped.push(standardGroup(run));
      run = [];
    };

    for (const node of tree.children) {
      const level = levelOf(node);
      words[level] += countNodeWords(node as AnyNode, locale);
      if (isJsx(node) && UNWRAPPED.has(node.name ?? '')) {
        flush();
        grouped.push(node);
      } else {
        run.push(node);
      }
    }
    flush();
    tree.children = grouped;

    // Cumulative: Standard includes Quick, Deep includes everything.
    const readingTime: DepthWords = {
      quick: computeReadingTime(words.quick, locale),
      standard: computeReadingTime(words.quick + words.standard, locale),
      deep: computeReadingTime(words.quick + words.standard + words.deep, locale),
    };

    const data = file.data as { astro?: { frontmatter?: Record<string, unknown> } };
    data.astro ??= {};
    data.astro.frontmatter ??= {};
    data.astro.frontmatter.words = words;
    data.astro.frontmatter.readingTime = readingTime;
  };
}
