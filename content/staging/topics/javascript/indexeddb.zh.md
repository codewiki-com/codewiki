---
title: IndexedDB 完全指南
description: 深入理解 IndexedDB：浏览器端结构化数据存储、事务处理、索引查询与性能优化
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - IndexedDB
  - Storage
  - 数据库
  - 离线存储
status: imported
origin: old/src/content/docs/javascript/indexeddb.zh.md
divergence: 0.292
issues:
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: 浏览器API
  order: 48
  lastUpdated: 2026-01-07
---

IndexedDB 是浏览器提供的大规模结构化数据存储解决方案。与 localStorage 不同，IndexedDB 是一个完整的事务型数据库系统，支持索引、游标遍历和复杂查询，能够存储大量数据包括文件和 Blob 对象。

## 概念解释

### 什么是 IndexedDB

IndexedDB 是一个运行在浏览器中的 NoSQL 数据库，具有以下特点：

- **键值对存储**：数据以键值对形式存储在对象存储（Object Store）中
- **事务型数据库**：所有操作都必须在事务中进行，保证数据一致性
- **异步 API**：所有操作都是异步的，不会阻塞主线程
- **同源策略**：数据库受同源策略限制，不同源的页面无法访问
- **大容量存储**：存储空间远大于 localStorage，通常可达数百 MB 甚至更多

### 与其他存储方案对比

| 特性 | IndexedDB | localStorage | sessionStorage | Cookie |
|------|-----------|--------------|----------------|--------|
| 容量 | 数百MB+ | 5-10MB | 5-10MB | 4KB |
| 数据类型 | 任意（含Blob） | 仅字符串 | 仅字符串 | 仅字符串 |
| API | 异步 | 同步 | 同步 | 同步 |
| 索引查询 | 支持 | 不支持 | 不支持 | 不支持 |
| 事务 | 支持 | 不支持 | 不支持 | 不支持 |
| Web Worker | 可用 | 不可用 | 不可用 | 不可用 |

### 核心术语

- **数据库（Database）**：最顶层的容器，包含多个对象存储
- **对象存储（Object Store）**：类似于关系数据库中的表，存储实际数据
- **索引（Index）**：对象存储中特定属性的索引，用于快速查询
- **事务（Transaction）**：数据库操作的原子单元，保证数据一致性
- **游标（Cursor）**：遍历对象存储或索引中数据的机制
- **键路径（Key Path）**：对象中作为主键的属性路径
- **键范围（Key Range）**：定义查询范围的对象

## 核心原理

### 数据库版本管理

IndexedDB 使用版本号来管理数据库结构的变更。当打开数据库时，如果指定的版本号高于当前版本，会触发 `upgradeneeded` 事件，这是唯一可以修改数据库结构的时机。

```javascript
// 版本升级机制
const request = indexedDB.open('MyDatabase', 2); // 版本号为 2

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;
  const newVersion = event.newVersion;

  console.log(`升级数据库：${oldVersion} -> ${newVersion}`);

  // 根据旧版本进行增量升级
  if (oldVersion < 1) {
    // 首次创建数据库
    db.createObjectStore('users', { keyPath: 'id' });
  }

  if (oldVersion < 2) {
    // 从版本 1 升级到版本 2
    const userStore = event.target.transaction.objectStore('users');
    userStore.createIndex('email', 'email', { unique: true });
  }
};
```

### 事务机制

IndexedDB 的所有数据操作都必须在事务中进行。事务具有以下特点：

1. **原子性**：事务中的操作要么全部成功，要么全部失败
2. **隔离性**：同一对象存储的读写事务是串行执行的
3. **自动提交**：事务在所有请求完成后自动提交
4. **生命周期**：事务在创建后如果没有新请求，会自动关闭

```javascript
// 事务的三种模式
const db = event.target.result;

// 只读事务：可以并发执行
const readTx = db.transaction(['users'], 'readonly');

// 读写事务：同一对象存储串行执行
const writeTx = db.transaction(['users'], 'readwrite');

// 版本变更事务：只在 upgradeneeded 事件中可用
// 可以修改数据库结构
```

### 异步请求模型

IndexedDB 使用基于事件的异步模型，每个操作返回一个 IDBRequest 对象：

```javascript
const request = store.get(key);

request.onsuccess = (event) => {
  const result = event.target.result;
  // 处理成功结果
};

request.onerror = (event) => {
  const error = event.target.error;
  // 处理错误
};
```

## 核心要点

### 打开和创建数据库

```javascript
function openDatabase(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 创建对象存储
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', {
          keyPath: 'id',
          autoIncrement: true
        });

        // 创建索引
        userStore.createIndex('email', 'email', { unique: true });
        userStore.createIndex('name', 'name', { unique: false });
        userStore.createIndex('age', 'age', { unique: false });
      }

      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', {
          keyPath: 'sku'
        });

        productStore.createIndex('category', 'category');
        productStore.createIndex('price', 'price');
        // 复合索引
        productStore.createIndex('category_price', ['category', 'price']);
      }
    };
  });
}
```

### 对象存储配置选项

