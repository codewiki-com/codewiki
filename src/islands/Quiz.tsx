import { useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import {
  gradeFill,
  gradeOptions,
  optionKey,
  persist,
  quizRoot,
  type Locale,
  type QuizItem,
} from '@/islands/quiz-shared';

export interface QuizProps {
  bank: string;
  item: QuizItem;
  locale: Locale;
  labels: Record<string, string>;
  onDone?: (score: number, total: number) => void;
  /** Checkpoints aggregate persistence after the last item instead. */
  persistResult?: boolean;
}

function showAnswer(root: HTMLElement, score: number, total: number): void {
  const template = root.querySelector<HTMLTemplateElement>('template[data-answer]');
  const result = root.querySelector<HTMLElement>('[data-result]');
  if (!template || !result) return;
  result.replaceChildren(template.content.cloneNode(true));
  result.hidden = false;
  result.dataset.score = String(score);
  result.dataset.total = String(total);
}

/** Multiple-choice, predict-the-output, and fill-in answer controller for a server KataShell. */
export default function Quiz({ bank, item, labels, onDone, persistResult = true }: QuizProps) {
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

    const reveal = () => {
      if (answered.value) return;
      let score: number;

      if (item.type === 'fill') {
        if (!input) return;
        score = Number(gradeFill(item, input.value));
        input.classList.add(score ? 'ok' : 'bad');
        input.disabled = true;
      } else {
        if (choice.value === null) return;
        const grade = gradeOptions(item, choice.value);
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
      showAnswer(root, score, 1);
      if (!persisted) {
        persisted = true;
        if (persistResult) persist(bank, item.id, score, 1, item, new Date());
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
    submit?.addEventListener('click', reveal);
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
        reveal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    if (sentinel) sentinel.dataset.ready = 'true';

    return () => {
      for (const cleanup of optionCleanups) cleanup();
      submit?.removeEventListener('click', reveal);
      form?.removeEventListener('submit', onSubmit);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [bank, item, labels, onDone, persistResult, answered, choice]);

  return <div ref={mount} class="quiz-mount" aria-hidden="true" data-quiz-controller="quiz" />;
}
