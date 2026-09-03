/**
 * Import of the legacy corpus into the staging area.
 *
 * Every article pair the mapping keeps is rewritten into `content/staging/topics/` with the
 * frontmatter the new site expects: the old free-text taxonomy becomes a `track` and a
 * `section`, the difficulty vocabulary is normalised, the two known corpus defects (titles
 * written in the wrong language, a leftover H1 in the body) are repaired where that is safe,
 * and everything the inventory flagged travels with the file as `issues` so the polish pass
 * can see it. The old values that no longer have a home are kept under `legacy` rather than
 * thrown away, because the import is the only moment they are still available.
 *
 * The body is otherwise untouched: only the first H1 goes. Nothing here writes to the old
 * corpus or to `src/content`; staging is the only output directory.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInventory } from './inventory';
import { parseFrontmatter, serializeFrontmatter, type ParsedFrontmatter } from './lib/frontmatter';
import { cjkRatio, stripH1 } from './lib/markdown';
import {
  isDropped,
  readMapping,
  resolveMapping,
  validateMapping,
  type Mapping,
  type MappablePair,
} from './lib/mapping';
import { OLD_ROOT, repoPath, STAGING_ROOT } from './lib/paths';

/** Prefix that turns a corpus-relative path into an `origin` value, i.e. a path in the old repo. */
export const ORIGIN_ROOT = 'old/src/content/docs';

/** Difficulty used when neither language declares one the new schema accepts. */
export const DEFAULT_DIFFICULTY = 'intermediate';

/** The difficulty vocabulary of `src/schemas/topic.ts`. */
const DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);

/** Old difficulty words that map onto a supported one instead of being defaulted. */
const DIFFICULTY_ALIASES: Record<string, string> = { expert: 'advanced' };

/** The inventory fields the importer reads; `InventoryPair` satisfies it. */
export interface ImportablePair extends MappablePair {
  slug: string;
  en: { path: string; subcategory: string };
  zh: { path: string; subcategory: string };
  divergence: number;
  issues: string[];
}

/** One staged file: where it goes under {@link STAGING_ROOT}, and everything it contains. */
export interface StagedFile {
  /** `${track}/${slug}.${lang}.md`, relative to the staging root. */
  relPath: string;
  text: string;
}

export type ImportResult = { en: StagedFile; zh: StagedFile } | { dropped: string };

/** Narrows an {@link ImportResult} to the dropped case. */
export function isImportDropped(result: ImportResult): result is { dropped: string } {
  return 'dropped' in result;
}

/**
 * Stage one article pair, or report why the mapping drops it.
 *
 * Pure: `files` carries the two old documents, so nothing is read from disk and the same
 * inputs always produce the same two files.
 */
export function importPair(
  pair: ImportablePair,
  mapping: Mapping,
  files: { en: string; zh: string },
): ImportResult {
  const destination = resolveMapping(pair, mapping);
  if (isDropped(destination)) return { dropped: destination.drop };

  const en = parseFrontmatter(files.en);
  const zh = parseFrontmatter(files.zh);
  // Issues start from the inventory's findings and grow as this pass discovers more; both
  // languages of a pair end up carrying the same list, since every issue is a pair-level fact.
  const issues = [...pair.issues];
  const headings = resolveHeadings(en.data, zh.data, issues);
  const difficulty = resolveDifficulty(en.data, zh.data, issues);
  // The two sides often disagree on `order`; the English one wins, and both files record it.
  const order = numberOrNull(en.data.order) ?? numberOrNull(zh.data.order);
  const divergence = Math.round(pair.divergence * 1000) / 1000;

  const stage = (lang: 'en' | 'zh', parsed: ParsedFrontmatter, side: { path: string }): StagedFile => ({
    relPath: `${destination.track}/${pair.slug}.${lang}.md`,
    text: serializeFrontmatter(
      {
        title: headings[lang].title,
        description: headings[lang].description,
        track: destination.track,
        section: destination.section,
        difficulty,
        tags: stringList(parsed.data.tags),
        status: 'imported',
        origin: `${ORIGIN_ROOT}/${side.path}`,
        divergence,
        issues: [...issues],
        legacy: {
          category: text(parsed.data.category),
          subcategory: text(parsed.data.subcategory),
          order,
          lastUpdated: text(parsed.data.lastUpdated) || null,
        },
      },
      stripH1(parsed.body),
    ),
  });

  return { en: stage('en', en, pair.en), zh: stage('zh', zh, pair.zh) };
}

