import { enqueueCards, quizCardId, recordQuiz } from '@/lib/score';
import {
  EMPTY_FLASHCARDS,
  EMPTY_PROGRESS,
  KEYS,
  readStore,
  writeStore,
  type Flashcards,
  type Progress,
} from '@/lib/prefs';
import type { QuizItem } from '@/schemas/quiz';
import type { Locale } from '@/lib/urls';

export type { Locale, QuizItem };

export type Issue = Extract<QuizItem, { type: 'spotbug' | 'review' }>['issues'][number];
export type OptionItem = Extract<QuizItem, { type: 'mcq' | 'predict' }>;

export interface GradeLinesResult {
  found: Issue[];
  missed: Issue[];
  score: number;
  total: number;
}

/** Number-row shortcut for one of the at most nine rendered options. */
export function optionKey(index: number): string {
  return index >= 0 && index < 9 ? String(index + 1) : '';
}

export function gradeOptions(item: OptionItem, choice: number): { correct: boolean; correctIndex: number } {
  const correctIndex = item.options.findIndex((option) => option.correct);
  return { correct: choice === correctIndex, correctIndex };
}

/** Answers may list alternatives with `|`; surrounding whitespace and letter case do not grade. */
export function gradeFill(item: Extract<QuizItem, { type: 'fill' }>, text: string): boolean {
  const answer = text.trim().toLocaleLowerCase();
  return item.answer.split('|').some((part) => part.trim().toLocaleLowerCase() === answer);
}

/** A mark anywhere inside an issue's inclusive line span finds that issue. */
export function gradeLines(
  item: Extract<QuizItem, { type: 'spotbug' | 'review' }>,
  marked: number[],
): GradeLinesResult {
  const selected = new Set(marked);
  const found = item.issues.filter((issue) => {
    const last = issue.lines ?? issue.line;
    for (let line = issue.line; line <= last; line++) {
      if (selected.has(line)) return true;
    }
    return false;
  });
  const foundSet = new Set(found);
  const missed = item.issues.filter((issue) => !foundSet.has(issue));
  return { found, missed, score: found.length, total: item.issues.length };
}

/**
 * Records one answer and maintains the default quiz flashcard. Storage is best-effort: a blocked,
 * full, or visitor-corrupted store must never stop a learner from completing the interaction.
 */
export function persist(
  bank: string,
  itemId: string,
  score: number,
  total: number,
  _item: QuizItem,
  now: Date,
): void {
  try {
    const progress = readStore<Progress>(KEYS.progress, EMPTY_PROGRESS);
    const flashcards = readStore<Flashcards>(KEYS.flashcards, EMPTY_FLASHCARDS);
    const id = `${bank}#${itemId}`;
    const ref = quizCardId(bank, itemId);
    const nextProgress = recordQuiz(progress, id, score, total, now);
    const nextFlashcards =
      score < total
        ? enqueueCards(flashcards, [{ id: ref, kind: 'quiz', ref, source: 'quiz' }], now)
        : flashcards;
    writeStore(KEYS.progress, nextProgress);
    writeStore(KEYS.flashcards, nextFlashcards);
  } catch {
    // Browsers may deny storage at any point; the in-page score remains useful without it.
  }
}

export interface MountedLine {
  line: number;
  row: HTMLElement;
  marker: HTMLButtonElement;
}

/** Turns Shiki's inline line spans into interactive, still-valid inline grid rows. */
export function mountCodeLines(
  root: HTMLElement,
  lineLabel: (line: number) => string,
  onToggle: (line: number) => void,
): { lines: MountedLine[]; undo: () => void } {
  const pre = root.querySelector<HTMLElement>('.codebox pre');
  const code = pre?.querySelector<HTMLElement>('code');
  if (!pre || !code) return { lines: [], undo: () => undefined };

  const originals = [...code.querySelectorAll<HTMLElement>(':scope > span.line')];
  const originalChildren = [...code.childNodes];
  const lines = originals.map((source, index) => {
    const line = index + 1;
    const row = document.createElement('span');
    row.className = 'ln';
    row.dataset.line = String(line);

    const number = document.createElement('span');
    number.className = 'no';
    number.textContent = String(line);
    number.setAttribute('aria-hidden', 'true');

    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'mk';
    marker.setAttribute('aria-label', lineLabel(line));
    marker.setAttribute('aria-pressed', 'false');
    marker.addEventListener('click', () => onToggle(line));

    row.append(number, marker, source);
    return { line, row, marker };
  });

  pre.classList.add('lines');
  code.replaceChildren(...lines.map(({ row }) => row));

  return {
    lines,
    undo: () => {
      pre.classList.remove('lines');
      code.replaceChildren(...originalChildren);
    },
  };
}

export function quizRoot(mount: HTMLElement | null): HTMLElement | null {
  return mount?.closest<HTMLElement>('[data-quiz]') ?? null;
}

export function fillSlots(value: string, slots: Record<string, string | number>): string {
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(slots[key] ?? `{${key}}`));
}
