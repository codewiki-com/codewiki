/**
 * The wire format the three runners share with the island that drives them — spec §5.4.
 *
 * A run is one request in and a stream of events out. The events cross a trust boundary: the
 * JavaScript runner receives them by `postMessage` from a sandboxed iframe that has an opaque
 * origin, so `event.origin` is the string "null" and proves nothing. `parseRunEvent` is therefore
 * the only door into the island's rendering path: it shapes an unknown value into a `RunEvent` or
 * rejects it, and it rejects anything whose `id` is not the run currently being awaited.
 *
 * Everything in this module is pure and DOM-free so it can be unit-tested in Node.
 */

/** The languages P1 can execute. Everything else keeps its Run button hidden. */
export const RUN_LANGS = ['js', 'ts', 'python'] as const;

export type RunLang = (typeof RUN_LANGS)[number];

/** One execution: the code as the reader last edited it, tagged with a per-run id. */
export interface RunRequest {
  id: string;
  lang: RunLang;
  code: string;
}

export type RunEventKind = 'stdout' | 'stderr' | 'done' | 'error';

/**
 * One line of output, or the end of the run. `text` carries the line for `stdout`/`stderr` and
 * the message for `error`; `ms` carries the wall-clock duration on `done`.
 */
export interface RunEvent {
  id: string;
  kind: RunEventKind;
  text?: string;
  ms?: number;
}

export type RunEventHandler = (event: RunEvent) => void;

/** What a runner is busy with, so the Run button can say "Loading Python…" rather than lie. */
export type RunStatus = 'loading-python' | 'compiling' | 'running';

export interface RunOptions {
  /** Wall-clock budget for the run itself; loading Pyodide is not charged against it. */
  timeoutMs?: number;
  onStatus?: (status: RunStatus) => void;
}

/**
 * Fence ids that mean the same runner. The markdown pipeline writes whatever the author typed
 * after the backticks, so `js`, `JS` and `javascript` all have to arrive here.
 */
const ALIASES: Record<string, RunLang> = {
  js: 'js',
  javascript: 'js',
  mjs: 'js',
  node: 'js',
  ts: 'ts',
  typescript: 'ts',
  py: 'python',
  python: 'python',
  python3: 'python',
};

/** The runner a fence id belongs to, or `null` when P1 cannot run that language. */
export function normalizeLang(lang: string | null | undefined): RunLang | null {
  if (typeof lang !== 'string') return null;
  return ALIASES[lang.trim().toLowerCase()] ?? null;
}

const KINDS = new Set<string>(['stdout', 'stderr', 'done', 'error']);

/**
 * Validates a value that arrived from outside — a `postMessage` from the sandbox frame, or any
 * other message that happened to land on the same listener.
 *
 * Returns a fresh object holding only the declared fields, so nothing the sender attached can
 * reach the island. When `expectedId` is given the event must belong to that run; without it the
 * event still needs a non-empty string id, which is what rules out unrelated senders.
 */
export function parseRunEvent(data: unknown, expectedId?: string): RunEvent | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;

  const { id, kind, text, ms } = data as Record<string, unknown>;
  if (typeof id !== 'string' || id === '') return null;
  if (expectedId !== undefined && id !== expectedId) return null;
  if (typeof kind !== 'string' || !KINDS.has(kind)) return null;

  const event: RunEvent = { id, kind: kind as RunEventKind };
  if (typeof text === 'string') event.text = text;
  if (typeof ms === 'number' && Number.isFinite(ms)) event.ms = ms;
  return event;
}

/** A run that outlived its budget. Distinct from a program error: the code never finished. */
export class RunTimeoutError extends Error {
  readonly ms: number;

  constructor(ms: number) {
    super(`Run timed out after ${ms} ms`);
    this.name = 'RunTimeoutError';
    this.ms = ms;
  }
}

/** True for a timeout from any runner. Checked by name too, since bundles can duplicate classes. */
export function isTimeout(error: unknown): error is RunTimeoutError {
  return error instanceof RunTimeoutError || (error instanceof Error && error.name === 'RunTimeoutError');
}

/**
 * Settles with `promise`, or rejects with `RunTimeoutError` after `ms`. A budget that is not a
 * positive finite number means "no budget", which is how a caller opts out.
 *
 * This bounds *waiting*, not execution: it cannot stop code that is already running. For the
 * iframe runner that is enough, because the frame is removed on timeout. For Pyodide it is not —
 * see the note in `python.ts`.
 */
export function timeoutRace<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  if (!Number.isFinite(ms) || ms <= 0) return Promise.resolve(promise);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const budget = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new RunTimeoutError(ms)), ms);
  });

  return Promise.race([Promise.resolve(promise), budget]).finally(() => clearTimeout(timer));
}

let counter = 0;

/**
 * A per-run id. It is the shared secret between the parent and its sandbox frame: a message
 * carrying an id we did not mint is dropped, so a stray frame cannot write into the page.
 */
export function runId(): string {
  counter += 1;
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `run-${counter}-${random}`;
}
