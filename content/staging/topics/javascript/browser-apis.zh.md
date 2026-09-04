---
title: Browser APIs Complete Guide
description: Master modern browser APIs for rich web applications
track: javascript
section: browser
difficulty: intermediate
tags:
  - Browser API
  - Web API
  - DOM
  - BOM
status: imported
origin: old/src/content/docs/frontend/browser-apis.zh.md
divergence: 0.187
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Frontend
  subcategory: JavaScript
  order: 12
  lastUpdated: 2026-01-07
---

浏览器 API（应用程序编程接口）是现代 Web 开发的基础，为 JavaScript 提供了与浏览器环境交互的能力。从操作页面元素到处理网络请求，从存储数据到获取用户位置，浏览器 API 使我们能够构建功能丰富、高度交互的 Web 应用程序。

本完全指南将系统地介绍现代浏览器中最重要和最常用的 API，帮助你全面掌握这些强大的工具。

## DOM 操作 API

DOM（文档对象模型）是浏览器的核心 API。它将 HTML 文档表示为树形结构，允许 JavaScript 动态访问和修改页面内容。

### 元素选择

```javascript
// 基础选择器
const element = document.getElementById('app');
const elements = document.getElementsByClassName('item');
const tags = document.getElementsByTagName('div');

// 现代选择器（推荐）
const single = document.querySelector('.container > .item');
const multiple = document.querySelectorAll('[data-active="true"]');

// 遍历 NodeList
multiple.forEach((el, index) => {
  console.log(`元素 ${index}:`, el.textContent);
});

// 转换为数组以使用更多方法
const elementsArray = Array.from(multiple);
const filtered = elementsArray.filter(el => el.classList.contains('active'));
```

**选择方法之间的主要区别：**

| 方法 | 返回值 | 动态/静态 | 性能 |
|--------|---------|-------------|-------------|
| `getElementById` | 单个元素 | 不适用 | 最快 |
| `getElementsByClassName` | HTMLCollection | 动态 | 快 |
| `getElementsByTagName` | HTMLCollection | 动态 | 快 |
| `querySelector` | 单个元素 | 静态 | 中等 |
| `querySelectorAll` | NodeList | 静态 | 中等 |

### 元素创建与操作

```javascript
// 创建元素
const div = document.createElement('div');
div.className = 'card';
div.id = 'new-card';
div.textContent = '这是一个新卡片';

// 设置属性
div.setAttribute('data-id', '123');
div.dataset.category = 'news'; // data-category="news"

// 设置样式
div.style.cssText = 'background: #f0f0f0; padding: 20px;';
// 或单独设置
div.style.backgroundColor = '#f0f0f0';
div.style.padding = '20px';

// 插入元素
const container = document.querySelector('.container');
container.appendChild(div);                    // 添加到末尾
container.insertBefore(div, container.firstChild); // 添加到开头
container.append(div, 'text node');             // 可以同时添加多个

// 现代插入方法（推荐）
container.insertAdjacentHTML('beforeend', '<p>HTML 字符串</p>');
container.insertAdjacentElement('afterbegin', div);
// 位置选项：'beforebegin'、'afterbegin'、'beforeend'、'afterend'

// 移除元素
div.remove(); // 现代方法
// 或者
container.removeChild(div); // 传统方法

// 替换元素
const newDiv = document.createElement('div');
div.replaceWith(newDiv); // 现代方法
```

### 类和属性操作

```javascript
const element = document.querySelector('.box');

// classList API
element.classList.add('active', 'highlighted');
element.classList.remove('hidden');
element.classList.toggle('collapsed');
element.classList.toggle('dark', isDarkMode); // 条件切换
element.classList.replace('old-class', 'new-class');
console.log(element.classList.contains('active')); // true

// 属性操作
element.getAttribute('data-id');
element.setAttribute('aria-label', '描述文本');
element.removeAttribute('disabled');
element.hasAttribute('required');

// 获取所有属性
for (const attr of element.attributes) {
  console.log(`${attr.name}: ${attr.value}`);
}
```

### 事件处理

