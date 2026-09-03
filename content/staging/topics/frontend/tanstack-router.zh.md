---
title: TanStack Router 路由
description: 深入理解 TanStack Router - 一个完全类型安全的 React 路由库，具有一流的搜索参数支持
track: frontend
section: react
difficulty: intermediate
tags:
  - TanStack Router
  - React
  - 路由
  - TypeScript
  - 类型安全
  - SPA
status: imported
origin: old/src/content/docs/frontend/tanstack-router.zh.md
divergence: 0.215
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Frontend
  subcategory: ""
  order: 4
  lastUpdated: 2026-01-22
---

TanStack Router 是一个完全类型安全的 React 路由库，为搜索参数、嵌套布局和数据加载提供一流支持。与传统路由器不同，TanStack Router 将 URL 视为一个完全类型化的状态管理系统，从路由定义到组件 props 提供前所未有的类型安全。

## 概念解释

### 什么是 TanStack Router？

**TanStack Router** 是一个从零开始使用 TypeScript 构建的现代路由器，为路由、路径参数、搜索参数和加载器数据提供类型推断。它设计为与 TanStack Query 无缝协作，并内置支持路由级代码分割、数据预加载和待处理 UI 状态。

```typescript
// 传统路由器 - 参数没有类型安全
<Route path="/users/:id" component={UserPage} />
// 在组件中: const { id } = useParams(); // id 是 string | undefined

// TanStack Router - 完全类型化
const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  component: UserPage,
});
// 在组件中: const { userId } = userRoute.useParams(); // userId 是 string（保证的）
```

关键洞察在于 TanStack Router 颠覆了典型的路由器设计。路由不再是组件必须解释的字符串模板，而是成为生成整个应用程序类型安全工具的 TypeScript 优先定义。

### 发展历史

React 中的路由领域经历了显著演进：

| 时期 | 技术 | 方式 |
|------|------|------|
| 2014 | React Router v1 | 基于组件的路由 |
| 2017 | React Router v4 | 声明式、动态路由 |
| 2019 | Reach Router | 专注于无障碍 |
| 2021 | React Router v6 | 基于对象的路由，嵌套布局 |
| 2022 | Remix | 全栈数据加载 |
| 2023 | TanStack Router | 类型安全，搜索参数优先 |
| 2024 | TanStack Router 1.0 | 生产就绪版本 |

### TanStack Router 与其他路由器对比

#### TanStack Router vs React Router

```typescript
// React Router v6
// routes.tsx
const router = createBrowserRouter([
  {
    path: '/users/:userId',
    element: <UserPage />,
    loader: async ({ params }) => {
      return fetchUser(params.userId); // userId 是 string | undefined
    }
  }
]);

// 组件
function UserPage() {
  const { userId } = useParams(); // 类型: { userId: string | undefined }
  const data = useLoaderData(); // 类型: unknown
}

// TanStack Router
// routes.tsx
const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  validateSearch: (search) => ({
    tab: (search.tab as string) || 'profile'
  }),
  loader: async ({ params }) => {
    return fetchUser(params.userId); // userId 是 string（保证的）
  },
  component: UserPage,
});

// 组件
function UserPage() {
  const { userId } = userRoute.useParams(); // 类型: { userId: string }
  const { tab } = userRoute.useSearch(); // 类型: { tab: string }
  const data = userRoute.useLoaderData(); // 类型: User（从 loader 推断）
}
```

### TanStack Router 的核心特征

1. **100% 类型安全**：所有路由工具的完整 TypeScript 推断
2. **搜索参数作为状态**：一流的搜索参数支持，带验证
3. **内置数据加载**：带类型推断和预加载的加载器
4. **嵌套布局**：带共享布局的层级路由结构
5. **代码分割**：自动路由级代码分割
6. **待处理 UI**：内置加载和待处理状态支持
7. **开发工具**：用于调试的综合开发工具

## 核心原理

### 路由树架构

TanStack Router 使用路由树而不是扁平的路由数组：

