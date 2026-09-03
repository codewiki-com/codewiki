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
  // Astro 7 defaults to 'jsx' whitespace handling, which drops line breaks between
  // inline elements. 'true' keeps the lossless v6 behaviour so authored prose is safe.
  compressHTML: true,
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