```javascript
const button = document.querySelector('#submit-btn');

// 添加事件监听器
function handleClick(event) {
  event.preventDefault();
  console.log('点击位置:', event.clientX, event.clientY);
  console.log('目标元素:', event.target);
  console.log('当前元素:', event.currentTarget);
}

button.addEventListener('click', handleClick);

// 事件选项
button.addEventListener('click', handleClick, {
  once: true,      // 只执行一次
  passive: true,   // 不会调用 preventDefault
  capture: true    // 在捕获阶段触发
});

// 移除事件监听器
button.removeEventListener('click', handleClick);

// 事件委托（推荐模式）
document.querySelector('.list').addEventListener('click', (e) => {
  if (e.target.matches('.list-item')) {
    console.log('点击了列表项:', e.target.dataset.id);
  }
});

// 自定义事件
const customEvent = new CustomEvent('userLogin', {
  detail: { userId: 123, username: 'john' },
  bubbles: true,
  cancelable: true
});

element.dispatchEvent(customEvent);

element.addEventListener('userLogin', (e) => {
  console.log('用户已登录:', e.detail.username);
});
```

**事件传播阶段：**

```
                    | 捕获阶段 (1)
                    v
+-------------------+-------------------+
|  document                             |
|   +-------------------------------+   |
|   |  父元素                       |   |
|   |   +------------------------+  |   |
|   |   |  目标元素             |  |   |
|   |   +------------------------+  |   |
|   +-------------------------------+   |
+---------------------------------------+
                    ^
                    | 冒泡阶段 (2)
```

## Fetch API 和网络请求

Fetch API 是现代浏览器的网络请求接口。基于 Promise 构建，比传统的 XMLHttpRequest 更加简洁和强大。

### 基本请求

```javascript
// GET 请求
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');

    if (!response.ok) {
      throw new Error(`HTTP 错误！状态码: ${response.status}`);
    }

    const data = await response.json();
    console.log('获取的数据:', data);
    return data;
  } catch (error) {
    console.error('请求失败:', error.message);
    throw error;
  }
}

// POST 请求
async function postData(payload) {
  const response = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token123'
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}

// 使用示例
postData({ name: 'John Doe', email: 'john@example.com' })
  .then(result => console.log('创建成功:', result))
  .catch(error => console.error('创建失败:', error));
```

### 高级用法

```javascript
// 请求超时处理
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw error;
  }
}

// 文件上传
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', '上传的文件');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData // 不要设置 Content-Type，浏览器会自动处理
  });

  return response.json();
}

// 带进度的文件下载
async function downloadWithProgress(url) {
  const response = await fetch(url);
  const contentLength = response.headers.get('Content-Length');
  const total = parseInt(contentLength, 10);
  let loaded = 0;

  const reader = response.body.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    loaded += value.length;

    const progress = (loaded / total * 100).toFixed(2);
    console.log(`下载进度: ${progress}%`);
  }

  const blob = new Blob(chunks);
  return URL.createObjectURL(blob);
}

// 并发请求
async function fetchMultiple(urls) {
  const promises = urls.map(url => fetch(url).then(r => r.json()));

  // 等待所有请求完成
  const results = await Promise.all(promises);

  // 或者使用 allSettled 处理部分失败
  const settled = await Promise.allSettled(promises);
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`请求 ${index} 成功:`, result.value);
    } else {
      console.log(`请求 ${index} 失败:`, result.reason);
    }
  });

  return results;
}
```

### 请求重试模式

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error;
      console.log(`第 ${i + 1} 次尝试失败，正在重试...`);

      // 指数退避
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }

  throw lastError;
}
```

## 存储 API

浏览器提供了多种数据存储解决方案，适用于不同的使用场景。

### localStorage 和 sessionStorage

```javascript
// localStorage - 持久化存储
localStorage.setItem('username', 'John');
localStorage.setItem('settings', JSON.stringify({ theme: 'dark', lang: 'en' }));

const username = localStorage.getItem('username');
const settings = JSON.parse(localStorage.getItem('settings'));

localStorage.removeItem('username');
localStorage.clear(); // 清除所有数据

