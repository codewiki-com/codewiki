---
title: Next.js Complete Guide
description: Master Next.js for production-grade React applications
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Next.js
  - React
  - SSR
  - Full-stack
status: imported
origin: old/src/content/docs/frontend/nextjs.en.md
divergence: 0.166
issues: []
legacy:
  category: Frontend
  subcategory: Framework
  order: 15
  lastUpdated: 2026-01-07
---

Next.js is a full-stack React framework developed by Vercel that enables developers to build high-performance, SEO-friendly modern web applications through Server-Side Rendering (SSR), Static Site Generation (SSG), and Incremental Static Regeneration (ISR). This comprehensive guide covers Next.js core concepts, latest features, and practical implementation strategies.

## Next.js 14/15 Features

### Next.js 14 Core Updates

Next.js 14 introduced several major improvements that significantly enhance developer experience and application performance:

**1. Stable Turbopack**

Turbopack is a Rust-based compiler developed by the Next.js team, reaching stable status in Next.js 14:

```bash
# Start development server with Turbopack
next dev --turbo
```

Turbopack benefits:
- 53.3% faster local server startup
- 94.7% faster code updates (Fast Refresh)
- 53.3% faster initial route compilation

**2. Stable Server Actions**

Server Actions allow executing functions directly on the server without creating API routes:

```javascript
// app/actions.js
'use server'

export async function createPost(formData) {
  const title = formData.get('title')
  const content = formData.get('content')

  // Direct database access
  await db.post.create({
    data: { title, content }
  })

  // Revalidate cache
  revalidatePath('/posts')
  return { success: true }
}
```

**3. Partial Prerendering (Experimental)**

This experimental feature combines the benefits of static and dynamic rendering:

```javascript
// next.config.js
module.exports = {
  experimental: {
    ppr: true,
  },
}
```

Partial Prerendering allows static shells to be served instantly while dynamic content streams in, providing the best of both worlds.

### Next.js 15 Major Updates

**1. React 19 Support**

Next.js 15 provides full React 19 support, including the new compiler and concurrent features like Actions and the `use` hook.

**2. Improved Caching Semantics**

Default caching behavior has been made more intelligent. Fetch requests are no longer cached by default:

```javascript
// Explicitly specify caching behavior
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache'  // or 'no-store'
})
```

**3. Enhanced Metadata API**

```javascript
// app/layout.js
export const metadata = {
  title: {
    template: '%s | My Website',
    default: 'My Website',
  },
  description: 'A modern web application built with Next.js',
  openGraph: {
    title: 'My Website',
    description: 'A modern web application built with Next.js',
    images: ['/og-image.png'],
  },
}
```

**4. Async Request APIs**

In Next.js 15, request-specific APIs like `params`, `searchParams`, `cookies()`, and `headers()` are now asynchronous:

```javascript
// app/posts/[id]/page.js
export default async function PostPage({ params }) {
  const { id } = await params // params is now a Promise
  const post = await fetchPost(id)
  return <article>{post.title}</article>
}
```

## App Router vs Pages Router

Next.js provides two routing systems. Understanding their differences is crucial for project architecture decisions.

### App Router (Recommended)

App Router is the new routing system introduced in Next.js 13+, built on React Server Components:

```
app/
├── layout.js          # Root layout
├── page.js            # Home page (/)
├── about/
│   └── page.js        # About page (/about)
├── blog/
│   ├── layout.js      # Blog layout
│   ├── page.js        # Blog list (/blog)
│   └── [slug]/
│       └── page.js    # Blog post (/blog/[slug])
└── api/
    └── hello/
        └── route.js   # API route (/api/hello)
```

**App Router Special Files:**

| File | Purpose |
|------|---------|
| `page.js` | Define route UI |
| `layout.js` | Shared layout with state preservation |
| `loading.js` | Loading state UI |
| `error.js` | Error boundary |
| `not-found.js` | 404 page |
| `template.js` | Layout that re-renders on navigation |
| `default.js` | Fallback for parallel routes |

### Pages Router (Legacy)

Pages Router is the traditional Next.js routing system:

```
pages/
├── _app.js            # Application entry
├── _document.js       # Document structure
├── index.js           # Home page (/)
├── about.js           # About page (/about)
├── blog/
│   ├── index.js       # Blog list (/blog)
│   └── [slug].js      # Blog post (/blog/[slug])
└── api/
    └── hello.js       # API route (/api/hello)
```

