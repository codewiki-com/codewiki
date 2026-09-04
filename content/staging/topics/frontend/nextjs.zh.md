---
title: Next.js 完全指南
description: 掌握Next.js全栈React框架，构建高性能的现代Web应用
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Next.js
  - React
  - SSR
  - 全栈
status: imported
origin: old/src/content/docs/frontend/nextjs.zh.md
divergence: 0.166
issues: []
legacy:
  category: Frontend
  subcategory: Framework
  order: 15
  lastUpdated: 2026-01-07
---

Next.js 是由 Vercel 开发的 React 全栈框架，它通过提供服务端渲染(SSR)、静态站点生成(SSG)、增量静态再生(ISR)等功能，让开发者能够构建高性能、SEO 友好的现代 Web 应用。本文将全面介绍 Next.js 的核心概念、最新特性以及实战技巧。

## Next.js 14/15 新特性

### Next.js 14 核心更新

Next.js 14 带来了多项重大改进，显著提升了开发体验和应用性能：

**1. Turbopack 稳定版**

Turbopack 是 Next.js 团队开发的 Rust 编译器，在 Next.js 14 中达到稳定状态：

```bash
# 使用 Turbopack 启动开发服务器
next dev --turbo
```

Turbopack 的优势：
- 本地服务器启动速度提升 53.3%
- 代码更新速度提升 94.7%（Fast Refresh）
- 初始路由编译速度提升 53.3%

**2. Server Actions 稳定版**

Server Actions 允许在服务端直接执行函数，无需创建 API 路由：

```javascript
// app/actions.js
'use server'

export async function createPost(formData) {
  const title = formData.get('title')
  const content = formData.get('content')

  // 直接访问数据库
  await db.post.create({
    data: { title, content }
  })

  // 重新验证缓存
  revalidatePath('/posts')
  return { success: true }
}
```

**3. 部分预渲染（Partial Prerendering）**

这是一项实验性功能，结合了静态和动态渲染的优点：

```javascript
// next.config.js
module.exports = {
  experimental: {
    ppr: true,
  },
}
```

### Next.js 15 重要更新

**1. React 19 支持**

Next.js 15 完整支持 React 19，包括新的编译器和并发特性。

**2. 改进的缓存策略**

默认缓存行为更加智能，fetch 请求不再默认缓存：

```javascript
// 明确指定缓存行为
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache'  // 或 'no-store'
})
```

**3. 增强的 Metadata API**

```javascript
// app/layout.js
export const metadata = {
  title: {
    template: '%s | 我的网站',
    default: '我的网站',
  },
  description: '使用 Next.js 构建的现代 Web 应用',
  openGraph: {
    title: '我的网站',
    description: '使用 Next.js 构建的现代 Web 应用',
    images: ['/og-image.png'],
  },
}
```

## App Router vs Pages Router

Next.js 提供两种路由系统，理解它们的差异对于项目选型至关重要。

### App Router（推荐）

App Router 是 Next.js 13+ 引入的新路由系统，基于 React Server Components 构建：

```
app/
├── layout.js          # 根布局
├── page.js            # 首页 (/)
├── about/
│   └── page.js        # 关于页 (/about)
├── blog/
│   ├── layout.js      # 博客布局
│   ├── page.js        # 博客列表 (/blog)
│   └── [slug]/
│       └── page.js    # 博客详情 (/blog/[slug])
└── api/
    └── hello/
        └── route.js   # API 路由 (/api/hello)
```

**App Router 特殊文件：**

| 文件 | 用途 |
|------|------|
| `page.js` | 定义路由的 UI |
| `layout.js` | 共享布局，保持状态 |
| `loading.js` | 加载状态 UI |
| `error.js` | 错误边界 |
| `not-found.js` | 404 页面 |
| `template.js` | 每次导航重新渲染的布局 |
| `default.js` | 并行路由的默认内容 |

### Pages Router（传统）

Pages Router 是 Next.js 的传统路由系统：

```
pages/
├── _app.js            # 应用入口
├── _document.js       # 文档结构
├── index.js           # 首页 (/)
├── about.js           # 关于页 (/about)
├── blog/
│   ├── index.js       # 博客列表 (/blog)
│   └── [slug].js      # 博客详情 (/blog/[slug])
└── api/
    └── hello.js       # API 路由 (/api/hello)
```

