---
title: Vite Build Tool Complete Guide
description: Master Vite for lightning-fast frontend development
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Vite
  - Build Tool
  - ESM
  - HMR
status: imported
origin: old/src/content/docs/frontend/vite-guide.en.md
divergence: 0.21
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Frontend
  subcategory: Build Tools
  order: 19
  lastUpdated: 2026-01-07
---

Vite (French word for "fast", pronounced /vit/) is a next-generation frontend build tool created by Evan You, the author of Vue.js. It fundamentally reimagines the frontend development experience by leveraging native browser ES modules and modern JavaScript tooling to deliver instant dev server startup and lightning-fast Hot Module Replacement (HMR).

## Why Vite? (vs Webpack)

### The Pain Points of Traditional Bundlers

In traditional bundlers like Webpack, starting a development server requires:

1. **Full bundling**: Analyze the entire project's dependency graph
2. **Transform all modules**: Convert TypeScript, JSX, CSS, etc. into browser-executable code
3. **Generate bundles**: Package all modules into one or more files

For large projects, this process can take tens of seconds or even minutes. After each code change, HMR also needs to rebuild the affected module chain.

### Vite's Revolutionary Approach

Vite takes a completely different strategy:

```
Traditional bundler:  Source code -> Bundle -> Browser loads bundle
Vite:                 Source code -> Browser native ESM loading -> On-demand transformation
```

**Core Advantages**:

| Feature | Webpack | Vite |
|---------|---------|------|
| Cold start | Requires full bundling | Only pre-bundles dependencies |
| HMR speed | Proportional to module count | Consistently fast |
| Dev experience | Progressively slower | Always responsive |

### Real-World Performance Comparison

Consider a large application using React with Material UI:

- **Webpack cold start**: ~28 seconds
- **Vite cold start**: ~1.5 seconds

This gap becomes even more pronounced as project size grows.

### Vite's Technology Stack

Vite uses different tools at different stages, leveraging each for their strengths:

| Stage | Tool | Reason |
|-------|------|--------|
| Dependency pre-bundling | esbuild (Go) | Extremely fast compilation, 10-100x faster than JS tools |
| Dev transformation | esbuild + native ESM | On-demand compilation, zero bundling |
| Production build | Rollup | Mature tree-shaking, smaller output |
| CSS processing | PostCSS | Mature ecosystem, rich plugins |
| TypeScript | esbuild (transpile only) | Fast transpilation, type checking delegated to IDE/CI |

This combination strategy allows Vite to achieve the best balance between development speed and production optimization.

## Native ESM in Development

### How Native ES Modules Work

Modern browsers natively support ES Modules, capable of directly parsing `import` statements:

```html
<script type="module">
  import { createApp } from '/node_modules/.vite/deps/vue.js?v=abc123'
  import App from '/src/App.vue'

  createApp(App).mount('#app')
</script>
```

Vite leverages this capability, letting the browser handle module resolution. The dev server only needs to transform individual modules on-demand when requested, rather than pre-bundling everything.

**Key Points**:

1. Browsers natively support ESM, no bundling required
2. Transform on request - files are only processed when first requested
3. Strong caching strategy - unchanged modules use browser cache directly

### Dependency Pre-Bundling

While using native ESM, two issues need to be addressed:

**Issue 1: CommonJS Compatibility**

```javascript
// Original code (cannot run in browser)
import { someMethod } from 'my-dep'

// After Vite pre-bundling
import { someMethod } from '/node_modules/.vite/deps/my-dep.js?v=f3sf2ebd'
```

**Issue 2: Request Waterfall**

Take `lodash-es` as an example - it contains 600+ internal modules. Using it directly would cause the browser to make 600+ HTTP requests, creating severe network congestion.

```javascript
// Before pre-bundling: 600+ requests
import { debounce } from 'lodash-es'

// After pre-bundling: 1 request
import { debounce } from '/node_modules/.vite/deps/lodash-es.js'
```

**Pre-bundling Mechanism**:

Vite uses esbuild for dependency pre-bundling, which is 10-100x faster than JavaScript-based bundlers:

```javascript
import { resolveConfig, optimizeDeps } from 'vite'

// Get optimization metadata
const config = await resolveConfig({ configFile: './vite.config.js' }, 'build', 'production')
const metadata = await optimizeDeps(config, true)

console.log('Optimized dependencies:', Object.keys(metadata.optimized))
// Output: ['vue', 'vue-router', 'lodash-es', ...]
```

### Hot Module Replacement (HMR)

Vite's HMR is implemented on top of native ESM with these characteristics:

1. **Precise updates**: Only updates the modified module, doesn't affect others
2. **Clear boundaries**: Framework plugins (like @vitejs/plugin-vue) define HMR boundaries
3. **State preservation**: Application state is maintained during component updates

```javascript
// Client-side HMR API
if (import.meta.hot) {
  import.meta.hot.accept('./module.js', (newModule) => {
    // Handle module update
    console.log('Module updated:', newModule)
  })

  import.meta.hot.dispose((data) => {
    // Cleanup side effects
    data.cleanup = true
  })
}
```

**HMR Workflow**:

```
File modified -> Vite detects -> WebSocket notification -> Browser requests new module -> Hot replacement
```

The entire process typically completes within 100ms, regardless of project size.

### Source Code vs Dependencies

Vite categorizes modules into two types with different handling strategies:

**Dependencies**:
- Source: Third-party packages in node_modules
- Characteristics: Typically don't change frequently
- Handling: Pre-bundled + strong caching (URLs with version hash)
- Cache location: `node_modules/.vite/deps`

**Source Code**:
- Source: Project's own code (.vue, .ts, .jsx, etc.)
- Characteristics: Frequently modified
- Handling: On-demand transformation, 304 negotiated caching
- Transform timing: Real-time transformation when browser requests

```javascript
// Dependency request - with version hash, strong cache
// GET /node_modules/.vite/deps/vue.js?v=1a2b3c4d
// Cache-Control: max-age=31536000,immutable

// Source code request - negotiated cache
// GET /src/App.vue
// 304 Not Modified (if unchanged)
```

This differentiation ensures:
1. Dependencies only need pre-bundling once, then cached
2. Source code changes are reflected instantly without reprocessing dependencies

## Project Configuration (vite.config.ts)

### Basic Configuration Structure

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  // Project root directory
  root: process.cwd(),

  // Public base path
  base: '/',

  // Mode: development | production
  mode: 'development',

  // Plugin configuration
  plugins: [vue()],

  // Resolution configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },

  // Development server configuration
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin.html')
      },
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia']
        }
      }
    }
  },

  // Pre-bundling optimization
  optimizeDeps: {
    include: ['vue', 'vue-router'],
    exclude: ['your-local-package']
  }
})
```

### Conditional Configuration

```typescript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: command === 'serve' ? '/' : '/production-path/',

    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version)
    },

    build: {
      minify: mode === 'production' ? 'terser' : false,
      sourcemap: mode !== 'production'
    }
  }
})
```

### Multi-Environment Build Configuration

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    sourcemap: false // Inherited by all environments
  },

  environments: {
    // Client environment (browser)
    client: {
      build: {
        outDir: 'dist/client'
      }
    },

    // SSR environment (Node.js)
    ssr: {
      build: {
        outDir: 'dist/server',
        target: 'node20'
      }
    },

    // Edge environment (Cloudflare Workers, etc.)
    edge: {
      resolve: {
        noExternal: true,
        conditions: ['edge', 'worker']
      },
      build: {
        outDir: 'dist/edge',
        rollupOptions: {
          external: ['cloudflare:workers']
        }
      }
    }
  }
})
```

## Plugin System

### Official Plugins

| Plugin | Purpose | Installation |
|--------|---------|--------------|
| @vitejs/plugin-vue | Vue 3 SFC support | `npm i -D @vitejs/plugin-vue` |
| @vitejs/plugin-vue-jsx | Vue 3 JSX support | `npm i -D @vitejs/plugin-vue-jsx` |
| @vitejs/plugin-react | React support (includes Fast Refresh) | `npm i -D @vitejs/plugin-react` |
| @vitejs/plugin-legacy | Legacy browser compatibility | `npm i -D @vitejs/plugin-legacy` |

