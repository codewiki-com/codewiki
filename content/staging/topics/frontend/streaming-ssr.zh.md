---
title: 流式服务端渲染（Streaming SSR）
description: 深入探索流式服务端渲染 - 通过渐进式HTML流传输实现更快的感知性能
track: frontend
section: performance
difficulty: advanced
tags:
  - Streaming SSR
  - 服务端渲染
  - React
  - 性能优化
  - Web Vitals
  - Suspense
status: imported
origin: old/src/content/docs/frontend/streaming-ssr.zh.md
divergence: 0.221
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - category-casing
legacy:
  category: 前端
  subcategory: ""
  order: 13
  lastUpdated: 2026-01-21
---

流式服务端渲染（Streaming SSR）代表了服务端渲染内容交付方式的根本性演进。与等待整个页面渲染完成后再发送 HTML 不同，流式 SSR 在 HTML 生成时就逐步将其发送到浏览器。本文将深入探讨流式 SSR，从其核心机制到高级实现模式。

## 概念解析

### 什么是流式 SSR？

**流式 SSR** 是一种技术，服务器在生成 HTML 时增量式地将其发送到浏览器，而不是等待完整页面渲染完成。这允许用户在其他部分仍在加载时就能看到并与页面的部分内容进行交互。

```javascript
// 传统 SSR
// 服务器渲染所有内容，然后发送完整 HTML
const html = await renderToString(<App />);
res.send(html);
// 用户在整个页面准备好之前看不到任何内容

// 流式 SSR
// 服务器渐进式发送 HTML
const stream = renderToPipeableStream(<App />);
stream.pipe(res);
// 用户随着内容流入而看到内容
```

### 历史与演进

| 年份 | 里程碑 | 重要意义 |
|------|--------|----------|
| 2010 | Facebook BigPipe | 早期流式概念 |
| 2015 | React renderToNodeStream | 基础流式支持 |
| 2018 | 分块传输编码 | HTTP/1.1 流式传输 |
| 2021 | React 18 Suspense SSR | 现代流式架构 |
| 2022 | Next.js 13 App Router | 内置流式支持 |
| 2023 | React Server Components | 默认流式传输 |
| 2024 | HTTP/3 改进 | 更好的流式性能 |
| 2025 | 广泛采用 | 标准实践 |

### 传统 SSR 的问题

传统 SSR 存在一个根本性的瓶颈：

```
传统 SSR 时间线：

服务器                                          浏览器
   |                                               |
   |--[开始渲染]                                    |
   |     |                                         |
   |     | (渲染组件 A - 100ms)                     |
   |     | (获取 B 的数据 - 500ms)                  |
   |     | (渲染组件 B - 100ms)                     |
   |     | (渲染组件 C - 100ms)                     |
   |     |                                         |
   |--[发送完整 HTML]-------------------------->    |
   |                                               |--[解析 HTML]
   |                                               |--[首次绘制]
   |                                               |--[下载 JS]
   |                                               |--[水合]
   |                                               |--[可交互]

首次绘制时间：800ms+
```

使用流式 SSR：

```
流式 SSR 时间线：

服务器                                          浏览器
   |                                               |
   |--[开始渲染]                                    |
   |     |                                         |
   |--[发送 Shell + A]------------------------->    |
   |     |                                         |--[首次绘制！]
   |     | (获取 B 的数据 - 500ms)                  |--[解析 Shell]
   |     |                                         |--[显示骨架屏]
   |--[流式传输组件 B]----------------------->       |
   |     |                                         |--[更新 DOM]
   |--[流式传输组件 C]----------------------->       |
   |                                               |--[下载 JS]
   |                                               |--[选择性水合]
   |                                               |--[可交互]

首次绘制时间：~100ms
总可交互时间：相似，但感知上更快
```

### 流式传输工作原理

流式 SSR 利用 HTTP 分块传输编码：