// sessionStorage - 会话级存储（标签页关闭时清除）
sessionStorage.setItem('tempData', 'value');

// 封装的存储工具类
class StorageManager {
  constructor(storage = localStorage) {
    this.storage = storage;
  }

  set(key, value, expiresIn = null) {
    const item = {
      value,
      timestamp: Date.now(),
      expiresIn
    };
    this.storage.setItem(key, JSON.stringify(item));
  }

  get(key) {
    const itemStr = this.storage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);

    // 检查是否过期
    if (item.expiresIn && Date.now() - item.timestamp > item.expiresIn) {
      this.storage.removeItem(key);
      return null;
    }

    return item.value;
  }

  remove(key) {
    this.storage.removeItem(key);
  }
}

const storage = new StorageManager();
storage.set('token', 'abc123', 3600000); // 1 小时后过期
```

### IndexedDB

IndexedDB 是一个强大的客户端数据库，适合存储大量结构化数据。

```javascript
// IndexedDB 包装类
class Database {
  constructor(dbName, version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async open(stores) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, {
              keyPath: store.keyPath,
              autoIncrement: store.autoIncrement
            });

            store.indexes?.forEach(index => {
              objectStore.createIndex(index.name, index.keyPath, {
                unique: index.unique
              });
            });
          }
        });
      };
    });
  }

  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async query(storeName, indexName, range) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// 使用示例
async function initDatabase() {
  const db = new Database('MyApp', 1);

  await db.open([
    {
      name: 'users',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'email', keyPath: 'email', unique: true },
        { name: 'name', keyPath: 'name', unique: false }
      ]
    },
    {
      name: 'posts',
      keyPath: 'id',
      autoIncrement: true
    }
  ]);

  // 添加数据
  await db.add('users', { name: 'John', email: 'john@example.com' });

  // 查询数据
  const users = await db.getAll('users');
  console.log('所有用户:', users);
}
```

## 地理位置 API

地理位置 API 允许网页获取用户的地理位置信息。

```javascript
// 基本用法
function getCurrentPosition() {
  if (!navigator.geolocation) {
    console.error('此浏览器不支持地理位置');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;

      console.log(`纬度: ${latitude}`);
      console.log(`经度: ${longitude}`);
      console.log(`精度: ${accuracy} 米`);
      console.log(`海拔: ${altitude || '不可用'}`);
      console.log(`方向: ${heading || '不可用'}`);
      console.log(`速度: ${speed || '不可用'}`);
      console.log(`时间戳: ${new Date(position.timestamp)}`);
    },
    (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          console.error('用户拒绝了地理位置请求');
          break;
        case error.POSITION_UNAVAILABLE:
          console.error('位置信息不可用');
          break;
        case error.TIMEOUT:
          console.error('获取位置请求超时');
          break;
        default:
          console.error('发生未知错误');
      }
    },
    {
      enableHighAccuracy: true, // 高精度模式
      timeout: 10000,           // 超时时间（毫秒）
      maximumAge: 60000         // 缓存时间（毫秒）
    }
  );
}

// 持续监控位置变化
function watchPosition() {
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      console.log('位置已更新:', position.coords);
      updateMapMarker(position.coords.latitude, position.coords.longitude);
    },
    (error) => {
      console.error('监控位置失败:', error.message);
    },
    { enableHighAccuracy: true }
  );

  // 停止监控
  // navigator.geolocation.clearWatch(watchId);

  return watchId;
}

// Promise 包装
function getPosition(options = {}) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

// 使用示例
async function showUserLocation() {
  try {
    const position = await getPosition({ enableHighAccuracy: true });
    const { latitude, longitude } = position.coords;

    // 调用地图服务显示位置
    console.log(`用户位置: ${latitude}, ${longitude}`);
  } catch (error) {
    console.error('获取位置失败:', error);
  }
}
```

### 地理位置最佳实践

```javascript
// 带降级处理的完整地理位置服务
class LocationService {
  constructor() {
    this.watchId = null;
    this.lastPosition = null;
  }

