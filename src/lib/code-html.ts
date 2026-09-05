import { createCssVariablesTheme, createHighlighter, type BundledLanguage, type Highlighter } from 'shiki';
import { languageLabel } from '@/markdown/rehype-codebox';

/** One Shiki engine is shared by every kata rendered during the static build. */
const cssVariables = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--astro-code-',
});
const highlighter = createHighlighter({ themes: [cssVariables], langs: [] });

/** Languages already requested from the shared highlighter, including in-flight loads. */
const languages = new Map<string, Promise<void>>();

function loadLanguage(engine: Highlighter, lang: string): Promise<void> {
  const pending = languages.get(lang);
  if (pending) return pending;
  const next = engine.loadLanguage(lang as BundledLanguage);
  languages.set(lang, next);
  return next;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Highlights a kata's source through the same CSS-variable theme as Markdown code fences and
 * returns the same codebox structure, without the runnable-example controls.
 */
export async function renderCode(code: string, lang: string, copyLabel: string): Promise<string> {
  const engine = await highlighter;
  await loadLanguage(engine, lang);
  const pre = engine.codeToHtml(code, { lang, theme: 'css-variables' });
  const safeLang = escapeHtml(lang);

  return `<figure class="codebox" data-lang="${safeLang}"><div class="codehead"><span class="codetitle">${escapeHtml(languageLabel(lang))}</span><div class="codeactions"><button type="button" class="act act-sm" data-copy="" data-i18n="code.copy">${escapeHtml(copyLabel)}</button></div></div>${pre}</figure>`;
}

/**
 * Shiki's `css-variables` output carries one inline `style` per token. That is the right trade on
 * a kata page, but the home page's daily card ships seven previews inside one island's props, so
 * the peek maps the five colours it needs onto one-letter classes (styled under `.daily .peek`)
 * and drops every span that only repeats the default foreground.
 */
const PEEK_TOKEN_CLASS: Record<string, string> = {
  'token-keyword': 'k',
  'token-string': 's',
  'token-string-expression': 's',
  'token-function': 'f',
  'token-comment': 'c',
  'token-constant': 'n',
};

/** A preview is clipped by its box anyway; past this column the markup is pure weight. */
const PEEK_COLUMNS = 80;

function compactPeek(html: string): string {
  return html
    .replaceAll('<span class="line">', '<span class=l>')
    .replace(/<span style="color:var\(--astro-code-([\w-]+)\)">([^<]*)<\/span>/g, (_all, token, text) => {
      const shortClass = PEEK_TOKEN_CLASS[token];
      return shortClass ? `<span class=${shortClass}>${text}</span>` : text;
    });
}

/**
 * The first `maxLines` lines of a kata, highlighted by the same engine and theme as the kata page
 * but without the header, the copy button and the per-token inline styles.
 */
export async function renderCodePeek(code: string, lang: string, maxLines: number): Promise<string> {
  const engine = await highlighter;
  await loadLanguage(engine, lang);
  const source = code
    .split('\n')
    .slice(0, maxLines)
    .map((line) => line.slice(0, PEEK_COLUMNS))
    .join('\n');
  const html = engine.codeToHtml(source, { lang, theme: 'css-variables' });
  const body = /<code[^>]*>([\s\S]*)<\/code>/.exec(html)?.[1] ?? '';
  return `<pre class=peek-code><code>${compactPeek(body)}</code></pre>`;
}
