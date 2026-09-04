# P2a fix round — report

Branch `p2-learning-layer`, worktree `.worktrees/p2-learning-layer`, base `4da57cf`.

This round was started by a previous implementer (Codex) that stopped on a quota error before
committing or reporting. Its work was in the working tree; this report marks every finding with
**inherited** (hunks that were already in the tree and were reviewed and kept) or **written here**.

## Findings

### C1 — no answers in kata HTML — fixed (inherited)

- `src/lib/practice.ts` gained `PublicQuizItem` and `stripQuizItem()`: an explicit allow-list of
  learner-visible fields per item type (`options[].text` without `correct`, `issueCount` instead of
  `issues`, no `explanation`, no `answer`, no `right`, no `checklist`). New schema fields are private
  by default.
- `src/components/KataShell.astro` now takes a `PublicQuizItem` and no longer renders
  `<template data-answer>`; `src/pages-shared/Kata.astro` passes `stripQuizItem(item)` to the shell
  and to every island, with `loadAnswers`.
- `src/islands/quiz-shared.ts` gained `answerItem()` — one memoised `fetch` of
  `/api/quizzes/{track}/{slug}.answers.json` per page, then local grading — and
  `showAnswerStatus()` for the loading (`role="status"`) and failure (`role="alert"`) states.
  `Quiz.tsx`, `SpotBug.tsx` and `ReviewKata.tsx` reveal/compare through it; a failed request leaves
  the kata unanswered and re-enables the button.
- New keys `practice.loadingAnswer` / `practice.answersUnavailable` in both dictionaries.
- Verified on the built site: no answer text, no `"correct"`, no issue notes, no `right`/`checklist`
  in `dist/practice/**/index.html`.

New tests in `tests/e2e/practice.spec.ts`:

- `standalone kata HTML contains no answer material` — fetches the predict and review pages as HTML
  and asserts the explanation, the four issue notes, the model-right paragraph, the three checklist
  entries and `"correct"` are all absent.
- `an answer request failure is announced without completing the kata` — 503 on the answers endpoint
  shows `Could not load the answer — check your connection`, the kata stays `data-state="idle"`, and
  a second click does not re-request.
- The existing reveal test now also asserts the `Loading answer…` state.

Note (out of the C1 scope, unchanged): topic-page checkpoints still embed their answer-bearing items,
because the checkpoint is answered inline on the same page. Only standalone kata pages were in scope.

### I1 — Chinese UI now — fixed (translation inherited, reviewed here)

- `src/i18n/zh.ts`: **230 placeholder values translated** and **26 new Chinese keys** added
  (256 Chinese strings in total). Reviewed against `prompts/translate-ui.md`: `{n}`-style
  placeholders, product names (`Python`, `pytest`, `uv`, `mypy`, `asyncio`, `functools`, `pathlib`,
  `Claude`, `ChatGPT`, `Markdown`), glyphs (`·`, `→`) and keyboard hints kept verbatim; full-width
  punctuation and CJK/Latin spacing applied; chrome kept short.
- Hard-coded English routed through the dictionaries: planned path-node labels
  (`src/pages-shared/Path.astro`, 22 new `paths.planned.*` keys), flashcard cues
  (`src/lib/cards.ts` `faceOf(..., cues)`), the `flashcards` tag and the track tag on a card
  (`src/islands/Flashcards.tsx`, `src/pages-shared/Flashcards.astro`).
- Breadcrumb tails that were raw ASCII slugs now use the localized content title
  (`Kata.astro`, `Cheatsheet.astro`, `Path.astro`).

`tests/e2e/localization.spec.ts` now covers 11 `/zh/` page shapes (hub, kata, paths index, path
detail, interview bank, flashcards, cheatsheets index and detail, settings, plus the two P1 routes)
and walks every visible text node under `.lbl, .tag, button, h1–h6, p`, skipping `code/pre/kbd`,
`[lang="en"]` and hidden nodes, failing on any ASCII-only string outside the allow list.

### I2 — public endpoint drops `right` and `checklist` — fixed (inherited)

Covered by `stripQuizItem()` above. `tests/unit/practice.test.ts` fixture now sets non-empty `right`
and `checklist` on the review item, and the recursive assertion covers both keys plus
`issueCount` for spotbug and review.

Verified on the built endpoint: `dist/api/quizzes/python/closures.json` contains none of
`correct`, `answer`, `issues`, `explanation`, `right`, `checklist`.

