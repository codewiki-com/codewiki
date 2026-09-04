# codewiki

codewiki is a bilingual, static knowledge base for learning programming concepts in depth. Astro
builds the content and Preact islands add browser-local interaction; reading history, settings and
practice data never require an account.

## Features

- Depth-aware English and Simplified Chinese topic pages with aligned bilingual reading.
- Practice catalogue and standalone multiple-choice, predict-output, fill, spot-bug and code-review
  exercises, including topic checkpoints and interview banks.
- Guided learning paths with milestone maps, prerequisites, time plans and browser-local progress.
- Spaced-repetition flashcards from glossary terms, missed quiz items and manually selected cards.
- Printable bilingual cheatsheets with Markdown twins and row-level Ask AI actions.
- In-browser Playground for Python, JavaScript, TypeScript, SQL and sandboxed HTML/CSS, with
  shareable state and kata tests.
- Prompt Builder for topic-aware explanations, quizzes, reviews, ports, tests and Socratic prompts.
- Generated `CLAUDE.md`, `AGENTS.md`, Cursor rules packs and size-bounded Markdown context packs.
- Static JSON/Markdown endpoints, `llms.txt`, search, accessible light/dark themes and no account or
  server-side runtime.

## Development

Requires Node.js 24 or newer and pnpm 10.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm build` vendors the browser runtimes, creates the static site in `dist/`, and builds the
Pagefind index. The complete release gate is:

```sh
pnpm lint && pnpm check && pnpm test && pnpm build && pnpm check:links && pnpm test:e2e && pnpm exec lhci autorun
```

Developer documentation lives in `docs/dev/`, including the
[learning-layer guide](docs/dev/learning-layer.md) and [deployment notes](docs/dev/deploy.md).
