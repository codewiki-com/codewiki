---
title: 微前端架构
description: 了解微前端架构的概念、实现方案和最佳实践
track: architecture
section: system-design
difficulty: advanced
tags:
  - 微前端
  - Module Federation
  - qiankun
status: imported
origin: old/src/content/docs/frontend/micro-frontends.zh.md
divergence: 0.214
issues:
  - title-lang-en
  - title-language
legacy:
  category: Frontend
  subcategory: Architecture
  order: 30
  lastUpdated: 2026-01-07
---

随着前端应用规模的不断扩大，单体前端应用逐渐面临开发效率低下、技术栈升级困难、团队协作复杂等问题。微前端（Micro Frontends）作为一种将大型前端应用拆分为多个独立可部署的小型应用的架构模式，已成为解决这些问题的主流方案。本文将深入探讨微前端的核心概念、实现方案、路由策略、状态管理以及部署最佳实践。

## 什么是微前端

### 微前端的定义

微前端是一种类似于微服务的架构，它将微服务的理念应用于浏览器端，将 Web 应用由单一的单体应用转变为多个小型前端应用聚合为一的应用。各个前端应用可以独立运行、独立开发、独立部署。

```
传统单体前端                          微前端架构
┌─────────────────────┐         ┌─────────────────────────────┐
│                     │         │        主应用（容器）         │
│   单体前端应用       │         │  ┌─────┬─────┬─────┬─────┐  │
│                     │   ==>   │  │App1 │App2 │App3 │App4 │  │
│   所有功能耦合在一起  │         │  │React│Vue  │Angular│Svelte│ │
│                     │         │  └─────┴─────┴─────┴─────┘  │
└─────────────────────┘         └─────────────────────────────┘
```

### 微前端的核心原则

```typescript
// 微前端的核心原则
const microFrontendPrinciples = {
  // 1. 技术栈无关
  techAgnostic: '主应用不限制子应用的技术栈，每个子应用可以使用不同的框架',

  // 2. 独立开发、独立部署
  independence: '每个子应用可以独立开发、测试、部署，不影响其他应用',

  // 3. 增量升级
  incrementalUpgrade: '允许逐步升级、更新或重写应用的某些部分',

  // 4. 独立运行时
  isolatedRuntime: '每个子应用之间状态隔离，运行时状态不共享',

  // 5. 统一的用户体验
  consistentUX: '虽然技术上独立，但用户体验保持一致'
};
```

### 微前端与微服务的对比

| 特性 | 微服务 | 微前端 |
|------|--------|--------|
| 拆分维度 | 按业务领域拆分后端服务 | 按业务功能拆分前端应用 |
| 独立性 | 独立部署、独立数据库 | 独立部署、独立运行时 |
| 通信方式 | HTTP/RPC/消息队列 | 自定义事件/Props/URL |
| 技术栈 | 可以不同 | 可以不同 |
| 团队划分 | 按服务划分团队 | 按功能模块划分团队 |
| 挑战 | 服务发现、分布式事务 | 样式隔离、JS沙箱、通信机制 |

## 微前端的优势与挑战

### 主要优势

```typescript
// 微前端的主要优势
const benefits = {
  // 1. 独立开发部署
  independentDeployment: {
    description: '每个团队可以独立开发和部署自己的应用',
    example: `
      // 团队 A 部署用户模块
      deploy('user-app', { version: '2.0.0' });

      // 团队 B 部署订单模块（完全独立）
      deploy('order-app', { version: '1.5.0' });
    `
  },

  // 2. 技术栈灵活
  techFlexibility: {
    description: '不同模块可以使用不同的技术栈',
    example: `
      // 老模块可以继续使用 Vue 2
      // 新模块可以使用 React 18 或 Vue 3
      // 逐步迁移，不需要一次性重写
    `
  },

  // 3. 团队自治
  teamAutonomy: {
    description: '每个团队对自己的代码拥有完全的控制权',
    benefit: '减少团队间的依赖和协调成本'
  },

  // 4. 增量升级
  incrementalUpgrade: {
    description: '可以逐步升级应用的某些部分',
    example: '将 Angular 1 应用逐步迁移到 React，而不是一次性重写'
  },

  // 5. 故障隔离
  faultIsolation: {
    description: '单个子应用的崩溃不会影响整个系统',
    example: '订单模块出错时，用户模块仍然可用'
  }
};
```

### 面临的挑战

```typescript
// 微前端面临的主要挑战
const challenges = {
  // 1. 样式隔离
  styleIsolation: {
    problem: '不同子应用的 CSS 可能相互影响',
    solutions: [
      'CSS Modules',
      'Shadow DOM',
      'CSS-in-JS',
      'BEM 命名规范',
      '动态添加/移除样式'
    ]
  },

  // 2. JavaScript 沙箱
  jsSandbox: {
    problem: '全局变量污染、事件监听器冲突',
    solutions: [
      'Proxy 沙箱',
      'iframe 沙箱',
      '快照沙箱',
      'with + Proxy 组合'
    ]
  },

  // 3. 公共依赖
  sharedDependencies: {
    problem: '重复加载 React、Vue 等大型库',
    solutions: [
      'Module Federation 共享依赖',
      'externals + CDN',
      '统一版本管理'
    ]
  },

  // 4. 通信机制
  communication: {
    problem: '子应用之间需要通信',
    solutions: [
      '自定义事件',
      '全局状态管理',
      'URL 参数',
      'Props 传递'
    ]
  },

  // 5. 性能问题
  performance: {
    problem: '多个子应用可能导致性能下降',
    solutions: [
      '懒加载',
      '预加载',
      '资源缓存',
      '公共依赖提取'
    ]
  }
};
```

### 何时使用微前端

```typescript
// 适合使用微前端的场景
const whenToUseMicroFrontends = {
  suitable: [
    '大型企业级应用，多个团队协作开发',
    '遗留系统需要逐步重构和升级',
    '需要整合多个独立产品到一个平台',
    '不同模块有不同的发布周期',
    '团队规模大，需要降低协作成本'
  ],

  notSuitable: [
    '小型应用，团队规模小',
    '技术栈统一，没有历史包袱',
    '对性能要求极高的场景',
    '简单的展示型网站',
    '团队对微前端技术不熟悉'
  ]
};
```

## 微前端实现方案

### iframe 方案

iframe 是最简单、最原始的微前端方案，通过 iframe 标签嵌入子应用。

