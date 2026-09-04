import { expect, test } from '@playwright/test';

test('aligned topic pairs every translated block, swaps order, removes clones and persists', async ({
  page,
}) => {
  let alternateFetches = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/zh/python/closures/') alternateFetches += 1;
  });

  await page.goto('/python/closures/');
  const control = page.locator('[data-bilingual-control]');
  await expect(control.locator('[data-value="en-zh"]')).toBeEnabled();

  const localHeading = (await page.locator('#article h2').first().textContent())?.trim() ?? '';
  const localToc = (await page.locator('[data-toc]').first().textContent())?.trim() ?? '';
  const calloutCount = await page.locator('#article aside.callout[data-bi]').count();
  const expected = await page.evaluate(async () => {
    const response = await fetch('/zh/python/closures/');
    const parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
    return {
      clones: [...parsed.querySelectorAll<HTMLElement>('#article [data-bi]')].filter(
        (block) =>
          !block.matches('pre, h2, h3, figure.codebox, figure.diagram') &&
          !block.closest('figure.codebox, figure.diagram'),
      ).length,
      heading: parsed.querySelector('#article h2')?.textContent?.trim() ?? '',
    };
  });
  // Ignore the explicit count fetch above; switching modes should add only one more request.
  alternateFetches = 0;

  await control.locator('[data-value="en-zh"]').click();
  await expect(page.locator('#article [data-bi-clone]')).toHaveCount(expected.clones);
  await expect(page.locator('#article [data-bi-clone]').first()).toHaveAttribute('lang', 'zh-Hans');
  await expect(page.locator('#article h2 .bi-h').first()).toBeVisible();
  await expect(page.locator('[data-toc] .toc-bi').first()).toBeVisible();
  await expect(page.locator('#article .bi-vocab').first()).toBeVisible();
  await expect
    .poll(async () =>
      (await page.locator('#article h2').first().textContent())?.trim().startsWith(localHeading),
    )
    .toBe(true);
  await expect
    .poll(async () => (await page.locator('[data-toc]').first().textContent())?.trim().startsWith(localToc))
    .toBe(true);

  await control.locator('[data-value="zh-en"]').click();
  await expect(page.locator('#article [data-bi-pair] > :first-child[data-bi-clone]')).toHaveCount(
    expected.clones - calloutCount,
  );
  await expect
    .poll(async () =>
      (await page.locator('#article h2').first().textContent())?.trim().startsWith(expected.heading),
    )
    .toBe(true);
  await expect
    .poll(async () =>
      (await page.locator('[data-toc]').first().textContent())?.trim().startsWith(expected.heading),
    )
    .toBe(true);
  await expect(page.locator('#article .bi-vocab').first().locator('[lang]').first()).toHaveAttribute(
    'lang',
    'zh-Hans',
  );
  expect(alternateFetches).toBe(1);

  await control.locator('[data-value="off"]').click();
  await expect(page.locator('#article [data-bi-clone]')).toHaveCount(0);
  await expect(page.locator('#article .bi-h')).toHaveCount(0);
  await expect(page.locator('#article .bi-vocab')).toHaveCount(0);

  await control.locator('[data-value="en-zh"]').click();
  await expect(page.locator('#article [data-bi-clone]')).toHaveCount(expected.clones);
  await page.reload();
  await expect(page.locator('#article')).toHaveAttribute('data-bilingual', 'en-zh');
  await expect(page.locator('#article [data-bi-clone]')).toHaveCount(expected.clones);
  await expect(page.locator('[data-bilingual-control] [data-value="en-zh"]')).toHaveAttribute(
    'aria-checked',
    'true',
  );
});

test('side-by-side preference activates only at the 1440px breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/python/closures/');
  await expect(page.locator('[data-bilingual-layout-control] [data-value="side"]')).toBeEnabled();
  await page.locator('[data-bilingual-layout-control] [data-value="side"]').click();
  await page.locator('[data-bilingual-control] [data-value="en-zh"]').click();

  const article = page.locator('#article');
  await expect(article).toHaveAttribute('data-bilingual-layout', 'side');
  await expect(page.locator('#article .bi-pair').first()).toHaveCSS('display', 'grid');

  await page.setViewportSize({ width: 1439, height: 900 });
  await expect(article).toHaveAttribute('data-bilingual-layout', 'paired');
  await expect(page.locator('#article .bi-pair').first()).toHaveCSS('display', 'flex');
});

test('settings persist the default bilingual mode and layout', async ({ page }) => {
  await page.goto('/settings/');
  await page.locator('[data-setting="bilingual"] [data-value="zh-en"]').click();
  await page.locator('[data-setting="bilingual-layout"] [data-value="side"]').click();

  expect(
    await page.evaluate(() => {
      const prefs = JSON.parse(localStorage.getItem('cw:v1:prefs') ?? '{}');
      return { bilingual: prefs.bilingual, bilingualLayout: prefs.bilingualLayout };
    }),
  ).toEqual({ bilingual: 'zh-en', bilingualLayout: 'side' });

  await page.reload();
  await expect(page.locator('[data-setting="bilingual"] [data-value="zh-en"]')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.locator('[data-setting="bilingual-layout"] [data-value="side"]')).toHaveAttribute(
    'aria-checked',
    'true',
  );
});
