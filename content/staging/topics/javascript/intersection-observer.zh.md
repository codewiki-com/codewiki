---
title: Intersection Observer
description: JavaScript Intersection Observer API 完全指南，元素可见性检测、懒加载、无限滚动实现与性能优化
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - Intersection Observer
  - 懒加载
  - 无限滚动
  - 性能优化
status: imported
origin: old/src/content/docs/javascript/intersection-observer.zh.md
divergence: 0.17
issues:
  - title-lang-zh
  - missing-subcategory-en
  - order-mismatch
  - title-language
legacy:
  category: JavaScript
  subcategory: 浏览器API
  order: 11
  lastUpdated: 2026-01-07
---

## 概念解释

Intersection Observer API 提供了一种异步检测目标元素与祖先元素或顶级文档视口（viewport）交叉状态变化的方法。简单来说，它能够高效地观察一个元素是否进入或离开了可视区域。

### 历史背景

在 Intersection Observer 出现之前，检测元素可见性需要使用以下方法：

```javascript
// 传统方式：监听 scroll 事件
window.addEventListener('scroll', () => {
  const rect = element.getBoundingClientRect();
  const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
  // 处理可见性变化...
});
```

这种方式存在严重的性能问题：
- `scroll` 事件触发频率极高，每秒可能触发数十次
- `getBoundingClientRect()` 会触发浏览器回流（reflow）
- 需要手动实现节流（throttle）或防抖（debounce）
- 同时监听多个元素时性能急剧下降

Intersection Observer API 于 2016 年被提出，2017 年开始在主流浏览器中实现，彻底解决了上述问题。

### 解决的问题

- **懒加载图片和内容**：只在元素即将进入视口时才加载
- **无限滚动**：当用户滚动到底部时加载更多内容
- **广告曝光统计**：准确记录广告是否被用户看到
- **动画触发**：元素进入视口时触发动画效果
- **视频播放控制**：进入视口播放，离开时暂停

---

## 核心原理

### 工作机制

Intersection Observer 运行在浏览器的主线程之外，采用异步回调的方式通知开发者交叉状态的变化。

```
┌─────────────────────────────────────────────────────────┐
│                      浏览器渲染进程                       │
│  ┌─────────────────┐    ┌────────────────────────────┐  │
│  │    主线程        │    │   Intersection Observer    │  │
│  │                 │    │        (异步监控)           │  │
│  │  JavaScript     │◄───│   检测交叉状态变化          │  │
│  │  执行           │    │   计算交叉比例              │  │
│  │                 │    │   触发回调                  │  │
│  └─────────────────┘    └────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 核心概念

#### Root（根元素）

观察目标元素相对于哪个容器的可见性：

```javascript
// 默认为浏览器视口
const observer = new IntersectionObserver(callback);

// 指定自定义容器
const observer = new IntersectionObserver(callback, {
  root: document.querySelector('.scroll-container')
});
```

#### Root Margin（根边距）

扩大或缩小根元素的判定区域：

```javascript
const observer = new IntersectionObserver(callback, {
  // 类似 CSS margin，可以是负值
  rootMargin: '50px 0px 50px 0px' // 上 右 下 左
});
```

```
         rootMargin: '100px'
         ┌─────────────────────┐
         │                     │  ← 扩展后的判定区域
         │  ┌───────────────┐  │
         │  │               │  │
         │  │   Viewport    │  │  ← 实际视口
         │  │               │  │
         │  └───────────────┘  │
         │                     │
         └─────────────────────┘
```

#### Threshold（阈值）

触发回调的交叉比例：

```javascript
const observer = new IntersectionObserver(callback, {
  // 单个阈值：元素 50% 可见时触发
  threshold: 0.5
});

const observer = new IntersectionObserver(callback, {
  // 多个阈值：分别在 0%, 25%, 50%, 75%, 100% 时触发
  threshold: [0, 0.25, 0.5, 0.75, 1.0]
});
```

### 交叉比例计算

交叉比例（intersectionRatio）= 交叉区域面积 / 目标元素面积

```
目标元素 50% 进入视口：
┌──────────────────────────┐
│        Viewport          │
│                          │
│    ┌──────────────┐      │
│    │              │      │  intersectionRatio = 0.5
│    │   Target     │      │
│────┼──────────────┼──────│
     │   (50% 可见)  │
     └──────────────┘
