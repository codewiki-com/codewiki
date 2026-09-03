---
title: 部分水合与 Islands 架构
description: 掌握 Islands 架构和部分水合模式，构建具有最优 JavaScript 交付的高性能 Web 应用
track: frontend
section: performance
difficulty: intermediate
tags:
  - Islands 架构
  - 部分水合
  - Astro
  - 性能
  - SSR
  - JavaScript
status: imported
origin: old/src/content/docs/frontend/partial-hydration.zh.md
divergence: 0.224
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Frontend
  subcategory: ""
  order: 12
  lastUpdated: 2026-01-21
---

部分水合和 Islands 架构代表了我们思考 Web 应用中 JavaScript 交付方式的范式转变。与其水合整个页面的 JavaScript，这些模式允许我们只在需要的地方选择性地添加交互性，从而显著提高性能和用户体验。本文将从基本原理到高级实现策略深入探索这些概念。

## 概念解释

### 什么是水合（Hydration）？

**水合**是将 JavaScript 事件处理程序和状态附加到服务器渲染的 HTML 标记的过程。在传统的单页面应用（SPA）中，整个页面都被水合，这意味着 JavaScript 接管每个 DOM 元素，即使那些纯粹是静态的元素。

```javascript
// 传统水合（React）
// 服务器发送 HTML，然后客户端水合所有内容
ReactDOM.hydrateRoot(document.getElementById('root'), <App />);
```

### 什么是部分水合？

**部分水合**（也称为"选择性水合"或"渐进式水合"）是一种技术，只有页面的交互部分被 JavaScript 水合，而静态内容保持为纯 HTML。

```javascript
// 部分水合方法
// 服务器发送带有静态内容的 HTML
// 只有特定的交互组件被水合
hydrateIsland('#search-widget', SearchWidget);
hydrateIsland('#cart-button', CartButton);
// Header、footer、文章内容保持为纯 HTML
```

### 什么是 Islands 架构？

**Islands 架构**是一种组件架构模式，将交互式 UI 组件视为静态 HTML "海洋"中的"岛屿"。每个岛屿独立水合并独立运行。

```
+------------------------------------------------------------------+
|                                                                  |
|    静态 HTML（"海洋"）                                            |
|                                                                  |
|    +------------------+        +------------------+               |
|    |    交互式        |        |    交互式        |               |
|    |     岛屿         |        |     岛屿         |               |
|    |   (已水合)       |        |   (已水合)       |               |
|    +------------------+        +------------------+               |
|                                                                  |
|                        静态 HTML                                  |
|                                                                  |
|    +------------------------------------------+                   |
|    |           大型交互式岛屿                   |                   |
|    |              (已水合)                     |                   |
|    +------------------------------------------+                   |
|                                                                  |
|    静态 HTML                                                      |
|                                                                  |
+------------------------------------------------------------------+
```

### 历史与演进

| 年份 | 里程碑 | 意义 |
|------|--------|------|
| 2019 | Jason Miller 创造"Islands"术语 | 原始概念引入 |
| 2020 | Marko.js 部分水合 | 早期实现 |
| 2021 | Astro 0.x 发布 | Islands 架构普及 |
| 2022 | Fresh (Deno) 发布 | 基于 Preact 的 islands |
| 2022 | Qwik 引入可恢复性 | 水合的替代方案 |
| 2023 | Astro 3.0 | View Transitions + Islands |
| 2024 | React Server Components | 互补模式 |
| 2025 | 广泛采用 | 行业标准模式 |

### 传统水合的问题

传统的全页水合有几个问题：

```javascript
// "水合税"
// 对于一个 100KB HTML 的页面...

// 传统 SPA：
// 1. 下载 HTML (100KB)
// 2. 下载 JavaScript 包 (500KB)
// 3. 解析和执行 JavaScript
// 4. 重新渲染整个组件树
// 5. 将事件监听器附加到所有元素
// 6. 页面终于可交互

// 时间线：
// |--HTML--|--JS 下载--|--解析--|--水合--|--可交互
// 0ms      100ms       400ms    600ms    800ms+
```

使用 Islands 架构：

```javascript
// Islands 方法：
// 1. 下载 HTML (100KB)
// 2. 页面立即可用（静态内容可以工作）
// 3. 只下载 islands 的小 JS (50KB)
// 4. 只水合交互式 islands
// 5. 每个 island 独立变得可交互

// 时间线：
// |--HTML--|--可用--|--Island JS--|--Islands 可交互
// 0ms      100ms    150ms         250ms
```

