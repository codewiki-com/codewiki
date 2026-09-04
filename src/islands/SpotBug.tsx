import { useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import {
  answerItem,
  fillSlots,
  gradeLines,
  mountCodeLines,
  persist,
  quizRoot,
  showAnswerStatus,
  type Issue,
  type Locale,
  type PublicQuizItem,
  type QuizItem,
} from '@/islands/quiz-shared';

export interface SpotBugProps {
  bank: string;
  item: QuizItem | PublicQuizItem;
  locale: Locale;
  labels: Record<string, string>;
  onDone?: (score: number, total: number) => void;
  /** Checkpoints aggregate persistence after the last item instead. */
  persistResult?: boolean;
  loadAnswers?: boolean;
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

function showExplanation(
  root: HTMLElement,
  item: Extract<QuizItem, { type: 'spotbug' }>,
  locale: Locale,
  score: number,
  total: number,
): void {
  const result = root.querySelector<HTMLElement>('[data-result]');
  if (!result) return;
  const explanation = document.createElement('p');
  explanation.dataset.explanation = '';
  explanation.textContent = item.explanation[locale];
  result.replaceChildren(explanation);
  result.hidden = false;
  result.dataset.score = String(score);
  result.dataset.total = String(total);
  root.removeAttribute('aria-busy');
}

/** Clickable line-gutter controller for spot-the-bug kata shells. */
export default function SpotBug({
  bank,
  item,
  locale,
  labels,
  onDone,
  persistResult = true,
  loadAnswers = false,
}: SpotBugProps) {
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
    let loading = false;
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

    const reveal = async () => {
      if (answered.value || loading) return;
      loading = true;
      root.dataset.state = 'loading';
      if (revealButton) revealButton.disabled = true;
      showAnswerStatus(root, labels.loadingAnswer ?? '', true);

      let answer: QuizItem;
      try {
        answer = await answerItem(bank, item, loadAnswers);
      } catch {
        loading = false;
        root.dataset.state = 'idle';
        if (revealButton) revealButton.disabled = false;
        showAnswerStatus(root, labels.answersUnavailable ?? '', false);
        return;
      }
      if (answer.type !== 'spotbug') return;

      answered.value = true;
      const grade = gradeLines(answer, marked.value);
      const found = new Set(grade.found);
      root.dataset.state = 'answered';
      if (revealButton) revealButton.hidden = true;

      for (const line of mounted.lines) {
        const issue = answer.issues.find((candidate) => inIssue(line.line, candidate));
        line.row.classList.remove('marked');
        line.row.classList.toggle('hit', Boolean(issue && found.has(issue)));
        line.row.classList.toggle('miss', Boolean(issue && !found.has(issue)));
        line.marker.disabled = true;
      }

      for (const issue of answer.issues) {
        const anchor = mounted.lines.find((line) => line.line === (issue.lines ?? issue.line))?.row;
        if (!anchor) continue;
        const issueNote = note(issue, locale, labels[`kind.${issue.kind}`] ?? '');
        anchor.after(issueNote);
        addedNotes.push(issueNote);
      }

      showExplanation(root, answer, locale, grade.score, grade.total);
      if (!persisted) {
        persisted = true;
        if (persistResult) persist(bank, item.id, grade.score, grade.total, answer, new Date());
        onDone?.(grade.score, grade.total);
      }
    };

    const onReveal = () => void reveal();
    revealButton?.addEventListener('click', onReveal);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || answered.value) return;
      const active = document.activeElement;
      if (active && active !== document.body && !root.contains(active)) return;
      event.preventDefault();
      void reveal();
    };
    window.addEventListener('keydown', onKeyDown);
    if (sentinel) sentinel.dataset.ready = 'true';

    return () => {
      revealButton?.removeEventListener('click', onReveal);
      window.removeEventListener('keydown', onKeyDown);
      for (const issueNote of addedNotes) issueNote.remove();
      mounted.undo();
    };
  }, [bank, item, labels, loadAnswers, locale, onDone, persistResult, answered, marked]);

  return <div ref={mount} class="quiz-mount" aria-hidden="true" data-quiz-controller="spotbug" />;
}
