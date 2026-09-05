// Permanent redirects for URLs this site used to publish. Kept dependency-free so
// astro.config.mjs, the `public/_redirects` check and the unit test all read one list.

/**
 * Four topics were published twice under two ids each. The duplicates were deleted and their
 * readers, their inbound links and their search-engine equity are sent to the survivor.
 *
 * Keys and targets are site-absolute, with the trailing slash `trailingSlash: 'always'` requires.
 * Every locale prefix is listed explicitly: a host-level rule file has no notion of our routing.
 */
export const LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  '/python/scope/': '/python/scope-namespaces/',
  '/zh/python/scope/': '/zh/python/scope-namespaces/',
  '/python/fastapi/': '/backend/fastapi/',
  '/zh/python/fastapi/': '/zh/backend/fastapi/',
  '/python/django/': '/backend/django/',
  '/zh/python/django/': '/zh/backend/django/',
};

/** The body of `public/_redirects`: one `from to 301` line per entry, in declaration order. */
export function renderRedirectsFile(): string {
  return `${Object.entries(LEGACY_REDIRECTS)
    .map(([from, to]) => `${from} ${to} 301`)
    .join('\n')}\n`;
}

/** Parses a `_redirects` file back into the same shape, ignoring blanks and `#` comments. */
export function parseRedirectsFile(source: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [from, to, status] = trimmed.split(/\s+/);
    if (!from || !to || status !== '301') throw new Error(`_redirects: unreadable line "${line}"`);
    out[from] = to;
  }
  return out;
}
