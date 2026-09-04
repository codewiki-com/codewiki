---
title: JavaScript Service Workers
description: 学习 Service Workers 实现离线应用、缓存策略和推送通知
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - Service Workers
  - PWA
  - 离线
status: imported
origin: old/src/content/docs/javascript/service-workers.zh.md
divergence: 0.195
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: 浏览器API
  order: 26
  lastUpdated: 2026-01-07
---

## 概述

Service Worker 是一种在浏览器后台独立于网页运行的脚本，它充当 Web 应用程序、浏览器和网络之间的代理服务器。作为 Progressive Web App (PWA) 的核心技术，Service Worker 赋予了 Web 应用接近原生应用的能力，包括离线访问、后台同步和推送通知等高级功能。

### 为什么需要 Service Worker

在传统的 Web 开发中，应用完全依赖网络连接。一旦用户断网，应用就无法正常工作。Service Worker 的出现彻底改变了这一局面：

```javascript
// 没有 Service Worker 时的网络请求
fetch('/api/data')
  .then(response => response.json())
  .then(data => renderUI(data))
  .catch(error => {
    // 网络错误，用户看到空白页面或错误信息
    showError('无法加载数据，请检查网络连接');
  });

// 有 Service Worker 时，即使离线也能提供缓存的响应
// Service Worker 会拦截请求，返回缓存内容
```

### Service Worker 的核心能力

| 能力 | 描述 | 应用场景 |
|------|------|----------|
| 网络代理 | 拦截和处理网络请求 | 实现自定义缓存策略 |
| 离线支持 | 在无网络时提供内容 | 离线优先应用 |
| 后台同步 | 网络恢复后同步数据 | 表单提交、消息发送 |
| 推送通知 | 接收服务器推送消息 | 实时消息提醒 |
| 资源预缓存 | 提前缓存关键资源 | 提升首屏加载速度 |

---

## Service Worker 生命周期

Service Worker 拥有独立于网页的生命周期，这是它能够实现离线功能的关键。理解生命周期对于正确使用 Service Worker 至关重要。

### 生命周期阶段

```
下载 → 解析 → 安装(Installing) → 等待(Waiting) → 激活(Activating) → 已激活(Activated) → 空闲/终止
                    ↓                                      ↓
              install 事件                           activate 事件
```

### 注册阶段 (Registration)

注册是 Service Worker 生命周期的起点。浏览器下载并解析 Service Worker 脚本。

```javascript
// 在主线程中注册 Service Worker
// main.js

// 首先检查浏览器是否支持
if ('serviceWorker' in navigator) {
  // 页面加载完成后注册，避免影响首屏性能
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',                    // 控制范围，默认为 SW 文件所在目录
        updateViaCache: 'none'         // 不使用 HTTP 缓存检查更新
      });

      console.log('Service Worker 注册成功');
      console.log('作用域:', registration.scope);

      // 检查 Service Worker 状态
      if (registration.installing) {
        console.log('Service Worker 正在安装');
      } else if (registration.waiting) {
        console.log('Service Worker 已安装，等待激活');
      } else if (registration.active) {
        console.log('Service Worker 已激活');
      }

    } catch (error) {
      console.error('Service Worker 注册失败:', error);
    }
  });
}
```

### 安装阶段 (Installing)

当 Service Worker 首次注册或检测到更新时，会触发 `install` 事件。这是预缓存静态资源的最佳时机。

```javascript
// sw.js

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `app-cache-${CACHE_VERSION}`;

// 需要预缓存的核心资源
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/app.js',
  '/images/logo.png',
  '/offline.html',          // 离线回退页面
  '/manifest.json'
];

self.addEventListener('install', event => {
  console.log('[Service Worker] 安装中...');

  // event.waitUntil() 告诉浏览器安装过程何时完成
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] 预缓存资源');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] 安装完成');
        // skipWaiting() 跳过等待，立即激活
        // 注意：这可能导致旧页面使用新的 Service Worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] 预缓存失败:', error);
        // 预缓存失败会导致安装失败
        throw error;
      })
  );
});
```

### 等待阶段 (Waiting)

新安装的 Service Worker 会进入等待状态，直到所有使用旧版本的页面都关闭。

```javascript
// 检测新版本等待激活
navigator.serviceWorker.ready.then(registration => {
  // 监听 Service Worker 状态变化
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // 存在旧的 Service Worker，新版本等待激活
          console.log('新版本已就绪，等待激活');
          showUpdateNotification();
        } else {
          // 首次安装
          console.log('应用已可离线使用');
        }
      }
    });
  });
});

// 显示更新提示
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.textContent = '新版本可用';

  const button = document.createElement('button');
  button.textContent = '立即更新';
  button.onclick = updateServiceWorker;
  notification.appendChild(button);

  document.body.appendChild(notification);
}

// 触发更新
function updateServiceWorker() {
  navigator.serviceWorker.ready.then(registration => {
    if (registration.waiting) {
      // 通知等待中的 Service Worker 跳过等待
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });
}

// 监听控制器变化，刷新页面
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
});
```

