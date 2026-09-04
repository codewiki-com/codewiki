---
title: 缓存策略完全指南
description: 掌握各种缓存策略和技术，提升系统性能和可扩展性
track: backend
section: caching-queues
difficulty: intermediate
tags:
  - 缓存
  - Redis
  - 性能优化
  - CDN
status: imported
origin: old/src/content/docs/backend/caching.zh.md
divergence: 0.322
issues: []
legacy:
  category: Backend
  subcategory: Performance
  order: 17
  lastUpdated: 2026-01-07
---

缓存是现代软件系统中最重要的性能优化手段之一。合理使用缓存可以显著降低系统延迟、减轻数据库压力、提升用户体验。本文将深入探讨各种缓存策略、技术实现以及常见问题的解决方案。

## 缓存的意义与应用场景

### 为什么需要缓存

缓存的核心思想是**用空间换时间**，将计算结果或数据存储在更快的存储介质中，避免重复计算或访问慢速存储。

```
访问速度对比：
┌─────────────────────────────────────────────────┐
│ CPU 寄存器    │ < 1 ns                          │
│ CPU L1 缓存   │ ~ 1 ns                          │
│ CPU L2 缓存   │ ~ 4 ns                          │
│ CPU L3 缓存   │ ~ 10 ns                         │
│ 内存 (RAM)    │ ~ 100 ns                        │
│ SSD          │ ~ 100 μs                        │
│ 机械硬盘      │ ~ 10 ms                         │
│ 网络请求      │ ~ 100 ms                        │
└─────────────────────────────────────────────────┘
```

### 缓存的主要收益

```typescript
// 没有缓存的情况
async function getUserProfile(userId: string): Promise<UserProfile> {
  // 每次请求都需要查询数据库，耗时约 50ms
  const user = await database.query('SELECT * FROM users WHERE id = ?', [userId]);

  // 还需要查询关联数据，额外耗时 30ms
  const posts = await database.query('SELECT * FROM posts WHERE user_id = ?', [userId]);

  // 总耗时: 80ms+
  return { user, posts };
}

// 使用缓存的情况
async function getUserProfileWithCache(userId: string): Promise<UserProfile> {
  const cacheKey = `user:profile:${userId}`;

  // 先查缓存，命中时只需 1-2ms
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 缓存未命中，查询数据库
  const profile = await getUserProfile(userId);

  // 写入缓存，设置过期时间
  await redis.setex(cacheKey, 3600, JSON.stringify(profile));

  return profile;
}
```

### 典型应用场景

```typescript
// 1. 热点数据缓存 - 用户信息、商品详情
interface CacheScenarios {
  hotData: {
    example: '用户信息、商品详情、配置信息';
    ttl: '分钟到小时级别';
    strategy: 'Cache Aside';
  };

  // 2. 计算结果缓存 - 排行榜、统计数据
  computationCache: {
    example: '排行榜、报表统计、推荐结果';
    ttl: '根据实时性要求设定';
    strategy: 'Write Behind';
  };

  // 3. 会话缓存 - Session、Token
  sessionCache: {
    example: '用户登录状态、购物车';
    ttl: '小时到天级别';
    strategy: 'Read/Write Through';
  };

  // 4. 页面缓存 - HTML片段、API响应
  pageCache: {
    example: '首页、列表页、静态资源';
    ttl: '秒到分钟级别';
    strategy: 'HTTP Cache + CDN';
  };
}
```

## 缓存策略详解

### Cache Aside（旁路缓存）

这是最常用的缓存策略，应用程序同时维护缓存和数据库。

```typescript
class CacheAsidePattern {
  private cache: Redis;
  private db: Database;

  // 读取数据
  async read(key: string): Promise<any> {
    // 1. 先查缓存
    let data = await this.cache.get(key);

    if (data !== null) {
      console.log('Cache HIT');
      return JSON.parse(data);
    }

    console.log('Cache MISS');

    // 2. 缓存未命中，查数据库
    data = await this.db.query(key);

    // 3. 将数据写入缓存
    if (data) {
      await this.cache.setex(key, 3600, JSON.stringify(data));
    }

    return data;
  }

  // 写入数据
  async write(key: string, value: any): Promise<void> {
    // 1. 先更新数据库
    await this.db.update(key, value);

    // 2. 再删除缓存（而非更新缓存）
    await this.cache.del(key);

    // 为什么删除而不是更新？
    // - 避免并发写入时的数据不一致
    // - 延迟加载，只有真正需要时才缓存
  }
}
```

