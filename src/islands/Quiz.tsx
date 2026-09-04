import { useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import {
  answerItem,
  gradeFill,
  gradeOptions,
  optionKey,
  persist,
  quizRoot,
  showAnswerStatus,
  type Locale,
  type PublicQuizItem,
  type QuizItem,
} from '@/islands/quiz-shared';

export interface QuizProps {
  bank: string;
  item: QuizItem | PublicQuizItem;
  locale: Locale;
  labels: Record<string, string>;
  onDone?: (score: number, total: number) => void;
  /** Checkpoints aggregate persistence after the last item instead. */
  persistResult?: boolean;
  /** Standalone katas fetch their answer bank only after the learner commits an answer. */
  loadAnswers?: boolean;
}

function showAnswer(
  root: HTMLElement,
  item: Extract<QuizItem, { type: 'mcq' | 'predict' | 'fill' }>,
  locale: Locale,
  labels: Record<string, string>,
  score: number,
  total: number,
): void {
  const result = root.querySelector<HTMLElement>('[data-result]');
  if (!result) return;
  const answer = document.createElement('div');
  answer.className = 'kata-answer';
  const heading = document.createElement('span');
  heading.className = 'lbl';
  heading.textContent = labels.answer ?? '';
  const value = document.createElement('p');
  value.textContent =
    item.type === 'fill' ? item.answer : (item.options.find((option) => option.correct)?.text[locale] ?? '');
  const explanation = document.createElement('p');
  explanation.dataset.explanation = '';
  explanation.textContent = item.explanation[locale];
  answer.append(heading, value, explanation);
  result.replaceChildren(answer);
  result.hidden = false;
  result.dataset.score = String(score);
  result.dataset.total = String(total);
  root.removeAttribute('aria-busy');
}

/** Multiple-choice, predict-the-output, and fill-in answer controller for a server KataShell. */
export default function Quiz({
  bank,
  item,
  locale,
  labels,
  onDone,
  persistResult = true,
  loadAnswers = false,
}: QuizProps) {
  const mount = useRef<HTMLDivElement>(null);
  const choice = useSignal<number | null>(null);
  const answered = useSignal(false);

  useEffect(() => {
    if (item.type !== 'mcq' && item.type !== 'predict' && item.type !== 'fill') return;
    const sentinel = mount.current;
    const root = quizRoot(sentinel);
    if (!root) return;

    const options = [...root.querySelectorAll<HTMLButtonElement>('[data-option]')];
    const submit = root.querySelector<HTMLButtonElement>('[data-submit]');
    const form = root.querySelector<HTMLFormElement>('[data-fill-form]');
    const input = root.querySelector<HTMLInputElement>('[data-fill]');
    let persisted = false;
    let loading = false;

    const paintChoice = () => {
      for (const [index, option] of options.entries()) {
        const selected = choice.value === index;
        option.classList.toggle('sel', selected && !answered.value);
        option.setAttribute('aria-pressed', String(selected));
      }
    };

    const select = (index: number) => {
      if (answered.value || !options[index]) return;
      choice.value = index;
      paintChoice();
    };

    const reveal = async () => {
      if (answered.value || loading) return;
      if (item.type !== 'fill' && choice.value === null) return;
      if (item.type === 'fill' && !input) return;

      loading = true;
      root.dataset.state = 'loading';
      if (submit) submit.disabled = true;
      showAnswerStatus(root, labels.loadingAnswer ?? '', true);

      let answer: QuizItem;
      try {
        answer = await answerItem(bank, item, loadAnswers);
      } catch {
        loading = false;
        root.dataset.state = 'idle';
        if (submit) submit.disabled = false;
        showAnswerStatus(root, labels.answersUnavailable ?? '', false);
        return;
      }
      if (answer.type !== 'mcq' && answer.type !== 'predict' && answer.type !== 'fill') return;

      let score: number;

      if (answer.type === 'fill') {
        score = Number(gradeFill(answer, input!.value));
        input!.classList.add(score ? 'ok' : 'bad');
        input!.disabled = true;
      } else {
        const grade = gradeOptions(answer, choice.value!);
        score = Number(grade.correct);
        for (const [index, option] of options.entries()) {
          option.classList.remove('sel');
          option.classList.toggle('ok', index === grade.correctIndex);
          option.classList.toggle('bad', index === choice.value && !grade.correct);
          option.disabled = true;
        }
      }

      answered.value = true;
      root.dataset.state = 'answered';
      if (submit) submit.hidden = true;
      showAnswer(root, answer, locale, labels, score, 1);
      if (!persisted) {
        persisted = true;
        if (persistResult) persist(bank, item.id, score, 1, answer, new Date());
        onDone?.(score, 1);
      }
    };

    const optionCleanups = options.map((option, index) => {
      const onClick = () => select(index);
      option.addEventListener('click', onClick);
      option.dataset.key = optionKey(index);
      return () => option.removeEventListener('click', onClick);
    });

    const onSubmit = (event: Event) => {
      event.preventDefault();
      reveal();
    };
    const onReveal = () => void reveal();
    submit?.addEventListener('click', onReveal);
    form?.addEventListener('submit', onSubmit);

    const onKeyDown = (event: KeyboardEvent) => {
      if (answered.value) return;
      const active = document.activeElement;
      if (active && active !== document.body && !root.contains(active)) return;
      if (item.type !== 'fill' && /^[1-9]$/.test(event.key)) {
        const index = Number(event.key) - 1;
        if (!options[index]) return;
        event.preventDefault();
        select(index);
        options[index].focus();
        return;
      }
      if (event.key === 'Enter' && item.type !== 'fill') {
        event.preventDefault();
        void reveal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    if (sentinel) sentinel.dataset.ready = 'true';

    return () => {
      for (const cleanup of optionCleanups) cleanup();
      submit?.removeEventListener('click', onReveal);
      form?.removeEventListener('submit', onSubmit);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [bank, item, labels, loadAnswers, locale, onDone, persistResult, answered, choice]);

  return <div ref={mount} class="quiz-mount" aria-hidden="true" data-quiz-controller="quiz" />;
}
