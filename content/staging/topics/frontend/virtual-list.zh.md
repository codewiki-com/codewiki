---
title: 虚拟列表优化技术
description: 掌握虚拟列表实现，高效渲染 JavaScript 应用中的大型数据集
track: frontend
section: performance
difficulty: intermediate
tags:
  - 虚拟列表
  - 性能优化
  - 窗口化
  - 大数据集
  - DOM优化
status: imported
origin: old/src/content/docs/javascript/virtual-list.zh.md
divergence: 0.224
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: JavaScript
  subcategory: ""
  order: null
  lastUpdated: 2026-01-22
---

虚拟列表（也称为窗口化或虚拟化）是一种强大的技术，通过只挂载当前在视口中可见的 DOM 元素来高效渲染大型列表。与一次性渲染数千个项目不同，虚拟列表只渲染用户可以看到的内容，从而大幅提高性能并减少内存消耗。

## 为什么虚拟列表很重要

在 Web 应用中处理大型数据集时，渲染数千个 DOM 元素会导致严重的性能问题：

| 问题 | 影响 | 传统方案 | 虚拟列表方案 |
|------|------|----------|-------------|
| 初始渲染时间 | 10,000+ 项目需要数秒 | 显示加载动画 | 即时渲染可见项 |
| 内存消耗 | 大型列表消耗数百 MB | 分页 | 恒定内存使用 |
| 滚动性能 | 卡顿、不流畅 | 减少项目数 | 流畅的 60fps 滚动 |
| DOM 大小 | 浏览器变得无响应 | 限制列表大小 | 最少的 DOM 节点 |

### 核心问题

```javascript
// 传统方式：渲染所有项目
function renderList(items) {
  const container = document.getElementById('list');

  // 创建 10,000+ 个 DOM 节点非常昂贵！
  items.forEach(item => {
    const div = document.createElement('div');
    div.textContent = item.name;
    div.className = 'list-item';
    container.appendChild(div);
  });
}

// 对于 10,000 个项目，这会创建 10,000 个 DOM 节点
// 浏览器必须：
// 1. 为每个节点分配内存
// 2. 计算所有节点的布局
// 3. 绑定所有节点（即使不可见的）
// 4. 在滚动期间将所有节点保存在内存中
```

### 虚拟列表解决方案

```javascript
// 虚拟列表：仅渲染可见项目
function renderVirtualList(items, containerHeight, itemHeight) {
  const container = document.getElementById('list');
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const scrollTop = container.scrollTop;
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);

  // 只为可见项目创建 DOM 节点！
  // 对于 500px 容器和 50px 项目，只需要约 11 个节点
  for (let i = startIndex; i < endIndex; i++) {
    const div = document.createElement('div');
    div.textContent = items[i].name;
    div.style.position = 'absolute';
    div.style.top = `${i * itemHeight}px`;
    container.appendChild(div);
  }
}
```

## 核心概念

### 固定高度虚拟列表

最简单的虚拟列表形式假设所有项目具有相同的高度：

