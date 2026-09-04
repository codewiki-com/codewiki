/**
 * The gate a polished topic has to pass before it counts as done.
 *
 * `pnpm content:check {track}/{slug}` reads both languages of one topic out of
 * `src/content/topics` and runs the eight checks the content standard asks for, in a
 * fixed order so a failure always carries the same number: frontmatter, Chinese
 * typography, code samples, links, bilingual alignment, article structure, the quiz
 * sidecar and the review status. Everything is reported, not just the first problem, so
 * one run tells an author (or the polish agent) the whole list of what to fix.
 *
 * Checks that cost network time are skippable with `--no-links`; the book-title part of
 * the link check still runs, because it needs no network and catches the "further
 * reading" entries nobody has verified. `--relaxed` lowers the length floor for the short
 * reference samples that predate the 400-line standard.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import type { z } from 'astro/zod';
import { getSection, getTrack } from '@/data/tracks';
import { glossaryProposalSchema } from '@/schemas/glossary';
import { interviewSchema } from '@/schemas/interview';
import { quizSchema } from '@/schemas/quiz';
import { topicSchema } from '@/schemas/topic';
import { alignBlocks, blocks, formatMismatches } from './lib/alignment';
import { checkFences } from './lib/code-check';
import { parseFrontmatter, type ParsedFrontmatter } from './lib/frontmatter';
import { checkLinks, extractLinks, linkIssues } from './lib/links';
import { headings } from './lib/markdown';
import { repoPath, TOPICS_ROOT } from './lib/paths';
import { findZhIssues } from './lib/zh-typography';

/** The two languages of every topic, in report order. */
const LANGS = ['en', 'zh'] as const;

type Lang = (typeof LANGS)[number];

/** Frontmatter fields that are meant to differ between the two languages. */
const TRANSLATED_KEYS = new Set(['title', 'description']);

/** A polished topic is this long; `--relaxed` lowers the floor for the short samples. */
const MIN_LINES = 400;
const RELAXED_MIN_LINES = 100;
const MAX_LINES = 900;

/** A quiz bank worth linking to has at least this many items. */
const MIN_QUIZ_ITEMS = 3;

/** Level-2 headings every polished topic carries, per language. */
const REQUIRED_HEADINGS: Record<Lang, string[]> = {
  en: ['In the AI era', 'Further reading'],
  zh: ['AI 时代', '延伸阅读'],
};

/** Components every polished topic carries, in both languages. */
const REQUIRED_COMPONENTS = ['<TLDR', '<Checkpoint'];

export interface CheckOptions {
  /** Skip the network part of the link check; book titles are still reported. */
  noLinks?: boolean;
  /** Lower the length floor to {@link RELAXED_MIN_LINES}. */
  relaxed?: boolean;
  /** Topics root; defaults to `src/content/topics`. */
  root?: string;
  /** Quiz bank root; defaults to `src/content/quizzes`. */
  quizzesRoot?: string;
  /** Interview bank root; defaults to `src/content/interview`. */
  interviewRoot?: string;
  /** Glossary proposal root; defaults to `content/glossary-proposals`. */
  proposalsRoot?: string;
  /** Link verdict cache; defaults to `reports/link-cache.json`. */
  cachePath?: string;
}

export interface CheckResult {
  ok: boolean;
  /** One line per finding, each prefixed with the number of the check that raised it. */
  failures: string[];
}

/** Both languages of a topic: the raw file and its parsed frontmatter and body. */
type Documents = Record<Lang, ParsedFrontmatter & { text: string; offset: number }>;

/**
 * Run every check on one topic and collect the findings.
 *
 * Throws only when a file cannot be read: a topic with no Chinese counterpart is a
 * mistake in the caller's argument, not a finding about the content.
 */
export async function checkTopic(id: string, options: CheckOptions = {}): Promise<CheckResult> {
  const root = options.root ?? repoPath(TOPICS_ROOT);
  const documents = {} as Documents;
  for (const lang of LANGS) {
    const text = await readFile(path.join(root, `${id}.${lang}.mdx`), 'utf8');
    const parsed = parseFrontmatter(text);
    documents[lang] = { ...parsed, text, offset: bodyOffset(text, parsed.body) };
  }

  const failures: string[] = [];
  const record = (check: number, messages: string[]): void => {
    for (const message of messages) failures.push(`${check}. ${message}`);
  };
  record(1, frontmatterFindings(documents));
  record(2, typographyFindings(documents));
  record(3, await codeFindings(documents));
  record(4, await linkFindings(documents, options));
  record(5, alignmentFindings(documents));
  record(6, structureFindings(documents, options.relaxed === true));
  record(7, await sidecarFindings(id, documents, options));
  record(8, statusFindings(documents));
  return { ok: failures.length === 0, failures };
}

/**
 * Lines the frontmatter occupies, so a position inside the body can be reported against
 * the file the author actually edits.
 */
function bodyOffset(text: string, body: string): number {
  return text.split('\n').length - body.split('\n').length;
}

