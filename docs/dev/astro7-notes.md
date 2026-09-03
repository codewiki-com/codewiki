# Astro 7 API notes (verified against the live docs)

Verified on 2026-09-03 against `https://docs.astro.build/en/...` (docs site for the current
release line). Every snippet below is copied verbatim from the documentation page linked
underneath it; comments inside the snippets are the docs' own comments. Anything that is my own
observation is written outside the fenced blocks.

Package versions on npm at time of verification (`registry.npmjs.org/<pkg>/latest`):

| package | version |
| --- | --- |
| `astro` | 7.3.1 |
| `@astrojs/mdx` | 8.0.0 |
| `@astrojs/sitemap` | 3.7.4 |
| `@astrojs/markdown-satteri` | 0.4.0 |
| `@astrojs/markdown-remark` | 7.3.0 |
| `@astrojs/preact` | 6.0.5 |

Items marked **verify at implementation time** are places where the docs are ambiguous or silent;
both readings are quoted so the implementer can settle it with a real build.

---

## 1. `src/content.config.ts`: `glob()`, `generateId`, and `z` from `astro/zod`

Full collection config as shown in the content collections guide:

```ts
// 1. Import utilities from `astro:content`
import { defineCollection } from 'astro:content';

// 2. Import loader(s)
import { glob, file } from 'astro/loaders';

// 3. Import Zod
import { z } from 'astro/zod';

// 4. Define a `loader` and `schema` for each collection
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
});

// 5. Export a single `collections` object to register your collection(s)
export const collections = { blog };
```

Source: <https://docs.astro.build/en/guides/content-collections/>

