---
title: Web Storage API
description: Complete guide to JavaScript Web Storage, localStorage, sessionStorage and IndexedDB
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - Storage
  - localStorage
  - IndexedDB
status: imported
origin: old/src/content/docs/javascript/web-storage.zh.md
divergence: 0.229
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: Browser APIs
  order: 19
  lastUpdated: 2026-01-07
---

Web Storage API 为浏览器提供了一种比使用 cookie 更直观的方式来存储键值对。本指南涵盖 localStorage、sessionStorage、存储事件以及用于处理客户端数据持久化的 IndexedDB。

## 理解 Web Storage

Web Storage 提供了两种主要的浏览器数据存储机制：`localStorage` 和 `sessionStorage`。两者都提供简单的键值存储接口，但在持久性和作用域方面有所不同。

### 主要特性

- **简单的 API**：易于使用的同步方法，用于存储和检索数据
- **更大的容量**：通常每个源 5-10MB，而 cookie 只有 4KB
- **无服务器传输**：数据保留在客户端，不像 cookie 那样随每个 HTTP 请求发送
- **源绑定**：存储按源（协议 + 域名 + 端口）隔离
- **仅字符串值**：所有值都存储为字符串

## localStorage

localStorage 提供持久存储，能够在浏览器重启和系统重启后保留数据。数据会一直保留，直到用户或应用程序明确清除。

### 基本操作

```javascript
// 存储数据
localStorage.setItem('username', 'john_doe');
localStorage.setItem('theme', 'dark');

// 检索数据
const username = localStorage.getItem('username');
console.log(username); // 'john_doe'

// 删除单个项目
localStorage.removeItem('theme');

// 清除此源的所有数据
localStorage.clear();

// 获取存储项目的数量
console.log(localStorage.length); // 1

// 通过索引获取键
const firstKey = localStorage.key(0);
console.log(firstKey); // 'username'
```

### 替代语法

你也可以使用类对象语法，但为了清晰起见，推荐使用显式方法。

```javascript
// 设置值（可行但不推荐）
localStorage.username = 'john_doe';
localStorage['email'] = 'john@example.com';

// 获取值
console.log(localStorage.username); // 'john_doe'
console.log(localStorage['email']); // 'john@example.com'

// 检查是否存在
if (localStorage.getItem('username') !== null) {
  console.log('User is stored');
}

// 推荐的检查方式
if ('username' in localStorage) {
  console.log('User exists');
}
```

### 存储复杂数据

由于 localStorage 只能存储字符串，因此需要对对象进行序列化。

```javascript
// 存储对象
const user = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  preferences: {
    theme: 'dark',
    language: 'en'
  }
};

localStorage.setItem('user', JSON.stringify(user));

// 检索对象
const storedUser = JSON.parse(localStorage.getItem('user'));
console.log(storedUser.name); // 'John Doe'
console.log(storedUser.preferences.theme); // 'dark'

// 存储数组
const recentSearches = ['javascript', 'web storage', 'indexeddb'];
localStorage.setItem('searches', JSON.stringify(recentSearches));

// 检索数组
const searches = JSON.parse(localStorage.getItem('searches'));
console.log(searches[0]); // 'javascript'
```

### 安全存储封装

一个用于更安全 localStorage 操作的实用类，具有自动序列化功能。

