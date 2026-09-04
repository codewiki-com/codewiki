---
title: Nuxt.js 完全指南
description: 掌握Nuxt.js全栈Vue框架，构建高性能的现代Web应用
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Nuxt.js
  - Vue
  - SSR
  - 全栈
status: imported
origin: old/src/content/docs/frontend/nuxtjs.zh.md
divergence: 0.224
issues: []
legacy:
  category: Frontend
  subcategory: Framework
  order: 16
  lastUpdated: 2026-01-07
---

Nuxt.js 是一个基于 Vue.js 的开源全栈框架，它提供了直观而强大的开发体验，使开发者能够自信地构建高性能、生产级的 Web 应用。Nuxt 3 基于 Vue 3 和 Vite 构建，带来了全新的架构和更强大的功能。

## Nuxt 3 新特性

### 全新架构

Nuxt 3 是一次重大的架构升级，带来了许多令人兴奋的新特性：

```typescript
// nuxt.config.ts - Nuxt 3 配置文件
export default defineNuxtConfig({
  // 开启开发者工具
  devtools: { enabled: true },

  // TypeScript 支持开箱即用
  typescript: {
    strict: true,
    typeCheck: true
  },

  // 模块系统
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxt/image'
  ],

  // 运行时配置
  runtimeConfig: {
    // 服务端私有配置
    apiSecret: process.env.API_SECRET,
    // 公开配置（客户端可访问）
    public: {
      apiBase: process.env.API_BASE_URL
    }
  }
})
```

### 核心新特性一览

| 特性 | 描述 | 优势 |
|------|------|------|
| **Nitro 引擎** | 全新的服务端引擎 | 支持多平台部署，极致性能 |
| **自动导入** | 组件、composables 自动导入 | 减少样板代码 |
| **混合渲染** | 灵活的渲染策略 | 按需选择 SSR/SSG/CSR |
| **Vite 集成** | 默认使用 Vite | 极速开发体验 |
| **TypeScript** | 原生支持 | 类型安全，更好的 IDE 支持 |

### 创建 Nuxt 3 项目

```bash
# 创建新项目
npx nuxi@latest init my-nuxt-app

# 进入项目目录
cd my-nuxt-app

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 目录结构与约定

Nuxt 采用约定优于配置的理念，目录结构具有特殊含义：

```
my-nuxt-app/
├── .nuxt/                 # 构建产物（自动生成）
├── .output/               # 生产构建输出
├── app/                   # 应用主目录（Nuxt 4 推荐）
│   ├── assets/           # 静态资源（会被构建工具处理）
│   ├── components/       # Vue 组件（自动导入）
│   ├── composables/      # 组合式函数（自动导入）
│   ├── layouts/          # 布局组件
│   ├── middleware/       # 路由中间件
│   ├── pages/            # 页面组件（文件路由）
│   ├── plugins/          # Vue 插件
│   └── utils/            # 工具函数（自动导入）
├── public/                # 静态文件（直接服务）
├── server/                # 服务端代码
│   ├── api/              # API 路由
│   ├── middleware/       # 服务端中间件
│   └── plugins/          # Nitro 插件
├── app.vue                # 应用根组件
├── app.config.ts          # 应用配置
├── nuxt.config.ts         # Nuxt 配置
└── package.json
```

### 自动导入机制

Nuxt 的自动导入功能极大提升了开发效率：

```vue
<script setup lang="ts">
// 无需手动导入 - composables 自动导入
const { data, pending } = await useFetch('/api/users')

// 无需手动导入 - Vue API 自动导入
const count = ref(0)
const doubled = computed(() => count.value * 2)

// 无需手动导入 - 路由相关
const route = useRoute()
const router = useRouter()

// 无需手动导入 - 运行时配置
const config = useRuntimeConfig()
</script>

<template>
  <!-- 无需手动导入 - 组件自动导入 -->
  <AppHeader />
  <NuxtPage />
  <AppFooter />
