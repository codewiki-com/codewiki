/**
 * Build-time Open Graph cards. satori lays the card out as SVG, resvg rasterises it to a
 * 1200×630 PNG, and `src/pages/og/[...path].png.ts` writes one file per page.
 *
 * This module runs in Node during `astro build`, never in the browser, so:
 *  - it reads the topic frontmatter straight off disk instead of `astro:content`, which keeps
 *    `ogPaths()` unit-testable and makes the endpoint's `getStaticPaths` a pure function;
 *  - satori has no CSS cascade, so the light palette is parsed from `tokens.css` once at module
 *    load and passed in as ordinary color values.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { fetchFonts, FONTS } from '../../scripts/fetch-fonts.mjs';
import { SITE } from '@/data/site';
import { TRACKS, getTrack } from '@/data/tracks';
import { t } from '@/i18n';
import { parseTopicId, topicIdFromPath } from '@/lib/content-ids';
import { LOCALES, type Locale } from '@/lib/urls';

const WIDTH = 1200;
const HEIGHT = 630;
/** Left and right gutter. The ruling fixes the left padding at 96px; the right matches it. */
const PAD_X = 96;
const CONTENT_W = WIDTH - PAD_X * 2;

/**
 * `astro build` and `vitest` both run from the project root, and cwd is the only anchor that
 * survives Vite bundling this module into the SSR chunk — `import.meta.url` there points at
 * the throwaway build directory, which would send the font cache somewhere Astro deletes.
 */
const ROOT = process.cwd();
const TOKENS_FILE = path.join(ROOT, 'src', 'styles', 'tokens.css');
const TOPICS_DIR = path.join(ROOT, 'src', 'content', 'topics');
const GLOSSARY_DIR = path.join(ROOT, 'src', 'content', 'glossary');
const QUIZZES_DIR = path.join(ROOT, 'src', 'content', 'quizzes');
const FONT_DIR = path.join(ROOT, '.cache', 'fonts');

const OG_TOKEN_NAMES = ['bg', 'line', 'ink', 'ink2', 'ink3', 'acc', 'acc-soft'] as const;
type OgTokenName = (typeof OG_TOKEN_NAMES)[number];

/** Reads the light theme's declarations from the first `:root` block in `tokens.css`. */
export function parseLightPalette(source: string): Record<OgTokenName, string> {
  const root = source.match(/(?:^|\n)\s*:root\s*\{([\s\S]*?)\}/)?.[1];
  if (!root) throw new Error('[og] tokens.css has no light :root block');

  const declarations = new Map(
    [...root.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)].map((match) => [match[1], match[2]!.trim()]),
  );
  const missing = OG_TOKEN_NAMES.filter((name) => !declarations.has(name));
  if (missing.length > 0)
    throw new Error(`[og] tokens.css is missing: ${missing.map((name) => `--${name}`).join(', ')}`);

  return Object.fromEntries(OG_TOKEN_NAMES.map((name) => [name, declarations.get(name)!])) as Record<
    OgTokenName,
    string
  >;
}

const light = parseLightPalette(readFileSync(TOKENS_FILE, 'utf8'));

/** Light palette sourced from the site's canonical CSS tokens. */
const C = {
  bg: light.bg,
  line: light.line,
  ink: light.ink,
  ink2: light.ink2,
  ink3: light.ink3,
  acc: light.acc,
  accSoft: light['acc-soft'],
} as const;

/** The Nav logo mark, inlined as a data URI because satori draws images, not SVG children. */
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="${C.acc}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="m9 9-3 3 3 3M15 9l3 3-3 3M13 7l-2 10"/></svg>`;
const MARK_URI = `data:image/svg+xml;base64,${Buffer.from(MARK).toString('base64')}`;

/* ------------------------------------------------------------------ paths */

