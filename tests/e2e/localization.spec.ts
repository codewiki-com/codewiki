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
  'Free variable',
  'Enclosing scope',
  'Late binding',
  // The other-locale switch names the destination in its own language.
  'English',
]);

const PAGES = [
  '/zh/',
  '/zh/python/closures/',
  '/zh/practice/',
  '/zh/practice/predict/python/closures/predict-loop-binding/',
  '/zh/paths/',
  '/zh/paths/python-from-zero/',
  '/zh/practice/interview/python/',
  '/zh/practice/flashcards/',
  '/zh/cheatsheets/',
  '/zh/cheatsheets/python/',
  '/zh/settings/',
];

for (const path of PAGES) {
  test(`${path} has no unapproved visible English-only UI text`, async ({ page }) => {
    await page.goto(path);
    const englishOnly = await page.locator('body').evaluate(
      (body, allowed) => {
        const found = new Set<string>();
        const allowedProduct = /^(?:Python|Node|TypeScript|Go|Rust|React|Java)(?: [\d.]+(?: LTS)?)?$/;
        for (const node of body.querySelectorAll('.lbl, .tag, button, h1, h2, h3, h4, h5, h6, p')) {
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
          let textNode = walker.nextNode();
          while (textNode) {
            const owner = textNode.parentElement;
            const text = (textNode.textContent ?? '').replace(/\s+/g, ' ').trim();
            if (
              owner &&
              owner.getClientRects().length > 0 &&
              !owner.closest('[hidden], [aria-hidden="true"]') &&
              !owner.closest('code, pre, kbd, [lang="en"]') &&
              /[A-Za-z]/.test(text) &&
              /^[\x00-\x7F]+$/.test(text) &&
              !allowed.includes(text) &&
              !allowedProduct.test(text) &&
              !/^[A-Z]$/.test(text)
            ) {
              found.add(text);
            }
            textNode = walker.nextNode();
          }
        }
        return [...found];
      },
      [...ALLOWED],
    );
    expect(englishOnly).toEqual([]);
  });
}
