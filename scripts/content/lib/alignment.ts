/**
 * Structural alignment between the two languages of a topic.
 *
 * codewiki publishes one article per topic in English and Chinese. To check that both
 * translations cover the same material, this module reduces each document to a
 * list of coarse blocks — heading, paragraph, code, list, callout, component, table —
 * and compares the two lists position by position.
 *
 * Prose is never compared: the two sides are written in different languages, so only
 * structure can be checked. Code is compared, but with comments stripped first, since a
 * translated sample keeps its code and translates its comments.
 */
import { createHash } from 'node:crypto';
import { parseFrontmatter, serializeFrontmatter } from './frontmatter';

export type BlockKind =
  'heading' | 'paragraph' | 'code' | 'list' | 'callout' | 'component' | 'table' | 'other';

export interface Block {
  kind: BlockKind;
  /** Heading level, 1..6. Only on `heading` blocks. */
  depth?: number;
  /** sha1 of the code with comments stripped. Only on `code` blocks. */
  codeHash?: string;
  /** Number of top-level items. Only on `list` blocks. */
  itemCount?: number;
  /** 1-based line number of the block's first line, counted from the top of the file. */
  line: number;
}

export interface Mismatch {
  /** Position in the block sequence; one entry per differing position. */
  index: number;
  en?: Block;
  zh?: Block;
  reason: string;
}

export interface AlignResult {
  aligned: boolean;
  mismatches: Mismatch[];
  /** Matching positions over the longer document, in `0..1` (1 = every block matches). */
  similarity: number;
}

const FENCE = /^( {0,3})(`{3,}|~{3,})(.*)$/;
const HEADING = /^ {0,3}(#{1,6})(?:\s+.*)?$/;
const LIST_ITEM = /^ {0,3}(?:[-*+]|\d{1,9}[.)])(?:\s|$)/;
const THEMATIC_BREAK = /^ {0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/;
// A block-level component tag owns its whole line: `<Depth level="deep">`, `<Checkpoint />`
// or `</Depth>`. A line that merely opens with an inline component and continues with prose
// — `<Term id="x">event loop</Term> coordinates …` — is a paragraph, not a component.
// Attributes are matched properly rather than as "anything without angle brackets", so a
// quoted value may contain `<` or `>`: `<Checkpoint label="a > b" />` is still a component.
const ATTRIBUTE = String.raw`\s+[\w:-]+(?:=(?:"[^"]*"|'[^']*'|\{[^}]*\}|[^\s"'>]+))?`;
const COMPONENT_OPEN = new RegExp(String.raw`^<[A-Z][\w.]*(?:${ATTRIBUTE})*\s*(\/?)>$`);
const COMPONENT_CLOSE = /^<\/[A-Za-z][\w.]*\s*>$/;
const MDX_STATEMENT = /^(?:import|export)\s/;
const INDENTED_CODE = /^(?: {4}|\t)/;

interface OpenFence {
  indent: number;
  marker: string;
  length: number;
}

/** Match a fence opener, rejecting backtick fences whose info string contains a backtick. */
function openFence(line: string): { fence: OpenFence; info: string } | null {
  const match = FENCE.exec(line);
  if (!match) return null;
  const marker = match[2][0];
  const info = match[3];
  if (marker === '`' && info.includes('`')) return null;
  return { fence: { indent: match[1].length, marker, length: match[2].length }, info: info.trim() };
}

/** True when `line` closes the currently open fence. */
function closesFence(line: string, fence: OpenFence): boolean {
  const match = FENCE.exec(line);
  if (!match) return false;
  return match[2][0] === fence.marker && match[2].length >= fence.length && match[3].trim() === '';
}

/** Index of the first body line, skipping a leading `---` frontmatter block. */
function bodyStart(lines: string[]): number {
  if (lines[0]?.trim() !== '---') return 0;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') return i + 1;
  }
  return 0;
}

/**
 * Split a document into top-level blocks.
 *
 * Blocks are separated by blank lines, which is how the polished corpus is written; a
 * fenced code block is always one block, blank lines inside it included, and so is a
 * CommonMark indented code block. Frontmatter is skipped, but line numbers still count
 * from the top of the file.
 */
export function blocks(md: string): Block[] {
  const lines = md.split('\n');
  const out: Block[] = [];
  // Depth of the JSX components currently open around this point in the document.
  let openComponents = 0;
  let i = bodyStart(lines);
  while (i < lines.length) {
    if (lines[i].trim() === '') {
      i += 1;
      continue;
    }
    const opened = openFence(lines[i]);
    if (opened) {
      const start = i;
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !closesFence(lines[i], opened.fence)) {
        code.push(lines[i].trimEnd());
        i += 1;
      }
      // Skip the closing fence; an unclosed fence simply ran to the end of the document.
      if (i < lines.length) i += 1;
      const lang = opened.info.split(/\s+/)[0] ?? '';
      out.push({ kind: 'code', codeHash: hashCode(code.join('\n'), lang), line: start + 1 });
      continue;
    }
    if (startsIndentedCode(lines[i], out.at(-1)?.kind, openComponents)) {
      const start = i;
      const code: string[] = [];
      let end = i;
      // Blank lines belong to the chunk only when another indented line follows them,
      // so `end` tracks the last indented line and the trailing blanks are given back.
      for (let j = i; j < lines.length; j += 1) {
        if (lines[j].trim() === '') {
          code.push('');
          continue;
        }
        if (!INDENTED_CODE.test(lines[j])) break;
        code.push(lines[j].replace(INDENTED_CODE, '').trimEnd());
        end = j;
      }
      i = end + 1;
      const chunk = code.slice(0, end - start + 1).join('\n');
      out.push({ kind: 'code', codeHash: hashCode(chunk, ''), line: start + 1 });
      continue;
    }
    const start = i;
    const group: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !openFence(lines[i])) {
      group.push(lines[i]);
      i += 1;
    }
    out.push(classify(group, start + 1));
    openComponents = Math.max(0, openComponents + componentDelta(group));
  }
  return out;
}

