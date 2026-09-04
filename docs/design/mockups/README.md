# Design mockups (source of visual truth)

These are the approved static mockups for codewiki.com, exported from the design canvas
(https://claude.ai/code/artifact/81ecf530-fd51-468d-86e2-1ba247b85067).

- `Main.dc.html` — Home, light. `HomeDark.dc.html` — same markup with dark tokens.
- `Topic.dc.html` / `TopicDark.dc.html` — Topic page (Python › Closures).
- `TrackHub.dc.html` — Track hub (Python). `Path.dc.html` — Learning path with prerequisite map.
- `Playground.dc.html` / `PlaygroundDark.dc.html` — Playground.
- `MobileHome.dc.html` (light) / `MobileTopic.dc.html` (dark) — 390px-wide mobile frames.
- `mkdark.py` — swaps the token block; the dark files are generated from the light ones.

How to read them: each file is plain HTML. The `<style>` block declares the design tokens
between `/* TOKENS:START */` and `/* TOKENS:END */`; every colour in the markup is a `var(--token)`.
Component classes (`.panel`, `.tag`, `.seg`, `.codebox`, `.opt`, `.act`, `.tree`, `.toc` …) carry the
exact paddings, radii, font sizes and line heights to reproduce. The master spec
(`docs/superpowers/specs/2026-09-03-codewiki-design.md`, §7) is the contract; these files are the reference
when the spec is silent. Ignore `<script src="./support.js">`, `<x-dc>` and `<helmet>` — canvas runtime wrappers.

## P2 mockups (`p2/`)

Artboards for the learning layer, added 2026-09-04 by the design lead: `Practice` (practice hub),
`Kata` (review-the-AI's-code kata, revealed state), `Flashcards` (SRS review), `Interview`
(interview bank), `Cheatsheet`, `Bilingual` (topic in bilingual mode), `PromptBuilder`
(`/ai/prompt-builder/`), plus `*Dark` variants. Sources live in `p2/src/`: `head.part.html`
(tokens + component classes, a superset of the P1 mockups), `nav.part.html`, one `*.body.html`
per artboard and `build.py`, which assembles the `.dc.html` files and generates the dark ones
with `mkdark.py`. Edit the sources, run `python3 p2/src/build.py`, never the assembled files.
`p2/canvas.json` is the design-canvas layout. Canvas: see STATUS.md for the current link.