  isSupported() {
    return 'geolocation' in navigator;
  }

  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('不支持地理位置');
    }

    try {
      // 尝试获取位置以触发权限提示
      await this.getCurrentPosition({ timeout: 5000 });
      return 'granted';
    } catch (error) {
      if (error.code === 1) {
        return 'denied';
      }
      throw error;
    }
  }

  getCurrentPosition(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000 // 5 分钟
    };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.lastPosition = position;
          resolve(position);
        },
        reject,
        { ...defaultOptions, ...options }
      );
    });
  }

  startWatching(callback, options = {}) {
    if (this.watchId) {
      this.stopWatching();
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.lastPosition = position;
        callback(position);
      },
      (error) => callback(null, error),
      options
    );

    return this.watchId;
  }

  stopWatching() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getLastKnownPosition() {
    return this.lastPosition;
  }

  // 计算两个坐标之间的距离（Haversine 公式）
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径（公里）
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }
}

// 使用示例
const locationService = new LocationService();

async function trackUserJourney() {
  const positions = [];

  locationService.startWatching((position, error) => {
    if (error) {
      console.error('位置错误:', error);
      return;
    }

    positions.push({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: position.timestamp
    });

    // 计算行驶总距离
    if (positions.length > 1) {
      const prev = positions[positions.length - 2];
      const curr = positions[positions.length - 1];
      const distance = locationService.calculateDistance(
        prev.lat, prev.lng, curr.lat, curr.lng
      );
      console.log(`已行驶 ${distance.toFixed(2)} 公里`);
    }
  }, { enableHighAccuracy: true });
}
```

## Web Workers 和多线程

Web Workers 允许 JavaScript 在后台线程中运行，避免阻塞主线程，提高应用程序性能。

### 专用 Workers

```javascript
// main.js - 主线程
const worker = new Worker('worker.js');

// 向 Worker 发送消息
worker.postMessage({
  type: 'CALCULATE',
  data: { numbers: [1, 2, 3, 4, 5] }
});

// 从 Worker 接收消息
worker.onmessage = (event) => {
  console.log('从 Worker 收到结果:', event.data);
};

// 错误处理
worker.onerror = (error) => {
  console.error('Worker 错误:', error.message);
};

// 终止 Worker
// worker.terminate();

// worker.js - Worker 线程
self.onmessage = (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'CALCULATE':
      // 执行繁重计算
      const result = heavyCalculation(data.numbers);
      self.postMessage({ type: 'RESULT', result });
      break;
  }
};

function heavyCalculation(numbers) {
  // 模拟耗时操作
  let sum = 0;
  for (let i = 0; i < 1000000000; i++) {
    sum += numbers[i % numbers.length];
  }
  return sum;
}
```

### 使用 Blob 创建内联 Workers

```javascript
// 无需单独的 worker.js 文件
function createInlineWorker(fn) {
  const blob = new Blob(
    [`self.onmessage = ${fn.toString()}`],
    { type: 'application/javascript' }
  );
  return new Worker(URL.createObjectURL(blob));
}

const worker = createInlineWorker((event) => {
  const { numbers } = event.data;
  const sum = numbers.reduce((a, b) => a + b, 0);
  self.postMessage(sum);
});

worker.postMessage({ numbers: [1, 2, 3, 4, 5] });
worker.onmessage = (e) => console.log('结果:', e.data);
```

### 共享 Workers

```javascript
// 可以被多个页面共享的 Workers
const sharedWorker = new SharedWorker('shared-worker.js');

sharedWorker.port.start();
sharedWorker.port.postMessage('你好');

sharedWorker.port.onmessage = (event) => {
  console.log('收到消息:', event.data);
};

// shared-worker.js
const connections = [];

self.onconnect = (event) => {
  const port = event.ports[0];
  connections.push(port);

  port.onmessage = (e) => {
    // 广播消息给所有连接
    connections.forEach(p => {
      p.postMessage(`来自另一个页面: ${e.data}`);
    });
  };

  port.start();
};
```

### 可转移对象

对于大数据传输，使用可转移对象避免复制：

```javascript
// main.js
const largeBuffer = new ArrayBuffer(1024 * 1024 * 100); // 100MB
const uint8View = new Uint8Array(largeBuffer);

