import { expect, test } from '@playwright/test';
import { encodeState } from '@/lib/lz';

test('loads shared Python state and runs it in the browser', async ({ page }) => {
  test.skip(Boolean(process.env.CI_FAST), 'CI_FAST skips the Pyodide runner');
  test.setTimeout(60_000);
  const code = encodeURIComponent(encodeState({ lang: 'python', code: 'print(1 + 1)' }));
  await page.goto(`/playground/?lang=python&code=${code}`);

  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.locator('.playground-terminal')).toContainText('2', { timeout: 55_000 });
  await expect(page.locator('.playground-terminal')).toContainText('exit 0');
});

test('runs SQL and formats the result as a table', async ({ page }) => {
  await page.goto('/playground/');
  await page.getByRole('tab', { name: 'sql' }).click();
  await page.getByRole('button', { name: 'Run' }).click();

  await expect(page.locator('.playground-terminal')).toContainText('x');
  await expect(page.locator('.playground-terminal')).toContainText('1');
});

test('renders HTML in a sandboxed srcdoc iframe', async ({ page }) => {
  await page.goto('/playground/');
  await page.getByRole('tab', { name: 'html' }).click();
  await page.getByRole('button', { name: 'Run' }).click();

  const frame = page.locator('.runner-html-preview');
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts');
  await expect(frame.contentFrame().getByRole('heading', { name: 'Hello, codewiki' })).toBeVisible();
});

test('shares compressed editor state and copies the resulting URL', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/playground/');
  await page.getByRole('button', { name: 'Share link' }).click();

  await expect(page).toHaveURL(/\?lang=python&code=/);
  await expect(page.locator('.playground-action-status')).toHaveText('Link copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
});

test('loads a topic example into the editor', async ({ page }) => {
  await page.goto('/playground/');
  const picker = page.locator('#playground-example');
  await expect(picker.locator('option')).not.toHaveCount(1);
  await picker.selectOption({ index: 1 });

  await expect(page.locator('textarea[name="code"]')).not.toHaveValue('print(1 + 1)');
  await expect(page.getByRole('link', { name: 'Open the topic' })).toBeVisible();
});

test('shows kata pass and failure states with an AI repair action', async ({ page }) => {
  const passing = encodeURIComponent(
    encodeState({
      lang: 'js',
      code: 'const add = (a, b) => a + b;',
      tests: 'assert(add(1, 2) === 3, "adds")',
    }),
  );
  await page.goto(`/playground/?lang=js&code=${passing}`);
  await expect(page.getByRole('tab', { name: 'Tests' })).toBeVisible();
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.locator('.playground-test-summary.passed')).toContainText('All tests passed');

  const failing = encodeURIComponent(
    encodeState({
      lang: 'js',
      code: 'const add = (a, b) => a - b;',
      tests: 'assert(add(1, 2) === 3, "adds")',
    }),
  );
  await page.goto(`/playground/?lang=js&code=${failing}`);
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.locator('.playground-test-summary.failed')).toContainText('A test failed');
  await expect(page.getByRole('link', { name: 'Ask AI to fix' })).toBeVisible();
});

test('has no console errors while loading and running JavaScript', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/playground/');
  await page.getByRole('tab', { name: 'js' }).click();
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.locator('.playground-terminal')).toContainText('2');
  expect(errors).toEqual([]);
});
