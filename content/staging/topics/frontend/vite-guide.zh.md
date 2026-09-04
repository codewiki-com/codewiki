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
origin: old/src/content/docs/frontend/vite-guide.zh.md
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

Vite（法语意为"快速"，发音为 /vit/）是由 Vue.js 作者尤雨溪创建的下一代前端构建工具。它通过利用浏览器原生 ES 模块和现代 JavaScript 工具，从根本上重新定义了前端开发体验，实现了即时的开发服务器启动和闪电般快速的热模块替换（HMR）。

## 为什么选择 Vite？（对比 Webpack）

### 传统打包工具的痛点

在 Webpack 等传统打包工具中，启动开发服务器需要：

1. **完整打包**：分析整个项目的依赖图
2. **转换所有模块**：将 TypeScript、JSX、CSS 等转换为浏览器可执行代码
3. **生成打包文件**：将所有模块打包成一个或多个文件

对于大型项目，这个过程可能需要数十秒甚至数分钟。每次代码修改后，HMR 也需要重新构建受影响的模块链。

### Vite 的革命性方法

Vite 采用了完全不同的策略：

```
传统打包工具:  源代码 -> 打包 -> 浏览器加载打包文件
Vite:         源代码 -> 浏览器原生 ESM 加载 -> 按需转换
```

**核心优势**：

| 特性 | Webpack | Vite |
|---------|---------|------|
| 冷启动 | 需要完整打包 | 仅预构建依赖 |
| HMR 速度 | 与模块数量成正比 | 始终快速 |
| 开发体验 | 逐渐变慢 | 始终响应迅速 |

### 实际性能对比

以一个使用 React 和 Material UI 的大型应用为例：

- **Webpack 冷启动**：约 28 秒
- **Vite 冷启动**：约 1.5 秒

随着项目规模增长，这个差距会更加明显。

### Vite 的技术栈

Vite 在不同阶段使用不同的工具，充分发挥各自的优势：

| 阶段 | 工具 | 原因 |
|-------|------|--------|
| 依赖预构建 | esbuild (Go) | 极快的编译速度，比 JS 工具快 10-100 倍 |
| 开发时转换 | esbuild + 原生 ESM | 按需编译，零打包 |
| 生产构建 | Rollup | 成熟的 tree-shaking，更小的输出 |
| CSS 处理 | PostCSS | 成熟的生态系统，丰富的插件 |
| TypeScript | esbuild（仅转译） | 快速转译，类型检查交给 IDE/CI |

这种组合策略使 Vite 在开发速度和生产优化之间达到最佳平衡。

## 开发环境中的原生 ESM

### 原生 ES 模块的工作原理

现代浏览器原生支持 ES 模块，能够直接解析 `import` 语句：

```html
<script type="module">
  import { createApp } from '/node_modules/.vite/deps/vue.js?v=abc123'
  import App from '/src/App.vue'

  createApp(App).mount('#app')
</script>
```

Vite 利用这一能力，让浏览器处理模块解析。开发服务器只需要在请求时按需转换单个模块，而不是预先打包所有内容。

**要点**：

1. 浏览器原生支持 ESM，无需打包
2. 按需转换 - 文件只在首次请求时才被处理
3. 强缓存策略 - 未更改的模块直接使用浏览器缓存

### 依赖预构建

在使用原生 ESM 时，需要解决两个问题：

**问题 1：CommonJS 兼容性**

```javascript
// 原始代码（无法在浏览器中运行）
import { someMethod } from 'my-dep'

// Vite 预构建后
import { someMethod } from '/node_modules/.vite/deps/my-dep.js?v=f3sf2ebd'
```

**问题 2：请求瀑布**

以 `lodash-es` 为例 - 它包含 600+ 个内部模块。直接使用会导致浏览器发起 600+ 个 HTTP 请求，造成严重的网络拥塞。

```javascript
// 预构建前：600+ 个请求
import { debounce } from 'lodash-es'

// 预构建后：1 个请求
import { debounce } from '/node_modules/.vite/deps/lodash-es.js'
```

**预构建机制**：

Vite 使用 esbuild 进行依赖预构建，比基于 JavaScript 的打包工具快 10-100 倍：

```javascript
import { resolveConfig, optimizeDeps } from 'vite'

// 获取优化元数据
const config = await resolveConfig({ configFile: './vite.config.js' }, 'build', 'production')
const metadata = await optimizeDeps(config, true)

console.log('优化的依赖:', Object.keys(metadata.optimized))
// 输出: ['vue', 'vue-router', 'lodash-es', ...]
```

### 热模块替换（HMR）

Vite 的 HMR 基于原生 ESM 实现，具有以下特点：

