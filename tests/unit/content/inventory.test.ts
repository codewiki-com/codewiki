import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInventory } from '../../../scripts/content/inventory';

const fixtureRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../fixtures/old');

describe('buildInventory', () => {
  it('inventories the fixture corpus', async () => {
    const inventory = await buildInventory(fixtureRoot);
    expect(inventory.pairs).toHaveLength(2);
    expect(inventory.summary.pairs).toBe(2);
    const closures = inventory.pairs.find((pair) => pair.id === 'python/closures');
    expect(closures).toBeDefined();
    expect(closures!.en.titleLangMismatch).toBe(false);
    for (const pair of inventory.pairs) {
      expect(pair.divergence).toBeGreaterThanOrEqual(0);
      expect(pair.divergence).toBeLessThanOrEqual(1);
    }
  });

  it('flags language, subcategory and H1 issues', async () => {
    const inventory = await buildInventory(fixtureRoot);
    const closures = inventory.pairs.find((pair) => pair.id === 'python/closures')!;
    const cargo = inventory.pairs.find((pair) => pair.id === 'rust/cargo')!;
    expect(closures.issues).toContain('missing-subcategory-en');
    expect(closures.en.subcategory).toBe('');
    expect(closures.zh.subcategory).toBe('函数式编程');
    expect(cargo.en.titleLangMismatch).toBe(true);
    expect(cargo.issues).toContain('title-lang-en');
    expect(cargo.en.bodyLangMismatch).toBe(false);
    expect(cargo.zh.bodyLangMismatch).toBe(false);
    expect(cargo.en.hasH1).toBe(false);
    expect(cargo.en.fenceCount).toBeGreaterThan(0);
    expect(cargo.en.order).toBe(9);
    expect(cargo.en.difficulty).toBe('beginner');
    expect(cargo.category).toBe('rust');
  });

  it('counts categories and subcategories', async () => {
    const inventory = await buildInventory(fixtureRoot);
    expect(inventory.categories).toEqual({ python: 1, rust: 1 });
    expect(inventory.subcategories['工具链']).toBe(2);
    expect(new Date(inventory.generatedAt).getTime()).not.toBeNaN();
  });
});
