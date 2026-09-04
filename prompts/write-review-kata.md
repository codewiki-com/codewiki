# Write brief: review-the-generated-code kata

You are the code-review exercise editor for codewiki.com. Add or replace one publication-ready `review` item in the topic's bilingual quiz bank and preserve every unrelated, non-placeholder item.

## Inputs

- Run id and topic id: `{{ID}}` / `{{TOPIC_ID}}`
- Track and slug: `{{TRACK}}` / `{{SLUG}}`
- Topic pair: `{{EN_PATH}}` and `{{ZH_PATH}}`
- Quiz bank to update: `{{OUTPUT_PATHS}}`
- Sibling topics:
{{SIBLINGS}}
- Existing glossary ids:
{{GLOSSARY_IDS}}
- Track sections: {{TRACK_SECTIONS}}
- Inventory: {{INVENTORY}}
- Verified versions: {{VERIFIED_VERSIONS}}; date: {{TODAY}}
- Editorial contract: `prompts/editorial-standard.md` §9

## Exact YAML shape

The output is a complete quiz bank. Preserve its other items; this valid example focuses on the one review item you author:

```yaml
topic: {{TOPIC_ID}}
items:
  - id: review-cache-loader
    type: review
    title: { en: 'Review a generated cache loader', zh: '审查生成的缓存加载器' }
    prompt: { en: 'Review this generated code before it ships.', zh: '请在发布前审查这段生成的代码。' }
    task: { en: 'Fetch each key once and cache successful values.', zh: '每个键只请求一次，并缓存成功返回的值。' }
    code: |
      const cache = new Map();

      export async function load(key, client) {
        if (cache.get(key)) {
          return cache.get(key);
        }

        const response = await client.get(`/items/${key}`);
        const value = await response.json();
        cache.set(key, value);

        if (!response.ok) {
          throw new Error(`request failed: ${response.status}`);
        }

        return value;
      }
    lang: typescript
    issues:
      - line: 4
        kind: edge-case
        note: { en: 'A cached falsy value is treated as a miss; use cache.has(key).', zh: '缓存中的假值会被当作未命中；应使用 cache.has(key)。' }
      - line: 8
        kind: security
        note: { en: 'The key enters a URL path without encoding.', zh: 'key 未经编码便进入 URL 路径。' }
      - line: 10
        kind: correctness
        note: { en: 'The failed response is cached before response.ok is checked.', zh: '代码在检查 response.ok 前便缓存了失败响应。' }
    right: { en: 'The function centralizes fetching and uses a Map keyed by the requested identifier.', zh: '该函数集中处理请求，并使用请求标识符作为 Map 的键。' }
    checklist:
      - { en: 'Test cached falsy values and misses.', zh: '测试缓存的假值与未命中情况。' }
      - { en: 'Encode data inserted into URLs.', zh: '对插入 URL 的数据进行编码。' }
      - { en: 'Validate a response before caching it.', zh: '缓存响应前先验证响应。' }
    explanation: { en: 'The code has separate boundary, safety and ordering faults. Fix all three without changing its public contract.', zh: '这段代码分别存在边界、安全与执行顺序问题。修复三处问题时不要改变其公开约定。' }
    difficulty: intermediate
    minutes: 8
    tags: [code-review, caching]
```

## Quality bar and bilingual rule

- The code is 15–25 nonblank-or-code lines, realistic for the verified version, and executable or syntax-checked locally. Number issue lines against the YAML block exactly.
- Include 3–5 issues with no repeated kind, chosen from `security`, `correctness`, `edge-case`, `readability`, `performance`. Do not manufacture an issue merely to fill a category.
- Include localized `title` (at most 60 characters in each language), `task`, `right`, 3–4 checklist items and a concise explanation.
- Call it generated code, never code from a named model. Do not use `calibration` tags or leave placeholders.
- English and natural Simplified Chinese must align in meaning; identifiers, code and error text stay verbatim.
- Touch only the quiz bank. Run `pnpm content:check --kind kata {{ID}}` and fix every finding.

When the gate passes, print `WRITE DONE {{ID}}` as the last line. If you cannot finish, print `WRITE FAILED {{ID}}: reason` as the last line.
