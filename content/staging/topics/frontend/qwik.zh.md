---
title: Qwik 即时加载框架
description: 学习Qwik实现零JavaScript启动时间
track: frontend
section: build-tools
difficulty: advanced
tags:
  - Qwik
  - Resumability
  - 性能
  - SSR
status: imported
origin: old/src/content/docs/frontend/qwik.zh.md
divergence: 0.124
issues: []
legacy:
  category: Frontend
  subcategory: Frameworks
  order: 40
  lastUpdated: 2026-01-07
---

Qwik 是由 Builder.io 团队开发的革命性前端框架，它通过独特的"可恢复性"(Resumability)架构，实现了真正的零 JavaScript 启动时间。与传统框架的"水合"(Hydration)模式不同，Qwik 能够在服务端完成渲染后，让客户端直接"恢复"应用状态，无需重新执行 JavaScript 来重建组件树。

## 可恢复性 vs 水合 (Resumability vs Hydration)

### 传统水合的问题

传统 SSR 框架（如 React、Vue）使用水合模式：

```
服务端渲染 HTML → 发送到客户端 → 下载 JS → 解析执行 JS → 重建组件树 → 绑定事件 → 可交互
```

这个过程存在几个关键问题：

1. **重复工作**：服务端已经渲染了 UI，客户端却要重新执行相同逻辑
2. **阻塞交互**：必须等待所有 JavaScript 加载和执行完成
3. **O(n) 复杂度**：应用越大，水合时间越长

```javascript
// 传统框架的水合过程（伪代码）
function hydrate(app) {
  // 1. 下载所有组件代码
  const components = downloadAllComponents();

  // 2. 重新执行所有组件
  components.forEach(component => {
    component.execute();
    component.setupState();
    component.attachListeners();
  });

  // 即使用户只想点击一个按钮，也要执行以上所有步骤
}
```

### Qwik 的可恢复性

Qwik 采用完全不同的方法：

```
服务端渲染 HTML（包含序列化状态）→ 发送到客户端 → 直接可交互
```

```javascript
// Qwik 的可恢复性（概念）
// 服务端：将应用状态序列化到 HTML
<div q:key="component-1" on:click="./chunk-abc.js#handleClick">
  点击我
</div>
<script type="qwik/state">
  {"count": 0, "user": {"name": "Alice"}}
</script>

// 客户端：用户点击时才加载对应代码
// 不需要重建组件树，直接恢复状态
```

### 核心差异对比

| 特性 | 水合 (Hydration) | 可恢复性 (Resumability) |
|------|------------------|------------------------|
| **启动时间** | O(n) - 与应用大小成正比 | O(1) - 常数时间 |
| **初始 JS 加载** | 加载所有组件代码 | 几乎为零 |
| **TTI (可交互时间)** | 长，需等待水合完成 | 极短，即时可交互 |
| **状态恢复** | 重新执行创建 | 从 HTML 反序列化 |
| **事件处理** | 水合后绑定 | 按需延迟加载 |

### Qwik 的懒执行

Qwik 通过"懒执行"实现可恢复性：

```tsx
import { component$, useSignal } from '@builder.io/qwik';

// $ 后缀表示该代码可以被懒加载
export const Counter = component$(() => {
  const count = useSignal(0);

  // onClick$ 的代码只有在用户点击时才会加载
  return (
    <button onClick$={() => count.value++}>
      计数: {count.value}
    </button>
  );
});

// 编译后的 HTML（简化）
// <button on:click="./counter_onclick.js">计数: 0</button>
// 点击事件的处理代码被拆分到独立文件
```

## 组件基础

### 创建组件

Qwik 组件使用 `component$` 函数创建：

```tsx
import { component$ } from '@builder.io/qwik';

// 基本组件
export const Greeting = component$(() => {
  return <h1>你好，Qwik！</h1>;
});

// 带 Props 的组件
interface UserCardProps {
  name: string;
  email: string;
  avatar?: string;
}

export const UserCard = component$<UserCardProps>((props) => {
  return (
    <div class="user-card">
      {props.avatar && <img src={props.avatar} alt={props.name} />}
      <h2>{props.name}</h2>
      <p>{props.email}</p>
    </div>
  );
});

// 使用组件
export const App = component$(() => {
  return (
    <main>
      <Greeting />
      <UserCard
        name="张三"
        email="zhangsan@example.com"
        avatar="/avatar.jpg"
      />
    </main>
  );
});
```

