---
title: 浏览器渲染原理
description: 深入理解浏览器渲染流程、重排重绘优化和性能提升策略
track: javascript
section: browser
difficulty: advanced
tags:
  - 浏览器
  - 渲染
  - 性能优化
  - 面试
status: imported
origin: old/src/content/docs/frontend/browser-rendering.zh.md
divergence: 0.196
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: Frontend
  subcategory: Browser
  order: 45
  lastUpdated: 2026-01-07
---

## 概念解释

浏览器渲染是指浏览器将 HTML、CSS 和 JavaScript 代码转换为用户可以交互的可视化页面的过程。理解浏览器渲染原理是前端性能优化的基石,也是构建高性能 Web 应用的必备知识。

### 历史背景

早期的网页非常简单,浏览器只需要解析 HTML 并显示文本和图片即可。随着 Web 技术的发展,CSS 带来了丰富的样式能力,JavaScript 赋予了页面动态交互的能力,浏览器的渲染引擎也变得越来越复杂。

现代浏览器的渲染引擎(也称为排版引擎或布局引擎)主要有:
- **Blink**: Chrome、Edge、Opera 使用
- **WebKit**: Safari 使用
- **Gecko**: Firefox 使用

### 解决什么问题

浏览器渲染机制需要解决以下核心问题:
1. 如何将文本格式的 HTML/CSS 转换为内存中的数据结构
2. 如何计算每个元素在屏幕上的精确位置和大小
3. 如何高效地将像素绘制到屏幕上
4. 如何处理页面的动态更新,同时保持流畅的用户体验

---

## 核心原理

### 浏览器架构概述

现代浏览器采用多进程架构,主要包含:

```
+-----------------------------------------------------------+
|                     Browser Process                        |
|  (UI、网络请求、存储等)                                    |
+-----------------------------------------------------------+
|   Renderer Process   |   Renderer Process   |    ...      |
|     (每个标签页)      |     (每个标签页)      |             |
+-----------------------------------------------------------+
|                      GPU Process                           |
|  (处理 GPU 任务,绘制到屏幕)                               |
+-----------------------------------------------------------+
```

渲染进程(Renderer Process)是我们关注的核心,它包含:
- **主线程(Main Thread)**: 执行 JavaScript、解析 HTML/CSS、计算样式和布局
- **合成线程(Compositor Thread)**: 将页面分层并合成
- **光栅化线程(Raster Thread)**: 将图层转换为位图

---

## 渲染流程详解

浏览器的渲染流程可以分为以下几个关键阶段:

```
HTML --> DOM Tree ----------------------+
                                        +--> Render Tree --> Layout --> Paint --> Composite
CSS  --> CSSOM Tree --------------------+
```

### 解析 HTML - 构建 DOM 树

当浏览器接收到 HTML 文档时,HTML 解析器开始工作,将 HTML 标记转换为 DOM(Document Object Model)树。

```html
<!DOCTYPE html>
<html>
  <head>
    <title>示例页面</title>
  </head>
  <body>
    <div class="container">
      <h1>标题</h1>
      <p>段落文本</p>
    </div>
  </body>
</html>
```

对应的 DOM 树结构:

```
Document
  html
    head
      title
        "示例页面"
    body
      div.container
        h1
          "标题"
        p
          "段落文本"
```

**解析过程的关键点:**

1. **字节流解码**: 将网络传输的字节流根据编码(如 UTF-8)解码为字符
2. **词法分析(Tokenization)**: 将字符流分解为标记(Token)
3. **语法分析**: 根据标记构建 DOM 节点
4. **DOM 树构建**: 将节点按照父子关系组织成树结构

```javascript
// 通过 JavaScript 观察 DOM 树
console.log(document.documentElement); // html 元素
console.log(document.body.children);   // body 的子元素集合
```

### 解析 CSS - 构建 CSSOM 树

与 DOM 树类似,浏览器会将 CSS 解析为 CSSOM(CSS Object Model)树。

```css
body {
  font-size: 16px;
}

.container {
  width: 100%;
  padding: 20px;
}

h1 {
  color: #333;
  font-size: 2em;
}

p {
  line-height: 1.6;
}
```

CSSOM 树结构:

```
StyleSheetList
  CSSStyleSheet
    CSSRuleList
      CSSStyleRule (body)
        style: { fontSize: "16px" }
      CSSStyleRule (.container)
        style: { width: "100%", padding: "20px" }
      CSSStyleRule (h1)
        style: { color: "#333", fontSize: "2em" }
      CSSStyleRule (p)
        style: { lineHeight: "1.6" }
```

**CSS 解析的特点:**

- CSS 是**渲染阻塞**资源,浏览器需要完整的 CSSOM 才能进行渲染
- CSS 选择器从右向左匹配,这影响了选择器的性能
- 继承和层叠规则决定了最终应用的样式

```javascript
// 通过 JavaScript 访问 CSSOM
const sheets = document.styleSheets;
const rules = sheets[0].cssRules;
console.log(rules[0].selectorText); // 选择器文本
console.log(rules[0].style.cssText); // 样式文本
```

### 构建渲染树(Render Tree)

渲染树是 DOM 树和 CSSOM 树的结合,它只包含需要显示的节点及其计算后的样式。

```
Render Tree
  RenderView
    RenderBody
      RenderBlock (div.container)
        RenderBlock (h1)
          RenderText "标题"
        RenderBlock (p)
          RenderText "段落文本"
```

**渲染树构建规则:**

1. 从 DOM 树的根节点开始遍历每个可见节点
2. 对于每个可见节点,找到 CSSOM 中匹配的样式规则
3. 结合 DOM 节点和计算后的样式,生成渲染树节点

**不会出现在渲染树中的节点:**
- `<head>`、`<script>`、`<meta>` 等非可视元素
- `display: none` 的元素(注意: `visibility: hidden` 的元素仍在渲染树中)
- 伪元素会被添加到渲染树中

```javascript
// display: none vs visibility: hidden
const hiddenElement = document.querySelector('.hidden');

// display: none - 不在渲染树中,不占空间
hiddenElement.style.display = 'none';

// visibility: hidden - 在渲染树中,占空间但不可见
hiddenElement.style.visibility = 'hidden';
```

### 布局(Layout / Reflow)

布局阶段计算渲染树中每个节点的几何信息:位置(x, y 坐标)和大小(宽度、高度)。

```javascript
// 布局需要计算的信息示例
const layoutInfo = {
  x: 0,
  y: 0,
  width: 1200,
  height: 800,
  children: [
    {
      x: 100,
      y: 50,
      width: 1000,
      height: 600
    }
  ]
};
```

**布局计算过程:**

1. **确定视口大小**: 根据浏览器窗口确定初始包含块
2. **遍历渲染树**: 自顶向下,确定每个节点的尺寸
3. **处理盒模型**: 计算 content、padding、border、margin
4. **处理定位**: normal flow、float、position
5. **处理文本**: 计算行高、换行位置等

```css
/* 不同的盒模型影响布局计算 */
.box-content {
  box-sizing: content-box; /* width = content width */
  width: 200px;
  padding: 20px;
  border: 1px solid;
  /* 实际占用宽度: 200 + 20*2 + 1*2 = 242px */
}

.box-border {
  box-sizing: border-box; /* width = content + padding + border */
  width: 200px;
  padding: 20px;
  border: 1px solid;
  /* 实际占用宽度: 200px */
}
```

### 绘制(Paint)

绘制阶段将渲染树中的每个节点转换为屏幕上的实际像素。这个过程会创建绘制记录(Paint Records),记录绘制操作的顺序。

**绘制顺序(Stacking Context):**

1. 背景颜色
2. 背景图片
3. 边框
4. 子元素
5. 轮廓(outline)

```css
/* 创建新的层叠上下文的属性 */
.stacking-context {
  position: relative;
  z-index: 1; /* position 非 static 且 z-index 非 auto */
}

.stacking-context-2 {
  opacity: 0.99; /* opacity 小于 1 */
}

.stacking-context-3 {
  transform: translateZ(0); /* transform 非 none */
}
```

### 合成(Composite)

现代浏览器会将页面分成多个图层(Layers),分别进行光栅化,然后在 GPU 中合成最终的页面图像。

```
+--------------------------------------+
|            Compositor                |
+--------------------------------------+
|  Layer 1  |  Layer 2  |  Layer 3    |
|  (背景)   |  (内容)   |  (fixed元素)|
+--------------------------------------+
|              GPU 合成                |
+--------------------------------------+
|           最终显示画面               |
+--------------------------------------+
```

