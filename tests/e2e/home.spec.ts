import { test, expect, type Page } from '@playwright/test';

import { t } from '@/i18n';

/**
 * The home page in both locales, plus the two chrome controls that live on every page: the theme
 * toggle and the language switch.
 */

/**
 * Records `data-theme` as it stood when the document finished parsing. The script is installed
 * before any of the page's own scripts run, so the value it captures is the one the inline
 * bootstrap wrote in <head> — if the bootstrap were deferred, this would still be unset and the
 * reader would have seen a flash of the wrong palette.
 */
async function captureThemeAtParse(page: Page): Promise<void> {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const root = document.documentElement;
      Object.assign(window as unknown as Record<string, unknown>, {
        __themeAtParse: root.dataset.theme ?? null,
        __prefAtParse: root.dataset.themePref ?? null,
      });
    });
  });
}

const themeAtParse = (page: Page) =>
  page.evaluate(() => (window as unknown as { __themeAtParse?: string | null }).__themeAtParse ?? null);

/** The server-rendered button is visible before its `client:idle` click handler exists. */
async function waitForThemeToggle(page: Page): Promise<void> {
  await expect(page.locator('astro-island[component-url*="ThemeToggle"]:not([ssr])').first()).toBeAttached();
}

test('the English home page renders its headline', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText(t('en', 'home.h1'));
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://codewiki.com/');
});

test('the P2 navigation and path call to action point at public routes', async ({ page }) => {
  await page.goto('/');

  const desktop = page.locator('.links');
  await expect(desktop.getByRole('link', { name: 'Paths', exact: true })).toHaveAttribute('href', '/paths/');
  await expect(desktop.getByRole('link', { name: 'Practice', exact: true })).toHaveAttribute(
    'href',
    '/practice/',
  );
  await expect(desktop.getByRole('link', { name: 'Cheatsheets', exact: true })).toHaveAttribute(
    'href',
    '/cheatsheets/',
  );
  await expect(desktop.getByRole('link', { name: 'Compare', exact: true })).toHaveCount(0);
  await expect(desktop.getByRole('link', { name: 'Playground', exact: true })).toHaveAttribute(
    'href',
    '/playground/',
  );

  const mobile = page.locator('.menu-links');
  await expect(mobile.locator('a[href="/paths/"]')).toHaveText('Paths');
  await expect(mobile.locator('a[href="/practice/"]')).toHaveText('Practice');
  await expect(mobile.locator('a[href="/cheatsheets/"]')).toHaveText('Cheatsheets');
  await expect(mobile.locator('a[href="/playground/"]')).toHaveText('Playground');

  await expect(page.getByRole('link', { name: 'Start a path' })).toHaveAttribute('href', '/paths/');
});

test('the personal strip receives the build-time kata of the day', async ({ page }) => {
  await page.goto('/');
  const kata = page.locator('[data-personal-kata]');
  await expect(kata).toBeVisible();
  await expect(kata).toHaveAttribute('href', /^\/practice\//);
  await expect(kata).toContainText('kata today');
  await expect(kata).toContainText(/\d+ min/);
});

test('the Chinese home page renders the same headline in Chinese', async ({ page }) => {
  await page.goto('/zh/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
  await expect(page.locator('h1')).toHaveText(t('zh', 'home.h1'));
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://codewiki.com/zh/');
});

test('the palette on the home page is a static list of real pages without JavaScript', async ({ page }) => {
  await page.goto('/');
  // Server-rendered rows: ordinary links, so the page is usable with scripting off. The first is
  // the selected one, as the mockup has it; the rest are the glossary term and the quiz item.
  const rows = page.locator('.hero-palette .row');
  await expect(rows.first()).toHaveClass(/\bon\b/);
  await expect(rows.first()).toHaveAttribute('href', '/python/closures/');
  await expect(page.locator('.hero-palette .row[href="/glossary/closure/"]')).toBeVisible();
});

test('the theme toggle cycles system, light and dark', async ({ page }) => {
  await page.goto('/');
  const root = page.locator('html');
  // Two toggles are rendered (bar and mobile menu); at the default viewport the bar's is the live one.
  const toggle = page.locator('button.theme-toggle').first();

  // The toggle is `client:idle`; the bootstrap has already resolved a preference for it to adopt.
  await expect(root).toHaveAttribute('data-theme-pref', 'system');
  await waitForThemeToggle(page);
  await expect(toggle).toBeVisible();

  await toggle.click();
  await expect(root).toHaveAttribute('data-theme-pref', 'light');
  await expect(root).toHaveAttribute('data-theme', 'light');

  await toggle.click();
  await expect(root).toHaveAttribute('data-theme-pref', 'dark');
  await expect(root).toHaveAttribute('data-theme', 'dark');

  await toggle.click();
  await expect(root).toHaveAttribute('data-theme-pref', 'system');
});

test('the desktop and mobile theme toggles stay synchronized', async ({ page }) => {
  await page.goto('/');
  const toggles = page.locator('button.theme-toggle');
  await expect(page.locator('astro-island[component-url*="ThemeToggle"]:not([ssr])')).toHaveCount(2);
  await toggles.first().click();

  await expect(toggles).toHaveCount(2);
  await expect(toggles.nth(0)).toHaveAttribute('aria-label', 'Light');
  await expect(toggles.nth(1)).toHaveAttribute('aria-label', 'Light');
});

test('the chosen theme survives a reload with no flash of the other palette', async ({ page }) => {
  await captureThemeAtParse(page);
  await page.goto('/');

  // Whatever the system says, the bootstrap resolved *something* before the document was parsed.
  expect(await themeAtParse(page)).toMatch(/^(light|dark)$/);

  const toggle = page.locator('button.theme-toggle').first();
  await waitForThemeToggle(page);
  await expect(toggle).toBeVisible();
  await toggle.click();
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme-pref', 'dark');

  await page.reload();
  // Set in <head>, not after hydration: the first paint is already dark.
  expect(await themeAtParse(page)).toBe('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme-pref', 'dark');
});

test('the theme bootstrap runs ahead of the stylesheet', async ({ page }) => {
  await page.goto('/');
  // A stylesheet blocks rendering; a bootstrap after it could still repaint. Assert the order.
  const bootstrapFirst = await page.evaluate(() => {
    const nodes = [...document.head.children];
    const script = nodes.findIndex(
      (node) => node.tagName === 'SCRIPT' && (node.textContent ?? '').includes('data-theme'),
    );
    const style = nodes.findIndex(
      (node) => node.tagName === 'LINK' && node.getAttribute('rel') === 'stylesheet',
    );
    return script !== -1 && (style === -1 || script < style);
  });
  expect(bootstrapFirst).toBe(true);
});

test('the language switch leads to the same page in the other language', async ({ page }) => {
  await page.goto('/python/closures/');
  await expect(page.getByRole('link', { name: '中文' }).first()).toHaveAttribute(
    'href',
    '/zh/python/closures/',
  );

  await page.goto('/zh/python/closures/');
  await expect(page.getByRole('link', { name: 'EN' }).first()).toHaveAttribute('href', '/python/closures/');
});

test('the language switch on the home page swaps the home page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '中文' }).first().click();
  await expect(page).toHaveURL(/\/zh\/$/);
  await expect(page.locator('h1')).toHaveText(t('zh', 'home.h1'));
});
