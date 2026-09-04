/** Every runnable fence from public topics, for the playground's example picker. */
import type { APIRoute } from 'astro';

import { json, publicTopics } from '@/lib/api';
import { topicMeta } from '@/lib/content';
import { runnableFences } from '@/lib/examples';
import { topicUrl } from '@/lib/urls';

export const GET = (async () => {
  const topics = await publicTopics();
  const examples = topics.flatMap((topic) => {
    const { track, slug, lang: locale } = topicMeta(topic);
    return runnableFences(topic.body ?? '').map((fence, index) => {
      return {
        id: `${track}/${slug}/${locale}/${index}`,
        ...fence,
        title: fence.title ?? `${slug}-${index + 1}`,
        locale,
        topic: { title: topic.data.title, url: topicUrl(track, slug, locale) },
      };
    });
  });

  return json(examples);
}) satisfies APIRoute;
