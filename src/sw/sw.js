/**
 * codewiki's service worker — the template, not the shipped file.
 *
 * `scripts/build-sw.mjs` inlines `./classify.js`, fills in `VERSION` and `PRECACHE` from the real
 * build output, and writes the result to `dist/sw.js`. A worker has no bundler, so the shipped file
 * is one flat classic script; keeping the source here means it is linted, formatted and readable
 * like the rest of `src/`.
 *
 * Strategy, in one paragraph. Navigations go to the network first, so a reader who is online never
 * sees yesterday's HTML after a deploy; the cached copy is the answer only when the network fails,
 * and `/offline/` is the answer when even that misses. Everything else same-origin is stale while
 * revalidate, except the precached shell, which is cache-first because its cache name carries the
 * build hash and is thrown away whole on the next deploy. `/vendor/`, `/api/`, `/rules/` and
 * `/packs/` are never stored by browsing alone — the runtimes because they are 27 MB, the others
 * because they are data a reader asks for by name. See docs/dev/pwa.md.
 */
import { classifyRequest, offlineFallback, shouldCachePage } from './classify.js';

/* Both lines are rewritten by scripts/build-sw.mjs; the values here are what `astro dev` would see
   if the file were ever served unbuilt. */
const VERSION = 'dev';
const PRECACHE = [];

/** Rebuilt on every deploy: the name carries the build hash, so `activate` drops the old one. */
const SHELL = `cw-shell-${VERSION}`;
/** Kept across deploys: what the reader browsed, what they saved, what they downloaded. */
const PAGES = 'cw-pages-v1';
const ASSETS = 'cw-assets-v1';
const SAVED = 'cw-saved-v1';
const RUNTIME = 'cw-runtime-v1';

const KEEP = [SHELL, PAGES, ASSETS, SAVED, RUNTIME];

/** Least-recently-used ceilings. Pages are ~40 KB each, assets smaller and mostly immutable. */
const PAGE_LIMIT = 300;
const ASSET_LIMIT = 400;

/** Which cache an explicit "save this offline" request writes to. */
const SCOPES = { track: SAVED, runtimes: RUNTIME };

self.addEventListener('install', (event) => {
  event.waitUntil(precache());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(cleanup());
});

self.addEventListener('fetch', (event) => {
  const kind = classifyRequest(event.request, self.location.origin);
  // `never` means exactly that: no `respondWith`, so the browser performs its own fetch and the
  // worker is not in the path at all.
  if (kind === 'never') return;
  if (kind === 'runtime') event.respondWith(fromRuntime(event.request));
  else if (kind === 'page') event.respondWith(fromNetworkFirst(event));
  else event.respondWith(fromStaleWhileRevalidate(event));
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  const port = event.ports && event.ports[0];

  // The page asks for this only after the reader clicks Reload in the update toast.
  if (data.type === 'skip-waiting') return void self.skipWaiting();
  if (data.type === 'version') return void reply(port, { type: 'version', version: VERSION });
  if (data.type === 'save') return void event.waitUntil(save(data, port));
  if (data.type === 'forget') return void event.waitUntil(forget(data, port));
});

/**
 * Fills the shell cache one file at a time. `cache.addAll` rejects as a unit, so a single missing
 * file would leave a freshly installed worker with an empty cache and no offline page at all.
 */
async function precache() {
  const cache = await caches.open(SHELL);
  await Promise.all(
    PRECACHE.map((url) =>
      cache.add(new Request(url, { cache: 'reload' })).catch(() => {
        /* one file short is worth more than nothing cached */
      }),
    ),
  );
}

/** Drops shell caches from older builds, then takes over the pages already open. */
async function cleanup() {
  for (const name of await caches.keys()) {
    if (name.startsWith('cw-') && !KEEP.includes(name)) await caches.delete(name);
  }
  await self.clients.claim();
}

/**
 * Extends the event's lifetime around a background write. An event that has already settled
 * refuses `waitUntil`, and an exception thrown inside a revalidation would otherwise reject the
 * response the reader is waiting for — so the refusal is swallowed and the write runs anyway.
 */
