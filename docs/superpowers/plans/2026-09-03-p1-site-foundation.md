# P1 Site Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the codewiki.com static site on Astro 7 with the design system, bilingual routing, content collections, home / track hub / topic pages, depth dial, runnable code, glossary tooltips, search, SEO infrastructure and the AI-era hand-off features, verified by unit and end-to-end tests.

**Architecture:** Astro 7 static output with MDX content collections (file-per-locale), Preact islands only where interaction is needed, Tailwind v4 utilities on top of CSS custom-property design tokens (light/dark). Build-time endpoints produce the Markdown twins, JSON API, llms.txt, RSS and OG images. Pagefind indexes the built site after `astro build`.

**Tech Stack:** Astro 7.3+, @astrojs/mdx 8, @astrojs/preact 6, Preact 10 + @preact/signals 2, Tailwind 4.3 (`@tailwindcss/vite`), Shiki (built in), Pagefind 1.5 (CLI), Pyodide (self-hosted core), esbuild-wasm, satori + @resvg/resvg-js, Vitest 5, Playwright 1.62, pnpm 10, Node 24, TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-09-03-codewiki-design.md` (read §3, §4, §5, §6, §7, §8, §9 before starting). Visual reference: `docs/design/mockups/*.dc.html` (see its README). Resume point: `docs/superpowers/STATUS.md`.

## Global Constraints

- All docs, comments, commit messages and identifiers in English. Chinese appears only in zh content and the zh UI dictionary.
- Node ≥ 22.12 (use 24), pnpm 10. Astro `output: 'static'`, `trailingSlash: 'always'`, `build.format: 'directory'`.
- Locales: `en` unprefixed at `/`, `zh` at `/zh/`. `hreflang` values `en`, `zh-Hans`, `x-default`.
- Every colour in components comes from a token in `src/styles/tokens.css`; no raw hex in components (tokens.css is the only place).
- Fonts: IBM Plex Sans + IBM Plex Mono self-hosted; CJK from the system stack. No Google Fonts at runtime.
- Icons are inline SVG; no emoji in UI.
- Topic page JS budget: ≤ 60 KB gzipped before any Run is pressed.
- Local storage keys are prefixed `cw:v1:` with the shapes in spec §6.2.
- Title pattern: `"{Title} · {Track} · codewiki"` (en), `"{Title}｜{Track}｜codewiki"` (zh). Home: `"codewiki · Master code in the AI era"` / `"codewiki · 在 AI 时代精通编程"`.
- Commit after every task with a conventional message (`feat:`, `chore:`, `test:`, `docs:`).
- Update `docs/superpowers/STATUS.md` at the end of Tasks 1, 6, 12, 15 and 19.

---

## File structure (created by this plan)

```
astro.config.mjs                 Astro config: integrations, i18n, markdown (shiki transformer, rehype/remark)
package.json / pnpm-lock.yaml
tsconfig.json                    strict, path alias @/* -> src/*
eslint.config.js / .prettierrc
vitest.config.ts / playwright.config.ts
lighthouserc.json
.github/workflows/ci.yml
public/_headers                  Cloudflare Pages headers (cache + CSP)
public/robots.txt
public/vendor/pyodide/           copied by scripts/vendor-pyodide.mjs (git-ignored)
scripts/vendor-pyodide.mjs       copies Pyodide core files from node_modules
scripts/fetch-fonts.mjs          downloads TTFs for OG rendering into .cache/fonts (git-ignored)
src/content.config.ts            collections: topics, glossary, quizzes, paths
src/content/topics/python/closures.{en,zh}.mdx   sample content (2 topics per locale)
src/content/topics/javascript/event-loop.{en,zh}.mdx
src/content/glossary/terms.yaml
src/content/quizzes/python/closures.yaml
src/content/paths/python-from-zero.yaml
src/data/tracks.ts               22 tracks with sections (bilingual)
src/data/site.ts                 site constants (name, url, tagline per locale)
src/i18n/en.ts, zh.ts, index.ts  dictionaries + t(), locale helpers
src/lib/seo.ts                   head + JSON-LD builders
src/lib/urls.ts                  localizePath, alternates, topic/track URL helpers
src/lib/content.ts               getTopic, getPair, listTopicsByTrack, topic id parsing
src/lib/reading-time.ts          words per depth level -> minutes
src/lib/prefs.ts                 typed localStorage store (cw:v1:prefs / progress / recents)
src/lib/prompts.ts               Ask-AI prompt presets + deep links
src/lib/markdown-twin.ts         MDX source -> plain Markdown
src/lib/runners/protocol.ts      run request/response message types
src/lib/runners/js.ts            sandboxed iframe runner (JS, TS via esbuild-wasm)
src/lib/runners/python.ts        Pyodide loader + runner
src/markdown/shiki-meta.ts       Shiki transformer: fence meta -> data attributes
src/markdown/rehype-codebox.ts   wraps <pre> in the codebox figure with header/buttons
src/markdown/remark-callouts.ts  > [!PITFALL] etc. -> Callout markup
src/markdown/remark-depth.ts     counts words per depth level -> frontmatter.readingTime
src/styles/tokens.css            light/dark tokens
src/styles/global.css            resets, prose, component classes shared by MDX output
src/layouts/Base.astro           html shell, head (Seo), theme bootstrap, Nav, Footer, skip link
src/components/*.astro           Nav, Footer, Seg, Tag, Panel, Button, Icon, TrackCard, TopicCard, Breadcrumb, MetaPanel, TLDR, Depth, Callout, Term, PrevNext, ActionRow, Kbd
src/components/mdx.ts            component map passed to <Content components={...}/>
src/islands/ThemeToggle.tsx, LangSwitch.tsx (no island; Astro), Palette.tsx, DepthDial.tsx, Toc.tsx, CodeRunners.tsx, Terms.tsx, AskAI.tsx, PersonalStrip.tsx, SettingsForm.tsx
src/pages/index.astro, zh/index.astro
src/pages/[track]/index.astro, zh/[track]/index.astro
src/pages/[track]/[slug].astro, zh/[track]/[slug].astro
src/pages/[track]/[slug].md.ts, zh/[track]/[slug].md.ts
src/pages/glossary/index.astro, glossary/[term].astro (+ zh)
src/pages/search.astro (+ zh), settings.astro (+ zh), 404.astro
src/pages/llms.txt.ts, llms/[track].txt.ts, llms-full.txt.ts
src/pages/api/topics.json.ts, api/glossary.json.ts, api/paths.json.ts, api/topics/[track]/[slug].json.ts
src/pages/rss.xml.ts
src/pages/og/[...path].png.ts
tests/unit/*.test.ts             Vitest
tests/e2e/*.spec.ts              Playwright
docs/dev/astro7-notes.md         verified API notes
```

Locale-specific pages under `src/pages/zh/` are thin wrappers that import the same page component with `locale="zh"`; the page bodies live in `src/pages-shared/*.astro` to avoid duplication (e.g. `src/pages-shared/Home.astro`, `TrackHub.astro`, `Topic.astro`, `Glossary.astro`, `GlossaryTerm.astro`, `Search.astro`, `Settings.astro`).

---

### Task 0: Verify Astro 7 APIs and record them

**Files:**
- Create: `docs/dev/astro7-notes.md`

**Interfaces:**
- Produces: a short reference every later task consults for exact import paths and config shapes.

- [ ] **Step 1: Fetch and read the docs** (use WebFetch or a browser): `https://docs.astro.build/en/guides/upgrade-to/v7/`, `/en/guides/content-collections/`, `/en/guides/internationalization/`, `/en/guides/markdown-content/`, `/en/guides/integrations-guide/mdx/`, `/en/guides/integrations-guide/sitemap/`, `/en/guides/integrations-guide/preact/`, `/en/guides/endpoints/`, `/en/reference/configuration-reference/` (markdown, i18n, build, trailingSlash), `/en/guides/syntax-highlighting/` (Shiki transformers, `css-variables` theme).

- [ ] **Step 2: Write `docs/dev/astro7-notes.md`** with these headings and verbatim snippets: (1) `src/content.config.ts` with `glob({ pattern, base, generateId })` and `z` from `astro/zod`; (2) `render(entry)` from `astro:content` and the shape of `headings` and `remarkPluginFrontmatter`; (3) i18n config with `prefixDefaultLocale: false` and `Astro.currentLocale`; (4) markdown config: how to pass `shikiConfig.transformers`, `rehypePlugins`, `remarkPlugins` when using `@astrojs/mdx` 8 (note Astro 7's default Sätteri processor vs `unified()` from `@astrojs/markdown-remark`; record which one MDX uses and which config key the plugins go under); (5) how to compress HTML (`compressHTML`) and the strict-HTML requirement (all tags closed); (6) static endpoint signature (`export const GET: APIRoute`, `getStaticPaths` for dynamic endpoints, returning `new Response(body, { headers })`); (7) sitemap `i18n` option shape. Include the doc URL under each snippet.

- [ ] **Step 3: Commit**

```bash
git add docs/dev/astro7-notes.md
git commit -m "docs: verified Astro 7 API notes for implementation"
```

---

### Task 1: Scaffold the project and tooling

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `vitest.config.ts`, `playwright.config.ts`, `src/pages/index.astro` (placeholder), `src/env.d.ts`, `.github/workflows/ci.yml`, `.nvmrc`
- Modify: `.gitignore` (add `.cache/`, `public/vendor/`, `public/pagefind/`)

**Interfaces:**
- Produces: `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm test:e2e`, `pnpm lint`, `pnpm check` scripts.

- [ ] **Step 1: Create the project**

```bash
cd /home/chen/githubprojects/codewiki/codewiki
pnpm create astro@latest . --template minimal --typescript strict --no-install --no-git --skip-houston
```
If the CLI refuses a non-empty directory, run it in a temp dir and copy `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/`, `public/` over (do not overwrite `docs/` or `.gitignore`).

- [ ] **Step 2: Add dependencies**

```bash
pnpm add astro@^7.3 @astrojs/mdx@^8 @astrojs/sitemap@^3.7 @astrojs/preact@^6 preact@^10.29 @preact/signals@^2 tailwindcss@^4.3 @tailwindcss/vite@^4.3 github-slugger gray-matter unist-util-visit mdast-util-to-string hast-util-to-string lz-string
pnpm add -D typescript@^5 @astrojs/check vitest@^5 @playwright/test@^1.62 eslint@^9 eslint-plugin-astro @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier prettier-plugin-astro tsx @types/node pagefind@^1.5 pyodide esbuild-wasm satori @resvg/resvg-js @lhci/cli
```

- [ ] **Step 3: Write `astro.config.mjs`** (plugins are added in later tasks; keep the import slots)

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://codewiki.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    mdx(),
    preact(),
    sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', zh: 'zh-Hans' } } }),
  ],
  vite: { plugins: [tailwindcss()] },
});
```
Adjust the sitemap `locales` shape to whatever `docs/dev/astro7-notes.md` recorded.

- [ ] **Step 4: Write `package.json` scripts**

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && pagefind --site dist",
    "preview": "astro preview",
    "check": "astro check && tsc --noEmit -p tsconfig.json",
    "lint": "eslint . && prettier --check .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "vendor:pyodide": "node scripts/vendor-pyodide.mjs",
    "fonts": "node scripts/fetch-fonts.mjs"
  }
}
```

- [ ] **Step 5: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests", "scripts", "astro.config.mjs"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 6: Write `vitest.config.ts` and `playwright.config.ts`**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { globals: true, environment: 'node', include: ['tests/unit/**/*.test.ts'] },
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
});
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:4321', trace: 'retain-on-failure' },
  webServer: { command: 'pnpm preview --port 4321', port: 4321, reuseExistingServer: true },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
