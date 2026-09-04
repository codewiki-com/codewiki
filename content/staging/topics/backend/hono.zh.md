---
title: Hono Web 框架
description: Hono 全面指南 - 专为 Edge 设计的超快 Web 框架
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Hono
  - Edge
  - Cloudflare Workers
  - Bun
  - Deno
  - TypeScript
status: imported
origin: old/src/content/docs/backend/hono.zh.md
divergence: 0.216
issues: []
legacy:
  category: Backend
  subcategory: Web Frameworks
  order: 31
  lastUpdated: 2026-01-20
---

Hono 是一个小巧、简单且超快的 Web 框架，完全基于 Web 标准构建。与传统的 Node.js 框架不同，Hono 从设计之初就支持在任何 JavaScript 运行时上运行——Cloudflare Workers、Deno、Bun、Vercel、Netlify、AWS Lambda 和 Node.js。"Hono"在日语中意为"火焰"，代表着它极快的性能和轻量级的特性。

## 为什么选择 Hono？

### 传统框架的问题

Express.js 等传统 Web 框架主要为 Node.js 构建，严重依赖 Node 特定的 API。这带来了几个挑战：

1. **运行时锁定**：为 Express 编写的代码无法在 Deno、Bun 或边缘运行时上运行，除非进行重大修改
2. **性能开销**：许多框架带有影响性能的历史包袱
3. **边缘不兼容**：边缘计算平台使用 Web 标准 API，而不是 Node.js API

### Hono 如何解决这些问题

Hono 通过以下方式解决这些挑战：

- **仅使用 Web 标准**：Hono 完全依赖标准 Web API（Request、Response、fetch 等），确保跨所有现代 JavaScript 运行时的可移植性
- **超快路由**：RegExpRouter 可以使用单个正则表达式匹配路由，实现无与伦比的速度
- **零依赖**：核心框架没有外部依赖，保持最小的包体积
- **TypeScript 优先**：从第一天起就使用 TypeScript 构建，提供出色的类型安全和开发体验

### Hono vs Express vs Fastify

| 特性 | Hono | Express | Fastify |
|-----|------|---------|---------|
| 运行时支持 | 所有 JS 运行时 | 仅 Node.js | 仅 Node.js |
| 包大小 | ~14KB | ~200KB | ~450KB |
| TypeScript | 原生支持 | 通过 @types | 内置 |
| Web 标准 | 是 | 否 | 否 |
| 边缘计算 | 原生支持 | 需要适配器 | 有限 |
| 性能 | 最快 | 最慢 | 快 |

## 核心架构

### Web 标准基础

Hono 完全基于 Web 标准 API 构建，这些 API 现在被所有现代 JavaScript 运行时支持：

```typescript
// Hono 使用标准的 Request 和 Response 对象
import { Hono } from 'hono'

const app = new Hono()

// 处理函数通过 Context 接收标准 Request
// 并返回标准 Response
app.get('/', (c) => {
  // c.req 包装了标准 Request
  // c.json() 返回标准 Response
  return c.json({ message: 'Hello, Hono!' })
})

export default app
```

### 路由架构

Hono 包含多个路由器实现，每个都针对不同场景进行了优化：

**RegExpRouter**：JavaScript 生态系统中最快的路由器。它在启动时将所有路由编译成单个正则表达式，无论路由数量多少都能实现 O(1) 路由匹配。

**TrieRouter**：使用 Trie（前缀树）数据结构进行路由匹配。提供良好的性能，支持包括通配符和参数在内的所有路由模式。

**LinearRouter**：以最小的开销即时注册路由。非常适合每次请求都初始化应用程序的无服务器环境。

**SmartRouter**：根据您的路由模式自动选择最佳路由器。这是 Hono 中的默认路由器。

```typescript
// SmartRouter 配置（Hono 默认）
import { Hono } from 'hono'
import { RegExpRouter } from 'hono/router/reg-exp-router'
import { TrieRouter } from 'hono/router/trie-router'
import { SmartRouter } from 'hono/router/smart-router'

const app = new Hono({
  router: new SmartRouter({
    routers: [new RegExpRouter(), new TrieRouter()],
  }),
})
```

### 中间件系统

Hono 的中间件系统遵循洋葱模型，类似于 Koa。每个中间件可以在链中的下一个中间件之前和之后执行代码：

```typescript
import { Hono } from 'hono'

const app = new Hono()

// 中间件执行流程（洋葱模型）
app.use(async (c, next) => {
  console.log('1. 之前 - 第一个中间件')
  await next()
  console.log('6. 之后 - 第一个中间件')
})

app.use(async (c, next) => {
  console.log('2. 之前 - 第二个中间件')
  await next()
  console.log('5. 之后 - 第二个中间件')
})

app.get('/', (c) => {
  console.log('3. 处理函数')
  return c.text('4. 响应')
})

// 输出顺序：1 -> 2 -> 3 -> 4 -> 5 -> 6
```

## 核心概念

### Context 对象

