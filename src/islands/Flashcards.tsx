import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import {
  faceOf,
  parseRef,
  visibleDeck,
  type GlossaryCardTerm,
  type QuizCardBank,
  type QuizCardBanks,
} from '@/lib/cards';
import {
  cardSources,
  DEFAULT_PREFS,
  EMPTY_FLASHCARDS,
  EMPTY_PROGRESS,
  flushStore,
  KEYS,
  readStore,
  writeStore,
  type Flashcard,
  type Flashcards as FlashcardDeck,
  type Prefs,
  type Progress,
  type QuizProgress,
} from '@/lib/prefs';
import { dueOn, isDue, previewInterval, rate, RATINGS, type Rating } from '@/lib/srs';
import { localizePath, type Locale } from '@/lib/urls';

type Filter = 'due' | 'all' | 'terms' | 'quiz';
type Source = 'terms' | 'quiz' | 'manual';

export interface FlashcardsLabels {
  practice: string;
  title: string;
  dueToday: string;
  done: string;
  streak: string;
  filters: Record<Filter, string>;
  shuffle: string;
  front: string;
  back: string;
  cardCount: string;
  readSection: string;
  glossaryEntry: string;
  ratings: Record<Rating, string>;
  days: string;
  deck: string;
  cards: string;
  terms: string;
  missedQuiz: string;
  nextSeven: string;
  sources: string;
  sourceLabels: Record<Source, string>;
  exportDeck: string;
  importDeck: string;
  empty: string;
  emptyToday: string;
  loading: string;
  loadFailed: string;
  flip: string;
  on: string;
  off: string;
  sourceNote: string;
  askYourAi: string;
  aiPrompt: string;
  aiTools: string;
  shortcuts: string;
  practiceLink: string;
  pythonLink: string;
}

export interface FlashcardsProps {
  locale: Locale;
  labels: FlashcardsLabels;
  practiceUrl: string;
  pythonUrl: string;
  settingsUrl: string;
}

interface ReviewState {
  deck: FlashcardDeck;
  prefs: Prefs;
  progress: Progress;
}

const DAY = 86_400_000;

function safeDeck(value: FlashcardDeck): FlashcardDeck {
  if (!Array.isArray(value?.cards)) return EMPTY_FLASHCARDS;
  return {
    cards: value.cards.filter(
      (card): card is Flashcard =>
        Boolean(card) &&
        typeof card === 'object' &&
        typeof card.id === 'string' &&
        (card.kind === 'term' || card.kind === 'quiz') &&
        typeof card.ref === 'string' &&
        typeof card.due === 'string' &&
        !Number.isNaN(Date.parse(card.due)) &&
        Number.isFinite(card.interval) &&
        Number.isFinite(card.ease) &&
        Number.isFinite(card.reps),
    ),
  };
}

function safeQuizzes(progress: Progress): QuizProgress[] {
  if (!progress?.quizzes || typeof progress.quizzes !== 'object' || Array.isArray(progress.quizzes)) {
    return [];
  }
  return Object.values(progress.quizzes).filter(
    (entry): entry is QuizProgress => Boolean(entry) && typeof entry.at === 'string',
  );
}

/** A local calendar day represented as an integer, matching the practice hub's streak. */
function localDay(value: string | Date): number | undefined {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY);
}

function streakOf(progress: Progress, now: Date): number {
  const days = new Set(
    safeQuizzes(progress)
      .map((entry) => localDay(entry.at))
      .filter((day): day is number => day !== undefined),
  );
  const today = localDay(now);
  if (today === undefined || days.size === 0) return 0;
  const latest = Math.max(...days);
  if (latest < today - 1) return 0;
  let streak = 0;
  for (let day = latest; days.has(day); day -= 1) streak += 1;
  return streak;
}

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

function shuffle<T>(values: readonly T[]): T[] {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap]!, next[index]!];
  }
  return next;
}

function localizedHref(href: string, locale: Locale): string {
  return href.startsWith('/') ? localizePath(href, locale) : href;
}

function EmptyState(props: {
  copy: string;
  labels: FlashcardsLabels;
  practiceUrl: string;
  pythonUrl: string;
}) {
  return (
    <div class="panel flashcards-empty" data-flashcards-empty>
      <p>{props.copy}</p>
      <div class="flashcards-empty-links">
        <a class="btn btn-g" href={props.practiceUrl}>
          {props.labels.practiceLink}
        </a>
        <a class="btn btn-g" href={props.pythonUrl}>
          {props.labels.pythonLink}
        </a>
      </div>
    </div>
  );
}

