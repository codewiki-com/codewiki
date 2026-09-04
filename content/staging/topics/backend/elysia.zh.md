---
title: Elysia 框架 (Bun 生态)
description: Elysia 全面指南 - 使用 Bun 构建类型安全 API 的优雅 Web 框架
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
origin: old/src/content/docs/backend/elysia.zh.md
divergence: 0.223
issues: []
legacy:
  category: Backend
  subcategory: Web Frameworks
  order: 33
  lastUpdated: 2026-01-20
---

Elysia 是一个专为 Bun 运行时设计的优雅 Web 框架，无需代码生成即可提供前所未有的端到端类型安全。该框架从底层使用 TypeScript 构建，利用 Bun 的卓越性能打造出目前最快的 Web 框架之一，同时保持出色的开发者体验。本文将介绍如何使用 Elysia 的强大功能（包括 Eden Treaty、生命周期钩子和实时 WebSocket 支持）来构建类型安全的高性能 API。

## 什么是 Elysia？

Elysia 是一个运行在 Bun 上的 TypeScript Web 框架，围绕三个核心原则设计：**人体工程学**、**类型安全**和**高性能**。与需要手动类型定义或代码生成来实现类型安全的传统框架不同，Elysia 在整个应用程序栈中自动推断类型。

### 为什么选择 Bun 生态？

Bun 是一个集成了打包器、转译器和包管理器的全能 JavaScript 运行时。它具有多项优势，使其成为 Elysia 的理想基础：

| 特性 | Bun 优势 |
|---------|---------------|
| **启动时间** | 比 Node.js 快 4 倍 |
| **HTTP 性能** | 原生 HTTP 服务器性能超越 Node.js |
| **TypeScript** | 原生执行 TypeScript，无需编译步骤 |
| **包管理** | 最快的 npm 兼容包管理器 |
| **SQLite** | 内置 SQLite 驱动 |
| **文件 I/O** | 优化的文件系统操作 |

### Elysia vs Express vs Hono

| 特性 | Elysia | Express | Hono |
|---------|--------|---------|------|
| **运行时** | Bun | Node.js | 多运行时 |
| **类型安全** | 端到端（自动） | 手动 | 部分 |
| **性能** | 优秀 | 良好 | 非常好 |
| **代码生成** | 不需要 | 不适用 | 不需要 |
| **包大小** | ~2KB (Eden) | 不适用 | ~14KB |
| **WebSocket** | 原生支持 | 需要 socket.io | 有限 |
| **OpenAPI** | 内置 | 手动/Swagger | 插件 |

Elysia 的核心差异化优势是**无需代码生成的端到端类型安全**。当你修改 API 时，类型会通过 Eden Treaty 自动传播到客户端代码。

## 核心原理

### 类型推断系统

Elysia 的类型系统通过 TypeScript 的类型推断工作，允许框架自动从路由定义中派生类型：

```typescript
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .get('/user/:id', ({ params }) => {
    // params.id 自动推断为 string 类型
    return { userId: params.id }
  })
  .post('/user', ({ body }) => {
    // body 基于 schema 自动推断类型
    return { created: body.name }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String({ format: 'email' }),
      age: t.Number({ minimum: 0 })
    })
  })
```

这种魔法之所以能实现，是因为 Elysia 使用 **const 泛型** 在整个调用链中保留字面量类型。每个方法调用都返回一个包含所有先前路由定义的新类型。

### Eden Treaty：端到端类型安全

Eden 是 Elysia 的配套库，可以从服务器定义创建完全类型化的客户端。它的体积不到 2KB，且无需代码生成：

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

// 完整的类型安全和自动补全
const { data, error } = await api.mirror.post({
  message: 'Hello World'  // TypeScript 强制执行此数据结构
})

if (error) {
  console.error(error)
} else {
  console.log(data.message)  // data 被推断为 { message: string }
}
```

### 生命周期钩子

Elysia 提供了完整的请求处理生命周期系统：

```
请求 → onRequest → onParse → onTransform → onBeforeHandle → Handler → onAfterHandle → onMapResponse → 响应
                                                                    ↓
                                                              onError (任何错误时)
