/**
 * Rasterises the PWA icon set from `public/favicon.svg`.
 *
 * The favicon is a stroked line mark on `currentColor`, which a rasteriser cannot resolve: it has
 * no document to inherit a colour from, and an installed icon has no page behind it either. So the
 * mark is re-mounted here on an opaque indigo tile (`--acc` from the light palette) in white, at
 * two scales — a small inset for the `any` icons, a large one for `maskable`, whose outer 20% the
 * launcher is free to crop.
 *
 * The four PNGs are committed, not built: `public/` is copied verbatim into `dist`, so generating
 * them at build time would leave `pnpm dev` and the link checker without the files the head links
 * to. Re-run `pnpm icons` after changing the favicon.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = path.join(ROOT, 'public/icons');

/** `--acc` and `--acc-ink` of the light palette, the two colours tokens.css gives this pairing. */
const TILE = '#3451d1';
const MARK = '#ffffff';

/** Every icon this repo ships: file name, pixel size, and how much of the tile the mark covers. */
const ICONS = [
  { file: 'icon-192.png', size: 192, scale: 0.78 },
  { file: 'icon-512.png', size: 512, scale: 0.78 },
  { file: 'maskable-512.png', size: 512, scale: 0.58 },
  // Apple applies its own rounded-corner mask and never composites over a page, so this one is
  // the plain tile at the size iOS asks for.
  { file: 'apple-touch-icon.png', size: 180, scale: 0.78 },
];

/** The drawing instructions inside the favicon, without its own `<svg>` wrapper. */
function markup(favicon) {
  const inner = favicon.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  if (!inner.trim()) throw new Error('public/favicon.svg has no drawable content');
  return inner.trim();
}

/**
 * One icon as SVG. The mark is scaled about the centre of the 24-unit viewBox, and its stroke
 * width is divided by the same factor so every icon draws the same visual weight.
 */
function iconSvg(inner, size, scale) {
  const width = (1.8 / scale).toFixed(3);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">`,
    `<rect width="24" height="24" fill="${TILE}"/>`,
    `<g transform="translate(12 12) scale(${scale}) translate(-12 -12)" fill="none" stroke="${MARK}"`,
    ` stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`,
    '</svg>',
  ].join('');
}

const inner = markup(await readFile(path.join(ROOT, 'public/favicon.svg'), 'utf8'));
await mkdir(OUT, { recursive: true });

for (const { file, size, scale } of ICONS) {
  const svg = iconSvg(inner, size, scale);
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  await writeFile(path.join(OUT, file), png);
  console.log(`${file}  ${size}×${size}  ${png.length} B`);
}