```javascript
class FixedHeightVirtualList {
  constructor(options) {
    this.container = options.container;
    this.items = options.items;
    this.itemHeight = options.itemHeight;
    this.renderItem = options.renderItem;
    this.overscan = options.overscan || 3; // 上下额外渲染的项目数

    this.totalHeight = this.items.length * this.itemHeight;
    this.visibleCount = Math.ceil(this.container.clientHeight / this.itemHeight);

    this.init();
  }

  init() {
    // 创建内部容器以获得总滚动高度
    this.innerContainer = document.createElement('div');
    this.innerContainer.style.cssText = `
      position: relative;
      height: ${this.totalHeight}px;
      width: 100%;
    `;
    this.container.appendChild(this.innerContainer);

    // 设置带节流的滚动监听器
    this.container.style.overflow = 'auto';
    this.container.addEventListener('scroll', this.handleScroll.bind(this));

    // 初始渲染
    this.render();
  }

  handleScroll() {
    // 使用 requestAnimationFrame 实现平滑更新
    if (this.scrollRAF) {
      cancelAnimationFrame(this.scrollRAF);
    }

    this.scrollRAF = requestAnimationFrame(() => {
      this.render();
    });
  }

  getVisibleRange() {
    const scrollTop = this.container.scrollTop;
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + this.visibleCount + this.overscan * 2,
      this.items.length
    );

    return {
      start: Math.max(0, startIndex - this.overscan),
      end: endIndex
    };
  }

  render() {
    const { start, end } = this.getVisibleRange();

    // 清除之前的项目
    while (this.innerContainer.firstChild) {
      this.innerContainer.removeChild(this.innerContainer.firstChild);
    }

    // 渲染可见项目
    for (let i = start; i < end; i++) {
      const item = this.items[i];
      const element = this.renderItem(item, i);

      element.style.cssText = `
        position: absolute;
        top: ${i * this.itemHeight}px;
        left: 0;
        right: 0;
        height: ${this.itemHeight}px;
      `;

      this.innerContainer.appendChild(element);
    }
  }

  // 动态更新项目
  setItems(newItems) {
    this.items = newItems;
    this.totalHeight = newItems.length * this.itemHeight;
    this.innerContainer.style.height = `${this.totalHeight}px`;
    this.render();
  }

  // 滚动到特定索引
  scrollToIndex(index) {
    const offset = index * this.itemHeight;
    this.container.scrollTop = offset;
  }

  // 清理
  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll);
    if (this.scrollRAF) {
      cancelAnimationFrame(this.scrollRAF);
    }
    this.innerContainer.remove();
  }
}

// 使用示例
const virtualList = new FixedHeightVirtualList({
  container: document.getElementById('list-container'),
  items: Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    name: `项目 ${i}`,
    description: `项目 ${i} 的描述`
  })),
  itemHeight: 60,
  overscan: 5,
  renderItem: (item, index) => {
    const div = document.createElement('div');
    div.className = 'list-item';

    const strong = document.createElement('strong');
    strong.textContent = item.name;

    const p = document.createElement('p');
    p.textContent = item.description;

    div.appendChild(strong);
    div.appendChild(p);
    return div;
  }
});
```

### 动态高度虚拟列表

当项目具有不同高度时，我们需要更复杂的方法：

```javascript
class VariableHeightVirtualList {
  constructor(options) {
    this.container = options.container;
    this.items = options.items;
    this.estimatedItemHeight = options.estimatedItemHeight || 50;
    this.renderItem = options.renderItem;
    this.overscan = options.overscan || 3;

    // 测量高度的缓存
    this.heightCache = new Map();
    // 用于二分搜索的累积高度
    this.positions = [];

    this.init();
  }

  init() {
    // 初始化位置估算
    this.initPositions();

    this.innerContainer = document.createElement('div');
    this.innerContainer.style.cssText = `
      position: relative;
      width: 100%;
    `;
    this.updateTotalHeight();
    this.container.appendChild(this.innerContainer);

    this.container.style.overflow = 'auto';
    this.container.addEventListener('scroll', this.handleScroll.bind(this));

    // 使用 ResizeObserver 检测项目高度变化
    this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));

    this.render();
  }

  initPositions() {
    this.positions = [];
    let currentTop = 0;

    for (let i = 0; i < this.items.length; i++) {
      const height = this.heightCache.get(i) || this.estimatedItemHeight;
      this.positions.push({
        index: i,
        top: currentTop,
        bottom: currentTop + height,
        height: height
      });
      currentTop += height;
    }
  }

  updateTotalHeight() {
    const lastPosition = this.positions[this.positions.length - 1];
    const totalHeight = lastPosition ? lastPosition.bottom : 0;
    this.innerContainer.style.height = `${totalHeight}px`;
  }

  // 二分搜索查找起始索引
  findStartIndex(scrollTop) {
    let low = 0;
    let high = this.positions.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const position = this.positions[mid];

      if (position.bottom < scrollTop) {
        low = mid + 1;
      } else if (position.top > scrollTop) {
        high = mid - 1;
      } else {
        return mid;
      }
    }

    return Math.max(0, low);
  }

  // 基于视口查找结束索引
  findEndIndex(startIndex, viewportHeight, scrollTop) {
    const viewportBottom = scrollTop + viewportHeight;
    let index = startIndex;

    while (index < this.positions.length && this.positions[index].top < viewportBottom) {
      index++;
    }

    return Math.min(index + this.overscan, this.positions.length);
  }

  getVisibleRange() {
    const scrollTop = this.container.scrollTop;
    const viewportHeight = this.container.clientHeight;

    const startIndex = Math.max(0, this.findStartIndex(scrollTop) - this.overscan);
    const endIndex = this.findEndIndex(startIndex, viewportHeight, scrollTop);

    return { start: startIndex, end: endIndex };
  }

  handleScroll() {
    if (this.scrollRAF) {
      cancelAnimationFrame(this.scrollRAF);
    }

    this.scrollRAF = requestAnimationFrame(() => {
      this.render();
    });
  }

  handleResize(entries) {
    let needsUpdate = false;

    for (const entry of entries) {
      const index = parseInt(entry.target.dataset.index, 10);
      const newHeight = entry.contentRect.height;
      const cachedHeight = this.heightCache.get(index);

      if (cachedHeight !== newHeight) {
        this.heightCache.set(index, newHeight);
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      this.updatePositions();
      this.updateTotalHeight();
    }
  }

  updatePositions() {
    let currentTop = 0;

    for (let i = 0; i < this.positions.length; i++) {
      const height = this.heightCache.get(i) || this.estimatedItemHeight;
      this.positions[i] = {
        index: i,
        top: currentTop,
        bottom: currentTop + height,
        height: height
      };
      currentTop += height;
    }
  }

  render() {
    const { start, end } = this.getVisibleRange();

    // 清除前断开观察器
    this.resizeObserver.disconnect();
    while (this.innerContainer.firstChild) {
      this.innerContainer.removeChild(this.innerContainer.firstChild);
    }

    for (let i = start; i < end; i++) {
      const item = this.items[i];
      const position = this.positions[i];
      const element = this.renderItem(item, i);

      element.dataset.index = i;
      element.style.cssText = `
        position: absolute;
        top: ${position.top}px;
        left: 0;
        right: 0;
      `;

      this.innerContainer.appendChild(element);
      this.resizeObserver.observe(element);
    }
  }

  scrollToIndex(index, align = 'start') {
    if (index < 0 || index >= this.positions.length) return;

    const position = this.positions[index];
    const viewportHeight = this.container.clientHeight;

    let scrollTop;
    switch (align) {
      case 'start':
        scrollTop = position.top;
        break;
      case 'center':
        scrollTop = position.top - viewportHeight / 2 + position.height / 2;
        break;
      case 'end':
        scrollTop = position.bottom - viewportHeight;
        break;
      default:
        scrollTop = position.top;
    }

    this.container.scrollTop = Math.max(0, scrollTop);
  }

  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll);
    this.resizeObserver.disconnect();
    if (this.scrollRAF) {
      cancelAnimationFrame(this.scrollRAF);
    }
    this.innerContainer.remove();
  }
}
```