## 核心原理

### Island 独立性

每个 island 独立运行：

```javascript
// Island A（购物车）
// - 有自己的状态
// - 加载自己的 JS 包
// - 可以在交互时水合

// Island B（搜索组件）
// - 完全独立
// - 不同的水合策略
// - 单独的包

// 它们不共享全局状态
// 它们不需要协调
// 一个失败不会影响另一个
```

### 水合策略

不同的 islands 可以使用不同的水合策略：

```astro
<!-- 1. 页面加载时加载（关键交互性） -->
<CartIcon client:load />

<!-- 2. 空闲时加载（后台增强） -->
<RecommendedProducts client:idle />

<!-- 3. 可见时加载（折叠下方） -->
<CommentSection client:visible />

<!-- 4. 交互时加载（用户触发） -->
<VideoPlayer client:click />

<!-- 5. 在特定断点加载 -->
<MobileMenu client:media="(max-width: 768px)" />

<!-- 6. 从不水合（仅静态） -->
<StaticChart />
```

### 组件组合

Islands 可以嵌套但保持隔离：

```astro
<!-- 父 Island -->
<ShoppingCart client:load>
  <!-- 子组件是同一个 island 的一部分 -->
  <CartItems />
  <CartTotal />

  <!-- 这会创建一个单独的 island -->
  <PaymentWidget client:visible />
</ShoppingCart>

<!-- PaymentWidget 单独水合 -->
<!-- 它甚至可以使用不同的框架 -->
```

### 框架无关性

真正的 Islands 架构允许混合框架：

```astro
---
// Astro 组件混合框架
import ReactCounter from './ReactCounter.jsx';
import VueCarousel from './VueCarousel.vue';
import SvelteForm from './SvelteForm.svelte';
import SolidChart from './SolidChart.tsx';
---

<main>
  <h1>多框架页面</h1>

  <!-- 每个使用自己的框架运行时 -->
  <ReactCounter client:load />
  <VueCarousel client:visible />
  <SvelteForm client:idle />
  <SolidChart client:visible />
</main>
```

## 核心要点

### 1. 静态优先渲染

Islands 架构从根本上是静态优先的：

```astro
---
// page.astro - 默认服务器渲染
const posts = await fetchPosts();
---

<html>
  <head>
    <title>博客</title>
  </head>
  <body>
    <header>
      <!-- 静态导航 -->
      <nav>
        <a href="/">首页</a>
        <a href="/about">关于</a>
      </nav>

      <!-- 交互式搜索 island -->
      <SearchWidget client:idle />
    </header>

    <main>
      <!-- 静态内容 - 只是 HTML -->
      {posts.map(post => (
        <article>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
          <!-- 交互式点赞按钮 island -->
          <LikeButton postId={post.id} client:visible />
        </article>
      ))}
    </main>

    <footer>
      <!-- 静态页脚 -->
      <p>版权所有 2026</p>
    </footer>
  </body>
</html>
```

### 2. 客户端指令

控制 islands 何时以及如何水合：

```astro
---
import Component from './Component';
---

<!-- 水合策略 -->

<!-- client:load - 页面加载时立即水合 -->
<Component client:load />

<!-- client:idle - 浏览器空闲时水合 (requestIdleCallback) -->
<Component client:idle />

<!-- client:visible - 组件进入视口时水合 -->
<Component client:visible />

<!-- client:visible 带 rootMargin - 在完全可见之前水合 -->
<Component client:visible={{ rootMargin: "200px" }} />

<!-- client:media - 媒体查询匹配时水合 -->
<Component client:media="(max-width: 768px)" />

<!-- client:only - 跳过 SSR，只在客户端渲染 -->
<Component client:only="react" />
```

### 3. Props 序列化

传递给 islands 的数据必须是可序列化的：

```astro
---
// 这可以工作 - 原始类型和普通对象
const user = { name: "John", age: 30 };
const items = ["apple", "banana"];
const count = 5;
---

<UserCard user={user} client:load />
<ItemList items={items} client:visible />
<Counter initial={count} client:idle />

---
// 这不工作
const fetchUser = async () => { /* ... */ };  // 函数
const date = new Date();  // Date 对象
const map = new Map();  // 复杂类型
---

<!-- 会失败或行为异常 -->
<!-- <Component callback={fetchUser} /> -->
```