```

| 钩子 | 用途 | 使用场景 |
|------|---------|----------|
| `onRequest` | 最早的拦截点 | 日志记录、速率限制 |
| `onParse` | 自定义请求体解析 | XML、Protocol Buffers |
| `onTransform` | 验证前修改上下文 | 数据规范化 |
| `onBeforeHandle` | 处理器前逻辑 | 认证、授权 |
| `onAfterHandle` | 处理器后处理 | 响应转换 |
| `onMapResponse` | 转换最终响应 | 压缩、格式化 |
| `onError` | 错误处理 | 自定义错误响应 |

## 核心要点

### 路由定义

Elysia 支持所有 HTTP 方法，并提供流畅的链式 API：

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
  // 基础路由
  .get('/hello', () => 'Hello World')
  .post('/users', ({ body }) => createUser(body))
  .put('/users/:id', ({ params, body }) => updateUser(params.id, body))
  .patch('/users/:id', ({ params, body }) => patchUser(params.id, body))
  .delete('/users/:id', ({ params }) => deleteUser(params.id))

  // 处理所有 HTTP 方法的路由
  .all('/any', () => 'Handles all methods')

  // 自定义方法
  .route('CUSTOM', '/custom', () => 'Custom method')

  // 通配符路由
  .get('/files/*', ({ params }) => {
    // params['*'] 包含路径的剩余部分
    return `File: ${params['*']}`
  })
  .listen(3000)
```

### 使用 TypeBox 验证

Elysia 使用 TypeBox 进行模式验证，提供运行时验证和编译时类型推断：

```typescript
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .post('/user', ({ body, query, params, headers }) => {
    // 所有输入都经过验证和类型化
    return { success: true, user: body }
  }, {
    // 请求体验证
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

    // 查询参数验证
    query: t.Object({
      include: t.Optional(t.String())
    }),

    // 路径参数验证
    params: t.Object({
      // 如果路由是 /user/:id
      // id: t.String()
    }),

    // 请求头验证
    headers: t.Object({
      authorization: t.String()
    }),

    // 响应验证（可选但推荐）
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

### 自定义类型定义

TypeBox 提供了丰富的类型定义：

```typescript
import { t } from 'elysia'

// 原始类型
const stringType = t.String()
const numberType = t.Number()
const booleanType = t.Boolean()
const nullType = t.Null()

// 字符串约束
const email = t.String({ format: 'email' })
const uuid = t.String({ format: 'uuid' })
const url = t.String({ format: 'uri' })
const pattern = t.String({ pattern: '^[A-Z]{2}[0-9]{4}$' })

// 数字约束
const positiveInt = t.Integer({ minimum: 1 })
const percentage = t.Number({ minimum: 0, maximum: 100 })

// 复杂类型
const nullable = t.Union([t.String(), t.Null()])
const optional = t.Optional(t.String())
const literal = t.Literal('specific-value')
const enumType = t.Union([
  t.Literal('pending'),
  t.Literal('active'),
  t.Literal('completed')
])

// 数组和对象
const stringArray = t.Array(t.String())
const nestedObject = t.Object({
  user: t.Object({
    profile: t.Object({
      bio: t.String()
    })
  })
})

// Record 类型（动态键）
const record = t.Record(t.String(), t.Number())

// 递归类型
const category: any = t.Object({
  name: t.String(),
  children: t.Array(t.Ref(category))
})
```

### 中间件和插件

Elysia 使用插件系统进行代码组织和复用：

```typescript
import { Elysia } from 'elysia'

// 创建可复用的插件
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

// 创建日志插件
const loggerPlugin = new Elysia({ name: 'logger' })
  .onRequest(({ request }) => {
    console.log(`${request.method} ${request.url}`)
  })
  .onAfterHandle(({ request, set }) => {
    console.log(`${request.method} ${request.url} - ${set.status}`)
  })

// 在主应用中使用插件
const app = new Elysia()
  .use(loggerPlugin)
  .use(authPlugin)
  .get('/public', () => 'Public endpoint')
  .get('/private', () => 'Private endpoint', {
    isAuth: true  // 来自 authPlugin 的宏
  })
  .listen(3000)
