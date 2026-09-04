---
title: Turbopack 新一代打包工具
description: 探索 Vercel 开发的 Rust 增量打包工具 Turbopack
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Turbopack
  - 打包工具
  - Rust
  - Vercel
status: imported
origin: old/src/content/docs/frontend/turbopack.zh.md
divergence: 0.203
issues:
  - title-lang-en
  - title-language
legacy:
  category: Frontend
  subcategory: Build Tools
  order: 27
  lastUpdated: 2026-01-07
---

Turbopack 是由 Vercel 开发的下一代增量打包工具，由 Webpack 的创始人 Tobias Koppers 主导开发。它使用 Rust 编写，专为 JavaScript 和 TypeScript 项目优化，目标是成为 Webpack 的继任者。2024 年 10 月，Turbopack 在 Next.js 15 中正式稳定，标志着前端构建工具进入了一个新时代。

## 为什么需要 Turbopack？

### 现有工具的瓶颈

随着前端项目规模的不断增长，传统打包工具面临着严峻的性能挑战：

| 痛点 | 描述 | 影响 |
|------|------|------|
| 冷启动缓慢 | 大型项目启动需要数十秒甚至数分钟 | 开发体验差 |
| HMR 延迟 | 热更新时间与项目规模成正比 | 迭代效率低 |
| 内存占用高 | JavaScript 运行时内存限制 | 构建不稳定 |
| 并行能力弱 | 单线程架构难以利用多核 CPU | 资源浪费 |

**Webpack 的局限性**：

Webpack 无法有效地跨 CPU 并行化，因为它的架构大量使用 JavaScript 对象来存储状态。这些对象无法在线程间轻松共享，跨线程传输需要昂贵的序列化和反序列化操作，往往会抵消并行化带来的性能提升。

### Turbopack 的设计目标

Turbopack 从零开始设计，致力于解决这些根本性问题：

1. **极速启动**：利用增量计算，只处理必要的模块
2. **即时 HMR**：毫秒级热更新，与项目规模无关
3. **原生性能**：Rust 实现，充分利用系统资源
4. **智能缓存**：自动记忆化，避免重复计算

### 性能对比数据

在包含 5,000 个模块的大型应用中：

| 指标 | Turbopack | Vite (SWC) | Webpack |
|------|-----------|------------|---------|
| 冷启动时间 | 4 秒 | 16.6 秒 | 28+ 秒 |
| HMR 更新 | ~50ms | ~200ms | ~500ms+ |

在 Vercel 的内部测试中，使用 Turbopack 的大型 Next.js 应用初始编译速度比 Webpack 快 **45.8%**，生产构建速度提升 **2-5 倍**。

### 发展历程

| 时间 | 里程碑 |
|------|--------|
| 2022.10 | Vercel 发布 Turbopack Alpha，集成于 Next.js 13 |
| 2023 | 持续改进稳定性和兼容性 |
| 2024.10 | Next.js 15 中 Turbopack 开发模式正式稳定 |
| 2025 | Next.js 15.5 支持 Turbopack 生产构建 |

## 核心架构解析

### Turbo Engine：增量计算引擎

Turbopack 的核心是 **Turbo Engine**——一个开源的增量记忆化框架。它采用自动需求驱动的增量计算架构，这一设计借鉴了超过十年的研究成果，包括：

- Webpack 的模块图概念
- Rust 编译器的查询系统
- Salsa（Rust 分析器的增量计算库）
- Adapton（增量计算研究框架）
- Parcel 的并行化策略

**工作原理**：

```
文件变更 → 依赖追踪 → 最小重计算 → 增量输出
    ↓           ↓           ↓           ↓
  检测变化   分析影响范围   只处理变更   快速响应
```

**传统打包器 vs Turbopack**：

```
传统打包器：
文件修改 → 重新分析依赖图 → 重新打包所有相关模块 → 输出

Turbopack：
文件修改 → 查找受影响的计算节点 → 只重新计算这些节点 → 增量输出
```

### 函数级缓存机制

Turbo Engine 能够缓存程序中任何函数的结果。当程序再次运行时，只有输入发生变化的函数才会重新执行：

```rust
// 概念性伪代码展示增量计算原理
#[turbo::function]
async fn compile_module(path: &Path) -> CompiledModule {
    // 这个函数的结果会被自动缓存
    // 只有当 path 指向的文件内容变化时才会重新执行
    let source = read_file(path).await;
    let ast = parse(source);
    transform(ast)
}

#[turbo::function]
async fn bundle_chunk(modules: Vec<ModuleId>) -> Chunk {
    // 依赖的模块没变化，这个函数就不会重新执行
    let compiled = modules.iter()
        .map(|id| compile_module(id))
        .collect();
    merge_modules(compiled)
}
```