```typescript
// iframe 方案示例
class IframeMicroFrontend {
  private container: HTMLElement;
  private iframe: HTMLIFrameElement | null = null;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
  }

  // 加载子应用
  loadApp(url: string, options: { height?: string; sandbox?: string } = {}) {
    // 销毁旧的 iframe
    this.destroy();

    // 创建新的 iframe
    this.iframe = document.createElement('iframe');
    this.iframe.src = url;
    this.iframe.style.width = '100%';
    this.iframe.style.height = options.height || '100%';
    this.iframe.style.border = 'none';

    // 安全配置
    if (options.sandbox) {
      this.iframe.sandbox.value = options.sandbox;
    }

    this.container.appendChild(this.iframe);

    // 监听加载完成
    return new Promise((resolve, reject) => {
      this.iframe!.onload = resolve;
      this.iframe!.onerror = reject;
    });
  }

  // 与子应用通信
  postMessage(message: any, targetOrigin: string = '*') {
    this.iframe?.contentWindow?.postMessage(message, targetOrigin);
  }

  // 监听子应用消息
  onMessage(callback: (event: MessageEvent) => void) {
    window.addEventListener('message', (event) => {
      // 验证消息来源
      if (this.iframe?.contentWindow === event.source) {
        callback(event);
      }
    });
  }

  // 销毁
  destroy() {
    if (this.iframe) {
      this.container.removeChild(this.iframe);
      this.iframe = null;
    }
  }
}

// 使用示例
const microApp = new IframeMicroFrontend('app-container');
await microApp.loadApp('https://sub-app.example.com');

// 发送消息给子应用
microApp.postMessage({ type: 'INIT', data: { userId: '123' } });

// 监听子应用消息
microApp.onMessage((event) => {
  console.log('收到子应用消息:', event.data);
});
```

**iframe 方案的优缺点：**

```typescript
const iframeProsCons = {
  pros: [
    '天然的隔离性（JS、CSS、DOM 完全隔离）',
    '实现简单，技术成熟',
    '安全性好，支持 sandbox 属性',
    '可以嵌入任何第三方页面'
  ],
  cons: [
    'URL 不同步，刷新页面后状态丢失',
    '性能较差，每个 iframe 都是独立的浏览器上下文',
    'UI 不同步，如弹窗、遮罩层无法全局覆盖',
    '通信复杂，只能通过 postMessage',
    'SEO 不友好'
  ]
};
```

### Web Components 方案

使用原生 Web Components 技术实现微前端，利用 Shadow DOM 实现样式隔离。

```typescript
// 定义一个微前端容器 Web Component
class MicroFrontendContainer extends HTMLElement {
  private shadow: ShadowRoot;
  private appContainer: HTMLDivElement;

  constructor() {
    super();
    // 创建 Shadow DOM
    this.shadow = this.attachShadow({ mode: 'open' });
    this.appContainer = document.createElement('div');
    this.appContainer.id = 'micro-app-root';
    this.shadow.appendChild(this.appContainer);
  }

  // 生命周期：元素被添加到 DOM
  async connectedCallback() {
    const appUrl = this.getAttribute('app-url');
    const appName = this.getAttribute('app-name');

    if (appUrl && appName) {
      await this.loadApp(appUrl, appName);
    }
  }

  // 生命周期：元素从 DOM 移除
  disconnectedCallback() {
    this.unmountApp();
  }

  // 属性变化监听
  static get observedAttributes() {
    return ['app-url', 'app-name'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      this.reloadApp();
    }
  }

  // 加载子应用
  private async loadApp(url: string, name: string) {
    try {
      // 加载子应用的 JS
      const module = await import(/* webpackIgnore: true */ url);

      // 挂载子应用
      if (module.mount) {
        await module.mount(this.appContainer, {
          name,
          container: this.shadow,
          props: this.getProps()
        });
      }

      // 加载子应用的样式（在 Shadow DOM 中）
      await this.loadStyles(url.replace('.js', '.css'));

    } catch (error) {
      console.error('Failed to load micro app:', name, error);
      this.renderError(error);
    }
  }

  // 加载样式到 Shadow DOM
  private async loadStyles(cssUrl: string) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    this.shadow.insertBefore(link, this.appContainer);
  }

  // 获取传递给子应用的 props
  private getProps(): Record<string, any> {
    const props: Record<string, any> = {};
    for (const attr of this.attributes) {
      if (attr.name.startsWith('data-')) {
        props[attr.name.slice(5)] = attr.value;
      }
    }
    return props;
  }

  // 卸载子应用
  private unmountApp() {
    // 通知子应用卸载
    this.dispatchEvent(new CustomEvent('micro-app-unmount'));
    this.appContainer.innerHTML = '';
  }

  // 重新加载
  private async reloadApp() {
    this.unmountApp();
    const appUrl = this.getAttribute('app-url');
    const appName = this.getAttribute('app-name');
    if (appUrl && appName) {
      await this.loadApp(appUrl, appName);
    }
  }

  // 渲染错误信息
  private renderError(error: Error | unknown) {
    this.appContainer.innerHTML = '<div style="padding: 20px; color: red;">' +
      'Failed to load micro app: ' +
      (error instanceof Error ? error.message : String(error)) +
      '</div>';
  }
}

// 注册自定义元素
customElements.define('micro-frontend', MicroFrontendContainer);
```

```html
<!-- 使用 Web Component 加载微前端 -->
<micro-frontend
  app-name="user-app"
  app-url="https://cdn.example.com/user-app/main.js"
  data-user-id="123"
  data-theme="dark">
</micro-frontend>

<micro-frontend
  app-name="order-app"
  app-url="https://cdn.example.com/order-app/main.js"
  data-user-id="123">
</micro-frontend>
```

```typescript
// 子应用需要导出的生命周期函数
// user-app/main.ts
export async function mount(container: HTMLElement, options: MountOptions) {
  const { props } = options;

  // 使用 React 渲染（示例）
  const root = createRoot(container);
  root.render(<App userId={props.userId} theme={props.theme} />);

  // 返回卸载函数
  return () => {
    root.unmount();
  };
}

export async function unmount() {
  // 清理工作
}
```

### Module Federation（模块联邦）

Webpack 5 的 Module Federation 是目前最流行的微前端方案之一，允许多个独立构建的应用在运行时共享代码。

```javascript
// host-app/webpack.config.js - 主应用配置
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      filename: 'remoteEntry.js',
      remotes: {
        // 远程子应用
        userApp: 'userApp@http://localhost:3001/remoteEntry.js',
        orderApp: 'orderApp@http://localhost:3002/remoteEntry.js',
        productApp: 'productApp@http://localhost:3003/remoteEntry.js',
      },
      shared: {
        // 共享依赖
        react: {
          singleton: true,
          requiredVersion: '^18.0.0',
          eager: true
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0',
          eager: true
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^6.0.0'
        },
      },
    }),
  ],
};
```

```javascript
// user-app/webpack.config.js - 子应用配置
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'userApp',
      filename: 'remoteEntry.js',
      exposes: {
        // 暴露的模块
        './UserList': './src/components/UserList',
        './UserProfile': './src/pages/UserProfile',
        './UserApp': './src/App',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.0.0'
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0'
        },
      },
    }),
  ],
};
```

