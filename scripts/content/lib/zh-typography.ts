/**
 * Chinese typography linter and fixer for the bilingual corpus.
 *
 * Chinese prose imported from the old site mixes half-width punctuation with Chinese
 * text, pads CJK with spaces against Latin words and uses corner brackets as quotes. The
 * site sets `text-autospace`, so the browser adds the CJK/Latin gap itself and the source
 * carries none. The rules below report and repair all of that, while leaving anything that
 * must stay byte-exact alone: frontmatter, fenced code, inline code spans, URLs, Markdown
 * link targets and HTML/MDX tags are masked out before any rule runs and restored
 * afterwards. Frontmatter values are prose too, so the spacing and corner-quote rules,
 * which cannot break YAML, still reach them.
 *
 * Both entry points are pure and idempotent: `fixZhTypography(fixZhTypography(x))`
 * equals `fixZhTypography(x)`, and after a fix only unfixable findings remain.
 */

export type ZhRule = 'spacing' | 'punct' | 'quotes' | 'ellipsis';

export interface ZhIssue {
  /** 1-based line of the offending character. */
  line: number;
  /** 1-based column of the offending character. */
  col: number;
  rule: ZhRule;
  message: string;
  /** Replacement text for the span the issue covers; absent when no safe fix exists. */
  fix?: string;
}

/** Alias kept so callers can `import type { Issue }` from this module. */
export type Issue = ZhIssue;

interface Finding {
  start: number;
  /** Exclusive; the spacing rule covers the run of spaces it removes. */
  end: number;
  rule: ZhRule;
  message: string;
  fix?: string;
}

/** Placeholder for masked characters: neither CJK nor Latin, so no rule ever fires on it. */
const MASK = '\u0000';
const CJK_RANGE = '\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}';
/** ASCII letters/digits plus Latin-1 and Latin Extended-A letters; full-width forms stay out. */
const LATIN_RANGE = 'A-Za-z0-9\\u00C0-\\u024F';

const CJK_CHAR = new RegExp(`^[${CJK_RANGE}]$`, 'u');
const LATIN_CHAR = new RegExp(`^[${LATIN_RANGE}]$`, 'u');
const ELLIPSIS = new RegExp(`(?<=[${CJK_RANGE}])\\.{3,}`, 'gu');

/** Corner brackets and the curly quotes that replace them in Chinese prose. */
const CORNER_QUOTES: Record<string, string> = { '「': '“', '」': '”', '『': '‘', '』': '’' };
const CORNER_QUOTE = /[「」『』]/g;

const OPEN_FENCE = /^( {0,3})(`{3,}|~{3,})(.*)$/;
const INLINE_CODE = /(`+)[^\n]*?\1/g;
const LINK_TARGET = /\]\([^\n)]*\)/g;
/** A bare URL ends at whitespace, a quote, a tag bracket or the Chinese text that follows it. */
const URL = /https?:\/\/[^\s\u0000"'<>`\p{Script=Han}\u3000-\u303f\uff00-\uffef]+/gu;
const TAG = /<[^\n<>]*>/g;

const FULL_WIDTH: Record<string, string> = {
  ',': '，',
  '.': '。',
  '?': '？',
  '!': '！',
  ':': '：',
  ';': '；',
  '(': '（',
  ')': '）',
};

/** Code point at `index`, joining surrogate pairs in either direction; '' when out of range. */
function charAt(text: string, index: number): string {
  if (index < 0 || index >= text.length) return '';
  const unit = text.charCodeAt(index);
  if (unit >= 0xdc00 && unit <= 0xdfff && index > 0) {
    const lead = text.charCodeAt(index - 1);
    if (lead >= 0xd800 && lead <= 0xdbff) return text.slice(index - 1, index + 1);
  }
  return String.fromCodePoint(text.codePointAt(index) as number);
}

function isCjk(char: string): boolean {
  return char !== '' && CJK_CHAR.test(char);
}

function isLatin(char: string): boolean {
  return char !== '' && LATIN_CHAR.test(char);
}

/** Offset of the first character of every line. */
function lineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) if (text[i] === '\n') starts.push(i + 1);
  return starts;
}

