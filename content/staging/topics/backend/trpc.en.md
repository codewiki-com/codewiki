---
title: "tRPC: End-to-End Type-Safe APIs"
description: Build type-safe full-stack applications with tRPC
track: backend
section: http-apis
difficulty: intermediate
tags:
  - tRPC
  - TypeScript
  - API
  - Type Safety
status: imported
origin: old/src/content/docs/backend/trpc.en.md
divergence: 0.287
issues: []
legacy:
  category: Backend
  subcategory: API
  order: 21
  lastUpdated: 2026-01-07
---

## Concept Overview

tRPC (TypeScript Remote Procedure Call) is a library that enables you to build fully type-safe APIs without schemas or code generation. It allows you to share types directly between your frontend and backend, ensuring that any changes to your API are immediately reflected throughout your entire application with full TypeScript support.

### Why tRPC?

Traditional API development involves significant overhead: defining schemas, generating types, and maintaining synchronization between client and server. tRPC eliminates this friction by leveraging TypeScript's type inference to automatically share types across the stack.

Key advantages of tRPC:

- **End-to-End Type Safety**: Types flow automatically from server to client
- **Zero Code Generation**: No schema files or build steps required
- **Excellent Developer Experience**: Autocomplete for API routes and parameters
- **Lightweight**: Minimal runtime overhead compared to alternatives
- **Framework Agnostic**: Works with React, Next.js, Express, Fastify, and more
- **Full TypeScript Support**: Leverage the entire TypeScript ecosystem

### When to Use tRPC

tRPC is ideal when:

- Both frontend and backend are written in TypeScript
- You control both ends of your application
- You want rapid development with strong type guarantees
- You're building a monorepo or full-stack TypeScript project

tRPC may not be the best choice when:

- Your API serves non-TypeScript clients
- You need a public API with extensive documentation
- You require language-agnostic API definitions (consider GraphQL or OpenAPI)

## Core Concepts

### Installation

Install tRPC along with its dependencies:

```bash
# npm
npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query zod

# yarn
yarn add @trpc/server @trpc/client @trpc/react-query @tanstack/react-query zod

# pnpm
pnpm add @trpc/server @trpc/client @trpc/react-query @tanstack/react-query zod
```

### Initializing tRPC

The first step is to initialize tRPC with your context type:

```typescript
// server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
```

### Context

Context holds data that all procedures can access, such as database connections, authenticated users, or request metadata:

```typescript
// server/context.ts
import { inferAsyncReturnType } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getSession } from 'next-auth/react';
import { prisma } from './prisma';

export async function createContext(opts: CreateNextContextOptions) {
  const session = await getSession({ req: opts.req });

  return {
    prisma,
    session,
    user: session?.user,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
```

## Routers and Procedures

### Procedure Types

tRPC supports three types of procedures:

1. **Query**: Read-only operations (similar to HTTP GET)
2. **Mutation**: Operations that modify data (similar to HTTP POST/PUT/DELETE)
3. **Subscription**: Real-time operations using WebSockets

```typescript
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';

const t = initTRPC.create();
const ee = new EventEmitter();

// Query procedure - for reading data
const getUserQuery = t.procedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input, ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.id }
    });
    return user;
  });

// Mutation procedure - for modifying data
const createUserMutation = t.procedure
  .input(z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }))
  .mutation(async ({ input, ctx }) => {
    const user = await ctx.prisma.user.create({ data: input });
    return user;
  });

// Subscription procedure - for real-time updates
const onUserCreatedSubscription = t.procedure
  .subscription(() => {
    return observable<User>((emit) => {
      const onCreated = (user: User) => emit.next(user);
      ee.on('userCreated', onCreated);
      return () => ee.off('userCreated', onCreated);
    });
  });
```

### Building Routers

Routers are collections of procedures that define your API endpoints:

```typescript
// server/routers/user.ts
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';

export const userRouter = router({
  // Query - for fetching data
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
      });
      return user;
    }),

  // Mutation - for modifying data
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        bio: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
      });
      return updatedUser;
    }),

  // List with cursor-based pagination
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const users = await ctx.prisma.user.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem?.id;
      }

      return { users, nextCursor };
    }),
});
```

