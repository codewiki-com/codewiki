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
origin: old/src/content/docs/frontend/react-server-components.en.md
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

React Server Components (RSC) is a revolutionary architecture introduced by the React team that fundamentally changes how we build React applications. By running components on the server, RSC achieves better performance, smaller client-side bundle sizes, and simpler data fetching patterns. We dive deep into RSC's core concepts, working principles, usage methods, and best practices.

## What are React Server Components

React Server Components are a new component paradigm where components execute rendering on the server (or at build time) rather than running in the client browser.

### Core Features

- **Zero Client JavaScript**: Server component code is not included in the client-side JavaScript bundle
- **Direct Backend Resource Access**: Can directly access databases, file systems, internal APIs, and other server-side resources
- **Automatic Code Splitting**: Server and client components form natural code splitting boundaries
- **Streaming Rendering Support**: Can work with Suspense to implement HTML streaming
- **Async Components**: Supports async/await syntax, allowing asynchronous operations during rendering

### RSC Architecture Philosophy

RSC combines the advantages of traditional Server-Side Rendering (SSR) and client-side Single Page Applications (SPA):

```
┌─────────────────────────────────────────────────────────────────┐
│                     RSC Architecture Advantages                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Traditional MPA (Multi-Page App)  +  Modern SPA (Single-Page)  │
│        │                                    │                   │
│   Simple request/response model        Seamless interactions    │
│   Server-side data fetching           Client-side state mgmt    │
│   Fast initial render                 Rich user interactions    │
│                                                                 │
│                        ▼                                        │
│                                                                 │
│              React Server Components                            │
│        Best of both + Optimal bundle size + Best DX             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Basic Example

```jsx
// This is a Server Component (default in Next.js App Router)
// Can directly use async/await to fetch data
async function ArticleList() {
  // Direct database access, no need to create API endpoints
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
          <p className="author">Author: {article.author.name}</p>
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

## Server Components vs Client Components

Understanding the differences between server and client components is key to mastering RSC architecture.

### Server Components

Server Components execute on the server and have the following characteristics:

**Advantages:**

- Can directly access backend resources (databases, file systems, internal microservices)
- Protect sensitive information (API keys, database credentials, business logic are not exposed to clients)
- Significantly reduce client-side JavaScript size (large dependencies like markdown parsers, syntax highlighters only used server-side)
- Faster initial page load (critical content returned directly as HTML)
- Better SEO support (search engines can directly crawl rendered content)
- Leverage server-side computing resources for complex calculations

**Limitations:**

- Cannot use React hooks (useState, useEffect, useContext, etc.)
- Cannot use browser APIs (localStorage, window, document, etc.)
- Cannot add event listeners (onClick, onChange, onSubmit, etc.)
- Cannot use client-only third-party libraries (such as certain animation libraries)
- Components do not re-render (need revalidation mechanism to update)

```jsx
// Server Component example - User profile page
import { headers } from 'next/headers'
import { cache } from 'react'

// Use cache to avoid duplicate calls within the same request
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
  // Direct database query
  const user = await getUser(userId)

  if (!user) {
    notFound()
  }

  // Access environment variables (sensitive info is secure)
  const analyticsKey = process.env.INTERNAL_ANALYTICS_KEY

  // Call internal service (not exposed to client)
  const analytics = await fetch(
    `http://internal-analytics.service/users/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${analyticsKey}`,
        'X-Request-ID': headers().get('x-request-id')
      },
      // Configure caching in Next.js
      next: { revalidate: 60 }
    }
  ).then(res => res.json())

  // Perform complex calculations (done server-side, no client burden)
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
          <span className="label">Articles</span>
        </div>
        <div className="stat">
          <span className="value">{user.followers.length}</span>
          <span className="label">Followers</span>
        </div>
        <div className="stat">
          <span className="value">{engagementScore}</span>
          <span className="label">Engagement</span>
        </div>
      </div>

      <section className="recent-posts">
        <h2>Recent Articles</h2>
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

### Client Components

Client Components execute in the browser and handle interactive logic:

**Use Cases:**

