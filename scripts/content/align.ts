/**
 * CLI for the bilingual alignment check.
 *
 * `pnpm content:align {track}/{slug}` compares the block structure of the two languages
 * of one topic; `--all` walks every pair under `src/content/topics`. The verdict is
 * written back into both files as `aligned: true|false`, because the reading mode and
 * the content schema both read it from the frontmatter rather than from a report. The
 * exit status is 1 as soon as one pair is misaligned, so the check can gate CI.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { alignBlocks, blocks, formatMismatches, setAligned, type AlignResult } from './lib/alignment';
import { repoPath, TOPICS_ROOT } from './lib/paths';

export interface TopicId {
  track: string;
  slug: string;
}

export interface AlignOptions {
  /** Report the verdict without touching the files. */
  dryRun: boolean;
}

export interface TopicReport extends TopicId {
  result: AlignResult;
  /** Files whose `aligned:` line this run changed. */
  written: string[];
}

/** Absolute path to one language of a topic. */
export function topicPath(id: TopicId, lang: 'en' | 'zh'): string {
  return repoPath(TOPICS_ROOT, id.track, `${id.slug}.${lang}.mdx`);
}

/** Every `{slug}.en.mdx` / `{slug}.zh.mdx` pair under the topics root, sorted. */
export async function listTopics(root: string = repoPath(TOPICS_ROOT)): Promise<TopicId[]> {
  const tracks = await readdir(root, { withFileTypes: true });
  const ids: TopicId[] = [];
  for (const track of tracks.filter((entry) => entry.isDirectory())) {
    const files = new Set(await readdir(path.join(root, track.name)));
    for (const file of [...files].sort()) {
      const match = /^(.+)\.en\.mdx$/.exec(file);
      if (match && files.has(`${match[1]}.zh.mdx`)) ids.push({ track: track.name, slug: match[1] });
    }
  }
  return ids.sort((a, b) => a.track.localeCompare(b.track) || a.slug.localeCompare(b.slug));
}

/** Check one topic and, unless this is a dry run, record the verdict in both files. */
export async function alignTopic(id: TopicId, options: AlignOptions): Promise<TopicReport> {
  const files = { en: topicPath(id, 'en'), zh: topicPath(id, 'zh') };
  const texts = {
    en: await readFile(files.en, 'utf8'),
    zh: await readFile(files.zh, 'utf8'),
  };
  const result = alignBlocks(blocks(texts.en), blocks(texts.zh));
  const written: string[] = [];
  for (const lang of ['en', 'zh'] as const) {
    const next = setAligned(texts[lang], result.aligned);
    if (next === texts[lang]) continue;
    written.push(files[lang]);
    if (!options.dryRun) await writeFile(files[lang], next);
  }
  return { ...id, result, written };
}

/** The lines one topic contributes to the terminal output. */
export function reportLines(report: TopicReport): string[] {
  const id = `${report.track}/${report.slug}`;
  if (report.result.aligned) return [`OK ${id}`];
  const similarity = report.result.similarity.toFixed(2);
  return [
    `FAIL ${id} (${report.result.mismatches.length} mismatches, similarity ${similarity})`,
    ...formatMismatches(report.result.mismatches),
  ];
}

interface Args extends AlignOptions {
  all: boolean;
  ids: string[];
}

/** Parse `{track}/{slug} …`, `--all` and `--dry-run`. */
export function parseArgs(argv: string[]): Args {
  const args: Args = { all: false, dryRun: false, ids: [] };
  for (const arg of argv) {
    if (arg === '--all') args.all = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg.startsWith('-')) throw new Error(`unknown flag: ${arg}`);
    else args.ids.push(arg);
  }
  if (!args.all && args.ids.length === 0) {
    throw new Error('usage: content:align {track}/{slug} [...] | --all [--dry-run]');
  }
  return args;
}

/** Turn a `{track}/{slug}` argument into an id. */
function parseId(id: string): TopicId {
  const [track, slug, ...rest] = id.split('/');
  if (!track || !slug || rest.length > 0) throw new Error(`expected {track}/{slug}, got: ${id}`);
  return { track, slug };
}

/** CLI: check the named topics (or all of them) and report. */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const ids = args.all ? await listTopics() : args.ids.map(parseId);
  let failed = 0;
  for (const id of ids) {
    const report = await alignTopic(id, { dryRun: args.dryRun });
    if (!report.result.aligned) failed += 1;
    for (const line of reportLines(report)) console.log(line);
    for (const file of report.written) {
      console.log(`  ${args.dryRun ? 'would update' : 'updated'} ${path.relative(repoPath('.'), file)}`);
    }
  }
  if (failed > 0) {
    console.log(`${failed} of ${ids.length} pairs are not aligned`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
