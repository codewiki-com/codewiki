# Write brief: quiz bank for one codewiki topic

You are the assessment editor for codewiki.com. Read the topic in both languages, verify every answer from the source or a local runtime, and replace its quiz bank with publication-ready bilingual YAML.

## Inputs

- Run id and topic id: `{{ID}}` / `{{TOPIC_ID}}`
- Track and slug: `{{TRACK}}` / `{{SLUG}}`
- Topic pair: `{{EN_PATH}}` and `{{ZH_PATH}}`
- Output: `{{OUTPUT_PATHS}}`
- Sibling topics (references must come from this list):
{{SIBLINGS}}
- Existing glossary ids (use identifiers verbatim):
{{GLOSSARY_IDS}}
- Track sections: {{TRACK_SECTIONS}}
- Verified-version summary: {{VERIFIED_VERSIONS}}
- Date: {{TODAY}}
- Editorial contract: `prompts/editorial-standard.md`, especially §9

## Exact YAML shape

Write 4–8 items. This complete four-item example shows every required shape; adapt it to the topic and do not copy its claims:

```yaml
topic: {{TOPIC_ID}}
items:
  - id: predict-result
    type: predict
    title: { en: 'Predict the returned value', zh: '预测返回值' }
    prompt: { en: 'What does the code return?', zh: '这段代码会返回什么？' }
    code: |
      const values = [1, 2, 3];
      console.log(values.map((value) => value * 2));
    lang: javascript
    options:
      - { text: { en: '[2, 4, 6]', zh: '[2, 4, 6]' }, correct: true }
      - { text: { en: '[1, 2, 3]', zh: '[1, 2, 3]' }, correct: false }
      - { text: { en: '6', zh: '6' }, correct: false }
    explanation: { en: 'map returns a new array containing each callback result.', zh: 'map 会返回一个新数组，其中保存每次回调的结果。' }
    difficulty: beginner
    tags: [arrays]
  - id: spot-the-boundary
    type: spotbug
    prompt: { en: 'Which line mishandles the boundary?', zh: '哪一行错误地处理了边界？' }
    code: |
      function last(values) {
        return values[values.length];
      }
    lang: javascript
    issues:
      - line: 2
        kind: correctness
        note: { en: 'The last index is length minus one.', zh: '最后一个索引应为 length 减一。' }
    explanation: { en: 'Array indexes are zero-based, so values.length is past the end.', zh: '数组索引从零开始，因此 values.length 已越过末尾。' }
    difficulty: beginner
    tags: [arrays]
  - id: choose-invariant
    type: mcq
    prompt: { en: 'Which statement is guaranteed?', zh: '哪项陈述一定成立？' }
    options:
      - { text: { en: 'The source array is unchanged.', zh: '源数组保持不变。' }, correct: true }
      - { text: { en: 'The callback runs once total.', zh: '回调总共只运行一次。' }, correct: false }
    explanation: { en: 'The example uses a non-mutating transformation.', zh: '该示例使用不会修改源数组的转换。' }
    difficulty: beginner
    tags: [arrays]
  - id: name-the-method
    type: fill
    prompt: { en: 'Name the method used for the transformation.', zh: '写出用于该转换的方法名。' }
    answer: map
    explanation: { en: 'map transforms each element into a new array.', zh: 'map 会逐项转换元素并生成新数组。' }
    difficulty: beginner
    tags: [arrays]
```

## Quality bar and bilingual rule

- Base every question on the topic. If it has code, include at least one `predict` and one `spotbug`; execute snippets and verify line numbers.
- Give predict and MCQ items 3–4 plausible options with exactly one correct answer. Distractors must encode real misconceptions, not jokes or wording tricks.
- Keep each explanation to at most two sentences in each language. Mix beginner, intermediate and advanced difficulty only where the topic supports it.
- Every reader-facing value has natural English and natural Simplified Chinese with identical meaning. Keep code, identifiers, commands and error text verbatim.
- Do not leave `calibration` tags, placeholders, invented APIs or unverifiable claims. Touch only the output file.
- Run `pnpm content:check --kind quiz {{ID}}` and fix every finding.

When the gate passes, print `WRITE DONE {{ID}}` as the last line. If you cannot finish, print `WRITE FAILED {{ID}}: reason` as the last line.
