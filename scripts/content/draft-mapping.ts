/**
 * Render the Codex brief that drafts `scripts/content/mapping.json`.
 *
 * The brief is `prompts/draft-mapping.md` with the corpus data filled in: the target
 * taxonomy from `src/data/tracks.ts`, every unmapped `Category::Subcategory` key with
 * its pair count and sample titles, and the article pairs that carry no subcategory at
 * all. The result is written to `prompts/draft-mapping.generated.md`, which is not
 * committed because it is derived from `reports/inventory.json`.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRACKS, type Track } from '../../src/data/tracks';
import type { Inventory, InventoryPair } from './inventory';
import {
  MAPPING_PATH,
  pairSubcategory,
  readMapping,
  unmappedSubcategories,
  type Mapping,
} from './lib/mapping';
import { repoPath } from './lib/paths';

/** Sample titles printed after each subcategory, to show what is filed under it. */
const SAMPLES = 3;

export const TEMPLATE_PATH = repoPath('prompts/draft-mapping.md');
export const BRIEF_PATH = repoPath('prompts/draft-mapping.generated.md');
export const INVENTORY_PATH = repoPath('reports/inventory.json');

/** Fill the template's `{{PLACEHOLDER}}`s from the inventory and the track registry. */
export function renderBrief(
  template: string,
  inventory: Inventory,
  mapping: Mapping,
  tracks: Track[] = TRACKS,
): string {
  const kept = keptPairs(inventory, mapping);
  const missing = unmappedSubcategories({ pairs: kept }, mapping);
  const withoutSubcategory = kept.filter((pair) => !pairSubcategory(pair));
  const values: Record<string, string> = {
    TAXONOMY: tracks.map(taxonomyLine).join('\n'),
    STATS: stats(inventory, kept.length, missing.length, withoutSubcategory.length),
    SUBCATEGORIES: missing.map((entry) => subcategoryLine(entry.key, entry.count, kept)).join('\n'),
    NO_SUBCATEGORY: withoutSubcategory.map((pair) => `- \`${pair.id}\` — ${pair.en.title}`).join('\n'),
    EXISTING_DROP: fence(JSON.stringify({ drop: mapping.drop }, null, 2)),
  };
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (whole, key: string) => values[key] ?? whole);
}

/** The pairs the import will actually carry over: everything not already dropped. */
function keptPairs(inventory: Inventory, mapping: Mapping): InventoryPair[] {
  return inventory.pairs.filter((pair) => mapping.drop[pair.id] === undefined);
}

/** `- \`track\` — section-slug (Name), …` */
function taxonomyLine(track: Track): string {
  const sections = track.sections.map((section) => `${section.slug} (${section.name.en})`).join(', ');
  return `- \`${track.slug}\` — ${sections}`;
}

/** `- \`category::subcategory\` — N pairs — Title; Title; Title` */
function subcategoryLine(key: string, count: number, pairs: InventoryPair[]): string {
  const samples = pairs
    .filter((pair) => `${pair.category}::${pairSubcategory(pair)}` === key)
    .slice(0, SAMPLES)
    .map((pair) => pair.en.title || pair.zh.title)
    .join('; ');
  return `- \`${key}\` — ${count} pair${count === 1 ? '' : 's'} — ${samples}`;
}

function stats(inventory: Inventory, kept: number, keys: number, withoutSubcategory: number): string {
  const categories = Object.keys(inventory.categories).length;
  const dropped = inventory.pairs.length - kept;
  return [
    `- ${kept} article pairs across ${categories} old categories (${dropped} more are already dropped as duplicates, below).`,
    `- ${keys} old \`category::subcategory\` keys still need a destination.`,
    `- ${withoutSubcategory} pairs carry no subcategory on either side.`,
  ].join('\n');
}

function fence(json: string): string {
  return ['```json', json, '```'].join('\n');
}

/** CLI: render the brief from the committed template, inventory and mapping. */
async function main(): Promise<void> {
  const template = await readFile(TEMPLATE_PATH, 'utf8');
  const inventory = await readInventory();
  const mapping = await readMapping(MAPPING_PATH);
  const brief = renderBrief(template, inventory, mapping);
  await writeFile(BRIEF_PATH, brief.endsWith('\n') ? brief : `${brief}\n`);
  const kept = keptPairs(inventory, mapping);
  const missing = unmappedSubcategories({ pairs: kept }, mapping);
  console.log(
    `wrote ${path.relative(repoPath('.'), BRIEF_PATH)} keys=${missing.length} pairs=${kept.length}/${inventory.pairs.length}`,
  );
}

async function readInventory(): Promise<Inventory> {
  try {
    return JSON.parse(await readFile(INVENTORY_PATH, 'utf8')) as Inventory;
  } catch (error) {
    throw new Error(`Cannot read ${INVENTORY_PATH}; run \`pnpm content:inventory\` first`, { cause: error });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