```

- [ ] **Step 7: Write `eslint.config.js`, `.prettierrc`, `.nvmrc`**

```js
// eslint.config.js
import astro from 'eslint-plugin-astro';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
export default [
  { ignores: ['dist/**', 'node_modules/**', '.astro/**', 'public/**', 'docs/design/**'] },
  ...astro.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser: tsParser, parserOptions: { project: false } },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: { ...tsPlugin.configs.recommended.rules, '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
];
```
`.prettierrc`: `{ "singleQuote": true, "printWidth": 110, "plugins": ["prettier-plugin-astro"], "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }] }`. `.nvmrc`: `24`.

- [ ] **Step 8: Write the placeholder page and a smoke unit test**

`src/pages/index.astro`:
```astro
---
---
<html lang="en"><head><meta charset="utf-8" /><title>codewiki</title></head><body><h1>codewiki</h1></body></html>
```
`tests/unit/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
describe('toolchain', () => { it('runs', () => { expect(1 + 1).toBe(2); }); });
```

- [ ] **Step 9: Write `.github/workflows/ci.yml`**

```yaml
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm check
      - run: pnpm test
      - run: pnpm vendor:pyodide
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
      - run: pnpm exec lhci autorun
```

- [ ] **Step 10: Verify** `pnpm install && pnpm lint && pnpm check && pnpm test && pnpm build` all succeed (pagefind may warn about an empty index; that is fine).

- [ ] **Step 11: Update STATUS.md** ("Repo scaffold: done") and commit

```bash
git add -A && git commit -m "chore: scaffold Astro 7 project with tooling and CI"
```

---

### Task 2: Design tokens, global styles and theme switching

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/lib/theme.ts`, `src/islands/ThemeToggle.tsx`, `src/components/ThemeScript.astro`
- Test: `tests/unit/theme.test.ts`

**Interfaces:**
- Produces: CSS custom properties listed in spec §7.1 on `:root` (light) and `:root[data-theme="dark"]` (dark) plus `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])`; `resolveTheme(stored: string | null, systemDark: boolean): 'light' | 'dark'`; `nextTheme(current: ThemePref): ThemePref` cycling `system → light → dark → system`; `ThemePref = 'system' | 'light' | 'dark'`; storage key `cw:v1:prefs` field `theme`.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/unit/theme.test.ts
import { resolveTheme, nextTheme, readThemePref, writeThemePref } from '@/lib/theme';

describe('resolveTheme', () => {
  it('follows system when pref is system or missing', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
  it('honours explicit prefs', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });
  it('ignores garbage', () => { expect(resolveTheme('purple', true)).toBe('dark'); });
});

describe('nextTheme', () => {
  it('cycles system -> light -> dark -> system', () => {
    expect(nextTheme('system')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('system');
  });
});

describe('prefs storage', () => {
  it('round-trips through a Storage-like object', () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    writeThemePref('dark', storage);
    expect(readThemePref(storage)).toBe('dark');
    expect(JSON.parse(store.get('cw:v1:prefs')!)).toEqual({ theme: 'dark' });
  });
});
```

- [ ] **Step 2: Run tests, expect failure** `pnpm vitest run tests/unit/theme.test.ts` → "Cannot find module '@/lib/theme'".

- [ ] **Step 3: Implement `src/lib/theme.ts`**

```ts
export type ThemePref = 'system' | 'light' | 'dark';
export const PREFS_KEY = 'cw:v1:prefs';
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function resolveTheme(pref: string | null, systemDark: boolean): 'light' | 'dark' {
  if (pref === 'light' || pref === 'dark') return pref;
  return systemDark ? 'dark' : 'light';
}
export function nextTheme(current: ThemePref): ThemePref {
  return current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';
}
export function readPrefs(storage: StorageLike): Record<string, unknown> {
  try { return JSON.parse(storage.getItem(PREFS_KEY) ?? '{}') as Record<string, unknown>; } catch { return {}; }
}
export function readThemePref(storage: StorageLike): ThemePref {
  const t = readPrefs(storage).theme;
  return t === 'light' || t === 'dark' ? t : 'system';
}
export function writeThemePref(pref: ThemePref, storage: StorageLike): void {
  storage.setItem(PREFS_KEY, JSON.stringify({ ...readPrefs(storage), theme: pref }));
}
```

- [ ] **Step 4: Run tests, expect pass.**

- [ ] **Step 5: Write `src/styles/tokens.css`** — copy every value from spec §7.1 (light on `:root`, dark under `:root[data-theme="dark"]` and `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }`). Also declare `--font-sans`, `--font-mono`, radii (`--r-4: 4px; --r-6: 6px; --r-8: 8px`), container widths (`--w-home: 1200px; --w-topic: 1320px`), and `color-scheme: light` / `dark` in the respective blocks. Expose tokens to Tailwind:

```css
@import 'tailwindcss';
@theme inline {
  --color-bg: var(--bg); --color-sur: var(--sur); --color-sur2: var(--sur2); --color-line: var(--line);
  --color-ink: var(--ink); --color-ink2: var(--ink2); --color-ink3: var(--ink3);
  --color-acc: var(--acc); --color-acc-h: var(--acc-h); --color-acc-ink: var(--acc-ink); --color-acc-soft: var(--acc-soft);
  --color-acc2: var(--acc2); --color-acc2-soft: var(--acc2-soft);
  --color-ok: var(--ok); --color-ok-soft: var(--ok-soft); --color-warn: var(--warn); --color-warn-soft: var(--warn-soft);
  --color-bad: var(--bad); --color-bad-soft: var(--bad-soft);
  --font-sans: var(--font-sans); --font-mono: var(--font-mono);
}
```

- [ ] **Step 6: Write `src/styles/global.css`**: import tokens; box-sizing reset; `body { margin:0; background: var(--bg); color: var(--ink); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }`; `a { color: var(--acc); text-decoration: none } a:hover { color: var(--acc-h) }`; focus ring `:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px }`; `.skip-link`; `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important } }`; shared component classes copied from the mockups: `.panel`, `.tag` (+`.acc .ok .warn`), `.lbl`, `.mono`, `.seg`/`.seg span`/`.seg span.on`, `.kbd`, `.btn`/`.btn-p`/`.btn-g`, `.codebox`/`.codehead`/`.run`/`.out`, `.opt` family, `.act`, `.tabs`, `.kv`, `.tree`, `.toc`, `.prose` (p 16px/1.7, zh 15px/1.9 with left rule, h2 26px), `.term`. Use the exact px values from `docs/design/mockups/Topic.dc.html` and `Main.dc.html`. Chinese: `html[lang="zh-Hans"] .prose p { line-height: 1.9 }`.

- [ ] **Step 7: Write `src/components/ThemeScript.astro`** (inline, runs before paint):

```astro
<script is:inline>
  (function () {
    try {
      var p = JSON.parse(localStorage.getItem('cw:v1:prefs') || '{}').theme;
      var sys = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var t = p === 'light' || p === 'dark' ? p : (sys ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', t);
      document.documentElement.setAttribute('data-theme-pref', p === 'light' || p === 'dark' ? p : 'system');
    } catch (e) {}
  })();
</script>
```

- [ ] **Step 8: Write `src/islands/ThemeToggle.tsx`**: a button with three states (icons: monitor / sun / moon as inline SVG), `aria-label` from props (`labels: { system, light, dark }`), on click: `next = nextTheme(current)`, `writeThemePref(next, localStorage)`, set `data-theme` (resolved) and `data-theme-pref` on `document.documentElement`. Hydrate with `client:idle`.

- [ ] **Step 9: Wire into the placeholder page** (import global.css, add ThemeScript and ThemeToggle) and verify in `pnpm dev` that toggling changes `data-theme` with no flash on reload.

- [ ] **Step 10: Commit** `git add -A && git commit -m "feat: design tokens, global styles and theme switching"`

---

### Task 3: Self-hosted fonts

**Files:**
- Create: `src/styles/fonts.css`, `public/fonts/` (woff2 files), `scripts/fetch-fonts.mjs`
- Modify: `src/styles/global.css` (import fonts.css), `.gitignore` (`.cache/`)

**Interfaces:**
- Produces: `--font-sans: 'IBM Plex Sans', 'CJK Fallback', system-ui, sans-serif`; `--font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace`.

- [ ] **Step 1: Install fontsource packages** `pnpm add @fontsource-variable/ibm-plex-sans @fontsource/ibm-plex-mono` (if the variable package does not exist, use `@fontsource/ibm-plex-sans` with weights 400/500/600).

- [ ] **Step 2: Copy the latin + latin-ext woff2 files** from `node_modules/@fontsource*/ibm-plex-*/files/` into `public/fonts/` (only `latin` and `latin-ext` subsets, normal style) and write `src/styles/fonts.css` with `@font-face` rules (`font-display: swap`, `unicode-range` copied from the fontsource CSS) plus a metric-matched CJK fallback:

```css
@font-face { font-family: 'CJK Fallback'; src: local('PingFang SC'), local('Hiragino Sans GB'), local('Microsoft YaHei'), local('Noto Sans CJK SC'), local('Noto Sans SC'); size-adjust: 100%; ascent-override: 96%; descent-override: 24%; }
```

- [ ] **Step 3: Write `scripts/fetch-fonts.mjs`** (used only by OG image generation, Task 18): downloads `IBMPlexSans-Regular.ttf`, `IBMPlexSans-SemiBold.ttf` from `https://github.com/IBM/plex/raw/master/packages/plex-sans/fonts/complete/ttf/` and `NotoSansSC-Regular.otf` from `https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf` into `.cache/fonts/`, skipping files that exist. Use `fetch` + `fs/promises`; fail loudly with the URL on non-200.

- [ ] **Step 4: Verify** the dev page renders in Plex (DevTools → Rendered Fonts) and Chinese text renders in a system CJK font.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: self-hosted IBM Plex fonts with CJK fallback"`