### DOM 池化提升性能

与其创建和销毁 DOM 元素，不如重用它们：

```javascript
class PooledVirtualList {
  constructor(options) {
    this.container = options.container;
    this.items = options.items;
    this.itemHeight = options.itemHeight;
    this.renderItem = options.renderItem;
    this.updateItem = options.updateItem;
    this.overscan = options.overscan || 3;

    // DOM 节点池
    this.pool = [];
    this.activeNodes = new Map(); // 索引 -> DOM 节点

    this.init();
  }

  init() {
    // 基于可见项目 + 超扫描计算池大小
    const visibleCount = Math.ceil(this.container.clientHeight / this.itemHeight);
    const poolSize = visibleCount + this.overscan * 2 + 5; // 额外缓冲

    // 预创建 DOM 节点
    for (let i = 0; i < poolSize; i++) {
      const node = this.createNode();
      this.pool.push(node);
    }

    this.totalHeight = this.items.length * this.itemHeight;

    this.innerContainer = document.createElement('div');
    this.innerContainer.style.cssText = `
      position: relative;
      height: ${this.totalHeight}px;
      width: 100%;
    `;
    this.container.appendChild(this.innerContainer);

    this.container.style.overflow = 'auto';
    this.container.addEventListener('scroll', this.handleScroll.bind(this));

    this.render();
  }

  createNode() {
    const node = document.createElement('div');
    node.className = 'virtual-list-item';
    node.style.cssText = `
      position: absolute;
      left: 0;
      right: 0;
      height: ${this.itemHeight}px;
    `;
    return node;
  }

  acquireNode() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    // 如果池为空则创建新节点（不应该经常发生）
    return this.createNode();
  }

  releaseNode(node) {
    node.style.display = 'none';
    this.pool.push(node);
  }

  getVisibleRange() {
    const scrollTop = this.container.scrollTop;
    const visibleCount = Math.ceil(this.container.clientHeight / this.itemHeight);
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + visibleCount + this.overscan * 2,
      this.items.length
    );

    return {
      start: Math.max(0, startIndex - this.overscan),
      end: endIndex
    };
  }

  handleScroll() {
    if (this.scrollRAF) {
      cancelAnimationFrame(this.scrollRAF);
    }

    this.scrollRAF = requestAnimationFrame(() => {
      this.render();
    });
  }

  render() {
    const { start, end } = this.getVisibleRange();
    const newActiveIndices = new Set();

    // 标记应该可见的索引
    for (let i = start; i < end; i++) {
      newActiveIndices.add(i);
    }

    // 释放不再可见的节点
    for (const [index, node] of this.activeNodes) {
      if (!newActiveIndices.has(index)) {
        this.releaseNode(node);
        this.activeNodes.delete(index);
      }
    }

    // 渲染或更新可见项目
    for (let i = start; i < end; i++) {
      const item = this.items[i];

      if (this.activeNodes.has(i)) {
        // 更新现有节点
        const node = this.activeNodes.get(i);
        if (this.updateItem) {
          this.updateItem(node, item, i);
        }
      } else {
        // 获取并渲染新节点
        const node = this.acquireNode();
        node.style.display = 'block';
        node.style.top = `${i * this.itemHeight}px`;

        this.renderItem(node, item, i);

        if (!node.parentElement) {
          this.innerContainer.appendChild(node);
        }

        this.activeNodes.set(i, node);
      }
    }
  }

  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll);
    if (this.scrollRAF) {
      cancelAnimationFrame(this.scrollRAF);
    }
    this.innerContainer.remove();
  }
}
```