### 激活阶段 (Activating)

当没有页面使用旧版本时，新 Service Worker 激活。这是清理旧缓存的最佳时机。

```javascript
// sw.js

self.addEventListener('activate', event => {
  console.log('[Service Worker] 激活中...');

  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // 删除所有不是当前版本的缓存
              return cacheName.startsWith('app-cache-') &&
                     cacheName !== CACHE_NAME;
            })
            .map(cacheName => {
              console.log('[Service Worker] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),

      // 立即接管所有页面
      self.clients.claim()
    ])
    .then(() => {
      console.log('[Service Worker] 激活完成');
    })
  );
});

// 在 install 事件中监听跳过等待的消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

### 已激活状态 (Activated)

激活后的 Service Worker 开始控制页面，可以响应 fetch、push、sync 等事件。

```javascript
// sw.js

// 响应网络请求
self.addEventListener('fetch', event => {
  // 拦截所有网络请求
  event.respondWith(handleFetch(event.request));
});

// 响应推送消息
self.addEventListener('push', event => {
  // 处理推送通知
  event.waitUntil(handlePush(event));
});

// 响应后台同步
self.addEventListener('sync', event => {
  // 处理后台同步
  event.waitUntil(handleSync(event));
});
```

---

## 注册与作用域

### 注册详解

```javascript
// 完整的注册选项
const registrationOptions = {
  scope: '/',                  // 作用域路径
  type: 'classic',             // 'classic' 或 'module'
  updateViaCache: 'none'       // 'all', 'imports', 'none'
};

// 高级注册示例
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('浏览器不支持 Service Worker');
    return null;
  }

  // HTTPS 检查（localhost 除外）
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    console.warn('Service Worker 需要 HTTPS 环境');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('注册成功，作用域:', registration.scope);

    // 定期检查更新
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // 每小时检查一次

    return registration;

  } catch (error) {
    console.error('注册失败:', error);
    return null;
  }
}
```

### 作用域规则

Service Worker 只能控制其作用域及子目录下的页面。

```javascript
// 作用域示例

// sw.js 位于 /app/sw.js
navigator.serviceWorker.register('/app/sw.js');
// 默认作用域: /app/
// 可控制: /app/, /app/page.html, /app/sub/page.html
// 不可控制: /, /other/

// 显式指定作用域
navigator.serviceWorker.register('/sw.js', { scope: '/blog/' });
// 作用域: /blog/
// 可控制: /blog/, /blog/posts/1
// 不可控制: /, /app/

// 作用域限制
// 作用域不能超出 Service Worker 文件所在目录
// 除非服务器设置了 Service-Worker-Allowed 响应头

// 错误示例
navigator.serviceWorker.register('/scripts/sw.js', { scope: '/' });
// 会失败，因为 /scripts/sw.js 不能控制 /

// 解决方案：服务器配置
// 响应头: Service-Worker-Allowed: /
```

### 多个 Service Worker

```javascript
// 一个域名可以有多个 Service Worker，作用域不同

// 主站 Service Worker
navigator.serviceWorker.register('/sw-main.js', { scope: '/' });

// 博客专用 Service Worker
navigator.serviceWorker.register('/blog/sw-blog.js', { scope: '/blog/' });

// 管理后台 Service Worker
navigator.serviceWorker.register('/admin/sw-admin.js', { scope: '/admin/' });

// 注意：更具体的作用域优先
// /blog/post/1 会被 /blog/ 作用域的 SW 控制，而不是 /
```

---

## Fetch 事件与请求拦截

fetch 事件是 Service Worker 最强大的能力，允许你拦截并处理所有网络请求。

### 基础拦截

```javascript
// sw.js

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  console.log('[Service Worker] 拦截请求:', request.url);
  console.log('请求方法:', request.method);
  console.log('请求模式:', request.mode);           // 'cors', 'no-cors', 'same-origin', 'navigate'
  console.log('凭据模式:', request.credentials);    // 'omit', 'same-origin', 'include'
  console.log('目标类型:', request.destination);    // 'document', 'image', 'script', 'style', etc.

  // respondWith() 必须同步调用
  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  // 尝试从缓存获取
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('[Service Worker] 从缓存返回:', request.url);
    return cachedResponse;
  }

  // 缓存未命中，发起网络请求
  console.log('[Service Worker] 从网络获取:', request.url);
  return fetch(request);
}
```

### 请求过滤

```javascript
// sw.js

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return; // 不调用 respondWith，让浏览器正常处理
  }

  // 只处理 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过 Chrome 扩展请求
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // 跳过 API 请求（使用不同策略）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 跳过 WebSocket 请求
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // 处理其他请求
  event.respondWith(handleStaticRequest(request));
});
```

### 修改请求和响应

```javascript
// sw.js

