/** `/api/quizzes/{track}/{slug}.json` — one quiz bank with all answer fields removed. */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

import { json } from '@/lib/api';
import { stripAnswers, type PublicQuizBank } from '@/lib/practice';

interface Props {
  bank: PublicQuizBank;
}

export const getStaticPaths = (async () => {
  const banks: CollectionEntry<'quizzes'>[] = await getCollection('quizzes');

  return banks.map((bank) => {
    const [track, slug] = bank.id.split('/');
    return { params: { track, slug }, props: { bank: stripAnswers(bank) } satisfies Props };
  });
}) satisfies GetStaticPaths;

export const GET = (({ props }) => json((props as Props).bank)) satisfies APIRoute;
