---
title: 代码分割策略详解
description: 掌握代码分割技术，优化 JavaScript 应用加载时间和性能
track: frontend
section: performance
difficulty: intermediate
tags:
  - 代码分割
  - 动态导入
  - 懒加载
  - 包优化
  - Webpack
  - 性能
status: imported
origin: old/src/content/docs/javascript/code-splitting.zh.md
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

代码分割是一种将 JavaScript 包分成更小块的技术，这些块可以按需加载。与预先加载所有应用代码不同，你只加载当前视图所需的内容，其余部分在需要时才加载。这大大改善了初始加载时间和整体应用性能。

## 为什么代码分割很重要

现代 JavaScript 应用可以轻松增长到几兆字节。预先加载所有内容会产生严重问题：

| 问题 | 影响 | 解决方案 |
|------|------|----------|
| 初始包过大 | 首次绘制慢，用户体验差 | 按路由分割 |
| 加载未使用的代码 | 浪费带宽 | 动态导入 |
| 主线程阻塞 | UI 无响应 | 异步加载块 |
| 缓存效果差 | 更改时需要完全重新下载 | 供应商分割 |

### 单体包的问题

```
传统单一包：
┌────────────────────────────────────────────┐
│                  app.js                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐  │
│  │ 首页 │ │ 用户 │ │ 管理 │ │ 供应商   │  │
│  │ 50KB │ │ 80KB │ │120KB │ │ 库       │  │
│  │      │ │      │ │      │ │ 500KB    │  │
│  └──────┘ └──────┘ └──────┘ └──────────┘  │
│                总计: 750KB                  │
└────────────────────────────────────────────┘
用户访问首页 → 下载 750KB
实际需要: 50KB (首页) + 500KB (供应商) = 550KB
浪费: 200KB (用户 + 管理)
```

### 代码分割解决方案

```
使用代码分割：
初始加载:                         按需加载:
┌─────────────────┐             ┌──────┐
│    main.js      │             │ 用户 │ (访问 /user 时加载)
│  ┌──────┐       │             │ 80KB │
│  │ 首页 │       │             └──────┘
│  │ 50KB │       │             ┌──────┐
│  └──────┘       │             │ 管理 │ (访问 /admin 时加载)
│    100KB 总计   │             │120KB │
└─────────────────┘             └──────┘
┌─────────────────┐
│   vendors.js    │
│    (已缓存)     │
│     500KB       │
└─────────────────┘

用户访问首页 → 下载 600KB
用户访问 /user → 额外下载 80KB
管理员访问 /admin → 额外下载 120KB
普通用户永远不会下载管理代码！
```

## 核心概念

### 动态导入

代码分割的基础是动态 `import()` 语法：

```javascript
// 静态导入 - 总是加载
import { heavyFunction } from './heavy-module';

// 动态导入 - 按需加载
const module = await import('./heavy-module');
module.heavyFunction();

// 或使用 .then()
import('./heavy-module').then(module => {
  module.heavyFunction();
});
```

### 块类型

| 块类型 | 用途 | 何时使用 |
|--------|------|----------|
| 入口块 | 主应用代码 | 始终需要 |
| 异步块 | 懒加载功能 | 路由、模态框、功能 |
| 供应商块 | 第三方库 | 共享依赖 |
| 公共块 | 共享应用代码 | 多个路由使用的代码 |

### 加载状态

```javascript
// 始终为异步块处理加载状态
async function loadFeature() {
  showLoadingSpinner();

  try {
    const module = await import('./feature');
    module.initialize();
  } catch (error) {
    showError('加载功能失败');
  } finally {
    hideLoadingSpinner();
  }
}
```

## 实现策略

### 基于路由的分割

最常见和最有效的策略 - 按应用路由分割：

```javascript
// React 与 React Router
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 懒加载路由组件
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
// Vue 与 Vue Router
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
    // 命名块
    component: () => import(/* webpackChunkName: "settings" */ './pages/Settings.vue'),
  },
  {
    path: '/admin',
    // 将管理路由分组到一个块中
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

### 基于组件的分割

分割不总是需要的重型组件：

```javascript
// React
import { lazy, Suspense, useState } from 'react';

// 按需加载重型组件
const RichTextEditor = lazy(() => import('./components/RichTextEditor'));
const ChartDashboard = lazy(() => import('./components/ChartDashboard'));
const VideoPlayer = lazy(() => import('./components/VideoPlayer'));

