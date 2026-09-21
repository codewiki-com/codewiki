# Learning layer

The learning layer is statically generated. Content, routes, answer-free catalogues, answer-bearing
flashcard data, rules and context packs are all produced at build time. A visitor's preferences,
reading history, quiz results and deck stay in that browser; there is no account service or remote
progress API.

## Browser storage

`src/lib/prefs.ts` owns the guarded readers, writers and defaults. Every key is versioned with the
`cw:v1:` prefix. Invalid JSON or an invalid store shape falls back to an empty/default value. Do not
read these keys directly in a new island unless code must run before first paint.

| Key | Shape | Notes |
| --- | --- | --- |
| `cw:v1:prefs` | `Prefs` | Display and learning preferences. Fields are validated independently. |
| `cw:v1:progress` | `Progress` | Topic, quiz, path and clarity records. Scroll writes are debounced by 500 ms. |
| `cw:v1:flashcards` | `{ cards: Flashcard[] }` | Append-only deck; rating a card replaces its scheduling fields. |
| `cw:v1:recents` | `{ pages: RecentPage[] }` | At most eight command-palette destinations, newest first. |

The preference fields are:

```ts
interface Prefs {
  theme: 'light' | 'dark';
  depth: 'quick' | 'standard' | 'deep';
  fontSize: 's' | 'm' | 'l';
  lang?: 'en' | 'zh';
  plan?: 15 | 30 | 60;
  interviewReveal?: 'one' | 'all';
  cardSources?: { terms: boolean; quiz: boolean; manual: boolean };
}
```

The learning defaults are a 30-minute plan, one interview answer open at a time, and all three
card sources enabled. An absent `cardSources` object means all sources are enabled.
On first visit, the theme bootstrap resolves the system palette to `light` or `dark` and saves
that choice. Legacy `system` preferences are resolved the same way; the UI offers only two themes.

Progress uses stable content ids:

- `topics["{track}/{slug}"]` is `{ readPct, lastAt, completedAt?, termsAdded? }`.
- `quizzes["{bank}#{item}"]` stores a standalone kata result. A topic checkpoint stores its
  aggregate result at `quizzes["{bank}"]`; interview questions use
  `quizzes["interview/{track}/{item}"]` with a `1/1` result when opened. Every quiz result is
  `{ score, total, at }`, and `recordQuiz()` keeps the best ratio (the newer result wins a tie).
- `paths["{path-id}"]` is `{ startedAt }`. Topic and checkpoint records determine the live path
  state; the path record only says that the learner started it.
- `feedback["{track}/{slug}"]` is `"yes"` or `"not-quite"`.

A flashcard has `{ id, kind, ref, due, interval, ease, reps, suspended?, source? }`. Its `id` and
`ref` normally match. Keep these formats stable because the reviewer parses them:

| Card | Stable id/ref | Meaning |
| --- | --- | --- |
| Glossary term | `glossary:{term}` | A bilingual glossary face. |
| Quiz item | `quiz:{bank}#{item}` | The public prompt plus its answer and explanation; `bank` is `track/slug`. |
| Review issue | `quiz:{bank}#{item}:{line}` | The issue whose inclusive span contains `line`. |

New cards start due immediately with the scheduler's `NEW_CARD` values. Use `termCardId()`,
`quizCardId()` and `enqueueCards()` from `src/lib/score.ts`; do not assemble or append cards ad hoc.
The scheduler in `src/lib/srs.ts` clamps ease to 1.3–2.5 and intervals to 1–30 days. A quiz or
checkpoint passes at 70%.

## Island and DOM contracts

Astro renders useful HTML first. DOM-controller islands annotate that markup instead of replacing
it. Treat the selectors below as interfaces: tests and other components depend on them.

