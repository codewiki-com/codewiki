# MDX compile check report

## Gate implementation

- `scripts/content/check.ts:128,145-166` adds numbered check 9 and compiles each topic language with `@mdx-js/mdx` using `format: 'mdx'`. Frontmatter is removed before compilation and the body is line-padded, so diagnostics retain authored `file:line:column` positions.
- `scripts/content/check.ts:688-689` applies the same compile check to cheatsheet MDX.
- `scripts/content/check.ts:749-816` adds `--all` discovery for topic pairs and cheatsheets and prints a pass/fail summary.
- `tests/fixtures/invalid-mdx.mdx:5` contains the required `a < b</p>` prose fixture. `tests/unit/content/check.test.ts:16-33` verifies that it becomes numbered check 9 with a source position.
- `prompts/editorial-standard.md:37` prohibits raw angle brackets in prose. `prompts/polish-topic.md:30` states that the topic gate compiles both MDX files.
- `package.json:73` and `pnpm-lock.yaml:111-113` declare `@mdx-js/mdx` directly for the checker.

## Repository-wide scan

- Initial topics command: `pnpm content:check --all --no-links`.
- Initial summary: 290 topic ids checked; one MDX compile failure was found, in `src/content/topics/cpp/c-preprocessor.zh.mdx:44:72`.
- Final summary: 290 topic ids checked; 285 passed and five retained pre-existing quiz line-reference findings, with **zero check-9 / MDX compile findings**.
- Cheatsheets command: `pnpm content:check --kind cheatsheet --all --no-links`.
- Cheatsheet summary: 12 ids checked; 12 passed and zero MDX compile findings.

## Fixed content files

- `src/content/topics/cpp/c-preprocessor.zh.mdx:44` — corrected the malformed `< Term>` opener to the intended, English-aligned `<Term>` component. The topic gate now prints `OK cpp/c-preprocessor`.
- `src/content/topics/javascript/functions.en.mdx:60-61` and `src/content/topics/javascript/functions.zh.mdx:60-61` — renamed Mermaid's reserved `call` node id to `invoke`; both language blocks remain aligned. The topic gate prints `OK javascript/functions`.
- `src/content/topics/javascript/modules.en.mdx:263` and `src/content/topics/javascript/modules.zh.mdx:263` — placed the nested template-literal example inside a double-backtick inline-code span so `${name}` is not evaluated as MDX. The topic gate prints `OK javascript/modules`.

The latter two bilingual fixes were additional blockers revealed by the required full build after the original MDX parse failure was removed.

## Build integration fixes

- `src/pages-shared/Kata.astro:44-58,146-173,188-193` renders path checkpoint banks, which intentionally have no matching topic MDX, with track metadata and a site-card fallback.
- `src/pages-shared/Interview.astro:57-63` emits topic links only for published topic entries.
- `src/pages-shared/TrackHub.astro:26-35,108-110,127-132` resolves a track's cheatsheet through its actual content slug.
- `src/components/Term.astro:3-29` links published glossary entries and leaves pending glossary proposals as labelled text.

These integrations removed the generated corpus's invalid route assumptions without deleting or hand-editing generated state.

## Verification

- `pnpm lint && pnpm check && pnpm test && pnpm build && pnpm check:links`: **passed**.
- Tests: 54 files, 2,356 tests passed.
- Build: 5,849 Astro pages built; Pagefind indexed 5,784 pages in two languages.
- Links: 134,751 internal links across 5,850 HTML pages, all resolved.
- `docs/superpowers/STATUS.md` and `reports/polish/state.json` were not changed.

TASK DONE
