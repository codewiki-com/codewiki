# Phase A repository report

Date: 2026-09-05  
Branch: `phase-a-repo`

## Outcome

- A7 publishes the real repository URL, the MIT/CC BY-SA licence split, contributor guidance,
  issue and pull-request templates, and bilingual contribution pages.
- A2 replaces unsupported AI-era claims with specific developer responsibilities, explains the
  production and verification process in both languages, and tightens the editorial rule for
  claims about generated code.
- A6 emits install-ready Cursor project rules at
  `/rules/{track}/codewiki-{track}.mdc`, preserves `/rules/{track}/cursor.mdc` as a byte-identical
  alias, and publishes bilingual install pages for Claude Code, Codex/agents, and Cursor.
- `home.sub` and the parallel UI work (`Home`, `Tracks`, `MetaPanel`, `DailyKata`, `Nav`, and
  `scripts/content/check.ts`) were not edited. The existing AI-era track description was inspected
  and left unchanged because it makes no unsupported claim. No `AiEra.astro` file exists.

## Commits

- `e21ed54` — `feat: publish contribution and licensing guides` (A7)
- `cbca629` — `docs: make AI-era framing evidence based` (A2)
- A6 is the final `feat: publish install-ready Cursor rules` commit that contains this report.

Each commit uses `codewiki <tomchen.org@gmail.com>` and was created with an explicit path list.

## Files added

### A7

- `.github/ISSUE_TEMPLATE/content-error.yml`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `CONTRIBUTING.md`
- `LICENSE`
- `LICENSE-CONTENT.md`
- `src/pages-shared/Contribute.astro`
- `src/pages/contribute.astro`
- `src/pages/zh/contribute.astro`

### A2

- `tests/e2e/about.spec.ts`

### A6

- `src/pages-shared/Rules.astro`
- `src/pages/rules/[track]/index.astro`
- `src/pages/zh/rules/[track]/index.astro`
- `tests/e2e/rules.spec.ts`
- `.superpowers/sdd/phase-a/report.md`

## Files modified

### A7

- `README.md`
- `src/components/Footer.astro`
- `src/data/site.ts`
- `src/i18n/en.ts`
- `src/i18n/zh.ts`
- `src/pages-shared/About.astro`
- `tests/e2e/seo.spec.ts`

### A2

- `README.md`
- `prompts/editorial-standard.md`
- `public/manifest.webmanifest`
- `src/i18n/en.ts`
- `src/i18n/zh.ts`
- `src/pages-shared/About.astro`

### A6

- `README.md`
- `docs/dev/learning-layer.md`
- `src/i18n/en.ts`
- `src/i18n/zh.ts`
- `src/lib/og.ts`
- `src/lib/rules.ts`
- `src/pages-shared/Cheatsheet.astro`
- `src/pages-shared/TrackHub.astro`
- `src/pages/llms.txt.ts`
- `src/pages/rules/[track]/[file].ts`
- `tests/e2e/endpoints.spec.ts`
- `tests/unit/og.test.ts`
- `tests/unit/rules.test.ts`

## Repository URL and licence checks

- `SITE.repo`: `https://github.com/codewiki-dev/codewiki` →
  `https://github.com/codewiki-com/codewiki`.
- Topic edit links resolve below
  `https://github.com/codewiki-com/codewiki/edit/main/src/content/topics/…`.
- About links to the repository, editorial standard, error form, and local contribution page.
- Contribution links resolve below `/blob/main/` for `CONTRIBUTING.md`, `LICENSE`, and
  `LICENSE-CONTENT.md`; the error link selects `content-error.yml`.
- Code is MIT, copyright `2026 codewiki contributors`.
- Prose/editorial content under `src/content/**`, `content/**`, and `docs/design/**` is CC BY-SA
  4.0. The specified attribution is:
  `Adapted from codewiki contributors, licensed under CC BY-SA 4.0.`

## Copy changes

`<absent>` means the string or paragraph was added. This inventory covers every changed
site-facing string and every documentation/editorial sentence changed as part of the copy sweep.