// ---------------------------------------------------------------------------
// 1. Frontmatter
// ---------------------------------------------------------------------------

/**
 * The frontmatter has to satisfy the content schema, name a track and a section the
 * registry actually declares, and agree between the two languages on everything except
 * the two translated fields. The registry lookup is what catches a section the importer
 * invented: the schema only checks the slug's shape.
 */
function frontmatterFindings(documents: Documents): string[] {
  const out: string[] = [];
  for (const lang of LANGS) {
    const data = documents[lang].data;
    const parsed = topicSchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const where = issue.path.length > 0 ? issue.path.join('.') : '(root)';
        out.push(`${lang} frontmatter: ${where}: ${issue.message}`);
      }
    }
    const track = String(data.track ?? '');
    const section = String(data.section ?? '');
    if (!getTrack(track)) out.push(`${lang} frontmatter: track "${track}" is not in the track registry`);
    else if (!getSection(track, section)) {
      out.push(`${lang} frontmatter: section "${section}" is not registered in track "${track}"`);
    }
  }
  const keys = new Set([...Object.keys(documents.en.data), ...Object.keys(documents.zh.data)]);
  for (const key of [...keys].sort()) {
    if (TRANSLATED_KEYS.has(key)) continue;
    if (stable(documents.en.data[key]) !== stable(documents.zh.data[key])) {
      out.push(`frontmatter field "${key}" differs between en and zh`);
    }
  }
  return out;
}

/** A canonical rendering of a YAML value, with object keys sorted, for comparison. */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value instanceof Date) return value.toISOString();
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

// ---------------------------------------------------------------------------
// 2. Chinese typography
// ---------------------------------------------------------------------------

/** The Chinese body carries no half-width punctuation, stray spacing or ASCII quotes. */
function typographyFindings(documents: Documents): string[] {
  const { body, offset } = documents.zh;
  return findZhIssues(body).map(
    (issue) => `zh typography at line ${issue.line + offset}:${issue.col}: ${issue.message}`,
  );
}

// ---------------------------------------------------------------------------
// 3. Code samples
// ---------------------------------------------------------------------------

