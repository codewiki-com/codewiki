---
title: TanStack Query Data Fetching
description: Master TanStack Query for server state management and data fetching
track: frontend
section: react
difficulty: intermediate
tags:
  - TanStack Query
  - React Query
  - data fetching
  - caching
status: imported
origin: old/src/content/docs/frontend/tanstack-query.en.md
divergence: 0.267
issues: []
legacy:
  category: Frontend
  subcategory: Data Fetching
  order: 36
  lastUpdated: 2026-01-07
---

TanStack Query (formerly React Query) is a powerful library for managing server state in modern web applications. It provides a declarative, auto-managed approach to fetching, caching, synchronizing, and updating server state, eliminating the need for boilerplate code and complex state management patterns.

## Understanding Server State vs Client State

Before diving into TanStack Query, it is essential to understand the fundamental difference between server state and client state.

### Client State

Client state is data that is entirely owned and controlled by the client application:

- UI state (modals open/closed, selected tabs)
- Form input values
- User preferences stored locally
- Application theme settings

Client state is synchronous, predictable, and lives entirely within the browser. Libraries like Redux, Zustand, or React Context are well-suited for managing client state.

### Server State

Server state is fundamentally different:

- Data that lives on a remote server
- Requires asynchronous APIs to fetch and update
- Can become stale or out of sync
- May be modified by other users or processes
- Requires caching, deduplication, and background updates

```typescript
// Server state characteristics
const serverStateProperties = {
  location: 'Remote server',
  access: 'Asynchronous (network requests)',
  ownership: 'Shared (multiple clients can modify)',
  freshness: 'Can become stale over time',
  synchronization: 'Requires explicit sync strategies',
};
```

TanStack Query is specifically designed to handle server state, providing automatic caching, background updates, stale data handling, and much more.

## Setting Up TanStack Query

### Installation and Configuration

```bash
npm install @tanstack/react-query
# Optional: DevTools for debugging
npm install @tanstack/react-query-devtools
```

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a QueryClient with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutes
      gcTime: 1000 * 60 * 10,        // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApplication />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## Queries: Fetching Data

The `useQuery` hook is the primary way to fetch and cache data in TanStack Query.

### Basic Query Usage

```typescript
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  name: string;
  email: string;
}

function fetchUser(userId: number): Promise<User> {
  return fetch(`/api/users/${userId}`).then(res => {
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  });
}

function UserProfile({ userId }: { userId: number }) {
  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
      {isFetching && <span>Updating...</span>}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### Understanding Query States

TanStack Query provides multiple state indicators:

```typescript
const {
  status,        // 'pending' | 'error' | 'success'
  isPending,     // No data yet (first load)
  isError,       // Query encountered an error
  isSuccess,     // Query was successful
  isFetching,    // Query is fetching (including background refetch)
  isLoading,     // isPending && isFetching (true only on initial load)
  isRefetching,  // Background refetch in progress
  isStale,       // Data is considered stale
} = useQuery({ queryKey: ['data'], queryFn: fetchData });
```

**Important distinction:**
- `isPending`: The query has no data yet (cache is empty)
- `isFetching`: A request is in flight (could be initial or background)
- `isLoading`: First load only (`isPending && isFetching`)

### Query Keys

Query keys uniquely identify queries and determine cache entries:

```typescript
// Simple string key
useQuery({ queryKey: ['todos'], queryFn: fetchTodos });

// Key with variables
useQuery({ queryKey: ['todo', todoId], queryFn: () => fetchTodo(todoId) });

// Complex keys with objects
useQuery({
  queryKey: ['todos', { status: 'completed', page: 1 }],
  queryFn: () => fetchTodos({ status: 'completed', page: 1 }),
});

