import { useEffect } from 'preact/hooks';

import { exportAll } from '@/lib/export';
import { nextStep, pathProgress, weeksLeft, type ProgressPath } from '@/lib/paths';
import {
  DEFAULT_PREFS,
  EMPTY_PROGRESS,
  KEYS,
  readStore,
  writeStore,
  type Plan,
  type Prefs,
  type Progress,
  type QuizProgress,
  type TopicProgress,
} from '@/lib/prefs';

export interface PathStateTopic {
  title: string;
  minutes: number;
  href?: string;
}

export interface PathStateMilestone {
  id: string;
  title: string;
  topics: string[];
  checkpoint: string;
  checkpointHref: string;
  checkpointLabel: string;
}

export interface PathStatePath extends ProgressPath {
  id: string;
  milestones: PathStateMilestone[];
}

export interface PathStateLabels {
  continue: string;
  progress: string;
  milestoneMeta: string;
  remaining: string;
  minutes: string;
  readPct: string;
  now: string;
  next: string;
  done: string;
  soon: string;
  shared: string;
}

export interface PathStateProps {
  path: PathStatePath;
  topics: Record<string, PathStateTopic>;
  labels: PathStateLabels;
  /** List cards only need their progress bar; detail pages opt into the full DOM contract. */
  mode?: 'detail' | 'list';
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Local storage is editable, so the pure helpers receive only record-shaped sections. */
function safeProgress(value: Progress): Progress {
  return {
    topics: record(value?.topics) as Record<string, TopicProgress>,
    quizzes: record(value?.quizzes) as Record<string, QuizProgress>,
    paths: record(value?.paths) as Progress['paths'],
  };
}

function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

function rootFor(id: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>('[data-path-root]')].find(
    (node) => node.dataset.pathRoot === id,
  );
}

function progressEntry(progress: Progress, id: string): TopicProgress | undefined {
  const entry = progress.topics[id];
  return entry && typeof entry === 'object' ? entry : undefined;
}

function readPercent(progress: Progress, id: string): number {
  const value = Number(progressEntry(progress, id)?.readPct);
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
}