**触发图层创建的条件:**

```css
/* 以下属性会创建新的合成层 */
.new-layer {
  /* 3D 变换 */
  transform: translateZ(0);
  transform: translate3d(0, 0, 0);

  /* will-change 属性 */
  will-change: transform;
  will-change: opacity;

  /* 视频、Canvas、WebGL */
  /* <video>, <canvas> 元素 */

  /* CSS 滤镜 */
  filter: blur(5px);

  /* opacity 动画 */
  opacity: 0.5;
  transition: opacity 0.3s;
}
```

---

## 重排(Reflow)与重绘(Repaint)

### 重排(Reflow)

重排是指当渲染树中的节点几何属性发生变化时,浏览器需要重新计算元素的位置和大小的过程。

**触发重排的操作:**

```javascript
// 1. 添加或删除可见的 DOM 元素
document.body.appendChild(newElement);
element.remove();

// 2. 元素位置改变
element.style.left = '100px';
element.style.top = '50px';

// 3. 元素尺寸改变
element.style.width = '200px';
element.style.height = '100px';
element.style.padding = '20px';
element.style.margin = '10px';
element.style.border = '1px solid';

// 4. 内容变化
element.textContent = '新内容';

// 5. 页面初始渲染
// 6. 浏览器窗口大小改变
window.addEventListener('resize', handler);

// 7. 读取某些属性(强制同步布局)
const height = element.offsetHeight;
const width = element.offsetWidth;
const top = element.offsetTop;
const scroll = element.scrollTop;
const rect = element.getBoundingClientRect();
const style = getComputedStyle(element);
```

### 重绘(Repaint)

重绘是指当元素的外观样式(如颜色、背景)改变,但不影响布局时,浏览器需要重新绘制元素的过程。

**只触发重绘的操作:**

```javascript
// 改变颜色
element.style.color = 'red';
element.style.backgroundColor = '#f0f0f0';

// 改变可见性(visibility)
element.style.visibility = 'hidden';

// 改变阴影
element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

// 改变轮廓
element.style.outline = '1px solid blue';
```

### 性能影响对比

```
重排(Layout) > 重绘(Paint) > 合成(Composite)
  开销最大        开销中等        开销最小
```

**优化策略:**

```javascript
// 不好的做法 - 多次触发重排
function badPractice(element) {
  element.style.width = '100px';   // 重排
  element.style.height = '100px';  // 重排
  element.style.margin = '10px';   // 重排
  element.style.padding = '5px';   // 重排
}

// 好的做法 - 批量修改样式
function goodPractice(element) {
  // 方法1: 使用 class
  element.className = 'new-styles';

  // 方法2: 使用 cssText
  element.style.cssText = 'width: 100px; height: 100px; margin: 10px; padding: 5px;';

  // 方法3: 离线操作 DOM
  element.style.display = 'none';
  // 进行多次修改
  element.style.width = '100px';
  element.style.height = '100px';
  element.style.display = 'block';
}
```

---

## 合成层与 GPU 加速

### 合成层的优势

1. **独立绑定**: 合成层的变化不会影响其他图层
2. **GPU 加速**: 合成层使用 GPU 进行渲染
3. **高效重绘**: 只需重新合成,无需重排重绘

### 创建合成层

```css
/* 推荐方式 - 使用 will-change */
.accelerated {
  will-change: transform;
}

/* 传统方式 - 使用 transform hack */
.accelerated-legacy {
  transform: translateZ(0);
  /* 或 */
  transform: translate3d(0, 0, 0);
}

/* 动画场景 */
.animated {
  will-change: transform, opacity;
  transition: transform 0.3s, opacity 0.3s;
}
```

### 合成层的陷阱

```javascript
// 过多合成层会导致内存问题
// 层爆炸(Layer Explosion)示例

// 不好的做法
const items = document.querySelectorAll('.item');
items.forEach(item => {
  item.style.willChange = 'transform'; // 创建大量合成层
});

// 好的做法 - 只在需要时创建合成层
item.addEventListener('mouseenter', () => {
  item.style.willChange = 'transform';
});

item.addEventListener('animationend', () => {
  item.style.willChange = 'auto'; // 动画结束后移除
});
```