`generateId` in context (this is the docs' own example, from the loader reference):

```ts
import { defineCollection } from 'astro:content';

import { glob } from 'astro/loaders';

const authors = defineCollection({
  /* Retrieve all JSON files in your authors directory while retaining
   * uppercase letters in the ID. */
  loader: glob({
    pattern: '**/*.json',
    base: './src/data/authors',
    generateId: ({ entry }) => entry.replace(/\.json$/, ''),
  }),
});

export const collections = { authors };
```

Source: <https://docs.astro.build/en/reference/content-loader-reference/>

`glob()` reference, quoted verbatim from that same page:

- `glob()` type: `(options: GlobOptions) => Loader` — "Added in: `astro@5.0.0`".
- "This loader accepts an object with the following properties: `pattern`, `base` (optional),
  `generateId` (optional), `retainBody` (optional), and `deferRender` (optional)."
- `pattern` — Type: `string | string[]`. "The patterns must be relative to the base directory of
  entry files to match."
- `base` — Type: `string | URL`, Default `"."`. "A relative path or URL to the directory from which
  to resolve the `pattern`."
- `generateId()` — Type: `(options: GenerateIdOptions) => string`. "A callback function that returns
  a unique string per entry in a collection. It accepts an object as parameter with the following
  properties:
  - `entry` - the path to the entry file, relative to the base directory
  - `base` - the base directory URL
  - `data` - the parsed, unvalidated data of the entry

  By default it uses `github-slugger` to generate a slug with kebab-cased words."
- `retainBody` — Type `boolean`, Default `true`, "Added in: `astro@5.17.0`". When `false`,
  "`entry.body` will be `undefined`"; "For Markdown files, the rendered body will still be available
  in the `entry.rendered.html` property".
- `deferRender` — Type `boolean`, Default `false`, **"Added in: `astro@7.1.0`"**. "Whether to defer
  rendering Markdown entries until they are rendered in a page. When `false` (the default), their
  rendering occurs eagerly during content sync. This option does not apply to MDX, Markdoc, and data
  entries (e.g., JSON, YAML)." Useful if the build runs out of memory on a large collection.

Zod version: "To use Zod in Astro, import the `z` utility from `"astro/zod"`. This is a re-export of
the Zod library, and it supports all of the features of **Zod 4**."
(<https://docs.astro.build/en/guides/content-collections/>). Accordingly the docs use Zod-4 style
top-level format validators, e.g. `portfolio: z.url()` rather than `z.string().url()` — see the
`reference()` example on that page.

---

## 2. `render(entry)` from `astro:content`

Reference entry, verbatim:

> ### `render()`
>
> Type: `(entry: CollectionEntry) => Promise<RenderResult>`
> Added in: `astro@5.0.0`
>
> A function to compile a given entry for rendering. This returns the following properties:
>
> - `<Content />` - A component used to render the document's contents in an Astro file.
> - `headings` - A generated list of headings, mirroring Astro's `getHeadings()` utility on Markdown
>   and MDX imports.
> - `remarkPluginFrontmatter` - The modified frontmatter object after any Markdown processor plugins
>   have been applied. Set to type `any`.

```astro
---
import { getEntry, render } from 'astro:content';

const entry = await getEntry('blog', 'entry-1');

if (!entry) {
   // Handle Error, for example:
  throw new Error('Could not find blog post 1');
}

const { Content, headings, remarkPluginFrontmatter } = await render(entry);
---
```

Source: <https://docs.astro.build/en/reference/modules/astro-content/>

Guide-level example (note the null check is required because `getEntry` may return `undefined`):

```astro
---
import { getEntry, render } from "astro:content";

const entry = await getEntry("blog", "post-1");

if (!entry) {
  throw new Error("Entry not found");
}

const { Content } = await render(entry);
---

<h1>{entry.data.title}</h1>
<p>Published on: {entry.data.pubDate.toDateString()}</p>
<Content />
```

Source: <https://docs.astro.build/en/guides/content-collections/>

### Shape of `headings`

The Markdown guide gives the heading type on the *imported-file* side:

> `getHeadings()` - An async function that returns an array of all headings (`<h1>` to `<h6>`) in the
> file with the type: `{ depth: number; slug: string; text: string }[]`. Each heading's `slug`
> corresponds to the generated ID for a given heading and can be used for anchor links.

and the example `Astro.props` object on the same page shows:

```js
Astro.props = {
  file: "/home/user/projects/.../file.md",
  url: "/en/guides/markdown-content/",
  frontmatter: {
    /** Frontmatter from a blog post */
    title: "Astro 0.18 Release",
    date: "Tuesday, July 27 2021",
    author: "Matthew Phillips",
    description: "Astro 0.18 is our biggest release since Astro launch.",
  },
  getHeadings: () => [
    {"depth": 1, "text": "Astro 0.18 Release", "slug": "astro-018-release"},
    {"depth": 2, "text": "Responsive partial hydration", "slug": "responsive-partial-hydration"}
    /* ... */
  ],
  rawContent: () => "# Astro 0.18 Release\nA little over a month ago, the first public beta [...]",
  compiledContent: () => "<h1>Astro 0.18 Release</h1>\n<p>A little over a month ago, the first public beta [...]</p>",
}
```

Source: <https://docs.astro.build/en/guides/markdown-content/>

**verify at implementation time** — two readings of the same docs:

- Reading A (what the `render()` reference and the collections guide say): `headings` destructured
  from `await render(entry)` is a plain **array** of `{ depth, slug, text }`, usable directly as
  `headings.map(...)`. The collections guide calls it "a list of all rendered headings".
- Reading B (what the Markdown-imports page says): `getHeadings()` is "an **async** function", and its
  own example object nonetheless types it as a sync arrow returning an array. If `render()`'s
  `headings` were to mirror the async form, it would need awaiting.

Every code sample in the docs destructures `headings` and never awaits it, so implement as Reading A
(plain array) and confirm with a build; if a TOC comes out empty, try `await`ing it.

### `remarkPluginFrontmatter`

Docs wording is unchanged from earlier majors ("after any **Markdown processor plugins** have been
applied" — note the generic wording, which now covers Sätteri mdast/hast plugins as well as
remark/rehype ones). Type is `any`.

---

## 3. i18n config (`prefixDefaultLocale: false`) and `Astro.currentLocale`

```js
import { defineConfig } from "astro/config"
export default defineConfig({
  i18n: {
    locales: ["es", "en", "fr"],
    defaultLocale: "en",
    routing: {
        prefixDefaultLocale: false
    }
  }
})
```

Source: <https://docs.astro.build/en/guides/internationalization/>

Full `routing` object as shown in the configuration reference:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr"],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: true,
      fallbackType: "redirect",
    }
  }
});
```

Source: <https://docs.astro.build/en/reference/configuration-reference/> (§ i18n)

Reference facts, verbatim:

- `i18n.locales` — Type `Locales`, required. "Languages can be listed either as individual codes
  (e.g. `['en', 'es', 'pt-br']`) or mapped to a shared `path` of codes (e.g.
  `{ path: "english", codes: ["en", "en-US"]}`)." "your project folders containing your content files
  must match exactly the `locales` items in the list."
- `i18n.defaultLocale` — Type `string`, required, "one of the specified `locales`".
- `i18n.routing.prefixDefaultLocale` — Type `boolean`, Default `false`. "When `false`, only
  non-default languages will display a language prefix. The `defaultLocale` will not show a language
  prefix and content files do not exist in a localized folder. URLs will be of the form
  `example.com/[locale]/content/` for all non-default languages, but `example.com/content/` for the
  default locale."
- `i18n.routing.redirectToDefaultLocale` — Type `boolean`, Default `false`. Only relevant "when
  `prefixDefaultLocale: true` is set".
- `i18n.routing.fallbackType` — `"redirect" | "rewrite"`, Default `"redirect"`, added in
  `astro@4.15.0`. With `"rewrite"` Astro renders the fallback page's content at the requested URL
  instead of redirecting.
- `i18n.fallback` — Type `Record<string, string>`; "If no fallback is specified, then unavailable
  pages will return a 404."

`Astro.currentLocale`, verbatim from the i18n guide:

> All pages, including static prerendered pages, have access to `Astro.currentLocale`.
>
> `Astro.currentLocale`: The locale computed from the current URL, using the syntax specified in your
> `locales` configuration. If the URL does not contain a `/[locale]/` prefix, then the value will
> default to `i18n.defaultLocale`.

(`Astro.preferredLocale` and `Astro.preferredLocaleList` are explicitly limited to "pages rendered on
demand" — do **not** use them on this static site.)

URL helpers:

```astro
---
import { getRelativeLocaleUrl } from 'astro:i18n';

