---
title: Virtual List Optimization Techniques
description: Master virtual list implementation for rendering large datasets efficiently in JavaScript applications
track: frontend
section: performance
difficulty: intermediate
tags:
  - Virtual List
  - Performance
  - Optimization
  - Windowing
  - Large Datasets
  - DOM Optimization
status: imported
origin: old/src/content/docs/javascript/virtual-list.en.md
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

Virtual list (also known as windowing or virtualization) is a powerful technique for efficiently rendering large lists by only mounting DOM elements that are currently visible in the viewport. Instead of rendering thousands of items at once, a virtual list renders only what the user can see, dramatically improving performance and reducing memory consumption.

## Why Virtual Lists Matter

When dealing with large datasets in web applications, rendering thousands of DOM elements can cause severe performance issues:

| Problem | Impact | Traditional Approach | Virtual List Solution |
|---------|--------|---------------------|----------------------|
| Initial render time | Multiple seconds for 10,000+ items | Show loading spinner | Instant render of visible items |
| Memory consumption | Hundreds of MB for large lists | Pagination | Constant memory usage |
| Scroll performance | Laggy, janky scrolling | Reduce item count | Smooth 60fps scrolling |
| DOM size | Browser becomes unresponsive | Limit list size | Minimal DOM nodes |

### The Core Problem

```javascript
// Traditional approach: Render ALL items
function renderList(items) {
  const container = document.getElementById('list');

  // Creating 10,000+ DOM nodes is expensive!
  items.forEach(item => {
    const div = document.createElement('div');
    div.textContent = item.name;
    div.className = 'list-item';
    container.appendChild(div);
  });
}

// With 10,000 items, this creates 10,000 DOM nodes
// Browser must:
// 1. Allocate memory for each node
// 2. Calculate layout for all nodes
// 3. Paint all nodes (even invisible ones)
// 4. Keep all nodes in memory during scroll
```

### Virtual List Solution

```javascript
// Virtual list: Render ONLY visible items
function renderVirtualList(items, containerHeight, itemHeight) {
  const container = document.getElementById('list');
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const scrollTop = container.scrollTop;
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);

  // Only create DOM nodes for visible items!
  // For a 500px container with 50px items, that's only ~11 nodes
  for (let i = startIndex; i < endIndex; i++) {
    const div = document.createElement('div');
    div.textContent = items[i].name;
    div.style.position = 'absolute';
    div.style.top = `${i * itemHeight}px`;
    container.appendChild(div);
  }
}
```

## Core Concepts

### Fixed Height Virtual List

The simplest form of virtual list assumes all items have the same height:

```javascript
class FixedHeightVirtualList {
  constructor(options) {
    this.container = options.container;
    this.items = options.items;
    this.itemHeight = options.itemHeight;
    this.renderItem = options.renderItem;
    this.overscan = options.overscan || 3; // Extra items to render above/below

    this.totalHeight = this.items.length * this.itemHeight;
    this.visibleCount = Math.ceil(this.container.clientHeight / this.itemHeight);

    this.init();
  }

  init() {
    // Create inner container for total scroll height
    this.innerContainer = document.createElement('div');
    this.innerContainer.style.cssText = `
      position: relative;
      height: ${this.totalHeight}px;
      width: 100%;
    `;
    this.container.appendChild(this.innerContainer);

    // Set up scroll listener with throttling
    this.container.style.overflow = 'auto';
    this.container.addEventListener('scroll', this.handleScroll.bind(this));

    // Initial render
    this.render();
  }

  handleScroll() {
    // Use requestAnimationFrame for smooth updates
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

    // Clear previous items
    while (this.innerContainer.firstChild) {
      this.innerContainer.removeChild(this.innerContainer.firstChild);
    }

    // Render visible items
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

  // Update items dynamically
  setItems(newItems) {
    this.items = newItems;
    this.totalHeight = newItems.length * this.itemHeight;
    this.innerContainer.style.height = `${this.totalHeight}px`;
    this.render();
  }

  // Scroll to specific index
  scrollToIndex(index) {
    const offset = index * this.itemHeight;
    this.container.scrollTop = offset;
  }

  // Clean up
  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll);
    if (this.scrollRAF) {
      cancelAnimationFrame(this.scrollRAF);
    }
    this.innerContainer.remove();
  }
}

// Usage
const virtualList = new FixedHeightVirtualList({
  container: document.getElementById('list-container'),
  items: Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: `Description for item ${i}`
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

### Variable Height Virtual List

When items have different heights, we need a more sophisticated approach:

```javascript
class VariableHeightVirtualList {
  constructor(options) {
    this.container = options.container;
    this.items = options.items;
    this.estimatedItemHeight = options.estimatedItemHeight || 50;
    this.renderItem = options.renderItem;
    this.overscan = options.overscan || 3;

    // Cache for measured heights
    this.heightCache = new Map();
    // Cumulative heights for binary search
    this.positions = [];

    this.init();
  }