Context 对象（`c`）是每个 Hono 处理函数的核心。它提供对请求数据的访问和构建响应的方法：

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/users/:id', async (c) => {
  // 请求信息
  const id = c.req.param('id')           // 路径参数
  const page = c.req.query('page')       // 查询参数
  const userAgent = c.req.header('User-Agent')  // 请求头

  // 请求体（用于 POST/PUT/PATCH）
  // const body = await c.req.json()     // JSON 请求体
  // const form = await c.req.parseBody() // 表单数据

  // 设置响应头
  c.header('X-Request-ID', crypto.randomUUID())

  // 设置状态码
  c.status(200)

  // 返回响应
  return c.json({
    id,
    page,
    userAgent,
  })
})
```

### 响应方法

Hono 为不同的响应类型提供了便捷方法：

```typescript
import { Hono } from 'hono'

const app = new Hono()

// JSON 响应 - 设置 Content-Type: application/json
app.get('/api/data', (c) => {
  return c.json({ status: 'ok', data: [1, 2, 3] })
})

// 文本响应 - 设置 Content-Type: text/plain
app.get('/text', (c) => {
  return c.text('Hello, World!')
})

// HTML 响应 - 设置 Content-Type: text/html
app.get('/page', (c) => {
  return c.html('<h1>欢迎使用 Hono</h1>')
})

// 重定向响应
app.get('/old-path', (c) => {
  return c.redirect('/new-path', 301)
})

// Not Found 响应
app.get('/maybe', (c) => {
  const found = false
  if (!found) {
    return c.notFound()
  }
  return c.json({ data: 'found' })
})

// 自定义响应体、状态码和头部
app.get('/custom', (c) => {
  return c.body('自定义响应', 201, {
    'X-Custom-Header': 'value',
  })
})
```

### 路由

Hono 支持所有 HTTP 方法和灵活的路由模式：

```typescript
import { Hono } from 'hono'

const app = new Hono()

// HTTP 方法
app.get('/users', (c) => c.text('获取用户列表'))
app.post('/users', (c) => c.text('创建用户'))
app.put('/users/:id', (c) => c.text('更新用户'))
app.patch('/users/:id', (c) => c.text('部分更新'))
app.delete('/users/:id', (c) => c.text('删除用户'))

// 处理所有 HTTP 方法
app.all('/webhook', (c) => c.text('收到 Webhook'))

// 路径参数
app.get('/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ userId: id })
})

// 多个路径参数
app.get('/posts/:postId/comments/:commentId', (c) => {
  const { postId, commentId } = c.req.param()
  return c.json({ postId, commentId })
})

// 可选参数
app.get('/files/:filename?', (c) => {
  const filename = c.req.param('filename') || 'index.html'
  return c.text(`正在提供: ${filename}`)
})

// 通配符路由
app.get('/static/*', (c) => {
  return c.text('静态文件处理器')
})

// 正则表达式约束
app.get('/posts/:id{[0-9]+}', (c) => {
  const id = c.req.param('id')  // 保证是数字
  return c.json({ id: parseInt(id) })
})

// 同一路径的多个方法
app.on(['GET', 'POST'], '/data', (c) => {
  return c.text(`方法: ${c.req.method}`)
})

// 同一处理函数的多个路径
app.on('GET', ['/hello', '/hi', '/hey'], (c) => {
  return c.text('你好！')
})
```

### 路由分组

使用独立的 Hono 实例组织路由：

```typescript
import { Hono } from 'hono'

// 创建路由组
const users = new Hono()
users.get('/', (c) => c.json({ users: [] }))
users.get('/:id', (c) => c.json({ id: c.req.param('id') }))
users.post('/', (c) => c.json({ message: '已创建' }, 201))

const posts = new Hono()
posts.get('/', (c) => c.json({ posts: [] }))
posts.get('/:id', (c) => c.json({ id: c.req.param('id') }))

// 挂载路由组
const app = new Hono()
app.route('/users', users)
app.route('/posts', posts)

// 可用路由：
// GET /users
// GET /users/:id
// POST /users
// GET /posts
// GET /posts/:id

export default app
```

### 中间件

Hono 包含许多内置中间件并支持自定义中间件：

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { compress } from 'hono/compress'
import { basicAuth } from 'hono/basic-auth'
import { bearerAuth } from 'hono/bearer-auth'
import { jwt } from 'hono/jwt'
import { secureHeaders } from 'hono/secure-headers'
import { timing } from 'hono/timing'

const app = new Hono()

// 全局应用中间件
app.use(logger())
app.use(compress())
app.use(secureHeaders())
app.use(timing())

// CORS 配置
app.use('/api/*', cors({
  origin: ['https://example.com', 'https://app.example.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-Total-Count'],
  maxAge: 3600,
  credentials: true,
}))

// 管理路由的基本认证
app.use('/admin/*', basicAuth({
  username: 'admin',
  password: process.env.ADMIN_PASSWORD || 'secret',
}))

// Bearer 令牌认证
app.use('/api/v1/*', bearerAuth({
  token: process.env.API_TOKEN || 'my-token',
}))

// JWT 认证
app.use('/api/v2/*', jwt({
  secret: process.env.JWT_SECRET || 'my-secret',
}))

// 在处理函数中访问 JWT 载荷
app.get('/api/v2/me', (c) => {
  const payload = c.get('jwtPayload')
  return c.json({ user: payload.sub })
})
```

### 自定义中间件

为特定需求创建自定义中间件：

