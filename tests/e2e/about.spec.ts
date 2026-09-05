import { test, expect } from '@playwright/test';

test('About states the AI-era responsibilities without the old over-claim', async ({ page }) => {
  await page.goto('/about/');

  const why = page.locator('section', { has: page.getByRole('heading', { name: /^Why / }) });
  await expect(why).toContainText(
    'AI increasingly writes code; developers still have to understand implementations, state constraints and verify results.',
  );
  await expect(why).not.toContainText('most first drafts');
  await expect(why).not.toContainText('scarce skill');
});

test('About explains how content is made in both languages', async ({ page }) => {
  for (const sample of [
    { path: '/about/', heading: 'How this content is made', report: 'Report an error' },
    { path: '/zh/about/', heading: '这些内容如何制作', report: '报告错误' },
  ]) {
    await page.goto(sample.path);
    const section = page.locator('section', {
      has: page.getByRole('heading', { name: sample.heading, exact: true }),
    });
    await expect(section).toContainText('AI');
    await expect(section.getByRole('link', { name: sample.report, exact: true })).toHaveAttribute(
      'href',
      'https://github.com/codewiki-com/codewiki/issues/new?template=content-error.yml',
    );
    await expect(section.locator('a[href$="/prompts/editorial-standard.md"]')).toHaveCount(1);
  }
});

test('the English production note stays within its editorial word budget', async ({ page }) => {
  await page.goto('/about/');
  const text = await page
    .locator('section', { has: page.getByRole('heading', { name: 'How this content is made' }) })
    .locator('p')
    .first()
    .innerText();
  expect(text.trim().split(/\s+/)).toHaveLength(97);
});
