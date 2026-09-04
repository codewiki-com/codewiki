import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { PAGE_PRESETS, PRESETS, buildPrompt, deepLinks, type Preset } from '@/lib/prompts';
import type { Locale } from '@/lib/urls';

export interface AskAILabels {
  /** The trigger in the action row, e.g. "Ask your AI about this page". */
  open: string;
  /** Accessible name of the panel. */
  title: string;
  /** One label per preset, in the reader's language. */
  presets: Record<Preset, string>;
  claude: string;
  chatgpt: string;
  copy: string;
  copied: string;
  copyFailed: string;
  close: string;
  /** Scope line when the prompt carries the whole page. */
  scopePage: string;
  /** Scope line when it carries one section; `{section}` is the heading. */
  scopeSection: string;
}

export interface AskAIContext {
  locale: Locale;
  /** Topic title, quoted in the prompt's first line. */
  title: string;
  /** Canonical URL of this page. */
  url: string;
  /** The language the examples are written in, e.g. `Python`. */
  language: string;
  /** What this topic assumes the reader knows; the "explain simpler" preset builds on it. */
  prerequisite?: string;
  /** Fixed scope text for non-article surfaces such as a kata's code sample. */
  sectionText?: string;
  /** Optional heading for fixed scope text. */
  section?: string;
  /** Port targets, selected from the language-track registry by the topic shell. */
  languages?: Array<{ value: string; label: string }>;
}

export interface AskAIProps {
  labels: AskAILabels;
  context: AskAIContext;
  /** Limits a focused surface to one preset; topic pages continue to show all six. */
  preset?: Preset;
}

/** What the reader is asking about: a section heading (empty for the whole page) and its text. */
interface Scope {
  section: string;
  text: string;
  presets: readonly Preset[];
}

/** Page furniture that is not the text: the ask buttons themselves, code headers, teasers. */
const FURNITURE = '.sec-ask, .ask-block, .codehead, .depth-teaser, [data-copy], [data-run]';

/** Elements that end a line of prose when their content is collected. */
const BLOCKS = new Set([
  'P',
  'LI',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'PRE',
  'BLOCKQUOTE',
  'ASIDE',
  'FIGURE',
  'SECTION',
  'DIV',
  'TABLE',
  'TR',
]);

/** Long enough for any section of any topic; a whole deep page is cut rather than sent whole. */
const TEXT_LIMIT = 12_000;

/** True when the depth dial (or anything else) is currently hiding this element. */
function hidden(node: Element): boolean {
  return node.getClientRects().length === 0;
}

/**
 * The reader's own view of the article, in document order: everything after `from` and before
 * `to`, minus the furniture and minus whatever the current depth hides. Walking the live DOM
 * rather than a cloned range is what makes that last part possible.
 */
function collect(root: Element, from: Element | null, to: Element | null): string {
  const parts: string[] = [];
  let started = from === null;

  /** Returns false once `to` is reached, which unwinds the walk. */
  const walk = (node: Node): boolean => {
    if (node === to) return false;

    if (node.nodeType === Node.TEXT_NODE) {
      if (started) parts.push(node.nodeValue ?? '');
      return true;
    }
    if (!(node instanceof Element)) return true;

    // The heading the scope starts at is the scope's name, not part of its text.
    if (node === from) {
      started = true;
      return true;
    }
    if (started && (node.matches(FURNITURE) || hidden(node))) return true;
    // Code keeps its own line breaks, so it is taken whole rather than walked.
    if (started && node.tagName === 'PRE') {
      parts.push(`\n\n${node.textContent ?? ''}\n\n`);
      return true;
    }

    for (const child of node.childNodes) if (!walk(child)) return false;
    if (started && BLOCKS.has(node.tagName)) parts.push('\n\n');
    return true;
  };

  walk(root);

  const text = parts
    .join('')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text.length > TEXT_LIMIT ? `${text.slice(0, TEXT_LIMIT)} […]` : text;
}

