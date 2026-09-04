# codewiki — P2 Learning Layer Sub-spec

Status: **approved 2026-09-04** (user delegated the open decisions to the design lead; see §7). Parent: `2026-09-03-codewiki-design.md` (master spec; §5.4–5.6, §6, §6.1 rows marked P2, §12). Mockups: `docs/design/mockups/p2/` and the P1 `Path.dc.html` / `Playground.dc.html`; canvas https://claude.ai/code/artifact/23900b82-1533-43f2-b3fc-eeb05070c137.

This document turns the master spec's one-line P2 rows into behaviour precise enough to plan from. Where it is silent, the master spec and the mockups decide. Nothing here changes P1.

## 1. Scope and phasing

P2 ships in two waves so that content (Codex) and code (Opus) can overlap.

| Wave | Pages and features | Content it needs |
|---|---|---|
| **P2a Practice** | `/paths/`, `/paths/{slug}/` with the map; quiz items inside topics (`Predict`, `SpotBug`, `Review`, `Quiz`) and the `Checkpoint` flow; `/practice/` hub; `/practice/{type}/{track}/{slug}/` kata player; `/practice/interview/{track}/`; `/practice/flashcards/`; progress + the home/hub "Continue" strip wired to real data; `/cheatsheets/`, `/cheatsheets/{slug}/` with print CSS; nav items un-flagged | quiz banks for tier-1 topics (Codex writes them in the polish pass), 6 paths, interview banks for 8 tracks, ~30 review katas, 12 cheatsheets |
| **P2b Reading and AI era** | bilingual mode; `/playground/` (CodeMirror 6, SQL and HTML/CSS runtimes, kata tests, share links, "Ask AI to fix"); `/ai/prompt-builder/`; rules packs and context packs endpoints; block-level Ask-AI presets; "try to break it" nudges | glossary ≥ 300 terms (extract), AI-tool cheatsheets (Claude Code, Codex CLI, Cursor, Copilot, MCP, `AGENTS.md`), the `ai-native-developer` path |

Exit criteria (from §12): feature e2e green, 6 paths live, Lighthouse budgets still met on topic pages (the learning layer must not add eager JavaScript to topic pages: every P2 island hydrates on interaction or visibility).

## 2. Pages

### 2.1 Practice hub `/practice/` (mockup `Practice`)

Header, a **today strip** (three cards: kata of the day, flashcards due, the next checkpoint on the reader's active path) that is server-rendered empty and hydrated `client:idle` from local data (like `PersonalStrip`), tabs by item type, filters (track, level, sort), a card grid of items, and a rail (personal stats, interview banks list, Ask-AI). Item cards come from the quiz banks: every `predict`, `spotbug`, `review` and standalone `mcq` item is a practice page of its own (see 2.2). "Done / missed" states come from `progress.quizzes`.

Kata of the day: deterministic per UTC day (`hash(date) mod items`), so two visitors see the same kata and the page is cacheable. Filters live in the URL (`?track=python&type=review&level=beginner`) so they are shareable and crawlable for the track values.

### 2.2 Kata player `/practice/{type}/{track}/{slug}/{item}/` (mockup `Kata`)

One static page per quiz item with `type ∈ predict | spotbug | review | mcq | fill`. Rendered server-side with the prompt, the code and the options; the answer and explanation are in the HTML inside a `<template>` so the page is indexable but does not leak the answer to a skim. The island reveals on interaction.

- **predict / mcq**: options as radio cards; on choice, mark correct/incorrect, show the explanation, record `{score: 0|1, total: 1}`; a wrong answer enqueues a flashcard of kind `quiz`.
- **spotbug**: line gutter with a marker per line; the learner marks lines, presses "Reveal"; hits/misses are shown per issue; score = issues found ÷ issues.
- **review** (the AI-era type): four steps shown in the header (read · mark lines · write your review · compare). Marking lines works like spotbug; each marked line takes an optional one-line comment (kept in memory only). "Compare" reveals the expert review: issues with `kind` tags (security, correctness, edge case, readability, performance), the "what the model got right" note, and the checklist that the topic's "In the AI era" block defines. Score = issues found ÷ issues. The page always says the code is illustrative and not attributed to any one model.
- **fill**: a single text input, case-insensitive trimmed match, alternates allowed via `answer: "a | b"`.

Prev/next within the same bank; "Open in playground" carries the code; "Ask AI to fix line N" uses the Ask-AI deep link with the line and the expert note. Keyboard: `1–9` choose an option, `Enter` reveal, `→` next.

### 2.3 Checkpoint (inside topics and on paths)

A `Checkpoint` renders 3–8 items from the topic's quiz bank (or the milestone's checkpoint bank) inline at the end of the article. Items run one at a time with a progress bar; the result screen shows score, the explanations for misses, and two actions: "Add misses to flashcards" and "Continue to {next}". Passing (≥ 70 %) writes `progress.topics[id].completedAt` and `progress.quizzes[bankId]`; on a path, passing the milestone's checkpoint moves the map's "you are here". Locked is guidance only (master spec §5.4): every page stays readable.

