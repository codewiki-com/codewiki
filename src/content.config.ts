import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { topicSchema } from '@/schemas/topic';
import { quizSchema } from '@/schemas/quiz';
import { termSchema } from '@/schemas/glossary';
import { pathSchema } from '@/schemas/path';
import { topicIdFromPath } from '@/lib/content-ids';

// Topics are one MDX file per language; the entry id keeps the language so both files of a pair
// live in the same collection: `python/closures.zh.mdx` -> `python/closures/zh`.
const topics = defineCollection({
  loader: glob({
    pattern: '**/*.{en,zh}.mdx',
    base: './src/content/topics',
    generateId: ({ entry }) => topicIdFromPath(entry),
  }),
  schema: topicSchema,
});

// Data collections: one YAML file per entry, id derived from the path (`python/closures`).
const quizzes = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/quizzes' }),
  schema: quizSchema,
});

const glossary = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/glossary' }),
  schema: termSchema,
});

const paths = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/paths' }),
  schema: pathSchema,
});

export const collections = { topics, quizzes, glossary, paths };
