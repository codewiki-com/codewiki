#!/usr/bin/env node
/**
 * Downloads the TTF/OTF font files used at build time by the OG image
 * generator (satori needs real font binaries, not woff2 subsets).
 *
 * Output goes to .cache/fonts/, which is git-ignored: run `pnpm fonts` once
 * per checkout. Files that already exist are left alone, so re-runs are cheap
 * and offline-safe. `src/lib/og.ts` imports `fetchFonts()` from here and calls
 * it lazily during the build, so a fresh checkout needs no separate step.
 *
 * Nothing in the shipped site depends on these files — the runtime webfonts
 * are the self-hosted woff2 subsets in public/fonts/.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Default download target. `fetchFonts()` takes an override so tests can point elsewhere. */
export const FONT_CACHE_DIR = path.join(ROOT, '.cache', 'fonts');

// raw.githubusercontent.com rather than github.com/.../raw/: same bytes, one fewer redirect,
// and it is the host that stays reachable from locked-down CI and container networks.
const PLEX = 'https://raw.githubusercontent.com/IBM/plex/master/packages';
const NOTO = 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF';

/**
 * The four faces the OG renderer asks for. `optional` faces degrade to Plex Sans when the
 * download fails, so a blocked network costs polish rather than a broken build.
 *
 * @type {{ file: string; url: string; optional: boolean }[]}
 */
export const FONTS = [
  {
    file: 'IBMPlexSans-Regular.ttf',
    url: `${PLEX}/plex-sans/fonts/complete/ttf/IBMPlexSans-Regular.ttf`,
    optional: false,
  },
  {
    file: 'IBMPlexSans-SemiBold.ttf',
    url: `${PLEX}/plex-sans/fonts/complete/ttf/IBMPlexSans-SemiBold.ttf`,
    optional: false,
  },
  {
    file: 'IBMPlexMono-SemiBold.ttf',
    url: `${PLEX}/plex-mono/fonts/complete/ttf/IBMPlexMono-SemiBold.ttf`,
    optional: true,
  },
  {
    file: 'NotoSansSC-Regular.otf',
    url: `${NOTO}/SimplifiedChinese/NotoSansCJKsc-Regular.otf`,
    optional: true,
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

/**
 * @param {{ file: string; url: string }} font
 * @param {string} outDir
 * @param {boolean} quiet
 */
async function download({ file, url }, outDir, quiet) {
  const dest = path.join(outDir, file);
  if (await exists(dest)) {
    if (!quiet) console.log(`skip  ${file} (already present)`);
    return;
  }

  if (!quiet) console.log(`fetch ${file} <- ${url}`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Failed to download ${url} — HTTP ${res.status} ${res.statusText}`);
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.byteLength === 0) {
    throw new Error(`Failed to download ${url} — empty response body`);
  }

  await writeFile(dest, bytes);
  if (!quiet) console.log(`saved ${file} (${bytes.byteLength.toLocaleString('en-US')} bytes)`);
}

/**
 * Fills `outDir` with every missing font. Required faces throw when they cannot be fetched;
 * optional ones only warn, which is what keeps an offline build alive. `quiet` silences the
 * progress log entirely — warnings and throws still get through — so the build output stays
 * readable when `og.ts` calls this mid-render.
 *
 * @param {string} [outDir]
 * @param {{ quiet?: boolean }} [options]
 */
export async function fetchFonts(outDir = FONT_CACHE_DIR, options = {}) {
  const quiet = options.quiet ?? false;
  await mkdir(outDir, { recursive: true });
  for (const font of FONTS) {
    try {
      await download(font, outDir, quiet);
    } catch (error) {
      if (!font.optional) throw error;
      console.warn(`warn  ${font.file} unavailable — ${error instanceof Error ? error.message : error}`);
    }
  }
  return outDir;
}

// CLI: `pnpm fonts`. Importing this module runs nothing.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await fetchFonts();
  console.log(`\nFonts ready in ${path.relative(ROOT, FONT_CACHE_DIR)}/`);
}
