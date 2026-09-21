import { test, expect } from '@playwright/test';

test('practice preferences persist through a reload', async ({ page }) => {
  await page.goto('/settings/');

  await page.locator('[data-setting="interview-reveal"] [data-value="all"]').click();
  const terms = page.locator('[data-setting="card-sources"] [data-value="terms"]');
  await expect(terms).toHaveAttribute('aria-pressed', 'true');
  await terms.click();
  await expect(terms).toHaveAttribute('aria-pressed', 'false');

  expect(
    await page.evaluate(() => {
      const prefs = JSON.parse(localStorage.getItem('cw:v1:prefs') ?? '{}');
      return { reveal: prefs.interviewReveal, sources: prefs.cardSources };
    }),
  ).toEqual({ reveal: 'all', sources: { terms: false, quiz: true, manual: true } });

  await page.reload();
  await expect(page.locator('[data-setting="interview-reveal"] [data-value="all"]')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.locator('[data-setting="card-sources"] [data-value="terms"]')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('reset practice data keeps reading progress and preferences', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'cw:v1:prefs',
      JSON.stringify({
        theme: 'light',
        depth: 'deep',
        fontSize: 'm',
        interviewReveal: 'all',
      }),
    );
    localStorage.setItem(
      'cw:v1:progress',
      JSON.stringify({
        topics: { 'python/closures': { readPct: 48, lastAt: '2026-09-04T10:00:00.000Z' } },
        quizzes: { 'python/closures#predict-1': { score: 0, total: 1, at: '2026-09-04T10:00:00.000Z' } },
        paths: { 'python-from-zero': { startedAt: '2026-09-04T10:00:00.000Z' } },
        feedback: { 'python/closures': 'yes' },
      }),
    );
    localStorage.setItem('cw:v1:flashcards', JSON.stringify({ cards: [{ id: 'one' }] }));
  });
  await page.goto('/settings/');

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('[data-action="reset-practice"]').click();

  expect(
    await page.evaluate(() => ({
      prefs: JSON.parse(localStorage.getItem('cw:v1:prefs') ?? 'null'),
      progress: JSON.parse(localStorage.getItem('cw:v1:progress') ?? 'null'),
      flashcards: localStorage.getItem('cw:v1:flashcards'),
    })),
  ).toEqual({
    prefs: {
      theme: 'light',
      depth: 'deep',
      fontSize: 'm',
      interviewReveal: 'all',
    },
    progress: {
      topics: { 'python/closures': { readPct: 48, lastAt: '2026-09-04T10:00:00.000Z' } },
      quizzes: {},
      paths: {},
      feedback: { 'python/closures': 'yes' },
    },
    flashcards: '{"cards":[]}',
  });

  await expect(page.locator('[data-action="clear"]')).toBeVisible();
});