| Controller | Contract |
| --- | --- |
| `Quiz`, `SpotBug`, `ReviewKata` | Enhance the nearest `section.kata-shell[data-quiz="{bank}#{item}"]`. The shell starts with `data-state="idle"` and ends at `answered`. Their sentinel is `[data-quiz-controller="quiz|spotbug|review"]`, which receives `data-ready="true"`. `Quiz` and `SpotBug` publish `[data-result][data-score][data-total]`; review publishes the same values on `[data-review-compare]`. Answers remain in `template[data-answer]` until reveal. |
| `Checkpoint` | Enhances `#checkpoint[data-checkpoint="{bank}"]`. It reads `script[type="application/json"][data-checkpoint-items]`, wires `[data-checkpoint-start]`, hides `[data-checkpoint-summary]`, and marks `[data-checkpoint-controller]` ready. Completion writes the aggregate bank result and dispatches `cw:progress` on `document`. |
| `TodayStrip` | A `client:idle` component that owns `[data-today]`. It reads due cards and the first unpassed checkpoint on a started path, updates `[data-practice-stat]`, and refreshes on `document`'s `cw:progress`. |
| `PracticeFilters` | Enhances `[data-practice-controls]` and `[data-practice-grid]`. Filter groups are `[data-filter-group][data-value]`; every card provides `data-practice-card`, `data-id`, `data-track`, `data-type`, `data-level` and `data-order`. The controller updates the query string, `data-status`, result count, empty state and server-rendered Show more tail. |
| `PathState` | Finds `[data-path-root="{path-id}"]`. Map nodes use `[data-topic]`, diamonds `[data-checkpoint]`, and edges `[data-edge-kind][data-edge-from][data-edge-to]`; list rows use `[data-topic-row]` and `[data-checkpoint-row]`. The island writes `data-state`, updates the ring/summary/Continue link, handles `[data-plan]`, export and share, and refreshes on `cw:progress`. |
| `InterviewControls` | Enhances `[data-interview-bank="{track}"]` and marks it `data-ready="true"`. Questions are `details.q[data-id][data-level]`; level/reveal groups, search, shuffle, progress, section rows and card actions use the `data-interview-*`, `data-progress-*`, `data-question-list`, `data-add-card` and `data-add-all` markers in `Interview.astro` and `InterviewQuestion.astro`. Opening a question records it and dispatches `cw:progress`. |
| `Flashcards` | A `client:only="preact"` reviewer with a server fallback. It owns its rendered subtree, reads the deck/preferences/progress stores, and fetches public and answer-bearing quiz banks only when a quiz card needs them. Keep keyboard commands Space, 1–4, E and X attached to the documented flip/rate/source/suspend actions. |
| `Playground` | A server-rendered `client:idle` component that owns its workspace. Its external contract is `?lang=&code=&tests=&example=` plus `/api/examples.json`. The editor remains synchronized with its textarea. Python and SQL runtimes load from `/vendor/` only on use; HTML runs in a sandboxed `srcdoc` frame without `allow-same-origin`. |
| `PromptBuilder` | A `client:load` component that owns its builder. `?topic=`, `?goal=` and `?level=` can preselect state. Topic search reads `/api/topics.json`; selected concept cards read `/api/topics/{track}/{slug}.json`. Reader code remains local and is omitted first if a deep link exceeds the query limit. |
| `AskAI` block actions | A row-level cheatsheet action dispatches `cw:ask` with `{ detail: { text } }`. Topic block buttons use matching `data-block` values on the button and source block plus `data-preset`; section buttons use `data-section`. The one existing `AskAI` island delegates all of these actions. |

These integration events are not persistence transports. `cw:progress`, `cw:flashcards`,
`cw:depth` and `cw:ask` dispatch on `document`; `cw:theme` dispatches on `window`.
Keep that target when adding a listener.

## Adding content

Run `pnpm check`, `pnpm test`, `pnpm build` and `pnpm check:links` after changing a collection. The
schemas reject invalid references and shapes during content sync/build.

### Quiz bank

Add `src/content/quizzes/{track}/{slug}.yaml`. The collection id and bank id are
`{track}/{slug}`; `topic` uses the same `track/slug` reference. Every item needs a unique `id`, a
bilingual `prompt` and `explanation`, a `difficulty`, and one of these shapes:

- `mcq`: two or more bilingual `options`, exactly one with `correct: true`.
- `predict`: the same options plus `code` and `lang`.
- `fill`: a non-empty `answer`.
- `spotbug`: `code`, `lang`, and one or more issues with positive `line`, optional inclusive end
  `lines`, `kind`, and bilingual `note`.
- `review`: the spot-bug fields plus optional bilingual `title`, `task`, `right`, and a bilingual
  `checklist`.

