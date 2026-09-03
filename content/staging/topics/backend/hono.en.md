---
title: Hono Web Framework
description: A comprehensive guide to Hono - the ultrafast web framework for the Edge
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
origin: old/src/content/docs/backend/hono.en.md
divergence: 0.216
issues: []
legacy:
  category: Backend
  subcategory: Web Frameworks
  order: 31
  lastUpdated: 2026-01-20
---

Hono is a small, simple, and ultrafast web framework built on Web Standards. Unlike traditional Node.js frameworks, Hono is designed from the ground up to work on any JavaScript runtime - Cloudflare Workers, Deno, Bun, Vercel, Netlify, AWS Lambda, and Node.js. The name "Hono" means "flame" in Japanese, representing its blazing-fast performance and lightweight nature.

## Why Hono?

### The Problem with Traditional Frameworks

Traditional web frameworks like Express.js were built primarily for Node.js and rely heavily on Node-specific APIs. This creates several challenges:

1. **Runtime Lock-in**: Code written for Express cannot run on Deno, Bun, or edge runtimes without significant modifications
2. **Performance Overhead**: Many frameworks carry legacy baggage that impacts performance
3. **Edge Incompatibility**: Edge computing platforms use Web Standard APIs, not Node.js APIs

### How Hono Solves These Problems

Hono addresses these challenges by:

- **Using Only Web Standards**: Hono relies exclusively on standard Web APIs (Request, Response, fetch, etc.), ensuring portability across all modern JavaScript runtimes
- **Ultrafast Routing**: The RegExpRouter can match routes using a single regular expression, achieving unmatched speed
- **Zero Dependencies**: The core framework has no external dependencies, keeping bundle sizes minimal
- **First-class TypeScript**: Built with TypeScript from day one, providing excellent type safety and developer experience

### Hono vs Express vs Fastify

| Feature | Hono | Express | Fastify |
|---------|------|---------|---------|
| Runtime Support | All JS runtimes | Node.js only | Node.js only |
| Bundle Size | ~14KB | ~200KB | ~450KB |
| TypeScript | Native | Via @types | Built-in |
| Web Standards | Yes | No | No |
| Edge Computing | Native | Requires adapters | Limited |
| Performance | Fastest | Slowest | Fast |

## Core Architecture

### Web Standards Foundation

Hono is built entirely on Web Standard APIs, which are now supported across all modern JavaScript runtimes:

```typescript
// Hono uses standard Request and Response objects
import { Hono } from 'hono'

const app = new Hono()

// The handler receives a standard Request via Context
// and returns a standard Response
app.get('/', (c) => {
  // c.req wraps the standard Request
  // c.json() returns a standard Response
  return c.json({ message: 'Hello, Hono!' })
})

export default app
```

### Router Architecture

Hono includes multiple router implementations, each optimized for different scenarios:

**RegExpRouter**: The fastest router in the JavaScript ecosystem. It compiles all routes into a single regular expression at startup, enabling O(1) route matching regardless of the number of routes.

**TrieRouter**: Uses a trie (prefix tree) data structure for route matching. Provides good performance and supports all route patterns including wildcards and parameters.

**LinearRouter**: Registers routes instantly with minimal overhead. Ideal for serverless environments where the application initializes on every request.

**SmartRouter**: Automatically selects the best router based on your route patterns. This is the default router in Hono.

```typescript
// SmartRouter configuration (default in Hono)
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

### Middleware System

Hono's middleware system follows the onion model, similar to Koa. Each middleware can execute code before and after the next middleware in the chain:

```typescript
import { Hono } from 'hono'

const app = new Hono()

// Middleware execution flow (onion model)
app.use(async (c, next) => {
  console.log('1. Before - First middleware')
  await next()
  console.log('6. After - First middleware')
})

app.use(async (c, next) => {
  console.log('2. Before - Second middleware')
  await next()
  console.log('5. After - Second middleware')
})

app.get('/', (c) => {
  console.log('3. Handler')
  return c.text('4. Response')
})