### 对比总结

| 特性 | App Router | Pages Router |
|------|------------|--------------|
| 默认渲染 | 服务端组件 | 客户端组件 |
| 数据获取 | async/await, Server Actions | getServerSideProps, getStaticProps |
| 布局系统 | 嵌套布局，状态保持 | _app.js 单一入口 |
| 流式渲染 | 原生支持 | 有限支持 |
| 学习曲线 | 较陡 | 较平缓 |

## 服务端组件与客户端组件

React Server Components 是 Next.js App Router 的核心概念。

### 服务端组件（默认）

App Router 中的组件默认为服务端组件：

```javascript
// app/posts/page.js - 服务端组件（默认）
export default async function PostsPage() {
  // 可以直接使用 async/await
  const posts = await fetch('https://api.example.com/posts').then(r => r.json())

  return (
    <div>
      <h1>博客文章</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  )
}
```

**服务端组件的优势：**

- 直接访问后端资源（数据库、文件系统）
- 保护敏感信息（API 密钥、令牌）
- 减少客户端 JavaScript 体积
- 更好的首屏加载性能

### 客户端组件

需要交互功能时，使用 `'use client'` 指令：

```javascript
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
    </div>
  )
}
```

**何时使用客户端组件：**

- 使用 React hooks（useState, useEffect 等）
- 需要浏览器 API（localStorage, window 等）
- 事件监听器和用户交互
- 使用依赖浏览器功能的第三方库

### 组合模式

最佳实践是将客户端组件放在组件树的叶子节点：

```javascript
// app/posts/[id]/page.js - 服务端组件
import LikeButton from './like-button'

export default async function PostPage({ params }) {
  const post = await fetchPost(params.id)

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      {/* 客户端组件作为子组件 */}
      <LikeButton postId={params.id} />
    </article>
  )
}
```

```javascript
// app/posts/[id]/like-button.js - 客户端组件
'use client'

import { useState } from 'react'

export default function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false)

  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? '已点赞' : '点赞'}
    </button>
  )
}
```

## 数据获取

Next.js 提供多种数据获取方式，适用于不同场景。

### Server Actions

Server Actions 是在服务端执行的异步函数：

```javascript
// app/actions.js
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData) {
  const title = formData.get('title')
  const content = formData.get('content')

  // 验证数据
  if (!title || !content) {
    return { error: '标题和内容不能为空' }
  }

  // 保存到数据库
  const post = await db.post.create({
    data: { title, content }
  })

  // 重新验证缓存
  revalidatePath('/posts')

  // 重定向到新文章
  redirect(`/posts/${post.id}`)
}
```

在客户端组件中使用：

```javascript
'use client'

import { createPost } from '@/app/actions'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中...' : '发布文章'}
    </button>
  )
}

export default function PostForm() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="标题" required />
      <textarea name="content" placeholder="内容" required />
      <SubmitButton />
    </form>
  )
}
```

### Fetch 数据获取

在服务端组件中直接使用 fetch：

```javascript
// 默认行为：请求会被去重
async function getData() {
  const res = await fetch('https://api.example.com/data')

  if (!res.ok) {
    throw new Error('获取数据失败')
  }

  return res.json()
}

// 静态数据（构建时获取）
const staticData = await fetch('https://api.example.com/data', {
  cache: 'force-cache'
})

// 动态数据（每次请求获取）
const dynamicData = await fetch('https://api.example.com/data', {
  cache: 'no-store'
})

// 基于时间的重新验证
const revalidatedData = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 } // 每小时重新验证
})

// 基于标签的重新验证
const taggedData = await fetch('https://api.example.com/data', {
  next: { tags: ['posts'] }
})
```

### 缓存重新验证

**基于路径的重新验证：**

```javascript
'use server'

import { revalidatePath } from 'next/cache'

export async function updatePost() {
  await updatePostInDatabase()

  // 重新验证特定页面
  revalidatePath('/blog')

  // 重新验证动态路由
  revalidatePath('/blog/[slug]', 'page')

  // 重新验证布局及其所有子页面
  revalidatePath('/blog', 'layout')
}
```

