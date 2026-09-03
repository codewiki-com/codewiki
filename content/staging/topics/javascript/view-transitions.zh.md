---
title: View Transitions API 视图过渡
description: 深入掌握 View Transitions API，在 Web 应用中创建流畅的原生级页面过渡和动画效果
track: javascript
section: browser
difficulty: intermediate
tags:
  - View Transitions
  - CSS
  - 动画
  - SPA
  - MPA
  - 导航
  - 用户体验
status: imported
origin: old/src/content/docs/frontend/view-transitions.zh.md
divergence: 0.218
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Frontend
  subcategory: ""
  order: 10
  lastUpdated: 2026-01-21
---

View Transitions API 代表了我们处理 Web 页面过渡和 UI 状态变化方式的范式转变。它提供了一种原生的、声明式的方式来创建 DOM 状态之间的平滑动画过渡，无需复杂的 JavaScript 动画库或 CSS 技巧。本文将从基本概念到高级实现模式，深入探索这个 API。

## 概念解释

### 什么是 View Transitions API？

**View Transitions API** 是一种浏览器原生机制，用于在网页的不同视图或状态之间创建动画过渡。它会捕获前后状态的视觉快照，然后使用 CSS 动画在两者之间进行动画切换。

```javascript
// 基本视图过渡
document.startViewTransition(() => {
  // 更新 DOM
  updatePageContent();
});
```

该 API 的工作原理：
1. 捕获当前页面状态的截图
2. 允许你进行 DOM 更改
3. 捕获新状态的截图
4. 创建伪元素在两个状态之间进行动画

### 历史与演进

| 年份 | 里程碑 | 意义 |
|------|--------|------|
| 2021 | 初始提案 | Google 提出"共享元素过渡" |
| 2022 | 更名为 View Transitions | 范围扩展到共享元素之外 |
| 2023 | Chrome 111 发布 SPA 支持 | 首个浏览器实现 |
| 2023 | 提出跨文档过渡 | MPA（多页面应用）支持 |
| 2024 | Safari 开始实现 | 更广泛的浏览器支持 |
| 2025 | MPA 支持广泛可用 | 完整的跨文档过渡 |
| 2026 | CSS-only 触发标准化 | 无需 JS 的声明式过渡 |

### 它解决的问题

在 View Transitions 之前，创建平滑的页面过渡需要复杂的手动工作：

```javascript
// 传统方法 - 复杂且容易出错
async function navigateWithTransition(url) {
  // 1. 手动跟踪要动画的元素
  const oldCard = document.querySelector('.card');
  const oldRect = oldCard.getBoundingClientRect();

  // 2. 获取新内容
  const response = await fetch(url);
  const data = await response.json();

  // 3. 克隆旧元素用于动画
  const clone = oldCard.cloneNode(true);
  clone.style.position = 'fixed';
  clone.style.top = oldRect.top + 'px';
  clone.style.left = oldRect.left + 'px';
  document.body.appendChild(clone);

  // 4. 安全地更新 DOM
  renderNewContent(data);

  // 5. 找到新元素位置
  const newCard = document.querySelector('.card');
  const newRect = newCard.getBoundingClientRect();

  // 6. 将克隆动画到新位置
  clone.animate([
    { top: oldRect.top + 'px', left: oldRect.left + 'px' },
    { top: newRect.top + 'px', left: newRect.left + 'px' }
  ], { duration: 300 });

  // 7. 清理
  setTimeout(() => clone.remove(), 300);
}
```

使用 View Transitions：

```javascript
// View Transitions 方法 - 简单且声明式
async function navigateWithTransition(url) {
  const response = await fetch(url);
  const data = await response.json();

  document.startViewTransition(() => {
    renderNewContent(data);
  });
}
```

### 两种类型的视图过渡

**1. 同文档过渡（SPA）**
- 通过 JavaScript `document.startViewTransition()` 触发
- 用于单页面应用中的客户端导航
- 完全控制过渡的时机和方式

**2. 跨文档过渡（MPA）**
- 在导航期间自动触发
- 通过 CSS `@view-transition` 规则启用
- 适用于传统的多页面网站

## 核心原理

### 过渡生命周期

```
+-------------------------------------------------------------+
|                      视图过渡生命周期                          |
+-------------------------------------------------------------+
|                                                              |
|  1. 捕获旧状态                                                |
|     +-- 浏览器截取当前 DOM 的屏幕截图                          |
|     +-- 捕获带有 view-transition-name 的元素                   |
|     +-- 创建 ::view-transition-old() 伪元素                    |
|                                                              |
|  2. 更新回调                                                  |
|     +-- 你的 DOM 更新代码运行                                  |
|     +-- 可以是同步或异步的                                     |
|                                                              |
|  3. 捕获新状态                                                |
|     +-- 浏览器截取新 DOM 的屏幕截图                            |
|     +-- 创建 ::view-transition-new() 伪元素                    |
|     +-- 通过 view-transition-name 匹配元素                     |
|                                                              |
|  4. 动画                                                      |
|     +-- 默认：旧和新之间的交叉淡化                              |
|     +-- 可以应用自定义 CSS 动画                                |
|     +-- 伪元素被动画化                                         |
|                                                              |
|  5. 清理                                                      |
|     +-- 移除伪元素                                            |
|     +-- 新 DOM 状态可见                                        |
|                                                              |
+-------------------------------------------------------------+
```

