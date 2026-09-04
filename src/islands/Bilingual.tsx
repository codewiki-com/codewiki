import { useEffect } from 'preact/hooks';

import {
  BILINGUAL_EVENT,
  layoutFor,
  pairAlignedBlocks,
  shouldClone,
  type BilingualOrder,
} from '@/lib/bilingual';
import {
  DEFAULT_PREFS,
  KEYS,
  readStore,
  writeStore,
  type BilingualLayout,
  type BilingualMode,
  type Prefs,
} from '@/lib/prefs';
import type { Locale } from '@/lib/urls';

export interface BilingualProps {
  alternateUrl: string;
  locale: Locale;
  labels: {
    notAligned: string;
  };
  /** Markdown chrome in the fetched page has not run Base.astro's localisation script. */
  alternateStrings: Record<string, string>;
}

interface Heading {
  id: string;
  text: string;
}

interface AlternatePage {
  blocks: Map<string, string>;
  headings: Heading[];
  terms: Map<string, string>[];
  signature?: string;
}

const pageCache = new Map<string, Promise<AlternatePage>>();

function headingsIn(root: ParentNode): Heading[] {
  return [...root.querySelectorAll<HTMLElement>('h2[id], h3[id]')].map((heading) => ({
    id: heading.id,
    text: heading.textContent?.trim() ?? '',
  }));
}

/** One term map per h2/h3, following the aligned document order used for block keys. */
function termsByHeading(root: ParentNode, ignoreClones = false): Map<string, string>[] {
  const sections: Map<string, string>[] = [];
  let current: Map<string, string> | undefined;
  for (const node of root.querySelectorAll<HTMLElement>('h2[id], h3[id], a.term[data-term]')) {
    if (node.matches('h2[id], h3[id]')) {
      current = new Map();
      sections.push(current);
      continue;
    }
    if (ignoreClones && node.closest('[data-bi-clone]')) continue;
    const id = node.dataset.term;
    const text = node.textContent?.trim();
    if (current && id && text && !current.has(id)) current.set(id, text);
  }
  return sections;
}

async function fetchAlternate(path: string): Promise<AlternatePage> {
  const url = new URL(path, location.href);
  if (url.origin !== location.origin) throw new Error('The bilingual alternate must be same-origin');

  let pending = pageCache.get(url.href);
  if (!pending) {
    pending = fetch(url.href).then(async (response) => {
      if (!response.ok) throw new Error(`The bilingual alternate returned ${response.status}`);
      const parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
      const article = parsed.getElementById('article');
      if (!article) throw new Error('The bilingual alternate has no article');
      return {
        blocks: new Map(
          [...article.querySelectorAll<HTMLElement>('[data-bi]')]
            .map((block) => [block.dataset.bi, block.outerHTML] as const)
            .filter((entry): entry is readonly [string, string] => Boolean(entry[0])),
        ),
        headings: headingsIn(article),
        terms: termsByHeading(article),
        signature: article.dataset.biSig,
      };
    });
    pageCache.set(url.href, pending);
  }
  return pending;
}

function blockKind(block: HTMLElement): string {
  const tag = block.tagName.toLowerCase();
  if (tag !== 'figure') return tag;
  if (block.classList.contains('codebox')) return 'figure.codebox';
  if (block.classList.contains('diagram')) return 'figure.diagram';
  return tag;
}

function splitBlockId(id: string): { section: string; item: string } | undefined {
  const separator = id.lastIndexOf(':');
  if (separator < 1 || separator === id.length - 1) return undefined;
  return { section: id.slice(0, separator), item: id.slice(separator + 1) };
}

/**
 * Heading slugs are naturally translated. Aligned topics promise the same heading order, so the
 * alternate map gets local aliases while its published `data-bi` values remain untouched.
 */
function mapToLocalHeadings(article: HTMLElement, alternate: AlternatePage): Map<string, string> {
  const blocks = new Map(alternate.blocks);
  const local = headingsIn(article);
  const sectionAliases = new Map<string, string>();
  for (const [index, heading] of alternate.headings.entries()) {
    const localHeading = local[index];
    if (localHeading) sectionAliases.set(heading.id, localHeading.id);
  }

  for (const [id, html] of alternate.blocks) {
    const parts = splitBlockId(id);
    if (!parts || parts.section === 'intro' || parts.section === 'tldr') continue;
    const localSection = sectionAliases.get(parts.section);
    if (localSection) blocks.set(`${localSection}:${parts.item}`, html);
  }
  return blocks;
}