function ArticleEditor() {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div>
      <button onClick={() => setShowEditor(true)}>
        打开富文本编辑器
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

// 在模板中
// <RichTextEditor v-if="showEditor" />
```

### 供应商分割

分离第三方库以获得更好的缓存：

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // 将 React 分离到单独的块
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 40,
        },
        // UI 库单独的块
        ui: {
          test: /[\\/]node_modules[\\/](@mui|antd)[\\/]/,
          name: 'ui-library',
          chunks: 'all',
          priority: 30,
        },
        // 所有其他供应商
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 20,
        },
        // 块之间的共享代码
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

### 基于功能的分割

按功能模块分割：

```javascript
// 功能加载器模式
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

// 使用
async function initializeApp() {
  // 核心功能立即加载
  const app = new App();

  // 分析在初始渲染后加载
  requestIdleCallback(async () => {
    const analytics = await FeatureLoader.loadAnalytics();
    analytics.trackPageView();
  });
}
```

### 条件分割

根据条件加载不同代码：

```javascript
// 基于用户角色
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

// 基于功能标志
async function loadEditor(featureFlags) {
  if (featureFlags.newEditor) {
    return import('./editors/NewEditor');
  }
  return import('./editors/LegacyEditor');
}

// 基于设备/视口
async function loadGallery() {
  if (window.innerWidth < 768) {
    return import('./galleries/MobileGallery');
  }
  return import('./galleries/DesktopGallery');
}
```

## 打包器配置

### Webpack 配置

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

### Vite 配置

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
          // 供应商分割
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['@mui/material', '@emotion/react'],
        },
        // 自定义块文件名
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // 块大小警告
    chunkSizeWarningLimit: 500,
  },
});
```

### Rollup 配置

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
  // 保留动态导入
  preserveEntrySignatures: false,
};
```

## 高级技术

### 预加载和预取

```javascript
// Webpack 魔法注释用于预加载
const Dashboard = lazy(() => import(
  /* webpackPreload: true */
  './pages/Dashboard'
));

// 预取可能的下一个导航
const Settings = lazy(() => import(
  /* webpackPrefetch: true */
  './pages/Settings'
));

// 悬停时手动预加载
function NavLink({ to, children }) {
  const preloadRoute = () => {
    // 用户悬停在链接上时预加载
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

// 路由转换时预加载
function usePreloadOnTransition(routes) {
  const location = useLocation();

  useEffect(() => {
    // 当前路由加载后，预加载相邻路由
    const currentIndex = routes.findIndex(r => r.path === location.pathname);
    const nextRoute = routes[currentIndex + 1];
    const prevRoute = routes[currentIndex - 1];

    if (nextRoute?.preload) nextRoute.preload();
    if (prevRoute?.preload) prevRoute.preload();
  }, [location, routes]);
}
```

### 块的错误边界

```javascript
// React 懒组件的错误边界
import { Component } from 'react';

class ChunkErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    // 强制重新渲染将重试导入
    this.forceUpdate();
  };

  render() {
    if (this.state.hasError) {
      // 检查是否是块加载错误
      if (this.state.error?.name === 'ChunkLoadError') {
        return (
          <div className="chunk-error">
            <p>加载此部分失败。</p>
            <button onClick={this.handleRetry}>
              重试
            </button>
            <button onClick={() => window.location.reload()}>
              重新加载页面
            </button>
          </div>
        );
      }

      return <div>出了点问题</div>;
    }

    return this.props.children;
  }
}

// 使用
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

### 加载进度

```javascript
// 跟踪块加载进度
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

// 动态导入的包装器
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

// 使用
const Dashboard = lazy(() =>
  loadChunk('dashboard', () => import('./pages/Dashboard'))
);
```

### 模块联邦

在微前端之间共享代码：

```javascript
// webpack.config.js（主机应用）
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        // 从远程应用加载模块
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

// webpack.config.js（远程应用 - userApp）
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

// 在主机应用中使用
const UserProfile = lazy(() => import('userApp/UserProfile'));
const UserSettings = lazy(() => import('userApp/UserSettings'));
```

## 最佳实践

### 1. 分割前先分析