**基于标签的重新验证：**

```javascript
'use server'

import { revalidateTag } from 'next/cache'

export async function updatePosts() {
  await updatePostsInDatabase()

  // 重新验证所有带有 'posts' 标签的数据
  revalidateTag('posts')
}
```

## 路由系统

Next.js App Router 提供了强大而灵活的路由功能。

### 动态路由

**单个动态段：**

```javascript
// app/posts/[id]/page.js
export default async function PostPage({ params }) {
  const { id } = await params
  const post = await fetchPost(id)

  return <article>{post.title}</article>
}
```

**多个动态段：**

```javascript
// app/shop/[category]/[product]/page.js
export default async function ProductPage({ params }) {
  const { category, product } = await params

  return (
    <div>
      <p>分类: {category}</p>
      <p>产品: {product}</p>
    </div>
  )
}
```

**捕获所有路由：**

```javascript
// app/docs/[...slug]/page.js
// 匹配 /docs/a, /docs/a/b, /docs/a/b/c 等
export default async function DocsPage({ params }) {
  const { slug } = await params // ['a', 'b', 'c']

  return <div>路径: {slug.join('/')}</div>
}
```

**可选捕获所有路由：**

```javascript
// app/docs/[[...slug]]/page.js
// 也匹配 /docs（slug 为 undefined）
export default async function DocsPage({ params }) {
  const { slug } = await params // undefined 或 ['a', 'b']

  return <div>路径: {slug?.join('/') || '首页'}</div>
}
```

### 路由组

使用括号创建不影响 URL 的路由组：

```
app/
├── (marketing)/
│   ├── layout.js      # 营销布局
│   ├── about/
│   │   └── page.js    # /about
│   └── contact/
│       └── page.js    # /contact
├── (shop)/
│   ├── layout.js      # 商店布局
│   ├── products/
│   │   └── page.js    # /products
│   └── cart/
│       └── page.js    # /cart
└── layout.js          # 根布局
```

### 并行路由

并行路由允许在同一布局中同时渲染多个页面：

```
app/
├── dashboard/
│   ├── @analytics/
│   │   └── page.js
│   ├── @team/
│   │   └── page.js
│   ├── layout.js
│   └── page.js
```

```javascript
// app/dashboard/layout.js
export default function DashboardLayout({
  children,
  analytics,
  team,
}) {
  return (
    <div className="dashboard">
      <main>{children}</main>
      <aside>
        <div>{analytics}</div>
        <div>{team}</div>
      </aside>
    </div>
  )
}
```

### 拦截路由

拦截路由用于在当前布局中显示另一个路由的内容（如模态框）：

```
app/
├── feed/
│   └── page.js
├── photo/
│   └── [id]/
│       └── page.js
└── @modal/
    └── (.)photo/
        └── [id]/
            └── page.js
```

拦截约定：
- `(.)` - 匹配同级段
- `(..)` - 匹配上一级段
- `(..)(..)` - 匹配上两级段
- `(...)` - 匹配根目录

## 中间件与 API Routes

### 中间件

中间件在请求完成之前运行，可用于认证、重定向、国际化等：

```javascript
// middleware.js（项目根目录）
import { NextResponse } from 'next/server'

export function middleware(request) {
  // 获取请求信息
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // 认证检查
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 添加自定义头
  const response = NextResponse.next()
  response.headers.set('x-custom-header', 'my-value')

  return response
}

// 配置匹配路径
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**中间件常见用例：**

```javascript
// 国际化重定向
export function middleware(request) {
  const locale = request.cookies.get('locale')?.value || 'zh'
  const { pathname } = request.nextUrl

  if (!pathname.startsWith(`/${locale}`)) {
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    )
  }
}

// A/B 测试
export function middleware(request) {
  const bucket = request.cookies.get('bucket')?.value ||
    (Math.random() < 0.5 ? 'a' : 'b')

  const response = NextResponse.next()

  if (!request.cookies.has('bucket')) {
    response.cookies.set('bucket', bucket)
  }

  return response
}
```

### API Routes（Route Handlers）

在 App Router 中，API 路由使用 Route Handlers：

```javascript
// app/api/posts/route.js
import { NextResponse } from 'next/server'