// defaultLocale is "es"
const aboutURL = getRelativeLocaleUrl("es", "about");
---

<a href="/get-started/">¡Vamos!</a>
<a href={getRelativeLocaleUrl('es', 'blog')}>Blog</a>
<a href={aboutURL}>Acerca</a>
```

Source: <https://docs.astro.build/en/guides/internationalization/>

Also verbatim from that page: "When using functions from the `astro:i18n` virtual module to compute
valid URL paths based on your configuration (e.g. `getRelativeLocaleUrl()`), use the `path` as the
value for `locale`." (only relevant if we ever use the `{ path, codes }` form).

---

## 4. Markdown config in Astro 7: Sätteri vs Unified, plugins, and Shiki transformers with MDX 8

### The processor split (this is the big Astro 7 change)

Verbatim from the v7 upgrade guide:

> ### New default Markdown processor: Sätteri
>
> Astro now renders your `.md` and `.mdx` files with Sätteri, its native Markdown pipeline, instead of
> the remark/rehype pipeline. As a result, `@astrojs/markdown-remark` is no longer installed by
> default.
>
> If you don't use remark or rehype plugins, you don't need to do anything. Your Markdown and MDX will
> now be rendered by Sätteri, which applies GitHub-Flavored Markdown and SmartyPants just like before.
>
> If you depend on remark and rehype plugins, you can port them to Sätteri MDAST or HAST plugins. If
> you depend on recma plugins, or if you are not yet ready or able to port your remark and rehype
> plugins, you can stay on the `unified()` pipeline.

To keep unified plugins, install `@astrojs/markdown-remark` and then:

```js
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  markdown: {
    processor: unified(),
  },
});
```

Source: <https://docs.astro.build/en/guides/upgrade-to/v7/>

Also from that page: "The deprecated `markdown.remarkPlugins`, `markdown.rehypePlugins`, and
`markdown.remarkRehype` options still work, but now also require `@astrojs/markdown-remark` to be
installed."

Configuration reference for `markdown.processor` (Type `MarkdownProcessor`, "Added in:
`astro@6.4.0`", "Configures the Markdown processor used to render `.md` files"):

```js
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';

export default defineConfig({
  markdown: {
    processor: satteri({
      features: { gfm: false },
    }),
  },
});
```

```js
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkToc from 'remark-toc';

export default defineConfig({
  markdown: {
    processor: unified({
      remarkPlugins: [remarkToc],
    }),
  },
});
```

Source: <https://docs.astro.build/en/reference/configuration-reference/> (§ markdown.processor)

`markdown.remarkPlugins`, `markdown.rehypePlugins`, `markdown.gfm`, `markdown.smartypants` and
`markdown.remarkRehype` are all now flagged **Deprecated** on the configuration reference: "This
property is deprecated and will be removed in a future major version. Pass plugins to the configured
`markdown.processor` instead." For `smartypants` specifically: "Use `smartypants` for `unified()` or
`smartPunctuation` for `satteri()`."

**Which config key the plugins go under** (Markdown guide, § "Markdown processor plugins"):

> mdast plugins operate on the Markdown syntax tree (mdast) before it is transformed into HTML.
> Unified calls these remark plugins.
>
> hast plugins operate on the HTML syntax tree (hast) after the Markdown has been converted to HTML.
> Unified calls these rehype plugins.

Sätteri form — plugins go under `mdastPlugins` / `hastPlugins`, options passed by *calling* the
plugin:

```js
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import imgAttr from "satteri-imgattr";
import satteriCallouts from "satteri-callouts";

