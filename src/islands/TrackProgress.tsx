import { useEffect } from 'preact/hooks';
import { EMPTY_PROGRESS, KEYS, readStore, type Progress, type TopicProgress } from '@/lib/prefs';

/** One section of the hub, in the order the page renders it. */
export interface ProgressSection {
  slug: string;
  /** `${track}/${slug}` of every public topic card the section rendered. */
  topics: string[];
}

export interface TrackProgressProps {
  /** Localised copy. Islands never import `t`: the locale is a page-level fact. */
  labels: {
    /** Carries a `{pct}` slot. */
    readPct: string;
    /** Carries `{done}` and `{total}`. */
    done: string;
    /** Carries `{done}` and `{total}`. */
    milestone: string;
  };
  sections: ProgressSection[];
  /** The recommended path's milestones, each as its list of topic ids. */
  milestones?: string[][];
}

/** Local storage is visitor-editable, so nothing read back is trusted to have the right shape. */
function entryOf(progress: Progress, id: string): TopicProgress | undefined {
  const entry = progress.topics?.[id];
  return entry && typeof entry === 'object' ? entry : undefined;
}

function isDone(entry: TopicProgress | undefined): boolean {
  return Boolean(entry && (entry.completedAt || Number(entry.readPct) >= 100));
}

function percent(entry: TopicProgress | undefined): number {
  const value = Number(entry?.readPct);
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
}

function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

/** The check mark the card grows once its topic is finished. Mirrors `Icon.astro`'s `check`. */
function checkIcon(): SVGSVGElement {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', 'm5 13 4 4L19 7');
  svg.appendChild(path);
  return svg;
}

/**
 * Reading progress on a track hub. Everything it shows comes from this browser's local storage,
 * so the page is complete without it: the server renders every card unread and every counter at
 * zero, and this island patches the DOM it finds — the topic cards by `data-topic-id`, the
 * section counters, the ring and the recommended path's bar.
 *
 * It renders nothing of its own, which is why it writes to the document directly instead of
 * owning that markup; the DOM contract is documented on `TopicCard.astro`.
 */
export default function TrackProgress({ labels, sections, milestones = [] }: TrackProgressProps) {
  useEffect(() => {
    const progress = readStore(KEYS.progress, EMPTY_PROGRESS);
    const done = new Set<string>();

    for (const card of document.querySelectorAll<HTMLElement>('.topic[data-topic-id]')) {
      const id = card.dataset.topicId;
      if (!id) continue;
      const entry = entryOf(progress, id);
      const pct = percent(entry);
      if (isDone(entry)) {
        done.add(id);
        card.classList.add('done');
        card.dataset.read = 'done';
        const title = card.querySelector('.t');
        if (title && !title.querySelector('svg')) title.prepend(checkIcon());
      } else if (pct > 0) {
        card.classList.add('cur');
        card.dataset.read = 'reading';
        const meta = card.querySelector('.m');
        if (meta && !meta.querySelector('.pct')) {
          const label = document.createElement('span');
          label.className = 'lbl pct';
          label.textContent = fill(labels.readPct, { pct });
          meta.appendChild(label);
        }
      } else {
        card.dataset.read = 'unread';
      }
    }

    for (const section of sections) {
      const counter = document.querySelector(`[data-section-done="${section.slug}"]`);
      if (!counter) continue;
      const read = section.topics.filter((id) => done.has(id)).length;
      counter.textContent = fill(labels.done, { done: read, total: section.topics.length });
    }

    const all = sections.flatMap((section) => section.topics);
    const readAll = all.filter((id) => done.has(id)).length;

    const count = document.querySelector('[data-progress-count]');
    if (count) count.textContent = `${readAll} / ${all.length}`;

    const ring = document.querySelector<SVGCircleElement>('[data-ring]');
    if (ring) {
      const circumference = Number(ring.dataset.circumference) || 0;
      const ratio = all.length > 0 ? readAll / all.length : 0;
      ring.setAttribute('stroke-dashoffset', (circumference * (1 - ratio)).toFixed(1));
      ring.parentElement?.setAttribute('aria-valuenow', String(readAll));
    }

    if (milestones.length > 0) {
      const pathTopics = milestones.flat();
      const pathDone = pathTopics.filter((id) => done.has(id)).length;
      const ratio = pathTopics.length > 0 ? pathDone / pathTopics.length : 0;

      const bar = document.querySelector<HTMLElement>('[data-path-bar] > div');
      if (bar) bar.style.width = `${Math.round(ratio * 100)}%`;
      document.querySelector('[data-path-bar]')?.setAttribute('aria-valuenow', String(pathDone));

      const doneLabel = document.querySelector('[data-path-done]');
      if (doneLabel) doneLabel.textContent = fill(labels.done, { done: pathDone, total: pathTopics.length });

      // The milestone the visitor is in: the first one not finished, or the last one.
      const index = milestones.findIndex((topics) => topics.some((id) => !done.has(id)));
      const current = index === -1 ? milestones.length : index + 1;
      const milestoneLabel = document.querySelector('[data-path-milestone]');
      if (milestoneLabel)
        milestoneLabel.textContent = fill(labels.milestone, {
          done: current,
          total: milestones.length,
        });
    }

    // The filter row re-applies itself once the cards know whether they have been read.
    document.dispatchEvent(new CustomEvent('cw:progress'));
  }, [labels, sections, milestones]);

  return null;
}
