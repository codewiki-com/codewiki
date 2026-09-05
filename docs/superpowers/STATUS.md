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

## Active work (updated 2026-09-05 06:40 local)
- **Merged into `main`:** everything, including the site-review fix round (7b38f2d; screenshots of `/practice/`, `/practice/javascript/`, `/tracks/`, `/cheatsheets/python/` reviewed by the design lead). Report: `docs/superpowers/ledgers/2026-09-05-site-review-fix-round.md`.
- **Running:** full gate on `main` (root checkout, `nohup`, log `main-full-gate.log` in the session scratchpad, ends with `end … exit=`): lint → check → test → build → check:links → test:e2e → lhci. Expected ~40 min.
- **Running — Codex** on `fix-followups` (worktree; brief `.superpowers/sdd/followups/brief.md`, log `codex.log`, report `report.md` there): docker cheatsheet single-quoted row, daily-kata mobile chip under the peek, About page (`/about/`, `/zh/about/`, footer link).
- **Then:** review + merge `fix-followups`; rerun `pnpm lint && pnpm check && pnpm test` on main. Deploy is **not urgent** (user, 2026-09-05): when asked, create the GitHub repo with `gh`, push, Cloudflare Pages (user), verify headers/CSP/sw on the live site.
- Stale preview servers were killed (ports 4399/4400); no other background processes belong to us.
## TODO (deferred by the user)
- **Deploy / launch: deferred by the user on 2026-09-05.** Runbook: `docs/superpowers/plans/2026-09-05-launch-checklist.md` (GitHub repo via `gh`, Cloudflare Pages settings, domain, post-deploy verification incl. the PWA on iOS).
- **MCP server: dropped** by the user on 2026-09-04 (do not build). **Visualizer tools and compare pages: deferred until after launch** (2026-09-05; decide then, based on which topics readers actually use). The daily kata surface is done.
- **Tier 2 polish (423 topics)** — decided 2026-09-04 by the user: not now. Estimate at 10-way parallelism: ~6 h wall, ~79 M Codex tokens (tier 1 averaged 187 k per topic). Command when the time comes: `pnpm content:polish --tier 2 --n 10 --max 100` per batch from `.worktrees/p0-content-pipeline`.
- **Tier 3 polish (238 topics)** — same, after tier 2.
- Codex usage so far (2026-09-04, logs on disk): ~48 M polish, ~3 M generation, ~4 M code tasks ≈ 55 M.

## How to resume
1. `git worktree list` and `git log --oneline --all | head` to see the active branch and last milestone.
2. Open the active plan under `docs/superpowers/plans/` and find the first unchecked task.
3. For content jobs, check `reports/polish/state.json` (created by the pipeline) before re-running anything.
4. Keep this file current.