```javascript
// 使用 keyPath：对象中的属性作为主键
db.createObjectStore('users', { keyPath: 'id' });

// 使用自增主键
db.createObjectStore('logs', { autoIncrement: true });

// keyPath + autoIncrement：自动生成 id 属性
db.createObjectStore('articles', {
  keyPath: 'id',
  autoIncrement: true
});

// 无 keyPath：需要在添加数据时显式指定键
const store = db.createObjectStore('settings');
// 使用时：store.put(value, 'myKey');
```

### 索引类型和配置

```javascript
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const store = db.createObjectStore('employees', { keyPath: 'id' });

  // 唯一索引：值必须唯一
  store.createIndex('email', 'email', { unique: true });

  // 非唯一索引：允许重复值
  store.createIndex('department', 'department', { unique: false });

  // 多值索引：对数组属性的每个元素建立索引
  store.createIndex('tags', 'tags', { multiEntry: true });

  // 复合索引：基于多个属性
  store.createIndex('dept_salary', ['department', 'salary']);
};
```

### 事务操作模式

```javascript
async function demonstrateTransactions(db) {
  // 只读事务
  const readTx = db.transaction(['users'], 'readonly');
  const readStore = readTx.objectStore('users');
  const user = await promisify(readStore.get(1));

  // 读写事务
  const writeTx = db.transaction(['users'], 'readwrite');
  const writeStore = writeTx.objectStore('users');
  await promisify(writeStore.put({ id: 1, name: '张三' }));

  // 多对象存储事务
  const multiTx = db.transaction(['users', 'orders'], 'readwrite');
  const userStore = multiTx.objectStore('users');
  const orderStore = multiTx.objectStore('orders');

  // 事务完成监听
  multiTx.oncomplete = () => console.log('事务完成');
  multiTx.onerror = () => console.error('事务失败');
  multiTx.onabort = () => console.warn('事务中止');
}

// 辅助函数：将 IDBRequest 转换为 Promise
function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

## 代码示例

### 完整的 IndexedDB 封装类

```javascript
class IndexedDBStore {
  constructor(dbName, version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.upgradeCallback = null;
  }

  // 设置升级回调
  onUpgrade(callback) {
    this.upgradeCallback = callback;
    return this;
  }

  // 打开数据库
  async open() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;