```typescript
// 路由树结构
const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: UsersLayout,
});

const userRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: '/$userId',
  component: UserPage,
});

// 构建树
const routeTree = rootRoute.addChildren([
  indexRoute,
  usersRoute.addChildren([userRoute]),
]);

// 可视化表示：
// rootRoute (/)
// ├── indexRoute (/)
// └── usersRoute (/users)
//     └── userRoute (/users/$userId)
```

### 类型推断流程

类型在整个路由定义中流动：

```typescript
// 1. 用类型化的 params 和 search 定义路由
const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',

  // 2. 验证搜索参数 - 定义形状
  validateSearch: (search: Record<string, unknown>) => ({
    tab: z.enum(['profile', 'posts', 'settings']).catch('profile').parse(search.tab),
    page: z.number().catch(1).parse(search.page),
  }),

  // 3. Loader 接收类型化的 params 和 search
  loader: async ({ params, search }) => {
    // params.userId 是 string
    // search.tab 是 'profile' | 'posts' | 'settings'
    // search.page 是 number
    return fetchUserData(params.userId, search.tab, search.page);
  },

  // 4. 组件可以访问类型化的工具
  component: UserPage,
});

// 5. 在组件中 - 一切都是类型化的
function UserPage() {
  const { userId } = userRoute.useParams(); // string
  const { tab, page } = userRoute.useSearch(); // { tab: 'profile' | 'posts' | 'settings', page: number }
  const data = userRoute.useLoaderData(); // loader 的返回类型
}
```

### 搜索参数作为状态

TanStack Router 将搜索参数视为类型化状态：

```typescript
// 定义验证的搜索参数
const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  validateSearch: (search) => ({
    category: z.string().optional().parse(search.category),
    minPrice: z.number().optional().parse(search.minPrice),
    maxPrice: z.number().optional().parse(search.maxPrice),
    sort: z.enum(['price', 'name', 'date']).catch('date').parse(search.sort),
    order: z.enum(['asc', 'desc']).catch('desc').parse(search.order),
    page: z.number().catch(1).parse(search.page),
  }),
  component: ProductsPage,
});

// 在组件中使用
function ProductsPage() {
  const search = productsRoute.useSearch();
  const navigate = useNavigate();

  // 带类型安全地更新搜索参数
  const setCategory = (category: string) => {
    navigate({
      search: (prev) => ({ ...prev, category, page: 1 }),
    });
  };

  // URL: /products?category=electronics&sort=price&order=asc&page=1
  // search 是完全类型化的: { category?: string, minPrice?: number, ... }
}
```

### 数据加载和预加载

TanStack Router 提供内置数据加载：

```typescript
// 带 loader 的路由
const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',

  // Loader 在组件渲染前运行
  loader: async ({ params, context, abortController }) => {
    const user = await fetchUser(params.userId, {
      signal: abortController.signal,
    });
    return { user };
  },

  // 加载时显示的待处理组件
  pendingComponent: () => <UserSkeleton />,

  // loader 错误的错误组件
  errorComponent: ({ error }) => <UserError error={error} />,

  component: UserPage,
});

// 悬停/聚焦时预加载
function UserList({ users }) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <Link
            to="/users/$userId"
            params={{ userId: user.id }}
            preload="intent" // 悬停时预加载
          >
            {user.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

## 核心要点

### 路由配置

TanStack Router 的基本路由设置：

```typescript
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';

export const rootRoute = createRootRoute({
  component: () => (
    <div>
      <Navigation />
      <main>
        <Outlet /> {/* 子路由在这里渲染 */}
      </main>
      <Footer />
    </div>
  ),
});
```

```typescript
// src/routes/index.tsx
import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <HomePage />,
});
```

```typescript
// src/router.tsx
import { createRouter } from '@tanstack/react-router';
import { rootRoute } from './routes/__root';
import { indexRoute } from './routes/index';
import { usersRoute, userRoute } from './routes/users';

const routeTree = rootRoute.addChildren([
  indexRoute,
  usersRoute.addChildren([userRoute]),
]);

export const router = createRouter({ routeTree });