function render(source: string, blocked: Uint8Array): string {
  let out = '';
  for (let i = 0; i < source.length; i += 1) out += blocked[i] ? MASK : source[i];
  return out;
}

function block(blocked: Uint8Array, start: number, end: number): void {
  for (let i = start; i < end && i < blocked.length; i += 1) blocked[i] = 1;
}

/** True when `line` closes a fence opened with `marker` repeated at least `length` times. */
function closesFence(line: string, marker: string, length: number): boolean {
  const match = OPEN_FENCE.exec(line);
  if (!match) return false;
  return match[2][0] === marker && match[2].length >= length && match[3].trim() === '';
}

const LIST_ITEM = /^ *([-*+]|\d+[.)])(\s|$)/;

/**
 * Mask CommonMark indented code blocks: a run of 4-space-indented lines that starts
 * after a blank line. Indented lines inside a list are continuation paragraphs rather
 * than code, so the scan tracks whether the current block belongs to a list. This
 * matters for imported files whose fences nest (a ``` inside a Python string ends the
 * block early), which would otherwise leave real code exposed as prose.
 */
function maskIndentedCode(
  lines: string[],
  first: number,
  inCode: readonly boolean[],
  markCode: (from: number, to: number) => void,
): void {
  let listy = false;
  let blank = true;
  for (let i = first; i < lines.length; i += 1) {
    const line = lines[i];
    if (inCode[i]) {
      blank = true;
      listy = false;
      continue;
    }
    if (line.trim() === '') {
      blank = true;
      continue;
    }
    const indented = /^ {4,}\S/.test(line);
    if (indented && blank && !listy) {
      let end = i;
      for (let j = i + 1; j < lines.length && !inCode[j]; j += 1) {
        if (lines[j].trim() === '') continue;
        if (!/^ {4,}/.test(lines[j])) break;
        end = j;
      }
      markCode(i, end);
      i = end;
      blank = false;
      continue;
    }
    if (LIST_ITEM.test(line)) listy = true;
    else if (!indented) listy = false;
    blank = false;
  }
}

type SpanKind = 'code' | 'link' | 'url' | 'tag';

/** An inline span masked out of the prose, as offsets into the source. */
interface Span {
  start: number;
  /** Exclusive. */
  end: number;
  kind: SpanKind;
}

interface Masked {
  text: string;
  spans: Span[];
}

/**
 * Replace every protected span with placeholders, keeping offsets identical to the
 * source so that findings map straight back onto the original text. With
 * `keepFrontmatter`, frontmatter stays readable for the rules that are safe inside YAML.
 */
function maskProtected(source: string, keepFrontmatter = false): Masked {
  const blocked = new Uint8Array(source.length);
  const lines = source.split('\n');
  const starts = lineStarts(source);
  const blockLines = (from: number, to: number): void =>
    block(blocked, starts[from], starts[to] + lines[to].length);

  let first = 0;
  if (lines[0] === '---') {
    for (let i = 1; i < lines.length; i += 1) {
      if (lines[i] === '---' || lines[i] === '...') {
        if (keepFrontmatter) {
          block(blocked, 0, lines[0].length);
          blockLines(i, i);
        } else {
          blockLines(0, i);
        }
        first = i + 1;
        break;
      }
    }
  }

  const inCode = new Array<boolean>(lines.length).fill(false);
  const markCode = (from: number, to: number): void => {
    blockLines(from, to);
    for (let i = from; i <= to; i += 1) inCode[i] = true;
  };

  let fence: { marker: string; length: number } | null = null;
  let opened = 0;
  for (let i = first; i < lines.length; i += 1) {
    if (fence) {
      if (closesFence(lines[i], fence.marker, fence.length)) {
        markCode(opened, i);
        fence = null;
      } else if (i === lines.length - 1) {
        markCode(opened, i);
      }
      continue;
    }
    const match = OPEN_FENCE.exec(lines[i]);
    if (!match) continue;
    const marker = match[2][0];
    if (marker === '`' && match[3].includes('`')) continue;
    fence = { marker, length: match[2].length };
    opened = i;
    if (i === lines.length - 1) markCode(opened, i);
  }

  maskIndentedCode(lines, first, inCode, markCode);

  let masked = render(source, blocked);
  const spans: Span[] = [];
  const kinds: Array<[RegExp, SpanKind]> = [
    [INLINE_CODE, 'code'],
    [LINK_TARGET, 'link'],
    [URL, 'url'],
    [TAG, 'tag'],
  ];
  for (const [pattern, kind] of kinds) {
    pattern.lastIndex = 0;
    for (const match of masked.matchAll(pattern)) {
      const end = match.index + match[0].length;
      block(blocked, match.index, end);
      spans.push({ start: match.index, end, kind });
    }
    masked = render(source, blocked);
  }
  return { text: masked, spans };
}