### $ 后缀的含义

在 Qwik 中，`$` 后缀是一个重要的约定，表示代码边界可被懒加载：

```tsx
import { component$, $, useSignal } from '@builder.io/qwik';

export const Example = component$(() => {
  const message = useSignal('');

  // $ 函数创建懒加载的闭包
  const handleSubmit = $(() => {
    console.log('表单提交:', message.value);
    // 这段代码只有在调用时才会加载
  });

  // 事件处理使用 $
  return (
    <form onSubmit$={handleSubmit} preventdefault:submit>
      <input
        type="text"
        value={message.value}
        onInput$={(e) => message.value = (e.target as HTMLInputElement).value}
      />
      <button type="submit">提交</button>
    </form>
  );
});
```

### 插槽 (Slots)

```tsx
import { component$, Slot } from '@builder.io/qwik';

// 基本插槽
export const Card = component$(() => {
  return (
    <div class="card">
      <Slot />
    </div>
  );
});

// 命名插槽
export const Layout = component$(() => {
  return (
    <div class="layout">
      <header>
        <Slot name="header" />
      </header>
      <main>
        <Slot /> {/* 默认插槽 */}
      </main>
      <footer>
        <Slot name="footer" />
      </footer>
    </div>
  );
});

// 使用插槽
export const Page = component$(() => {
  return (
    <Layout>
      <div q:slot="header">
        <h1>网站标题</h1>
      </div>

      <p>这是主要内容</p>

      <div q:slot="footer">
        <p>版权所有 2024</p>
      </div>
    </Layout>
  );
});
```

### 组件生命周期

```tsx
import {
  component$,
  useVisibleTask$,
  useTask$,
  useSignal,
  useOnDocument,
  useOnWindow,
  $
} from '@builder.io/qwik';

export const LifecycleDemo = component$(() => {
  const count = useSignal(0);
  const elementRef = useSignal<HTMLDivElement>();

  // useTask$ - 在服务端和客户端都执行
  // 用于响应式副作用
  useTask$(({ track }) => {
    track(() => count.value);
    console.log('count 变化了:', count.value);
  });

  // useVisibleTask$ - 仅在客户端执行
  // 类似于 React 的 useEffect
  useVisibleTask$(() => {
    console.log('组件在客户端可见了');

    // 可以访问浏览器 API
    const width = window.innerWidth;
    console.log('窗口宽度:', width);

    // 返回清理函数
    return () => {
      console.log('组件即将卸载');
    };
  });

  // useVisibleTask$ 带 track - 响应依赖变化
  useVisibleTask$(({ track }) => {
    const currentCount = track(() => count.value);
    console.log('客户端 count:', currentCount);
  });

  // 监听文档事件
  useOnDocument(
    'keydown',
    $((event) => {
      console.log('按键:', (event as KeyboardEvent).key);
    })
  );

  // 监听窗口事件
  useOnWindow(
    'resize',
    $(() => {
      console.log('窗口大小改变');
    })
  );

  return (
    <div ref={elementRef}>
      <p>计数: {count.value}</p>
      <button onClick$={() => count.value++}>增加</button>
    </div>
  );
});
```

## 状态管理

### useSignal - 简单响应式状态

`useSignal` 用于管理简单的响应式值：

