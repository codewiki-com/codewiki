---
title: Elysia Framework (Bun Ecosystem)
description: A comprehensive guide to Elysia - the ergonomic web framework for building type-safe APIs with Bun
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Elysia
  - Bun
  - TypeScript
  - Web Framework
  - Type Safety
  - Eden
status: imported
origin: old/src/content/docs/backend/elysia.en.md
divergence: 0.223
issues: []
legacy:
  category: Backend
  subcategory: Web Frameworks
  order: 33
  lastUpdated: 2026-01-20
---

Elysia is an ergonomic web framework designed specifically for the Bun runtime, offering unprecedented end-to-end type safety without code generation. Built with TypeScript from the ground up, Elysia leverages Bun's exceptional performance to deliver one of the fastest web frameworks available while maintaining an outstanding developer experience. You'll learn how to build type-safe, high-performance APIs using Elysia's powerful features including Eden Treaty, lifecycle hooks, and real-time WebSocket support.

## What is Elysia?

Elysia is a TypeScript web framework that runs on Bun, designed with three core principles: **ergonomics**, **type safety**, and **performance**. Unlike traditional frameworks that require manual type definitions or code generation for type safety, Elysia automatically infers types throughout your entire application stack.

### Why Choose Bun Ecosystem?

Bun is an all-in-one JavaScript runtime that includes a bundler, transpiler, and package manager. It offers several advantages that make it an ideal foundation for Elysia:

| Feature | Bun Advantage |
|---------|---------------|
| **Startup Time** | 4x faster than Node.js |
| **HTTP Performance** | Native HTTP server outperforms Node.js |
| **TypeScript** | Native TypeScript execution without compilation step |
| **Package Management** | Fastest npm-compatible package manager |
| **SQLite** | Built-in SQLite driver |
| **File I/O** | Optimized file system operations |

### Elysia vs Express vs Hono

| Feature | Elysia | Express | Hono |
|---------|--------|---------|------|
| **Runtime** | Bun | Node.js | Multi-runtime |
| **Type Safety** | End-to-end (automatic) | Manual | Partial |
| **Performance** | Excellent | Good | Very Good |
| **Code Generation** | Not required | N/A | Not required |
| **Bundle Size** | ~2KB (Eden) | N/A | ~14KB |
| **WebSocket** | Native support | Requires socket.io | Limited |
| **OpenAPI** | Built-in | Manual/Swagger | Plugin |

Elysia's key differentiator is its **end-to-end type safety without code generation**. When you change your API, the types automatically propagate to your client code through Eden Treaty.

## Core Principles

### Type Inference System

Elysia's type system works through TypeScript's type inference, allowing the framework to automatically derive types from your route definitions:

```typescript
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .get('/user/:id', ({ params }) => {
    // params.id is automatically typed as string
    return { userId: params.id }
  })
  .post('/user', ({ body }) => {
    // body is typed based on the schema
    return { created: body.name }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String({ format: 'email' }),
      age: t.Number({ minimum: 0 })
    })
  })
```

The magic happens because Elysia uses **const generics** to preserve literal types throughout the chain. Each method call returns a new type that includes all previous route definitions.

### Eden Treaty: End-to-End Type Safety

Eden is Elysia's companion library that creates a fully typed client from your server definition. It weighs less than 2KB and requires no code generation:

```typescript
// server.ts
import { Elysia, t } from 'elysia'

export const app = new Elysia()
  .get('/', () => 'Hello Elysia!')
  .post('/mirror', ({ body }) => body, {
    body: t.Object({
      message: t.String()
    })
  })
  .listen(3000)

export type App = typeof app
```

```typescript
// client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from './server'

const api = treaty<App>('localhost:3000')

// Full type safety and auto-completion
const { data, error } = await api.mirror.post({
  message: 'Hello World'  // TypeScript enforces this shape
})

if (error) {
  console.error(error)
} else {
  console.log(data.message)  // data is typed as { message: string }
}
```

### Lifecycle Hooks

Elysia provides a comprehensive lifecycle system for request processing:

```
Request → onRequest → onParse → onTransform → onBeforeHandle → Handler → onAfterHandle → onMapResponse → Response
                                                                    ↓
                                                              onError (on any error)
```

| Hook | Purpose | Use Case |
|------|---------|----------|
| `onRequest` | Earliest interception point | Logging, rate limiting |
| `onParse` | Custom body parsing | XML, Protocol Buffers |
| `onTransform` | Modify context before validation | Data normalization |
| `onBeforeHandle` | Pre-handler logic | Authentication, authorization |
| `onAfterHandle` | Post-handler processing | Response transformation |
| `onMapResponse` | Transform final response | Compression, formatting |
| `onError` | Error handling | Custom error responses |