```typescript
// host-app/src/App.tsx - 主应用中使用远程模块
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/Loading';

// 动态导入远程模块
const UserApp = lazy(() => import('userApp/UserApp'));
const OrderApp = lazy(() => import('orderApp/OrderApp'));
const ProductApp = lazy(() => import('productApp/ProductApp'));

// 远程组件包装器
function RemoteApp({
  children,
  fallback = <Loading />
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <ErrorBoundary fallback={<div>Failed to load app</div>}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <nav>
          <Link to="/">Home</Link>
          <Link to="/users">Users</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/products">Products</Link>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/users/*"
              element={
                <RemoteApp>
                  <UserApp />
                </RemoteApp>
              }
            />
            <Route
              path="/orders/*"
              element={
                <RemoteApp>
                  <OrderApp />
                </RemoteApp>
              }
            />
            <Route
              path="/products/*"
              element={
                <RemoteApp>
                  <ProductApp />
                </RemoteApp>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
```

```typescript
// 动态远程模块加载
// utils/dynamicFederation.ts

interface RemoteConfig {
  url: string;
  scope: string;
  module: string;
}

// 动态加载远程模块的工具函数
async function loadRemoteModule<T = any>(config: RemoteConfig): Promise<T> {
  const { url, scope, module } = config;

  // 1. 加载远程入口文件
  await loadScript(url);

  // 2. 初始化共享作用域
  // @ts-ignore
  await __webpack_init_sharing__('default');

  // 3. 获取远程容器
  const container = (window as any)[scope];
  // @ts-ignore
  await container.init(__webpack_share_scopes__.default);

  // 4. 获取模块工厂
  const factory = await container.get(module);

  // 5. 执行工厂获取模块
  return factory();
}

// 加载脚本
function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 使用示例：动态加载远程组件
const DynamicRemoteComponent = lazy(async () => {
  const module = await loadRemoteModule({
    url: 'http://localhost:3001/remoteEntry.js',
    scope: 'userApp',
    module: './UserProfile'
  });
  return { default: module.default || module };
});
```

### qiankun 框架

qiankun 是蚂蚁金服开源的微前端框架，基于 single-spa 封装，提供了开箱即用的微前端解决方案。

```typescript
// 主应用配置
// main-app/src/micro-apps.ts
import {
  registerMicroApps,
  start,
  setDefaultMountApp,
  runAfterFirstMounted,
  addGlobalUncaughtErrorHandler
} from 'qiankun';

// 子应用配置
const microApps = [
  {
    name: 'user-app',
    entry: '//localhost:3001',
    container: '#micro-app-container',
    activeRule: '/users',
    props: {
      token: localStorage.getItem('token'),
      userInfo: { id: '123', name: 'admin' }
    }
  },
  {
    name: 'order-app',
    entry: '//localhost:3002',
    container: '#micro-app-container',
    activeRule: '/orders',
    props: {
      token: localStorage.getItem('token')
    }
  },
  {
    name: 'product-app',
    entry: '//localhost:3003',
    container: '#micro-app-container',
    activeRule: (location: Location) => {
      return location.pathname.startsWith('/products');
    },
    loader: (loading: boolean) => {
      // 显示/隐藏加载状态
      console.log('loading:', loading);
    }
  }
];

// 注册子应用
registerMicroApps(microApps, {
  beforeLoad: async (app) => {
    console.log('[qiankun] before load:', app.name);
  },
  beforeMount: async (app) => {
    console.log('[qiankun] before mount:', app.name);
  },
  afterMount: async (app) => {
    console.log('[qiankun] after mount:', app.name);
  },
  beforeUnmount: async (app) => {
    console.log('[qiankun] before unmount:', app.name);
  },
  afterUnmount: async (app) => {
    console.log('[qiankun] after unmount:', app.name);
  }
});

// 设置默认进入的子应用
setDefaultMountApp('/users');

// 第一个子应用加载完成后回调
runAfterFirstMounted(() => {
  console.log('[qiankun] first app mounted');
});

// 全局错误处理
addGlobalUncaughtErrorHandler((event) => {
  console.error('[qiankun] global error:', event);
});

// 启动 qiankun
start({
  prefetch: 'all', // 预加载策略
  sandbox: {
    strictStyleIsolation: true, // 严格的样式隔离（Shadow DOM）
    experimentalStyleIsolation: true // 实验性样式隔离
  },
  singular: true // 单实例模式
});
```

```typescript
// 子应用入口
// user-app/src/main.ts (Vue 3 示例)
import { createApp, App as VueApp } from 'vue';
import { createRouter, createWebHistory, Router } from 'vue-router';
import App from './App.vue';
import routes from './router';
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper';

let app: VueApp<Element> | null = null;
let router: Router | null = null;
let history: ReturnType<typeof createWebHistory> | null = null;

// 渲染函数
function render(props: any = {}) {
  const { container } = props;

  // 根据是否在 qiankun 环境中决定路由 base
  history = createWebHistory(
    qiankunWindow.__POWERED_BY_QIANKUN__ ? '/users' : '/'
  );

  router = createRouter({
    history,
    routes
  });

  app = createApp(App);
  app.use(router);

  // 挂载到容器
  const mountElement = container
    ? container.querySelector('#app')
    : document.getElementById('app');

  app.mount(mountElement);
}

// qiankun 生命周期钩子
renderWithQiankun({
  mount(props) {
    console.log('[user-app] mount with props:', props);
    render(props);
  },
  bootstrap() {
    console.log('[user-app] bootstrap');
  },
  unmount(props) {
    console.log('[user-app] unmount');
    app?.unmount();
    app = null;
    router = null;
    history?.destroy();
    history = null;
  },
  update(props) {
    console.log('[user-app] update props:', props);
  }
});

// 独立运行
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render();
}
```

```typescript
// 子应用入口
// order-app/src/main.tsx (React 示例)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

let root: ReactDOM.Root | null = null;

// 渲染函数
function render(props: any = {}) {
  const { container } = props;
  const mountElement = container
    ? container.querySelector('#root')
    : document.getElementById('root');

  root = ReactDOM.createRoot(mountElement);

  root.render(
    <React.StrictMode>
      <BrowserRouter basename={window.__POWERED_BY_QIANKUN__ ? '/orders' : '/'}>
        <App {...props} />
      </BrowserRouter>
    </React.StrictMode>
  );
}

// qiankun 生命周期
export async function bootstrap() {
  console.log('[order-app] bootstrap');
}

export async function mount(props: any) {
  console.log('[order-app] mount with props:', props);
  render(props);
}

export async function unmount() {
  console.log('[order-app] unmount');
  root?.unmount();
  root = null;
}

export async function update(props: any) {
  console.log('[order-app] update props:', props);
}

// 独立运行
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

// TypeScript 类型声明
declare global {
  interface Window {
    __POWERED_BY_QIANKUN__?: boolean;
  }
}
```

### single-spa 框架