**Cache Aside 的问题：先更新数据库还是先删除缓存？**

```typescript
// 方案1：先删缓存，后更新数据库（不推荐）
async function updateV1(key: string, value: any) {
  await cache.del(key);      // 步骤1
  await db.update(key, value); // 步骤2

  // 问题：步骤1和步骤2之间，另一个请求读取数据
  // 会把旧数据重新加载到缓存中
}

// 方案2：先更新数据库，后删缓存（推荐）
async function updateV2(key: string, value: any) {
  await db.update(key, value); // 步骤1
  await cache.del(key);        // 步骤2

  // 仍有极端情况可能不一致，但概率极低
  // 可配合延迟双删进一步降低风险
}

// 方案3：延迟双删
async function updateV3(key: string, value: any) {
  await cache.del(key);         // 第一次删除
  await db.update(key, value);  // 更新数据库

  // 延迟一段时间后再次删除
  setTimeout(async () => {
    await cache.del(key);
  }, 500); // 500ms 后再删一次
}
```

### Read Through（读穿透）

缓存层负责数据加载，应用程序只与缓存交互。

```typescript
class ReadThroughCache {
  private cache: Map<string, any> = new Map();
  private loader: DataLoader;

  constructor(loader: DataLoader) {
    this.loader = loader;
  }

  async get(key: string): Promise<any> {
    // 缓存命中
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // 缓存未命中，缓存层自动加载数据
    const data = await this.loader.load(key);

    if (data !== null) {
      this.cache.set(key, data);
    }

    return data;
  }
}

// 使用示例
const userCache = new ReadThroughCache({
  load: async (userId: string) => {
    return await database.findUser(userId);
  }
});

// 应用程序代码简化了
const user = await userCache.get('user:123');
```

### Write Through（写穿透）

写操作同时更新缓存和数据库，保证强一致性。

```typescript
class WriteThroughCache {
  private cache: Redis;
  private db: Database;

  async write(key: string, value: any): Promise<void> {
    // 同步更新缓存和数据库（原子操作）
    await Promise.all([
      this.cache.set(key, JSON.stringify(value)),
      this.db.update(key, value)
    ]);
  }

  async read(key: string): Promise<any> {
    // 直接从缓存读取
    const data = await this.cache.get(key);
    return data ? JSON.parse(data) : null;
  }
}
```

### Write Behind（异步写回）

也称为 Write Back，写操作只更新缓存，异步批量写入数据库。

```typescript
class WriteBehindCache {
  private cache: Redis;
  private db: Database;
  private writeQueue: Map<string, any> = new Map();
  private flushInterval: number = 1000; // 1秒

  constructor() {
    // 定期批量写入数据库
    setInterval(() => this.flush(), this.flushInterval);
  }

  async write(key: string, value: any): Promise<void> {
    // 只更新缓存
    await this.cache.set(key, JSON.stringify(value));

    // 加入写队列
    this.writeQueue.set(key, value);
  }

  private async flush(): Promise<void> {
    if (this.writeQueue.size === 0) return;

    const batch = new Map(this.writeQueue);
    this.writeQueue.clear();

    // 批量写入数据库
    const operations = Array.from(batch.entries()).map(
      ([key, value]) => this.db.update(key, value)
    );

    try {
      await Promise.all(operations);
      console.log(`Flushed ${batch.size} items to database`);
    } catch (error) {
      // 写入失败，重新加入队列
      batch.forEach((value, key) => {
        this.writeQueue.set(key, value);
      });
      console.error('Flush failed, items re-queued');
    }
  }
}

// 适用场景：计数器、日志、非关键数据
const viewCounter = new WriteBehindCache();
await viewCounter.write('article:123:views', 10001);
```

## 缓存更新策略

### 基于过期时间（TTL）

```typescript
class TTLCache {
  private redis: Redis;

  // 固定过期时间
  async setWithTTL(key: string, value: any, ttlSeconds: number) {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  // 滑动过期时间（每次访问刷新）
  async getWithRefresh(key: string, ttlSeconds: number): Promise<any> {
    const data = await this.redis.get(key);

    if (data) {
      // 刷新过期时间
      await this.redis.expire(key, ttlSeconds);
      return JSON.parse(data);
    }

    return null;
  }

  // 随机过期时间（防止缓存雪崩）
  async setWithRandomTTL(key: string, value: any, baseTTL: number) {
    // 在基础 TTL 上增加随机时间
    const randomOffset = Math.floor(Math.random() * 300); // 0-300秒
    const ttl = baseTTL + randomOffset;

    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}
```

