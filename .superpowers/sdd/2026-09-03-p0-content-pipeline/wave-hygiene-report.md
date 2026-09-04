# Wave hygiene report

## Outcome

Implemented resilient link probing, expanded `content:check` to validate all polish sidecars, repaired the Data Science interview bank, re-extracted `datascience/polars`, and advanced its journal entry to `extracted` through `mark.ts`.

## Changes

- Link checks now send browser-like `User-Agent` and `Accept` headers, retain the 10-second per-request timeout, retry one request after two seconds on transport errors and HTTP 429/503, and fall back from rejected/failed `HEAD` probes to `GET`.
- HTTP 401/403/405/429 responses are recorded with their numeric status and `restricted: true`, count as reachable, and retain the existing seven-day cache behavior. Fresh older cache entries with those statuses are normalized to restricted/reachable when read.
- Check 7 now validates the referenced quiz, the complete track interview bank, and the topic's glossary proposal. Zod findings keep complete paths such as `items.14.tags.3` and `terms.0.aliases.1`.
- The shared glossary proposal schema requires the per-term id that extraction uses as its output filename; extraction uses the same proposal-term schema.
- Removed the YAML-null `null` entry from the `polars-null-nan-schema` tags while preserving `polars`, `schema`, `dtype`, and `nan`.
- Updated the stale content-fixture assertion from a fixed list of the original sample topics to the intended invariant: every shipped topic must have both English and Chinese files.
- Applied Prettier's quote normalization to three previously clean but nonconforming glossary proposal files so the required repository-wide lint gate passes.

## Verification

- `pnpm content:extract datascience/polars`: passed; 317 proposals skipped as already present, zero additions/conflicts, sidecars 1/1 valid.
- `pnpm tsx scripts/content/mark.ts ok datascience/polars extracted`: passed; the journal now records `step: extracted`.
- `pnpm content:check datascience/polars --no-links`: `OK datascience/polars`.
- `pnpm content:status`: passed; total polished count is 83 and the Data Science row reports 4 polished/aligned/reviewed topics.
- `pnpm content:polish --tier 1 --max 8 --dry-run`: selected eight other topics; `datascience/polars` was not selected.
- Explicit `next.ts --only datascience/polars --step polished` query: no output, confirming it is no longer pending.
- Focused link/check/extract suites: 64 tests passed.
- `pnpm lint && pnpm check && pnpm test`: passed; 32 test files and 957 tests green, with zero Astro diagnostics.
- `git diff --check`: passed.

## Worktree hygiene

The pre-existing `architecture/tech-debt` topic pair, quiz, interview append, and `scripts/content/mapping.draft.json` remain untouched and are excluded from this commit. The dry run introduced no tracked changes.

TASK DONE