### 细粒度增量更新

传统打包工具在文件变更时可能需要重新处理整个模块图。Turbopack 采用更细粒度的方法：

```
传统方式：button.tsx 变更 → 重新计算整个页面的模块图
Turbopack：button.tsx 变更 → 只重新计算 button.tsx 相关的任务
```

**增量更新的三个层次**：

1. **文件级**：只重新读取变更的文件
2. **AST 级**：只重新解析变更的代码块
3. **输出级**：只重新生成受影响的 chunk

**依赖图示例**：

```
依赖图：
┌─────────────┐
│  index.ts   │
└──────┬──────┘
       │
  ┌────┴────┐
  │         │
  ▼         ▼
┌─────┐  ┌─────┐
│ A.ts│  │ B.ts│
└──┬──┘  └──┬──┘
   │        │
   ▼        ▼
┌─────┐  ┌─────┐
│ C.ts│  │ D.ts│
└─────┘  └─────┘

修改 C.ts 时：
✓ 只重新编译：C.ts → A.ts → index.ts
✗ 不需要重新编译：B.ts、D.ts
```

### 统一依赖图（Unified Graph）

传统方案中，处理多环境（客户端、服务端、Edge）需要多个编译器：

```
传统方案：
├── 客户端编译器 → client bundle
├── 服务端编译器 → server bundle
└── Edge 编译器 → edge bundle
（需要手动协调，容易出错）

Turbopack 方案：
└── 统一图 → 自动输出到各环境
    ├── client bundle
    ├── server bundle
    └── edge bundle
```

统一图的优势：

1. **共享计算**：相同模块只解析一次
2. **一致性保证**：所有环境使用相同的依赖解析结果
3. **简化配置**：无需为每个环境单独配置

### 为什么选择 Rust？

Turbopack 选择 Rust 而非 JavaScript 有几个关键原因：

| 特性 | Rust | JavaScript |
|------|------|------------|
| 并行处理 | 原生支持，无 GIL 限制 | 受限于单线程模型 |
| 内存管理 | 零成本抽象，无 GC 停顿 | GC 可能导致性能抖动 |
| 类型安全 | 编译时保证 | 运行时可能出错 |
| 性能 | 接近 C/C++ | 解释执行，较慢 |

**零成本抽象**意味着 Turbopack 可以使用高级抽象（如迭代器、闭包）而不产生运行时开销。

### 懒编译策略

Turbopack 采用懒编译（Lazy Compilation）策略，只在需要时才编译模块：

```
开发服务器启动：
1. 启动服务器（几乎即时）
2. 等待浏览器请求

浏览器请求页面：
1. 分析该页面需要的模块
2. 只编译这些模块
3. 返回响应

后续请求：
1. 检查缓存
2. 只编译新需要的模块
```

这种策略的优势：

- **快速启动**：不需要预先编译整个项目
- **低内存占用**：只在内存中保留需要的模块
- **按需加载**：首次访问某页面时才编译相关代码

## 与 Webpack/Vite 对比

### 架构差异

| 方面 | Webpack | Vite | Turbopack |
|------|---------|------|-----------|
| 实现语言 | JavaScript | JavaScript + Go (esbuild) | Rust |
| 开发模式 | Bundle-based | Native ESM + 按需编译 | 增量编译 + Bundle |
| 生产构建 | Webpack | Rollup | Turbopack |
| 并行策略 | 有限并行 | esbuild 并行 | 原生多线程 |
| 缓存机制 | 文件系统缓存 | 依赖预构建缓存 | 函数级记忆化 |
| 多环境支持 | 多编译器 | 插件处理 | 统一图 |

### 开发体验对比

**Webpack**：
```javascript
// webpack.config.js - 需要大量配置
module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js'
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './index.html' })
  ]
}
```

**Vite**：
```javascript
// vite.config.js - 开箱即用，少量配置
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()]
})
```

**Turbopack (Next.js)**：
```javascript
// next.config.js - 零配置，内置支持
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack 在 Next.js 15+ 中默认启用
  // 无需额外配置
}

module.exports = nextConfig
```

### 功能支持对比

