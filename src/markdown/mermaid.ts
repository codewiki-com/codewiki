/**
 * Renders Mermaid fences to inline SVG during the Markdown build, then gives each diagram the
 * semantic figure the topic page needs. The SVG remains in the document so the runtime stylesheet
 * can resolve its colours from the active light or dark token palette without client JavaScript.
 */
import { pathToFileURL } from 'node:url';
import type { Element, Root } from 'hast';
import { toString } from 'hast-util-to-string';
import rehypeMermaid, { type RehypeMermaidOptions } from 'rehype-mermaid';
import type { Processor } from 'unified';
import { SKIP, visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

const options: RehypeMermaidOptions = {
  strategy: 'inline-svg',
  mermaidConfig: {
    theme: 'base',
    fontFamily: 'IBM Plex Sans, Noto Sans SC, sans-serif',
    themeVariables: { fontSize: '14px' },
  },
  css: [pathToFileURL('node_modules/@fontsource/ibm-plex-sans/400.css')],
};

// MDX transforms run concurrently. Each diagram-bearing document opens a Chromium page;
// hundreds of those exhaust a standard CI runner, even when Node's heap is bounded.
// Share two slots across processor instances and hand released slots directly to queued work.
let activeRenders = 0;
const renderQueue: Array<() => void> = [];

async function withRenderSlot(render: () => Promise<unknown>): Promise<void> {
  if (activeRenders < 2) activeRenders += 1;
  else await new Promise<void>((resolve) => renderQueue.push(resolve));

  try {
    await render();
  } finally {
    const next = renderQueue.shift();
    if (next) next();
    else activeRenders -= 1;
  }
}

/** Whether an element carries the class emitted for an unhighlighted Mermaid fence. */
function isMermaidCode(node: Element): boolean {
  const classes = node.properties.className;
  return (
    node.tagName === 'code' &&
    (Array.isArray(classes) ? classes.includes('language-mermaid') : classes === 'language-mermaid')
  );
}

/** The first authored line is a compact useful name for a diagram without a separate caption. */
function diagramLabel(code: Element): string {
  return toString(code).trim().split(/\r?\n/, 1)[0] || 'Mermaid diagram';
}

/**
 * Mermaid lays out its viewBox at 14px. Preserve that intrinsic size instead of letting its emitted
 * `width="100%"` upscale a narrow diagram. The proportional floor still lets a wide SVG shrink on a
 * phone until its labels reach 12px, then the figure scrolls instead of making them illegible.
 */
function setIntrinsicSize(svg: Element): void {
  const viewBox = svg.properties.viewBox;
  if (typeof viewBox !== 'string') return;
  const [, , widthValue, heightValue] = viewBox.trim().split(/\s+/);
  const width = Number(widthValue);
  const height = Number(heightValue);
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) return;

  svg.properties.width = width;
  svg.properties.height = height;
  const style = typeof svg.properties.style === 'string' ? svg.properties.style.replace(/;?$/, ';') : '';
  svg.properties.style = `${style}--diagram-min-width:${Math.ceil((width * 12) / 14)}px`;
}

/** Unified plugin factory used by both Markdown and MDX through Astro's shared processor config. */
export function rehypeMermaidDiagrams(this: Processor) {
  const renderMermaid = rehypeMermaid.call(this, options) as unknown as (
    tree: Root,
    file: VFile,
  ) => Promise<Root | undefined | void> | Root | undefined | void;

  return async (tree: Root, file: VFile): Promise<void> => {
    let hasDiagrams = false;
    // Put the semantic wrapper in place before rendering. `rehype-mermaid` then replaces only the
    // nested `<pre>`, which keeps the source and its accessible name paired without relying on IDs.
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || index === undefined || !parent) return;
      const code = node.children.find(
        (child): child is Element => child.type === 'element' && isMermaidCode(child),
      );
      if (!code) return;
      hasDiagrams = true;

      parent.children[index] = {
        type: 'element',
        tagName: 'figure',
        properties: {
          className: ['diagram'],
          role: 'img',
          ariaLabel: diagramLabel(code),
          'data-diagram': '',
        },
        children: [node],
      };
      return [SKIP];
    });

    if (!hasDiagrams) return;
    await withRenderSlot(async () => renderMermaid(tree, file));

    // This hook distinguishes generated inline SVGs from any authored SVG a topic may contain.
    visit(tree, 'element', (node, _index, parent) => {
      if (
        node.tagName === 'svg' &&
        parent?.type === 'element' &&
        parent.tagName === 'figure' &&
        Array.isArray(parent.properties.className) &&
        parent.properties.className.includes('diagram')
      ) {
        node.properties['data-diagram'] = '';
        setIntrinsicSize(node);
      }
    });
  };
}
