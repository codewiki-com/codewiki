/**
 * The per-section Ask-AI affordance: a small ghost button after every `h2` of a topic, carrying
 * the heading's own id. The `AskAI` island (Task 16) listens for clicks on them and opens its
 * panel scoped to that section, so the prompt quotes the section the reader is actually in.
 *
 * The button is a *sibling* of the heading and never a child: `rehypeHeadingIds` reads the text of
 * every heading afterwards to build the table of contents, and `Depth.astro` reads the first
 * heading of a deep section for its teaser. Both would otherwise pick up the button's label.
 *
 * The id comes from `rehypeHeadingIds`, which Astro runs *after* the configured rehype plugins;
 * `astro.config.mjs` therefore runs it once before this one. It skips headings that already have
 * an id, so Astro's own later pass is a no-op and the ids stay the ones the anchors use.
 *
 * The label is localized while the Markdown is rendered and retains its `data-i18n` key so the
 * page shell can update legacy output too.
 */
import type { Element, Root } from 'hast';

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

/** A hast or MDX-JSX node, seen loosely enough to walk both. */
interface AnyNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: AnyNode[];
}

/** Marks the dashed row a deep section leaves behind at lower depths; it gets no action of its own. */
const TEASER = 'depth-teaser';

function askButton(section: string, label: string): Element {
  return {
    type: 'element',
    tagName: 'button',
    properties: {
      type: 'button',
      className: ['sec-ask'],
      'data-section': section,
      'data-i18n': 'ai.section',
      'aria-label': label,
    },
    children: [{ type: 'text', value: label }],
  };
}

/** True when this node is the teaser wrapper, whose children must be left alone. */
function isTeaser(node: AnyNode): boolean {
  const className = node.properties?.className;
  return Array.isArray(className) && className.includes(TEASER);
}

function walk(node: AnyNode, label: string): void {
  const children = node.children;
  if (!children || isTeaser(node)) return;

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index]!;
    walk(child, label);

    const id = child.properties?.id;
    if (child.type !== 'element' || child.tagName !== 'h2' || typeof id !== 'string' || !id) continue;

    children.splice(index + 1, 0, askButton(id, label) as unknown as AnyNode);
    index += 1;
  }
}

export function rehypeSectionActions(options: Options = {}) {
  return (tree: Root, file: MarkdownFile = {}): void => {
    walk(tree as unknown as AnyNode, t(localeFor(options, file), 'ai.section'));
  };
}
