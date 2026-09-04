/**
 * Sidecar extraction: what the polish pass produces beside a topic becomes site content.
 *
 * Codex writes three things per topic: a quiz bank (`src/content/quizzes/{track}/{slug}.yaml`),
 * interview items appended to its track's bank (`src/content/interview/{track}.yaml`), and a
 * set of glossary *proposals* (`content/glossary-proposals/{track}-{slug}.yaml`). Quizzes and
 * interview items land in place and only need validating; glossary terms are shared across the
 * whole site, so a proposal is never written straight into `src/content/glossary` — this script
 * merges it, and refuses to guess whenever the proposal disagrees with a term that already
 * exists. An existing term is authoritative: the merge may add topics to it and nothing else.
 *
 * `pnpm content:extract [id|all] [--dry-run]` runs the merge over every proposal and validates
 * the sidecars of the named topics (or of every reviewed topic), writes `reports/extract.json`,
 * and exits 1 on any conflict or validation error. It deliberately does not touch the pipeline
 * state file: it prints the ids it would mark `extracted` and leaves the writing to the runner.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import type { z } from 'astro/zod';
import { termSchema, type Term } from '../../src/schemas/glossary';
import { interviewSchema } from '../../src/schemas/interview';
import { quizSchema } from '../../src/schemas/quiz';
import { parseFrontmatter } from './lib/frontmatter';
import { repoPath, TOPICS_ROOT } from './lib/paths';

/** Repository-relative directory Codex writes glossary proposals to. */
export const PROPOSALS_ROOT = 'content/glossary-proposals';

/** Repository-relative directory holding the merged glossary, one YAML file per term. */
export const GLOSSARY_ROOT = 'src/content/glossary';

/** Repository-relative directory holding quiz banks, one YAML file per topic. */
export const QUIZZES_ROOT = 'src/content/quizzes';

/** Repository-relative directory holding interview banks, one YAML file per track. */
export const INTERVIEW_ROOT = 'src/content/interview';

/** Repository-relative location of the run report. */
export const REPORT_PATH = 'reports/extract.json';

/** Spec §4 caps a glossary card's definition; repeated here to name the limit in the reason. */
const SHORT_LIMIT = 140;

/** A plain scalar starts with a letter and stays clear of every flow indicator. */
const PLAIN = /^[A-Za-z\u00C0-\uFFFF][^,[\]{}:#'"\\]*$/;

/** Words YAML reads as a boolean or a null rather than as the string they spell. */
const RESERVED = /^(?:true|false|null|yes|no|on|off|y|n)$/i;

export interface MergeConflict {
  /** The proposed term's id. */
  id: string;
  reason: string;
}

/** Why a term counted as skipped: an alias hit, or topics folded into an existing term. */
export interface MergeNote {
  id: string;
  note: string;
}

export interface MergeResult {
  /** Ids written as new `{glossaryDir}/{id}.yaml` files. */
  added: string[];
  /** Ids an existing term already covers; see {@link MergeResult.notes} for which and why. */
  skipped: string[];
  conflicts: MergeConflict[];
  notes: MergeNote[];
}

export interface MergeOptions {
  /** Report what would change without touching a file. */
  dryRun?: boolean;
}

interface ExistingTerm {
  id: string;
  file: string;
  /** The file exactly as it stands on disk; a merge patches one line of it and nothing else. */
  text: string;
  en: string;
  zh: string;
  topics: string[];
  /** Lowercased id, `en` and aliases: everything by which this term claims a proposal. */
  keys: Set<string>;
}

/** Trimmed and lowercased; the merge compares names case-insensitively throughout. */
function key(value: string): string {
  return value.trim().toLowerCase();
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

/** `path: message` for every issue, so a conflict reason names the offending field. */
function issueLines(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ');
}

/** Every `*.yaml` in `dir`, sorted; a missing directory yields nothing. */
async function listYaml(dir: string): Promise<string[]> {
  try {
    return (await readdir(dir)).filter((name) => name.endsWith('.yaml')).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

/** Read the existing glossary. The id comes from the filename, as the collection loader does. */
async function readGlossary(dir: string): Promise<ExistingTerm[]> {
  const terms: ExistingTerm[] = [];
  for (const name of await listYaml(dir)) {
    const file = path.join(dir, name);
    const text = await readFile(file, 'utf8');
    const parsed: unknown = YAML.parse(text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error(`${file}: expected a mapping`);
    }
    const record = parsed as Record<string, unknown>;
    const id = name.slice(0, -'.yaml'.length);
    const en = str(record.en);
    const aliases = strings(record.aliases);
    terms.push({
      id,
      file,
      text,
      en,
      zh: str(record.zh),
      topics: strings(record.topics),
      keys: new Set([id, en, ...aliases].filter(Boolean).map(key)),
    });
  }
  return terms;
}

/** The terms of one proposal file, in file order. */
function readProposal(file: string, text: string): Record<string, unknown>[] {
  const parsed: unknown = YAML.parse(text);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${file}: expected a mapping with a \`terms\` list`);
  }
  const terms = (parsed as { terms?: unknown }).terms;
  if (!Array.isArray(terms)) throw new Error(`${file}: \`terms\` must be a list`);
  return terms.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      throw new Error(`${file}: terms.${index} is not a mapping`);
    }
    return entry as Record<string, unknown>;
  });
}

