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

test('About explains the site without build instructions or review dates', async ({ page }) => {
  for (const path of ['/about/', '/zh/about/']) {
    await page.goto(path);
    await expect(page.locator('main')).not.toContainText(
      /pnpm|build gate|verified date|verification dates|localStorage|Preact islands|构建门禁|验证日期/,
    );
    await expect(page.locator('main')).toContainText('AI');
    await expect(page.locator('main')).toContainText('CC BY-SA 4.0');
  }
});