```

### 使用 State、Decorate 和 Derive 进行依赖注入

Elysia 提供三种机制在处理器之间共享数据：

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
  // state: 可变共享状态（全局）
  .state('version', '1.0.0')
  .state('requestCount', 0)

  // decorate: 不可变的工具/服务（全局）
  .decorate('db', new DatabaseClient())
  .decorate('logger', new Logger())

  // derive: 每请求计算的值
  .derive(({ headers }) => ({
    userAgent: headers['user-agent'] ?? 'Unknown',
    requestId: crypto.randomUUID()
  }))

  // resolve: 每请求异步解析（在 guard 作用域内）
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

### WebSocket 支持

Elysia 提供一流的 WebSocket 支持，具有相同的类型安全：

```typescript
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .ws('/chat', {
    // 消息模式验证
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

    // 连接打开
    open(ws) {
      console.log('Client connected:', ws.id)
    },

    // 收到消息
    message(ws, message) {
      const response = {
        type: message.type,
        content: message.content,
        from: ws.id,
        timestamp: Date.now()
      }

      // 发送到特定房间
      ws.publish(message.room, response)

      // 订阅房间
      if (message.type === 'join') {
        ws.subscribe(message.room)
      }
    },

    // 连接关闭
    close(ws) {
      console.log('Client disconnected:', ws.id)
    }
  })
  .listen(3000)
```

## 代码示例

### 完整的 REST API 示例

```typescript
// src/index.ts
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'

// 类型
interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

// 内存数据库（实际使用时替换为真实数据库）
const users = new Map<string, User>()

// Schema 定义
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

// 错误响应
const NotFoundSchema = t.Object({
  error: t.String(),
  message: t.String()
})

// 应用程序
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

  // 错误处理
  .onError(({ error, set }) => {
    console.error(error)

    if (error.message === 'NOT_FOUND') {
      set.status = 404
      return { error: 'Not Found', message: 'Resource not found' }
    }

    set.status = 500
    return { error: 'Internal Server Error', message: 'Something went wrong' }
  })

  // 路由
  .group('/api/v1/users', (app) => app
    // 列出所有用户
    .get('/', () => Array.from(users.values()), {
      response: t.Array(UserSchema),
      detail: {
        summary: '列出所有用户',
        tags: ['Users']
      }
    })

    // 根据 ID 获取用户
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
        summary: '根据 ID 获取用户',
        tags: ['Users']
      }
    })

    // 创建用户
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
        summary: '创建新用户',
        tags: ['Users']
      }
    })

    // 更新用户
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
        summary: '更新用户',
        tags: ['Users']
      }
    })

    // 删除用户
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
        summary: '删除用户',
        tags: ['Users']
      }
    })
  )
  .listen(3000)

console.log(`服务器运行在 http://localhost:${app.server?.port}`)
console.log(`Swagger 文档位于 http://localhost:${app.server?.port}/swagger`)

export type App = typeof app
```

### WebSocket 实时应用

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
      console.log(`WebSocket 已连接: ${ws.id}`)
      ws.data = { rooms: new Set<string>(), author: '' }
    },

    message(ws, message) {
      const { type, room, content, author } = message

      // 确保房间存在
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

          // 广播加入通知
          ws.publish(room, JSON.stringify({
            type: 'system',
            content: `${author} 加入了房间`,
            timestamp: Date.now()
          }))

          // 向新用户发送房间历史记录
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
            content: `${author} 离开了房间`,
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

            // 只保留最后 1000 条消息
            if (roomState.messages.length > 1000) {
              roomState.messages = roomState.messages.slice(-1000)
            }

            // 广播给所有房间订阅者
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
      // 清理：离开所有房间
      for (const room of ws.data.rooms) {
        const roomState = rooms.get(room)
        if (roomState && ws.data.author) {
          roomState.users.delete(ws.data.author)
          ws.publish(room, JSON.stringify({
            type: 'system',
            content: `${ws.data.author} 已断开连接`,
            timestamp: Date.now()
          }))
        }
      }
      console.log(`WebSocket 已断开: ${ws.id}`)
    }
  })
  .listen(3000)

export type App = typeof app
```

