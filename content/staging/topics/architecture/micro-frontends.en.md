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
origin: old/src/content/docs/frontend/micro-frontends.en.md
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

As frontend applications continue to grow in scale, monolithic frontend applications face challenges such as low development efficiency, difficulty upgrading technology stacks, and complex team collaboration. Micro Frontends, an architectural pattern that splits large frontend applications into multiple independently deployable smaller applications, has become a mainstream solution to these problems. This article will delve into the core concepts, implementation solutions, routing strategies, state management, and deployment best practices of micro frontends.

## What is Micro Frontends

### Definition of Micro Frontends

Micro Frontends is an architecture similar to microservices, applying microservice concepts to the browser. It transforms a web application from a single monolithic application into an aggregation of multiple smaller frontend applications. Each frontend application can run, be developed, and be deployed independently.

```
Traditional Monolithic Frontend              Micro Frontends Architecture
┌─────────────────────┐         ┌─────────────────────────────┐
│                     │         │      Main App (Container)    │
│   Monolithic        │         │  ┌─────┬─────┬─────┬─────┐  │
│   Frontend App      │   ==>   │  │App1 │App2 │App3 │App4 │  │
│                     │         │  │React│Vue  │Angular│Svelte│ │
│   All features      │         │  └─────┴─────┴─────┴─────┘  │
│   coupled together  │         └─────────────────────────────┘
└─────────────────────┘
```

### Core Principles of Micro Frontends

```typescript
// Core principles of micro frontends
const microFrontendPrinciples = {
  // 1. Technology Agnostic
  techAgnostic: 'The main app does not restrict sub-app technology stacks; each sub-app can use different frameworks',

  // 2. Independent Development and Deployment
  independence: 'Each sub-app can be developed, tested, and deployed independently without affecting other apps',

  // 3. Incremental Upgrades
  incrementalUpgrade: 'Allows gradual upgrading, updating, or rewriting of certain parts of the application',

  // 4. Isolated Runtime
  isolatedRuntime: 'State isolation between sub-apps; runtime state is not shared',

  // 5. Consistent User Experience
  consistentUX: 'Although technically independent, user experience remains consistent'
};
```

### Comparison: Micro Frontends vs Microservices

| Feature | Microservices | Micro Frontends |
|---------|---------------|-----------------|
| Split Dimension | Split backend services by business domain | Split frontend apps by business functionality |
| Independence | Independent deployment, independent databases | Independent deployment, independent runtime |
| Communication | HTTP/RPC/Message Queue | Custom Events/Props/URL |
| Technology Stack | Can be different | Can be different |
| Team Division | Teams divided by service | Teams divided by functional module |
| Challenges | Service discovery, distributed transactions | Style isolation, JS sandbox, communication mechanism |

## Advantages and Challenges of Micro Frontends

### Key Advantages

```typescript
// Key advantages of micro frontends
const benefits = {
  // 1. Independent Development and Deployment
  independentDeployment: {
    description: 'Each team can independently develop and deploy their own application',
    example: `
      // Team A deploys user module
      deploy('user-app', { version: '2.0.0' });

      // Team B deploys order module (completely independent)
      deploy('order-app', { version: '1.5.0' });
    `
  },

  // 2. Technology Stack Flexibility
  techFlexibility: {
    description: 'Different modules can use different technology stacks',
    example: `
      // Legacy modules can continue using Vue 2
      // New modules can use React 18 or Vue 3
      // Gradual migration without full rewrite
    `
  },

  // 3. Team Autonomy
  teamAutonomy: {
    description: 'Each team has full control over their own code',
    benefit: 'Reduces dependencies and coordination costs between teams'
  },

  // 4. Incremental Upgrades
  incrementalUpgrade: {
    description: 'Allows gradual upgrading of certain parts of the application',
    example: 'Gradually migrate an Angular 1 app to React instead of a complete rewrite'
  },

  // 5. Fault Isolation
  faultIsolation: {
    description: 'A crash in one sub-app does not affect the entire system',
    example: 'When the order module fails, the user module remains available'
  }
};
```

### Challenges

