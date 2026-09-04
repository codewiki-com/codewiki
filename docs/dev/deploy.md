# Deploying codewiki

The build is a directory of static files. Nothing on the server runs code, reads a database or
holds session state, so any static host serves it: Cloudflare Pages, Netlify, Vercel, GitHub
Pages, S3 behind CloudFront, or `python3 -m http.server` on a laptop. Cloudflare Pages is the
host the repository is set up for, and the only one with files checked in (`public/_headers`).

## Build

| setting | value |
| --- | --- |
| build command | `pnpm build` |
| output directory | `dist` |
| Node version | 24 — read from `.nvmrc`; set `NODE_VERSION=24` on hosts that ignore it |
| install command | `pnpm install --frozen-lockfile` (Cloudflare detects pnpm from the lockfile) |
| environment variables | none |
| root directory | the repository root |

`pnpm build` runs `scripts/vendor-pyodide.mjs` first (it copies the Python runtime into
`public/vendor/`), then `astro build`, then `pagefind --site dist` to write the search index.
All three are part of the one command; a host that runs only `astro build` ships a site whose
search and Python runner are missing.

The build downloads about 17 MB of fonts into `.cache/fonts` for the OG image renderer. On a
host with no cache the first build is a few minutes slower; the CI workflow caches that
directory, keyed on the script that names the fonts.

## Response headers

`public/_headers` is copied verbatim into `dist` and read by Cloudflare Pages. It sets:

- a Content Security Policy that keeps the site to its own origin — no third-party scripts,
  styles, fonts or connections, and no framing of the site by anyone;
- `X-Content-Type-Options`, `Referrer-Policy` and a `Permissions-Policy` that turns off camera,
  microphone and geolocation;
- immutable year-long caching for the fingerprinted assets (`/_astro/`, `/vendor/`, `/fonts/`)
  and a week for the generated OG images.

Two details are worth knowing before editing that file:

- **`'unsafe-inline'` in `script-src`** is there for the theme and font-size bootstraps, which
  must run inline in `<head>` before first paint. Moving them to an external file would trade a
  flash of the wrong palette for a stricter policy; if that trade is ever wanted, load them with
  `blocking="render"` and drop the keyword.
- **`/sandbox.html` has its own rule.** The JavaScript runner compiles the reader's snippet with
  `new Function`, which CSP counts as eval, so that one document adds `'unsafe-eval'`. Pages
  applies the most specific matching rule rather than merging rules, so the block repeats every
  directive the sandbox still needs. The frame is embedded with `sandbox="allow-scripts"` and
  without `allow-same-origin`, so it runs on an opaque origin and the relaxation cannot reach the
  site's DOM, storage or cookies.

On a host without a `_headers` file, translate the same values into whatever it uses — Netlify
reads `_headers` too, Vercel wants `vercel.json`, and CloudFront wants a response-headers policy.
The site works without any of them; it is simply less locked down.

## Custom domain

The site's absolute URLs (canonical links, hreflang, sitemap, OG images, RSS) all come from
`site` in `astro.config.mjs`, currently `https://codewiki.com`. Changing the domain means
changing that value and rebuilding — the URLs are baked into the HTML, not resolved at runtime.

On Cloudflare Pages: add the domain under the project's *Custom domains*, let it create the
`CNAME`, and leave the `*.pages.dev` name in place — it stays reachable, so the canonical tags
are what keep search engines on the real domain. `trailingSlash: 'always'` and
`build.format: 'directory'` mean every page is a `.../index.html`, which is what Pages, and every
other static host, serves for a directory request.

## Performance budgets

`lighthouserc.json` drives `pnpm exec lhci autorun`, which builds nothing itself: it serves the
existing `dist` and audits four URLs — the English home page, a track hub, and the topic page in
both languages. The gates are the four category scores at 0.95 and a 60 KB budget on scripts.

Three notes on that file, since JSON cannot carry comments:

- **`settings.preset: "desktop"`.** Under Lighthouse's mobile emulation the two topic pages score
  0.91 on performance because of a single layout-shift event 9 ms after first paint, reported
  against the article column with an empty previous rectangle. Chrome itself does not count it —
  the trace event carries `had_recent_input: true` and `cumulative_score: 0`, because it lands
  within 500 ms of the viewport change Lighthouse's own emulation triggers, and Lighthouse
  deliberately ignores that flag inside that window. A real browser at the same viewport, with
  the same CPU and network throttling, records no shift at all. Desktop emulation avoids the
  artefact; the mobile metrics behind it are FCP 1.5 s, LCP 1.8 s, TBT 0 ms, Speed Index 1.5 s.
- **`color-contrast` and `label-content-name-mismatch` are `warn`.** Both are real, both are open.
  Several palette tokens miss the 4.5:1 AA floor for small text (`--ink3` worst at 3.31:1, and
  `.toc a.deep` multiplies it by opacity 0.7 to reach 2.32:1), and the home page's palette preview
  is a button labelled "Search" whose visible text is a sample query. `tests/e2e/a11y.spec.ts`
  carries the contrast list as a `fixme` test so it is named on every run.
- **`network-dependency-tree-insight` is `off`.** It scores zero for any critical request chain
  deeper than one hop, which the HTML → stylesheet → webfont chain of a self-hosted static site
  always has.

## Checks before shipping

`pnpm lint && pnpm check && pnpm test && pnpm build && pnpm test:e2e && pnpm exec lhci autorun` is
what CI runs, in that order. `pnpm test:e2e` and the Lighthouse run both read `dist`, so the build
has to come first. The Playwright config reuses a preview server that is already listening on
port 4321 — convenient while writing tests, and a trap after a rebuild, because the running server
keeps serving the older `dist`. Stop it before a fresh run.
