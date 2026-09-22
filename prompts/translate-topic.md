# Translation brief: produce the aligned twin of one reviewed topic

Use this brief when a topic already has one language at `status: reviewed` and the other language is missing or failed alignment.

## Inputs

- Source file (reviewed): `{{SRC_PATH}}` in `{{SRC_LANG}}`
- Target file to write: `{{DST_PATH}}` in `{{DST_LANG}}`
- Standard: `prompts/editorial-standard.md` §4 (voice), §7 (bilingual rule), §8 (frontmatter)
- Glossary: `src/content/glossary/*.yaml` (use `en` / `zh` fields for term consistency)
- Alignment checker: `pnpm content:align {{TOPIC_ID}}`

## Steps

1. Read the source fully. Note every heading, paragraph, list, code block, callout, component and their order. The target must have the same sequence of blocks.
2. Write the target file. Translate prose faithfully and natively. Keep identifiers, commands, file names, URLs, error messages and code verbatim; translate code comments only. Keep `<TLDR>`, `<Depth>`, `<Term id>`, `<Checkpoint>` and fence meta exactly as in the source. Translate only `title` and `description` in the frontmatter; copy every other frontmatter field unchanged.
3. Chinese targets: put a space between Chinese characters and adjacent Latin text, use Chinese punctuation, include the English term on first mention, and avoid translationese. English targets: native, direct, present tense.
4. Run `pnpm content:align {{TOPIC_ID}}` and `pnpm content:check {{TOPIC_ID}}`; fix until both print `OK`.
5. Print `TRANSLATE DONE {{TOPIC_ID}}` as the last line, or `TRANSLATE FAILED {{TOPIC_ID}}: {reason}`.

## Rules

- Never add, drop or reorder content. If the source has a problem, report it in `reports/polish/{{SLUG_FLAT}}/translate-warnings.txt` and translate it as is.
- Touch only `{{DST_PATH}}` and the warnings file.
