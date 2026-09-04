/**
 * The one entry point the island uses: hand it a request, get a stream of events.
 *
 * Which runner serves a request is the only decision made here, so the island never has to know
 * that TypeScript is transpiled in the parent or that Python arrives as a WebAssembly build.
 */
import { runJs } from './js';
import { runPython } from './python';
import type { RunEventHandler, RunOptions, RunRequest } from './protocol';

export * from './protocol';
export { runJs, DEFAULT_JS_TIMEOUT_MS } from './js';
export { runPython, loadPython, isPythonLoaded, DEFAULT_PYTHON_TIMEOUT_MS } from './python';

/**
 * Runs a request to completion. Program failures are reported as `error` events; the promise
 * rejects only with `RunTimeoutError`, which is the one condition the island renders differently.
 */
export function run(request: RunRequest, onEvent: RunEventHandler, options: RunOptions = {}): Promise<void> {
  return request.lang === 'python' ? runPython(request, onEvent, options) : runJs(request, onEvent, options);
}