## 高级技术

### 无限滚动与虚拟列表结合

将虚拟列表与数据获取结合实现无限滚动：

```javascript
class InfiniteVirtualList extends FixedHeightVirtualList {
  constructor(options) {
    super(options);

    this.loadMore = options.loadMore;
    this.hasMore = options.hasMore || (() => true);
    this.loadingThreshold = options.loadingThreshold || 5;
    this.isLoading = false;

    this.setupInfiniteScroll();
  }

  setupInfiniteScroll() {
    this.container.addEventListener('scroll', () => {
      this.checkLoadMore();
    });
  }

  async checkLoadMore() {
    if (this.isLoading || !this.hasMore()) return;

    const { end } = this.getVisibleRange();
    const remainingItems = this.items.length - end;

    if (remainingItems <= this.loadingThreshold) {
      this.isLoading = true;

      try {
        const newItems = await this.loadMore();
        if (newItems && newItems.length > 0) {
          this.items = [...this.items, ...newItems];
          this.totalHeight = this.items.length * this.itemHeight;
          this.innerContainer.style.height = `${this.totalHeight}px`;
          this.render();
        }
      } catch (error) {
        console.error('加载更多项目失败:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }
}

// 与 API 一起使用
let page = 1;
const infiniteList = new InfiniteVirtualList({
  container: document.getElementById('list-container'),
  items: [],
  itemHeight: 60,
  renderItem: (item) => {
    const div = document.createElement('div');
    const p = document.createElement('p');
    p.textContent = item.title;
    div.appendChild(p);
    return div;
  },
  loadMore: async () => {
    const response = await fetch(`/api/items?page=${page++}&limit=50`);
    return response.json();
  },
  hasMore: () => page <= 100
});

// 初始加载
infiniteList.loadMore();
```

### 虚拟网格布局

用于带虚拟滚动的网格布局：

