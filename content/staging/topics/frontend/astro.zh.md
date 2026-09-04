---
title: Astro 静态站点生成
description: 学习Astro框架构建高性能静态网站
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Astro
  - SSG
  - Islands架构
  - 静态网站
status: imported
origin: old/src/content/docs/frontend/astro.zh.md
divergence: 0.216
issues:
  - title-lang-en
  - title-language
legacy:
  category: Frontend
  subcategory: Frameworks
  order: 37
  lastUpdated: 2026-01-07
---

Astro 是一个现代化的静态站点生成器，它通过独特的 Islands 架构和零 JavaScript 默认策略，帮助开发者构建极速加载的网站。Astro 的核心理念是"发送更少的 JavaScript"，让网站在保持丰富交互体验的同时，实现最优的性能表现。

## 什么是 Astro

Astro 是一个用于构建内容驱动网站的 Web 框架，特别适合博客、文档站点、营销页面和电商网站等场景。与传统的单页应用(SPA)框架不同，Astro 采用多页应用(MPA)架构，默认生成纯静态 HTML，只在需要时才加载 JavaScript。

### Astro 的核心特性

**1. 零 JavaScript 默认**

Astro 页面默认不包含任何客户端 JavaScript，这意味着页面加载速度极快：

```astro
---
// src/pages/index.astro
// 服务端代码（构建时执行）
const title = "欢迎使用 Astro"
const features = ["快速", "灵活", "现代"]
---

<html lang="zh-CN">
  <head>
    <title>{title}</title>
  </head>
  <body>
    <h1>{title}</h1>
    <ul>
      {features.map(feature => <li>{feature}</li>)}
    </ul>
  </body>
</html>
```

**2. 内置优化**

Astro 自动处理许多性能优化任务：

- CSS 作用域和自动压缩
- 图片优化和懒加载
- 自动代码分割
- 预获取链接

**3. UI 框架无关**

你可以使用任何喜欢的 UI 框架，甚至在同一项目中混用：

```bash
# 添加 React 支持
npx astro add react

# 添加 Vue 支持
npx astro add vue

# 添加 Svelte 支持
npx astro add svelte
```

## 快速开始

### 创建新项目

```bash
# 使用 npm
npm create astro@latest

# 使用 pnpm
pnpm create astro@latest

# 使用 yarn
yarn create astro
```

创建向导会引导你完成项目设置：

```bash
# 项目名称
Where should we create your new project?
./my-astro-site

# 选择模板
How would you like to start your new project?
> Include sample files (recommended)
  Use blog template
  Empty

# TypeScript 配置
Do you plan to write TypeScript?
> Yes

# 安装依赖
Install dependencies?
> Yes
```

### 项目结构

```
my-astro-site/
├── public/              # 静态资源（不经过处理）
│   └── favicon.svg
├── src/
│   ├── components/      # Astro/框架组件
│   │   └── Card.astro
│   ├── layouts/         # 页面布局
│   │   └── Layout.astro
│   ├── pages/           # 页面路由
│   │   └── index.astro
│   └── content/         # 内容集合
│       └── blog/
├── astro.config.mjs     # Astro 配置
├── package.json
└── tsconfig.json
```

### 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## Islands 架构

Islands 架构是 Astro 最具创新性的特性之一。这种架构模式将页面视为静态 HTML 的"海洋"，其中散布着交互式"岛屿"。

### 什么是 Islands

在 Astro 中，岛屿是页面上可以独立水合（hydrate）的交互式 UI 组件。每个岛屿都是独立渲染的，不会影响其他部分的性能。

**客户端岛屿 (Client Islands)**

客户端岛屿是需要在浏览器中运行 JavaScript 的交互式组件：

```astro
---
// src/pages/index.astro
import Counter from '../components/Counter.jsx'
import Newsletter from '../components/Newsletter.vue'
---

<html>
  <body>
    <!-- 静态 HTML，无 JavaScript -->
    <h1>欢迎访问我的网站</h1>
    <p>这是纯静态内容，加载极快。</p>

    <!-- 交互式岛屿 -->
    <Counter client:load />

    <!-- 仅在可见时加载 -->
    <Newsletter client:visible />
  </body>
</html>
```

