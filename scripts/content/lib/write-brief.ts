/** Render one autonomous content-writing brief and enumerate the files it may produce. */
import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { getTrack, TRACKS } from '@/data/tracks';
import { VERSIONS } from '@/data/versions';
import { renderBrief } from '../render-brief';
import { parseFrontmatter } from './frontmatter';
import { REPO_ROOT, repoPath, STAGING_ROOT, TOPICS_ROOT } from './paths';

export const WRITE_KINDS = ['quiz', 'kata', 'interview', 'path', 'cheatsheet'] as const;
export type WriteKind = (typeof WRITE_KINDS)[number];

const TEMPLATES: Record<WriteKind, string> = {
  quiz: 'prompts/write-quiz-bank.md',
  kata: 'prompts/write-review-kata.md',
  interview: 'prompts/write-interview-bank.md',
  path: 'prompts/write-path.md',
  cheatsheet: 'prompts/write-cheatsheet.md',
};

const SLUG = /^[a-z0-9-]+$/;
const MAX_INVENTORY = 180;
const execFileAsync = promisify(execFile);

interface Identity {
  runId: string;
  track: string;
  slug: string;
  topicId: string;
}

export interface WriteBriefOptions {
  stagingRoot?: string;
  topicsRoot?: string;
  glossaryRoot?: string;
  templatesRoot?: string;
  today?: string;
  /** Git fallback for branches where P0 staging has not been merged; null disables it. */
  inventoryRef?: string | null;
}

export interface OutputPathOptions {
  quizzesRoot?: string;
  interviewRoot?: string;
  pathsRoot?: string;
  cheatsheetsRoot?: string;
}

/** Resolve the several public id conventions onto one track and one output slug. */
export function identityFor(kind: WriteKind, id: string): Identity {
  const parts = id.split('/');
  if (parts.some((part) => !SLUG.test(part))) throw new Error(`invalid ${kind} id: ${id}`);
  if (kind === 'quiz' || kind === 'kata') {
    if (parts.length !== 2) throw new Error(`${kind} needs a {track}/{slug} id: ${id}`);
    return { runId: id, track: parts[0], slug: parts[1], topicId: id };
  }
  if (kind === 'interview') {
    if (parts.length !== 1 || !getTrack(id)) throw new Error(`interview needs a track slug: ${id}`);
    return { runId: id, track: id, slug: id, topicId: id };
  }
  if (parts.length === 2) {
    return { runId: id, track: parts[0], slug: parts[1], topicId: id };
  }
  if (parts.length !== 1) throw new Error(`invalid ${kind} id: ${id}`);
  if (kind === 'cheatsheet' && getTrack(id)) {
    return { runId: id, track: id, slug: id, topicId: id };
  }
  const track = TRACKS.find((candidate) => id === candidate.slug || id.startsWith(`${candidate.slug}-`));
  if (!track) throw new Error(`${kind} id needs a {track}/{slug} scope: ${id}`);
  return { runId: id, track: track.slug, slug: id, topicId: `${track.slug}/${id}` };
}

function displayPath(file: string): string {
  const relative = path.relative(REPO_ROOT, file);
  return relative.startsWith('..') ? file : relative;
}

async function readTitle(file: string): Promise<string> {
  try {
    const title = parseFrontmatter(await readFile(file, 'utf8')).data.title;
    return typeof title === 'string' ? title.trim() : '';
  } catch {
    return '';
  }
}

async function namesIn(dir: string): Promise<string[]> {
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
}

async function addFilesystemTopics(
  topics: Map<string, string>,
  track: string,
  root: string,
  suffix: '.en.md' | '.en.mdx',
  other: '.zh.md' | '.zh.mdx',
): Promise<void> {
  const dir = path.join(root, track);
  for (const name of (await namesIn(dir)).sort()) {
    if (!name.endsWith(suffix)) continue;
    const slug = name.slice(0, -suffix.length);
    if (topics.has(slug)) continue;
    const title =
      (await readTitle(path.join(dir, name))) || (await readTitle(path.join(dir, `${slug}${other}`)));
    topics.set(slug, title || slug);
  }
}

async function gitLines(args: string[]): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync('git', args, { cwd: REPO_ROOT, maxBuffer: 16 * 1024 * 1024 });
    return stdout.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/** Fill a missing staging tree directly from the pinned P0 branch used by this task. */
