---
title: PWA 渐进式Web应用开发
description: 掌握PWA技术栈，构建具有原生应用体验的Web应用
track: javascript
section: browser
difficulty: advanced
tags:
  - PWA
  - Service Worker
  - 离线
  - 移动端
status: imported
origin: old/src/content/docs/frontend/pwa.zh.md
divergence: 0.202
issues: []
legacy:
  category: Frontend
  subcategory: Advanced
  order: 22
  lastUpdated: 2026-01-07
---

## 概念解释

PWA（Progressive Web App，渐进式Web应用）是一种利用现代Web技术构建的应用程序，它结合了Web和原生应用的优点，为用户提供类似原生应用的体验。PWA可以离线工作、接收推送通知、安装到设备主屏幕，同时保持Web应用的可访问性和跨平台特性。

### 历史背景

PWA 的概念由 Google 工程师 Alex Russell 和 Frances Berriman 在 2015 年首次提出。其核心思想是通过渐进增强的方式，让 Web 应用在支持的浏览器中获得更好的用户体验。

PWA 的发展历程：
- **2015年**: PWA 概念提出，Service Worker API 开始普及
- **2017年**: 主流浏览器开始支持 PWA 相关技术
- **2018年**: iOS Safari 开始支持 Service Worker
- **2020年**: PWA 在桌面端得到广泛支持
- **2023年**: PWA 功能持续增强，支持更多原生能力

### PWA 的三大核心技术

```
+----------------------------------------------------------+
|                    PWA 技术栈                              |
+----------------------------------------------------------+
|                                                           |
|  +----------------+  +----------------+  +---------------+ |
|  |    HTTPS      |  | Service Worker |  | Web App       | |
|  |   安全连接     |  |   后台脚本      |  | Manifest      | |
|  +----------------+  +----------------+  +---------------+ |
|         |                  |                   |          |
|         v                  v                   v          |
|    安全通信基础        离线能力/缓存        应用元数据       |
|                       推送通知/后台同步     安装体验         |
|                                                           |
+----------------------------------------------------------+
```

---

## PWA 核心概念与优势

### PWA 的核心特性

PWA 具有以下关键特性，这些特性使其区别于传统 Web 应用：

```typescript
// PWA 特性检测工具
class PWAFeatureDetector {
  // 检测 Service Worker 支持
  static hasServiceWorker(): boolean {
    return 'serviceWorker' in navigator;
  }

  // 检测推送通知支持
  static hasPushNotification(): boolean {
    return 'PushManager' in window;
  }

  // 检测后台同步支持
  static hasBackgroundSync(): boolean {
    return 'sync' in ServiceWorkerRegistration.prototype;
  }

  // 检测安装提示支持
  static hasBeforeInstallPrompt(): boolean {
    return 'BeforeInstallPromptEvent' in window;
  }

  // 检测网络状态 API
  static hasNetworkInformation(): boolean {
    return 'connection' in navigator;
  }

  // 综合检测报告
  static getFeatureReport(): Record<string, boolean> {
    return {
      serviceWorker: this.hasServiceWorker(),
      pushNotification: this.hasPushNotification(),
      backgroundSync: this.hasBackgroundSync(),
      installPrompt: this.hasBeforeInstallPrompt(),
      networkInfo: this.hasNetworkInformation(),
    };
  }
}

// 使用示例
const features = PWAFeatureDetector.getFeatureReport();
console.log('PWA 功能支持情况:', features);
```

### PWA 的核心优势

| 优势 | 描述 | 对比传统 Web |
|------|------|-------------|
| **离线可用** | Service Worker 缓存实现离线访问 | 传统 Web 需要网络连接 |
| **可安装** | 可添加到主屏幕，像原生应用一样启动 | 只能通过浏览器访问 |
| **推送通知** | 支持后台推送消息 | 需要用户主动访问 |
| **快速加载** | 智能缓存策略提升加载速度 | 每次都需要网络请求 |
| **响应式** | 适配各种屏幕尺寸 | 通常也支持 |
| **安全** | 必须使用 HTTPS | HTTP 也可以 |
| **自动更新** | 后台自动更新应用 | 用户需要手动刷新 |

### PWA 适用场景

```typescript
// PWA 适用性评估
interface PWAUseCaseEvaluation {
  scenario: string;
  suitability: 'high' | 'medium' | 'low';
  reasons: string[];
}

const pwaUseCases: PWAUseCaseEvaluation[] = [
  {
    scenario: '新闻/内容类应用',
    suitability: 'high',
    reasons: [
      '内容可离线缓存',
      '推送通知提醒新内容',
      '快速加载提升阅读体验'
    ]
  },
  {
    scenario: '电商应用',
    suitability: 'high',
    reasons: [
      '离线浏览商品目录',
      '推送促销通知',
      '快速的产品页面加载'
    ]
  },
  {
    scenario: '社交应用',
    suitability: 'medium',
    reasons: [
      '消息推送通知',
      '离线查看历史消息',
      '但实时聊天功能受限'
    ]
  },
  {
    scenario: '重度游戏应用',
    suitability: 'low',
    reasons: [
      '性能要求高',
      '需要复杂的图形渲染',
      '原生应用更合适'
    ]
  }
];
```

---

## Web App Manifest 配置

Web App Manifest 是一个 JSON 文件，它告诉浏览器关于 PWA 的元信息，以及应用被"安装"到用户设备时应该如何表现。

