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
 * The label is English and tagged with a `data-i18n` key, like every other string the markdown
 * pipeline emits: `Base.astro` swaps it on Chinese pages.
 */
import type { Element, Root } from 'hast';

/** A hast or MDX-JSX node, seen loosely enough to walk both. */
interface AnyNode {
  type: string;
  tagName?: string;
  name?: string;
  properties?: Record<string, unknown>;
  attributes?: Array<{ type: string; name: string; value?: unknown }>;
  children?: AnyNode[];
  value?: string;
}

const SECTION_LABEL = 'Ask AI about this section';
const BLOCK_LABEL = 'Ask AI about this block';

/** Marks the dashed row a deep section leaves behind at lower depths; it gets no action of its own. */
const TEASER = 'depth-teaser';

function askButton(section: string): Element {
  return {
    type: 'element',
    tagName: 'button',
    properties: {
      type: 'button',
      className: ['sec-ask'],
      'data-section': section,
      'data-i18n': 'ai.section',
      'aria-label': SECTION_LABEL,
    },
    children: [{ type: 'text', value: SECTION_LABEL }],
  };
}

/** A single trigger can advertise several presets; the island turns them into menu rows. */
function blockButton(block: string, presets: string): Element {
  return {
    type: 'element',
    tagName: 'button',
    properties: {
      type: 'button',
      className: ['ask-block'],
      'data-preset': presets,
      'data-block': block,
      'data-i18n': 'ask.block',
      'aria-label': BLOCK_LABEL,
    },
    children: [{ type: 'text', value: BLOCK_LABEL }],
  };
}

/** True when this node is the teaser wrapper, whose children must be left alone. */
function isTeaser(node: AnyNode): boolean {
  const className = node.properties?.className;
  return Array.isArray(className) && className.includes(TEASER);
}

/** Normalises the two class representations rehype nodes may carry. */
function hasClass(node: AnyNode, name: string): boolean {
  const className = node.properties?.className;
  return Array.isArray(className)
    ? className.includes(name)
    : typeof className === 'string' && className.split(/\s+/).includes(name);
}

function isCodebox(node: AnyNode): boolean {
  return node.type === 'element' && node.tagName === 'figure' && hasClass(node, 'codebox');
}

function isPitfall(node: AnyNode): boolean {
  if (node.type !== 'element' || !hasClass(node, 'callout')) return false;
  return ['data-type', 'dataType', 'data-callout', 'dataCallout'].some(
    (property) => node.properties?.[property] === 'pitfall',
  );
}

function nodeText(node: AnyNode): string {
  if (node.type === 'text') return node.value ?? '';
  return node.children?.map(nodeText).join('') ?? '';
}

function isRunnableCodebox(node: AnyNode): boolean {
  return isCodebox(node) && Boolean(node.properties?.['data-run']);
}

/** Adds a plain string prop to an authored MDX component without disturbing its expression props. */
function setMdxAttribute(node: AnyNode, name: string, value: string): void {
  node.attributes ??= [];
  const existing = node.attributes.find((attribute) => attribute.name === name);
  if (existing) existing.value = value;
  else node.attributes.push({ type: 'mdxJsxAttribute', name, value });
}

/** Gives a nudge the nearest runnable example, skipping its output box and generated action. */
function attachNudgeCode(children: AnyNode[], index: number): void {
  const nudge = children[index]!;
  if (nudge.type !== 'mdxJsxFlowElement' || nudge.name !== 'TryToBreak') return;

  for (let previous = index - 1; previous >= 0; previous -= 1) {
    const candidate = children[previous]!;
    if (!isRunnableCodebox(candidate)) continue;
    const code = candidate.children?.find((child) => child.tagName === 'pre');
    setMdxAttribute(nudge, 'data-code', code ? nodeText(code) : '');
    return;
  }
}

interface WalkState {
  nextBlock: number;
}

function walk(node: AnyNode, state: WalkState): void {
  const children = node.children;
  if (!children || isTeaser(node)) return;

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index]!;
    walk(child, state);
    attachNudgeCode(children, index);

    const id = child.properties?.id;
    if (child.type === 'element' && child.tagName === 'h2' && typeof id === 'string' && id) {
      children.splice(index + 1, 0, askButton(id) as unknown as AnyNode);
      index += 1;
      continue;
    }

    const code = isCodebox(child);
    if (!code && !isPitfall(child)) continue;

    const block = `ask-block-${state.nextBlock}`;
    state.nextBlock += 1;
    child.properties ??= {};
    child.properties['data-block'] = block;
    children.splice(
      index + 1,
      0,
      blockButton(block, code ? 'explain-code|port|tests' : 'check-pitfall') as unknown as AnyNode,
    );
    index += 1;
  }
}

export function rehypeSectionActions() {
  return (tree: Root): void => {
    walk(tree as unknown as AnyNode, { nextBlock: 1 });
  };
}
