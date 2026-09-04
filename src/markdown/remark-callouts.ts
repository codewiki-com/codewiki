/**
 * GitHub-style alerts, plus the site's own `[!PITFALL]` and `[!AI]` types:
 *
 *     > [!PITFALL]
 *     > Do not do this.
 *
 * becomes `<aside class="callout callout-pitfall" role="note" data-callout="pitfall">` with a
 * label paragraph in front of the blockquote's own content.
 *
 * The plugin is configured once for the whole site and never learns which locale a file is in, so
 * it emits the English label and tags it with a `data-i18n` key; `Base.astro` swaps the text on
 * Chinese pages from the map it injects.
 */
import type { Blockquote, Paragraph, Root } from 'mdast';
import { visit } from 'unist-util-visit';

/** Callout types and their English labels. Keys match the `callout.*` i18n keys. */
export const LABELS: Record<string, string> = {
  pitfall: 'Pitfall',
  note: 'Note',
  tip: 'Tip',
  warning: 'Warning',
  ai: 'AI tip',
};

/** `[!TYPE]` on its own at the start of the blockquote's first paragraph. */
export const MARKER = /^\[!([A-Za-z]+)\][ \t]*\r?\n?/;

/** The label line rendered above the callout body. */
function labelParagraph(type: string): Paragraph {
  return {
    type: 'paragraph',
    data: { hProperties: { className: ['callout-label'], 'data-i18n': `callout.${type}` } },
    children: [{ type: 'text', value: LABELS[type] }],
  };
}

/** Strips the `[!TYPE]` marker from the blockquote's first paragraph; returns the type, if any. */
function takeMarker(node: Blockquote): string | undefined {
  const first = node.children[0];
  if (first?.type !== 'paragraph') return undefined;

  const lead = first.children[0];
  if (lead?.type !== 'text') return undefined;

  const match = MARKER.exec(lead.value);
  const type = match?.[1].toLowerCase();
  if (!match || !type || !(type in LABELS)) return undefined;

  lead.value = lead.value.slice(match[0].length);
  // A marker on a line of its own leaves an empty paragraph behind.
  if (!lead.value) first.children.shift();
  if (first.children.length === 0) node.children.shift();
  return type;
}

export function remarkCallouts() {
  return (tree: Root): void => {
    visit(tree, 'blockquote', (node: Blockquote) => {
      const type = takeMarker(node);
      if (!type) return;

      node.data = {
        ...node.data,
        hName: 'aside',
        hProperties: {
          className: ['callout', `callout-${type}`],
          role: 'note',
          'data-callout': type,
        },
      };
      node.children.unshift(labelParagraph(type));
    });
  };
}
