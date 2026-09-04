import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { applyDepth, DEFAULT_DEPTH, DEPTHS, isDepth, readDepth, type Depth } from '@/lib/depth';
import { DEFAULT_PREFS, KEYS, readStore, writeStore, type Prefs } from '@/lib/prefs';

export interface DepthDialProps {
  /** Localised copy. Islands never import `t`: the locale is a page-level fact. */
  labels: Record<Depth, string>;
  /** Accessible name of the group. */
  label: string;
}

/** The depth event other islands listen for; the table of contents is the first subscriber. */
export const DEPTH_EVENT = 'cw:depth';

/**
 * The Quick / Standard / Deep dial above a topic — spec §5.2.
 *
 * The article is already at the right depth when this hydrates: the inline bootstrap in
 * `Topic.astro` applies the stored depth before the article paints, exactly as the theme script
 * does for the palette. This island owns what happens afterwards — the click, the write to
 * `prefs.depth`, the `data-depth-mode` switch and the event the table of contents redraws on —
 * and it also serves the "Switch to Deep" buttons the deep teasers render inside the article.
 *
 * Rendered as a WAI-ARIA radio group: one tab is tabbable, the arrow keys move between them.
 */
export default function DepthDial({ labels, label }: DepthDialProps) {
  const [depth, setDepth] = useState<Depth>(DEFAULT_DEPTH);
  const [ready, setReady] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  /** Switches depth everywhere: the article, this browser's preferences and every listener. */
  const select = useCallback((next: Depth) => {
    setDepth(next);
    applyDepth(document.getElementById('article'), next);
    const prefs = readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS);
    writeStore<Prefs>(KEYS.prefs, { ...prefs, depth: next });
    document.dispatchEvent(new CustomEvent<Depth>(DEPTH_EVENT, { detail: next }));
  }, []);

  useEffect(() => {
    // The bootstrap has already applied this; reading it again is what puts the dial in step.
    setDepth(readDepth(typeof localStorage === 'undefined' ? null : localStorage, location.search));
    setReady(true);
  }, []);

  useEffect(() => {
    /* The dashed teaser a deep section leaves behind at the lower depths carries a
       "Switch to Deep" button. It is rendered by the markdown pipeline, inside the article, so it
       is reached by delegation rather than by a ref. */
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const wanted = target.closest<HTMLElement>('[data-depth-switch]')?.dataset.depthSwitch;
      if (isDepth(wanted)) select(wanted);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [select]);

  /** Roving focus: the arrow keys move to the next tab and switch depth as they go. */
  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : event.key === 'Home'
            ? -index
            : event.key === 'End'
              ? DEPTHS.length - 1 - index
              : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = (index + step + DEPTHS.length) % DEPTHS.length;
    select(DEPTHS[next]!);
    tabs.current[next]?.focus();
  };

  return (
    <div class="tabs" role="radiogroup" aria-label={label} data-depth-dial data-ready={String(ready)}>
      {DEPTHS.map((value, index) => (
        <button
          key={value}
          type="button"
          role="radio"
          ref={(node) => {
            tabs.current[index] = node as HTMLButtonElement | null;
          }}
          class={value === depth ? 'on' : undefined}
          aria-checked={value === depth}
          tabIndex={value === depth ? 0 : -1}
          data-depth-tab={value}
          onClick={() => select(value)}
          onKeyDown={(event: KeyboardEvent) => onKeyDown(event, index)}
        >
          {labels[value]}
        </button>
      ))}
    </div>
  );
}
