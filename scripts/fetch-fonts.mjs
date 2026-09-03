#!/usr/bin/env node
/**
 * Downloads the TTF/OTF font files used at build time by the OG image
 * generator (satori needs real font binaries, not woff2 subsets).
 *
 * Output goes to .cache/fonts/, which is git-ignored: run `pnpm fonts` once
 * per checkout. Files that already exist are left alone, so re-runs are cheap
 * and offline-safe.
 *
 * Nothing in the shipped site depends on these files — the runtime webfonts
 * are the self-hosted woff2 subsets in public/fonts/.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, '.cache', 'fonts');

const PLEX_SANS = 'https://github.com/IBM/plex/raw/master/packages/plex-sans/fonts/complete/ttf/';

/** @type {{ file: string; url: string }[]} */
const FONTS = [
  { file: 'IBMPlexSans-Regular.ttf', url: `${PLEX_SANS}IBMPlexSans-Regular.ttf` },
  { file: 'IBMPlexSans-SemiBold.ttf', url: `${PLEX_SANS}IBMPlexSans-SemiBold.ttf` },
  {
    file: 'NotoSansSC-Regular.otf',
    url: 'https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf',
  },
];

/** @param {string} file */
async function exists(file) {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/** @param {{ file: string; url: string }} font */
async function download({ file, url }) {
  const dest = path.join(OUT_DIR, file);
  if (await exists(dest)) {
    console.log(`skip  ${file} (already present)`);
    return;
  }

  console.log(`fetch ${file} <- ${url}`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Failed to download ${url} — HTTP ${res.status} ${res.statusText}`);
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.byteLength === 0) {
    throw new Error(`Failed to download ${url} — empty response body`);
  }

  await writeFile(dest, bytes);
  console.log(`saved ${file} (${bytes.byteLength.toLocaleString('en-US')} bytes)`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const font of FONTS) {
    await download(font);
  }
  console.log(`\nFonts ready in ${path.relative(ROOT, OUT_DIR)}/`);
}

await main();