### Eden 客户端集成

```typescript
// src/client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from './index'

// 创建类型化客户端
const api = treaty<App>('localhost:3000')

// 使用示例
async function examples() {
  // 带自动补全的 GET 请求
  const { data: users, error: listError } = await api.api.v1.users.get()

  if (listError) {
    console.error('列出用户失败:', listError)
    return
  }

  console.log('用户列表:', users)

  // 带类型化请求体的 POST 请求
  const { data: newUser, error: createError } = await api.api.v1.users.post({
    name: 'John Doe',
    email: 'john@example.com'
  })

  if (createError) {
    // 错误基于响应 schema 进行类型化
    console.error('创建用户失败:', createError)
    return
  }

  console.log('已创建用户:', newUser)

  // 带路径参数的 GET 请求
  const { data: user, error: getError } = await api.api.v1.users({ id: newUser.id }).get()

  if (getError) {
    if (getError.status === 404) {
      console.log('用户未找到')
    }
    return
  }

  console.log('用户:', user)

  // PATCH 请求
  const { data: updated } = await api.api.v1.users({ id: newUser.id }).patch({
    name: 'Jane Doe'
  })

  console.log('已更新用户:', updated)

  // DELETE 请求
  const { error: deleteError } = await api.api.v1.users({ id: newUser.id }).delete()

  if (!deleteError) {
    console.log('用户删除成功')
  }
}

// 使用 Eden 的 WebSocket 客户端
async function websocketExample() {
  const ws = api.ws.subscribe()

  ws.on('open', () => {
    console.log('已连接到 WebSocket')

    ws.send({
      type: 'join',
      room: 'general',
      author: 'Client User'
    })
  })

  ws.on('message', (event) => {
    const data = JSON.parse(event.data)
    console.log('收到消息:', data)
  })

  ws.on('close', () => {
    console.log('已断开 WebSocket 连接')
  })

  // 连接后发送消息
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

## 最佳实践

### 项目结构

```
project/
├── src/
│   ├── index.ts              # 应用程序入口
│   ├── app.ts                # Elysia 应用配置
│   ├── routes/
│   │   ├── index.ts          # 路由聚合器
│   │   ├── users.ts          # 用户路由
│   │   ├── posts.ts          # 文章路由
│   │   └── auth.ts           # 认证路由
│   ├── plugins/
│   │   ├── auth.ts           # 认证插件
│   │   ├── logger.ts         # 日志插件
│   │   └── rateLimit.ts      # 速率限制插件
│   ├── schemas/
│   │   ├── user.ts           # 用户 schema
│   │   ├── post.ts           # 文章 schema
│   │   └── common.ts         # 共享 schema
│   ├── services/
│   │   ├── userService.ts    # 用户业务逻辑
│   │   └── postService.ts    # 文章业务逻辑
│   ├── db/
│   │   ├── index.ts          # 数据库连接
│   │   └── migrations/       # 数据库迁移
│   └── utils/
│       ├── errors.ts         # 自定义错误类
│       └── helpers.ts        # 工具函数
├── tests/
│   ├── routes/
│   │   └── users.test.ts
│   └── setup.ts
├── package.json
├── tsconfig.json
└── bunfig.toml
```

### 模块化路由组织

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
    isAuth: true  // 需要认证
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

### 错误处理

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
    // 处理 Elysia 验证错误
    if (code === 'VALIDATION') {
      set.status = 400
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '验证失败',
          details: error.all
        }
      }
    }

    // 处理自定义应用错误
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

    // 处理未知错误
    console.error('未处理的错误:', error)
    set.status = 500
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '发生意外错误'
      }
    }
  })
```

### 测试策略

