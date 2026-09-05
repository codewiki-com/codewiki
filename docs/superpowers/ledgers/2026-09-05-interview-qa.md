# 2026-09-05 — QA pass on the 235 new interview items

Branch `qa-interview`. Scope: every item added to `src/content/interview` since
`f9540e9` — 235 items across eight files (`ai-era` 18, `architecture` 8,
`backend` 59, `frontend` 16, `go` 26, `javascript` 53, `python` 40,
`typescript` 15). Checked against `prompts/editorial-standard.md` §7 and §9 and
`src/schemas/interview.ts`.

Content commit: `aa11017d2939118686cb6f25fee1967076a960f7`.

## Items touched, by reason

| Reason | Items | Files |
| --- | --- | --- |
| Self-containment (removed a reference to the article/page/topic) | 6 | `ai-era` 5, `architecture` 1 |
| Chinese quality (typo, translationese, dangling word order) | 5 | `javascript` 4, `backend` 1 |
| **Total distinct items edited** | **11** | 4 files |

No item was edited for length, version accuracy, or shape — those checks all
passed as written (see below).

### Self-containment (6 items, 12 strings — en and zh both carried it)

Every hit named the pinned version already, so the fix was to drop the
article/page reference and keep the version as the frame.

| Item | Was | Now |
| --- | --- | --- |
| `ai-era/agent-context-safe-compaction` | "In the article's Node 24 workflow" / 「在本文以 Node 24 验证的流程中」 | "In a Node 24 agent session" / 「在 Node 24 的智能体会话中」 |
| `ai-era/agent-instructions-resolution-contract` | "On the page's Node 24 baseline" / 「在页面使用 Node 24 的基线中」 | "On a Node 24 baseline" / 「在 Node 24 基线上」 |
| `ai-era/agent-boundary-script-versus-agent` | "In the article's Node 24 examples" / 「在文章以 Node 24 运行的示例中」 | "On a Node 24 toolchain" / 「在 Node 24 工具链上」 |
| `ai-era/coding-agent-completion-evidence` | "In the page's Python 3.14 host loop" / 「在页面基于 Python 3.14 的宿主循环中」 | "In a Python 3.14 host loop" / 「在 Python 3.14 的宿主循环中」 |
| `ai-era/code-prompt-failure-contract` | "In the article's Node 24 examples" / 「在文章使用 Node 24 的示例中」 | "In a Node 24 service" / 「在 Node 24 服务中」 |
| `architecture/adr-supersession-preserves-history` | "For the Node 24 baseline used by this topic" / 「以本主题采用的 Node 24 基线为例」 | "On a Node 24 baseline" / 「在 Node 24 基线上」 |

The task brief expected these in `typescript.yaml`/`ai-era.yaml`; they are in
fact in `ai-era.yaml` (5) and `architecture.yaml` (1). All eight files were
grepped for `the article`, `this/the page`, `this/the topic`, `this guide`,
`shown/described/used here`, 本文, 本页, 本主题, 本节, 本篇, 该主题, 该页面,
文中, 文章, 页面, 这篇 — plus 上文/下文/前文/如上/如下, whose hits were all
false positives inside 上下文 and 该文本. `frontend` uses of 页面 are the
ordinary noun ("web page") and were left alone.

### Chinese quality (5 items)

| Item | Was | Now |
| --- | --- | --- |
| `javascript/symbol-local-versus-registry-identity` | 「既不是**密密**存储」 (typo) | 「既不是保密存储」 |
| `javascript/closure-retaining-path-diagnosis` | 「确认保留数量**达到平台**」 (literal rendering of "plateau") | 「确认保留数量不再增长」 |
| `javascript/invalid-date-json-boundary` | 「损坏标识符与**仅日历值**」 | 「会损坏标识符和纯日期值」 |
| `javascript/dataview-byte-order-and-window` | 「比 encoder-decoder **自往返**更能发现端序错误」 | 「比 encoder-decoder 往返测试更能发现端序错误，因为后者两端可能共享同一个错误假设」 |
| `backend/httpx-timeout-phases-pool` | 「本地连接池饱和**可以同**建连缓慢或对端停止发送正文**区分开**」 (dangling English word order) | 「因此可以把本地连接池饱和与建连缓慢、对端停止发送正文这几种情况区分开」 |

A scan for doubled-CJK-character typos across all 235 items returned exactly one
real defect (密密); every other hit was a legitimate word boundary
(执行\|行为, 参数\|数量, 取代\|代码块, 悄悄).

## Checks that passed with no edits needed

**Translation fidelity.** All 235 items were read in both languages, en and zh
side by side. Beyond the five entries above, every zh answer carried the same
mechanism, version, and pitfall as its en counterpart, kept identifiers verbatim,
and read as idiomatic technical Chinese. Where zh is slightly more specific than
en (e.g. `ai-era/llm-evals-judge-calibration` naming 位置或身份偏差 for a bare
"bias"; `python/duplicate-keyword-binding-failure` spelling out 拒绝、默认或覆盖
for "an explicit merge policy") the addition is correct and was kept.