### Composing Routers

Organize your API by combining multiple routers:

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

// Export type definition of API
export type AppRouter = typeof appRouter;
```

## Input Validation

tRPC integrates seamlessly with validation libraries like Zod:

```typescript
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

// Define reusable schemas
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  tags: z.array(z.string()).max(10).optional(),
  published: z.boolean().default(false),
});

const updatePostSchema = createPostSchema.partial().extend({
  id: z.string(),
});

export const postRouter = router({
  create: publicProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.post.create({
        data: {
          ...input,
          authorId: ctx.user.id,
        },
      });
    }),

  update: publicProcedure
    .input(updatePostSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.post.update({
        where: { id },
        data,
      });
    }),

  // Complex validation with refinements
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(2),
        filters: z
          .object({
            author: z.string().optional(),
            tags: z.array(z.string()).optional(),
            dateRange: z
              .object({
                from: z.date(),
                to: z.date(),
              })
              .refine((data) => data.from <= data.to, {
                message: 'Start date must be before end date',
              })
              .optional(),
          })
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Search implementation
      return ctx.prisma.post.findMany({
        where: {
          title: { contains: input.query },
          authorId: input.filters?.author,
        },
      });
    }),
});
```

## Middleware

Middleware allows you to run code before and after procedures, modify context, and implement cross-cutting concerns.

### Authentication Middleware

```typescript
// server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

// Middleware that checks if user is authenticated
const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action',
    });
  }

  return next({
    ctx: {
      // Narrow the type - user is now non-null
      user: ctx.user,
    },
  });
});

// Middleware that checks for admin role
const isAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  if (ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to perform this action',
    });
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

// Export procedures with middleware applied
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdmin);
```

### Logging Middleware

```typescript
const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();

  const result = await next();

  const duration = Date.now() - start;
  console.log(`[${type.toUpperCase()}] ${path} - ${duration}ms`);

  return result;
});

// Apply to all procedures
export const publicProcedure = t.procedure.use(loggerMiddleware);
```

### Rate Limiting Middleware

```typescript
import { TRPCError } from '@trpc/server';

// Simple in-memory rate limiter (use Redis for production)
const rateLimits = new Map<string, { count: number; resetTime: number }>();

const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  const userId = ctx.user?.id || ctx.req?.ip || 'anonymous';
  const limit = 100; // requests
  const windowMs = 60 * 1000; // 1 minute

  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + windowMs });
  } else if (userLimit.count >= limit) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded. Please try again later.',
    });
  } else {
    userLimit.count++;
  }

  return next();
});
```

### Composing Middleware

```typescript
// Combine multiple middleware functions
const organizationProcedure = protectedProcedure
  .input(z.object({ organizationId: z.string() }))
  .use(async ({ ctx, input, next }) => {
    const membership = await ctx.prisma.membership.findFirst({
      where: {
        userId: ctx.user.id,
        organizationId: input.organizationId,
      },
      include: { organization: true },
    });

    if (!membership) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not a member of this organization',
      });
    }

    return next({
      ctx: {
        organization: membership.organization,
        membership,
      },
    });
  });

// Use in router
export const orgRouter = router({
  getMembers: organizationProcedure.query(async ({ ctx }) => {
    // ctx.organization and ctx.membership are available
    return ctx.prisma.user.findMany({
      where: {
        memberships: {
          some: { organizationId: ctx.organization.id },
        },
      },
    });
  }),
});
```

## Error Handling

tRPC provides structured error handling with typed error codes:

```typescript
import { TRPCError } from '@trpc/server';

export const postRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Post with id ${input.id} not found`,
        });
      }

      return post;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      if (post.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own posts',
        });
      }

      await ctx.prisma.post.delete({ where: { id: input.id } });

      return { success: true };
    }),
});
```

### Error Codes

