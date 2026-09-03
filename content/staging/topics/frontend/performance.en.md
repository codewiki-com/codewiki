---
title: Frontend Performance Optimization Guide
description: Master frontend performance optimization for fast web apps
track: frontend
section: performance
difficulty: advanced
tags:
  - Performance
  - Core Web Vitals
  - Optimization
  - Loading
status: imported
origin: old/src/content/docs/frontend/performance.en.md
divergence: 0.197
issues: []
legacy:
  category: Frontend
  subcategory: Performance
  order: 20
  lastUpdated: 2026-01-07
---

## Introduction

Frontend performance optimization encompasses a range of techniques and best practices designed to improve the loading speed, rendering efficiency, and interaction responsiveness of web applications. The goal is to deliver a smooth, fast user experience.

In today's mobile-first world, performance directly impacts user experience and business outcomes. According to Google research, every additional second of page load time can reduce conversions by 7%. Mastering frontend performance optimization is therefore essential for building successful web applications.

### Core Goals of Performance Optimization

1. **Faster First Paint** - Show content to users as quickly as possible
2. **Shorter Time to Interactive** - Enable users to interact with the page sooner
3. **Smoother Interactions** - Ensure animations and responses feel immediate
4. **Lower Resource Consumption** - Reduce bandwidth and device resource usage

---

## Core Web Vitals

Core Web Vitals are a set of metrics introduced by Google to measure user experience. They have become a significant ranking factor for search engines.

### LCP (Largest Contentful Paint)

LCP measures how quickly the main content of a page loads - specifically, the time it takes for the largest content element in the viewport to render.

**Scoring Thresholds:**
- Good: < 2.5 seconds
- Needs Improvement: 2.5 - 4.0 seconds
- Poor: > 4.0 seconds

**Elements That Affect LCP:**
- `<img>` image elements
- `<image>` elements inside `<svg>`
- `<video>` poster images
- Background images loaded via `background-image`
- Block-level elements containing text nodes

**Optimization Strategies:**

```javascript
// 1. Preload critical resources
// Add to HTML head
<link rel="preload" href="/hero-image.jpg" as="image" />
<link rel="preload" href="/critical-font.woff2" as="font" type="font/woff2" crossorigin />

// 2. Use fetchpriority to boost critical image priority
<img src="/hero.jpg" fetchpriority="high" alt="Hero Image" />

// 3. Server-side rendering or static generation
// Next.js example
export async function getStaticProps() {
  const data = await fetchCriticalData();
  return { props: { data } };
}
```

```javascript
// 4. Optimize image loading
function OptimizedHeroImage() {
  return (
    <picture>
      {/* WebP format preferred */}
      <source
        srcSet="/hero.webp"
        type="image/webp"
      />
      {/* AVIF format (better compression) */}
      <source
        srcSet="/hero.avif"
        type="image/avif"
      />
      {/* Fallback to JPEG */}
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

### FID / INP (First Input Delay / Interaction to Next Paint)

FID measures the delay between a user's first interaction and the browser's response. Starting in 2024, Google replaced FID with INP (Interaction to Next Paint), which measures responsiveness throughout the entire page lifecycle.

**Scoring Thresholds (INP):**
- Good: < 200 milliseconds
- Needs Improvement: 200 - 500 milliseconds
- Poor: > 500 milliseconds

**Optimization Strategies:**

```javascript
// 1. Break up long tasks
// Use scheduler.yield() or setTimeout to split work
async function processLargeData(items) {
  const CHUNK_SIZE = 100;

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    processChunk(chunk);

    // Yield to main thread, allowing browser to handle user input
    if (navigator.scheduling?.isInputPending?.()) {
      await scheduler.yield();
    } else {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

// 2. Use Web Workers for heavy computation
// main.js
const worker = new Worker('/heavy-computation.js');

worker.postMessage({ data: largeDataSet });
worker.onmessage = (e) => {
  console.log('Computation result:', e.data);
};

// heavy-computation.js
self.onmessage = (e) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
};

// 3. Use requestIdleCallback for non-critical work
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

### CLS (Cumulative Layout Shift)

CLS measures visual stability - the extent to which content unexpectedly shifts during page loading.

**Scoring Thresholds:**
- Good: < 0.1
- Needs Improvement: 0.1 - 0.25
- Poor: > 0.25

**Common Issues and Solutions:**

```css
/* 1. Reserve space for images and videos */
.image-container {
  aspect-ratio: 16 / 9;
  width: 100%;
}

/* Or use padding-bottom hack for older browsers */
.image-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 ratio */
}

.image-wrapper img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 2. Reserve space for dynamic content */
.ad-slot {
  min-height: 250px;
  background: #f0f0f0;
}

/* 3. Font loading optimization to avoid FOUT */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* or optional */
  size-adjust: 100%;
  ascent-override: 90%;
  descent-override: 20%;
}
```

```javascript
// 4. Use content-visibility for long lists
// CSS
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px; /* Estimated height */
}

// 5. Skeleton placeholders
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

## Loading Performance Optimization

### Code Splitting

Code splitting breaks your JavaScript bundle into smaller chunks that can be loaded on demand.

```javascript
// 1. React route-level code splitting
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load route components
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

// 2. Component-level code splitting
const HeavyChart = lazy(() => import('./components/HeavyChart'));

function Analytics() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}

