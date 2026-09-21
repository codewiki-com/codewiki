import { Fragment } from 'preact';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'preact/hooks';
import {
  groupResults,
  pushRecent,
  recentPages,
  safeExcerpt,
  GROUP_ORDER,
  type GroupName,
  type PagefindResultData,
} from '@/lib/search';
import type { Locale } from '@/lib/urls';

/** Localised copy. Islands never import `t`: the locale is a page-level fact. */
export interface PaletteLabels {
  /** Accessible name of the dialog and of the field inside it. */
  search: string;
  placeholder: string;
  /** Accessible name of the result list. */
  results: string;
  /** Heading above the recents, shown before anything has been typed. */
  recent: string;
  /** Shown when a query matched nothing. */
  empty: string;
  searching: string;
  /** One heading per group of `GROUP_ORDER`. */
  groups: Record<GroupName, string>;
  /** Accessible name of the search-language toggle. */
  langFilter: string;
  close: string;
  /** Footer hints. */
  hintMove: string;
  hintOpen: string;
  hintClose: string;
  offline: string;
  /** Shown instead of results when the index cannot be loaded, with the link that follows it. */
  unavailable: string;
  openPage: string;
}

export interface PaletteProps {
  /** The page's locale: the language results are filtered to until the toggle says otherwise. */
  locale: Locale;
  /**
   * `overlay` is the ⌘K dialog the layout mounts on every page; `page` renders the same results
   * inline on `/search/`, driven by that page's own `<form role="search">`.
   */
  mode?: 'overlay' | 'page';
  /** Localised `/search/`, offered when the index cannot be loaded. */
  searchUrl: string;
  labels: PaletteLabels;
}

/* ---- Pagefind ---------------------------------------------------------------------------- */

/** The slice of Pagefind's browser API the palette uses. */
interface PagefindModule {
  options(options: Record<string, unknown>): Promise<void>;
  filters(): Promise<Record<string, Record<string, number>>>;
  mergeIndex(indexPath: string, options?: Record<string, unknown>): Promise<void>;
  search(
    term: string,
    options?: { filters?: Record<string, string> },
  ): Promise<{ results: { data(): Promise<PagefindResultData> }[] }>;
}

/** Pagefind names an index after the page's `<html lang>`, lowercased. */
const PAGEFIND_LANG: Record<Locale, string> = { en: 'en', zh: 'zh-hans' };

const INDEX_PATH = '/pagefind/';

/**
 * Held in a variable rather than written inline: the bundle only exists after `pnpm build` has
 * run Pagefind over `dist/`, so neither TypeScript nor Vite can be allowed to resolve it.
 */
const PAGEFIND_URL = `${INDEX_PATH}pagefind.js`;

/** Enough rows to fill the panel; Pagefind ranks them, so the tail is rarely worth loading. */
const MAX_RESULTS = 12;

/** Long enough to swallow a burst of typing, short enough to feel live. */
const DEBOUNCE_MS = 120;

/**
 * Loaded once per document, however many instances of the palette a page mounts. The index is a
 * build artefact, so under `astro dev` this import 404s and every caller falls back to the
 * message and the link to `/search/`.
 */
let loading: Promise<PagefindModule> | null = null;

function loadPagefind(other: string): Promise<PagefindModule> {
  loading ??= (async () => {
    const pagefind = (await import(/* @vite-ignore */ PAGEFIND_URL)) as PagefindModule;
    await pagefind.options({ baseUrl: '/' });
    // Waits for the index of this page's own language, and throws when there is none. It is also
    // what makes the merge below safe: `mergeIndex` polls for a ready primary index forever.
    await pagefind.filters();
    // Pagefind keeps one index per language and loads only the page's own, so without this the
    // language toggle would search an index the other locale's pages are not in. The path is
    // absolute because `mergeIndex` refuses a path the primary index's own path starts with —
    // a guard against merging the same index twice, which a second language is not.
    const path = new URL(INDEX_PATH, location.origin).href;
    // The merged index takes none of the primary's options, and would otherwise derive its own
    // `baseUrl` from that absolute path and return absolute result URLs.
    await pagefind.mergeIndex(path, { language: other, baseUrl: '/' }).catch(() => undefined);
    return pagefind;
  })();
  return loading;
}

/* ---- rows -------------------------------------------------------------------------------- */