self.addEventListener('fetch', event => {
  const request = event.request;

  event.respondWith(
    (async () => {
      // 修改请求：添加自定义头部
      const modifiedRequest = new Request(request, {
        headers: new Headers({
          ...Object.fromEntries(request.headers.entries()),
          'X-Custom-Header': 'ServiceWorker',
          'X-Request-Time': Date.now().toString()
        })
      });

      try {
        const response = await fetch(modifiedRequest);

        // 修改响应：添加自定义头部
        const modifiedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers({
            ...Object.fromEntries(response.headers.entries()),
            'X-Served-By': 'ServiceWorker',
            'X-Cache-Status': 'MISS'
          })
        });

        return modifiedResponse;

      } catch (error) {
        // 网络错误，返回自定义错误响应
        return new Response(
          JSON.stringify({ error: '网络请求失败', message: error.message }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    })()
  );
});
```

### 路由策略

```javascript
// sw.js

// 定义路由规则
const routes = [
  {
    match: /^\/api\//,
    handler: networkFirst
  },
  {
    match: /\.(js|css)$/,
    handler: staleWhileRevalidate
  },
  {
    match: /\.(png|jpg|jpeg|gif|svg|webp)$/,
    handler: cacheFirst
  },
  {
    match: /^\/$/,
    handler: networkFirst
  }
];

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 查找匹配的路由
  const route = routes.find(r => {
    if (r.match instanceof RegExp) {
      return r.match.test(url.pathname);
    }
    return url.pathname === r.match;
  });

  if (route) {
    event.respondWith(route.handler(event.request));
  }
});
```

---

## 缓存策略

缓存策略决定了 Service Worker 如何处理请求。选择合适的策略对应用性能和用户体验至关重要。

### 仅缓存 (Cache Only)

只从缓存获取，适用于不会变化的静态资源。

```javascript
// sw.js

async function cacheOnly(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // 缓存未命中，返回错误
  return new Response('资源未缓存', {
    status: 404,
    statusText: 'Not Found'
  });
}

// 适用场景
// - 预缓存的 App Shell 资源
// - 版本化的静态资源（带 hash 的文件名）
// - 字体文件
```

### 仅网络 (Network Only)

只从网络获取，不使用缓存。

```javascript
// sw.js

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response('网络不可用', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// 适用场景
// - 非 GET 请求（POST、PUT、DELETE）
// - 实时数据（股票价格、聊天消息）
// - 认证相关请求
```

### 缓存优先 (Cache First)

先查缓存，缓存未命中再请求网络。

```javascript
// sw.js

async function cacheFirst(request, cacheName = 'static-cache') {
  // 1. 检查缓存
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // 2. 缓存未命中，请求网络
  try {
    const networkResponse = await fetch(request);

    // 3. 缓存新响应
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    // 4. 网络也失败，返回离线页面
    return caches.match('/offline.html');
  }
}

// 适用场景
// - 静态资源（CSS、JS、图片）
// - 不常变化的内容
// - 性能优先的场景
```

### 网络优先 (Network First)

先请求网络，失败后使用缓存。

```javascript
// sw.js

async function networkFirst(request, cacheName = 'dynamic-cache', timeout = 3000) {
  const cache = await caches.open(cacheName);

  try {
    // 1. 带超时的网络请求
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), timeout);
    });

    const networkResponse = await Promise.race([networkPromise, timeoutPromise]);

    // 2. 缓存成功的响应
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    // 3. 网络失败，使用缓存
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // 4. 缓存也没有，返回离线页面
    return caches.match('/offline.html');
  }
}

// 适用场景
// - HTML 页面
// - API 请求
// - 需要最新数据的内容
```

### 边缓存边更新 (Stale While Revalidate)

立即返回缓存，同时在后台更新缓存。

```javascript
// sw.js

async function staleWhileRevalidate(request, cacheName = 'swr-cache') {
  const cache = await caches.open(cacheName);

  // 1. 从缓存获取（立即）
  const cachedResponse = await cache.match(request);

  // 2. 同时发起网络请求更新缓存
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(error => {
      console.log('[SW] 后台更新失败:', error);
      return null;
    });

  // 3. 有缓存就立即返回，否则等待网络
  return cachedResponse || fetchPromise;
}