// 填充数据
for (let i = 0; i < uint8View.length; i++) {
  uint8View[i] = i % 256;
}

// 转移所有权（不是复制）
worker.postMessage({ buffer: largeBuffer }, [largeBuffer]);

// largeBuffer 现在为空（已转移给 worker）
console.log(largeBuffer.byteLength); // 0

// worker.js
self.onmessage = (event) => {
  const { buffer } = event.data;
  const view = new Uint8Array(buffer);

  // 处理 buffer
  // ...

  // 完成后转移回去
  self.postMessage({ buffer }, [buffer]);
};
```

## 通知 API

通知 API 允许网页向用户发送系统通知。

```javascript
// 请求通知权限
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('此浏览器不支持通知');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// 发送通知
async function sendNotification(title, options = {}) {
  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    console.log('没有通知权限');
    return;
  }

  const notification = new Notification(title, {
    body: options.body || '',
    icon: options.icon || '/icon.png',
    badge: options.badge || '/badge.png',
    tag: options.tag || 'default',      // 相同 tag 的通知会相互替换
    requireInteraction: options.requireInteraction || false, // 需要用户交互才关闭
    silent: options.silent || false,    // 静音模式
    data: options.data || {}            // 自定义数据
  });

  notification.onclick = (event) => {
    console.log('通知被点击', notification.data);
    window.focus();
    notification.close();
  };

  notification.onclose = () => {
    console.log('通知已关闭');
  };

  notification.onerror = (error) => {
    console.error('通知错误:', error);
  };

  return notification;
}

// 使用示例
sendNotification('新消息', {
  body: '您收到一条新消息。点击查看详情。',
  icon: '/message-icon.png',
  tag: 'message',
  data: { messageId: 123 }
});
```

## 剪贴板 API

剪贴板 API 提供了读取和写入系统剪贴板的能力。

```javascript
// 将文本写入剪贴板
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('文本已复制到剪贴板');
    return true;
  } catch (error) {
    console.error('复制失败:', error);

    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      console.log('使用降级方法复制成功');
      return true;
    } catch (err) {
      console.error('降级方法也失败了');
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

// 从剪贴板读取文本
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText();
    console.log('剪贴板内容:', text);
    return text;
  } catch (error) {
    console.error('读取剪贴板失败:', error);
    return null;
  }
}

// 复制图片到剪贴板
async function copyImage(imageBlob) {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        [imageBlob.type]: imageBlob
      })
    ]);
    console.log('图片已复制');
  } catch (error) {
    console.error('复制图片失败:', error);
  }
}

// 从剪贴板读取图片
async function pasteImage() {
  try {
    const items = await navigator.clipboard.read();

    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type);
          const url = URL.createObjectURL(blob);
          console.log('图片 URL:', url);
          return url;
        }
      }
    }
  } catch (error) {
    console.error('读取图片失败:', error);
  }
  return null;
}

// 监听粘贴事件
document.addEventListener('paste', async (event) => {
  const items = event.clipboardData?.items;

  if (items) {
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        console.log('粘贴的图片:', file);
        // 处理图片...
      } else if (item.type === 'text/plain') {
        item.getAsString((text) => {
          console.log('粘贴的文本:', text);
        });
      }
    }
  }
});
```

## Intersection Observer

Intersection Observer API 用于异步观察目标元素与祖先元素或视口的交叉变化。常用于懒加载、无限滚动等场景。

```javascript
// 基本用法
const observer = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach(entry => {
      console.log('元素:', entry.target);
      console.log('是否可见:', entry.isIntersecting);
      console.log('可见比例:', entry.intersectionRatio);
      console.log('边界:', entry.boundingClientRect);

      if (entry.isIntersecting) {
        // 元素进入视口
        entry.target.classList.add('visible');
      }
    });
  },
  {
    root: null,           // 视口作为根元素
    rootMargin: '0px',    // 根元素边距
    threshold: [0, 0.5, 1] // 回调触发阈值
  }
);

// 观察元素
document.querySelectorAll('.observe-me').forEach(el => {
  observer.observe(el);
});

