# P0 Content Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the resumable pipeline that turns the 925 old article pairs into reviewed, bilingual, aligned codewiki topics: inventory → taxonomy mapping → import into staging → linters → tiering → Codex polish + translation → alignment check → sidecar extraction → publish, with every step idempotent and its state on disk.

**Architecture:** TypeScript scripts under `scripts/content/` run with `tsx`, sharing small pure libraries that are unit-tested with Vitest. Raw imports land in `content/staging/` (never built by Astro). Codex writes finished topics into `src/content/topics/` and sidecars into `src/content/{quizzes,interview}` and `content/glossary-proposals/`. A shell runner drives `codex exec` per topic with a JSON state file so interrupted runs resume.

**Tech Stack:** Node 24, tsx, gray-matter, yaml, unified/remark-parse (for heading and block extraction), esbuild (code syntax check for JS/TS), python3 (`ast.parse` for Python), Vitest 5, Codex CLI 0.153 (`gpt-5.6-sol`, reasoning `xhigh`).

**Spec:** `docs/superpowers/specs/2026-09-03-codewiki-design.md` §10 (pipeline), §4 (schemas), §14.1 (taxonomy). Standard and briefs: `prompts/editorial-standard.md`, `prompts/polish-topic.md`, `prompts/translate-topic.md`. Depends on P1 Task 5 (`src/data/tracks.ts`) and Task 6 (schemas); run P1 Tasks 1, 5 and 6 first if they are not done.

## Global Constraints

- Source corpus: `/home/chen/githubprojects/codewiki/old/src/content/docs/**/{slug}.{en,zh}.md` (925 pairs). Never modify the old corpus.
- Staging directory `content/staging/topics/{track}/{slug}.{en,zh}.md` is git-tracked; `src/content/topics/` receives only polished files.
- Every script is idempotent: re-running with the same inputs produces the same outputs and skips work recorded as done in `reports/polish/state.json`.
- Codex invocation (exact): `codex exec --dangerously-bypass-approvals-and-sandbox -m gpt-5.6-sol -c model_reasoning_effort=xhigh -C /home/chen/githubprojects/codewiki/codewiki "<prompt text>"`.
- Parallelism: at most 4 Codex runs at once. Commit after every 10 finished topics (`content: polish batch …`).
- All scripts, comments and reports in English. Reports are JSON under `reports/` (git-ignored except `reports/polish/state.json` and `reports/README.md`).
- Do not publish anything (`status: reviewed`) that failed `content:check`.

---

## File structure

```
scripts/content/lib/frontmatter.ts     parse/serialize frontmatter (gray-matter), normalise keys
scripts/content/lib/paths.ts           OLD_ROOT, STAGING_ROOT, TOPICS_ROOT, id helpers, listOldPairs()
scripts/content/lib/markdown.ts        headings(md), blocks(md), fences(md), stripH1(md), cjkRatio(text)
scripts/content/lib/divergence.ts      headingSimilarity(en, zh), lengthRatio, divergenceScore
scripts/content/lib/zh-typography.ts   findZhIssues(text), fixZhTypography(text)
scripts/content/lib/code-check.ts      checkFence({lang, code}) -> {ok, error}
scripts/content/lib/links.ts           extractLinks(md), checkLinks(urls, fetchImpl)
scripts/content/lib/alignment.ts       alignBlocks(en, zh) -> {aligned, mismatches[]}
scripts/content/lib/state.ts           PipelineState load/save/mark/next
scripts/content/lib/mapping.ts         loadMapping(), validateMapping(mapping, tracks)
scripts/content/inventory.ts           -> reports/inventory.json
scripts/content/draft-mapping.ts       writes prompts/draft-mapping.generated.md for a Codex run
scripts/content/mapping.json           (category, subcategory) -> (track, section), plus drop list
scripts/content/import.ts              old -> content/staging (normalised), reports/import.json
scripts/content/lint.ts                zh typography + code + links for a topic id or all; reports/lint/{id}.json
scripts/content/tiers.ts               -> content/tiers.yaml
scripts/content/check.ts               `pnpm content:check {id}`: schema + zh + code + links + alignment on src/content
scripts/content/align.ts               `pnpm content:align {id}`: sets/clears aligned: true
scripts/content/extract.ts             merges glossary proposals into src/content/glossary; validates sidecars
scripts/content/polish.sh              runner: picks next topics from tiers + state, runs codex, updates state, commits
scripts/content/status.ts              prints a table of pipeline progress (used for STATUS.md)
content/staging/                       imported drafts
content/tiers.yaml                     tier assignment per topic id
content/glossary-proposals/            Codex output, merged by extract.ts
reports/README.md, reports/polish/state.json
tests/unit/content/*.test.ts, tests/fixtures/old/**  (small fixture pairs copied from the corpus)
```