## Core Concepts

### Route Definition

Elysia supports all HTTP methods with a fluent, chainable API:

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
  // Basic routes
  .get('/hello', () => 'Hello World')
  .post('/users', ({ body }) => createUser(body))
  .put('/users/:id', ({ params, body }) => updateUser(params.id, body))
  .patch('/users/:id', ({ params, body }) => patchUser(params.id, body))
  .delete('/users/:id', ({ params }) => deleteUser(params.id))

  // Route with all HTTP methods
  .all('/any', () => 'Handles all methods')

  // Custom method
  .route('CUSTOM', '/custom', () => 'Custom method')

  // Wildcard routes
  .get('/files/*', ({ params }) => {
    // params['*'] contains the rest of the path
    return `File: ${params['*']}`
  })
  .listen(3000)
```

### Validation with TypeBox

Elysia uses TypeBox for schema validation, providing runtime validation with compile-time type inference:

```typescript
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .post('/user', ({ body, query, params, headers }) => {
    // All inputs are validated and typed
    return { success: true, user: body }
  }, {
    // Request body validation
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 100 }),
      email: t.String({ format: 'email' }),
      age: t.Optional(t.Number({ minimum: 0, maximum: 150 })),
      role: t.Union([
        t.Literal('admin'),
        t.Literal('user'),
        t.Literal('guest')
      ]),
      tags: t.Array(t.String(), { minItems: 1 })
    }),

    // Query parameters validation
    query: t.Object({
      include: t.Optional(t.String())
    }),

    // Path parameters validation
    params: t.Object({
      // If route was /user/:id
      // id: t.String()
    }),

    // Headers validation
    headers: t.Object({
      authorization: t.String()
    }),

    // Response validation (optional but recommended)
    response: {
      200: t.Object({
        success: t.Boolean(),
        user: t.Object({
          name: t.String(),
          email: t.String()
        })
      }),
      400: t.Object({
        error: t.String()
      })
    }
  })
```

### Custom Type Definitions

TypeBox provides extensive type definitions:

```typescript
import { t } from 'elysia'

// Primitive types
const stringType = t.String()
const numberType = t.Number()
const booleanType = t.Boolean()
const nullType = t.Null()

// String constraints
const email = t.String({ format: 'email' })
const uuid = t.String({ format: 'uuid' })
const url = t.String({ format: 'uri' })
const pattern = t.String({ pattern: '^[A-Z]{2}[0-9]{4}$' })

// Number constraints
const positiveInt = t.Integer({ minimum: 1 })
const percentage = t.Number({ minimum: 0, maximum: 100 })

// Complex types
const nullable = t.Union([t.String(), t.Null()])
const optional = t.Optional(t.String())
const literal = t.Literal('specific-value')
const enumType = t.Union([
  t.Literal('pending'),
  t.Literal('active'),
  t.Literal('completed')
])

// Arrays and objects
const stringArray = t.Array(t.String())
const nestedObject = t.Object({
  user: t.Object({
    profile: t.Object({
      bio: t.String()
    })
  })
})

// Record type (dynamic keys)
const record = t.Record(t.String(), t.Number())

// Recursive types
const category: any = t.Object({
  name: t.String(),
  children: t.Array(t.Ref(category))
})
```

### Middleware and Plugins

Elysia uses a plugin system for code organization and reusability:

```typescript
import { Elysia } from 'elysia'

// Create a reusable plugin
const authPlugin = new Elysia({ name: 'auth' })
  .derive(({ headers }) => {
    const token = headers.authorization?.replace('Bearer ', '')
    return { token }
  })
  .macro({
    isAuth: (enabled: boolean) => ({
      beforeHandle: ({ token, set }) => {
        if (enabled && !token) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
      }
    })
  })

// Create a logging plugin
const loggerPlugin = new Elysia({ name: 'logger' })
  .onRequest(({ request }) => {
    console.log(`${request.method} ${request.url}`)
  })
  .onAfterHandle(({ request, set }) => {
    console.log(`${request.method} ${request.url} - ${set.status}`)
  })

// Use plugins in main app
const app = new Elysia()
  .use(loggerPlugin)
  .use(authPlugin)
  .get('/public', () => 'Public endpoint')
  .get('/private', () => 'Private endpoint', {
    isAuth: true  // Macro from authPlugin
  })
  .listen(3000)