/** One line of the panel, flattened out of the groups so ↑↓ can cross a heading. */
interface Row {
  url: string;
  title: string;
  /** Track name, `term`, `path` — the pill on the left. Empty for a recently opened page. */
  tag: string;
  /** `.tag` modifier, so a topic, a term and a path read differently at a glance. */
  variant: string;
  /** `track · section`, or Pagefind's highlighted excerpt when the result carries neither. */
  meta: string;
  /** True when `meta` is that excerpt, which carries `<mark>` around the match. */
  html: boolean;
}

const TAG_OF: Record<GroupName, string> = {
  topics: 'topic',
  glossary: 'term',
  paths: 'path',
  other: 'page',
};

const VARIANT_OF: Record<GroupName, string> = {
  topics: 'acc',
  glossary: 'ok',
  paths: '',
  other: '',
};

function toRow(result: PagefindResultData, group: GroupName): Row {
  const meta = result.meta ?? {};
  const trail = [meta.track, meta.section].filter(Boolean).join(' · ');
  return {
    url: result.url,
    title: meta.title ?? result.url,
    // The track's own two-letter glyph when the page published one, as the mockup's rows show.
    tag: (group === 'topics' ? (meta.glyph ?? meta.track) : undefined) ?? TAG_OF[group],
    variant: VARIANT_OF[group],
    meta: trail || safeExcerpt(result.excerpt ?? ''),
    html: !trail,
  };
}

/* ---- browser guards ---------------------------------------------------------------------- */

