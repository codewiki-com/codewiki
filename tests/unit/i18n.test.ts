import { formatCount, plural, t } from '@/i18n';
import en from '@/i18n/en';
import zh from '@/i18n/zh';

describe('i18n', () => {
  it('has the same keys in both dictionaries', () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
  });
  it('interpolates', () => {
    expect(
      t('en', 'topic.readTime', {
        count: formatCount('en', 9, 'unit.minute', 'unit.minutes'),
      }),
    ).toBe('9 min at Standard depth');
  });
  it('selects the English singular only for one', () => {
    expect(plural(1, 'question', 'questions')).toBe('question');
    expect(plural(0, 'question', 'questions')).toBe('questions');
    expect(plural(2, 'question', 'questions')).toBe('questions');
  });
  it('formats English plurals and the single Chinese unit form', () => {
    expect(formatCount('en', 1, 'unit.item', 'unit.items')).toBe('1 item');
    expect(formatCount('en', 2, 'unit.item', 'unit.items')).toBe('2 items');
    expect(formatCount('zh', 2, 'unit.item', 'unit.items')).toBe('2项');
  });
  it('never returns empty strings', () => {
    for (const v of Object.values(zh)) expect(v.length).toBeGreaterThan(0);
  });
});
