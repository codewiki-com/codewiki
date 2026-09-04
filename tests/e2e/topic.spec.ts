import { test, expect } from '@playwright/test';

/** The dial writes `prefs.depth`, so a test that changes depth must not leak into the next one. */
async function openTopic(page: import('@playwright/test').Page, path = '/python/closures/') {
  await page.goto(path);
  await expect(page.locator('[data-depth-dial]')).toHaveAttribute('data-ready', 'true');
}

test('the English topic page renders the article', async ({ page }) => {
  await page.goto('/python/closures/');
  await expect(page.locator('h1')).toHaveText('Closures');

  // The answer before the article: three labelled cells.
  await expect(page.locator('#article .tldr .tldr-cell')).toHaveCount(3);
  await expect(page.locator('#article .tldr .lbl').first()).toHaveText('what');

  // A runnable example, with the header the markdown pipeline builds.
  const codebox = page.locator('#article .codebox[data-run]').first();
  await expect(codebox.locator('.codetitle')).toHaveText('make_counter.py');
  await expect(codebox.locator('button[data-run]')).toHaveText('Run');

  await expect(page.locator('#article')).toHaveAttribute('data-depth-mode', 'standard');
});

test('the depth dial switches depth and remembers it', async ({ page }) => {
  await openTopic(page);

  const deepSection = page.locator('#article section[data-depth="deep"] .depth-body');
  await expect(deepSection).toBeHidden();

  await page.locator('[data-depth-tab="deep"]').click();
  await expect(page.locator('#article')).toHaveAttribute('data-depth-mode', 'deep');
  await expect(deepSection).toBeVisible();

  // The preference lives in this browser, so the next load opens at Deep with no flash.
  await page.reload();
  await expect(page.locator('#article')).toHaveAttribute('data-depth-mode', 'deep');
  await expect(page.locator('[data-depth-tab="deep"]')).toHaveAttribute('aria-checked', 'true');
});

test('the contents follow the depth', async ({ page }) => {
  await openTopic(page);

  const deepEntry = page.locator('[data-toc="how-cpython-stores-cells"]');
  await expect(deepEntry).toHaveClass(/deep/);

  await page.locator('[data-depth-tab="quick"]').click();
  // Quick shows the answer and the checkpoint, and no section headings at all.
  await expect(deepEntry).toBeHidden();
  await expect(page.locator('[data-toc="what-a-closure-is"]')).toBeHidden();
  await expect(page.locator('[data-toc-fixed="tldr"]')).toBeVisible();
});

test('the contents mark the section being read', async ({ page }) => {
  await openTopic(page);
  await page.evaluate(() => scrollTo(0, 2000));
  // A deep section is hidden at Standard depth, so it can never be the section being read.
  await expect(page.locator('[data-toc-nav] a.on')).toHaveCount(1);
  await expect(page.locator('[data-toc-nav] a.on')).toBeVisible();
});

test('progress is measured over the sections the depth shows', async ({ page }) => {
  await openTopic(page);
  await page.locator('#in-the-ai-era').scrollIntoViewIfNeeded();

  // A deep section is hidden at Standard depth, so it is not part of what this reader was shown.
  const expected = await page.evaluate(() => {
    const shown = [...document.querySelectorAll<HTMLElement>('#article h2')].filter(
      (heading) => heading.getClientRects().length > 0,
    );
    const index = shown.findIndex((heading) => heading.id === 'in-the-ai-era');
    return Math.round(((index + 1) / shown.length) * 100);
  });

  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('cw:v1:progress') ?? '{}').topics?.['python/closures']?.readPct,
      ),
    )
    .toBe(expected);
});

test('reading to the checkpoint completes the topic at any depth', async ({ page }) => {
  await openTopic(page);

  // Quick hides most of the article, so the sections it hides must not count against the reader.
  await page.locator('[data-depth-tab="quick"]').click();
  await page.locator('#checkpoint').scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('cw:v1:progress') ?? '{}').topics?.['python/closures']?.completedAt,
      ),
    )
    .toBeTruthy();

  await page.reload();
  await expect(page.locator('.tree a[data-topic-id="python/closures"]')).toHaveClass(/done/);
});

test('the breadcrumb and the JSON-LD trail agree', async ({ page }) => {
  await page.goto('/python/closures/');
  const pills = await page.locator('.crumbs .tag').allTextContents();
  expect(pills.map((pill) => pill.trim())).toEqual(['Tracks', 'Python', 'Functions in depth', 'closures']);

  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const crumbs = blocks.map((block) => JSON.parse(block)).find((ld) => ld['@type'] === 'BreadcrumbList');
  expect(crumbs.itemListElement.map((item: { name: string }) => item.name)).toEqual([
    'Tracks',
    'Python',
    'Functions in depth',
    'Closures',
  ]);
});

test('the URL can carry the depth', async ({ page }) => {
  await page.goto('/python/closures/?depth=deep');
  await expect(page.locator('#article')).toHaveAttribute('data-depth-mode', 'deep');
});

test('the Chinese topic page is in Chinese', async ({ page }) => {
  await page.goto('/zh/python/closures/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
  await expect(page.locator('h1')).toHaveText('闭包');
  await expect(page.locator('.tree a[aria-current="page"]')).toHaveText('闭包');
});

test('both topic pages carry hreflang links to each other', async ({ page }) => {
  await page.goto('/python/closures/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    'href',
    'https://codewiki.com/python/closures/',
  );
  await expect(page.locator('link[rel="alternate"][hreflang="zh-Hans"]')).toHaveAttribute(
    'href',
    'https://codewiki.com/zh/python/closures/',
  );
});

test('the page describes itself as a TechArticle', async ({ page }) => {
  await page.goto('/python/closures/');
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = blocks.map((block) => JSON.parse(block)['@type']);
  expect(types).toContain('TechArticle');
  expect(types).toContain('BreadcrumbList');

  const article = JSON.parse(blocks[types.indexOf('TechArticle')]!);
  expect(article.headline).toBe('Closures');
  expect(article.inLanguage).toBe('en');
  expect(article.dateModified).toBe('2026-09-03');
});