- Need React hooks (state management, side effects, context, etc.)
- Need event handling (clicks, inputs, scrolling, dragging, etc.)
- Need browser APIs (geolocation, local storage, clipboard, notifications, etc.)
- Need client-only third-party libraries (chart libraries, animation libraries, editors, etc.)
- Need real-time UI updates (countdowns, live data, form validation, etc.)

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

  // Sync state from local storage (client-exclusive)
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
    // Optimistic update - update UI immediately
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikes(prev => newIsLiked ? prev + 1 : prev - 1)

    // Update local storage
    const storedLikes = localStorage.getItem('article-likes') || '{}'
    const likesMap = JSON.parse(storedLikes)
    likesMap[articleId] = newIsLiked
    localStorage.setItem('article-likes', JSON.stringify(likesMap))

    // Use Server Action to update server
    startTransition(async () => {
      try {
        const result = newIsLiked
          ? await likeArticle(articleId)
          : await unlikeArticle(articleId)

        if (!result.success) {
          // Rollback optimistic update
          setIsLiked(!newIsLiked)
          setLikes(prev => newIsLiked ? prev - 1 : prev + 1)
        }
      } catch (error) {
        // Rollback on error
        setIsLiked(!newIsLiked)
        setLikes(prev => newIsLiked ? prev - 1 : prev + 1)
        console.error('Like operation failed:', error)
      }
    })
  }, [articleId, isLiked])

  return (
    <button
      onClick={handleLike}
      disabled={isPending}
      className={`like-button ${isLiked ? 'liked' : ''}`}
      aria-label={isLiked ? 'Unlike' : 'Like'}
    >
      <HeartIcon filled={isLiked} />
      <span className="count">{likes}</span>
      {isPending && <span className="loading">...</span>}
    </button>
  )
}
```

### Comparison Summary

| Feature | Server Components | Client Components |
|---------|-------------------|-------------------|
| Execution Environment | Server/Build time | Browser |
| JavaScript Bundle | Not included | Included |
| Data Fetching | async/await directly | useEffect/SWR/React Query |
| State Management | Hooks not supported | Fully supported |
| Event Handling | Not supported | Fully supported |
| Browser APIs | Not available | Fully available |
| Backend Resources | Direct access | Via API/Server Actions |
| Sensitive Data | Safe (not sent to client) | Unsafe (exposed) |
| Re-rendering | Requires revalidation | Auto-triggered on state change |
| Use Cases | Static content, data display | Interactions, dynamic UI |

## 'use client' and 'use server' Directives

### 'use client' Directive

The `'use client'` directive marks the client component boundary, telling the bundler that this module and its dependencies need to be included in the client bundle.

```jsx
'use client'

// This directive must be at the very top of the file
// Before any import statements
// Must use string literals, cannot use variables

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
      <button onClick={decrement} aria-label="Decrease">-</button>
      <span className="count" aria-live="polite">{count}</span>
      <button onClick={increment} aria-label="Increase">+</button>
    </div>
  )
})
```

### Boundary Propagation Rules

When a file is marked with `'use client'`, all modules it imports are also treated as client code and included in the client bundle:

```jsx
'use client'

// These modules will all be included in the client bundle
// Even if they don't have the 'use client' directive
import { formatDate, formatCurrency } from '@/utils/formatters'
import { Button } from '@/components/Button'
import { validateEmail } from '@/utils/validation'

export function OrderForm({ products }) {
  // All imported utility functions can be used here
  // They will be bundled into the client code
  return (
    <form>
      {products.map(product => (
        <div key={product.id}>
          <span>{product.name}</span>
          <span>{formatCurrency(product.price)}</span>
        </div>
      ))}
      <Button type="submit">Submit Order</Button>
    </form>
  )
}
```

### 'use server' Directive

The `'use server'` directive defines Server Actions, functions that only execute on the server:

```jsx
// actions/posts.js
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// Define validation schema
const CreatePostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  categoryId: z.string().uuid('Invalid category ID'),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags').optional()
})

export async function createPost(prevState, formData) {
  // Verify user identity
  const session = await auth()
  if (!session?.user) {
    return { error: 'Please log in first' }
  }

  // Parse and validate form data
  const validatedFields = CreatePostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    categoryId: formData.get('categoryId'),
    tags: formData.getAll('tags')
  })

  if (!validatedFields.success) {
    return {
      error: 'Validation failed',
      fieldErrors: validatedFields.error.flatten().fieldErrors
    }
  }

  const { title, content, categoryId, tags } = validatedFields.data

  try {
    // Create article
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

    // Revalidate related caches
    revalidatePath('/blog')
    revalidateTag('posts')

    // Redirect to new article
    redirect(`/blog/${post.slug}`)
  } catch (error) {
    console.error('Failed to create article:', error)
    return { error: 'Failed to create article, please try again later' }
  }
}

