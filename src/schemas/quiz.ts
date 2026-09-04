import { z } from 'astro/zod';
import { difficulty } from '@/schemas/topic';
import { localized, topicRef } from '@/schemas/localized';

const option = z.object({ text: localized, correct: z.boolean().default(false) });

export const issueKind = z.enum(['security', 'correctness', 'edge-case', 'readability', 'performance']);
const issue = z.object({
  line: z.number().int().positive(),
  lines: z.number().int().positive().optional(),
  kind: issueKind,
  note: localized,
});

const base = {
  id: z.string().min(1),
  title: localized.optional(),
  prompt: localized,
  explanation: localized,
  difficulty,
  tags: z.array(z.string()).default([]),
  /** Optional test lines for the playground's kata mode (assertions after the user code). */
  tests: z.string().optional(),
  /** Minutes the item takes; the catalogue shows it. Default by type below. */
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
    right: localized.optional(),
    checklist: z.array(localized).default([]),
    task: localized.optional(),
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