### 完整的 Manifest 配置

```json
{
  "name": "我的 PWA 应用",
  "short_name": "PWA应用",
  "description": "这是一个功能完整的渐进式Web应用示例",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#3B82F6",
  "background_color": "#ffffff",
  "lang": "zh-CN",
  "dir": "ltr",
  "categories": ["productivity", "utilities"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "首页截图"
    },
    {
      "src": "/screenshots/mobile-home.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "移动端首页"
    }
  ],
  "shortcuts": [
    {
      "name": "新建任务",
      "short_name": "新建",
      "description": "快速创建新任务",
      "url": "/new-task",
      "icons": [
        {
          "src": "/icons/shortcut-new.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "今日任务",
      "url": "/today",
      "icons": [
        {
          "src": "/icons/shortcut-today.png",
          "sizes": "96x96"
        }
      ]
    }
  ],
  "related_applications": [
    {
      "platform": "play",
      "url": "https://play.google.com/store/apps/details?id=com.example.app",
      "id": "com.example.app"
    }
  ],
  "prefer_related_applications": false,
  "share_target": {
    "action": "/share-target",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "media",
          "accept": ["image/*", "video/*"]
        }
      ]
    }
  }
}
```

### Manifest 配置详解

```typescript
// Manifest 配置类型定义
interface WebAppManifest {
  // 基础信息
  name: string;              // 应用完整名称
  short_name: string;        // 应用短名称，用于主屏幕
  description?: string;      // 应用描述

  // 启动配置
  start_url: string;         // 启动 URL
  scope?: string;            // 应用作用域

  // 显示模式
  display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
  orientation?: 'any' | 'natural' | 'landscape' | 'portrait' |
    'portrait-primary' | 'portrait-secondary' |
    'landscape-primary' | 'landscape-secondary';

  // 主题配置
  theme_color?: string;      // 主题色（状态栏、工具栏）
  background_color?: string; // 启动画面背景色

  // 图标配置
  icons: ManifestIcon[];

  // 快捷方式
  shortcuts?: ManifestShortcut[];

  // 分享目标
  share_target?: ShareTarget;
}

// 显示模式说明
const displayModes = {
  fullscreen: '全屏模式，隐藏所有浏览器 UI',
  standalone: '独立应用模式，像原生应用，有自己的窗口',
  'minimal-ui': '最小 UI 模式，保留必要的导航控件',
  browser: '浏览器模式，在常规浏览器标签中打开'
};
```

### 在 HTML 中引用 Manifest

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- 引入 Web App Manifest -->
  <link rel="manifest" href="/manifest.json">

  <!-- iOS 支持（Safari 不完全支持 manifest） -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="PWA应用">
  <link rel="apple-touch-icon" href="/icons/icon-152x152.png">

  <!-- 主题色 -->
  <meta name="theme-color" content="#3B82F6">

  <!-- Windows 磁贴 -->
  <meta name="msapplication-TileImage" content="/icons/icon-144x144.png">
  <meta name="msapplication-TileColor" content="#3B82F6">

  <title>我的 PWA 应用</title>
</head>
<body>
  <!-- 应用内容 -->
</body>
</html>
```

---

## Service Worker 详解

Service Worker 是 PWA 的核心技术，它是一个运行在浏览器后台的脚本，独立于网页，可以实现离线缓存、推送通知、后台同步等功能。

### Service Worker 生命周期

```
                    +------------------+
                    |    注册 (Register)|
                    +--------+---------+
                             |
                             v
                    +--------+---------+
                    |   安装 (Install)  |
                    |  (下载并缓存资源)  |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
              v                             v
     +--------+--------+           +--------+--------+
     | 等待 (Waiting)   |           | 激活 (Activate) |
     | (旧SW仍在控制)   |           | (清理旧缓存)    |
     +-----------------+           +--------+--------+
                                            |
                                            v
                                   +--------+--------+
                                   | 空闲 (Idle)     |
                                   +--------+--------+
                                            |
                       +--------------------+--------------------+
                       |                    |                    |
                       v                    v                    v
              +--------+--------+  +--------+--------+  +--------+--------+
              |  fetch 事件     |  |  push 事件      |  |  sync 事件      |
              |  (拦截网络请求) |  |  (接收推送)     |  |  (后台同步)     |
              +-----------------+  +-----------------+  +-----------------+
```

### 注册 Service Worker

```typescript
// src/service-worker-registration.ts

// Service Worker 注册配置
interface SWRegistrationConfig {
  scope?: string;
  updateViaCache?: 'imports' | 'all' | 'none';
}

// 注册 Service Worker
async function registerServiceWorker(
  swPath: string = '/sw.js',
  config: SWRegistrationConfig = {}
): Promise<ServiceWorkerRegistration | null> {
  // 检测浏览器支持
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker 不被此浏览器支持');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: config.scope || '/',
      updateViaCache: config.updateViaCache || 'none'
    });

    console.log('Service Worker 注册成功:', registration.scope);

    // 监听更新
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('发现新版本 Service Worker');

      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // 新版本可用，提示用户刷新
            showUpdateNotification();
          } else {
            // 首次安装完成
            console.log('Service Worker 首次安装完成');
          }
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('Service Worker 注册失败:', error);
    return null;
  }
}