export async function deletePost(postId) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Please log in first' }
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { authorId: true }
  })

  if (!post) {
    return { error: 'Article not found' }
  }

  if (post.authorId !== session.user.id) {
    return { error: 'No permission to delete this article' }
  }

  await db.post.delete({ where: { id: postId } })
  revalidatePath('/blog')
  revalidateTag('posts')

  return { success: true }
}
```

### Best Practice: Minimize Client Boundaries

Place the `'use client'` directive as low as possible in the component tree to maximize server-side rendering advantages:

```jsx
// Not recommended: Entire page becomes a client component
'use client'

export function ProductPage({ productId }) {
  const [quantity, setQuantity] = useState(1)

  // This data could have been fetched server-side, now requires extra client requests
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
// Recommended: Only interactive parts are client components
// ProductPage.jsx (Server Component)
import { Suspense } from 'react'
import { QuantitySelector } from './QuantitySelector'
import { AddToCartButton } from './AddToCartButton'
import { ReviewList } from './ReviewList'

async function ProductPage({ params }) {
  const { productId } = await params

  // Fetch data in parallel on the server
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
      {/* Static content - server rendered */}
      <div className="product-info">
        <img src={product.image} alt={product.name} />
        <h1>{product.name}</h1>
        <p className="brand">{product.brand.name}</p>
        <p className="description">{product.description}</p>
        <p className="price">{formatPrice(product.price)}</p>
      </div>

      {/* Interactive parts - client components */}
      <div className="purchase-section">
        <QuantitySelector productId={product.id} stock={product.stock} />
        <AddToCartButton product={product} />
      </div>

      {/* Review list - static content server rendered */}
      <section className="reviews">
        <h2>User Reviews ({reviews.length})</h2>
        <ReviewList reviews={reviews} />
        {/* Only the review submission form needs client interaction */}
        <Suspense fallback={<div>Loading review form...</div>}>
          <ReviewForm productId={product.id} />
        </Suspense>
      </section>
    </div>
  )
}

// QuantitySelector.jsx (Client Component)
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
      <span className="stock-info">Stock: {stock}</span>
    </div>
  )
}
```

## Data Fetching Patterns

RSC introduces entirely new data fetching patterns that make data fetching more intuitive, efficient, and type-safe.

### Data Fetching in Server Components

In server components, you can directly use async/await for data fetching:

```jsx
import { cache } from 'react'

// Use cache function to avoid duplicate requests within the same render cycle
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

