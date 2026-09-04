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
  items: Record<string, unknown>[];
}

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

/** Removes every answer-bearing field before a quiz bank reaches a public endpoint. */
export function stripAnswers(bank: QuizBank): PublicQuizBank {
  const [track, slug] = bank.id.split('/');
  const items = bank.data.items.map((item: QuizItem) => {
    const stripped: Record<string, unknown> = { ...item };
    delete stripped.explanation;

    if (item.type === 'mcq' || item.type === 'predict') {
      stripped.options = item.options.map((option) => ({ text: option.text }));
    } else if (item.type === 'fill') {
      delete stripped.answer;
    } else {
      delete stripped.issues;
    }

    stripped.url = practiceUrl({ type: item.type, track, slug, item: item.id }, 'en');
    return stripped;
  });

  return { id: bank.id, topic: bank.data.topic, items };
}

/** Deterministic pick per UTC day so every visitor sees the same kata and the page stays static-cacheable. */
export function kataOfTheDay<T>(items: T[], date: Date): T | undefined {
  if (!items.length) return undefined;
  const day = Math.floor(date.getTime() / 86_400_000);
  let hash = 2166136261;
  for (const character of String(day)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return items[hash % items.length];
}

/** A compact catalogue/page title, preserving an explicitly authored title when one exists. */
export function practiceItemTitle(item: Pick<PracticeItem, 'prompt' | 'title'>, locale: Locale): string {
  if (item.title) return item.title[locale];

  const prompt = item.prompt[locale].trim().replace(/[.。]\s*$/u, '');
  const characters = Array.from(prompt);
  return characters.length <= 90 ? prompt : `${characters.slice(0, 89).join('')}…`;
}

export const typeLabelKey = (type: ItemType) => `practice.type.${type}` as const;
