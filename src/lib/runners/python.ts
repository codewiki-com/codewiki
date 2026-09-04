/**
 * The Python runner — spec §5.4.
 *
 * Pyodide is CPython compiled to WebAssembly, so Python runs on the reader's machine and no code
 * leaves the browser. The distribution is vendored into `/vendor/pyodide/` by
 * `scripts/vendor-pyodide.mjs`; nothing is fetched from a CDN.
 *
 * The version this project pins (pyodide 314) ships `pyodide.js` as a classic script that assigns
 * `globalThis.loadPyodide`, plus `pyodide.mjs` as the ESM twin. The classic script is what is used
 * here: it is injected with a `<script>` tag at first Run, which keeps the ~13 MB distribution out
 * of the page's own bundle and out of every page that has no Python fence. Importing the ESM build
 * instead would ask Vite to resolve a path that only exists in `public/`, which it cannot do.
 *
 * Known limitation (P2): `runPythonAsync` runs on the main thread, so a Python program that never
 * yields — `while True: pass` — blocks the event loop and the timeout below can never fire. The
 * budget therefore only catches programs that await. Moving Pyodide into a Web Worker, where the
 * worker can be terminated, is the P2 follow-up; it also gets the 13 MB load off the main thread.
 */
import { isTimeout, timeoutRace, type RunEventHandler, type RunOptions, type RunRequest } from './protocol';

const PYODIDE_INDEX_URL = '/vendor/pyodide/';
const PYODIDE_SCRIPT_URL = `${PYODIDE_INDEX_URL}pyodide.js`;

/** Generous, because Pyodide cannot be interrupted mid-run; see the note above. */
export const DEFAULT_PYTHON_TIMEOUT_MS = 15_000;

/**
 * The slice of Pyodide's surface this runner touches. Declared structurally rather than imported
 * from `pyodide`'s type entry: the runtime is loaded from `public/`, never bundled, so the package
 * is a build-time dependency only and the module graph should not mention it.
 */
interface Pyodide {
  runPythonAsync(code: string): Promise<unknown>;
  setStdout(options: { batched?: (text: string) => void }): void;
  setStderr(options: { batched?: (text: string) => void }): void;
}

type PyodideFactory = (options: { indexURL: string }) => Promise<Pyodide>;

let pyodideReady: Promise<Pyodide> | null = null;
let loaded = false;

/** True once the interpreter is in memory, so the button can skip the "Loading Python…" label. */
export function isPythonLoaded(): boolean {
  return loaded;
}

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.cwRunner = 'pyodide';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener(
      'error',
      () => reject(new Error(`Could not load ${src} — run \`pnpm vendor:pyodide\`.`)),
      { once: true },
    );
    document.head.append(script);
  });
}

/** Loads the interpreter once per page. A failed load is not memoised, so Run can be retried. */
export function loadPython(): Promise<Pyodide> {
  if (!pyodideReady) {
    const ready = (async () => {
      await injectScript(PYODIDE_SCRIPT_URL);
      // `pyodide.js` is a classic script, so its only export channel is `globalThis.loadPyodide`,
      // declared with `var` and therefore not deletable. That one global is the whole footprint
      // the runner leaves on the page; the interpreter itself stays behind this module.
      const factory = (globalThis as { loadPyodide?: PyodideFactory }).loadPyodide;
      if (typeof factory !== 'function') throw new Error('pyodide.js loaded without defining loadPyodide');

      const pyodide = await factory({ indexURL: PYODIDE_INDEX_URL });
      loaded = true;
      return pyodide;
    })();
    ready.catch(() => {
      if (pyodideReady === ready) pyodideReady = null;
    });
    pyodideReady = ready;
  }
  return pyodideReady;
}

/** A `PythonError` carries the full traceback on `message`; anything else is stringified. */
function errorText(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return text.replace(/\s+$/, '');
}

/**
 * Runs one Python request. A `PythonError` becomes the traceback on `stderr` followed by a
 * text-free `error` event, so the island prints the traceback once and still knows the run failed.
 * Only a timeout rejects.
 */
export async function runPython(
  request: RunRequest,
  onEvent: RunEventHandler,
  options: RunOptions = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_PYTHON_TIMEOUT_MS;

  let pyodide: Pyodide;
  try {
    options.onStatus?.(loaded ? 'running' : 'loading-python');
    pyodide = await loadPython();
  } catch (error) {
    onEvent({ id: request.id, kind: 'error', text: errorText(error) });
    return;
  }

  options.onStatus?.('running');

  const emit = (kind: 'stdout' | 'stderr') => (text: string) => {
    if (text !== '') onEvent({ id: request.id, kind, text });
  };
  pyodide.setStdout({ batched: emit('stdout') });
  pyodide.setStderr({ batched: emit('stderr') });

  const started = performance.now();
  try {
    // The budget starts after loading, so a cold 13 MB download is not charged to the program.
    await timeoutRace(pyodide.runPythonAsync(request.code), timeoutMs);
    onEvent({ id: request.id, kind: 'done', ms: Math.round(performance.now() - started) });
  } catch (error) {
    if (isTimeout(error)) throw error;
    onEvent({ id: request.id, kind: 'stderr', text: errorText(error) });
    onEvent({ id: request.id, kind: 'error' });
  } finally {
    // Hand the streams back to the console; the next run installs its own.
    pyodide.setStdout({});
    pyodide.setStderr({});
  }
}
