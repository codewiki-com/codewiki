import { expect, test, type Page } from '@playwright/test';

/**
 * Offline support. Every test starts from a page load, because the worker is registered on the
 * `load` event and only takes control (through `clients.claim()`) once it has activated.
 */

/** Resolves once the worker controls this page — before that, nothing is being intercepted. */
async function controlled(page: Page) {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
    timeout: 30_000,
  });
}

/** Resolves once `install` has finished filling the versioned shell cache. */
async function precached(page: Page) {
  await page.waitForFunction(
    async () => {
      const name = (await caches.keys()).find((key) => key.startsWith('cw-shell-'));
      if (!name) return false;
      const cache = await caches.open(name);
      return Boolean(await cache.match('/offline/')) && Boolean(await cache.match('/zh/offline/'));
    },
    null,
    { timeout: 30_000 },
  );
}

test('a page read online is still there when the network is not', async ({ page, context }) => {
  await page.goto('/python/closures/');
  await controlled(page);
  await precached(page);

  // The first load happened before the worker existed; this one goes through it and is stored.
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Closures');

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Closures');
  await expect(page.locator('#article .tldr .tldr-cell')).toHaveCount(3);
  await context.setOffline(false);
});

test('a page never opened falls back to the notice in its own language', async ({ page, context }) => {
  await page.goto('/python/closures/');
  await controlled(page);
  await precached(page);
  await context.setOffline(true);

  await page.goto('/rust/ownership-and-moves/');
  await expect(page.locator('h1')).toHaveText('You are offline');

  await page.goto('/zh/rust/ownership-and-moves/');
  await expect(page.locator('h1')).toHaveText('你当前处于离线状态');

  await context.setOffline(false);
});

test('saving a track offline stores its pages and they open without a network', async ({ page, context }) => {
  test.setTimeout(180_000);
  await page.goto('/python/');
  await controlled(page);
  await precached(page);

  const control = page.locator('#track-offline');
  const button = control.locator('[data-offline-action]');
  await expect(button).toBeVisible();
  await expect(button).toHaveText('Save this track offline');

  await button.click();
  await expect(control).toHaveAttribute('data-state', 'saved', { timeout: 150_000 });
  await expect(button).toHaveText('Remove');
  await expect(control.locator('[data-offline-status]')).toContainText('Saved');

  const stored = await page.evaluate(async () => {
    const cache = await caches.open('cw-saved-v1');
    return (await cache.keys()).map((request) => new URL(request.url).pathname);
  });
  expect(stored.length).toBeGreaterThanOrEqual(3);
  expect(stored).toContain('/python/closures/');
  // Both languages of the track, so the language switch keeps working on a plane.
  expect(stored).toContain('/zh/python/closures/');

  await context.setOffline(true);
  await page.goto('/python/closures/');
  await expect(page.locator('h1')).toHaveText('Closures');
  await page.goto('/zh/python/closures/');
  await expect(page.locator('h1')).not.toHaveText('你当前处于离线状态');
  await context.setOffline(false);

  // And Remove puts it back the way it was.
  await page.goto('/python/');
  await controlled(page);
  await expect(button).toHaveText('Remove');
  await button.click();
  await expect(control).toHaveAttribute('data-state', 'idle', { timeout: 60_000 });
  const left = await page.evaluate(async () => (await (await caches.open('cw-saved-v1')).keys()).length);
  expect(left).toBe(0);
});

test('a newer worker offers a reload instead of taking over', async ({ page }) => {
  await page.goto('/python/closures/');
  await controlled(page);

  const toast = page.locator('[data-pwa-toast]');
  await expect(toast).toBeHidden();

  // A second registration under a script URL the browser has not stored is installed without the
  // byte comparison that would otherwise short-circuit it, which is what a deploy looks like from
  // the page's side: a worker that reaches `installed` and then waits.
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js?build=next');
  });

  await expect(toast).toBeVisible({ timeout: 30_000 });
  await expect(toast).toContainText('A new version is available');

  // Until Reload is pressed the reader keeps the version in front of them.
  const controller = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? '');
  expect(controller).not.toContain('build=next');

  await toast.locator('button').click();
  await page.waitForFunction(
    () => Boolean(navigator.serviceWorker.controller?.scriptURL.includes('build=next')),
    null,
    { timeout: 30_000 },
  );
  await expect(page.locator('h1')).toHaveText('Closures');
});

test('the runtimes are not cached until the playground is asked to download them', async ({ page }) => {
  await page.goto('/playground/');
  await controlled(page);

  // Loading the playground fetches nothing from /vendor/ until Run is pressed, and even then the
  // worker refuses to store it: 27 MB is a decision, not a side effect of browsing.
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const found: string[] = [];
    for (const name of names) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        if (new URL(request.url).pathname.startsWith('/vendor/')) found.push(request.url);
      }
    }
    return found;
  });
  expect(cached).toEqual([]);

  const button = page.locator('#playground-offline [data-offline-action]');
  await expect(button).toBeVisible();
  await expect(button).toContainText('Download runtimes for offline');
});