// 适用场景
// - 经常变化但不要求立即最新的内容
// - 用户头像、评论列表
// - 新闻文章、博客内容
```

### 带版本的缓存策略

```javascript
// sw.js

const CACHE_CONFIG = {
  static: {
    name: 'static-v1',
    maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 天
    maxEntries: 100
  },
  dynamic: {
    name: 'dynamic-v1',
    maxAge: 24 * 60 * 60 * 1000,        // 1 天
    maxEntries: 50
  },
  images: {
    name: 'images-v1',
    maxAge: 7 * 24 * 60 * 60 * 1000,    // 7 天
    maxEntries: 200
  }
};

async function cacheWithExpiry(request, config) {
  const cache = await caches.open(config.name);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // 检查是否过期
    const cachedTime = cachedResponse.headers.get('sw-cache-time');
    if (cachedTime && Date.now() - parseInt(cachedTime) < config.maxAge) {
      return cachedResponse;
    }
  }

  // 请求新数据
  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    // 添加缓存时间戳
    const headers = new Headers(networkResponse.headers);
    headers.set('sw-cache-time', Date.now().toString());

    const responseToCache = new Response(await networkResponse.clone().blob(), {
      status: networkResponse.status,
      statusText: networkResponse.statusText,
      headers
    });

    await cache.put(request, responseToCache);

    // 清理过期条目
    await trimCache(config.name, config.maxEntries);
  }

  return networkResponse;
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxEntries) {
    // 删除最旧的条目
    const deleteCount = keys.length - maxEntries;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
}
```

### 完整的缓存策略路由

```javascript
// sw.js

const CACHE_NAME = 'app-v1';

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源的 GET 请求
  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }

  // 根据请求类型选择策略
  if (request.mode === 'navigate') {
    // HTML 页面：网络优先
    event.respondWith(networkFirst(request, 'pages-cache'));
  } else if (request.destination === 'image') {
    // 图片：缓存优先
    event.respondWith(cacheFirst(request, 'images-cache'));
  } else if (request.destination === 'script' || request.destination === 'style') {
    // JS/CSS：边缓存边更新
    event.respondWith(staleWhileRevalidate(request, 'static-cache'));
  } else if (url.pathname.startsWith('/api/')) {
    // API：网络优先，短超时
    event.respondWith(networkFirst(request, 'api-cache', 2000));
  } else {
    // 其他：缓存优先
    event.respondWith(cacheFirst(request, CACHE_NAME));
  }
});
```

---

## 后台同步 (Background Sync)

Background Sync API 允许 Web 应用在网络恢复时自动同步数据，即使用户已经离开页面。

### 注册同步任务

```javascript
// main.js

// 检查是否支持 Background Sync
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  // 支持后台同步
  console.log('支持 Background Sync');
}

// 表单提交示例
async function submitForm(formData) {
  try {
    // 首先尝试直接提交
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      showSuccess('提交成功');
      return;
    }

    throw new Error('提交失败');

  } catch (error) {
    // 网络错误，存储数据并注册同步
    await saveToOutbox(formData);
    await registerSync('sync-forms');
    showNotification('数据已保存，将在网络恢复后自动提交');
  }
}

// 将数据保存到 IndexedDB
async function saveToOutbox(data) {
  const db = await openDatabase();
  const tx = db.transaction('outbox', 'readwrite');
  const store = tx.objectStore('outbox');

  await store.add({
    id: Date.now(),
    data: data,
    timestamp: new Date().toISOString()
  });
}

// 注册同步任务
async function registerSync(tag) {
  const registration = await navigator.serviceWorker.ready;

  try {
    await registration.sync.register(tag);
    console.log('后台同步已注册:', tag);
  } catch (error) {
    console.error('注册后台同步失败:', error);
  }
}

// 打开 IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('app-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id' });
      }
    };
  });
}
```

### 处理同步事件

```javascript
// sw.js