single-spa 是微前端的鼻祖框架，qiankun 就是基于它开发的。

```typescript
// 主应用配置
// root-config/src/main.ts
import { registerApplication, start, LifeCycles } from 'single-spa';

// 应用加载函数
function loadApp(name: string, url: string): () => Promise<LifeCycles> {
  return async () => {
    // 加载子应用的 JS
    await loadScript(url + '/main.js');

    // 获取子应用导出的生命周期函数
    return (window as any)[name];
  };
}

// 辅助函数：加载脚本
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 注册应用
registerApplication({
  name: '@org/navbar',
  app: loadApp('navbar', 'http://localhost:3001'),
  activeWhen: ['/'],
  customProps: {
    authToken: 'abc123'
  }
});

registerApplication({
  name: '@org/home',
  app: loadApp('home', 'http://localhost:3002'),
  activeWhen: ['/home'],
  customProps: (name, location) => ({
    pathname: location.pathname
  })
});

registerApplication({
  name: '@org/settings',
  app: loadApp('settings', 'http://localhost:3003'),
  activeWhen: (location) => location.pathname.startsWith('/settings'),
});

// 使用 System.js 动态导入
registerApplication({
  name: '@org/dashboard',
  app: () => System.import('@org/dashboard'),
  activeWhen: ['/dashboard']
});

// 启动 single-spa
start({
  urlRerouteOnly: true
});
```

```typescript
// 子应用
// navbar/src/main.ts
import { LifeCycles } from 'single-spa';

let container: HTMLElement | null = null;

const lifecycles: LifeCycles = {
  async bootstrap(props) {
    console.log('navbar bootstrapped');
  },

  async mount(props) {
    console.log('navbar mounted with props:', props);
    container = document.createElement('nav');
    container.id = 'navbar';
    container.innerHTML = '<ul>' +
      '<li><a href="/home">Home</a></li>' +
      '<li><a href="/dashboard">Dashboard</a></li>' +
      '<li><a href="/settings">Settings</a></li>' +
      '</ul>';
    document.body.prepend(container);
  },

  async unmount(props) {
    console.log('navbar unmounted');
    container?.remove();
    container = null;
  }
};

export const { bootstrap, mount, unmount } = lifecycles;
```

## 路由策略

### 路由分发策略

```typescript
// 路由分发：主应用负责路由分发，子应用处理内部路由

// 主应用路由配置
// main-app/src/router.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('./layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('./views/Home.vue')
      },
      {
        // 匹配 /users 及其所有子路由
        path: 'users/:pathMatch(.*)*',
        component: () => import('./views/MicroAppContainer.vue'),
        meta: { microApp: 'user-app' }
      },
      {
        path: 'orders/:pathMatch(.*)*',
        component: () => import('./views/MicroAppContainer.vue'),
        meta: { microApp: 'order-app' }
      },
      {
        path: 'products/:pathMatch(.*)*',
        component: () => import('./views/MicroAppContainer.vue'),
        meta: { microApp: 'product-app' }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫：处理子应用加载
router.beforeEach(async (to, from, next) => {
  const microApp = to.meta.microApp as string;

  if (microApp) {
    // 预加载子应用资源
    await prefetchApp(microApp);
  }

  next();
});

export default router;
```

### 子应用内部路由

```typescript
// 子应用路由配置
// user-app/src/router.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/list'
  },
  {
    path: '/list',
    component: () => import('./views/UserList.vue')
  },
  {
    path: '/profile/:id',
    component: () => import('./views/UserProfile.vue')
  },
  {
    path: '/settings',
    component: () => import('./views/UserSettings.vue')
  }
];

// 根据运行环境设置 base
const getRouterBase = (): string => {
  if ((window as any).__POWERED_BY_QIANKUN__) {
    return '/users';
  }
  return '/';
};

const router = createRouter({
  history: createWebHistory(getRouterBase()),
  routes
});

export default router;
```

### 路由同步

```typescript
// 主应用与子应用路由同步
// utils/routeSync.ts

interface RouteChangeEvent {
  type: 'ROUTE_CHANGE';
  payload: {
    path: string;
    query?: Record<string, string>;
    hash?: string;
  };
}

// 主应用：监听子应用路由变化
export function listenChildRouteChange(callback: (route: RouteChangeEvent['payload']) => void) {
  window.addEventListener('message', (event) => {
    if (event.data.type === 'ROUTE_CHANGE') {
      callback(event.data.payload);
    }
  });
}

// 子应用：通知主应用路由变化
export function notifyParentRouteChange(route: RouteChangeEvent['payload']) {
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'ROUTE_CHANGE',
      payload: route
    }, '*');
  }
}

// 在子应用路由守卫中使用
// user-app/src/router.ts
router.afterEach((to) => {
  notifyParentRouteChange({
    path: to.path,
    query: to.query as Record<string, string>,
    hash: to.hash
  });
});
```

```typescript
// 使用自定义事件进行同步（qiankun 推荐方式）
import { initGlobalState, MicroAppStateActions } from 'qiankun';

// 主应用
const actions: MicroAppStateActions = initGlobalState({
  currentRoute: '/'
});

actions.onGlobalStateChange((state, prev) => {
  console.log('Global state changed:', state, prev);
  // 同步路由到浏览器 URL
  if (state.currentRoute !== prev.currentRoute) {
    history.pushState(null, '', state.currentRoute);
  }
});

// 子应用
export function mount(props: any) {
  const { onGlobalStateChange, setGlobalState } = props;

  // 监听全局状态变化
  onGlobalStateChange((state: any) => {
    console.log('State changed:', state);
  });

  // 路由变化时更新全局状态
  router.afterEach((to) => {
    setGlobalState({ currentRoute: to.fullPath });
  });
}
```

## 共享状态管理

### 全局状态管理方案

```typescript
// 方案1：使用 qiankun 的 globalState
// 主应用
import { initGlobalState, MicroAppStateActions } from 'qiankun';

interface GlobalState {
  user: {
    id: string;
    name: string;
    token: string;
  } | null;
  theme: 'light' | 'dark';
  language: 'zh' | 'en';
  notifications: Array<{ id: string; message: string }>;
}

const initialState: GlobalState = {
  user: null,
  theme: 'light',
  language: 'zh',
  notifications: []
};

const actions: MicroAppStateActions = initGlobalState(initialState);

// 监听状态变化
actions.onGlobalStateChange((newState, prevState) => {
  console.log('Global state changed:', { newState, prevState });
});

// 更新状态
actions.setGlobalState({
  user: { id: '1', name: 'admin', token: 'xxx' }
});

// 导出给子应用使用
export { actions };
```

