# Task 10 report — Cheatsheets

## Outcome

Implemented the bilingual, static cheatsheet collection and its HTML, Markdown, JSON, print, and LLM-facing surfaces. The Python calibration sheet is public in both locales so the production build and end-to-end suite exercise real content.

## Changes by step

### Step 1 — Schema and collection

- Added `cheatsheetSchema`, including defaulted `terms`, `tags`, and `aligned` fields, verified metadata, nullable review date, status validation, and track-slug validation.
- Added the `cheatsheets` content collection with the same localized filename-to-ID scheme as topics.
- Generalized `isPublic` for content with a draft/reviewed status and added cheatsheet query/meta helpers.
- Added localized English and Chinese Python content with three `Sheet` sections and three `Row` entries per section.

### Step 2 — MDX components and Ask AI

- Added and registered `Sheet` and `Row` MDX components.
- Added accessible row-level `?` buttons that dispatch `cw:ask` with the row code and note.
- Extended `AskAI` to handle `cw:ask`, open the `explain` preset, and prefill the selected row as context.

### Step 3 — Pages, twins, JSON, and discovery

- Added shared bilingual index/detail implementations plus thin English and Chinese routes.
- Added print, copy-Markdown, download, row-question, vocabulary, related-track, and feature-gated rules-pack UI.
- Added localized Markdown twins. `Sheet`/`Row` source is converted by the existing line/regex transformer without compiling MDX at request time.
- Added `/api/cheatsheets.json` with localized sheet metadata and extracted `{ section, code, note }` rows.
- Added a `## Cheatsheets` section to `llms.txt`, linking public sheets to their localized Markdown twins.
- Added the required `cheatsheets.*` strings, including the Chinese `//P2` placeholders.

### Step 4 — Print stylesheet

- Added a stylesheet imported only by the cheatsheet detail page.
- Print mode uses 12 mm page margins, two columns, non-breaking rows, 9.5 pt monospace snippets, external-link URL annotations, and hides navigation, footer, actions, row buttons, and interactive Ask AI UI.

### Step 5 — Tests and visual checks

Unit coverage added or extended:

- `cheatsheet schema`: defaults/date parsing, calibration tags, length limits, and slug validation.
- `paired collection ids`: localized filename/ID mapping and invalid inputs.
- `toPlainMarkdown`: `Sheet`/`Row` conversion and source-only row extraction.
- `cheatsheetMdUrl` and `buildLlmsIndex`: localized twins and the cheatsheet section.

End-to-end coverage added:

- `the cheatsheet index lists the reviewed Python sheet`
- `the sheet page renders three authored panels and nine rows`
- `print media hides navigation and lays the sheet grid into two columns`
- `the Markdown twin contains the authored Row as a plain bullet`
- `a row question opens the explain preset with that row as context`
- `the cheatsheet API exposes both localized sheets and their rows`
- `/cheatsheets/` and `/zh/cheatsheets/` at phone and desktop sizes in the horizontal-overflow layout suite.

Final required verification:

- `pnpm lint` — passed.
- `pnpm check` — passed with 0 errors and 0 warnings; Astro also printed the existing informational async hint for `src/lib/runners/protocol.ts`.
- `pnpm test` — passed, 30 files and 285 tests.
- `pnpm build` — passed, 97 pages generated. Existing placeholder-related topic/quiz warnings remain informational.
- `pnpm check:links` — passed, 1,502 links checked across 98 pages.
- `pnpm exec playwright test tests/e2e/cheatsheet.spec.ts tests/e2e/layout.spec.ts` — passed, 38 tests.
- Port 4321 was free before the Playwright run.

Visual checks:

- 1440×900 light screenshot: `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t10/cheatsheet-light-1440x900.png`
- Print-emulated (`page.emulateMedia({ media: 'print' })`) screenshot at A4 width 794 px: `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t10/cheatsheet-print-a4.png`
- Also audited the detail page in dark mode and at the mobile breakpoint; both retain the existing token-driven codewiki design and avoid horizontal overflow.

## Deviations and decisions

- The Python placeholders use `status: reviewed` with `tags: [calibration]`, rather than `draft`, as authorized in the task context. This lets the production index, sheet page, API, twins, LLM index, and end-to-end tests all exercise real public content. The zero-public-sheet empty-state branch remains implemented, but the checked-in build intentionally shows the reviewed sheet.
- Added `src/pages/zh/cheatsheets/[slug].md.ts` beyond the brief's explicit file list. A Chinese Markdown twin is required for bilingual twin links and for the Chinese entry emitted by `llms.txt`.
- The rules-pack card is fully implemented but remains disabled through `P2_RULES = false` until Task 14 provides its endpoints.
