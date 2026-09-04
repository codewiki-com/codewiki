---
title: tRPC 端到端类型安全 API
description: 使用 tRPC 构建类型安全的全栈应用
track: backend
section: http-apis
difficulty: intermediate
tags:
  - tRPC
  - TypeScript
  - API
  - 类型安全
status: imported
origin: old/src/content/docs/backend/trpc.zh.md
divergence: 0.287
issues: []
legacy:
  category: Backend
  subcategory: API
  order: 21
  lastUpdated: 2026-01-07
---

## 概念解释

tRPC（TypeScript Remote Procedure Call）是一个革命性的全栈 TypeScript 框架，它允许你在客户端和服务器之间共享类型定义，实现真正的端到端类型安全。与传统的 REST API 或 GraphQL 不同，tRPC 无需代码生成、Schema 定义或运行时类型检查，所有类型推断都在编译时完成。

### 为什么选择 tRPC？

在传统的前后端分离架构中，API 的类型安全一直是一个痛点。即使使用 TypeScript，前端和后端的类型定义往往是分离的，容易出现不一致的问题。tRPC 通过以下方式解决了这个问题：

- **零运行时开销**：类型检查完全在编译时进行
- **无需代码生成**：不像 GraphQL 需要生成客户端代码
- **完整的类型推断**：从服务器到客户端，类型一路贯通
- **极简的 API 设计**：学习曲线平缓，上手迅速
- **与现有技术栈无缝集成**：支持 React Query、Next.js 等主流框架

### 核心术语

| 术语 | 描述 |
|------|------|
| **Procedure** | API 端点，可以是 Query、Mutation 或 Subscription |
| **Query** | 用于获取数据的 Procedure |
| **Mutation** | 用于创建、更新或删除数据的 Procedure |
| **Subscription** | 用于建立持久连接并监听变化的 Procedure |
| **Router** | Procedure 的集合，可以嵌套组织 |
| **Context** | 每个 Procedure 都可以访问的共享状态（如会话、数据库连接） |
| **Middleware** | 在 Procedure 执行前后运行的函数，可以修改 Context |

## 快速开始

### 安装依赖

```bash
# 服务端
npm install @trpc/server zod

# 客户端
npm install @trpc/client @trpc/react-query @tanstack/react-query
```

### 初始化 tRPC

创建 tRPC 实例是一切的起点：

```typescript
// server/trpc.ts
import { initTRPC } from '@trpc/server';

// 定义 Context 类型
type Context = {
  user: { id: string; name: string } | null;
  db: DatabaseConnection;
};

// 初始化 tRPC
const t = initTRPC.context<Context>().create();

// 导出可复用的组件
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
export const createCallerFactory = t.createCallerFactory;
```

## Router 与 Procedure

Router 是组织 API 端点的核心概念。每个 Router 可以包含多个 Procedure，也可以嵌套其他 Router。

### 基础 Router 定义

```typescript
// server/routers/user.ts
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const userRouter = router({
  // Query: 获取用户列表
  list: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findMany();
  }),

  // Query: 根据 ID 获取用户
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.user.findUnique({
        where: { id: input.id },
      });
    }),

  // Mutation: 创建用户
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, '名称至少2个字符'),
        email: z.string().email('请输入有效的邮箱地址'),
        age: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.create({
        data: input,
      });
    }),

  // Mutation: 更新用户
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.user.update({
        where: { id },
        data,
      });
    }),

  // Mutation: 删除用户
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.delete({
        where: { id: input.id },
      });
    }),
});
```

### 嵌套 Router

通过嵌套 Router，你可以创建清晰的 API 层级结构：

```typescript
// server/routers/_app.ts
import { router } from '../trpc';
import { userRouter } from './user';
import { postRouter } from './post';
import { commentRouter } from './comment';

export const appRouter = router({
  user: userRouter,
  post: postRouter,
  comment: commentRouter,
});

// 导出类型供客户端使用
export type AppRouter = typeof appRouter;
```

这样客户端调用时就可以使用 `trpc.user.list()`、`trpc.post.create()` 等清晰的命名空间。

## 输入验证

tRPC 与 Zod 深度集成，提供强大的输入验证能力。验证不仅在运行时执行，还能为客户端提供完整的类型推断。

### 基础验证

