import { useEffect, useId, useState } from 'preact/hooks';

import type { DailyKataEntry, DailyKataLabels } from '@/lib/daily-kata';
import { EMPTY_PROGRESS, KEYS, readStore, type QuizProgress } from '@/lib/prefs';
import type { Locale } from '@/lib/urls';

export interface DailyKataProps {
  locale: Locale;
  /**
   * `hero` is the narrow card in the home page's first screen — docs/design/home-hero-kata.md:
   * no brief, a shorter peek and a "new one every day" caption. `section` is the full-width
   * panel of docs/design/daily-kata.md.
   */
  variant?: 'section' | 'hero';
  /** UTC day the page was built; entry 0 belongs to it. */
  buildDay: number;
  /** That day and the six after it — docs/design/daily-kata.md, "Rotation without rebuild". */
  entries: DailyKataEntry[];
  labels: DailyKataLabels;
}

/** The visitor's UTC day, as the same monotonic integer the build used. */
const today = () => Math.floor(Date.now() / 86_400_000);

function dayOf(value: string): number | undefined {
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.floor(at / 86_400_000);
}

/** The stored result for this kata, but only when it was recorded today. */
function doneToday(key: string, day: number): QuizProgress | undefined {
  const progress = readStore(KEYS.progress, EMPTY_PROGRESS);
  const entry = progress.quizzes?.[key];
  if (!entry || typeof entry.at !== 'string' || dayOf(entry.at) !== day) return undefined;
  return Number.isFinite(entry.score) && Number.isFinite(entry.total) && entry.total > 0 ? entry : undefined;
}

const fill = (text: string, values: Record<string, number | string>) =>
  Object.entries(values).reduce((out, [name, value]) => out.replaceAll(`{${name}}`, String(value)), text);

/**
 * One concrete kata on the home page, server-rendered for the build day and hydrated only to
 * rotate to the visitor's own UTC day and to show that they already did it.
 */
export default function DailyKata({
  locale,
  variant = 'section',
  buildDay,
  entries,
  labels,
}: DailyKataProps) {
  const [offset, setOffset] = useState(0);
  const peekDescriptionId = useId();
  const [done, setDone] = useState<QuizProgress | undefined>(undefined);

  useEffect(() => {
    if (!entries.length) return;
    const day = today();
    // Beyond the window the last entry stands: a week-old page still shows a real kata.
    const next = Math.min(Math.max(day - buildDay, 0), entries.length - 1);
    setOffset(next);
    setDone(doneToday(entries[next].key, day));
  }, [buildDay, entries]);

  const entry = entries[offset];
  if (!entry) return null;

  const date = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date((buildDay + offset) * 86_400_000));

  const hook = done
    ? fill(labels.found, { found: done.score, issues: done.total })
    : fill(entry.issues === 1 ? labels.hookOne : labels.hook, {
        issues: entry.issues,
        lines: entry.lines,
      });

  const hero = variant === 'hero';

  const card = (
    <section
      class={`panel daily${hero ? ' daily-hero' : ''}`}
      data-daily
      data-daily-variant={variant}
      aria-labelledby="daily-title"
    >
      <div class="daily-eyebrow">
        <span class="lbl daily-label">
          <span class="daily-dot" aria-hidden="true" />
          {labels.eyebrow} · {date}
        </span>
        <span class="lbl daily-meta">
          {entry.typeLabel} · {entry.trackLabel} · {entry.minutesLabel}
        </span>
      </div>

      <div class="daily-text">
        <h2 id="daily-title">{entry.title}</h2>
        {!hero && entry.task ? <p class="daily-task">{entry.task}</p> : null}
        <p class="daily-hook" data-daily-hook>
          {hook}
        </p>
      </div>

      <div class="daily-actions">
        <a class={`btn daily-start ${done ? 'btn-g' : 'btn-p'}`} href={entry.kataUrl} data-daily-start>
          {done ? labels.done : labels.start}
          <span aria-hidden="true">→</span>
        </a>
        <a class="daily-from" href={entry.topicUrl}>
          {fill(labels.from, { topic: entry.topicTitle })}
        </a>
        {hero && <span class="lbl daily-every">{labels.everyDay}</span>}
      </div>

      <span id={peekDescriptionId} hidden>
        {fill(labels.peek, { title: entry.title })}
      </span>
      <a class="peek" href={entry.kataUrl} aria-describedby={peekDescriptionId} data-daily-peek>
        <div class="peek-body">
          <div dangerouslySetInnerHTML={{ __html: entry.peekHtml }} />
          {entry.peekMoreSmall > 0 && (
            <span class={`peek-fade${entry.peekMore > 0 ? '' : ' peek-small'}`} aria-hidden="true" />
          )}
          {entry.peekMore > 0 && (
            <span class="lbl peek-more" data-daily-more>
              {fill(labels.more, { count: entry.peekMore })}
            </span>
          )}
        </div>
        {entry.peekMoreSmall > 0 && (
          <span class="lbl peek-caption">{fill(labels.more, { count: entry.peekMoreSmall })}</span>
        )}
      </a>
    </section>
  );

  // The hero places the card in its own grid column, so it brings no `.wrap` of its own.
  return hero ? card : <div class="wrap daily-wrap">{card}</div>;
}
