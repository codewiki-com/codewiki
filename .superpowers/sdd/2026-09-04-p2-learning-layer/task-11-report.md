# Task 11 report — P2 navigation, practice settings and continue-strip data

## Outcome

Turned on the complete P2a navigation for Paths, Practice and Cheatsheets in both locales, while
keeping Playground and Compare independently gated. Wired the home and track entry points to the
now-public routes, added the build-time daily kata to the browser-local home strip, and completed
the practice-related settings controls and reset behavior.

## Changes by step

### Step 1 — navigation and route exposure

- Set `P2_NAV = true` and added `P2B_NAV = false` and `P3_NAV = false`.
- Changed the shared desktop/mobile navigation array to read the appropriate flag per destination.
  Paths, Practice and Cheatsheets now link to their public indexes; Compare and Playground remain
  absent.
- Routed the home `Start a path` action directly to `/paths/` in each locale.
- Made track-hub shortcuts and `also in this track` rows data-aware. Python links its public
  cheatsheet and interview bank, Compare and Playground remain inert `soon` rows, and Glossary
  remains linked. Tracks without a matching public collection entry keep the corresponding row
  inert.
- Kept the recommended-path map link on the first path that includes the track, with `/paths/` as
  the computed fallback.
- Reduced the built-link exception list to only `/playground/`, which Task 13 will remove.

### Step 2 — settings and the home personal strip

- Added a persisted interview reveal radio group for `prefs.interviewReveal` (`one` / `all`).
- Added three independently persisted flashcard-source toggles for
  `prefs.cardSources.{terms,quiz,manual}`.
- Kept the default bilingual-mode row disabled with its existing coming-soon note for Task 12.
- Added a separate confirmed `Reset practice data` action. It empties `progress.quizzes` and
  `progress.paths`, removes the flashcard deck, and preserves `progress.topics`, feedback, prefs,
  recents and unrelated browser data. The existing `Clear all data` action is unchanged.
- Added the new `settings.*` English strings and matching English `//P2` placeholders in Chinese.
- Selected the home kata with `kataOfTheDay(await listPracticeItems(), new Date())` at build time
  and passed `{ title, url, minutes }` to `PersonalStrip`. The strip remains empty in server HTML,
  then shows the daily kata after idle hydration; its flashcard review URL is now required.

### Step 3 — coverage, budgets and full-branch fixes

- Added E2E coverage for released desktop/mobile nav items, the path CTA, the daily-kata strip,
  data-aware track links, persisted practice preferences and selective practice reset.
- Added the four P2a Lighthouse URLs and split script assertions into 61,440-byte existing-page
  and 102,400-byte P2a-page budgets, with the same 0.95 category gates on every URL.
- The first whole-suite run exposed a Task 5 assertion made stale by Task 9 automatic term cards.
  It now counts the two quiz-source cards added by the checkpoint action instead of assuming the
  mixed deck has only two cards.
- The first expanded Lighthouse run exposed two earlier-task issues: Task 9 marked the public
  flashcard review route `noindex`, and Task 10 skipped from the cheatsheet `h1` to `h3` section
  headings. Removed `noindex` and changed sheet/vocabulary headings to `h2`; the final SEO and
  accessibility scores are 1.00.

## Verification

- Port 4321: free before the Playwright gates; the screenshot preview was stopped after capture.
- `pnpm lint`: passed.
- `pnpm check`: passed with 0 errors and 0 warnings; Astro printed the existing informational
  `timeoutRace` async-conversion hint.
- `pnpm test`: **30 files and 285 tests passed**.
- `pnpm build`: **97 static pages built**; Pagefind found 98 HTML files and indexed 36 pages in two
  languages. Existing missing-placeholder content warnings remain informational.
- `pnpm check:links`: **1,785 internal links across 98 HTML pages, all resolved**.
- `pnpm test:e2e`: **159 passed in 23.5 s**.
- `pnpm exec lhci autorun`: passed all category and script-budget assertions across eight URLs.

## Lighthouse results

One run per URL from the final successful `lhci autorun`:

| URL | Performance | Accessibility | Best practices | SEO | Script bytes | Budget |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 1.00 | 1.00 | 1.00 | 1.00 | 18,181 | 61,440 |
| `/python/` | 1.00 | 1.00 | 1.00 | 1.00 | 21,883 | 61,440 |
| `/python/closures/` | 0.99 | 1.00 | 1.00 | 1.00 | 35,940 | 61,440 |
| `/zh/python/closures/` | 0.99 | 1.00 | 1.00 | 1.00 | 35,940 | 61,440 |
| `/practice/` | 1.00 | 1.00 | 1.00 | 1.00 | 20,769 | 102,400 |
| `/paths/python-from-zero/` | 1.00 | 1.00 | 1.00 | 1.00 | 24,481 | 102,400 |
| `/practice/flashcards/` | 0.97 | 1.00 | 1.00 | 1.00 | 23,331 | 102,400 |
| `/cheatsheets/python/` | 0.99 | 1.00 | 1.00 | 1.00 | 20,721 | 102,400 |

The `lighthouse:no-pwa` preset still reports its non-gating render-blocking warnings and occasional
DOM-size insight warnings; every requested category gate and script budget passes.

## Screenshots

All three artifacts were captured from the final static build with `data-theme="light"`, checked at
exactly 1440 x 900 pixels and visually reviewed:

- Home: `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t11/home-1440x900-light.png`
- Python track: `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t11/python-1440x900-light.png`
- Settings: `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t11/settings-1440x900-light.png`

## Deviations and notes

- There are no functional deviations from the Task 11 brief.
- The three source fixes described above intentionally touch earlier-task code because the newly
  required whole E2E and Lighthouse gates made their integration defects observable.
