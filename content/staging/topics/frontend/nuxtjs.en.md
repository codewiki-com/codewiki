---
title: Nuxt.js Complete Guide
description: Master Nuxt.js for full-stack Vue applications
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Nuxt.js
  - Vue
  - SSR
  - Full-stack
status: imported
origin: old/src/content/docs/frontend/nuxtjs.en.md
divergence: 0.224
issues: []
legacy:
  category: Frontend
  subcategory: Framework
  order: 16
  lastUpdated: 2026-01-07
---

Nuxt.js is an open-source full-stack framework built on Vue.js that provides an intuitive and powerful development experience, enabling developers to confidently build high-performance, production-grade web applications. Nuxt 3, built on Vue 3 and Vite, introduces a completely new architecture with enhanced capabilities.

## Nuxt 3 Features

### New Architecture

Nuxt 3 represents a major architectural upgrade with many exciting new features:

```typescript
// nuxt.config.ts - Nuxt 3 configuration file
export default defineNuxtConfig({
  // Enable developer tools
  devtools: { enabled: true },

  // TypeScript support out of the box
  typescript: {
    strict: true,
    typeCheck: true
  },

  // Module system
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxt/image'
  ],

  // Runtime configuration
  runtimeConfig: {
    // Private server-side configuration
    apiSecret: process.env.API_SECRET,
    // Public configuration (accessible on client)
    public: {
      apiBase: process.env.API_BASE_URL
    }
  }
})
```

### Core Features Overview

| Feature | Description | Advantage |
|---------|-------------|-----------|
| **Nitro Engine** | New server engine | Multi-platform deployment, ultimate performance |
| **Auto-imports** | Components, composables auto-imported | Reduced boilerplate code |
| **Hybrid Rendering** | Flexible rendering strategies | Choose SSR/SSG/CSR per route |
| **Vite Integration** | Vite as default bundler | Ultra-fast development experience |
| **TypeScript** | Native support | Type safety, better IDE support |

### Creating a Nuxt 3 Project

```bash
# Create a new project
npx nuxi@latest init my-nuxt-app

# Navigate to project directory
cd my-nuxt-app

# Install dependencies
npm install

# Start development server
npm run dev
```

## Directory Structure and Conventions

Nuxt adopts a convention-over-configuration philosophy where the directory structure has special meaning:

```
my-nuxt-app/
├── .nuxt/                 # Build artifacts (auto-generated)
├── .output/               # Production build output
├── app/                   # Main application directory (Nuxt 4 recommended)
│   ├── assets/           # Static assets (processed by build tools)
│   ├── components/       # Vue components (auto-imported)
│   ├── composables/      # Composition functions (auto-imported)
│   ├── layouts/          # Layout components
│   ├── middleware/       # Route middleware
│   ├── pages/            # Page components (file-based routing)
│   ├── plugins/          # Vue plugins
│   └── utils/            # Utility functions (auto-imported)
├── public/                # Static files (served directly)
├── server/                # Server-side code
│   ├── api/              # API routes
│   ├── middleware/       # Server middleware
│   └── plugins/          # Nitro plugins
├── app.vue                # Application root component
├── app.config.ts          # Application configuration
├── nuxt.config.ts         # Nuxt configuration
└── package.json
```

### Auto-import Mechanism

Nuxt's auto-import feature dramatically boosts developer productivity:

```vue
<script setup lang="ts">
// No manual import needed - composables auto-imported
const { data, pending } = await useFetch('/api/users')

// No manual import needed - Vue APIs auto-imported
const count = ref(0)
const doubled = computed(() => count.value * 2)

// No manual import needed - routing-related
const route = useRoute()
const router = useRouter()

// No manual import needed - runtime config
const config = useRuntimeConfig()
</script>

<template>
  <!-- No manual import needed - components auto-imported -->
  <AppHeader />
  <NuxtPage />
  <AppFooter />
</template>
```