```tsx
import { component$, useSignal, useComputed$ } from '@builder.io/qwik';

export const SignalExample = component$(() => {
  // 基本信号
  const count = useSignal(0);
  const name = useSignal<string>(); // 可选值

  // 计算信号 - 派生状态
  const doubleCount = useComputed$(() => count.value * 2);
  const greeting = useComputed$(() =>
    name.value ? `你好，${name.value}！` : '请输入姓名'
  );

  // 懒初始化
  const expensiveValue = useSignal(() => {
    // 只在首次访问时计算
    return Math.random() * 1000;
  });

  return (
    <div>
      <p>计数: {count.value}</p>
      <p>双倍: {doubleCount.value}</p>
      <button onClick$={() => count.value++}>增加</button>
      <button onClick$={() => count.value = 0}>重置</button>

      <hr />

      <input
        value={name.value}
        onInput$={(e) => name.value = (e.target as HTMLInputElement).value}
        placeholder="输入姓名"
      />
      <p>{greeting.value}</p>
    </div>
  );
});
```

### useStore - 复杂响应式状态

`useStore` 用于管理复杂的对象状态，支持深层响应式：

```tsx
import { component$, useStore, useVisibleTask$ } from '@builder.io/qwik';

interface UserData {
  name: string;
  address: {
    street: string;
    city: string;
  };
  tags: string[];
}

export const UserProfile = component$(() => {
  // 深层响应式 store
  const userData = useStore<UserData>({
    name: '张三',
    address: {
      street: '中关村大街1号',
      city: '北京',
    },
    tags: ['开发者', 'Qwik'],
  });

  // 非响应式 store（适合配置等不变数据）
  const config = useStore(
    { theme: 'dark', language: 'zh-CN' },
    { reactive: false }
  );

  // 浅层响应式（只追踪顶层属性）
  const shallowState = useStore(
    { items: [] as string[] },
    { deep: false }
  );

  // 懒初始化
  const lazyState = useStore(() => ({
    data: computeExpensiveData(),
    timestamp: Date.now(),
  }));

  return (
    <div>
      <input
        value={userData.name}
        onInput$={(e) => userData.name = (e.target as HTMLInputElement).value}
      />

      <input
        value={userData.address.city}
        onInput$={(e) => userData.address.city = (e.target as HTMLInputElement).value}
      />

      <button onClick$={() => userData.tags.push('新标签')}>
        添加标签
      </button>

      <p>标签: {userData.tags.join(', ')}</p>
      <p>城市: {userData.address.city}</p>
    </div>
  );
});

function computeExpensiveData() {
  return { computed: 'expensive-result' };
}
```

### Context - 跨组件状态共享

```tsx
import {
  component$,
  createContextId,
  useContextProvider,
  useContext,
  useStore,
  Slot
} from '@builder.io/qwik';

// 1. 创建 Context ID
interface ThemeContext {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ThemeContextId = createContextId<ThemeContext>('theme-context');

// 2. 提供 Context
export const ThemeProvider = component$(() => {
  const themeStore = useStore<ThemeContext>({
    theme: 'light',
    toggleTheme: function() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
    }
  });

  useContextProvider(ThemeContextId, themeStore);

  return (
    <div class={`app theme-${themeStore.theme}`}>
      <Slot />
    </div>
  );
});

// 3. 消费 Context
export const ThemeToggle = component$(() => {
  const theme = useContext(ThemeContextId);

  return (
    <button onClick$={() => theme.toggleTheme()}>
      当前主题: {theme.theme}
      <br />
      点击切换
    </button>
  );
});

// 4. 使用
export const App = component$(() => {
  return (
    <ThemeProvider>
      <header>
        <ThemeToggle />
      </header>
      <main>
        <p>应用内容</p>
      </main>
    </ThemeProvider>
  );
});
```

### useResource$ - 异步数据加载