```javascript
class StorageManager {
  constructor(prefix = 'app_') {
    this.prefix = prefix;
    this.storage = localStorage;
  }

  // 生成带前缀的键
  getKey(key) {
    return `${this.prefix}${key}`;
  }

  // 自动序列化设置项目
  set(key, value, expiresIn = null) {
    const item = {
      value: value,
      timestamp: Date.now(),
      expires: expiresIn ? Date.now() + expiresIn : null
    };

    try {
      this.storage.setItem(this.getKey(key), JSON.stringify(item));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded');
        this.cleanup();
        // 清理后重试一次
        try {
          this.storage.setItem(this.getKey(key), JSON.stringify(item));
          return true;
        } catch {
          return false;
        }
      }
      throw error;
    }
  }

  // 自动反序列化获取项目
  get(key, defaultValue = null) {
    try {
      const item = this.storage.getItem(this.getKey(key));

      if (item === null) {
        return defaultValue;
      }

      const parsed = JSON.parse(item);

      // 检查过期
      if (parsed.expires && Date.now() > parsed.expires) {
        this.remove(key);
        return defaultValue;
      }

      return parsed.value;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return defaultValue;
    }
  }

  // 删除项目
  remove(key) {
    this.storage.removeItem(this.getKey(key));
  }

  // 检查键是否存在且未过期
  has(key) {
    return this.get(key) !== null;
  }

  // 获取此前缀的所有键
  keys() {
    const allKeys = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key.startsWith(this.prefix)) {
        allKeys.push(key.substring(this.prefix.length));
      }
    }
    return allKeys;
  }

  // 清除此前缀的所有项目
  clear() {
    this.keys().forEach(key => this.remove(key));
  }

  // 删除过期项目
  cleanup() {
    this.keys().forEach(key => {
      const item = this.storage.getItem(this.getKey(key));
      if (item) {
        try {
          const parsed = JSON.parse(item);
          if (parsed.expires && Date.now() > parsed.expires) {
            this.remove(key);
          }
        } catch {
          // 删除损坏的项目
          this.remove(key);
        }
      }
    });
  }
}

// 使用示例
const storage = new StorageManager('myapp_');

// 存储并设置 1 小时过期
storage.set('session', { token: 'abc123' }, 60 * 60 * 1000);

// 检索
const session = storage.get('session');
console.log(session?.token); // 'abc123'

// 无过期存储
storage.set('preferences', { theme: 'dark' });
```

## sessionStorage

sessionStorage 与 localStorage 类似，但生命周期更短。数据在页面会话结束时（浏览器标签页关闭时）被清除。

### Session 与 Local Storage 对比

```javascript
// sessionStorage - 标签页关闭时清除
sessionStorage.setItem('tempData', 'This will not persist');

// localStorage - 持久保存直到明确清除
localStorage.setItem('permanentData', 'This will persist');

// 两者具有相同的 API
const sessionValue = sessionStorage.getItem('tempData');
const localValue = localStorage.getItem('permanentData');
```

### sessionStorage 的使用场景

```javascript
// 导航期间保留表单数据
class FormPersistence {
  constructor(formId) {
    this.formId = formId;
    this.storageKey = `form_${formId}`;
  }

  // 保存表单状态
  save(formData) {
    const data = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    sessionStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // 恢复表单状态
  restore(form) {
    const saved = sessionStorage.getItem(this.storageKey);
    if (!saved) return false;

    try {
      const data = JSON.parse(saved);
      Object.entries(data).forEach(([name, value]) => {
        const field = form.elements[name];
        if (field) {
          field.value = value;
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  // 清除保存的状态
  clear() {
    sessionStorage.removeItem(this.storageKey);
  }
}

// 使用示例
const form = document.getElementById('registrationForm');
const persistence = new FormPersistence('registration');

// 页面加载时恢复
persistence.restore(form);

// 输入时保存
form.addEventListener('input', () => {
  persistence.save(new FormData(form));
});

// 成功提交时清除
form.addEventListener('submit', () => {
  persistence.clear();
});
```

### 标签页特定状态

```javascript
// 生成唯一标签页 ID
function getTabId() {
  let tabId = sessionStorage.getItem('tabId');
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('tabId', tabId);
  }
  return tabId;
}

// 标签页特定存储封装
class TabStorage {
  constructor() {
    this.tabId = getTabId();
  }

  set(key, value) {
    const tabKey = `${this.tabId}_${key}`;
    sessionStorage.setItem(tabKey, JSON.stringify(value));
  }

  get(key) {
    const tabKey = `${this.tabId}_${key}`;
    const value = sessionStorage.getItem(tabKey);
    return value ? JSON.parse(value) : null;
  }
}

// 每个标签页都有隔离的存储
const tabStorage = new TabStorage();
tabStorage.set('scrollPosition', 500);
console.log(tabStorage.get('scrollPosition')); // 500
```

### localStorage 和 sessionStorage 比较

| 特性 | localStorage | sessionStorage |
|---------|--------------|----------------|
| 持久性 | 直到清除 | 直到标签页关闭 |
| 跨标签页共享 | 是（同源） | 否（标签页特定） |
| 重启后可用 | 是 | 否 |
| 典型使用场景 | 用户偏好 | 表单数据、临时状态 |
| 存储限制 | ~5-10MB | ~5-10MB |

## 存储事件

