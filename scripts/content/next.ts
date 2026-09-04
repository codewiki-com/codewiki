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
import { REPO_ROOT } from './lib/paths';
import { loadState, nextTopics, STEPS, type Step, type TierLists } from './lib/state';
import { TIERS_PATH, type TiersFile } from './tiers';

/** Exit code for a run that cannot even decide what to work on. */
const EXIT_UNUSABLE_INPUT = 2;

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

/** A path as the repository spells it, so error messages name a file a human can open. */
function displayPath(file: string): string {
  const relative = path.relative(REPO_ROOT, file);
  return relative.startsWith('..') ? file : relative;
}

/**
 * Read the `tiers` block of the generated tier list.
 *
 * Every failure here is loud on purpose. An unreadable or malformed tier list used to
 * yield an empty selection, which the runner reports as "nothing to polish" and exits 0 —
 * a broken pipeline that looks like a finished one.
 */
export async function loadTiers(file: string = TIERS_PATH): Promise<TierLists> {
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch (cause) {
    const missing = (cause as NodeJS.ErrnoException).code === 'ENOENT';
    const what = missing
      ? `${displayPath(file)} not found; run pnpm content:tiers`
      : `could not read ${displayPath(file)}: ${(cause as Error).message}`;
    throw new Error(what, { cause });
  }
  let parsed: TiersFile | null;
  try {
    parsed = YAML.parse(text) as TiersFile | null;
  } catch (cause) {
    throw new Error(`${displayPath(file)} is not valid YAML: ${(cause as Error).message}`, {
      cause,
    });
  }
  if (!parsed?.tiers || typeof parsed.tiers !== 'object') {
    throw new Error(`${displayPath(file)} has no tiers block; run pnpm content:tiers`);
  }
  return parsed.tiers as TierLists;
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
  // Bad arguments and an unusable tier list are the caller's problem, not a crash: print
  // the one line that says what to fix and leave the stack trace out of the runner's log.
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(EXIT_UNUSABLE_INPUT);
  }
}