type Side = 'cjk' | 'latin' | 'other';

/**
 * What a reader sees next to the space run that ends before `from` (`step` -1) or starts
 * at `from` (`step` 1). Bold markers, link brackets and inline tags are looked through;
 * an inline code span reads as Latin text. A URL reads as neither: GFM only autolinks a
 * bare URL after whitespace, so the space in front of one has to stay.
 */
function sideOf(masked: Masked, from: number, step: -1 | 1): Side {
  const { text, spans } = masked;
  let i = step < 0 ? from - 1 : from;
  while (i >= 0 && i < text.length) {
    const span = spans.find((s) => (step < 0 ? s.end === i + 1 : s.start === i));
    if (span) {
      if (span.kind === 'code') return 'latin';
      if (span.kind === 'url') return 'other';
      // A link target starts at its `]`, so stepping over it lands on the link text.
      i = step < 0 ? span.start - 1 : span.end;
      continue;
    }
    const char = charAt(text, i);
    // `_` stays opaque: `_x_中` no longer closes the emphasis once the space goes.
    if (
      char === '*' ||
      char === '~' ||
      (step > 0 && (char === '[' || (char === '!' && text[i + 1] === '[')))
    ) {
      i += step;
      continue;
    }
    if (isCjk(char)) return 'cjk';
    if (isLatin(char)) return 'latin';
    // Symbols that end a Latin token: `C#`, `C++`, `70%`.
    if (step < 0 && TOKEN_TAIL.test(char)) {
      let j = i - 1;
      while (j >= 0 && TOKEN_TAIL.test(text[j])) j -= 1;
      return isLatin(charAt(text, j)) ? 'latin' : 'other';
    }
    return 'other';
  }
  return 'other';
}

