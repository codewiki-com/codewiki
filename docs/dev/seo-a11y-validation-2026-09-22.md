# CodeWiki local validation report — 2026-09-22

The fixes are implemented and have not been deployed. At the user's request, the remaining local Lighthouse measurements were stopped and the Chromium processes started for this audit were closed. The local Lighthouse gate covering 11 pages did not finish; GitHub CI will complete the gate on the pull request.

- Lint, formatting and type checks passed; the build succeeded.
- All 2,427 unit tests and 364 Chromium browser tests passed.
- Accessibility checks cover 23 page types in English and Chinese, light and dark themes, search dialogs, failure states, both sides of review cards, and keyboard interactions.
- All 155,274 internal links and structured-data destinations resolve.
- SEO metadata checks passed for 5,909 pages; all 2,349 OG images exist and measure 1200×630.
- The sitemap contains 5,902 URLs, all with x-default alternates; 598 URLs with reliable content dates include lastmod.
- robots.txt, llms.txt and llms-full.txt exist; missing applicable OG/Twitter tags, article metadata and JSON-LD fields have been added.

The table includes only completed Lighthouse measurements from this audit. Scores are medians of the completed runs; pages with incomplete measurements are not claimed to have passed.

| Page | Completed runs | Performance | Accessibility | Best practices | SEO |
| --- | ---: | ---: | ---: | ---: | ---: |
| /index.html | 3 | 99 | 100 | 100 | 100 |
| /python/index.html | 1 | 88 | 100 | 100 | 100 |