**服务端岛屿 (Server Islands)**

服务端岛屿允许组件在服务器上动态渲染，适合个性化内容：

```astro
---
// 需要在配置中启用
// astro.config.mjs
export default defineConfig({
  output: 'hybrid',
  experimental: {
    serverIslands: true
  }
})
---

<UserProfile server:defer />
```

### 客户端指令

Astro 提供多种客户端指令来控制组件何时加载和水合：

```astro
---
import InteractiveComponent from './InteractiveComponent.jsx'
---

<!-- 页面加载时立即水合 -->
<InteractiveComponent client:load />

<!-- 页面空闲时水合（requestIdleCallback） -->
<InteractiveComponent client:idle />

<!-- 组件进入视口时水合 -->
<InteractiveComponent client:visible />

<!-- 满足媒体查询条件时水合 -->
<InteractiveComponent client:media="(max-width: 768px)" />

<!-- 仅在服务端渲染，不发送 JavaScript -->
<InteractiveComponent client:only="react" />
```

### Islands 架构的优势

1. **性能优化**: 只有交互式组件才会加载 JavaScript
2. **独立水合**: 每个岛屿独立加载，不阻塞其他内容
3. **框架混用**: 不同岛屿可以使用不同框架
4. **渐进增强**: 静态内容立即可用，交互功能逐步加载

## 组件支持

Astro 支持多种 UI 框架，让你可以复用现有组件或选择最适合的工具。

### 安装框架集成

```bash
# React
npx astro add react

# Vue
npx astro add vue

# Svelte
npx astro add svelte

# Solid
npx astro add solid-js

# Preact
npx astro add preact

# Alpine.js
npx astro add alpinejs
```

### React 组件示例

```jsx
// src/components/Counter.jsx
import { useState } from 'react'

export default function Counter({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount)

  return (
    <div className="counter">
      <button onClick={() => setCount(c => c - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  )
}
```

在 Astro 页面中使用：

```astro
---
import Counter from '../components/Counter.jsx'
---

<Counter client:load initialCount={5} />
```

### Vue 组件示例

```vue
<!-- src/components/TodoList.vue -->
<template>
  <div class="todo-list">
    <input v-model="newTodo" @keyup.enter="addTodo" placeholder="添加待办事项">
    <ul>
      <li v-for="todo in todos" :key="todo.id">
        <input type="checkbox" v-model="todo.done">
        <span :class="{ done: todo.done }">{{ todo.text }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const todos = ref([])
const newTodo = ref('')

function addTodo() {
  if (newTodo.value.trim()) {
    todos.value.push({
      id: Date.now(),
      text: newTodo.value,
      done: false
    })
    newTodo.value = ''
  }
}
</script>
```

### Svelte 组件示例

```svelte
<!-- src/components/Greeting.svelte -->
<script>
  export let name = 'World'
  let count = 0
</script>

<div class="greeting">
  <h2>Hello, {name}!</h2>
  <button on:click={() => count++}>
    点击了 {count} 次
  </button>
</div>

<style>
  .greeting {
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    color: white;
  }
</style>
```

### 混用多个框架

```astro
---
// src/pages/mixed.astro
import ReactCounter from '../components/Counter.jsx'
import VueTodoList from '../components/TodoList.vue'
import SvelteGreeting from '../components/Greeting.svelte'
---

<html>
  <body>
    <h1>多框架演示</h1>

    <section>
      <h2>React 计数器</h2>
      <ReactCounter client:load />
    </section>

    <section>
      <h2>Vue 待办列表</h2>
      <VueTodoList client:visible />
    </section>

    <section>
      <h2>Svelte 问候语</h2>
      <SvelteGreeting client:idle name="Astro" />
    </section>
  </body>
</html>
```

## 内容集合