```typescript
// 子应用中使用全局状态
// user-app/src/store/globalState.ts
import { reactive, readonly } from 'vue';

interface Props {
  onGlobalStateChange: (callback: (state: any, prev: any) => void, fireImmediately?: boolean) => void;
  setGlobalState: (state: any) => void;
  getGlobalState: () => any;
}

class GlobalStateManager {
  private state = reactive<any>({});
  private setGlobalState: Props['setGlobalState'] | null = null;

  init(props: Props) {
    this.setGlobalState = props.setGlobalState;

    // 监听全局状态变化
    props.onGlobalStateChange((newState) => {
      Object.assign(this.state, newState);
    }, true);
  }

  getState<T = any>(): T {
    return readonly(this.state) as T;
  }

  setState(partialState: Partial<any>) {
    if (this.setGlobalState) {
      this.setGlobalState(partialState);
    }
  }

  // 特定业务方法
  setUser(user: any) {
    this.setState({ user });
  }

  setTheme(theme: 'light' | 'dark') {
    this.setState({ theme });
  }

  addNotification(message: string) {
    const notifications = [...this.state.notifications, { id: Date.now().toString(), message }];
    this.setState({ notifications });
  }
}

export const globalStateManager = new GlobalStateManager();
```

### 基于发布订阅的通信

```typescript
// 自定义事件总线
// shared/eventBus.ts

type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();
  private maxListeners: number = 10;

  // 订阅事件
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    const listeners = this.events.get(event)!;

    if (listeners.size >= this.maxListeners) {
      console.warn('Event "' + event + '" has reached max listeners (' + this.maxListeners + ')');
    }

    listeners.add(callback);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  // 单次订阅
  once(event: string, callback: EventCallback): () => void {
    const wrapper: EventCallback = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  // 取消订阅
  off(event: string, callback: EventCallback): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.events.delete(event);
      }
    }
  }

  // 发布事件
  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error('Error in event handler for "' + event + '":', error);
        }
      });
    }
  }

  // 清除所有事件
  clear(): void {
    this.events.clear();
  }

  // 清除特定事件的所有监听器
  clearEvent(event: string): void {
    this.events.delete(event);
  }
}

// 全局单例
export const eventBus = new EventBus();

// 挂载到 window（用于跨应用通信）
if (typeof window !== 'undefined') {
  (window as any).__MICRO_EVENT_BUS__ = eventBus;
}

// 获取全局事件总线（子应用使用）
export function getEventBus(): EventBus {
  return (window as any).__MICRO_EVENT_BUS__ || eventBus;
}
```

```typescript
// 使用事件总线通信
// 主应用
import { eventBus } from '@/shared/eventBus';

// 发送用户登录事件
eventBus.emit('user:login', { userId: '123', token: 'xxx' });

// 监听子应用事件
eventBus.on('cart:updated', (cartInfo) => {
  console.log('Cart updated:', cartInfo);
  updateCartBadge(cartInfo.itemCount);
});

// 子应用
import { getEventBus } from '@/shared/eventBus';

const bus = getEventBus();

// 监听主应用事件
bus.on('user:login', (userInfo) => {
  store.setUser(userInfo);
});

// 发送事件给主应用
bus.emit('cart:updated', { itemCount: 5, totalPrice: 299 });
```

### 共享状态库

```typescript
// 使用 Redux 作为共享状态库
// shared/store/index.ts
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

// 用户状态
const userSlice = createSlice({
  name: 'user',
  initialState: {
    info: null as { id: string; name: string } | null,
    token: null as string | null,
    permissions: [] as string[]
  },
  reducers: {
    setUser(state, action: PayloadAction<{ info: any; token: string }>) {
      state.info = action.payload.info;
      state.token = action.payload.token;
    },
    clearUser(state) {
      state.info = null;
      state.token = null;
      state.permissions = [];
    },
    setPermissions(state, action: PayloadAction<string[]>) {
      state.permissions = action.payload;
    }
  }
});

// 全局 UI 状态
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: 'light' as 'light' | 'dark',
    sidebarCollapsed: false,
    loading: false
  },
  reducers: {
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    }
  }
});

// 创建 store
export const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    ui: uiSlice.reducer
  }
});

export const { setUser, clearUser, setPermissions } = userSlice.actions;
export const { setTheme, toggleSidebar, setLoading } = uiSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 挂载到全局
if (typeof window !== 'undefined') {
  (window as any).__SHARED_STORE__ = store;
}

// 获取共享 store
export function getSharedStore() {
  return (window as any).__SHARED_STORE__ || store;
}
```

```typescript
// 在子应用中使用共享 store
// user-app/src/hooks/useSharedStore.ts
import { useEffect, useState } from 'react';
import { getSharedStore, RootState } from '@shared/store';

export function useSharedStore<T>(selector: (state: RootState) => T): T {
  const store = getSharedStore();
  const [state, setState] = useState<T>(() => selector(store.getState()));

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const newState = selector(store.getState());
      setState(newState);
    });

    return unsubscribe;
  }, [selector]);

  return state;
}

// 使用示例
function UserProfile() {
  const user = useSharedStore(state => state.user.info);
  const theme = useSharedStore(state => state.ui.theme);

  if (!user) {
    return <div>Please login</div>;
  }

  return (
    <div className={'profile ' + theme}>
      <h1>{user.name}</h1>
    </div>
  );
}
```

## 部署策略

### 独立部署

```yaml
# 子应用独立部署 - Docker Compose
# docker-compose.yml

version: '3.8'

services:
  main-app:
    build: ./main-app
    ports:
      - "3000:80"
    environment:
      - USER_APP_URL=http://user-app
      - ORDER_APP_URL=http://order-app
    depends_on:
      - user-app
      - order-app

  user-app:
    build: ./user-app
    ports:
      - "3001:80"
    environment:
      - PUBLIC_PATH=/users/

  order-app:
    build: ./order-app
    ports:
      - "3002:80"
    environment:
      - PUBLIC_PATH=/orders/

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - main-app
      - user-app
      - order-app
```

```nginx
# nginx.conf
http {
    upstream main_app {
        server main-app:80;
    }

    upstream user_app {
        server user-app:80;
    }

    upstream order_app {
        server order-app:80;
    }

    server {
        listen 80;
        server_name localhost;

        # 主应用
        location / {
            proxy_pass http://main_app;
            proxy_set_header Host $host;
        }

        # 用户子应用资源
        location /users/ {
            proxy_pass http://user_app/;
            proxy_set_header Host $host;

            # 处理跨域
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
            add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
        }

        # 订单子应用资源
        location /orders/ {
            proxy_pass http://order_app/;
            proxy_set_header Host $host;
            add_header Access-Control-Allow-Origin *;
        }
    }
}
```

### CI/CD 流水线

