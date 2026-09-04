# Merge `main` into `p0-content-pipeline`

## Outcome

Resolved all nine conflicts while retaining the current P0 content pipeline, 178 polished topic pairs, and the P1/P2 site and content-writing features from `main`.

## Conflict resolutions

- `scripts/content/check.ts`: kept P0's current eight-stage topic checker, resilient cached link checks, full sidecar validation, and numbered findings. Ported Task 17's `quiz`, `kata`, `interview`, `path`, and `cheatsheet` write-kind validation and CLI routing, including calibration-tag rejection for reviewed output and bounds checks for review issue spans.
- `scripts/content/mark.ts`: kept P0's owner-PID lock, stale-lock takeover protection, atomic state update, retry-compatible CLI, and bounded errors. Ported acceptance of `write:{kind}:{id}` journal keys; a direct parse smoke check accepted `write:quiz:python/closures`.
- `src/schemas/quiz.ts`: kept `main`'s superset. It includes the closed `issueKind` enum, `line`/`lines`, optional `title`, `task`, `right`, `tests`, and `minutes`, plus defaulted `checklist` and tags. These cover every field used by the P0 prompts/checker and the P2 learning UI.
- `src/schemas/interview.ts`: kept `main`'s superset, including topic references, tags, localized `section`, and `common | occasional | rare` frequency. The polished Python bank parses as track `python` with 56 items and zero calibration items.
- `src/content.config.ts`: kept `main`'s collection union, including `cheatsheets` and `interview`. The interview loader uses `*.yaml` at the collection root, so `src/content/interview/python.yaml` receives the entry id `python`, matching its `track` field.
- `src/content/interview/python.yaml`: kept P0's 56-item polished bank. The three `main` calibration placeholders were not added.
- `src/content/quizzes/python/closures.yaml`: kept `main`'s five-item P2 bank and its titled review item. Corrected that item's placeholder metadata so the merged reviewed-topic checker accepts it: the issue beginning on line 9 spans lines 9–10 (`lines: 2`), and the `calibration` tag became descriptive review/YAML/security tags. Its `correctness` and `security` issue kinds are members of the merged enum.
- `package.json`: unioned every P0 `content:*` script with `main`'s `content:write`, `check:links`, SQL.js vendor command, and all other site scripts. Kept `main`'s `prebuild` command that vendors both Pyodide and SQL.js, and unioned both dependency sets. The existing `pnpm-lock.yaml` was already current.
- `tests/unit/schemas.test.ts`: retained P0's topic, quiz, interview, glossary, and path cases; added P2's cheatsheet, path-rationale, exported issue-enum, title, issue-span, test-command, and duration coverage. Focused merged suites pass 54/54 tests.

## Integration repairs

- Formatted the 18 glossary-proposal YAML files reported by the repository-wide Prettier gate.
- Updated `tests/unit/content-fixtures.test.ts` to assert that polished interview banks contain no calibration placeholders, replacing P2's placeholder-era expectation.
- Updated `tests/unit/markdown-twin.test.ts` assertions to the polished closure article while preserving the round-trip checks.
- Hardened `scripts/check-dist-links.mjs` to inspect URL attributes only on actual link-bearing HTML elements and ignore encoded code/island-prop snippets. Normalized two known future Java topic links to trailing-slash URLs and corrected the JavaScript short-circuit glossary id in both languages.

## Verification

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed; lockfile current, 149 packages reused, no lockfile rewrite required. |
| `pnpm content:check backend/jwt-authentication datascience/polars --no-links` | Passed; 2/2 topics printed `OK`. |
| Focused checker/mark/writer/schema suites | Passed; 4 files, 54/54 tests. |
| `pnpm lint` | Passed; ESLint and Prettier clean. |
| `pnpm check` | Passed; 306 files, 0 errors, 0 warnings, 1 informational async-conversion hint. |
| `pnpm test` | Passed; 54 files, 1,763/1,763 tests. |
| `pnpm build` | Passed; 3,503 pages built, 3,438 pages and 46,067 words indexed in 2 languages, 4 filters. |
| `pnpm check:links` | Passed; 78,052 internal links across 3,504 HTML pages resolve. |
| `pnpm content:status` | Passed; table printed totals of 257 tier-1, 423 tier-2, 238 tier-3, 178 polished, 179 aligned, 179 reviewed, and 0 failed. |
| `pnpm content:polish --tier 1 --max 3 --dry-run` | Passed; selected 3 topics and left both git status and the journal unchanged. |
| `pnpm content:write --kind quiz --id python/closures --dry-run` | Passed; rendered 1 quiz brief/command and left both git status and the journal unchanged. |
| Index checks | No unmerged entries; staged and unstaged diffs pass `git diff --check`. |

## Protected and unrelated files

- Did not manually edit `docs/superpowers/STATUS.md`; its post-merge worktree blob remained `61d40d9d78fa3b33dc87e577ea8c123afc0209e8` throughout resolution and verification.
- Did not touch `reports/polish/state.json`; its blob remained `0b66d8c8db838f969f5391f5f02d3b19983490e6`, including across both dry runs.
- Left the pre-existing untracked `scripts/content/mapping.draft.json` untracked and excluded from the merge commit.