内容集合是 Astro 管理内容的最佳方式，提供类型安全和自动化验证。

### 定义集合

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content'

// 定义博客集合的 schema
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    author: z.string().default('匿名'),
    tags: z.array(z.string()).default([]),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }).optional(),
    draft: z.boolean().default(false)
  })
})

// 定义作者集合
const authorsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    avatar: z.string(),
    bio: z.string(),
    social: z.object({
      twitter: z.string().optional(),
      github: z.string().optional()
    }).optional()
  })
})

export const collections = {
  blog: blogCollection,
  authors: authorsCollection
}
```

### 创建内容

```markdown
---
# src/content/blog/first-post.md
title: "我的第一篇博客"
description: "这是使用 Astro 创建的第一篇博客文章"
pubDate: 2024-01-15
author: "张三"
tags: ["Astro", "教程"]
image:
  url: "/images/first-post.jpg"
  alt: "博客封面图"
---

# 欢迎阅读

这是我的第一篇博客文章，使用 Astro 的内容集合功能创建。

## Astro 的优势

Astro 让内容创作变得简单而高效...
```

### 查询内容

```astro
---
// src/pages/blog/index.astro
import { getCollection } from 'astro:content'

// 获取所有非草稿的博客文章
const posts = await getCollection('blog', ({ data }) => {
  return data.draft !== true
})

// 按发布日期排序
const sortedPosts = posts.sort((a, b) =>
  b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
)
---

<html>
  <body>
    <h1>博客文章</h1>
    <ul>
      {sortedPosts.map(post => (
        <li>
          <a href={`/blog/${post.slug}`}>
            <h2>{post.data.title}</h2>
            <p>{post.data.description}</p>
            <time datetime={post.data.pubDate.toISOString()}>
              {post.data.pubDate.toLocaleDateString('zh-CN')}
            </time>
          </a>
        </li>
      ))}
    </ul>
  </body>
</html>
```

### 渲染内容

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection, getEntry } from 'astro:content'
import Layout from '../../layouts/Layout.astro'

export async function getStaticPaths() {
  const posts = await getCollection('blog')
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post }
  }))
}

const { post } = Astro.props
const { Content, headings } = await post.render()
---

<Layout title={post.data.title}>
  <article>
    <header>
      <h1>{post.data.title}</h1>
      <p>{post.data.description}</p>
      <time datetime={post.data.pubDate.toISOString()}>
        {post.data.pubDate.toLocaleDateString('zh-CN')}
      </time>
    </header>

    <!-- 目录 -->
    <nav class="toc">
      <h2>目录</h2>
      <ul>
        {headings.map(heading => (
          <li style={`margin-left: ${(heading.depth - 2) * 1}rem`}>
            <a href={`#${heading.slug}`}>{heading.text}</a>
          </li>
        ))}
      </ul>
    </nav>

    <!-- 文章内容 -->
    <Content />
  </article>
</Layout>
```

## 路由系统

Astro 使用基于文件的路由系统，简单直观。

### 基础路由

```
src/pages/
├── index.astro          → /
├── about.astro          → /about
├── blog/
│   ├── index.astro      → /blog
│   ├── post-1.astro     → /blog/post-1
│   └── post-2.astro     → /blog/post-2
└── contact.astro        → /contact
```

### 动态路由

```astro
---
// src/pages/blog/[slug].astro
export function getStaticPaths() {
  return [
    { params: { slug: 'hello-world' } },
    { params: { slug: 'second-post' } },
    { params: { slug: 'third-post' } }
  ]
}

const { slug } = Astro.params
---

<h1>文章: {slug}</h1>
```

### 剩余参数路由

```astro
---
// src/pages/docs/[...path].astro
export function getStaticPaths() {
  return [
    { params: { path: undefined } },           // /docs
    { params: { path: 'getting-started' } },   // /docs/getting-started
    { params: { path: 'guides/routing' } },    // /docs/guides/routing
  ]
}

const { path } = Astro.params
---

