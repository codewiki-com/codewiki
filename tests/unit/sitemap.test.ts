import { contentModificationDates, sitemapMetadata } from '../../scripts/sitemap-metadata';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

describe('sitemap content metadata', () => {
  it('uses reviewed content dates for localized topics and cheatsheets', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'codewiki-sitemap-'));
    try {
      mkdirSync(path.join(root, 'src/content/topics/python'), { recursive: true });
      mkdirSync(path.join(root, 'src/content/cheatsheets'), { recursive: true });
      for (const [file, frontmatter] of Object.entries({
        'topics/python/closures.en.mdx': 'status: reviewed\nreviewed: 2026-09-04',
        'topics/python/closures.zh.mdx': 'status: reviewed\nreviewed: 2026-09-05',
        'topics/python/draft.en.mdx': 'status: draft\nreviewed: 2026-09-04',
        'cheatsheets/python.en.mdx': 'status: reviewed\nverified: { date: 2026-09-03 }',
      }))
        writeFileSync(path.join(root, 'src/content', file), `---\n${frontmatter}\n---\n`);
      expect([...contentModificationDates(root)]).toEqual([
        ['/python/closures/', '2026-09-04'],
        ['/zh/python/closures/', '2026-09-05'],
        ['/cheatsheets/python/', '2026-09-03'],
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('adds the real modification date and the English default alternate', () => {
    const english = { lang: 'en', url: 'https://codewiki.com/python/closures/' };
    const chinese = { lang: 'zh-Hans', url: 'https://codewiki.com/zh/python/closures/' };
    const item = { url: chinese.url, links: [english, chinese] };
    const result = sitemapMetadata(item, new Map([['/zh/python/closures/', '2026-09-04']]));
    expect(result.lastmod).toBe('2026-09-04');
    expect(result.links).toEqual([english, chinese, { lang: 'x-default', url: english.url }]);
    expect(sitemapMetadata(result, new Map()).links).toHaveLength(3);
    expect(sitemapMetadata({ url: 'https://codewiki.com/' }, new Map())).not.toHaveProperty('lastmod');
  });
});