tRPC supports the following error codes:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `PARSE_ERROR` | 400 | Invalid JSON in request body |
| `BAD_REQUEST` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `METHOD_NOT_SUPPORTED` | 405 | HTTP method not allowed |
| `TIMEOUT` | 408 | Request timed out |
| `CONFLICT` | 409 | Resource conflict |
| `PRECONDITION_FAILED` | 412 | Precondition check failed |
| `PAYLOAD_TOO_LARGE` | 413 | Request body too large |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

### Custom Error Formatting

```typescript
import { ZodError } from 'zod';

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
        // Add custom error data
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    };
  },
});
```

### Client-Side Error Handling

```tsx
import { trpc } from '../utils/trpc';

function UserProfile({ userId }: { userId: string }) {
  const { data, error, isError } = trpc.user.getById.useQuery(
    { id: userId },
    {
      onError: (error) => {
        if (error.data?.code === 'NOT_FOUND') {
          console.log('User not found');
        } else if (error.data?.code === 'UNAUTHORIZED') {
          // Redirect to login
          router.push('/login');
        }
      },
      retry: (failureCount, error) => {
        // Don't retry on certain errors
        if (error.data?.code === 'NOT_FOUND') return false;
        if (error.data?.code === 'UNAUTHORIZED') return false;
        return failureCount < 3;
      },
    }
  );

  if (isError) {
    if (error.data?.code === 'NOT_FOUND') {
      return <div>User not found</div>;
    }

    // Check for Zod validation errors
    if (error.data?.zodError) {
      return (
        <div>
          Validation errors:
          {Object.entries(error.data.zodError.fieldErrors).map(
            ([field, errors]) => (
              <p key={field}>
                {field}: {errors?.join(', ')}
              </p>
            )
          )}
        </div>
      );
    }

    return <div>An error occurred: {error.message}</div>;
  }

  return <div>{data?.name}</div>;
}
```

## React Query Integration

tRPC provides first-class integration with TanStack Query (React Query):

### Client Setup

```typescript
// utils/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();
```

### Provider Setup

```tsx
// pages/_app.tsx or app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from '../utils/trpc';

function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          headers() {
            return {
              // Add auth headers if needed
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### Using Queries

```tsx
// components/UserProfile.tsx
import { trpc } from '../utils/trpc';

function UserProfile({ userId }: { userId: string }) {
  // Basic query
  const userQuery = trpc.user.getById.useQuery({ id: userId });

  // Query with options
  const postsQuery = trpc.post.listByAuthor.useQuery(
    { authorId: userId },
    {
      enabled: !!userId,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  if (userQuery.isLoading) return <div>Loading...</div>;
  if (userQuery.error) return <div>Error: {userQuery.error.message}</div>;

  return (
    <div>
      <h1>{userQuery.data.name}</h1>
      <p>{userQuery.data.bio}</p>

      <h2>Posts</h2>
      {postsQuery.data?.map((post) => (
        <article key={post.id}>
          <h3>{post.title}</h3>
        </article>
      ))}
    </div>
  );
}
```

### Using Mutations

```tsx
// components/CreatePost.tsx
import { trpc } from '../utils/trpc';

function CreatePost() {
  const utils = trpc.useUtils();

  const createPost = trpc.post.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch posts
      utils.post.list.invalidate();
    },
    onError: (error) => {
      console.error('Failed to create post:', error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createPost.mutate({
      title: formData.get('title') as string,
      content: formData.get('content') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />
      <button type="submit" disabled={createPost.isPending}>
        {createPost.isPending ? 'Creating...' : 'Create Post'}
      </button>
      {createPost.error && (
        <p className="error">{createPost.error.message}</p>
      )}
    </form>
  );
}
```

### Infinite Queries

```tsx
// components/PostFeed.tsx
import { trpc } from '../utils/trpc';

function PostFeed() {
  const postsQuery = trpc.post.list.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  return (
    <div>
      {postsQuery.data?.pages.map((page) =>
        page.posts.map((post) => (
          <article key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.content}</p>
          </article>
        ))
      )}

      <button
        onClick={() => postsQuery.fetchNextPage()}
        disabled={!postsQuery.hasNextPage || postsQuery.isFetchingNextPage}
      >
        {postsQuery.isFetchingNextPage
          ? 'Loading more...'
          : postsQuery.hasNextPage
          ? 'Load More'
          : 'No more posts'}
      </button>
    </div>
  );
}
```

### Optimistic Updates

```tsx
function LikeButton({ postId }: { postId: string }) {
  const utils = trpc.useUtils();

  const likeMutation = trpc.post.like.useMutation({
    onMutate: async ({ postId }) => {
      // Cancel outgoing refetches
      await utils.post.getById.cancel({ id: postId });

      // Snapshot previous value
      const previousPost = utils.post.getById.getData({ id: postId });

      // Optimistically update
      utils.post.getById.setData({ id: postId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          likesCount: old.likesCount + 1,
          isLiked: true,
        };
      });

      return { previousPost };
    },
    onError: (err, { postId }, context) => {
      // Rollback on error
      if (context?.previousPost) {
        utils.post.getById.setData({ id: postId }, context.previousPost);
      }
    },
    onSettled: (_, __, { postId }) => {
      // Refetch after error or success
      utils.post.getById.invalidate({ id: postId });
    },
  });

  return (
    <button onClick={() => likeMutation.mutate({ postId })}>Like</button>
  );
}
```

## Next.js Integration

### API Handler Setup (Pages Router)

```typescript
// pages/api/trpc/[trpc].ts
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '../../../server/routers/_app';
import { createContext } from '../../../server/context';

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error, type, path, input, ctx, req }) {
    console.error(`tRPC Error on ${path}:`, error);

    if (error.code === 'INTERNAL_SERVER_ERROR') {
      // Send to error monitoring service
    }
  },
});
```

### App Router Setup (Next.js 13+)

```typescript
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

