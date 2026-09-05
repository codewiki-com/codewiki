# Offline support

codewiki installs a service worker so a reader who loses the network keeps the pages they have
already opened, and can deliberately take a whole track — or the Python and SQL runtimes — with
them before they leave. There is no application shell to boot and no client-side router: every page
is still a static HTML document, and the worker only decides where that document comes from.

Three files carry the feature:

| file | what it is |
| --- | --- |
| `public/manifest.webmanifest` | name, colours and icons for an installed window |
| `src/sw/sw.js` + `src/sw/classify.js` | the worker, as source; `scripts/build-sw.mjs` assembles it |
| `src/components/OfflineSave.astro` | the "save this offline" button, used twice |

The copy lives in `src/i18n/offline.ts`, not in `en.ts`/`zh.ts`. Every island imports `@/i18n`, so
that dictionary ships in a chunk each page downloads — both locales of it, about 18 KB gzipped
against a 60 KiB topic-page script budget that has almost nothing left. These strings are only read
in `.astro` frontmatter, so their own module keeps them out of the browser entirely. Anything a
future island needs to say still belongs in the shared dictionaries.

`public/icons/*.png` are committed, not generated at build time: `public/` is copied verbatim into
`dist`, so a build step would leave `pnpm dev` and `pnpm check:links` without the files the head
links to. Re-run `pnpm icons` after editing `public/favicon.svg`.

## What is cached

The worker keeps five caches. Only the first is rebuilt by a deploy; the others survive it, which
is what makes a saved track survive one too.

| cache | holds | filled by | bound |
| --- | --- | --- | --- |
| `cw-shell-{version}` | every `/_astro/*.css`, `/fonts/*`, `/icons/*`, `/favicon.svg`, `/manifest.webmanifest`, both offline notices and the scripts they load | `install` | the build |
| `cw-pages-v1` | HTML of pages the reader navigated to | browsing | 300 entries, LRU |
| `cw-assets-v1` | other same-origin GETs — hashed scripts, OG images, the Pagefind index | browsing | 400 entries, LRU |
| `cw-saved-v1` | the pages of tracks saved from a track hub | the Save button | not evicted |
| `cw-runtime-v1` | `/vendor/**` — Pyodide, sql.js, esbuild | the Playground button | not evicted |

The strategies follow from that split:

- **Navigations are network-first.** An online reader always gets the HTML the server has, so a
  deploy is never silently hidden behind a cached page. Only when the network fails does the worker
  look in `cw-saved-v1`, then `cw-pages-v1`, then the shell, and finally answer with `/offline/`
  (or `/zh/offline/`, chosen by the URL prefix). Navigations carrying a query string are served but
  not stored: a search or a shared playground snippet is a one-off.
- **The precached shell is cache-first.** Its cache name carries the build hash, so a new build
  cannot be answered from an old shell — the old cache is deleted whole on `activate`.
- **Everything else same-origin is stale-while-revalidate.**
- **`/vendor/**` is cache-only-if-downloaded.** It is served from `cw-runtime-v1` when the reader
  asked for it and fetched straight from the network otherwise, never stored as a side effect of
  pressing Run.
- **`/api/**`, `/rules/**` and `/packs/**` are never intercepted at all.** The worker does not call
  `respondWith` for them, so the browser fetches them itself.
- **Cross-origin requests and anything that is not a GET are never intercepted either.**

`src/sw/classify.js` is the single statement of those rules. It is inlined into the shipped worker
by the build and imported directly by `tests/unit/sw.test.ts`, so the tested rules are the shipped
ones.

`install` adds the precache one file at a time rather than through `cache.addAll`, which rejects as
a unit: one missing file after a partial deploy would otherwise leave a worker with no offline page
at all.

## How versioning works

`scripts/build-sw.mjs` runs as an Astro integration on `astro:build:done`, when the content-hashed
file names finally exist. It:

1. collects the precache list from the real build output;
2. hashes the worker source, `classify.js`, the list, and the bytes of every file in it;
3. writes `dist/sw.js` with `VERSION` set to the first 16 hex digits of that hash and `PRECACHE`
   set to the list.

So a deploy that changed nothing a reader can see produces a byte-identical worker, the browser's
update check short-circuits, and nothing happens. A deploy that changed a stylesheet, an offline
page or the worker itself produces a different `VERSION`, a new shell cache, and an update.

**The update is never applied behind the reader's back.** A newly installed worker waits. The
registration script in `src/layouts/Base.astro` reveals a one-line notice — "A new version is
available · Reload" — and only when that button is pressed does it send `skip-waiting`, wait for
`controllerchange`, and reload. A reader who ignores the notice keeps reading the version already
in front of them.

`public/_headers` serves `/sw.js` with `Cache-Control: no-cache` for the same reason: a browser
holding a stale copy of the worker would keep a stale precache and never notice a new build.

## Saving a track, downloading the runtimes

Both buttons are the same component. The list of URLs is server-rendered as a
`<script type="application/json">` tag, the button posts it to the worker over a `MessageChannel`,
and the worker fetches each URL in turn and reports `n/total` back. A URL that fails is counted and
skipped, never aborting the rest.

- **Track hub** — "Save this track offline" saves the hub and every topic in it *in both
  languages*, so the language switch keeps working without a network. A topic with no published
  twin contributes only the page that exists.
- **Playground** — "Download runtimes for offline" saves everything under `public/vendor/`, about
  27 MB of WebAssembly. The list comes from `src/lib/vendor-manifest.ts`, which reads the directory
  at build time; `public/vendor/` is git-ignored and produced by `pnpm prebuild`, so on a checkout
  that has not run it the button renders hidden rather than lying about what it would download.

What was saved is remembered in `prefs.offline` (`localStorage`, key `cw:v1:prefs`) so the button
can show "Saved · n pages" on the next visit. That is bookkeeping only — the pages live in the
worker's caches. If the two disagree, pressing the button again fixes it.

## Forcing a refresh

- **As a reader:** press Reload in the update notice. Failing that, a hard reload
  (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>) bypasses the worker for that
  one navigation; it does not replace the worker.
- **As a developer:** DevTools → Application → Service workers → *Update on reload* while working,
  or *Unregister* followed by a reload for a clean state. Application → Storage → *Clear site data*
  removes every cache, every saved track and the downloaded runtimes.
- **From the console:**
  ```js
  await navigator.serviceWorker.getRegistration().then((r) => r?.unregister());
  await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
  location.reload();
  ```

## Working on it

`dist/sw.js` is written by the build, so `astro dev` serves no worker at all: the registration call
404s, the failure is caught, and the site behaves exactly as it did before this feature. To exercise
offline support locally, run `pnpm build && pnpm preview`.

The Content Security Policy in `public/_headers` already allows the worker — `worker-src 'self'
blob:` — and the worker only ever fetches its own origin, so `connect-src 'self'` is enough.

Coverage:

- `tests/unit/sw.test.ts` — the classification rules, and that the assembled worker is a classic
  script whose version moves with its precached files and not otherwise.
- `tests/e2e/pwa.spec.ts` — read a page online and reload it offline; navigate offline to a page
  never opened and land on the localized notice; save a track and read it offline, then remove it;
  see the update notice when a second worker installs, and take the update only on the click.
