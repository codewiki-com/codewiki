---
title: TanStack Router
description: Deep dive into TanStack Router - a fully type-safe router for React with first-class search parameter support
track: frontend
section: react
difficulty: intermediate
tags:
  - TanStack Router
  - React
  - Routing
  - TypeScript
  - Type Safety
  - SPA
status: imported
origin: old/src/content/docs/frontend/tanstack-router.en.md
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

TanStack Router is a fully type-safe routing library for React applications that provides first-class support for search parameters, nested layouts, and data loading. Unlike traditional routers, TanStack Router treats URLs as a fully-typed state management system, offering unprecedented type safety from route definitions to component props.

## Concept Explanation

### What is TanStack Router?

**TanStack Router** is a modern router built from the ground up with TypeScript, offering type inference for routes, path parameters, search parameters, and loader data. It's designed to work seamlessly with TanStack Query and provides built-in support for route-level code splitting, data preloading, and pending UI states.

```typescript
// Traditional router - no type safety for params
<Route path="/users/:id" component={UserPage} />
// In component: const { id } = useParams(); // id is string | undefined

// TanStack Router - fully typed
const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  component: UserPage,
});
// In component: const { userId } = userRoute.useParams(); // userId is string (guaranteed)
```

The key insight is that TanStack Router inverts the typical router design. Instead of routes being string templates that components must interpret, routes become TypeScript-first definitions that generate type-safe utilities for the entire application.

### History and Evolution

The routing landscape in React has evolved significantly:

| Era | Technology | Approach |
|-----|------------|----------|
| 2014 | React Router v1 | Component-based routing |
| 2017 | React Router v4 | Declarative, dynamic routing |
| 2019 | Reach Router | Accessibility-focused |
| 2021 | React Router v6 | Object-based routes, nested layouts |
| 2022 | Remix | Full-stack data loading |
| 2023 | TanStack Router | Type-safe, search-param first |
| 2024 | TanStack Router 1.0 | Production-ready release |

### TanStack Router vs Other Routers

#### TanStack Router vs React Router

```typescript
// React Router v6
// routes.tsx
const router = createBrowserRouter([
  {
    path: '/users/:userId',
    element: <UserPage />,
    loader: async ({ params }) => {
      return fetchUser(params.userId); // userId is string | undefined
    }
  }
]);

// Component
function UserPage() {
  const { userId } = useParams(); // Type: { userId: string | undefined }
  const data = useLoaderData(); // Type: unknown
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
    return fetchUser(params.userId); // userId is string (guaranteed)
  },
  component: UserPage,
});

// Component
function UserPage() {
  const { userId } = userRoute.useParams(); // Type: { userId: string }
  const { tab } = userRoute.useSearch(); // Type: { tab: string }
  const data = userRoute.useLoaderData(); // Type: User (inferred from loader)
}
```

### Key Characteristics of TanStack Router

1. **100% Type Safety**: Full TypeScript inference for all route utilities
2. **Search Params as State**: First-class search parameter support with validation
3. **Built-in Data Loading**: Loaders with type inference and preloading
4. **Nested Layouts**: Hierarchical route structure with shared layouts
5. **Code Splitting**: Automatic route-level code splitting
6. **Pending UI**: Built-in support for loading and pending states
7. **Devtools**: Comprehensive devtools for debugging

## Core Principles

### Route Tree Architecture

TanStack Router uses a route tree instead of flat route arrays:

```typescript
// Route Tree Structure
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

// Build the tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  usersRoute.addChildren([userRoute]),
]);

// Visual representation:
// rootRoute (/)
// ├── indexRoute (/)
// └── usersRoute (/users)
//     └── userRoute (/users/$userId)
```

### Type Inference Flow

Types flow through the entire route definition:

```typescript
// 1. Define route with typed params and search
const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',

  // 2. Validate search params - defines the shape
  validateSearch: (search: Record<string, unknown>) => ({
    tab: z.enum(['profile', 'posts', 'settings']).catch('profile').parse(search.tab),
    page: z.number().catch(1).parse(search.page),
  }),

  // 3. Loader receives typed params and search
  loader: async ({ params, search }) => {
    // params.userId is string
    // search.tab is 'profile' | 'posts' | 'settings'
    // search.page is number
    return fetchUserData(params.userId, search.tab, search.page);
  },

  // 4. Component has access to typed utilities
  component: UserPage,
});

// 5. In component - everything is typed
function UserPage() {
  const { userId } = userRoute.useParams(); // string
  const { tab, page } = userRoute.useSearch(); // { tab: 'profile' | 'posts' | 'settings', page: number }
  const data = userRoute.useLoaderData(); // Return type of loader
}
```

### Search Parameters as State

TanStack Router treats search params as typed state:

```typescript
// Define validated search params
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

// Use in component
function ProductsPage() {
  const search = productsRoute.useSearch();
  const navigate = useNavigate();

  // Update search params with type safety
  const setCategory = (category: string) => {
    navigate({
      search: (prev) => ({ ...prev, category, page: 1 }),
    });
  };

  // URL: /products?category=electronics&sort=price&order=asc&page=1
  // search is fully typed: { category?: string, minPrice?: number, ... }
}
```

### Data Loading and Preloading

TanStack Router provides built-in data loading:

```typescript
// Route with loader
const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',

  // Loader runs before component renders
  loader: async ({ params, context, abortController }) => {
    const user = await fetchUser(params.userId, {
      signal: abortController.signal,
    });
    return { user };
  },

  // Pending component shown while loading
  pendingComponent: () => <UserSkeleton />,

  // Error component for loader errors
  errorComponent: ({ error }) => <UserError error={error} />,

  component: UserPage,
});

// Preloading on hover/focus
function UserList({ users }) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <Link
            to="/users/$userId"
            params={{ userId: user.id }}
            preload="intent" // Preload on hover
          >
            {user.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

## Core Concepts

### Route Configuration

Basic route setup with TanStack Router:

```typescript
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';

export const rootRoute = createRootRoute({
  component: () => (
    <div>
      <Navigation />
      <main>
        <Outlet /> {/* Child routes render here */}
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

// Register router for type safety
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

### File-Based Routing

TanStack Router supports file-based routing:

```
src/routes/
├── __root.tsx           # Root layout
├── index.tsx            # / route
├── about.tsx            # /about route
├── users/
│   ├── index.tsx        # /users route
│   ├── $userId.tsx      # /users/:userId route
│   └── $userId/
│       ├── index.tsx    # /users/:userId (index)
│       └── posts.tsx    # /users/:userId/posts route
└── _layout/
    └── dashboard.tsx    # Layout without URL segment
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

export default defineConfig({
  plugins: [TanStackRouterVite()],
});
```

### Path Parameters

Define and use path parameters:

```typescript
// Single parameter
const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  component: UserPage,
});

// Multiple parameters
const postRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId/posts/$postId',
  component: PostPage,
});

// Wildcard/catch-all
const filesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/files/$', // Matches /files/any/path/here
  component: FilesPage,
});

// Using params in component
function PostPage() {
  const { userId, postId } = postRoute.useParams();
  // Both are typed as string
}
```

### Search Parameters with Validation

Comprehensive search param handling:

```typescript
import { z } from 'zod';

// Define search schema
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

// Component with search state
function ItemsPage() {
  const search = itemsRoute.useSearch();
  const navigate = useNavigate();

  // Update nested search params
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

  // search is fully typed based on schema
  const { query, filters, pagination, sort } = search;
}
```

### Data Loading

Route loaders with TanStack Query integration:

```typescript
import { createRoute } from '@tanstack/react-router';
import { queryClient } from '../queryClient';

// Basic loader
const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  loader: async ({ params }) => {
    const user = await fetchUser(params.userId);
    return { user };
  },
  component: UserPage,
});

// Loader with TanStack Query
const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  loader: async () => {
    // Ensure data is in cache
    await queryClient.ensureQueryData({
      queryKey: ['users'],
      queryFn: fetchUsers,
    });
  },
  component: UsersPage,
});

// Loader with context
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: async ({ context }) => {
    // Check authentication
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

### Navigation

Various navigation methods:

```typescript
import { Link, useNavigate, useRouter } from '@tanstack/react-router';

// Declarative navigation with Link
function Navigation() {
  return (
    <nav>
      {/* Basic link */}
      <Link to="/">Home</Link>

      {/* Link with params */}
      <Link to="/users/$userId" params={{ userId: '123' }}>
        User Profile
      </Link>

      {/* Link with search params */}
      <Link
        to="/products"
        search={{ category: 'electronics', page: 1 }}
      >
        Electronics
      </Link>

      {/* Active link styling */}
      <Link
        to="/about"
        activeProps={{ className: 'active' }}
        inactiveProps={{ className: 'inactive' }}
      >
        About
      </Link>

      {/* Preloading */}
      <Link to="/dashboard" preload="intent">
        Dashboard
      </Link>
    </nav>
  );
}

// Programmatic navigation
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
      replace: true, // Replace current history entry
    });
  };
}
```

## Code Examples

### Complete Application Setup

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
      <h2>Error loading user</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
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

### Authentication Flow

```typescript
// src/routes/_authenticated.tsx
import { createRoute, redirect, Outlet } from '@tanstack/react-router';
import { rootRoute } from './__root';

