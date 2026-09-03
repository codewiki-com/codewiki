---
title: React Server Components 深度解析
description: 深入理解 React Server Components 的工作原理、使用场景和最佳实践
track: frontend
section: react
difficulty: advanced
tags:
  - React
  - RSC
  - Server Components
  - Next.js
status: imported
origin: old/src/content/docs/frontend/react-server-components.zh.md
divergence: 0.217
issues:
  - title-lang-en
  - title-language
legacy:
  category: Frontend
  subcategory: React
  order: 25
  lastUpdated: 2026-01-07
---

React Server Components (RSC) 是 React 团队推出的革命性架构，它从根本上改变了我们构建 React 应用的方式。通过在服务端运行组件，RSC 实现了更好的性能、更小的客户端包体积，以及更简单的数据获取模式。本文将全面深入地介绍 RSC 的核心概念、工作原理、使用方法和最佳实践。

## 什么是 React Server Components

React Server Components 是一种新型组件范式，这些组件在服务端（或构建时）执行渲染，而不是在客户端浏览器中运行。

### 核心特性

- **零客户端 JavaScript**：服务端组件的代码不会被包含在客户端的 JavaScript 包中
- **直接访问后端资源**：可以直接访问数据库、文件系统、内部 API 等服务端资源
- **自动代码分割**：服务端组件与客户端组件之间形成天然的代码分割边界
- **流式渲染支持**：可以与 Suspense 配合实现 HTML 流式传输
- **异步组件**：支持 async/await 语法，可以在渲染过程中进行异步操作

### RSC 的架构理念

RSC 结合了传统服务端渲染（SSR）和客户端单页应用（SPA）的优势：

```
┌─────────────────────────────────────────────────────────────────┐
│                     RSC 架构优势                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  传统 MPA（多页应用）    +    现代 SPA（单页应用）                   │
│        │                          │                             │
│   简单的请求/响应模型         无缝的交互体验                        │
│   服务端数据获取              客户端状态管理                        │
│   快速首屏渲染                丰富的用户交互                        │
│                                                                 │
│                        ▼                                        │
│                                                                 │
│              React Server Components                            │
│        两者兼具 + 最优的包体积 + 最佳开发体验                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 基础示例

```jsx
// 这是一个服务端组件（在 Next.js App Router 中默认）
// 可以直接使用 async/await 获取数据
async function ArticleList() {
  // 直接访问数据库，无需创建 API 端点
  const articles = await db.article.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      author: true,
      tags: true
    }
  })

  return (
    <ul className="article-list">
      {articles.map(article => (
        <li key={article.id} className="article-item">
          <h2>{article.title}</h2>
          <p className="author">作者：{article.author.name}</p>
          <p className="summary">{article.summary}</p>
          <div className="tags">
            {article.tags.map(tag => (
              <span key={tag.id} className="tag">{tag.name}</span>
            ))}
          </div>
        </li>
      ))}
    </ul>
  )
}
```

## 服务端组件 vs 客户端组件

理解服务端组件和客户端组件的区别是掌握 RSC 架构的关键。

### 服务端组件（Server Components）

服务端组件在服务端执行，具有以下特点：

**优势：**

- 可以直接访问后端资源（数据库、文件系统、内部微服务）
- 保护敏感信息（API 密钥、数据库凭证、业务逻辑等不会暴露给客户端）
- 显著减少客户端 JavaScript 体积（大型依赖如 markdown 解析器、语法高亮等只在服务端使用）
- 更快的首屏加载时间（关键内容直接以 HTML 形式返回）
- 更好的 SEO 支持（搜索引擎可以直接抓取渲染后的内容）
- 利用服务端的计算资源进行复杂运算

**限制：**

- 不能使用 React hooks（useState, useEffect, useContext 等）
- 不能使用浏览器 API（localStorage, window, document 等）
- 不能添加事件监听器（onClick, onChange, onSubmit 等）
- 不能使用仅客户端的第三方库（如某些动画库）
- 组件不会重新渲染（需要通过 revalidation 机制更新）

```jsx
// 服务端组件示例 - 用户资料页面
import { headers } from 'next/headers'
import { cache } from 'react'

// 使用 cache 避免同一请求中的重复调用
const getUser = cache(async (userId) => {
  return await db.user.findUnique({
    where: { id: userId },
    include: {
      posts: { take: 5, orderBy: { createdAt: 'desc' } },
      followers: { select: { id: true } }
    }
  })
})

