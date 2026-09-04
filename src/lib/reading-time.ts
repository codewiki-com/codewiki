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
