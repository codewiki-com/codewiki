/** Downloadable CLAUDE.md, AGENTS.md and Cursor rules generated from reviewed topics. */
import type { APIRoute, GetStaticPaths } from 'astro';

import { generatedRulePacks } from '@/lib/generated-packs';
import { renderAgentsMd, renderClaudeMd, renderCursorMdc } from '@/lib/rules';

interface Props {
  body: string;
}

export const getStaticPaths = (async () => {
  const packs = await generatedRulePacks();
  return [...packs].flatMap(([track, rules]) => [
    { params: { track, file: 'CLAUDE.md' }, props: { body: renderClaudeMd(track, rules) } },
    { params: { track, file: 'AGENTS.md' }, props: { body: renderAgentsMd(track, rules) } },
    { params: { track, file: 'cursor.mdc' }, props: { body: renderCursorMdc(track, rules) } },
  ]);
}) satisfies GetStaticPaths;

export const GET = (({ props }) =>
  new Response((props as Props).body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })) satisfies APIRoute;