export default defineConfig({
  markdown: {
    processor: satteri({
      mdastPlugins: [
        imgAttr({
          defaults: { loading: "lazy", decoding: "async" },
        }),
      ],
      hastPlugins: [satteriCallouts()],
    }),
  },
});
```

Unified form — plugins go under `remarkPlugins` / `rehypePlugins` *inside* `unified()`, options
passed in a nested array:

```js
import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import remarkImgAttr from "remark-imgattr";
import rehypeGithubAlerts from "rehype-github-alerts";

export default defineConfig({
  markdown: {
    processor: unified({
      remarkPlugins: [
        [remarkImgAttr, { defaults: { width: 700, format: "avif" } }],
      ],
      rehypePlugins: [rehypeGithubAlerts],
    }),
  },
});
```

Source (both): <https://docs.astro.build/en/guides/markdown-content/>

Heading-ID ordering, if a plugin needs Astro's injected heading ids (note the two different plugin
names per processor):

```js
import { defineConfig } from 'astro/config';
import { satteri, satteriHeadingIdsPlugin } from '@astrojs/markdown-satteri';
import { otherPluginThatReliesOnHeadingIDs } from 'some/plugin/source';

export default defineConfig({
  markdown: {
    processor: satteri({
      hastPlugins: [
        satteriHeadingIdsPlugin(),
        otherPluginThatReliesOnHeadingIDs,
      ],
    }),
  },
});
```

```js
import { defineConfig } from 'astro/config';
import { unified, rehypeHeadingIds } from '@astrojs/markdown-remark';
import { otherPluginThatReliesOnHeadingIDs } from 'some/plugin/source';

export default defineConfig({
  markdown: {
    processor: unified({
      rehypePlugins: [
        rehypeHeadingIds,
        otherPluginThatReliesOnHeadingIDs,
      ],
    }),
  },
});
```

Source: <https://docs.astro.build/en/guides/markdown-content/> (§ Heading IDs and plugins)

Verbatim from the same section: "Astro injects an `id` attribute into all heading elements (`<h1>` to
`<h6>`) in Markdown and MDX files." and "Astro injects `id` attributes after your custom plugins have
run, so any ID set by a plugin is preserved." Astro's own ids are generated with `github-slugger`.

### Does the global `markdown` config apply to MDX? Yes, by default.

Verbatim from the MDX integration page:

> By default, all `markdown` configuration options are inherited by the MDX integration. Options
> passed to the MDX integration will override the inherited `markdown` configuration. To ignore
> inherited `markdown` options entirely, use the `extendMarkdownConfig` option.

- `mdx({ processor })` — Type `MarkdownProcessor`, "Default: inherited from `markdown.processor`",
  "Added in: `@astrojs/mdx@6.0.0`". "By default, `.mdx` files render through the same Markdown
  processor as your `.md` files."
- `mdx({ extendMarkdownConfig })` — Type `boolean`, Default `true`, "Added in: `@astrojs/mdx@0.15.0`".
- `mdx({ recmaPlugins })` — **Deprecated**: "This option is deprecated and will be removed in a future
  major version. Pass `recmaPlugins` to the configured `processor` instead." Plus: "Since Astro v7,
  the default Markdown processor does not support recma plugins. If your project depends on them, you
  can use the `unified()` processor."

The canonical inheritance/override example (this is the one that shows `shikiConfig` and a processor
side by side):

```js
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import mdx from '@astrojs/mdx';
import { myMdastPlugin } from './my-satteri-plugin.mjs';

export default defineConfig({
  // ...
  markdown: {
    shikiConfig: { theme: 'rose-pine' },
  },
  integrations: [
    mdx({
      // Use a different syntax highlighting theme.
      shikiConfig: { theme: 'dracula' },
      // Add a plugin and disable GitHub-flavored Markdown.
      processor: satteri({
        mdastPlugins: [myMdastPlugin()],
        features: { gfm: false },
      }),
    }),
  ],
});
```

Remark/rehype plugins for MDX in v7 — pass `unified()` as the MDX processor:

```js
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [
    mdx({ processor: unified() }),
  ],
});
```

Recma plugins (MDX only, Unified only), "Added in: `@astrojs/mdx@8.0.0`":

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import myRecmaPlugin from './my-recma-plugin.mjs';

export default defineConfig({
  integrations: [
    mdx({ processor: unified({ recmaPlugins: [myRecmaPlugin] }) }),
  ],
});
```