### Server-Side Calls

```typescript
// pages/posts/[id].tsx
import { createServerSideHelpers } from '@trpc/react-query/server';
import { appRouter } from '../../server/routers/_app';
import { createContext } from '../../server/context';
import superjson from 'superjson';

export async function getServerSideProps(
  context: GetServerSidePropsContext
) {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: await createContext(context),
    transformer: superjson,
  });

  const id = context.params?.id as string;

  // Prefetch data
  await helpers.post.getById.prefetch({ id });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      id,
    },
  };
}

function PostPage({ id }: { id: string }) {
  // Data is already available from SSR
  const postQuery = trpc.post.getById.useQuery({ id });

  return <div>{postQuery.data?.title}</div>;
}
```

### Using createTRPCNext

```typescript
// utils/trpc.ts
import { createTRPCNext } from '@trpc/next';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '../server/routers/_app';

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    };
  },
  ssr: false, // Set to true for SSR
});
```

## Performance Optimization

### Request Batching

tRPC automatically batches multiple requests made in the same tick:

```typescript
// These requests are automatically batched into a single HTTP request
const user = trpc.user.getById.useQuery({ id: '1' });
const posts = trpc.post.listByAuthor.useQuery({ authorId: '1' });
const comments = trpc.comment.listByPost.useQuery({ postId: '1' });
```

Configure batching behavior:

```typescript
trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      maxURLLength: 2083, // Maximum URL length before switching to POST
    }),
  ],
});
```

### Data Transformers

Use superjson for automatic serialization of Dates, Maps, Sets, and more:

```typescript
import superjson from 'superjson';

// Server
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// Client
trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
    }),
  ],
});
```

### Response Caching

```typescript
import { httpBatchLink } from '@trpc/client';

trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      // Add cache headers
      headers() {
        return {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        };
      },
    }),
  ],
});
```

### Selective Procedure Loading

Split routers for better code splitting:

```typescript
// Lazy load heavy routers
const analyticsRouter = router({
  getReport: publicProcedure
    .input(
      z.object({
        dateRange: z.object({ from: z.date(), to: z.date() }),
      })
    )
    .query(async ({ input }) => {
      // Heavy analytics computation
      const { generateReport } = await import('../services/analytics');
      return generateReport(input.dateRange);
    }),
});
```

### Query Deduplication

React Query automatically deduplicates identical queries:

```tsx
// Both components share the same query - only one request is made
function Header() {
  const user = trpc.user.me.useQuery();
  return <div>Welcome, {user.data?.name}</div>;
}

function Sidebar() {
  const user = trpc.user.me.useQuery();
  return <div>Account: {user.data?.email}</div>;
}
```

## Type Inference

### Inferring Types from Router

```typescript
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from './server/routers/_app';

// Infer input and output types
type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

// Use in your application
type PostCreateInput = RouterInputs['post']['create'];
type PostCreateOutput = RouterOutputs['post']['create'];

// Example usage
function createPost(data: PostCreateInput): Promise<PostCreateOutput> {
  return trpcClient.post.create.mutate(data);
}
```

### Inferring React Query Options

```typescript
import {
  createTRPCReact,
  type inferReactQueryProcedureOptions,
} from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from './server';

// Infer the types for your router
export type ReactQueryOptions = inferReactQueryProcedureOptions<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export const trpc = createTRPCReact<AppRouter>();
```

## Comparison with Alternatives

| Feature | tRPC | REST | GraphQL |
|---------|------|------|---------|
| Type Safety | Full E2E | Manual/Generated | Generated |
| Schema | None needed | OpenAPI optional | Required |
| Learning Curve | Low (TypeScript) | Low | Medium |
| Client Libraries | Built-in | Various | Various |
| Caching | Via React Query | HTTP caching | Apollo/urql |
| File Uploads | Manual | Native | Manual |
| Subscriptions | Built-in | Manual | Built-in |
| Batching | Automatic | Manual | Built-in |
| Best For | TypeScript monorepos | Public APIs | Complex queries |

### When to Choose Each

**Choose tRPC when:**

- Full-stack TypeScript application
- Internal APIs
- Rapid development and iteration
- Maximum developer experience

**Choose REST when:**

- Public API
- Multiple client languages
- Need HTTP caching
- Industry standard compliance needed

**Choose GraphQL when:**

- Complex data relationships
- Multiple platforms with different data needs
- Need precise field selection
- Large-scale public API

## Best Practices

### Project Structure

```
src/
├── server/
│   ├── trpc.ts              # tRPC initialization
│   ├── context.ts           # Context creation
│   └── routers/
│       ├── _app.ts          # Root router
│       ├── user.ts          # User procedures
│       ├── post.ts          # Post procedures
│       └── comment.ts       # Comment procedures
├── utils/
│   └── trpc.ts              # Client setup
└── pages/
    └── api/
        └── trpc/
            └── [trpc].ts    # API handler
```

### Naming Conventions

- Use clear, descriptive procedure names
- Group related procedures in sub-routers
- Use `getX`, `listX` for queries
- Use `createX`, `updateX`, `deleteX` for mutations

### Security Considerations

1. **Always validate input**: Use Zod or similar for all inputs
2. **Use protected procedures**: Apply authentication middleware consistently
3. **Implement authorization**: Check permissions in middleware or procedures
4. **Rate limit sensitive endpoints**: Prevent abuse
5. **Sanitize outputs**: Remove sensitive fields before returning data

## Further Reading

### Official Resources

- [tRPC Official Documentation](https://trpc.io/docs)
- [tRPC GitHub Repository](https://github.com/trpc/trpc)
- [tRPC Examples](https://github.com/trpc/trpc/tree/main/examples)

### Community Resources

- [T3 Stack](https://create.t3.gg/) - Full-stack starter with tRPC
- [tRPC Discord](https://trpc.io/discord) - Community support

### Related Technologies

- **Zod**: Schema validation library
- **TanStack Query**: Async state management
- **Next.js**: React framework with API routes
- **Prisma**: Type-safe database ORM

### Advanced Topics

- WebSocket subscriptions
- Server-Side Rendering (SSR) with tRPC
- Building a tRPC adapter for custom frameworks
- Microservices communication with tRPC

---

tRPC represents a significant advancement in full-stack TypeScript development. By eliminating the need for schema definitions and code generation, it provides an unparalleled developer experience while maintaining type safety across your entire application. Whether you're building a small side project or a large-scale application, tRPC offers the tools you need to move fast without breaking things.
