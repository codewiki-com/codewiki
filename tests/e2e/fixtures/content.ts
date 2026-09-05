/**
 * Facts read out of `src/content` at test time.
 *
 * The suite went dark once because it asserted literals — question counts, cheatsheet titles,
 * review dates, kata ids — that the content wave then moved. Forty tests failed and none of them
 * pointed at a defect. Anything the content owns is derived here instead, so a spec fails only
 * when behaviour changes.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';

const ROOT = new URL('../../../', import.meta.url).pathname;
const CONTENT = path.join(ROOT, 'src', 'content');

const read = (...parts: string[]) => readFileSync(path.join(CONTENT, ...parts), 'utf8');

/* ------------------------------------------------------------------ topics */

export interface TopicFacts {
  title: string;
  description: string;
  /** `reviewed`, else the verification date — the same fallback `Topic.astro` uses. */
  modified: string;
  terms: string[];
  related: string[];
}

const iso = (value: unknown): string =>
  value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);

export function topicFacts(track: string, slug: string, lang: 'en' | 'zh' = 'en'): TopicFacts {
  const { data } = matter(read('topics', track, `${slug}.${lang}.mdx`));
  return {
    title: String(data.title),
    description: String(data.description),
    modified: iso(data.reviewed ?? data.verified?.date),
    terms: (data.terms ?? []) as string[],
    related: (data.related ?? []) as string[],
  };
}

/** The first ` ```lang run ` fence of a topic and the ` ```text ` block published beneath it. */
export function firstRunnable(
  track: string,
  slug: string,
  lang: 'en' | 'zh' = 'en',
): { title: string; code: string; output: string[] } {
  const body = matter(read('topics', track, `${slug}.${lang}.mdx`)).content;
  const fence =
    /^```[a-z+#]+ run(?:[^\n]*\btitle="([^"]+)")?[^\n]*\n([\s\S]*?)\n```\s*\n+```text\n([\s\S]*?)\n```/m;
  const match = fence.exec(body);
  if (!match) throw new Error(`${track}/${slug} has no runnable fence with a published output`);
  return {
    title: match[1] ?? '',
    code: match[2] ?? '',
    output: (match[3] ?? '').split('\n').map((line) => line.trim()),
  };
}

/** The items of the first `<TryToBreak>` a topic authors — the "nudge" rendered in the article. */
export function firstNudgeItems(track: string, slug: string, lang: 'en' | 'zh' = 'en'): string[] {
  const body = matter(read('topics', track, `${slug}.${lang}.mdx`)).content;
  const list = /<TryToBreak\s+items=\{\[([\s\S]*?)\]\}/.exec(body)?.[1] ?? '';
  return [...list.matchAll(/'([^']*)'|"([^"]*)"/g)].map((match) => match[1] ?? match[2] ?? '');
}

/* ------------------------------------------------------------- cheatsheets */

export interface CheatsheetFacts {
  slug: string;
  title: string;
  sheets: number;
  /** Every authored `<Row>`, which is what the page renders. */
  rows: number;
  /**
   * The rows `extractCheatsheetRows` finds. Its pattern requires a double-quoted `code`, so a
   * row written with single quotes renders on the page but is absent from the Markdown twin and
   * `/api/cheatsheets.json`. Mirroring the extractor keeps this test measuring one thing.
   */
  twinRows: number;
  /** The first authored row, as the Markdown twin renders it. */
  firstRowBullet: string;
}

export function cheatsheetSlugs(): string[] {
  return readdirSync(path.join(CONTENT, 'cheatsheets'))
    .filter((file) => file.endsWith('.en.mdx'))
    .map((file) => file.replace(/\.en\.mdx$/, ''))
    .sort();
}

export function cheatsheetFacts(slug: string, lang: 'en' | 'zh' = 'en'): CheatsheetFacts {
  const source = read('cheatsheets', `${slug}.${lang}.mdx`);
  const { data, content } = matter(source);
  const row = /<Row code="([^"]+)">([\s\S]*?)<\/Row>/.exec(content);
  return {
    slug,
    title: String(data.title),
    sheets: (content.match(/<Sheet\b/g) ?? []).length,
    rows: (content.match(/<Row\b/g) ?? []).length,
    twinRows: (content.match(/<Row\s+code="/g) ?? []).length,
    firstRowBullet: `- \`${row?.[1] ?? ''}\` — ${(row?.[2] ?? '').replace(/\s+/g, ' ').trim()}`,
  };
}

/* --------------------------------------------------------------- interview */

export interface InterviewItemFacts {
  id: string;
  question: string;
  questionZh: string;
  level: string;
}

export function interviewFacts(track: string): {
  items: InterviewItemFacts[];
  byLevel: (level: string) => InterviewItemFacts[];
} {
  const bank = parseYaml(read('interview', `${track}.yaml`)) as {
    items: { id: string; question: { en: string; zh: string }; level: string }[];
  };
  const items = bank.items.map((item) => ({
    id: item.id,
    question: item.question.en,
    questionZh: item.question.zh,
    level: item.level,
  }));
  return { items, byLevel: (level) => items.filter((item) => item.level === level) };
}

/* ------------------------------------------------------------------ quizzes */

/** Item ids of one bank, in the order the bank declares them. */
export function quizItemIds(track: string, slug: string, type?: string): string[] {
  const bank = parseYaml(read('quizzes', track, `${slug}.yaml`)) as {
    items: { id: string; type: string }[];
  };
  return bank.items.filter((item) => !type || item.type === type).map((item) => item.id);
}

/** Title and issue count of one review kata, as `Kata.astro` titles its page. */
export function reviewKataFacts(track: string, slug: string, id: string): { title: string; issues: number } {
  const bank = parseYaml(read('quizzes', track, `${slug}.yaml`)) as {
    items: { id: string; title?: { en: string }; prompt: { en: string }; issues?: unknown[] }[];
  };
  const item = bank.items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`${track}/${slug} has no item ${id}`);
  return {
    title: item.title?.en ?? item.prompt.en.replace(/[.。]\s*$/u, ''),
    issues: item.issues?.length ?? 0,
  };
}

/* -------------------------------------------------------------------- paths */

/** Path ids in collection order, which is how `/api/paths.json` lists them. */
export function pathIds(): string[] {
  return readdirSync(path.join(CONTENT, 'paths'))
    .filter((file) => file.endsWith('.yaml'))
    .map((file) => file.replace(/\.yaml$/, ''))
    .sort();
}

/* ----------------------------------------------------------------- glossary */

/** Glossary ids in collection order — the order the term pager walks. */
export function glossaryIds(): string[] {
  return readdirSync(path.join(CONTENT, 'glossary'))
    .filter((file) => file.endsWith('.yaml'))
    .map((file) => file.replace(/\.yaml$/, ''))
    .sort();
}