### 4. Island 通信

Islands 是隔离的但可以通信：

```javascript
// 方法 1：自定义事件
// island-a.jsx
function IslandA() {
  function sendMessage() {
    window.dispatchEvent(new CustomEvent('island-message', {
      detail: { type: 'update', data: '来自 A 的消息' }
    }));
  }

  return <button onClick={sendMessage}>发送到 B</button>;
}

// island-b.jsx
function IslandB() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handler = (e) => setMessage(e.detail.data);
    window.addEventListener('island-message', handler);
    return () => window.removeEventListener('island-message', handler);
  }, []);

  return <div>消息: {message}</div>;
}

// 方法 2：共享状态存储 (nanostores)
// store.js
import { atom } from 'nanostores';
export const cartItems = atom([]);

// island-a.jsx
import { useStore } from '@nanostores/react';
import { cartItems } from './store';

function AddToCart({ product }) {
  const items = useStore(cartItems);

  function add() {
    cartItems.set([...items, product]);
  }

  return <button onClick={add}>添加</button>;
}

// island-b.jsx
import { useStore } from '@nanostores/react';
import { cartItems } from './store';

function CartCount() {
  const items = useStore(cartItems);
  return <span>购物车: {items.length}</span>;
}
```

### 5. 嵌套 Islands

控制水合层次结构：

```astro
---
import ParentIsland from './ParentIsland';
import ChildIsland from './ChildIsland';
---

<!-- 选项 1：父级水合，子级在其中是静态的 -->
<ParentIsland client:load>
  <StaticContent />
  <!-- 这保持静态，是父级 SSR 的一部分 -->
</ParentIsland>

<!-- 选项 2：具有不同策略的嵌套 islands -->
<ParentIsland client:load>
  <ChildIsland client:visible />
  <!-- 子级在可见时独立水合 -->
</ParentIsland>

<!-- 选项 3：通过 slots 的 Islands -->
<StaticWrapper>
  <InteractiveIsland slot="interactive" client:idle />
</StaticWrapper>
```

## 代码示例

### 完整的 Astro Islands 实现

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Hero from '../components/Hero.astro';
import ProductGrid from '../components/ProductGrid.astro';

// 交互式 islands
import SearchBar from '../components/SearchBar.jsx';
import CartWidget from '../components/CartWidget.jsx';
import NewsletterForm from '../components/NewsletterForm.svelte';
import ProductFilters from '../components/ProductFilters.vue';

const products = await fetch('https://api.example.com/products').then(r => r.json());
---

<Layout title="首页">
  <Header>
    <!-- 搜索：空闲时水合，不关键 -->
    <SearchBar client:idle slot="search" />

    <!-- 购物车：立即水合，对转化至关重要 -->
    <CartWidget client:load slot="cart" />
  </Header>

  <!-- Hero：完全静态 -->
  <Hero />

  <main>
    <section class="products">
      <aside>
        <!-- 筛选器：可见时水合（侧边栏） -->
        <ProductFilters
          categories={products.categories}
          client:visible
        />
      </aside>

      <!-- 产品网格：静态 HTML -->
      <ProductGrid products={products.items} />
    </section>

    <section class="newsletter">
      <!-- 表单：空闲时水合，不紧急 -->
      <h2>订阅我们的新闻通讯</h2>
      <NewsletterForm client:idle />
    </section>
  </main>
