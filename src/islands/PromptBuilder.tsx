import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import {
  assemble,
  estimateTokens,
  GOALS,
  LEVELS,
  type Goal,
  type Level,
  type PromptOptions,
  type TopicCard,
} from '@/lib/prompt-builder';
import { deepLinks } from '@/lib/prompts';
import type { Locale } from '@/lib/urls';

interface TopicIndexRow {
  id: string;
  track: string;
  lang: Locale;
  title: string;
  description: string;
}

interface ConceptCard {
  id: string;
  title: Partial<Record<Locale, string>>;
  track: string;
  terms: { en: string }[];
  pitfalls: string[];
  md: Partial<Record<Locale, string>>;
}

export interface PromptBuilderLabels {
  steps: { topic: string; goal: string; level: string; options: string; code: string };
  goals: Record<Goal, { name: string; description: string }>;
  levels: Record<Level, string>;
  options: Record<keyof PromptOptions, string>;
  searchPlaceholder: string;
  searchLoading: string;
  searchEmpty: string;
  searchError: string;
  removeTopic: string;
  codeHint: string;
  preview: string;
  tokens: string;
  openClaude: string;
  openChatGPT: string;
  copy: string;
  copied: string;
  copyFailed: string;
  openHint: string;
  whyTitle: string;
  whyBody: string;
  rulesPack: string;
  rulesCount: string;
}

interface Props {
  locale: Locale;
  labels: PromptBuilderLabels;
  trackNames: Record<string, string>;
}

const DEFAULT_OPTIONS = (locale: Locale): PromptOptions => ({
  link: true,
  checklist: true,
  vocabulary: true,
  zh: locale === 'zh',
  concise: false,
});

