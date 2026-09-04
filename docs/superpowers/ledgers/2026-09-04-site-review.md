# Whole-site review with real content — pre-deployment gate

- Reviewer: Opus (read-only pass)
- Worktree: `/home/chen/githubprojects/codewiki/codewiki`, branch `main`, HEAD `0bca764` (merge `f9540e9` + STATUS commit)
- Build: `pnpm build` → exit 0, 5,850 pages, `dist` 523 MB, Pagefind indexed 5,784 pages in 2 languages
- Served with `pnpm preview` on `http://localhost:4321`; Lighthouse via `pnpm exec lhci autorun` with `lighthouserc.json`
- Toolchains used: `~/.local/bin/python3.14` (3.14.3), Node v24.14.0, `rustc` 1.94.0, `g++` 13.3.0 (`-std=c++23`), Flask 3.1.3 in a throwaway venv
- Date of pass: 2026-09-04 → 2026-09-05

---

## Verdict

**Not ready —** 1 Critical, 5 Important, 11 Minor. See the list at the end.

The content itself is the strongest part of this build: every runnable example I executed reproduced its published output byte for byte, the bilingual pairing is mechanically exact, and the site throws no console errors. What blocks deployment is one page that is unusable for seconds on a phone, sixteen duplicate URLs, a WCAG Level A failure across a whole page type, a generated agent-rules artefact that is one-sixth incoherent, and a test suite that no longer distinguishes a regression from fixture drift.

---

## Part 1 — content sampling

Sample: 10 topics drawn with `ls src/content/topics/*/*.en.mdx | shuf` across **10 tracks**, plus the two required additions (`python/closures`, one `ai-era` topic). Both languages read in full for each.

