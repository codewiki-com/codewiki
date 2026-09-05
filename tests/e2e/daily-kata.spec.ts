import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

import { t } from '@/i18n';

/**
 * The home page's daily kata — docs/design/daily-kata.md. The card is the page's proof that the
 * site is about reviewing generated code, so the first thing asserted is that it is complete in
 * the server HTML: a visitor with no JavaScript gets the whole thing.
 */

const CARD = '[data-daily]';

/** `/practice/review/python/closures/review-one/` → the `bank#item` key progress is stored under. */
function progressKey(href: string): string {
  const [, , , track, slug, item] = href.split('/');
  return `${track}/${slug}#${item}`;
}

async function seedDone(page: Page, key: string, score: number, total: number): Promise<void> {
  await page.addInitScript(
    ([id, values]) => {
      localStorage.setItem(
        'cw:v1:progress',
        JSON.stringify({
          topics: {},
          paths: {},
          quizzes: { [id as string]: { ...(values as object), at: new Date().toISOString() } },
        }),
      );
    },
    [key, { score, total }] as const,
  );
}

test('the card is complete in the server HTML, before any script runs', async ({ request }) => {
  const html = await (await request.get('/')).text();

  expect(html).toContain('data-daily');
  expect(html).toContain(t('en', 'daily.eyebrow'));
  expect(html).toContain(t('en', 'daily.start'));
  // The hook names the two numbers that make the kata concrete, and the peek is real code.
  expect(html).toMatch(/\d+ issues? hides? in \d+ lines\./);
  expect(html).toContain('<pre class=peek-code>');
});

test('the card names one kata and links to it', async ({ page }) => {
  await page.goto('/');
  const card = page.locator(CARD);

  const title = (await card.locator('h2').textContent())?.trim() ?? '';
  expect(title.length).toBeGreaterThan(0);

  await expect(card.locator('.daily-meta')).toContainText('·');
  await expect(card.locator('[data-daily-hook]')).toHaveText(/\d+ issues? hides? in \d+ lines\./);

  const start = card.locator('[data-daily-start]');
  await expect(start).toContainText(t('en', 'daily.start'));
  const href = (await start.getAttribute('href')) ?? '';
  expect(href).toMatch(/^\/practice\/(review|spotbug)\/[^/]+\/[^/]+\/[^/]+\/$/);

  // The peek is the same link, and the whole card is one destination.
  await expect(card.locator('[data-daily-peek]')).toHaveAttribute('href', href);

  const response = await page.goto(href);
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText(title);
});

test('the code peek shows at most eight lines and counts the rest', async ({ page }) => {
  await page.goto('/');
  const lines = page.locator('[data-daily-peek] .peek-code .l');
  const count = await lines.count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(8);

  const more = page.locator('[data-daily-more]');
  if (await more.count()) await expect(more).toHaveText(/^\+\d+ more lines$/);
});

test('the source link leads to the topic the kata comes from', async ({ page }) => {
  await page.goto('/');
  const source = page.locator(`${CARD} .daily-from`);
  await expect(source).toContainText('from ');
  const href = (await source.getAttribute('href')) ?? '';
  expect(href).toMatch(/^\/[^/]+\//);
  expect((await page.request.get(href)).status()).toBe(200);
});

test('the Chinese home page labels the card in Chinese', async ({ page }) => {
  await page.goto('/zh/');
  const card = page.locator(CARD);

  await expect(card.locator('.daily-label')).toContainText(t('zh', 'daily.eyebrow'));
  await expect(card.locator('[data-daily-start]')).toContainText(t('zh', 'daily.start'));
  await expect(card.locator('.daily-from')).toContainText('来自');
  await expect(card.locator('[data-daily-hook]')).toContainText('行代码里藏着');
  await expect(card.locator('[data-daily-start]')).toHaveAttribute('href', /^\/zh\/practice\//);
});

test('a kata answered today reads as done', async ({ page }) => {
  await page.goto('/');
  const start = page.locator('[data-daily-start]');
  const href = (await start.getAttribute('href')) ?? '';

  await seedDone(page, progressKey(href), 2, 3);
  await page.reload();

  await expect(start).toContainText(t('en', 'daily.done'));
  await expect(start).toHaveClass(/btn-g/);
  await expect(page.locator('[data-daily-hook]')).toHaveText(t('en', 'daily.found', { found: 2, issues: 3 }));
});

/* The same floor as tests/e2e/a11y.spec.ts, narrowed to the card so a failure names it. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

for (const theme of ['light', 'dark'] as const) {
  test(`the card has no axe violations in the ${theme} palette`, async ({ page }) => {
    await page.addInitScript((value) => {
      localStorage.setItem('cw:v1:prefs', JSON.stringify({ theme: value }));
    }, theme);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator(CARD)).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).include(CARD).withTags(TAGS).analyze();
    const described = violations.map((v) => `${v.impact} ${v.id}: ${v.help}`).join('\n  ');
    expect(violations, `\n  ${described}`).toEqual([]);
  });
}
