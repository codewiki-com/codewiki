export type ThemePref = 'system' | 'light' | 'dark';
export const PREFS_KEY = 'cw:v1:prefs';
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function resolveTheme(pref: string | null, systemDark: boolean): 'light' | 'dark' {
  if (pref === 'light' || pref === 'dark') return pref;
  return systemDark ? 'dark' : 'light';
}

export function nextTheme(current: ThemePref): ThemePref {
  return current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';
}

export function readPrefs(storage: StorageLike): Record<string, unknown> {
  try {
    return JSON.parse(storage.getItem(PREFS_KEY) ?? '{}') as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function readThemePref(storage: StorageLike): ThemePref {
  const t = readPrefs(storage).theme;
  return t === 'light' || t === 'dark' ? t : 'system';
}

export function writeThemePref(pref: ThemePref, storage: StorageLike): void {
  storage.setItem(PREFS_KEY, JSON.stringify({ ...readPrefs(storage), theme: pref }));
}