self.addEventListener('sync', event => {
  console.log('[Service Worker] 收到同步事件:', event.tag);

  if (event.tag === 'sync-forms') {
    event.waitUntil(syncForms());
  }

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncForms() {
  const db = await openDatabase();
  const tx = db.transaction('outbox', 'readonly');
  const store = tx.objectStore('outbox');
  const items = await getAllFromStore(store);

  console.log('[Service Worker] 待同步项目:', items.length);

  for (const item of items) {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(item.data),
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // 提交成功，从 outbox 删除
        await deleteFromOutbox(item.id);
        console.log('[Service Worker] 同步成功:', item.id);

        // 通知页面
        await notifyClients({
          type: 'SYNC_SUCCESS',
          id: item.id
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('[Service Worker] 同步失败:', error);
      // 抛出错误会触发重试
      throw error;
    }
  }
}

// 从 IndexedDB 读取所有数据
function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 从 outbox 删除已同步的数据
async function deleteFromOutbox(id) {
  const db = await openDatabase();
  const tx = db.transaction('outbox', 'readwrite');
  const store = tx.objectStore('outbox');
  await store.delete(id);
}

// 通知所有客户端
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}
```

### 周期性后台同步

```javascript
// main.js

// 注册周期性同步（需要权限）
async function registerPeriodicSync() {
  const registration = await navigator.serviceWorker.ready;

  // 检查权限
  const status = await navigator.permissions.query({
    name: 'periodic-background-sync'
  });

  if (status.state === 'granted') {
    try {
      await registration.periodicSync.register('update-content', {
        minInterval: 24 * 60 * 60 * 1000  // 最小间隔 24 小时
      });
      console.log('周期性同步已注册');
    } catch (error) {
      console.error('注册周期性同步失败:', error);
    }
  }
}

// sw.js

self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  // 更新缓存的内容
  const cache = await caches.open('content-cache');

  const urls = [
    '/api/articles',
    '/api/notifications',
    '/data/config.json'
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.error('更新失败:', url, error);
    }
  }
}
```

---

## 推送通知 (Push Notifications)

Push API 允许服务器向用户发送消息，即使网页未打开。这是保持用户参与度的重要功能。

### 请求通知权限

```javascript
// main.js

async function requestNotificationPermission() {
  // 检查浏览器支持
  if (!('Notification' in window)) {
    console.warn('浏览器不支持通知');
    return false;
  }

  if (!('PushManager' in window)) {
    console.warn('浏览器不支持推送');
    return false;
  }

  // 检查当前权限状态
  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('用户已拒绝通知权限');
    return false;
  }

  // 请求权限
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}
```

### 订阅推送服务

```javascript
// main.js

// VAPID 公钥（从服务器获取）
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

async function subscribeToPush() {
  try {
    // 确保有通知权限
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      throw new Error('没有通知权限');
    }

    // 获取 Service Worker 注册
    const registration = await navigator.serviceWorker.ready;

    // 检查是否已订阅
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('已存在订阅');
      return subscription;
    }

    // 创建新订阅
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,  // 必须显示通知
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('推送订阅成功:', subscription);

    // 将订阅信息发送到服务器
    await sendSubscriptionToServer(subscription);

    return subscription;

  } catch (error) {
    console.error('订阅失败:', error);
    throw error;
  }
}

// Base64 转 Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// 发送订阅到服务器
async function sendSubscriptionToServer(subscription) {
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error('保存订阅失败');
  }
}

// 取消订阅
async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();

    // 通知服务器删除订阅
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscription.endpoint
      })
    });

    console.log('已取消订阅');
  }
}
```

### 处理推送事件

```javascript
// sw.js

self.addEventListener('push', event => {
  console.log('[Service Worker] 收到推送消息');

  let data = {
    title: '新消息',
    body: '您有新的通知',
    icon: '/images/icon-192.png',
    badge: '/images/badge.png'
  };

  // 解析推送数据
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/images/icon-192.png',
    badge: data.badge || '/images/badge.png',
    image: data.image,                           // 大图
    tag: data.tag || 'default',                  // 通知标签（相同标签会替换）
    renotify: data.renotify || false,            // 相同标签是否重新通知
    requireInteraction: data.requireInteraction || false,  // 是否需要用户交互才消失
    silent: data.silent || false,                // 是否静音
    vibrate: data.vibrate || [200, 100, 200],    // 振动模式
    data: {                                       // 自定义数据
      url: data.url || '/',
      timestamp: Date.now(),
      ...data.data
    },
    actions: data.actions || [                   // 操作按钮
      { action: 'open', title: '查看', icon: '/images/open.png' },
      { action: 'dismiss', title: '忽略', icon: '/images/dismiss.png' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
```

### 处理通知点击

```javascript
// sw.js

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] 通知被点击');

  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  // 关闭通知
  notification.close();

  if (action === 'dismiss') {
    // 用户点击"忽略"，不做任何操作
    return;
  }

  // 打开对应页面
  const urlToOpen = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // 检查是否已有打开的窗口
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // 没有打开的窗口，打开新窗口
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// 通知关闭事件
self.addEventListener('notificationclose', event => {
  console.log('[Service Worker] 通知被关闭');

  // 可以在这里记录统计信息
  const data = event.notification.data;

  fetch('/api/analytics/notification-closed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag: event.notification.tag,
      timestamp: data.timestamp,
      closedAt: Date.now()
    })
  }).catch(() => {
    // 忽略分析请求失败
  });
});
```

### 服务端推送示例 (Node.js)

```javascript
// server.js