```typescript
import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'

const app = new Hono()

// 简单的计时中间件
const requestTimer: MiddlewareHandler = async (c, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  c.header('X-Response-Time', `${duration}ms`)
}

// 速率限制中间件
const createRateLimiter = (limit: number, window: number): MiddlewareHandler => {
  const requests = new Map<string, number[]>()

  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') ||
               c.req.header('X-Forwarded-For') ||
               'unknown'

    const now = Date.now()
    const windowStart = now - window

    // 获取当前窗口内的请求
    const ipRequests = requests.get(ip) || []
    const recentRequests = ipRequests.filter(time => time > windowStart)

    if (recentRequests.length >= limit) {
      return c.json({ error: '请求过多' }, 429)
    }

    recentRequests.push(now)
    requests.set(ip, recentRequests)

    await next()
  }
}

// 错误处理中间件
const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next()
  } catch (err) {
    console.error('错误:', err)
    return c.json({
      error: err instanceof Error ? err.message : '内部服务器错误',
    }, 500)
  }
}

// 应用中间件
app.use(errorHandler)
app.use(requestTimer)
app.use('/api/*', createRateLimiter(100, 60000))  // 每分钟 100 个请求

app.get('/api/data', (c) => {
  return c.json({ data: 'Hello!' })
})

export default app
```

### 使用 Zod 进行验证

Hono 与 Zod 无缝集成进行请求验证：

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

// 定义验证模式
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  age: z.number().min(18).optional(),
})

const querySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().max(100).default(10),
  sort: z.enum(['asc', 'desc']).optional(),
})

const paramSchema = z.object({
  id: z.string().uuid(),
})

// JSON 请求体验证
app.post(
  '/users',
  zValidator('json', createUserSchema),
  (c) => {
    const { email, name, age } = c.req.valid('json')
    return c.json({
      message: '用户已创建',
      user: { email, name, age: age ?? null },
    }, 201)
  }
)

// 查询参数验证
app.get(
  '/users',
  zValidator('query', querySchema),
  (c) => {
    const { page, limit, sort } = c.req.valid('query')
    return c.json({
      page,
      limit,
      sort: sort ?? 'asc',
      users: [],
    })
  }
)

// 路径参数验证
app.get(
  '/users/:id',
  zValidator('param', paramSchema),
  (c) => {
    const { id } = c.req.valid('param')
    return c.json({ id })
  }
)

// 多个验证器
app.put(
  '/users/:id',
  zValidator('param', paramSchema),
  zValidator('json', createUserSchema.partial()),
  (c) => {
    const { id } = c.req.valid('param')
    const updates = c.req.valid('json')
    return c.json({ id, ...updates })
  }
)

// 自定义错误处理
app.post(
  '/posts',
  zValidator(
    'json',
    z.object({ title: z.string(), body: z.string() }),
    (result, c) => {
      if (!result.success) {
        return c.json({
          error: '验证失败',
          details: result.error.flatten(),
        }, 400)
      }
    }
  ),
  (c) => {
    const data = c.req.valid('json')
    return c.json({ post: data }, 201)
  }
)

export default app
```

### 类型安全的 RPC

Hono 的 RPC 功能实现了服务端和客户端之间的端到端类型安全：

```typescript
// ========== server.ts ==========
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

const route = app
  .get('/api/users', (c) => {
    return c.json({
      users: [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ],
    })
  })
  .post(
    '/api/users',
    zValidator('json', z.object({
      name: z.string(),
      email: z.string().email(),
    })),
    (c) => {
      const { name, email } = c.req.valid('json')
      return c.json({
        user: { id: crypto.randomUUID(), name, email },
      }, 201)
    }
  )
  .get('/api/users/:id', (c) => {
    const id = c.req.param('id')
    return c.json({ user: { id, name: 'Alice' } })
  })

// 导出类型供客户端使用
export type AppType = typeof route
export default app
```

```typescript
// ========== client.ts ==========
import { hc } from 'hono/client'
import type { InferRequestType, InferResponseType } from 'hono/client'
import type { AppType } from './server'

// 创建类型化客户端
const client = hc<AppType>('http://localhost:8787')

// GET 请求 - 完全类型化
async function getUsers() {
  const res = await client.api.users.$get()
  if (res.ok) {
    const data = await res.json()  // { users: { id: string, name: string }[] }
    console.log(data.users)
  }
}

// POST 请求，带类型化的请求体
async function createUser() {
  const res = await client.api.users.$post({
    json: {
      name: 'Charlie',
      email: 'charlie@example.com',
    },
  })

  if (res.status === 201) {
    const data = await res.json()  // { user: { id: string, name: string, email: string } }
    console.log(data.user.id)
  }
}

// 带路径参数的 GET 请求
async function getUser(id: string) {
  const res = await client.api.users[':id'].$get({
    param: { id },
  })

  if (res.ok) {
    const data = await res.json()  // { user: { id: string, name: string } }
    return data.user
  }
}

// 类型推断辅助
type CreateUserRequest = InferRequestType<typeof client.api.users.$post>
type CreateUserResponse = InferResponseType<typeof client.api.users.$post>

