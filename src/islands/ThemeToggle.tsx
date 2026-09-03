import type { JSX } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { nextTheme, readThemePref, resolveTheme, writeThemePref, type ThemePref } from '@/lib/theme';

export interface ThemeToggleProps {
  /** Localised labels, one per preference state. */
  labels: Record<ThemePref, string>;
}

const DARK_QUERY = '(prefers-color-scheme: dark)';

function apply(pref: ThemePref): void {
  const systemDark = window.matchMedia(DARK_QUERY).matches;
  const root = document.documentElement;
  root.setAttribute('data-theme', resolveTheme(pref, systemDark));
  root.setAttribute('data-theme-pref', pref);
}

const icons: Record<ThemePref, JSX.Element> = {
  system: (
    <>
      <rect x="2" y="3" width="12" height="9" rx="1.5" />
      <path d="M6 14h4" />
    </>
  ),
  light: (
    <>
      <circle cx="8" cy="8" r="3.2" />
      <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1" />
    </>
  ),
  dark: <path d="M13.2 9.4A5.6 5.6 0 0 1 6.6 2.8a5.6 5.6 0 1 0 6.6 6.6Z" />,
};

export default function ThemeToggle({ labels }: ThemeToggleProps) {
  const [pref, setPref] = useState<ThemePref>('system');

  // The inline bootstrap script already painted the right palette; adopt whatever
  // it resolved so the button starts in the same state as the document.
  useEffect(() => {
    setPref(readThemePref(localStorage));
  }, []);

  // While following the system, track live OS palette changes.
  useEffect(() => {
    if (pref !== 'system') return;
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = () => apply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);

  const onClick = useCallback(() => {
    const next = nextTheme(readThemePref(localStorage));
    writeThemePref(next, localStorage);
    apply(next);
    setPref(next);
  }, []);

  return (
    <button
      type="button"
      class="act theme-toggle"
      aria-label={labels[pref]}
      title={labels[pref]}
      onClick={onClick}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        {icons[pref]}
      </svg>
    </button>
  );
}