---

### Task 4: i18n dictionaries and URL helpers

**Files:**
- Create: `src/i18n/en.ts`, `src/i18n/zh.ts`, `src/i18n/index.ts`, `src/lib/urls.ts`
- Test: `tests/unit/i18n.test.ts`, `tests/unit/urls.test.ts`

**Interfaces:**
- Produces: `type Locale = 'en' | 'zh'`; `const LOCALES: Locale[]`; `t(locale, key, vars?)`; `localeFromPath(path): Locale`; `localizePath(path, locale)`; `alternates(path)` → `{ en: string; zh: string }`; `trackUrl(track, locale)`; `topicUrl(track, slug, locale)`; `stripLocale(path)`. `Dict` type is inferred from `en.ts`; `zh.ts` must satisfy `Dict`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/urls.test.ts
import { localeFromPath, localizePath, alternates, topicUrl, trackUrl, stripLocale } from '@/lib/urls';
describe('urls', () => {
  it('detects locale', () => { expect(localeFromPath('/zh/python/')).toBe('zh'); expect(localeFromPath('/python/')).toBe('en'); expect(localeFromPath('/zh/')).toBe('zh'); });
  it('strips and adds prefixes', () => { expect(stripLocale('/zh/python/closures/')).toBe('/python/closures/'); expect(localizePath('/python/closures/', 'zh')).toBe('/zh/python/closures/'); expect(localizePath('/zh/python/', 'en')).toBe('/python/'); expect(localizePath('/', 'zh')).toBe('/zh/'); });
  it('builds alternates', () => { expect(alternates('/zh/python/')).toEqual({ en: '/python/', zh: '/zh/python/' }); });
  it('builds content urls', () => { expect(topicUrl('python', 'closures', 'zh')).toBe('/zh/python/closures/'); expect(trackUrl('python', 'en')).toBe('/python/'); });
});
```
```ts
// tests/unit/i18n.test.ts
import { t } from '@/i18n';
import en from '@/i18n/en';
import zh from '@/i18n/zh';
describe('i18n', () => {
  it('has the same keys in both dictionaries', () => { expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort()); });
  it('interpolates', () => { expect(t('en', 'topic.readTime', { min: 9 })).toBe('9 min at Standard depth'); });
  it('never returns empty strings', () => { for (const v of Object.values(zh)) expect(v.length).toBeGreaterThan(0); });
});
```

- [ ] **Step 2: Run tests, expect failure.**

- [ ] **Step 3: Implement `src/lib/urls.ts`**

```ts
export type Locale = 'en' | 'zh';
export const LOCALES: Locale[] = ['en', 'zh'];
export const DEFAULT_LOCALE: Locale = 'en';
export function localeFromPath(path: string): Locale { return path === '/zh' || path.startsWith('/zh/') ? 'zh' : 'en'; }
export function stripLocale(path: string): string { return localeFromPath(path) === 'zh' ? path.replace(/^\/zh(\/|$)/, '/') : path; }
export function localizePath(path: string, locale: Locale): string { const base = stripLocale(path); return locale === 'en' ? base : `/zh${base === '/' ? '/' : base}`; }
export function alternates(path: string): Record<Locale, string> { return { en: localizePath(path, 'en'), zh: localizePath(path, 'zh') }; }
export function trackUrl(track: string, locale: Locale): string { return localizePath(`/${track}/`, locale); }
export function topicUrl(track: string, slug: string, locale: Locale): string { return localizePath(`/${track}/${slug}/`, locale); }
```

- [ ] **Step 4: Implement dictionaries.** `src/i18n/en.ts` exports `export default { ... } as const` with at least these keys (add more as pages need them; every key added to `en` must be added to `zh`): `site.tagline`, `nav.tracks`, `nav.paths`, `nav.practice`, `nav.cheatsheets`, `nav.compare`, `nav.playground`, `nav.aiEra`, `nav.search`, `nav.searchHint`, `theme.system`, `theme.light`, `theme.dark`, `home.eyebrow`, `home.h1`, `home.sub`, `home.startPath`, `home.browseTracks`, `home.verified`, `home.tracks`, `home.allTracks`, `home.feature.{1..6}.title/.desc`, `home.mode.{learn,lookup,practice}.title/.desc`, `home.bilingual.label/.title`, `home.ai.label/.title`, `home.prompt.{1,2,3}`, `home.continue`, `home.kata`, `home.recall`, `home.review`, `footer.tagline`, `footer.about`, `footer.contribute`, `footer.llms`, `footer.rss`, `topic.level`, `topic.time`, `topic.checked`, `topic.status`, `topic.reviewed`, `topic.readTime` (`'{min} min at Standard depth'` / `'标准深度约 {min} 分钟'`), `depth.quick`, `depth.standard`, `depth.deep`, `depth.switchDeep`, `bilingual.label`, `bilingual.off`, `bilingual.on`, `toc.title`, `toc.deep`, `topic.before`, `topic.next`, `topic.askAi`, `topic.copyMd`, `topic.addFlash`, `topic.edit`, `topic.clear`, `topic.yes`, `topic.notQuite`, `topic.terms`, `topic.path`, `topic.milestone`, `code.copy`, `code.copied`, `code.run`, `code.running`, `code.reset`, `code.output`, `code.loadingPython`, `track.topics`, `track.sections`, `track.verified`, `track.path`, `track.continue`, `track.map`, `track.progress`, `track.export`, `track.import`, `glossary.title`, `glossary.terms`, `search.title`, `search.placeholder`, `search.empty`, `search.topics`, `search.glossary`, `search.paths`, `settings.*` (theme, depth, bilingual, fontSize, data, export, import, clear, confirmClear), `notFound.title`, `notFound.body`, `notFound.home`, `ai.explain`, `ai.quiz`, `ai.bugs`, `ai.compare`, `ai.apply`, `ai.openClaude`, `ai.openChatGPT`, `ai.copy`. Chinese copy must be natural technical Chinese (e.g. `nav.aiEra: 'AI 时代'`, `depth.quick: '速览'`, `depth.standard: '标准'`, `depth.deep: '深入'`, `bilingual.on: 'EN + 中文'`, `code.run: '运行'`).

`src/i18n/index.ts`:
```ts
import en from './en'; import zh from './zh'; import type { Locale } from '@/lib/urls';
export type Dict = typeof en; export type DictKey = keyof Dict;
const dicts: Record<Locale, Dict> = { en, zh: zh as Dict };
export function t(locale: Locale, key: DictKey, vars: Record<string, string | number> = {}): string {
  return String(dicts[locale][key]).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
export { en, zh };
```
`zh.ts` is typed `satisfies Record<keyof typeof en, string>`.

- [ ] **Step 5: Run tests, expect pass. Commit** `git add -A && git commit -m "feat: i18n dictionaries and locale-aware URL helpers"`

---

### Task 5: Tracks data

**Files:**
- Create: `src/data/tracks.ts`, `src/data/site.ts`
- Test: `tests/unit/tracks.test.ts`

**Interfaces:**
- Produces: `type Track = { slug: string; kind: 'language'|'domain'|'pillar'; glyph: string; name: L; description: L; sections: Section[] }`, `type Section = { slug: string; name: L; description?: L }`, `type L = { en: string; zh: string }`; `TRACKS: Track[]`; `getTrack(slug)`, `getSection(track, slug)`; `HOME_TRACKS: string[]` (the 12 shown on home). `site.ts`: `SITE = { name: 'codewiki', url: 'https://codewiki.com', tagline: L, repo: 'https://github.com/…' }`.

- [ ] **Step 1: Write failing tests**

```ts
import { TRACKS, getTrack, HOME_TRACKS } from '@/data/tracks';
describe('tracks', () => {
  it('has 22 unique tracks with sections', () => {
    expect(TRACKS).toHaveLength(22);
    expect(new Set(TRACKS.map(t => t.slug)).size).toBe(22);
    for (const t of TRACKS) { expect(t.sections.length).toBeGreaterThanOrEqual(4); expect(t.name.zh).not.toEqual(t.name.en); }
  });
  it('section slugs are unique within a track and kebab-case', () => {
    for (const t of TRACKS) { const s = t.sections.map(x => x.slug); expect(new Set(s).size).toBe(s.length); for (const x of s) expect(x).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/); }
  });
  it('home list references real tracks', () => { for (const s of HOME_TRACKS) expect(getTrack(s)).toBeDefined(); expect(HOME_TRACKS).toHaveLength(12); });
});
```

- [ ] **Step 2: Run, expect failure. Step 3: Implement** using spec §14.1 for slugs/sections; glyphs: py js ts go rs jvm(java) kt cpp c# swift php ui api arch ops db ds llm sec game ai cs. Chinese names: Python/JavaScript/TypeScript/Go/Rust/Java/Kotlin/C++/C#/Swift/PHP keep Latin names; 前端 · 后端 · 架构与系统设计 · DevOps 与云 · 数据与数据库 · 数据科学 · AI 与大模型工程 · 安全 · 游戏开发 · AI 时代编程 · 计算机基础. `HOME_TRACKS = ['python','javascript','typescript','go','rust','java','cpp','frontend','backend','ai','devops','ai-era']`.

- [ ] **Step 4: Run tests, expect pass. Commit** `git commit -am "feat: track and section registry"`

---

### Task 6: Content collections and sample content

**Files:**
- Create: `src/content.config.ts`, `src/lib/content.ts`, `src/content/topics/python/closures.en.mdx`, `src/content/topics/python/closures.zh.mdx`, `src/content/topics/javascript/event-loop.en.mdx`, `src/content/topics/javascript/event-loop.zh.mdx`, `src/content/glossary/terms.yaml`, `src/content/quizzes/python/closures.yaml`, `src/content/paths/python-from-zero.yaml`, `src/schemas/topic.ts`, `src/schemas/glossary.ts`, `src/schemas/quiz.ts`, `src/schemas/path.ts`
- Test: `tests/unit/schemas.test.ts`, `tests/unit/content-ids.test.ts`

**Interfaces:**
- Produces: collections `topics`, `glossary`, `quizzes`, `paths`. Topic entry id = `${track}/${slug}/${lang}` via `generateId`. `parseTopicId(id) → { track, slug, lang }`. `src/lib/content.ts`: `getTopic(track, slug, lang)`, `getPair(track, slug)`, `listTopics(lang, { track?, section?, status? })`, `isPublic(entry)` (status === 'reviewed' or `import.meta.env.DEV`). Zod schemas exported from `src/schemas/*` so tests can import them without Astro.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/schemas.test.ts
import { topicSchema } from '@/schemas/topic';
import { quizSchema } from '@/schemas/quiz';
describe('topic schema', () => {
  const base = { title: 'Closures', description: 'x'.repeat(50), track: 'python', section: 'functions-deeper', difficulty: 'intermediate', tags: ['closures'], status: 'reviewed', reviewed: new Date('2026-09-03'), verified: { version: 'Python 3.14', date: new Date('2026-09-03') } };
  it('accepts a minimal reviewed topic', () => { expect(topicSchema.parse(base).status).toBe('reviewed'); });
  it('rejects unknown track and long descriptions', () => {
    expect(() => topicSchema.parse({ ...base, track: 'cobol' })).toThrow();
    expect(() => topicSchema.parse({ ...base, description: 'x'.repeat(200) })).toThrow();
  });
  it('defaults', () => { const t = topicSchema.parse(base); expect(t.prerequisites).toEqual([]); expect(t.aligned).toBe(false); });
});
describe('quiz schema', () => {
  it('requires exactly one correct mcq option', () => {
    const item = { id: 'q1', type: 'mcq', prompt: { en: 'Q', zh: '问' }, options: [{ text: { en: 'a', zh: '甲' }, correct: true }, { text: { en: 'b', zh: '乙' }, correct: true }], explanation: { en: 'e', zh: '解' }, difficulty: 'beginner' };
    expect(() => quizSchema.parse({ id: 'python/closures', topic: 'python/closures', items: [item] })).toThrow();
  });
});
```
```ts
// tests/unit/content-ids.test.ts
import { parseTopicId, topicIdFromPath } from '@/lib/content-ids';
describe('topic ids', () => {
  it('parses', () => { expect(parseTopicId('python/closures/zh')).toEqual({ track: 'python', slug: 'closures', lang: 'zh' }); });
  it('derives from file path', () => { expect(topicIdFromPath('python/closures.zh.mdx')).toBe('python/closures/zh'); expect(topicIdFromPath('go/goroutines-channels.en.mdx')).toBe('go/goroutines-channels/en'); });
});
```
(`src/lib/content-ids.ts` holds the pure helpers; `src/lib/content.ts` imports `astro:content` and is not unit-tested.)

- [ ] **Step 2: Run, expect failure. Step 3: Implement schemas**

```ts
// src/schemas/topic.ts
import { z } from 'astro/zod';
import { TRACKS } from '@/data/tracks';
const trackSlugs = TRACKS.map(t => t.slug) as [string, ...string[]];
export const difficulty = z.enum(['beginner', 'intermediate', 'advanced']);
export const topicSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(40).max(170),
  track: z.enum(trackSlugs),
  section: z.string().regex(/^[a-z0-9-]+$/),
  difficulty,
  tags: z.array(z.string()).default([]),
  prerequisites: z.array(z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/)).default([]),
  related: z.array(z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/)).default([]),
  terms: z.array(z.string()).default([]),
  verified: z.object({ version: z.string(), date: z.coerce.date() }),
  reviewed: z.coerce.date().nullable().default(null),
  status: z.enum(['imported', 'draft', 'reviewed']).default('draft'),
  aligned: z.boolean().default(false),
  quiz: z.string().optional(),
  sources: z.array(z.object({ title: z.string(), url: z.string().url() })).default([]),
  origin: z.string().optional(),
}).superRefine((v, ctx) => { if (v.status === 'reviewed' && !v.reviewed) ctx.addIssue({ code: 'custom', message: 'reviewed topics need a reviewed date' }); });
export type TopicFrontmatter = z.infer<typeof topicSchema>;
```
`src/schemas/quiz.ts`: `L = z.object({ en: z.string(), zh: z.string() })`; item union on `type` (`mcq` requires `options` with exactly one `correct: true` via `superRefine`; `predict` requires `code`, `lang`, `options`; `spotbug` and `review` require `code`, `lang`, `issues: [{ line, kind, note: L }]`; `fill` requires `answer: z.string()`), all with `id`, `prompt: L`, `explanation: L`, `difficulty`, `tags` default `[]`. `quizSchema = z.object({ id, topic, items: z.array(item).min(1) })`.
`src/schemas/glossary.ts`: `termSchema = z.object({ id: z.string().regex(/^[a-z0-9-]+$/), en: z.string(), zh: z.string(), aliases: z.array(z.string()).default([]), short: L, topics: z.array(z.string()).default([]) })`; the collection file is `terms.yaml` containing `{ terms: Term[] }` loaded with `file()` loader (`parser` splitting the array) — check `docs/dev/astro7-notes.md` for the `file()` parser option; if unavailable, store one YAML file per term under `src/content/glossary/*.yaml` with `glob`.
`src/schemas/path.ts`: per spec §4 (`id, title: L, description: L, tracks[], level: { from, to }, hours, outcomes: L[], milestones: [{ id, title: L, topics: string[], checkpoint: string }], edges: [{ from, to }]`).

- [ ] **Step 4: Implement `src/lib/content-ids.ts`** (`parseTopicId`, `topicIdFromPath` using regex `/^(.+)\/([^/]+)\.(en|zh)\.mdx$/`) and `src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { topicSchema } from '@/schemas/topic';
import { quizSchema } from '@/schemas/quiz';
import { termSchema } from '@/schemas/glossary';
import { pathSchema } from '@/schemas/path';
import { topicIdFromPath } from '@/lib/content-ids';
const topics = defineCollection({ loader: glob({ pattern: '**/*.{en,zh}.mdx', base: './src/content/topics', generateId: ({ entry }) => topicIdFromPath(entry) }), schema: topicSchema });
const quizzes = defineCollection({ loader: glob({ pattern: '**/*.yaml', base: './src/content/quizzes' }), schema: quizSchema });
const glossary = defineCollection({ loader: glob({ pattern: '**/*.yaml', base: './src/content/glossary' }), schema: termSchema });
const paths = defineCollection({ loader: glob({ pattern: '**/*.yaml', base: './src/content/paths' }), schema: pathSchema });
export const collections = { topics, quizzes, glossary, paths };
```
(One YAML file per glossary term: `src/content/glossary/free-variable.yaml` etc.; `id` field optional because the loader derives it from the filename.)

- [ ] **Step 5: Write `src/lib/content.ts`**

```ts
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { Locale } from '@/lib/urls';
import { parseTopicId } from '@/lib/content-ids';
export type Topic = CollectionEntry<'topics'>;
export function isPublic(t: Topic): boolean { return import.meta.env.DEV || t.data.status === 'reviewed'; }
export async function getTopic(track: string, slug: string, lang: Locale): Promise<Topic | undefined> { return getEntry('topics', `${track}/${slug}/${lang}`); }
export async function getPair(track: string, slug: string) { const [en, zh] = await Promise.all([getTopic(track, slug, 'en'), getTopic(track, slug, 'zh')]); return { en, zh }; }
export async function listTopics(lang: Locale, f: { track?: string; section?: string } = {}): Promise<Topic[]> {
  const all = await getCollection('topics', (t) => parseTopicId(t.id).lang === lang && isPublic(t) && (!f.track || t.data.track === f.track) && (!f.section || t.data.section === f.section));
  return all.sort((a, b) => a.data.title.localeCompare(b.data.title));
}
export function topicMeta(t: Topic) { return parseTopicId(t.id); }
```

- [ ] **Step 6: Write the sample content.** `python/closures.{en,zh}.mdx` must contain: frontmatter per schema (`status: reviewed`, `reviewed: 2026-09-03`, `verified: { version: "Python 3.14", date: 2026-09-03 }`, `terms: [free-variable, enclosing-scope, late-binding, cell]`, `quiz: python/closures`, `prerequisites: [python/functions, python/scope-legb]`, `related: [python/decorators, python/functools]`); body using the components defined in Task 11 exactly as in the mockup `Topic.dc.html` (TL;DR with three cells, sections "What a closure is", "Late binding: the trap", a runnable fence ` ```python run title="make_counter.py" `, a `> [!PITFALL]` callout, an "In the AI era" section, a `<Depth level="deep">` section "How CPython stores cells", a `<Checkpoint id="python/closures" />`). The zh file is the faithful translation with identical structure and code. `javascript/event-loop.{en,zh}.mdx`: a shorter topic (~120 lines) with one runnable ` ```js run ` fence whose output is `1 4 3 2` for the classic `console.log(1); setTimeout(()=>console.log(2)); Promise.resolve().then(()=>console.log(3)); console.log(4)` example, `status: reviewed`. Glossary: `free-variable.yaml`, `enclosing-scope.yaml`, `late-binding.yaml`, `cell.yaml`, `closure.yaml`, `event-loop.yaml`, `microtask.yaml` with bilingual `short`. Quiz `python/closures.yaml`: 1 `predict` (the `[2, 2, 2]` puzzle) + 2 `mcq`. Path `python-from-zero.yaml` with 5 milestones using the topic ids from spec §Path mockup (topics that do not exist yet are allowed in the path file; the page marks them "coming soon").

- [ ] **Step 7: Verify** `pnpm astro sync` succeeds, `pnpm test` passes; add `tests/unit/content-fixtures.test.ts` that parses each sample MDX frontmatter with `gray-matter` + `topicSchema` and each YAML with its schema (use `yaml` package: `pnpm add yaml`).

- [ ] **Step 8: Update STATUS.md and commit** `git add -A && git commit -m "feat: content collections, schemas and sample bilingual topics"`

---

### Task 7: SEO library

**Files:**
- Create: `src/lib/seo.ts`
- Test: `tests/unit/seo.test.ts`

**Interfaces:**
- Produces: `buildHead(input: HeadInput): HeadModel` where `HeadInput = { locale, path, title, description, kind: 'home'|'track'|'topic'|'glossary'|'page', trackName?, ogImagePath?, noindex? }` and `HeadModel = { title: string; description: string; canonical: string; alternates: { hreflang: string; href: string }[]; og: Record<string,string>; twitter: Record<string,string>; jsonLd: object[] }`; `techArticleLd(...)`, `breadcrumbLd(items)`, `websiteLd(locale)`, `courseLd(path)`, `definedTermLd(term)`.

- [ ] **Step 1: Failing tests**

```ts
import { buildHead, breadcrumbLd } from '@/lib/seo';
describe('buildHead', () => {
  it('formats titles per locale', () => {
    expect(buildHead({ locale: 'en', path: '/python/closures/', title: 'Closures', description: 'd', kind: 'topic', trackName: 'Python' }).title).toBe('Closures · Python · codewiki');
    expect(buildHead({ locale: 'zh', path: '/zh/python/closures/', title: '闭包', description: 'd', kind: 'topic', trackName: 'Python' }).title).toBe('闭包｜Python｜codewiki');
    expect(buildHead({ locale: 'en', path: '/', title: '', description: 'd', kind: 'home' }).title).toBe('codewiki · Master code in the AI era');
  });
  it('emits canonical and three alternates', () => {
    const h = buildHead({ locale: 'zh', path: '/zh/python/', title: 'Python', description: 'd', kind: 'track' });
    expect(h.canonical).toBe('https://codewiki.com/zh/python/');
    expect(h.alternates).toEqual([
      { hreflang: 'en', href: 'https://codewiki.com/python/' },
      { hreflang: 'zh-Hans', href: 'https://codewiki.com/zh/python/' },
      { hreflang: 'x-default', href: 'https://codewiki.com/python/' },
    ]);
  });
  it('defaults og image to the generated endpoint', () => {
    expect(buildHead({ locale: 'en', path: '/python/closures/', title: 'Closures', description: 'd', kind: 'topic', trackName: 'Python' }).og['og:image']).toBe('https://codewiki.com/og/python/closures.png');
  });
});
describe('breadcrumbLd', () => {
  it('numbers positions from 1', () => {
    const ld = breadcrumbLd([{ name: 'Python', url: 'https://codewiki.com/python/' }, { name: 'Closures', url: 'https://codewiki.com/python/closures/' }]) as { itemListElement: { position: number }[] };
    expect(ld.itemListElement.map(i => i.position)).toEqual([1, 2]);
  });
});
```

- [ ] **Step 2: Run, expect failure. Step 3: Implement** with `SITE.url` from `src/data/site.ts` and `alternates()` from `urls.ts`; OG image path = `/og${stripLocale(path).replace(/\/$/, '') || '/home'}.png` with `?l=zh` appended for zh (the OG endpoint accepts a locale query only at build time via separate paths: `/og/zh/python/closures.png` for zh — use that form instead of a query). `og:type` `article` for topics, `website` otherwise; `og:locale` `en_US` / `zh_CN`; twitter `summary_large_image`. JSON-LD builders return plain objects with `@context: 'https://schema.org'`.

- [ ] **Step 4: Run tests, expect pass. Commit** `git commit -am "feat: SEO head and JSON-LD builders"`

---

### Task 8: Layout shell, navigation, footer and 404

**Files:**
- Create: `src/layouts/Base.astro`, `src/components/Seo.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`, `src/components/LangSwitch.astro`, `src/components/Seg.astro`, `src/components/Tag.astro`, `src/components/Kbd.astro`, `src/components/Icon.astro`, `src/components/Button.astro`, `src/pages/404.astro`
- Modify: `src/pages/index.astro` (use Base)

**Interfaces:**
- Consumes: `buildHead`, `t`, `ThemeToggle`, `ThemeScript`.
- Produces: `<Base locale head={HeadModel} width="home"|"topic">` slot-based layout; `Icon name="search|moon|sun|monitor|check|play|copy|chevron-down|arrow-right|warning|info|menu|close|external"`; `Seg items=[{label, value, on}]`; `Tag variant="default|acc|ok|warn"`.

- [ ] **Step 1: Write `Icon.astro`** as a `switch` over `name` rendering the inline SVGs used in the mockups (stroke `currentColor`, width/height from `size` prop default 16, `aria-hidden="true"`). Write a unit test `tests/unit/icons.test.ts` that reads the file and asserts every name in the list above has a `case`.

- [ ] **Step 2: Write `Base.astro`**: `<html lang={locale === 'zh' ? 'zh-Hans' : 'en'} data-theme>` with `<ThemeScript />` first in `<head>`, `<Seo head={head} />` (renders title, description, canonical, alternates as `<link rel="alternate" hreflang>`, og/twitter metas, `<script type="application/ld+json">` per object, `<link rel="icon">`, `<meta name="viewport">`, `<link rel="alternate" type="application/rss+xml">`), global.css import, skip link, `<Nav locale currentPath />`, `<main id="main">` slot, `<Footer locale currentPath />`. Nav and Footer markup/classes follow `docs/design/mockups/Main.dc.html` (nav 56px, container `--w-home` or `--w-topic` by `width` prop, search box opens the palette — a plain `<button>` with `data-palette-open` until Task 15 replaces the behaviour, `LangSwitch` as the EN/中文 segment linking to `alternates(currentPath)`, `ThemeToggle client:idle`). Mobile (< 768px): logo + search icon + menu button that toggles a `<details>`-based menu (no JS island).

- [ ] **Step 3: Write `404.astro`** (en copy with a zh line, links home in both locales) and switch `index.astro` to `Base` with a temporary body.

- [ ] **Step 4: Verify** `pnpm build` then inspect `dist/index.html` for hreflang links and JSON-LD; `pnpm dev` at 390px shows the mobile nav.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: base layout, navigation, footer and 404"`

