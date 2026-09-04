/** Astro-backed collection loading for generated rule and context-pack endpoints. */
import { SITE } from '@/data/site';
import { listTopics, topicMeta } from '@/lib/content';
import { toPlainMarkdown } from '@/lib/markdown-twin';
import { buildContextPackFiles, type ContextPackFile, type PackTopic } from '@/lib/packs';
import { extractRules, type Rule } from '@/lib/rules';
import { topicUrl } from '@/lib/urls';

let rulesPromise: Promise<Map<string, Rule[]>> | undefined;
let contextPromise: Promise<ContextPackFile[]> | undefined;

export function generatedRulePacks(): Promise<Map<string, Rule[]>> {
  rulesPromise ??= listTopics('en', { status: 'reviewed' }).then((topics) => {
    const packs = new Map<string, Rule[]>();
    for (const topic of topics) {
      const { track, slug } = topicMeta(topic);
      const own = extractRules(topic.body ?? '', {
        title: topic.data.title,
        url: `${SITE.url}${topicUrl(track, slug, 'en')}`,
      });
      if (own.length > 0) packs.set(track, [...(packs.get(track) ?? []), ...own]);
    }
    return packs;
  });
  return rulesPromise;
}

export function generatedContextPacks(): Promise<ContextPackFile[]> {
  contextPromise ??= listTopics('en', { status: 'reviewed' }).then((topics) => {
    const groups = new Map<string, PackTopic[]>();
    for (const topic of topics) {
      const { track, slug } = topicMeta(topic);
      const url = `${SITE.url}${topicUrl(track, slug, 'en')}`;
      const packTopic: PackTopic = {
        track,
        section: topic.data.section,
        title: topic.data.title,
        url,
        markdown: toPlainMarkdown(topic.body ?? '', { locale: 'en', title: topic.data.title, url }),
      };
      const key = `${track}/${topic.data.section}`;
      groups.set(key, [...(groups.get(key) ?? []), packTopic]);
    }
    return [...groups.values()].flatMap((group) => buildContextPackFiles(group));
  });
  return contextPromise;
}
