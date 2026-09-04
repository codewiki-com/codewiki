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

## Where things are
| Item | State |
|---|---|
| Master spec | done, approved |
| Design mockups (16 artboards, light/dark) | done, approved |
| P1 plan (site foundation) | done: `docs/superpowers/plans/2026-09-03-p1-site-foundation.md` (20 tasks) |
| P0 plan (content pipeline) | done: `docs/superpowers/plans/2026-09-03-p0-content-pipeline.md` (14 tasks); briefs in `prompts/` |
| Repo scaffold | done (P1 Task 1): Astro 7 + Tailwind 4 + Preact, ESLint/Prettier/Vitest/Playwright, CI |
| Content collections | done (P1 Task 6): schemas in `src/schemas/`, `src/content.config.ts`, `src/lib/content.ts`; sample content pending Codex (`prompts/write-sample-topics.md`) |
| Topic page | done (P1 Task 12): `src/pages-shared/Topic.astro`, depth dial, table of contents, read tracking |
| Content import | not started (source: `../old/src/content/docs`, 925 pairs) |

## How to resume
1. `git log --oneline | head` to see the last milestone.
2. Open the active plan under `docs/superpowers/plans/` and find the first unchecked task.
3. For content jobs, check `reports/polish/state.json` (created by the pipeline) before re-running anything.
4. Keep this file current.
