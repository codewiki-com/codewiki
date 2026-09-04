/**
 * The Markdown twin of every Chinese topic: `/zh/python/closures/` is also `/zh/python/closures.md`.
 *
 * The page's own "Copy as Markdown" action links here, and so does anything that reads the site
 * with a machine — the twin is the same text with the MDX shell taken off (spec §6). The route is
 * written per locale, as the topic pages are, so each one states its own locale exactly once.
 */
import type { APIRoute } from 'astro';

import { SITE } from '@/data/site';
import { listTopics, topicMeta, type Topic } from '@/lib/content';
import { toPlainMarkdown } from '@/lib/markdown-twin';
import { topicUrl } from '@/lib/urls';

export async function getStaticPaths() {
  const topics = await listTopics('zh');
  return topics.map((topic) => {
    const { track, slug } = topicMeta(topic);
    return { params: { track, slug }, props: { topic } };
  });
}

export const GET: APIRoute = ({ props }) => {
  const topic = props.topic as Topic;
  const { track, slug } = topicMeta(topic);
  const body = toPlainMarkdown(topic.body ?? '', {
    locale: 'zh',
    title: topic.data.title,
    url: `${SITE.url}${topicUrl(track, slug, 'zh')}`,
  });

  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