### I3 — corrupt stores cannot crash the app — fixed (inherited)

`src/lib/prefs.ts` `readStore()` now validates each non-preference store and returns the caller's
default when the shape is wrong: `progress` (`topics`/`quizzes`/`paths` plain objects with validated
entries, optional `feedback`), `flashcards` (`cards` an array of valid cards) and `recents` (`pages`
an array of strings). An unknown key returns the default instead of raw JSON.

- `tests/unit/prefs.test.ts` → `guarded learning-store reads`: four corrupt progress shapes, two
  corrupt flashcard shapes, two corrupt recents shapes, and a `keeps valid learning stores` case.
- `tests/e2e/checkpoint.spec.ts` → `checkpoint completion and Add misses recover from corrupt
  learning stores`: writes `{"quizzes":null,"topics":null,"paths":null}` before the last answer and
  `{"cards":null}` before Add misses, and asserts no `pageerror` fired.

### I4 — path map accessibility — fixed (inherited source, tests written here)

`src/components/PathMap.astro`: the `<svg>` is `role="group"` with `aria-labelledby` pointing at a
visually hidden `<title id="path-map-accessible-title">`; the node rectangle and the node label text
are `aria-hidden`, so each `<a>` keeps its own accessible name and the nested-interactive violation
is gone.

`tests/e2e/a11y.spec.ts` now runs the axe matrix over 12 page shapes in both themes (was 3):
`/practice/`, a kata page, `/paths/`, `/paths/python-from-zero/`, `/practice/interview/python/`,
`/practice/flashcards/`, `/cheatsheets/`, `/cheatsheets/python/`, `/settings/` were added.
`tests/e2e/paths.spec.ts` was updated here for the new role, the `aria-labelledby` target and the
title text.

### I5 — checkpoint focus — fixed (inherited)

`src/islands/Checkpoint.tsx`: the current question `<h3>` and the result `<h3>` are
`tabIndex={-1}` focus targets, focused from an effect keyed on `finished`/`index`/`started`, so
start, advance and completion all move focus. `tests/e2e/checkpoint.spec.ts` asserts the question
heading is focused after Start, that focus stays inside `#checkpoint` after every answer, and that
the result heading is focused when the checkpoint finishes.

### I6 — Lighthouse forced reflow — investigated, insight kept as an explicit warning

Inherited source change (kept): `src/islands/Toc.tsx` and `src/islands/ReadTracker.tsx` batch their
layout reads into a single `requestAnimationFrame` (`scheduleMark`, a coalesced `refresh`), and the
Toc now re-marks after a depth change.

That was not enough, so the trace was measured directly (Lighthouse 12.6.1,
`--save-assets`, `/python/closures/index.html`). Findings:

- The reflow Lighthouse attributes **to our scripts** is now 0.40 ms in total: `UpdateLayoutTree`
  77 µs from `Toc.*.js`, `UpdateLayoutTree` 94 µs and `Layout` 233 µs from `ReadTracker.*.js`.
- The reported number is a single `[unattributed]` `Layout` of **42.58 ms** (1146 dirty objects, the
  whole document) sitting inside `RunTask → BeginMainThreadFrame → AnimationFrame::Render →
  AnimationFrame::StyleAndLayout`. It is the browser's own first layout of the page, has no JS stack,
  and no source change can remove it.
- It is counted because `@paulirish/trace_engine`'s `WarningsHandler` keeps **one global
  JS-invocation stack across all threads**. Replaying its algorithm over the trace shows the only
  entries on that stack at that moment are V8 **background parser** tasks on other threads
  (`v8.parseOnBackground`, `v8.parseOnBackgroundParsing`, `v8.parseOnBackgroundWaiting`, tids
  118737/118739/118772). The main-thread layout is therefore mis-classified as a forced reflow
  whenever it crosses the 30 ms per-task threshold.

Measured `forced-reflow-insight` values on the two failing URLs, insight left inherited (error):
33.5 ms (`/python/closures/`) and 65.3 ms (`/zh/python/closures/`), both scoring 0 — the reviewer
measured 35.9/72.6 and 42.3/67.2 ms in the same state. The final gate run, with the assertion
explicit, scored the insight **1 (pass) on all eight URLs**, which confirms how run-dependent this
false positive is.