<h1>文档路径: {path || '首页'}</h1>
```

### 分页

```astro
---
// src/pages/blog/[page].astro
import { getCollection } from 'astro:content'

export async function getStaticPaths({ paginate }) {
  const posts = await getCollection('blog')
  const sortedPosts = posts.sort((a, b) =>
    b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  )

  // 每页 10 篇文章
  return paginate(sortedPosts, { pageSize: 10 })
}

const { page } = Astro.props
---

<h1>博客 - 第 {page.currentPage} 页</h1>

<ul>
  {page.data.map(post => (
    <li>
      <a href={`/blog/${post.slug}`}>{post.data.title}</a>
    </li>
  ))}
</ul>

<nav>
  {page.url.prev && <a href={page.url.prev}>上一页</a>}
  <span>第 {page.currentPage} / {page.lastPage} 页</span>
  {page.url.next && <a href={page.url.next}>下一页</a>}
</nav>
```

## 布局系统

布局组件帮助你创建一致的页面结构。

### 基础布局

```astro
---
// src/layouts/BaseLayout.astro
interface Props {
  title: string
  description?: string
}

const { title, description = '默认描述' } = Astro.props
---

<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content={description}>
    <title>{title}</title>
    <link rel="stylesheet" href="/styles/global.css">
  </head>
  <body>
    <header>
      <nav>
        <a href="/">首页</a>
        <a href="/blog">博客</a>
        <a href="/about">关于</a>
      </nav>
    </header>

    <main>
      <slot />
    </main>

    <footer>
      <p>&copy; 2024 我的网站</p>
    </footer>
  </body>
</html>
```

### 使用布局

```astro
---
// src/pages/about.astro
import BaseLayout from '../layouts/BaseLayout.astro'
---

<BaseLayout title="关于我们" description="了解更多关于我们的信息">
  <h1>关于我们</h1>
  <p>这是关于页面的内容。</p>
</BaseLayout>
```

### 嵌套布局

```astro
---
// src/layouts/BlogLayout.astro
import BaseLayout from './BaseLayout.astro'

interface Props {
  title: string
  pubDate: Date
  author: string
}

const { title, pubDate, author } = Astro.props
---

<BaseLayout title={title}>
  <article class="blog-post">
    <header>
      <h1>{title}</h1>
      <div class="meta">
        <time datetime={pubDate.toISOString()}>
          {pubDate.toLocaleDateString('zh-CN')}
        </time>
        <span>作者: {author}</span>
      </div>
    </header>

    <slot />
  </article>
</BaseLayout>