// Output order: 1 -> 2 -> 3 -> 4 -> 5 -> 6
```

## Core Concepts

### The Context Object

The Context object (`c`) is the heart of every Hono handler. It provides access to request data and methods to construct responses:

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/users/:id', async (c) => {
  // Request information
  const id = c.req.param('id')           // Path parameters
  const page = c.req.query('page')       // Query parameters
  const userAgent = c.req.header('User-Agent')  // Headers

  // Request body (for POST/PUT/PATCH)
  // const body = await c.req.json()     // JSON body
  // const form = await c.req.parseBody() // Form data

  // Set response headers
  c.header('X-Request-ID', crypto.randomUUID())

  // Set status code
  c.status(200)

  // Return response
  return c.json({
    id,
    page,
    userAgent,
  })
})
```

### Response Methods

Hono provides convenient methods for different response types:

```typescript
import { Hono } from 'hono'

const app = new Hono()

// JSON response - sets Content-Type: application/json
app.get('/api/data', (c) => {
  return c.json({ status: 'ok', data: [1, 2, 3] })
})

// Text response - sets Content-Type: text/plain
app.get('/text', (c) => {
  return c.text('Hello, World!')
})

// HTML response - sets Content-Type: text/html
app.get('/page', (c) => {
  return c.html('<h1>Welcome to Hono</h1>')
})

// Redirect response
app.get('/old-path', (c) => {
  return c.redirect('/new-path', 301)
})

// Not Found response
app.get('/maybe', (c) => {
  const found = false
  if (!found) {
    return c.notFound()
  }
  return c.json({ data: 'found' })
})

// Custom body with status and headers
app.get('/custom', (c) => {
  return c.body('Custom response', 201, {
    'X-Custom-Header': 'value',
  })
})
```

### Routing

Hono supports all HTTP methods and flexible route patterns:

```typescript
import { Hono } from 'hono'

const app = new Hono()

// HTTP Methods
app.get('/users', (c) => c.text('List users'))
app.post('/users', (c) => c.text('Create user'))
app.put('/users/:id', (c) => c.text('Update user'))
app.patch('/users/:id', (c) => c.text('Partial update'))
app.delete('/users/:id', (c) => c.text('Delete user'))

// Handle all HTTP methods
app.all('/webhook', (c) => c.text('Webhook received'))

// Path parameters
app.get('/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ userId: id })
})

// Multiple path parameters
app.get('/posts/:postId/comments/:commentId', (c) => {
  const { postId, commentId } = c.req.param()
  return c.json({ postId, commentId })
})

// Optional parameters
app.get('/files/:filename?', (c) => {
  const filename = c.req.param('filename') || 'index.html'
  return c.text(`Serving: ${filename}`)
})

// Wildcard routes
app.get('/static/*', (c) => {
  return c.text('Static file handler')
})

// Regex constraints
app.get('/posts/:id{[0-9]+}', (c) => {
  const id = c.req.param('id')  // Guaranteed to be numeric
  return c.json({ id: parseInt(id) })
})

// Multiple methods for same path
app.on(['GET', 'POST'], '/data', (c) => {
  return c.text(`Method: ${c.req.method}`)
})

// Multiple paths for same handler
app.on('GET', ['/hello', '/hi', '/hey'], (c) => {
  return c.text('Hello!')
})
```

### Route Grouping

Organize routes using separate Hono instances:

```typescript
import { Hono } from 'hono'

// Create route groups
const users = new Hono()
users.get('/', (c) => c.json({ users: [] }))
users.get('/:id', (c) => c.json({ id: c.req.param('id') }))
users.post('/', (c) => c.json({ message: 'Created' }, 201))

const posts = new Hono()
posts.get('/', (c) => c.json({ posts: [] }))
posts.get('/:id', (c) => c.json({ id: c.req.param('id') }))

// Mount route groups
const app = new Hono()
app.route('/users', users)
app.route('/posts', posts)

// Routes available:
// GET /users
// GET /users/:id
// POST /users
// GET /posts
// GET /posts/:id

export default app
```

### Middleware

Hono includes many built-in middlewares and supports custom middleware:

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

