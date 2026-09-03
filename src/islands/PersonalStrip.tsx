import { useEffect, useState } from 'preact/hooks';
import {
  dueFlashcards,
  getContinue,
  readStore,
  EMPTY_FLASHCARDS,
  EMPTY_PROGRESS,
  KEYS,
  type Flashcards,
  type Progress,
} from '@/lib/prefs';

/** What the page knows about one topic, so the island never touches the content collections. */
export interface TopicRef {
  title: string;
  /** Track name in the page's locale, shown as the breadcrumb before the title. */
  track: string;
  url: string;
}

export interface PersonalStripProps {
  /** Localised copy. Islands never import `t`, because the locale is a page-level fact. */
  labels: {
    continue: string;
    recall: string;
    review: string;
    /** Carries a `{count}` slot. */
    due: string;
    /** Accessible name of the reading-progress bar; carries a `{title}` slot. */
    progress: string;
  };
  /** Every public topic of this locale, keyed by `${track}/${slug}`. */
  titles: Record<string, TopicRef>;
  /** Where the "Review" link goes. */
  reviewUrl: string;
}

/**
 * The personal strip under the hero: what the visitor was reading and what is due for review.
 * Everything it shows comes from this browser's local storage, so it renders nothing on the
 * server and nothing at all for a first-time visitor — the page must look finished without it.
 *
 * The kata card from the mockup needs a kata bank, which P1 does not have; it is left out rather
 * than faked.
 */
export default function PersonalStrip({ labels, titles, reviewUrl }: PersonalStripProps) {
  const [state, setState] = useState<{ progress: Progress; cards: Flashcards } | null>(null);

  useEffect(() => {
    setState({
      progress: readStore(KEYS.progress, EMPTY_PROGRESS),
      cards: readStore(KEYS.flashcards, EMPTY_FLASHCARDS),
    });
  }, []);

  if (!state) return null;

  // Local storage is visitor-editable, so nothing read back is trusted to have the right shape.
  const cont = getContinue(state.progress ?? EMPTY_PROGRESS);
  const topic = cont ? titles[cont.id] : undefined;
  const cards = Array.isArray(state.cards?.cards) ? state.cards.cards : [];
  const due = dueFlashcards(cards, new Date());

  if (!topic && due === 0) return null;

  const readPct = Number(cont?.readPct);
  const pct = Number.isFinite(readPct) ? Math.max(0, Math.min(100, Math.round(readPct))) : 0;

  return (
    <div class="wrap pstrip">
      {topic ? (
        <a class="cont" href={topic.url}>
          <span class="lbl">{labels.continue}</span>
          <span class="pstrip-text">
            {topic.track} › <strong>{topic.title}</strong>
          </span>
          <div
            class="bar"
            role="progressbar"
            aria-label={labels.progress.replace('{title}', topic.title)}
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div style={{ width: `${pct}%` }} />
          </div>
        </a>
      ) : null}
      {due > 0 ? (
        <div class="cont">
          <span class="lbl">{labels.recall}</span>
          <span class="pstrip-text">{labels.due.replace('{count}', String(due))}</span>
          <a class="pstrip-link" href={reviewUrl}>
            {labels.review} →
          </a>
        </div>
      ) : null}
    </div>
  );
}