<style>
  .blog-post {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .meta {
    color: #666;
    margin-bottom: 2rem;
  }
</style>
```

### 命名插槽

```astro
---
// src/layouts/TwoColumnLayout.astro
import BaseLayout from './BaseLayout.astro'

const { title } = Astro.props
---

<BaseLayout title={title}>
  <div class="container">
    <aside class="sidebar">
      <slot name="sidebar" />
    </aside>

    <main class="content">
      <slot />
    </main>
  </div>
</BaseLayout>

<style>
  .container {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;
  }
</style>
```

使用命名插槽：

```astro
---
import TwoColumnLayout from '../layouts/TwoColumnLayout.astro'
---

<TwoColumnLayout title="文档页面">
  <nav slot="sidebar">
    <ul>
      <li><a href="#section1">章节一</a></li>
      <li><a href="#section2">章节二</a></li>
    </ul>
  </nav>

  <article>
    <h1>主要内容</h1>
    <p>这里是页面的主要内容...</p>
  </article>
</TwoColumnLayout>
```

## MDX 支持

MDX 让你在 Markdown 中使用 JSX 组件，创造更丰富的内容体验。

### 安装 MDX 集成

```bash
npx astro add mdx
```

### 配置 MDX

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'

export default defineConfig({
  integrations: [mdx()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
})
```

### 创建 MDX 内容

```mdx
---
// src/content/blog/mdx-example.mdx
title: "MDX 示例"
description: "展示 MDX 的强大功能"
pubDate: 2024-01-15
---

import Callout from '../../components/Callout.astro'
import Counter from '../../components/Counter.jsx'

# 欢迎使用 MDX

这是普通的 Markdown 内容，但你可以在其中使用组件！

<Callout type="info">
  这是一个信息提示框，使用 Astro 组件创建。
</Callout>

## 交互式组件

下面是一个 React 计数器组件：

<Counter client:load />

## 代码示例

```javascript
function greet(name) {
  return `Hello, ${name}!`
}
```

<Callout type="warning">
  记得给交互式组件添加 `client:*` 指令！
</Callout>
```

### 自定义组件

```astro
---
// src/components/Callout.astro
interface Props {
  type?: 'info' | 'warning' | 'error' | 'success'
}

const { type = 'info' } = Astro.props

const styles = {
  info: { bg: '#e3f2fd', border: '#2196f3', icon: 'info' },
  warning: { bg: '#fff3e0', border: '#ff9800', icon: 'warning' },
  error: { bg: '#ffebee', border: '#f44336', icon: 'error' },
  success: { bg: '#e8f5e9', border: '#4caf50', icon: 'check' }
}

const style = styles[type]
---

<div class="callout" style={`background: ${style.bg}; border-left: 4px solid ${style.border}`}>
  <span class="icon">{style.icon}</span>
  <div class="content">
    <slot />
  </div>
</div>

<style>
  .callout {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
  }

  .icon {
    font-weight: bold;
  }

  .content {
    flex: 1;
  }
</style>
```

## 部署策略

Astro 支持多种部署方式，从静态托管到服务端渲染。

### 静态部署

默认情况下，Astro 生成静态 HTML 文件，可以部署到任何静态托管服务。

```bash
# 构建静态站点
npm run build

# 输出目录: dist/
```

### Vercel 部署

```bash
# 添加 Vercel 适配器
npx astro add vercel
```

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel/serverless'

export default defineConfig({
  output: 'server',
  adapter: vercel()
})
```

### Netlify 部署

```bash
# 添加 Netlify 适配器
npx astro add netlify
```

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import netlify from '@astrojs/netlify'

export default defineConfig({
  output: 'server',
  adapter: netlify()
})
```

### Cloudflare Pages 部署

```bash
# 添加 Cloudflare 适配器
npx astro add cloudflare
```

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'

export default defineConfig({
  output: 'server',
  adapter: cloudflare()
})
```

### Node.js 服务器部署

```bash
# 添加 Node.js 适配器
npx astro add node
```

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import node from '@astrojs/node'

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  })
})
```

### 混合渲染模式

混合模式允许你在同一项目中混用静态和动态页面：

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import netlify from '@astrojs/netlify'

export default defineConfig({
  output: 'hybrid',
  adapter: netlify()
})
```

```astro
---
// src/pages/static-page.astro
// 默认静态生成
---

<h1>这是静态页面</h1>
```

```astro
---
// src/pages/dynamic-page.astro
export const prerender = false  // 服务端渲染
---

<h1>这是动态页面</h1>
<p>当前时间: {new Date().toLocaleString('zh-CN')}</p>
```

## 实战案例：博客站点

下面是一个完整的博客站点示例：

### 项目配置

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  site: 'https://myblog.com',
  integrations: [
    mdx(),
    sitemap(),
    tailwind()
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark'
    }
  }
})
```

### 内容集合配置

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([])
  })
})

export const collections = { blog }
```

### 首页

```astro
---
// src/pages/index.astro
import { getCollection } from 'astro:content'
import BaseLayout from '../layouts/BaseLayout.astro'
import PostCard from '../components/PostCard.astro'

const posts = await getCollection('blog')
const recentPosts = posts
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  .slice(0, 6)
---

<BaseLayout title="我的博客">
  <section class="hero">
    <h1>欢迎来到我的博客</h1>
    <p>分享技术心得与生活感悟</p>
  </section>

  <section class="posts">
    <h2>最新文章</h2>
    <div class="post-grid">
      {recentPosts.map(post => (
        <PostCard post={post} />
      ))}
    </div>
    <a href="/blog" class="view-all">查看全部文章</a>
  </section>
