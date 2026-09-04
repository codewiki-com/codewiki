import { t } from '@/i18n';
import en from '@/i18n/en';
import zh from '@/i18n/zh';

describe('i18n', () => {
  it('has the same keys in both dictionaries', () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
  });
  it('interpolates', () => {
    expect(t('en', 'topic.readTime', { min: 9 })).toBe('9 min at Standard depth');
  });
  it('never returns empty strings', () => {
    for (const v of Object.values(zh)) expect(v.length).toBeGreaterThan(0);
  });
});
