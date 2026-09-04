# codewiki — Project Status (resume point)

Read this first in any new session. Update it at every milestone and before starting any long-running job.

## Roles
- **Fable**: planning, architecture, review, all UI/visual design. Never writes bulk code or content.
- **Opus subagents**: implement code from the plans (`model: "opus"` explicitly).
- **Codex CLI** (`codex exec --dangerously-bypass-approvals-and-sandbox -m gpt-5.6-sol -c model_reasoning_effort=xhigh -C <repo>`): content polish, translation, bulk edits; may implement non-visual code.
- Language rule: all repo artefacts (docs, comments, commits, identifiers) in English; chat with the user in Chinese.

## Decisions log
- 2026-09-03 Content strategy: tiered restructure + Codex polish in waves; publish only `status: reviewed`.
- 2026-09-03 Translation: Codex does polish and translation; no Claude QA pass.
- 2026-09-03 Framework: plain Astro 7 + custom design system (no Starlight). Static output, no accounts; localStorage + export/import.
- 2026-09-03 Visual: light = "Studio Precision", dark = "Night Lab" palette; one layout, IBM Plex type; theme follows system, user-toggleable. Mockups: https://claude.ai/code/artifact/81ecf530-fd51-468d-86e2-1ba247b85067
- 2026-09-03 AI-era integration added to spec §6.1 (content: "In the AI era" block per topic, ai-era track, rules packs, review katas; form: prompt-ready pages, JSON API, MCP server later).
- 2026-09-03 Execution mode: subagent-driven development, one Opus subagent per plan task, Fable reviews between tasks. P1 first (Tasks 0–8), then P0 in parallel once P1 Task 6 (schemas) exists.
- 2026-09-04 P2 learning-layer mockups drafted by Fable (practice hub, review-the-AI's-code kata, flashcards, interview bank, cheatsheet, bilingual topic, prompt builder; light + dark). Sources `docs/design/mockups/p2/`, canvas: https://claude.ai/code/artifact/23900b82-1533-43f2-b3fc-eeb05070c137 — awaiting user review before the P2 plan.
- 2026-09-03 Spec approved by user: `docs/superpowers/specs/2026-09-03-codewiki-design.md` (including §6.1 AI-era integration).

## Where things are (updated 2026-09-04, 04:45)
| Item | State |
|---|---|
| Master spec | done, approved |
| Design mockups (16 artboards, light/dark) | done, approved; sources in `docs/design/mockups/` |
| P1 plan (site foundation, 20 tasks) | Tasks 0–18 complete and merged into `p1-site-foundation` (HEAD `faabc37`): scaffold, tokens/theme, fonts, i18n, tracks, collections + sample topics, SEO, layout, home, track hub, markdown pipeline, topic page, runners (JS sandbox + Pyodide), glossary, search palette (Pagefind), Ask-AI + markdown twin, endpoints/settings/RSS/llms.txt, OG images. Task 19 (e2e, axe, Lighthouse, `_headers`, deploy doc) dispatched 2026-09-04 04:45; then final whole-branch review, then merge to `main` |
| P0 plan (content pipeline, 14 tasks) | Tasks 1–10 and 13 complete on `p0-content-pipeline` (HEAD `b94d82f`); Task 11 (Codex polish runner) implemented at `87cef34`, review found 3 Important (gate accepted non-DONE Codex, batch commit staged whole `src/content`, interrupt commit did not wait) — fix round 1 dispatched; Tasks 12 (calibration, 5 topics) and 14 (wave 1, tier 1 = 252 topics) pending |
| Content | 4 sample MDX topics + 7 glossary terms + 1 quiz by Codex; 918 staged pairs in `content/staging/topics` with tiers 252/425/241 |

## Active work (updated 2026-09-04 04:45, parallel mode)
- **P1** `p1-site-foundation` (worktree `.worktrees/p1-site-foundation/`): Task 19 implementer running (report → `.superpowers/sdd/2026-09-03-p1-site-foundation/task-19-report.md`). All parallel task branches (`p1-t14-glossary`, `p1-t15-search`, `p1-t16-askai`, `p1-t17-endpoints`, `p1-t18-og`) are merged; they can be deleted after the final review. Ledger: `.worktrees/p1-site-foundation/.superpowers/sdd/2026-09-03-p1-site-foundation/progress.md` (18 deferred minors listed per task for the final review).
- **P0** `p0-content-pipeline` (worktree `.worktrees/p0-content-pipeline/`): Task 11 fix round 1 running (report → `.superpowers/sdd/2026-09-03-p0-content-pipeline/task-11-fix1-report.md`; review at `task-11-review.md`). Next: scoped re-review, then Task 12 calibration via Codex on `backend/jwt-authentication`, `cpp/move-semantics`, `python/asyncio`, `ai/langchain`, `architecture/cap-theorem`, then Task 14 wave 1. Rebase P0 onto `main` after P1 merges.
- **P2** (learning layer: paths pages, quizzes/predict/review katas, bilingual mode, flashcards, playground, cheatsheets, compare; new ai-era/foundations content via Codex): plan not yet written — Fable writes it with superpowers:writing-plans from spec §6/§14 once P1 is merged.
- Resume rule: for every branch above, `git log --oneline -3` shows whether the implementer committed; if a `task-N-report.md` exists but no review entry is in the ledger, dispatch the task review (superpowers:subagent-driven-development) before merging.

## How to resume
1. `git worktree list` and `git log --oneline --all | head` to see the active branch and last milestone.
2. Open the active plan under `docs/superpowers/plans/` and find the first unchecked task.
3. For content jobs, check `reports/polish/state.json` (created by the pipeline) before re-running anything.
4. Keep this file current.
