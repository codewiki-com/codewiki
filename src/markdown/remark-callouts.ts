/**
 * GitHub-style alerts, plus the site's own `[!PITFALL]` and `[!AI]` types:
 *
 *     > [!PITFALL]
 *     > Do not do this.
 *
 * becomes `<aside class="callout callout-pitfall" role="note" data-callout="pitfall">` with a
 * label paragraph in front of the blockquote's own content.
 *
 * The label is localized when a caller supplies a locale and keeps a `data-i18n` key so the page
 * shell can update legacy output too.
 */
import type { Blockquote, Paragraph, Root } from 'mdast';
import { visit } from 'unist-util-visit';

import { t } from '@/i18n';
import type { Locale } from '@/lib/urls';

interface Options {
  locale?: Locale;
}

interface MarkdownFile {
  path?: string;
}

function localeFor(options: Options, file: MarkdownFile): Locale {
  return options.locale ?? (/\.zh\.mdx?$/u.test(file.path ?? '') ? 'zh' : 'en');
}

/** Supported callout types. Values match the `callout.*` i18n keys. */
const CALLOUT_TYPES = ['pitfall', 'note', 'tip', 'warning', 'ai'] as const;
type CalloutType = (typeof CALLOUT_TYPES)[number];
const CALLOUT_TYPE_SET = new Set<string>(CALLOUT_TYPES);

/** `[!TYPE]` on its own at the start of the blockquote's first paragraph. */
const MARKER = /^\[!([A-Za-z]+)\][ \t]*\r?\n?/;

/** The label line rendered above the callout body. */
function labelParagraph(type: CalloutType, locale: Locale): Paragraph {
  return {
    type: 'paragraph',
    data: { hProperties: { className: ['callout-label'], 'data-i18n': `callout.${type}` } },
    children: [{ type: 'text', value: t(locale, `callout.${type}`) }],
  };
}

/** Strips the `[!TYPE]` marker from the blockquote's first paragraph; returns the type, if any. */
function takeMarker(node: Blockquote): CalloutType | undefined {
  const first = node.children[0];
  if (first?.type !== 'paragraph') return undefined;

  const lead = first.children[0];
  if (lead?.type !== 'text') return undefined;

  const match = MARKER.exec(lead.value);
  const type = match?.[1].toLowerCase();
  if (!match || !type || !CALLOUT_TYPE_SET.has(type)) return undefined;

  lead.value = lead.value.slice(match[0].length);
  // A marker on a line of its own leaves an empty paragraph behind.
  if (!lead.value) first.children.shift();
  if (first.children.length === 0) node.children.shift();
  return type as CalloutType;
}

export function remarkCallouts(options: Options = {}) {
  return (tree: Root, file: MarkdownFile = {}): void => {
    const locale = localeFor(options, file);
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
      node.children.unshift(labelParagraph(type, locale));
    });
  };
}
