import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import Quiz from '@/islands/Quiz';
import SpotBug from '@/islands/SpotBug';
import { fillSlots, type Locale, type QuizItem } from '@/islands/quiz-shared';
import { completeTopic, enqueueCards, passed, quizCardId, recordQuiz } from '@/lib/score';
import {
  EMPTY_FLASHCARDS,
  EMPTY_PROGRESS,
  KEYS,
  flushStore,
  readStore,
  writeStore,
  type Flashcards,
  type Progress,
} from '@/lib/prefs';

type CheckpointItem = Exclude<QuizItem, Extract<QuizItem, { type: 'review' }>>;

interface Labels extends Record<string, string> {
  result: string;
  passed: string;
  failed: string;
  addMisses: string;
  continue: string;
  backToTrack: string;
}

export interface CheckpointProps {
  bankId: string;
  topicId: string;
  locale: Locale;
  labels: Labels;
  nextTitle?: string;
  nextHref?: string;
  trackHref: string;
}

function checkpointItems(root: HTMLElement): CheckpointItem[] {
  try {
    const text = root.querySelector<HTMLScriptElement>('script[data-checkpoint-items]')?.textContent;
    if (!text) return [];
    const value: unknown = JSON.parse(text);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is CheckpointItem =>
        typeof item === 'object' &&
        item !== null &&
        'type' in item &&
        (item.type === 'mcq' || item.type === 'predict' || item.type === 'spotbug' || item.type === 'fill'),
    );
  } catch {
    return [];
  }
}