| 功能 | Webpack | Vite | Turbopack |
|------|---------|------|-----------|
| TypeScript | 需要 loader | 内置 | 内置 |
| JSX/TSX | 需要 loader | 内置 | 内置 |
| CSS Modules | 需要配置 | 内置 | 内置 |
| PostCSS | 需要 loader | 内置 | 内置 |
| Sass/Less | 需要 loader | 需安装 | 内置 |
| 图片优化 | 需要插件 | 内置 | 内置 |
| 代码分割 | 内置 | 内置 | 内置 |
| Tree Shaking | 内置 | 内置 | 内置 |
| Source Maps | 内置 | 内置 | 内置 |
| 自定义插件 | 成熟生态 | Rollup 兼容 | 有限支持 |

### 适用场景分析

**选择 Turbopack 的场景**：
- Next.js 项目（原生支持）
- 大型企业级应用
- 需要极速 HMR 的开发场景
- React Server Components 项目

**选择 Vite 的场景**：
- Vue/Svelte/Solid 等框架项目
- 中小型项目快速启动
- 需要丰富插件生态
- 非 Next.js 的 React 项目

**选择 Webpack 的场景**：
- 已有成熟配置的遗留项目
- 需要 Module Federation
- 特殊的定制化需求
- 非常规的构建流程

## Next.js 集成实践

### 启用 Turbopack

在 Next.js 15+ 中，Turbopack 是默认的开发服务器打包工具：

```bash
# 开发模式（自动使用 Turbopack）
npx next dev

# 显式指定使用 Turbopack
npx next dev --turbopack

# 生产构建（Next.js 15.5+）
npx next build --turbopack
```

**package.json 配置**：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build --turbopack",
    "start": "next start"
  }
}
```

### 配置选项

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack 配置
  turbopack: {
    // 解析别名
    resolveAlias: {
      '@components': './src/components',
      '@utils': './src/utils',
      '@': './src'
    },

    // 解析扩展名
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],

    // 启用调试 ID（用于调试源码映射）
    debugIds: true,

    // 自定义 loader 规则
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      },
      '*.graphql': {
        loaders: ['graphql-tag/loader'],
        as: '*.js'
      }
    }
  },

  // 实验性功能
  experimental: {
    // 开发模式文件系统缓存（跨重启持久化）
    turbopackFileSystemCacheForDev: true,

    // 生产构建文件系统缓存
    turbopackFileSystemCacheForBuild: true
  },

  // 转译内部包（monorepo 场景）
  transpilePackages: ['@repo/ui', '@repo/utils']
}

export default nextConfig
```

### 与 App Router 配合

Turbopack 对 React Server Components 和 App Router 有原生优化：

```typescript
// app/page.tsx - Server Component（默认）
export default async function HomePage() {
  // 服务端数据获取，Turbopack 会智能处理
  const data = await fetch('https://api.example.com/data')

  return (
    <main>
      <h1>Welcome</h1>
      <DataDisplay data={data} />
    </main>
  )
}
```

```typescript
// app/components/Counter.tsx - Client Component
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  // Turbopack 的 HMR 会保持组件状态
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  )
}
```

### Monorepo 配置

在 Turborepo monorepo 中使用 Turbopack：

```json
// turbo.json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "check-types": {
      "dependsOn": ["^check-types"]
    }
  }
}
```

```json
// apps/web/package.json
{
  "name": "web",
  "dependencies": {
    "@repo/ui": "workspace:*",
    "@repo/utils": "workspace:*"
  }
}
```

```javascript
// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui', '@repo/utils']
}

module.exports = nextConfig
```

### 文件系统缓存

Turbopack 支持文件系统缓存，可以在开发服务器重启后保留编译结果：

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // 开发模式缓存
    turbopackFileSystemCacheForDev: true,

    // 生产构建缓存
    turbopackFileSystemCacheForBuild: true
  }
}

export default nextConfig
```

启用后的效果：

```
首次启动：
├── 解析所有模块
├── 编译请求的页面
└── 缓存结果到 .next/cache

再次启动：
├── 读取缓存
├── 只重新编译变更的模块
└── 启动时间大幅缩短
```

## 模块热替换（HMR）

### Turbopack 的 HMR 优势

Turbopack 的 HMR 实现与传统工具有本质区别：

```
传统 HMR：
文件修改 → 重新打包整个模块链 → 发送更新 → 浏览器应用