---

### Task 9: Home page

**Files:**
- Create: `src/pages-shared/Home.astro`, `src/islands/PersonalStrip.tsx`, `src/components/TrackCard.astro`, `src/lib/prefs.ts`
- Modify: `src/pages/index.astro`, create `src/pages/zh/index.astro`
- Test: `tests/unit/prefs.test.ts`

**Interfaces:**
- Consumes: `TRACKS`, `HOME_TRACKS`, `t`, `Base`.
- Produces: `src/lib/prefs.ts` typed store: `readStore<T>(key, fallback)`, `writeStore(key, value)`, `KEYS = { prefs: 'cw:v1:prefs', progress: 'cw:v1:progress', flashcards: 'cw:v1:flashcards', recents: 'cw:v1:recents' }`, `Progress` type per spec §6.2, `getContinue(progress): { id, readPct } | null` (most recent `lastAt`), `dueFlashcards(cards, now): number`.

- [ ] **Step 1: Failing tests for prefs helpers**

```ts
import { getContinue, dueFlashcards } from '@/lib/prefs';
describe('prefs helpers', () => {
  it('picks the most recently read topic', () => {
    expect(getContinue({ topics: { 'python/closures': { readPct: 38, lastAt: '2026-09-02T10:00:00Z' }, 'go/basics': { readPct: 90, lastAt: '2026-09-01T10:00:00Z' } }, quizzes: {}, paths: {} })).toEqual({ id: 'python/closures', readPct: 38 });
    expect(getContinue({ topics: {}, quizzes: {}, paths: {} })).toBeNull();
  });
  it('counts due cards', () => {
    const now = new Date('2026-09-03T00:00:00Z');
    expect(dueFlashcards([{ id: 'a', kind: 'term', ref: 'x', due: '2026-09-01', interval: 1, ease: 2.5, reps: 1 }, { id: 'b', kind: 'term', ref: 'y', due: '2026-09-09', interval: 7, ease: 2.5, reps: 2 }], now)).toBe(1);
  });
});
```