```

---

## 核心要点

### IntersectionObserver 构造函数

```javascript
const observer = new IntersectionObserver(callback, options);
```

#### callback 参数

```javascript
function callback(entries, observer) {
  entries.forEach(entry => {
    // entry 包含以下属性：
    console.log(entry.target);           // 被观察的目标元素
    console.log(entry.isIntersecting);   // 是否正在交叉（可见）
    console.log(entry.intersectionRatio); // 交叉比例 (0-1)
    console.log(entry.boundingClientRect); // 目标元素的边界信息
    console.log(entry.intersectionRect);   // 交叉区域的边界信息
    console.log(entry.rootBounds);         // 根元素的边界信息
    console.log(entry.time);               // 时间戳
  });
}
```

#### options 参数

```javascript
const options = {
  root: null,              // 根元素，null 表示视口
  rootMargin: '0px',       // 根边距
  threshold: 0             // 阈值，可以是数字或数组
};
```

### 实例方法

```javascript
// 开始观察目标元素
observer.observe(targetElement);

// 停止观察目标元素
observer.unobserve(targetElement);

// 停止观察所有元素并断开连接
observer.disconnect();

// 立即获取所有被观察元素的交叉信息
const entries = observer.takeRecords();
```

### IntersectionObserverEntry 对象

| 属性 | 类型 | 说明 |
|------|------|------|
| target | Element | 被观察的目标 DOM 元素 |
| isIntersecting | boolean | 目标元素是否与根元素交叉 |
| intersectionRatio | number | 交叉比例，范围 0-1 |
| boundingClientRect | DOMRectReadOnly | 目标元素的矩形边界 |
| intersectionRect | DOMRectReadOnly | 交叉区域的矩形边界 |
| rootBounds | DOMRectReadOnly | 根元素的矩形边界 |
| time | DOMHighResTimeStamp | 记录交叉变化的时间 |

---

## 代码示例

### 基础用法

```javascript
// 创建观察者
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      console.log('元素进入视口:', entry.target);
      entry.target.classList.add('visible');
    } else {
      console.log('元素离开视口:', entry.target);
      entry.target.classList.remove('visible');
    }
  });
});

// 观察目标元素
const targets = document.querySelectorAll('.observe-me');
targets.forEach(target => observer.observe(target));

// 清理
// observer.disconnect();
```

### 图片懒加载

```html
<img class="lazy" data-src="image1.jpg" alt="图片1">
<img class="lazy" data-src="image2.jpg" alt="图片2">
<img class="lazy" data-src="image3.jpg" alt="图片3">
```

```javascript
// 懒加载图片
const lazyImageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;

      // 设置真实图片地址
      img.src = img.dataset.src;

      // 加载完成后移除占位类
      img.onload = () => {
        img.classList.remove('lazy');
        img.classList.add('loaded');
      };

      // 停止观察已加载的图片
      observer.unobserve(img);
    }
  });
}, {
  // 提前 200px 开始加载
  rootMargin: '200px 0px'
});

// 观察所有懒加载图片
document.querySelectorAll('img.lazy').forEach(img => {
  lazyImageObserver.observe(img);
});
```

```css
/* 懒加载图片样式 */
img.lazy {
  opacity: 0;
  transition: opacity 0.3s ease;
}

img.loaded {
  opacity: 1;
}
```

### 无限滚动

```html
<div class="content-list">
  <!-- 动态内容 -->
</div>
<div class="loading-sentinel">加载中...</div>
```

```javascript
class InfiniteScroll {
  constructor(options) {
    this.container = options.container;
    this.sentinel = options.sentinel;
    this.loadMore = options.loadMore;
    this.isLoading = false;
    this.hasMore = true;

    this.setupObserver();
  }

  setupObserver() {
    this.observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0];