Turbopack HMR：
文件修改 → 增量计算受影响的函数 → 只发送最小更新 → 浏览器应用
```

**性能特点**：

| 场景 | 传统工具 | Turbopack |
|------|----------|-----------|
| 单文件修改 | 与模块链长度相关 | 恒定时间（~10-50ms） |
| 样式修改 | 需要重新注入 | 增量注入 |
| 依赖修改 | 重新编译依赖树 | 只重新编译变更部分 |

### React Fast Refresh

Turbopack 内置支持 React Fast Refresh：

```tsx
// 组件状态在 HMR 后保持
import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}

// 修改组件代码后，count 状态会被保留
```

### HMR 边界处理

```tsx
// 某些情况下需要完整重载
// 例如修改了导出的非组件内容

// 会触发完整重载的情况：
export const config = {
  // 修改配置对象会导致页面重载
  theme: 'dark'
}

export default function Page() {
  return <div>Page Content</div>
}

// 只触发组件刷新的情况：
export default function Page() {
  // 修改组件内部逻辑只会刷新组件
  return <div>Updated Content</div>
}
```

## 迁移指南

### 从 Webpack 迁移

**第一步：评估兼容性**

检查当前 Webpack 配置中使用的功能：

| Webpack 功能 | Turbopack 支持 | 替代方案 |
|-------------|---------------|---------|
| 基础打包 | 完全支持 | - |
| TypeScript | 完全支持 | 内置 SWC |
| CSS/Sass | 完全支持 | 内置处理 |
| 图片资源 | 完全支持 | 内置处理 |
| 自定义 Loader | 部分支持 | 使用 rules 配置 |
| Module Federation | 开发中 | 暂时保留 Webpack |

**第二步：更新依赖**

```bash
# 升级到 Next.js 15+
npm install next@latest react@latest react-dom@latest

# 移除不再需要的 Webpack 相关依赖
npm uninstall webpack webpack-cli webpack-dev-server
```

**第三步：迁移配置**

```javascript
// 旧的 webpack.config.js 配置
module.exports = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        use: ['@svgr/webpack']
      }
    ]
  }
}

// 新的 next.config.js 配置
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      '@': './src'
    },
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      }
    }
  }
}

module.exports = nextConfig
```

### 从 Vite 迁移

如果你的项目使用 Vite + React，迁移到 Next.js + Turbopack：

**第一步：项目结构调整**

```
# Vite 结构
src/
  main.tsx
  App.tsx
  pages/
    Home.tsx
    About.tsx

# Next.js 结构
app/
  page.tsx        # 对应 Home
  about/
    page.tsx      # 对应 About
  layout.tsx      # 根布局
```

**第二步：路由迁移**

```typescript
// Vite: src/pages/Home.tsx
export function Home() {
  return <h1>Home Page</h1>
}

// Next.js: app/page.tsx
export default function HomePage() {
  return <h1>Home Page</h1>
}
```

**第三步：配置迁移**

```javascript
// vite.config.js
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})

// next.config.js
const nextConfig = {
  turbopack: {
    resolveAlias: {
      '@': './src'
    }
  }
}

module.exports = nextConfig
```

### 迁移检查清单

- [ ] 确认 Node.js 版本 >= 18.17
- [ ] 升级 Next.js 到 15+
- [ ] 移除 Webpack 特定配置
- [ ] 迁移自定义 Loader 到 Turbopack rules
- [ ] 配置 tsconfig.json 路径别名
- [ ] 测试开发模式 HMR
- [ ] 测试生产构建
- [ ] 验证性能提升
- [ ] 更新 CI/CD 配置

### 渐进式迁移

```bash
# 可以在开发和生产使用不同的构建工具
# package.json
{
  "scripts": {
    "dev": "next dev --turbopack",    # 开发使用 Turbopack
    "build": "next build",             # 生产可暂时使用 Webpack
    "start": "next start"
  }
}
```

## 性能优化技巧

### 利用增量编译

确保你的代码结构支持细粒度的增量更新：

```typescript
// 不推荐：大型单文件组件
// components/Dashboard.tsx (500+ 行)
export function Dashboard() {
  // 所有逻辑都在一个文件中
  // 任何修改都会触发整个文件重新编译
}

// 推荐：拆分为小模块
// components/Dashboard/index.tsx
export function Dashboard() {
  return (
    <div>
      <Header />
      <Sidebar />
      <MainContent />
    </div>
  )
}

// components/Dashboard/Header.tsx
// 修改 Header 只会重新编译这个文件
export function Header() { /* ... */ }
```

### 优化依赖图

```typescript
// 避免循环依赖
// a.ts
import { b } from './b'  // a 依赖 b
export const a = () => b()

