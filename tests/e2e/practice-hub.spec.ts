import { expect, test } from '@playwright/test';

/**
 * The hub is an index, not a catalogue: the day's work, the browser-local strips and one cell per
 * track. The cards live at `/practice/{track}/`, which is what the second half of this file
 * exercises. Every assertion that depends on the filter island waits for `data-ready` first.
 */

test('the practice hub indexes the tracks and the kata of the day', async ({ page }) => {
  await page.goto('/practice/');

  await expect(page.locator('[data-practice-card]')).toHaveCount(0);
  const cells = page.locator('[data-practice-tracks] > a');
  expect(await cells.count()).toBeGreaterThan(10);
  await expect(cells.filter({ hasText: 'Python' }).first()).toHaveAttribute('href', '/practice/python/');
  await expect(cells.first()).toContainText('Predict the output');

  await expect(page.locator('[data-today] > .card')).toHaveCount(3);
  // The daily pool is the code-bearing types only, and the hub picks from it exactly as the home
  // page does — docs/design/daily-kata.md.
  await expect(page.locator('[data-today] .kata-card')).toHaveAttribute(
    'href',
    /\/practice\/(review|spotbug)\/[^/]+\/[^/]+\/[^/]+\/$/,
  );
  await expect(page.locator('[data-today-flashcards-placeholder]')).toContainText(
    'Cards you miss or add appear here',
  );
  await expect(page.locator('[data-today-checkpoint-placeholder]')).toContainText(
    'Start a path to see your next checkpoint',
  );
});

test('the hub stays small enough to stay interactive', async ({ page }) => {
  await page.goto('/practice/');
  // Budget the hub itself; shared navigation and footer controls are independent of its catalogue.
  const elements = await page.locator('main').locator('*').count();
  expect(elements).toBeLessThan(200);
});

test('a legacy ?track= link lands on the route that replaced it', async ({ page }) => {
  await page.goto('/practice/?track=rust&type=review');
  await expect(page).toHaveURL('/practice/rust/?type=review');
  await expect(page.locator('h1')).toHaveText('Rust practice');

  await page.goto('/zh/practice/?track=rust');
  await expect(page).toHaveURL('/zh/practice/rust/');
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

test('saved quiz progress updates the hub statistics', async ({ page }) => {
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

  await expect(page.locator('[data-practice-stat="solved"]')).toHaveText('1');
  await expect(page.locator('[data-practice-stat="accuracy"]')).toHaveText('50%');
  await expect(page.locator('[data-practice-stat="streak"]')).toHaveText('1d');
});

test('the Chinese practice hub renders its localized shell', async ({ page }) => {
  await page.goto('/zh/practice/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
  await expect(page.locator('h1')).toHaveText('练习');
  await expect(page.locator('[data-practice-card]')).toHaveCount(0);
  expect(await page.locator('[data-practice-tracks] > a').count()).toBeGreaterThan(10);
});

test('a track page renders that track and only that track', async ({ page }) => {
  await page.goto('/practice/python/');
  await expect(page.locator('[data-practice-controls]')).toHaveAttribute('data-ready', 'true');

  const cards = page.locator('[data-practice-card]');
  const count = await cards.count();
  expect(count).toBeGreaterThan(50);
  expect(count).toBeLessThan(400);
  const tracks = await cards.evaluateAll((all) => [
    ...new Set(all.map((card) => card.getAttribute('data-track'))),
  ]);
  expect(tracks).toEqual(['python']);
  await expect(page.locator('[data-practice-card][data-type="review"] .tag.acc2').first()).toBeVisible();
});

test('the type query hides cards outside the selected practice type', async ({ page }) => {
  await page.goto('/practice/python/?type=review');
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

test('saved quiz progress marks the cards on the track page', async ({ page }) => {
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
  await page.goto('/practice/python/');
  await expect(page.locator('[data-practice-controls]')).toHaveAttribute('data-ready', 'true');

  await expect(page.locator('[data-id="python/closures#captures-binding-not-snapshot"]')).toHaveClass(
    /\bdone\b/,
  );
  await expect(page.locator('[data-id="python/closures#predict-loop-binding"]')).toHaveClass(/\bmissed\b/);
});

test('the track chips wrap on desktop, scroll on mobile and navigate between tracks', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/practice/python/');
  await expect(page.locator('[data-practice-controls]')).toHaveAttribute('data-ready', 'true');

  const chips = page.locator('.track-chips');
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

  const rust = chips.locator('a[data-value="rust"]');
  await expect(rust).toHaveAccessibleName(/^Rust \d+$/);
  await rust.click();
  await expect(page).toHaveURL('/practice/rust/');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.track-chips')).toHaveCSS('flex-wrap', 'nowrap');
  const widths = await page.locator('.track-filter-scroll').evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(widths.scroll).toBeGreaterThan(widths.client);
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
});