1. **精确更新**：只更新修改的模块，不影响其他模块
2. **清晰的边界**：框架插件（如 @vitejs/plugin-vue）定义 HMR 边界
3. **状态保持**：组件更新时保持应用状态

```javascript
// 客户端 HMR API
if (import.meta.hot) {
  import.meta.hot.accept('./module.js', (newModule) => {
    // 处理模块更新
    console.log('模块已更新:', newModule)
  })

  import.meta.hot.dispose((data) => {
    // 清理副作用
    data.cleanup = true
  })
}
```

**HMR 工作流程**：

```
文件修改 -> Vite 检测 -> WebSocket 通知 -> 浏览器请求新模块 -> 热替换
```

整个过程通常在 100ms 内完成，与项目大小无关。

### 源代码与依赖

Vite 将模块分为两类，采用不同的处理策略：

**依赖**：
- 来源：node_modules 中的第三方包
- 特点：通常不经常变化
- 处理：预构建 + 强缓存（URL 带版本哈希）
- 缓存位置：`node_modules/.vite/deps`

**源代码**：
- 来源：项目自身代码（.vue、.ts、.jsx 等）
- 特点：频繁修改
- 处理：按需转换，304 协商缓存
- 转换时机：浏览器请求时实时转换

```javascript
// 依赖请求 - 带版本哈希，强缓存
// GET /node_modules/.vite/deps/vue.js?v=1a2b3c4d
// Cache-Control: max-age=31536000,immutable

// 源代码请求 - 协商缓存
// GET /src/App.vue
// 304 Not Modified（如果未更改）
```

这种区分确保了：
1. 依赖只需预构建一次，然后被缓存
2. 源代码更改即时生效，无需重新处理依赖

## 项目配置（vite.config.ts）

### 基础配置结构

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  // 项目根目录
  root: process.cwd(),

  // 公共基础路径
  base: '/',

  // 模式：development | production
  mode: 'development',

  // 插件配置
  plugins: [vue()],

  // 解析配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },

  // 开发服务器配置
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

  // 构建配置
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

  // 预构建优化
  optimizeDeps: {
    include: ['vue', 'vue-router'],
    exclude: ['your-local-package']
  }
})
```

### 条件配置

```typescript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  // 加载环境变量
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

### 多环境构建配置

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    sourcemap: false // 所有环境继承
  },

  environments: {
    // 客户端环境（浏览器）
    client: {
      build: {
        outDir: 'dist/client'
      }
    },

    // SSR 环境（Node.js）
    ssr: {
      build: {
        outDir: 'dist/server',
        target: 'node20'
      }
    },

    // 边缘环境（Cloudflare Workers 等）
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

## 插件系统

### 官方插件

| 插件 | 用途 | 安装 |
|--------|---------|--------------|
| @vitejs/plugin-vue | Vue 3 SFC 支持 | `npm i -D @vitejs/plugin-vue` |
| @vitejs/plugin-vue-jsx | Vue 3 JSX 支持 | `npm i -D @vitejs/plugin-vue-jsx` |
| @vitejs/plugin-react | React 支持（包含 Fast Refresh） | `npm i -D @vitejs/plugin-react` |
| @vitejs/plugin-legacy | 旧版浏览器兼容 | `npm i -D @vitejs/plugin-legacy` |

### 流行的社区插件

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

    // 自动导入 API
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts'
    }),

    // 自动注册组件
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts'
    }),

    // 打包分析
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
})
```

### 插件速查表

| 插件名称 | 功能 | 使用场景 |
|-------------|----------|----------|
| vite-plugin-compression | Gzip/Brotli 压缩 | 减小生产包体积 |
| vite-plugin-imagemin | 图片优化 | 优化图片资源 |
| vite-plugin-svg-icons | SVG 图标精灵 | 统一 SVG 图标管理 |
| vite-plugin-mock | API mock 服务 | 前后端并行开发 |
| vite-plugin-pwa | PWA 支持 | 离线应用开发 |
| vite-plugin-pages | 基于文件的路由 | 自动生成路由配置 |
| vite-plugin-inspect | 插件调试 | 调试 Vite 插件 |
| @vitejs/plugin-legacy | 旧版浏览器支持 | IE11 及更旧浏览器支持 |

### 编写自定义插件

```typescript
import type { Plugin } from 'vite'

