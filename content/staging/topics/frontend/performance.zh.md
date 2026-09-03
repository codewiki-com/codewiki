---
title: 前端性能优化完全指南
description: 掌握前端性能优化的核心技术，构建高性能Web应用
track: frontend
section: performance
difficulty: advanced
tags:
  - 性能优化
  - Core Web Vitals
  - 加载优化
  - 渲染优化
status: imported
origin: old/src/content/docs/frontend/performance.zh.md
divergence: 0.197
issues: []
legacy:
  category: Frontend
  subcategory: Performance
  order: 20
  lastUpdated: 2026-01-07
---

## 概念解释

前端性能优化是指通过各种技术手段和最佳实践，提升 Web 应用的加载速度、渲染效率和交互响应能力，从而为用户提供流畅、快速的使用体验。

在当今移动互联网时代，性能直接影响用户体验和商业转化。据 Google 研究表明，页面加载时间每增加 1 秒，转化率就会下降 7%。因此，掌握前端性能优化技术对于构建成功的 Web 应用至关重要。

### 性能优化的核心目标

1. **更快的首屏渲染** - 让用户尽快看到内容
2. **更短的可交互时间** - 让用户尽快能够操作页面
3. **更流畅的交互体验** - 确保动画和操作响应及时
4. **更低的资源消耗** - 减少带宽和设备资源占用

---

## Core Web Vitals 核心指标

Core Web Vitals（核心网页指标）是 Google 提出的一组衡量用户体验的关键指标，已成为搜索引擎排名的重要因素。

### LCP（Largest Contentful Paint）最大内容绘制

LCP 衡量页面主要内容的加载速度，即视口内最大内容元素渲染完成的时间。

**评分标准：**
- 优秀：< 2.5 秒
- 需要改进：2.5 - 4.0 秒
- 较差：> 4.0 秒

**影响 LCP 的元素：**
- `<img>` 图片元素
- `<svg>` 内的 `<image>` 元素
- `<video>` 视频封面
- 通过 `background-image` 加载的背景图
- 包含文本节点的块级元素

**优化策略：**

```javascript
// 1. 预加载关键资源
// 在 HTML head 中添加
<link rel="preload" href="/hero-image.jpg" as="image" />
<link rel="preload" href="/critical-font.woff2" as="font" type="font/woff2" crossorigin />

// 2. 使用 fetchpriority 提升关键图片优先级
<img src="/hero.jpg" fetchpriority="high" alt="Hero Image" />

// 3. 服务端渲染或静态生成
// Next.js 示例
export async function getStaticProps() {
  const data = await fetchCriticalData();
  return { props: { data } };
}
```

```javascript
// 4. 优化图片加载
function OptimizedHeroImage() {
  return (
    <picture>
      {/* WebP 格式优先 */}
      <source
        srcSet="/hero.webp"
        type="image/webp"
      />
      {/* AVIF 格式（更优压缩） */}
      <source
        srcSet="/hero.avif"
        type="image/avif"
      />
      {/* 降级到 JPEG */}
      <img
        src="/hero.jpg"
        alt="Hero"
        width={1200}
        height={600}
        loading="eager"
        decoding="async"
      />
    </picture>
  );
}
```

### FID / INP（First Input Delay / Interaction to Next Paint）

FID 衡量用户首次交互到浏览器响应的延迟时间。从 2024 年起，Google 用 INP（Interaction to Next Paint）替代 FID，测量整个页面生命周期内的交互响应性。

**评分标准（INP）：**
- 优秀：< 200 毫秒
- 需要改进：200 - 500 毫秒
- 较差：> 500 毫秒

**优化策略：**

```javascript
// 1. 分割长任务
// 使用 scheduler.yield() 或 setTimeout 分割
async function processLargeData(items) {
  const CHUNK_SIZE = 100;

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    processChunk(chunk);

    // 让出主线程，允许浏览器处理用户输入
    if (navigator.scheduling?.isInputPending?.()) {
      await scheduler.yield();
    } else {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

// 2. 使用 Web Worker 处理密集计算
// main.js
const worker = new Worker('/heavy-computation.js');

worker.postMessage({ data: largeDataSet });
worker.onmessage = (e) => {
  console.log('计算结果:', e.data);
};

// heavy-computation.js
self.onmessage = (e) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
};

// 3. 使用 requestIdleCallback 延迟非关键任务
function deferNonCriticalWork() {
  requestIdleCallback((deadline) => {
    while (deadline.timeRemaining() > 0 && pendingTasks.length > 0) {
      const task = pendingTasks.shift();
      task();
    }

    if (pendingTasks.length > 0) {
      requestIdleCallback(deferNonCriticalWork);
    }
  });
}
```