// 3. Webpack magic comments
const AdminPanel = lazy(() =>
  import(
    /* webpackChunkName: "admin" */
    /* webpackPrefetch: true */
    './pages/AdminPanel'
  )
);
```

```javascript
// 4. Vite dynamic imports
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Bundle React-related libraries into a separate chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Bundle UI library separately
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          // Bundle utilities separately
          'utils': ['lodash-es', 'date-fns'],
        },
      },
    },
  },
});
```

### Lazy Loading

```javascript
// 1. Native image lazy loading
<img src="image.jpg" loading="lazy" alt="..." />

// 2. Intersection Observer implementation
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
      { rootMargin: '100px' } // Start loading 100px before visible
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

// 3. Infinite scroll loading
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

### Preloading Strategies

```html
<!-- 1. preload - Resources needed for current page -->
<link rel="preload" href="/critical.css" as="style" />
<link rel="preload" href="/main.js" as="script" />
<link rel="preload" href="/hero.jpg" as="image" />

<!-- 2. prefetch - Resources likely needed for next page -->
<link rel="prefetch" href="/next-page.js" />
<link rel="prefetch" href="/next-page-data.json" />

<!-- 3. preconnect - Establish early third-party connections -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://api.example.com" crossorigin />

<!-- 4. dns-prefetch - DNS pre-resolution -->
<link rel="dns-prefetch" href="https://analytics.google.com" />
```

```javascript
// 5. Dynamic preloading
function prefetchRoute(path) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);
}

// Preload on hover
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

// 6. Using Speculation Rules API (Chrome 109+)
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

## Rendering Performance Optimization

### Reflow and Repaint

Reflow and repaint are key operations in the browser's rendering process. Triggering them frequently severely impacts performance.

```javascript
// 1. Avoid forced synchronous layout
// Bad example - interleaved read/write causes forced layout
function badLayout() {
  const boxes = document.querySelectorAll('.box');
  boxes.forEach(box => {
    const width = box.offsetWidth; // Read
    box.style.width = (width + 10) + 'px'; // Write
  });
}

// Good example - batch reads, then batch writes
function goodLayout() {
  const boxes = document.querySelectorAll('.box');

  // Batch read first
  const widths = Array.from(boxes).map(box => box.offsetWidth);

  // Then batch write
  boxes.forEach((box, i) => {
    box.style.width = (widths[i] + 10) + 'px';
  });
}

// 2. Use CSS transform instead of position properties
// Not recommended - triggers reflow
element.style.left = '100px';
element.style.top = '100px';

// Recommended - only triggers compositing
element.style.transform = 'translate(100px, 100px)';

// 3. Use will-change to hint the browser
.animated-element {
  will-change: transform, opacity;
}

// Remove after animation ends
element.addEventListener('animationend', () => {
  element.style.willChange = 'auto';
});