// Apply middleware globally
app.use(logger())
app.use(compress())
app.use(secureHeaders())
app.use(timing())

// CORS configuration
app.use('/api/*', cors({
  origin: ['https://example.com', 'https://app.example.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-Total-Count'],
  maxAge: 3600,
  credentials: true,
}))

// Basic authentication for admin routes
app.use('/admin/*', basicAuth({
  username: 'admin',
  password: process.env.ADMIN_PASSWORD || 'secret',
}))

// Bearer token authentication
app.use('/api/v1/*', bearerAuth({
  token: process.env.API_TOKEN || 'my-token',
}))

// JWT authentication
app.use('/api/v2/*', jwt({
  secret: process.env.JWT_SECRET || 'my-secret',
}))

// Access JWT payload in handlers
app.get('/api/v2/me', (c) => {
  const payload = c.get('jwtPayload')
  return c.json({ user: payload.sub })
})
```

### Custom Middleware

Create custom middleware for specific needs:

```typescript
import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'

const app = new Hono()

// Simple timing middleware
const requestTimer: MiddlewareHandler = async (c, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  c.header('X-Response-Time', `${duration}ms`)
}

// Rate limiting middleware
const createRateLimiter = (limit: number, window: number): MiddlewareHandler => {
  const requests = new Map<string, number[]>()

  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') ||
               c.req.header('X-Forwarded-For') ||
               'unknown'

    const now = Date.now()
    const windowStart = now - window

    // Get requests in current window
    const ipRequests = requests.get(ip) || []
    const recentRequests = ipRequests.filter(time => time > windowStart)

    if (recentRequests.length >= limit) {
      return c.json({ error: 'Too many requests' }, 429)
    }

    recentRequests.push(now)
    requests.set(ip, recentRequests)

    await next()
  }
}

// Error handling middleware
const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next()
  } catch (err) {
    console.error('Error:', err)
    return c.json({
      error: err instanceof Error ? err.message : 'Internal Server Error',
    }, 500)
  }
}

// Apply middleware
app.use(errorHandler)
app.use(requestTimer)
app.use('/api/*', createRateLimiter(100, 60000))  // 100 requests per minute

app.get('/api/data', (c) => {
  return c.json({ data: 'Hello!' })
})

export default app
```

### Validation with Zod

Hono integrates seamlessly with Zod for request validation:

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

// Define validation schemas
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

// JSON body validation
app.post(
  '/users',
  zValidator('json', createUserSchema),
  (c) => {
    const { email, name, age } = c.req.valid('json')
    return c.json({
      message: 'User created',
      user: { email, name, age: age ?? null },
    }, 201)
  }
)

// Query parameter validation
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

// Path parameter validation
app.get(
  '/users/:id',
  zValidator('param', paramSchema),
  (c) => {
    const { id } = c.req.valid('param')
    return c.json({ id })
  }
)

// Multiple validators
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

// Custom error handling
app.post(
  '/posts',
  zValidator(
    'json',
    z.object({ title: z.string(), body: z.string() }),
    (result, c) => {
      if (!result.success) {
        return c.json({
          error: 'Validation failed',
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

### Type-Safe RPC

Hono's RPC feature enables end-to-end type safety between server and client:

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

// Export type for client
export type AppType = typeof route
export default app
```

```typescript
// ========== client.ts ==========
import { hc } from 'hono/client'
import type { InferRequestType, InferResponseType } from 'hono/client'
import type { AppType } from './server'

// Create typed client
const client = hc<AppType>('http://localhost:8787')

// GET request - fully typed
async function getUsers() {
  const res = await client.api.users.$get()
  if (res.ok) {
    const data = await res.json()  // { users: { id: string, name: string }[] }
    console.log(data.users)
  }
}

// POST request with typed body
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

// GET with path parameters
async function getUser(id: string) {
  const res = await client.api.users[':id'].$get({
    param: { id },
  })

  if (res.ok) {
    const data = await res.json()  // { user: { id: string, name: string } }
    return data.user
  }
}

// Type inference helpers
type CreateUserRequest = InferRequestType<typeof client.api.users.$post>
type CreateUserResponse = InferResponseType<typeof client.api.users.$post>

// Get URL without making request
const url = client.api.users[':id'].$url({ param: { id: '123' } })
console.log(url.pathname)  // /api/users/123
```

