# codewiki.com — Master Design Spec

Status: draft for user review · Date: 2026-09-03 · Author: Fable (planning) · Implementers: Opus (code), Codex gpt-5.6-sol (content, bulk edits)

Companion mockups: https://claude.ai/code/artifact/81ecf530-fd51-468d-86e2-1ba247b85067 (page 1 = the chosen system, page 2 = archived directions).

---

## 1. Goal

A bilingual (English / Simplified Chinese), SEO-first, static Astro site that helps programmers from beginner to advanced **learn, look up, and retain** programming knowledge, with the tagline **"Master code in the AI era."** It must be beautiful, professional, fast, and unusually interactive for a wiki: code runs in the browser, articles adapt their depth to the reader, English and Chinese read side by side, and every page can be handed to an AI assistant with the right context.

### 1.1 Non-goals (v1)

- No user accounts, no server, no database. All personal state lives in the browser (exportable JSON).
- No comments, forums, or user-generated content.
- No ads, no paywall.
- No mobile app; the responsive site is the mobile experience.
- No additional colour themes beyond light and dark (theme *engine* must allow adding them later).

### 1.2 Success criteria

| Area | Target |
|---|---|
| Quality | Every public topic is `status: reviewed`, has runnable examples where the language allows, a checkpoint, and an aligned translation |
| Launch content | ≥ 150 reviewed topic pairs across all tracks, plus ≥ 6 learning paths, ≥ 10 cheatsheets, glossary ≥ 300 terms |
| Performance | Lighthouse ≥ 95 in all four categories on home, track hub and topic pages (mobile) |
| SEO | Valid hreflang pairs for every page, JSON-LD on every content page, generated OG image per page, `llms.txt` |
| Accessibility | WCAG 2.2 AA contrast in both themes; full keyboard operation of palette, quizzes, depth dial |
| Bundle | Topic page ships ≤ 60 KB gzipped JS before any optional runtime (Pyodide, sql.js) is requested |

---

## 2. Audience and principles

**Audiences.** (a) Beginners following a path; (b) working developers looking something up mid-task; (c) intermediate developers preparing for interviews or switching languages; (d) Chinese-speaking developers who read English documentation and want the terminology; (e) AI assistants and their users who paste pages as context.

**Principles.**
1. **Answer on the first screen.** Every topic opens with a TL;DR card; the rest is progressive.
2. **One article, two languages.** English and Chinese are the same text, paragraph for paragraph. Never two different articles under one slug.
3. **Run it, don't trust it.** Examples are runnable where the language allows, outputs are shown, and outputs are produced by actually running the code during content review.
4. **Dated and versioned.** Every topic states the language/tool version it was verified against and when. Unreviewed content is not public.
5. **Practice is part of reading.** Predict-the-output, spot-the-bug and checkpoint questions live inside the article, not in a separate "exercises" silo.
6. **Static, private, portable.** No server, no tracking beyond privacy-friendly aggregate analytics (if any), personal data exportable.
7. **Made for AI too.** Clean Markdown twin of every page, `llms.txt`, and prompts that carry the section.

---

## 3. Information architecture

### 3.1 Tracks (top level)

Twenty-two tracks. Each has a slug, bilingual name, one-line description, a mono glyph (`py`, `js`, …), and 4–8 ordered **sections**. Sections are the sidebar groups and the unit of "checkpoints".

| Kind | Tracks |
|---|---|
| Languages | python · javascript · typescript · go · rust · java · kotlin · cpp · csharp · swift · php |
| Domains | frontend · backend · architecture (system design) · devops (cloud) · data (databases & data engineering) · datascience (classical ML & analysis) · ai (AI & LLM engineering) · security · gamedev |
| Pillars (new) | **ai-era** (Coding in the AI era) · **foundations** (CS fundamentals: algorithms, data structures, networking, OS, git, shell, regex, unicode, floating point) |

Track and section definitions live in `src/data/tracks.ts` (typed, bilingual). The 251 ad-hoc subcategories of the old corpus are mapped to sections by `scripts/content/mapping.json` (see §10).

### 3.2 Content types

| Type | What it is | Storage |
|---|---|---|
| **Topic** | The wiki unit: one concept/tool, 400–900 lines, TL;DR → explanation → runnable examples → pitfalls → deep dive → checkpoint | `src/content/topics/{track}/{slug}.{en,zh}.mdx` |
| **Path** | Ordered milestones of topics with checkpoints and a prerequisite map | `src/content/paths/{slug}.yaml` |
| **Quiz bank** | MCQ, predict-the-output, spot-the-bug, fill-in items linked to a topic | `src/content/quizzes/{track}/{slug}.yaml` |
| **Interview bank** | Q&A items per track with links to topics | `src/content/interview/{track}.yaml` |
| **Cheatsheet** | Dense one-page reference, printable | `src/content/cheatsheets/{slug}.{en,zh}.mdx` |
| **Glossary** | Bilingual term dictionary; powers hover tooltips and `/glossary/` | `src/content/glossary/terms.yaml` |
| **Compare** (P3) | Same task in N languages ("Rosetta") | `src/content/compare/{task}.yaml` |
| **Tool** (P3) | Interactive mini-lab page (event-loop visualizer, regex tester…) | `src/pages/tools/*` (code, not content) |

