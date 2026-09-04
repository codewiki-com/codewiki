import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  emptyState,
  loadState,
  markStep,
  nextTopics,
  saveState,
  stepIndex,
  type PipelineState,
  type Step,
  type TierLists,
} from '../../../scripts/content/lib/state';

/** A tier listing shaped like the `tiers` block of `content/tiers.yaml`. */
const TIERS: TierLists = {
  '1': ['python/closures', 'javascript/event-loop'],
  '2': ['python/decorators'],
  '3': ['go/channels'],
};

const INTERLEAVED_TIERS: TierLists = {
  '1': ['a/a1', 'a/a2', 'a/a3', 'b/b1', 'b/b2', 'c/c1'],
  '2': [],
  '3': [],
};

/** A state carrying one entry per id, built from terse tuples. */
function state(...entries: [id: string, step: Step, attempts?: number][]): PipelineState {
  const topics: PipelineState['topics'] = {};
  for (const [id, step, attempts = 0] of entries) {
    topics[id] = {
      step,
      attempts,
      startedAt: '2026-09-01T00:00:00.000Z',
      finishedAt: '2026-09-01T00:00:00.000Z',
    };
  }
  return { version: 1, topics };
}

describe('stepIndex', () => {
  it('orders the pipeline steps', () => {
    expect(stepIndex('imported')).toBe(0);
    expect(stepIndex('linted')).toBeGreaterThan(stepIndex('imported'));
    expect(stepIndex('polished')).toBeGreaterThan(stepIndex('linted'));
    expect(stepIndex('aligned')).toBeGreaterThan(stepIndex('polished'));
    expect(stepIndex('extracted')).toBeGreaterThan(stepIndex('aligned'));
    expect(stepIndex('committed')).toBeGreaterThan(stepIndex('extracted'));
  });
});

