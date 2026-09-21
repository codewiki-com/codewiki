import { test, expect } from '@playwright/test';

import { pathIds, topicFacts } from './fixtures/content';

test('llms.txt indexes the Markdown twins', async ({ request }) => {
  const response = await request.get('/llms.txt');
  expect(response.ok()).toBe(true);

  const body = await response.text();
  expect(body).toContain('python/closures.md');
  expect(body).toContain('## Chinese');
  expect(body).toContain('/zh/python/closures.md');
});

test('llms-full.txt carries the articles themselves', async ({ request }) => {
  const body = await (await request.get('/llms-full.txt')).text();
  expect(body).toContain('Source: https://codewiki.com/python/closures.md');
  expect(body).toContain('\n---\n');
});

test('a track has its own index', async ({ request }) => {
  const body = await (await request.get('/llms/python.txt')).text();
  expect(body).toContain('# codewiki: Python');
  expect(body).not.toContain('event-loop');
});

test('the topics API lists every public topic in both languages', async ({ request }) => {
  const topics = await (await request.get('/api/topics.json')).json();
  expect(Array.isArray(topics)).toBe(true);
  expect(topics.length).toBeGreaterThanOrEqual(4);

  const closures = topics.find(
    (t: { id: string; lang: string }) => t.id === 'python/closures' && t.lang === 'en',
  );
  expect(closures.url).toBe('https://codewiki.com/python/closures/');
  expect(closures.md).toBe('https://codewiki.com/python/closures.md');
  expect(closures.reviewed).toBe(topicFacts('python', 'closures').modified);
});

test('a concept card carries both languages of one pair', async ({ request }) => {
  const card = await (await request.get('/api/topics/python/closures.json')).json();
  expect(card.title.en).toBe('Closures');
  expect(card.title.zh).toBe('闭包');
  expect(card.md.zh).toBe('https://codewiki.com/zh/python/closures.md');
  expect(card.terms.map((term: { id: string }) => term.id)).toContain('late-binding');
  expect(card.pitfalls.length).toBeGreaterThanOrEqual(1);
});

test('Python rules are published as agent-readable Markdown', async ({ request }) => {
  const response = await request.get('/rules/python/CLAUDE.md');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('text/markdown');
  const body = await response.text();
  expect(body).toMatch(/^# Python rules/);
  expect(body).toMatch(/^-[ ]\S/m);
});

test('Cursor rules use install-ready frontmatter and keep the old URL as an alias', async ({ request }) => {
  const canonical = await request.get('/rules/python/codewiki-python.mdc');
  const alias = await request.get('/rules/python/cursor.mdc');
  expect(canonical.ok()).toBe(true);
  const body = await canonical.text();
  expect(await alias.text()).toBe(body);

  expect(body).toContain('description: "codewiki Python pitfalls and review checks"');
  expect(body).toContain('globs: ["**/*.py"]');
  expect(body).toContain('alwaysApply: false');
});

test('the Python functions context pack contains the closures twin', async ({ request }) => {
  const response = await request.get('/packs/python/functions-deeper.md');
  expect(response.ok()).toBe(true);
  const body = await response.text();
  expect(body).toContain('[Closures](https://codewiki.com/python/closures/)');
  expect(body).toContain('# Closures');
  expect(body).toContain('Source: https://codewiki.com/python/closures/');
});

test('llms.txt lists the generated rules and context packs', async ({ request }) => {
  const body = await (await request.get('/llms.txt')).text();
  expect(body).toContain('## Rules packs');
  expect(body).toContain('/rules/python/CLAUDE.md');
  expect(body).toContain('/rules/python/codewiki-python.mdc');
  expect(body).not.toContain('/rules/python/cursor.mdc');
  expect(body).toContain('## Context packs');
  expect(body).toContain('/packs/python/functions-deeper.md');
});

test('the glossary and paths APIs are readable JSON', async ({ request }) => {
  const glossary = await (await request.get('/api/glossary.json')).json();
  expect(glossary.find((term: { id: string }) => term.id === 'closure').zh).toBe('闭包');

  const paths = await (await request.get('/api/paths.json')).json();
  expect(paths[0].milestones.length).toBeGreaterThan(0);
  expect(paths[0].url).toBe(`https://codewiki.com/paths/${pathIds()[0]}/`);
});

test('robots.txt allows everything and names the sitemap', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  expect(body).toContain('User-agent: *');
  expect(body).toContain('Sitemap: https://codewiki.com/sitemap-index.xml');
});

test('the settings page remembers the font size', async ({ page }) => {
  await page.goto('/settings/');
  await expect(page.locator('h1')).toHaveText('Settings');

  await page.locator('[data-setting="font"] [data-value="l"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-font', 'l');

  // The preference lives in this browser, so the next load applies it before first paint.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-font', 'l');
  await expect(page.locator('[data-setting="font"] [data-value="l"]')).toHaveAttribute(
    'aria-checked',
    'true',
  );
});

test('the font size scales the whole prose column, not only its paragraphs', async ({ page }) => {
  const sizes = async () =>
    page.evaluate(() => {
      const size = (selector: string) => {
        const node = document.querySelector(selector);
        return node ? getComputedStyle(node).fontSize : '';
      };
      return {
        p: size('#article div[data-depth] > p'),
        li: size('#article li'),
        // Smaller type of its own, which the preference must not flatten.
        tldr: size('#article .tldr-text p'),
      };
    });

  await page.goto('/python/closures/');
  expect(await sizes()).toEqual({ p: '16px', li: '16px', tldr: '14px' });

  await page.goto('/settings/');
  await page.locator('[data-setting="font"] [data-value="l"]').click();

  await page.goto('/python/closures/');
  await expect(page.locator('html')).toHaveAttribute('data-font', 'l');
  expect(await sizes()).toEqual({ p: '17.5px', li: '17.5px', tldr: '14px' });
});

test('the settings page exports and clears this browser', async ({ page }) => {
  await page.goto('/settings/');
  await page.evaluate(() => localStorage.setItem('cw:v1:recents', JSON.stringify({ pages: ['/python/'] })));

  const download = await Promise.all([
    page.waitForEvent('download'),
    page.locator('[data-action="export"]').click(),
  ]).then(([event]) => event);
  expect(download.suggestedFilename()).toMatch(/^codewiki-\d{4}-\d{2}-\d{2}\.json$/);

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('[data-action="clear"]').click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('cw:v1:recents'))).toBeNull();
});

test('the Chinese settings page is in Chinese without a feed', async ({ page }) => {
  await page.goto('/zh/settings/');
  await expect(page.locator('h1')).toHaveText('设置');
  await expect(page.locator('link[type="application/rss+xml"]')).toHaveCount(0);
});