### 伪元素树结构

当视图过渡运行时，浏览器创建一个伪元素树：

```
::view-transition
+-- ::view-transition-group(root)
|   +-- ::view-transition-image-pair(root)
|       +-- ::view-transition-old(root)
|       +-- ::view-transition-new(root)
+-- ::view-transition-group(header)
|   +-- ::view-transition-image-pair(header)
|       +-- ::view-transition-old(header)
|       +-- ::view-transition-new(header)
+-- ::view-transition-group(card)
    +-- ::view-transition-image-pair(card)
        +-- ::view-transition-old(card)
        +-- ::view-transition-new(card)
```

每个命名元素都有自己的组，允许独立的动画。

### ViewTransition 对象

```javascript
const transition = document.startViewTransition(updateCallback);

// 属性和方法
transition.ready      // Promise - 伪元素创建后解析
transition.finished   // Promise - 动画完成后解析
transition.updateCallbackDone  // Promise - 回调完成后解析
transition.skipTransition()    // 取消动画，立即应用更改
```

### 视图过渡名称

`view-transition-name` CSS 属性对于跨状态识别元素至关重要：

```css
/* 为元素分配唯一名称 */
.header {
  view-transition-name: header;
}

.hero-image {
  view-transition-name: hero;
}

.card {
  view-transition-name: card;
}

/* 名称必须在每个过渡中唯一 */
/* 重复的名称会导致过渡失败 */
```

## 核心要点

### 1. 基本的同文档过渡

```javascript
// 带过渡的简单内容交换
function updateContent(newContent) {
  if (!document.startViewTransition) {
    // 不支持浏览器的回退
    renderContent(newContent);
    return;
  }

  document.startViewTransition(() => {
    renderContent(newContent);
  });
}
```

### 2. 异步更新回调

```javascript
// 用于数据获取的异步过渡
async function navigateTo(url) {
  const transition = document.startViewTransition(async () => {
    const response = await fetch(url);
    const data = await response.json();
    renderPage(data);
  });

  // 等待特定阶段
  await transition.ready;
  console.log('伪元素已创建，动画开始');

  await transition.finished;
  console.log('过渡完成');
}
```

### 3. 跨文档过渡（MPA）

启用页面加载之间的过渡：

```css
/* 在源页面和目标页面都启用 */
@view-transition {
  navigation: auto;
}

/* 可选地，指定过渡类型 */
@view-transition {
  navigation: auto;
  types: slide, fade;
}
```

```html
<!-- 源页面：page1.html -->
<style>
  @view-transition { navigation: auto; }
  .hero { view-transition-name: hero; }
</style>
<img class="hero" src="image.jpg">
<a href="page2.html">查看详情</a>

<!-- 目标页面：page2.html -->
<style>
  @view-transition { navigation: auto; }
  .hero-large { view-transition-name: hero; }
</style>
<img class="hero-large" src="image.jpg">
```

### 4. 自定义动画

```css
/* 默认过渡（交叉淡化） */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}

/* 滑动动画 */
@keyframes slide-out {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}

@keyframes slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

::view-transition-old(root) {
  animation: slide-out 0.3s ease-out;
}

::view-transition-new(root) {
  animation: slide-in 0.3s ease-out;
}
```

### 5. 过渡类型

```javascript
// 为条件样式指定过渡类型
const transition = document.startViewTransition({
  update: updateDOM,
  types: ['slide-left']
});
```

```css
/* 根据过渡类型应用样式 */
html:active-view-transition-type(slide-left) {
  &::view-transition-old(root) {
    animation-name: slide-out-left;
  }
  &::view-transition-new(root) {
    animation-name: slide-in-left;
  }
}

html:active-view-transition-type(slide-right) {
  &::view-transition-old(root) {
    animation-name: slide-out-right;
  }
  &::view-transition-new(root) {
    animation-name: slide-in-right;
  }
}
```

## 代码示例

### 带视图过渡的 SPA 路由