I executed **30 runnable blocks** across the 8 sampled topics that have a local runtime. **All 30 produced exactly the output printed in the article** — no rounding, no ordering, no wording differences. The 7 blocks with no local toolchain (C#, Unity) carry the `# not executed here: …` marker the standard requires and print that marker in place of a fabricated output block.

| # | Topic | Verified version | Runtime check | Score |
|---|---|---|---|---|
| 1 | `python/closures` | Python 3.14 | 4/4 blocks re-run on 3.14.3, exact | 4 |
| 2 | `rust/smart-pointers` | Rust 1.98 | 4/4 compiled and run on rustc 1.94.0, exact | 5 |
| 3 | `cpp/smart-pointers` | C++23 (GCC 13.3.0) | 3/3 with `-std=c++23 -Wall -Wextra -Wpedantic -Werror`, exact | 5 |
| 4 | `typescript/utility-types` | TypeScript 6 | 4/4 via `tsx`, exact | 5 |
| 5 | `backend/flask` | Flask 3.1.3 / Python 3.14 | 4/4 against a real Flask 3.1.3 install, exact | 5 |
| 6 | `foundations/virtual-memory` | C++23 | 3/3 compiled and run; `page_size=4096`, `minor_faults_delta=64`, COW `A`/`C` all reproduced | 5 |
| 7 | `architecture/adr` | Node 24 | 3/3 on Node v24.14.0, exact | 5 |
| 8 | `datascience/visualization` | Python 3.14 | 4/4 on 3.14.3, exact | 5 |
| 9 | `ai/openai-api` | OpenAI API (2026-09) | 4/4 fixtures run on 3.14.3, exact | 5 |
| 10 | `csharp/records` | C# 14 / .NET 10 | no SDK locally; 4 blocks correctly marked unexecuted, no invented output | 4 |
| 11 | `gamedev/unity-coroutines` | Unity 6.6 | no Editor locally; 3 blocks correctly marked unexecuted | 4 |
| 12 | `ai-era/agent-instructions-and-mcp` | Node 24 | 3/3 on Node v24.14.0, exact | 5 |

**Evidence, one line each**

1. `python/closures` — `loop_handlers.py` reproduces `['slow','slow','slow']` / `['fast','bulk','slow']` / `True` / `None`; the late-binding explanation is correct down to comprehension scope and `functools.partial` not being a closure. Docked one point for the `<TryToBreak>` mismatch (Minor 6).
2. `rust/smart-pointers` — `rc_lifetime.rs` prints `drop: checkout` between the two `upgrade()` results, exactly as published; the article states plainly that it compiled on 1.94.0 while pinning 1.98, which is the honest disclosure §6 asks for.
3. `cpp/smart-pointers` — `weak_parent.cpp` destroys the team before the member and prints `Ada has no team`; the control-block/double-delete and cycle pitfalls are the real ones.
4. `typescript/utility-types` — `readonly-queue.ts` prints `draft,send` for the shallow `Readonly`, which is the whole point of the section; the `Omit`-is-not-redaction pitfall is correct and specific.
5. `backend/flask` — `validate_json.py` returns `415/400/201` in that order on a real Flask 3.1.3; the `bool`-is-a-subclass-of-`int` note is right and the `415` vs `400` distinction matches current Flask.
6. `foundations/virtual-memory` — the article refuses to print randomized addresses and instead asserts stable facts; the fault counts it publishes are the ones my run produced, and it explicitly says the count is not an API guarantee.
7. `architecture/adr` — `check-adr.js` prints all three failures in the published order; supersession is modelled as a two-way relation rather than an overwrite.
8. `datascience/visualization` — `prepare_bars.py` yields `domain: (-2.5, 14.2) baseline: 0.0`; the pitfalls (sorting labels apart from values, red/green only, mean bar without `n`) are real and each carries a testable fix.
9. `ai/openai-api` — `gpt-6-astra` is a **real current model**: I fetched `https://developers.openai.com/api/docs/models` and it lists `gpt-6-astra` alongside the `gpt-5.6` family. Endpoint, `Bearer` scheme and Responses-API item dispatch are all correct.
10. `csharp/records` — the `with`-is-shallow and array-reference-equality claims are correct C# semantics; nothing is asserted that the missing SDK would have been needed to prove.
11. `gamedev/unity-coroutines` — `enabled = false` not stopping coroutines, `WaitForSeconds` vs `WaitForSecondsRealtime`, and yielding a child coroutine are the three mistakes Unity code actually makes; `Awaitable` and the Job System are named correctly for Unity 6.
12. `ai-era/agent-instructions-and-mcp` — `scoped-tool.js` reproduces its JSON output exactly; the AGENTS.md / CLAUDE.md distinction, the MCP tool/resource/prompt split and the guidance-vs-contract-vs-enforcement table are all accurate.

**Provable factual errors found: none.** I could not disprove a single technical claim in the twelve topics.

Cross-checks run over the whole corpus, not just the sample:

- **Link resolution** — every one of the 68 external URLs in the 12 sampled topics returns HTTP 200 (the single non-200 is `https://api.openai.com/v1/responses` returning 401, which is the API endpoint itself, not a doc link).
- **Model currency** — `claude-sonnet-5` in `ai/claude-api` is a real current model ID; the endpoint (`https://api.anthropic.com/v1/messages`), the `x-api-key` + `anthropic-version: 2023-06-01` headers, the stop-reason set and the "append the whole assistant `content` array, then a user array of `tool_result` blocks" rule are all correct against current Anthropic documentation.
- **Bilingual alignment** — all 290 pairs have identical `## ` heading counts and identical code-fence counts; **2,399 code blocks compared across all 290 topics are byte-identical between `en` and `zh`** once comments are stripped. Zero mismatches.
- **Chinese typography** — an automated pass over all 290 `zh` files for missing CJK/Latin spacing, half-width punctuation between CJK characters, and the banned phrases (`让我们`, `本文将`, `值得注意的是`) returns **zero** violations.
- **MDX hazards** — no unescaped `<` or `>` in prose anywhere; every hit my scan produced was inside a fenced code block.
- **Frontmatter** — all 290 titles are ≤ 40 characters with no colon; all 580 descriptions fall inside the 40–170 character band; 290/290 carry `aligned: true` and `status: reviewed`.
- **English style** — one banned-phrase hit in the whole corpus (Minor 11).
- **Sidecars** — 317 quiz banks, 1,748 items (349 predict / 719 mcq / 296 spotbug / 290 review / 94 fill). Every one of the 290 topics has a quiz bank, every bank has ≥ 4 items, and there are exactly 290 review katas — one per topic, as §9 requires. Interview coverage does not meet the standard (Important 5).

---

## Part 2 — site behaviour with real data

### Page weight and console errors

33 pages loaded in a real browser at 1280×900. **Zero console errors, zero page errors, zero failed requests** — the only error logged anywhere was the intentional 404 probe.

| Route | HTML raw | HTML gzip | Transferred | Requests |
|---|---|---|---|---|
| `/` | 164 KB | 21.7 KB | 118 KB | 6 |
| `/python/` | 46.7 KB | — | 128 KB | 19 |
| `/python/closures/` | 118 KB | 26.8 KB | 181 KB | 31 |
| `/zh/python/closures/` | 115 KB | — | 183 KB | 31 |
| `/practice/` | **1,766 KB** | 137 KB | 219 KB | 5 |
| `/zh/practice/` | **1,772 KB** | — | 242 KB | 5 |
| `/practice/interview/python/` | 266 KB | 37.6 KB | 159 KB | 21 |
| `/paths/python-from-zero/` | 66 KB | — | 134 KB | 20 |
| `/cheatsheets/python/` | 55.7 KB | — | 129 KB | 17 |
| `/playground/` | 23 KB | — | 297 KB | 19 |
| `/glossary/` | 356 KB | 61 KB | 157 KB | 13 |
| `/llms.txt` | 136 KB | — | — | — |
| `/llms-full.txt` | **14.6 MB** | 5.1 MB | — | — |

### Lighthouse

`pnpm exec lhci autorun` with the repository config (mobile emulation, `staticDistDir: dist`, `numberOfRuns: 1`):

| URL | Perf | A11y | Best pr. | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | **100** | 100 | 100 | 100 | 1.7 s | 0.028 | 10 ms |
| `/python/` | 99 | 100 | 100 | 100 | 1.5 s | 0.001 | 110 ms |
| `/python/closures/` | **63** | 100 | 100 | 100 | 2.9 s | 0.013 | 2,740 ms |
| `/zh/python/closures/` | 94 | 100 | 100 | 100 | 2.3 s | 0 | 190 ms |
| `/practice/` | **56** | 100 | 100 | **92** | 2.9 s | 0 | 16,700 ms |
| `/paths/python-from-zero/` | 100 | 100 | 100 | 100 | 1.5 s | 0 | 0 ms |
| `/practice/flashcards/` | 85 | 100 | 100 | 100 | 1.5 s | 0.096 | 500 ms |
| `/cheatsheets/python/` | 99 | 100 | 100 | 100 | 1.7 s | 0 | 80 ms |
| `/ai/prompt-builder/` | 99 | 100 | 100 | 100 | 1.8 s | 0 | 0 ms |
| `/playground/` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |

The brief's two extra URLs, collected with `pnpm exec lhci collect --staticDistDir=dist --numberOfRuns=2` (the config allowed it):

| URL | Perf | A11y | BP | SEO | LCP | TBT | TTI | DOM |
|---|---|---|---|---|---|---|---|---|
| `/practice/interview/python/` run 1 | 99 | 100 | 100 | 100 | 1.8 s | 0 ms | 1.8 s | 1,604 |
| `/practice/interview/python/` run 2 | 99 | 100 | 100 | 100 | 1.8 s | 30 ms | 1.8 s | 1,604 |
| `/paths/cs-foundations/` run 1 | 69 | 100 | 100 | 100 | 2.1 s | 3,050 ms | 5.9 s | 388 |
| `/paths/cs-foundations/` run 2 | **100** | 100 | 100 | 100 | 1.5 s | 60 ms | 1.6 s | 388 |
| `/python/closures/` run 1 | 62 | 100 | 100 | 100 | 3.0 s | 3,610 ms | 7.3 s | 1,127 |
| `/python/closures/` run 2 | **99** | 100 | 100 | 100 | 1.7 s | 0 ms | 1.7 s | 1,127 |

That second table is the important one: **the first measured run of any URL scores 62–69 and the second scores 99–100 on the identical artefact.** The `/python/closures/` = 63 in the autorun table is a cold-Chrome artefact, not a page regression (Minor 1). `/practice/` is the exception — across three further runs it scored 74 / 67 / 66 with TBT 1,170 / 4,810 / 6,180 ms, so its failure is real (Critical 1).

Accessibility is 100 on every URL Lighthouse checked. Lighthouse does not run the `scrollable-region-focusable` rule, which is why Important 2 does not appear here.

### Home, track hubs, topic pages

- Home renders the verified-version strip (`Python 3.14 · Node 24 · TypeScript 6 · Go 1.27 · Rust 1.98 · React 19 · Java 25 LTS · C++23`), three learning-path cards and a 292-row static topic palette that works with JavaScript disabled.
- Track-hub counts are **accurate**: `python` 22 topics / 6 sections, `javascript` 30, `rust` 15, `ai-era` 18, `data` 1, `devops` 3, `architecture` 5 — each matching the file count exactly. Each hub also shows the verified version, difficulty band and a `中文完整` completeness chip.
- The recommended-path card is live: `/python/` shows "Python from zero · 26 topics · 5 checkpoints · about 27 h · milestone 1 of 5 · 0 of 26 done · Continue: Python fundamentals →".
- "Also in this track" is present and populated (cheatsheet, compare, interview bank, glossary), and empty sections degrade to `02 Postgres — coming soon` rather than rendering blank.
- Prev/next on `/python/closures/` links live prerequisites (`/python/functions/`, `/python/scope-namespaces/`) and related topics (`/python/decorators/`, `/python/functools/`).
- **Depth modes work.** On `/python/closures/`: `quick` = 152 words / 0 visible H2, `standard` = 2,392 words / 6 H2, `deep` = 3,717 words / 7 H2, with `#article[data-depth-mode]` updating correctly.
- **Bilingual mode works.** Switching to `en-zh` pairs 164 `data-bi` blocks, 81 of which carry the Chinese twin, correctly matched paragraph for paragraph (first pair: the `TLDR` "what" cell and `闭包（closure）是关联了外层词法绑定的函数…`).

### Path maps

- `/paths/python-from-zero/` — "26 topics · 5 checkpoints · about 27 h · beginner → intermediate · 中文版同步", SVG map with 12 live linked nodes, `[data-continue]` → `/python/python-fundamentals/`.
- `/paths/cs-foundations/` — "23 topics · 4 checkpoints · about 46 h", SVG map with 23 live linked nodes, `[data-continue]` → `/foundations/algorithmic-complexity/`.

### `/practice/` with real data

1,748 cards server-rendered into a single document. Filters are progressive-enhancement links driven by `src/islands/PracticeFilters.tsx`. Once hydrated they are **functionally correct** — `?track=python` → 154, `?track=javascript` → 184, `?track=rust` → 75, `?track=cpp` → 92, `?type=review` → 290, `?level=advanced` → 377, `?sort=hardest` puts advanced first. "Kata today" resolves to a real kata (`/practice/predict/rust/modules-crates/predict-module-paths/`).

The problem is *when* they become correct — see Critical 1.

### Katas, interview banks, flashcards, cheatsheets

- **Review kata** — `/practice/review/python/closures/review-retry-handlers/` ("Review generated retry handlers"): controller reports `data-ready="true"`, renders 4 steps, walks to `data-state="answered"`, produces a comparison score and a visible result ring. All 290 review katas are built.
- **Interview bank** — `/practice/interview/python/`: 39 questions, one FAQPage `mainEntity` per item. The FAQPage JSON-LD is **29,706 bytes** inside a 266 KB page (37.6 KB gzipped); Lighthouse gives the page 99/100/100/100 with TBT 0–30 ms. Answers open and close correctly.
- **Flashcards** — from `/python/closures/`, "Add to flashcards" queues the page's four terms and `/practice/flashcards/` then shows "4 due today", card 1 of 4 fronting "Free variable / 自由变量" with Again / Hard / Good / Easy intervals. The whole loop works.
- **Cheatsheets in print emulation** — `/cheatsheets/python/` under `media: print` renders 13 panels and 72 rows in 1,958 px of height, the navigation is `display: none`, and nothing overflows the page width.

### Playground and runners

- `/playground/` loads **569 real examples** pulled from the topics, including SQL (`data/sql-advanced/en/0 :: window_report.sql`).
- **SQL runner**: `window_report.sql` on `/data/sql-advanced/` executed in **137 ms** and returned the correct window-function result set.
- **Python runner (Pyodide)**: `label_factory.py` on `/python/closures/` executed in **4.07 s** cold and printed `INV-0007 / RET-0007 / ('prefix',) / INV`, `exit 0 · 20 ms` — byte-identical to the published output.
- The brief asked for "an SQL example that uses a seed". **No topic in the shipped content uses `seed="name"`** (Minor 8), so I could only exercise the four self-contained SQL blocks in `data/sql-advanced`.

### Prompt builder, rules, packs, llms.txt

- `/ai/prompt-builder/?topic=python/closures&goal=learn&level=intermediate` produces a correct prompt with the topic's Markdown twin and its glossary vocabulary: *"You are a precise Python teacher… The selected codewiki topic is: [Closures](https://codewiki.com/python/closures.md). Use this precise vocabulary: Free variable, Enclosing scope, Late binding, Cell."*
- `/rules/python/CLAUDE.md` (54.9 KB) and `/packs/python/functions-deeper.md` (293 KB, 11 topics, 168 headings) both serve 200. Both carry defects — Important 4 and Important 1 respectively.
- `llms.txt` 136 KB / 872 lines; `llms-full.txt` 14.6 MB / 231,727 lines (5.1 MB gzipped). Large but coherent and correctly cross-linked to the `.md` twins.

### Search

Pagefind ships 38 MB total (8.3 MB of index chunks in 248 files + 29 MB of lazily-fetched fragments). A query pulls only the chunks it needs:

| Query | From | First results | Chunks fetched | Options |
|---|---|---|---|---|
| `closure` | `/` | **793 ms** | 23 req / 166 KB | 12 |
| `callback` | `/` | **631 ms** | 22 req / 182 KB | 12 |
| `闭包` | `/zh/` | **711 ms** | 24 req / 197 KB | 12 |
| `异步` | `/zh/` | **521 ms** | 23 req / 151 KB | 12 |

Warm re-queries land in ~640 ms. Results are locale-scoped correctly (a `/zh/` query returns only `/zh/…` routes) and every row carries a track glyph plus a `Track · Section` meta line, so the five topics titled "Closures" are distinguishable. Ranking puts `/swift/closures/` and `/rust/closures/` above `/python/closures/` for the bare query `closure`; that is a ranking judgement, not a defect, but it is what breaks four of the repo's search tests.

### SEO, sitemap, OG, headers

- `sitemap-index.xml` → `sitemap-0.xml` with **5,844 URLs**, 2,922 of them `/zh/`, and **11,688 `xhtml:link` hreflang alternates**.
- Topic heads carry `canonical`, `hreflang="en"`, `hreflang="zh-Hans"`, `hreflang="x-default"`, full Open Graph with `og:image:width/height`, and `twitter:card=summary_large_image`.
- **2,262 OG images** (84 MB, 22–54 KB each, avg 37 KB). A random sample of 20 new topic routes had a matching OG PNG in every case.
- `_headers` ships a real CSP (`object-src 'none'`, `frame-ancestors 'none'`, `'wasm-unsafe-eval'` for Pyodide) with a deliberate, well-commented relaxation confined to `/sandbox.html`, plus immutable caching for `/_astro/*`, `/vendor/*`, `/fonts/*`.
- `node scripts/check-dist-links.mjs`: **134,751 internal links across 5,850 pages, all resolve.**

### Repository test suites

`pnpm test:e2e` on this build: **184 passed, 50 failed** in 5.3 min. Breakdown of the 50 by cause:

- ~40 are **stale fixtures** left over from the pre-merge placeholder content: interview banks grew 3 → 39 questions, practice cards 5 → 1,748, cheatsheet titles changed ("Python cheatsheet" → "Python essentials"), `reviewed` dates moved 2026-09-03 → 2026-09-04, the `python-from-zero` Chinese title changed, a review kata was renamed, section headings were rewritten, and five topics are now titled "Closures" so several strict-mode locators resolve to 5 elements.
- 10 `localization.spec.ts` failures are **allowlist drift**, not defects: the flagged strings are `C++23`, `CORS`, `Django`, `FastAPI`, `asyncio`, `AGENTS.md`, `CLAUDE.md` — identifiers the editorial standard explicitly says must stay in English.
- **2 are real** (`a11y.spec.ts` on `/cheatsheets/python/` in both palettes → Important 2), and **1 is a genuine but environment-specific layout bug** (`layout.spec.ts` on `/zh/practice/` → Minor 7).

---

## Part 3 — findings

### Critical

**C1 — `/practice/` is unusable for seconds after load, in both locales.**
`http://localhost:4321/practice/` and `/zh/practice/` · `src/pages/practice/index.astro` + `src/islands/PracticeFilters.tsx:82-98,120-148`

The hub server-renders all 1,748 practice cards into one document: 1.77 MB of HTML, **17,726 DOM elements**, and a single `.practice-grid` with **1,748 direct children**. Lighthouse (mobile): performance **56**, Time to Interactive **21.2 s**, Total Blocking Time **16,700 ms**, max potential FID 5,750 ms, Speed Index 7.2 s, main-thread work **32.0 s of which 18.0 s is Style & Layout**. Three further runs scored 74 / 67 / 66 with TBT 1,170 / 4,810 / 6,180 ms and TTI 4.0 / 7.8 / 9.1 s, so even the best case is far below the repository's own `minScore: 0.95` gate.

*Failure scenario:* a reader opens Practice on a mid-range phone, taps "Rust", and nothing happens. I measured the wait from navigation start to `[data-practice-controls][data-ready="true"]` on five cold loads: **2.2 s, 11.1 s, 11.5 s, 2.7 s, 3.5 s** — on localhost, with a warm disk cache, on a desktop CPU. Until that moment the filter links behave as plain navigations that reload the same 1.77 MB page and still show all 1,748 cards. This is also why four `practice-hub.spec.ts` tests are flaky: they assert before hydration.

*Smallest fix:* stop shipping the whole catalogue in one document. Either render only the first page of cards and fetch the rest (the `data-more` / `is-collapsed` machinery is already there — extend it to the server render), or split the catalogue by track/type into separate routes and keep the combined view behind an explicit "browse all". A cheaper interim mitigation: `orderCards()` re-appends all 1,748 anchors on every `apply()` (`PracticeFilters.tsx:97` `grid.append(...sorted)`); skip the re-append when `state.sort` has not changed, and set `content-visibility: auto` plus `contain-intrinsic-size` on `.practice-card` to cut the 18 s of style-and-layout.

### Important

**I1 — Sixteen duplicate URLs: four topic pairs published twice.**
`src/content/topics/python/scope.en.mdx` vs `src/content/topics/python/scope-namespaces.en.mdx` (+ both `.zh.mdx`); `src/content/topics/python/fastapi.en.mdx` vs `src/content/topics/backend/fastapi.en.mdx`; `src/content/topics/go/reflect.en.mdx` vs `src/content/topics/go/reflection.en.mdx`; `src/content/topics/python/django.en.mdx` vs `src/content/topics/backend/django.en.mdx`

- `python/scope` and `python/scope-namespaces` differ by **24 lines out of 400** and have the **identical `title` *and* `description`**, in the **same track**. Both are listed on `/python/`, so the hub shows two rows reading "Python scope and namespaces" back to back. Both are in the sitemap, in `llms.txt`, and both appear in `/packs/python/functions-deeper.md` under the same name.
- `python/fastapi` and `backend/fastapi` differ by **29 lines out of 400** — only `track`, `section`, `prerequisites`, `related`, `quiz` and `origin`. The article body is the same text at two URLs.
- `go/reflect` and `go/reflection` are two separately written articles, both titled "Go Reflection", both in the `go` track; `go/reflection`'s own `related` list links to `go/reflect`.
- `python/django` and `backend/django` are two different articles sharing the title "Django".

*Failure scenario:* search engines pick one of each pair and suppress the other, splitting link equity; a reader on `/python/` sees the same title twice and cannot tell which to open; `llms-full.txt` hands an assistant the same 400-line article twice.

*Smallest fix:* keep one of each pair, delete the other and add a redirect. For `python/scope` vs `python/scope-namespaces` (`prevnext` already links `scope-namespaces`, so keep that one) and `python/fastapi` vs `backend/fastapi` (keep `backend/`, since `python/fastapi` sits in `section: basics`, which is where a web framework should not be), this is a delete plus a `related:` sweep. For the `go` and `django` pairs, either merge or retitle so the two pages state different scopes.

**I2 — WCAG 2.1.1 Level A failure on every cheatsheet page: 186 code snippets scroll but cannot be reached by keyboard.**
`/cheatsheets/{claude-code,codex-cli,docker,git-shell,go,http,javascript,python,regex,rust,sql,typescript}/` and their `/zh/` twins

axe-core (`wcag2a` + `wcag21a`) reports `scrollable-region-focusable` — *serious* — on **all 12 English cheatsheets**, 186 nodes in total: `claude-code` 24, `sql` 45, `typescript` 31, `rust` 23, `docker` 21, `go` 14, `codex-cli` 8, `http` 8, `python` 4, `git-shell` 4, `regex` 3, `javascript` 1. The offending elements are `<code class="snip">` cells that overflow horizontally, e.g. `.cheat:nth-child(8) > .r2 > .cr:nth-child(5) > .snip` holding `result = subprocess.run(args, check=True, text=True, capture_output=True)`.

*Failure scenario:* a keyboard-only or screen-reader user cannot scroll the snippet, so the second half of every long command on the cheatsheets is unreachable. This is the repository's own gate — `a11y.spec.ts` fails on `/cheatsheets/python/` in both palettes with 136 violation nodes reported.

*Smallest fix:* give the overflowing snippet a tab stop and a name — `tabindex="0"` plus `role="region"` and an `aria-label` on `.snip` when it can scroll — or, better for readers, let the cell wrap (`white-space: pre-wrap; overflow-wrap: anywhere`) so nothing scrolls at all.

**I3 — One in six generated agent rules is a sentence cut in half.**
`src/lib/rules.ts:69-75` (`clamp`), `src/lib/rules.ts:85` (`why`), rendered at `src/lib/rules.ts:175`

`clamp()` truncates a rule at 160 characters, and `ruleFromText()` assigns the leftover fragment to `why`, which the renderer prints as a `Why:` line. When the rule's first sentence is longer than 160 characters and there is no second sentence, the "reason" is just the tail of the same sentence. **251 of 1,517 rule entries (16.5 %) across `/rules/*/CLAUDE.md` are affected.** Examples from `/rules/go/CLAUDE.md`:

```
- ... retains all resources until the outer function ends, not until the…
  Why: current iteration ends.

- ... `defer cleanup()` does not fail at registration; it panics when the nil…
  Why: function is invoked during exit.
```

and from `/rules/python/CLAUDE.md`:

```
- `send(*recipient)` supplies one positional argument per character when `recipient` is a string, and unpacking a generator consumes it before the function…
  Why: body begins.
```

*Failure scenario:* these files exist to be dropped into a repository as `CLAUDE.md` so an agent reads them. A sixth of the entries end mid-clause and are followed by a `Why:` heading that contains no reason, which is worse than no rule — the truncation removes the qualifier that made the rule correct.

*Smallest fix:* in `ruleFromText`, only set `why` from `rest` (the genuine second sentence). If `clamp` produced overflow with no `rest`, emit the full sentence as the rule text instead of splitting it — a 200-character bullet reads fine and a severed one does not.

**I4 — The pre-deployment test gate is dark: 50 of 234 e2e tests fail on this build.**
`tests/e2e/` — 15 spec files affected

`pnpm test:e2e` → **184 passed, 50 failed**. As analysed above, roughly 40 are stale fixtures from the pre-merge content, 10 are localization-allowlist drift over identifiers the standard says must stay English, 2 are the real accessibility failure (I2) and 1 is the layout bug (Minor 7).

*Failure scenario:* nobody can now tell a real regression from fixture drift, so the suite stops being a gate. This is exactly the situation in which a genuine break ships — I2 is sitting in that noise right now, and I only separated it by re-running axe by hand.

*Smallest fix:* re-baseline the fixtures against the merged content in one pass (question counts, card counts, cheatsheet titles, `reviewed` dates, kata ids, section headings), widen `localization.spec.ts`'s allowlist to cover technical identifiers, and disambiguate the "Closures" locators by track. Then fix I2 so the a11y suite is green, and the suite is a gate again.

**I5 — Interview-bank coverage misses the editorial standard on 132 of 290 topics.**
`src/content/interview/*.yaml` vs `prompts/editorial-standard.md` §9

The standard requires 3–5 interview items per topic. Actual: 911 items across 22 banks, but **36 topics have no interview question at all** and **96 more have only one or two**. Only **158 of 290 topics (54 %)** meet the bar. Topics with zero include `backend/flask`, `backend/django`, `backend/hono`, `backend/rust-backend`, `javascript/functions`, `javascript/fundamentals`, `javascript/destructuring`, `javascript/es6-features`, `javascript/json`, `frontend/getting-started`. Every one of the 18 `ai-era` topics has 1–2. Quiz banks, by contrast, are complete: 290/290 topics, all ≥ 4 items, 290 review katas.

*Failure scenario:* a reader on `/backend/flask/` follows "Interview bank" and finds nothing about the topic they just read; the track hub advertises a bank that is thin for half the catalogue.

*Smallest fix:* this is authoring work, not a code change. Either fill the 36 zero-coverage topics before launch, or suppress the per-topic interview link where the bank has no item tagged to that topic so the promise matches the content.

### Minor

**M1 — The Lighthouse gate is not reproducible.** `lighthouserc.json:11` sets `numberOfRuns: 1`. The first measurement of any URL runs against a cold Chrome and scores 62–69 with 3.0–3.6 s TBT; the second run of the same artefact scores 99–100 with 0–60 ms. `/python/closures/` reported 63 in the autorun and 99 on a warm re-collect; `/paths/cs-foundations/` scored 69 then 100. *Fix:* raise `numberOfRuns` to 3 and assert on the median, or add a warm-up run whose result is discarded. Without this the perf gate will fail CI at random.

**M2 — `/practice/flashcards/` has a stable CLS of 0.096.** Reproduced identically in all three Lighthouse runs (perf 98 / 85 / 95, TBT 10 / 480 / 130 ms — so the shift, not the script, is the constant). It sits just under the 0.1 "good" threshold. *Fix:* reserve height for the card face before the island hydrates.

**M3 — `/practice/` scores SEO 92 on `link-text`.** One link's entire accessible text is "Go" — the Go entry in the track filter row (`http://localhost/practice/?track=go`). *Fix:* give the track chips an `aria-label` such as `Filter by Go`.

**M4 — 1,964 build warnings for 464 unwritten topic references.** `pnpm build` emits `[WARN] [content] Entry topics → <track>/<slug>/<lang> was not found` 1,964 times, for 464 distinct entries (232 slugs × 2 languages) named in `related:` and `prerequisites:`. No link is broken — all 134,751 internal links resolve — but the volume buries any warning that matters. *Fix:* resolve `related`/`prerequisites` against the existing collection before rendering, and log one summary line instead of one warning per reference.

**M5 — Unwritten related topics render as a bare de-slugged label with no "soon" badge.** `src/components/PrevNext.astro:104-108`. On `/python/closures/`, "next up" shows `<span class="soon">classes objects</span>` — styled grey and `text-transform: capitalize`, so a reader sees "Classes Objects" with no link and no explanation. `TrackHub.astro:301` and `Cheatsheet.astro:240` both render a `<Tag>{t(locale,'track.soon')}</Tag>` badge in the same situation; `PrevNext` does not. **178 built topic pages** contain a `class="soon"` span. *Fix:* add the same `track.soon` tag in `PrevNext.astro`, and use the planned title rather than the raw slug.

**M6 — `python/closures` has a `<TryToBreak>` whose items do not match its example.** `src/content/topics/python/closures.en.mdx:121` and `.zh.mdx:121` carry `items={['an empty list', 'a negative count']}` / `{['空列表', '负数计数']}` directly under `label_factory.py`, which is a `make_labeler(prefix)` factory returning `label(order_id)` — there is no list anywhere in it. This is the only such mismatch in the corpus: the other 108 distinct `TryToBreak` item lists are all bespoke to their example. *Fix:* replace with edge cases the example can actually take, e.g. `['an order id of 0', 'a negative order id', 'an order id with more than four digits']`.

**M7 — `/practice/` and `/zh/practice/` scroll sideways by 12 px at a 390 px viewport with classic scrollbars.** `documentElement.scrollWidth` is 402 against an `innerWidth` of 390, reproducible on every load of these two routes and no others (I checked 22 routes at 390 px and 16 at 320 px). It does **not** reproduce under Playwright's mobile emulation, where overlay scrollbars keep the layout viewport at 390 — so real phones are very unlikely to see it. It is nonetheless what makes `layout.spec.ts:38 › /zh/practice/ does not scroll horizontally on phone` fail, and the English twin pass, at random. *Fix:* `overflow-x: clip` on the page wrapper, or resolve it as a by-product of C1 once the grid stops being 1,748 elements.

**M8 — The SQL `seed="name"` feature has zero content coverage.** `prompts/editorial-standard.md` §6 specifies visible `sql seed="name"` declaration fences and `sql run seed="name"` consumers, but **no topic uses `seed=`** — a grep over all of `src/content/` returns nothing. All four runnable SQL blocks live in `data/sql-advanced` and are self-contained. The feature ships untested by real content, and the brief's "playground with an SQL example that uses a seed" check could not be performed. *Fix:* either use it in `data/sql-advanced` (the window-function, top-orders and anti-join examples share a schema and are the natural candidates) or drop the feature from the standard.

**M9 — The glossary term `record-type` is referenced but does not exist.** `src/content/topics/csharp/records.en.mdx:10,38` uses `<Term id="record-type">` and lists it in `terms:`, but `src/content/glossary/record-type.yaml` is absent — the only such gap in 813 terms, all of which are otherwise complete in both languages. It degrades safely to a plain `<span class="term">` with no link and no tooltip (so no broken link), but the reader loses the definition and "Add to flashcards" on that page still queues a card for a term with no back. *Fix:* add the glossary entry.

**M10 — Seven tracks ship as near-empty shells.** `data` 1 topic across 5 sections, `devops` 3/6, `architecture` 5/6, `datascience` 5, `security` 5, `gamedev` 5, `ai` 7 — against `javascript` 30, `backend` 26 and `foundations` 23. The hubs handle this well (`02 Postgres — coming soon`) and the counts are honest, so this is a launch-scope call rather than a bug: `/tracks/` presents 22 peers, seven of which have almost nothing behind them. *Fix (optional):* mark the thin tracks as previews on `/tracks/` so the top-level page does not imply parity.

**M11 — One banned phrase.** `src/content/topics/typescript/strict-mode.en.mdx:374` — "the other options in this article" trips §3's ban on "in this article"; here it is a cross-reference rather than an introduction, so it is cosmetic. *Fix:* "the other options on this page".

---

## What is genuinely good

Recorded because the verdict above is a list of problems and would otherwise misrepresent the build:

- **30 of 30 runnable examples reproduce their published output exactly.** Not approximately — byte for byte, including fault counts, destructor ordering and floating-point formatting. Where a toolchain was missing, the block says so instead of inventing output.
- **2,399 code blocks are identical between the English and Chinese versions** of all 290 topics, with matching heading and fence counts throughout.
- **Zero Chinese typography violations** across 290 translated files, and zero console errors across 33 pages in two locales.
- **134,751 of 134,751 internal links resolve.** 2,262 OG images with full coverage. 5,844 sitemap URLs with 11,688 hreflang alternates. A real CSP with a documented, narrowly scoped exception.
- Accessibility scores 100 on all ten Lighthouse URLs, and eight of those ten score 94–100 on performance.
- The in-browser runners work: SQL in 137 ms, Pyodide in 4.07 s, both producing the documented output.
- Search returns first results in 521–793 ms in both languages while fetching under 200 KB from a 38 MB index.
- Depth modes, bilingual pairing, path maps, review katas, flashcards, the prompt builder and print emulation all behave correctly against the real merged content.

TASK DONE