### 基于事件驱动

```typescript
import { EventEmitter } from 'events';

class EventDrivenCache extends EventEmitter {
  private cache: Redis;

  constructor() {
    super();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // 监听数据变更事件
    this.on('user:updated', async (userId: string) => {
      await this.invalidate(`user:${userId}`);
      await this.invalidate(`user:profile:${userId}`);
    });

    this.on('product:updated', async (productId: string) => {
      await this.invalidate(`product:${productId}`);
      await this.invalidate(`product:detail:${productId}`);
      // 还需要更新相关列表缓存
      await this.invalidatePattern('product:list:*');
    });
  }

  async invalidate(key: string) {
    await this.cache.del(key);
    console.log(`Cache invalidated: ${key}`);
  }

  async invalidatePattern(pattern: string) {
    const keys = await this.cache.keys(pattern);
    if (keys.length > 0) {
      await this.cache.del(...keys);
      console.log(`Invalidated ${keys.length} keys matching: ${pattern}`);
    }
  }
}

// 使用示例
const cache = new EventDrivenCache();

// 当用户信息更新时
async function updateUser(userId: string, data: any) {
  await database.updateUser(userId, data);
  cache.emit('user:updated', userId); // 触发缓存失效
}
```

### 版本号策略

```typescript
class VersionedCache {
  private cache: Redis;
  private versionKey = 'cache:version';

  async getVersion(): Promise<number> {
    const version = await this.cache.get(this.versionKey);
    return version ? parseInt(version) : 1;
  }

  async incrementVersion(): Promise<number> {
    return await this.cache.incr(this.versionKey);
  }

  async get(key: string): Promise<any> {
    const version = await this.getVersion();
    const versionedKey = `${key}:v${version}`;

    const data = await this.cache.get(versionedKey);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    const version = await this.getVersion();
    const versionedKey = `${key}:v${version}`;

    await this.cache.setex(versionedKey, ttl, JSON.stringify(value));
  }

  // 全局失效：只需增加版本号
  async invalidateAll(): Promise<void> {
    await this.incrementVersion();
    // 旧版本的缓存会自然过期
  }
}
```

## 本地缓存 vs 分布式缓存

### 本地缓存实现

```typescript
// 使用 node-cache 实现本地缓存
import NodeCache from 'node-cache';

class LocalCache {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 600,        // 默认 TTL: 10分钟
      checkperiod: 120,   // 检查过期间隔: 2分钟
      maxKeys: 10000,     // 最大键数量
      useClones: false    // 不克隆对象（提升性能）
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl ?? 600);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  // 获取缓存统计信息
  getStats() {
    return this.cache.getStats();
  }
}

// LRU 缓存实现
class LRUCache<T> {
  private capacity: number;
  private cache: Map<string, T> = new Map();

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: string): T | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // 访问时移到末尾（最近使用）
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // 删除最久未使用的（Map 的第一个元素）
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }
}
```

### 多级缓存架构

```typescript
class MultiLevelCache {
  private l1Cache: LocalCache;      // L1: 本地内存
  private l2Cache: Redis;            // L2: Redis

  constructor() {
    this.l1Cache = new LocalCache();
    this.l2Cache = new Redis();
  }

  async get<T>(key: string): Promise<T | null> {
    // 1. 先查 L1 缓存（本地内存，微秒级）
    let value = this.l1Cache.get<T>(key);
    if (value !== undefined) {
      console.log('L1 Cache HIT');
      return value;
    }

    // 2. L1 未命中，查 L2 缓存（Redis，毫秒级）
    const redisValue = await this.l2Cache.get(key);
    if (redisValue) {
      console.log('L2 Cache HIT');
      value = JSON.parse(redisValue);

      // 回填 L1 缓存
      this.l1Cache.set(key, value, 60); // L1 TTL 较短
      return value;
    }

    console.log('Cache MISS');
    return null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // 同时写入两级缓存
    this.l1Cache.set(key, value, Math.min(ttl, 60)); // L1 最长 60 秒
    await this.l2Cache.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(key: string): Promise<void> {
    // 同时删除两级缓存
    this.l1Cache.del(key);
    await this.l2Cache.del(key);

    // 多实例环境下，需要通过消息通知其他实例
    await this.publishInvalidation(key);
  }

  private async publishInvalidation(key: string): Promise<void> {
    // 通过 Redis Pub/Sub 通知其他实例
    await this.l2Cache.publish('cache:invalidation', key);
  }
}
```

