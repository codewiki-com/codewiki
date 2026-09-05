import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { unified } from 'unified';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { rehypeMermaidDiagrams } from '@/markdown/mermaid';

import { firstNudgeItems, firstRunnable, quizItemIds, topicFacts } from './fixtures/content';

/** Everything the article itself decides — its title, its first runnable example, its dates. */
const closures = topicFacts('python', 'closures');
const runnable = firstRunnable('python', 'closures');

/** The dial writes `prefs.depth`, so a test that changes depth must not leak into the next one. */
async function openTopic(page: import('@playwright/test').Page, path = '/python/closures/') {
  await page.goto(path);
  await expect(page.locator('[data-depth-dial]')).toHaveAttribute('data-ready', 'true');
}

test('the English topic page renders the article', async ({ page }) => {
  await page.goto('/python/closures/');
  await expect(page.locator('h1')).toHaveText(closures.title);

  // The answer before the article: three labelled cells.
  await expect(page.locator('#article .tldr .tldr-cell')).toHaveCount(3);
  await expect(page.locator('#article .tldr .lbl').first()).toHaveText('what');

  // A runnable example, with the header the markdown pipeline builds.
  const codebox = page.locator('#article .codebox[data-run]').first();
  await expect(codebox.locator('.codetitle')).toHaveText(runnable.title);
  await expect(codebox.locator('button[data-run]')).toHaveText('Run');

  await expect(page.locator('#article')).toHaveAttribute('data-depth-mode', 'standard');
});