async function UserProfile({ userId }) {
  // 直接查询数据库
  const user = await getUser(userId)

  if (!user) {
    notFound()
  }

  // 访问环境变量（敏感信息安全）
  const analyticsKey = process.env.INTERNAL_ANALYTICS_KEY

  // 调用内部服务（不暴露给客户端）
  const analytics = await fetch(
    `http://internal-analytics.service/users/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${analyticsKey}`,
        'X-Request-ID': headers().get('x-request-id')
      },
      // 在 Next.js 中配置缓存
      next: { revalidate: 60 }
    }
  ).then(res => res.json())

  // 进行复杂计算（在服务端完成，不增加客户端负担）
  const engagementScore = calculateEngagementScore(analytics)

  return (
    <div className="user-profile">
      <header className="profile-header">
        <img src={user.avatar} alt={user.name} />
        <h1>{user.name}</h1>
        <p className="bio">{user.bio}</p>
      </header>

      <div className="stats">
        <div className="stat">
          <span className="value">{user.posts.length}</span>
          <span className="label">文章</span>
        </div>
        <div className="stat">
          <span className="value">{user.followers.length}</span>
          <span className="label">粉丝</span>
        </div>
        <div className="stat">
          <span className="value">{engagementScore}</span>
          <span className="label">活跃度</span>
        </div>
      </div>

      <section className="recent-posts">
        <h2>最近文章</h2>
        {user.posts.map(post => (
          <article key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.excerpt}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
```

### 客户端组件（Client Components）

客户端组件在浏览器中执行，用于处理交互逻辑：

**使用场景：**

- 需要使用 React hooks（状态管理、副作用、上下文等）
- 需要事件处理（点击、输入、滚动、拖拽等）
- 需要浏览器 API（地理位置、本地存储、剪贴板、通知等）
- 需要使用仅客户端的第三方库（图表库、动画库、编辑器等）
- 需要实时更新 UI（倒计时、实时数据、表单验证等）

```jsx
'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { likeArticle, unlikeArticle } from '@/actions/articles'

export function LikeButton({ articleId, initialLikes, initialIsLiked }) {
  const router = useRouter()
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [isPending, startTransition] = useTransition()

  // 从本地存储同步状态（客户端专属）
  useEffect(() => {
    const storedLikes = localStorage.getItem(`article-likes`)
    if (storedLikes) {
      const likesMap = JSON.parse(storedLikes)
      if (likesMap[articleId] !== undefined) {
        setIsLiked(likesMap[articleId])
      }
    }
  }, [articleId])

  const handleLike = useCallback(async () => {
    // 乐观更新 - 立即更新 UI
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikes(prev => newIsLiked ? prev + 1 : prev - 1)

    // 更新本地存储
    const storedLikes = localStorage.getItem('article-likes') || '{}'
    const likesMap = JSON.parse(storedLikes)
    likesMap[articleId] = newIsLiked
    localStorage.setItem('article-likes', JSON.stringify(likesMap))

    // 使用 Server Action 更新服务端
    startTransition(async () => {
      try {
        const result = newIsLiked
          ? await likeArticle(articleId)
          : await unlikeArticle(articleId)

        if (!result.success) {
          // 回滚乐观更新
          setIsLiked(!newIsLiked)
          setLikes(prev => newIsLiked ? prev - 1 : prev + 1)
        }
      } catch (error) {
        // 发生错误时回滚
        setIsLiked(!newIsLiked)
        setLikes(prev => newIsLiked ? prev - 1 : prev + 1)
        console.error('点赞操作失败:', error)
      }
    })
  }, [articleId, isLiked])

  return (
    <button
      onClick={handleLike}
      disabled={isPending}
      className={`like-button ${isLiked ? 'liked' : ''}`}
      aria-label={isLiked ? '取消点赞' : '点赞'}
    >
      <HeartIcon filled={isLiked} />
      <span className="count">{likes}</span>
      {isPending && <span className="loading">...</span>}
    </button>
  )
}
```

### 对比总结

| 特性 | 服务端组件 | 客户端组件 |
|------|-----------|-----------|
| 执行环境 | 服务端/构建时 | 浏览器 |
| JavaScript 包 | 不包含 | 包含 |
| 数据获取 | async/await 直接获取 | useEffect/SWR/React Query |
| 状态管理 | 不支持 hooks | 完全支持 |
| 事件处理 | 不支持 | 完全支持 |
| 浏览器 API | 不可用 | 完全可用 |
| 后端资源 | 直接访问 | 通过 API/Server Actions |
| 敏感数据 | 安全（不发送到客户端） | 不安全（会暴露） |
| 重新渲染 | 需要 revalidation | 状态变化自动触发 |
| 适用场景 | 静态内容、数据展示 | 交互、动态 UI |

## 'use client' 和 'use server' 指令

### 'use client' 指令

`'use client'` 指令用于标记客户端组件的边界，告诉打包器这个模块及其依赖需要包含在客户端 bundle 中。

```jsx
'use client'

// 这个指令必须放在文件的最顶部
// 在任何 import 语句之前
// 只能使用字符串字面量，不能使用变量

import { useState, useCallback, memo } from 'react'

export const Counter = memo(function Counter({ initialValue = 0 }) {
  const [count, setCount] = useState(initialValue)

  const increment = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  const decrement = useCallback(() => {
    setCount(c => Math.max(0, c - 1))
  }, [])

  return (
    <div className="counter">
      <button onClick={decrement} aria-label="减少">-</button>
      <span className="count" aria-live="polite">{count}</span>
      <button onClick={increment} aria-label="增加">+</button>
    </div>
  )
})
```

### 边界传播规则

当一个文件被标记为 `'use client'`，它导入的所有模块也会被视为客户端代码并包含在客户端 bundle 中：

```jsx
'use client'

// 这些模块都会被包含在客户端包中
// 即使它们没有 'use client' 指令
import { formatDate, formatCurrency } from '@/utils/formatters'
import { Button } from '@/components/Button'
import { validateEmail } from '@/utils/validation'

export function OrderForm({ products }) {
  // 所有导入的工具函数都可以在这里使用
  // 它们会被打包到客户端代码中
  return (
    <form>
      {products.map(product => (
        <div key={product.id}>
          <span>{product.name}</span>
          <span>{formatCurrency(product.price)}</span>
        </div>
      ))}
      <Button type="submit">提交订单</Button>
    </form>
  )
}
```

### 'use server' 指令

`'use server'` 指令用于定义 Server Actions，这些函数只在服务端执行：

```jsx
// actions/posts.js
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// 定义验证 schema
const CreatePostSchema = z.object({
  title: z.string().min(3, '标题至少3个字符').max(100, '标题最多100个字符'),
  content: z.string().min(10, '内容至少10个字符'),
  categoryId: z.string().uuid('无效的分类ID'),
  tags: z.array(z.string()).max(5, '最多5个标签').optional()
})

export async function createPost(prevState, formData) {
  // 验证用户身份
  const session = await auth()
  if (!session?.user) {
    return { error: '请先登录' }
  }

  // 解析和验证表单数据
  const validatedFields = CreatePostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    categoryId: formData.get('categoryId'),
    tags: formData.getAll('tags')
  })

  if (!validatedFields.success) {
    return {
      error: '验证失败',
      fieldErrors: validatedFields.error.flatten().fieldErrors
    }
  }

  const { title, content, categoryId, tags } = validatedFields.data

  try {
    // 创建文章
    const post = await db.post.create({
      data: {
        title,
        content,
        slug: generateSlug(title),
        categoryId,
        authorId: session.user.id,
        tags: tags ? {
          connectOrCreate: tags.map(tag => ({
            where: { name: tag },
            create: { name: tag }
          }))
        } : undefined,
        publishedAt: new Date()
      }
    })

    // 重新验证相关缓存
    revalidatePath('/blog')
    revalidateTag('posts')

    // 重定向到新文章
    redirect(`/blog/${post.slug}`)
  } catch (error) {
    console.error('创建文章失败:', error)
    return { error: '创建文章失败，请稍后重试' }
  }
}

export async function deletePost(postId) {
  const session = await auth()
  if (!session?.user) {
    return { error: '请先登录' }
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { authorId: true }
  })

  if (!post) {
    return { error: '文章不存在' }
  }

  if (post.authorId !== session.user.id) {
    return { error: '无权删除此文章' }
  }

  await db.post.delete({ where: { id: postId } })
  revalidatePath('/blog')
  revalidateTag('posts')

  return { success: true }
}
```

### 最佳实践：最小化客户端边界

将 `'use client'` 指令放在组件树的尽可能低的位置，以最大化服务端渲染的优势：

```jsx
// 不推荐：整个页面都变成客户端组件
'use client'

