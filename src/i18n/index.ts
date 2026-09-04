import en from './en';
import zh from './zh';
import type { Locale } from '@/lib/urls';

export type Dict = typeof en;
export type DictKey = keyof Dict;

const dicts: Record<Locale, Dict> = { en, zh: zh as Dict };

/** Looks up a UI string and fills `{var}` placeholders. Unknown vars are left visible. */
export function t(locale: Locale, key: DictKey, vars: Record<string, string | number> = {}): string {
  return String(dicts[locale][key]).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export { en, zh };
