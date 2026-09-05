import { test, expect, type Locator } from '@playwright/test';

import { firstRunnable } from './fixtures/content';

/**
 * The runners end to end — spec §5.4. These are the tests that prove the claim on the home page:
 * the examples on a topic page really execute, in this browser, with no network round trip.
 */

/** The program's own output lines, with the muted `›` marker stripped back off. */
async function stdout(out: Locator): Promise<string[]> {
  const lines = await out.locator('.line').allInnerTexts();
  return lines.map((line) => line.replace(/^›\s*/, '').trim());
}

test('runs the JavaScript example and prints the event loop in scheduling order', async ({ page }) => {
  await page.goto('/javascript/event-loop/');

  // The island patches server-rendered markup, so wait for it rather than for a rendered widget.
  await expect(page.locator('[data-code-runners][data-ready="true"]')).toBeAttached();

  const box = page.locator('#article .codebox[data-run]').first();
  const out = box.locator('.out');
  await expect(out).toBeHidden();

  await box.locator('button[data-run]').click();
  await expect(out).toBeVisible();
  await expect(out).toContainText('exit 0');

  // The article publishes the output it expects; the runner must reproduce it exactly.
  expect(await stdout(out)).toEqual(firstRunnable('javascript', 'event-loop').output);
});

test('resets an edited example back to what the page shipped', async ({ page }) => {
  await page.goto('/javascript/event-loop/');
  await expect(page.locator('[data-code-runners][data-ready="true"]')).toBeAttached();

  const box = page.locator('#article .codebox[data-run]').first();
  const pre = box.locator('pre');
  const original = (await pre.innerText()).trim();

  await pre.click();
  await pre.press('ControlOrMeta+a');
  await pre.pressSequentially('console.log("edited");');
  await box.locator('button[data-run]').click();
  await expect(box.locator('.out')).toContainText('edited');

  await box.locator('[data-reset]').click();
  expect((await pre.innerText()).trim()).toBe(original);
  await expect(box.locator('.out')).toBeHidden();
});

test.describe('Python', () => {
  // Pyodide is a 13 MB WebAssembly download; the fast lane skips it deliberately.
  test.skip(Boolean(process.env.CI_FAST), 'CI_FAST skips the Pyodide runner');

  test('runs the Python example in the browser', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/python/closures/');
    await expect(page.locator('[data-code-runners][data-ready="true"]')).toBeAttached();

    const box = page.locator('#article .codebox[data-run]').first();
    const out = box.locator('.out');

    await box.locator('button[data-run]').click();
    await expect(out).toContainText('exit 0', { timeout: 55_000 });

    expect((await stdout(out)).join('\n')).toBe(firstRunnable('python', 'closures').output.join('\n'));
  });
});
