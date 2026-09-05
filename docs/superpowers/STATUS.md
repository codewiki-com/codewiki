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

## Where things are (updated 2026-09-05 00:30 local)
| Item | State |
|---|---|
| Specs / mockups | approved; P1 `docs/design/mockups/`, P2 `docs/design/mockups/p2/` |
| **Site (P1 + P2)** | merged into `main` (P1 3644c06, P2 da204bd) |
| **Content** | **merged into `main` f9540e9**: 290 reviewed bilingual topics (257 tier-1 polished + 32 new ai-era/foundations + samples), 6 learning paths + 23 checkpoint banks, 12 cheatsheets, 22 interview banks, 28 review katas, 115+ glossary terms. Gate on main: lint/check clean, 2,356 unit tests (one flaky failure on the first run passed on rerun), build 5,849 pages, Pagefind 5,784 pages, 134,751 internal links resolve |
| Content pipeline | `content:check` now compiles MDX; `content:write` kinds quiz/kata/interview/path/cheatsheet/topic; tier 2/3 deferred (TODO) |
| Next | Opus whole-site review with real content (`docs/superpowers/briefs/site-review-with-content.md`) → fix round → deploy (Cloudflare Pages) |

## Active work (updated 2026-09-05 03:10 local — Claude limit hit at ~01:15 and reset; three Opus agents resumed via message, Codex fix-ui relaunched with a finish brief)
- **Routing:** Opus for insight-heavy content, reviews, complex merges; Codex for bulk mechanical work; running jobs never re-routed.
- **Merged:** `fix-content-taxonomy` (ba8d154), `fix-content-minors` (fd252a7), `content-interview-1..4` (ac14838, d93f420, 768b4ec, ae6595f; interview bank now 1,146 items, every topic ≥ 3 except the three duplicates slated for deletion). QA pass merged (`ledgers/2026-09-05-interview-qa.md`) over all new interview items (diff since f9540e9): remove self-references like "in the article" (6 found in ts/ai-era), check zh fidelity and 60–120-word answers. **Site review done:** `ledgers/2026-09-04-site-review.md` — Not ready: C1 practice hub ships 1,748 cards (1.77 MB), I1 duplicate topics, I2 cheatsheet snippets unfocusable, I3 rules cut mid-sentence, I4 e2e 50 failures (mostly stale fixtures), I5 interview coverage 132 topics < 3 items, 11 minors. Rulings written: `docs/superpowers/briefs/site-review-fix-round.md`.
- **Merged:** `fix-ui-real-content` (a9a459c; hero mock capped at 4 rows, wrapping track filter, path-map label clipping; screenshots reviewed by the design lead), `qa-interview` (581ff83; 11 items touched).
- **Running — Opus:** PWA offline on `feat-pwa` (report → `ledgers/2026-09-04-pwa-report.md`); daily kata on `feat-daily-kata` (design `docs/design/daily-kata.md`, Chinese 每日一练; report → `ledgers/2026-09-04-daily-kata-report.md`).
- **Running — Opus fix round** on `fix-site-review` (from a9a459c; rulings in `docs/superpowers/briefs/site-review-fix-round.md`; report → `ledgers/2026-09-05-site-review-fix-round.md`; it merges `main` before its gate).
- **Merge order (remaining):** daily-kata → pwa → fix-site-review; after each merge `pnpm lint && pnpm check && pnpm test`; then full gate on `main` (`pnpm build && pnpm check:links && pnpm test:e2e && pnpm exec lhci autorun`), then deploy prep (Cloudflare Pages needs the user's auth).
- Branches: `p0-content-pipeline` (worktree kept for future tier-2 runs), `p2-learning-layer`, `p1-site-foundation` are merged; `p0-generate` worktree removed.
- Resume rule: `git log --oneline -3`; Codex logs end with `end … exit=<code>` and `TASK DONE`/`TASK FAILED`; Opus subagent reports live under `docs/superpowers/ledgers/` on their branches. Never re-dispatch a job whose branch already has commits or a report.

## TODO (deferred by the user)
- **MCP server: dropped** by the user on 2026-09-04 (do not build). P3 keeps compare pages, visualizer tools and the daily kata surface.
- **Tier 2 polish (423 topics)** — decided 2026-09-04 by the user: not now. Estimate at 10-way parallelism: ~6 h wall, ~79 M Codex tokens (tier 1 averaged 187 k per topic). Command when the time comes: `pnpm content:polish --tier 2 --n 10 --max 100` per batch from `.worktrees/p0-content-pipeline`.
- **Tier 3 polish (238 topics)** — same, after tier 2.
- Codex usage so far (2026-09-04, logs on disk): ~48 M polish, ~3 M generation, ~4 M code tasks ≈ 55 M.

## How to resume
1. `git worktree list` and `git log --oneline --all | head` to see the active branch and last milestone.
2. Open the active plan under `docs/superpowers/plans/` and find the first unchecked task.
3. For content jobs, check `reports/polish/state.json` (created by the pipeline) before re-running anything.
4. Keep this file current.