### Configuring Custom Import Directories

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  imports: {
    dirs: [
      // Scan top-level composables
      '~/composables',
      // Scan index files in nested directories
      '~/composables/*/index.{ts,js,mjs,mts}',
      // Scan all nested files
      '~/composables/**'
    ]
  }
})
```

## Server-Side Rendering and Hybrid Mode

Nuxt provides flexible rendering strategies, allowing you to choose the optimal approach for different page requirements.

### Rendering Mode Comparison

| Mode | Characteristics | Use Case |
|------|-----------------|----------|
| **SSR** | Server-side rendering | High SEO requirements, first-paint performance critical |
| **SSG** | Static site generation | Content that rarely changes |
| **SPA** | Client-side rendering | Admin dashboards, no SEO needs |
| **ISR** | Incremental static regeneration | Content with moderate update frequency |
| **SWR** | Stale-while-revalidate | Need caching while maintaining freshness |

### Hybrid Rendering Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // Homepage - prerender at build time
    '/': { prerender: true },

    // Products page - SWR strategy, background revalidation
    '/products': { swr: true },

    // Product details - SWR + 1 hour cache
    '/products/**': { swr: 3600 },

    // Blog listing - ISR strategy, CDN cache for 1 hour
    '/blog': { isr: 3600 },

    // Blog posts - ISR strategy, until next deployment
    '/blog/**': { isr: true },

    // Admin panel - client-side rendering only
    '/admin/**': { ssr: false },

    // API routes - add CORS headers
    '/api/**': { cors: true },

    // Old page redirect
    '/old-page': { redirect: '/new-page' }
  }
})
```

### Global Rendering Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Completely disable SSR (pure SPA mode)
  ssr: false,

  // Or use Nitro preset
  nitro: {
    preset: 'static' // Static site generation
  }
})
```

### Page-Level Rendering Control

```vue
<script setup lang="ts">
// pages/admin/dashboard.vue
// Define page meta to disable SSR for this page
definePageMeta({
  ssr: false
})
</script>
```

## Data Fetching

Nuxt 3 provides powerful data fetching composables that support SSR and automatically handle state synchronization.

### useFetch - Convenient Data Fetching

```vue
<script setup lang="ts">
// Basic usage
const { data, pending, error, refresh } = await useFetch('/api/users')

// Request with parameters
const userId = ref(1)
const { data: user } = await useFetch(() => `/api/users/${userId.value}`)

// Full configuration example
const { data: posts } = await useFetch('/api/posts', {
  // Request method
  method: 'GET',

  // Query parameters
  query: {
    page: 1,
    limit: 10
  },

  // Request headers
  headers: {
    'Authorization': 'Bearer token'
  },

  // Cache key (for deduplication)
  key: 'posts-list',

  // Transform response data
  transform: (response) => response.data,

  // Default value
  default: () => [],

  // Server-side only fetch
  server: true,

  // Lazy fetch (doesn't block navigation)
  lazy: false,

  // Execute immediately
  immediate: true,

  // Deep watch
  deep: true,

  // Re-fetch when dependencies change
  watch: [userId]
})
</script>

<template>
  <div>
    <div v-if="pending">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <ul v-else>
      <li v-for="post in posts" :key="post.id">
        {{ post.title }}
      </li>
    </ul>
    <button @click="refresh()">Refresh</button>
  </div>
</template>
```

### useAsyncData - Flexible Async Data

```vue
<script setup lang="ts">
// For complex data fetching logic
const { data: analytics, pending, error } = await useAsyncData(
  'dashboard-analytics',
  async () => {
    // Fetch multiple data sources in parallel
    const [users, orders, revenue] = await Promise.all([
      $fetch('/api/users/count'),
      $fetch('/api/orders/today'),
      $fetch('/api/revenue/monthly')
    ])

    return {
      users,
      orders,
      revenue
    }
  },
  {
    // Don't re-fetch on client-side navigation
    getCachedData: (key) => {
      const nuxtApp = useNuxtApp()
      return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
    }
  }
)

// Conditional data fetching
const shouldFetch = ref(true)
const { data } = await useAsyncData(
  'conditional-data',
  () => $fetch('/api/data'),
  {
    // Only fetch when condition is met
    immediate: shouldFetch.value
  }
)
</script>
```

### useLazyFetch and useLazyAsyncData

```vue
<script setup lang="ts">
// Lazy loading - doesn't block page navigation
const { data: comments, pending } = useLazyFetch('/api/comments')

// Equivalent to
const { data } = useFetch('/api/comments', { lazy: true })
</script>