## Code Examples

### Basic REST API

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

// In-memory database
interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

let todos: Todo[] = []

// Middleware
app.use(logger())
app.use('/api/*', cors())

// List todos
app.get('/api/todos', (c) => {
  const completed = c.req.query('completed')

  let filtered = todos
  if (completed !== undefined) {
    filtered = todos.filter(t => t.completed === (completed === 'true'))
  }

  return c.json({ todos: filtered })
})

// Get single todo
app.get('/api/todos/:id', (c) => {
  const id = c.req.param('id')
  const todo = todos.find(t => t.id === id)

  if (!todo) {
    return c.json({ error: 'Todo not found' }, 404)
  }

  return c.json({ todo })
})

// Create todo
app.post('/api/todos', async (c) => {
  const body = await c.req.json<{ title: string }>()

  if (!body.title || body.title.trim() === '') {
    return c.json({ error: 'Title is required' }, 400)
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

// Update todo
app.patch('/api/todos/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<Partial<Pick<Todo, 'title' | 'completed'>>>()

  const index = todos.findIndex(t => t.id === id)
  if (index === -1) {
    return c.json({ error: 'Todo not found' }, 404)
  }

  todos[index] = {
    ...todos[index],
    ...body,
  }

  return c.json({ todo: todos[index] })
})

// Delete todo
app.delete('/api/todos/:id', (c) => {
  const id = c.req.param('id')
  const index = todos.findIndex(t => t.id === id)

  if (index === -1) {
    return c.json({ error: 'Todo not found' }, 404)
  }

  todos.splice(index, 1)

  return c.json({ message: 'Deleted' })
})

export default app
```

### Cloudflare Workers with D1 Database

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'

// Define bindings type for Cloudflare Workers
type Bindings = {
  DB: D1Database
  API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// Auth middleware using environment variable
app.use('/api/*', async (c, next) => {
  const apiKey = c.req.header('X-API-Key')
  if (apiKey !== c.env.API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})

// List users from D1
app.get('/api/users', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC'
  ).all()

  return c.json({ users: results })
})

// Get user by ID
app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id')

  const user = await c.env.DB.prepare(
    'SELECT id, name, email, created_at FROM users WHERE id = ?'
  ).bind(id).first()

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ user })
})

// Create user
app.post('/api/users', async (c) => {
  const { name, email } = await c.req.json<{ name: string; email: string }>()

  const id = crypto.randomUUID()

  await c.env.DB.prepare(
    'INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, datetime("now"))'
  ).bind(id, name, email).run()

  return c.json({ user: { id, name, email } }, 201)
})

// Delete user
app.delete('/api/users/:id', async (c) => {
  const id = c.req.param('id')

  const result = await c.env.DB.prepare(
    'DELETE FROM users WHERE id = ?'
  ).bind(id).run()

  if (result.meta.changes === 0) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ message: 'Deleted' })
})

export default app
```

### File Upload with R2 Storage

```typescript
import { Hono } from 'hono'

type Bindings = {
  BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// Upload file
app.post('/upload', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return c.json({ error: 'No file provided' }, 400)
  }

  // Generate unique filename
  const ext = file.name.split('.').pop()
  const key = `${crypto.randomUUID()}.${ext}`

  // Upload to R2
  await c.env.BUCKET.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  })

  return c.json({
    message: 'Uploaded',
    key,
    size: file.size,
    type: file.type,
  }, 201)
})

// Download file
app.get('/files/:key', async (c) => {
  const key = c.req.param('key')

  const object = await c.env.BUCKET.get(key)

  if (!object) {
    return c.json({ error: 'File not found' }, 404)
  }

  const headers = new Headers()
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
  headers.set('Content-Length', object.size.toString())

  return new Response(object.body, { headers })
})

// Delete file
app.delete('/files/:key', async (c) => {
  const key = c.req.param('key')

  await c.env.BUCKET.delete(key)

  return c.json({ message: 'Deleted' })
})

export default app
```

### JSX Server-Side Rendering

```typescript
import { Hono } from 'hono'
import { jsxRenderer } from 'hono/jsx-renderer'

const app = new Hono()

// Layout component
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
          <a href="/" class="text-xl font-bold text-indigo-600">My App</a>
        </div>
      </nav>
      <main class="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </body>
  </html>
)

// Use JSX renderer middleware
app.use(
  '*',
  jsxRenderer(({ children }) => (
    <Layout title="Hono App">{children}</Layout>
  ))
)

// Home page
app.get('/', (c) => {
  return c.render(
    <div class="space-y-6">
      <h1 class="text-3xl font-bold">Welcome to Hono</h1>
      <p class="text-gray-600">
        A small, simple, and ultrafast web framework.
      </p>
      <div class="flex gap-4">
        <a
          href="/about"
          class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Learn More
        </a>
      </div>
    </div>
  )
})

// About page
app.get('/about', (c) => {
  const features = [
    'Ultrafast performance',
    'Multi-runtime support',
    'TypeScript first',
    'Web Standards based',
  ]

  return c.render(
    <div class="space-y-6">
      <h1 class="text-3xl font-bold">About Hono</h1>
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

### Streaming SSR with Suspense

```typescript
import { Hono } from 'hono'
import { Suspense, renderToReadableStream } from 'hono/jsx/streaming'

const app = new Hono()

// Async component that fetches data
const AsyncUserList = async () => {
  // Simulate API call
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

// Loading skeleton
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
        <title>Streaming SSR</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="p-8 bg-gray-100">
        <h1 class="text-2xl font-bold mb-4">User List</h1>
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

## Best Practices

### Project Structure

Organize your Hono application for maintainability:

```
src/
├── index.ts           # Entry point
├── routes/
│   ├── index.ts       # Route aggregation
│   ├── users.ts       # User routes
│   ├── posts.ts       # Post routes
│   └── auth.ts        # Auth routes
├── middleware/
│   ├── auth.ts        # Auth middleware
│   ├── rateLimit.ts   # Rate limiting
│   └── validate.ts    # Validation helpers
├── services/
│   ├── userService.ts # Business logic
│   └── postService.ts
├── schemas/
│   ├── user.ts        # Zod schemas
│   └── post.ts
└── types/
    └── bindings.ts    # Environment bindings type
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

### Error Handling

Implement consistent error handling:

```typescript
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

// Custom error class
class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
  }
}

// Global error handler
app.onError((err, c) => {
  console.error('Error:', err)

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

  // Unexpected errors
  return c.json({
    error: 'Internal Server Error',
    status: 500,
  }, 500)
})

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    status: 404,
    path: c.req.path,
  }, 404)
})