- [ ] **Step 2: Run, fail. Step 3: Implement `prefs.ts`** (pure helpers + browser-guarded `readStore`/`writeStore` with try/catch and a 500 ms debounced `writeStoreDebounced`).

- [ ] **Step 4: Build `Home.astro`** reproducing `Main.dc.html` section by section with `t()` strings: nav (from Base), hero (left column; right column is the static palette mock rendered from the same `Palette` markup component created in Task 15 — for now render the static panel markup with three sample rows sourced from `listTopics`), personal strip (`<PersonalStrip client:idle locale />` renders nothing server-side; on the client it renders the three `.cont` cards only if `getContinue` or due cards exist), feature grid (6 cells from `t`), tracks (from `HOME_TRACKS` via `TrackCard`, "All tracks" links to `/tracks/` — add a simple `src/pages-shared/Tracks.astro` + `pages/tracks/index.astro` (+zh) listing all 22 grouped by kind), modes, bilingual + Ask-AI band (static copy), footer (from Base). Verified chips come from `src/data/versions.ts` (`VERSIONS = [{ label: 'Python 3.14' }, …]`, exported constant, editable).

- [ ] **Step 5: `src/pages/index.astro`** → `<Home locale="en" />`; `src/pages/zh/index.astro` → `<Home locale="zh" />`.

- [ ] **Step 6: Verify** both locales build; compare visually with the mockup at 1440px (light and dark).

- [ ] **Step 7: Commit** `git add -A && git commit -m "feat: home page in both locales with personal strip"`

---

### Task 10: Track hub page

**Files:**
- Create: `src/pages-shared/TrackHub.astro`, `src/components/TopicCard.astro`, `src/components/Breadcrumb.astro`, `src/components/ProgressRing.astro`, `src/islands/TrackProgress.tsx`, `src/pages/[track]/index.astro`, `src/pages/zh/[track]/index.astro`

**Interfaces:**
- Consumes: `listTopics`, `getTrack`, `buildHead`, `breadcrumbLd`.
- Produces: `getStaticPaths` over `TRACKS`; `TopicCard` props `{ topic: Topic, locale, state?: 'done'|'current'|'none' }`.