```javascript
// 服务器渐进式发送数据块
HTTP/1.1 200 OK
Content-Type: text/html
Transfer-Encoding: chunked

// 第一个数据块 - 页面外壳
1a
<html><head>...</head><body>
0

// 第二个数据块 - 头部内容
2f
<header><nav>...</nav></header>
0

// 第三个数据块 - 主要内容（数据加载后）
5a
<main><article>...</article></main>
0

// 最后的数据块 - 脚本和闭合标签
4f
<script src="app.js"></script></body></html>
0
```

## 核心原理

### 流式架构

```
+------------------------------------------------------------------+
|                     流式 SSR 架构                                  |
+------------------------------------------------------------------+
|                                                                    |
|  服务器端                                                           |
|  +--------------------+     +---------------------------+          |
|  |   React 渲染器     |---->|   流式管道                 |          |
|  +--------------------+     +---------------------------+          |
|           |                            |                           |
|           v                            v                           |
|  +--------------------+     +---------------------------+          |
|  |   Suspense         |---->|   数据块生成器             |          |
|  |   边界             |     +---------------------------+          |
|  +--------------------+              |                             |
|                                      v                             |
|                            +---------------------------+           |
|                            |   HTTP 响应流              |           |
|                            +---------------------------+           |
|                                      |                             |
+--------------------------------------|-----------------------------+
                                       |
                                       v
+------------------------------------------------------------------+
|  浏览器端                                                          |
|  +--------------------+     +---------------------------+          |
|  |   HTML 解析器      |<----|   传入的数据块             |          |
|  +--------------------+     +---------------------------+          |
|           |                                                        |
|           v                                                        |
|  +--------------------+     +---------------------------+          |
|  |   渐进式           |---->|   选择性水合               |          |
|  |   DOM 更新         |     +---------------------------+          |
|  +--------------------+                                            |
|                                                                    |
+------------------------------------------------------------------+
```

### Suspense 与流式传输

React 的 Suspense 是流式 SSR 的基础：

```jsx
// Suspense 实现流式边界
function App() {
  return (
    <html>
      <head>...</head>
      <body>
        {/* 立即发送 */}
        <Header />

        {/* 准备好时流式传输 */}
        <Suspense fallback={<MainSkeleton />}>
          <MainContent />
        </Suspense>

        {/* 独立流式传输 */}
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>

        {/* 立即发送 */}
        <Footer />
      </body>
    </html>
  );
}
```

### 选择性水合

流式传输实现选择性水合 - 页面各部分在到达时即变得可交互：

```jsx
// 每个 Suspense 边界独立水合
function Page() {
  return (
    <>
      {/* 首先水合 */}
      <Suspense fallback={<NavSkeleton />}>
        <Navigation />
      </Suspense>

      {/* 到达时水合，可在交互时优先处理 */}
      <Suspense fallback={<ContentSkeleton />}>
        <Content />
      </Suspense>

      {/* 较低优先级，最后水合 */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </>
  );
}
```

### 乱序流式传输

现代流式 SSR 支持乱序交付：

```javascript
// 组件可以按任意顺序完成
// React 在浏览器中处理重新排序

// 服务器时间线：
// t=0:    发送外壳 + 占位符
// t=100:  侧边栏数据就绪 -> 流式传输侧边栏
// t=300:  评论数据就绪 -> 流式传输评论
// t=500:  主内容就绪 -> 流式传输主内容

// 浏览器接收并正确放置每个部分
// 无论顺序如何
```

## 核心概念

### 1. renderToPipeableStream (React 18+)

现代流式 SSR 的 API：

```javascript
import { renderToPipeableStream } from 'react-dom/server';

function handler(req, res) {
  const { pipe, abort } = renderToPipeableStream(
    <App url={req.url} />,
    {
      bootstrapScripts: ['/client.js'],

      onShellReady() {
        // Shell 准备好了 - 开始流式传输
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        pipe(res);
      },

      onShellError(error) {
        // Shell 出错 - 发送错误页面
        res.statusCode = 500;
        res.send('<h1>出错了</h1>');
      },

      onAllReady() {
        // 所有内容完成 - 对爬虫很有用
        console.log('流式传输完成');
      },

      onError(error) {
        // 记录错误但继续流式传输
        console.error(error);
      }
    }
  );

  // 超时后中止
  setTimeout(() => abort(), 10000);
}
```

