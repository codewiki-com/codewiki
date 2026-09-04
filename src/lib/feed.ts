/**
 * The RSS feeds — spec §9. One feed per locale (`/rss.xml` and `/zh/rss.xml`) rather than one
 * mixed feed: a reader subscribes to a language, and `<language>` is a channel-level element in
 * RSS 2.0, so two channels is the honest way to say which is which.
 *
 * Both endpoints are three lines each; the selection and the shape of an item live here.
 */
import rss from '@astrojs/rss';

import { SITE } from '@/data/site';
import { publicTopics } from '@/lib/api';
import { topicMeta, type Topic } from '@/lib/content';
import { topicUrl, type Locale } from '@/lib/urls';

/** Spec §9: the feed is a changelog, not an archive. */
export const FEED_LIMIT = 50;

/** RSS `<language>`, matching the `hreflang` values the pages carry. */
const LANGUAGE: Record<Locale, string> = { en: 'en', zh: 'zh-Hans' };

/** When a topic last changed: the review date, or the date its code was last run. */
function publishedAt(topic: Topic): Date {
  return topic.data.reviewed ?? topic.data.verified.date;
}

/** The feed's topics: this locale's public ones, most recently reviewed first, capped at 50. */
export async function feedTopics(locale: Locale): Promise<Topic[]> {
  const topics = await publicTopics();
  return topics
    .filter((topic) => topicMeta(topic).lang === locale)
    .sort((a, b) => publishedAt(b).getTime() - publishedAt(a).getTime())
    .slice(0, FEED_LIMIT);
}

/** The whole feed as a `Response`. `site` comes from the endpoint context, as the docs advise. */
export async function feed(locale: Locale, site: URL | undefined): Promise<Response> {
  const topics = await feedTopics(locale);

  return rss({
    title: `${SITE.name} · ${SITE.tagline[locale]}`,
    description: SITE.tagline[locale],
    site: site ?? SITE.url,
    customData: `<language>${LANGUAGE[locale]}</language>`,
    items: topics.map((topic) => {
      const { track, slug } = topicMeta(topic);
      return {
        title: topic.data.title,
        description: topic.data.description,
        link: topicUrl(track, slug, locale),
        pubDate: publishedAt(topic),
        categories: [track, topic.data.section],
        customData: `<guid isPermaLink="true">${SITE.url}${topicUrl(track, slug, locale)}</guid>`,
      };
    }),
  });
}