<template>
  <div>
    <!-- Use skeleton or loading state -->
    <template v-if="pending">
      <CommentSkeleton v-for="i in 5" :key="i" />
    </template>
    <template v-else>
      <Comment v-for="comment in comments" :key="comment.id" :data="comment" />
    </template>
  </div>
</template>
```

### Refresh and Invalidation

```vue
<script setup lang="ts">
const { data, refresh, execute } = await useFetch('/api/posts')

// Refresh data (uses cache)
const handleRefresh = () => refresh()

// Force refresh (ignores cache)
const handleForceRefresh = () => refresh({ dedupe: false })

// Clear cache and refresh
const handleClearAndRefresh = async () => {
  clearNuxtData('posts')
  await refresh()
}

// Refresh all data
const refreshAll = () => refreshNuxtData()
</script>
```

## Routing System

Nuxt automatically generates routes based on the file system. The file structure in the pages directory directly maps to URL paths.

### File-Based Routing Conventions

```
pages/
├── index.vue              → /
├── about.vue              → /about
├── users/
│   ├── index.vue          → /users
│   └── [id].vue           → /users/:id
├── posts/
│   ├── index.vue          → /posts
│   ├── [slug].vue         → /posts/:slug
│   └── [...slug].vue      → /posts/* (catch-all)
├── [[optional]].vue       → /:optional? (optional parameter)
└── admin/
    └── [[...slug]].vue    → /admin/* (optional catch-all)
```

### Dynamic Route Parameters

```vue
<script setup lang="ts">
// pages/posts/[id].vue
const route = useRoute()

// Get route parameters
const postId = route.params.id

// Fetch data using parameters
const { data: post } = await useFetch(`/api/posts/${postId}`)

// Watch for parameter changes
watch(() => route.params.id, async (newId) => {
  // Handle parameter changes
})
</script>
```

### Nested Routes

```
pages/
├── users/
│   ├── index.vue          → /users (list page)
│   └── [id]/
│       ├── index.vue      → /users/:id (detail page)
│       ├── edit.vue       → /users/:id/edit
│       └── settings.vue   → /users/:id/settings
```

```vue
<!-- pages/users/[id].vue - Parent route -->
<script setup lang="ts">
const route = useRoute()
const { data: user } = await useFetch(`/api/users/${route.params.id}`)
</script>

<template>
  <div>
    <UserHeader :user="user" />
    <!-- Child route render position -->
    <NuxtPage :user="user" />
  </div>
</template>
```

### Route Middleware

```typescript
// middleware/auth.ts - Named middleware
export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    // Redirect to login page
    return navigateTo('/login')
  }
})

// middleware/analytics.global.ts - Global middleware
export default defineNuxtRouteMiddleware((to, from) => {
  // Execute on every route change
  trackPageView(to.path)
})
```

```vue
<script setup lang="ts">
// Using middleware in pages
definePageMeta({
  middleware: ['auth'],
  // Or multiple middleware
  middleware: ['auth', 'admin']
})
</script>
```

### Route Validation

```vue
<script setup lang="ts">
// pages/posts/[id].vue
definePageMeta({
  validate: async (route) => {
    // Validate id is a number
    return /^\d+$/.test(route.params.id as string)
  }
})
</script>
```

### Programmatic Navigation

```vue
<script setup lang="ts">
const router = useRouter()

// Navigation methods
const goToHome = () => navigateTo('/')

const goToUser = (id: number) => {
  navigateTo({
    path: `/users/${id}`,
    query: { tab: 'profile' }
  })
}

// External links
const goToExternal = () => {
  navigateTo('https://nuxt.com', { external: true })
}

// Replace current history entry
const replaceRoute = () => {
  navigateTo('/new-page', { replace: true })
}

// Redirect (works on server side)
const redirect = () => {
  navigateTo('/redirected', { redirectCode: 301 })
}
</script>

<template>
  <div>
    <!-- Declarative navigation -->
    <NuxtLink to="/">Home</NuxtLink>
    <NuxtLink :to="{ name: 'users-id', params: { id: 1 } }">
      User Details
    </NuxtLink>

    <!-- Prefetch optimization -->
    <NuxtLink to="/about" prefetch>About Us</NuxtLink>
    <NuxtLink to="/heavy-page" :prefetch="false">Heavy Page</NuxtLink>
  </div>
</template>
```

## State Management

Nuxt 3 provides built-in `useState` composable and seamlessly integrates with Pinia.

### useState - Built-in State Management

```typescript
// composables/useCounter.ts
export const useCounter = () => {
  // useState creates SSR-friendly reactive state
  const count = useState<number>('counter', () => 0)

  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => count.value = 0

  return {
    count: readonly(count),
    increment,
    decrement,
    reset
  }
}
```

```vue
<script setup lang="ts">
// Use in any component
const { count, increment, decrement } = useCounter()
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="decrement">-</button>
    <button @click="increment">+</button>
  </div>
</template>
```

### Shared State

```typescript
// composables/useUser.ts
export const useUser = () => {
  // Using the same key shares state across multiple components
  const user = useState<User | null>('user', () => null)

  const login = async (credentials: Credentials) => {
    const data = await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials
    })
    user.value = data.user
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
  }

  const isLoggedIn = computed(() => user.value !== null)

  return {
    user: readonly(user),
    isLoggedIn,
    login,
    logout
  }
}
```

### Pinia Integration

```bash
# Install Pinia
npm install pinia @pinia/nuxt
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt']
})
```

```typescript
// stores/cart.ts
import { defineStore } from 'pinia'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    loading: false
  }),

  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),

    totalPrice: (state) => state.items.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    ),

    isEmpty: (state) => state.items.length === 0
  },

  actions: {
    addItem(product: Omit<CartItem, 'quantity'>) {
      const existingItem = this.items.find(item => item.id === product.id)

      if (existingItem) {
        existingItem.quantity++
      } else {
        this.items.push({ ...product, quantity: 1 })
      }
    },

    removeItem(productId: number) {
      const index = this.items.findIndex(item => item.id === productId)
      if (index > -1) {
        this.items.splice(index, 1)
      }
    },

    async checkout() {
      this.loading = true
      try {
        await $fetch('/api/orders', {
          method: 'POST',
          body: { items: this.items }
        })
        this.items = []
      } finally {
        this.loading = false
      }
    }
  }
})
```

```typescript
// stores/cart.ts - Composition API style
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const loading = ref(false)

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  function addItem(product: Omit<CartItem, 'quantity'>) {
    const existing = items.value.find(item => item.id === product.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ ...product, quantity: 1 })
    }
  }

  async function checkout() {
    loading.value = true
    try {
      await $fetch('/api/orders', {
        method: 'POST',
        body: { items: items.value }
      })
      items.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    loading,
    totalItems,
    totalPrice,
    addItem,
    checkout
  }
})
```

```vue
<script setup lang="ts">
// Using Pinia store in components
const cart = useCartStore()

// SSR-friendly data fetching
await callOnce(async () => {
  // Initialize cart data
  const savedCart = await $fetch('/api/cart')
  cart.items = savedCart.items
})
</script>

<template>
  <div class="cart">
    <h2>Shopping Cart ({{ cart.totalItems }})</h2>
    <ul>
      <li v-for="item in cart.items" :key="item.id">
        {{ item.name }} x {{ item.quantity }} -
        ${{ (item.price * item.quantity).toFixed(2) }}
      </li>
    </ul>
    <p>Total: ${{ cart.totalPrice.toFixed(2) }}</p>
    <button @click="cart.checkout" :disabled="cart.loading || cart.isEmpty">
      {{ cart.loading ? 'Processing...' : 'Checkout' }}
    </button>
  </div>
</template>
```

## Server API Routes

Nuxt 3's Nitro engine provides powerful server-side capabilities with file-based API routing.

### Creating API Endpoints

```typescript
// server/api/products/index.get.ts
import { z } from 'zod'

const querySchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).default(0),
  maxPrice: z.coerce.number().max(100000).default(100000),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(12)
})

export default defineEventHandler(async (event) => {
  // Validate query parameters
  const query = await getValidatedQuery(event, querySchema.parse)

  // Build query conditions
  const where: any = {
    price: {
      gte: query.minPrice,
      lte: query.maxPrice
    }
  }

  if (query.category) {
    where.category = query.category
  }

  // Use Prisma to query database
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.count({ where })
  ])

  return {
    data: products,
    total,
    page: query.page,
    pageSize: query.pageSize
  }
})
```

```typescript
// server/api/products/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid product ID'
    })
  }

  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: {
      category: true,
      reviews: {
        take: 10,
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!product) {
    throw createError({
      statusCode: 404,
      message: 'Product not found'
    })
  }

  return product
})
```

### Server Middleware

```typescript
// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  // Only protect /api/admin routes
  if (!event.path.startsWith('/api/admin')) {
    return
  }

  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized access'
    })
  }

  try {
    const payload = await verifyToken(token)
    event.context.user = payload
  } catch {
    throw createError({
      statusCode: 401,
      message: 'Token is invalid or expired'
    })
  }
})
```

## Module System

Nuxt's module system allows extending framework functionality, with a rich ecosystem of community modules.

### Common Modules

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    // UI component library
    '@nuxt/ui',

    // Image optimization
    '@nuxt/image',

    // Content management
    '@nuxt/content',

    // Font optimization
    '@nuxt/fonts',

    // SEO optimization
    '@nuxtjs/seo',

    // State management
    '@pinia/nuxt',

    // Internationalization
    '@nuxtjs/i18n',

    // Color mode
    '@nuxtjs/color-mode',

    // PWA support
    '@vite-pwa/nuxt'
  ]
})
```

### @nuxt/image Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/image'],

  image: {
    // Image optimization provider
    provider: 'ipx',

    // Preset sizes
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280
    },

    // Image formats
    format: ['webp', 'avif'],

    // Quality settings
    quality: 80
  }
})
```

```vue
<template>
  <!-- Optimized image component -->
  <NuxtImg
    src="/hero.jpg"
    width="800"
    height="400"
    sizes="sm:100vw md:50vw lg:400px"
    placeholder
    loading="lazy"
  />

  <!-- Responsive picture -->
  <NuxtPicture
    src="/product.jpg"
    sizes="xs:100vw sm:50vw md:400px"
    :imgAttrs="{ class: 'rounded-lg' }"
  />
</template>
```

## Deployment Options

Nuxt 3's Nitro engine supports multiple deployment targets.

### Node.js Server Deployment

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'node-server'
  }
})
```

```bash
# Build
npm run build

# Run
node .output/server/index.mjs
```

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

### Edge Deployment

```typescript
// nuxt.config.ts - Vercel Edge
export default defineNuxtConfig({
  nitro: {
    preset: 'vercel-edge'
  }
})

// Cloudflare Workers
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages'
  }
})

// Netlify Edge
export default defineNuxtConfig({
  nitro: {
    preset: 'netlify-edge'
  }
})
```

### Static Generation

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Full static generation
  ssr: true,
  nitro: {
    preset: 'static',
    prerender: {
      routes: ['/', '/about', '/blog'],
      crawlLinks: true
    }
  }
})
```

```bash
# Generate static site
npm run generate

# Preview
npx serve .output/public
```

## Interview Key Points

### Foundational Questions

**Q1: What are the main improvements in Nuxt 3 compared to Nuxt 2?**

```
Core improvements:
1. Built on Vue 3 and Composition API
2. Uses Vite as default build tool for faster development
3. Nitro server engine supporting multi-platform deployment
4. Native TypeScript support
5. More powerful auto-import mechanism
6. Hybrid rendering support (SSR, SSG, CSR, ISR configurable per route)
7. Smaller bundle size
```

**Q2: What's the difference between useFetch and useAsyncData?**

```typescript
// useFetch - convenience wrapper for simple requests
const { data } = await useFetch('/api/users')

// useAsyncData - more flexible for complex scenarios
const { data } = await useAsyncData('users', async () => {
  // Can execute any async logic
  const users = await $fetch('/api/users')
  const roles = await $fetch('/api/roles')
  return { users, roles }
})

// Key differences:
// 1. useFetch is syntactic sugar for useAsyncData + $fetch
// 2. useAsyncData can execute any async operation
// 3. useFetch auto-generates key based on URL
// 4. useAsyncData requires manual key specification
```

**Q3: What rendering modes does Nuxt support? How do you choose?**

```typescript
// 1. SSR (Server-Side Rendering) - default mode
// Use case: High SEO requirements, critical first-paint performance
export default defineNuxtConfig({
  ssr: true
})

// 2. SPA (Client-Side Rendering)
// Use case: Admin dashboards, no SEO needs
export default defineNuxtConfig({
  ssr: false
})

// 3. SSG (Static Site Generation)
// Use case: Sites with infrequently changing content
export default defineNuxtConfig({
  nitro: { preset: 'static' }
})

// 4. Hybrid mode - configure per route
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },        // Pre-render
    '/blog/**': { isr: 3600 },       // ISR
    '/admin/**': { ssr: false }      // Client-side rendering
  }
})
```

### Advanced Practice Questions

**Q4: How do you implement global state management in Nuxt?**

```typescript
// Option 1: useState (simple scenarios)
export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const isLoggedIn = computed(() => !!user.value)

  return { user, isLoggedIn }
}

// Option 2: Pinia (complex scenarios)
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  const isLoggedIn = computed(() => !!user.value)

  async function login(credentials: Credentials) {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials
    })
    user.value = res.user
    token.value = res.token
  }

  return { user, token, isLoggedIn, login }
})
```

**Q5: How do you handle SEO in Nuxt?**

```vue
<script setup lang="ts">
// Page-level SEO
useHead({
  title: 'Product Details - My Store',
  meta: [
    { name: 'description', content: 'Quality product description' },
    { property: 'og:title', content: 'Product Details' },
    { property: 'og:image', content: '/og-image.png' }
  ],
  link: [
    { rel: 'canonical', href: 'https://example.com/products/1' }
  ]
})

// Dynamic SEO
const { data: product } = await useFetch('/api/products/1')

useHead({
  title: () => product.value?.name,
  meta: [
    { name: 'description', content: () => product.value?.description }
  ]
})

// Using useSeoMeta
useSeoMeta({
  title: 'Page Title',
  description: 'Page Description',
  ogTitle: 'OG Title',
  ogDescription: 'OG Description',
  ogImage: 'https://example.com/image.png',
  twitterCard: 'summary_large_image'
})
</script>
```

**Q6: How do you optimize Nuxt application performance?**

```typescript
// 1. Route-level code splitting (automatic)
// Each page in pages directory is automatically code-split

// 2. Component lazy loading
const HeavyChart = defineAsyncComponent(() =>
  import('~/components/HeavyChart.vue')
)

// 3. Data fetching optimization
const { data } = await useFetch('/api/data', {
  // Use caching
  getCachedData: (key) => useNuxtApp().payload.data[key],
  // Lazy load non-critical data
  lazy: true
})

// 4. Pre-render critical pages
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/about': { prerender: true }
  }
})

// 5. Use payload extraction
export default defineNuxtConfig({
  experimental: {
    payloadExtraction: true
  }
})
```

## Summary

Nuxt.js is a powerful Vue full-stack framework that greatly simplifies modern web application development through its convention-over-configuration philosophy. The core topics covered in this article include:

1. **Nuxt 3 Features**: Nitro engine, auto-imports, TypeScript support
2. **Directory Structure**: Convention-based directory layout, automatic route generation
3. **Rendering Modes**: Flexible choice between SSR, SSG, SPA, and hybrid rendering
4. **Data Fetching**: SSR-friendly data fetching with useFetch and useAsyncData
5. **Routing System**: File-system routing, dynamic routes, middleware
6. **State Management**: Built-in useState solution and Pinia integration
7. **Module Ecosystem**: Rich official and community modules
8. **Deployment Options**: Node.js, Edge, and static site deployment methods

With these core concepts and best practices, you can build high-performance, maintainable modern web applications.

## Further Reading

### Official Resources

- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Nuxt Modules](https://nuxt.com/modules)
- [Nitro Documentation](https://nitro.unjs.io/)

### Related Articles in Code Wiki

- Vue Reactivity System - Understanding Vue 3's reactive foundation
- TypeScript Generics - For type-safe Nuxt development
- Node.js Fundamentals - Server-side JavaScript essentials

---

Understanding Nuxt.js deeply enables efficient development of Vue-based full-stack applications and effective debugging and optimization when issues arise, leading to more efficient and robust code.
