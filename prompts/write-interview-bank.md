# Write brief: interview bank for one codewiki track

You are the senior interview editor for codewiki.com. Replace the track bank with a balanced, technically verified set that a candidate can answer aloud.

## Inputs

- Run id: `{{ID}}`; topic-id context: `{{TOPIC_ID}}`
- Track and slug: `{{TRACK}}` / `{{SLUG}}`
- English and Chinese sources: `{{EN_PATH}}` / `{{ZH_PATH}}`
- Output: `{{OUTPUT_PATHS}}`
- Available topics (use at least one exact id per item):
{{INVENTORY}}
- Sibling list: {{SIBLINGS}}
- Track sections:
{{TRACK_SECTIONS}}
- Existing glossary ids:
{{GLOSSARY_IDS}}
- Verified versions: {{VERIFIED_VERSIONS}}; date: {{TODAY}}
- Editorial contract: `prompts/editorial-standard.md` §9

## Exact YAML shape

Write 30–45 items in this complete shape:

```yaml
track: {{TRACK}}
items:
  - id: explain-one-mechanism
    question:
      en: 'What mechanism makes this behavior possible, and where does it fail?'
      zh: '哪种机制实现了这一行为，它又会在哪些情况下失效？'
    answer:
      en: |
        Start with the mechanism and name the state it keeps. Then explain when the runtime reads that state and contrast it with the common snapshot misconception. A strong answer gives one small failure case, states the observable result, and names the narrowest fix. It should also distinguish language behavior from framework convention so the explanation remains true outside one library. The exact terms and version-sensitive details must come from the linked topic rather than memory.
      zh: |
        先说明相关机制，并指出它保存了哪些状态；再解释运行时何时读取这些状态，同时澄清常见的“创建时快照”误解。高质量回答还应给出一个简短的失败案例，说明可观察结果，并指出范围最小的修复方式。回答需要区分语言本身的行为与框架约定，避免结论只对某个库成立。精确术语和受版本影响的细节必须来自所关联的主题，而不是凭记忆补写。
    topics: [{{TOPIC_ID}}]
    level: intermediate
    tags: [mechanics]
    section: { en: 'Language core', zh: '语言核心' }
    frequency: common
```

## Quality bar and bilingual rule

- Produce 30–45 distinct items distributed across the real track sections and available topics. Every `topics` entry must appear in the inventory.
- Every item has `section`, `level`, `frequency`, and at least one topic reference. Use `common`, `occasional` and `rare` intentionally; cover all applicable levels.
- Each answer is 60–120 words in each language at spoken length. Lead with a direct answer, then mechanism, boundary and a compact example where useful.
- Test version-sensitive claims against local sources or official documentation. Do not ask trivia, riddles, opinion-only questions or questions the supplied topics cannot support.
- English and natural Simplified Chinese align item for item. Keep identifiers, commands, API names and error messages verbatim.
- Remove every `calibration` tag and placeholder. Touch only the output file.
- Run `pnpm content:check --kind interview {{ID}}` and fix every finding.

When the gate passes, print `WRITE DONE {{ID}}` as the last line. If you cannot finish, print `WRITE FAILED {{ID}}: reason` as the last line.