      if (entry.isIntersecting && !this.isLoading && this.hasMore) {
        await this.handleLoadMore();
      }
    }, {
      rootMargin: '100px' // 提前 100px 触发加载
    });

    this.observer.observe(this.sentinel);
  }

  async handleLoadMore() {
    this.isLoading = true;
    this.sentinel.textContent = '加载中...';

    try {
      const { items, hasMore } = await this.loadMore();

      // 添加新内容
      items.forEach(item => {
        const element = this.createItemElement(item);
        this.container.appendChild(element);
      });

      this.hasMore = hasMore;

      if (!hasMore) {
        this.sentinel.textContent = '没有更多内容了';
        this.observer.disconnect();
      }
    } catch (error) {
      console.error('加载失败:', error);
      this.sentinel.textContent = '加载失败，请重试';
    } finally {
      this.isLoading = false;
    }
  }

  createItemElement(item) {
    const div = document.createElement('div');
    div.className = 'content-item';
    // 使用 textContent 设置文本内容，避免 XSS
    const title = document.createElement('h3');
    title.textContent = item.title;
    const desc = document.createElement('p');
    desc.textContent = item.description;
    div.appendChild(title);
    div.appendChild(desc);
    return div;
  }

  destroy() {
    this.observer.disconnect();
  }
}

// 使用示例
let page = 1;

const infiniteScroll = new InfiniteScroll({
  container: document.querySelector('.content-list'),
  sentinel: document.querySelector('.loading-sentinel'),
  loadMore: async () => {
    const response = await fetch(`/api/items?page=${page++}`);
    const data = await response.json();
    return {
      items: data.items,
      hasMore: data.hasMore
    };
  }
});
```

### 入场动画

```html
<div class="animate-on-scroll fade-up">内容 1</div>
<div class="animate-on-scroll fade-left">内容 2</div>
<div class="animate-on-scroll fade-right">内容 3</div>
```

```css
.animate-on-scroll {
  opacity: 0;
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.animate-on-scroll.fade-up {
  transform: translateY(50px);
}

.animate-on-scroll.fade-left {
  transform: translateX(-50px);
}

.animate-on-scroll.fade-right {
  transform: translateX(50px);
}

.animate-on-scroll.animated {
  opacity: 1;
  transform: translate(0);
}
```

```javascript
const animationObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // 添加动画类
      entry.target.classList.add('animated');

      // 动画只触发一次
      animationObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1, // 元素 10% 可见时触发
  rootMargin: '0px 0px -50px 0px' // 底部偏移，更早触发
});

document.querySelectorAll('.animate-on-scroll').forEach(element => {
  animationObserver.observe(element);
});
```

### 视频自动播放/暂停

```javascript
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const video = entry.target;

    if (entry.isIntersecting) {
      // 元素超过 50% 可见时播放
      if (entry.intersectionRatio >= 0.5) {
        video.play().catch(err => {
          console.log('自动播放被阻止:', err);
        });
      }
    } else {
      // 离开视口时暂停
      video.pause();
    }
  });
}, {
  threshold: [0, 0.5, 1] // 多个阈值
});

document.querySelectorAll('video.auto-play').forEach(video => {
  videoObserver.observe(video);
});
```

### 广告曝光追踪

```javascript
class AdImpressionTracker {
  constructor() {
    this.trackedAds = new Set();
    this.setupObserver();
  }

  setupObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          this.trackImpression(entry.target);
        }
      });
    }, {
      threshold: 0.5 // 广告 50% 可见才算曝光
    });
  }

  trackImpression(adElement) {
    const adId = adElement.dataset.adId;

    // 防止重复追踪
    if (this.trackedAds.has(adId)) return;
    this.trackedAds.add(adId);

    // 发送曝光数据
    this.sendImpressionData({
      adId,
      timestamp: Date.now(),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    });

    // 标记为已追踪
    adElement.dataset.tracked = 'true';

    // 停止观察
    this.observer.unobserve(adElement);
  }

  sendImpressionData(data) {
    // 使用 Beacon API 发送数据，不阻塞页面
    navigator.sendBeacon('/api/ad-impression', JSON.stringify(data));
  }

  observe(adElement) {
    if (!adElement.dataset.tracked) {
      this.observer.observe(adElement);
    }
  }
}