</template>
```

### 配置自定义导入目录

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  imports: {
    dirs: [
      // 扫描顶层 composables
      '~/composables',
      // 扫描嵌套目录中的 index 文件
      '~/composables/*/index.{ts,js,mjs,mts}',
      // 扫描所有嵌套文件
      '~/composables/**'
    ]
  }
})
```

## 服务端渲染与 Hybrid 模式

Nuxt 提供了灵活的渲染策略，可以根据不同页面需求选择最优方案。

### 渲染模式对比

| 模式 | 特点 | 适用场景 |
|------|------|----------|
| **SSR** | 服务端渲染 | SEO 要求高、首屏性能要求高 |
| **SSG** | 静态生成 | 内容不常变化的页面 |
| **SPA** | 客户端渲染 | 管理后台、无 SEO 需求 |
| **ISR** | 增量静态生成 | 内容更新频率适中 |
| **SWR** | 后台重新验证 | 需要缓存但保持新鲜度 |

### 混合渲染配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // 首页 - 构建时预渲染
    '/': { prerender: true },

    // 产品页 - SWR 策略，后台重新验证
    '/products': { swr: true },

    // 产品详情 - SWR + 1小时缓存
    '/products/**': { swr: 3600 },

    // 博客列表 - ISR 策略，CDN 缓存1小时
    '/blog': { isr: 3600 },

    // 博客文章 - ISR 策略，直到下次部署
    '/blog/**': { isr: true },

    // 管理后台 - 仅客户端渲染
    '/admin/**': { ssr: false },

    // API 路由 - 添加 CORS 头
    '/api/**': { cors: true },

    // 旧页面重定向
    '/old-page': { redirect: '/new-page' }
  }
})
```

### 全局渲染配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // 完全禁用 SSR（纯 SPA 模式）
  ssr: false,

  // 或者使用 Nitro 预设
  nitro: {
    preset: 'static' // 静态站点生成
  }
})
```

### 页面级渲染控制

```vue
<script setup lang="ts">
// pages/admin/dashboard.vue
// 定义页面元信息，禁用该页面的 SSR
definePageMeta({
  ssr: false
})
</script>
```

## 数据获取

Nuxt 3 提供了强大的数据获取 composables，支持 SSR 并自动处理状态同步。

### useFetch - 便捷的数据获取

```vue
<script setup lang="ts">
// 基础用法
const { data, pending, error, refresh } = await useFetch('/api/users')

// 带参数的请求
const userId = ref(1)
const { data: user } = await useFetch(() => `/api/users/${userId.value}`)

// 完整配置示例
const { data: posts } = await useFetch('/api/posts', {
  // 请求方法
  method: 'GET',

  // 查询参数
  query: {
    page: 1,
    limit: 10
  },

  // 请求头
  headers: {
    'Authorization': 'Bearer token'
  },

  // 缓存 key（用于去重）
  key: 'posts-list',

  // 转换响应数据
  transform: (response) => response.data,

  // 默认值
  default: () => [],

  // 仅在服务端获取
  server: true,

  // 延迟获取（不阻塞导航）
  lazy: false,

  // 立即执行
  immediate: true,

  // 深度监听
  deep: true,

  // 监听依赖变化时重新获取
  watch: [userId]
})
</script>

<template>
  <div>
    <div v-if="pending">加载中...</div>
    <div v-else-if="error">错误: {{ error.message }}</div>
    <ul v-else>
      <li v-for="post in posts" :key="post.id">
        {{ post.title }}
      </li>
    </ul>
    <button @click="refresh()">刷新</button>
  </div>
</template>
```

### useAsyncData - 灵活的异步数据

