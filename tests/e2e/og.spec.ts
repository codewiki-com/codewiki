import { test, expect } from '@playwright/test';

test('the build writes an OG card for a topic', async ({ request }) => {
  const res = await request.get('/og/python/closures.png');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
  expect((await res.body()).byteLength).toBeGreaterThan(10_000);
});

test('the Chinese card lives under /og/zh', async ({ request }) => {
  const res = await request.get('/og/zh/python/closures.png');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
  expect((await res.body()).byteLength).toBeGreaterThan(10_000);
});

test('track hubs, practice catalogues and the home page get cards too', async ({ request }) => {
  for (const path of [
    '/og/python.png',
    '/og/home.png',
    '/og/zh/home.png',
    '/og/practice/javascript.png',
    '/og/zh/practice/javascript.png',
  ]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
  }
});
