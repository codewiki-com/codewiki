import { z } from 'astro/zod';
import { slug } from '@/schemas/localized';

/** Frontmatter shared by the two language variants of a printable cheatsheet. */
export const cheatsheetSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).max(160),
  track: slug.optional(),
  terms: z.array(slug).default([]),
  tags: z.array(z.string()).default([]),
  verified: z.object({ version: z.string().min(1), date: z.coerce.date() }),
  reviewed: z.coerce.date().nullable(),
  status: z.enum(['draft', 'reviewed']),
  aligned: z.boolean().default(false),
});

export type CheatsheetFrontmatter = z.infer<typeof cheatsheetSchema>;
