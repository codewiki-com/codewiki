/**
 * The one place the polish runner writes the pipeline journal.
 *
 * `scripts/content/polish.sh` runs several topics at once and must never edit
 * `reports/polish/state.json` itself: hand-rolled JSON in bash is how a journal ends up
 * truncated. This CLI does the read-modify-write instead, one topic at a time, under a
 * lock directory so two concurrent jobs cannot overwrite each other's progress — the
 * write itself is atomic, but a lost update would silently re-run finished work.
 *
 * `tsx scripts/content/mark.ts start|ok|fail {track}/{slug} {step} [error]`
 *
 * - `start` opens the topic's entry and stamps `startedAt` without claiming any step.
 * - `ok` records `step` as completed and clears the last error.
 * - `fail` counts an attempt and records the reason; the recorded step stays put.
 */
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoPath } from './lib/paths';
import {
  loadState,
  markStep,
  saveState,
  STATE_PATH,
  STEPS,
  type PipelineState,
  type Step,
} from './lib/state';

/** How long to wait for the journal lock before giving up. */
const LOCK_TIMEOUT_MS = 120_000;

/** A lock older than this belongs to a job that died; it is taken over. */
const LOCK_STALE_MS = 300_000;

/** Poll interval while the lock is held by another process. */
const LOCK_POLL_MS = 50;

/** The longest failure reason kept in the journal; Codex logs hold the full story. */
const MAX_ERROR_LENGTH = 300;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** The file inside the lock directory naming the process that holds it. */
const OWNER_FILE = 'owner';

/**
 * Run `fn` with the journal locked.
 *
 * `mkdir` is the portable atomic test-and-set: it succeeds for exactly one process and
 * fails for the rest, on every filesystem the pipeline runs on.
 *
 * The holder writes its pid into the lock and, on release, removes the lock only while
 * that pid is still the one recorded. Without the check a process whose lock was taken
 * over as stale would delete its successor's lock on the way out and let two writers into
 * the journal at once.
 */
export async function withLock<T>(lockDir: string, fn: () => Promise<T>): Promise<T> {
  const owner = String(process.pid);
  const ownerFile = path.join(lockDir, OWNER_FILE);
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  for (;;) {
    try {
      await mkdir(lockDir, { recursive: false });
    } catch {
      const age = await lockAge(lockDir);
      if (age !== null && age > LOCK_STALE_MS) {
        await rm(lockDir, { recursive: true, force: true });
        continue;
      }
      if (Date.now() > deadline) throw new Error(`journal lock held too long: ${lockDir}`);
      await sleep(LOCK_POLL_MS);
      continue;
    }
    try {
      await writeFile(ownerFile, `${owner}\n`, 'utf8');
    } catch (error) {
      // An unclaimable lock would block every other writer until it goes stale.
      await rm(lockDir, { recursive: true, force: true });
      throw error;
    }
    break;
  }
  try {
    return await fn();
  } finally {
    if (await ownsLock(ownerFile, owner)) {
      await rm(lockDir, { recursive: true, force: true });
    }
  }
}

/** Whether the lock is still held by `owner`; an unreadable owner file counts as lost. */
async function ownsLock(ownerFile: string, owner: string): Promise<boolean> {
  try {
    return (await readFile(ownerFile, 'utf8')).trim() === owner;
  } catch {
    return false;
  }
}

/** Milliseconds since the lock was taken, or `null` if it is gone again. */
async function lockAge(lockDir: string): Promise<number | null> {
  try {
    return Date.now() - (await stat(lockDir)).mtimeMs;
  } catch {
    return null;
  }
}

export type Action = 'start' | 'ok' | 'fail';

/**
 * Apply one action to the journal, returning the updated state.
 *
 * `start` is deliberately not {@link markStep}: opening a topic is neither a success nor
 * a failed attempt, it only records that work began.
 */
export function applyMark(
  state: PipelineState,
  action: Action,
  id: string,
  step: Step,
  error?: string,
): PipelineState {
  if (action === 'start') {
    const now = new Date().toISOString();
    const previous = state.topics[id];
    const entry = previous
      ? { ...previous, startedAt: previous.startedAt ?? now }
      : { step: STEPS[0], attempts: 0, startedAt: now };
    return { version: 1, topics: { ...state.topics, [id]: entry } };
  }
  return markStep(state, id, step, action === 'ok', error?.slice(0, MAX_ERROR_LENGTH));
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Args {
  action: Action;
  id: string;
  step: Step;
  error?: string;
}

/** Parse `start|ok|fail {track}/{slug} {step} [error …]`. */
export function parseArgs(argv: string[]): Args {
  const [action, id, step, ...rest] = argv;
  if (action !== 'start' && action !== 'ok' && action !== 'fail') {
    throw new Error('usage: mark start|ok|fail {track}/{slug} {step} [error]');
  }
  if (!id || !id.includes('/')) throw new Error(`not a {track}/{slug} topic id: ${id ?? ''}`);
  if (!step || !(STEPS as readonly string[]).includes(step)) {
    throw new Error(`unknown step: ${step ?? ''}`);
  }
  const error = rest.join(' ').trim();
  return { action, id, step: step as Step, error: error || undefined };
}

/** CLI: apply one action to the journal under the lock. */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const file = repoPath(STATE_PATH);
  // The lock lives beside the journal, so its directory has to exist before the first run.
  await mkdir(path.dirname(file), { recursive: true });
  await withLock(`${file}.lock`, async () => {
    const state = await loadState(file);
    await saveState(applyMark(state, args.action, args.id, args.step, args.error), file);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
