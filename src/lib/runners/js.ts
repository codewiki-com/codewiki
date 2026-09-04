/**
 * The JavaScript and TypeScript runner — spec §5.4.
 *
 * Nothing is executed on the page's own origin. Each run gets a fresh iframe pointed at
 * `/public/sandbox.html` with `sandbox="allow-scripts"` and deliberately *no* `allow-same-origin`,
 * which puts the program on an opaque origin: it cannot read the article's DOM, cookies,
 * `localStorage`, IndexedDB or the reader's progress. Removing the frame ends the run, which is
 * also the only way to stop code that never finishes.
 *
 * TypeScript is transpiled here, in the parent, with `esbuild-wasm`; the sandbox only ever sees
 * JavaScript. The wasm binary is vendored to `/vendor/esbuild.wasm` by `scripts/vendor-pyodide.mjs`
 * so no request ever leaves the reader's machine.
 *
 * Known limitation (P2): the frame is a same-tab iframe, so Chrome keeps it on the article's main
 * thread. `while (true) {}` therefore freezes the page and the budget below can never fire — it
 * bounds programs that *yield*, which is every example the site ships. A Web Worker per run, which
 * can be terminated, is the P2 follow-up; the same worker rewrite is what fixes Python (see
 * `python.ts`), and it is why the two runners are kept behind one interface.
 */
import {
  parseRunEvent,
  RunTimeoutError,
  type RunEventHandler,
  type RunOptions,
  type RunRequest,
} from './protocol';

const SANDBOX_URL = '/sandbox.html';
const ESBUILD_WASM_URL = '/vendor/esbuild.wasm';

/** Long enough for the examples the site ships, short enough that a runaway loop is noticed. */
export const DEFAULT_JS_TIMEOUT_MS = 5000;

/** Head-room the sandbox is told to leave itself for draining timers before the parent gives up. */
const DRAIN_MARGIN_MS = 500;

type EsbuildModule = typeof import('esbuild-wasm');

let esbuildReady: Promise<EsbuildModule> | null = null;

/**
 * Loads and initialises `esbuild-wasm` once per page. A failed load is not memoised, so a reader
 * whose first attempt raced a cold cache can press Run again.
 */
function loadEsbuild(): Promise<EsbuildModule> {
  if (!esbuildReady) {
    const ready = (async () => {
      const esbuild = await import('esbuild-wasm');
      await esbuild.initialize({ wasmURL: ESBUILD_WASM_URL });
      return esbuild;
    })();
    ready.catch(() => {
      if (esbuildReady === ready) esbuildReady = null;
    });
    esbuildReady = ready;
  }
  return esbuildReady;
}

/** The first esbuild diagnostic, with its line, which is what a reader needs to fix the fence. */
function esbuildMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'errors' in error) {
    const errors = (error as { errors?: unknown }).errors;
    const first = Array.isArray(errors)
      ? (errors[0] as { text?: string; location?: { line?: number } })
      : undefined;
    if (first?.text) {
      const line = first.location?.line;
      return typeof line === 'number' ? `Line ${line}: ${first.text}` : first.text;
    }
  }
  return error instanceof Error ? error.message : String(error);
}

type Transpiled = { ok: true; code: string } | { ok: false; message: string };

/** TypeScript in, JavaScript out. Types are erased, not checked — this is `transform`, not `tsc`. */
async function transpile(code: string): Promise<Transpiled> {
  try {
    const { transform } = await loadEsbuild();
    const result = await transform(code, { loader: 'ts', target: 'es2022' });
    return { ok: true, code: result.code };
  } catch (error) {
    return { ok: false, message: esbuildMessage(error) };
  }
}

/**
 * Runs one program in a throwaway sandbox frame.
 *
 * Resolves when the frame reports `done` or `error`; rejects with `RunTimeoutError` when the
 * budget is spent, having removed the frame first.
 */
function runInSandbox(request: RunRequest, onEvent: RunEventHandler, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('tabindex', '-1');
    frame.setAttribute('title', 'code sandbox');
    frame.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden;';

    let settled = false;

    const finish = () => {
      if (settled) return false;
      settled = true;
      window.clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      frame.remove();
      return true;
    };

    const onMessage = (event: MessageEvent) => {
      /* The frame has an opaque origin, so `event.origin` is the string "null" and cannot
         identify it. What can: the source window is this run's frame, and the event carries the
         id this run minted. `parseRunEvent` enforces the second and rebuilds the object, so
         nothing else the sender attached reaches the island. */
      if (event.source !== frame.contentWindow) return;
      const runEvent = parseRunEvent(event.data, request.id);
      if (!runEvent) return;

      onEvent(runEvent);
      if (runEvent.kind === 'done' || runEvent.kind === 'error') {
        if (finish()) resolve();
      }
    };

    const onLoad = () => {
      // "*" is the only target origin an opaque-origin frame will accept.
      frame.contentWindow?.postMessage(
        { id: request.id, code: request.code, drainMs: Math.max(0, timeoutMs - DRAIN_MARGIN_MS) },
        '*',
      );
    };

    const timer = window.setTimeout(() => {
      if (finish()) reject(new RunTimeoutError(timeoutMs));
    }, timeoutMs);

    window.addEventListener('message', onMessage);
    frame.addEventListener('load', onLoad, { once: true });
    frame.src = SANDBOX_URL;
    document.body.append(frame);
  });
}

/**
 * Runs a `js` or `ts` request. Program failures arrive as an `error` event; only a timeout
 * rejects, because a timeout is a fact about the runner rather than about the program's output.
 */
export async function runJs(
  request: RunRequest,
  onEvent: RunEventHandler,
  options: RunOptions = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_JS_TIMEOUT_MS;
  let code = request.code;

  if (request.lang === 'ts') {
    options.onStatus?.('compiling');
    const result = await transpile(code);
    if (!result.ok) {
      onEvent({ id: request.id, kind: 'error', text: result.message });
      return;
    }
    code = result.code;
  }

  options.onStatus?.('running');
  await runInSandbox({ ...request, code }, onEvent, timeoutMs);
}
