import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { SitemapItem } from '@astrojs/sitemap';

/** Content dates, never the build time: rebuilding an unchanged page is not a content update. */
export function contentModificationDates(root = process.cwd()): Map<string, string> {
  const dates = new Map<string, string>();
  for (const collection of ['topics', 'cheatsheets']) {
    const directory = path.join(root, 'src/content', collection);
    for (const file of readdirSync(directory, { recursive: true, encoding: 'utf8' })) {
      const match = file.replaceAll(path.sep, '/').match(/^(.*)\.(en|zh)\.mdx$/);
      if (!match) continue;
      const { data } = matter(readFileSync(path.join(directory, file), 'utf8'));
      if (data.status !== 'reviewed') continue;
      const modified = data.reviewed ?? data.verified?.date;
      if (!modified) continue;
      const date = new Date(modified);
      if (Number.isNaN(date.getTime())) throw new Error(`Invalid sitemap date: ${file}`);
      const prefix = match[2] === 'zh' ? '/zh' : '';
      const section = collection === 'cheatsheets' ? '/cheatsheets' : '';
      dates.set(`${prefix}${section}/${match[1]}/`, date.toISOString().slice(0, 10));
    }
  }
  return dates;
}

export function sitemapMetadata(item: SitemapItem, dates: Map<string, string>): SitemapItem {
  const lastmod = dates.get(new URL(item.url).pathname);
  const english = item.links?.find((link) => link.lang === 'en');
  return {
    ...item,
    ...(lastmod ? { lastmod } : {}),
    ...(english && !item.links?.some((link) => link.lang === 'x-default')
      ? { links: [...(item.links ?? []), { lang: 'x-default', url: english.url }] }
      : {}),
  };
}