### 本地缓存与分布式缓存对比

```
┌─────────────┬──────────────────┬──────────────────┐
│   特性      │     本地缓存      │    分布式缓存     │
├─────────────┼──────────────────┼──────────────────┤
│ 访问速度    │ 微秒级（极快）    │ 毫秒级（较快）    │
│ 容量       │ 受本机内存限制    │ 可水平扩展       │
│ 数据一致性  │ 多实例间不一致    │ 天然一致         │
│ 可靠性     │ 进程重启即丢失    │ 支持持久化       │
│ 网络开销   │ 无               │ 有网络 IO        │
│ 适用场景   │ 热点数据、配置    │ 会话、分布式锁   │
└─────────────┴──────────────────┴──────────────────┘
```

## Redis 缓存实战

### 常用数据结构与应用

```typescript
import Redis from 'ioredis';

class RedisCacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
    });
  }

  // String - 简单键值对
  async cacheUserSession(userId: string, session: any, ttl: number = 3600) {
    const key = `session:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(session));
  }

  // Hash - 存储对象
  async cacheUserProfile(userId: string, profile: Record<string, any>) {
    const key = `user:${userId}`;
    await this.redis.hset(key, profile);
    await this.redis.expire(key, 3600);
  }

  async getUserField(userId: string, field: string): Promise<string | null> {
    return await this.redis.hget(`user:${userId}`, field);
  }

  // List - 消息队列、最新列表
  async pushToRecentList(listKey: string, item: any, maxLength: number = 100) {
    await this.redis.lpush(listKey, JSON.stringify(item));
    await this.redis.ltrim(listKey, 0, maxLength - 1); // 保持固定长度
  }

  // Set - 去重、标签、关注关系
  async addUserTags(userId: string, tags: string[]) {
    const key = `user:${userId}:tags`;
    await this.redis.sadd(key, ...tags);
  }

  async getCommonTags(userId1: string, userId2: string): Promise<string[]> {
    return await this.redis.sinter(
      `user:${userId1}:tags`,
      `user:${userId2}:tags`
    );
  }

  // Sorted Set - 排行榜
  async updateLeaderboard(boardKey: string, userId: string, score: number) {
    await this.redis.zadd(boardKey, score, userId);
  }

  async getTopN(boardKey: string, n: number = 10): Promise<string[]> {
    return await this.redis.zrevrange(boardKey, 0, n - 1, 'WITHSCORES');
  }

  // 带过期时间的计数器
  async incrementCounter(key: string, ttl: number = 3600): Promise<number> {
    const multi = this.redis.multi();
    multi.incr(key);
    multi.expire(key, ttl);
    const results = await multi.exec();
    return results![0][1] as number;
  }
}
```

### Redis 分布式锁

```typescript
class RedisDistributedLock {
  private redis: Redis;
  private lockPrefix = 'lock:';

  async acquireLock(
    resource: string,
    ttlMs: number = 10000,
    retryCount: number = 3,
    retryDelay: number = 100
  ): Promise<string | null> {
    const lockKey = this.lockPrefix + resource;
    const lockValue = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    for (let i = 0; i < retryCount; i++) {
      // SET key value NX PX ttl
      const result = await this.redis.set(
        lockKey,
        lockValue,
        'PX',
        ttlMs,
        'NX'
      );

      if (result === 'OK') {
        return lockValue; // 获取锁成功
      }

      // 等待后重试
      await this.sleep(retryDelay);
    }

    return null; // 获取锁失败
  }

