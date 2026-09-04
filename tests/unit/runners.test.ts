import { describe, it, expect } from 'vitest';
import {
  isTimeout,
  normalizeLang,
  parseRunEvent,
  RunTimeoutError,
  runId,
  timeoutRace,
} from '@/lib/runners/protocol';

describe('normalizeLang', () => {
  it('maps every fence id the content uses onto a runner', () => {
    expect(normalizeLang('js')).toBe('js');
    expect(normalizeLang('javascript')).toBe('js');
    expect(normalizeLang('ts')).toBe('ts');
    expect(normalizeLang('typescript')).toBe('ts');
    expect(normalizeLang('py')).toBe('python');
    expect(normalizeLang('python')).toBe('python');
  });

  it('ignores case and surrounding space, because the id comes from fence meta', () => {
    expect(normalizeLang('  Python ')).toBe('python');
    expect(normalizeLang('JS')).toBe('js');
  });

  it('returns null for anything P1 cannot run', () => {
    expect(normalizeLang('sql')).toBeNull();
    expect(normalizeLang('text')).toBeNull();
    expect(normalizeLang('')).toBeNull();
    expect(normalizeLang(undefined)).toBeNull();
    expect(normalizeLang(null)).toBeNull();
  });
});

describe('parseRunEvent', () => {
  it('accepts a well-formed event and keeps only the fields the protocol declares', () => {
    expect(parseRunEvent({ id: 'a', kind: 'stdout', text: 'hi', extra: 1 })).toEqual({
      id: 'a',
      kind: 'stdout',
      text: 'hi',
    });
    expect(parseRunEvent({ id: 'a', kind: 'done', ms: 41 })).toEqual({ id: 'a', kind: 'done', ms: 41 });
  });

  it('rejects anything that is not an event object', () => {
    expect(parseRunEvent(null)).toBeNull();
    expect(parseRunEvent('done')).toBeNull();
    expect(parseRunEvent(42)).toBeNull();
    expect(parseRunEvent([])).toBeNull();
  });

  it('rejects an event without a usable id, which is what an unrelated postMessage looks like', () => {
    expect(parseRunEvent({ kind: 'stdout', text: 'hi' })).toBeNull();
    expect(parseRunEvent({ id: '', kind: 'stdout' })).toBeNull();
    expect(parseRunEvent({ id: 7, kind: 'stdout' })).toBeNull();
  });

  it('rejects an event whose id is not the run being awaited', () => {
    expect(parseRunEvent({ id: 'other', kind: 'stdout', text: 'hi' }, 'mine')).toBeNull();
    expect(parseRunEvent({ id: 'mine', kind: 'stdout', text: 'hi' }, 'mine')).toEqual({
      id: 'mine',
      kind: 'stdout',
      text: 'hi',
    });
  });

  it('rejects an unknown kind and drops fields of the wrong type', () => {
    expect(parseRunEvent({ id: 'a', kind: 'exit' })).toBeNull();
    expect(parseRunEvent({ id: 'a', kind: 'stdout', text: 12 })).toEqual({ id: 'a', kind: 'stdout' });
    expect(parseRunEvent({ id: 'a', kind: 'done', ms: 'fast' })).toEqual({ id: 'a', kind: 'done' });
    expect(parseRunEvent({ id: 'a', kind: 'done', ms: Number.NaN })).toEqual({ id: 'a', kind: 'done' });
  });
});

describe('timeoutRace', () => {
  it('passes a value through when the promise settles first', async () => {
    await expect(timeoutRace(Promise.resolve('ok'), 1000)).resolves.toBe('ok');
  });

  it('passes a rejection through unchanged', async () => {
    await expect(timeoutRace(Promise.reject(new Error('boom')), 1000)).rejects.toThrow('boom');
  });

  it('rejects with a timeout once the budget is spent', async () => {
    const never = new Promise(() => {});
    await expect(timeoutRace(never, 5)).rejects.toBeInstanceOf(RunTimeoutError);
  });

  it('names the budget on the error, so the island can say what happened', async () => {
    const never = new Promise(() => {});
    await expect(timeoutRace(never, 5)).rejects.toMatchObject({ ms: 5, name: 'RunTimeoutError' });
  });

  it('does not race at all when there is no budget', async () => {
    await expect(timeoutRace(Promise.resolve(1), 0)).resolves.toBe(1);
    await expect(timeoutRace(Promise.resolve(1), Number.POSITIVE_INFINITY)).resolves.toBe(1);
  });
});

describe('isTimeout', () => {
  it('recognises the timeout error and nothing else', () => {
    expect(isTimeout(new RunTimeoutError(10))).toBe(true);
    expect(isTimeout(new Error('nope'))).toBe(false);
    expect(isTimeout('timeout')).toBe(false);
    expect(isTimeout(null)).toBe(false);
  });
});

describe('runId', () => {
  it('is unique per call, because the id is what authenticates a sandbox message', () => {
    const ids = new Set(Array.from({ length: 50 }, () => runId()));
    expect(ids.size).toBe(50);
    expect([...ids].every((id) => id.length > 0)).toBe(true);
  });
});