### 2. 流式 Shell 模式

首先发送关键 UI 外壳：

```jsx
// components/Shell.jsx
export function Shell({ children }) {
  return (
    <html lang="zh">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
        <link rel="stylesheet" href="/styles.css" />
        <title>我的应用</title>
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}

// pages/index.jsx
export function HomePage() {
  return (
    <Shell>
      {/* 立即 */}
      <Header />

      {/* 流式传输 */}
      <main>
        <Suspense fallback={<HeroSkeleton />}>
          <Hero />
        </Suspense>

        <Suspense fallback={<ProductsSkeleton />}>
          <FeaturedProducts />
        </Suspense>
      </main>

      {/* 立即 */}
      <Footer />
    </Shell>
  );
}
```

### 3. 流式数据获取

在组件内获取数据以实现流式传输：

```jsx
// 现代方式：在组件中使用 Suspense 获取数据
async function ProductList({ category }) {
  // 这个 fetch 触发 Suspense
  const products = await fetchProducts(category);

  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

// 使用
function CategoryPage({ category }) {
  return (
    <div>
      <h1>{category.name}</h1>

      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList category={category.id} />
      </Suspense>
    </div>
  );
}
```

### 4. 流式传输中的错误边界

在流式传输过程中优雅地处理错误：

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function PageWithErrorHandling() {
  return (
    <Shell>
      <Header />

      <ErrorBoundary fallback={<ContentError />}>
        <Suspense fallback={<ContentSkeleton />}>
          <MainContent />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary fallback={<SidebarError />}>
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
      </ErrorBoundary>

      <Footer />
    </Shell>
  );
}

function ContentError() {
  return (
    <div className="error">
      <h2>内容不可用</h2>
      <p>请尝试刷新页面。</p>
      <button onClick={() => window.location.reload()}>
        刷新
      </button>
    </div>
  );
}
```

### 5. 渐进增强

流式传输在没有 JavaScript 的情况下也能工作：

```jsx
// 内容在 JS 加载之前就可用
function Article({ id }) {
  const article = await fetchArticle(id);

  return (
    <article>
      {/* 静态内容 - 立即可用 */}
      <h1>{article.title}</h1>
      <p>{article.content}</p>

      {/* 使用 JS 增强 */}
      <Suspense fallback={<button disabled>点赞</button>}>
        <LikeButton articleId={id} />
      </Suspense>
    </article>
  );
}
```

## 代码示例

### 完整的 Next.js 流式实现

```tsx
// app/layout.tsx
import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

```tsx
// app/products/page.tsx
import { Suspense } from 'react';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductFilters } from '@/components/ProductFilters';
import { RecommendedProducts } from '@/components/RecommendedProducts';
import {
  ProductGridSkeleton,
  FiltersSkeleton,
  RecommendedSkeleton,
} from '@/components/Skeletons';

interface Props {
  searchParams: { category?: string; sort?: string };
}

export default function ProductsPage({ searchParams }: Props) {
  return (
    <div className="products-page">
      <h1>产品</h1>

      <div className="layout">
        <aside>
          {/* 筛选器独立流式传输 */}
          <Suspense fallback={<FiltersSkeleton />}>
            <ProductFilters />
          </Suspense>
        </aside>

        <section className="main">
          {/* 主产品网格根据筛选条件流式传输 */}
          <Suspense
            key={JSON.stringify(searchParams)}
            fallback={<ProductGridSkeleton />}
          >
            <ProductGrid
              category={searchParams.category}
              sort={searchParams.sort}
            />
          </Suspense>
        </section>

        <aside>
          {/* 推荐最后流式传输 */}
          <Suspense fallback={<RecommendedSkeleton />}>
            <RecommendedProducts />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}
```

