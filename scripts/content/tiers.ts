/**
 * Tiering of the staged corpus: which topics the polish pass works on, and in what order.
 *
 * Tier 1 is the launch set — the entry points a reader actually lands on: the first two
 * sections of every language track, the first section of every domain track, and both
 * pillars in full. Whatever is left is split by difficulty, so the shallow end of a track
 * (tier 2) is polished before its deep end (tier 3). A topic the importer could not file
 * under a real section is tier 3 and is also listed under `unknownSection`, because that is
 * a mapping defect the polish pass should not silently inherit.
 *
 * The rules are deliberately coarse; `content/tier-overrides.yaml` is where a hand-made
 * decision about one topic goes, and it wins over everything above.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { TRACKS as REGISTRY, type Track } from '../../src/data/tracks';
import { parseFrontmatter } from './lib/frontmatter';
import { readMapping } from './lib/mapping';
import { repoPath, STAGING_ROOT } from './lib/paths';

/** Polish priority: 1 is the launch set, 3 is the long tail. */
export type Tier = 1 | 2 | 3;

/** Every tier, in output order; also the key set of `counts` and `tiers`. */
export const TIERS: Tier[] = [1, 2, 3];

/** Repository-relative location of the generated tier list. */
export const TIERS_PATH = repoPath('content/tiers.yaml');

/** Repository-relative location of the hand-maintained pins. */
export const OVERRIDES_PATH = repoPath('content/tier-overrides.yaml');

/** The staged frontmatter fields the tiering reads. */
export interface TierablePair {
  /** `${track}/${slug}`, the id used everywhere downstream. */
  id: string;
  track: string;
  section: string;
  difficulty: string;
}

/** Manual pins, `${track}/${slug}` → tier. */
export type Overrides = Record<string, Tier>;

/** The contents of `content/tiers.yaml`, in file order. */
export interface TiersFile {
  /** The only field that changes between two runs over the same corpus. */
  generatedAt: string;
  counts: Record<string, number>;
  tiers: Record<string, string[]>;
  /** Topics whose section is missing from the track registry; a subset of tier 3. */
  unknownSection: string[];
  /** Old-corpus ids the mapping drops, so the list of what is *not* staged travels along. */
  dropped: string[];
}

/**
 * Where a pair's section sits in its track, or `-1` when the track or the section is
 * unknown — which is what `section: unsorted` amounts to, since no track declares it.
 */
export function sectionIndex(pair: TierablePair, tracks: Track[] = REGISTRY): number {
  const track = tracks.find((candidate) => candidate.slug === pair.track);
  if (!track) return -1;
  return track.sections.findIndex((section) => section.slug === pair.section);
}

/** The tier one pair gets from the rules alone; overrides are applied by {@link buildTiers}. */
export function assignTier(pair: TierablePair, tracks: Track[] = REGISTRY): Tier {
  const track = tracks.find((candidate) => candidate.slug === pair.track);
  const index = sectionIndex(pair, tracks);
  if (!track || index < 0) return 3;
  if (track.kind === 'pillar') return 1;
  if (index < (track.kind === 'language' ? 2 : 1)) return 1;
  return pair.difficulty === 'advanced' ? 3 : 2;
}

export interface BuildOptions {
  overrides?: Overrides;
  /** Old-corpus ids the mapping drops; copied into the file as given, sorted. */
  dropped?: string[];
  tracks?: Track[];
  generatedAt?: string;
}

/**
 * Assign every staged pair a tier and lay the result out for the file: ids sorted by track
 * order, then section order, then slug, so a re-run over an unchanged corpus produces an
 * identical list.
 */
export function buildTiers(pairs: TierablePair[], options: BuildOptions = {}): TiersFile {
  const tracks = options.tracks ?? REGISTRY;
  const overrides = options.overrides ?? {};
  const sorted = [...pairs].sort((a, b) => compare(a, b, tracks));

  const tiers: Record<string, string[]> = { '1': [], '2': [], '3': [] };
  const unknownSection: string[] = [];
  for (const pair of sorted) {
    // The rules run first so the file records a real tier for every pair, then the pin wins.
    const tier = overrides[pair.id] ?? assignTier(pair, tracks);
    tiers[String(tier)].push(pair.id);
    // Unknown sections are a fact about the mapping, so a pin does not take a pair off the list.
    if (sectionIndex(pair, tracks) < 0) unknownSection.push(pair.id);
  }

  return {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    counts: Object.fromEntries(TIERS.map((tier) => [String(tier), tiers[String(tier)].length])),
    tiers,
    unknownSection,
    dropped: [...(options.dropped ?? [])].sort((a, b) => a.localeCompare(b)),
  };
}