// GET /api/posts
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page') || '1'

  const posts = await db.post.findMany({
    skip: (parseInt(page) - 1) * 10,
    take: 10,
  })

  return NextResponse.json(posts)
}

// POST /api/posts
export async function POST(request) {
  try {
    const body = await request.json()

    const post = await db.post.create({
      data: body,
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: '创建失败' },
      { status: 500 }
    )
  }
}
```

**动态 API 路由：**

```javascript
// app/api/posts/[id]/route.js
import { NextResponse } from 'next/server'

// GET /api/posts/[id]
export async function GET(request, { params }) {
  const { id } = await params

  const post = await db.post.findUnique({
    where: { id: parseInt(id) },
  })

  if (!post) {
    return NextResponse.json(
      { error: '文章不存在' },
      { status: 404 }
    )
  }

  return NextResponse.json(post)
}

// PUT /api/posts/[id]
export async function PUT(request, { params }) {
  const { id } = await params
  const body = await request.json()

  const post = await db.post.update({
    where: { id: parseInt(id) },
    data: body,
  })

  return NextResponse.json(post)
}

// DELETE /api/posts/[id]
export async function DELETE(request, { params }) {
  const { id } = await params

  await db.post.delete({
    where: { id: parseInt(id) },
  })

  return new NextResponse(null, { status: 204 })
}
```

## 静态生成与增量静态再生(ISR)

### 静态生成（SSG）

在构建时生成静态页面：

```javascript
// app/posts/[id]/page.js

// 定义需要预渲染的路径
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(
    res => res.json()
  )

  return posts.map(post => ({
    id: String(post.id),
  }))
}

export default async function PostPage({ params }) {
  const { id } = await params
  const post = await fetch(`https://api.example.com/posts/${id}`).then(
    res => res.json()
  )

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  )
}
```

### 增量静态再生（ISR）

ISR 允许在不重新构建整个站点的情况下更新静态页面：

```javascript
// app/posts/[id]/page.js

// 设置重新验证时间（秒）
export const revalidate = 60

export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(
    res => res.json()
  )

  return posts.map(post => ({
    id: String(post.id),
  }))
}

export default async function PostPage({ params }) {
  const { id } = await params

  const post = await fetch(`https://api.example.com/posts/${id}`, {
    next: { revalidate: 60 } // 每 60 秒重新验证
  }).then(res => res.json())

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <p>更新时间: {new Date().toISOString()}</p>
    </article>
  )
}
```

**按需重新验证：**

```javascript
// app/api/revalidate/route.js
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { secret, path, tag } = await request.json()

  // 验证密钥
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: '无效密钥' }, { status: 401 })
  }

  if (path) {
    revalidatePath(path)
  }

  if (tag) {
    revalidateTag(tag)
  }

  return NextResponse.json({ revalidated: true, now: Date.now() })
}
```

### 动态渲染控制

```javascript
// 强制动态渲染
export const dynamic = 'force-dynamic'

// 强制静态渲染
export const dynamic = 'force-static'

// 默认行为（自动检测）
export const dynamic = 'auto'

// 错误时显示静态页面
export const dynamicParams = false
```

## 部署与优化

### 图片优化

Next.js 提供内置的图片优化组件：

```javascript
import Image from 'next/image'

export default function Avatar() {
  return (
    <Image
      src="/avatar.jpg"
      alt="用户头像"
      width={200}
      height={200}
      priority // 首屏图片优先加载
      placeholder="blur" // 加载时显示模糊效果
      blurDataURL="data:image/..." // 模糊占位图
    />
  )
}

// 响应式图片
export default function Banner() {
  return (
    <Image
      src="/banner.jpg"
      alt="横幅"
      fill // 填充父容器
      sizes="(max-width: 768px) 100vw, 50vw"
      style={{ objectFit: 'cover' }}
    />
  )
}
```

### 字体优化

使用 `next/font` 自动优化字体：

```javascript
// app/layout.js
import { Inter, Noto_Sans_SC } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-noto',
})