```

### Dependency Injection with State, Decorate, and Derive

Elysia provides three mechanisms for sharing data across handlers:

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
  // state: Mutable shared state (global)
  .state('version', '1.0.0')
  .state('requestCount', 0)

  // decorate: Immutable utilities/services (global)
  .decorate('db', new DatabaseClient())
  .decorate('logger', new Logger())

  // derive: Per-request computed values
  .derive(({ headers }) => ({
    userAgent: headers['user-agent'] ?? 'Unknown',
    requestId: crypto.randomUUID()
  }))

  // resolve: Per-request async resolution (within guard scope)
  .guard({
    beforeHandle: ({ headers }) => {
      if (!headers.authorization) {
        return { error: 'Unauthorized' }
      }
    }
  }, (app) => app
    .resolve(async ({ headers, db }) => {
      const token = headers.authorization!.replace('Bearer ', '')
      const user = await db.users.findByToken(token)
      return { user }
    })
    .get('/profile', ({ user }) => user)
    .get('/settings', ({ user }) => user.settings)
  )

  .get('/info', ({ store, db, userAgent, requestId }) => ({
    version: store.version,
    requests: ++store.requestCount,
    userAgent,
    requestId
  }))
  .listen(3000)
```

### WebSocket Support

Elysia provides first-class WebSocket support with the same type safety:

```typescript
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .ws('/chat', {
    // Schema validation for messages
    body: t.Object({
      type: t.Union([t.Literal('message'), t.Literal('join'), t.Literal('leave')]),
      content: t.String(),
      room: t.String()
    }),
    response: t.Object({
      type: t.String(),
      content: t.String(),
      from: t.String(),
      timestamp: t.Number()
    }),

    // Connection opened
    open(ws) {
      console.log('Client connected:', ws.id)
    },

    // Message received
    message(ws, message) {
      const response = {
        type: message.type,
        content: message.content,
        from: ws.id,
        timestamp: Date.now()
      }

      // Send to specific room
      ws.publish(message.room, response)

      // Subscribe to room
      if (message.type === 'join') {
        ws.subscribe(message.room)
      }
    },

    // Connection closed
    close(ws) {
      console.log('Client disconnected:', ws.id)
    }
  })
  .listen(3000)
```

## Code Examples

### Complete REST API Example

```typescript
// src/index.ts
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'

// Types
interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

// In-memory database (replace with actual database)
const users = new Map<string, User>()

// Schemas
const UserSchema = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String({ format: 'email' }),
  createdAt: t.Date()
})

const CreateUserSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  email: t.String({ format: 'email' })
})

const UpdateUserSchema = t.Partial(CreateUserSchema)

// Error responses
const NotFoundSchema = t.Object({
  error: t.String(),
  message: t.String()
})

// Application
const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'User API',
        version: '1.0.0'
      }
    }
  }))
  .use(cors())

  // Error handling
  .onError(({ error, set }) => {
    console.error(error)

    if (error.message === 'NOT_FOUND') {
      set.status = 404
      return { error: 'Not Found', message: 'Resource not found' }
    }

    set.status = 500
    return { error: 'Internal Server Error', message: 'Something went wrong' }
  })

  // Routes
  .group('/api/v1/users', (app) => app
    // List all users
    .get('/', () => Array.from(users.values()), {
      response: t.Array(UserSchema),
      detail: {
        summary: 'List all users',
        tags: ['Users']
      }
    })

    // Get user by ID
    .get('/:id', ({ params, error }) => {
      const user = users.get(params.id)
      if (!user) {
        return error(404, { error: 'Not Found', message: 'User not found' })
      }
      return user
    }, {
      params: t.Object({ id: t.String() }),
      response: {
        200: UserSchema,
        404: NotFoundSchema
      },
      detail: {
        summary: 'Get user by ID',
        tags: ['Users']
      }
    })

    // Create user
    .post('/', ({ body }) => {
      const user: User = {
        id: crypto.randomUUID(),
        name: body.name,
        email: body.email,
        createdAt: new Date()
      }
      users.set(user.id, user)
      return user
    }, {
      body: CreateUserSchema,
      response: UserSchema,
      detail: {
        summary: 'Create a new user',
        tags: ['Users']
      }
    })

    // Update user
    .patch('/:id', ({ params, body, error }) => {
      const user = users.get(params.id)
      if (!user) {
        return error(404, { error: 'Not Found', message: 'User not found' })
      }

      const updated = { ...user, ...body }
      users.set(params.id, updated)
      return updated
    }, {
      params: t.Object({ id: t.String() }),
      body: UpdateUserSchema,
      response: {
        200: UserSchema,
        404: NotFoundSchema
      },
      detail: {
        summary: 'Update user',
        tags: ['Users']
      }
    })

    // Delete user
    .delete('/:id', ({ params, error, set }) => {
      if (!users.has(params.id)) {
        return error(404, { error: 'Not Found', message: 'User not found' })
      }

      users.delete(params.id)
      set.status = 204
      return null
    }, {
      params: t.Object({ id: t.String() }),
      response: {
        204: t.Null(),
        404: NotFoundSchema
      },
      detail: {
        summary: 'Delete user',
        tags: ['Users']
      }
    })
  )
  .listen(3000)

console.log(`Server running at http://localhost:${app.server?.port}`)
console.log(`Swagger docs at http://localhost:${app.server?.port}/swagger`)