### 3.3 URL scheme

English at root, Chinese under `/zh/`. `trailingSlash: 'always'`, `build.format: 'directory'`.

```
/                          /zh/
/{track}/                  /zh/{track}/                 track hub
/{track}/{slug}/           /zh/{track}/{slug}/          topic
/{track}/{slug}.md         /zh/{track}/{slug}.md        Markdown twin (endpoint)
/paths/  /paths/{slug}/                                 learning paths
/practice/                                              hub: quizzes, interview, flashcards, katas
/practice/interview/{track}/                            interview bank page (FAQPage JSON-LD)
/practice/flashcards/                                   SRS review (client-side)
/cheatsheets/  /cheatsheets/{slug}/
/glossary/  /glossary/{term}/
/compare/  /compare/{task}/                             (P3)
/playground/                                            ?lang=python&code=<lz-string>  (client state in URL)
/tools/{tool}/                                          (P3)
/search/                                                Pagefind fallback UI (palette is primary)
/settings/                                              theme, depth, bilingual, font size, export/import
/llms.txt   /llms-full.txt   /llms/{track}.txt
/sitemap-index.xml  /rss.xml  /robots.txt  /404
/og/{...}.png                                           generated OG images (build-time endpoint)
```

Slugs are ASCII kebab-case, shared across languages (`/python/closures/` ↔ `/zh/python/closures/`). Old slugs are kept where sensible; duplicates in the old corpus are merged with redirects recorded in `redirects.json`.

### 3.4 i18n

- Astro `i18n`: `locales: ['en', 'zh']`, `defaultLocale: 'en'`, `routing: 'prefix-other'` (en unprefixed). `hreflang` en, `zh-Hans`, `x-default` (=en) on every page; sitemap emits alternates.
- Content: one collection, file-per-locale (`slug.en.mdx`, `slug.zh.mdx`). Entry id = `{track}/{slug}/{lang}`. Helper `getTopic(track, slug, lang)` and `getPair(track, slug)`.
- UI strings: `src/i18n/{en,zh}.ts` typed dictionaries; `t(key)` per page locale. No runtime i18n library.
- Fallback: a topic that exists only in one language is built only for that language; the other language's hub lists it with a "English only / 仅英文" badge and links across. Never auto-machine-translate at build.
- Chinese typography: `lang="zh-Hans"` on `<html>`; `text-autospace`/`word-break: normal`; `line-height` 1.85 for zh prose; full-width punctuation enforced by the content linter; CJK/Latin spacing enforced by the linter (pangu rules).

---

## 4. Content model (schemas)

All schemas are Zod (Astro content layer, `createSchema`). Key fields only; the plan fills in the rest.

**Topic frontmatter**
```yaml
title: Closures
description: Functions that carry their birthplace with them, and the one trap that catches everybody once.   # ≤ 160 chars, SEO
track: python
section: functions-deeper
difficulty: intermediate            # beginner | intermediate | advanced
tags: [closures, scope, nonlocal]
prerequisites: [python/functions, python/scope-legb]
related: [python/decorators, python/functools, javascript/closures]
terms: [free-variable, enclosing-scope, late-binding, cell]     # glossary ids used on this page
verified: { version: "Python 3.14", date: 2026-09-03 }
reviewed: 2026-09-03                # null while draft
status: reviewed                    # imported | draft | reviewed
aligned: true                       # set by the alignment checker; enables bilingual mode
quiz: python/closures               # id of quiz bank
sources:                            # verified links only
  - { title: "PEP 3104 – Access to Names in Outer Scopes", url: "https://peps.python.org/pep-3104/" }
origin: old/src/content/docs/python/closures.zh.md   # provenance, optional
```
Computed at build: reading time per depth level, headings/TOC per depth, word counts, last-modified from git.

**Path**: `id, title{en,zh}, description{en,zh}, tracks[], level{from,to}, hours, outcomes{en,zh}[], milestones[{id, title{en,zh}, topics[], checkpoint: quizId}]`, plus `edges[]` of explicit prerequisite arrows for the map.

**Quiz item**: `id, type: mcq|predict|spotbug|fill|review, prompt{en,zh}, code?, lang?, options[{text{en,zh}, correct}] | answer | issues[{line, kind, note{en,zh}}], explanation{en,zh}, difficulty, tags[]`. A `review` item carries realistic generated code (or a unified diff) and the expert review as `issues[]`.

**Glossary term**: `id, en, zh, aliases[], short{en,zh} (≤ 140 chars), topics[]`.

**Interview item**: `id, track, question{en,zh}, answer{en,zh} (Markdown), topics[], level`.

---

## 5. Page types and UX

Mockups define the look; this section defines behaviour.

### 5.1 Home
Nav (Tracks · Paths · Practice · Cheatsheets · Compare · Playground · AI era; search ⌘K; EN/中文; theme). Hero with headline, "Start a path / Browse tracks / llms.txt", "verified against" version chips (generated from data), and the **command palette** rendered open as the hero object. A **personal strip** (Continue · Kata today · Flashcards due) that renders only when local data exists (server-rendered as empty, hydrated `client:idle`). Feature grid (6), tracks (12 shown + all), three modes, bilingual + Ask-AI band, footer.