// Usage in routes
app.get('/users/:id', async (c) => {
  const id = c.req.param('id')
  const user = await findUser(id)

  if (!user) {
    throw new AppError(404, 'User not found', 'USER_NOT_FOUND')
  }

  return c.json({ user })
})

// Or use HTTPException
app.get('/admin', async (c) => {
  const isAdmin = false

  if (!isAdmin) {
    throw new HTTPException(403, { message: 'Forbidden' })
  }

  return c.json({ admin: true })
})
```

### Type Safety with Bindings

Define types for environment variables and bindings:

```typescript
// src/types/bindings.ts
export type Bindings = {
  // Environment variables
  DATABASE_URL: string
  JWT_SECRET: string
  API_KEY: string

  // Cloudflare bindings
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

// Now c.env and c.get/c.set are fully typed
app.use(async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  await next()
})

app.get('/config', (c) => {
  // c.env is typed
  const dbUrl = c.env.DATABASE_URL
  const requestId = c.get('requestId')  // string

  return c.json({ configured: true, requestId })
})
```

## Common Pitfalls

### 1. Forgetting to Await Async Operations

```typescript
// Wrong - response sent before DB operation completes
app.post('/users', (c) => {
  const data = c.req.json()  // Missing await!
  saveToDatabase(data)       // Missing await!
  return c.json({ success: true })
})

