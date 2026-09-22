import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { mountEditor, type MountedEditor } from '@/islands/editor';
import { parseTestResult, wrapWithTests } from '@/lib/kata-tests';
import { decodeCode, decodeState, encodeState, MAX_TESTS_LENGTH, type PlaygroundState } from '@/lib/lz';
import { buildPrompt, deepLinks } from '@/lib/prompts';
import {
  isTimeout,
  normalizeLang,
  run,
  runId,
  type RunEvent,
  type RunLang,
  type RunStatus,
} from '@/lib/runners';
import type { Locale } from '@/lib/urls';

const VARIABLE_MARKER = '__CODEWIKI_VARIABLES__';
const LANGS: RunLang[] = ['python', 'js', 'ts', 'sql', 'html'];

const STARTERS: Record<RunLang, string> = {
  python: 'print(1 + 1)',
  js: 'console.log(1 + 1);',
  ts: 'const answer: number = 1 + 1;\nconsole.log(answer);',
  sql: 'SELECT 1 AS x;',
  html: '<!doctype html>\n<h1>Hello, CodeWiki</h1>\n<p>Edit this preview, then run it.</p>',
};

const FILES: Record<RunLang, string> = {
  python: 'main.py',
  js: 'main.js',
  ts: 'main.ts',
  sql: 'query.sql',
  html: 'index.html',
};

export interface PlaygroundExample {
  id: string;
  lang: RunLang;
  title: string;
  code: string;
  tests?: string;
  seed?: string;
  locale?: Locale;
  topic: { title: string; url: string };
}

export interface PlaygroundLabels {
  title: string;
  lead: string;
  languages: Record<RunLang, string>;
  loadExample: string;
  loadingExamples: string;
  examplesFailed: string;
  openTopic: string;
  reset: string;
  copy: string;
  copied: string;
  copyFailed: string;
  share: string;
  shared: string;
  run: string;
  running: string;
  loadingPython: string;
  loadingSql: string;
  output: string;
  tests: string;
  variables: string;
  outputEmpty: string;
  variablesEmpty: string;
  variablesUnavailable: string;
  kataBanner: string;
  testsPending: string;
  testsPassed: string;
  testsFailed: string;
  askFix: string;
  runsOnMachine: string;
  runtimePyodide: string;
  runtimeSql: string;
  runtimeIframe: string;
  fromTopic: string;
  ranIn: string;
  exit: string;
  error: string;
  timeout: string;
  editorFailed: string;
  stateRejected: string;
}

interface Props {
  locale: Locale;
  labels: PlaygroundLabels;
}

type OutputPanel = 'output' | 'tests' | 'variables';
type KataResult = ReturnType<typeof parseTestResult> | null;

function stateFromUrl(): { state: PlaygroundState | null; rejected: boolean } {
  const params = new URLSearchParams(location.search);
  const compressed = params.get('code');
  const explicitLang = normalizeLang(params.get('lang'));
  const rawTests = params.get('tests');
  if (rawTests && rawTests.length > MAX_TESTS_LENGTH) return { state: null, rejected: true };
  const tests = rawTests || undefined;

  if (params.has('code')) {
    const decoded = decodeState(compressed ?? '');
    if (decoded) return { state: { ...decoded, ...(tests ? { tests } : {}) }, rejected: false };
    const code = decodeCode(compressed ?? '');
    if (code && explicitLang) {
      return { state: { lang: explicitLang, code, ...(tests ? { tests } : {}) }, rejected: false };
    }
    return { state: null, rejected: true };
  }

  if (explicitLang) {
    return {
      state: { lang: explicitLang, code: STARTERS[explicitLang], ...(tests ? { tests } : {}) },
      rejected: false,
    };
  }
  return { state: tests ? { lang: 'python', code: STARTERS.python, tests } : null, rejected: false };
}