### 5.2 Track hub
Header (glyph, name, description, chips, four quick links: cheatsheet, interview bank, compare, playground) and a **recommended path card** with progress. Body: filter row (difficulty; sections / A–Z / unread), sections with topic cards (title, one-liner, difficulty tag, time, read state, current highlighted), later sections collapsed to one-line rows. Right rail: progress ring + export/import, recently reviewed, Ask-AI prompt, related resources.

### 5.3 Topic page
Three columns at ≥ 1280px (section tree 240 · article · rail 240), two at ≥ 1024, one below (tree becomes a sheet, TOC becomes an accordion, controls become a sticky bar).

Header: breadcrumb tags, H1, italic-free subtitle, **meta panel** (level, time at current depth, verified version + date, review status), **depth tabs** (Quick / Standard / Deep) and **bilingual toggle** on one line. Then TL;DR grid (what / trap / fix or what / why / how), sections, code blocks (title, Copy, Run, output panel), Predict/SpotBug widgets, Pitfall callouts, collapsed Deep teasers (in Standard), Checkpoint, before/next cards, action row (Ask your AI · Copy as Markdown · Add to flashcards · Edit on GitHub · Was this clear?). Rail: TOC (deep items dimmed), current path progress, terms on this page (en + zh).

### 5.4 Learning path
Header with progress ring and "Continue" CTA; **map** (SVG, built from path data: milestone columns, nodes with states done/current/locked, checkpoint diamonds, prerequisite edges); current milestone list; right rail (outcomes, time plan selector, export/share, Ask-AI). Locked means "checkpoint before it not passed" but is never enforced: any topic is readable; the lock is guidance.

### 5.5 Playground
Language tabs (python · javascript · typescript · sql · html/css), example loader (from topics), Reset / Copy / Share link / Run. Editor (CodeMirror 6, lazy) + output panel with tabs Output / Tests / Variables. Kata mode shows tests. Footer states runtime and "runs on your machine". URL carries language and lz-string-compressed code.

### 5.6 Practice hub, interview bank, flashcards, cheatsheets, glossary, compare, settings, search, 404
Specified in the P2 sub-spec; layouts reuse the same shell. Interview bank pages render Q&A with FAQPage JSON-LD and "reveal" interaction. Cheatsheets have a print stylesheet. Glossary term pages are small, indexable, and link to topics. Settings: theme (system/light/dark), default depth, bilingual default, font size, language preference, data export/import/clear.

---

## 6. Interactive features (behavioural spec)

| Feature | Behaviour | Persistence |
|---|---|---|
| **Depth dial** | Blocks carry `data-depth="quick|standard|deep"` (authored with `<Depth>` wrappers; unmarked = standard; TL;DR and first example = quick). All levels are in the HTML (SEO). Client toggles visibility, updates TOC and reading time. Deep sections show a one-line teaser in Standard. URL `?depth=` overrides once. | `prefs.depth` |
| **Bilingual mode** | For `aligned: true` topics: the other language's blocks are prebuilt as `/_bi/{lang}/{track}/{slug}.json` keyed by block id; client interleaves them under each block with `lang` attribute. Off / EN+中文 / 中文+EN. Disabled with a note when not aligned. | `prefs.bilingual` |
| **Runnable code** | Fence meta ` ```python run title="x.py" ` → block with Run. JS/TS: sandboxed iframe (`sandbox="allow-scripts"`, blob URL, console via postMessage, 5 s timeout); TS via lazily loaded `esbuild-wasm`. Python: Pyodide, self-hosted, lazy, cached by the browser; stdout/stderr streamed. SQL: sql.js with per-example seed. HTML/CSS: iframe `srcdoc` preview. Edits are local to the block; Reset restores. | none (per session) |
| **Predict the output** | Show code, 3–4 options, reveal on choice with explanation; wrong answers enqueue a flashcard. | `progress.quizzes` |
| **Spot the bug** | Code with clickable lines; select the faulty line(s), reveal fix + explanation. | `progress.quizzes` |
| **Checkpoint** | 3–8 items at the end of a topic or section; score stored; passing (≥ 70%) marks the topic complete and unlocks the next milestone on paths. | `progress.quizzes`, `progress.topics` |
| **Flashcards (SRS)** | Cards from: glossary terms on read pages (opt-in per page), missed quiz items, manual "Add to flashcards". SM-2-lite: intervals 1/3/7/14/30 days, ease 1.3–2.5. Review page with keyboard shortcuts. | `flashcards` |
| **Progress** | Read percentage via IntersectionObserver on sections; completion via checkpoint; path progress derived. "Continue" strip on home and hubs. | `progress` |
| **Command palette** | ⌘K / Ctrl-K, Pagefind index (both locales, filtered by current locale with a toggle), grouped results (topics, glossary, practice, paths, cheatsheets), recents, keyboard nav, "open in playground" for code results. | `recents` |
| **Ask your AI** | Prompt presets (explain simpler, quiz me, find bugs, compare with X, apply to my code) filled with page title + URL + current section text (≤ 6,000 chars). Actions: Open in Claude (`https://claude.ai/new?q=`), Open in ChatGPT (`https://chatgpt.com/?q=`), Copy. No API calls from the site. | none |
| **Copy as Markdown / llms.txt** | Markdown twin per page (frontmatter stripped, components rendered to plain Markdown equivalents); `llms.txt` (index with descriptions), `llms/{track}.txt` (full text per track). | none |
| **Theme** | `data-theme` set on `<html>` by an inline script before first paint: stored preference or system. Three-state toggle. CSS tokens only change. `color-scheme` set accordingly. | `prefs.theme` |
| **Reading preferences** | Font size (S/M/L), reduced motion respected automatically. | `prefs` |
| **Export / import** | One JSON file with all `cw:*` keys; import merges; clear-all with confirmation. | — |

