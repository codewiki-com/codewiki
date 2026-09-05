# Review katas v2: train judgment, not bug-counting — design note

Design lead, 2026-09-05 (ROADMAP B1). Extends the `review` item in `src/schemas/quiz.ts`, the `ReviewKata` island and `KataShell`. Backward compatible: every existing item keeps working and renders exactly as today until it is re-authored.

## Why

Today every review kata hides 3–5 issues and says so. A learner who knows there must be issues hunts for a count; the skill we want is the reviewer's judgment: **is this safe to ship, what must change, and what do I have to ask before I can tell?** Real defects, risks worth confirming and taste must be told apart, and a false alarm has a cost.

## Item model (schema v2, additive)

```yaml
- id: review-retry-handlers
  type: review
  verdict: fix            # fix | ship | ask        (default fix — every existing item)
  task: { en: …, zh: … }
  code: |
  lang: python
  issues:                 # may be empty when verdict is ship or ask
    - line: 12
      lines: 3
      kind: correctness   # existing taxonomy
      severity: defect    # defect | risk | style   (default defect)
      note: { en: …, zh: … }
      test:               # optional counterexample the learner can run (py/js/ts/sql)
        lang: python
        code: |
          handlers = build_retry_handlers(["a", "b"], max_attempts=1)
          handlers[0](); handlers[1]()
          assert attempts["a"] == 1, attempts
  ask:                    # verdict ask: the questions a reviewer must get answered first
    - { en: 'Is max_attempts per job or shared across jobs?', zh: … }
  right: { en: …, zh: … }
  checklist: [ … ]
```

- `verdict: ship` items are correct for the stated task; `issues` may still list `style` notes (optional improvements), never `defect`s. The checker rejects a `ship` item with a `defect`.
- `verdict: ask` items are under-specified: at least one `ask` question, and any `issues` are the risks that depend on the answer (`severity: risk`).
- `verdict: fix` items have ≥ 1 `defect`.
- The catalogue and the home card **never print the issue count for v2 items** (any item that declares `verdict`); their hook line reads "Review this generated code. Decide: ship, fix or ask." Legacy items keep "N issues hide in M lines" until re-authored.
- `spotbug` items are unchanged (they are deliberately "find the bug").

## Learner flow (four steps, same shell)

1. **Task** — as today: the requirement the code was generated for.
2. **Review** — mark lines as today; each marked line gets a three-way severity control right under it: `defect · risk · style` (default `defect`, keyboard: radio group). The optional comment field stays.
3. **Verdict** — new step. Three large choices: **Ship it** / **Request changes** / **Ask first**. Choosing "Ask first" reveals a text field "What would you ask?" (free text, not graded, shown back next to the author's questions). The step cannot be skipped.
4. **Compare** — the expert view plus a **calibration summary**:

```
┌──────────────────────────────────────────────────────────────┐
│ Verdict: you said Request changes · expert: Request changes ✓ │
│ Found 2 of 3 defects · 1 risk missed · 1 false alarm         │
│ Severity: 1 style note marked as defect                      │
│ Score 7 / 10                                                 │
├──────────────────────────────────────────────────────────────┤
│ L12–14  defect · correctness   found                         │
│         "attempts is shared across closures…"  [Run counterexample] │
│ L20     risk · edge-case       missed                        │
│ L7      your mark              false alarm — nothing wrong here │
│ …                                                            │
│ What the generated code did well · Checklist                 │
└──────────────────────────────────────────────────────────────┘
```

`[Run counterexample]` appears on issues that carry `test` when the language runs in the browser (Python, JavaScript, TypeScript, SQL); it runs the kata code plus the test in the existing runner and shows the assertion output. Other languages show the test as a read-only block titled "Counterexample".

## Scoring (explicit, deterministic, shown to the learner)

| component | points |
| --- | --- |
| each `defect` found (a marked line inside its span) | 2 |
| each `risk` found | 1 |
| each `style` found | 0.5 |
| severity chosen exactly right (defect/risk only) | +0.5 each |
| each false alarm (marked line inside no issue span) | −1 (total floored at 0) |
| verdict correct | +2 · a `ship` verdict while any defect went unfound scores 0 here |
| `ask` items: verdict `ask` | +2 · marking risks that depend on the missing answer still counts as risks found |

`total` = the maximum reachable for the item. `passed` stays at the existing threshold in `src/lib/score.ts`. The progress record (`progress.quizzes[id]`) keeps `score`/`total`/`at` and gains optional `found`, `false`, `verdictOk` so the daily card's "You found X of Y" and ROADMAP B4's before/after measurement can read them. The comparison stays a self-check against an answer key: no free-text grading, no keyword matching.

## Authoring rules (for `prompts/write-review-kata.md`)

- Per flagship track, the first v2 batch is 10 items: 6 `fix` (mixed severities, at least one `style`-only red herring line that looks suspicious but is fine — do not annotate it, the learner's false alarm is the lesson), 2 `ship`, 2 `ask`.
- Every `defect` gets a `test` when the language runs in the browser; the test must fail on the given code and pass on the fixed code (the checker runs both when a `fixed` variant is supplied; otherwise at least the failing run).
- Notes explain the consequence, not the fix alone; `right` names what the generated code got right, so a `ship` item is not a trick.
- `ask` questions are the ones a senior reviewer would actually send back; the `right` paragraph explains why the code cannot be judged without them.

## Checker and pipeline

`content:check` validates the verdict rules above, runs `test` blocks where a runtime exists, and warns on legacy items (no `verdict`) so re-authoring can be tracked in `pnpm content:status`. The kata page's OG card and the practice catalogue read `verdict` to pick the hook line.

## Out of scope

Free-text review grading, multi-file katas, pairwise "which implementation is better" items (a later item type if v2 earns it).
