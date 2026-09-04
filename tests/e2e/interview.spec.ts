import { expect, test } from '@playwright/test';

const BANK = '/practice/interview/python/';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('the bank lists its questions and the Chinese route uses Chinese question text', async ({ page }) => {
  await page.goto(BANK);
  await expect(page.locator('details.q')).toHaveCount(3);
  await expect(page.locator('details.q').first()).toContainText(
    'What is a closure, and what exactly does it capture?',
  );

  await page.goto(`/zh${BANK}`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
  await expect(page.locator('details.q').first()).toContainText('什么是闭包，它究竟捕获了什么？');
});

test('opening an answer records it as seen and one-by-one mode closes the previous answer', async ({
  page,
}) => {
  await page.goto(BANK);
  const bank = page.locator('[data-interview-bank="python"]');
  await expect(bank).toHaveAttribute('data-ready', 'true');

  const first = page.locator('details.q').nth(0);
  const second = page.locator('details.q').nth(1);
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');

  await expect
    .poll(() =>
      page.evaluate(() => {
        const progress = JSON.parse(localStorage.getItem('cw:v1:progress') ?? '{}');
        return progress.quizzes?.['interview/python/closure-capture'];
      }),
    )
    .toMatchObject({ score: 1, total: 1 });

  await second.locator('summary').click();
  await expect(second).toHaveAttribute('open', '');
  await expect(first).not.toHaveAttribute('open', '');
});

test('the level filter hides questions outside the selected level', async ({ page }) => {
  await page.goto(BANK);
  await expect(page.locator('[data-interview-bank="python"]')).toHaveAttribute('data-ready', 'true');

  await page.locator('[data-interview-levels] [data-value="advanced"]').click();
  await expect(page.locator('details.q:visible')).toHaveCount(1);
  await expect(page.locator('details.q[data-level="advanced"]')).toBeVisible();
  await expect(page.locator('details.q[data-level="beginner"]')).toBeHidden();
  await expect(page.locator('details.q[data-level="intermediate"]')).toBeHidden();
});

test('the text filter is debounced and searches question text within the bank', async ({ page }) => {
  await page.goto(BANK);
  await expect(page.locator('[data-interview-bank="python"]')).toHaveAttribute('data-ready', 'true');

  await page.locator('[data-interview-filter]').fill('nonlocal');
  await expect(page.locator('details.q:visible')).toHaveCount(1);
  await expect(page.locator('details.q:visible')).toContainText(
    "How does nonlocal change the compiler's treatment of a captured name?",
  );
});

test('show-all persists the reveal mode and the bulk action queues manual flashcards', async ({ page }) => {
  await page.goto(BANK);
  await expect(page.locator('[data-interview-bank="python"]')).toHaveAttribute('data-ready', 'true');

  await page.locator('[data-interview-reveal] [data-value="all"]').click();
  await expect(page.locator('details.q[open]')).toHaveCount(3);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('cw:v1:prefs') ?? '{}').interviewReveal),
  ).toBe('all');

  await page.locator('[data-add-all]').click();
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cw:v1:flashcards') ?? '{}').cards ?? []))
    .toEqual([
      expect.objectContaining({
        id: 'quiz:interview/python#closure-capture',
        ref: 'quiz:interview/python#closure-capture',
        source: 'manual',
      }),
      expect.objectContaining({
        id: 'quiz:interview/python#late-binding-loop',
        ref: 'quiz:interview/python#late-binding-loop',
        source: 'manual',
      }),
      expect.objectContaining({
        id: 'quiz:interview/python#nonlocal-classification',
        ref: 'quiz:interview/python#nonlocal-classification',
        source: 'manual',
      }),
    ]);
});

test('the page emits one FAQPage question for every bank item', async ({ page }) => {
  await page.goto(BANK);
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const faq = blocks.map((block) => JSON.parse(block)).find((block) => block['@type'] === 'FAQPage');

  expect(faq).toBeDefined();
  expect(faq.mainEntity).toHaveLength(3);
  expect(faq.mainEntity.every((entity: { '@type': string }) => entity['@type'] === 'Question')).toBe(true);
  expect(faq.mainEntity[0].acceptedAnswer.text).not.toContain('**');
});
