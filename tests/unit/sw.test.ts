import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { buildWorker } from '../../scripts/build-sw.mjs';
import { classifyRequest, isShellAsset, offlineFallback, shouldCachePage } from '@/sw/classify.js';

const ORIGIN = 'https://codewiki.com';

/** The shape `classifyRequest` reads off a real `Request`. */
const req = (url: string, extra: Record<string, string> = {}) => ({
  url: `${ORIGIN}${url}`,
  method: 'GET',
  mode: 'no-cors',
  ...extra,
});

describe('service worker request classification', () => {
  it('never touches a write, and never another origin', () => {
    expect(classifyRequest(req('/python/', { method: 'POST' }), ORIGIN)).toBe('never');
    expect(classifyRequest({ url: 'https://example.com/a.js', method: 'GET' }, ORIGIN)).toBe('never');
    expect(classifyRequest({ url: 'not a url', method: 'GET' }, ORIGIN)).toBe('never');
  });

  it('leaves the live endpoints alone', () => {
    expect(classifyRequest(req('/api/topics.json'), ORIGIN)).toBe('never');
    expect(classifyRequest(req('/rules/python/CLAUDE.md'), ORIGIN)).toBe('never');
    expect(classifyRequest(req('/packs/python/basics.md'), ORIGIN)).toBe('never');
  });

  it('treats the vendored runtimes as opt-in downloads', () => {
    expect(classifyRequest(req('/vendor/pyodide/pyodide.asm.wasm'), ORIGIN)).toBe('runtime');
    expect(classifyRequest(req('/vendor/sql.js/sql-wasm.wasm'), ORIGIN)).toBe('runtime');
    // The runtime rule wins over the navigation rule: /vendor/ is never a page anyway.
    expect(classifyRequest(req('/vendor/pyodide/', { mode: 'navigate' }), ORIGIN)).toBe('runtime');
  });

  it('separates navigations from every other same-origin GET', () => {
    expect(classifyRequest(req('/python/closures/', { mode: 'navigate' }), ORIGIN)).toBe('page');
    expect(classifyRequest(req('/zh/python/', { destination: 'document' }), ORIGIN)).toBe('page');
    expect(classifyRequest(req('/_astro/seo.CXzHnJz8.css'), ORIGIN)).toBe('asset');
    expect(classifyRequest(req('/fonts/ibm-plex-sans-latin-wght-normal.woff2'), ORIGIN)).toBe('asset');
    expect(classifyRequest(req('/og/python/closures.png'), ORIGIN)).toBe('asset');
  });
});

describe('service worker page rules', () => {
  it('stores only navigations without a query', () => {
    expect(shouldCachePage(`${ORIGIN}/python/closures/`)).toBe(true);
    expect(shouldCachePage(`${ORIGIN}/search/?q=closures`)).toBe(false);
    expect(shouldCachePage(`${ORIGIN}/playground/?lang=python`)).toBe(false);
    expect(shouldCachePage('nonsense')).toBe(false);
  });

  it('falls back to the offline notice written in the same language', () => {
    expect(offlineFallback('/python/closures/')).toBe('/offline/');
    expect(offlineFallback('/zh/python/closures/')).toBe('/zh/offline/');
    expect(offlineFallback('/zh')).toBe('/zh/offline/');
    // A track whose slug merely starts with the same two letters is not the Chinese tree.
    expect(offlineFallback('/zhuang/')).toBe('/offline/');
  });

  it('precaches the shell, and nothing that would drag the application in with it', () => {
    expect(isShellAsset('/_astro/seo.CXzHnJz8.css')).toBe(true);
    expect(isShellAsset('/fonts/ibm-plex-mono-latin-400-normal.woff2')).toBe(true);
    expect(isShellAsset('/icons/icon-192.png')).toBe(true);
    expect(isShellAsset('/manifest.webmanifest')).toBe(true);
    expect(isShellAsset('/favicon.svg')).toBe(true);

    expect(isShellAsset('/_astro/Playground.DLE0Xboo.js')).toBe(false);
    expect(isShellAsset('/python/closures/index.html')).toBe(false);
    expect(isShellAsset('/vendor/pyodide/pyodide.js')).toBe(false);
  });
});

describe('the assembled worker', () => {
  async function fixture(css: string) {
    const dist = await mkdtemp(path.join(tmpdir(), 'cw-sw-'));
    await mkdir(path.join(dist, '_astro'));
    await mkdir(path.join(dist, 'offline'), { recursive: true });
    await writeFile(path.join(dist, '_astro/site.css'), css);
    await writeFile(path.join(dist, 'offline/index.html'), '<html></html>');
    return dist;
  }

  const urls = ['/_astro/site.css', '/offline/'];

  it('is a classic script carrying the real file names of the build', async () => {
    const dist = await fixture('body{color:red}');
    const { source, version } = await buildWorker(dist, urls);

    // A worker registered without `{ type: "module" }` cannot carry either keyword.
    expect(source).not.toMatch(/^import\s/m);
    expect(source).not.toMatch(/^export\s/m);

    expect(source).toContain('function classifyRequest(');
    expect(source).toContain(`const VERSION = '${version}';`);
    expect(version).toMatch(/^[0-9a-f]{16}$/);
    for (const url of urls) expect(source).toContain(`"${url}"`);
  });

  it('changes its version when a precached file changes, and only then', async () => {
    const same = await buildWorker(await fixture('body{color:red}'), urls);
    const again = await buildWorker(await fixture('body{color:red}'), urls);
    const changed = await buildWorker(await fixture('body{color:blue}'), urls);

    expect(again.version).toBe(same.version);
    expect(changed.version).not.toBe(same.version);
  });
});