const TOKEN_TAIL = /^[#+%]$/;

/** No space between a CJK character and an adjacent Latin letter, digit or code span. */
function spacingFindings(masked: Masked): Finding[] {
  const out: Finding[] = [];
  const message = 'remove the space between Chinese and Latin text';
  for (const match of masked.text.matchAll(/ +/g)) {
    const end = match.index + match[0].length;
    const sides = [sideOf(masked, match.index, -1), sideOf(masked, end, 1)].sort().join();
    if (sides === 'cjk,latin') out.push({ start: match.index, end, rule: 'spacing', message, fix: '' });
  }
  return out;
}

const STRING_LITERAL = /(["'])((?:(?!\1)[^\n])*)\1/g;

/**
 * Only the Chinese string literals inside masked HTML/MDX tags, such as
 * `<Sheet title="Option 与 Result">`, with everything else masked. The spacing and
 * corner-quote rules run over this view as well, since those strings are prose a reader sees.
 */
function tagStringView(source: string, masked: Masked): Masked {
  const chars = Array.from({ length: source.length }, () => MASK);
  for (const span of masked.spans) {
    if (span.kind !== 'tag') continue;
    const tag = source.slice(span.start, span.end);
    for (const match of tag.matchAll(STRING_LITERAL)) {
      if (![...match[2]].some((char) => isCjk(char))) continue;
      const from = span.start + match.index + 1;
      for (let i = 0; i < match[2].length; i += 1) chars[from + i] = source[from + i];
    }
  }
  return { text: chars.join(''), spans: [] };
}

/** Corner brackets are not Chinese quotation marks here; curly quotes are. */
function cornerQuoteFindings(masked: string): Finding[] {
  CORNER_QUOTE.lastIndex = 0;
  return [...masked.matchAll(CORNER_QUOTE)].map((match) => ({
    start: match.index,
    end: match.index + 1,
    rule: 'quotes' as const,
    message: `use ${CORNER_QUOTES[match[0]]} instead of ${match[0]}`,
    fix: CORNER_QUOTES[match[0]],
  }));
}

/** `...` written after Chinese text is a Chinese ellipsis. */
function ellipsisFindings(masked: string): Finding[] {
  ELLIPSIS.lastIndex = 0;
  return [...masked.matchAll(ELLIPSIS)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
    rule: 'ellipsis' as const,
    message: 'use …… instead of ...',
    fix: '……',
  }));
}

/** Indices of ASCII parentheses that must be converted, paired so both halves match. */
function parenTargets(masked: string): Set<number> {
  const targets = new Set<number>();
  const stack: number[] = [];
  const opensPair = (at: number): boolean => isCjk(charAt(masked, at - 1)) || isCjk(charAt(masked, at + 1));
  const flush = (): void => {
    for (const open of stack) if (opensPair(open)) targets.add(open);
    stack.length = 0;
  };
  for (let i = 0; i < masked.length; i += 1) {
    const char = masked[i];
    if (char === '\n') {
      flush();
      continue;
    }
    if (char === '(') stack.push(i);
    else if (char === ')') {
      const open = stack.pop();
      if (open === undefined) {
        if (isCjk(charAt(masked, i - 1))) targets.add(i);
      } else if (opensPair(open) || isCjk(charAt(masked, i - 1))) {
        targets.add(open);
        targets.add(i);
      }
    }
  }
  flush();
  return targets;
}

/** ASCII punctuation directly after Chinese text takes its full-width form. */
function punctFindings(masked: string): Finding[] {
  const out: Finding[] = [];
  const parens = parenTargets(masked);
  for (let i = 0; i < masked.length; i += 1) {
    const char = masked[i];
    const full = FULL_WIDTH[char];
    if (!full) continue;
    const prev = charAt(masked, i - 1);
    const next = charAt(masked, i + 1);
    if (char === '(' || char === ')') {
      if (!parens.has(i)) continue;
    } else if (!isCjk(prev)) continue;
    // A dot ends a sentence only at a line end or before a non-Latin character, so
    // versions (3.14), file names (main.py) and `...` keep their ASCII dots.
    if (char === '.' && (isLatin(next) || next === '.' || prev === '.')) continue;
    out.push({
      start: i,
      end: i + 1,
      rule: 'punct',
      message: `use ${full} instead of ${char} after Chinese text`,
      fix: full,
    });
  }
  return out;
}

/** Straight quotes wrapping Chinese text become curly quotes; strays are reported only. */
function quoteFindings(masked: string): Finding[] {
  const out: Finding[] = [];
  const kinds: Array<[string, string, string]> = [
    ['"', '“', '”'],
    ["'", '‘', '’'],
  ];
  const paired = new Set<number>();
  for (const [straight, open, close] of kinds) {
    const pattern = new RegExp(`${straight}([^${straight}\\n]*)${straight}`, 'g');
    for (const match of masked.matchAll(pattern)) {
      const at = match.index;
      const end = at + match[0].length - 1;
      paired.add(at);
      paired.add(end);
      // Runs of quotes are string delimiters, not quotation: leave `"""docstring"""`.
      if (charAt(masked, at - 1) === straight || charAt(masked, end + 1) === straight) continue;
      // A single quote only pairs when neither end leans on a word: `don't` is no quote.
      const leans = isLatin(charAt(masked, at - 1)) || isLatin(charAt(masked, end + 1));
      if (straight === "'" && leans) continue;
      if (![...match[1]].some((char) => isCjk(char))) continue;
      const message = `use ${open}${close} around Chinese text`;
      out.push({ start: at, end: at + 1, rule: 'quotes', message, fix: open });
      out.push({ start: end, end: end + 1, rule: 'quotes', message, fix: close });
    }
  }
  for (let i = 0; i < masked.length; i += 1) {
    if (masked[i] !== '"' || paired.has(i)) continue;
    if (!isCjk(charAt(masked, i - 1)) && !isCjk(charAt(masked, i + 1))) continue;
    out.push({
      start: i,
      end: i + 1,
      rule: 'quotes',
      message: 'unpaired straight quote next to Chinese text',
    });
  }
  return out;
}

/** Every finding in document order, with overlapping ones dropped. */
function findings(text: string): Finding[] {
  const masked = maskProtected(text).text;
  const withFrontmatter = maskProtected(text, true);
  const tagStrings = tagStringView(text, withFrontmatter);
  const all = [
    ...spacingFindings(withFrontmatter),
    ...spacingFindings(tagStrings),
    ...cornerQuoteFindings(withFrontmatter.text),
    ...cornerQuoteFindings(tagStrings.text),
    ...punctFindings(masked),
    ...quoteFindings(masked),
    ...ellipsisFindings(masked),
  ].sort((a, b) => a.start - b.start || a.end - b.end);
  const out: Finding[] = [];
  let taken = 0;
  for (const finding of all) {
    if (finding.end > finding.start && finding.start < taken) continue;
    out.push(finding);
    taken = Math.max(taken, finding.end);
  }
  return out;
}

/** Every rule hit in `text`, in document order; fixable ones carry a `fix`. */
export function findZhIssues(text: string): ZhIssue[] {
  const starts = lineStarts(text);
  let line = 0;
  return findings(text).map((finding) => {
    while (line + 1 < starts.length && starts[line + 1] <= finding.start) line += 1;
    const issue: ZhIssue = {
      line: line + 1,
      col: finding.start - starts[line] + 1,
      rule: finding.rule,
      message: finding.message,
    };
    if (finding.fix !== undefined) issue.fix = finding.fix;
    return issue;
  });
}

/** Apply every safe fix; anything without one is left for a human to decide. */
export function fixZhTypography(text: string): string {
  let out = '';
  let cursor = 0;
  for (const finding of findings(text)) {
    if (finding.fix === undefined) continue;
    out += text.slice(cursor, finding.start) + finding.fix;
    cursor = finding.end;
  }
  return out + text.slice(cursor);
}

/** Issue counts per rule, with every rule present so reports keep a stable shape. */
export function zhIssueSummary(issues: readonly ZhIssue[]): Record<ZhRule, number> {
  const summary: Record<ZhRule, number> = { spacing: 0, punct: 0, quotes: 0, ellipsis: 0 };
  for (const issue of issues) summary[issue.rule] += 1;
  return summary;
}

/**
 * Apply only the spacing and corner-quote fixes, the two that cannot change the syntax of
 * YAML or TypeScript that carries Chinese strings.
 */
export function fixZhSpacingAndQuotes(text: string): string {
  const masked = maskProtected(text, true);
  const tagStrings = tagStringView(text, masked);
  const all = [
    ...spacingFindings(masked),
    ...spacingFindings(tagStrings),
    ...cornerQuoteFindings(masked.text),
    ...cornerQuoteFindings(tagStrings.text),
  ].sort((a, b) => a.start - b.start);
  let out = '';
  let cursor = 0;
  for (const finding of all) {
    out += text.slice(cursor, finding.start) + finding.fix;
    cursor = finding.end;
  }
  return out + text.slice(cursor);
}
