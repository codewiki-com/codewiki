# Write brief: new bilingual codewiki topic

You are writing one approved topic from scratch. Work autonomously from repository evidence, execute every runnable example, and leave a publication-ready English/Chinese pair plus its sidecars.

## Approved plan entry

- Topic: `{{TOPIC_ID}}`
- Track / slug / section: `{{TRACK}}` / `{{SLUG}}` / `{{SECTION}}`
- English title: `{{TITLE_EN}}`
- Chinese title: `{{TITLE_ZH}}`
- English description: `{{DESCRIPTION_EN}}`
- Chinese description: `{{DESCRIPTION_ZH}}`
- Difficulty: `{{DIFFICULTY}}`
- Prerequisites: `{{PREREQUISITES}}`
- Why this topic exists: {{WHY}}
- Review date: `{{TODAY}}`

The plan values above are authoritative. Copy its titles, descriptions, section, difficulty, and prerequisites into frontmatter exactly, using safe YAML quoting. Do not add or remove prerequisites.

Sibling topics in this track (the only choices for `related`; omit this topic itself):

{{SIBLINGS}}

Existing glossary ids:

{{GLOSSARY_IDS}}

## Contract and outputs

Read `prompts/editorial-standard.md` completely and inspect `src/content/topics/python/closures.en.mdx` and `.zh.mdx` for MDX conventions. Write only:

- `src/content/topics/{{TRACK}}/{{SLUG}}.en.mdx`
- `src/content/topics/{{TRACK}}/{{SLUG}}.zh.mdx`
- `src/content/quizzes/{{TRACK}}/{{SLUG}}.yaml`
- `src/content/interview/{{TRACK}}.yaml` (append this topic's items; preserve unrelated items)
- `content/glossary-proposals/{{TRACK}}-{{SLUG}}.yaml`
- scratch files under `/tmp/codewiki-run/{{SLUG}}/`
- `reports/polish/{{SLUG_FLAT}}/report.json`

Do not edit `reports/polish/state.json`, `src/content/glossary/`, the approved plan, schemas, track data, or other content. The outer runner performs glossary extraction and journaling after the gate passes.

## Article requirements

Each language file must be 400–900 lines and use the standard's order. Use exactly these skeleton H2s: `What it is and why it exists`, `How it works`, `Examples`, `Pitfalls`, `In the AI era`, `Further reading`; use their exact Chinese counterparts in the zh file. Put one topic-specific H2 deep section inside `<Depth level="deep">`, and place `<Checkpoint id="{{TOPIC_ID}}" />` before further reading.

- Start with `<TLDR>` and three concise `<TLDRCell>` entries. Wrap the first example in `<Depth level="quick">`.
- Provide two to four self-contained, realistic runnable examples. Execute each with the local toolchain from a scratch file and paste its real output in the immediately following `text` fence. Never guess output. Use `run title="file.ext"` fence metadata where the standard requires it.
- Explain three to six real pitfalls as `> [!PITFALL]` callouts, each followed by a concrete fix.
- Give `In the AI era` the four bold lead-ins required by the standard, with specific generated-code failure modes, checks, a three-item review list, and precise prompt vocabulary.
- Verify three to six further-reading URLs with HEAD or GET, put official sources first, and drop any URL that does not resolve.
- Keep English and natural Simplified Chinese aligned heading for heading, paragraph for paragraph, list item for list item, and code block for code block. Code must be identical except translated comments.

Frontmatter must set `track: {{TRACK}}`, `section: {{SECTION}}`, `difficulty: {{DIFFICULTY}}`, `prerequisites: {{PREREQUISITES}}`, `quiz: {{TOPIC_ID}}`, `reviewed: {{TODAY}}`, `status: reviewed`, and `aligned: true`. Choose 2–5 `related` ids only from the sibling list. Use only existing glossary ids in `terms` unless the missing term is also proposed. Omit `origin` because there is no source draft.

For a topic whose examples use a runtime, choose the exact matching version from `src/data/versions.ts` and run on that runtime. For a wholly conceptual topic, `verified: { version: 'n/a', date: {{TODAY}} }` is allowed by `src/schemas/topic.ts`; otherwise record the runtime actually used. Set `verified.date` to `{{TODAY}}`.

## Sidecars and verification

Write 4–8 bilingual quiz items grounded in the article. Include `predict` and `spotbug` items when the topic has runnable code, plus one full `review` kata: a stated task, 15–25 lines of realistic generated code, what it did well, a 3–4 item checklist, and 3–5 correctly numbered issues with distinct kinds from `security`, `correctness`, `edge-case`, `readability`, `performance`.

Append 3–5 interview items for `{{TOPIC_ID}}`, each with localized `section`, `level`, `frequency`, and a 60–120 word answer in each language. Preserve the track bank's valid YAML and all unrelated items. Write a proposal with `terms: []` when no glossary term is missing; otherwise every proposed term needs `id`, `en`, `zh`, aliases, bilingual one-sentence `short` values of at most 140 characters, and `topics: [{{TOPIC_ID}}]`.

Run `pnpm content:check {{TOPIC_ID}}` and fix every result until it prints `OK`; this is the full topic gate, including links, executable code checks, sidecars, structure, status, and bilingual alignment. Record commands, real versions and outputs, URL checks, line counts, new terms, and warnings in the report JSON.

When everything passes, print `WRITE DONE {{TOPIC_ID}}` as the last line. If you cannot finish, print `WRITE FAILED {{TOPIC_ID}}: reason` as the last line.
