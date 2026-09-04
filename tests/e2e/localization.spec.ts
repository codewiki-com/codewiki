import { test, expect } from '@playwright/test';

const ALLOWED = new Set([
  'py',
  'js',
  'ts',
  'go',
  'rs',
  'jvm',
  'kt',
  'cpp',
  'c#',
  'swift',
  'php',
  'ui',
  'api',
  'arch',
  'ops',
  'db',
  'ds',
  'llm',
  'sec',
  'game',
  'ai',
  'cs',
  'TL;DR',
  'EN',
  'esc',
  '⌘K',
  'what',
  'trap',
  'fix',
  'when',
  'how',
  'why',
  // Proper language name and the glossary's intentional English alternate name.
  'Python',
  'Cell',
]);

for (const path of ['/zh/', '/zh/python/closures/']) {
  test(`${path} has no unapproved English-only labels or tags`, async ({ page }) => {
    await page.goto(path);
    const englishOnly = await page
      .locator('.lbl, .tag')
      .evaluateAll(
        (nodes, allowed) =>
          nodes
            .map((node) => (node.textContent ?? '').trim())
            .filter((text) => /^[A-Za-z]+$/.test(text) && !allowed.includes(text)),
        [...ALLOWED],
      );
    expect(englishOnly).toEqual([]);
  });
}