### CLS（Cumulative Layout Shift）累积布局偏移

CLS 衡量页面视觉稳定性，即内容在加载过程中意外移动的程度。

**评分标准：**
- 优秀：< 0.1
- 需要改进：0.1 - 0.25
- 较差：> 0.25

**常见问题及解决方案：**

```css
/* 1. 为图片和视频预留空间 */
.image-container {
  aspect-ratio: 16 / 9;
  width: 100%;
}

/* 或使用 padding-bottom hack 兼容旧浏览器 */
.image-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 比例 */
}

.image-wrapper img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 2. 为动态内容预留空间 */
.ad-slot {
  min-height: 250px;
  background: #f0f0f0;
}

/* 3. 字体加载优化，避免 FOUT */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* 或 optional */
  size-adjust: 100%;
  ascent-override: 90%;
  descent-override: 20%;
}
```

```javascript
// 4. 使用 content-visibility 优化长列表
// CSS
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px; /* 预估高度 */
}

// 5. 骨架屏占位
function ArticleWithSkeleton({ article }) {
  if (!article) {
    return (
      <div className="skeleton">
        <div className="skeleton-title" style={{ width: '60%', height: '24px' }} />
        <div className="skeleton-text" style={{ width: '100%', height: '16px' }} />
        <div className="skeleton-text" style={{ width: '80%', height: '16px' }} />
      </div>
    );
  }

  return <Article data={article} />;
}
```

---

## 加载性能优化

### 代码分割（Code Splitting）

代码分割是将 JavaScript 包拆分成多个小块，按需加载的技术。

```javascript
// 1. React 路由级代码分割
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// 懒加载路由组件
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}

// 2. 组件级代码分割
const HeavyChart = lazy(() => import('./components/HeavyChart'));

function Analytics() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>显示图表</button>
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}

// 3. Webpack 魔法注释
const AdminPanel = lazy(() =>
  import(
    /* webpackChunkName: "admin" */
    /* webpackPrefetch: true */
    './pages/AdminPanel'
  )
);
```

```javascript
// 4. Vite 动态导入
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 React 相关库打包到单独的 chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 将 UI 库单独打包
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          // 工具库单独打包
          'utils': ['lodash-es', 'date-fns'],
        },
      },
    },
  },
});
```

### 懒加载（Lazy Loading）

```javascript
// 1. 图片懒加载
// 原生 loading 属性
<img src="image.jpg" loading="lazy" alt="..." />

// 2. Intersection Observer 实现
function useLazyLoad(ref) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // 提前 100px 开始加载
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return isVisible;
}

function LazyImage({ src, alt, ...props }) {
  const imgRef = useRef(null);
  const isVisible = useLazyLoad(imgRef);

  return (
    <div ref={imgRef}>
      {isVisible ? (
        <img src={src} alt={alt} {...props} />
      ) : (
        <div className="placeholder" />
      )}
    </div>
  );
}

// 3. 无限滚动加载
function InfiniteList({ loadMore }) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  return <div ref={sentinelRef} className="sentinel" />;
}
```

### 预加载策略

```html
<!-- 1. preload - 当前页面必需的资源 -->
<link rel="preload" href="/critical.css" as="style" />
<link rel="preload" href="/main.js" as="script" />
<link rel="preload" href="/hero.jpg" as="image" />

<!-- 2. prefetch - 下一页面可能需要的资源 -->
<link rel="prefetch" href="/next-page.js" />
<link rel="prefetch" href="/next-page-data.json" />

<!-- 3. preconnect - 提前建立第三方连接 -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://api.example.com" crossorigin />

<!-- 4. dns-prefetch - DNS 预解析 -->
<link rel="dns-prefetch" href="https://analytics.google.com" />
```