// 使用
const tracker = new AdImpressionTracker();
document.querySelectorAll('.ad-banner').forEach(ad => {
  tracker.observe(ad);
});
```

### 目录高亮（TOC）

```javascript
class TableOfContentsHighlighter {
  constructor(options) {
    this.tocLinks = options.tocLinks;
    this.sections = options.sections;
    this.activeClass = options.activeClass || 'active';

    this.setupObserver();
  }

  setupObserver() {
    // 找到与 section 对应的目录链接
    const sectionToLink = new Map();
    this.sections.forEach(section => {
      const link = this.tocLinks.find(
        link => link.getAttribute('href') === `#${section.id}`
      );
      if (link) {
        sectionToLink.set(section, link);
      }
    });

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const link = sectionToLink.get(entry.target);
        if (!link) return;

        if (entry.isIntersecting) {
          // 移除所有活跃状态
          this.tocLinks.forEach(l => l.classList.remove(this.activeClass));
          // 添加当前活跃状态
          link.classList.add(this.activeClass);
        }
      });
    }, {
      rootMargin: '-20% 0px -70% 0px' // 只考虑视口中间区域
    });

    this.sections.forEach(section => {
      this.observer.observe(section);
    });
  }

  destroy() {
    this.observer.disconnect();
  }
}

// 使用
const tocHighlighter = new TableOfContentsHighlighter({
  tocLinks: Array.from(document.querySelectorAll('.toc a')),
  sections: Array.from(document.querySelectorAll('section[id]')),
  activeClass: 'toc-active'
});
```

---

## 最佳实践

### 及时清理观察者

```javascript
// 组件销毁时断开连接
class LazyLoadComponent {
  constructor() {
    this.observer = new IntersectionObserver(this.handleIntersect.bind(this));
  }

  handleIntersect(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadContent(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  }

  // 组件销毁时调用
  destroy() {
    this.observer.disconnect();
    this.observer = null;
  }
}
```

### 合理设置阈值

```javascript
// 不推荐：阈值过多
const observer = new IntersectionObserver(callback, {
  threshold: Array.from({ length: 101 }, (_, i) => i / 100) // 0, 0.01, 0.02...
});

// 推荐：根据实际需求设置有意义的阈值
const observer = new IntersectionObserver(callback, {
  threshold: [0, 0.25, 0.5, 0.75, 1] // 仅在关键点触发
});
```

### 使用 rootMargin 预加载

```javascript
// 图片懒加载：提前 300px 开始加载
const lazyLoader = new IntersectionObserver(callback, {
  rootMargin: '300px 0px'
});

// 无限滚动：提前 200px 触发
const infiniteScroller = new IntersectionObserver(callback, {
  rootMargin: '0px 0px 200px 0px'
});
```

### 单一职责

```javascript
// 推荐：每种功能使用独立的 Observer
const lazyImageObserver = new IntersectionObserver(handleLazyImages, {
  rootMargin: '200px'
});

const animationObserver = new IntersectionObserver(handleAnimations, {
  threshold: 0.1
});

const analyticsObserver = new IntersectionObserver(handleAnalytics, {
  threshold: 0.5
});

// 不推荐：一个 Observer 处理所有逻辑
const allInOneObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.target.classList.contains('lazy')) {
      // 懒加载逻辑
    }
    if (entry.target.classList.contains('animate')) {
      // 动画逻辑
    }
    if (entry.target.classList.contains('track')) {
      // 追踪逻辑
    }
  });
});
```

### 与框架集成

#### React Hook

```javascript
import { useEffect, useRef, useState, useCallback } from 'react';

function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const targetRef = useRef(null);

  const callback = useCallback(([entry]) => {
    setIsIntersecting(entry.isIntersecting);
    setEntry(entry);
  }, []);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(callback, {
      root: options.root ?? null,
      rootMargin: options.rootMargin ?? '0px',
      threshold: options.threshold ?? 0
    });

    observer.observe(target);

    return () => observer.disconnect();
  }, [callback, options.root, options.rootMargin, options.threshold]);

  return { targetRef, isIntersecting, entry };
}