function cloneBlock(html: string, lang: string, strings: Record<string, string>): HTMLElement | null {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  const clone = template.content.firstElementChild as HTMLElement | null;
  if (!clone) return null;

  // The original page owns every id. A translated copy must not create a second anchor target.
  if (clone.id) clone.removeAttribute('id');
  for (const child of clone.querySelectorAll('[id]')) child.removeAttribute('id');

  for (const node of [clone, ...clone.querySelectorAll<HTMLElement>('[data-i18n]')]) {
    const key = node.dataset.i18n;
    const label = key ? strings[key] : undefined;
    if (!label) continue;
    node.textContent = label;
    if (node.hasAttribute('aria-label')) node.setAttribute('aria-label', label);
  }

  clone.classList.remove('bi', 'bi-source');
  clone.setAttribute('lang', lang);
  clone.setAttribute('data-bi-clone', '');
  return clone;
}

const CALLOUT_CHROME = 'figure, pre, button, .codeactions, .ask-block, .sec-ask, .out';

/** Builds one translated prose group for insertion into the existing callout box. */
function cloneCalloutText(html: string, lang: string, strings: Record<string, string>): HTMLElement | null {
  const callout = cloneBlock(html, lang, strings);
  if (!callout?.classList.contains('callout')) return null;

  const group = document.createElement('div');
  group.className = 'bi-callout';
  group.lang = lang;
  group.setAttribute('data-bi-clone', '');

  for (const child of [...callout.children]) {
    if (child.matches(CALLOUT_CHROME)) continue;
    for (const chrome of child.querySelectorAll(CALLOUT_CHROME)) chrome.remove();
    if (!child.textContent?.trim()) continue;
    child.removeAttribute('data-bi-clone');
    child.removeAttribute('lang');
    group.append(child);
  }
  return group.childElementCount ? group : null;
}

function clearBilingual(article: HTMLElement): void {
  for (const pair of article.querySelectorAll<HTMLElement>('[data-bi-pair]')) {
    const source = pair.querySelector<HTMLElement>(':scope > [data-bi-source]');
    if (source) {
      source.classList.remove('bi', 'bi-source');
      source.removeAttribute('data-bi-source');
      pair.replaceWith(source);
    } else {
      pair.remove();
    }
  }
  for (const clone of article.querySelectorAll('[data-bi-clone]')) clone.remove();
  for (const source of article.querySelectorAll<HTMLElement>('[data-bi-source]')) {
    source.classList.remove('bi', 'bi-source');
    source.removeAttribute('data-bi-source');
  }
  for (const source of article.querySelectorAll<HTMLElement>('.callout > .bi')) {
    source.classList.remove('bi');
  }
  for (const heading of article.querySelectorAll<HTMLElement>('h2[data-bi-h], h3[data-bi-h]')) {
    heading.querySelector(':scope > .bi-h')?.remove();
    heading.removeAttribute('data-bi-h');
    heading.removeAttribute('data-bi-alt-first');
  }
  for (const vocab of article.querySelectorAll('[data-bi-vocab]')) vocab.remove();
  article.removeAttribute('data-bilingual-missing');
  article.removeAttribute('data-bilingual-order');
}

function addHeadingSubtitles(
  article: HTMLElement,
  alternate: AlternatePage,
  lang: string,
  locale: Locale,
  order: BilingualOrder,
): void {
  const local = [...article.querySelectorAll<HTMLElement>('h2[id], h3[id]')];
  const alternateFirst = order[0] !== locale;
  for (const [index, heading] of local.entries()) {
    const text = alternate.headings[index]?.text;
    if (!text) continue;
    heading.dataset.biH = text;
    const subtitle = document.createElement('span');
    subtitle.className = 'bi-h';
    subtitle.lang = lang;
    heading.toggleAttribute('data-bi-alt-first', alternateFirst);
    // Whitespace stays inside the removable subtitle, so repeated mode changes leave no debris.
    subtitle.textContent = alternateFirst ? `${text} ` : ` ${text}`;
    if (alternateFirst) heading.prepend(subtitle);
    else heading.append(subtitle);
  }
}

