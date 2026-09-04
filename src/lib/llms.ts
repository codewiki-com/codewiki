/**
 * The llms.txt family — spec §9. A crawler that reads Markdown rather than HTML gets one index
 * (`/llms.txt`), one index per track (`/llms/{track}.txt`) and the whole corpus in a single file
 * (`/llms-full.txt`). Every link points at a topic's Markdown twin, never at the HTML page.
 *
 * Pure string building, no Astro imports, so the endpoints stay thin and this module is
 * unit-tested directly.
 */

import { SITE } from '@/data/site';
import { TRACKS, type Track } from '@/data/tracks';
import type { Locale } from '@/lib/urls';

/** One topic as an index lists it: enough to write the bullet, and nothing else. */
export interface LlmsTopic {
  track: string;
  slug: string;
  lang: Locale;
  title: string;
  description: string;
}

/** One localized cheatsheet in the site-wide Markdown index. */
export interface LlmsCheatsheet {
  slug: string;
  lang: Locale;
  title: string;
  description: string;
}

/** One article as `/llms-full.txt` carries it. */
export interface LlmsEntry {
  title: string;
  /** Absolute URL of the Markdown twin the body came from. */
  source: string;
  body: string;
}

/** What the site is, in the two sentences a model reads before the links. */
const SUMMARY =
  'A bilingual (English and Chinese) programming reference and course. ' +
  'Every topic below links to its Markdown twin: the same article as plain Markdown, ' +
  'at the page URL with a .md extension instead of a trailing slash.';

/** `3 terms` / `1 term`: the counts in the Optional section read as prose, so they need the `s`. */
function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/** Absolute URL of a topic's Markdown twin. Built by Task 16; linked from here. */
export function mdUrl(track: string, slug: string, lang: Locale): string {
  return `${SITE.url}${lang === 'zh' ? '/zh' : ''}/${track}/${slug}.md`;
}

/** Absolute URL of a cheatsheet's Markdown twin. */
export function cheatsheetMdUrl(slug: string, lang: Locale): string {
  return `${SITE.url}${lang === 'zh' ? '/zh' : ''}/cheatsheets/${slug}.md`;
}

function bullet(topic: LlmsTopic): string {
  return `- [${topic.title}](${mdUrl(topic.track, topic.slug, topic.lang)}): ${topic.description}`;
}

function cheatsheetBullet(sheet: LlmsCheatsheet): string {
  return `- [${sheet.title}](${cheatsheetMdUrl(sheet.slug, sheet.lang)}): ${sheet.description}`;
}

/** The topics of one locale, grouped into `### Track` blocks in registry order. Empty tracks drop out. */
function byTrack(topics: LlmsTopic[], lang: Locale, name: (track: Track) => string): string[] {
  const blocks: string[] = [];
  for (const track of TRACKS) {
    const own = topics.filter((topic) => topic.lang === lang && topic.track === track.slug);
    if (own.length === 0) continue;
    blocks.push(`### ${name(track)}\n\n${own.map(bullet).join('\n')}`);
  }
  return blocks;
}

/** Joins the sections of a document and closes it with exactly one newline. */
function document(sections: string[]): string {
  return `${sections.filter(Boolean).join('\n\n')}\n`;
}

/**
 * `/llms.txt`: the whole site as one Markdown index. English first, the Chinese mirror after it,
 * then the machine-readable extras — the shape llmstxt.org describes, with `## Optional` last so a
 * crawler on a budget can stop before it.
 */
export function buildLlmsIndex(
  topics: LlmsTopic[],
  glossaryCount: number,
  pathsCount: number,
  cheatsheets: LlmsCheatsheet[] = [],
): string {
  const english = byTrack(topics, 'en', (track) => track.name.en);
  const chinese = byTrack(topics, 'zh', (track) => track.name.zh);

  const optional = [
    `- [Glossary](${SITE.url}/api/glossary.json): ${plural(glossaryCount, 'term')}, defined in English and Chinese, as JSON.`,
    `- [Learning paths](${SITE.url}/api/paths.json): ${plural(pathsCount, 'ordered path')}, milestones included, as JSON.`,
    `- [Full text](${SITE.url}/llms-full.txt): every article above concatenated into one file.`,
  ].join('\n');

  return document([
    '# codewiki',
    `> ${SUMMARY}`,
    english.length > 0 ? ['## Tracks', ...english].join('\n\n') : '',
    chinese.length > 0 ? ['## Chinese', ...chinese].join('\n\n') : '',
    cheatsheets.length > 0
      ? ['## Cheatsheets', cheatsheets.map(cheatsheetBullet).join('\n')].join('\n\n')
      : '',
    ['## Optional', optional].join('\n\n'),
  ]);
}

/** `/llms/{track}.txt`: the same index narrowed to one track, both locales. */
export function buildLlmsTrack(track: Track, topics: LlmsTopic[]): string {
  const own = topics.filter((topic) => topic.track === track.slug);
  const english = own.filter((topic) => topic.lang === 'en');
  const chinese = own.filter((topic) => topic.lang === 'zh');

  return document([
    `# codewiki: ${track.name.en}`,
    `> ${track.description.en}. ${SUMMARY}`,
    english.length > 0 ? ['## Topics', english.map(bullet).join('\n')].join('\n\n') : '',
    chinese.length > 0 ? ['## Chinese', chinese.map(bullet).join('\n')].join('\n\n') : '',
  ]);
}

/**
 * `/llms-full.txt`: every article end to end. The bodies are the authored Markdown, so a topic's
 * component tags (`<TLDR>`, `<Callout>`) travel with it; a model reads through them, and the
 * per-page Markdown twin is the place that transforms them away.
 */
export function buildLlmsFull(entries: LlmsEntry[]): string {
  return entries
    .map((entry) => `# ${entry.title}\n\nSource: ${entry.source}\n\n${entry.body.trim()}`)
    .join('\n\n---\n\n');
}
