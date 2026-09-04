# codewiki Editorial Standard

This is the contract every topic on codewiki.com must meet before it is published. It is written for the agent or person doing the writing. Read it fully before touching a topic.

## 1. Purpose of a topic

A topic explains one concept or tool so that a smart colleague can (a) understand what it is and why it exists, (b) see it work in runnable code, (c) avoid the mistakes people actually make, (d) know how it interacts with AI-assisted coding, and (e) check their understanding. It is a reference first and a lesson second: the first screen must already answer the question in the title.

## 2. Structure (in this order)

1. **Frontmatter** (see §8).
2. **TL;DR** — `<TLDR>` with three cells. Default labels `what` / `trap` / `fix`; for tool topics use `what` / `when` / `how`. Each cell is one or two sentences.
3. **What it is and why it exists** — `## ` heading in the reader's language. Definition, the problem it solves, when you meet it. No history lesson unless the history explains a design decision.
4. **How it works** — the mechanics. One Mermaid diagram (` ```mermaid `) if a structure or flow is clearer drawn than described; none otherwise.
5. **Examples** — two to four runnable examples that build on each other. Every example that the language allows to run in the browser carries the fence meta `run title="file.ext"` (Python, JavaScript, TypeScript; SQL when the example is self-contained). Every example shows its output in a fenced block ` ```text ` immediately after it, and that output was produced by actually running the code (see §6).
6. **Pitfalls** — three to six, each as `> [!PITFALL]` followed by the fix. "Best practices" belong here as the fix side of a pitfall; do not write a separate best-practices list.
7. **In the AI era** — `## ` heading, then four short parts under bold lead-ins: **What generated code gets wrong here** (the specific mistakes models make with this concept), **Ask your AI to check** (two or three concrete verification requests), **Review checklist** (three bullet points a reviewer runs on generated code touching this concept), **Prompt vocabulary** (the exact English terms that make prompts precise, with the Chinese equivalents in the zh version).
8. **Deep dive** — `<Depth level="deep">` around one or more `## ` sections: internals, edge cases, performance with measured numbers or no performance claims at all.
9. **Checkpoint** — `<Checkpoint id="{track}/{slug}" />`. The questions live in the sidecar (§9).
10. **Further reading** — `## ` heading, three to six links, official docs first, every URL fetched and confirmed to resolve. No book titles unless the ISBN or publisher page was verified.

Sections 3–6 are `standard` depth by default. Mark the first example and the TL;DR as `quick` by wrapping the first example in `<Depth level="quick">`. Interview questions never appear in the article; they go to the interview sidecar.

## 3. Length and density

- 400–900 lines including code, frontmatter and sidecar references. A topic that needs more should be split into two topics with a `related` link.
- Every paragraph earns its place. If a sentence can be deleted without losing information, delete it.
- Paragraphs are two to five sentences that develop one idea. Never put every sentence in its own paragraph; a run of one-sentence paragraphs reads like a slide deck. Use a single-sentence paragraph only for a deliberate emphasis or a transition.
- No introductions ("In this article we will…"), no outros ("By mastering…"), no rule-of-three padding, no "comprehensive", "deep dive into", "it is worth noting", "in today's fast-paced world".
- Headings are noun phrases or short claims, not questions.

## 4. Voice

- English: native, direct, present tense, second person where natural. Contractions are fine. Prefer short sentences. Technical terms are used precisely and consistently with the glossary.
- Chinese: 地道的中文技术写作，不是翻译腔。段落同样以两到五句为一段，围绕一个意思展开；不要一句一段。用短句，主谓宾清楚。术语以术语表为准；首次出现的术语给出英文原文，例如「闭包（closure）」。中西文之间加一个空格（「Python 3.14 的 `asyncio`」），全角标点（，。；：？！「」），代码、数字、英文单词之间不用全角标点。不用「本文将」「让我们」「值得注意的是」。
- Both: no emoji, no exclamation marks, no marketing adjectives.

## 5. Currency

- State the verified version in frontmatter (`verified.version`, e.g. `Python 3.14`, `Node 24`, `TypeScript 6`, `Go 1.27`, `Rust 1.98`, `React 19`, `Java 25 LTS`, `Kubernetes 1.34`, `LangChain 1.x`, `Claude Developer Platform (2026-09)`) and the date checked.
- APIs removed or deprecated in the verified version must not be taught as current. Mention a deprecated form only inside a pitfall ("code generated from older tutorials still uses…").
- AI/LLM content: name current models and SDK entry points only; anything older than the verified date must be labelled as historical.

Place `<TryToBreak items={[...]} />` after the main runnable example and its output when two to four concrete edge cases would help the reader test the example's limits. Keep the English and Chinese item lists aligned in count and meaning; the component receives the preceding runnable code at build time, so authors provide only `items`.

## 6. Code

- Runs. Before publishing, every runnable block is executed with the local toolchain (`python3`, `node`, `tsc`/`tsx`, `go run`, `cargo run`, `java`, `dotnet`, `php`, `swift`, `kotlinc` where installed) and the shown output is the real output. Where a toolchain is missing, the block is marked with a comment `# not executed here: {reason}` and the reviewer is told in the report.
- Self-contained: imports at the top, no undefined names, no `...` placeholders, no reliance on files that do not exist. Sample data is inline.
- Realistic: variable names from the problem domain, not `foo`/`bar`. Comments explain *why*, not what.
- Short: ten to forty lines per block. Split longer examples.
- Idiomatic for the verified version (f-strings, `match`, `TaskGroup`, `const`/`let`, `async/await`, generics with `type` parameters, etc.).
- Fence meta: ` ```python run title="make_counter.py" `. Optional `highlight="3-4"`. Output blocks use ` ```text `.

For reusable SQL fixtures, a visible ` ```sql seed="name" ` fence without `run` declares the setup SQL, and a ` ```sql run seed="name" ` fence runs that setup before its query. Seed names are page-local; the first declaration wins, and the declaration remains a normal code block so readers can inspect the schema and rows.

## 7. Bilingual rule

- One topic is one text in two languages. The zh file mirrors the en file heading for heading, paragraph for paragraph, code block for code block (code identical, comments translated). Lists keep the same number of items.
- Pick the better existing draft as canonical, rewrite it to this standard, then translate. Never merge two different articles into one by keeping "the best parts of each" without reconciling both languages.
- Translation is faithful in meaning and native in form. Do not translate identifiers, commands, file names or error messages. Chinese explanations of English error messages quote the English message verbatim.

## 8. Frontmatter

```yaml
---
title: Closures                       # zh: 闭包
description: Functions that carry their birthplace with them, and the one trap that catches everybody once.   # 40–170 chars
track: python
section: functions-deeper
difficulty: intermediate              # beginner | intermediate | advanced
tags: [closures, scope, nonlocal]
prerequisites: [python/functions, python/scope-legb]
related: [python/decorators, python/functools, javascript/closures]
terms: [free-variable, enclosing-scope, late-binding, cell]
verified: { version: "Python 3.14", date: 2026-09-03 }
reviewed: 2026-09-03
status: reviewed
aligned: true                         # set by the alignment checker, not by hand
quiz: python/closures
sources:
  - { title: "Python Language Reference — Naming and binding", url: "https://docs.python.org/3/reference/executionmodel.html#naming-and-binding" }
origin: old/src/content/docs/python/closures.zh.md
---
```
`title` and `description` are in the file's language. Everything else is identical between the two files.

## 9. Sidecars

- **Quiz** `src/content/quizzes/{track}/{slug}.yaml`: three to eight items; at least one `predict` (code + three or four candidate outputs) and, where the topic allows, one `review` item (a realistic generated snippet with two or three subtle issues, each with `line`, `kind` in `bug | security | performance | style | api`, and a bilingual `note`). Every item has `prompt`, `explanation` and option texts in both languages.
- **Interview** `src/content/interview/{track}.yaml`: append two to five questions with concise model answers in both languages and `topics: [{track}/{slug}]`.
- **Glossary proposals** `content/glossary-proposals/{track}-{slug}.yaml`: any term used in `terms:` that does not exist yet in `src/content/glossary/`, with `id`, `en`, `zh`, `short` (both languages, ≤ 140 chars).

## 10. What to drop from the old articles

- "Core principles" sections that restate the concept section.
- "Performance considerations" without numbers.
- "Real-world scenarios" that are hypothetical.
- Interview questions (move to the sidecar) and "summary" sections.
- Any link, book, paper or tool whose existence was not verified.
- Duplicate implementations of the same example in several frameworks; keep one and link to the topic that owns the other.

## 11. Definition of done

A topic is `status: reviewed` only when: the structure in §2 is present; length is within §3; all runnable blocks executed and outputs recorded; `pnpm content:check {track}/{slug}` passes (schema, zh typography, code syntax, links, alignment); the zh and en files are aligned (`aligned: true` was set by the checker); the quiz sidecar validates; `reviewed` and `verified` are set to the date of this pass.
