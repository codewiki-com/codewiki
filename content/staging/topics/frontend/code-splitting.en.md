---
title: Code Splitting Strategies Explained
description: Master code splitting techniques to optimize JavaScript application load times and performance
track: frontend
section: performance
difficulty: intermediate
tags:
  - Code Splitting
  - Dynamic Import
  - Lazy Loading
  - Bundle Optimization
  - Webpack
  - Performance
status: imported
origin: old/src/content/docs/javascript/code-splitting.en.md
divergence: 0.233
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: JavaScript
  subcategory: ""
  order: null
  lastUpdated: 2026-01-22
---

Code splitting is a technique that divides your JavaScript bundle into smaller chunks that can be loaded on demand. Instead of loading all your application code upfront, you load only what's needed for the current view, deferring the rest until required. This dramatically improves initial load time and overall application performance.

## Why Code Splitting Matters

Modern JavaScript applications can easily grow to several megabytes. Loading everything upfront creates significant problems:

| Problem | Impact | Solution |
|---------|--------|----------|
| Large initial bundle | Slow first paint, poor UX | Split by routes |
| Unused code loaded | Wasted bandwidth | Dynamic imports |
| Main thread blocking | UI unresponsive | Async chunk loading |
| Poor caching | Full re-download on changes | Vendor splitting |

### The Problem with Monolithic Bundles

```
Traditional Single Bundle:
┌────────────────────────────────────────────┐
│                  app.js                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐  │
│  │ Home │ │ User │ │Admin │ │ Vendor   │  │
│  │ 50KB │ │ 80KB │ │120KB │ │ Libs     │  │
│  │      │ │      │ │      │ │ 500KB    │  │
│  └──────┘ └──────┘ └──────┘ └──────────┘  │
│                Total: 750KB                 │
└────────────────────────────────────────────┘
User visits home page → Downloads 750KB
Actually needs: 50KB (Home) + 500KB (Vendors) = 550KB
Wasted: 200KB (User + Admin)
```

### Code Splitting Solution

```
With Code Splitting:
Initial Load:                    On Demand:
┌─────────────────┐             ┌──────┐
│    main.js      │             │ User │ (loaded when visiting /user)
│  ┌──────┐       │             │ 80KB │
│  │ Home │       │             └──────┘
│  │ 50KB │       │             ┌──────┐
│  └──────┘       │             │Admin │ (loaded when visiting /admin)
│    100KB total  │             │120KB │
└─────────────────┘             └──────┘
┌─────────────────┐
│   vendors.js    │
│    (cached)     │
│     500KB       │
└─────────────────┘

User visits home page → Downloads 600KB
User visits /user → Downloads additional 80KB
Admin user visits /admin → Downloads additional 120KB
Regular users never download admin code!
```

## Core Concepts

### Dynamic Imports

The foundation of code splitting is the dynamic `import()` syntax:

```javascript
// Static import - always loaded
import { heavyFunction } from './heavy-module';

// Dynamic import - loaded on demand
const module = await import('./heavy-module');
module.heavyFunction();

// Or with .then()
import('./heavy-module').then(module => {
  module.heavyFunction();
});
```

### Chunk Types

| Chunk Type | Purpose | When to Use |
|------------|---------|-------------|
| Entry chunks | Main application code | Always needed |
| Async chunks | Lazy-loaded features | Routes, modals, features |
| Vendor chunks | Third-party libraries | Shared dependencies |
| Common chunks | Shared application code | Code used by multiple routes |

### Loading States

```javascript
// Always handle loading states for async chunks
async function loadFeature() {
  showLoadingSpinner();

  try {
    const module = await import('./feature');
    module.initialize();
  } catch (error) {
    showError('Failed to load feature');
  } finally {
    hideLoadingSpinner();
  }
}
```

## Implementation Strategies

### Route-Based Splitting

The most common and effective strategy - split by application routes:

```javascript
// React with React Router
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load route components
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

```javascript
// Vue with Vue Router
const routes = [
  {
    path: '/',
    component: () => import('./pages/Home.vue'),
  },
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard.vue'),
  },
  {
    path: '/settings',
    // Named chunk
    component: () => import(/* webpackChunkName: "settings" */ './pages/Settings.vue'),
  },
  {
    path: '/admin',
    // Group admin routes in one chunk
    component: () => import(/* webpackChunkName: "admin" */ './pages/Admin.vue'),
    children: [
      {
        path: 'users',
        component: () => import(/* webpackChunkName: "admin" */ './pages/AdminUsers.vue'),
      },
      {
        path: 'reports',
        component: () => import(/* webpackChunkName: "admin" */ './pages/AdminReports.vue'),
      },
    ],
  },
];
```

### Component-Based Splitting

Split heavy components that aren't always needed:

```javascript
// React
import { lazy, Suspense, useState } from 'react';

// Heavy components loaded on demand
const RichTextEditor = lazy(() => import('./components/RichTextEditor'));
const ChartDashboard = lazy(() => import('./components/ChartDashboard'));
const VideoPlayer = lazy(() => import('./components/VideoPlayer'));

function ArticleEditor() {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div>
      <button onClick={() => setShowEditor(true)}>
        Open Rich Text Editor
      </button>

      {showEditor && (
        <Suspense fallback={<EditorSkeleton />}>
          <RichTextEditor />
        </Suspense>
      )}
    </div>
  );
}
```

```javascript
// Vue 3
import { defineAsyncComponent, ref } from 'vue';

const RichTextEditor = defineAsyncComponent({
  loader: () => import('./components/RichTextEditor.vue'),
  loadingComponent: EditorSkeleton,
  errorComponent: ErrorDisplay,
  delay: 200,
  timeout: 10000,
});

// In template
// <RichTextEditor v-if="showEditor" />
```

### Vendor Splitting

Separate third-party libraries for better caching:

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Separate React into its own chunk
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 40,
        },
        // UI library separate chunk
        ui: {
          test: /[\\/]node_modules[\\/](@mui|antd)[\\/]/,
          name: 'ui-library',
          chunks: 'all',
          priority: 30,
        },
        // All other vendors
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 20,
        },
        // Shared code between chunks
        common: {
          minChunks: 2,
          priority: 10,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
```

### Feature-Based Splitting

Split by feature modules:

```javascript
// Feature loader pattern
class FeatureLoader {
  static async loadAnalytics() {
    const { Analytics } = await import(
      /* webpackChunkName: "analytics" */
      './features/analytics'
    );
    return new Analytics();
  }

  static async loadNotifications() {
    const { NotificationService } = await import(
      /* webpackChunkName: "notifications" */
      './features/notifications'
    );
    return new NotificationService();
  }

  static async loadPayments() {
    const { PaymentProcessor } = await import(
      /* webpackChunkName: "payments" */
      './features/payments'
    );
    return new PaymentProcessor();
  }
}

// Usage
async function initializeApp() {
  // Core features loaded immediately
  const app = new App();

  // Analytics loaded after initial render
  requestIdleCallback(async () => {
    const analytics = await FeatureLoader.loadAnalytics();
    analytics.trackPageView();
  });
}
```

### Conditional Splitting

Load different code based on conditions:

```javascript
// Based on user role
async function loadDashboard(user) {
  if (user.role === 'admin') {
    const { AdminDashboard } = await import('./dashboards/AdminDashboard');
    return AdminDashboard;
  } else if (user.role === 'manager') {
    const { ManagerDashboard } = await import('./dashboards/ManagerDashboard');
    return ManagerDashboard;
  } else {
    const { UserDashboard } = await import('./dashboards/UserDashboard');
    return UserDashboard;
  }
}

// Based on feature flags
async function loadEditor(featureFlags) {
  if (featureFlags.newEditor) {
    return import('./editors/NewEditor');
  }
  return import('./editors/LegacyEditor');
}

// Based on device/viewport
async function loadGallery() {
  if (window.innerWidth < 768) {
    return import('./galleries/MobileGallery');
  }
  return import('./galleries/DesktopGallery');
}
```

## Bundler Configuration

### Webpack Configuration

```javascript
// webpack.config.js
const path = require('path');

module.exports = {
  entry: {
    main: './src/index.js',
  },
  output: {
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/static/',
    clean: true,
  },
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      maxSize: 244000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
```

### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor splitting
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['@mui/material', '@emotion/react'],

          // Or use a function for more control
          // manualChunks(id) {
          //   if (id.includes('node_modules')) {
          //     if (id.includes('react')) return 'react-vendor';
          //     if (id.includes('@mui')) return 'ui-vendor';
          //     return 'vendor';
          //   }
          // },
        },
        // Customize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
  },
});
```

### Rollup Configuration

```javascript
// rollup.config.js
export default {
  input: 'src/index.js',
  output: {
    dir: 'dist',
    format: 'esm',
    entryFileNames: '[name].[hash].js',
    chunkFileNames: '[name].[hash].js',
    manualChunks: {
      vendor: ['lodash-es', 'date-fns'],
      framework: ['react', 'react-dom'],
    },
  },
  // Preserve dynamic imports
  preserveEntrySignatures: false,
};
```

## Advanced Techniques

### Preloading and Prefetching

```javascript
// Webpack magic comments for preloading
const Dashboard = lazy(() => import(
  /* webpackPreload: true */
  './pages/Dashboard'
));

// Prefetch for likely next navigation
const Settings = lazy(() => import(
  /* webpackPrefetch: true */
  './pages/Settings'
));

// Manual preloading on hover
function NavLink({ to, children }) {
  const preloadRoute = () => {
    // Preload when user hovers over link
    if (to === '/dashboard') {
      import('./pages/Dashboard');
    } else if (to === '/settings') {
      import('./pages/Settings');
    }
  };

  return (
    <Link to={to} onMouseEnter={preloadRoute}>
      {children}
    </Link>
  );
}

// Preload on route transition
function usePreloadOnTransition(routes) {
  const location = useLocation();

  useEffect(() => {
    // After current route loads, preload adjacent routes
    const currentIndex = routes.findIndex(r => r.path === location.pathname);
    const nextRoute = routes[currentIndex + 1];
    const prevRoute = routes[currentIndex - 1];

    if (nextRoute?.preload) nextRoute.preload();
    if (prevRoute?.preload) prevRoute.preload();
  }, [location, routes]);
}
```

### Error Boundaries for Chunks

```javascript
// React error boundary for lazy components
import { Component } from 'react';

class ChunkErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    // Force re-render which will retry the import
    this.forceUpdate();
  };

  render() {
    if (this.state.hasError) {
      // Check if it's a chunk loading error
      if (this.state.error?.name === 'ChunkLoadError') {
        return (
          <div className="chunk-error">
            <p>Failed to load this section.</p>
            <button onClick={this.handleRetry}>
              Retry
            </button>
            <button onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        );
      }

      return <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<Loading />}>
        <LazyComponent />
      </Suspense>
    </ChunkErrorBoundary>
  );
}
```

### Loading Progress

```javascript
// Track chunk loading progress
class ChunkLoadingProgress {
  constructor() {
    this.listeners = new Set();
    this.loading = new Map();
  }

  startLoading(chunkName) {
    this.loading.set(chunkName, { status: 'loading', progress: 0 });
    this.notify();
  }

  updateProgress(chunkName, progress) {
    const chunk = this.loading.get(chunkName);
    if (chunk) {
      chunk.progress = progress;
      this.notify();
    }
  }

  finishLoading(chunkName) {
    this.loading.delete(chunkName);
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = {
      isLoading: this.loading.size > 0,
      chunks: Array.from(this.loading.entries()),
    };
    this.listeners.forEach(listener => listener(state));
  }
}

const chunkProgress = new ChunkLoadingProgress();

// Wrapper for dynamic imports
async function loadChunk(name, importFn) {
  chunkProgress.startLoading(name);

  try {
    const module = await importFn();
    chunkProgress.finishLoading(name);
    return module;
  } catch (error) {
    chunkProgress.finishLoading(name);
    throw error;
  }
}

// Usage
const Dashboard = lazy(() =>
  loadChunk('dashboard', () => import('./pages/Dashboard'))
);
```

### Module Federation

Share code between micro-frontends:

```javascript
// webpack.config.js (Host App)
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        // Load modules from remote apps
        userApp: 'userApp@http://localhost:3001/remoteEntry.js',
        adminApp: 'adminApp@http://localhost:3002/remoteEntry.js',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
};

// webpack.config.js (Remote App - userApp)
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'userApp',
      filename: 'remoteEntry.js',
      exposes: {
        './UserProfile': './src/components/UserProfile',
        './UserSettings': './src/components/UserSettings',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
};