```tsx
// components/ProductGrid.tsx
import { getProducts } from '@/lib/api';

interface Props {
  category?: string;
  sort?: string;
}

export async function ProductGrid({ category, sort }: Props) {
  // 这个异步操作触发流式传输
  const products = await getProducts({ category, sort });

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <p>未找到产品</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <article key={product.id} className="product-card">
          <img src={product.image} alt={product.name} />
          <h2>{product.name}</h2>
          <p className="price">¥{product.price}</p>
          <AddToCartButton productId={product.id} />
        </article>
      ))}
    </div>
  );
}
```

```tsx
// components/Skeletons.tsx
export function ProductGridSkeleton() {
  return (
    <div className="product-grid skeleton">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="product-card-skeleton">
          <div className="image-skeleton" />
          <div className="title-skeleton" />
          <div className="price-skeleton" />
          <div className="button-skeleton" />
        </div>
      ))}
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="filters-skeleton">
      <div className="filter-group-skeleton" />
      <div className="filter-group-skeleton" />
      <div className="filter-group-skeleton" />
    </div>
  );
}

export function RecommendedSkeleton() {
  return (
    <div className="recommended-skeleton">
      <div className="section-title-skeleton" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="mini-card-skeleton" />
      ))}
    </div>
  );
}
```

### 自定义 Node.js 流式服务器

```javascript
// server.js
import express from 'express';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App';

const app = express();

app.use(express.static('public'));

app.get('*', (req, res) => {
  // 跟踪流式状态
  let didError = false;
  let shellReady = false;

  const { pipe, abort } = renderToPipeableStream(
    <StaticRouter location={req.url}>
      <App />
    </StaticRouter>,
    {
      bootstrapScripts: ['/bundle.js'],

      onShellReady() {
        shellReady = true;

        // 根据是否出错设置状态
        res.statusCode = didError ? 500 : 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');

        // 开始流式传输
        pipe(res);
      },

      onShellError(error) {
        // 严重错误 - 无法渲染外壳
        console.error('Shell 错误:', error);
        res.statusCode = 500;
        res.send(renderErrorPage(error));
      },

      onError(error) {
        didError = true;
        console.error('流式传输错误:', error);
        // 继续流式传输 - 错误边界会处理它
      },

      onAllReady() {
        // 对需要完整 HTML 的机器人/爬虫很有用
        console.log('所有内容已流式传输');
      }
    }
  );

  // 10秒后超时
  const timeout = setTimeout(() => {
    if (!shellReady) {
      abort();
      res.statusCode = 504;
      res.send(renderTimeoutPage());
    }
  }, 10000);

  res.on('close', () => {
    clearTimeout(timeout);
    abort();
  });
});

function renderErrorPage(error) {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>错误</title></head>
      <body>
        <h1>出错了</h1>
        <p>${process.env.NODE_ENV === 'development' ? error.message : '请稍后重试。'}</p>
      </body>
    </html>
  `;
}