/** The scope one `h2` opens: from that heading to the next one. */
function sectionScope(heading: HTMLElement, presets: readonly Preset[]): Scope {
  const article = heading.closest('#article') ?? document.body;
  const headings = [...article.querySelectorAll('h2')];
  const next = headings[headings.indexOf(heading as HTMLHeadingElement) + 1] ?? null;
  return { section: (heading.textContent ?? '').trim(), text: collect(article, heading, next), presets };
}

/** The scope the action row opens: the whole article, at the depth the reader is reading it. */
function pageScope(presets: readonly Preset[]): Scope {
  const article = document.getElementById('article');
  return { section: '', text: article ? collect(article, null, null) : '', presets };
}

/** The exact code or pitfall text named by a generated block button. */
function blockScope(button: HTMLElement): Scope | null {
  const block = button.dataset.block;
  if (!block) return null;

  const target = [...document.querySelectorAll<HTMLElement>('[data-block]')].find(
    (candidate) => candidate !== button && candidate.dataset.block === block,
  );
  if (!target) return null;

  const presets = (button.dataset.preset ?? '')
    .split('|')
    .filter((value): value is Preset => PRESETS.includes(value as Preset));
  if (presets.length === 0) return null;

  const isCode = target.matches('figure.codebox');
  const text = isCode
    ? (target.querySelector('pre code')?.textContent ?? target.querySelector('pre')?.textContent ?? '')
    : (target.textContent ?? '');
  const section = isCode
    ? (target.querySelector('.codetitle')?.textContent ?? '').trim()
    : (target.querySelector('.callout-label')?.textContent ?? '').trim();
  return { section, text: text.trim(), presets };
}

/**
 * The Ask-AI panel — spec §14.2 and the "ask your ai" band of the mockups.
 *
 * Page, section and block presets can open Claude, open ChatGPT, or land on the clipboard. Every
 * one quotes its scope verbatim, so the assistant answers about what the reader is looking at
 * rather than about the subject in general. Nothing is sent anywhere by this island: the deep
 * links are ordinary links the reader follows, and the copy goes to their own clipboard.
 *
 * The panel serves two triggers: the action-row button, which scopes it to the page, and the
 * `.sec-ask` / `.ask-block` buttons the markdown pipeline writes into the article. Those live
 * outside the island's component tree, so they are reached by delegation.
 */