// Correct
app.post('/users', async (c) => {
  const data = await c.req.json()
  await saveToDatabase(data)
  return c.json({ success: true })
})
```

### 2. Middleware Order Matters

```typescript
// Wrong - CORS not applied before auth check
app.use('/api/*', authMiddleware)
app.use('/api/*', cors())  // CORS headers not sent on auth failure

// Correct - CORS should come first
app.use('/api/*', cors())
app.use('/api/*', authMiddleware)
```

### 3. Not Returning Responses

```typescript
// Wrong - no return statement
app.get('/data', (c) => {
  c.json({ data: 'hello' })  // Missing return!
})

// Correct
app.get('/data', (c) => {
  return c.json({ data: 'hello' })
})
```

### 4. Mutating Shared State in Serverless

```typescript
// Wrong - shared state doesn't work in serverless
let counter = 0  // Reset on each cold start!

app.post('/increment', (c) => {
  counter++
  return c.json({ counter })
})

// Correct - use external storage
app.post('/increment', async (c) => {
  const current = await c.env.KV.get('counter') || '0'
  const newValue = parseInt(current) + 1
  await c.env.KV.put('counter', newValue.toString())
  return c.json({ counter: newValue })
})
```

### 5. Blocking the Event Loop

```typescript
// Wrong - CPU-intensive sync operation blocks all requests
app.get('/hash', (c) => {
  const result = heavyComputation()  // Blocks for seconds
  return c.json({ result })
})

// Better - offload to a worker or break into chunks
app.get('/hash', async (c) => {
  // Use Web Crypto API (non-blocking)
  const encoder = new TextEncoder()
  const data = encoder.encode('data to hash')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return c.json({ hash })
})
```

### 6. Incorrect RPC Type Export

```typescript
// Wrong - loses type information
const app = new Hono()
app.get('/api/users', (c) => c.json({ users: [] }))
app.post('/api/users', (c) => c.json({ user: {} }))
export type AppType = typeof app  // Routes not in type!

// Correct - chain routes to preserve types
const app = new Hono()
const routes = app
  .get('/api/users', (c) => c.json({ users: [] }))
  .post('/api/users', (c) => c.json({ user: {} }))
export type AppType = typeof routes
export default app
```

## Performance Considerations

### Why Hono is Fast

1. **RegExpRouter**: Compiles all routes into a single regex, achieving O(1) matching
2. **No Runtime Overhead**: Zero dependencies and minimal abstraction layers
3. **Web Standards**: Uses native browser/runtime APIs without polyfills
4. **Small Bundle**: ~14KB gzipped core, faster cold starts
5. **No Callback Hell**: Modern async/await throughout

### Benchmark Results

Hono consistently outperforms other frameworks in benchmarks:

| Framework | Requests/sec | Latency (avg) |
|-----------|-------------|---------------|
| Hono | 150,000+ | 0.2ms |
| Fastify | 65,000 | 0.5ms |
| Express | 15,000 | 2.0ms |

*Results vary by runtime and hardware. Tested on Cloudflare Workers.*

### Optimization Tips

```typescript
import { Hono } from 'hono'
import { cache } from 'hono/cache'
import { compress } from 'hono/compress'

const app = new Hono()

// 1. Enable compression for large responses
app.use(compress())

// 2. Cache static responses
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

// 3. Use streaming for large data
app.get('/api/large-data', async (c) => {
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 1000; i++) {
        controller.enqueue(JSON.stringify({ item: i }) + '\n')
        // Allow other tasks to run
        await new Promise(r => setTimeout(r, 0))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  })
})

// 4. Avoid unnecessary middleware on hot paths
const heavyMiddleware = async (c: any, next: any) => {
  // expensive operations...
  await next()
}

// Only apply where needed
app.use('/admin/*', heavyMiddleware)
// NOT: app.use('*', heavyMiddleware)