  async releaseLock(resource: string, lockValue: string): Promise<boolean> {
    const lockKey = this.lockPrefix + resource;

    // 使用 Lua 脚本保证原子性
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, 1, lockKey, lockValue);
    return result === 1;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 使用示例
async function updateInventoryWithLock(productId: string, quantity: number) {
  const lock = new RedisDistributedLock();
  const lockValue = await lock.acquireLock(`inventory:${productId}`);

  if (!lockValue) {
    throw new Error('Failed to acquire lock');
  }

  try {
    // 执行库存更新
    const inventory = await getInventory(productId);
    await setInventory(productId, inventory - quantity);
  } finally {
    // 确保释放锁
    await lock.releaseLock(`inventory:${productId}`, lockValue);
  }
}
```

## 缓存穿透、击穿、雪崩及解决方案

### 缓存穿透

**问题**：查询不存在的数据，缓存永远不会命中，请求直接打到数据库。

```typescript
class CachePenetrationSolution {
  private cache: Redis;
  private bloomFilter: BloomFilter;

  // 解决方案1：缓存空值
  async getWithNullCache(key: string): Promise<any> {
    const cached = await this.cache.get(key);

    // 特殊标记表示空值
    if (cached === 'NULL_VALUE') {
      return null;
    }

    if (cached) {
      return JSON.parse(cached);
    }

    const data = await this.queryDatabase(key);

    if (data === null) {
      // 缓存空值，TTL 较短
      await this.cache.setex(key, 60, 'NULL_VALUE');
    } else {
      await this.cache.setex(key, 3600, JSON.stringify(data));
    }

    return data;
  }

  // 解决方案2：布隆过滤器
  async getWithBloomFilter(key: string): Promise<any> {
    // 先检查布隆过滤器
    if (!this.bloomFilter.mightContain(key)) {
      // 一定不存在
      return null;
    }

    // 可能存在，继续查询
    const cached = await this.cache.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    return await this.queryDatabase(key);
  }

  // 布隆过滤器实现（使用 Redis）
  async initBloomFilter(allKeys: string[]) {
    for (const key of allKeys) {
      await this.cache.call('BF.ADD', 'bf:keys', key);
    }
  }

  async checkBloomFilter(key: string): Promise<boolean> {
    const result = await this.cache.call('BF.EXISTS', 'bf:keys', key);
    return result === 1;
  }

  private async queryDatabase(key: string): Promise<any> {
    // 数据库查询逻辑
    return null;
  }
}
```

### 缓存击穿

**问题**：热点 key 过期瞬间，大量请求同时打到数据库。

```typescript
class CacheBreakdownSolution {
  private cache: Redis;
  private lock: RedisDistributedLock;

  // 解决方案1：互斥锁
  async getWithMutex(key: string): Promise<any> {
    let data = await this.cache.get(key);

    if (data) {
      return JSON.parse(data);
    }

    // 获取锁
    const lockKey = `lock:${key}`;
    const lockValue = await this.lock.acquireLock(lockKey, 5000);

    if (lockValue) {
      try {
        // 双重检查
        data = await this.cache.get(key);
        if (data) {
          return JSON.parse(data);
        }

        // 查询数据库
        const result = await this.queryDatabase(key);
        await this.cache.setex(key, 3600, JSON.stringify(result));
        return result;
      } finally {
        await this.lock.releaseLock(lockKey, lockValue);
      }
    } else {
      // 未获取到锁，等待后重试
      await this.sleep(100);
      return this.getWithMutex(key);
    }
  }

  // 解决方案2：逻辑过期
  async getWithLogicalExpire(key: string): Promise<any> {
    const cached = await this.cache.get(key);

    if (!cached) {
      return null;
    }

    const { data, expireAt } = JSON.parse(cached);

    // 未过期，直接返回
    if (Date.now() < expireAt) {
      return data;
    }

    // 已过期，尝试获取锁并异步更新
    const lockValue = await this.lock.acquireLock(`lock:${key}`, 5000, 1, 0);

    if (lockValue) {
      // 异步更新缓存
      this.refreshCache(key, lockValue).catch(console.error);
    }

    // 返回旧数据
    return data;
  }

  private async refreshCache(key: string, lockValue: string) {
    try {
      const newData = await this.queryDatabase(key);
      const cacheData = {
        data: newData,
        expireAt: Date.now() + 3600 * 1000 // 逻辑过期时间
      };
      // 物理过期时间设置更长
      await this.cache.setex(key, 7200, JSON.stringify(cacheData));
    } finally {
      await this.lock.releaseLock(`lock:${key}`, lockValue);
    }
  }

