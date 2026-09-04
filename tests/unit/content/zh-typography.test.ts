import { findZhIssues, fixZhTypography, zhIssueSummary } from '../../../scripts/content/lib/zh-typography';

describe('zh typography', () => {
  it('adds spacing between CJK and latin', () => {
    expect(fixZhTypography('Laravel是目前最流行的PHP框架')).toBe('Laravel 是目前最流行的 PHP 框架');
  });
  it('converts ascii punctuation after CJK', () => {
    expect(fixZhTypography('安全,无需垃圾回收器.')).toBe('安全，无需垃圾回收器。');
  });
  it('leaves code alone', () => {
    const s = '调用 `foo(a,b)` 即可，如下：\n```py\nprint("a,b")\n```\n';
    expect(fixZhTypography(s)).toBe(s);
  });
  it('reports issues with positions', () => {
    expect(findZhIssues('第2行,有问题')[0]).toMatchObject({ line: 1, rule: 'spacing' });
  });
  it('keeps urls and english sentences', () => {
    expect(fixZhTypography('见 https://a.b/c?d=1,2 和 Hello, world.')).toBe(
      '见 https://a.b/c?d=1,2 和 Hello, world.',
    );
  });

  it('reports 1-based line and column', () => {
    expect(findZhIssues('第一行\n安全,无需')).toEqual([
      { line: 2, col: 3, rule: 'punct', message: expect.any(String), fix: '，' },
    ]);
  });
  it('pairs parentheses around latin acronyms', () => {
    expect(fixZhTypography('内部开发者平台(IDP)是趋势')).toBe('内部开发者平台（IDP）是趋势');
  });
  it('converts quotes wrapping CJK only', () => {
    expect(fixZhTypography('他说"你好"和"ok"。')).toBe('他说“你好”和"ok"。');
    expect(fixZhTypography("他说'你好'。")).toBe('他说‘你好’。');
  });
  it('leaves quote runs such as docstrings alone', () => {
    expect(fixZhTypography('"""中文注释"""')).toBe('"""中文注释"""');
  });
  it('keeps english apostrophes', () => {
    expect(fixZhTypography("中文 don't 用 it's 吗")).toBe("中文 don't 用 it's 吗");
  });
  it('converts trailing ellipsis after CJK', () => {
    expect(fixZhTypography('等等...')).toBe('等等……');
    expect(fixZhTypography('run ...')).toBe('run ...');
  });
  it('keeps dots inside versions and file names', () => {
    expect(fixZhTypography('见 main.py 和 3.14 的说明。')).toBe('见 main.py 和 3.14 的说明。');
    expect(fixZhTypography('支持 Python 3.x.')).toBe('支持 Python 3.x.');
  });
  it('leaves frontmatter untouched', () => {
    const s = '---\ntitle: 中文,标题\n---\n\n正文,如下\n';
    expect(fixZhTypography(s)).toBe('---\ntitle: 中文,标题\n---\n\n正文，如下\n');
  });
  it('leaves markdown link targets untouched', () => {
    expect(fixZhTypography('见 [文档](https://a.b/c,d) 说明.')).toBe('见 [文档](https://a.b/c,d) 说明。');
  });
  it('leaves html and mdx tag attributes untouched', () => {
    expect(fixZhTypography('<Callout title="重要,提示" kind=cn />\n\n中文段落.')).toBe(
      '<Callout title="重要,提示" kind=cn />\n\n中文段落。',
    );
  });
  it('leaves inline code containing commas untouched', () => {
    expect(fixZhTypography('用 `a,b` 分隔,可以')).toBe('用 `a,b` 分隔，可以');
  });
  it('leaves indented code blocks alone', () => {
    const s = '说明如下:\n\n    def f():\n        """中文,注释"""\n\n正文,结束\n';
    expect(fixZhTypography(s)).toBe('说明如下：\n\n    def f():\n        """中文,注释"""\n\n正文，结束\n');
  });
  it('still lints indented list continuations', () => {
    expect(fixZhTypography('- 第一项\n\n    继续说明,如下\n')).toBe('- 第一项\n\n    继续说明，如下\n');
  });
  it('never spaces around full-width punctuation', () => {
    expect(fixZhTypography('这是（PHP）框架，见 Laravel。')).toBe('这是（PHP）框架，见 Laravel。');
  });
  it('is idempotent', () => {
    const s = 'Laravel是PHP框架,他说"你好"...见 https://a.b/c,d 和 `x,y`.\n\n中文(IDP)结尾.';
    const once = fixZhTypography(s);
    expect(fixZhTypography(once)).toBe(once);
    expect(findZhIssues(once).filter((issue) => issue.fix !== undefined)).toEqual([]);
  });
  it('summarises issues by rule', () => {
    const summary = zhIssueSummary(findZhIssues('Laravel是框架,他说"你好"，等等...'));
    expect(summary).toEqual({ spacing: 1, punct: 1, quotes: 2, ellipsis: 1 });
  });
});