### 只触发合成的属性

```css
/* 这些属性只触发合成,性能最好 */
.composite-only {
  transform: translateX(100px);
  transform: scale(1.2);
  transform: rotate(45deg);
  opacity: 0.8;
}

/* 使用这些属性进行动画 */
@keyframes slide {
  from {
    transform: translateX(0);
    opacity: 0;
  }
  to {
    transform: translateX(100px);
    opacity: 1;
  }
}
```

---

## 关键渲染路径优化

关键渲染路径(Critical Rendering Path)是浏览器将 HTML、CSS 和 JavaScript 转换为屏幕上像素的步骤序列。优化关键渲染路径可以显著提升首次渲染时间。

### 优化策略

#### 减少关键资源数量

```html
<!-- 内联关键 CSS -->
<head>
  <style>
    /* 首屏关键样式 */
    .hero { /* ... */ }
    .nav { /* ... */ }
  </style>

  <!-- 异步加载非关键 CSS -->
  <link rel="preload" href="styles.css" as="style" 
        onload="this.onload=null;this.rel='stylesheet'">
</head>
```

#### 减少关键路径长度

```html
<!-- 优化资源加载顺序 -->
<head>
  <!-- 预连接到重要的第三方源 -->
  <link rel="preconnect" href="https://fonts.googleapis.com">

  <!-- 预加载关键资源 -->
  <link rel="preload" href="critical.js" as="script">
  <link rel="preload" href="hero-image.webp" as="image">
</head>
```

#### 优化 JavaScript 加载

```html
<!-- defer: 异步加载,DOMContentLoaded 之前按顺序执行 -->
<script defer src="app.js"></script>

<!-- async: 异步加载,下载完立即执行 -->
<script async src="analytics.js"></script>

<!-- 模块脚本默认 defer -->
<script type="module" src="main.mjs"></script>
```

#### 避免渲染阻塞

```html
<!-- 媒体查询避免阻塞 -->
<link rel="stylesheet" href="print.css" media="print">
<link rel="stylesheet" href="mobile.css" media="(max-width: 768px)">

<!-- 对非关键 CSS 使用低优先级 -->
<link rel="stylesheet" href="non-critical.css" fetchpriority="low">
```

---

## 代码示例

### 示例1: 检测布局抖动

```javascript
// 布局抖动(Layout Thrashing)示例
function layoutThrashing() {
  const elements = document.querySelectorAll('.box');

  // 不好的做法 - 读写交替导致强制同步布局
  elements.forEach(el => {
    const height = el.offsetHeight;    // 读取 - 触发布局
    el.style.height = height + 10 + 'px'; // 写入 - 使布局失效
    // 下一次循环的读取会强制同步布局
  });
}

// 优化后 - 批量读取,批量写入
function optimizedLayout() {
  const elements = document.querySelectorAll('.box');

  // 批量读取
  const heights = Array.from(elements).map(el => el.offsetHeight);

  // 批量写入
  elements.forEach((el, i) => {
    el.style.height = heights[i] + 10 + 'px';
  });
}
```

### 示例2: 使用 requestAnimationFrame

```javascript
// 使用 requestAnimationFrame 进行动画
function animate() {
  let start = null;
  const element = document.getElementById('animated');
  const duration = 1000; // 1秒

  function step(timestamp) {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);

    // 只使用 transform,避免重排
    element.style.transform = 'translateX(' + (progress * 300) + 'px)';

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

// 对比: 不好的做法
function badAnimate() {
  let pos = 0;
  setInterval(() => {
    pos += 5;
    element.style.left = pos + 'px'; // 触发重排
  }, 16);
}
```

### 示例3: 虚拟滚动优化