```typescript
// Key challenges of micro frontends
const challenges = {
  // 1. Style Isolation
  styleIsolation: {
    problem: 'CSS from different sub-apps may affect each other',
    solutions: [
      'CSS Modules',
      'Shadow DOM',
      'CSS-in-JS',
      'BEM naming convention',
      'Dynamic style add/remove'
    ]
  },

  // 2. JavaScript Sandbox
  jsSandbox: {
    problem: 'Global variable pollution, event listener conflicts',
    solutions: [
      'Proxy sandbox',
      'iframe sandbox',
      'Snapshot sandbox',
      'with + Proxy combination'
    ]
  },

  // 3. Shared Dependencies
  sharedDependencies: {
    problem: 'Duplicate loading of large libraries like React, Vue',
    solutions: [
      'Module Federation shared dependencies',
      'externals + CDN',
      'Unified version management'
    ]
  },

  // 4. Communication Mechanism
  communication: {
    problem: 'Sub-apps need to communicate with each other',
    solutions: [
      'Custom events',
      'Global state management',
      'URL parameters',
      'Props passing'
    ]
  },

  // 5. Performance Issues
  performance: {
    problem: 'Multiple sub-apps may cause performance degradation',
    solutions: [
      'Lazy loading',
      'Preloading',
      'Resource caching',
      'Common dependency extraction'
    ]
  }
};
```

### When to Use Micro Frontends

```typescript
// Scenarios suitable for micro frontends
const whenToUseMicroFrontends = {
  suitable: [
    'Large enterprise applications with multiple teams collaborating',
    'Legacy systems that need gradual refactoring and upgrading',
    'Need to integrate multiple independent products into one platform',
    'Different modules have different release cycles',
    'Large team size, need to reduce collaboration costs'
  ],

  notSuitable: [
    'Small applications with small team size',
    'Unified technology stack with no legacy burden',
    'Scenarios with extreme performance requirements',
    'Simple display-oriented websites',
    'Team unfamiliar with micro frontend technology'
  ]
};
```

## Micro Frontend Implementation Solutions

### iframe Solution

iframe is the simplest and most primitive micro frontend solution, embedding sub-apps through iframe tags.

```typescript
// iframe solution example
class IframeMicroFrontend {
  private container: HTMLElement;
  private iframe: HTMLIFrameElement | null = null;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
  }

  // Load sub-app
  loadApp(url: string, options: { height?: string; sandbox?: string } = {}) {
    // Destroy old iframe
    this.destroy();

    // Create new iframe
    this.iframe = document.createElement('iframe');
    this.iframe.src = url;
    this.iframe.style.width = '100%';
    this.iframe.style.height = options.height || '100%';
    this.iframe.style.border = 'none';

    // Security configuration
    if (options.sandbox) {
      this.iframe.sandbox.value = options.sandbox;
    }

    this.container.appendChild(this.iframe);

    // Listen for load completion
    return new Promise((resolve, reject) => {
      this.iframe!.onload = resolve;
      this.iframe!.onerror = reject;
    });
  }

  // Communicate with sub-app
  postMessage(message: any, targetOrigin: string = '*') {
    this.iframe?.contentWindow?.postMessage(message, targetOrigin);
  }

  // Listen for sub-app messages
  onMessage(callback: (event: MessageEvent) => void) {
    window.addEventListener('message', (event) => {
      // Validate message source
      if (this.iframe?.contentWindow === event.source) {
        callback(event);
      }
    });
  }

  // Destroy
  destroy() {
    if (this.iframe) {
      this.container.removeChild(this.iframe);
      this.iframe = null;
    }
  }
}

// Usage example
const microApp = new IframeMicroFrontend('app-container');
await microApp.loadApp('https://sub-app.example.com');

// Send message to sub-app
microApp.postMessage({ type: 'INIT', data: { userId: '123' } });

// Listen for sub-app messages
microApp.onMessage((event) => {
  console.log('Received message from sub-app:', event.data);
});
```

**Pros and Cons of iframe Solution:**

```typescript
const iframeProsCons = {
  pros: [
    'Natural isolation (JS, CSS, DOM completely isolated)',
    'Simple implementation, mature technology',
    'Good security, supports sandbox attribute',
    'Can embed any third-party page'
  ],
  cons: [
    'URL not synchronized, state lost on page refresh',
    'Poor performance, each iframe is an independent browser context',
    'UI not synchronized, popups and overlays cannot cover globally',
    'Complex communication, only via postMessage',
    'SEO unfriendly'
  ]
};
```

### Web Components Solution

Use native Web Components technology to implement micro frontends, leveraging Shadow DOM for style isolation.