        // 处理版本变更（其他标签页升级数据库）
        this.db.onversionchange = () => {
          this.db.close();
          alert('数据库已更新，请刷新页面');
        };

        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (this.upgradeCallback) {
          this.upgradeCallback(db, event.oldVersion, event.newVersion);
        }
      };

      request.onblocked = () => {
        console.warn('数据库升级被阻止，请关闭其他使用此数据库的标签页');
      };
    });
  }

  // 获取事务
  getTransaction(storeNames, mode = 'readonly') {
    if (!this.db) throw new Error('数据库未打开');
    return this.db.transaction(storeNames, mode);
  }

  // 获取对象存储
  getStore(storeName, mode = 'readonly') {
    const tx = this.getTransaction([storeName], mode);
    return tx.objectStore(storeName);
  }

  // 添加数据
  async add(storeName, data) {
    const store = this.getStore(storeName, 'readwrite');
    return this._promisifyRequest(store.add(data));
  }

  // 添加多条数据
  async addBatch(storeName, items) {
    const tx = this.getTransaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);

    const promises = items.map(item =>
      this._promisifyRequest(store.add(item))
    );

    await Promise.all(promises);
    return this._promisifyTransaction(tx);
  }

  // 更新数据（不存在则添加）
  async put(storeName, data) {
    const store = this.getStore(storeName, 'readwrite');
    return this._promisifyRequest(store.put(data));
  }

  // 获取单条数据
  async get(storeName, key) {
    const store = this.getStore(storeName, 'readonly');
    return this._promisifyRequest(store.get(key));
  }

  // 获取所有数据
  async getAll(storeName, query = null, count = undefined) {
    const store = this.getStore(storeName, 'readonly');
    return this._promisifyRequest(store.getAll(query, count));
  }

  // 通过索引获取数据
  async getByIndex(storeName, indexName, value) {
    const store = this.getStore(storeName, 'readonly');
    const index = store.index(indexName);
    return this._promisifyRequest(index.getAll(value));
  }

  // 通过索引获取单条数据
  async getOneByIndex(storeName, indexName, value) {
    const store = this.getStore(storeName, 'readonly');
    const index = store.index(indexName);
    return this._promisifyRequest(index.get(value));
  }

  // 范围查询
  async getByRange(storeName, indexName, options = {}) {
    const { lower, upper, lowerOpen = false, upperOpen = false } = options;

    let range;
    if (lower !== undefined && upper !== undefined) {
      range = IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen);
    } else if (lower !== undefined) {
      range = IDBKeyRange.lowerBound(lower, lowerOpen);
    } else if (upper !== undefined) {
      range = IDBKeyRange.upperBound(upper, upperOpen);
    }

    const store = this.getStore(storeName, 'readonly');
    const source = indexName ? store.index(indexName) : store;
    return this._promisifyRequest(source.getAll(range));
  }

  // 删除数据
  async delete(storeName, key) {
    const store = this.getStore(storeName, 'readwrite');
    return this._promisifyRequest(store.delete(key));
  }

  // 清空对象存储
  async clear(storeName) {
    const store = this.getStore(storeName, 'readwrite');
    return this._promisifyRequest(store.clear());
  }

  // 统计数量
  async count(storeName, query = null) {
    const store = this.getStore(storeName, 'readonly');
    return this._promisifyRequest(store.count(query));
  }

  // 游标遍历
  async iterate(storeName, callback, options = {}) {
    const { indexName, range, direction = 'next' } = options;

    const store = this.getStore(storeName, 'readonly');
    const source = indexName ? store.index(indexName) : store;

    return new Promise((resolve, reject) => {
      const request = source.openCursor(range, direction);
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const result = callback(cursor.value, cursor.key, cursor);
          if (result !== false) {
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

  // 游标更新
  async updateWhere(storeName, predicate, updater) {
    const tx = this.getTransaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      let updateCount = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (predicate(cursor.value)) {
            const updated = updater(cursor.value);
            cursor.update(updated);
            updateCount++;
          }
          cursor.continue();
        } else {
          resolve(updateCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 游标删除
  async deleteWhere(storeName, predicate) {
    const tx = this.getTransaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      let deleteCount = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (predicate(cursor.value)) {
            cursor.delete();
            deleteCount++;
          }
          cursor.continue();
        } else {
          resolve(deleteCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 关闭数据库
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // 删除数据库
  static async deleteDatabase(dbName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        console.warn('删除数据库被阻止');
      };
    });
  }

  // 辅助方法：将 IDBRequest 转为 Promise
  _promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 辅助方法：等待事务完成
  _promisifyTransaction(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('事务被中止'));
    });
  }
}
```

### 使用示例

```javascript
// 初始化数据库
const store = new IndexedDBStore('MyApp', 1);

store.onUpgrade((db, oldVersion, newVersion) => {
  // 用户表
  if (!db.objectStoreNames.contains('users')) {
    const userStore = db.createObjectStore('users', {
      keyPath: 'id',
      autoIncrement: true
    });
    userStore.createIndex('email', 'email', { unique: true });
    userStore.createIndex('role', 'role');
    userStore.createIndex('createdAt', 'createdAt');
  }

  // 文章表
  if (!db.objectStoreNames.contains('articles')) {
    const articleStore = db.createObjectStore('articles', {
      keyPath: 'id',
      autoIncrement: true
    });
    articleStore.createIndex('authorId', 'authorId');
    articleStore.createIndex('status', 'status');
    articleStore.createIndex('publishedAt', 'publishedAt');
    articleStore.createIndex('tags', 'tags', { multiEntry: true });
  }
});

// 使用数据库
async function demo() {
  await store.open();

  // 添加用户
  const userId = await store.add('users', {
    email: 'zhangsan@example.com',
    name: '张三',
    role: 'admin',
    createdAt: new Date()
  });
  console.log('新用户ID:', userId);

  // 批量添加文章
  await store.addBatch('articles', [
    {
      title: 'IndexedDB 入门',
      authorId: userId,
      status: 'published',
      tags: ['JavaScript', 'Database'],
      publishedAt: new Date()
    },
    {
      title: 'Promise 详解',
      authorId: userId,
      status: 'draft',
      tags: ['JavaScript', 'Async'],
      publishedAt: null
    }
  ]);

  // 查询用户
  const user = await store.get('users', userId);
  console.log('用户信息:', user);

  // 通过索引查询
  const adminUsers = await store.getByIndex('users', 'role', 'admin');
  console.log('管理员用户:', adminUsers);

  // 通过标签查询文章（多值索引）
  const jsArticles = await store.getByIndex('articles', 'tags', 'JavaScript');
  console.log('JavaScript 相关文章:', jsArticles);

  // 范围查询
  const recentArticles = await store.getByRange('articles', 'publishedAt', {
    lower: new Date('2024-01-01'),
    upper: new Date()
  });
  console.log('最近文章:', recentArticles);

  // 游标遍历
  await store.iterate('users', (user, key) => {
    console.log(`用户 ${key}: ${user.name}`);
  });

  // 条件更新
  const updatedCount = await store.updateWhere(
    'articles',
    (article) => article.status === 'draft',
    (article) => ({ ...article, status: 'review' })
  );
  console.log(`更新了 ${updatedCount} 篇文章`);

  // 条件删除
  const deletedCount = await store.deleteWhere(
    'articles',
    (article) => article.status === 'deleted'
  );
  console.log(`删除了 ${deletedCount} 篇文章`);
}

demo().catch(console.error);
```

### 使用 idb 库简化操作

[idb](https://github.com/jakearchibald/idb) 是一个轻量级的 IndexedDB 封装库，提供了更友好的 Promise API。

```javascript
// 安装：npm install idb

import { openDB, deleteDB } from 'idb';

// 打开数据库
const db = await openDB('MyApp', 1, {
  upgrade(db, oldVersion, newVersion, transaction) {
    // 创建对象存储
    const userStore = db.createObjectStore('users', {
      keyPath: 'id',
      autoIncrement: true
    });
    userStore.createIndex('email', 'email', { unique: true });
    userStore.createIndex('role', 'role');

    const articleStore = db.createObjectStore('articles', {
      keyPath: 'id',
      autoIncrement: true
    });
    articleStore.createIndex('authorId', 'authorId');
    articleStore.createIndex('tags', 'tags', { multiEntry: true });
  },
  blocked() {
    console.warn('数据库升级被阻止');
  },
  blocking() {
    // 当其他标签页需要升级数据库时
    db.close();
  },
  terminated() {
    console.warn('数据库连接意外终止');
  }
});

// 基本 CRUD 操作
async function idbDemo() {
  // 添加数据
  const userId = await db.add('users', {
    email: 'lisi@example.com',
    name: '李四',
    role: 'user'
  });

  // 获取数据
  const user = await db.get('users', userId);

  // 更新数据
  await db.put('users', { ...user, name: '李四（已修改）' });

  // 删除数据
  await db.delete('users', userId);

  // 获取所有数据
  const allUsers = await db.getAll('users');

  // 通过索引查询
  const admins = await db.getAllFromIndex('users', 'role', 'admin');

  // 统计数量
  const count = await db.count('users');

  // 使用事务
  const tx = db.transaction(['users', 'articles'], 'readwrite');
  const userStore = tx.objectStore('users');
  const articleStore = tx.objectStore('articles');

  await userStore.add({ email: 'new@example.com', name: '新用户', role: 'user' });
  await articleStore.add({ title: '新文章', authorId: 1, tags: ['test'] });

  await tx.done; // 等待事务完成

  // 游标遍历
  let cursor = await db.transaction('users').store.openCursor();
  while (cursor) {
    console.log('用户:', cursor.value);
    cursor = await cursor.continue();
  }

  // 范围查询
  const range = IDBKeyRange.bound('a', 'z');
  const usersInRange = await db.getAllFromIndex('users', 'email', range);
}

// 使用 idb 的便捷方法
async function idbShortcuts() {
  // 直接访问对象存储
  const users = db.transaction('users').store;

  // 使用 for-await-of 遍历
  for await (const cursor of users) {
    console.log(cursor.value);
  }

  // 获取索引
  const emailIndex = users.index('email');

  // 通过索引遍历
  for await (const cursor of emailIndex.iterate(IDBKeyRange.lowerBound('a'))) {
    console.log(cursor.value);
  }
}
```

### 游标高级用法

```javascript
// 方向控制
async function cursorDirections(db) {
  const store = db.transaction('products').objectStore('products');
  const priceIndex = store.index('price');

  // next：从小到大，包含重复值
  let cursor = await priceIndex.openCursor(null, 'next');

  // nextunique：从小到大，跳过重复值
  cursor = await priceIndex.openCursor(null, 'nextunique');

  // prev：从大到小，包含重复值
  cursor = await priceIndex.openCursor(null, 'prev');

  // prevunique：从大到小，跳过重复值
  cursor = await priceIndex.openCursor(null, 'prevunique');
}

// 键游标（只获取键，不获取值）
async function keyCursor(db) {
  const store = db.transaction('products').objectStore('products');
  const index = store.index('category');

  // 只获取主键，性能更好
  let cursor = await index.openKeyCursor();
  while (cursor) {
    console.log('索引键:', cursor.key, '主键:', cursor.primaryKey);
    cursor = await cursor.continue();
  }
}

// 游标跳跃
async function cursorAdvance(db) {
  const store = db.transaction('products').objectStore('products');

  let cursor = await store.openCursor();
  let count = 0;

  while (cursor) {
    console.log(cursor.value);
    count++;

    if (count === 10) {
      // 跳过接下来的 5 条记录
      cursor = await cursor.advance(5);
    } else {
      cursor = await cursor.continue();
    }
  }
}

// 游标范围限定
async function cursorRange(db) {
  const store = db.transaction('products').objectStore('products');
  const priceIndex = store.index('price');

  // 价格在 100-500 之间的产品
  const range = IDBKeyRange.bound(100, 500);

  let cursor = await priceIndex.openCursor(range);
  while (cursor) {
    console.log('产品:', cursor.value.name, '价格:', cursor.value.price);
    cursor = await cursor.continue();
  }
}
```

## 最佳实践

### 数据库设计原则

```javascript
// 好的设计：扁平化结构，合理使用索引
const goodDesign = {
  users: {
    keyPath: 'id',
    indexes: ['email', 'role', 'createdAt']
  },
  orders: {
    keyPath: 'id',
    indexes: ['userId', 'status', 'createdAt', ['status', 'createdAt']]
  }
};

// 避免：嵌套过深、缺少索引
const badDesign = {
  users: {
    id: 1,
    profile: {
      personal: {
        name: '张三',
        email: 'zhangsan@example.com' // 嵌套太深，难以索引
      }
    }
  }
};
```

### 版本迁移策略

```javascript
const DB_VERSION = 3;

function upgradeDatabase(db, oldVersion, newVersion) {
  // 增量升级，处理所有可能的版本跳跃
  if (oldVersion < 1) {
    // v0 -> v1: 初始化
    const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
    userStore.createIndex('email', 'email', { unique: true });
  }

  if (oldVersion < 2) {
    // v1 -> v2: 添加订单表
    const orderStore = db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
    orderStore.createIndex('userId', 'userId');
  }

  if (oldVersion < 3) {
    // v2 -> v3: 为用户添加 role 索引
    const tx = event.target.transaction;
    const userStore = tx.objectStore('users');
    userStore.createIndex('role', 'role');
  }
}
```

### 错误处理和重试

```javascript
async function robustOperation(db, operation, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // 判断是否可重试
      if (error.name === 'QuotaExceededError') {
        // 存储空间不足，尝试清理
        await cleanupOldData(db);
        continue;
      }

      if (error.name === 'TransactionInactiveError') {
        // 事务已失效，需要创建新事务
        console.warn(`尝试 ${attempt}/${maxRetries}: 事务失效，重试中...`);
        continue;
      }

      // 其他错误直接抛出
      throw error;
    }
  }

  throw lastError;
}

