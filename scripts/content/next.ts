/**
 * The next topics the polish runner should pick up, one id per line.
 *
 * `scripts/content/polish.sh` is bash and the selection rule lives in TypeScript
 * ({@link nextTopics} over `content/tiers.yaml` and the pipeline journal), so this thin
 * CLI is the seam between them: it prints ids and nothing else, which is exactly what a
 * shell loop can consume.
 *
 * `tsx scripts/content/next.ts [--n 4] [--tier 1] [--step polished] [--only id …]`
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { loadState, nextTopics, STEPS, type Step, type TierLists } from './lib/state';
import { TIERS_PATH, type TiersFile } from './tiers';

interface Args {
  n: number;
  step: Step;
  tier?: 1 | 2 | 3;
  only: string[];
}

/** Parse `--n`, `--tier`, `--step` and a trailing `--only id …` list. */
export function parseArgs(argv: string[]): Args {
  const args: Args = { n: 4, step: 'polished', only: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = (): string => {
      const next = argv[i + 1];
      if (next === undefined) throw new Error(`${arg} needs a value`);
      i += 1;
      return next;
    };
    if (arg === '--n') {
      args.n = Number(value());
      if (!Number.isInteger(args.n) || args.n < 1) throw new Error('--n takes a positive integer');
    } else if (arg === '--tier') {
      const tier = Number(value());
      if (tier !== 1 && tier !== 2 && tier !== 3) throw new Error('--tier takes 1, 2 or 3');
      args.tier = tier;
    } else if (arg === '--step') {
      const step = value();
      if (!(STEPS as readonly string[]).includes(step)) throw new Error(`unknown step: ${step}`);
      args.step = step as Step;
    } else if (arg === '--only') {
      // Everything up to the next flag is a topic id, so `--only a b c` reads naturally.
      while (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) args.only.push(argv[++i]);
      if (args.only.length === 0) throw new Error('--only needs at least one topic id');
    } else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

/** Read the `tiers` block of the generated tier list; a missing file means no workload. */
export async function loadTiers(file: string = TIERS_PATH): Promise<TierLists> {
  try {
    const parsed = YAML.parse(await readFile(file, 'utf8')) as TiersFile | null;
    return (parsed?.tiers ?? {}) as TierLists;
  } catch {
    return {};
  }
}

/** CLI: print the selected ids, one per line. */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const [tiers, state] = await Promise.all([loadTiers(), loadState()]);
  const ids = nextTopics(tiers, state, args.n, args.step, {
    tier: args.tier,
    only: args.only.length > 0 ? args.only : undefined,
  });
  for (const id of ids) console.log(id);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
