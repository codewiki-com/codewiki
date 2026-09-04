import { describe, expect, it } from 'vitest';
import { decodeCode, decodeState, encodeState } from '@/lib/lz';

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

  it('can read links that compressed only the source text', async () => {
    const { default: LZString } = await import('lz-string');
    expect(decodeCode(LZString.compressToEncodedURIComponent('SELECT 1;'))).toBe('SELECT 1;');
  });
});
