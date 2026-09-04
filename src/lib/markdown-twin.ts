/**
 * The Markdown twin of a topic — spec §6, "Copy as Markdown / llms.txt".
 *
 * A topic is authored as MDX: frontmatter, a handful of components, and fences whose meta drives
 * the code runner. None of that means anything to a reader who pastes the page into an assistant,
 * so this transform reduces it to the Markdown the page would have been if the components had
 * never existed — the same text, the same order, the same code, and nothing to decode.
 *
 * The conversion is deliberately line- and regex-based rather than a second unified pipeline: the
 * twin has to keep the author's Markdown *as written* (a re-serialised mdast would renumber lists,
 * re-wrap prose and reflow tables), and the component grammar the editorial standard allows is
 * small and closed. Anything outside that grammar is unwrapped rather than shown, so no `<Tag>`
 * ever reaches the reader.
 */
import { t } from '@/i18n';
import { parseFenceMeta } from '@/markdown/shiki-meta';
import type { Locale } from '@/lib/urls';

export interface TwinContext {
  /** The reader's locale: it names the callout and checkpoint labels. */
  locale: Locale;
  /** Topic title, rendered as the document's `h1`. */
  title: string;
  /** Canonical URL of the page this twin belongs to. */
  url: string;
}

/* ---- pieces of the MDX shell ------------------------------------------------------------- */

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n?/;
const IMPORT = /^import\s[^\n]*\n?/gm;
const TLDR_BLOCK = /<TLDR>([\s\S]*?)<\/TLDR>/g;
const TLDR_CELL = /<TLDRCell\s+label="([^"]*)"\s*>([\s\S]*?)<\/TLDRCell>/g;
const CALLOUT = /<Callout\s+type="([A-Za-z]+)"\s*>([\s\S]*?)<\/Callout>/g;
/** `> [!PITFALL]`, with or without the body starting on the next line. */
const ALERT = /^> \[!([A-Za-z]+)\][ \t]*(?:\r?\n> ?)?/gm;
const TERM = /<Term\s+id="[^"]*"\s*>([\s\S]*?)<\/Term>/g;
const CHECKPOINT = /<Checkpoint\s+id="([^"]*)"\s*\/>/g;
const DEPTH = /<Depth\s+level="([a-z]+)"\s*>|<\/Depth>/g;
const SHEET = /<Sheet\s+title="([^"]*)"\s*>([\s\S]*?)<\/Sheet>/g;
const ROW = /<Row\s+code="([^"]*)"\s*>([\s\S]*?)<\/Row>/g;
/** A callout or cell label left alone on its line, and the quoted line that should join it. */
const LABEL_LINE = /^(> (?:\*\*[^\n*]+:\*\*|- \*\*[^\n*]+\*\*:))[ \t]*\n(?:>[ \t]*\n)*> (?!```)/gm;

/** The tags of a quoting block, matched one at a time so a block cut in two still converts. */
const SPANNING =
  /<Callout\s+type="([A-Za-z]+)"\s*>|<TLDRCell\s+label="([^"]*)"\s*>|<\/Callout>|<\/TLDRCell>|<\/?TLDR>/g;
/** The safety net: a component the grammar above does not know is unwrapped, never printed. */
const COMPONENT = /<\/?[A-Z][A-Za-z0-9]*(?:\s[^>]*?)?\/?>/g;

/** Callout types the site defines; anything else keeps its own name, capitalised. */
const CALLOUT_TYPES = new Set(['pitfall', 'note', 'tip', 'warning', 'ai']);

/**
 * Which comment syntax a fence's file line uses. Only languages whose comment marker is certain
 * are listed: a fence in any other language simply loses its meta, which is never wrong.
 */
const HASH = new Set(['python', 'py', 'bash', 'sh', 'shell', 'ruby', 'rb', 'yaml', 'toml', 'r']);
const SLASH = new Set([
  'c',
  'cpp',
  'csharp',
  'go',
  'java',
  'javascript',
  'js',
  'jsx',
  'kotlin',
  'php',
  'rust',
  'swift',
  'ts',
  'tsx',
  'typescript',
]);

/** Runs of whitespace, including the line breaks a component body was written across. */
const collapse = (text: string): string => text.replace(/\s+/g, ' ').trim();

/** The handful of entities that are useful inside a quoted MDX attribute. */
const decodeAttribute = (text: string): string =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** Picks a long enough inline-code fence when the snippet itself contains a backtick. */
function inlineCode(code: string): string {
  const ticks = code.includes('`') ? '``' : '`';
  return `${ticks}${decodeAttribute(code)}${ticks}`;
}

/** The label a callout carries in the reader's language. */
function calloutLabel(type: string, locale: Locale): string {
  const key = type.toLowerCase();
  if (CALLOUT_TYPES.has(key)) return t(locale, `callout.${key}` as 'callout.pitfall');
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/* ---- fences ------------------------------------------------------------------------------ */

/** `# file: a.py` — the fence title, kept as a comment the language itself would accept. */
function fileComment(lang: string, title: string): string | undefined {
  if (HASH.has(lang)) return `# file: ${title}`;
  if (SLASH.has(lang)) return `// file: ${title}`;
  return undefined;
}

/**
 * A whole fence, opening line included. The meta (`run`, `title="…"`, `highlight="…"`) drives the
 * codebox on the site and means nothing off it, so only the file name survives — inside the fence,
 * where it reads as part of the example.
 */
function convertFence(block: string): string {
  const lines = block.split('\n');
  const match = /^(`{3,})([A-Za-z0-9_+-]*)[ \t]*(.*)$/.exec(lines[0] ?? '');
  if (!match) return block;

  const [, ticks = '```', lang = '', meta = ''] = match;
  // Mermaid is useful to machine readers in its source form and has no codebox metadata to remove.
  if (lang === 'mermaid') return block;
  const { title } = parseFenceMeta(meta);
  const comment = title ? fileComment(lang, title) : undefined;
  return [`${ticks}${lang}`, ...(comment ? [comment] : []), ...lines.slice(1)].join('\n');
}

/* ---- prose ------------------------------------------------------------------------------- */

/** `<TLDR>` becomes the blockquote list a plain Markdown reader would have written. */
function convertTldr(text: string): string {
  return text.replace(TLDR_BLOCK, (_, inner: string) =>
    [...inner.matchAll(TLDR_CELL)].map((cell) => `> - **${cell[1]}**: ${collapse(cell[2] ?? '')}`).join('\n'),
  );
}

/** `<Sheet>` and `<Row>` become the headings and terse bullets a Markdown reference expects. */
function convertSheets(text: string): string {
  const row = (_match: string, code: string, note: string) => `- ${inlineCode(code)} — ${collapse(note)}`;
  return text
    .replace(SHEET, (_match, title: string, inner: string) => {
      const rows = inner.replace(ROW, row).replace(/^[ \t]+(?=- )/gm, '');
      return `## ${decodeAttribute(title)}\n\n${rows.trim()}`;
    })
    .replace(ROW, row);
}

export interface CheatsheetRow {
  section: string;
  code: string;
  note: string;
}

/** Reads the authored Sheet/Row grammar without compiling MDX, for the static JSON endpoint. */
export function extractCheatsheetRows(mdxSource: string): CheatsheetRow[] {
  const body = mdxSource.replace(FRONTMATTER, '');
  const rows: CheatsheetRow[] = [];
  for (const sheet of body.matchAll(SHEET)) {
    const section = decodeAttribute(sheet[1] ?? '');
    for (const row of (sheet[2] ?? '').matchAll(ROW)) {
      rows.push({
        section,
        code: decodeAttribute(row[1] ?? ''),
        note: collapse(row[2] ?? '').replace(COMPONENT, ''),
      });
    }
  }
  return rows;
}

/** Both callout spellings — the component and the GitHub-style alert — land on one blockquote. */
function convertCallouts(text: string, locale: Locale): string {
  return text
    .replace(
      CALLOUT,
      (_, type: string, inner: string) => `> **${calloutLabel(type, locale)}:** ${collapse(inner)}`,
    )
    .replace(ALERT, (_, type: string) => `> **${calloutLabel(type, locale)}:** `);
}

/**
 * `<Depth level="deep">` becomes a comment pair, so a machine reader can still see the boundary.
 * The open levels are the document's, not this run's: a depth block usually holds a code fence,
 * which splits it across two prose segments.
 */
function convertDepth(text: string, open: string[]): string {
  return text.replace(DEPTH, (_, level?: string) => {
    if (level) {
      open.push(level);
      return `<!-- ${level} -->`;
    }
    return `<!-- /${open.pop() ?? 'depth'} -->`;
  });
}

/**
 * What one segment has to know about the ones before it. Both fields exist because a code fence
 * splits the document into segments in the middle of a block: `depth` is the stack of open
 * `<Depth>` levels, `quoting` says whether a `<Callout>` or a `<TLDRCell>` is still open, in which
 * case the lines that follow — the fence included — belong inside its blockquote.
 */
interface TwinState {
  depth: string[];
  quoting: boolean;
}

/** Every line of a block quoted, so a fence inside a callout stays inside the callout. */
function quoteLines(text: string): string {
  return text
    .split('\n')
    .map((line) => (line ? `> ${line}` : '>'))
    .join('\n');
}

/**
 * The blocks the segment-by-segment regexes above could not close, one tag at a time: the opening
 * tag becomes the label and everything up to the closing tag is quoted. Without this a callout
 * holding a code fence would reach the safety net and lose its label.
 */
function convertSpanning(text: string, state: TwinState, locale: Locale): string {
  return (
    text
      .split('\n')
      .map((line) => {
        const quotedAtStart = state.quoting;
        const converted = line.replace(SPANNING, (match, type?: string, label?: string) => {
          if (type !== undefined) {
            state.quoting = true;
            return `**${calloutLabel(type, locale)}:** `;
          }
          if (label !== undefined) {
            state.quoting = true;
            return `- **${label}**: `;
          }
          // `</Callout>` and `</TLDRCell>` close the quote; the `<TLDR>` wrapper only disappears.
          if (match !== '<TLDR>' && match !== '</TLDR>') state.quoting = false;
          return '';
        });

        if (!quotedAtStart && !state.quoting) return converted;
        const body = converted.trimEnd();
        return body.startsWith('>') ? body : `> ${body}`.trimEnd();
      })
      .join('\n')
      // The label was written on a line of its own; it belongs in front of the first sentence,
      // exactly as in a callout that fits in one segment. A fence keeps its own line.
      .replace(LABEL_LINE, '$1 ')
      // The tags that closed the block left empty quote lines where they stood.
      .replace(/(?:^>[ \t]*\n)+(?!>)/gm, '')
  );
}

/** Everything that is not a code fence. */
function convertProse(text: string, context: TwinContext, state: TwinState): string {
  const { locale, url } = context;
  return (
    convertSpanning(
      convertDepth(
        convertCallouts(convertTldr(convertSheets(text.replace(IMPORT, ''))), locale)
          .replace(TERM, '$1')
          .replace(
            CHECKPOINT,
            (_, id: string) => `[${t(locale, 'toc.checkpoint')}: ${id}](${url}#checkpoint)`,
          ),
        state.depth,
      ),
      state,
      locale,
    )
      .replace(COMPONENT, '')
      // The removals above leave the blank lines their components stood on.
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
  );
}

/* ---- the document ------------------------------------------------------------------------ */

interface Segment {
  /** Fences are copied out verbatim; everything else is converted. */
  fence: boolean;
  value: string;
}

/** Splits the body into fenced and unfenced runs, so no transform can reach into an example. */
function segments(body: string): Segment[] {
  const out: Segment[] = [];
  let buffer: string[] = [];
  let inFence = false;

  const flush = (fence: boolean) => {
    if (buffer.length) out.push({ fence, value: buffer.join('\n') });
    buffer = [];
  };

  for (const line of body.split('\n')) {
    const marker = line.startsWith('```');
    if (marker && !inFence) {
      flush(false);
      inFence = true;
    }
    buffer.push(line);
    if (marker && inFence && buffer.length > 1) {
      flush(true);
      inFence = false;
    }
  }
  flush(inFence);
  return out;
}

/** The MDX source of a topic as the plain Markdown its `.md` twin serves. */
export function toPlainMarkdown(mdxSource: string, context: TwinContext): string {
  const body = mdxSource.replace(FRONTMATTER, '');
  const state: TwinState = { depth: [], quoting: false };
  const converted = segments(body)
    .map((segment) => {
      if (!segment.fence) return convertProse(segment.value, context, state);
      const fence = convertFence(segment.value);
      return state.quoting ? quoteLines(fence) : fence;
    })
    .join('\n')
    .trim();

  return `# ${context.title}\n\nSource: ${context.url}\n\n${converted}\n`;
}