### 6.1 AI-era integration (what "Master code in the AI era" means on the site)

The site never calls a model on the user's behalf. It makes the user better at *directing and verifying* models, and it makes itself the best possible input to whatever model the user already uses.

**Content: teach judgement, not just syntax.**

| Element | Where | Phase |
|---|---|---|
| **"In the AI era" block** on every topic: what generated code typically gets wrong about this concept, what to ask your AI to check, a 3-item review checklist, and the precise English terms to use in prompts | topic template, written by Codex under the editorial standard | P1 (standard), content waves |
| **`ai-era` track** (~18 topics) and **`foundations`** track | tracks | P0/P1 content |
| **AI-tool cheatsheets**: Claude Code, Codex CLI, Cursor, Copilot, MCP servers, `AGENTS.md`/`CLAUDE.md` conventions | cheatsheets | P2 |
| **Glossary of AI-era terms** (context window, tokens, tool use, MCP, eval, hallucination, prompt injection…) bilingual | glossary | P2 |
| **"AI-native developer" path** mixing foundations, one language track, `ai-era` topics and review katas | paths | P2 |
| **Human vs AI annotated solutions**: a naive generated solution beside an expert one, differences annotated (edge cases, security, readability) | compare component | P3 |
| **Transparency badge**: "Drafted with AI · verified by running the code · reviewed {date}" on every topic; honest E-E-A-T framing | topic meta | P1 |

**Form: every page is prompt-ready.**

| Element | Behaviour | Phase |
|---|---|---|
| **Ask-your-AI presets per block** | Code block: explain line by line, port to {language}, write tests; Pitfall: "check my code for this pitfall"; Section: explain simpler, quiz me, Socratic mode; Topic: "grade my explanation" (Feynman prompt with the rubric embedded) | P1 (topic/section), P2 (block-level) |
| **Markdown twin, `llms.txt`, per-track `llms/{track}.txt`** | see §6 | P1 |
| **Static JSON endpoints** `/api/topics.json`, `/api/glossary.json`, `/api/paths.json`, `/api/topics/{track}/{slug}.json` (concept card: definition, pitfalls, terms, links) so people can build their own tools or RAG over codewiki | build-time endpoints | P1 |
| **Context packs**: per section/path, one `.md` bundle of the reviewed topics for Claude Projects, Cursor docs, NotebookLM | build-time endpoints | P2 |
| **Rules packs**: downloadable `AGENTS.md` / `CLAUDE.md` / `.cursor/rules/*.mdc` snippets per track, generated from the pitfalls and best practices ("when writing Python async code, never…") | build-time endpoints + download buttons | P2 |
| **Prompt builder page** `/ai/prompt-builder/`: pick topic, goal, level, language → structured prompt with copy / open-in-Claude / open-in-ChatGPT (client-side templates, no network) | page | P2 |
| **Playground hand-off**: code + output + error → "Ask AI to fix" deep link with the error text; then run the fix here to verify | playground | P2 |
| **Open-source MCP server** `codewiki-mcp` (npm) that queries the static JSON/MD endpoints, so Claude Code / Cursor can look up codewiki as a tool | separate package | P3 |
| **Tokenizer and context-budget tools** (client-side WASM tokenizer) for the `ai-era` topics | tools | P3 |

**Practice: train the new basic skill, reviewing generated code.**

| Element | Behaviour | Phase |
|---|---|---|
| **Review the AI's code** kata type: realistic generated code (or a diff) with subtle bugs of the kind models produce; learner marks lines / writes review comments; reveal the expert review | quiz item type `review`, practice hub, inside topics | P2 |
| **Checkpoint items of type `review`** in paths ("review this generated solution before moving on") | paths | P2 |
| **Daily review kata** on the home page, rotating from the bank | home | P3 |
| **"Try to break it" nudges** under runnable examples: listed edge cases to test, framed as the antidote to trusting output | code block | P2 |

Design consequence: the amber `--acc2` in dark mode (indigo in light) is reserved for AI-era affordances (nav item, Ask-AI, rules packs, review katas) so they read as one family.

### 6.2 Local storage schema

Keys prefixed `cw:v1:`. Writes debounced (500 ms) and size-guarded (< 2 MB total; oldest recents dropped first).

```ts
prefs      { theme: 'system'|'light'|'dark', depth: 'quick'|'standard'|'deep', bilingual: 'off'|'en-zh'|'zh-en', fontSize: 's'|'m'|'l', lang?: 'en'|'zh' }
progress   { topics: Record<id, {readPct: number, completedAt?: string, lastAt: string}>, quizzes: Record<id, {score: number, total: number, at: string}>, paths: Record<id, {startedAt: string}> }
flashcards { cards: Array<{id, kind: 'term'|'quiz', ref: string, due: string, interval: number, ease: number, reps: number}> }
recents    { pages: string[] }
```