// 停止观察
// observer.unobserve(element);
// observer.disconnect(); // 停止观察所有元素

// 图片懒加载实现
function lazyLoadImages() {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px' // 进入视口前 50px 就开始加载
  });

  document.querySelectorAll('img.lazy').forEach(img => {
    imageObserver.observe(img);
  });
}

// 无限滚动实现
function infiniteScroll(loadMore) {
  const sentinel = document.querySelector('#scroll-sentinel');

  const scrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      loadMore();
    }
  }, {
    rootMargin: '100px'
  });

  scrollObserver.observe(sentinel);
  return scrollObserver;
}

// 动画触发
function animateOnScroll() {
  const animationObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        } else {
          entry.target.classList.remove('animate-in');
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    animationObserver.observe(el);
  });
}
```

## ResizeObserver 和 MutationObserver

### ResizeObserver

ResizeObserver 用于监控元素尺寸变化。

```javascript
const resizeObserver = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect;
    console.log(`元素尺寸变化: ${width} x ${height}`);

    // 获取边框盒尺寸
    if (entry.borderBoxSize) {
      const [boxSize] = entry.borderBoxSize;
      console.log(`边框盒: ${boxSize.inlineSize} x ${boxSize.blockSize}`);
    }

    // 响应式处理
    const target = entry.target;
    if (width < 400) {
      target.classList.add('compact');
    } else {
      target.classList.remove('compact');
    }
  });
});

// 观察元素
const container = document.querySelector('.responsive-container');
resizeObserver.observe(container);

// 停止观察
// resizeObserver.unobserve(container);
// resizeObserver.disconnect();

// 实际示例：响应式图表
function createResponsiveChart(container) {
  let chart = initChart(container);

  const observer = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect;
    chart.resize(width, height);
  });

  observer.observe(container);

  return {
    destroy() {
      observer.disconnect();
      chart.destroy();
    }
  };
}
```

### MutationObserver

MutationObserver 用于监控 DOM 树的变化。

```javascript
const mutationObserver = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    switch (mutation.type) {
      case 'childList':
        console.log('子节点变化');
        console.log('添加的节点:', mutation.addedNodes);
        console.log('移除的节点:', mutation.removedNodes);
        break;

      case 'attributes':
        console.log(`属性 "${mutation.attributeName}" 变化`);
        console.log('旧值:', mutation.oldValue);
        console.log('新值:', mutation.target.getAttribute(mutation.attributeName));
        break;

      case 'characterData':
        console.log('文本内容变化');
        console.log('旧值:', mutation.oldValue);
        console.log('新值:', mutation.target.textContent);
        break;
    }
  });
});

// 配置选项
const config = {
  childList: true,           // 观察子节点添加/移除
  attributes: true,          // 观察属性变化
  characterData: true,       // 观察文本内容变化
  subtree: true,             // 观察所有后代
  attributeOldValue: true,   // 记录旧属性值
  characterDataOldValue: true, // 记录旧文本值
  attributeFilter: ['class', 'style'] // 只观察特定属性
};

mutationObserver.observe(document.body, config);

// 停止观察
// mutationObserver.disconnect();

// 获取待处理的变更记录
// const pendingMutations = mutationObserver.takeRecords();

// 实际示例：监视动态内容
function watchForDynamicContent(container, callback) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          callback(node);
        }
      });
    });
  });

  observer.observe(container, { childList: true, subtree: true });

  return () => observer.disconnect();
}

// 使用示例：自动初始化动态添加的组件
const stopWatching = watchForDynamicContent(document.body, (element) => {
  if (element.matches('[data-component="tooltip"]')) {
    initTooltip(element);
  }
});
```

## Performance Observer

Performance Observer API 允许你监控各种性能指标。

```javascript
// 观察性能条目
const performanceObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();

  entries.forEach(entry => {
    console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);

    // 处理不同条目类型
    switch (entry.entryType) {
      case 'navigation':
        console.log('页面加载时间:', entry.loadEventEnd - entry.startTime);
        break;

      case 'resource':
        console.log(`资源 ${entry.name} 加载耗时 ${entry.duration}ms`);
        break;

      case 'paint':
        console.log(`${entry.name}: ${entry.startTime}ms`);
        break;

      case 'largest-contentful-paint':
        console.log('LCP:', entry.startTime);
        break;

      case 'first-input':
        console.log('FID:', entry.processingStart - entry.startTime);
        break;

      case 'layout-shift':
        console.log('CLS:', entry.value);
        break;
    }
  });
});

