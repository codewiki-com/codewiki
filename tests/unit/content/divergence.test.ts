import { headingSimilarity, divergenceScore } from '../../../scripts/content/lib/divergence';
describe('divergence', () => {
  it('identical structures score 0', () => {
    expect(
      divergenceScore(
        { headingDepths: [2, 3, 3, 2], words: 1000 },
        { headingDepths: [2, 3, 3, 2], words: 1100 },
      ),
    ).toBeLessThan(0.1);
  });
  it('different structures score high', () => {
    expect(
      divergenceScore(
        { headingDepths: [2, 3, 3, 2], words: 1000 },
        { headingDepths: [2, 2, 2, 2, 2, 2, 3, 3, 3], words: 2500 },
      ),
    ).toBeGreaterThan(0.5);
  });
  it('similarity is symmetric', () => {
    expect(headingSimilarity([2, 3], [2, 3, 3])).toBe(headingSimilarity([2, 3, 3], [2, 3]));
  });
  it('scores empty structures as identical', () => {
    expect(headingSimilarity([], [])).toBe(1);
    expect(divergenceScore({ headingDepths: [], words: 0 }, { headingDepths: [], words: 0 })).toBe(0);
  });
  it('stays inside 0..1', () => {
    expect(
      divergenceScore({ headingDepths: [], words: 10 }, { headingDepths: [2, 2], words: 9000 }),
    ).toBeLessThanOrEqual(1);
  });
});
