import LZString from 'lz-string';
import { normalizeLang, type RunLang } from '@/lib/runners/protocol';

export interface PlaygroundState {
  lang: RunLang;
  code: string;
  tests?: string;
  seed?: string;
}

export const MAX_ENCODED_STATE_LENGTH = 16_384;
export const MAX_CODE_LENGTH = 100_000;
export const MAX_TESTS_LENGTH = 20_000;

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
    if (value.length === 0 || value.length > MAX_ENCODED_STATE_LENGTH) return null;
    const json = LZString.decompressFromEncodedURIComponent(value);
    if (!json) return null;

    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;

    const candidate = parsed as Record<string, unknown>;
    const lang = typeof candidate.lang === 'string' ? normalizeLang(candidate.lang) : null;
    if (!lang || typeof candidate.code !== 'string') return null;
    if (candidate.code.length > MAX_CODE_LENGTH) return null;
    if (candidate.tests !== undefined && typeof candidate.tests !== 'string') return null;
    if (typeof candidate.tests === 'string' && candidate.tests.length > MAX_TESTS_LENGTH) return null;
    if (candidate.seed !== undefined && typeof candidate.seed !== 'string') return null;
    if (typeof candidate.seed === 'string' && candidate.seed.length > MAX_CODE_LENGTH) return null;

    return {
      lang,
      code: candidate.code,
      ...(typeof candidate.tests === 'string' && candidate.tests !== '' ? { tests: candidate.tests } : {}),
      ...(typeof candidate.seed === 'string' && candidate.seed !== '' ? { seed: candidate.seed } : {}),
    };
  } catch {
    return null;
  }
}

/** Compatibility for early links that compressed only the source while carrying `lang` beside it. */
export function decodeCode(value: string): string | null {
  try {
    if (value.length === 0 || value.length > MAX_ENCODED_STATE_LENGTH) return null;
    const code = LZString.decompressFromEncodedURIComponent(value);
    if (!code || code.length > MAX_CODE_LENGTH) return null;

    // A rejected modern state must not be reinterpreted as legacy source code.
    try {
      const parsed: unknown = JSON.parse(code);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed) &&
        ['lang', 'code', 'tests', 'seed'].some((key) => Object.hasOwn(parsed, key))
      ) {
        return null;
      }
    } catch {
      // Ordinary source is not JSON and remains eligible for the legacy path.
    }
    return code;
  } catch {
    return null;
  }
}