### Popular Community Plugins

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),

    // Auto-import APIs
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts'
    }),

    // Auto-register components
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts'
    }),

    // Bundle analysis
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
})
```

### Plugin Quick Reference

| Plugin Name | Function | Use Case |
|-------------|----------|----------|
| vite-plugin-compression | Gzip/Brotli compression | Reduce production bundle size |
| vite-plugin-imagemin | Image optimization | Optimize image assets |
| vite-plugin-svg-icons | SVG icon sprites | Unified SVG icon management |
| vite-plugin-mock | API mock service | Frontend-backend parallel development |
| vite-plugin-pwa | PWA support | Offline app development |
| vite-plugin-pages | File-based routing | Auto-generate route config |
| vite-plugin-inspect | Plugin debugging | Debug Vite plugins |
| @vitejs/plugin-legacy | Legacy browser support | IE11 and older browser support |

### Writing Custom Plugins

```typescript
import type { Plugin } from 'vite'

export function myPlugin(): Plugin {
  return {
    name: 'vite-plugin-my-plugin',

    // Configuration resolution
    config(config, { command }) {
      console.log('Current command:', command)
      return {
        // Merge into user config
        define: {
          __MY_PLUGIN__: JSON.stringify(true)
        }
      }
    },

    // Configuration resolved
    configResolved(resolvedConfig) {
      console.log('Final config:', resolvedConfig.base)
    },

    // Dev server configuration
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/my-api') {
          res.end('Hello from plugin!')
          return
        }
        next()
      })
    },

    // Module transformation
    transform(code, id) {
      if (id.endsWith('.custom')) {
        return {
          code: `export default ${JSON.stringify(code)}`,
          map: null
        }
      }
    }
  }
}
```

### Virtual Module Plugin

```typescript
import type { Plugin } from 'vite'

export function virtualModulePlugin(): Plugin {
  const virtualModuleId = 'virtual:my-config'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'virtual-module',

    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `
          export const config = {
            apiUrl: 'https://api.example.com',
            version: '1.0.0'
          }
        `
      }
    }
  }
}

// Using the virtual module
// import { config } from 'virtual:my-config'
```

### Custom HMR Handling

```typescript
import type { Plugin } from 'vite'

export function hmrPlugin(): Plugin {
  return {
    name: 'custom-hmr',

    handleHotUpdate({ file, server, modules }) {
      // Custom handling for .data.json file hot updates
      if (file.endsWith('.data.json')) {
        console.log('Data file updated:', file)

        // Send custom event to client
        server.ws.send({
          type: 'custom',
          event: 'data-update',
          data: { file }
        })

        // Return empty array to indicate we've handled the update
        return []
      }
    }
  }
}
```

## Environment Variables

### Environment Variable Files

```
.env                # Loaded in all modes
.env.local          # Loaded in all modes, git ignored
.env.development    # Loaded in development mode
.env.production     # Loaded in production mode
.env.[mode]         # Loaded in specific mode
.env.[mode].local   # Loaded in specific mode, git ignored
```

### Variable Definition and Usage

```ini
# .env.production
VITE_APP_TITLE=My Application
VITE_API_BASE_URL=https://api.example.com
VITE_ENABLE_ANALYTICS=true
```

```typescript
// Using in application code
console.log(import.meta.env.VITE_APP_TITLE)
console.log(import.meta.env.VITE_API_BASE_URL)

// Type declaration (src/env.d.ts)
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_ENABLE_ANALYTICS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### Custom Modes

```bash
# Using custom mode
vite build --mode staging

# .env.staging
VITE_APP_TITLE=App (Staging Environment)
VITE_API_BASE_URL=https://staging-api.example.com
```

### Accessing Environment Variables in Config

```typescript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '')

  return {
    define: {
      'process.env.API_URL': JSON.stringify(env.API_URL)
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL
        }
      }
    }
  }
})
```

## CSS and Asset Handling

### CSS Features

Vite provides comprehensive built-in CSS support:

**CSS Modules**:

```css
/* styles.module.css */
.button {
  background: blue;
  color: white;
}
```

```typescript
import styles from './styles.module.css'

function Button() {
  return <button className={styles.button}>Click me</button>
}
```

**CSS Pre-processors**:

```bash
# Install the preprocessor of your choice
npm install -D sass
npm install -D less
npm install -D stylus
```

```typescript
// vite.config.ts
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      },
      less: {
        modifyVars: {
          'primary-color': '#1890ff'
        },
        javascriptEnabled: true
      }
    }
  }
})
```

