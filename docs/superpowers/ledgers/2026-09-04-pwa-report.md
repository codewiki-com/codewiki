# Offline support (PWA) — implementation report

Branch `feat-pwa`, built from `main` at `a3dffda`. Reference: docs/dev/pwa.md.

## What shipped

- `public/manifest.webmanifest` + four committed PNGs in `public/icons/`, rasterised from
  `public/favicon.svg` by `scripts/build-icons.mjs` (`pnpm icons`). Linked from `Base.astro`
  together with `apple-touch-icon`.
- `src/sw/sw.js` + `src/sw/classify.js`, assembled into `dist/sw.js` by the `codewiki:pwa` Astro
  integration in `scripts/build-sw.mjs` on `astro:build:done`.
- `/offline/` and `/zh/offline/` (`src/pages-shared/Offline.astro`), `noindex`, out of the sitemap,
  reusing the home OG card.
- `src/components/OfflineSave.astro` — one control, used on every track hub ("Save this track
  offline") and on `/playground/` ("Download runtimes for offline (≈27 MB)").
- `prefs.offline` (`{ tracks: Record<string, number>, runtimes: boolean }`) in `src/lib/prefs.ts`.
- `Cache-Control: no-cache` for `/sw.js` in `public/_headers`; one line in docs/dev/deploy.md.

## What is cached, and how much

Precache (`cw-shell-{version}`, filled on `install`): **27 files, 383 KiB uncompressed**.

| kind | files | bytes |
| --- | --- | --- |
| stylesheets (`/_astro/*.css`) | 8 | 145.4 KiB |
| fonts (`/fonts/*.woff2`) | 8 | 159.2 KiB |
| the two offline notices | 2 | 42.5 KiB |
| icons + favicon | 5 | 24.9 KiB |
| scripts the notices load | 3 | 10.6 KiB |
| `manifest.webmanifest` | 1 | 0.7 KiB |

The other four caches fill on demand and survive a deploy: `cw-pages-v1` (navigations,
network-first, LRU 300), `cw-assets-v1` (other same-origin GETs, stale-while-revalidate, LRU 400),
`cw-saved-v1` (tracks the reader saved; not evicted — the Python track is 46 URLs, both languages),
`cw-runtime-v1` (`/vendor/**`, 9 files, 26.9 MB, only on request).

Never intercepted: cross-origin, non-GET, `/api/**`, `/rules/**`, `/packs/**`. `/vendor/**` is
served from the cache only if it was explicitly downloaded, never stored by browsing.

`dist/sw.js` is 13,655 B (5,061 B gzipped). `VERSION` is a SHA-256 over the worker source, the
precache list and the bytes of every precached file, so an unchanged deploy produces a
byte-identical worker and no update notice. Re-running the integration by hand over an unchanged
`dist` reproduced the hash the build had just written, so the version is a function of the output
and not of the run.

## Client cost on a topic page

No new network JavaScript: the registration is **585 B inline** in `Base.astro`, plus 483 B of
markup for the hidden update notice. The offline copy deliberately lives in `src/i18n/offline.ts`
rather than `en.ts`/`zh.ts` — 17 keys in the shared dictionary measured **+620 B gzipped** on the
`i18n` chunk that every page downloads, and it is only ever read in `.astro` frontmatter.

## Gate results

- `pnpm lint` — PASS.
- `pnpm check` — PASS: 318 files, 0 errors, 0 warnings, 1 pre-existing hint.
- `pnpm test` — 2,368/2,369. The single failure, `content/code-check.test.ts › separates java
  syntax errors from fragment diagnostics`, is a 5 s timeout on a machine running five builds at
  once; it passes in isolation here and fails the same way on `main`.
- `pnpm build` — PASS: 5,851 pages; `[codewiki:pwa] sw.js 6d1773398e5651e0 · precaches 27 files,
  383 KiB`.
- `pnpm check:links` — PASS: 146,485 internal links across 5,852 pages, all resolve.
- `pnpm exec playwright test tests/e2e/pwa.spec.ts` — PASS, 5/5 in 38.5 s.
- `pnpm exec playwright test tests/e2e/topic.spec.ts` — 17/21. The four failures are content drift
  that predates this branch: the spec expects `make_counter.py`, `dateModified 2026-09-03` and a
  deep contents entry, while `src/content/topics/python/closures.en.mdx` at the branch point (and
  on `main` today) has `label_factory.py` and `reviewed: 2026-09-04`. This branch changes no
  content, no markdown plugin and not that spec.
- `pnpm exec lhci autorun` — FAIL on one new assertion, see below. Accessibility, best-practices
  and SEO are 1.00 everywhere except the pre-existing `/practice/` failures; performance is
  0.97–1.00 on the nine other URLs. The service worker costs no measurable performance.

### The one new failure: the topic script budget, by 42 bytes

`resource-summary:script:size` on `/python/closures/` measured **61,482 B against the 61,440 B
(60 KiB) ceiling**. A baseline run of the same `lighthouserc.json` against `main`'s `dist` measures
**61,429 B** — eleven bytes of headroom before this branch existed.

Per-chunk diff against that baseline, after the i18n strings were moved out of the client bundle:

| chunk | delta | why |
| --- | --- | --- |
| `prefs.js` | +53 B | `prefs.offline` and its validation |

That is the whole of it. The field cannot be dropped: `ThemeToggle`, `DepthDial` and the settings
form all write prefs back through `readStore`, so a key `sanitizePrefs` does not recognise is
erased the first time a reader changes their theme. The validation is already the cheap
collection-level form the file uses for `progress`; a bare passthrough would save about 33 B and
still not fit.

Two ways out, both for the design lead to choose:

1. Raise the topic ceiling in `lighthouserc.json` from 61,440 to 62,464 (61 KiB). The spec's "≤ 60
   KB gzipped" was already being met with 0.02% to spare, so any future feature hits this too.
2. Or make room: the `i18n` chunk is 18.2 KB gzipped **and ships both locales to every page**.
   Serving one locale per build would free roughly 9 KB and give the budget real headroom. That is
   a change to shared infrastructure and was out of scope here.

Also worth knowing: this assertion is not stable. Several islands hydrate `client:visible`, so the
set of chunks Lighthouse observes depends on what scrolled into view — across runs the same page
measured 40,062 B and 61,482 B. At 99.9% utilisation the gate will flake either way.

## Pre-existing failures, unchanged by this branch

Confirmed by running the same `lhci autorun` against `main`'s `dist`: `unused-css-rules` fails on
`/`, `/python/`, `/practice/`, `/practice/flashcards/` and `/cheatsheets/python/`, and `/practice/`
fails `categories.performance`, `categories.seo` and `link-text`.

## Unverified

- **iOS.** `apple-touch-icon` and `display: standalone` are declared but were not tested on a real
  device; Safari's service-worker behaviour (7-day eviction of unused storage) is untested.
- **A real deploy.** `Cache-Control: no-cache` on `/sw.js` is written for Cloudflare Pages and was
  not exercised; `astro preview` sends no such header, so the update path was tested through a
  second `register()` call with a different script URL rather than through a second deploy. The
  browser installs it without the byte comparison, which is the same code path a deploy takes, but
  the header itself is unproven in production.
- **The runtimes download.** The e2e test asserts that `/vendor/**` is never cached by browsing and
  that the button renders with the right label; it does not download 27 MB. The message protocol it
  uses is the one the track save exercises end to end.
- **LRU eviction.** The 300-entry page cap and the 400-entry asset cap are implemented and read
  straightforwardly, but no test fills a cache past them.
- **Chromium only.** Playwright runs one project; Firefox and Safari service-worker behaviour is
  untested.