```tsx
import {
  component$,
  useSignal,
  useResource$,
  Resource
} from '@builder.io/qwik';

interface User {
  id: number;
  name: string;
  email: string;
}

export const UserFetcher = component$(() => {
  const userId = useSignal(1);

  // useResource$ 自动追踪依赖并在变化时重新加载
  const userResource = useResource$<User>(async ({ track, cleanup }) => {
    // 追踪 userId 变化
    const id = track(() => userId.value);

    // 创建 AbortController 用于清理
    const controller = new AbortController();
    cleanup(() => controller.abort());

    // 获取数据
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/users/${id}`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      throw new Error('获取用户失败');
    }

    return response.json();
  });

  return (
    <div>
      <select
        value={userId.value}
        onChange$={(e) => userId.value = parseInt((e.target as HTMLSelectElement).value)}
      >
        {[1, 2, 3, 4, 5].map(id => (
          <option key={id} value={id}>用户 {id}</option>
        ))}
      </select>

      <Resource
        value={userResource}
        onPending={() => <p>加载中...</p>}
        onRejected={(error) => <p>错误: {error.message}</p>}
        onResolved={(user) => (
          <div>
            <h2>{user.name}</h2>
            <p>邮箱: {user.email}</p>
          </div>
        )}
      />
    </div>
  );
});
```

## QwikCity 路由系统

QwikCity 是 Qwik 的元框架，类似于 Next.js 之于 React，提供路由、数据加载、表单处理等功能。

### 基于文件系统的路由

```
src/routes/
├── index.tsx              # /
├── about/
│   └── index.tsx          # /about
├── blog/
│   ├── index.tsx          # /blog
│   └── [slug]/
│       └── index.tsx      # /blog/:slug (动态路由)
├── users/
│   └── [...catchAll]/
│       └── index.tsx      # /users/* (通配符路由)
└── layout.tsx             # 全局布局
```

### 页面组件

```tsx
// src/routes/index.tsx
import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
  return (
    <div>
      <h1>欢迎来到 Qwik</h1>
      <p>这是首页</p>
    </div>
  );
});

// 页面元数据
export const head: DocumentHead = {
  title: '首页 - Qwik 应用',
  meta: [
    {
      name: 'description',
      content: '这是一个 Qwik 应用的首页',
    },
  ],
};
```

### 布局组件

```tsx
// src/routes/layout.tsx
import { component$, Slot } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';

export default component$(() => {
  return (
    <div class="app">
      <header>
        <nav>
          <Link href="/">首页</Link>
          <Link href="/about">关于</Link>
          <Link href="/blog">博客</Link>
        </nav>
      </header>

      <main>
        <Slot /> {/* 子路由内容渲染在这里 */}
      </main>

      <footer>
        <p>版权所有 2024</p>
      </footer>
    </div>
  );
});
```

### 数据加载 (routeLoader$)

```tsx
// src/routes/blog/[slug]/index.tsx
import { component$ } from '@builder.io/qwik';
import { routeLoader$, useLocation } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';

// 定义数据加载器
export const useBlogPost = routeLoader$(async (requestEvent) => {
  const slug = requestEvent.params.slug;

  // 从数据库或 API 获取数据
  const response = await fetch(`https://api.example.com/posts/${slug}`);

  if (!response.ok) {
    // 返回 404
    throw requestEvent.redirect(404, '/not-found');
  }

  const post = await response.json();
  return post;
});

// 获取服务器时间的加载器
export const useServerTime = routeLoader$(() => {
  return new Date().toISOString();
});

export default component$(() => {
  // 使用加载器数据（类型安全）
  const post = useBlogPost();
  const serverTime = useServerTime();
  const location = useLocation();

  return (
    <article>
      <h1>{post.value.title}</h1>
      <p class="meta">
        发布于: {post.value.publishedAt}
        <br />
        服务器时间: {serverTime.value}
        <br />
        当前路径: {location.url.pathname}
      </p>
      <div class="content">{post.value.content}</div>
    </article>
  );
});

// 动态页面元数据
export const head: DocumentHead = ({ resolveValue }) => {
  const post = resolveValue(useBlogPost);
  return {
    title: `${post.title} - 博客`,
    meta: [
      {
        name: 'description',
        content: post.excerpt,
      },
    ],
  };
};
```

### 表单处理 (routeAction$)

```tsx
// src/routes/contact/index.tsx
import { component$ } from '@builder.io/qwik';
import { routeAction$, Form, zod$, z } from '@builder.io/qwik-city';

// 定义验证模式
const contactSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  message: z.string().min(10, '消息至少10个字符'),
});