```vue
<script setup lang="ts">
// 适用于复杂的数据获取逻辑
const { data: analytics, pending, error } = await useAsyncData(
  'dashboard-analytics',
  async () => {
    // 并行获取多个数据源
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
    // 在客户端导航时不重新获取
    getCachedData: (key) => {
      const nuxtApp = useNuxtApp()
      return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
    }
  }
)

// 带条件的数据获取
const shouldFetch = ref(true)
const { data } = await useAsyncData(
  'conditional-data',
  () => $fetch('/api/data'),
  {
    // 仅在条件满足时获取
    immediate: shouldFetch.value
  }
)
</script>
```

### useLazyFetch 与 useLazyAsyncData

```vue
<script setup lang="ts">
// 懒加载 - 不阻塞页面导航
const { data: comments, pending } = useLazyFetch('/api/comments')

// 等同于
const { data } = useFetch('/api/comments', { lazy: true })
</script>

<template>
  <div>
    <!-- 使用 skeleton 或加载状态 -->
    <template v-if="pending">
      <CommentSkeleton v-for="i in 5" :key="i" />
    </template>
    <template v-else>
      <Comment v-for="comment in comments" :key="comment.id" :data="comment" />
    </template>
  </div>
</template>
```

### 刷新与失效

```vue
<script setup lang="ts">
const { data, refresh, execute } = await useFetch('/api/posts')

// 刷新数据（使用缓存）
const handleRefresh = () => refresh()

// 强制刷新（忽略缓存）
const handleForceRefresh = () => refresh({ dedupe: false })

// 清除缓存并刷新
const handleClearAndRefresh = async () => {
  clearNuxtData('posts')
  await refresh()
}

// 刷新所有数据
const refreshAll = () => refreshNuxtData()
</script>
```

## 路由系统

Nuxt 基于文件系统自动生成路由，pages 目录下的文件结构直接映射为 URL 路径。