// Usage in Host App
const UserProfile = lazy(() => import('userApp/UserProfile'));
const UserSettings = lazy(() => import('userApp/UserSettings'));
```

### Route-Based Code Splitting with Data Loading

```javascript
// React Router with data loading
import { createBrowserRouter, defer } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'dashboard',
        lazy: async () => {
          // Load component and data in parallel
          const [{ Dashboard }, data] = await Promise.all([
            import('./pages/Dashboard'),
            fetchDashboardData(),
          ]);
          return {
            element: <Dashboard />,
            loader: () => data,
          };
        },
      },
      {
        path: 'users/:id',
        lazy: async () => {
          const { UserDetail } = await import('./pages/UserDetail');
          return {
            element: <UserDetail />,
            loader: async ({ params }) => {
              // Defer non-critical data
              return defer({
                user: fetchUser(params.id),
                posts: fetchUserPosts(params.id), // Loaded after render
              });
            },
          };
        },
      },
    ],
  },
]);
```

## Best Practices

### 1. Analyze Before Splitting

```bash
# Webpack Bundle Analyzer
npm install --save-dev webpack-bundle-analyzer

# Add to webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
    }),
  ],
};
```

### 2. Set Appropriate Chunk Sizes

```javascript
// Webpack
optimization: {
  splitChunks: {
    minSize: 20000,      // Minimum 20KB for a chunk
    maxSize: 244000,     // Target max 244KB per chunk
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
  },
}

// Vite
build: {
  chunkSizeWarningLimit: 500,
  rollupOptions: {
    output: {
      experimentalMinChunkSize: 10000,
    },
  },
}
```

### 3. Name Your Chunks

```javascript
// Makes debugging easier
const Dashboard = lazy(() => import(
  /* webpackChunkName: "dashboard" */
  './pages/Dashboard'
));

// Group related chunks
const AdminUsers = lazy(() => import(
  /* webpackChunkName: "admin" */
  './pages/admin/Users'
));
const AdminSettings = lazy(() => import(
  /* webpackChunkName: "admin" */
  './pages/admin/Settings'
));
```

### 4. Handle Loading States Gracefully

```javascript
// Skeleton loading for better UX
function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-cards">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
      <div className="skeleton-table" />
    </div>
  );
}

// Use with Suspense
<Suspense fallback={<DashboardSkeleton />}>
  <Dashboard />
</Suspense>
```

### 5. Avoid Over-Splitting

```javascript
// BAD: Too granular, too many HTTP requests
const Button = lazy(() => import('./Button'));
const Input = lazy(() => import('./Input'));
const Label = lazy(() => import('./Label'));

