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
- 2026-09-04 P2 sub-spec `docs/superpowers/specs/2026-09-04-p2-learning-layer-design.md` approved (user: “你自己决策，选最佳的”); decisions: 4 flashcard ratings, 2-column print, paired bilingual default, kata with line comments, CodeMirror 6 lazy. Next: P2 plan.
- 2026-09-03 Spec approved by user: `docs/superpowers/specs/2026-09-03-codewiki-design.md` (including §6.1 AI-era integration).

## Where things are (updated 2026-09-04, 06:30)
| Item | State |
|---|---|
| Master spec | done, approved |
| P2 sub-spec | `docs/superpowers/specs/2026-09-04-p2-learning-layer-design.md` approved (decisions §7) |
| Design mockups | P1: `docs/design/mockups/`; P2: `docs/design/mockups/p2/` (build with `p2/src/build.py`), canvas https://claude.ai/code/artifact/23900b82-1533-43f2-b3fc-eeb05070c137 |
| P1 plan (20 tasks) | Tasks 0–18 merged into `p1-site-foundation` (faabc37). Task 19 implemented at `a734c3e` on the same branch — **review pending**. Visual sweep branch `p1-visual-sweep` (9080d23, worktree `.worktrees/p1-visual-sweep`) — **review running**; merge it into `p1-site-foundation` after Task 19 (expect conflicts in TrackHub.astro, 404.astro, Nav/Footer, global.css; keep both sides). Then: contrast token pass (Fable, see ledger ruling), final whole-branch review (opus), merge to `main` |
| P0 plan (14 tasks) | Tasks 1–11 and 13 complete on `p0-content-pipeline` (89e811b + tier pins df2d3c5). Task 12 calibration **started**: `pnpm content:polish --only backend/jwt-authentication` running in the background from the P0 worktree (log: scratchpad `polish/jwt.log`; journal `reports/polish/state.json`; the runner commits on success). Next: inspect the produced pair + `reports/polish/backend__jwt-authentication/`, then the other four with `--n 4`, then tune `prompts/polish-topic.md`, then Task 14 wave 1 |
| P2 plan | `docs/superpowers/plans/2026-09-04-p2-learning-layer.md` written (17 tasks; P2a = 1–11, P2b = 12–17). Execution starts on branch `p2-learning-layer` from `main` after the P1 merge |
| Content | 4 sample topics + 7 glossary terms + 1 quiz; 918 staged pairs; tiers 257/423/238 after the calibration pins |

## Active work (updated 2026-09-04 14:00 local)
- **Routing (user, 2026-09-04):** implementation and routine reviews go to Codex via `scripts/dev/codex-task.sh <worktree> <brief> <log>`; Fable plans, designs, rules, reviews results, merges. Opus only as fallback.
- **P1** `p1-site-foundation` (82d9935): Task 19 complete (fix round by Codex, gate run by Fable, 09d4913); sweep V1 merged. Running on Codex: Design D1 contrast tokens (brief `design-d1-contrast-codex.md`, log `codex-d1-contrast.log`) in this worktree; Task 20 Mermaid fix round 1 in `.worktrees/p1-t20-mermaid` (211dbff + fix; brief `task-20-fix1-codex.md`). Then: merge `p1-t20-mermaid`, final whole-branch review (Codex, Fable reads), merge to `main`, rebase P0 and start P2.
- **P0** `p0-content-pipeline`: Task 12 calibration complete — 5 topics polished (`reports/polish/calibration.md`), prompt v3 landed. Task 14 wave 1 in progress — 25/257 tier-1 topics polished (batch 1 done 2026-09-04, batch 2 running): `pnpm content:polish --tier 1 --n 4 --max 20` per batch from the P0 worktree; journal `reports/polish/state.json`; the runner commits every 10 topics. ~46 M Codex tokens / ~18 h for the 257 tier-1 topics.
- **P2**: plan ready (`docs/superpowers/plans/2026-09-04-p2-learning-layer.md`); starts after the P1 merge on `p2-learning-layer`, Codex per task with Fable review.
- Resume rule: `git log --oneline -3` per branch; Codex logs end with `end … exit=<code>` and `TASK DONE`/`TASK FAILED`; a wave that was interrupted is resumed by re-running the same `content:polish` command.

## How to resume
1. `git worktree list` and `git log --oneline --all | head` to see the active branch and last milestone.
2. Open the active plan under `docs/superpowers/plans/` and find the first unchecked task.
3. For content jobs, check `reports/polish/state.json` (created by the pipeline) before re-running anything.
4. Keep this file current.
