/**
 * The Astro integration that writes `dist/sw.js`.
 *
 * A service worker cannot import anything and must be byte-identical between deploys when nothing
 * changed, so it is assembled after the build rather than bundled with the site:
 *
 * 1. `src/sw/classify.js` is inlined (its `export` keywords stripped) so the shipped rules are the
 *    unit-tested ones.
 * 2. `PRECACHE` is filled with the real, content-hashed file names this build produced.
 * 3. `VERSION` becomes a hash of the worker source plus every precached file's contents, which is
 *    what makes a deploy that changed nothing produce no update toast, and a deploy that changed a
 *    stylesheet produce one.
 *
 * `public/sw.js` is deliberately absent: the file exists only for a real build, and a stale copy
 * checked into `public/` would be copied over this one.
 */
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isShellAsset } from '../src/sw/classify.js';

const SW_SOURCE = new URL('../src/sw/sw.js', import.meta.url);
const CLASSIFY_SOURCE = new URL('../src/sw/classify.js', import.meta.url);

/** The offline notices, whose own stylesheets and scripts join the precache. */
const OFFLINE_PAGES = ['/offline/', '/zh/offline/'];

/** Every file under `dir`, as site-absolute URLs. */
async function walk(dir, base = dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(full, base)));
    else if (entry.isFile()) found.push(`/${path.relative(base, full).split(path.sep).join('/')}`);
  }
  return found;
}

/** The hashed scripts a page loads. Stylesheets are already in the shell by rule. */
function scriptsIn(html) {
  return [...html.matchAll(/["'](\/_astro\/[A-Za-z0-9._-]+\.js)["']/g)].map((match) => match[1]);
}

/** The dist path a site-absolute URL maps to under `trailingSlash: 'always'`. */
function fileFor(dist, url) {
  return path.join(dist, url.endsWith('/') ? `${url}index.html` : url);
}

/**
 * The precache list: the shell by rule, plus whatever the two offline notices load, plus the
 * notices themselves. Sorted, so the version hash does not move with directory order.
 */
async function precacheList(dist, files) {
  const urls = new Set(files.filter(isShellAsset));

  for (const page of OFFLINE_PAGES) {
    try {
      const html = await readFile(fileFor(dist, page), 'utf8');
      for (const script of scriptsIn(html)) urls.add(script);
      urls.add(page);
    } catch {
      // No offline page in this build: the worker still caches the shell and falls back to a
      // plain 503 rather than failing to install.
    }
  }

  return [...urls].sort();
}

/** Assembles the worker text for one precache list. Exported for the unit tests. */
export async function buildWorker(dist, urls) {
  const [template, classify] = await Promise.all([
    readFile(SW_SOURCE, 'utf8'),
    readFile(CLASSIFY_SOURCE, 'utf8'),
  ]);

  const digest = createHash('sha256');
  digest.update(template);
  digest.update(classify);
  let bytes = 0;
  for (const url of urls) {
    digest.update(url);
    try {
      const body = await readFile(fileFor(dist, url));
      bytes += body.length;
      digest.update(body);
    } catch {
      digest.update('missing');
    }
  }
  const version = digest.digest('hex').slice(0, 16);

  const body = template
    // The worker is a classic script: the import becomes the inlined module text above it.
    .replace(/^import\s*\{[\s\S]*?\}\s*from\s*'\.\/classify\.js';\n/m, '')
    .replace(/^const VERSION = '[^']*';$/m, `const VERSION = '${version}';`)
    .replace(/^const PRECACHE = \[\];$/m, `const PRECACHE = ${JSON.stringify(urls, null, 2)};`);

  const source = `${classify.replace(/^export /gm, '')}\n${body}`;
  return { source, version, bytes };
}

/** The integration. Added in astro.config.mjs; it does nothing until a build finishes. */
export default function pwa() {
  return {
    name: 'codewiki:pwa',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const urls = await precacheList(dist, await walk(dist));
        const { source, version, bytes } = await buildWorker(dist, urls);
        await writeFile(path.join(dist, 'sw.js'), source);
        logger.info(`sw.js ${version} · precaches ${urls.length} files, ${(bytes / 1024).toFixed(0)} KiB`);
      },
    },
  };
}