Docs note under that snippet: "You can also set these plugins on `markdown.processor` instead. Your
`.mdx` files will still run them, because MDX extends your Markdown configuration by default."

Per-format override, and full opt-out:

```js
import { defineConfig } from 'astro/config';
import { satteri } from "@astrojs/markdown-satteri";
import mdx from "@astrojs/mdx";
import mdastPlugin1 from "./src/mdast-plugin-1";
import mdastPlugin2 from "./src/mdast-plugin-2";

export default defineConfig({
  // ...
  markdown: {
    syntaxHighlight: "prism",
    processor: satteri({ mdastPlugins: [mdastPlugin1] }),
  },
  integrations: [
    mdx({
      // Markdown `syntaxHighlight` overridden,
      // `.mdx` files use Shiki instead.
      syntaxHighlight: "shiki",

      // `markdown.processor` gets overridden for `.mdx` files by this option
      processor: satteri({ mdastPlugins: [mdastPlugin2] }),
    }),
  ],
});
```

```js
import { defineConfig } from 'astro/config';
import { satteri } from "@astrojs/markdown-satteri";
import mdx from "@astrojs/mdx";
import mdastPlugin from "./src/mdast-plugin";

export default defineConfig({
  // ...
  markdown: {
    processor: satteri({ mdastPlugins: [mdastPlugin] }),
  },
  integrations: [
    mdx({
      // Markdown config now ignored
      extendMarkdownConfig: false,
      // Default `satteri()` processor used
    }),
  ],
});
```

Source (all five MDX snippets above): <https://docs.astro.build/en/guides/integrations-guide/mdx/>

Practical consequence for this project: a `processor` set on `mdx()` **replaces** the inherited
`markdown.processor` for `.mdx` files — the two are not merged, so plugins must be repeated if both
formats need them. The simplest arrangement is to configure plugins once under `markdown.processor`
and pass no `processor` to `mdx()`.

### Shiki transformers

`markdown.shikiConfig` is a sibling of `markdown.processor` (not nested inside it). Full reference
snippet:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: {
    shikiConfig: {
      // Choose from Shiki's built-in themes (or add your own)
      // https://shiki.style/themes
      theme: 'dracula',
      // Alternatively, provide multiple themes
      // See note below for using dual light/dark themes
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      // Disable the default colors
      // https://shiki.style/guide/dual-themes#without-default-color
      // (Added in v4.12.0)
      defaultColor: false,
      // Add custom languages
      // Note: Shiki has countless langs built-in, including .astro!
      // https://shiki.style/languages
      langs: [],
      // Add custom aliases for languages
      // Map an alias to a Shiki language ID: https://shiki.style/languages#bundled-languages
      // https://shiki.style/guide/load-lang#custom-language-aliases
      langAlias: {
        cjs: "javascript"
      },
      // Enable word wrap to prevent horizontal scrolling
      wrap: true,
      // Add custom transformers: https://shiki.style/guide/transformers
      // Find common transformers: https://shiki.style/packages/transformers
      transformers: [],
    },
  },
});
```

Source: <https://docs.astro.build/en/reference/configuration-reference/> (§ markdown.shikiConfig,
Type `Partial<ShikiConfig>`)

`markdown.syntaxHighlight` — Type `SyntaxHighlightConfig | SyntaxHighlightConfigType | false`,
**Default `{ type: 'shiki', excludeLangs: ['math'] }`**; `markdown.syntaxHighlight.type` is
`'shiki' | 'prism'`, default `'shiki'`, added in `astro@5.5.0`.
Source: <https://docs.astro.build/en/reference/configuration-reference/>

From the syntax highlighting guide: Shiki highlights "all code fences (```) used in a Markdown or MDX
file"; "Astro's Markdown code blocks are styled by Shiki by default, preconfigured with the
`github-dark` theme. The compiled output will be limited to inline `style`s without any extraneous
CSS classes, stylesheets, or client-side JS."

CSS-class / CSS-variable naming (verbatim):

> - Code blocks are styled using the `.astro-code` class instead of `.shiki`
> - When using the `css-variables` theme, custom properties are prefixed with `--astro-code-` instead
>   of `--shiki-`