// 显示更新提示
function showUpdateNotification(): void {
  const shouldUpdate = confirm('新版本可用，是否立即更新？');
  if (shouldUpdate) {
    // 通知 Service Worker 跳过等待
    navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
    // 刷新页面
    window.location.reload();
  }
}

// 页面加载完成后注册
if (document.readyState === 'complete') {
  registerServiceWorker();
} else {
  window.addEventListener('load', () => registerServiceWorker());
}
```

### 完整的 Service Worker 实现

```javascript
// sw.js - Service Worker 脚本

const CACHE_NAME = 'pwa-cache-v1';
const STATIC_CACHE_NAME = 'static-cache-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1';

// 需要预缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/app.js',
  '/icons/icon-192x192.png',
  '/offline.html'  // 离线页面
];

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[Service Worker] 安装中...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] 预缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // 跳过等待，立即激活
        return self.skipWaiting();
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 激活中...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // 删除不是当前版本的缓存
              return cacheName !== STATIC_CACHE_NAME &&
                     cacheName !== DYNAMIC_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[Service Worker] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // 立即接管所有页面
        return self.clients.claim();
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // 根据请求类型选择不同策略
  if (request.destination === 'document') {
    // HTML 页面 - Network First 策略
    event.respondWith(networkFirst(request));
  } else if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image'
  ) {
    // 静态资源 - Cache First 策略
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API 请求 - Network Only + 缓存响应
    event.respondWith(networkOnly(request));
  } else {
    // 其他请求 - Stale While Revalidate 策略
    event.respondWith(staleWhileRevalidate(request));
  }
});

// 监听来自页面的消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

---

## 离线缓存策略

缓存策略是 PWA 性能和用户体验的关键，不同的资源类型应该采用不同的缓存策略。

### 五种常见缓存策略

```javascript
// 缓存策略实现

/**
 * 策略1: Cache First (缓存优先)
 * 适用于: 静态资源（CSS、JS、图片）
 * 特点: 优先使用缓存，缓存不存在时再请求网络
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('[Cache First] 从缓存返回:', request.url);
    return cachedResponse;
  }

  console.log('[Cache First] 缓存未命中，请求网络:', request.url);
  const networkResponse = await fetch(request);

  // 缓存新的响应
  const cache = await caches.open(STATIC_CACHE_NAME);
  cache.put(request, networkResponse.clone());

  return networkResponse;
}

/**
 * 策略2: Network First (网络优先)
 * 适用于: HTML 页面、需要最新数据的内容
 * 特点: 优先请求网络，失败时使用缓存
 */
async function networkFirst(request) {
  try {
    console.log('[Network First] 请求网络:', request.url);
    const networkResponse = await fetch(request);

    // 缓存成功的响应
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[Network First] 网络请求失败，尝试缓存:', request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // 返回离线页面
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }

    throw error;
  }
}

/**
 * 策略3: Stale While Revalidate (陈旧但更新)
 * 适用于: 不需要实时但需要定期更新的内容
 * 特点: 立即返回缓存，同时后台更新缓存
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // 后台更新缓存（不阻塞响应）
  const networkResponsePromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  // 有缓存就立即返回，否则等待网络
  if (cachedResponse) {
    console.log('[SWR] 返回缓存，后台更新:', request.url);
    return cachedResponse;
  }

  console.log('[SWR] 无缓存，等待网络:', request.url);
  return networkResponsePromise;
}

/**
 * 策略4: Network Only (仅网络)
 * 适用于: 不需要缓存的 API 请求
 * 特点: 只从网络获取，不使用缓存
 */
async function networkOnly(request) {
  console.log('[Network Only] 请求网络:', request.url);
  return fetch(request);
}

/**
 * 策略5: Cache Only (仅缓存)
 * 适用于: 完全离线的应用、预缓存的资源
 * 特点: 只从缓存获取，不请求网络
 */
async function cacheOnly(request) {
  console.log('[Cache Only] 从缓存获取:', request.url);
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  throw new Error('资源未在缓存中找到');
}
```

### 缓存策略选择指南

```
+------------------+------------------+------------------+
|    资源类型      |    推荐策略      |       原因       |
+------------------+------------------+------------------+
| App Shell        | Cache First      | 框架很少变化     |
| (HTML骨架)       |                  |                  |
+------------------+------------------+------------------+
| CSS/JS Bundle    | Cache First +    | 静态资源，      |
|                  | 版本控制         | 通过hash更新     |
+------------------+------------------+------------------+
| 字体文件         | Cache First      | 几乎不变        |
+------------------+------------------+------------------+
| 图片资源         | Cache First      | 减少带宽消耗     |
+------------------+------------------+------------------+
| API 数据         | Network First    | 需要最新数据     |
+------------------+------------------+------------------+
| 用户头像         | Stale While      | 允许短暂陈旧     |
|                  | Revalidate       |                  |
+------------------+------------------+------------------+
| 实时数据         | Network Only     | 必须实时        |
| (股票、聊天)     |                  |                  |
+------------------+------------------+------------------+
```

### 高级缓存管理