// 获取 URL 对象而不发起请求
const url = client.api.users[':id'].$url({ param: { id: '123' } })
console.log(url.pathname)  // /api/users/123
```

## 代码示例

### 基本 REST API

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

// 内存数据库
interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

let todos: Todo[] = []

// 中间件
app.use(logger())
app.use('/api/*', cors())

// 获取待办事项列表
app.get('/api/todos', (c) => {
  const completed = c.req.query('completed')

  let filtered = todos
  if (completed !== undefined) {
    filtered = todos.filter(t => t.completed === (completed === 'true'))
  }

  return c.json({ todos: filtered })
})

// 获取单个待办事项
app.get('/api/todos/:id', (c) => {
  const id = c.req.param('id')
  const todo = todos.find(t => t.id === id)

  if (!todo) {
    return c.json({ error: '待办事项未找到' }, 404)
  }

  return c.json({ todo })
})

// 创建待办事项
app.post('/api/todos', async (c) => {
  const body = await c.req.json<{ title: string }>()

  if (!body.title || body.title.trim() === '') {
    return c.json({ error: '标题是必需的' }, 400)
  }

  const todo: Todo = {
    id: crypto.randomUUID(),
    title: body.title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  }

  todos.push(todo)

  return c.json({ todo }, 201)
})

// 更新待办事项
app.patch('/api/todos/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<Partial<Pick<Todo, 'title' | 'completed'>>>()

  const index = todos.findIndex(t => t.id === id)
  if (index === -1) {
    return c.json({ error: '待办事项未找到' }, 404)
  }

  todos[index] = {
    ...todos[index],
    ...body,
  }

  return c.json({ todo: todos[index] })
})

// 删除待办事项
app.delete('/api/todos/:id', (c) => {
  const id = c.req.param('id')
  const index = todos.findIndex(t => t.id === id)

  if (index === -1) {
    return c.json({ error: '待办事项未找到' }, 404)
  }

  todos.splice(index, 1)

  return c.json({ message: '已删除' })
})

export default app
```

### Cloudflare Workers 与 D1 数据库

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'

// 为 Cloudflare Workers 定义绑定类型
type Bindings = {
  DB: D1Database
  API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// 使用环境变量的认证中间件
app.use('/api/*', async (c, next) => {
  const apiKey = c.req.header('X-API-Key')
  if (apiKey !== c.env.API_KEY) {
    return c.json({ error: '未授权' }, 401)
  }
  await next()
})

// 从 D1 获取用户列表
app.get('/api/users', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC'
  ).all()

  return c.json({ users: results })
})

// 按 ID 获取用户
app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id')

  const user = await c.env.DB.prepare(
    'SELECT id, name, email, created_at FROM users WHERE id = ?'
  ).bind(id).first()

  if (!user) {
    return c.json({ error: '用户未找到' }, 404)
  }

  return c.json({ user })
})

// 创建用户
app.post('/api/users', async (c) => {
  const { name, email } = await c.req.json<{ name: string; email: string }>()

  const id = crypto.randomUUID()

  await c.env.DB.prepare(
    'INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, datetime("now"))'
  ).bind(id, name, email).run()

  return c.json({ user: { id, name, email } }, 201)
})

// 删除用户
app.delete('/api/users/:id', async (c) => {
  const id = c.req.param('id')

  const result = await c.env.DB.prepare(
    'DELETE FROM users WHERE id = ?'
  ).bind(id).run()

  if (result.meta.changes === 0) {
    return c.json({ error: '用户未找到' }, 404)
  }

  return c.json({ message: '已删除' })
})

export default app
```

### 使用 R2 存储的文件上传

```typescript
import { Hono } from 'hono'

type Bindings = {
  BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// 上传文件
app.post('/upload', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return c.json({ error: '未提供文件' }, 400)
  }

  // 生成唯一文件名
  const ext = file.name.split('.').pop()
  const key = `${crypto.randomUUID()}.${ext}`

  // 上传到 R2
  await c.env.BUCKET.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  })

  return c.json({
    message: '已上传',
    key,
    size: file.size,
    type: file.type,
  }, 201)
})

// 下载文件
app.get('/files/:key', async (c) => {
  const key = c.req.param('key')

  const object = await c.env.BUCKET.get(key)

  if (!object) {
    return c.json({ error: '文件未找到' }, 404)
  }

  const headers = new Headers()
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
  headers.set('Content-Length', object.size.toString())

  return new Response(object.body, { headers })
})

// 删除文件
app.delete('/files/:key', async (c) => {
  const key = c.req.param('key')

  await c.env.BUCKET.delete(key)

  return c.json({ message: '已删除' })
})

export default app
```

### JSX 服务端渲染

```typescript
import { Hono } from 'hono'
import { jsxRenderer } from 'hono/jsx-renderer'

const app = new Hono()

// 布局组件
const Layout = ({ children, title }: { children: any; title: string }) => (
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 min-h-screen">
      <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 py-3">
          <a href="/" class="text-xl font-bold text-indigo-600">我的应用</a>
        </div>
      </nav>
      <main class="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </body>
  </html>
)

// 使用 JSX 渲染器中间件
app.use(
  '*',
  jsxRenderer(({ children }) => (
    <Layout title="Hono 应用">{children}</Layout>
  ))
)

// 首页
app.get('/', (c) => {
  return c.render(
    <div class="space-y-6">
      <h1 class="text-3xl font-bold">欢迎使用 Hono</h1>
      <p class="text-gray-600">
        一个小巧、简单且超快的 Web 框架。
      </p>
      <div class="flex gap-4">
        <a
          href="/about"
          class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          了解更多
        </a>
      </div>
    </div>
  )
})

