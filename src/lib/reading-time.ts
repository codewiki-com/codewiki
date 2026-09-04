// Reading-time estimate for a topic body. Deliberately frontmatter-independent: it reads the raw
// MDX source, so a card can state a duration before the topic pipeline (Task 11) computes a
// precise one. Pure, so it is unit-tested directly.
import type { Locale } from '@/lib/urls';

/** Words per minute for English prose, characters per minute for Chinese. Spec §5.3. */
const WORDS_PER_MINUTE = 220;
const CHARS_PER_MINUTE = 380;

/** Minutes to read `body`, never less than one. Chinese counts characters, English words. */
export function estimateMinutes(body: string, locale: Locale): number {
  const text = body.trim();
  if (!text) return 1;
  const minutes =
    locale === 'zh'
      ? text.replace(/\s+/g, '').length / CHARS_PER_MINUTE
      : text.split(/\s+/).length / WORDS_PER_MINUTE;
  return Math.max(1, Math.round(minutes));
}

/**
 * Words a code line is worth. Code is read line by line rather than scanned, so
 * `remark-depth` bills each fence line at this many words. Spec §5.3.
 */
export const WORDS_PER_CODE_LINE = 4;

/**
 * Minutes for an already-counted body, rounded up and never below one.
 * `words` is whatever unit the locale reads in: English words, Chinese characters.
 */
export function computeReadingTime(words: number, locale: Locale): number {
  const perMinute = locale === 'zh' ? CHARS_PER_MINUTE : WORDS_PER_MINUTE;
  return Math.max(1, Math.ceil(words / perMinute));
}

/**
 * Counts one string in the unit its locale reads in: whitespace-separated words
 * for English, non-whitespace characters for Chinese.
 */
export function countWords(text: string, locale: Locale): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return locale === 'zh' ? trimmed.replace(/\s+/g, '').length : trimmed.split(/\s+/).length;
}
