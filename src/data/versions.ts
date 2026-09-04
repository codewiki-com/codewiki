/**
 * The "currently verified against" chips on the home page. Edited by hand whenever the corpus is
 * re-verified against a newer runtime; per-topic versions live in each topic's `verified`
 * frontmatter, so this list is a summary, not the source of truth for any single page.
 */
export const VERSIONS = [
  'Python 3.14',
  'Node 24',
  'TypeScript 6',
  'Go 1.27',
  'Rust 1.98',
  'React 19',
  'Java 25 LTS',
] as const;
