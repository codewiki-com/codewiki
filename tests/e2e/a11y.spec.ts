import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

/**
 * Automated WCAG 2.2 AA and best-practice checks, including contrast. Every reported violation
 * fails the check; keyboard workflows are covered separately. Exercise both languages and themes.
 */

const PAGES = [
  '/',
  '/python/',
  '/python/closures/',
  '/practice/',
  '/practice/predict/python/closures/predict-loop-binding/',
  '/paths/',
  '/paths/python-from-zero/',
  '/practice/interview/python/',
  '/practice/flashcards/',
  '/cheatsheets/',
  '/cheatsheets/python/',
  '/playground/',
  '/ai/prompt-builder/',
  '/settings/',
  '/tracks/',
  '/practice/python/',
  '/glossary/',
  '/glossary/closure/',
  '/about/',
  '/contribute/',
  '/rules/python/',
  '/search/?q=closure',
  '/offline/',
];
const THEMES = ['light', 'dark'] as const;

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

type Theme = (typeof THEMES)[number];
type Violations = Awaited<ReturnType<typeof scan>>['violations'];

/** Pins the palette the way a returning reader's stored preference would, before first paint. */
async function usingTheme(page: Page, theme: Theme): Promise<void> {
  await page.addInitScript((value) => {
    localStorage.setItem('cw:v1:prefs', JSON.stringify({ theme: value }));
  }, theme);
}

function scan(page: Page) {
  return new AxeBuilder({ page })
    .withTags(TAGS)
    .options({ rules: { 'label-content-name-mismatch': { enabled: true } } })
    .analyze();
}

/** Readable failure output: the rule, what it is, and the first element that broke it. */
function describe(found: Violations): string {
  return found
    .map((v) => `${v.impact} ${v.id}: ${v.help}\n    ${v.nodes[0]?.target.join(' ') ?? ''}`)
    .join('\n  ');
}

for (const path of PAGES.flatMap((path) => [path, `/zh${path}`])) {
  for (const theme of THEMES) {
    test(`${path} has no axe violations in the ${theme} palette`, async ({ page }) => {
      await usingTheme(page, theme);
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

      // The islands add roles and labels of their own, so let the page settle before scanning.
      await expect(page.locator('[data-palette-ready="true"]')).toBeAttached();
      if (path.includes('/playground/')) {
        await expect(page.locator('.playground-example-card').first()).toBeVisible();
      }

      const { violations } = await scan(page);
      expect(violations, `\n  ${describe(violations)}`).toEqual([]);
    });
  }
}

test.describe('search load failures', () => {
  // A service worker can satisfy an import before Playwright's route interception sees it.
  test.use({ serviceWorkers: 'block' });
  for (const path of ['/search/?q=closure', '/zh/search/?q=closure']) {
    for (const theme of THEMES) {
      test(`${path} search failure remains accessible in ${theme}`, async ({ page }) => {
        await usingTheme(page, theme);
        await page.route('**/pagefind/**', (route) => route.abort());
        await page.goto(path);
        await expect(page.locator('.search-results .palette-note a')).toBeVisible();
        const { violations } = await scan(page);
        expect(violations, `\n  ${describe(violations)}`).toEqual([]);
      });
    }
  }
});

for (const path of ['/practice/flashcards/', '/zh/practice/flashcards/']) {
  for (const theme of THEMES) {
    test(`${path} active flashcards remain accessible in ${theme}`, async ({ page }) => {
      await usingTheme(page, theme);
      await page.addInitScript(() => {
        localStorage.setItem(
          'cw:v1:flashcards',
          JSON.stringify({
            cards: [
              {
                id: 'glossary:closure',
                kind: 'term',
                ref: 'glossary:closure',
                source: 'terms',
                due: '2000-01-01T00:00:00.000Z',
                interval: 0,
                ease: 2.2,
                reps: 0,
              },
            ],
          }),
        );
      });
      await page.goto(path);
      const front = page.locator('.flashcard-front');
      await expect(front).toHaveAccessibleName(/Closure/);
      for (const flipped of [false, true]) {
        if (flipped) await front.click();
        const { violations } = await scan(page);
        expect(violations, `\n  ${describe(violations)}`).toEqual([]);
      }
    });
  }
}

test('the article is reachable from the keyboard without walking the whole nav', async ({ page }) => {
  await page.goto('/python/closures/');
  await page.keyboard.press('Tab');

  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute('href', '#main');
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('main :focus')).toHaveCount(1);
});

test('the depth dial is a labelled radio group', async ({ page }) => {
  await page.goto('/python/closures/');
  const dial = page.locator('[data-depth-dial]');
  await expect(dial).toHaveAttribute('data-ready', 'true');

  await expect(dial).toHaveRole('radiogroup');
  await expect(dial).toHaveAttribute('aria-label', /.+/);
  await expect(dial.getByRole('radio')).toHaveCount(3);
  await expect(dial.getByRole('radio', { checked: true })).toHaveCount(1);
});
