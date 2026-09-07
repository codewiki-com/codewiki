# AI collaboration section refresh

User-approved direction: `docs/design/ai-era-refresh.md`. Work started from `0afd825` on local branch `content/ai-era-refresh`. The user authorized substantial deletion and GPT-only delegation; pilot, batch editors, integration implementer and independent code reviewer used `gpt-5.6-sol` with reasoning `high`. The main GPT coordinator selected the editorial direction, revised retained examples and ran integration checks.

## Result

- Reviewed all 287 live bilingual topic pairs across 22 tracks; all 574 MDX files changed.
- Removed the independent AI-era section from 279 pairs. Their core explanations, examples, pitfalls and deeper material remain.
- Rewrote eight sections around concrete agent work: ADRs, CAP experiments, architecture boundaries, SOLID refactoring alternatives, technical-debt reduction, API versioning, adding an RTL locale, and a CSS-in-JS migration spike.
- Removed unsupported model-error attribution in ordinary prose in 15 topics. Normalized two legacy Chinese Pitfalls headings to the existing editorial standard.
- All 18 AI-era-track articles remain; their redundant AI-era subsections were removed. No track or article was deleted.
- English AI-section text fell from approximately 75,738 to 784 whitespace-separated words, including headings. This is a prose reduction measure, not model token usage.

There was no deletion quota. The first pilot removed closures, generics and task-planning sections; ADR and API-versioning examples survived. A second editorial review rejected a replacement template built from long input lists and prose checklists. Four candidate sections were then removed and the others rewritten around a specific useful outcome. The final copy makes no dated model ranking or unsupported claim about model error frequency.

## Content and pipeline contract

`In the AI era` / `AI 时代` is optional. Active authoring prompts no longer request the fixed four-part structure, generic model-error warnings or prompt-vocabulary lists. The previous 400-line minimum becomes a 100-line sanity floor with an explicit no-padding instruction; the 900-line maximum remains. The checker now enforces the five core localized headings, TLDR and Checkpoint. `--relaxed` remains a compatibility no-op.

Rules export continues to extract PITFALL callouts and supports legacy AI review-checklist syntax without requiring it. A regression verifies pitfall-only rule extraction. The browser reading-progress test now uses the required Pitfalls heading.

The independent integration reviewer found that the checker did not enforce the required core headings. The implementer added the five localized headings and a negative regression; the reviewer verified the fix. Regression evidence also shows the old mandatory-AI/400-line checker rejects a substantive topic with its optional section removed.

Prose-only edits do not refresh code-verification dates. A whole-corpus audit compared the final files against a captured baseline: all 287 pairs align; all 4,748 code fences, including recorded outputs and fence metadata, are unchanged; Depth and Checkpoint wrappers are unchanged. Existing runtime verification records therefore retain their original dates.

## Validation

- Whole-corpus structural and code-preservation audit: exit 0, 287 pairs, no findings.
- ESLint and Prettier: exit 0.
- Astro check and TypeScript: exit 0, 348 files, zero errors/warnings and one existing hint.
- Full Vitest suite: 2,426 tests passed across 61 files. An earlier concurrent run hit the unchanged Java syntax check's five-second timeout under load; the test passed alone in under one second and the full isolated run passed in 11.43 seconds. No timeout or assertion was weakened.
- `pnpm content:check --all --no-links --no-verify`: 287 checked, 287 passed, zero failures. Network link checks and runtime re-execution were skipped because cited sources and every code fence are unchanged; the production link check follows the build.
- Production build: exit 0, 5,909 pages. Pagefind indexed 5,750 pages in two languages.
- Production links: 160,258 internal links across 5,916 HTML pages and six redirect targets, all resolve.
- Canonical browser suite: `PLAYWRIGHT_PORT=45731 pnpm test:e2e --workers=4`, 283 passed. The test server port is configurable, and clipboard permissions use the configured origin. Port 4321 belonged to another local project and was left alone.
- The bundled Chromium headless shell crashed with SIGSEGV between browser contexts on different tests across two attempts. Full Chromium passed all 283 tests, then passed again through the updated canonical configuration. Playwright now explicitly selects the full Chromium channel, already installed by CI; assertions and thresholds are unchanged.
- Lighthouse CI: exit 0, 11 URLs with three runs each (33 reports). The lowest per-page median was 0.98 for performance and 1.00 for accessibility, best practices and SEO. No error-level assertion failed, including script budgets; warning-level audit findings remain nonblocking under the existing configuration.

No publication or deployment was performed. Staged legacy drafts and the other Phase B/C features are outside this change.