test('Mermaid diagrams are inline SVGs whose text follows both theme palettes', async ({ page }) => {
  const source = readFileSync(new URL('../fixtures/mermaid.mdx', import.meta.url), 'utf8');
  const markup = String(
    await unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeMermaidDiagrams)
      .use(rehypeStringify)
      .process(source),
  );

  // The existing topic is the test page shell: replacing only its article keeps the production
  // token stylesheet and avoids publishing a fixture route in the static site.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/python/closures/');
  await page.locator('#article').evaluate((article, html) => {
    article.innerHTML = html;
  }, markup);

  await expect(page.locator('#article figure.diagram > svg[data-diagram]')).toHaveCount(3);
  await expect(page.locator('#article figure.diagram pre')).toHaveCount(0);

  const renderedFontSizes = await page.locator('#article .diagram svg').evaluateAll((svgs) =>
    svgs.flatMap((svg) => {
      const scale =
        svg.getBoundingClientRect().width / (svg as unknown as SVGSVGElement).viewBox.baseVal.width;
      return [...svg.querySelectorAll('text, .nodeLabel')].map(
        (node) => Number.parseFloat(getComputedStyle(node).fontSize) * scale,
      );
    }),
  );
  expect(Math.min(...renderedFontSizes)).toBeGreaterThanOrEqual(12);

  for (const theme of ['light', 'dark'] as const) {
    await page.locator('html').evaluate((html, value) => {
      html.dataset.theme = value;
    }, theme);

    const palette = await page
      .locator('#article .diagram')
      .first()
      .evaluate((diagram) => {
        const text = diagram.querySelector('text');
        if (!text) throw new Error('The sequence diagram has no SVG text node');
        const probe = document.createElement('span');
        probe.style.color = 'var(--ink)';
        document.body.append(probe);
        const expected = getComputedStyle(probe).color;
        probe.remove();
        return { expected, actual: getComputedStyle(text).fill };
      });
    expect(palette.actual).toBe(palette.expected);
  }
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

  // Which heading is deep is an editorial choice; that the contents follow depth is behaviour.
  const deepEntry = page.locator('[data-toc-nav] a.deep').first();
  await expect(deepEntry).toBeVisible();
  const standardEntry = page.locator('[data-toc-nav] a[data-toc]:not(.deep)').first();
  await expect(standardEntry).toBeVisible();

  await page.locator('[data-depth-tab="quick"]').click();
  // Quick shows the answer and the checkpoint, and no section headings at all.
  await expect(deepEntry).toBeHidden();
  await expect(standardEntry).toBeHidden();
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

test('an inline term is a keyboard-reachable glossary link with a descriptive tooltip', async ({ page }) => {
  await page.goto('/python/closures/');
  // The card is built when the island hydrates, so waiting for it keeps the hover from arriving first.
  const tip = page.locator('#cw-term-tip');
  await expect(tip).toBeAttached();

  const term = page.locator('a.term[href]').first();
  await term.hover();
  await expect(tip).toBeVisible();
  await expect(tip).toContainText('Free variable');
  await expect(tip).toContainText('自由变量');
  await expect(tip.getByRole('link')).toHaveCount(0);
  await expect(term).toHaveAttribute('href', '/glossary/free-variable/');
  await expect(term).toHaveAttribute('aria-describedby', 'cw-term-tip');

  await page.keyboard.press('Escape');
  await expect(tip).toBeHidden();

  // The section action immediately before the prose is the preceding tab stop. Tabbing from it
  // reaches the first inline term link, focus opens the tooltip, and Enter follows the real href.
  await page.locator('#article .sec-ask').first().focus();
  await page.keyboard.press('Tab');
  await expect(term).toBeFocused();
  await expect(tip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/glossary\/free-variable\/$/);
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
  expect(article.dateModified).toBe(closures.modified);
});

test('every section offers to hand itself to an assistant', async ({ page }) => {
  await openTopic(page);

  // The button the markdown pipeline writes after each h2, carrying that heading's id.
  const first = page.locator('#article h2').first();
  const ask = page.locator('#article .sec-ask').first();
  await expect(ask).toBeVisible();
  await expect(ask).toHaveAttribute('data-section', (await first.getAttribute('id')) ?? '');

  await ask.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // Scoped to that section, and quoting it: the panel names the heading it was opened from.
  await expect(dialog.locator('.lbl')).toContainText(await first.innerText());
});

test('a code block opens its three focused Ask-AI presets', async ({ page }) => {
  await openTopic(page);
  await expect(page.locator('[data-ask-ai]')).toHaveAttribute('data-ready', 'true');

  const ask = page.locator('#article figure.codebox + .ask-block').first();
  await expect(ask).toHaveAttribute('data-preset', 'explain-code|port|tests');
  await ask.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.ask-row')).toHaveCount(3);
  await expect(dialog.getByText('Explain this code line by line')).toBeVisible();
  await expect(dialog.getByText('Write tests for this code')).toBeVisible();

  const language = dialog.locator('select.ask-language');
  await expect(language.locator('option')).toHaveCount(11);
  await language.selectOption('Rust');

  const portHref = await dialog.locator('.ask-row').nth(1).getByRole('link').first().getAttribute('href');
  expect(decodeURIComponent(portHref ?? '')).toContain('Port this code block to Rust.');
  expect(decodeURIComponent(portHref ?? '')).toContain(runnable.code.split('\n')[0]);
});

test('a pitfall asks for reader code and a nudge offers two challenges', async ({ page }) => {
  await openTopic(page);
  await expect(page.locator('[data-ask-ai]')).toHaveAttribute('data-ready', 'true');

  const pitfallAsk = page.locator('#article .callout-pitfall + .ask-block').first();
  await pitfallAsk.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.ask-row')).toHaveCount(1);
  const code = 'readers.append(lambda: index)';
  await dialog.locator('textarea.ask-code').fill(code);
  const href = await dialog.getByRole('link').first().getAttribute('href');
  expect(decodeURIComponent(href ?? '')).toContain(code);

  await page.keyboard.press('Escape');
  const nudge = page.locator('#article .nudge').first();
  await expect(nudge.locator('li')).toHaveCount(firstNudgeItems('python', 'closures').length);
});

for (const [topicPath, playgroundPath] of [
  ['/python/closures/', '/playground/'],
  ['/zh/python/closures/', '/zh/playground/'],
] as const) {
  test(`the first nudge on ${topicPath} opens its code in the localized playground`, async ({ page }) => {
    await openTopic(page, topicPath);
    const firstLine = await page
      .locator('#article figure.codebox[data-run] pre')
      .first()
      .evaluate((pre) => (pre.textContent ?? '').split('\n')[0]?.trim() ?? '');

    await page.locator('#article .nudge').first().getByRole('link').first().click();

    await expect.poll(() => new URL(page.url()).pathname).toBe(playgroundPath);
    await expect(page.locator('textarea[name="code"]')).toHaveValue(
      new RegExp(firstLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  });
}

test('the action row opens the six Ask-AI presets for the page', async ({ page }) => {
  await openTopic(page);

  const trigger = page.locator('[data-ask-ai]');
  await expect(trigger).toHaveAttribute('data-ready', 'true');
  await trigger.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.ask-row')).toHaveCount(6);
  await expect(dialog.getByText('Explain it simpler')).toBeVisible();
  await expect(dialog.getByText('Grade my explanation')).toBeVisible();

  // Each preset offers both assistants, and the deep link carries the page in its query.
  const claude = dialog.locator('.ask-row').first().getByRole('link').first();
  const href = (await claude.getAttribute('href')) ?? '';
  expect(href.startsWith('https://claude.ai/new?q=')).toBe(true);
  expect(decodeURIComponent(href)).toContain('"Closures"');

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('the action row adds every page term to flashcards once', async ({ page }) => {
  /*
   * Automatic term cards off: the button sits below the article, so clicking it scrolls the page
   * to the end, which legitimately completes the read and enrols the same terms with source
   * `terms` a frame earlier. Turning that source off leaves the action as the only writer, which
   * is what this test is about. `flashcards.spec.ts` covers the automatic source.
   */
  await page.addInitScript(() => {
    localStorage.setItem(
      'cw:v1:prefs',
      JSON.stringify({ cardSources: { terms: false, quiz: true, manual: true } }),
    );
  });
  await openTopic(page);
  const button = page.locator('[data-add-flashcards]');
  await expect(button).toHaveAttribute('data-ready', 'true');
  await expect(button).toBeEnabled();
  await button.click();

  const cards = await page.evaluate(
    () => JSON.parse(localStorage.getItem('cw:v1:flashcards') ?? '{}').cards ?? [],
  );
  const terms = ((await button.getAttribute('data-terms')) ?? '').split(',').filter(Boolean);
  expect(cards).toHaveLength(terms.length);
  expect(cards.every((card: { source: string }) => card.source === 'manual')).toBe(true);
  await expect(page.locator('[data-flashcards-confirm]')).toHaveText(`Added ${terms.length} cards`);
  await expect(button).toBeDisabled();
});

test('the Markdown twin serves the page as plain Markdown', async ({ page }) => {
  const response = await page.request.get('/python/closures.md');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/markdown');

  const body = await response.text();
  expect(body.startsWith('# Closures')).toBe(true);
  expect(body).toContain('Source: https://codewiki.com/python/closures/');
  expect(body).not.toContain('<TLDR>');
});

/* The verification panel — docs/design/verification-panel.md. Every number on it comes from
   `reports/verify/{track}/{slug}.json`, which `pnpm content:check` writes by executing the page. */

test('the panel states the runtime, the match count and what the browser will run', async ({ page }) => {
  const sidecar = JSON.parse(readFileSync('reports/verify/python/closures.json', 'utf8'));
  await page.goto('/python/closures/');

  const panel = page.locator('.verify');
  await expect(panel).toHaveAttribute('data-verify', 'verified');
  await expect(panel.locator('.state')).toContainText('Verified');

  // The patch version is the one the interpreter reported, not the `Python 3.14` frontmatter pin.
  expect(sidecar.runtime.version).toMatch(/^\d+\.\d+\.\d+$/);
  await expect(panel.locator('.facts')).toContainText(`Python ${sidecar.runtime.version}`);
  await expect(panel.locator('.facts')).toContainText(
    `${sidecar.blocks.matched} of ${sidecar.blocks.executed} outputs matched`,
  );

  // Line 3 names the runtime the reader's own tab loads, which is not the one that recorded it.
  await expect(panel.locator('.runner')).toContainText('Pyodide');
  await expect(panel.locator('.runner')).toContainText('Python 3.1');

  await expect(panel.locator('.transparency')).toContainText('drafted with AI');
});

test('the disclosure lists every runnable block and links to it', async ({ page }) => {
  await page.goto('/python/closures/');
  const details = page.locator('.verify-details');
  await expect(details.locator('li')).toHaveCount(4);
  await expect(details.locator('li').first().locator('.block-status')).toHaveText('matched');

  const href = await details.locator('.block-title').first().getAttribute('href');
  expect(href).toBe('#b1');
  await expect(page.locator('figure#b1')).toBeVisible();
  // The block says which interpreter recorded its output, next to the Run button.
  await expect(page.locator('figure#b1 .coderuntime')).toHaveText(/^recorded on Python \d+\.\d+\.\d+$/);
});

test('a topic whose output has drifted renders the partial state', async ({ page }) => {
  const sidecar = JSON.parse(readFileSync('reports/verify/python/tuples.json', 'utf8'));
  expect(sidecar.blocks.matched).toBeLessThan(sidecar.blocks.executed);

  await page.goto('/python/tuples/');
  const panel = page.locator('.verify');
  await expect(panel).toHaveAttribute('data-verify', 'partial');
  await expect(panel.locator('.state')).toContainText(
    `${sidecar.blocks.matched} of ${sidecar.blocks.executed} matched`,
  );
  // Drift is named, not hidden: the block that differs says so in the list.
  await expect(panel.locator('.block-status.mismatched')).toHaveCount(
    sidecar.blocks.executed - sidecar.blocks.matched,
  );
});

test('a topic with nothing this machine can run says so rather than claiming a run', async ({ page }) => {
  await page.goto('/cpp/references/');
  const panel = page.locator('.verify');
  await expect(panel).toHaveAttribute('data-verify', 'notRun');
  await expect(panel.locator('.state')).toContainText('Not run');
  await expect(panel.locator('.facts')).toContainText('C++23');
  await expect(panel.locator('.verify-details')).toHaveCount(0);
});

test('the Chinese page shows the same numbers in Chinese', async ({ page }) => {
  await page.goto('/zh/python/closures/');
  await expect(page.locator('.verify .state')).toContainText('已验证');
  await expect(page.locator('.verify .facts')).toContainText('处输出一致');
  await expect(page.locator('figure#b1 .coderuntime')).toContainText('记录于 Python');
});

/* "Report an error" — ROADMAP A4: one prefilled issue, on every page that claims something
   about code. The repository comes from `SITE.repo`, so this asserts the shape, not the host. */

async function assertReport(
  page: import('@playwright/test').Page,
  path: string,
  name = 'Report an error',
): Promise<void> {
  await page.goto(path);
  const link = page.getByRole('link', { name });
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);

  const url = new URL((await link.getAttribute('href')) ?? '');
  expect(url.pathname.endsWith('/issues/new')).toBe(true);
  expect(url.searchParams.get('labels')).toBe('content');
  expect(url.searchParams.get('title')).toBe(`Error on ${path}`);
  expect(url.searchParams.get('body')).toContain(`https://codewiki.com${path}`);
}

test('a topic offers a prefilled issue for its own URL', async ({ page }) => {
  await assertReport(page, '/python/closures/');
});

test('the Chinese topic reports the Chinese page, under a Chinese link', async ({ page }) => {
  await assertReport(page, '/zh/python/closures/', '报告错误');
});

test('katas and interview banks carry the same link', async ({ page }) => {
  const [id] = quizItemIds('python', 'closures', 'review');
  const kata = `/practice/review/python/closures/${id}/`;
  expect((await page.request.get(kata)).status()).toBe(200);
  await assertReport(page, kata);
  await assertReport(page, '/practice/interview/python/');
});