</Layout>
```

```jsx
// src/components/SearchBar.jsx
import { useState, useEffect, useRef } from 'react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal
    })
      .then(r => r.json())
      .then(data => setResults(data))
      .catch(() => {});

    return () => controller.abort();
  }, [query]);

  return (
    <div className="search-container">
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder="搜索产品..."
        aria-label="搜索"
      />

      {isOpen && results.length > 0 && (
        <ul className="search-results" role="listbox">
          {results.map(result => (
            <li key={result.id} role="option">
              <a href={`/product/${result.slug}`}>
                <img src={result.thumbnail} alt="" />
                <span>{result.name}</span>
                <span className="price">¥{result.price}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

```jsx
// src/components/CartWidget.jsx
import { useStore } from '@nanostores/react';
import { cartStore, removeFromCart, updateQuantity } from '../stores/cart';
import { useState } from 'react';

export default function CartWidget() {
  const cart = useStore(cartStore);
  const [isOpen, setIsOpen] = useState(false);

  const total = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-widget">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="cart-dropdown"
      >
        <CartIcon />
        <span className="count">{cart.items.length}</span>
      </button>

      {isOpen && (
        <div id="cart-dropdown" className="cart-dropdown">
          <h3>您的购物车</h3>

          {cart.items.length === 0 ? (
            <p>购物车是空的</p>
          ) : (
            <>
              <ul>
                {cart.items.map(item => (
                  <li key={item.id}>
                    <img src={item.image} alt={item.name} />
                    <div className="item-details">
                      <span>{item.name}</span>
                      <span>¥{item.price}</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, e.target.value)}
                    />
                    <button onClick={() => removeFromCart(item.id)}>
                      移除
                    </button>
                  </li>
                ))}
              </ul>
              <div className="cart-total">
                <strong>总计: ¥{total.toFixed(2)}</strong>
              </div>
              <a href="/checkout" className="checkout-btn">
                结账
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.2 14.6l.1-.1L8.3 12h7.4c.8 0 1.5-.4 1.8-1l3.9-7c.2-.3.1-.7-.2-.9-.2-.1-.4-.1-.6 0L17 6H4.2l-.9-2H1v2h2l3.6 7.6-1.4 2.4c-.1.2-.2.5-.2.8 0 1.1.9 2 2 2h12v-2H7.4c-.1 0-.2-.1-.2-.2z" />
    </svg>
  );
}
```

```javascript
// src/stores/cart.js
import { atom } from 'nanostores';

// 持久化购物车存储
function createCartStore() {
  const stored = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem('cart') || '{"items":[]}')
    : { items: [] };

  const store = atom(stored);

  // 持久化更改
  store.subscribe(value => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(value));
    }
  });

  return store;
}

export const cartStore = createCartStore();

export function addToCart(product) {
  const cart = cartStore.get();
  const existing = cart.items.find(item => item.id === product.id);

  if (existing) {
    cartStore.set({
      items: cart.items.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    });
  } else {
    cartStore.set({
      items: [...cart.items, { ...product, quantity: 1 }]
    });
  }
}

export function removeFromCart(productId) {
  const cart = cartStore.get();
  cartStore.set({
    items: cart.items.filter(item => item.id !== productId)
  });
}

export function updateQuantity(productId, quantity) {
  const cart = cartStore.get();
  const qty = parseInt(quantity, 10);

  if (qty <= 0) {
    removeFromCart(productId);
    return;
  }

  cartStore.set({
    items: cart.items.map(item =>
      item.id === productId ? { ...item, quantity: qty } : item
    )
  });
}
```

### Fresh (Deno) Islands 实现

```tsx
// routes/index.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import Counter from "../islands/Counter.tsx";
import SearchWidget from "../islands/SearchWidget.tsx";

interface Product {
  id: string;
  name: string;
  price: number;
}

export const handler: Handlers<Product[]> = {
  async GET(_, ctx) {
    const products = await fetch("https://api.example.com/products")
      .then(r => r.json());
    return ctx.render(products);
  },
};

export default function Home({ data: products }: PageProps<Product[]>) {
  return (
    <div class="container">
      <header>
        <h1>Fresh 商店</h1>
        {/* Island - 只有这个发送 JS */}
        <SearchWidget />
      </header>

      <main>
        {/* 静态产品网格 */}
        <div class="product-grid">
          {products.map(product => (
            <div key={product.id} class="product-card">
              <h2>{product.name}</h2>
              <p>¥{product.price}</p>
              {/* 每个产品的 Island */}
              <Counter initial={0} productId={product.id} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

```tsx
// islands/Counter.tsx
import { useState } from "preact/hooks";

interface CounterProps {
  initial: number;
  productId: string;
}

export default function Counter({ initial, productId }: CounterProps) {
  const [count, setCount] = useState(initial);

  const addToCart = async () => {
    setCount(count + 1);

    // 乐观更新，然后与服务器同步
    await fetch("/api/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity: count + 1 }),
    });
  };

  return (
    <div class="counter">
      <button onClick={() => setCount(Math.max(0, count - 1))}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={addToCart} class="add-to-cart">
        加入购物车
      </button>
    </div>
  );
}
```

## 最佳实践

### 1. 识别交互边界

```javascript
// 错误：将整个页面作为一个 island
<PageComponent client:load>
  <Header />
  <HeroSection />
  <ProductList products={products} />
  <Footer />
</PageComponent>
// 所有 JS 都加载，没有从 islands 获益

// 正确：细粒度的 islands
<Header>
  <SearchBar client:idle />      {/* 交互式 */}
  <CartButton client:load />     {/* 交互式 */}
</Header>
<HeroSection />                  {/* 静态 */}
<ProductList products={products}>  {/* 静态包装器 */}
  {products.map(p => (
    <ProductCard product={p}>
      <AddToCartButton           {/* 交互式 */}
        productId={p.id}
        client:visible
      />
    </ProductCard>
  ))}
</ProductList>
<Footer />                       {/* 静态 */}
```

### 2. 选择适当的水合策略

```javascript
// 关键路径 - 立即加载
<NavigationMenu client:load />  // 导航总是需要
<AuthStatus client:load />       // 用户需要知道登录状态

// 后台增强 - 空闲时加载
<SearchAutocomplete client:idle />  // 好的功能，不关键
<AnalyticsWidget client:idle />     // 跟踪可以等待

// 折叠下方 - 可见时加载
<CommentSection client:visible />    // 用户滚动才能看到
<RelatedProducts client:visible />   // 较低优先级

// 用户触发 - 交互时加载
<VideoPlayer client:click />         // 重型，仅在需要时加载
<ImageGallery client:click />        // 等待用户兴趣

// 响应式 - 基于视口加载
<MobileDrawer client:media="(max-width: 768px)" />
<DesktopSidebar client:media="(min-width: 769px)" />
```

### 3. 最小化 Island 边界

```javascript
// 错误：太多小 islands（每个 island 都有开销）
<div>
  <LikeButton client:visible />
  <ShareButton client:visible />
  <CommentButton client:visible />
  <SaveButton client:visible />
</div>
// 4 个单独的包，4 个水合过程

// 正确：将相关交互分组
<PostActions client:visible>
  <LikeButton />
  <ShareButton />
  <CommentButton />
  <SaveButton />
</PostActions>
// 1 个包，1 个水合过程
```

### 4. 处理加载状态

```astro
---
import HeavyWidget from '../components/HeavyWidget';
---

<!-- 提供有意义的加载状态 -->
<div class="widget-container">
  <HeavyWidget client:visible>
    <!-- JS 加载时显示这个 -->
    <div slot="fallback" class="widget-skeleton">
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
    </div>
  </HeavyWidget>
</div>

<style>
  .widget-skeleton {
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
```

### 5. 优化数据流

```javascript
// 错误：向 islands 传递大量数据
const allProducts = await fetchProducts(); // 1000 个产品

<ProductFilter
  products={allProducts}  // 序列化 1000 个产品！
  client:visible
/>

// 正确：传递最少数据，在 island 中获取
<ProductFilter
  apiEndpoint="/api/products"
  initialFilters={{ category: 'all' }}
  client:visible
/>

// 在 island 中：
function ProductFilter({ apiEndpoint, initialFilters }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(apiEndpoint)
      .then(r => r.json())
      .then(setProducts);
  }, []);

  // ...
}
```

## 常见陷阱

### 1. 过度水合

```javascript
// 错误：将所有东西都设为交互式"以防万一"
<Header client:load>        {/* 静态 header 不需要 JS */}
  <Logo />
  <Navigation />
</Header>

// 正确：只水合需要交互性的内容
<Header>
  <Logo />
  <Navigation />
  <SearchButton client:idle />    {/* 实际交互式 */}
  <CartDropdown client:load />    {/* 实际交互式 */}
</Header>
```

### 2. Props 序列化问题

```javascript
// 错误：传递不可序列化的数据
const clickHandler = () => console.log('clicked');
// 不能向 islands 传递函数！

// 正确：在 island 中定义处理程序
// MyIsland.jsx
function MyIsland() {
  const handleClick = () => console.log('clicked');
  return <button onClick={handleClick}>点击我</button>;
}
```

### 3. 状态同步问题

```javascript
// 错误：期望 islands 共享 React 状态
<CartCount client:load />     {/* Island A */}
<CartDrawer client:visible />  {/* Island B */}
// 默认情况下它们不共享状态！

// 正确：使用外部状态管理
// store.js
import { atom } from 'nanostores';
export const cartCount = atom(0);

// 两个 islands 都导入并使用相同的 store
import { useStore } from '@nanostores/react';
import { cartCount } from './store';
```

### 4. 缺少 SSR 回退

```javascript
// 错误：JS 加载之前没有内容
<VideoPlayer client:visible />
// 用户在 island 水合之前什么都看不到

// 正确：提供 SSR 回退
<VideoPlayer client:visible>
  <img
    slot="placeholder"
    src={video.thumbnail}
    alt={video.title}
  />
  <p>点击播放视频</p>
</VideoPlayer>
```

### 5. 水合不匹配

```javascript
// 错误：服务器/客户端之间不同的动态内容
function DateDisplay() {
  // 这在服务器和客户端会不同！
  return <span>{new Date().toLocaleString()}</span>;
}

// 正确：使用一致的数据或仅客户端渲染
function DateDisplay({ timestamp }) {
  const [date, setDate] = useState(timestamp);

  useEffect(() => {
    // 水合后更新为本地时间
    setDate(new Date(timestamp).toLocaleString());
  }, [timestamp]);

  return <span>{date}</span>;
}
```

## 性能考量

### 包大小分析

```javascript
// 跟踪每个 island 的包大小
// astro.config.mjs
export default defineConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 为每个 island 创建单独的 chunk
            if (id.includes('islands/')) {
              const name = id.split('islands/')[1].split('.')[0];
              return `island-${name}`;
            }
          }
        }
      }
    }
  }
});
```

### 延迟加载重型依赖

```javascript
// 错误：在顶层导入重型库
import Chart from 'chart.js';  // 60KB

