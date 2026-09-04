import { z } from 'astro/zod';
import { TRACKS } from '@/data/tracks';
import { localized, slug, topicRef } from '@/schemas/localized';
import { difficulty } from '@/schemas/topic';

const trackSlugs = TRACKS.map((t) => t.slug) as [string, ...string[]];

/**
 * One interview question. `topics` is what ties the question back to the articles it is
 * drawn from, so it may never be empty: a question no topic answers has nowhere to live
 * on the site.
 */
export const interviewItemSchema = z.object({
  id: slug,
  question: localized,
  answer: localized,
  topics: z.array(topicRef).min(1),
  level: difficulty,
  /** The heading the question is grouped under on the track's interview page. */
  section: localized.optional(),
  /** How often the question actually comes up, which is how a reader prioritises. */
  frequency: z.enum(['common', 'occasional', 'rare']).optional(),
  tags: z.array(z.string()).default([]),
});

/**
 * One interview bank per track: `src/content/interview/python.yaml`. The polish pass
 * appends items to the track's file, so the file grows as topics are reviewed and is
 * never empty once it exists.
 */
export const interviewSchema = z.object({
  track: z.enum(trackSlugs),
  items: z.array(interviewItemSchema).min(1),
});

export type InterviewItem = z.infer<typeof interviewItemSchema>;
export type Interview = z.infer<typeof interviewSchema>;