```typescript
// Define a micro frontend container Web Component
class MicroFrontendContainer extends HTMLElement {
  private shadow: ShadowRoot;
  private appContainer: HTMLDivElement;

  constructor() {
    super();
    // Create Shadow DOM
    this.shadow = this.attachShadow({ mode: 'open' });
    this.appContainer = document.createElement('div');
    this.appContainer.id = 'micro-app-root';
    this.shadow.appendChild(this.appContainer);
  }

  // Lifecycle: element added to DOM
  async connectedCallback() {
    const appUrl = this.getAttribute('app-url');
    const appName = this.getAttribute('app-name');

    if (appUrl && appName) {
      await this.loadApp(appUrl, appName);
    }
  }

  // Lifecycle: element removed from DOM
  disconnectedCallback() {
    this.unmountApp();
  }

  // Attribute change listener
  static get observedAttributes() {
    return ['app-url', 'app-name'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      this.reloadApp();
    }
  }

  // Load sub-app
  private async loadApp(url: string, name: string) {
    try {
      // Load sub-app JS
      const module = await import(/* webpackIgnore: true */ url);

      // Mount sub-app
      if (module.mount) {
        await module.mount(this.appContainer, {
          name,
          container: this.shadow,
          props: this.getProps()
        });
      }

      // Load sub-app styles (in Shadow DOM)
      await this.loadStyles(url.replace('.js', '.css'));

    } catch (error) {
      console.error('Failed to load micro app:', name, error);
      this.renderError(error);
    }
  }

  // Load styles into Shadow DOM
  private async loadStyles(cssUrl: string) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    this.shadow.insertBefore(link, this.appContainer);
  }

  // Get props passed to sub-app
  private getProps(): Record<string, any> {
    const props: Record<string, any> = {};
    for (const attr of this.attributes) {
      if (attr.name.startsWith('data-')) {
        props[attr.name.slice(5)] = attr.value;
      }
    }
    return props;
  }

  // Unmount sub-app
  private unmountApp() {
    // Notify sub-app to unmount
    this.dispatchEvent(new CustomEvent('micro-app-unmount'));
    // Clear container content safely
    while (this.appContainer.firstChild) {
      this.appContainer.removeChild(this.appContainer.firstChild);
    }
  }

  // Reload
  private async reloadApp() {
    this.unmountApp();
    const appUrl = this.getAttribute('app-url');
    const appName = this.getAttribute('app-name');
    if (appUrl && appName) {
      await this.loadApp(appUrl, appName);
    }
  }

  // Render error message
  private renderError(error: Error | unknown) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'padding: 20px; color: red;';
    errorDiv.textContent = 'Failed to load micro app: ' +
      (error instanceof Error ? error.message : String(error));
    while (this.appContainer.firstChild) {
      this.appContainer.removeChild(this.appContainer.firstChild);
    }
    this.appContainer.appendChild(errorDiv);
  }
}

// Register custom element
customElements.define('micro-frontend', MicroFrontendContainer);
```

```html
<!-- Load micro frontend using Web Component -->
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
// Lifecycle functions exported by sub-app
// user-app/main.ts
export async function mount(container: HTMLElement, options: MountOptions) {
  const { props } = options;

  // Render with React (example)
  const root = createRoot(container);
  root.render(<App userId={props.userId} theme={props.theme} />);

  // Return unmount function
  return () => {
    root.unmount();
  };
}

export async function unmount() {
  // Cleanup
}
```

### Module Federation

Webpack 5's Module Federation is one of the most popular micro frontend solutions, allowing multiple independently built applications to share code at runtime.

