# Task 8 report: interview bank pages

## What changed

### Step 1: schema and content

- Added the brief's `interviewItemSchema` and `interviewSchema`, registered the `interview` YAML collection, and added the three-item Python calibration bank.
- The placeholder questions cover closure capture, late binding in loops, and `nonlocal`, with localized section names, levels, frequencies, topic references, and concise English and Chinese answers.

### Step 2: question rows and Markdown rendering

- Added native `<details>` interview rows with build-time Markdown answers, topic links, clarity feedback, flashcard and Markdown-copy actions, and the Feynman grading prompt.
- Added a cached `renderMarkdown()` helper using the same remark, rehype, Shiki, and local plugin pipeline as topic rendering.
- Extracted the existing clarity control into `Clarity.astro` so topic action rows and interview answers share the same browser-local feedback behavior.

### Step 3: bank controls and progress

- Added level and debounced text filters, persisted one/all reveal modes, per-section shuffling, seen tracking through `recordQuiz`, single and bulk manual flashcard enqueueing, and progress/section-count updates.
- Added the in-bank table of contents, progress card, other-bank rail, and quiz-preset mock-interview prompt.

### Step 4: routes, SEO, and Markdown twins

- Added static English and Chinese interview routes plus one `.md` twin per locale.
- Added `faqPageLd()` and an AST-based `stripMarkdown()` helper so each localized page emits indexable `FAQPage` JSON-LD with plain-text answers.
- Added the bilingual metadata, sitemap-compatible page SEO, and all requested `interview.*` strings.

### Step 5: tests and visual verification

- Added unit coverage for the FAQ builder, Markdown stripping, and the interview fixture.
- Added interview browser coverage and included both localized interview URLs in the phone and desktop overflow matrix.
- Captured the required 1440 x 900 light screenshot with the first answer open: `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t8/interview-python-light-1440x900.png`.
- Also inspected the same state in dark mode; its check image is beside the required screenshot as `interview-python-dark-check.png`.

## Test results

- `pnpm lint`: passed.
- `pnpm check`: passed with 0 errors and 0 warnings. Astro also printed the repository's existing non-blocking suggestion in `src/lib/runners/protocol.ts`.
- `pnpm test`: passed, 29 files and 272 tests.
- `pnpm build`: passed, including both localized HTML routes and Markdown twins.
- `pnpm check:links`: passed, 1,404 internal links across 92 pages.
- `pnpm exec playwright test tests/e2e/interview.spec.ts tests/e2e/layout.spec.ts`: passed, 30 tests.

New named coverage:

- `data fixtures > interview/python.yaml is a valid interview bank`
- `content json-ld builders > builds an FAQPage with accepted answers`
- `content json-ld builders > strips Markdown formatting to visible text`
- `the bank lists its questions and the Chinese route uses Chinese question text`
- `opening an answer records it as seen and one-by-one mode closes the previous answer`
- `the level filter hides questions outside the selected level`
- `the text filter is debounced and searches question text within the bank`
- `show-all persists the reveal mode and the bulk action queues manual flashcards`
- `the page emits one FAQPage question for every bank item`
- Phone and desktop no-horizontal-overflow cases for `/practice/interview/python/` and `/zh/practice/interview/python/`.

## Deviations

There are no functional deviations from the brief. As requested, the three YAML placeholders contain real Chinese copy despite being temporary content; the Chinese UI additions remain English placeholders under `//P2`. The clarity control was extracted into a shared component to provide genuine reuse without changing its existing behavior.
