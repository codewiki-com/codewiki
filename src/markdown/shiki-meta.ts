/**
 * Fence meta: the text after the language on a code fence, e.g.
 * ```` ```python run title="make_counter.py" ````.
 *
 * Shiki is the only stage of the pipeline that still sees that string (Astro hands it over as
 * `options.meta.__raw`), so a transformer parses it there and parks the result on the `<pre>` as
 * data attributes. `rehype-codebox` picks them up afterwards and builds the codebox figure.
 */

export interface FenceMeta {
  /** `run` — the fence is executable, so the codebox gets a Run button and an output slot. */
  run: boolean;
  /** `title="…"` — shown in the code header; the language name is used when absent. */
  title?: string;
  /** `highlight="2-3"` — carried through for the P2 line-highlighting transformer. */
  highlight?: string;
}

/** `key`, `key=value` or `key="value with spaces"`, in any order. */
const TOKEN = /([A-Za-z][\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"']+)))?/g;

/** Parses a fence meta string. Unknown keys are ignored so the grammar can grow without breaking. */
export function parseFenceMeta(meta: string): FenceMeta {
  const parsed: FenceMeta = { run: false };
  if (!meta) return parsed;

  for (const match of meta.matchAll(TOKEN)) {
    const key = match[1];
    const value = match[2] ?? match[3] ?? match[4];
    if (key === 'run') parsed.run = value !== 'false';
    else if (key === 'title' && value) parsed.title = value;
    else if (key === 'highlight' && value) parsed.highlight = value;
  }
  return parsed;
}

/**
 * The subset of Shiki's transformer contract this file needs. Typed structurally because `shiki`
 * is a transitive dependency of Astro and is not resolvable from this package under pnpm.
 */
interface ShikiTransformerContext {
  options: { lang?: string; meta?: { __raw?: string } };
}

interface ShikiPreNode {
  properties: Record<string, unknown>;
}

export interface ShikiMetaTransformer {
  name: string;
  pre(this: ShikiTransformerContext, node: ShikiPreNode): void;
}

/**
 * Copies the fence meta onto the `<pre>` Shiki produces. Registered under
 * `markdown.shikiConfig.transformers`, which the MDX integration inherits.
 */
export const shikiMetaTransformer: ShikiMetaTransformer = {
  name: 'codewiki:fence-meta',
  pre(node) {
    const raw = this.options.meta?.__raw;
    const meta = parseFenceMeta(typeof raw === 'string' ? raw : '');
    if (this.options.lang) node.properties['data-lang'] = this.options.lang;
    if (meta.title) node.properties['data-title'] = meta.title;
    if (meta.run) node.properties['data-run'] = 'true';
    if (meta.highlight) node.properties['data-highlight'] = meta.highlight;
  },
};
