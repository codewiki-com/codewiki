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
  await expect(page.locator('.quick', { hasText: 'Concurrency' })).toContainText('coming soon');
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