```typescript
import { z } from 'zod';

const createUserInput = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user', 'guest']).default('user'),
  profile: z.object({
    bio: z.string().optional(),
    avatar: z.string().url().optional(),
  }).optional(),
});

export const userRouter = router({
  create: publicProcedure
    .input(createUserInput)
    .mutation(async ({ ctx, input }) => {
      // input 的类型会被自动推断
      // {
      //   name: string;
      //   email: string;
      //   password: string;
      //   role: 'admin' | 'user' | 'guest';
      //   profile?: { bio?: string; avatar?: string };
      // }
      return await ctx.db.user.create({ data: input });
    }),
});
```

### 输出验证

你也可以验证输出，确保返回的数据符合预期格式：

```typescript
const userOutput = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.date(),
});

export const userRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(userOutput)
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
      });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return user;
    }),
});
```

## 中间件

中间件是 tRPC 中实现横切关注点（如认证、日志、权限检查）的核心机制。

### 认证中间件

```typescript
import { TRPCError } from '@trpc/server';
import { middleware, publicProcedure } from './trpc';

// 定义认证中间件
const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '请先登录',
    });
  }

  // 将非空的 user 传递给下一个中间件或 Procedure
  return next({
    ctx: {
      user: ctx.user, // 类型变为非空
    },
  });
});

// 创建需要认证的 Procedure
export const authedProcedure = publicProcedure.use(isAuthed);
```

### 权限检查中间件

```typescript
import { z } from 'zod';

// 定义角色类型
type Role = 'admin' | 'moderator' | 'user';

// 创建基于角色的中间件工厂
const hasRole = (allowedRoles: Role[]) =>
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '权限不足',
      });
    }

    return next({ ctx });
  });

// 创建管理员专用 Procedure
export const adminProcedure = authedProcedure.use(hasRole(['admin']));

// 创建版主以上权限的 Procedure
export const moderatorProcedure = authedProcedure.use(
  hasRole(['admin', 'moderator'])
);
```

### 日志中间件

```typescript
const loggerMiddleware = middleware(async ({ path, type, next }) => {
  const start = Date.now();

  const result = await next();

  const duration = Date.now() - start;
  console.log(`[${type}] ${path} - ${duration}ms`);

  return result;
});

// 应用到所有 Procedure
export const publicProcedure = t.procedure.use(loggerMiddleware);
```

### 组织机构权限中间件

```typescript
// 复杂的多层中间件示例
export const organizationProcedure = authedProcedure
  .input(z.object({ organizationId: z.string() }))
  .use(async ({ ctx, input, next }) => {
    // 检查用户是否属于该组织
    const membership = ctx.user.memberships.find(
      (m) => m.organizationId === input.organizationId
    );

    if (!membership) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '您不属于该组织',
      });
    }

    return next({
      ctx: {
        organization: membership.organization,
        memberRole: membership.role,
      },
    });
  });

// 使用示例
export const organizationRouter = router({
  getMembers: organizationProcedure.query(async ({ ctx }) => {
    // ctx.organization 和 ctx.memberRole 已经可用
    return await ctx.db.member.findMany({
      where: { organizationId: ctx.organization.id },
    });
  }),
});
```

## 错误处理

tRPC 提供了结构化的错误处理机制，支持自定义错误码和错误消息。

### TRPCError

```typescript
import { TRPCError } from '@trpc/server';

export const postRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `文章 ${input.id} 不存在`,
        });
      }

      if (!post.published && post.authorId !== ctx.user?.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权访问未发布的文章',
        });
      }

      return post;
    }),
});
```

### 错误码参考

| 错误码 | HTTP 状态码 | 描述 |
|--------|-------------|------|
| `BAD_REQUEST` | 400 | 请求参数错误 |
| `UNAUTHORIZED` | 401 | 未认证 |
| `FORBIDDEN` | 403 | 无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `TIMEOUT` | 408 | 请求超时 |
| `CONFLICT` | 409 | 资源冲突 |
| `PRECONDITION_FAILED` | 412 | 前置条件失败 |
| `PAYLOAD_TOO_LARGE` | 413 | 请求体过大 |
| `TOO_MANY_REQUESTS` | 429 | 请求过于频繁 |
| `INTERNAL_SERVER_ERROR` | 500 | 服务器内部错误 |

### 全局错误处理

在服务端适配器中配置全局错误处理：

