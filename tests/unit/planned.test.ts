import { deslug, plannedTitle, plannedTitlesFrom } from '@/lib/planned';

describe('planned topic titles', () => {
  it('de-slugs a reference without inventing words', () => {
    expect(deslug('python/classes-objects')).toBe('Classes objects');
    expect(deslug('go/reflect')).toBe('Reflect');
  });

  it('ignores a tier list that carries ids only', () => {
    const source = "tiers:\n  '1':\n    - python/scope-namespaces\n    - go/reflect\n";
    expect(plannedTitlesFrom(source).size).toBe(0);
  });

  it('reads bilingual titles when the tier list carries them', () => {
    const source = [
      'tiers:',
      "  '1':",
      "    - { id: python/classes-objects, title: { en: 'Classes and objects', zh: '类与对象' } }",
      '    - python/scope-namespaces',
      '',
    ].join('\n');
    const titles = plannedTitlesFrom(source);
    expect(titles.get('python/classes-objects')).toEqual({ en: 'Classes and objects', zh: '类与对象' });
    expect(titles.has('python/scope-namespaces')).toBe(false);
  });

  it('falls back to the de-slugged text for the shipped tier list', () => {
    expect(plannedTitle('python/classes-objects', 'en')).toBe('Classes objects');
  });
});
