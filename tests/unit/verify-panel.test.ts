import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  blockLabels,
  browserLine,
  readVerification,
  topicIdFromPath,
  verifyState,
  type BrowserRunners,
  type Verification,
} from '@/lib/verify';

/**
 * The reading end of the verification sidecars — docs/design/verification-panel.md. Everything
 * the panel says is derived here, so these are the tests that keep the page from claiming more
 * than the checker observed.
 */

const RUNNERS: BrowserRunners = {
  pyodide: { version: '314.0.6', python: '3.14.2' },
  esbuild: '0.28.2',
  sql: '1.14.2',
};

function sidecar(patch: Partial<Verification> = {}): Verification {
  return {
    topic: 'python/closures',
    checkedAt: '2026-09-05T02:11:09Z',
    target: 'Python 3.14',
    runtime: { name: 'Python', version: '3.14.3', tool: 'python3.14' },
    blocks: { runnable: 4, executed: 4, matched: 4, skipped: 0 },
    results: [
      { id: 'b1', title: 'label_factory.py', lang: 'python', status: 'matched' },
      { id: 'b2', title: 'attempt_counter.py', lang: 'python', status: 'matched' },
      { id: 'b3', title: 'shared_quota.py', lang: 'python', status: 'matched' },
      { id: 'b4', title: 'loop_handlers.py', lang: 'python', status: 'matched' },
    ],
    checker: 'content:check@deadbee',
    ...patch,
  };
}

describe('verifyState', () => {
  it('is verified only when every compared output came out the same', () => {
    expect(verifyState(sidecar())).toBe('verified');
  });

  it('is partial when one output differs', () => {
    expect(verifyState(sidecar({ blocks: { runnable: 4, executed: 4, matched: 3, skipped: 0 } }))).toBe(
      'partial',
    );
  });

  it('is not-run with no sidecar, no runnable blocks, or none this machine could run', () => {
    expect(verifyState(null)).toBe('notRun');
    expect(verifyState(sidecar({ blocks: { runnable: 0, executed: 0, matched: 0, skipped: 0 } }))).toBe(
      'notRun',
    );
    // Four Go examples: recorded on the target, executed by nothing here.
    expect(verifyState(sidecar({ blocks: { runnable: 4, executed: 0, matched: 0, skipped: 4 } }))).toBe(
      'notRun',
    );
  });
});

describe('browserLine', () => {
  it('omits the caveat when Pyodide ships the same Python minor as the recording', () => {
    expect(browserLine(sidecar(), 'en', RUNNERS)).toEqual({
      runner: 'Pyodide 314.0.6 (Python 3.14.2)',
      same: true,
    });
  });

  it('owes a caveat when Pyodide is a different Python minor', () => {
    const older: BrowserRunners = { ...RUNNERS, pyodide: { version: '0.28.0', python: '3.13.4' } };
    expect(browserLine(sidecar(), 'en', older)).toEqual({
      runner: 'Pyodide 0.28.0 (Python 3.13.4)',
      same: false,
    });
  });

  it('owes a caveat for JavaScript, which the tab runs on its own engine rather than on Node', () => {
    const js = sidecar({
      runtime: { name: 'Node', version: '24.14.0', tool: 'node' },
      results: [{ id: 'b1', title: 'counters.js', lang: 'javascript', status: 'matched' }],
    });
    expect(browserLine(js, 'en', RUNNERS)).toEqual({
      runner: "your browser's JavaScript engine",
      same: false,
    });
  });

  it('names esbuild for TypeScript and sql.js for SQL', () => {
    const ts = sidecar({
      runtime: { name: 'Node', version: '24.14.0', tool: 'node' },
      results: [{ id: 'b1', title: 'types.ts', lang: 'typescript', status: 'matched' }],
    });
    expect(browserLine(ts, 'en', RUNNERS)?.runner).toBe('esbuild 0.28.2');

    const sql = sidecar({
      runtime: null,
      results: [{ id: 'b1', title: 'join.sql', lang: 'sql', status: 'skipped', reason: 'no-host-runtime' }],
    });
    expect(browserLine(sql, 'en', RUNNERS)).toEqual({ runner: 'sql.js 1.14.2', same: true });
  });

  it('says nothing when the page has no browser-runnable example', () => {
    expect(browserLine(sidecar({ results: [] }), 'en', RUNNERS)).toBeNull();
    expect(browserLine(null, 'en', RUNNERS)).toBeNull();
  });
});

describe('blockLabels', () => {
  it('names the interpreter that recorded each block', () => {
    const labels = blockLabels(sidecar(), 'en', RUNNERS);
    expect(labels.get('b1')).toEqual({ recorded: 'recorded on Python 3.14.3' });
  });

  it('falls back to the pinned target for a block nothing here could run', () => {
    const go = sidecar({
      target: 'Go 1.27',
      runtime: null,
      results: [{ id: 'b1', title: 'server.go', lang: 'go', status: 'skipped', reason: 'no-host-runtime' }],
    });
    expect(blockLabels(go, 'en', RUNNERS).get('b1')).toEqual({ recorded: 'recorded on Go 1.27' });
  });

  it('adds "runs here on …" only when the tab differs from the recording', () => {
    const js = sidecar({
      runtime: { name: 'Node', version: '24.14.0', tool: 'node' },
      results: [{ id: 'b1', title: 'counters.js', lang: 'javascript', status: 'matched' }],
    });
    expect(blockLabels(js, 'en', RUNNERS).get('b1')).toEqual({
      recorded: 'recorded on Node 24.14.0',
      here: "runs here on your browser's JavaScript engine",
    });
    expect(blockLabels(sidecar(), 'en', RUNNERS).get('b1')?.here).toBeUndefined();
  });

  it('translates', () => {
    expect(blockLabels(sidecar(), 'zh', RUNNERS).get('b1')?.recorded).toBe('记录于Python 3.14.3');
  });
});

describe('readVerification', () => {
  it('reads a sidecar and remembers that a missing one is missing', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'codewiki-verify-read-'));
    await mkdir(path.join(root, 'python'), { recursive: true });
    await writeFile(path.join(root, 'python/closures.json'), JSON.stringify(sidecar()), 'utf8');

    expect(readVerification('python/closures', root)?.runtime?.version).toBe('3.14.3');
    expect(readVerification('python/nothing-here', root)).toBeNull();
  });

  it('derives the topic id from either language of a source path', () => {
    expect(topicIdFromPath('/repo/src/content/topics/python/closures.en.mdx')).toBe('python/closures');
    expect(topicIdFromPath('/repo/src/content/topics/python/closures.zh.mdx')).toBe('python/closures');
    expect(topicIdFromPath('/repo/src/content/glossary/closure.yaml')).toBeNull();
    expect(topicIdFromPath(undefined)).toBeNull();
  });
});

describe('the corpus', () => {
  it('gives every reviewed topic a sidecar, which is what the build enforces', async () => {
    const { readdir, readFile } = await import('node:fs/promises');
    const topics = path.join(process.cwd(), 'src/content/topics');
    let checked = 0;
    for (const track of await readdir(topics, { withFileTypes: true })) {
      if (!track.isDirectory()) continue;
      for (const file of await readdir(path.join(topics, track.name))) {
        if (!file.endsWith('.en.mdx')) continue;
        const source = await readFile(path.join(topics, track.name, file), 'utf8');
        if (!/^status: reviewed$/m.test(source)) continue;
        const id = `${track.name}/${file.replace('.en.mdx', '')}`;
        expect(readVerification(id), id).not.toBeNull();
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(250);
  });
});