```javascript
// 虚拟滚动 - 只渲染可见区域的元素
class VirtualScroller {
  constructor(container, items, itemHeight) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;

    this.init();
  }

  init() {
    // 创建滚动容器
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.style.height = this.items.length * this.itemHeight + 'px';
    this.scrollContainer.style.position = 'relative';

    this.container.appendChild(this.scrollContainer);
    this.container.addEventListener('scroll', () => this.render());

    this.render();
  }

  render() {
    const scrollTop = this.container.scrollTop;
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + this.visibleCount, this.items.length);

    // 清空之前的内容
    this.scrollContainer.textContent = '';

    // 只渲染可见项
    for (let i = startIndex; i < endIndex; i++) {
      const item = document.createElement('div');
      item.className = 'virtual-item';
      item.textContent = this.items[i];
      item.style.position = 'absolute';
      item.style.top = i * this.itemHeight + 'px';
      item.style.height = this.itemHeight + 'px';

      // 使用 transform 代替 top 可以进一步优化
      // item.style.transform = 'translateY(' + (i * this.itemHeight) + 'px)';

      this.scrollContainer.appendChild(item);
    }
  }
}
```

### 示例4: 防抖与节流

```javascript
// 防抖 - 适用于搜索输入
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 节流 - 适用于滚动事件
function throttle(fn, limit) {
  let inThrottle = false;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 使用 requestAnimationFrame 的节流
function rafThrottle(fn) {
  let ticking = false;
  return function(...args) {
    if (!ticking) {
      requestAnimationFrame(() => {
        fn.apply(this, args);
        ticking = false;
      });
      ticking = true;
    }
  };
}

// 应用示例
window.addEventListener('scroll', rafThrottle(() => {
  // 滚动处理逻辑
  updateScrollPosition();
}));
```

---

## 性能分析工具

### Chrome DevTools Performance 面板

```javascript
// 使用 Performance API 进行性能测量
// 标记时间点
performance.mark('render-start');

// 执行渲染操作
renderComponent();

performance.mark('render-end');

// 测量两个标记之间的时间
performance.measure('render-time', 'render-start', 'render-end');

// 获取测量结果
const measures = performance.getEntriesByName('render-time');
console.log('渲染时间: ' + measures[0].duration + 'ms');
```

### 关键性能指标

```javascript
// 获取性能指标
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.name + ': ' + entry.startTime + 'ms');
  }
});

// 观察各种性能指标
observer.observe({
  entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift']
});

// 获取首次内容绘制(FCP)
const paintEntries = performance.getEntriesByType('paint');
const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
if (fcp) {
  console.log('FCP: ' + fcp.startTime + 'ms');
}
```

### 检测长任务

```javascript
// 检测阻塞主线程的长任务
const longTaskObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.warn('Long Task detected: ' + entry.duration + 'ms', entry);
  }
});

longTaskObserver.observe({ entryTypes: ['longtask'] });
```

### Chrome DevTools 层面板

在 Chrome DevTools 中:
1. 打开 "More tools" > "Layers" 查看合成层
2. 使用 "Rendering" 面板开启 "Paint flashing" 查看重绘区域
3. 使用 "Rendering" 面板开启 "Layout Shift Regions" 查看布局偏移

---

## 最佳实践

### CSS 优化

```css
/* 使用高效的选择器 */
/* 好 */
.header-nav-item { }

/* 避免 */
div.header ul.nav li.item a { }

/* 使用 contain 属性限制重排范围 */
.isolated-component {
  contain: layout style paint;
}

/* 使用 content-visibility 延迟渲染 */
.offscreen-content {
  content-visibility: auto;
  contain-intrinsic-size: 200px;
}
```

### JavaScript 优化

```javascript
// 使用 DocumentFragment 批量 DOM 操作
function appendItems(items) {
  const fragment = document.createDocumentFragment();

  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    fragment.appendChild(li);
  });

  document.getElementById('list').appendChild(fragment);
}

// 使用 IntersectionObserver 延迟加载
const lazyLoadObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      lazyLoadObserver.unobserve(img);
    }
  });
});

document.querySelectorAll('img[data-src]').forEach(img => {
  lazyLoadObserver.observe(img);
});
```

### 动画优化

```css
/* 使用 GPU 加速的属性进行动画 */
.optimized-animation {
  /* 好 - 只触发合成 */
  animation: slide 0.3s ease;
}

@keyframes slide {
  from { transform: translateX(0); opacity: 0; }
  to { transform: translateX(100px); opacity: 1; }
}

/* 避免 - 触发重排 */
@keyframes bad-slide {
  from { left: 0; width: 100px; }
  to { left: 100px; width: 200px; }
}
```

---

## 常见陷阱

### 强制同步布局

