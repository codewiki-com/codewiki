/**
 * Dead-link check over the built site.
 *
 * Walks `dist/**\/*.html`, collects every same-origin `href` and `src`, and resolves each one
 * against `dist/` the way the deployed site does. `trailingSlash: 'always'` in astro.config.mjs
 * means a directory URL `/x/` is the file `dist/x/index.html`; a path that carries an extension
 * is the file itself.
 *
 * Prints one `page → missing target` line per dead link and exits 1 when there is any, so CI and
 * `pnpm check:links` fail on a link the build cannot serve.
 *
 * Dependency-free on purpose: it runs on the build output, not on the app.
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = path.join(ROOT, 'dist');

/** The canonical origin, read from src/data/site.ts so the two never drift. */
async function siteOrigin() {
  const source = await readFile(path.join(ROOT, 'src/data/site.ts'), 'utf8');
  const match = source.match(/url:\s*'([^']+)'/);
  return match ? match[1].replace(/\/$/, '') : '';
}

/** Every `.html` file under `dir`, as paths relative to `dist/`. */
async function htmlFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await htmlFiles(full)));
    else if (entry.isFile() && entry.name.endsWith('.html')) found.push(path.relative(DIST, full));
  }
  return found.sort();
}

/** `href="…"` and `src="…"` values, quoted or bare. Attribute order and case do not matter. */
const ATTR = /\s(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;

const IGNORED_SCHEME = /^(?:mailto:|tel:|data:|javascript:|blob:|#|\/\/)/i;

function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&#38;/g, '&').trim();
}

/**
 * The site-absolute path a link points at, or `undefined` when the link is not ours to check
 * (another host, a fragment, a non-http scheme).
 */
function internalPath(raw, pageUrl, base) {
  const value = decode(raw);
  if (!value || IGNORED_SCHEME.test(value)) return undefined;

  let url;
  try {
    url = new URL(value, pageUrl);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
  // An absolute URL counts only when it points back at this site; another host is not ours.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && url.origin !== new URL(base).origin) return undefined;
  return url.pathname;
}

/** The file in `dist/` a site-absolute path resolves to, or `undefined` when nothing does. */
function resolveTarget(pathname) {
  const clean = decodeURIComponent(pathname);
  const relative = clean.replace(/^\/+/, '');
  const direct = path.join(DIST, relative);
  // Keep the check inside dist/: a `../` escape is a dead link, not a file to serve.
  if (!direct.startsWith(DIST)) return undefined;

  const hasExtension = path.extname(clean) !== '' && !clean.endsWith('/');
  if (hasExtension) return existsSync(direct) && statSync(direct).isFile() ? direct : undefined;

  const index = path.join(direct, 'index.html');
  return existsSync(index) && statSync(index).isFile() ? index : undefined;
}

const origin = await siteOrigin();
const base = origin || 'https://example.invalid';
const pages = await htmlFiles(DIST);
const failures = [];
let checked = 0;

for (const page of pages) {
  const html = await readFile(path.join(DIST, page), 'utf8');
  // The URL this page is served at, so relative links resolve the way a browser resolves them.
  const pageUrl = new URL(`/${page.replace(/index\.html$/, '')}`, base);
  const seen = new Set();

  for (const match of html.matchAll(ATTR)) {
    const raw = match[1] ?? match[2] ?? match[3] ?? '';
    const pathname = internalPath(raw, pageUrl, base);
    if (!pathname || seen.has(pathname)) continue;
    seen.add(pathname);
    checked += 1;
    if (!resolveTarget(pathname)) failures.push({ page: `/${page}`, target: pathname });
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`${failure.page} → ${failure.target}`);
  console.error(`\n${failures.length} dead link(s) in ${pages.length} page(s).`);
  process.exit(1);
}

console.log(`check:links — ${checked} internal link(s) across ${pages.length} page(s), all resolve.`);
