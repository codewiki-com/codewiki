import type { CollectionEntry } from 'astro:content';

import type { Quiz, QuizItem } from '@/schemas/quiz';
import type { Locale } from '@/lib/urls';
import { localizePath } from '@/lib/urls';
import type { Localized } from '@/schemas/localized';

export const ITEM_TYPES = ['predict', 'spotbug', 'review', 'mcq', 'fill'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];
export const DEFAULT_MINUTES: Record<ItemType, number> = {
  predict: 2,
  spotbug: 4,
  review: 6,
  mcq: 1,
  fill: 1,
};

export interface PracticeItem {
  bank: string;
  track: string;
  slug: string;
  item: string;
  type: ItemType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  minutes: number;
  title?: Localized;
  prompt: { en: string; zh: string };
  tags: string[];
  lang?: string;
}

/** The collection-entry fields used by the pure catalogue and answer-stripping helpers. */
export interface QuizBank {
  id: string;
  data: Quiz;
}

export interface PublicQuizBank {
  id: string;
  topic: string;
  items: Array<PublicQuizItem & { url: string }>;
}

type PublicItemBase = Pick<QuizItem, 'id' | 'type' | 'title' | 'prompt' | 'difficulty' | 'tags' | 'minutes'>;

/** The learner-visible part of a quiz item. Keep this explicit so new schema fields stay private. */
export type PublicQuizItem =
  | (PublicItemBase & {
      type: 'mcq';
      options: Array<{ text: Localized }>;
    })
  | (PublicItemBase & {
      type: 'predict';
      code: string;
      lang: string;
      options: Array<{ text: Localized }>;
    })
  | (PublicItemBase & {
      type: 'spotbug';
      code: string;
      lang: string;
      issueCount: number;
    })
  | (PublicItemBase & {
      type: 'review';
      code: string;
      lang: string;
      task?: Localized;
      issueCount: number;
    })
  | (PublicItemBase & { type: 'fill' });

export function practiceUrl(
  item: Pick<PracticeItem, 'type' | 'track' | 'slug' | 'item'>,
  locale: Locale,
): string {
  return localizePath(`/practice/${item.type}/${item.track}/${item.slug}/${item.item}/`, locale);
}

/** Turns already-loaded quiz banks into the stable, answer-free catalogue summary. */
export function catalogueFrom(banks: readonly QuizBank[]): PracticeItem[] {
  const out: PracticeItem[] = [];
  for (const bank of banks) {
    const [track, slug] = bank.id.split('/');
    for (const item of bank.data.items) {
      out.push({
        bank: bank.id,
        track,
        slug,
        item: item.id,
        type: item.type,
        difficulty: item.difficulty,
        minutes: item.minutes ?? DEFAULT_MINUTES[item.type],
        title: item.title,
        prompt: item.prompt,
        tags: item.tags,
        lang: 'lang' in item ? item.lang : undefined,
      });
    }
  }
  return out.sort((a, b) => a.bank.localeCompare(b.bank) || a.item.localeCompare(b.item));
}

/** The Astro-only wrapper; catalogueFrom stays usable in ordinary unit tests. */
export async function listPracticeItems(): Promise<PracticeItem[]> {
  const { getCollection } = await import('astro:content');
  const banks: CollectionEntry<'quizzes'>[] = await getCollection('quizzes');
  return catalogueFrom(banks);
}

/** Selects only learner-visible fields; answer and future author-only fields are omitted by default. */
export function stripQuizItem(item: QuizItem): PublicQuizItem {
  const base: PublicItemBase = {
    id: item.id,
    type: item.type,
    title: item.title,
    prompt: item.prompt,
    difficulty: item.difficulty,
    tags: item.tags,
    minutes: item.minutes,
  };

  if (item.type === 'mcq') {
    return { ...base, type: item.type, options: item.options.map(({ text }) => ({ text })) };
  }
  if (item.type === 'predict') {
    return {
      ...base,
      type: item.type,
      code: item.code,
      lang: item.lang,
      options: item.options.map(({ text }) => ({ text })),
    };
  }
  if (item.type === 'spotbug') {
    return { ...base, type: item.type, code: item.code, lang: item.lang, issueCount: item.issues.length };
  }
  if (item.type === 'review') {
    return {
      ...base,
      type: item.type,
      code: item.code,
      lang: item.lang,
      task: item.task,
      issueCount: item.issues.length,
    };
  }
  return { ...base, type: item.type };
}

/** Removes every answer-bearing field before a quiz bank reaches a public endpoint. */
export function stripAnswers(bank: QuizBank): PublicQuizBank {
  const [track, slug] = bank.id.split('/');
  const items = bank.data.items.map((item: QuizItem) => ({
    ...stripQuizItem(item),
    url: practiceUrl({ type: item.type, track, slug, item: item.id }, 'en'),
  }));

  return { id: bank.id, topic: bank.data.topic, items };
}

/**
 * The UTC day a moment falls in, as a monotonic integer. `getTime()` is absolute, so every
 * timezone agrees on the number and the daily rotation is the same everywhere on earth.
 */
export function utcDay(date: Date): number {
  return Math.floor(date.getTime() / 86_400_000);
}

/** FNV-1a over the day number: a stable, dependency-free spread with no per-build state. */
function dayHash(day: number): number {
  let hash = 2166136261;
  for (const character of String(day)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

/** Deterministic pick per UTC day so every visitor sees the same kata and the page stays static-cacheable. */
export function kataOfTheDay<T>(items: T[], date: Date): T | undefined {
  if (!items.length) return undefined;
  return items[dayHash(utcDay(date)) % items.length];
}

/**
 * The daily kata is a piece of generated code to review, so only the two code-bearing types are
 * eligible; `mcq`, `predict` and `fill` never appear on the home page's card.
 */
export function dailyKataPool<T extends Pick<PracticeItem, 'type'>>(items: readonly T[]): T[] {
  return items.filter((item) => item.type === 'review' || item.type === 'spotbug');
}

/**
 * The pick for `date` and the following `days - 1` days, so a page built today can rotate in the
 * browser without a rebuild. Entry 0 is exactly `kataOfTheDay`, which keeps the home page and the
 * practice hub on the same item. A pick that repeats the day before is nudged one place on: the
 * card has to visibly change every morning, or a returning visitor reads it as a stale page.
 */
export function dailyKataWindow<T>(items: readonly T[], date: Date, days = 7): T[] {
  if (!items.length || days <= 0) return [];
  const day = utcDay(date);
  const window: T[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const index = dayHash(day + offset) % items.length;
    const previous = window.at(-1);
    window.push(
      items.length > 1 && window.length > 0 && items[index] === previous
        ? items[(index + 1) % items.length]
        : items[index],
    );
  }
  return window;
}

/** A compact catalogue/page title, preserving an explicitly authored title when one exists. */
export function practiceItemTitle(item: Pick<PracticeItem, 'prompt' | 'title'>, locale: Locale): string {
  if (item.title) return item.title[locale];

  const prompt = item.prompt[locale].trim().replace(/[.。]\s*$/u, '');
  const characters = Array.from(prompt);
  return characters.length <= 90 ? prompt : `${characters.slice(0, 89).join('')}…`;
}

export const typeLabelKey = (type: ItemType) => `practice.type.${type}` as const;
