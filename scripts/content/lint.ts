/**
 * Linting of the staged corpus, before anybody polishes it.
 *
 * `pnpm content:lint {track}/{slug}` reads the two staged Markdown files of one topic and
 * reports what the machine can see without judgement: Chinese typography, code samples
 * that do not parse, links that no longer resolve, and cited books nobody has verified.
 * `all` walks the whole staging tree four topics at a time and prints one summary line.
 *
 * The findings go to `reports/lint/{id}.json` rather than to the terminal, because the
 * consumer is the polish agent: it reads one topic's report, fixes what the report lists
 * and leaves the rest. The report also carries a `canonicalHint`, a guess at which
 * language is the better base for the rewrite — the corpus has diverged over the years
 * and one side is usually the fuller, more correct one.
 *
 * Typography is the one finding this script can also repair: `--fix` applies the safe
 * half of the typography rules to the Chinese file and reports what is left.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkFences, type FenceResult } from './lib/code-check';
import { parseFrontmatter } from './lib/frontmatter';
import { bookTitles, checkLinks, extractLinks, type LinkStatus } from './lib/links';
import { wordCount } from './lib/markdown';
import { repoPath, STAGING_ROOT } from './lib/paths';
import {
  findZhIssues,
  fixZhTypography,
  zhIssueSummary,
  type ZhIssue,
  type ZhRule,
} from './lib/zh-typography';

/** The two languages of every topic, in report order. */
const LANGS = ['en', 'zh'] as const;

type Lang = (typeof LANGS)[number];

/** Topics linted at once by `all`; the code checker is the expensive part. */
const CONCURRENCY = 4;

/** Repository-relative directory holding the per-topic reports. */
export const LINT_REPORTS_ROOT = 'reports/lint';

export interface DeadLink {
  lang: Lang;
  /** 1-based line in the file, frontmatter included. */
  line: number;
  url: string;
  /** HTTP status, or `error` when the request never produced a response. */
  status: number | 'error';
}

export interface UnverifiedBook {
  lang: Lang;
  /** 1-based line in the file, frontmatter included. */
  line: number;
  title: string;
}

export interface LintReport {
  /** `{track}/{slug}`. */
  id: string;
  generatedAt: string;
  /** Chinese typography of the staged zh file as it now stands, `--fix` applied. */
  zh: { issues: ZhIssue[]; summary: Record<ZhRule, number> };
  /** Fenced samples that failed to parse, per language; a skipped fence is not listed. */
  code: Record<Lang, FenceResult[]>;
  links: { dead: DeadLink[]; unverifiedBooks: UnverifiedBook[] };
  /** Which language the polish pass should treat as the base text. */
  canonicalHint: Lang;
}

export interface LintOptions {
  /** Skip the network part of the link check; book titles are still collected. */
  noLinks?: boolean;
  /** Apply the safe typography fixes to the staged zh file. */
  fix?: boolean;
  /** Staging root; defaults to `content/staging/topics`. */
  root?: string;
  /** Link verdict cache; defaults to `reports/link-cache.json`. */
  cachePath?: string;
}

/**
 * Which language the polish pass should start from.
 *
 * Code that does not parse is the strongest signal of a neglected side, so it decides
 * first; length breaks the tie, because the fuller article is usually the one somebody
 * kept updating. When neither separates the two, Chinese wins: most of the corpus was
 * written in Chinese first, so it holds the author's own phrasing.
 */
export function canonicalHint(codeErrors: Record<Lang, number>, words: Record<Lang, number>): Lang {
  if (codeErrors.en !== codeErrors.zh) return codeErrors.en < codeErrors.zh ? 'en' : 'zh';
  if (words.en !== words.zh) return words.en > words.zh ? 'en' : 'zh';
  return 'zh';
}

/** Where one topic's report is written; slashes in the id become `__`. */
export function reportPath(id: string, root: string = repoPath(LINT_REPORTS_ROOT)): string {
  return path.join(root, `${id.replace(/\//g, '__')}.json`);
}

/** Absolute path to one language of a staged topic. */
export function stagingPath(id: string, lang: Lang, root: string): string {
  return path.join(root, `${id}.${lang}.md`);
}