当 localStorage 从同源的另一个文档（不同的标签页或窗口）被修改时，会触发 `storage` 事件。

### 基本存储事件监听

```javascript
// 此事件在其他标签页/窗口中触发，而非进行更改的那个
window.addEventListener('storage', (event) => {
  console.log('Storage changed:');
  console.log('Key:', event.key);
  console.log('Old Value:', event.oldValue);
  console.log('New Value:', event.newValue);
  console.log('URL:', event.url);
  console.log('Storage Area:', event.storageArea);
});

// 进行更改（此标签页不会收到事件）
localStorage.setItem('sharedData', 'new value');
```

### 跨标签页通信

存储事件使同源标签页之间能够进行通信。

```javascript
// 标签页通信管理器
class TabCommunicator {
  constructor(channel = 'tab_comm') {
    this.channel = channel;
    this.handlers = new Map();
    this.tabId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    window.addEventListener('storage', this.handleStorageEvent.bind(this));
  }

  handleStorageEvent(event) {
    if (!event.key || !event.key.startsWith(this.channel)) {
      return;
    }

    if (event.newValue === null) {
      return; // 项目被删除
    }

    try {
      const message = JSON.parse(event.newValue);

      // 忽略来自自己的消息
      if (message.senderId === this.tabId) {
        return;
      }

      const handler = this.handlers.get(message.type);
      if (handler) {
        handler(message.data, message.senderId);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  // 向其他标签页发送消息
  broadcast(type, data) {
    const message = {
      type,
      data,
      senderId: this.tabId,
      timestamp: Date.now()
    };

    const key = `${this.channel}_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(message));

    // 短暂延迟后清理
    setTimeout(() => localStorage.removeItem(key), 100);
  }

  // 注册消息处理器
  on(type, handler) {
    this.handlers.set(type, handler);
  }

  // 注销处理器
  off(type) {
    this.handlers.delete(type);
  }
}

// 使用示例
const comm = new TabCommunicator();

// 监听登出事件
comm.on('logout', (data, senderId) => {
  console.log(`User logged out in tab ${senderId}`);
  window.location.href = '/login';
});

// 监听数据更新
comm.on('dataUpdate', (data) => {
  console.log('Data updated:', data);
  refreshDisplay(data);
});

// 向所有标签页广播登出
function logout() {
  comm.broadcast('logout', { reason: 'user_action' });
  // 同时处理当前标签页
  window.location.href = '/login';
}
```

### 跨标签页同步状态

```javascript
// 跨标签页同步的响应式存储
class SyncedStorage {
  constructor() {
    this.subscribers = new Map();

    window.addEventListener('storage', (event) => {
      if (event.key && this.subscribers.has(event.key)) {
        const newValue = event.newValue ? JSON.parse(event.newValue) : null;
        this.subscribers.get(event.key).forEach(callback => {
          callback(newValue, JSON.parse(event.oldValue));
        });
      }
    });
  }

  get(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }

  set(key, value) {
    const oldValue = this.get(key);
    localStorage.setItem(key, JSON.stringify(value));

    // 通知本地订阅者（storage 事件只在其他标签页触发）
    if (this.subscribers.has(key)) {
      this.subscribers.get(key).forEach(callback => {
        callback(value, oldValue);
      });
    }
  }

  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // 返回取消订阅函数
    return () => {
      this.subscribers.get(key).delete(callback);
    };
  }
}

// 使用示例
const syncedStorage = new SyncedStorage();

// 订阅更改
const unsubscribe = syncedStorage.subscribe('theme', (newValue, oldValue) => {
  console.log(`Theme changed from ${oldValue} to ${newValue}`);
  document.body.className = newValue;
});

// 此更改将反映在所有标签页中
syncedStorage.set('theme', 'dark');
```

## 存储限制和配额管理

### 检查可用存储

```javascript
// 估算可用存储（现代浏览器）
async function checkStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const percentUsed = (estimate.usage / estimate.quota) * 100;

    console.log(`Used: ${formatBytes(estimate.usage)}`);
    console.log(`Quota: ${formatBytes(estimate.quota)}`);
    console.log(`Percent used: ${percentUsed.toFixed(2)}%`);

    return {
      used: estimate.usage,
      quota: estimate.quota,
      available: estimate.quota - estimate.usage,
      percentUsed
    };
  }

  return null;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 检查当前 localStorage 使用情况
