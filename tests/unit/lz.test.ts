import { describe, expect, it } from 'vitest';
import {
  decodeCode,
  decodeState,
  encodeState,
  MAX_CODE_LENGTH,
  MAX_ENCODED_STATE_LENGTH,
  MAX_TESTS_LENGTH,
} from '@/lib/lz';

describe('playground URL state', () => {
  it('round-trips CJK and emoji through a query-safe value', () => {
    const state = { lang: 'python' as const, code: 'print("你好 👋")', tests: 'assert True' };
    const encoded = encodeState(state);
    expect(encoded).not.toContain(' ');
    expect(decodeState(encoded)).toEqual(state);
  });

  it('turns corrupt or wrongly shaped input into null', () => {
    expect(decodeState('%%%')).toBeNull();
    expect(decodeState('')).toBeNull();
  });

  it('rejects an oversized encoded value before decompression', () => {
    expect(decodeState('a'.repeat(MAX_ENCODED_STATE_LENGTH + 1))).toBeNull();
    expect(decodeCode('a'.repeat(MAX_ENCODED_STATE_LENGTH + 1))).toBeNull();
  });

  it('rejects high-compression payloads whose decoded code or tests exceed their limits', () => {
    const code = encodeState({ lang: 'js', code: 'x'.repeat(MAX_CODE_LENGTH + 1) });
    const tests = encodeState({
      lang: 'js',
      code: 'const answer = 42;',
      tests: 'x'.repeat(MAX_TESTS_LENGTH + 1),
    });

    expect(code.length).toBeLessThan(MAX_ENCODED_STATE_LENGTH);
    expect(tests.length).toBeLessThan(MAX_ENCODED_STATE_LENGTH);
    expect(decodeState(code)).toBeNull();
    expect(decodeState(tests)).toBeNull();
    expect(decodeCode(code)).toBeNull();
    expect(decodeCode(tests)).toBeNull();
  });

  it('can read links that compressed only the source text', async () => {
    const { default: LZString } = await import('lz-string');
    expect(decodeCode(LZString.compressToEncodedURIComponent('SELECT 1;'))).toBe('SELECT 1;');
  });
});
