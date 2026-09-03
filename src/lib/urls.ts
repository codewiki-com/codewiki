// Locale plumbing: the URL shape is `/` for English and `/zh/` for Chinese.

export type Locale = 'en' | 'zh';

export const LOCALES: Locale[] = ['en', 'zh'];

export const DEFAULT_LOCALE: Locale = 'en';

/** Reads the locale out of a site-absolute path. Anything not under `/zh` is English. */
export function localeFromPath(path: string): Locale {
  return path === '/zh' || path.startsWith('/zh/') ? 'zh' : 'en';
}

/** Removes the locale prefix, so `/zh/python/` becomes `/python/`. */
export function stripLocale(path: string): string {
  return localeFromPath(path) === 'zh' ? path.replace(/^\/zh(\/|$)/, '/') : path;
}

/** Rewrites a path into the given locale, regardless of the locale it currently carries. */
export function localizePath(path: string, locale: Locale): string {
  const base = stripLocale(path);
  return locale === 'en' ? base : `/zh${base === '/' ? '/' : base}`;
}

/** Both language variants of a path, for hreflang links and the language switch. */
export function alternates(path: string): Record<Locale, string> {
  return { en: localizePath(path, 'en'), zh: localizePath(path, 'zh') };
}

/** URL of a track hub page. */
export function trackUrl(track: string, locale: Locale): string {
  return localizePath(`/${track}/`, locale);
}

/** URL of a topic page. */
export function topicUrl(track: string, slug: string, locale: Locale): string {
  return localizePath(`/${track}/${slug}/`, locale);
}