async function cleanupOldData(db) {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const tx = db.transaction(['logs'], 'readwrite');
  const store = tx.objectStore('logs');
  const index = store.index('createdAt');
  const range = IDBKeyRange.upperBound(oneMonthAgo);

  let cursor = await index.openCursor(range);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
}
```

### 数据验证

```javascript
class ValidatedStore {
  constructor(db, storeName, schema) {
    this.db = db;
    this.storeName = storeName;
    this.schema = schema;
  }

  validate(data) {
    for (const [field, rules] of Object.entries(this.schema)) {
      const value = data[field];

      if (rules.required && (value === undefined || value === null)) {
        throw new Error(`字段 ${field} 是必需的`);
      }

      if (value !== undefined && rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          throw new Error(`字段 ${field} 应为 ${rules.type}，实际为 ${actualType}`);
        }
      }

      if (rules.validate && !rules.validate(value)) {
        throw new Error(`字段 ${field} 验证失败`);
      }
    }
    return true;
  }

  async add(data) {
    this.validate(data);
    return this.db.add(this.storeName, data);
  }

  async put(data) {
    this.validate(data);
    return this.db.put(this.storeName, data);
  }
}

// 使用示例
const userSchema = {
  email: {
    required: true,
    type: 'string',
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  },
  name: {
    required: true,
    type: 'string',
    validate: (v) => v.length >= 2 && v.length <= 50
  },
  age: {
    type: 'number',
    validate: (v) => v >= 0 && v <= 150
  }
};

