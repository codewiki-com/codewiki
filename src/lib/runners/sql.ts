import { splitSqlTests, TEST_PASS_LINE } from '@/lib/kata-tests';
import type { RunEventHandler, RunOptions, RunRequest } from './protocol';

const SQLJS_SCRIPT_URL = '/vendor/sql.js/sql-wasm.js';
const SQLJS_WASM_URL = '/vendor/sql.js/sql-wasm.wasm';

type SqlValue = number | string | Uint8Array | null;

interface SqlResult {
  columns: string[];
  values: SqlValue[][];
}

interface SqlDatabase {
  exec(sql: string): SqlResult[];
  close(): void;
}

interface SqlJs {
  Database: new () => SqlDatabase;
}

type SqlJsFactory = (options: { locateFile: (file: string) => string }) => Promise<SqlJs>;

let sqlReady: Promise<SqlJs> | null = null;

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-cw-runner="sqljs"]');
    if (existing?.dataset.loaded === 'true') return resolve();
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Could not load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.cwRunner = 'sqljs';
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        resolve();
      },
      { once: true },
    );
    script.addEventListener('error', () => reject(new Error(`Could not load ${src}`)), { once: true });
    document.head.append(script);
  });
}

/** Loads the same-origin sql.js runtime once, but creates a fresh database for every run. */
export function loadSqlJs(): Promise<SqlJs> {
  if (!sqlReady) {
    const ready = (async () => {
      await injectScript(SQLJS_SCRIPT_URL);
      const factory = (globalThis as { initSqlJs?: SqlJsFactory }).initSqlJs;
      if (typeof factory !== 'function') throw new Error('sql-wasm.js loaded without defining initSqlJs');
      return factory({ locateFile: () => SQLJS_WASM_URL });
    })();
    ready.catch(() => {
      if (sqlReady === ready) sqlReady = null;
    });
    sqlReady = ready;
  }
  return sqlReady;
}

function display(value: SqlValue): string {
  if (value === null) return 'NULL';
  if (value instanceof Uint8Array) return `[blob ${value.byteLength} bytes]`;
  return String(value);
}

/** A terminal-friendly table with stable column widths and no dependency on DOM table layout. */
export function formatSqlTable(result: SqlResult): string {
  const rows = result.values.map((row) => row.map(display));
  const widths = result.columns.map((column, index) =>
    Math.max(column.length, ...rows.map((row) => (row[index] ?? '').length)),
  );
  const row = (values: string[], separator = ' | ') =>
    values
      .map((value, index) => value.padEnd(widths[index] ?? value.length))
      .join(separator)
      .trimEnd();

  return [
    row(result.columns),
    row(
      widths.map((width) => '-'.repeat(width)),
      '-+-',
    ),
    ...rows.map((values) => row(values)),
  ].join('\n');
}

/** Minimal RFC 4180 reader for the compact expected-result tables carried by kata metadata. */
export function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]!;
    if (quoted) {
      if (char === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field.trim());
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && csv[index + 1] === '\n') index += 1;
      row.push(field.trim());
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some((value) => value !== '')) rows.push(row);
  return rows;
}

function expectedValue(value: string): number | string | null {
  if (/^null$/i.test(value)) return null;
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(value)) return Number(value);
  return value;
}

export function sqlResultMatches(result: SqlResult | undefined, csv: string): boolean {
  const expected = parseCsv(csv);
  if (!result || expected.length === 0) return false;
  const [columns, ...rows] = expected;
  if (!columns || columns.length !== result.columns.length) return false;
  if (!columns.every((column, index) => column === result.columns[index])) return false;
  if (rows.length !== result.values.length) return false;

  return rows.every((row, rowIndex) => {
    if (row.length !== result.columns.length) return false;
    return row.every((value, columnIndex) => {
      const actual = result.values[rowIndex]?.[columnIndex];
      const expectedCell = expectedValue(value);
      return actual instanceof Uint8Array
        ? display(actual) === String(expectedCell)
        : Object.is(actual, expectedCell);
    });
  });
}

/** Executes optional setup plus the authored SQL in an isolated in-memory SQLite database. */
export async function runSql(
  request: RunRequest,
  onEvent: RunEventHandler,
  options: RunOptions = {},
): Promise<void> {
  try {
    options.onStatus?.('loading-sql');
    const SQL = await loadSqlJs();
    options.onStatus?.('running');
    const database = new SQL.Database();
    const started = performance.now();

    try {
      if (request.seed?.trim()) database.exec(request.seed);
      const { code, tests } = splitSqlTests(request.code);
      const results = database.exec(code);
      for (const result of results) onEvent({ id: request.id, kind: 'stdout', text: formatSqlTable(result) });

      if (tests) {
        if (sqlResultMatches(results.at(-1), tests)) {
          onEvent({ id: request.id, kind: 'stdout', text: TEST_PASS_LINE });
        } else {
          const expected = parseCsv(tests);
          const expectedText = expected.length > 0 ? expected.map((row) => row.join(',')).join(' / ') : tests;
          onEvent({
            id: request.id,
            kind: 'stderr',
            text: `assertion failed: the last result set did not match ${expectedText}`,
          });
          onEvent({ id: request.id, kind: 'error' });
          return;
        }
      }

      onEvent({ id: request.id, kind: 'done', ms: Math.round(performance.now() - started) });
    } finally {
      database.close();
    }
  } catch (error) {
    onEvent({ id: request.id, kind: 'stderr', text: error instanceof Error ? error.message : String(error) });
    onEvent({ id: request.id, kind: 'error' });
  }
}