```javascript
// 5. 动态预加载
function prefetchRoute(path) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);
}

// 鼠标悬停时预加载
function NavLink({ to, children }) {
  const handleMouseEnter = () => {
    prefetchRoute(to);
  };

  return (
    <Link to={to} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
}

// 6. 使用 Speculation Rules API（Chrome 109+）
<script type="speculationrules">
{
  "prerender": [{
    "where": {
      "href_matches": "/product/*"
    },
    "eagerness": "moderate"
  }],
  "prefetch": [{
    "urls": ["/about", "/contact"]
  }]
}
</script>
```

---

## 渲染性能优化

### 重绘与重排

重排（Reflow）和重绘（Repaint）是浏览器渲染过程中的关键操作，频繁触发会严重影响性能。

```javascript
// 1. 避免强制同步布局
// 错误示例 - 读写交替导致强制布局
function badLayout() {
  const boxes = document.querySelectorAll('.box');
  boxes.forEach(box => {
    const width = box.offsetWidth; // 读取
    box.style.width = (width + 10) + 'px'; // 写入
  });
}

// 正确示例 - 批量读取，然后批量写入
function goodLayout() {
  const boxes = document.querySelectorAll('.box');

  // 先批量读取
  const widths = Array.from(boxes).map(box => box.offsetWidth);

  // 再批量写入
  boxes.forEach((box, i) => {
    box.style.width = (widths[i] + 10) + 'px';
  });
}

// 2. 使用 CSS transform 代替位置属性
// 不推荐 - 触发重排
element.style.left = '100px';
element.style.top = '100px';

// 推荐 - 只触发合成
element.style.transform = 'translate(100px, 100px)';

// 3. 使用 will-change 提示浏览器
.animated-element {
  will-change: transform, opacity;
}

// 动画结束后移除
element.addEventListener('animationend', () => {
  element.style.willChange = 'auto';
});

// 4. 使用 requestAnimationFrame 同步动画
function animate() {
  requestAnimationFrame((timestamp) => {
    // 所有 DOM 操作在这里执行
    updateAnimation(timestamp);

    if (animationRunning) {
      animate();
    }
  });
}
```

```javascript
// 5. DocumentFragment 批量 DOM 操作
function appendItems(items) {
  const fragment = document.createDocumentFragment();

  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.name;
    fragment.appendChild(li);
  });

  // 一次性插入，只触发一次重排
  document.querySelector('ul').appendChild(fragment);
}

// 6. 使用 CSS contain 属性隔离重排范围
.widget {
  contain: layout style paint;
}

.sidebar {
  contain: strict; /* 最强隔离 */
}
```

### 虚拟滚动

处理大量列表数据时，虚拟滚动只渲染可视区域内的元素，极大提升性能。

```javascript
// 基础虚拟滚动实现
function VirtualList({ items, itemHeight, containerHeight }) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;
  const totalHeight = items.length * itemHeight;

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 使用 react-window 库（推荐）
import { FixedSizeList as List } from 'react-window';

function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );

  return (
    <List
      height={500}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  );
}

// 动态高度虚拟列表
import { VariableSizeList as List } from 'react-window';

function DynamicHeightList({ items }) {
  const listRef = useRef(null);
  const rowHeights = useRef({});

  const getItemSize = (index) => rowHeights.current[index] || 50;

  const setRowHeight = (index, size) => {
    rowHeights.current = { ...rowHeights.current, [index]: size };
    listRef.current?.resetAfterIndex(index);
  };

  const Row = ({ index, style }) => {
    const rowRef = useRef(null);

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, rowRef.current.getBoundingClientRect().height);
      }
    }, [index]);

    return (
      <div style={style}>
        <div ref={rowRef}>{items[index].content}</div>
      </div>
    );
  };

  return (
    <List
      ref={listRef}
      height={500}
      itemCount={items.length}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

---

## 资源优化

### 图片优化

```javascript
// 1. 响应式图片
<picture>
  {/* 移动端 */}
  <source
    media="(max-width: 768px)"
    srcSet="/images/hero-mobile.webp 1x, /images/hero-mobile@2x.webp 2x"
    type="image/webp"
  />
  {/* 桌面端 */}
  <source
    media="(min-width: 769px)"
    srcSet="/images/hero-desktop.webp 1x, /images/hero-desktop@2x.webp 2x"
    type="image/webp"
  />
  {/* 降级 */}
  <img
    src="/images/hero.jpg"
    alt="Hero"
    loading="lazy"
    decoding="async"
  />