// 注册路由器以获得类型安全
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

```typescript
// src/main.tsx
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';

function App() {
  return <RouterProvider router={router} />;
}
```

### 基于文件的路由

TanStack Router 支持基于文件的路由：

```
src/routes/
├── __root.tsx           # 根布局
├── index.tsx            # / 路由
├── about.tsx            # /about 路由
├── users/
│   ├── index.tsx        # /users 路由
│   ├── $userId.tsx      # /users/:userId 路由
│   └── $userId/
│       ├── index.tsx    # /users/:userId (index)
│       └── posts.tsx    # /users/:userId/posts 路由
└── _layout/
    └── dashboard.tsx    # 没有 URL 段的布局
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

export default defineConfig({
  plugins: [TanStackRouterVite()],
});
```

### 路径参数

定义和使用路径参数：

```typescript
// 单个参数
const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  component: UserPage,
});

// 多个参数
const postRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId/posts/$postId',
  component: PostPage,
});

// 通配符/catch-all
const filesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/files/$', // 匹配 /files/any/path/here
  component: FilesPage,
});

// 在组件中使用 params
function PostPage() {
  const { userId, postId } = postRoute.useParams();
  // 两者都是 string 类型
}
```

### 带验证的搜索参数

全面的搜索参数处理：

```typescript
import { z } from 'zod';

// 定义搜索 schema
const searchSchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    category: z.string().optional(),
    status: z.enum(['active', 'inactive', 'all']).optional(),
  }).optional(),
  pagination: z.object({
    page: z.number().default(1),
    pageSize: z.number().default(20),
  }).default({}),
  sort: z.object({
    field: z.string().default('createdAt'),
    direction: z.enum(['asc', 'desc']).default('desc'),
  }).default({}),
});

const itemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/items',
  validateSearch: (search) => searchSchema.parse(search),
  component: ItemsPage,
});

// 带搜索状态的组件
function ItemsPage() {
  const search = itemsRoute.useSearch();
  const navigate = useNavigate();

  // 更新嵌套的搜索参数
  const setPage = (page: number) => {
    navigate({
      search: (prev) => ({
        ...prev,
        pagination: { ...prev.pagination, page },
      }),
    });
  };

  const setSort = (field: string, direction: 'asc' | 'desc') => {
    navigate({
      search: (prev) => ({
        ...prev,
        sort: { field, direction },
      }),
    });
  };

  // search 根据 schema 完全类型化
  const { query, filters, pagination, sort } = search;
}
```

### 数据加载

与 TanStack Query 集成的路由加载器：

```typescript
import { createRoute } from '@tanstack/react-router';
import { queryClient } from '../queryClient';

// 基本 loader
const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  loader: async ({ params }) => {
    const user = await fetchUser(params.userId);
    return { user };
  },
  component: UserPage,
});

// 带 TanStack Query 的 Loader
const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  loader: async () => {
    // 确保数据在缓存中
    await queryClient.ensureQueryData({
      queryKey: ['users'],
      queryFn: fetchUsers,
    });
  },
  component: UsersPage,
});

// 带 context 的 Loader
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: async ({ context }) => {
    // 检查认证
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  loader: async ({ context }) => {
    return fetchDashboardData(context.auth.userId);
  },
  component: DashboardPage,
});
```

### 导航

各种导航方法：

```typescript
import { Link, useNavigate, useRouter } from '@tanstack/react-router';

// 使用 Link 的声明式导航
function Navigation() {
  return (
    <nav>
      {/* 基本链接 */}
      <Link to="/">首页</Link>

      {/* 带 params 的链接 */}
      <Link to="/users/$userId" params={{ userId: '123' }}>
        用户资料
      </Link>

      {/* 带搜索参数的链接 */}
      <Link
        to="/products"
        search={{ category: 'electronics', page: 1 }}
      >
        电子产品
      </Link>

      {/* 活动链接样式 */}
      <Link
        to="/about"
        activeProps={{ className: 'active' }}
        inactiveProps={{ className: 'inactive' }}
      >
        关于
      </Link>

      {/* 预加载 */}
      <Link to="/dashboard" preload="intent">
        仪表板
      </Link>
    </nav>
  );
}

// 编程式导航
function UserActions() {
  const navigate = useNavigate();
  const router = useRouter();

  const goToUser = (userId: string) => {
    navigate({
      to: '/users/$userId',
      params: { userId },
    });
  };

  const updateSearch = () => {
    navigate({
      search: (prev) => ({ ...prev, tab: 'settings' }),
    });
  };

  const goBack = () => {
    router.history.back();
  };

  const replace = () => {
    navigate({
      to: '/new-page',
      replace: true, // 替换当前历史条目
    });
  };
}
```