/** True when `value` can be written without quotes, in a flow collection or out of one. */
function isPlain(value: string): boolean {
  return PLAIN.test(value) && !/\s$/.test(value) && !RESERVED.test(value);
}

/** A single-quoted YAML scalar; doubling the quote is the only escape such a scalar has. */
function quoted(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** A scalar as the glossary files write one: plain where that is unambiguous, quoted otherwise. */
function scalar(value: string): string {
  return isPlain(value) ? value : quoted(value);
}

/** A flow sequence, `[a, b]`, the way every hand-written term writes `aliases` and `topics`. */
function flowList(values: string[]): string {
  return `[${values.map(scalar).join(', ')}]`;
}

/**
 * Render a term in the house style of `src/content/glossary/*.yaml`: five lines, flow
 * collections, and a definition that is always quoted because it is prose, and prose has
 * commas in it. The id is not written — the collection loader takes it from the filename.
 */
export function serializeTerm(term: Pick<Term, 'en' | 'zh' | 'aliases' | 'short' | 'topics'>): string {
  return [
    `en: ${scalar(term.en)}`,
    `zh: ${scalar(term.zh)}`,
    `aliases: ${flowList(term.aliases)}`,
    `short: { en: ${quoted(term.short.en)}, zh: ${quoted(term.short.zh)} }`,
    `topics: ${flowList(term.topics)}`,
    '',
  ].join('\n');
}

/** The top-level `topics:` entry; `^` under `m` pins it to column 0, so nested keys are safe. */
const TOPICS_LINE = /^topics:[ \t]*(.*)$/m;

/**
 * Replace the `topics` value of a glossary file and change nothing else — not the key order,
 * not the quoting, not a comment. The file's own style wins: a flow list stays a flow list and
 * a block list stays a block list, so folding one topic into a hand-written term is a one-line
 * diff rather than a re-serialization of the whole file.
 */
export function patchTopics(text: string, topics: string[]): string {
  const match = TOPICS_LINE.exec(text);
  if (!match) {
    // No `topics` key at all: append one in the house style.
    const body = text === '' || text.endsWith('\n') ? text : `${text}\n`;
    return `${body}topics: ${flowList(topics)}\n`;
  }
  const start = match.index;
  const after = text.slice(start + match[0].length);
  const value = match[1].trim();

  if (value.startsWith('[')) {
    // A flow list, possibly wrapped over several lines: replace up to its closing bracket.
    const end = text.indexOf(']', start);
    const stop = end < 0 ? start + match[0].length : end + 1;
    return `${text.slice(0, start)}topics: ${flowList(topics)}${text.slice(stop)}`;
  }
  if (value !== '') {
    // Something unexpected on the line itself: replace the line and leave the rest alone.
    return `${text.slice(0, start)}topics: ${flowList(topics)}${after}`;
  }

  // A block list: replace the run of `- item` lines that follows, keeping their indentation.
  const items = /^(?:\n[ \t]*-[ \t][^\n]*)+/.exec(after);
  if (!items) return `${text.slice(0, start)}topics: ${flowList(topics)}${after}`;
  const indent = /\n([ \t]*)-/.exec(items[0])?.[1] ?? '  ';
  const block = topics.map((topic) => `\n${indent}- ${scalar(topic)}`).join('');
  return `${text.slice(0, start)}topics:${block}${after.slice(items[0].length)}`;
}

/**
 * Merge every glossary proposal under `proposalsDir` into `glossaryDir`.
 *
 * A proposal is added when no existing term claims it — by id, by `en`, or by listing it among
 * its aliases (all compared case-insensitively). When an existing term does claim it, the
 * proposal is either identical (same `en` and `zh`, skipped, with any new `topics` folded into
 * the existing term) or it disagrees. Disagreement on the same id is a conflict a person has to
 * resolve; disagreement on an alias only means the term is already covered under another name.
 */
export async function mergeGlossaryProposals(
  proposalsDir: string,
  glossaryDir: string,
  options: MergeOptions = {},
): Promise<MergeResult> {
  const result: MergeResult = { added: [], skipped: [], conflicts: [], notes: [] };
  const files = await listYaml(proposalsDir);
  if (files.length === 0) return result;

  const existing = await readGlossary(glossaryDir);
  const byId = new Map(existing.map((term) => [term.id, term]));
  // Ids added during this run count as existing, so two proposals cannot both create a term.
  const claimed = new Map<string, ExistingTerm>();
  const lookup = (id: string): ExistingTerm | undefined => byId.get(id) ?? claimed.get(id);
  const byKey = (proposalKeys: Set<string>): ExistingTerm | undefined =>
    [...existing, ...claimed.values()].find((term) => [...term.keys].some((k) => proposalKeys.has(k)));

  for (const name of files) {
    const file = path.join(proposalsDir, name);
    for (const proposed of readProposal(file, await readFile(file, 'utf8'))) {
      const id = str(proposed.id) || '<missing id>';

      // Checked before the schema so the reason names the cap rather than a generic length issue.
      const short = proposed.short as { en?: unknown; zh?: unknown } | undefined;
      const long = (['en', 'zh'] as const).filter((lang) => str(short?.[lang]).length > SHORT_LIMIT);
      if (long.length > 0) {
        const lengths = long.map((lang) => `${lang}=${str(short?.[lang]).length}`).join(', ');
        result.conflicts.push({
          id,
          reason: `short definition exceeds ${SHORT_LIMIT} characters (${lengths})`,
        });
        continue;
      }

      const parsed = termSchema.safeParse(proposed);
      if (!parsed.success) {
        result.conflicts.push({
          id,
          reason: `does not match the glossary schema — ${issueLines(parsed.error)}`,
        });
        continue;
      }
      const term = parsed.data;
      if (!term.id) {
        result.conflicts.push({ id, reason: 'proposal has no id' });
        continue;
      }

      const proposalKeys = new Set([term.id, term.en, ...term.aliases].filter(Boolean).map(key));
      const sameId = lookup(term.id);
      const match = sameId ?? byKey(proposalKeys);
      const identical = match && key(match.en) === key(term.en) && key(match.zh) === key(term.zh);

      // Only an id collision is a conflict: a disagreement under the same id needs a person.
      if (sameId && !identical) {
        const fields = (['en', 'zh'] as const)
          .filter((field) => key(sameId[field]) !== key(term[field]))
          .map(
            (field) =>
              `${field}: ${JSON.stringify(sameId[field])} vs proposed ${JSON.stringify(term[field])}`,
          );
        result.conflicts.push({
          id: term.id,
          reason: `term already exists with a different ${fields.join('; ')}`,
        });
        continue;
      }

      if (match) {
        result.skipped.push(term.id);
        // An alias hit means the term is in the glossary under another name; either way its
        // topics are worth having, so they are folded in whichever way the match was found.
        const parts = identical ? [] : [`already covered by ${match.id}`];
        const added = term.topics
          .filter((topic) => !match.topics.includes(topic))
          .sort((a, b) => a.localeCompare(b));
        if (added.length > 0) {
          match.topics = [...match.topics, ...added].sort((a, b) => a.localeCompare(b));
          match.text = patchTopics(match.text, match.topics);
          parts.push(`merged topics: ${added.join(', ')}`);
          if (!options.dryRun) await writeFile(match.file, match.text);
        }
        if (parts.length > 0) result.notes.push({ id: term.id, note: parts.join('; ') });
        continue;
      }

      const target = path.join(glossaryDir, `${term.id}.yaml`);
      // The id lives in the filename, exactly as for the hand-written terms.
      const text = serializeTerm(term);
      result.added.push(term.id);
      claimed.set(term.id, {
        id: term.id,
        file: target,
        text,
        en: term.en,
        zh: term.zh,
        topics: term.topics,
        keys: proposalKeys,
      });
      if (!options.dryRun) await writeFile(target, text);
    }
  }

  return result;
}

export interface SidecarResult {
  ok: boolean;
  errors: string[];
}

export interface ValidateOptions {
  topicsDir?: string;
  quizzesDir?: string;
  interviewDir?: string;
  /** Every known `track/slug`; built from `topicsDir` when omitted. */
  knownTopics?: Set<string>;
}

/** Every `track/slug` with at least one language file under `root`. */
export async function listTopicIds(root: string = repoPath(TOPICS_ROOT)): Promise<Set<string>> {
  const ids = new Set<string>();
  let tracks;
  try {
    tracks = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ids;
    throw error;
  }
  for (const track of tracks.filter((entry) => entry.isDirectory())) {
    for (const file of await readdir(path.join(root, track.name))) {
      const match = /^(.+)\.(?:en|zh)\.mdx$/.exec(file);
      if (match) ids.add(`${track.name}/${match[1]}`);
    }
  }
  return ids;
}

/** Read a YAML file, or `undefined` when it is not there. */
async function readYaml(file: string): Promise<unknown | undefined> {
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
  return YAML.parse(text);
}

/**
 * Validate the sidecars of one topic: the quiz bank its frontmatter names (when it names one)
 * and the interview bank of its track, whose items may only point at topics that exist.
 *
 * The interview bank belongs to the track rather than the topic, so validating any topic of a
 * track validates the whole bank; the CLI de-duplicates the resulting messages.
 */
export async function validateSidecars(id: string, options: ValidateOptions = {}): Promise<SidecarResult> {
  const topicsDir = options.topicsDir ?? repoPath(TOPICS_ROOT);
  const quizzesDir = options.quizzesDir ?? repoPath(QUIZZES_ROOT);
  const interviewDir = options.interviewDir ?? repoPath(INTERVIEW_ROOT);
  const errors: string[] = [];

  const [track, slug, ...rest] = id.split('/');
  if (!track || !slug || rest.length > 0) return { ok: false, errors: [`${id}: expected {track}/{slug}`] };

  const topicFile = path.join(topicsDir, track, `${slug}.en.mdx`);
  let quizRef = '';
  try {
    quizRef = str(parseFrontmatter(await readFile(topicFile, 'utf8')).data.quiz);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return { ok: false, errors: [`${id}: no topic at ${path.relative(topicsDir, topicFile)}`] };
  }

  if (quizRef) {
    const quizFile = path.join(quizzesDir, `${quizRef}.yaml`);
    const quiz = await readYaml(quizFile);
    if (quiz === undefined)
      errors.push(`${id}: quiz ${quizRef} is referenced but ${quizRef}.yaml does not exist`);
    else {
      const parsed = quizSchema.safeParse(quiz);
      if (!parsed.success) errors.push(`quizzes/${quizRef}.yaml: ${issueLines(parsed.error)}`);
    }
  }

  const interviewFile = path.join(interviewDir, `${track}.yaml`);
  const interview = await readYaml(interviewFile);
  // No interview bank yet is normal: the polish pass creates one the first time it has an item.
  if (interview !== undefined) {
    const parsed = interviewSchema.safeParse(interview);
    if (!parsed.success) errors.push(`interview/${track}.yaml: ${issueLines(parsed.error)}`);
    else {
      const known = options.knownTopics ?? (await listTopicIds(topicsDir));
      for (const item of parsed.data.items) {
        for (const topic of item.topics) {
          if (!known.has(topic))
            errors.push(`interview/${track}.yaml: ${item.id} points at unknown topic ${topic}`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

/** One topic's line in the report. */
export interface TopicReport extends SidecarResult {
  id: string;
}

export interface ExtractReport {
  generatedAt: string;
  dryRun: boolean;
  glossary: MergeResult;
  topics: TopicReport[];
  /** Ids the runner may mark `extracted`; this script never writes the state file itself. */
  extracted: string[];
}

/** Every reviewed topic, English side, sorted — the default set for `content:extract all`. */
export async function listReviewedTopics(root: string = repoPath(TOPICS_ROOT)): Promise<string[]> {
  const ids: string[] = [];
  let tracks;
  try {
    tracks = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ids;
    throw error;
  }
  for (const track of tracks
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const dir = path.join(root, track.name);
    for (const file of (await readdir(dir)).sort((a, b) => a.localeCompare(b))) {
      const match = /^(.+)\.en\.mdx$/.exec(file);
      if (!match) continue;
      const data = parseFrontmatter(await readFile(path.join(dir, file), 'utf8')).data;
      if (str(data.status) === 'reviewed') ids.push(`${track.name}/${match[1]}`);
    }
  }
  return ids;
}

interface Args {
  all: boolean;
  dryRun: boolean;
  ids: string[];
}

/** Parse `{track}/{slug} …` or `all`, plus `--dry-run`. */
export function parseArgs(argv: string[]): Args {
  const args: Args = { all: false, dryRun: false, ids: [] };
  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === 'all') args.all = true;
    else if (arg.startsWith('-')) throw new Error(`unknown flag: ${arg}`);
    else args.ids.push(arg);
  }
  if (!args.all && args.ids.length === 0) {
    throw new Error('usage: content:extract {track}/{slug} [...] | all [--dry-run]');
  }
  return args;
}

/** The terminal summary; the lists themselves also go to `reports/extract.json`. */
export function summaryLines(report: ExtractReport, proposalCount: number): string[] {
  const { added, skipped, conflicts, notes } = report.glossary;
  const lines = [
    `glossary: ${proposalCount} proposals — ${added.length} added, ${skipped.length} skipped, ${conflicts.length} conflicts`,
  ];
  for (const id of added) lines.push(`  ${report.dryRun ? 'would add' : 'added'} ${id}`);
  for (const note of notes) lines.push(`  skipped ${note.id}: ${note.note}`);
  for (const conflict of conflicts) lines.push(`  CONFLICT ${conflict.id}: ${conflict.reason}`);

  const failed = report.topics.filter((topic) => !topic.ok);
  lines.push(
    `sidecars: ${report.topics.length} topics — ${report.extracted.length} ok, ${failed.length} failed`,
  );
  for (const topic of failed) for (const error of topic.errors) lines.push(`  FAIL ${error}`);
  lines.push(
    report.extracted.length > 0
      ? `would mark extracted: ${report.extracted.join(' ')}`
      : 'would mark extracted: (none)',
  );
  return lines;
}

/** CLI: merge every proposal, validate the named sidecars, report, and gate on the result. */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const proposalsDir = repoPath(PROPOSALS_ROOT);
  const proposalCount = (await listYaml(proposalsDir)).length;
  const glossary = await mergeGlossaryProposals(proposalsDir, repoPath(GLOSSARY_ROOT), {
    dryRun: args.dryRun,
  });

  const ids = args.ids.length > 0 ? args.ids : await listReviewedTopics();
  const knownTopics = await listTopicIds();
  const topics: TopicReport[] = [];
  for (const id of ids) topics.push({ id, ...(await validateSidecars(id, { knownTopics })) });

  const report: ExtractReport = {
    generatedAt: new Date().toISOString(),
    dryRun: args.dryRun,
    glossary,
    topics,
    extracted: topics.filter((topic) => topic.ok).map((topic) => topic.id),
  };
  const reportFile = repoPath(REPORT_PATH);
  await mkdir(path.dirname(reportFile), { recursive: true });
  await writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`);

  for (const line of summaryLines(report, proposalCount)) console.log(line);
  console.log(`report: ${REPORT_PATH}`);
  if (glossary.conflicts.length > 0 || report.extracted.length < topics.length) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
