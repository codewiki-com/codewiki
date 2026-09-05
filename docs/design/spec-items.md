# "Say what you need" exercises (`spec` items) — design note

Design lead, 2026-09-05 (ROADMAP B2). A sixth practice item type. Trains the half of the tagline the five existing types do not touch: stating requirements, constraints and acceptance criteria precisely enough that a person or an agent can implement and verify them.

## Item model

```yaml
- id: spec-search-debounce
  type: spec
  title: { en: 'Specify a debounced search box', zh: '把搜索防抖说清楚' }
  prompt: { en: 'A product manager writes: "debounce the search box". Before anyone implements it, write down what must be true.', zh: … }
  brief: { en: 'Search-as-you-type against /api/search; results render in a list under the box.', zh: … }
  constraints:                          # the expert's list; each is a graded checkpoint
    - id: empty-input
      text: { en: 'Clearing the input cancels pending requests and empties the list.', zh: … }
      hint: { en: 'What happens on the way to an empty box?', zh: … }
      weight: 2                         # 1 = nice to have, 2 = must have
    - id: stale-response
      text: { en: 'A response for an older query never overwrites results of a newer one.', zh: … }
      weight: 2
    - id: failure
      text: { en: 'A failed request shows an inline error and keeps the last good results.', zh: … }
      weight: 1
    - id: unmounted
      text: { en: 'No state update after the component unmounts.', zh: … }
      weight: 1
  acceptance:                           # model acceptance tests, shown at compare time
    - { en: 'Typing "ab" then "abc" within 200 ms sends one request, for "abc".', zh: … }
    - { en: 'Responses arriving out of order leave the list showing "abc" results.', zh: … }
  distractors:                          # plausible but wrong constraints, for the pick step
    - { en: 'Debounce must be exactly 300 ms.', zh: …, why: { en: 'The delay is a tuning parameter, not a requirement.', zh: … } }
  lang: typescript                      # optional, for the playground hand-off
  minutes: 6
```

## Learner flow (three steps in the kata shell)

1. **Write** — the brief and the one-line request; a free-text area "What must be true before this is done?" (bulleted; not graded, kept for step 3 and for the prompt hand-off).
2. **Pick** — a shuffled list of the expert constraints and the distractors as checkboxes; the learner ticks what belongs in the spec. Then, for each ticked item, a one-line "how would you check it?" field (optional).
3. **Compare** — score and the expert view: constraints found / missed (with the `hint` text on the missed ones), distractors wrongly included (with `why`), the model acceptance tests, and the learner's own text next to them.

Scoring: each constraint ticked = `weight` points; each distractor ticked = −1 (floored at 0); total = Σ weights. Stored in `progress.quizzes[id]` like other items.

## Hand-off to the prompt builder and the playground

- Compare step button **"Build the prompt"**: opens `/ai/prompt-builder/?item={bank}#{id}` with goal `implement` (new goal if the builder lacks it; today's goals are read from `PromptBuilder.tsx`), the ticked constraints as a "Constraints" block and the acceptance tests as "Verify by" — the learner leaves with a prompt whose quality came from the exercise.
- When `lang` runs in the browser, a second button **"Try it"** opens the playground with a stub and the acceptance tests as comments.

## Where they live

- Same quiz banks (`src/content/quizzes/{track}/{slug}.yaml`), `type: spec`; catalogue label `practice.type.spec` "Say what you need" / 把需求说清楚; `DEFAULT_MINUTES.spec = 6`; practice filters, daily pool (not included — the daily kata stays a code review), OG cards and the Markdown twin gain the type.
- First batch: 20 items across the six flagship tracks and `foundations` (requirements are language-agnostic; `lang` is optional), authored by Codex from `prompts/write-spec-item.md` (to be written from this note), 3–5 constraints each, 1–2 distractors, 2 acceptance tests.

## Out of scope

Grading free text; multi-turn clarification dialogues; team review of specs.