function getLocalStorageSize() {
  let total = 0;

  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key);
      total += key.length + value.length;
    }
  }

  // 近似字节数（UTF-16 编码）
  return total * 2;
}

console.log(`localStorage size: ${formatBytes(getLocalStorageSize())}`);
```

### 处理配额错误

```javascript
class SafeStorage {
  constructor(storage = localStorage) {
    this.storage = storage;
  }

  set(key, value) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    try {
      this.storage.setItem(key, stringValue);
      return { success: true };
    } catch (error) {
      if (this.isQuotaError(error)) {
        return {
          success: false,
          error: 'QUOTA_EXCEEDED',
          message: 'Storage quota exceeded. Please clear some data.'
        };
      }
      throw error;
    }
  }

  isQuotaError(error) {
    return (
      error instanceof DOMException &&
      (error.code === 22 || // 旧版
        error.code === 1014 || // Firefox
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    );
  }

  setWithEviction(key, value, evictionStrategy = 'lru') {
    let result = this.set(key, value);

    if (!result.success && result.error === 'QUOTA_EXCEEDED') {
      // 尝试腾出空间
      const evicted = this.evict(evictionStrategy);
      console.log(`Evicted ${evicted} items`);

      // 重试
      result = this.set(key, value);
    }

    return result;
  }

  evict(strategy) {
    let evictedCount = 0;

    if (strategy === 'lru') {
      // 首先淘汰最旧的项目（需要时间戳跟踪）
      const items = this.getAllWithMetadata();
      items.sort((a, b) => a.timestamp - b.timestamp);

      // 删除最旧的 20%
      const toRemove = Math.ceil(items.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.storage.removeItem(items[i].key);
        evictedCount++;
      }
    } else if (strategy === 'largest') {
      // 首先淘汰最大的项目
      const items = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        const value = this.storage.getItem(key);
        items.push({ key, size: key.length + value.length });
      }

      items.sort((a, b) => b.size - a.size);

      // 删除最大的项目直到释放 20% 空间
      const targetReduction = items.reduce((sum, i) => sum + i.size, 0) * 0.2;
      let freed = 0;

      for (const item of items) {
        if (freed >= targetReduction) break;
        this.storage.removeItem(item.key);
        freed += item.size;
        evictedCount++;
      }
    }

    return evictedCount;
  }

  getAllWithMetadata() {
    const items = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      const value = this.storage.getItem(key);

      try {
        const parsed = JSON.parse(value);
        items.push({
          key,
          timestamp: parsed._timestamp || 0,
          size: key.length + value.length
        });
      } catch {
        items.push({
          key,
          timestamp: 0,
          size: key.length + value.length
        });
      }
    }
    return items;
  }
}
```

## IndexedDB 基础

IndexedDB 是一个低级 API，用于存储大量结构化数据，包括文件和 blob。它为复杂查询提供索引数据库功能。

### 核心概念

- **数据库**：包含一个或多个对象存储
- **对象存储**：类似于 SQL 数据库中的表
- **索引**：通过特定属性实现高效查询
- **事务**：所有数据访问都通过事务进行
- **游标**：遍历对象存储或索引

### 打开数据库

```javascript
function openDatabase(dbName, version = 1) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 如果不存在则创建对象存储
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', {
          keyPath: 'id',
          autoIncrement: true
        });

        // 创建用于查询的索引
        userStore.createIndex('email', 'email', { unique: true });
        userStore.createIndex('name', 'name', { unique: false });
        userStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('posts')) {
        const postStore = db.createObjectStore('posts', {
          keyPath: 'id',
          autoIncrement: true
        });

        postStore.createIndex('userId', 'userId', { unique: false });
        postStore.createIndex('published', 'published', { unique: false });
      }
    };
  });
}

// 使用示例
const db = await openDatabase('myApp', 1);
console.log('Database opened:', db.name);
```

### CRUD 操作

```javascript
class IndexedDBStore {
  constructor(db, storeName) {
    this.db = db;
    this.storeName = storeName;
  }

