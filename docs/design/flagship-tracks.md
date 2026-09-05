# Flagship tracks first — design note

Design lead, 2026-09-05 (ROADMAP A5). No content is removed; presentation is re-weighted so the home page and `/tracks/` promise only what is deep today.

## Flagship set (6)

`javascript`, `python`, `typescript`, `go`, `rust`, `foundations` — the tracks with the most reviewed topics and complete practice banks. Declared as `flagship: true` in `src/data/tracks.ts`; everything below derives from that flag so the set can change without layout edits.

## Home page

The "Tracks" section (moved up, right after the personal strip) shows the six flagship `TrackCard`s in the existing 3-column grid, section head "Start with a track" and a `.more` link "All 22 tracks →". Nothing else changes in the card.

## `/tracks/`

```
FLAGSHIP · deepest coverage today
[ py Python ] [ js JavaScript ] [ ts TypeScript ]
[ go Go     ] [ rs Rust       ] [ cs CS foundations ]

MORE TRACKS · growing
LANGUAGES  [ jvm Java ] [ kt Kotlin ] [ cpp C++ ] [ c# C# ] [ swift Swift ] [ php PHP ]
DOMAINS    [ ui Frontend ] [ api Backend ] [ arch Architecture · preview ] …
PILLARS    [ ai Coding in the AI era ]
```

- A new first section "Flagship" with the `.lbl` eyebrow "deepest coverage today"; the existing Languages / Domains / Pillars groups follow under one heading "More tracks", each group keeping its eyebrow, minus the six flagship cards. The `preview` tag rule (< 8 topics) is unchanged.
- Each card gains a one-line count under the description in `.lbl`: "{topics} topics · {exercises} exercises" (both computed at build), so the difference in depth is stated rather than implied.
- The intro sentence becomes "Six deep tracks to start with, sixteen more growing behind them." (numbers computed).

## Track hub pages

Unchanged, except the breadcrumb eyebrow shows "flagship" on flagship hubs (`.lbl` after the track glyph). Practice hub "browse by track" lists flagship tracks first, then the rest alphabetically.

## Copy (English; Chinese by the implementer)

`tracks.flagship` "Flagship", `tracks.flagshipHint` "deepest coverage today", `tracks.more` "More tracks", `tracks.moreHint` "growing", `tracks.intro` "{flagship} deep tracks to start with, {rest} more growing behind them.", `tracks.counts` "{topics} topics · {exercises} exercises", `home.startTrack` "Start with a track", `home.allTracks` "All {count} tracks".
