# Translation brief: replace the Chinese UI placeholders in `src/i18n/zh.ts`

`src/i18n/zh.ts` currently holds placeholder values: every string is the English copy prefixed with `[zh] `.
Replace each of them with real Simplified Chinese UI copy.

## Inputs

- Source of truth (English): `src/i18n/en.ts`
- File to edit (the only one): `src/i18n/zh.ts`
- Test: `pnpm vitest run tests/unit/i18n.test.ts`

## Steps

1. Read `src/i18n/en.ts` and `src/i18n/zh.ts` in full.
2. For every value in `zh.ts` that starts with `[zh] `, write the Chinese copy for the same key, using the English string in `en.ts` as the source. Remove the `[zh] ` prefix.
3. Change nothing else: keep every key, the key order, the `import en from './en';` line, the comments and the `satisfies Record<keyof typeof en, string>` clause exactly as they are. Do not add or remove keys, and do not touch any other file.
4. Run `pnpm vitest run tests/unit/i18n.test.ts` and fix your own output until it passes.
5. Print `TRANSLATE-UI DONE` as the last line once the test passes, or `TRANSLATE-UI FAILED: {reason}`.

## Rules for the copy

- Audience is working developers. Write concise, natural technical Chinese as a Chinese developer tool would — not translationese, not a literal word-for-word rendering.
- Keep every `{var}` placeholder (`{min}`, `{count}`, `{version}`, `{done}`, `{total}`, `{left}`) spelled exactly as in the English value. A key may reorder them around the Chinese sentence, but none may be dropped, renamed or translated. Example: `'topic.readTime'` becomes `'标准深度约 {min} 分钟'`.
- Keep product names, brand names, language names, file names, commands, code identifiers and keyboard hints in English: `codewiki`, `Claude`, `ChatGPT`, `Python`, `JavaScript`, `TypeScript`, `Markdown`, `llms.txt`, `RSS`, `TL;DR`, `GitHub`, `⌘K`.
- Nav labels, buttons, tags and other chrome should be short — prefer 2 to 6 characters (`nav.aiEra: 'AI 时代'`, `depth.quick: '速览'`, `depth.standard: '标准'`, `depth.deep: '深入'`, `code.run: '运行'`, `code.copy: '复制'`). Descriptions and body copy may be full sentences.
- Use full-width punctuation (`，。：、；？「」`) in Chinese prose; keep half-width punctuation inside Latin fragments, and keep the `·` separators that the English copy uses.
- Put one space between CJK characters and adjacent Latin letters, digits or code (`标准深度约 9 分钟`, `EN + 中文`).
- Lower-case English eyebrow labels stay lower-case in spirit but read as normal Chinese labels (`home.ai.label: '问问你的 AI'`).
- `bilingual.on` stays `'EN + 中文'`.
- Match the register of the English string: a heading stays a heading, a question stays a question, a warning stays a warning.