```javascript
// router.js - 带视图过渡的 SPA 路由
class ViewTransitionRouter {
  constructor(options = {}) {
    this.routes = new Map();
    this.currentPath = window.location.pathname;
    this.defaultTransition = options.defaultTransition || 'fade';

    // 处理浏览器后退/前进
    window.addEventListener('popstate', (e) => {
      this.navigate(window.location.pathname, {
        updateHistory: false,
        direction: e.state?.direction || 'back'
      });
    });

    // 拦截链接点击
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href && link.origin === window.location.origin) {
        e.preventDefault();
        this.navigate(link.pathname, {
          transition: link.dataset.transition
        });
      }
    });
  }

  route(path, handler) {
    this.routes.set(path, handler);
    return this;
  }

  async navigate(path, options = {}) {
    const {
      updateHistory = true,
      direction = 'forward',
      transition = this.defaultTransition
    } = options;

    const handler = this.routes.get(path) || this.routes.get('*');
    if (!handler) {
      console.error(`未找到路径 ${path} 的路由`);
      return;
    }

    // 根据方向确定过渡类型
    const transitionType = direction === 'back' ?
      `${transition}-reverse` : transition;

    // 检查视图过渡支持
    if (!document.startViewTransition) {
      await handler();
      if (updateHistory) {
        history.pushState({ direction: 'forward' }, '', path);
      }
      this.currentPath = path;
      return;
    }

    // 执行视图过渡
    const viewTransition = document.startViewTransition({
      update: async () => {
        await handler();
      },
      types: [transitionType]
    });

    // 过渡准备好后更新历史
    viewTransition.ready.then(() => {
      if (updateHistory) {
        history.pushState({ direction: 'forward' }, '', path);
      }
      this.currentPath = path;
    });

    return viewTransition.finished;
  }
}

// 使用
const router = new ViewTransitionRouter({
  defaultTransition: 'slide'
});

router
  .route('/', async () => {
    const content = await loadHomePage();
    document.querySelector('#app').textContent = '';
    document.querySelector('#app').appendChild(content);
  })
  .route('/about', async () => {
    const content = await loadAboutPage();
    document.querySelector('#app').textContent = '';
    document.querySelector('#app').appendChild(content);
  });
```

```css
/* router-transitions.css */

/* 基本过渡设置 */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.35s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* 淡入淡出过渡 */
@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

html:active-view-transition-type(fade) {
  &::view-transition-old(root) {
    animation-name: fade-out;
  }
  &::view-transition-new(root) {
    animation-name: fade-in;
  }
}

/* 滑动过渡 */
@keyframes slide-out-to-left {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-30%); opacity: 0; }
}

@keyframes slide-in-from-right {
  from { transform: translateX(30%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slide-out-to-right {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(30%); opacity: 0; }
}

@keyframes slide-in-from-left {
  from { transform: translateX(-30%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

html:active-view-transition-type(slide) {
  &::view-transition-old(root) {
    animation-name: slide-out-to-left;
  }
  &::view-transition-new(root) {
    animation-name: slide-in-from-right;
  }
}

html:active-view-transition-type(slide-reverse) {
  &::view-transition-old(root) {
    animation-name: slide-out-to-right;
  }
  &::view-transition-new(root) {
    animation-name: slide-in-from-left;
  }
}
```

### 共享元素过渡

```javascript
// 产品卡片到详情页的过渡
class ProductGallery {
  constructor(container) {
    this.container = container;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.container.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      if (card) {
        this.openProductDetail(card);
      }
    });
  }

  async openProductDetail(card) {
    const productId = card.dataset.productId;
    const productData = await this.fetchProduct(productId);

    // 为点击的卡片分配 view-transition-name
    card.style.viewTransitionName = 'product-hero';

    const transition = document.startViewTransition(async () => {
      // 渲染详情视图
      this.renderDetailView(productData);

      // 为详情图片分配相同的名称
      const detailImage = this.container.querySelector('.detail-hero');
      detailImage.style.viewTransitionName = 'product-hero';
    });

    await transition.finished;

    // 清理过渡名称
    const detailImage = this.container.querySelector('.detail-hero');
    if (detailImage) {
      detailImage.style.viewTransitionName = '';
    }
  }

  async closeProductDetail() {
    const detailImage = this.container.querySelector('.detail-hero');
    const productId = detailImage?.dataset.productId;

    if (detailImage) {
      detailImage.style.viewTransitionName = 'product-hero';
    }

    const transition = document.startViewTransition(async () => {
      await this.renderGallery();

      // 找到并命名原始卡片
      const card = this.container.querySelector(
        `.product-card[data-product-id="${productId}"]`
      );
      if (card) {
        card.style.viewTransitionName = 'product-hero';
      }
    });

    await transition.finished;

    // 清理
    const card = this.container.querySelector(
      `.product-card[data-product-id="${productId}"]`
    );
    if (card) {
      card.style.viewTransitionName = '';
    }
  }

  renderDetailView(product) {
    const detail = document.createElement('div');
    detail.className = 'product-detail';

    const backBtn = document.createElement('button');
    backBtn.className = 'back-button';
    backBtn.textContent = '返回';
    backBtn.onclick = () => this.closeProductDetail();

    const img = document.createElement('img');
    img.className = 'detail-hero';
    img.src = product.image;
    img.alt = product.name;
    img.dataset.productId = product.id;

    const title = document.createElement('h1');
    title.textContent = product.name;

    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = `$${product.price}`;

    const desc = document.createElement('p');
    desc.className = 'description';
    desc.textContent = product.description;

    detail.appendChild(backBtn);
    detail.appendChild(img);
    detail.appendChild(title);
    detail.appendChild(price);
    detail.appendChild(desc);

    this.container.textContent = '';
    this.container.appendChild(detail);
  }
}
```