// 关于页面
app.get('/about', (c) => {
  const features = [
    '超快性能',
    '多运行时支持',
    'TypeScript 优先',
    '基于 Web 标准',
  ]

  return c.render(
    <div class="space-y-6">
      <h1 class="text-3xl font-bold">关于 Hono</h1>
      <ul class="space-y-2">
        {features.map((feature) => (
          <li class="flex items-center gap-2">
            <span class="text-green-500">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
})

export default app
```

### 带 Suspense 的流式 SSR

```typescript
import { Hono } from 'hono'
import { Suspense, renderToReadableStream } from 'hono/jsx/streaming'

const app = new Hono()

// 获取数据的异步组件
const AsyncUserList = async () => {
  // 模拟 API 调用
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ]

  return (
    <ul class="space-y-2">
      {users.map((user) => (
        <li key={user.id} class="p-2 bg-white rounded shadow">
          {user.name}
        </li>
      ))}
    </ul>
  )
}

// 加载骨架屏
const LoadingSkeleton = () => (
  <div class="space-y-2">
    {[1, 2, 3].map((i) => (
      <div key={i} class="h-10 bg-gray-200 rounded animate-pulse" />
    ))}
  </div>
)

app.get('/', (c) => {
  const stream = renderToReadableStream(
    <html>
      <head>
        <title>流式 SSR</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="p-8 bg-gray-100">
        <h1 class="text-2xl font-bold mb-4">用户列表</h1>
        <Suspense fallback={<LoadingSkeleton />}>
          <AsyncUserList />
        </Suspense>
      </body>
    </html>
  )

  return c.body(stream, {
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Transfer-Encoding': 'chunked',
    },
  })
})

export default app
```

## 最佳实践

### 项目结构

为可维护性组织你的 Hono 应用程序：

```
src/
├── index.ts           # 入口点
├── routes/
│   ├── index.ts       # 路由聚合
│   ├── users.ts       # 用户路由
│   ├── posts.ts       # 文章路由
│   └── auth.ts        # 认证路由
├── middleware/
│   ├── auth.ts        # 认证中间件
│   ├── rateLimit.ts   # 速率限制
│   └── validate.ts    # 验证辅助
├── services/
│   ├── userService.ts # 业务逻辑
│   └── postService.ts
├── schemas/
│   ├── user.ts        # Zod 模式
│   └── post.ts
└── types/
    └── bindings.ts    # 环境绑定类型
```

```typescript
// src/routes/users.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createUserSchema, updateUserSchema } from '../schemas/user'
import { UserService } from '../services/userService'

const users = new Hono()

users.get('/', async (c) => {
  const users = await UserService.findAll()
  return c.json({ users })
})

users.post(
  '/',
  zValidator('json', createUserSchema),
  async (c) => {
    const data = c.req.valid('json')
    const user = await UserService.create(data)
    return c.json({ user }, 201)
  }
)

export default users
```

```typescript
// src/routes/index.ts
import { Hono } from 'hono'
import users from './users'
import posts from './posts'
import auth from './auth'

const routes = new Hono()

routes.route('/users', users)
routes.route('/posts', posts)
routes.route('/auth', auth)

export default routes
```

```typescript
// src/index.ts
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import routes from './routes'

const app = new Hono()

app.use(logger())
app.use('/api/*', cors())
app.route('/api', routes)

export default app
```

### 错误处理

实现一致的错误处理：

```typescript
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

// 自定义错误类
class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
  }
}

// 全局错误处理器
app.onError((err, c) => {
  console.error('错误:', err)

  if (err instanceof HTTPException) {
    return c.json({
      error: err.message,
      status: err.status,
    }, err.status)
  }

  if (err instanceof AppError) {
    return c.json({
      error: err.message,
      code: err.code,
      status: err.statusCode,
    }, err.statusCode)
  }

  // 未预期的错误
  return c.json({
    error: '内部服务器错误',
    status: 500,
  }, 500)
})

// 404 处理器
app.notFound((c) => {
  return c.json({
    error: '未找到',
    status: 404,
    path: c.req.path,
  }, 404)
})

// 在路由中的用法
app.get('/users/:id', async (c) => {
  const id = c.req.param('id')
  const user = await findUser(id)

  if (!user) {
    throw new AppError(404, '用户未找到', 'USER_NOT_FOUND')
  }

  return c.json({ user })
})

// 或使用 HTTPException
app.get('/admin', async (c) => {
  const isAdmin = false

  if (!isAdmin) {
    throw new HTTPException(403, { message: '禁止访问' })
  }

  return c.json({ admin: true })
})
```

### 使用绑定的类型安全

为环境变量和绑定定义类型：

```typescript
// src/types/bindings.ts
export type Bindings = {
  // 环境变量
  DATABASE_URL: string
  JWT_SECRET: string
  API_KEY: string

  // Cloudflare 绑定
  DB: D1Database
  KV: KVNamespace
  BUCKET: R2Bucket
  QUEUE: Queue
}

export type Variables = {
  user: {
    id: string
    email: string
  } | null
  requestId: string
}
```

```typescript
// src/index.ts
import { Hono } from 'hono'
import type { Bindings, Variables } from './types/bindings'

const app = new Hono<{
  Bindings: Bindings
  Variables: Variables
}>()

// 现在 c.env 和 c.get/c.set 完全类型化
app.use(async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  await next()
})