function withVariableSnapshot(lang: RunLang, source: string): string {
  if (lang === 'python') {
    return `${source}\n\nimport json as __cw_json\nprint(${JSON.stringify(
      VARIABLE_MARKER,
    )} + __cw_json.dumps({name: repr(globals()[name]) for name in dir() if not name.startswith("__") and name != "__cw_json"}))`;
  }

  if (lang === 'js' || lang === 'ts') {
    return `const __cw_before = new Set(Object.getOwnPropertyNames(globalThis));\ntry {\n${source}\n} finally {\n  const __cw_vars = {};\n  for (const __cw_name of Object.getOwnPropertyNames(globalThis)) {\n    if (!__cw_before.has(__cw_name)) {\n      try { __cw_vars[__cw_name] = String(globalThis[__cw_name]); } catch { __cw_vars[__cw_name] = "[unavailable]"; }\n    }\n  }\n  console.log(${JSON.stringify(
      VARIABLE_MARKER,
    )} + JSON.stringify(__cw_vars));\n}`;
  }

  return source;
}

function outputText(events: RunEvent[], kind: 'stdout' | 'stderr'): string {
  return events
    .filter((event) => event.kind === kind || (kind === 'stderr' && event.kind === 'error'))
    .map((event) => event.text ?? '')
    .filter(Boolean)
    .join('\n');
}

function validExample(value: unknown): value is PlaygroundExample {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  const topic = row.topic as Record<string, unknown> | undefined;
  return (
    typeof row.id === 'string' &&
    normalizeLang(typeof row.lang === 'string' ? row.lang : null) !== null &&
    typeof row.title === 'string' &&
    typeof row.code === 'string' &&
    (row.tests === undefined || typeof row.tests === 'string') &&
    (row.seed === undefined || typeof row.seed === 'string') &&
    typeof topic?.title === 'string' &&
    typeof topic.url === 'string'
  );
}