export function myPlugin(): Plugin {
  return {
    name: 'vite-plugin-my-plugin',

    // 配置解析
    config(config, { command }) {
      console.log('当前命令:', command)
      return {
        // 合并到用户配置
        define: {
          __MY_PLUGIN__: JSON.stringify(true)
        }
      }
    },

    // 配置解析完成
    configResolved(resolvedConfig) {
      console.log('最终配置:', resolvedConfig.base)
    },

    // 开发服务器配置
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/my-api') {
          res.end('来自插件的问候!')
          return
        }
        next()
      })
    },

    // 模块转换
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

### 虚拟模块插件

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

// 使用虚拟模块
// import { config } from 'virtual:my-config'
```

### 自定义 HMR 处理

```typescript
import type { Plugin } from 'vite'

export function hmrPlugin(): Plugin {
  return {
    name: 'custom-hmr',

    handleHotUpdate({ file, server, modules }) {
      // 自定义处理 .data.json 文件的热更新
      if (file.endsWith('.data.json')) {
        console.log('数据文件已更新:', file)

        // 向客户端发送自定义事件
        server.ws.send({
          type: 'custom',
          event: 'data-update',
          data: { file }
        })

        // 返回空数组表示我们已处理此更新
        return []
      }
    }
  }
}
```

## 环境变量

### 环境变量文件

```
.env                # 所有模式加载
.env.local          # 所有模式加载，git 忽略
.env.development    # 开发模式加载
.env.production     # 生产模式加载
.env.[mode]         # 特定模式加载
.env.[mode].local   # 特定模式加载，git 忽略
```

### 变量定义和使用

```ini
# .env.production
VITE_APP_TITLE=我的应用
VITE_API_BASE_URL=https://api.example.com
VITE_ENABLE_ANALYTICS=true
```

```typescript
// 在应用代码中使用
console.log(import.meta.env.VITE_APP_TITLE)
console.log(import.meta.env.VITE_API_BASE_URL)

// 类型声明 (src/env.d.ts)
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

### 自定义模式

```bash
# 使用自定义模式
vite build --mode staging

# .env.staging
VITE_APP_TITLE=App（预发布环境）
VITE_API_BASE_URL=https://staging-api.example.com
```

### 在配置中访问环境变量

```typescript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // 根据当前工作目录中的 `mode` 加载环境文件
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

## CSS 和资源处理

### CSS 功能

Vite 提供全面的内置 CSS 支持：

**CSS Modules**：

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
  return <button className={styles.button}>点击我</button>
}
```

**CSS 预处理器**：

```bash
# 安装你选择的预处理器
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

**PostCSS 配置**：

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

### 静态资源处理

**导入资源**：

```typescript
// 作为 URL 导入
import imgUrl from './img.png'

// 作为字符串导入（小文件）
import svgContent from './icon.svg?raw'