  // 创建或更新
  put(data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.put({
        ...data,
        updatedAt: new Date().toISOString()
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 通过键读取
  get(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 读取全部
  getAll() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 通过键删除
  delete(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 清除所有数据
  clear() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 通过索引查询
  getByIndex(indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 记录计数
  count() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// 使用示例
const db = await openDatabase('myApp', 1);
const userStore = new IndexedDBStore(db, 'users');

// 创建
const userId = await userStore.put({
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date().toISOString()
});

// 读取
const user = await userStore.get(userId);
console.log(user);

// 通过索引查询
const johns = await userStore.getByIndex('name', 'John Doe');
console.log('Users named John:', johns);

// 更新
await userStore.put({ ...user, name: 'John Smith' });

// 删除
await userStore.delete(userId);
```

### 使用游标进行复杂查询

```javascript
class AdvancedStore extends IndexedDBStore {
  // 分页查询
  getPaginated(pageSize, offset = 0) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const results = [];
      let skipped = 0;

      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          if (skipped < offset) {
            skipped++;
            cursor.continue();
          } else if (results.length < pageSize) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 范围查询
  getByRange(indexName, lowerBound, upperBound) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index(indexName);
      const range = IDBKeyRange.bound(lowerBound, upperBound);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 使用回调过滤
  filter(predicate) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const results = [];

      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          if (predicate(cursor.value)) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 批量插入
  bulkPut(items) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const results = [];

      items.forEach(item => {
        const request = store.put(item);
        request.onsuccess = () => results.push(request.result);
      });

      transaction.oncomplete = () => resolve(results);
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// 使用示例
const store = new AdvancedStore(db, 'users');

// 分页
const page1 = await store.getPaginated(10, 0);
const page2 = await store.getPaginated(10, 10);

// 范围查询（例如，上周创建的用户）
const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const today = new Date().toISOString();
const recentUsers = await store.getByRange('createdAt', lastWeek, today);

// 自定义过滤
const activeUsers = await store.filter(user => user.status === 'active');

// 批量插入
await store.bulkPut([
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' },
  { name: 'User 3', email: 'user3@example.com' }
]);
```

### 完整的 IndexedDB 封装

```javascript
class Database {
  constructor(name, version, schemas) {
    this.name = name;
    this.version = version;
    this.schemas = schemas;
    this.db = null;
  }

  async open() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;

        this.db.onerror = (event) => {
          console.error('Database error:', event.target.error);
        };

        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;

        this.schemas.forEach(schema => {
          if (schema.version > oldVersion) {
            this.applySchema(db, schema);
          }
        });
      };
    });
  }

  applySchema(db, schema) {
    schema.stores.forEach(storeConfig => {
      if (storeConfig.drop && db.objectStoreNames.contains(storeConfig.name)) {
        db.deleteObjectStore(storeConfig.name);
      }

      if (!db.objectStoreNames.contains(storeConfig.name)) {
        const store = db.createObjectStore(storeConfig.name, {
          keyPath: storeConfig.keyPath,
          autoIncrement: storeConfig.autoIncrement
        });

        if (storeConfig.indexes) {
          storeConfig.indexes.forEach(index => {
            store.createIndex(index.name, index.keyPath, {
              unique: index.unique || false,
              multiEntry: index.multiEntry || false
            });
          });
        }
      }
    });
  }

  store(name) {
    return new AdvancedStore(this.db, name);
  }

  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async delete() {
    await this.close();
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Schema 定义
const schemas = [
  {
    version: 1,
    stores: [
      {
        name: 'users',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'email', keyPath: 'email', unique: true },
          { name: 'name', keyPath: 'name' }
        ]
      },
      {
        name: 'posts',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'userId', keyPath: 'userId' },
          { name: 'createdAt', keyPath: 'createdAt' }
        ]
      }
    ]
  },
  {
    version: 2,
    stores: [
      {
        name: 'comments',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'postId', keyPath: 'postId' },
          { name: 'userId', keyPath: 'userId' }
        ]
      }
    ]
  }
];

// 使用示例
const database = new Database('myApp', 2, schemas);
await database.open();

const users = database.store('users');
await users.put({ name: 'John', email: 'john@example.com' });

const posts = database.store('posts');
await posts.put({ userId: 1, title: 'Hello World', createdAt: new Date().toISOString() });
```

## 安全注意事项

### 数据暴露风险

```javascript
// 存储数据可被同源的任何脚本访问
// 这包括页面上加载的第三方脚本

// 绝对不要以明文存储敏感数据
// 错误示例 - 直接存储敏感数据
localStorage.setItem('authToken', 'secret_token_123');
localStorage.setItem('creditCard', '4111111111111111');