export type App = typeof app
```

### WebSocket Real-time Application

```typescript
// src/realtime.ts
import { Elysia, t } from 'elysia'

interface Message {
  id: string
  room: string
  author: string
  content: string
  timestamp: number
}

interface RoomState {
  users: Set<string>
  messages: Message[]
}

const rooms = new Map<string, RoomState>()

const MessageSchema = t.Object({
  type: t.Union([
    t.Literal('join'),
    t.Literal('leave'),
    t.Literal('message'),
    t.Literal('typing')
  ]),
  room: t.String(),
  content: t.Optional(t.String()),
  author: t.String()
})

const app = new Elysia()
  .get('/rooms', () => {
    const roomList = []
    for (const [name, state] of rooms) {
      roomList.push({
        name,
        userCount: state.users.size,
        messageCount: state.messages.length
      })
    }
    return roomList
  })

  .get('/rooms/:room/messages', ({ params }) => {
    const room = rooms.get(params.room)
    return room?.messages ?? []
  })

  .ws('/ws', {
    body: MessageSchema,

    open(ws) {
      console.log(`WebSocket connected: ${ws.id}`)
      ws.data = { rooms: new Set<string>(), author: '' }
    },

    message(ws, message) {
      const { type, room, content, author } = message

      // Ensure room exists
      if (!rooms.has(room)) {
        rooms.set(room, { users: new Set(), messages: [] })
      }
      const roomState = rooms.get(room)!

      switch (type) {
        case 'join':
          ws.subscribe(room)
          ws.data.rooms.add(room)
          ws.data.author = author
          roomState.users.add(author)

          // Broadcast join notification
          ws.publish(room, JSON.stringify({
            type: 'system',
            content: `${author} joined the room`,
            timestamp: Date.now()
          }))

          // Send room history to the new user
          ws.send(JSON.stringify({
            type: 'history',
            messages: roomState.messages.slice(-50)
          }))
          break

        case 'leave':
          ws.unsubscribe(room)
          ws.data.rooms.delete(room)
          roomState.users.delete(author)

          ws.publish(room, JSON.stringify({
            type: 'system',
            content: `${author} left the room`,
            timestamp: Date.now()
          }))
          break

        case 'message':
          if (content) {
            const msg: Message = {
              id: crypto.randomUUID(),
              room,
              author,
              content,
              timestamp: Date.now()
            }
            roomState.messages.push(msg)

            // Keep only last 1000 messages
            if (roomState.messages.length > 1000) {
              roomState.messages = roomState.messages.slice(-1000)
            }

            // Broadcast to all room subscribers
            ws.publish(room, JSON.stringify({
              type: 'message',
              ...msg
            }))
          }
          break

        case 'typing':
          ws.publish(room, JSON.stringify({
            type: 'typing',
            author,
            timestamp: Date.now()
          }))
          break
      }
    },

    close(ws) {
      // Clean up: leave all rooms
      for (const room of ws.data.rooms) {
        const roomState = rooms.get(room)
        if (roomState && ws.data.author) {
          roomState.users.delete(ws.data.author)
          ws.publish(room, JSON.stringify({
            type: 'system',
            content: `${ws.data.author} disconnected`,
            timestamp: Date.now()
          }))
        }
      }
      console.log(`WebSocket disconnected: ${ws.id}`)
    }
  })
  .listen(3000)

export type App = typeof app
```

### Eden Client Integration

```typescript
// src/client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from './index'

// Create typed client
const api = treaty<App>('localhost:3000')

// Usage examples
async function examples() {
  // GET request with auto-completion
  const { data: users, error: listError } = await api.api.v1.users.get()

  if (listError) {
    console.error('Failed to list users:', listError)
    return
  }

  console.log('Users:', users)

  // POST request with typed body
  const { data: newUser, error: createError } = await api.api.v1.users.post({
    name: 'John Doe',
    email: 'john@example.com'
  })

  if (createError) {
    // Error is typed based on response schema
    console.error('Failed to create user:', createError)
    return
  }

  console.log('Created user:', newUser)

  // GET with path parameters
  const { data: user, error: getError } = await api.api.v1.users({ id: newUser.id }).get()

  if (getError) {
    if (getError.status === 404) {
      console.log('User not found')
    }
    return
  }

  console.log('User:', user)

  // PATCH request
  const { data: updated } = await api.api.v1.users({ id: newUser.id }).patch({
    name: 'Jane Doe'
  })

  console.log('Updated user:', updated)

  // DELETE request
  const { error: deleteError } = await api.api.v1.users({ id: newUser.id }).delete()

  if (!deleteError) {
    console.log('User deleted successfully')
  }
}

