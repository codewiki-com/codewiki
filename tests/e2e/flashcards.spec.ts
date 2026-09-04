import { test, expect } from '@playwright/test';

const REVIEW = '/practice/flashcards/';

test('a seeded due queue flips, rates with the keyboard and persists its intervals', async ({ page }) => {
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem(
      'cw:v1:flashcards',
      JSON.stringify({
        cards: [
          {
            id: 'glossary:closure',
            kind: 'term',
            ref: 'glossary:closure',
            source: 'terms',
            due: new Date(now - 2 * 86_400_000).toISOString(),
            interval: 0,
            ease: 2.2,
            reps: 0,
          },
          {
            id: 'quiz:python/closures#predict-loop-binding',
            kind: 'quiz',
            ref: 'quiz:python/closures#predict-loop-binding',
            source: 'quiz',
            due: new Date(now - 86_400_000).toISOString(),
            interval: 0,
            ease: 2.2,
            reps: 0,
          },
          {
            id: 'glossary:cell',
            kind: 'term',
            ref: 'glossary:cell',
            source: 'terms',
            due: new Date(now + 5 * 86_400_000).toISOString(),
            interval: 3,
            ease: 2.2,
            reps: 1,
          },
        ],
      }),
    );
    localStorage.setItem(
      'cw:v1:progress',
      JSON.stringify({
        topics: {},
        paths: {},
        quizzes: { today: { score: 1, total: 1, at: new Date(now).toISOString() } },
      }),
    );
  });

  await page.goto(REVIEW);
  await expect(page.locator('[data-flashcards-ready]')).toHaveAttribute('data-flashcards-ready', 'true');
  await expect(page.locator('.flashcards-summary')).toContainText('2 due today');
  await expect(page.locator('.flashcard-card')).toHaveAttribute('data-card-id', 'glossary:closure');
  await expect(page.locator('.flashcard-title-row')).toContainText('Closure');
  await expect(page.locator('.flashcard-back')).toBeHidden();

  await page.keyboard.press('Space');
  await expect(page.locator('.flashcard-card')).toHaveAttribute('data-side', 'back');
  await expect(page.locator('.flashcard-back')).toContainText('retains access to bindings');
  await page.keyboard.press('3');

  await expect(page.locator('.flashcard-card')).toHaveAttribute(
    'data-card-id',
    'quiz:python/closures#predict-loop-binding',
  );
  await expect(page.locator('.flashcard-title-row')).toContainText('What does this program print?');
  await page.keyboard.press('Space');
  await expect(page.locator('.flashcard-back')).toContainText('[2, 2, 2]');
  await expect(page.locator('.flashcard-back')).toContainText('All three lambdas share the same value cell.');
  await page.keyboard.press('3');

  await expect(page.locator('[data-flashcards-empty]')).toContainText('You are done for today.');
  await expect(page.locator('.flashcards-summary')).toContainText('0 due today');

  const reviewed = await page.evaluate(() => {
    const cards = JSON.parse(localStorage.getItem('cw:v1:flashcards') ?? '{}').cards ?? [];
    return cards.filter((card: { id: string }) =>
      ['glossary:closure', 'quiz:python/closures#predict-loop-binding'].includes(card.id),
    );
  });
  expect(reviewed).toHaveLength(2);
  for (const card of reviewed) {
    expect(card.interval).toBe(3);
    expect(card.reps).toBe(1);
    expect(Date.parse(card.due)).toBeGreaterThan(Date.now() + 2 * 86_400_000);
  }

  await page.getByRole('button', { name: /^All/ }).click();
  await expect(page.locator('.flashcard-card')).toHaveAttribute('data-card-id', 'glossary:cell');
  await page.keyboard.press('x');
  await expect(page.locator('[data-flashcards-empty]')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const cards = JSON.parse(localStorage.getItem('cw:v1:flashcards') ?? '{}').cards ?? [];
        return cards.find((card: { id: string }) => card.id === 'glossary:cell')?.suspended;
      }),
    )
    .toBe(true);

  await page.getByRole('button', { name: 'Terms from pages I read' }).click();
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('cw:v1:prefs') ?? '{}').cardSources?.terms),
    )
    .toBe(false);
});

test('the source shortcut opens a term section in the same tab', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'cw:v1:flashcards',
      JSON.stringify({
        cards: [
          {
            id: 'glossary:closure',
            kind: 'term',
            ref: 'glossary:closure',
            source: 'terms',
            due: new Date(Date.now() - 1000).toISOString(),
            interval: 0,
            ease: 2.2,
            reps: 0,
          },
        ],
      }),
    );
  });
  await page.goto(REVIEW);
  await expect(page.locator('.flashcard-title-row')).toContainText('Closure');
  await page.keyboard.press('e');
  await expect(page).toHaveURL(/\/python\/closures\/$/);
});

test('finishing a topic adds its term cards once', async ({ page }) => {
  await page.goto('/python/closures/');
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('cw:v1:progress') ?? '{}').topics?.['python/closures']?.termsAdded,
      ),
    )
    .toBe(true);
  const firstCount = await page.evaluate(
    () => JSON.parse(localStorage.getItem('cw:v1:flashcards') ?? '{}').cards?.length ?? 0,
  );
  expect(firstCount).toBeGreaterThanOrEqual(1);
  await expect(page.locator('[data-add-flashcards]')).toBeDisabled();

  await page.reload();
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('cw:v1:flashcards') ?? '{}').cards?.length ?? 0),
    )
    .toBe(firstCount);
});
