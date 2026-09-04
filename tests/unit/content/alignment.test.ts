import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { alignBlocks, blocks, setAligned } from '../../../scripts/content/lib/alignment';

const FIXTURES = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../fixtures');

function read(...segments: string[]): string {
  return readFileSync(path.join(FIXTURES, ...segments), 'utf8');
}

describe('blocks', () => {
  const kinds = read('alignment', 'kinds.mdx');
  const parsed = blocks(kinds);

  it('classifies every block kind, skipping frontmatter', () => {
    expect(parsed.map((block) => [block.kind, block.line])).toEqual([
      ['other', 6],
      ['heading', 8],
      ['paragraph', 10],
      ['component', 13],
      ['heading', 17],
      ['list', 19],
      ['callout', 24],
      ['other', 27],
      ['code', 29],
      ['table', 34],
      ['other', 38],
    ]);
  });

  it('records heading depth, list item count and a code hash', () => {
    expect(parsed[1].depth).toBe(1);
    expect(parsed[4].depth).toBe(2);
    expect(parsed[5].itemCount).toBe(3);
    expect(parsed[8].codeHash).toMatch(/^[0-9a-f]{40}$/);
  });

  it('keeps a fenced block whole even when it contains blank lines', () => {
    const md = '```js\nconst a = 1;\n\nconst b = 2;\n```\n\nAfter.\n';
    expect(blocks(md).map((block) => block.kind)).toEqual(['code', 'paragraph']);
  });

  it('hashes code with comments stripped per language', () => {
    const en = blocks('```python\n# outer scope\nprint(1)\n```\n')[0];
    const zh = blocks('```python\n# 外层作用域\nprint(1)\n```\n')[0];
    const other = blocks('```python\n# outer scope\nprint(2)\n```\n')[0];
    expect(en.codeHash).toBe(zh.codeHash);
    expect(en.codeHash).not.toBe(other.codeHash);
  });

  it('strips line and block comments for the C family, and markup comments', () => {
    const en = blocks('```ts\nconst a = 1; // one\n/* note */\nconst b = 2;\n```\n')[0];
    const zh = blocks('```ts\nconst a = 1; // 一\n/* 注释 */\nconst b = 2;\n```\n')[0];
    expect(en.codeHash).toBe(zh.codeHash);
    const html = blocks('```html\n<p>hi</p>\n<!-- note -->\n```\n')[0];
    const htmlZh = blocks('```html\n<p>hi</p>\n<!-- 注释 -->\n```\n')[0];
    expect(html.codeHash).toBe(htmlZh.codeHash);
    const sql = blocks('```sql\nSELECT 1; -- one\n```\n')[0];
    const sqlZh = blocks('```sql\nSELECT 1; -- 一\n```\n')[0];
    expect(sql.codeHash).toBe(sqlZh.codeHash);
  });
});

describe('alignBlocks', () => {
  const en = '# Title\n\nIntro.\n\n- a\n- b\n\n```python\n# add\nprint(1)\n```\n';

  it('aligns identical structures', () => {
    const zh = '# 标题\n\n引言。\n\n- 甲\n- 乙\n\n```python\n# 相加\nprint(1)\n```\n';
    const result = alignBlocks(blocks(en), blocks(zh));
    expect(result.aligned).toBe(true);
    expect(result.mismatches).toEqual([]);
    expect(result.similarity).toBe(1);
  });

  it('reports the index and reason of an extra paragraph in zh', () => {
    const zh = '# 标题\n\n引言。\n\n多出来的一段。\n\n- 甲\n- 乙\n\n```python\n# 相加\nprint(1)\n```\n';
    const result = alignBlocks(blocks(en), blocks(zh));
    expect(result.aligned).toBe(false);
    expect(result.mismatches[0].index).toBe(2);
    expect(result.mismatches[0].reason).toMatch(/kind/);
    expect(result.mismatches.at(-1)?.reason).toMatch(/missing/);
    expect(result.similarity).toBeLessThan(1);
  });

  it('reports every mismatch rather than stopping at the first', () => {
    const zh = '## 标题\n\n引言。\n\n- 甲\n- 乙\n- 丙\n\n```python\n# 相加\nprint(1)\n```\n';
    const result = alignBlocks(blocks(en), blocks(zh));
    expect(result.mismatches.map((mismatch) => mismatch.index)).toEqual([0, 2]);
    expect(result.mismatches[0].reason).toMatch(/depth/);
    expect(result.mismatches[0].en?.depth).toBe(1);
    expect(result.mismatches[0].zh?.depth).toBe(2);
    expect(result.mismatches[1].reason).toMatch(/item/);
  });

  it('accepts code that differs only in comments', () => {
    const enCode = blocks('```python\n# a comment\nprint(1)\n```\n');
    const zhCode = blocks('```python\n# 一条注释\n# 另一条注释\nprint(1)\n```\n');
    expect(alignBlocks(enCode, zhCode).aligned).toBe(true);
  });

  it('rejects code that differs in a token', () => {
    const enCode = blocks('```python\n# a comment\nprint(1)\n```\n');
    const zhCode = blocks('```python\n# 一条注释\nprint(2)\n```\n');
    const result = alignBlocks(enCode, zhCode);
    expect(result.aligned).toBe(false);
    expect(result.mismatches[0].reason).toMatch(/code/);
  });

  it('rejects a list whose item count differs', () => {
    const result = alignBlocks(blocks('- a\n- b\n'), blocks('- 甲\n- 乙\n- 丙\n'));
    expect(result.aligned).toBe(false);
    expect(result.mismatches[0].reason).toMatch(/2.*3|3.*2/);
  });

  it('aligns the two polished sample pairs', () => {
    for (const [track, slug] of [
      ['python', 'closures'],
      ['javascript', 'event-loop'],
    ]) {
      const result = alignBlocks(
        blocks(read('aligned', track, `${slug}.en.mdx`)),
        blocks(read('aligned', track, `${slug}.zh.mdx`)),
      );
      expect(result.mismatches).toEqual([]);
      expect(result.aligned).toBe(true);
    }
  });
});

describe('setAligned', () => {
  const doc = read('alignment', 'kinds.mdx');

  it('flips the aligned line and changes nothing else', () => {
    const next = setAligned(doc, true);
    expect(next).toBe(doc.replace('aligned: false', 'aligned: true'));
  });

  it('is a no-op when the value already matches', () => {
    expect(setAligned(doc, false)).toBe(doc);
  });

  it('inserts the key at the end of the frontmatter when it is missing', () => {
    const without = '---\ntitle: T\n---\n\nBody.\n';
    expect(setAligned(without, true)).toBe('---\ntitle: T\naligned: true\n---\n\nBody.\n');
  });

  it('throws when the document has no frontmatter', () => {
    expect(() => setAligned('Body only.\n', true)).toThrow(/frontmatter/);
  });
});