```yaml
# .github/workflows/deploy.yml
name: Deploy Micro Frontends

on:
  push:
    branches: [main]
    paths:
      - 'apps/**'
      - 'packages/**'

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      main-app: ${{ steps.filter.outputs.main-app }}
      user-app: ${{ steps.filter.outputs.user-app }}
      order-app: ${{ steps.filter.outputs.order-app }}
      shared: ${{ steps.filter.outputs.shared }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            main-app:
              - 'apps/main-app/**'
            user-app:
              - 'apps/user-app/**'
            order-app:
              - 'apps/order-app/**'
            shared:
              - 'packages/**'

  build-shared:
    needs: detect-changes
    if: ${{ needs.detect-changes.outputs.shared == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm --filter "@org/shared-*" build
      - uses: actions/upload-artifact@v4
        with:
          name: shared-packages
          path: packages/*/dist

  deploy-main-app:
    needs: [detect-changes, build-shared]
    if: |
      always() &&
      (needs.detect-changes.outputs.main-app == 'true' ||
       needs.detect-changes.outputs.shared == 'true')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: shared-packages
          path: packages
        continue-on-error: true
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm --filter main-app build
      - name: Deploy to CDN
        run: |
          aws s3 sync apps/main-app/dist s3://cdn-bucket/main-app/ --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CF_DISTRIBUTION_ID }} --paths "/main-app/*"

  deploy-user-app:
    needs: [detect-changes, build-shared]
    if: |
      always() &&
      (needs.detect-changes.outputs.user-app == 'true' ||
       needs.detect-changes.outputs.shared == 'true')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: shared-packages
          path: packages
        continue-on-error: true
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm --filter user-app build
      - name: Deploy to CDN
        run: |
          aws s3 sync apps/user-app/dist s3://cdn-bucket/user-app/ --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CF_DISTRIBUTION_ID }} --paths "/user-app/*"
```

### 版本管理与灰度发布

```typescript
// 子应用版本管理
// version-manager.ts

interface AppVersion {
  name: string;
  version: string;
  entry: string;
  activeRule: string | ((location: Location) => boolean);
  props?: Record<string, any>;
}

interface VersionConfig {
  stable: AppVersion[];
  canary: AppVersion[];
  grayRules: GrayRule[];
}

interface GrayRule {
  type: 'userId' | 'percentage' | 'cookie' | 'header';
  value: string | number;
}

class VersionManager {
  private config: VersionConfig;

  constructor(config: VersionConfig) {
    this.config = config;
  }

  // 根据灰度规则获取应用版本
  getAppVersion(appName: string): AppVersion | undefined {
    // 检查是否命中灰度规则
    if (this.shouldUseCanary()) {
      const canaryApp = this.config.canary.find(app => app.name === appName);
      if (canaryApp) {
        return canaryApp;
      }
    }

    // 返回稳定版本
    return this.config.stable.find(app => app.name === appName);
  }

  // 检查是否使用灰度版本
  private shouldUseCanary(): boolean {
    for (const rule of this.config.grayRules) {
      switch (rule.type) {
        case 'userId':
          if (this.getCurrentUserId() === rule.value) {
            return true;
          }
          break;
        case 'percentage':
          if (Math.random() * 100 < (rule.value as number)) {
            return true;
          }
          break;
        case 'cookie':
          if (document.cookie.includes(rule.value as string)) {
            return true;
          }
          break;
        case 'header':
          // 通过特定 header 判断
          break;
      }
    }
    return false;
  }

  private getCurrentUserId(): string {
    // 获取当前用户 ID
    return localStorage.getItem('userId') || '';
  }

  // 获取所有应用配置
  getAllApps(): AppVersion[] {
    return this.config.stable.map(app => {
      return this.getAppVersion(app.name) || app;
    });
  }
}

// 使用示例
const versionManager = new VersionManager({
  stable: [
    {
      name: 'user-app',
      version: '1.0.0',
      entry: 'https://cdn.example.com/user-app/1.0.0/',
      activeRule: '/users'
    }
  ],
  canary: [
    {
      name: 'user-app',
      version: '2.0.0-beta.1',
      entry: 'https://cdn.example.com/user-app/2.0.0-beta.1/',
      activeRule: '/users'
    }
  ],
  grayRules: [
    { type: 'userId', value: 'test-user-001' },
    { type: 'percentage', value: 10 } // 10% 用户使用灰度版本
  ]
});

// 注册应用时使用
const apps = versionManager.getAllApps();
// registerMicroApps(apps);
```

## 样式隔离与 JS 沙箱

### CSS 隔离方案

```css
/* 方案1：CSS Modules */
/* user-app/src/components/Button/Button.module.css */
.button {
  padding: 8px 16px;
  border-radius: 4px;
  background-color: #1890ff;
  color: white;
}

.button:hover {
  background-color: #40a9ff;
}
```

```typescript
// Button.tsx
import styles from './Button.module.css';

export function Button({ children }: { children: React.ReactNode }) {
  return <button className={styles.button}>{children}</button>;
}
```

```typescript
// 方案2：CSS-in-JS (styled-components)
import styled from 'styled-components';

const StyledButton = styled.button<{ theme: any }>`
  padding: 8px 16px;
  border-radius: 4px;
  background-color: ${props => props.theme.primaryColor || '#1890ff'};
  color: white;

  &:hover {
    background-color: ${props => props.theme.primaryHoverColor || '#40a9ff'};
  }
`;

export function Button({ children }: { children: React.ReactNode }) {
  return <StyledButton>{children}</StyledButton>;
}
```

```typescript
// 方案3：动态样式隔离（运行时给所有样式添加前缀）

class StyleIsolation {
  private appName: string;
  private styleElements: HTMLStyleElement[] = [];

  constructor(appName: string) {
    this.appName = appName;
  }

  // 处理内联样式
  processInlineStyles(container: HTMLElement) {
    const styles = container.querySelectorAll('style');
    styles.forEach(style => {
      const scopedCSS = this.scopeCSS(style.textContent || '');
      style.textContent = scopedCSS;
      this.styleElements.push(style);
    });
  }

  // 处理外部样式表
  async processLinkStyles(container: HTMLElement) {
    const links = container.querySelectorAll('link[rel="stylesheet"]');

    for (const link of Array.from(links)) {
      const href = link.getAttribute('href');
      if (href) {
        const css = await this.fetchCSS(href);
        const scopedCSS = this.scopeCSS(css);

        const style = document.createElement('style');
        style.textContent = scopedCSS;
        link.parentNode?.replaceChild(style, link);
        this.styleElements.push(style);
      }
    }
  }

  // 给 CSS 添加作用域
  private scopeCSS(css: string): string {
    const prefix = '[data-qiankun="' + this.appName + '"]';

    // 简单的 CSS 作用域添加
    return css.replace(
      /([^}]*)\{/g,
      (match, selector) => {
        // 跳过 @规则
        if (selector.trim().startsWith('@')) {
          return match;
        }

        // 为每个选择器添加前缀
        const scopedSelector = selector
          .split(',')
          .map((s: string) => prefix + ' ' + s.trim())
          .join(', ');

        return scopedSelector + ' {';
      }
    );
  }

  private async fetchCSS(url: string): Promise<string> {
    const response = await fetch(url);
    return response.text();
  }

  // 清理样式
  cleanup() {
    this.styleElements.forEach(style => style.remove());
    this.styleElements = [];
  }
}
```