/** The reader-facing strings of one language: what the new frontmatter calls title and description. */
interface Headings {
  title: string;
  description: string;
}

/**
 * The title and description of each side, with the corpus's swapped pairs put right.
 *
 * A fair number of old articles have the English metadata on the Chinese file and vice versa.
 * When both sides are wrong the fix is unambiguous — exchange them, descriptions included.
 * When only one side is wrong there is nothing to exchange it with, so the value stays and the
 * pair is flagged for the polish pass.
 */
function resolveHeadings(
  en: Record<string, unknown>,
  zh: Record<string, unknown>,
  issues: string[],
): { en: Headings; zh: Headings } {
  const enSide = { title: text(en.title), description: text(en.description) };
  const zhSide = { title: text(zh.title), description: text(zh.description) };
  const enWrong = cjkRatio(enSide.title) > 0;
  const zhWrong = cjkRatio(zhSide.title) === 0;
  if (enWrong && zhWrong) return { en: zhSide, zh: enSide };
  if (enWrong || zhWrong) issues.push('title-language');
  return { en: enSide, zh: zhSide };
}

/**
 * The difficulty both staged files share: the English value when the new schema accepts it,
 * otherwise the Chinese one, otherwise {@link DEFAULT_DIFFICULTY} with the pair flagged. The
 * two languages of a topic are one article, so they must not disagree on how hard it is.
 */
function resolveDifficulty(
  en: Record<string, unknown>,
  zh: Record<string, unknown>,
  issues: string[],
): string {
  const resolved = normalizeDifficulty(en.difficulty) ?? normalizeDifficulty(zh.difficulty);
  if (resolved) return resolved;
  issues.push('difficulty-defaulted');
  return DEFAULT_DIFFICULTY;
}

/** One old difficulty word as the new vocabulary spells it, or `null` when it is not one. */
function normalizeDifficulty(value: unknown): string | null {
  const word = text(value).toLowerCase();
  const mapped = DIFFICULTY_ALIASES[word] ?? word;
  return DIFFICULTIES.has(mapped) ? mapped : null;
}

/** Frontmatter scalars are trusted to be strings; anything else becomes `''`. */
function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Frontmatter lists are trusted to hold strings; anything else in them is dropped. */
function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

/**
 * Claim one staging path for one pair, refusing a path a different pair already claimed.
 *
 * Two old articles can share a slug across categories (`data/json` and `python/json`), which is
 * harmless while every category owns its own track, but an override that moves a pair to another
 * track can make two pairs land on the same file. Overwriting one with the other would lose an
 * article silently, so the run stops and the mapping gets fixed instead.
 */
export function claimPath(claimed: Map<string, string>, relPath: string, id: string): void {
  const owner = claimed.get(relPath);
  if (owner !== undefined && owner !== id) {
    throw new Error(`Both "${owner}" and "${id}" map to ${STAGING_ROOT}/${relPath}; fix the mapping`);
  }
  claimed.set(relPath, id);
}

/** What one run of the import did; written to `reports/import.json`. */
export interface ImportReport {
  generatedAt: string;
  /** Staged files written, two per imported pair. */
  written: number;
  dropped: { id: string; reason: string }[];
  /** Imported pairs (not files) per track and section. */
  perTrack: Record<string, Record<string, number>>;
  /** How many imported pairs carry each issue. */
  issues: Record<string, number>;
}

export const REPORT_PATH = repoPath('reports/import.json');

interface Options {
  /** Import only this pair id, e.g. `python/closures`. */
  only: string | null;
  /** Produce the report in memory and write nothing to disk. */
  dryRun: boolean;
}