const validatedUserStore = new ValidatedStore(db, 'users', userSchema);
await validatedUserStore.add({
  email: 'test@example.com',
  name: '测试用户',
  age: 25
});
```

## 常见陷阱

### 事务生命周期问题

```javascript
// 错误：事务在 await 期间可能失效
async function wrongUsage(db) {
  const tx = db.transaction(['users'], 'readwrite');
  const store = tx.objectStore('users');

  const user = await store.get(1); // 这里事务可能还存活

  // 问题：在 await 后执行其他异步操作
  await fetch('/api/validate', { method: 'POST', body: JSON.stringify(user) });

  // 错误：此时事务可能已经关闭！
  await store.put({ ...user, validated: true }); // TransactionInactiveError
}

// 正确：在事务中只执行数据库操作
async function correctUsage(db) {
  // 先获取数据
  const user = await db.get('users', 1);

  // 在事务外执行其他异步操作
  await fetch('/api/validate', { method: 'POST', body: JSON.stringify(user) });

  // 创建新事务进行更新
  await db.put('users', { ...user, validated: true });
}
```

### 索引选择不当

```javascript
// 错误：没有为常用查询创建索引
// 每次查询都需要全表扫描
async function inefficientQuery(db) {
  // 没有 status 索引，需要遍历所有数据
  const allOrders = await db.getAll('orders');
  const pendingOrders = allOrders.filter(o => o.status === 'pending');
}

// 正确：创建合适的索引
// 在升级时创建索引
orderStore.createIndex('status', 'status');

async function efficientQuery(db) {
  // 直接通过索引查询
  const pendingOrders = await db.getAllFromIndex('orders', 'status', 'pending');
}
```

### 忽略错误处理

```javascript
// 错误：没有处理可能的错误
async function unsafeOperation(db) {
  await db.add('users', { email: 'duplicate@example.com' }); // 可能因唯一约束失败
}

// 正确：完善的错误处理
async function safeOperation(db) {
  try {
    await db.add('users', { email: 'test@example.com' });
  } catch (error) {
    if (error.name === 'ConstraintError') {
      console.error('邮箱已存在');
      // 可以选择更新而非添加
      const existing = await db.getFromIndex('users', 'email', 'test@example.com');
      if (existing) {
        await db.put('users', { ...existing, lastLoginAt: new Date() });
      }
    } else if (error.name === 'QuotaExceededError') {
      console.error('存储空间不足');
      // 触发清理逻辑
    } else {
      throw error;
    }
  }
}
```

### 版本升级阻塞

```javascript
// 问题：其他标签页阻止升级
const request = indexedDB.open('MyDB', 2);

