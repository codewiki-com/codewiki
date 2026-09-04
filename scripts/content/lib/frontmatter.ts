/**
 * Frontmatter parsing and serialization shared by the content pipeline scripts.
 *
 * Parsing goes through `gray-matter` with the `yaml` package as its engine so that
 * scalars follow the YAML 1.2 core schema: dates such as `2026-01-07` stay plain
 * strings instead of becoming `Date` objects, which keeps round-trips lossless.
 */
import matter from 'gray-matter';
import YAML from 'yaml';

export interface ParsedFrontmatter {
  data: Record<string, unknown>;
  body: string;
}

const engines = {
  yaml: {
    parse: (input: string): object => (YAML.parse(input) ?? {}) as object,
    stringify: (input: object): string => YAML.stringify(input, { lineWidth: 0 }),
  },
};

/** Split a markdown document into its frontmatter data and its body. */
export function parseFrontmatter(text: string): ParsedFrontmatter {
  const parsed = matter(text, { engines });
  return { data: (parsed.data ?? {}) as Record<string, unknown>, body: parsed.content };
}

/**
 * Render frontmatter followed by a body. Key order is preserved exactly as given,
 * and `lineWidth: 0` disables YAML line folding so long values stay on one line.
 */
export function serializeFrontmatter(data: Record<string, unknown>, body: string): string {
  const yaml = YAML.stringify(data, { lineWidth: 0 });
  return `---\n${yaml}---\n${body}`;
}