**PostCSS Configuration**:

```javascript
// postcss.config.js
export default {
  plugins: {
    autoprefixer: {},
    'postcss-nesting': {},
    cssnano: process.env.NODE_ENV === 'production' ? {} : false
  }
}
```

### Static Asset Handling

**Importing Assets**:

```typescript
// Import as URL
import imgUrl from './img.png'

// Import as string (for small files)
import svgContent from './icon.svg?raw'

// Import as web worker
import Worker from './worker.js?worker'
```

**Asset Configuration**:

```typescript
export default defineConfig({
  build: {
    // Assets smaller than this will be inlined as base64
    assetsInlineLimit: 4096, // 4kb

    // Asset file naming
    assetsDir: 'assets',

    rollupOptions: {
      output: {
        // Customize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(assetInfo.name)) {
            return `images/[name]-[hash][extname]`
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
            return `fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      }
    }
  }
})
```

### Public Directory

Files in the `public` directory are served at root path and copied as-is to the output directory:

```
public/
  favicon.ico    -> /favicon.ico
  robots.txt     -> /robots.txt
  images/        -> /images/
```

```html
<!-- Reference public files with absolute path -->
<link rel="icon" href="/favicon.ico" />
<img src="/images/logo.png" />
```

### JSON and Web Workers

**JSON Import**:

```typescript
// Default import gets entire object
import data from './data.json'

// Named imports for tree-shaking
import { field } from './data.json'
```

**Web Workers**:

```typescript
// Import as web worker
import MyWorker from './worker?worker'
const worker = new MyWorker()

// Import as shared worker
import SharedWorker from './worker?sharedworker'

// Inline worker (base64 encoded)
import InlineWorker from './worker?worker&inline'
```

## Production Build Optimization

### Code Splitting Strategy

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Manual chunk splitting
        manualChunks: (id) => {
          // Split node_modules into vendor
          if (id.includes('node_modules')) {
            // Large libraries get their own chunks
            if (id.includes('echarts')) return 'echarts'
            if (id.includes('lodash')) return 'lodash'
            if (id.includes('moment')) return 'moment'
            return 'vendor'
          }

          // Common components split
          if (id.includes('src/components/common')) {
            return 'common'
          }
        },

        // Custom chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  }
})
```

### Compression and Optimization

```typescript
export default defineConfig({
  build: {
    // Use Terser for compression (smaller but slower)
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console
        drop_debugger: true  // Remove debugger
      },
      mangle: {
        safari10: true
      }
    },

    // Enable CSS code splitting
    cssCodeSplit: true,

    // Enable gzip compression report
    reportCompressedSize: true,

    // Chunk size warning threshold
    chunkSizeWarningLimit: 500
  }
})
```

### Build Target Configuration

```typescript
export default defineConfig({
  build: {
    // Target browsers
    target: 'es2015', // or 'modules' for native ESM support

    // For legacy browser support
    // Use @vitejs/plugin-legacy
  }
})
```

**Using Legacy Plugin**:

```typescript
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ]
})
```

### Build Analysis

```typescript
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true
    })
  ]
})
```

### Library Mode

For building libraries rather than applications:

```typescript
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/main.ts'),
      name: 'MyLib',
      fileName: (format) => `my-lib.${format}.js`
    },
    rollupOptions: {
      // Externalize deps that shouldn't be bundled
      external: ['vue', 'react'],
      output: {
        globals: {
          vue: 'Vue',
          react: 'React'
        }
      }
    }
  }
})
```

## SSR Support

### SSR Build Configuration

```json
// package.json
{
  "scripts": {
    "dev": "node server",
    "build:client": "vite build --outDir dist/client",
    "build:server": "vite build --outDir dist/server --ssr src/entry-server.js"
  }
}
```

### Entry Files

**Client Entry (src/entry-client.js)**:

```javascript
import { createApp } from './app'

const { app, router } = createApp()

router.isReady().then(() => {
  app.mount('#app')
})
```

**Server Entry (src/entry-server.js)**:

```javascript
import { createApp } from './app'
import { renderToString } from 'vue/server-renderer'

export async function render(url) {
  const { app, router } = createApp()

  router.push(url)
  await router.isReady()

  const html = await renderToString(app)
  return { html }
}

// HMR support for SSR
if (import.meta.hot) {
  import.meta.hot.accept()
}
```

