import type { RunEventHandler, RunOptions, RunRequest } from './protocol';

function sourceFor(request: RunRequest): string {
  return request.sourceLang?.trim().toLowerCase() === 'css' ? `<style>${request.code}</style>` : request.code;
}

/** Renders one HTML/CSS program in an opaque-origin iframe and leaves the preview in place. */
export async function runHtml(
  request: RunRequest,
  onEvent: RunEventHandler,
  options: RunOptions = {},
): Promise<void> {
  options.onStatus?.('running');
  const frame = document.createElement('iframe');
  frame.className = 'runner-html-preview';
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.setAttribute('title', 'HTML preview');
  frame.setAttribute('referrerpolicy', 'no-referrer');

  const privateTarget = !options.previewTarget;
  const target = options.previewTarget ?? document.body;
  if (privateTarget) frame.hidden = true;

  const loaded = new Promise<void>((resolve) => {
    frame.addEventListener('load', () => resolve(), { once: true });
  });
  frame.srcdoc = sourceFor(request);
  if (options.previewTarget) target.replaceChildren(frame);
  else target.append(frame);

  const started = performance.now();
  await loaded;
  if (privateTarget) frame.remove();
  onEvent({ id: request.id, kind: 'done', ms: Math.round(performance.now() - started) });
}