function ChartIsland({ data }) {
  return <Chart data={data} />;
}

// 正确：需要时延迟加载
function ChartIsland({ data }) {
  const [Chart, setChart] = useState(null);

  useEffect(() => {
    import('chart.js').then(module => {
      setChart(() => module.default);
    });
  }, []);

  if (!Chart) {
    return <div className="chart-skeleton">加载图表中...</div>;
  }

  return <Chart data={data} />;
}
```

### 测量 Island 性能

```javascript
// Islands 的性能监控
function withPerformanceTracking(IslandComponent, name) {
  return function TrackedIsland(props) {
    useEffect(() => {
      // 标记水合完成
      performance.mark(`island-${name}-hydrated`);

      // 测量从页面加载的时间
      performance.measure(
        `island-${name}-hydration-time`,
        'navigationStart',
        `island-${name}-hydrated`
      );

      // 报告到分析
      const measure = performance.getEntriesByName(
        `island-${name}-hydration-time`
      )[0];

      console.log(`Island ${name} 在 ${measure.duration}ms 内水合`);
    }, []);

    return <IslandComponent {...props} />;
  };
}

// 使用
export default withPerformanceTracking(SearchBar, 'search-bar');
```

## 实战场景

### 电商产品页面

```astro
---
// pages/product/[slug].astro
import Layout from '../../layouts/Layout.astro';
import ProductImages from '../../components/ProductImages.astro';
import ProductInfo from '../../components/ProductInfo.astro';