/**
 * Lines the frontmatter occupies, so a position inside the body can be reported against
 * the file the author actually edits.
 */
function bodyOffset(text: string, body: string): number {
  return text.split('\n').length - body.split('\n').length;
}

/** Lint one staged topic, writing the zh file back first when `--fix` is on. */
export async function lintTopic(id: string, options: LintOptions = {}): Promise<LintReport> {
  const root = options.root ?? repoPath(STAGING_ROOT);
  const documents = {} as Record<Lang, { body: string; offset: number }>;
  for (const lang of LANGS) {
    const file = stagingPath(id, lang, root);
    let text = await readFile(file, 'utf8');
    if (options.fix && lang === 'zh') {
      const fixed = fixDocument(text);
      if (fixed !== text) {
        await writeFile(file, fixed);
        text = fixed;
      }
    }
    const { body } = parseFrontmatter(text);
    documents[lang] = { body, offset: bodyOffset(text, body) };
  }

  const zhIssues = findZhIssues(documents.zh.body).map((issue) => ({
    ...issue,
    line: issue.line + documents.zh.offset,
  }));

  const code = {} as Record<Lang, FenceResult[]>;
  for (const lang of LANGS) {
    const results = await checkFences(documents[lang].body);
    code[lang] = results
      .filter((fence) => !fence.ok)
      .map((fence) => ({ ...fence, line: fence.line + documents[lang].offset }));
  }

  const urls = LANGS.flatMap((lang) => extractLinks(documents[lang].body).map((link) => link.url));
  const statuses: ReadonlyMap<string, LinkStatus> = options.noLinks
    ? new Map()
    : await checkLinks(urls, { cachePath: options.cachePath ?? repoPath('reports/link-cache.json') });

  const dead: DeadLink[] = [];
  const unverifiedBooks: UnverifiedBook[] = [];
  for (const lang of LANGS) {
    const { body, offset } = documents[lang];
    for (const link of extractLinks(body)) {
      const status = statuses.get(link.url);
      if (!status || status.ok) continue;
      dead.push({ lang, line: link.line + offset, url: link.url, status: status.status });
    }
    for (const book of bookTitles(body)) {
      unverifiedBooks.push({ lang, line: book.line + offset, title: book.title });
    }
  }

  const codeErrors = { en: code.en.length, zh: code.zh.length };
  const words = { en: wordCount(documents.en.body), zh: wordCount(documents.zh.body) };
  return {
    id,
    generatedAt: new Date().toISOString(),
    zh: { issues: zhIssues, summary: zhIssueSummary(zhIssues) },
    code,
    links: { dead, unverifiedBooks },
    canonicalHint: canonicalHint(codeErrors, words),
  };
}

/**
 * Apply the safe typography fixes to a document's body, leaving its frontmatter alone:
 * the fixes are written for prose, and rewriting punctuation inside YAML could change
 * how a value parses.
 */
export function fixDocument(text: string): string {
  const { body } = parseFrontmatter(text);
  const lines = text.split('\n');
  const head = lines.slice(0, bodyOffset(text, body));
  // A body that is not a line-wise suffix of the file means the split is not reliable
  // here, so nothing is rewritten rather than risking a corrupted file.
  if (lines.slice(head.length).join('\n') !== body) return text;
  return [...head, fixZhTypography(body)].join('\n');
}

