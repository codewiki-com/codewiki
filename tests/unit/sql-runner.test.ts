import { describe, expect, it } from 'vitest';
import { formatSqlTable, parseCsv, sqlResultMatches } from '@/lib/runners/sql';

describe('SQL result helpers', () => {
  it('aligns headings and result cells as a plain-text table', () => {
    expect(
      formatSqlTable({
        columns: ['name', 'n'],
        values: [
          ['Ada', 2],
          ['Grace', null],
        ],
      }),
    ).toBe('name  | n\n------+-----\nAda   | 2\nGrace | NULL');
  });

  it('parses quoted CSV cells', () => {
    expect(parseCsv('name,value\n"one, two",2')).toEqual([
      ['name', 'value'],
      ['one, two', '2'],
    ]);
  });

  it('compares the final SQL result to CSV headings and rows', () => {
    expect(sqlResultMatches({ columns: ['x'], values: [[1]] }, 'x\n1')).toBe(true);
    expect(sqlResultMatches({ columns: ['x'], values: [[2]] }, 'x\n1')).toBe(false);
  });
});
