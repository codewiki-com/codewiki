# Brief: write the sample bilingual topics (Codex)

You are writing the first real content for codewiki.com. The content layer (schemas, collections,
placeholders) already exists; every file named below is currently a placeholder that you replace.

**Read `prompts/editorial-standard.md` first and follow it in full.** It is the contract: structure,
length, voice, currency, code rules, the bilingual rule and the frontmatter rules. This brief only
adds what is specific to these five files.

Run everything from the repo root. Node 24, `pnpm`.

## 1. Files to write

| File | What |
| --- | --- |
| `src/content/topics/python/closures.en.mdx` | full topic, canonical |
| `src/content/topics/python/closures.zh.mdx` | faithful aligned translation of the en file |
| `src/content/topics/javascript/event-loop.en.mdx` | full topic, ~120 lines |
| `src/content/topics/javascript/event-loop.zh.mdx` | faithful aligned translation of the en file |
| `src/content/glossary/*.yaml` (7 files) | real bilingual `short` definitions |
| `src/content/quizzes/python/closures.yaml` | 4 real questions |

Do not create, rename or delete any other file. Do not touch `src/schemas/`, `src/content.config.ts`
or the path file `src/content/paths/python-from-zero.yaml`.

## 2. `python/closures.{en,zh}.mdx`

Required beats, in this order (on top of the editorial standard's structure):

- `<TLDR>` with **three** `<TLDRCell>` cells (`what` / `trap` / `fix`).
- `## What a closure is` — definition, why the language has it, when you meet it.
- A runnable example with the exact fence meta ` ```python run title="make_counter.py" `. The code
  builds a counter with a closure; **run it** and paste its real output into a ` ```text ` block.
  The output must be `1 2 3` on one line (three calls of one counter printed together), followed by a
  second line `3` from `print(tick.__closure__[0].cell_contents)` — peeking at the captured cell.
  Then show, in the same or a following example, that a second `make_counter()` call starts again at
  `1` — each closure gets its own cell.
- `## Late binding: the trap` — the loop-variable capture problem, with the fix
  (default argument or `functools.partial`), each shown as runnable code with real output.
- At least one `> [!PITFALL]` callout followed by the fix (the standard asks for three to six
  pitfalls; late binding is one of them).
- An `## In the AI era` / `## AI 时代` pair only if closures supports concrete, durable human–AI collaboration guidance beyond the explanation and pitfalls. Do not add it to satisfy the outline.
- `<Depth level="deep">` wrapping `## How CPython stores cells` — `__closure__`, cell objects,
  `nonlocal`, what `dis` shows. No performance claims without measured numbers.
- `<Checkpoint id="python/closures" />` before the further-reading section.
- `## Further reading` — three to six links, official docs first, every URL fetched and confirmed.

The zh file mirrors the en file heading for heading, paragraph for paragraph, code block for code
block: identical code, translated comments, same number of list items. Native Chinese technical
prose, not translationese; glossary terms get the English original on first use, e.g. “闭包（closure）”.

## 3. `javascript/event-loop.{en,zh}.mdx`

Around 120 lines. Same structure. Exactly one runnable fence ` ```js run ` containing:

```js
console.log(1);
setTimeout(() => console.log(2));
Promise.resolve().then(() => console.log(3));
console.log(4);
```

Run it with `node`; the output block is `1 4 3 2` (one per line). Explain the order in terms of the
call stack, the macrotask queue and the microtask checkpoint. Node 24 is the verified version.

## 4. Glossary (7 files)

`free-variable`, `enclosing-scope`, `late-binding`, `cell`, `closure`, `event-loop`, `microtask`.
Keep the file names and the `en` / `zh` term names; replace `short.en` and `short.zh` with a real
one-sentence definition (**≤ 140 characters each**, the length the glossary cards are designed for).
Add `aliases` where a term really has one (e.g. `microtask` → `job`, `promise job`). Keep `topics`
pointing at the topics that use the term. Do **not** add an `id:` field: the id comes from the
filename.

## 5. `quizzes/python/closures.yaml`

Replace the single placeholder item with four real items, in this order:

1. one `predict` item — the classic `[2, 2, 2]` late-binding puzzle (`code`, `lang: python`,
   `options` where exactly one is `correct: true`);
2. two `mcq` items — one on what a closure captures (the variable, not the value), one on
   `nonlocal` vs rebinding;
3. one `review` item — realistic generated code that leaks a closure over a loop variable, with
   `code`, `lang: python` and `issues: [{ line, kind, note: { en, zh } }]`; `kind` is one of
   `bug | security | performance | style | api` (standard §9).

Every item needs `id`, bilingual `prompt`, bilingual `explanation`, `difficulty`
(`beginner` | `intermediate` | `advanced`) and optional `tags`. Keep `topic: python/closures` and do
not add an `id:` field at the top of the file (the id comes from the filename).

## 6. Frontmatter: keep these values exactly

The frontmatter is already correct and validated by the schema. Keep every field and value below;
change only `title` and `description` if the article genuinely needs it, and then keep the
description between **40 and 170 characters** (Chinese counts characters, so a Chinese description
needs at least 40 Chinese characters).

`python/closures.en.mdx` (the `.zh.mdx` file carries the same values with Chinese `title` and
`description`):

```yaml
track: python
section: functions-deeper
difficulty: intermediate
tags: [closures, scope, nonlocal]
prerequisites: [python/functions, python/scope-legb]
related: [python/decorators, python/functools]
terms: [free-variable, enclosing-scope, late-binding, cell]
verified: { version: 'Python 3.14', date: 2026-09-03 }
reviewed: 2026-09-03
status: reviewed
aligned: true
quiz: python/closures
sources:
  - { title: 'PEP 3104 - Access to Names in Outer Scopes', url: 'https://peps.python.org/pep-3104/' }
```

`javascript/event-loop.en.mdx` (same for `.zh.mdx`):

```yaml
track: javascript
section: async
difficulty: intermediate
tags: [event-loop, async, microtask]
prerequisites: [javascript/functions, javascript/promises]
related: [javascript/promises, javascript/async-await]
terms: [event-loop, microtask]
verified: { version: 'Node 24', date: 2026-09-03 }
reviewed: 2026-09-03
status: reviewed
aligned: true
sources:
  - { title: 'MDN - The event loop', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model' }
```

You may extend `sources` and `tags`; `sources[].url` must be a real, fetched URL. `terms` must list
glossary ids that exist. `prerequisites` and `related` are `track/slug` strings and may point at
topics that do not exist yet.

## 7. Constraints and gotchas

- Components `TLDR`, `TLDRCell`, `Depth`, `Term`, `Checkpoint` are implemented later (P1 Task 11).
  Use them in the MDX anyway; for now the files only have to **parse** (`astro sync`), not render.
  Do not import them — they are provided globally by the MDX layout.
- A YAML plain scalar cannot contain `": "`. Quote any title or description with a colon in it.
- `src/content/` is excluded from Prettier: do not reformat, and do not run `pnpm format`.
- Never invent output. Every ` ```text ` block is the real output of running the code with
  `python3` / `node`. If a toolchain is missing, say so in the report instead of guessing.
- Repo language rule: file names, identifiers, code comments in English; article prose in the file's
  own language.

## 8. Finish

```bash
pnpm astro sync && pnpm test
```

Both must pass (`tests/unit/content-fixtures.test.ts` validates every file you touched against the
collection schemas). Then print `SAMPLES DONE` and report: files written, the commands you ran to
produce each output block, any URL that did not resolve, and anything you changed in the frontmatter.
