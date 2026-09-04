import { z } from 'astro/zod';
import { difficulty } from '@/schemas/topic';
import { localized, slug, topicRef } from '@/schemas/localized';

const milestone = z.object({
  id: slug,
  title: localized,
  topics: z.array(topicRef).min(1),
  /** Quiz id closing the milestone, e.g. `python/checkpoint-2`. */
  checkpoint: topicRef,
});

/** A learning path: ordered milestones over one or more tracks, plus the map's arrows. Spec §4. */
export const pathSchema = z.object({
  id: slug.optional(),
  title: localized,
  description: localized,
  /** A short explanation of why the milestones appear in this order. */
  rationale: localized.optional(),
  tracks: z.array(slug).min(1),
  level: z.object({ from: difficulty, to: difficulty }),
  hours: z.number().positive(),
  outcomes: z.array(localized).default([]),
  milestones: z.array(milestone).min(1),
  /** Explicit prerequisite arrows drawn between topics on the path map. */
  edges: z.array(z.object({ from: topicRef, to: topicRef })).default([]),
});

export type Path = z.infer<typeof pathSchema>;
