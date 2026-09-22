# codewiki — Project Status (resume point)

Read this first in any new session. Update it at every milestone and before starting any long-running job.

## Roles
- **Coordinator (GPT)**: planning, architecture, design decisions, integration and review.
- **GPT-5.6 Sol**: implementation, content editing and translation; choose `high` for bounded work and `xhigh` when the reasoning demands it. Current AI-section cleanup uses Sol high.
- **GPT-only execution**: the user no longer uses Claude for this project (2026-09-07). Older model assignments in plans and ledgers are historical, not requirements for new work.
- Language rule: all repo artefacts (docs, comments, commits, identifiers) in English; chat with the user in Chinese.

## Decisions log
- 2026-09-07: AI collaboration sections are optional. The user approved major rewriting or deletion of unsupported AI-error framing and repetitive material, with concrete collaboration advice retained only where it earns its place. Design: `docs/design/ai-era-refresh.md`; 287 bilingual pairs reviewed using Sol high editors; 279 sections removed and eight rewritten. Record: `docs/superpowers/ledgers/2026-09-07-ai-era-refresh.md`.
- 2026-09-05: repository will be public at `github.com/codewiki-com/codewiki`; content licence CC BY-SA 4.0, code MIT (user). Phase A of the ROADMAP started: design notes `docs/design/home-hero-kata.md`, `verification-panel.md`, `flagship-tracks.md`.
- 2026-09-03 Content strategy: tiered restructure + Codex polish in waves; publish only `status: reviewed`.
- 2026-09-03 Translation: Codex does polish and translation; no Claude QA pass.
- 2026-09-03 Framework: plain Astro 7 + custom design system (no Starlight). Static output, no accounts; localStorage + export/import.
- 2026-09-03 Visual: light = "Studio Precision", dark = "Night Lab" palette; one layout, IBM Plex type; theme follows system, user-toggleable. Mockups: https://claude.ai/code/artifact/81ecf530-fd51-468d-86e2-1ba247b85067
- 2026-09-03 AI-era integration added to spec §6.1 (content: "In the AI era" block per topic, ai-era track, rules packs, review katas; form: prompt-ready pages, JSON API, MCP server later).
- 2026-09-03 Execution mode: subagent-driven development, one Opus subagent per plan task, Fable reviews between tasks. P1 first (Tasks 0–8), then P0 in parallel once P1 Task 6 (schemas) exists.
- 2026-09-04 P2 learning-layer mockups drafted by Fable (practice hub, review-the-AI's-code kata, flashcards, interview bank, cheatsheet, bilingual topic, prompt builder; light + dark). Sources `docs/design/mockups/p2/`, canvas: https://claude.ai/code/artifact/23900b82-1533-43f2-b3fc-eeb05070c137 — awaiting user review before the P2 plan.
- 2026-09-04 P2 sub-spec `docs/superpowers/specs/2026-09-04-p2-learning-layer-design.md` approved (user instruction, translated: “Use your judgment and choose the best option”); decisions: 4 flashcard ratings, 2-column print, paired bilingual default, kata with line comments, CodeMirror 6 lazy. Next: P2 plan.
- 2026-09-03 Spec approved by user: `docs/superpowers/specs/2026-09-03-codewiki-design.md` (including §6.1 AI-era integration).

## Earlier milestones (2026-09-05 09:30 local; current state below)
| Item | State |
|---|---|
| Specs / mockups | approved; P1 `docs/design/mockups/`, P2 `docs/design/mockups/p2/` |
| **Site (P1 + P2)** | merged into `main` (P1 3644c06, P2 da204bd) |
| **Content** | **merged into `main` f9540e9**: 290 reviewed bilingual topics (257 tier-1 polished + 32 new ai-era/foundations + samples), 6 learning paths + 23 checkpoint banks, 12 cheatsheets, 22 interview banks, 28 review katas, 115+ glossary terms. Gate on main: lint/check clean, 2,356 unit tests (one flaky failure on the first run passed on rerun), build 5,849 pages, Pagefind 5,784 pages, 134,751 internal links resolve |
| Content pipeline | `content:check` now compiles MDX; `content:write` kinds quiz/kata/interview/path/cheatsheet/topic; tier 2/3 deferred (TODO) |
| Subsequent work | Whole-site review and Phase A completed; see current work below. |

## Active work (updated 2026-09-09 — local launch preparation complete)
- **B3 is complete.** The `content/ai-era-refresh` change starts from `0afd825`; local integration uses a fast-forward to `main`. All 287 live bilingual topic pairs reviewed; 279 optional AI-era sections removed, eight rewritten. The 18 AI-era-track articles remain. Prompts and the checker now permit omission and discourage padding. Code fences and verification dates are unchanged. Ledger: `docs/superpowers/ledgers/2026-09-07-ai-era-refresh.md`.
- **Validation:** lint, Astro/TypeScript, 2,426 unit tests, all 287 content checks, production build (5,909 pages), 160,258 internal links plus six redirects, and 283 browser tests passed. Lighthouse passed all required assertions across 11 URLs and 33 runs; minimum per-page median scores: performance 98, accessibility/best practices/SEO 100.
- **Launch preparation (2026-09-09):** CI Chromium lookup now uses the direct dependency `@playwright/test`; the launch checklist uses the approved public repository and GPT assignments. Targeted validation passed: workflow YAML parsing, execution of its Chromium lookup, executable-path check, Prettier and `git diff --check`. The full site gate above was last run on 2026-09-07. Repository publication, hosted CI, Pages deployment, domain/HTTPS and live verification remain pending under ROADMAP A8.
- **Remaining product work:** ROADMAP B1 (kata v2) and B2 (specification exercises), then B4–B10 and deferred Phase C items. Design notes for B1/B2: `docs/design/kata-v2.md` and `docs/design/spec-items.md`. GPT-only execution applies to future assignments; older roadmap model labels are historical.
- Publication and deployment remain deferred (`plans/2026-09-05-launch-checklist.md`). Phase A was already complete before this refresh.

## TODO
All open work, deferred items and decisions-against live in **`docs/superpowers/ROADMAP.md`** (Phase A before launch, Phase B after, Phase C later). Deploy is deferred by the user; runbook `plans/2026-09-05-launch-checklist.md`.

## How to resume
1. `git worktree list` and `git log --oneline --all | head` to see the active branch and last milestone.
2. Open the active plan under `docs/superpowers/plans/` and find the first unchecked task.
3. For content jobs, check `reports/polish/state.json` (created by the pipeline) before re-running anything.
4. Keep this file current.
