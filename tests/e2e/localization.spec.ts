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
  'python',
  'sql',
  'html',
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
  // Product/identifier links stay verbatim in both locales.
  'codewiki',
  'llms.txt',
  'RSS',
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
  '/zh/playground/',
  '/zh/ai/prompt-builder/',
  '/zh/settings/',
];

async function findEnglishOnly(page: import('@playwright/test').Page): Promise<string[]> {
  return page.locator('body').evaluate(
    (body, allowed) => {
      const found = new Set<string>();
      const allowedProduct =
        /^(?:Python|Node|JavaScript|TypeScript|Go|Rust|React|Java|Kotlin|C\+\+|C#|Swift|PHP)(?: [\w.]+(?: LTS)?)?$/;
      const allowedFilename = /^[\w.-]+\.(?:py|js|ts|sql|html|css)$/i;
      const visible = (element: Element) =>
        element.getClientRects().length > 0 &&
        !element.closest('[hidden], [aria-hidden="true"]') &&
        !element.closest('[lang="en"]');
      const inspect = (value: string | null) => {
        const text = (value ?? '').replace(/\s+/g, ' ').trim();
        if (
          /[A-Za-z]/.test(text) &&
          /^[\x00-\x7F]+$/.test(text) &&
          !allowed.includes(text) &&
          !allowedProduct.test(text) &&
          !allowedFilename.test(text) &&
          !/^[A-Z]$/.test(text)
        ) {
          found.add(text);
        }
      };

      for (const element of body.querySelectorAll(
        'h1, h2, h3, h4, h5, h6, p, button, a, label, .lbl, .tag, [data-practice-stat]',
      )) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let textNode = walker.nextNode();
        while (textNode) {
          const owner = textNode.parentElement;
          if (owner && visible(owner) && !owner.closest('code, pre, kbd')) {
            inspect(textNode.textContent);
          }
          textNode = walker.nextNode();
        }
      }

      for (const element of body.querySelectorAll('[placeholder], [aria-label], [title]')) {
        if (!visible(element)) continue;
        inspect(element.getAttribute('placeholder'));
        inspect(element.getAttribute('aria-label'));
        inspect(element.getAttribute('title'));
      }

      return [...found].sort();
    },
    [...ALLOWED],
  );
}

for (const javaScriptEnabled of [false, true]) {
  for (const path of PAGES) {
    test(`${path} has no unapproved visible English-only UI text with JavaScript ${javaScriptEnabled ? 'enabled' : 'disabled'}`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ javaScriptEnabled });
      const page = await context.newPage();
      await page.goto(path);
      const englishOnly = await findEnglishOnly(page);
      await context.close();
      expect(englishOnly).toEqual([]);
    });
  }
}