// Layout route for authenticated pages
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

// Dashboard route (protected)
export const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedLayout,
  path: '/dashboard',

  loader: async ({ context }) => {
    return fetchDashboardData(context.auth.userId!);
  },

  component: DashboardPage,
});

// Login route with redirect handling
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

### Nested Layouts

```typescript
// src/routes/settings.tsx
import { createRoute, Outlet } from '@tanstack/react-router';

// Settings layout
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

// Settings index
export const settingsIndexRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/',
  component: () => <SettingsOverview />,
});

// Profile settings
export const profileSettingsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/profile',
  component: () => <ProfileSettings />,
});

// Security settings
export const securitySettingsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/security',
  component: () => <SecuritySettings />,
});

// Notifications settings
export const notificationsSettingsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/notifications',
  component: () => <NotificationSettings />,
});

function SettingsNav() {
  return (
    <nav>
      <Link to="/settings" activeOptions={{ exact: true }}>
        Overview
      </Link>
      <Link to="/settings/profile">Profile</Link>
      <Link to="/settings/security">Security</Link>
      <Link to="/settings/notifications">Notifications</Link>
    </nav>
  );
}
```

### Search Params with URL State

```typescript
// Complex filter state in URL
const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders',

  validateSearch: z.object({
    // Filters
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'all']).catch('all'),
    dateRange: z.object({
      from: z.string().optional(),
      to: z.string().optional(),
    }).optional(),
    customerId: z.string().optional(),

    // Pagination
    page: z.number().catch(1),
    pageSize: z.number().catch(20),

    // Sorting
    sortBy: z.enum(['date', 'total', 'status']).catch('date'),
    sortOrder: z.enum(['asc', 'desc']).catch('desc'),

    // View mode
    view: z.enum(['table', 'cards']).catch('table'),
  }),

  component: OrdersPage,
});

function OrdersPage() {
  const search = ordersRoute.useSearch();
  const navigate = useNavigate();

  // Create setter helpers
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

  // Share URL with current filters
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
        Share Filter URL
      </button>
    </div>
  );
}
```

### Code Splitting

```typescript
// Lazy loading routes
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: lazyRouteComponent(() => import('./pages/Dashboard')),
});

// Or with the lazy helper
import { lazyRouteComponent } from '@tanstack/react-router';

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: lazyRouteComponent(
    () => import('./pages/Analytics'),
    'AnalyticsPage' // Named export
  ),
});

// File-based routing handles this automatically
// src/routes/heavy-page.lazy.tsx
export const Route = createLazyFileRoute('/heavy-page')({
  component: HeavyPage,
});
```

## Best Practices

### Route Organization

```typescript
// Organize routes by feature
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

// Use layout routes for shared UI
export const dashboardLayout = createRoute({
  getParentRoute: () => authenticatedRoute,
  id: 'dashboard-layout',
  component: DashboardLayout,
});

// Group related routes
export const dashboardRoutes = dashboardLayout.addChildren([
  dashboardIndexRoute,
  dashboardAnalyticsRoute,
  dashboardSettingsRoute,
]);
```

