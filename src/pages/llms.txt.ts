/**
 * `/llms.txt` — the whole site as one Markdown index, for a model that would rather read the
 * corpus than crawl it. Every link points at a topic's Markdown twin.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

import { publicTopics, text, toLlmsTopic } from '@/lib/api';
import { buildLlmsIndex } from '@/lib/llms';

export const GET = (async () => {
  const [topics, glossary, paths] = await Promise.all([
    publicTopics(),
    getCollection('glossary'),
    getCollection('paths'),
  ]);
  return text(buildLlmsIndex(topics.map(toLlmsTopic), glossary.length, paths.length));
}) satisfies APIRoute;
