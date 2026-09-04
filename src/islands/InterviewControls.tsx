import { useEffect } from 'preact/hooks';

import AskAI, { type AskAIContext, type AskAILabels } from '@/islands/AskAI';
import {
  DEFAULT_PREFS,
  EMPTY_FLASHCARDS,
  EMPTY_PROGRESS,
  KEYS,
  readStore,
  writeStore,
  type Flashcards,
  type Prefs,
  type Progress,
  type RevealMode,
} from '@/lib/prefs';
import { enqueueCards, quizCardId, recordQuiz } from '@/lib/score';

interface InterviewControlsProps {
  track: string;
  questionList: string;
  labels: {
    seenCount: string;
    copied: string;
    copyFailed: string;
  };
  aiLabels: AskAILabels;
  aiContext: AskAIContext;
}

type InteractiveControl = HTMLElement & { disabled?: boolean };

function safeProgress(value: Progress): Progress {
  const object = (candidate: unknown) =>
    typeof candidate === 'object' && candidate !== null && !Array.isArray(candidate);
  return {
    topics: object(value?.topics) ? value.topics : {},
    quizzes: object(value?.quizzes) ? value.quizzes : {},
    paths: object(value?.paths) ? value.paths : {},
    ...(object(value?.feedback) ? { feedback: value.feedback } : {}),
  };
}

function safeDeck(value: Flashcards): Flashcards {
  return { cards: Array.isArray(value?.cards) ? value.cards : [] };
}

