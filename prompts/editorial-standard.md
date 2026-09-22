# codewiki Editorial Standard

This is the contract every topic on codewiki.com must meet before it is published. It is written for the agent or person doing the writing. Read it fully before touching a topic.

## 1. Purpose of a topic

A topic explains one concept or tool so that a smart colleague can understand what it is and why it exists, see it work in runnable code, avoid the mistakes people actually make, and check their understanding. It is a reference first and a lesson second: the first screen must already answer the question in the title.

## 2. Structure (in this order)

1. **Frontmatter** (see §8).
2. **TL;DR** — `<TLDR>` with three cells. Default labels `what` / `trap` / `fix`; for tool topics use `what` / `when` / `how`. Each cell is one or two sentences.
3. **What it is and why it exists** — `## ` heading in the reader's language. The required skeleton sections use these exact H2 names (en / zh): `What it is and why it exists` / `是什么，为什么存在`, `How it works` / `工作原理`, `Examples` / `示例`, `Pitfalls` / `陷阱`, `Further reading` / `延伸阅读`; only deep-dive sections choose their own headings. Definition, the problem it solves, when you meet it. No history lesson unless the history explains a design decision.
4. **How it works** — the mechanics. One Mermaid diagram (` ```mermaid `) if a structure or flow is clearer drawn than described; none otherwise.
5. **Examples** — two to four runnable examples that build on each other. Every example that the language allows to run in the browser carries the fence meta `run title="file.ext"` (Python, JavaScript, TypeScript; SQL when the example is self-contained). Every example shows its output in a fenced block ` ```text ` immediately after it, and that output was produced by actually running the code (see §6).
6. **Pitfalls** — three to six, each as `> [!PITFALL]` followed by the fix. "Best practices" belong here as the fix side of a pitfall; do not write a separate best-practices list.
7. **AI collaboration, when it earns a section** — optional. Include `## In the AI era` / `## AI 时代` only when this particular topic creates a concrete way for a person and an AI coding tool to work better together that is likely to remain useful as models improve. Ground it in the topic's mechanics, examples, or tests. Omit unsupported claims about what models tend to get wrong, generic requests to check code, review checklists that restate the pitfalls, and prompt-vocabulary lists. Put ordinary engineering guidance in the explanation or Pitfalls section instead. Do not force a fixed internal structure or length on an included section.
8. **Deep dive** — `<Depth level="deep">` around one or more `## ` sections: internals, edge cases, performance with measured numbers or no performance claims at all.
9. **Checkpoint** — `<Checkpoint id="{track}/{slug}" />`. The questions live in the sidecar (§9).
10. **Further reading** — `## ` heading, three to six links, official docs first, every URL fetched and confirmed to resolve. No book titles unless the ISBN or publisher page was verified.

Sections 3–6 are `standard` depth by default. Mark the first example and the TL;DR as `quick` by wrapping the first example in `<Depth level="quick">`. Interview questions never appear in the article; they go to the interview sidecar.

## 3. Length and density

- 100–900 lines including code and frontmatter. Treat the floor as a guardrail against missing substance, not a target: never pad an article to reach a line count. A topic that needs more than the maximum should be split into two topics with a `related` link.
- Every paragraph earns its place. If a sentence can be deleted without losing information, delete it.
- Paragraphs are two to five sentences that develop one idea. Never put every sentence in its own paragraph; a run of one-sentence paragraphs reads like a slide deck. Use a single-sentence paragraph only for a deliberate emphasis or a transition.
- No introductions ("In this article we will…"), no outros ("By mastering…"), no rule-of-three padding, no "comprehensive", "deep dive into", "it is worth noting", "in today's fast-paced world".
- Headings are noun phrases or short claims, not questions.

## 4. Voice

- English: native, direct, present tense, second person where natural. Contractions are fine. Prefer short sentences. Technical terms are used precisely and consistently with the glossary.
- Chinese: write natural technical Chinese, without translationese. Use two to five sentences per paragraph to develop one idea; do not put every sentence in its own paragraph. Prefer short sentences with a clear subject, verb and object. Follow the glossary and include the English term on first mention, for example 「闭包（closure）」. Put one space between Chinese characters and adjacent Latin text, as in 「Python 3.14 的 `asyncio`」. Use Chinese punctuation (，。；：？！「」) in Chinese prose, but not between code tokens, numbers or English words. Avoid 「本文将」「让我们」「值得注意的是」.
- Both: no emoji, no exclamation marks, no marketing adjectives.
- MDX: raw `<` or `>` in prose must be escaped as an HTML entity or placed in inline code.

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
`title` and `description` are in the file's language. Everything else is identical between the two files. A `title` is a noun phrase of at most 40 characters with no colon or subtitle (`Closures`, `CAP theorem`, `asyncio`); everything that explains the title belongs in `description` (≤ 160 characters).

## 9. Sidecars

- **Quiz** `src/content/quizzes/{track}/{slug}.yaml`: `predict` items pair code with three or four candidate outputs; `spotbug` and `review` items carry a realistic snippet whose issues each name a `line`, a `kind` and a bilingual `note`. Every item has `prompt`, `explanation` and option texts in both languages.
- **Interview** `src/content/interview/{track}.yaml`: append questions with model answers in both languages and `topics: [{track}/{slug}]`.
- **Glossary proposals** `content/glossary-proposals/{track}-{slug}.yaml`: any term used in `terms:` that does not exist yet in `src/content/glossary/`, with `id`, `en`, `zh`, `short` (both languages, ≤ 140 chars).

How many, how long, how hard:

- Quiz banks: 4–8 items; at least one predict and one spotbug when the topic has runnable code; one review item per topic (15–25 lines of realistic generated code for a stated task, 3–5 issues with distinct kinds from security | correctness | edge-case | readability | performance, plus task, right (what the generated code did well) and a 3–4 item checklist the learner should run). Distractors are real misconceptions; explanations are one or two sentences per language.
- Interview items: 3–5 per topic, each with section (the heading it is grouped under, e.g. "Language core"), level, frequency (common | occasional | rare) and an answer of 60–120 words in each language — the length you would say aloud.

## 10. What to drop from the old articles

- "Core principles" sections that restate the concept section.
- "Performance considerations" without numbers.
- "Real-world scenarios" that are hypothetical.
- Interview questions (move to the sidecar) and "summary" sections.
- Any link, book, paper or tool whose existence was not verified.
- Duplicate implementations of the same example in several frameworks; keep one and link to the topic that owns the other.

## 11. Definition of done

A topic is `status: reviewed` only when: the required structure in §2 is present; length is within §3; runnable outputs have real execution evidence; `pnpm content:check {track}/{slug}` passes (schema, zh typography, code syntax, links, alignment); the zh and en files are aligned (`aligned: true` was set by the checker); the quiz sidecar validates; and `reviewed` is set to the date of this editorial pass. Preserve `verified.date` during a prose-only review; update it only when the runnable examples are executed again against the stated target.