### Search Param Patterns

```typescript
// 1. Define schemas separately for reuse
const paginationSchema = z.object({
  page: z.number().catch(1),
  pageSize: z.number().catch(20),
});

const sortSchema = z.object({
  sortBy: z.string().catch('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).catch('desc'),
});

// 2. Compose schemas
const listSearchSchema = paginationSchema.merge(sortSchema).extend({
  query: z.string().optional(),
});

// 3. Create typed setter hooks
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

### Loader Patterns

```typescript
// 1. Use context for shared dependencies
const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!, // Will be set in RouterProvider
  },
});

// 2. Parallel data loading
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

// 3. Conditional loading
const userRoute = createRoute({
  loader: async ({ params, search }) => {
    const user = await fetchUser(params.userId);

    // Only load additional data if needed
    if (search.tab === 'posts') {
      const posts = await fetchUserPosts(params.userId);
      return { user, posts };
    }

    return { user };
  },
});
```

### Error Handling

```typescript
// Global error boundary
const rootRoute = createRootRoute({
  component: RootLayout,

  errorComponent: ({ error, reset }) => {
    // Log error
    console.error('Root error:', error);

    return (
      <div className="error-page">
        <h1>Something went wrong</h1>
        <button onClick={reset}>Try again</button>
        <Link to="/">Go home</Link>
      </div>
    );
  },
});

