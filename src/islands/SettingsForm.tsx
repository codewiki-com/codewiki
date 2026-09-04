import type { ComponentChildren } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { DEPTHS, type Depth } from '@/lib/depth';
import { clearAll, exportAll, importAll, type ImportMode } from '@/lib/export';
import { DEFAULT_PREFS, KEYS, readStore, writeStore, type FontSize, type Prefs } from '@/lib/prefs';
import { applyThemePreference, readThemePref, THEME_EVENT, type ThemePref } from '@/lib/theme';

/** Localised copy. Islands never import `t`: the locale is a page-level fact. */
export interface SettingsLabels {
  theme: string;
  themes: Record<ThemePref, string>;
  depth: string;
  depths: Record<Depth, string>;
  bilingual: string;
  bilingualOff: string;
  bilingualSoon: string;
  soon: string;
  fontSize: string;
  fonts: Record<FontSize, string>;
  data: string;
  dataHint: string;
  exportLabel: string;
  importLabel: string;
  importMode: string;
  merge: string;
  replace: string;
  chooseFile: string;
  importFailed: string;
  clear: string;
  confirmClear: string;
}

export interface SettingsFormProps {
  labels: SettingsLabels;
}

const THEMES: ThemePref[] = ['system', 'light', 'dark'];
const FONTS: FontSize[] = ['s', 'm', 'l'];
const MODES: ImportMode[] = ['merge', 'replace'];

/**
 * A WAI-ARIA radio group in the shape of the mockups' segmented control: one option is tabbable,
 * the arrow keys move between them and select as they go. Every row on this page is one of these.
 */
function OptionGroup<T extends string>(props: {
  name: string;
  label: string;
  options: readonly T[];
  value: T;
  labels: Record<T, string>;
  onSelect: (value: T) => void;
}) {
  const { name, label, options, value, labels, onSelect } = props;
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : event.key === 'Home'
            ? -index
            : event.key === 'End'
              ? options.length - 1 - index
              : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    onSelect(options[next]!);
    buttons.current[next]?.focus();
  };

  return (
    <span class="seg" role="radiogroup" aria-label={label} data-setting={name}>
      {options.map((option, index) => (
        <button
          key={option}
          type="button"
          role="radio"
          ref={(node) => {
            buttons.current[index] = node as HTMLButtonElement | null;
          }}
          class={option === value ? 'on' : undefined}
          aria-checked={option === value}
          tabIndex={option === value ? 0 : -1}
          data-value={option}
          onClick={() => onSelect(option)}
          onKeyDown={(event: KeyboardEvent) => onKeyDown(event, index)}
        >
          {labels[option]}
        </button>
      ))}
    </span>
  );
}

/** One labelled row: the mono label on the left, the control on the right. */
function Row(props: { label: string; hint?: string; children: ComponentChildren }) {
  return (
    <div class="set-row">
      <div class="set-name">
        <span class="lbl">{props.label}</span>
        {props.hint && <p class="set-hint">{props.hint}</p>}
      </div>
      <div class="set-ctl">{props.children}</div>
    </div>
  );
}

/**
 * Local storage, or `null` where it is unavailable: a private window, a browser with site data
 * blocked, or the server render. The preference helpers guard themselves; the backup helpers
 * still take a store explicitly because they enumerate all codewiki keys.
 */
