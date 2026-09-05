// Astro-bound helpers over the content collections. Pure id parsing lives in `content-ids.ts`;
// this module imports `astro:content` and therefore only runs inside Astro (not in unit tests).
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { Locale } from '@/lib/urls';
import { parseLocalizedId, parseTopicId, type LocalizedId, type TopicId } from '@/lib/content-ids';

export type Topic = CollectionEntry<'topics'>;
export type Cheatsheet = CollectionEntry<'cheatsheets'>;

/** Drafts and imports are visible while developing and never published. */
export function isPublic<T extends { data: { status: string } }>(t: T): boolean {
  return import.meta.env.DEV || t.data.status === 'reviewed';
}

/**
 * Every topic entry by id, built once per build.
 *
 * `related:` and `prerequisites:` name topics the curriculum plans but nobody has written yet, and
 * that is by design — `PrevNext` renders those as plain text. Asking `getEntry` for one of them
 * logs `[WARN] [content] Entry topics → …/… was not found`, which the build emitted 1,964 times
 * and which buried every warning that mattered. Looking the id up in this index instead answers
 * the same question silently, and {@link reportMissingTopicReferences} states the total once.
 */
let index: Promise<Map<string, Topic>> | undefined;

async function topicIndex(): Promise<Map<string, Topic>> {
  index ??= (async () => {
    const all: Topic[] = await getCollection('topics');
    const map = new Map(all.map((topic) => [topic.id, topic] as const));
    reportMissingTopicReferences(all);
    return map;
  })();
  return index;
}

/** One build line for every planned-but-unwritten reference, in place of one warning each. */
function reportMissingTopicReferences(all: Topic[]): void {
  const ids = new Set(all.map((topic) => topic.id));
  const missing = new Set<string>();
  let references = 0;
  for (const topic of all) {
    const { lang } = parseTopicId(topic.id);
    for (const ref of [...topic.data.prerequisites, ...topic.data.related]) {
      if (ids.has(`${ref}/${lang}`)) continue;
      references += 1;
      missing.add(ref);
    }
  }
  if (missing.size === 0) return;
  console.info(
    `[content] ${references} reference(s) to ${missing.size} unwritten topic(s) in related/prerequisites; ` +
      'they render as plain "soon" text, not as links.',
  );
}

export async function getTopic(track: string, slug: string, lang: Locale): Promise<Topic | undefined> {
  return (await topicIndex()).get(`${track}/${slug}/${lang}`);
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

export async function getCheatsheet(slug: string, lang: Locale): Promise<Cheatsheet | undefined> {
  return getEntry('cheatsheets', `${slug}/${lang}`);
}

/** Public cheatsheets in one language, sorted by their reader-facing titles. */
export async function listCheatsheets(lang: Locale): Promise<Cheatsheet[]> {
  const sheets: Cheatsheet[] = await getCollection(
    'cheatsheets',
    (sheet: Cheatsheet) => parseLocalizedId(sheet.id).lang === lang && isPublic(sheet),
  );
  return sheets.sort((a, b) => a.data.title.localeCompare(b.data.title));
}

/** `{ slug, lang }` of one paired cheatsheet entry. */
export function cheatsheetMeta(sheet: Cheatsheet): LocalizedId {
  return parseLocalizedId(sheet.id);
}