// Route-specific error handling
const userRoute = createRoute({
  loader: async ({ params }) => {
    const user = await fetchUser(params.userId);
    if (!user) {
      throw new NotFoundError(`User ${params.userId} not found`);
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

## Common Pitfalls

### Type Registration

```typescript
// Problem: Types not working in components
const { userId } = useParams(); // Type error

// Solution: Register router for global types
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Now useParams knows about all route params
```

### Search Param Serialization

```typescript
// Problem: Complex objects not serializing correctly
const search = {
  filters: { categories: ['a', 'b'], price: { min: 10, max: 100 } }
};
// URL might be malformed

// Solution: Use proper serialization
const productsRoute = createRoute({
  validateSearch: (search) => ({
    filters: JSON.parse(search.filters as string || '{}'),
  }),

  // Or configure custom serializers
  search: {
    strict: true,
    parse: (searchStr) => JSON.parse(searchStr),
    stringify: (search) => JSON.stringify(search),
  },
});
```

### Loader vs Component Data Fetching

```typescript
// Anti-pattern: Fetching in component
function UserPage() {
  const { userId } = userRoute.useParams();
  const { data } = useQuery(['user', userId], () => fetchUser(userId));
  // This doesn't benefit from preloading
}

// Better: Use loader for critical data
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
  // Data is already in cache from loader
  const { data } = useQuery(['user', userId], () => fetchUser(userId));
}
```

### Navigation State

```typescript
// Problem: State lost on navigation
function FormPage() {
  const [formData, setFormData] = useState(initialData);
  // formData is lost when navigating away
}

// Solution 1: Store in search params
const formRoute = createRoute({
  validateSearch: z.object({
    draft: z.string().optional(),
  }),
});

function FormPage() {
  const { draft } = formRoute.useSearch();
  const formData = draft ? JSON.parse(draft) : initialData;
}

// Solution 2: Use route state
navigate({
  to: '/confirm',
  state: { formData }, // Available in next route
});
```

## Performance Considerations

### Preloading Strategies

```typescript
// 1. Intent-based preloading (on hover/focus)
<Link to="/dashboard" preload="intent">
  Dashboard
</Link>

// 2. Viewport preloading (when link enters viewport)
<Link to="/products" preload="viewport">
  Products
</Link>

// 3. Render preloading (immediately)
<Link to="/about" preload="render">
  About
</Link>

// 4. Manual preloading
const router = useRouter();

function PreloadOnMount() {
  useEffect(() => {
    router.preloadRoute({ to: '/dashboard' });
  }, []);
}
```

### Lazy Loading

```typescript
// Route-level code splitting
const analyticsRoute = createRoute({
  path: '/analytics',
  component: lazy(() => import('./pages/Analytics')),
});

// With loading state
const analyticsRoute = createRoute({
  path: '/analytics',
  component: lazy(() => import('./pages/Analytics')),
  pendingComponent: AnalyticsSkeleton,
  pendingMs: 200, // Only show skeleton after 200ms
  pendingMinMs: 500, // Show skeleton for at least 500ms
});
```

### Stale-While-Revalidate

```typescript
// Configure loader caching
const userRoute = createRoute({
  path: '/users/$userId',
  loader: async ({ params }) => fetchUser(params.userId),

  // Loader caching options
  loaderMaxAge: 1000 * 60 * 5, // Cache for 5 minutes
  loaderGcMaxAge: 1000 * 60 * 30, // Keep in memory for 30 minutes
  shouldReload: ({ params, search }) => {
    // Custom reload logic
    return search.refresh === true;
  },
});
```

## Real-World Scenarios

### E-commerce Product Listing

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

### Multi-Step Form Wizard

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
    { component: PersonalInfo, title: 'Personal Information' },
    { component: CompanyInfo, title: 'Company Details' },
    { component: Preferences, title: 'Preferences' },
    { component: Review, title: 'Review & Submit' },
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

## Interview Key Points

### Core Concepts

**Q1: What makes TanStack Router different from React Router?**

1. **Type Safety**: Full TypeScript inference for params, search, and loader data
2. **Search Params**: First-class support with validation and type safety
3. **Built-in Loading**: Loaders, pending states, and preloading out of the box
4. **URL as State**: Treats URL as a typed state management system
5. **Route Tree**: Hierarchical route structure vs flat arrays

**Q2: How does TanStack Router achieve type safety?**

1. Routes are defined as TypeScript objects with generic types
2. `validateSearch` defines the search param schema
3. Loader return types are inferred automatically
4. Router registration enables global type inference
5. Route-specific hooks (`route.useParams()`) provide exact types

**Q3: Explain the data loading model in TanStack Router.**

```typescript
const route = createRoute({
  // 1. beforeLoad - auth checks, redirects
  beforeLoad: async ({ context }) => {
    if (!context.auth) throw redirect({ to: '/login' });
  },

  // 2. loader - fetch data
  loader: async ({ params }) => fetchData(params.id),

  // 3. pendingComponent - loading UI
  pendingComponent: Skeleton,

  // 4. errorComponent - error UI
  errorComponent: ErrorBoundary,

  // 5. component - main UI with data
  component: Page,
});
```

### Practical Questions

**Q4: How do you handle complex search parameters?**

```typescript
// 1. Define schema with Zod
const searchSchema = z.object({
  filters: z.object({...}).optional(),
  pagination: z.object({...}).default({}),
});

// 2. Use in route
validateSearch: (search) => searchSchema.parse(search),

// 3. Update with type safety
navigate({
  search: (prev) => ({
    ...prev,
    filters: newFilters,
  }),
});
```

**Q5: How do you implement authentication with TanStack Router?**

1. Use context for auth state
2. Create layout route with `beforeLoad` check
3. Redirect to login with return URL
4. Handle post-login navigation

## Further Reading

### Official Documentation

- [TanStack Router Documentation](https://tanstack.com/router/latest) - Official docs
- [TanStack Router GitHub](https://github.com/TanStack/router) - Source code
- [TanStack Router Examples](https://tanstack.com/router/latest/docs/examples) - Example projects

### Related Libraries

- [TanStack Query](https://tanstack.com/query/latest) - Data fetching companion
- [Zod](https://zod.dev/) - Schema validation for search params

### Community Resources

- [TanStack Discord](https://tlinz.com/discord) - Community discussions
- [TanStack Blog](https://tanstack.com/blog) - Official blog

---

TanStack Router represents a significant advancement in React routing, bringing full type safety to an area that has traditionally relied on runtime string matching. By treating URLs as typed state and providing first-class support for search parameters and data loading, it enables building more robust and maintainable applications. Its integration with the broader TanStack ecosystem makes it particularly powerful for data-driven applications.