```typescript
import { createNextApiHandler } from '@trpc/server/adapters/next';

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error, type, path, input, ctx, req }) {
    console.error(`[tRPC Error] ${type} ${path}:`, error);

    // 发送到错误追踪服务
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      Sentry.captureException(error, {
        extra: { type, path, input },
      });
    }
  },
});
```

### 自定义错误格式

```typescript
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // 添加自定义字段
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    };
  },
});
```

## React Query 集成

tRPC 与 TanStack Query（React Query）深度集成，提供了强大的数据获取、缓存和状态管理能力。

### 客户端配置

```typescript
// utils/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();
```

### Provider 配置

```tsx
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from '../utils/trpc';
import superjson from 'superjson';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 分钟
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### 使用 Query 获取数据

```tsx
import { trpc } from '../utils/trpc';

export function UserList() {
  // 基础查询
  const usersQuery = trpc.user.list.useQuery();

  // 带参数的查询
  const userQuery = trpc.user.getById.useQuery({ id: '123' });

  // 条件查询
  const [userId, setUserId] = useState<string | null>(null);
  const conditionalQuery = trpc.user.getById.useQuery(
    { id: userId! },
    { enabled: !!userId }
  );

  if (usersQuery.isLoading) return <div>加载中...</div>;
  if (usersQuery.error) return <div>错误: {usersQuery.error.message}</div>;

  return (
    <ul>
      {usersQuery.data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 使用 Mutation 修改数据

```tsx
import { trpc } from '../utils/trpc';

export function CreateUserForm() {
  const utils = trpc.useUtils();

  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      // 创建成功后使用户列表缓存失效
      utils.user.list.invalidate();
    },
    onError: (error) => {
      alert(`创建失败: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createUser.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="姓名" required />
      <input name="email" type="email" placeholder="邮箱" required />
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? '创建中...' : '创建用户'}
      </button>
    </form>
  );
}
```

### 乐观更新

```tsx
export function TodoItem({ todo }: { todo: Todo }) {
  const utils = trpc.useUtils();

  const toggleTodo = trpc.todo.toggle.useMutation({
    // 乐观更新
    onMutate: async ({ id }) => {
      // 取消正在进行的查询
      await utils.todo.list.cancel();

      // 获取当前缓存数据
      const previousTodos = utils.todo.list.getData();

      // 乐观更新缓存
      utils.todo.list.setData(undefined, (old) =>
        old?.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        )
      );

      return { previousTodos };
    },
    // 发生错误时回滚
    onError: (err, { id }, context) => {
      utils.todo.list.setData(undefined, context?.previousTodos);
    },
    // 无论成功失败都重新获取数据
    onSettled: () => {
      utils.todo.list.invalidate();
    },
  });

  return (
    <div onClick={() => toggleTodo.mutate({ id: todo.id })}>
      {todo.completed ? '[x]' : '[ ]'} {todo.title}
    </div>
  );
}
```

### 无限滚动查询

```tsx
export function InfinitePostList() {
  const postsQuery = trpc.post.infiniteList.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  if (postsQuery.isLoading) return <div>加载中...</div>;

  return (
    <div>
      {postsQuery.data?.pages.map((page) =>
        page.items.map((post) => (
          <article key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
          </article>
        ))
      )}

      <button
        onClick={() => postsQuery.fetchNextPage()}
        disabled={!postsQuery.hasNextPage || postsQuery.isFetchingNextPage}
      >
        {postsQuery.isFetchingNextPage
          ? '加载中...'
          : postsQuery.hasNextPage
          ? '加载更多'
          : '没有更多了'}
      </button>
    </div>
  );
}
```

## Next.js 集成

tRPC 与 Next.js 无缝集成，支持 Pages Router 和 App Router 两种模式。

### Pages Router 集成

```typescript
// pages/api/trpc/[trpc].ts
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '../../../server/routers/_app';
import { createContext } from '../../../server/context';

export default createNextApiHandler({
  router: appRouter,
  createContext,
});
```

### App Router 集成

```typescript
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../../../server/routers/_app';
import { createContext } from '../../../../server/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

### Server Components 中使用 tRPC

在 React Server Components 中，你可以直接调用 tRPC Procedure：

```typescript
// server/trpc/server.ts
import 'server-only';
import { createCallerFactory } from '../trpc';
import { appRouter } from '../routers/_app';
import { createContext } from '../context';

const createCaller = createCallerFactory(appRouter);

export const caller = createCaller(createContext);
```

