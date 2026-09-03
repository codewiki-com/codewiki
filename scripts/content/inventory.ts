/**
 * Inventory of the legacy article corpus.
 *
 * Reads every `{slug}.en.md` / `{slug}.zh.md` pair, measures each side, scores how far
 * the two sides have diverged, and flags the known corpus problems (titles written in
 * the wrong language, bodies written in the wrong language, missing subcategories,
 * mismatched `order`, inconsistent category casing, leftover H1s). The result is written
 * to `reports/inventory.json`; nothing under the old corpus is ever modified.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './lib/frontmatter';
import { cjkRatio, fences, headings, stripFences, wordCount } from './lib/markdown';
import { divergenceScore } from './lib/divergence';
import { listOldPairs, OLD_ROOT, repoPath } from './lib/paths';

/** Divergence at or above this threshold earns the `divergent` issue. */
export const DIVERGENT_AT = 0.35;

/** A body counts as Chinese when more than this share of its letters are CJK. */
const CJK_BODY_THRESHOLD = 0.3;

export interface FileInfo {
  /** Path relative to the corpus root, e.g. `python/closures.en.md`. */
  path: string;
  title: string;
  /** Free-text subcategory, or `''` when the frontmatter has none. */
  subcategory: string;
  difficulty: string;
  /** Sidebar order, or `null` when absent or not a number. */
  order: number | null;
  /** Body lines, frontmatter excluded and trailing blank lines ignored. */
  lines: number;
  words: number;
  /** Heading texts in document order, code fences excluded. */
  headings: string[];
  fenceCount: number;
  /** English title containing CJK, or Chinese title containing none. */
  titleLangMismatch: boolean;
  /** Body prose written in the other language (measured with fences stripped). */
  bodyLangMismatch: boolean;
  /** The body still carries an H1, which the new topics render from frontmatter. */
  hasH1: boolean;
}

export interface InventoryPair {
  /** `{category}/{slug}`, e.g. `python/closures`. */
  id: string;
  /** Corpus directory, lower case. */
  category: string;
  slug: string;
  en: FileInfo;
  zh: FileInfo;
  /** Structural divergence of the two sides, 0 (same article) to 1. */
  divergence: number;
  issues: string[];
}

export interface InventorySummary {
  pairs: number;
  meanDivergence: number;
  /** Files (both languages) whose title is written in the wrong language. */
  titleLangMismatch: number;
  /** Files (both languages) whose body is written in the wrong language. */
  bodyLangMismatch: number;
  /** Pairs scoring at or above {@link DIVERGENT_AT}. */
  divergent: number;
}

export interface Inventory {
  generatedAt: string;
  pairs: InventoryPair[];
  /** Pair count per category. */
  categories: Record<string, number>;
  /** File count per raw subcategory string. */
  subcategories: Record<string, number>;
  summary: InventorySummary;
}

/** A measured file plus the fields only the issue pass needs. */
interface Measured {
  info: FileInfo;
  headingDepths: number[];
  /** `category` exactly as the frontmatter spells it. */
  rawCategory: string;
}

/** Measure every pair under `root` and flag the issues found. */
export async function buildInventory(root: string = OLD_ROOT): Promise<Inventory> {
  const found = await listOldPairs(root);
  const measured = await Promise.all(
    found.map(async (pair) => ({
      pair,
      en: await measure(root, pair.en, 'en'),
      zh: await measure(root, pair.zh, 'zh'),
    })),
  );

  // Category casing is only judged against the corpus itself: the spelling most files in
  // a directory agree on is treated as canonical, and the stragglers are flagged.
  const canonical = canonicalCategories(measured);

  const pairs: InventoryPair[] = measured.map(({ pair, en, zh }) => {
    const divergence = round(
      divergenceScore(
        { headingDepths: en.headingDepths, words: en.info.words },
        { headingDepths: zh.headingDepths, words: zh.info.words },
      ),
    );
    const expected = canonical.get(pair.category);
    const issues: string[] = [];
    if (en.info.titleLangMismatch) issues.push('title-lang-en');
    if (zh.info.titleLangMismatch) issues.push('title-lang-zh');
    if (en.info.bodyLangMismatch) issues.push('body-lang-en');
    if (zh.info.bodyLangMismatch) issues.push('body-lang-zh');
    if (!en.info.subcategory) issues.push('missing-subcategory-en');
    if (!zh.info.subcategory) issues.push('missing-subcategory-zh');
    if (en.info.order !== zh.info.order) issues.push('order-mismatch');
    if (en.rawCategory !== expected || zh.rawCategory !== expected) issues.push('category-casing');
    if (divergence >= DIVERGENT_AT) issues.push('divergent');
    if (en.info.hasH1 || zh.info.hasH1) issues.push('h1-in-body');
    return {
      id: `${pair.category}/${pair.slug}`,
      category: pair.category,
      slug: pair.slug,
      en: en.info,
      zh: zh.info,
      divergence,
      issues,
    };
  });

  const categories: Record<string, number> = {};
  const subcategories: Record<string, number> = {};
  for (const pair of pairs) {
    categories[pair.category] = (categories[pair.category] ?? 0) + 1;
    for (const info of [pair.en, pair.zh]) {
      if (info.subcategory) subcategories[info.subcategory] = (subcategories[info.subcategory] ?? 0) + 1;
    }
  }

  const total = pairs.reduce((sum, pair) => sum + pair.divergence, 0);
  const sides = pairs.flatMap((pair) => [pair.en, pair.zh]);
  return {
    generatedAt: new Date().toISOString(),
    pairs,
    categories: sortRecord(categories),
    subcategories: sortRecord(subcategories),
    summary: {
      pairs: pairs.length,
      meanDivergence: pairs.length === 0 ? 0 : round(total / pairs.length),
      titleLangMismatch: sides.filter((info) => info.titleLangMismatch).length,
      bodyLangMismatch: sides.filter((info) => info.bodyLangMismatch).length,
      divergent: pairs.filter((pair) => pair.issues.includes('divergent')).length,
    },
  };
}

