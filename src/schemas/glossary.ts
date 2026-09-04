import { z } from 'astro/zod';
import { slug } from '@/schemas/localized';

/** Glossary cards are laid out for a one-sentence definition; spec §4 caps it at 140 characters. */
const shortDefinition = z.object({
  en: z.string().min(1).max(140),
  zh: z.string().min(1).max(140),
});

/**
 * One glossary term, one YAML file: `src/content/glossary/free-variable.yaml`. The loader derives
 * the entry id from the filename, so `id` in the file is optional (and redundant when present).
 */
export const termSchema = z.object({
  id: slug.optional(),
  en: z.string().min(1),
  zh: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  short: shortDefinition,
  topics: z.array(z.string()).default([]),
});

/** A proposal term carries an id because extraction uses it as the target filename. */
export const glossaryProposalTermSchema = termSchema.extend({ id: slug });

/** One per-topic proposal file written beside the polished content. */
export const glossaryProposalSchema = z.object({
  terms: z.array(glossaryProposalTermSchema),
});

export type Term = z.infer<typeof termSchema>;