```css
/* 共享元素过渡样式 */
.product-card {
  /* 将动态分配 view-transition-name */
}

.detail-hero {
  /* 将动态分配 view-transition-name */
}

/* 自定义共享元素动画 */
::view-transition-group(product-hero) {
  animation-duration: 0.4s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* 旧和新图片在容器变形时交叉淡化 */
::view-transition-old(product-hero),
::view-transition-new(product-hero) {
  animation: none;
  mix-blend-mode: normal;
}

/* 在过渡期间保持纵横比 */
::view-transition-image-pair(product-hero) {
  isolation: isolate;
}
```

### React 集成

```jsx
// useViewTransition.js - 用于视图过渡的 React hook
import { useCallback, useRef } from 'react';

export function useViewTransition() {
  const transitionRef = useRef(null);

  const startTransition = useCallback((callback, options = {}) => {
    // 如果不支持视图过渡则跳过
    if (!document.startViewTransition) {
      callback();
      return Promise.resolve();
    }

    // 如果已经在过渡中则跳过
    if (transitionRef.current) {
      callback();
      return Promise.resolve();
    }

    const transition = document.startViewTransition({
      update: callback,
      types: options.types || []
    });

    transitionRef.current = transition;

    transition.finished.finally(() => {
      transitionRef.current = null;
    });

    return transition.finished;
  }, []);

  const skipTransition = useCallback(() => {
    transitionRef.current?.skipTransition();
  }, []);

  return { startTransition, skipTransition };
}

// ViewTransitionLink.jsx
import { useNavigate } from 'react-router-dom';
import { useViewTransition } from './useViewTransition';

export function ViewTransitionLink({
  to,
  children,
  transitionTypes = [],
  className,
  ...props
}) {
  const navigate = useNavigate();
  const { startTransition } = useViewTransition();

  const handleClick = (e) => {
    e.preventDefault();

    startTransition(() => {
      navigate(to);
    }, { types: transitionTypes });
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </a>
  );
}

// 在组件中使用
function ProductCard({ product }) {
  return (
    <article
      className="product-card"
      style={{ viewTransitionName: `product-${product.id}` }}
    >
      <img
        src={product.image}
        alt={product.name}
        style={{ viewTransitionName: `product-image-${product.id}` }}
      />
      <h3>{product.name}</h3>
      <ViewTransitionLink
        to={`/product/${product.id}`}
        transitionTypes={['product-detail']}
      >
        查看详情
      </ViewTransitionLink>
    </article>
  );
}
```

### Vue 集成

```vue
<!-- ViewTransitionRouter.vue -->
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isTransitioning = ref(false);

function navigate(to, transitionType = 'fade') {
  if (!document.startViewTransition) {
    router.push(to);
    return;
  }

  const transition = document.startViewTransition({
    update: () => {
      router.push(to);
    },
    types: [transitionType]
  });

  isTransitioning.value = true;

  transition.finished.then(() => {
    isTransitioning.value = false;
  });
}

// 暴露给模板
defineExpose({ navigate, isTransitioning });
</script>

<template>
  <slot :navigate="navigate" :isTransitioning="isTransitioning" />
</template>
```

```vue
<!-- ProductGallery.vue -->
<script setup>
import { ref } from 'vue';

const props = defineProps({
  products: Array
});

const selectedProduct = ref(null);

function selectProduct(product, event) {
  const card = event.currentTarget;

  // 在点击的卡片上设置 view-transition-name
  card.style.viewTransitionName = 'selected-product';

  if (!document.startViewTransition) {
    selectedProduct.value = product;
    return;
  }

  const transition = document.startViewTransition(() => {
    selectedProduct.value = product;
  });

  transition.finished.then(() => {
    card.style.viewTransitionName = '';
  });
}

function closeDetail() {
  if (!document.startViewTransition) {
    selectedProduct.value = null;
    return;
  }

  document.startViewTransition(() => {
    selectedProduct.value = null;
  });
}
</script>

<template>
  <div class="gallery">
    <div v-if="!selectedProduct" class="product-grid">
      <article
        v-for="product in products"
        :key="product.id"
        class="product-card"
        @click="selectProduct(product, $event)"
      >
        <img :src="product.image" :alt="product.name">
        <h3>{{ product.name }}</h3>
        <p>{{ product.price }}</p>
      </article>
    </div>

    <div v-else class="product-detail" style="view-transition-name: selected-product">
      <button @click="closeDetail">返回</button>
      <img :src="selectedProduct.image" :alt="selectedProduct.name">
      <h1>{{ selectedProduct.name }}</h1>
      <p>{{ selectedProduct.description }}</p>
    </div>
  </div>
</template>

<style scoped>
::view-transition-group(selected-product) {
  animation-duration: 0.3s;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.product-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.product-card:hover {
  transform: scale(1.02);
}
</style>
```