</BaseLayout>

<style>
  .hero {
    text-align: center;
    padding: 4rem 0;
  }

  .post-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
  }

  .view-all {
    display: block;
    text-align: center;
    margin-top: 2rem;
  }
</style>
```

### 文章卡片组件

```astro
---
// src/components/PostCard.astro
import type { CollectionEntry } from 'astro:content'

interface Props {
  post: CollectionEntry<'blog'>
}

const { post } = Astro.props
---

<article class="card">
  {post.data.heroImage && (
    <img src={post.data.heroImage} alt={post.data.title} />
  )}
  <div class="content">
    <h3>
      <a href={`/blog/${post.slug}`}>{post.data.title}</a>
    </h3>
    <p>{post.data.description}</p>
    <div class="meta">
      <time datetime={post.data.pubDate.toISOString()}>
        {post.data.pubDate.toLocaleDateString('zh-CN')}
      </time>
      <div class="tags">
        {post.data.tags.map(tag => (
          <a href={`/tags/${tag}`} class="tag">#{tag}</a>
        ))}
      </div>
    </div>
  </div>
</article>

<style>
  .card {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
  }

  .card:hover {
    transform: translateY(-4px);
  }

  .card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .content {
    padding: 1.5rem;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    font-size: 0.875rem;
    color: #666;
  }

  .tag {
    color: #3b82f6;
    text-decoration: none;
  }
</style>
```

## 性能优化

### 图片优化

Astro 内置图片优化功能：

```astro
---
import { Image } from 'astro:assets'
import heroImage from '../assets/hero.jpg'
---

<!-- 自动优化图片 -->
<Image
  src={heroImage}
  alt="Hero image"
  width={800}
  height={400}
  format="webp"
  quality={80}
/>

<!-- 响应式图片 -->
<Image
  src={heroImage}
  alt="Hero image"
  widths={[400, 800, 1200]}
  sizes="(max-width: 600px) 400px, (max-width: 900px) 800px, 1200px"
/>
```

### 预获取链接

```astro
---
// 默认启用预获取
---

<!-- 悬停时预获取 -->
<a href="/about">关于</a>

<!-- 禁用预获取 -->
<a href="/external" data-astro-prefetch="false">外部链接</a>

<!-- 立即预获取 -->
<a href="/important" data-astro-prefetch="load">重要页面</a>
```

### View Transitions

Astro 支持原生 View Transitions API：

```astro
---
// src/layouts/BaseLayout.astro
import { ViewTransitions } from 'astro:transitions'
---

<html>
  <head>
    <ViewTransitions />
  </head>
  <body>
    <slot />
  </body>
</html>
```

```astro
---
// 自定义过渡动画
---

<img
  src="/hero.jpg"
  transition:name="hero-image"
  transition:animate="fade"
/>
```

## 总结

Astro 是一个强大而灵活的静态站点生成器，它的核心优势包括：

1. **极致性能**: 零 JavaScript 默认策略确保页面加载速度极快
2. **Islands 架构**: 智能的部分水合让你在需要时才加载交互性
3. **框架无关**: 支持 React、Vue、Svelte 等多种 UI 框架
4. **内容优先**: 内容集合和 MDX 支持让内容管理变得简单
5. **开发体验**: 热模块替换、TypeScript 支持和丰富的集成生态

无论是个人博客、文档站点还是企业官网，Astro 都是构建高性能 Web 应用的绝佳选择。通过本文的学习，你应该已经掌握了 Astro 的核心概念和实战技巧，现在就开始你的 Astro 之旅吧！

## 参考资源

- [Astro 官方文档](https://docs.astro.build)
- [Astro 集成目录](https://astro.build/integrations/)
- [Astro 主题市场](https://astro.build/themes/)
- [Astro GitHub 仓库](https://github.com/withastro/astro)
