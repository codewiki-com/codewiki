import { test, expect } from '@playwright/test';

/**
 * No page scrolls sideways. A horizontal scrollbar on a phone is the symptom every overflowing
 * control row shares, and it is cheap to catch: the document is never wider than the viewport.
 *
 * 390×844 is the iPhone 14 viewport the mobile mockups are drawn at; 1440×900 is the desktop one.
 */
const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

/** One page per shape: home, track hub, topic, practice hub, glossary and settings. */
const PATHS = [
  '/',
  '/python/',
  '/python/closures/',
  '/zh/python/closures/',
  '/practice/',
  '/zh/practice/',
  '/glossary/',
  '/settings/',
  '/paths/python-from-zero/',
  '/zh/paths/python-from-zero/',
];

for (const viewport of VIEWPORTS) {
  for (const path of PATHS) {
    test(`${path} does not scroll horizontally on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(path);
      // The islands hydrate on idle and the depth dial is one of them, so wait for the page to
      // settle before measuring: a control that arrives late can still overflow.
      await page.waitForLoadState('networkidle');

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));

      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
    });
  }
}