### A7 — contribution and licence copy

| Locale/key | Before | After |
| --- | --- | --- |
| EN `about.contact.after` | ` link to open the codewiki repository.` | ` page.` |
| ZH `about.contact.after` | `链接前往 codewiki 仓库。` | `页面。` |
| EN `contribute.title` | `<absent>` | `Contribute to codewiki` |
| EN `contribute.description` | `<absent>` | `Report a content error, correct a bilingual topic, or contribute to the codewiki project.` |
| EN `contribute.lead` | `<absent>` | `Corrections are welcome. The contribution guide explains the editorial checks and review process for content and code changes.` |
| EN `contribute.guide` | `<absent>` | `Read CONTRIBUTING.md` |
| EN `contribute.report.title` | `<absent>` | `Report a content error` |
| EN `contribute.report.body` | `<absent>` | `Tell us which page is affected, what is wrong, what you expected, and the runtime version you used.` |
| EN `contribute.report.link` | `<absent>` | `Open the content-error form` |
| EN `contribute.licences.title` | `<absent>` | `Licences` |
| EN `contribute.licences.body` | `<absent>` | `Code and site content use separate licences. Contributions are accepted under the licence that applies to the files you change.` |
| EN `contribute.licences.code` | `<absent>` | `Code: MIT License` |
| EN `contribute.licences.content` | `<absent>` | `Content: Creative Commons Attribution-ShareAlike 4.0` |
| ZH `contribute.title` | `<absent>` | `参与 codewiki 贡献` |
| ZH `contribute.description` | `<absent>` | `报告内容错误、修正双语主题，或为 codewiki 项目贡献代码。` |
| ZH `contribute.lead` | `<absent>` | `欢迎提交修正。贡献指南说明了内容与代码变更需要通过的编辑检查和审查流程。` |
| ZH `contribute.guide` | `<absent>` | `阅读 CONTRIBUTING.md` |
| ZH `contribute.report.title` | `<absent>` | `报告内容错误` |
| ZH `contribute.report.body` | `<absent>` | `请告诉我们受影响的页面、错误之处、预期内容，以及你使用的运行时版本。` |
| ZH `contribute.report.link` | `<absent>` | `打开内容错误报告表单` |
| ZH `contribute.licences.title` | `<absent>` | `许可协议` |
| ZH `contribute.licences.body` | `<absent>` | `代码与网站内容采用不同的许可协议。你提交的贡献适用其所修改文件对应的许可协议。` |
| ZH `contribute.licences.code` | `<absent>` | `代码：MIT License` |
| ZH `contribute.licences.content` | `<absent>` | `内容：知识共享署名—相同方式共享 4.0` |

README additions (before: absent):

- `Corrections and code contributions are welcome. See CONTRIBUTING.md for the bilingual editorial workflow, example-execution requirement, and project gates.`
- `Source code is available under the MIT License. Prose and other editorial content under src/content/**, content/**, and docs/design/** is licensed under CC BY-SA 4.0.`

### A2 — honest framing