```typescript
// 缓存管理工具类
class CacheManager {
  private staticCacheName: string;
  private dynamicCacheName: string;
  private maxDynamicCacheSize: number;

  constructor(
    staticVersion: string = 'v1',
    dynamicVersion: string = 'v1',
    maxSize: number = 50
  ) {
    this.staticCacheName = `static-${staticVersion}`;
    this.dynamicCacheName = `dynamic-${dynamicVersion}`;
    this.maxDynamicCacheSize = maxSize;
  }

  // 预缓存静态资源
  async precache(assets: string[]): Promise<void> {
    const cache = await caches.open(this.staticCacheName);
    await cache.addAll(assets);
  }

  // 动态缓存（带大小限制）
  async dynamicCache(request: Request, response: Response): Promise<void> {
    const cache = await caches.open(this.dynamicCacheName);

    // 检查缓存大小
    const keys = await cache.keys();
    if (keys.length >= this.maxDynamicCacheSize) {
      // 删除最旧的缓存项（FIFO）
      await cache.delete(keys[0]);
    }

    await cache.put(request, response);
  }

  // 清理过期缓存
  async cleanupOldCaches(currentCacheNames: string[]): Promise<void> {
    const cacheNames = await caches.keys();

    await Promise.all(
      cacheNames
        .filter(name => !currentCacheNames.includes(name))
        .map(name => {
          console.log('删除过期缓存:', name);
          return caches.delete(name);
        })
    );
  }

  // 获取缓存统计信息
  async getCacheStats(): Promise<{
    name: string;
    count: number;
    size: number;
  }[]> {
    const cacheNames = await caches.keys();
    const stats = [];

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();

      let totalSize = 0;
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.clone().blob();
          totalSize += blob.size;
        }
      }

      stats.push({
        name,
        count: keys.length,
        size: totalSize
      });
    }

    return stats;
  }
}
```

---

## Push Notification 推送通知

推送通知是 PWA 与用户互动的重要方式，即使应用未打开也能发送消息。

### 推送通知流程

```
+--------+        +--------+        +--------+        +--------+
|  用户  |        | Web应用 |        | SW     |        | Push   |
|        |        |        |        |        |        | Server |
+---+----+        +---+----+        +---+----+        +---+----+
    |                 |                 |                 |
    | 1. 授权请求     |                 |                 |
    |<----------------|                 |                 |
    |                 |                 |                 |
    | 2. 允许通知     |                 |                 |
    |---------------->|                 |                 |
    |                 |                 |                 |
    |                 | 3. 订阅推送     |                 |
    |                 |---------------->|                 |
    |                 |                 |                 |
    |                 |                 | 4. 获取订阅信息  |
    |                 |                 |---------------->|
    |                 |                 |                 |
    |                 | 5. 发送订阅到服务器               |
    |                 |---------------------------------->|
    |                 |                 |                 |
    |                 |                 | 6. 推送消息     |
    |                 |                 |<----------------|
    |                 |                 |                 |
    | 7. 显示通知     |                 |                 |
    |<----------------------------------|                 |
    |                 |                 |                 |
```

### 请求通知权限并订阅

```typescript
// push-notification.ts

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationManager {
  private vapidPublicKey: string;

  constructor(vapidPublicKey: string) {
    this.vapidPublicKey = vapidPublicKey;
  }

  // 检查通知权限状态
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // 请求通知权限
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('此浏览器不支持通知');
    }

    const permission = await Notification.requestPermission();
    console.log('通知权限状态:', permission);
    return permission;
  }

  // 订阅推送服务
  async subscribeToPush(): Promise<PushSubscriptionData | null> {
    // 检查权限
    if (Notification.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('用户拒绝了通知权限');
        return null;
      }
    }

    // 获取 Service Worker 注册
    const registration = await navigator.serviceWorker.ready;

    // 检查是否已订阅
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // 创建新订阅
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,  // 必须为 true
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });
    }

    // 转换为可发送的格式
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      }
    };

    // 发送到服务器保存
    await this.saveSubscriptionToServer(subscriptionData);

    return subscriptionData;
  }

  // 取消订阅
  async unsubscribe(): Promise<boolean> {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await this.removeSubscriptionFromServer(subscription.endpoint);
      return true;
    }

    return false;
  }

  // 发送订阅信息到服务器
  private async saveSubscriptionToServer(
    subscription: PushSubscriptionData
  ): Promise<void> {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
  }

  // 从服务器删除订阅
  private async removeSubscriptionFromServer(endpoint: string): Promise<void> {
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint })
    });
  }

  // VAPID 公钥转换
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
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

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// 使用示例
const pushManager = new PushNotificationManager(
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
);

// 订阅推送
document.getElementById('subscribe-btn')?.addEventListener('click', async () => {
  const subscription = await pushManager.subscribeToPush();
  if (subscription) {
    console.log('推送订阅成功:', subscription);
  }
});
```

### Service Worker 中处理推送

```javascript
// sw.js - 处理推送通知

// 接收推送消息
self.addEventListener('push', (event) => {
  console.log('[Service Worker] 收到推送消息');

  let notificationData = {
    title: '新消息',
    body: '您有一条新消息',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'default',
    data: {}
  };

  // 解析推送数据
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  // 显示通知
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      vibrate: [100, 50, 100],
      actions: [
        { action: 'view', title: '查看' },
        { action: 'dismiss', title: '忽略' }
      ],
      requireInteraction: true  // 通知不会自动关闭
    })
  );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] 通知被点击:', event.action);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  // 处理不同的动作
  if (event.action === 'view') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // 查找已打开的窗口
          for (const client of windowClients) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // 没有找到，打开新窗口
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// 处理通知关闭
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] 通知被关闭');
  // 可以在这里记录分析数据
});
```