// 使用示例
function LazyImage({ src, alt }) {
  const { targetRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '200px',
    threshold: 0
  });

  const [loaded, setLoaded] = useState(false);

  return (
    <img
      ref={targetRef}
      src={isIntersecting || loaded ? src : ''}
      alt={alt}
      onLoad={() => setLoaded(true)}
      className={loaded ? 'loaded' : 'loading'}
    />
  );
}
```

#### Vue 3 Composable

```javascript
import { ref, onMounted, onUnmounted } from 'vue';

export function useIntersectionObserver(options = {}) {
  const targetRef = ref(null);
  const isIntersecting = ref(false);
  let observer = null;

  onMounted(() => {
    if (!targetRef.value) return;

    observer = new IntersectionObserver(([entry]) => {
      isIntersecting.value = entry.isIntersecting;
    }, {
      root: options.root ?? null,
      rootMargin: options.rootMargin ?? '0px',
      threshold: options.threshold ?? 0
    });

    observer.observe(targetRef.value);
  });

  onUnmounted(() => {
    observer?.disconnect();
  });

  return { targetRef, isIntersecting };
}

// 使用示例
// <script setup>
// const { targetRef, isIntersecting } = useIntersectionObserver({
//   rootMargin: '100px'
// });
// </script>
// <template>
//   <div ref="targetRef">
//     <img v-if="isIntersecting" :src="imageUrl" />
//   </div>
// </template>
```

---

## 常见陷阱

### 忘记 unobserve

```javascript
// 错误：永远不会停止观察
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadImage(entry.target); // 每次进入视口都会触发
    }
  });
});

// 正确：加载后停止观察
const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadImage(entry.target);
      obs.unobserve(entry.target); // 停止观察
    }
  });
});
```

### 误解 isIntersecting

```javascript
// 注意：isIntersecting 表示"是否交叉"，不是"是否完全可见"
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    // 元素只要有一个像素进入视口，isIntersecting 就为 true
    if (entry.isIntersecting) {
      // entry.intersectionRatio 可能是 0.01，而非 1
      console.log('可见比例:', entry.intersectionRatio);
    }
  });
});

// 如果需要完全可见才触发
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.intersectionRatio === 1) {
      console.log('元素完全可见');
    }
  });
}, {
  threshold: 1 // 必须设置阈值为 1
});
```

### rootMargin 单位问题

```javascript
// 错误：没有单位
const observer = new IntersectionObserver(callback, {
  rootMargin: '100' // 无效！
});

// 错误：使用了不支持的单位
const observer = new IntersectionObserver(callback, {
  rootMargin: '10%' // 错误！不支持百分比
});

// 正确：使用 px 单位
const observer = new IntersectionObserver(callback, {
  rootMargin: '100px'
});

// 正确：完整的四边设置
const observer = new IntersectionObserver(callback, {
  rootMargin: '100px 50px 100px 50px' // 上 右 下 左
});
```

### 动态元素处理

```javascript
// 问题：新添加的元素不会被观察
const observer = new IntersectionObserver(callback);
document.querySelectorAll('.lazy').forEach(el => observer.observe(el));

// 动态添加的元素需要手动观察
function addNewContent(content) {
  const container = document.querySelector('.content');
  const newElement = document.createElement('div');
  newElement.className = 'lazy';
  newElement.textContent = content;
  container.appendChild(newElement);

  // 需要手动观察新元素
  container.querySelectorAll('.lazy:not([data-observed])').forEach(el => {
    el.dataset.observed = 'true';
    observer.observe(el);
  });
}
```

### 回调中的异步操作

```javascript
// 问题：异步操作可能导致状态不一致
const observer = new IntersectionObserver(async (entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      // 异步加载期间，元素可能已经离开视口
      await loadContent(entry.target);
      // 此时元素可能已不在视口中
    }
  }
});

