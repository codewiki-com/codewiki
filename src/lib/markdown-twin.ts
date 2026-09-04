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

/** Everything that is not a code fence. */
function convertProse(text: string, context: TwinContext, open: string[]): string {
  const { locale, url } = context;
  return (
    convertDepth(
      convertCallouts(convertTldr(text.replace(IMPORT, '')), locale)
        .replace(TERM, '$1')
        .replace(CHECKPOINT, (_, id: string) => `[${t(locale, 'toc.checkpoint')}: ${id}](${url}#checkpoint)`),
      open,
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
  const open: string[] = [];
  const converted = segments(body)
    .map((segment) =>
      segment.fence ? convertFence(segment.value) : convertProse(segment.value, context, open),
    )
    .join('\n')
    .trim();

  return `# ${context.title}\n\nSource: ${context.url}\n\n${converted}\n`;
}