describe('markStep', () => {
  it('records the step, a finish timestamp and a start timestamp on success', () => {
    const next = markStep(emptyState(), 'python/closures', 'polished', true);
    const entry = next.topics['python/closures'];
    expect(entry.step).toBe('polished');
    expect(entry.attempts).toBe(0);
    expect(entry.lastError).toBeUndefined();
    expect(entry.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(entry.finishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('counts attempts, keeps the previous step and records the error on failure', () => {
    let next = markStep(state(['python/closures', 'linted']), 'python/closures', 'polished', false, 'boom');
    expect(next.topics['python/closures'].step).toBe('linted');
    expect(next.topics['python/closures'].attempts).toBe(1);
    expect(next.topics['python/closures'].lastError).toBe('boom');

    next = markStep(next, 'python/closures', 'polished', false, 'boom again');
    expect(next.topics['python/closures'].attempts).toBe(2);
    expect(next.topics['python/closures'].lastError).toBe('boom again');
  });

  it('clears the last error when a later attempt succeeds', () => {
    const failed = markStep(emptyState(), 'python/closures', 'polished', false, 'boom');
    const passed = markStep(failed, 'python/closures', 'polished', true);
    expect(passed.topics['python/closures'].lastError).toBeUndefined();
    expect(passed.topics['python/closures'].step).toBe('polished');
    // Attempts count every failure the topic ever had, so the cap survives a retry.
    expect(passed.topics['python/closures'].attempts).toBe(1);
  });

  it('keeps the first start timestamp across attempts', () => {
    const first = markStep(emptyState(), 'python/closures', 'polished', false, 'boom');
    const second = markStep(first, 'python/closures', 'polished', true);
    expect(second.topics['python/closures'].startedAt).toBe(first.topics['python/closures'].startedAt);
  });

  it('leaves the state it was given untouched', () => {
    const before = state(['python/closures', 'linted']);
    const snapshot = JSON.stringify(before);
    markStep(before, 'python/closures', 'polished', true);
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe('nextTopics', () => {
  it('interleaves eligible topics round-robin across tracks', () => {
    expect(nextTopics(INTERLEAVED_TIERS, emptyState(), 10, 'polished')).toEqual([
      'a/a1',
      'b/b1',
      'c/c1',
      'a/a2',
      'b/b2',
      'a/a3',
    ]);
  });

  it('skips finished and thrice-failed topics before interleaving', () => {
    const current = state(['a/a1', 'polished'], ['b/b1', 'linted', 3]);
    expect(nextTopics(INTERLEAVED_TIERS, current, 10, 'polished')).toEqual(['a/a2', 'b/b2', 'c/c1', 'a/a3']);
  });

  it('applies the maximum after interleaving', () => {
    expect(nextTopics(INTERLEAVED_TIERS, emptyState(), 4, 'polished')).toEqual([
      'a/a1',
      'b/b1',
      'c/c1',
      'a/a2',
    ]);
  });

  it('preserves the order of an explicit id list', () => {
    const only = ['c/c1', 'a/a3', 'b/b1'];
    expect(nextTopics(INTERLEAVED_TIERS, emptyState(), 10, 'polished', { only })).toEqual(only);
  });

  it('returns ids in tier order and skips topics already at the target step', () => {
    const current = state(['python/closures', 'polished'], ['javascript/event-loop', 'linted']);
    expect(nextTopics(TIERS, current, 10, 'polished')).toEqual([
      'javascript/event-loop',
      'python/decorators',
      'go/channels',
    ]);
  });

  it('skips topics past the target step as well', () => {
    const current = state(['python/closures', 'committed']);
    expect(nextTopics(TIERS, current, 10, 'polished')).not.toContain('python/closures');
  });

  it('treats a topic that has never finished a step as unstarted', () => {
    const current = markStep(emptyState(), 'python/closures', 'imported', false, 'boom');
    expect(nextTopics(TIERS, current, 10, 'imported')).toContain('python/closures');
  });

  it('skips topics that failed three times', () => {
    const current = state(['python/closures', 'linted', 3], ['javascript/event-loop', 'linted', 2]);
    expect(nextTopics(TIERS, current, 10, 'polished')).toEqual([
      'javascript/event-loop',
      'python/decorators',
      'go/channels',
    ]);
  });

  it('returns at most n ids', () => {
    expect(nextTopics(TIERS, emptyState(), 2, 'polished')).toEqual([
      'python/closures',
      'javascript/event-loop',
    ]);
  });

  it('restricts to one tier', () => {
    expect(nextTopics(TIERS, emptyState(), 10, 'polished', { tier: 2 })).toEqual(['python/decorators']);
  });

  it('restricts to an explicit id list', () => {
    const only = ['go/channels', 'python/closures'];
    expect(nextTopics(TIERS, emptyState(), 10, 'polished', { only })).toEqual(only);
  });
});

describe('saveState and loadState', () => {
  it('round-trips a state through a file, creating the directory', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'codewiki-state-'));
    const file = path.join(dir, 'polish', 'state.json');
    const before = markStep(
      state(['python/closures', 'linted', 1]),
      'javascript/event-loop',
      'polished',
      true,
    );
    await saveState(before, file);
    expect(await loadState(file)).toEqual(before);
  });

  it('returns an empty state when the file does not exist', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'codewiki-state-'));
    expect(await loadState(path.join(dir, 'missing.json'))).toEqual(emptyState());
  });

  it('returns an empty state when the file is not readable as state', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'codewiki-state-'));
    const file = path.join(dir, 'state.json');
    await writeFile(file, 'not json');
    expect(await loadState(file)).toEqual(emptyState());
  });

  it('leaves no temporary file behind', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'codewiki-state-'));
    const file = path.join(dir, 'state.json');
    await saveState(emptyState(), file);
    await saveState(state(['python/closures', 'polished']), file);
    expect(await readdir(dir)).toEqual(['state.json']);
  });
});