// Keys are compared deeply - order matters for arrays, not for objects
['todos', { page: 1, status: 'done' }] === ['todos', { status: 'done', page: 1 }]
```

### Dependent Queries

Sometimes queries depend on data from other queries:

```typescript
function UserPosts({ userId }: { userId: number }) {
  // First query: fetch user
  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // Second query: depends on user data
  const postsQuery = useQuery({
    queryKey: ['posts', userQuery.data?.id],
    queryFn: () => fetchPostsByAuthor(userQuery.data!.id),
    // Only run when user data is available
    enabled: !!userQuery.data?.id,
  });

  if (userQuery.isPending) return <div>Loading user...</div>;
  if (postsQuery.isPending) return <div>Loading posts...</div>;

  return (
    <div>
      <h1>{userQuery.data.name}'s Posts</h1>
      {postsQuery.data.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

## Mutations: Modifying Data

The `useMutation` hook handles create, update, and delete operations.

### Basic Mutation Usage

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateTodoInput {
  title: string;
  completed: boolean;
}

function TodoForm() {
  const queryClient = useQueryClient();

  const createTodo = useMutation({
    mutationFn: (newTodo: CreateTodoInput) =>
      fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      }).then(res => res.json()),

    onSuccess: () => {
      // Invalidate and refetch todos after successful mutation
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },

    onError: (error) => {
      console.error('Failed to create todo:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTodo.mutate({
      title: formData.get('title') as string,
      completed: false,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Todo title" required />
      <button type="submit" disabled={createTodo.isPending}>
        {createTodo.isPending ? 'Creating...' : 'Create Todo'}
      </button>
      {createTodo.isError && (
        <p className="error">Error: {createTodo.error.message}</p>
      )}
    </form>
  );
}
```

### Mutation Lifecycle Callbacks

```typescript
const mutation = useMutation({
  mutationFn: updateTodo,

  onMutate: async (variables) => {
    // Called before mutation fires
    // Good place for optimistic updates
    console.log('Starting mutation with:', variables);
    return { startTime: Date.now() };
  },

  onSuccess: (data, variables, context) => {
    // Called when mutation succeeds
    console.log('Mutation succeeded:', data);
    console.log('Duration:', Date.now() - context.startTime);
  },

  onError: (error, variables, context) => {
    // Called when mutation fails
    console.error('Mutation failed:', error);
  },

  onSettled: (data, error, variables, context) => {
    // Called regardless of success or failure
    // Good place for cleanup or invalidation
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

## Caching and Invalidation

TanStack Query's caching system is one of its most powerful features.

### Understanding Cache Timing

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long data is considered fresh (no refetch)
      staleTime: 1000 * 60 * 5, // 5 minutes

      // How long inactive data stays in cache before garbage collection
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});
```

**Cache lifecycle:**
1. Query fetches data -> Data is fresh
2. After `staleTime` -> Data becomes stale (triggers background refetch on access)
3. Component unmounts -> Data becomes inactive
4. After `gcTime` -> Inactive data is garbage collected

### Manual Cache Manipulation

```typescript
const queryClient = useQueryClient();

// Get cached data
const cachedTodos = queryClient.getQueryData(['todos']);

// Set cache data directly
queryClient.setQueryData(['todos'], (oldData) => {
  return [...oldData, newTodo];
});

// Invalidate queries (marks as stale, triggers refetch if active)
queryClient.invalidateQueries({ queryKey: ['todos'] });

// Invalidate with specificity
queryClient.invalidateQueries({
  queryKey: ['todos'],
  exact: true, // Only exact match
});

// Invalidate all queries starting with 'todos'
queryClient.invalidateQueries({
  queryKey: ['todos'],
  exact: false, // Default: matches todos, todos/1, todos/completed, etc.
});

// Remove queries from cache entirely
queryClient.removeQueries({ queryKey: ['todos'] });

// Cancel in-flight queries
queryClient.cancelQueries({ queryKey: ['todos'] });
```

## Pagination

TanStack Query provides excellent support for paginated data.

### Basic Pagination

```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query';

interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
}

function PaginatedTodos() {
  const [page, setPage] = useState(1);

  const { data, isPending, isPlaceholderData } = useQuery({
    queryKey: ['todos', 'list', page],
    queryFn: () => fetchTodos(page),
    // Keep showing previous data while fetching new page
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      {isPending ? (
        <div>Loading...</div>
      ) : (
        <>
          <ul style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>
            {data.data.map(todo => (
              <li key={todo.id}>{todo.title}</li>
            ))}
          </ul>

          <div className="pagination">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>

            <span>Page {page} of {data.totalPages}</span>

            <button
              onClick={() => setPage(p => p + 1)}
              disabled={isPlaceholderData || page >= data.totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

## Infinite Queries

For "load more" or infinite scroll patterns, use `useInfiniteQuery`.

### Basic Infinite Query

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

interface PostsPage {
  posts: Post[];
  nextCursor: number | null;
}

function InfinitePostsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['posts', 'infinite'],
    queryFn: async ({ pageParam }): Promise<PostsPage> => {
      const res = await fetch(`/api/posts?cursor=${pageParam}&limit=10`);
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  if (isPending) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.pages.map((page, pageIndex) => (
        <div key={pageIndex}>
          {page.posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
          ? 'Load More'
          : 'No more posts'}
      </button>
    </div>
  );
}
```

### Infinite Scroll with Intersection Observer

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

function InfiniteScrollPosts() {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: ['posts', 'infinite'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // Intersection Observer for automatic loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) return <div>Loading...</div>;

  return (
    <div>
      {data.pages.flatMap(page => page.posts).map(post => (
        <PostCard key={post.id} post={post} />
      ))}

      <div ref={loadMoreRef} style={{ height: 20 }}>
        {isFetchingNextPage && <span>Loading more...</span>}
      </div>
    </div>
  );
}
```

### Bidirectional Infinite Query

```typescript
const {
  data,
  fetchNextPage,
  fetchPreviousPage,
  hasNextPage,
  hasPreviousPage,
  isFetchingNextPage,
  isFetchingPreviousPage,
} = useInfiniteQuery({
  queryKey: ['messages', chatId],
  queryFn: ({ pageParam }) => fetchMessages(chatId, pageParam),
  initialPageParam: { cursor: null, direction: 'forward' },
  getNextPageParam: (lastPage) =>
    lastPage.hasMore ? { cursor: lastPage.endCursor, direction: 'forward' } : undefined,
  getPreviousPageParam: (firstPage) =>
    firstPage.hasPrevious ? { cursor: firstPage.startCursor, direction: 'backward' } : undefined,
  maxPages: 10, // Limit pages to prevent memory issues
});
```

## Optimistic Updates

Optimistic updates provide instant feedback by updating the UI before the server confirms the change.

### Cache-Based Optimistic Updates

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

function useTodoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTodo: string) => {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTodo }),
      });
      return response.json();
    },

    onMutate: async (newTodo) => {
      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

      // Optimistically update the cache
      if (previousTodos) {
        queryClient.setQueryData<Todo[]>(['todos'], [
          ...previousTodos,
          { id: crypto.randomUUID(), text: newTodo, completed: false },
        ]);
      }

      // Return context with snapshot for rollback
      return { previousTodos };
    },

    onError: (err, newTodo, context) => {
      // Rollback to previous value on error
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
    },

    onSettled: () => {
      // Always refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
```

### Optimistic Update for Item Toggle

```typescript
function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (todoId: string) =>
      fetch(`/api/todos/${todoId}/toggle`, { method: 'PATCH' }).then(r => r.json()),

    onMutate: async (todoId) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

      queryClient.setQueryData<Todo[]>(['todos'], (old) =>
        old?.map(todo =>
          todo.id === todoId
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      );

      return { previousTodos };
    },

    onError: (err, todoId, context) => {
      queryClient.setQueryData(['todos'], context?.previousTodos);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
```

## Prefetching

Prefetching allows you to load data before it is needed, improving perceived performance.

### Prefetch on Hover

```typescript
import { useQueryClient } from '@tanstack/react-query';

function TodoList({ todos }: { todos: Todo[] }) {
  const queryClient = useQueryClient();

  const prefetchTodo = (todoId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['todo', todoId],
      queryFn: () => fetchTodo(todoId),
      staleTime: 1000 * 60 * 5, // Only prefetch if data is older than 5 minutes
    });
  };

  return (
    <ul>
      {todos.map(todo => (
        <li
          key={todo.id}
          onMouseEnter={() => prefetchTodo(todo.id)}
        >
          <Link to={`/todos/${todo.id}`}>{todo.title}</Link>
        </li>
      ))}
    </ul>
  );
}
```

### Prefetch on Route Change

```typescript
// With React Router
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function usePrefetchOnNavigation() {
  const queryClient = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    // Prefetch data for likely next pages
    if (location.pathname === '/dashboard') {
      queryClient.prefetchQuery({
        queryKey: ['analytics'],
        queryFn: fetchAnalytics,
      });
      queryClient.prefetchQuery({
        queryKey: ['notifications'],
        queryFn: fetchNotifications,
      });
    }
  }, [location.pathname, queryClient]);
}
```

### Prefetch Infinite Query

```typescript
const prefetchNextPage = async () => {
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    pages: 3, // Prefetch first 3 pages
  });
};
```

## Real-World Patterns

### Custom Query Hook Pattern

Encapsulate query logic in reusable hooks:

```typescript
// hooks/useTodos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const TODOS_KEY = ['todos'] as const;

export function useTodos(filters?: TodoFilters) {
  return useQuery({
    queryKey: [...TODOS_KEY, filters],
    queryFn: () => fetchTodos(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTodo(id: string) {
  return useQuery({
    queryKey: [...TODOS_KEY, id],
    queryFn: () => fetchTodo(id),
    enabled: !!id,
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTodo,
    onSuccess: (data, variables) => {
      // Update specific todo in cache
      queryClient.setQueryData([...TODOS_KEY, variables.id], data);
      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: TODOS_KEY,
        exact: false,
      });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: (_, todoId) => {
      queryClient.removeQueries({ queryKey: [...TODOS_KEY, todoId] });
      queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },
  });
}
```

### Query Factory Pattern

Organize query keys and functions in a factory:

```typescript
// queries/todos.ts
export const todoQueries = {
  all: () => ['todos'] as const,
  lists: () => [...todoQueries.all(), 'list'] as const,
  list: (filters: TodoFilters) =>
    [...todoQueries.lists(), filters] as const,
  details: () => [...todoQueries.all(), 'detail'] as const,
  detail: (id: string) => [...todoQueries.details(), id] as const,
};

export const todoOptions = {
  list: (filters: TodoFilters) => ({
    queryKey: todoQueries.list(filters),
    queryFn: () => fetchTodos(filters),
  }),
  detail: (id: string) => ({
    queryKey: todoQueries.detail(id),
    queryFn: () => fetchTodo(id),
    enabled: !!id,
  }),
};

// Usage
function TodosPage() {
  const filters = { status: 'active' };
  const { data } = useQuery(todoOptions.list(filters));

  // Invalidate all todo queries
  queryClient.invalidateQueries({ queryKey: todoQueries.all() });

  // Invalidate only list queries
  queryClient.invalidateQueries({ queryKey: todoQueries.lists() });
}
```

### Error Handling Pattern

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Global error handler
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Do not retry on 404 or 401
        if (error instanceof ApiError) {
          if (error.status === 404 || error.status === 401) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
    mutations: {
      onError: (error) => {
        // Global mutation error handling
        if (error instanceof ApiError && error.status === 401) {
          // Redirect to login
          window.location.href = '/login';
        }
      },
    },
  },
});

// Custom error boundary for queries
function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div>
          <h2>Something went wrong</h2>
          <p>{error.message}</p>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
      onReset={() => {
        queryClient.clear();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### Combining Queries

```typescript
import { useQueries } from '@tanstack/react-query';

function Dashboard() {
  const results = useQueries({
    queries: [
      { queryKey: ['user'], queryFn: fetchUser },
      { queryKey: ['notifications'], queryFn: fetchNotifications },
      { queryKey: ['analytics'], queryFn: fetchAnalytics },
    ],
  });

  const isLoading = results.some(r => r.isPending);
  const isError = results.some(r => r.isError);

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorMessage />;

  const [user, notifications, analytics] = results.map(r => r.data);

  return (
    <div>
      <UserCard user={user} />
      <NotificationList notifications={notifications} />
      <AnalyticsChart data={analytics} />
    </div>
  );
}
```

## Interview Focus Points

### Common Interview Questions

**1. What is the difference between staleTime and gcTime?**

- `staleTime`: How long data is considered fresh. During this time, no refetch occurs.
- `gcTime`: How long inactive (unmounted) query data stays in cache before garbage collection.

**2. When would you use useMutation over a regular fetch?**

`useMutation` provides:
- Loading, error, and success states
- Lifecycle callbacks (onMutate, onSuccess, onError, onSettled)
- Optimistic update support
- Automatic retry configuration
- Integration with query invalidation

**3. How do you implement optimistic updates?**

Use the `onMutate` callback to:
1. Cancel outgoing queries
2. Snapshot current cache state
3. Optimistically update the cache
4. Return snapshot for rollback in `onError`

**4. Explain the query key structure.**

Query keys are arrays that uniquely identify queries. They should include:
- Entity type (e.g., 'todos')
- Specific identifiers (e.g., todoId)
- Filter/sort parameters as objects
- Keys are compared deeply for cache matching

**5. How does TanStack Query handle stale data?**

By default, stale data is shown immediately while a background refetch occurs. This provides instant UI feedback while ensuring data freshness. Refetches are triggered on:
- Window focus
- Network reconnection
- Component mount
- Manual invalidation

### Best Practices Summary

1. **Use query keys consistently** - Follow a factory pattern for complex apps
2. **Set appropriate staleTime** - Avoid unnecessary refetches for rarely changing data
3. **Invalidate strategically** - Use specific query keys to avoid over-fetching
4. **Handle loading and error states** - Provide meaningful UI feedback
5. **Use optimistic updates sparingly** - Only when UX benefits outweigh complexity
6. **Prefetch anticipatable data** - Improve perceived performance
7. **Leverage DevTools** - Debug cache state and query timing

## Further Reading

### Official Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [TanStack Query Examples](https://tanstack.com/query/latest/docs/framework/react/examples)

### Related Topics

- **React Suspense** - Integrate with Suspense for data fetching
- **Server Components** - Using TanStack Query with RSC
- **Testing** - Testing strategies for queries and mutations
- **SSR/Hydration** - Server-side rendering with prefetched data

## Summary

TanStack Query transforms how we handle server state in React applications. Its declarative approach eliminates boilerplate code while providing powerful features like automatic caching, background updates, and optimistic mutations.

Key takeaways:
- Server state requires different handling than client state
- Query keys are the foundation of caching and invalidation
- Mutations handle data modifications with lifecycle callbacks
- Optimistic updates provide instant feedback with rollback capability
- Prefetching anticipates user needs for better performance
- Custom hooks encapsulate and reuse query logic effectively

By mastering TanStack Query, you can build faster, more responsive applications with less code and better user experiences.