### JavaScript 沙箱

```typescript
// Proxy 沙箱实现
class ProxySandbox {
  private proxy: Window;
  private running: boolean = false;
  private fakeWindow: Record<string, any> = {};

  constructor(name: string) {
    const rawWindow = window;
    const fakeWindow = this.createFakeWindow(rawWindow);

    const self = this;

    this.proxy = new Proxy(fakeWindow, {
      get: (target, property: string) => {
        // 优先从 fakeWindow 获取
        if (property in target) {
          return target[property];
        }

        // 否则从真实 window 获取
        const value = (rawWindow as any)[property];

        // 绑定函数的 this
        if (typeof value === 'function' && !self.isConstructor(value)) {
          return value.bind(rawWindow);
        }

        return value;
      },

      set: (target, property: string, value) => {
        if (self.running) {
          target[property] = value;

          // 某些属性需要同步到真实 window
          if (self.shouldSyncToRawWindow(property)) {
            (rawWindow as any)[property] = value;
          }
        }
        return true;
      },

      has: (target, property) => {
        return property in target || property in rawWindow;
      },

      deleteProperty: (target, property: string) => {
        if (self.running && property in target) {
          delete target[property];
        }
        return true;
      }
    }) as Window;

    this.fakeWindow = fakeWindow;
  }

  private createFakeWindow(rawWindow: Window): Record<string, any> {
    const fakeWindow: Record<string, any> = {};

    // 复制不可配置的属性
    Object.getOwnPropertyNames(rawWindow)
      .filter(prop => {
        const descriptor = Object.getOwnPropertyDescriptor(rawWindow, prop);
        return descriptor && !descriptor.configurable;
      })
      .forEach(prop => {
        const descriptor = Object.getOwnPropertyDescriptor(rawWindow, prop);
        if (descriptor) {
          Object.defineProperty(fakeWindow, prop, {
            ...descriptor,
            configurable: true,
            writable: true
          });
        }
      });

    return fakeWindow;
  }

  private isConstructor(fn: Function): boolean {
    return fn.prototype && fn.prototype.constructor === fn;
  }

  private shouldSyncToRawWindow(property: string): boolean {
    // 需要同步到真实 window 的属性
    const syncProps = ['__POWERED_BY_QIANKUN__'];
    return syncProps.includes(property);
  }

  // 激活沙箱
  activate() {
    this.running = true;
  }

  // 停用沙箱
  deactivate() {
    this.running = false;
  }

  // 获取代理对象
  getProxy(): Window {
    return this.proxy;
  }
}
```

```typescript
// 快照沙箱（兼容 IE11）
class SnapshotSandbox {
  private windowSnapshot: Map<string, any> = new Map();
  private modifyPropsMap: Map<string, any> = new Map();
  private running: boolean = false;

  // 激活沙箱
  activate() {
    // 保存当前 window 快照
    this.windowSnapshot.clear();
    for (const prop in window) {
      this.windowSnapshot.set(prop, (window as any)[prop]);
    }

    // 恢复之前的修改
    this.modifyPropsMap.forEach((value, prop) => {
      (window as any)[prop] = value;
    });

    this.running = true;
  }

  // 停用沙箱
  deactivate() {
    this.modifyPropsMap.clear();

    // 记录所有修改并恢复快照
    for (const prop in window) {
      if ((window as any)[prop] !== this.windowSnapshot.get(prop)) {
        this.modifyPropsMap.set(prop, (window as any)[prop]);

        // 恢复原值或删除新增属性
        if (this.windowSnapshot.has(prop)) {
          (window as any)[prop] = this.windowSnapshot.get(prop);
        } else {
          delete (window as any)[prop];
        }
      }
    }

    this.running = false;
  }
}
```

## 实战：完整的微前端项目

### 项目结构

```
micro-frontend-demo/
├── apps/
│   ├── main-app/                 # 主应用（容器）
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Layout.tsx
│   │   │   │   ├── Navigation.tsx
│   │   │   │   └── MicroAppLoader.tsx
│   │   │   ├── micro-apps/
│   │   │   │   ├── config.ts     # 子应用配置
│   │   │   │   └── lifecycle.ts  # 生命周期管理
│   │   │   ├── store/
│   │   │   │   └── globalState.ts
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── user-app/                 # 用户模块（React）
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── public-path.ts
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── order-app/                # 订单模块（Vue）
│       ├── src/
│       │   ├── views/
│       │   ├── components/
│       │   ├── public-path.ts
│       │   └── main.ts
│       ├── package.json
│       └── vite.config.ts
│
├── packages/
│   ├── shared-ui/                # 共享 UI 组件
│   ├── shared-utils/             # 共享工具函数
│   └── shared-types/             # 共享类型定义
│
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

### 主应用实现

```typescript
// apps/main-app/src/micro-apps/config.ts
import type { RegistrableApp } from 'qiankun';

export interface MicroAppConfig extends RegistrableApp<any> {
  title: string;
  icon?: string;
}

export const microApps: MicroAppConfig[] = [
  {
    name: 'user-app',
    title: '用户管理',
    icon: 'UserOutlined',
    entry: import.meta.env.VITE_USER_APP_URL || '//localhost:3001',
    container: '#micro-app-container',
    activeRule: '/users',
    props: {
      routerBase: '/users'
    }
  },
  {
    name: 'order-app',
    title: '订单管理',
    icon: 'ShoppingCartOutlined',
    entry: import.meta.env.VITE_ORDER_APP_URL || '//localhost:3002',
    container: '#micro-app-container',
    activeRule: '/orders',
    props: {
      routerBase: '/orders'
    }
  }
];
```

```typescript
// apps/main-app/src/micro-apps/lifecycle.ts
import {
  registerMicroApps,
  start,
  initGlobalState,
  addGlobalUncaughtErrorHandler
} from 'qiankun';
import { microApps } from './config';

// 初始化全局状态
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  theme: 'light',
  language: 'zh-CN'
};

export const globalStateActions = initGlobalState(initialState);

// 监听全局状态变化
globalStateActions.onGlobalStateChange((state, prev) => {
  console.log('[Main App] Global state changed:', state);

  // 持久化 token
  if (state.token !== prev.token) {
    if (state.token) {
      localStorage.setItem('token', state.token);
    } else {
      localStorage.removeItem('token');
    }
  }
});

