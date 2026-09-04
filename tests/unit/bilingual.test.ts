import {
  isCalloutTextChild,
  layoutFor,
  orderFor,
  pairAlignedBlocks,
  pairBlocks,
  shouldClone,
  structuralSignaturesMatch,
} from '@/lib/bilingual';

describe('pairBlocks', () => {
  it('pairs in local order and reports missing ids', () => {
    const theirs = new Map([
      ['intro:1', '<p>介绍</p>'],
      ['scope:2', '<aside>提示</aside>'],
    ]);

    expect(pairBlocks(['intro:1', 'scope:1', 'scope:2'], theirs)).toEqual({
      pairs: [
        ['intro:1', '<p>介绍</p>'],
        ['scope:2', '<aside>提示</aside>'],
      ],
      missing: ['scope:1'],
    });
  });

  it('refuses every positional pair when the page signatures differ', () => {
    const theirs = new Map([['intro:1', '<p>介绍</p>']]);
    expect(pairAlignedBlocks(['intro:1'], theirs, 'p,h2,p', 'p,h3,p')).toBeNull();
    expect(pairAlignedBlocks(['intro:1'], theirs, 'p,h2,p', 'p,h2,p')).toEqual({
      pairs: [['intro:1', '<p>介绍</p>']],
      missing: [],
    });
    expect(structuralSignaturesMatch(undefined, undefined)).toBe(false);
  });
});

describe('shouldClone', () => {
  it('shares code and headings but clones prose blocks', () => {
    expect(shouldClone('section:1', 'p')).toBe(true);
    expect(shouldClone('section:2', 'aside.callout')).toBe(true);
    expect(shouldClone('section:3', 'figure.codebox')).toBe(false);
    expect(shouldClone('section:4', 'figure.diagram')).toBe(false);
    expect(shouldClone('heading', 'h2')).toBe(false);
  });
});

describe('layoutFor', () => {
  it('uses side layout only for a wide viewport with the side preference', () => {
    expect(layoutFor(1439, 'side')).toBe('paired');
    expect(layoutFor(1440, 'side')).toBe('side');
    expect(layoutFor(1920, 'paired')).toBe('paired');
  });
});

describe('bilingual language order', () => {
  it('uses one absolute order for all bilingual renderers', () => {
    expect(orderFor('en-zh')).toEqual(['en', 'zh']);
    expect(orderFor('zh-en')).toEqual(['zh', 'en']);
  });
});

describe('callout text children', () => {
  it('keeps translated prose but excludes a nested runnable codebox and its action chrome', () => {
    const callout = [
      { tag: 'p', classes: ['callout-label'], text: '陷阱' },
      { tag: 'p', classes: [], text: '不要重复运行控件。' },
      { tag: 'figure', classes: ['codebox'], text: 'print(1)运行' },
      { tag: 'div', classes: ['codeactions'], text: '复制运行' },
    ];

    expect(
      callout
        .filter((child) => isCalloutTextChild(child.tag, child.classes, child.text))
        .map((child) => child.text),
    ).toEqual(['陷阱', '不要重复运行控件。']);
  });
});
