/**
 * Gives aligned topic blocks stable, inspectable keys for the bilingual reader.
 *
 * Headings keep the ids written by `rehypeHeadingIds`; every following block starts a counter for
 * that heading, while prose before the first heading belongs to `intro`. The TL;DR is independent
 * of the heading flow and always uses `tldr`, so its three cells line up in either locale.
 *
 * Depth wrappers and MDX components are transparent to the counter. A callout is deliberately a
 * single block: cloning its child paragraphs separately would split its border and label.
 */
import type { Root } from 'hast';

interface AnyNode {
  type: string;
  tagName?: string;
  name?: string | null;
  properties?: Record<string, unknown>;
  attributes?: { type: string; name?: string; value?: unknown }[];
  children?: AnyNode[];
}

interface Counter {
  section: string;
  index: number;
  tldr: number;
}

const BLOCKS = new Set(['p', 'pre', 'ul', 'ol', 'blockquote', 'table']);
const HEADINGS = new Set(['h2', 'h3']);

function classes(node: AnyNode): string[] {
  const value = node.properties?.className;
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  return typeof value === 'string' ? value.split(/\s+/) : [];
}

function hasClass(node: AnyNode, name: string): boolean {
  return classes(node).includes(name);
}

function isTldr(node: AnyNode): boolean {
  return (node.type === 'mdxJsxFlowElement' && node.name === 'TLDR') || hasClass(node, 'tldr');
}

function isTldrCell(node: AnyNode): boolean {
  return (node.type === 'mdxJsxFlowElement' && node.name === 'TLDRCell') || hasClass(node, 'tldr-cell');
}

function isBlock(node: AnyNode): boolean {
  if (node.type !== 'element' || !node.tagName) return false;
  if (BLOCKS.has(node.tagName)) return true;
  if (hasClass(node, 'callout')) return true;
  return node.tagName === 'figure' && (hasClass(node, 'codebox') || hasClass(node, 'diagram'));
}

function mark(node: AnyNode, id: string): void {
  node.properties ??= {};
  node.properties['data-bi'] = id;
}

/** Marks only the prose inside TL;DR cells, not the component or cell wrappers. */
function markTldr(node: AnyNode, state: Counter, inCell = false): void {
  const cell = inCell || isTldrCell(node);
  if (cell && node.type === 'element' && node.tagName === 'p') {
    state.tldr += 1;
    mark(node, `tldr:${state.tldr}`);
    return;
  }
  for (const child of node.children ?? []) markTldr(child, state, cell);
}

/** Walks transparent wrappers in document order while keeping one section counter. */
function walk(node: AnyNode, state: Counter): void {
  for (const child of node.children ?? []) {
    if (isTldr(child)) {
      markTldr(child, state);
      continue;
    }

    if (child.type === 'element' && child.tagName && HEADINGS.has(child.tagName)) {
      const id = child.properties?.id;
      if (typeof id === 'string' && id) {
        state.section = id;
        state.index = 0;
      }
      continue;
    }

    if (isBlock(child)) {
      state.index += 1;
      mark(child, `${state.section}:${state.index}`);
      continue;
    }

    walk(child, state);
  }
}

export function rehypeBlockIds() {
  return (tree: Root): void => {
    walk(tree as unknown as AnyNode, { section: 'intro', index: 0, tldr: 0 });
  };
}