---

## 安装体验优化

提供良好的安装体验可以增加用户安装 PWA 的意愿。

### 自定义安装提示

```typescript
// install-prompt.ts

class PWAInstallManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private installButton: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    // 监听安装提示事件
    window.addEventListener('beforeinstallprompt', (event) => {
      // 阻止默认的安装提示
      event.preventDefault();
      // 保存事件供后续使用
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      // 显示自定义安装按钮
      this.showInstallButton();

      console.log('PWA 可以安装');
    });

    // 监听安装完成事件
    window.addEventListener('appinstalled', () => {
      console.log('PWA 已安装');
      this.hideInstallButton();
      this.deferredPrompt = null;
      // 记录安装事件
      this.trackInstallation();
    });
  }

  // 显示安装按钮
  private showInstallButton(): void {
    this.installButton = document.getElementById('pwa-install-btn');
    if (this.installButton) {
      this.installButton.style.display = 'block';
      this.installButton.addEventListener('click', () => this.promptInstall());
    }
  }

  // 隐藏安装按钮
  private hideInstallButton(): void {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }

  // 触发安装提示
  async promptInstall(): Promise<void> {
    if (!this.deferredPrompt) {
      console.log('安装提示不可用');
      return;
    }

    // 显示安装提示
    this.deferredPrompt.prompt();

    // 等待用户响应
    const { outcome } = await this.deferredPrompt.userChoice;

    console.log('用户安装选择:', outcome);

    if (outcome === 'accepted') {
      console.log('用户接受了安装');
    } else {
      console.log('用户拒绝了安装');
    }

    // 清除保存的提示
    this.deferredPrompt = null;
  }

  // 检查是否已安装
  isInstalled(): boolean {
    // 检查 display-mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    // iOS Safari
    if ((navigator as any).standalone === true) {
      return true;
    }
    return false;
  }

  // 检查是否可以安装
  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  // 记录安装事件
  private trackInstallation(): void {
    // 发送到分析服务
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'Installation'
      });
    }
  }
}

// BeforeInstallPromptEvent 类型定义
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// 初始化
const pwaInstallManager = new PWAInstallManager();
```

### 安装提示 UI 组件

```html
<!-- 安装提示横幅 -->
<div id="pwa-install-banner" class="install-banner hidden">
  <div class="install-banner-content">
    <img src="/icons/icon-64x64.png" alt="App Icon" class="install-icon">
    <div class="install-text">
      <h3>安装我们的应用</h3>
      <p>获得更快的访问速度和离线体验</p>
    </div>
    <div class="install-actions">
      <button id="pwa-install-btn" class="btn-primary">安装</button>
      <button id="pwa-dismiss-btn" class="btn-secondary">稍后</button>
    </div>
  </div>
</div>

<style>
.install-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding: 16px;
  z-index: 1000;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.install-banner.visible {
  transform: translateY(0);
}

.install-banner.hidden {
  display: none;
}

.install-banner-content {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.install-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
}

.install-text {
  flex: 1;
}

.install-text h3 {
  margin: 0 0 4px;
  font-size: 16px;
}

.install-text p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.install-actions {
  display: flex;
  gap: 8px;
}

.btn-primary {
  background: #3B82F6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
```

---

## 后台同步

后台同步（Background Sync）允许在网络恢复后自动同步数据，确保用户操作不会因网络问题而丢失。

### 后台同步实现

```typescript
// background-sync.ts

class BackgroundSyncManager {
  private dbName = 'offline-requests';
  private storeName = 'pending-requests';
  private db: IDBDatabase | null = null;

  // 初始化 IndexedDB
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true
          });
        }
      };
    });
  }

  // 保存请求到 IndexedDB
  async saveRequest(request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string;
  }): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const addRequest = store.add({
        ...request,
        timestamp: Date.now()
      });

      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    });
  }

  // 注册后台同步
  async registerSync(tag: string = 'sync-requests'): Promise<void> {
    if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
      console.warn('后台同步不被支持');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    console.log('后台同步已注册:', tag);
  }

  // 带离线支持的 fetch
  async fetchWithOfflineSupport(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      // 网络请求失败，保存到队列
      if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
        await this.saveRequest({
          url,
          method: options.method,
          headers: options.headers as Record<string, string> || {},
          body: options.body as string || ''
        });

        // 注册后台同步
        await this.registerSync();

        // 返回离线响应
        return new Response(JSON.stringify({
          offline: true,
          message: '请求已保存，将在网络恢复后自动同步'
        }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      throw error;
    }
  }
}

// 使用示例
const syncManager = new BackgroundSyncManager();

// 表单提交示例
async function submitForm(formData: FormData): Promise<void> {
  await syncManager.fetchWithOfflineSupport('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.fromEntries(formData))
  });
}
```

### Service Worker 中处理同步

```javascript
// sw.js - 后台同步处理

const DB_NAME = 'offline-requests';
const STORE_NAME = 'pending-requests';

// 监听同步事件
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] 后台同步触发:', event.tag);

  if (event.tag === 'sync-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

// 同步待处理的请求
async function syncPendingRequests() {
  const db = await openDB();
  const requests = await getAllPendingRequests(db);

  console.log('[Sync] 待同步请求数:', requests.length);

  for (const request of requests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });

      if (response.ok) {
        // 同步成功，删除记录
        await deleteRequest(db, request.id);
        console.log('[Sync] 请求同步成功:', request.url);
      }
    } catch (error) {
      console.error('[Sync] 请求同步失败:', error);
      // 保留请求，下次重试
    }
  }
}

// IndexedDB 操作
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllPendingRequests(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteRequest(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
```

