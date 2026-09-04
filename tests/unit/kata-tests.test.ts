import { describe, expect, it } from 'vitest';
import { parseTestResult, splitSqlTests, TEST_PASS_LINE, wrapWithTests } from '@/lib/kata-tests';

describe('wrapWithTests', () => {
  it('appends Python assertions and a passing marker', () => {
    const program = wrapWithTests('python', 'answer = 2', 'assert answer == 2');
    expect(program).toContain('answer = 2\n\nassert answer == 2');
    expect(program).toContain(`print("${TEST_PASS_LINE}")`);
  });

  it('defines a useful JavaScript assertion before the program', () => {
    const program = wrapWithTests('js', 'const answer = 2;', 'assert(answer === 2, "answer")');
    expect(program.indexOf('function assert')).toBeLessThan(program.indexOf('const answer'));
    expect(program).toContain('assertion failed:');
    expect(program).toContain(`console.log("${TEST_PASS_LINE}")`);
  });

  it('uses the JavaScript harness for TypeScript too', () => {
    expect(wrapWithTests('ts', 'const answer: number = 2;', 'assert(answer === 2)')).toContain(
      'function assert',
    );
  });

  it('carries SQL CSV expectations without exposing them to SQLite', () => {
    const wrapped = wrapWithTests('sql', 'SELECT 1 AS x;', 'x\n1');
    expect(splitSqlTests(wrapped)).toEqual({ code: 'SELECT 1 AS x;', tests: 'x\n1' });
  });
});

describe('parseTestResult', () => {
  it('passes only when the marker arrived without a failure', () => {
    expect(parseTestResult([{ id: '1', kind: 'stdout', text: TEST_PASS_LINE }])).toEqual({
      passed: true,
      failures: [],
    });
  });

  it('collects assertion output from stderr and error events', () => {
    expect(
      parseTestResult([
        { id: '1', kind: 'stderr', text: 'AssertionError: wanted 3' },
        { id: '1', kind: 'error', text: 'test stopped' },
      ]),
    ).toEqual({ passed: false, failures: ['AssertionError: wanted 3', 'test stopped'] });
  });
});
