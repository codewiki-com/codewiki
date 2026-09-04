import { describe, it, expect } from 'vitest';
import { applyThemePreference, nextTheme, readThemePref, resolveTheme, writeThemePref } from '@/lib/theme';
import { KEYS } from '@/lib/prefs';

describe('resolveTheme', () => {
  it('follows system when pref is system or missing', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
  it('honours explicit prefs', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });
  it('ignores garbage', () => {
    expect(resolveTheme('purple', true)).toBe('dark');
  });
});

describe('nextTheme', () => {
  it('cycles system -> light -> dark -> system', () => {
    expect(nextTheme('system')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('system');
  });
});

describe('prefs storage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('round-trips through the guarded preference API and preserves other fields', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    });
    localStorage.setItem(KEYS.prefs, JSON.stringify({ depth: 'quick' }));
    writeThemePref('dark');
    expect(readThemePref()).toBe('dark');
    expect(JSON.parse(store.get(KEYS.prefs)!)).toMatchObject({ theme: 'dark', depth: 'quick' });
  });

  it('applies the theme even when persistence throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('storage blocked');
      },
    });
    const attributes = new Map<string, string>();
    const root = { setAttribute: (name: string, value: string) => void attributes.set(name, value) };

    expect(() => applyThemePreference('dark', false, root)).not.toThrow();
    expect(attributes.get('data-theme')).toBe('dark');
    expect(attributes.get('data-theme-pref')).toBe('dark');
  });
});