// 观察特定条目类型
performanceObserver.observe({
  entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint']
});

// Web Vitals 监控
function observeWebVitals(callback) {
  // 最大内容绘制 (LCP)
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    callback({ name: 'LCP', value: lastEntry.startTime });
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // 首次输入延迟 (FID)
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      callback({
        name: 'FID',
        value: entry.processingStart - entry.startTime
      });
    });
  }).observe({ entryTypes: ['first-input'] });

  // 累积布局偏移 (CLS)
  let clsValue = 0;
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    });
    callback({ name: 'CLS', value: clsValue });
  }).observe({ entryTypes: ['layout-shift'] });
}

// 使用示例
observeWebVitals((metric) => {
  console.log(`${metric.name}: ${metric.value}`);
  // 发送到分析服务
});
```

## 面试重点

### 常见面试问题

**问题1：localStorage、sessionStorage 和 Cookies 有什么区别？**

| 特性 | localStorage | sessionStorage | Cookie |
|---------|--------------|----------------|--------|
| 存储大小 | 5-10MB | 5-10MB | 4KB |
| 生命周期 | 永久 | 会话级 | 可设置过期时间 |
| 作用域 | 同源共享 | 仅当前标签页 | 可跨子域 |
| 发送到服务器 | 否 | 否 | 随每次请求自动发送 |
| API | 简单直观 | 简单直观 | 较复杂 |

**问题2：如何实现图片懒加载？**

```javascript
// 方法1：Intersection Observer（推荐）
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
});

// 方法2：原生 loading 属性
<img src="image.jpg" loading="lazy" alt="懒加载图片" />
```

**问题3：Fetch 和 XMLHttpRequest 有什么区别？**

```javascript
// XMLHttpRequest
const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/data');
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    console.log(JSON.parse(xhr.responseText));
  }
};
xhr.send();

// Fetch - 更简洁，基于 Promise
const response = await fetch('/api/data');
const data = await response.json();
```

主要区别：
- Fetch 基于 Promise，支持 async/await
- Fetch 不会因为 HTTP 错误状态码（如 404、500）而 reject
- Fetch 默认不发送 cookies（需要 credentials 选项）
- Fetch 原生不支持请求取消（需要 AbortController）
- XMLHttpRequest 支持上传进度监控，Fetch 原生不支持

**问题4：Web Workers 的使用场景和限制是什么？**

使用场景：
- 复杂计算（数据处理、加解密）
- 图片/视频处理
- 大文件解析
- 实时数据处理

限制：
- 无法访问 DOM
- 无法访问 window、document 对象
- 无法使用 UI 方法如 alert、confirm
- 同源限制

**问题5：解释三种 Observer API 的区别**

| Observer | 用途 | 使用场景 |
|----------|---------|----------|
| IntersectionObserver | 观察元素可见性 | 懒加载、无限滚动 |
| ResizeObserver | 观察元素尺寸变化 | 响应式组件 |
| MutationObserver | 观察 DOM 变化 | 动态内容处理 |

### 性能优化相关

```javascript
// 使用 requestAnimationFrame 优化动画
function smoothScroll(target) {
  const start = window.pageYOffset;
  const distance = target - start;
  const duration = 500;
  let startTime = null;

  function animation(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 缓动函数
    const easeInOutQuad = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    window.scrollTo(0, start + distance * easeInOutQuad);

    if (elapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}

// 使用 requestIdleCallback 处理低优先级任务
function processLowPriorityTasks(tasks) {
  function processTasks(deadline) {
    while (deadline.timeRemaining() > 0 && tasks.length > 0) {
      const task = tasks.shift();
      task();
    }

    if (tasks.length > 0) {
      requestIdleCallback(processTasks);
    }
  }

  requestIdleCallback(processTasks);
}

// 防抖和节流模式
function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 与滚动事件配合使用
window.addEventListener('scroll', throttle(() => {
  console.log('滚动位置:', window.scrollY);
}, 100));

window.addEventListener('resize', debounce(() => {
  console.log('窗口大小已改变');
}, 250));
```

### 最佳实践总结

1. **DOM 操作**：批量更新 DOM，使用 DocumentFragment，避免频繁回流和重绘
2. **事件处理**：使用事件委托，合理使用 passive 选项
3. **网络请求**：实现请求取消、超时处理、错误重试机制
4. **数据存储**：根据数据特性选择合适的存储方案
5. **性能监控**：使用 Performance API 监控关键指标
6. **异步处理**：使用 Web Workers 处理耗时任务

## 现代浏览器 API

### Broadcast Channel API

用于同源上下文（标签页、窗口、iframe）之间的通信：

```javascript
// 创建广播频道
const channel = new BroadcastChannel('app-channel');

// 发送消息
channel.postMessage({
  type: 'USER_LOGOUT',
  timestamp: Date.now()
});

// 接收消息
channel.onmessage = (event) => {
  console.log('收到:', event.data);

  if (event.data.type === 'USER_LOGOUT') {
    // 在所有标签页处理登出
    window.location.href = '/login';
  }
};

// 完成后关闭
// channel.close();
```

### Screen Wake Lock API

防止屏幕变暗或锁定：

```javascript
let wakeLock = null;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    console.log('唤醒锁已激活');

    wakeLock.addEventListener('release', () => {
      console.log('唤醒锁已释放');
    });
  } catch (err) {
    console.error(`${err.name}: ${err.message}`);
  }
}