function store(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Today, as `2026-09-04`, for the backup filename. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The settings page — spec §6.2. Every control writes straight to this browser's storage and
 * applies its effect at once; there is no Save button because there is nothing to save to.
 *
 * The page renders server-side with the defaults selected, so it is readable without JavaScript;
 * this island reads the stored values when it hydrates and takes over from there.
 */
export default function SettingsForm({ labels }: SettingsFormProps) {
  const [theme, setTheme] = useState<ThemePref>(DEFAULT_PREFS.theme);
  const [depth, setDepth] = useState<Depth>(DEFAULT_PREFS.depth);
  const [font, setFont] = useState<FontSize>(DEFAULT_PREFS.fontSize);
  const [mode, setMode] = useState<ImportMode>('merge');
  const [error, setError] = useState('');
  const file = useRef<HTMLInputElement | null>(null);

  // The theme bootstrap and the font bootstrap have already applied these; reading them again is
  // what puts the controls in step with the document.
  useEffect(() => {
    const prefs = readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS);
    setTheme(readThemePref());
    setDepth(prefs.depth ?? DEFAULT_PREFS.depth);
    setFont(prefs.fontSize ?? DEFAULT_PREFS.fontSize);
  }, []);

  const selectTheme = useCallback((next: ThemePref) => {
    setTheme(next);
    applyThemePreference(
      next,
      window.matchMedia('(prefers-color-scheme: dark)').matches,
      document.documentElement,
    );
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: next }));
  }, []);

  const selectDepth = useCallback((next: Depth) => {
    setDepth(next);
    writeStore<Prefs>(KEYS.prefs, { ...readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS), depth: next });
  }, []);

  const selectFont = useCallback((next: FontSize) => {
    setFont(next);
    writeStore<Prefs>(KEYS.prefs, { ...readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS), fontSize: next });
    document.documentElement.setAttribute('data-font', next);
  }, []);

  /** A download of a Blob the page just built: an `<a download>` clicked once and thrown away. */
  const onExport = useCallback(() => {
    const local = store();
    // Nothing is stored, so there is nothing to hand the visitor.
    if (!local) return;
    const blob = new Blob([`${JSON.stringify(exportAll(local), null, 2)}\n`], {
      type: 'application/json',
    });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `codewiki-${today()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  }, []);

  const onImport = useCallback(
    async (event: Event) => {
      const input = event.currentTarget as HTMLInputElement;
      const chosen = input.files?.[0];
      const local = store();
      if (!chosen || !local) return;
      setError('');
      try {
        importAll(local, JSON.parse(await chosen.text()), mode);
      } catch {
        // A wrong file, a truncated one or a hand-edited one all land here; nothing was written.
        setError(labels.importFailed);
        // Clearing the input is what lets the visitor pick the same file again after fixing it:
        // re-choosing an unchanged value fires no `change` event.
        input.value = '';
        return;
      }
      // Every island on the site reads storage once, at hydration, so a reload is the honest way
      // to show imported data everywhere rather than only here.
      location.reload();
    },
    [labels.importFailed, mode],
  );

  const onClear = useCallback(() => {
    const local = store();
    if (!local || !confirm(labels.confirmClear)) return;
    clearAll(local);
    location.reload();
  }, [labels.confirmClear]);

  return (
    <div class="settings">
      <Row label={labels.theme}>
        <OptionGroup
          name="theme"
          label={labels.theme}
          options={THEMES}
          value={theme}
          labels={labels.themes}
          onSelect={selectTheme}
        />
      </Row>

      <Row label={labels.depth}>
        <OptionGroup
          name="depth"
          label={labels.depth}
          options={DEPTHS}
          value={depth}
          labels={labels.depths}
          onSelect={selectDepth}
        />
      </Row>

      <Row label={labels.fontSize}>
        <OptionGroup
          name="font"
          label={labels.fontSize}
          options={FONTS}
          value={font}
          labels={labels.fonts}
          onSelect={selectFont}
        />
      </Row>

      {/* P1 ships the bilingual markup but not the reading mode, so the control says so. */}
      <Row label={labels.bilingual} hint={labels.bilingualSoon}>
        <span class="seg" data-setting="bilingual">
          <button type="button" class="on" disabled aria-disabled="true">
            {labels.bilingualOff}
          </button>
        </span>
        <span class="tag">{labels.soon}</span>
      </Row>

      <Row label={labels.data} hint={labels.dataHint}>
        <button type="button" class="btn btn-g" data-action="export" onClick={onExport}>
          {labels.exportLabel}
        </button>
        <button type="button" class="btn btn-g" data-action="import" onClick={() => file.current?.click()}>
          {labels.importLabel}
        </button>
        <button type="button" class="btn btn-g set-danger" data-action="clear" onClick={onClear}>
          {labels.clear}
        </button>
        <input
          ref={file}
          type="file"
          class="set-file"
          accept="application/json,.json"
          aria-label={labels.chooseFile}
          onChange={onImport}
        />
      </Row>

      <Row label={labels.importMode}>
        <OptionGroup
          name="mode"
          label={labels.importMode}
          options={MODES}
          value={mode}
          labels={{ merge: labels.merge, replace: labels.replace }}
          onSelect={setMode}
        />
      </Row>

      {error && (
        <p class="set-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