</picture>

// 2. Next.js Image 组件
import Image from 'next/image';

function OptimizedImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      width={1200}
      height={600}
      priority={true}  // 关键图片
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  );
}

// 3. 图片压缩配置（vite-plugin-imagemin）
// vite.config.js
import viteImagemin from 'vite-plugin-imagemin';

export default {
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9] },
      webp: { quality: 80 },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: true },
        ],
      },
    }),
  ],
};
```

### 字体优化

```css
/* 1. 使用 font-display 控制加载行为 */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2'),
       url('/fonts/custom.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap; /* 先显示备用字体，加载完成后切换 */
}

/* 2. 子集化字体 - 只包含需要的字符 */
/* 使用 unicode-range 按需加载 */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF; /* 拉丁字符 */
}

@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom-chinese.woff2') format('woff2');
  unicode-range: U+4E00-9FFF; /* 中文字符 */
}

/* 3. 可变字体减少文件数量 */
@font-face {
  font-family: 'VariableFont';
  src: url('/fonts/variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-stretch: 75% 125%;
}
```

```html
<!-- 4. 预加载关键字体 -->
<link
  rel="preload"
  href="/fonts/main.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

### CSS/JS 压缩与优化

```javascript
// vite.config.js - 生产优化配置
import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression2';

export default defineConfig({
  build: {
    // CSS 代码分割
    cssCodeSplit: true,
    // 压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 移除 console
        drop_debugger: true, // 移除 debugger
        pure_funcs: ['console.log'],
      },
    },
    // 分包策略
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('lodash')) return 'lodash-vendor';
            return 'vendor';
          }
        },
      },
    },
  },
  plugins: [
    // Gzip 压缩
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli 压缩（更高压缩率）
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
});
```

```javascript
// Tree Shaking 优化
// package.json 标记 sideEffects
{
  "name": "my-library",
  "sideEffects": false,
  // 或指定有副作用的文件
  "sideEffects": ["*.css", "*.scss", "./src/polyfills.js"]
}

// 使用 ES 模块导入
// 不推荐 - 导入整个库
import _ from 'lodash';

// 推荐 - 按需导入
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

// 或使用 lodash-es
import { debounce, throttle } from 'lodash-es';
```

---

## 缓存策略

### HTTP 缓存

```nginx
# Nginx 缓存配置示例
server {
    # 静态资源长期缓存（带 hash 的文件）
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML 文件不缓存或短期缓存
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # API 响应缓存
    location /api/ {
        add_header Cache-Control "private, max-age=60";
    }
}
```

```javascript
// 缓存头详解
// Cache-Control 指令：
// - public: 可以被任何缓存存储
// - private: 只能被浏览器缓存
// - max-age: 缓存有效时间（秒）
// - immutable: 资源不会改变，不需要重新验证
// - no-cache: 必须先验证再使用缓存
// - no-store: 不存储任何缓存
// - stale-while-revalidate: 后台更新时使用旧缓存

// Express 设置缓存头
app.use('/static', express.static('public', {
  maxAge: '1y',
  immutable: true,
}));

app.get('/api/data', (req, res) => {
  res.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');
  res.json(data);
});
```

### Service Worker 缓存

```javascript
// service-worker.js
const CACHE_NAME = 'app-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/app.js',
  '/images/logo.png',
];

// 安装时预缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// 缓存策略：Cache First（静态资源）
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image' ||
      event.request.destination === 'style' ||
      event.request.destination === 'script') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
  }
});

// 缓存策略：Network First（API 请求）
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open('api-cache').then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});

// 缓存策略：Stale While Revalidate
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      });
    })
  );
});
```

```javascript
// 使用 Workbox 简化 Service Worker
// workbox-config.js
module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{html,js,css,png,svg,woff2}'],
  swDest: 'dist/sw.js',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.example\.com\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 300,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
        },
      },
    },
  ],
};
```

---

## CDN 与边缘计算

### CDN 配置策略

```javascript
// 多 CDN 策略
const CDN_HOSTS = [
  'https://cdn1.example.com',
  'https://cdn2.example.com',
  'https://cdn3.example.com',
];

function getCDNUrl(path) {
  // 根据资源路径 hash 选择 CDN，确保同一资源使用同一 CDN
  const hash = hashCode(path);
  const cdnIndex = Math.abs(hash) % CDN_HOSTS.length;
  return `${CDN_HOSTS[cdnIndex]}${path}`;
}

// CDN 故障转移
async function fetchWithFallback(path) {
  for (const host of CDN_HOSTS) {
    try {
      const response = await fetch(`${host}${path}`, {
        timeout: 5000
      });
      if (response.ok) return response;
    } catch (error) {
      console.warn(`CDN ${host} failed, trying next...`);
    }
  }
  throw new Error('All CDNs failed');
}
```

```javascript
// Cloudflare Workers 边缘计算示例
// worker.js
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // 边缘缓存
  const cache = caches.default;
  let response = await cache.match(request);

  if (!response) {
    // 回源获取
    response = await fetch(request);

    // 只缓存成功的响应
    if (response.ok) {
      // 添加缓存头
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=3600');

      response = new Response(response.body, {
        status: response.status,
        headers,
      });

      // 存入边缘缓存
      event.waitUntil(cache.put(request, response.clone()));
    }
  }

  return response;
}

// 边缘图片优化
async function optimizeImage(request) {
  const url = new URL(request.url);
  const width = url.searchParams.get('w') || 'auto';
  const quality = url.searchParams.get('q') || 80;
  const format = url.searchParams.get('f') || 'webp';

  // 使用 Cloudflare Image Resizing
  return fetch(request, {
    cf: {
      image: {
        width: parseInt(width),
        quality: parseInt(quality),
        format: format,
      },
    },
  });
}
```

### 边缘 SSR

```javascript
// Vercel Edge Runtime 示例
// pages/api/ssr.js
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // 边缘获取数据
  const data = await fetch(`https://api.example.com/data/${id}`);
  const json = await data.json();

  // 边缘渲染 HTML
  const html = renderToString(<Component data={json} />);

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

---

## 性能监控与分析工具

### Web Vitals 监控

```javascript
// 使用 web-vitals 库
import { onCLS, onFID, onLCP, onINP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // 使用 sendBeacon 确保数据发送
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', body);
  } else {
    fetch('/api/analytics', { body, method: 'POST', keepalive: true });
  }
}

// 监控所有核心指标
onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
onTTFB(sendToAnalytics);

// 自定义性能标记
performance.mark('custom-start');
// ... 执行操作
performance.mark('custom-end');
performance.measure('custom-operation', 'custom-start', 'custom-end');

const measures = performance.getEntriesByName('custom-operation');
console.log(`操作耗时: ${measures[0].duration}ms`);
```

### Performance API 使用

```javascript
// 1. 资源加载性能
function analyzeResourceTiming() {
  const resources = performance.getEntriesByType('resource');

  resources.forEach((resource) => {
    console.log({
      name: resource.name,
      type: resource.initiatorType,
      duration: resource.duration,
      transferSize: resource.transferSize,
      // 各阶段耗时
      dns: resource.domainLookupEnd - resource.domainLookupStart,
      tcp: resource.connectEnd - resource.connectStart,
      ssl: resource.secureConnectionStart > 0
        ? resource.connectEnd - resource.secureConnectionStart
        : 0,
      ttfb: resource.responseStart - resource.requestStart,
      download: resource.responseEnd - resource.responseStart,
    });
  });
}

// 2. 导航性能
function analyzeNavigationTiming() {
  const [navigation] = performance.getEntriesByType('navigation');

  return {
    // DNS 查询
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    // TCP 连接
    tcp: navigation.connectEnd - navigation.connectStart,
    // 请求响应
    request: navigation.responseEnd - navigation.requestStart,
    // DOM 解析
    domParse: navigation.domContentLoadedEventEnd - navigation.responseEnd,
    // 资源加载
    resources: navigation.loadEventStart - navigation.domContentLoadedEventEnd,
    // 总耗时
    total: navigation.loadEventEnd - navigation.navigationStart,
  };
}

// 3. 长任务监控
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.warn('Long task detected:', {
      duration: entry.duration,
      startTime: entry.startTime,
      attribution: entry.attribution,
    });
  }
});

observer.observe({ entryTypes: ['longtask'] });

// 4. Layout Shift 监控
const clsObserver = new PerformanceObserver((list) => {
  let clsValue = 0;

  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) {
      clsValue += entry.value;
    }
  }

  console.log('Current CLS:', clsValue);
});

clsObserver.observe({ entryTypes: ['layout-shift'] });
```

### Chrome DevTools 性能分析

```javascript
// Performance 面板使用技巧

// 1. 添加性能标记便于分析
console.time('数据处理');
processData();
console.timeEnd('数据处理');

// 2. 使用 console.profile 记录 CPU 分析
console.profile('渲染性能');
renderComponent();
console.profileEnd('渲染性能');

// 3. 内存快照分析
// 在 Memory 面板使用 Heap Snapshot

// 4. Lighthouse CI 配置
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/', 'http://localhost:3000/about'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

---

## React/Vue 性能优化

### React 性能优化

```javascript
// 1. React.memo 避免不必要的重渲染
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }) {
  return <div>{/* 复杂渲染逻辑 */}</div>;
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return prevProps.data.id === nextProps.data.id;
});