```tsx
// app/users/page.tsx
import { caller } from '../../server/trpc/server';

export default async function UsersPage() {
  // 直接在服务端调用 tRPC
  const users = await caller.user.list();

  return (
    <div>
      <h1>用户列表</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 数据预取与 Hydration

```tsx
// server/trpc/server.ts
import 'server-only';
import { createHydrationHelpers } from '@trpc/react-query/rsc';
import { cache } from 'react';
import { createCallerFactory, createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter } from './routers/_app';

export const getQueryClient = cache(makeQueryClient);

const caller = createCallerFactory(appRouter)(createTRPCContext);

export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(
  caller,
  getQueryClient
);
```

```tsx
// app/users/page.tsx
import { trpc, HydrateClient } from '../../server/trpc/server';
import { UserList } from './user-list';

export default async function UsersPage() {
  // 在服务端预取数据
  void trpc.user.list.prefetch();

  return (
    <HydrateClient>
      {/* 客户端组件会立即获得预取的数据 */}
      <UserList />
    </HydrateClient>
  );
}
```

## 性能优化

### 请求批处理

tRPC 默认支持请求批处理，多个同时发起的请求会被合并为单个 HTTP 请求：

```typescript
// 客户端配置
import { httpBatchLink } from '@trpc/client';

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      // 批处理配置
      maxURLLength: 2083, // URL 最大长度
    }),
  ],
});
```

```typescript
// 这三个请求会被合并为一个 HTTP 请求
const [user, posts, comments] = await Promise.all([
  trpc.user.getById.query({ id: '1' }),
  trpc.post.list.query({ authorId: '1' }),
  trpc.comment.list.query({ postId: '1' }),
]);
```

### 禁用批处理

某些场景下你可能需要禁用批处理：

```typescript
import { httpLink } from '@trpc/client';
import { splitLink } from '@trpc/client';
import { httpBatchLink } from '@trpc/client';

const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition: (op) => op.context.skipBatch === true,
      true: httpLink({ url: '/api/trpc' }),
      false: httpBatchLink({ url: '/api/trpc' }),
    }),
  ],
});

// 使用时指定跳过批处理
trpc.post.create.mutate(data, {
  context: { skipBatch: true },
});
```

### 数据转换器（Transformer）

使用 SuperJSON 等转换器可以在客户端和服务端之间传输 Date、Map、Set 等复杂类型：

```typescript
// server/trpc.ts
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});
```

```typescript
// 客户端配置
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
    }),
  ],
});
```

### 缓存策略

利用 React Query 的缓存机制优化性能：

```tsx
// 全局配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 分钟后数据变为 stale
      gcTime: 30 * 60 * 1000,   // 30 分钟后清理缓存
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

// 单个查询配置
const userQuery = trpc.user.getById.useQuery(
  { id: '123' },
  {
    staleTime: Infinity, // 永不过期
    refetchOnMount: false,
  }
);
```

### 预加载数据

```tsx
export function UserCard({ userId }: { userId: string }) {
  const utils = trpc.useUtils();

  // 鼠标悬停时预加载用户详情
  const handleMouseEnter = () => {
    utils.user.getById.prefetch({ id: userId });
  };

  return (
    <div onMouseEnter={handleMouseEnter}>
      <Link href={`/users/${userId}`}>查看详情</Link>
    </div>
  );
}
```

## 类型推断

tRPC 的一大优势是强大的类型推断能力。你可以在客户端获取服务端定义的所有类型。

### 推断输入和输出类型

```typescript
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../server/routers/_app';

// 推断所有路由的输入类型
type RouterInputs = inferRouterInputs<AppRouter>;

// 推断所有路由的输出类型
type RouterOutputs = inferRouterOutputs<AppRouter>;

// 使用推断的类型
type CreateUserInput = RouterInputs['user']['create'];
// { name: string; email: string; age?: number }

type User = RouterOutputs['user']['getById'];
// { id: string; name: string; email: string; createdAt: Date }
```

### 在组件中使用推断类型

```tsx
import type { RouterOutputs } from '../utils/trpc';

type User = RouterOutputs['user']['getById'];

