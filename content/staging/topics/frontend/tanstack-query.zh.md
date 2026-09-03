---
title: TanStack Query 数据获取
description: 掌握TanStack Query进行服务端状态管理和数据获取
track: frontend
section: react
difficulty: intermediate
tags:
  - TanStack Query
  - React Query
  - 数据获取
  - 缓存
status: imported
origin: old/src/content/docs/frontend/tanstack-query.zh.md
divergence: 0.267
issues: []
legacy:
  category: Frontend
  subcategory: Data Fetching
  order: 36
  lastUpdated: 2026-01-07
---

TanStack Query（前身为 React Query）是一个强大的异步状态管理库，专门用于处理服务端数据的获取、缓存、同步和更新。它彻底改变了前端应用处理服务端状态的方式，让开发者可以专注于业务逻辑而非繁琐的数据管理。

## 服务端状态 vs 客户端状态

### 理解两种状态的本质区别

在现代前端应用中，状态可以分为两大类：

**客户端状态（Client State）**：
- 完全由客户端控制和拥有
- 同步且可预测
- 生命周期与应用一致
- 例如：UI 状态、表单输入、主题偏好、路由状态

**服务端状态（Server State）**：
- 数据源在远程服务器
- 异步且存在延迟
- 可能被其他用户修改
- 需要缓存和同步策略
- 例如：用户数据、商品列表、订单信息

```javascript
// 客户端状态：使用 useState 即可
const [isOpen, setIsOpen] = useState(false);
const [theme, setTheme] = useState('dark');

// 服务端状态：需要考虑更多问题
// - 数据何时过期？
// - 如何处理加载状态？
// - 如何处理错误？
// - 如何缓存数据？
// - 如何在后台更新？
```

### 传统方式的痛点

使用 `useEffect` + `useState` 管理服务端状态时，需要手动处理大量逻辑：

```javascript
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/users/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('请求失败');
        return res.json();
      })
      .then(data => {
        if (!cancelled) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [userId]);

  // 还需要考虑：缓存、重试、后台刷新、数据同步...
}
```

TanStack Query 将这些复杂性封装起来，提供优雅的解决方案。

## 快速开始

### 安装与配置

```bash
npm install @tanstack/react-query
# 可选：开发者工具
npm install @tanstack/react-query-devtools
```

### 基础设置

```javascript
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分钟内数据视为新鲜
      gcTime: 1000 * 60 * 30,   // 30分钟后垃圾回收
      retry: 3,                  // 失败重试3次
      refetchOnWindowFocus: true, // 窗口聚焦时重新获取
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## 查询（Queries）

### useQuery 基础用法

`useQuery` 是 TanStack Query 的核心 Hook，用于获取和缓存数据。

```javascript
import { useQuery } from '@tanstack/react-query';

function TodoList() {
  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isStale,
    refetch,
  } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('获取失败');
      return response.json();
    },
  });

  if (isPending) return <div>加载中...</div>;
  if (isError) return <div>错误: {error.message}</div>;

  return (
    <div>
      {isFetching && <span>后台更新中...</span>}
      <ul>
        {data.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
      <button onClick={() => refetch()}>刷新</button>
    </div>
  );
}
```

### 查询键（Query Keys）

查询键是查询的唯一标识符，用于缓存和失效。

```javascript
// 简单字符串
useQuery({ queryKey: ['todos'], ... });

// 带参数的数组
useQuery({ queryKey: ['todo', todoId], ... });

// 复杂对象（会被序列化比较）
useQuery({
  queryKey: ['todos', { status: 'done', page: 1 }],
  ...
});

