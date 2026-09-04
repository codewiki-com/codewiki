# Task 17 report — content prompts and write runner

## Outcome

Implemented five bounded Codex prompts, a parallel and interrupt-safe content writer, strict brief rendering, output-path discovery, and `content:check --kind` gates for quiz banks, review katas, interview banks, learning paths with checkpoints, and bilingual cheatsheets. No production content was authored.

## P0 provenance and copied files

The P0 source was `p0-content-pipeline` at commit `39e0c1c2d0b6549ba6b61181419695c6a260a3e6`.

Copied verbatim before extending:

- `scripts/content/check.ts` — then extended with Task 17 kind checks and CLI parsing.
- `scripts/content/render-brief.ts` — unchanged; `write-brief.ts` imports its `renderBrief` function.
- `scripts/content/mark.ts` — then extended only to accept `write:{kind}:{id}` journal keys.
- `scripts/content/lib/state.ts` — unchanged.
- Required checker/journal dependencies: `scripts/content/lib/alignment.ts`, `code-check.ts`, `frontmatter.ts`, `links.ts`, `markdown.ts`, `paths.ts`, `py-check.py`, and `zh-typography.ts` — unchanged.
- The glossary-proposal additions from P0's `src/schemas/glossary.ts` — unchanged and required by the copied topic checker.

Reference-only reads at that commit were `prompts/polish-topic.md`, `prompts/editorial-standard.md`, and `scripts/content/polish.sh`. They were not copied because Task 17 does not extend them; their P0 versions will merge independently. `prompts/codex-task-template.md` does not exist at the pinned P0 commit, so the already checked-in version at this branch's base commit `39796eba806f54a88f0b9024f7f49b1e0b5687e3` was read for its completion-protocol style.

## Prompt variables

All prompts receive `ID`, `TOPIC_ID`, `TRACK`, `SLUG`, `EN_PATH`, `ZH_PATH`, `SIBLINGS`, `INVENTORY`, `GLOSSARY_IDS`, `TRACK_SECTIONS`, `VERIFIED_VERSIONS`, `TODAY`, and `OUTPUT_PATHS`. `renderBrief` rejects any unfilled uppercase placeholder.

| Kind | ID interpretation and kind-specific use |
| --- | --- |
| `quiz` | `{track}/{slug}`; topic pair paths, sibling topics and the one quiz YAML output. |
| `kata` | `{track}/{slug}`; the same topic context and existing quiz YAML to update with a complete review item. |
| `interview` | Track slug; complete track inventory and registered sections, with one track-bank YAML output. `TOPIC_ID` is a real inventory example for the schema sample. |
| `path` | `{track}/{path-slug}` or an unambiguous track-prefixed slug; staged/live inventory and path output. After writing, output discovery reads every milestone checkpoint and includes those banks in the exact commit pathspec. |
| `cheatsheet` | Track slug or `{track}/{sheet-slug}`; track inventory, glossary ids, pinned versions, and the paired `.en.mdx` / `.zh.mdx` outputs. |

On this pre-P0 worktree, staged path inventory falls back read-only to `git ls-tree` and `git show p0-content-pipeline:content/staging/topics/{track}/...`. Once P0 staging exists in the worktree, filesystem staging is used directly. Staged ids win over duplicate live ids; live-only topics are appended. The rendered variable is a plain `- {track}/{slug} — {title}` list.

Prompt source lengths are all below the 120-line limit: quiz 84, kata 81, interview 54, path 83, cheatsheet 64.

## Runner and gate behavior

- `pnpm content:write --kind ... --id ... [--n 4] [--dry-run]` uses the same Codex command line, one-hour default timeout, protocol verification, journal retry behavior and process-group interruption handling as the P0 polish runner.
- Repeating `--id` creates a batch; `--n` is the maximum number of concurrent Codex sessions. The documented single-ID interface remains unchanged.
- Journal entries use `write:{kind}:{id}` and are written only through `mark.ts`.
- Successful batches stage and commit only discovered content outputs plus the journal. Path commits include exactly the authored path and its referenced checkpoint banks.
- `content:check --kind` imports the live Zod schemas. It additionally checks launch quantities, calibration tags, review issue spans, complete kata metadata, path topology/checkpoints, and cheatsheet row counts/alignment. The existing P0 topic check remains available without `--kind` and now also rejects related calibration placeholders for reviewed topics.

## Dry runs

Each command used `--n 4 --dry-run`, exited 0, rendered one completion protocol and one exact Codex command, and left `git status --porcelain=v1` byte-for-byte unchanged.

| Command target | Rendered lines |
| --- | ---: |
| `quiz python/closures` | 353 |
| `kata python/closures` | 428 |
| `interview python` | 401 |
| `path python/python-from-zero` | 430 |
| `cheatsheet python` | 411 |

## Tests and verification

`tests/unit/content/write-brief.test.ts` contains 16 passing cases:

- `prefers live topic paths and combines staged and live inventory with titles`
- `normalizes topic, track and scoped path ids without guessing unknown scopes`
- Five `renders the complete {kind} prompt with no unresolved variables` cases
- Five `keeps the {kind} template within the 120-line limit` cases
- `includes every checkpoint bank discovered in a written path`
- `rejects a bank with two correct options`
- `rejects a review issue whose line exceeds the code length`
- `rejects calibration tags in a reviewed cheatsheet pair`

Required final commands:

- `pnpm lint` — passed.
- `pnpm check` — passed across 243 files with 0 errors and 0 warnings; the existing `timeoutRace` async-conversion hint remains informational.
- `pnpm test` — 31 files and 313 tests passed.
- `bash -n scripts/content/write.sh` — passed.
- Five dry runs — all passed with no side effects, as detailed above.

## Deviations and decisions

- The P0 template-path discrepancy is documented above; no substitute file was invented.
- The copied helper modules and glossary-proposal schema addition are outside the brief's short file list but are necessary for the copied `check.ts`, `render-brief.ts`, and `mark.ts` to type-check and run before the P0 branch is merged.
- No shared append-only i18n, style or site-data file required a Task 17 addition.