```javascript
class VirtualGrid {
  constructor(options) {
    this.container = options.container;
    this.items = options.items;
    this.itemWidth = options.itemWidth;
    this.itemHeight = options.itemHeight;
    this.gap = options.gap || 0;
    this.renderItem = options.renderItem;
    this.overscan = options.overscan || 2; // 超扫描行数

    this.init();
  }

  init() {
    this.calculateLayout();

    this.innerContainer = document.createElement('div');
    this.innerContainer.style.cssText = `
      position: relative;
      width: 100%;
    `;
    this.updateTotalHeight();
    this.container.appendChild(this.innerContainer);

    this.container.style.overflow = 'auto';
    this.container.addEventListener('scroll', this.handleScroll.bind(this));

    // 调整大小时重新计算
    this.resizeObserver = new ResizeObserver(() => {
      this.calculateLayout();
      this.render();
    });
    this.resizeObserver.observe(this.container);

    this.render();
  }

  calculateLayout() {
    const containerWidth = this.container.clientWidth;
    this.columnsCount = Math.floor(
      (containerWidth + this.gap) / (this.itemWidth + this.gap)
    );
    this.columnsCount = Math.max(1, this.columnsCount);
    this.rowsCount = Math.ceil(this.items.length / this.columnsCount);
    this.rowHeight = this.itemHeight + this.gap;
  }

  updateTotalHeight() {
    const totalHeight = this.rowsCount * this.rowHeight;
    this.innerContainer.style.height = `${totalHeight}px`;
  }

  getVisibleRange() {
    const scrollTop = this.container.scrollTop;
    const viewportHeight = this.container.clientHeight;

    const startRow = Math.floor(scrollTop / this.rowHeight);
    const visibleRows = Math.ceil(viewportHeight / this.rowHeight);
    const endRow = startRow + visibleRows;

    const startIndex = Math.max(0, (startRow - this.overscan) * this.columnsCount);
    const endIndex = Math.min(
      this.items.length,
      (endRow + this.overscan + 1) * this.columnsCount
    );

    return { start: startIndex, end: endIndex };
  }

  getItemPosition(index) {
    const row = Math.floor(index / this.columnsCount);
    const col = index % this.columnsCount;

    return {
      top: row * this.rowHeight,
      left: col * (this.itemWidth + this.gap)
    };
  }

  handleScroll() {
    if (this.scrollRAF) {
      cancelAnimationFrame(this.scrollRAF);
    }

    this.scrollRAF = requestAnimationFrame(() => {
      this.render();
    });
  }

  render() {
    const { start, end } = this.getVisibleRange();

    while (this.innerContainer.firstChild) {
      this.innerContainer.removeChild(this.innerContainer.firstChild);
    }

    for (let i = start; i < end; i++) {
      const item = this.items[i];
      const { top, left } = this.getItemPosition(i);
      const element = this.renderItem(item, i);

      element.style.cssText = `
        position: absolute;
        top: ${top}px;
        left: ${left}px;
        width: ${this.itemWidth}px;
        height: ${this.itemHeight}px;
      `;

      this.innerContainer.appendChild(element);
    }
  }

  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll);
    this.resizeObserver.disconnect();
    if (this.scrollRAF) {
      cancelAnimationFrame(this.scrollRAF);
    }
    this.innerContainer.remove();
  }
}
```

### 水平虚拟列表

用于水平滚动场景：

```javascript
class HorizontalVirtualList {
  constructor(options) {
    this.container = options.container;
    this.items = options.items;
    this.itemWidth = options.itemWidth;
    this.renderItem = options.renderItem;
    this.overscan = options.overscan || 3;

    this.init();
  }

  init() {
    this.totalWidth = this.items.length * this.itemWidth;
    this.visibleCount = Math.ceil(this.container.clientWidth / this.itemWidth);

    this.innerContainer = document.createElement('div');
    this.innerContainer.style.cssText = `
      position: relative;
      width: ${this.totalWidth}px;
      height: 100%;
      display: inline-block;
    `;
    this.container.appendChild(this.innerContainer);

    this.container.style.overflow = 'auto';
    this.container.style.whiteSpace = 'nowrap';
    this.container.addEventListener('scroll', this.handleScroll.bind(this));

    this.render();
  }

  getVisibleRange() {
    const scrollLeft = this.container.scrollLeft;
    const startIndex = Math.floor(scrollLeft / this.itemWidth);
    const endIndex = Math.min(
      startIndex + this.visibleCount + this.overscan * 2,
      this.items.length
    );

    return {
      start: Math.max(0, startIndex - this.overscan),
      end: endIndex
    };
  }

  handleScroll() {
    if (this.scrollRAF) {
      cancelAnimationFrame(this.scrollRAF);
    }

    this.scrollRAF = requestAnimationFrame(() => {
      this.render();
    });
  }

  render() {
    const { start, end } = this.getVisibleRange();

    while (this.innerContainer.firstChild) {
      this.innerContainer.removeChild(this.innerContainer.firstChild);
    }

    for (let i = start; i < end; i++) {
      const item = this.items[i];
      const element = this.renderItem(item, i);

      element.style.cssText = `
        position: absolute;
        left: ${i * this.itemWidth}px;
        top: 0;
        bottom: 0;
        width: ${this.itemWidth}px;
      `;

      this.innerContainer.appendChild(element);
    }
  }

  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll);
    if (this.scrollRAF) {
      cancelAnimationFrame(this.scrollRAF);
    }
    this.innerContainer.remove();
  }
}
```

## 性能优化

### 防抖和节流

```javascript
// 滚动处理的工具函数
function throttle(fn, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 应用于虚拟列表
class OptimizedVirtualList {
  constructor(options) {
    // ...

    // 节流滚动处理器以获得更流畅的性能
    this.throttledRender = throttle(() => {
      this.render();
    }, 16); // ~60fps

    // 防抖调整大小处理器
    this.debouncedResize = debounce(() => {
      this.calculateLayout();
      this.render();
    }, 100);
  }

  handleScroll() {
    this.throttledRender();
  }

  handleResize() {
    this.debouncedResize();
  }
}
```

