/**
 * Wraps every highlighted `<pre>` in the codebox figure the mockups draw: a header with the file
 * title and the Copy / Run buttons, the code itself, and an empty output slot the code runner
 * (Task 15) fills in. Runs after Astro's Shiki stage, so the `<pre>` already carries the fence meta
 * that `shiki-meta.ts` parked on it.
 *
 * ` ```text ` fences are the printed output of the fence above them, so they render as a
 * headerless output box instead.
 */
import type { Element, ElementContent, Root } from 'hast';
import { SKIP, visit } from 'unist-util-visit';

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

/** Languages that mark an output block rather than source code. */
const OUTPUT_LANGUAGES = new Set(['text', 'plaintext', 'txt']);

/** Display names for the header when a fence has no `title="…"`. */
const LANGUAGE_NAMES: Record<string, string> = {
  bash: 'Shell',
  c: 'C',
  cpp: 'C++',
  css: 'CSS',
  go: 'Go',
  html: 'HTML',
  java: 'Java',
  javascript: 'JavaScript',
  js: 'JavaScript',
  json: 'JSON',
  jsx: 'JSX',
  python: 'Python',
  rust: 'Rust',
  sh: 'Shell',
  shell: 'Shell',
  sql: 'SQL',
  toml: 'TOML',
  ts: 'TypeScript',
  tsx: 'TSX',
  typescript: 'TypeScript',
  yaml: 'YAML',
};

/** The display name for a language id, falling back to the id itself. */
export function languageLabel(lang: string): string {
  return LANGUAGE_NAMES[lang] ?? lang;
}

/** Reads a string property, ignoring the array/boolean shapes hast also allows. */
function text(node: Element, key: string): string | undefined {
  const value = node.properties[key];
  return typeof value === 'string' && value ? value : undefined;
}

function element(tagName: string, properties: Element['properties'], children: ElementContent[]): Element {
  return { type: 'element', tagName, properties, children };
}

function button(className: string[], flag: string, key: string, label: string): Element {
  // The `data-i18n` hook lets Base update legacy output while the supplied locale keeps the
  // initial, server-rendered label correct when JavaScript is unavailable.
  return element('button', { type: 'button', className, [flag]: '', 'data-i18n': key }, [
    { type: 'text', value: label },
  ]);
}

export function rehypeCodebox(options: Options = {}) {
  return (tree: Root, file: MarkdownFile = {}): void => {
    const locale = localeFor(options, file);
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === undefined) return;
      // Only code fences belong in a codebox. Earlier rehype plugins may replace their `<pre>`
      // entirely (Mermaid does), and an authored `<pre>` should remain ordinary prose.
      if (!node.children.some((child) => child.type === 'element' && child.tagName === 'code')) return;

      // Astro's own Shiki transformer writes the language as `dataLanguage`; a rehype plugin
      // upstream of us may have written the dashed form instead.
      const lang = text(node, 'data-lang') ?? text(node, 'dataLanguage') ?? text(node, 'data-language');
      if (!lang) return;

      const title = text(node, 'data-title');
      const run = Boolean(text(node, 'data-run'));

      // The figure owns the metadata from here on, so the `<pre>` does not repeat it.
      delete node.properties['data-lang'];
      delete node.properties['data-title'];
      delete node.properties['data-run'];

      if (OUTPUT_LANGUAGES.has(lang)) {
        parent.children[index] = element('figure', { className: ['codebox', 'codebox-output'] }, [node]);
        return [SKIP];
      }

      const actions: Element[] = [
        button(['act', 'act-sm'], 'data-copy', 'code.copy', t(locale, 'code.copy')),
      ];
      if (run) actions.push(button(['run'], 'data-run', 'code.run', t(locale, 'code.run')));

      const children: ElementContent[] = [
        element('div', { className: ['codehead'] }, [
          element('span', { className: ['codetitle'] }, [
            { type: 'text', value: title ?? languageLabel(lang) },
          ]),
          element('div', { className: ['codeactions'] }, actions),
        ]),
        node,
      ];
      if (run) children.push(element('div', { className: ['out'], hidden: true }, []));

      const properties: Element['properties'] = { className: ['codebox'], 'data-lang': lang };
      if (title) properties['data-title'] = title;
      if (run) properties['data-run'] = 'true';

      parent.children[index] = element('figure', properties, children);
      return [SKIP];
    });
  };
}
