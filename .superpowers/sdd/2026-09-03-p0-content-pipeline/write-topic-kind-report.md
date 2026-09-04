# New-topic write kind report

## Result

Added `pnpm content:write --kind topic` for approved entries in `content/new-topics.yaml`. The runner now renders a from-scratch bilingual topic brief, skips an already-reviewed English topic, runs the full topic gate and extraction, records the real topic id through the polish journal, and commits the topic pair and sidecars with extracted glossary changes.

## Implementation

- Added `prompts/write-topic.md` with all approved-plan variables and the editorial-standard requirements for article structure, locally executed examples and real output, pitfalls, the four-part AI-era section, a deep section, checkpoint, verified reading, bilingual alignment, and §9 sidecars.
- Extended `scripts/content/lib/write-brief.ts` with the `topic` kind, strict approved-plan loading, planned and published sibling inventory, reviewed-topic detection, and topic output enumeration.
- Extended `scripts/content/write.sh` so topic runs use `pnpm content:check {id}`, then `pnpm content:extract {id}`, and mark `polished`, `aligned`, and `extracted` under `{track}/{slug}`. Topic batches include both MDX files, the quiz, track interview bank, glossary proposal, merged glossary files, and `reports/polish/state.json`.
- Added unit coverage for every new brief variable, planned siblings, unapproved ids, reviewed detection, rendering, id normalization, and output paths.
- Applied Prettier-only formatting to `content/new-topics.yaml`, which was the sole initial repository-wide lint failure. A parsed before/after comparison confirmed that its data is unchanged.

## Verification

- `pnpm exec vitest run tests/unit/content/write-brief.test.ts`: 21 tests passed.
- `pnpm content:write --kind topic --id ai-era/agent-context-management --dry-run`: exited 0; the rendered brief contains `Agent context management`, `working-with-agents`, and the planned sibling `ai-era/agent-task-planning`; it prints the exact Codex command.
- The dry run left the Git status and the SHA-256 of `reports/polish/state.json` unchanged.
- `pnpm content:write --kind topic --id foundations/linux --dry-run`: exited 0 with `skip topic foundations/linux: already reviewed` and no Codex command.
- `pnpm lint`: passed.
- `pnpm check`: passed with the existing advisory in `src/lib/runners/protocol.ts` that `timeoutRace` could be async.
- `pnpm test`: 54 files and 1,795 tests passed.

No push was performed, and `reports/polish/state.json` was not edited by hand or changed by verification.
