# P2a fix round 2 — remaining Chinese UI residue (I1)

Base: `39796eb` on `p2-learning-layer`.

## Residues and fixes

| Residue | Source fix |
| --- | --- |
| `/zh/practice/` shipped `0d` in its JavaScript-disabled HTML and changed it to `0天` only after `TodayStrip` hydrated. | `src/pages-shared/Practice.astro` now renders the initial streak with `t(locale, 'practice.daysShort', { count: 0 })`. The same page's head title now uses `practice.title` instead of the English literal `Practice`. |
| Markdown-generated controls and labels depended on the client-side `data-i18n` swap, leaving `Copy`, `Run`, `Pitfall`, `Switch to Deep`, and `Ask AI about this section` in Chinese HTML when JavaScript was disabled. | The remark/rehype callout, codebox, and section-action renderers now select the dictionary locale from the `.zh.md`/`.zh.mdx` source path or an explicit renderer locale. `Callout.astro` and `Depth.astro` render through `t()` too. Both the visible section-action text and its `aria-label` are localized at render time. |
| Interview answers rendered Markdown through an English-only shared renderer, so code-fence `Copy` buttons were English without hydration. | `renderMarkdown()` now accepts and caches by locale, configures its Markdown plugins with that locale, and `InterviewQuestion.astro` passes the page locale. |
| The dormant cheatsheet rules card bypassed `t()` for its label, heading, and description. | Added `cheatsheets.rulesPack`, `cheatsheets.rulesTitle`, and `cheatsheets.rulesDesc` in both dictionaries and routed the card through them. The Chinese copy is `规则包`, `供编码智能体使用的 {track} 规则`, and `下载本方向的易错点与最佳实践，格式可供编码智能体直接读取。` |
| An unmapped planned path node fell back to a title-cased English slug. | Added `paths.planned.unknown`; the Chinese fallback is `待编写主题：{id}`, preserving the identifier verbatim while keeping the UI Chinese. Existing planned-node `即将上线` labels remain routed through `paths.soon`. |
| `CodeRunners` carried English-only default strings for controls created by the island. | The island now receives the same localized runner labels as props and uses them if the page-level map is unavailable. `renderCode()` also requires its caller to provide the copy label instead of defaulting to English. |
| Intentional bilingual English terms on the cheatsheet and flashcard faces were not identified as English-language content. | Added `lang="en"` to the English vocabulary and flashcard face text. Flashcard cues and tags remain supplied from localized dictionary labels to `faceOf()`; there are no hard-coded English cues in `src/lib/cards.ts`. |

`src/i18n/zh.ts` was compared with the English dictionary. The values that remain identical are placeholders, glyphs, filenames, or required identifiers/product names such as `⌘K`, `llms.txt`, `RSS`, `TL;DR`, `functools`, and `asyncio`; no English UI sentence remains as an equal-value placeholder. Existing Chinese empty states, placeholders, control titles, card labels, and planned-node labels were also rechecked at their call sites.

Three unit cases now cover Chinese server rendering for callout labels, codebox controls, and section-action visible/accessibility text.

## Localization browser matrix

Each page is loaded once with `browser.newContext({ javaScriptEnabled: false })` and once with JavaScript enabled, for 22 localization checks total:

- `/zh/`
- `/zh/python/closures/`
- `/zh/practice/`
- `/zh/practice/predict/python/closures/predict-loop-binding/`
- `/zh/paths/`
- `/zh/paths/python-from-zero/`
- `/zh/practice/interview/python/`
- `/zh/practice/flashcards/`
- `/zh/cheatsheets/`
- `/zh/cheatsheets/python/`
- `/zh/settings/`

The scan covers visible text nodes under headings, paragraphs, buttons, links, labels, `.lbl`, `.tag`, and the practice statistics, plus visible `placeholder`, `aria-label`, and `title` values. It rejects ASCII-only text containing Latin letters unless it is in the existing identifier/product allow-list or is explicitly marked `lang="en"`. Code, preformatted output, keyboard hints, hidden content, and `aria-hidden` content are excluded.

Focused result: `tests/e2e/localization.spec.ts` — **22 passed in 5.1 s**.

## Gate

Port 4321 was occupied by another worktree during an initial attempt. The required bounded wait was used until the port was free; the final gate then ran against this worktree's freshly built `dist`.

| Command | Result |
| --- | --- |
| `pnpm lint` | PASS — ESLint clean; Prettier clean. |
| `pnpm check` | PASS — 230 files, 0 errors, 0 warnings, 1 existing hint in `src/lib/runners/protocol.ts:119`. |
| `pnpm test` | PASS — 30 files, 300 tests. |
| `pnpm build` | PASS — 97 pages; Pagefind indexed 36 pages in 2 languages from 98 HTML files. |
| `pnpm check:links` | PASS — 1,783 internal links across 98 pages. |
| `pnpm test:e2e` | PASS — 199 tests in 55.3 s. |

`docs/superpowers/STATUS.md` was not edited. Nothing was pushed.

TASK DONE
