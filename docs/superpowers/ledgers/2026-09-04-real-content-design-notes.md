# Design review with real content (Fable, 2026-09-04 late)

Screenshots: scratchpad `shots-content/` (built from the P0 worktree dist at 53627f1).

1. **Critical — home page.** The hero's "palette" mock renders every topic (hundreds of rows), so `/` is ~14,000 px tall. It is a static mock: cap it at four fixed rows (two topics, one glossary term, one practice item) chosen at build time, never the full catalogue.
2. **Important — practice hub filters.** The track Seg holds 22 tracks and overflows the row (cut at "Fro…"); replace with a wrapping chip row or a `<select>` below 1200 px, keep the level/sort Segs.
3. **Important — path map labels.** Milestone titles collide across columns ("M1 · Syntax, values, and control flow" runs into M2); node labels for planned topics render the raw id ("Planned topic: inheritance-polymorphis…") and overflow the 180 px node. Truncate milestone titles to the column width with an ellipsis (full title in `<title>`), render planned nodes with the planned title from `content/new-topics.yaml` or a humanised slug, and clip node text.
4. **Important — content taxonomy.** Track hub sections show mis-assigned topics (Django, FastAPI, Requests under Python › Basics), duplicate titles ("Python scope and namespaces" twice), and inconsistent title style ("Python Control Flow", "Python Sets", "map, filter, and reduce"). A frontmatter QA pass over all 290 topics: correct `section` per the track's section list, sentence-case titles without the track name prefix inside the track, merge or rename duplicates. Insight-heavy → Opus.
5. Minor — practice cards: quiz items from the polish wave lack `title`, so cards show truncated prompts; a follow-up Codex pass can add titles to review/spotbug items.

Fold these into the fix round after the Opus whole-site review lands.