export interface OgCard {
  /** Card headline. */
  title: string;
  /** One supporting line under the headline, clamped to two lines. */
  subtitle: string;
  /** Label beside the glyph tag: the track name on topics, the category on hubs. */
  track?: string;
  /** Short mono badge, e.g. `py`. */
  glyph?: string;
  /**
   * Which language the strings are in. It does not switch the font stack — both faces are
   * registered as `Plex, Noto` and satori picks the face per glyph — but it is what the copy
   * was keyed off, so it travels with the card.
   */
  locale: Locale;
}

/** A card plus the `/og/{path}.png` route it is written to. */
export interface OgEntry extends OgCard {
  /** Route path without the `/og/` prefix or the `.png` suffix, e.g. `zh/python/closures`. */
  path: string;
}

type TopicRow = { track: string; slug: string; lang: Locale; title: string; description: string };
type GlossaryRow = { id: string; title: Record<Locale, string>; description: Record<Locale, string> };

/**
 * Published topics, straight from the MDX frontmatter. Only `reviewed` entries get a card:
 * drafts have no public URL to share, so they need no image.
 */
function readTopics(): TopicRow[] {
  const files = readdirSync(TOPICS_DIR, { recursive: true, encoding: 'utf8' })
    .map((f) => f.split(path.sep).join('/'))
    .filter((f) => f.endsWith('.mdx'))
    .sort();

  const rows: TopicRow[] = [];
  for (const file of files) {
    const { data } = matter(readFileSync(path.join(TOPICS_DIR, file), 'utf8'));
    if (data.status !== 'reviewed') continue;
    const { track, slug, lang } = parseTopicId(topicIdFromPath(file));
    rows.push({ track, slug, lang, title: String(data.title), description: String(data.description) });
  }
  return rows;
}

/** Glossary copy used by both localized term pages, read from the data collection's YAML files. */
function readGlossary(): GlossaryRow[] {
  return readdirSync(GLOSSARY_DIR, { encoding: 'utf8' })
    .filter((file) => file.endsWith('.yaml'))
    .sort()
    .map((file) => {
      const data = parseYaml(readFileSync(path.join(GLOSSARY_DIR, file), 'utf8')) as {
        en: string;
        zh: string;
        short: Record<Locale, string>;
      };
      return {
        id: file.replace(/\.yaml$/, ''),
        title: { en: String(data.en), zh: String(data.zh) },
        description: { en: String(data.short.en), zh: String(data.short.zh) },
      };
    });
}

/**
 * Tracks with a practice catalogue, i.e. with at least one quiz bank on disk. `getStaticPaths`
 * for `/practice/{track}/` derives the same set from the `quizzes` collection, which is these
 * files; reading the directory keeps `ogPaths()` a pure function of the repository.
 */
