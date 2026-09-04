// Every file under src/content must satisfy the collection schema. This runs the same Zod schemas
// as `astro sync` without booting Astro, so a bad sample fails in `pnpm test` too.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { parse } from 'yaml';
import { topicSchema } from '@/schemas/topic';
import { termSchema } from '@/schemas/glossary';
import { quizSchema } from '@/schemas/quiz';
import { pathSchema } from '@/schemas/path';
import { topicIdFromPath, parseTopicId } from '@/lib/content-ids';

const root = fileURLToPath(new URL('../../src/content/', import.meta.url));

function files(dir: string, ext: string): string[] {
  return readdirSync(root + dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith(ext))
    .sort();
}

const read = (dir: string, file: string) => readFileSync(`${root}${dir}/${file}`, 'utf8');

describe('topic fixtures', () => {
  const mdx = files('topics', '.mdx');

  it('ships both languages of every sample topic', () => {
    expect(mdx).toEqual([
      'ai/langchain.en.mdx',
      'ai/langchain.zh.mdx',
      'architecture/cap-theorem.en.mdx',
      'architecture/cap-theorem.zh.mdx',
      'backend/jwt-authentication.en.mdx',
      'backend/jwt-authentication.zh.mdx',
      'cpp/move-semantics.en.mdx',
      'cpp/move-semantics.zh.mdx',
      'javascript/event-loop.en.mdx',
      'javascript/event-loop.zh.mdx',
      'python/asyncio.en.mdx',
      'python/asyncio.zh.mdx',
      'python/closures.en.mdx',
      'python/closures.zh.mdx',
    ]);
  });

  it.each(mdx)('%s has valid frontmatter', (file) => {
    const data = topicSchema.parse(matter(read('topics', file)).data);
    const { track, slug } = parseTopicId(topicIdFromPath(file));
    expect(data.track).toBe(track);
    expect(slug.length).toBeGreaterThan(0);
    if (data.status === 'reviewed') expect(data.reviewed).toBeInstanceOf(Date);
  });
});

describe('data fixtures', () => {
  const yamlOf = (dir: string, file: string) => parse(read(dir, file)) as unknown;

  it.each(files('glossary', '.yaml'))('glossary/%s is a valid term', (file) => {
    const term = termSchema.parse(yamlOf('glossary', file));
    // Spec §4: a glossary card shows one sentence, at most 140 characters per language.
    expect(term.short.en.length).toBeGreaterThan(0);
    expect(term.short.en.length).toBeLessThanOrEqual(140);
    expect(term.short.zh.length).toBeGreaterThan(0);
    expect(term.short.zh.length).toBeLessThanOrEqual(140);
    if (term.id) expect(term.id).toBe(file.replace(/\.yaml$/, ''));
  });

  it.each(files('quizzes', '.yaml'))('quizzes/%s is a valid quiz', (file) => {
    const quiz = quizSchema.parse(yamlOf('quizzes', file));
    expect(quiz.topic).toBe(file.replace(/\.yaml$/, ''));
  });

  it.each(files('paths', '.yaml'))('paths/%s is a valid path', (file) => {
    const path = pathSchema.parse(yamlOf('paths', file));
    const topics = path.milestones.flatMap((m) => m.topics);
    expect(new Set(topics).size).toBe(topics.length);
    for (const edge of path.edges) {
      expect(topics).toContain(edge.from);
      expect(topics).toContain(edge.to);
    }
  });
});
