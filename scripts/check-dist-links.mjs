/**
 * Dead-link check over the built site.
 *
 * Walks `dist/**\/*.html`, collects every same-origin `href` and `src` plus the URL-valued head
 * metadata (`og:image`, `twitter:image`, canonical and hreflang alternates), and resolves each one
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

// Task 13 removes this final exception when the Playground route lands.
const KNOWN_LATER = [];

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
const HEAD_TAG = /<(meta|link)\b[^>]*>/gi;

const IGNORED_SCHEME = /^(?:mailto:|tel:|data:|javascript:|blob:|#)/i;

function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&#38;/g, '&').trim();
}

/** One named attribute from a tag, independent of attribute order and quote style. */
function attribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`\\s${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, 'i'));
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : undefined;
}

/** Metadata URL values that are not covered by a generic `href` or `src` contract. */
function metadataUrls(html) {
  const values = [];
  for (const match of html.matchAll(HEAD_TAG)) {
    const tag = match[0];
    const kind = match[1]?.toLowerCase();
    if (kind === 'meta') {
      const key = (attribute(tag, 'property') ?? attribute(tag, 'name'))?.toLowerCase();
      if (key === 'og:image' || key === 'twitter:image') {
        const content = attribute(tag, 'content');
        if (content !== undefined) values.push(content);
      }
      continue;
    }

    const rel = attribute(tag, 'rel')?.toLowerCase().split(/\s+/) ?? [];
    const canonical = rel.includes('canonical');
    const hreflangAlternate = rel.includes('alternate') && attribute(tag, 'hreflang') !== undefined;
    if (canonical || hreflangAlternate) {
      const href = attribute(tag, 'href');
      if (href !== undefined) values.push(href);
    }
  }
  return values;
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
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value) && url.origin !== new URL(base).origin) return undefined;
  return url.pathname;
}

/** The file in `dist/` a site-absolute path resolves to, or `undefined` when nothing does. */
function resolveTarget(pathname) {
  const clean = decodeURIComponent(pathname);
  const relative = clean.replace(/^\/+/, '');
  const direct = path.join(DIST, relative);
  // Keep the check inside dist/: a `../` escape is a dead link, not a file to serve.
  if (direct !== DIST && !direct.startsWith(DIST + path.sep)) return undefined;

  // A path that names a file is that file.
  if (path.extname(clean) !== '' && !clean.endsWith('/')) {
    return existsSync(direct) && statSync(direct).isFile() ? direct : undefined;
  }

  /* Everything else is a directory URL, and `trailingSlash: 'always'` serves those at one URL
     only: `/tracks/` is `dist/tracks/index.html` and `/tracks` is a 404, whatever sits on disk.
     So an extensionless path without the slash is a miss even when the directory exists. */
  if (!clean.endsWith('/')) return undefined;

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

  const values = [
    ...[...html.matchAll(ATTR)].map((match) => match[1] ?? match[2] ?? match[3] ?? ''),
    ...metadataUrls(html),
  ];
  for (const raw of values) {
    const pathname = internalPath(raw, pageUrl, base);
    if (!pathname || seen.has(pathname)) continue;
    seen.add(pathname);
    checked += 1;
    if (!resolveTarget(pathname) && !KNOWN_LATER.includes(pathname)) {
      failures.push({ page: `/${page}`, target: pathname });
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`${failure.page} → ${failure.target}`);
  console.error(`\n${failures.length} dead link(s) in ${pages.length} page(s).`);
  process.exit(1);
}

console.log(`check:links — ${checked} internal link(s) across ${pages.length} page(s), all resolve.`);