```javascript
// 陷阱: 读写交替
function forcedSyncLayout() {
  element.style.width = '100px';
  const height = element.offsetHeight; // 强制同步布局!
  element.style.height = height + 'px';
}

// 解决方案: 先读后写
function avoidForcedLayout() {
  const height = element.offsetHeight; // 先读
  element.style.width = '100px';       // 后写
  element.style.height = height + 'px';
}
```

### 层爆炸

```javascript
// 陷阱: 创建过多合成层
elements.forEach(el => {
  el.style.willChange = 'transform'; // 大量合成层导致内存问题
});

// 解决方案: 按需创建,及时释放
element.addEventListener('mouseenter', () => {
  element.style.willChange = 'transform';
});
element.addEventListener('transitionend', () => {
  element.style.willChange = 'auto';
});
```

### 隐式合成

```css
/* 陷阱: 后续元素被迫提升为合成层 */
.element-a {
  position: relative;
  z-index: 1;
  transform: translateZ(0); /* 合成层 */
}

.element-b {
  position: relative;
  z-index: 2;
  /* 由于层叠顺序,element-b 也被提升为合成层 */
}
```

---

## 实战场景

### 场景1: 大型列表渲染优化

当需要渲染包含数千条数据的列表时,直接渲染所有 DOM 节点会导致严重的性能问题。

```javascript
// 问题场景: 渲染 10000 条数据
function renderLargeList(data) {
  const container = document.getElementById('container');

  // 不推荐: 直接渲染所有数据
  data.forEach(item => {
    const div = document.createElement('div');
    div.textContent = item.name;
    container.appendChild(div); // 每次都触发重排
  });
}

// 优化方案1: 使用 DocumentFragment
function optimizedRenderList(data) {
  const container = document.getElementById('container');
  const fragment = document.createDocumentFragment();

  data.forEach(item => {
    const div = document.createElement('div');
    div.textContent = item.name;
    fragment.appendChild(div);
  });

  container.appendChild(fragment); // 只触发一次重排
}

// 优化方案2: 分批渲染,避免长任务阻塞
function batchRender(data, batchSize = 100) {
  const container = document.getElementById('container');
  let index = 0;

  function renderBatch() {
    const fragment = document.createDocumentFragment();
    const end = Math.min(index + batchSize, data.length);

    while (index < end) {
      const div = document.createElement('div');
      div.textContent = data[index].name;
      fragment.appendChild(div);
      index++;
    }

    container.appendChild(fragment);

    if (index < data.length) {
      // 让出主线程,避免阻塞用户交互
      requestIdleCallback(renderBatch);
    }
  }

  renderBatch();
}
```

### 场景2: 复杂动画性能优化

在实现复杂动画效果时,选择正确的 CSS 属性至关重要。

```css
/* 场景: 实现一个卡片悬停效果 */

/* 不推荐: 使用会触发重排的属性 */
.card-bad {
  transition: all 0.3s ease;
}
.card-bad:hover {
  width: 320px;      /* 触发重排 */
  height: 220px;     /* 触发重排 */
  margin-top: -10px; /* 触发重排 */
  box-shadow: 0 10px 30px rgba(0,0,0,0.2); /* 触发重绘 */
}

/* 推荐: 使用只触发合成的属性 */
.card-good {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  will-change: transform;
}
.card-good:hover {
  transform: scale(1.05) translateY(-10px); /* 只触发合成 */
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
```

### 场景3: 首屏加载性能优化

优化首屏渲染是提升用户体验的关键。

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 1. 预连接关键域名 -->
  <link rel="preconnect" href="https://api.example.com">
  <link rel="preconnect" href="https://cdn.example.com">

  <!-- 2. 内联关键 CSS -->
  <style>
    /* 首屏关键样式 - 通常由工具自动提取 */
    body { margin: 0; font-family: system-ui; }
    .hero { min-height: 100vh; display: flex; align-items: center; }
    .nav { position: fixed; top: 0; width: 100%; }
  </style>

  <!-- 3. 预加载关键资源 -->
  <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/images/hero.webp" as="image">

  <!-- 4. 异步加载非关键 CSS -->
  <link rel="preload" href="/css/main.css" as="style"
        onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/css/main.css"></noscript>
