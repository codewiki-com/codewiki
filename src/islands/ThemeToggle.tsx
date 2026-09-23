import type { JSX } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import {
  applyTheme,
  applyThemePreference,
  isThemePref,
  nextTheme,
  readThemePref,
  THEME_EVENT,
  type ThemePref,
} from '@/lib/theme';
import { revealTheme } from '@/lib/theme-transition';

export interface ThemeToggleProps {
  /** Localised labels, one per preference state. */
  labels: Record<ThemePref, string>;
}

const DARK_QUERY = '(prefers-color-scheme: dark)';

const icons: Record<ThemePref, JSX.Element> = {
  light: (
    <>
      <circle cx="8" cy="8" r="3.2" />
      <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1" />
    </>
  ),
  dark: <path d="M13.2 9.4A5.6 5.6 0 0 1 6.6 2.8a5.6 5.6 0 1 0 6.6 6.6Z" />,
};

export default function ThemeToggle({ labels }: ThemeToggleProps) {
  const [pref, setPref] = useState<ThemePref>('light');
  /** A 1px marker at the button's centre: where the reveal circle starts. */
  const origin = useRef<HTMLSpanElement | null>(null);

  // The inline bootstrap script already painted the right palette; adopt whatever
  // it resolved so the button starts in the same state as the document.
  useEffect(() => {
    setPref(readThemePref());
  }, []);

  // The desktop and mobile controls are separate islands. Keep their state in lockstep through
  // the event either one emits after changing the shared document theme.
  useEffect(() => {
    const onTheme = (event: Event) => {
      const next = (event as CustomEvent<unknown>).detail;
      if (!isThemePref(next)) return;
      applyTheme(next, window.matchMedia(DARK_QUERY).matches, document.documentElement);
      setPref(next);
    };
    window.addEventListener(THEME_EVENT, onTheme);
    return () => window.removeEventListener(THEME_EVENT, onTheme);
  }, []);

  const onClick = useCallback(() => {
    const next = nextTheme(pref);
    revealTheme(origin.current, () =>
      applyThemePreference(next, window.matchMedia(DARK_QUERY).matches, document.documentElement),
    );
    setPref(next);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: next }));
  }, [pref]);

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
      <span class="theme-origin" ref={origin} aria-hidden="true" />
    </button>
  );
}
