# codewiki — Project Status (resume point)

Read this first in any new session. Update it at every milestone and before starting any long-running job.

## Roles
- **Fable**: planning, architecture, review, all UI/visual design. Never writes bulk code or content.
- **Opus subagents**: implement code from the plans (`model: "opus"` explicitly).
- **Codex CLI** (`codex exec --dangerously-bypass-approvals-and-sandbox -m gpt-5.6-sol -c model_reasoning_effort=xhigh -C <repo>`): content polish, translation, bulk edits; may implement non-visual code.
- Language rule: all repo artefacts (docs, comments, commits, identifiers) in English; chat with the user in Chinese.

## Decisions log
- 2026-09-05: repository will be public at `github.com/codewiki-com/codewiki`; content licence CC BY-SA 4.0, code MIT (user). Phase A of the ROADMAP started: design notes `docs/design/home-hero-kata.md`, `verification-panel.md`, `flagship-tracks.md`.
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

## Active work (updated 2026-09-05 20:50 local — Phase A complete)
- **`main` HEAD 23b675e, full gate green:** lint, check, 2,423 unit tests, build 5,909 pages, 160,258 links + 6 redirects resolve, **283/283 e2e**, lhci exit 0 (median of 3, no category failures). Phase A (ROADMAP A1–A6, A7 decided) is merged; two copy sweeps by Codex were partially reverted where the original wording made no over-claim (home feature lines, prompt-builder headline).
- **No agent or background job running.**
- **Next, pending the user:** (1) create and push the public repository `github.com/codewiki-com/codewiki` (`gh repo create codewiki-com/codewiki --public --source=. --remote=origin --push`; then CI runs the same gate); (2) start ROADMAP Phase B — design notes ready: `docs/design/kata-v2.md` (B1) and `docs/design/spec-items.md` (B2); B3 ("In the AI era" rewrite) is a Codex bulk job over 287 topics split by track; B1 and B3 can run in parallel (quiz YAML/schema vs topic prose), B2 after B1.
- Deploy stays deferred (`plans/2026-09-05-launch-checklist.md`).

## TODO
All open work, deferred items and decisions-against live in **`docs/superpowers/ROADMAP.md`** (Phase A before launch, Phase B after, Phase C later). Deploy is deferred by the user; runbook `plans/2026-09-05-launch-checklist.md`.

## How to resume
1. `git worktree list` and `git log --oneline --all | head` to see the active branch and last milestone.
2. Open the active plan under `docs/superpowers/plans/` and find the first unchecked task.
3. For content jobs, check `reports/polish/state.json` (created by the pipeline) before re-running anything.
4. Keep this file current.