**Length.** English: 77–106 words, median 91 — every item inside 60–120, none
touched. Chinese: measuring spoken units (CJK characters plus one unit per
inline-code span or Latin token, since a raw character count double-counts
identifiers such as `` `RuntimeError: generator raised StopIteration` ``), the
range is **119–197 units, median 151** — every item inside the 100–200 target.
The batch matches the 911 pre-existing items closely (median 158, zh/en ratio
1.71 vs 1.68 here), so no trimming or padding was warranted.

*Note for future passes:* a naive `len(zh)` character count makes this batch look
26% over budget (median 222 chars, 62 items "over 240"). That is an artifact of
code spans, not verbosity. Strip `` `...` `` before measuring.

**Version accuracy.** Every version token in every en answer was cross-checked
against the `verified: { version }` frontmatter of each item's topics. **No
mismatches, and no en/zh version asymmetry in any of the 235 items.** Nine items
cite a number absent from their pin; all nine are correct:

- Deliberate historical references: `go/go-122-loop-variable-semantics`
  (Go 1.22 loop-variable semantics, pin Go 1.27), `go/comparable-interface-runtime-panic`
  (Go 1.20 constraint-satisfaction exception, pin Go 1.27),
  `python/choose-shallow-deep-or-replace` (`copy.replace()` added in Python 3.13
  — the answer says "added in Python 3.13 and present in 3.14", pin Python 3.14),
  `backend/wsgi-callable-response-contract` (PEP 3333).
- Not versions at all: HTTP status codes 403/404 (`backend/laravel-scoped-binding-policy`),
  429 (`backend/rust-state-backpressure-shutdown`), 204 (`backend/urlsession-error-layers`),
  "24 hours"/"23" (`javascript/elapsed-hours-versus-calendar-days`), "signed 32-bit"
  (`javascript/negative-rounding-directions`).

Eleven items name a spec level or lowercase library instead of a numeric version
(`frontend` CSS/HTML items; `backend` httpx and Scala items); each matches its
pin (CSS Grid Layout Level 2, CSS Animations Level 1, HTML Living Standard,
Media Queries Level 5 / CSS Containment Level 3, HTTPX 0.28.1, Cats Effect 3.7.1
/ http4s 0.23.36).

**Shape.**

- `id`: unique within every file, all specific. No duplicates.
- `topics`: every reference in all 235 new items resolves to an existing
  `src/content/topics/{track}/{slug}.en.mdx`. Nothing to retag — `python/scope`,
  `python/fastapi` and `python/django` do not appear anywhere in
  `src/content/interview`; the three affected items already carry
  `python/scope-namespaces`, and the FastAPI/Django items already sit under
  `backend/fastapi` and `backend/django`.
- `section`: every new item has one, and every bilingual pair reuses a name
  already present in its file. No new section names, no en/zh drift.
- `frequency`: present on every item; 3–5 items per topic throughout, with one
  `occasional`/`rare` per topic. One exception, below.

**Chinese typography.** The repo's own `findZhIssues` (`scripts/content/lib/zh-typography`)
reports **0** issues across all 235 items in both `question` and `answer` — CJK/Latin
spacing, full-width punctuation, quotes and ellipsis all conform, with half-width
punctuation correctly confined to code spans.

## Verification

- `pnpm content:check {track}/{slug} --no-links` for one topic per track — all
  eight `OK`: `ai-era/agent-context-management`, `architecture/adr`,
  `backend/fastapi`, `frontend/css-grid`, `go/fundamentals`, `javascript/json`,
  `python/copy`, `typescript/generics`.
- `pnpm check` — 0 errors, 0 warnings (1 pre-existing hint in
  `src/lib/runners/protocol.ts`, unrelated).

## Concerns and things left alone

1. **`backend/api-first` frequency mix.** Its three items are
   `occasional`/`occasional`/`common`, where the standard wants mostly `common`
   with one non-`common`. Both `occasional` items predate this batch and are
   shared: `contract-compatibility-evidence` also serves `backend/api-versioning`
   and `api-contract-test-limits` also serves `backend/testing`, each of which
   currently has exactly one non-`common` item. Flipping either to `common` fixes
   `api-first` and breaks the other topic. Left as is; it needs a decision about
   which topic owns the shared item, not a local edit.

2. **Nothing unverifiable was found.** Every technical claim was checkable
   against the pinned version. Claims resting on versions newer than the
   assistant's training data — `reflect.TypeAssert` and method-level type
   parameters as Go 1.27 additions, `functools.Placeholder` and `map(strict=True)`
   as Python 3.14 additions, `strictBuiltinIteratorReturn` inside the TypeScript 6
   `strict` umbrella, Django 6.0 not supporting transactions in async mode — are
   internally consistent, match their topic pins, and are stated the way the
   surrounding corpus states them, but they were confirmed against the corpus
   rather than against upstream release notes.

3. **Topic references that do not exist yet** are a pre-existing, project-wide
   condition (264 such slugs are referenced by items older than this batch, e.g.
   `go/context`, `javascript/promises`, `architecture/circuit-breaker`) because
   topics are being written in waves. It is worth noting that **the 235 new items
   introduce none** — every one of their topic references already has an
   `.en.mdx`.
