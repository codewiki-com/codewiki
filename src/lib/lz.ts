import LZString from 'lz-string';
import { normalizeLang, type RunLang } from '@/lib/runners/protocol';

export interface PlaygroundState {
  lang: RunLang;
  code: string;
  tests?: string;
}

/** Compresses playground state into characters that are safe in one query value. */
export function encodeState(state: PlaygroundState): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(state));
}

/**
 * Restores state from a shared link. Corrupt, partial and wrongly shaped values all become null so
 * opening a hand-edited URL can never stop the playground from rendering.
 */
export function decodeState(value: string): PlaygroundState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(value);
    if (!json) return null;

    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;

    const candidate = parsed as Record<string, unknown>;
    const lang = typeof candidate.lang === 'string' ? normalizeLang(candidate.lang) : null;
    if (!lang || typeof candidate.code !== 'string') return null;
    if (candidate.tests !== undefined && typeof candidate.tests !== 'string') return null;

    return {
      lang,
      code: candidate.code,
      ...(typeof candidate.tests === 'string' && candidate.tests !== '' ? { tests: candidate.tests } : {}),
    };
  } catch {
    return null;
  }
}

/** Compatibility for early links that compressed only the source while carrying `lang` beside it. */
export function decodeCode(value: string): string | null {
  try {
    return LZString.decompressFromEncodedURIComponent(value) || null;
  } catch {
    return null;
  }
}
