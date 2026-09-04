// Pure topic-id helpers. No Astro imports, so both the content config and the unit tests can use
// them: a topic entry id is `${track}/${slug}/${lang}`, derived from `track/slug.lang.mdx`.
import type { Locale } from '@/lib/urls';

export type TopicId = { track: string; slug: string; lang: Locale };
export type LocalizedId = { slug: string; lang: Locale };

const ID = /^([a-z0-9-]+)\/([a-z0-9-]+)\/(en|zh)$/;
const PATH = /^(.+)\/([^/]+)\.(en|zh)\.mdx$/;
const LOCALIZED_ID = /^([a-z0-9-]+)\/(en|zh)$/;
const LOCALIZED_PATH = /^([a-z0-9-]+)\.(en|zh)\.mdx$/;

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

/** Splits `python/zh` into the filename slug and locale used by a paired collection. */
export function parseLocalizedId(id: string): LocalizedId {
  const m = LOCALIZED_ID.exec(id);
  if (!m) throw new Error(`Not a localized id: ${id}`);
  return { slug: m[1]!, lang: m[2] as Locale };
}

/** Turns a paired collection file (`python.zh.mdx`) into `python/zh`. */
export function localizedIdFromPath(entry: string): string {
  const m = LOCALIZED_PATH.exec(entry);
  if (!m) throw new Error(`Not a localized file path: ${entry}`);
  return `${m[1]}/${m[2]}`;
}