### 使用 Intersection Observer

```javascript
class IntersectionVirtualList {
  constructor(options) {
    this.container = options.container;
    this.items = options.items;
    this.renderItem = options.renderItem;
    this.itemHeight = options.itemHeight;

    this.visibleItems = new Set();
    this.init();
  }

  init() {
    // 为所有项目创建占位元素
    this.innerContainer = document.createElement('div');
    this.innerContainer.style.cssText = `
      position: relative;
      height: ${this.items.length * this.itemHeight}px;
    `;

    // 创建 Intersection Observer
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        root: this.container,
        rootMargin: '100px 0px', // 预加载上下 100px 的项目
        threshold: 0
      }
    );

    // 创建哨兵元素
    this.sentinels = [];
    for (let i = 0; i < this.items.length; i++) {
      const sentinel = document.createElement('div');
      sentinel.style.cssText = `
        position: absolute;
        top: ${i * this.itemHeight}px;
        height: ${this.itemHeight}px;
        width: 100%;
      `;
      sentinel.dataset.index = i;
      this.innerContainer.appendChild(sentinel);
      this.sentinels.push(sentinel);
      this.observer.observe(sentinel);
    }

    this.container.appendChild(this.innerContainer);
    this.container.style.overflow = 'auto';
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      const index = parseInt(entry.target.dataset.index, 10);

      if (entry.isIntersecting) {
        if (!this.visibleItems.has(index)) {
          this.visibleItems.add(index);
          this.renderItemAt(index);
        }
      } else {
        if (this.visibleItems.has(index)) {
          this.visibleItems.delete(index);
          this.clearItemAt(index);
        }
      }
    });
  }

  renderItemAt(index) {
    const sentinel = this.sentinels[index];
    const item = this.items[index];
    const element = this.renderItem(item, index);

    element.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    `;

    sentinel.appendChild(element);
  }

  clearItemAt(index) {
    const sentinel = this.sentinels[index];
    while (sentinel.firstChild) {
      sentinel.removeChild(sentinel.firstChild);
    }
  }

  destroy() {
    this.observer.disconnect();
    this.innerContainer.remove();
  }
}
```

### 内存管理

```javascript
class MemoryOptimizedVirtualList {
  constructor(options) {
    this.container = options.container;
    this.items = options.items;
    this.itemHeight = options.itemHeight;
    this.renderItem = options.renderItem;

    // 使用 WeakMap 存储 DOM 引用
    this.elementCache = new WeakMap();

    // 限制缓存大小
    this.maxCacheSize = options.maxCacheSize || 100;
    this.cacheQueue = [];

    this.init();
  }

  getCachedElement(item) {
    return this.elementCache.get(item);
  }

  setCachedElement(item, element) {
    if (this.cacheQueue.length >= this.maxCacheSize) {
      // 移除最旧的缓存项
      const oldest = this.cacheQueue.shift();
      this.elementCache.delete(oldest);
    }

    this.elementCache.set(item, element);
    this.cacheQueue.push(item);
  }

  render() {
    const { start, end } = this.getVisibleRange();

    while (this.innerContainer.firstChild) {
      this.innerContainer.removeChild(this.innerContainer.firstChild);
    }

    for (let i = start; i < end; i++) {
      const item = this.items[i];
      let element = this.getCachedElement(item);

      if (!element) {
        element = this.renderItem(item, i);
        this.setCachedElement(item, element);
      }

      element.style.top = `${i * this.itemHeight}px`;
      this.innerContainer.appendChild(element);
    }
  }

  // 当数据显著变化时清除缓存
  clearCache() {
    this.elementCache = new WeakMap();
    this.cacheQueue = [];
  }
}
```

## 框架集成

### React 虚拟列表 Hook

```javascript
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

