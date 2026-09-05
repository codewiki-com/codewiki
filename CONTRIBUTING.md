# Contributing to codewiki

Thank you for helping make codewiki more accurate. Small corrections are useful, especially when
they include a reproducible example or a primary source.

## Report a content error

Open the [content-error issue form](https://github.com/codewiki-com/codewiki/issues/new?template=content-error.yml).
Include the affected page URL, what is wrong, what you expected, and the runtime or tool version
you used. Please do not include secrets or private source code.

## Fix a topic

Topic pairs live in `src/content/topics/{track}/{slug}.en.mdx` and
`src/content/topics/{track}/{slug}.zh.mdx`.

1. Edit both language files. Keep their headings, paragraphs, lists, examples, and other blocks in
   the same order and aligned in meaning.
2. Follow [`prompts/editorial-standard.md`](prompts/editorial-standard.md). Preserve technical
   identifiers, commands, filenames, and output where the standard requires them to match.
3. Execute every runnable example with the target runtime. Record its actual output in the topic;
   an AI-assisted draft is welcome, but unexecuted examples are not.
4. Run `pnpm content:check {track}/{slug}` and resolve every schema, syntax, link, typography, and
   bilingual-alignment error.

## Project gates

Requires Node.js 24 or newer and pnpm 10. Install dependencies with
`pnpm install --frozen-lockfile`, then run:

```sh
pnpm lint
pnpm check
pnpm test
pnpm build
pnpm check:links
pnpm test:e2e
```

Run the focused `pnpm content:check {track}/{slug}` command as well whenever a topic changes.

## Commits and licences

Developer Certificate of Origin sign-off is not required; do not add a `Signed-off-by` trailer
unless your own workflow calls for one. By contributing, you agree that code changes are licensed
under the repository's MIT License and changes to the content paths listed in
[`LICENSE-CONTENT.md`](LICENSE-CONTENT.md) are licensed under CC BY-SA 4.0.
