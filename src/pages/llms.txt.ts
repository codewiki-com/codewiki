/**
 * `/llms.txt` — the whole site as one Markdown index, for a model that would rather read the
 * corpus than crawl it. Every link points at a topic's Markdown twin.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

import { publicCheatsheets, publicTopics, text, toLlmsCheatsheet, toLlmsTopic } from '@/lib/api';
import { buildLlmsIndex } from '@/lib/llms';
import { getTrack } from '@/data/tracks';
import { generatedContextPacks, generatedRulePacks } from '@/lib/generated-packs';
import { cursorFilename } from '@/lib/rules';

export const GET = (async () => {
  const [topics, glossary, paths, cheatsheets, rules, contexts] = await Promise.all([
    publicTopics(),
    getCollection('glossary'),
    getCollection('paths'),
    publicCheatsheets(),
    generatedRulePacks(),
    generatedContextPacks(),
  ]);
  const rulesPacks = [...rules.keys()].flatMap((track) => {
    const name = getTrack(track)?.name.en ?? track;
    return ['CLAUDE.md', 'AGENTS.md', cursorFilename(track)].map((file) => ({
      label: `${name} ${file}`,
      url: `https://codewiki.com/rules/${track}/${file}`,
      description: `${rules.get(track)?.length ?? 0} rules from reviewed ${name} topics.`,
    }));
  });
  const contextPacks = contexts.map((file) => ({
    label: `${getTrack(file.track)?.name.en ?? file.track} ${file.section}`,
    url: file.url,
    description: 'Reviewed topic Markdown for one track section.',
  }));
  return text(
    buildLlmsIndex(
      topics.map(toLlmsTopic),
      glossary.length,
      paths.length,
      cheatsheets.map(toLlmsCheatsheet),
      rulesPacks,
      contextPacks,
    ),
  );
}) satisfies APIRoute;
