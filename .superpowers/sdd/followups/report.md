# Follow-up report

Date: 2026-09-05

## 1. Markdown twin rows

- Updated the cheatsheet row parser to accept matching single or double quote delimiters while preserving escaped characters inside the value.
- Added coverage for a single-quoted Docker row, escaped matching quotes, and every localized cheatsheet source.
- The all-file check covers 24 cheatsheet files and 1,724 authored rows. Docker English now exposes all 81 authored rows in both its Markdown twin and the cheatsheet API.
- Updated the e2e content fixture to count both quote styles.
- Commit: `c8b3635 fix: parse quoted cheatsheet rows`.

## 2. Daily kata mobile caption

- Below 900 px, the remaining-line count is a right-aligned `.lbl` caption below the code surface with a measured 6 px gap. It remains inside the preview anchor, so the code and caption are one tap target.
- At wider viewports, the original absolute overlay remains in place.
- Updated screenshots:
  - `en-light-390.png`: 390 x 540, 30,940 bytes.
  - `zh-light-390.png`: 390 x 511, 39,945 bytes.
- Both screenshots are below the 300 KB limit. Browser inspection confirmed a 6 px vertical gap, zero right inset, no covered code line, and the desktop overlay still positioned absolutely inside the code surface.
- Commit: `d4dc07b fix: move mobile kata count below preview`.

## 3. About page

- Added shared English and Simplified Chinese About pages at `/about/` and `/zh/about/` using `Base`, `Breadcrumb`, `.wrap`, `.prose`, and existing tokens.
- The English page is 375 words and has six H2 sections. Both languages use the same section and paragraph structure.
- Added localized descriptions, canonical and hreflang metadata, breadcrumb JSON-LD, and generic OG cards at `/og/about.png` and `/og/zh/about.png`.
- Added the localized About link immediately after Contribute in the footer.
- Astro discovers both routes for the sitemap automatically; the SEO e2e test asserts both sitemap entries. `/about/` was also added to the optional resources in `llms.txt`.
- `src/data/site.ts` already contains `https://github.com/codewiki-dev/codewiki`, so that URL is used for the source and contribution links. No placeholder was introduced.
- Desktop and 390 px browser inspection passed in both locales, with no horizontal overflow; light and dark token palettes were checked.
- Commit: `feat: add bilingual About pages` (this report is included in the same task commit).

## Verification

- `pnpm lint`: passed.
- `pnpm check`: passed with 0 errors; the existing `timeoutRace` async-conversion hint remains.
- `pnpm test`: 58 files and 2,392 tests passed.
- `pnpm build`: passed; 5,863 pages built, with sitemap, service worker, both About OG cards, and Pagefind output.
- `pnpm check:links`: 153,215 internal links across 5,870 pages and 6 redirect targets all resolve.
- `pnpm exec playwright test tests/e2e/home.spec.ts tests/e2e/seo.spec.ts tests/e2e/cheatsheet.spec.ts tests/e2e/daily-kata.spec.ts`: 43 tests passed.
- Focused daily-kata run: 8 tests passed, including light and dark accessibility checks.

Existing non-failing build notices remain: Shiki falls back to plaintext for `dockerignore`; Pagefind skips six redirect-like files without an outer `html` element and does not stem `zh-Hans`; the existing `swift/fundamentals` bilingual structural-signature warning is unchanged.