/** Every fenced sample parses. Fences no checker understands are skipped, not failed. */
async function codeFindings(documents: Documents): Promise<string[]> {
  const out: string[] = [];
  for (const lang of LANGS) {
    const { body, offset } = documents[lang];
    for (const fence of await checkFences(body)) {
      if (fence.ok) continue;
      out.push(
        `${lang} code fence at line ${fence.line + offset} (${fence.lang || 'no language'}): ${fence.error}`,
      );
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 4. Links and cited books
// ---------------------------------------------------------------------------

/**
 * Every outbound URL resolves and every "further reading" entry is either a link or a
 * title somebody has verified. With `--no-links` the network half is skipped and the
 * book titles are still reported, because those cost nothing and are the part a human
 * has to act on anyway.
 */
async function linkFindings(documents: Documents, options: CheckOptions): Promise<string[]> {
  const urls = LANGS.flatMap((lang) => extractLinks(documents[lang].body).map((link) => link.url));
  const statuses = options.noLinks
    ? new Map()
    : await checkLinks(urls, { cachePath: options.cachePath ?? repoPath('reports/link-cache.json') });
  const out: string[] = [];
  for (const lang of LANGS) {
    const { body, offset } = documents[lang];
    for (const issue of linkIssues(body, statuses)) {
      out.push(`${lang} ${issue.rule} at line ${issue.line + offset}: ${issue.message}`);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 5. Bilingual alignment
// ---------------------------------------------------------------------------

/** The two languages share one block sequence, which is what bilingual mode reads. */
function alignmentFindings(documents: Documents): string[] {
  const result = alignBlocks(blocks(documents.en.text), blocks(documents.zh.text));
  if (result.aligned) return [];
  return [
    `not aligned (${result.mismatches.length} mismatches, similarity ${result.similarity.toFixed(2)})`,
    ...formatMismatches(result.mismatches).map((line) => line.trim()),
  ];
}

// ---------------------------------------------------------------------------
// 6. Article structure
// ---------------------------------------------------------------------------

/** The house shape: a TL;DR, a checkpoint, the two fixed sections, and a sane length. */
function structureFindings(documents: Documents, relaxed: boolean): string[] {
  const minimum = relaxed ? RELAXED_MIN_LINES : MIN_LINES;
  const out: string[] = [];
  for (const lang of LANGS) {
    const { body, text } = documents[lang];
    for (const component of REQUIRED_COMPONENTS) {
      if (!body.includes(component)) out.push(`${lang}: no ${component}> block`);
    }
    const titles = headings(body)
      .filter((heading) => heading.depth === 2)
      .map((heading) => heading.text);
    for (const required of REQUIRED_HEADINGS[lang]) {
      if (!titles.includes(required)) out.push(`${lang}: no "## ${required}" section`);
    }
    const lines = lineCount(text);
    if (lines < minimum) out.push(`${lang}: ${lines} lines, below the ${minimum}-line minimum`);
    if (lines > MAX_LINES) out.push(`${lang}: ${lines} lines, above the ${MAX_LINES}-line maximum`);
  }
  return out;
}

/** Lines in a file, trailing blank lines ignored, matching what `wc -l` reports. */
function lineCount(text: string): number {
  const trimmed = text.replace(/\n+$/, '');
  return trimmed === '' ? 0 : trimmed.split('\n').length;
}

// ---------------------------------------------------------------------------
// 7. Sidecars
// ---------------------------------------------------------------------------

/** Validate every quiz, interview and glossary-proposal sidecar written by the polish pass. */
async function sidecarFindings(id: string, documents: Documents, options: CheckOptions): Promise<string[]> {
  const [track, slug] = id.split('/');
  const out = await quizFindings(documents, options.quizzesRoot ?? repoPath('src/content/quizzes'));
  out.push(
    ...(await optionalYamlSchemaFindings(
      path.join(options.interviewRoot ?? repoPath('src/content/interview'), `${track}.yaml`),
      `interview "${track}"`,
      interviewSchema,
    )),
    ...(await optionalYamlSchemaFindings(
      path.join(options.proposalsRoot ?? repoPath('content/glossary-proposals'), `${track}-${slug}.yaml`),
      `glossary proposal "${track}-${slug}"`,
      glossaryProposalSchema,
    )),
  );
  return out;
}

interface SchemaLike {
  safeParse(value: unknown): { success: true } | { success: false; error: z.ZodError };
}

/** Validate an optional YAML sidecar, preserving Zod's full field path in every finding. */
async function optionalYamlSchemaFindings(
  file: string,
  label: string,
  schema: SchemaLike,
): Promise<string[]> {
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  let data: unknown;
  try {
    data = YAML.parse(text);
  } catch (error) {
    return [`${label}: ${(error as Error).message}`];
  }
  const parsed = schema.safeParse(data);
  if (parsed.success) return [];
  return parsed.error.issues.map(
    (issue) => `${label}: ${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
}

/** A topic that names a quiz has one, and it holds enough items to be worth showing. */
async function quizFindings(documents: Documents, quizzesRoot: string): Promise<string[]> {
  const quiz = documents.en.data.quiz;
  if (typeof quiz !== 'string' || quiz === '') return [];
  const file = path.join(quizzesRoot, `${quiz}.yaml`);
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    return [`quiz "${quiz}" is declared but ${path.relative(repoPath('.'), file)} does not exist`];
  }
  let data: unknown;
  try {
    data = YAML.parse(text);
  } catch (error) {
    return [`quiz "${quiz}": ${(error as Error).message}`];
  }
  const parsed = quizSchema.safeParse(data);
  if (!parsed.success) {
    return parsed.error.issues.map(
      (issue) => `quiz "${quiz}": ${issue.path.join('.') || '(root)'}: ${issue.message}`,
    );
  }
  if (parsed.data.items.length < MIN_QUIZ_ITEMS) {
    return [`quiz "${quiz}" has ${parsed.data.items.length} items, fewer than ${MIN_QUIZ_ITEMS}`];
  }
  return [];
}

// ---------------------------------------------------------------------------
// 8. Review status
// ---------------------------------------------------------------------------

/** `status: reviewed` is a claim about a human pass and about bilingual alignment. */
function statusFindings(documents: Documents): string[] {
  const out: string[] = [];
  for (const lang of LANGS) {
    const data = documents[lang].data;
    if (data.status !== 'reviewed') continue;
    if (!data.reviewed) out.push(`${lang}: status is reviewed but there is no reviewed date`);
    if (data.aligned !== true) out.push(`${lang}: status is reviewed but aligned is not true`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Args {
  ids: string[];
  noLinks: boolean;
  relaxed: boolean;
}

/** Parse `{track}/{slug} …`, `--no-links` and `--relaxed`. */
export function parseArgs(argv: string[]): Args {
  const args: Args = { ids: [], noLinks: false, relaxed: false };
  for (const arg of argv) {
    if (arg === '--no-links') args.noLinks = true;
    else if (arg === '--relaxed') args.relaxed = true;
    else if (arg.startsWith('-')) throw new Error(`unknown flag: ${arg}`);
    else args.ids.push(arg);
  }
  if (args.ids.length === 0)
    throw new Error('usage: content:check {track}/{slug} [...] [--no-links] [--relaxed]');
  return args;
}

/** CLI: check every named topic, printing `OK {id}` or the numbered findings. */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  let failed = 0;
  for (const id of args.ids) {
    let result: CheckResult;
    try {
      result = await checkTopic(id, { noLinks: args.noLinks, relaxed: args.relaxed });
    } catch (error) {
      result = { ok: false, failures: [`0. ${(error as Error).message}`] };
    }
    if (result.ok) {
      console.log(`OK ${id}`);
      continue;
    }
    failed += 1;
    console.log(`FAIL ${id}`);
    for (const failure of result.failures) console.log(`  ${failure}`);
  }
  if (failed > 0) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