// GOOD: Group related components
const FormComponents = lazy(() => import('./FormComponents'));
// Or just import them statically if they're small and commonly used
```

### 6. Consider Mobile Networks

```javascript
// Adapt loading strategy based on connection
async function loadModule(modulePath, priority = 'normal') {
  const connection = navigator.connection;

  if (connection) {
    // On slow connections, show loading UI immediately
    if (connection.effectiveType === '2g' || connection.saveData) {
      showLoadingIndicator();
    }

    // On fast connections, prefetch more aggressively
    if (connection.effectiveType === '4g' && priority === 'low') {
      // Delay low priority loads
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return import(modulePath);
}
```

## Common Pitfalls

### 1. Flash of Loading Content

```javascript
// Problem: Brief loading flash for fast loads
<Suspense fallback={<Loading />}>
  <FastComponent />
</Suspense>

// Solution: Delayed loading indicator
function DelayedLoading({ delay = 200 }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return show ? <Loading /> : null;
}

<Suspense fallback={<DelayedLoading />}>
  <FastComponent />
</Suspense>
```

### 2. Chunk Loading Failures

```javascript
// Always handle network failures
async function safeImport(importFn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;

      // Wait before retry with exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
}

const Dashboard = lazy(() =>
  safeImport(() => import('./pages/Dashboard'))
);
```

### 3. Duplicate Code in Chunks

```javascript
// Problem: Same utility in multiple chunks
// chunk-a.js imports lodash/debounce
// chunk-b.js imports lodash/debounce
// Result: debounce code duplicated

// Solution: Configure shared chunks
optimization: {
  splitChunks: {
    cacheGroups: {
      // Extract common utilities
      utils: {
        test: /[\\/]src[\\/]utils[\\/]/,
        name: 'utils',
        chunks: 'all',
        minChunks: 2,
      },
    },
  },
}
```

### 4. Waterfall Loading

```javascript
// Problem: Sequential loading
const Parent = lazy(() => import('./Parent'));
// Parent imports Child lazily
// Child imports GrandChild lazily
// Results in waterfall: Parent -> Child -> GrandChild

// Solution: Parallel loading
const [Parent, Child, GrandChild] = await Promise.all([
  import('./Parent'),
  import('./Child'),
  import('./GrandChild'),
]);

// Or preload nested dependencies
import('./Parent').then(() => {
  // Preload children immediately
  import('./Child');
  import('./GrandChild');
});
```

## Performance Monitoring

### Tracking Chunk Load Times

```javascript
// Custom performance tracking
const chunkMetrics = new Map();

function trackChunkLoad(chunkName, importFn) {
  const startTime = performance.now();

  return importFn().then(module => {
    const loadTime = performance.now() - startTime;

    chunkMetrics.set(chunkName, {
      loadTime,
      timestamp: Date.now(),
    });

    // Send to analytics
    analytics.track('chunk_loaded', {
      name: chunkName,
      loadTime,
      connectionType: navigator.connection?.effectiveType,
    });

    return module;
  });
}

// Usage
const Dashboard = lazy(() =>
  trackChunkLoad('dashboard', () => import('./pages/Dashboard'))
);
```

### Web Vitals Impact

```javascript
// Monitor LCP impact of code splitting
import { onLCP } from 'web-vitals';

onLCP(metric => {
  // Check if LCP was delayed by chunk loading
  const lcpElement = metric.entries[0]?.element;

  if (lcpElement?.dataset.lazyLoaded) {
    analytics.track('lcp_lazy_impact', {
      value: metric.value,
      element: lcpElement.tagName,
    });
  }
});
```

## Interview Key Points

### Common Questions

**Q: What is code splitting and why is it important?**

A: Code splitting divides your bundle into smaller chunks loaded on demand. Benefits include:
- Faster initial page load (smaller initial bundle)
- Better caching (unchanged chunks stay cached)
- Reduced memory usage (unused code not loaded)
- Improved performance on slow networks

**Q: What are the main code splitting strategies?**

A:
1. **Route-based**: Split by application routes (most common)
2. **Component-based**: Split heavy components
3. **Vendor splitting**: Separate third-party libraries
4. **Feature-based**: Split by feature modules
5. **Conditional**: Load different code based on conditions

**Q: What's the difference between preload and prefetch?**

A:
- **Preload**: High priority, needed for current navigation. Loads immediately.
- **Prefetch**: Low priority, might be needed for future navigation. Loads during idle time.

```javascript
// Preload - critical for current route
import(/* webpackPreload: true */ './CurrentRoute');

// Prefetch - might need on next navigation
import(/* webpackPrefetch: true */ './NextRoute');
```

**Q: How do you handle chunk loading errors?**

A:
1. Implement error boundaries
2. Add retry logic with exponential backoff
3. Provide fallback UI with reload option
4. Monitor and alert on chunk load failures

### Performance Checklist

- [ ] Analyze bundle before splitting
- [ ] Split routes first (biggest impact)
- [ ] Set appropriate chunk size limits
- [ ] Name chunks for debugging
- [ ] Handle loading states gracefully
- [ ] Implement error boundaries
- [ ] Add retry logic for failures
- [ ] Monitor chunk load times
- [ ] Consider network conditions
- [ ] Avoid over-splitting

## Summary

Code splitting is essential for modern web application performance. Key takeaways:

1. **Start with Routes**: Route-based splitting provides the biggest benefit
2. **Use Dynamic Imports**: `import()` is the foundation of code splitting
3. **Configure Properly**: Set appropriate chunk sizes and caching
4. **Handle Failures**: Implement retry logic and error boundaries
5. **Monitor Performance**: Track load times and user impact
6. **Don't Over-Split**: Balance between too few and too many chunks

## Further Reading

- [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [React Lazy and Suspense](https://react.dev/reference/react/lazy)
- [Vue Async Components](https://vuejs.org/guide/components/async.html)
- [Web.dev Code Splitting](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