  init() {
    // Initialize position estimates
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

    // Use ResizeObserver to detect item height changes
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

  // Binary search to find start index
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

  // Find end index based on viewport
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

    // Disconnect observer before clearing
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

### DOM Pooling for Better Performance

Instead of creating and destroying DOM elements, reuse them:

```javascript
class PooledVirtualList {
  constructor(options) {
    this.container = options.container;
    this.items = options.items;
    this.itemHeight = options.itemHeight;
    this.renderItem = options.renderItem;
    this.updateItem = options.updateItem;
    this.overscan = options.overscan || 3;

    // DOM node pool
    this.pool = [];
    this.activeNodes = new Map(); // index -> DOM node

    this.init();
  }

  init() {
    // Calculate pool size based on visible items + overscan
    const visibleCount = Math.ceil(this.container.clientHeight / this.itemHeight);
    const poolSize = visibleCount + this.overscan * 2 + 5; // Extra buffer

    // Pre-create DOM nodes
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
    // Create new node if pool is empty (shouldn't happen often)
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

    // Mark indices that should be visible
    for (let i = start; i < end; i++) {
      newActiveIndices.add(i);
    }

    // Release nodes that are no longer visible
    for (const [index, node] of this.activeNodes) {
      if (!newActiveIndices.has(index)) {
        this.releaseNode(node);
        this.activeNodes.delete(index);
      }
    }

    // Render or update visible items
    for (let i = start; i < end; i++) {
      const item = this.items[i];

      if (this.activeNodes.has(i)) {
        // Update existing node
        const node = this.activeNodes.get(i);
        if (this.updateItem) {
          this.updateItem(node, item, i);
        }
      } else {
        // Acquire and render new node
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

// Usage
const pooledList = new PooledVirtualList({
  container: document.getElementById('list-container'),
  items: generateLargeDataset(100000),
  itemHeight: 60,
  overscan: 5,
  renderItem: (node, item, index) => {
    // Clear previous content safely
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'item-content';

    const img = document.createElement('img');
    img.src = item.avatar;
    img.alt = item.name;
    img.loading = 'lazy';

    const infoDiv = document.createElement('div');
    infoDiv.className = 'item-info';

    const h4 = document.createElement('h4');
    h4.textContent = item.name;

    const p = document.createElement('p');
    p.textContent = item.description;

    infoDiv.appendChild(h4);
    infoDiv.appendChild(p);
    contentDiv.appendChild(img);
    contentDiv.appendChild(infoDiv);
    node.appendChild(contentDiv);
  },
  updateItem: (node, item, index) => {
    // Efficient partial updates
    const nameEl = node.querySelector('h4');
    if (nameEl && nameEl.textContent !== item.name) {
      nameEl.textContent = item.name;
    }
  }
});
```

## Advanced Techniques

### Infinite Scrolling with Virtual List

Combine virtual list with data fetching for infinite scroll:

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
        console.error('Failed to load more items:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }
}

// Usage with API
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

// Initial load
infiniteList.loadMore();
```

### Virtual Grid Layout

For grid layouts with virtual scrolling:

```javascript
class VirtualGrid {
  constructor(options) {
    this.container = options.container;
    this.items = options.items;
    this.itemWidth = options.itemWidth;
    this.itemHeight = options.itemHeight;
    this.gap = options.gap || 0;
    this.renderItem = options.renderItem;
    this.overscan = options.overscan || 2; // Rows to overscan

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

    // Recalculate on resize
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

// Usage
const virtualGrid = new VirtualGrid({
  container: document.getElementById('grid-container'),
  items: generateImageData(10000),
  itemWidth: 200,
  itemHeight: 200,
  gap: 16,
  overscan: 3,
  renderItem: (item, index) => {
    const div = document.createElement('div');
    div.className = 'grid-item';

    const img = document.createElement('img');
    img.src = item.thumbnail;
    img.alt = item.title;
    img.loading = 'lazy';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'grid-item-title';
    titleDiv.textContent = item.title;

    div.appendChild(img);
    div.appendChild(titleDiv);
    return div;
  }
});
```

### Horizontal Virtual List

For horizontal scrolling scenarios:

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

### Bidirectional Virtual List

For chat-like interfaces that can scroll in both directions:

```javascript
class BidirectionalVirtualList {
  constructor(options) {
    this.container = options.container;
    this.items = options.items;
    this.estimatedItemHeight = options.estimatedItemHeight || 50;
    this.renderItem = options.renderItem;
    this.loadOlder = options.loadOlder;
    this.loadNewer = options.loadNewer;
    this.overscan = options.overscan || 5;

    this.heightCache = new Map();
    this.positions = [];
    this.isLoadingOlder = false;
    this.isLoadingNewer = false;
    this.anchorIndex = null;
    this.anchorOffset = 0;

    this.init();
  }

  init() {
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

    this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));

    // Scroll to bottom initially (common for chat)
    this.scrollToEnd();
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

  async handleScroll() {
    const scrollTop = this.container.scrollTop;
    const scrollHeight = this.container.scrollHeight;
    const clientHeight = this.container.clientHeight;

    // Check if near top (load older)
    if (scrollTop < 100 && !this.isLoadingOlder && this.loadOlder) {
      this.isLoadingOlder = true;
      this.saveScrollAnchor();

      try {
        const olderItems = await this.loadOlder();
        if (olderItems && olderItems.length > 0) {
          this.prependItems(olderItems);
        }
      } finally {
        this.isLoadingOlder = false;
      }
    }

    // Check if near bottom (load newer)
    if (scrollTop + clientHeight > scrollHeight - 100 && !this.isLoadingNewer && this.loadNewer) {
      this.isLoadingNewer = true;

      try {
        const newerItems = await this.loadNewer();
        if (newerItems && newerItems.length > 0) {
          this.appendItems(newerItems);
        }
      } finally {
        this.isLoadingNewer = false;
      }
    }

    if (this.scrollRAF) {
      cancelAnimationFrame(this.scrollRAF);
    }

    this.scrollRAF = requestAnimationFrame(() => {
      this.render();
    });
  }

  saveScrollAnchor() {
    const scrollTop = this.container.scrollTop;
    const startIndex = this.findStartIndex(scrollTop);

    if (startIndex >= 0 && this.positions[startIndex]) {
      this.anchorIndex = startIndex;
      this.anchorOffset = scrollTop - this.positions[startIndex].top;
    }
  }

  restoreScrollAnchor(addedCount) {
    if (this.anchorIndex !== null) {
      const newIndex = this.anchorIndex + addedCount;
      const position = this.positions[newIndex];

      if (position) {
        this.container.scrollTop = position.top + this.anchorOffset;
      }

      this.anchorIndex = null;
    }
  }

  prependItems(newItems) {
    const addedCount = newItems.length;

    // Update height cache indices
    const newHeightCache = new Map();
    for (const [index, height] of this.heightCache) {
      newHeightCache.set(index + addedCount, height);
    }
    this.heightCache = newHeightCache;

    // Prepend items
    this.items = [...newItems, ...this.items];
    this.initPositions();
    this.updateTotalHeight();
    this.restoreScrollAnchor(addedCount);
    this.render();
  }

  appendItems(newItems) {
    this.items = [...this.items, ...newItems];
    this.initPositions();
    this.updateTotalHeight();
    this.render();
  }

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
      this.initPositions();
      this.updateTotalHeight();
    }
  }

  render() {
    const scrollTop = this.container.scrollTop;
    const viewportHeight = this.container.clientHeight;

    const startIndex = Math.max(0, this.findStartIndex(scrollTop) - this.overscan);
    const viewportBottom = scrollTop + viewportHeight;
    let endIndex = startIndex;

    while (endIndex < this.positions.length && this.positions[endIndex].top < viewportBottom) {
      endIndex++;
    }
    endIndex = Math.min(endIndex + this.overscan, this.positions.length);

    this.resizeObserver.disconnect();
    while (this.innerContainer.firstChild) {
      this.innerContainer.removeChild(this.innerContainer.firstChild);
    }

    for (let i = startIndex; i < endIndex; i++) {
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

  scrollToEnd() {
    this.container.scrollTop = this.container.scrollHeight;
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

## Performance Optimization

### Debouncing and Throttling

```javascript
// Utility functions for scroll handling
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

// Apply to virtual list
class OptimizedVirtualList {
  constructor(options) {
    // ...

    // Throttle scroll handler for smoother performance
    this.throttledRender = throttle(() => {
      this.render();
    }, 16); // ~60fps

    // Debounce resize handler
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

### Using Intersection Observer

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
    // Create placeholder elements for all items
    this.innerContainer = document.createElement('div');
    this.innerContainer.style.cssText = `
      position: relative;
      height: ${this.items.length * this.itemHeight}px;
    `;

    // Create intersection observer
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        root: this.container,
        rootMargin: '100px 0px', // Pre-load items 100px above/below
        threshold: 0
      }
    );

    // Create sentinel elements
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

### Memory Management

```javascript
class MemoryOptimizedVirtualList {
  constructor(options) {
    this.container = options.container;
    this.items = options.items;
    this.itemHeight = options.itemHeight;
    this.renderItem = options.renderItem;

    // Use WeakMap for DOM references
    this.elementCache = new WeakMap();

    // Limit cache size
    this.maxCacheSize = options.maxCacheSize || 100;
    this.cacheQueue = [];

    this.init();
  }

  getCachedElement(item) {
    return this.elementCache.get(item);
  }

  setCachedElement(item, element) {
    if (this.cacheQueue.length >= this.maxCacheSize) {
      // Remove oldest cached item
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

  // Clear cache when data changes significantly
  clearCache() {
    this.elementCache = new WeakMap();
    this.cacheQueue = [];
  }
}
```

## Framework Integrations

### React Virtual List Hook

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

  // Calculate visible range
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

  // Handle scroll
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Handle resize
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

  // Scroll to index
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

// Usage in React component
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

### Vue 3 Composable

```javascript
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

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

## Best Practices

### 1. Always Use Keys

```javascript
// Good: Unique and stable keys
items.map((item, index) => ({
  ...item,
  key: item.id // Use stable identifier
}));

// Bad: Using index as key
items.map((item, index) => ({
  ...item,
  key: index // Changes when items shift
}));
```

### 2. Optimize Item Rendering

```javascript
// Good: Memoize render function
const renderItem = useMemo(() => {
  return (item, index) => (
    <MemoizedListItem key={item.id} item={item} />
  );
}, []);

// Good: Use CSS containment
// .list-item {
//   contain: content; /* Isolates layout and paint */
// }
```

### 3. Handle Dynamic Heights Properly

```javascript
// Measure after render
useEffect(() => {
  if (itemRef.current) {
    const height = itemRef.current.getBoundingClientRect().height;
    onMeasure(index, height);
  }
}, [item]); // Re-measure when item changes
```

### 4. Implement Proper Loading States

```javascript
function VirtualList({ items, isLoading }) {
  return (
    <div className="virtual-list">
      {visibleItems.map(({ item, index }) => (
        <ListItem key={item.id} item={item} />
      ))}

      {isLoading && (
        <div className="loading-indicator">
          Loading more...
        </div>
      )}
    </div>
  );
}
```

### 5. Accessibility Considerations

```javascript
function AccessibleVirtualList({ items, itemHeight }) {
  return (
    <div
      role="list"
      aria-label="Virtual list"
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

## Common Pitfalls

### 1. Forgetting Scroll Restoration

```javascript
// Problem: Scroll position lost after data update
function updateItems(newItems) {
  const scrollTop = container.scrollTop;
  this.items = newItems;
  this.render();
  container.scrollTop = scrollTop; // Restore scroll position
}
```

### 2. Not Handling Empty States

```javascript
render() {
  if (this.items.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No items';
    while (this.innerContainer.firstChild) {
      this.innerContainer.removeChild(this.innerContainer.firstChild);
    }
    this.innerContainer.appendChild(emptyState);
    return;
  }

  // ... normal rendering
}
```

### 3. Memory Leaks from Event Listeners

```javascript
class VirtualList {
  destroy() {
    // Always clean up!
    this.container.removeEventListener('scroll', this.handleScroll);
    this.resizeObserver?.disconnect();
    cancelAnimationFrame(this.scrollRAF);
    this.innerContainer?.remove();
  }
}
```

### 4. Not Accounting for Dynamic Content

```javascript
// Problem: Images loading changes item height
function renderItem(item) {
  const img = new Image();
  img.onload = () => {
    // Recalculate heights after image loads
    this.measureItem(item.index);
  };
  img.src = item.imageUrl;
}
```

## Interview Key Points

### Common Questions

**Q: What is a virtual list and why is it useful?**

A: A virtual list renders only the DOM elements that are visible in the viewport, plus a small buffer (overscan). This dramatically reduces memory usage and improves performance when dealing with large datasets because:
- Fewer DOM nodes mean less memory consumption
- Less layout and paint work for the browser
- Constant rendering time regardless of total item count

**Q: How does a virtual list calculate which items to render?**

A: The calculation involves:
1. Determining the scroll position
2. Calculating the start index based on scroll position and item height
3. Calculating how many items fit in the viewport
4. Adding overscan items above and below for smoother scrolling
5. Rendering only items within this range with absolute positioning

**Q: How do you handle variable height items?**

A: Several approaches:
1. Measure items after initial render and cache heights
2. Use ResizeObserver to detect height changes
3. Maintain a cumulative position array for binary search
4. Use estimated heights initially, then update with measured values

**Q: What is DOM pooling and why use it?**

A: DOM pooling reuses existing DOM elements instead of creating/destroying them:
- Reduces garbage collection overhead
- Avoids DOM creation cost
- Provides smoother scrolling
- Elements are moved and updated rather than recreated

### Performance Metrics

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| Initial render | < 100ms | Render only visible items |
| Scroll FPS | 60 fps | Use requestAnimationFrame, CSS containment |
| Memory usage | Constant | DOM pooling, limit cache size |
| Time to interactive | < 1s | Lazy load images, defer non-critical |

## Summary

Virtual list is an essential technique for handling large datasets in web applications. Key takeaways:

1. **Core Concept**: Only render visible items plus a small buffer
2. **Fixed Height**: Simpler implementation with constant-time calculations
3. **Variable Height**: Requires height measurement and position caching
4. **DOM Pooling**: Reuse elements for better performance
5. **Framework Integration**: Most frameworks have virtual list solutions
6. **Accessibility**: Don't forget ARIA attributes and keyboard navigation

When implementing virtual lists, always consider:
- The specific requirements of your data (fixed vs variable height)
- Performance requirements (scroll smoothness, memory limits)
- User experience (loading states, scroll restoration)
- Accessibility needs

## Further Reading

### Libraries

- [react-window](https://github.com/bvaughn/react-window) - React virtual list library
- [react-virtualized](https://github.com/bvaughn/react-virtualized) - Full-featured virtualization
- [@tanstack/virtual](https://tanstack.com/virtual/latest) - Framework-agnostic virtual scrolling
- [vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller) - Vue virtual scrolling

### Resources

- [Web.dev - Virtualize Long Lists](https://web.dev/virtualize-long-lists-react-window/)
- [Browser Rendering Performance](https://web.dev/rendering-performance/)
- [Layout Containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment)