function keepAlive(event, promise) {
  try {
    event.waitUntil(promise);
  } catch {
    /* no longer extendable */
  }
  return promise;
}

/**
 * One lookup in one named cache. `caches.match` with a `cacheName` that has never been opened is
 * not a miss in every engine — some reject — and the opt-in caches do not exist until the reader
 * saves something, so every read goes through here.
 */
async function lookup(name, request, options) {
  try {
    return await caches.match(request, { ...options, cacheName: name });
  } catch {
    return undefined;
  }
}

/** Pyodide, sql.js and esbuild: served from the cache when downloaded, never stored by browsing. */
async function fromRuntime(request) {
  const cached = await lookup(RUNTIME, request);
  return cached ?? fetch(request);
}

/** Navigations: network, then what the reader saved, then what they browsed, then `/offline/`. */
async function fromNetworkFirst(event) {
  const { request } = event;
  try {
    const response = await fetch(request);
    if (response.ok && shouldCachePage(request.url)) {
      keepAlive(event, store(PAGES, request, response.clone(), PAGE_LIMIT));
    }
    return response;
  } catch {
    // `ignoreSearch` so a link carrying a tracking or share parameter still finds its page.
    for (const name of [SAVED, PAGES, SHELL]) {
      const hit = await lookup(name, request, { ignoreSearch: true });
      if (hit) return hit;
    }
    const path = new URL(request.url).pathname;
    const offline = await lookup(SHELL, offlineFallback(path));
    return offline ?? new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

/** Everything else same-origin. The precached shell answers immediately; the rest revalidates. */
async function fromStaleWhileRevalidate(event) {
  const { request } = event;
  const shell = await lookup(SHELL, request);
  if (shell) return shell;

  const cached = await lookup(ASSETS, request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) keepAlive(event, store(ASSETS, request, response.clone(), ASSET_LIMIT));
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    keepAlive(event, network);
    return cached;
  }
  return (await network) ?? new Response('', { status: 504 });
}

/**
 * Writes one response and trims the cache. The delete before the put is what makes the trim a
 * least-recently-used eviction: the Cache API keeps insertion order, so re-writing an entry moves
 * it to the end and the oldest keys fall off the front.
 */
async function store(name, request, response, limit) {
  const cache = await caches.open(name);
  await cache.delete(request);
  await cache.put(request, response);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - limit; i += 1) await cache.delete(keys[i]);
}

/** Downloads a list of URLs into one of the opt-in caches, reporting `n/total` as it goes. */
async function save(data, port) {
  const name = SCOPES[data.scope];
  const urls = Array.isArray(data.urls) ? data.urls.filter((url) => typeof url === 'string') : [];
  if (!name || urls.length === 0) return reply(port, { type: 'done', ok: 0, failed: urls.length, total: 0 });

  const cache = await caches.open(name);
  let ok = 0;
  let failed = 0;
  for (const url of urls) {
    try {
      const response = await fetch(new Request(url, { cache: 'reload' }));
      if (!response.ok) throw new Error(String(response.status));
      await cache.put(new Request(url), response);
      ok += 1;
    } catch {
      // One page short of the whole track is still a track the reader can read on a plane.
      failed += 1;
    }
    reply(port, { type: 'progress', done: ok + failed, total: urls.length, ok, failed });
  }
  reply(port, { type: 'done', ok, failed, total: urls.length });
}

/** Clears one opt-in cache, or just the named URLs inside it. */
async function forget(data, port) {
  const name = SCOPES[data.scope];
  if (!name) return reply(port, { type: 'done', ok: 0, failed: 0, total: 0 });

  const urls = Array.isArray(data.urls) ? data.urls.filter((url) => typeof url === 'string') : [];
  if (urls.length > 0) {
    const cache = await caches.open(name);
    for (const url of urls) await cache.delete(new Request(url), { ignoreSearch: true });
  } else {
    await caches.delete(name);
  }
  reply(port, { type: 'done', ok: 0, failed: 0, total: 0 });
}

function reply(port, message) {
  if (port) port.postMessage(message);
}
