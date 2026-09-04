# Task 14 report: prompt builder, rules packs and context packs

## What changed

### Step 1: prompt assembly

- Added `src/lib/prompt-builder.ts` with the six requested goals, three levels, typed topic/options input, the fixed Markdown sections, vocabulary and pitfall aggregation, Chinese-answer instruction, and `ceil(chars / 4)` token estimation.
- Exported `QUERY_LIMIT`, `encodedLength` and `forLink` from `src/lib/prompts.ts` for reuse. Prompt-builder truncation removes user code first and leaves a `[code truncated]` line before the shared query guard runs.

### Step 2: rule extraction and rendering

- Exported `MARKER` and `LABELS` from the existing callout plugin.
- Added `src/lib/rules.ts`. It walks authored MDX outside fenced code, extracts `[!PITFALL]` blockquotes plus the `Review checklist` bullets inside `## In the AI era`, keeps topic title/URL provenance, and renders `CLAUDE.md`, `AGENTS.md`, and Cursor MDC output.
- Cursor globs are `**/*.py` for Python, `**/*.{js,ts,jsx,tsx}` for JavaScript/TypeScript, and `**/*` for other tracks.

The exact imperative heuristic is deliberately small and deterministic:

1. Take the pitfall's first sentence; the remainder becomes `why`.
2. Leave a sentence that starts with a known command verb (`Do not`, `Avoid`, `Use`, `Verify`, `Inspect`, and the other verbs in the local allowlist) unchanged.
3. Rewrite an initial `Treating`, `Assuming`, `Depending`, or `Registering` to `Do not treat`, `Do not assume`, `Do not depend`, or `Do not register`. When the sentence also states a consequence with `makes`, `ignores`, `causes`, `can`, or `will`, retain it after `; doing so`.
4. For another declarative sentence, add `Do not assume this is safe:` only when it contains a concrete mistake signal such as `wrong`, `fails`, `skips`, `leaks`, `ignores`, `without`, `unless`, `not`, or `longer than`. A neutral factual warning such as `Logout handlers run after...` stays declarative.
5. Limit rule text to 160 characters and move any overflow into `why`.
6. Copy review-checklist bullets as authored because that section is already written as commands.

The unit fixture `tests/fixtures/rules.mdx` has exactly three pitfalls, one qualifying review-checklist bullet, non-qualifying bullets around it, and a fake pitfall marker inside a code fence.

### Step 3: generated endpoints and indexes

- Added Astro-backed aggregation in `src/lib/generated-packs.ts` and pure byte-bounded context-pack assembly in `src/lib/packs.ts`.
- Added `/rules/{track}/CLAUDE.md`, `/rules/{track}/AGENTS.md`, and `/rules/{track}/cursor.mdc` for every track with at least one extracted rule.
- Added `/packs/{track}/{section}.md` from reviewed English topic twins. Production output splits above 1,000,000 bytes into numbered files; each split header links every part and every canonical topic URL.
- Added `## Rules packs` and `## Context packs` to `/llms.txt`, listing the files actually generated in this build.

### Step 4: prompt-builder pages

- Added `/ai/prompt-builder/` and `/zh/ai/prompt-builder/`, backed by one shared Astro page and one client-only Preact island.
- Topic data is fetched from `/api/topics.json` on first focus, or immediately when a `?topic=` preselection requires it. Terms and extracted pitfalls then come from the selected concept cards.
- The page implements topic chips/search, six goal cards, a level segmented control, five options, local-only code input, sticky live preview, token estimate, Claude/ChatGPT deep links, clipboard copy, the explanation panel, and a selected-track rules card that hides at zero rules.
- Added localized Simplified Chinese values for every new key. No placeholder values were used.
- Added `pitfalls` to the topic concept-card JSON.
- Added threshold-aware rules-pack cards to track hubs and cheatsheets. They render only when a track has at least ten rules.

### Step 5: tests and verification

Unit coverage:

- `prompt builder > assembles the fixed sections for the {goal} goal` for all six goals.
- `prompt builder > links the Markdown twin only when the link option is selected`.
- `prompt builder > drops oversized code before applying the query limit`.
- `prompt builder > adds the Chinese answer instruction and estimates tokens by characters`.
- `rules > extracts three pitfalls and the AI-era review checklist fixture`.
- `rules > uses the documented small imperative heuristic`.
- `rules > renders the three agent formats with sources and track globs`.
- `context packs > splits in source order and counts separators against the byte limit`.
- `context packs > lists canonical topics and numbered parts in every split file header`.

E2E coverage:

- `query parameters preselect a topic, goal and level on the static page`.
- `the Markdown-link option updates the preview`.
- `Copy writes the current prompt to the clipboard`.
- `the static prompt-builder route outranks the generic topic route`.
- Endpoint tests cover concept-card pitfalls, Python `CLAUDE.md`, the Python functions context pack, and both new `llms.txt` sections.
- The shared layout matrix now includes both prompt-builder locales at 390x844 and 1440x900.

Results:

- `pnpm lint`: passed.
- `pnpm check`: passed with the pre-existing informational `timeoutRace` hint and no errors or warnings.
- `pnpm test`: 32 files passed, 311 tests passed.
- `pnpm build`: passed, 99 static routes generated.
- `pnpm check:links`: passed, 1,813 internal links across 100 files resolved.
- Requested Playwright command: 55 tests passed.
- Manual visual audit: light and dark themes checked at 1440x900; both had zero horizontal overflow.

## Screenshot

The required 1440x900 light screenshot is:

`/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t14/prompt-builder-light-1440x900.png`

It shows `/ai/prompt-builder/?topic=python/closures&goal=review` after client preselection completed.

## Deviations and controller overrides

- The brief asks to change the existing `P2_RULES` constant. The controller requires append-only edits to `src/data/site.ts`, so this branch appends `P2_RULES_TASK_14 = true` and uses that switch on the Task 14 surfaces instead of editing the earlier constant in place. This keeps the feature enabled while preserving a conflict-free shared-file diff.
- The brief mentions a unified pipeline, but the actual `markdown-twin.ts` implementation and the controller context specify regex/line-based source walking. `extractRules` therefore follows that existing fence-aware line-walking approach while importing the callout plugin's exported `MARKER`.
- The current placeholder corpus produces eight Python rules and six JavaScript rules. Their endpoints are generated because the endpoint floor is one rule; the hub/cheatsheet cards stay hidden because the UI floor is ten. The prompt-builder card still appears for a selected track with at least one rule, as required.
- Natural Simplified Chinese strings replace the brief's older placeholder note, following the controller override.
