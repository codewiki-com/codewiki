/** Plain-Markdown twins of the English cheatsheets. */
import type { APIRoute } from 'astro';

import { SITE } from '@/data/site';
import { cheatsheetMeta, listCheatsheets, type Cheatsheet } from '@/lib/content';
import { toPlainMarkdown } from '@/lib/markdown-twin';

export async function getStaticPaths() {
  const sheets = await listCheatsheets('en');
  return sheets.map((sheet) => ({ params: { slug: cheatsheetMeta(sheet).slug }, props: { sheet } }));
}

export const GET: APIRoute = ({ props }) => {
  const sheet = props.sheet as Cheatsheet;
  const { slug } = cheatsheetMeta(sheet);
  return new Response(
    toPlainMarkdown(sheet.body ?? '', {
      locale: 'en',
      title: sheet.data.title,
      url: `${SITE.url}/cheatsheets/${slug}/`,
    }),
    { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } },
  );
};