- [ ] **Step 1: Implement `[track]/index.astro`** with `getStaticPaths` returning every track slug (both pages files, `zh` passes `locale="zh"`). `TrackHub.astro` follows `TrackHub.dc.html`: header (glyph, name, description from `tracks.ts`, chips: topic count, section count, "verified {version}" where version is the most common `verified.version` among the track's public topics, `beginner → advanced`), quick links (cheatsheet/interview/compare/playground: render as links to `/cheatsheets/{track}/`, `/practice/interview/{track}/`, `/compare/`, `/playground/?lang={track}` — pages that do not exist yet get `aria-disabled` and a "soon" tag), recommended path card (first path in `paths` whose `tracks` includes this track; else hidden), filter row (static segments; filtering is client-side via `data-difficulty` attributes and a tiny inline script), sections in the order of `tracks.ts` with `TopicCard`s; sections with zero public topics render as a collapsed row with "coming soon". Right rail: `TrackProgress client:idle` (ring from local progress; server renders 0), "recently reviewed" (top 3 by `reviewed` date), Ask-AI card (static prompt text from `t`), related links.

- [ ] **Step 2: Add an e2e test** `tests/e2e/track.spec.ts`: `/python/` shows "Closures" card; `/zh/python/` shows "闭包"; hreflang links present.

- [ ] **Step 3: Verify and commit** `git add -A && git commit -m "feat: track hub pages"`

---

### Task 11: Markdown pipeline and MDX components

**Files:**
- Create: `src/markdown/shiki-meta.ts`, `src/markdown/rehype-codebox.ts`, `src/markdown/remark-callouts.ts`, `src/markdown/remark-depth.ts`, `src/lib/reading-time.ts`, `src/components/TLDR.astro`, `src/components/Depth.astro`, `src/components/Callout.astro`, `src/components/Term.astro`, `src/components/Checkpoint.astro` (P1 renders a placeholder card "Checkpoint available in Practice" linking to the quiz id; P2 replaces it), `src/components/mdx.ts`
- Modify: `astro.config.mjs` (markdown config)
- Test: `tests/unit/markdown.test.ts`, `tests/unit/reading-time.test.ts`

**Interfaces:**
- Produces: fence meta grammar: ` ```python run title="make_counter.py" ` → `<figure class="codebox" data-lang="python" data-run="true" data-title="make_counter.py"><div class="codehead">…<button data-copy>…</button><button data-run>Run</button></div><pre>…</pre><div class="out" hidden></div></figure>`; `> [!PITFALL]`, `[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!AI]` → `<aside class="callout callout-pitfall" role="note"><p class="callout-label">Pitfall</p>…</aside>`; `<Depth level="quick|deep">` → `<section data-depth="deep"><div class="depth-teaser">…first heading text…</div><div class="depth-body">…</div></section>`; frontmatter `readingTime: { quick, standard, deep }` minutes and `words: {…}` injected by `remark-depth`; `computeReadingTime(words: number, locale): number` (en 220 wpm, zh 380 cpm, code lines count 4 words each, min 1).

- [ ] **Step 1: Failing tests**

```ts
// tests/unit/reading-time.test.ts
import { computeReadingTime } from '@/lib/reading-time';
describe('reading time', () => {
  it('rounds up and never returns 0', () => { expect(computeReadingTime(0, 'en')).toBe(1); expect(computeReadingTime(660, 'en')).toBe(3); expect(computeReadingTime(760, 'zh')).toBe(2); });
});
```
```ts
// tests/unit/markdown.test.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkCallouts } from '@/markdown/remark-callouts';
import { parseFenceMeta } from '@/markdown/shiki-meta';
describe('parseFenceMeta', () => {
  it('parses run and title', () => { expect(parseFenceMeta('run title="make_counter.py"')).toEqual({ run: true, title: 'make_counter.py' }); expect(parseFenceMeta('')).toEqual({ run: false }); expect(parseFenceMeta('title="a b.py" highlight="2-3"')).toEqual({ run: false, title: 'a b.py', highlight: '2-3' }); });
});
describe('remarkCallouts', () => {
  it('turns a GitHub-style alert into an aside', async () => {
    const out = await unified().use(remarkParse).use(remarkCallouts).use(remarkRehype, { allowDangerousHtml: true }).use(rehypeStringify, { allowDangerousHtml: true }).process('> [!PITFALL]\n> Do not do this.');
    expect(String(out)).toContain('<aside class="callout callout-pitfall"');
    expect(String(out)).toContain('Do not do this.');
  });
});
```
Install test-only deps: `pnpm add -D unified remark-parse remark-rehype rehype-stringify`.

- [ ] **Step 2: Run, fail. Step 3: Implement** `reading-time.ts`; `shiki-meta.ts` exporting `parseFenceMeta(meta: string)` and `shikiMetaTransformer` (a Shiki transformer whose `pre(node)` reads `this.options.meta?.__raw`, parses it, and sets `node.properties['data-title']`, `data-run`, `data-highlight`, `data-lang`); `rehype-codebox.ts` (visit `pre > code` elements with `data-lang`, wrap in the figure markup above, header contains the title (or the language), Copy button with `data-copy`, Run button only when `data-run`, and an empty `.out` container); `remark-callouts.ts` (blockquote whose first paragraph starts with `[!TYPE]` → `html` node wrapper around the remaining children; labels localised by a `labels` option `{ pitfall: 'Pitfall', … }` passed per locale — since the plugin runs once for all files, emit `data-callout="pitfall"` and let CSS `::before` with `content: attr(data-label)` fill the label from a `data-label` set by the Astro layout via a small map; simplest: emit `<p class="callout-label">` with the English label and let the zh page override via `html[lang=zh-Hans] .callout-pitfall .callout-label { … }` using CSS `content` from a lookup in `global.css`); `remark-depth.ts` (walks `mdxJsxFlowElement` nodes named `Depth`, tallies words under `quick`, `deep` and the rest as `standard`, computes cumulative `quick`, `standard = quick + standard`, `deep = all`, writes `file.data.astro.frontmatter.readingTime` and `.words`).

- [ ] **Step 4: Register in `astro.config.mjs`** under the keys recorded in `docs/dev/astro7-notes.md` (for MDX 8: `mdx({ remarkPlugins: [remarkCallouts, remarkDepth], rehypePlugins: [rehypeCodebox], shikiConfig: { theme: 'css-variables', transformers: [shikiMetaTransformer] } })` or the global `markdown` config if MDX inherits it). Map the Shiki `css-variables` theme variables (`--astro-code-color-text`, `--astro-code-token-keyword`, `-string`, `-function`, `-comment`, `-constant`, `-punctuation`) to the tokens in `tokens.css` (`--code-ink`, `--k`, `--s`, `--f`, `--c`, `--n`).

- [ ] **Step 5: Write the components.** `TLDR.astro` (three `<div>` cells with `label` props `what/trap/fix` default; slot children are `<TLDR.Cell label="what">…</TLDR.Cell>` — implement as `TLDR.astro` + `TLDRCell.astro`), `Depth.astro`, `Callout.astro` (for explicit use), `Term.astro` (`<span class="term" data-term={id} tabindex="0">`), `Checkpoint.astro` placeholder, `src/components/mdx.ts` exporting `{ TLDR, TLDRCell, Depth, Callout, Term, Checkpoint }` and mapping `pre` untouched. Add the `.callout-*` and `.depth-*` CSS to `global.css` (pitfall uses `--warn`/`--warn-soft` border+background; AI callout uses `--acc2`).

- [ ] **Step 6: Add a copy-button inline script** in `Base.astro`: event delegation on `[data-copy]` copying the sibling `<pre>` text, swapping the label to `t('code.copied')` for 1.5 s (labels passed through `data-copied` attribute set by `rehype-codebox`? The plugin has no locale; instead the layout sets `document.documentElement.dataset.copied = t('code.copied')` and the script reads it).

- [ ] **Step 7: Run unit tests (pass), build, open the sample topic in dev (Task 12 provides the page; until then verify via `astro build` output HTML in `dist/` is not available — acceptable to defer visual check to Task 12).**

- [ ] **Step 8: Commit** `git add -A && git commit -m "feat: markdown pipeline with code meta, callouts, depth levels and MDX components"`

---

### Task 12: Topic page, TOC, depth dial

**Files:**
- Create: `src/pages-shared/Topic.astro`, `src/components/MetaPanel.astro`, `src/components/PrevNext.astro`, `src/components/ActionRow.astro`, `src/components/SectionTree.astro`, `src/islands/DepthDial.tsx`, `src/islands/Toc.tsx`, `src/islands/ReadTracker.tsx`, `src/lib/depth.ts`, `src/pages/[track]/[slug].astro`, `src/pages/zh/[track]/[slug].astro`
- Test: `tests/unit/depth.test.ts`, `tests/e2e/topic.spec.ts`

**Interfaces:**
- Produces: `type Depth = 'quick'|'standard'|'deep'`; `readDepth(storage, urlSearch): Depth` (URL `?depth=` wins once, else prefs, else `standard`); `applyDepth(root: HTMLElement, depth)` sets `data-depth-mode` on the article root; `filterHeadings(headings, depthOfHeading, mode)`; article root id `#article`; every heading inside `<Depth level="deep">` is marked by `rehype` with `data-depth="deep"` (extend `rehype-codebox.ts` or add `rehype-depth-headings.ts` that copies the nearest ancestor `section[data-depth]` value onto headings) so the TOC can dim/hide them.

- [ ] **Step 1: Failing tests**

```ts
import { readDepth, filterHeadings } from '@/lib/depth';
describe('depth', () => {
  const storage = { getItem: (k: string) => (k === 'cw:v1:prefs' ? JSON.stringify({ depth: 'deep' }) : null), setItem: () => {} };
  it('url overrides prefs, prefs override default', () => { expect(readDepth(storage, '?depth=quick')).toBe('quick'); expect(readDepth(storage, '')).toBe('deep'); expect(readDepth({ getItem: () => null, setItem: () => {} }, '')).toBe('standard'); });
  it('filters headings by mode', () => {
    const hs = [{ slug: 'a', text: 'A', depth: 2, level: 'standard' }, { slug: 'b', text: 'B', depth: 2, level: 'deep' }];
    expect(filterHeadings(hs, 'standard').map(h => h.slug)).toEqual(['a', 'b']);
    expect(filterHeadings(hs, 'standard')[1]).toMatchObject({ dimmed: true });
    expect(filterHeadings(hs, 'quick')).toHaveLength(0);
  });
});
```
(`quick` shows no section headings in the TOC, only the TL;DR and checkpoint anchors; encode that rule.)

- [ ] **Step 2: Run, fail. Step 3: Implement `depth.ts`.**

- [ ] **Step 4: Build `Topic.astro`** following `Topic.dc.html`: `getStaticPaths` from `listTopics(locale)` (track/slug params from `parseTopicId`), `render(entry)` → `Content`, `headings`, `remarkPluginFrontmatter.readingTime`; three-column grid (`SectionTree` from `tracks.ts` sections + `listTopics` for the track, current highlighted, read state from progress via a tiny island or CSS class set by `ReadTracker`); header (breadcrumb tags, H1, description as subtitle, `MetaPanel` with level / time / checked / status incl. the transparency line "Drafted with AI · verified by running the code · reviewed {date}"), depth tabs + bilingual segment (bilingual disabled with a tooltip "coming soon" in P1), `<Content components={mdxComponents} />` inside `<article id="article" data-depth-mode>`, `PrevNext` (prerequisites → "before this", `related` → "next up"; missing topics render as plain text), `ActionRow` (Ask-AI island slot from Task 16, Copy as Markdown link to the `.md` twin, Add to flashcards (disabled in P1), Edit on GitHub `SITE.repo + '/edit/main/src/content/topics/' + filePath`, "Was this clear?" two links with `mailto:`-free behaviour: they only set a local flag), right rail (`Toc client:idle` with active-heading tracking via IntersectionObserver and depth filtering; "your path" card only if a path contains this topic; terms list from `entry.data.terms` resolved against the glossary collection with zh labels).

- [ ] **Step 5: Implement `DepthDial.tsx`** (segment control; on change: `writeStore` prefs.depth, `applyDepth`, dispatch `cw:depth` event consumed by `Toc`) and `ReadTracker.tsx` (IntersectionObserver over `article h2`, writes `progress.topics[id].readPct` debounced; marks 100 when the last section is seen). Add CSS in `global.css`:

```css
[data-depth-mode="quick"] [data-depth="standard"], [data-depth-mode="quick"] section[data-depth="deep"] .depth-body, [data-depth-mode="standard"] section[data-depth="deep"] .depth-body { display: none; }
[data-depth-mode="deep"] .depth-teaser { display: none; }
```
Unmarked standard blocks: `remark-depth` (Task 11) wraps consecutive non-Depth block nodes into `<div data-depth="standard">` only when the file contains a `quick` block, otherwise quick mode shows TL;DR + first code block via `[data-depth-mode="quick"] .prose > :not(.tldr):not(.codebox:first-of-type) { display: none }` — implement the wrapping approach (deterministic) and drop the CSS fallback.

- [ ] **Step 6: e2e test** `tests/e2e/topic.spec.ts`: visit `/python/closures/`, expect H1 "Closures", TL;DR cells, code figure with Run button; click "Deep" → `data-depth-mode="deep"`, reload → still deep; `/zh/python/closures/` has `html[lang="zh-Hans"]` and the zh title; hreflang links; JSON-LD `TechArticle` present.

- [ ] **Step 7: Build, run e2e (`pnpm build && pnpm test:e2e`), update STATUS.md, commit** `git add -A && git commit -m "feat: topic page with TOC, depth dial and read tracking"`

---

### Task 13: Runnable code (JS, TS, Python)

**Files:**
- Create: `src/lib/runners/protocol.ts`, `src/lib/runners/js.ts`, `src/lib/runners/python.ts`, `src/lib/runners/index.ts`, `src/islands/CodeRunners.tsx`, `public/sandbox.html`, `scripts/vendor-pyodide.mjs`
- Modify: `src/pages-shared/Topic.astro` (mount `CodeRunners client:visible` once per page when any `data-run` exists), `.gitignore`
- Test: `tests/unit/runners.test.ts`, `tests/e2e/run.spec.ts`

**Interfaces:**
- Produces: `type RunRequest = { id: string; lang: 'js'|'ts'|'python'; code: string }`, `type RunEvent = { id: string; kind: 'stdout'|'stderr'|'done'|'error'; text?: string; ms?: number }`; `runJs(req, onEvent, { timeoutMs = 5000 })` posts to a sandboxed iframe (`/sandbox.html`, `sandbox="allow-scripts"`, no same-origin) that evals the code with `console.*` patched to `postMessage`; TS is transpiled in the parent with `esbuild-wasm` (`transform(code, { loader: 'ts' })`, wasm loaded from `/vendor/esbuild.wasm`); `runPython(req, onEvent)` lazy-loads `/vendor/pyodide/pyodide.js`, runs with `pyodide.setStdout({ batched })`, catches `PythonError` → `stderr`; `normalizeLang('py'|'python'|'js'|'javascript'|'ts'|'typescript')`.

- [ ] **Step 1: Failing tests** for pure parts: `normalizeLang`, `parseRunEvent` (validates messages from the iframe: rejects objects without a known `id`), `timeoutRace(promise, ms)`.

- [ ] **Step 2: Run, fail. Step 3: Implement** protocol + runners. `public/sandbox.html` is a minimal page: listens for `{ id, code }`, wraps `console.log/error/warn` to `parent.postMessage({ id, kind, text }, '*')`, runs `new Function(code)()` inside try/catch (async: wrap in `(async () => { … })()` and post `done` after `await`), posts `error` with `String(err)`. The parent creates one hidden iframe per run and removes it on `done`/timeout. `scripts/vendor-pyodide.mjs` copies `pyodide.js`, `pyodide.asm.js`, `pyodide.asm.wasm`, `python_stdlib.zip`, `pyodide-lock.json` from `node_modules/pyodide/` into `public/vendor/pyodide/` and `node_modules/esbuild-wasm/esbuild.wasm` into `public/vendor/esbuild.wasm`; add `public/vendor/` to `.gitignore`; run it in `pnpm build` via `prebuild` script.

- [ ] **Step 4: `CodeRunners.tsx`**: on mount, query all `figure.codebox[data-run]`, for each attach: Run click → replace `<pre>` with a `<textarea>`-backed editor? No: keep it simple — the `<pre>` becomes `contenteditable="true"` with `spellcheck=false` when the user clicks into it (plain-text editing; syntax colours vanish while editing — acceptable in P1; note in STATUS for P2 CodeMirror), Reset restores the original HTML; Run reads `pre.textContent`, streams events into `.out` (`stdout` lines prefixed with a muted `›`, stderr in `--bad`, "exit 0 · 41 ms" footer), disables the button while running with `t('code.running')`, and for Python shows `t('code.loadingPython')` on first load.

- [ ] **Step 5: e2e** `tests/e2e/run.spec.ts`: on `/javascript/event-loop/` click Run on the first figure, expect `.out` to contain `1`, `4`, `3`, `2` in order; on `/python/closures/` click Run, expect `.out` to contain `1 2 3` (allow 60 s for Pyodide; skip the Python test when `process.env.CI_FAST` is set).

- [ ] **Step 6: Build + e2e pass, commit** `git add -A && git commit -m "feat: in-browser runners for JavaScript, TypeScript and Python"`

---

### Task 14: Glossary pages and term tooltips

**Files:**
- Create: `src/pages-shared/Glossary.astro`, `src/pages-shared/GlossaryTerm.astro`, `src/pages/glossary/index.astro`, `src/pages/glossary/[term].astro`, `src/pages/zh/glossary/index.astro`, `src/pages/zh/glossary/[term].astro`, `src/islands/Terms.tsx`
- Modify: `src/pages-shared/Topic.astro` (embed `<script type="application/json" id="cw-terms">` with the page's terms and mount `Terms client:idle`), `src/lib/seo.ts` (`definedTermLd` already; `definedTermSetLd`)

- [ ] **Step 1: Glossary index**: alphabetical list (en) with zh label and `short` in the page locale, `DefinedTermSet` JSON-LD, Pagefind meta `data-pagefind-meta="type:glossary"`. Term page: term, zh/en counterpart, `short`, linked topics (resolve `topics[]` against public topics), `DefinedTerm` JSON-LD, breadcrumbs.

- [ ] **Step 2: `Terms.tsx`**: reads the JSON, attaches hover/focus tooltip (`role="tooltip"`, positioned below the term, closes on Escape/blur) showing `en · zh` and `short`, with a link to the term page. Keyboard reachable (`tabindex=0` on `.term` from Task 11).

- [ ] **Step 3: e2e** addition in `topic.spec.ts`: hovering `.term` shows a tooltip containing `自由变量` on the en page.

- [ ] **Step 4: Commit** `git add -A && git commit -m "feat: glossary pages and term tooltips"`

---

### Task 15: Search: Pagefind index and command palette

**Files:**
- Create: `src/islands/Palette.tsx`, `src/lib/search.ts`, `src/pages-shared/Search.astro`, `src/pages/search.astro`, `src/pages/zh/search.astro`
- Modify: `src/layouts/Base.astro` (mount `Palette client:idle` once, `data-palette-open` buttons, `⌘K`/`Ctrl+K` listener), `src/pages-shared/Topic.astro`, `TrackHub.astro`, `Home.astro`, `Glossary*.astro` (add `data-pagefind-body`, `data-pagefind-filter="lang:{locale}"`, `data-pagefind-meta="type:topic,track:{trackName}"`), `package.json` (`build` already runs `pagefind --site dist`)
- Test: `tests/unit/search.test.ts`, `tests/e2e/search.spec.ts`

**Interfaces:**
- Produces: `groupResults(results: PagefindResultData[]): { topics, glossary, paths, other }` keyed by `meta.type`; `recentPages(storage)` / `pushRecent(storage, url, title)` (max 8) in `cw:v1:recents`; Palette opens on `⌘K`, button click, or `/` when no input is focused; keyboard: `↑↓` move, `↵` open, `Esc` close; `⌘↵` opens `/playground/?from={url}` (route exists in P2; in P1 the hint is hidden).

- [ ] **Step 1: Failing tests** for `groupResults` and `pushRecent` (dedupe, cap at 8, most recent first).

- [ ] **Step 2: Run, fail. Step 3: Implement `search.ts`.** `Palette.tsx`: lazy `import('/pagefind/pagefind.js')` on first open (`/* @vite-ignore */`), `pagefind.search(q, { filters: { lang: locale } })`, load up to 12 results' `data()`, render groups per the mockup rows (tag by type/track glyph, title, meta line), "Search runs offline" footer, recents when the query is empty; falls back to a link to `/search/` when Pagefind fails to load (dev mode has no index: show "Index is built with `pnpm build`").

- [ ] **Step 4: `Search.astro`** fallback page with a plain `<form>` and the same island in "page" mode (results inline).

- [ ] **Step 5: e2e** `search.spec.ts`: press `Control+K` on `/`, type `closure`, expect a result linking to `/python/closures/`; on `/zh/`, type `闭包`, expect `/zh/python/closures/`.

- [ ] **Step 6: Build + e2e pass, update STATUS.md, commit** `git add -A && git commit -m "feat: Pagefind index and command palette"`

---

### Task 16: Ask-AI prompts and Markdown twin

**Files:**
- Create: `src/lib/prompts.ts`, `src/islands/AskAI.tsx`, `src/lib/markdown-twin.ts`, `src/pages/[track]/[slug].md.ts`, `src/pages/zh/[track]/[slug].md.ts`
- Modify: `src/pages-shared/Topic.astro` (mount AskAI in ActionRow and after each `h2` an "Ask AI about this section" ghost button rendered by a rehype step: add `rehype-section-actions.ts` that appends `<button class="sec-ask" data-section="{slug}">` after each h2 outside `Depth` teasers)
- Test: `tests/unit/prompts.test.ts`, `tests/unit/markdown-twin.test.ts`

**Interfaces:**
- Produces: `buildPrompt({ preset, locale, title, url, section, sectionText, language, prerequisite? })` returning the text of spec §14.2; presets `explain | quiz | bugs | compare | apply | feynman`; `deepLinks(prompt) → { claude: 'https://claude.ai/new?q=…', chatgpt: 'https://chatgpt.com/?q=…' }` (URL-encoded, prompt truncated to 6,000 chars with a `[…]` marker); `toPlainMarkdown(mdxSource, { locale, title, url }) → string`: strips frontmatter and `import`s, converts `<TLDR>`/`<TLDRCell label>` to a blockquote list, `<Depth level="deep">` to an HTML comment `<!-- deep -->` … `<!-- /deep -->`, `<Callout type>` and `> [!X]` to `> **X:**` blockquotes, `<Term id>x</Term>` to `x`, `<Checkpoint …/>` to a link line, keeps fences (drops `run`/`title` meta into a `# file: …` comment line inside the fence for python/js), and prepends `# {title}\n\nSource: {url}\n\n`.

- [ ] **Step 1: Failing tests**

```ts
import { buildPrompt, deepLinks } from '@/lib/prompts';
import { toPlainMarkdown } from '@/lib/markdown-twin';
describe('prompts', () => {
  it('embeds section text and answers in reader language', () => {
    const p = buildPrompt({ preset: 'explain', locale: 'zh', title: 'Closures', url: 'https://codewiki.com/python/closures/', section: 'Late binding', sectionText: 'Python looks up…', language: 'Python', prerequisite: 'loops' });
    expect(p).toContain('"Late binding"'); expect(p).toContain('Python looks up…'); expect(p).toMatch(/中文|Chinese/);
  });
  it('truncates and encodes deep links', () => {
    const long = 'x'.repeat(10_000);
    const links = deepLinks(long);
    expect(decodeURIComponent(links.claude.split('?q=')[1]).length).toBeLessThanOrEqual(6_010);
    expect(links.chatgpt.startsWith('https://chatgpt.com/?q=')).toBe(true);
  });
});
describe('toPlainMarkdown', () => {
  it('converts components to markdown', () => {
    const src = `---\ntitle: Closures\n---\nimport {TLDR} from '@/components/mdx';\n\n<TLDR><TLDRCell label="what">An inner function.</TLDRCell></TLDR>\n\n## What\n\nA <Term id="free-variable">free variable</Term> is…\n\n\`\`\`python run title="a.py"\nprint(1)\n\`\`\`\n\n<Depth level="deep">\n\n## Internals\n\ntext\n\n</Depth>\n`;
    const out = toPlainMarkdown(src, { locale: 'en', title: 'Closures', url: 'https://codewiki.com/python/closures/' });
    expect(out.startsWith('# Closures\n\nSource: https://codewiki.com/python/closures/')).toBe(true);
    expect(out).toContain('> - **what**: An inner function.');
    expect(out).toContain('A free variable is…');
    expect(out).toContain('```python\n# file: a.py\nprint(1)\n```');
    expect(out).toContain('<!-- deep -->');
    expect(out).not.toContain('import {TLDR}');
  });
});
```

- [ ] **Step 2: Run, fail. Step 3: Implement** both libraries (regex/line-based transforms are acceptable for the twin; keep functions small and covered by the tests above plus one for `> [!PITFALL]`).

- [ ] **Step 4: Endpoints**: `[track]/[slug].md.ts` with `getStaticPaths` over public topics of the locale, reads `entry.body` (raw MDX), returns `text/markdown; charset=utf-8`. `AskAI.tsx`: a popover listing presets, each with three actions (Claude, ChatGPT, Copy) that build the prompt from `document.title`, `location.href`, and the current section (nearest `h2` above the viewport middle, text collected until the next `h2`). Section buttons (`.sec-ask`) open the same popover pre-scoped to that section.

- [ ] **Step 5: Verify** `dist/python/closures.md` exists after build and matches the twin format; commit `git add -A && git commit -m "feat: Ask-AI prompts and Markdown twin endpoints"`

---

### Task 17: llms.txt, JSON API, RSS, robots, settings

**Files:**
- Create: `src/pages/llms.txt.ts`, `src/pages/llms/[track].txt.ts`, `src/pages/llms-full.txt.ts`, `src/pages/api/topics.json.ts`, `src/pages/api/glossary.json.ts`, `src/pages/api/paths.json.ts`, `src/pages/api/topics/[track]/[slug].json.ts`, `src/pages/rss.xml.ts`, `public/robots.txt`, `src/pages-shared/Settings.astro`, `src/islands/SettingsForm.tsx`, `src/pages/settings.astro`, `src/pages/zh/settings.astro`, `src/lib/export.ts`
- Test: `tests/unit/export.test.ts`, `tests/unit/llms.test.ts`

**Interfaces:**
- Produces: `buildLlmsIndex(topics, glossaryCount, pathsCount) → string` (H1 `# codewiki`, blockquote summary, `## Tracks` with one bullet per topic `- [Title](https://codewiki.com/python/closures.md): description` grouped by track, `## Chinese` mirror with `/zh/` links, `## Optional` with glossary/paths JSON links); `exportAll(storage) → { version: 1, exportedAt, data: Record<key, unknown> }`; `importAll(storage, payload, mode: 'merge'|'replace')` validating shape; concept card JSON `{ id, title, description, track, section, difficulty, terms: [{id,en,zh,short}], prerequisites, related, url, md, verified, reviewed }`.