### Comparison Summary

| Feature | App Router | Pages Router |
|---------|------------|--------------|
| Default rendering | Server Components | Client Components |
| Data fetching | async/await, Server Actions | getServerSideProps, getStaticProps |
| Layout system | Nested layouts with state preservation | Single _app.js entry |
| Streaming | Native support | Limited support |
| Learning curve | Steeper | Gentler |

## Server and Client Components

React Server Components are the foundational concept of Next.js App Router.

### Server Components (Default)

Components in App Router are Server Components by default:

```javascript
// app/posts/page.js - Server Component (default)
export default async function PostsPage() {
  // Direct use of async/await
  const posts = await fetch('https://api.example.com/posts').then(r => r.json())

  return (
    <div>
      <h1>Blog Posts</h1>
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

**Server Component Advantages:**

- Direct access to backend resources (databases, file systems)
- Protection of sensitive information (API keys, tokens)
- Reduced client-side JavaScript bundle size
- Better initial page load performance
- No hydration overhead for static content

### Client Components

Use the `'use client'` directive when interactivity is needed:

```javascript
'use client'

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
```

**When to Use Client Components:**

- Using React hooks (useState, useEffect, etc.)
- Browser APIs needed (localStorage, window, etc.)
- Event listeners and user interactions
- Third-party libraries requiring browser functionality

### Composition Pattern

Best practice is to place Client Components at the leaf nodes of the component tree:

```javascript
// app/posts/[id]/page.js - Server Component
import LikeButton from './like-button'

export default async function PostPage({ params }) {
  const { id } = await params
  const post = await fetchPost(id)

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      {/* Client Component as child */}
      <LikeButton postId={id} />
    </article>
  )
}
```

```javascript
// app/posts/[id]/like-button.js - Client Component
'use client'

import { useState } from 'react'

export default function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false)

  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? 'Liked' : 'Like'}
    </button>
  )
}
```

### Server Component Boundaries

Understanding component boundaries is essential:

```javascript
// This pattern works - Server Component renders Client Component
// app/dashboard/page.js (Server Component)
import UserProfile from './user-profile'
import ActivityFeed from './activity-feed'

export default async function Dashboard() {
  const user = await fetchUser()

  return (
    <div>
      <UserProfile user={user} />
      <ActivityFeed userId={user.id} />
    </div>
  )
}

// app/dashboard/activity-feed.js (Client Component)
'use client'

import { useState, useEffect } from 'react'

export default function ActivityFeed({ userId }) {
  const [activities, setActivities] = useState([])

  useEffect(() => {
    // Client-side data fetching for real-time updates
    const eventSource = new EventSource(`/api/activities/${userId}`)
    eventSource.onmessage = (e) => {
      setActivities(prev => [JSON.parse(e.data), ...prev])
    }
    return () => eventSource.close()
  }, [userId])

  return (
    <ul>
      {activities.map(activity => (
        <li key={activity.id}>{activity.description}</li>
      ))}
    </ul>
  )
}
```

## Data Fetching

Next.js provides multiple data fetching methods suitable for different scenarios.

### Server Actions

Server Actions are asynchronous functions executed on the server:

```javascript
// app/actions.js
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData) {
  const title = formData.get('title')
  const content = formData.get('content')

  // Validate data
  if (!title || !content) {
    return { error: 'Title and content are required' }
  }

  // Save to database
  const post = await db.post.create({
    data: { title, content }
  })

  // Revalidate cache
  revalidatePath('/posts')

  // Redirect to new post
  redirect(`/posts/${post.id}`)
}
```

Using in Client Components:

```javascript
'use client'

import { createPost } from '@/app/actions'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Publish Post'}
    </button>
  )
}

export default function PostForm() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />
      <SubmitButton />
    </form>
  )
}
```

### Fetch Data Fetching

Use fetch directly in Server Components:

```javascript
// Default behavior: requests are deduplicated
async function getData() {
  const res = await fetch('https://api.example.com/data')

  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }

  return res.json()
}

// Static data (fetched at build time)
const staticData = await fetch('https://api.example.com/data', {
  cache: 'force-cache'
})

// Dynamic data (fetched on every request)
const dynamicData = await fetch('https://api.example.com/data', {
  cache: 'no-store'
})

// Time-based revalidation
const revalidatedData = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 } // Revalidate every hour
})

