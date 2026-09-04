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

## Where things are (updated 2026-09-04 17:40 local)
| Item | State |
|---|---|
| Specs / mockups | approved; P1 `docs/design/mockups/`, P2 `docs/design/mockups/p2/` |
| **P1 site foundation** | merged into `main` 3644c06 |
| **P2 learning layer** | **merged into `main` da204bd** (P2a + P2b: practice, kata pages, checkpoints, paths + map, interview banks, flashcards, cheatsheets, bilingual mode, playground with SQL/HTML, prompt builder, rules/context packs, block-level Ask-AI, try-to-break, content write runner). Gate on main: 363 unit, 1,939 links; branch e2e 234, Lighthouse 10 URLs ≥ 0.95. Ledger + reviews archived in `docs/superpowers/ledgers/`. Watch item: topic-page script is 61,429 B of the 61,440 B budget |
| P0 content pipeline | Tasks 1–13 complete on `p0-content-pipeline`; wave 1 COMPLETE — 257/257 tier-1 topics polished (P0 branch 135a01c). The P0 branch still lacks P1-final and all of P2: merge `main` into it after batch 8, then `p0-content-pipeline` into `main` |
| Content generation (next) | with the P2 write runner in the P0 worktree: 8 interview banks, 6 paths (+ checkpoint banks), 12 cheatsheets, ~30 review katas, quiz banks for tier-1 topics lacking one; then ai-era/foundations new topics and the glossary to 300+ |

## Active work (updated 2026-09-04 17:40 local)
- **Codex ×N** (user: open as many as needed). main merged into P0 (474fe05). Polish wave 1 finished (257/257). New topics done (32 written on `p0-generate`, 4a8e54d; ai-era 21 and foundations 23 topics now exist). All generation done (6 paths, 12 cheatsheets, 28 katas, 8 interview banks, 32 new topics) and `p0-generate` merged into `p0-content-pipeline`. The merged build fails on raw angle brackets in polished prose (MDX parses them as JSX; the gate never compiled MDX) — Codex is adding an MDX compile stage to `content:check` and fixing every offender (`mdx-compile-check-codex.md`). Then: P0 → `main`, rebuild, deploy prep. interview banks for 7 tracks (done, 3e8ffd5) and the conformance-v3 pass (done, 5f6e9f6 — all 258 topics conform) in `.worktrees/p0-content-pipeline`. After both: `ai-era` interview bank + `cs-foundations` path, merge `p0-generate` → `p0-content-pipeline` → `main`, rebuild, deploy prep. content generation in `.worktrees/p0-generate` (branch `p0-generate` from 474fe05; log scratchpad `generate/wave.log`): generation wave 1 done: 5 paths + 23 checkpoint banks, 5 cheatsheets, 27 katas (commits on `p0-generate`); wave 2 done: 12/12 cheatsheets; `cs-foundations` path deferred until the foundations topics exist. New-topic list approved (`content/new-topics.yaml`: 18 ai-era + 20 foundations); Codex is adding `--kind topic` to the write runner, then the new topics are written at `--n 10`; interview banks after the polish wave. Interview banks run after the polish wave (they append to files the wave also writes). Then merge `p0-generate` into `p0-content-pipeline`, conformance pass, P0 → main.
- **Next steps in order:** (1) when batch 8 ends: `git merge main` in the P0 worktree (expect conflicts only in `src/schemas/quiz.ts`/`interview.ts`, `scripts/content/check.ts`, `tests/unit/content-fixtures.test.ts`; Task 17 copied P0 files verbatim so most is clean), run `pnpm test`, commit; (2) start batch 9 (`--tier 1 --n 10 --max 50`) and, in parallel from the same worktree? NO — one runner per worktree: run content generation later or in a second worktree of the same branch is unsafe; sequence generation after the polish wave, or run generation from a `p0-generate` worktree on a branch cut from P0 and merge back; (3) `conformance-v3-codex.md` (Codex); (4) merge P0 into `main`, rebuild, deploy prep.
- Resume rule: `git log --oneline -3` per branch; Codex logs end with `end … exit=<code>` and `TASK DONE`/`TASK FAILED`; an interrupted polish batch is resumed by re-running the same `content:polish` command.

## TODO (deferred by the user)
- **Tier 2 polish (423 topics)** — decided 2026-09-04 by the user: not now. Estimate at 10-way parallelism: ~6 h wall, ~79 M Codex tokens (tier 1 averaged 187 k per topic). Command when the time comes: `pnpm content:polish --tier 2 --n 10 --max 100` per batch from `.worktrees/p0-content-pipeline`.
- **Tier 3 polish (238 topics)** — same, after tier 2.
- Codex usage so far (2026-09-04, logs on disk): ~48 M polish, ~3 M generation, ~4 M code tasks ≈ 55 M.

## How to resume
1. `git worktree list` and `git log --oneline --all | head` to see the active branch and last milestone.
2. Open the active plan under `docs/superpowers/plans/` and find the first unchecked task.
3. For content jobs, check `reports/polish/state.json` (created by the pipeline) before re-running anything.
4. Keep this file current.
