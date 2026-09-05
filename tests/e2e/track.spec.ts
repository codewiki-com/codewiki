import { test, expect } from '@playwright/test';

test('the English hub lists the topics of a track', async ({ page }) => {
  await page.goto('/python/');
  await expect(page.locator('h1')).toHaveText('Python');
  await expect(page.locator('.topic[data-topic-id="python/closures"] .t')).toHaveText('Closures');
  await expect(page.locator('.topic[data-topic-id="python/closures"]')).toHaveAttribute(
    'href',
    '/python/closures/',
  );
});

test('the Chinese hub lists the same topics in Chinese', async ({ page }) => {
  await page.goto('/zh/python/');
  await expect(page.locator('.topic[data-topic-id="python/closures"] .t')).toHaveText('闭包');
});

test('the Python hub links only the related pages that now exist', async ({ page }) => {
  await page.goto('/python/');

  await expect(page.locator('.shortcuts a.quick', { hasText: 'Cheatsheet' })).toHaveAttribute(
    'href',
    '/cheatsheets/python/',
  );
  await expect(page.locator('.shortcuts a.quick', { hasText: 'Interview bank' })).toHaveAttribute(
    'href',
    '/practice/interview/python/',
  );
  await expect(page.locator('.shortcuts .quick[aria-disabled="true"]', { hasText: 'Compare' })).toBeVisible();
  await expect(page.locator('.shortcuts a.quick', { hasText: 'Playground' })).toHaveAttribute(
    'href',
    '/playground/?lang=python',
  );

  const also = page.locator('.also');
  await expect(also.getByRole('link', { name: 'Python cheatsheet' })).toHaveAttribute(
    'href',
    '/cheatsheets/python/',
  );
  await expect(also.getByRole('link', { name: 'Interview bank: Python' })).toHaveAttribute(
    'href',
    '/practice/interview/python/',
  );
  await expect(also.getByRole('link', { name: 'Glossary: Python terms' })).toHaveAttribute(
    'href',
    '/glossary/',
  );
  await expect(also.locator('.also-soon', { hasText: 'Python compared with other languages' })).toBeVisible();
  await expect(page.locator('.path-map')).toHaveAttribute('href', '/paths/python-from-zero/');
});

test('both hubs carry hreflang links to each other', async ({ page }) => {
  await page.goto('/python/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    'href',
    'https://codewiki.com/python/',
  );
  await expect(page.locator('link[rel="alternate"][hreflang="zh-Hans"]')).toHaveAttribute(
    'href',
    'https://codewiki.com/zh/python/',
  );
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
});

test('sections with nothing written yet say so', async ({ page }) => {
  await page.goto('/python/');
  // Which sections are still empty is a content fact; that an empty one says so is the behaviour.
  const empty = page.locator('.collapsed .quick');
  expect(await empty.count()).toBeGreaterThan(0);
  await expect(empty.first()).toContainText('coming soon');
  await expect(empty.first().locator('.collapsed-name')).not.toBeEmpty();
});

test('the difficulty filter is a keyboard radio group', async ({ page }) => {
  await page.goto('/python/');
  const group = page.locator('[data-filter-group="difficulty"]');
  await group.locator('[data-value="all"]').focus();
  await page.keyboard.press('ArrowRight');

  const beginner = group.locator('[data-value="beginner"]');
  await expect(beginner).toHaveAttribute('aria-checked', 'true');
  await expect(beginner).toBeFocused();
  await expect(group.locator('[data-value="all"]')).toHaveAttribute('aria-checked', 'false');
  // The one written Python topic is intermediate, so filtering to beginner hides it.
  await expect(page.locator('.topic[data-topic-id="python/closures"]')).toBeHidden();
});

/* docs/design/flagship-tracks.md: the six curated starting tracks are promised first, and every
   card on the index states its counts. */

test('the tracks index leads with the six flagship tracks', async ({ page }) => {
  await page.goto('/tracks/');

  const sections = page.locator('.page > section');
  await expect(sections.first().locator('h2')).toHaveText('Flagship');
  await expect(sections.first().locator('.hint')).toHaveText('where to start');

  const flagship = sections.first().locator('.grid .track');
  await expect(flagship).toHaveCount(6);
  await expect(flagship.locator('.name')).toHaveText([
    'Python',
    'JavaScript',
    'TypeScript',
    'Go',
    'Rust',
    'CS foundations',
  ]);

  // Every card states its depth rather than implying it.
  for (const counts of await flagship.locator('.counts').allTextContents()) {
    expect(counts).toMatch(/^\d+ topics · \d+ exercises$/);
  }

  await expect(page.locator('.rest-head h2')).toHaveText('More tracks');
  await expect(page.locator('.rest-head .hint')).toHaveText('growing');
  // Nothing is deleted: the six are listed once, and the other sixteen follow.
  await expect(page.locator('.rest .grid .track')).toHaveCount(16);
  await expect(page.locator('.head p')).toHaveText('6 tracks to start with, 16 more growing behind them.');
});

test('a flagship hub says so on its eyebrow line, an ordinary one does not', async ({ page }) => {
  await page.goto('/python/');
  await expect(page.locator('.crumbs .flagship')).toHaveText('Flagship');

  await page.goto('/php/');
  await expect(page.locator('.crumbs .flagship')).toHaveCount(0);
});

test('the home page offers the same six tracks', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('.wrap.tracks');
  await expect(section.locator('h2')).toHaveText('Start with a track');
  await expect(section.locator('.more')).toHaveText('All 22 tracks →');
  await expect(section.locator('.track')).toHaveCount(6);
});

test('the practice hub browses flagship tracks first', async ({ page }) => {
  await page.goto('/practice/');
  const names = await page.locator('[data-practice-tracks] .track-name').allTextContents();
  expect(names.slice(0, 6)).toEqual(['Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'CS foundations']);
  const rest = names.slice(6);
  expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b, 'en-US')));
});