### 2.4 Learning paths `/paths/`, `/paths/{slug}/` (mockup `Path`, P1)

`/paths/` lists the six paths as cards (title, level range, hours, tracks, progress if any). `/paths/{slug}/`: header with progress ring and "Continue" (first topic without `completedAt`, else the next checkpoint), the **map**, the current milestone's topic list, and the rail (outcomes, time-plan selector, export/share, Ask-AI).

The map is an SVG rendered at build time from the path data (`PathMap.astro`): one column per milestone, nodes 180×34 in reading order, a checkpoint diamond under each column, edges between consecutive checkpoints and the next column, and the explicit `edges[]` as prerequisite arrows. A tiny island applies states from local data: `done` (completedAt), `cur` (first not-done topic of the first milestone whose checkpoint is not passed), `lock` (milestones after the first unpassed checkpoint). Topics referenced by a path that do not exist yet render as `soon` nodes (dashed, no link). Time plan (15 / 30 / 60 min a day) is a pref (`prefs.plan`) and only changes the "about N weeks" line.

### 2.5 Interview bank `/practice/interview/{track}/` (mockup `Interview`)

One page per track from `src/content/interview/{track}.yaml` (schema exists, P0 Task 13). Questions grouped by section, each a disclosure ("reveal") with the answer in Markdown, code, "read more" topic tags, "Was this clear?", "Add to flashcards", "Copy Q&A as Markdown" and "Ask AI to grade my answer". Controls: level filter, reveal-one-by-one vs show-all (a pref), in-bank filter (client-side substring), shuffle. The page emits `FAQPage` JSON-LD (question + plain-text answer). "Seen" is recorded when a question is revealed (`progress.quizzes['interview/{track}/{id}']` with score 1). The "Mock interview with your AI" button is an Ask-AI preset over the whole bank (question list only, ≤ 6,000 chars, truncated with a note).

### 2.6 Flashcards `/practice/flashcards/` (mockup `Flashcards`)

Cards come from three sources, each a toggle in the page (defaults on): glossary terms on pages the reader finished (readPct ≥ 90 %, added once when the page is finished, never during reading), quiz items missed, manual "Add to flashcards". Card kinds: `term` (front: en + zh term and a one-line cue; back: `short` in both languages, the sentence from the topic that introduced it when available, links) and `quiz` (front: prompt + code; back: the correct answer + explanation).

Scheduler, SM-2-lite exactly as the master spec: intervals 1 · 3 · 7 · 14 · 30 days, ease 1.3–2.5. Ratings: Again (interval = 1, ease −0.2), Hard (interval × 1.2, ease −0.15), Good (interval × ease), Easy (interval × ease × 1.3, ease +0.15); ease clamped, interval clamped to 30 days. Keyboard: `space` flip, `1–4` rate, `e` edit (opens the source page), `x` suspend. The rail shows deck counts, a seven-day due histogram and the source toggles; export/import reuse the settings JSON.

### 2.7 Cheatsheets `/cheatsheets/`, `/cheatsheets/{slug}/` (mockup `Cheatsheet`)

New content type `src/content/cheatsheets/{slug}.{en,zh}.mdx` with frontmatter `title, description, track?, verified{version,date}, reviewed, status` and a body made of `<Sheet>` sections containing `<Row code="…">note</Row>` components (so print, Markdown twin and the JSON API can all read the rows). The page is a three-column card grid on desktop, one column on phones, and prints to one or two A4/Letter pages via `@media print` (two columns, no nav, links as footnotes). Actions: Print, Copy as Markdown, Download `.md`, Ask AI about a row (each row has a small "?" that fills the Ask-AI panel with the row). The "Say it precisely to your AI" vocabulary panel lists the glossary terms the sheet uses. AI-tool cheatsheets (P2b) use the same type with `track: ai-era`.