```typescript
// tests/routes/users.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { treaty } from '@elysiajs/eden'
import { app } from '../../src/app'

const api = treaty(app)

describe('User Routes', () => {
  let createdUserId: string

  describe('POST /api/v1/users', () => {
    it('应该创建新用户', async () => {
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

    it('应该拒绝无效的邮箱', async () => {
      const { error, status } = await api.api.v1.users.post({
        name: 'Test User',
        email: 'invalid-email'
      })

      expect(status).toBe(400)
      expect(error).not.toBeNull()
    })
  })

  describe('GET /api/v1/users/:id', () => {
    it('应该根据 id 返回用户', async () => {
      const { data, error, status } = await api.api.v1.users({ id: createdUserId }).get()

      expect(status).toBe(200)
      expect(error).toBeNull()
      expect(data?.id).toBe(createdUserId)
    })

    it('对于不存在的用户应该返回 404', async () => {
      const { error, status } = await api.api.v1.users({ id: 'non-existent' }).get()

      expect(status).toBe(404)
      expect(error).not.toBeNull()
    })
  })

  describe('DELETE /api/v1/users/:id', () => {
    it('应该删除用户', async () => {
      const { error, status } = await api.api.v1.users({ id: createdUserId }).delete()

      expect(status).toBe(204)
      expect(error).toBeNull()
    })
  })
})
```

## 常见陷阱

### 类型推断限制

**问题：断开链式调用会破坏类型推断**

```typescript
// 错误：类型推断丢失
const app = new Elysia()
app.get('/hello', () => 'Hello')
app.get('/world', () => 'World')

// 正确：使用链式方法确保正确推断
const app = new Elysia()
  .get('/hello', () => 'Hello')
  .get('/world', () => 'World')
```

**问题：使用 async 时类型可能无法正确推断**

```typescript
// 复杂异步操作的类型可能无法正确推断
// 解决方案：显式声明返回类型
.get('/users', async (): Promise<User[]> => {
  return await db.users.findMany()
})
```

### Bun 兼容性问题

**并非所有 Node.js 包都能在 Bun 上工作：**

```typescript
// 某些包可能需要 polyfill 或替代方案
// 使用前请检查 Bun 兼容性

// 不需要 node-fetch
const response = await fetch('https://api.example.com')

// Bun 有原生 SQLite 支持
import { Database } from 'bun:sqlite'

// 对于需要 node: 前缀的包
import { readFile } from 'node:fs/promises'
```

### 插件顺序很重要

```typescript
// 错误：认证检查在日志之前运行
const app = new Elysia()
  .use(authPlugin)     // 这个先运行
  .use(loggerPlugin)   // 这个后运行

// 正确：日志通常应该先运行
const app = new Elysia()
  .use(loggerPlugin)   // 记录所有请求
  .use(authPlugin)     // 然后检查认证
```

### 作用域和封装

```typescript
// 在 derive/resolve 中定义的变量是有作用域的
const app = new Elysia()
  .derive(() => ({ sharedValue: '在下面所有地方都可用' }))
  .guard({}, (app) => app
    .resolve(() => ({ scopedValue: '只在这个 guard 中可用' }))
    .get('/scoped', ({ scopedValue }) => scopedValue)  // 正常工作
  )
  .get('/outside', ({ scopedValue }) => scopedValue)   // 错误：scopedValue 不可用
```

### 部署注意事项

```typescript
// 环境配置
const app = new Elysia()
  .listen({
    port: process.env.PORT ?? 3000,
    hostname: process.env.HOST ?? '0.0.0.0',  // 容器网络需要这个

    // 生产环境的 TLS 配置
    ...(process.env.NODE_ENV === 'production' && {
      tls: {
        key: Bun.file('./key.pem'),
        cert: Bun.file('./cert.pem')
      }
    })
  })

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('正在关闭...')
  app.stop()
  process.exit(0)
})
```

## 性能考量

### Bun 的性能优势

Bun 相比 Node.js 提供了显著的性能提升：

| 操作 | Bun | Node.js | 提升 |
|-----------|-----|---------|-------------|
| HTTP 请求/秒 | ~100k | ~30k | 3.3 倍 |
| JSON 解析 | 15ms | 45ms | 3 倍 |
| 文件读取 | 5ms | 18ms | 3.6 倍 |
| SQLite 查询 | 2ms | 8ms | 4 倍 |

### 基准测试结果

Elysia 在 Web 框架基准测试中始终名列前茅：

