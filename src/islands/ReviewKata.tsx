import { useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { formatCount } from '@/i18n';
import { enqueueCards, quizCardId } from '@/lib/score';
import { EMPTY_FLASHCARDS, KEYS, readStore, writeStore, type Flashcards } from '@/lib/prefs';
import {
  fillSlots,
  gradeLines,
  mountCodeLines,
  persist,
  quizRoot,
  type GradeLinesResult,
  type Issue,
  type Locale,
  type QuizItem,
} from '@/islands/quiz-shared';

export interface ReviewKataProps {
  bank: string;
  item: QuizItem;
  locale: Locale;
  labels: Record<string, string>;
  onDone?: (score: number, total: number) => void;
}

function inIssue(line: number, issue: Issue): boolean {
  return line >= issue.line && line <= (issue.lines ?? issue.line);
}

function issueTag(issue: Issue, text: string): HTMLSpanElement {
  const tag = document.createElement('span');
  const tone =
    issue.kind === 'security'
      ? 'bad'
      : issue.kind === 'correctness' || issue.kind === 'edge-case'
        ? 'warn'
        : '';
  tag.className = `tag ${tone}`;
  tag.textContent = text;
  return tag;
}

function note(className: string, tagText: string, text: string, issue?: Issue): HTMLSpanElement {
  const row = document.createElement('span');
  row.className = className;
  const tag = issue ? issueTag(issue, tagText) : document.createElement('span');
  if (!issue) {
    tag.className = 'tag';
    tag.textContent = tagText;
  }
  const body = document.createElement('span');
  body.textContent = text;
  row.append(tag, body);
  return row;
}

function panel(label: string, body: string): HTMLDivElement {
  const node = document.createElement('div');
  node.className = 'panel review-panel';
  const heading = document.createElement('span');
  heading.className = 'lbl';
  heading.textContent = label;
  const text = document.createElement('p');
  text.textContent = body;
  node.append(heading, text);
  return node;
}

function scoreRing(score: number, total: number, label: string): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.classList.add('ring');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  const track = document.createElementNS(ns, 'circle');
  track.setAttribute('cx', '32');
  track.setAttribute('cy', '32');
  track.setAttribute('r', '26');
  track.setAttribute('class', 'ring-track');
  const scoreArc = document.createElementNS(ns, 'circle');
  scoreArc.setAttribute('cx', '32');
  scoreArc.setAttribute('cy', '32');
  scoreArc.setAttribute('r', '26');
  scoreArc.setAttribute('class', 'ring-score');
  const circumference = 2 * Math.PI * 26;
  scoreArc.setAttribute('stroke-dasharray', String(circumference));
  scoreArc.setAttribute('stroke-dashoffset', String(circumference * (1 - score / total)));
  const text = document.createElementNS(ns, 'text');
  text.setAttribute('x', '32');
  text.setAttribute('y', '37');
  text.setAttribute('text-anchor', 'middle');
  text.textContent = `${score}/${total}`;
  svg.append(track, scoreArc, text);
  return svg;
}

