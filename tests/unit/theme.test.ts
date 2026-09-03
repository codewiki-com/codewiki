import { describe, it, expect } from 'vitest';
import { resolveTheme, nextTheme, readThemePref, writeThemePref } from '@/lib/theme';

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
  it('round-trips through a Storage-like object', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    writeThemePref('dark', storage);
    expect(readThemePref(storage)).toBe('dark');
    expect(JSON.parse(store.get('cw:v1:prefs')!)).toEqual({ theme: 'dark' });
  });
});