### SSR Server Setup

```javascript
// server.js
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { createServer as createViteServer } from 'vite'

async function createServer() {
  const app = express()

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  })

  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    const url = req.originalUrl

    try {
      // Read index.html
      let template = fs.readFileSync(
        path.resolve(__dirname, 'index.html'),
        'utf-8'
      )

      // Apply Vite HTML transforms
      template = await vite.transformIndexHtml(url, template)

      // Load server entry
      const { render } = await vite.ssrLoadModule('/src/entry-server.js')

      // Render app HTML
      const { html: appHtml } = await render(url)

      // Inject app HTML into template
      const html = template.replace('<!--ssr-outlet-->', appHtml)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite.ssrFixStacktrace(e)
      console.error(e)
      res.status(500).end(e.message)
    }
  })

  app.listen(3000)
}

createServer()
```

### SSR Environment Detection

```javascript
import 'vite/client'

if (import.meta.env.SSR) {
  // Server-only logic
  console.log('Running on server')
} else {
  // Client-only logic
  console.log('Running on client')
}
```

### Multi-Environment Configuration

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  environments: {
    client: {
      build: {
        outDir: 'dist/client',
        manifest: true
      }
    },
    ssr: {
      build: {
        outDir: 'dist/server',
        target: 'node20',
        rollupOptions: {
          output: {
            format: 'esm'
          }
        }
      }
    }
  }
})
```

## Interview Key Points

### Core Principles

**Q: Why is Vite faster than Webpack?**

A: Three main reasons:
1. **No bundling during development**: Leverages browser native ESM, compiles modules on-demand
2. **Dependency pre-bundling uses esbuild**: 10-100x faster than JavaScript bundlers
3. **HMR based on native ESM**: Updates are precise to individual modules, unaffected by project size

**Q: What does Vite's dependency pre-bundling do?**

A: Two things:
1. Converts CommonJS/UMD to ESM format
2. Consolidates multi-file dependencies (like lodash-es's 600+ modules) into single files, reducing HTTP requests

**Q: What tools does Vite use during development vs production?**

A: Vite uses a dual-engine strategy:
- **Development**: esbuild for dependency pre-bundling and source transformation (TypeScript/JSX), native ESM for module loading
- **Production**: Rollup for bundling, as it has more mature tree-shaking and code splitting, producing smaller bundles

**Q: Why doesn't Vite use ESM in production?**

A: Although modern browsers support native ESM, bundling is still needed in production:
1. **Network overhead from nested imports**: Deep dependencies cause request waterfalls
2. **Tree-shaking**: Bundling can remove unused code
3. **Code compression**: Better compression optimization after bundling
4. **Common code extraction**: Shared code can be extracted into separate chunks for browser caching

### Configuration Practice

**Q: How to configure a multi-page application?**

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin/index.html',
        mobile: 'mobile/index.html'
      }
    }
  }
})
```

**Q: How to optimize first-screen loading?**

A: Combined strategies:
1. Route lazy loading: `() => import('./views/Heavy.vue')`
2. Manual splitting of large libraries: manualChunks configuration
3. Use vite-plugin-compression for gzip/brotli compression
4. Use rollup-plugin-visualizer to analyze and optimize bundle size

### Advanced Features

**Q: What's the difference between Vite plugins and Rollup plugins?**

A: Vite plugins extend the Rollup plugin interface, adding:
- `config` / `configResolved`: Configuration processing hooks
- `configureServer`: Dev server configuration
- `transformIndexHtml`: HTML transformation
- `handleHotUpdate`: HMR handling
- Development and build phase distinction (`apply: 'serve' | 'build'`)

**Q: How to solve slow first startup?**

A: Slow first startup is usually caused by dependency pre-bundling. Optimize by:
1. Pre-declare known large dependencies in `optimizeDeps.include`
2. Use `--force` flag to force re-prebundling (for debugging only)
3. Ensure `.vite` cache directory is not git-ignored (or add to CI cache)
4. For monorepos, correctly configure `optimizeDeps.include` for dependencies

**Q: How does Vite handle CSS?**