/** Four-stage code-review controller; learner comments intentionally live only in this instance. */
export default function ReviewKata({ bank, item, locale, labels, onDone }: ReviewKataProps) {
  const mount = useRef<HTMLDivElement>(null);
  const step = useSignal(1);
  const marked = useSignal<number[]>([]);

  useEffect(() => {
    if (item.type !== 'review') return;
    const sentinel = mount.current;
    const root = quizRoot(sentinel);
    if (!root) return;
    const next = root.querySelector<HTMLButtonElement>('[data-review-next]');
    const comments = root.querySelector<HTMLElement>('[data-review-comments]');
    const compare = root.querySelector<HTMLElement>('[data-review-compare]');
    const stepNodes = [...root.querySelectorAll<HTMLElement>('[data-step]')];
    const values = new Map<number, string>();
    const addedNotes: HTMLElement[] = [];
    let grade: GradeLinesResult | undefined;
    let persisted = false;

    const mounted = mountCodeLines(
      root,
      (line) => fillSlots(labels.markLine ?? '', { line }),
      (line) => {
        if (step.value !== 2) return;
        marked.value = marked.value.includes(line)
          ? marked.value.filter((value) => value !== line)
          : [...marked.value, line];
        paintLines();
      },
    );

    const paintLines = () => {
      const selected = new Set(marked.value);
      for (const line of mounted.lines) {
        const on = selected.has(line.line);
        line.row.classList.toggle('marked', on);
        line.marker.setAttribute('aria-pressed', String(on));
        line.marker.disabled = step.value !== 2;
      }
    };

    const paintSteps = () => {
      for (const node of stepNodes) {
        const value = Number(node.dataset.step);
        node.classList.toggle('on', value === step.value);
        node.classList.toggle('done', value < step.value);
        const number = node.querySelector<HTMLElement>('.n');
        if (number) number.textContent = value < step.value ? '✓' : String(value);
      }
      if (next) {
        const key = step.value === 1 ? 'markLines' : step.value === 2 ? 'writeReview' : 'compare';
        next.textContent = labels[key] ?? '';
        next.hidden = step.value === 4;
      }
      paintLines();
    };

    const renderCommentFields = () => {
      if (!comments) return;
      comments.replaceChildren();
      comments.hidden = false;
      for (const line of [...marked.value].sort((a, b) => a - b)) {
        const label = document.createElement('label');
        label.className = 'review-comment';
        const caption = document.createElement('span');
        caption.className = 'lbl';
        caption.textContent = fillSlots(labels.line ?? '', { line });
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'field';
        input.value = values.get(line) ?? '';
        input.setAttribute('aria-label', fillSlots(labels.commentLine ?? '', { line }));
        input.addEventListener('input', () => values.set(line, input.value));
        label.append(caption, input);
        comments.append(label);
      }
      if (marked.value.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'review-empty';
        empty.textContent = labels.noLines ?? '';
        comments.append(empty);
      }
    };

    const appendReviewNotes = (result: GradeLinesResult) => {
      const found = new Set(result.found);
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
        const learner = marked.value
          .filter((line) => inIssue(line, issue))
          .map((line) => values.get(line)?.trim())
          .filter((value): value is string => Boolean(value));
        const expert = note('note expert', labels[`kind.${issue.kind}`] ?? '', issue.note[locale], issue);
        anchor.after(expert);
        addedNotes.push(expert);
        if (learner.length) {
          const own = note('note', labels.you ?? '', learner.join(' '));
          expert.before(own);
          addedNotes.push(own);
        }
      }
    };

    const addMissedCards = () => {
      if (!grade?.missed.length) return;
      try {
        const deck = readStore<Flashcards>(KEYS.flashcards, EMPTY_FLASHCARDS);
        const base = quizCardId(bank, item.id);
        const cards = grade.missed.map((issue) => {
          const id = `${base}:${issue.line}`;
          return { id, kind: 'quiz' as const, ref: id, source: 'quiz' as const };
        });
        writeStore(KEYS.flashcards, enqueueCards(deck, cards, new Date()));
        const button = compare?.querySelector<HTMLButtonElement>('[data-add-missed]');
        if (button) {
          button.textContent = labels.added ?? '';
          button.disabled = true;
        }
      } catch {
        // A blocked store does not make the comparison unusable.
      }
    };

    const renderCompare = () => {
      if (!compare) return;
      grade = gradeLines(item, marked.value);
      appendReviewNotes(grade);
      compare.replaceChildren();
      compare.hidden = false;
      compare.dataset.score = String(grade.score);
      compare.dataset.total = String(grade.total);

      const score = document.createElement('div');
      score.className = 'panel review-score';
      const scoreLabel = fillSlots(labels.score ?? '', {
        score: grade.score,
        count: formatCount(locale, grade.total, 'unit.issue', 'unit.issues'),
      });
      score.append(scoreRing(grade.score, grade.total, scoreLabel));
      const summary = document.createElement('strong');
      summary.textContent = scoreLabel;
      score.append(summary);
      compare.append(score);

      if (item.right) compare.append(panel(labels.modelRight ?? '', item.right[locale]));

      if (item.checklist.length) {
        const checklist = document.createElement('div');
        checklist.className = 'panel review-panel review-checklist';
        const heading = document.createElement('span');
        heading.className = 'lbl';
        heading.textContent = labels.checklist ?? '';
        checklist.append(heading);
        const found = new Set(grade.found);
        for (const [index, entry] of item.checklist.entries()) {
          const row = document.createElement('label');
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'chk';
          checkbox.checked = Boolean(item.issues[index] && found.has(item.issues[index]));
          checkbox.disabled = true;
          row.append(checkbox, document.createTextNode(entry[locale]));
          checklist.append(row);
        }
        compare.append(checklist);
      }

      const template = root.querySelector<HTMLTemplateElement>('template[data-answer]');
      const explanation = template?.content.querySelector<HTMLElement>('[data-explanation]');
      if (explanation) compare.append(explanation.cloneNode(true));

      if (grade.missed.length) {
        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'btn btn-g';
        add.dataset.addMissed = '';
        add.textContent = labels.addMissed ?? '';
        add.addEventListener('click', addMissedCards);
        compare.append(add);
      }

      root.dataset.state = 'answered';
      if (!persisted) {
        persisted = true;
        persist(bank, item.id, grade.score, grade.total, item, new Date());
        onDone?.(grade.score, grade.total);
      }
    };

    const advance = () => {
      if (step.value >= 4) return;
      step.value += 1;
      if (step.value === 3) renderCommentFields();
      if (step.value === 4) {
        if (comments) comments.hidden = true;
        renderCompare();
      }
      paintSteps();
    };

    next?.addEventListener('click', advance);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || step.value >= 4) return;
      const active = document.activeElement;
      if (active && active !== document.body && !root.contains(active)) return;
      event.preventDefault();
      advance();
    };
    window.addEventListener('keydown', onKeyDown);
    paintSteps();
    if (sentinel) sentinel.dataset.ready = 'true';

    return () => {
      next?.removeEventListener('click', advance);
      window.removeEventListener('keydown', onKeyDown);
      for (const added of addedNotes) added.remove();
      mounted.undo();
    };
  }, [bank, item, labels, locale, onDone, marked, step]);

  return <div ref={mount} class="quiz-mount" aria-hidden="true" data-quiz-controller="review" />;
}
