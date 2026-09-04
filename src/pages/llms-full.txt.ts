/**
 * `/llms-full.txt` — every public article, both locales, in one file. The bodies are the authored
 * Markdown straight from the collection, so a topic's component tags travel with it; the per-page
 * Markdown twin is where those are transformed away.
 */
import type { APIRoute } from 'astro';

import { publicTopics, text, topicLinks } from '@/lib/api';
import { buildLlmsFull, type LlmsEntry } from '@/lib/llms';
import { topicMeta } from '@/lib/content';

export const GET = (async () => {
  const topics = await publicTopics();
  const entries: LlmsEntry[] = topics.map((topic) => {
    const { track, slug, lang } = topicMeta(topic);
    return {
      title: topic.data.title,
      source: topicLinks(track, slug, lang).md,
      body: topic.body ?? '',
    };
  });
  return text(buildLlmsFull(entries));
}) satisfies APIRoute;