export function parseArgs(argv: string[]): Options {
  const options: Options = { only: null, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg.startsWith('--only=')) options.only = arg.slice('--only='.length);
    else if (arg === '--only') {
      options.only = argv[i + 1] ?? '';
      i += 1;
    } else
      throw new Error(
        `Unknown argument "${arg}"; usage: content:import [--only python/closures] [--dry-run]`,
      );
  }
  if (options.only === '') throw new Error('--only needs a pair id, e.g. --only python/closures');
  return options;
}

/**
 * Import the corpus under `root` into {@link STAGING_ROOT}, overwriting whatever is already
 * there, and return the report. A dry run does the same work and skips every write.
 */
export async function runImport(
  mapping: Mapping,
  options: Options,
  root: string = OLD_ROOT,
): Promise<ImportReport> {
  const inventory = await buildInventory(root);
  const pairs = options.only ? inventory.pairs.filter((pair) => pair.id === options.only) : inventory.pairs;
  if (options.only && pairs.length === 0) throw new Error(`No article pair "${options.only}" in ${root}`);

  const report: ImportReport = {
    generatedAt: new Date().toISOString(),
    written: 0,
    dropped: [],
    perTrack: {},
    issues: {},
  };

  const claimed = new Map<string, string>();
  for (const pair of pairs) {
    const result = importPair(pair, mapping, {
      en: await readFile(path.join(root, pair.en.path), 'utf8'),
      zh: await readFile(path.join(root, pair.zh.path), 'utf8'),
    });
    if (isImportDropped(result)) {
      report.dropped.push({ id: pair.id, reason: result.dropped });
      continue;
    }
    for (const staged of [result.en, result.zh]) {
      claimPath(claimed, staged.relPath, pair.id);
      if (!options.dryRun) {
        const out = repoPath(STAGING_ROOT, staged.relPath);
        await mkdir(path.dirname(out), { recursive: true });
        await writeFile(out, staged.text);
      }
      report.written += 1;
    }
    // The staged file is the source of truth for the report, so the counts describe what was
    // actually produced rather than what the mapping intended.
    count(report, parseFrontmatter(result.en.text).data);
  }

  report.perTrack = sortSections(report.perTrack);
  report.issues = sortCounts(report.issues);
  return report;
}

/** Add one imported pair to the per-section counts and the issue histogram. */
function count(report: ImportReport, data: Record<string, unknown>): void {
  const track = text(data.track);
  const section = text(data.section);
  const sections = (report.perTrack[track] ??= {});
  sections[section] = (sections[section] ?? 0) + 1;
  for (const issue of stringList(data.issues)) report.issues[issue] = (report.issues[issue] ?? 0) + 1;
}

/** Sort tracks and their sections by name so the report diffs cleanly between runs. */
function sortSections(
  perTrack: Record<string, Record<string, number>>,
): Record<string, Record<string, number>> {
  return Object.fromEntries(
    Object.entries(perTrack)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([track, sections]) => [
        track,
        Object.fromEntries(Object.entries(sections).sort((a, b) => a[0].localeCompare(b[0]))),
      ]),
  );
}

/** Sort by descending count, then by key, matching the inventory report. */
function sortCounts(counts: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

/** One line for the terminal; the full detail lives in the report. */
export function summaryLine(report: ImportReport, dryRun: boolean): string {
  const pairs = report.written / 2;
  const tracks = Object.keys(report.perTrack).length;
  const issues = Object.values(report.issues).reduce((sum, n) => sum + n, 0);
  return `${dryRun ? 'dry-run ' : ''}written=${report.written} files pairs=${pairs} dropped=${report.dropped.length} tracks=${tracks} issues=${issues}`;
}

/** CLI: import the real corpus into staging and write `reports/import.json`. */
async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const mapping = await readMapping();
  validateMapping(mapping);
  const report = await runImport(mapping, options);
  if (!options.dryRun) {
    await mkdir(path.dirname(REPORT_PATH), { recursive: true });
    await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(summaryLine(report, options.dryRun));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