// 解决方案：添加状态检查
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = entry.target;
      target.dataset.loading = 'true';

      loadContent(target).then(() => {
        // 检查元素是否仍然存在且在视口中
        if (target.dataset.loading) {
          displayContent(target);
          delete target.dataset.loading;
        }
      });
    } else {
      // 离开视口时取消加载状态
      delete entry.target.dataset.loading;
    }
  });
});
```

### root 元素必须是祖先

```javascript
// 错误：root 不是目标元素的祖先
const container = document.querySelector('.container-a');
const target = document.querySelector('.container-b .item');

const observer = new IntersectionObserver(callback, {
  root: container // 如果 target 不在 container 内，将无法正常工作
});

observer.observe(target); // 可能不会触发回调

// 正确：确保 root 是目标的祖先元素
const container = document.querySelector('.scroll-container');
const targets = container.querySelectorAll('.item');

const observer = new IntersectionObserver(callback, {
  root: container
});

targets.forEach(target => observer.observe(target));
```

---

## 性能考量

### 与传统方法对比

| 方面 | Intersection Observer | scroll + getBoundingClientRect |
|------|----------------------|-------------------------------|
| 主线程占用 | 低（异步） | 高（同步） |
| 回流触发 | 无 | 每次调用触发回流 |
| 节流需求 | 无需（内置优化） | 必需 |
| 多元素监控 | 高效 | 性能线性下降 |
| 代码复杂度 | 简单 | 复杂 |

### 性能测试示例

```javascript
// 传统方式性能测试
function measureTraditionalPerformance() {
  const elements = document.querySelectorAll('.item');
  let callCount = 0;

  const start = performance.now();

  window.addEventListener('scroll', () => {
    callCount++;
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    });
  });

  setTimeout(() => {
    console.log(`传统方式 - 调用次数: ${callCount}`);
    console.log(`耗时: ${performance.now() - start}ms`);
  }, 5000);
}

// Intersection Observer 性能测试
function measureObserverPerformance() {
  const elements = document.querySelectorAll('.item');
  let callCount = 0;

  const start = performance.now();

  const observer = new IntersectionObserver((entries) => {
    callCount++;
    entries.forEach(entry => {
      const isVisible = entry.isIntersecting;
    });
  });

  elements.forEach(el => observer.observe(el));

  setTimeout(() => {
    console.log(`Observer - 调用次数: ${callCount}`);
    console.log(`耗时: ${performance.now() - start}ms`);
  }, 5000);
}
```

### 优化建议

#### 批量处理

```javascript
// 处理大量元素时，分批观察
function observeInBatches(elements, observer, batchSize = 50) {
  let index = 0;

  function observeBatch() {
    const batch = Array.from(elements).slice(index, index + batchSize);
    batch.forEach(el => observer.observe(el));
    index += batchSize;

    if (index < elements.length) {
      requestIdleCallback(observeBatch);
    }
  }

  observeBatch();
}

const observer = new IntersectionObserver(callback);
const allElements = document.querySelectorAll('.lazy');
observeInBatches(allElements, observer);
```

#### 减少 DOM 操作

```javascript
// 不推荐：每次回调都操作 DOM
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    entry.target.style.opacity = entry.intersectionRatio;
    entry.target.style.transform = `scale(${0.5 + entry.intersectionRatio * 0.5})`;
  });
}, {
  threshold: Array.from({ length: 21 }, (_, i) => i / 20)
});

// 推荐：使用 CSS 变量批量更新
const observer = new IntersectionObserver((entries) => {
  requestAnimationFrame(() => {
    entries.forEach(entry => {
      entry.target.style.setProperty('--visibility', entry.intersectionRatio);
    });
  });
}, {
  threshold: [0, 0.25, 0.5, 0.75, 1]
});

// CSS
// .element {
//   opacity: var(--visibility);
//   transform: scale(calc(0.5 + var(--visibility) * 0.5));
// }
```

#### 复用 Observer

```javascript
// 不推荐：每个元素创建一个 Observer
elements.forEach(el => {
  const observer = new IntersectionObserver(callback);
  observer.observe(el);
});

// 推荐：共享同一个 Observer
const observer = new IntersectionObserver(callback);
elements.forEach(el => observer.observe(el));
```

---

## 实战场景

### 场景一：电商网站商品列表

```javascript
class ProductListManager {
  constructor(container) {
    this.container = container;
    this.page = 1;
    this.isLoading = false;

    this.setupLazyLoading();
    this.setupInfiniteScroll();
    this.setupImpressionTracking();
  }