function renderTimeoutPage() {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>超时</title></head>
      <body>
        <h1>请求超时</h1>
        <p>服务器响应时间过长。</p>
      </body>
    </html>
  `;
}

app.listen(3000, () => {
  console.log('服务器运行在端口 3000');
});
```

### 带数据加载状态的流式传输

```tsx
// lib/streaming-utils.tsx
import { Suspense } from 'react';

// 流式数据组件的包装器
interface StreamingWrapperProps<T> {
  promise: Promise<T>;
  fallback: React.ReactNode;
  children: (data: T) => React.ReactNode;
  errorFallback?: React.ReactNode;
}

export function StreamingWrapper<T>({
  promise,
  fallback,
  children,
  errorFallback = <DefaultError />,
}: StreamingWrapperProps<T>) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        <Await promise={promise}>{children}</Await>
      </Suspense>
    </ErrorBoundary>
  );
}

// 为 Suspense 抛出 promise 的 Await 组件
function Await<T>({
  promise,
  children,
}: {
  promise: Promise<T>;
  children: (data: T) => React.ReactNode;
}) {
  const data = use(promise);
  return <>{children(data)}</>;
}

// 早期版本的 React 19 use() polyfill
function use<T>(promise: Promise<T>): T {
  if (promise.status === 'fulfilled') {
    return promise.value;
  } else if (promise.status === 'rejected') {
    throw promise.reason;
  } else if (promise.status === 'pending') {
    throw promise;
  } else {
    promise.status = 'pending';
    promise.then(
      (v) => {
        promise.status = 'fulfilled';
        promise.value = v;
      },
      (e) => {
        promise.status = 'rejected';
        promise.reason = e;
      }
    );
    throw promise;
  }
}

// 使用示例
function Dashboard() {
  const userPromise = fetchUser();
  const analyticsPromise = fetchAnalytics();
  const notificationsPromise = fetchNotifications();

  return (
    <div className="dashboard">
      <StreamingWrapper
        promise={userPromise}
        fallback={<UserHeaderSkeleton />}
      >
        {(user) => <UserHeader user={user} />}
      </StreamingWrapper>

      <div className="dashboard-grid">
        <StreamingWrapper
          promise={analyticsPromise}
          fallback={<AnalyticsSkeleton />}
        >
          {(data) => <AnalyticsCharts data={data} />}
        </StreamingWrapper>

        <StreamingWrapper
          promise={notificationsPromise}
          fallback={<NotificationsSkeleton />}
        >
          {(notifications) => <NotificationList items={notifications} />}
        </StreamingWrapper>
      </div>
    </div>
  );
}
```

### 带缓存控制的流式传输

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

// 缓存昂贵的数据获取
export const getCachedProducts = unstable_cache(
  async (category: string) => {
    const response = await fetch(
      `https://api.example.com/products?category=${category}`,
      { next: { revalidate: 60 } }
    );
    return response.json();
  },
  ['products'],
  { revalidate: 60, tags: ['products'] }
);

// 带缓存的流式组件
async function ProductList({ category }: { category: string }) {
  const products = await getCachedProducts(category);

  return (
    <ul>
      {products.map((product: Product) => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}
```

## 最佳实践

### 1. 战略性 Suspense 放置

```jsx
// 不好：整个页面单个 Suspense
function Page() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Header />
      <MainContent />
      <Sidebar />
      <Footer />
    </Suspense>
  );
}
// 所有内容都在等待所有内容

// 好：细粒度 Suspense 边界
function Page() {
  return (
    <>
      {/* 无 Suspense - 立即渲染 */}
      <Header />

      <div className="content">
        {/* 独立流式传输 */}
        <Suspense fallback={<MainSkeleton />}>
          <MainContent />
        </Suspense>

        {/* 独立流式传输 */}
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
      </div>

      {/* 无 Suspense - 立即渲染 */}
      <Footer />
    </>
  );
}
```

### 2. 有意义的加载状态

```jsx
// 不好：通用加载动画
<Suspense fallback={<Spinner />}>
  <ProductList />
</Suspense>

// 好：内容感知的骨架屏
<Suspense fallback={
  <div className="product-list-skeleton">
    {/* 匹配实际产品卡片布局 */}
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="product-card-skeleton">
        <div className="image-placeholder" />
        <div className="text-placeholder title" />
        <div className="text-placeholder price" />
      </div>
    ))}
  </div>
}>
  <ProductList />
