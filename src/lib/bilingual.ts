import type { BilingualLayout, BilingualMode } from '@/lib/prefs';

export interface BlockPairs {
  pairs: [id: string, html: string][];
  missing: string[];
}

export type BilingualOrder = readonly ['en', 'zh'] | readonly ['zh', 'en'];

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

/** Missing or unequal signatures are never safe to pair positionally. */
export function structuralSignaturesMatch(mine: string | undefined, theirs: string | undefined): boolean {
  return Boolean(mine && theirs && mine === theirs);
}

/** Refuses the entire pairing operation unless both pages advertise the same structure. */
export function pairAlignedBlocks(
  mineIds: string[],
  theirs: Map<string, string>,
  mineSignature: string | undefined,
  theirSignature: string | undefined,
): BlockPairs | null {
  return structuralSignaturesMatch(mineSignature, theirSignature) ? pairBlocks(mineIds, theirs) : null;
}

/** The single absolute language order used by every bilingual renderer. */
export function orderFor(mode: Exclude<BilingualMode, 'off'>): BilingualOrder {
  return mode === 'en-zh' ? ['en', 'zh'] : ['zh', 'en'];
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

/** Only prose-bearing children cross into the existing callout box. */
export function isCalloutTextChild(tag: string, classes: Iterable<string>, text: string): boolean {
  const kind = tag.toLowerCase();
  const names = new Set(classes);
  return (
    text.trim().length > 0 &&
    kind !== 'pre' &&
    kind !== 'figure' &&
    kind !== 'button' &&
    !names.has('codebox') &&
    !names.has('diagram') &&
    !names.has('codeactions') &&
    !names.has('ask-block') &&
    !names.has('sec-ask') &&
    !names.has('out')
  );
}

/** Side-by-side reading is usable only at the deliberately wide desktop breakpoint. */
export function layoutFor(width: number, pref: BilingualLayout): BilingualLayout {
  return width >= 1440 && pref === 'side' ? 'side' : 'paired';
}