## 代码示例

### 完整应用设置

```typescript
// src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

interface RouterContext {
  auth: {
    isAuthenticated: boolean;
    userId: string | null;
  };
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <header>
        <Navigation />
      </header>
      <main>
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </>
  ),
  notFoundComponent: () => <NotFound />,
});
```

```typescript
// src/routes/users/$userId.tsx
import { createRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { rootRoute } from '../__root';

const searchSchema = z.object({
  tab: z.enum(['profile', 'posts', 'followers']).catch('profile'),
});

export const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  validateSearch: (search) => searchSchema.parse(search),

  loader: async ({ params, context, abortController }) => {
    const [user, stats] = await Promise.all([
      fetchUser(params.userId, { signal: abortController.signal }),
      fetchUserStats(params.userId, { signal: abortController.signal }),
    ]);
    return { user, stats };
  },

  pendingComponent: () => (
    <div className="animate-pulse">
      <UserSkeleton />
    </div>
  ),

  errorComponent: ({ error, reset }) => (
    <div className="error">
      <h2>加载用户时出错</h2>
      <p>{error.message}</p>
      <button onClick={reset}>重试</button>
    </div>
  ),

  component: UserPage,
});

function UserPage() {
  const { userId } = userRoute.useParams();
  const { tab } = userRoute.useSearch();
  const { user, stats } = userRoute.useLoaderData();
  const navigate = useNavigate();

  return (
    <div>
      <UserHeader user={user} stats={stats} />

      <nav className="tabs">
        {(['profile', 'posts', 'followers'] as const).map((t) => (
          <button
            key={t}
            className={tab === t ? 'active' : ''}
            onClick={() => navigate({ search: { tab: t } })}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="tab-content">
        {tab === 'profile' && <UserProfile user={user} />}
        {tab === 'posts' && <UserPosts userId={userId} />}
        {tab === 'followers' && <UserFollowers userId={userId} />}
      </div>
    </div>
  );
}
```

### 认证流程

```typescript
// src/routes/_authenticated.tsx
import { createRoute, redirect, Outlet } from '@tanstack/react-router';
import { rootRoute } from './__root';

// 认证页面的布局路由
export const authenticatedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authenticated',

  beforeLoad: async ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },

  component: () => (
    <div className="authenticated-layout">
      <Sidebar />
      <div className="content">
        <Outlet />
      </div>
    </div>
  ),
});

// 仪表板路由（受保护）
export const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedLayout,
  path: '/dashboard',

  loader: async ({ context }) => {
    return fetchDashboardData(context.auth.userId!);
  },

  component: DashboardPage,
});

// 带重定向处理的登录路由
export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',

  validateSearch: z.object({
    redirect: z.string().optional(),
  }),

  component: LoginPage,
});

function LoginPage() {
  const { redirect: redirectUrl } = loginRoute.useSearch();
  const navigate = useNavigate();

  const handleLogin = async (credentials: Credentials) => {
    await login(credentials);

    navigate({
      to: redirectUrl || '/dashboard',
    });
  };

  return <LoginForm onSubmit={handleLogin} />;
}
```

### 嵌套布局

