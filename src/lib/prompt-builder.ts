/** Pure prompt assembly shared by the prompt-builder island and its unit tests. */
import { encodedLength, forLink, QUERY_LIMIT } from '@/lib/prompts';

export const GOALS = ['explain', 'quiz', 'review', 'port', 'tests', 'socratic'] as const;
export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export type Goal = (typeof GOALS)[number];
export type Level = (typeof LEVELS)[number];

export interface TopicCard {
  id: string;
  title: string;
  track: string;
  slug: string;
  md: string;
  terms: string[];
  pitfalls: string[];
}

export interface PromptOptions {
  link: boolean;
  checklist: boolean;
  vocabulary: boolean;
  zh: boolean;
  concise: boolean;
}

export interface AssembleInput {
  topics: TopicCard[];
  goal: Goal;
  level: Level;
  options: PromptOptions;
  code: string;
  /** Programming-language label used for the role and code fence. */
  lang: string;
}

const ROLE: Record<Goal, (lang: string) => string> = {
  explain: (lang) => `You are a precise ${lang} teacher. Explain unfamiliar terms before using them.`,
  quiz: (lang) => `You are a patient ${lang} examiner. Test understanding, not recall.`,
  review: (lang) =>
    `You are a senior ${lang} reviewer. Be specific and separate must-fix issues from improvements.`,
  port: (lang) =>
    `You are a ${lang} migration guide. Preserve behavior while using idioms of the target language.`,
  tests: (lang) => `You are a ${lang} test engineer. Turn stated behavior and pitfalls into focused tests.`,
  socratic: (lang) => `You are a Socratic ${lang} tutor. Guide the learner with one question at a time.`,
};

const TASK: Record<Goal, string> = {
  explain:
    'Explain the selected topic from first principles, then use one small example to check understanding.',
  quiz: 'Ask five questions, one at a time. Wait for each answer, grade it, then continue.',
  review: 'Review the code against the selected topics and their known pitfalls.',
  port: 'Port the idea or code to another language. Name the semantic differences that matter.',
  tests:
    'Write tests that cover the normal behavior, boundary cases, and failures suggested by the topic pitfalls.',
  socratic:
    'Teach through questions only. Do not reveal an answer until the learner asks or has attempted it.',
};

const OUTPUT: Record<Goal, string> = {
  explain: 'Use a short explanation, one minimal example, and a final understanding check.',
  quiz: 'Give one question at a time and keep a running score after each answer.',
  review: 'Return numbered findings, a corrected version when needed, and one thing the original did well.',
  port: 'Show the idiomatic target version first, followed by a concise behavior-difference table.',
  tests: 'Return runnable tests grouped by behavior, with one sentence explaining each edge case.',
  socratic: 'Ask one focused question at a time and wait for the learner before continuing.',
};

function topicContext(topic: TopicCard, link: boolean): string {
  return link ? `- [${topic.title}](${topic.md})` : `- ${topic.title}`;
}

function build(input: AssembleInput, code: string): string {
  const { topics, goal, level, options, lang } = input;
  const context =
    topics.length > 0
      ? topics.map((topic) => topicContext(topic, options.link))
      : ['- No topic selected yet.'];
  const terms = [...new Set(topics.flatMap((topic) => topic.terms))];
  const pitfalls = [...new Set(topics.flatMap((topic) => topic.pitfalls))];

  const sections = [
    `## Role\n${ROLE[goal](lang)}`,
    `## Context\nThe learner is ${level}. The selected codewiki ${topics.length === 1 ? 'topic is' : 'topics are'}:\n${context.join('\n')}${
      options.vocabulary && terms.length > 0 ? `\nUse this precise vocabulary: ${terms.join(', ')}.` : ''
    }`,
    `## Task\n${TASK[goal]}`,
  ];

  if (options.checklist) {
    const checklist =
      pitfalls.length > 0
        ? pitfalls.map((item) => `- ${item}`).join('\n')
        : '- State the assumptions you checked before giving the verdict.';
    sections.push(`## Checklist first\nBefore the answer, work through this checklist:\n${checklist}`);
  }

  sections.push(
    `## Output\n${OUTPUT[goal]}${options.concise ? '\nKeep the complete answer under 200 words.' : ''}${
      options.zh ? '\nAnswer in Simplified Chinese; keep identifiers in English.' : ''
    }`,
  );

  if (code) sections.push(`## Code\n\`\`\`${lang.toLowerCase()}\n${code}\n\`\`\``);
  return sections.join('\n\n');
}

/**
 * Assemble a prompt that is itself safe to put in a deep link. Code is the first expendable
 * input; if unusually large topic metadata still overflows, the shared link cutter is the final
 * guard and retains its visible truncation marker.
 */
export function assemble(input: AssembleInput): string {
  const code = input.code.trim();
  const complete = build(input, code);
  if (encodedLength(complete) <= QUERY_LIMIT) return complete;

  const withoutCode = build(input, code ? '[code truncated]' : '');
  return encodedLength(withoutCode) <= QUERY_LIMIT ? withoutCode : forLink(withoutCode);
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