// WebSocket client with Eden
async function websocketExample() {
  const ws = api.ws.subscribe()

  ws.on('open', () => {
    console.log('Connected to WebSocket')

    ws.send({
      type: 'join',
      room: 'general',
      author: 'Client User'
    })
  })

  ws.on('message', (event) => {
    const data = JSON.parse(event.data)
    console.log('Received:', data)
  })

  ws.on('close', () => {
    console.log('Disconnected from WebSocket')
  })

  // Send a message after connection
  setTimeout(() => {
    ws.send({
      type: 'message',
      room: 'general',
      content: 'Hello from Eden client!',
      author: 'Client User'
    })
  }, 1000)
}

examples()
```

## Best Practices

### Project Structure

```
project/
├── src/
│   ├── index.ts              # Application entry point
│   ├── app.ts                # Elysia app configuration
│   ├── routes/
│   │   ├── index.ts          # Route aggregator
│   │   ├── users.ts          # User routes
│   │   ├── posts.ts          # Post routes
│   │   └── auth.ts           # Authentication routes
│   ├── plugins/
│   │   ├── auth.ts           # Authentication plugin
│   │   ├── logger.ts         # Logging plugin
│   │   └── rateLimit.ts      # Rate limiting plugin
│   ├── schemas/
│   │   ├── user.ts           # User schemas
│   │   ├── post.ts           # Post schemas
│   │   └── common.ts         # Shared schemas
│   ├── services/
│   │   ├── userService.ts    # User business logic
│   │   └── postService.ts    # Post business logic
│   ├── db/
│   │   ├── index.ts          # Database connection
│   │   └── migrations/       # Database migrations
│   └── utils/
│       ├── errors.ts         # Custom error classes
│       └── helpers.ts        # Utility functions
├── tests/
│   ├── routes/
│   │   └── users.test.ts
│   └── setup.ts
├── package.json
├── tsconfig.json
└── bunfig.toml
```

### Modular Route Organization

```typescript
// src/routes/users.ts
import { Elysia, t } from 'elysia'
import { UserSchema, CreateUserSchema } from '../schemas/user'
import { userService } from '../services/userService'
import { authPlugin } from '../plugins/auth'

export const userRoutes = new Elysia({ prefix: '/users' })
  .use(authPlugin)

  .get('/', async () => {
    return userService.findAll()
  }, {
    response: t.Array(UserSchema)
  })

  .get('/:id', async ({ params, error }) => {
    const user = await userService.findById(params.id)
    if (!user) return error(404, 'User not found')
    return user
  }, {
    params: t.Object({ id: t.String() }),
    response: UserSchema
  })

  .post('/', async ({ body }) => {
    return userService.create(body)
  }, {
    body: CreateUserSchema,
    response: UserSchema,
    isAuth: true  // Requires authentication
  })
```

```typescript
// src/routes/index.ts
import { Elysia } from 'elysia'
import { userRoutes } from './users'
import { postRoutes } from './posts'
import { authRoutes } from './auth'

export const routes = new Elysia({ prefix: '/api/v1' })
  .use(authRoutes)
  .use(userRoutes)
  .use(postRoutes)
```

### Error Handling

```typescript
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, 'NOT_FOUND', `${resource}${id ? ` with id ${id}` : ''} not found`)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message)
  }
}
```

```typescript
// src/plugins/errorHandler.ts
import { Elysia, t } from 'elysia'
import { AppError } from '../utils/errors'

export const errorHandler = new Elysia({ name: 'errorHandler' })
  .onError(({ error, set, code }) => {
    // Handle Elysia validation errors
    if (code === 'VALIDATION') {
      set.status = 400
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.all
        }
      }
    }

    // Handle custom application errors
    if (error instanceof AppError) {
      set.status = error.statusCode
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      }
    }

    // Handle unknown errors
    console.error('Unhandled error:', error)
    set.status = 500
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }
  })
```

### Testing Strategy

```typescript
// tests/routes/users.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { treaty } from '@elysiajs/eden'
import { app } from '../../src/app'

const api = treaty(app)

