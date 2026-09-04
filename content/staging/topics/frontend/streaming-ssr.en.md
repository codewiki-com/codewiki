---
title: Streaming SSR
description: Deep dive into Streaming Server-Side Rendering - delivering faster perceived performance through progressive HTML streaming
track: frontend
section: performance
difficulty: advanced
tags:
  - Streaming SSR
  - Server-Side Rendering
  - React
  - Performance
  - Web Vitals
  - Suspense
status: imported
origin: old/src/content/docs/frontend/streaming-ssr.en.md
divergence: 0.221
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - category-casing
legacy:
  category: Frontend
  subcategory: ""
  order: 13
  lastUpdated: 2026-01-21
---

Streaming Server-Side Rendering (SSR) represents a fundamental evolution in how we deliver server-rendered content to users. Instead of waiting for an entire page to render before sending any HTML, streaming SSR progressively sends HTML chunks to the browser as they become available. This article explores streaming SSR in depth, from its core mechanisms to advanced implementation patterns.

## Concept Explanation

### What is Streaming SSR?

**Streaming SSR** is a technique where the server sends HTML to the browser incrementally as it's generated, rather than waiting for the complete page to render. This allows users to see and interact with parts of the page while other parts are still loading.

```javascript
// Traditional SSR
// Server renders everything, then sends complete HTML
const html = await renderToString(<App />);
res.send(html);
// User sees nothing until entire page is ready

// Streaming SSR
// Server sends HTML progressively
const stream = renderToPipeableStream(<App />);
stream.pipe(res);
// User sees content as it streams in
```

### History and Evolution

| Year | Milestone | Significance |
|------|-----------|--------------|
| 2010 | Facebook BigPipe | Early streaming concept |
| 2015 | React renderToNodeStream | Basic streaming support |
| 2018 | Chunked transfer encoding | HTTP/1.1 streaming |
| 2021 | React 18 Suspense SSR | Modern streaming architecture |
| 2022 | Next.js 13 App Router | Built-in streaming |
| 2023 | React Server Components | Streaming by default |
| 2024 | HTTP/3 improvements | Better streaming performance |
| 2025 | Widespread adoption | Standard practice |

### The Problem with Traditional SSR

Traditional SSR has a fundamental bottleneck:

```
Traditional SSR Timeline:

Server                                          Browser
   |                                               |
   |--[Start Rendering]                            |
   |     |                                         |
   |     | (Render Component A - 100ms)            |
   |     | (Fetch Data for B - 500ms)              |
   |     | (Render Component B - 100ms)            |
   |     | (Render Component C - 100ms)            |
   |     |                                         |
   |--[Send Complete HTML]------------------->     |
   |                                               |--[Parse HTML]
   |                                               |--[First Paint]
   |                                               |--[Download JS]
   |                                               |--[Hydrate]
   |                                               |--[Interactive]

Total Time to First Paint: 800ms+
```

With Streaming SSR:

```
Streaming SSR Timeline:

Server                                          Browser
   |                                               |
   |--[Start Rendering]                            |
   |     |                                         |
   |--[Send Shell + A]----------------------->     |
   |     |                                         |--[First Paint!]
   |     | (Fetch Data for B - 500ms)              |--[Parse Shell]
   |     |                                         |--[Show Skeleton]
   |--[Stream Component B]----------------->       |
   |     |                                         |--[Update DOM]
   |--[Stream Component C]----------------->       |
   |                                               |--[Download JS]
   |                                               |--[Selective Hydrate]
   |                                               |--[Interactive]

Time to First Paint: ~100ms
Total Time to Interactive: Similar, but perceived faster
```

### How Streaming Works

Streaming SSR leverages HTTP chunked transfer encoding:

