import { headings, fences, stripH1, cjkRatio } from '../../../scripts/content/lib/markdown';
describe('markdown helpers', () => {
  const md = '# Title\n\nIntro\n\n## One\n\n```python\n# not a heading\nprint(1)\n```\n\n### Two\n';
  it('lists headings outside fences', () => {
    expect(headings(md)).toEqual([
      { depth: 1, text: 'Title' },
      { depth: 2, text: 'One' },
      { depth: 3, text: 'Two' },
    ]);
  });
  it('extracts fences with lang and line', () => {
    expect(fences(md)).toEqual([{ lang: 'python', meta: '', code: '# not a heading\nprint(1)', line: 7 }]);
  });
  it('strips the first H1 only', () => {
    expect(stripH1(md).startsWith('Intro')).toBe(true);
  });
  it('computes cjk ratio', () => {
    expect(cjkRatio('闭包 closure')).toBeCloseTo(2 / 9, 2);
    expect(cjkRatio('abc')).toBe(0);
  });
});
