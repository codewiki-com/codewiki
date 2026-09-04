import { useEffect, useState } from 'preact/hooks';

import {
  dueFlashcards,
  EMPTY_FLASHCARDS,
  EMPTY_PROGRESS,
  KEYS,
  readStore,
  type Flashcard,
  type Progress,
  type QuizProgress,
} from '@/lib/prefs';

export interface TodayKata {
  href: string;
  type: string;
  track: string;
  prompt: string;
  description: string;
  minutes: string;
}

export interface TodayPath {
  id: string;
  title: string;
  milestones: Array<{
    number: number;
    title: string;
    bank: string;
    href: string;
  }>;
}

export interface TodayStripProps {
  kata?: TodayKata;
  paths: TodayPath[];
  flashcardsUrl: string;
  labels: {
    today: string;
    start: string;
    flashcards: string;
    due: string;
    cardDue: string;
    cardsDue: string;
    flashcardsDesc: string;
    review: string;
    checkpoint: string;
    pathMilestone: string;
    checkpointReady: string;
    checkpointDesc: string;
    take: string;
    passMark: string;
    done: string;
    missed: string;
    daysShort: string;
  };
}

interface PersonalToday {
  ready: boolean;
  due: number;
  checkpoint?: {
    path: string;
    milestone: string;
    number: number;
    href: string;
  };
}

function safeQuizzes(progress: Progress): Record<string, QuizProgress> {
  return progress?.quizzes && typeof progress.quizzes === 'object' && !Array.isArray(progress.quizzes)
    ? progress.quizzes
    : {};
}

function passing(entry: QuizProgress | undefined): boolean {
  return Boolean(
    entry &&
    Number.isFinite(entry.score) &&
    Number.isFinite(entry.total) &&
    entry.total > 0 &&
    entry.score / entry.total >= 0.7,
  );
}

/** A local calendar day represented as a monotonic integer. */
function localDay(value: string | Date): number | undefined {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

function streakOf(entries: QuizProgress[], now: Date): number {
  const days = new Set(entries.map((entry) => localDay(entry.at)).filter((day) => day !== undefined));
  const today = localDay(now);
  if (today === undefined || days.size === 0) return 0;

  const latest = Math.max(...days);
  if (latest < today - 1) return 0;

  let streak = 0;
  for (let day = latest; days.has(day); day -= 1) streak += 1;
  return streak;
}

function patchStats(progress: Progress, now: Date, daysShort: string): void {
  const entries = Object.values(safeQuizzes(progress)).filter(
    (entry) =>
      entry &&
      Number.isFinite(entry.score) &&
      Number.isFinite(entry.total) &&
      entry.total > 0 &&
      typeof entry.at === 'string',
  );
  const score = entries.reduce((sum, entry) => sum + Math.max(0, Math.min(entry.score, entry.total)), 0);
  const total = entries.reduce((sum, entry) => sum + entry.total, 0);
  const solved = entries.filter((entry) => entry.score >= entry.total).length;
  const values = {
    solved: String(solved),
    accuracy: `${total > 0 ? Math.round((score / total) * 100) : 0}%`,
    streak: daysShort.replace('{count}', String(streakOf(entries, now))),
  };

  for (const [name, value] of Object.entries(values)) {
    const node = document.querySelector<HTMLElement>(`[data-practice-stat="${name}"]`);
    if (node) node.textContent = value;
  }
}

function personalToday(progress: Progress, cards: Flashcard[], paths: TodayPath[], now: Date): PersonalToday {
  const quizzes = safeQuizzes(progress);
  const started =
    progress?.paths && typeof progress.paths === 'object' && !Array.isArray(progress.paths)
      ? progress.paths
      : {};
  const path = paths.find((candidate) => Boolean(started[candidate.id]));
  const milestone = path?.milestones.find((candidate) => !passing(quizzes[candidate.bank]));

  return {
    ready: true,
    due: dueFlashcards(cards, now),
    ...(path && milestone
      ? {
          checkpoint: {
            path: path.title,
            milestone: milestone.title,
            number: milestone.number,
            href: milestone.href,
          },
        }
      : {}),
  };
}

/** The build-time kata plus the two cards derived from this browser's local learning data. */
export default function TodayStrip({ kata, paths, flashcardsUrl, labels }: TodayStripProps) {
  const [personal, setPersonal] = useState<PersonalToday>({ ready: false, due: 0 });

  useEffect(() => {
    const refresh = () => {
      const now = new Date();
      const progress = readStore(KEYS.progress, EMPTY_PROGRESS);
      const deck = readStore(KEYS.flashcards, EMPTY_FLASHCARDS);
      const cards = Array.isArray(deck?.cards)
        ? deck.cards.filter(
            (card): card is Flashcard =>
              Boolean(card) && typeof card === 'object' && typeof card.due === 'string',
          )
        : [];
      setPersonal(personalToday(progress, cards, paths, now));
      patchStats(progress, now, labels.daysShort);
    };

    refresh();
    document.addEventListener('cw:progress', refresh);
    return () => document.removeEventListener('cw:progress', refresh);
  }, [labels.daysShort, paths]);

  const checkpoint = personal.checkpoint;

  return (
    <section class="wrap today" data-today aria-label={labels.today}>
      {kata ? (
        <a class="card today-card kata-card" href={kata.href}>
          <span class="today-card-top">
            <span class="tag acc2">{labels.today}</span>
            <span class="lbl">
              {kata.type} · {kata.track}
            </span>
          </span>
          <span class="ttl">{kata.prompt}</span>
          <span class="sub">{kata.description}</span>
          <span class="today-card-action">
            <span class="btn btn-p">
              {labels.start} · {kata.minutes}
            </span>
          </span>
        </a>
      ) : (
        <div class="card today-card" hidden />
      )}

      <a
        class="card today-card"
        href={flashcardsUrl}
        data-today-flashcards
        hidden={!personal.ready || personal.due === 0}
      >
        <span class="today-card-top">
          <span class="tag">{labels.flashcards}</span>
          <span class="lbl">{labels.due.replace('{count}', String(personal.due))}</span>
        </span>
        <span class="ttl">
          {personal.due === 1 ? labels.cardDue : labels.cardsDue.replace('{count}', String(personal.due))}
        </span>
        <span class="sub">{labels.flashcardsDesc}</span>
        <span class="today-card-action">
          <span class="btn btn-g">{labels.review}</span>
        </span>
      </a>

      <a
        class="card today-card"
        href={checkpoint?.href ?? '#'}
        data-today-checkpoint
        hidden={!personal.ready || !checkpoint}
      >
        <span class="today-card-top">
          <span class="tag">{labels.checkpoint}</span>
          {checkpoint ? (
            <span class="lbl">
              {labels.pathMilestone
                .replace('{path}', checkpoint.path)
                .replace('{number}', String(checkpoint.number))}
            </span>
          ) : null}
        </span>
        <span class="ttl">
          {checkpoint ? labels.checkpointReady.replace('{milestone}', checkpoint.milestone) : ''}
        </span>
        <span class="sub">{labels.checkpointDesc}</span>
        <span class="today-card-action">
          <span class="btn btn-g">{labels.take}</span>
          <span class="lbl">{labels.passMark}</span>
        </span>
      </a>
    </section>
  );
}
