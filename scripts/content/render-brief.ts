/**
 * The Codex brief for one topic, rendered from a prompt template.
 *
 * The polish pass is done by Codex, not by this repository: `prompts/polish-topic.md`
 * holds the editorial instructions and carries `{{PLACEHOLDER}}` holes for the one topic
 * a run is about. This module fills those holes and nothing else, so the prompt stays a
 * prose document a human edits and the runner stays a piece of plumbing.
 *
 * {@link renderBrief} refuses to emit a brief with a hole left in it: a stray
 * `{{EN_PATH}}` reaching Codex reads as an instruction about a file that does not exist,
 * which is worse than a run that never starts. {@link briefVarsFor} builds the variables
 * from what the pipeline already knows — the staged pair, its lint report, today's date.
 *
 * CLI: `tsx scripts/content/render-brief.ts {track}/{slug} [--lint-report path]
 * [--canonical en|zh] [--template path]` prints the rendered brief on stdout, which is
 * what `scripts/content/polish.sh` pipes into `codex exec`.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './lib/frontmatter';
import { REPO_ROOT, repoPath, STAGING_ROOT } from './lib/paths';

/** The two languages of every topic. */
const LANGS = ['en', 'zh'] as const;

type Lang = (typeof LANGS)[number];

/** Repository-relative directory holding the per-topic lint reports. */
const LINT_REPORTS_ROOT = 'reports/lint';

/** The prompt this runner renders by default. */
export const POLISH_TEMPLATE = 'prompts/polish-topic.md';

/** A `{{NAME}}` hole. Names are upper snake case, so prose braces are left alone. */
const PLACEHOLDER = /\{\{([A-Z0-9_]+)\}\}/g;

/**
 * Fill every `{{NAME}}` in `template` from `vars`, throwing if any hole is left.
 *
 * The substitution is a single pass and the replacement is taken verbatim, so a value
 * that happens to contain `{{…}}` or `$&` reaches the output unchanged instead of being
 * re-scanned or expanded as a regular-expression replacement pattern.
 */
export function renderBrief(template: string, vars: Record<string, string>): string {
  const missing = new Set<string>();
  const out = template.replace(PLACEHOLDER, (match, name: string) => {
    const value = vars[name];
    if (value === undefined) {
      missing.add(name);
      return match;
    }
    return value;
  });
  if (missing.size > 0) {
    throw new Error(`unreplaced placeholders: ${[...missing].sort().join(', ')}`);
  }
  return out;
}

export interface BriefVarOptions {
  /** Where the topic's lint report is; defaults to `reports/lint/{slugFlat}.json`. */
  lintReportPath?: string;
  /** Canonical language; defaults to the lint report's `canonicalHint`, else `zh`. */
  canonical?: Lang;
  /** Staging root; defaults to `content/staging/topics`. */
  root?: string;
  /** ISO date stamped into the brief; defaults to today. */
  today?: string;
}

/** `{track}/{slug}` with the slash flattened, as the report directories spell it. */
export function slugFlat(id: string): string {
  return id.replace(/\//g, '__');
}

/** A repository path as Codex should see it: relative to the repository root. */
function displayPath(file: string): string {
  const relative = path.relative(REPO_ROOT, file);
  return relative.startsWith('..') ? file : relative;
}

/** Today in `YYYY-MM-DD`, the form the topic frontmatter uses. */
function isoDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** The `canonicalHint` of a lint report; `zh` when there is no readable report. */
async function readCanonicalHint(file: string): Promise<Lang> {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8')) as { canonicalHint?: string };
    return parsed.canonicalHint === 'en' ? 'en' : 'zh';
  } catch {
    return 'zh';
  }
}

/**
 * The section of a staged topic, read from whichever language file is readable.
 *
 * The section places the topic in the track's table of contents and the brief passes it
 * to Codex, so a topic that has none is a defect worth stopping on rather than a brief
 * that tells Codex the section is empty.
 */
async function readSection(files: Record<Lang, string>, id: string): Promise<string> {
  for (const lang of LANGS) {
    let text: string;
    try {
      text = await readFile(files[lang], 'utf8');
    } catch {
      continue;
    }
    const { data } = parseFrontmatter(text);
    const section = typeof data.section === 'string' ? data.section.trim() : '';
    if (section) return section;
    throw new Error(`${id}: staged frontmatter has no section (${displayPath(files[lang])})`);
  }
  throw new Error(`${id}: no staged files under ${displayPath(path.dirname(files.en))}`);
}

/** The variables `prompts/polish-topic.md` asks for, for one topic. */
export async function briefVarsFor(
  id: string,
  options: BriefVarOptions = {},
): Promise<Record<string, string>> {
  const [track, slug] = id.split('/');
  if (!track || !slug) throw new Error(`not a {track}/{slug} topic id: ${id}`);
  const flat = slugFlat(id);
  const root = options.root ?? repoPath(STAGING_ROOT);
  const files = {
    en: path.join(root, track, `${slug}.en.md`),
    zh: path.join(root, track, `${slug}.zh.md`),
  };
  const lintReport = options.lintReportPath ?? repoPath(LINT_REPORTS_ROOT, `${flat}.json`);
  const canonical = options.canonical ?? (await readCanonicalHint(lintReport));
  return {
    TOPIC_ID: id,
    TRACK: track,
    SLUG: slug,
    SECTION: await readSection(files, id),
    EN_PATH: displayPath(files.en),
    ZH_PATH: displayPath(files.zh),
    LINT_REPORT: displayPath(lintReport),
    CANONICAL_LANG: canonical,
    OTHER_LANG: canonical === 'en' ? 'zh' : 'en',
    TODAY: options.today ?? isoDate(),
    SLUG_FLAT: flat,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Args {
  id: string;
  template: string;
  lintReport?: string;
  canonical?: Lang;
}

/** Parse `{track}/{slug} [--template path] [--lint-report path] [--canonical en|zh]`. */
export function parseArgs(argv: string[]): Args {
  const args: Args = { id: '', template: repoPath(POLISH_TEMPLATE) };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = (): string => {
      const next = argv[i + 1];
      if (next === undefined) throw new Error(`${arg} needs a value`);
      i += 1;
      return next;
    };
    if (arg === '--template') args.template = value();
    else if (arg === '--lint-report') args.lintReport = value();
    else if (arg === '--canonical') {
      const lang = value();
      if (lang !== 'en' && lang !== 'zh') throw new Error(`--canonical takes en or zh: ${lang}`);
      args.canonical = lang;
    } else if (arg.startsWith('-')) throw new Error(`unknown flag: ${arg}`);
    else if (args.id) throw new Error(`one topic at a time: ${args.id} and ${arg}`);
    else args.id = arg;
  }
  if (!args.id) {
    throw new Error(
      'usage: render-brief {track}/{slug} [--template path] [--lint-report path] [--canonical en|zh]',
    );
  }
  return args;
}

/** CLI: print the rendered brief for one topic. */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const template = await readFile(args.template, 'utf8');
  const vars = await briefVarsFor(args.id, {
    lintReportPath: args.lintReport,
    canonical: args.canonical,
  });
  process.stdout.write(renderBrief(template, vars));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