const webpush = require('web-push');

// 配置 VAPID
webpush.setVapidDetails(
  'mailto:admin@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// 存储订阅（实际应使用数据库）
const subscriptions = new Map();

// 保存订阅
app.post('/api/push/subscribe', (req, res) => {
  const { subscription, userAgent } = req.body;

  subscriptions.set(subscription.endpoint, {
    subscription,
    userAgent,
    createdAt: new Date()
  });

  res.status(201).json({ message: '订阅成功' });
});

// 发送推送
async function sendPushNotification(endpoint, payload) {
  const data = subscriptions.get(endpoint);

  if (!data) {
    throw new Error('订阅不存在');
  }

  try {
    await webpush.sendNotification(
      data.subscription,
      JSON.stringify(payload)
    );

    console.log('推送发送成功');

  } catch (error) {
    if (error.statusCode === 410) {
      // 订阅已失效，删除
      subscriptions.delete(endpoint);
    }
    throw error;
  }
}

// 群发推送
async function broadcastNotification(payload) {
  const results = [];

  for (const [endpoint, data] of subscriptions) {
    try {
      await webpush.sendNotification(
        data.subscription,
        JSON.stringify(payload)
      );
      results.push({ endpoint, success: true });

    } catch (error) {
      results.push({ endpoint, success: false, error: error.message });

      if (error.statusCode === 410) {
        subscriptions.delete(endpoint);
      }
    }
  }

  return results;
}

// 发送通知的 API
app.post('/api/push/send', async (req, res) => {
  const { title, body, url, tag } = req.body;

  const payload = {
    title,
    body,
    url,
    tag,
    icon: '/images/icon-192.png',
    actions: [
      { action: 'open', title: '查看' }
    ]
  };

  const results = await broadcastNotification(payload);

  res.json({
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  });
});
```

---

## 实战示例

### 完整的 PWA Service Worker

```javascript
// sw.js - 完整的生产级 Service Worker

const VERSION = '2.0.0';
const CACHE_PREFIX = 'my-app-';
const CACHES = {
  static: `${CACHE_PREFIX}static-${VERSION}`,
  dynamic: `${CACHE_PREFIX}dynamic-${VERSION}`,
  images: `${CACHE_PREFIX}images-${VERSION}`,
  api: `${CACHE_PREFIX}api-${VERSION}`
};

// 预缓存资源列表
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/main.css',
  '/css/offline.css',
  '/js/app.js',
  '/js/offline.js',
  '/images/logo.svg',
  '/images/offline.svg',
  '/manifest.json'
];

// API 配置
const API_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 分钟
const API_CACHE_MAX_ENTRIES = 50;

// ==================== 安装事件 ====================

self.addEventListener('install', event => {
  console.log(`[SW v${VERSION}] 安装中...`);

  event.waitUntil(
    caches.open(CACHES.static)
      .then(cache => {
        console.log(`[SW v${VERSION}] 预缓存资源`);
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log(`[SW v${VERSION}] 安装完成`);
        return self.skipWaiting();
      })
  );
});

// ==================== 激活事件 ====================

self.addEventListener('activate', event => {
  console.log(`[SW v${VERSION}] 激活中...`);

  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then(cacheNames => {
        const currentCaches = Object.values(CACHES);
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith(CACHE_PREFIX) && !currentCaches.includes(name))
            .map(name => {
              console.log(`[SW v${VERSION}] 删除旧缓存:`, name);
              return caches.delete(name);
            })
        );
      }),
      // 接管所有页面
      self.clients.claim()
    ]).then(() => {
      console.log(`[SW v${VERSION}] 激活完成`);
    })
  );
});

// ==================== Fetch 事件 ====================

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过非同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // 根据请求类型路由
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleNavigationRequest(request));
  }
});

// 判断是否为图片请求
function isImageRequest(request) {
  return request.destination === 'image' ||
         /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(new URL(request.url).pathname);
}

// 判断是否为静态资源
function isStaticAsset(pathname) {
  return /\.(js|css|woff2?|ttf|eot)$/i.test(pathname);
}