function practiceTracks(): string[] {
  return readdirSync(QUIZZES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter(
      (slug) =>
        Boolean(getTrack(slug)) &&
        readdirSync(path.join(QUIZZES_DIR, slug)).some((file) => file.endsWith('.yaml')),
    )
    .sort();
}

/** Prefix for a locale's cards: English at the root, Chinese under `zh/`, as `seo.ts` expects. */
const prefix = (locale: Locale) => (locale === 'zh' ? 'zh/' : '');

/** Memoised: `getStaticPaths` and the endpoint's props both walk the same list. */
let entries: OgEntry[] | undefined;

/**
 * Every card the build renders: published topics, track hubs and every generic page that calls
 * `buildHead()`, in both locales. The paths mirror `ogImageUrl()` in `seo.ts` exactly — a page
 * whose `og:image` has no file here would 404 in every social preview.
 */
export function ogEntries(): OgEntry[] {
  if (entries) return entries;
  const topics = readTopics();
  const glossary = readGlossary();
  const practice = practiceTracks();
  const out: OgEntry[] = [];

  const pages = [
    { path: 'about', title: 'about.title', description: 'about.description' },
    { path: 'contribute', title: 'contribute.title', description: 'contribute.description' },
    { path: 'glossary', title: 'glossary.title', description: 'glossary.sub' },
    { path: 'tracks', title: 'tracks.title', description: 'tracks.sub' },
    { path: 'search', title: 'search.title', description: 'search.sub' },
    { path: 'settings', title: 'settings.title', description: 'settings.sub' },
    { path: '404', title: 'notFound.title', description: 'notFound.body' },
  ] as const;

  for (const locale of LOCALES) {
    const p = prefix(locale);
    const localeGlyph = locale === 'zh' ? '中文' : 'EN';

    out.push({
      path: `${p}home`,
      locale,
      title: t(locale, 'home.h1'),
      subtitle: t(locale, 'home.sub'),
      track: t(locale, 'home.eyebrow'),
      glyph: 'cw',
    });

    for (const page of pages) {
      out.push({
        path: `${p}${page.path}`,
        locale,
        title: t(locale, page.title),
        subtitle: t(locale, page.description),
        track: SITE.name,
        glyph: localeGlyph,
      });
    }

    for (const term of glossary) {
      out.push({
        path: `${p}glossary/${term.id}`,
        locale,
        title: term.title[locale],
        subtitle: term.description[locale],
        track: SITE.name,
        glyph: localeGlyph,
      });
    }

    for (const track of TRACKS) {
      out.push({
        path: `${p}${track.slug}`,
        locale,
        title: track.name[locale],
        subtitle: track.description[locale],
        track: t(locale, `tracks.${track.kind}s`),
        glyph: track.glyph,
      });
      out.push({
        path: `${p}rules/${track.slug}`,
        locale,
        title: t(locale, 'rules.pageTitle', { track: track.name[locale] }),
        subtitle: t(locale, 'rules.pageDescription', { track: track.name[locale] }),
        track: t(locale, 'rules.pack', { track: track.name[locale] }),
        glyph: track.glyph,
      });
    }

    for (const slug of practice) {
      const track = getTrack(slug)!;
      out.push({
        path: `${p}practice/${slug}`,
        locale,
        title: t(locale, 'practice.trackTitle', { track: track.name[locale] }),
        subtitle: t(locale, 'practice.trackLead', { track: track.name[locale] }),
        track: t(locale, 'practice.title'),
        glyph: track.glyph,
      });
    }

    for (const topic of topics) {
      if (topic.lang !== locale) continue;
      const track = getTrack(topic.track);
      out.push({
        path: `${p}${topic.track}/${topic.slug}`,
        locale,
        title: topic.title,
        subtitle: topic.description,
        track: track?.name[locale],
        glyph: track?.glyph,
      });
    }
  }

  entries = out;
  return out;
}

/** Just the route paths, for `getStaticPaths` and the path/URL contract test. */
export function ogPaths(): string[] {
  return ogEntries().map((entry) => entry.path);
}

/* ------------------------------------------------------------------ fonts */

export interface OgFont {
  name: 'Plex' | 'Mono' | 'Noto';
  data: Buffer;
  weight: 400 | 600;
  style: 'normal';
}

/** File name → satori face. Plex is required; the other two only sharpen the result. */
const FACES: { file: string; font: Omit<OgFont, 'data'>; required: boolean }[] = [
  { file: 'IBMPlexSans-Regular.ttf', font: { name: 'Plex', weight: 400, style: 'normal' }, required: true },
  { file: 'IBMPlexSans-SemiBold.ttf', font: { name: 'Plex', weight: 600, style: 'normal' }, required: true },
  { file: 'IBMPlexMono-SemiBold.ttf', font: { name: 'Mono', weight: 600, style: 'normal' }, required: false },
  { file: 'NotoSansSC-Regular.otf', font: { name: 'Noto', weight: 400, style: 'normal' }, required: false },
];

function readFace(file: string): Buffer | undefined {
  try {
    return readFileSync(path.join(FONT_DIR, file));
  } catch {
    return undefined;
  }
}

let fonts: Promise<OgFont[]> | undefined;

async function loadFonts(): Promise<OgFont[]> {
  const missing = FONTS.some(({ file }) => readFace(file) === undefined);
  if (missing) {
    // A fresh checkout has no .cache/fonts. Fetch lazily so `pnpm build` is self-sufficient,
    // and swallow network failures: a card without its font is better than a failed build.
    try {
      await fetchFonts(FONT_DIR, { quiet: true });
    } catch (error) {
      console.warn(`[og] font download failed — ${error instanceof Error ? error.message : error}`);
    }
  }

  const loaded: OgFont[] = [];
  for (const face of FACES) {
    const data = readFace(face.file);
    if (data) loaded.push({ ...face.font, data });
    else if (face.required) {
      console.warn(`[og] ${face.file} is missing; OG cards fall back to a plain placeholder.`);
    } else {
      console.warn(`[og] ${face.file} is missing; rendering without it.`);
    }
  }
  return loaded;
}

/**
 * Loads the build-time faces once per process, downloading them on first use when the cache is
 * cold. May come back short — or empty — when the network is unavailable; `renderOg` decides
 * what to do with what it gets, so a cold offline build degrades instead of failing.
 */
export function ensureFonts(): Promise<OgFont[]> {
  fonts ??= loadFonts();
  return fonts;
}

const warned = new Set<string>();

/** One warning per degraded mode per process, rather than one per card. */
function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

/* ----------------------------------------------------------------- layout */

type Style = Record<string, string | number>;
type El = { type: string; props: Record<string, unknown> };

/** Minimal `createElement`. satori only needs `{ type, props }`, so no JSX runtime is involved. */
function h(type: string, props: Record<string, unknown> = {}, ...children: El[] | string[]): El {
  const kids = children.length === 0 ? undefined : children.length === 1 ? children[0] : children;
  return { type, props: kids === undefined ? props : { ...props, children: kids } };
}

const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;

/** Rough advance width per character, as a fraction of the font size. */
const advance = (text: string) => (CJK.test(text) ? 1.02 : 0.55);

/** 72px normally, stepping down for the long titles the ruling calls out. */
function titleSize(title: string): number {
  if (title.length > 70) return 48;
  if (title.length > 40) return 56;
  return 72;
}

/**
 * Hard-clips text to the number of lines the card allows. satori does honour `-webkit-line-clamp`,
 * but clipping here keeps the ellipsis position predictable across faces and locales.
 */
function clip(text: string, size: number, lines: number): string {
  const budget = Math.floor(CONTENT_W / (size * advance(text))) * lines;
  if (text.length <= budget) return text;
  const cut = text.slice(0, budget - 1);
  // Break on a word boundary when there is one close to the end; CJK has none, so it cuts flush.
  const space = cut.lastIndexOf(' ');
  return `${(space > budget * 0.7 ? cut.slice(0, space) : cut).trimEnd().replace(/[,;:.]$/, '')}…`;
}

/** The whole card: accent rail, glyph tag row, headline block, wordmark footer. */
function card(input: OgCard): El {
  const size = titleSize(input.title);
  const family = 'Plex, Noto';

  const tag = input.glyph
    ? [
        h(
          'div',
          {
            style: {
              display: 'flex',
              padding: '6px 16px',
              borderRadius: 10,
              background: C.accSoft,
              color: C.acc,
              fontFamily: 'Mono, Plex, Noto',
              fontWeight: 600,
              fontSize: 26,
              letterSpacing: '0.01em',
            } satisfies Style,
          },
          input.glyph,
        ),
      ]
    : [];

  const label = input.track
    ? [
        h(
          'div',
          {
            style: {
              display: 'flex',
              color: C.ink2,
              fontFamily: family,
              fontSize: 26,
              letterSpacing: '0.01em',
            } satisfies Style,
          },
          clip(input.track, 26, 1),
        ),
      ]
    : [];

  return h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        width: WIDTH,
        height: HEIGHT,
        padding: `72px ${PAD_X}px`,
        background: C.bg,
        fontFamily: family,
      } satisfies Style,
    },
    // Left accent rail.
    h('div', {
      style: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 6,
        height: HEIGHT,
        background: C.acc,
      } satisfies Style,
    }),

    h('div', { style: { display: 'flex', alignItems: 'center', gap: 18 } satisfies Style }, ...tag, ...label),

    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column' } satisfies Style },
      h(
        'div',
        {
          style: {
            display: 'flex',
            color: C.ink,
            fontFamily: family,
            fontWeight: 600,
            fontSize: size,
            lineHeight: 1.14,
            letterSpacing: '-0.02em',
          } satisfies Style,
        },
        clip(input.title, size, 3),
      ),
      ...(input.subtitle
        ? [
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  marginTop: 26,
                  color: C.ink2,
                  fontFamily: family,
                  fontWeight: 400,
                  fontSize: 30,
                  lineHeight: 1.45,
                } satisfies Style,
              },
              clip(input.subtitle, 30, 2),
            ),
          ]
        : []),
    ),

    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `1px solid ${C.line}`,
          paddingTop: 28,
        } satisfies Style,
      },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 14 } satisfies Style },
        h('img', { src: MARK_URI, width: 44, height: 44 }),
        h(
          'div',
          {
            style: {
              display: 'flex',
              color: C.ink,
              fontFamily: 'Plex',
              fontWeight: 600,
              fontSize: 32,
              letterSpacing: '-0.01em',
            } satisfies Style,
          },
          SITE.name,
        ),
      ),
      h(
        'div',
        {
          style: { display: 'flex', color: C.ink3, fontFamily: 'Plex', fontSize: 26 } satisfies Style,
        },
        SITE.url.replace(/^https?:\/\//, ''),
      ),
    ),
  );
}

