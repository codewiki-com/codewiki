import { useEffect, useRef } from 'preact/hooks';
import { isTimeout, normalizeLang, run, runId, type RunEvent, type RunStatus } from '@/lib/runners';

/**
 * Makes every runnable code box on a topic page executable and editable — spec §5.4.
 *
 * The boxes are server-rendered by `rehype-codebox`, complete with their Run button and their
 * empty `.out` slot, so the page reads correctly with no JavaScript at all. This island only
 * patches behaviour onto that markup: it renders no UI of its own beyond the mount sentinel.
 *
 * Localisation comes from `window.__cw_i18n`, published by `Base.astro`, with the same localized
 * values supplied as props in case that map is unavailable. The Reset button is created after the
 * map has already swapped every `data-i18n` node, so it has to read the string itself.
 */

type Strings = Record<string, string>;

interface CodeRunnersProps {
  labels: Strings;
}

function label(key: string, fallback: Strings): string {
  const strings = (globalThis as { __cw_i18n?: Strings }).__cw_i18n;
  return strings?.[key] ?? fallback[key] ?? key;
}

/** Appends one output line per newline; a muted marker distinguishes program output from chrome. */
function writeLines(out: HTMLElement, text: string, kind: 'stdout' | 'stderr'): void {
  for (const value of text.replace(/\n+$/, '').split('\n')) {
    const line = document.createElement('div');
    line.className = kind === 'stderr' ? 'line err' : 'line';

    if (kind === 'stdout') {
      const marker = document.createElement('span');
      marker.className = 'meta';
      marker.textContent = '›';
      line.append(marker, ` ${value}`);
    } else {
      line.textContent = value;
    }

    out.append(line);
  }
}

/** The last line of a run: how it ended, and how long it took. */
function writeFooter(out: HTMLElement, text: string): void {
  const footer = document.createElement('div');
  footer.className = 'meta';
  footer.textContent = text;
  out.append(footer);
}

/**
 * Reads the program as the reader currently sees it. `innerText` rather than `textContent`,
 * because an edited `<pre>` may hold `<br>` or block elements where the newlines used to be.
 */
function readCode(pre: HTMLElement): string {
  return (pre.innerText || pre.textContent) ?? '';
}

/** Wires one code box. Returns the undo, so the island leaves the markup as it found it. */
function wire(figure: HTMLElement, labels: Strings): () => void {
  const pre = figure.querySelector('pre');
  const button = figure.querySelector<HTMLButtonElement>('button[data-run]');
  const out = figure.querySelector<HTMLElement>('.out');
  if (!pre || !button || !out) return () => {};

  const lang = normalizeLang(figure.dataset.lang);
  if (!lang) {
    // A button that cannot do anything is worse than no button, so unsupported fences hide it.
    button.hidden = true;
    out.hidden = true;
    return () => {
      button.hidden = false;
    };
  }

  // Output arrives after the click that asked for it, so a screen reader has to be told.
  out.setAttribute('aria-live', 'polite');

  /* ---- editing ---- */

  const pristine = pre.innerHTML;

  /* Editing starts on pointerdown so that the browser's own caret placement, which happens on the
     same gesture, lands in an already-editable element. `plaintext-only` keeps pasted markup out;
     where it is unsupported, plain `true` is close enough for a code box.

     Syntax colours survive until the first keystroke and then decay, because the reader is editing
     Shiki's spans directly. That is the accepted P1 trade — a real editor is P2. */
  const onPointerDown = () => {
    if (pre.isContentEditable) return;
    pre.contentEditable = 'plaintext-only';
    if (pre.contentEditable !== 'plaintext-only') pre.contentEditable = 'true';
    pre.spellcheck = false;
    pre.dataset.editable = 'true';
  };
  pre.addEventListener('pointerdown', onPointerDown);

  /* ---- reset ---- */

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'act act-sm';
  reset.dataset.reset = '';
  reset.dataset.i18n = 'code.reset';
  reset.textContent = label('code.reset', labels);

  const onReset = () => {
    pre.innerHTML = pristine;
    pre.removeAttribute('contenteditable');
    pre.removeAttribute('data-editable');
    out.replaceChildren();
    out.hidden = true;
  };
  reset.addEventListener('click', onReset);
  figure.querySelector('.codeactions')?.insertBefore(reset, button);

  /* ---- running ---- */

  const onRun = async () => {
    if (button.disabled) return;

    out.replaceChildren();
    out.hidden = false;
    button.disabled = true;
    button.textContent = label('code.running', labels);

    const onStatus = (status: RunStatus) => {
      button.textContent = label(status === 'loading-python' ? 'code.loadingPython' : 'code.running', labels);
    };
    const onEvent = (event: RunEvent) => {
      if (event.kind === 'stdout' || event.kind === 'stderr') {
        writeLines(out, event.text ?? '', event.kind);
      } else if (event.kind === 'done') {
        writeFooter(out, `${label('code.exit', labels)} · ${Math.round(event.ms ?? 0)} ms`);
      } else {
        if (event.text) writeLines(out, event.text, 'stderr');
        writeFooter(out, label('code.error', labels));
      }
    };

    try {
      await run(
        {
          id: runId(),
          lang,
          code: readCode(pre),
          ...(figure.dataset.seed ? { seed: figure.dataset.seed } : {}),
          sourceLang: figure.dataset.lang,
        },
        onEvent,
        {
          onStatus,
          previewTarget: out,
        },
      );
    } catch (error) {
      if (isTimeout(error)) {
        writeFooter(out, label('code.timeout', labels));
      } else {
        writeLines(out, error instanceof Error ? error.message : String(error), 'stderr');
        writeFooter(out, label('code.error', labels));
      }
    } finally {
      button.disabled = false;
      button.textContent = label('code.run', labels);
    }
  };

  button.addEventListener('click', onRun);

  return () => {
    out.removeAttribute('aria-live');
    pre.removeEventListener('pointerdown', onPointerDown);
    reset.removeEventListener('click', onReset);
    button.removeEventListener('click', onRun);
    reset.remove();
  };
}

export default function CodeRunners({ labels }: CodeRunnersProps) {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const undo = Array.from(document.querySelectorAll<HTMLElement>('figure.codebox[data-run]')).map(
      (figure) => wire(figure, labels),
    );
    if (mount.current) mount.current.dataset.ready = 'true';
    return () => {
      for (const step of undo) step();
    };
  }, [labels]);

  /* `client:visible` observes the island's *children*, so an island that renders nothing would
     never hydrate. This 1px sentinel is taken out of flow, which keeps it out of the article's
     flex rhythm while still giving the observer a box at the top of the page to see. */
  return <div ref={mount} class="runners-mount" aria-hidden="true" data-code-runners />;
}