function addVocabulary(
  article: HTMLElement,
  alternate: AlternatePage,
  locale: Locale,
  order: BilingualOrder,
): void {
  const headings = [...article.querySelectorAll<HTMLElement>('h2[id], h3[id]')];
  const localTerms = termsByHeading(article, true);
  for (const [index, heading] of headings.entries()) {
    const mine = localTerms[index] ?? new Map();
    const theirs = alternate.terms[index] ?? new Map();
    const ids = [...new Set([...mine.keys(), ...theirs.keys()])];
    if (ids.length === 0) continue;

    const row = document.createElement('div');
    row.className = 'vocab bi-vocab';
    row.setAttribute('data-bi-vocab', '');
    for (const id of ids) {
      const en = locale === 'en' ? mine.get(id) : theirs.get(id);
      const zh = locale === 'zh' ? mine.get(id) : theirs.get(id);
      if (!en && !zh) continue;
      const item = document.createElement('span');
      item.className = 'bi-vocab-term';
      const labels = { en, zh };
      for (const language of order) {
        const text = labels[language];
        if (!text) continue;
        const label = document.createElement('span');
        if (language === 'zh') label.className = 'zh';
        label.lang = language === 'zh' ? 'zh-Hans' : 'en';
        label.textContent = text;
        item.append(label);
      }
      row.append(item);
    }
    if (row.childElementCount) heading.insertAdjacentElement('afterend', row);
  }
}

function applyBlocks(
  article: HTMLElement,
  alternate: AlternatePage,
  mode: Exclude<BilingualMode, 'off'>,
  locale: Locale,
  strings: Record<string, string>,
): void {
  const sources = [...article.querySelectorAll<HTMLElement>('[data-bi]')].filter(
    (block) => !block.closest('[data-bi-clone]'),
  );
  const byId = new Map(
    sources.flatMap((block) => (block.dataset.bi ? [[block.dataset.bi, block] as const] : [])),
  );
  const paired = pairAlignedBlocks(
    [...byId.keys()],
    mapToLocalHeadings(article, alternate),
    article.dataset.biSig,
    alternate.signature,
  );
  if (!paired) throw new Error('bilingual structure mismatch');
  const alternateLang = locale === 'en' ? 'zh-Hans' : 'en';
  const order: BilingualOrder = mode === 'en-zh' ? ['en', 'zh'] : ['zh', 'en'];
  const sourceFirst = locale === order[0];
  article.dataset.bilingualOrder = mode;

  for (const [id, html] of paired.pairs) {
    const source = byId.get(id);
    if (!source || !shouldClone(id, blockKind(source))) continue;

    if (source.classList.contains('callout')) {
      const clone = cloneCalloutText(html, alternateLang, strings);
      if (!clone) continue;
      const sourceText = [...source.children].filter(
        (child) => !child.matches(CALLOUT_CHROME) && Boolean(child.textContent?.trim()),
      );
      if (sourceFirst) {
        clone.classList.add('bi');
        source.append(clone);
      } else {
        for (const child of sourceText) {
          child.classList.add('bi');
        }
        source.prepend(clone);
      }
      continue;
    }

    const clone = cloneBlock(html, alternateLang, strings);
    if (!clone) continue;

    const pair = document.createElement('div');
    pair.className = 'bi-pair';
    pair.setAttribute('data-bi-pair', id);
    source.before(pair);
    source.classList.add('bi-source');
    source.setAttribute('data-bi-source', '');
    if (sourceFirst) {
      clone.classList.add('bi');
      pair.append(source, clone);
    } else {
      source.classList.add('bi');
      pair.append(clone, source);
    }
  }

  if (paired.missing.length) article.dataset.bilingualMissing = String(paired.missing.length);
  addHeadingSubtitles(article, alternate, alternateLang, locale, order);
  addVocabulary(article, alternate, locale, order);
}

