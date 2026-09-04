import { useEffect } from 'preact/hooks';

/** One glossary entry, as `Topic.astro` embeds it for the terms this page marks up. */
export interface TermCard {
  en: string;
  zh: string;
  /** The one-sentence definition, already in the page's language. */
  short: string;
  /** The term page, already in the page's locale. */
  url: string;
}

export interface TermsProps {
  /** Localised copy. Islands never import `t`: the locale is a page-level fact. */
  labels: {
    /** Link out of the card, e.g. "Glossary". */
    open: string;
  };
  /** Where the card's link points before a term has been opened: the glossary index. */
  glossaryUrl: string;
}

/** How long the card survives the pointer leaving, so it can be moved onto and its link clicked. */
const GRACE_MS = 140;

/** Gap between the term and the card, and the margin the card keeps from the viewport edges. */
const GAP = 8;

/**
 * Hover and focus definitions for the glossary terms in an article: the promise the dotted
 * underline of docs/design/mockups/Topic.dc.html makes, and what the home page calls "a bilingual
 * glossary with hover definitions".
 *
 * `<Term>` renders `<span class="term" data-term="{id}" tabindex="0">`, and the page embeds the
 * definitions it needs as JSON, so this island neither fetches nor duplicates content: it reads
 * that script, and lends one card to whichever term is being hovered or focused. Without
 * JavaScript the terms stay readable prose, and the right rail already links every one of them.
 *
 * One card exists for the whole page, which is what keeps two from being open at once. It is
 * appended to the body rather than beside each term, so its position is unaffected by whatever
 * the article wraps a term in; the tab order therefore skips it, and the reader who wants the
 * term page reaches it from the rail or from the card's own link with the pointer.
 */
export default function Terms({ labels, glossaryUrl }: TermsProps) {
  useEffect(() => {
    const script = document.getElementById('cw-terms');
    const terms = [...document.querySelectorAll<HTMLElement>('.term[data-term]')];
    if (!script?.textContent || terms.length === 0) return;

    let cards: Record<string, TermCard>;
    try {
      cards = JSON.parse(script.textContent) as Record<string, TermCard>;
    } catch {
      // A malformed payload is a build bug, not a reader's problem: leave the prose as it is.
      return;
    }

    /* ---- the card ---- */

    const tip = document.createElement('div');
    tip.className = 'term-tip';
    tip.id = 'cw-term-tip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;

    const head = document.createElement('span');
    head.className = 'term-tip-head';
    // Both names are tagged with their own language, whichever language the page is in.
    const en = document.createElement('span');
    en.lang = 'en';
    const sep = document.createElement('span');
    sep.className = 'term-tip-sep';
    sep.textContent = '·';
    sep.setAttribute('aria-hidden', 'true');
    const zh = document.createElement('span');
    zh.className = 'term-tip-alt';
    zh.lang = 'zh-Hans';
    head.append(en, sep, zh);

    const short = document.createElement('p');
    short.className = 'term-tip-short';

    const link = document.createElement('a');
    link.className = 'term-tip-link';
    link.textContent = `${labels.open} →`;
    // `show()` repoints this at the term being read. It starts on the glossary index rather than
    // bare, because an <a> with no href is not a link: it is unfocusable and crawlers flag it.
    link.href = glossaryUrl;

    tip.append(head, short, link);
    document.body.append(tip);

    /* ---- opening and closing ---- */

    let open: HTMLElement | undefined;
    let timer = 0;

    const cancel = () => {
      if (timer) clearTimeout(timer);
      timer = 0;
    };

    const close = () => {
      cancel();
      if (!open) return;
      open.removeAttribute('aria-describedby');
      open = undefined;
      tip.hidden = true;
    };

    /** Leaving does not close at once: the reader may be on their way to the card's own link. */
    const closeSoon = () => {
      cancel();
      timer = window.setTimeout(close, GRACE_MS);
    };

    const show = (term: HTMLElement) => {
      const card = cards[term.dataset.term ?? ''];
      if (!card) return;
      cancel();
      if (open && open !== term) open.removeAttribute('aria-describedby');

      en.textContent = card.en;
      zh.textContent = card.zh;
      short.textContent = card.short;
      link.href = card.url;

      open = term;
      term.setAttribute('aria-describedby', tip.id);
      tip.hidden = false;

      /* Placed in page coordinates, so the card travels with the term while the page scrolls.
         Below the term, as the mockup has it, and above when there is no room below. */
      const rect = term.getBoundingClientRect();
      const box = tip.getBoundingClientRect();
      const fitsBelow = rect.bottom + GAP + box.height <= innerHeight - GAP;
      const top = fitsBelow ? rect.bottom + GAP : rect.top - GAP - box.height;
      const left = Math.max(GAP, Math.min(rect.left, innerWidth - box.width - GAP));
      tip.style.top = `${top + scrollY}px`;
      tip.style.left = `${left + scrollX}px`;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !open) return;
      const term = open;
      close();
      // Escape from inside the card returns the reader to the term they came from.
      if (tip.contains(document.activeElement)) term.focus();
    };

    /* Pointer and keyboard reach the same card: hover opens it, so does focus, and the term is
       focusable from the server's markup rather than from here. */
    const bound: (() => void)[] = [];
    const on = (node: EventTarget, type: string, handler: EventListener) => {
      node.addEventListener(type, handler);
      bound.push(() => node.removeEventListener(type, handler));
    };

    for (const term of terms) {
      const opener = () => show(term);
      on(term, 'mouseenter', opener);
      on(term, 'focus', opener);
      on(term, 'mouseleave', closeSoon);
      on(term, 'blur', closeSoon);
    }
    on(tip, 'mouseenter', cancel);
    on(tip, 'mouseleave', closeSoon);
    on(tip, 'focusin', cancel);
    on(tip, 'focusout', closeSoon);
    on(document, 'keydown', onKeyDown as EventListener);

    return () => {
      cancel();
      for (const off of bound) off();
      open?.removeAttribute('aria-describedby');
      tip.remove();
    };
  }, [labels, glossaryUrl]);

  return null;
}