export default function AskAI({ labels, context, preset }: AskAIProps) {
  const [scope, setScope] = useState<Scope | null>(null);
  const [copied, setCopied] = useState<{ preset: Preset; ok: boolean } | null>(null);
  const [targetLanguage, setTargetLanguage] = useState(
    () => context.languages?.find((track) => track.value !== context.language)?.value ?? context.language,
  );
  const [userCode, setUserCode] = useState('');
  const [ready, setReady] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  /** What had focus before the panel opened; closing gives it back. */
  const opener = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    // Focus goes back to whatever opened the panel only if it is still inside it: a click
    // somewhere else on the page has already put the reader where they wanted to be.
    const inside = panel.current?.contains(document.activeElement);
    setScope(null);
    setCopied(null);
    setUserCode('');
    if (inside) opener.current?.focus();
  }, []);

  const openWith = useCallback((next: Scope, from: HTMLElement | null) => {
    opener.current = from;
    setCopied(null);
    setScope(next);
  }, []);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    /* The section buttons are rendered by `rehype-section-actions` inside the article, so this
       island never sees them as children; one delegated listener serves all of them. */
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLElement>('.sec-ask, .ask-block');
      if (!button) return;

      if (button.matches('.ask-block')) {
        const next = blockScope(button);
        if (next) openWith(next, button);
        return;
      }

      const heading = document.getElementById(button.dataset.section ?? '');
      if (heading) openWith(sectionScope(heading, preset ? [preset] : PAGE_PRESETS), button);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [openWith, preset]);

  useEffect(() => {
    /** Cheatsheet rows are server-rendered buttons. Their event supplies the exact row as scope. */
    const onAsk = (event: Event) => {
      if (!(event instanceof CustomEvent) || typeof event.detail?.text !== 'string') return;
      const from = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      openWith({ section: '', text: event.detail.text, presets: preset ? [preset] : PAGE_PRESETS }, from);
    };
    document.addEventListener('cw:ask', onAsk);
    return () => document.removeEventListener('cw:ask', onAsk);
  }, [openWith, preset]);

  useEffect(() => {
    if (!scope) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    // A click anywhere else is a dismissal, as it is for every other popover on the site.
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panel.current?.contains(target) || trigger.current?.contains(target)) return;
      if (target instanceof Element && target.closest('.sec-ask, .ask-block')) return;
      close();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClick);
    panel.current?.querySelector<HTMLElement>('a, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClick);
    };
  }, [scope, close]);

  /** One prompt per available preset, built from the scope the panel was opened with. */
  const rows = useMemo(() => {
    const available = scope?.presets ?? (preset ? [preset] : PAGE_PRESETS);
    return available.map((rowPreset) => {
      const prompt = buildPrompt({
        preset: rowPreset,
        locale: context.locale,
        title: context.title,
        url: context.url,
        section: scope?.section ?? '',
        sectionText: scope?.text ?? '',
        language: context.language,
        targetLanguage,
        userCode,
        prerequisite: context.prerequisite,
      });
      return { preset: rowPreset, prompt, links: deepLinks(prompt) };
    });
  }, [scope, context, preset, targetLanguage, userCode]);

  const openScope = (): Scope =>
    context.sectionText === undefined
      ? pageScope(preset ? [preset] : PAGE_PRESETS)
      : {
          section: context.section ?? '',
          text: context.sectionText,
          presets: preset ? [preset] : PAGE_PRESETS,
        };

  const copy = (prompt: string, preset: Preset) => {
    // An insecure origin has no clipboard at all, and a denied permission rejects the write.
    // Both mean the same thing to the reader: it did not land, so say so rather than look busy.
    const clipboard = navigator.clipboard as Clipboard | undefined;
    if (!clipboard) {
      setCopied({ preset, ok: false });
      return;
    }
    clipboard
      .writeText(prompt)
      .then(() => setCopied({ preset, ok: true }))
      .catch(() => setCopied({ preset, ok: false }));
  };

  const copyLabel = (preset: Preset): string => {
    if (copied?.preset !== preset) return labels.copy;
    return copied.ok ? labels.copied : labels.copyFailed;
  };

  const scopeLine = scope?.section
    ? labels.scopeSection.replace('{section}', scope.section)
    : labels.scopePage;

  return (
    <div class="ask">
      <button
        type="button"
        class="act ask-open"
        ref={trigger}
        data-ask-ai
        data-ready={String(ready)}
        aria-expanded={scope !== null}
        aria-haspopup="dialog"
        onClick={() => (scope ? close() : openWith(openScope(), trigger.current))}
      >
        {labels.open}
      </button>

      {scope && (
        <div class="panel ask-panel" role="dialog" aria-label={labels.title} ref={panel}>
          <div class="ask-head">
            <span class="lbl">{scopeLine}</span>
            <button type="button" class="link ask-close" onClick={close}>
              {labels.close}
            </button>
          </div>

          <ul class="ask-list">
            {rows.map(({ preset, prompt, links }) => (
              <li key={preset} class="ask-row">
                <span class="ask-preset">
                  {labels.presets[preset]}
                  {preset === 'port' && (
                    <select
                      class="ask-language"
                      value={targetLanguage}
                      aria-label={labels.presets.port}
                      onChange={(event) => setTargetLanguage(event.currentTarget.value)}
                    >
                      {(context.languages ?? []).map((track) => (
                        <option key={track.value} value={track.value}>
                          {track.label}
                        </option>
                      ))}
                    </select>
                  )}
                </span>
                {preset === 'check-pitfall' && (
                  <textarea
                    class="ask-code"
                    rows={5}
                    value={userCode}
                    aria-label={labels.presets['check-pitfall']}
                    onInput={(event) => setUserCode(event.currentTarget.value)}
                  />
                )}
                <span class="ask-actions">
                  <a class="act act-sm" href={links.claude} target="_blank" rel="noopener">
                    {labels.claude}
                  </a>
                  <a class="act act-sm" href={links.chatgpt} target="_blank" rel="noopener">
                    {labels.chatgpt}
                  </a>
                  <button type="button" class="act act-sm" onClick={() => copy(prompt, preset)}>
                    {copyLabel(preset)}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