/**
 * Order two pairs: by position in the track registry, then by position in the track's
 * section list, then by slug. Unknown tracks and sections sort last within their level and
 * fall back to their slug, so an unmapped pair still lands somewhere deterministic.
 */
function compare(a: TierablePair, b: TierablePair, tracks: Track[]): number {
  const rank = (pair: TierablePair): number => {
    const index = tracks.findIndex((track) => track.slug === pair.track);
    return index < 0 ? tracks.length : index;
  };
  const sectionRank = (pair: TierablePair): number => {
    const index = sectionIndex(pair, tracks);
    return index < 0 ? Number.MAX_SAFE_INTEGER : index;
  };
  return (
    rank(a) - rank(b) ||
    a.track.localeCompare(b.track) ||
    sectionRank(a) - sectionRank(b) ||
    a.section.localeCompare(b.section) ||
    a.id.localeCompare(b.id)
  );
}

/** Read the override map out of `content/tier-overrides.yaml`; an empty file means no pins. */
export function parseOverrides(text: string): Overrides {
  const parsed: unknown = YAML.parse(text) ?? {};
  if (typeof parsed !== 'object' || parsed === null) throw new Error('tier overrides: expected a mapping');
  const raw = (parsed as { overrides?: unknown }).overrides ?? {};
  if (typeof raw !== 'object' || raw === null) throw new Error('tier overrides: `overrides` must be a map');
  const overrides: Overrides = {};
  for (const [id, tier] of Object.entries(raw as Record<string, unknown>)) {
    if (tier !== 1 && tier !== 2 && tier !== 3) {
      throw new Error(`tier overrides: "${id}" is ${JSON.stringify(tier)}; expected 1, 2 or 3`);
    }
    overrides[id] = tier;
  }
  return overrides;
}

/** {@link parseOverrides} over a file; a missing file means no pins. */
export async function readOverrides(file: string = OVERRIDES_PATH): Promise<Overrides> {
  try {
    return parseOverrides(await readFile(file, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw error;
  }
}

/**
 * Every staged pair, read from the English side's frontmatter. The two languages carry the
 * same `track`, `section` and `difficulty`, so one side is enough and the pair is only
 * counted once.
 */
export async function listStagedPairs(root: string = repoPath(STAGING_ROOT)): Promise<TierablePair[]> {
  const pairs: TierablePair[] = [];
  const tracks = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of tracks) {
    const dir = path.join(root, entry.name);
    const files = new Set(await readdir(dir));
    for (const file of [...files].sort()) {
      const match = /^(.+)\.en\.md$/.exec(file);
      if (!match || !files.has(`${match[1]}.zh.md`)) continue;
      const data = parseFrontmatter(await readFile(path.join(dir, file), 'utf8')).data;
      const track = str(data.track) || entry.name;
      pairs.push({
        id: `${track}/${match[1]}`,
        track,
        section: str(data.section),
        difficulty: str(data.difficulty),
      });
    }
  }
  return pairs;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Render the file. `generatedAt` stays the first key so a re-run diffs to a single line. */
export function serializeTiers(file: TiersFile): string {
  return YAML.stringify(file, { lineWidth: 0, singleQuote: true });
}

/** One line for the terminal; the lists themselves live in the file. */
export function summaryLine(file: TiersFile): string {
  const counts = TIERS.map((tier) => `tier${tier}=${file.counts[String(tier)]}`).join(' ');
  return `${counts} unknownSection=${file.unknownSection.length} dropped=${file.dropped.length}`;
}

/** CLI: tier the staged corpus and write `content/tiers.yaml`. */
async function main(): Promise<void> {
  if (process.argv.length > 2) throw new Error('usage: content:tiers (no arguments)');
  const [pairs, overrides, mapping] = await Promise.all([listStagedPairs(), readOverrides(), readMapping()]);
  const file = buildTiers(pairs, { overrides, dropped: Object.keys(mapping.drop) });
  await writeFile(TIERS_PATH, serializeTiers(file));
  console.log(summaryLine(file));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
