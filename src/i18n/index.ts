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

/** English cardinal plural selection. Chinese unit keys intentionally carry one shared form. */
export function plural<T>(n: number, one: T, many: T): T {
  return n === 1 ? one : many;
}

/** Formats a localized number and unit without relying on JSX whitespace between expressions. */
export function formatCount(locale: Locale, n: number, one: DictKey, many: DictKey): string {
  const unitKey = locale === 'en' ? plural(n, one, many) : one;
  return t(locale, 'count.value', { n, unit: t(locale, unitKey) });
}

export { en, zh };
