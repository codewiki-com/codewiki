import { layoutFor, pairBlocks, shouldClone } from '@/lib/bilingual';

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