---

## 7. Design system

Chosen direction: **light = "Studio Precision", dark = "Night Lab" palette**; one layout, one type system, two token sets. Mockups are the visual source of truth; this table is the implementation contract.

### 7.1 Tokens

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#f6f7f9` | `#0b1020` |
| `--sur` / `--sur2` | `#ffffff` / `#eef0f4` | `#111a2e` / `#172341` |
| `--line` | `#e2e5eb` | `#22304f` |
| `--ink` / `--ink2` / `--ink3` | `#15181e` / `#4b5160` / `#7b8190` | `#e9edf7` / `#a8b1c9` / `#8b95b3` |
| `--acc` / `--acc-h` / `--acc-ink` / `--acc-soft` | `#3451d1` / `#2538a8` / `#fff` / `#e9ecfa` | `#5ee1ff` / `#9eeeff` / `#06111f` / `rgba(94,225,255,.14)` |
| `--acc2` (AI-era, Ask-AI) | `#3451d1` | `#ffbf47` |
| `--ok` / `--ok-soft` | `#0f8a5f` / `#e4f4ec` | `#b7f0a1` / `rgba(183,240,161,.14)` |
| `--warn` / `--warn-soft` | `#b4540a` / `#fdf0e4` | `#ffbf47` / `rgba(255,191,71,.12)` |
| `--bad` / `--bad-soft` | `#b3261e` / `#fbe9e7` | `#ff7ab6` / `rgba(255,122,182,.12)` |
| `--on-bg` / `--on-ink` (selected segment) | `#15181e` / `#fff` | `#172341` / `#e9edf7` |
| `--glow` (hero panels) | soft neutral shadow | `0 0 0 1px rgba(94,225,255,.25), 0 30px 80px -40px rgba(94,225,255,.35)` |
| Code panel `--code-bg/--code-line/--code-ink/--code-out` | `#0f1117/#1d2130/#c9d1e3/#0b0d13` | `#0d1426/#22304f/#dbe2f3/#0b1020` |
| Code syntax `--k --s --f --c --n` | `#7aa2f7 #9ece6a #e0af68 #565f89 #ff9e64` | `#ff7ab6 #b7f0a1 #5ee1ff #7f8bad #ffbf47` |
| Run button `--run-bg/--run-ink` | `#9ece6a/#0f1117` | `#5ee1ff/#06111f` |

Contrast is checked in CI for every text/background pair used by components (AA for body, AA-large for 12px mono labels at minimum; failing pairs adjust the token, not the component).

### 7.2 Type, space, shape, motion

- Fonts: **IBM Plex Sans** (400/500/600, self-hosted variable, Latin subsets) for UI and prose; **IBM Plex Mono** (400/500) for code and labels; CJK via system stack `"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif` with `size-adjust` tuned so mixed lines align. No Google Fonts at runtime (China accessibility).
- Scale: 12 (mono labels) · 13 · 13.5 · 14 · 14.5 · 15 · 16 (prose) · 18 · 20 · 22 · 26 (h2) · 30 · 44/46 (h1 hubs) · 62 (home h1). Prose line-height 1.7 (en) / 1.9 (zh).
- Spacing on a 4px grid; page containers 1200 (home/hubs), 1320 (topic/playground).
- Radii: 4 (tags, kbd), 6 (controls, small panels), 8 (panels, code). No pill radii except progress bars.
- Borders 1px `--line`; shadows only `--glow` on hero-grade panels.
- Motion: 150–200 ms ease-out for state changes; palette 120 ms; no parallax; `prefers-reduced-motion` disables all non-essential motion.
- Icons: inline SVG, 1.8–2px stroke, 12/14/16/18/20 sizes; no emoji anywhere in UI.

### 7.3 Components (Astro unless marked island)

Shell: `Nav`, `Footer`, `Search` (island: palette), `ThemeToggle` (island), `LangSwitch`. Content: `TLDR`, `Depth`, `CodeBlock` (island only when runnable), `Callout`, `Term` (tooltip island, one per page), `Tabs`, `Steps`, `Diagram` (build-time SVG), `PrevNext`, `TOC` (island for active state), `ActionRow`, `AskAI` (island), `BilingualToggle` (island). Practice: `Predict`, `SpotBug`, `Quiz`, `Checkpoint`, `Flashcards` (islands). Data: `ProgressRing`, `PathMap` (Astro SVG + tiny island for state), `TrackCard`, `TopicCard`, `Tag`, `Seg`.

---

## 8. Technical architecture