/** How many components a block's lines open minus how many they close. */
function componentDelta(group: string[]): number {
  let delta = 0;
  for (const line of group) {
    const tag = line.trim();
    if (COMPONENT_CLOSE.test(tag)) delta -= 1;
    else if (COMPONENT_OPEN.test(tag) && !COMPONENT_OPEN.exec(tag)?.[1]) delta += 1;
  }
  return delta;
}

/**
 * True when an indented chunk at a block boundary is a CommonMark indented code block.
 *
 * Indentation only means "code" at the top level. Directly under a list it is the
 * continuation of an item, and anywhere inside an open JSX component it is ordinary MDX
 * content that happens to be pretty-printed — every `<TLDRCell>` body is indented, and a
 * cell may hold several blank-line-separated paragraphs, so the nesting has to be tracked
 * rather than inferred from the previous block alone. Both would otherwise be hashed as
 * code, and that prose differs between the two languages by design, so the pair could
 * never align.
 */
function startsIndentedCode(line: string, previous: BlockKind | undefined, openComponents: number): boolean {
  if (!INDENTED_CODE.test(line)) return false;
  return previous !== 'list' && openComponents === 0;
}

/** Decide what a group of non-blank, non-fence lines is. */
function classify(group: string[], line: number): Block {
  const first = group[0];
  const heading = HEADING.exec(first);
  if (heading) return { kind: 'heading', depth: heading[1].length, line };
  const trimmed = first.trimStart();
  if (isComponentTag(trimmed)) return { kind: 'component', line };
  if (MDX_STATEMENT.test(trimmed)) return { kind: 'other', line };
  if (THEMATIC_BREAK.test(first)) return { kind: 'other', line };
  if (trimmed.startsWith('>')) {
    // A GitHub-style callout opens with `[!NOTE]`; any other quote is just a quote.
    return { kind: trimmed.replace(/^>\s*/, '').startsWith('[!') ? 'callout' : 'other', line };
  }
  if (trimmed.startsWith('|')) return { kind: 'table', line };
  if (LIST_ITEM.test(first)) return { kind: 'list', itemCount: topLevelItems(group), line };
  return { kind: 'paragraph', line };
}

/** True when the line is a standalone block-level component tag. */
function isComponentTag(line: string): boolean {
  const tag = line.trimEnd();
  return COMPONENT_OPEN.test(tag) || COMPONENT_CLOSE.test(tag);
}

/**
 * Count the items of a list block at its outermost level: markers indented further than
 * the first item belong to a nested list and are part of the item that contains them.
 */
function topLevelItems(group: string[]): number {
  const base = indentOf(group[0]);
  return group.filter((item) => LIST_ITEM.test(item) && indentOf(item) === base).length;
}

/** Number of leading spaces on a line. */
function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

/** Comment syntaxes, keyed by the info-string language as authors write it. */
const LINE_COMMENT: Record<string, string> = {
  python: '#',
  py: '#',
  bash: '#',
  sh: '#',
  shell: '#',
  zsh: '#',
  console: '#',
  yaml: '#',
  yml: '#',
  toml: '#',
  ruby: '#',
  rb: '#',
  r: '#',
  perl: '#',
  js: '//',
  javascript: '//',
  mjs: '//',
  cjs: '//',
  jsx: '//',
  ts: '//',
  typescript: '//',
  tsx: '//',
  go: '//',
  rust: '//',
  rs: '//',
  java: '//',
  c: '//',
  cpp: '//',
  'c++': '//',
  cs: '//',
  csharp: '//',
  swift: '//',
  kt: '//',
  kotlin: '//',
  php: '//',
  scala: '//',
  dart: '//',
  sql: '--',
};

/** Languages that also use C-style block comments, stripped before hashing. */
const BLOCK_COMMENT = new Set(Object.keys(LINE_COMMENT).filter((lang) => LINE_COMMENT[lang] === '//'));

/** Languages whose comments are `<!-- … -->`. */
const MARKUP = new Set(['html', 'xml', 'svg', 'vue', 'svelte']);