---

## 与原生应用对比

PWA 和原生应用各有优劣，选择时需要根据具体需求权衡。

### 功能对比表

```
+------------------+------------------+------------------+
|       功能       |       PWA        |     原生应用     |
+------------------+------------------+------------------+
| 安装方式         | 浏览器直接安装   | 应用商店下载     |
| 安装包大小       | 几KB~几MB        | 几十MB~几GB      |
| 更新方式         | 自动后台更新     | 需要重新下载     |
| 离线功能         | Service Worker   | 完全支持         |
| 推送通知         | 支持 (有限制)    | 完全支持         |
| 设备功能         | 部分支持         | 完全支持         |
| 性能             | 接近原生         | 最佳性能         |
| 开发成本         | 一套代码多端     | 各平台单独开发   |
| 发布流程         | 即时发布         | 需要审核         |
| SEO              | 支持             | 不支持           |
| 分享链接         | URL 直接分享     | 需要应用链接     |
+------------------+------------------+------------------+
```

### 设备功能支持对比

```typescript
// 设备功能检测
const deviceFeatureSupport = {
  // PWA 支持的功能
  camera: 'mediaDevices' in navigator,
  geolocation: 'geolocation' in navigator,
  notifications: 'Notification' in window,
  vibration: 'vibrate' in navigator,
  bluetooth: 'bluetooth' in navigator,
  usb: 'usb' in navigator,
  nfc: 'NDEFReader' in window,
  share: 'share' in navigator,
  clipboard: 'clipboard' in navigator,

  // 存储相关
  localStorage: 'localStorage' in window,
  indexedDB: 'indexedDB' in window,
  cacheStorage: 'caches' in window,

  // 网络相关
  onlineStatus: 'onLine' in navigator,
  networkInfo: 'connection' in navigator,

  // 支付
  paymentRequest: 'PaymentRequest' in window,

  // 生物识别
  credentials: 'credentials' in navigator,

  // 屏幕相关
  screenOrientation: 'orientation' in screen,
  wakeLock: 'wakeLock' in navigator,
  fullscreen: 'fullscreenEnabled' in document,
};

// 输出支持情况
Object.entries(deviceFeatureSupport).forEach(([feature, supported]) => {
  console.log(`${feature}: ${supported ? '支持' : '不支持'}`);
});
```

### 何时选择 PWA vs 原生应用

```typescript
// 决策辅助工具
interface ProjectRequirements {
  needsOffline: boolean;
  needsPush: boolean;
  needsDeepHardwareAccess: boolean;
  budgetConstrained: boolean;
  needsSEO: boolean;
  targetPlatforms: ('ios' | 'android' | 'web' | 'desktop')[];
  updateFrequency: 'high' | 'medium' | 'low';
  performanceCritical: boolean;
}

function recommendAppType(requirements: ProjectRequirements): {
  recommendation: 'PWA' | 'Native' | 'Hybrid';
  reasons: string[];
} {
  const reasons: string[] = [];
  let pwaScore = 0;
  let nativeScore = 0;

  if (requirements.needsDeepHardwareAccess) {
    nativeScore += 3;
    reasons.push('深度硬件访问需要原生应用');
  }

  if (requirements.budgetConstrained) {
    pwaScore += 2;
    reasons.push('预算有限，PWA 开发成本更低');
  }

  if (requirements.needsSEO) {
    pwaScore += 2;
    reasons.push('SEO 需求适合 PWA');
  }

  if (requirements.targetPlatforms.length > 2) {
    pwaScore += 2;
    reasons.push('多平台覆盖，PWA 一次开发');
  }

  if (requirements.updateFrequency === 'high') {
    pwaScore += 1;
    reasons.push('频繁更新，PWA 无需审核');
  }

  if (requirements.performanceCritical) {
    nativeScore += 2;
    reasons.push('性能关键，原生应用更优');
  }

  if (requirements.needsOffline && requirements.needsPush) {
    pwaScore += 1;
    reasons.push('离线和推送，PWA 已支持');
  }

  if (pwaScore > nativeScore) {
    return { recommendation: 'PWA', reasons };
  } else if (nativeScore > pwaScore) {
    return { recommendation: 'Native', reasons };
  } else {
    return {
      recommendation: 'Hybrid',
      reasons: [...reasons, '混合方案可能是最佳选择']
    };
  }
}
```

---

## 实战案例：任务管理 PWA

让我们构建一个完整的任务管理 PWA 应用，综合运用所有 PWA 技术。

### 项目结构

```
task-pwa/
├── public/
│   ├── icons/
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   ├── manifest.json
│   └── offline.html
├── src/
│   ├── js/
│   │   ├── app.js
│   │   ├── db.js
│   │   └── sync.js
│   ├── css/
│   │   └── main.css
│   └── sw.js
├── index.html
└── package.json
```

### IndexedDB 数据层