// 服务端 Action
export const useContactAction = routeAction$(
  async (data, requestEvent) => {
    // data 已经过验证，类型安全
    const { name, email, message } = data;

    try {
      // 发送邮件或保存到数据库
      await fetch('https://api.example.com/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      return {
        success: true,
        message: '消息发送成功！',
      };
    } catch (error) {
      return requestEvent.fail(500, {
        message: '发送失败，请稍后重试',
      });
    }
  },
  zod$(contactSchema)
);

export default component$(() => {
  const action = useContactAction();

  return (
    <div class="contact-form">
      <h1>联系我们</h1>

      <Form action={action}>
        <div class="field">
          <label for="name">姓名</label>
          <input
            type="text"
            id="name"
            name="name"
            required
          />
          {action.value?.fieldErrors?.name && (
            <p class="error">{action.value.fieldErrors.name}</p>
          )}
        </div>

        <div class="field">
          <label for="email">邮箱</label>
          <input
            type="email"
            id="email"
            name="email"
            required
          />
          {action.value?.fieldErrors?.email && (
            <p class="error">{action.value.fieldErrors.email}</p>
          )}
        </div>

        <div class="field">
          <label for="message">消息</label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
          />
          {action.value?.fieldErrors?.message && (
            <p class="error">{action.value.fieldErrors.message}</p>
          )}
        </div>

        <button type="submit" disabled={action.isRunning}>
          {action.isRunning ? '发送中...' : '发送消息'}
        </button>
      </Form>

      {action.value?.success && (
        <div class="success">{action.value.message}</div>
      )}

      {action.value?.failed && (
        <div class="error">{action.value.message}</div>
      )}
    </div>
  );
});
```

### 中间件与服务端函数

```tsx
// src/routes/layout.tsx
import { component$, Slot } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import type { RequestHandler } from '@builder.io/qwik-city';

// 中间件 - 在请求处理前执行
export const onRequest: RequestHandler = async ({
  cookie,
  redirect,
  sharedMap
}) => {
  // 检查认证
  const token = cookie.get('auth_token')?.value;

  if (!token) {
    // 未认证用户重定向到登录页
    throw redirect(302, '/login');
  }

  // 在请求间共享数据
  sharedMap.set('userId', await validateToken(token));
};

// GET 请求处理
export const onGet: RequestHandler = async ({ cacheControl }) => {
  // 设置缓存控制
  cacheControl({
    public: true,
    maxAge: 60,
    staleWhileRevalidate: 60 * 60,
  });
};

// 加载用户数据
export const useUser = routeLoader$(async ({ sharedMap }) => {
  const userId = sharedMap.get('userId');
  // 获取用户详情
  return await fetchUser(userId);
});

export default component$(() => {
  const user = useUser();

  return (
    <div>
      <header>
        <span>欢迎，{user.value.name}</span>
      </header>
      <Slot />
    </div>
  );
});

async function validateToken(token: string) {
  // 验证 token 逻辑
  return 'user-123';
}