function DeckRail(props: {
  deck: FlashcardDeck;
  visible: Flashcard[];
  prefs: Prefs;
  labels: FlashcardsLabels;
  settingsUrl: string;
  now: Date;
  onToggle: (source: Source) => void;
}) {
  const { deck, visible, prefs, labels, settingsUrl, now, onToggle } = props;
  const activeCards = deck.cards.filter((card) => !card.suspended);
  const terms = activeCards.filter((card) => card.kind === 'term').length;
  const quizzes = activeCards.filter((card) => card.kind === 'quiz').length;
  const histogram = dueOn(visible, now);
  const peak = Math.max(1, ...histogram);
  const sources = cardSources(prefs);

  return (
    <aside class="flashcards-rail">
      <div class="panel flashcards-rail-panel">
        <span class="lbl">{labels.deck}</span>
        <div class="flashcards-stats">
          <div class="stat">
            <b>{activeCards.length}</b>
            <span class="lbl">{labels.cards}</span>
          </div>
          <div class="stat">
            <b>{terms}</b>
            <span class="lbl">{labels.terms}</span>
          </div>
          <div class="stat">
            <b>{quizzes}</b>
            <span class="lbl">{labels.missedQuiz}</span>
          </div>
        </div>
        <span class="lbl">{labels.nextSeven}</span>
        <div class="histogram" aria-label={labels.nextSeven}>
          {histogram.map((count, index) => (
            <span
              key={index}
              class={index === 0 ? 'today' : undefined}
              style={`height:${count === 0 ? 3 : Math.max(10, (count / peak) * 100)}%`}
              title={`${count}`}
            />
          ))}
        </div>
        <div class="histogram-counts lbl" aria-hidden="true">
          {histogram.map((count, index) => (
            <span key={index}>{count}</span>
          ))}
        </div>
      </div>

      <div class="panel flashcards-rail-panel flashcards-sources">
        <span class="lbl">{labels.sources}</span>
        {(Object.keys(labels.sourceLabels) as Source[]).map((source) => (
          <button
            key={source}
            type="button"
            class="flashcard-source"
            aria-pressed={sources[source]}
            onClick={() => onToggle(source)}
          >
            <span>{labels.sourceLabels[source]}</span>
            <span class="seg" aria-hidden="true">
              <span class={sources[source] ? 'on' : undefined}>{labels.on}</span>
              <span class={!sources[source] ? 'on' : undefined}>{labels.off}</span>
            </span>
          </button>
        ))}
        <p>{labels.sourceNote}</p>
      </div>

      <div class="flashcards-data-actions">
        <a class="btn btn-g" href={settingsUrl}>
          {labels.exportDeck}
        </a>
        <a class="btn btn-g" href={settingsUrl}>
          {labels.importDeck}
        </a>
      </div>

      <div class="panel flashcards-rail-panel flashcards-ai">
        <span class="lbl">{labels.askYourAi}</span>
        <span class="flashcards-ai-prompt">“{labels.aiPrompt}”</span>
        <span class="lbl">{labels.aiTools}</span>
      </div>
    </aside>
  );
}