// Tag-based revalidation
const taggedData = await fetch('https://api.example.com/data', {
  next: { tags: ['posts'] }
})
```

### Cache Revalidation

**Path-based revalidation:**

```javascript
'use server'

import { revalidatePath } from 'next/cache'

export async function updatePost() {
  await updatePostInDatabase()

  // Revalidate specific page
  revalidatePath('/blog')

  // Revalidate dynamic route
  revalidatePath('/blog/[slug]', 'page')

  // Revalidate layout and all child pages
  revalidatePath('/blog', 'layout')
}
```

**Tag-based revalidation:**

```javascript
'use server'

import { revalidateTag } from 'next/cache'

export async function updatePosts() {
  await updatePostsInDatabase()

  // Revalidate all data tagged with 'posts'
  revalidateTag('posts')
}
```

### Parallel Data Fetching

Optimize performance by fetching data in parallel:

```javascript
// app/dashboard/page.js
async function getUser() {
  const res = await fetch('https://api.example.com/user')
  return res.json()
}

async function getPosts() {
  const res = await fetch('https://api.example.com/posts')
  return res.json()
}

async function getAnalytics() {
  const res = await fetch('https://api.example.com/analytics')
  return res.json()
}

export default async function Dashboard() {
  // Parallel data fetching
  const [user, posts, analytics] = await Promise.all([
    getUser(),
    getPosts(),
    getAnalytics()
  ])

  return (
    <div>
      <UserProfile user={user} />
      <PostList posts={posts} />
      <AnalyticsChart data={analytics} />
    </div>
  )
}
```

## Routing System

Next.js App Router provides powerful and flexible routing capabilities.

### Dynamic Routes

**Single dynamic segment:**

```javascript
// app/posts/[id]/page.js
export default async function PostPage({ params }) {
  const { id } = await params
  const post = await fetchPost(id)

  return <article>{post.title}</article>
}
```

**Multiple dynamic segments:**

```javascript
// app/shop/[category]/[product]/page.js
export default async function ProductPage({ params }) {
  const { category, product } = await params

  return (
    <div>
      <p>Category: {category}</p>
      <p>Product: {product}</p>
    </div>
  )
}
```

**Catch-all routes:**

```javascript
// app/docs/[...slug]/page.js
// Matches /docs/a, /docs/a/b, /docs/a/b/c, etc.
export default async function DocsPage({ params }) {
  const { slug } = await params // ['a', 'b', 'c']

  return <div>Path: {slug.join('/')}</div>
}
```

**Optional catch-all routes:**

```javascript
// app/docs/[[...slug]]/page.js
// Also matches /docs (slug is undefined)
export default async function DocsPage({ params }) {
  const { slug } = await params // undefined or ['a', 'b']

  return <div>Path: {slug?.join('/') || 'Home'}</div>
}
```

### Route Groups

Use parentheses to create route groups that do not affect the URL:

```
app/
├── (marketing)/
│   ├── layout.js      # Marketing layout
│   ├── about/
│   │   └── page.js    # /about
│   └── contact/
│       └── page.js    # /contact
├── (shop)/
│   ├── layout.js      # Shop layout
│   ├── products/
│   │   └── page.js    # /products
│   └── cart/
│       └── page.js    # /cart
└── layout.js          # Root layout
```

### Parallel Routes

Parallel routes allow rendering multiple pages simultaneously in the same layout:

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

### Intercepting Routes

Intercepting routes display another route's content within the current layout (e.g., modals):

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

Interception conventions:
- `(.)` - Match same level segment
- `(..)` - Match one level above
- `(..)(..)` - Match two levels above
- `(...)` - Match from root

## Middleware and API Routes

### Middleware

Middleware runs before requests complete, useful for authentication, redirects, internationalization, and more:

```javascript
// middleware.js (project root)
import { NextResponse } from 'next/server'

export function middleware(request) {
  // Get request info
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // Authentication check
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Add custom headers
  const response = NextResponse.next()
  response.headers.set('x-custom-header', 'my-value')

  return response
}

// Configure matching paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**Common Middleware Use Cases:**

```javascript
// Internationalization redirect
export function middleware(request) {
  const locale = request.cookies.get('locale')?.value || 'en'
  const { pathname } = request.nextUrl

  if (!pathname.startsWith(`/${locale}`)) {
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    )
  }
}

// A/B testing
export function middleware(request) {
  const bucket = request.cookies.get('bucket')?.value ||
    (Math.random() < 0.5 ? 'a' : 'b')

  const response = NextResponse.next()

  if (!request.cookies.has('bucket')) {
    response.cookies.set('bucket', bucket)
  }

  return response
}

// Rate limiting
export function middleware(request) {
  const ip = request.ip ?? '127.0.0.1'
  const rateLimit = getRateLimit(ip)

  if (rateLimit.remaining <= 0) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  return NextResponse.next()
}
```

