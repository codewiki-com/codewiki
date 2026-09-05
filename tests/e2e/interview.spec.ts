import { expect, test } from '@playwright/test';

import { interviewFacts } from './fixtures/content';

const BANK = '/practice/interview/python/';
/** Question count, ids and level split come from the bank itself, not from a frozen literal. */
const facts = interviewFacts('python');
const firstItem = facts.items[0]!;
const advanced = facts.byLevel('advanced');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('the bank lists its questions and the Chinese route uses Chinese question text', async ({ page }) => {
  await page.goto(BANK);
  await expect(page.locator('details.q')).toHaveCount(facts.items.length);
  await expect(page.locator('details.q').first()).toContainText(firstItem.question);

  await page.goto(`/zh${BANK}`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
  await expect(page.locator('details.q').first()).toContainText(firstItem.questionZh);
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
        const id = document.querySelector('details.q')?.getAttribute('data-id') ?? '';
        return progress.quizzes?.[`interview/python/${id}`];
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
  await expect(page.locator('details.q:visible')).toHaveCount(advanced.length);
  await expect(page.locator('details.q[data-level="advanced"]').first()).toBeVisible();
  await expect(page.locator('details.q[data-level="beginner"]').first()).toBeHidden();
  await expect(page.locator('details.q[data-level="intermediate"]').first()).toBeHidden();
});

test('the text filter is debounced and searches question text within the bank', async ({ page }) => {
  await page.goto(BANK);
  await expect(page.locator('[data-interview-bank="python"]')).toHaveAttribute('data-ready', 'true');

  const matching = facts.items.filter((item) => item.question.toLowerCase().includes('nonlocal'));
  expect(matching.length).toBeGreaterThan(0);
  await page.locator('[data-interview-filter]').fill('nonlocal');
  await expect(page.locator('details.q:visible')).toHaveCount(matching.length);
  await expect(page.locator('details.q:visible').first()).toContainText(matching[0]!.question);
});

test('show-all persists the reveal mode and the bulk action queues manual flashcards', async ({ page }) => {
  await page.goto(BANK);
  await expect(page.locator('[data-interview-bank="python"]')).toHaveAttribute('data-ready', 'true');

  await page.locator('[data-interview-reveal] [data-value="all"]').click();
  await expect(page.locator('details.q[open]')).toHaveCount(facts.items.length);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('cw:v1:prefs') ?? '{}').interviewReveal),
  ).toBe('all');

  await page.locator('[data-add-all]').click();
  // The scheduler owns the deck's order; what the action promises is one manual card per question.
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          (JSON.parse(localStorage.getItem('cw:v1:flashcards') ?? '{}').cards ?? []) as {
            id: string;
            source: string;
          }[]
        )
          .filter((card) => card.source === 'manual')
          .map((card) => card.id)
          .sort(),
      ),
    )
    .toEqual(facts.items.map((item) => `quiz:interview/python#${item.id}`).sort());
});

test('the page emits one FAQPage question for every bank item', async ({ page }) => {
  await page.goto(BANK);
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const faq = blocks.map((block) => JSON.parse(block)).find((block) => block['@type'] === 'FAQPage');

  expect(faq).toBeDefined();
  expect(faq.mainEntity).toHaveLength(facts.items.length);
  expect(faq.mainEntity.every((entity: { '@type': string }) => entity['@type'] === 'Question')).toBe(true);
  expect(faq.mainEntity[0].acceptedAnswer.text).not.toContain('**');
});