```javascript
// Server sends chunks progressively
HTTP/1.1 200 OK
Content-Type: text/html
Transfer-Encoding: chunked

// First chunk - page shell
1a
<html><head>...</head><body>
0

// Second chunk - header content
2f
<header><nav>...</nav></header>
0

// Third chunk - main content (after data loads)
5a
<main><article>...</article></main>
0

// Final chunk - scripts and closing tags
4f
<script src="app.js"></script></body></html>
0
```

## Core Principles

### The Streaming Architecture

```
+------------------------------------------------------------------+
|                     Streaming SSR Architecture                     |
+------------------------------------------------------------------+
|                                                                    |
|  SERVER                                                            |
|  +--------------------+     +---------------------------+          |
|  |   React Renderer   |---->|   Streaming Pipeline      |          |
|  +--------------------+     +---------------------------+          |
|           |                            |                           |
|           v                            v                           |
|  +--------------------+     +---------------------------+          |
|  |   Suspense         |---->|   Chunk Generator         |          |
|  |   Boundaries       |     +---------------------------+          |
|  +--------------------+              |                             |
|                                      v                             |
|                            +---------------------------+           |
|                            |   HTTP Response Stream    |           |
|                            +---------------------------+           |
|                                      |                             |
+--------------------------------------|-----------------------------+
                                       |
                                       v
+------------------------------------------------------------------+
|  BROWSER                                                          |
|  +--------------------+     +---------------------------+          |
|  |   HTML Parser      |<----|   Incoming Chunks         |          |
|  +--------------------+     +---------------------------+          |
|           |                                                        |
|           v                                                        |
|  +--------------------+     +---------------------------+          |
|  |   Progressive      |---->|   Selective Hydration     |          |
|  |   DOM Updates      |     +---------------------------+          |
|  +--------------------+                                            |
|                                                                    |
+------------------------------------------------------------------+
```

### Suspense and Streaming

React's Suspense is the foundation for streaming SSR:

```jsx
// Suspense enables streaming boundaries
function App() {
  return (
    <html>
      <head>...</head>
      <body>
        {/* Sent immediately */}
        <Header />

        {/* Streams when ready */}
        <Suspense fallback={<MainSkeleton />}>
          <MainContent />
        </Suspense>

        {/* Streams independently */}
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>

        {/* Sent immediately */}
        <Footer />
      </body>
    </html>
  );
}
```

### Selective Hydration

Streaming enables selective hydration - parts of the page become interactive as they arrive:

```jsx
// Each Suspense boundary hydrates independently
function Page() {
  return (
    <>
      {/* Hydrates first */}
      <Suspense fallback={<NavSkeleton />}>
        <Navigation />
      </Suspense>

      {/* Hydrates when it arrives, can be prioritized on interaction */}
      <Suspense fallback={<ContentSkeleton />}>
        <Content />
      </Suspense>

      {/* Lower priority, hydrates last */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </>
  );
}
```

### Out-of-Order Streaming

Modern streaming SSR supports out-of-order delivery:

```javascript
// Components can complete in any order
// React handles reordering in the browser

// Server timeline:
// t=0:    Send shell + placeholders
// t=100:  Sidebar data ready -> stream sidebar
// t=300:  Comments data ready -> stream comments
// t=500:  Main content ready -> stream main content

// Browser receives and places each piece correctly
// regardless of order
```

## Core Concepts

### 1. renderToPipeableStream (React 18+)

The modern API for streaming SSR:

```javascript
import { renderToPipeableStream } from 'react-dom/server';

function handler(req, res) {
  const { pipe, abort } = renderToPipeableStream(
    <App url={req.url} />,
    {
      bootstrapScripts: ['/client.js'],

      onShellReady() {
        // Shell is ready - start streaming
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        pipe(res);
      },

      onShellError(error) {
        // Error in shell - send error page
        res.statusCode = 500;
        res.send('<h1>Something went wrong</h1>');
      },

      onAllReady() {
        // Everything is done - useful for crawlers
        console.log('Streaming complete');
      },

      onError(error) {
        // Log error but continue streaming
        console.error(error);
      }
    }
  );

  // Abort after timeout
  setTimeout(() => abort(), 10000);
}
```

