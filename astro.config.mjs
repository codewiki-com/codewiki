import { defineConfig } from 'astro/config';
import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

import pwa from './scripts/build-sw.mjs';

import { LEGACY_REDIRECTS } from './src/data/redirects.ts';
import { rehypeCodebox } from './src/markdown/rehype-codebox.ts';
import { rehypeDepthHeadings } from './src/markdown/rehype-depth-headings.ts';
import { rehypeMermaidDiagrams } from './src/markdown/mermaid.ts';
import { remarkCallouts } from './src/markdown/remark-callouts.ts';
import { remarkDepth } from './src/markdown/remark-depth.ts';
import { rehypeSectionActions } from './src/markdown/rehype-section-actions.ts';
import { shikiMetaTransformer } from './src/markdown/shiki-meta.ts';

export default defineConfig({
  site: 'https://codewiki.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Astro 7 defaults to 'jsx' whitespace handling, which drops line breaks between
  // inline elements. 'true' keeps the lossless v6 behaviour so authored prose is safe.
  compressHTML: true,
  /* The same six 301s `public/_redirects` declares. The rule file is what a CDN serves; these
     meta-refresh pages are what `astro preview` and any host without rule support serve, so an
     old URL never dead-ends. `tests/unit/redirects.test.ts` keeps the two lists in step. */
  redirects: { ...LEGACY_REDIRECTS },
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  // Astro 7 renders Markdown with Satteri by default; `unified()` (from @astrojs/markdown-remark)
  // keeps the remark/rehype pipeline these plugins are written against. MDX inherits this config
  // because `mdx()` sets no `processor` of its own.
  markdown: {
    processor: unified({
      remarkPlugins: [remarkCallouts, remarkDepth],
      // `rehypeHeadingIds` is Astro's own; it normally runs after the configured plugins, so
      // `rehype-section-actions` would not see the ids it needs. Running it here first is the
      // documented way round that, and its later pass leaves the ids it already wrote alone.
      rehypePlugins: [
        rehypeHeadingIds,
        rehypeMermaidDiagrams,
        rehypeCodebox,
        rehypeDepthHeadings,
        rehypeSectionActions,
      ],
    }),
    // Mermaid must reach its rehype renderer as an ordinary `pre > code` block.
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    // `css-variables` maps every token to a `--astro-code-*` custom property, which global.css
    // points at the palette tokens, so code colours follow the theme without a second stylesheet.
    shikiConfig: { theme: 'css-variables', transformers: [shikiMetaTransformer] },
  },
  integrations: [
    mdx(),
    preact(),
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', zh: 'zh-Hans' } },
      // Settings is `noindex`, search is a query interface and the offline notice only ever
      // renders without a network: none belongs in the sitemap, and listing an unindexable URL is
      // a Search Console warning. A 301 is not a document either.
      filter: (page) => {
        const { pathname } = new URL(page);
        if (Object.hasOwn(LEGACY_REDIRECTS, pathname)) return false;
        return !/^\/(zh\/)?(settings|search|offline)\/$/.test(pathname);
      },
    }),
    // Writes dist/sw.js once the real, content-hashed file names exist.
    pwa(),
  ],
  vite: { plugins: [tailwindcss()] },
});