Dual-theme CSS shown by the docs (the docs render this as a diff; the `.shiki` lines are the "before"
and the `.astro-code` lines the "after"):

```css
@media (prefers-color-scheme: dark) {
  .astro-code,
  .astro-code span {
    color: var(--shiki-dark) !important;
    background-color: var(--shiki-dark-bg) !important;
    /* Optional, if you also want font styles */
    font-style: var(--shiki-dark-font-style) !important;
    font-weight: var(--shiki-dark-font-weight) !important;
    text-decoration: var(--shiki-dark-text-decoration) !important;
  }
}
```

`<Code />` transformers (this is the *component*, for `.astro`/`.mdx`, not the Markdown pipeline):

```astro
---
import { transformerNotationFocus, transformerMetaHighlight } from '@shikijs/transformers'
import { Code } from 'astro:components'
const code = `const foo = 'hello'
const bar = ' world'
console.log(foo + bar) // [!code focus]
`
---
<Code
  code={code}
  lang="js"
  transformers={[transformerMetaHighlight()]}
  meta="{1,3}"
/>

<style is:global>
  pre.has-focused .line:not(.focused) {
    filter: blur(1px);
  }
</style>
```

Source: <https://docs.astro.build/en/guides/syntax-highlighting/>

Docs caveats worth keeping: "Note that `transformers` only applies classes and you must provide your
own CSS rules to target the elements of your code block." and "The `<Code />` component will not
inherit your `shikiConfig` settings for Markdown code blocks."

**verify at implementation time** — how transformers reach MDX code fences:

- Reading A (the one the docs support): transformers are configured **once** under
  `markdown.shikiConfig.transformers`, and `.mdx` files pick them up because "all `markdown`
  configuration options are inherited by the MDX integration". `mdx({ shikiConfig: { … } })` overrides
  the whole `shikiConfig` object for `.mdx` only (as the docs' `rose-pine` / `dracula` example shows).
- Reading B (not stated anywhere, so do not assume): that `shikiConfig` is somehow tied to the chosen
  `processor`. The docs never place `shikiConfig` inside `satteri()` or `unified()`, and no page
  states whether the Sätteri pipeline honours every Shiki transformer hook (transformers are a Shiki
  feature and Sätteri is a Rust compiler). No doc page says transformers are unsupported either.

So: put transformers under `markdown.shikiConfig.transformers`, leave `mdx()`'s `shikiConfig`
unset, and confirm with a real build that a transformer's classes appear on `.mdx` code blocks. If
they do not, the fallback is `markdown.processor: unified()`.

---

## 5. `compressHTML` and the strict-HTML requirement

`compressHTML` — Type `boolean | "jsx"`, **Default `'jsx'`** (changed in v7):

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  compressHTML: true
  // or:
  // compressHTML: false
});
```

Source: <https://docs.astro.build/en/reference/configuration-reference/> (§ compressHTML)

Verbatim from that reference:

> Since v7.0, Astro applies by default the JSX whitespace rules used by frameworks like React. This
> removes whitespace and line breaks around elements, collapses multi-line text onto a single line,
> and preserves whitespace within a single line (e.g. a space between two inline elements). To keep a
> space that would otherwise be removed, include it explicitly in the source through constructs such
> as `{" "}`.
>
> Setting this option to `true` instead removes whitespace, including line breaks, in a lossless
> manner from `.astro` components. Some whitespace may be preserved as needed to maintain the visual
> rendering of your HTML.
>
> Setting this option to `false` disables HTML compression and preserves all whitespace.

The upgrade guide's worked example: `<span>hello</span>` followed on the next line by
`<em>world</em>` "would render as `helloworld` in Astro v7.0, instead of `hello world` in Astro
v6.x"; the fix is `<span>hello</span>{" "}<em>world</em>`. "If you prefer to keep the previous
behavior, set `compressHTML` to `true`."
Source: <https://docs.astro.build/en/guides/upgrade-to/v7/>

Strict HTML (the Rust compiler), verbatim from the same page:

> Astro v7.0 replaces the previous Go-based compiler with a new Rust-based compiler. The new compiler
> is faster, but is also stricter about invalid HTML syntax. Templates that previously built without
> errors may now fail.
>
> The Rust compiler enforces two key changes:
>
> - Unclosed tags now produce errors. The previous compiler silently accepted unclosed HTML and
>   component tags. The Rust compiler requires all non-void elements to have a matching closing tag.
> - Semantically invalid HTML is no longer auto-corrected. The previous compiler would silently
>   reorder or restructure invalid HTML to match the HTML parsing specification (e.g. moving elements
>   out of `<p>` tags where block elements are not allowed). The Rust compiler does not attempt to
>   correct your markup and instead passes it through as-is, leaving the browser to handle it. This
>   may cause different rendered output for previously "tolerated" invalid markup.

The docs render the two examples below as before/after diffs; the "after" halves, with the docs' own
comments, are:

```html
<!-- Before: unclosed tags that the Go compiler silently accepted -->
<!-- Void elements like <br>, <img>, <input>, and <hr> do not need closing tags -->
<p>Hello world</p>
```

```html
<!-- Invalid nesting: <div> is not allowed inside <p> -->
<!-- The browser will close the <p> early, which may break your layout -->
<!-- Fix: use a valid container instead -->
<div>
  <div>This is correctly nested</div>