### 2. Streaming Shell Pattern

Send the critical UI shell first:

```jsx
// components/Shell.jsx
export function Shell({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
        <link rel="stylesheet" href="/styles.css" />
        <title>My App</title>
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
      {/* Immediate */}
      <Header />

      {/* Streamed */}
      <main>
        <Suspense fallback={<HeroSkeleton />}>
          <Hero />
        </Suspense>

        <Suspense fallback={<ProductsSkeleton />}>
          <FeaturedProducts />
        </Suspense>
      </main>

      {/* Immediate */}
      <Footer />
    </Shell>
  );
}
```

### 3. Data Fetching with Streaming

Fetch data inside components for streaming:

```jsx
// Modern approach: fetch in component with Suspense
async function ProductList({ category }) {
  // This fetch triggers Suspense
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

// Usage
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

### 4. Error Boundaries with Streaming

Handle errors gracefully during streaming:

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
      <h2>Content unavailable</h2>
      <p>Please try refreshing the page.</p>
      <button onClick={() => window.location.reload()}>
        Refresh
      </button>
    </div>
  );
}
```

### 5. Progressive Enhancement

Streaming works without JavaScript:

```jsx
// Content is usable even before JS loads
function Article({ id }) {
  const article = await fetchArticle(id);

  return (
    <article>
      {/* Static content - works immediately */}
      <h1>{article.title}</h1>
      <p>{article.content}</p>

      {/* Enhanced with JS */}
      <Suspense fallback={<button disabled>Like</button>}>
        <LikeButton articleId={id} />
      </Suspense>
    </article>
  );
}
```

## Code Examples

### Complete Next.js Streaming Implementation

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
    <html lang="en">
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
      <h1>Products</h1>

      <div className="layout">
        <aside>
          {/* Filters stream independently */}
          <Suspense fallback={<FiltersSkeleton />}>
            <ProductFilters />
          </Suspense>
        </aside>

        <section className="main">
          {/* Main product grid streams based on filters */}
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
          {/* Recommendations stream last */}
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
  // This async operation triggers streaming
  const products = await getProducts({ category, sort });

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <article key={product.id} className="product-card">
          <img src={product.image} alt={product.name} />
          <h2>{product.name}</h2>
          <p className="price">${product.price}</p>
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

### Custom Node.js Streaming Server

```javascript
// server.js
import express from 'express';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App';

const app = express();

app.use(express.static('public'));

app.get('*', (req, res) => {
  // Track streaming status
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

        // Set status based on whether we errored
        res.statusCode = didError ? 500 : 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');

        // Start streaming
        pipe(res);
      },

      onShellError(error) {
        // Critical error - can't render shell
        console.error('Shell error:', error);
        res.statusCode = 500;
        res.send(renderErrorPage(error));
      },

      onError(error) {
        didError = true;
        console.error('Streaming error:', error);
        // Continue streaming - error boundary will handle it
      },

      onAllReady() {
        // Useful for bots/crawlers that need complete HTML
        console.log('All content streamed');
      }
    }
  );

  // Timeout after 10 seconds
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
      <head><title>Error</title></head>
      <body>
        <h1>Something went wrong</h1>
        <p>${process.env.NODE_ENV === 'development' ? error.message : 'Please try again later.'}</p>
      </body>
    </html>
  `;
}