A: Vite has comprehensive built-in CSS handling:
- Supports CSS Modules (`.module.css`)
- Automatically handles `@import` and `url()` paths
- Built-in PostCSS support (auto-reads postcss.config.js)
- Supports CSS preprocessors (Sass/Less/Stylus, install corresponding packages)
- Production builds automatically extract and minify CSS

### Vite vs Webpack Comparison

| Aspect | Webpack | Vite |
|--------|---------|------|
| Dev mode | Bundle then serve | Native ESM + on-demand compile |
| Production build | Webpack itself | Rollup (smaller output) |
| Config complexity | Higher | Out-of-the-box |
| Ecosystem maturity | Very mature | Rapidly growing |
| Plugin compatibility | Proprietary plugin system | Compatible with Rollup plugins |

**When to choose Vite**:
- New projects, especially Vue 3 / React
- Pursuing ultimate dev experience
- Large projects where Webpack starts slowly
- Using modern browsers for development

**When to choose Webpack**:
- Existing mature Webpack configuration
- Need specific Webpack plugins without Vite alternatives
- Need to support very old browsers
- Micro-frontend scenarios (Module Federation)

## Further Reading

### Official Resources

- [Vite Official Documentation](https://vitejs.dev/) - Complete configuration reference and guides
- [Vite GitHub Repository](https://github.com/vitejs/vite) - Source code and issue discussions
- [Awesome Vite](https://github.com/vitejs/awesome-vite) - Community-maintained plugins and resources
- [Vite Discord](https://chat.vitejs.dev/) - Official community channel

### Deep Learning

- **Rollup Documentation**: Understand production build mechanics, master output configuration and plugin development
- **esbuild Documentation**: Understand pre-bundling and transformation implementation
- **ES Modules Specification**: Understand native module system, including dynamic imports and module resolution algorithm
- **Node.js ESM Support**: Learn about package.json exports field and conditional exports
- **HTTP/2 and Caching Strategies**: Understand Vite's network optimization strategies

### Practice Projects

1. **Build Vite + Vue 3 + TypeScript template from scratch**
2. **Develop a custom Vite plugin**
3. **Migrate existing Webpack project to Vite**
4. **Configure SSR application (Vite + Vue/React)**

### Related Technology Stack

- **Vitest**: Unit testing framework based on Vite, shares Vite configuration, works out of the box
- **VitePress**: Static site generator based on Vite, perfect for documentation sites
- **Astro**: Content-first framework using Vite, supports mixing multiple framework components
- **Nuxt 3**: Vue's full-stack framework, uses Vite as dev server
- **Remix / SvelteKit**: Other modern full-stack frameworks using Vite
- **Storybook**: Component development tool, supports Vite as builder

### Version Evolution

| Version | Release | Key Features |
|---------|---------|--------------|
| Vite 1.0 | 2021.01 | First stable version, Vue 3 specific |
| Vite 2.0 | 2021.02 | Framework agnostic, esbuild pre-bundling |
| Vite 3.0 | 2022.07 | Cold start optimization, WebSocket improvements |
| Vite 4.0 | 2022.12 | Rollup 3 support, SWC optional |
| Vite 5.0 | 2023.11 | Node 18+ requirement, performance improvements |
| Vite 6.0 | 2024.11 | Environment API, improved SSR support |

---

## Summary

Vite represents a new direction for frontend build tools, proving that rethinking fundamental architecture can bring order-of-magnitude performance improvements. Its core innovations are:

1. **Native ESM during development**: Let the browser handle module resolution, compile on-demand
2. **esbuild for dependency pre-bundling**: Ultra-fast compiler written in Go
3. **Rollup for production builds**: Mature bundler with excellent tree-shaking
4. **Precise HMR implementation**: Instant hot updates based on ESM

Whether you're preparing for interviews or improving development efficiency, fully understanding Vite's principles will benefit you greatly. We recommend using Vite in real projects to experience the ultimate speed of modern frontend development firsthand. As Vite's ecosystem continues to mature, it is becoming the preferred build tool for increasingly frontend projects.

The key takeaway is that Vite's architecture fundamentally changes how we think about frontend tooling. Instead of processing everything upfront, it defers work until it's actually needed, resulting in a dramatically faster feedback loop during development while still producing optimized production builds through Rollup.
