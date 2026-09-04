import { mkdtemp, readFile, stat, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyMark, parseArgs, withLock } from '../../../scripts/content/mark';
import type { PipelineState } from '../../../scripts/content/lib/state';

/** A throwaway directory to hold one journal lock. */
async function lockPath(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'mark-lock-'));
  return path.join(root, 'state.json.lock');
}

/** Whether the lock directory is there. */
async function exists(file: string): Promise<boolean> {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

describe('withLock', () => {
  it('holds the lock for the duration of the call and releases it after', async () => {
    const lock = await lockPath();
    let heldDuring = false;
    const result = await withLock(lock, async () => {
      heldDuring = await exists(lock);
      return 'done';
    });
    expect(result).toBe('done');
    expect(heldDuring).toBe(true);
    expect(await exists(lock)).toBe(false);
  });

  it('writes the holder pid into the lock', async () => {
    const lock = await lockPath();
    let owner = '';
    await withLock(lock, async () => {
      owner = (await readFile(path.join(lock, 'owner'), 'utf8')).trim();
    });
    expect(owner).toBe(String(process.pid));
  });

  it('releases the lock even when the call throws', async () => {
    const lock = await lockPath();
    await expect(
      withLock(lock, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(await exists(lock)).toBe(false);
  });

  it('leaves a lock that another process has taken over alone', async () => {
    const lock = await lockPath();
    await withLock(lock, async () => {
      // What a stale takeover looks like from inside: the successor owns the lock now,
      // and removing it on the way out would let two writers into the journal at once.
      await writeFile(path.join(lock, 'owner'), '999999\n', 'utf8');
    });
    expect(await exists(lock)).toBe(true);
  });

  it('takes over a lock left behind by a job that died', async () => {
    const lock = await lockPath();
    // Claim the lock and abandon it, backdated well past the staleness window.
    await withLock(lock, async () => {
      await writeFile(path.join(lock, 'owner'), '999999\n', 'utf8');
    });
    const longAgo = new Date(Date.now() - 60 * 60 * 1000);
    await utimes(lock, longAgo, longAgo);
    let ownedIt = false;
    await withLock(lock, async () => {
      ownedIt = (await readFile(path.join(lock, 'owner'), 'utf8')).trim() === String(process.pid);
    });
    expect(ownedIt).toBe(true);
    expect(await exists(lock)).toBe(false);
  });
});

describe('applyMark', () => {
  const empty: PipelineState = { version: 1, topics: {} };

  it('opens a topic on start without claiming a step', () => {
    const state = applyMark(empty, 'start', 'python/closures', 'polished');
    const entry = state.topics['python/closures'];
    expect(entry.attempts).toBe(0);
    expect(entry.startedAt).toBeTruthy();
  });

  it('records a completed step on ok and a reason on fail', () => {
    const started = applyMark(empty, 'start', 'python/closures', 'polished');
    const ok = applyMark(started, 'ok', 'python/closures', 'polished');
    expect(ok.topics['python/closures'].step).toBe('polished');
    const failed = applyMark(ok, 'fail', 'python/closures', 'aligned', 'codex exited 127');
    expect(failed.topics['python/closures'].attempts).toBe(1);
    expect(failed.topics['python/closures'].lastError).toBe('codex exited 127');
  });

  it('truncates a runaway failure reason', () => {
    const failed = applyMark(empty, 'fail', 'python/closures', 'polished', 'x'.repeat(1000));
    expect(failed.topics['python/closures'].lastError?.length).toBe(300);
  });
});

describe('parseArgs', () => {
  it('reads an action, a topic id, a step and the rest as the reason', () => {
    expect(parseArgs(['fail', 'python/closures', 'polished', 'codex', 'exited', '127'])).toEqual({
      action: 'fail',
      id: 'python/closures',
      step: 'polished',
      error: 'codex exited 127',
    });
  });

  it('rejects an unknown action, a bare slug and an unknown step', () => {
    expect(() => parseArgs(['poke', 'python/closures', 'polished'])).toThrow(/usage/);
    expect(() => parseArgs(['ok', 'closures', 'polished'])).toThrow(/topic id/);
    expect(() => parseArgs(['ok', 'python/closures', 'shipped-ish'])).toThrow(/unknown step/);
  });
});