// 查询键层级结构
// ['todos'] - 所有 todos
// ['todos', 'list'] - todo 列表
// ['todos', 'list', { status: 'active' }] - 活跃的 todo 列表
// ['todos', 'detail', todoId] - 单个 todo 详情
```

### 依赖查询

当一个查询依赖于另一个查询的结果时：

```javascript
function UserPosts({ userId }) {
  // 先获取用户
  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // 依赖用户数据获取帖子
  const postsQuery = useQuery({
    queryKey: ['posts', userQuery.data?.id],
    queryFn: () => fetchPostsByUser(userQuery.data.id),
    // 只有用户数据加载完成后才启用
    enabled: !!userQuery.data?.id,
  });

  if (userQuery.isPending) return <div>加载用户...</div>;
  if (postsQuery.isPending) return <div>加载帖子...</div>;

  return (
    <div>
      <h1>{userQuery.data.name} 的帖子</h1>
      {postsQuery.data.map(post => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  );
}
```

### 并行查询

同时获取多个独立的数据：

```javascript
import { useQueries } from '@tanstack/react-query';

function Dashboard() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['users'],
        queryFn: fetchUsers,
      },
      {
        queryKey: ['posts'],
        queryFn: fetchPosts,
      },
      {
        queryKey: ['comments'],
        queryFn: fetchComments,
      },
    ],
  });

  const isLoading = results.some(result => result.isPending);
  const isError = results.some(result => result.isError);

  if (isLoading) return <div>加载中...</div>;
  if (isError) return <div>发生错误</div>;

  const [users, posts, comments] = results;

  return (
    <div>
      <UserList data={users.data} />
      <PostList data={posts.data} />
      <CommentList data={comments.data} />
    </div>
  );
}
```

## 变更（Mutations）

### useMutation 基础用法

`useMutation` 用于创建、更新或删除数据。

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function AddTodo() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');

  const mutation = useMutation({
    mutationFn: async (newTodo) => {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      });
      if (!response.ok) throw new Error('创建失败');
      return response.json();
    },
    onSuccess: () => {
      // 成功后使 todos 查询失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setTitle('');
    },
    onError: (error) => {
      alert(`创建失败: ${error.message}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ title, completed: false });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="新待办事项"
      />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? '添加中...' : '添加'}
      </button>
    </form>
  );
}
```

### mutate vs mutateAsync

```javascript
const mutation = useMutation({ mutationFn: addTodo });

// mutate：使用回调处理结果
mutation.mutate(newTodo, {
  onSuccess: (data) => {
    console.log('成功:', data);
  },
  onError: (error) => {
    console.error('失败:', error);
  },
  onSettled: () => {
    console.log('完成');
  },
});

// mutateAsync：使用 async/await
async function handleAdd() {
  try {
    const data = await mutation.mutateAsync(newTodo);
    console.log('成功:', data);
  } catch (error) {
    console.error('失败:', error);
  }
}
```

### Mutation 生命周期回调

```javascript
useMutation({
  mutationFn: updateTodo,
  // 变更开始前
  onMutate: async (variables) => {
    console.log('即将更新:', variables);
    // 可以返回上下文，传递给后续回调
    return { previousData: '...' };
  },
  // 成功时
  onSuccess: (data, variables, context) => {
    console.log('更新成功:', data);
  },
  // 失败时
  onError: (error, variables, context) => {
    console.error('更新失败:', error);
    // context 包含 onMutate 返回的数据
  },
  // 无论成功失败
  onSettled: (data, error, variables, context) => {
    console.log('变更完成');
  },
});
```

## 缓存与失效

### 理解缓存机制

TanStack Query 的缓存基于查询键工作：

```javascript
// 缓存时间配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 数据新鲜期：5分钟
      gcTime: 1000 * 60 * 30,   // 缓存保留期：30分钟
    },
  },
});
```

**staleTime**：数据被视为新鲜的时间
- 在此期间，相同查询键的请求直接返回缓存
- 默认为 0（立即过期）

**gcTime**（原 cacheTime）：缓存数据的保留时间
- 从查询变为非活跃状态开始计时
- 默认为 5 分钟
- 过期后数据被垃圾回收

### 手动失效查询

```javascript
const queryClient = useQueryClient();

// 失效特定查询
queryClient.invalidateQueries({ queryKey: ['todos'] });

// 失效匹配的所有查询
queryClient.invalidateQueries({
  queryKey: ['todos'],
  exact: false, // 匹配以 ['todos'] 开头的所有查询
});

// 使用谓词函数
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'todos' &&
    query.queryKey[1]?.status === 'active',
});

// 失效并立即重新获取
queryClient.invalidateQueries({
  queryKey: ['todos'],
  refetchType: 'active', // 只重新获取活跃查询
});
```

### 直接操作缓存

```javascript
const queryClient = useQueryClient();

// 获取缓存数据
const data = queryClient.getQueryData(['todos']);

// 设置缓存数据
queryClient.setQueryData(['todos'], (oldData) => {
  return [...oldData, newTodo];
});

// 移除查询
queryClient.removeQueries({ queryKey: ['todos'] });