// Islands
import ImageZoom from '../../islands/ImageZoom';
import AddToCart from '../../islands/AddToCart';
import SizeSelector from '../../islands/SizeSelector';
import Reviews from '../../islands/Reviews';
import RecentlyViewed from '../../islands/RecentlyViewed';

const { slug } = Astro.params;
const product = await getProduct(slug);
---

<Layout title={product.name}>
  <main class="product-page">
    <section class="product-main">
      <!-- 带缩放的图片画廊 -->
      <div class="images">
        <ProductImages images={product.images}>
          <ImageZoom
            images={product.images}
            client:visible
            slot="interactive"
          />
        </ProductImages>
      </div>

      <!-- 产品详情 -->
      <div class="details">
        <ProductInfo product={product} />

        <!-- 尺码选择 - 交互式 -->
        <SizeSelector
          sizes={product.sizes}
          client:load
        />

        <!-- 加入购物车 - 关键，立即加载 -->
        <AddToCart
          productId={product.id}
          price={product.price}
          client:load
        />
      </div>
    </section>

    <!-- 评论 - 折叠下方，可见时加载 -->
    <section class="reviews">
      <Reviews
        productId={product.id}
        client:visible
      />
    </section>

    <!-- 最近浏览 - 最低优先级 -->
    <section class="recently-viewed">
      <RecentlyViewed client:idle />
    </section>
  </main>
