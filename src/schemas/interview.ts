import { z } from 'astro/zod';
import { TRACKS } from '@/data/tracks';
import { localized, slug, topicRef } from '@/schemas/localized';
import { difficulty } from '@/schemas/topic';
const trackSlugs = TRACKS.map((t) => t.slug) as [string, ...string[]];
export const interviewItemSchema = z.object({
  id: slug,
  question: localized,
  answer: localized,
  topics: z.array(topicRef).min(1),
  level: difficulty,
  tags: z.array(z.string()).default([]),
  /** Section heading the question is grouped under, e.g. "Language core". */
  section: localized.optional(),
  /** How often interviewers ask it; shown as a chip. */
  frequency: z.enum(['common', 'occasional', 'rare']).optional(),
});
export const interviewSchema = z.object({
  track: z.enum(trackSlugs),
  items: z.array(interviewItemSchema).min(1),
});
export type InterviewItem = z.infer<typeof interviewItemSchema>;
export type Interview = z.infer<typeof interviewSchema>;
