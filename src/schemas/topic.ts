import { z } from 'astro/zod';
import { TRACKS } from '@/data/tracks';
import { topicRef } from '@/schemas/localized';

const trackSlugs = TRACKS.map((t) => t.slug) as [string, ...string[]];

export const difficulty = z.enum(['beginner', 'intermediate', 'advanced']);

/** Frontmatter of a topic article (one file per language). Spec §4. */
export const topicSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(40).max(170),
    track: z.enum(trackSlugs),
    section: z.string().regex(/^[a-z0-9-]+$/),
    difficulty,
    tags: z.array(z.string()).default([]),
    prerequisites: z.array(topicRef).default([]),
    related: z.array(topicRef).default([]),
    terms: z.array(z.string()).default([]),
    verified: z.object({ version: z.string(), date: z.coerce.date() }),
    reviewed: z.coerce.date().nullable().default(null),
    status: z.enum(['imported', 'draft', 'reviewed']).default('draft'),
    aligned: z.boolean().default(false),
    quiz: z.string().optional(),
    sources: z.array(z.object({ title: z.string(), url: z.url() })).default([]),
    origin: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.status === 'reviewed' && !v.reviewed)
      ctx.addIssue({ code: 'custom', message: 'reviewed topics need a reviewed date' });
  });

export type TopicFrontmatter = z.infer<typeof topicSchema>;
