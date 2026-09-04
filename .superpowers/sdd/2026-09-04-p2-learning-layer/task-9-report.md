# Task 9 report: flashcard review and automatic term cards

## Step 1: card data and pure helpers

- Added `src/lib/cards.ts` with `parseRef`, `visibleDeck`, and `faceOf`.
- `parseRef` accepts glossary ids, quiz ids, and ReviewKata's optional `:{line}` issue suffix.
- `visibleDeck` removes suspended cards and disabled sources without mutating the stored deck, then orders due cards before future cards and sorts each group by due time.
- `faceOf` resolves bilingual glossary cards, answer-free quiz prompts and code, full-bank correct answers and explanations, per-line review issues, and source links.
- Added `/api/quizzes/{track}/{slug}.answers.json`, a static sibling of the answer-free endpoint. Only the flashcards island requests this path, and only when a quiz card is current.

## Step 2: review page

- Added the English and Chinese `/practice/flashcards/` routes through a shared Astro page.
- The review island reads the browser-local deck, preferences, and progress; supports Due, All, Terms, and Missed quiz filters; shuffles the current queue; and reports due, completed-session, and quiz-day streak counts.
- The card keeps its back hidden until flip. Ratings use the SM-2-lite preview and scheduler and persist immediately. Keyboard controls are Space to flip, 1-4 to rate, E to open the source in the same tab, and X to suspend and advance.
- The rail shows deck totals, the seven-day `dueOn` histogram, persisted source toggles, Settings links for export/import, and the Ask-AI prompt card.
- A server-rendered `client:only="preact"` fallback retains the useful empty state and links when local data or JavaScript is unavailable.
- The existing home personal strip now links its due-card Review action to the completed route.

## Step 3: automatic and manual term cards

- Added `data-terms` to the topic article and passed the same term ids into `ActionRow`.
- `ReadTracker` enrolls those terms once when reading reaches 90%, preserves `termsAdded`, respects the terms source preference, and also migrates already-completed browser-local topics on their next visit.
- The topic action now adds missing terms with `source: "manual"`, reports `Added {n} cards`, and disables itself once every page term is already present. Automatic enrollment updates the button in the same page view.
- Added all required `flashcards.*` strings plus `topic.addedToFlashcards`; Chinese entries are marked `//P2` placeholders as requested.

## Step 4: tests and visual verification

### Unit tests

`tests/unit/cards.test.ts`:

- `parses glossary, quiz and per-issue review references`
- `filters suspended and disabled sources, then puts due cards first in due order`
- `builds a bilingual glossary face with section and glossary links`
- `uses the public prompt and the answer-bearing bank for a quiz face`
- `uses a ReviewKata line suffix to select one issue`

Full unit result: **30 files passed, 277 tests passed**.

### End-to-end tests

`tests/e2e/flashcards.spec.ts`:

- `a seeded due queue flips, rates with the keyboard and persists its intervals`
- `the source shortcut opens a term section in the same tab`
- `finishing a topic adds its term cards once`

`tests/e2e/topic.spec.ts`:

- `the action row adds every page term to flashcards once`

`tests/e2e/layout.spec.ts` now covers `/practice/flashcards/` and `/zh/practice/flashcards/` at 390x844 and 1440x900.

Requested Playwright result: **48 passed**.

### Required validation

- `pnpm lint`: passed.
- `pnpm check`: passed with 0 errors and the existing `timeoutRace` async-conversion hint.
- `pnpm test`: 30 files passed, 277 tests passed.
- `pnpm build`: passed, 93 pages built. Existing missing-draft content warnings remain unchanged.
- `pnpm check:links`: passed, 1,436 internal links across 94 HTML files resolve.
- Targeted Playwright command: 48 passed.

### Screenshot

1440x900 light mode, seeded six-card deck, back side shown:

`/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t9/flashcards-review-light-back.png`

The same state was also checked visually in dark mode. The required artifact is the light screenshot above.

## Deviations

No functional deviations from the task brief. The review page reuses the locale-specific home OG card, as the existing practice hub does, because Task 9 does not add a dedicated OG image renderer.