// 更好的方式 - 加密敏感数据
class SecureStorage {
  constructor(encryptionKey) {
    this.key = encryptionKey;
  }

  // 简单 XOR 加密（生产环境请使用正规库）
  encrypt(text) {
    return btoa(
      text.split('').map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ this.key.charCodeAt(i % this.key.length))
      ).join('')
    );
  }

  decrypt(encoded) {
    const text = atob(encoded);
    return text.split('').map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) ^ this.key.charCodeAt(i % this.key.length))
    ).join('');
  }

  set(key, value) {
    const encrypted = this.encrypt(JSON.stringify(value));
    localStorage.setItem(key, encrypted);
  }

  get(key) {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    return JSON.parse(this.decrypt(encrypted));
  }
}

// 使用 Web Crypto API 进行正确加密
async function generateKey() {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(key, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  };
}

async function decryptData(key, encryptedObj) {
  const iv = new Uint8Array(encryptedObj.iv);
  const data = new Uint8Array(encryptedObj.data);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
}
```

### XSS 防护

```javascript
// 存储前和检索后对数据进行清理
class SanitizedStorage {
  constructor(storage = localStorage) {
    this.storage = storage;
  }

  // 基本 HTML 转义
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 验证和清理输入
  sanitize(value) {
    if (typeof value === 'string') {
      // 删除潜在的 script 标签
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    return value;
  }

  set(key, value) {
    const sanitized = this.sanitize(value);
    this.storage.setItem(key, JSON.stringify(sanitized));
  }

  get(key) {
    const value = this.storage.getItem(key);
    if (value === null) return null;

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}

// 内容安全策略注意事项
// 添加到 HTML 头部：
// Content-Security-Policy: default-src 'self'; script-src 'self'
```

### 存储可用性

```javascript
// 检查存储是否可用（隐私浏览模式可能禁用它）
function isStorageAvailable(type) {
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return (
      e instanceof DOMException &&
      (e.code === 22 ||
        e.code === 1014 ||
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      storage &&
      storage.length !== 0
    );
  }
}

// Web Storage 不可用时的后备存储
class MemoryStorage {
  constructor() {
    this.data = new Map();
  }

  getItem(key) {
    return this.data.get(key) ?? null;
  }

  setItem(key, value) {
    this.data.set(key, String(value));
  }

  removeItem(key) {
    this.data.delete(key);
  }

  clear() {
    this.data.clear();
  }

  get length() {
    return this.data.size;
  }

  key(index) {
    return Array.from(this.data.keys())[index] ?? null;
  }
}

// 通用存储访问器
const storage = isStorageAvailable('localStorage')
  ? localStorage
  : new MemoryStorage();
```

## 实用示例

### 购物车持久化

```javascript
class ShoppingCart {
  constructor() {
    this.storageKey = 'shopping_cart';
    this.items = this.load();
  }

  load() {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : [];
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.items));
  }

  addItem(product, quantity = 1) {
    const existingIndex = this.items.findIndex(item => item.id === product.id);

    if (existingIndex >= 0) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity
      });
    }

    this.save();
    return this.items;
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.save();
    return this.items;
  }

  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      item.quantity = Math.max(0, quantity);
      if (item.quantity === 0) {
        return this.removeItem(productId);
      }
      this.save();
    }
    return this.items;
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  clear() {
    this.items = [];
    localStorage.removeItem(this.storageKey);
  }
}

// 使用示例
const cart = new ShoppingCart();
cart.addItem({ id: 1, name: 'Widget', price: 9.99 }, 2);
cart.addItem({ id: 2, name: 'Gadget', price: 24.99 });
console.log(`Total: $${cart.getTotal().toFixed(2)}`);
```

### 用户偏好管理器

```javascript
class PreferencesManager {
  constructor() {
    this.storageKey = 'user_preferences';
    this.defaults = {
      theme: 'light',
      language: 'en',
      fontSize: 16,
      notifications: true,
      autoSave: true,
      sidebarCollapsed: false
    };
    this.preferences = this.load();

    // 加载时应用偏好
    this.apply();
  }

  load() {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? { ...this.defaults, ...JSON.parse(saved) } : { ...this.defaults };
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    this.apply();
  }

  get(key) {
    return this.preferences[key];
  }