// 4. Use requestAnimationFrame to synchronize animations
function animate() {
  requestAnimationFrame((timestamp) => {
    // All DOM operations here
    updateAnimation(timestamp);

    if (animationRunning) {
      animate();
    }
  });
}
```

```javascript
// 5. DocumentFragment for batch DOM operations
function appendItems(items) {
  const fragment = document.createDocumentFragment();

  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.name;
    fragment.appendChild(li);
  });

  // Single insertion, only one reflow
  document.querySelector('ul').appendChild(fragment);
}

// 6. Use CSS contain property to isolate reflow scope
.widget {
  contain: layout style paint;
}

.sidebar {
  contain: strict; /* Strongest isolation */
}
```

### Virtual Scrolling

When handling large lists, virtual scrolling renders only the elements visible in the viewport, greatly improving performance.

```javascript
// Basic virtual scrolling implementation
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

// Using react-window library (recommended)
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

// Dynamic height virtual list
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

## Resource Optimization

### Image Optimization

```javascript
// 1. Responsive images
<picture>
  {/* Mobile */}
  <source
    media="(max-width: 768px)"
    srcSet="/images/hero-mobile.webp 1x, /images/hero-mobile@2x.webp 2x"
    type="image/webp"
  />
  {/* Desktop */}
  <source
    media="(min-width: 769px)"
    srcSet="/images/hero-desktop.webp 1x, /images/hero-desktop@2x.webp 2x"
    type="image/webp"
  />
  {/* Fallback */}
  <img
    src="/images/hero.jpg"
    alt="Hero"
    loading="lazy"
    decoding="async"
  />
</picture>

// 2. Next.js Image component
import Image from 'next/image';

function OptimizedImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      width={1200}
      height={600}
      priority={true}  // Critical image
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  );
}

// 3. Image compression config (vite-plugin-imagemin)
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

### Font Optimization

```css
/* 1. Use font-display to control loading behavior */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2'),
       url('/fonts/custom.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap; /* Show fallback font first, switch when loaded */
}

/* 2. Subset fonts - only include needed characters */
/* Use unicode-range for on-demand loading */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF; /* Latin characters */
}

@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom-extended.woff2') format('woff2');
  unicode-range: U+0100-024F; /* Extended Latin */
}

/* 3. Variable fonts reduce file count */
@font-face {
  font-family: 'VariableFont';
  src: url('/fonts/variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-stretch: 75% 125%;
}
```

```html
<!-- 4. Preload critical fonts -->
<link
  rel="preload"
  href="/fonts/main.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

### CSS/JS Compression and Optimization

```javascript
// vite.config.js - Production optimization config
import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression2';

export default defineConfig({
  build: {
    // CSS code splitting
    cssCodeSplit: true,
    // Compression options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console
        drop_debugger: true, // Remove debugger
        pure_funcs: ['console.log'],
      },
    },
    // Chunking strategy
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
    // Gzip compression
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression (higher compression ratio)
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
});
```

```javascript
// Tree Shaking optimization
// package.json mark sideEffects
{
  "name": "my-library",
  "sideEffects": false,
  // Or specify files with side effects
  "sideEffects": ["*.css", "*.scss", "./src/polyfills.js"]
}

// Use ES module imports
// Not recommended - imports entire library
import _ from 'lodash';

// Recommended - import only what you need
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

// Or use lodash-es
import { debounce, throttle } from 'lodash-es';
```

---

## Caching Strategies

### HTTP Caching

```nginx
# Nginx caching configuration example
server {
    # Long-term cache for static assets (files with hash)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML files - no cache or short cache
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # API response caching
    location /api/ {
        add_header Cache-Control "private, max-age=60";
    }
}
```

```javascript
// Cache-Control directives explained:
// - public: can be cached by any cache
// - private: can only be cached by browser
// - max-age: cache validity time (seconds)
// - immutable: resource won't change, no revalidation needed
// - no-cache: must revalidate before using cache
// - no-store: don't store any cache
// - stale-while-revalidate: use stale cache while updating in background

// Express setting cache headers
app.use('/static', express.static('public', {
  maxAge: '1y',
  immutable: true,
}));

app.get('/api/data', (req, res) => {
  res.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');
  res.json(data);
});
```

### Service Worker Caching

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

// Pre-cache static assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Clean up old caches on activate
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

// Cache strategy: Cache First (static assets)
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

// Cache strategy: Network First (API requests)
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

// Cache strategy: Stale While Revalidate
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
// Using Workbox to simplify Service Worker
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
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
};
```

---

## CDN and Edge Computing

### CDN Configuration Strategies

```javascript
// Multi-CDN strategy
const CDN_HOSTS = [
  'https://cdn1.example.com',
  'https://cdn2.example.com',
  'https://cdn3.example.com',
];

