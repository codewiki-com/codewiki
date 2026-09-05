import { test, expect } from '@playwright/test';

import { glossaryIds } from './fixtures/content';

test('the English index lists the terms in both languages', async ({ page }) => {
  await page.goto('/glossary/');
  await expect(page.locator('h1')).toHaveText('Glossary');

  const row = page.locator('.gloss-row[href="/glossary/closure/"]');
  await expect(row.locator('.gloss-name')).toHaveText('Closure');
  await expect(row.locator('.gloss-alt')).toHaveText('闭包');
  await expect(row.locator('.gloss-short')).toContainText('defining lexical scope');

  // Alphabetical by the English name, which is the order the term pages walk too.
  const names = await page.locator('.gloss-name').allTextContents();
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
});

test('a term page names its topics and its neighbours', async ({ page }) => {
  await page.goto('/glossary/closure/');
  await expect(page.locator('h1')).toContainText('Closure');
  await expect(page.locator('h1 .alt')).toHaveText('闭包');

  await expect(page.locator('.used-row[href="/python/closures/"]')).toContainText('Closures');
  // The glossary order is alphabetical, so the pager's first link is the preceding term.
  const ids = glossaryIds();
  const previous = ids[ids.indexOf('closure') - 1];
  await expect(page.locator('.pager-link').first()).toHaveAttribute('href', `/glossary/${previous}/`);
});

test('the Chinese term page is Chinese and describes itself as a DefinedTerm', async ({ page }) => {
  await page.goto('/zh/glossary/closure/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
  await expect(page.locator('h1')).toContainText('闭包');

  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const term = blocks.map((block) => JSON.parse(block)).find((ld) => ld['@type'] === 'DefinedTerm');
  expect(term.name).toBe('闭包');
  expect(term.inLanguage).toBe('zh-Hans');
  expect(term.inDefinedTermSet['@id']).toBe('https://codewiki.com/zh/glossary/');
});

test('the index describes itself as a DefinedTermSet', async ({ page }) => {
  await page.goto('/glossary/');
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = blocks.map((block) => JSON.parse(block)['@type']);
  expect(types).toContain('DefinedTermSet');
});