```typescript
// src/js/db.ts - 任务数据管理

interface Task {
  id?: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
  synced: boolean;
}

class TaskDatabase {
  private dbName = 'task-pwa-db';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建任务存储
        if (!db.objectStoreNames.contains('tasks')) {
          const store = db.createObjectStore('tasks', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('completed', 'completed', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  // 添加任务
  async addTask(task: Omit<Task, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('tasks', 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.add(task);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取所有任务
  async getAllTasks(): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('tasks', 'readonly');
      const store = transaction.objectStore('tasks');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 更新任务
  async updateTask(task: Task): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('tasks', 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.put(task);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 删除任务
  async deleteTask(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('tasks', 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 获取未同步的任务
  async getUnsyncedTasks(): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('tasks', 'readonly');
      const store = transaction.objectStore('tasks');
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const taskDB = new TaskDatabase();
```

### 主应用逻辑

```typescript
// src/js/app.ts - 主应用

import { taskDB } from './db';

class TaskApp {
  private taskList: HTMLElement;
  private taskForm: HTMLFormElement;
  private onlineStatus: HTMLElement;

  constructor() {
    this.taskList = document.getElementById('task-list')!;
    this.taskForm = document.getElementById('task-form') as HTMLFormElement;
    this.onlineStatus = document.getElementById('online-status')!;

    this.init();
  }

  private async init(): Promise<void> {
    // 初始化数据库
    await taskDB.init();

    // 注册 Service Worker
    await this.registerServiceWorker();

    // 绑定事件
    this.bindEvents();

    // 加载任务
    await this.loadTasks();

    // 更新在线状态
    this.updateOnlineStatus();
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW 注册成功:', registration.scope);
      } catch (error) {
        console.error('SW 注册失败:', error);
      }
    }
  }

  private bindEvents(): void {
    // 表单提交
    this.taskForm.addEventListener('submit', (e) => this.handleSubmit(e));

    // 任务点击
    this.taskList.addEventListener('click', (e) => this.handleTaskClick(e));

    // 在线状态变化
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    const formData = new FormData(this.taskForm);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!title.trim()) return;

    const task = {
      title: title.trim(),
      description: description.trim(),
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      synced: navigator.onLine
    };

    await taskDB.addTask(task);

    // 如果离线，注册后台同步
    if (!navigator.onLine && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-tasks');
    }

    this.taskForm.reset();
    await this.loadTasks();
  }

  private async handleTaskClick(e: Event): Promise<void> {
    const target = e.target as HTMLElement;

    if (target.classList.contains('task-toggle')) {
      const taskId = Number(target.dataset.id);
      await this.toggleTask(taskId);
    } else if (target.classList.contains('task-delete')) {
      const taskId = Number(target.dataset.id);
      await this.deleteTask(taskId);
    }
  }

  private async toggleTask(id: number): Promise<void> {
    const tasks = await taskDB.getAllTasks();
    const task = tasks.find(t => t.id === id);

    if (task) {
      task.completed = !task.completed;
      task.updatedAt = Date.now();
      task.synced = false;
      await taskDB.updateTask(task);
      await this.loadTasks();
    }
  }

  private async deleteTask(id: number): Promise<void> {
    await taskDB.deleteTask(id);
    await this.loadTasks();
  }

  private async loadTasks(): Promise<void> {
    const tasks = await taskDB.getAllTasks();
    // 使用安全的 DOM 操作方式渲染任务列表
    this.renderTaskList(tasks);
  }

  private renderTaskList(tasks: Task[]): void {
    // 清空列表
    this.taskList.replaceChildren();

    // 按创建时间降序排序
    const sortedTasks = tasks.sort((a, b) => b.createdAt - a.createdAt);

    sortedTasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.completed ? ' completed' : '');

      const label = document.createElement('label');
      label.className = 'task-label';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-toggle';
      checkbox.dataset.id = String(task.id);
      checkbox.checked = task.completed;

      const titleSpan = document.createElement('span');
      titleSpan.className = 'task-title';
      titleSpan.textContent = task.title;

      label.appendChild(checkbox);
      label.appendChild(titleSpan);

      const descSpan = document.createElement('span');
      descSpan.className = 'task-description';
      descSpan.textContent = task.description;

      const metaDiv = document.createElement('div');
      metaDiv.className = 'task-meta';

      const dateSpan = document.createElement('span');
      dateSpan.className = 'task-date';
      dateSpan.textContent = new Date(task.createdAt).toLocaleString('zh-CN');
      metaDiv.appendChild(dateSpan);

      if (!task.synced) {
        const syncSpan = document.createElement('span');
        syncSpan.className = 'sync-pending';
        syncSpan.textContent = '待同步';
        metaDiv.appendChild(syncSpan);
      }

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'task-delete';
      deleteBtn.dataset.id = String(task.id);
      deleteBtn.textContent = '删除';

      li.appendChild(label);
      li.appendChild(descSpan);
      li.appendChild(metaDiv);
      li.appendChild(deleteBtn);

      this.taskList.appendChild(li);
    });
  }

  private updateOnlineStatus(): void {
    const isOnline = navigator.onLine;
    this.onlineStatus.textContent = isOnline ? '在线' : '离线';
    this.onlineStatus.className = isOnline ? 'online' : 'offline';
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  new TaskApp();
});
```

### 完整的 Service Worker