async function addGitTopics(topics: Map<string, string>, track: string, ref: string): Promise<void> {
  const root = `${STAGING_ROOT}/${track}`;
  const files = (await gitLines(['ls-tree', '-r', '--name-only', ref, root])).filter((file) =>
    file.endsWith('.en.md'),
  );
  for (const file of files) {
    const slug = path.basename(file, '.en.md');
    if (topics.has(slug)) continue;
    const text = (await gitLines(['show', `${ref}:${file}`])).join('\n');
    let title = '';
    try {
      const value = parseFrontmatter(text).data.title;
      title = typeof value === 'string' ? value.trim() : '';
    } catch {
      // A malformed old title should not remove an otherwise usable inventory id.
    }
    topics.set(slug, title || slug);
  }
}

async function topicInventory(track: string, options: WriteBriefOptions): Promise<string[]> {
  const staging = options.stagingRoot ?? repoPath(STAGING_ROOT);
  const live = options.topicsRoot ?? repoPath(TOPICS_ROOT);
  const topics = new Map<string, string>();
  await addFilesystemTopics(topics, track, staging, '.en.md', '.zh.md');
  if (topics.size === 0 && options.inventoryRef !== null) {
    await addGitTopics(topics, track, options.inventoryRef ?? 'p0-content-pipeline');
  }
  await addFilesystemTopics(topics, track, live, '.en.mdx', '.zh.mdx');
  return [...topics.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, title]) => `- ${track}/${slug} — ${title}`);
}

async function glossaryIds(options: WriteBriefOptions): Promise<string[]> {
  const root = options.glossaryRoot ?? repoPath('src/content/glossary');
  const ids = new Set(
    (await namesIn(root))
      .filter((name) => name.endsWith('.yaml'))
      .map((name) => path.basename(name, '.yaml')),
  );
  if (options.inventoryRef !== null) {
    for (const file of await gitLines([
      'ls-tree',
      '-r',
      '--name-only',
      options.inventoryRef ?? 'p0-content-pipeline',
      'src/content/glossary',
    ])) {
      if (file.endsWith('.yaml')) ids.add(path.basename(file, '.yaml'));
    }
  }
  return [...ids].sort();
}

async function preferredTopicPath(
  track: string,
  slug: string,
  lang: 'en' | 'zh',
  options: WriteBriefOptions,
): Promise<string> {
  const live = path.join(options.topicsRoot ?? repoPath(TOPICS_ROOT), track, `${slug}.${lang}.mdx`);
  try {
    await readFile(live, 'utf8');
    return displayPath(live);
  } catch {
    return displayPath(path.join(options.stagingRoot ?? repoPath(STAGING_ROOT), track, `${slug}.${lang}.md`));
  }
}

function formatList(lines: string[], empty = '- (none)'): string {
  if (lines.length === 0) return empty;
  if (lines.length <= MAX_INVENTORY) return lines.join('\n');
  return [...lines.slice(0, MAX_INVENTORY), `- … and ${lines.length - MAX_INVENTORY} more`].join('\n');
}

/** Build every variable used by the five write prompts. */
export async function writeVarsFor(
  kind: WriteKind,
  id: string,
  options: WriteBriefOptions = {},
): Promise<Record<string, string>> {
  const identity = identityFor(kind, id);
  const track = getTrack(identity.track);
  if (!track) throw new Error(`unknown track: ${identity.track}`);
  const inventory = await topicInventory(identity.track, options);
  const topicPair = kind === 'quiz' || kind === 'kata';
  const inventoryTopic = inventory[0]?.match(/^- ([a-z0-9-]+\/[a-z0-9-]+) —/)?.[1];
  const topicId = topicPair ? identity.topicId : (inventoryTopic ?? `${identity.track}/getting-started`);
  const siblings = inventory.filter((line) => !line.startsWith(`- ${topicId} —`));
  const outputPaths = await outputPathsFor(kind, id);
  return {
    ID: identity.runId,
    TOPIC_ID: topicId,
    TRACK: identity.track,
    SLUG: identity.slug,
    EN_PATH: topicPair
      ? await preferredTopicPath(identity.track, identity.slug, 'en', options)
      : `${STAGING_ROOT}/${identity.track}/*.en.md and ${TOPICS_ROOT}/${identity.track}/*.en.mdx`,
    ZH_PATH: topicPair
      ? await preferredTopicPath(identity.track, identity.slug, 'zh', options)
      : `${STAGING_ROOT}/${identity.track}/*.zh.md and ${TOPICS_ROOT}/${identity.track}/*.zh.mdx`,
    SIBLINGS: formatList(siblings),
    INVENTORY: formatList(inventory),
    GLOSSARY_IDS: formatList((await glossaryIds(options)).map((term) => `- ${term}`)),
    TRACK_SECTIONS: formatList(
      track.sections.map((section) => `- ${section.slug} — ${section.name.en} / ${section.name.zh}`),
    ),
    TODAY: options.today ?? new Date().toISOString().slice(0, 10),
    VERIFIED_VERSIONS: VERSIONS.join(', '),
    OUTPUT_PATHS: outputPaths.join(', '),
  };
}

