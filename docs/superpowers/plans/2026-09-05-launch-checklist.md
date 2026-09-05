# Launch checklist — deploying codewiki.com (deferred by the user on 2026-09-05)

Everything before deployment is done on `main`; this is the runbook for the day the site goes live. `docs/dev/deploy.md` has the host-independent facts (build command, headers, budgets); this file is the ordered to-do with who does what. Estimated wall time: about one hour, of which the user spends ~15 minutes in the Cloudflare dashboard.

## 0. Preconditions (check, do not skip)

- [ ] `main` is green: `pnpm lint && pnpm check && pnpm test && pnpm build && pnpm check:links && pnpm test:e2e && pnpm exec lhci autorun` (last full run recorded in `docs/superpowers/STATUS.md`).
- [ ] `dist` file count is under 20,000 and no file exceeds 25 MiB (`find dist -type f | wc -l`; largest today: `llms-full.txt` 13.9 MB). At 2026-09-05 the build has 15,964 files. If tier-2/3 content lands first, cut Pagefind fragments (6,050 files, raise the chunk size in the `pagefind` call) and/or OG images (2,262) before deploying, or use a host without the limit.
- [ ] `src/data/site.ts` `repo` points at the real repository (today a placeholder `codewiki-dev/codewiki`); `site.url` is `https://codewiki.com`.
- [ ] The About page and the Contribute page name the real repository.

## 1. Repository on GitHub (Claude, with `gh`, ~5 min)

```bash
gh repo create codewiki --private --source=. --remote=origin --push
```

- [ ] Decide public vs private (the "Edit on GitHub" links only work when public).
- [ ] Push `main`; confirm `.github/workflows/ci.yml` runs green on GitHub (it runs the same gate; the font cache warms on the first run).
- [ ] Replace the placeholder `repo` in `src/data/site.ts`, rebuild once, commit.

## 2. Cloudflare Pages project (user, in the dashboard, ~10 min)

Workers & Pages → Create → Pages → Connect to Git → pick the repository.

| setting | value |
| --- | --- |
| production branch | `main` |
| framework preset | Astro (or None) |
| build command | `pnpm build` |
| build output directory | `dist` |
| root directory | `/` |
| environment variables | `NODE_VERSION=24` (Cloudflare reads `.nvmrc`, set it anyway); nothing else |

- [ ] First build finishes (expect 8–12 min: fonts download, 5,866 pages, OG images, Pagefind).
- [ ] Open the `*.pages.dev` preview and run the smoke checks in §4 against it before touching DNS.

## 3. Domain (user, ~5 min)

- [ ] Add `codewiki.com` (and `www.codewiki.com` redirecting to the apex) under the project's *Custom domains*; Cloudflare creates the CNAME records when the zone is on Cloudflare.
- [ ] Confirm HTTPS is active and the apex serves the site.

## 4. Post-deploy verification (Claude, ~20 min)

Against the live domain:

- [ ] `curl -sI https://codewiki.com/` shows the headers from `public/_headers` (one `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`); `curl -sI https://codewiki.com/sandbox.html` shows the detached sandbox CSP with `'unsafe-eval'`; `curl -sI https://codewiki.com/sw.js` shows `Cache-Control: no-cache`.
- [ ] The six redirects in `public/_redirects` return 301 (`curl -sI https://codewiki.com/python/scope/`).
- [ ] `/zh/` renders Chinese; `/sitemap-index.xml`, `/robots.txt`, `/llms.txt` return 200; an OG image URL from a topic page returns `image/png`.
- [ ] Playground: run a Python and an SQL example (runtimes load from `/vendor/`); search "closure" and "闭包".
- [ ] PWA: install prompt appears on Chrome desktop and Android; visit a topic, go offline, reload; "Save this track offline" on `/python/` completes; on iOS Safari "Add to Home Screen" works and the offline page shows (iOS was never tested locally).
- [ ] Lighthouse on the live `/`, `/python/closures/`, `/practice/` (mobile) ≥ 0.95 performance.
- [ ] No console errors on `/`, a topic, a kata, the playground.

## 5. After launch

- [ ] Google Search Console + Bing Webmaster: verify the domain, submit `sitemap-index.xml`.
- [ ] Cloudflare Web Analytics (or none) — the site sends nothing today; keep it that way unless the user wants counts.
- [ ] Set a daily rebuild if the daily kata should rotate past the 7-day window without a commit (Cloudflare deploy hook + GitHub Actions `schedule`), otherwise any content commit refreshes it.
- [ ] Record the launch date and the live Lighthouse numbers in `docs/superpowers/STATUS.md`.
