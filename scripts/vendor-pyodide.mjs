/**
 * Copies the Pyodide distribution and the esbuild WebAssembly binary out of `node_modules` and
 * into `public/vendor/`, so the runners fetch them from this origin and no reader's code ever
 * reaches a CDN.
 *
 * Both are large (about 13 MB of Pyodide and 14 MB of esbuild), which is why `public/vendor/` is
 * git-ignored and this script runs as `prebuild` instead: the files are rebuilt from the lockfile
 * on every machine and in CI, and never enter the repository.
 *
 * Run it by hand before `pnpm dev` — only `pnpm build` triggers it automatically.
 *
 * Usage: `node scripts/vendor-pyodide.mjs`
 */
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const modules = join(root, 'node_modules');
const vendor = join(root, 'public', 'vendor');

/**
 * The Pyodide runtime files. `pyodide.js` is the classic script the Python runner injects and
 * `pyodide.mjs` its ESM twin; the rest are loaded by the runtime itself, relative to `indexURL`.
 *
 * The file names moved between Pyodide majors — this release ships `pyodide.asm.mjs` where older
 * ones shipped `pyodide.asm.js` — so the list is matched against what the installed package
 * actually contains and a missing *optional* entry is skipped rather than failing the build.
 */
const PYODIDE_FILES = [
  { name: 'pyodide.js', required: true },
  { name: 'pyodide.mjs', required: false },
  { name: 'pyodide.asm.js', required: false },
  { name: 'pyodide.asm.mjs', required: false },
  { name: 'pyodide.asm.wasm', required: true },
  { name: 'python_stdlib.zip', required: true },
  { name: 'pyodide-lock.json', required: true },
];

/** SHA-256 of a file, or `null` when it does not exist. Identical files are not recopied. */
async function digest(path) {
  try {
    return createHash('sha256')
      .update(await readFile(path))
      .digest('hex');
  } catch {
    return null;
  }
}

/** Copies `from` to `to` unless the two are already byte-identical. Returns the size in bytes. */
async function sync(from, to) {
  const { size } = await stat(from);
  const [source, target] = await Promise.all([digest(from), digest(to)]);

  if (source !== null && source === target) {
    console.log(`  = ${relative(root, to)} (${format(size)}, unchanged)`);
    return { bytes: size, copied: false };
  }

  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to);
  console.log(`  + ${relative(root, to)} (${format(size)})`);
  return { bytes: size, copied: true };
}

function format(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} kB`;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const pyodide = join(modules, 'pyodide');
  const esbuild = join(modules, 'esbuild-wasm', 'esbuild.wasm');

  if (!(await exists(pyodide))) {
    throw new Error('node_modules/pyodide is missing — run `pnpm install` first.');
  }

  console.log('Vendoring browser runtimes into public/vendor/');

  let total = 0;
  let copied = 0;

  for (const { name, required } of PYODIDE_FILES) {
    const from = join(pyodide, name);
    if (!(await exists(from))) {
      if (required) throw new Error(`node_modules/pyodide/${name} is missing — is the pinned version right?`);
      continue;
    }
    const result = await sync(from, join(vendor, 'pyodide', name));
    total += result.bytes;
    copied += result.copied ? 1 : 0;
  }

  if (!(await exists(esbuild))) {
    throw new Error('node_modules/esbuild-wasm/esbuild.wasm is missing — run `pnpm install` first.');
  }
  const wasm = await sync(esbuild, join(vendor, 'esbuild.wasm'));
  total += wasm.bytes;
  copied += wasm.copied ? 1 : 0;

  console.log(`Vendored ${format(total)} in total (${copied} file(s) written).`);
}

await main();
