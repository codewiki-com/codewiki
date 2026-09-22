import { test, expect } from '@playwright/test';

import { cheatsheetFacts, cheatsheetSlugs, interviewFacts } from './fixtures/content';

/** Counts and titles come from the authored MDX, so adding a sheet is not a test failure. */
const SLUGS = cheatsheetSlugs();
const python = cheatsheetFacts('python');

test('the cheatsheet index lists every reviewed sheet', async ({ page }) => {
  await page.goto('/cheatsheets/');
  await expect(page.locator('h1')).toHaveText('Cheatsheets');
  await expect(page.locator('.cheatsheet-card')).toHaveCount(SLUGS.length);
  for (const slug of SLUGS) {
    await expect(page.locator(`.cheatsheet-card[href="/cheatsheets/${slug}/"]`)).toHaveCount(1);
  }
});

test('the sheet page renders every authored panel and row', async ({ page }) => {
  await page.goto('/cheatsheets/python/');
  await expect(page.locator('h1')).toHaveText(python.title);
  // The vocabulary panel reuses the `.cheat` card material but is not an authored sheet.
  await expect(page.locator('.cheat:not(.vocab-panel)')).toHaveCount(python.sheets);
  await expect(page.locator('.cr')).toHaveCount(python.rows);

  const related = page.locator('.related-card');
  await expect(related).toContainText('Python track');
  await expect(related).toContainText(`Interview bank · ${interviewFacts('python').items.length} questions`);
  await expect(related).toContainText('Glossary · Python terms');
  await expect(related).not.toContainText('Python compared with other languages');
  await expect(related.locator('.related-row')).toHaveCount(0);
});

test('no snippet is a scroll region a keyboard cannot reach', async ({ page }) => {
  await page.goto('/cheatsheets/python/');
  const scrollable = await page
    .locator('.snip')
    .evaluateAll((cells) => cells.filter((cell) => cell.scrollWidth > cell.clientWidth + 1).length);
  expect(scrollable).toBe(0);
});

test('print media hides navigation and lays the sheet grid into two columns', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  await page.goto('/cheatsheets/python/');
  await expect(page.locator('.nav-outer')).toBeHidden();
  await expect(page.locator('[data-cheatsheet-actions]')).toBeHidden();
  await expect(page.locator('[data-cheatsheet-grid]')).toHaveCSS('column-count', '2');
});

test('the Markdown twin contains the authored Row as a plain bullet', async ({ page }) => {
  const response = await page.request.get('/cheatsheets/python.md');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/markdown');
  expect(await response.text()).toContain(python.firstRowBullet);
});

test('a row question opens the explain preset with that row as context', async ({ page }) => {
  await page.goto('/cheatsheets/python/');
  await expect(page.locator('[data-ask-ai]')).toHaveAttribute('data-ready', 'true');

  const row = page.locator('.cr').first();
  const askText = await row.locator('.row-ask').getAttribute('data-ask');
  await row.locator('.row-ask').click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.ask-row')).toHaveCount(1);
  await expect(dialog.getByText('Explain it simpler')).toBeVisible();

  const href = (await dialog.locator('.ask-row').getByRole('link').first().getAttribute('href')) ?? '';
  expect(decodeURIComponent(href)).toContain(askText ?? '');
});

test('the cheatsheet API exposes both localized sheets and their rows', async ({ request }) => {
  const response = await request.get('/api/cheatsheets.json');
  expect(response.status()).toBe(200);
  const sheets = (await response.json()) as { id: string; rows: unknown[] }[];
  expect(sheets.map((sheet) => sheet.id)).toEqual(SLUGS.flatMap((slug) => [`${slug}/en`, `${slug}/zh`]));
  for (const sheet of sheets) {
    const [slug, lang] = sheet.id.split('/') as [string, 'en' | 'zh'];
    expect(sheet.rows.length, sheet.id).toBe(cheatsheetFacts(slug, lang).twinRows);
  }
});

for (const locale of ['en', 'zh'] as const) {
  test(`the ${locale} Claude Code sheet uses only the navigation language switch`, async ({ page }) => {
    await page.goto(`${locale === 'zh' ? '/zh' : ''}/cheatsheets/claude-code/`);
    await expect(page.locator('.cheatsheet-chips')).not.toContainText(
      /verified|已验证|English|Chinese|英语|中文/i,
    );
    await expect(page.locator('.locale-chip')).toHaveCount(0);
    await page.locator('.nav-tools .language-trigger').hover();
    await expect(page.locator('#nav-language')).toBeVisible();
    await expect(page.locator('#nav-language a')).toHaveCount(2);
  });
}