describe('User Routes', () => {
  let createdUserId: string

  describe('POST /api/v1/users', () => {
    it('should create a new user', async () => {
      const { data, error, status } = await api.api.v1.users.post({
        name: 'Test User',
        email: 'test@example.com'
      })

      expect(status).toBe(200)
      expect(error).toBeNull()
      expect(data).toHaveProperty('id')
      expect(data?.name).toBe('Test User')
      expect(data?.email).toBe('test@example.com')

      createdUserId = data!.id
    })

    it('should reject invalid email', async () => {
      const { error, status } = await api.api.v1.users.post({
        name: 'Test User',
        email: 'invalid-email'
      })

      expect(status).toBe(400)
      expect(error).not.toBeNull()
    })
  })

  describe('GET /api/v1/users/:id', () => {
    it('should return user by id', async () => {
      const { data, error, status } = await api.api.v1.users({ id: createdUserId }).get()

      expect(status).toBe(200)
      expect(error).toBeNull()
      expect(data?.id).toBe(createdUserId)
    })

    it('should return 404 for non-existent user', async () => {
      const { error, status } = await api.api.v1.users({ id: 'non-existent' }).get()

      expect(status).toBe(404)
      expect(error).not.toBeNull()
    })
  })

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete user', async () => {
      const { error, status } = await api.api.v1.users({ id: createdUserId }).delete()

      expect(status).toBe(204)
      expect(error).toBeNull()
    })
  })
})
```

## Common Pitfalls

### Type Inference Limitations

**Problem: Breaking the chain breaks type inference**

```typescript
// Wrong: Type inference is lost
const app = new Elysia()
app.get('/hello', () => 'Hello')
app.get('/world', () => 'World')

// Correct: Chain methods for proper inference
const app = new Elysia()
  .get('/hello', () => 'Hello')
  .get('/world', () => 'World')
```

**Problem: Using async without proper types**

```typescript
// Types may not infer correctly with complex async operations
// Solution: Explicitly type the return value
.get('/users', async (): Promise<User[]> => {
  return await db.users.findMany()
})
```

### Bun Compatibility Issues

**Not all Node.js packages work with Bun:**

```typescript
// Some packages may need polyfills or alternatives
// Check Bun compatibility before using

// Instead of node-fetch (not needed)
const response = await fetch('https://api.example.com')

// Bun has native SQLite
import { Database } from 'bun:sqlite'

// For packages requiring node: prefix
import { readFile } from 'node:fs/promises'
```

### Plugin Order Matters

```typescript
// Wrong: Auth check runs before logging
const app = new Elysia()
  .use(authPlugin)     // This runs first
  .use(loggerPlugin)   // This runs second

// Correct: Logger should typically run first
const app = new Elysia()
  .use(loggerPlugin)   // Log all requests
  .use(authPlugin)     // Then check auth
```

### Scope and Encapsulation

```typescript
// Variables defined in derive/resolve are scoped
const app = new Elysia()
  .derive(() => ({ sharedValue: 'available everywhere below' }))
  .guard({}, (app) => app
    .resolve(() => ({ scopedValue: 'only available in this guard' }))
    .get('/scoped', ({ scopedValue }) => scopedValue)  // Works
  )
  .get('/outside', ({ scopedValue }) => scopedValue)   // Error: scopedValue not available
```

### Deployment Considerations

```typescript
// Environment configuration
const app = new Elysia()
  .listen({
    port: process.env.PORT ?? 3000,
    hostname: process.env.HOST ?? '0.0.0.0',  // Important for containers

    // TLS configuration for production
    ...(process.env.NODE_ENV === 'production' && {
      tls: {
        key: Bun.file('./key.pem'),
        cert: Bun.file('./cert.pem')
      }
    })
  })

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...')
  app.stop()
  process.exit(0)
})
```

## Performance Considerations

### Bun's Performance Advantages

Bun provides significant performance improvements over Node.js:

| Operation | Bun | Node.js | Improvement |
|-----------|-----|---------|-------------|
| HTTP requests/sec | ~100k | ~30k | 3.3x |
| JSON parse | 15ms | 45ms | 3x |
| File read | 5ms | 18ms | 3.6x |
| SQLite query | 2ms | 8ms | 4x |

### Benchmark Results

Elysia consistently ranks among the top performers in web framework benchmarks:

```
Framework          Requests/sec    Latency (avg)
─────────────────────────────────────────────────
Elysia             105,432         0.95ms
Hono (Bun)         98,234          1.02ms
Fastify            45,678          2.19ms
Express            23,456          4.26ms
```

### Optimization Techniques

**1. Use Static Responses When Possible**

```typescript
// Static responses are faster than dynamic
const app = new Elysia()
  .get('/static', 'Hello World')  // Optimized
  .get('/dynamic', () => 'Hello World')  // Slightly slower
