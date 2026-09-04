import { assemble, estimateTokens, GOALS, type PromptOptions, type TopicCard } from '@/lib/prompt-builder';
import { QUERY_LIMIT } from '@/lib/prompts';

const topic: TopicCard = {
  id: 'python/closures',
  title: 'Closures',
  track: 'python',
  slug: 'closures',
  md: 'https://codewiki.com/python/closures.md',
  terms: ['closure', 'free variable'],
  pitfalls: ['Do not capture one loop binding when each callback needs its own value.'],
};

const options: PromptOptions = {
  link: true,
  checklist: true,
  vocabulary: true,
  zh: false,
  concise: false,
};

describe('prompt builder', () => {
  it.each(GOALS)('assembles the fixed sections for the %s goal', (goal) => {
    const prompt = assemble({
      topics: [topic],
      goal,
      level: 'intermediate',
      options,
      code: 'print("hello")',
      lang: 'Python',
    });

    for (const heading of ['Role', 'Context', 'Task', 'Checklist first', 'Output', 'Code']) {
      expect(prompt).toContain(`## ${heading}`);
    }
  });

  it('links the Markdown twin only when the link option is selected', () => {
    const linked = assemble({
      topics: [topic],
      goal: 'review',
      level: 'intermediate',
      options,
      code: '',
      lang: 'Python',
    });
    const plain = assemble({
      topics: [topic],
      goal: 'review',
      level: 'intermediate',
      options: { ...options, link: false },
      code: '',
      lang: 'Python',
    });
    expect(linked).toContain('[Closures](https://codewiki.com/python/closures.md)');
    expect(plain).toContain('- Closures');
    expect(plain).not.toContain('closures.md');
  });

  it('drops oversized code before applying the query limit', () => {
    const prompt = assemble({
      topics: [topic],
      goal: 'review',
      level: 'advanced',
      options,
      code: `start\n${'闭'.repeat(5_000)}\nend`,
      lang: 'Python',
    });
    expect(prompt).toContain('[code truncated]');
    expect(prompt).not.toContain('\nend');
    expect(encodeURIComponent(prompt).length).toBeLessThanOrEqual(QUERY_LIMIT);
  });

  it('adds the Chinese answer instruction and estimates tokens by characters', () => {
    const prompt = assemble({
      topics: [topic],
      goal: 'explain',
      level: 'beginner',
      options: { ...options, zh: true },
      code: '',
      lang: 'Python',
    });
    expect(prompt).toContain('Answer in Simplified Chinese; keep identifiers in English.');
    expect(estimateTokens('12345')).toBe(2);
  });
});
