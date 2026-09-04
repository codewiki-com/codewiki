# Task 15 report — block Ask-AI presets and try-to-break nudges

## Outcome

Added focused Ask-AI actions to every rendered codebox and pitfall without adding a topic-page
island. Code actions open only explain-line-by-line, port and test-writing presets; pitfall actions
open a code textarea for checking the reader's code against that pitfall. Added bilingual,
build-time `TryToBreak` nudges whose links carry the preceding runnable example and a concrete
challenge into the playground.

## Changes by step

### Step 1 — presets and templates

- Extended `PRESETS` with `explain-code`, `port`, `tests` and `check-pitfall`, while retaining the
  original six as `PAGE_PRESETS` so page and section actions do not expose block-only choices.
- Added prompt inputs for a selected port target and reader-supplied pitfall code. Port prompts
  request idiomatic output in the selected language; pitfall prompts quote the textarea content.
- Added natural English and Simplified Chinese labels under `ask.*`, plus the bilingual nudge
  labels.
- Derived the port picker's 11 options from the language tracks in `src/data/tracks.ts` on the
  Astro side and passed only their labels/values to the existing island, avoiding a client import
  of the full track registry.

### Step 2 — block actions and existing-island delegation

- Extended `rehypeSectionActions` to assign deterministic `data-block` ids and emit one plain
  `.ask-block` sibling after every `figure.codebox` and pitfall callout. Code buttons carry
  `data-preset="explain-code|port|tests"`; pitfall buttons carry `check-pitfall`.
- Made the callout matcher accept the dashed and camel-cased HAST property forms used across the
  remark/rehype boundary.
- Extended the existing delegated listener in `AskAI` to find the target by `data-block`, extract
  only its code or callout text, and open the focused rows. No new island or hydration directive
  was added.
- Added an 11-option port picker and a pitfall code textarea inside the existing panel.

### Step 3 — try-to-break nudges

- Added `TryToBreak.astro` and registered it in the topic MDX component map.
- The rehype pass locates the nearest preceding runnable codebox, skips generated actions and the
  output block, and injects its code as a component prop. Authors supply only `items`.
- Each nudge link compresses the source plus `# try: {item}` with `lz-string` and targets
  `/playground/?lang=&code=`.
- Added aligned English/Chinese nudges after the first closures example and documented the
  2–4-item bilingual authoring rule in editorial-standard §5.

### Step 4 — coverage and budget

- Prompt unit coverage verifies all four instructions, preset order, port substitution, target
  code language, reader-code inclusion and Chinese answer language.
- Markdown unit coverage verifies code/pitfall ids and actions, output-codebox actions, and
  build-time code transfer without replacing authored `items`.
- Topic E2E coverage verifies the three focused code rows, the 11 language options, the selected
  port target and exact block code in the deep link, pitfall textarea propagation, and the decoded
  nudge challenge.
- Topic pages still hydrate the existing `AskAI` island only. The final Lighthouse transfer for
  both `/python/closures/` and `/zh/python/closures/` is **52,577 bytes of script**, below the
  61,440-byte cap by 8,863 bytes.

## Verification

- `pnpm lint`: passed.
- `pnpm check`: passed with 0 errors and 0 warnings; Astro printed the existing informational
  `timeoutRace` async-conversion hint.
- `pnpm test`: **30 files and 305 tests passed**.
- `pnpm build`: **97 static pages built**; Pagefind found 98 HTML files and indexed 36 pages in two
  languages. Existing missing-placeholder content warnings remain informational.
- `pnpm check:links`: **1,785 internal links across 98 HTML pages, all resolved**.
- `pnpm exec playwright test tests/e2e/topic.spec.ts`: **19 passed**.
- `pnpm exec lhci autorun`: passed every category and script-budget assertion across eight URLs.

New or expanded named tests:

- `prompts > writes the explain-code instruction`
- `prompts > writes the port instruction`
- `prompts > writes the tests instruction`
- `prompts > writes the check-pitfall instruction`
- `prompts > lists the page presets followed by the four block presets`
- `prompts > fills the port language and the reader code for focused block prompts`
- `rehypeSectionActions > adds focused actions after code and pitfall blocks`
- `rehypeSectionActions > adds a code action after an output codebox too`
- `rehypeSectionActions > moves the nearest runnable code onto TryToBreak without replacing authored items`
- `a code block opens its three focused Ask-AI presets`
- `a pitfall asks for reader code and a nudge opens the challenged example`

Final Lighthouse results:

| URL | Performance | Accessibility | Best practices | SEO | Script bytes | Budget |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 1.00 | 1.00 | 1.00 | 1.00 | 33,949 | 61,440 |
| `/python/` | 1.00 | 1.00 | 1.00 | 1.00 | 22,325 | 61,440 |
| `/python/closures/` | 0.99 | 1.00 | 1.00 | 1.00 | 52,577 | 61,440 |
| `/zh/python/closures/` | 0.99 | 1.00 | 1.00 | 1.00 | 52,577 | 61,440 |
| `/practice/` | 1.00 | 1.00 | 1.00 | 1.00 | 38,926 | 102,400 |
| `/paths/python-from-zero/` | 1.00 | 1.00 | 1.00 | 1.00 | 40,287 | 102,400 |
| `/practice/flashcards/` | 0.98 | 1.00 | 1.00 | 1.00 | 39,117 | 102,400 |
| `/cheatsheets/python/` | 1.00 | 1.00 | 1.00 | 1.00 | 21,936 | 102,400 |

Lighthouse retained its existing non-gating render-blocking, DOM-size and forced-reflow insight
warnings. One pre-final run produced a transient 0.94 performance score on the unrelated path page;
the immediately preceding run scored 1.00 and the final required run scored 1.00.

## Screenshot

The final static build was captured with `data-theme="light"` at exactly 1440 × 900 and visually
reviewed. It shows the first runnable example, source/output block Ask-AI buttons, and the two-item
nudge directly below:

`/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t15/closures-block-ask-nudge-1440x900-light.png`

## Deviations and notes

- The base commit does not yet contain Task 13's `src/lib/lz.ts` because Tasks 12–14 are running in
  sibling worktrees. `TryToBreak.astro` therefore calls the already-installed `lz-string`
  `compressToEncodedURIComponent` directly, matching the existing kata handoff and Task 13's URL
  encoding contract without creating a conflicting parallel copy of `src/lib/lz.ts`.
- The controller override required finished Simplified Chinese values instead of the brief's old
  `//P2` placeholder instruction; all new strings are translated.
- The nudge is authored after the output fence to preserve the editorial rule that runnable code
  and its output stay adjacent. The rehype lookup therefore finds the nearest preceding runnable
  codebox rather than assuming the immediately previous sibling is source code.
