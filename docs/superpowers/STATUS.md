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

## Where things are (updated 2026-09-04 17:20 local)
| Item | State |
|---|---|
| Master spec / P2 sub-spec | approved |
| Design mockups | P1 `docs/design/mockups/`, P2 `docs/design/mockups/p2/` (canvas https://claude.ai/code/artifact/23900b82-1533-43f2-b3fc-eeb05070c137) |
| **P1 site foundation** | **complete and merged into `main` (3644c06)**: Tasks 0–20 incl. Mermaid diagrams, visual sweep, WCAG AA contrast pass, final review + fix round (224 unit tests, 99 e2e, Lighthouse ≥ 0.99 perf, 1,112 internal targets resolve). Branches `p1-*` can be deleted (`git worktree remove` + `git branch -d`) |
| P0 content pipeline | Tasks 1–13 complete on `p0-content-pipeline`; Task 14 wave 1 in progress (tier 1: 83/257 polished after batches 1–4; a link-checker/sidecar-validation hygiene fix runs between batches; batch 5 next). P0 branch still needs `main` merged in after the current batch (it carries the P1 code from before Task 19) |
| P2 learning layer | plan `docs/superpowers/plans/2026-09-04-p2-learning-layer.md`; worktree `.worktrees/p2-learning-layer` (branch from main 3644c06); ledger `.worktrees/p2-learning-layer/.superpowers/sdd/2026-09-04-p2-learning-layer/progress.md`; Tasks 1–11 complete (P2a implemented: 159 e2e, Lighthouse 8 URLs pass); P2a design sweep running on Codex (brief sweep-p2a-codex.md), then whole-branch review (brief review-p2a-codex.md), then merge to main; P2b (Tasks 12–17) briefs ready |
| Content | 45+ reviewed topic pairs in `src/content/topics` on the P0 branch, 115+ glossary terms, 20 interview banks, quiz banks per topic |

## Active work (updated 2026-09-04 21:10 local)
- Codex quota restored 2026-09-04 evening (user): content polish resumed (attempts of the 15 quota failures reset to 0; batch 7 running); the P2a fix round is being finished by an Opus subagent (it inherited Codex's uncommitted work), after which reviews and P2b go back to Codex.
- **Routing:** Codex implements and does routine reviews (`scripts/dev/codex-task.sh <worktree> <brief> <log>`); Fable plans, designs, rules, reviews results, merges.
- **P2b in parallel (2026-09-04 evening, Codex ×5):** branches `p2-t12-bilingual`, `p2-t13-playground`, `p2-t14-prompt-builder`, `p2-t15-block-askai`, `p2-t17-content-runner` (worktrees `.worktrees/p2-t*`), each cut from `39796eb`; logs scratchpad `codex-p2-tNN.log`; reports in each worktree's `.superpowers/sdd/2026-09-04-p2-learning-layer/task-NN-report.md`. Fable reviews each, merges into `p2-learning-layer` (append conflicts in i18n/global.css/site.ts), then Task 16 on the merged branch, whole-branch review, merge to `main`.
- **P2a** on `p2-learning-layer` (worktree `.worktrees/p2-learning-layer`, HEAD 4da57cf): Tasks 1–11 + sweep done. Whole-branch review → **Not ready** (1 Critical: kata answers shipped in HTML; 7 Important: zh placeholders, answer-free API leak, corrupt-store crash, path-map a11y, checkpoint focus, Lighthouse forced-reflow gate, two deleted P1 reports). **Next step on resume:** `scripts/dev/codex-task.sh .worktrees/p2-learning-layer .worktrees/p2-learning-layer/.superpowers/sdd/2026-09-04-p2-learning-layer/fix-p2a-codex.md <log>`, then a scoped re-review (write a brief like `final-rereview-codex.md` from P1), then merge to `main` and start P2b Task 12 (`task-12-codex.md`).
- **P0 wave 1** on `p0-content-pipeline` (worktree `.worktrees/p0-content-pipeline`): batch 5 finished — 103/257 polished (commit 7542907 on the P0 branch). Next: launch batch 6 (`pnpm content:polish --tier 1 --n 4 --max 20`), and so on until `pnpm content:status` shows tier 1 complete; then run `conformance-v3-codex.md` (Codex) and merge `main` into `p0-content-pipeline`, then `p0-content-pipeline` into `main`.
- Resume rule: `git log --oneline -3` per branch; a Codex log ends with `end … exit=<code>` and `TASK DONE`/`TASK FAILED`; an interrupted polish batch is resumed by re-running the same `content:polish` command (the journal skips finished topics).

## How to resume
1. `git worktree list` and `git log --oneline --all | head` to see the active branch and last milestone.
2. Open the active plan under `docs/superpowers/plans/` and find the first unchecked task.
3. For content jobs, check `reports/polish/state.json` (created by the pipeline) before re-running anything.
4. Keep this file current.
