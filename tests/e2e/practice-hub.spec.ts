import { expect, test } from '@playwright/test';

test('the practice hub lists the server-rendered catalogue and kata of the day', async ({ page }) => {
  await page.goto('/practice/');

  await expect(page.locator('[data-practice-card]')).toHaveCount(5);
  await expect(page.locator('[data-today] > .card')).toHaveCount(3);
  await expect(page.locator('[data-today] .kata-card')).toHaveAttribute(
    'href',
    /\/practice\/review\/[^/]+\/[^/]+\/[^/]+\/$/,
  );
  await expect(page.locator('[data-today-flashcards-placeholder]')).toContainText(
    'Cards you miss or add appear here',
  );
  await expect(page.locator('[data-today-checkpoint-placeholder]')).toContainText(
    'Start a path to see your next checkpoint',
  );
  await expect(page.locator('[data-practice-card][data-type="review"] .tag.acc2')).toHaveCount(2);
});

test('the type query hides cards outside the selected practice type', async ({ page }) => {
  await page.goto('/practice/?type=review');
  await expect(page.locator('[data-practice-controls]')).toHaveAttribute('data-ready', 'true');

  const visible = page.locator('[data-practice-card]:visible');
  await expect(visible).toHaveCount(2);
  expect(await visible.evaluateAll((cards) => cards.map((card) => card.getAttribute('data-type')))).toEqual([
    'review',
    'review',
  ]);
  await expect(page.locator('[data-practice-card][data-type]:not([data-type="review"]):visible')).toHaveCount(
    0,
  );
});

test('the today strip shows the browser flashcards that are due', async ({ page }) => {
  await page.addInitScript(() => {
    const due = new Date(Date.now() - 60_000).toISOString();
    localStorage.setItem(
      'cw:v1:flashcards',
      JSON.stringify({
        cards: [
          { id: 'a', kind: 'term', ref: 'glossary:closure', due, interval: 1, ease: 2.2, reps: 1 },
          { id: 'b', kind: 'term', ref: 'glossary:cell', due, interval: 1, ease: 2.2, reps: 1 },
        ],
      }),
    );
  });
  await page.goto('/practice/');

  const flashcards = page.locator('[data-today-flashcards]');
  await expect(flashcards).toBeVisible();
  await expect(flashcards).toContainText('2 due');
});

test('the today strip finds the next unpassed checkpoint on a started path', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'cw:v1:progress',
      JSON.stringify({
        topics: {},
        paths: { 'python-from-zero': { startedAt: new Date().toISOString() } },
        quizzes: {
          'python/checkpoint-1': { score: 7, total: 10, at: new Date().toISOString() },
        },
      }),
    );
  });
  await page.goto('/practice/');

  const checkpoint = page.locator('[data-today-checkpoint]');
  await expect(checkpoint).toBeVisible();
  await expect(checkpoint).toContainText('Functions, deeper checkpoint is ready');
  await expect(checkpoint).toHaveAttribute('href', '/practice/');
});

test('saved quiz progress marks cards and updates the practice statistics', async ({ page }) => {
  await page.addInitScript(() => {
    const at = new Date().toISOString();
    localStorage.setItem(
      'cw:v1:progress',
      JSON.stringify({
        topics: {},
        paths: {},
        quizzes: {
          'python/closures#captures-binding-not-snapshot': { score: 1, total: 1, at },
          'python/closures#predict-loop-binding': { score: 0, total: 1, at },
        },
      }),
    );
  });
  await page.goto('/practice/');

  await expect(page.locator('[data-id="python/closures#captures-binding-not-snapshot"]')).toHaveClass(
    /\bdone\b/,
  );
  await expect(page.locator('[data-id="python/closures#predict-loop-binding"]')).toHaveClass(/\bmissed\b/);
  await expect(page.locator('[data-practice-stat="solved"]')).toHaveText('1');
  await expect(page.locator('[data-practice-stat="accuracy"]')).toHaveText('50%');
  await expect(page.locator('[data-practice-stat="streak"]')).toHaveText('1d');
});

test('the Chinese practice hub renders its localized shell', async ({ page }) => {
  await page.goto('/zh/practice/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
  await expect(page.locator('h1')).toHaveText('练习');
  await expect(page.locator('[data-practice-card]')).toHaveCount(5);
});
