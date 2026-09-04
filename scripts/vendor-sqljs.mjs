/**
 * Copies the browser sql.js runtime into `public/vendor/sql.js/`. The directory is ignored and is
 * rebuilt from the lockfile before every production build, matching the Pyodide vendor pattern.
 *
 * Usage: `node scripts/vendor-sqljs.mjs`
 */
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = join(root, 'node_modules', 'sql.js', 'dist');
const target = join(root, 'public', 'vendor', 'sql.js');
const files = ['sql-wasm.js', 'sql-wasm.wasm'];

async function digest(path) {
  try {
    return createHash('sha256')
      .update(await readFile(path))
      .digest('hex');
  } catch {
    return null;
  }
}

async function sync(from, to) {
  const { size } = await stat(from);
  const [fromHash, toHash] = await Promise.all([digest(from), digest(to)]);
  if (fromHash === toHash && fromHash !== null) {
    console.log(`  = ${relative(root, to)} (${Math.round(size / 1024)} kB, unchanged)`);
    return;
  }

  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to);
  console.log(`  + ${relative(root, to)} (${Math.round(size / 1024)} kB)`);
}

for (const file of files) await sync(join(source, file), join(target, file));