### 2.8 Bilingual mode (mockup `Bilingual`)

For topics with `aligned: true`, the build writes `/_bi/{other-lang}/{track}/{slug}.json`: an ordered list of `{ id, html }` where `id` is `{section-slug}:{ordinal}` for each block-level element under a heading (the alignment checker guarantees the same block sequence in both languages; a mismatch fails the build for that topic and flips `aligned` off). The `Bilingual` island fetches the JSON on first toggle and inserts each block after its counterpart with `lang="zh-Hans"` (or `en`) and the `.bi` style (smaller, indented, left rule). Code blocks are shared and not duplicated; callouts and TL;DR cells get their translated text inside the same box. Modes: off · EN + 中文 · 中文 + EN (pref `prefs.bilingual`; the topic control is enabled only when aligned, otherwise disabled with the "not aligned yet" note as in P1). Headings show the other language as a subtitle; the TOC shows both. The per-section vocabulary strip lists the glossary terms used in that section in both languages. "Hide 中文 for code comments" is a no-op placeholder until code comments are translated (they are not, by the editorial standard).

### 2.9 Playground `/playground/` (mockup `Playground`, P1)

Language tabs python · javascript · typescript · sql · html-css. Editor: CodeMirror 6 (`@codemirror/*`, lazy-loaded on first focus; the page renders a `<textarea>` fallback first). Runtimes reuse `src/lib/runners/*` (JS sandbox, TS via esbuild-wasm, Python via Pyodide) and add `sql.js` (with a per-example seed script) and an HTML/CSS `srcdoc` preview. URL state `?lang=python&code=<lz-string>` (`lz-string` compressToEncodedURIComponent), read on load and written on Share. Example loader lists runnable fences from topics (build-time JSON `/api/examples.json`: id, title, lang, code, topic url). **Kata mode**: when opened from a kata or a topic example with `tests` (a fence with meta `tests`), the Tests tab runs them: Python `assert` lines executed after the user code, JS `assert()` helper, SQL expected-rows comparison. "Ask AI to fix" builds a prompt with code + stdout/stderr + the error and opens Claude/ChatGPT. Footer states the runtime and "runs on your machine".

### 2.10 Prompt builder `/ai/prompt-builder/` (mockup `PromptBuilder`)

Client-side templates only. Inputs: topics (search over `/api/topics.json`, multi-select), goal (explain simpler · quiz me · review my code · port to language · write tests · Socratic tutor), level, options (link the `.md` twin, checklist first, precise vocabulary, answer in 中文, word cap), optional code. Output: a Markdown prompt with fixed sections (Role · Context · Task · Checklist first · Output · Code), a token estimate (chars ÷ 4), Copy / Open in Claude / Open in ChatGPT (same deep links as Ask-AI, same 8,000-char encoded budget: code is truncated first with a marker). Vocabulary and pitfalls come from the topic's glossary terms and its Pitfall callouts via `/api/topics/{track}/{slug}.json`. The rules-pack card links to 2.11.

### 2.11 Rules packs and context packs (endpoints)

- `/rules/{track}/CLAUDE.md`, `/rules/{track}/AGENTS.md`, `/rules/{track}/cursor.mdc`: generated at build from every reviewed topic's Pitfall callouts and "In the AI era" checklists in the track, as imperative rules with a one-line rationale and a link to the topic. Same content, three wrappers (the Cursor one carries the frontmatter `globs`). A track page shows the download card when the track has ≥ 10 rules.
- `/packs/{track}/{section}.md`: the reviewed topics of one section concatenated (Markdown twins), with a header listing what is inside and the canonical URLs, for Claude Projects / Cursor docs / NotebookLM. Size cap 1 MB per pack; larger sections split into `-1.md`, `-2.md`.
- `llms.txt` lists both families.

### 2.12 Progress, continue strip, settings additions