function UserProfile({ user }: { user: User }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <time>{user.createdAt.toLocaleDateString()}</time>
    </div>
  );
}
```

## 项目结构最佳实践

一个组织良好的 tRPC 项目结构：

```
project/
├── src/
│   ├── server/
│   │   ├── trpc.ts              # tRPC 初始化
│   │   ├── context.ts           # Context 创建
│   │   ├── routers/
│   │   │   ├── _app.ts          # 根 Router
│   │   │   ├── user.ts          # 用户模块
│   │   │   ├── post.ts          # 文章模块
│   │   │   └── comment.ts       # 评论模块
│   │   └── middleware/
│   │       ├── auth.ts          # 认证中间件
│   │       └── rateLimit.ts     # 限流中间件
│   ├── client/
│   │   ├── trpc.ts              # 客户端配置
│   │   └── providers.tsx        # Provider 组件
│   ├── utils/
│   │   └── types.ts             # 类型工具
│   └── app/                     # Next.js App Router
│       ├── api/
│       │   └── trpc/
│       │       └── [trpc]/
│       │           └── route.ts
│       └── ...
└── package.json
```

## 与 GraphQL/REST 对比

| 特性 | tRPC | GraphQL | REST |
|------|------|---------|------|
| 类型安全 | 编译时完整类型推断 | 需要代码生成 | 需要手动定义 |
| 学习曲线 | 低 | 中高 | 低 |
| 性能 | 优秀（批处理） | 良好 | 一般 |
| 生态系统 | 成长中 | 成熟 | 最成熟 |
| 跨语言支持 | 仅 TypeScript | 全语言 | 全语言 |
| 代码生成 | 不需要 | 需要 | 可选 |
| 灵活查询 | 固定端点 | 自由查询 | 固定端点 |
| 适用场景 | 全栈 TypeScript | 复杂数据需求 | 通用 API |

### 选择建议

- **选择 tRPC**：全栈 TypeScript 项目、追求开发效率、团队熟悉 React Query
- **选择 GraphQL**：复杂数据关系、需要灵活查询、多客户端支持
- **选择 REST**：简单 CRUD、需要跨语言支持、团队不熟悉新技术

## 面试要点

### 常见问题

1. **tRPC 如何实现端到端类型安全？**
   - 通过 TypeScript 的类型推断，服务端定义的类型自动传递到客户端
   - 无需代码生成，所有类型检查在编译时完成
   - 使用 `inferRouterInputs` 和 `inferRouterOutputs` 导出类型

2. **tRPC 与 GraphQL 的主要区别是什么？**
   - tRPC 是 RPC 风格，GraphQL 是查询语言
   - tRPC 无需代码生成，GraphQL 通常需要
   - tRPC 仅支持 TypeScript，GraphQL 支持多语言
   - tRPC 更简单，GraphQL 更灵活

3. **tRPC 中间件的执行顺序是怎样的？**
   - 中间件按照 `.use()` 的顺序执行
   - 每个中间件可以修改 Context 并传递给下一个
   - 支持前置和后置处理

4. **如何在 tRPC 中处理错误？**
   - 使用 `TRPCError` 抛出结构化错误
   - 通过 `onError` 钩子进行全局错误处理
   - 使用 `errorFormatter` 自定义错误格式

5. **tRPC 如何优化性能？**
   - 请求批处理减少 HTTP 请求数
   - 与 React Query 集成实现智能缓存
   - 支持数据预取和乐观更新

## 延伸阅读

### 官方资源

- [tRPC 官方文档](https://trpc.io/)
- [tRPC GitHub 仓库](https://github.com/trpc/trpc)
- [tRPC 示例项目](https://github.com/trpc/trpc/tree/main/examples)

### 推荐学习路径

1. **基础阶段**：理解 RPC 概念、掌握 Router 和 Procedure 定义
2. **进阶阶段**：学习中间件、错误处理、输入验证
3. **集成阶段**：掌握 React Query 集成、Next.js 集成
4. **优化阶段**：性能优化、生产环境最佳实践

### 相关技术栈

- **验证库**：Zod、Yup、Valibot
- **ORM**：Prisma、Drizzle
- **前端框架**：Next.js、Remix
- **状态管理**：TanStack Query、Zustand

---

tRPC 代表了现代全栈 TypeScript 开发的最佳实践。通过消除前后端类型不一致的问题，它极大地提高了开发效率和代码质量。如果你的项目是纯 TypeScript 栈，tRPC 是一个值得认真考虑的选择。随着生态系统的不断成熟，tRPC 正在成为越来越多团队的首选 API 解决方案。
