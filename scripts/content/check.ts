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
import { cheatsheetSchema } from '@/schemas/cheatsheet';
import { glossaryProposalSchema } from '@/schemas/glossary';
import { interviewSchema } from '@/schemas/interview';
import { pathSchema } from '@/schemas/path';
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

/** Content sidecars the write runner can produce. */
export const CONTENT_KINDS = ['quiz', 'kata', 'interview', 'path', 'cheatsheet'] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export interface KindCheckOptions {
  quizzesRoot?: string;
  interviewRoot?: string;
  pathsRoot?: string;
  cheatsheetsRoot?: string;
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
    ...(await interviewSidecarFindings(
      path.join(options.interviewRoot ?? repoPath('src/content/interview'), `${track}.yaml`),
      track,
      id,
      documents.en.data.status === 'reviewed',
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
  const items = parsed.data.items as Array<Record<string, unknown>>;
  const out = reviewLineFindings(items, `quiz "${quiz}"`);
  if (documents.en.data.status === 'reviewed') out.push(...calibrationFindings(items, `quiz "${quiz}"`));
  return out;
}

async function interviewSidecarFindings(
  file: string,
  track: string,
  topicId: string,
  reviewed: boolean,
): Promise<string[]> {
  const loaded = await requiredYaml(file, `interview "${track}"`);
  if (loaded.failures.some((failure) => failure.endsWith('file does not exist'))) return [];
  if (loaded.failures.length > 0) return loaded.failures;
  const parsed = interviewSchema.safeParse(loaded.data);
  const out = schemaFailures(`interview "${track}"`, parsed);
  if (!parsed.success || !reviewed) return out;
  const related = (parsed.data.items as Array<Record<string, unknown>>).filter(
    (item) => Array.isArray(item.topics) && item.topics.includes(topicId),
  );
  out.push(...calibrationFindings(related, `interview "${track}"`));
  return out;
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
// Write-runner sidecars
// ---------------------------------------------------------------------------

const SLUG = /^[a-z0-9-]+$/;
const TOPIC_ID = /^[a-z0-9-]+\/[a-z0-9-]+$/;

/** Validate one file produced by `content:write`, including constraints Zod cannot express. */
export async function checkContent(
  kind: ContentKind,
  id: string,
  options: KindCheckOptions = {},
): Promise<CheckResult> {
  if (kind === 'quiz' || kind === 'kata') return checkWrittenQuiz(kind, id, options);
  if (kind === 'interview') return checkWrittenInterview(id, options);
  if (kind === 'path') return checkWrittenPath(id, options);
  return checkWrittenCheatsheet(id, options);
}

function schemaFailures(label: string, parsed: ReturnType<SchemaLike['safeParse']>): string[] {
  if (parsed.success) return [];
  return parsed.error.issues.map(
    (issue) => `${label}: ${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
}

async function requiredYaml(file: string, label: string): Promise<{ data?: unknown; failures: string[] }> {
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    const detail = (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'file does not exist' : String(error);
    return { failures: [`${label}: ${detail}`] };
  }
  try {
    return { data: YAML.parse(text), failures: [] };
  } catch (error) {
    return { failures: [`${label}: ${(error as Error).message}`] };
  }
}

function withoutTrailingBlankLines(code: string): string[] {
  const trimmed = code.replace(/\n+$/, '');
  return trimmed === '' ? [] : trimmed.split('\n');
}

function reviewLineFindings(items: Array<Record<string, unknown>>, label: string): string[] {
  const out: string[] = [];
  for (const [itemIndex, item] of items.entries()) {
    if (item.type !== 'review') continue;
    const lines = withoutTrailingBlankLines(String(item.code ?? '')).length;
    const issues = Array.isArray(item.issues) ? (item.issues as Array<Record<string, unknown>>) : [];
    for (const [issueIndex, issue] of issues.entries()) {
      const first = Number(issue.line);
      const span = Number(issue.lines ?? 1);
      const last = first + span - 1;
      if (first > lines || last > lines) {
        out.push(
          `${label}: items.${itemIndex}.issues.${issueIndex} names line ${last}, but the code has ${lines} lines`,
        );
      }
    }
  }
  return out;
}

function calibrationFindings(items: Array<Record<string, unknown>>, label: string): string[] {
  return items.flatMap((item, index) =>
    Array.isArray(item.tags) && item.tags.includes('calibration')
      ? [`${label}: items.${index}.tags still contains the calibration placeholder`]
      : [],
  );
}

async function checkWrittenQuiz(
  kind: 'quiz' | 'kata',
  id: string,
  options: KindCheckOptions,
): Promise<CheckResult> {
  if (!TOPIC_ID.test(id)) return { ok: false, failures: [`not a {track}/{slug} id: ${id}`] };
  const file = path.join(options.quizzesRoot ?? repoPath('src/content/quizzes'), `${id}.yaml`);
  const label = `${kind} "${id}"`;
  const loaded = await requiredYaml(file, label);
  if (loaded.failures.length > 0) return { ok: false, failures: loaded.failures };
  const parsed = quizSchema.safeParse(loaded.data);
  const failures = schemaFailures(label, parsed);
  if (!parsed.success) return { ok: false, failures };
  const items = parsed.data.items as Array<Record<string, unknown>>;
  failures.push(...calibrationFindings(items, label), ...reviewLineFindings(items, label));
  if (parsed.data.topic !== id) failures.push(`${label}: topic is "${parsed.data.topic}", expected "${id}"`);
  if (kind === 'quiz' && (items.length < 4 || items.length > 8)) {
    failures.push(`${label}: expected 4–8 items, got ${items.length}`);
  }
  if (kind === 'kata' && !items.some(isCompleteKata)) {
    failures.push(
      `${label}: no review item has a title, task, right, 15–25 code lines, 3–5 distinct issue kinds, and 3–4 checklist items`,
    );
  }
  return { ok: failures.length === 0, failures };
}

function isLocalized(value: unknown): value is { en: string; zh: string } {
  if (value === null || typeof value !== 'object') return false;
  const localized = value as Record<string, unknown>;
  return typeof localized.en === 'string' && typeof localized.zh === 'string';
}

function isCompleteKata(item: Record<string, unknown>): boolean {
  if (
    item.type !== 'review' ||
    !isLocalized(item.title) ||
    !isLocalized(item.task) ||
    !isLocalized(item.right)
  ) {
    return false;
  }
  if (Array.from(item.title.en).length > 60 || Array.from(item.title.zh).length > 60) return false;
  const codeLines = withoutTrailingBlankLines(String(item.code ?? '')).length;
  const issues = Array.isArray(item.issues) ? (item.issues as Array<Record<string, unknown>>) : [];
  const checklist = Array.isArray(item.checklist) ? item.checklist : [];
  const kinds = new Set(issues.map((issue) => issue.kind));
  return (
    codeLines >= 15 &&
    codeLines <= 25 &&
    issues.length >= 3 &&
    issues.length <= 5 &&
    kinds.size === issues.length &&
    checklist.length >= 3 &&
    checklist.length <= 4
  );
}

async function checkWrittenInterview(id: string, options: KindCheckOptions): Promise<CheckResult> {
  if (!SLUG.test(id)) return { ok: false, failures: [`not a track slug: ${id}`] };
  const file = path.join(options.interviewRoot ?? repoPath('src/content/interview'), `${id}.yaml`);
  const label = `interview "${id}"`;
  const loaded = await requiredYaml(file, label);
  if (loaded.failures.length > 0) return { ok: false, failures: loaded.failures };
  const parsed = interviewSchema.safeParse(loaded.data);
  const failures = schemaFailures(label, parsed);
  if (!parsed.success) return { ok: false, failures };
  const items = parsed.data.items as Array<Record<string, unknown>>;
  failures.push(...calibrationFindings(items, label));
  if (parsed.data.track !== id) failures.push(`${label}: track is "${parsed.data.track}", expected "${id}"`);
  if (items.length < 30 || items.length > 45)
    failures.push(`${label}: expected 30–45 items, got ${items.length}`);
  return { ok: failures.length === 0, failures };
}

function scopedSlug(id: string): string | null {
  const parts = id.split('/');
  if (parts.length > 2 || parts.some((part) => !SLUG.test(part))) return null;
  return parts.at(-1) ?? null;
}

async function checkWrittenPath(id: string, options: KindCheckOptions): Promise<CheckResult> {
  const slug = scopedSlug(id);
  if (!slug) return { ok: false, failures: [`not a path id or {track}/{path-id}: ${id}`] };
  const pathsRoot = options.pathsRoot ?? repoPath('src/content/paths');
  const quizzesRoot = options.quizzesRoot ?? repoPath('src/content/quizzes');
  const label = `path "${slug}"`;
  const loaded = await requiredYaml(path.join(pathsRoot, `${slug}.yaml`), label);
  if (loaded.failures.length > 0) return { ok: false, failures: loaded.failures };
  const parsed = pathSchema.safeParse(loaded.data);
  const failures = schemaFailures(label, parsed);
  if (!parsed.success) return { ok: false, failures };
  const topics = parsed.data.milestones.flatMap((milestone) => milestone.topics);
  if (topics.length < 18 || topics.length > 30)
    failures.push(`${label}: expected 18–30 topics, got ${topics.length}`);
  if (parsed.data.milestones.length < 4 || parsed.data.milestones.length > 6) {
    failures.push(`${label}: expected 4–6 milestones, got ${parsed.data.milestones.length}`);
  }
  if (parsed.data.edges.length < 4)
    failures.push(`${label}: expected at least 4 edges, got ${parsed.data.edges.length}`);
  if (parsed.data.outcomes.length !== 3)
    failures.push(`${label}: expected exactly 3 outcomes, got ${parsed.data.outcomes.length}`);
  if (new Set(topics).size !== topics.length) failures.push(`${label}: a topic appears more than once`);
  if (parsed.data.id && parsed.data.id !== slug)
    failures.push(`${label}: id is "${parsed.data.id}", expected "${slug}"`);
  const topicSet = new Set(topics);
  parsed.data.edges.forEach((edge, index) => {
    if (!topicSet.has(edge.from) || !topicSet.has(edge.to)) {
      failures.push(`${label}: edges.${index} must connect topics selected by this path`);
    }
  });
  for (const checkpoint of parsed.data.milestones.map((milestone) => milestone.checkpoint)) {
    const bank = await requiredYaml(
      path.join(quizzesRoot, `${checkpoint}.yaml`),
      `checkpoint "${checkpoint}"`,
    );
    if (bank.failures.length > 0) {
      failures.push(...bank.failures);
      continue;
    }
    const checked = quizSchema.safeParse(bank.data);
    failures.push(...schemaFailures(`checkpoint "${checkpoint}"`, checked));
    if (checked.success) {
      const items = checked.data.items as Array<Record<string, unknown>>;
      if (checked.data.topic !== checkpoint) {
        failures.push(
          `checkpoint "${checkpoint}": topic is "${checked.data.topic}", expected "${checkpoint}"`,
        );
      }
      if (items.length !== 8)
        failures.push(`checkpoint "${checkpoint}": expected 8 items, got ${items.length}`);
      failures.push(
        ...calibrationFindings(items, `checkpoint "${checkpoint}"`),
        ...reviewLineFindings(items, `checkpoint "${checkpoint}"`),
      );
    }
  }
  return { ok: failures.length === 0, failures };
}

interface SheetShape {
  title: string;
  rows: string[];
}

function sheetShapes(body: string): SheetShape[] {
  const out: SheetShape[] = [];
  const sheetPattern = /<Sheet\s+title=(['"])(.*?)\1\s*>([\s\S]*?)<\/Sheet>/g;
  for (const match of body.matchAll(sheetPattern)) {
    const rows = [...match[3].matchAll(/<Row\s+code=(['"])(.*?)\1\s*>[\s\S]*?<\/Row>/g)].map((row) => row[2]);
    out.push({ title: match[2], rows });
  }
  return out;
}

async function checkWrittenCheatsheet(id: string, options: KindCheckOptions): Promise<CheckResult> {
  const slug = scopedSlug(id);
  if (!slug) return { ok: false, failures: [`not a cheatsheet id or {track}/{sheet-id}: ${id}`] };
  const root = options.cheatsheetsRoot ?? repoPath('src/content/cheatsheets');
  const documents = {} as Record<Lang, ParsedFrontmatter & { sheets: SheetShape[] }>;
  const failures: string[] = [];
  for (const lang of LANGS) {
    let text: string;
    try {
      text = await readFile(path.join(root, `${slug}.${lang}.mdx`), 'utf8');
    } catch (error) {
      failures.push(
        `cheatsheet "${slug}" (${lang}): ${(error as NodeJS.ErrnoException).code === 'ENOENT' ? 'file does not exist' : String(error)}`,
      );
      continue;
    }
    const parsed = parseFrontmatter(text);
    documents[lang] = { ...parsed, sheets: sheetShapes(parsed.body) };
    const schema = cheatsheetSchema.safeParse(parsed.data);
    failures.push(...schemaFailures(`cheatsheet "${slug}" (${lang})`, schema));
    if (schema.success) {
      if (schema.data.terms.length < 6)
        failures.push(
          `cheatsheet "${slug}" (${lang}): expected at least 6 terms, got ${schema.data.terms.length}`,
        );
      if (schema.data.status === 'reviewed' && schema.data.tags.includes('calibration')) {
        failures.push(
          `cheatsheet "${slug}" (${lang}): reviewed file still contains the calibration placeholder`,
        );
      }
    }
    if (documents[lang].sheets.length < 9 || documents[lang].sheets.length > 12) {
      failures.push(
        `cheatsheet "${slug}" (${lang}): expected 9–12 Sheet blocks, got ${documents[lang].sheets.length}`,
      );
    }
    documents[lang].sheets.forEach((sheet, index) => {
      if (sheet.rows.length < 5 || sheet.rows.length > 7) {
        failures.push(
          `cheatsheet "${slug}" (${lang}): Sheet ${index + 1} has ${sheet.rows.length} rows, expected 5–7`,
        );
      }
    });
  }
  if (documents.en && documents.zh) {
    const enShape = documents.en.sheets.map((sheet) => sheet.rows);
    const zhShape = documents.zh.sheets.map((sheet) => sheet.rows);
    if (stable(enShape) !== stable(zhShape))
      failures.push(`cheatsheet "${slug}": en and zh rows are not aligned by code`);
    const sharedKeys = new Set([...Object.keys(documents.en.data), ...Object.keys(documents.zh.data)]);
    for (const key of sharedKeys) {
      if (TRANSLATED_KEYS.has(key)) continue;
      if (stable(documents.en.data[key]) !== stable(documents.zh.data[key])) {
        failures.push(`cheatsheet "${slug}": frontmatter field "${key}" differs between en and zh`);
      }
    }
  }
  return { ok: failures.length === 0, failures };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Args {
  ids: string[];
  noLinks: boolean;
  relaxed: boolean;
  kind?: ContentKind;
}

/** Parse topic checks or `--kind quiz|kata|interview|path|cheatsheet <id>`. */
export function parseArgs(argv: string[]): Args {
  const args: Args = { ids: [], noLinks: false, relaxed: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--no-links') args.noLinks = true;
    else if (arg === '--relaxed') args.relaxed = true;
    else if (arg === '--kind') {
      const kind = argv[index + 1];
      if (!CONTENT_KINDS.includes(kind as ContentKind))
        throw new Error(`unknown content kind: ${kind ?? ''}`);
      args.kind = kind as ContentKind;
      index += 1;
    } else if (arg.startsWith('-')) throw new Error(`unknown flag: ${arg}`);
    else args.ids.push(arg);
  }
  if (args.ids.length === 0)
    throw new Error('usage: content:check [--kind quiz|kata|interview|path|cheatsheet] <id> [...]');
  return args;
}

/** CLI: check every named topic, printing `OK {id}` or the numbered findings. */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  let failed = 0;
  for (const id of args.ids) {
    let result: CheckResult;
    try {
      result = args.kind
        ? await checkContent(args.kind, id)
        : await checkTopic(id, { noLinks: args.noLinks, relaxed: args.relaxed });
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
