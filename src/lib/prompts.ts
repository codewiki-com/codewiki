/**
 * The Ask-AI prompts — spec §14.2.
 *
 * One template, six presets. The template is written in English whatever the reader's locale is,
 * because it addresses the assistant, not the reader: what the locale decides is the language the
 * answer comes back in. The page's own text is quoted verbatim between triple quotes so the model
 * works from what the reader is looking at rather than from its memory of the subject.
 *
 * Pure and dependency-free: the island builds prompts in the browser, and the unit tests build
 * them in Node.
 */
import type { Locale } from '@/lib/urls';

/** The six presets, in the order the panel lists them. */
export const PRESETS = ['explain', 'quiz', 'bugs', 'compare', 'apply', 'feynman'] as const;

export type Preset = (typeof PRESETS)[number];

export interface PromptContext {
  preset: Preset;
  /** The reader's locale; it decides the language of the answer, not of the prompt. */
  locale: Locale;
  /** Topic title, e.g. `Closures`. */
  title: string;
  /** Canonical URL of the page the prompt was built from. */
  url: string;
  /** Heading of the scoped section; empty when the scope is the whole page. */
  section: string;
  /** The text of that scope, quoted into the prompt verbatim. */
  sectionText: string;
  /** The programming language of the examples, e.g. `Python`. */
  language: string;
  /** What the reader is assumed to know already; `explain` builds on it. */
  prerequisite?: string;
}

/** The language the answer must come back in, named in that language. */
const READER_LANGUAGE: Record<Locale, string> = { en: 'English', zh: '中文' };

/** What the reader is assumed to know when the topic names no prerequisite. */
const DEFAULT_PREREQUISITE = 'the basics';

/** The instruction line each preset contributes, with `{prerequisite}` and `{language}` filled in. */
const INSTRUCTIONS: Record<Preset, string> = {
  explain:
    'Explain this as if I only know {prerequisite}. Use one small example and no term you have not explained first.',
  quiz: 'Ask me one question at a time about this section, wait for my answer, then tell me what I got wrong before you ask the next one.',
  bugs: 'Introduce three subtle bugs into the example above and let me find them. Reveal each answer only after I have guessed.',
  compare:
    'Show the same idea in another language of your choice and name the differences that would trip me up coming from {language}.',
  apply:
    'Here is my own code:\n"""\n(paste your code here)\n"""\nShow me how the idea above applies to it, and what I should change.',
  feynman:
    'I will explain this section back to you in my own words. Grade my explanation against the text above: name what I got wrong, what I left out, and what I only repeated without understanding.',
};

/** The outer bound on a deep link, in the characters the reader would see. */
const LINK_LIMIT = 6_000;

/**
 * The bound that actually matters: what the URL carries. A Latin character encodes to one query
 * character but a Chinese one to nine (three UTF-8 bytes, percent-escaped), so a prompt inside the
 * source bound can still be a 36 KB query — which a server is entitled to answer with 414.
 */
export const QUERY_LIMIT = 8_000;

/** What a truncated prompt ends with, so the reader can see that it was cut. */
const CUT_MARKER = ' […]';

/** The prompt text for one preset, ready to be copied or handed to an assistant. */
export function buildPrompt(context: PromptContext): string {
  const { preset, locale, title, url, section, sectionText, language, prerequisite } = context;

  const scope = section.trim() ? `, section "${section.trim()}"` : '';
  const instruction = INSTRUCTIONS[preset]
    .replace('{prerequisite}', prerequisite?.trim() || DEFAULT_PREREQUISITE)
    .replace('{language}', language);

  return [
    `I am reading "${title}" on codewiki (${url})${scope}.`,
    'Context (verbatim from the page):',
    '"""',
    sectionText.trim(),
    '"""',
    instruction,
    `Answer in ${READER_LANGUAGE[locale]}. Keep code examples in ${language}. Where you are unsure, say so.`,
  ].join('\n');
}

/** How long this text is once it is in a query string. */
export const encodedLength = (text: string): number => encodeURIComponent(text).length;

/**
 * A prefix of `text`, never splitting a surrogate pair: `encodeURIComponent` throws a URIError on
 * a lone half, so every cut has to land between whole characters.
 */
function sliceSafely(text: string, length: number): string {
  const last = text.charCodeAt(length - 1);
  const end = last >= 0xd800 && last <= 0xdbff ? length - 1 : length;
  return text.slice(0, Math.max(end, 0));
}

/**
 * Where to end a cut so it reads as a stopped thought rather than a severed word: the last
 * paragraph break, or failing that the last sentence end, provided it is in the final fifth of
 * what is left. Anything earlier would throw away more than the tidiness is worth.
 */
function boundary(text: string): number {
  const floor = Math.floor(text.length * 0.8);

  const paragraph = text.lastIndexOf('\n\n');
  if (paragraph >= floor) return paragraph;

  let sentence = -1;
  for (const match of text.matchAll(/[.!?](?=\s|$)|[。！？]/g)) sentence = match.index + match[0].length;
  return sentence >= floor ? sentence : text.length;
}

/** The prompt cut to what a URL can carry, under both bounds. */
export function forLink(prompt: string): string {
  if (prompt.length <= LINK_LIMIT && encodedLength(prompt) <= QUERY_LIMIT) return prompt;

  let cut = sliceSafely(prompt, Math.min(prompt.length, LINK_LIMIT));
  if (encodedLength(cut + CUT_MARKER) > QUERY_LIMIT) {
    // The encoded length of a prefix only grows, so the longest one that fits is a binary search.
    let low = 0;
    let high = cut.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (encodedLength(sliceSafely(prompt, middle) + CUT_MARKER) <= QUERY_LIMIT) low = middle;
      else high = middle - 1;
    }
    cut = sliceSafely(prompt, low);
  }
  return cut.slice(0, boundary(cut)).trimEnd() + CUT_MARKER;
}

/** Links that open the assistant with the prompt already typed in. */
export function deepLinks(prompt: string): { claude: string; chatgpt: string } {
  const q = encodeURIComponent(forLink(prompt));
  return { claude: `https://claude.ai/new?q=${q}`, chatgpt: `https://chatgpt.com/?q=${q}` };
}