/** Read one file and derive everything the report and the issue pass need from it. */
async function measure(root: string, file: string, lang: 'en' | 'zh'): Promise<Measured> {
  const { data, body } = parseFrontmatter(await readFile(file, 'utf8'));
  const structure = headings(body);
  const title = text(data.title);
  const bodyCjk = cjkRatio(stripFences(body));
  return {
    info: {
      path: path.relative(root, file).split(path.sep).join('/'),
      title,
      subcategory: text(data.subcategory),
      difficulty: text(data.difficulty),
      order: typeof data.order === 'number' ? data.order : null,
      lines: countLines(body),
      words: wordCount(body),
      headings: structure.map((heading) => heading.text),
      fenceCount: fences(body).length,
      titleLangMismatch: lang === 'en' ? cjkRatio(title) > 0 : cjkRatio(title) === 0,
      bodyLangMismatch: lang === 'en' ? bodyCjk > CJK_BODY_THRESHOLD : bodyCjk < CJK_BODY_THRESHOLD,
      hasH1: structure.some((heading) => heading.depth === 1),
    },
    headingDepths: structure.map((heading) => heading.depth),
    rawCategory: text(data.category),
  };
}

/** The most common `category` spelling per directory; ties go to the first seen. */
function canonicalCategories(measured: { pair: { category: string }; en: Measured; zh: Measured }[]) {
  const counts = new Map<string, Map<string, number>>();
  for (const { pair, en, zh } of measured) {
    const perCategory = counts.get(pair.category) ?? new Map<string, number>();
    for (const raw of [en.rawCategory, zh.rawCategory]) perCategory.set(raw, (perCategory.get(raw) ?? 0) + 1);
    counts.set(pair.category, perCategory);
  }
  const canonical = new Map<string, string>();
  for (const [category, spellings] of counts) {
    let best = '';
    let bestCount = -1;
    for (const [spelling, count] of spellings) {
      if (count > bestCount) {
        best = spelling;
        bestCount = count;
      }
    }
    canonical.set(category, best);
  }
  return canonical;
}

/** Frontmatter scalars are trusted to be strings; anything else becomes `''`. */
function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Body lines, ignoring the trailing newline(s) the file ends with. */
function countLines(body: string): number {
  const trimmed = body.replace(/\n+$/, '');
  return trimmed === '' ? 0 : trimmed.split('\n').length;
}

/** Keep four decimals so the report stays readable and stable across runs. */
function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/** Sort by descending count, then by key, so the report diffs cleanly. */
function sortRecord(record: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(record).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

/** One line for the terminal; the full detail lives in the report. */
function summaryLine(summary: InventorySummary): string {
  return `pairs=${summary.pairs} meanDivergence=${summary.meanDivergence.toFixed(3)} titleLangMismatch=${summary.titleLangMismatch} bodyLangMismatch=${summary.bodyLangMismatch} divergent=${summary.divergent}`;
}

/** CLI: build the inventory over the real corpus and write `reports/inventory.json`. */
async function main(): Promise<void> {
  const inventory = await buildInventory();
  const out = repoPath('reports/inventory.json');
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify(inventory, null, 2)}\n`);
  console.log(summaryLine(inventory.summary));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
