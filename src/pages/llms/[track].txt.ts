/**
 * `/llms/{track}.txt` — the same index narrowed to one track, both locales. One file per track
 * that has something written in it; empty tracks would be an index of nothing.
 */
import type { APIRoute, GetStaticPaths } from 'astro';

import { publicTopics, text, toLlmsTopic } from '@/lib/api';
import { getTrack, type Track } from '@/data/tracks';
import { topicMeta } from '@/lib/content';
import { buildLlmsTrack, type LlmsTopic } from '@/lib/llms';

interface Props {
  track: Track;
  topics: LlmsTopic[];
}

export const getStaticPaths = (async () => {
  const topics = await publicTopics();
  const slugs = [...new Set(topics.map((topic) => topicMeta(topic).track))];

  return slugs.flatMap((slug) => {
    const track = getTrack(slug);
    if (!track) return [];
    const own = topics.filter((topic) => topicMeta(topic).track === slug).map(toLlmsTopic);
    return [{ params: { track: slug }, props: { track, topics: own } satisfies Props }];
  });
}) satisfies GetStaticPaths;

export const GET = (({ props }) => {
  const { track, topics } = props as Props;
  return text(buildLlmsTrack(track, topics));
}) satisfies APIRoute;