export default function Playground({ locale, labels }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [lang, setLang] = useState<RunLang>('python');
  const [code, setCode] = useState(STARTERS.python);
  const [tests, setTests] = useState<string>();
  const [seed, setSeed] = useState<string>();
  const [baseline, setBaseline] = useState<PlaygroundState>({ lang: 'python', code: STARTERS.python });
  const [examples, setExamples] = useState<PlaygroundExample[]>([]);
  const [exampleState, setExampleState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedExample, setSelectedExample] = useState('');
  const [topic, setTopic] = useState<PlaygroundExample['topic']>();
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [kataResult, setKataResult] = useState<KataResult>(null);
  const [activePanel, setActivePanel] = useState<OutputPanel>('output');
  const [duration, setDuration] = useState<number>();
  const [runStatus, setRunStatus] = useState<RunStatus>();
  const [actionStatus, setActionStatus] = useState('');
  const [editorEnabled, setEditorEnabled] = useState(false);
  const [editorError, setEditorError] = useState(false);
  const [stateRejected, setStateRejected] = useState(false);

  const drafts = useRef<Record<RunLang, string>>({ ...STARTERS });
  const textarea = useRef<HTMLTextAreaElement>(null);
  const editor = useRef<MountedEditor>();
  const preview = useRef<HTMLDivElement>(null);

  const supportsVariables = lang === 'python' || lang === 'js' || lang === 'ts';
  const busy = runStatus !== undefined;

  const applyState = (next: PlaygroundState, example?: PlaygroundExample) => {
    drafts.current[next.lang] = next.code;
    setLang(next.lang);
    setCode(next.code);
    setTests(next.tests);
    setSeed(next.seed);
    setBaseline(next);
    setSelectedExample(example?.id ?? '');
    setTopic(example?.topic);
    setEvents([]);
    setVariables({});
    setKataResult(null);
    setDuration(undefined);
    setActivePanel(next.tests ? 'tests' : 'output');
    preview.current?.replaceChildren();
  };

  useEffect(() => {
    setHydrated(true);
    const initial = stateFromUrl();
    setStateRejected(initial.rejected);
    if (initial.state) applyState(initial.state);

    let live = true;
    fetch('/api/examples.json')
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error('invalid examples response');
        return data.filter(validExample);
      })
      .then((data) => {
        if (!live) return;
        const localized = data.filter((example) => example.locale === undefined || example.locale === locale);
        const available = localized.length > 0 ? localized : data;
        setExamples(available);
        setExampleState('ready');
        const requested = new URLSearchParams(location.search).get('example');
        const example = requested ? available.find((row) => row.id === requested) : undefined;
        if (example) applyState(example, example);
      })
      .catch(() => {
        if (live) setExampleState('error');
      });

    return () => {
      live = false;
    };
  }, [locale]);

  useEffect(() => {
    if (!editorEnabled || !textarea.current) return;
    let cancelled = false;
    setEditorError(false);

    mountEditor(textarea.current, lang, (value) => {
      drafts.current[lang] = value;
      setCode(value);
    })
      .then((mounted) => {
        if (cancelled) mounted.destroy();
        else editor.current = mounted;
      })
      .catch(() => {
        if (!cancelled) setEditorError(true);
      });

    return () => {
      cancelled = true;
      editor.current?.destroy();
      editor.current = undefined;
    };
  }, [editorEnabled, lang]);

  useEffect(() => {
    editor.current?.setValue(code);
  }, [code]);

  useEffect(() => {
    if (!supportsVariables && activePanel === 'variables') setActivePanel('output');
  }, [activePanel, supportsVariables]);

  const selectLanguage = (next: RunLang) => {
    if (next === lang || busy) return;
    drafts.current[lang] = code;
    const nextCode = drafts.current[next];
    setLang(next);
    setCode(nextCode);
    setTests(undefined);
    setSeed(undefined);
    setBaseline({ lang: next, code: nextCode });
    setSelectedExample('');
    setTopic(undefined);
    setEvents([]);
    setVariables({});
    setKataResult(null);
    setDuration(undefined);
    setActivePanel('output');
    preview.current?.replaceChildren();
  };

  const chooseExample = (id: string) => {
    const example = examples.find((row) => row.id === id);
    if (example) applyState(example, example);
  };

  const reset = () =>
    applyState(baseline, selectedExample ? examples.find((row) => row.id === selectedExample) : undefined);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setActionStatus(labels.copied);
    } catch {
      setActionStatus(labels.copyFailed);
    }
  };

  const share = async () => {
    const value = encodeState({ lang, code, ...(tests ? { tests } : {}), ...(seed ? { seed } : {}) });
    const params = new URLSearchParams({ lang, code: value });
    history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
    try {
      await navigator.clipboard.writeText(location.href);
      setActionStatus(labels.shared);
    } catch {
      setActionStatus(labels.copyFailed);
    }
  };

  const execute = async () => {
    if (busy) return;
    const id = runId();
    const collected: RunEvent[] = [];
    setEvents([]);
    setVariables({});
    setKataResult(null);
    setDuration(undefined);
    setActionStatus('');
    if (lang !== 'html') preview.current?.replaceChildren();

    const tested = tests ? wrapWithTests(lang, code, tests) : code;
    const program = withVariableSnapshot(lang, tested);

    const onEvent = (event: RunEvent) => {
      if (event.kind === 'stdout' && event.text?.startsWith(VARIABLE_MARKER)) {
        try {
          const value: unknown = JSON.parse(event.text.slice(VARIABLE_MARKER.length));
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            setVariables(value as Record<string, string>);
          }
        } catch {
          setVariables({});
        }
        return;
      }

      collected.push(event);
      setEvents([...collected]);
      if (event.kind === 'done') setDuration(event.ms);
    };

    try {
      setRunStatus(lang === 'python' ? 'loading-python' : lang === 'sql' ? 'loading-sql' : 'running');
      await run({ id, lang, code: program, ...(seed ? { seed } : {}) }, onEvent, {
        previewTarget: preview.current ?? undefined,
        onStatus: setRunStatus,
      });
    } catch (error) {
      const event: RunEvent = {
        id,
        kind: 'error',
        text: isTimeout(error) ? labels.timeout : error instanceof Error ? error.message : String(error),
      };
      collected.push(event);
      setEvents([...collected]);
    } finally {
      setRunStatus(undefined);
      if (tests) {
        const result = parseTestResult(collected);
        setKataResult(result);
        setActivePanel('tests');
      } else {
        setActivePanel('output');
      }
    }
  };

  const aiHref = useMemo(() => {
    if (!kataResult || kataResult.passed) return undefined;
    const stdout = outputText(events, 'stdout') || '(none)';
    const stderr = outputText(events, 'stderr') || '(none)';
    const failure = kataResult.failures.at(-1) ?? stderr;
    const prompt = buildPrompt({
      preset: 'bugs',
      locale,
      title: labels.title,
      url: `https://codewiki.com${locale === 'zh' ? '/zh' : ''}/playground/`,
      section: labels.tests,
      sectionText: `Code (${lang}):\n${code}\n\nstdout:\n${stdout}\n\nstderr:\n${stderr}\n\nFailing assertion:\n${failure}`,
      language: lang,
      presetInstruction:
        'Find the bug that causes the failing assertion. Explain the smallest correction, then show the corrected code.',
    });
    return deepLinks(prompt).chatgpt;
  }, [code, events, kataResult, labels.tests, labels.title, lang, locale]);

  const statusLabel =
    runStatus === 'loading-python'
      ? labels.loadingPython
      : runStatus === 'loading-sql'
        ? labels.loadingSql
        : labels.running;
  const runtime =
    lang === 'python' ? labels.runtimePyodide : lang === 'sql' ? labels.runtimeSql : labels.runtimeIframe;

  return (
    <form
      class="playground-page"
      data-playground-ready={hydrated ? 'true' : undefined}
      onSubmit={(event) => {
        event.preventDefault();
        void execute();
      }}
      onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          event.preventDefault();
          void execute();
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
          event.preventDefault();
          void share();
        }
      }}
    >
      <header class="playground-toolbar">
        <div class="playground-heading">
          <div>
            <h1>{labels.title}</h1>
            <p>{labels.lead}</p>
          </div>
          <div class="playground-language-tabs" role="tablist" aria-label={labels.title}>
            {LANGS.map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={lang === item}
                class={lang === item ? 'on' : undefined}
                disabled={busy || !hydrated}
                onClick={() => selectLanguage(item)}
              >
                {labels.languages[item]}
              </button>
            ))}
          </div>
        </div>

        <div class="playground-example-row">
          <label for="playground-example" class="lbl">
            {labels.loadExample}
          </label>
          <select
            id="playground-example"
            value={selectedExample}
            disabled={!hydrated || busy || exampleState !== 'ready' || examples.length === 0}
            onChange={(event) => chooseExample(event.currentTarget.value)}
          >
            <option value="">
              {exampleState === 'loading'
                ? labels.loadingExamples
                : exampleState === 'error'
                  ? labels.examplesFailed
                  : labels.loadExample}
            </option>
            {examples.map((example) => (
              <option value={example.id}>{`${example.title} - ${example.topic.title}`}</option>
            ))}
          </select>
          {topic && (
            <a href={topic.url} class="playground-topic-link">
              {labels.openTopic}
            </a>
          )}
        </div>

        <div class="playground-actions">
          <button type="button" class="act" disabled={busy || !hydrated} onClick={reset}>
            {labels.reset}
          </button>
          <button type="button" class="act" disabled={busy || !hydrated} onClick={() => void copy()}>
            {labels.copy}
          </button>
          <button type="button" class="act" disabled={busy || !hydrated} onClick={() => void share()}>
            {labels.share}
          </button>
          <button type="submit" class="playground-run" disabled={busy || !hydrated}>
            {busy ? statusLabel : labels.run}
            <span class="kbd">⌘↵</span>
          </button>
          <span class="playground-action-status lbl" aria-live="polite">
            {actionStatus}
          </span>
        </div>
      </header>

      {stateRejected && (
        <p class="playground-state-rejected" role="alert">
          {labels.stateRejected}
        </p>
      )}

      <div class="playground-workspace">
        <section class="playground-editor" aria-label={FILES[lang]}>
          <div class="playground-editor-head">
            <span>{FILES[lang]}</span>
            <span>UTF-8</span>
          </div>
          <textarea
            ref={textarea}
            name="code"
            value={code}
            aria-label={FILES[lang]}
            autocomplete="off"
            autocapitalize="off"
            spellcheck={false}
            onFocus={() => setEditorEnabled(true)}
            onInput={(event) => {
              const value = event.currentTarget.value;
              drafts.current[lang] = value;
              setCode(value);
            }}
          />
          {editorError && <p class="playground-editor-error">{labels.editorFailed}</p>}
          <footer class="playground-runtime">
            <span>{runtime}</span>
            <span>{labels.runsOnMachine}</span>
          </footer>
        </section>

        <section class="playground-results panel" aria-label={labels.output}>
          <div class="playground-output-tabs" role="tablist" aria-label={labels.output}>
            {(['output', ...(tests ? ['tests'] : []), 'variables'] as OutputPanel[]).map((panel) => (
              <button
                type="button"
                role="tab"
                class={activePanel === panel ? 'on' : undefined}
                aria-selected={activePanel === panel}
                disabled={!hydrated || (panel === 'variables' && !supportsVariables)}
                onClick={() => setActivePanel(panel)}
              >
                {labels[panel]}
              </button>
            ))}
            {duration !== undefined && (
              <span class="playground-duration">{labels.ranIn.replace('{ms}', String(duration))}</span>
            )}
          </div>

          <div class="playground-result-body">
            <div
              ref={preview}
              class={
                lang === 'html' && activePanel === 'output'
                  ? 'playground-preview'
                  : 'playground-preview is-hidden'
              }
            />

            {activePanel === 'output' && lang !== 'html' && (
              <div class="playground-terminal" aria-live="polite">
                {events.length === 0 && <span class="playground-empty">{labels.outputEmpty}</span>}
                {events.map((event, index) => {
                  if (event.kind === 'done') {
                    return (
                      <span class="playground-exit" key={`${event.kind}-${index}`}>
                        {labels.exit}
                      </span>
                    );
                  }
                  if (!event.text) return null;
                  return (
                    <pre class={event.kind === 'stdout' ? 'stdout' : 'stderr'} key={`${event.kind}-${index}`}>
                      <span>
                        {event.kind === 'stdout'
                          ? 'stdout'
                          : event.kind === 'stderr'
                            ? 'stderr'
                            : labels.error}
                      </span>
                      {event.text}
                    </pre>
                  );
                })}
              </div>
            )}

            {activePanel === 'tests' && tests && (
              <div class="playground-tests" aria-live="polite">
                <p class="playground-kata-banner">{labels.kataBanner}</p>
                {kataResult === null ? (
                  <p class="playground-test-summary">{labels.testsPending}</p>
                ) : kataResult.passed ? (
                  <p class="playground-test-summary passed">{labels.testsPassed}</p>
                ) : (
                  <div class="playground-test-failures">
                    <p class="playground-test-summary failed">{labels.testsFailed}</p>
                    {kataResult.failures.map((failure) => (
                      <pre>{failure}</pre>
                    ))}
                    {aiHref && (
                      <a class="act playground-ask-fix" href={aiHref} target="_blank" rel="noreferrer">
                        {labels.askFix}
                      </a>
                    )}
                  </div>
                )}
                <pre class="playground-assertions">{tests}</pre>
              </div>
            )}

            {activePanel === 'variables' && (
              <div class="playground-variables">
                {!supportsVariables ? (
                  <p class="playground-empty">{labels.variablesUnavailable}</p>
                ) : Object.keys(variables).length === 0 ? (
                  <p class="playground-empty">{labels.variablesEmpty}</p>
                ) : (
                  <dl>
                    {Object.entries(variables).map(([name, value]) => (
                      <div>
                        <dt>{name}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {examples.length > 0 && (
        <div class="playground-example-cards" aria-label={labels.loadExample}>
          {examples.slice(0, 4).map((example) => (
            <button
              type="button"
              class="playground-example-card"
              disabled={!hydrated || busy}
              onClick={() => chooseExample(example.id)}
            >
              <span>
                <b>{example.lang}</b>
                {example.title}
              </span>
              <span class="lbl">{labels.fromTopic.replace('{topic}', example.topic.title)}</span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
