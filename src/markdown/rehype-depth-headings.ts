/**
 * Marks every `h2`/`h3` with the depth level of the block it sits in, so the table of contents
 * (Task 13) can dim or hide the headings the current depth does not show.
 *
 * The level comes from the nearest ancestor that declares one: the `<div data-depth="standard">`
 * groups `remark-depth` inserts, or — in MDX, where JSX nodes pass through to hast untouched — a
 * `<Depth level="…">` element that has not been compiled to its `<section>` yet.
 */
import type { Root } from 'hast';

/** A hast or MDX-JSX node, seen loosely enough to walk both. */
interface AnyNode {
  type: string;
  tagName?: string;
  name?: string | null;
  properties?: Record<string, unknown>;
  attributes?: { type: string; name?: string; value?: unknown }[];
  children?: AnyNode[];
}

const HEADINGS = new Set(['h2', 'h3']);

/** The depth a node declares, if it declares one. */
function declaredDepth(node: AnyNode): string | undefined {
  const property = node.properties?.['data-depth'] ?? node.properties?.dataDepth;
  if (typeof property === 'string') return property;

  if (node.type === 'mdxJsxFlowElement' && node.name === 'Depth') {
    for (const attr of node.attributes ?? []) {
      if (attr.type === 'mdxJsxAttribute' && attr.name === 'level' && typeof attr.value === 'string') {
        return attr.value;
      }
    }
  }
  return undefined;
}

function walk(node: AnyNode, depth: string | undefined): void {
  const here = declaredDepth(node) ?? depth;
  if (node.type === 'element' && node.tagName && HEADINGS.has(node.tagName) && here) {
    node.properties ??= {};
    node.properties['data-depth'] = here;
  }
  for (const child of node.children ?? []) walk(child, here);
}

export function rehypeDepthHeadings() {
  return (tree: Root): void => {
    walk(tree as unknown as AnyNode, undefined);
  };
}