```javascript
// host-app/webpack.config.js - Main app configuration
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      filename: 'remoteEntry.js',
      remotes: {
        // Remote sub-apps
        userApp: 'userApp@http://localhost:3001/remoteEntry.js',
        orderApp: 'orderApp@http://localhost:3002/remoteEntry.js',
        productApp: 'productApp@http://localhost:3003/remoteEntry.js',
      },
      shared: {
        // Shared dependencies
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
// user-app/webpack.config.js - Sub-app configuration
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'userApp',
      filename: 'remoteEntry.js',
      exposes: {
        // Exposed modules
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
// host-app/src/App.tsx - Using remote modules in main app
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/Loading';

// Dynamically import remote modules
const UserApp = lazy(() => import('userApp/UserApp'));
const OrderApp = lazy(() => import('orderApp/OrderApp'));
const ProductApp = lazy(() => import('productApp/ProductApp'));

// Remote component wrapper
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
// Dynamic remote module loading
// utils/dynamicFederation.ts

interface RemoteConfig {
  url: string;
  scope: string;
  module: string;
}

// Utility function for dynamically loading remote modules
async function loadRemoteModule<T = any>(config: RemoteConfig): Promise<T> {
  const { url, scope, module } = config;

  // 1. Load remote entry file
  await loadScript(url);

  // 2. Initialize shared scope
  // @ts-ignore
  await __webpack_init_sharing__('default');

  // 3. Get remote container
  const container = (window as any)[scope];
  // @ts-ignore
  await container.init(__webpack_share_scopes__.default);

  // 4. Get module factory
  const factory = await container.get(module);

  // 5. Execute factory to get module
  return factory();
}

// Load script
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

// Usage example: dynamically load remote component
const DynamicRemoteComponent = lazy(async () => {
  const module = await loadRemoteModule({
    url: 'http://localhost:3001/remoteEntry.js',
    scope: 'userApp',
    module: './UserProfile'
  });
  return { default: module.default || module };
});
```

### qiankun Framework

qiankun is an open-source micro frontend framework from Ant Financial, built on single-spa, providing an out-of-the-box micro frontend solution.

```typescript
// Main app configuration
// main-app/src/micro-apps.ts
import {
  registerMicroApps,
  start,
  setDefaultMountApp,
  runAfterFirstMounted,
  addGlobalUncaughtErrorHandler
} from 'qiankun';

// Sub-app configuration
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
      // Show/hide loading state
      console.log('loading:', loading);
    }
  }
];

// Register sub-apps
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

// Set default sub-app to enter
setDefaultMountApp('/users');

// Callback after first sub-app mounted
runAfterFirstMounted(() => {
  console.log('[qiankun] first app mounted');
});

// Global error handling
addGlobalUncaughtErrorHandler((event) => {
  console.error('[qiankun] global error:', event);
});

// Start qiankun
start({
  prefetch: 'all', // Prefetch strategy
  sandbox: {
    strictStyleIsolation: true, // Strict style isolation (Shadow DOM)
    experimentalStyleIsolation: true // Experimental style isolation
  },
  singular: true // Single instance mode
});
```

```typescript
// Sub-app entry
// user-app/src/main.ts (Vue 3 example)
import { createApp, App as VueApp } from 'vue';
import { createRouter, createWebHistory, Router } from 'vue-router';
import App from './App.vue';
import routes from './router';
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper';

let app: VueApp<Element> | null = null;
let router: Router | null = null;
let history: ReturnType<typeof createWebHistory> | null = null;

// Render function
function render(props: any = {}) {
  const { container } = props;

  // Set router base based on qiankun environment
  history = createWebHistory(
    qiankunWindow.__POWERED_BY_QIANKUN__ ? '/users' : '/'
  );

  router = createRouter({
    history,
    routes
  });

  app = createApp(App);
  app.use(router);

  // Mount to container
  const mountElement = container
    ? container.querySelector('#app')
    : document.getElementById('app');

  app.mount(mountElement);
}

// qiankun lifecycle hooks
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

// Standalone mode
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render();
}
```

```typescript
// Sub-app entry
// order-app/src/main.tsx (React example)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

let root: ReactDOM.Root | null = null;

// Render function
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

// qiankun lifecycle
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

// Standalone mode
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

// TypeScript type declaration
declare global {
  interface Window {
    __POWERED_BY_QIANKUN__?: boolean;
  }
}
```

### single-spa Framework

single-spa is the pioneer framework for micro frontends, and qiankun is built on top of it.

```typescript
// Main app configuration
// root-config/src/main.ts
import { registerApplication, start, LifeCycles } from 'single-spa';

// App loading function
function loadApp(name: string, url: string): () => Promise<LifeCycles> {
  return async () => {
    // Load sub-app JS
    await loadScript(url + '/main.js');

    // Get lifecycle functions exported by sub-app
    return (window as any)[name];
  };
}

// Helper function: load script
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Register applications
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

// Using System.js dynamic import
registerApplication({
  name: '@org/dashboard',
  app: () => System.import('@org/dashboard'),
  activeWhen: ['/dashboard']
});

// Start single-spa
start({
  urlRerouteOnly: true
});
```