```
框架               请求/秒         平均延迟
─────────────────────────────────────────────────
Elysia             105,432         0.95ms
Hono (Bun)         98,234          1.02ms
Fastify            45,678          2.19ms
Express            23,456          4.26ms
```

### 优化技巧

**1. 尽可能使用静态响应**

```typescript
// 静态响应更快
const app = new Elysia()
  .get('/static', 'Hello World')  // 已优化
  .get('/dynamic', () => 'Hello World')  // 稍慢
```

**2. 避免不必要的验证**

```typescript
// 只验证你需要的
.post('/user', ({ body }) => createUser(body), {
  body: t.Object({
    name: t.String(),
    email: t.String()  // 如果不需要可以跳过格式验证
  })
})
```

**3. 使用编译时优化**

```typescript
// Elysia 在启动时编译路由
const app = new Elysia({ precompile: true })
```

**4. 连接池**

```typescript
// 复用数据库连接
import { Database } from 'bun:sqlite'

const db = new Database('app.db', { create: true })

const app = new Elysia()
  .decorate('db', db)  // 单一连接，复用
```

**5. 响应流式传输**

```typescript
// 流式传输大响应
.get('/stream', function* () {
  for (let i = 0; i < 1000; i++) {
    yield `data: ${i}\n`
  }
})
```

## 实战场景

### API 服务

```typescript
// 生产就绪的 API 服务
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'
import { rateLimit } from 'elysia-rate-limit'

const app = new Elysia()
  // 文档
  .use(swagger({
    path: '/docs',
    documentation: {
      info: { title: 'Production API', version: '1.0.0' },
      tags: [
        { name: 'Users', description: '用户操作' },
        { name: 'Auth', description: '认证' }
      ]
    }
  }))

  // 安全
  .use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true
  }))
  .use(rateLimit({
    max: 100,
    duration: 60000
  }))

  // 健康检查
  .get('/health', () => ({ status: 'ok', timestamp: Date.now() }))

  // API 路由
  .use(routes)

  .listen(3000)
```

### 实时应用

```typescript
// 实时协作服务
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

      // 追踪订阅者
      if (!documentSubscribers.has(docId)) {
        documentSubscribers.set(docId, new Set())
      }
      documentSubscribers.get(docId)!.add(ws.id)

      // 发送当前文档状态
      const doc = documents.get(docId)
      if (doc) {
        ws.send(JSON.stringify({ type: 'sync', document: doc }))
      }
    },

    message(ws, message) {
      const { docId } = ws.data.params

      if (message.type === 'edit' && message.content !== undefined) {
        // 乐观并发控制
        const doc = documents.get(docId)
        if (doc && message.version !== doc.version) {
          ws.send(JSON.stringify({
            type: 'conflict',
            serverVersion: doc.version,
            serverContent: doc.content
          }))
          return
        }

        // 应用编辑
        const updated: Document = {
          id: docId,
          content: message.content,
          version: (doc?.version ?? 0) + 1,
          lastModified: Date.now()
        }
        documents.set(docId, updated)

        // 广播给所有协作者
        ws.publish(`doc:${docId}`, JSON.stringify({
          type: 'edit',
          content: message.content,
          version: updated.version,
          author: ws.id
        }))
      }

      if (message.type === 'cursor' && message.position) {
        // 广播光标位置
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

### 微服务通信

```typescript
// 服务 A：用户服务
import { Elysia, t } from 'elysia'

export const userService = new Elysia({ prefix: '/users' })
  .get('/:id', async ({ params }) => {
    // 从数据库获取
    return { id: params.id, name: 'John', email: 'john@example.com' }
  })
  .post('/', async ({ body }) => {
    // 创建用户
    return { id: crypto.randomUUID(), ...body }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String()
    })
  })

// 服务 B：订单服务（消费用户服务）
import { treaty } from '@elysiajs/eden'
import type { userService } from './userService'

type UserService = typeof userService

const userClient = treaty<UserService>('http://user-service:3000')