- [ ] **Step 1: Failing tests** for `buildLlmsIndex` (contains the `.md` link for a sample topic, groups by track) and `exportAll`/`importAll` (merge keeps existing keys; replace overwrites; rejects payload without `version: 1`).

- [ ] **Step 2: Run, fail. Step 3: Implement** libs and endpoints (RSS: 50 most recently reviewed topics, both locales, `<language>` per item via separate feed items; use `@astrojs/rss` — `pnpm add @astrojs/rss`). `robots.txt`: allow all, `Sitemap: https://codewiki.com/sitemap-index.xml`. `Settings.astro` + `SettingsForm.tsx`: theme (3-state), default depth, bilingual default (disabled in P1), font size (sets `data-font` on `<html>` from prefs; CSS scales prose 15/16/17.5px), export (downloads a JSON via `<a download>`), import (file input → `importAll` with merge/replace choice), clear all (confirm dialog).

- [ ] **Step 4: Verify** `dist/llms.txt`, `dist/api/topics.json`, `dist/rss.xml` after build; commit `git add -A && git commit -m "feat: llms.txt, JSON API, RSS and settings"`

---

### Task 18: OG image generation

**Files:**
- Create: `src/pages/og/[...path].png.ts`, `src/lib/og.ts`
- Modify: `package.json` (`prebuild` runs `pnpm fonts && pnpm vendor:pyodide`), `.github/workflows/ci.yml` (cache `.cache/fonts`)
- Test: `tests/unit/og.test.ts`

