/**
 * Filesystem locations shared by the content pipeline scripts.
 *
 * The old corpus lives outside this repository and is strictly read-only; the pipeline
 * copies from it and never writes back.
 */
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Absolute path to the repository root (this file lives in `scripts/content/lib/`). */
export const REPO_ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');

/** Repository-relative directory holding staged topics awaiting review. */
export const STAGING_ROOT = 'content/staging/topics';

/** Repository-relative directory holding reviewed topics served by the site. */
export const TOPICS_ROOT = 'src/content/topics';

/** Resolve repository-relative segments against {@link REPO_ROOT}. */
export function repoPath(...segments: string[]): string {
  return path.resolve(REPO_ROOT, ...segments);
}

/**
 * Absolute path to the legacy article corpus. Override with `CODEWIKI_OLD_ROOT`;
 * otherwise the sibling checkout is used, whether the pipeline runs from the main
 * checkout or from a worktree under `.worktrees/`.
 */
export const OLD_ROOT = resolveOldRoot();

function resolveOldRoot(): string {
  const override = process.env.CODEWIKI_OLD_ROOT;
  if (override) return path.resolve(override);
  const candidates = [repoPath('../old/src/content/docs'), repoPath('../../../old/src/content/docs')];
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

export interface OldPair {
  /** Top-level corpus directory, e.g. `python`. */
  category: string;
  /** File stem shared by both languages, e.g. `closures`. */
  slug: string;
  /** Absolute path to the English source. */
  en: string;
  /** Absolute path to the Chinese source. */
  zh: string;
}

/**
 * List every `{slug}.en.md` / `{slug}.zh.md` pair under `root`, sorted by category then
 * slug. Files whose counterpart is missing are skipped: the pipeline only handles pairs.
 */
export async function listOldPairs(root: string = OLD_ROOT): Promise<OldPair[]> {
  const pairs = new Map<string, { category: string; slug: string; en?: string; zh?: string }>();
  for (const file of await walk(root)) {
    const match = /^(.+)\.(en|zh)\.md$/.exec(path.basename(file));
    if (!match) continue;
    const relative = path.relative(root, file);
    const category = relative.split(path.sep)[0];
    const slug = match[1];
    const key = `${path.dirname(relative)}/${slug}`;
    const entry = pairs.get(key) ?? { category, slug };
    entry[match[2] as 'en' | 'zh'] = file;
    pairs.set(key, entry);
  }
  return [...pairs.values()]
    .filter((entry): entry is OldPair => Boolean(entry.en && entry.zh))
    .sort((a, b) => a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug));
}

/** Recursively collect every file below `dir`; a missing directory yields nothing. */
async function walk(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.isFile()) files.push(full);
  }
  return files.sort();
}
