# Daily kata on the home page — design note

Designed by the design lead on 2026-09-04 (spec §6.1, P3 row "Daily review kata on the home page"). Implements the surface; the selection helper already exists (`kataOfTheDay` in `src/lib/practice.ts`).

## Intent

Every visitor — first-time or returning, logged-out, no JavaScript — sees one concrete, code-bearing kata on the home page: a piece of generated code with hidden flaws and a single call to action. It is the home page's proof of the tagline: "master code in the AI era" means reviewing machine-written code well. It must change every day without a rebuild, and it must be the same item the Practice hub calls "today".

## Placement

Full-width panel inside the home `.wrap`, directly **after the personal strip and before the feature grid**. It is server-rendered (SEO sees today's item) and hydrated lazily (`client:idle`) only to (a) rotate to the visitor's UTC day and (b) show the "done today" state.

## Layout (desktop ≥ 900 px)

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ DAILY KATA · SEP 4                      review · Python · 8 min                    │
│                                                                                    │
│ Review generated retry handlers          │  1  def build_retry_handlers(jobs, max_attempts):
│ Create one retry handler per job, track  │  2      handlers = []
│ attempts independently, enforce          │  3      failures = []
│ max_attempts, and expose a read-only     │  4
│ failure history.                         │  5      for job in jobs:
│                                          │  6          attempts = 0
│ 4 issues hide in 22 lines. Find them     │  7          def retry():
│ before you would ship it.                │  8              nonlocal attempts, failures ░░░ fade
│                                          │                       ┌────────────────┐
│ [ Start the kata → ]  from Closures      │                       │ +14 more lines │
└──────────────────────────────────────────┴───────────────────────┴────────────────┴┘
```

- Grid `1fr 1.2fr`, gap 32 px; padding 28 px 32 px; `background: var(--sur)`, `border: 1px solid var(--line)`, `border-radius: var(--r-8)`. No shadow in light; in dark the panel takes the same tokens (Night Lab palette swaps automatically).
- **Eyebrow row** (spans both columns): left `.lbl` "DAILY KATA · {date}" with a 6 px `--acc` dot before it; right `.lbl` meta "{type} · {track} · {minutes}" in `--ink3`. Date formatted with `Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' })` from the same UTC day used for selection.
- **Title**: `h2`, IBM Plex Sans 600, 24 px / 1.2, `--ink`, margin 0 0 8 px. Text is the kata title (`practiceItemTitle`).
- **Task**: the `task` text when present, else the `prompt`; 15 px / 1.55, `--ink2`, clamp to 4 lines.
- **Hook line**: 14 px `--ink`, medium weight: "{issues} issues hide in {lines} lines. Find them before you would ship it." (`issues` = `issues.length`, `lines` = code line count). For `spotbug` items the same sentence.
- **Actions row**: primary `Button` "Start the kata →" (href = kata page) and a ghost link "from {topic title}" (href = topic page) in `--ink2`, 13 px.
- **Code peek** (right column): the first 8 lines of the kata's code rendered with the existing Shiki renderer (`renderCode`) inside a `.peek` box: `background: var(--code-bg)`, `border-radius: var(--r-6)`, 13 px mono, line numbers in `--ink3`, no copy button, `max-height: 8 lines`, `overflow: hidden`, a bottom gradient from transparent to `var(--code-bg)` over the last two lines, and a chip "+{n} more lines" (`.lbl`, `--sur` on `--line` border) bottom-right. The whole peek is a link to the kata page (`aria-label` = title); on hover the border becomes `--acc`. When the code has ≤ 8 lines, no fade and no chip.

## Mobile (< 900 px)

Single column: eyebrow, title, task, hook, code peek (max 6 lines), actions. Padding 20 px. The meta lbl moves under the eyebrow on its own line.

## Behaviour

- **Rotation without rebuild.** The page ships today's item plus the next 6 days (7 entries: the same pool, the same `kataOfTheDay` hash, day + n). Each entry carries only what the card needs (title, task, hook numbers, urls, the code-peek HTML, type/track/minutes labels). On hydrate, the island computes the visitor's UTC day, and if it is 1–6 days after the build day it renders that entry; beyond the window it keeps the last entry. The Practice hub's "today" strip uses the same pool and the same rotation.
- **Pool.** Only `review` and `spotbug` items (code-bearing katas). `mcq`, `predict`, `fill` never appear as the daily kata.
- **Done today.** If the visitor's progress store shows this kata answered today (UTC), the primary button reads "Done today · review again" (ghost style) and the hook line becomes "You found {found} of {issues} issues." when that number is stored; otherwise just the button change.
- **No JavaScript**: the server-rendered day-0 card is complete and correct on the build day.

## Copy (English; Chinese written by the implementer)

- `daily.eyebrow`: "Daily kata"
- `daily.hook`: "{issues} issues hide in {lines} lines. Find them before you would ship it."
- `daily.hookOne`: "1 issue hides in {lines} lines. Find it before you would ship it."
- `daily.found`: "You found {found} of {issues} issues."
- `daily.start`: "Start the kata"
- `daily.done`: "Done today · review again"
- `daily.from`: "from {topic}"
- `daily.more`: "+{count} more lines"
- `daily.peek`: "Preview of the kata code" (aria-label)

## Not in scope

Streaks, calendars, sharing, and a history of past katas (a later iteration if the surface earns it).