Issue kinds are `security`, `correctness`, `edge-case`, `readability`, and `performance`. Optional
`tags`, `tests`, and positive `minutes` feed catalogue, playground and card surfaces. Link the bank
from a topic's `quiz` frontmatter to render an inline checkpoint. The build creates the standalone
kata routes, the answer-free catalogue at `/api/practice.json`, the answer-free bank at
`/api/quizzes/{track}/{slug}.json`, and the reviewer-only answer-bearing sibling at
`/api/quizzes/{track}/{slug}.answers.json`.

### Learning path

Add `src/content/paths/{path-id}.yaml`. Supply bilingual `title`, `description`, optional
`rationale`, one or more `tracks`, a `level` range, positive `hours`, bilingual `outcomes`, and one
or more ordered milestones. Each milestone has a slug `id`, bilingual title, at least one
`track/slug` topic, and a checkpoint bank id. `edges` are explicit prerequisite arrows:

```yaml
edges:
  - { from: python/functions, to: python/closures }
```

Only forward edges are drawn. Missing topic pages remain inert Coming soon nodes, so curriculum
planning may precede topic authoring. A checkpoint bank may also be planned, but its action falls
back to Practice until a concrete route exists. `/api/paths.json` exposes the complete map data.

### Interview bank

Add `src/content/interview/{track}.yaml`; the top-level `track` must be a registered track slug.
Each item needs a unique slug `id`, bilingual Markdown `question` and `answer`, at least one topic
reference, and a `level`. Optional `tags`, bilingual `section`, and `frequency` (`common`,
`occasional`, or `rare`) control grouping and labels. The build emits
`/practice/interview/{track}/`, its `/zh/` counterpart, and Markdown twins. Answers are rendered at
build time, so fenced code and the shared Markdown pipeline are available.

### Cheatsheet

Create the pair `src/content/cheatsheets/{slug}.en.mdx` and `{slug}.zh.mdx`. Their frontmatter must
carry translated `title`/`description`, optional registered `track`, term ids, tags,
`verified: { version, date }`, nullable `reviewed`, `status: draft|reviewed`, and `aligned`. Keep the
two files structurally paired and author rows with the registered MDX components:

```mdx
<Sheet title="Functions and scope">
  <Row code="nonlocal count">rebind a name in the nearest enclosing function scope</Row>
</Sheet>
```

Only reviewed sheets are public. The build emits localized index/detail pages, Markdown twins,
`/api/cheatsheets.json`, print styling and `llms.txt` entries.

## Topic translations

Topics have separate English and Chinese pages backed by
`src/content/topics/{track}/{slug}.en.mdx` and `.zh.mdx`. Readers switch between them using the
language switch. The content checks still verify that translations have matching structures.
Mark both frontmatter records `aligned: true` only after those checks pass.

`TryToBreak` is also bilingual authored content. Keep 2–4 corresponding challenges in the two
topic files and place it after the relevant runnable example/output pair; the pipeline transfers
the nearest preceding runnable source into its Playground links.

## Rules and context-pack endpoints

Rules are generated from reviewed English topics. `src/lib/rules.ts` extracts PITFALL callouts,
ignoring fenced examples. A topic's optional `## In the AI era` section is not required for rule
generation; for backward compatibility, bullets under its `**Review checklist**` lead-in are also
extracted when present. Every rule keeps its canonical topic source. Tracks with at least one rule
receive:

- `/rules/{track}/CLAUDE.md`
- `/rules/{track}/AGENTS.md`
- `/rules/{track}/codewiki-{track}.mdc`

Install the Claude Code file as `CLAUDE.md` in the repository root and the Codex/agents file as
`AGENTS.md` in the repository root. Install the Cursor file as
`.cursor/rules/codewiki-{track}.mdc`. The older `/rules/{track}/cursor.mdc` URL serves identical
content as a compatibility alias.

Cursor globs are arrays of track-aware language extensions. Non-language tracks use an empty array,
set `alwaysApply: false`, and explain in the body that no file globs were inferred. A track hub or
cheatsheet advertises a rules pack only at the UI threshold of ten rules; generation itself
deliberately has a lower threshold of one.

Context packs concatenate the plain-Markdown twins of reviewed English topics by track and topic
`section`. They are emitted at `/packs/{track}/{section}.md`. A pack over 1,000,000 bytes is split
without reordering into `{section}-1.md`, `{section}-2.md`, and so on; every part lists all part and
canonical topic links. `/llms.txt` lists every generated rules file and context-pack file, so use it
as the discovery index rather than hard-coding the currently available tracks or sections.
