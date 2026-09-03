/**
 * Markdown helpers shared by the content pipeline scripts.
 *
 * Everything here works on a plain line scanner that tracks fenced-code state, so
 * headings that appear inside code samples are never mistaken for document structure.
 */

export interface Heading {
  depth: number;
  text: string;
}

export interface Fence {
  lang: string;
  meta: string;
  code: string;
  /** 1-based line number of the opening fence. */
  line: number;
}

const OPEN_FENCE = /^( {0,3})(`{3,}|~{3,})(.*)$/;
const ATX_HEADING = /^ {0,3}(#{1,6})(?:\s+(.*?))?\s*$/;

interface OpenFence {
  indent: number;
  marker: string;
  length: number;
}

/** Match a fence opener, rejecting backtick fences whose info string contains a backtick. */
function openFence(line: string): { fence: OpenFence; info: string } | null {
  const match = OPEN_FENCE.exec(line);
  if (!match) return null;
  const marker = match[2][0];
  const info = match[3];
  if (marker === '`' && info.includes('`')) return null;
  return {
    fence: { indent: match[1].length, marker, length: match[2].length },
    info: info.trim(),
  };
}

/** True when `line` closes the currently open fence. */
function closesFence(line: string, fence: OpenFence): boolean {
  const match = OPEN_FENCE.exec(line);
  if (!match) return false;
  return match[2][0] === fence.marker && match[2].length >= fence.length && match[3].trim() === '';
}

/** Strip an ATX heading's optional closing sequence (`## Title ##`). */
function headingText(raw: string | undefined): string {
  return (raw ?? '').replace(/\s+#+\s*$/, '').trim();
}

/** All ATX headings in document order, ignoring anything inside fenced code. */
export function headings(md: string): Heading[] {
  const out: Heading[] = [];
  let fence: OpenFence | null = null;
  for (const line of md.split('\n')) {
    if (fence) {
      if (closesFence(line, fence)) fence = null;
      continue;
    }
    const opened = openFence(line);
    if (opened) {
      fence = opened.fence;
      continue;
    }
    const heading = ATX_HEADING.exec(line);
    if (heading) out.push({ depth: heading[1].length, text: headingText(heading[2]) });
  }
  return out;
}

/** All fenced code blocks in document order. Unclosed fences run to end of document. */
export function fences(md: string): Fence[] {
  const out: Fence[] = [];
  const lines = md.split('\n');
  let fence: OpenFence | null = null;
  let info = '';
  let start = 0;
  let code: string[] = [];
  const flush = (): void => {
    if (!fence) return;
    const space = info.indexOf(' ');
    out.push({
      lang: space === -1 ? info : info.slice(0, space),
      meta: space === -1 ? '' : info.slice(space + 1).trim(),
      code: code.join('\n'),
      line: start,
    });
    fence = null;
    code = [];
  };
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (fence) {
      if (closesFence(line, fence)) flush();
      else code.push(stripIndent(line, fence.indent));
      continue;
    }
    const opened = openFence(line);
    if (opened) {
      fence = opened.fence;
      info = opened.info;
      start = i + 1;
    }
  }
  flush();
  return out;
}

/** Remove up to `width` leading spaces, matching the fence's own indentation. */
function stripIndent(line: string, width: number): string {
  let i = 0;
  while (i < width && line[i] === ' ') i += 1;
  return line.slice(i);
}

/** Drop the first top-level H1 (and the blank lines that follow it). */
export function stripH1(md: string): string {
  const lines = md.split('\n');
  let fence: OpenFence | null = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (fence) {
      if (closesFence(line, fence)) fence = null;
      continue;
    }
    const opened = openFence(line);
    if (opened) {
      fence = opened.fence;
      continue;
    }
    const heading = ATX_HEADING.exec(line);
    if (heading && heading[1].length === 1) {
      let next = i + 1;
      while (next < lines.length && lines[next].trim() === '') next += 1;
      return [...lines.slice(0, i), ...lines.slice(next)].join('\n');
    }
  }
  return md;
}

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const LETTER = /\p{L}/u;

/** Share of CJK characters among all letters (CJK included). Returns 0 for letterless text. */
export function cjkRatio(text: string): number {
  let cjk = 0;
  let letters = 0;
  for (const char of text) {
    if (CJK.test(char)) {
      cjk += 1;
      letters += 1;
    } else if (LETTER.test(char)) {
      letters += 1;
    }
  }
  return letters === 0 ? 0 : cjk / letters;
}

const CJK_GLOBAL = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
const LATIN_WORD = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu;

/**
 * Rough prose length of a markdown document: every CJK character counts as one word,
 * every run of letters/digits counts as one word. Code blocks and inline code are
 * excluded so that samples do not inflate the count.
 */
export function wordCount(md: string): number {
  const prose = stripFences(md)
    .replace(/`[^`]*`/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/[*_>~|]/g, ' ');
  const cjk = prose.match(CJK_GLOBAL)?.length ?? 0;
  const stripped = prose.replace(CJK_GLOBAL, ' ');
  const words = stripped.match(LATIN_WORD)?.length ?? 0;
  return cjk + words;
}

/** Drop every fenced code block, keeping the surrounding prose lines. */
export function stripFences(md: string): string {
  const out: string[] = [];
  let fence: OpenFence | null = null;
  for (const line of md.split('\n')) {
    if (fence) {
      if (closesFence(line, fence)) fence = null;
      continue;
    }
    const opened = openFence(line);
    if (opened) {
      fence = opened.fence;
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}