// 5. Use appropriate router for your environment
import { Hono } from 'hono/quick'  // For serverless (LinearRouter)
// vs
import { Hono } from 'hono'        // For long-running servers (RegExpRouter)
```

## Real-World Use Cases

### Edge API Gateway

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

// Cache popular endpoints at the edge
app.get(
  '/api/products',
  cache({ cacheName: 'products', cacheControl: 'max-age=60' }),
  async (c) => {
    const res = await fetch(`${c.env.UPSTREAM_URL}/products`)
    const data = await res.json()
    return c.json(data)
  }
)

// Rate limiting at the edge
const rateLimit = new Map<string, number>()

app.use('/api/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown'
  const count = rateLimit.get(ip) || 0

  if (count > 100) {
    return c.json({ error: 'Rate limited' }, 429)
  }

  rateLimit.set(ip, count + 1)
  await next()
})

// Proxy to upstream
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

### Webhook Handler

```typescript
import { Hono } from 'hono'

type Bindings = {
  WEBHOOK_SECRET: string
  QUEUE: Queue
}

const app = new Hono<{ Bindings: Bindings }>()

// Verify webhook signature
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
    return c.json({ error: 'Invalid signature' }, 401)
  }

  const event = c.req.header('X-GitHub-Event')
  const data = JSON.parse(payload)

  // Queue for async processing
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

  // Verify Stripe signature (simplified)
  // In production, use Stripe SDK

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

### Multi-Tenant API

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

// Extract and verify tenant
app.use('/api/*', jwt({ secret: process.env.JWT_SECRET || '' }))

app.use('/api/*', async (c, next) => {
  const payload = c.get('jwtPayload')
  const tenantId = payload.tenantId

  const tenant = await c.env.DB.prepare(
    'SELECT id, name, plan FROM tenants WHERE id = ?'
  ).bind(tenantId).first()

  if (!tenant) {
    return c.json({ error: 'Tenant not found' }, 404)
  }

  c.set('tenant', tenant as Variables['tenant'])
  await next()
})

// Plan-based rate limiting
const planLimits = {
  free: 100,
  pro: 1000,
  enterprise: 10000,
}

app.use('/api/*', async (c, next) => {
  const tenant = c.get('tenant')
  const limit = planLimits[tenant.plan]

  // Check rate limit from KV/DB
  // ...

  await next()
})

// Tenant-scoped data access
app.get('/api/data', async (c) => {
  const tenant = c.get('tenant')

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM data WHERE tenant_id = ?'
  ).bind(tenant.id).all()

  return c.json({ data: results })
})

export default app
```

## Testing

### Unit Testing with Vitest

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

describe('API Tests', () => {
  it('GET /hello returns greeting', async () => {
    const res = await app.request('/hello')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'Hello!' })
  })

  it('GET /hello/:name returns personalized greeting', async () => {
    const res = await app.request('/hello/World')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'Hello, World!' })
  })

  it('POST /users creates user', async () => {
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

### Testing with Mocked Bindings

```typescript
// app.test.ts
import { describe, it, expect, vi } from 'vitest'
import { app } from './app'

