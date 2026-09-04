import { useEffect } from 'preact/hooks';
import {
  EMPTY_PROGRESS,
  KEYS,
  flushStore,
  readStore,
  writeStoreDebounced,
  type Progress,
  type TopicProgress,
} from '@/lib/prefs';

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
 * The measure is sections seen, not pixels scrolled: an `IntersectionObserver` over the article's
 * `h2` elements records the furthest one reached, so re-reading the top never walks the number
 * back. Reaching the checkpoint (or the last section, on a topic without one) is what completes a
 * topic — it is the end of the article as the reader experiences it, and the depth dial can hide
 * whole sections below it.
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

    const sections = [...article.querySelectorAll<HTMLElement>('h2')];
    if (sections.length === 0) return;
    const checkpoint = article.querySelector<HTMLElement>('[data-checkpoint]');

    let furthest = -1;
    let complete = false;

    const write = () => {
      const seen = furthest + 1;
      const readPct = complete ? 100 : Math.round((seen / sections.length) * 100);
      // Read again rather than reusing the snapshot above: the same store holds the flashcards,
      // the quiz scores and the "was this clear?" answer, and any of them may have moved since.
      const current = readStore<Progress>(KEYS.progress, EMPTY_PROGRESS);
      const previous = current.topics?.[topicId];
      // Progress never goes backwards: a second visit to the top is not un-reading the page.
      if (previous && Number(previous.readPct) >= readPct && !complete) return;
      const now = new Date().toISOString();
      const entry: TopicProgress = {
        readPct,
        lastAt: now,
        ...(readPct >= 100 ? { completedAt: previous?.completedAt ?? now } : {}),
      };
      writeStoreDebounced<Progress>(KEYS.progress, {
        ...current,
        topics: { ...current.topics, [topicId]: entry },
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        let changed = false;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (entry.target === checkpoint) {
            complete = true;
            changed = true;
            continue;
          }
          const index = sections.indexOf(entry.target as HTMLElement);
          if (index > furthest) {
            furthest = index;
            changed = true;
            // The last section counts as the end on a topic that has no checkpoint.
            if (!checkpoint && index === sections.length - 1) complete = true;
          }
        }
        if (changed) write();
      },
      { rootMargin: '0px 0px -20% 0px' },
    );

    for (const section of sections) observer.observe(section);
    if (checkpoint) observer.observe(checkpoint);

    // A debounced write would be lost when the tab goes away mid-window.
    const flush = () => flushStore(KEYS.progress);
    addEventListener('pagehide', flush);

    return () => {
      observer.disconnect();
      removeEventListener('pagehide', flush);
      flush();
    };
  }, [topicId]);

  return null;
}