app.get('/config', (c) => {
  // c.env 是类型化的
  const dbUrl = c.env.DATABASE_URL
  const requestId = c.get('requestId')  // string

  return c.json({ configured: true, requestId })
})
```

## 常见陷阱

### 1. 忘记等待异步操作

```typescript
// 错误 - 在 DB 操作完成前发送响应
app.post('/users', (c) => {
  const data = c.req.json()  // 缺少 await！
  saveToDatabase(data)       // 缺少 await！
  return c.json({ success: true })
})

// 正确
app.post('/users', async (c) => {
  const data = await c.req.json()
  await saveToDatabase(data)
  return c.json({ success: true })
})
```

### 2. 中间件顺序很重要

```typescript
// 错误 - 认证检查前未应用 CORS
app.use('/api/*', authMiddleware)
app.use('/api/*', cors())  // 认证失败时不会发送 CORS 头

// 正确 - CORS 应该放在前面
app.use('/api/*', cors())
app.use('/api/*', authMiddleware)
```

### 3. 没有返回响应

```typescript
// 错误 - 没有 return 语句
app.get('/data', (c) => {
  c.json({ data: 'hello' })  // 缺少 return！
})

// 正确
app.get('/data', (c) => {
  return c.json({ data: 'hello' })
})
```

### 4. 在无服务器环境中修改共享状态

```typescript
// 错误 - 共享状态在无服务器环境中不工作
let counter = 0  // 每次冷启动都会重置！

app.post('/increment', (c) => {
  counter++
  return c.json({ counter })
})

// 正确 - 使用外部存储
app.post('/increment', async (c) => {
  const current = await c.env.KV.get('counter') || '0'
  const newValue = parseInt(current) + 1
  await c.env.KV.put('counter', newValue.toString())
  return c.json({ counter: newValue })
})
```

### 5. 阻塞事件循环

```typescript
// 错误 - CPU 密集型同步操作阻塞所有请求
app.get('/hash', (c) => {
  const result = heavyComputation()  // 阻塞数秒
  return c.json({ result })
})

// 更好 - 卸载到 worker 或分块处理
app.get('/hash', async (c) => {
  // 使用 Web Crypto API（非阻塞）
  const encoder = new TextEncoder()
  const data = encoder.encode('要哈希的数据')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return c.json({ hash })
})
```

### 6. 错误的 RPC 类型导出

```typescript
// 错误 - 丢失类型信息
const app = new Hono()
app.get('/api/users', (c) => c.json({ users: [] }))
app.post('/api/users', (c) => c.json({ user: {} }))
export type AppType = typeof app  // 路由不在类型中！

// 正确 - 链式调用路由以保留类型
const app = new Hono()
const routes = app
  .get('/api/users', (c) => c.json({ users: [] }))
  .post('/api/users', (c) => c.json({ user: {} }))
export type AppType = typeof routes
export default app
```

## 性能考量

### 为什么 Hono 如此快

1. **RegExpRouter**：将所有路由编译成单个正则表达式，实现 O(1) 匹配
2. **无运行时开销**：零依赖和最小抽象层
3. **Web 标准**：使用原生浏览器/运行时 API，无需 polyfill
4. **小包体积**：核心约 14KB gzipped，更快的冷启动
5. **无回调地狱**：全面使用现代 async/await

### 基准测试结果

Hono 在基准测试中始终优于其他框架：

| 框架 | 请求/秒 | 延迟（平均） |
|-----|--------|------------|
| Hono | 150,000+ | 0.2ms |
| Fastify | 65,000 | 0.5ms |
| Express | 15,000 | 2.0ms |

*结果因运行时和硬件而异。在 Cloudflare Workers 上测试。*

### 优化技巧

```typescript
import { Hono } from 'hono'
import { cache } from 'hono/cache'
import { compress } from 'hono/compress'

const app = new Hono()

// 1. 为大响应启用压缩
app.use(compress())

// 2. 缓存静态响应
app.get(
  '/api/config',
  cache({
    cacheName: 'my-app',
    cacheControl: 'max-age=3600',
  }),
  (c) => {
    return c.json({ version: '1.0.0', features: [] })
  }
)

// 3. 对大数据使用流式传输
app.get('/api/large-data', async (c) => {
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 1000; i++) {
        controller.enqueue(JSON.stringify({ item: i }) + '\n')
        // 允许其他任务运行
        await new Promise(r => setTimeout(r, 0))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  })
})

// 4. 避免在热路径上使用不必要的中间件
const heavyMiddleware = async (c: any, next: any) => {
  // 昂贵的操作...
  await next()
}

// 只在需要时应用
app.use('/admin/*', heavyMiddleware)
// 不要：app.use('*', heavyMiddleware)