### API Routes (Route Handlers)

In App Router, API routes use Route Handlers:

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
      { error: 'Creation failed' },
      { status: 500 }
    )
  }
}
```

**Dynamic API Routes:**

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
      { error: 'Post not found' },
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

## Static Generation and ISR

### Static Site Generation (SSG)

Generate static pages at build time:

```javascript
// app/posts/[id]/page.js

// Define paths to pre-render
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

### Incremental Static Regeneration (ISR)

ISR allows updating static pages without rebuilding the entire site:

```javascript
// app/posts/[id]/page.js

// Set revalidation time (seconds)
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
    next: { revalidate: 60 } // Revalidate every 60 seconds
  }).then(res => res.json())

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <p>Updated: {new Date().toISOString()}</p>
    </article>
  )
}
```

**On-Demand Revalidation:**

```javascript
// app/api/revalidate/route.js
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { secret, path, tag } = await request.json()

  // Verify secret
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
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

### Dynamic Rendering Control

```javascript
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force static rendering
export const dynamic = 'force-static'

// Default behavior (auto-detect)
export const dynamic = 'auto'

// Return 404 for non-generated paths
export const dynamicParams = false
```

### Understanding ISR Flow

```
1. User requests /posts/1
   ↓
2. Is page in cache?
   → Yes: Return cached page
   → No: Generate page, cache it, return to user
   ↓
3. Has revalidation time elapsed?
   → No: Continue serving cached version
   → Yes: Serve stale page, regenerate in background
   ↓
4. Background regeneration complete
   → Replace cached page with new version
   → Next request gets fresh page
```

## Deployment

### Image Optimization

Next.js provides built-in image optimization:

```javascript
import Image from 'next/image'

export default function Avatar() {
  return (
    <Image
      src="/avatar.jpg"
      alt="User avatar"
      width={200}
      height={200}
      priority // Prioritize loading for above-the-fold images
      placeholder="blur" // Show blur effect during loading
      blurDataURL="data:image/..." // Blur placeholder
    />
  )
}

// Responsive images
export default function Banner() {
  return (
    <Image
      src="/banner.jpg"
      alt="Banner"
      fill // Fill parent container
      sizes="(max-width: 768px) 100vw, 50vw"
      style={{ objectFit: 'cover' }}
    />
  )
}
```

### Font Optimization

Use `next/font` for automatic font optimization:

```javascript
// app/layout.js
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-roboto-mono',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### Script Optimization

```javascript
import Script from 'next/script'

export default function Page() {
  return (
    <>
      {/* Load after page becomes interactive */}
      <Script
        src="https://analytics.example.com/script.js"
        strategy="lazyOnload"
      />

      {/* Execute immediately after page loads */}
      <Script
        src="https://widget.example.com/widget.js"
        strategy="afterInteractive"
      />

      {/* Load before hydration */}
      <Script
        src="https://critical.example.com/critical.js"
        strategy="beforeInteractive"
      />
    </>
  )
}
```

### Production Build Optimization

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output for standalone deployment
  output: 'standalone',

  // Image optimization config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.example.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },

  // Compression
  compress: true,

  // Remove console in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
```

### Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

Vercel provides:
- Automatic HTTPS
- Global CDN
- Serverless Functions
- Edge Functions
- Analytics and monitoring
- Preview deployments for every PR

### Self-Hosting Deployment

```bash
# Build
npm run build

# Start production server
npm run start