```javascript
// src/sw.js - 完整的 Service Worker

const CACHE_VERSION = 'v1';
const STATIC_CACHE = 'static-' + CACHE_VERSION;
const DYNAMIC_CACHE = 'dynamic-' + CACHE_VERSION;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/app.js',
  '/js/db.js',
  '/offline.html',
  '/icons/icon-192x192.png'
];

// 安装
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;

        return fetch(request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then(cache => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => {
            if (request.destination === 'document') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  // 实现任务同步逻辑
  console.log('后台同步任务...');
}

// 推送通知
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: '新通知', body: '您有新的任务提醒' };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png'
    })
  );
});
```

---

## 面试要点

### PWA 核心概念

**Q: 什么是 PWA？它的核心特性是什么？**

A: PWA 是利用现代 Web 技术构建的应用，结合 Web 和原生应用的优点。核心特性包括：
- **渐进增强**: 在所有浏览器中可用，在支持的浏览器中获得增强体验
- **响应式**: 适配各种屏幕尺寸
- **离线可用**: 通过 Service Worker 实现离线访问
- **类原生体验**: 通过 App Shell 模式提供类似原生应用的交互
- **可安装**: 可添加到主屏幕
- **可发现**: 通过 Web App Manifest 可被搜索引擎发现
- **推送通知**: 支持后台推送消息
- **安全**: 必须使用 HTTPS

### Service Worker 生命周期

**Q: 请描述 Service Worker 的生命周期**

```
1. 注册 (register)
   |
   v
2. 安装 (install) - 下载并缓存资源
   |
   v
3. 等待 (waiting) - 如果有旧版本在运行
   |
   v
4. 激活 (activate) - 清理旧缓存
   |
   v
5. 空闲 (idle) - 等待事件
   |
   v
6. 终止 (terminated) - 浏览器可随时终止以节省资源
```

### 缓存策略选择

**Q: 如何选择合适的缓存策略？**

| 策略 | 适用场景 | 特点 |
|------|----------|------|
| Cache First | 静态资源、字体、图片 | 快速，但可能陈旧 |
| Network First | HTML 页面、API 数据 | 最新，但需要网络 |
| Stale While Revalidate | 头像、不常变化的数据 | 快速且会更新 |
| Network Only | 实时数据 | 必须在线 |
| Cache Only | 预缓存的静态资源 | 完全离线 |

### Web App Manifest 关键配置

**Q: Web App Manifest 中最重要的配置项有哪些？**

```json
{
  "name": "完整应用名称",
  "short_name": "短名称（主屏幕显示）",
  "start_url": "启动 URL",
  "display": "standalone | fullscreen | minimal-ui | browser",
  "theme_color": "主题色",
  "background_color": "启动画面背景色",
  "icons": "各尺寸图标"
}
```

### 常见问题与解决方案

**Q: PWA 开发中常见的坑有哪些？**

1. **Service Worker 更新问题**
   - 问题: 用户看不到最新版本
   - 解决: 实现更新提示机制，使用 `skipWaiting()` 和 `clients.claim()`

2. **iOS Safari 支持不完善**
   - 问题: 部分 PWA 功能不支持
   - 解决: 添加 iOS 专用 meta 标签，渐进增强

3. **缓存过大**
   - 问题: 占用过多存储空间
   - 解决: 实现缓存大小限制和清理策略

4. **CORS 问题**
   - 问题: 跨域资源无法缓存
   - 解决: 使用 `no-cors` 模式或配置服务器 CORS

### 性能优化建议

```typescript
// PWA 性能优化清单
const performanceChecklist = [
  {
    item: 'App Shell 模式',
    description: '将 UI 骨架缓存，动态内容延迟加载',
    impact: 'high'
  },
  {
    item: '预缓存关键资源',
    description: '在 install 事件中缓存核心资源',
    impact: 'high'
  },
  {
    item: '懒加载非关键资源',
    description: '图片、字体等按需加载',
    impact: 'medium'
  },
  {
    item: '合理的缓存策略',
    description: '根据资源类型选择最佳策略',
    impact: 'high'
  },
  {
    item: '限制缓存大小',
    description: '避免占用过多存储空间',
    impact: 'medium'
  },
  {
    item: '压缩资源',
    description: '使用 gzip/brotli 压缩',
    impact: 'high'
  }
];
```

### 调试工具

- **Chrome DevTools > Application**
  - Service Workers: 查看/调试 SW
  - Manifest: 检查配置
  - Storage: 查看缓存和存储

- **Lighthouse**
  - PWA 审计
  - 性能分析
  - 最佳实践检查

---

## 总结

PWA 是现代 Web 开发的重要技术方向，它让 Web 应用获得了接近原生应用的用户体验。通过本文，我们学习了：

1. **PWA 核心概念**: 理解渐进增强、Service Worker、Web App Manifest 三大支柱
2. **Manifest 配置**: 掌握应用元数据的完整配置方法
3. **Service Worker**: 深入理解生命周期和事件处理
4. **缓存策略**: 学会根据场景选择合适的缓存策略
5. **推送通知**: 实现后台消息推送能力
6. **安装体验**: 优化用户安装流程
7. **后台同步**: 保证离线操作的数据一致性
8. **实战应用**: 通过完整案例串联所有知识点

PWA 技术在不断发展，新的 API 和能力持续被添加。掌握 PWA 核心原理，将帮助你构建更好的 Web 应用，为用户提供卓越的体验。
