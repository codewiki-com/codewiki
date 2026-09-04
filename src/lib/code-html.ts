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