/** Write one topic's report and return where it went. */
export async function writeReport(report: LintReport, root?: string): Promise<string> {
  const file = reportPath(report.id, root);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(report, null, 2)}\n`);
  return file;
}

/** Every `{slug}.en.md` / `{slug}.zh.md` pair under the staging root, sorted. */
export async function listStaged(root: string = repoPath(STAGING_ROOT)): Promise<string[]> {
  const tracks = await readdir(root, { withFileTypes: true });
  const ids: string[] = [];
  for (const track of tracks.filter((entry) => entry.isDirectory())) {
    const files = new Set(await readdir(path.join(root, track.name)));
    for (const file of [...files].sort()) {
      const match = /^(.+)\.en\.md$/.exec(file);
      if (match && files.has(`${match[1]}.zh.md`)) ids.push(`${track.name}/${match[1]}`);
    }
  }
  return ids.sort();
}

export interface LintFailure {
  id: string;
  error: string;
}

export interface LintRun {
  reports: LintReport[];
  /** Topics that could not be linted at all, usually a missing or unreadable file. */
  failures: LintFailure[];
}

/**
 * Run `lintTopic` over many ids, at most {@link CONCURRENCY} at a time, in id order.
 *
 * One unreadable topic does not abandon the run: a corpus of nine hundred topics is far
 * too expensive to redo because one file was missing, so the failure is collected and
 * the remaining topics are still linted and still get their reports.
 */
export async function lintAll(ids: string[], options: LintOptions): Promise<LintRun> {
  const reports: (LintReport | undefined)[] = new Array(ids.length);
  const failures: LintFailure[] = [];
  let next = 0;
  const workers = Math.max(1, Math.min(CONCURRENCY, ids.length));
  await Promise.all(
    Array.from({ length: workers }, async () => {
      for (let index = next++; index < ids.length; index = next++) {
        try {
          const report = await lintTopic(ids[index], options);
          await writeReport(report);
          reports[index] = report;
        } catch (error) {
          failures.push({ id: ids[index], error: (error as Error).message });
        }
      }
    }),
  );
  return {
    reports: reports.filter((report): report is LintReport => report !== undefined),
    failures: failures.sort((a, b) => a.id.localeCompare(b.id)),
  };
}

/** One line covering a whole run. */
export function summaryLine(run: LintRun): string {
  const totals = run.reports.reduce(
    (sum, report) => ({
      zh: sum.zh + report.zh.issues.length,
      code: sum.code + report.code.en.length + report.code.zh.length,
      dead: sum.dead + report.links.dead.length,
      books: sum.books + report.links.unverifiedBooks.length,
    }),
    { zh: 0, code: 0, dead: 0, books: 0 },
  );
  return `linted ${run.reports.length} topics: zhIssues=${totals.zh} codeErrors=${totals.code} deadLinks=${totals.dead} unverifiedBooks=${totals.books} unreadable=${run.failures.length}`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Args {
  ids: string[];
  all: boolean;
  noLinks: boolean;
  fix: boolean;
}

/**
 * Parse `{track}/{slug} …` or `all`, plus `--no-links` and `--fix`. The network is off by
 * default on CI and wherever `NO_NETWORK` is set, so a sandboxed run needs no flag.
 */
export function parseArgs(argv: string[], env: NodeJS.ProcessEnv = process.env): Args {
  const args: Args = { ids: [], all: false, noLinks: Boolean(env.CI || env.NO_NETWORK), fix: false };
  for (const arg of argv) {
    if (arg === '--no-links') args.noLinks = true;
    else if (arg === '--fix') args.fix = true;
    else if (arg.startsWith('-')) throw new Error(`unknown flag: ${arg}`);
    else if (arg === 'all') args.all = true;
    else args.ids.push(arg);
  }
  if (!args.all && args.ids.length === 0) {
    throw new Error('usage: content:lint {track}/{slug} [...] | all [--no-links] [--fix]');
  }
  return args;
}

/** CLI: lint the named topics (or all of them) and write one report each. */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const options: LintOptions = { noLinks: args.noLinks, fix: args.fix };
  const ids = args.all ? await listStaged() : args.ids;
  const run = await lintAll(ids, options);
  if (args.all) console.log(summaryLine(run));
  else {
    for (const report of run.reports) {
      console.log(
        `${report.id}: zhIssues=${report.zh.issues.length} codeErrors=${report.code.en.length + report.code.zh.length} deadLinks=${report.links.dead.length} unverifiedBooks=${report.links.unverifiedBooks.length} canonical=${report.canonicalHint}`,
      );
      console.log(`  ${path.relative(repoPath('.'), reportPath(report.id))}`);
    }
  }
  for (const failure of run.failures) console.log(`FAIL ${failure.id}: ${failure.error}`);
  if (run.failures.length > 0) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
