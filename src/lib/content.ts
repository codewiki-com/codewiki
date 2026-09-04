// Astro-bound helpers over the content collections. Pure id parsing lives in `content-ids.ts`;
// this module imports `astro:content` and therefore only runs inside Astro (not in unit tests).
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { Locale } from '@/lib/urls';
import { parseTopicId, type TopicId } from '@/lib/content-ids';

export type Topic = CollectionEntry<'topics'>;

/** Drafts and imports are visible while developing and never published. */
export function isPublic(t: Topic): boolean {
  return import.meta.env.DEV || t.data.status === 'reviewed';
}

export async function getTopic(track: string, slug: string, lang: Locale): Promise<Topic | undefined> {
  return getEntry('topics', `${track}/${slug}/${lang}`);
}

/** Both language variants of one topic, for the language switch and the alignment check. */
export async function getPair(track: string, slug: string): Promise<{ en?: Topic; zh?: Topic }> {
  const [en, zh] = await Promise.all([getTopic(track, slug, 'en'), getTopic(track, slug, 'zh')]);
  return { en, zh };
}

export async function listTopics(
  lang: Locale,
  f: { track?: string; section?: string; status?: Topic['data']['status'] } = {},
): Promise<Topic[]> {
  const all: Topic[] = await getCollection(
    'topics',
    (t: Topic) =>
      parseTopicId(t.id).lang === lang &&
      isPublic(t) &&
      (!f.track || t.data.track === f.track) &&
      (!f.section || t.data.section === f.section) &&
      (!f.status || t.data.status === f.status),
  );
  return all.sort((a, b) => a.data.title.localeCompare(b.data.title));
}

/** `{ track, slug, lang }` of a topic entry. */
export function topicMeta(t: Topic): TopicId {
  return parseTopicId(t.id);
}