/** Client controller for the bank's server-rendered details, controls, rail and storage actions. */
export default function InterviewControls({
  track,
  questionList,
  labels,
  aiLabels,
  aiContext,
}: InterviewControlsProps) {
  useEffect(() => {
    const bank = [...document.querySelectorAll<HTMLElement>('[data-interview-bank]')].find(
      (candidate) => candidate.dataset.interviewBank === track,
    );
    if (!bank) return;

    const questions = [...bank.querySelectorAll<HTMLDetailsElement>('details.q[data-id]')];
    const levelGroup = bank.querySelector<HTMLElement>('[data-interview-levels]');
    const revealGroup = bank.querySelector<HTMLElement>('[data-interview-reveal]');
    const filter = bank.querySelector<HTMLInputElement>('[data-interview-filter]');
    const shuffle = bank.querySelector<HTMLButtonElement>('[data-interview-shuffle]');
    const addAll = bank.querySelector<HTMLButtonElement>('[data-add-all]');
    const count = bank.querySelector<HTMLElement>('[data-progress-count]');
    const bar = bank.querySelector<HTMLElement>('[data-progress-bar]');
    const empty = bank.querySelector<HTMLElement>('[data-interview-empty]');
    let progress = safeProgress(readStore<Progress>(KEYS.progress, EMPTY_PROGRESS));
    let level = 'all';
    let query = '';
    let filterTimer: ReturnType<typeof setTimeout> | undefined;

    const prefs = readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS);
    let reveal: RevealMode = prefs.interviewReveal ?? 'one';

    const progressId = (question: HTMLDetailsElement) => `interview/${track}/${question.dataset.id ?? ''}`;

    const markControls = (group: HTMLElement | null, selected: string) => {
      for (const control of group?.querySelectorAll<HTMLElement>('[data-value]') ?? []) {
        const on = control.dataset.value === selected;
        control.classList.toggle('on', on);
        control.setAttribute('aria-pressed', String(on));
        if (on) control.setAttribute('aria-current', 'true');
        else control.removeAttribute('aria-current');
      }
    };

    const paintProgress = () => {
      let seen = 0;
      for (const question of questions) {
        const isSeen = Boolean(progress.quizzes[progressId(question)]);
        question.querySelector<HTMLElement>('[data-seen]')!.hidden = !isSeen;
        question.classList.toggle('seen', isSeen);
        if (isSeen) seen += 1;
      }

      if (count) {
        count.textContent = labels.seenCount
          .replace('{seen}', String(seen))
          .replace('{total}', String(questions.length));
      }
      if (bar) bar.style.width = `${questions.length ? (seen / questions.length) * 100 : 0}%`;

      for (const section of bank.querySelectorAll<HTMLElement>('[data-interview-section]')) {
        const sectionQuestions = [...section.querySelectorAll<HTMLDetailsElement>('details.q[data-id]')];
        const sectionSeen = sectionQuestions.filter((question) =>
          Boolean(progress.quizzes[progressId(question)]),
        ).length;
        const label = section.querySelector<HTMLElement>('[data-section-seen]');
        const value = section.querySelector<HTMLElement>('[data-section-seen-count]');
        if (label) label.hidden = sectionSeen === 0;
        if (value) value.textContent = String(sectionSeen);
      }
    };

    const recordSeen = (question: HTMLDetailsElement) => {
      const id = progressId(question);
      if (progress.quizzes[id]) return;
      progress = recordQuiz(progress, id, 1, 1, new Date());
      writeStore(KEYS.progress, progress);
      paintProgress();
      document.dispatchEvent(new CustomEvent('cw:progress'));
    };

    const applyFilters = () => {
      for (const question of questions) {
        const text = question.querySelector<HTMLElement>('.q-question')?.textContent ?? '';
        const matchesLevel = level === 'all' || question.dataset.level === level;
        const matchesText = text.toLocaleLowerCase().includes(query);
        question.hidden = !(matchesLevel && matchesText);
      }

      for (const section of bank.querySelectorAll<HTMLElement>('[data-interview-section]')) {
        const visible = [...section.querySelectorAll<HTMLDetailsElement>('details.q')].some(
          (question) => !question.hidden,
        );
        section.hidden = !visible;
        const toc = bank.querySelector<HTMLElement>(
          `[data-section-link="${section.dataset.interviewSection ?? ''}"]`,
        );
        if (toc) toc.hidden = !visible;
      }
      if (empty) empty.hidden = questions.some((question) => !question.hidden);
    };

    const selectLevel = (control: HTMLElement) => {
      level = control.dataset.value ?? 'all';
      markControls(levelGroup, level);
      applyFilters();
    };

    const selectReveal = (control: HTMLElement) => {
      const value = control.dataset.value;
      if (value !== 'one' && value !== 'all') return;
      reveal = value;
      markControls(revealGroup, reveal);
      writeStore(KEYS.prefs, { ...prefs, interviewReveal: reveal });
      if (reveal === 'all') for (const question of questions) question.open = true;
    };

    const makeInteractive = (
      group: HTMLElement | null,
      select: (control: HTMLElement) => void,
    ): Array<() => void> => {
      const cleanups: Array<() => void> = [];
      for (const control of group?.querySelectorAll<HTMLElement>('[data-value]') ?? []) {
        control.tabIndex = 0;
        control.setAttribute('role', 'button');
        const click = () => select(control);
        const keydown = (event: KeyboardEvent) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          select(control);
        };
        control.addEventListener('click', click);
        control.addEventListener('keydown', keydown);
        cleanups.push(() => {
          control.removeEventListener('click', click);
          control.removeEventListener('keydown', keydown);
        });
      }
      return cleanups;
    };

    const onToggle = (event: Event) => {
      const question = event.currentTarget as HTMLDetailsElement;
      if (!question.open) return;
      if (reveal === 'one') {
        for (const other of questions) if (other !== question) other.open = false;
      }
      recordSeen(question);
    };

    const addCards = (ids: string[], button?: InteractiveControl) => {
      const deck = safeDeck(readStore<Flashcards>(KEYS.flashcards, EMPTY_FLASHCARDS));
      const cards = ids.map((id) => {
        const ref = quizCardId(`interview/${track}`, id);
        return { id: ref, kind: 'quiz' as const, ref, source: 'manual' as const };
      });
      writeStore(KEYS.flashcards, enqueueCards(deck, cards, new Date()));
      if (button) {
        button.disabled = true;
        button.setAttribute('aria-pressed', 'true');
      }
    };

    const cleanups = [
      ...makeInteractive(levelGroup, selectLevel),
      ...makeInteractive(revealGroup, selectReveal),
    ];

    for (const question of questions) {
      question.addEventListener('toggle', onToggle);
      cleanups.push(() => question.removeEventListener('toggle', onToggle));
      const add = question.querySelector<HTMLButtonElement>('[data-add-card]');
      const addOne = () => addCards([question.dataset.id ?? ''], add ?? undefined);
      add?.addEventListener('click', addOne);
      cleanups.push(() => add?.removeEventListener('click', addOne));

      const copy = question.querySelector<HTMLButtonElement>('[data-copy-qa]');
      const copyQa = () => {
        if (!copy) return;
        const original = copy.textContent ?? '';
        const markdown = `## ${copy.dataset.question ?? ''}\n\n${(copy.dataset.answer ?? '').trim()}\n`;
        navigator.clipboard
          .writeText(markdown)
          .then(() => {
            copy.textContent = labels.copied;
          })
          .catch(() => {
            copy.textContent = labels.copyFailed;
          })
          .finally(() => {
            window.setTimeout(() => {
              copy.textContent = original;
            }, 1500);
          });
      };
      copy?.addEventListener('click', copyQa);
      cleanups.push(() => copy?.removeEventListener('click', copyQa));
    }

    const onFilter = () => {
      if (filterTimer) clearTimeout(filterTimer);
      filterTimer = setTimeout(() => {
        query = (filter?.value ?? '').trim().toLocaleLowerCase();
        applyFilters();
      }, 150);
    };
    filter?.addEventListener('input', onFilter);

    const shuffleQuestions = () => {
      for (const list of bank.querySelectorAll<HTMLElement>('[data-question-list]')) {
        const rows = [...list.querySelectorAll<HTMLDetailsElement>(':scope > details.q')];
        const original = rows.map((row) => row.dataset.id);
        for (let index = rows.length - 1; index > 0; index -= 1) {
          const other = Math.floor(Math.random() * (index + 1));
          [rows[index], rows[other]] = [rows[other]!, rows[index]!];
        }
        // A shuffle action should have a visible result even when the random order repeats.
        if (rows.length > 1 && rows.every((row, index) => row.dataset.id === original[index])) {
          rows.push(rows.shift()!);
        }
        list.append(...rows);
      }
    };
    shuffle?.addEventListener('click', shuffleQuestions);

    const addEveryCard = () => {
      addCards(
        questions.map((question) => question.dataset.id ?? ''),
        addAll ?? undefined,
      );
      for (const button of bank.querySelectorAll<HTMLButtonElement>('[data-add-card]')) {
        button.disabled = true;
        button.setAttribute('aria-pressed', 'true');
      }
    };
    addAll?.addEventListener('click', addEveryCard);

    markControls(levelGroup, level);
    markControls(revealGroup, reveal);
    if (reveal === 'all') for (const question of questions) question.open = true;
    paintProgress();
    applyFilters();
    bank.dataset.ready = 'true';

    return () => {
      if (filterTimer) clearTimeout(filterTimer);
      for (const cleanup of cleanups) cleanup();
      filter?.removeEventListener('input', onFilter);
      shuffle?.removeEventListener('click', shuffleQuestions);
      addAll?.removeEventListener('click', addEveryCard);
    };
  }, [labels, track]);

  return (
    <AskAI
      labels={aiLabels}
      context={{ ...aiContext, sectionText: questionList.slice(0, 6_000) }}
      preset="quiz"
    />
  );
}
