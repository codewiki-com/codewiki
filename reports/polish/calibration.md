# Polish calibration (P0 Task 12)

Five topics spanning the audit's quality classes, run through `pnpm content:polish` with Codex
(`gpt-5.6-sol`, reasoning `xhigh`). Reviewed by the design lead against `prompts/editorial-standard.md`.

## Runs

| Topic | Class (audit) | Wall time | Codex tokens | Lines en/zh | Quiz items | Interview items | Glossary terms | Gate |
|---|---|---|---|---|---|---|---|---|
| `backend/jwt-authentication` | good pair | 11 m 44 s | 158,008 | 404 / 404 | 4 (1 predict, 2 mcq, 1 review) | 3 | 5 | OK first try |
| `cpp/move-semantics` | good, en title in Chinese | | | | | | | |
| `python/asyncio` | stale | | | | | | | |
| `ai/langchain` | needs rewrite | | | | | | | |
| `architecture/cap-theorem` | bloated, zh machine-translated | | | | | | | |

## Review notes

### backend/jwt-authentication (run 1, prompt v1)

Quality: high. Precise and current (RFC 8725 / RFC 9700, Node 24 `crypto`), the structure follows §2
exactly, paragraphs are two to five sentences, all four runnable examples execute with real output,
the pitfalls are specific and each carries a fix, the "In the AI era" block names real failure modes
of generated middleware, and the Chinese reads as native technical prose aligned paragraph for
paragraph. Both files land on the 400-line floor exactly, which suggests the floor is steering
length; the content is not padded, so the floor stays.

Systematic gaps found (fixed in prompt v2, see below):

1. `prerequisites: []` and `related: []` — the brief gave Codex no sibling topic ids, so it left
   them empty rather than invent ids. Fix: `{{SIBLINGS}}` variable listing the track's topics.
2. The review quiz item used `kind: bug`; the kinds were unconstrained. Fix: enum
   `security | correctness | edge-case | readability | performance`, plus `task`, `right` and a
   `checklist` on review items (the P2 kata player renders them).
3. Interview answers ran 40–60 words; the target is spoken length, 60–120 words, with `section`
   and `frequency` so the interview bank page can group and label them.
4. The article uses a Mermaid sequence diagram, which the standard allows but the site did not
   render. Fix on the site side: P1 Task 20 (build-time inline SVG). The standard is unchanged.

## Prompt changes

- v2 (2026-09-04): `{{SIBLINGS}}` in `prompts/polish-topic.md`; sidecar rules in
  `prompts/editorial-standard.md` §9 (quiz item mix, review item fields and kinds, interview item
  length and fields); quiz/interview schemas extended accordingly.

## Cost projection

At ~158 k tokens and ~12 minutes per topic, tier 1 (257 topics) is ≈ 40 M tokens and ≈ 13 hours of
wall time at four parallel sessions. Batches of 20 with a commit every 10 keep the run resumable.