function getCDNUrl(path) {
  // Select CDN based on resource path hash, ensuring same resource uses same CDN
  const hash = hashCode(path);
  const cdnIndex = Math.abs(hash) % CDN_HOSTS.length;
  return `${CDN_HOSTS[cdnIndex]}${path}`;
}

// CDN failover
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
// Cloudflare Workers edge computing example
// worker.js
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // Edge caching
  const cache = caches.default;
  let response = await cache.match(request);

  if (!response) {
    // Fetch from origin
    response = await fetch(request);

    // Only cache successful responses
    if (response.ok) {
      // Add cache headers
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=3600');

      response = new Response(response.body, {
        status: response.status,
        headers,
      });

      // Store in edge cache
      event.waitUntil(cache.put(request, response.clone()));
    }
  }

  return response;
}

// Edge image optimization
async function optimizeImage(request) {
  const url = new URL(request.url);
  const width = url.searchParams.get('w') || 'auto';
  const quality = url.searchParams.get('q') || 80;
  const format = url.searchParams.get('f') || 'webp';

  // Use Cloudflare Image Resizing
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

### Edge SSR

```javascript
// Vercel Edge Runtime example
// pages/api/ssr.js
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // Fetch data at the edge
  const data = await fetch(`https://api.example.com/data/${id}`);
  const json = await data.json();

  // Render HTML at the edge
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

## Performance Monitoring and Analysis Tools

### Web Vitals Monitoring

```javascript
// Using web-vitals library
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

  // Use sendBeacon to ensure data is sent
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', body);
  } else {
    fetch('/api/analytics', { body, method: 'POST', keepalive: true });
  }
}

// Monitor all core metrics
onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
onTTFB(sendToAnalytics);

// Custom performance marks
performance.mark('custom-start');
// ... perform operation
performance.mark('custom-end');
performance.measure('custom-operation', 'custom-start', 'custom-end');

const measures = performance.getEntriesByName('custom-operation');
console.log(`Operation took: ${measures[0].duration}ms`);
```

### Performance API Usage

```javascript
// 1. Resource loading performance
function analyzeResourceTiming() {
  const resources = performance.getEntriesByType('resource');

  resources.forEach((resource) => {
    console.log({
      name: resource.name,
      type: resource.initiatorType,
      duration: resource.duration,
      transferSize: resource.transferSize,
      // Timing breakdown
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

// 2. Navigation performance
function analyzeNavigationTiming() {
  const [navigation] = performance.getEntriesByType('navigation');

  return {
    // DNS lookup
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    // TCP connection
    tcp: navigation.connectEnd - navigation.connectStart,
    // Request/response
    request: navigation.responseEnd - navigation.requestStart,
    // DOM parsing
    domParse: navigation.domContentLoadedEventEnd - navigation.responseEnd,
    // Resource loading
    resources: navigation.loadEventStart - navigation.domContentLoadedEventEnd,
    // Total time
    total: navigation.loadEventEnd - navigation.navigationStart,
  };
}

// 3. Long task monitoring
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

// 4. Layout Shift monitoring
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

### Chrome DevTools Performance Analysis

```javascript
// Performance panel tips

// 1. Add performance marks for analysis
console.time('Data processing');
processData();
console.timeEnd('Data processing');

// 2. Use console.profile to record CPU analysis
console.profile('Rendering performance');
renderComponent();
console.profileEnd('Rendering performance');

// 3. Memory snapshot analysis
// Use Heap Snapshot in Memory panel

// 4. Lighthouse CI configuration
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

## React/Vue Performance Optimization

### React Performance Optimization

```javascript
// 1. React.memo to avoid unnecessary re-renders
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }) {
  return <div>{/* Complex rendering logic */}</div>;
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.data.id === nextProps.data.id;
});

// 2. useMemo to cache computed results
function DataTable({ items, filter }) {
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === filter);
  }, [items, filter]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredItems]);

  return <Table data={sortedItems} />;
}

// 3. useCallback to cache function references
function ParentComponent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []); // Empty deps, function never changes

  const handleUpdate = useCallback((id) => {
    setCount(c => c + 1);
  }, []); // Use functional update to avoid depending on count

  return <ChildComponent onClick={handleClick} onUpdate={handleUpdate} />;
}

// 4. useTransition for non-urgent updates
function SearchResults({ query }) {
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState([]);

  useEffect(() => {
    startTransition(() => {
      // Mark as non-urgent update
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

// 5. useDeferredValue for deferred value updates
function SlowList({ text }) {
  const deferredText = useDeferredValue(text);

  const items = useMemo(() => {
    // Complex computation
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

// 6. Avoid inline objects and functions
// Not recommended
<Component style={{ color: 'red' }} onClick={() => handleClick(id)} />

// Recommended
const style = useMemo(() => ({ color: 'red' }), []);
const handleItemClick = useCallback(() => handleClick(id), [id]);
<Component style={style} onClick={handleItemClick} />

// 7. List rendering optimization
function OptimizedList({ items }) {
  return (
    <ul>
      {items.map((item) => (
        // Use stable unique identifier as key, avoid using index
        <ListItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
```

### Vue Performance Optimization

```javascript
// 1. Use v-once for static content
<template>
  <div v-once>
    <!-- Only renders once, never updates -->
    <h1>{{ title }}</h1>
    <p>{{ staticDescription }}</p>
  </div>
</template>

// 2. v-memo for template caching
<template>
  <div v-for="item in list" :key="item.id" v-memo="[item.id, item.selected]">
    <!-- Only re-renders when item.id or item.selected changes -->
    <ExpensiveComponent :data="item" />
  </div>
</template>

// 3. Computed property caching
<script setup>
import { computed, ref } from 'vue';

const items = ref([]);
const filter = ref('');

// Auto-cached, won't recompute if dependencies haven't changed
const filteredItems = computed(() => {
  return items.value.filter(item =>
    item.name.includes(filter.value)
  );
});
</script>

// 4. shallowRef / shallowReactive to reduce reactivity overhead
<script setup>
import { shallowRef, triggerRef } from 'vue';

// Only .value changes are reactive, internal property changes don't trigger updates
const state = shallowRef({ count: 0, data: [] });

function update() {
  state.value.count++;
  triggerRef(state); // Manually trigger update
}
</script>

// 5. Async components
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

// 6. KeepAlive to cache component state
<template>
  <KeepAlive :include="['HomePage', 'AboutPage']" :max="10">
    <component :is="currentView" />
  </KeepAlive>
</template>

// 7. Virtual scrolling (using vue-virtual-scroller)
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

## Practical Case Studies

### Case 1: E-commerce Homepage Optimization

```javascript
// Before optimization: LCP 4.5s, FID 320ms, CLS 0.35

// Optimization plan:

// 1. Preload critical resources
// index.html
<head>
  <link rel="preconnect" href="https://api.shop.com" />
  <link rel="preload" href="/fonts/brand.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/images/hero-banner.webp" as="image" />
</head>

// 2. First-screen data prefetching + skeleton
function HomePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Use Promise.all for parallel requests
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

// 3. Image lazy loading + responsive
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

// 4. Code splitting
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));

