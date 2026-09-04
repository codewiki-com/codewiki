import type { RunEvent, RunLang } from '@/lib/runners/protocol';

export const TEST_PASS_LINE = 'ALL TESTS PASSED';
export const SQL_TEST_MARKER = '-- codewiki-kata-tests:';

/**
 * Adds a small, language-native test harness to a program. SQL is evaluated by the sql.js runner:
 * the encoded marker keeps arbitrary CSV on one comment line while leaving the authored query
 * valid SQL.
 */
export function wrapWithTests(lang: RunLang, code: string, tests: string): string {
  const source = code.trimEnd();
  const assertions = tests.trim();

  if (!assertions) return source;

  if (lang === 'python') {
    return `${source}\n\n${assertions}\nprint(${JSON.stringify(TEST_PASS_LINE)})`;
  }

  if (lang === 'js' || lang === 'ts') {
    const assert = 'function assert(c, m) { if (!c) throw new Error("assertion failed: " + (m ?? "")); }';
    return `${assert}\n\n${source}\n\n${assertions}\nconsole.log(${JSON.stringify(TEST_PASS_LINE)});`;
  }

  if (lang === 'sql') {
    return `${source}\n${SQL_TEST_MARKER}${encodeURIComponent(assertions)}`;
  }

  return source;
}

/** Removes the private SQL test marker before SQLite sees the authored statements. */
export function splitSqlTests(source: string): { code: string; tests?: string } {
  const index = source.lastIndexOf(SQL_TEST_MARKER);
  if (index < 0) return { code: source };

  const encoded =
    source
      .slice(index + SQL_TEST_MARKER.length)
      .trim()
      .split(/\r?\n/, 1)[0] ?? '';
  try {
    const tests = decodeURIComponent(encoded);
    return tests
      ? { code: source.slice(0, index).trimEnd(), tests }
      : { code: source.slice(0, index).trimEnd() };
  } catch {
    return { code: source };
  }
}

/** Turns the runner stream into the one result the kata UI needs. */
export function parseTestResult(events: RunEvent[]): { passed: boolean; failures: string[] } {
  const passed = events.some(
    (event) => event.kind === 'stdout' && (event.text ?? '').split(/\r?\n/).includes(TEST_PASS_LINE),
  );

  const failures = events
    .filter((event) => event.kind === 'stderr' || event.kind === 'error')
    .flatMap((event) => (event.text ?? '').split(/\r?\n/))
    .map((line) => line.trim())
    .filter(Boolean);

  return { passed: passed && failures.length === 0, failures };
}