// Fetch data directly in components
async function Dashboard({ userId }) {
  // Fetch multiple data sources in parallel
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

### Data Fetching and Caching Strategies

When using fetch, you can configure different caching strategies, which are well-supported in Next.js App Router:

```jsx
async function BlogPosts() {
  // Strategy 1: Static data - cached indefinitely until manual revalidation
  // Similar to getStaticProps
  const staticPosts = await fetch('https://api.example.com/posts', {
    cache: 'force-cache' // This is the default, can be omitted
  }).then(res => res.json())

  // Strategy 2: Dynamic data - fetch fresh data on every request
  // Similar to getServerSideProps
  const latestNews = await fetch('https://api.example.com/news', {
    cache: 'no-store'
  }).then(res => res.json())

  // Strategy 3: Time-based revalidation - ISR (Incremental Static Regeneration)
  // Revalidate every 60 seconds
  const popularPosts = await fetch('https://api.example.com/popular', {
    next: { revalidate: 60 }
  }).then(res => res.json())

  // Strategy 4: Tag-based revalidation - on-demand revalidation
  // Can trigger update via revalidateTag('featured')
  const featuredPosts = await fetch('https://api.example.com/featured', {
    next: { tags: ['featured-posts', 'homepage'] }
  }).then(res => res.json())

  return (
    <div className="blog-posts">
      <section>
        <h2>Featured Articles</h2>
        <PostGrid posts={featuredPosts} />
      </section>
      <section>
        <h2>Popular Articles</h2>
        <PostList posts={popularPosts} />
      </section>
      <section>
        <h2>Latest Updates</h2>
        <NewsList news={latestNews} />
      </section>
    </div>
  )
}
```

### Data Fetching Pattern Comparison

```jsx
// Pattern 1: Sequential fetching (waterfall) - Not recommended
// Total time = getUser + getPosts + getComments
async function SlowDashboard({ userId }) {
  const user = await getUser(userId)           // 1 second
  const posts = await getPosts(user.id)        // Wait to complete, then 1 second
  const comments = await getComments(user.id)  // Wait again, 1 second
  // Total approximately 3 seconds

  return <Dashboard user={user} posts={posts} comments={comments} />
}

// Pattern 2: Parallel fetching - Recommended
// Total time = max(getUser, getPosts, getComments)
async function FastDashboard({ userId }) {
  // Initiate all independent requests simultaneously
  const [user, posts, comments] = await Promise.all([
    getUser(userId),      // 1 second
    getPosts(userId),     // 1 second (parallel)
    getComments(userId)   // 1 second (parallel)
  ])
  // Total approximately 1 second

  return <Dashboard user={user} posts={posts} comments={comments} />
}

// Pattern 3: Streaming - Best user experience
// Critical content displays immediately, non-critical content loads progressively
async function StreamingDashboard({ userId }) {
  // Fetch critical data first and wait
  const user = await getUser(userId)

  // Create Promises for non-critical data, but don't wait
  // This data will be streamed to the client
  const postsPromise = getPosts(user.id)
  const commentsPromise = getComments()
  const recommendationsPromise = getRecommendations(user.id)

  return (
    <div className="dashboard">
      {/* Immediate render - user info is critical data */}
      <UserHeader user={user} />

      {/* Streaming load - article list */}
      <Suspense fallback={<PostsSkeleton />}>
        <Posts promise={postsPromise} />
      </Suspense>

      <div className="sidebar">
        {/* Streaming load - comments */}
        <Suspense fallback={<CommentsSkeleton />}>
          <Comments promise={commentsPromise} />
        </Suspense>

        {/* Streaming load - recommendations */}
        <Suspense fallback={<RecommendationsSkeleton />}>
          <Recommendations promise={recommendationsPromise} />
        </Suspense>
      </div>
    </div>
  )
}

// Posts component - Client component uses use hook to resolve Promise
'use client'

import { use } from 'react'

function Posts({ promise }) {
  const posts = use(promise)

  return (
    <section className="posts">
      <h2>Latest Articles</h2>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </section>
  )
}
```

### Data Preloading Pattern

```jsx
// data.js - Data layer
import { cache } from 'react'

// Use cache to ensure duplicate calls within the same render cycle share results
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

// Preload functions - trigger data fetching early
export const preloadUser = (userId) => {
  void getUser(userId)
}

export const preloadUserPosts = (userId) => {
  void getUserPosts(userId)
}

// UserProfile.jsx - Using preloading
import { preloadUser, getUser, getUserPosts, preloadUserPosts } from './data'
import { Suspense } from 'react'

function UserProfile({ userId }) {
  // Start preloading data immediately
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
  // At this point, data might already be in cache
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

## Streaming and Suspense

Streaming rendering is one of RSC's core features, allowing different parts of a page to load on demand, greatly improving user experience and perceived performance.

### Suspense Boundaries

The Suspense component defines loading state boundaries, displaying fallback UI when its children perform async operations:

```jsx
import { Suspense } from 'react'

async function ProductPage({ params }) {
  const { productId } = await params

  // Critical data: fetch immediately and wait
  const product = await getProduct(productId)

  return (
    <div className="product-page">
      {/* Immediately visible critical content - no Suspense needed */}
      <div className="product-hero">
        <img src={product.image} alt={product.name} />
        <h1>{product.name}</h1>
        <p className="price">{formatPrice(product.price)}</p>
        <p className="description">{product.description}</p>
      </div>

      {/* Purchase area - client interaction */}
      <Suspense fallback={<PurchaseSectionSkeleton />}>
        <PurchaseSection productId={productId} />
      </Suspense>

      {/* Reviews - can load later */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews productId={productId} />
      </Suspense>

      {/* Recommended products - lowest priority */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations category={product.category} />
      </Suspense>
    </div>
  )
}

// Async server component - triggers Suspense
async function Reviews({ productId }) {
  // Simulate slower data fetching
  const reviews = await getReviews(productId)

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  return (
    <section className="reviews">
      <header>
        <h2>User Reviews</h2>
        <div className="rating-summary">
          <StarRating value={averageRating} />
          <span>{reviews.length} reviews</span>
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

// Skeleton component
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

### Nested Suspense

You can create multiple layers of Suspense boundaries for fine-grained loading control:

```jsx
async function DashboardPage() {
  return (
    <div className="dashboard">
      {/* Top-level Header can load first */}
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>

      <div className="dashboard-layout">
        {/* Sidebar loads independently */}
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>

        <main className="main-content">
          {/* Main content area - nested Suspense */}
          <Suspense fallback={<MainContentSkeleton />}>
            <MainContent>
              {/* Stats cards load first */}
              <Suspense fallback={<StatsSkeleton />}>
                <StatsSection />
              </Suspense>

              {/* Charts area */}
              <div className="charts-row">
                <Suspense fallback={<ChartSkeleton />}>
                  <RevenueChart />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                  <UserGrowthChart />
                </Suspense>
              </div>

              {/* Data table - possibly slowest */}
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

### Streaming Data to Client

Server components can pass Promises to client components, enabling streaming data transfer:

```jsx
// Server Component
async function ArticlePage({ params }) {
  const { articleId } = await params

  // Fetch article content immediately (critical data)
  const article = await db.article.findUnique({
    where: { id: articleId },
    include: { author: true }
  })

  if (!article) notFound()

  // Create Promises, but don't await completion
  // These will be streamed to the client
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
      {/* Article content renders immediately */}
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

      {/* Comments section - streaming load */}
      <Suspense fallback={<CommentsSkeleton />}>
        <CommentsSection commentsPromise={commentsPromise} articleId={articleId} />
      </Suspense>

      {/* Related articles - streaming load */}
      <Suspense fallback={<RelatedArticlesSkeleton />}>
        <RelatedArticles articlesPromise={relatedPromise} />
      </Suspense>
    </article>
  )
}

// Client Component - uses use() hook to resolve Promise
'use client'

import { use, useState, useOptimistic } from 'react'
import { addComment } from '@/actions/comments'

export function CommentsSection({ commentsPromise, articleId }) {
  // use() automatically handles Promise, triggers Suspense
  const initialComments = use(commentsPromise)
  const [comments, setComments] = useState(initialComments)

  // Optimistic updates
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment) => [newComment, ...state]
  )

  const handleSubmit = async (formData) => {
    const content = formData.get('content')

    // Optimistic update - show new comment immediately
    addOptimisticComment({
      id: 'temp-' + Date.now(),
      content,
      user: { name: 'Me' },
      createdAt: new Date().toISOString(),
      pending: true
    })

    // Actual submission
    const result = await addComment(articleId, content)
    if (result.success) {
      setComments([result.comment, ...comments])
    }
  }

  return (
    <section className="comments">
      <h2>Comments ({optimisticComments.length})</h2>

      <form action={handleSubmit} className="comment-form">
        <textarea name="content" placeholder="Write your comment..." required />
        <button type="submit">Post Comment</button>
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

## Next.js App Router Integration

Next.js App Router is currently the most mature RSC implementation, providing a complete out-of-the-box experience.

### Project Structure

```
app/
├── layout.tsx              # Root layout (Server Component)
├── page.tsx                # Home page (Server Component)
├── loading.tsx             # Root route loading state
├── error.tsx               # Root route error boundary
├── not-found.tsx           # 404 page
├── globals.css
│
├── (marketing)/            # Route group - shared layout
│   ├── layout.tsx          # Marketing pages layout
│   ├── page.tsx            # Marketing home
│   ├── about/
│   │   └── page.tsx
│   └── pricing/
│       └── page.tsx
│
├── (dashboard)/            # Another route group
│   ├── layout.tsx          # Dashboard layout (with sidebar)
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── analytics/
│       └── page.tsx
│
├── blog/
│   ├── page.tsx            # /blog (blog list)
│   ├── loading.tsx         # Blog page loading state
│   └── [slug]/
│       ├── page.tsx        # /blog/[slug] (blog detail)
│       ├── loading.tsx
│       └── opengraph-image.tsx  # Dynamic OG image
│
├── api/
│   └── [...route]/
│       └── route.ts        # API routes
│
├── actions/
│   ├── posts.ts            # Post-related Server Actions
│   └── comments.ts         # Comment-related Server Actions
│
└── components/
    ├── Header.tsx          # Server Component
    ├── Footer.tsx          # Server Component
    ├── SearchBar.tsx       # Client Component ('use client')
    └── ThemeProvider.tsx   # Client Component
```

### Layouts and Pages

```tsx
// app/layout.tsx - Root layout (Server Component)
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
    default: 'My App',
    template: '%s | My App'
  },
  description: 'A modern application built with React Server Components',
  keywords: ['React', 'Next.js', 'RSC'],
  authors: [{ name: 'Author Name' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'My App'
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansSC.variable}`}>
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
// app/page.tsx - Home page (Server Component)
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
        <h2>Featured Articles</h2>
        <Suspense fallback={<FeaturedPostsSkeleton />}>
          <FeaturedPosts />
        </Suspense>
      </section>

      <section className="activity-section">
        <h2>Recent Activity</h2>
        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity />
        </Suspense>
      </section>

      {/* Client interaction component */}
      <section className="newsletter-section">
        <h2>Subscribe for Updates</h2>
        <NewsletterForm />
      </section>
    </div>
  )
}
```

### loading.tsx File

Next.js's `loading.tsx` file automatically creates a Suspense boundary for that route segment:

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
// This page is automatically wrapped by loading.tsx's Suspense
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
        <h1>Blog</h1>
        <p>Explore the latest technical articles and tutorials</p>
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

// Configure page caching behavior
export const revalidate = 60 // Revalidate every 60 seconds
```

### Dynamic Routes and Static Generation

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

// Generate static paths
export async function generateStaticParams() {
  const posts = await db.post.findMany({
    where: { publishedAt: { not: null } },
    select: { slug: true },
    orderBy: { publishedAt: 'desc' },
    take: 100 // Pre-generate the latest 100 articles
  })

  return posts.map(post => ({
    slug: post.slug
  }))
}

// Dynamically generate metadata
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params

  const post = await db.post.findUnique({
    where: { slug },
    include: { author: true, category: true }
  })

  if (!post) {
    return {
      title: 'Article Not Found'
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

  // Async increment view count (doesn't block rendering)
  incrementViewCount(post.id)

  // Parse Markdown to generate HTML and table of contents
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
          <span className="reading-time">{calculateReadingTime(post.content)} min read</span>
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

      {/* Comments section - streaming load */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments postId={post.id} />
      </Suspense>

      {/* Related articles - streaming load */}
      <Suspense fallback={<RelatedPostsSkeleton />}>
        <RelatedPosts
          categoryId={post.categoryId}
          currentPostId={post.id}
        />
      </Suspense>
    </article>
  )
}

// Configure caching strategy
export const revalidate = 3600 // Revalidate every hour
```

## Component Composition Patterns

### Passing Server Components as Props

Server components can be passed as children or other props to client components - this is a powerful composition pattern:

```tsx
// Server Component
async function ProductPage({ params }) {
  const { productId } = await params
  const product = await getProduct(productId)
  const specs = await getProductSpecs(productId)

  return (
    <div className="product-page">
      <h1>{product.name}</h1>

      {/* Pass server-rendered content as children to client component */}
      <ProductTabs
        defaultTab="details"
        // Server-rendered details content
        detailsContent={<ProductDetails product={product} />}
        // Server-rendered specs content
        specsContent={<ProductSpecs specs={specs} />}
        // Client-rendered reviews (needs interaction)
        reviewsContent={
          <Suspense fallback={<ReviewsSkeleton />}>
            <ProductReviews productId={productId} />
          </Suspense>
        }
      />

      {/* Purchase area - includes server-rendered stock info */}
      <AddToCartSection productId={productId} price={product.price}>
        {/* This server component is already rendered on the server */}
        <StockInfo productId={productId} />
      </AddToCartSection>
    </div>
  )
}

// Server Component - Product specs
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

// Server Component - Stock info
async function StockInfo({ productId }) {
  const stock = await getStock(productId)

  return (
    <div className={`stock-info ${stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
      {stock > 10 ? (
        <span className="text-green-600">In Stock</span>
      ) : stock > 0 ? (
        <span className="text-yellow-600">Only {stock} left</span>
      ) : (
        <span className="text-red-600">Out of Stock</span>
      )}
    </div>
  )
}
```

```tsx
// Client Component - Tabs
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
    { id: 'details', label: 'Details', content: detailsContent },
    { id: 'specs', label: 'Specifications', content: specsContent },
    { id: 'reviews', label: 'Reviews', content: reviewsContent }
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
            {/* Server-rendered content displays directly, won't re-render */}
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Context Provider Pattern

Since Context can only be used on the client, you need to create client Provider wrappers:

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
  // Ensure each request has its own QueryClient instance
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

// app/layout.tsx - Use in layout
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

## Performance Optimization Strategies

### Properly Define Component Boundaries

```tsx
// Recommended: Fine-grained client components
function ProductCard({ product }) {
  return (
    <article className="product-card">
      {/* Static content - server rendered */}
      <img src={product.image} alt={product.name} loading="lazy" />
      <h3>{product.name}</h3>
      <p className="description">{product.description}</p>
      <p className="price">{formatPrice(product.price)}</p>

      {/* Only interactive parts are client components */}
      <div className="actions">
        <AddToCartButton productId={product.id} />
        <WishlistButton productId={product.id} />
      </div>
    </article>
  )
}

// Small and focused client component
'use client'

export function AddToCartButton({ productId }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => addToCart(productId))}
      disabled={isPending}
    >
      {isPending ? 'Adding...' : 'Add to Cart'}
    </button>
  )
}
```

### Avoid Passing Non-Serializable Data in Server Components

```tsx
// Wrong: Passing functions to client components
function ServerComponent() {
  const handleClick = () => console.log('clicked')

  // This will error, functions cannot be serialized
  return <ClientComponent onClick={handleClick} />
}

// Correct Solution 1: Define functions inside client components
'use client'

function ClientComponent({ productId }) {
  const handleClick = useCallback(() => {
    console.log('clicked', productId)
  }, [productId])

  return <button onClick={handleClick}>Click</button>
}

// Correct Solution 2: Use Server Actions
'use client'

import { handleAction } from '@/actions'

function ClientComponent({ productId }) {
  return (
    <form action={handleAction}>
      <input type="hidden" name="productId" value={productId} />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### Use Parallel Data Fetching

```tsx
// Recommended: Fetch independent data in parallel
async function Dashboard({ userId }) {
  // Use Promise.all to fetch in parallel
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

// Not recommended: Sequential fetching
async function Dashboard({ userId }) {
  const user = await getUser(userId)           // Wait 500ms
  const posts = await getPosts(userId)         // Wait another 500ms
  const notifications = await getNotifications(userId)  // Wait another 500ms
  // Total 1500ms

  return <div>...</div>
}
```

### Use Suspense Boundaries Appropriately

```tsx
// Recommended: Independent Suspense boundaries allow independent loading
function Page() {
  return (
    <div>
      {/* Each section loads independently, not blocking each other */}
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

// Not recommended: Single Suspense boundary causes waiting for slowest component
function Page() {
  return (
    <Suspense fallback={<FullPageSkeleton />}>
      <div>
        <Header />      {/* Fast 100ms */}
        <Sidebar />     {/* Medium 300ms */}
        <MainContent /> {/* Slow 1000ms */}
        {/* Entire page waits 1000ms to display */}
      </div>
    </Suspense>
  )
}
```

### Leverage Caching and Revalidation

```tsx
// Use React's cache function
import { cache } from 'react'

export const getUser = cache(async (userId: string) => {
  return await db.user.findUnique({ where: { id: userId } })
})

// Call the same cached function in multiple components
async function UserProfile({ userId }) {
  const user = await getUser(userId) // First call, executes query
  return <div>{user.name}</div>
}

async function UserStats({ userId }) {
  const user = await getUser(userId) // Second call, returns cached result
  return <div>{user.posts.length} articles</div>
}
```

## Migration Strategies

### Migrating from Pages Router to App Router

```tsx
// Old Pages Router (pages/blog/[slug].js)
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
// New App Router (app/blog/[slug]/page.tsx)
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

### Incremental Migration Strategy

1. **Identify pure display components**: These can directly become server components
2. **Isolate interactive logic**: Extract parts using hooks and event handling into independent client components
3. **Migrate data fetching**: Replace useEffect + fetch with server component's async/await
4. **Gradual migration**: Can use Pages Router and App Router simultaneously in the same project

## Common Problems and Solutions

### Problem 1: How to use server data in client components

```tsx
// Solution 1: Pass via props (Recommended)
async function ServerWrapper({ userId }) {
  const user = await getUser(userId)
  return <ClientComponent user={user} />
}

// Solution 2: Use Server Actions
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

// Solution 3: Stream Promises
async function ServerWrapper({ userId }) {
  const userPromise = getUser(userId) // Don't await
  return <ClientComponent userPromise={userPromise} />
}

'use client'

function ClientComponent({ userPromise }) {
  const user = use(userPromise)
  return <div>{user.name}</div>
}
```

### Problem 2: Third-party library doesn't support server components

```tsx
// Create a client wrapper
'use client'

import { Chart } from 'chart-library'
export { Chart }

// Or use dynamic import
'use client'

import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('chart-library').then(mod => mod.Chart), {
  ssr: false,
  loading: () => <ChartSkeleton />
})

export { Chart }

// Use in server component
async function AnalyticsPage() {
  const data = await getAnalyticsData()

  return (
    <div>
      <h1>Analytics</h1>
      <Chart data={data} />
    </div>
  )
}
```

### Problem 3: How to handle authentication state

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

## Interview Key Points

### Frequently Asked Interview Questions

**1. What are React Server Components? What problems do they solve?**

RSC are React components that run on the server, primarily solving these problems:
- Reduce client-side JavaScript bundle size (large dependencies don't need to be sent to client)
- Simplify data fetching flow (can use async/await directly in components)
- Protect sensitive information (API keys etc. are not exposed to client)
- Improve initial page load performance (critical content returned directly as HTML)
- Better SEO support

**2. What are the main differences between server and client components?**

| Aspect | Server Components | Client Components |
|--------|-------------------|-------------------|
| Execution Environment | Server | Browser |
| Hooks | Not supported | Supported |
| Event Handling | Not supported | Supported |
| Browser APIs | Not available | Available |
| Backend Resources | Direct access | Requires API |
| Bundling | Not included in client bundle | Included |

**3. What are the purposes of 'use client' and 'use server' directives?**

- `'use client'`: Marks client component boundary, tells bundler the module needs to be included in client bundle
- `'use server'`: Defines Server Actions, functions that only execute on server and can be called directly from client

**4. How to implement data fetching in RSC architecture?**

- Server components: Use async/await directly, supports cache and revalidate
- Client components: Use useEffect, SWR, React Query, or Server Actions
- Streaming: Implement progressive loading through Suspense + Promise passing

**5. How do Suspense and Streaming work together?**

- Suspense defines loading boundaries and fallback UI
- When async components render, Suspense shows fallback
- Streaming allows server to progressively send HTML
- Combined use achieves: show skeleton first, stream replace with content when ready

**6. How to optimize RSC application performance?**

- Place 'use client' at leaf nodes of component tree
- Use Promise.all for parallel data fetching
- Set up Suspense boundaries appropriately
- Use cache function to avoid duplicate requests
- Configure appropriate revalidate strategies

## Summary

React Server Components represents a major evolution in React application architecture. After reading this, you should be able to:

1. **Understand RSC core concepts**: Server components execute on server, don't add to client bundle size
2. **Distinguish component types**: Choose server or client components based on whether interaction is needed
3. **Use directives correctly**: Use 'use client' at minimum necessary scope, leverage 'use server' to create Server Actions
4. **Master data fetching patterns**: Use async/await, parallel fetching, and streaming to optimize performance
5. **Implement streaming rendering**: Use Suspense boundaries for progressive loading, improving user experience
6. **Integrate with Next.js App Router**: Fully leverage file-system routing, layouts, loading.tsx and other features
7. **Apply best practices**: Properly define component boundaries, optimize data fetching, configure caching strategies

RSC is not just a new feature, but a completely new way of thinking about and building React applications. It combines the performance advantages of server-side rendering with the interactive experience of client-side rendering, providing the optimal development pattern for modern web applications. As the React ecosystem continues to evolve, RSC will become the standard method for building high-performance React applications.
