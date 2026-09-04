# P2 Learning Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the learning layer to codewiki: practice items and katas, checkpoints, learning paths with a map, interview banks, flashcards with spaced repetition, cheatsheets, bilingual reading, the playground, the prompt builder and the rules/context packs, all static and all storing user state in the browser.

**Architecture:** Everything is built at build time from the content collections into static HTML and JSON; Preact islands hydrate on visibility or interaction and read and write the `cw:v1:*` localStorage keys through `src/lib/prefs.ts`. Pure logic (scheduler, scoring, map layout, block pairing, URL state) lives in `src/lib/*.ts` with unit tests; islands are thin. New pages reuse `Base.astro`, the design tokens and the component vocabulary of the P1 pages; the P2 mockups in `docs/design/mockups/p2/` are the visual truth.

**Tech Stack:** Astro 7.3 (static, Content Layer), Preact 10 + `@preact/signals`, TypeScript strict, Tailwind v4 over `src/styles/tokens.css`, Vitest, Playwright, `lz-string` (already a dependency), CodeMirror 6 (`@codemirror/state`, `@codemirror/view`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/lang-python`, `@codemirror/lang-javascript`, `@codemirror/lang-sql`, `@codemirror/lang-html`), `sql.js`, the existing runners (`src/lib/runners/*`).

**Spec:** `docs/superpowers/specs/2026-09-04-p2-learning-layer-design.md` (approved 2026-09-04), which argues from `docs/superpowers/specs/2026-09-03-codewiki-design.md` §4–§6.2, §7, §9, §11.

## Global Constraints

- Static output only: `output: 'static'`, `trailingSlash: 'always'`, English at `/`, Chinese at `/zh/`; every page exists in both locales through `src/pages-shared/*.astro` + thin `src/pages/**` and `src/pages/zh/**` files, as P1 does.
- No network calls from the site at runtime other than same-origin static assets; no LLM API. Ask-AI stays a deep link (`src/lib/prompts.ts`: `buildPrompt`, `deepLinks`, `QUERY_LIMIT = 8_000` encoded characters).
- User state lives only in localStorage under the keys in `src/lib/prefs.ts` (`KEYS.prefs|progress|flashcards|recents`) through `readStore` / `writeStore` / `writeStoreDebounced` / `flushStore`; islands guard every access (private mode throws).
- Islands hydrate lazily: `client:visible` for anything below the fold, `client:idle` for strips, `client:only="preact"` only when there is nothing to server-render. Topic pages keep the Task 19 script budget (`resource-summary:script:size <= 61440` on `/python/closures/`).
- Design: tokens only (`var(--…)` from `src/styles/tokens.css`), no new hard-coded colours; IBM Plex Sans/Mono; the AI-era accent is `--acc2`; component classes and spacing follow `docs/design/mockups/p2/*.dc.html` and the P1 mockups.
- i18n: every visible string goes through `t(locale, key)`; implementers add the English value to `src/i18n/en.ts` and the same English text as a placeholder to `src/i18n/zh.ts`, prefixed with `//P2` on the line above; Task 17 sends all placeholders to Codex (`prompts/translate-ui.md`).
- All code comments, docs and commit messages in English; conventional commits; `pnpm lint && pnpm check && pnpm test && pnpm build` green before every commit; Playwright specs live in `tests/e2e/`, unit tests in `tests/unit/`.
- Schemas are Zod via `astro/zod` in `src/schemas/*.ts`; content ids are `{track}/{slug}`; `topicRef`, `slug`, `localized` come from `src/schemas/localized.ts`; `difficulty` from `src/schemas/topic.ts`.
- Nothing in this plan edits `docs/superpowers/STATUS.md` (the controller owns it) or the content prose (Codex owns it; Task 17 defines the prompts and runners).

## Setup

Branch `p2-learning-layer` from `main` after the P1 merge (and after the P0 merge if it has landed; if `src/schemas/interview.ts` is missing, Task 8 creates it). Worktree `.worktrees/p2-learning-layer`; `pnpm install`; `pnpm test` must pass before Task 1.

---

### Task 1: Storage additions, scheduler and scoring

**Files:**
- Modify: `src/lib/prefs.ts`
- Create: `src/lib/srs.ts`, `src/lib/score.ts`
- Test: `tests/unit/srs.test.ts`, `tests/unit/score.test.ts`, extend `tests/unit/prefs.test.ts`

**Interfaces:**
- Consumes: `Prefs`, `Progress`, `Flashcard`, `Flashcards`, `KEYS`, `readStore`, `writeStore` from `src/lib/prefs.ts`.
- Produces: `Rating`, `rate()`, `isDue()`, `dueOn()` (`srs.ts`); `recordQuiz()`, `passed()`, `PASS_MARK`, `completeTopic()`, `enqueueCards()`, `quizCardId()`, `termCardId()` (`score.ts`); new pref fields.

- [ ] **Step 1: Extend the stored types** in `src/lib/prefs.ts` (append fields, keep every existing default):

```ts
export type Plan = 15 | 30 | 60;
export type BilingualLayout = 'paired' | 'side';
export type RevealMode = 'one' | 'all';

export interface Prefs {
  theme: Theme;
  depth: Depth;
  bilingual: BilingualMode;
  fontSize: FontSize;
  lang?: 'en' | 'zh';
  /** Minutes a day the reader plans to spend; drives the "about N weeks" line on paths. */
  plan?: Plan;
  bilingualLayout?: BilingualLayout;
  interviewReveal?: RevealMode;
  /** Flashcard sources; every source defaults to on when the key is absent. */
  cardSources?: { terms: boolean; quiz: boolean; manual: boolean };
}

export interface Flashcard {
  id: string;
  kind: 'term' | 'quiz';
  /** `glossary:{term}` or `quiz:{track}/{slug}#{item}` — what the card is about. */
  ref: string;
  due: string;
  interval: number;
  ease: number;
  reps: number;
  suspended?: boolean;
  /** Where the card came from, for the source toggles. */
  source?: 'terms' | 'quiz' | 'manual';
}
```

`DEFAULT_PREFS` gains `plan: 30, bilingualLayout: 'paired', interviewReveal: 'one'` (leave `cardSources` undefined = all on). Add `export function cardSources(p: Prefs) { return p.cardSources ?? { terms: true, quiz: true, manual: true }; }`.

- [ ] **Step 2: Write the failing scheduler tests** `tests/unit/srs.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { rate, isDue, dueOn, NEW_CARD, type Rating } from '@/lib/srs';

const now = new Date('2026-09-04T10:00:00Z');
const card = { ...NEW_CARD, id: 'c1', kind: 'term' as const, ref: 'glossary:closure', due: now.toISOString() };

describe('rate', () => {
  it('again resets the interval to one day and lowers ease', () => {
    const next = rate({ ...card, interval: 7, ease: 2.5, reps: 3 }, 'again', now);
    expect(next.interval).toBe(1);
    expect(next.ease).toBeCloseTo(2.3);
    expect(next.reps).toBe(4);
    expect(next.due).toBe('2026-09-05T10:00:00.000Z');
  });
  it('hard grows slowly and lowers ease', () => {
    const next = rate({ ...card, interval: 10, ease: 2.0 }, 'hard', now);
    expect(next.interval).toBe(12);
    expect(next.ease).toBeCloseTo(1.85);
  });
  it('good multiplies by ease', () => {
    expect(rate({ ...card, interval: 3, ease: 2.0 }, 'good', now).interval).toBe(6);
  });
  it('easy multiplies by ease × 1.3 and raises ease', () => {
    const next = rate({ ...card, interval: 3, ease: 2.0 }, 'easy', now);
    expect(next.interval).toBe(8); // round(3 × 2.0 × 1.3) = 8
    expect(next.ease).toBeCloseTo(2.15);
  });
  it('clamps ease to [1.3, 2.5] and interval to [1, 30]', () => {
    expect(rate({ ...card, interval: 1, ease: 1.3 }, 'again', now).ease).toBe(1.3);
    expect(rate({ ...card, interval: 30, ease: 2.5 }, 'easy', now).ease).toBe(2.5);
    expect(rate({ ...card, interval: 30, ease: 2.5 }, 'easy', now).interval).toBe(30);
  });
  it('a new card rated good goes to three days', () => {
    expect(rate(card, 'good', now).interval).toBe(3);
  });
  it('rejects unknown ratings at the type level', () => {
    const r: Rating = 'good';
    expect(['again', 'hard', 'good', 'easy']).toContain(r);
  });
});

describe('isDue / dueOn', () => {
  it('is due when due <= now, not when suspended', () => {
    expect(isDue(card, now)).toBe(true);
    expect(isDue({ ...card, suspended: true }, now)).toBe(false);
    expect(isDue({ ...card, due: '2026-09-05T00:00:00Z' }, now)).toBe(false);
  });
  it('dueOn buckets the next seven days, today first', () => {
    const cards = [card, { ...card, id: 'c2', due: '2026-09-06T09:00:00Z' }, { ...card, id: 'c3', due: '2026-08-01T00:00:00Z' }];
    expect(dueOn(cards, now)).toEqual([2, 0, 1, 0, 0, 0, 0]);
  });
});
```

- [ ] **Step 3: Run** `pnpm vitest run tests/unit/srs.test.ts` → fails (module missing).

- [ ] **Step 4: Implement** `src/lib/srs.ts`:

```ts
/**
 * SM-2-lite (spec §2.6). Intervals live on the 1 · 3 · 7 · 14 · 30 day ladder for a new card
 * and are multiplied by ease afterwards; ease stays inside [1.3, 2.5] and intervals inside
 * [1, 30] days. Pure functions: the island owns the store.
 */