```

**2. Avoid Unnecessary Validation**

```typescript
// Only validate what you need
.post('/user', ({ body }) => createUser(body), {
  body: t.Object({
    name: t.String(),
    email: t.String()  // Skip format validation if not needed
  })
})
```

**3. Use Compile-time Optimization**

```typescript
// Elysia compiles routes at startup
const app = new Elysia({ precompile: true })
```

**4. Connection Pooling**

```typescript
// Reuse database connections
import { Database } from 'bun:sqlite'

const db = new Database('app.db', { create: true })

const app = new Elysia()
  .decorate('db', db)  // Single connection, reused
```

**5. Response Streaming**

```typescript
// Stream large responses
.get('/stream', function* () {
  for (let i = 0; i < 1000; i++) {
    yield `data: ${i}\n`
  }
})
```

## Real-World Scenarios

### API Service

```typescript
// Production-ready API service
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'
import { rateLimit } from 'elysia-rate-limit'

const app = new Elysia()
  // Documentation
  .use(swagger({
    path: '/docs',
    documentation: {
      info: { title: 'Production API', version: '1.0.0' },
      tags: [
        { name: 'Users', description: 'User operations' },
        { name: 'Auth', description: 'Authentication' }
      ]
    }
  }))

  // Security
  .use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true
  }))
  .use(rateLimit({
    max: 100,
    duration: 60000
  }))

  // Health check
  .get('/health', () => ({ status: 'ok', timestamp: Date.now() }))

  // API routes
  .use(routes)

  .listen(3000)
```

### Real-time Application

```typescript
// Real-time collaboration service
import { Elysia, t } from 'elysia'

interface Document {
  id: string
  content: string
  version: number
  lastModified: number
}

const documents = new Map<string, Document>()
const documentSubscribers = new Map<string, Set<string>>()

const app = new Elysia()
  .ws('/collaborate/:docId', {
    params: t.Object({ docId: t.String() }),
    body: t.Object({
      type: t.Union([t.Literal('edit'), t.Literal('cursor')]),
      position: t.Optional(t.Object({ line: t.Number(), column: t.Number() })),
      content: t.Optional(t.String()),
      version: t.Optional(t.Number())
    }),

    open(ws) {
      const { docId } = ws.data.params
      ws.subscribe(`doc:${docId}`)

      // Track subscriber
      if (!documentSubscribers.has(docId)) {
        documentSubscribers.set(docId, new Set())
      }
      documentSubscribers.get(docId)!.add(ws.id)

      // Send current document state
      const doc = documents.get(docId)
      if (doc) {
        ws.send(JSON.stringify({ type: 'sync', document: doc }))
      }
    },

    message(ws, message) {
      const { docId } = ws.data.params

      if (message.type === 'edit' && message.content !== undefined) {
        // Optimistic concurrency control
        const doc = documents.get(docId)
        if (doc && message.version !== doc.version) {
          ws.send(JSON.stringify({
            type: 'conflict',
            serverVersion: doc.version,
            serverContent: doc.content
          }))
          return
        }

        // Apply edit
        const updated: Document = {
          id: docId,
          content: message.content,
          version: (doc?.version ?? 0) + 1,
          lastModified: Date.now()
        }
        documents.set(docId, updated)

        // Broadcast to all collaborators
        ws.publish(`doc:${docId}`, JSON.stringify({
          type: 'edit',
          content: message.content,
          version: updated.version,
          author: ws.id
        }))
      }

      if (message.type === 'cursor' && message.position) {
        // Broadcast cursor position
        ws.publish(`doc:${docId}`, JSON.stringify({
          type: 'cursor',
          position: message.position,
          userId: ws.id
        }))
      }
    },

    close(ws) {
      const { docId } = ws.data.params
      documentSubscribers.get(docId)?.delete(ws.id)

      ws.publish(`doc:${docId}`, JSON.stringify({
        type: 'leave',
        userId: ws.id
      }))
    }
  })
  .listen(3000)
```

### Microservices Communication

```typescript
// Service A: User Service
import { Elysia, t } from 'elysia'

export const userService = new Elysia({ prefix: '/users' })
  .get('/:id', async ({ params }) => {
    // Fetch from database
    return { id: params.id, name: 'John', email: 'john@example.com' }
  })
  .post('/', async ({ body }) => {
    // Create user
    return { id: crypto.randomUUID(), ...body }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String()
    })
  })

// Service B: Order Service (consumes User Service)
import { treaty } from '@elysiajs/eden'
import type { userService } from './userService'

type UserService = typeof userService

const userClient = treaty<UserService>('http://user-service:3000')