  set(key, value) {
    if (key in this.defaults) {
      this.preferences[key] = value;
      this.save();
    }
  }

  setMultiple(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      if (key in this.defaults) {
        this.preferences[key] = value;
      }
    });
    this.save();
  }

  reset() {
    this.preferences = { ...this.defaults };
    this.save();
  }

  apply() {
    // 应用主题
    document.documentElement.setAttribute('data-theme', this.preferences.theme);

    // 应用字体大小
    document.documentElement.style.fontSize = `${this.preferences.fontSize}px`;

    // 应用语言
    document.documentElement.setAttribute('lang', this.preferences.language);

    // 切换侧边栏
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed', this.preferences.sidebarCollapsed);
    }
  }

  export() {
    return JSON.stringify(this.preferences, null, 2);
  }

  import(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.preferences = { ...this.defaults, ...imported };
      this.save();
      return true;
    } catch {
      return false;
    }
  }
}

// 使用示例
const prefs = new PreferencesManager();
prefs.set('theme', 'dark');
prefs.setMultiple({ fontSize: 18, notifications: false });
```

### 离线数据缓存

```javascript
class OfflineCache {
  constructor(dbName = 'offlineCache') {
    this.dbName = dbName;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const store = db.createObjectStore('cache', { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('type', 'type');
      };
    });
  }

  async set(url, data, type = 'api') {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');

      const request = store.put({
        url,
        data,
        type,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(url, maxAge = Infinity) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('cache', 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result;

        if (!result) {
          resolve(null);
          return;
        }

        // 检查缓存是否仍然有效
        if (Date.now() - result.timestamp > maxAge) {
          this.delete(url);
          resolve(null);
          return;
        }

        resolve(result.data);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async delete(url) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(url);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearOld(maxAge) {
    const cutoff = Date.now() - maxAge;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoff);
      let deleted = 0;

      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deleted++;
          cursor.continue();
        } else {
          resolve(deleted);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 带缓存的 fetch
  async fetchWithCache(url, options = {}) {
    const { maxAge = 5 * 60 * 1000, forceRefresh = false } = options;

    // 首先尝试缓存（除非强制刷新）
    if (!forceRefresh) {
      const cached = await this.get(url, maxAge);
      if (cached) {
        return { data: cached, fromCache: true };
      }
    }

    // 从网络获取
    try {
      const response = await fetch(url);
      const data = await response.json();

      // 缓存响应
      await this.set(url, data, 'api');

      return { data, fromCache: false };
    } catch (error) {
      // 网络错误时，即使过期也尝试缓存
      const cached = await this.get(url, Infinity);
      if (cached) {
        return { data: cached, fromCache: true, stale: true };
      }
      throw error;
    }
  }
}

// 使用示例
const cache = new OfflineCache();
await cache.init();

// 带自动缓存的 fetch
const { data, fromCache } = await cache.fetchWithCache('/api/users', {
  maxAge: 10 * 60 * 1000 // 10 分钟
});

console.log(`Data ${fromCache ? 'from cache' : 'from network'}:`, data);

// 每天清理旧缓存条目
setInterval(() => cache.clearOld(24 * 60 * 60 * 1000), 24 * 60 * 60 * 1000);
```

## 总结

Web Storage API 为客户端数据持久化提供了强大的机制：

- **localStorage** 提供持久存储，能够在浏览器重启后保留，非常适合用户偏好和缓存数据
- **sessionStorage** 提供标签页特定的临时存储，非常适合表单数据和导航状态
- **存储事件** 实现跨标签页通信和状态同步
- **IndexedDB** 处理复杂结构化数据，具有索引和高效查询功能
- 始终考虑存储限制（Web Storage 通常为 5-10MB，IndexedDB 更大）
- 安全性至关重要：绝不要未加密存储敏感数据，并注意 XSS 风险
- 为存储可能不可用的隐私浏览模式提供后备方案

选择存储机制时：
- 使用 **localStorage** 存储少量持久数据（偏好、令牌）
- 使用 **sessionStorage** 存储临时的、标签页特定的状态
- 使用 **IndexedDB** 处理大型数据集、复杂查询或离线优先应用
- 考虑使用 idb、localForage 或 Dexie.js 等库来获得更符合人体工程学的 IndexedDB 访问

正确的客户端存储实现可以通过更快的加载时间、离线功能和持久的用户偏好显著提升用户体验。
