# Task 7 report: learning paths and the map

## Step 1: build-time map layout

- Added `src/lib/pathmap.ts` with the brief's `MapNode`, `MapDiamond`, `MapEdge`, and `MapLayout` interfaces and its layout algorithm.
- The algorithm creates one 236 px-spaced column per milestone, row-based topic coordinates, four milestone flow edges for the five-column sample, and only forward prerequisite edges.
- Added `src/components/PathMap.astro`. It renders milestone frames, flow and prerequisite paths, all 23 topic nodes, and five checkpoint diamonds as one static SVG.
- The SVG has `role="img"` and a localized count summary. Authored topic nodes are SVG links, while planned topics are inert dashed `soon` groups.

## Step 2: path progress and time planning

- Added `src/lib/paths.ts` with `pathProgress`, `nextStep`, and `weeksLeft`.
- Topic completion is based only on `completedAt`. Passed checkpoints use the shared `passed` helper, choose the current milestone, and lock unfinished topics in later milestones. An imported completion still displays as done even if its milestone is currently locked.
- Path-page durations use each authored topic's rendered Standard reading time. A topic with exercises uses the 1.5 multiplier. An unauthored topic contributes the 10-minute default.
- Updated `TrackProgress.tsx` to use the same checkpoint-gated path progress calculation for the recommended-path card.

## Step 3: browser-local states on static markup

- Added `src/islands/PathState.tsx` as a `client:idle` DOM-only island. It does not render or replace the SVG.
- The island sets `data-state` on map nodes, edges, checkpoint diamonds, milestone groups, topic rows, and checkpoint rows. It also updates the ring, percentage, summary, Continue link, current milestone counts, row labels, and reading percentages.
- Opening a detail page writes `progress.paths[id].startedAt` only when it is absent.
- The 15, 30, and 60 minute radio segment writes `prefs.plan` and recalculates the remaining hours and weeks line.
- Export uses the existing `exportAll` backup format. Share uses the Web Share API when available and otherwise copies the current path URL.

## Step 4: pages, content, SEO, and API

- Added the shared bilingual index and detail pages plus thin English and Chinese routes under `src/pages/paths/` and `src/pages/zh/paths/`.
- The index shows path title, description, level range, hours, topic and checkpoint counts, track glyphs, and browser-local progress.
- The detail page follows `Path.dc.html`: header and ring card, legend, horizontally contained SVG panel, current milestone list, rationale, outcomes, time plan, export/share controls, and Ask-AI rail card.
- Added optional localized `rationale` to the path schema and a one-sentence English and Chinese rationale to `python-from-zero.yaml`.
- The sample already contained forward prerequisite edges, including all four called out by the task context, so no duplicate edges were added.
- Added the `path` SEO page kind, Course and breadcrumb JSON-LD on path details, Pagefind path metadata, and locale alternates through the shared head builder.
- Added the requested `paths.*` English strings and English `//P2` placeholders in Chinese. The content title, description, outcomes, milestones, and rationale remain properly localized.
- `/api/paths.json` now includes the canonical English `url` for every path.
- The recommended-path card on the track hub now links to the completed map page.

## Step 5: tests and verification

### Unit tests

`tests/unit/pathmap.test.ts`:

- `places five milestone columns 236 pixels apart` - passed
- `derives a node y coordinate from its row` - passed
- `drops prerequisite edges that point backwards` - passed
- `flags nodes whose topic pages do not exist` - passed
- `has finite positive dimensions for a one-milestone path` - passed

`tests/unit/paths.test.ts`:

- `makes the first pending topic current and locks later milestones` - passed
- `uses completedAt, not read percentage, and lets done override a lock` - passed
- `opens the first milestone whose checkpoint has not passed` - passed
- `offers the checkpoint after every topic in the current milestone is done` - passed
- `offers the first incomplete topic of the current milestone` - passed
- `rounds partial weeks up for each study plan` - passed

The path schema suite also adds `accepts a localized rationale` - passed.

Full unit result: 29 files passed, 269 tests passed.

### End-to-end tests

`tests/e2e/paths.spec.ts`:

- `the path index lists Python from zero` - passed
- `the path page renders the complete build-time map` - passed
- `saved progress annotates the SVG and keeps Continue on an authored topic` - passed
- `the time-plan segment updates the weeks estimate and saves the plan` - passed
- `opening a path records its started time only once` - passed
- `the Chinese path page renders the localized content title` - passed

`tests/e2e/layout.spec.ts` now covers both path detail routes at 390x844 and 1440x900. All four new path layout cases passed, and the complete requested path plus layout run passed 26 of 26 tests.

Additional regression run: `tests/e2e/endpoints.spec.ts` and `tests/e2e/track.spec.ts` passed 17 of 17 tests, including the new path API URL assertion and the updated track hub.

### Required command results

- `pnpm lint` - passed
- `pnpm check` - passed with one pre-existing suggestion in `src/lib/runners/protocol.ts`, no errors or warnings
- `pnpm test` - passed, 269 of 269 tests
- `pnpm build` - passed, 89 static pages built
- `pnpm check:links` - passed, 1,370 internal links across 90 HTML files resolved
- `pnpm exec playwright test tests/e2e/paths.spec.ts tests/e2e/layout.spec.ts` - passed, 26 of 26 tests

## Screenshots and visual audit

- Light, 1440x900: `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t7/path-1440x900-light.png`
- Dark, 390x844: `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t7/path-390x844-dark.png`

Both screenshots were captured after idle hydration from the final static build. The desktop map fits inside its panel. On mobile the panel itself scrolls horizontally while the document remains viewport-wide. Light and dark states use only the existing semantic tokens.

## Deviations and edge cases

- Only `python/closures` currently has an authored topic route. If it is already complete, there is no later authored topic in this sample. Continue therefore falls back to that authored topic instead of linking to a planned route. As more path topics are authored, it selects the next unfinished authored topic at or after the curriculum's calculated next step.
- None of the five milestone checkpoint banks exists yet. Their next-step destination safely falls back to the localized Practice hub until a concrete checkpoint route is available.
- The Ask-AI rail card matches the supplied mockup's informational treatment. It does not add a new path-specific prompt workflow because that was outside the brief's island contract.