function paint(group: HTMLElement | null, value: string): void {
  if (!group) return;
  for (const button of group.querySelectorAll<HTMLButtonElement>('button[data-value]')) {
    const on = button.dataset.value === value;
    button.classList.toggle('on', on);
    button.setAttribute('aria-checked', String(on));
    button.tabIndex = on ? 0 : -1;
  }
}

function wireGroup(group: HTMLElement | null, select: (value: string) => void): () => void {
  if (!group) return () => {};
  const buttons = [...group.querySelectorAll<HTMLButtonElement>('button[data-value]')];
  for (const button of buttons) button.disabled = false;

  const onClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const value = target.closest<HTMLButtonElement>('button[data-value]')?.dataset.value;
    if (value) select(value);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const current = buttons.findIndex((button) => button.getAttribute('aria-checked') === 'true');
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : event.key === 'Home'
            ? -current
            : event.key === 'End'
              ? buttons.length - 1 - current
              : 0;
    if (step === 0 || current < 0) return;
    event.preventDefault();
    const next = (current + step + buttons.length) % buttons.length;
    const button = buttons[next];
    if (!button?.dataset.value) return;
    select(button.dataset.value);
    button.focus();
  };
  group.addEventListener('click', onClick);
  group.addEventListener('keydown', onKeyDown);
  return () => {
    group.removeEventListener('click', onClick);
    group.removeEventListener('keydown', onKeyDown);
  };
}

/**
 * Client-only bilingual controller. Topic.astro owns the progressively enhanced controls and
 * article; this island fetches the alternate static page once and patches aligned copies into it.
 */
export default function Bilingual({ alternateUrl, locale, labels, alternateStrings }: BilingualProps) {
  useEffect(() => {
    const article = document.getElementById('article');
    const modeControl = document.querySelector<HTMLElement>('[data-bilingual-control]');
    const layoutControl = document.querySelector<HTMLElement>('[data-bilingual-layout-control]');
    if (!article || !modeControl) return;

    const stored = readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS);
    let mode: BilingualMode = stored.bilingual;
    let layout: BilingualLayout = stored.bilingualLayout ?? 'paired';
    let revision = 0;

    const persist = (next: Partial<Prefs>) => {
      writeStore<Prefs>(KEYS.prefs, { ...readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS), ...next });
    };
    const applyLayout = () => {
      article.dataset.bilingualLayout = layoutFor(innerWidth, layout);
      paint(layoutControl, layout);
    };
    const notify = () =>
      document.dispatchEvent(new CustomEvent<BilingualMode>(BILINGUAL_EVENT, { detail: mode }));

    const selectMode = async (next: BilingualMode, save = true) => {
      mode = next;
      const run = ++revision;
      paint(modeControl, next);
      article.dataset.bilingual = next;
      modeControl.setAttribute('aria-busy', String(next !== 'off'));
      if (save) persist({ bilingual: next });

      clearBilingual(article);
      if (next === 'off') {
        modeControl.setAttribute('aria-busy', 'false');
        notify();
        return;
      }

      try {
        const alternate = await fetchAlternate(alternateUrl);
        if (run !== revision) return;
        applyBlocks(article, alternate, next, locale, alternateStrings);
        modeControl.removeAttribute('title');
        notify();
      } catch {
        if (run !== revision) return;
        mode = 'off';
        article.dataset.bilingual = 'off';
        modeControl.title = labels.notAligned;
        paint(modeControl, mode);
        persist({ bilingual: 'off' });
        notify();
      } finally {
        if (run === revision) modeControl.setAttribute('aria-busy', 'false');
      }
    };

    const removeMode = wireGroup(modeControl, (value) => {
      if (value === 'off' || value === 'en-zh' || value === 'zh-en') void selectMode(value);
    });
    const removeLayout = wireGroup(layoutControl, (value) => {
      if (value !== 'paired' && value !== 'side') return;
      layout = value;
      persist({ bilingualLayout: value });
      applyLayout();
    });
    const wide = matchMedia('(min-width: 1440px)');
    wide.addEventListener('change', applyLayout);

    applyLayout();
    void selectMode(mode, false);

    return () => {
      revision += 1;
      wide.removeEventListener('change', applyLayout);
      removeMode();
      removeLayout();
      clearBilingual(article);
    };
  }, [alternateStrings, alternateUrl, labels.notAligned, locale]);

  return null;
}
