/**
 * `/api/glossary.json` — the bilingual glossary. Every term with both names, its one-sentence
 * definition in both languages, and the topics that teach it.
 */
import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

import { json } from '@/lib/api';

export const GET = (async () => {
  const terms: CollectionEntry<'glossary'>[] = await getCollection('glossary');

  return json(
    terms
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((term) => ({
        id: term.id,
        en: term.data.en,
        zh: term.data.zh,
        aliases: term.data.aliases,
        short: term.data.short,
        topics: term.data.topics,
      })),
  );
}) satisfies APIRoute;