function useVirtualList({
  items,
  itemHeight,
  overscan = 3,
  containerRef
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // 计算可见范围
  const { visibleItems, totalHeight, startOffset } = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const start = Math.max(0, startIndex - overscan);
    const end = Math.min(items.length, startIndex + visibleCount + overscan);

    return {
      visibleItems: items.slice(start, end).map((item, index) => ({
        item,
        index: start + index
      })),
      totalHeight: items.length * itemHeight,
      startOffset: start * itemHeight
    };
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  // 处理滚动
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // 处理调整大小
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(containerRef.current);
    setContainerHeight(containerRef.current.clientHeight);

    return () => observer.disconnect();
  }, [containerRef]);

  // 滚动到索引
  const scrollToIndex = useCallback((index, align = 'start') => {
    if (!containerRef.current) return;

    let offset;
    switch (align) {
      case 'start':
        offset = index * itemHeight;
        break;
      case 'center':
        offset = index * itemHeight - containerHeight / 2 + itemHeight / 2;
        break;
      case 'end':
        offset = (index + 1) * itemHeight - containerHeight;
        break;
      default:
        offset = index * itemHeight;
    }

    containerRef.current.scrollTop = Math.max(0, offset);
  }, [itemHeight, containerHeight, containerRef]);

  return {
    visibleItems,
    totalHeight,
    startOffset,
    handleScroll,
    scrollToIndex
  };
}