import type { Flashcard } from '@/lib/prefs';

export type Rating = 'again' | 'hard' | 'good' | 'easy';
export const RATINGS: Rating[] = ['again', 'hard', 'good', 'easy'];
export const LADDER = [1, 3, 7, 14, 30];
export const EASE_MIN = 1.3;
export const EASE_MAX = 2.5;
export const INTERVAL_MAX = 30;
const DAY = 86_400_000;

export const NEW_CARD: Pick<Flashcard, 'interval' | 'ease' | 'reps'> = { interval: 0, ease: 2.2, reps: 0 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Next interval in days for a card at `interval` rated `rating`. */
export function nextInterval(interval: number, ease: number, rating: Rating): number {
  if (rating === 'again') return 1;
  if (interval === 0) return rating === 'hard' ? 1 : rating === 'good' ? LADDER[1] : LADDER[2];
  const factor = rating === 'hard' ? 1.2 : rating === 'good' ? ease : ease * 1.3;
  return clamp(Math.round(interval * factor), 1, INTERVAL_MAX);
}

export function nextEase(ease: number, rating: Rating): number {
  const delta = rating === 'again' ? -0.2 : rating === 'hard' ? -0.15 : rating === 'easy' ? 0.15 : 0;
  return Math.round(clamp(ease + delta, EASE_MIN, EASE_MAX) * 100) / 100;
}

export function rate(card: Flashcard, rating: Rating, now: Date): Flashcard {
  const interval = nextInterval(card.interval, card.ease, rating);
  return {
    ...card,
    interval,
    ease: nextEase(card.ease, rating),
    reps: card.reps + 1,
    due: new Date(now.getTime() + interval * DAY).toISOString(),
  };
}

export function isDue(card: Flashcard, now: Date): boolean {
  return !card.suspended && Date.parse(card.due) <= now.getTime();
}

/** Cards due per day for the next seven days; overdue cards count as today. */
export function dueOn(cards: Flashcard[], now: Date): number[] {
  const start = new Date(now); start.setUTCHours(0, 0, 0, 0);
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  for (const c of cards) {
    if (c.suspended) continue;
    const day = Math.floor((Date.parse(c.due) - start.getTime()) / DAY);
    const i = clamp(day, 0, 6);
    if (day <= 6) buckets[i]++;
  }
  return buckets;
}

/** Interval label for a rating button, e.g. "7 days". */
export function previewInterval(card: Flashcard, rating: Rating): number {
  return nextInterval(card.interval, card.ease, rating);
}
```

- [ ] **Step 5: Run the tests** → pass. Fix `dueOn` if the "today first" case fails (overdue → bucket 0).

- [ ] **Step 6: Scoring helpers** `src/lib/score.ts` with tests in `tests/unit/score.test.ts` (pure, store passed in and returned):

```ts
import type { Flashcard, Flashcards, Progress } from '@/lib/prefs';
import { NEW_CARD } from '@/lib/srs';

export const PASS_MARK = 0.7;

export function passed(score: number, total: number): boolean {
  return total > 0 && score / total >= PASS_MARK;
}

/** Records a quiz result; keeps the best score for the same id. */
export function recordQuiz(progress: Progress, id: string, score: number, total: number, now: Date): Progress {
  const prev = progress.quizzes[id];
  const better = !prev || score / total >= prev.score / prev.total;
  return {
    ...progress,
    quizzes: { ...progress.quizzes, [id]: better ? { score, total, at: now.toISOString() } : prev },
  };
}

export function completeTopic(progress: Progress, topicId: string, now: Date): Progress {
  const prev = progress.topics[topicId] ?? { readPct: 0, lastAt: now.toISOString() };
  return { ...progress, topics: { ...progress.topics, [topicId]: { ...prev, completedAt: prev.completedAt ?? now.toISOString(), lastAt: now.toISOString() } } };
}

export const quizCardId = (bank: string, item: string) => `quiz:${bank}#${item}`;
export const termCardId = (term: string) => `glossary:${term}`;

/** Adds cards that are not in the deck yet; existing cards (by id) are untouched. */
export function enqueueCards(deck: Flashcards, cards: Array<Pick<Flashcard, 'id' | 'kind' | 'ref' | 'source'>>, now: Date): Flashcards {
  const have = new Set(deck.cards.map((c) => c.id));
  const fresh = cards.filter((c) => !have.has(c.id)).map((c) => ({ ...c, ...NEW_CARD, due: now.toISOString() }));
  return fresh.length ? { cards: [...deck.cards, ...fresh] } : deck;
}
```

Tests: `passed(7,10)` true, `passed(6,10)` false, `passed(0,0)` false; `recordQuiz` keeps the better score and the newer `at` on a tie; `completeTopic` never overwrites an existing `completedAt`; `enqueueCards` dedupes by id and returns the same object when nothing is new.

- [ ] **Step 7: Commit** `git add -A && git commit -m "feat(learn): SRS scheduler, scoring helpers and pref fields for the learning layer"`

---

### Task 2: Quiz schema additions and the practice catalogue

**Files:**
- Modify: `src/schemas/quiz.ts`, `src/content.config.ts` (no change unless `quizzes` lacks the schema), `src/content/quizzes/python/closures.yaml` (add one `review` item so the catalogue has one of each type)
- Create: `src/lib/practice.ts`, `src/pages/api/quizzes/[track]/[slug].json.ts`, `src/pages/api/practice.json.ts`
- Test: `tests/unit/practice.test.ts`, extend `tests/unit/schemas.test.ts`

**Interfaces:**
- Produces: `PracticeItem`, `listPracticeItems()`, `practiceUrl()`, `kataOfTheDay()`, `ITEM_TYPES`, `typeLabelKey()`; `/api/practice.json` (all items, no answers); `/api/quizzes/{track}/{slug}.json` (one bank, no answers).

- [ ] **Step 1: Schema additions** in `src/schemas/quiz.ts`:

```ts
export const issueKind = z.enum(['security', 'correctness', 'edge-case', 'readability', 'performance']);
const issue = z.object({ line: z.number().int().positive(), lines: z.number().int().positive().optional(), kind: issueKind, note: localized });

const base = { id: z.string().min(1), prompt: localized, explanation: localized, difficulty, tags: z.array(z.string()).default([]),
  /** Optional test lines for the playground's kata mode (assertions after the user code). */
  tests: z.string().optional(),
  /** Minutes the item takes; the catalogue shows it. Default by type below. */
  minutes: z.number().int().positive().optional() };

// review items: what the model got right, and the checklist the learner should run
z.object({ ...base, type: z.literal('review'), ...code, issues: z.array(issue).min(1), right: localized.optional(), checklist: z.array(localized).default([]), task: localized.optional() })
```

`task` is the one-line request the assistant was given ("load a YAML config with defaults…"). `lines` lets an issue span `line..lines`. Keep every existing item valid (all fields optional or defaulted). Add a `review` item to `python/closures.yaml` (English + Chinese, ≤ 20 lines of code, 3 issues) so tests and pages have one; it is placeholder content marked `tags: [calibration]` and Task 17 replaces it.

- [ ] **Step 2: Catalogue** `src/lib/practice.ts`:

```ts
import { getCollection } from 'astro:content';
import type { Locale } from '@/lib/urls';
import { localizePath } from '@/lib/urls';

export const ITEM_TYPES = ['predict', 'spotbug', 'review', 'mcq', 'fill'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];
export const DEFAULT_MINUTES: Record<ItemType, number> = { predict: 2, spotbug: 4, review: 6, mcq: 1, fill: 1 };

export interface PracticeItem {
  bank: string;          // `python/closures`
  track: string; slug: string; item: string; type: ItemType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  minutes: number;
  prompt: { en: string; zh: string };
  tags: string[];
  lang?: string;
}

export function practiceUrl(i: Pick<PracticeItem, 'type' | 'track' | 'slug' | 'item'>, locale: Locale): string {
  return localizePath(`/practice/${i.type}/${i.track}/${i.slug}/${i.item}/`, locale);
}

export async function listPracticeItems(): Promise<PracticeItem[]> {
  const banks = await getCollection('quizzes');
  const out: PracticeItem[] = [];
  for (const bank of banks) {
    const [track, slug] = bank.id.split('/');
    for (const it of bank.data.items) {
      out.push({ bank: bank.id, track, slug, item: it.id, type: it.type, difficulty: it.difficulty,
        minutes: it.minutes ?? DEFAULT_MINUTES[it.type], prompt: it.prompt, tags: it.tags, lang: 'lang' in it ? it.lang : undefined });
    }
  }
  return out.sort((a, b) => a.bank.localeCompare(b.bank) || a.item.localeCompare(b.item));
}

/** Deterministic pick per UTC day so every visitor sees the same kata and the page stays static-cacheable. */
export function kataOfTheDay<T>(items: T[], date: Date): T | undefined {
  if (!items.length) return undefined;
  const day = Math.floor(date.getTime() / 86_400_000);
  let h = 2166136261; for (const ch of String(day)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return items[h % items.length];
}

export const typeLabelKey = (t: ItemType) => `practice.type.${t}` as const;
```

Tests (`tests/unit/practice.test.ts`, mocking `astro:content` the way `tests/unit/llms.test.ts` does): `practiceUrl` for both locales; `kataOfTheDay` is stable for the same day and changes across days on a 10-item list (assert at least two different picks over 30 consecutive days); `DEFAULT_MINUTES` covers every `ITEM_TYPES` entry.

- [ ] **Step 3: Endpoints.** `src/pages/api/practice.json.ts` returns `{ generatedAt, items: PracticeItem[] }` via `json()` from `src/lib/api.ts`. `src/pages/api/quizzes/[track]/[slug].json.ts` (`getStaticPaths` from the quizzes collection) returns the bank with answers stripped: for `mcq`/`predict` options carry `text` only, `fill` drops `answer`, `spotbug`/`review` drop `issues`, `explanation` dropped; add `url` per item. Unit-test the stripping function (`stripAnswers(bank)` exported from `practice.ts`) so no `correct`, `answer`, `issues`, `explanation` key survives.

- [ ] **Step 4:** `pnpm lint && pnpm check && pnpm test && pnpm build`; confirm `dist/api/practice.json` and `dist/api/quizzes/python/closures.json` exist and contain no `"correct"`.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(practice): quiz schema additions, practice catalogue and answer-free JSON endpoints"`

---

### Task 3: Quiz islands — Predict/Quiz, SpotBug, ReviewKata

**Files:**
- Create: `src/islands/Quiz.tsx` (mcq · predict · fill), `src/islands/SpotBug.tsx`, `src/islands/ReviewKata.tsx`, `src/islands/quiz-shared.ts` (store writes, keyboard, option rendering), `src/components/KataShell.astro`
- Modify: `src/styles/global.css` (append the `.opt`, `.ln`, `.note`, `.step` rules from `docs/design/mockups/p2/src/head.part.html`, token-based)
- Test: `tests/unit/quiz-shared.test.ts`; e2e in Task 4

**Interfaces:**
- Consumes: `QuizItem` (`src/schemas/quiz.ts`), `recordQuiz`, `enqueueCards`, `quizCardId` (Task 1), `t()` labels passed as props (islands never import dictionaries).
- Produces: islands with props `{ bank: string; item: QuizItem; locale: Locale; labels: Record<string,string>; onDone?: (score: number, total: number) => void }`; DOM contract: root `[data-quiz="{bank}#{item}"]`, `data-state="idle|answered"`, result `[data-score]`.

- [ ] **Step 1: KataShell.astro** server-renders what every item shares, so the HTML is complete without JavaScript: the prompt (`h2.q-prompt`), the code (through the same Shiki path as topics: pass the code through `Astro.render`-free `codeToHtml` from `shiki` with the `css-variables` theme, wrapped in `.codebox` like `rehype-codebox` does; expose `renderCode(code, lang)` in `src/lib/code-html.ts` and reuse it in Tasks 4, 5, 8, 13), the options as a list, and the answer + explanation inside `<template data-answer>` so a skim does not see it. The island mounts with `client:visible` onto the shell and takes over.

- [ ] **Step 2: quiz-shared.ts** (pure, tested): `optionKey(index)` → `'1'..'9'`; `gradeOptions(item, choice)` → `{ correct: boolean; correctIndex: number }`; `gradeFill(item, text)` (case-insensitive, trimmed, `|`-separated alternates); `gradeLines(item, marked: number[])` → `{ found: Issue[]; missed: Issue[]; score: number; total: number }` where a marked line counts for an issue if `line <= marked <= (lines ?? line)`; `persist(bank, itemId, score, total, item, now)` reads `progress` + `flashcards`, applies `recordQuiz`, and on a miss `enqueueCards` with `{ id: quizCardId(bank, itemId), kind: 'quiz', ref: quizCardId(bank, itemId), source: 'quiz' }`, then `writeStore` both (wrapped in try/catch).

- [ ] **Step 3: Quiz.tsx** (mcq · predict · fill). Options as `.opt` rows with a radio glyph; keyboard `1–9` selects, `Enter` reveals; after reveal the chosen row gets `.ok` or `.bad`, the correct one `.ok`, the explanation shows, `data-state="answered"`; `persist()` runs once. Predict shows the code above the options. Fill shows an input + "Check".

- [ ] **Step 4: SpotBug.tsx.** Code lines rendered from the shell's `.codebox` are given a gutter marker (`.ln .mk`) by the island (it wraps each `.line` span from Shiki). Click toggles `marked`; "Reveal" grades with `gradeLines`, colours hit rows `.hit` and missed issue rows `.miss`, shows each issue's `note` under its line (`.note`), `persist()`.

- [ ] **Step 5: ReviewKata.tsx.** Four steps in the header (`.step` read · mark lines · write your review · compare; `on`/`done` classes) driven by a `step` signal. Step 2 = SpotBug marking; step 3 = a one-line `<input>` per marked line (in memory only, `aria-label` "Your comment for line N"); step 4 = compare: expert issues as `.note.expert` with `kind` tags (`.tag.bad` security, `.tag.warn` correctness/edge-case, `.tag` others), the learner's comments as `.note` beside them, the "what the model got right" panel (`item.right`), the checklist (`item.checklist`, checkboxes reflecting which issues were found), score ring, "Add the missed issues to flashcards" (one card per missed issue: id `quizCardId(bank, item) + ':' + issue.line`), `persist()`. The footer line "generated code is illustrative, not from any one model" is rendered by the shell for every review item.

- [ ] **Step 6: Tests** for `quiz-shared.ts`: `gradeFill('a | B', ' b ')` true; `gradeLines` with a spanning issue (14–17) and marks [15] counts as found; marks on non-issue lines never count; `persist` writes both stores and only enqueues a card on a miss (mock `localStorage` as `tests/unit/prefs.test.ts` does).

- [ ] **Step 7: Commit** `git add -A && git commit -m "feat(practice): quiz, spot-the-bug and review-kata islands with a server-rendered shell"`

---

### Task 4: Kata pages under `/practice/{type}/{track}/{slug}/{item}/`

**Files:**
- Create: `src/pages-shared/Kata.astro`, `src/pages/practice/[type]/[track]/[slug]/[item].astro`, `src/pages/zh/practice/[type]/[track]/[slug]/[item].astro`
- Modify: `src/lib/seo.ts` (add `kind: 'practice'` to `PageKind` and a title format `"{prompt} · Practice"`), `src/i18n/en.ts`, `src/i18n/zh.ts`
- Test: `tests/e2e/practice.spec.ts`

**Interfaces:**
- Consumes: `listPracticeItems`, `practiceUrl` (Task 2); `KataShell` + islands (Task 3); `buildHead`, `breadcrumbLd` (`src/lib/seo.ts`); `buildPrompt`/`deepLinks` (`src/lib/prompts.ts`); `compressToEncodedURIComponent` from `lz-string`.

- [ ] **Step 1: getStaticPaths** from `listPracticeItems()` (both locales through the shared page, as `[track]/[slug].astro` does). Page: breadcrumb tags (Practice / type / track / slug), `h1` = prompt, the topic link ("from {topic title}"), chips (language version from the topic's `verified`, difficulty, minutes, `N issues to find` for spotbug/review), the `KataShell` with the right island, prev/next within the bank (`.item` cards), action row: "Copy code", "Open in playground" (`/playground/?lang={lang}&code={lz}`; the playground lands in Task 13 — the link is fine to emit now because `P2_NAV` stays false until Task 11 and `check:links` runs on `dist`, so add `/playground/` to the link checker's allowlist in `scripts/check-dist-links.mjs` via a `KNOWN_LATER = ['/playground/']` constant removed in Task 13), "Ask AI" (preset `bugs` with the code as the section text). Rail: "your review"/result mirror, the topic's Ask-AI card. `pagefind` meta `{ type: 'practice', track }`, filter `lang`.

- [ ] **Step 2: SEO.** `buildHead({ kind: 'practice', … })`, `breadcrumbLd`, and a `Quiz` JSON-LD is deliberately **not** emitted (answers would leak); `robots` stays index.

- [ ] **Step 3: e2e** `tests/e2e/practice.spec.ts`: (a) `/practice/predict/python/closures/predict-loop-binding/` renders the prompt and 4 options, the answer is inside `<template>` (not in `document.body.innerText`); choosing the wrong option shows `.opt.bad`, the explanation, sets `data-state="answered"` and writes `cw:v1:progress` with `quizzes["python/closures#predict-loop-binding"].score === 0` and one card in `cw:v1:flashcards`; (b) keyboard `2` then `Enter` answers; (c) the review item page shows the four steps and reaches "compare" with a score ring; (d) zh page exists and shows the zh prompt.

- [ ] **Step 4:** `pnpm lint && pnpm check && pnpm test && pnpm build && pnpm check:links && pnpm exec playwright test tests/e2e/practice.spec.ts`

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(practice): one page per quiz item in both locales"`

---

### Task 5: Checkpoint inside topics

**Files:**
- Modify: `src/components/Checkpoint.astro` (replace the placeholder), `src/pages-shared/Topic.astro` (pass the bank), `src/i18n/*.ts`
- Create: `src/islands/Checkpoint.tsx`
- Test: `tests/e2e/checkpoint.spec.ts`, extend `tests/unit/score.test.ts` if new pure helpers appear

**Interfaces:**
- Consumes: `quizzes` collection entry named by `topic.data.quiz`; Task 3 islands' grading helpers (`quiz-shared.ts`); `recordQuiz`, `passed`, `completeTopic`, `enqueueCards` (Task 1); the `#checkpoint` anchor and TOC entry already exist in P1.

- [ ] **Step 1: Checkpoint.astro** loads the bank (`getEntry('quizzes', id)`); if missing, renders the existing "available in Practice" note. Otherwise server-renders a summary card (`lbl` "checkpoint", "{n} questions · {m} predict-the-output · {k} spot-the-bug", a "Start" button) and embeds the items as `<script type="application/json" data-checkpoint-items>` (answers included: the topic page already contains the explanation text in Deep sections, and a checkpoint is not an exam). Mount `Checkpoint.tsx` with `client:visible`.

- [ ] **Step 2: Checkpoint.tsx** runs items one at a time with a `.bar` progress; reuses the `Quiz`/`SpotBug` renderers from Task 3 (export them as components from their modules); the result screen shows score, the explanations for misses, "Add misses to flashcards", and "Continue to {next}" (next topic from `PrevNext`'s data passed as a prop). On finish: `recordQuiz(progress, bankId, score, total)`; if `passed`, `completeTopic(progress, topicId)`; `writeStore` + `flushStore`. Dispatch `window.dispatchEvent(new CustomEvent('cw:progress'))` so `ReadTracker`/`TrackProgress` can refresh.

- [ ] **Step 3: e2e:** on `/python/closures/` the checkpoint card shows the count; completing all items (answer each by clicking the first `.opt` and Enter, or Reveal) shows the result screen; with all-correct answers (drive via the embedded JSON in the test) `cw:v1:progress.topics["python/closures"].completedAt` is set; the TOC still lists "Checkpoint" at every depth.

- [ ] **Step 4: Budget:** `pnpm build && pnpm exec lhci autorun` (Task 19 config) — the topic page script budget must still pass; the island is `client:visible` and imports only `quiz-shared.ts` + the two renderers.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(topic): real checkpoint quiz at the end of every topic with a bank"`

---

### Task 6: Practice hub `/practice/`

**Files:**
- Create: `src/pages-shared/Practice.astro`, `src/pages/practice/index.astro`, `src/pages/zh/practice/index.astro`, `src/islands/TodayStrip.tsx`, `src/islands/PracticeFilters.tsx`, `src/components/PracticeCard.astro`
- Modify: `src/i18n/*.ts`, `src/styles/global.css`, `scripts/check-dist-links.mjs` (remove nothing yet)
- Test: `tests/e2e/practice-hub.spec.ts`

**Interfaces:**
- Consumes: `listPracticeItems`, `kataOfTheDay`, `practiceUrl` (Task 2); `getContinue`, `dueFlashcards`, `readStore` (`prefs.ts`); paths collection (for "next checkpoint on your path", read-only).
- Produces: `/practice/` in both locales; `.today` strip contract `[data-today]` with three `.card`s.

- [ ] **Step 1: Page** per mockup `Practice.dc.html`: header (tag row, h1 `practice.title`, lead, chips with real counts: items, tracks with items, "runs offline", "中文同步"), the today strip (server-rendered with the kata of the day filled in — it is deterministic — and the two personal cards empty; `TodayStrip` hydrates `client:idle` and fills flashcards-due and next-checkpoint from local data, hiding a card when there is no data), tabs by type (links with `?type=`), filter row (track Seg, level Seg, sort Seg), the card grid (`PracticeCard`: track glyph Tag, type Tag, title = prompt, one-line sub = topic description, difficulty, minutes, `data-track data-type data-level data-id`), "Show N more" (CSS: cards beyond 24 hidden until the button flips a class), rail (your practice stats island part of `TodayStrip`: solved, accuracy, streak from `progress.quizzes`; interview banks list from the `interview` collection if present; Ask-AI card).

- [ ] **Step 2: PracticeFilters.tsx** (`client:idle`): reads `?type&track&level&sort` from the URL, toggles `hidden` on cards by data attributes, updates the counts line, writes the URL with `history.replaceState`; marks cards `done` / `missed` from `progress.quizzes` (class + Tag text). No re-rendering of cards.

- [ ] **Step 3: e2e:** hub lists ≥ 5 cards; `?type=review` hides non-review cards; the today strip shows the kata card with a link into `/practice/review/…`; with seeded `cw:v1:flashcards` (2 due) the flashcards card shows "2 due"; the zh hub renders.

- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(practice): practice hub with today strip, filters and the kata of the day"`

---

### Task 7: Learning paths and the map

**Files:**
- Create: `src/lib/pathmap.ts`, `src/lib/paths.ts`, `src/components/PathMap.astro`, `src/islands/PathState.tsx`, `src/pages-shared/Paths.astro`, `src/pages-shared/Path.astro`, `src/pages/paths/index.astro`, `src/pages/paths/[slug].astro`, `src/pages/zh/paths/index.astro`, `src/pages/zh/paths/[slug].astro`
- Modify: `src/schemas/path.ts` (no change expected; confirm `edges` exists), `src/i18n/*.ts`, `src/styles/global.css` (append `.node`, `.edge`, `.mile`, `.mtitle`, `.ntext` rules from `Path.dc.html`), `src/pages/api/paths.json.ts` (add `url` per path), `src/lib/seo.ts` (`courseLd` exists; add `kind: 'path'`)
- Test: `tests/unit/pathmap.test.ts`, `tests/unit/paths.test.ts`, `tests/e2e/paths.spec.ts`

**Interfaces:**
- Consumes: `paths` collection (`Path` type), topics collection for titles/existence, `Progress`.
- Produces: `layoutPath(path, exists) → MapLayout`; `nextStep(path, progress)`; `pathProgress(path, progress)`; `weeksLeft(minutesLeft, plan)`.

- [ ] **Step 1: Layout, pure and tested** `src/lib/pathmap.ts`:

```ts
export interface MapNode { id: string; col: number; row: number; x: number; y: number; w: number; h: number; label: string; exists: boolean; }
export interface MapDiamond { milestone: string; col: number; x: number; y: number; label: string; }
export interface MapEdge { from: string; to: string; d: string; kind: 'flow' | 'prereq'; }
export interface MapLayout { width: number; height: number; columns: { id: string; title: string; x: number; w: number }[]; nodes: MapNode[]; diamonds: MapDiamond[]; edges: MapEdge[]; }

export const NODE = { w: 180, h: 34, gap: 14 }; export const COL = { w: 212, gap: 24, padX: 16, top: 40 };

export function layoutPath(path: { milestones: { id: string; title: string; topics: string[] }[]; edges: { from: string; to: string }[] }, exists: (id: string) => boolean, titleOf: (id: string) => string): MapLayout {
  const rows = Math.max(...path.milestones.map((m) => m.topics.length));
  const height = COL.top + rows * (NODE.h + NODE.gap) + 90;
  const columns = path.milestones.map((m, i) => ({ id: m.id, title: m.title, x: 8 + i * (COL.w + COL.gap), w: COL.w }));
  const nodes: MapNode[] = []; const at = new Map<string, MapNode>();
  path.milestones.forEach((m, col) => m.topics.forEach((id, row) => {
    const n = { id, col, row, x: columns[col].x + COL.padX, y: COL.top + row * (NODE.h + NODE.gap), ...NODE, label: titleOf(id), exists: exists(id) };
    nodes.push(n); at.set(id, n);
  }));
  const diamonds = path.milestones.map((m, col) => ({ milestone: m.id, col, x: columns[col].x + COL.w / 2, y: height - 60, label: '' }));
  const edges: MapEdge[] = [];
  for (let i = 0; i < diamonds.length - 1; i++) {
    const a = diamonds[i], b = columns[i + 1];
    edges.push({ from: a.milestone, to: path.milestones[i + 1].id, kind: 'flow', d: `M${a.x} ${a.y + 16} C${a.x} ${a.y + 60} ${b.x} ${a.y + 60} ${b.x} ${a.y + 30} L${b.x} ${COL.top + 20} C${b.x} ${COL.top + 6} ${b.x + 6} ${COL.top + 6} ${b.x + COL.padX} ${COL.top + 6}` });
  }
  for (const e of path.edges) {
    const a = at.get(e.from), b = at.get(e.to); if (!a || !b || a.col >= b.col) continue;
    const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
    edges.push({ from: e.from, to: e.to, kind: 'prereq', d: `M${x1} ${y1} C${x1 + 26} ${y1} ${x2 - 26} ${y2} ${x2} ${y2}` });
  }
  const width = columns[columns.length - 1].x + COL.w + 8;
  return { width, height, columns, nodes, diamonds, edges };
}
```

Tests: five milestones give five columns 236 px apart; a node's `y` follows its row; a prerequisite edge pointing backwards (to an earlier column) is dropped; `exists=false` nodes are flagged; width/height are finite and positive for a 1-milestone path.

- [ ] **Step 2: Progress logic** `src/lib/paths.ts`, tested: `pathProgress(path, progress)` → `{ done: number; total: number; milestone: number; states: Record<topicId, 'done'|'cur'|'lock'|'open'>; checkpoints: Record<milestoneId, 'passed'|'open'|'locked'> }` implementing spec §2.4 (done = `completedAt`; the first milestone whose checkpoint is not passed is current; later milestones locked; the first not-done topic in the current milestone is `cur`); `nextStep(path, progress)` → `{ kind: 'topic'|'checkpoint'; id }`; `weeksLeft(minutesLeft, plan)` = `ceil(minutesLeft / (plan * 7))`; minutes come from topic reading time at Standard depth (`src/lib/reading-time.ts`) × 1.5 for exercises.

- [ ] **Step 3: PathMap.astro** renders the SVG from `layoutPath` (classes `.node`, `.node.soon` dashed for missing topics, `.edge`, `.edge.flow`, `.mile`, `.mtitle`, diamonds); nodes that exist are `<a>` inside `<svg>` with `href` to the topic; every node carries `data-topic`. `PathState.tsx` (`client:idle`) reads `progress`, computes `pathProgress`, sets `data-state` on nodes and diamonds, fills the header ring (`stroke-dashoffset`), the "Continue" button (`nextStep`), the milestone list states, and the "about N weeks" line from `prefs.plan`; the plan Seg writes `prefs.plan`; opening the page records `progress.paths[id].startedAt` once.

- [ ] **Step 4: Pages.** `/paths/`: cards per path (title, description, level range, hours, tracks glyphs, progress bar filled by a tiny island or by `PathState` in list mode). `/paths/{slug}/` per `Path.dc.html`: header + ring card, legend, map panel (horizontal scroll inside `.panel` under 1200 px), current milestone list (`.item` rows, `.item.cur`), "why this order" paragraph from `path.data.rationale?` (add optional `localized` field to the schema), rail (outcomes, time plan Seg, Export/Share buttons reusing the settings export, Ask-AI card). JSON-LD `courseLd`. Missing topics render as `soon` nodes and rows.

- [ ] **Step 5: e2e** `tests/e2e/paths.spec.ts`: `/paths/` lists `python-from-zero`; the path page renders an `svg` with ≥ 20 `[data-topic]` nodes and 5 diamonds; with seeded progress (`python/closures` completed) the node has `data-state="done"` and the Continue button points at the next existing topic; the plan Seg changes the weeks line; zh page renders the zh title.

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(paths): path index and path page with a build-time SVG map and local progress states"`

---

### Task 8: Interview bank pages

**Files:**
- Create (if absent): `src/schemas/interview.ts` (code below), `src/content/interview/python.yaml` (placeholder bank with 3 items marked `tags: [calibration]`), `src/content.config.ts` entry `interview`
- Create: `src/pages-shared/Interview.astro`, `src/pages/practice/interview/[track].astro`, `src/pages/zh/practice/interview/[track].astro`, `src/pages/practice/interview/[track].md.ts`, `src/components/InterviewQuestion.astro`, `src/islands/InterviewControls.tsx`
- Modify: `src/lib/seo.ts` (`faqPageLd`), `src/i18n/*.ts`, `src/styles/global.css` (`.q`, `.qh`, `.qa`)
- Test: `tests/unit/seo.test.ts` (faqPageLd), `tests/e2e/interview.spec.ts`

**Interfaces:**
- Consumes: `interview` collection; `renderCode` (Task 3); `enqueueCards`, `quizCardId` (Task 1); `buildPrompt` for "grade my answer" and "mock interview".
- Produces: `faqPageLd(items: { question: string; answer: string }[])`; `/practice/interview/{track}/` and its `.md` twin.

- [ ] **Step 1: Schema** (verbatim; skip if the file already exists from the P0 merge):

```ts
import { z } from 'astro/zod';
import { TRACKS } from '@/data/tracks';
import { localized, slug, topicRef } from '@/schemas/localized';
import { difficulty } from '@/schemas/topic';
const trackSlugs = TRACKS.map((t) => t.slug) as [string, ...string[]];
export const interviewItemSchema = z.object({
  id: slug, question: localized, answer: localized, topics: z.array(topicRef).min(1), level: difficulty,
  tags: z.array(z.string()).default([]),
  /** Section heading the question is grouped under, e.g. "Language core". */
  section: localized.optional(),
  /** How often interviewers ask it; shown as a chip. */
  frequency: z.enum(['common', 'occasional', 'rare']).optional(),
});
export const interviewSchema = z.object({ track: z.enum(trackSlugs), items: z.array(interviewItemSchema).min(1) });
export type InterviewItem = z.infer<typeof interviewItemSchema>;
export type Interview = z.infer<typeof interviewSchema>;
```

Collection: `glob({ pattern: '*.yaml', base: './src/content/interview' })` with `interviewSchema`; id = track.

- [ ] **Step 2: InterviewQuestion.astro** = `<details class="q" data-id data-level>` with `<summary class="qh">` (number Tag, question, level/frequency `lbl`, "reveal ▾") and `.qa` body: the answer rendered from Markdown at build time (use `marked`-free path: run the answer through the same `unified` pipeline as topics via `@astrojs/markdown-remark`'s `createMarkdownProcessor` in `src/lib/md.ts`, exported as `renderMarkdown(md)`; cache per build), "read more" topic Tags (links), "Was this clear?" (`ActionRow` Clarity buttons reuse), "Add to flashcards", "Copy Q&A as Markdown", "Ask AI to grade my answer" (preset `feynman` with the question as the section text). `<details>` works without JavaScript.

- [ ] **Step 3: InterviewControls.tsx** (`client:idle`): level filter (hides `.q` by `data-level`), reveal mode Seg (`one`: opening a `details` closes the others; `all`: opens all; pref `interviewReveal`), in-bank substring filter (`input` over `summary` text, debounced 150 ms), shuffle (re-orders `.q` nodes in the DOM), seen tracking (on `toggle` open → `recordQuiz(progress, 'interview/{track}/{id}', 1, 1)`), "Mock interview with your AI" (question list ≤ 6,000 chars → `buildPrompt` preset `quiz`). Rail: section TOC (anchors to section headings), progress (seen of N), "Add all N answers to flashcards", other banks.

- [ ] **Step 4: SEO + twin.** `faqPageLd(items)` → `{ "@type": "FAQPage", mainEntity: [{ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } }] }` with plain-text answers (strip Markdown with `toPlainMarkdown`-adjacent helper `stripMarkdown` in `src/lib/md.ts`). `.md` twin lists Q and A in order with the topic links. Unit-test `faqPageLd` shape and that `stripMarkdown('**a** `b`')` → `a b`.

- [ ] **Step 5: e2e:** page lists the placeholder questions; opening one records `cw:v1:progress.quizzes["interview/python/<id>"]`; in `one` mode opening a second closes the first; the level filter hides rows; JSON-LD `FAQPage` present with N `Question`s; zh page shows zh questions.

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(practice): interview bank pages with reveal controls, FAQPage JSON-LD and a Markdown twin"`

---
### Task 9: Flashcards review page and automatic term cards

**Files:**
- Create: `src/pages-shared/Flashcards.astro`, `src/pages/practice/flashcards/index.astro`, `src/pages/zh/practice/flashcards/index.astro`, `src/islands/Flashcards.tsx`, `src/lib/cards.ts`
- Modify: `src/islands/ReadTracker.tsx` (term cards when a page is finished), `src/islands/PersonalStrip.tsx` (`reviewUrl` already exists; keep), `src/components/ActionRow.astro` ("Add to flashcards" becomes real: adds the page's terms), `src/i18n/*.ts`, `src/styles/global.css` (`.rate`, `.stat`, histogram)
- Test: `tests/unit/cards.test.ts`, `tests/e2e/flashcards.spec.ts`

**Interfaces:**
- Consumes: `rate`, `isDue`, `dueOn`, `previewInterval` (Task 1); `enqueueCards`, `termCardId`, `quizCardId` (Task 1); `/api/glossary.json` (P1) and `/api/quizzes/{track}/{slug}.json` (Task 2) for card faces; `cardSources(prefs)`.
- Produces: `cards.ts`: `visibleDeck(deck, prefs, now)`, `faceOf(card, glossary, banks)`, `parseRef(ref)`.

- [ ] **Step 1: cards.ts**, pure and tested: `parseRef('glossary:closure')` → `{ kind: 'term', term: 'closure' }`; `parseRef('quiz:python/closures#predict-loop-binding:14')` → `{ kind: 'quiz', bank, item, line? }`; `visibleDeck` filters by `cardSources` and `suspended`, sorts due-first then by `due`; `faceOf` builds `{ front: { title, alt, cue }, back: { text, textZh?, code?, links[] } }` from the glossary JSON (`en`, `zh`, `short`) or the bank JSON (the answer-free bank gives prompt + code; the explanation and correct option come from the island's second fetch of the same bank **with** answers: add `?full=1`? No — static files cannot branch. Instead Task 2's endpoint emits a sibling `/api/quizzes/{track}/{slug}.answers.json` that the flashcards page fetches on demand; the practice pages never link it, so answers stay out of the skim path).

- [ ] **Step 2: Flashcards.tsx** per mockup: header counts (due today, done this session, streak from `progress` days with any quiz), Seg (Due · All · Terms · Missed quiz), Shuffle; the card (`.panel` with header row, `front` block, `back` block hidden until flip); rating row of four `.rate` buttons with the interval preview (`previewInterval`) and `kbd` 1–4; keyboard `space` flip, `1–4` rate, `e` opens the source link, `x` suspends; rail: deck stats, seven-day histogram from `dueOn`, source toggles writing `prefs.cardSources`, Export/Import (link to `/settings/`), Ask-AI card. Writes go through `writeStore(KEYS.flashcards)` after each rating; `flushStore` on `pagehide`. Empty state: "No cards yet — finish a topic or miss a quiz item." with links.

- [ ] **Step 3: Automatic term cards.** In `ReadTracker.tsx`, when `readPct` first reaches ≥ 90 and `prefs.cardSources.terms !== false`, call `enqueueCards(deck, terms.map(t => ({ id: termCardId(t), kind: 'term', ref: termCardId(t), source: 'terms' })))` where `terms` comes from a new `data-terms="a,b,c"` attribute the topic page already has for the `Terms` island (check `Topic.astro`; add if absent), and set `progress.topics[id].termsAdded = true` (add the optional field to `TopicProgress`) so it happens once. `ActionRow`'s "Add to flashcards" does the same on click with `source: 'manual'` and confirms inline.

- [ ] **Step 4: e2e:** seeded deck of 3 cards (2 due) → header says 2 due, the first card shows its front; `space` flips; `3` rates Good and advances; after both, the empty-for-today state appears and `cw:v1:flashcards` shows updated `due`/`interval`; reading `/python/closures/` to the end (scroll) adds ≥ 1 `term` card once (reload does not duplicate).

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(practice): flashcards review with SM-2-lite and automatic term cards"`

---

### Task 10: Cheatsheets

**Files:**
- Create: `src/schemas/cheatsheet.ts`, `src/content/cheatsheets/python.en.mdx`, `src/content/cheatsheets/python.zh.mdx` (placeholder content: 3 sections × 3 rows, `status: draft`, replaced by Codex in Task 17), `src/components/Sheet.astro`, `src/components/Row.astro`, `src/pages-shared/Cheatsheets.astro`, `src/pages-shared/Cheatsheet.astro`, `src/pages/cheatsheets/index.astro`, `src/pages/cheatsheets/[slug].astro`, `src/pages/cheatsheets/[slug].md.ts`, `src/pages/zh/cheatsheets/index.astro`, `src/pages/zh/cheatsheets/[slug].astro`, `src/pages/api/cheatsheets.json.ts`, `src/styles/print.css`
- Modify: `src/content.config.ts`, `src/components/mdx.ts` (register `Sheet`, `Row`), `src/lib/markdown-twin.ts` (render `<Row>` as `- \`code\` — note`), `src/lib/llms.ts` (list cheatsheets), `src/i18n/*.ts`, `src/styles/global.css` (`.cheat`, `.cr`, `.snip`, `.vocab`)
- Test: `tests/unit/schemas.test.ts` (cheatsheet), `tests/unit/markdown-twin.test.ts` (Row), `tests/e2e/cheatsheet.spec.ts`

- [ ] **Step 1: Schema** `cheatsheetSchema = z.object({ title, description (≤ 160), track: slug.optional(), terms: z.array(slug).default([]), verified: { version, date }, reviewed: z.coerce.date().nullable(), status: z.enum(['draft','reviewed']), aligned: z.boolean().default(false) })`; collection `cheatsheets` with `glob({ pattern: '**/*.{en,zh}.mdx', base: './src/content/cheatsheets', generateId })` mirroring topics' id scheme (`python` + lang). Only `status: reviewed` sheets are public (same `isPublic` rule as topics; the placeholder is `draft` so it renders only in dev — the index page must handle zero public sheets with an empty state).

- [ ] **Step 2: Components.** `<Sheet title="Basics">` renders `.panel.cheat` with `h3`; `<Row code="x: int = 5">annotation is a hint, not a check</Row>` renders `.cr` with `.snip` (escaped, `white-space: pre`) and `.nt` (slot), plus a `?` button `.row-ask` carrying `data-ask="{code} — {note}"` that the `AskAI` island (P1) reads to prefill the `explain` preset (extend `AskAI.tsx` to accept a `cw:ask` CustomEvent with `{ text }`).

- [ ] **Step 3: Pages.** `/cheatsheets/`: grid of public sheets (title, description, track glyph, verified chip). `/cheatsheets/{slug}/` per mockup: header with breadcrumb, h1, lead, chips, action row (Print → `window.print()`, Copy as Markdown → the twin text, Download `.md` → link to the twin, Ask AI about a row), the `Sheet` grid (`repeat(3, minmax(0,1fr))`, one column ≤ 767 px), the "Say it precisely to your AI" `.vocab` panel from `terms` (glossary en/zh), the rules-pack card (links to Task 14's endpoints; until Task 14 lands, the card is rendered only when `P2_RULES` in `site.ts` is true), "also for {track}" links. `.md` twin via `toPlainMarkdown`. JSON `/api/cheatsheets.json` = `[{ id, title, url, md, rows: [{ section, code, note }] }]` by walking the MDX AST (reuse the twin's parser).

- [ ] **Step 4: print.css** imported by `Cheatsheet.astro` only, `@media print`: hide nav/footer/actions, two columns (`column-count: 2`), 9.5 pt mono for `.snip`, `.cr { break-inside: avoid }`, links printed as footnotes (`a[href]::after { content: " (" attr(href) ")" }` for external only), page margins 12 mm.

- [ ] **Step 5: e2e:** the sheet page has ≥ 3 `.cheat` panels and ≥ 9 `.cr` rows; `page.emulateMedia({ media: 'print' })` hides `nav`; the `.md` twin contains a `- \`x: int = 5\`` line; the `?` button opens the Ask-AI panel prefilled with the row text.

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(cheatsheets): cheatsheet collection, Sheet/Row components, print stylesheet and twins"`

---

### Task 11: Turn the P2 navigation on, settings rows, continue strip

**Files:**
- Modify: `src/data/site.ts` (`P2_NAV = true`), `src/components/Nav.astro` (Practice → `/practice/`, Paths → `/paths/`, Cheatsheets → `/cheatsheets/`; Compare and Playground stay behind `P3_NAV`/`P2B_NAV = false` constants until Tasks 13 and P3), `src/pages-shared/TrackHub.astro` (path card "See the whole map" → `/paths/{slug}/`; "also in this track" rows link when the target exists), `src/pages-shared/Home.astro` ("Start a path" → `/paths/`), `src/pages-shared/Settings.astro` (rows: default bilingual mode (still disabled until Task 12), interview reveal mode, flashcard sources, "Reset practice data" separate from "Clear all"), `src/islands/PersonalStrip.tsx` (kata today from `/api/practice.json` via `kataOfTheDay` at build: pass the item as a prop instead), `scripts/check-dist-links.mjs` (drop `/practice/`, `/paths/`, `/cheatsheets/` from `KNOWN_LATER`), `src/i18n/*.ts`
- Test: `tests/e2e/home.spec.ts` (nav shows Practice/Paths/Cheatsheets), `tests/e2e/settings.spec.ts` (new rows persist), `pnpm check:links`

- [ ] **Step 1:** Flip the flags, route the links, keep Compare and Playground hidden.
- [ ] **Step 2:** Settings rows write `prefs.interviewReveal`, `prefs.cardSources`; "Reset practice data" clears `progress.quizzes`, `progress.paths` and `flashcards` after a confirm, leaving `topics` and `prefs`.
- [ ] **Step 3:** `pnpm build && pnpm check:links && pnpm test:e2e` (full suite) → all green; fix any failure at the source.
- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(nav): expose practice, paths and cheatsheets; practice settings; continue strip data"`

**P2a ends here.** The controller merges `p2-learning-layer` into `main` after a whole-branch review (Tasks 1–11), so content work (Task 17) can start against the merged schemas while P2b continues on the same branch.

---

### Task 12: Bilingual mode

**Files:**
- Create: `src/markdown/rehype-block-ids.ts`, `src/lib/bilingual.ts`, `src/islands/Bilingual.tsx`
- Modify: `astro.config.mjs` (add `rehypeBlockIds` after `rehypeDepthHeadings`), `src/pages-shared/Topic.astro` (enable the toggle when `aligned`, pass the alternate URL and mode labels, mount `Bilingual` `client:idle` only when aligned), `src/styles/global.css` (`.bi` block styles, `.bi-layout-side` grid ≥ 1440 px), `src/i18n/*.ts`, `src/pages-shared/Settings.astro` (bilingual default enabled)
- Test: `tests/unit/bilingual.test.ts`, `tests/unit/markdown.test.ts` (block ids), `tests/e2e/bilingual.spec.ts`

**Interfaces:**
- Produces: `data-bi="{section}:{n}"` on every block-level element under a heading in topic HTML; `pairBlocks(mine: Element[], theirs: Element[])`; `Bilingual` island contract `#article[data-bilingual="off|en-zh|zh-en"]`.

- [ ] **Step 1: rehype-block-ids.ts.** Walk the article HTML: for each `h2`/`h3` (which already carry ids from `rehypeHeadingIds`), number the following block-level siblings (`p`, `pre`/`figure.codebox`, `ul`, `ol`, `blockquote`/`.callout`, `table`, the TL;DR cells `.tldr-cell p`) as `{headingId}:{n}` until the next heading; the lead paragraph before the first heading uses `intro:{n}`. Set `data-bi`. Unit test with a small HTML fixture: ids are unique, restart per heading, and code blocks get an id (they are paired but not duplicated).

- [ ] **Step 2: bilingual.ts** (pure, DOM-free where possible): `pairBlocks(mineIds: string[], theirs: Map<string, string>)` → `{ pairs: [id, html][]; missing: string[] }`; `shouldClone(id, tag)` → false for code blocks (shared) and headings; `layoutFor(width, pref)` → `'paired' | 'side'` (side only when `width >= 1440 && pref === 'side'`). Tests cover all three.

- [ ] **Step 3: Bilingual.tsx.** On first switch to a non-`off` mode: `fetch(alternateUrl)` (same origin, static), `DOMParser`, collect `[data-bi]` → map id → outerHTML; for each local block with a pair insert a clone after it (`.bi`, `lang="zh-Hans"` or `en`, `data-bi-clone`); for headings insert a `.bi-h` subtitle; for code blocks do nothing; the TOC island gets a `cw:bilingual` event to show subtitles (Toc.tsx reads `data-bi-h` on headings). `zh-en` swaps the order (the clone goes *before* and the original takes `.bi`). `off` removes clones. Layout `side` (≥ 1440 px, pref) wraps pairs in a two-column grid. The per-section vocabulary strip: glossary `Term` links inside the section (`a.term[data-term]`) in both trees → `.vocab` row after the heading. Pref persistence via `prefs.bilingual`; the topic control Seg reflects the mode; `Settings` row enabled.

- [ ] **Step 4: e2e:** on `/python/closures/` (aligned) choosing "EN + 中文" inserts N clones where N equals the number of `[data-bi]` paragraphs on `/zh/python/closures/` minus code blocks (compute in the test by fetching both pages); the first clone is `lang="zh-Hans"`; "中文 + EN" puts the zh block first; `off` removes all clones; reload keeps the mode; the non-aligned topic keeps the disabled control.

- [ ] **Step 5: Budget:** the island is `client:idle` and small (< 6 kB gz); confirm the topic page budget still passes (`lhci`).

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(topic): bilingual mode pairing aligned blocks from the other locale's page"`

---

### Task 13: Playground

**Files:**
- Create: `src/pages-shared/Playground.astro`, `src/pages/playground/index.astro`, `src/pages/zh/playground/index.astro`, `src/islands/Playground.tsx`, `src/islands/editor.ts` (lazy CodeMirror loader), `src/lib/lz.ts`, `src/lib/runners/sql.ts`, `src/lib/runners/html.ts`, `src/lib/kata-tests.ts`, `src/pages/api/examples.json.ts`, `scripts/vendor-sqljs.mjs`
- Modify: `src/lib/runners/protocol.ts` (`RUN_LANGS` gains `'sql' | 'html'`), `package.json` (deps + `prebuild` chain: `node scripts/vendor-pyodide.mjs && node scripts/vendor-sqljs.mjs`), `src/data/site.ts` (`P2B_NAV = true` for Playground), `scripts/check-dist-links.mjs` (drop `/playground/`), `src/i18n/*.ts`, `src/styles/global.css`, `lighthouserc.json` (add `/playground/` with `resource-summary:script:size <= 307200`)
- Test: `tests/unit/lz.test.ts`, `tests/unit/kata-tests.test.ts`, `tests/unit/runners.test.ts` (sql/html normalisation), `tests/e2e/playground.spec.ts`

- [ ] **Step 1: lz.ts:** `encodeState({ lang, code, tests? })` → `compressToEncodedURIComponent(JSON)`; `decodeState(str)` → the object or `null` (bad input never throws). Round-trip test with CJK and emoji; `decodeState('%%%')` → `null`.

- [ ] **Step 2: Runners.** `sql.ts`: loads `/vendor/sql.js/sql-wasm.js` + `.wasm` (vendored by `scripts/vendor-sqljs.mjs` from `node_modules/sql.js/dist`, same pattern as `vendor-pyodide.mjs`), runs an optional `seed` then the user SQL, emits result rows as an aligned text table on `stdout`, errors on `stderr`. `html.ts`: renders HTML/CSS in a sandboxed `srcdoc` iframe (`sandbox="allow-scripts"`), emits `done`. Both follow `RunRequest`/`RunEvent` from `protocol.ts` so `CodeRunners` (P1) can use them for `sql run` and `html run` fences too (register the languages in `normalizeLang`).

- [ ] **Step 3: kata-tests.ts:** `wrapWithTests(lang, code, tests)` → the program to run: Python appends the assertions after the code and a final `print("ALL TESTS PASSED")`; JS/TS defines `function assert(c, m){ if(!c) throw new Error("assertion failed: " + (m ?? "")) }` before, appends tests and the same final log; SQL compares the last result set with `tests` parsed as CSV rows. `parseTestResult(events)` → `{ passed: boolean; failures: string[] }`. Unit-test each language.

- [ ] **Step 4: editor.ts:** `mountEditor(textarea, lang, onChange)` dynamically imports `@codemirror/*` (one chunk per language), builds `EditorView` with a theme made from tokens (`EditorView.theme({ '&': { backgroundColor: 'var(--code-bg)', color: 'var(--code-ink)' }, … })`), and syncs the textarea (`form` semantics stay). Until it resolves the textarea is live.

- [ ] **Step 5: Playground.tsx** per `Playground.dc.html`: language tabs, example loader (`/api/examples.json` = every `run` fence in public topics: `{ id, lang, title, code, tests?, topic: { title, url } }`, built by scanning topic bodies with the same fence regex `Topic.astro` uses for `hasRunnable`), Reset/Copy/Share (`history.replaceState` with `?lang&code`), Run (reuses runner selection), output tabs (Output / Tests / Variables — Variables lists Python globals via a post-run `dir()` snapshot, JS via a `globalThis` diff, disabled for SQL/HTML), kata mode banner when `tests` is present, "Ask AI to fix" (prompt with code + output + error, preset `bugs`), footer runtime line. URL state is read on load; `?example=` selects from the loader.

- [ ] **Step 6: e2e:** `/playground/?lang=python&code=<lz of print(1+1)>` runs and shows `2`; SQL tab runs `SELECT 1 AS x` and shows a table with `x`; HTML tab shows the iframe; Share writes the URL; loading an example fills the editor; kata mode shows the Tests tab and reports pass/fail; the page has no console errors.

- [ ] **Step 7:** `pnpm build && pnpm check:links && pnpm exec lhci autorun` — playground within its 300 kB budget; topic pages unchanged.

- [ ] **Step 8: Commit** `git add -A && git commit -m "feat(playground): editor, SQL and HTML runtimes, kata tests, shareable state"`

---

### Task 14: Prompt builder, rules packs, context packs

**Files:**
- Create: `src/pages-shared/PromptBuilder.astro`, `src/pages/ai/prompt-builder/index.astro`, `src/pages/zh/ai/prompt-builder/index.astro`, `src/islands/PromptBuilder.tsx`, `src/lib/prompt-builder.ts`, `src/lib/rules.ts`, `src/pages/rules/[track]/[file].ts`, `src/pages/packs/[track]/[section].md.ts`
- Modify: `src/lib/prompts.ts` (export the section/preset text builders for reuse), `src/lib/llms.ts` (list rules and packs), `src/pages-shared/TrackHub.astro` (rules-pack card when ≥ 10 rules), `src/pages-shared/Cheatsheet.astro` (`P2_RULES = true`), `src/i18n/*.ts`, `src/styles/global.css` (`.radio`, `.preview`)
- Test: `tests/unit/prompt-builder.test.ts`, `tests/unit/rules.test.ts`, `tests/e2e/prompt-builder.spec.ts`, `tests/e2e/endpoints.spec.ts` (rules/packs)

- [ ] **Step 1: prompt-builder.ts** (pure): `GOALS = ['explain','quiz','review','port','tests','socratic']`; `assemble({ topics: TopicCard[], goal, level, options, code, lang })` → Markdown with the fixed sections `## Role`, `## Context` (level, topic titles and `.md` links when `options.link`), `## Task` (per goal template), `## Checklist first` (when `options.checklist`; from the topics' pitfalls), `## Output`, `## Code` (fenced, when present), plus `Answer in Simplified Chinese; keep identifiers in English.` when `options.zh`; `estimateTokens(text) = ceil(chars / 4)`; truncation rule: if the encoded prompt exceeds `QUERY_LIMIT`, drop the code first with a `[code truncated]` line. Tests: every goal yields all sections; the `.md` link appears only with `options.link`; truncation keeps the prompt under the limit.

- [ ] **Step 2: rules.ts** (pure, build-time): `extractRules(mdxSource, topic)` → `Rule[]` from `> [!PITFALL]` callouts (reuse `remark-callouts`'s `MARKER` by importing the exported constant; parse the source with the same `unified` pipeline used in `markdown-twin.ts`) and from the "In the AI era" section's checklist bullets; each rule = `{ text: imperative first sentence (≤ 160 chars), why: rest, topic: { title, url } }`. `renderClaudeMd(track, rules)`, `renderAgentsMd`, `renderCursorMdc` (frontmatter `description`, `globs` by track: python → `**/*.py`, javascript/typescript → `**/*.{js,ts,jsx,tsx}`, others `**/*`). Tests on a fixture MDX with two pitfalls and one checklist.

- [ ] **Step 3: Endpoints.** `/rules/{track}/CLAUDE.md`, `/rules/{track}/AGENTS.md`, `/rules/{track}/cursor.mdc` (`getStaticPaths` over tracks with ≥ 1 rule; `text()` response), `/packs/{track}/{section}.md` (concatenated twins of reviewed topics in the section; header with the list and canonical URLs; split into `-1.md`, `-2.md` above 1 MB — implement `splitPack(parts, limit)` and test it). `llms.txt` gains "## Rules packs" and "## Context packs" sections.

- [ ] **Step 4: Page + island** per mockup `PromptBuilder.dc.html`: steps 1–5 on the left (topic search over `/api/topics.json` with chips, goal `.radio` cards, level Seg, option checkboxes, code textarea), sticky preview on the right (`.preview`, updates on every change, token estimate), Open in Claude / Open in ChatGPT / Copy (`deepLinks`), "why this prompt works" panel, rules-pack card for the first chosen topic's track. `?topic=python/closures&goal=review` preselects. Pitfalls per topic come from `/api/topics/{track}/{slug}.json` (P1 concept card; add `pitfalls: string[]` there via `extractRules`).

- [ ] **Step 5: e2e:** the page preselects from the query, the preview contains `## Checklist first` and the `.md` link, unticking "Link the codewiki Markdown" removes the link, Copy puts the prompt on the clipboard (grant permission), `/rules/python/CLAUDE.md` returns 200 text starting with `# Python rules` and ≥ 1 rule line, `/packs/python/functions-deeper.md` contains the closures twin.

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(ai-era): prompt builder page, rules packs and context packs"`

---

### Task 15: Block-level Ask-AI presets and "try to break it" nudges

**Files:**
- Modify: `src/markdown/rehype-section-actions.ts` (also emit an `.ask-block` button after every `.codebox` with `data-preset="explain-code|port|tests"` menu and after every `.callout[data-type=pitfall]` with `data-preset="check-pitfall"`), `src/islands/AskAI.tsx` (handle the new presets: code explain line by line, port to {language} with a language picker of the 11 tracks, write tests; pitfall: "check my code for this pitfall" with a code textarea), `src/lib/prompts.ts` (add the four presets to `PRESETS` and their templates), `src/components/mdx.ts` + create `src/components/TryToBreak.astro` (`<TryToBreak items={['empty list', 'negative n']} />` renders a `.nudge` list under a runnable example with "Try it" links that load the example into the playground with the edge case appended as a comment), `prompts/editorial-standard.md` (document `<TryToBreak>` — one paragraph; Codex uses it from the next wave), `src/i18n/*.ts`
- Test: `tests/unit/prompts.test.ts` (new presets), `tests/unit/markdown.test.ts` (block actions emitted), `tests/e2e/topic.spec.ts` (a code block's Ask button opens the panel with the code preset)

- [ ] **Step 1:** presets + templates (English; the prompt's own language follows the page locale as P1 does).
- [ ] **Step 2:** rehype additions with tests; the buttons are plain `<button>`s hydrated by the existing `AskAI` island through event delegation, so topic pages gain no new island.
- [ ] **Step 3:** `TryToBreak` component + standard note; add one to `python/closures.en.mdx` and `.zh.mdx` (aligned) as the reference usage.
- [ ] **Step 4:** e2e + budget check.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(ai-era): block-level Ask-AI presets and try-to-break nudges"`

---

### Task 16: P2 quality gates — e2e, a11y, budgets, CI, docs

**Files:**
- Modify: `lighthouserc.json` (urls: `/practice/`, `/paths/python-from-zero/`, `/practice/flashcards/`, `/cheatsheets/python/`, `/playground/`, `/ai/prompt-builder/`; budgets ≥ 0.95 all categories; script budgets 100 kB for practice/paths/flashcards/cheatsheet/prompt-builder, 300 kB playground), `tests/e2e/a11y.spec.ts` (axe on every new page type, both themes, fail on serious/critical), `.github/workflows/ci.yml` (no change unless new vendor step: add `vendor:sqljs` via `prebuild`), `docs/dev/learning-layer.md` (create: storage schema, island contracts, how to add a quiz bank / path / cheatsheet, how the bilingual pairing works), `README.md` (feature list)
- Test: the whole suite

- [ ] **Step 1:** `pnpm lint && pnpm check && pnpm test && pnpm build && pnpm check:links && pnpm test:e2e && pnpm exec lhci autorun` — fix failures at the source; record per-URL scores in the report.
- [ ] **Step 2:** docs.
- [ ] **Step 3: Commit** `git add -A && git commit -m "test(learn): a11y and Lighthouse gates for the learning layer; developer docs"`

---

### Task 17: Content prompts and runners for the learning layer (code only; Codex runs them)

**Files:**
- Create: `prompts/write-quiz-bank.md`, `prompts/write-review-kata.md`, `prompts/write-interview-bank.md`, `prompts/write-path.md`, `prompts/write-cheatsheet.md`, `scripts/content/write.sh`, `scripts/content/lib/write-brief.ts`
- Modify: `scripts/content/check.ts` (validate quiz/interview/cheatsheet/path files against the Zod schemas via `tsx` import of `src/schemas/*`; fail on any `tags: [calibration]` placeholder left in a reviewed file), `package.json` (`content:write`)
- Test: `tests/unit/content/write-brief.test.ts`

- [ ] **Step 1: Prompts** (English, each ≤ 120 lines, same shape as `prompts/polish-topic.md`: role, inputs with `{{VARS}}`, the exact YAML/MDX shape with a full example, quality bar, bilingual rule, the `WRITE DONE {id}` / `WRITE FAILED {id}` protocol). Quiz bank: 4–8 items per topic, at least one `predict` and one `spotbug` when the topic has code, distractors that are real misconceptions, explanations ≤ 2 sentences each language. Review kata: 15–25 lines of realistic generated code for a stated `task`, 3–5 issues of distinct kinds with line numbers, `right` and a 3–4 item `checklist`, never attributed to a named model. Interview bank: 30–45 items with `section`, `level`, `frequency`, answers 60–120 words spoken-length, ≥ 1 topic ref each. Path: 18–30 topics from the staged inventory (`content/staging`) or live topics, 4–6 milestones, `edges` ≥ 4, outcomes 3, checkpoint banks `{track}/checkpoint-{n}` of 8 items written in the same run. Cheatsheet: 9–12 `Sheet`s × 5–7 `Row`s, rows verified against the pinned version, `terms` ≥ 6, both languages aligned row for row.

- [ ] **Step 2: Runner** `scripts/content/write.sh --kind quiz|kata|interview|path|cheatsheet --id <id> [--n 4] [--dry-run]` reusing `polish.sh`'s structure (Codex via stdin, `timeout`, gate = `pnpm content:check --kind …`, journal via `mark.ts` with a `write:{kind}:{id}` key, batch commits of exactly the produced files). `write-brief.ts` renders the prompt with `renderBrief` (P0 Task 11) and the kind-specific variables (topic pair paths, track sections, glossary ids, staged inventory excerpt for paths).

- [ ] **Step 3:** dry run for each kind exits 0 with no side effects; `content:check` rejects a bank with two correct options and a kata whose issue line exceeds the code length.

- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(content): prompts and runner for quiz banks, katas, interview banks, paths and cheatsheets"`

The controller then runs, via Codex: quiz banks for the tier-1 topics that lack one, 30 review katas, 8 interview banks, 6 paths, 12 cheatsheets, and the `translate-ui` pass over the `//P2` placeholders; results land in `src/content/**` and `src/i18n/zh.ts` through the runner's commits.

---

## Self-review notes (Fable, 2026-09-04)

- Spec coverage: §2.1 → Task 6; §2.2 → Tasks 3, 4; §2.3 → Task 5; §2.4 → Task 7; §2.5 → Task 8; §2.6 → Tasks 1, 9; §2.7 → Task 10; §2.8 → Task 12; §2.9 → Task 13; §2.10 → Task 14; §2.11 → Task 14; §2.12 → Tasks 6, 9, 11; §3 → Tasks 1, 2, 8, 10; §4 → every island named appears in a task; §5 → Task 17 prompts, runs by the controller; §6 → tests inside each task plus Task 16; §7 decisions: four ratings (Task 9), two-column print (Task 10), paired default + side ≥ 1440 (Task 12), line comments (Task 3), CodeMirror lazy + textarea (Task 13).
- Type consistency: `Rating`, `rate`, `isDue`, `dueOn`, `previewInterval` (Task 1) are used by Task 9; `recordQuiz`, `passed`, `completeTopic`, `enqueueCards`, `quizCardId`, `termCardId` (Task 1) by Tasks 3, 5, 8, 9; `listPracticeItems`, `practiceUrl`, `kataOfTheDay`, `ITEM_TYPES` (Task 2) by Tasks 4, 6, 11; `renderCode` (Task 3) by 4, 5, 8, 13; `layoutPath`, `pathProgress`, `nextStep`, `weeksLeft` (Task 7) inside Task 7 only; `faqPageLd` (Task 8) inside Task 8; `encodeState`/`decodeState` (Task 13) by Task 4's playground link (it uses `compressToEncodedURIComponent` directly, which is what `encodeState` wraps — same encoding); `extractRules` (Task 14) by the P1 concept card in Task 14.
- Placeholder scan: the only intentionally provisional content is the calibration quiz/interview/cheatsheet placeholders, each marked `tags: [calibration]` or `status: draft` and rejected by `content:check` in reviewed files (Task 17).
- Known dependency on P0: `src/schemas/interview.ts` and `content:check` exist on `p0-content-pipeline`; Task 8 carries the schema verbatim and Task 17 extends whichever `check.ts` is on `main` at the time.