// 处理 API 请求 - 网络优先
async function handleApiRequest(request) {
  const cache = await caches.open(CACHES.api);

  try {
    const response = await fetch(request);

    if (response.ok) {
      // 添加缓存时间戳
      const responseToCache = await addCacheTimestamp(response);
      await cache.put(request, responseToCache);
      await trimCache(CACHES.api, API_CACHE_MAX_ENTRIES);
    }

    return response;

  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // 检查是否过期
      const cacheTime = cachedResponse.headers.get('sw-cache-time');
      if (cacheTime && Date.now() - parseInt(cacheTime) < API_CACHE_MAX_AGE) {
        return cachedResponse;
      }
    }

    // 返回离线响应
    return new Response(JSON.stringify({ error: 'offline', message: '网络不可用' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 处理图片请求 - 缓存优先
async function handleImageRequest(request) {
  const cache = await caches.open(CACHES.images);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;

  } catch (error) {
    // 返回占位图
    return caches.match('/images/offline.svg');
  }
}

// 处理静态资源 - 缓存优先
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(CACHES.static);
      cache.put(request, response.clone());
    }

    return response;

  } catch (error) {
    return new Response('Resource not available', { status: 404 });
  }
}

// 处理导航请求 - 网络优先 + 离线回退
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(CACHES.dynamic);
      cache.put(request, response.clone());
    }

    return response;

  } catch (error) {
    // 尝试从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 返回离线页面
    return caches.match('/offline.html');
  }
}

// 添加缓存时间戳
async function addCacheTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-time', Date.now().toString());

  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// 清理缓存
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxEntries) {
    for (let i = 0; i < keys.length - maxEntries; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// ==================== 消息事件 ====================

self.addEventListener('message', event => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.source.postMessage({ type: 'VERSION', version: VERSION });
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then(names =>
          Promise.all(names.map(name => caches.delete(name)))
        ).then(() => {
          event.source.postMessage({ type: 'CACHE_CLEARED' });
        })
      );
      break;

    case 'CACHE_URLS':
      event.waitUntil(
        caches.open(CACHES.dynamic).then(cache =>
          cache.addAll(payload.urls)
        ).then(() => {
          event.source.postMessage({ type: 'URLS_CACHED' });
        })
      );
      break;
  }
});

// ==================== 推送事件 ====================

self.addEventListener('push', event => {
  let data = {
    title: '新消息',
    body: '您有新的通知',
    icon: '/images/icon-192.png',
    badge: '/images/badge.png',
    url: '/'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag || 'default',
      data: { url: data.url },
      actions: [
        { action: 'open', title: '查看' },
        { action: 'dismiss', title: '忽略' }
      ]
    })
  );
});

// ==================== 通知点击 ====================

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // 查找已打开的窗口
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // 打开新窗口
      return clients.openWindow(url);
    })
  );
});

// ==================== 后台同步 ====================

self.addEventListener('sync', event => {
  console.log(`[SW v${VERSION}] 后台同步:`, event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // 实现数据同步逻辑
  const db = await openDatabase();
  const tx = db.transaction('outbox', 'readonly');
  const store = tx.objectStore('outbox');
  const items = await getAllItems(store);

  for (const item of items) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body
      });

      await deleteItem(item.id);

    } catch (error) {
      console.error('同步失败:', error);
      throw error; // 触发重试
    }
  }
}

// IndexedDB 辅助函数
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('app-db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllItems(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteItem(id) {
  const db = await openDatabase();
  const tx = db.transaction('outbox', 'readwrite');
  return tx.objectStore('outbox').delete(id);
}
```

### 主线程管理代码

```javascript
// sw-manager.js - Service Worker 管理类

class ServiceWorkerManager {
  constructor(swPath = '/sw.js') {
    this.swPath = swPath;
    this.registration = null;
    this.updateCallbacks = [];
  }

  // 注册 Service Worker
  async register() {
    if (!this.isSupported()) {
      console.warn('Service Worker 不受支持');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register(this.swPath, {
        scope: '/'
      });

      console.log('Service Worker 注册成功');

      // 设置更新监听
      this.setupUpdateListener();

      // 设置消息监听
      this.setupMessageListener();

      return this.registration;

    } catch (error) {
      console.error('Service Worker 注册失败:', error);
      return null;
    }
  }

  // 检查支持
  isSupported() {
    return 'serviceWorker' in navigator;
  }

  // 监听更新
  setupUpdateListener() {
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // 有新版本
            this.updateCallbacks.forEach(cb => cb());
          }
        }
      });
    });

    // 监听控制器变化
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  // 消息监听
  setupMessageListener() {
    navigator.serviceWorker.addEventListener('message', event => {
      console.log('收到 Service Worker 消息:', event.data);
    });
  }

  // 注册更新回调
  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  // 检查更新
  async checkForUpdate() {
    if (this.registration) {
      await this.registration.update();
    }
  }

  // 跳过等待
  skipWaiting() {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // 发送消息
  postMessage(message) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }

  // 获取版本
  async getVersion() {
    return new Promise(resolve => {
      const channel = new MessageChannel();
      channel.port1.onmessage = event => {
        if (event.data.type === 'VERSION') {
          resolve(event.data.version);
        }
      };

      navigator.serviceWorker.controller?.postMessage(
        { type: 'GET_VERSION' },
        [channel.port2]
      );
    });
  }

  // 清除缓存
  async clearCache() {
    return new Promise(resolve => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve();

      navigator.serviceWorker.controller?.postMessage(
        { type: 'CLEAR_CACHE' },
        [channel.port2]
      );
    });
  }

  // 注销
  async unregister() {
    if (this.registration) {
      const success = await this.registration.unregister();
      if (success) {
        this.registration = null;
      }
      return success;
    }
    return false;
  }
}

