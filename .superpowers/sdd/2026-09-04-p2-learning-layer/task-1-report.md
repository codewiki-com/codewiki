# Task 1 report — storage additions, SRS scheduler and scoring

## Changes by step

1. Extended `src/lib/prefs.ts` with `Plan`, `BilingualLayout`, and `RevealMode`; the optional learning preferences; `TopicProgress.termsAdded`; and the flashcard suspension/source fields. Added the three requested defaults and the `cardSources()` all-on fallback. Extended `sanitizePrefs()` so stored plan, layout, reveal mode, and individual source toggles are validated instead of bypassing the guarded preference reader.
2. Added the scheduler cases from the brief to `tests/unit/srs.test.ts`.
3. Confirmed the scheduler test failed before implementation because `@/lib/srs` did not exist.
4. Added the pure SM-2-lite scheduler in `src/lib/srs.ts`, including every requested public export: `Rating`, `RATINGS`, `NEW_CARD`, `rate`, `isDue`, `dueOn`, `previewInterval`, `nextInterval`, and `nextEase`.
5. Re-ran the scheduler file: 9/9 tests passed. The seven-day histogram counts overdue cards in today's bucket and a card due on day +2 in bucket 2.
6. Added the pure helpers in `src/lib/score.ts`: the 70% pass rule, best-result quiz recording, idempotent topic completion, stable card IDs, and append-only deck enqueueing. Added scoring/deck tests and expanded guarded preference-read tests for valid and malformed learning-layer fields.
7. Ran the required full verification command successfully and prepared the requested conventional commit.

## New and extended tests

`tests/unit/srs.test.ts` — 9 new tests:

- `again resets the interval to one day and lowers ease`
- `hard grows slowly and lowers ease`
- `good multiplies by ease`
- `easy multiplies by ease × 1.3 and raises ease`
- `clamps ease to [1.3, 2.5] and interval to [1, 30]`
- `a new card rated good goes to three days`
- `rejects unknown ratings at the type level`
- `is due when due <= now, not when suspended`
- `dueOn buckets the next seven days, today first`

`tests/unit/score.test.ts` — 5 new tests:

- `uses a 70 percent pass mark and rejects an empty quiz`
- `keeps the better score and the newer at on a tie`
- `never overwrites an existing completedAt`
- `builds stable ids for quiz items and glossary terms`
- `dedupes by id and returns the same object when nothing is new`

`tests/unit/prefs.test.ts` — 2 new tests and 1 extended test:

- New: `preserves valid learning-layer preferences`
- New: `defaults invalid flashcard source fields to on`
- Extended: `replaces invalid preference fields with their defaults` now covers invalid plan, bilingual layout, and interview reveal values.

Total added tests: 16. Final suite: 25 files and 240 tests passed.

## Verification

- `pnpm lint`: passed.
- `pnpm check`: passed with 0 errors and the existing async-conversion hint in `src/lib/runners/protocol.ts`.
- `pnpm test`: passed, 25 files and 240 tests.
- `pnpm build`: passed, 73 static pages built and Pagefind indexed 18 pages. Existing warnings about referenced topic entries without content were unchanged.

## Deviations

There are no behavioral deviations from the brief. `dueOn()` follows the explicit test authority: overdue cards count today, and the +2-day card counts in bucket 2. The requested `TopicProgress.termsAdded` addition and validation of the new optional preference fields were included from the task's supplied context. The scoring brief specified cases rather than a literal test file, so those cases were grouped into five focused tests; one additional assertion test covers the required card-ID helper exports.