export const orderService = new Elysia({ prefix: '/orders' })
  .post('/', async ({ body }) => {
    // Verify user exists
    const { data: user, error } = await userClient.users({ id: body.userId }).get()

    if (error) {
      throw new Error('User not found')
    }

    // Create order
    return {
      id: crypto.randomUUID(),
      userId: body.userId,
      userName: user.name,
      items: body.items,
      createdAt: new Date()
    }
  }, {
    body: t.Object({
      userId: t.String(),
      items: t.Array(t.Object({
        productId: t.String(),
        quantity: t.Number()
      }))
    })
  })
```

## Interview Questions

### Basic Questions

**Q: What is Elysia and how does it differ from Express?**

A: Elysia is a TypeScript web framework designed for the Bun runtime, emphasizing end-to-end type safety without code generation. Unlike Express, which requires manual type definitions, Elysia automatically infers types throughout the application, including to the client via Eden Treaty. Elysia also offers significantly better performance due to Bun's optimizations.

**Q: What is Eden Treaty?**

A: Eden Treaty is Elysia's companion library that creates a fully typed HTTP client from your server definition. It weighs less than 2KB and requires no code generation. When you change your API definition, the types automatically propagate to your client code, enabling true end-to-end type safety.

**Q: Explain the lifecycle hooks in Elysia.**

A: Elysia has seven main lifecycle hooks:
1. `onRequest` - Earliest interception point
2. `onParse` - Custom body parsing
3. `onTransform` - Modify context before validation
4. `onBeforeHandle` - Pre-handler logic (auth, validation)
5. `onAfterHandle` - Post-handler processing
6. `onMapResponse` - Transform final response
7. `onError` - Global error handling

### Intermediate Questions

**Q: What's the difference between `state`, `decorate`, `derive`, and `resolve`?**

A:
- `state`: Mutable shared state accessible via `store`, persists across requests
- `decorate`: Immutable utilities/services added to context, global scope
- `derive`: Computes values per-request, synchronously, available in all routes below
- `resolve`: Like derive but async and scoped to guards, used for authenticated contexts

**Q: How does Elysia achieve type safety without code generation?**

A: Elysia uses TypeScript's const generics and type inference. Each method call returns a new type that includes all previous definitions. The route handlers, schemas, and middleware all contribute to a single inferred type that describes the entire API surface. Eden then uses this type to create a typed client.

### Advanced Questions

**Q: How would you handle authentication in Elysia?**

A: Create an auth plugin using `derive` for token extraction and a macro for route-level protection:

```typescript
const authPlugin = new Elysia()
  .derive(({ headers }) => ({
    token: headers.authorization?.replace('Bearer ', '')
  }))
  .macro({
    isAuth: (enabled) => ({
      beforeHandle: async ({ token, set }) => {
        if (enabled && !token) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        // Validate token and attach user
      }
    })
  })
```

**Q: How do you ensure type safety in WebSocket communications?**

A: Define schemas for both `body` (incoming messages) and `response` (outgoing messages):

```typescript
.ws('/chat', {
  body: t.Object({
    type: t.Literal('message'),
    content: t.String()
  }),
  response: t.Object({
    type: t.String(),
    content: t.String(),
    timestamp: t.Number()
  }),
  message(ws, message) {
    // message is typed, ws.send is typed
  }
})
```

**Q: What are the deployment considerations for Elysia?**

A: Key considerations include:
- Bun runtime required (not Node.js)
- Container images should use `oven/bun` base image
- Set `hostname: '0.0.0.0'` for container networking
- Configure graceful shutdown handlers
- Ensure all dependencies are Bun-compatible
- Use environment variables for configuration
- Consider Bun's built-in clustering for multi-core usage

## Further Reading

### Official Resources

- [Elysia Official Documentation](https://elysiajs.com/)
- [Eden Treaty Documentation](https://elysiajs.com/eden/overview)
- [Elysia GitHub Repository](https://github.com/elysiajs/elysia)
- [Bun Official Documentation](https://bun.sh/docs)

### Bun Ecosystem

- [Bun Runtime Guide](https://bun.sh/docs/runtime/bun-apis)
- [Bun SQLite](https://bun.sh/docs/api/sqlite)
- [Bun Test Runner](https://bun.sh/docs/test/writing)

### Community Resources

- [Elysia Discord Server](https://discord.gg/elysia)
- [Awesome Elysia](https://github.com/elysiajs/awesome-elysia)
- [Elysia Plugins Collection](https://elysiajs.com/plugins/overview)

### Related Technologies

- [TypeBox Documentation](https://github.com/sinclairzx81/typebox)
- [Hono Framework](https://hono.dev/) (Multi-runtime alternative)
- [tRPC](https://trpc.io/) (Alternative type-safe API approach)

By mastering Elysia, you gain access to one of the most performant and type-safe web frameworks available, perfectly suited for building modern APIs in the Bun ecosystem.
