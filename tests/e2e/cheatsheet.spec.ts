import { test, expect } from '@playwright/test';

test('the cheatsheet index lists the reviewed Python sheet', async ({ page }) => {
  await page.goto('/cheatsheets/');
  await expect(page.locator('h1')).toHaveText('Cheatsheets');
  await expect(page.locator('.cheatsheet-card')).toHaveCount(1);
  await expect(page.locator('.cheatsheet-card')).toHaveAttribute('href', '/cheatsheets/python/');
});

test('the sheet page renders three authored panels and nine rows', async ({ page }) => {
  await page.goto('/cheatsheets/python/');
  await expect(page.locator('h1')).toHaveText('Python cheatsheet');
  expect(await page.locator('.cheat').count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator('.cr')).toHaveCount(9);
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
  expect(await response.text()).toContain('- `x: int = 5` — annotation is a hint');
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
  expect(sheets.map((sheet) => sheet.id)).toEqual(['python/en', 'python/zh']);
  expect(sheets.every((sheet) => sheet.rows.length === 9)).toBe(true);
});
