import { t } from '@/i18n';
import type { Locale } from '@/lib/urls';

/** What a too-long deep link tells the reader, before and after it is followed. */
export interface LongPromptLabels {
  /** Shown in advance wherever a link cannot carry the whole prompt. */
  hint: string;
  /** After a click, when the full prompt reached the clipboard. */
  copied: string;
  /** After a click, when it did not. */
  failed: string;
}

export function longPromptLabels(locale: Locale): LongPromptLabels {
  return {
    hint: t(locale, 'ai.longHint'),
    copied: t(locale, 'ai.longCopied'),
    failed: t(locale, 'ai.longCopyFailed'),
  };
}