function fill(value: string, vars: Record<string, string | number>): string {
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export default function PromptBuilder({ locale, labels, trackNames }: Props) {
  const [goal, setGoal] = useState<Goal>('explain');
  const [level, setLevel] = useState<Level>('intermediate');
  const [options, setOptions] = useState<PromptOptions>(() => DEFAULT_OPTIONS(locale));
  const [code, setCode] = useState('');
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<TopicIndexRow[] | null>(null);
  const [selected, setSelected] = useState<TopicCard[]>([]);
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [ruleCount, setRuleCount] = useState(0);
  const indexRequest = useRef<Promise<TopicIndexRow[]> | null>(null);
  const cardCache = useRef(new Map<string, TopicCard>());

  const loadIndex = useCallback(async (): Promise<TopicIndexRow[]> => {
    if (!indexRequest.current) {
      setSearchState('loading');
      indexRequest.current = fetch('/api/topics.json')
        .then(async (response) => {
          if (!response.ok) throw new Error(`Topic index returned ${response.status}`);
          return (await response.json()) as TopicIndexRow[];
        })
        .then((rows) => {
          const localized = rows.filter((row) => row.lang === locale);
          setIndex(localized);
          setSearchState('ready');
          return localized;
        })
        .catch((error: unknown) => {
          indexRequest.current = null;
          setSearchState('error');
          throw error;
        });
    }
    return indexRequest.current;
  }, [locale]);

  const loadCard = useCallback(
    async (row: TopicIndexRow): Promise<TopicCard> => {
      const cached = cardCache.current.get(row.id);
      if (cached) return cached;
      const response = await fetch(`/api/topics/${row.id}.json`);
      if (!response.ok) throw new Error(`Topic card returned ${response.status}`);
      const card = (await response.json()) as ConceptCard;
      const topic: TopicCard = {
        id: row.id,
        title: card.title[locale] ?? card.title.en ?? row.title,
        track: card.track,
        slug: row.id.split('/')[1] ?? row.id,
        md: card.md[locale] ?? card.md.en ?? `https://codewiki.com/${row.id}.md`,
        terms: card.terms.map((term) => term.en),
        pitfalls: card.pitfalls,
      };
      cardCache.current.set(row.id, topic);
      return topic;
    },
    [locale],
  );

  const addTopic = useCallback(
    async (row: TopicIndexRow) => {
      try {
        const topic = await loadCard(row);
        setSelected((current) =>
          current.some((item) => item.id === row.id) ? current : [...current, topic],
        );
        setQuery('');
      } catch {
        setSearchState('error');
      }
    },
    [loadCard],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedGoal = params.get('goal');
    const requestedLevel = params.get('level');
    if (GOALS.includes(requestedGoal as Goal)) setGoal(requestedGoal as Goal);
    if (LEVELS.includes(requestedLevel as Level)) setLevel(requestedLevel as Level);

    const requestedTopic = params.get('topic');
    if (!requestedTopic) return;
    void loadIndex()
      .then((rows) => {
        const row = rows.find((candidate) => candidate.id === requestedTopic);
        if (row) return addTopic(row);
      })
      .catch(() => undefined);
  }, [addTopic, loadIndex]);

  const firstTrack = selected[0]?.track;
  useEffect(() => {
    let current = true;
    if (!firstTrack) {
      setRuleCount(0);
      return () => {
        current = false;
      };
    }
    void loadIndex()
      .then((rows) => rows.filter((row) => row.track === firstTrack))
      .then((rows) => Promise.all(rows.map(loadCard)))
      .then((topics) => {
        if (current) setRuleCount(topics.reduce((sum, topic) => sum + topic.pitfalls.length, 0));
      })
      .catch(() => {
        if (current) setRuleCount(0);
      });
    return () => {
      current = false;
    };
  }, [firstTrack, loadCard, loadIndex]);

  const results = useMemo(() => {
    if (!index) return [];
    const needle = query.trim().toLocaleLowerCase(locale === 'zh' ? 'zh-Hans' : 'en');
    if (!needle) return index.filter((row) => !selected.some((topic) => topic.id === row.id)).slice(0, 5);
    return index
      .filter(
        (row) =>
          !selected.some((topic) => topic.id === row.id) &&
          `${row.title} ${row.description} ${row.id}`.toLocaleLowerCase().includes(needle),
      )
      .slice(0, 6);
  }, [index, locale, query, selected]);

  const language = firstTrack ? (trackNames[firstTrack] ?? firstTrack) : 'programming';
  const prompt = useMemo(
    () => assemble({ topics: selected, goal, level, options, code, lang: language }),
    [code, goal, language, level, options, selected],
  );
  const links = useMemo(() => deepLinks(prompt), [prompt]);

  const toggleOption = (name: keyof PromptOptions) => {
    setOptions((current) => ({ ...current, [name]: !current[name] }));
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    window.setTimeout(() => setCopyState('idle'), 1500);
  };

  const copyLabel =
    copyState === 'copied' ? labels.copied : copyState === 'failed' ? labels.copyFailed : labels.copy;
  const trackLabel = firstTrack ? (trackNames[firstTrack] ?? firstTrack) : '';

  return (
    <div class="prompt-builder-grid" data-prompt-builder>
      <div class="prompt-builder-form">
        <section class="prompt-step">
          <h2 class="prompt-step-label">
            <span aria-hidden="true">1</span>
            {labels.steps.topic}
          </h2>
          <div class="topic-picker">
            <div class="topic-input-row">
              <div class="topic-chips" aria-live="polite">
                {selected.map((topic) => (
                  <button
                    type="button"
                    class="topic-chip"
                    data-topic-chip={topic.id}
                    aria-label={`${labels.removeTopic}: ${topic.title}`}
                    onClick={() => setSelected((current) => current.filter((item) => item.id !== topic.id))}
                  >
                    {trackNames[topic.track] ?? topic.track} › {topic.title} <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
              <input
                type="search"
                value={query}
                placeholder={labels.searchPlaceholder}
                aria-label={labels.steps.topic}
                onFocus={() => void loadIndex().catch(() => undefined)}
                onInput={(event) => setQuery(event.currentTarget.value)}
              />
            </div>
            {searchState === 'loading' && <p class="topic-picker-status">{labels.searchLoading}</p>}
            {searchState === 'error' && <p class="topic-picker-status error">{labels.searchError}</p>}
            {searchState === 'ready' && (query || selected.length === 0) && (
              <div class="topic-results panel" id="prompt-topic-results">
                {results.length > 0 ? (
                  results.map((row) => (
                    <button type="button" onClick={() => void addTopic(row)}>
                      <strong>{row.title}</strong>
                      <span>{trackNames[row.track] ?? row.track}</span>
                    </button>
                  ))
                ) : (
                  <p>{labels.searchEmpty}</p>
                )}
              </div>
            )}
          </div>
        </section>

        <section class="prompt-step">
          <h2 class="prompt-step-label">
            <span aria-hidden="true">2</span>
            {labels.steps.goal}
          </h2>
          <div class="goal-grid" role="radiogroup" aria-label={labels.steps.goal}>
            {GOALS.map((item) => (
              <label class={`radio${goal === item ? ' on' : ''}`} data-goal={item}>
                <input
                  type="radio"
                  name="prompt-goal"
                  value={item}
                  checked={goal === item}
                  onChange={() => setGoal(item)}
                />
                <span>
                  <strong>{labels.goals[item].name}</strong>
                  <small>{labels.goals[item].description}</small>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section class="prompt-step">
          <h2 class="prompt-step-label">
            <span aria-hidden="true">3</span>
            {labels.steps.level}
          </h2>
          <div class="prompt-levels" role="radiogroup" aria-label={labels.steps.level}>
            {LEVELS.map((item) => (
              <button
                type="button"
                class={level === item ? 'on' : ''}
                role="radio"
                aria-checked={level === item}
                onClick={() => setLevel(item)}
              >
                {labels.levels[item]}
              </button>
            ))}
          </div>
        </section>

        <section class="prompt-step">
          <h2 class="prompt-step-label">
            <span aria-hidden="true">4</span>
            {labels.steps.options}
          </h2>
          <div class="prompt-options">
            {(Object.keys(options) as (keyof PromptOptions)[]).map((name) => (
              <label>
                <input
                  type="checkbox"
                  data-option={name}
                  checked={options[name]}
                  onChange={() => toggleOption(name)}
                />
                <span>{labels.options[name]}</span>
              </label>
            ))}
          </div>
        </section>

        <section class="prompt-step">
          <h2 class="prompt-step-label">
            <span aria-hidden="true">5</span>
            {labels.steps.code} <small>{labels.codeHint}</small>
          </h2>
          <textarea
            class="prompt-code"
            value={code}
            aria-label={labels.steps.code}
            spellcheck={false}
            onInput={(event) => setCode(event.currentTarget.value)}
          />
        </section>
      </div>

      <aside class="prompt-preview-column">
        <div class="prompt-preview-meta">
          <span>{labels.preview}</span>
          <span>{fill(labels.tokens, { n: estimateTokens(prompt) })}</span>
        </div>
        <pre class="preview" data-prompt-preview>
          {prompt}
        </pre>
        <div class="prompt-actions">
          <a class="btn prompt-action-ai" href={links.claude} target="_blank" rel="noreferrer">
            {labels.openClaude}
          </a>
          <a class="btn btn-g" href={links.chatgpt} target="_blank" rel="noreferrer">
            {labels.openChatGPT}
          </a>
          <button type="button" class="btn btn-g" data-copy-prompt onClick={() => void copyPrompt()}>
            {copyLabel}
          </button>
          <span class="prompt-open-hint">{labels.openHint}</span>
        </div>

        <section class="panel prompt-why">
          <h2>{labels.whyTitle}</h2>
          <p>{labels.whyBody}</p>
        </section>

        {firstTrack && ruleCount > 0 && (
          <section class="panel prompt-rules" data-rules-card>
            <div>
              <h2>{fill(labels.rulesPack, { track: trackLabel })}</h2>
              <p>{fill(labels.rulesCount, { n: ruleCount, track: trackLabel })}</p>
            </div>
            <div class="prompt-rules-actions">
              <a class="btn btn-g" href={`/rules/${firstTrack}/CLAUDE.md`} download>
                CLAUDE.md
              </a>
              <a class="btn btn-g" href={`/rules/${firstTrack}/AGENTS.md`} download>
                AGENTS.md
              </a>
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}
