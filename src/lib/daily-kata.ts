/**
 * The home page's daily kata — docs/design/daily-kata.md.
 *
 * One code-bearing kata a day, chosen by the same UTC-day hash the practice hub uses. The page is
 * static, so the build ships a seven-day window: the island picks the visitor's day out of it and
 * the card keeps changing for a week without a rebuild.
 */
import type { CollectionEntry } from 'astro:content';

import { formatCount, t } from '@/i18n';
import { renderCodePeek } from '@/lib/code-html';
import { listTopics, topicMeta } from '@/lib/content';
import {
  catalogueFrom,
  dailyKataPool,
  dailyKataWindow,
  practiceItemTitle,
  practiceUrl,
  typeLabelKey,
  utcDay,
} from '@/lib/practice';
import { getTrack } from '@/data/tracks';
import { topicUrl, trackUrl, type Locale } from '@/lib/urls';
import type { QuizItem } from '@/schemas/quiz';

/** Today plus the next six days: one week of rotation from a single build. */
export const DAILY_KATA_DAYS = 7;

/** Lines of code the peek shows, at the two column counts of the card. */
export const DAILY_PEEK_LINES = 8;
export const DAILY_PEEK_LINES_SMALL = 6;

/** One day of the window, carrying only what the card draws. */
export interface DailyKataEntry {
  /** `bank#item` — the key the quiz islands write progress under. */
  key: string;
  title: string;
  /** The brief under the title, empty when the item has none the title does not already say. */
  task: string;
  issues: number;
  lines: number;
  kataUrl: string;
  topicUrl: string;
  topicTitle: string;
  typeLabel: string;
  trackLabel: string;
  minutesLabel: string;
  /** Highlighted first lines of the kata, ready for `dangerouslySetInnerHTML`. */
  peekHtml: string;
  /** Lines hidden below the peek, at the wide and the narrow line counts. */
  peekMore: number;
  peekMoreSmall: number;
}

export interface DailyKataLabels {
  eyebrow: string;
  hook: string;
  hookOne: string;
  found: string;
  start: string;
  done: string;
  from: string;
  more: string;
  peek: string;
}

export interface DailyKataData {
  /** UTC day of the build; the island renders `today - buildDay` places into the window. */
  buildDay: number;
  entries: DailyKataEntry[];
  labels: DailyKataLabels;
}

type CodeKata = Extract<QuizItem, { type: 'review' | 'spotbug' }>;

const isCodeKata = (item: QuizItem): item is CodeKata => item.type === 'review' || item.type === 'spotbug';

function labelsFor(locale: Locale): DailyKataLabels {
  return {
    eyebrow: t(locale, 'daily.eyebrow'),
    hook: t(locale, 'daily.hook', { issues: '{issues}', lines: '{lines}' }),
    hookOne: t(locale, 'daily.hookOne', { lines: '{lines}' }),
    found: t(locale, 'daily.found', { found: '{found}', issues: '{issues}' }),
    start: t(locale, 'daily.start'),
    done: t(locale, 'daily.done'),
    from: t(locale, 'daily.from', { topic: '{topic}' }),
    more: t(locale, 'daily.more', { count: '{count}' }),
    peek: t(locale, 'daily.peek', { title: '{title}' }),
  };
}

/**
 * Builds the seven cards. Runs during the static build, so the window starts on the build day;
 * a visitor further ahead than the window keeps its last entry rather than an empty card.
 */
export async function dailyKataData(locale: Locale, now = new Date()): Promise<DailyKataData> {
  const { getCollection } = await import('astro:content');
  const banks: CollectionEntry<'quizzes'>[] = await getCollection('quizzes');
  const bankById = new Map(banks.map((bank) => [bank.id, bank] as const));

  const topics = new Map(
    (await listTopics(locale)).map((topic) => {
      const { track, slug } = topicMeta(topic);
      return [`${track}/${slug}`, { title: topic.data.title, url: topicUrl(track, slug, locale) }];
    }),
  );

  const picks = dailyKataWindow(dailyKataPool(catalogueFrom(banks)), now, DAILY_KATA_DAYS);

  const entries: DailyKataEntry[] = [];
  for (const pick of picks) {
    const item = bankById
      .get(pick.bank)
      ?.data.items.find((candidate: QuizItem) => candidate.id === pick.item);
    if (!item || !isCodeKata(item)) continue;

    const lines = item.code.trimEnd().split('\n').length;
    // Path checkpoints have no topic of their own; their track hub is the honest source link.
    const source = topics.get(pick.bank) ?? {
      title: getTrack(pick.track)?.name[locale] ?? pick.track,
      url: trackUrl(pick.track, locale),
    };

    entries.push({
      key: `${pick.bank}#${pick.item}`,
      title: practiceItemTitle(pick, locale),
      // An item without an authored title takes one from its prompt, so repeating the prompt
      // underneath would print the same sentence twice; such a card shows the title alone.
      task:
        (item.type === 'review' && item.task ? item.task[locale] : undefined) ??
        (pick.title ? item.prompt[locale] : ''),
      issues: item.issues.length,
      lines,
      kataUrl: practiceUrl(pick, locale),
      topicUrl: source.url,
      topicTitle: source.title,
      typeLabel: t(locale, typeLabelKey(pick.type)),
      trackLabel: getTrack(pick.track)?.name[locale] ?? pick.track,
      minutesLabel: t(locale, 'practice.minutes', {
        count: formatCount(locale, pick.minutes, 'unit.minute', 'unit.minutes'),
      }),
      peekHtml: await renderCodePeek(item.code, item.lang, DAILY_PEEK_LINES),
      peekMore: Math.max(0, lines - DAILY_PEEK_LINES),
      peekMoreSmall: Math.max(0, lines - DAILY_PEEK_LINES_SMALL),
    });
  }

  return { buildDay: utcDay(now), entries, labels: labelsFor(locale) };
}