---

### Task 1: Script toolchain and shared libraries

**Files:**
- Create: `scripts/content/lib/paths.ts`, `scripts/content/lib/frontmatter.ts`, `scripts/content/lib/markdown.ts`, `reports/README.md`, `tests/fixtures/old/python/closures.en.md`, `tests/fixtures/old/python/closures.zh.md`, `tests/fixtures/old/rust/cargo.en.md`, `tests/fixtures/old/rust/cargo.zh.md`
- Modify: `package.json` (scripts), `.gitignore` (`reports/**` rules already present)
- Test: `tests/unit/content/markdown.test.ts`, `tests/unit/content/frontmatter.test.ts`

**Interfaces:**
- Produces: `OLD_ROOT`, `STAGING_ROOT = 'content/staging/topics'`, `TOPICS_ROOT = 'src/content/topics'`; `listOldPairs(root = OLD_ROOT): Promise<OldPair[]>` with `OldPair = { category: string; slug: string; en: string; zh: string }` (absolute paths); `parseFrontmatter(text) → { data: Record<string, unknown>; body: string }`, `serializeFrontmatter(data, body)`; `headings(md) → { depth: number; text: string }[]` (fenced code ignored), `fences(md) → { lang: string; meta: string; code: string; line: number }[]`, `stripH1(md)`, `cjkRatio(text)` (CJK chars / letters+CJK), `wordCount(md)`.
- Scripts: `"content:inventory": "tsx scripts/content/inventory.ts"`, `content:import`, `content:lint`, `content:tiers`, `content:check`, `content:align`, `content:extract`, `content:status`, `content:polish": "bash scripts/content/polish.sh"`.

- [ ] **Step 1: Copy four fixture files** from the old corpus (the `python/closures` and `rust/cargo` pairs; truncate each to the first 200 lines and append a closing code fence if a fence is open) into `tests/fixtures/old/`.

- [ ] **Step 2: Failing tests**