## 最佳实践

### 1. 渐进增强

始终为不支持的浏览器提供回退：

```javascript
// 功能检测包装器
function transitionTo(updateFn, options = {}) {
  // 检查支持
  if (!document.startViewTransition) {
    updateFn();
    return Promise.resolve();
  }

  // 检查用户偏好
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    updateFn();
    return Promise.resolve();
  }

  return document.startViewTransition({
    update: updateFn,
    types: options.types || []
  }).finished;
}
```

### 2. 唯一的视图过渡名称

```javascript
// 通过动态分配避免重复名称
function setTransitionNames(elements, prefix) {
  elements.forEach((el, index) => {
    el.style.viewTransitionName = `${prefix}-${index}`;
  });
}

function clearTransitionNames(elements) {
  elements.forEach(el => {
    el.style.viewTransitionName = '';
  });
}

// 使用
const cards = document.querySelectorAll('.card');
setTransitionNames(cards, 'card');

document.startViewTransition(() => {
  // DOM 更新
}).finished.then(() => {
  clearTransitionNames(cards);
});
```

### 3. 无障碍考虑

```css
/* 尊重用户动效偏好 */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.001s !important;
  }
}

/* 确保过渡期间内容保持可访问 */
::view-transition-old(root),
::view-transition-new(root) {
  /* 避免可能降低对比度的混合模式 */
  mix-blend-mode: normal;
}
```

```javascript
// 程序化检查
function shouldAnimate() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

### 4. 注重性能的动画

```css
/* 使用 GPU 加速的属性 */
::view-transition-old(root),
::view-transition-new(root) {
  /* 好 - GPU 加速 */
  animation-name: transform-fade;
}

@keyframes transform-fade {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(-20px) scale(0.98);
  }
}

/* 避免动画布局属性 */
@keyframes bad-animation {
  /* 坏 - 触发布局 */
  from { width: 100%; }
  to { width: 0; }
}
```

### 5. 错误处理

```javascript
async function safeTransition(updateFn) {
  if (!document.startViewTransition) {
    try {
      await updateFn();
    } catch (error) {
      console.error('更新失败:', error);
    }
    return;
  }

  const transition = document.startViewTransition(updateFn);

  try {
    await transition.updateCallbackDone;
  } catch (error) {
    console.error('更新回调失败:', error);
    // 过渡仍将完成，无论存在什么状态
  }

  try {
    await transition.finished;
  } catch (error) {
    // 过渡被跳过或失败
    console.warn('过渡未完成:', error);
  }
}
```

## 常见陷阱

### 1. 重复的视图过渡名称

```javascript
// 错误 - 多个元素有相同的名称
document.querySelectorAll('.card').forEach(card => {
  card.style.viewTransitionName = 'card'; // 所有卡片有相同的名称！
});
// 结果：过渡静默失败

// 正确 - 每个元素唯一的名称
document.querySelectorAll('.card').forEach((card, index) => {
  card.style.viewTransitionName = `card-${index}`;
});
```

### 2. 忘记清理名称

```javascript
// 错误 - 名称持续存在并导致问题
function showDetail(card) {
  card.style.viewTransitionName = 'hero';
  document.startViewTransition(() => {
    renderDetail();
  });
  // 名称留在已移除的元素上或导致重复
}

// 正确 - 过渡后清理
async function showDetail(card) {
  card.style.viewTransitionName = 'hero';

  const transition = document.startViewTransition(() => {
    renderDetail();
    document.querySelector('.detail-image').style.viewTransitionName = 'hero';
  });

  await transition.finished;

  // 清理
  document.querySelector('.detail-image').style.viewTransitionName = '';
}
```

### 3. 阻塞主线程

```javascript
// 错误 - 更新回调中的繁重计算
document.startViewTransition(() => {
  const result = heavyComputation(); // 阻塞渲染
  updateDOM(result);
});

// 正确 - 在过渡前做繁重的工作
const result = await heavyComputation();
document.startViewTransition(() => {
  updateDOM(result); // 仅快速 DOM 更新
});
```

### 4. 不处理过渡失败

```javascript
// 错误 - 假设过渡总是成功
document.startViewTransition(() => {
  updateDOM();
});
continueWithNextStep(); // 可能在过渡完成前运行

// 正确 - 等待完成
const transition = document.startViewTransition(() => {
  updateDOM();
});

try {
  await transition.finished;
  continueWithNextStep();
} catch (e) {
  // 过渡被跳过或失败，但 DOM 更新仍然发生
  continueWithNextStep();
}
```

### 5. 忽略减少动效偏好

```javascript
// 错误 - 总是动画
document.startViewTransition(() => {
  updateDOM();
});

