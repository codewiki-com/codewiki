import { expect, test } from '@playwright/test';

test('the practice hub lists the server-rendered catalogue and kata of the day', async ({ page }) => {
  await page.goto('/practice/');

  expect(await page.locator('[data-practice-card]').count()).toBeGreaterThan(1_000);
  await expect(page.locator('[data-today] > .card')).toHaveCount(3);
  await expect(page.locator('[data-today] .kata-card')).toHaveAttribute(
    'href',
    /\/practice\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/$/,
  );
  await expect(page.locator('[data-today-flashcards-placeholder]')).toContainText(
    'Cards you miss or add appear here',
  );
  await expect(page.locator('[data-today-checkpoint-placeholder]')).toContainText(
    'Start a path to see your next checkpoint',
  );
  expect(await page.locator('[data-practice-card][data-type="review"] .tag.acc2').count()).toBeGreaterThan(0);
});

test('the type query hides cards outside the selected practice type', async ({ page }) => {
  await page.goto('/practice/?type=review');
  await expect(page.locator('[data-practice-controls]')).toHaveAttribute('data-ready', 'true');

  const visible = page.locator('[data-practice-card]:visible');
  const visibleTypes = await visible.evaluateAll((cards) =>
    cards.map((card) => card.getAttribute('data-type')),
  );
  expect(visibleTypes.length).toBeGreaterThan(0);
  expect(new Set(visibleTypes)).toEqual(new Set(['review']));
  await expect(page.locator('[data-practice-card][data-type]:not([data-type="review"]):visible')).toHaveCount(
    0,
  );
});

test('the track chips wrap on desktop, scroll on mobile and retain URL state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/practice/');
  await expect(page.locator('[data-practice-controls]')).toHaveAttribute('data-ready', 'true');

  const chips = page.locator('[data-filter-group="track"]');
  await expect(chips).toHaveCSS('flex-wrap', 'wrap');
  const containment = await chips.evaluate((element) => {
    const wrapper = element.closest('.track-filter-scroll')!.getBoundingClientRect();
    const controls = [...element.querySelectorAll<HTMLElement>('[data-value]')].map((control) =>
      control.getBoundingClientRect(),
    );
    return {
      group: element.getBoundingClientRect().right,
      control: Math.max(...controls.map((control) => control.right)),
      column: wrapper.right,
    };
  });
  expect(containment.group).toBeLessThanOrEqual(containment.column);
  expect(containment.control).toBeLessThanOrEqual(containment.column);

  const firstTrack = chips.locator('[data-value]:not([data-value="all"])').first();
  const value = await firstTrack.getAttribute('data-value');
  await firstTrack.click();
  await expect(page).toHaveURL(new RegExp(`[?&]track=${value}(?:&|$)`));
  await expect(firstTrack).toHaveClass(/\bon\b/);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(chips).toHaveCSS('flex-wrap', 'nowrap');
  const widths = await page.locator('.track-filter-scroll').evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(widths.scroll).toBeGreaterThan(widths.client);
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
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
  await expect(checkpoint).toContainText('Functions, scope, and iteration checkpoint is ready');
  await expect(checkpoint).toHaveAttribute('href', /\/practice\/[^/]+\/python\/checkpoint-2\/[^/]+\/$/);
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
  expect(await page.locator('[data-practice-card]').count()).toBeGreaterThan(1_000);
});
