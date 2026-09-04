/**
 * `/api/topics.json` — every public topic of both locales, one row each. The flat list a client
 * needs to build its own index; the concept card at `/api/topics/{track}/{slug}.json` is the
 * per-topic view of the same data.
 */
import type { APIRoute } from 'astro';

import { isoDate, json, publicTopics, topicLinks } from '@/lib/api';
import { topicMeta } from '@/lib/content';

export const GET = (async () => {
  const topics = await publicTopics();

  return json(
    topics.map((topic) => {
      const { track, slug, lang } = topicMeta(topic);
      const { url, md } = topicLinks(track, slug, lang);
      const data = topic.data;
      return {
        id: `${track}/${slug}`,
        track,
        section: data.section,
        lang,
        title: data.title,
        description: data.description,
        url,
        md,
        difficulty: data.difficulty,
        reviewed: data.reviewed ? isoDate(data.reviewed) : null,
        verified: { version: data.verified.version, date: isoDate(data.verified.date) },
      };
    }),
  );
}) satisfies APIRoute;