function Code({ item }: { item: Extract<CheckpointItem, { type: 'predict' | 'spotbug' }> }) {
  const lines = item.code.replace(/\n$/, '').split('\n');
  return (
    <div class="kata-code" data-code>
      <div class="codebox">
        <pre>
          <code>
            {lines.map((line) => (
              <span class="line">
                {line || ' '}
                {'\n'}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

function ItemShell({
  bankId,
  item,
  locale,
  labels,
  onDone,
}: {
  bankId: string;
  item: CheckpointItem;
  locale: Locale;
  labels: Labels;
  onDone: (score: number, total: number) => void;
}) {
  const hasOptions = item.type === 'mcq' || item.type === 'predict';
  const correct = hasOptions ? item.options.find((option) => option.correct) : undefined;
  const hasCode = item.type === 'predict' || item.type === 'spotbug';

  return (
    <section class="kata-shell checkpoint-item" data-quiz={`${bankId}#${item.id}`} data-state="idle">
      <h3 class="q-prompt">{item.prompt[locale]}</h3>
      {hasCode && <Code item={item} />}

      {hasOptions && (
        <ol class="quiz-options" data-options>
          {item.options.map((option, index) => (
            <li>
              <button
                type="button"
                class="opt"
                data-option={index}
                aria-pressed="false"
                aria-label={`${index + 1}. ${option.text[locale]}`}
              >
                <span class="r" aria-hidden="true" />
                <span>{option.text[locale]}</span>
              </button>
            </li>
          ))}
        </ol>
      )}

      {item.type === 'fill' && (
        <form class="quiz-fill" data-fill-form>
          <input class="field" type="text" data-fill aria-label={labels.yourAnswer} autoComplete="off" />
          <button class="btn btn-p" type="submit">
            {labels.check}
          </button>
        </form>
      )}

      {hasOptions && (
        <button class="btn btn-p kata-submit" type="button" data-submit>
          {labels.check}
        </button>
      )}
      {item.type === 'spotbug' && (
        <button class="btn btn-p" type="button" data-reveal>
          {labels.reveal}
        </button>
      )}

      <div class="kata-result" data-result aria-live="polite" hidden />
      <template data-answer>
        <div class="kata-answer">
          <span class="lbl">{labels.answer}</span>
          {correct && <p>{correct.text[locale]}</p>}
          {item.type === 'fill' && <p>{item.answer}</p>}
          {item.type === 'spotbug' && (
            <ul>
              {item.issues.map((issue) => (
                <li>
                  <span class="tag">{labels[`kind.${issue.kind}`]}</span>
                  {issue.note[locale]}
                </li>
              ))}
            </ul>
          )}
          <p data-explanation>{item.explanation[locale]}</p>
        </div>
      </template>

      {item.type === 'spotbug' ? (
        <SpotBug
          bank={bankId}
          item={item}
          locale={locale}
          labels={labels}
          persistResult={false}
          onDone={onDone}
        />
      ) : (
        <Quiz
          bank={bankId}
          item={item}
          locale={locale}
          labels={labels}
          persistResult={false}
          onDone={onDone}
        />
      )}
    </section>
  );
}

/** One aggregate checkpoint attempt, with the existing item renderers doing all grading. */
export default function Checkpoint({
  bankId,
  topicId,
  locale,
  labels,
  nextTitle,
  nextHref,
  trackHref,
}: CheckpointProps) {
  const mount = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<CheckpointItem[]>([]);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [misses, setMisses] = useState<CheckpointItem[]>([]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const root = mount.current?.closest<HTMLElement>('[data-checkpoint]');
    const start = root?.querySelector<HTMLButtonElement>('[data-checkpoint-start]');
    const summary = root?.querySelector<HTMLElement>('[data-checkpoint-summary]');
    if (!root || !start || !summary) return;

    const parsed = checkpointItems(root);
    setItems(parsed);
    const begin = () => {
      if (parsed.length === 0) return;
      summary.hidden = true;
      setStarted(true);
    };
    start.addEventListener('click', begin);
    mount.current?.setAttribute('data-ready', 'true');
    return () => start.removeEventListener('click', begin);
  }, []);

  const onDone = useCallback(
    (itemScore: number, itemTotal: number) => {
      const item = items[index];
      if (!item) return;
      const nextScore = score + itemScore;
      const nextTotal = total + itemTotal;
      const nextMisses = itemScore < itemTotal ? [...misses, item] : misses;
      setScore(nextScore);
      setTotal(nextTotal);
      setMisses(nextMisses);

      if (index < items.length - 1) {
        setIndex(index + 1);
        return;
      }

      const now = new Date();
      flushStore(KEYS.progress);
      const progress = readStore<Progress>(KEYS.progress, EMPTY_PROGRESS);
      let nextProgress = recordQuiz(progress, bankId, nextScore, nextTotal, now);
      if (passed(nextScore, nextTotal)) nextProgress = completeTopic(nextProgress, topicId, now);
      writeStore(KEYS.progress, nextProgress);
      flushStore(KEYS.progress);
      document.dispatchEvent(new CustomEvent('cw:progress'));
      setFinished(true);
    },
    [bankId, index, items, misses, score, topicId, total],
  );

  const addMisses = () => {
    if (added || misses.length === 0) return;
    const now = new Date();
    const deck = readStore<Flashcards>(KEYS.flashcards, EMPTY_FLASHCARDS);
    const cards = misses.map((item) => {
      const ref = quizCardId(bankId, item.id);
      return { id: ref, kind: 'quiz' as const, ref, source: 'quiz' as const };
    });
    writeStore(KEYS.flashcards, enqueueCards(deck, cards, now));
    flushStore(KEYS.flashcards);
    setAdded(true);
  };

  const didPass = passed(score, total);
  const continuation =
    nextTitle && nextHref
      ? { href: nextHref, label: fillSlots(labels.continue, { title: nextTitle }) }
      : { href: trackHref, label: labels.backToTrack };

  return (
    <div ref={mount} class="checkpoint-mount" data-checkpoint-controller>
      {started && !finished && items[index] && (
        <>
          <div class="checkpoint-head">
            <div
              class="bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={items.length}
              aria-valuenow={index}
            >
              <div style={{ width: `${Math.round((index / items.length) * 100)}%` }} />
            </div>
            <span class="lbl">
              {index + 1} / {items.length}
            </span>
          </div>
          <ItemShell
            key={items[index].id}
            bankId={bankId}
            item={items[index]}
            locale={locale}
            labels={labels}
            onDone={onDone}
          />
        </>
      )}

      {finished && (
        <section class="checkpoint-result" data-checkpoint-result aria-live="polite">
          <span class={`tag ${didPass ? 'ok' : 'warn'}`}>{didPass ? labels.passed : labels.failed}</span>
          <h3>{fillSlots(labels.result, { score, total })}</h3>
          {misses.length > 0 && (
            <ul class="checkpoint-misses">
              {misses.map((item) => (
                <li>
                  <strong>{item.prompt[locale]}</strong>
                  <p>{item.explanation[locale]}</p>
                </li>
              ))}
            </ul>
          )}
          <div class="checkpoint-actions">
            <button
              class="btn btn-g"
              type="button"
              data-add-misses
              disabled={misses.length === 0 || added}
              onClick={addMisses}
            >
              {labels.addMisses}
            </button>
            <a class="btn btn-p" href={continuation.href}>
              {continuation.label}
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
