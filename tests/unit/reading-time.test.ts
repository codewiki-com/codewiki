import { estimateMinutes } from '@/lib/reading-time';

describe('estimateMinutes', () => {
  it('counts English words at 220 a minute', () => {
    expect(estimateMinutes('word '.repeat(440).trim(), 'en')).toBe(2);
  });

  it('counts Chinese characters at 380 a minute', () => {
    expect(estimateMinutes('闭包'.repeat(380), 'zh')).toBe(2);
  });

  it('ignores whitespace between Chinese characters', () => {
    expect(estimateMinutes('闭 包\n'.repeat(190), 'zh')).toBe(1);
  });

  it('never returns less than a minute', () => {
    expect(estimateMinutes('one word', 'en')).toBe(1);
    expect(estimateMinutes('', 'en')).toBe(1);
    expect(estimateMinutes('   \n  ', 'zh')).toBe(1);
  });

  it('rounds to the nearest minute', () => {
    expect(estimateMinutes('word '.repeat(330).trim(), 'en')).toBe(2);
    expect(estimateMinutes('word '.repeat(320).trim(), 'en')).toBe(1);
  });
});