/**
 * sha1 of a code sample with its comments removed, so that a translated sample hashes to
 * the same value as its English original.
 *
 * Strings are deliberately not parsed: a `#` or `//` inside a string literal is stripped
 * too. That is a known simplification, and it costs nothing here because both languages
 * of a pair carry the same literals. Lines that end up empty are dropped, which is what
 * makes a differing number of comment lines harmless.
 */
export function hashCode(code: string, lang: string): string {
  const canonical = stripComments(code, lang.toLowerCase())
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line !== '')
    .join('\n');
  return createHash('sha1').update(canonical).digest('hex');
}

/** Remove the comments of `lang`; an unknown language is left untouched. */
function stripComments(code: string, lang: string): string {
  if (MARKUP.has(lang)) return code.replace(/<!--[\s\S]*?-->/g, '');
  const marker = LINE_COMMENT[lang];
  if (!marker) return code;
  const withoutBlocks = BLOCK_COMMENT.has(lang) ? code.replace(/\/\*[\s\S]*?\*\//g, '') : code;
  return withoutBlocks
    .split('\n')
    .map((line) => {
      const at = line.indexOf(marker);
      return at === -1 ? line : line.slice(0, at);
    })
    .join('\n');
}

/**
 * Compare two block sequences position by position.
 *
 * Every differing position is reported, not just the first, so one run tells an author
 * everything that has to change.
 */
export function alignBlocks(en: Block[], zh: Block[]): AlignResult {
  const length = Math.max(en.length, zh.length);
  const mismatches: Mismatch[] = [];
  for (let index = 0; index < length; index += 1) {
    const left = en[index];
    const right = zh[index];
    const reason = compare(left, right);
    if (reason) mismatches.push({ index, en: left, zh: right, reason });
  }
  const matched = length - mismatches.length;
  return {
    aligned: mismatches.length === 0,
    mismatches,
    similarity: length === 0 ? 1 : matched / length,
  };
}

/** Why two blocks at the same position differ, or `null` when they match. */
function compare(en: Block | undefined, zh: Block | undefined): string | null {
  if (!en) return `missing in en (zh has ${describe(zh!)})`;
  if (!zh) return `missing in zh (en has ${describe(en)})`;
  if (en.kind !== zh.kind) return `kind: en=${en.kind} zh=${zh.kind}`;
  const reasons: string[] = [];
  if (en.depth !== zh.depth) reasons.push(`heading depth: en=${en.depth} zh=${zh.depth}`);
  if (en.codeHash !== zh.codeHash) reasons.push('code differs beyond comments');
  if (en.itemCount !== zh.itemCount) {
    reasons.push(`list items: en=${en.itemCount} zh=${zh.itemCount}`);
  }
  return reasons.length === 0 ? null : reasons.join('; ');
}

/** A block in one phrase, for a mismatch message. */
function describe(block: Block): string {
  return `${block.kind} at line ${block.line}`;
}

/** One mismatch per line, ready to print. */
export function formatMismatches(mismatches: Mismatch[]): string[] {
  return mismatches.map((mismatch) => {
    const lines = [
      mismatch.en ? `en:${mismatch.en.line}` : 'en:-',
      mismatch.zh ? `zh:${mismatch.zh.line}` : 'zh:-',
    ].join(' ');
    return `  block ${mismatch.index} (${lines}) ${mismatch.reason}`;
  });
}

const ALIGNED_LINE = /^aligned:\s*(?:true|false)\s*$/;

/**
 * Rewrite the `aligned:` value of a document's frontmatter, touching nothing else.
 *
 * The YAML round-trip is tried first, and only used when re-serialising the unchanged
 * frontmatter reproduces the file byte-for-byte; that proves the write can change no
 * line but this one. Authored frontmatter usually loses its flow sequences and quoting
 * style in that round-trip, so the fallback replaces the single line in place. The key
 * is appended at the end of the frontmatter when the document does not declare it yet.
 */
export function setAligned(text: string, value: boolean): string {
  const lines = text.split('\n');
  if (lines[0]?.trim() !== '---') throw new Error('document has no frontmatter');
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (end === -1) throw new Error('document has unterminated frontmatter');
  return roundTrip(text, value) ?? replaceAlignedLine(lines, end, value);
}

/** The rewritten document, or `null` when a YAML round-trip would not be lossless. */
function roundTrip(text: string, value: boolean): string | null {
  const { data, body } = parseFrontmatter(text);
  if (serializeFrontmatter(data, body) !== text) return null;
  return serializeFrontmatter({ ...data, aligned: value }, body);
}

/** Replace (or append) the `aligned:` line inside the frontmatter ending at `end`. */
function replaceAlignedLine(lines: string[], end: number, value: boolean): string {
  const at = lines.findIndex((line, index) => index < end && ALIGNED_LINE.test(line));
  const replacement = `aligned: ${value}`;
  if (at === -1) lines.splice(end, 0, replacement);
  else lines[at] = replacement;
  return lines.join('\n');
}