```typescript
// Sub-app
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

    // Build navigation using safe DOM methods
    const ul = document.createElement('ul');

    const links = [
      { href: '/home', text: 'Home' },
      { href: '/dashboard', text: 'Dashboard' },
      { href: '/settings', text: 'Settings' }
    ];

    links.forEach(link => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.text;
      li.appendChild(a);
      ul.appendChild(li);
    });

    container.appendChild(ul);
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

## Routing Strategies

### Route Distribution Strategy

```typescript
// Route distribution: main app handles route distribution, sub-apps handle internal routing

// Main app router configuration
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
        // Match /users and all sub-routes
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

// Route guard: handle sub-app loading
router.beforeEach(async (to, from, next) => {
  const microApp = to.meta.microApp as string;

  if (microApp) {
    // Prefetch sub-app resources
    await prefetchApp(microApp);
  }

  next();
});

export default router;
```

### Sub-app Internal Routing

```typescript
// Sub-app router configuration
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

// Set base based on runtime environment
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

### Route Synchronization

```typescript
// Main app and sub-app route synchronization
// utils/routeSync.ts

interface RouteChangeEvent {
  type: 'ROUTE_CHANGE';
  payload: {
    path: string;
    query?: Record<string, string>;
    hash?: string;
  };
}

// Main app: listen for sub-app route changes
export function listenChildRouteChange(callback: (route: RouteChangeEvent['payload']) => void) {
  window.addEventListener('message', (event) => {
    if (event.data.type === 'ROUTE_CHANGE') {
      callback(event.data.payload);
    }
  });
}

// Sub-app: notify main app of route changes
export function notifyParentRouteChange(route: RouteChangeEvent['payload']) {
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'ROUTE_CHANGE',
      payload: route
    }, '*');
  }
}

// Use in sub-app route guard
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
// Using custom events for synchronization (qiankun recommended approach)
import { initGlobalState, MicroAppStateActions } from 'qiankun';

// Main app
const actions: MicroAppStateActions = initGlobalState({
  currentRoute: '/'
});

actions.onGlobalStateChange((state, prev) => {
  console.log('Global state changed:', state, prev);
  // Sync route to browser URL
  if (state.currentRoute !== prev.currentRoute) {
    history.pushState(null, '', state.currentRoute);
  }
});

// Sub-app
export function mount(props: any) {
  const { onGlobalStateChange, setGlobalState } = props;

  // Listen for global state changes
  onGlobalStateChange((state: any) => {
    console.log('State changed:', state);
  });

  // Update global state on route change
  router.afterEach((to) => {
    setGlobalState({ currentRoute: to.fullPath });
  });
}
```

## Shared State Management

### Global State Management Solutions

```typescript
// Solution 1: Using qiankun's globalState
// Main app
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

// Listen for state changes
actions.onGlobalStateChange((newState, prevState) => {
  console.log('Global state changed:', { newState, prevState });
});

// Update state
actions.setGlobalState({
  user: { id: '1', name: 'admin', token: 'xxx' }
});

// Export for sub-apps to use
export { actions };
```

```typescript
// Using global state in sub-app
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

    // Listen for global state changes
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

  // Specific business methods
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

### Publish-Subscribe Communication

```typescript
// Custom event bus
// shared/eventBus.ts

type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();
  private maxListeners: number = 10;

  // Subscribe to event
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    const listeners = this.events.get(event)!;

    if (listeners.size >= this.maxListeners) {
      console.warn('Event "' + event + '" has reached max listeners (' + this.maxListeners + ')');
    }

    listeners.add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  // Subscribe once
  once(event: string, callback: EventCallback): () => void {
    const wrapper: EventCallback = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  // Unsubscribe
  off(event: string, callback: EventCallback): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.events.delete(event);
      }
    }
  }

  // Publish event
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

  // Clear all events
  clear(): void {
    this.events.clear();
  }

  // Clear all listeners for a specific event
  clearEvent(event: string): void {
    this.events.delete(event);
  }
}

// Global singleton
export const eventBus = new EventBus();

// Mount to window (for cross-app communication)
if (typeof window !== 'undefined') {
  (window as any).__MICRO_EVENT_BUS__ = eventBus;
}

// Get global event bus (for sub-apps)
export function getEventBus(): EventBus {
  return (window as any).__MICRO_EVENT_BUS__ || eventBus;
}
```

```typescript
// Using event bus for communication
// Main app
import { eventBus } from '@/shared/eventBus';

// Send user login event
eventBus.emit('user:login', { userId: '123', token: 'xxx' });