### 文件路由约定

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
│   └── [...slug].vue      → /posts/* (捕获所有)
├── [[optional]].vue       → /:optional? (可选参数)
└── admin/
    └── [[...slug]].vue    → /admin/* (可选捕获所有)
```

### 动态路由参数

```vue
<script setup lang="ts">
// pages/posts/[id].vue
const route = useRoute()

// 获取路由参数
const postId = route.params.id

// 使用参数获取数据
const { data: post } = await useFetch(`/api/posts/${postId}`)

// 监听参数变化
watch(() => route.params.id, async (newId) => {
  // 处理参数变化
})
</script>
```

### 嵌套路由

```
pages/
├── users/
│   ├── index.vue          → /users (列表页)
│   └── [id]/
│       ├── index.vue      → /users/:id (详情页)
│       ├── edit.vue       → /users/:id/edit
│       └── settings.vue   → /users/:id/settings
```

```vue
<!-- pages/users/[id].vue - 父级路由 -->
<script setup lang="ts">
const route = useRoute()
const { data: user } = await useFetch(`/api/users/${route.params.id}`)
</script>

<template>
  <div>
    <UserHeader :user="user" />
    <!-- 子路由渲染位置 -->
    <NuxtPage :user="user" />
  </div>
</template>
```

### 路由中间件

```typescript
// middleware/auth.ts - 命名中间件
export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    // 重定向到登录页
    return navigateTo('/login')
  }
})

// middleware/analytics.global.ts - 全局中间件
export default defineNuxtRouteMiddleware((to, from) => {
  // 每次路由变化时执行
  trackPageView(to.path)
})
```

```vue
<script setup lang="ts">
// 在页面中使用中间件
definePageMeta({
  middleware: ['auth'],
  // 或多个中间件
  middleware: ['auth', 'admin']
})
</script>
```

### 路由验证

```vue
<script setup lang="ts">
// pages/posts/[id].vue
definePageMeta({
  validate: async (route) => {
    // 验证 id 是否为数字
    return /^\d+$/.test(route.params.id as string)
  }
})
</script>
```

### 编程式导航

```vue
<script setup lang="ts">
const router = useRouter()

// 导航方法
const goToHome = () => navigateTo('/')

const goToUser = (id: number) => {
  navigateTo({
    path: `/users/${id}`,
    query: { tab: 'profile' }
  })
}

// 外部链接
const goToExternal = () => {
  navigateTo('https://nuxt.com', { external: true })
}

// 替换当前历史记录
const replaceRoute = () => {
  navigateTo('/new-page', { replace: true })
}

// 重定向（服务端可用）
const redirect = () => {
  navigateTo('/redirected', { redirectCode: 301 })
}
</script>

<template>
  <div>
    <!-- 声明式导航 -->
    <NuxtLink to="/">首页</NuxtLink>
    <NuxtLink :to="{ name: 'users-id', params: { id: 1 } }">
      用户详情
    </NuxtLink>

    <!-- 预取优化 -->
    <NuxtLink to="/about" prefetch>关于我们</NuxtLink>
    <NuxtLink to="/heavy-page" :prefetch="false">重页面</NuxtLink>
  </div>
</template>
```

## 状态管理

Nuxt 3 提供了内置的 `useState` composable，并完美支持 Pinia 集成。

### useState - 内置状态管理

```typescript
// composables/useCounter.ts
export const useCounter = () => {
  // useState 创建 SSR 友好的响应式状态
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
// 在任何组件中使用
const { count, increment, decrement } = useCounter()
</script>

<template>
  <div>
    <p>计数: {{ count }}</p>
    <button @click="decrement">-</button>
    <button @click="increment">+</button>
  </div>
</template>
```

### 共享状态

```typescript
// composables/useUser.ts
export const useUser = () => {
  // 使用相同的 key 在多个组件间共享状态
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

### Pinia 集成

```bash
# 安装 Pinia
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
// stores/cart.ts - Composition API 风格
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
// 在组件中使用 Pinia store
const cart = useCartStore()

// SSR 友好的数据获取
await callOnce(async () => {
  // 初始化购物车数据
  const savedCart = await $fetch('/api/cart')
  cart.items = savedCart.items
})
</script>

<template>
  <div class="cart">
    <h2>购物车 ({{ cart.totalItems }})</h2>
    <ul>
      <li v-for="item in cart.items" :key="item.id">
        {{ item.name }} x {{ item.quantity }} -
        ¥{{ (item.price * item.quantity).toFixed(2) }}
      </li>
    </ul>
    <p>总计: ¥{{ cart.totalPrice.toFixed(2) }}</p>
    <button @click="cart.checkout" :disabled="cart.loading || cart.isEmpty">
      {{ cart.loading ? '处理中...' : '结账' }}
    </button>
  </div>
</template>
```

## 模块系统

Nuxt 的模块系统允许扩展框架功能，社区提供了丰富的模块生态。

### 常用模块

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    // UI 组件库
    '@nuxt/ui',

    // 图片优化
    '@nuxt/image',

    // 内容管理
    '@nuxt/content',

    // 字体优化
    '@nuxt/fonts',

    // SEO 优化
    '@nuxtjs/seo',

    // 状态管理
    '@pinia/nuxt',

    // 国际化
    '@nuxtjs/i18n',

    // 颜色模式
    '@nuxtjs/color-mode',

    // PWA 支持
    '@vite-pwa/nuxt'
  ]
})
```

### @nuxt/image 配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/image'],

  image: {
    // 图片优化提供商
    provider: 'ipx',

    // 预设尺寸
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280
    },

    // 图片格式
    format: ['webp', 'avif'],

    // 质量设置
    quality: 80
  }
})
```

```vue
<template>
  <!-- 优化后的图片组件 -->
  <NuxtImg
    src="/hero.jpg"
    width="800"
    height="400"
    sizes="sm:100vw md:50vw lg:400px"
    placeholder
    loading="lazy"
  />

  <!-- 响应式图片 -->
  <NuxtPicture
    src="/product.jpg"
    sizes="xs:100vw sm:50vw md:400px"
    :imgAttrs="{ class: 'rounded-lg' }"
  />
</template>
```

### @nuxt/content 配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/content'],

  content: {
    // Markdown 配置
    markdown: {
      toc: { depth: 3 },
      remarkPlugins: ['remark-emoji'],
      rehypePlugins: ['rehype-slug']
    },

    // 高亮主题
    highlight: {
      theme: {
        default: 'github-light',
        dark: 'github-dark'
      }
    }
  }
})
```

```vue
<script setup lang="ts">
// pages/blog/[...slug].vue
const route = useRoute()
const { data: article } = await useAsyncData(
  `blog-${route.path}`,
  () => queryContent(route.path).findOne()
)
</script>

<template>
  <article>
    <h1>{{ article.title }}</h1>
    <ContentRenderer :value="article" />
  </article>
</template>
```

### 创建自定义模块

```typescript
// modules/analytics/index.ts
import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'

export interface ModuleOptions {
  trackingId: string
  debug?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'my-analytics',
    configKey: 'analytics'
  },

  defaults: {
    debug: false
  },

  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    // 添加运行时配置
    nuxt.options.runtimeConfig.public.analytics = options

    // 添加插件
    addPlugin(resolve('./runtime/plugin'))

    // 添加 composable
    nuxt.hook('imports:dirs', (dirs) => {
      dirs.push(resolve('./runtime/composables'))
    })
  }
})
```

```typescript
// modules/analytics/runtime/plugin.ts
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const { trackingId, debug } = config.public.analytics

  if (debug) {
    console.log('Analytics initialized with ID:', trackingId)
  }

  // 初始化分析服务
  return {
    provide: {
      analytics: {
        track: (event: string, data?: object) => {
          if (debug) console.log('Track:', event, data)
          // 发送到分析服务
        }
      }
    }
  }
})
```

## 部署选项

Nuxt 3 的 Nitro 引擎支持多种部署目标。

### Node.js 服务器部署

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'node-server'
  }
})
```

```bash
# 构建
npm run build

# 运行
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

### Edge 部署

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

### 静态生成

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // 完全静态生成
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
# 生成静态站点
npm run generate

# 预览
npx serve .output/public
```

### 混合部署策略

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // 静态页面
    '/': { prerender: true },
    '/about': { prerender: true },
    '/blog/**': { prerender: true },

    // 动态 API
    '/api/**': { cors: true },

    // 客户端渲染
    '/admin/**': { ssr: false },

    // ISR
    '/products/**': { isr: 3600 }
  }
})
```

## 实战案例

### 电商产品列表页

```vue
<script setup lang="ts">
// pages/products/index.vue
interface Product {
  id: number
  name: string
  price: number
  image: string
  category: string
}

interface ProductsResponse {
  data: Product[]
  total: number
  page: number
  pageSize: number
}

// 路由查询参数
const route = useRoute()
const router = useRouter()

// 筛选状态
const filters = reactive({
  category: route.query.category as string || '',
  minPrice: Number(route.query.minPrice) || 0,
  maxPrice: Number(route.query.maxPrice) || 10000,
  page: Number(route.query.page) || 1
})

// 监听筛选变化更新 URL
watch(filters, (newFilters) => {
  router.push({
    query: {
      ...newFilters,
      page: newFilters.page.toString()
    }
  })
}, { deep: true })

// 获取产品数据
const { data: products, pending, refresh } = await useFetch<ProductsResponse>(
  '/api/products',
  {
    query: filters,
    watch: [filters]
  }
)

// 分类列表
const { data: categories } = await useFetch<string[]>('/api/categories')

// SEO
useHead({
  title: '产品列表',
  meta: [
    { name: 'description', content: '浏览我们的优质产品' }
  ]
})

// 分页
const totalPages = computed(() =>
  Math.ceil((products.value?.total || 0) / 12)
)
</script>

<template>
  <div class="products-page">
    <!-- 筛选栏 -->
    <aside class="filters">
      <h3>筛选</h3>

      <div class="filter-group">
        <label>分类</label>
        <select v-model="filters.category">
          <option value="">全部</option>
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>价格范围</label>
        <input type="number" v-model.number="filters.minPrice" placeholder="最低" />
        <input type="number" v-model.number="filters.maxPrice" placeholder="最高" />
      </div>
    </aside>

    <!-- 产品列表 -->
    <main class="products-grid">
      <div v-if="pending" class="loading">
        <ProductSkeleton v-for="i in 12" :key="i" />
      </div>

      <template v-else-if="products?.data.length">
        <ProductCard
          v-for="product in products.data"
          :key="product.id"
          :product="product"
        />
      </template>

      <div v-else class="empty">
        暂无符合条件的产品
      </div>

      <!-- 分页 -->
      <Pagination
        v-if="totalPages > 1"
        :current="filters.page"
        :total="totalPages"
        @change="filters.page = $event"
      />
    </main>
  </div>
</template>
```

### 服务端 API 路由

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
  // 验证查询参数
  const query = await getValidatedQuery(event, querySchema.parse)

  // 构建查询条件
  const where: any = {
    price: {
      gte: query.minPrice,
      lte: query.maxPrice
    }
  }

  if (query.category) {
    where.category = query.category
  }

  // 使用 Prisma 查询数据库
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
      message: '无效的产品 ID'
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
      message: '产品不存在'
    })
  }

  return product
})
```

### 认证中间件

```typescript
// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  // 仅保护 /api/admin 路由
  if (!event.path.startsWith('/api/admin')) {
    return
  }

  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')

  if (!token) {
    throw createError({
      statusCode: 401,
      message: '未授权访问'
    })
  }

  try {
    const payload = await verifyToken(token)
    event.context.user = payload
  } catch {
    throw createError({
      statusCode: 401,
      message: 'Token 无效或已过期'
    })
  }
})
```

## 面试要点

### 基础概念题

**Q1: Nuxt 3 相比 Nuxt 2 有哪些主要改进？**

```
核心改进：
1. 基于 Vue 3 和 Composition API
2. 使用 Vite 作为默认构建工具，开发体验更快
3. Nitro 服务器引擎，支持多平台部署
4. 原生 TypeScript 支持
5. 更强大的自动导入机制
6. 混合渲染支持（SSR、SSG、CSR、ISR 可按路由配置）
7. 更小的打包体积
```

**Q2: useFetch 和 useAsyncData 的区别？**

```typescript
// useFetch - 便捷封装，适合简单请求
const { data } = await useFetch('/api/users')

// useAsyncData - 更灵活，适合复杂场景
const { data } = await useAsyncData('users', async () => {
  // 可以执行任意异步逻辑
  const users = await $fetch('/api/users')
  const roles = await $fetch('/api/roles')
  return { users, roles }
})

// 区别总结：
// 1. useFetch 是 useAsyncData + $fetch 的语法糖
// 2. useAsyncData 可以执行任意异步操作
// 3. useFetch 自动根据 URL 生成 key
// 4. useAsyncData 需要手动指定 key
```

**Q3: Nuxt 的渲染模式有哪些？如何选择？**

```typescript
// 1. SSR (服务端渲染) - 默认模式
// 适用：SEO 要求高、首屏性能要求高
export default defineNuxtConfig({
  ssr: true
})

// 2. SPA (客户端渲染)
// 适用：管理后台、无 SEO 需求
export default defineNuxtConfig({
  ssr: false
})

// 3. SSG (静态生成)
// 适用：内容不常变化的站点
export default defineNuxtConfig({
  nitro: { preset: 'static' }
})

// 4. 混合模式 - 按路由配置
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },        // 预渲染
    '/blog/**': { isr: 3600 },       // ISR
    '/admin/**': { ssr: false }      // 客户端渲染
  }
})
```

### 进阶实践题

**Q4: 如何在 Nuxt 中实现全局状态管理？**

```typescript
// 方案1：useState（简单场景）
export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const isLoggedIn = computed(() => !!user.value)

  return { user, isLoggedIn }
}

// 方案2：Pinia（复杂场景）
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

**Q5: Nuxt 中如何处理 SEO？**

```vue
<script setup lang="ts">
// 页面级 SEO
useHead({
  title: '产品详情 - 我的商店',
  meta: [
    { name: 'description', content: '优质产品描述' },
    { property: 'og:title', content: '产品详情' },
    { property: 'og:image', content: '/og-image.png' }
  ],
  link: [
    { rel: 'canonical', href: 'https://example.com/products/1' }
  ]
})

// 动态 SEO
const { data: product } = await useFetch('/api/products/1')

useHead({
  title: () => product.value?.name,
  meta: [
    { name: 'description', content: () => product.value?.description }
  ]
})

// 使用 useSeoMeta
useSeoMeta({
  title: '页面标题',
  description: '页面描述',
  ogTitle: 'OG 标题',
  ogDescription: 'OG 描述',
  ogImage: 'https://example.com/image.png',
  twitterCard: 'summary_large_image'
})
</script>
```

**Q6: 如何优化 Nuxt 应用性能？**

```typescript
// 1. 路由级代码分割（自动）
// pages 目录下的每个页面自动代码分割

// 2. 组件懒加载
const HeavyChart = defineAsyncComponent(() =>
  import('~/components/HeavyChart.vue')
)

// 3. 图片优化
// 使用 @nuxt/image 模块

// 4. 数据获取优化
const { data } = await useFetch('/api/data', {
  // 使用缓存
  getCachedData: (key) => useNuxtApp().payload.data[key],
  // 懒加载非关键数据
  lazy: true
})

// 5. 预渲染关键页面
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/about': { prerender: true }
  }
})

// 6. 使用 Payload 提取
export default defineNuxtConfig({
  experimental: {
    payloadExtraction: true
  }
})
```

### 架构设计题

**Q7: 设计一个 Nuxt 全栈应用的目录结构**

```
my-app/
├── app/
│   ├── components/
│   │   ├── common/          # 通用组件
│   │   ├── layout/          # 布局组件
│   │   └── features/        # 功能组件
│   ├── composables/
│   │   ├── useAuth.ts
│   │   └── useApi.ts
│   ├── layouts/
│   │   ├── default.vue
│   │   └── admin.vue
│   ├── middleware/
│   │   └── auth.ts
│   ├── pages/
│   │   ├── index.vue
│   │   ├── auth/
│   │   └── admin/
│   └── plugins/
│       └── api.ts
├── server/
│   ├── api/
│   │   ├── auth/
│   │   └── products/
│   ├── middleware/
│   │   └── auth.ts
│   ├── utils/
│   │   └── db.ts
│   └── plugins/
│       └── prisma.ts
├── stores/                   # Pinia stores
├── types/                    # TypeScript 类型
├── prisma/                   # 数据库 schema
└── nuxt.config.ts
```

## 总结

Nuxt.js 是一个功能强大的 Vue 全栈框架，它通过约定优于配置的理念，极大地简化了现代 Web 应用的开发过程。本文介绍的核心内容包括：

1. **Nuxt 3 新特性**：Nitro 引擎、自动导入、TypeScript 支持
2. **目录结构**：约定式目录布局，自动路由生成
3. **渲染模式**：SSR、SSG、SPA、混合渲染灵活选择
4. **数据获取**：useFetch、useAsyncData 实现 SSR 友好的数据获取
5. **路由系统**：文件系统路由、动态路由、中间件
6. **状态管理**：useState 内置方案与 Pinia 集成
7. **模块生态**：丰富的官方和社区模块
8. **部署选项**：Node.js、Edge、静态站点多种部署方式

掌握这些核心概念和最佳实践，将帮助你构建高性能、可维护的现代 Web 应用。
