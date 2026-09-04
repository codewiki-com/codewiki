/** Every runnable fence from public topics, for the playground's example picker. */
import type { APIRoute } from 'astro';

import { json, publicTopics } from '@/lib/api';
import { topicMeta } from '@/lib/content';
import { normalizeLang } from '@/lib/runners/protocol';
import { topicUrl } from '@/lib/urls';

const FENCE = /^ {0,3}(`{3,}|~{3,})([^\r\n]*)\r?\n([\s\S]*?)^ {0,3}\1[ \t]*$/gm;

function attribute(meta: string, name: string): string | undefined {
  const match = meta.match(new RegExp(`(?:^|\\s)${name}=(['"])(.*?)\\1`));
  return match?.[2];
}

export const GET = (async () => {
  const topics = await publicTopics();
  const examples = topics.flatMap((topic) => {
    const { track, slug, lang: locale } = topicMeta(topic);
    const rows = [];
    let match: RegExpExecArray | null;
    let index = 0;

    FENCE.lastIndex = 0;
    while ((match = FENCE.exec(topic.body ?? ''))) {
      const meta = (match[2] ?? '').trim();
      if (!/(?:^|\s)run(?:\s|$)/.test(meta)) continue;
      const fenceLang = meta.split(/\s+/, 1)[0] ?? '';
      const lang = normalizeLang(fenceLang);
      if (!lang) continue;

      const title = attribute(meta, 'title') ?? `${slug}-${index + 1}`;
      const tests = attribute(meta, 'tests');
      rows.push({
        id: `${track}/${slug}/${locale}/${index}`,
        lang,
        title,
        code: (match[3] ?? '').replace(/\r?\n$/, ''),
        ...(tests ? { tests } : {}),
        locale,
        topic: { title: topic.data.title, url: topicUrl(track, slug, locale) },
      });
      index += 1;
    }

    return rows;
  });

  return json(examples);
}) satisfies APIRoute;