// b.ts
import { a } from './a'  // b 依赖 a（循环！）
export const b = () => a()

// 解决方案：提取公共依赖
// shared.ts
export const shared = () => { /* ... */ }

// a.ts
import { shared } from './shared'
export const a = () => shared()

// b.ts
import { shared } from './shared'
export const b = () => shared()
```

### 避免常见陷阱

```typescript
// 避免：大量的 barrel exports
// src/components/index.ts
export * from './Button'
export * from './Input'
export * from './Modal'
// ... 导出几十个组件

// 推荐：直接导入
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// 避免：动态 require
const module = require(`./modules/${name}`)

// 推荐：使用动态 import
const module = await import(`./modules/${name}`)
```

### 合理使用动态导入

```typescript
// 大型库使用动态导入
export async function renderChart(data: ChartData) {
  // 只在需要时加载 Chart 库
  const { Chart } = await import('chart.js')
  return new Chart(/* ... */)
}

// 路由级别代码分割
// app/dashboard/page.tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { loading: () => <Skeleton /> }
)
```

### 代码组织建议

```
推荐的项目结构：
src/
├── app/           # 路由和页面
├── components/    # 共享组件
│   ├── ui/        # 基础 UI 组件
│   └── features/  # 功能组件
├── lib/           # 工具函数
├── hooks/         # 自定义 hooks
└── types/         # 类型定义

好处：
├── 清晰的模块边界
├── 减少循环依赖
└── 优化增量计算效率
```

### 监控构建性能

```bash
# 启用详细日志
TURBOPACK_DEBUG=1 npx next dev

# 查看缓存状态
ls -la .next/cache/turbopack/

# 清除缓存重新构建
rm -rf .next && npx next dev
```

## 常见问题与解决方案

### Loader 兼容性

**问题**：某些 Webpack loader 在 Turbopack 中不工作

**解决方案**：

```javascript
// next.config.js
const nextConfig = {
  turbopack: {
    rules: {
      // 配置自定义 loader
      '*.md': {
        loaders: ['raw-loader'],
        as: '*.js'
      },
      // 多个 loader 链式处理
      '*.graphql': {
        loaders: ['graphql-tag/loader'],
        as: '*.js'
      }
    }
  }
}
```

### CSS 处理

**问题**：CSS Modules 或特殊 CSS 处理

**解决方案**：

```typescript
// Turbopack 原生支持 CSS Modules
// styles.module.css
.button {
  background: blue;
}

// Component.tsx
import styles from './styles.module.css'

export function Button() {
  return <button className={styles.button}>Click</button>
}
```

### 某些 npm 包不兼容

```typescript
// 解决方案 1：配置 transpile
// next.config.ts
const nextConfig: NextConfig = {
  transpilePackages: ['problematic-package']
}

// 解决方案 2：使用兼容的替代包
// 例如：moment -> dayjs
```

### CSS-in-JS 问题

```typescript
// 确保使用支持的库版本
// package.json
{
  "dependencies": {
    "styled-components": "^6.0.0",  // 需要 v6+
    "@emotion/react": "^11.0.0"     // 支持
  }
}
```

### 首次启动慢

```typescript
// 启用文件系统缓存
const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true
  }
}

// 首次启动后，后续启动会更快
```

### HMR 延迟

```bash
# 检查是否有循环依赖
# 使用工具分析依赖图
npx madge --circular src/

# 解决循环依赖问题
```

### 调试技巧

```typescript
// 启用调试 ID
const nextConfig: NextConfig = {
  turbopack: {
    debugIds: true
  }
}