// 初始化微前端
export function initMicroFrontends() {
  // 注册子应用
  registerMicroApps(
    microApps.map(app => ({
      ...app,
      props: {
        ...app.props,
        globalStateActions,
        getGlobalState: () => globalStateActions.getGlobalState(),
        setGlobalState: globalStateActions.setGlobalState
      }
    })),
    {
      beforeLoad: async (app) => {
        console.log('[qiankun] Loading:', app.name);
        // 显示加载动画
        document.getElementById('loading')?.classList.add('active');
      },
      beforeMount: async (app) => {
        console.log('[qiankun] Mounting:', app.name);
      },
      afterMount: async (app) => {
        console.log('[qiankun] Mounted:', app.name);
        // 隐藏加载动画
        document.getElementById('loading')?.classList.remove('active');
      },
      beforeUnmount: async (app) => {
        console.log('[qiankun] Unmounting:', app.name);
      },
      afterUnmount: async (app) => {
        console.log('[qiankun] Unmounted:', app.name);
      }
    }
  );

  // 全局错误处理
  addGlobalUncaughtErrorHandler((event) => {
    console.error('[qiankun] Global error:', event);
    // 可以在这里显示错误提示或上报错误
  });

  // 启动 qiankun
  start({
    prefetch: 'all',
    sandbox: {
      strictStyleIsolation: false,
      experimentalStyleIsolation: true
    },
    singular: true
  });
}
```

### Vite 配置

```typescript
// apps/user-app/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import qiankun from 'vite-plugin-qiankun';

export default defineConfig({
  plugins: [
    react(),
    qiankun('user-app', {
      useDevMode: true
    })
  ],
  server: {
    port: 3001,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser'
  }
});
```

```typescript
// apps/order-app/vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import qiankun from 'vite-plugin-qiankun';

export default defineConfig({
  plugins: [
    vue(),
    qiankun('order-app', {
      useDevMode: true
    })
  ],
  server: {
    port: 3002,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser'
  }
});
```

## 面试要点

### 常见面试问题

**Q1: 什么是微前端？它解决了什么问题？**

```
微前端是一种将大型前端应用拆分为多个独立可部署的小型应用的架构模式。
每个子应用可以独立开发、测试、部署，并且可以使用不同的技术栈。

解决的问题：
1. 巨石应用难以维护和迭代
2. 多团队协作开发效率低
3. 技术栈升级困难（无法渐进式升级）
4. 代码复用困难
5. 部署风险高（一处修改需要整体部署）
```

**Q2: 微前端有哪些主流实现方案？各有什么优缺点？**

```javascript
const solutions = {
  iframe: {
    pros: ['完全隔离', '实现简单', '安全性好'],
    cons: ['性能差', 'URL不同步', 'UI体验差', '通信复杂']
  },
  webComponents: {
    pros: ['原生支持', 'Shadow DOM隔离', '框架无关'],
    cons: ['浏览器兼容性', '样式隔离有限制', '需要改造现有应用']
  },
  moduleFederation: {
    pros: ['运行时共享依赖', '官方支持', '开发体验好'],
    cons: ['强依赖Webpack5', '配置复杂', '版本管理困难']
  },
  qiankun: {
    pros: ['开箱即用', 'JS沙箱', '样式隔离', '生态完善'],
    cons: ['有学习成本', '对子应用有侵入性']
  }
};
```

**Q3: qiankun 是如何实现 JS 沙箱的？**

```javascript
// qiankun 提供了两种沙箱：

// 1. Proxy 沙箱（默认，支持多实例）
// 使用 Proxy 代理 window 对象，子应用的全局变量修改不会影响真实 window
class ProxySandbox {
  constructor() {
    const fakeWindow = {};
    this.proxy = new Proxy(fakeWindow, {
      get(target, key) {
        return key in target ? target[key] : window[key];
      },
      set(target, key, value) {
        target[key] = value; // 只修改 fakeWindow
        return true;
      }
    });
  }
}

// 2. 快照沙箱（兼容 IE11，单实例）
// 激活时保存 window 快照，失活时恢复快照
class SnapshotSandbox {
  activate() {
    this.snapshot = { ...window };
  }
  deactivate() {
    for (const key in window) {
      if (window[key] !== this.snapshot[key]) {
        window[key] = this.snapshot[key];
      }
    }
  }
}
```

**Q4: 微前端中如何实现样式隔离？**

```javascript
// 1. Shadow DOM（严格隔离）
element.attachShadow({ mode: 'closed' });

// 2. CSS Modules / CSS-in-JS（编译时处理）
import styles from './Button.module.css';

// 3. BEM 命名规范
// .user-app__button--primary { }

// 4. 运行时动态添加前缀
// qiankun 的 experimentalStyleIsolation
// 给所有选择器添加 [data-qiankun="appName"] 前缀
```

**Q5: 微前端中的通信机制有哪些？**

```javascript
// 1. Props 传递（父子通信）
registerMicroApps([{
  name: 'app',
  props: { token, onLogout }
}]);

// 2. 全局状态（qiankun）
const actions = initGlobalState({ user: null });
actions.setGlobalState({ user: { id: 1 } });

// 3. 自定义事件
window.dispatchEvent(new CustomEvent('user:login', { detail: user }));

// 4. URL 参数
// 通过 URL 传递信息

// 5. 发布订阅模式
eventBus.emit('event', data);
eventBus.on('event', callback);
```

### 核心知识点总结

```
1. 微前端核心概念
   - 技术栈无关
   - 独立开发、独立部署
   - 增量升级
   - 独立运行时

2. 主流实现方案
   - iframe：隔离性最强但体验差
   - Web Components：原生支持但兼容性有限
   - Module Federation：Webpack5 官方方案
   - qiankun/single-spa：成熟的微前端框架

3. 关键技术点
   - JS 沙箱：Proxy 沙箱、快照沙箱
   - 样式隔离：Shadow DOM、CSS Modules、动态前缀
   - 路由管理：主应用分发、子应用处理内部路由
   - 通信机制：Props、全局状态、自定义事件

4. 部署策略
   - 独立部署
   - 版本管理
   - 灰度发布
   - CI/CD 自动化

5. 最佳实践
   - 合理拆分子应用
   - 统一的设计规范
   - 共享公共依赖
   - 完善的错误处理
```

## 总结

微前端架构为大型前端应用提供了一种可扩展、可维护的解决方案。通过将应用拆分为独立的子应用，团队可以独立开发、测试和部署，大大提高了开发效率和迭代速度。

选择合适的微前端方案需要根据项目实际情况：
- **iframe**：适合需要完全隔离的场景，如嵌入第三方页面
- **Web Components**：适合对浏览器兼容性要求不高的新项目
- **Module Federation**：适合使用 Webpack 5 且需要细粒度代码共享的项目
- **qiankun**：适合大多数企业级应用，开箱即用，生态完善

无论选择哪种方案，都需要重点关注：样式隔离、JS 沙箱、通信机制、路由管理和部署策略。同时，制定统一的开发规范和设计规范，确保子应用之间的用户体验一致性。

随着前端技术的发展，微前端将继续演进，成为构建大规模前端应用的主流架构模式。
