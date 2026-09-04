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
- 2026-09-03 Spec approved by user: `docs/superpowers/specs/2026-09-03-codewiki-design.md` (including §6.1 AI-era integration).

## Where things are (updated 2026-09-04)
| Item | State |
|---|---|
| Master spec | done, approved |
| Design mockups (16 artboards, light/dark) | done, approved; sources in `docs/design/mockups/` |
| P1 plan (site foundation, 20 tasks) | Tasks 0–11 complete (scaffold, tokens/theme, fonts, i18n + zh UI copy by Codex, tracks, content collections + Codex sample topics, SEO lib, layout shell, home, track hub, markdown pipeline); Task 12 (topic page) implemented at `3176c06`, fix round 1 in progress (readPct must ignore depth-hidden headings; breadcrumb root crumb; inert progressbar role); Tasks 13–19 pending (runners, glossary, search, Ask-AI + md twin, endpoints/settings, OG images, e2e/lighthouse/headers) |
| P0 plan (content pipeline, 14 tasks) | Tasks 1–7 complete (libs, inventory, mapping accepted with overrides, import → `content/staging` 918 pairs, zh typography linter, code checker, link checker); Task 8 (alignment checker) implemented at `bca79da`, review pending; P1 branch merged into P0 at `9cbe928`; Tasks 9–14 pending (tiers, check/state, polish runner, calibration, extract, wave 1) |
| Content | 4 sample MDX topics + 7 glossary terms + 1 quiz by Codex; `python/closures` aligned, `javascript/event-loop` marked `aligned: false` (needs a Codex translate-topic pass) |

## Active work (updated 2026-09-04, parallel mode)
- **P1** main branch `p1-site-foundation` (worktree `.worktrees/p1-site-foundation/`): Tasks 0–12 complete; Task 13 (runners) implemented at `b7767e7`, review pending. Ledger: `.worktrees/p1-site-foundation/.superpowers/sdd/2026-09-03-p1-site-foundation/progress.md`.
- **P1 parallel branches** (each cut from `683adcf`, one task each, Opus implementer dispatched 2026-09-04): `p1-t14-glossary` (Task 14), `p1-t15-search` (Task 15), `p1-t16-askai` (Task 16), `p1-t17-endpoints` (Task 17), `p1-t18-og` (Task 18); worktrees `.worktrees/p1-<branch>/`; reports go to the main P1 ledger dir as `task-N-report.md`. After each task's review passes, merge its branch into `p1-site-foundation` (expect append-only conflicts in `src/i18n/*.ts`, `src/styles/global.css`, `Base.astro`, `Topic.astro`, `pnpm-lock.yaml`). Task 19 (e2e/lighthouse/headers) runs last on the merged branch.
- **P0** main branch `p0-content-pipeline` (worktree `.worktrees/p0-content-pipeline/`, P1 merged in at `9cbe928`): Tasks 1–9 complete; Task 10 (check/lint/state/status) dispatched; parallel branch `p0-t13-extract` (Task 13 sidecar extraction) dispatched from `55333c6`. Ledger: `.worktrees/p0-content-pipeline/.superpowers/sdd/2026-09-03-p0-content-pipeline/progress.md`.
- Resume rule: for every branch above, `git log --oneline -3` shows whether the implementer committed; if a `task-N-report.md` exists but no review entry is in the ledger, dispatch the task review (superpowers:subagent-driven-development) before merging.

## How to resume
1. `git worktree list` and `git log --oneline --all | head` to see the active branch and last milestone.
2. Open the active plan under `docs/superpowers/plans/` and find the first unchecked task.
3. For content jobs, check `reports/polish/state.json` (created by the pipeline) before re-running anything.
4. Keep this file current.
