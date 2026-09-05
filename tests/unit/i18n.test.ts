import { formatCount, plural, t } from '@/i18n';
import en from '@/i18n/en';
import zh from '@/i18n/zh';
import { tOffline } from '@/i18n/offline';

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

describe('offline strings', () => {
  // They live outside the shared dictionaries so no island bundles them; see src/i18n/offline.ts.
  it('is not reachable from the dictionary every page downloads', () => {
    expect(Object.keys(en).some((key) => key.startsWith('pwa.'))).toBe(false);
  });

  it('translates and interpolates the same way `t` does', () => {
    expect(tOffline('en', 'update')).toBe('A new version is available');
    expect(tOffline('zh', 'update')).toBe('有新版本可用');
    expect(tOffline('en', 'saveRuntimes', { mb: 27 })).toBe('Download runtimes for offline (≈27 MB)');
    // The Save button fills these itself, so an unpassed slot has to survive the lookup.
    expect(tOffline('en', 'saving')).toBe('Saving… {done}/{total}');
  });
});