request.onblocked = () => {
  // 处理阻塞情况
  alert('请关闭其他使用此应用的标签页，然后刷新');
};

// 在现有连接中监听版本变更
db.onversionchange = () => {
  db.close();
  alert('数据库需要更新，页面将刷新');
  location.reload();
};
```

### 内存泄漏

```javascript
// 错误：游标未正确关闭
async function leakyIteration(db) {
  const tx = db.transaction(['largeData'], 'readonly');
  const store = tx.objectStore('largeData');
  const cursor = await store.openCursor();

  // 如果提前返回，游标和事务可能不会正确清理
  if (someCondition) {
    return; // 游标仍然打开
  }

  while (cursor) {
    // 处理数据
    cursor = await cursor.continue();
  }
}

// 正确：确保资源清理
async function safeIteration(db) {
  const tx = db.transaction(['largeData'], 'readonly');
  const store = tx.objectStore('largeData');

  try {
    let cursor = await store.openCursor();

    while (cursor) {
      if (someCondition) {
        break; // 跳出循环，事务会自动完成
      }
      cursor = await cursor.continue();
    }
  } finally {
    // 确保事务完成
    await tx.done;
  }
}
```

## 性能考量

### 批量操作优化

```javascript
// 低效：每次操作创建新事务
async function slowBatchAdd(db, items) {
  for (const item of items) {
    await db.add('products', item); // 每次都创建新事务
  }
}

// 高效：使用单个事务
async function fastBatchAdd(db, items) {
  const tx = db.transaction(['products'], 'readwrite');
  const store = tx.objectStore('products');

  await Promise.all(items.map(item => store.add(item)));
  await tx.done;
}

// 更高效：使用游标批量更新
async function bulkUpdate(db, updates) {
  const tx = db.transaction(['products'], 'readwrite');
  const store = tx.objectStore('products');

  for await (const cursor of store) {
    const product = cursor.value;
    if (updates.has(product.id)) {
      const update = updates.get(product.id);
      await cursor.update({ ...product, ...update });
    }
  }

  await tx.done;
}
```

### 索引优化

```javascript
// 创建复合索引以支持多条件查询
store.createIndex('status_date', ['status', 'createdAt']);

// 使用复合索引进行范围查询
async function queryByStatusAndDateRange(db, status, startDate, endDate) {
  const index = db.transaction('orders').store.index('status_date');

  // 复合索引的范围查询
  const range = IDBKeyRange.bound(
    [status, startDate],
    [status, endDate]
  );

  return index.getAll(range);
}
```

### 分页加载

```javascript
async function paginatedQuery(db, storeName, options = {}) {
  const { page = 1, pageSize = 20, indexName, direction = 'next' } = options;

  const tx = db.transaction([storeName], 'readonly');
  const store = tx.objectStore(storeName);
  const source = indexName ? store.index(indexName) : store;

  const results = [];
  let skipped = 0;
  const skipCount = (page - 1) * pageSize;

  let cursor = await source.openCursor(null, direction);

  while (cursor) {
    if (skipped < skipCount) {
      // 跳过前面的记录
      skipped++;
      cursor = await cursor.continue();
      continue;
    }

    results.push(cursor.value);

    if (results.length >= pageSize) {
      break;
    }

    cursor = await cursor.continue();
  }

  // 获取总数用于分页
  const total = await source.count();

  return {
    data: results,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize)
  };
}
```

### 使用 Web Worker 处理大量数据

```javascript
// main.js
const worker = new Worker('indexeddb-worker.js');

worker.postMessage({
  action: 'bulkInsert',
  storeName: 'products',
  data: largeDataArray
});

worker.onmessage = (event) => {
  console.log('批量插入完成:', event.data);
};

// indexeddb-worker.js
self.onmessage = async (event) => {
  const { action, storeName, data } = event.data;

  if (action === 'bulkInsert') {
    const db = await openDatabase();
    const tx = db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);

    let inserted = 0;
    for (const item of data) {
      await store.add(item);
      inserted++;

      // 每 1000 条报告进度
      if (inserted % 1000 === 0) {
        self.postMessage({ type: 'progress', count: inserted });
      }
    }

    await tx.done;
    self.postMessage({ type: 'complete', count: inserted });
  }
};
```

## 实战场景

### 场景一：离线优先应用

```javascript
class OfflineFirstStore {
  constructor(db, apiBaseUrl) {
    this.db = db;
    this.apiBaseUrl = apiBaseUrl;
  }

  // 获取数据：优先从本地，然后从网络更新
  async get(storeName, id) {
    // 1. 先从本地获取
    const local = await this.db.get(storeName, id);

    // 2. 尝试从网络获取最新数据
    this.fetchAndUpdate(storeName, id).catch(console.error);

    // 3. 立即返回本地数据
    return local;
  }