// After optimization: LCP 1.8s, FID 85ms, CLS 0.05
```

### Case 2: Admin Dashboard Optimization

```javascript
// Problem: Large data table rendering causing lag, high memory usage

// Solution:

// 1. Virtual table
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

// 2. Pagination + server-side sorting/filtering
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

// 3. Web Worker for data export
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

## Interview Key Points

### Frequently Asked Questions

**1. What are Core Web Vitals? How do you optimize them?**

Core Web Vitals are three key performance metrics introduced by Google:
- **LCP (Largest Contentful Paint)**: Measures loading performance, target < 2.5s
- **FID/INP (First Input Delay/Interaction to Next Paint)**: Measures interactivity, target < 200ms
- **CLS (Cumulative Layout Shift)**: Measures visual stability, target < 0.1

Optimization strategies include: preloading critical resources, code splitting, image optimization, reducing main thread blocking, and reserving space for media elements.

**2. What is the difference between reflow and repaint? How do you avoid them?**

- **Reflow**: Geometric property changes require recalculating layout, higher cost
- **Repaint**: Appearance changes without affecting layout, only requires repainting

Avoidance strategies:
- Use transform/opacity instead of position/transparency properties
- Batch DOM reads/writes, avoid interleaving
- Use DocumentFragment for batch node insertion
- Use CSS contain to isolate reflow scope