describe('Cloudflare Workers Tests', () => {
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

  it('GET /users returns users from DB', async () => {
    const res = await app.request(
      '/users',
      { headers: { 'X-API-Key': 'test-key' } },
      mockEnv
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.users).toHaveLength(1)
  })

  it('rejects invalid API key', async () => {
    const res = await app.request(
      '/users',
      { headers: { 'X-API-Key': 'wrong-key' } },
      mockEnv
    )

    expect(res.status).toBe(401)
  })
})
```

## Interview Questions

### Basic Questions

**Q: What is Hono and what problems does it solve?**

A: Hono is a small, ultrafast web framework built on Web Standards. It solves the problem of runtime portability - the same code runs on Cloudflare Workers, Deno, Bun, AWS Lambda, and Node.js without modification. It also addresses performance concerns with its highly optimized router and minimal overhead.

**Q: How does Hono achieve cross-runtime compatibility?**

A: Hono uses only Web Standard APIs (Request, Response, fetch, URL, etc.) that are implemented across all modern JavaScript runtimes. It avoids Node.js-specific APIs like `http.createServer()` or file system modules.

**Q: What is the Context object in Hono?**

A: The Context (`c`) is created for each request and provides access to:
- `c.req`: The HonoRequest wrapper around the standard Request
- Response methods: `c.json()`, `c.text()`, `c.html()`, `c.redirect()`
- Variables: `c.get()`, `c.set()` for sharing data between middleware
- Environment: `c.env` for accessing runtime bindings (Cloudflare Workers)

### Intermediate Questions

**Q: Explain the different routers in Hono and when to use each.**

A: Hono has four routers:
1. **RegExpRouter**: Fastest, compiles routes to single regex. Best for long-running servers.
2. **TrieRouter**: Trie-based, good all-around performance, supports all patterns.
3. **LinearRouter**: Registers routes instantly, best for serverless where app initializes per request.
4. **SmartRouter**: Auto-selects the best router. Default choice for most cases.

Use `import { Hono } from 'hono'` for RegExpRouter (long-running) or `import { Hono } from 'hono/quick'` for LinearRouter (serverless).

**Q: How does Hono's RPC feature provide type safety?**

A: Hono's RPC works by:
1. Exporting the app's type (`export type AppType = typeof routes`)
2. The client uses this type with `hc<AppType>(baseUrl)`
3. TypeScript infers request/response types from validators and handlers
4. The client gets autocompletion and type checking for all endpoints

This requires proper route chaining to preserve types.

**Q: What is the onion model in Hono middleware?**

A: The onion model means middleware wraps around handlers like layers of an onion:
- Code before `await next()` runs on the way "in" (request phase)
- Code after `await next()` runs on the way "out" (response phase)
- This enables features like timing, logging, and error handling

### Advanced Questions

**Q: How would you implement a rate limiter for a multi-region edge deployment?**

A: For edge deployments, use Cloudflare Durable Objects or KV for distributed state:

```typescript
app.use('/api/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP')
  const key = `rate:${ip}`

  // Use KV with expiration for sliding window
  const current = parseInt(await c.env.KV.get(key) || '0')

  if (current >= 100) {
    return c.json({ error: 'Rate limited' }, 429)
  }

  // Increment with 60s expiration
  await c.env.KV.put(key, (current + 1).toString(), { expirationTtl: 60 })
  await next()
})
```

For more precise limiting, use Durable Objects for per-user counters with strong consistency.

**Q: How does Hono's streaming SSR work?**

A: Hono supports React-like Suspense for streaming SSR:
1. Use `renderToReadableStream` instead of `renderToString`
2. Wrap async components in `<Suspense fallback={...}>`
3. The initial HTML streams immediately with fallbacks
4. As async components resolve, their HTML streams in and replaces fallbacks
5. This improves Time to First Byte (TTFB) and perceived performance

## Further Reading

### Official Resources

- [Hono Official Documentation](https://hono.dev)
- [Hono GitHub Repository](https://github.com/honojs/hono)
- [Hono Examples](https://github.com/honojs/examples)

### Deployment Guides

- [Cloudflare Workers Guide](https://hono.dev/getting-started/cloudflare-workers)
- [Deno Deploy Guide](https://hono.dev/getting-started/deno)
- [Bun Guide](https://hono.dev/getting-started/bun)
- [AWS Lambda Guide](https://hono.dev/getting-started/aws-lambda)
- [Vercel Guide](https://hono.dev/getting-started/vercel)

### Related Technologies

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Web Standards APIs (MDN)](https://developer.mozilla.org/en-US/docs/Web/API)
- [Zod Validation Library](https://zod.dev)

### Community

- [Hono Discord](https://discord.gg/KMh2eNSdxV)
- [Hono Twitter/X](https://twitter.com/holojs)

By mastering Hono, you gain the ability to build high-performance APIs that run anywhere JavaScript runs - from the edge to traditional servers. Its combination of speed, simplicity, and portability makes it an excellent choice for modern web development.