</head>
<body>
  <!-- 5. 首屏内容优先 -->
  <nav class="nav">...</nav>
  <section class="hero">...</section>

  <!-- 6. 延迟加载非首屏内容 -->
  <section class="features" style="content-visibility: auto;">...</section>

  <!-- 7. 脚本放在最后,使用 defer -->
  <script defer src="/js/app.js"></script>
</body>
</html>
```

### 场景4: 滚动性能优化

滚动是最常见的用户交互之一,优化滚动性能可以显著提升用户体验。

```javascript
// 使用 Passive Event Listeners
document.addEventListener('scroll', handleScroll, { passive: true });

// 使用 CSS scroll-snap 代替 JavaScript 滚动
// CSS 方案性能更好
const scrollContainer = document.querySelector('.scroll-container');
scrollContainer.style.scrollSnapType = 'x mandatory';

// 滚动时避免复杂计算
let ticking = false;
function handleScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      // 执行滚动相关逻辑
      updateScrollIndicator();
      ticking = false;
    });
    ticking = true;
  }
}

// 使用 IntersectionObserver 替代滚动事件监听
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
  observer.observe(el);
});
```

---

## 面试要点

### 描述浏览器渲染的完整流程

**参考答案:**
浏览器渲染流程包括:
1. **解析**: 将 HTML 解析为 DOM 树,将 CSS 解析为 CSSOM 树
2. **合并**: 将 DOM 和 CSSOM 合并为渲染树(Render Tree)
3. **布局**: 计算每个节点的几何信息(位置和大小)
4. **绘制**: 将节点转换为像素,创建绘制记录
5. **合成**: 将多个图层合成为最终页面

### 重排和重绘的区别是什么?如何避免?

**参考答案:**
- **重排(Reflow)**: 元素的几何属性改变,需要重新计算布局
- **重绘(Repaint)**: 元素外观改变但不影响布局,只需重新绘制

避免方法:
- 批量修改样式,使用 class 或 cssText
- 使用 DocumentFragment 批量 DOM 操作
- 使用 transform 和 opacity 进行动画
- 避免频繁读取布局属性
- 使用 will-change 提前声明动画元素

### 什么是合成层?如何创建?

**参考答案:**
合成层是独立于普通渲染层的图层,使用 GPU 进行渲染。创建方式:
- 使用 `transform: translateZ(0)` 或 `translate3d()`
- 使用 `will-change: transform/opacity`
- 使用 `opacity` 小于 1
- 使用 CSS 滤镜 `filter`
- `<video>`、`<canvas>` 等元素

### 什么是关键渲染路径?如何优化?

**参考答案:**
关键渲染路径是浏览器首次渲染页面所需的最小资源集合。优化方法:
- 内联关键 CSS,异步加载非关键 CSS
- 使用 `defer` 或 `async` 加载 JavaScript
- 减少关键资源数量和大小
- 使用预加载(`preload`)和预连接(`preconnect`)
- 避免渲染阻塞资源

### 如何检测和解决布局抖动?

**参考答案:**
布局抖动是由于读写交替导致的强制同步布局。检测方法:
- 使用 Chrome DevTools Performance 面板
- 查找 "Forced reflow" 警告

解决方法:
- 将读取操作放在写入操作之前
- 使用 `requestAnimationFrame` 批量处理
- 使用 FastDOM 等库自动批量处理

---

## 延伸阅读

### 官方文档
- [Google Developers - Critical Rendering Path](https://developers.google.com/web/fundamentals/performance/critical-rendering-path)
- [MDN - CSS Object Model](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model)
- [Chrome DevTools - Performance Analysis](https://developer.chrome.com/docs/devtools/performance/)

### 经典文章
- [How Browsers Work: Behind the scenes of modern web browsers](https://www.html5rocks.com/en/tutorials/internals/howbrowserswork/)
- [Rendering Performance](https://developers.google.com/web/fundamentals/performance/rendering)
- [Compositor-Only Properties](https://csstriggers.com/)

### 推荐书籍
- High Performance Browser Networking - Ilya Grigorik
- Web Performance in Action - Jeremy Wagner
- 浏览器工作原理与实践 - 李兵

### 工具资源
- [CSS Triggers](https://csstriggers.com/) - 查看 CSS 属性触发的渲染阶段
- [WebPageTest](https://www.webpagetest.org/) - 网页性能测试
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - 性能审计工具
