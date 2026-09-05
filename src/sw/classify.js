/**
 * How the service worker sorts a request — the one piece of `sw.js` with enough branching to be
 * worth testing on its own.
 *
 * The file is plain ES module JavaScript on purpose. `scripts/build-sw.mjs` inlines it into
 * `dist/sw.js` (a worker has no bundler and cannot `import` from the site), while the unit tests
 * import it directly. Keeping one copy means the tested rules are the shipped rules.
 */

/** Paths whose responses the worker must never keep unless the reader asks for them by name. */
export const NEVER_PREFIXES = ['/api/', '/rules/', '/packs/'];

/** The optional in-browser runtimes: tens of megabytes, cached only on an explicit download. */
export const RUNTIME_PREFIXES = ['/vendor/'];

/** Directories copied verbatim into the build whose contents belong in the precache. */
export const SHELL_PREFIXES = ['/fonts/', '/icons/'];

/** Individual shell files, by exact path. */
export const SHELL_FILES = ['/favicon.svg', '/manifest.webmanifest'];

/**
 * Sorts one request.
 *
 * - `never` — someone else's origin, a write, or a path that must stay live (`/api/`, `/rules/`,
 *   `/packs/`). The worker does not call `respondWith` at all, so the browser fetches it itself.
 * - `runtime` — Pyodide, sql.js and esbuild under `/vendor/`. Served from the cache when the
 *   reader has downloaded them, otherwise straight from the network without being stored.
 * - `page` — a navigation. Network first, cache second, `/offline/` last.
 * - `asset` — any other same-origin GET. Stale while revalidate.
 *
 * @param {{ url: string, method?: string, mode?: string, destination?: string }} request
 * @param {string} origin the worker's own origin
 * @returns {'never' | 'runtime' | 'page' | 'asset'}
 */
export function classifyRequest(request, origin) {
  if ((request.method ?? 'GET') !== 'GET') return 'never';

  let url;
  try {
    // `Request.url` is always absolute, so no base is supplied on purpose: anything relative
    // reaching this function is malformed, and malformed is exactly what should not be cached.
    url = new URL(request.url);
  } catch {
    return 'never';
  }
  if (url.origin !== origin) return 'never';

  const path = url.pathname;
  if (RUNTIME_PREFIXES.some((prefix) => path.startsWith(prefix))) return 'runtime';
  if (NEVER_PREFIXES.some((prefix) => path.startsWith(prefix))) return 'never';
  // Firefox reports `mode` for navigations; `destination` is the check that also holds for a
  // prerender or a same-document restore that arrives without the navigate mode.
  if (request.mode === 'navigate' || request.destination === 'document') return 'page';
  return 'asset';
}

/**
 * Whether a navigation's response is worth storing. A URL carrying a query is a one-off — a search,
 * a shared playground snippet, a campaign tag — and storing it fills the page cache with entries
 * nothing will ever ask for again.
 *
 * @param {string} url
 */
export function shouldCachePage(url) {
  try {
    return new URL(url).search === '';
  } catch {
    return false;
  }
}

/**
 * The offline page for a URL, chosen by its locale prefix so a Chinese reader does not land on the
 * English notice.
 *
 * @param {string} pathname
 */
export function offlineFallback(pathname) {
  return pathname === '/zh' || pathname.startsWith('/zh/') ? '/zh/offline/' : '/offline/';
}

/**
 * Whether a built file belongs in the precache: the stylesheets, the fonts, the icons and the
 * manifest — everything a page needs to look like itself before a single script runs. Hashed
 * JavaScript chunks are added by name from the offline page's own markup, not by this rule, since
 * precaching every island on the site would download the whole application to read one notice.
 *
 * @param {string} pathname
 */
export function isShellAsset(pathname) {
  if (SHELL_FILES.includes(pathname)) return true;
  if (SHELL_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return pathname.startsWith('/_astro/') && pathname.endsWith('.css');
}