// 2. useMemo 缓存计算结果
function DataTable({ items, filter }) {
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === filter);
  }, [items, filter]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredItems]);

  return <Table data={sortedItems} />;
}

// 3. useCallback 缓存函数引用
function ParentComponent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []); // 空依赖，函数永不变化

  const handleUpdate = useCallback((id) => {
    setCount(c => c + 1);
  }, []); // 使用函数式更新避免依赖 count

  return <ChildComponent onClick={handleClick} onUpdate={handleUpdate} />;
}

// 4. 使用 useTransition 延迟非紧急更新
function SearchResults({ query }) {
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState([]);

  useEffect(() => {
    startTransition(() => {
      // 标记为非紧急更新
      const newResults = searchDatabase(query);
      setResults(newResults);
    });
  }, [query]);

  return (
    <div>
      {isPending && <Spinner />}
      <ResultsList results={results} />
    </div>
  );
}

// 5. useDeferredValue 延迟值更新
function SlowList({ text }) {
  const deferredText = useDeferredValue(text);

  const items = useMemo(() => {
    // 复杂计算
    return generateItems(deferredText);
  }, [deferredText]);

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.content}</li>
      ))}
    </ul>
  );
}

// 6. 避免内联对象和函数
// 不推荐
<Component style={{ color: 'red' }} onClick={() => handleClick(id)} />