```typescript
// src/routes/settings.tsx
import { createRoute, Outlet } from '@tanstack/react-router';

// 设置布局
export const settingsRoute = createRoute({
  getParentRoute: () => authenticatedLayout,
  path: '/settings',

  component: () => (
    <div className="settings-layout">
      <aside>
        <SettingsNav />
      </aside>
      <div className="settings-content">
        <Outlet />
      </div>
    </div>
  ),
});

// 设置首页
export const settingsIndexRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/',
  component: () => <SettingsOverview />,
});

// 个人资料设置
export const profileSettingsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/profile',
  component: () => <ProfileSettings />,
});

// 安全设置
export const securitySettingsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/security',
  component: () => <SecuritySettings />,
});

// 通知设置
export const notificationsSettingsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/notifications',
  component: () => <NotificationSettings />,
});

function SettingsNav() {
  return (
    <nav>
      <Link to="/settings" activeOptions={{ exact: true }}>
        概览
      </Link>
      <Link to="/settings/profile">个人资料</Link>
      <Link to="/settings/security">安全</Link>
      <Link to="/settings/notifications">通知</Link>
    </nav>
  );
}
```

### URL 状态的搜索参数

```typescript
// URL 中的复杂筛选状态
const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders',

  validateSearch: z.object({
    // 筛选器
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'all']).catch('all'),
    dateRange: z.object({
      from: z.string().optional(),
      to: z.string().optional(),
    }).optional(),
    customerId: z.string().optional(),

    // 分页
    page: z.number().catch(1),
    pageSize: z.number().catch(20),

    // 排序
    sortBy: z.enum(['date', 'total', 'status']).catch('date'),
    sortOrder: z.enum(['asc', 'desc']).catch('desc'),

    // 视图模式
    view: z.enum(['table', 'cards']).catch('table'),
  }),

  component: OrdersPage,
});

function OrdersPage() {
  const search = ordersRoute.useSearch();
  const navigate = useNavigate();

  // 创建设置器辅助函数
  const setFilter = <K extends keyof typeof search>(
    key: K,
    value: typeof search[K]
  ) => {
    navigate({
      search: (prev) => ({ ...prev, [key]: value, page: 1 }),
    });
  };

  const setPage = (page: number) => {
    navigate({
      search: (prev) => ({ ...prev, page }),
    });
  };

  const setSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    navigate({
      search: (prev) => ({ ...prev, sortBy, sortOrder }),
    });
  };

  // 分享带当前筛选的 URL
  const getShareableUrl = () => {
    const url = new URL(window.location.href);
    return url.toString();
  };

  return (
    <div>
      <OrderFilters
        filters={search}
        onStatusChange={(status) => setFilter('status', status)}
        onDateRangeChange={(range) => setFilter('dateRange', range)}
      />

      <OrderList
        orders={orders}
        viewMode={search.view}
        sortBy={search.sortBy}
        sortOrder={search.sortOrder}
        onSort={setSort}
      />

      <Pagination
        currentPage={search.page}
        pageSize={search.pageSize}
        totalItems={totalOrders}
        onPageChange={setPage}
      />

      <button onClick={() => navigator.clipboard.writeText(getShareableUrl())}>
        分享筛选 URL
      </button>
    </div>
  );
}
```

### 代码分割

```typescript
// 懒加载路由
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: lazyRouteComponent(() => import('./pages/Dashboard')),
});

// 或使用 lazy 辅助函数
import { lazyRouteComponent } from '@tanstack/react-router';

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: lazyRouteComponent(
    () => import('./pages/Analytics'),
    'AnalyticsPage' // 命名导出
  ),
});

// 基于文件的路由会自动处理
// src/routes/heavy-page.lazy.tsx
export const Route = createLazyFileRoute('/heavy-page')({
  component: HeavyPage,
});
```

## 最佳实践

### 路由组织

```typescript
// 按功能组织路由
// src/routes/
// ├── __root.tsx
// ├── index.tsx
// ├── auth/
// │   ├── login.tsx
// │   └── register.tsx
// ├── dashboard/
// │   ├── _layout.tsx
// │   ├── index.tsx
// │   └── analytics.tsx
// └── users/
//     ├── index.tsx
//     └── $userId.tsx

// 对共享 UI 使用布局路由
export const dashboardLayout = createRoute({
  getParentRoute: () => authenticatedRoute,
  id: 'dashboard-layout',
  component: DashboardLayout,
});

// 分组相关路由
export const dashboardRoutes = dashboardLayout.addChildren([
  dashboardIndexRoute,
  dashboardAnalyticsRoute,
  dashboardSettingsRoute,
]);
```