// 可见性变化时重新获取
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
});

// 完成后释放
async function releaseWakeLock() {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
}
```

### File System Access API

在用户授权后访问文件系统：

```javascript
// 打开文件
async function openFile() {
  const [fileHandle] = await window.showOpenFilePicker({
    types: [{
      description: '文本文件',
      accept: { 'text/plain': ['.txt'] }
    }]
  });

  const file = await fileHandle.getFile();
  const contents = await file.text();
  return contents;
}

// 保存文件
async function saveFile(content) {
  const handle = await window.showSaveFilePicker({
    suggestedName: 'document.txt',
    types: [{
      description: '文本文件',
      accept: { 'text/plain': ['.txt'] }
    }]
  });

  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

// 打开目录
async function openDirectory() {
  const dirHandle = await window.showDirectoryPicker();

  for await (const entry of dirHandle.values()) {
    console.log(entry.kind, entry.name);
  }
}
```

## 总结

浏览器 API 是 Web 开发的重要组成部分。掌握这些 API 有助于我们构建更丰富、更高效的 Web 应用程序。本文涵盖了 DOM 操作、网络请求、数据存储、位置服务、多线程、通知、剪贴板以及各种观察者模式——这些都是现代 Web 开发中最常用的功能。

在实际开发中，请牢记：
- 检查 API 的浏览器兼容性
- 实现优雅降级方案
- 考虑用户隐私和安全
- 合理使用异步操作以避免阻塞主线程
- 遵循性能优化最佳实践

随着 Web 标准的不断发展，浏览器 API 也在不断更新和完善。建议关注 MDN 文档和 Web 标准组织以获取最新的 API 功能。

**关键要点：**

1. **DOM API** - 动态网页的基础，掌握选择、创建和事件处理
2. **Fetch API** - 现代网络请求方法，支持 Promise
3. **存储 API** - 根据需求选择 localStorage、sessionStorage 和 IndexedDB
4. **Geolocation API** - 位置感知功能，需正确处理权限
5. **Web Workers** - 将繁重计算卸载到后台线程
6. **Observer API** - 高效监控 DOM、尺寸和交叉变化
7. **Performance API** - 监控和优化 Web 核心指标

浏览器平台正在不断扩展新功能。保持好奇心，随着新 API 的推出不断探索学习。