// 作为 web worker 导入
import Worker from './worker.js?worker'
```

**资源配置**：

```typescript
export default defineConfig({
  build: {
    // 小于此值的资源将内联为 base64
    assetsInlineLimit: 4096, // 4kb

    // 资源文件命名
    assetsDir: 'assets',

    rollupOptions: {
      output: {
        // 自定义资源文件名
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

### 公共目录

`public` 目录中的文件在根路径提供服务，并原样复制到输出目录：

```
public/
  favicon.ico    -> /favicon.ico
  robots.txt     -> /robots.txt
  images/        -> /images/
```

```html
<!-- 使用绝对路径引用公共文件 -->
<link rel="icon" href="/favicon.ico" />
<img src="/images/logo.png" />
```

### JSON 和 Web Workers

**JSON 导入**：

```typescript
// 默认导入获取整个对象
import data from './data.json'

// 命名导入用于 tree-shaking
import { field } from './data.json'
```

**Web Workers**：

```typescript
// 作为 web worker 导入
import MyWorker from './worker?worker'
const worker = new MyWorker()

// 作为 shared worker 导入
import SharedWorker from './worker?sharedworker'

// 内联 worker（base64 编码）
import InlineWorker from './worker?worker&inline'
```

## 生产构建优化

### 代码分割策略

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // 手动代码分割
        manualChunks: (id) => {
          // 将 node_modules 分割到 vendor
          if (id.includes('node_modules')) {
            // 大型库单独分块
            if (id.includes('echarts')) return 'echarts'
            if (id.includes('lodash')) return 'lodash'
            if (id.includes('moment')) return 'moment'
            return 'vendor'
          }

          // 公共组件分割
          if (id.includes('src/components/common')) {
            return 'common'
          }
        },

        // 自定义 chunk 文件名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  }
})
```

### 压缩和优化

```typescript
export default defineConfig({
  build: {
    // 使用 Terser 压缩（更小但更慢）
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 移除 console
        drop_debugger: true  // 移除 debugger
      },
      mangle: {
        safari10: true
      }
    },

    // 启用 CSS 代码分割
    cssCodeSplit: true,

    // 启用 gzip 压缩报告
    reportCompressedSize: true,

    // chunk 大小警告阈值
    chunkSizeWarningLimit: 500
  }
})
```

### 构建目标配置

```typescript
export default defineConfig({
  build: {
    // 目标浏览器
    target: 'es2015', // 或 'modules' 用于原生 ESM 支持

    // 对于旧版浏览器支持
    // 使用 @vitejs/plugin-legacy
  }
})
```

**使用 Legacy 插件**：

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

### 构建分析

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

### 库模式

用于构建库而非应用：

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
      // 外部化不应打包的依赖
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

## SSR 支持

### SSR 构建配置

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

### 入口文件

**客户端入口 (src/entry-client.js)**：

```javascript
import { createApp } from './app'

const { app, router } = createApp()

router.isReady().then(() => {
  app.mount('#app')
})
```

**服务端入口 (src/entry-server.js)**：

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

// SSR 的 HMR 支持
if (import.meta.hot) {
  import.meta.hot.accept()
}
```

### SSR 服务器设置

```javascript
// server.js
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { createServer as createViteServer } from 'vite'

async function createServer() {
  const app = express()

  // 以中间件模式创建 Vite 服务器
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  })

  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    const url = req.originalUrl

    try {
      // 读取 index.html
      let template = fs.readFileSync(
        path.resolve(__dirname, 'index.html'),
        'utf-8'
      )

      // 应用 Vite HTML 转换
      template = await vite.transformIndexHtml(url, template)

      // 加载服务端入口
      const { render } = await vite.ssrLoadModule('/src/entry-server.js')

      // 渲染应用 HTML
      const { html: appHtml } = await render(url)

      // 将应用 HTML 注入模板
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

### SSR 环境检测

```javascript
import 'vite/client'

if (import.meta.env.SSR) {
  // 仅服务端逻辑
  console.log('在服务端运行')
} else {
  // 仅客户端逻辑
  console.log('在客户端运行')
}
```

### 多环境配置

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

## 面试重点

### 核心原理

**问：为什么 Vite 比 Webpack 快？**

答：主要有三个原因：
1. **开发时不打包**：利用浏览器原生 ESM，按需编译模块
2. **依赖预构建使用 esbuild**：比 JavaScript 打包器快 10-100 倍
3. **基于原生 ESM 的 HMR**：更新精确到单个模块，不受项目规模影响

**问：Vite 的依赖预构建做了什么？**

答：做了两件事：
1. 将 CommonJS/UMD 转换为 ESM 格式
2. 将多文件依赖（如 lodash-es 的 600+ 模块）合并为单个文件，减少 HTTP 请求

**问：Vite 在开发和生产阶段使用什么工具？**

答：Vite 使用双引擎策略：
- **开发**：esbuild 用于依赖预构建和源码转换（TypeScript/JSX），原生 ESM 用于模块加载
- **生产**：Rollup 用于打包，因为它有更成熟的 tree-shaking 和代码分割，产出更小的包

**问：为什么 Vite 在生产环境不使用 ESM？**

答：虽然现代浏览器支持原生 ESM，但生产环境仍需打包：
1. **嵌套导入的网络开销**：深层依赖会造成请求瀑布
2. **Tree-shaking**：打包可以移除未使用的代码
3. **代码压缩**：打包后能更好地压缩优化
4. **公共代码提取**：共享代码可以提取成单独的 chunk 供浏览器缓存

### 配置实践

**问：如何配置多页面应用？**

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

**问：如何优化首屏加载？**

答：综合策略：
1. 路由懒加载：`() => import('./views/Heavy.vue')`
2. 手动分割大型库：manualChunks 配置
3. 使用 vite-plugin-compression 进行 gzip/brotli 压缩
4. 使用 rollup-plugin-visualizer 分析并优化包体积

### 高级功能

**问：Vite 插件和 Rollup 插件有什么区别？**

答：Vite 插件扩展了 Rollup 插件接口，新增了：
- `config` / `configResolved`：配置处理钩子
- `configureServer`：开发服务器配置
- `transformIndexHtml`：HTML 转换
- `handleHotUpdate`：HMR 处理
- 开发和构建阶段区分（`apply: 'serve' | 'build'`）

**问：如何解决首次启动慢的问题？**

答：首次启动慢通常由依赖预构建引起。优化方法：
1. 在 `optimizeDeps.include` 中预声明已知的大型依赖
2. 使用 `--force` 标志强制重新预构建（仅用于调试）
3. 确保 `.vite` 缓存目录未被 git 忽略（或添加到 CI 缓存）
4. 对于 monorepo，正确配置依赖的 `optimizeDeps.include`

**问：Vite 如何处理 CSS？**

答：Vite 内置了全面的 CSS 处理：
- 支持 CSS Modules（`.module.css`）
- 自动处理 `@import` 和 `url()` 路径
- 内置 PostCSS 支持（自动读取 postcss.config.js）
- 支持 CSS 预处理器（Sass/Less/Stylus，需安装对应包）
- 生产构建自动提取和压缩 CSS

### Vite 与 Webpack 对比

| 方面 | Webpack | Vite |
|--------|---------|------|
| 开发模式 | 先打包后服务 | 原生 ESM + 按需编译 |
| 生产构建 | Webpack 自身 | Rollup（更小的输出） |
| 配置复杂度 | 较高 | 开箱即用 |
| 生态成熟度 | 非常成熟 | 快速增长 |
| 插件兼容性 | 专有插件系统 | 兼容 Rollup 插件 |

**何时选择 Vite**：
- 新项目，尤其是 Vue 3 / React
- 追求极致开发体验
- 大型项目中 Webpack 启动缓慢
- 使用现代浏览器开发

**何时选择 Webpack**：
- 已有成熟的 Webpack 配置
- 需要特定 Webpack 插件且无 Vite 替代方案
- 需要支持非常老的浏览器
- 微前端场景（Module Federation）

## 延伸阅读

### 官方资源

- [Vite 官方文档](https://vitejs.dev/) - 完整的配置参考和指南
- [Vite GitHub 仓库](https://github.com/vitejs/vite) - 源代码和问题讨论
- [Awesome Vite](https://github.com/vitejs/awesome-vite) - 社区维护的插件和资源
- [Vite Discord](https://chat.vitejs.dev/) - 官方社区频道

### 深入学习

- **Rollup 文档**：理解生产构建机制，掌握输出配置和插件开发
- **esbuild 文档**：理解预构建和转换实现
- **ES Modules 规范**：理解原生模块系统，包括动态导入和模块解析算法
- **Node.js ESM 支持**：了解 package.json exports 字段和条件导出
- **HTTP/2 和缓存策略**：理解 Vite 的网络优化策略

### 实践项目

1. **从零构建 Vite + Vue 3 + TypeScript 模板**
2. **开发一个自定义 Vite 插件**
3. **将现有 Webpack 项目迁移到 Vite**
4. **配置 SSR 应用（Vite + Vue/React）**

### 相关技术栈

- **Vitest**：基于 Vite 的单元测试框架，共享 Vite 配置，开箱即用
- **VitePress**：基于 Vite 的静态站点生成器，非常适合文档网站
- **Astro**：内容优先的框架，使用 Vite，支持混合多个框架组件
- **Nuxt 3**：Vue 的全栈框架，使用 Vite 作为开发服务器
- **Remix / SvelteKit**：其他使用 Vite 的现代全栈框架
- **Storybook**：组件开发工具，支持 Vite 作为构建器

### 版本演进

| 版本 | 发布时间 | 主要特性 |
|---------|---------|--------------|
| Vite 1.0 | 2021.01 | 首个稳定版本，Vue 3 专用 |
| Vite 2.0 | 2021.02 | 框架无关，esbuild 预构建 |
| Vite 3.0 | 2022.07 | 冷启动优化，WebSocket 改进 |
| Vite 4.0 | 2022.12 | Rollup 3 支持，SWC 可选 |
| Vite 5.0 | 2023.11 | 要求 Node 18+，性能改进 |
| Vite 6.0 | 2024.11 | Environment API，改进的 SSR 支持 |

---

## 总结

Vite 代表了前端构建工具的新方向，证明了重新思考基础架构可以带来数量级的性能提升。其核心创新是：

1. **开发时的原生 ESM**：让浏览器处理模块解析，按需编译
2. **esbuild 依赖预构建**：用 Go 编写的超快编译器
3. **Rollup 生产构建**：成熟的打包器，出色的 tree-shaking
4. **精确的 HMR 实现**：基于 ESM 的即时热更新

无论你是准备面试还是提升开发效率，深入理解 Vite 的原理都会让你受益匪浅。我们建议在实际项目中使用 Vite，亲身体验现代前端开发的极致速度。随着 Vite 生态系统的不断成熟，它正在成为越来越多前端项目的首选构建工具。

关键要点是，Vite 的架构从根本上改变了我们对前端工具的思考方式。它不是预先处理所有内容，而是将工作推迟到真正需要时才执行，从而在开发过程中实现了显著更快的反馈循环，同时仍然通过 Rollup 生成优化的生产构建。