export default function Flashcards({ locale, labels, practiceUrl, pythonUrl, settingsUrl }: FlashcardsProps) {
  const [state, setState] = useState<ReviewState | null>(null);
  const [filter, setFilter] = useState<Filter>('due');
  const [handled, setHandled] = useState<string[]>([]);
  const [done, setDone] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [glossary, setGlossary] = useState<GlossaryCardTerm[] | null>(null);
  const [banks, setBanks] = useState<QuizCardBanks>({});
  const [loadFailed, setLoadFailed] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState<string[]>([]);
  const now = useRef(new Date()).current;

  useEffect(() => {
    setState({
      deck: safeDeck(readStore(KEYS.flashcards, EMPTY_FLASHCARDS)),
      prefs: readStore(KEYS.prefs, DEFAULT_PREFS),
      progress: readStore(KEYS.progress, EMPTY_PROGRESS),
    });
  }, []);

  const visible = state ? visibleDeck(state.deck, state.prefs, now) : [];
  const scoped = visible.filter((card) => {
    if (filter === 'due') return isDue(card, now);
    if (filter === 'terms') return card.kind === 'term';
    if (filter === 'quiz') return card.kind === 'quiz';
    return true;
  });
  const rank = new Map(shuffleOrder.map((id, index) => [id, index]));
  const queue = scoped
    .filter((card) => !handled.includes(card.id))
    .sort(
      (a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
  const current = queue[0];
  const parsed = current ? parseRef(current.ref) : undefined;
  const face = current ? faceOf(current, glossary ?? [], banks) : undefined;
  const due = visible.filter((card) => isDue(card, now)).length;
  const total = done + queue.length;

  useEffect(() => {
    setFlipped(false);
    setLoadFailed(false);
  }, [current?.id]);

  useEffect(() => {
    if (!current || !parsed) return;
    const controller = new AbortController();

    const load = async () => {
      try {
        if (parsed.kind === 'term') {
          if (glossary !== null) return;
          const response = await fetch('/api/glossary.json', { signal: controller.signal });
          if (!response.ok) throw new Error(String(response.status));
          const value: unknown = await response.json();
          if (!Array.isArray(value)) throw new Error('invalid glossary');
          setGlossary(value as GlossaryCardTerm[]);
          return;
        }

        const cached = banks[parsed.bank];
        if (cached?.public && cached.answers) return;
        const base = `/api/quizzes/${parsed.bank}`;
        const [publicResponse, answersResponse] = await Promise.all([
          fetch(`${base}.json`, { signal: controller.signal }),
          fetch(`${base}.answers.json`, { signal: controller.signal }),
        ]);
        if (!publicResponse.ok || !answersResponse.ok) throw new Error('missing quiz bank');
        const [publicBank, answersBank] = (await Promise.all([
          publicResponse.json(),
          answersResponse.json(),
        ])) as [QuizCardBank, QuizCardBank];
        setBanks((previous) => ({
          ...previous,
          [parsed.bank]: { public: publicBank, answers: answersBank },
        }));
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setLoadFailed(true);
      }
    };

    void load();
    return () => controller.abort();
  }, [banks, current, glossary, parsed]);

  const rateCard = useCallback(
    (rating: Rating) => {
      if (!state || !current || !flipped || !face) return;
      const nextCard = rate(current, rating, new Date());
      const deck = {
        cards: state.deck.cards.map((card) => (card.id === current.id ? nextCard : card)),
      };
      writeStore(KEYS.flashcards, deck);
      setState({ ...state, deck });
      setHandled((previous) => [...previous, current.id]);
      setDone((value) => value + 1);
      setFlipped(false);
    },
    [current, face, flipped, state],
  );

  const suspendCard = useCallback(() => {
    if (!state || !current) return;
    const deck = {
      cards: state.deck.cards.map((card) => (card.id === current.id ? { ...card, suspended: true } : card)),
    };
    writeStore(KEYS.flashcards, deck);
    setState({ ...state, deck });
    setHandled((previous) => [...previous, current.id]);
    setFlipped(false);
  }, [current, state]);

  const firstLink = face?.back.links[0];
  const openSource = useCallback(() => {
    if (firstLink) location.assign(localizedHref(firstLink.href, locale));
  }, [firstLink, locale]);

  const keyboard = useRef({
    card: current,
    face,
    flipped,
    firstLink,
    rateCard,
    openSource,
    suspendCard,
  });
  keyboard.current = { card: current, face, flipped, firstLink, rateCard, openSource, suspendCard };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      )
        return;

      const live = keyboard.current;
      if ((event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space') && live.card) {
        event.preventDefault();
        setFlipped((value) => !value);
      } else if (/^[1-4]$/.test(event.key) && live.flipped) {
        event.preventDefault();
        const rating = RATINGS[Number(event.key) - 1];
        if (rating) live.rateCard(rating);
      } else if (event.key.toLowerCase() === 'e' && live.firstLink) {
        event.preventDefault();
        live.openSource();
      } else if (event.key.toLowerCase() === 'x' && live.card) {
        event.preventDefault();
        live.suspendCard();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const flush = () => flushStore(KEYS.flashcards);
    addEventListener('pagehide', flush);
    return () => {
      removeEventListener('pagehide', flush);
      flush();
    };
  }, []);

  const toggleSource = (source: Source) => {
    if (!state) return;
    const nextPrefs = {
      ...state.prefs,
      cardSources: { ...cardSources(state.prefs), [source]: !cardSources(state.prefs)[source] },
    };
    writeStore(KEYS.prefs, nextPrefs);
    setState({ ...state, prefs: nextPrefs });
    setFlipped(false);
  };

  const selectFilter = (next: Filter) => {
    setFilter(next);
    setFlipped(false);
    setShuffleOrder([]);
  };

  const header = (
    <header class="flashcards-head">
      <div class="flashcards-heading">
        <div class="flashcards-kicker">
          <a class="tag" href={practiceUrl}>
            {labels.practice}
          </a>
          <span class="lbl">/</span>
          <span class="tag acc">flashcards</span>
        </div>
        <h1>{labels.title}</h1>
        <span class="lbl flashcards-summary">
          {fill(labels.dueToday, { n: due })} · {fill(labels.done, { n: done })} ·{' '}
          {fill(labels.streak, { n: state ? streakOf(state.progress, now) : 0 })}
        </span>
      </div>
      <div class="flashcards-controls">
        <div class="seg" role="group" aria-label={labels.title}>
          {(['due', 'all', 'terms', 'quiz'] as Filter[]).map((value) => (
            <button
              key={value}
              type="button"
              class={filter === value ? 'on' : undefined}
              aria-pressed={filter === value}
              onClick={() => selectFilter(value)}
            >
              {labels.filters[value]}
              {value === 'all' ? ` ${visible.length}` : ''}
            </button>
          ))}
        </div>
        <button
          type="button"
          class="act"
          disabled={queue.length < 2}
          onClick={() => setShuffleOrder(shuffle(queue.map((card) => card.id)))}
        >
          {labels.shuffle}
        </button>
      </div>
    </header>
  );

  const main = !state ? (
    <EmptyState copy={labels.empty} labels={labels} practiceUrl={practiceUrl} pythonUrl={pythonUrl} />
  ) : !current ? (
    <EmptyState
      copy={visible.length > 0 && filter === 'due' ? labels.emptyToday : labels.empty}
      labels={labels}
      practiceUrl={practiceUrl}
      pythonUrl={pythonUrl}
    />
  ) : (
    <div class="flashcards-review">
      <div
        class="flashcards-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={Math.max(1, total)}
        aria-valuenow={done}
      >
        <span style={`width:${total > 0 ? (done / total) * 100 : 0}%`} />
      </div>

      <article class="panel flashcard-card" data-card-id={current.id} data-side={flipped ? 'back' : 'front'}>
        <header class="flashcard-meta">
          <div>
            <span class="tag acc">{parsed?.kind === 'quiz' ? parsed.bank.split('/')[0] : 'term'}</span>
            <span class="tag">{current.kind === 'term' ? labels.terms : labels.missedQuiz}</span>
            <span class="lbl">
              {current.reps} · {fill(labels.days, { n: current.interval })}
            </span>
          </div>
          <span class="lbl">{fill(labels.cardCount, { i: done + 1, n: total })}</span>
        </header>

        {face ? (
          <button
            type="button"
            class="flashcard-front"
            aria-label={labels.flip}
            aria-pressed={flipped}
            onClick={() => setFlipped((value) => !value)}
          >
            <span class="lbl">{labels.front}</span>
            <span class="flashcard-title-row">
              <strong>{face.front.title}</strong>
              {face.front.alt ? (
                <span class="flashcard-alt" lang="zh-Hans">
                  {face.front.alt}
                </span>
              ) : null}
            </span>
            <span class="flashcard-cue">{face.front.cue}</span>
            {face.front.code ? <pre class="flashcard-code">{face.front.code}</pre> : null}
          </button>
        ) : (
          <div class="flashcard-loading" role={loadFailed ? 'alert' : 'status'}>
            <span>{loadFailed ? labels.loadFailed : labels.loading}</span>
          </div>
        )}

        {face ? (
          <div class="flashcard-back" hidden={!flipped}>
            <span class="lbl">{labels.back}</span>
            <p>{face.back.text}</p>
            {face.back.textZh ? (
              <p class="flashcard-back-zh" lang="zh-Hans">
                {face.back.textZh}
              </p>
            ) : null}
            <div class="flashcard-links">
              {face.back.links.map((link) => (
                <a key={`${link.kind}:${link.href}`} href={localizedHref(link.href, locale)}>
                  {link.kind === 'glossary' ? labels.glossaryEntry : labels.readSection}
                </a>
              ))}
              <span class="lbl">{labels.shortcuts}</span>
            </div>
          </div>
        ) : null}
      </article>

      <div class="flashcard-ratings">
        {RATINGS.map((rating, index) => (
          <button
            key={rating}
            type="button"
            class={`rate rate-${rating}`}
            disabled={!flipped || !face}
            onClick={() => rateCard(rating)}
          >
            <span>{labels.ratings[rating]}</span>
            <span class="lbl">
              {fill(labels.days, { n: previewInterval(current, rating) })} ·{' '}
              <kbd class="kbd">{index + 1}</kbd>
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div class="wrap flashcards-page" data-flashcards-ready={state ? 'true' : 'false'}>
      {header}
      <div class="flashcards-body">
        <section class="flashcards-main">{main}</section>
        <DeckRail
          deck={state?.deck ?? EMPTY_FLASHCARDS}
          visible={visible}
          prefs={state?.prefs ?? DEFAULT_PREFS}
          labels={labels}
          settingsUrl={settingsUrl}
          now={now}
          onToggle={toggleSource}
        />
      </div>
    </div>
  );
}
