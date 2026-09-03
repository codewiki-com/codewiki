import { z } from 'astro/zod';
import { localized, slug } from '@/schemas/localized';

/**
 * One glossary term, one YAML file: `src/content/glossary/free-variable.yaml`. The loader derives
 * the entry id from the filename, so `id` in the file is optional (and redundant when present).
 */
export const termSchema = z.object({
  id: slug.optional(),
  en: z.string().min(1),
  zh: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  short: localized,
  topics: z.array(z.string()).default([]),
});

export type Term = z.infer<typeof termSchema>;