// Listen for sub-app events
eventBus.on('cart:updated', (cartInfo) => {
  console.log('Cart updated:', cartInfo);
  updateCartBadge(cartInfo.itemCount);
});

// Sub-app
import { getEventBus } from '@/shared/eventBus';

const bus = getEventBus();

// Listen for main app events
bus.on('user:login', (userInfo) => {
  store.setUser(userInfo);
});

// Send event to main app
bus.emit('cart:updated', { itemCount: 5, totalPrice: 299 });
```

### Shared State Library

```typescript
// Using Redux as shared state library
// shared/store/index.ts
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

// User state
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

// Global UI state
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

// Create store
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

// Mount to global
if (typeof window !== 'undefined') {
  (window as any).__SHARED_STORE__ = store;
}

// Get shared store
export function getSharedStore() {
  return (window as any).__SHARED_STORE__ || store;
}
```

```typescript
// Using shared store in sub-app
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

// Usage example
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

## Deployment Strategies

### Independent Deployment

```yaml
# Sub-app independent deployment - Docker Compose
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

        # Main app
        location / {
            proxy_pass http://main_app;
            proxy_set_header Host $host;
        }

        # User sub-app resources
        location /users/ {
            proxy_pass http://user_app/;
            proxy_set_header Host $host;

            # Handle CORS
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
            add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
        }

        # Order sub-app resources
        location /orders/ {
            proxy_pass http://order_app/;
            proxy_set_header Host $host;
            add_header Access-Control-Allow-Origin *;
        }
    }
}
```

### CI/CD Pipeline

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

### Version Management and Canary Releases

```typescript
// Sub-app version management
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

  // Get app version based on canary rules
  getAppVersion(appName: string): AppVersion | undefined {
    // Check if canary rules are matched
    if (this.shouldUseCanary()) {
      const canaryApp = this.config.canary.find(app => app.name === appName);
      if (canaryApp) {
        return canaryApp;
      }
    }

    // Return stable version
    return this.config.stable.find(app => app.name === appName);
  }

  // Check if canary version should be used
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
          // Check via specific header
          break;
      }
    }
    return false;
  }

  private getCurrentUserId(): string {
    // Get current user ID
    return localStorage.getItem('userId') || '';
  }

  // Get all app configurations
  getAllApps(): AppVersion[] {
    return this.config.stable.map(app => {
      return this.getAppVersion(app.name) || app;
    });
  }
}

// Usage example
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
    { type: 'percentage', value: 10 } // 10% of users use canary version
  ]
});

// Use when registering apps
const apps = versionManager.getAllApps();
// registerMicroApps(apps);
```

## Style Isolation and JS Sandbox

### CSS Isolation Solutions

```css
/* Solution 1: CSS Modules */
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
// Solution 2: CSS-in-JS (styled-components)
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
// Solution 3: Dynamic style isolation (runtime prefix for all styles)

class StyleIsolation {
  private appName: string;
  private styleElements: HTMLStyleElement[] = [];

  constructor(appName: string) {
    this.appName = appName;
  }

  // Process inline styles
  processInlineStyles(container: HTMLElement) {
    const styles = container.querySelectorAll('style');
    styles.forEach(style => {
      const scopedCSS = this.scopeCSS(style.textContent || '');
      style.textContent = scopedCSS;
      this.styleElements.push(style);
    });
  }

  // Process external stylesheets
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

  // Add scope to CSS
  private scopeCSS(css: string): string {
    const prefix = '[data-qiankun="' + this.appName + '"]';

    // Simple CSS scoping
    return css.replace(
      /([^}]*)\{/g,
      (match, selector) => {
        // Skip @ rules
        if (selector.trim().startsWith('@')) {
          return match;
        }

        // Add prefix to each selector
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

  // Cleanup styles
  cleanup() {
    this.styleElements.forEach(style => style.remove());
    this.styleElements = [];
  }
}
```

### JavaScript Sandbox

```typescript
// Proxy sandbox implementation
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
        // Prioritize getting from fakeWindow
        if (property in target) {
          return target[property];
        }

        // Otherwise get from real window
        const value = (rawWindow as any)[property];

        // Bind function's this
        if (typeof value === 'function' && !self.isConstructor(value)) {
          return value.bind(rawWindow);
        }

        return value;
      },

      set: (target, property: string, value) => {
        if (self.running) {
          target[property] = value;

          // Some properties need to sync to real window
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

    // Copy non-configurable properties
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
    // Properties that need to sync to real window
    const syncProps = ['__POWERED_BY_QIANKUN__'];
    return syncProps.includes(property);
  }

  // Activate sandbox
  activate() {
    this.running = true;
  }

  // Deactivate sandbox
  deactivate() {
    this.running = false;
  }

  // Get proxy object
  getProxy(): Window {
    return this.proxy;
  }
}
```