</Suspense>
```

### 3. 优先关键内容

```jsx
function ProductPage({ productId }) {
  return (
    <>
      {/* 关键 - 首先流式传输 */}
      <Suspense fallback={<ProductDetailsSkeleton />}>
        <ProductDetails id={productId} />
      </Suspense>

      {/* 重要 - 其次流式传输 */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews productId={productId} />
      </Suspense>

      {/* 次要 - 最后流式传输 */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <RecommendedProducts productId={productId} />
      </Suspense>
    </>
  );
}
```

### 4. 处理加载顺序

```jsx
// 对于依赖数据，嵌套 Suspense 边界
function UserDashboard({ userId }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <UserData userId={userId}>
        {(user) => (
          <>
            <UserHeader user={user} />

            {/* 这些依赖于用户已加载 */}
            <Suspense fallback={<ActivitySkeleton />}>
              <UserActivity userId={user.id} />
            </Suspense>

            <Suspense fallback={<SettingsSkeleton />}>
              <UserSettings preferences={user.preferences} />
            </Suspense>
          </>
        )}
      </UserData>
    </Suspense>
  );
}
```

### 5. SEO 考虑

```jsx
// 确保关键内容在 Shell 中以利于 SEO
function ArticlePage({ slug }) {
  const metadata = await getArticleMetadata(slug);

  return (
    <>
      {/* SEO 关键：在 shell 中 */}
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </Head>

      {/* 主要内容：流式传输但 SEO 友好 */}
      <Suspense fallback={<ArticleSkeleton />}>
        <Article slug={slug} />
      </Suspense>

      {/* 非 SEO 关键：可以稍后流式传输 */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments articleSlug={slug} />
      </Suspense>
    </>
  );
}
```

## 常见陷阱

### 1. Suspense 瀑布流

```jsx
// 不好：顺序加载
function Dashboard() {
  return (
    <Suspense fallback={<Loader />}>
      <UserData> {/* 首先加载 */}
        <Suspense fallback={<Loader />}>
          <UserPosts> {/* 等待 UserData */}
            <Suspense fallback={<Loader />}>
              <PostComments /> {/* 等待 UserPosts */}
            </Suspense>
          </UserPosts>
        </Suspense>
      </UserData>
    </Suspense>
  );
}

// 好：并行加载
function Dashboard() {
  return (
    <>
      <Suspense fallback={<UserSkeleton />}>
        <UserData /> {/* 并行加载 */}
      </Suspense>

      <Suspense fallback={<PostsSkeleton />}>
        <UserPosts /> {/* 并行加载 */}
      </Suspense>

      <Suspense fallback={<CommentsSkeleton />}>
        <PostComments /> {/* 并行加载 */}
      </Suspense>
    </>
  );
}
```

### 2. 缺少错误边界

```jsx
// 不好：没有错误处理
<Suspense fallback={<Skeleton />}>
  <DataComponent /> {/* 如果失败，整个流式传输失败 */}
</Suspense>

// 好：每个区域都有错误边界
<ErrorBoundary fallback={<DataError />}>
  <Suspense fallback={<Skeleton />}>
    <DataComponent />
  </Suspense>
</ErrorBoundary>
```

### 3. 过度细粒度的 Suspense

```jsx
// 不好：太多边界（导致布局偏移）
function ProductCard({ product }) {
  return (
    <div className="card">
      <Suspense fallback={<ImageSkeleton />}>
        <ProductImage src={product.image} />
      </Suspense>
      <Suspense fallback={<TitleSkeleton />}>
        <ProductTitle>{product.title}</ProductTitle>
      </Suspense>
      <Suspense fallback={<PriceSkeleton />}>
        <ProductPrice>{product.price}</ProductPrice>
      </Suspense>
    </div>
  );
}

// 好：相关内容使用单个边界
function ProductCard({ product }) {
  return (
    <Suspense fallback={<ProductCardSkeleton />}>
      <div className="card">
        <ProductImage src={product.image} />
        <ProductTitle>{product.title}</ProductTitle>
        <ProductPrice>{product.price}</ProductPrice>
      </div>
    </Suspense>
  );
}
```

### 4. 在非关键数据上阻塞

```jsx
// 不好：在分析数据上阻塞 shell
async function Page() {
  const content = await fetchContent();
  const analytics = await fetchAnalytics(); // 很慢！

  return (
    <div>
      <Content data={content} />
      <Analytics data={analytics} />
    </div>
  );
}

// 好：流式传输非关键数据
function Page() {
  return (
    <div>
      <Suspense fallback={<ContentSkeleton />}>
        <Content />
      </Suspense>

      {/* 分析可以稍后到达 */}
      <Suspense fallback={null}>
        <Analytics />
      </Suspense>
    </div>
  );
}
```

### 5. 流式传输期间的布局偏移

```jsx
// 不好：内容加载时跳动
<Suspense fallback={<div>加载中...</div>}>
  <DynamicContent /> {/* 高度未知 */}
</Suspense>

// 好：预留空间以防止布局偏移
<Suspense fallback={
  <div style={{ minHeight: '400px' }}>
    <ContentSkeleton />
  </div>
}>
  <DynamicContent />
</Suspense>
```

## 性能考虑

### 测量流式性能

```javascript
// 跟踪流式指标
function measureStreamingPerformance() {
  // 首字节时间
  const ttfb = performance.getEntriesByType('navigation')[0].responseStart;

  // 首次内容绘制
  const fcp = performance.getEntriesByType('paint')
    .find(entry => entry.name === 'first-contentful-paint')?.startTime;

  // 最大内容绘制
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // 自定义流式标记
  performance.mark('shell-rendered');
  performance.mark('main-content-streamed');
  performance.mark('all-content-streamed');

  // 测量持续时间
  performance.measure('shell-to-main', 'shell-rendered', 'main-content-streamed');
  performance.measure('shell-to-complete', 'shell-rendered', 'all-content-streamed');
}
```

### 优化流式数据块大小

```javascript
// 配置流式传输以实现最佳数据块交付
const { pipe } = renderToPipeableStream(<App />, {
  // 根据需求自定义
  progressiveChunkSize: 12800, // 每个数据块的字节数

  onShellReady() {
    // 立即刷新以获得快速 TTFB
    res.flushHeaders();
    pipe(res);
  }
});
```

### 缓存流式响应

```javascript
// 流式响应的边缘缓存
// 注意：完整页面缓存可能不适用于个性化内容

// 缓存 shell
export const dynamic = 'force-static';
export const revalidate = 3600;

// 或使用 stale-while-revalidate 模式
res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=3600');
```

## 实际场景

### 电商产品页面

```tsx
// app/products/[id]/page.tsx
import { Suspense } from 'react';

export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <div className="product-page">
      {/* 关键产品信息 - 首先流式传输 */}
      <div className="product-main">
        <Suspense fallback={<ProductImagesSkeleton />}>
          <ProductImages productId={params.id} />
        </Suspense>

        <div className="product-info">
          <Suspense fallback={<ProductDetailsSkeleton />}>
            <ProductDetails productId={params.id} />
          </Suspense>

          {/* 添加到购物车需要产品数据，但可以提前显示按钮 */}
          <Suspense fallback={<AddToCartSkeleton />}>
            <AddToCartSection productId={params.id} />
          </Suspense>
        </div>
      </div>

      {/* 次要内容 - 在主要内容之后流式传输 */}
      <div className="product-secondary">
        <Suspense fallback={<ReviewsSkeleton />}>
          <ProductReviews productId={params.id} />
        </Suspense>

        <Suspense fallback={<QASkeleton />}>
          <ProductQA productId={params.id} />
        </Suspense>
      </div>

      {/* 第三级内容 - 最后流式传输 */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <SimilarProducts productId={params.id} />
      </Suspense>
    </div>
  );
}
```

### 带实时数据的仪表盘

```tsx
// app/dashboard/page.tsx
export default function Dashboard() {
  return (
    <div className="dashboard">
      {/* 所有内容都需要用户上下文 */}
      <Suspense fallback={<HeaderSkeleton />}>
        <DashboardHeader />
      </Suspense>

      <div className="dashboard-grid">
        {/* 独立数据源并行流式传输 */}
        <Suspense fallback={<MetricsSkeleton />}>
          <KeyMetrics />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <UserGrowthChart />
        </Suspense>

        <Suspense fallback={<TableSkeleton />}>
          <RecentOrders />
        </Suspense>

        {/* 较低优先级，最后流式传输 */}
        <Suspense fallback={<ActivitySkeleton />}>
          <ActivityFeed />
        </Suspense>
      </div>
    </div>
  );
}
```

## 面试要点

### 基础概念

**Q1：什么是流式 SSR，它与传统 SSR 有何不同？**

传统 SSR 在服务器上渲染整个页面后才向浏览器发送任何 HTML。流式 SSR 在 HTML 可用时渐进式发送数据块。

主要区别：
- **首字节时间**：流式更快（立即发送 shell）
- **感知性能**：用户更快看到内容
- **数据获取**：可以在流式传输期间并行进行
- **错误处理**：部分故障不会阻塞整个页面

**Q2：React Suspense 如何实现流式传输？**

Suspense 为流式传输创建边界：
1. Suspense 外部的内容立即渲染到 shell 中
2. Suspense 内部的内容在数据准备好时流式传输
3. 等待时显示 fallback
4. 每个边界独立流式传输
5. 选择性水合允许交互式边界以任意顺序水合

**Q3：什么是选择性水合？**

选择性水合允许页面的各个部分在到达时变得可交互，而不是等待所有 JavaScript 加载：
- 每个 Suspense 边界独立水合
- 用户交互可以优先处理特定边界的水合
- 减少关键 UI 元素的可交互时间

### 实践问题

**Q4：什么时候应该使用流式 SSR？**

适合使用的场景：
- 页面有慢速数据依赖
- 不同区域有不同数据源
- 想要改善感知性能
- 用户可以从早期看到部分内容中受益

避免使用的场景：
- 页面简单且渲染快速
- 需要所有数据才能显示任何有意义的内容
- SEO 需要完整 HTML（对爬虫使用 `onAllReady`）

**Q5：如何处理流式传输中的错误？**

```jsx
// 将错误边界与 Suspense 结合
<ErrorBoundary fallback={<SectionError />}>
  <Suspense fallback={<SectionSkeleton />}>
    <AsyncSection />
  </Suspense>
</ErrorBoundary>

// 服务器端错误处理
const { pipe } = renderToPipeableStream(<App />, {
  onError(error) {
    console.error(error);
    // 不要中止 - 让错误边界处理
  },
  onShellError(error) {
    // 严重错误 - 发送错误页面
    res.status(500).send(errorPage);
  }
});
```

**Q6：如何优化流式性能？**

1. **战略性 Suspense 放置**：将相关内容分组
2. **并行数据获取**：不要创建瀑布流
3. **有意义的骨架屏**：预留布局空间
4. **在可能的地方缓存**：对重复数据使用缓存
5. **优先关键内容**：首先流式传输重要内容

## 延伸阅读

### 官方文档

- [React 18 流式 SSR](https://react.dev/reference/react-dom/server/renderToPipeableStream) - React 官方文档
- [Next.js 流式传输](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming) - Next.js 指南
- [Remix 流式传输](https://remix.run/docs/en/main/guides/streaming) - Remix 文档

### 技术深入

- [新的 Suspense SSR 架构](https://github.com/reactwg/react-18/discussions/37) - React 工作组
- [流式 HTML](https://web.dev/articles/streaming-html) - Web.dev 指南
- [HTTP 分块传输](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Transfer-Encoding) - MDN 参考

### 性能资源

- [Core Web Vitals 与流式传输](https://web.dev/articles/vitals) - 性能指标
- [Chrome DevTools 性能](https://developer.chrome.com/docs/devtools/performance/) - 调试流式传输

### 相关概念

- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023) - 互补技术
- [部分水合](https://www.patterns.dev/posts/partial-hydration) - 相关模式
- [渐进式渲染](https://www.patterns.dev/posts/progressive-rendering) - 背景概念

---

流式 SSR 代表了服务端渲染的重大进步，实现了更快的感知性能和更好的用户体验。通过理解其原理、掌握 Suspense 边界并避免常见陷阱，开发人员可以构建在处理复杂数据需求的同时感觉即时响应的应用程序。随着 Web 平台的不断发展，流式传输将成为每个前端开发者工具箱中的必备技能。