| Locale/key | Before | After |
| --- | --- | --- |
| EN `home.feature.3.desc` | `English and Chinese are the same text, paragraph for paragraph. Read them side by side and learn the terminology as you go.` | `English and Chinese topic pairs follow the same structure, with build checks for alignment. Read corresponding paragraphs side by side and compare the terminology.` |
| EN `home.feature.4.title` | `Practice that sticks` | `Practice from each topic` |
| EN `home.feature.4.desc` | `Predict-the-output, spot-the-bug, checkpoint quizzes and spaced-repetition flashcards built from what you read.` | `Predict-the-output, spot-the-bug, checkpoint quizzes and spaced-repetition flashcards link back to the material they test.` |
| EN `home.feature.5.title` | `Made for your AI too` | `Formats for AI assistants` |
| EN `home.feature.5.desc` | `Every page has a Markdown twin and an llms.txt index. One click opens Claude or ChatGPT with the right section and a prompt that teaches.` | `Topic pages have Markdown twins and an llms.txt index. Page actions prepare the selected context and a request for Claude or ChatGPT.` |
| EN `home.feature.6.desc` | `Each topic states the language version it was checked against and when. Stale pages are flagged, not hidden.` | `Each topic states the target version and verification date, so readers can judge whether the material is current for their environment.` |
| ZH `home.feature.3.desc` | `英文与中文内容一致，逐段对应。并排阅读，顺手掌握专业术语。` | `中英文主题采用相同结构，并由构建检查验证对齐。并排阅读对应段落，对照两种语言的专业术语。` |
| ZH `home.feature.4.title` | `真正记得住的练习` | `与主题对应的练习` |
| ZH `home.feature.4.desc` | `根据阅读内容设计输出预测题、找错题、阶段测验和间隔复习闪卡。` | `输出预测题、找错题、阶段测验和间隔复习闪卡都会链接回它们所考查的内容。` |
| ZH `home.feature.5.title` | `你的 AI 也能读` | `供 AI 助手读取的格式` |
| ZH `home.feature.5.desc` | `每个页面都有对应的 Markdown 和 llms.txt 索引。一键在 Claude 或 ChatGPT 中打开相关章节，并附上引导学习的提示词。` | `主题页面提供对应的 Markdown 和 llms.txt 索引。页面操作会为 Claude 或 ChatGPT 准备所选上下文与具体请求。` |
| ZH `home.feature.6.desc` | `每个主题都会注明验证所用的语言版本和时间。过时页面会明确标记，不会隐藏。` | `每个主题都会注明目标版本和验证日期，读者可据此判断内容是否适用于自己的环境。` |
| EN `about.what.body` | `codewiki is a programming reference and a course in one place, for programmers from beginner to advanced. Every topic gives its answer in the first screen, includes examples that run in the browser, and has a clean Markdown twin that can be handed directly to an AI. The English and Chinese editions contain the same text, paragraph for paragraph.` | `codewiki is a programming reference and a course in one place, for programmers from beginner to advanced. Every published topic gives its answer in the first screen and has a clean Markdown twin. Examples run in the browser where the language is supported. The English and Chinese editions share an aligned structure and cover the same material.` |
| ZH `about.what.body` | `codewiki 把编程参考手册和系统课程放在同一个地方，面向从初学者到高级工程师的读者。每个主题都会在首屏给出答案，包含可直接在浏览器中运行的示例，同时提供整洁的 Markdown 对应版本，可直接交给 AI。英文版与中文版逐段对应，内容一致。` | `codewiki 把编程参考手册和系统课程放在同一个地方，面向从初学者到高级工程师的读者。每个已发布主题都会在首屏给出答案，并提供整洁的 Markdown 对应版本。语言受支持时，示例可直接在浏览器中运行。英文版与中文版结构对齐，覆盖相同内容。` |
| EN `about.why.body` | `Coding agents now write most first drafts. The scarce skill is the ability to read code, review it, and specify the next change precisely. Every codewiki topic therefore ends with an “In the AI era” section that names the characteristic failure modes of generated code for that subject. Review katas train the same judgment on concrete examples. Rules packs and the prompt builder carry those pitfalls into the instructions you give an agent.` | `AI increasingly writes code; developers still have to understand implementations, state constraints and verify results. Every codewiki topic therefore ends with an “In the AI era” section that names the failure modes to check in generated code for that subject. Review katas exercise the same judgment on concrete examples. Rules packs and the prompt builder carry those checks into the instructions you give an agent.` |
| ZH `about.why.body` | `如今，编码智能体已经承担大多数初稿。真正稀缺的能力，是准确阅读和审查代码，并清楚说明下一步需要什么。每个 codewiki 主题都以「在 AI 时代」一节收尾，列出生成代码在该主题上常见的失效方式。代码审查 kata 用具体示例训练同一种判断力；规则包和提示词构建器则把这些易错点带进你交给智能体的指令。` | `AI 正在越来越多地编写代码；开发者仍要理解实现、说明约束并验证结果。每个 codewiki 主题都以「在 AI 时代」一节收尾，列出该主题下需要检查的生成代码失效模式。代码审查 kata 用具体示例练习同一种判断力；规则包和提示词构建器则把这些检查项带进你交给智能体的指令。` |
| EN `about.made.title` | `<absent>` | `How this content is made` |
| EN `about.made.body` | `<absent>` | `Drafts are written with AI assistance under a public editorial standard. Every runnable example is executed, and its observed output is recorded. A build gate checks that the English and Chinese editions remain aligned. Editors spot-check explanations, sources, and results. Every page has a “Report an error” link, and the public repository accepts corrections. The site’s own argument is that generated text must be verified instead of trusted on sight, so it applies that standard to itself: claims are scoped, examples are reproducible, verification dates are visible, and readers can inspect the sources or challenge a result.` |
| EN `about.made.standard` | `<absent>` | `Read the editorial standard` |
| EN `about.made.report` | `<absent>` | `Report an error` |
| ZH `about.made.title` | `<absent>` | `这些内容如何制作` |
| ZH `about.made.body` | `<absent>` | `内容初稿会在公开编辑规范下借助 AI 完成。每个可运行示例都会实际执行，并记录观察到的输出；构建门禁还会检查中英文版本是否保持对齐。编辑会抽查解释、来源和结果。每个页面都提供「报告错误」链接，公开仓库也接受修正。codewiki 主张生成文本不能直接采信，必须经过验证，因此也用同一标准要求自身：限定断言范围，提供可复现的示例和可见的验证日期，并让读者能够检查来源或质疑结果。` |
| ZH `about.made.standard` | `<absent>` | `阅读编辑规范` |
| ZH `about.made.report` | `<absent>` | `报告错误` |
| EN `promptBuilder.title` | `Build a prompt that teaches.` | `Build a prompt with checks.` |
| EN `promptBuilder.sub` | `Pick a topic, a goal and your level. Build a sourced prompt with precise vocabulary and checks. Nothing leaves this page until you open your assistant.` | `Pick a topic, a goal and your level. The result includes selected source links, precise vocabulary and explicit checks. Code you paste stays in the page until you open your assistant.` |
| ZH `promptBuilder.title` | `构建真正能教会你的提示词。` | `构建带核对项的提示词。` |
| ZH `promptBuilder.sub` | `选择主题、目标和你的水平，生成带可靠来源、准确术语与核对项的提示词。在你打开自己的 AI 助手前，任何内容都不会离开此页面。` | `选择主题、目标和你的水平。结果会包含所选来源链接、准确术语与明确核对项。你粘贴的代码只会在打开自己的 AI 助手时离开此页面。` |
| Web manifest description | `Master code in the AI era — a bilingual programming reference that reads offline.` | `Master code in the AI era — a bilingual programming reference with offline access.` |
| README framing | `<absent>` | `AI increasingly writes code; developers still have to understand implementations, state constraints and verify results. codewiki focuses on making those checks concrete and reproducible.` |
| Editorial standard, “In the AI era” rule | `<absent>` | `Do not write unevidenced generalisations such as “AI often does X.” Name the failure modes to check in that scenario, and give each one a counterexample or failing test.` |

