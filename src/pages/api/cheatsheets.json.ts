/** `/api/cheatsheets.json`: localized sheets and their authored section/row structure. */
import type { APIRoute } from 'astro';

import { cheatsheetLinks, json, publicCheatsheets } from '@/lib/api';
import { cheatsheetMeta } from '@/lib/content';
import { extractCheatsheetRows } from '@/lib/markdown-twin';

export const GET = (async () => {
  const sheets = await publicCheatsheets();
  return json(
    sheets.map((sheet) => {
      const { slug, lang } = cheatsheetMeta(sheet);
      const { url, md } = cheatsheetLinks(slug, lang);
      return {
        id: sheet.id,
        title: sheet.data.title,
        url,
        md,
        rows: extractCheatsheetRows(sheet.body ?? ''),
      };
    }),
  );
}) satisfies APIRoute;
