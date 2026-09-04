# Polish brief: rewrite one topic to the codewiki editorial standard

You are the editor for one topic on codewiki.com. Work autonomously, verify everything you can with the local toolchain, and leave the topic ready for publication in both English and Chinese.

## Inputs

- Topic id: `{{TOPIC_ID}}` (format `{track}/{slug}`)
- Track and section: `{{TRACK}}` / `{{SECTION}}` (see `src/data/tracks.ts` for the section list)
- Existing drafts (may be divergent, may contain errors): `{{EN_PATH}}` and `{{ZH_PATH}}`
- Lint reports for the drafts: `{{LINT_REPORT}}` (JSON: code syntax failures, dead links, zh typography issues, divergence score)
- The standard: `prompts/editorial-standard.md` (read it first; it is the contract)
- Reference topic showing the exact MDX format and component usage: `src/content/topics/python/closures.en.mdx` and `.zh.mdx`
- Glossary ids already available: `src/content/glossary/*.yaml`
- Verified versions to target: `src/data/versions.ts`
- Sibling topics in this track (the only ids you may use in prerequisites/related, plus ids from other tracks only if you have verified the file exists under content/staging/topics or src/content/topics):

{{SIBLINGS}}

## Steps

1. Read both drafts completely. Decide which is the better base (accuracy, structure, depth). Record the choice and one sentence of reasoning in the report.
2. Outline the new article against §2 of the standard. Decide what to cut (§10) and what is missing. If the topic is really two topics, stop and write `split: [suggested-slug-a, suggested-slug-b]` in the report instead of writing.
3. Write the canonical-language MDX at `src/content/topics/{{TRACK}}/{{SLUG}}.{{CANONICAL_LANG}}.mdx`:
   - Frontmatter per §8. `status: draft` for now. Keep `origin` pointing at the old file you started from. Fill prerequisites (topics a reader should finish first, 0–4) and related (2–5 ids) from the sibling list; never invent an id; leave a list empty only when nothing fits.
   - Runnable fences per §6. Execute every runnable block with the local toolchain and paste the real output into the following ` ```text ` block. Commands: `python3 file.py`, `node file.js`, `npx tsx file.ts`, `go run`, `cargo run`, etc. Put scratch files under `/tmp/codewiki-run/{{SLUG}}/`. If a toolchain is missing, mark the block with `# not executed here: {reason}` and list it in the report.
   - Verify every URL in `sources` with a HEAD or GET request; drop what does not resolve.
   - Write the **In the AI era** section from real failure modes of this concept in generated code; be specific, not generic.
4. Translate to the other language at `src/content/topics/{{TRACK}}/{{SLUG}}.{{OTHER_LANG}}.mdx` following §7 and §4. Same headings, same number of paragraphs and list items, identical code (translate comments only). `title` and `description` translated; all other frontmatter identical.
5. Write the sidecars per §9: `src/content/quizzes/{{TRACK}}/{{SLUG}}.yaml`, append to `src/content/interview/{{TRACK}}.yaml` (create if missing, keep it valid YAML), and `content/glossary-proposals/{{TRACK}}-{{SLUG}}.yaml` for missing terms. Follow the calibration rules at the end of §9: 4–8 quiz items with one full `review` item (task, right, checklist, 3–5 issues of distinct kinds), and 3–5 interview items with `section`, `level`, `frequency` and a 60–120 word answer per language.
6. Run `pnpm content:check {{TOPIC_ID}}`. The check now compiles both MDX files; fix everything it reports (schema errors, zh typography, code syntax, dead links, alignment mismatches, MDX syntax errors). Repeat until it prints `OK`.
7. Set `status: reviewed`, `reviewed: {{TODAY}}`, `verified.date: {{TODAY}}` in both files. Run the check once more.
8. Write `reports/polish/{{SLUG_FLAT}}/report.json`:

```json
{
  "topic": "{{TOPIC_ID}}",
  "canonical": "zh",
  "reason": "zh draft covered TaskGroup and had fewer factual errors",
  "dropped": ["Performance section had no numbers", "Interview questions moved to sidecar"],
  "notExecuted": [],
  "deadLinksRemoved": ["https://example.com/old"],
  "newTerms": ["cell"],
  "lines": { "en": 512, "zh": 498 },
  "versionsVerified": ["Python 3.14"],
  "warnings": []
}
```

## Rules

- Do not invent APIs, links, books, benchmark numbers or outputs. If you cannot verify, leave it out and say so in `warnings`.
- Do not touch any file outside the paths listed above, except scratch files under `/tmp/codewiki-run/`.
- Do not change `src/data/tracks.ts`; if the section is wrong for this topic, put `suggestedSection` in the report.
- Keep the whole run under the token budget: the article is 400–900 lines; do not paste the old drafts back into the output.
- Language: English for everything except the zh article and the zh strings in sidecars.
- When done, print the single line `POLISH DONE {{TOPIC_ID}}` as the last line of your output. If you stopped early, print `POLISH FAILED {{TOPIC_ID}}: {reason}`.
