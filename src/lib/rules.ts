/** Pure extraction and rendering for the downloadable coding-agent rules packs. */
import { getTrack } from '@/data/tracks';
import { MARKER } from '@/markdown/remark-callouts';

export interface RuleTopic {
  title: string;
  url: string;
}

export interface Rule {
  text: string;
  why: string;
  topic: RuleTopic;
}

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n?/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const SENTENCE = /^([\s\S]*?[.!?。！？])(?:\s+|$)([\s\S]*)$/;
const IMPERATIVE =
  /^(?:do not|don't|never|avoid|prefer|use|keep|make|ensure|check|verify|call|inspect|trace|identify|confirm|bound|treat|express|assert|capture|remove|return|declare|test|name|state|find|mark)\b/i;
const MISTAKE =
  /\b(?:incorrect|wrong|mistake|bug|fail(?:s|ed)?|skip(?:s|ped)?|leak(?:s|ed)?|ignore(?:s|d)?|assum(?:e|es|ing)|depend(?:s|ed|ing)?|accident(?:al|ally)|without|unless|instead of|rather than|not|never|longer than)\b/i;

/** Remove presentation-only Markdown while retaining inline-code identifiers. */
function plain(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A deliberately small imperative heuristic. Existing command verbs stay untouched. A
 * declarative sentence only gets a `Do not` prefix when its wording contains a concrete mistake
 * signal; factual warnings remain declarative rather than having an invented prohibition added.
 */
function imperative(sentence: string): string {
  if (IMPERATIVE.test(sentence)) return sentence;

  const gerund = /^(Treating|Assuming|Depending|Registering)\b/.exec(sentence)?.[1];
  const base: Record<string, string> = {
    Treating: 'treat',
    Assuming: 'assume',
    Depending: 'depend',
    Registering: 'register',
  };
  if (gerund) {
    const tail = sentence.slice(gerund.length);
    const outcome = /\s+(?:makes?|ignores?|causes?|can|will)\b/i.exec(tail);
    if (outcome?.index !== undefined) {
      const action = tail.slice(0, outcome.index);
      const consequence = tail.slice(outcome.index).trimStart();
      return `Do not ${base[gerund]}${action}; doing so ${consequence}`;
    }
    return `Do not ${base[gerund]}${tail}`;
  }
  if (!MISTAKE.test(sentence)) return sentence;

  const first = sentence.charAt(0);
  const lowered = /[A-Z]/.test(first) ? first.toLowerCase() + sentence.slice(1) : sentence;
  return `Do not assume this is safe: ${lowered}`;
}

/**
 * Soft length budget for one rule line. It is a budget, not a cut: a sentence longer than this
 * is still emitted whole, because a 240-character bullet reads fine and a severed one does not.
 */
export const RULE_MAX_LENGTH = 240;

/**
 * One rule is one whole sentence, and `why` is only ever a genuine second sentence.
 *
 * The earlier version truncated at 160 characters and printed the severed tail under `Why:`,
 * which produced a rule that stopped mid-clause — without the qualifier that made it correct —
 * followed by a reason that was not one. Nothing is moved from the rule into the explanation now.
 */
function ruleFromText(value: string, topic: RuleTopic, forceWhole = false): Rule | undefined {
  const body = plain(value);
  if (!body) return undefined;
  const match = forceWhole ? undefined : SENTENCE.exec(body);
  const first = match?.[1] ?? body;
  const rest = match?.[2] ?? '';
  return { text: forceWhole ? first : imperative(first), why: rest, topic };
}

/** Lines outside fenced examples, following the same source-walking model as markdown-twin.ts. */
function proseLines(source: string): string[] {
  const lines: string[] = [];
  let fence: string | undefined;
  for (const line of source.replace(FRONTMATTER, '').split(/\r?\n/)) {
    const marker = FENCE.exec(line)?.[1]?.charAt(0);
    if (marker) {
      if (!fence) fence = marker;
      else if (marker === fence) fence = undefined;
      continue;
    }
    if (!fence) lines.push(line);
  }
  return lines;
}

/**
 * Extract pitfall first sentences. Older topics may also contribute a review checklist from an
 * `## In the AI era` section; that section is optional and is not needed to produce a rules pack.
 */
export function extractRules(mdxSource: string, topic: RuleTopic): Rule[] {
  const lines = proseLines(mdxSource);
  const rules: Rule[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const quoted = /^\s*>\s?(.*)$/.exec(lines[index] ?? '');
    if (
      !quoted ||
      !MARKER.test(quoted[1] ?? '') ||
      quoted[1]?.match(MARKER)?.[1]?.toLowerCase() !== 'pitfall'
    ) {
      continue;
    }

    const body: string[] = [];
    const remainder = (quoted[1] ?? '').replace(MARKER, '').trim();
    if (remainder) body.push(remainder);
    while (index + 1 < lines.length) {
      const next = /^\s*>\s?(.*)$/.exec(lines[index + 1] ?? '');
      if (!next) break;
      index += 1;
      body.push(next[1] ?? '');
    }
    const rule = ruleFromText(body.join(' '), topic);
    if (rule) rules.push(rule);
  }

  let inAiEra = false;
  let inReviewChecklist = false;
  for (const line of lines) {
    const h2 = /^##\s+(.+?)\s*$/.exec(line);
    if (h2) {
      inAiEra = plain(h2[1] ?? '').toLowerCase() === 'in the ai era';
      inReviewChecklist = false;
      continue;
    }
    if (!inAiEra) continue;

    if (/^\*\*Review checklist\*\*\s*$/i.test(line.trim())) {
      inReviewChecklist = true;
      continue;
    }
    if (inReviewChecklist && (/^\*\*[^*]+\*\*\s*$/.test(line.trim()) || /^#{1,6}\s/.test(line))) {
      inReviewChecklist = false;
      continue;
    }
    if (!inReviewChecklist) continue;

    const bullet = /^\s*[-*+]\s+(.+)$/.exec(line)?.[1];
    if (!bullet) continue;
    const rule = ruleFromText(bullet, topic, true);
    if (rule) rules.push(rule);
  }

  return rules;
}

function trackName(track: string): string {
  return (
    getTrack(track)?.name.en ??
    track.replace(/(^|-)([a-z])/g, (_, lead, letter: string) => `${lead ? ' ' : ''}${letter.toUpperCase()}`)
  );
}

const LANGUAGE_GLOBS: Readonly<Record<string, readonly string[]>> = {
  python: ['**/*.py'],
  javascript: ['**/*.js', '**/*.jsx'],
  typescript: ['**/*.ts', '**/*.tsx'],
  go: ['**/*.go'],
  rust: ['**/*.rs'],
  java: ['**/*.java'],
  kotlin: ['**/*.kt', '**/*.kts'],
  cpp: ['**/*.cpp', '**/*.cc', '**/*.cxx', '**/*.h', '**/*.hpp'],
  csharp: ['**/*.cs'],
  swift: ['**/*.swift'],
  php: ['**/*.php'],
};

/** Filename to use when installing one generated pack as a Cursor project rule. */
export function cursorFilename(track: string): string {
  return `codewiki-${track}.mdc`;
}

/** Cursor attachment globs exist only for tracks that represent one programming language. */
export function cursorGlobs(track: string): readonly string[] {
  return getTrack(track)?.kind === 'language' ? (LANGUAGE_GLOBS[track] ?? []) : [];
}

function renderedRules(rules: Rule[]): string {
  return rules
    .map((rule) => {
      const detail = rule.why ? `\n  Why: ${rule.why}` : '';
      return `- ${rule.text}${detail}\n  Source: [${rule.topic.title}](${rule.topic.url})`;
    })
    .join('\n');
}

function renderPack(track: string, rules: Rule[], intro: string): string {
  return `# ${trackName(track)} rules\n\n${intro}\n\n${renderedRules(rules)}\n`;
}

export function renderClaudeMd(track: string, rules: Rule[]): string {
  return renderPack(track, rules, 'Follow these CodeWiki-derived rules when you work in this project.');
}

export function renderAgentsMd(track: string, rules: Rule[]): string {
  return renderPack(track, rules, 'Apply these rules to every relevant file in this project.');
}

/** Cursor uses the same rules under the frontmatter its project-rule format requires. */
export function renderCursorMdc(track: string, rules: Rule[]): string {
  const globs = cursorGlobs(track);
  const intro =
    globs.length > 0
      ? 'Apply these rules when a matching file is in context.'
      : 'This track covers more than one language, so no file globs are inferred. Apply these rules manually when they are relevant.';
  return [
    '---',
    `description: ${JSON.stringify(`CodeWiki ${trackName(track)} pitfalls and review checks`)}`,
    `globs: ${JSON.stringify(globs)}`,
    'alwaysApply: false',
    '---',
    '',
    renderPack(track, rules, intro).trimEnd(),
    '',
  ].join('\n');
}