// 推荐
const style = useMemo(() => ({ color: 'red' }), []);
const handleItemClick = useCallback(() => handleClick(id), [id]);
<Component style={style} onClick={handleItemClick} />

// 7. 列表渲染优化
function OptimizedList({ items }) {
  return (
    <ul>
      {items.map((item) => (
        // key 使用稳定唯一标识，避免使用 index
        <ListItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
```

### Vue 性能优化

```javascript
// 1. 使用 v-once 渲染静态内容
<template>
  <div v-once>
    <!-- 只渲染一次，后续不更新 -->
    <h1>{{ title }}</h1>
    <p>{{ staticDescription }}</p>
  </div>
</template>

// 2. v-memo 缓存模板
<template>
  <div v-for="item in list" :key="item.id" v-memo="[item.id, item.selected]">
    <!-- 只有 item.id 或 item.selected 变化时才重新渲染 -->
    <ExpensiveComponent :data="item" />
  </div>
</template>

// 3. 计算属性缓存
<script setup>
import { computed, ref } from 'vue';

const items = ref([]);
const filter = ref('');

// 自动缓存，依赖不变则不重新计算
const filteredItems = computed(() => {
  return items.value.filter(item =>
    item.name.includes(filter.value)
  );
});
</script>

// 4. shallowRef / shallowReactive 减少响应式开销
<script setup>
import { shallowRef, triggerRef } from 'vue';

// 只有 .value 的变化是响应式的，内部属性变化不触发更新
const state = shallowRef({ count: 0, data: [] });

function update() {
  state.value.count++;
  triggerRef(state); // 手动触发更新
}
</script>

// 5. 异步组件
<script setup>
import { defineAsyncComponent } from 'vue';

const HeavyComponent = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  delay: 200,
  timeout: 3000,
  errorComponent: ErrorComponent,
});
</script>

// 6. KeepAlive 缓存组件状态
<template>
  <KeepAlive :include="['HomePage', 'AboutPage']" :max="10">
    <component :is="currentView" />
  </KeepAlive>
</template>

// 7. 虚拟滚动（使用 vue-virtual-scroller）
<template>
  <RecycleScroller
    class="scroller"
    :items="items"
    :item-size="50"
    key-field="id"
    v-slot="{ item }"
  >
    <div class="item">{{ item.name }}</div>
  </RecycleScroller>
</template>
```

---

## 实战案例

### 案例一：电商首页性能优化

```javascript
// 优化前：首页 LCP 4.5s，FID 320ms，CLS 0.35

// 优化方案：

// 1. 关键资源预加载
// index.html
<head>
  <link rel="preconnect" href="https://api.shop.com" />
  <link rel="preload" href="/fonts/brand.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/images/hero-banner.webp" as="image" />
</head>

// 2. 首屏数据预取 + 骨架屏
function HomePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // 使用 Promise.all 并行请求
    Promise.all([
      fetchBanner(),
      fetchCategories(),
      fetchRecommendations(),
    ]).then(([banner, categories, recommendations]) => {
      setData({ banner, categories, recommendations });
    });
  }, []);

  if (!data) {
    return <HomePageSkeleton />;
  }

  return (
    <>
      <HeroBanner data={data.banner} />
      <CategoryNav data={data.categories} />
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid data={data.recommendations} />
      </Suspense>
    </>
  );
}

