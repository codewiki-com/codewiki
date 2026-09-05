import { useEffect } from 'preact/hooks';

import { formatCount } from '@/i18n';
import { EMPTY_PROGRESS, KEYS, readStore, type Progress, type QuizProgress } from '@/lib/prefs';
import type { Locale } from '@/lib/urls';

interface PracticeFiltersProps {
  locale: Locale;
  labels: {
    results: string;
    showMore: string;
    done: string;
    missed: string;
  };
}

type FilterName = 'type' | 'track' | 'level' | 'sort';

const DEFAULTS: Record<FilterName, string> = {
  type: 'all',
  track: 'all',
  level: 'all',
  sort: 'unsolved',
};

const LEVEL_RANK: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };

function safeQuizzes(progress: Progress): Record<string, QuizProgress> {
  return progress?.quizzes && typeof progress.quizzes === 'object' && !Array.isArray(progress.quizzes)
    ? progress.quizzes
    : {};
}

/** Client controller for server-rendered cards. It never creates or replaces a card. */
export default function PracticeFilters({ locale, labels }: PracticeFiltersProps) {
  useEffect(() => {
    const controlsRoot = document.querySelector<HTMLElement>('[data-practice-controls]');
    const grid = document.querySelector<HTMLElement>('[data-practice-grid]');
    if (!controlsRoot || !grid) return;

    const cards = [...grid.querySelectorAll<HTMLElement>('[data-practice-card]')];
    const count = document.querySelector<HTMLElement>('[data-practice-count]');
    const empty = document.querySelector<HTMLElement>('[data-practice-empty]');
    const moreButton = document.querySelector<HTMLButtonElement>('[data-practice-more]');
    const state: Record<FilterName, string> = { ...DEFAULTS };
    let expanded = false;

    const values = (name: FilterName) =>
      new Set(
        [...controlsRoot.querySelectorAll<HTMLElement>(`[data-filter-group="${name}"] [data-value]`)].map(
          (control) => control.dataset.value ?? DEFAULTS[name],
        ),
      );

    const readUrl = () => {
      const params = new URL(window.location.href).searchParams;
      for (const name of Object.keys(DEFAULTS) as FilterName[]) {
        const value = params.get(name);
        state[name] = value && values(name).has(value) ? value : DEFAULTS[name];
      }
    };

    const markCards = () => {
      const quizzes = safeQuizzes(readStore(KEYS.progress, EMPTY_PROGRESS));
      for (const card of cards) {
        const entry = card.dataset.id ? quizzes[card.dataset.id] : undefined;
        const status = card.querySelector<HTMLElement>('[data-practice-state]');
        card.classList.remove('done', 'missed');
        card.dataset.status = 'new';
        if (!status) continue;

        status.className = 'lbl practice-state';
        if (!entry || !Number.isFinite(entry.score) || !Number.isFinite(entry.total) || entry.total <= 0) {
          continue;
        }

        const done = entry.score >= entry.total;
        card.classList.add(done ? 'done' : 'missed');
        card.dataset.status = done ? 'done' : 'missed';
        status.className = `tag practice-state ${done ? 'ok' : 'warn'}`;
        status.textContent = done
          ? labels.done.replace('{score}', String(entry.score)).replace('{total}', String(entry.total))
          : labels.missed;
      }
    };

    /**
     * The DOM order the grid is currently in. Re-appending every card is a full layout of the
     * whole grid; on the old single-page catalogue that was 1,748 anchors on every filter tap.
     * Sorting is cheap, moving nodes is not, so the move only happens when the result differs.
     */
    let order: HTMLElement[] = [...cards];

    const orderCards = () => {
      const sorted = [...cards].sort((a, b) => {
        const original = Number(a.dataset.order) - Number(b.dataset.order);
        if (state.sort === 'hardest') {
          return (
            (LEVEL_RANK[b.dataset.level ?? ''] ?? 0) - (LEVEL_RANK[a.dataset.level ?? ''] ?? 0) || original
          );
        }
        if (state.sort === 'newest') return original;
        const aSolved = a.dataset.status === 'done' ? 1 : 0;
        const bSolved = b.dataset.status === 'done' ? 1 : 0;
        return aSolved - bSolved || original;
      });

      if (sorted.every((card, index) => card === order[index])) return;
      order = sorted;
      grid.append(...sorted);
    };

    const markControls = () => {
      for (const group of controlsRoot.querySelectorAll<HTMLElement>('[data-filter-group]')) {
        const name = group.dataset.filterGroup as FilterName | undefined;
        if (!name || !(name in state)) continue;
        for (const control of group.querySelectorAll<HTMLElement>('[data-value]')) {
          const on = control.dataset.value === state[name];
          control.classList.toggle('on', on);
          if (name === 'track') control.setAttribute('aria-pressed', String(on));
          else control.removeAttribute('aria-pressed');
          if (on) control.setAttribute('aria-current', 'true');
          else control.removeAttribute('aria-current');
        }
      }
    };

    const apply = () => {
      markCards();
      orderCards();
      markControls();

      let matches = 0;
      let done = 0;
      let more = 0;
      for (const card of cards) {
        const match =
          (state.type === 'all' || card.dataset.type === state.type) &&
          (state.track === 'all' || card.dataset.track === state.track) &&
          (state.level === 'all' || card.dataset.level === state.level);
        card.hidden = !match;
        if (!match) continue;
        matches += 1;
        if (card.dataset.status === 'done') done += 1;
        if (card.hasAttribute('data-more')) more += 1;
      }

      if (count) {
        count.textContent = labels.results
          .replace('{count}', formatCount(locale, matches, 'unit.exercise', 'unit.exercises'))
          .replace('{done}', String(done));
      }
      if (empty) empty.hidden = matches > 0;

      const collapsed = !expanded && more > 0;
      grid.classList.toggle('is-collapsed', collapsed);
      if (moreButton) {
        moreButton.hidden = !collapsed;
        moreButton.textContent = labels.showMore.replace('{count}', String(more));
      }
    };

    const writeUrl = () => {
      const url = new URL(window.location.href);
      for (const name of Object.keys(DEFAULTS) as FilterName[]) {
        if (state[name] === DEFAULTS[name]) url.searchParams.delete(name);
        else url.searchParams.set(name, state[name]);
      }
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    };

    const cleanups: Array<() => void> = [];
    for (const control of controlsRoot.querySelectorAll<HTMLElement>('[data-value]')) {
      const group = control.closest<HTMLElement>('[data-filter-group]');
      const name = group?.dataset.filterGroup as FilterName | undefined;
      if (!name || !(name in state)) continue;

      const select = (event: Event) => {
        event.preventDefault();
        state[name] = control.dataset.value ?? DEFAULTS[name];
        expanded = false;
        writeUrl();
        apply();
      };
      control.addEventListener('click', select);
      cleanups.push(() => control.removeEventListener('click', select));

      // The initially selected item is a span in server HTML, so make it keyboard-operable once
      // JavaScript turns the row into a live filter control.
      if (!(control instanceof HTMLAnchorElement)) {
        control.tabIndex = 0;
        control.setAttribute('role', 'button');
        const key = (event: KeyboardEvent) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          select(event);
        };
        control.addEventListener('keydown', key);
        cleanups.push(() => control.removeEventListener('keydown', key));
      }
    }

    const showAll = () => {
      expanded = true;
      apply();
    };
    moreButton?.addEventListener('click', showAll);

    const refresh = () => apply();
    const pop = () => {
      readUrl();
      expanded = false;
      apply();
    };
    document.addEventListener('cw:progress', refresh);
    window.addEventListener('popstate', pop);

    readUrl();
    apply();
    controlsRoot.dataset.ready = 'true';

    return () => {
      for (const cleanup of cleanups) cleanup();
      moreButton?.removeEventListener('click', showAll);
      document.removeEventListener('cw:progress', refresh);
      window.removeEventListener('popstate', pop);
    };
  }, [labels, locale]);

  return null;
}