// 正确 - 尊重用户偏好
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  updateDOM();
} else {
  document.startViewTransition(() => {
    updateDOM();
  });
}
```

### 6. 过渡期间的 Z-Index 问题

```css
/* 问题：元素出现在过渡层后面 */
.modal {
  z-index: 1000;
}

/* 解决方案：确保过渡伪元素尊重堆叠 */
::view-transition-group(modal) {
  z-index: 1000;
}

/* 或将模态框从过渡中隔离 */
.modal {
  view-transition-name: none; /* 从过渡中排除 */
}
```

## 性能考量

### 测量过渡性能

```javascript
// 性能监控
function measureTransition(name, updateFn) {
  const startTime = performance.now();

  const transition = document.startViewTransition(async () => {
    const updateStart = performance.now();
    await updateFn();
    console.log(`${name} - 更新回调: ${performance.now() - updateStart}ms`);
  });

  transition.ready.then(() => {
    console.log(`${name} - 就绪（伪元素已创建）: ${performance.now() - startTime}ms`);
  });

  transition.finished.then(() => {
    console.log(`${name} - 完成: ${performance.now() - startTime}ms`);
  });

  return transition;
}
```

### 优化捕获大小

```css
/* 限制被捕获的内容 */
.no-transition {
  view-transition-name: none;
}

/* 大型静态元素不需要成为过渡的一部分 */
.background-video {
  view-transition-name: none;
}

.large-canvas {
  view-transition-name: none;
}
```

### 动画性能

```css
/* 优化动画属性 */
::view-transition-old(root),
::view-transition-new(root) {
  /* 谨慎使用 will-change，仅用于复杂动画 */
  will-change: transform, opacity;
}

/* 首选 transform 和 opacity */
@keyframes optimized-transition {
  from {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateY(-10px) scale(0.98);
    opacity: 0;
  }
}

/* 避免触发布局的属性 */
@keyframes unoptimized-transition {
  /* 坏：这些触发布局重新计算 */
  from {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }
  to {
    width: 50%;
    height: 50%;
    top: 100px;
    left: 100px;
  }
}
```

### 内存管理

```javascript
// 通过适当的清理避免内存泄漏
class TransitionManager {
  constructor() {
    this.activeTransitions = new Set();
  }

  async startTransition(updateFn, options = {}) {
    // 取消任何待处理的过渡
    this.activeTransitions.forEach(t => t.skipTransition());
    this.activeTransitions.clear();

    if (!document.startViewTransition) {
      await updateFn();
      return;
    }

    const transition = document.startViewTransition({
      update: updateFn,
      types: options.types || []
    });

    this.activeTransitions.add(transition);

    transition.finished.finally(() => {
      this.activeTransitions.delete(transition);
    });

    return transition;
  }

  cancelAll() {
    this.activeTransitions.forEach(t => t.skipTransition());
    this.activeTransitions.clear();
  }
}
```

## 实战场景

### 电商产品画廊

```javascript
// 带过渡的完整产品画廊
class ProductGallery {
  constructor(container, products) {
    this.container = container;
    this.products = products;
    this.currentView = 'grid';
    this.selectedProduct = null;

    this.render();
    this.bindEvents();
  }

  bindEvents() {
    this.container.addEventListener('click', (e) => {
      const productCard = e.target.closest('[data-product-id]');
      const backButton = e.target.closest('.back-button');
      const viewToggle = e.target.closest('.view-toggle');

      if (productCard && this.currentView === 'grid') {
        this.openProduct(productCard.dataset.productId);
      } else if (backButton) {
        this.closeProduct();
      } else if (viewToggle) {
        this.toggleView();
      }
    });
  }

  async openProduct(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    // 在被点击的卡片上设置过渡名称
    const card = this.container.querySelector(`[data-product-id="${productId}"]`);
    card.style.viewTransitionName = 'product-hero';

    this.selectedProduct = product;

    await this.transition(() => {
      this.currentView = 'detail';
      this.render();
    }, ['product-open']);
  }

  async closeProduct() {
    const productId = this.selectedProduct?.id;

    await this.transition(() => {
      this.currentView = 'grid';
      this.selectedProduct = null;
      this.render();

      // 将过渡名称应用到我们要返回的卡片
      const card = this.container.querySelector(`[data-product-id="${productId}"]`);
      if (card) {
        card.style.viewTransitionName = 'product-hero';
      }
    }, ['product-close']);

    // 清理过渡名称
    const card = this.container.querySelector(`[data-product-id="${productId}"]`);
    if (card) {
      card.style.viewTransitionName = '';
    }
  }

  async toggleView() {
    const newView = this.currentView === 'grid' ? 'list' : 'grid';

    await this.transition(() => {
      this.currentView = newView;
      this.render();
    }, ['layout-change']);
  }

  async transition(updateFn, types = []) {
    if (!document.startViewTransition) {
      updateFn();
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      updateFn();
      return;
    }

    const transition = document.startViewTransition({
      update: updateFn,
      types
    });

    return transition.finished;
  }

