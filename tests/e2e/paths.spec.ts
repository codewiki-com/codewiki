import { expect, test } from '@playwright/test';

test('the path index lists Python from zero', async ({ page }) => {
  await page.goto('/paths/');

  await expect(page.locator('h1')).toHaveText('Learning paths');
  await expect(page.locator('[data-path-root="python-from-zero"] h2')).toHaveText('Python from zero');
  await expect(page.locator('[data-path-root="python-from-zero"] .path-card-main')).toHaveAttribute(
    'href',
    '/paths/python-from-zero/',
  );
});

test('the path page renders the complete build-time map', async ({ page }) => {
  await page.goto('/paths/python-from-zero/');

  await expect(page.locator('.path-svg')).toHaveAttribute('role', 'img');
  expect(await page.locator('.path-svg [data-topic]').count()).toBeGreaterThanOrEqual(20);
  await expect(page.locator('.path-svg [data-checkpoint]')).toHaveCount(5);
  await expect(page.locator('.path-svg a[data-topic="python/closures"]')).toHaveAttribute(
    'href',
    '/python/closures/',
  );
});

test('saved progress annotates the SVG and keeps Continue on an authored topic', async ({ page }) => {
  await page.addInitScript(() => {
    const at = new Date().toISOString();
    localStorage.setItem(
      'cw:v1:progress',
      JSON.stringify({
        topics: {
          'python/closures': { readPct: 100, completedAt: at, lastAt: at },
        },
        quizzes: {},
        paths: {},
      }),
    );
  });
  await page.goto('/paths/python-from-zero/');

  await expect(page.locator('[data-topic="python/closures"]')).toHaveAttribute('data-state', 'done');
  await expect(page.locator('[data-continue]')).toHaveAttribute('href', '/python/closures/');
});

test('the time-plan segment updates the weeks estimate and saves the plan', async ({ page }) => {
  await page.goto('/paths/python-from-zero/');
  const estimate = page.locator('[data-weeks]');
  const before = await estimate.textContent();

  await page.locator('[data-plan="60"]').click();
  await expect(estimate).not.toHaveText(before ?? '');
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cw:v1:prefs') ?? '{}').plan as number))
    .toBe(60);
});

test('opening a path records its started time only once', async ({ page }) => {
  await page.goto('/paths/python-from-zero/');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('cw:v1:progress') ?? '{}').paths?.['python-from-zero']
            ?.startedAt as string,
      ),
    )
    .not.toBeFalsy();
  const first = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('cw:v1:progress') ?? '{}').paths?.['python-from-zero']
        ?.startedAt as string,
  );
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('cw:v1:progress') ?? '{}').paths?.['python-from-zero']
            ?.startedAt as string,
      ),
    )
    .toBe(first);
});

test('the Chinese path page renders the localized content title', async ({ page }) => {
  await page.goto('/zh/paths/python-from-zero/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
  await expect(page.locator('h1')).toHaveText('从零开始学 Python');
});