`lighthouserc.json` therefore keeps `"forced-reflow-insight": ["warn", {}]` with a `$comment` that
records the measured attribution, so the policy is stated rather than inherited from the preset.

### I7 — restored P1 reports — fixed (inherited)

`.superpowers/sdd/2026-09-03-p1-site-foundation/design-d1-report.md` and `task-20-report.md` were
restored from `main` unchanged.

## Minors

| ID | Status |
| --- | --- |
| M1 | **Fixed** (inherited). `dueFlashcards()` in `src/lib/prefs.ts` excludes `card.suspended`, matching `isDue()`. A suspended overdue card was added to the `dueFlashcards` unit case. |
| M2 | **Not fixed.** The Right Arrow "next kata" shortcut needs a new page-level handler plus e2e coverage — larger than a one-line change. |
| M3 | **Fixed** (inherited). `src/islands/TodayStrip.tsx` calls the shared `passed()` instead of re-deriving `0.7`. |
| M4 | **Not fixed.** The 60-character title cap needs a schema rule, a change to `practiceTitle()`'s fallback truncation and an update to the unit test that locks in 90. |
| M5 | **Fixed** (inherited). Reset practice data writes `EMPTY_FLASHCARDS` through `writeStore()` instead of calling `local.removeItem`. `tests/e2e/settings.spec.ts` was updated here for the new stored value. |
| M6 | **Fixed** (written here). The duplicated `.stat`, `.stat b`, `.stat .lbl` block was removed from `src/pages-shared/Practice.astro`; the global block in `src/styles/global.css` is now the single source and is commented as such. |

Sweep note **g** (recheck the path with live topics) stays open: it is conditional on P0 content
merging, which has not happened.

## Also written here

Four tests locked in behaviour the fixes deliberately changed, plus one pre-existing race that the
larger suite started to expose:

- `tests/unit/seo.test.ts` — the Chinese practice title is now `会输出什么？ · 练习 · codewiki`.
- `tests/e2e/practice-hub.spec.ts` — the Chinese practice hub `<h1>` is `练习`.
- `tests/e2e/settings.spec.ts` — reset practice data leaves `{"cards":[]}` instead of removing the key.
- `tests/e2e/paths.spec.ts` — the new path-map role/label, and a hydration gate before the time-plan
  click (the plan buttons are server markup, so clicking before `PathState` mounts was a no-op; the
  test now waits for the island's `startedAt` write, the same signal the neighbouring test uses).

## Gate

Port 4321 was free before the run (`ss -ltnp | grep ':4321 '` — no listener).

| Command | Result |
| --- | --- |
| `pnpm lint` | PASS — ESLint clean, Prettier clean |
| `pnpm check` | PASS — 230 files, 0 errors, 0 warnings, 1 pre-existing hint (`src/lib/runners/protocol.ts:119`) |
| `pnpm test` | PASS — 30 files, 297 tests |
| `pnpm build` | PASS — 97 pages; Pagefind indexed 36 pages in 2 languages from 98 HTML files |
| `pnpm check:links` | PASS — 1,783 internal links across 98 pages |
| `pnpm test:e2e` | PASS — 188 tests in 29.3 s (was 159) |
| `pnpm exec lhci autorun` | PASS — exit 0 |

Lighthouse, 8 URLs, one run each:

| URL | perf | a11y | best-practices | seo | script transfer |
| --- | --- | --- | --- | --- | --- |
| `/` | 1.00 | 1.00 | 1.00 | 1.00 | 33,731 B |
| `/python/` | 1.00 | 1.00 | 1.00 | 1.00 | 22,325 B |
| `/python/closures/` | 0.99 | 1.00 | 1.00 | 1.00 | 51,587 B |
| `/zh/python/closures/` | 0.98 | 1.00 | 1.00 | 1.00 | 51,587 B |
| `/practice/` | 1.00 | 1.00 | 1.00 | 1.00 | 38,708 B |
| `/paths/python-from-zero/` | 1.00 | 1.00 | 1.00 | 1.00 | 40,069 B |
| `/practice/flashcards/` | 0.98 | 1.00 | 1.00 | 1.00 | 38,899 B |
| `/cheatsheets/python/` | 1.00 | 1.00 | 1.00 | 1.00 | 21,164 B |

Topic script cap 61,440 B (largest 51,587 B); P2 page cap 102,400 B (largest 40,069 B).

TASK DONE
