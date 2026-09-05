# Home page: the review kata is the first screen — design note

Design lead, 2026-09-05 (ROADMAP A1). Supersedes the hero layout in `docs/design/mockups/Main.dc.html` and the placement in `docs/design/daily-kata.md` §Placement; everything else in that note (card anatomy, rotation, copy) stays.

## Intent

A visitor understands in the first screen what "Master code in the AI era" means by being handed a piece of generated code to review. The article library, search and tracks are reached from the second screen. Nothing is removed from the page; the order and the hero's right column change.

## Desktop (≥ 1024 px)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ // programming, explained precisely · en / zh                                         │
│                                                                                       │
│ Master code in the      │ ● DAILY KATA · SEP 5              review · Go · 4 min       │
│ AI era.                 │ Spot the bug in the Activate method                         │
│                         │ 1 issue hides in 11 lines. Find it before you would ship it. │
│ AI writes more of the   │ ┌──────────────────────────────────────────────┐             │
│ code; you still have to │ │ 1 type Account struct {                       │             │
│ read it, review it and  │ │ 2     Active bool                             │             │
│ say precisely what you  │ │ 3 }                                          ░│ +5 lines    │
│ need. Every topic here  │ └──────────────────────────────────────────────┘             │
│ runs in the browser and │ [ Start the kata → ]   from Structs · new one every day      │
│ ends with what to check │                                                             │
│ in generated code.      │                                                             │
│ [Start reviewing] [Browse tracks]                                                     │
│ Currently verified against  Python 3.14  Node 24  TypeScript 6 …                      │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ 🔍  Search 287 topics, 800 terms and 1,700 exercises                          ⌘K      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

- Grid `1fr 1.15fr`, gap 40 px, same `.wrap.hero` padding as today. Left column unchanged in type (h1 40/1.1 Plex Sans 700, sub 17/1.55 `--ink2`), copy per ROADMAP A2 (the sub above is the English draft). Primary button **"Start reviewing"** links to the kata of the day (same href as the card's button); ghost **"Browse tracks"** → `/tracks/`; the `llms.txt` ghost button moves to the footer of the hero text as a small `.lbl` link. The "Currently verified against" chips stay.
- Right column: the existing `DailyKata` island with a new `variant="hero"`: no outer eyebrow date dot change; title 22 px; the task paragraph is dropped (the hook line stays); code peek 6 lines; the "+N more lines" chip as today; actions row: primary "Start the kata →", ghost "from {topic}", and a `.lbl` "new one every day". Card background `--sur`, border `--line`, radius `--r-8`, no shadow; in dark the same tokens.
- **Search row** directly under the hero, full width: a single `.panel` bar (height 52 px) with the search icon, placeholder "Search 287 topics, 800 terms and 1,700 exercises" (numbers computed at build), `⌘K` kbd on the right; clicking opens the palette (`data-palette-open`). The four-row palette mock is removed from the home page (it lives in the palette itself).
- Then, in this order: personal strip (returning visitors), **flagship tracks** (see `flagship-tracks.md`), feature grid (01–06), modes, bilingual + ask-AI. The old "daily kata" section between personal strip and features is gone (it is the hero now).

## Mobile (< 1024 px)

Single column: eyebrow, h1, sub, the two buttons, then the kata card (peek 5 lines, chip as a caption under the peek per the mobile rule), then the verified chips, then the search bar. The card comes before the verified chips so the first scroll shows code.

## Navigation

Order becomes: **Practice**, Paths, Tracks, Cheatsheets, Playground, Glossary, AI era. Mobile sheet same order.

## Copy (English; Chinese by the implementer)

- `home.sub`: "AI writes more of the code; you still have to read it, review it and say precisely what you need. Every topic here runs in the browser and ends with what to check in generated code."
- `home.startReviewing`: "Start reviewing"
- `home.searchAll`: "Search {topics} topics, {terms} terms and {exercises} exercises"
- `daily.everyDay`: "new one every day"

## Behaviour and budgets

- The island's day rotation and done-state are unchanged; the hero variant must SSR fully (no layout shift when it hydrates: reserve the peek height with `min-height` per line count).
- Home page script size must not grow beyond the current Lighthouse budget; the palette mock removal offsets the extra copy.
- Home e2e: hero contains a kata title and a "Start the kata" link that resolves; the palette opens from the search row; the old `.palette` mock rows are gone.
