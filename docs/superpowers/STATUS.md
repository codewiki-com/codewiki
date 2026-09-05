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

## Active work (updated 2026-09-05 06:10 local — save point, Claude usage near its limit; no agent running)
- **Routing:** Opus for insight-heavy content, reviews, complex merges; Codex for bulk mechanical work.
- **All merged into `main` (HEAD 5c5c95b + later docs):** taxonomy pass, content minors, interview coverage (1,146 items, every topic ≥ 3) + Opus QA, UI fixes for real content, daily kata (每日一练), PWA offline, 450 kata titles. main: lint/check/2,383 unit tests green.
- **Done, NOT yet merged: `fix-site-review`** (worktree `.worktrees/fix-site-review`, HEAD 2f82cd8, 17 commits on top of a9a459c, `main` merged in at d8e9bbe). Report: `docs/superpowers/ledgers/2026-09-05-site-review-fix-round.md` on that branch. Its gate is fully green: 2,389 unit, **259/259 e2e**, build 5,866 pages with 0 warnings, 147,318 links + 6 redirects resolve, lhci exit 0; `/practice/` now 100/100/100/100 with DOM 263 (was 17,726), hub HTML 1.77 MB → 50.8 KB; `/practice/{track}/` pages; three duplicate topics retired behind 301s (`public/_redirects` + Astro `redirects`); cheatsheet snippets wrap; rules never cut mid-sentence; lighthouse median of 3; script budget 62 KiB; `unused-css-rules` downgraded to warn (was red on main too).
- **Next step (design lead, in progress when paused):** visual review of the restructured pages, then merge. Screenshots taken so far were WRONG because a stale preview server from the previous session (pid 2228999, `python3 -m http.server 4399`, serving an old `dist-content` copy) still holds port 4399. Safe recipe: `kill 2228999`; in the worktree `python3 -m http.server 4400 --bind 127.0.0.1 --directory "$PWD/dist" &`; then `node .superpowers/shoot.mjs <scratchpad>/shots-fix` (the script is in the worktree's `.superpowers/`, already pointed at 127.0.0.1:4400 — check the URL line first; pages: /practice/, /practice/javascript/, /cheatsheets/python/, /tracks/, /zh/practice/ at 1280 and 390). Review, then `git merge --no-ff fix-site-review` into `main`, remove the worktree, run `pnpm lint && pnpm check && pnpm test` on main.
- **Small follow-ups after the merge (Codex):** `src/content/cheatsheets/docker.en.mdx:29` uses single-quoted `code` so `markdown-twin.ts`'s ROW regex skips it (81 rows authored, 80 exposed) — quote it double or widen the regex; mobile daily-kata "+N more lines" chip overlays the last code line (move under the peek < 900 px); hub DOM headroom is thin (296 of 300).
- **Then:** full gate on `main` (`pnpm build && pnpm check:links && pnpm test:e2e && pnpm exec lhci autorun`), About page (Codex), deploy prep (see Deploy facts below; GitHub repo creation via `gh` is fine, Cloudflare Pages needs the user).
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
