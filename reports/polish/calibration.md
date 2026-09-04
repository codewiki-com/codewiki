# Polish calibration (P0 Task 12)

Five topics spanning the audit's quality classes, run through `pnpm content:polish` with Codex
(`gpt-5.6-sol`, reasoning `xhigh`). Reviewed by the design lead against `prompts/editorial-standard.md`.

## Runs

| Topic | Class (audit) | Wall time | Codex tokens | Lines en/zh | Quiz items | Interview items | Glossary terms | Gate |
|---|---|---|---|---|---|---|---|---|
| `backend/jwt-authentication` | good pair | 11 m 44 s | 158,008 | 404 / 404 | 4 (1 predict, 2 mcq, 1 review) | 3 | 5 | OK first try |
| `cpp/move-semantics` | good, en title in Chinese | 13 m 43 s | 212,983 | 402 / 402 | see bank | see bank | 4 | OK first try |
| `python/asyncio` | stale | 11 m 12 s | 144,975 | 455 / 439 | see bank | see bank | 4 | OK first try |
| `ai/langchain` | needs rewrite | 16 m 40 s | 205,504 | 401 / 401 | see bank | see bank | 3 | OK first try |
| `architecture/cap-theorem` | bloated, zh machine-translated | 13 m 48 s | 174,017 | 406 / 406 | see bank | see bank | 6 | OK first try |

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

### Batch 2 (prompt v2): move-semantics, asyncio, langchain, cap-theorem

All four passed the gate on the first attempt in one parallel run of 16 m 40 s wall time. With
`{{SIBLINGS}}` every `prerequisites`/`related` id now exists (validated against staging and live
topics). Codex chose the zh draft as the base for three of four and said why; it dropped synthetic
benchmarks, duplicate sections and unverifiable claims, and recorded honest warnings (C++ verified
with GCC 13.3 in C++23 mode because `versions.ts` has no C++ target; LangChain examples run on
Python 3.12 because 3.14 was not installed).

Gaps for prompt v3:

1. Titles: "CAP Theorem: Consistency and Availability During Partitions" and "Asynchronous
   concurrency with Python asyncio" are subtitles, not titles. Rule: ≤ 40 characters, a noun phrase,
   no colon; the rest goes into `description`.
2. Skeleton H2 names vary ("Examples" / "Runnable examples", "Pitfalls" / "Common pitfalls").
   Rule: fixed names for the skeleton sections — What it is · How it works · Examples · Pitfalls ·
   In the AI era · Further reading — free names only for deep-dive sections.
3. `src/data/versions.ts` needs a C++ entry (C++23, GCC 13) so `verified.version` can cite it.

## Prompt changes

- v3 (2026-09-04, after batch 2): title rule and fixed skeleton H2 names in `prompts/editorial-standard.md` §2/§8; C++ target added to `versions.ts` at the P1 merge.
- v2 (2026-09-04): `{{SIBLINGS}}` in `prompts/polish-topic.md`; sidecar rules in
  `prompts/editorial-standard.md` §9 (quiz item mix, review item fields and kinds, interview item
  length and fields); quiz/interview schemas extended accordingly.

## Cost projection

Across five topics: 145–213 k tokens (mean ≈ 179 k) and 11–17 minutes each; four in parallel took
16 m 40 s wall. Tier 1 (257 topics) is therefore ≈ 46 M tokens and ≈ 18 hours of wall time at four
parallel sessions. Batches of 20 with a commit every 10 keep the run resumable.