`progress` gains nothing new in shape; `paths` records `startedAt` when a path page is first opened and `plan` in `prefs`. The home and hub "Continue" strip shows the last topic with readPct < 90 %, the next due flashcards count and today's kata; it stays empty server-side. Settings gains: default bilingual mode (now real), interview reveal mode, flashcard sources, and "reset practice data" (separate from "clear all").

## 3. Data and schemas

Existing (P1/P0): `topic`, `quiz` (types mcq · predict · spotbug · review · fill), `path`, `glossary`, `interview`. New: `cheatsheet` (2.7). Quiz items get an optional `tests` string for kata mode and `checklist: [string]` on `review` items. Paths get `plan?` nothing; `edges[]` already exists.

Build-time JSON: `/api/examples.json` (2.9), `/api/quizzes/{track}/{slug}.json` (item metadata without answers, for the practice hub filters), `/_bi/**` (2.8). All endpoints are static files; nothing runs at request time.

## 4. Components and islands

Astro: `PathMap`, `Sheet`/`Row`, `PracticeCard`, `InterviewQuestion`, `KataShell`. Islands (Preact + signals, all `client:visible` or `client:idle`): `Predict`, `SpotBug`, `ReviewKata`, `Quiz`, `Checkpoint`, `Flashcards`, `PathState`, `Bilingual`, `Playground` (CodeMirror lazily inside), `PromptBuilder`, `TodayStrip`. Shared: `src/lib/srs.ts` (scheduler, pure, unit-tested), `src/lib/score.ts`, `src/lib/bilingual.ts`, `src/lib/lz.ts`.

## 5. Content work (Codex, under `prompts/editorial-standard.md`)

- Quiz banks: every tier-1 topic gets 4–8 items in the polish pass (already in the polish prompt); a separate pass adds one `review` kata to each tier-1 topic in tracks python, javascript, typescript, go, backend, ai-era (~120 katas over time; 30 for launch).
- Paths (6): python-from-zero, javascript-to-typescript, go-for-backend, frontend-foundations, ai-native-developer, cs-foundations. Each 18–30 topics, 4–6 milestones, checkpoint banks of 8 items.
- Interview banks (8 for launch): python, javascript, typescript, go, backend, frontend, architecture, ai-era; 30–45 questions each, both languages.
- Cheatsheets (12 for launch): python, javascript, typescript, go, rust, sql, git-shell, regex, http, docker, claude-code, codex-cli.
- Glossary: ≥ 300 terms via `content:extract` plus a Codex pass on AI-era terms.

## 6. Testing

Unit: `srs.ts` (every rating path, clamps), `score.ts`, `bilingual.ts` (pairing, mismatch handling), `lz.ts` round trip, rules-pack generator (one topic → expected rules). E2E (Playwright): predict flow with flashcard enqueue; spotbug reveal; review kata four steps; checkpoint pass unlocks the map node; path map states from seeded localStorage; flashcards review with keyboard; interview reveal + FAQPage JSON-LD; cheatsheet print stylesheet (emulate `print`); bilingual toggle inserts N blocks = JSON length; playground runs Python and SQL, share link round-trips; prompt builder output contains the `.md` link and vocabulary. A11y: axe on each new page type in both themes. Budgets: topic pages unchanged (the new islands are lazy); practice and playground pages get their own Lighthouse URLs with the same ≥ 0.95 targets and a 300 kB script budget for the playground (CodeMirror).

## 7. Decisions (taken 2026-09-04; the user delegated the call)

1. **Flashcards: four ratings** (Again / Hard / Good / Easy, keys 1–4). SM-2 needs the ease signal that two buttons cannot give, and the mockup already shows the intervals so the choice is informed.
2. **Cheatsheet print: two columns** on A4 and Letter, 9.5 pt monospace for code, links as footnotes. Density is the point of a cheatsheet.
3. **Bilingual: paired by default** (the other language under each block). Side by side is an option only at ≥ 1440 px, remembered in `prefs.bilingualLayout`.
4. **Review kata: mark lines plus an optional one-line comment per marked line**, kept in memory only. Writing the comment is the skill being trained; the cost is one input per marked line.
5. **Playground editor: CodeMirror 6, lazy-loaded on first focus**, with a `<textarea>` rendered first so the page works without it. The playground page carries its own script budget (300 kB); topic pages stay unchanged.
