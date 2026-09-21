# Deploying codewiki

The build is a directory of static files. Nothing on the server runs code, reads a database or
holds session state, so any static host serves it: Cloudflare Pages, Netlify, Vercel, GitHub
Pages, S3 behind CloudFront, or `python3 -m http.server` on a laptop. Cloudflare Pages is the
host the repository is set up for, and the only one with files checked in (`public/_headers`).

## Cloudflare Pages Free

The Direct Upload project is `codewiki` in the `tomchen` account, with `main` as its production branch and
`https://codewiki.pages.dev` as its Pages address. The canonical domain is
`https://codewiki.com`.

The source repository is [codewiki-com/codewiki](https://github.com/codewiki-com/codewiki).
Pushing to `main` runs `.github/workflows/ci.yml`: lint, type checks, unit tests, the static build,
link checks, browser tests and Lighthouse. Only a successful run on `main` publishes the exact
tested `dist/` to Pages. Pull requests run the checks without deploying. The workflow can also
be started manually from GitHub Actions.

Set the repository's `CLOUDFLARE_API_TOKEN` Actions secret to a token with **Cloudflare Pages →
Edit** permission for the `tomchen` account. The account and project IDs are in `wrangler.jsonc`;
credentials are never committed. No Cloudflare Git integration or Cloudflare build is needed.
The CI token does not need DNS permissions. Any token used for the initial custom-domain DNS
migration stays local and can be revoked after the domain is active.

For a manual deployment from the local working tree:

```sh
npx --yes wrangler@4.135.0 login
pnpm run deploy
```

`pnpm run deploy` rebuilds the current working tree, checks internal links and uploads only `dist/`.
It does not commit or push source code. `wrangler.jsonc` selects the Pages project and output
directory. The `--force` option keeps Wrangler 4.135.0 on Pages instead of delegating to Workers.

This is a static deployment with no Pages Functions, database or paid bindings. Pages Free
allows 20,000 files and a maximum of 25 MiB per file. Use Wrangler to upload the full site; the
dashboard's drag-and-drop uploader only accepts 1,000 files.

The custom domain must also be added under the project's **Custom domains**. An apex domain
such as `codewiki.com` must be an active Cloudflare zone in the same account as the Pages project.
Creating the Pages project alone does not change the domain's existing DNS or website.

References: [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/),
[limits](https://developers.cloudflare.com/pages/platform/limits/) and
[custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).

## Build

| setting | value |
| --- | --- |
| build command | `pnpm build` |
| output directory | `dist` |
| Node version | 24 — read from `.nvmrc`; set `NODE_VERSION=24` on hosts that ignore it |
| install command | `pnpm install --frozen-lockfile` (Cloudflare detects pnpm from the lockfile) |
| environment variables | none |
| root directory | the repository root |

`pnpm build` runs its `prebuild` lifecycle first. That invokes `scripts/vendor-pyodide.mjs` and
`scripts/vendor-sqljs.mjs`, which copy the Python and SQL runtimes into `public/vendor/`. The build
then runs `astro build` and `pagefind --site dist` to write the search index. All four operations
are part of the one command; a host that runs only `astro build` ships a site whose search, Python
runner and SQL runner are missing.

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
  and a week for the generated OG images;
- `Cache-Control: no-cache` on `/sw.js` — the service worker must be revalidated on every update
  check, or a browser keeps an old precache and never offers the new build (docs/dev/pwa.md).

Two details are worth knowing before editing that file:

- **`'unsafe-inline'` in `script-src`** is there for the theme and font-size bootstraps, which
  must run inline in `<head>` before first paint. Moving them to an external file would trade a
  flash of the wrong palette for a stricter policy; if that trade is ever wanted, load them with
  `blocking="render"` and drop the keyword.
- **`/sandbox.html` and `/sandbox` have their own rules.** Pages redirects the former to the
  extensionless URL, so both responses need the sandbox policy. The JavaScript runner compiles the reader's snippet with
  `new Function`, which CSP counts as eval, so that one document adds `'unsafe-eval'`. Pages
  merges every matching rule, so the sandbox block uses `! Content-Security-Policy` to detach the
  global value before setting its own complete policy. The frame is embedded with
  `sandbox="allow-scripts"` and without `allow-same-origin`, so it runs on an opaque origin and the
  relaxation cannot reach the site's DOM, storage or cookies.

On a host without a `_headers` file, translate the same values into whatever it uses — Netlify
reads `_headers` too, Vercel wants `vercel.json`, and CloudFront wants a response-headers policy.
The site works without any of them; it is simply less locked down.

## Custom domain

The site's absolute URLs (canonical links, hreflang, sitemap and OG images) all come from
`site` in `astro.config.mjs`, currently `https://codewiki.com`. Changing the domain means
changing that value and rebuilding — the URLs are baked into the HTML, not resolved at runtime.

On Cloudflare Pages: add the domain under the project's *Custom domains*, let it create the
`CNAME`, and leave the `*.pages.dev` name in place — it stays reachable, so the canonical tags
are what keep search engines on the real domain. `trailingSlash: 'always'` and
`build.format: 'directory'` mean every page is a `.../index.html`, which is what Pages, and every
other static host, serves for a directory request.

## Performance budgets

`lighthouserc.json` drives `pnpm exec lhci autorun`, which builds nothing itself: it serves the
existing `dist` and audits ten URLs. The four P1 surfaces are the English home page, a track hub,
and the topic page in both languages. The P2 surfaces are Practice, Python from zero, Flashcards,
the Python cheatsheet, Prompt Builder and Playground. Lighthouse uses its default mobile
emulation. All four category scores are gated at 0.95. The transferred-script ceilings are 60 KiB
for P1, 100 KiB for Practice, paths, Flashcards, cheatsheets and Prompt Builder, and 300 KiB for
Playground.

Three notes on that file, since JSON cannot carry comments:

- **Mobile CLS is gated, not hidden by a desktop preset.** The original 0.183 CLS was real: the
  topic component's processed TOC module ran after `DOMContentLoaded` and collapsed the expanded
  mobile contents row after first paint, moving the article column. The same behavior now marks
  the TOC as enhanced in an inline bootstrap before the article is parsed; mobile CSS therefore
  starts with the row collapsed, while a browser with JavaScript disabled still sees the expanded
  contents. A local mobile run measured CLS 0 on all four URLs and performance 1.00, 0.99, 0.99,
  and 0.99 respectively, so the 0.95 performance gate remains unchanged.
- **Accessibility is release-gated.** `color-contrast` and `label-content-name-mismatch` are
  Lighthouse errors, and the Playwright accessibility coverage checks the contrast-sensitive UI
  directly. The earlier set of ten open contrast pairs has been corrected.
- **`network-dependency-tree-insight` is `off`.** It scores zero for any critical request chain
  deeper than one hop, which the HTML → stylesheet → webfont chain of a self-hosted static site
  always has.

## Checks before shipping

`pnpm lint && pnpm check && pnpm test && pnpm build && pnpm check:links && pnpm test:e2e && pnpm exec
lhci autorun` is what CI runs, in that order. The link checker, Playwright and Lighthouse all read
`dist`, so the build has to come first. The Playwright config deliberately sets
`reuseExistingServer: false`: if any preview, including one from another worktree, already owns
port 4321, the run fails instead of silently testing that server's `dist`. Check the port with
`ss -ltnp | grep ':4321 '` before starting a local run. In CI, `CHROME_PATH` is set to Playwright's
installed Chromium before LHCI runs, so the gate does not depend on whichever system Chrome
happens to be on the runner image.