/** Render a selected kind's prompt through P0's strict one-pass renderer. */
export async function renderWriteBrief(
  kind: WriteKind,
  id: string,
  options: WriteBriefOptions = {},
): Promise<string> {
  const template = path.join(options.templatesRoot ?? REPO_ROOT, TEMPLATES[kind]);
  return renderBrief(await readFile(template, 'utf8'), await writeVarsFor(kind, id, options));
}

/** Files a successful run owns; path runs discover checkpoint banks from the authored path. */
export async function outputPathsFor(
  kind: WriteKind,
  id: string,
  options: OutputPathOptions = {},
): Promise<string[]> {
  const identity = identityFor(kind, id);
  if (kind === 'quiz' || kind === 'kata') {
    return [path.join(options.quizzesRoot ?? 'src/content/quizzes', `${identity.topicId}.yaml`)];
  }
  if (kind === 'interview') {
    return [path.join(options.interviewRoot ?? 'src/content/interview', `${identity.track}.yaml`)];
  }
  if (kind === 'cheatsheet') {
    const root = options.cheatsheetsRoot ?? 'src/content/cheatsheets';
    return [path.join(root, `${identity.slug}.en.mdx`), path.join(root, `${identity.slug}.zh.mdx`)];
  }
  const root = options.pathsRoot ?? 'src/content/paths';
  const quizzes = options.quizzesRoot ?? 'src/content/quizzes';
  const pathFile = path.join(root, `${identity.slug}.yaml`);
  const outputs = [pathFile];
  try {
    const data = YAML.parse(
      await readFile(path.isAbsolute(pathFile) ? pathFile : repoPath(pathFile), 'utf8'),
    ) as {
      milestones?: Array<{ checkpoint?: unknown }>;
    };
    for (const milestone of data.milestones ?? []) {
      if (typeof milestone.checkpoint === 'string' && /^[a-z0-9-]+\/[a-z0-9-]+$/.test(milestone.checkpoint)) {
        outputs.push(path.join(quizzes, `${milestone.checkpoint}.yaml`));
      }
    }
  } catch {
    // Before the writer runs there is no path file, so only its known primary output is listed.
  }
  return [...new Set(outputs)];
}

interface Args {
  kind?: WriteKind;
  id: string;
  outputs: boolean;
}

export function parseWriteBriefArgs(argv: string[]): Args {
  const args: Args = { id: '', outputs: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--outputs') args.outputs = true;
    else if (arg === '--kind') {
      const value = argv[++index];
      if (!WRITE_KINDS.includes(value as WriteKind)) throw new Error(`unknown write kind: ${value ?? ''}`);
      args.kind = value as WriteKind;
    } else if (arg === '--id') {
      args.id = argv[++index] ?? '';
    } else throw new Error(`unknown argument: ${arg}`);
  }
  if (!args.kind || !args.id) {
    throw new Error('usage: write-brief --kind quiz|kata|interview|path|cheatsheet --id <id> [--outputs]');
  }
  return args;
}

async function main(): Promise<void> {
  const args = parseWriteBriefArgs(process.argv.slice(2));
  if (args.outputs) {
    process.stdout.write(`${(await outputPathsFor(args.kind!, args.id)).join('\n')}\n`);
  } else {
    process.stdout.write(await renderWriteBrief(args.kind!, args.id));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