  // 后台同步
  async fetchAndUpdate(storeName, id) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${storeName}/${id}`);
      if (response.ok) {
        const data = await response.json();
        await this.db.put(storeName, { ...data, _syncedAt: new Date() });
      }
    } catch (error) {
      console.log('网络不可用，使用本地数据');
    }
  }

  // 保存数据：先本地，然后同步到服务器
  async save(storeName, data) {
    // 1. 保存到本地
    const id = await this.db.put(storeName, {
      ...data,
      _pendingSync: true,
      _modifiedAt: new Date()
    });

    // 2. 尝试同步到服务器
    this.syncToServer(storeName, id).catch(console.error);

    return id;
  }

  // 同步到服务器
  async syncToServer(storeName, id) {
    const data = await this.db.get(storeName, id);

    try {
      const response = await fetch(`${this.apiBaseUrl}/${storeName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        // 更新同步状态
        await this.db.put(storeName, {
          ...data,
          _pendingSync: false,
          _syncedAt: new Date()
        });
      }
    } catch (error) {
      // 添加到同步队列
      await this.addToSyncQueue(storeName, id);
    }
  }

  // 添加到同步队列
  async addToSyncQueue(storeName, id) {
    await this.db.add('_syncQueue', {
      storeName,
      id,
      createdAt: new Date()
    });
  }

  // 处理同步队列
  async processSyncQueue() {
    const queue = await this.db.getAll('_syncQueue');

    for (const item of queue) {
      try {
        await this.syncToServer(item.storeName, item.id);
        await this.db.delete('_syncQueue', item.id);
      } catch (error) {
        console.error('同步失败:', item);
      }
    }
  }
}

// 监听网络状态变化
window.addEventListener('online', () => {
  offlineStore.processSyncQueue();
});
```

### 场景二：全文搜索实现

```javascript
class FullTextSearch {
  constructor(db) {
    this.db = db;
  }

  // 建立搜索索引
  async indexDocument(doc) {
    const tokens = this.tokenize(doc.content);

    // 存储原文档
    await this.db.put('documents', doc);

    // 存储倒排索引
    const tx = this.db.transaction(['searchIndex'], 'readwrite');
    const store = tx.objectStore('searchIndex');

    for (const token of tokens) {
      const existing = await store.get(token);
      const docIds = existing?.docIds || [];

      if (!docIds.includes(doc.id)) {
        docIds.push(doc.id);
        await store.put({ token, docIds });
      }
    }

    await tx.done;
  }

  // 分词（简单实现）
  tokenize(text) {
    return text
      .toLowerCase()
      .split(/[\s\p{P}]+/u)
      .filter(token => token.length > 1);
  }

  // 搜索
  async search(query) {
    const tokens = this.tokenize(query);

    if (tokens.length === 0) return [];

    // 获取每个词的文档 ID 列表
    const docIdSets = await Promise.all(
      tokens.map(async token => {
        const entry = await this.db.get('searchIndex', token);
        return new Set(entry?.docIds || []);
      })
    );

    // 求交集（AND 搜索）
    let resultIds = docIdSets[0];
    for (let i = 1; i < docIdSets.length; i++) {
      resultIds = new Set([...resultIds].filter(id => docIdSets[i].has(id)));
    }

    // 获取文档
    const docs = await Promise.all(
      [...resultIds].map(id => this.db.get('documents', id))
    );

    return docs.filter(Boolean);
  }

  // 删除文档索引
  async removeDocument(docId) {
    // 获取文档
    const doc = await this.db.get('documents', docId);
    if (!doc) return;

    const tokens = this.tokenize(doc.content);

    // 从倒排索引中移除
    const tx = this.db.transaction(['searchIndex'], 'readwrite');
    const store = tx.objectStore('searchIndex');

    for (const token of tokens) {
      const entry = await store.get(token);
      if (entry) {
        entry.docIds = entry.docIds.filter(id => id !== docId);
        if (entry.docIds.length > 0) {
          await store.put(entry);
        } else {
          await store.delete(token);
        }
      }
    }

    await tx.done;

    // 删除文档
    await this.db.delete('documents', docId);
  }
}
```

### 场景三：图片缓存系统

```javascript
class ImageCache {
  constructor(db) {
    this.db = db;
    this.maxCacheSize = 100 * 1024 * 1024; // 100MB
  }

  async cacheImage(url) {
    // 检查是否已缓存
    const existing = await this.db.get('imageCache', url);
    if (existing) {
      // 更新访问时间
      await this.db.put('imageCache', {
        ...existing,
        lastAccessedAt: new Date()
      });
      return this.createObjectURL(existing.blob);
    }

    // 下载图片
    const response = await fetch(url);
    if (!response.ok) throw new Error('图片下载失败');

    const blob = await response.blob();

    // 检查缓存空间
    await this.ensureCacheSpace(blob.size);

    // 存储到 IndexedDB
    await this.db.put('imageCache', {
      url,
      blob,
      size: blob.size,
      type: blob.type,
      cachedAt: new Date(),
      lastAccessedAt: new Date()
    });

    return this.createObjectURL(blob);
  }

