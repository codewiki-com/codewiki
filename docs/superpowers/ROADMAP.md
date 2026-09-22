# codewiki roadmap and to-do

Single list of everything not yet done, in the order it should happen. `STATUS.md` says where the work stands today; the specs and plans under `docs/superpowers/` say how each finished piece was built. This file replaces the TODO section that used to live in `STATUS.md`.

Written 2026-09-05 after the pre-launch gate went green on `main` and after two outside reviews of the product were read. The reviews agreed on one thing the design lead accepts: **the site's signature is the training side (review AI-generated code, verified examples, aligned bilingual reading), not the size of the article library** — and the current home page and structure present the library first. Phase A fixes that before launch; Phase B deepens it after.

Legend: **[user]** = needs a decision or action from the owner · **[design]** = design work first. Model labels below are historical; as of 2026-09-07 all new execution uses GPT, with Sol high used for the completed B3 refresh.

## Phase A — before launch (about 1–2 days of agent time)

Small changes with the largest effect on first impressions and credibility.

- [x] **A1. Home page leads with a review kata.** [design → Opus] Move the daily kata card to the first screen as the hero ("Review this generated code before you would ship it"), with the search palette mock and the article entry points below it. Navigation order: Practice before Tracks. Keep the palette mock capped at four rows.
- [x] **A2. Honest framing.** [Codex] Home tagline copy, About page and `home.sub`: replace "most first drafts are written by AI / the skill has become…" with "AI increasingly writes code; developers still have to understand implementations, state constraints and verify results." About page gains a section "How this content is made": AI-assisted drafts, every example executed, editorial standard, human spot checks, open corrections.
- [x] **A3. Visible verification on every topic.** [design → Opus] A small verification panel near the title: target environment with the exact patch version used (e.g. Python 3.14.2), the date the examples last ran, "N of N outputs matched", and a link to the checker log. Data comes from `content:check` writing a per-topic sidecar (`reports/verify/{track}/{slug}.json`) that the build reads. Distinguish **target environment** (what the article pins) from **the in-browser runner** (Pyodide's Python version, esbuild for TS, sql.js): label runnable blocks with the runner and its version; mark blocks whose output was recorded only on the target environment.
- [x] **A4. Report an error.** [Codex] A "Report an error" link on every topic, kata and interview page that opens a prefilled GitHub issue (title, URL, section). Requires the repository URL to be real (see A7).
- [x] **A5. Flagship tracks first.** [design → Codex] Home and `/tracks/` show 5–6 flagship tracks first (candidates by depth today: JavaScript, Python, TypeScript, Go, Rust, CS foundations, Backend); the rest sit under "More tracks" with the existing `preview` tag. No content is deleted.
- [x] **A6. Cursor rules in the correct shape.** [Codex] `/rules/{track}/cursor.mdc` becomes a downloadable `.cursor/rules/codewiki-{track}.mdc` with the frontmatter Cursor expects (`description`, `globs`, `alwaysApply`); `CLAUDE.md`/`AGENTS.md` unchanged. Document the install path on the rules page.
- [x] **A7. Repository decision.** [user, 2026-09-05] **Public, `codewiki-com/codewiki`, content CC BY-SA 4.0, code MIT.** Repository URL, `CONTRIBUTING.md`, licence files and "Edit on GitHub" are implemented locally. Repository creation/push is tracked under A8.
- [ ] **A8. Launch.** [user + GPT] Runbook: `docs/superpowers/plans/2026-09-05-launch-checklist.md`. Local preparation completed on 2026-09-09: Chromium CI lookup fixed to use `@playwright/test`; launch instructions updated for the approved public repository and GPT-only execution. Remaining: create/connect and push the repository, confirm hosted CI, deploy a Pages preview, configure the domain/HTTPS, and complete live smoke checks including mainland China access. Publication remains deferred.

## Phase B — first weeks after launch

Deepens the training side. Each item is a small design + implementation task; B1–B3 are the priority.

- [ ] **B1. Review katas that train judgment, not spotting planted bugs.** [design → Opus for schema and islands, Codex for content] Kata schema v2: `issues` may be empty (the correct verdict is "ship it"); each issue carries `severity: defect | risk | style`; new verdict kinds `needs-clarification` (the right move is to ask the requester) and `single-severe`; scoring penalises false positives and rewards the right severity; where the language runs in the browser, an optional `counterexample` test the learner can run. Scoring stays explicit: mark a line, choose a kind, compare with the key — no keyword matching pretending to grade prose. Author ~10 v2 katas per flagship track first.
- [ ] **B2. "Say what you need" exercises.** [design → Opus] A new practice item type `spec`: a one-line requirement ("debounce the search box"); the learner supplies missing constraints (empty input, stale responses, failures, unmounted state), acceptance criteria and test cases; graded against a checklist and a model answer; the prompt builder can load the result. Start with 20 items across flagship tracks.
- [x] **B3. Make AI collaboration sections optional and useful.** [GPT, completed 2026-09-07] User approved substantial rewriting or deletion across all 287 live bilingual topics. Remove unsupported model-error stereotypes, repeated review checklists and vocabulary dumps. Retain only concrete topic-specific collaboration value that remains useful as models improve; preserve unique engineering lessons in the ordinary article where needed. Update active authoring prompts and the checker so future waves do not recreate the mandatory four-part template. Completed: 279 sections removed, eight rewritten; all 18 AI-era-track articles retained. Full validation passed. Direction: `docs/design/ai-era-refresh.md`; results: `docs/superpowers/ledgers/2026-09-07-ai-era-refresh.md`.
- [ ] **B4. Flagship path "Read → Review → Specify → Verify".** [design → Opus] One new learning path built from existing topics, v2 katas and `spec` items; recommended first on the home page; includes a before/after self-measurement: a fixed set of unseen katas at the start and the end, scored locally, so a learner sees whether they find more real issues with fewer false positives.
- [ ] **B5. Scheduled re-verification.** [Opus] The sidecars under `reports/verify/**` are written by whatever runtimes the checking machine has (today: Python 3.14.3 and Node 24.14 present; Go 1.23 older than the 1.27 pin, so 29 topics show "Not run"); the workflow must refuse a sidecar from a runtime older than the pin. A GitHub Actions workflow (monthly, and on demand) that runs every runnable example against the current patch releases of the pinned runtimes, compares outputs, and opens an issue per drift; the verification panel (A3) shows the last run. This is what makes pinned versions a strength rather than a liability.
- [ ] **B6. Curated rules instead of "all pitfalls".** [design → Opus] A rules builder: choose track, framework, version and task; get a short set of rules, each with its applicability condition and a link to the topic; export in the correct file shape per tool. The full packs remain available.
- [ ] **B7. Publish the rules packs.** [Codex] A build step pushes the generated packs to a `codewiki-rules` GitHub repository and an npm package (`npx codewiki-rules python`), so the packs carry the site's name into repositories.
- [ ] **B8. Contribution flow.** [Codex] `CONTRIBUTING.md`, PR template, `content:check` in CI for PRs, a "Suggest a change" link per section that opens the file on GitHub; a page listing recent corrections and contributors.
- [ ] **B10. Shrink the shared i18n chunk.** [Opus] Every island downloads the whole `src/i18n` dictionary (both locales); the topic-page script budget had to move 60 → 62 → 66 KiB as About/offline/verification strings landed. Move page-only prose (`about.*`, `contribute.*`, `verify.*`, rules pages) into build-only modules like `src/i18n/offline.ts`, or ship one locale per build; then lower the budget back to 62 KiB.
- [ ] **B9. Bilingual alignment rule.** [Codex] Keep the gate on paragraph and code-block counts per section; explicitly allow different sentence counts inside a paragraph so the Chinese reads naturally. Document in the editorial standard.

## Phase C — later

- [ ] **C1. Distribution.** [user] Chinese channels (Juejin, Zhihu, V2EX) for the Chinese edition; measure mainland access speed and decide on a mirror if needed.
- [ ] **C2. Tier 2 polish (423 topics), flagship tracks first.** Deferred by the user on 2026-09-04. Estimate at 10-way parallelism: ~6 h wall, ~79 M Codex tokens. Command: `pnpm content:polish --tier 2 --n 10 --max 100` per batch from `.worktrees/p0-content-pipeline`. Before running it, solve the Cloudflare Pages 20,000-file ceiling (Pagefind fragment size, OG images) or change hosts.
- [ ] **C3. Tier 3 polish (238 topics).** After C2.
- [ ] **C4. Visualizer tools and compare pages.** Deferred until after launch (2026-09-05); decide from which topics readers actually use. The cheatsheet footer still shows "compared with other languages · soon".
- [ ] **C5. Rules validated with the kata bank.** Compare an agent's output on the same tasks with and without a rules pack; publish the numbers. Interesting, expensive; only after B1 and B6.
- [ ] **C6. Business model.** [user] Today: no accounts, free, static. Decide whether that is the plan (domain and audience first) or something else; the architecture does not constrain it.

## Decided against (do not reopen without the owner)

- **MCP server** — dropped by the user on 2026-09-04. The reviews argue it would connect the domain's "code wiki" association with agents; the decision stands unless the user reopens it.
- **Cutting the catalogue to five tracks** — no deletion; Phase A5 re-weights the presentation instead.
- **Renaming the site** — the domain stays; the open contribution flow (B8) gives "wiki" its meaning.

## Done (for orientation)

P0 content pipeline · P1 site foundation · P2 learning layer · tier-1 content wave (287 topics, 6 paths, 12 cheatsheets, 1,146 interview items, 1,733 practice items) · real-content UI fixes · content taxonomy pass · whole-site review and its fix round · daily kata · PWA offline · About page · full gate green on `main` (2026-09-05). Codex usage to date ≈ 60 M tokens.