export function ProductPage({ productId }) {
  const [quantity, setQuantity] = useState(1)

  // 这些数据本可以在服务端获取，现在需要额外的客户端请求
  const { data: product } = useSWR(`/api/products/${productId}`)
  const { data: reviews } = useSWR(`/api/products/${productId}/reviews`)

  if (!product) return <Loading />

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <QuantitySelector value={quantity} onChange={setQuantity} />
      <Reviews data={reviews} />
    </div>
  )
}
```

```jsx
// 推荐：只有需要交互的部分是客户端组件
// ProductPage.jsx（服务端组件）
import { Suspense } from 'react'
import { QuantitySelector } from './QuantitySelector'
import { AddToCartButton } from './AddToCartButton'
import { ReviewList } from './ReviewList'

async function ProductPage({ params }) {
  const { productId } = await params

  // 在服务端并行获取数据
  const [product, reviews] = await Promise.all([
    db.product.findUnique({
      where: { id: productId },
      include: { category: true, brand: true }
    }),
    db.review.findMany({
      where: { productId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ])

  if (!product) notFound()

  return (
    <div className="product-page">
      {/* 静态内容 - 服务端渲染 */}
      <div className="product-info">
        <img src={product.image} alt={product.name} />
        <h1>{product.name}</h1>
        <p className="brand">{product.brand.name}</p>
        <p className="description">{product.description}</p>
        <p className="price">{formatPrice(product.price)}</p>
      </div>

      {/* 交互部分 - 客户端组件 */}
      <div className="purchase-section">
        <QuantitySelector productId={product.id} stock={product.stock} />
        <AddToCartButton product={product} />
      </div>

      {/* 评论列表 - 静态内容服务端渲染 */}
      <section className="reviews">
        <h2>用户评价 ({reviews.length})</h2>
        <ReviewList reviews={reviews} />
        {/* 只有提交评论的表单需要客户端交互 */}
        <Suspense fallback={<div>加载评论表单...</div>}>
          <ReviewForm productId={product.id} />
        </Suspense>
      </section>
    </div>
  )
}

// QuantitySelector.jsx（客户端组件）
'use client'

import { useState, useCallback } from 'react'

export function QuantitySelector({ productId, stock }) {
  const [quantity, setQuantity] = useState(1)

  const decrease = useCallback(() => {
    setQuantity(q => Math.max(1, q - 1))
  }, [])

  const increase = useCallback(() => {
    setQuantity(q => Math.min(stock, q + 1))
  }, [stock])

  return (
    <div className="quantity-selector">
      <button onClick={decrease} disabled={quantity <= 1}>-</button>
      <input
        type="number"
        value={quantity}
        onChange={e => setQuantity(Math.min(stock, Math.max(1, +e.target.value)))}
        min={1}
        max={stock}
      />
      <button onClick={increase} disabled={quantity >= stock}>+</button>
      <span className="stock-info">库存: {stock}</span>
    </div>
  )
}
```

## 数据获取模式

RSC 引入了全新的数据获取模式，使数据获取更加直观、高效和类型安全。

### 服务端组件中的数据获取

在服务端组件中，可以直接使用 async/await 进行数据获取：

```jsx
import { cache } from 'react'

// 使用 cache 函数避免同一渲染周期中的重复请求
const getUser = cache(async (userId) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  })
  return user
})

const getStats = cache(async (userId) => {
  const [postCount, followerCount, followingCount] = await Promise.all([
    db.post.count({ where: { authorId: userId } }),
    db.follow.count({ where: { followingId: userId } }),
    db.follow.count({ where: { followerId: userId } })
  ])
  return { postCount, followerCount, followingCount }
})

// 直接在组件中获取数据
async function Dashboard({ userId }) {
  // 并行获取多个数据源
  const [user, stats, notifications] = await Promise.all([
    getUser(userId),
    getStats(userId),
    getNotifications(userId)
  ])

  return (
    <div className="dashboard">
      <UserInfo user={user} />
      <StatsCard stats={stats} />
      <NotificationList notifications={notifications} />
    </div>
  )
}
```

### 数据获取与缓存策略

使用 fetch 时可以配置不同的缓存策略，这在 Next.js App Router 中得到了良好的支持：

```jsx
async function BlogPosts() {
  // 策略 1：静态数据 - 永久缓存直到手动重新验证
  // 类似于 getStaticProps
  const staticPosts = await fetch('https://api.example.com/posts', {
    cache: 'force-cache' // 这是默认值，可以省略
  }).then(res => res.json())

  // 策略 2：动态数据 - 每次请求都获取最新数据
  // 类似于 getServerSideProps
  const latestNews = await fetch('https://api.example.com/news', {
    cache: 'no-store'
  }).then(res => res.json())

  // 策略 3：基于时间的重新验证 - ISR (Incremental Static Regeneration)
  // 每 60 秒重新验证一次
  const popularPosts = await fetch('https://api.example.com/popular', {
    next: { revalidate: 60 }
  }).then(res => res.json())

  // 策略 4：基于标签的重新验证 - 按需重新验证
  // 可以通过 revalidateTag('featured') 触发更新
  const featuredPosts = await fetch('https://api.example.com/featured', {
    next: { tags: ['featured-posts', 'homepage'] }
  }).then(res => res.json())

  return (
    <div className="blog-posts">
      <section>
        <h2>精选文章</h2>
        <PostGrid posts={featuredPosts} />
      </section>
      <section>
        <h2>热门文章</h2>
        <PostList posts={popularPosts} />
      </section>
      <section>
        <h2>最新动态</h2>
        <NewsList news={latestNews} />
      </section>
    </div>
  )
}
```

### 数据获取模式对比

```jsx
// 模式 1：顺序获取（瀑布流）- 不推荐
// 总耗时 = getUser + getPosts + getComments
async function SlowDashboard({ userId }) {
  const user = await getUser(userId)           // 1秒
  const posts = await getPosts(user.id)        // 等待完成后再获取 1秒
  const comments = await getComments(user.id)  // 再等待 1秒
  // 总计约 3 秒

  return <Dashboard user={user} posts={posts} comments={comments} />
}

