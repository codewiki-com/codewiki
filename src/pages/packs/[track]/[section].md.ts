/** Plain-Markdown context packs, one or more size-bounded files per reviewed track section. */
import type { APIRoute, GetStaticPaths } from 'astro';

import { generatedContextPacks } from '@/lib/generated-packs';

interface Props {
  body: string;
}

export const getStaticPaths = (async () => {
  const files = await generatedContextPacks();
  return files.map((file) => ({
    params: { track: file.track, section: file.filename.replace(/\.md$/, '') },
    props: { body: file.body },
  }));
}) satisfies GetStaticPaths;

export const GET = (({ props }) =>
  new Response((props as Props).body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })) satisfies APIRoute;