// 在浏览器控制台查看调试信息
console.log(globalThis._debugIds)
```

## 性能基准测试

### 测试方法

以一个大型 React 应用（约 3000 个模块）为例进行测试：

| 指标 | Webpack | Vite | Turbopack |
|------|---------|------|-----------|
| 冷启动 | ~28s | ~2.5s | ~1.2s |
| HMR (小改动) | ~500ms | ~100ms | ~20ms |
| HMR (大改动) | ~2s | ~300ms | ~50ms |
| 内存占用 | ~1.5GB | ~800MB | ~600MB |

*注：以上数据为估算值，实际性能取决于具体项目配置*

### 官方基准数据

根据 Vercel 官方测试：

- 大型 Next.js 应用初始编译速度比 Webpack 快 **45.8%**
- 生产构建速度提升 **2-5 倍**
- 包含 5,000 个模块的应用，Turbopack 启动时间约 **4 秒**，Vite (SWC) 约 **16.6 秒**

## 面试高频考点

### 核心概念类

**Q: Turbopack 的核心优势是什么？**

A: Turbopack 有三个核心优势：
1. **增量计算**：基于函数级记忆化，只重新计算变化的部分
2. **Rust 实现**：原生性能，真正的多线程并行
3. **智能缓存**：自动追踪依赖，精确失效缓存

**Q: Turbopack 和 Webpack 的主要区别？**

A:
- **语言**：Turbopack 用 Rust，Webpack 用 JavaScript
- **并行性**：Turbopack 原生多线程，Webpack 受限于 JS 单线程
- **缓存**：Turbopack 函数级缓存，Webpack 文件级缓存
- **架构**：Turbopack 增量驱动，Webpack 全量打包

**Q: 什么是增量计算？Turbopack 如何实现？**

A: 增量计算是指只重新计算发生变化的部分，而不是重新计算整个结果。Turbopack 通过以下方式实现：

1. **细粒度依赖追踪**：追踪每个函数的输入和输出
2. **缓存到函数级别**：每个转换步骤都可以独立缓存
3. **脏标记传播**：变更只影响依赖链上的节点
4. **并行计算**：独立的计算节点可以并行处理

### 实践类

**Q: 如何在 Next.js 中启用 Turbopack？**

A: Next.js 15+ 默认使用 Turbopack 开发，生产构建使用 `next build --turbopack`。

```bash
# 开发模式
next dev --turbopack

# 生产构建
next build --turbopack
```

**Q: Turbopack 的 HMR 为什么这么快？**

A: 因为增量计算只处理变更的模块及其直接依赖，而不是重新打包整个应用。结合 Rust 的高性能执行，可以在毫秒级完成更新。

**Q: Turbopack 目前有什么限制？**

A: 主要限制包括：

1. 主要支持 Next.js 项目
2. 不支持 Webpack 插件生态
3. 某些复杂的 loader 配置可能不兼容
4. Module Federation 不支持
5. 某些边缘情况的 CSS-in-JS 库可能有问题

### 对比类

**Q: Turbopack 和 Vite 哪个更快？**

A: 在大型项目中，Turbopack 通常更快，原因是：

1. Rust 比 JavaScript/Go 更快
2. 函数级别的缓存比模块级别更细
3. 统一图减少重复工作

但 Vite 的优势是：
1. 更成熟的生态系统
2. 可以独立于 Next.js 使用
3. 配置更简单

选择取决于具体场景和需求。

**Q: 什么时候应该使用 Turbopack？**

A: 推荐使用 Turbopack 的场景：

1. 使用 Next.js 15+ 的项目
2. 大型项目，模块数量超过 1000
3. 需要极速 HMR 体验
4. React Server Components 项目

不推荐的场景：
1. 需要复杂 Webpack 插件
2. 非 Next.js 项目（目前）
3. 需要 Module Federation

---

## 总结

Turbopack 代表了前端构建工具的未来方向。它通过将 Rust 的性能优势与创新的增量计算架构相结合，解决了困扰前端开发者多年的构建性能问题。

**核心要点**：

1. **增量计算**是 Turbopack 的核心创新，实现了真正的按需编译
2. **Rust 实现**带来了原生级别的性能和真正的并行处理能力
3. **与 Next.js 深度集成**，对 React Server Components 有原生优化
4. **渐进式采用**，可以从开发模式开始，逐步扩展到生产构建

随着 Turbopack 的不断成熟和生态系统的完善，它有望成为下一代前端构建的标准工具。对于 Next.js 用户来说，现在就是开始使用 Turbopack 的最佳时机。

## 延伸阅读

### 官方资源

- [Next.js Turbopack 文档](https://nextjs.org/docs/app/api-reference/turbopack)
- [Turbopack 架构介绍](https://nextjs.org/docs/14/architecture/turbopack)
- [Vercel Turbopack 博客](https://vercel.com/blog/turbopack)
- [Turbo GitHub 仓库](https://github.com/vercel/turbo)

### 相关技术

- [SWC - Rust JavaScript 编译器](https://swc.rs/)
- [Turborepo - Monorepo 构建系统](https://turbo.build/repo)
- [Rust 编程语言](https://www.rust-lang.org/)

### 对比学习

- [Vite 构建工具深入](/frontend/vite-guide) - 了解另一种现代构建方案
- [Webpack 完全指南](/frontend/webpack) - 理解传统打包工具的原理