  render() {
    if (this.currentView === 'detail' && this.selectedProduct) {
      this.renderDetail();
    } else {
      this.renderGrid();
    }
  }

  renderGrid() {
    // 清空容器
    this.container.textContent = '';

    // 创建头部
    const header = document.createElement('div');
    header.className = 'gallery-header';

    const title = document.createElement('h1');
    title.textContent = '产品';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'view-toggle';
    toggleBtn.textContent = `切换到${this.currentView === 'grid' ? '列表' : '网格'}`;

    header.appendChild(title);
    header.appendChild(toggleBtn);

    // 创建网格
    const grid = document.createElement('div');
    grid.className = `product-${this.currentView}`;

    this.products.forEach(product => {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.dataset.productId = product.id;

      const img = document.createElement('img');
      img.src = product.image;
      img.alt = product.name;

      const name = document.createElement('h3');
      name.textContent = product.name;

      const price = document.createElement('p');
      price.className = 'price';
      price.textContent = `$${product.price}`;

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(price);
      grid.appendChild(card);
    });

    this.container.appendChild(header);
    this.container.appendChild(grid);
  }

  renderDetail() {
    const product = this.selectedProduct;

    // 清空容器
    this.container.textContent = '';

    const detail = document.createElement('div');
    detail.className = 'product-detail';

    const backBtn = document.createElement('button');
    backBtn.className = 'back-button';
    backBtn.textContent = '返回';

    const content = document.createElement('div');
    content.className = 'detail-content';

    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    img.style.viewTransitionName = 'product-hero';

    const info = document.createElement('div');
    info.className = 'detail-info';

    const titleEl = document.createElement('h1');
    titleEl.textContent = product.name;

    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = `$${product.price}`;

    const desc = document.createElement('p');
    desc.className = 'description';
    desc.textContent = product.description;

    const addBtn = document.createElement('button');
    addBtn.className = 'add-to-cart';
    addBtn.textContent = '加入购物车';

    info.appendChild(titleEl);
    info.appendChild(price);
    info.appendChild(desc);
    info.appendChild(addBtn);

    content.appendChild(img);
    content.appendChild(info);

    detail.appendChild(backBtn);
    detail.appendChild(content);

    this.container.appendChild(detail);
  }
}
```

### 仪表板标签导航

```javascript
// 带动画标签过渡的仪表板
class DashboardTabs {
  constructor(container) {
    this.container = container;
    this.tabs = ['overview', 'analytics', 'reports', 'settings'];
    this.currentTab = 'overview';
    this.tabOrder = new Map(this.tabs.map((tab, i) => [tab, i]));

    this.render();
    this.bindEvents();
  }

  bindEvents() {
    this.container.addEventListener('click', (e) => {
      const tabButton = e.target.closest('[data-tab]');
      if (tabButton) {
        this.switchTab(tabButton.dataset.tab);
      }
    });
  }

  getTransitionDirection(from, to) {
    const fromIndex = this.tabOrder.get(from);
    const toIndex = this.tabOrder.get(to);
    return toIndex > fromIndex ? 'slide-left' : 'slide-right';
  }

  async switchTab(newTab) {
    if (newTab === this.currentTab) return;

    const direction = this.getTransitionDirection(this.currentTab, newTab);
    this.currentTab = newTab;

    if (!document.startViewTransition) {
      this.render();
      return;
    }

    const transition = document.startViewTransition({
      update: () => this.render(),
      types: [direction]
    });

    return transition.finished;
  }

  render() {
    // 清空容器
    this.container.textContent = '';

    // 创建导航
    const nav = document.createElement('nav');
    nav.className = 'tab-nav';

    const tabNames = {
      overview: '概览',
      analytics: '分析',
      reports: '报告',
      settings: '设置'
    };

    this.tabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.dataset.tab = tab;
      btn.className = `tab-button ${tab === this.currentTab ? 'active' : ''}`;
      btn.textContent = tabNames[tab];
      nav.appendChild(btn);
    });

    // 创建主要内容
    const main = document.createElement('main');
    main.className = 'tab-content';
    main.style.viewTransitionName = 'tab-content';
    main.appendChild(this.createTabContent(this.currentTab));

    this.container.appendChild(nav);
    this.container.appendChild(main);
  }

  createTabContent(tab) {
    const content = document.createElement('div');

    const tabNames = {
      overview: '概览',
      analytics: '分析',
      reports: '报告',
      settings: '设置'
    };

    const title = document.createElement('h2');
    title.textContent = tabNames[tab];

    const desc = document.createElement('p');
    const descriptions = {
      overview: '仪表板概览内容...',
      analytics: '图表和指标...',
      reports: '生成的报告...',
      settings: '配置选项...'
    };
    desc.textContent = descriptions[tab] || '';

    content.appendChild(title);
    content.appendChild(desc);

    return content;
  }
}
```

## 面试要点

### 基础概念

**Q1：什么是 View Transitions API，它解决什么问题？**

View Transitions API 是一种浏览器原生机制，用于在不同 DOM 状态之间创建动画过渡。它解决了创建平滑页面过渡的问题，以前这需要：
- 复杂的 JavaScript 动画库
- 手动元素跟踪和克隆
- FLIP（First, Last, Invert, Play）技术实现
- 处理竞态条件和清理

主要优势：
- 原生浏览器实现（更好的性能）
- 通过 CSS 的声明式方法
- 自动快照捕获和动画
- 同时适用于 SPA 和 MPA

**Q2：解释同文档和跨文档视图过渡的区别。**

**同文档（SPA）**：
- 通过 `document.startViewTransition()` 触发
- 用于客户端导航
- 完全的程序化控制
- DOM 更改在更新回调中发生

**跨文档（MPA）**：
- 在导航期间自动触发
- 通过 CSS `@view-transition { navigation: auto; }` 启用
- 在单独的 HTML 页面之间工作
- 使用 `pageswap` 和 `pagereveal` 事件

**Q3：视图过渡期间创建的伪元素有哪些？**

```
::view-transition                    - 根容器
  ::view-transition-group(name)      - 每个命名元素的容器
    ::view-transition-image-pair(name) - 保存旧/新快照
      ::view-transition-old(name)    - 旧状态的屏幕截图
      ::view-transition-new(name)    - 新状态的屏幕截图