```typescript
// Snapshot sandbox (IE11 compatible)
class SnapshotSandbox {
  private windowSnapshot: Map<string, any> = new Map();
  private modifyPropsMap: Map<string, any> = new Map();
  private running: boolean = false;

  // Activate sandbox
  activate() {
    // Save current window snapshot
    this.windowSnapshot.clear();
    for (const prop in window) {
      this.windowSnapshot.set(prop, (window as any)[prop]);
    }

    // Restore previous modifications
    this.modifyPropsMap.forEach((value, prop) => {
      (window as any)[prop] = value;
    });

    this.running = true;
  }

  // Deactivate sandbox
  deactivate() {
    this.modifyPropsMap.clear();

    // Record all modifications and restore snapshot
    for (const prop in window) {
      if ((window as any)[prop] !== this.windowSnapshot.get(prop)) {
        this.modifyPropsMap.set(prop, (window as any)[prop]);

        // Restore original value or delete new property
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

## Practical Example: Complete Micro Frontend Project

### Project Structure

```
micro-frontend-demo/
├── apps/
│   ├── main-app/                 # Main app (container)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Layout.tsx
│   │   │   │   ├── Navigation.tsx
│   │   │   │   └── MicroAppLoader.tsx
│   │   │   ├── micro-apps/
│   │   │   │   ├── config.ts     # Sub-app configuration
│   │   │   │   └── lifecycle.ts  # Lifecycle management
│   │   │   ├── store/
│   │   │   │   └── globalState.ts
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── user-app/                 # User module (React)
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── public-path.ts
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── order-app/                # Order module (Vue)
│       ├── src/
│       │   ├── views/
│       │   ├── components/
│       │   ├── public-path.ts
│       │   └── main.ts
│       ├── package.json
│       └── vite.config.ts
│
├── packages/
│   ├── shared-ui/                # Shared UI components
│   ├── shared-utils/             # Shared utility functions
│   └── shared-types/             # Shared type definitions
│
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

### Main App Implementation

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
    title: 'User Management',
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
    title: 'Order Management',
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

// Initialize global state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  theme: 'light',
  language: 'zh-CN'
};

export const globalStateActions = initGlobalState(initialState);

// Listen for global state changes
globalStateActions.onGlobalStateChange((state, prev) => {
  console.log('[Main App] Global state changed:', state);

  // Persist token
  if (state.token !== prev.token) {
    if (state.token) {
      localStorage.setItem('token', state.token);
    } else {
      localStorage.removeItem('token');
    }
  }
});