# Or use standalone output
node .next/standalone/server.js
```

**Docker Deployment:**

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

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Docker Compose Setup:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Interview Key Points

### Frequently Asked Questions

**1. What are the differences between App Router and Pages Router?**

- App Router is based on React Server Components, with server-side rendering by default
- App Router supports nested layouts, parallel routes, and intercepting routes
- App Router uses file conventions (page.js, layout.js, etc.)
- Pages Router uses getServerSideProps/getStaticProps for data fetching
- App Router recommends Server Actions for data mutations
- App Router provides better streaming and Suspense support

**2. How do you choose between Server Components and Client Components?**

Server Components:
- Data fetching and database access
- Protecting sensitive information
- Reducing client-side JS bundle
- UI that does not require interactivity
- SEO-critical content

Client Components:
- Need to use React hooks
- Need event listeners
- Need browser APIs (localStorage, geolocation)
- Need third-party client-side libraries
- Real-time interactive features

**3. What is ISR? How does it work?**

Incremental Static Regeneration (ISR) allows updating static pages without rebuilding the entire site:
- First request returns cached static page
- Page regenerates in background
- Subsequent requests return updated page
- Controlled via `revalidate` option
- Can be triggered on-demand via API

**4. What are the advantages of Server Actions?**

- No need to create API routes
- Automatic form submission handling
- Progressive enhancement (works without JS)
- Seamless integration with cache revalidation
- Type safety (TypeScript support)
- Built-in optimistic updates support
- Reduced client-server roundtrips

**5. How do you optimize Next.js application performance?**

- Use Image component for image optimization
- Use next/font for font optimization
- Properly utilize SSG and ISR
- Code splitting and lazy loading
- Use Turbopack for faster development
- Optimize third-party script loading strategies
- Leverage React Server Components to reduce client JS
- Implement proper caching strategies
- Use parallel data fetching

**6. What are common middleware use cases?**

- Authentication and authorization checks
- Internationalization route redirects
- A/B testing distribution
- Request logging
- Geolocation redirects
- Bot detection and protection
- Rate limiting
- Request/Response header manipulation

**7. Explain the rendering strategies in Next.js**

- **Static Rendering (SSG)**: Pages generated at build time, served from CDN
- **Dynamic Rendering (SSR)**: Pages generated on each request
- **Streaming**: Progressive page rendering with Suspense
- **ISR**: Static pages that revalidate after specified time
- **Partial Prerendering**: Static shell with dynamic streaming content

### Practical Recommendations

1. **Project Initialization**: Use `create-next-app` for quick project creation, choose App Router
2. **Directory Structure**: Organize code by functional modules, use route groups appropriately
3. **State Management**: Use Server Actions for server state, React Context or Zustand for client state
4. **Data Fetching**: Prefer Server Components for direct fetching, use SWR or TanStack Query when needed
5. **Deployment Strategy**: Choose Vercel or self-hosting based on project requirements
6. **Error Handling**: Implement error.js for error boundaries, not-found.js for 404 pages
7. **Testing**: Use Jest and React Testing Library for unit tests, Playwright for E2E tests

## Further Reading

### Official Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learn Tutorial](https://nextjs.org/learn)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Next.js GitHub Repository](https://github.com/vercel/next.js)
- [Next.js Blog](https://nextjs.org/blog)

### Recommended Tools

- **Prisma**: Type-safe database ORM
- **NextAuth.js / Auth.js**: Authentication solution
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **SWR/TanStack Query**: Data fetching and caching
- **Zod**: Runtime type validation
- **tRPC**: End-to-end type-safe APIs

### Advanced Topics

- **Edge Runtime**: Running code at edge locations for lower latency
- **Streaming**: Progressive Server Component rendering with Suspense boundaries
- **Parallel Routes**: Complex layout patterns with multiple simultaneous views
- **Route Handlers**: Building REST and GraphQL API endpoints
- **Instrumentation**: Server-side monitoring and logging
- **OpenTelemetry**: Distributed tracing integration

### Learning Path

1. **Beginner**: Start with the official Next.js Learn tutorial
2. **Intermediate**: Build a full-stack application with authentication
3. **Advanced**: Implement ISR, parallel routes, and edge functions
4. **Expert**: Optimize performance, implement CI/CD, and scale applications

## Summary

Next.js, as the most popular full-stack framework in the React ecosystem, continues to lead modern web development best practices. After reading this guide, you should be able to:

1. Understand Next.js 14/15 new features and improvements
2. Master App Router core concepts and usage
3. Correctly distinguish and use Server Components and Client Components
4. Apply various data fetching and caching strategies
5. Build complex routing structures and API interfaces
6. Optimize and deploy production-grade Next.js applications

With the maturation of React Server Components and Server Actions, Next.js is redefining full-stack development. Stay updated with official releases, practice these concepts in real projects, and you will become an excellent full-stack developer.

The framework continues to evolve rapidly, with each version bringing performance improvements and developer experience enhancements. The key to mastering Next.js is understanding its core principles while staying adaptable to new patterns and best practices as they emerge.
