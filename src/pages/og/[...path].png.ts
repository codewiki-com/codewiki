/**
 * One 1200×630 PNG per shareable page, written at build time to the exact URLs `seo.ts` puts in
 * `og:image` — `/og/{track}/{slug}.png`, `/og/{track}.png`, `/og/home.png` and their `/og/zh/…`
 * counterparts. The card content and the path list both come from `src/lib/og.ts`, so the routes
 * and the head tags cannot drift apart.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { ogEntries, renderOg, type OgEntry } from '@/lib/og';

export const getStaticPaths: GetStaticPaths = () =>
  ogEntries().map((entry) => ({ params: { path: entry.path }, props: { entry } }));

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg((props as { entry: OgEntry }).entry);
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      // Content-addressed by page path and only rebuilt with the site, so it can be held forever.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