// 模式 2：并行获取 - 推荐
// 总耗时 = max(getUser, getPosts, getComments)
async function FastDashboard({ userId }) {
  // 同时发起所有独立请求
  const [user, posts, comments] = await Promise.all([
    getUser(userId),      // 1秒
    getPosts(userId),     // 1秒（并行）
    getComments(userId)   // 1秒（并行）
  ])
  // 总计约 1 秒

  return <Dashboard user={user} posts={posts} comments={comments} />
}

// 模式 3：流式加载 - 最佳用户体验
// 关键内容立即显示，非关键内容渐进加载
async function StreamingDashboard({ userId }) {
  // 关键数据先获取并等待
  const user = await getUser(userId)

  // 非关键数据创建 Promise，但不等待
  // 这些数据会通过流式传输发送到客户端
  const postsPromise = getPosts(user.id)
  const commentsPromise = getComments()
  const recommendationsPromise = getRecommendations(user.id)

  return (
    <div className="dashboard">
      {/* 立即渲染 - 用户信息是关键数据 */}
      <UserHeader user={user} />

      {/* 流式加载 - 文章列表 */}
      <Suspense fallback={<PostsSkeleton />}>
        <Posts promise={postsPromise} />
      </Suspense>

      <div className="sidebar">
        {/* 流式加载 - 评论 */}
        <Suspense fallback={<CommentsSkeleton />}>
          <Comments promise={commentsPromise} />
        </Suspense>

        {/* 流式加载 - 推荐 */}
        <Suspense fallback={<RecommendationsSkeleton />}>
          <Recommendations promise={recommendationsPromise} />
        </Suspense>
      </div>
    </div>
  )
}

// Posts 组件 - 客户端组件使用 use hook 解析 Promise
'use client'

import { use } from 'react'

function Posts({ promise }) {
  const posts = use(promise)

  return (
    <section className="posts">
      <h2>最新文章</h2>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </section>
  )
}
```

### 数据预加载模式

```jsx
// data.js - 数据层
import { cache } from 'react'

// 使用 cache 确保同一渲染周期内的重复调用共享结果
export const getUser = cache(async (userId) => {
  console.log('Fetching user', userId)
  const response = await fetch(`/api/users/${userId}`, {
    next: { tags: [`user-${userId}`] }
  })
  return response.json()
})

export const getUserPosts = cache(async (userId) => {
  const response = await fetch(`/api/users/${userId}/posts`, {
    next: { tags: [`user-${userId}-posts`] }
  })
  return response.json()
})

// 预加载函数 - 提前触发数据获取
export const preloadUser = (userId) => {
  void getUser(userId)
}

export const preloadUserPosts = (userId) => {
  void getUserPosts(userId)
}

// UserProfile.jsx - 使用预加载
import { preloadUser, getUser, getUserPosts, preloadUserPosts } from './data'
import { Suspense } from 'react'

function UserProfile({ userId }) {
  // 立即开始预加载数据
  preloadUser(userId)
  preloadUserPosts(userId)

  return (
    <div className="user-profile">
      <Suspense fallback={<UserInfoSkeleton />}>
        <UserInfo userId={userId} />
      </Suspense>

      <Suspense fallback={<UserPostsSkeleton />}>
        <UserPosts userId={userId} />
      </Suspense>
    </div>
  )
}

async function UserInfo({ userId }) {
  // 此时数据可能已经在缓存中了
  const user = await getUser(userId)
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
    </div>
  )
}

