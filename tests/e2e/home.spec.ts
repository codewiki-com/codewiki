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
  await expect(page.locator('main h1')).toHaveText(t('en', 'home.h1'));
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://codewiki.com/');
});

test('the P2 navigation and path call to action point at public routes', async ({ page }) => {
  await page.goto('/');

  // Practice leads the bar: the training side is the signature, not the catalogue.
  await expect(page.locator('.links a')).toHaveText([
    'Practice',
    'Paths',
    'Tracks',
    'Cheatsheets',
    'Playground',
    'Glossary',
    'AI era',
  ]);

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

  await expect(page.getByRole('link', { name: t('en', 'home.startReviewing') })).toHaveAttribute(
    'href',
    /^\/practice\//,
  );
});

/* docs/design/home-hero-kata.md: the kata is the hero's right column, not a section of its own.
   tests/e2e/daily-kata.spec.ts covers the card itself. */
test('the review kata is the first screen, and its two buttons share one destination', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-personal-kata]')).toHaveCount(0);

  const card = page.locator('.hero [data-daily][data-daily-variant="hero"]');
  await expect(card).toBeVisible();
  expect(((await card.locator('h2').textContent()) ?? '').trim().length).toBeGreaterThan(0);

  const href = await card.locator('[data-daily-start]').getAttribute('href');
  expect(href).toMatch(/^\/practice\//);
  await expect(page.getByRole('link', { name: t('en', 'home.startReviewing') })).toHaveAttribute(
    'href',
    href ?? '',
  );
  expect((await page.request.get(href ?? '')).status()).toBe(200);

  // The hero's brief is dropped in this variant; the hook line carries the promise instead.
  await expect(card.locator('.daily-task')).toHaveCount(0);
  await expect(card.locator('.daily-every')).toHaveText(t('en', 'daily.everyDay'));
});

test('the tracks section follows the personal strip, before the feature grid', async ({ page }) => {
  await page.goto('/');
  const order = await page.evaluate(() =>
    [...document.querySelectorAll('.wrap.hero, .wrap.search-row, .wrap.tracks, .features')].map(
      (node) => node.className,
    ),
  );
  expect(order).toEqual(['wrap hero', 'wrap search-row', 'wrap tracks', 'features']);
});

test('the Chinese home page renders the same headline in Chinese', async ({ page }) => {
  await page.goto('/zh/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
  await expect(page.locator('main h1')).toHaveText(t('zh', 'home.h1'));
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://codewiki.com/zh/');
});

test('the search row replaces the palette mock and opens the real palette', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  // The four-row mock is gone; the palette itself is the only place those rows now live.
  await expect(page.locator('.hero-palette, .hero .palette-rows')).toHaveCount(0);

  const bar = page.locator('.search-row [data-palette-open]');
  await expect(bar).toBeVisible();
  // The numbers are counted at build time, so the row can never promise more than exists.
  await expect(bar).toHaveText(/Search [\d,]+ topics, [\d,]+ terms and [\d,]+ exercises/);

  await expect(page.locator('[data-palette-ready="true"]')).toBeAttached();
  await bar.click();
  await expect(page.getByRole('dialog')).toBeVisible();

  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(pageHeight).toBeLessThan(3_000);
});

for (const system of ['light', 'dark'] as const) {
  test(`the theme starts ${system} from the system and only toggles light/dark`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: system });
    await captureThemeAtParse(page);
    await page.goto('/');
    const root = page.locator('html');
    const toggle = page.locator('button.theme-toggle').first();
    expect(await themeAtParse(page)).toBe(system);
    await expect(root).toHaveAttribute('data-theme-pref', system);
    await waitForThemeToggle(page);
    await expect(toggle).toHaveAttribute('aria-label', system === 'light' ? 'Light' : 'Dark');
    await toggle.click();
    const opposite = system === 'light' ? 'dark' : 'light';
    await expect(root).toHaveAttribute('data-theme', opposite);
    await expect(root).toHaveAttribute('data-theme-pref', opposite);
    await toggle.click();
    await expect(root).toHaveAttribute('data-theme-pref', system);
  });
}

test('the desktop and mobile theme toggles stay synchronized', async ({ page }) => {
  await page.goto('/');
  const toggles = page.locator('button.theme-toggle');
  await expect(page.locator('astro-island[component-url*="ThemeToggle"]:not([ssr])')).toHaveCount(2);
  await toggles.first().click();

  await expect(toggles).toHaveCount(2);
  await expect(toggles.nth(0)).toHaveAttribute('aria-label', 'Dark');
  await expect(toggles.nth(1)).toHaveAttribute('aria-label', 'Dark');
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

test('the language dropdown preserves the current page in both locales', async ({ page }) => {
  await page.goto('/python/closures/');
  await page.locator('.nav-tools .language-trigger').hover();
  await expect(page.locator('#nav-language').getByRole('link', { name: '中文' })).toHaveAttribute(
    'href',
    '/zh/python/closures/',
  );
  await page.goto('/zh/python/closures/');
  await page.locator('.nav-tools .language-trigger').hover();
  await expect(page.locator('#nav-language').getByRole('link', { name: 'English' })).toHaveAttribute(
    'href',
    '/python/closures/',
  );
});

test('the language dropdown opens on keyboard focus, closes with Escape, and navigates', async ({ page }) => {
  await page.goto('/');
  const trigger = page.locator('.nav-tools .language-trigger');
  await expect(page.locator('.nav-tools [data-language-switch]')).toHaveAttribute('data-enhanced', '');
  await page.locator('.nav-right button.search').focus();
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('#nav-language')).not.toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#nav-language a').first()).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/zh\/$/);
  await expect(page.locator('main h1')).toHaveText(t('zh', 'home.h1'));
});

test('the language dropdown and GitHub link work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const github = page.locator('header .github-link');
  await expect(github).toBeVisible();
  await expect(github).toHaveAttribute('href', 'https://github.com/codewiki-com');
  await page.locator('.nav-menu > summary').click();
  await page.locator('.menu-tools .language-trigger').click();
  await page.locator('#menu-language').getByRole('link', { name: '中文' }).click();
  await expect(page).toHaveURL(/\/zh\/$/);
});

test('legacy system preferences resolve to a concrete palette before paint', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() =>
    localStorage.setItem('cw:v1:prefs', JSON.stringify({ theme: 'system', depth: 'deep' })),
  );
  await captureThemeAtParse(page);
  await page.goto('/settings/');
  expect(await themeAtParse(page)).toBe('dark');
  await expect(page.locator('[data-setting="theme"] [role="radio"]')).toHaveCount(2);
  await expect(page.locator('[data-setting="theme"] [data-value="dark"]')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cw:v1:prefs')!))).toMatchObject({
    theme: 'dark',
    depth: 'deep',
  });
});

test('the header and footer use CodeWiki and link GitHub with explicit licenses', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.brand')).toHaveText('CodeWiki');
  await expect(page.locator('footer')).toContainText('CodeWiki');
  await expect(page.locator('footer')).toContainText('Code: MIT');
  await expect(page.locator('footer')).toContainText('Content: CC BY-SA 4.0');
  await expect(page.locator('footer a[href="/llms.txt"]')).toHaveCount(0);
  await expect(page.locator('footer').getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute(
    'href',
    'https://github.com/codewiki-com/codewiki',
  );
  await expect(page.locator('a[href*="rss.xml"], link[type="application/rss+xml"]')).toHaveCount(0);
});
