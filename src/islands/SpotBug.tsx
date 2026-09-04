import { useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import {
  fillSlots,
  gradeLines,
  mountCodeLines,
  persist,
  quizRoot,
  type Issue,
  type Locale,
  type QuizItem,
} from '@/islands/quiz-shared';

export interface SpotBugProps {
  bank: string;
  item: QuizItem;
  locale: Locale;
  labels: Record<string, string>;
  onDone?: (score: number, total: number) => void;
  /** Checkpoints aggregate persistence after the last item instead. */
  persistResult?: boolean;
}

function inIssue(line: number, issue: Issue): boolean {
  return line >= issue.line && line <= (issue.lines ?? issue.line);
}

function note(issue: Issue, locale: Locale, label: string): HTMLSpanElement {
  const row = document.createElement('span');
  row.className = 'note';
  const tag = document.createElement('span');
  tag.className = `tag ${issue.kind === 'security' ? 'bad' : issue.kind === 'correctness' || issue.kind === 'edge-case' ? 'warn' : ''}`;
  tag.textContent = label;
  const text = document.createElement('span');
  text.textContent = issue.note[locale];
  row.append(tag, text);
  return row;
}

function showExplanation(root: HTMLElement, score: number, total: number): void {
  const template = root.querySelector<HTMLTemplateElement>('template[data-answer]');
  const explanation = template?.content.querySelector<HTMLElement>('[data-explanation]');
  const result = root.querySelector<HTMLElement>('[data-result]');
  if (!explanation || !result) return;
  result.replaceChildren(explanation.cloneNode(true));
  result.hidden = false;
  result.dataset.score = String(score);
  result.dataset.total = String(total);
}

/** Clickable line-gutter controller for spot-the-bug kata shells. */
export default function SpotBug({ bank, item, locale, labels, onDone, persistResult = true }: SpotBugProps) {
  const mount = useRef<HTMLDivElement>(null);
  const marked = useSignal<number[]>([]);
  const answered = useSignal(false);

  useEffect(() => {
    if (item.type !== 'spotbug') return;
    const sentinel = mount.current;
    const root = quizRoot(sentinel);
    if (!root) return;
    const revealButton = root.querySelector<HTMLButtonElement>('[data-reveal]');
    let persisted = false;
    const addedNotes: HTMLElement[] = [];

    const mounted = mountCodeLines(
      root,
      (line) => fillSlots(labels.markLine ?? '', { line }),
      (line) => {
        if (answered.value) return;
        marked.value = marked.value.includes(line)
          ? marked.value.filter((value) => value !== line)
          : [...marked.value, line];
        paintMarks();
      },
    );

    const paintMarks = () => {
      const selected = new Set(marked.value);
      for (const line of mounted.lines) {
        const on = selected.has(line.line);
        line.row.classList.toggle('marked', on);
        line.marker.setAttribute('aria-pressed', String(on));
      }
    };

    const reveal = () => {
      if (answered.value) return;
      answered.value = true;
      const grade = gradeLines(item, marked.value);
      const found = new Set(grade.found);
      root.dataset.state = 'answered';
      if (revealButton) revealButton.hidden = true;

      for (const line of mounted.lines) {
        const issue = item.issues.find((candidate) => inIssue(line.line, candidate));
        line.row.classList.remove('marked');
        line.row.classList.toggle('hit', Boolean(issue && found.has(issue)));
        line.row.classList.toggle('miss', Boolean(issue && !found.has(issue)));
        line.marker.disabled = true;
      }

      for (const issue of item.issues) {
        const anchor = mounted.lines.find((line) => line.line === (issue.lines ?? issue.line))?.row;
        if (!anchor) continue;
        const issueNote = note(issue, locale, labels[`kind.${issue.kind}`] ?? '');
        anchor.after(issueNote);
        addedNotes.push(issueNote);
      }

      showExplanation(root, grade.score, grade.total);
      if (!persisted) {
        persisted = true;
        if (persistResult) persist(bank, item.id, grade.score, grade.total, item, new Date());
        onDone?.(grade.score, grade.total);
      }
    };

    revealButton?.addEventListener('click', reveal);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || answered.value) return;
      const active = document.activeElement;
      if (active && active !== document.body && !root.contains(active)) return;
      event.preventDefault();
      reveal();
    };
    window.addEventListener('keydown', onKeyDown);
    if (sentinel) sentinel.dataset.ready = 'true';

    return () => {
      revealButton?.removeEventListener('click', reveal);
      window.removeEventListener('keydown', onKeyDown);
      for (const issueNote of addedNotes) issueNote.remove();
      mounted.undo();
    };
  }, [bank, item, labels, locale, onDone, persistResult, answered, marked]);

  return <div ref={mount} class="quiz-mount" aria-hidden="true" data-quiz-controller="spotbug" />;
}
