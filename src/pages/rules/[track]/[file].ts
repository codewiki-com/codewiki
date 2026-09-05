/** Downloadable CLAUDE.md, AGENTS.md and Cursor rules generated from reviewed topics. */
import type { APIRoute, GetStaticPaths } from 'astro';

import { generatedRulePacks } from '@/lib/generated-packs';
import { cursorFilename, renderAgentsMd, renderClaudeMd, renderCursorMdc } from '@/lib/rules';

interface Props {
  body: string;
}

export const getStaticPaths = (async () => {
  const packs = await generatedRulePacks();
  return [...packs].flatMap(([track, rules]) => {
    const cursorBody = renderCursorMdc(track, rules);
    return [
      { params: { track, file: 'CLAUDE.md' }, props: { body: renderClaudeMd(track, rules) } },
      { params: { track, file: 'AGENTS.md' }, props: { body: renderAgentsMd(track, rules) } },
      { params: { track, file: cursorFilename(track) }, props: { body: cursorBody } },
      // Compatibility alias for links published before the install-ready filename was introduced.
      { params: { track, file: 'cursor.mdc' }, props: { body: cursorBody } },
    ];
  });
}) satisfies GetStaticPaths;

export const GET = (({ props }) =>
  new Response((props as Props).body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })) satisfies APIRoute;