- **Framework**: Astro 7.x, `output: 'static'`. Content Layer API with `glob()` loaders. MDX via `@astrojs/mdx` 8 (unified pipeline). For `.md` (none planned) the default Sätteri processor is fine.
- **Islands**: Preact + `@preact/signals`. Hydration `client:idle` for palette/theme, `client:visible` for quizzes and runnable blocks, `client:only` for the playground editor.
- **Styling**: Tailwind v4 (`@tailwindcss/vite`) for utilities, with the design tokens declared as CSS custom properties in `src/styles/tokens.css` and exposed through `@theme`. Components use tokens, never raw hex. Global prose styles for MDX output.
- **Markdown pipeline** (MDX): remark plugins — `remark-code-meta` (parses ` ```lang run title=… ` into props), `remark-depth-hints` (validates `<Depth>` nesting), `remark-glossary-autolink` (first occurrence of an allow-listed term → `<Term>`), `remark-mermaid-to-svg` (build-time render via `rehype-mermaid` with Playwright, cached by hash), `remark-callouts` (GitHub-style `> [!PITFALL]` → `Callout`); rehype — heading ids (github-slugger), `rehype-external-links` (rel/target), block ids for bilingual alignment (`data-b`).
- **Code highlighting**: Shiki (built-in) with dual themes mapped to the two palettes via CSS variables (`css-variables` theme); transformers for line highlight and diff notation.
- **Search**: Pagefind (`astro-pagefind`), indexes both locales with `data-pagefind-filter="lang"`; palette UI custom; `/search/` fallback page.
- **Runtimes**: Pyodide (self-hosted under `/vendor/pyodide/`, loaded on first Run), `esbuild-wasm` for TS, `sql.js` WASM, CodeMirror 6 for the playground (lazy). All optional; topic pages never load them until a Run is requested.
- **OG images**: build-time endpoint `src/pages/og/[...path].png.ts` using `satori` + `@resvg/resvg-js`; Plex Sans embedded; CJK titles rendered with a subset generated at build from the title glyphs (`subset-font`), fallback to a system-like Noto subset committed to the repo.
- **Sitemap / RSS / robots / llms.txt**: `@astrojs/sitemap` with i18n alternates; custom `rss.xml.ts` (recently reviewed); `llms.txt` endpoints generated from collections.
- **Markdown twin endpoints**: `src/pages/[track]/[slug].md.ts` (and `/zh/…`) render the MDX source through a "to plain Markdown" transform (components → Markdown equivalents: TLDR → blockquote list, Depth → headings with `[deep]` markers, code meta stripped).
- **Deployment**: static hosting (assumed Cloudflare Pages; any static host works). Headers file for caching (`/_astro/*` immutable, `/vendor/*` immutable, HTML `no-cache`), security headers (CSP allowing `wasm-unsafe-eval` for runtimes, `frame-src blob:` for sandboxes).
- **Repo layout**
  ```
  src/{components,layouts,pages,content,data,i18n,lib,styles,islands}
  src/content/{topics,paths,quizzes,interview,cheatsheets,glossary,compare}
  scripts/content/{import,lint-zh,lint-code,lint-links,check-alignment,extract,codex-polish}.ts|sh
  prompts/{editorial-standard.md,polish-topic.md,translate-topic.md}
  reports/            (generated, git-ignored except summaries)
  docs/superpowers/{specs,plans}
  tests/{unit,e2e}
  public/{vendor,fonts,favicons}
  ```
- **Tooling**: pnpm, TypeScript strict, ESLint (astro + ts), Prettier (astro plugin), Vitest, Playwright, Lighthouse CI, GitHub Actions (typecheck, lint, unit, build, e2e smoke, content lint, lighthouse budgets).

---

## 9. SEO strategy

1. One strong canonical page per concept (no thin sub-pages); all depth levels are in the HTML.
2. Titles `"{Topic} · {Track} · codewiki"` (zh: `"{Topic}｜{Track}｜codewiki"`), descriptions ≤ 160 chars per locale, canonical + hreflang pairs, `x-default` = en.
3. JSON-LD: `TechArticle` (topics; `dateModified` = reviewed; `inLanguage`), `BreadcrumbList`, `Course` (paths), `FAQPage` (interview banks), `DefinedTerm`/`DefinedTermSet` (glossary), `WebSite` + `SearchAction`, `Organization`.
4. Internal linking: prerequisites, related, next/previous, glossary terms, section hubs, compare pages; every topic reachable within 3 clicks from home.
5. Performance and Core Web Vitals as ranking factors: static HTML, self-hosted subsetted fonts with `font-display: swap`, no layout shift from islands (server-rendered placeholders with fixed size), images lazy + dimensions set.
6. Freshness signals: `reviewed`/`verified` shown and in JSON-LD; RSS of recently reviewed pages; sitemap `lastmod`.
7. Machine readers: `llms.txt`, Markdown twins, clean semantic HTML, `robots.txt` allowing all major crawlers.
8. Content quality gate (§10) is the biggest SEO lever: no hallucinated links, no stale APIs, real outputs.

---

## 10. Content pipeline

### 10.1 Editorial standard (summary; full text in `prompts/editorial-standard.md`)

- Structure: **TL;DR** (3 cells) → **What it is / why it exists** → **How it works** (mechanics, one diagram if it helps) → **Examples** (runnable, realistic, with outputs produced by running them) → **Pitfalls** (merged with "best practices"; each pitfall states the fix) → **In the AI era** (what generated code gets wrong here, what to ask your AI to check, a 3-item review checklist, prompt vocabulary) → **Deep dive** (marked `deep`; internals, edge cases, performance with numbers or nothing) → **Checkpoint** (3–8 items, YAML sidecar, at least one `predict` and, where the topic allows, one `review` item) → **Further reading** (only links verified by fetching; official docs first). Interview questions go to the interview sidecar, not the article.
- Length 400–900 lines including code. No "In this article", "comprehensive guide", "By mastering…". No rule-of-three padding. Prose written for a smart colleague.
- Currency: verified against a named version as of 2026 (e.g. Python 3.14, Node 24, TypeScript 6, Go 1.27, Rust 1.98, React 19, Java 25 LTS, LangChain 1.x, current Claude/OpenAI SDKs); flag deprecated APIs explicitly.
- English: native, direct, present tense. Chinese: natural technical writing, consistent terminology from the glossary, a space between Chinese characters and adjacent Latin text, Chinese punctuation, and no translationese.
- Bilingual: the canonical language is chosen per topic (the better draft); the other language is a faithful paragraph-aligned translation; code identical; headings 1:1.
- Diagrams: Mermaid where a structure/flow helps (rendered to SVG at build); no decorative images.
- Every claim about behaviour must be backed by a runnable example or a cited primary source.

### 10.2 Steps

| Step | Tool | Output |
|---|---|---|
| 1 Import & normalise | `scripts/content/import.ts` (Opus writes, runs locally) | `src/content/topics/**` with `status: imported`, normalised frontmatter (track/section via `mapping.json`, difficulty, title-language fixes), provenance, divergence score; `reports/import.md` |
| 2 Taxonomy mapping | `mapping.json` drafted by Codex from the 251 subcategories, reviewed by Fable | curated sections per track |
| 3 Lint | `lint-zh` (spacing/punctuation/terms), `lint-code` (syntax check per language), `lint-links` (HTTP check + book-title flag), schema validation | `reports/lint/*.json` fed into the polish prompt |
| 4 Tiering | Fable + Codex | `content/tiers.yaml`: Tier 1 (~150: first two sections of every language track, core domain concepts, all `ai-era`), Tier 2 (~400), Tier 3 (rest), Drop (duplicates/off-topic from the audit) |
| 5 Polish (per topic) | `scripts/content/codex-polish.sh {track}/{slug}` → `codex exec --dangerously-bypass-approvals-and-sandbox -m gpt-5.6-sol -c model_reasoning_effort=xhigh -C <repo>` with `prompts/polish-topic.md` | canonical-language MDX rewritten to the standard; quiz + interview sidecars; glossary proposals; outputs verified by running code (Codex runs Python/Node locally); `status: draft` |
| 6 Translate (per topic) | same Codex run or a second `translate-topic.md` run | other-language MDX, paragraph-aligned |
| 7 Verify | `check-alignment` (heading/block/code parity → `aligned`), lint again, `astro check`, build the page, screenshot both locales | `status: reviewed`, `reviewed`, `verified` set; failures loop back to step 5 |
| 8 Publish | only `status: reviewed` is built for production (`drafts` only in `pnpm dev`) | waves: Tier 1 → launch; Tier 2/3 → continuous |

Parallelism: 4 Codex runs at a time; each run is one topic pair; logs and diffs kept under `reports/polish/{slug}/`. Estimated cost is tracked per run in the report.

**Resumability (usage limits will interrupt work).** Every pipeline step is idempotent and keyed by topic: `reports/polish/state.json` records `{topic: {step, startedAt, finishedAt, attempts, lastError}}`; a run skips topics already past the requested step; a killed run leaves the topic at its last completed step and the next invocation resumes it. Content files are committed after each successful topic (one commit per topic or per batch of 10). The same applies to implementation work: `docs/superpowers/STATUS.md` is the single resume point for any future session (Fable, Opus or Codex), updated at every milestone and before any long-running job.

### 10.3 New content (Codex, same standard)
- `ai-era` track (~18 topics): working with coding agents (Claude Code, Codex, Cursor), spec-driven development, reviewing AI-generated code, testing AI output, prompting patterns for code, context engineering, MCP basics, evals for LLM apps, security of generated code, learning with AI without losing skills, debugging with an AI pair, reading unfamiliar code fast, agent workflows and guardrails, cost/latency trade-offs, when not to use AI.
- `foundations` track (~20 topics): algorithms & data structures core, complexity, HTTP, DNS/TCP basics, OS processes/threads, git, shell, regex, unicode, floating point, memory model basics, testing fundamentals.
- Paths (6 at launch): Python from zero · JavaScript to TypeScript · Frontend with React · Backend with Go · AI engineer · System design for interviews.
- Cheatsheets (≥ 10) and glossary (≥ 300 terms) extracted/curated from reviewed topics.

---

## 11. Testing and quality gates

- **Unit (Vitest)**: content scripts (frontmatter normaliser, mapping, lint rules, alignment), remark/rehype plugins, SRS scheduler, prompt builder, URL/lz-string codec, theme bootstrap.
- **Component (Vitest + Preact testing library)**: Quiz, Predict, SpotBug, Depth dial, Bilingual toggle, Palette keyboard nav.
- **E2E (Playwright)** against `astro preview`: home renders both locales; topic page depth toggle persists across reload; bilingual interleaves and sets `lang`; Run on a JS block prints expected output; Run on a Python block loads Pyodide and prints; palette search finds a zh topic; theme toggle updates `data-theme` without flash; `/python/closures.md`, `/llms.txt`, sitemap and hreflang present; 404 page.
- **Content CI**: schema validation, lint-zh, lint-code, alignment, link check (sampled daily, full weekly), "no public draft" guard.
- **Performance CI**: Lighthouse CI budgets on home, hub, topic (mobile), JS size budget per route.
- **Accessibility**: axe in Playwright on key pages; token contrast test.

---

## 12. Phasing

| Phase | Scope | Owner | Exit criteria |
|---|---|---|---|
| **P0 Content pipeline** (parallel) | import/normalise, mapping, linters, editorial standard, prompts, tiering, first 20 topics polished as calibration | Opus (scripts), Codex (content), Fable (review) | 20 reviewed pairs pass all gates; report shows cost/time per topic |
| **P1 Site foundation** | scaffold, tokens/themes, shell, home, track hub, topic page (TL;DR, TOC, depth dial, code blocks with Copy/Run for JS/TS/Python, callouts, terms tooltips, prev/next, Ask-AI, Markdown twin), i18n routing, palette search, SEO infra, settings, 404, tests, CI, deploy | Opus | All e2e green; Lighthouse ≥ 95 with 20 real topics |
| **P2 Learning layer** | paths + map, quiz/predict/spot-bug/checkpoint, interview bank pages, flashcards SRS, progress + continue strip, cheatsheets, glossary pages, bilingual mode, playground (+ SQL, HTML/CSS runtimes, kata tests) | Opus (+ Fable for any new visual) | Feature e2e green; 6 paths live |
| **Launch v1** | Tier 1 content (≥ 150 pairs) reviewed and public; domain live | all | Success criteria §1.2 |
| **P3 Advanced** | compare/Rosetta, tools/visualizers, kata library, knowledge graph, daily kata, PWA offline, optional sync | later | per-feature specs |

Each phase gets its own implementation plan (writing-plans skill). P1 is the first plan.

---

## 13. Assumptions and open decisions

Assumptions (proceeding unless told otherwise):
- Hosting: Cloudflare Pages or equivalent static host; domain `codewiki.com` managed by the user.
- No analytics in v1 (a privacy-friendly aggregate script can be added later).
- Repository will be public on GitHub so "Edit on GitHub" links work; if it stays private, the links are hidden.
- Content licence to be decided by the user (suggest CC BY-NC-SA 4.0 for prose, MIT for code samples); shown in the footer once decided.
- Codex performs both polish and translation (user decision 2026-09-03); no Claude QA pass on translations.
- Typography unified on IBM Plex in both themes (dark theme keeps its palette only). Switching headings to a display face later is a one-token change.

---

## 14. Appendix

### 14.1 Track → sections (initial)

- **python**: basics · functions-deeper · objects · concurrency · stdlib · typing-tooling
- **javascript**: core · functions-scope · async · browser · node · patterns-tooling
- **typescript**: basics · type-system · generics-advanced · config-migration · patterns
- **go**: basics · types-interfaces · concurrency · stdlib · services-tooling
- **rust**: basics · ownership-borrowing · traits-generics · error-handling · concurrency-async · unsafe-ffi · cargo-tooling
- **java**: basics · oop-generics · collections-streams · concurrency · jvm-gc · spring-tooling
- **kotlin**: basics · functions-classes · coroutines · android-multiplatform · tooling
- **cpp**: basics · memory-ownership · templates-generic · modern-cpp · concurrency · tooling
- **csharp**: basics · types-linq · async · dotnet · tooling
- **swift**: basics · optionals-protocols · concurrency · swiftui · tooling
- **php**: basics · oop · laravel-symfony · performance-security · tooling
- **frontend**: html-css · layout · react · vue · performance · accessibility · build-tools
- **backend**: http-apis · auth · databases · caching-queues · testing · deployment
- **architecture**: principles · design-patterns · system-design · distributed · ddd · observability
- **devops**: containers · kubernetes · ci-cd · cloud · observability · iac
- **data**: sql · postgres · nosql · data-engineering · analytics-engines
- **datascience**: python-stack · statistics · classical-ml · evaluation · deployment
- **ai**: llm-basics · prompting · rag · agents · evals · fine-tuning · deep-learning · multimodal
- **security**: web-security · auth-crypto · appsec · infra-security · secure-coding
- **gamedev**: unity · unreal · godot · graphics · gameplay-systems · performance
- **ai-era**: working-with-agents · reviewing-ai-code · specs-and-tests · prompting-for-code · tooling · judgement
- **foundations**: algorithms · data-structures · networking · operating-systems · git-shell · text-numbers

### 14.2 Ask-AI prompt template (en)

```
I am reading "{title}" on codewiki ({url}), section "{section}".
Context (verbatim from the page):
"""
{section_text}
"""
{preset_instruction}
Answer in {reader_language}. Keep code examples in {language}. Where you are unsure, say so.
```
Presets: explain-simpler ("Explain this as if I only know {prerequisite}…"), quiz-me ("Ask me one question at a time…"), find-bugs ("Introduce three subtle bugs into the example and let me find them…"), compare ("Show the same idea in {other_language}…"), apply ("Here is my code: … how does this concept apply?").