</div>
```

Source: <https://docs.astro.build/en/guides/upgrade-to/v7/>

Also noted there (cosmetic, ignore unless a test string-matches CSS): the Rust compiler may serialize
named colors as hex (`rebeccapurple` → `#639`) and may add/remove quotes inside `url()`.

Related routing/output options (configuration reference):

- `build.format` — `('file' | 'directory' | 'preserve')`, Default `'directory'`. `'directory'`
  generates `/about/index.html`. Also: "`directory` - The `Astro.url.pathname` will include a trailing
  slash to mimic folder behavior. (e.g. `/foo/`)".
- `trailingSlash` — `'always' | 'never' | 'ignore'`, Default `'ignore'`. "Set the route matching
  behavior for trailing slashes in the dev server and on-demand rendered pages." Astro's own advice:
  "To prevent inconsistencies with trailing slash behaviour in dev … `directory` - Set
  `trailingSlash: 'always'`". Caveat, verbatim: "Trailing slashes on prerendered pages are handled by
  the hosting platform, and may not respect your chosen configuration."

Source: <https://docs.astro.build/en/reference/configuration-reference/>

---

## 6. Static endpoints

File naming, verbatim: "To create a custom endpoint, add a `.js` or `.ts` file to the `/pages`
directory. The `.js` or `.ts` extension will be removed during the build process, so the name of the
file should include the extension of the data you want to create. For example,
`src/pages/data.json.ts` will build a `/data.json` endpoint."

Plain form (`src/pages/builtwith.json.ts`):

```ts
// Outputs: /builtwith.json
export function GET({ params, request }) {
  return new Response(
    JSON.stringify({
      name: "Astro",
      url: "https://astro.build/",
    }),
  );
}
```

Typed form — the docs say: "You can also get type safety in your endpoint functions using the
`APIRoute` type with the `satisfies` operator":

```ts
import type { APIRoute } from "astro";

export const GET = (async ({ params, request }) => { /* ... */ }) satisfies APIRoute;
```

Dynamic endpoint with `getStaticPaths()` (`src/pages/api/[id].json.ts`):

```ts
import type { APIRoute } from "astro";

const usernames = ["Sarah", "Chris", "Yan", "Elian"];

export const GET = (({ params, request }) => {
  const id = Number(params.id);

  return new Response(
    JSON.stringify({
      name: usernames[id],
    }),
  );
}) satisfies APIRoute;

export function getStaticPaths() {
  return [
    { params: { id: "0" } },
    { params: { id: "1" } },
    { params: { id: "2" } },
    { params: { id: "3" } },
  ];
}
```

Returning a `Response` with status and headers:

```ts
import type { APIRoute } from "astro";
import { getProduct } from "../db";

export const GET = (async ({ params }) => {
  const id = params.id;
  const product = await getProduct(id);

  if (!product) {
    return new Response(null, {
      status: 404,
      statusText: "Not found",
    });
  }

  return new Response(JSON.stringify(product), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}) satisfies APIRoute;
```

Binary body with headers:

```ts
import type { APIRoute } from "astro";

export const GET = (async ({ params, request }) => {
  const response = await fetch(
    "https://docs.astro.build/assets/full-logo-light.png",
  );
  const buffer = Buffer.from(await response.arrayBuffer()); // requires `@types/node` in your dependencies for type safety

  return new Response(buffer, {
    headers: { "Content-Type": "image/png" },
  });
}) satisfies APIRoute;
```

Source (all endpoint snippets): <https://docs.astro.build/en/guides/endpoints/>

Notes from that page that matter for a fully static build:

- "This will generate four JSON endpoints at build time: `/api/0.json`, `/api/1.json`, `/api/2.json`
  and `/api/3.json`. Dynamic routing with endpoints works the same as it does with pages. In static
  mode, you can pass props to the endpoint using `getStaticPaths()`."
