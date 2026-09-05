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

## Where things are (updated 2026-09-05 09:30 local)
| Item | State |
|---|---|
| Specs / mockups | approved; P1 `docs/design/mockups/`, P2 `docs/design/mockups/p2/` |
| **Site (P1 + P2)** | merged into `main` (P1 3644c06, P2 da204bd) |
| **Content** | **merged into `main` f9540e9**: 290 reviewed bilingual topics (257 tier-1 polished + 32 new ai-era/foundations + samples), 6 learning paths + 23 checkpoint banks, 12 cheatsheets, 22 interview banks, 28 review katas, 115+ glossary terms. Gate on main: lint/check clean, 2,356 unit tests (one flaky failure on the first run passed on rerun), build 5,849 pages, Pagefind 5,784 pages, 134,751 internal links resolve |
| Content pipeline | `content:check` now compiles MDX; `content:write` kinds quiz/kata/interview/path/cheatsheet/topic; tier 2/3 deferred (TODO) |
| Next | Opus whole-site review with real content (`docs/superpowers/briefs/site-review-with-content.md`) → fix round → deploy (Cloudflare Pages) |

## Active work (updated 2026-09-05 09:30 local)
- **Pre-launch work is complete on `main` (HEAD fbeac0c).** Everything from P0–P2, the content wave (290 topics → 287 after retiring 3 duplicates), the site review and its fix round, daily kata (每日一练), PWA offline, kata titles, interview coverage + QA, About page.
- **Last full gate on `main`** (2026-09-05, root checkout, before the follow-ups merge): lint, check, 2,383 unit → after follow-ups 2,392 unit green; build 5,866 pages, 0 warnings; 134k+ links + 6 redirects resolve; e2e 259/259 (4 load-induced flakes passed in isolation); Lighthouse: two performance medians missed 0.95 (`/python/` 0.88, `/cheatsheets/python/` 0.81) while the load average was 12–17 — a quiet-machine rerun is scheduled (log `main-lhci-2.log` in the session scratchpad). If it still fails on a quiet machine, treat it as a real finding and open an Opus fix task (hub and cheatsheet main-thread work).
- **No agent running** except that Lighthouse rerun watcher. Deploy is deferred (see TODO / launch checklist).
- Housekeeping: stale worktrees `p0-t13-extract` and `p1-site-foundation` can be removed (`git worktree remove`); `p0-content-pipeline` stays for future tier-2 runs. Kill any leftover `python3 -m http.server` preview before screenshotting (check `ss -ltnp`).

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