```ts
// tests/unit/content/markdown.test.ts
import { headings, fences, stripH1, cjkRatio } from '../../../scripts/content/lib/markdown';
describe('markdown helpers', () => {
  const md = '# Title\n\nIntro\n\n## One\n\n```python\n# not a heading\nprint(1)\n```\n\n### Two\n';
  it('lists headings outside fences', () => { expect(headings(md)).toEqual([{ depth: 1, text: 'Title' }, { depth: 2, text: 'One' }, { depth: 3, text: 'Two' }]); });
  it('extracts fences with lang and line', () => { expect(fences(md)).toEqual([{ lang: 'python', meta: '', code: '# not a heading\nprint(1)', line: 7 }]); });
  it('strips the first H1 only', () => { expect(stripH1(md).startsWith('Intro')).toBe(true); });
  it('computes cjk ratio', () => { expect(cjkRatio('闭包 closure')).toBeCloseTo(2 / 9, 2); expect(cjkRatio('abc')).toBe(0); });
});
```
```ts
// tests/unit/content/frontmatter.test.ts
import { parseFrontmatter, serializeFrontmatter } from '../../../scripts/content/lib/frontmatter';
describe('frontmatter', () => {
  it('round-trips and keeps key order', () => {
    const src = '---\ntitle: "A"\ncategory: "Python"\n---\nbody\n';
    const { data, body } = parseFrontmatter(src);
    expect(data).toEqual({ title: 'A', category: 'Python' }); expect(body).toBe('body\n');
    expect(serializeFrontmatter({ title: 'A', tags: ['x'] }, 'body\n')).toBe('---\ntitle: A\ntags:\n  - x\n---\nbody\n');
  });
});
```

- [ ] **Step 3: Run, fail. Step 4: Implement** the three libraries (`headings`/`fences` via a line scanner that tracks fence state; `serializeFrontmatter` via `yaml.stringify` with `lineWidth: 0`). `pnpm add -D gray-matter yaml tsx esbuild`.

- [ ] **Step 5: Run tests (pass). Add `reports/README.md`** describing each report file. Commit `git add -A && git commit -m "chore: content script toolchain and markdown helpers"`.

---

### Task 2: Inventory of the old corpus

**Files:**
- Create: `scripts/content/inventory.ts`, `scripts/content/lib/divergence.ts`
- Test: `tests/unit/content/divergence.test.ts`, `tests/unit/content/inventory.test.ts`

**Interfaces:**
- Produces: `reports/inventory.json` = `{ generatedAt, pairs: InventoryPair[] , categories: Record<string, number>, subcategories: Record<string, number> }` where `InventoryPair = { id: 'python/closures', category, slug, en: FileInfo, zh: FileInfo, divergence: number, issues: string[] }`, `FileInfo = { path, title, subcategory, difficulty, order, lines, words, headings: string[], fenceCount, titleLangMismatch: boolean, bodyLangMismatch: boolean, hasH1 }`; `headingSimilarity(a: string[], b: string[]) → 0..1` (Jaccard over normalised heading text after stripping numbering and translating nothing — compare counts per depth and order; use `1 - |lenA - lenB| / max` blended 50/50 with depth-sequence LCS ratio), `divergenceScore(en, zh) → 0..1` (0 = same article).

- [ ] **Step 1: Failing tests**

```ts
import { headingSimilarity, divergenceScore } from '../../../scripts/content/lib/divergence';
describe('divergence', () => {
  it('identical structures score 0', () => { expect(divergenceScore({ headingDepths: [2, 3, 3, 2], words: 1000 }, { headingDepths: [2, 3, 3, 2], words: 1100 })).toBeLessThan(0.1); });
  it('different structures score high', () => { expect(divergenceScore({ headingDepths: [2, 3, 3, 2], words: 1000 }, { headingDepths: [2, 2, 2, 2, 2, 2, 3, 3, 3], words: 2500 })).toBeGreaterThan(0.5); });
  it('similarity is symmetric', () => { expect(headingSimilarity([2, 3], [2, 3, 3])).toBe(headingSimilarity([2, 3, 3], [2, 3])); });
});
```
`tests/unit/content/inventory.test.ts`: run `buildInventory(fixtureRoot)` on `tests/fixtures/old` and assert two pairs, `python/closures` has `en.titleLangMismatch === false`, and every pair has `divergence` in `[0, 1]`.

- [ ] **Step 2: Run, fail. Step 3: Implement** `divergence.ts` and `inventory.ts` (export `buildInventory(root)`; CLI writes the report and prints a summary line: pairs, mean divergence, count of `titleLangMismatch`, count of `bodyLangMismatch`).

- [ ] **Step 4: Run on the real corpus** `pnpm content:inventory` (expect 925 pairs; keep the summary numbers in the commit message). Commit `git add -A && git commit -m "feat(content): corpus inventory with divergence scores"`.

---

### Task 3: Taxonomy mapping

**Files:**
- Create: `scripts/content/mapping.json`, `scripts/content/lib/mapping.ts`, `scripts/content/draft-mapping.ts`, `prompts/draft-mapping.md`
- Test: `tests/unit/content/mapping.test.ts`

**Interfaces:**
- Produces: `mapping.json` = `{ categories: Record<OldCategory, Track>, subcategories: Record<'${OldCategory}::${OldSubcategory}', { track: string; section: string }>, overrides: Record<TopicId, { track: string; section: string }>, drop: Record<TopicId, string /* reason */> }`; `resolveMapping(pair: InventoryPair, mapping) → { track, section } | { drop: reason }` (order: `drop` → `overrides` → `subcategories` → `categories` with section `'unsorted'`); `validateMapping(mapping, TRACKS)` throws listing unknown tracks/sections; `unmappedSubcategories(inventory, mapping)`.

- [ ] **Step 1: Failing tests** for `resolveMapping` precedence and `validateMapping` (unknown section rejected).

- [ ] **Step 2: Run, fail. Step 3: Implement `mapping.ts`** and `draft-mapping.ts`, which renders `prompts/draft-mapping.md` (a Codex brief) with the full list of `(category, subcategory, count, three sample titles)` from the inventory and the target sections from `src/data/tracks.ts`, asking Codex to output the complete `subcategories` map as JSON plus a `drop` list for the duplicates named in the audit (`security/web-security` vs `web-security-fundamentals`, `ai/rag` vs `ai/rag-retrieval-augmented-generation`, `ai/deep-learning` vs `deep-learning-basics`, `platform-engineering` in two categories) and any slug whose title shows it is off-topic for every track.

- [ ] **Step 4: Run Codex once** with the generated brief (`codex exec … "$(cat prompts/draft-mapping.generated.md)"`), save its JSON to `scripts/content/mapping.json`, then hand-review the `drop` list and every `unsorted` assignment (Fable reviews: send the list back to the orchestrator). `validateMapping` must pass; `unmappedSubcategories` must be empty.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(content): taxonomy mapping from old categories to tracks and sections"`.

