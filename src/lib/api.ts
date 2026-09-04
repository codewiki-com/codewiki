/**
 * The plumbing every static endpoint shares — spec §9. `src/lib/llms.ts` builds the strings and
 * this module is the half that talks to the content collections: it collects the public topics in
 * a stable order and wraps a body in the right headers.
 *
 * Astro writes the body of a static endpoint to disk and the host serves it, so the headers below
 * only apply where a server is in front of the build (dev, preview, an edge rewrite). They are
 * declared anyway: they are the contract the endpoint is meant to serve under.
 */

import { getCollection } from 'astro:content';

import { SITE } from '@/data/site';
import { TRACKS } from '@/data/tracks';
import { isPublic, topicMeta, type Topic } from '@/lib/content';
import { mdUrl, type LlmsTopic } from '@/lib/llms';
import { topicUrl, type Locale } from '@/lib/urls';

const CACHE = 'public, max-age=3600';

/** Position of a track in the registry; unknown tracks sort last rather than throwing. */
const TRACK_ORDER = new Map(TRACKS.map((track, index) => [track.slug, index]));

function trackRank(slug: string): number {
  return TRACK_ORDER.get(slug) ?? TRACKS.length;
}

/**
 * Every public topic of both locales, ordered the way the registry is: track, then slug, then
 * English before Chinese. Endpoints are read by machines and diffed by people, so the order has to
 * be the same on every build.
 */
export async function publicTopics(): Promise<Topic[]> {
  const topics: Topic[] = await getCollection('topics', isPublic);
  return topics.sort((a, b) => {
    const left = topicMeta(a);
    const right = topicMeta(b);
    return (
      trackRank(left.track) - trackRank(right.track) ||
      left.track.localeCompare(right.track) ||
      left.slug.localeCompare(right.slug) ||
      left.lang.localeCompare(right.lang)
    );
  });
}

/** The `YYYY-MM-DD` form the topic pages already publish in their JSON-LD. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Absolute URL of a topic page, and of its Markdown twin. */
export function topicLinks(track: string, slug: string, lang: Locale): { url: string; md: string } {
  return { url: `${SITE.url}${topicUrl(track, slug, lang)}`, md: mdUrl(track, slug, lang) };
}

/** A topic reduced to what the llms.txt indexes list. */
export function toLlmsTopic(topic: Topic): LlmsTopic {
  const { track, slug, lang } = topicMeta(topic);
  return { track, slug, lang, title: topic.data.title, description: topic.data.description };
}

export function json(data: unknown): Response {
  return new Response(`${JSON.stringify(data, null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': CACHE },
  });
}

export function text(body: string): Response {
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': CACHE },
  });
}
