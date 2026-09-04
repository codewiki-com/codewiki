import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

/**
 * Automated accessibility checks. axe catches roughly a third of real barriers, so passing here
 * is a floor rather than a certificate — but a `serious` or `critical` violation is a defect, and
 * this suite fails on one. Both palettes are checked, because the two theme token sets are
 * separate and a fix in one is not a fix in the other.
 */

const PAGES = ['/', '/python/', '/python/closures/'];
const THEMES = ['light', 'dark'] as const;

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

type Theme = (typeof THEMES)[number];
type Violations = Awaited<ReturnType<typeof scan>>['violations'];

/** Pins the palette the way a returning reader's stored preference would, before first paint. */
async function usingTheme(page: Page, theme: Theme): Promise<void> {
  await page.addInitScript((value) => {
    localStorage.setItem('cw:v1:prefs', JSON.stringify({ theme: value }));
  }, theme);
}

function scan(page: Page, only?: string[]) {
  const builder = new AxeBuilder({ page }).withTags(TAGS);
  return (only ? builder.withRules(only) : builder.disableRules(['color-contrast'])).analyze();
}

const serious = (violations: Violations) =>
  violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

/** Readable failure output: the rule, what it is, and the first element that broke it. */
function describe(found: Violations): string {
  return found
    .map((v) => `${v.impact} ${v.id}: ${v.help}\n    ${v.nodes[0]?.target.join(' ') ?? ''}`)
    .join('\n  ');
}

for (const path of PAGES) {
  for (const theme of THEMES) {
    test(`${path} has no serious axe violations in the ${theme} palette`, async ({ page }) => {
      await usingTheme(page, theme);
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

      // The islands add roles and labels of their own, so let the page settle before scanning.
      await expect(page.locator('[data-palette-ready="true"]')).toBeAttached();

      const { violations } = await scan(page);
      const found = serious(violations);
      expect(found, `\n  ${describe(found)}`).toEqual([]);
    });
  }
}

/* Colour contrast is scanned separately so failures name the affected page and palette. */
for (const theme of THEMES) {
  test(`every surface meets the WCAG AA contrast floor in the ${theme} palette`, async ({ page }) => {
    await usingTheme(page, theme);
    for (const path of PAGES) {
      await page.goto(path);
      const { violations } = await scan(page, ['color-contrast']);
      expect(violations, `${path} in ${theme}:\n  ${describe(violations)}`).toEqual([]);
    }
  });
}

test('the article is reachable from the keyboard without walking the whole nav', async ({ page }) => {
  await page.goto('/python/closures/');
  await page.keyboard.press('Tab');

  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute('href', '#main');
  await expect(skip).toBeVisible();
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