  private async queryDatabase(key: string): Promise<any> {
    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 缓存雪崩

**问题**：大量缓存同时过期或缓存服务宕机，导致请求全部打到数据库。

```typescript
class CacheAvalancheSolution {
  private cache: Redis;
  private localCache: LocalCache;

  // 解决方案1：随机过期时间
  async setWithRandomTTL(key: string, value: any, baseTTL: number) {
    // 基础 TTL 基础上增加随机值
    const randomTTL = baseTTL + Math.floor(Math.random() * 300);
    await this.cache.setex(key, randomTTL, JSON.stringify(value));
  }

  // 解决方案2：多级缓存
  async getWithMultiLevel(key: string): Promise<any> {
    // L1: 本地缓存
    let data = this.localCache.get(key);
    if (data) return data;

    // L2: Redis
    const cached = await this.cache.get(key);
    if (cached) {
      data = JSON.parse(cached);
      this.localCache.set(key, data, 30); // 本地缓存 30 秒
      return data;
    }

    // 数据库
    data = await this.queryDatabase(key);
    if (data) {
      await this.cache.setex(key, 3600, JSON.stringify(data));
      this.localCache.set(key, data, 30);
    }

    return data;
  }

  // 解决方案3：熔断降级
  async getWithCircuitBreaker(key: string): Promise<any> {
    try {
      const data = await this.cache.get(key);
      if (data) return JSON.parse(data);

      return await this.queryDatabase(key);
    } catch (error) {
      // Redis 不可用时，使用本地缓存或降级方案
      console.error('Cache service unavailable:', error);

      const localData = this.localCache.get(key);
      if (localData) return localData;

      // 返回降级数据
      return this.getFallbackData(key);
    }
  }

  // 解决方案4：缓存预热
  async warmUpCache(keys: string[]) {
    console.log('Starting cache warm-up...');

    for (const key of keys) {
      const data = await this.queryDatabase(key);
      if (data) {
        // 使用随机 TTL
        const ttl = 3600 + Math.floor(Math.random() * 600);
        await this.cache.setex(key, ttl, JSON.stringify(data));
      }
    }

    console.log(`Cache warm-up completed for ${keys.length} keys`);
  }

  private async queryDatabase(key: string): Promise<any> {
    return null;
  }

  private getFallbackData(key: string): any {
    return { message: 'Service temporarily unavailable' };
  }
}
```

## HTTP 缓存

### ETag 与 Last-Modified

```typescript
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ETag 中间件
function etagMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send.bind(res);

  res.send = function(body: any) {
    // 生成 ETag
    const etag = crypto
      .createHash('md5')
      .update(JSON.stringify(body))
      .digest('hex');

    res.set('ETag', `"${etag}"`);

    // 检查客户端 ETag
    const clientETag = req.get('If-None-Match');
    if (clientETag === `"${etag}"`) {
      return res.status(304).end();
    }

    return originalSend(body);
  };

  next();
}

// Last-Modified 示例
async function getArticle(req: Request, res: Response) {
  const article = await database.getArticle(req.params.id);

  const lastModified = new Date(article.updatedAt);
  res.set('Last-Modified', lastModified.toUTCString());

  // 检查 If-Modified-Since
  const clientLastModified = req.get('If-Modified-Since');
  if (clientLastModified) {
    const clientDate = new Date(clientLastModified);
    if (lastModified <= clientDate) {
      return res.status(304).end();
    }
  }

  res.json(article);
}

// Cache-Control 设置
function setCacheHeaders(res: Response, options: CacheOptions) {
  const directives: string[] = [];

  if (options.public) {
    directives.push('public');
  } else {
    directives.push('private');
  }

  if (options.maxAge) {
    directives.push(`max-age=${options.maxAge}`);
  }

  if (options.sMaxAge) {
    directives.push(`s-maxage=${options.sMaxAge}`);
  }

  if (options.noCache) {
    directives.push('no-cache');
  }

  if (options.noStore) {
    directives.push('no-store');
  }

  if (options.mustRevalidate) {
    directives.push('must-revalidate');
  }

  res.set('Cache-Control', directives.join(', '));
}

interface CacheOptions {
  public?: boolean;
  maxAge?: number;
  sMaxAge?: number;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
}

// 使用示例
app.get('/api/products', (req, res) => {
  setCacheHeaders(res, {
    public: true,
    maxAge: 300,      // 浏览器缓存 5 分钟
    sMaxAge: 3600,    // CDN 缓存 1 小时
  });

  res.json(products);
});
```

### 缓存策略对比

```
┌────────────────────┬─────────────────────────────────────┐
│   Cache-Control    │            说明                     │
├────────────────────┼─────────────────────────────────────┤
│ no-store           │ 完全不缓存                          │
│ no-cache           │ 每次都验证（ETag/Last-Modified）    │
│ max-age=N          │ 缓存 N 秒                           │
│ s-maxage=N         │ CDN/代理缓存 N 秒                   │
│ private            │ 仅浏览器缓存                        │
│ public             │ 可以被代理/CDN缓存                  │
│ must-revalidate    │ 过期后必须验证                      │
│ immutable          │ 永不变化（配合版本号使用）          │
└────────────────────┴─────────────────────────────────────┘
```

## CDN 缓存

### CDN 缓存原理

```
用户请求流程：

    用户 ──────> 边缘节点 ──────> 源站
          1ms      ↓         50ms (仅缓存未命中时)
              检查缓存
                ↓
           命中 / 未命中
                ↓
             返回内容
```

### CDN 缓存配置

```typescript
// CDN 缓存配置示例（以 Cloudflare Workers 为例）
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 静态资源 - 长期缓存
    if (url.pathname.match(/\.(js|css|png|jpg|woff2)$/)) {
      const response = await fetch(request);
      const newResponse = new Response(response.body, response);

      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      return newResponse;
    }

    // API 响应 - 短期缓存
    if (url.pathname.startsWith('/api/')) {
      const cacheKey = new Request(url.toString(), request);
      const cache = caches.default;

      // 尝试从缓存获取
      let response = await cache.match(cacheKey);

      if (!response) {
        response = await fetch(request);

        // 克隆响应（响应只能消费一次）
        const responseToCache = response.clone();

        // 设置缓存
        const cachedResponse = new Response(responseToCache.body, responseToCache);
        cachedResponse.headers.set('Cache-Control', 'public, s-maxage=60');

        // 存入 CDN 缓存
        await cache.put(cacheKey, cachedResponse);
      }

      return response;
    }

    return fetch(request);
  }
};
```

### 缓存刷新策略

```typescript
class CDNCacheManager {
  private cdnProvider: CDNProvider;

  // 主动刷新 CDN 缓存
  async purgeCache(urls: string[]): Promise<void> {
    await this.cdnProvider.purge(urls);
    console.log(`Purged ${urls.length} URLs from CDN cache`);
  }

  // 刷新整个目录
  async purgeDirectory(path: string): Promise<void> {
    await this.cdnProvider.purgeByPrefix(path);
  }

  // 基于标签刷新
  async purgeByTag(tag: string): Promise<void> {
    await this.cdnProvider.purgeByTag(tag);
  }

  // 版本化 URL（避免缓存问题）
  generateVersionedUrl(path: string, version: string): string {
    const url = new URL(path);
    url.searchParams.set('v', version);
    return url.toString();
  }

  // 或使用内容哈希
  generateHashedUrl(path: string, contentHash: string): string {
    const ext = path.split('.').pop();
    const basePath = path.slice(0, -(ext!.length + 1));
    return `${basePath}.${contentHash}.${ext}`;
  }
}
```

## 缓存一致性问题

### 一致性问题场景

```typescript
// 场景：用户更新昵称
async function updateNickname(userId: string, nickname: string) {
  // 多个地方可能缓存了用户信息
  // 1. 用户详情缓存
  // 2. 文章作者信息缓存
  // 3. 评论作者信息缓存
  // 4. CDN 缓存的页面

  // 更新数据库
  await database.updateUser(userId, { nickname });

  // 如何保证所有缓存都更新？
}
```

### 解决方案

```typescript
// 方案1：消息队列 + 最终一致性
class CacheConsistencyManager {
  private messageQueue: MessageQueue;
  private cacheService: CacheService;

  async handleDataChange(event: DataChangeEvent) {
    // 发布数据变更事件
    await this.messageQueue.publish('data.changed', {
      entity: event.entity,
      id: event.id,
      action: event.action,
      timestamp: Date.now()
    });
  }

  // 消费者处理缓存失效
  async processCacheInvalidation(message: DataChangeMessage) {
    const { entity, id } = message;

    switch (entity) {
      case 'user':
        await this.invalidateUserRelatedCache(id);
        break;
      case 'product':
        await this.invalidateProductRelatedCache(id);
        break;
    }
  }

  private async invalidateUserRelatedCache(userId: string) {
    const keysToInvalidate = [
      `user:${userId}`,
      `user:profile:${userId}`,
      `user:posts:${userId}`,
    ];

    await Promise.all(
      keysToInvalidate.map(key => this.cacheService.del(key))
    );

    // 通知其他服务
    await this.messageQueue.publish('cache.invalidated', {
      keys: keysToInvalidate
    });
  }

  private async invalidateProductRelatedCache(productId: string) {
    // 类似处理
  }
}

// 方案2：订阅数据库 binlog
class BinlogSubscriber {
  async processBinlogEvent(event: BinlogEvent) {
    if (event.table === 'users') {
      const userId = event.data.id;
      await cache.del(`user:${userId}`);
    }
  }
}

// 方案3：设置合理的过期时间 + 读修复
class EventualConsistencyCache {
  async getUser(userId: string): Promise<User> {
    const cached = await cache.get(`user:${userId}`);

    if (cached) {
      const user = JSON.parse(cached);

      // 异步校验数据是否最新
      this.validateCache(userId, user).catch(console.error);

      return user;
    }

    const user = await database.getUser(userId);
    await cache.setex(`user:${userId}`, 300, JSON.stringify(user)); // 5分钟过期

    return user;
  }

  private async validateCache(userId: string, cachedUser: User) {
    const dbUser = await database.getUser(userId);

    if (dbUser.updatedAt > cachedUser.updatedAt) {
      // 缓存已过期，更新
      await cache.setex(`user:${userId}`, 300, JSON.stringify(dbUser));
    }
  }
}
```

## 面试要点

### 常见面试题

```typescript
// Q1: 如何设计一个高性能的缓存系统？
/*
答案要点：
1. 采用多级缓存架构（L1 本地 + L2 分布式）
2. 合理选择缓存策略（Cache Aside 最常用）
3. 设计缓存键规范（前缀:业务:ID）
4. 合理设置过期时间（热点数据更长）
5. 考虑缓存穿透/击穿/雪崩的防护
6. 实现缓存预热机制
7. 监控缓存命中率
*/

// Q2: 缓存和数据库的一致性如何保证？
/*
答案要点：
1. 强一致性：
   - 使用分布式事务（性能低）
   - 使用 Write Through 策略

2. 最终一致性（推荐）：
   - 先更新 DB，再删除缓存
   - 配合延迟双删
   - 订阅 binlog 异步删除缓存
   - 使用消息队列保证最终一致
*/

// Q3: Redis 内存不够用怎么办？
/*
答案要点：
1. 设置合理的 maxmemory
2. 选择合适的淘汰策略：
   - volatile-lru：淘汰有过期时间的最近最少使用
   - allkeys-lru：淘汰所有键的最近最少使用
   - volatile-ttl：淘汰即将过期的
3. 使用 Redis Cluster 分片
4. 数据压缩
5. 优化数据结构（如使用 ziplist）
*/

// Q4: 如何计算缓存命中率？
class CacheMetrics {
  private hits: number = 0;
  private misses: number = 0;

  recordHit() {
    this.hits++;
  }

  recordMiss() {
    this.misses++;
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }

  // 命中率低的可能原因：
  // 1. 缓存空间不足
  // 2. 过期时间设置太短
  // 3. 缓存键设计不合理
  // 4. 冷数据过多
}
```

### 最佳实践清单

```markdown
缓存设计检查清单：

[ ] 缓存键命名规范：前缀:业务:ID（如 user:profile:123）
[ ] 合理设置过期时间，避免同时过期
[ ] 实现缓存穿透防护（空值缓存或布隆过滤器）
[ ] 热点 key 保护（互斥锁或逻辑过期）
[ ] 多级缓存架构（本地 + 分布式）
[ ] 缓存预热机制
[ ] 优雅的缓存失效策略
[ ] 监控告警（命中率、内存使用）
[ ] 缓存数据序列化优化
[ ] 大 key 拆分
```

## 总结

缓存是提升系统性能的利器，但也带来了数据一致性的挑战。选择合适的缓存策略需要根据业务场景权衡：

1. **读多写少**：Cache Aside + 合理 TTL
2. **强一致性**：Read/Write Through
3. **高并发写入**：Write Behind
4. **热点数据**：多级缓存 + 本地缓存

记住：**没有银弹**。在实际应用中，往往需要组合多种策略，并根据监控数据持续优化。理解每种策略的原理和适用场景，才能在面对复杂业务时做出正确的技术选型。