  async getImage(url) {
    const cached = await this.db.get('imageCache', url);
    if (cached) {
      // 更新访问时间
      await this.db.put('imageCache', {
        ...cached,
        lastAccessedAt: new Date()
      });
      return this.createObjectURL(cached.blob);
    }
    return null;
  }

  createObjectURL(blob) {
    return URL.createObjectURL(blob);
  }

  async ensureCacheSpace(requiredSize) {
    const allCached = await this.db.getAll('imageCache');
    const totalSize = allCached.reduce((sum, item) => sum + item.size, 0);

    if (totalSize + requiredSize <= this.maxCacheSize) {
      return;
    }

    // 按最后访问时间排序，删除最旧的
    const sorted = allCached.sort(
      (a, b) => a.lastAccessedAt - b.lastAccessedAt
    );

    let freedSize = 0;
    for (const item of sorted) {
      if (totalSize - freedSize + requiredSize <= this.maxCacheSize) {
        break;
      }
      await this.db.delete('imageCache', item.url);
      freedSize += item.size;
    }
  }

  async clearCache() {
    await this.db.clear('imageCache');
  }

  async getCacheStats() {
    const allCached = await this.db.getAll('imageCache');
    return {
      count: allCached.length,
      totalSize: allCached.reduce((sum, item) => sum + item.size, 0),
      maxSize: this.maxCacheSize
    };
  }
}
```

## 面试要点

### IndexedDB 与 localStorage 的区别是什么？

**参考答案**：

- **容量**：IndexedDB 可存储大量数据（数百MB），localStorage 限制为 5-10MB
- **数据类型**：IndexedDB 支持存储任意类型包括 Blob，localStorage 只能存储字符串
- **API 类型**：IndexedDB 是异步 API，localStorage 是同步 API
- **查询能力**：IndexedDB 支持索引和复杂查询，localStorage 只能通过键名访问
- **事务支持**：IndexedDB 支持事务保证数据一致性，localStorage 不支持
- **Web Worker**：IndexedDB 可在 Web Worker 中使用，localStorage 不可以

### 解释 IndexedDB 的事务机制

**参考答案**：

IndexedDB 的所有数据操作必须在事务中进行。事务具有以下特点：

- **三种模式**：`readonly`（只读）、`readwrite`（读写）、`versionchange`（版本变更）
- **自动提交**：当事务中所有请求完成且没有新请求时，事务自动提交
- **原子性**：事务中的操作要么全部成功，要么全部回滚
- **生命周期**：事务在创建后如果事件循环中没有新的请求，会自动关闭
- **并发控制**：同一对象存储的读写事务串行执行，只读事务可以并发

### 如何优化 IndexedDB 的查询性能？

**参考答案**：

- **创建合适的索引**：为常用查询字段创建索引
- **使用复合索引**：对于多条件查询，创建复合索引
- **批量操作**：使用单个事务处理多个操作
- **使用游标方向**：根据需求选择合适的游标方向
- **键游标**：如果只需要键，使用 `openKeyCursor` 替代 `openCursor`
- **范围查询**：使用 `IDBKeyRange` 限制查询范围
- **分页加载**：大数据集使用游标分页加载

### 如何处理 IndexedDB 的版本升级？

**参考答案**：

```javascript
const request = indexedDB.open('MyDB', newVersion);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;

  // 增量升级
  if (oldVersion < 1) {
    // 创建初始结构
  }
  if (oldVersion < 2) {
    // 升级到版本 2
  }
};

request.onblocked = () => {
  // 其他标签页阻止升级
  alert('请关闭其他标签页');
};

// 在现有连接上监听版本变更
db.onversionchange = () => {
  db.close();
  location.reload();
};
```

### IndexedDB 中游标的作用和使用场景

**参考答案**：

游标用于遍历对象存储或索引中的数据，适用场景：

- **大数据集遍历**：避免一次性加载所有数据到内存
- **条件更新/删除**：遍历时根据条件修改或删除数据
- **分页实现**：通过 `advance()` 跳过记录实现分页
- **排序遍历**：通过方向参数控制遍历顺序

```javascript
// 游标遍历示例
let cursor = await store.openCursor();
while (cursor) {
  console.log(cursor.value);
  cursor = await cursor.continue();
}
```

## 延伸阅读

### 官方文档

- [MDN IndexedDB API](https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API)
- [W3C Indexed Database API 规范](https://www.w3.org/TR/IndexedDB/)

### 推荐库

- [idb](https://github.com/jakearchibald/idb) - 轻量级 Promise 封装
- [Dexie.js](https://dexie.org/) - 功能丰富的 IndexedDB 封装库
- [localForage](https://localforage.github.io/localForage/) - 统一的离线存储 API

### 相关文章

- [IndexedDB 最佳实践](https://web.dev/indexeddb-best-practices/)
- [构建离线优先应用](https://web.dev/offline-cookbook/)
- [Service Worker 与 IndexedDB 结合使用](https://web.dev/service-workers-cache-storage/)
