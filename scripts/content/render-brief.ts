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
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './lib/frontmatter';
import { REPO_ROOT, repoPath, STAGING_ROOT, TOPICS_ROOT } from './lib/paths';

/** The two languages of every topic. */
const LANGS = ['en', 'zh'] as const;

type Lang = (typeof LANGS)[number];

/** Repository-relative directory holding the per-topic lint reports. */
const LINT_REPORTS_ROOT = 'reports/lint';

/** The prompt this runner renders by default. */
export const POLISH_TEMPLATE = 'prompts/polish-topic.md';

/**
 * How many sibling ids the brief lists before it stops.
 *
 * The list exists so Codex can fill `prerequisites` and `related` with ids that resolve;
 * a track with hundreds of staged topics would spend more of the context window on the
 * list than on the article, so the tail is summarised instead of printed.
 */
const MAX_SIBLINGS = 150;

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
  /** Published topics root; defaults to `src/content/topics`. */
  topicsRoot?: string;
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
 * The section of a staged topic, read from whichever language file carries one.
 *
 * `en` is preferred, but a draft pair is often lopsided: one side may have been imported
 * without a section while the other one is complete, so an empty `section` falls through
 * to the next language instead of stopping the run. Only a pair that names no section at
 * all is a defect worth stopping on — the section places the topic in the track's table
 * of contents, and a brief telling Codex the section is empty is worse than no brief.
 */
async function readSection(files: Record<Lang, string>, id: string): Promise<string> {
  const read: string[] = [];
  for (const lang of LANGS) {
    let text: string;
    try {
      text = await readFile(files[lang], 'utf8');
    } catch {
      continue;
    }
    read.push(displayPath(files[lang]));
    const { data } = parseFrontmatter(text);
    const section = typeof data.section === 'string' ? data.section.trim() : '';
    if (section) return section;
  }
  if (read.length > 0) {
    throw new Error(`${id}: staged frontmatter has no section (${read.join(', ')})`);
  }
  throw new Error(`${id}: no staged files under ${displayPath(path.dirname(files.en))}`);
}

/**
 * The `title` of a topic file, or an empty string when the file or the field is missing.
 *
 * A staged pair is often lopsided, so the caller tries the languages in turn rather than
 * failing: a sibling with no readable title is still a usable id.
 */
async function readTitle(file: string): Promise<string> {
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    return '';
  }
  const { data } = parseFrontmatter(text);
  return typeof data.title === 'string' ? data.title.trim() : '';
}

/**
 * Every topic id in `track`, staged or published, with the title that goes with it.
 *
 * Codex writes `prerequisites` and `related` from this list, so it has to describe what
 * exists rather than what is polished: a staged pair is a legitimate target because the
 * whole track is being polished in the same campaign. Slugs seen in staging win over the
 * published copy, which is the same topic at an earlier stage.
 */
async function siblingsIn(
  track: string,
  self: string,
  stagingRoot: string,
  topicsRoot: string,
): Promise<string[]> {
  const sources: { dir: string; suffix: string; other: string }[] = [
    { dir: path.join(stagingRoot, track), suffix: '.en.md', other: '.zh.md' },
    { dir: path.join(topicsRoot, track), suffix: '.en.mdx', other: '.zh.mdx' },
  ];
  const titles = new Map<string, string>();
  for (const { dir, suffix, other } of sources) {
    let names: string[];
    try {
      names = await readdir(dir);
    } catch {
      continue;
    }
    for (const name of names.sort()) {
      if (!name.endsWith(suffix)) continue;
      const slug = name.slice(0, -suffix.length);
      if (slug === self || titles.has(slug)) continue;
      const title =
        (await readTitle(path.join(dir, name))) || (await readTitle(path.join(dir, `${slug}${other}`)));
      titles.set(slug, title || slug);
    }
  }
  return [...titles.keys()].sort().map((slug) => `- ${track}/${slug} — ${titles.get(slug)}`);
}

/** The sibling list as the brief prints it: one id per line, with a summarised tail. */
function formatSiblings(lines: string[]): string {
  if (lines.length === 0) return '- (none)';
  if (lines.length <= MAX_SIBLINGS) return lines.join('\n');
  const shown = lines.slice(0, MAX_SIBLINGS);
  return [...shown, `- … and ${lines.length - MAX_SIBLINGS} more`].join('\n');
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
  const topicsRoot = options.topicsRoot ?? repoPath(TOPICS_ROOT);
  return {
    TOPIC_ID: id,
    TRACK: track,
    SLUG: slug,
    SECTION: await readSection(files, id),
    SIBLINGS: formatSiblings(await siblingsIn(track, slug, root, topicsRoot)),
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