// 5. 为你的环境使用适当的路由器
import { Hono } from 'hono/quick'  // 用于无服务器（LinearRouter）
// vs
import { Hono } from 'hono'        // 用于长期运行的服务器（RegExpRouter）
```

## 实战场景

### 边缘 API 网关

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { cache } from 'hono/cache'

type Bindings = {
  UPSTREAM_URL: string
  CACHE: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(cors())

// 在边缘缓存热门端点
app.get(
  '/api/products',
  cache({ cacheName: 'products', cacheControl: 'max-age=60' }),
  async (c) => {
    const res = await fetch(`${c.env.UPSTREAM_URL}/products`)
    const data = await res.json()
    return c.json(data)
  }
)

// 边缘速率限制
const rateLimit = new Map<string, number>()

app.use('/api/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown'
  const count = rateLimit.get(ip) || 0

  if (count > 100) {
    return c.json({ error: '速率受限' }, 429)
  }

  rateLimit.set(ip, count + 1)
  await next()
})

// 代理到上游
app.all('/api/*', async (c) => {
  const url = new URL(c.req.url)
  const upstream = `${c.env.UPSTREAM_URL}${url.pathname}${url.search}`

  const res = await fetch(upstream, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  })

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  })
})

export default app
```

### Webhook 处理器

```typescript
import { Hono } from 'hono'

type Bindings = {
  WEBHOOK_SECRET: string
  QUEUE: Queue
}

const app = new Hono<{ Bindings: Bindings }>()

// 验证 webhook 签名
const verifySignature = async (
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> => {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const signatureBytes = new Uint8Array(
    signature.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
  )

  return crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(payload)
  )
}

app.post('/webhooks/github', async (c) => {
  const signature = c.req.header('X-Hub-Signature-256')?.replace('sha256=', '')
  const payload = await c.req.text()

  if (!signature || !await verifySignature(payload, signature, c.env.WEBHOOK_SECRET)) {
    return c.json({ error: '无效签名' }, 401)
  }

  const event = c.req.header('X-GitHub-Event')
  const data = JSON.parse(payload)

  // 队列异步处理
  await c.env.QUEUE.send({
    type: 'github',
    event,
    data,
    receivedAt: new Date().toISOString(),
  })

  return c.json({ received: true })
})

app.post('/webhooks/stripe', async (c) => {
  const signature = c.req.header('Stripe-Signature')
  const payload = await c.req.text()

  // 验证 Stripe 签名（简化版）
  // 生产环境中使用 Stripe SDK

  const event = JSON.parse(payload)

  switch (event.type) {
    case 'payment_intent.succeeded':
      await c.env.QUEUE.send({
        type: 'stripe',
        event: 'payment_succeeded',
        data: event.data.object,
      })
      break
    case 'customer.subscription.deleted':
      await c.env.QUEUE.send({
        type: 'stripe',
        event: 'subscription_cancelled',
        data: event.data.object,
      })
      break
  }

  return c.json({ received: true })
})

export default app
```

### 多租户 API

```typescript
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

type Variables = {
  tenant: {
    id: string
    name: string
    plan: 'free' | 'pro' | 'enterprise'
  }
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// 提取并验证租户
app.use('/api/*', jwt({ secret: process.env.JWT_SECRET || '' }))

app.use('/api/*', async (c, next) => {
  const payload = c.get('jwtPayload')
  const tenantId = payload.tenantId

  const tenant = await c.env.DB.prepare(
    'SELECT id, name, plan FROM tenants WHERE id = ?'
  ).bind(tenantId).first()

  if (!tenant) {
    return c.json({ error: '租户未找到' }, 404)
  }

  c.set('tenant', tenant as Variables['tenant'])
  await next()
})

// 基于计划的速率限制
const planLimits = {
  free: 100,
  pro: 1000,
  enterprise: 10000,
}

app.use('/api/*', async (c, next) => {
  const tenant = c.get('tenant')
  const limit = planLimits[tenant.plan]

  // 从 KV/DB 检查速率限制
  // ...

  await next()
})

// 租户范围的数据访问
app.get('/api/data', async (c) => {
  const tenant = c.get('tenant')

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM data WHERE tenant_id = ?'
  ).bind(tenant.id).all()

  return c.json({ data: results })
})

export default app
```

## 测试

### 使用 Vitest 进行单元测试

```typescript
// app.ts
import { Hono } from 'hono'

export const app = new Hono()

app.get('/hello', (c) => c.json({ message: 'Hello!' }))
app.get('/hello/:name', (c) => {
  const name = c.req.param('name')
  return c.json({ message: `Hello, ${name}!` })
})
app.post('/users', async (c) => {
  const body = await c.req.json()
  return c.json({ user: body }, 201)
})
```

```typescript
// app.test.ts
import { describe, it, expect } from 'vitest'
import { app } from './app'

describe('API 测试', () => {
  it('GET /hello 返回问候语', async () => {
    const res = await app.request('/hello')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'Hello!' })
  })

  it('GET /hello/:name 返回个性化问候语', async () => {
    const res = await app.request('/hello/World')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'Hello, World!' })
  })

  it('POST /users 创建用户', async () => {
    const res = await app.request('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: 'alice@example.com' }),
    })

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      user: { name: 'Alice', email: 'alice@example.com' },
    })
  })
})
```

### 使用模拟绑定进行测试

```typescript
// app.test.ts
import { describe, it, expect, vi } from 'vitest'
import { app } from './app'

describe('Cloudflare Workers 测试', () => {
  const mockEnv = {
    DB: {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({
            results: [{ id: '1', name: 'Test' }],
          }),
          first: vi.fn().mockResolvedValue({ id: '1', name: 'Test' }),
        }),
      }),
    },
    API_KEY: 'test-key',
  }

  it('GET /users 从 DB 返回用户', async () => {
    const res = await app.request(
      '/users',
      { headers: { 'X-API-Key': 'test-key' } },
      mockEnv
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.users).toHaveLength(1)
  })

  it('拒绝无效的 API 密钥', async () => {
    const res = await app.request(
      '/users',
      { headers: { 'X-API-Key': 'wrong-key' } },
      mockEnv
    )

    expect(res.status).toBe(401)
  })
})
```

