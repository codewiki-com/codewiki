import { mostFrequent } from '@/lib/arrays';

describe('mostFrequent', () => {
  it('returns the most common value', () => {
    expect(mostFrequent(['a', 'b', 'a'])).toBe('a');
  });

  it('breaks ties by first appearance', () => {
    expect(mostFrequent(['b', 'a', 'a', 'b'])).toBe('b');
  });

  it('returns undefined for an empty list', () => {
    expect(mostFrequent([])).toBeUndefined();
  });

  it('handles a single value', () => {
    expect(mostFrequent(['Python 3.14'])).toBe('Python 3.14');
  });

  it('compares by identity, like a Map key', () => {
    expect(mostFrequent([1, 2, 2, 3])).toBe(2);
  });
});