### 搜索参数模式

```typescript
// 1. 单独定义 schema 以便复用
const paginationSchema = z.object({
  page: z.number().catch(1),
  pageSize: z.number().catch(20),
});

const sortSchema = z.object({
  sortBy: z.string().catch('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).catch('desc'),
});

// 2. 组合 schemas
const listSearchSchema = paginationSchema.merge(sortSchema).extend({
  query: z.string().optional(),
});

// 3. 创建类型化的设置器 hooks
function useSearchParamSetter<T extends z.ZodType>(route: RouteApi<any, any, T>) {
  const navigate = useNavigate();

  return useCallback(
    <K extends keyof z.infer<T>>(key: K, value: z.infer<T>[K]) => {
      navigate({
        search: (prev) => ({ ...prev, [key]: value }),
      });
    },
    [navigate]
  );
}
```

### Loader 模式

```typescript
// 1. 对共享依赖使用 context
const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!, // 将在 RouterProvider 中设置
  },
});

// 2. 并行数据加载
const userRoute = createRoute({
  loader: async ({ params }) => {
    const [user, posts, followers] = await Promise.all([
      fetchUser(params.userId),
      fetchUserPosts(params.userId),
      fetchUserFollowers(params.userId),
    ]);
    return { user, posts, followers };
  },
});

// 3. 条件加载
const userRoute = createRoute({
  loader: async ({ params, search }) => {
    const user = await fetchUser(params.userId);

    // 只有需要时才加载额外数据
    if (search.tab === 'posts') {
      const posts = await fetchUserPosts(params.userId);
      return { user, posts };
    }

    return { user };
  },
});
```

### 错误处理

```typescript
// 全局错误边界
const rootRoute = createRootRoute({
  component: RootLayout,

  errorComponent: ({ error, reset }) => {
    // 记录错误
    console.error('根错误:', error);

    return (
      <div className="error-page">
        <h1>出错了</h1>
        <button onClick={reset}>重试</button>
        <Link to="/">返回首页</Link>
      </div>
    );
  },
});

// 路由特定的错误处理
const userRoute = createRoute({
  loader: async ({ params }) => {
    const user = await fetchUser(params.userId);
    if (!user) {
      throw new NotFoundError(`用户 ${params.userId} 未找到`);
    }
    return { user };
  },

  errorComponent: ({ error }) => {
    if (error instanceof NotFoundError) {
      return <UserNotFound />;
    }
    return <UserError error={error} />;
  },
});
```

## 常见陷阱

### 类型注册

```typescript
// 问题：组件中的类型不工作
const { userId } = useParams(); // 类型错误

// 解决方案：注册路由器以获得全局类型
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// 现在 useParams 知道所有路由参数
```

### 搜索参数序列化

```typescript
// 问题：复杂对象序列化不正确
const search = {
  filters: { categories: ['a', 'b'], price: { min: 10, max: 100 } }
};
// URL 可能格式错误

// 解决方案：使用正确的序列化
const productsRoute = createRoute({
  validateSearch: (search) => ({
    filters: JSON.parse(search.filters as string || '{}'),
  }),

  // 或配置自定义序列化器
  search: {
    strict: true,
    parse: (searchStr) => JSON.parse(searchStr),
    stringify: (search) => JSON.stringify(search),
  },
});
```

### Loader vs 组件数据获取

```typescript
// 反模式：在组件中获取
function UserPage() {
  const { userId } = userRoute.useParams();
  const { data } = useQuery(['user', userId], () => fetchUser(userId));
  // 这不能从预加载中受益
}

// 更好：对关键数据使用 loader
const userRoute = createRoute({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData({
      queryKey: ['user', params.userId],
      queryFn: () => fetchUser(params.userId),
    });
  },
  component: UserPage,
});

function UserPage() {
  const { userId } = userRoute.useParams();
  // 数据已经从 loader 在缓存中
  const { data } = useQuery(['user', userId], () => fetchUser(userId));
}
```