**3. How do you implement image lazy loading?**

```javascript
// 1. Native loading="lazy"
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

**4. What are Service Worker caching strategies?**

- **Cache First**: Prioritize cache, suitable for static resources
- **Network First**: Prioritize network requests, suitable for API data
- **Stale While Revalidate**: Return cache while updating in background
- **Cache Only**: Only use cache
- **Network Only**: Only use network

**5. How do React/Vue avoid unnecessary re-renders?**

React:
- Use React.memo to wrap components
- Use useMemo/useCallback to cache values and functions
- Use useTransition to mark non-urgent updates

Vue:
- Use v-once to render static content
- Use v-memo to cache list items
- Use shallowRef to reduce reactivity overhead
- Use computed for cached calculations

**6. What are specific measures for first-screen optimization?**

```
Loading optimization:
|-- Resource compression (Gzip/Brotli)
|-- Code splitting and lazy loading
|-- Preload critical resources
|-- Use CDN
+-- Enable HTTP/2

Rendering optimization:
|-- SSR/SSG
|-- Skeleton screens
|-- Inline critical CSS
|-- Defer non-critical resources
+-- Reduce DOM count

Caching optimization:
|-- Configure proper HTTP caching
|-- Service Worker offline caching
+-- Local storage data caching
```

### Performance Optimization Checklist

```markdown
## Loading Phase
- [ ] Use Gzip/Brotli compression
- [ ] Enable HTTP/2
- [ ] Configure CDN
- [ ] Code splitting and lazy loading
- [ ] Tree Shaking to remove dead code
- [ ] Preload critical resources
- [ ] Image compression and format optimization

## Rendering Phase
- [ ] Reduce DOM depth and count
- [ ] Avoid forced synchronous layout
- [ ] Use CSS animations instead of JS
- [ ] Use transform/opacity for compositing
- [ ] Virtual scrolling for large lists
- [ ] Use requestAnimationFrame

## Runtime Phase
- [ ] Break up long tasks
- [ ] Use Web Workers
- [ ] Use memo/caching appropriately
- [ ] Debounce and throttle event handlers
- [ ] Clean up timers and listeners promptly

## Monitoring Phase
- [ ] Integrate Web Vitals monitoring
- [ ] Set up performance budget alerts
- [ ] Regular Lighthouse audits
```

---

## Summary

Frontend performance optimization is a systematic endeavor that requires consideration from multiple dimensions:

1. **Understand the Fundamentals**: Deep understanding of browser rendering principles and network request processes
2. **Measure with Metrics**: Use standard metrics like Core Web Vitals to measure performance
3. **Continuous Monitoring**: Establish a performance monitoring system to identify issues promptly
4. **Incremental Optimization**: Implement optimization measures progressively based on priority
5. **Balance Tradeoffs**: Find the right balance between performance, development efficiency, and user experience

Mastering these performance optimization techniques not only enables you to build high-performance web applications but is also an essential skill for becoming a senior frontend engineer.

---

## Related Resources

- [web.dev - Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [webpack Performance Optimization](https://webpack.js.org/guides/build-performance/)
- [React Official Performance Optimization](https://react.dev/reference/react/memo)
- [Vue Performance Guide](https://vuejs.org/guide/best-practices/performance.html)