export const orderService = new Elysia({ prefix: '/orders' })
  .post('/', async ({ body }) => {
    // 验证用户存在
    const { data: user, error } = await userClient.users({ id: body.userId }).get()

    if (error) {
      throw new Error('用户未找到')
    }

    // 创建订单
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

## 面试要点

### 基础问题

**问：什么是 Elysia，它与 Express 有什么区别？**

答：Elysia 是一个专为 Bun 运行时设计的 TypeScript Web 框架，强调无需代码生成的端到端类型安全。与需要手动类型定义的 Express 不同，Elysia 在整个应用程序中自动推断类型，包括通过 Eden Treaty 传递到客户端。由于 Bun 的优化，Elysia 还提供明显更好的性能。

**问：什么是 Eden Treaty？**

答：Eden Treaty 是 Elysia 的配套库，可以从服务器定义创建完全类型化的 HTTP 客户端。它的体积不到 2KB，无需代码生成。当你更改 API 定义时，类型会自动传播到客户端代码，实现真正的端到端类型安全。

**问：解释 Elysia 中的生命周期钩子。**

答：Elysia 有七个主要的生命周期钩子：
1. `onRequest` - 最早的拦截点
2. `onParse` - 自定义请求体解析
3. `onTransform` - 验证前修改上下文
4. `onBeforeHandle` - 处理器前逻辑（认证、验证）
5. `onAfterHandle` - 处理器后处理
6. `onMapResponse` - 转换最终响应
7. `onError` - 全局错误处理

### 中级问题

**问：`state`、`decorate`、`derive` 和 `resolve` 有什么区别？**

答：
- `state`：可变的共享状态，通过 `store` 访问，在请求之间持久化
- `decorate`：添加到上下文的不可变工具/服务，全局作用域
- `derive`：每个请求同步计算的值，在下面所有路由中可用
- `resolve`：类似 derive 但是异步的，作用域限于 guard，用于认证上下文

**问：Elysia 如何在不需要代码生成的情况下实现类型安全？**

答：Elysia 使用 TypeScript 的 const 泛型和类型推断。每个方法调用返回一个包含所有先前定义的新类型。路由处理器、schema 和中间件都贡献到描述整个 API 表面的单一推断类型。然后 Eden 使用这个类型创建类型化的客户端。

### 高级问题

**问：如何在 Elysia 中处理认证？**

答：使用 `derive` 提取令牌并使用宏进行路由级保护来创建认证插件：

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
        // 验证令牌并附加用户
      }
    })
  })
```

**问：如何确保 WebSocket 通信中的类型安全？**

答：为 `body`（传入消息）和 `response`（传出消息）定义 schema：

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
    // message 是类型化的，ws.send 也是类型化的
  }
})
```

**问：Elysia 的部署注意事项有哪些？**

答：关键注意事项包括：
- 需要 Bun 运行时（不是 Node.js）
- 容器镜像应使用 `oven/bun` 基础镜像
- 为容器网络设置 `hostname: '0.0.0.0'`
- 配置优雅关闭处理程序
- 确保所有依赖项与 Bun 兼容
- 使用环境变量进行配置
- 考虑使用 Bun 内置的集群功能实现多核利用

## 延伸阅读

### 官方资源

- [Elysia 官方文档](https://elysiajs.com/)
- [Eden Treaty 文档](https://elysiajs.com/eden/overview)
- [Elysia GitHub 仓库](https://github.com/elysiajs/elysia)
- [Bun 官方文档](https://bun.sh/docs)

### Bun 生态

- [Bun 运行时指南](https://bun.sh/docs/runtime/bun-apis)
- [Bun SQLite](https://bun.sh/docs/api/sqlite)
- [Bun 测试运行器](https://bun.sh/docs/test/writing)

### 社区资源

- [Elysia Discord 服务器](https://discord.gg/elysia)
- [Awesome Elysia](https://github.com/elysiajs/awesome-elysia)
- [Elysia 插件集合](https://elysiajs.com/plugins/overview)

### 相关技术

- [TypeBox 文档](https://github.com/sinclairzx81/typebox)
- [Hono 框架](https://hono.dev/)（多运行时替代方案）
- [tRPC](https://trpc.io/)（替代的类型安全 API 方案）

掌握 Elysia，你将获得目前最高性能和最类型安全的 Web 框架之一，非常适合在 Bun 生态系统中构建现代 API。