/** Text-free card for the case where not even Plex could be loaded. Keeps the build alive. */
function placeholderSvg(): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${C.bg}"/>`,
    `<rect x="0" y="0" width="6" height="${HEIGHT}" fill="${C.acc}"/>`,
    `<rect x="${PAD_X}" y="72" width="120" height="44" rx="10" fill="${C.accSoft}"/>`,
    `<rect x="${PAD_X}" y="${HEIGHT - 120}" width="${CONTENT_W}" height="1" fill="${C.line}"/>`,
    '</svg>',
  ].join('');
}

export interface RenderOptions {
  /**
   * Faces to lay the card out with, instead of the process-wide cache. Only the tests pass this,
   * to exercise the degraded paths — a build always wants `ensureFonts()`.
   */
  fonts?: OgFont[];
}

/** The card as SVG, stepping down to the placeholder when there is nothing to set type with. */
function cardSvg(input: OgCard, faces: OgFont[]): Promise<string> | string {
  if (!faces.some((f) => f.name === 'Plex')) {
    warnOnce('placeholder', '[og] no text face available — writing text-free placeholder cards.');
    return placeholderSvg();
  }
  const text = `${input.title} ${input.subtitle}`;
  if (CJK.test(text) && !faces.some((f) => f.name === 'Noto')) {
    warnOnce('cjk', '[og] no CJK face available — Chinese text is dropped from the cards.');
  }
  return satori(card(input), { width: WIDTH, height: HEIGHT, fonts: faces });
}

/** Renders one card to a 1200×630 PNG. */
export async function renderOg(input: OgCard, options: RenderOptions = {}): Promise<Buffer> {
  const faces = options.fonts ?? (await ensureFonts());
  const svg = await cardSvg(input, faces);
  // Satori embeds glyphs as paths. Scanning the host's fonts for every PNG adds hundreds of
  // milliseconds per card and cannot affect these already outlined glyphs.
  return new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH }, font: { loadSystemFonts: false } })
    .render()
    .asPng();
}
