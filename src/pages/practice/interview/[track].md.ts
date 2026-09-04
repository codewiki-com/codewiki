/** The English Markdown twin of every interview bank. */
import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

import { SITE } from '@/data/site';
import { getTrack } from '@/data/tracks';
import { t } from '@/i18n';
import { listTopics, topicMeta } from '@/lib/content';
import { stripMarkdown } from '@/lib/md';
import { localizePath, topicUrl } from '@/lib/urls';
import type { Interview, InterviewItem } from '@/schemas/interview';

export async function getStaticPaths() {
  const banks: CollectionEntry<'interview'>[] = await getCollection('interview');
  return banks.map((bank) => ({ params: { track: bank.data.track }, props: { bank } }));
}

export const GET: APIRoute = async ({ props }) => {
  const locale = 'en' as const;
  const bank = props.bank as CollectionEntry<'interview'>;
  const interview = bank.data as Interview;
  const track = getTrack(interview.track);
  if (!track) throw new Error(`Interview bank ${bank.id} names an unknown track`);

  const topics = await listTopics(locale);
  const topicById = new Map(
    topics.map((topic) => [`${topicMeta(topic).track}/${topicMeta(topic).slug}`, topic]),
  );
  const path = localizePath(`/practice/interview/${track.slug}/`, locale);
  const title = t(locale, 'interview.title', { Track: track.name[locale] });
  const sections = interview.items.map((item: InterviewItem, index: number) => {
    const links = item.topics.map((ref: string) => {
      const [topicTrack = '', slug = ''] = ref.split('/');
      const topic = topicById.get(ref);
      return `[${topic?.data.title ?? slug}](${SITE.url}${topicUrl(topicTrack, slug, locale)})`;
    });
    return [
      `## ${index + 1}. ${stripMarkdown(item.question[locale])}`,
      item.answer[locale].trim(),
      `${t(locale, 'interview.readMore')}: ${links.join(', ')}`,
    ].join('\n\n');
  });
  const body = `# ${title}\n\nSource: ${SITE.url}${path}\n\n${sections.join('\n\n')}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
