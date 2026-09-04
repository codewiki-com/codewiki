import { PRESETS, buildPrompt, deepLinks, type Preset } from '@/lib/prompts';

/** The fixed half of every prompt in these tests; only the preset and the locale vary. */
const page = {
  title: 'Closures',
  url: 'https://codewiki.com/python/closures/',
  section: 'Late binding',
  sectionText: 'Python looks up…',
  language: 'Python',
} as const;

describe('prompts', () => {
  it('embeds section text and answers in reader language', () => {
    const p = buildPrompt({
      preset: 'explain',
      locale: 'zh',
      title: 'Closures',
      url: 'https://codewiki.com/python/closures/',
      section: 'Late binding',
      sectionText: 'Python looks up…',
      language: 'Python',
      prerequisite: 'loops',
    });
    expect(p).toContain('"Late binding"');
    expect(p).toContain('Python looks up…');
    expect(p).toMatch(/中文|Chinese/);
  });

  it('truncates and encodes deep links', () => {
    const long = 'x'.repeat(10_000);
    const links = deepLinks(long);
    expect(decodeURIComponent(links.claude.split('?q=')[1]!).length).toBeLessThanOrEqual(6_010);
    expect(links.chatgpt.startsWith('https://chatgpt.com/?q=')).toBe(true);
  });

  it('follows the template of the spec, in the order the spec gives', () => {
    const p = buildPrompt({ preset: 'quiz', locale: 'en', ...page });
    expect(p.split('\n')).toEqual([
      'I am reading "Closures" on codewiki (https://codewiki.com/python/closures/), section "Late binding".',
      'Context (verbatim from the page):',
      '"""',
      'Python looks up…',
      '"""',
      'Ask me one question at a time about this section, wait for my answer, then tell me what I got wrong before you ask the next one.',
      'Answer in English. Keep code examples in Python. Where you are unsure, say so.',
    ]);
  });

  it('names the whole page when no section is scoped', () => {
    const p = buildPrompt({ preset: 'explain', locale: 'en', ...page, section: '' });
    expect(
      p.startsWith('I am reading "Closures" on codewiki (https://codewiki.com/python/closures/).\n'),
    ).toBe(true);
    expect(p).not.toContain('section ""');
  });

  it('falls back to a neutral prerequisite when the topic names none', () => {
    expect(buildPrompt({ preset: 'explain', locale: 'en', ...page })).toContain(
      'as if I only know the basics',
    );
    expect(buildPrompt({ preset: 'explain', locale: 'en', ...page, prerequisite: 'loops' })).toContain(
      'as if I only know loops',
    );
  });

  it('carries the reader language into the answer clause', () => {
    expect(buildPrompt({ preset: 'quiz', locale: 'en', ...page })).toContain('Answer in English.');
    expect(buildPrompt({ preset: 'quiz', locale: 'zh', ...page })).toContain('Answer in 中文.');
  });

  /** One assertion per preset: the instruction line is what makes the six presets different. */
  const instructions: Record<Preset, RegExp> = {
    explain: /^Explain this as if I only know/m,
    quiz: /^Ask me one question at a time/m,
    bugs: /^Introduce three subtle bugs/m,
    compare: /^Show the same idea in another language/m,
    apply: /^Here is my own code:/m,
    feynman: /^I will explain this section back to you/m,
  };

  it.each(PRESETS)('writes the %s instruction', (preset) => {
    const p = buildPrompt({ preset, locale: 'en', ...page });
    expect(p).toMatch(instructions[preset]);
    // Every preset keeps the frame: the page, the quoted context and the closing clause.
    expect(p).toContain('Context (verbatim from the page):');
    expect(p).toContain('Where you are unsure, say so.');
  });

  it('lists the six presets of the spec', () => {
    expect(PRESETS).toEqual(['explain', 'quiz', 'bugs', 'compare', 'apply', 'feynman']);
  });

  it('leaves a short prompt whole and encodes it once', () => {
    const links = deepLinks('two words');
    expect(links.claude).toBe('https://claude.ai/new?q=two%20words');
    expect(links.chatgpt).toBe('https://chatgpt.com/?q=two%20words');
  });

  it('marks a truncated prompt so the reader can see it was cut', () => {
    const cut = decodeURIComponent(deepLinks('x'.repeat(10_000)).chatgpt.split('?q=')[1]!);
    expect(cut.endsWith(' […]')).toBe(true);
    expect(cut.length).toBe(6_004);
  });
});