  setupLazyLoading() {
    this.lazyObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          obs.unobserve(img);
        }
      });
    }, {
      rootMargin: '300px'
    });
  }

  setupInfiniteScroll() {
    this.sentinel = document.createElement('div');
    this.sentinel.className = 'scroll-sentinel';
    this.container.appendChild(this.sentinel);

    this.scrollObserver = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && !this.isLoading) {
        await this.loadMoreProducts();
      }
    }, {
      rootMargin: '200px'
    });

    this.scrollObserver.observe(this.sentinel);
  }

  setupImpressionTracking() {
    this.impressionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          this.trackImpression(entry.target.dataset.productId);
          this.impressionObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.5
    });
  }

  async loadMoreProducts() {
    this.isLoading = true;

    try {
      const response = await fetch(`/api/products?page=${this.page++}`);
      const products = await response.json();

      products.forEach(product => {
        const card = this.createProductCard(product);
        this.container.insertBefore(card, this.sentinel);

        // 观察新元素
        const img = card.querySelector('img[data-src]');
        if (img) this.lazyObserver.observe(img);

        this.impressionObserver.observe(card);
      });
    } finally {
      this.isLoading = false;
    }
  }

  createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;

    const img = document.createElement('img');
    img.dataset.src = product.image;
    img.alt = product.name;
    img.className = 'lazy';

    const title = document.createElement('h3');
    title.textContent = product.name;

    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = product.price;

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(price);

    return card;
  }

  trackImpression(productId) {
    navigator.sendBeacon('/api/impressions', JSON.stringify({
      productId,
      timestamp: Date.now()
    }));
  }

  destroy() {
    this.lazyObserver.disconnect();
    this.scrollObserver.disconnect();
    this.impressionObserver.disconnect();
  }
}
```

### 场景二：阅读进度追踪

```javascript
class ReadingProgressTracker {
  constructor(articleElement) {
    this.article = articleElement;
    this.sections = this.article.querySelectorAll('section, h2, h3');
    this.progress = 0;
    this.furthestRead = 0;

    this.setupTracking();
  }

  setupTracking() {
    // 为每个章节创建进度标记
    this.progressMarkers = new Map();

    this.sections.forEach((section, index) => {
      const progress = ((index + 1) / this.sections.length) * 100;
      this.progressMarkers.set(section, progress);
    });

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionProgress = this.progressMarkers.get(entry.target);
          if (sectionProgress > this.furthestRead) {
            this.furthestRead = sectionProgress;
            this.updateProgress(sectionProgress);
          }
        }
      });
    }, {
      rootMargin: '-20% 0px -70% 0px'
    });

    this.sections.forEach(section => {
      this.observer.observe(section);
    });
  }

  updateProgress(progress) {
    this.progress = progress;

    // 更新进度条
    document.querySelector('.reading-progress-bar').style.width = `${progress}%`;

    // 发送阅读进度
    if (progress > 25 && progress <= 50) {
      this.sendProgressEvent('25%');
    } else if (progress > 50 && progress <= 75) {
      this.sendProgressEvent('50%');
    } else if (progress > 75 && progress <= 100) {
      this.sendProgressEvent('75%');
    } else if (progress === 100) {
      this.sendProgressEvent('complete');
    }
  }

  sendProgressEvent(milestone) {
    // 避免重复发送
    if (this.sentMilestones?.has(milestone)) return;
    this.sentMilestones = this.sentMilestones || new Set();
    this.sentMilestones.add(milestone);

    console.log(`阅读进度: ${milestone}`);
    // 发送统计数据
  }
}
```

### 场景三：粘性导航状态

```javascript
class StickyNavigation {
  constructor() {
    this.nav = document.querySelector('.main-nav');
    this.sentinel = document.createElement('div');
    this.sentinel.className = 'nav-sentinel';
    this.nav.parentElement.insertBefore(this.sentinel, this.nav);

    this.setupObserver();
  }

  setupObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // 当 sentinel 不可见时，说明导航应该变为固定
        if (!entry.isIntersecting) {
          this.nav.classList.add('is-sticky');
          document.body.style.paddingTop = `${this.nav.offsetHeight}px`;
        } else {
          this.nav.classList.remove('is-sticky');
          document.body.style.paddingTop = '0';
        }
      });
    }, {
      threshold: 0
    });

    this.observer.observe(this.sentinel);
  }
}

// CSS
// .main-nav.is-sticky {
//   position: fixed;
//   top: 0;
//   left: 0;
//   right: 0;
//   z-index: 1000;
//   box-shadow: 0 2px 10px rgba(0,0,0,0.1);
// }
```

---

## 面试要点

### 常见面试问题

#### 什么是 Intersection Observer？它解决了什么问题？

**答案要点**：
- Intersection Observer API 用于异步观察目标元素与其祖先元素或视口的交叉状态变化
- 解决了传统 scroll 事件监听的性能问题：避免频繁触发、避免回流、内置优化
- 常用场景：懒加载、无限滚动、曝光统计、动画触发

#### Intersection Observer 的 threshold 和 rootMargin 分别是什么？

**答案要点**：
- `threshold`：触发回调的交叉比例阈值，可以是单个数值或数组
- `rootMargin`：扩大或缩小根元素的判定区域，类似 CSS margin，只支持 px 单位

```javascript
const observer = new IntersectionObserver(callback, {
  threshold: [0, 0.5, 1],      // 0%, 50%, 100% 时触发
  rootMargin: '100px 0px'       // 上下扩展 100px
});
```

#### 如何用 Intersection Observer 实现图片懒加载？

```javascript
const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      obs.unobserve(img);
    }
  });
}, { rootMargin: '200px' });

document.querySelectorAll('img[data-src]').forEach(img => {
  observer.observe(img);
});
```

#### isIntersecting 和 intersectionRatio 的区别？

**答案要点**：
- `isIntersecting`：布尔值，表示目标元素是否与根元素有任何交叉
- `intersectionRatio`：数值（0-1），表示交叉区域占目标元素的比例
- `isIntersecting` 为 true 时，`intersectionRatio` 可能是任何大于 0 的值

#### 如何正确清理 Intersection Observer？

```javascript
// 停止观察单个元素
observer.unobserve(element);

// 停止观察所有元素并释放资源
observer.disconnect();

// 在组件/页面卸载时调用
window.addEventListener('beforeunload', () => {
  observer.disconnect();
});
```

#### Intersection Observer 相比 scroll 事件的优势？

| 对比项 | Intersection Observer | scroll 事件 |
|--------|----------------------|-------------|
| 执行方式 | 异步 | 同步 |
| 性能影响 | 低 | 高（需节流） |
| 回流触发 | 不触发 | getBoundingClientRect 触发 |
| 使用复杂度 | 简单 | 需要手动计算 |
| 浏览器优化 | 内置优化 | 无 |

---

## 延伸阅读

### 官方文档

- [MDN - Intersection Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API)
- [W3C - Intersection Observer 规范](https://w3c.github.io/IntersectionObserver/)

### 相关 API

- [Resize Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/Resize_Observer_API) - 观察元素尺寸变化
- [Mutation Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver) - 观察 DOM 变化
- [Performance Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceObserver) - 观察性能指标

### Polyfill

对于不支持 Intersection Observer 的旧浏览器，可以使用 polyfill：

```html
<script src="https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver"></script>
```

或者使用 npm 包：

```bash
npm install intersection-observer
```

```javascript
import 'intersection-observer';
```

### 浏览器兼容性

| 浏览器 | 最低支持版本 |
|--------|-------------|
| Chrome | 51+ |
| Firefox | 55+ |
| Safari | 12.1+ |
| Edge | 15+ |
| IE | 不支持 |

### 推荐文章

- [Google Developers - Intersection Observer](https://developers.google.com/web/updates/2016/04/intersectionobserver)
- [使用 Intersection Observer API 实现懒加载](https://web.dev/lazy-loading-images/)