### 导航状态

```typescript
// 问题：导航时状态丢失
function FormPage() {
  const [formData, setFormData] = useState(initialData);
  // 导航离开时 formData 丢失
}

// 解决方案 1：存储在搜索参数中
const formRoute = createRoute({
  validateSearch: z.object({
    draft: z.string().optional(),
  }),
});

function FormPage() {
  const { draft } = formRoute.useSearch();
  const formData = draft ? JSON.parse(draft) : initialData;
}

// 解决方案 2：使用路由状态
navigate({
  to: '/confirm',
  state: { formData }, // 在下一个路由中可用
});
```

## 性能考量

### 预加载策略

```typescript
// 1. 基于意图的预加载（悬停/聚焦时）
<Link to="/dashboard" preload="intent">
  仪表板
</Link>

// 2. 视口预加载（链接进入视口时）
<Link to="/products" preload="viewport">
  产品
</Link>

// 3. 渲染预加载（立即）
<Link to="/about" preload="render">
  关于
</Link>

// 4. 手动预加载
const router = useRouter();

function PreloadOnMount() {
  useEffect(() => {
    router.preloadRoute({ to: '/dashboard' });
  }, []);
}
```

### 懒加载

```typescript
// 路由级代码分割
const analyticsRoute = createRoute({
  path: '/analytics',
  component: lazy(() => import('./pages/Analytics')),
});

// 带加载状态
const analyticsRoute = createRoute({
  path: '/analytics',
  component: lazy(() => import('./pages/Analytics')),
  pendingComponent: AnalyticsSkeleton,
  pendingMs: 200, // 200ms 后才显示骨架屏
  pendingMinMs: 500, // 骨架屏至少显示 500ms
});
```

### Stale-While-Revalidate

```typescript
// 配置 loader 缓存
const userRoute = createRoute({
  path: '/users/$userId',
  loader: async ({ params }) => fetchUser(params.userId),

  // Loader 缓存选项
  loaderMaxAge: 1000 * 60 * 5, // 缓存 5 分钟
  loaderGcMaxAge: 1000 * 60 * 30, // 在内存中保留 30 分钟
  shouldReload: ({ params, search }) => {
    // 自定义重新加载逻辑
    return search.refresh === true;
  },
});
```

## 实战场景

### 电商产品列表

```typescript
const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',

  validateSearch: z.object({
    category: z.string().optional(),
    brand: z.array(z.string()).optional(),
    priceRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    inStock: z.boolean().optional(),
    sort: z.enum(['price-asc', 'price-desc', 'newest', 'popular']).catch('popular'),
    page: z.number().catch(1),
    view: z.enum(['grid', 'list']).catch('grid'),
  }),

  loaderDeps: ({ search }) => ({ search }),

  loader: async ({ deps: { search } }) => {
    const products = await fetchProducts(search);
    const facets = await fetchFacets(search.category);
    return { products, facets };
  },

  component: ProductsPage,
});

function ProductsPage() {
  const search = productsRoute.useSearch();
  const { products, facets } = productsRoute.useLoaderData();
  const navigate = useNavigate();

  return (
    <div className="products-page">
      <FilterSidebar
        facets={facets}
        selected={search}
        onChange={(filters) => {
          navigate({
            search: { ...filters, page: 1 },
          });
        }}
      />

      <ProductGrid
        products={products.items}
        view={search.view}
        onViewChange={(view) => navigate({ search: (prev) => ({ ...prev, view }) })}
      />

      <Pagination
        current={search.page}
        total={products.totalPages}
        onChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
      />
    </div>
  );
}
```

### 多步骤表单向导