// 使用示例
const swManager = new ServiceWorkerManager('/sw.js');

// 页面加载后注册
window.addEventListener('load', async () => {
  await swManager.register();

  // 监听更新
  swManager.onUpdate(() => {
    if (confirm('新版本可用，是否更新？')) {
      swManager.skipWaiting();
    }
  });
});
```

---

## 常见问题与调试

### 调试技巧

```javascript
// 1. 使用 Chrome DevTools
// Application -> Service Workers

// 2. 强制更新
// 勾选 "Update on reload"

// 3. 查看缓存
// Application -> Cache Storage

// 4. 清除所有数据
// Application -> Clear storage

// 5. 在 Service Worker 中添加日志
self.addEventListener('fetch', event => {
  console.log('[SW]', event.request.method, event.request.url);
  // ...
});
```

### 常见错误处理

```javascript
// 1. 注册失败
navigator.serviceWorker.register('/sw.js')
  .catch(error => {
    if (error.name === 'SecurityError') {
      console.error('需要 HTTPS 环境');
    } else if (error.message.includes('unsupported MIME type')) {
      console.error('Service Worker 文件类型错误，需要 application/javascript');
    } else {
      console.error('注册失败:', error);
    }
  });

// 2. 缓存失败
cache.addAll(urls).catch(error => {
  console.error('预缓存失败:', error);
  // 可能是某个 URL 不存在
  // 使用 cache.add() 逐个添加来定位问题
});

// 3. 响应克隆错误
fetch(request).then(response => {
  // 响应只能读取一次，需要克隆
  const clonedResponse = response.clone();
  cache.put(request, clonedResponse);
  return response;
});
```

### 性能优化建议

1. **减小 Service Worker 文件体积**
   - 避免在 SW 中引入大型库
   - 使用动态导入

2. **合理使用预缓存**
   - 只预缓存核心资源
   - 其他资源运行时缓存

3. **设置缓存过期策略**
   - 定期清理旧缓存
   - 限制缓存条目数量

4. **使用 Navigation Preload**
   - 减少导航请求的等待时间

```javascript
// 启用 Navigation Preload
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );
});

// 使用预加载响应
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) {
          return preloadResponse;
        }
        return fetch(event.request);
      })()
    );
  }
});
```

---

## 浏览器兼容性

| 特性 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| Service Worker | 40+ | 44+ | 11.1+ | 17+ |
| Push API | 42+ | 44+ | 16+ | 17+ |
| Background Sync | 49+ | 不支持 | 不支持 | 79+ |
| Navigation Preload | 59+ | 不支持 | 不支持 | 79+ |

### 功能检测

```javascript
// 完整的功能检测
const features = {
  serviceWorker: 'serviceWorker' in navigator,
  push: 'PushManager' in window,
  notification: 'Notification' in window,
  backgroundSync: 'serviceWorker' in navigator && 'SyncManager' in window,
  periodicSync: 'serviceWorker' in navigator && 'PeriodicSyncManager' in window,
  cacheAPI: 'caches' in window
};

console.log('支持的特性:', features);
```

---

## 总结

Service Worker 是现代 Web 开发的重要技术，它使 Web 应用具备了以下能力：

1. **离线支持** - 通过缓存策略实现离线访问
2. **性能优化** - 减少网络请求，加快加载速度
3. **后台处理** - 支持后台同步和推送通知
4. **可靠性** - 即使在不稳定的网络环境下也能正常工作

### 最佳实践

- 渐进增强：确保应用在不支持 Service Worker 时仍能正常工作
- 版本管理：使用版本号管理缓存，确保更新正确传递
- 错误处理：优雅处理各种错误情况
- 用户体验：及时通知用户新版本可用
- 性能监控：监控 Service Worker 的性能影响

### 延伸阅读

- [MDN Service Worker API](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API)
- [Google Developers - Service Workers](https://developers.google.com/web/fundamentals/primers/service-workers)
- [Workbox](https://developers.google.com/web/tools/workbox) - Google 的 Service Worker 工具库
- [PWA 学习路径](https://web.dev/learn/pwa/)