async function fetchUser(userId: string) {
  return { name: '张三', id: userId };
}
```

## 优化策略

### 预取策略

```tsx
import { component$ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';

export const Navigation = component$(() => {
  const loc = useLocation();

  return (
    <nav>
      {/* 默认：鼠标悬停时预取 */}
      <Link href="/about">关于</Link>

      {/* 视口可见时预取 */}
      <Link href="/blog" prefetch="viewport">博客</Link>

      {/* 立即预取 */}
      <Link href="/contact" prefetch="immediate">联系</Link>

      {/* 禁用预取 */}
      <Link href="/external" prefetch={false}>外部链接</Link>
    </nav>
  );
});
```

### 图片优化

```tsx
import { component$ } from '@builder.io/qwik';
import { Image } from '@unpic/qwik';

export const OptimizedImages = component$(() => {
  return (
    <div>
      {/* 使用 @unpic/qwik 自动优化 */}
      <Image
        src="https://example.com/image.jpg"
        width={800}
        height={600}
        alt="优化的图片"
        loading="lazy"
        decoding="async"
      />

      {/* 原生懒加载 */}
      <img
        src="/images/hero.jpg"
        width={1200}
        height={800}
        alt="Hero 图片"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
});
```

### 代码分割与懒加载

```tsx
import { component$, useSignal, $ } from '@builder.io/qwik';

export const LazyComponent = component$(() => {
  const showChart = useSignal(false);

  // 懒加载组件
  const loadChart = $(async () => {
    // 动态导入只在需要时加载
    const { Chart } = await import('./heavy-chart');
    showChart.value = true;
  });

  return (
    <div>
      <button onClick$={loadChart}>
        加载图表
      </button>

      {showChart.value && (
        <div>图表组件已加载</div>
      )}
    </div>
  );
});

// 使用 qwik-speak 的懒加载翻译
import { $translate as t } from 'qwik-speak';

export const I18nComponent = component$(() => {
  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <p>{t('welcome.description')}</p>
    </div>
  );
});
```

### useTask$ vs useVisibleTask$

```tsx
import { component$, useSignal, useTask$, useVisibleTask$ } from '@builder.io/qwik';

export const TaskComparison = component$(() => {
  const data = useSignal<string[]>([]);
  const windowWidth = useSignal(0);

  // useTask$ - 服务端和客户端都执行
  // 适合：数据转换、响应式计算、SSR 兼容的副作用
  useTask$(({ track }) => {
    // 这段代码在服务端渲染时也会执行
    console.log('useTask$ 执行');
  });

  // useVisibleTask$ - 仅客户端执行
  // 适合：浏览器 API、DOM 操作、第三方库初始化
  useVisibleTask$(() => {
    // 这段代码只在浏览器中执行
    windowWidth.value = window.innerWidth;

    const handleResize = () => {
      windowWidth.value = window.innerWidth;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  // useVisibleTask$ 带策略
  useVisibleTask$(
    () => {
      // 可见时立即执行
    },
    { strategy: 'intersection-observer' } // 元素可见时执行
  );

  return (
    <div>
      <p>窗口宽度: {windowWidth.value}px</p>
    </div>
  );
});
```

### 服务端渲染优化

```tsx
// src/entry.ssr.tsx
import { renderToStream, type RenderToStreamOptions } from '@builder.io/qwik/server';
import { manifest } from '@qwik-client-manifest';
import Root from './root';

export default function (opts: RenderToStreamOptions) {
  return renderToStream(<Root />, {
    manifest,
    ...opts,
    // 流式渲染配置
    containerAttributes: {
      lang: 'zh-CN',
    },
    // 预取设置
    prefetchStrategy: {
      implementation: {
        linkInsert: 'js-append',
        workerFetchInsert: null,
        prefetchEvent: 'always',
      },
    },
    // 服务工作者预取
    qwikLoader: {
      include: 'auto',
    },
  });
}
```

## 与其他框架对比

### 性能对比

| 指标 | Qwik | Next.js | Nuxt.js | SvelteKit |
|------|------|---------|---------|-----------|
| **TTI (可交互时间)** | O(1) | O(n) | O(n) | O(n) |
| **初始 JS 大小** | ~1KB | 70KB+ | 50KB+ | 20KB+ |
| **首屏加载** | 极快 | 快 | 快 | 很快 |
| **运行时开销** | 极低 | 中等 | 中等 | 低 |

### 开发体验对比

| 特性 | Qwik | React | Vue | Svelte |
|------|------|-------|-----|--------|
| **学习曲线** | 中等 | 中等 | 平缓 | 平缓 |
| **TypeScript 支持** | 优秀 | 优秀 | 良好 | 良好 |
| **生态系统** | 发展中 | 成熟 | 成熟 | 发展中 |
| **工具链** | Vite | 多种 | Vite | Vite |

### 适用场景

**选择 Qwik 的场景：**

- 对首屏性能有极高要求的应用
- 大型复杂应用，传统水合成本过高
- 电商网站、新闻门户等内容密集型站点
- 移动端优先的应用

**可能不适合 Qwik 的场景：**

- 团队缺乏学习新框架的时间
- 需要大量成熟第三方组件库
- 简单的单页应用（SPA）

## 实战案例

### TodoList 应用

```tsx
import { component$, useStore, $ } from '@builder.io/qwik';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export const TodoApp = component$(() => {
  const state = useStore({
    todos: [] as Todo[],
    newTodo: '',
    filter: 'all' as 'all' | 'active' | 'completed',
  });

  const addTodo = $(() => {
    if (state.newTodo.trim()) {
      state.todos.push({
        id: Date.now(),
        text: state.newTodo.trim(),
        completed: false,
      });
      state.newTodo = '';
    }
  });

  const toggleTodo = $((id: number) => {
    const todo = state.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  });

  const removeTodo = $((id: number) => {
    const index = state.todos.findIndex(t => t.id === id);
    if (index > -1) {
      state.todos.splice(index, 1);
    }
  });

  const clearCompleted = $(() => {
    state.todos = state.todos.filter(t => !t.completed);
  });

  const filteredTodos = state.todos.filter(todo => {
    if (state.filter === 'active') return !todo.completed;
    if (state.filter === 'completed') return todo.completed;
    return true;
  });

  const remaining = state.todos.filter(t => !t.completed).length;

  return (
    <div class="todo-app">
      <h1>Todo List</h1>

      <form preventdefault:submit onSubmit$={addTodo}>
        <input
          type="text"
          value={state.newTodo}
          onInput$={(e) => state.newTodo = (e.target as HTMLInputElement).value}
          placeholder="添加新任务..."
        />
        <button type="submit">添加</button>
      </form>

      {state.todos.length > 0 && (
        <>
          <div class="info">
            <span>{remaining} 项未完成</span>
          </div>

          <ul class="todo-list">
            {filteredTodos.map(todo => (
              <li key={todo.id} class={{ completed: todo.completed }}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange$={() => toggleTodo(todo.id)}
                />
                <span>{todo.text}</span>
                <button onClick$={() => removeTodo(todo.id)}>删除</button>
              </li>
            ))}
          </ul>

          <div class="filters">
            <button
              class={{ active: state.filter === 'all' }}
              onClick$={() => state.filter = 'all'}
            >
              全部
            </button>
            <button
              class={{ active: state.filter === 'active' }}
              onClick$={() => state.filter = 'active'}
            >
              未完成
            </button>
            <button
              class={{ active: state.filter === 'completed' }}
              onClick$={() => state.filter = 'completed'}
            >
              已完成
            </button>
            <button onClick$={clearCompleted}>
              清除已完成
            </button>
          </div>
        </>
      )}
    </div>
  );
});
```

### 数据表格组件

```tsx
import { component$, useSignal, useResource$, Resource, $ } from '@builder.io/qwik';

interface User {
  id: number;
  name: string;
  email: string;
  company: { name: string };
}

interface PaginationState {
  page: number;
  limit: number;
}

export const DataTable = component$(() => {
  const pagination = useSignal<PaginationState>({ page: 1, limit: 5 });
  const searchTerm = useSignal('');

  const usersResource = useResource$<User[]>(async ({ track, cleanup }) => {
    const { page, limit } = track(() => pagination.value);
    const search = track(() => searchTerm.value);

    const controller = new AbortController();
    cleanup(() => controller.abort());

    // 模拟搜索延迟
    if (search) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const response = await fetch(
      `https://jsonplaceholder.typicode.com/users?_page=${page}&_limit=${limit}`,
      { signal: controller.signal }
    );

    let users: User[] = await response.json();

    // 客户端过滤
    if (search) {
      users = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    return users;
  });

  const goToPage = $((newPage: number) => {
    pagination.value = { ...pagination.value, page: newPage };
  });

  return (
    <div class="data-table">
      <div class="toolbar">
        <input
          type="search"
          placeholder="搜索用户..."
          value={searchTerm.value}
          onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
        />
      </div>

      <Resource
        value={usersResource}
        onPending={() => (
          <div class="loading">加载中...</div>
        )}
        onRejected={(error) => (
          <div class="error">加载失败: {error.message}</div>
        )}
        onResolved={(users) => (
          <>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>姓名</th>
                  <th>邮箱</th>
                  <th>公司</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.company.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div class="empty">没有找到匹配的用户</div>
            )}
          </>
        )}
      />

      <div class="pagination">
        <button
          disabled={pagination.value.page <= 1}
          onClick$={() => goToPage(pagination.value.page - 1)}
        >
          上一页
        </button>
        <span>第 {pagination.value.page} 页</span>
        <button onClick$={() => goToPage(pagination.value.page + 1)}>
          下一页
        </button>
      </div>
    </div>
  );
});
```

## 面试要点

### 核心概念题

**Q1: 什么是可恢复性(Resumability)？与水合(Hydration)有什么区别？**

答：可恢复性是 Qwik 的核心创新。传统框架的水合需要在客户端重新执行所有组件代码来重建应用状态和事件监听器，时间复杂度为 O(n)。而可恢复性将应用状态序列化到 HTML 中，客户端可以直接"恢复"而无需重新执行，实现 O(1) 的启动时间。关键区别：
- 水合重新执行代码，可恢复性直接读取序列化状态
- 水合必须加载所有组件，可恢复性按需加载
- 水合阻塞交互，可恢复性即时可交互

**Q2: Qwik 中的 $ 后缀是什么意思？**

答：`$` 后缀是 Qwik 的懒加载边界标记。当函数或组件使用 `$` 后缀（如 `component$`、`onClick$`、`$`），Qwik 编译器会将其分割到独立的代码块中。这些代码只有在实际需要时才会被下载和执行，实现了细粒度的代码分割和延迟加载。

**Q3: useSignal 和 useStore 有什么区别？**

答：
- `useSignal`：用于简单的响应式值，访问值需要使用 `.value` 属性，适合原始类型或单一值
- `useStore`：用于复杂的响应式对象，默认深层响应式，支持嵌套对象和数组的自动追踪，直接访问属性即可触发更新

### 实践题

**Q4: QwikCity 中 routeLoader$ 和 routeAction$ 有什么区别？**

答：
- `routeLoader$`：用于在页面渲染前加载数据，类似于 Next.js 的 getServerSideProps。数据在 SSR 时获取，通过 signal 返回给组件
- `routeAction$`：用于处理表单提交等用户触发的服务端操作，支持 Zod 验证，返回操作结果状态

**Q5: 如何在 Qwik 中处理仅客户端的代码？**

答：使用 `useVisibleTask$` 钩子。它只在客户端执行，适合访问浏览器 API（如 window、document）、初始化第三方库、设置事件监听器等。与 `useTask$`（服务端和客户端都执行）不同。

### 进阶题

**Q6: Qwik 如何实现细粒度的代码分割？**

答：Qwik 使用静态分析在编译时识别所有 `$` 边界，将代码拆分成独立的 chunk。每个事件处理器、组件渲染函数都可能成为独立的文件。运行时，Qwik 通过 HTML 中的 `on:click` 等属性记录事件处理器的位置，当用户交互时才下载对应代码。这种方式实现了真正的按需加载。

**Q7: 为什么 Qwik 特别适合大型应用？**

答：
1. **启动时间与应用大小无关**：可恢复性使 TTI 保持 O(1)
2. **自动代码分割**：无需手动配置，编译器自动处理
3. **渐进式下载**：用户交互才触发代码下载
4. **内存效率**：未使用的代码不会被加载到内存
5. **服务端优先**：减少客户端计算负担

## 总结

Qwik 代表了前端框架的一次范式转变，通过可恢复性架构彻底解决了传统 SSR 框架的水合性能瓶颈。其核心创新在于：

1. **零 JS 启动时间**：通过序列化而非重新执行来恢复应用状态
2. **细粒度懒加载**：`$` 后缀实现自动代码分割
3. **O(1) 复杂度**：应用启动时间与大小无关
4. **开发体验友好**：与 React 类似的 JSX 语法，学习成本可控

对于追求极致性能、构建大型复杂应用的团队，Qwik 是一个值得认真考虑的选择。随着生态系统的不断完善，Qwik 正在成为下一代 Web 开发的重要力量。