// Initialize micro frontends
export function initMicroFrontends() {
  // Register sub-apps
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
        // Show loading animation
        document.getElementById('loading')?.classList.add('active');
      },
      beforeMount: async (app) => {
        console.log('[qiankun] Mounting:', app.name);
      },
      afterMount: async (app) => {
        console.log('[qiankun] Mounted:', app.name);
        // Hide loading animation
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

  // Global error handling
  addGlobalUncaughtErrorHandler((event) => {
    console.error('[qiankun] Global error:', event);
    // Can show error notification or report errors here
  });

  // Start qiankun
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

### Vite Configuration

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

## Interview Key Points

### Common Interview Questions

**Q1: What is micro frontends? What problems does it solve?**

```
Micro frontends is an architectural pattern that splits large frontend applications into
multiple independently deployable smaller applications. Each sub-app can be independently
developed, tested, deployed, and can use different technology stacks.

Problems solved:
1. Monolithic applications are difficult to maintain and iterate
2. Low efficiency in multi-team collaboration development
3. Difficult technology stack upgrades (cannot progressively upgrade)
4. Difficult code reuse
5. High deployment risk (one change requires full deployment)
```

**Q2: What are the mainstream micro frontend implementation solutions? What are their pros and cons?**

```javascript
const solutions = {
  iframe: {
    pros: ['Complete isolation', 'Simple implementation', 'Good security'],
    cons: ['Poor performance', 'URL not synced', 'Poor UI experience', 'Complex communication']
  },
  webComponents: {
    pros: ['Native support', 'Shadow DOM isolation', 'Framework agnostic'],
    cons: ['Browser compatibility', 'Limited style isolation', 'Requires modifying existing apps']
  },
  moduleFederation: {
    pros: ['Runtime dependency sharing', 'Official support', 'Good dev experience'],
    cons: ['Strongly depends on Webpack5', 'Complex configuration', 'Difficult version management']
  },
  qiankun: {
    pros: ['Out-of-the-box', 'JS sandbox', 'Style isolation', 'Complete ecosystem'],
    cons: ['Has learning curve', 'Invasive to sub-apps']
  }
};
```

**Q3: How does qiankun implement JS sandbox?**

```javascript
// qiankun provides two sandboxes:

// 1. Proxy sandbox (default, supports multiple instances)
// Uses Proxy to intercept window object, sub-app global variable changes don't affect real window
class ProxySandbox {
  constructor() {
    const fakeWindow = {};
    this.proxy = new Proxy(fakeWindow, {
      get(target, key) {
        return key in target ? target[key] : window[key];
      },
      set(target, key, value) {
        target[key] = value; // Only modifies fakeWindow
        return true;
      }
    });
  }
}

// 2. Snapshot sandbox (IE11 compatible, single instance)
// Saves window snapshot on activation, restores snapshot on deactivation
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

**Q4: How to implement style isolation in micro frontends?**

```javascript
// 1. Shadow DOM (strict isolation)
element.attachShadow({ mode: 'closed' });

// 2. CSS Modules / CSS-in-JS (compile-time processing)
import styles from './Button.module.css';

// 3. BEM naming convention
// .user-app__button--primary { }

// 4. Runtime dynamic prefix
// qiankun's experimentalStyleIsolation
// Adds [data-qiankun="appName"] prefix to all selectors
```

**Q5: What communication mechanisms are there in micro frontends?**

```javascript
// 1. Props passing (parent-child communication)
registerMicroApps([{
  name: 'app',
  props: { token, onLogout }
}]);

// 2. Global state (qiankun)
const actions = initGlobalState({ user: null });
actions.setGlobalState({ user: { id: 1 } });

// 3. Custom events
window.dispatchEvent(new CustomEvent('user:login', { detail: user }));

// 4. URL parameters
// Pass information via URL

// 5. Publish-subscribe pattern
eventBus.emit('event', data);
eventBus.on('event', callback);
```

### Core Knowledge Summary

```
1. Core Concepts of Micro Frontends
   - Technology agnostic
   - Independent development and deployment
   - Incremental upgrades
   - Isolated runtime

2. Mainstream Implementation Solutions
   - iframe: Strongest isolation but poor experience
   - Web Components: Native support but limited compatibility
   - Module Federation: Webpack5 official solution
   - qiankun/single-spa: Mature micro frontend frameworks

3. Key Technical Points
   - JS Sandbox: Proxy sandbox, Snapshot sandbox
   - Style Isolation: Shadow DOM, CSS Modules, Dynamic prefix
   - Route Management: Main app distribution, sub-app handles internal routing
   - Communication Mechanism: Props, Global state, Custom events

4. Deployment Strategies
   - Independent deployment
   - Version management
   - Canary releases
   - CI/CD automation

5. Best Practices
   - Reasonable sub-app splitting
   - Unified design specifications
   - Shared common dependencies
   - Comprehensive error handling
```

## Summary

Micro frontend architecture provides a scalable and maintainable solution for large frontend applications. By splitting applications into independent sub-apps, teams can develop, test, and deploy independently, greatly improving development efficiency and iteration speed.

Choosing the right micro frontend solution depends on your project's specific situation:
- **iframe**: Suitable for scenarios requiring complete isolation, such as embedding third-party pages
- **Web Components**: Suitable for new projects with lower browser compatibility requirements
- **Module Federation**: Suitable for projects using Webpack 5 that need fine-grained code sharing
- **qiankun**: Suitable for most enterprise applications, out-of-the-box with a complete ecosystem

Regardless of which solution you choose, you need to focus on: style isolation, JS sandbox, communication mechanisms, route management, and deployment strategies. Meanwhile, establish unified development and design specifications to ensure consistent user experience across sub-apps.

As frontend technology continues to evolve, micro frontends will continue to advance and become the mainstream architectural pattern for building large-scale frontend applications.
