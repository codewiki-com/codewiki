import { test, expect } from '@playwright/test';

import { quizItemIds, reviewKataFacts } from './fixtures/content';

const PREDICT = '/practice/predict/python/closures/predict-loop-binding/';
const REVIEW_ITEM = quizItemIds('python', 'closures', 'review')[0]!;
const REVIEW = `/practice/review/python/closures/${REVIEW_ITEM}/`;

test('standalone kata HTML contains no answer material', async ({ request }) => {
  const predictHtml = await (await request.get(PREDICT)).text();
  expect(predictHtml).not.toContain(
    'All three lambdas share the same value cell. They run after the loop, when that cell contains 2.',
  );
  expect(predictHtml).not.toContain('"correct"');

  const reviewHtml = await (await request.get(REVIEW)).text();
  for (const privateText of [
    'yaml.Loader can construct arbitrary Python objects',
    'config aliases DEFAULTS',
    'The environment override remains a string',
    'The function handles an empty YAML document',
    'Use safe parsers at trust boundaries.',
    'Copy shared defaults before merging user data.',
    'Validate and convert values from the environment.',
    'Use safe_load, merge into a fresh dictionary',
  ]) {
    expect(reviewHtml).not.toContain(privateText);
  }
  expect(reviewHtml).not.toContain('"correct"');
});

test('a wrong prediction reveals its answer and records progress plus a flashcard', async ({ page }) => {
  await page.route('**/api/quizzes/python/closures.answers.json', async (route) => {
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({ response });
  });
  await page.goto(PREDICT);

  const shell = page.locator('[data-quiz="python/closures#predict-loop-binding"]');
  await expect(page.locator('h1')).toHaveText('What does this program print?');
  await expect(shell.locator('.opt')).toHaveCount(4);

  const explanation =
    'All three lambdas share the same value cell. They run after the loop, when that cell contains 2.';
  expect(await page.evaluate(() => document.body.innerText)).not.toContain(explanation);

  await expect(shell.locator('[data-quiz-controller="quiz"]')).toHaveAttribute('data-ready', 'true');
  await shell.locator('.opt').first().click();
  await shell.locator('[data-submit]').click();
  await expect(shell.locator('[data-result]')).toContainText('Loading answer…');

  await expect(shell.locator('.opt').first()).toHaveClass(/\bbad\b/);
  await expect(shell.locator('[data-result]')).toContainText(explanation);
  await expect(shell).toHaveAttribute('data-state', 'answered');

  await expect
    .poll(() =>
      page.evaluate(() => {
        const progress = JSON.parse(localStorage.getItem('cw:v1:progress') ?? '{}');
        return progress.quizzes?.['python/closures#predict-loop-binding']?.score;
      }),
    )
    .toBe(0);
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('cw:v1:flashcards') ?? '{}').cards?.length),
    )
    .toBe(1);

  const types = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(types.map((block) => JSON.parse(block)['@type'])).not.toContain('Quiz');
});

test('an answer request failure is announced without completing the kata', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/quizzes/python/closures.answers.json', async (route) => {
    requests += 1;
    await route.fulfill({ status: 503, body: 'unavailable' });
  });
  await page.goto(PREDICT);
  const shell = page.locator('[data-quiz="python/closures#predict-loop-binding"]');
  await expect(shell.locator('[data-quiz-controller="quiz"]')).toHaveAttribute('data-ready', 'true');
  await shell.locator('.opt').first().click();
  await shell.locator('[data-submit]').click();
  await expect(shell.locator('[role="alert"]')).toHaveText(
    'Could not load the answer — check your connection',
  );
  await shell.locator('[data-submit]').click();
  await expect.poll(() => requests).toBe(1);
  await expect(shell).toHaveAttribute('data-state', 'idle');
});

test('number keys select a prediction and Enter answers it', async ({ page }) => {
  await page.goto(PREDICT);
  const shell = page.locator('[data-quiz="python/closures#predict-loop-binding"]');
  await expect(shell.locator('[data-quiz-controller="quiz"]')).toHaveAttribute('data-ready', 'true');

  await page.keyboard.press('2');
  await expect(shell.locator('.opt').nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');

  await expect(shell).toHaveAttribute('data-state', 'answered');
  await expect(shell.locator('[data-result]')).toHaveAttribute('data-score', '1');
});

test('a review kata walks through four steps and compares with a score ring', async ({ page }) => {
  await page.goto(REVIEW);
  const kata = reviewKataFacts('python', 'closures', REVIEW_ITEM);
  const shell = page.locator(`[data-quiz="python/closures#${REVIEW_ITEM}"]`);
  await expect(page.locator('h1')).toHaveText(kata.title);
  await expect(page.locator('.crumbs .tag.acc2')).toHaveText('Review AI code');
  await expect(shell.locator('[data-quiz-controller="review"]')).toHaveAttribute('data-ready', 'true');
  await expect(shell.locator('[data-review-steps] .step')).toHaveCount(4);

  const next = shell.locator('[data-review-next]');
  await next.click();
  await next.click();
  await next.click();

  await expect(shell).toHaveAttribute('data-state', 'answered');
  await expect(shell.locator('[data-review-compare]')).toHaveAttribute('data-score', '0');
  await expect(page.locator('[data-result-mirror] .ring')).toBeVisible();
});

test('the Chinese kata page renders the Chinese prompt', async ({ page }) => {
  await page.goto(`/zh${PREDICT}`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
  await expect(page.locator('h1')).toHaveText('这段程序会输出什么？');
});
