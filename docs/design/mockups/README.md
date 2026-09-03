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