function browserStore(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function exportProgress(): void {
  const storage = browserStore();
  if (!storage) return;
  const blob = new Blob([`${JSON.stringify(exportAll(storage), null, 2)}\n`], {
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
}

/** Finds a useful authored destination when the curriculum's exact next node is still planned. */
function reachableStep(path: PathStatePath, topics: Record<string, PathStateTopic>, progress: Progress) {
  const requested = nextStep(path, progress);
  if (requested.kind === 'checkpoint') {
    const milestone = path.milestones.find((item) => item.checkpoint === requested.id)!;
    return {
      href: milestone.checkpointHref,
      title: milestone.checkpointLabel,
    };
  }

  const ordered = path.milestones.flatMap((milestone) => milestone.topics);
  const from = Math.max(0, ordered.indexOf(requested.id));
  const isPending = (id: string) => !progressEntry(progress, id)?.completedAt;
  const id =
    ordered.slice(from).find((candidate) => topics[candidate]?.href && isPending(candidate)) ??
    ordered.find((candidate) => topics[candidate]?.href && isPending(candidate)) ??
    ordered.find((candidate) => topics[candidate]?.href);
  const topic = id ? topics[id] : undefined;
  return topic?.href ? { href: topic.href, title: topic.title } : undefined;
}

function updateList(root: HTMLElement, path: PathStatePath, progress: Progress): void {
  const state = pathProgress(path, progress);
  const bar = root.querySelector<HTMLElement>('[data-path-bar] > span');
  const ratio = state.total > 0 ? state.done / state.total : 0;
  if (bar) bar.style.width = `${Math.round(ratio * 100)}%`;
  const progressbar = root.querySelector<HTMLElement>('[data-path-bar]');
  progressbar?.setAttribute('aria-valuenow', String(state.done));
  const count = root.querySelector<HTMLElement>('[data-path-count]');
  if (count) count.textContent = `${state.done} / ${state.total}`;
}

/**
 * Adds local progress to server markup. It renders no UI and never reconstructs the SVG; every
 * update is an attribute, a text value or an ordinary link destination on markup Astro emitted.
 */
export default function PathState({ path, topics, labels, mode = 'detail' }: PathStateProps) {
  useEffect(() => {
    const root = rootFor(path.id);
    if (!root) return;

    let progress = safeProgress(readStore(KEYS.progress, EMPTY_PROGRESS));
    if (mode === 'detail' && !progress.paths[path.id]?.startedAt) {
      progress = {
        ...progress,
        paths: {
          ...progress.paths,
          [path.id]: { startedAt: new Date().toISOString() },
        },
      };
      writeStore(KEYS.progress, progress);
    }

    if (mode === 'list') {
      updateList(root, path, progress);
      return;
    }

    const planButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-plan]')];
    const cleanups: Array<() => void> = [];

    const updatePlan = (plan: Plan) => {
      const state = pathProgress(path, progress);
      const minutesLeft = path.milestones
        .flatMap((milestone) => milestone.topics)
        .reduce((sum, id) => sum + (state.states[id] === 'done' ? 0 : (topics[id]?.minutes ?? 10)), 0);
      const line = root.querySelector<HTMLElement>('[data-weeks]');
      if (line)
        line.textContent = fill(labels.remaining, {
          h: Math.ceil(minutesLeft / 60),
          w: weeksLeft(minutesLeft, plan),
        });
      planButtons.forEach((button) => {
        const on = Number(button.dataset.plan) === plan;
        button.classList.toggle('on', on);
        button.setAttribute('aria-checked', String(on));
        button.tabIndex = on ? 0 : -1;
      });
    };

    const apply = () => {
      progress = safeProgress(readStore(KEYS.progress, progress));
      const state = pathProgress(path, progress);
      const ratio = state.total > 0 ? state.done / state.total : 0;

      for (const node of root.querySelectorAll<SVGElement>('[data-topic]')) {
        const id = node.dataset.topic;
        if (!id) continue;
        const nodeState = state.states[id] ?? 'open';
        node.dataset.state = nodeState;
        const label = node.querySelector<SVGTextElement>('[data-node-label]');
        if (label) {
          const base = label.dataset.baseLabel ?? topics[id]?.title ?? id;
          const pct = readPercent(progress, id);
          label.textContent = pct > 0 && nodeState !== 'done' ? `${base} · ${pct}%` : base;
          const baseX = Number(label.dataset.baseX);
          if (Number.isFinite(baseX))
            label.setAttribute('x', String(baseX + (nodeState === 'done' ? 28 : 0)));
        }
      }

      for (const diamond of root.querySelectorAll<SVGElement>('[data-checkpoint]')) {
        const id = diamond.dataset.milestone;
        if (id) diamond.dataset.state = state.checkpoints[id] ?? 'locked';
      }

      for (const edge of root.querySelectorAll<SVGElement>('[data-edge-kind]')) {
        const from = edge.dataset.edgeFrom;
        const hot =
          edge.dataset.edgeKind === 'flow'
            ? Boolean(from && state.checkpoints[from] === 'passed')
            : Boolean(from && state.states[from] === 'done');
        edge.dataset.state = hot ? 'hot' : 'idle';
      }

      const ring = root.querySelector<SVGCircleElement>('[data-path-ring]');
      if (ring) {
        const circumference = Number(ring.dataset.circumference) || 0;
        ring.setAttribute('stroke-dashoffset', (circumference * (1 - ratio)).toFixed(1));
        ring.closest('[role="progressbar"]')?.setAttribute('aria-valuenow', String(state.done));
      }
      const percent = root.querySelector<SVGTextElement>('[data-path-percent]');
      if (percent) percent.textContent = `${Math.round(ratio * 100)}%`;
      const summary = root.querySelector<HTMLElement>('[data-path-summary]');
      if (summary)
        summary.textContent = fill(labels.progress, {
          done: state.done,
          total: state.total,
          milestone: state.milestone,
          milestones: path.milestones.length,
        });

      const destination = reachableStep(path, topics, progress);
      const continueLink = root.querySelector<HTMLAnchorElement>('[data-continue]');
      if (continueLink && destination) {
        continueLink.setAttribute('href', destination.href);
        continueLink.textContent = fill(labels.continue, { title: destination.title });
      }

      const currentIndex = Math.max(0, state.milestone - 1);
      for (const list of root.querySelectorAll<HTMLElement>('[data-milestone-list]')) {
        const milestoneIndex = Number(list.dataset.milestoneIndex);
        list.dataset.state = milestoneIndex === currentIndex ? 'active' : 'hidden';
        const milestone = path.milestones[milestoneIndex];
        const meta = list.querySelector<HTMLElement>('[data-milestone-meta]');
        if (milestone && meta) {
          const done = milestone.topics.filter((id) => state.states[id] === 'done').length;
          const minutes = milestone.topics.reduce((sum, id) => sum + (topics[id]?.minutes ?? 10), 0);
          meta.textContent = fill(labels.milestoneMeta, {
            done,
            total: milestone.topics.length,
            min: minutes,
          });
        }
      }

      for (const row of root.querySelectorAll<HTMLElement>('[data-topic-row]')) {
        const id = row.dataset.topicRow;
        if (!id) continue;
        const rowState = state.states[id] ?? 'open';
        row.dataset.state = rowState;
        const tag = row.querySelector<HTMLElement>('[data-row-tag]');
        const meta = row.querySelector<HTMLElement>('[data-row-meta]');
        const authored = row.dataset.authored === 'true';
        const milestone = path.milestones.find((item) => item.id === row.dataset.milestone);
        const position = (milestone?.topics.indexOf(id) ?? -1) + 1;
        const currentPosition = milestone?.topics.findIndex((topicId) => state.states[topicId] === 'cur');
        const isNext =
          currentPosition !== undefined && currentPosition >= 0 && position === currentPosition + 2;
        tag?.classList.toggle('acc', authored && rowState === 'cur');
        tag?.classList.toggle('ok', authored && rowState === 'done');
        if (tag)
          tag.textContent = !authored
            ? labels.soon
            : rowState === 'done'
              ? labels.done
              : rowState === 'cur'
                ? labels.now
                : rowState === 'open' && isNext
                  ? labels.next
                  : String(position);
        if (meta) {
          const min = topics[id]?.minutes ?? 10;
          const pct = readPercent(progress, id);
          meta.textContent =
            authored && pct > 0 && rowState !== 'done'
              ? fill(labels.readPct, { min, pct })
              : fill(labels.minutes, { min });
        }
      }

      for (const row of root.querySelectorAll<HTMLElement>('[data-checkpoint-row]')) {
        const id = row.dataset.milestone;
        if (id) row.dataset.state = state.checkpoints[id] ?? 'locked';
      }

      const prefs = readStore<Prefs>(KEYS.prefs, DEFAULT_PREFS);
      updatePlan(prefs.plan ?? DEFAULT_PREFS.plan!);
    };

    const selectPlan = (plan: Plan, focus = false) => {
      writeStore<Prefs>(KEYS.prefs, { ...readStore(KEYS.prefs, DEFAULT_PREFS), plan });
      updatePlan(plan);
      if (focus) planButtons.find((button) => Number(button.dataset.plan) === plan)?.focus();
    };

    planButtons.forEach((button, index) => {
      const onClick = () => selectPlan(Number(button.dataset.plan) as Plan);
      const onKeyDown = (event: KeyboardEvent) => {
        const delta =
          event.key === 'ArrowRight' || event.key === 'ArrowDown'
            ? 1
            : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
              ? -1
              : event.key === 'Home'
                ? -index
                : event.key === 'End'
                  ? planButtons.length - 1 - index
                  : 0;
        if (!delta) return;
        event.preventDefault();
        const next = (index + delta + planButtons.length) % planButtons.length;
        selectPlan(Number(planButtons[next]!.dataset.plan) as Plan, true);
      };
      button.addEventListener('click', onClick);
      button.addEventListener('keydown', onKeyDown);
      cleanups.push(() => {
        button.removeEventListener('click', onClick);
        button.removeEventListener('keydown', onKeyDown);
      });
    });

    const exportButton = root.querySelector<HTMLButtonElement>('[data-path-export]');
    exportButton?.addEventListener('click', exportProgress);
    cleanups.push(() => exportButton?.removeEventListener('click', exportProgress));

    const shareButton = root.querySelector<HTMLButtonElement>('[data-path-share]');
    const share = async () => {
      try {
        if (navigator.share) await navigator.share({ title: document.title, url: location.href });
        else await navigator.clipboard.writeText(location.href);
        if (shareButton) shareButton.textContent = labels.shared;
      } catch {
        // Dismissing a share sheet or denying clipboard access leaves the original label in place.
      }
    };
    shareButton?.addEventListener('click', share);
    cleanups.push(() => shareButton?.removeEventListener('click', share));

    document.addEventListener('cw:progress', apply);
    cleanups.push(() => document.removeEventListener('cw:progress', apply));
    apply();

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [labels, mode, path, topics]);

  return null;
}
