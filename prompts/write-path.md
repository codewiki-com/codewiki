# Write brief: learning path and checkpoint banks

You are the curriculum editor for codewiki.com. Write one bilingual path from real topic ids and write every milestone checkpoint bank in the same run.

## Inputs

- Run id and scoped path id: `{{ID}}` / `{{TOPIC_ID}}`
- Track and output slug: `{{TRACK}}` / `{{SLUG}}`
- English and Chinese topic sources: `{{EN_PATH}}` / `{{ZH_PATH}}`
- Known output before checkpoint discovery: `{{OUTPUT_PATHS}}`
- Staged and live inventory; use only these ids:
{{INVENTORY}}
- Siblings: {{SIBLINGS}}
- Track sections:
{{TRACK_SECTIONS}}
- Existing glossary ids:
{{GLOSSARY_IDS}}
- Verified versions: {{VERIFIED_VERSIONS}}; date: {{TODAY}}
- Editorial contract: `prompts/editorial-standard.md` §9

## Exact path YAML shape

This complete compact example has 20 topics, four milestones, three outcomes and four edges. Replace every illustrative id with an inventory id.

```yaml
id: {{SLUG}}
title: { en: 'Track foundations', zh: '技术方向基础路径' }
description: { en: 'A staged route from first principles to practical work.', zh: '从基本原理逐步走向实际工作的学习路线。' }
rationale: { en: 'Each milestone establishes the vocabulary and mechanics required by the next.', zh: '每个里程碑都会建立下一阶段所需的术语与机制。' }
tracks: [{{TRACK}}]
level: { from: beginner, to: intermediate }
hours: 18
outcomes:
  - { en: 'Explain the core execution model.', zh: '解释核心执行模型。' }
  - { en: 'Review realistic code safely.', zh: '安全地审查真实代码。' }
  - { en: 'Build and debug a small production-shaped tool.', zh: '构建并调试一个具备生产项目结构的小工具。' }
milestones:
  - { id: foundation, title: { en: 'Foundations', zh: '基础' }, topics: [{{TRACK}}/topic-01, {{TRACK}}/topic-02, {{TRACK}}/topic-03, {{TRACK}}/topic-04, {{TRACK}}/topic-05], checkpoint: {{TRACK}}/checkpoint-1 }
  - { id: mechanics, title: { en: 'Mechanics', zh: '机制' }, topics: [{{TRACK}}/topic-06, {{TRACK}}/topic-07, {{TRACK}}/topic-08, {{TRACK}}/topic-09, {{TRACK}}/topic-10], checkpoint: {{TRACK}}/checkpoint-2 }
  - { id: practice, title: { en: 'Practice', zh: '实践' }, topics: [{{TRACK}}/topic-11, {{TRACK}}/topic-12, {{TRACK}}/topic-13, {{TRACK}}/topic-14, {{TRACK}}/topic-15], checkpoint: {{TRACK}}/checkpoint-3 }
  - { id: production, title: { en: 'Production', zh: '生产实践' }, topics: [{{TRACK}}/topic-16, {{TRACK}}/topic-17, {{TRACK}}/topic-18, {{TRACK}}/topic-19, {{TRACK}}/topic-20], checkpoint: {{TRACK}}/checkpoint-4 }
edges:
  - { from: {{TRACK}}/topic-01, to: {{TRACK}}/topic-06 }
  - { from: {{TRACK}}/topic-05, to: {{TRACK}}/topic-08 }
  - { from: {{TRACK}}/topic-09, to: {{TRACK}}/topic-13 }
  - { from: {{TRACK}}/topic-15, to: {{TRACK}}/topic-18 }
```

## Exact checkpoint YAML shape

Write one file per milestone at `src/content/quizzes/{{TRACK}}/checkpoint-{n}.yaml`. Each has exactly eight fully bilingual items; this is the complete item shape:

```yaml
topic: {{TRACK}}/checkpoint-1
items:
  - id: checkpoint-1-core
    type: mcq
    prompt: { en: 'Which statement matches the mechanism?', zh: '哪项陈述符合这一机制？' }
    options:
      - { text: { en: 'The verified statement', zh: '经过验证的陈述' }, correct: true }
      - { text: { en: 'A common misconception', zh: '常见误解' }, correct: false }
      - { text: { en: 'A nearby but different rule', zh: '相近但不同的规则' }, correct: false }
    explanation: { en: 'State why the right option follows from the milestone topics.', zh: '说明为什么正确选项能够由本里程碑的主题推出。' }
    difficulty: beginner
    tags: [checkpoint]
  - { id: checkpoint-1-term, type: fill, prompt: { en: 'Name the precise term.', zh: '写出准确术语。' }, answer: exact-term, explanation: { en: 'The milestone defines this term directly.', zh: '本里程碑直接定义了这一术语。' }, difficulty: beginner, tags: [checkpoint] }
  - { id: checkpoint-1-output, type: mcq, prompt: { en: 'Which output is correct?', zh: '哪项输出正确？' }, options: [{ text: { en: 'Verified output', zh: '经过验证的输出' }, correct: true }, { text: { en: 'Common wrong output', zh: '常见错误输出' }, correct: false }], explanation: { en: 'The runtime produces the verified output.', zh: '运行时会产生经过验证的输出。' }, difficulty: beginner, tags: [checkpoint] }
  - { id: checkpoint-1-boundary, type: fill, prompt: { en: 'Name the boundary condition.', zh: '写出边界条件。' }, answer: boundary, explanation: { en: 'This boundary changes the behavior.', zh: '这一边界会改变行为。' }, difficulty: intermediate, tags: [checkpoint] }
  - { id: checkpoint-1-rule, type: mcq, prompt: { en: 'Which rule applies?', zh: '应采用哪条规则？' }, options: [{ text: { en: 'The scoped rule', zh: '适用范围内的规则' }, correct: true }, { text: { en: 'A neighboring rule', zh: '相邻概念的规则' }, correct: false }], explanation: { en: 'The scoped rule matches the stated conditions.', zh: '适用范围内的规则符合题设条件。' }, difficulty: intermediate, tags: [checkpoint] }
  - { id: checkpoint-1-failure, type: fill, prompt: { en: 'Name the failure mode.', zh: '写出失败模式。' }, answer: failure-mode, explanation: { en: 'The topic names this observable failure.', zh: '主题指出了这一可观察的失败模式。' }, difficulty: intermediate, tags: [checkpoint] }
  - { id: checkpoint-1-fix, type: mcq, prompt: { en: 'Which fix preserves the contract?', zh: '哪种修复方式能保留约定？' }, options: [{ text: { en: 'The narrow verified fix', zh: '经过验证且范围最小的修复' }, correct: true }, { text: { en: 'A contract-breaking rewrite', zh: '破坏约定的重写' }, correct: false }], explanation: { en: 'The narrow fix corrects the defect without changing callers.', zh: '范围最小的修复能在不影响调用方的前提下纠正缺陷。' }, difficulty: advanced, tags: [checkpoint] }
  - { id: checkpoint-1-review, type: fill, prompt: { en: 'Name the final review check.', zh: '写出最后一项审查检查。' }, answer: invariant, explanation: { en: 'Checking the invariant catches the remaining risk.', zh: '检查不变量可以发现剩余风险。' }, difficulty: advanced, tags: [checkpoint] }
```

## Quality bar and bilingual rule

- Select 18–30 unique inventory topics in prerequisite order, grouped into 4–6 coherent milestones. Do not invent planned ids.
- Give the path exactly three concrete outcomes, at least four useful forward edges, realistic hours and bilingual `rationale` explaining the order.
- Write every referenced checkpoint bank now, with exactly eight items spanning its milestone. Use real misconceptions and exactly one correct option.
- English and natural Simplified Chinese align field for field. Identifiers remain verbatim. Remove `calibration` tags and placeholders.
- Touch only the path YAML and its referenced checkpoint YAML files. Run `pnpm content:check --kind path {{ID}}` and fix every finding.

When the gate passes, print `WRITE DONE {{ID}}` as the last line. If you cannot finish, print `WRITE FAILED {{ID}}: reason` as the last line.