- Server endpoints are the opposite case: "In `static` mode, you must opt out of prerendering for each
  custom endpoint with `export const prerender = false`." We do **not** want that here.
- The `request` object is available in static endpoints too, but only `new URL(request.url).pathname`
  is demonstrated.

**verify at implementation time** (style, not behavior): the brief asks for
`export const GET: APIRoute`. The v7 docs only ever show the `satisfies` form
(`export const GET = (…) satisfies APIRoute;`). Both compile; `satisfies` is what the docs recommend
and it keeps the inferred parameter types. Prefer the documented `satisfies` form unless the project
lint config says otherwise.

---

## 7. `@astrojs/sitemap` `i18n` option

Base setup — `site` is required:

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com',
  integrations: [sitemap()],
  // ...
});
```

`i18n` — Type: `{ defaultLocale: string; locales: Record<string, string>; }`

> This object has two required properties:
>
> - `defaultLocale`: Its value must exist as one of `locales` keys.
> - `locales`: key/value - pairs. The key is used to look for a locale part in a page path. The value
>   is a language attribute, only English alphabet and hyphen allowed.

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com',
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en', // All urls that don't contain `es` or `fr` after `https://example.com/` will be treated as default locale, i.e. `en`
        locales: {
          en: 'en-US', // The `defaultLocale` value must present in `locales` keys
          es: 'es-ES',
          fr: 'fr-CA',
        },
      },
    }),
  ],
});
```

Resulting output (excerpt of `sitemap-0.xml` as printed in the docs):

```xml
  <url>
    <loc>https://example.com/</loc>
    <xhtml:link rel="alternate" hreflang="en-US" href="https://example.com/"/>
    <xhtml:link rel="alternate" hreflang="es-ES" href="https://example.com/es/"/>
    <xhtml:link rel="alternate" hreflang="fr-CA" href="https://example.com/fr/"/>
  </url>
  <url>
    <loc>https://example.com/es/second-page/</loc>
    <xhtml:link rel="alternate" hreflang="es-ES" href="https://example.com/es/second-page/"/>
    <xhtml:link rel="alternate" hreflang="fr-CA" href="https://example.com/fr/second-page/"/>
    <xhtml:link rel="alternate" hreflang="en-US" href="https://example.com/second-page/"/>
  </url>
```

Source (all three sitemap snippets above): <https://docs.astro.build/en/guides/integrations-guide/sitemap/>

For this project (`en` default, unprefixed; `zh` prefixed) the shape is
`i18n: { defaultLocale: 'en', locales: { en: 'en-US', zh: 'zh-CN' } }` — the keys must match the URL
path segment, the values are the `hreflang` attributes. Other options available on the same page if
needed later: `filter()`, `customPages`, `customSitemaps`, `entryLimit`, `changefreq`/`lastmod`/
`priority`, `serialize()`, `chunks`, `xslURL`, `filenameBase`, `namespaces`.

---

## Pages fetched for this note

- <https://docs.astro.build/en/guides/upgrade-to/v7/>
- <https://docs.astro.build/en/guides/content-collections/>
- <https://docs.astro.build/en/reference/content-loader-reference/>
- <https://docs.astro.build/en/reference/modules/astro-content/>
- <https://docs.astro.build/en/guides/internationalization/>
- <https://docs.astro.build/en/guides/markdown-content/>
- <https://docs.astro.build/en/guides/integrations-guide/mdx/>
- <https://docs.astro.build/en/guides/integrations-guide/sitemap/>
- <https://docs.astro.build/en/guides/integrations-guide/preact/>
- <https://docs.astro.build/en/guides/endpoints/>
- <https://docs.astro.build/en/reference/configuration-reference/>
- <https://docs.astro.build/en/guides/syntax-highlighting/>

Sätteri's own documentation (linked from the Astro Markdown guide) lives at
<https://satteri.bruits.org/> — see <https://satteri.bruits.org/docs/plugins/> for the mdast/hast
plugin API if a plugin has to be written by hand.

For completeness, `@astrojs/preact` (fetched but not otherwise needed by the seven topics above) is
installed with `npm install @astrojs/preact` plus `npm install preact`, added as
`integrations: [preact()]`, and requires `"jsx": "react-jsx"` / `"jsxImportSource": "preact"` in
`tsconfig.json`; `preact({ compat: true })` enables React-library compatibility.
Source: <https://docs.astro.build/en/guides/integrations-guide/preact/>
