# Task 12 report: bilingual topic reading

## Step 1: stable block ids

- Added `rehype-block-ids.ts` after `rehypeDepthHeadings` and before `rehypeSectionActions`.
- The plugin assigns `tldr:{n}`, `intro:{n}`, and `{headingId}:{n}` in document order across the
  transparent depth wrappers.
- Paragraphs, lists, tables, blockquotes/callouts and code or diagram figures are keyed. Callouts
  are keyed as one whole block and their child paragraphs are not keyed separately.
- The built English and Chinese closure pages each contain 69 unique static `data-bi` keys.

## Step 2: pure pairing rules

- Added `pairBlocks`, `shouldClone`, and `layoutFor` in `src/lib/bilingual.ts`.
- Pairing preserves local document order and reports missing keys.
- Headings, `pre`, `figure.codebox`, and `figure.diagram` are shared instead of cloned.
- The side layout resolves only when the stored preference is `side` and the viewport is at least
  1440 px wide.

## Step 3: client bilingual mode and settings

- Added the idle `Bilingual` island. It fetches the same-origin alternate HTML on the first
  non-off selection, caches the parsed page in memory, and patches clones into the existing
  article. No JSON endpoint was added.
- `EN + 中文`, `中文 + EN`, and off update `prefs.bilingual`; paired and side-by-side update
  `prefs.bilingualLayout`. Both settings are also active on the Settings page.
- Clones carry `lang` and `data-bi-clone`; translated code figures are not cloned; fetched callout
  labels are localized; duplicate HTML ids are removed.
- Alternate headings appear as `.bi-h` subtitles in the article and TOC after a `cw:bilingual`
  event. Section vocabulary strips deduplicate `a.term[data-term]` ids and show both link texts.
- Added paired and wide-screen side styles using existing light/dark tokens. In side mode the three
  TL;DR cards stack vertically, while the two languages remain side by side inside each card, to
  keep the summaries readable in the existing three-column topic shell.
- The island mounts only for `aligned: true`; the other branch renders an inert control titled
  `not aligned yet`.
- English and natural Simplified Chinese Task 12 strings were appended under Task 12 markers.

## Step 4: tests and screenshots

New unit tests:

- `rehypeBlockIds > uses unique TLDR, intro and per-heading ids and marks shared code blocks`: pass.
- `pairBlocks > pairs in local order and reports missing ids`: pass.
- `shouldClone > shares code and headings but clones prose blocks`: pass.
- `layoutFor > uses side layout only for a wide viewport with the side preference`: pass.

New Playwright tests:

- `aligned topic pairs every translated block, swaps order, removes clones and persists`: pass.
- `side-by-side preference activates only at the 1440px breakpoint`: pass.
- `settings persist the default bilingual mode and layout`: pass.

Required combined browser run:

- `tests/e2e/bilingual.spec.ts tests/e2e/topic.spec.ts`: 20 passed.

Screenshots, both 1440 x 900 in the light theme on `/python/closures/` with `EN + 中文`:

- `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t12/closures-en-zh-paired-light.png`
- `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t12/closures-en-zh-side-light.png`

The same bilingual view was also inspected in the dark theme. Browser diagnostics found 57 cloned
blocks, 16 heading subtitles, 3 vocabulary strips, no cloned code figures, no duplicate ids, and a
Chinese `陷阱` label in the first translated pitfall callout.

## Step 5: size and final verification

- Bilingual island asset: 6,729 bytes raw, 2,604 bytes gzip (limit: 6 kB gzip).
- Lighthouse `/python/closures/index.html`: performance 99, accessibility 100, best practices 100,
  SEO 100; transferred script 55,786 bytes (limit: 61,440 bytes).
- Lighthouse `/zh/python/closures/index.html`: performance 98, accessibility 100, best practices
  100, SEO 100; transferred script 55,786 bytes (limit: 61,440 bytes).
- `pnpm lint`: pass.
- `pnpm check`: pass with the pre-existing async-conversion hint in
  `src/lib/runners/protocol.ts`.
- `pnpm test`: 31 files and 301 tests passed.
- `pnpm build`: pass; the existing missing related-content warnings remain.
- `pnpm check:links`: 1,783 internal links across 98 pages, all resolve.
- `pnpm exec lhci autorun`: pass for all 8 configured URLs. Only non-gating Lighthouse warnings
  from the existing configuration were reported.

## Deviations and implementation notes

- Heading slugs are localized, so English and Chinese `{headingId}:{n}` prefixes are necessarily
  different. The client aliases alternate prefixes to local prefixes by aligned heading order,
  while leaving every published static `data-bi` value in the required format.
- This checkout has two published topic pairs and both declare `aligned: true`. The disabled
  non-aligned branch is implemented, but no Playwright route can exercise it without incorrectly
  reclassifying aligned content or adding a production-only test fixture.

## Step 6: commit

- Commit message: `feat(topic): bilingual mode pairing aligned blocks from the other locale's page`