```

### 实践问题

**Q4：如何处理应该一起动画的元素（共享元素过渡）？**

1. 为两个元素分配相同的 `view-transition-name`
2. 确保名称唯一（每个过渡没有重复）
3. 在过渡前动态设置名称，之后清理

```javascript
// 过渡前
sourceElement.style.viewTransitionName = 'shared';

document.startViewTransition(() => {
  // DOM 更新后
  targetElement.style.viewTransitionName = 'shared';
}).finished.then(() => {
  // 清理
  targetElement.style.viewTransitionName = '';
});
```

**Q5：如何实现方向性过渡（后退 vs 前进）？**

使用过渡类型和条件 CSS：

```javascript
const transition = document.startViewTransition({
  update: updateDOM,
  types: [isBack ? 'slide-right' : 'slide-left']
});
```

```css
html:active-view-transition-type(slide-left) {
  &::view-transition-old(root) { animation: slide-out-left; }
  &::view-transition-new(root) { animation: slide-in-right; }
}
```

**Q6：关键的性能考虑有哪些？**

1. **保持更新回调快速** - 在过渡前进行繁重计算
2. **限制命名元素** - 更少的元素 = 更小的快照
3. **使用 GPU 加速的属性** - transform, opacity
4. **使用 `view-transition-name: none` 排除大型/复杂元素**
5. **尊重减少动效偏好**

### 高级问题

**Q7：如何处理带有异步数据加载的视图过渡？**

```javascript
async function navigateWithData(url) {
  // 首先获取数据
  const data = await fetchData(url);

  // 然后用同步更新进行过渡
  const transition = document.startViewTransition(() => {
    renderPage(data);
  });

  return transition.finished;
}
```

**Q8：跨文档过渡如何与 Navigation API 配合工作？**

```javascript
// 监听导航事件
navigation.addEventListener('navigate', (e) => {
  if (shouldTransition(e.destination.url)) {
    e.intercept({
      async handler() {
        const response = await fetch(e.destination.url);
        const data = await response.json();

        await document.startViewTransition(() => {
          renderPage(data);
        }).finished;
      }
    });
  }
});
```

## 延伸阅读

### 官方文档

- [MDN View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) - 全面的 API 参考
- [W3C CSS View Transitions 规范](https://www.w3.org/TR/css-view-transitions-1/) - 官方规范
- [Chrome Developers 指南](https://developer.chrome.com/docs/web-platform/view-transitions/) - 实现指南

### 框架集成

- [Next.js View Transitions](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating) - Next.js 集成
- [Nuxt View Transitions](https://nuxt.com/docs/getting-started/transitions) - Nuxt 3 支持
- [Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/) - Astro 的内置支持
- [SvelteKit View Transitions](https://kit.svelte.dev/docs/configuration) - SvelteKit 集成

### 教程和示例

- [使用 View Transitions 实现平滑页面过渡](https://web.dev/articles/view-transitions) - Google Web Fundamentals
- [多页面应用的 View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document) - MPA 指南
- [Jake Archibald 的 View Transitions 演示](https://http203-playlist.netlify.app/) - 交互式示例

### 相关技术

- [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) - 现代导航拦截
- [CSS Scroll-Driven Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline) - 基于滚动的动画
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) - JavaScript 动画控制

---

View Transitions API 代表了 Web 开发的重大进步，将原生级质量的过渡带到浏览器中。通过理解其生命周期、伪元素结构和最佳实践，开发者可以创建与原生应用媲美的精致、可访问的体验。随着浏览器支持的不断扩展和跨文档 API 的成熟，视图过渡将成为每个前端开发者工具包中的必备工具。
