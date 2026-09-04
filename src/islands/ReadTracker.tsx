import { useEffect } from 'preact/hooks';
import {
  DEFAULT_PREFS,
  EMPTY_FLASHCARDS,
  EMPTY_PROGRESS,
  KEYS,
  cardSources,
  flushStore,
  readStore,
  writeStore,
  writeStoreDebounced,
  type Flashcards,
  type Prefs,
  type Progress,
  type TopicProgress,
} from '@/lib/prefs';
import { enqueueCards, termCardId } from '@/lib/score';
import { DEPTH_EVENT } from '@/islands/DepthDial';

export interface ReadTrackerProps {
  /** `${track}/${slug}` of the topic being read. */
  topicId: string;
}

/** Local storage is visitor-editable, so nothing read back is trusted to have the right shape. */
function isDone(entry: TopicProgress | undefined): boolean {
  return Boolean(entry && (entry.completedAt || Number(entry.readPct) >= 100));
}

/** The check mark a finished topic grows in the left rail. Mirrors `Icon.astro`'s `check`. */
function checkIcon(): SVGSVGElement {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  for (const [name, value] of Object.entries({
    width: '12',
    height: '12',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2.5',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  }))
    svg.setAttribute(name, value);
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', 'm5 13 4 4L19 7');
  svg.appendChild(path);
  return svg;
}

/**
 * How far down the article the reader has come — spec §6.2. Progress is a fact about this
 * browser: it is written to local storage, debounced, and never leaves the machine.
 *
 * The measure is sections seen, not pixels scrolled, and only the sections the current depth
 * actually shows: Quick hides most of the article, so counting the hidden headings would leave a
 * reader who finished everything in front of them stuck below 100%. The observed set is rebuilt on
 * `cw:depth`, and the percentage never walks back within a page view. Reaching the checkpoint, or
 * the last section shown, is what completes a topic — that is the end of the article as this
 * reader meets it.
 *
 * On mount it also marks the topics already finished in the left rail, which is why it renders
 * nothing of its own.
 */
export default function ReadTracker({ topicId }: ReadTrackerProps) {
  useEffect(() => {
    const article = document.getElementById('article');
    if (!article) return;

    /* The left rail, from the same store the track hub reads. */
    const progress = readStore<Progress>(KEYS.progress, EMPTY_PROGRESS);
    let done = 0;
    const links = document.querySelectorAll<HTMLAnchorElement>('.tree a[data-topic-id]');
    for (const link of links) {
      if (!isDone(progress.topics?.[link.dataset.topicId ?? ''])) continue;
      done += 1;
      link.classList.add('done');
      link.querySelector('.sp')?.replaceWith(checkIcon());
    }
    const counter = document.querySelector('[data-tree-count]');
    if (counter) counter.textContent = `${done}/${links.length}`;

    const checkpoint = article.querySelector<HTMLElement>('[data-checkpoint]');

    /* What counts as a section depends on the depth: a heading the dial hides is not part of the
       article this reader is being asked to read, so counting it would cap them below 100%. */
    const isShown = (element: HTMLElement) => element.getClientRects().length > 0;
    const shownSections = () => [...article.querySelectorAll<HTMLElement>('h2')].filter(isShown);

    let sections: HTMLElement[] = [];
    const seen = new Set<Element>();
    let complete = false;
    /**
     * The highest percentage reached so far; it never walks back. Seeded from what is already
     * stored, so neither a second visit nor a depth switch that hides sections can un-read a topic.
     */
    let best = Math.min(100, Math.max(0, Math.round(Number(progress.topics?.[topicId]?.readPct)) || 0));

    const write = (readPct: number) => {
      // Read again rather than reusing the snapshot above: the same store holds the flashcards,
      // the quiz scores and the "was this clear?" answer, and any of them may have moved since.
      const current = readStore<Progress>(KEYS.progress, EMPTY_PROGRESS);
      const previous = current.topics?.[topicId];
      const now = new Date().toISOString();
      let termsAdded = previous?.termsAdded;

      if (readPct >= 90 && !termsAdded) {
        const prefs = readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS);
        if (cardSources(prefs).terms !== false) {
          const terms = (article.dataset.terms ?? '')
            .split(',')
            .map((term) => term.trim())
            .filter(Boolean);
          const stored = readStore<Flashcards>(KEYS.flashcards, EMPTY_FLASHCARDS);
          const deck = Array.isArray(stored?.cards) ? stored : EMPTY_FLASHCARDS;
          const next = enqueueCards(
            deck,
            terms.map((term) => {
              const ref = termCardId(term);
              return { id: ref, kind: 'term' as const, ref, source: 'terms' as const };
            }),
            new Date(now),
          );
          if (next !== deck) {
            writeStore(KEYS.flashcards, next);
            document.dispatchEvent(new CustomEvent('cw:flashcards'));
          }
          termsAdded = true;
        }
      }

      const entry: TopicProgress = {
        ...previous,
        readPct,
        lastAt: now,
        ...(readPct >= 100 || previous?.completedAt ? { completedAt: previous?.completedAt ?? now } : {}),
        ...(termsAdded ? { termsAdded: true } : {}),
      };
      writeStoreDebounced<Progress>(KEYS.progress, {
        ...current,
        topics: { ...current.topics, [topicId]: entry },
      });
    };

    /* Readers may already have crossed the threshold before this feature shipped. Their first
       visit with automatic term cards enabled performs the same one-time enrollment. */
    const storedTopic = progress.topics?.[topicId];
    if (
      best >= 90 &&
      !storedTopic?.termsAdded &&
      cardSources(readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS)).terms !== false
    ) {
      write(best);
    }

    /** How far up the viewport a section has to come before it counts as reached. */
    const REACHED = 0.8;

    const evaluate = () => {
      /* Anything the reader has scrolled past counts, not only what the observer caught: jumping
         to an anchor skips the sections in between, and they have still been left behind. */
      const limit = innerHeight * REACHED;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= limit) seen.add(section);
      }
      if (checkpoint && checkpoint.getClientRects().length > 0) {
        if (checkpoint.getBoundingClientRect().top <= limit) seen.add(checkpoint);
      }

      const last = sections[sections.length - 1];
      // The end of the article as this reader meets it: the checkpoint, or the last section shown.
      if ((checkpoint && seen.has(checkpoint)) || (last && seen.has(last))) complete = true;

      const reached = sections.filter((section) => seen.has(section)).length;
      const measured = sections.length > 0 ? Math.round((reached / sections.length) * 100) : best;
      const readPct = complete ? 100 : Math.max(best, measured);
      if (readPct <= best) return;
      best = readPct;
      write(readPct);
    };

    const observer = new IntersectionObserver(evaluate, { rootMargin: '0px 0px -20% 0px' });

    /** Re-reads which sections the current depth shows and observes exactly those. */
    let refreshFrame = 0;
    const refresh = () => {
      if (refreshFrame) return;
      refreshFrame = requestAnimationFrame(() => {
        refreshFrame = 0;
        sections = shownSections();
        observer.disconnect();
        for (const section of sections) observer.observe(section);
        if (checkpoint) observer.observe(checkpoint);
        evaluate();
      });
    };

    refresh();
    document.addEventListener(DEPTH_EVENT, refresh);

    /* The observer reports crossings; a jump can cross nothing at all, so the scroll is watched
       too. One frame at a time is enough for a percentage. */
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        evaluate();
      });
    };
    addEventListener('scroll', onScroll, { passive: true });

    // A debounced write would be lost when the tab goes away mid-window.
    const flush = () => flushStore(KEYS.progress);
    addEventListener('pagehide', flush);

    return () => {
      observer.disconnect();
      document.removeEventListener(DEPTH_EVENT, refresh);
      removeEventListener('scroll', onScroll);
      if (refreshFrame) cancelAnimationFrame(refreshFrame);
      if (frame) cancelAnimationFrame(frame);
      removeEventListener('pagehide', flush);
      flush();
    };
  }, [topicId]);

  return null;
}
