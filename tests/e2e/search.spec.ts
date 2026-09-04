import { test, expect, type Page } from '@playwright/test';

/**
 * These run against the built site: the Pagefind index is a build artefact, so `pnpm build` has to
 * have run for anything here to find a result.
 */
async function openPalette(page: Page) {
  // The island is `client:idle`, and the chord is a one-shot event: pressing it before the
  // listener exists is simply lost, so wait for the marker the palette renders while closed.
  await expect(page.locator('[data-palette-ready="true"]')).toBeAttached();
  await page.keyboard.press('Control+K');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

test('⌘K opens the palette and finds an English topic', async ({ page }) => {
  await page.goto('/');
  const dialog = await openPalette(page);

  await expect(dialog.getByRole('combobox')).toBeFocused();
  await dialog.getByRole('combobox').fill('closure');

  // `hasText` is a case-insensitive substring match over the whole row, and every glossary
  // excerpt for this query contains the word, so the row is picked by its title alone.
  const result = dialog
    .getByRole('option')
    .filter({ has: page.locator('.palette-title', { hasText: 'Closures' }) });
  await expect(result).toHaveAttribute('href', '/python/closures/');
  // The pill is the track's glyph; the meta line spells the track and section out.
  await expect(result.locator('.tag')).toHaveText('py');
  await expect(result.locator('.palette-meta')).toHaveText('Python · Functions in depth');
});

test('the palette searches the Chinese index on the Chinese home page', async ({ page }) => {
  await page.goto('/zh/');
  const dialog = await openPalette(page);
  await dialog.getByRole('combobox').fill('闭包');

  await expect(dialog.getByRole('option').first()).toHaveAttribute('href', '/zh/python/closures/');
});

test('the language toggle searches the other locale', async ({ page }) => {
  await page.goto('/');
  const dialog = await openPalette(page);
  await dialog.getByRole('combobox').fill('闭包');

  // Filtered to English, a Chinese query matches nothing.
  await expect(dialog.getByRole('option')).toHaveCount(0);

  await dialog.getByRole('button', { name: '中文' }).click();
  await expect(dialog.getByRole('option').first()).toHaveAttribute('href', '/zh/python/closures/');
});

test('the keyboard moves through the results and opens one', async ({ page }) => {
  await page.goto('/');
  const dialog = await openPalette(page);
  // A word both English topics use, so there is more than one row to move between.
  await dialog.getByRole('combobox').fill('callback');
  await expect(dialog.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('ArrowDown');
  await expect(dialog.getByRole('option').nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowUp');
  await expect(dialog.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');

  const first = await dialog.getByRole('option').first().getAttribute('href');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`${first}$`));

  // The page it opened is offered back as a recent the next time the palette opens empty.
  await openPalette(page);
  await expect(page.getByRole('option').first()).toHaveAttribute('href', first ?? '');
});

test('Enter belongs to whichever control has focus', async ({ page }) => {
  await page.goto('/');
  const here = page.url();
  const dialog = await openPalette(page);
  await dialog.getByRole('combobox').fill('closure');
  await expect(dialog.getByRole('option').first()).toHaveAttribute('href', '/python/closures/');

  // Past the field, past the EN half, onto 中文.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const zh = dialog.getByRole('button', { name: '中文' });
  await expect(zh).toBeFocused();

  // Enter here switches the filter; it must not open the row the cursor is on.
  await page.keyboard.press('Enter');
  await expect(zh).toHaveAttribute('aria-pressed', 'true');
  await expect(dialog).toBeVisible();
  expect(page.url()).toBe(here);
});

test('Tab focus makes a palette result the active option', async ({ page }) => {
  await page.goto('/');
  const dialog = await openPalette(page);
  await dialog.getByRole('combobox').fill('callback');
  await expect(dialog.getByRole('option')).toHaveCount(2);

  // input → EN → 中文 → esc → first result → second result
  for (let index = 0; index < 5; index += 1) await page.keyboard.press('Tab');
  const second = dialog.getByRole('option').nth(1);
  const secondId = await second.getAttribute('id');
  expect(secondId).not.toBeNull();
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await expect(dialog.getByRole('combobox')).toHaveAttribute('aria-activedescendant', secondId!);
});

test('the two palettes on /search/ do not share element ids', async ({ page }) => {
  await page.goto('/search/?q=closure');
  await expect(page.locator('.search-results a.row').first()).toBeVisible();
  const dialog = await openPalette(page);
  await dialog.getByRole('combobox').fill('closure');
  await expect(dialog.getByRole('option').first()).toBeVisible();

  const ids = await page.locator('.palette-list').evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(ids).toHaveLength(2);
  expect(new Set(ids).size).toBe(2);
});

test('the nav search button opens the palette and Escape closes it', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-palette-ready="true"]')).toBeAttached();
  await page.locator('header [data-palette-open]').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('slash opens the palette, but not while a field has focus', async ({ page }) => {
  await page.goto('/search/');
  await expect(page.locator('[data-palette-ready="true"]')).toBeAttached();
  await page.locator('[data-search-form] input[name="q"]').focus();
  await page.keyboard.press('/');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('[data-search-form] input[name="q"]')).toHaveValue('/');

  await page.locator('h1').click();
  await page.keyboard.press('/');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('/search/?q= renders results without opening the palette', async ({ page }) => {
  await page.goto('/search/?q=closure');

  // The page's rows are ordinary links: only the palette has a roving cursor to describe.
  const result = page
    .locator('.search-results a.row')
    .filter({ has: page.locator('.palette-title', { hasText: 'Closures' }) });
  await expect(result).toHaveAttribute('href', '/python/closures/');
  await expect(page.locator('[data-search-form] input[name="q"]')).toHaveValue('closure');
});
