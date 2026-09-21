import { DEFAULT_PREFS, KEYS, readStore, writeStore, type Prefs, type Theme } from '@/lib/prefs';

export type ThemePref = Theme;
export const THEME_EVENT = 'cw:theme';

export function resolveTheme(pref: string | null, systemDark: boolean): 'light' | 'dark' {
  if (pref === 'light' || pref === 'dark') return pref;
  return systemDark ? 'dark' : 'light';
}

export function nextTheme(current: ThemePref): ThemePref {
  return current === 'light' ? 'dark' : 'light';
}

export function isThemePref(value: unknown): value is ThemePref {
  return value === 'light' || value === 'dark';
}

/** Theme reads and writes share the guarded, field-validating preference store. */
export function readThemePref(): ThemePref {
  const systemDark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  return readStore<Prefs>(KEYS.prefs, {
    ...DEFAULT_PREFS,
    theme: systemDark ? 'dark' : 'light',
  }).theme;
}

export function writeThemePref(pref: ThemePref): void {
  writeStore<Prefs>(KEYS.prefs, { ...readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS), theme: pref });
}

type ThemeRoot = Pick<HTMLElement, 'setAttribute'>;

/** Applies the selected palette without persistence. */
export function applyTheme(pref: ThemePref, systemDark: boolean, root: ThemeRoot): void {
  root.setAttribute('data-theme', resolveTheme(pref, systemDark));
  root.setAttribute('data-theme-pref', pref);
}

/** Applies first, then persists; a blocked store must never prevent the visible theme change. */
export function applyThemePreference(pref: ThemePref, systemDark: boolean, root: ThemeRoot): void {
  applyTheme(pref, systemDark, root);
  writeThemePref(pref);
}
