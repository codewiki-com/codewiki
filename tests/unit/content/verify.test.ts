import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { verifyTopic, verifySidecarPath, type VerifySidecar } from '../../../scripts/content/check';
import {
  normaliseOutput,
  runnableBlocks,
  verifyOutputs,
  type ProcessRunner,
} from '../../../scripts/content/lib/code-check';

/**
 * The checker's output half — docs/design/verification-panel.md. The process runner is injected
 * everywhere below, so these tests never execute a reader's code and never depend on which
 * interpreters happen to be installed on the machine running them.
 */

const FRONTMATTER = `---
title: Closures
verified: { version: 'Python 3.14', date: 2026-09-04 }
status: reviewed
---
`;

const BODY = `Prose above.

\`\`\`python run title="label_factory.py"
print("one")
\`\`\`

\`\`\`text
one
\`\`\`

Prose between.

\`\`\`python run title="drifted.py"
print("two")
\`\`\`

\`\`\`text
expected two
\`\`\`

\`\`\`python run title="undocumented.py"
print("three")
\`\`\`

Not an output block, so nothing to compare.

\`\`\`go run title="server.go"
fmt.Println("four")
\`\`\`

\`\`\`text
four
\`\`\`

\`\`\`python title="not_runnable.py"
print("never")
\`\`\`
`;

/** A runner that answers `--version` and then prints whatever the script's `print` says. */
const fakeRunner =
  (outputs: Record<string, string>): ProcessRunner =>
  async (argv, _stdin, cwd) => {
    if (argv[1] === '--version') {
      return { status: 0, stdout: 'Python 3.14.3\n', stderr: '', timedOut: false, missing: false };
    }
    const source = await readFile(argv[1], 'utf8');
    const printed = /print\("([^"]*)"\)/.exec(source)?.[1] ?? '';
    expect(cwd).toBe(path.dirname(argv[1]));
    return {
      status: 0,
      stdout: `${outputs[printed] ?? printed}\n`,
      stderr: '',
      timedOut: false,
      missing: false,
    };
  };

describe('runnableBlocks', () => {
  it('pairs each run fence with the output printed under it', () => {
    const blocks = runnableBlocks(BODY);
    expect(blocks.map((block) => [block.id, block.title, block.expected])).toEqual([
      ['b1', 'label_factory.py', 'one'],
      ['b2', 'drifted.py', 'expected two'],
      ['b3', 'undocumented.py', undefined],
      ['b4', 'server.go', 'four'],
    ]);
  });

  it('ignores a fence with no run flag, and honours nocheck', () => {
    expect(runnableBlocks('```python title="x"\nprint(1)\n```\n')).toEqual([]);
    const [block] = runnableBlocks('```python run nocheck\nprint(1)\n```\n\n```text\n1\n```\n');
    expect(block.nocheck).toBe(true);
  });

  it('does not pair an output fence separated by prose', () => {
    const [block] = runnableBlocks('```python run\nprint(1)\n```\n\nA sentence.\n\n```text\n1\n```\n');
    expect(block.expected).toBeUndefined();
  });
});

describe('normaliseOutput', () => {
  it('ignores line endings, trailing spaces and surrounding blank lines', () => {
    expect(normaliseOutput('\r\n a \t\r\nb  \n\n')).toBe(' a\nb');
  });
});

describe('verifyOutputs', () => {
  it('counts only the blocks it could compare, and says why it skipped the rest', async () => {
    const report = await verifyOutputs(BODY, { exec: fakeRunner({ two: 'something else' }) });

    expect(report.runtime).toEqual({ name: 'Python', version: '3.14.3', tool: 'python3.14' });
    expect(report.blocks).toEqual({ runnable: 4, executed: 2, matched: 1, skipped: 2 });
    expect(report.results.map((result) => [result.id, result.status, result.reason])).toEqual([
      ['b1', 'matched', undefined],
      ['b2', 'mismatched', 'output differs'],
      ['b3', 'skipped', 'no-recorded-output'],
      ['b4', 'skipped', 'no-host-runtime'],
    ]);
  });

  it('reports a run that failed on a missing package as skipped, not as drift', async () => {
    const exec: ProcessRunner = async (argv) =>
      argv[1] === '--version'
        ? { status: 0, stdout: 'Python 3.14.3', stderr: '', timedOut: false, missing: false }
        : {
            status: 1,
            stdout: '',
            stderr: "ModuleNotFoundError: No module named 'numpy'",
            timedOut: false,
            missing: false,
          };
    const report = await verifyOutputs('```python run\nimport numpy\n```\n\n```text\nok\n```\n', { exec });
    expect(report.blocks).toEqual({ runnable: 1, executed: 0, matched: 0, skipped: 1 });
    expect(report.results[0]).toMatchObject({ status: 'skipped', reason: 'missing-dependency' });
  });

  it('names a block-level runtime only when it differs from the topic-level one', async () => {
    const exec: ProcessRunner = async (argv) => {
      if (argv[1] === '--version') {
        const version = argv[0] === 'node' ? 'v24.14.0' : 'Python 3.14.3';
        return { status: 0, stdout: version, stderr: '', timedOut: false, missing: false };
      }
      return { status: 0, stdout: 'ok\n', stderr: '', timedOut: false, missing: false };
    };
    const source = ['python', 'python', 'js']
      .map((lang) => `\`\`\`${lang} run\nprint\n\`\`\`\n\n\`\`\`text\nok\n\`\`\`\n`)
      .join('\n');
    const report = await verifyOutputs(source, { exec });

    expect(report.runtime?.tool).toBe('python3.14');
    expect(report.results.map((result) => result.runtime?.tool)).toEqual([undefined, undefined, 'node']);
  });
});

describe('verifyTopic', () => {
  it('writes the sidecar the build reads, naming the target and the checker revision', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'codewiki-verify-'));
    const verifyRoot = await mkdtemp(path.join(tmpdir(), 'codewiki-sidecar-'));
    await mkdir(path.join(root, 'python'), { recursive: true });
    await writeFile(path.join(root, 'python/closures.en.mdx'), `${FRONTMATTER}${BODY}`, 'utf8');

    const written = await verifyTopic('python/closures', {
      root,
      verifyRoot,
      exec: fakeRunner({ two: 'expected two' }),
      now: new Date('2026-09-05T02:11:09.789Z'),
      checker: 'deadbee',
    });

    const file = verifySidecarPath('python/closures', verifyRoot);
    const onDisk = JSON.parse(await readFile(file, 'utf8')) as VerifySidecar;
    expect(onDisk).toEqual(written);
    expect(onDisk).toMatchObject({
      topic: 'python/closures',
      checkedAt: '2026-09-05T02:11:09Z',
      target: 'Python 3.14',
      runtime: { name: 'Python', version: '3.14.3', tool: 'python3.14' },
      blocks: { runnable: 4, executed: 2, matched: 2, skipped: 2 },
      checker: 'content:check@deadbee',
    });
    // Both languages share the sidecar, so it is keyed by the topic and not by the file.
    expect(file.endsWith(path.join('python', 'closures.json'))).toBe(true);
  });
});