async function UserPosts({ userId }) {
  const posts = await getUserPosts(userId)
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

## Streaming 与 Suspense

流式渲染是 RSC 的核心特性之一，它允许页面的不同部分按需加载，大大提升用户体验和性能感知。

### Suspense 边界

Suspense 组件用于定义加载状态的边界，当其子组件进行异步操作时显示回退 UI：

```jsx
import { Suspense } from 'react'

async function ProductPage({ params }) {
  const { productId } = await params

  // 关键数据：立即获取并等待
  const product = await getProduct(productId)

  return (
    <div className="product-page">
      {/* 立即显示的关键内容 - 不需要 Suspense */}
      <div className="product-hero">
        <img src={product.image} alt={product.name} />
        <h1>{product.name}</h1>
        <p className="price">{formatPrice(product.price)}</p>
        <p className="description">{product.description}</p>
      </div>

      {/* 购买区域 - 客户端交互 */}
      <Suspense fallback={<PurchaseSectionSkeleton />}>
        <PurchaseSection productId={productId} />
      </Suspense>

      {/* 评论区 - 可以稍后加载 */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews productId={productId} />
      </Suspense>

      {/* 推荐商品 - 优先级最低 */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations category={product.category} />
      </Suspense>
    </div>
  )
}

// 异步服务端组件 - 会触发 Suspense
async function Reviews({ productId }) {
  // 模拟较慢的数据获取
  const reviews = await getReviews(productId)

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  return (
    <section className="reviews">
      <header>
        <h2>用户评价</h2>
        <div className="rating-summary">
          <StarRating value={averageRating} />
          <span>{reviews.length} 条评价</span>
        </div>
      </header>

      <div className="review-list">
        {reviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  )
}

// 骨架屏组件
function ReviewsSkeleton() {
  return (
    <section className="reviews skeleton">
      <header>
        <div className="skeleton-text" style={{ width: '100px' }} />
        <div className="skeleton-text" style={{ width: '150px' }} />
      </header>
      <div className="review-list">
        {[1, 2, 3].map(i => (
          <div key={i} className="review-card skeleton">
            <div className="skeleton-avatar" />
            <div className="skeleton-content">
              <div className="skeleton-text" />
              <div className="skeleton-text" style={{ width: '80%' }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

### 嵌套 Suspense

可以创建多层 Suspense 边界，实现细粒度的加载控制：

```jsx
async function DashboardPage() {
  return (
    <div className="dashboard">
      {/* 顶层 Header 可以先加载 */}
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>

      <div className="dashboard-layout">
        {/* 侧边栏独立加载 */}
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>

        <main className="main-content">
          {/* 主要内容区域 - 嵌套的 Suspense */}
          <Suspense fallback={<MainContentSkeleton />}>
            <MainContent>
              {/* 统计卡片优先加载 */}
              <Suspense fallback={<StatsSkeleton />}>
                <StatsSection />
              </Suspense>

              {/* 图表区域 */}
              <div className="charts-row">
                <Suspense fallback={<ChartSkeleton />}>
                  <RevenueChart />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                  <UserGrowthChart />
                </Suspense>
              </div>

              {/* 数据表格 - 可能最慢 */}
              <Suspense fallback={<TableSkeleton rows={10} />}>
                <DataTable />
              </Suspense>
            </MainContent>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
```

### 流式数据传输到客户端

服务端组件可以将 Promise 传递给客户端组件，实现流式数据传输：

```jsx
// 服务端组件
async function ArticlePage({ params }) {
  const { articleId } = await params

  // 立即获取文章内容（关键数据）
  const article = await db.article.findUnique({
    where: { id: articleId },
    include: { author: true }
  })

  if (!article) notFound()

  // 创建 Promise，但不等待完成
  // 这些会通过流式传输发送到客户端
  const commentsPromise = db.comment.findMany({
    where: { articleId },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  })

  const relatedPromise = db.article.findMany({
    where: {
      categoryId: article.categoryId,
      id: { not: article.id }
    },
    take: 5
  })

  return (
    <article className="article-page">
      {/* 文章内容立即渲染 */}
      <header>
        <h1>{article.title}</h1>
        <div className="meta">
          <span className="author">{article.author.name}</span>
          <time>{formatDate(article.publishedAt)}</time>
        </div>
      </header>

      <div className="content">
        <ArticleContent content={article.content} />
      </div>

      {/* 评论区 - 流式加载 */}
      <Suspense fallback={<CommentsSkeleton />}>
        <CommentsSection commentsPromise={commentsPromise} articleId={articleId} />
      </Suspense>

      {/* 相关文章 - 流式加载 */}
      <Suspense fallback={<RelatedArticlesSkeleton />}>
        <RelatedArticles articlesPromise={relatedPromise} />
      </Suspense>
    </article>
  )
}

// 客户端组件 - 使用 use() hook 解析 Promise
'use client'

import { use, useState, useOptimistic } from 'react'
import { addComment } from '@/actions/comments'

export function CommentsSection({ commentsPromise, articleId }) {
  // use() 会自动处理 Promise，触发 Suspense
  const initialComments = use(commentsPromise)
  const [comments, setComments] = useState(initialComments)

  // 乐观更新
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment) => [newComment, ...state]
  )

  const handleSubmit = async (formData) => {
    const content = formData.get('content')

    // 乐观更新 - 立即显示新评论
    addOptimisticComment({
      id: 'temp-' + Date.now(),
      content,
      user: { name: '我' },
      createdAt: new Date().toISOString(),
      pending: true
    })

    // 实际提交
    const result = await addComment(articleId, content)
    if (result.success) {
      setComments([result.comment, ...comments])
    }
  }

  return (
    <section className="comments">
      <h2>评论 ({optimisticComments.length})</h2>

      <form action={handleSubmit} className="comment-form">
        <textarea name="content" placeholder="写下你的评论..." required />
        <button type="submit">发表评论</button>
      </form>

      <div className="comment-list">
        {optimisticComments.map(comment => (
          <div
            key={comment.id}
            className={`comment ${comment.pending ? 'pending' : ''}`}
          >
            <div className="comment-header">
              <span className="author">{comment.user.name}</span>
              <time>{formatDate(comment.createdAt)}</time>
            </div>
            <p>{comment.content}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

## Next.js App Router 集成

Next.js 的 App Router 是目前最成熟的 RSC 实现，提供了完整的开箱即用体验。

### 项目结构

```
app/
├── layout.tsx              # 根布局（服务端组件）
├── page.tsx                # 首页（服务端组件）
├── loading.tsx             # 根路由加载状态
├── error.tsx               # 根路由错误边界
├── not-found.tsx           # 404 页面
├── globals.css
│
├── (marketing)/            # 路由组 - 共享布局
│   ├── layout.tsx          # 营销页面布局
│   ├── page.tsx            # 营销首页
│   ├── about/
│   │   └── page.tsx
│   └── pricing/
│       └── page.tsx
│
├── (dashboard)/            # 另一个路由组
│   ├── layout.tsx          # 仪表盘布局（带侧边栏）
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── analytics/
│       └── page.tsx
│
├── blog/
│   ├── page.tsx            # /blog（博客列表）
│   ├── loading.tsx         # 博客页加载状态
│   └── [slug]/
│       ├── page.tsx        # /blog/[slug]（博客详情）
│       ├── loading.tsx
│       └── opengraph-image.tsx  # 动态 OG 图片
│
├── api/
│   └── [...route]/
│       └── route.ts        # API 路由
│
├── actions/
│   ├── posts.ts            # 文章相关 Server Actions
│   └── comments.ts         # 评论相关 Server Actions
│
└── components/
    ├── Header.tsx          # 服务端组件
    ├── Footer.tsx          # 服务端组件
    ├── SearchBar.tsx       # 客户端组件（'use client'）
    └── ThemeProvider.tsx   # 客户端组件
```

### 布局与页面

```tsx
// app/layout.tsx - 根布局（服务端组件）
import { Inter, Noto_Sans_SC } from 'next/font/google'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Providers } from '@/components/Providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-sc'
})

export const metadata = {
  title: {
    default: '我的应用',
    template: '%s | 我的应用'
  },
  description: '使用 React Server Components 构建的现代化应用',
  keywords: ['React', 'Next.js', 'RSC'],
  authors: [{ name: '作者名' }],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: '我的应用'
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" className={`${inter.variable} ${notoSansSC.variable}`}>
      <body>
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
```

```tsx
// app/page.tsx - 首页（服务端组件）
import { Suspense } from 'react'
import { HeroSection } from '@/components/HeroSection'
import { FeaturedPosts } from '@/components/FeaturedPosts'
import { RecentActivity } from '@/components/RecentActivity'
import { NewsletterForm } from '@/components/NewsletterForm'

export default async function HomePage() {
  return (
    <div className="home-page">
      <HeroSection />

      <section className="featured-section">
        <h2>精选文章</h2>
        <Suspense fallback={<FeaturedPostsSkeleton />}>
          <FeaturedPosts />
        </Suspense>
      </section>

      <section className="activity-section">
        <h2>最近活动</h2>
        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity />
        </Suspense>
      </section>

      {/* 客户端交互组件 */}
      <section className="newsletter-section">
        <h2>订阅更新</h2>
        <NewsletterForm />
      </section>
    </div>
  )
}
```

### loading.tsx 文件

Next.js 的 `loading.tsx` 文件自动为该路由段创建 Suspense 边界：

```tsx
// app/blog/loading.tsx
export default function Loading() {
  return (
    <div className="blog-loading">
      <div className="loading-header">
        <div className="skeleton h-10 w-48" />
        <div className="skeleton h-6 w-96" />
      </div>

      <div className="posts-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <article key={i} className="post-card skeleton-card">
            <div className="skeleton aspect-video w-full" />
            <div className="p-4 space-y-3">
              <div className="skeleton h-6 w-3/4" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
```

```tsx
// app/blog/page.tsx
// 这个页面会自动被 loading.tsx 的 Suspense 包裹
import { PostCard } from '@/components/PostCard'
import { Pagination } from '@/components/Pagination'

interface BlogPageProps {
  searchParams: Promise<{ page?: string; category?: string }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page = '1', category } = await searchParams
  const currentPage = parseInt(page)

  const { posts, totalPages } = await db.post.findManyWithPagination({
    where: category ? { categorySlug: category } : undefined,
    page: currentPage,
    pageSize: 12,
    orderBy: { publishedAt: 'desc' },
    include: { author: true, category: true }
  })

  return (
    <div className="blog-page">
      <header className="blog-header">
        <h1>博客</h1>
        <p>探索最新的技术文章和教程</p>
      </header>

      <div className="posts-grid">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}
    </div>
  )
}

// 配置页面的缓存行为
export const revalidate = 60 // 每 60 秒重新验证
```

### 动态路由与静态生成

```tsx
// app/blog/[slug]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Comments } from '@/components/Comments'
import { RelatedPosts } from '@/components/RelatedPosts'
import { TableOfContents } from '@/components/TableOfContents'
import { ShareButtons } from '@/components/ShareButtons'
import { incrementViewCount } from '@/actions/posts'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

// 生成静态路径
export async function generateStaticParams() {
  const posts = await db.post.findMany({
    where: { publishedAt: { not: null } },
    select: { slug: true },
    orderBy: { publishedAt: 'desc' },
    take: 100 // 预生成最新的 100 篇文章
  })

  return posts.map(post => ({
    slug: post.slug
  }))
}

// 动态生成元数据
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params

  const post = await db.post.findUnique({
    where: { slug },
    include: { author: true, category: true }
  })

  if (!post) {
    return {
      title: '文章未找到'
    }
  }

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags?.map(t => t.name),
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author.name],
      tags: post.tags?.map(t => t.name)
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt
    }
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params

  const post = await db.post.findUnique({
    where: { slug },
    include: {
      author: true,
      category: true,
      tags: true
    }
  })

  if (!post || !post.publishedAt) {
    notFound()
  }

  // 异步增加浏览量（不阻塞渲染）
  incrementViewCount(post.id)

  // 解析 Markdown 生成 HTML 和目录
  const { html, headings } = await parseMarkdown(post.content)

  return (
    <article className="post-page">
      <header className="post-header">
        <div className="category">
          <a href={`/blog?category=${post.category.slug}`}>
            {post.category.name}
          </a>
        </div>
        <h1>{post.title}</h1>
        <div className="meta">
          <div className="author">
            <img src={post.author.avatar} alt={post.author.name} />
            <span>{post.author.name}</span>
          </div>
          <time dateTime={post.publishedAt.toISOString()}>
            {formatDate(post.publishedAt)}
          </time>
          <span className="reading-time">{calculateReadingTime(post.content)} 分钟阅读</span>
        </div>
        <div className="tags">
          {post.tags.map(tag => (
            <a key={tag.id} href={`/blog?tag=${tag.slug}`} className="tag">
              #{tag.name}
            </a>
          ))}
        </div>
      </header>

      <div className="post-layout">
        <aside className="toc-sidebar">
          <TableOfContents headings={headings} />
        </aside>

        <div className="post-content">
          <ArticleContent html={html} />

          <footer className="post-footer">
            <ShareButtons title={post.title} url={`/blog/${post.slug}`} />
          </footer>
        </div>
      </div>

      {/* 评论区 - 流式加载 */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments postId={post.id} />
      </Suspense>

      {/* 相关文章 - 流式加载 */}
      <Suspense fallback={<RelatedPostsSkeleton />}>
        <RelatedPosts
          categoryId={post.categoryId}
          currentPostId={post.id}
        />
      </Suspense>
    </article>
  )
}

// 配置缓存策略
export const revalidate = 3600 // 每小时重新验证
```

## 组件组合模式

### 将服务端组件作为 Props 传递

服务端组件可以作为 children 或其他 props 传递给客户端组件，这是一个强大的组合模式：

```tsx
// 服务端组件
async function ProductPage({ params }) {
  const { productId } = await params
  const product = await getProduct(productId)
  const specs = await getProductSpecs(productId)

  return (
    <div className="product-page">
      <h1>{product.name}</h1>

      {/* 将服务端渲染的内容作为 children 传递给客户端组件 */}
      <ProductTabs
        defaultTab="details"
        // 服务端渲染的详情内容
        detailsContent={<ProductDetails product={product} />}
        // 服务端渲染的规格内容
        specsContent={<ProductSpecs specs={specs} />}
        // 客户端渲染的评论（需要交互）
        reviewsContent={
          <Suspense fallback={<ReviewsSkeleton />}>
            <ProductReviews productId={productId} />
          </Suspense>
        }
      />

      {/* 购买区域 - 包含服务端渲染的库存信息 */}
      <AddToCartSection productId={productId} price={product.price}>
        {/* 这个服务端组件已经在服务端渲染好了 */}
        <StockInfo productId={productId} />
      </AddToCartSection>
    </div>
  )
}

// 服务端组件 - 产品规格
async function ProductSpecs({ specs }) {
  return (
    <table className="specs-table">
      <tbody>
        {specs.map(spec => (
          <tr key={spec.name}>
            <th>{spec.name}</th>
            <td>{spec.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// 服务端组件 - 库存信息
async function StockInfo({ productId }) {
  const stock = await getStock(productId)

  return (
    <div className={`stock-info ${stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
      {stock > 10 ? (
        <span className="text-green-600">库存充足</span>
      ) : stock > 0 ? (
        <span className="text-yellow-600">仅剩 {stock} 件</span>
      ) : (
        <span className="text-red-600">暂时缺货</span>
      )}
    </div>
  )
}
```

```tsx
// 客户端组件 - 标签页
'use client'

import { useState, type ReactNode } from 'react'

interface ProductTabsProps {
  defaultTab: string
  detailsContent: ReactNode
  specsContent: ReactNode
  reviewsContent: ReactNode
}

export function ProductTabs({
  defaultTab,
  detailsContent,
  specsContent,
  reviewsContent
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const tabs = [
    { id: 'details', label: '详情', content: detailsContent },
    { id: 'specs', label: '规格', content: specsContent },
    { id: 'reviews', label: '评价', content: reviewsContent }
  ]

  return (
    <div className="product-tabs">
      <div className="tab-list" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'active' : ''}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-panels">
        {tabs.map(tab => (
          <div
            key={tab.id}
            role="tabpanel"
            hidden={activeTab !== tab.id}
            className="tab-panel"
          >
            {/* 服务端渲染的内容直接显示，不会重新渲染 */}
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Context Provider 模式

由于 Context 只能在客户端使用，需要创建客户端 Provider 包装器：

```tsx
// components/Providers.tsx
'use client'

import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  // 确保每个请求都有独立的 QueryClient 实例
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false
      }
    }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <CartProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </CartProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

// app/layout.tsx - 在布局中使用
import { Providers } from '@/components/Providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

## 性能优化策略

### 合理划分组件边界

```tsx
// 推荐：细粒度的客户端组件
function ProductCard({ product }) {
  return (
    <article className="product-card">
      {/* 静态内容 - 服务端渲染 */}
      <img src={product.image} alt={product.name} loading="lazy" />
      <h3>{product.name}</h3>
      <p className="description">{product.description}</p>
      <p className="price">{formatPrice(product.price)}</p>

      {/* 只有需要交互的部分是客户端组件 */}
      <div className="actions">
        <AddToCartButton productId={product.id} />
        <WishlistButton productId={product.id} />
      </div>
    </article>
  )
}

// 小而专注的客户端组件
'use client'

export function AddToCartButton({ productId }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => addToCart(productId))}
      disabled={isPending}
    >
      {isPending ? '添加中...' : '加入购物车'}
    </button>
  )
}
```

### 避免在服务端组件中传递不可序列化的数据

```tsx
// 错误：传递函数给客户端组件
function ServerComponent() {
  const handleClick = () => console.log('clicked')

  // 这会报错，函数不能序列化
  return <ClientComponent onClick={handleClick} />
}

// 正确方案 1：在客户端组件内部定义函数
'use client'

function ClientComponent({ productId }) {
  const handleClick = useCallback(() => {
    console.log('clicked', productId)
  }, [productId])

  return <button onClick={handleClick}>点击</button>
}

// 正确方案 2：使用 Server Actions
'use client'

import { handleAction } from '@/actions'

function ClientComponent({ productId }) {
  return (
    <form action={handleAction}>
      <input type="hidden" name="productId" value={productId} />
      <button type="submit">提交</button>
    </form>
  )
}
```

### 使用并行数据获取

```tsx
// 推荐：并行获取独立数据
async function Dashboard({ userId }) {
  // 使用 Promise.all 并行获取
  const [user, posts, notifications, stats] = await Promise.all([
    getUser(userId),
    getPosts(userId),
    getNotifications(userId),
    getStats(userId)
  ])

  return (
    <div>
      <UserCard user={user} stats={stats} />
      <PostList posts={posts} />
      <NotificationList notifications={notifications} />
    </div>
  )
}

// 不推荐：串行获取
async function Dashboard({ userId }) {
  const user = await getUser(userId)           // 等待 500ms
  const posts = await getPosts(userId)         // 再等待 500ms
  const notifications = await getNotifications(userId)  // 再等待 500ms
  // 总计 1500ms

  return <div>...</div>
}
```

### 合理使用 Suspense 边界

```tsx
// 推荐：独立的 Suspense 边界允许独立加载
function Page() {
  return (
    <div>
      {/* 每个区块独立加载，互不阻塞 */}
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>

      <div className="main-layout">
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>

        <main>
          <Suspense fallback={<ContentSkeleton />}>
            <MainContent />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

// 不推荐：单一 Suspense 边界导致全部等待最慢的组件
function Page() {
  return (
    <Suspense fallback={<FullPageSkeleton />}>
      <div>
        <Header />      {/* 快速 100ms */}
        <Sidebar />     {/* 中速 300ms */}
        <MainContent /> {/* 慢速 1000ms */}
        {/* 整个页面要等 1000ms 才能显示 */}
      </div>
    </Suspense>
  )
}
```

### 利用缓存和重新验证

```tsx
// 使用 React 的 cache 函数
import { cache } from 'react'

export const getUser = cache(async (userId: string) => {
  return await db.user.findUnique({ where: { id: userId } })
})

// 在多个组件中调用同一个缓存函数
async function UserProfile({ userId }) {
  const user = await getUser(userId) // 第一次调用，执行查询
  return <div>{user.name}</div>
}

async function UserStats({ userId }) {
  const user = await getUser(userId) // 第二次调用，返回缓存结果
  return <div>{user.posts.length} 篇文章</div>
}
```

## 迁移策略

### 从 Pages Router 迁移到 App Router

```tsx
// 旧版 Pages Router (pages/blog/[slug].js)
export async function getStaticProps({ params }) {
  const post = await getPost(params.slug)
  return { props: { post }, revalidate: 60 }
}

export async function getStaticPaths() {
  const posts = await getAllPosts()
  return {
    paths: posts.map(post => ({ params: { slug: post.slug } })),
    fallback: 'blocking'
  }
}

export default function PostPage({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  )
}
```

```tsx
// 新版 App Router (app/blog/[slug]/page.tsx)
export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map(post => ({ slug: post.slug }))
}

export const revalidate = 60

export default async function PostPage({ params }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  )
}
```

### 增量迁移策略

1. **识别纯展示组件**：这些可以直接作为服务端组件
2. **隔离交互逻辑**：将使用 hooks 和事件处理的部分抽取为独立的客户端组件
3. **数据获取迁移**：将 useEffect + fetch 替换为服务端组件的 async/await
4. **逐步迁移**：可以在同一个项目中同时使用 Pages Router 和 App Router

## 常见问题与解决方案

### 问题 1：如何在客户端组件中使用服务端数据

```tsx
// 方案 1：通过 props 传递（推荐）
async function ServerWrapper({ userId }) {
  const user = await getUser(userId)
  return <ClientComponent user={user} />
}

// 方案 2：使用 Server Actions
'use client'

import { getUser } from '@/actions'

function ClientComponent({ userId }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    getUser(userId).then(setUser)
  }, [userId])

  if (!user) return <Loading />
  return <div>{user.name}</div>
}

// 方案 3：流式传输 Promise
async function ServerWrapper({ userId }) {
  const userPromise = getUser(userId) // 不 await
  return <ClientComponent userPromise={userPromise} />
}

'use client'

function ClientComponent({ userPromise }) {
  const user = use(userPromise)
  return <div>{user.name}</div>
}
```

### 问题 2：第三方库不支持服务端组件

```tsx
// 创建客户端包装器
'use client'

import { Chart } from 'chart-library'
export { Chart }

// 或者动态导入
'use client'

import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('chart-library').then(mod => mod.Chart), {
  ssr: false,
  loading: () => <ChartSkeleton />
})

export { Chart }

// 在服务端组件中使用
async function AnalyticsPage() {
  const data = await getAnalyticsData()

  return (
    <div>
      <h1>数据分析</h1>
      <Chart data={data} />
    </div>
  )
}
```

### 问题 3：如何处理认证状态

```tsx
// app/layout.tsx
import { auth } from '@/lib/auth'
import { AuthProvider } from '@/contexts/auth'

export default async function RootLayout({ children }) {
  const session = await auth()

  return (
    <html>
      <body>
        <AuthProvider session={session}>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

// contexts/auth.tsx
'use client'

import { createContext, useContext } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ session, children }) {
  return (
    <AuthContext.Provider value={session}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

## 面试要点

### 高频面试题

**1. 什么是 React Server Components？它解决了什么问题？**

RSC 是在服务端运行的 React 组件，主要解决以下问题：
- 减少客户端 JavaScript 包体积（大型依赖不需要发送到客户端）
- 简化数据获取流程（可以直接在组件中使用 async/await）
- 保护敏感信息（API 密钥等不会暴露给客户端）
- 提高首屏加载性能（关键内容直接以 HTML 返回）
- 更好的 SEO 支持

**2. 服务端组件和客户端组件的主要区别是什么？**

| 方面 | 服务端组件 | 客户端组件 |
|------|-----------|-----------|
| 执行环境 | 服务端 | 浏览器 |
| Hooks | 不支持 | 支持 |
| 事件处理 | 不支持 | 支持 |
| 浏览器 API | 不可用 | 可用 |
| 后端资源 | 直接访问 | 需要 API |
| 打包 | 不包含在客户端 bundle | 包含 |

**3. 'use client' 和 'use server' 指令的作用是什么？**

- `'use client'`：标记客户端组件边界，告诉打包器该模块需要包含在客户端 bundle 中
- `'use server'`：定义 Server Actions，这些函数只在服务端执行，可以从客户端直接调用

**4. 如何在 RSC 架构中实现数据获取？**

- 服务端组件：直接使用 async/await，支持 cache 和 revalidate
- 客户端组件：使用 useEffect、SWR、React Query 或 Server Actions
- 流式加载：通过 Suspense + Promise 传递实现渐进式加载

**5. Suspense 和 Streaming 是如何协作的？**

- Suspense 定义加载边界和回退 UI
- 当异步组件渲染时，Suspense 显示 fallback
- Streaming 允许服务端逐步发送 HTML
- 组合使用实现：先显示骨架屏，内容准备好后流式替换

**6. 如何优化 RSC 应用的性能？**

- 将 'use client' 放在组件树的叶子节点
- 使用 Promise.all 并行获取数据
- 合理设置 Suspense 边界
- 使用 cache 函数避免重复请求
- 配置合适的 revalidate 策略

## 总结

React Server Components 代表了 React 应用架构的重大演进。通过本文的学习，你应该能够：

1. **理解 RSC 的核心概念**：服务端组件在服务端执行，不增加客户端包体积
2. **区分组件类型**：根据是否需要交互来选择使用服务端或客户端组件
3. **正确使用指令**：在最小必要范围内使用 'use client'，利用 'use server' 创建 Server Actions
4. **掌握数据获取模式**：利用 async/await、并行获取和流式传输优化性能
5. **实现流式渲染**：使用 Suspense 边界实现渐进式加载，提升用户体验
6. **集成 Next.js App Router**：充分利用文件系统路由、布局、loading.tsx 等特性
7. **应用最佳实践**：合理划分组件边界、优化数据获取、配置缓存策略

RSC 不仅仅是一个新特性，而是一种全新的思考和构建 React 应用的方式。它结合了服务端渲染的性能优势和客户端渲染的交互体验，为现代 Web 应用提供了最佳的开发模式。随着 React 生态系统的持续演进，RSC 将成为构建高性能 React 应用的标准方法。
