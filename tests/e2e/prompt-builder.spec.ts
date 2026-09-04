import { expect, test } from '@playwright/test';

test('query parameters preselect a topic, goal and level on the static page', async ({ page }) => {
  await page.goto('/ai/prompt-builder/?topic=python/closures&goal=review&level=intermediate');

  await expect(page.locator('[data-topic-chip="python/closures"]')).toContainText('Closures');
  await expect(page.locator('[data-goal="review"]')).toHaveClass(/\bon\b/);
  await expect(page.getByRole('radio', { name: 'Intermediate' })).toHaveAttribute('aria-checked', 'true');

  const preview = page.locator('[data-prompt-preview]');
  await expect(preview).toContainText('## Checklist first');
  await expect(preview).toContainText('https://codewiki.com/python/closures.md');
});

test('the Markdown-link option updates the preview', async ({ page }) => {
  await page.goto('/ai/prompt-builder/?topic=python/closures&goal=review');
  await expect(page.locator('[data-topic-chip="python/closures"]')).toBeVisible();
  await page.locator('[data-option="link"]').uncheck();
  await expect(page.locator('[data-prompt-preview]')).not.toContainText(
    'https://codewiki.com/python/closures.md',
  );
});

test('Copy writes the current prompt to the clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://localhost:4321',
  });
  await page.goto('/ai/prompt-builder/?topic=python/closures&goal=review');
  await expect(page.locator('[data-topic-chip="python/closures"]')).toBeVisible();
  const preview = await page.locator('[data-prompt-preview]').textContent();
  await page.locator('[data-copy-prompt]').click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(preview);
});

test('the static prompt-builder route outranks the generic topic route', async ({ page }) => {
  await page.goto('/ai/prompt-builder/');
  await expect(page.locator('h1')).toHaveText('Build a prompt that teaches.');
});