```typescript
const wizardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',

  validateSearch: z.object({
    step: z.number().min(1).max(4).catch(1),
  }),

  component: OnboardingWizard,
});

function OnboardingWizard() {
  const { step } = wizardRoute.useSearch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<WizardData>({});

  const steps = [
    { component: PersonalInfo, title: '个人信息' },
    { component: CompanyInfo, title: '公司详情' },
    { component: Preferences, title: '偏好设置' },
    { component: Review, title: '审核和提交' },
  ];

  const goToStep = (newStep: number) => {
    navigate({ search: { step: newStep } });
  };

  const handleNext = (stepData: Partial<WizardData>) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
    goToStep(step + 1);
  };

  const handleBack = () => {
    goToStep(step - 1);
  };

  const CurrentStep = steps[step - 1].component;

  return (
    <div className="wizard">
      <StepIndicator steps={steps} currentStep={step} onStepClick={goToStep} />

      <CurrentStep
        data={formData}
        onNext={handleNext}
        onBack={handleBack}
        isFirst={step === 1}
        isLast={step === steps.length}
      />
    </div>
  );
}
```

## 面试要点

### 核心概念

**Q1：TanStack Router 与 React Router 有什么不同？**

1. **类型安全**：params、search 和 loader 数据的完整 TypeScript 推断
2. **搜索参数**：一流支持，带验证和类型安全
3. **内置加载**：开箱即用的 loaders、待处理状态和预加载
4. **URL 作为状态**：将 URL 视为类型化的状态管理系统
5. **路由树**：层级路由结构 vs 扁平数组

**Q2：TanStack Router 如何实现类型安全？**

1. 路由定义为带泛型类型的 TypeScript 对象
2. `validateSearch` 定义搜索参数 schema
3. Loader 返回类型自动推断
4. 路由器注册启用全局类型推断
5. 路由特定的 hooks（`route.useParams()`）提供精确类型

**Q3：解释 TanStack Router 中的数据加载模型。**

```typescript
const route = createRoute({
  // 1. beforeLoad - 认证检查，重定向
  beforeLoad: async ({ context }) => {
    if (!context.auth) throw redirect({ to: '/login' });
  },

  // 2. loader - 获取数据
  loader: async ({ params }) => fetchData(params.id),

  // 3. pendingComponent - 加载 UI
  pendingComponent: Skeleton,

  // 4. errorComponent - 错误 UI
  errorComponent: ErrorBoundary,

  // 5. component - 带数据的主 UI
  component: Page,
});
```

### 实践问题

**Q4：如何处理复杂的搜索参数？**

```typescript
// 1. 用 Zod 定义 schema
const searchSchema = z.object({
  filters: z.object({...}).optional(),
  pagination: z.object({...}).default({}),
});

// 2. 在路由中使用
validateSearch: (search) => searchSchema.parse(search),

// 3. 带类型安全地更新
navigate({
  search: (prev) => ({
    ...prev,
    filters: newFilters,
  }),
});
```

**Q5：如何使用 TanStack Router 实现认证？**

1. 对 auth 状态使用 context
2. 创建带 `beforeLoad` 检查的布局路由
3. 带返回 URL 重定向到登录
4. 处理登录后导航

## 延伸阅读

### 官方文档

- [TanStack Router 文档](https://tanstack.com/router/latest) - 官方文档
- [TanStack Router GitHub](https://github.com/TanStack/router) - 源代码
- [TanStack Router 示例](https://tanstack.com/router/latest/docs/examples) - 示例项目

### 相关库

- [TanStack Query](https://tanstack.com/query/latest) - 数据获取伴侣
- [Zod](https://zod.dev/) - 搜索参数的 Schema 验证

### 社区资源

- [TanStack Discord](https://tlinz.com/discord) - 社区讨论
- [TanStack 博客](https://tanstack.com/blog) - 官方博客

---

TanStack Router 代表了 React 路由的重大进步，为传统上依赖运行时字符串匹配的领域带来了完整的类型安全。通过将 URL 视为类型化状态并为搜索参数和数据加载提供一流支持，它使构建更健壮和可维护的应用程序成为可能。它与更广泛的 TanStack 生态系统的集成使其对数据驱动的应用程序特别强大。
