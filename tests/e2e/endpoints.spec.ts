import { test, expect } from '@playwright/test';

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
  expect(closures.reviewed).toBe('2026-09-03');
});

test('a concept card carries both languages of one pair', async ({ request }) => {
  const card = await (await request.get('/api/topics/python/closures.json')).json();
  expect(card.title.en).toBe('Closures');
  expect(card.title.zh).toBe('闭包');
  expect(card.md.zh).toBe('https://codewiki.com/zh/python/closures.md');
  expect(card.terms.map((term: { id: string }) => term.id)).toContain('late-binding');
});

test('the glossary and paths APIs are readable JSON', async ({ request }) => {
  const glossary = await (await request.get('/api/glossary.json')).json();
  expect(glossary.find((term: { id: string }) => term.id === 'closure').zh).toBe('闭包');

  const paths = await (await request.get('/api/paths.json')).json();
  expect(paths[0].milestones.length).toBeGreaterThan(0);
});

test('each locale has its own feed', async ({ request }) => {
  const english = await (await request.get('/rss.xml')).text();
  expect(english).toContain('<?xml');
  expect(english).toContain('<item>');
  expect(english).toContain('<language>en</language>');
  expect(english).toContain('https://codewiki.com/python/closures/');

  const chinese = await (await request.get('/zh/rss.xml')).text();
  expect(chinese).toContain('<language>zh-Hans</language>');
  expect(chinese).toContain('https://codewiki.com/zh/python/closures/');
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

test('the Chinese settings page is in Chinese and links its own feed', async ({ page }) => {
  await page.goto('/zh/settings/');
  await expect(page.locator('h1')).toHaveText('设置');
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
    'href',
    '/zh/rss.xml',
  );
});
