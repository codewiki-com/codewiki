/**
 * Where the polish pipeline stands, one row per track.
 *
 * `pnpm content:status` answers the only question a long content migration keeps raising:
 * how much is left, and where is it stuck. The workload comes from `content/tiers.yaml`,
 * the progress from the pipeline journal, and the ground truth — what actually shipped —
 * from the frontmatter of `src/content/topics`, because a topic only counts as aligned or
 * reviewed when its own files say so. `--markdown` prints the same table for a PR
 * comment or a status note.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { TRACKS } from '@/data/tracks';
import { listTopics, topicPath } from './align';
import { parseFrontmatter } from './lib/frontmatter';
import { MAX_ATTEMPTS, loadState, stepIndex, type PipelineState } from './lib/state';
import { TIERS_PATH, type TiersFile } from './tiers';

/** Reaching this step means the topic has been through the polish pass. */
const POLISHED_AT = stepIndex('polished');

export interface StatusRow {
  /** Track slug, or `TOTAL` for the summary row. */
  track: string;
  tier1: number;
  tier2: number;
  tier3: number;
  /** Topics the journal has carried to `polished` or beyond. */
  polished: number;
  /** Shipped topics whose frontmatter says the two languages line up. */
  aligned: number;
  /** Shipped topics whose frontmatter says a human has reviewed them. */
  reviewed: number;
  /** Topics the journal has set aside after too many failures. */
  failed: number;
}

/** The columns, in print order; `track` is the row label. */
const COLUMNS = ['tier1', 'tier2', 'tier3', 'polished', 'aligned', 'reviewed', 'failed'] as const;

type Column = (typeof COLUMNS)[number];

/** The track part of a `{track}/{slug}` id. */
function trackOf(id: string): string {
  return id.split('/')[0] ?? '';
}

/** Read the generated tier list; a missing file means no workload is known yet. */
async function loadTiers(file: string = TIERS_PATH): Promise<TiersFile['tiers']> {
  try {
    const parsed = YAML.parse(await readFile(file, 'utf8')) as TiersFile | null;
    return parsed?.tiers ?? {};
  } catch {
    return {};
  }
}

/** What the shipped files themselves claim, counted per track. */
async function shipped(root?: string): Promise<Map<string, { aligned: number; reviewed: number }>> {
  const counts = new Map<string, { aligned: number; reviewed: number }>();
  let ids;
  try {
    ids = await listTopics(root);
  } catch {
    return counts;
  }
  for (const id of ids) {
    // The two languages carry the same values for these fields — `content:check` verifies
    // that — so reading the English side is enough.
    const { data } = parseFrontmatter(await readFile(topicPath(id, 'en'), 'utf8'));
    const entry = counts.get(id.track) ?? { aligned: 0, reviewed: 0 };
    if (data.aligned === true) entry.aligned += 1;
    if (data.status === 'reviewed') entry.reviewed += 1;
    counts.set(id.track, entry);
  }
  return counts;
}

/** One row per track that has either a workload or shipped topics, plus a total. */
export function buildRows(
  tiers: TiersFile['tiers'],
  state: PipelineState,
  files: Map<string, { aligned: number; reviewed: number }>,
): StatusRow[] {
  const rows = new Map<string, StatusRow>();
  const row = (track: string): StatusRow => {
    const existing = rows.get(track);
    if (existing) return existing;
    const created: StatusRow = {
      track,
      tier1: 0,
      tier2: 0,
      tier3: 0,
      polished: 0,
      aligned: 0,
      reviewed: 0,
      failed: 0,
    };
    rows.set(track, created);
    return created;
  };

  for (const tier of ['1', '2', '3'] as const) {
    for (const id of tiers[tier] ?? []) row(trackOf(id))[`tier${tier}` as Column] += 1;
  }
  for (const [id, entry] of Object.entries(state.topics)) {
    const current = row(trackOf(id));
    if (entry.finishedAt && stepIndex(entry.step) >= POLISHED_AT) current.polished += 1;
    if (entry.attempts >= MAX_ATTEMPTS) current.failed += 1;
  }
  for (const [track, counts] of files) {
    const current = row(track);
    current.aligned += counts.aligned;
    current.reviewed += counts.reviewed;
  }

  // Registry order first, so the table reads like the site; anything the registry does not
  // know about follows, sorted, rather than being dropped.
  const registry = TRACKS.map((track) => track.slug);
  const known = registry.filter((slug) => rows.has(slug));
  const extra = [...rows.keys()].filter((slug) => !registry.includes(slug)).sort();
  const ordered = [...known, ...extra].map((slug) => rows.get(slug) as StatusRow);
  const total: StatusRow = {
    track: 'TOTAL',
    tier1: 0,
    tier2: 0,
    tier3: 0,
    polished: 0,
    aligned: 0,
    reviewed: 0,
    failed: 0,
  };
  for (const entry of ordered) for (const column of COLUMNS) total[column] += entry[column];
  return [...ordered, total];
}

/** Collect the status from the real tier list, journal and topic tree. */
export async function buildStatus(): Promise<StatusRow[]> {
  const [tiers, state, files] = await Promise.all([loadTiers(), loadState(), shipped()]);
  return buildRows(tiers, state, files);
}

/** The table as aligned plain text. */
export function formatTable(rows: StatusRow[]): string {
  const header = ['track', ...COLUMNS];
  const body = rows.map((row) => [row.track, ...COLUMNS.map((column) => String(row[column]))]);
  const widths = header.map((label, index) =>
    Math.max(label.length, ...body.map((cells) => cells[index].length)),
  );
  const line = (cells: string[]): string =>
    cells
      .map((cell, index) => (index === 0 ? cell.padEnd(widths[index]) : cell.padStart(widths[index])))
      .join('  ');
  return [line(header), widths.map((width) => '-'.repeat(width)).join('  '), ...body.map(line)].join('\n');
}

/** The same table as Markdown, for a PR comment or a status note. */
export function formatMarkdown(rows: StatusRow[]): string {
  const header = ['track', ...COLUMNS];
  const separator = header.map((_, index) => (index === 0 ? ':---' : '---:'));
  const body = rows.map((row) => [row.track, ...COLUMNS.map((column) => String(row[column]))]);
  return [header, separator, ...body].map((cells) => `| ${cells.join(' | ')} |`).join('\n');
}

/** CLI: print the status table. */
async function main(): Promise<void> {
  const markdown = process.argv.slice(2).includes('--markdown');
  const rows = await buildStatus();
  console.log(markdown ? formatMarkdown(rows) : formatTable(rows));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
