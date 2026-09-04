/**
 * `/api/paths.json` — the learning paths, milestones and prerequisite edges included, so a client
 * can draw the same map the path pages do. Topics are named by `track/slug`, which is the id
 * `/api/topics.json` and the concept cards use.
 */
import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

import { json } from '@/lib/api';

export const GET = (async () => {
  const paths: CollectionEntry<'paths'>[] = await getCollection('paths');

  return json(
    paths
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((path) => ({
        id: path.id,
        title: path.data.title,
        description: path.data.description,
        tracks: path.data.tracks,
        level: path.data.level,
        hours: path.data.hours,
        outcomes: path.data.outcomes,
        milestones: path.data.milestones,
        edges: path.data.edges,
      })),
  );
}) satisfies APIRoute;