The tagline `Master code in the AI era` is unchanged. The English production paragraph is 97 words,
within the requested 90–130-word range. The copy was reviewed with the `humanizer` skill; this led
to removing promotional or unprovable formulations such as “Practice that sticks” and “a prompt
that teaches,” while keeping concrete, testable statements.

### A6 — rules and install copy

| Locale/key or output | Before | After |
| --- | --- | --- |
| EN `rules.pageTitle` | `<absent>` | `{track} rules for coding agents` |
| EN `rules.pageDescription` | `<absent>` | `Download {track} pitfalls and review checks for Claude Code, Codex, other agents, or Cursor.` |
| EN `rules.pageLead` | `<absent>` | `These {n} rules are generated from reviewed codewiki topics. Choose the file your tool reads, then install it at the path shown.` |
| EN `rules.installAt` | `<absent>` | `Install at` |
| EN `rules.repositoryRoot` | `<absent>` | `in the repository root` |
| EN `rules.download` | `<absent>` | `Download {file}` |
| ZH `rules.pageTitle` | `<absent>` | `供编码智能体使用的 {track} 规则` |
| ZH `rules.pageDescription` | `<absent>` | `下载 {track} 的常见陷阱与审查项，供 Claude Code、Codex、其他智能体或 Cursor 使用。` |
| ZH `rules.pageLead` | `<absent>` | `这 {n} 条规则从已审校的 codewiki 主题生成。请选择工具能够读取的文件，再按页面所示路径安装。` |
| ZH `rules.installAt` | `<absent>` | `安装路径` |
| ZH `rules.repositoryRoot` | `<absent>` | `位于仓库根目录` |
| ZH `rules.download` | `<absent>` | `下载 {file}` |
| Cheatsheet Cursor button | `cursor.mdc` | `Cursor` |
| Track rule-card Cursor button | `<absent>` | `Cursor` |
| Generated Cursor description | `{Track} rules generated from reviewed codewiki topics` | `codewiki {Track} pitfalls and review checks` |
| Generated language-track body intro | `Apply these rules when a matching file is in context.` | unchanged |
| Generated non-language body intro | `Apply these rules when a matching file is in context.` | `This track covers more than one language, so no file globs are inferred. Apply these rules manually when they are relevant.` |
| README feature | `Generated CLAUDE.md, AGENTS.md, Cursor rules packs and size-bounded Markdown context packs.` | `Generated CLAUDE.md, AGENTS.md, .cursor/rules/codewiki-{track}.mdc files and size-bounded Markdown context packs.` |