```bash
# Webpack Bundle Analyzer
npm install --save-dev webpack-bundle-analyzer

# 添加到 webpack.config.js
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

### 2. 设置适当的块大小

```javascript
// Webpack
optimization: {
  splitChunks: {
    minSize: 20000,      // 块最小 20KB
    maxSize: 244000,     // 每个块目标最大 244KB
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

### 3. 命名你的块

```javascript
// 使调试更容易
const Dashboard = lazy(() => import(
  /* webpackChunkName: "dashboard" */
  './pages/Dashboard'
));

// 将相关块分组
const AdminUsers = lazy(() => import(
  /* webpackChunkName: "admin" */
  './pages/admin/Users'
));
const AdminSettings = lazy(() => import(
  /* webpackChunkName: "admin" */
  './pages/admin/Settings'
));
```

### 4. 优雅地处理加载状态

```javascript
// 骨架屏加载以获得更好的用户体验
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

// 与 Suspense 一起使用
<Suspense fallback={<DashboardSkeleton />}>
  <Dashboard />
</Suspense>
```

### 5. 避免过度分割

```javascript
// 差：太细粒度，太多 HTTP 请求
const Button = lazy(() => import('./Button'));
const Input = lazy(() => import('./Input'));
const Label = lazy(() => import('./Label'));

// 好：将相关组件分组
const FormComponents = lazy(() => import('./FormComponents'));
// 或者如果它们小且常用，就静态导入
```

### 6. 考虑移动网络

```javascript
// 根据连接调整加载策略
async function loadModule(modulePath, priority = 'normal') {
  const connection = navigator.connection;

  if (connection) {
    // 在慢速连接上，立即显示加载 UI
    if (connection.effectiveType === '2g' || connection.saveData) {
      showLoadingIndicator();
    }

    // 在快速连接上，更积极地预取
    if (connection.effectiveType === '4g' && priority === 'low') {
      // 延迟低优先级加载
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return import(modulePath);
}
```

## 常见陷阱

### 1. 加载内容闪烁

```javascript
// 问题：快速加载时短暂的加载闪烁
<Suspense fallback={<Loading />}>
  <FastComponent />
</Suspense>

// 解决方案：延迟加载指示器
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

### 2. 块加载失败

```javascript
// 始终处理网络失败
async function safeImport(importFn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;

      // 使用指数退避等待重试
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

### 3. 块中的重复代码

```javascript
// 问题：相同的工具在多个块中
// chunk-a.js 导入 lodash/debounce
// chunk-b.js 导入 lodash/debounce
// 结果：debounce 代码重复

// 解决方案：配置共享块
optimization: {
  splitChunks: {
    cacheGroups: {
      // 提取公共工具
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

### 4. 瀑布式加载

```javascript
// 问题：顺序加载
const Parent = lazy(() => import('./Parent'));
// Parent 懒加载 Child
// Child 懒加载 GrandChild
// 导致瀑布：Parent -> Child -> GrandChild

// 解决方案：并行加载
const [Parent, Child, GrandChild] = await Promise.all([
  import('./Parent'),
  import('./Child'),
  import('./GrandChild'),
]);

// 或预加载嵌套依赖
import('./Parent').then(() => {
  // 立即预加载子组件
  import('./Child');
  import('./GrandChild');
});
```

## 性能监控

### 跟踪块加载时间

```javascript
// 自定义性能跟踪
const chunkMetrics = new Map();

function trackChunkLoad(chunkName, importFn) {
  const startTime = performance.now();

  return importFn().then(module => {
    const loadTime = performance.now() - startTime;

    chunkMetrics.set(chunkName, {
      loadTime,
      timestamp: Date.now(),
    });

    // 发送到分析
    analytics.track('chunk_loaded', {
      name: chunkName,
      loadTime,
      connectionType: navigator.connection?.effectiveType,
    });

    return module;
  });
}

// 使用
const Dashboard = lazy(() =>
  trackChunkLoad('dashboard', () => import('./pages/Dashboard'))
);
```

### Web Vitals 影响

```javascript
// 监控代码分割对 LCP 的影响
import { onLCP } from 'web-vitals';

onLCP(metric => {
  // 检查 LCP 是否被块加载延迟
  const lcpElement = metric.entries[0]?.element;

  if (lcpElement?.dataset.lazyLoaded) {
    analytics.track('lcp_lazy_impact', {
      value: metric.value,
      element: lcpElement.tagName,
    });
  }
});
```

## 面试要点

### 常见问题

**问：什么是代码分割，为什么它重要？**

答：代码分割将你的包分成更小的块按需加载。好处包括：
- 更快的初始页面加载（更小的初始包）
- 更好的缓存（未更改的块保持缓存）
- 减少内存使用（未使用的代码不加载）
- 在慢速网络上改善性能

**问：主要的代码分割策略有哪些？**

答：
1. **基于路由**：按应用路由分割（最常见）
2. **基于组件**：分割重型组件
3. **供应商分割**：分离第三方库
4. **基于功能**：按功能模块分割
5. **条件分割**：根据条件加载不同代码

**问：preload 和 prefetch 有什么区别？**

答：
- **Preload**：高优先级，当前导航需要。立即加载。
- **Prefetch**：低优先级，未来导航可能需要。空闲时加载。

```javascript
// Preload - 当前路由关键
import(/* webpackPreload: true */ './CurrentRoute');

// Prefetch - 下一次导航可能需要
import(/* webpackPrefetch: true */ './NextRoute');
```

**问：如何处理块加载错误？**

答：
1. 实现错误边界
2. 添加带指数退避的重试逻辑
3. 提供带重新加载选项的回退 UI
4. 监控和警报块加载失败

### 性能检查清单

- [ ] 分割前分析包
- [ ] 首先分割路由（影响最大）
- [ ] 设置适当的块大小限制
- [ ] 命名块以便调试
- [ ] 优雅地处理加载状态
- [ ] 实现错误边界
- [ ] 添加失败重试逻辑
- [ ] 监控块加载时间
- [ ] 考虑网络条件
- [ ] 避免过度分割

## 总结

代码分割对于现代 Web 应用性能至关重要。关键要点：

1. **从路由开始**：基于路由的分割提供最大收益
2. **使用动态导入**：`import()` 是代码分割的基础
3. **正确配置**：设置适当的块大小和缓存
4. **处理失败**：实现重试逻辑和错误边界
5. **监控性能**：跟踪加载时间和用户影响
6. **不要过度分割**：在太少和太多块之间取得平衡

## 延伸阅读

- [Webpack 代码分割](https://webpack.js.org/guides/code-splitting/)
- [React Lazy 和 Suspense](https://react.dev/reference/react/lazy)
- [Vue 异步组件](https://vuejs.org/guide/components/async.html)
- [Web.dev 代码分割](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
