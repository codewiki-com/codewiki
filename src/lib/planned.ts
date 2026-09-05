/**
 * Titles for topics the curriculum plans but nobody has written yet.
 *
 * `content/tiers.yaml` is the generated launch order. Its entries are ids today, but the
 * generator may carry a title alongside an id, so both shapes are read here. When no title is
 * recorded the slug is de-slugged instead, which is what `PrevNext` used to do unconditionally.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

import type { Locale } from '@/lib/urls';

/** `astro build` and `vitest` both run from the project root; `og.ts` anchors on cwd for the same reason. */
const TIERS_FILE = path.join(process.cwd(), 'content', 'tiers.yaml');

type TierEntry = string | { id?: unknown; title?: unknown };

/** `python/scope-namespaces` → `Scope namespaces`: a name, never a link, never a fabricated title. */
export function deslug(ref: string): string {
  const slug = ref.split('/').pop() ?? ref;
  const words = slug.replace(/-/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : ref;
}

/** Pulls `{ id, title }` pairs out of whichever of the two shapes the tier list uses. */
export function plannedTitlesFrom(source: string): Map<string, Record<Locale, string>> {
  const parsed = parseYaml(source) as { tiers?: Record<string, TierEntry[]> } | null;
  const out = new Map<string, Record<Locale, string>>();
  for (const list of Object.values(parsed?.tiers ?? {})) {
    for (const entry of Array.isArray(list) ? list : []) {
      if (typeof entry === 'string' || !entry || typeof entry !== 'object') continue;
      const id = typeof entry.id === 'string' ? entry.id : undefined;
      const title = entry.title;
      if (!id || !title) continue;
      if (typeof title === 'string') {
        out.set(id, { en: title, zh: title });
        continue;
      }
      const pair = title as { en?: unknown; zh?: unknown };
      if (typeof pair.en === 'string' && typeof pair.zh === 'string') {
        out.set(id, { en: pair.en, zh: pair.zh });
      }
    }
  }
  return out;
}

/** Read once per build; the tier list is one small file and every topic page consults it. */
let titles: Map<string, Record<Locale, string>> | undefined;

/** The planned title for an unwritten topic reference, or its de-slugged text. */
export function plannedTitle(ref: string, locale: Locale): string {
  if (!titles) {
    try {
      titles = plannedTitlesFrom(readFileSync(TIERS_FILE, 'utf8'));
    } catch {
      // The tier list is generated; a checkout without it still renders de-slugged names.
      titles = new Map();
    }
  }
  return titles.get(ref)?.[locale] ?? deslug(ref);
}