// 3. 图片懒加载 + 响应式
function ProductCard({ product }) {
  return (
    <article className="product-card">
      <picture>
        <source
          srcSet={`${product.image}?w=300&f=webp`}
          type="image/webp"
        />
        <img
          src={`${product.image}?w=300`}
          alt={product.name}
          loading="lazy"
          width={300}
          height={300}
          style={{ aspectRatio: '1/1' }}
        />
      </picture>
      <h3>{product.name}</h3>
      <p className="price">{product.price}</p>
    </article>
  );
}

// 4. 代码分割
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));

// 优化后：LCP 1.8s，FID 85ms，CLS 0.05
```

### 案例二：后台管理系统优化

```javascript
// 问题：大数据表格渲染卡顿，内存占用高

// 解决方案：

// 1. 虚拟表格
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualTable({ data, columns }) {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="table-container">
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.title}</th>
            ))}
          </tr>
        </thead>
        <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <tr
              key={virtualRow.index}
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {columns.map(col => (
                <td key={col.key}>{data[virtualRow.index][col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 2. 分页 + 服务端排序过滤
function DataTable() {
  const [params, setParams] = useState({
    page: 1,
    pageSize: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    filters: {},
  });

  const { data, isLoading } = useQuery({
    queryKey: ['tableData', params],
    queryFn: () => fetchTableData(params),
    keepPreviousData: true,
  });

  return (
    <Table
      data={data?.items ?? []}
      total={data?.total ?? 0}
      loading={isLoading}
      onChange={setParams}
    />
  );
}

// 3. Web Worker 处理数据导出
// export-worker.js
self.onmessage = async (e) => {
  const { data, format } = e.data;

  let result;
  if (format === 'csv') {
    result = convertToCSV(data);
  } else if (format === 'xlsx') {
    result = await convertToExcel(data);
  }

  self.postMessage({ result });
};

// main.js
function exportData(data, format) {
  return new Promise((resolve) => {
    const worker = new Worker('/export-worker.js');
    worker.postMessage({ data, format });
    worker.onmessage = (e) => {
      resolve(e.data.result);
      worker.terminate();
    };
  });
}
```

---

## 面试要点

### 高频面试题

**1. 什么是 Core Web Vitals？如何优化？**

Core Web Vitals 是 Google 提出的三个核心性能指标：
- **LCP（最大内容绘制）**：衡量加载性能，目标 < 2.5s
- **FID/INP（首次输入延迟/交互到下一次绘制）**：衡量交互性，目标 < 200ms
- **CLS（累积布局偏移）**：衡量视觉稳定性，目标 < 0.1

优化策略包括：预加载关键资源、代码分割、图片优化、减少主线程阻塞、为媒体元素预留空间等。

**2. 重绘和重排的区别？如何避免？**

- **重排（Reflow）**：元素几何属性变化，需要重新计算布局，代价较高
- **重绘（Repaint）**：元素外观变化但不影响布局，只需重新绘制

避免策略：
- 使用 transform/opacity 代替位置/透明度属性
- 批量读写 DOM，避免读写交替
- 使用 DocumentFragment 批量插入节点
- 使用 CSS contain 隔离重排范围

**3. 如何实现图片懒加载？**

```javascript
// 1. 原生 loading="lazy"
<img src="image.jpg" loading="lazy" />

// 2. Intersection Observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
});

document.querySelectorAll('img[data-src]').forEach(img => {
  observer.observe(img);
});
```

**4. Service Worker 的缓存策略有哪些？**

- **Cache First**：优先使用缓存，适用于静态资源
- **Network First**：优先网络请求，适用于 API 数据
- **Stale While Revalidate**：返回缓存同时后台更新
- **Cache Only**：只使用缓存
- **Network Only**：只使用网络

**5. React/Vue 如何避免不必要的重渲染？**

React：
- 使用 React.memo 包裹组件
- 使用 useMemo/useCallback 缓存值和函数
- 使用 useTransition 标记非紧急更新

Vue：
- 使用 v-once 渲染静态内容
- 使用 v-memo 缓存列表项
- 使用 shallowRef 减少响应式开销
- 使用 computed 缓存计算结果

**6. 首屏优化的具体措施？**

```
加载优化：
├── 资源压缩（Gzip/Brotli）
├── 代码分割与懒加载
├── 预加载关键资源
├── 使用 CDN
└── 开启 HTTP/2

渲染优化：
├── SSR/SSG
├── 骨架屏
├── 关键 CSS 内联
├── 非关键资源延迟加载
└── 减少 DOM 数量

缓存优化：
├── 合理设置 HTTP 缓存
├── Service Worker 离线缓存
└── 本地存储数据缓存
```

### 性能优化清单

```markdown
## 加载阶段
- [ ] 使用 Gzip/Brotli 压缩
- [ ] 开启 HTTP/2
- [ ] 配置 CDN
- [ ] 代码分割与懒加载
- [ ] Tree Shaking 移除无用代码
- [ ] 预加载关键资源
- [ ] 图片压缩与格式优化

## 渲染阶段
- [ ] 减少 DOM 深度和数量
- [ ] 避免强制同步布局
- [ ] 使用 CSS 动画代替 JS 动画
- [ ] 使用 transform/opacity 触发合成
- [ ] 大列表使用虚拟滚动
- [ ] 使用 requestAnimationFrame

## 运行阶段
- [ ] 分割长任务
- [ ] 使用 Web Worker
- [ ] 合理使用 memo/缓存
- [ ] 防抖节流事件处理
- [ ] 及时清理定时器和监听器

## 监控阶段
- [ ] 集成 Web Vitals 监控
- [ ] 设置性能预算告警
- [ ] 定期 Lighthouse 审计
```

---

## 总结

前端性能优化是一个系统工程，需要从多个维度综合考虑：

1. **理解原理**：深入理解浏览器渲染原理和网络请求过程
2. **度量指标**：使用 Core Web Vitals 等标准指标衡量性能
3. **持续监控**：建立性能监控体系，及时发现问题
4. **渐进优化**：根据优先级逐步实施优化措施
5. **权衡取舍**：在性能、开发效率和用户体验之间找到平衡

掌握这些性能优化技术，不仅能构建出高性能的 Web 应用，也是成为高级前端工程师的必备技能。

---

## 相关资源

- [web.dev - Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [webpack 性能优化](https://webpack.js.org/guides/build-performance/)
- [React 官方性能优化](https://react.dev/reference/react/memo)
- [Vue 性能优化指南](https://vuejs.org/guide/best-practices/performance.html)