The install paths printed on every localized rules page are:

- Claude Code: `CLAUDE.md` in the repository root.
- Codex/agents: `AGENTS.md` in the repository root.
- Cursor: `.cursor/rules/codewiki-{track}.mdc`.

The rules documentation now records the canonical Cursor URL, compatibility alias, install paths,
language glob behavior, and the empty-glob/manual-application behavior for non-language tracks.
The implementation was checked against Cursor's official project-rules documentation at
<https://prod.cursor.com/docs/rules>.

## Cursor frontmatter samples

Python (`/rules/python/codewiki-python.mdc`):

```yaml
---
description: "codewiki Python pitfalls and review checks"
globs: ["**/*.py"]
alwaysApply: false
---
```

TypeScript (`/rules/typescript/codewiki-typescript.mdc`):

```yaml
---
description: "codewiki TypeScript pitfalls and review checks"
globs: ["**/*.ts","**/*.tsx"]
alwaysApply: false
---
```

Both parse as YAML frontmatter followed by a non-empty Markdown body. Unit tests require exactly the
three keys `description`, `globs`, and `alwaysApply`. Domain and pillar tracks parse with `globs: []`
and `alwaysApply: false`, and their body explains manual application. For every track, the legacy
`cursor.mdc` alias is generated from the same string as the canonical file; built Python and
TypeScript pairs were also checked byte-for-byte with `cmp`.

## Verification

All requested gates are green on the final tree:

- `pnpm lint` — passed; all matched files use Prettier formatting.
- `pnpm check` — passed with 0 errors and 0 warnings. Astro reported one pre-existing informational
  hint in `src/lib/runners/protocol.ts`.
- `pnpm test` — passed: 58 files, 2,396 tests.
- `pnpm build` — passed: 5,909 static routes built; Pagefind indexed 5,750 pages. The build retained
  the pre-existing `dockerignore` syntax fallback and `swift/fundamentals` bilingual-structure
  diagnostic.
- `pnpm check:links` — passed: 160,276 internal links across 5,916 pages and 6 redirect targets.
- `pnpm exec playwright test tests/e2e/seo.spec.ts tests/e2e/rules.spec.ts tests/e2e/about.spec.ts tests/e2e/endpoints.spec.ts`
  — passed: 40 tests.
- Port 4321 was free before Playwright started; no wait was required.