/** Null during the server render and wherever storage is blocked (private mode, no cookies). */
function store(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** True while the visitor is typing somewhere else, where `/` has to stay a slash. */
function isTyping(node: EventTarget | null): boolean {
  if (!(node instanceof HTMLElement)) return false;
  if (node.isContentEditable) return true;
  if (node.getAttribute('role') === 'textbox') return true;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName);
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* ---- component --------------------------------------------------------------------------- */

/**
 * The command palette — spec §6.2, the `.palette` panel of docs/design/mockups/Main.dc.html.
 *
 * It opens on ⌘K / Ctrl-K, on `/`, and on any `[data-palette-open]` control the shell renders,
 * then searches the Pagefind index the build wrote. The same component renders the results of
 * `/search/` inline, which is what a visitor without JavaScript (or without an index) gets.
 *
 * Everything it knows about a result comes from Pagefind's own metadata, so it needs no content
 * import and stays out of the page's bundle until it is first opened.
 */
export default function Palette({ locale, mode = 'overlay', searchUrl, labels }: PaletteProps) {
  const inline = mode === 'page';
  const [open, setOpen] = useState(inline);
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState<Locale>(locale);
  const [status, setStatus] = useState<'idle' | 'searching' | 'ready' | 'unavailable'>('idle');
  const [results, setResults] = useState<PagefindResultData[]>([]);
  const [recents, setRecents] = useState<Row[]>([]);
  const [active, setActive] = useState(0);
  /** False through the server render and until the shortcuts are listening. */
  const [ready, setReady] = useState(false);

  const dialog = useRef<HTMLDivElement | null>(null);
  const field = useRef<HTMLInputElement | null>(null);
  /** What had focus before the dialog opened, so closing puts the visitor back where they were. */
  const opener = useRef<HTMLElement | null>(null);

  // `useId` is seeded per Preact root, so the two islands `/search/` mounts would otherwise hand
  // out the same ids — and `aria-activedescendant` and `scrollIntoView` would find the other's.
  const listId = `${mode}-${useId()}`;
  const other: Locale = locale === 'en' ? 'zh' : 'en';
  const term = query.trim();

  const grouped = useMemo(() => groupResults(results), [results]);

  const rows = useMemo<Row[]>(
    () => (term ? GROUP_ORDER.flatMap((group) => grouped[group].map((r) => toRow(r, group))) : recents),
    [term, grouped, recents],
  );

  /** Group headings, keyed by the index of the row each one introduces. */
  const headings = useMemo<Map<number, string>>(() => {
    const map = new Map<number, string>();
    if (!term) {
      if (recents.length > 0) map.set(0, labels.recent);
      return map;
    }
    let index = 0;
    for (const group of GROUP_ORDER) {
      if (grouped[group].length > 0) map.set(index, labels.groups[group]);
      index += grouped[group].length;
    }
    return map;
  }, [term, grouped, recents, labels]);

  /** Recently opened pages render as rows with no pill and no meta line. */
  const readRecents = useCallback(() => {
    setRecents(
      recentPages(store()).map((page) => ({
        url: page.url,
        title: page.title,
        tag: '',
        variant: '',
        meta: '',
        html: false,
      })),
    );
  }, []);

  const openPalette = useCallback(() => {
    // A second ⌘K while the dialog is up would otherwise record the dialog's own field as the
    // element to restore focus to when it closes.
    if (open) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    readRecents();
    setOpen(true);
    // Warms the index while the visitor is still reaching for the keyboard, and in dev surfaces
    // the "no index" message on opening rather than on the first keystroke.
    loadPagefind(PAGEFIND_LANG[other]).catch(() => setStatus('unavailable'));
  }, [open, other, readRecents]);

  const close = useCallback(() => {
    // Hide immediately on the closing event; Preact removes the dialog on the following render.
    dialog.current?.setAttribute('hidden', '');
    setOpen(false);
    opener.current?.focus();
  }, []);

  /* ---- opening ---- */

  useEffect(() => {
    if (inline) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const chord = event.metaKey || event.ctrlKey;
      if (event.key === 'Escape' && open) {
        // The dialog is painted before its focus effect runs. Listening here too makes Escape
        // reliable in that short interval when focus is still on the control that opened it.
        event.preventDefault();
        close();
      } else if (chord && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openPalette();
      } else if (event.key === '/' && !chord && !event.altKey && !isTyping(event.target)) {
        event.preventDefault();
        openPalette();
      }
    };

    // Delegated, so the shell's search field, its compact icon and the hero panel all open the
    // palette without the island having to know about any of them.
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest('[data-palette-open]')) return;
      event.preventDefault();
      openPalette();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClick);
    setReady(true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClick);
      setReady(false);
    };
  }, [inline, open, openPalette, close]);

  /* ---- the page behind the dialog ---- */

  useEffect(() => {
    if (inline || !open) return;
    field.current?.focus();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [inline, open]);

  /* ---- `/search/`: the server-rendered form drives the same results ---- */

  useEffect(() => {
    if (!inline) return;
    const seed = new URLSearchParams(location.search).get('q') ?? '';
    setQuery(seed);
    readRecents();

    const form = document.querySelector<HTMLFormElement>('[data-search-form]');
    const input = form?.querySelector<HTMLInputElement>('input[name="q"]');
    if (!form || !input) return;
    // The page is prerendered, so the field arrives empty however the visitor got here.
    if (seed && !input.value) input.value = seed;

    const onInput = () => setQuery(input.value);
    // Without JavaScript the form reloads the page with `?q=`; with it, the URL is kept in step
    // so a search stays shareable.
    const onSubmit = (event: Event) => {
      event.preventDefault();
      setQuery(input.value);
      const q = input.value.trim();
      history.replaceState(null, '', q ? `?q=${encodeURIComponent(q)}` : location.pathname);
    };

    form.addEventListener('submit', onSubmit);
    input.addEventListener('input', onInput);
    return () => {
      form.removeEventListener('submit', onSubmit);
      input.removeEventListener('input', onInput);
    };
  }, [inline, readRecents]);

  /* ---- searching ---- */

  useEffect(() => {
    if (!open) return;
    setActive(0);
    if (!term) {
      setResults([]);
      setStatus('idle');
      return;
    }

    // The cleanup marks an in-flight search stale, so a slow answer to a query the visitor has
    // already typed past is dropped instead of replacing newer results.
    let stale = false;
    setStatus('searching');
    const timer = setTimeout(async () => {
      try {
        const pagefind = await loadPagefind(PAGEFIND_LANG[other]);
        const found = await pagefind.search(term, { filters: { lang } });
        const data = await Promise.all(found.results.slice(0, MAX_RESULTS).map((hit) => hit.data()));
        if (stale) return;
        setResults(data);
        setStatus('ready');
      } catch {
        if (!stale) setStatus('unavailable');
      }
    }, DEBOUNCE_MS);

    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [open, term, lang, other]);

  /* ---- keeping the cursor in view ---- */

  useEffect(() => {
    if (inline || !open) return;
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [inline, open, listId, active]);

  /* ---- keyboard inside the dialog ---- */

  const onDialogKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (rows.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((index) => (index + step + rows.length) % rows.length);
      return;
    }

    if (event.key === 'Enter') {
      // The language toggle, the esc button and a focused row are real controls with their own
      // Enter. Only the field, which has none, opens the row under the cursor.
      if (event.target !== field.current) return;
      const row = rows[active];
      if (!row) return;
      event.preventDefault();
      pushRecent(store(), row.url, row.title);
      location.href = row.url;
      return;
    }

    // Focus trap: the dialog is modal, so Tab wraps inside it rather than reaching the page.
    if (event.key === 'Tab') {
      const focusable = [...(dialog.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      const inside = dialog.current?.contains(document.activeElement) ?? false;
      if (!inside || document.activeElement === (event.shiftKey ? first : last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    }
  };

  /* ---- rendering ---- */

  // Rendered even while closed, and only ever `true` after hydration: it is the page's proof
  // that ⌘K, `/` and the shell's search controls are live.
  if (!open) return <span data-palette-ready={String(ready)} hidden />;

  const notice =
    status === 'unavailable' ? (
      <p class="palette-note">
        {labels.unavailable} <a href={searchUrl}>{labels.openPage}</a>
      </p>
    ) : term && rows.length === 0 ? (
      <p class="palette-note">{status === 'searching' ? labels.searching : labels.empty}</p>
    ) : null;

  // `/search/` has no roving cursor to describe — its rows are ordinary links, and marking one
  // of them selected would claim a keyboard state the page does not have.
  const list = (
    <div class="palette-list" id={listId} role={inline ? undefined : 'listbox'} aria-label={labels.results}>
      {rows.map((row, index) => (
        <Fragment key={row.url}>
          {headings.has(index) ? <span class="lbl palette-group">{headings.get(index)}</span> : null}
          <a
            id={`${listId}-${index}`}
            class={!inline && index === active ? 'row on' : 'row'}
            role={inline ? undefined : 'option'}
            aria-selected={inline ? undefined : index === active}
            href={row.url}
            onClick={() => pushRecent(store(), row.url, row.title)}
            onMouseEnter={() => !inline && setActive(index)}
            onFocus={() => !inline && setActive(index)}
          >
            {row.tag ? <span class={row.variant ? `tag ${row.variant}` : 'tag'}>{row.tag}</span> : null}
            <span class="palette-title">{row.title}</span>
            {row.html ? (
              // Pagefind builds the excerpt from the text it indexed and adds the <mark> itself.
              <span class="lbl palette-meta" dangerouslySetInnerHTML={{ __html: row.meta }} />
            ) : (
              <span class="lbl palette-meta">{row.meta}</span>
            )}
          </a>
        </Fragment>
      ))}
    </div>
  );

  const langToggle = (
    <div class="seg palette-lang" role="group" aria-label={labels.langFilter}>
      {(['en', 'zh'] as Locale[]).map((value) => (
        <button
          key={value}
          type="button"
          class={value === lang ? 'on' : undefined}
          aria-pressed={value === lang}
          onClick={() => setLang(value)}
        >
          {locale === 'en' ? (value === 'en' ? 'English' : 'Chinese') : value === 'en' ? '英语' : '中文'}
        </button>
      ))}
    </div>
  );

  if (inline) {
    return (
      <div class="search-results">
        {langToggle}
        {notice}
        {list}
      </div>
    );
  }

  return (
    <div class="palette-overlay" onClick={(event) => event.target === event.currentTarget && close()}>
      <div
        class="panel palette-panel"
        role="dialog"
        aria-modal="true"
        aria-label={labels.search}
        /* Clicking a gap between the controls would otherwise drop focus onto <body>, where the
           handler below no longer sees Escape or the arrows. -1 keeps it out of the tab cycle. */
        tabIndex={-1}
        ref={dialog}
        onKeyDown={onDialogKeyDown}
      >
        <div class="palette-field">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m20 20-3.5-3.5"></path>
          </svg>
          <input
            ref={field}
            type="text"
            class="palette-query"
            value={query}
            placeholder={labels.placeholder}
            aria-label={labels.search}
            role="combobox"
            aria-expanded={rows.length > 0}
            aria-controls={listId}
            aria-activedescendant={rows.length > 0 ? `${listId}-${active}` : undefined}
            autocomplete="off"
            spellcheck={false}
            onInput={(event) => setQuery(event.currentTarget.value)}
          />
          {langToggle}
          <button type="button" class="kbd palette-esc" onClick={close} aria-label={labels.close}>
            esc
          </button>
        </div>

        {notice}
        {list}

        <div class="lbl palette-hints">
          <span aria-hidden="true">↑↓ {labels.hintMove}</span>
          <span aria-hidden="true">↵ {labels.hintOpen}</span>
          <span aria-hidden="true">esc {labels.hintClose}</span>
          <span class="palette-offline">{labels.offline}</span>
        </div>
      </div>
    </div>
  );
}