**Interfaces:**
- Produces: `ogPaths()` → one path per public topic and track per locale (`python/closures`, `zh/python/closures`, `python`, `zh/python`, `home`, `zh/home`); `renderOg({ title, subtitle, track, locale, glyph }) → Buffer` (1200×630, light palette: `--bg` background, `--acc` glyph tag, Plex SemiBold title ≤ 3 lines, Plex Regular subtitle, `codewiki` wordmark bottom-left, `codewiki.com` bottom-right; zh titles use the Noto CJK face).

- [ ] **Step 1: Failing test** `renderOg` returns a PNG (buffer starts with `\x89PNG`) for an en and a zh title; skip when `.cache/fonts` is missing with a clear message.

- [ ] **Step 2: Run, fail. Step 3: Implement** with `satori` (JSX via `h` object literals, `fonts: [{ name: 'Plex', data, weight: 400 }, { name: 'Plex', data: semibold, weight: 600 }, { name: 'Noto', data: notoCjk, weight: 400 }]`, `fontFamily: 'Plex, Noto'`) and `@resvg/resvg-js`.

- [ ] **Step 3: Endpoint** with `getStaticPaths` from `ogPaths()`; `GET` renders and returns `image/png` with `Cache-Control: public, max-age=31536000, immutable`.

- [ ] **Step 4: Build; confirm `dist/og/python/closures.png` and `dist/og/zh/python/closures.png` open correctly. Commit** `git add -A && git commit -m "feat: build-time OG images with CJK support"`

---

### Task 19: E2E suite, performance budgets, deployment headers

**Files:**
- Create: `tests/e2e/home.spec.ts`, `tests/e2e/seo.spec.ts`, `tests/e2e/a11y.spec.ts`, `lighthouserc.json`, `public/_headers`, `docs/dev/deploy.md`
- Modify: `docs/superpowers/STATUS.md`

- [ ] **Step 1: e2e** — `home.spec.ts`: both locales render the H1 from the dictionary, theme toggle cycles `data-theme-pref` system→light→dark and persists across reload without a flash (assert `data-theme` is set before `DOMContentLoaded` by checking `document.documentElement.dataset.theme` in an `addInitScript` capture), LangSwitch links to the alternate URL. `seo.spec.ts`: `/sitemap-index.xml` exists and the child sitemap contains `/zh/python/closures/` with `xhtml:link` alternates; `/robots.txt`; every sampled page has exactly one `<link rel="canonical">`, three hreflang links and one `TechArticle`/`WebSite` JSON-LD. `a11y.spec.ts`: `pnpm add -D @axe-core/playwright`; run axe on `/`, `/python/`, `/python/closures/` in both themes; fail on `serious`/`critical` violations.

- [ ] **Step 2: `lighthouserc.json`**: `collect.staticDistDir: 'dist'`, urls `/`, `/python/`, `/python/closures/`, `/zh/python/closures/`; `assert.assertions`: `categories:performance >= 0.95`, `categories:accessibility >= 0.95`, `categories:best-practices >= 0.95`, `categories:seo >= 0.95`, `resource-summary:script:size <= 61440` on the topic URLs (`preset: 'lighthouse:no-pwa'`).

- [ ] **Step 3: `public/_headers`**

```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
/vendor/*
  Cache-Control: public, max-age=31536000, immutable
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/og/*
  Cache-Control: public, max-age=604800
```
(`'unsafe-inline'` for scripts is needed by the theme bootstrap; if Lighthouse best-practices penalises it, move the bootstrap to an external `theme.js` loaded with `blocking="render"` and drop `'unsafe-inline'` from `script-src`.)

- [ ] **Step 4: `docs/dev/deploy.md`**: Cloudflare Pages settings (build command `pnpm build`, output `dist`, Node 24 via `.nvmrc`, environment none), custom domain notes, and the statement that any static host works.

- [ ] **Step 5: Run everything** `pnpm lint && pnpm check && pnpm test && pnpm build && pnpm test:e2e && pnpm exec lhci autorun`; fix budget failures (typical: defer `Palette` to `client:idle`, ensure runners are only imported on click).

- [ ] **Step 6: Update STATUS.md** (P1 done; list P2 next) and commit `git add -A && git commit -m "test: e2e, accessibility and Lighthouse budgets; deployment headers"`

---

## Self-review notes (Fable, 2026-09-03)

- Spec coverage: §3 (routes, i18n) → Tasks 4, 8–10, 12, 14, 17; §4 schemas → Task 6; §5.1–5.3 → Tasks 9, 10, 12; §6 depth/runnable/palette/Ask-AI/twin/theme/settings → Tasks 12, 13, 15, 16, 17, 2; §6.1 P1 rows (In-the-AI-era block in sample content, transparency badge, Ask-AI presets, twin, llms.txt, JSON API) → Tasks 6, 12, 16, 17; §7 → Tasks 2, 3, 8; §8 → Tasks 1, 11, 13, 15, 18; §9 → Tasks 7, 17, 18, 19; §11 → every task's tests + Task 19. Bilingual mode, quizzes, paths pages, flashcards, playground, cheatsheets, compare are P2 by the spec's phasing and are deliberately absent here (the `Checkpoint` and "Add to flashcards" affordances render as placeholders).
- Type consistency: `Locale`, `t`, `buildHead`, `listTopics`, `parseTopicId`, `readStore/writeStore`, `Depth` type and `applyDepth`, `RunRequest/RunEvent`, `buildPrompt/deepLinks`, `toPlainMarkdown` are defined once and reused by name.
- Known uncertainty: exact Astro 7 MDX plugin config keys and the sitemap i18n shape — resolved in Task 0 before use.
