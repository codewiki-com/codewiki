import { z } from 'astro/zod';
import { difficulty } from '@/schemas/topic';
import { localized, topicRef } from '@/schemas/localized';

const option = z.object({ text: localized, correct: z.boolean().default(false) });

/**
 * What a reviewer found. The closed list is what lets a review item be graded and
 * summarised: "3–5 issues of distinct kinds" is only meaningful if the kinds are drawn
 * from one vocabulary rather than invented per topic.
 */
export const issueKind = z.enum(['security', 'correctness', 'edge-case', 'readability', 'performance']);

/** One finding. `lines` closes a span that starts at `line`, for issues wider than a line. */
const issue = z.object({
  line: z.number().int().positive(),
  lines: z.number().int().positive().optional(),
  kind: issueKind,
  note: localized,
});

const base = {
  id: z.string().min(1),
  prompt: localized,
  explanation: localized,
  difficulty,
  tags: z.array(z.string()).default([]),
  /** How the learner can check the answer themselves, e.g. a command or a test snippet. */
  tests: z.string().optional(),
  /** Rough time to work through the item, for the estimate shown above a bank. */
  minutes: z.number().int().positive().optional(),
};

/** Options-based items name exactly one right answer; anything else is an authoring mistake. */
const options = z
  .array(option)
  .min(2)
  .superRefine((v, ctx) => {
    const correct = v.filter((o) => o.correct).length;
    if (correct !== 1)
      ctx.addIssue({ code: 'custom', message: `expected exactly one correct option, got ${correct}` });
  });

const code = { code: z.string().min(1), lang: z.string().min(1) };

export const quizItemSchema = z.discriminatedUnion('type', [
  z.object({ ...base, type: z.literal('mcq'), options }),
  z.object({ ...base, type: z.literal('predict'), ...code, options }),
  z.object({ ...base, type: z.literal('spotbug'), ...code, issues: z.array(issue).min(1) }),
  z.object({
    ...base,
    type: z.literal('review'),
    ...code,
    issues: z.array(issue).min(1),
    /** The task the code was generated for; without it the reader cannot judge the code. */
    task: localized.optional(),
    /** What the generated code got right, so the exercise is a review and not a hunt. */
    right: localized.optional(),
    /** Checks the learner should run on any generated code of this shape. */
    checklist: z.array(localized).default([]),
  }),
  z.object({ ...base, type: z.literal('fill'), answer: z.string().min(1) }),
]);

/** One quiz bank per topic: `src/content/quizzes/python/closures.yaml`. */
export const quizSchema = z.object({
  id: topicRef.optional(),
  topic: topicRef,
  items: z.array(quizItemSchema).min(1),
});

export type QuizItem = z.infer<typeof quizItemSchema>;
export type Quiz = z.infer<typeof quizSchema>;
