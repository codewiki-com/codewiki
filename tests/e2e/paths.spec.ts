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

  await expect(page.locator('.path-chips')).toContainText('26 topics');
  await expect(page.locator('.path-chips')).toContainText('5 checkpoints');
  await expect(page.locator('.path-chips')).not.toContainText('26topics');
  await expect(page.locator('.path-svg')).toHaveAttribute('role', 'group');
  await expect(page.locator('.path-svg')).toHaveAttribute('aria-labelledby', 'path-map-accessible-title');
  expect(await page.locator('#path-map-accessible-title').evaluate((node) => node.textContent)).toBe(
    'Python from zero: 26 topics, 5 checkpoints.',
  );
  expect(await page.locator('.path-svg [data-topic]').count()).toBeGreaterThanOrEqual(20);
  await expect(page.locator('.path-svg [data-checkpoint]')).toHaveCount(5);
  await expect(page.locator('.path-svg a[data-topic="python/closures"]')).toHaveAttribute(
    'href',
    '/python/closures/',
  );
  await expect(page.locator('[data-topic="python/inheritance-polymorphism"] title')).toContainText(
    'Inheritance polymorphism',
  );
  await expect(
    page.locator('[data-topic="python/inheritance-polymorphism"] [data-node-label-text]'),
  ).not.toContainText('inheritance-polymorphism');
});

test('every path-map text label stays inside its milestone column', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/paths/python-from-zero/');

  const overflow = await page.locator('.path-svg').evaluate((svg) => {
    const columns = [...svg.querySelectorAll<SVGRectElement>('rect.mile')].map((column) => column.getBBox());
    return [...svg.querySelectorAll<SVGTextElement>('text[data-column]')]
      .map((label) => {
        const column = columns[Number(label.dataset.column)];
        const box = label.getBBox();
        return column && box.x >= column.x - 0.5 && box.x + box.width <= column.x + column.width + 0.5
          ? null
          : { text: label.textContent, column: label.dataset.column, x: box.x, width: box.width };
      })
      .filter(Boolean);
  });

  expect(overflow).toEqual([]);
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
  await expect(page.locator('[data-continue]')).toHaveAttribute('href', '/python/python-fundamentals/');
});

test('the time-plan segment updates the weeks estimate and saves the plan', async ({ page }) => {
  await page.goto('/paths/python-from-zero/');
  // The plan buttons are server markup; wait for PathState to hydrate before clicking one.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('cw:v1:progress') ?? '{}').paths?.['python-from-zero']
            ?.startedAt as string,
      ),
    )
    .not.toBeFalsy();
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
  await expect(page.locator('h1')).toHaveText('Python 从零起步');
});
