# Write brief: bilingual codewiki cheatsheet

You are the reference editor for codewiki.com. Write a compact, version-pinned cheatsheet pair whose rows remain useful when printed or copied without surrounding prose.

## Inputs

- Run id and content context: `{{ID}}` / `{{TOPIC_ID}}`
- Track and sheet slug: `{{TRACK}}` / `{{SLUG}}`
- Topic sources: `{{EN_PATH}}` / `{{ZH_PATH}}`
- Outputs: `{{OUTPUT_PATHS}}`
- Available topics:
{{INVENTORY}}
- Siblings: {{SIBLINGS}}
- Track sections:
{{TRACK_SECTIONS}}
- Existing glossary ids; choose at least six exact ids:
{{GLOSSARY_IDS}}
- Versions to pin: {{VERIFIED_VERSIONS}}; verification date: {{TODAY}}
- Editorial contract: `prompts/editorial-standard.md`

## Exact paired MDX shape

Both files use this complete shape; the Chinese file translates prose and titles while keeping every `code` attribute byte-for-byte aligned:

```mdx
---
title: Runtime essentials
description: The commands and syntax worth keeping beside the editor.
track: {{TRACK}}
terms: [term-one, term-two, term-three, term-four, term-five, term-six]
tags: [reference]
verified: { version: 'Pinned runtime version', date: {{TODAY}} }
reviewed: null
status: draft
aligned: true
---

<Sheet title="Values">
  <Row code="const value = source">bind one value without reassignment</Row>
  <Row code="let value = source">bind a value that will be reassigned</Row>
  <Row code="value ?? fallback">use the fallback only for nullish input</Row>
  <Row code="items.at(-1)">read the final item without changing the array</Row>
  <Row code="Object.hasOwn(data, key)">test an own property explicitly</Row>
</Sheet>

<Sheet title="Functions"><Row code="const f = (x) => x + 1">return one expression</Row><Row code="function f(x) { return x + 1; }">declare a named function</Row><Row code="f(...values)">spread values into arguments</Row><Row code="f.call(owner, value)">choose the call receiver</Row><Row code="f.bind(owner)">create a bound function</Row></Sheet>
<Sheet title="Collections"><Row code="items.map(project)">transform each item</Row><Row code="items.filter(keep)">keep matching items</Row><Row code="items.find(match)">return the first match</Row><Row code="items.some(match)">test whether any item matches</Row><Row code="items.every(match)">test whether all items match</Row></Sheet>
<Sheet title="Objects"><Row code="{ ...base, key: value }">copy and override one field</Row><Row code="Object.entries(data)">iterate key-value pairs</Row><Row code="Object.fromEntries(rows)">build an object from pairs</Row><Row code="delete data.key">remove an own property</Row><Row code="structuredClone(data)">make a supported deep clone</Row></Sheet>
<Sheet title="Errors"><Row code="throw new Error(message)">raise an explicit failure</Row><Row code="try { work(); } catch (error) { handle(error); }">handle a synchronous failure</Row><Row code="promise.catch(handle)">handle a rejected promise</Row><Row code="finally { release(); }">release resources on both paths</Row><Row code="error instanceof TypeError">narrow a known error type</Row></Sheet>
<Sheet title="Async"><Row code="await task">wait for one promise</Row><Row code="await Promise.all(tasks)">wait for all or the first rejection</Row><Row code="await Promise.allSettled(tasks)">collect every outcome</Row><Row code="AbortSignal.timeout(ms)">create a timeout signal</Row><Row code="for await (const item of source)">consume an async iterable</Row></Sheet>
<Sheet title="Modules"><Row code="export { value }">export a binding</Row><Row code="import { value } from './mod.js'">import a named binding</Row><Row code="export default value">export one default value</Row><Row code="import('./mod.js')">load a module dynamically</Row><Row code="import.meta.url">read the current module URL</Row></Sheet>
<Sheet title="Strings"><Row code="`id: ${id}`">interpolate a value</Row><Row code="text.includes(part)">test for a substring</Row><Row code="text.replaceAll(a, b)">replace every exact match</Row><Row code="text.split(separator)">split into parts</Row><Row code="parts.join(separator)">join parts into text</Row></Sheet>
<Sheet title="Boundaries"><Row code="Number.parseInt(text, 10)">parse a base-ten integer</Row><Row code="Number.isFinite(value)">reject infinities and NaN</Row><Row code="encodeURIComponent(value)">encode one URL component</Row><Row code="JSON.parse(text)">parse JSON input</Row><Row code="JSON.stringify(value)">serialize a JSON-compatible value</Row></Sheet>
```

## Quality bar and bilingual rule

- Write 9–12 `Sheet` blocks with 5–7 `Row` blocks each. Organize by retrieval task, not article narrative; avoid duplicated rows.
- Verify every row against the pinned version and use at least six existing glossary ids in `terms`. Do not invent syntax, output or version claims.
- The English and natural Simplified Chinese files have the same sheets and rows in the same order. Translate prose, never identifiers, code, commands or error messages.
- Author with `status: draft`, `reviewed: null`, no `calibration` tag, and identical non-translated frontmatter. Run `pnpm content:check --kind cheatsheet {{ID}}`.
- Only after that check passes, set both files to `status: reviewed`, `reviewed: {{TODAY}}`, rerun the check, and touch nothing outside the two outputs.

When the final gate passes, print `WRITE DONE {{ID}}` as the last line. If you cannot finish, print `WRITE FAILED {{ID}}: reason` as the last line.