export default function RootLayout({ children }) {
  return (
    <html lang="zh" className={`${inter.variable} ${notoSansSC.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### 脚本优化

```javascript
import Script from 'next/script'

export default function Page() {
  return (
    <>
      {/* 页面交互后加载 */}
      <Script
        src="https://analytics.example.com/script.js"
        strategy="lazyOnload"
      />

      {/* 页面加载后立即执行 */}
      <Script
        src="https://widget.example.com/widget.js"
        strategy="afterInteractive"
      />

      {/* 在 hydration 之前加载 */}
      <Script
        src="https://critical.example.com/critical.js"
        strategy="beforeInteractive"
      />
    </>
  )
}
```

### 生产构建优化

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 输出为独立部署
  output: 'standalone',

  // 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.example.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // 实验性功能
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },

  // 压缩
  compress: true,

  // 生产环境移除 console
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
```

### 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 部署到生产环境
vercel --prod
```

### 自托管部署

```bash
# 构建
npm run build

# 启动生产服务器
npm run start

# 或使用 standalone 输出
node .next/standalone/server.js
```

**Docker 部署：**

```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

## 实战案例

### 博客系统完整示例

**项目结构：**

```
app/
├── layout.js
├── page.js
├── globals.css
├── blog/
│   ├── page.js              # 文章列表
│   └── [slug]/
│       └── page.js          # 文章详情
├── admin/
│   ├── layout.js
│   └── posts/
│       ├── page.js          # 文章管理
│       └── new/
│           └── page.js      # 新建文章
├── api/
│   └── posts/
│       └── route.js
└── actions/
    └── posts.js
```

**Server Actions 实现：**

```javascript
// app/actions/posts.js
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData) {
  const title = formData.get('title')
  const slug = formData.get('slug')
  const content = formData.get('content')
  const published = formData.get('published') === 'on'

  if (!title || !slug || !content) {
    return { error: '请填写所有必填字段' }
  }

  try {
    await db.post.create({
      data: {
        title,
        slug,
        content,
        published,
        createdAt: new Date(),
      },
    })

    revalidatePath('/blog')
    revalidatePath('/admin/posts')
  } catch (error) {
    return { error: '创建文章失败' }
  }

  redirect('/admin/posts')
}

export async function updatePost(id, formData) {
  const title = formData.get('title')
  const content = formData.get('content')
  const published = formData.get('published') === 'on'

  try {
    const post = await db.post.update({
      where: { id },
      data: { title, content, published, updatedAt: new Date() },
    })

    revalidatePath('/blog')
    revalidatePath(`/blog/${post.slug}`)
    revalidatePath('/admin/posts')

    return { success: true }
  } catch (error) {
    return { error: '更新失败' }
  }
}

export async function deletePost(id) {
  try {
    const post = await db.post.delete({
      where: { id },
    })

    revalidatePath('/blog')
    revalidatePath(`/blog/${post.slug}`)
    revalidatePath('/admin/posts')

    return { success: true }
  } catch (error) {
    return { error: '删除失败' }
  }
}
```

**博客列表页：**

```javascript
// app/blog/page.js
import Link from 'next/link'

async function getPosts() {
  const posts = await db.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
    },
  })
  return posts
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">博客文章</h1>
      <div className="space-y-4">
        {posts.map(post => (
          <article key={post.id} className="border-b pb-4">
            <Link href={`/blog/${post.slug}`}>
              <h2 className="text-xl font-semibold hover:text-blue-600">
                {post.title}
              </h2>
            </Link>
            <time className="text-gray-500">
              {new Date(post.createdAt).toLocaleDateString('zh-CN')}
            </time>
          </article>
        ))}
      </div>
    </div>
  )
}
```

**文章详情页（带 ISR）：**

```javascript
// app/blog/[slug]/page.js
import { notFound } from 'next/navigation'

export const revalidate = 3600 // 每小时重新验证

export async function generateStaticParams() {
  const posts = await db.post.findMany({
    where: { published: true },
    select: { slug: true },
  })

  return posts.map(post => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = await db.post.findUnique({
    where: { slug },
    select: { title: true, content: true },
  })

  if (!post) return {}

  return {
    title: post.title,
    description: post.content.slice(0, 160),
  }
}

async function getPost(slug) {
  const post = await db.post.findUnique({
    where: { slug, published: true },
  })
  return post
}

export default async function PostPage({ params }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <article className="max-w-4xl mx-auto py-8 prose">
      <h1>{post.title}</h1>
      <time className="text-gray-500">
        {new Date(post.createdAt).toLocaleDateString('zh-CN')}
      </time>
      <div className="post-content">{post.content}</div>
    </article>
  )
}
```

## 面试要点

### 高频面试题

**1. App Router 和 Pages Router 的区别是什么？**

- App Router 基于 React Server Components，默认服务端渲染
- App Router 支持嵌套布局、并行路由、拦截路由
- App Router 使用文件约定（page.js, layout.js 等）
- Pages Router 使用 getServerSideProps/getStaticProps 获取数据
- App Router 推荐使用 Server Actions 处理数据变更

**2. 服务端组件和客户端组件如何选择？**

服务端组件：
- 数据获取和数据库访问
- 保护敏感信息
- 减少客户端 JS 体积
- 不需要交互的 UI

客户端组件：
- 需要使用 React hooks
- 需要事件监听器
- 需要浏览器 API
- 需要第三方客户端库

**3. 什么是 ISR？它是如何工作的？**

增量静态再生（ISR）允许在不重建整个站点的情况下更新静态页面：
- 首次请求返回缓存的静态页面
- 在后台重新生成页面
- 后续请求返回更新后的页面
- 通过 `revalidate` 选项控制更新频率

**4. Server Actions 的优势是什么？**

- 无需创建 API 路由
- 自动处理表单提交
- 支持渐进增强（无 JS 也能工作）
- 与缓存重新验证无缝集成
- 类型安全（TypeScript 支持）

**5. 如何优化 Next.js 应用的性能？**

- 使用 Image 组件优化图片
- 使用 next/font 优化字体
- 合理使用 SSG 和 ISR
- 代码分割和懒加载
- 使用 Turbopack 加速开发
- 优化第三方脚本加载策略
- 利用 React Server Components 减少客户端 JS

**6. 中间件的使用场景有哪些？**

- 认证和授权检查
- 国际化路由重定向
- A/B 测试分流
- 请求日志记录
- 地理位置重定向
- Bot 检测和防护

### 实战建议

1. **项目初始化**：使用 `create-next-app` 快速创建项目，选择 App Router
2. **目录结构**：按功能模块组织代码，合理使用路由组
3. **状态管理**：服务端状态用 Server Actions，客户端状态用 React Context 或 Zustand
4. **数据获取**：优先使用服务端组件直接获取，需要时使用 SWR 或 React Query
5. **部署策略**：根据项目需求选择 Vercel 或自托管方案

## 延伸阅读

### 官方资源

- [Next.js 官方文档](https://nextjs.org/docs)
- [Next.js Learn 教程](https://nextjs.org/learn)
- [Vercel 部署指南](https://vercel.com/docs)

### 推荐工具

- **Prisma**：类型安全的数据库 ORM
- **NextAuth.js**：认证解决方案
- **Tailwind CSS**：实用优先的 CSS 框架
- **Zustand**：轻量级状态管理
- **SWR/React Query**：数据获取和缓存

### 进阶主题

- **Edge Runtime**：在边缘节点运行代码
- **Streaming**：流式传输服务端组件
- **Parallel Routes**：复杂布局模式
- **Route Handlers**：构建 API 端点

## 总结

Next.js 作为 React 生态系统中最流行的全栈框架，持续引领着现代 Web 开发的最佳实践。通过本文的学习，你应该能够：

1. 理解 Next.js 14/15 的新特性和改进
2. 掌握 App Router 的核心概念和使用方法
3. 正确区分和使用服务端组件与客户端组件
4. 灵活运用各种数据获取和缓存策略
5. 构建复杂的路由结构和 API 接口
6. 优化和部署生产级别的 Next.js 应用

随着 React Server Components 和 Server Actions 的成熟，Next.js 正在重新定义全栈开发的方式。持续关注官方更新，在实际项目中实践这些概念，将帮助你成为一名优秀的全栈开发者。
