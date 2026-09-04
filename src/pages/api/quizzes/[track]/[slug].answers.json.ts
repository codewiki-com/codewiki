/** Answer-bearing quiz banks for the local flashcard reviewer. No practice page links this route. */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

import { json } from '@/lib/api';
import type { QuizCardBank } from '@/lib/cards';

interface Props {
  bank: QuizCardBank;
}

export const getStaticPaths = (async () => {
  const banks: CollectionEntry<'quizzes'>[] = await getCollection('quizzes');
  return banks.map((entry) => {
    const [track, slug] = entry.id.split('/');
    const bank = { id: entry.id, topic: entry.data.topic, items: entry.data.items };
    return { params: { track, slug }, props: { bank } satisfies Props };
  });
}) satisfies GetStaticPaths;

export const GET = (({ props }) => json((props as Props).bank)) satisfies APIRoute;
