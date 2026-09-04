import type { BilingualLayout } from '@/lib/prefs';

export interface BlockPairs {
  pairs: [id: string, html: string][];
  missing: string[];
}

/** Event dispatched after the article's bilingual DOM has changed. */
export const BILINGUAL_EVENT = 'cw:bilingual';

/** Pairs local block ids with alternate-locale HTML without depending on the browser DOM. */
export function pairBlocks(mineIds: string[], theirs: Map<string, string>): BlockPairs {
  const pairs: BlockPairs['pairs'] = [];
  const missing: string[] = [];
  for (const id of mineIds) {
    const html = theirs.get(id);
    if (html === undefined) missing.push(id);
    else pairs.push([id, html]);
  }
  return { pairs, missing };
}

/** Code and headings are shared structural landmarks, never duplicated as translated blocks. */
export function shouldClone(_id: string, tag: string): boolean {
  const kind = tag.toLowerCase();
  return !(
    kind === 'h2' ||
    kind === 'h3' ||
    kind === 'pre' ||
    kind === 'figure.codebox' ||
    kind === 'figure.diagram'
  );
}

/** Side-by-side reading is usable only at the deliberately wide desktop breakpoint. */
export function layoutFor(width: number, pref: BilingualLayout): BilingualLayout {
  return width >= 1440 && pref === 'side' ? 'side' : 'paired';
}