function renderTimeoutPage() {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Timeout</title></head>
      <body>
        <h1>Request timed out</h1>
        <p>The server took too long to respond.</p>
      </body>
    </html>
  `;
}

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Streaming with Data Loading States

```tsx
// lib/streaming-utils.tsx
import { Suspense } from 'react';

// Wrapper for streaming data components
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

// Await component that throws promise for Suspense
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

// React 19 use() polyfill for earlier versions
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

// Usage
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

### Streaming with Cache Control

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

// Cache expensive data fetches
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

// Streaming component with caching
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

## Best Practices

### 1. Strategic Suspense Placement

```jsx
// BAD: Single Suspense for entire page
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
// Everything waits for everything

// GOOD: Granular Suspense boundaries
function Page() {
  return (
    <>
      {/* No Suspense - renders immediately */}
      <Header />

      <div className="content">
        {/* Streams independently */}
        <Suspense fallback={<MainSkeleton />}>
          <MainContent />
        </Suspense>

        {/* Streams independently */}
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
      </div>

      {/* No Suspense - renders immediately */}
      <Footer />
    </>
  );
}
```

### 2. Meaningful Loading States

```jsx
// BAD: Generic spinner
<Suspense fallback={<Spinner />}>
  <ProductList />
</Suspense>

// GOOD: Content-aware skeleton
<Suspense fallback={
  <div className="product-list-skeleton">
    {/* Matches actual product card layout */}
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

### 3. Prioritize Critical Content

```jsx
function ProductPage({ productId }) {
  return (
    <>
      {/* Critical - stream first */}
      <Suspense fallback={<ProductDetailsSkeleton />}>
        <ProductDetails id={productId} />
      </Suspense>

      {/* Important - stream second */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews productId={productId} />
      </Suspense>

      {/* Less critical - stream last */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <RecommendedProducts productId={productId} />
      </Suspense>
    </>
  );
}
```

### 4. Handle Loading Sequences

```jsx
// For dependent data, nest Suspense boundaries
function UserDashboard({ userId }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <UserData userId={userId}>
        {(user) => (
          <>
            <UserHeader user={user} />

            {/* These depend on user being loaded */}
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

### 5. SEO Considerations

```jsx
// Ensure critical content is in the shell for SEO
function ArticlePage({ slug }) {
  const metadata = await getArticleMetadata(slug);

  return (
    <>
      {/* SEO-critical: in shell */}
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </Head>

      {/* Main content: streamed but SEO-friendly */}
      <Suspense fallback={<ArticleSkeleton />}>
        <Article slug={slug} />
      </Suspense>

      {/* Not SEO-critical: can stream later */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments articleSlug={slug} />
      </Suspense>
    </>
  );
}
```

## Common Pitfalls

### 1. Suspense Waterfall

```jsx
// BAD: Sequential loading
function Dashboard() {
  return (
    <Suspense fallback={<Loader />}>
      <UserData> {/* Loads first */}
        <Suspense fallback={<Loader />}>
          <UserPosts> {/* Waits for UserData */}
            <Suspense fallback={<Loader />}>
              <PostComments /> {/* Waits for UserPosts */}
            </Suspense>
          </UserPosts>
        </Suspense>
      </UserData>
    </Suspense>
  );
}

// GOOD: Parallel loading
function Dashboard() {
  return (
    <>
      <Suspense fallback={<UserSkeleton />}>
        <UserData /> {/* Loads in parallel */}
      </Suspense>

      <Suspense fallback={<PostsSkeleton />}>
        <UserPosts /> {/* Loads in parallel */}
      </Suspense>

      <Suspense fallback={<CommentsSkeleton />}>
        <PostComments /> {/* Loads in parallel */}
      </Suspense>
    </>
  );
}
```

### 2. Missing Error Boundaries

```jsx
// BAD: No error handling
<Suspense fallback={<Skeleton />}>
  <DataComponent /> {/* If this fails, entire stream fails */}
</Suspense>

// GOOD: Error boundary per section
<ErrorBoundary fallback={<DataError />}>
  <Suspense fallback={<Skeleton />}>
    <DataComponent />
  </Suspense>
</ErrorBoundary>
```

### 3. Over-Granular Suspense

```jsx
// BAD: Too many boundaries (causes layout shift)
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

// GOOD: Single boundary for related content
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

### 4. Blocking on Non-Critical Data

```jsx
// BAD: Blocking shell on analytics
async function Page() {
  const content = await fetchContent();
  const analytics = await fetchAnalytics(); // Slow!

  return (
    <div>
      <Content data={content} />
      <Analytics data={analytics} />
    </div>
  );
}

// GOOD: Stream non-critical data
function Page() {
  return (
    <div>
      <Suspense fallback={<ContentSkeleton />}>
        <Content />
      </Suspense>

      {/* Analytics can arrive later */}
      <Suspense fallback={null}>
        <Analytics />
      </Suspense>
    </div>
  );
}
```

### 5. Layout Shift During Streaming

```jsx
// BAD: Content jumps as it loads
<Suspense fallback={<div>Loading...</div>}>
  <DynamicContent /> {/* Height unknown */}
</Suspense>

// GOOD: Reserve space to prevent layout shift
<Suspense fallback={
  <div style={{ minHeight: '400px' }}>
    <ContentSkeleton />
  </div>
}>
  <DynamicContent />
</Suspense>
```

## Performance Considerations

### Measuring Streaming Performance

```javascript
// Track streaming metrics
function measureStreamingPerformance() {
  // Time to First Byte
  const ttfb = performance.getEntriesByType('navigation')[0].responseStart;

  // First Contentful Paint
  const fcp = performance.getEntriesByType('paint')
    .find(entry => entry.name === 'first-contentful-paint')?.startTime;

  // Largest Contentful Paint
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // Custom streaming markers
  performance.mark('shell-rendered');
  performance.mark('main-content-streamed');
  performance.mark('all-content-streamed');

  // Measure durations
  performance.measure('shell-to-main', 'shell-rendered', 'main-content-streamed');
  performance.measure('shell-to-complete', 'shell-rendered', 'all-content-streamed');
}
```

### Optimizing Stream Chunk Size

```javascript
// Configure streaming for optimal chunk delivery
const { pipe } = renderToPipeableStream(<App />, {
  // Customize for your needs
  progressiveChunkSize: 12800, // Bytes per chunk

  onShellReady() {
    // Flush immediately for fast TTFB
    res.flushHeaders();
    pipe(res);
  }
});
```

### Caching Streamed Responses

```javascript
// Edge caching for streamed responses
// Note: Full page caching may not work with personalized content

// Cache the shell
export const dynamic = 'force-static';
export const revalidate = 3600;

// Or use stale-while-revalidate pattern
res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=3600');
```

## Real-World Scenarios

### E-commerce Product Page

```tsx
// app/products/[id]/page.tsx
import { Suspense } from 'react';

export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <div className="product-page">
      {/* Critical product info - stream first */}
      <div className="product-main">
        <Suspense fallback={<ProductImagesSkeleton />}>
          <ProductImages productId={params.id} />
        </Suspense>

        <div className="product-info">
          <Suspense fallback={<ProductDetailsSkeleton />}>
            <ProductDetails productId={params.id} />
          </Suspense>

          {/* Add to cart needs product data, but can show button early */}
          <Suspense fallback={<AddToCartSkeleton />}>
            <AddToCartSection productId={params.id} />
          </Suspense>
        </div>
      </div>

      {/* Secondary content - stream after main */}
      <div className="product-secondary">
        <Suspense fallback={<ReviewsSkeleton />}>
          <ProductReviews productId={params.id} />
        </Suspense>

        <Suspense fallback={<QASkeleton />}>
          <ProductQA productId={params.id} />
        </Suspense>
      </div>

      {/* Tertiary content - stream last */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <SimilarProducts productId={params.id} />
      </Suspense>
    </div>
  );
}
```

### Dashboard with Real-time Data

```tsx
// app/dashboard/page.tsx
export default function Dashboard() {
  return (
    <div className="dashboard">
      {/* User context needed for everything */}
      <Suspense fallback={<HeaderSkeleton />}>
        <DashboardHeader />
      </Suspense>

      <div className="dashboard-grid">
        {/* Independent data sources stream in parallel */}
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

        {/* Lower priority, streams last */}
        <Suspense fallback={<ActivitySkeleton />}>
          <ActivityFeed />
        </Suspense>
      </div>
    </div>
  );
}
```

## Interview Key Points

### Fundamental Concepts

**Q1: What is Streaming SSR and how does it differ from traditional SSR?**

Traditional SSR renders the entire page on the server before sending any HTML to the browser. Streaming SSR progressively sends HTML chunks as they become available.

Key differences:
- **Time to First Byte**: Streaming is faster (sends shell immediately)
- **Perceived Performance**: Users see content sooner
- **Data Fetching**: Can happen in parallel during streaming
- **Error Handling**: Partial failures don't block entire page

**Q2: How does React Suspense enable streaming?**

Suspense creates boundaries for streaming:
1. Content outside Suspense renders immediately into the shell
2. Content inside Suspense streams when its data is ready
3. Fallback shows while waiting
4. Each boundary streams independently
5. Selective hydration allows interactive boundaries to hydrate in any order

**Q3: What is selective hydration?**

Selective hydration allows parts of the page to become interactive as they arrive, rather than waiting for all JavaScript to load:
- Each Suspense boundary hydrates independently
- User interaction can prioritize hydration of specific boundaries
- Reduces time to interactive for critical UI elements

### Practical Questions

**Q4: When should you use streaming SSR?**

Use streaming when:
- Page has slow data dependencies
- Different sections have different data sources
- You want to improve perceived performance
- User can benefit from seeing partial content early

Avoid when:
- Page is simple and renders quickly
- All data is needed before any content makes sense
- SEO requires complete HTML (use `onAllReady` for crawlers)

**Q5: How do you handle errors in streaming?**

```jsx
// Combine Error Boundaries with Suspense
<ErrorBoundary fallback={<SectionError />}>
  <Suspense fallback={<SectionSkeleton />}>
    <AsyncSection />
  </Suspense>
</ErrorBoundary>

// Server-side error handling
const { pipe } = renderToPipeableStream(<App />, {
  onError(error) {
    console.error(error);
    // Don't abort - let error boundary handle it
  },
  onShellError(error) {
    // Critical error - send error page
    res.status(500).send(errorPage);
  }
});
```

**Q6: How do you optimize streaming performance?**

1. **Strategic Suspense placement**: Group related content
2. **Parallel data fetching**: Don't create waterfalls
3. **Meaningful skeletons**: Reserve layout space
4. **Cache where possible**: Use caching for repeated data
5. **Prioritize critical content**: Stream important content first

## Further Reading

### Official Documentation

- [React 18 Streaming SSR](https://react.dev/reference/react-dom/server/renderToPipeableStream) - Official React docs
- [Next.js Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming) - Next.js guide
- [Remix Streaming](https://remix.run/docs/en/main/guides/streaming) - Remix documentation

### Technical Deep Dives

- [New Suspense SSR Architecture](https://github.com/reactwg/react-18/discussions/37) - React working group
- [Streaming HTML](https://web.dev/articles/streaming-html) - Web.dev guide
- [HTTP Chunked Transfer](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Transfer-Encoding) - MDN reference

### Performance Resources

- [Core Web Vitals and Streaming](https://web.dev/articles/vitals) - Performance metrics
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/) - Debugging streaming

### Related Concepts

- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023) - Complementary technology
- [Partial Hydration](https://www.patterns.dev/posts/partial-hydration) - Related pattern
- [Progressive Rendering](https://www.patterns.dev/posts/progressive-rendering) - Background concept

---

Streaming SSR represents a significant advancement in server-side rendering, enabling faster perceived performance and better user experiences. By understanding its principles, mastering Suspense boundaries, and avoiding common pitfalls, developers can build applications that feel instant while handling complex data requirements. As the web platform continues to evolve, streaming will become an essential tool in every frontend developer's toolkit.