---

### Task 4: Import into staging

**Files:**
- Create: `scripts/content/import.ts`
- Test: `tests/unit/content/import.test.ts`

**Interfaces:**
- Produces: `content/staging/topics/{track}/{slug}.{en,zh}.md` with normalised frontmatter (`title` in the file's language — if the en title contains CJK and the zh title is Latin, swap them; if both are wrong, keep and add `issue: title-language`), `description`, `track`, `section`, `difficulty` (lowercased, `expert → advanced`), `tags`, `status: imported`, `origin`, `divergence`, `issues: string[]`; body with the H1 stripped and nothing else changed. `reports/import.json` = counts per track/section, issues histogram, dropped list. `importPair(pair, mapping) → { en: StagedFile; zh: StagedFile } | { dropped: reason }` pure and tested.

- [ ] **Step 1: Failing tests** on the fixtures: title swap when mismatched (construct an in-memory pair with swapped titles), difficulty normalisation, `origin` set, H1 stripped, `status: imported`, dropped pair returns reason.

- [ ] **Step 2: Run, fail. Step 3: Implement.** CLI: `pnpm content:import [--only python/closures] [--dry-run]`; idempotent (overwrites staging files; never touches `src/content`).

- [ ] **Step 4: Run on the corpus**, verify `content/staging/topics` has 2 × (925 − dropped) files and `reports/import.json` totals match. Commit `git add -A && git commit -m "feat(content): import old corpus into staging with normalised frontmatter"` (this commit is large; that is expected).

---

### Task 5: Chinese typography linter

**Files:**
- Create: `scripts/content/lib/zh-typography.ts`
- Test: `tests/unit/content/zh-typography.test.ts`

**Interfaces:**
- Produces: `findZhIssues(text) → Issue[]` with `Issue = { line: number; col: number; rule: 'spacing' | 'punct' | 'quotes' | 'ellipsis'; message: string; fix?: string }`; `fixZhTypography(text) → string` applies safe fixes: insert a space between CJK and Latin/digits (not inside code spans or fences, not around full-width punctuation), replace ASCII `,` `.` `?` `!` `:` `;` `(` `)` directly following CJK with full-width forms (not inside code, URLs or inline code), replace ASCII straight quotes around CJK with `“ ”`, replace `...` after CJK with `……`.

- [ ] **Step 1: Failing tests**

```ts
import { findZhIssues, fixZhTypography } from '../../../scripts/content/lib/zh-typography';
describe('zh typography', () => {
  it('adds spacing between CJK and latin', () => { expect(fixZhTypography('Laravel是目前最流行的PHP框架')).toBe('Laravel 是目前最流行的 PHP 框架'); });
  it('converts ascii punctuation after CJK', () => { expect(fixZhTypography('安全,无需垃圾回收器.')).toBe('安全，无需垃圾回收器。'); });
  it('leaves code alone', () => { const s = '调用 `foo(a,b)` 即可，如下：\n```py\nprint("a,b")\n```\n'; expect(fixZhTypography(s)).toBe(s); });
  it('reports issues with positions', () => { expect(findZhIssues('第2行,有问题')[0]).toMatchObject({ line: 1, rule: 'spacing' }); });
  it('keeps urls and english sentences', () => { expect(fixZhTypography('见 https://a.b/c?d=1,2 和 Hello, world.')).toBe('见 https://a.b/c?d=1,2 和 Hello, world.'); });
});
```

- [ ] **Step 2: Run, fail. Step 3: Implement** with a tokenizer that masks fences, inline code and URLs before applying regex rules, then unmasks.

- [ ] **Step 4: Run tests (pass); commit** `git commit -am "feat(content): Chinese typography linter and fixer"`.

---

### Task 6: Code syntax checker

**Files:**
- Create: `scripts/content/lib/code-check.ts`, `scripts/content/lib/py-check.py`
- Test: `tests/unit/content/code-check.test.ts`

**Interfaces:**
- Produces: `checkFence({ lang, code }) → Promise<{ ok: boolean; error?: string; skipped?: boolean }>`; JS/TS/JSX/TSX via `esbuild.transform` (`loader` by lang), JSON via `JSON.parse`, YAML via `yaml.parse`, Python via `python3 scripts/content/lib/py-check.py` (reads stdin, `ast.parse`, prints `OK` or the SyntaxError line), Go via `gofmt -e` if on PATH else `skipped`, Rust/Java/C++/C#/Swift/Kotlin/PHP `skipped` unless a checker is available (`rustfmt --check`, `javac`, `g++ -fsyntax-only`, `dotnet`, `swiftc -parse`, `php -l`), SQL/bash/text `skipped`. `checkFences(md) → FenceResult[]`. Fences containing `...` or `# ...` placeholders are reported as `error: placeholder`.

- [ ] **Step 1: Failing tests**: valid JS ok; `const = 1` fails; valid Python ok; `def f(:` fails with a line number; `json` with trailing comma fails; `go` returns `skipped` when `gofmt` is absent (mock PATH); placeholder detection.

- [ ] **Step 2: Run, fail. Step 3: Implement.** Commit `git commit -am "feat(content): fenced code syntax checker"`.

---

### Task 7: Link checker

**Files:**
- Create: `scripts/content/lib/links.ts`
- Test: `tests/unit/content/links.test.ts`

**Interfaces:**
- Produces: `extractLinks(md) → { url: string; line: number; text: string }[]` (Markdown links and bare URLs, excluding fences); `checkLinks(urls, { fetchImpl, concurrency = 8, timeoutMs = 10000, cachePath = 'reports/link-cache.json' }) → Map<url, { status: number | 'error'; ok: boolean; checkedAt }>` using HEAD then GET fallback, treating 2xx/3xx as ok, caching results for 7 days; `bookTitles(md) → string[]` (lines matching `《…》`, `_…_` or `*…*` inside a "Further reading"/"延伸阅读" section) reported as `unverified-book`.

- [ ] **Step 1: Failing tests** with a fake `fetchImpl` (200, 404, throws → `'error'`), cache hit avoids refetch, extraction skips fences.

- [ ] **Step 2: Run, fail. Step 3: Implement.** Commit `git commit -am "feat(content): link checker with cache"`.

---

### Task 8: Alignment checker

**Files:**
- Create: `scripts/content/lib/alignment.ts`, `scripts/content/align.ts`
- Test: `tests/unit/content/alignment.test.ts`

**Interfaces:**
- Produces: `blocks(md) → Block[]` with `Block = { kind: 'heading' | 'paragraph' | 'code' | 'list' | 'callout' | 'component' | 'other'; depth?: number; codeHash?: string; itemCount?: number; line: number }` (components = lines starting with `<TLDR`, `<Depth`, `<Checkpoint`, `</`); `alignBlocks(en: Block[], zh: Block[]) → { aligned: boolean; mismatches: { index: number; en?: Block; zh?: Block; reason: string }[] }` requiring: same number of blocks, same kind sequence, same heading depths, identical code hashes (code with comments stripped per language before hashing), same list item counts. `pnpm content:align {id}` reads both files under `src/content/topics`, runs the check, and rewrites `aligned: true|false` in both frontmatters; prints `OK` or the mismatch list.

- [ ] **Step 1: Failing tests**: identical structures align; an extra paragraph in zh reports index and reason; code differing only in comments aligns; code differing in a token does not.

- [ ] **Step 2: Run, fail. Step 3: Implement.** Commit `git commit -am "feat(content): bilingual alignment checker"`.

---

### Task 9: Tiering

**Files:**
- Create: `scripts/content/tiers.ts`, `content/tiers.yaml`
- Test: `tests/unit/content/tiers.test.ts`

**Interfaces:**
- Produces: `assignTier(pair: { id, track, section, difficulty }, tracks) → 1 | 2 | 3` rules: tier 1 = the first two sections of every language track + the first section of every domain track + all `ai-era` and `foundations`; tier 2 = remaining `beginner`/`intermediate`; tier 3 = the rest; `content/tiers.yaml` = `{ generatedAt, tiers: { '1': string[], '2': string[], '3': string[] }, dropped: string[] }` sorted by track then section order then slug. Manual pins: `content/tier-overrides.yaml` (`{ id: tier }`) applied last.

- [ ] **Step 1: Failing tests** for the rules and override precedence. **Step 2–3: implement, run `pnpm content:tiers`** (report the tier sizes in the commit message; expect roughly 150 / 400 / rest). Commit `git add -A && git commit -m "feat(content): tier assignment"`.

---

### Task 10: Check command and pipeline state

**Files:**
- Create: `scripts/content/check.ts`, `scripts/content/lint.ts`, `scripts/content/lib/state.ts`
- Test: `tests/unit/content/state.test.ts`

**Interfaces:**
- Produces: `pnpm content:check {id}` runs on `src/content/topics/{id}.{en,zh}.mdx`: frontmatter against `src/schemas/topic.ts` (import via `tsx` with the `@/` alias configured in `tsconfig`), zh typography (`findZhIssues` on the zh file must be empty), code syntax (`checkFences` no errors), links (`checkLinks` all ok, no `unverified-book`), alignment (`alignBlocks` aligned), quiz sidecar against `src/schemas/quiz.ts` if `quiz` is set, `In the AI era` heading present (en: `## In the AI era`, zh: `## AI 时代`), TL;DR present, length 400–900 lines per file; prints `OK` or a numbered list of failures and exits 1. `pnpm content:lint {id|all}` runs typography/code/links on staging files and writes `reports/lint/{id}.json`. `state.ts`: `loadState()`, `saveState()`, `markStep(id, step, ok, error?)`, `nextTopics(tiers, state, n, step)` returning topics not yet at `step` and not failed 3 times; steps `imported | linted | polished | aligned | extracted | committed`.

- [ ] **Step 1: Failing tests** for `state.ts`: `nextTopics` skips finished and thrice-failed topics; `markStep` records attempts and timestamps; save/load round-trip.

- [ ] **Step 2: Run, fail. Step 3: Implement** all three files. Verify `pnpm content:check python/closures` prints `OK` on the P1 sample topic (fix the sample if the standard's checks fail; the sample is the reference). Commit `git add -A && git commit -m "feat(content): check command, lint command and pipeline state"`.

---

### Task 11: Codex polish runner

**Files:**
- Create: `scripts/content/polish.sh`, `scripts/content/render-brief.ts`
- Test: `tests/unit/content/render-brief.test.ts`

**Interfaces:**
- Produces: `renderBrief(template, vars) → string` replacing `{{VAR}}` placeholders and failing on any unreplaced placeholder; `polish.sh [--tier 1] [--n 4] [--only id] [--max 20]`: loop: `nextTopics` → for each (up to `n` in parallel with `xargs -P` or a bash job pool) render `prompts/polish-topic.md` with `TOPIC_ID, TRACK, SLUG, SECTION, EN_PATH, ZH_PATH, LINT_REPORT, CANONICAL_LANG (from lint report: the file with fewer code errors and higher word count; ties → zh), OTHER_LANG, TODAY, SLUG_FLAT`, run Codex with the rendered prompt via stdin (`codex exec … -`), capture stdout to `reports/polish/{slugFlat}/codex.log`, parse the last line (`POLISH DONE` / `POLISH FAILED`), run `pnpm content:check {id}` as the independent gate, `markStep` accordingly, and after every 10 successes `git add src/content content/glossary-proposals reports/polish/state.json && git commit -m "content: polish batch ({ids})"`. `--dry-run` prints the rendered brief for one topic and exits.

- [ ] **Step 1: Failing test** for `renderBrief` (replaces all, throws on leftovers).

- [ ] **Step 2: Implement** `render-brief.ts` and `polish.sh` (set `-euo pipefail`; trap SIGINT to save state; log each start/finish line with timestamps to `reports/polish/run.log`).

- [ ] **Step 3: Dry run** `pnpm content:polish --only python/closures --dry-run` and read the rendered brief for correctness. Commit `git add -A && git commit -m "feat(content): Codex polish runner with resumable state"`.

---

### Task 12: Calibration run (5 topics) and prompt tuning

**Files:**
- Modify: `prompts/polish-topic.md`, `prompts/editorial-standard.md` (only if calibration shows a gap), `content/tier-overrides.yaml`

- [ ] **Step 1: Pick five topics** spanning quality classes from the audit: `backend/jwt-authentication` (good pair), `cpp/move-semantics` (good, en title in Chinese), `python/asyncio` (stale), `ai/langchain` (needs rewrite), `architecture/cap-theorem` (bloated, zh machine-translated). Pin them to tier 1 in `content/tier-overrides.yaml`.

- [ ] **Step 2: Run** `pnpm content:polish --only backend/jwt-authentication` first (single), inspect the output files, the report and the check result. Then run the remaining four with `--n 4`.

- [ ] **Step 3: Review** (orchestrator/Fable): read each produced en/zh pair against the standard; note systematic problems (length, tone, AI-era section quality, translation naturalness, sidecar quality, cost and time per topic from `codex.log`). Adjust the brief. Re-run any topic that fails; record cost/time per topic in `reports/polish/calibration.md` (committed as an exception).

- [ ] **Step 4: Commit** `git add -A && git commit -m "content: calibration polish of five topics; brief adjustments"`.

---

### Task 13: Sidecar extraction and glossary merge

**Files:**
- Create: `scripts/content/extract.ts`
- Test: `tests/unit/content/extract.test.ts`

**Interfaces:**
- Produces: `mergeGlossaryProposals(proposalsDir, glossaryDir) → { added: string[]; skipped: string[]; conflicts: { id, reason }[] }` (adds a proposal as `src/content/glossary/{id}.yaml` when no term with that id or alias exists; conflicts when the same id has a different `en`/`zh`); `validateSidecars(id)` parses the quiz with `quizSchema` and the interview file with the interview schema (`src/schemas/interview.ts`: `{ track, items: [{ id, question: L, answer: L, topics: string[], level }] }`); CLI `pnpm content:extract [id|all]` runs both and marks `extracted`.

- [ ] **Step 1: Failing tests** for merge (add, skip duplicate alias, conflict). **Step 2–3: implement**, run on the calibration output, commit `git add -A && git commit -m "feat(content): sidecar validation and glossary merge"`.

---

### Task 14: Wave 1 (tier 1) and status reporting

**Files:**
- Create: `scripts/content/status.ts`
- Modify: `docs/superpowers/STATUS.md`

- [ ] **Step 1: `status.ts`** prints a table: per track — tier 1/2/3 counts, polished, aligned, reviewed (public), failed; and totals; `--markdown` prints it as a Markdown table for STATUS.md.

- [ ] **Step 2: Run wave 1** in batches: `pnpm content:polish --tier 1 --n 4 --max 40`, check `pnpm content:status`, spot-read two topics per batch (orchestrator), continue until tier 1 is exhausted. After each batch: `pnpm content:extract all`, `pnpm build` (must succeed; only reviewed topics render), commit.

- [ ] **Step 3: Update STATUS.md** with the status table and the next wave; commit `git add -A && git commit -m "content: tier 1 wave complete; status"`.

---

## Self-review notes (Fable, 2026-09-03)

- Spec §10.2 steps 1–8 map to Tasks 2–4 (inventory, mapping, import), 5–7 (lint), 9 (tiering), 11–12 (polish + translate inside the same Codex run, per the user's decision), 8/10 (verify), 13 (extraction), 14 (publish waves). Resumability requirement → Task 10 state + Task 11 runner + per-batch commits.
- The staging directory decision (raw imports outside `src/content`) is new relative to the spec's §8 repo layout; it protects `astro build` from unparseable MDX and is recorded here as the source of truth.
- Names reused across tasks: `listOldPairs`, `InventoryPair`, `resolveMapping`, `importPair`, `findZhIssues`/`fixZhTypography`, `checkFence(s)`, `extractLinks`/`checkLinks`, `blocks`/`alignBlocks`, `assignTier`, `loadState`/`markStep`/`nextTopics`, `renderBrief`, `mergeGlossaryProposals`.