// 在 React 组件中使用
function VirtualList({ items, itemHeight, renderItem }) {
  const containerRef = useRef(null);

  const {
    visibleItems,
    totalHeight,
    startOffset,
    handleScroll,
    scrollToIndex
  } = useVirtualList({
    items,
    itemHeight,
    overscan: 5,
    containerRef
  });

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: '400px',
        overflow: 'auto'
      }}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: startOffset,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={item.id}
              style={{ height: itemHeight }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Vue 3 组合式函数

```javascript
import { ref, computed, onMounted, onUnmounted } from 'vue';

export function useVirtualList(options) {
  const { items, itemHeight, overscan = 3 } = options;

  const containerRef = ref(null);
  const scrollTop = ref(0);
  const containerHeight = ref(0);

  const visibleData = computed(() => {
    const visibleCount = Math.ceil(containerHeight.value / itemHeight);
    const startIndex = Math.floor(scrollTop.value / itemHeight);
    const start = Math.max(0, startIndex - overscan);
    const end = Math.min(items.value.length, startIndex + visibleCount + overscan);

    return {
      items: items.value.slice(start, end).map((item, index) => ({
        item,
        index: start + index
      })),
      totalHeight: items.value.length * itemHeight,
      startOffset: start * itemHeight
    };
  });

  function handleScroll(e) {
    scrollTop.value = e.target.scrollTop;
  }

  function scrollToIndex(index, align = 'start') {
    if (!containerRef.value) return;

    let offset;
    switch (align) {
      case 'start':
        offset = index * itemHeight;
        break;
      case 'center':
        offset = index * itemHeight - containerHeight.value / 2 + itemHeight / 2;
        break;
      case 'end':
        offset = (index + 1) * itemHeight - containerHeight.value;
        break;
      default:
        offset = index * itemHeight;
    }

    containerRef.value.scrollTop = Math.max(0, offset);
  }

  let resizeObserver;

  onMounted(() => {
    if (containerRef.value) {
      containerHeight.value = containerRef.value.clientHeight;

      resizeObserver = new ResizeObserver((entries) => {
        containerHeight.value = entries[0].contentRect.height;
      });
      resizeObserver.observe(containerRef.value);
    }
  });

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });

  return {
    containerRef,
    visibleData,
    handleScroll,
    scrollToIndex
  };
}
```

## 最佳实践

### 1. 始终使用键

```javascript
// 好：唯一且稳定的键
items.map((item, index) => ({
  ...item,
  key: item.id // 使用稳定标识符
}));

// 差：使用索引作为键
items.map((item, index) => ({
  ...item,
  key: index // 项目移动时会改变
}));
```

### 2. 优化项目渲染

```javascript
// 好：记忆化渲染函数
const renderItem = useMemo(() => {
  return (item, index) => (
    <MemoizedListItem key={item.id} item={item} />
  );
}, []);

// 好：使用 CSS containment
// .list-item {
//   contain: content; /* 隔离布局和绑定 */
// }
```

### 3. 正确处理动态高度

```javascript
// 渲染后测量
useEffect(() => {
  if (itemRef.current) {
    const height = itemRef.current.getBoundingClientRect().height;
    onMeasure(index, height);
  }
}, [item]); // 项目改变时重新测量
```

### 4. 实现适当的加载状态

```javascript
function VirtualList({ items, isLoading }) {
  return (
    <div className="virtual-list">
      {visibleItems.map(({ item, index }) => (
        <ListItem key={item.id} item={item} />
      ))}

      {isLoading && (
        <div className="loading-indicator">
          加载中...
        </div>
      )}
    </div>
  );
}
```

### 5. 无障碍考虑

```javascript
function AccessibleVirtualList({ items, itemHeight }) {
  return (
    <div
      role="list"
      aria-label="虚拟列表"
      aria-rowcount={items.length}
    >
      {visibleItems.map(({ item, index }) => (
        <div
          key={item.id}
          role="listitem"
          aria-rowindex={index + 1}
          aria-setsize={items.length}
          tabIndex={0}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
```

## 常见陷阱

### 1. 忘记恢复滚动位置

```javascript
// 问题：数据更新后滚动位置丢失
function updateItems(newItems) {
  const scrollTop = container.scrollTop;
  this.items = newItems;
  this.render();
  container.scrollTop = scrollTop; // 恢复滚动位置
}
```

### 2. 不处理空状态

```javascript
render() {
  if (this.items.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = '暂无数据';
    while (this.innerContainer.firstChild) {
      this.innerContainer.removeChild(this.innerContainer.firstChild);
    }
    this.innerContainer.appendChild(emptyState);
    return;
  }

  // ... 正常渲染
}
```

### 3. 事件监听器导致的内存泄漏

```javascript
class VirtualList {
  destroy() {
    // 始终清理！
    this.container.removeEventListener('scroll', this.handleScroll);
    this.resizeObserver?.disconnect();
    cancelAnimationFrame(this.scrollRAF);
    this.innerContainer?.remove();
  }
}
```

### 4. 未考虑动态内容

```javascript
// 问题：图片加载改变项目高度
function renderItem(item) {
  const img = new Image();
  img.onload = () => {
    // 图片加载后重新计算高度
    this.measureItem(item.index);
  };
  img.src = item.imageUrl;
}
```

## 面试要点

### 常见问题

**问：什么是虚拟列表，为什么它有用？**

答：虚拟列表只渲染视口中可见的 DOM 元素，加上一个小缓冲区（overscan）。这在处理大型数据集时大大减少了内存使用并提高了性能，因为：
- 更少的 DOM 节点意味着更少的内存消耗
- 浏览器的布局和绑定工作更少
- 无论项目总数多少，渲染时间都是恒定的

**问：虚拟列表如何计算要渲染哪些项目？**

答：计算涉及：
1. 确定滚动位置
2. 根据滚动位置和项目高度计算起始索引
3. 计算视口中可以容纳多少项目
4. 在上下添加 overscan 项目以实现更流畅的滚动
5. 仅渲染此范围内的项目，使用绝对定位

**问：如何处理可变高度项目？**

答：几种方法：
1. 初始渲染后测量项目并缓存高度
2. 使用 ResizeObserver 检测高度变化
3. 维护累积位置数组用于二分搜索
4. 最初使用估算高度，然后用测量值更新

**问：什么是 DOM 池化，为什么使用它？**

答：DOM 池化重用现有 DOM 元素而不是创建/销毁它们：
- 减少垃圾回收开销
- 避免 DOM 创建成本
- 提供更流畅的滚动
- 元素被移动和更新而不是重新创建

### 性能指标

| 指标 | 目标 | 如何实现 |
|------|------|----------|
| 初始渲染 | < 100ms | 仅渲染可见项目 |
| 滚动 FPS | 60 fps | 使用 requestAnimationFrame，CSS containment |
| 内存使用 | 恒定 | DOM 池化，限制缓存大小 |
| 可交互时间 | < 1s | 延迟加载图片，推迟非关键内容 |

## 总结

虚拟列表是处理 Web 应用中大型数据集的必要技术。关键要点：

1. **核心概念**：仅渲染可见项目加上小缓冲区
2. **固定高度**：更简单的实现，恒定时间计算
3. **可变高度**：需要高度测量和位置缓存
4. **DOM 池化**：重用元素以获得更好的性能
5. **框架集成**：大多数框架都有虚拟列表解决方案
6. **无障碍**：不要忘记 ARIA 属性和键盘导航

实现虚拟列表时，始终考虑：
- 数据的具体要求（固定与可变高度）
- 性能要求（滚动流畅度，内存限制）
- 用户体验（加载状态，滚动恢复）
- 无障碍需求

## 延伸阅读

### 库

- [react-window](https://github.com/bvaughn/react-window) - React 虚拟列表库
- [react-virtualized](https://github.com/bvaughn/react-virtualized) - 全功能虚拟化
- [@tanstack/virtual](https://tanstack.com/virtual/latest) - 框架无关的虚拟滚动
- [vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller) - Vue 虚拟滚动

### 资源

- [Web.dev - 虚拟化长列表](https://web.dev/virtualize-long-lists-react-window/)
- [浏览器渲染性能](https://web.dev/rendering-performance/)
- [布局包含](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment)