## 面试要点

### 基础问题

**问：什么是 Hono，它解决了什么问题？**

答：Hono 是一个小巧、超快的 Web 框架，完全基于 Web 标准构建。它解决了运行时可移植性的问题——相同的代码可以在 Cloudflare Workers、Deno、Bun、AWS Lambda 和 Node.js 上运行而无需修改。它还通过高度优化的路由器和最小的开销解决了性能问题。

**问：Hono 如何实现跨运行时兼容性？**

答：Hono 仅使用 Web 标准 API（Request、Response、fetch、URL 等），这些 API 在所有现代 JavaScript 运行时中都有实现。它避免使用 Node.js 特定的 API，如 `http.createServer()` 或文件系统模块。

**问：Hono 中的 Context 对象是什么？**

答：Context（`c`）为每个请求创建，提供对以下内容的访问：
- `c.req`：围绕标准 Request 的 HonoRequest 包装器
- 响应方法：`c.json()`、`c.text()`、`c.html()`、`c.redirect()`
- 变量：`c.get()`、`c.set()` 用于在中间件之间共享数据
- 环境：`c.env` 用于访问运行时绑定（Cloudflare Workers）

### 中级问题

**问：解释 Hono 中的不同路由器及其使用场景。**

答：Hono 有四种路由器：
1. **RegExpRouter**：最快，将路由编译成单个正则表达式。最适合长期运行的服务器。
2. **TrieRouter**：基于 Trie，全面性能良好，支持所有模式。
3. **LinearRouter**：即时注册路由，最适合每次请求都初始化应用的无服务器环境。
4. **SmartRouter**：自动选择最佳路由器。大多数情况下的默认选择。

对于 RegExpRouter（长期运行）使用 `import { Hono } from 'hono'`，对于 LinearRouter（无服务器）使用 `import { Hono } from 'hono/quick'`。

**问：Hono 的 RPC 功能如何提供类型安全？**

答：Hono 的 RPC 工作原理：
1. 导出应用的类型（`export type AppType = typeof routes`）
2. 客户端使用此类型与 `hc<AppType>(baseUrl)`
3. TypeScript 从验证器和处理函数推断请求/响应类型
4. 客户端获得所有端点的自动完成和类型检查

这需要正确的路由链式调用以保留类型。

**问：Hono 中间件的洋葱模型是什么？**

答：洋葱模型意味着中间件像洋葱层一样包裹处理函数：
- `await next()` 之前的代码在"进入"时运行（请求阶段）
- `await next()` 之后的代码在"离开"时运行（响应阶段）
- 这使得计时、日志记录和错误处理等功能成为可能

### 高级问题

**问：如何为多区域边缘部署实现速率限制器？**

答：对于边缘部署，使用 Cloudflare Durable Objects 或 KV 进行分布式状态管理：

```typescript
app.use('/api/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP')
  const key = `rate:${ip}`

  // 使用带过期的 KV 实现滑动窗口
  const current = parseInt(await c.env.KV.get(key) || '0')

  if (current >= 100) {
    return c.json({ error: '速率受限' }, 429)
  }

  // 增加计数，60秒过期
  await c.env.KV.put(key, (current + 1).toString(), { expirationTtl: 60 })
  await next()
})
```

对于更精确的限制，使用 Durable Objects 实现每用户计数器，提供强一致性。

**问：Hono 的流式 SSR 是如何工作的？**

答：Hono 支持类似 React 的 Suspense 进行流式 SSR：
1. 使用 `renderToReadableStream` 而不是 `renderToString`
2. 用 `<Suspense fallback={...}>` 包裹异步组件
3. 初始 HTML 立即流式传输，带有 fallback
4. 当异步组件解析时，它们的 HTML 流入并替换 fallback
5. 这改善了首字节时间（TTFB）和感知性能

## 延伸阅读

### 官方资源

- [Hono 官方文档](https://hono.dev)
- [Hono GitHub 仓库](https://github.com/honojs/hono)
- [Hono 示例](https://github.com/honojs/examples)

### 部署指南

- [Cloudflare Workers 指南](https://hono.dev/getting-started/cloudflare-workers)
- [Deno Deploy 指南](https://hono.dev/getting-started/deno)
- [Bun 指南](https://hono.dev/getting-started/bun)
- [AWS Lambda 指南](https://hono.dev/getting-started/aws-lambda)
- [Vercel 指南](https://hono.dev/getting-started/vercel)

### 相关技术

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Web Standards APIs (MDN)](https://developer.mozilla.org/zh-CN/docs/Web/API)
- [Zod 验证库](https://zod.dev)

### 社区

- [Hono Discord](https://discord.gg/KMh2eNSdxV)
- [Hono Twitter/X](https://twitter.com/holojs)

通过掌握 Hono，你将获得构建高性能 API 的能力，这些 API 可以在任何 JavaScript 运行的地方运行——从边缘到传统服务器。它的速度、简单性和可移植性的结合使其成为现代 Web 开发的绝佳选择。
