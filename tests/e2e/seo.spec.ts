import { test, expect } from '@playwright/test';

/**
 * What a crawler sees: the sitemap pair and the head of every page archetype. These run against
 * the built site, since the sitemap is a build artefact. `endpoints.spec.ts` covers robots.txt
 * and the plain-text endpoints.
 */

/** One page per archetype, with the JSON-LD `@type` its `kind` is meant to produce. */
const SAMPLES: { path: string; ld: string }[] = [
  { path: '/', ld: 'WebSite' },
  { path: '/zh/', ld: 'WebSite' },
  { path: '/about/', ld: 'BreadcrumbList' },
  { path: '/zh/about/', ld: 'BreadcrumbList' },
  { path: '/python/', ld: 'Course' },
  { path: '/python/closures/', ld: 'TechArticle' },
  { path: '/zh/python/closures/', ld: 'TechArticle' },
  { path: '/glossary/', ld: 'DefinedTermSet' },
  { path: '/glossary/closure/', ld: 'DefinedTerm' },
];

test('the sitemap index points at a child sitemap', async ({ request }) => {
  const res = await request.get('/sitemap-index.xml');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('xml');

  const body = await res.text();
  expect(body).toContain('<loc>https://codewiki.com/sitemap-0.xml</loc>');
});

test('the child sitemap carries both locales and their alternates', async ({ request }) => {
  const body = await (await request.get('/sitemap-0.xml')).text();

  expect(body).toContain('<loc>https://codewiki.com/about/</loc>');
  expect(body).toContain('<loc>https://codewiki.com/zh/about/</loc>');
  expect(body).toContain('<loc>https://codewiki.com/python/closures/</loc>');
  expect(body).toContain('<loc>https://codewiki.com/zh/python/closures/</loc>');
  expect(body).toContain(
    '<xhtml:link rel="alternate" hreflang="zh-Hans" href="https://codewiki.com/zh/python/closures/"/>',
  );
  expect(body).toContain(
    '<xhtml:link rel="alternate" hreflang="en" href="https://codewiki.com/python/closures/"/>',
  );
});

test('both About pages carry alternates and are linked from their footer', async ({ page }) => {
  for (const { path, footerLabel } of [
    { path: '/about/', footerLabel: 'About' },
    { path: '/zh/about/', footerLabel: '关于' },
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);

    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href',
      'https://codewiki.com/about/',
    );
    await expect(page.locator('link[rel="alternate"][hreflang="zh-Hans"]')).toHaveAttribute(
      'href',
      'https://codewiki.com/zh/about/',
    );

    const footerLink = page.locator(`footer a[href="${path}"]`);
    await expect(footerLink).toHaveCount(1);
    await expect(footerLink).toHaveText(footerLabel);
  }
});

test('the sitemap carries one page per track practice catalogue', async ({ request }) => {
  const body = await (await request.get('/sitemap-0.xml')).text();

  for (const track of ['python', 'javascript', 'rust']) {
    expect(body).toContain(`<loc>https://codewiki.com/practice/${track}/</loc>`);
    expect(body).toContain(`<loc>https://codewiki.com/zh/practice/${track}/</loc>`);
  }
});

test('the sitemap leaves out the pages that must not be indexed', async ({ request }) => {
  const body = await (await request.get('/sitemap-0.xml')).text();

  // Settings is `noindex`, and search is a query interface rather than a document. Listing
  // either would be an unindexable URL in the sitemap, which Search Console reports as an error.
  expect(body).not.toContain('/settings/');
  expect(body).not.toContain('/search/');
  expect(body).not.toContain('/404');
});

for (const { path, ld } of SAMPLES) {
  test(`${path} carries one canonical, three hreflang links and ${ld}`, async ({ page }) => {
    await page.goto(path);

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    await expect(canonical).toHaveAttribute('href', `https://codewiki.com${path}`);

    // en, zh-Hans and x-default, with x-default on the English URL.
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      'href',
      /^https:\/\/codewiki\.com\/(?!zh\/)/,
    );

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = blocks.map((block) => JSON.parse(block)['@type']);
    expect(types).toContain(ld);

    // Every page states a title and a description, and never opts out of indexing by accident.
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });
}

for (const path of ['/settings/', '/search/', '/zh/search/']) {
  test(`${path} opts out of indexing and claims no alternates`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^noindex/);

    // hreflang describes a set of pages that compete in search results; an unindexable page is in
    // no such set, so it advertises none.
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  });
}
