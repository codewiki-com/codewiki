import { expect, test, type Page } from '@playwright/test';

interface EmbeddedItem {
  id: string;
  type: 'mcq' | 'predict' | 'spotbug' | 'fill';
  answer?: string;
  options?: Array<{ correct: boolean }>;
  issues?: Array<{ line: number }>;
}

async function itemsOn(page: Page): Promise<EmbeddedItem[]> {
  return page
    .locator('script[data-checkpoint-items]')
    .evaluate((script) => JSON.parse(script.textContent ?? '[]'));
}

async function start(page: Page): Promise<EmbeddedItem[]> {
  await page.goto('/python/closures/');
  const checkpoint = page.locator('#checkpoint');
  await checkpoint.scrollIntoViewIfNeeded();
  await expect(checkpoint.locator('[data-checkpoint-controller]')).toHaveAttribute('data-ready', 'true');
  const items = await itemsOn(page);
  await checkpoint.locator('[data-checkpoint-start]').click();
  return items;
}

async function answer(page: Page, item: EmbeddedItem, correct: boolean): Promise<void> {
  const checkpoint = page.locator('#checkpoint');
  const shell = checkpoint.locator('.kata-shell');
  await expect(shell).toHaveAttribute('data-quiz', `python/closures#${item.id}`);

  if (item.type === 'mcq' || item.type === 'predict') {
    const right = item.options?.findIndex((option) => option.correct) ?? 0;
    const choice = correct ? right : 0;
    await shell.locator(`.opt[data-option="${choice}"]`).click();
    await page.keyboard.press('Enter');
    return;
  }

  if (item.type === 'fill') {
    await shell.locator('[data-fill]').fill(correct ? (item.answer?.split('|')[0]?.trim() ?? '') : 'wrong');
    await shell.locator('[data-fill-form]').press('Enter');
    return;
  }

  if (correct) {
    for (const line of new Set(item.issues?.map((issue) => issue.line) ?? [])) {
      await shell.locator(`.ln[data-line="${line}"] .mk`).click();
    }
  }
  await shell.locator('[data-reveal]').click();
}

test('the topic checkpoint summarizes its bank and stays in the TOC at every depth', async ({ page }) => {
  await page.goto('/python/closures/');
  const checkpoint = page.locator('#checkpoint');
  await expect(checkpoint).toHaveAttribute('data-checkpoint', 'python/closures');
  await expect(checkpoint.locator('[data-checkpoint-count]')).toContainText('3 questions');
  await expect(checkpoint.locator('[data-checkpoint-start]')).toHaveText('Start');
  expect(await itemsOn(page)).toHaveLength(3);

  for (const depth of ['quick', 'standard', 'deep']) {
    await page.locator(`[data-depth-tab="${depth}"]`).click();
    await expect(page.locator('[data-toc-fixed="checkpoint"]')).toBeVisible();
    await expect(page.locator('[data-toc-fixed="checkpoint"]')).toHaveText('Checkpoint');
  }
});

test('finishing every checkpoint item shows the result, miss explanations, and actions', async ({ page }) => {
  const items = await start(page);
  for (const item of items) await answer(page, item, false);

  const result = page.locator('[data-checkpoint-result]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('You scored 1 of 3');
  await expect(result.locator('.checkpoint-misses')).toBeVisible();
  await expect(result.locator('[data-add-misses]')).toBeEnabled();
  await expect(result.getByRole('link', { name: 'Back to the track' })).toHaveAttribute('href', '/python/');

  await result.locator('[data-add-misses]').click();
  // Reaching the checkpoint also enrolls the topic's term cards; this action itself adds two
  // missed-quiz cards, so assert that source rather than the whole mixed deck.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const cards = JSON.parse(localStorage.getItem('cw:v1:flashcards') ?? '{}').cards ?? [];
        return cards.filter((card: { source?: string }) => card.source === 'quiz').length;
      }),
    )
    .toBe(2);
});

test('an all-correct checkpoint records the bank and completes the topic', async ({ page }) => {
  const items = await start(page);
  await page.evaluate(() => {
    document.addEventListener(
      'cw:progress',
      () => document.documentElement.setAttribute('data-checkpoint-progress-event', ''),
      { once: true },
    );
  });
  for (const item of items) await answer(page, item, true);

  const result = page.locator('[data-checkpoint-result]');
  await expect(result).toContainText('Passed');
  await expect(result).toContainText('You scored 3 of 3');
  await expect(page.locator('html')).toHaveAttribute('data-checkpoint-progress-event', '');
  await expect
    .poll(() =>
      page.evaluate(() => {
        const progress = JSON.parse(localStorage.getItem('cw:v1:progress') ?? '{}');
        return {
          quiz: progress.quizzes?.['python/closures'],
          completedAt: progress.topics?.['python/closures']?.completedAt,
        };
      }),
    )
    .toMatchObject({ quiz: { score: 3, total: 3 }, completedAt: expect.any(String) });
});
