# P2b fix report

## Outcome

All open findings from the P2b whole-branch review (Important 2–7 and Minor 1–2) are resolved. Task 17 / Important 1 was already closed before this fix round.

## Changes

- **I2 — Try-to-break links:** nudge links now encode both the challenged example's language and code, append the nudge comment, and use the locale-correct playground route. Browser coverage follows the first English and Chinese closure links and verifies both locale and editor content.
- **I3 — bilingual mismatch safety:** the Markdown pipeline records a heading/block structural signature on each article. Bilingual pairing requires equal signatures; mismatches retain the existing localized “not aligned yet” state. Authored aligned pairs emit a build warning when their signatures differ. Unit coverage exercises signature generation and refusal to pair.
- **I4 — callouts:** bilingual mode keeps one callout container and clones only translated text children, excluding codeboxes, diagrams, and action chrome. A unit fixture verifies that a nested runnable codebox cannot duplicate its Run control.
- **I5 — bilingual order:** one mode-derived order drives heading subtitles, TOC labels, article blocks, and vocabulary labels. Browser coverage verifies heading and TOC order in both modes.
- **I6 — URL state bounds:** shared state rejects inputs over 16,384 encoded characters before decompression, code over 100,000 characters, tests over 20,000 characters, malformed state, and invalid legacy fallback. The playground shows the requested localized rejection notice. Unit coverage includes highly compressible over-limit payloads.
- **I7 — SQL seeds:** SQL `seed="name"` declarations remain visible, first declaration wins per page, runnable `sql run seed="name"` fences receive the resolved seed, examples JSON preserves it, runners forward it, and the SQL worker executes it before user SQL. A fixture and browser test prove `SELECT * FROM users` returns seeded rows. The fence metadata is documented in the editorial standard.
- **Minor findings:** Chinese playground and prompt-builder routes are covered by localization tests in both JavaScript modes; stale `KNOWN_LATER` and `Task 14` comments were removed.

## Verification

| Command | Result |
| --- | --- |
| `pnpm lint` | PASS |
| `pnpm check` | PASS — 278 files, 0 errors, 0 warnings |
| `pnpm test` | PASS — 37 files, 363 tests |
| `pnpm build` | PASS — 101 generated pages |
| `pnpm check:links` | PASS — 1,939 links across 102 pages |
| `pnpm test:e2e` | PASS — 234 tests |
| `pnpm exec lhci autorun` | PASS — all assertions passed; closure-page script transfer 61,429 bytes |
| `pnpm content:write --kind quiz --id python/closures --dry-run` | PASS — dry-run output rendered without writes |

`docs/superpowers/STATUS.md` was not changed. No changes were pushed.