</Layout>
```

## 面试要点

### 基础概念

**Q1：传统水合和部分水合有什么区别？**

传统水合将 JavaScript 附加到整个页面，重新渲染所有组件并在所有地方附加事件处理程序。部分水合只水合特定的交互组件（"islands"），而静态内容保持为纯 HTML。

关键区别：
- **包大小**：部分水合发送更少的 JS（仅用于 islands）
- **可交互时间**：Islands 可以独立变得可交互
- **内存使用**：更少的 React/框架开销
- **静态内容**：保持为纯 HTML，对 SEO 更好

**Q2：解释 Islands 架构及其好处。**

Islands 架构将交互式 UI 组件视为静态 HTML "海洋"中的隔离"岛屿"。每个岛屿：
- 独立水合
- 可以使用不同的框架
- 有自己的水合策略
- 优雅地失败（一个岛屿失败不会破坏其他的）

好处：
- 更好的性能（只发送必要的 JS）
- 渐进增强友好
- 框架无关
- 改进的 Core Web Vitals

**Q3：有哪些不同的水合策略，何时使用每种？**

| 策略 | 用例 | 示例 |
|------|------|------|
| `client:load` | 关键交互性 | 认证按钮、主导航 |
| `client:idle` | 后台增强 | 分析、非紧急功能 |
| `client:visible` | 折叠下方内容 | 评论、相关产品 |
| `client:media` | 响应式功能 | 移动菜单 |
| `client:only` | 仅客户端功能 | WebGL、不需要 SSR 回退 |

### 实践问题

**Q4：Islands 如何相互通信？**

由于 islands 是隔离的，它们通过以下方式通信：
1. **自定义事件**：`window.dispatchEvent(new CustomEvent(...))`
2. **共享存储**：像 nanostores 这样的库可以跨 islands 工作
3. **URL 状态**：用于可共享状态的查询参数
4. **localStorage/sessionStorage**：持久化共享状态

**Q5：Islands 架构的限制是什么？**

1. **状态管理**：islands 之间没有共享的 React 上下文
2. **Props 序列化**：只能传递可序列化的数据
3. **增加复杂性**：需要管理更多边界
4. **初始学习曲线**：与 SPAs 不同的思维模式

**Q6：Islands 架构与 React Server Components 相比如何？**

| 方面 | Islands | RSC |
|------|---------|-----|
| 单元 | 组件 | 组件 |
| 水合 | 选择性 | 选择性（客户端组件） |
| 框架 | 框架无关 | 仅 React |
| 数据流 | 仅 Props | 可以直接传递服务器数据 |
| 流式传输 | 有限 | 完全支持 |
| 嵌套 | 有限 | 完全支持 |

## 延伸阅读

### 官方文档

- [Astro Islands](https://docs.astro.build/en/concepts/islands/) - 官方 Astro 指南
- [Fresh Islands](https://fresh.deno.dev/docs/concepts/islands) - Deno Fresh 文档
- [Marko 部分水合](https://markojs.com/docs/hydration/) - Marko.js 方法

### 概念文章

- [Islands 架构](https://jasonformat.com/islands-architecture/) - Jason Miller 的原始文章
- [部分水合](https://www.patterns.dev/posts/partial-hydration) - patterns.dev 指南
- [JavaScript 的成本](https://web.dev/articles/cost-of-javascript-2019) - 为什么这很重要

### 框架比较

- [Astro vs Next.js](https://docs.astro.build/en/guides/migrate-to-astro/) - 迁移指南
- [Islands vs SPAs](https://www.builder.io/blog/islands-architecture) - Builder.io 分析

### 相关模式

- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023) - 互补模式
- [Qwik 可恢复性](https://qwik.builder.io/docs/concepts/resumable/) - 替代方法
- [渐进式水合](https://www.patterns.dev/posts/progressive-hydration) - 相关概念

---

部分水合和 Islands 架构代表了我们思考 Web 上 JavaScript 交付方式的根本性转变。通过将交互性视为静态内容海洋中的岛屿，我们可以在保持丰富用户体验的同时显著提高性能。随着 Web 平台的持续发展，这些模式将变得越来越重要，用于构建快速、可访问和可维护的 Web 应用。
