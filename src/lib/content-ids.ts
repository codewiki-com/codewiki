// Pure topic-id helpers. No Astro imports, so both the content config and the unit tests can use
// them: a topic entry id is `${track}/${slug}/${lang}`, derived from `track/slug.lang.mdx`.
import type { Locale } from '@/lib/urls';

export type TopicId = { track: string; slug: string; lang: Locale };

const ID = /^([a-z0-9-]+)\/([a-z0-9-]+)\/(en|zh)$/;
const PATH = /^(.+)\/([^/]+)\.(en|zh)\.mdx$/;

/** Splits `python/closures/zh` into its parts. Throws on anything that is not a topic id. */
export function parseTopicId(id: string): TopicId {
  const m = ID.exec(id);
  if (!m) throw new Error(`Not a topic id: ${id}`);
  return { track: m[1]!, slug: m[2]!, lang: m[3] as Locale };
}

/** Turns a collection-relative file path (`python/closures.zh.mdx`) into a topic id. */
export function topicIdFromPath(entry: string): string {
  const m = PATH.exec(entry);
  if (!m) throw new Error(`Not a topic file path: ${entry}`);
  return `${m[1]}/${m[2]}/${m[3]}`;
}