// 重置查询到初始状态
queryClient.resetQueries({ queryKey: ['todos'] });
```

## 分页查询

### 基础分页

```javascript
function PaginatedTodos() {
  const [page, setPage] = useState(1);

  const { data, isPending, isFetching, isPlaceholderData } = useQuery({
    queryKey: ['todos', page],
    queryFn: () => fetchTodos(page),
    placeholderData: (previousData) => previousData, // 保留前一页数据
  });

  return (
    <div>
      {isPending ? (
        <div>加载中...</div>
      ) : (
        <>
          <ul style={{ opacity: isFetching ? 0.5 : 1 }}>
            {data.items.map(todo => (
              <li key={todo.id}>{todo.title}</li>
            ))}
          </ul>

          <div>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              上一页
            </button>
            <span>第 {page} 页</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={isPlaceholderData || !data.hasMore}
            >
              下一页
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

### 预获取下一页

```javascript
function PaginatedTodos() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isPending } = useQuery({
    queryKey: ['todos', page],
    queryFn: () => fetchTodos(page),
    placeholderData: (previousData) => previousData,
  });

  // 预获取下一页
  useEffect(() => {
    if (data?.hasMore) {
      queryClient.prefetchQuery({
        queryKey: ['todos', page + 1],
        queryFn: () => fetchTodos(page + 1),
      });
    }
  }, [data, page, queryClient]);

  // ...渲染逻辑
}
```

## 无限查询

### useInfiniteQuery 基础用法

用于实现"加载更多"或无限滚动功能。

```javascript
import { useInfiniteQuery } from '@tanstack/react-query';

function InfiniteList() {
  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    status,
    error,
  } = useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: async ({ pageParam }) => {
      const response = await fetch(`/api/projects?cursor=${pageParam}`);
      return response.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    getPreviousPageParam: (firstPage) => firstPage.prevCursor ?? undefined,
  });

  if (status === 'pending') return <div>加载中...</div>;
  if (status === 'error') return <div>错误: {error.message}</div>;

  return (
    <div>
      {/* 加载更早的内容 */}
      <button
        onClick={() => fetchPreviousPage()}
        disabled={!hasPreviousPage || isFetchingPreviousPage}
      >
        {isFetchingPreviousPage ? '加载中...' : '加载更早'}
      </button>

      {/* 渲染所有页面 */}
      {data.pages.map((page, pageIndex) => (
        <div key={pageIndex}>
          {page.items.map(item => (
            <div key={item.id}>{item.name}</div>
          ))}
        </div>
      ))}

      {/* 加载更多 */}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? '加载中...'
          : hasNextPage
          ? '加载更多'
          : '没有更多了'}
      </button>
    </div>
  );
}
```

### 无限滚动实现

结合 Intersection Observer 实现自动加载：

```javascript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';

function InfiniteScroll() {
  const loadMoreRef = useRef(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['items'],
    queryFn: ({ pageParam = 0 }) => fetchItems(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // 使用 Intersection Observer 检测滚动到底部
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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (status === 'pending') return <div>加载中...</div>;

  return (
    <div>
      {data.pages.flatMap((page) =>
        page.items.map((item) => (
          <div key={item.id} className="item">
            {item.content}
          </div>
        ))
      )}

      {/* 滚动触发器 */}
      <div ref={loadMoreRef}>
        {isFetchingNextPage && <div>加载更多...</div>}
      </div>
    </div>
  );
}
```

### 限制最大页数

```javascript
useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextId ?? undefined,
  getPreviousPageParam: (firstPage) => firstPage.previousId ?? undefined,
  maxPages: 3, // 最多保留3页数据
});
```

## 乐观更新

### 基于 UI 的乐观更新

当 mutation 和 query 在同一组件时，可以使用简单的方式：

```javascript
function TodoItem({ todo }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: (completed) =>
      fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return (
    <li
      style={{
        textDecoration: toggleMutation.isPending
          ? toggleMutation.variables
            ? 'line-through'
            : 'none'
          : todo.completed
          ? 'line-through'
          : 'none',
        opacity: toggleMutation.isPending ? 0.5 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={toggleMutation.isPending
          ? toggleMutation.variables
          : todo.completed}
        onChange={(e) => toggleMutation.mutate(e.target.checked)}
      />
      {todo.title}
      {toggleMutation.isError && (
        <button onClick={() => toggleMutation.mutate(toggleMutation.variables)}>
          重试
        </button>
      )}
    </li>
  );
}
```

### 基于缓存的乐观更新

更复杂但更通用的方式，直接操作缓存：

```javascript
function AddTodo() {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (newTodo) => createTodo(newTodo),

    onMutate: async (newTodo) => {
      // 取消正在进行的查询，避免覆盖乐观更新
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // 保存之前的数据用于回滚
      const previousTodos = queryClient.getQueryData(['todos']);

      // 乐观更新缓存
      queryClient.setQueryData(['todos'], (old) => [
        ...old,
        { id: Date.now(), ...newTodo },
      ]);

      // 返回上下文供回滚使用
      return { previousTodos };
    },

    onError: (err, newTodo, context) => {
      // 发生错误时回滚
      queryClient.setQueryData(['todos'], context.previousTodos);
    },

    onSettled: () => {
      // 无论成功失败，都重新获取确保数据正确
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  // ...
}
```

### 完整的乐观更新示例

```javascript
function TodoApp() {
  const queryClient = useQueryClient();

  const { data: todos, isPending } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });

  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return response.json();
    },

    onMutate: async (updatedTodo) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      const previousTodos = queryClient.getQueryData(['todos']);

      queryClient.setQueryData(['todos'], (old) =>
        old.map((todo) =>
          todo.id === updatedTodo.id
            ? { ...todo, ...updatedTodo }
            : todo
        )
      );

      return { previousTodos };
    },

    onError: (err, updatedTodo, context) => {
      queryClient.setQueryData(['todos'], context.previousTodos);
      // 显示错误提示
      toast.error('更新失败，已恢复原始数据');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (id) => {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    },

    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      const previousTodos = queryClient.getQueryData(['todos']);

      queryClient.setQueryData(['todos'], (old) =>
        old.filter((todo) => todo.id !== deletedId)
      );

      return { previousTodos };
    },

    onError: (err, deletedId, context) => {
      queryClient.setQueryData(['todos'], context.previousTodos);
      toast.error('删除失败');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  if (isPending) return <div>加载中...</div>;

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={(e) =>
              updateTodoMutation.mutate({
                id: todo.id,
                completed: e.target.checked,
              })
            }
          />
          {todo.title}
          <button onClick={() => deleteTodoMutation.mutate(todo.id)}>
            删除
          </button>
        </li>
      ))}
    </ul>
  );
}
```

## 预获取

### 组件级预获取

在鼠标悬停时预获取数据：

```javascript
function TodoList() {
  const queryClient = useQueryClient();

  const { data: todos } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });

  const prefetchTodo = (id) => {
    queryClient.prefetchQuery({
      queryKey: ['todo', id],
      queryFn: () => fetchTodoById(id),
      staleTime: 1000 * 60 * 5, // 5分钟内不重复预获取
    });
  };

  return (
    <ul>
      {todos?.map((todo) => (
        <li
          key={todo.id}
          onMouseEnter={() => prefetchTodo(todo.id)}
        >
          <Link to={`/todo/${todo.id}`}>{todo.title}</Link>
        </li>
      ))}
    </ul>
  );
}
```

### 路由级预获取

在路由切换前预获取：

```javascript
// 使用 React Router 的 loader
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();

const todoDetailQuery = (id) => ({
  queryKey: ['todo', id],
  queryFn: () => fetchTodoById(id),
  staleTime: 1000 * 60 * 5,
});

// 路由配置
const router = createBrowserRouter([
  {
    path: '/todo/:id',
    element: <TodoDetail />,
    loader: async ({ params }) => {
      const query = todoDetailQuery(params.id);
      // 如果数据新鲜则返回缓存，否则获取新数据
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    },
  },
]);
```

### 预获取无限查询

```javascript
await queryClient.prefetchInfiniteQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  pages: 3, // 预获取前3页
});
```

## 实战模式

### 封装通用查询 Hook

```javascript
// hooks/useTodos.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '../api/todos';

// 查询键工厂
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters: string) => [...todoKeys.lists(), { filters }] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
};

// 获取 todo 列表
export function useTodos(filters) {
  return useQuery({
    queryKey: todoKeys.list(filters),
    queryFn: () => todoApi.getAll(filters),
  });
}

// 获取单个 todo
export function useTodo(id) {
  return useQuery({
    queryKey: todoKeys.detail(id),
    queryFn: () => todoApi.getById(id),
    enabled: !!id,
  });
}

// 创建 todo
export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: todoApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

// 更新 todo
export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }) => todoApi.update(id, data),
    onSuccess: (data, variables) => {
      // 更新详情缓存
      queryClient.setQueryData(todoKeys.detail(variables.id), data);
      // 使列表失效
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

// 删除 todo
export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: todoApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}
```

### 结合 Suspense 使用

```javascript
import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

function TodoList() {
  // useSuspenseQuery 会在加载时挂起组件
  const { data } = useSuspenseQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });

  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}

function App() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <TodoList />
    </Suspense>
  );
}
```

### 错误边界处理

```javascript
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div>
              <h2>出错了！</h2>
              <p>{error.message}</p>
              <button onClick={resetErrorBoundary}>重试</button>
            </div>
          )}
        >
          <Suspense fallback={<div>加载中...</div>}>
            <TodoList />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

### 请求去重与取消

```javascript
// TanStack Query 自动去重相同的请求
function ComponentA() {
  // 这两个组件同时挂载时，只会发起一次请求
  useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
}

function ComponentB() {
  useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
}

// 手动取消请求
function SearchComponent() {
  const [search, setSearch] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['search', search],
    queryFn: async ({ signal }) => {
      // 传递 signal 给 fetch 以支持取消
      const response = await fetch(`/api/search?q=${search}`, { signal });
      return response.json();
    },
    enabled: search.length > 2,
  });

  // 当 search 改变时，之前的请求会被自动取消
}
```

### 轮询与实时数据

```javascript
function LiveData() {
  const { data } = useQuery({
    queryKey: ['live-data'],
    queryFn: fetchLiveData,
    refetchInterval: 1000, // 每秒刷新
    refetchIntervalInBackground: true, // 后台也刷新
  });

  return <div>实时数据: {data?.value}</div>;
}

// 条件轮询
function ConditionalPolling() {
  const [isPolling, setIsPolling] = useState(true);

  const { data } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    refetchInterval: isPolling ? 5000 : false,
  });

  return (
    <div>
      <button onClick={() => setIsPolling(!isPolling)}>
        {isPolling ? '停止' : '开始'}轮询
      </button>
      <div>{data?.value}</div>
    </div>
  );
}
```

## 面试要点

### 高频面试题

**1. TanStack Query 解决了什么问题？**

- 服务端状态的获取、缓存、同步和更新
- 自动处理加载状态、错误状态
- 智能缓存和后台刷新
- 请求去重和取消
- 乐观更新和数据同步

**2. staleTime 和 gcTime 的区别？**

- `staleTime`：数据被视为新鲜的时间，期间不会触发后台刷新
- `gcTime`：缓存保留时间，从查询变为非活跃状态开始计时
- 默认值：staleTime = 0，gcTime = 5分钟

**3. 如何实现乐观更新？**

```javascript
useMutation({
  mutationFn: updateTodo,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const previous = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], (old) => [...old, newData]);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['todos'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

**4. Query Key 的设计原则是什么？**

- 唯一性：每个查询有唯一标识
- 层级结构：便于批量失效
- 包含所有影响数据的参数
- 使用工厂函数统一管理

**5. 如何处理依赖查询？**

使用 `enabled` 选项：

```javascript
const { data: user } = useQuery({ queryKey: ['user'], ... });
const { data: posts } = useQuery({
  queryKey: ['posts', user?.id],
  enabled: !!user?.id,
});
```

### 最佳实践

1. **集中管理查询键**：使用工厂函数生成查询键
2. **合理设置缓存时间**：根据数据特性设置 staleTime
3. **使用 Select 转换数据**：在查询中使用 select 避免不必要的重渲染
4. **封装自定义 Hooks**：将查询逻辑封装为可复用的 Hooks
5. **利用 DevTools**：开发时使用 ReactQueryDevtools 调试

## 延伸阅读

### 官方资源

- [TanStack Query 官方文档](https://tanstack.com/query/latest)
- [TanStack Query GitHub](https://github.com/TanStack/query)

### 相关工具

- **TanStack Router**：与 TanStack Query 深度集成的路由库
- **TanStack Table**：配合 Query 使用的表格库
- **MSW**：Mock Service Worker，用于测试

### 进阶主题

- **Server-Side Rendering**：与 Next.js/Nuxt.js 集成
- **Persisting Cache**：持久化缓存到本地存储
- **Offline Support**：离线支持和同步策略
- **Testing**：使用 React Testing Library 测试查询

## 总结

TanStack Query 是现代 React 应用处理服务端状态的最佳选择。它通过简洁的 API 解决了数据获取中的常见问题：

1. **自动缓存管理**：智能的缓存策略减少不必要的网络请求
2. **状态同步**：后台刷新确保数据始终最新
3. **乐观更新**：提供流畅的用户体验
4. **开发体验**：强大的 DevTools 和 TypeScript 支持

通过本文的学习，你应该能够：

- 理解服务端状态与客户端状态的区别
- 熟练使用 useQuery 和 useMutation
- 掌握缓存策略和失效机制
- 实现分页和无限滚动
- 应用乐观更新提升用户体验
- 设计可维护的查询架构

记住，TanStack Query 不是要替代所有状态管理方案，而是专注于解决服务端状态的问题。将它与 Zustand 或 Jotai 等客户端状态管理库结合使用，可以构建出高效、可维护的现代 React 应用。
