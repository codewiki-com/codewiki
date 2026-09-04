---
title: 限流策略完全指南
description: 掌握API限流技术，保护系统免受过载攻击
track: backend
section: auth
difficulty: intermediate
tags:
  - 限流
  - 令牌桶
  - 滑动窗口
  - API保护
status: imported
origin: old/src/content/docs/backend/rate-limiting.zh.md
divergence: 0.205
issues: []
legacy:
  category: Backend
  subcategory: Security
  order: 24
  lastUpdated: 2026-01-07
---

## 概念解释

限流（Rate Limiting）是一种控制系统资源访问速率的技术手段。它通过限制单位时间内的请求数量，保护后端服务免受过载、恶意攻击和资源滥用的影响。在现代分布式系统和 API 设计中，限流是保障系统稳定性和可用性的核心防护机制。

---

## 为什么需要限流

### 系统保护

在没有限流机制的情况下，系统面临着多种威胁：

```
                    ┌─────────────────────────────────────┐
                    │           无限流保护的系统            │
                    └─────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
    ┌───────────┐             ┌───────────┐             ┌───────────┐
    │  恶意攻击  │             │  突发流量  │             │  资源滥用  │
    │  DDoS     │             │  热点事件  │             │  爬虫/滥用 │
    └───────────┘             └───────────┘             └───────────┘
          │                           │                           │
          └───────────────────────────┼───────────────────────────┘
                                      ▼
                    ┌─────────────────────────────────────┐
                    │         系统崩溃 / 服务不可用         │
                    └─────────────────────────────────────┘
```

### 限流的核心价值

| 场景 | 无限流 | 有限流 |
|------|--------|--------|
| DDoS 攻击 | 服务瘫痪 | 攻击流量被拦截 |
| 突发流量 | 系统过载崩溃 | 平滑处理，排队等待 |
| 资源滥用 | 正常用户受影响 | 公平分配资源 |
| 成本控制 | 云资源费用暴涨 | 可预测的资源消耗 |
| API 商业化 | 无法计费 | 支持分层定价 |

### 实际案例

**场景一：电商秒杀活动**
```
正常流量：1000 QPS
秒杀瞬时：100000 QPS（100倍）

无限流：数据库连接池耗尽，服务崩溃
有限流：超出部分排队或返回"活动火爆"提示
```

**场景二：API 服务商业化**
```
免费用户：100 次/小时
基础版：1000 次/小时
专业版：10000 次/小时
企业版：无限制（专属通道）
```

---

## 限流算法对比

### 固定窗口算法（Fixed Window）

固定窗口是最简单的限流算法，将时间划分为固定大小的窗口，在每个窗口内统计请求数量。

```
时间线：
|-------- 窗口1 --------|-------- 窗口2 --------|-------- 窗口3 --------|
0s                     60s                    120s                   180s
     请求数: 98              请求数: 45              请求数: 100
     限制: 100               限制: 100               限制: 100
     状态: 通过              状态: 通过              状态: 通过
```

**JavaScript 实现：**

```javascript
class FixedWindowRateLimiter {
  constructor(windowSize, maxRequests) {
    this.windowSize = windowSize;  // 窗口大小（毫秒）
    this.maxRequests = maxRequests;
    this.windows = new Map();  // key -> { count, windowStart }
  }

  isAllowed(key) {
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowSize) * this.windowSize;

    let record = this.windows.get(key);

    // 新窗口或窗口过期，重置计数
    if (!record || record.windowStart !== windowStart) {
      record = { count: 0, windowStart };
      this.windows.set(key, record);
    }

    if (record.count < this.maxRequests) {
      record.count++;
      return true;
    }

    return false;
  }

  // 获取剩余配额
  getRemainingQuota(key) {
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowSize) * this.windowSize;
    const record = this.windows.get(key);

    if (!record || record.windowStart !== windowStart) {
      return this.maxRequests;
    }

    return Math.max(0, this.maxRequests - record.count);
  }
}

// 使用示例
const limiter = new FixedWindowRateLimiter(60000, 100);  // 每分钟100次

function handleRequest(userId) {
  if (limiter.isAllowed(userId)) {
    console.log('请求通过');
    return processRequest();
  } else {
    console.log('请求被限流');
    return { error: 'Rate limit exceeded', retryAfter: 60 };
  }
}
```

**优点：**
- 实现简单，内存占用小
- 计算效率高

**缺点：**
- 存在临界问题（窗口边界突发）

```
临界问题示例：
窗口1最后1秒: 100个请求
窗口2最前1秒: 100个请求
实际2秒内: 200个请求（超过预期限制）

|-------- 窗口1 --------|-------- 窗口2 --------|
                   [100][100]
                      ↑
                  临界点突发
```

### 滑动窗口算法（Sliding Window）

滑动窗口通过将窗口细分为多个小窗口，解决了固定窗口的临界问题。

```
滑动窗口示意图：
时间 →
|--小窗口1--|--小窗口2--|--小窗口3--|--小窗口4--|--小窗口5--|--小窗口6--|
     10          25          30          15          20          ?
     └──────────────────────────────────────────────┘
                    当前统计窗口（共100个请求）
                                                └──────────────────────┘
                                                    下一时刻的窗口
```

**JavaScript 实现：**

```javascript
class SlidingWindowRateLimiter {
  constructor(windowSize, maxRequests, bucketCount = 10) {
    this.windowSize = windowSize;
    this.maxRequests = maxRequests;
    this.bucketCount = bucketCount;
    this.bucketSize = windowSize / bucketCount;
    this.buckets = new Map();  // key -> Array of bucket counts
  }

  isAllowed(key) {
    const now = Date.now();
    this.cleanExpiredBuckets(key, now);

    let buckets = this.buckets.get(key);
    if (!buckets) {
      buckets = [];
      this.buckets.set(key, buckets);
    }

    // 计算当前窗口内的总请求数
    const totalRequests = buckets.reduce((sum, b) => sum + b.count, 0);

    if (totalRequests < this.maxRequests) {
      // 添加到当前桶
      const currentBucketIndex = Math.floor(now / this.bucketSize);
      const existingBucket = buckets.find(b => b.index === currentBucketIndex);

      if (existingBucket) {
        existingBucket.count++;
      } else {
        buckets.push({ index: currentBucketIndex, count: 1 });
      }

      return true;
    }

    return false;
  }

  cleanExpiredBuckets(key, now) {
    const buckets = this.buckets.get(key);
    if (!buckets) return;

    const oldestValidIndex = Math.floor((now - this.windowSize) / this.bucketSize);

    // 移除过期的桶
    const validBuckets = buckets.filter(b => b.index > oldestValidIndex);
    this.buckets.set(key, validBuckets);
  }
}
```

**滑动窗口计数器优化版（加权计算）：**

```javascript
class SlidingWindowCounterLimiter {
  constructor(windowSize, maxRequests) {
    this.windowSize = windowSize;
    this.maxRequests = maxRequests;
    this.records = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const currentWindow = Math.floor(now / this.windowSize);
    const windowProgress = (now % this.windowSize) / this.windowSize;

    let record = this.records.get(key);
    if (!record) {
      record = { prevCount: 0, currCount: 0, currWindow: currentWindow };
      this.records.set(key, record);
    }

    // 如果进入新窗口，滑动数据
    if (record.currWindow < currentWindow) {
      record.prevCount = record.currWindow === currentWindow - 1 ? record.currCount : 0;
      record.currCount = 0;
      record.currWindow = currentWindow;
    }

    // 加权计算：上一窗口的剩余权重 + 当前窗口的计数
    const estimatedCount = record.prevCount * (1 - windowProgress) + record.currCount;

    if (estimatedCount < this.maxRequests) {
      record.currCount++;
      return true;
    }

    return false;
  }
}
```

**优点：**
- 解决临界突发问题
- 限流更加平滑

**缺点：**
- 内存占用较大
- 实现相对复杂

### 漏桶算法（Leaky Bucket）

漏桶算法将请求比作水滴，以恒定速率流出（处理请求），超出桶容量的请求被丢弃。

```
漏桶模型：
         ┌─────────────────┐
         │    请求流入      │  ← 不规则流入
         └────────┬────────┘
                  ▼
         ┌─────────────────┐
         │                 │
         │   ████████████  │  ← 桶（缓冲区）
         │   ████████████  │
         │   ████████████  │
         └────────┬────────┘
                  │
                  ▼ 恒定速率流出
         ┌─────────────────┐
         │    处理请求      │
         └─────────────────┘
```

**JavaScript 实现：**

```javascript
class LeakyBucketRateLimiter {
  constructor(capacity, leakRate) {
    this.capacity = capacity;      // 桶容量
    this.leakRate = leakRate;      // 漏出速率（请求/秒）
    this.buckets = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { water: 0, lastLeakTime: now };
      this.buckets.set(key, bucket);
    }

    // 计算漏出的水量
    const elapsed = (now - bucket.lastLeakTime) / 1000;
    const leaked = elapsed * this.leakRate;
    bucket.water = Math.max(0, bucket.water - leaked);
    bucket.lastLeakTime = now;

    // 尝试加入新请求
    if (bucket.water < this.capacity) {
      bucket.water += 1;
      return true;
    }

    return false;
  }

  // 获取等待时间
  getWaitTime(key) {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.water < this.capacity) {
      return 0;
    }

    // 需要等待直到桶中有空间
    const overflow = bucket.water - this.capacity + 1;
    return (overflow / this.leakRate) * 1000;  // 毫秒
  }
}

// 带队列的漏桶实现
class LeakyBucketWithQueue {
  constructor(capacity, leakRate) {
    this.capacity = capacity;
    this.leakRate = leakRate;
    this.queue = [];
    this.processing = false;
  }

  async addRequest(request) {
    return new Promise((resolve, reject) => {
      if (this.queue.length >= this.capacity) {
        reject(new Error('Queue is full'));
        return;
      }

      this.queue.push({ request, resolve, reject });
      this.startProcessing();
    });
  }

  startProcessing() {
    if (this.processing) return;
    this.processing = true;

    const interval = 1000 / this.leakRate;

    const processNext = () => {
      if (this.queue.length === 0) {
        this.processing = false;
        return;
      }

      const { request, resolve } = this.queue.shift();
      resolve(this.handleRequest(request));

      setTimeout(processNext, interval);
    };

    processNext();
  }

  handleRequest(request) {
    // 处理请求的逻辑
    return { success: true, data: request };
  }
}
```

**优点：**
- 输出速率恒定，保护下游服务
- 可以缓冲突发流量

**缺点：**
- 无法应对合理的突发流量
- 可能导致请求延迟增加

### 令牌桶算法（Token Bucket）

令牌桶是最灵活的限流算法，以恒定速率生成令牌，请求需要获取令牌才能被处理。支持一定程度的突发流量。

```
令牌桶模型：
         ┌─────────────────┐
         │   令牌生成器     │  ← 恒定速率生成
         └────────┬────────┘
                  ▼
         ┌─────────────────┐
         │  ○ ○ ○ ○ ○ ○ ○  │
         │  ○ ○ ○ ○ ○ ○ ○  │  ← 令牌桶（有上限）
         │  ○ ○ ○ ○ ○ ○ ○  │
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         │                 │
    获取令牌成功       获取令牌失败
         │                 │
         ▼                 ▼
      处理请求          拒绝请求
```

**JavaScript 实现：**

```javascript
class TokenBucketRateLimiter {
  constructor(capacity, refillRate) {
    this.capacity = capacity;          // 桶容量（最大令牌数）
    this.refillRate = refillRate;      // 令牌生成速率（个/秒）
    this.buckets = new Map();
  }

  isAllowed(key, tokens = 1) {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: this.capacity,  // 初始满桶
        lastRefillTime: now
      };
      this.buckets.set(key, bucket);
    }

    // 计算新增的令牌数
    const elapsed = (now - bucket.lastRefillTime) / 1000;
    const newTokens = elapsed * this.refillRate;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + newTokens);
    bucket.lastRefillTime = now;

    // 尝试获取令牌
    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return true;
    }

    return false;
  }

  // 获取当前可用令牌数
  getAvailableTokens(key) {
    const bucket = this.buckets.get(key);
    if (!bucket) return this.capacity;

    const now = Date.now();
    const elapsed = (now - bucket.lastRefillTime) / 1000;
    const newTokens = elapsed * this.refillRate;

    return Math.min(this.capacity, bucket.tokens + newTokens);
  }

  // 获取下次可用时间
  getNextAvailableTime(key, tokens = 1) {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.tokens >= tokens) return 0;

    const needed = tokens - bucket.tokens;
    return (needed / this.refillRate) * 1000;
  }
}

// 支持预热的令牌桶
class WarmUpTokenBucket {
  constructor(capacity, refillRate, warmUpPeriod) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.warmUpPeriod = warmUpPeriod;  // 预热时间（秒）
    this.buckets = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: 0,  // 冷启动，从0开始
        lastRefillTime: now,
        startTime: now
      };
      this.buckets.set(key, bucket);
    }

    // 预热阶段，速率逐渐增加
    const elapsed = (now - bucket.startTime) / 1000;
    const warmUpFactor = Math.min(1, elapsed / this.warmUpPeriod);
    const currentRate = this.refillRate * warmUpFactor;

    // 计算新增令牌
    const refillElapsed = (now - bucket.lastRefillTime) / 1000;
    const newTokens = refillElapsed * currentRate;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + newTokens);
    bucket.lastRefillTime = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }
}
```

**优点：**
- 允许一定程度的突发流量
- 平均速率可控
- 灵活性高

**缺点：**
- 实现相对复杂
- 需要精确的时间计算

### 算法对比总结

| 算法 | 突发流量 | 平滑度 | 实现复杂度 | 内存占用 | 适用场景 |
|------|----------|--------|------------|----------|----------|
| 固定窗口 | 存在临界问题 | 低 | 简单 | 低 | 简单场景 |
| 滑动窗口 | 较好 | 高 | 中等 | 中 | API 限流 |
| 漏桶 | 不支持 | 最高 | 中等 | 低 | 保护下游 |
| 令牌桶 | 支持 | 高 | 较高 | 低 | 通用场景 |

---

## 单机限流实现

### 基于内存的限流器

```javascript
// 完整的单机限流器实现
class SingleNodeRateLimiter {
  constructor(options = {}) {
    this.algorithm = options.algorithm || 'token-bucket';
    this.capacity = options.capacity || 100;
    this.refillRate = options.refillRate || 10;
    this.windowSize = options.windowSize || 60000;

    this.limiters = {
      'token-bucket': new TokenBucketRateLimiter(this.capacity, this.refillRate),
      'sliding-window': new SlidingWindowCounterLimiter(this.windowSize, this.capacity),
      'leaky-bucket': new LeakyBucketRateLimiter(this.capacity, this.refillRate)
    };

    this.limiter = this.limiters[this.algorithm];
    this.metrics = new Map();
  }

  async acquire(key, cost = 1) {
    const startTime = Date.now();
    const allowed = this.limiter.isAllowed(key, cost);

    // 记录指标
    this.recordMetrics(key, allowed, Date.now() - startTime);

    return {
      allowed,
      remaining: this.getRemainingQuota(key),
      resetTime: this.getResetTime(key),
      retryAfter: allowed ? 0 : this.getRetryAfter(key)
    };
  }

  getRemainingQuota(key) {
    if (this.algorithm === 'token-bucket') {
      return Math.floor(this.limiter.getAvailableTokens(key));
    }
    return 0;
  }

  getResetTime(key) {
    const now = Date.now();
    return Math.ceil(now / this.windowSize) * this.windowSize;
  }

  getRetryAfter(key) {
    if (this.algorithm === 'token-bucket') {
      return Math.ceil(this.limiter.getNextAvailableTime(key) / 1000);
    }
    return Math.ceil((this.getResetTime(key) - Date.now()) / 1000);
  }

  recordMetrics(key, allowed, latency) {
    let metric = this.metrics.get(key);
    if (!metric) {
      metric = { total: 0, allowed: 0, rejected: 0, totalLatency: 0 };
      this.metrics.set(key, metric);
    }

    metric.total++;
    metric.totalLatency += latency;
    if (allowed) {
      metric.allowed++;
    } else {
      metric.rejected++;
    }
  }

  getMetrics(key) {
    const metric = this.metrics.get(key);
    if (!metric) return null;

    return {
      ...metric,
      avgLatency: metric.totalLatency / metric.total,
      rejectRate: metric.rejected / metric.total
    };
  }
}
```

### Express 中间件实现

```javascript
const express = require('express');
const app = express();

// 创建限流器实例
const rateLimiter = new SingleNodeRateLimiter({
  algorithm: 'token-bucket',
  capacity: 100,
  refillRate: 10
});

// 限流中间件
function rateLimitMiddleware(options = {}) {
  const { keyGenerator, cost = 1, skipFailedRequests = false } = options;

  return async (req, res, next) => {
    // 生成限流 key
    const key = keyGenerator ? keyGenerator(req) : getDefaultKey(req);

    try {
      const result = await rateLimiter.acquire(key, cost);

      // 设置响应头
      res.set({
        'X-RateLimit-Limit': rateLimiter.capacity,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': result.resetTime
      });

      if (!result.allowed) {
        res.set('Retry-After', result.retryAfter);
        return res.status(429).json({
          error: 'Too Many Requests',
          message: '请求过于频繁，请稍后重试',
          retryAfter: result.retryAfter
        });
      }

      // 如果配置了跳过失败请求，在响应结束时判断
      if (skipFailedRequests) {
        res.on('finish', () => {
          if (res.statusCode >= 400) {
            // 退还令牌的逻辑
          }
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      next();  // 限流器故障时放行
    }
  };
}

// 默认 key 生成器（基于 IP）
function getDefaultKey(req) {
  return req.ip ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.connection.remoteAddress;
}

// 应用限流
app.use('/api/', rateLimitMiddleware({
  keyGenerator: (req) => 'api:' + getDefaultKey(req)
}));

// 针对特定路由的更严格限流
app.use('/api/login', rateLimitMiddleware({
  keyGenerator: (req) => 'login:' + getDefaultKey(req),
  cost: 5  // 登录请求消耗更多配额
}));
```

---

## 分布式限流（Redis）

在分布式系统中，需要使用共享存储来实现跨节点的限流。Redis 是最常用的选择。

### Redis 滑动窗口实现

```javascript
const Redis = require('ioredis');
const redis = new Redis();

class RedisRateLimiter {
  constructor(options = {}) {
    this.redis = options.redis || redis;
    this.prefix = options.prefix || 'ratelimit:';
    this.windowSize = options.windowSize || 60000;  // 毫秒
    this.maxRequests = options.maxRequests || 100;
  }

  async isAllowed(key) {
    const fullKey = this.prefix + key;
    const now = Date.now();
    const windowStart = now - this.windowSize;

    // 使用 Lua 脚本保证原子性
    const luaScript = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local windowStart = tonumber(ARGV[2])
      local maxRequests = tonumber(ARGV[3])
      local windowSize = tonumber(ARGV[4])

      -- 移除过期的请求记录
      redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

      -- 获取当前窗口内的请求数
      local currentCount = redis.call('ZCARD', key)

      if currentCount < maxRequests then
        -- 添加新请求
        redis.call('ZADD', key, now, now .. ':' .. math.random())
        -- 设置过期时间
        redis.call('PEXPIRE', key, windowSize)
        return {1, maxRequests - currentCount - 1}
      else
        return {0, 0}
      end
    `;

    // 使用 Redis EVALSHA 或 EVAL 执行 Lua 脚本
    const result = await this.redis.call(
      'EVAL',
      luaScript,
      1,
      fullKey,
      now,
      windowStart,
      this.maxRequests,
      this.windowSize
    );

    return {
      allowed: result[0] === 1,
      remaining: result[1]
    };
  }
}
```

### Redis 令牌桶实现

```javascript
class RedisTokenBucket {
  constructor(options = {}) {
    this.redis = options.redis || redis;
    this.prefix = options.prefix || 'tokenbucket:';
    this.capacity = options.capacity || 100;
    this.refillRate = options.refillRate || 10;  // 令牌/秒
  }

  async acquire(key, tokens = 1) {
    const fullKey = this.prefix + key;

    const luaScript = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local requested = tonumber(ARGV[4])

      -- 获取当前状态
      local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(data[1])
      local lastRefill = tonumber(data[2])

      -- 初始化
      if tokens == nil then
        tokens = capacity
        lastRefill = now
      end

      -- 计算新增令牌
      local elapsed = (now - lastRefill) / 1000
      local newTokens = elapsed * refillRate
      tokens = math.min(capacity, tokens + newTokens)

      local allowed = 0
      local remaining = tokens

      -- 尝试获取令牌
      if tokens >= requested then
        tokens = tokens - requested
        allowed = 1
        remaining = tokens
      end

      -- 更新状态
      redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
      redis.call('EXPIRE', key, 3600)  -- 1小时过期

      -- 计算下次可用时间
      local waitTime = 0
      if allowed == 0 then
        waitTime = (requested - tokens) / refillRate * 1000
      end

      return {allowed, math.floor(remaining), math.floor(waitTime)}
    `;

    const result = await this.redis.call(
      'EVAL',
      luaScript,
      1,
      fullKey,
      this.capacity,
      this.refillRate,
      Date.now(),
      tokens
    );

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      waitTime: result[2]
    };
  }
}
```

### Redis Cluster 分布式限流

```javascript
class ClusterRateLimiter {
  constructor(options = {}) {
    this.redis = new Redis.Cluster(options.nodes, {
      redisOptions: options.redisOptions
    });
    this.limiter = new RedisTokenBucket({ redis: this.redis, ...options });

    // 本地缓存，减少 Redis 请求
    this.localCache = new Map();
    this.localCacheTTL = options.localCacheTTL || 100;  // 毫秒
  }

  async acquire(key, tokens = 1) {
    // 检查本地缓存
    const cached = this.localCache.get(key);
    if (cached && Date.now() - cached.time < this.localCacheTTL) {
      if (cached.remaining <= 0) {
        return { allowed: false, remaining: 0, waitTime: cached.waitTime };
      }
    }

    try {
      const result = await this.limiter.acquire(key, tokens);

      // 更新本地缓存
      this.localCache.set(key, {
        remaining: result.remaining,
        waitTime: result.waitTime,
        time: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Redis error, falling back to local limit:', error);
      return this.localFallback(key, tokens);
    }
  }

  // Redis 故障时的本地降级
  localFallback(key, tokens) {
    const fallbackLimiter = this.getFallbackLimiter();
    return fallbackLimiter.acquire(key, tokens);
  }

  getFallbackLimiter() {
    if (!this._fallbackLimiter) {
      this._fallbackLimiter = new SingleNodeRateLimiter({
        algorithm: 'token-bucket',
        capacity: this.limiter.capacity,
        refillRate: this.limiter.refillRate
      });
    }
    return this._fallbackLimiter;
  }
}
```

---

## 限流维度

根据业务需求，可以从多个维度进行限流：

### IP 限流

```javascript
function ipKeyGenerator(req) {
  // 考虑代理情况
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return 'ip:' + forwarded.split(',')[0].trim();
  }
  return 'ip:' + (req.ip || req.connection.remoteAddress);
}

// 配置
const ipLimiter = rateLimitMiddleware({
  keyGenerator: ipKeyGenerator,
  maxRequests: 1000,
  windowSize: 60000
});
```

### 用户限流

```javascript
function userKeyGenerator(req) {
  // 从 JWT 或 Session 获取用户 ID
  const userId = req.user?.id || req.session?.userId;
  if (userId) {
    return 'user:' + userId;
  }
  // 未登录用户回退到 IP 限流
  return ipKeyGenerator(req);
}

// 根据用户等级配置不同限额
const userLimits = {
  free: { maxRequests: 100, windowSize: 3600000 },
  basic: { maxRequests: 1000, windowSize: 3600000 },
  premium: { maxRequests: 10000, windowSize: 3600000 },
  enterprise: { maxRequests: Infinity, windowSize: 3600000 }
};

function dynamicUserLimiter(req, res, next) {
  const userTier = req.user?.tier || 'free';
  const limits = userLimits[userTier];

  const limiter = rateLimitMiddleware({
    keyGenerator: userKeyGenerator,
    ...limits
  });

  return limiter(req, res, next);
}
```

### API 端点限流

```javascript
function apiKeyGenerator(req) {
  const method = req.method;
  const path = req.route?.path || req.path;
  const userId = req.user?.id || 'anonymous';

  return 'api:' + method + ':' + path + ':' + userId;
}

// 不同 API 配置不同限额
const apiLimits = {
  'POST:/api/upload': { maxRequests: 10, windowSize: 60000 },
  'GET:/api/search': { maxRequests: 60, windowSize: 60000 },
  'POST:/api/login': { maxRequests: 5, windowSize: 300000 },
  'default': { maxRequests: 100, windowSize: 60000 }
};

function getApiLimit(req) {
  const key = req.method + ':' + (req.route?.path || req.path);
  return apiLimits[key] || apiLimits.default;
}
```

### 多维度组合限流

```javascript
class MultiDimensionRateLimiter {
  constructor(redis, config) {
    this.redis = redis;
    this.config = config;
    this.limiters = new Map();
  }

  async check(req) {
    const dimensions = [
      { type: 'global', key: 'global', limit: this.config.globalLimit },
      { type: 'ip', key: 'ip:' + this.getIp(req), limit: this.config.ipLimit },
      { type: 'user', key: 'user:' + req.user?.id, limit: this.config.userLimit },
      { type: 'api', key: 'api:' + req.path, limit: this.config.apiLimit }
    ];

    const results = await Promise.all(
      dimensions
        .filter(d => d.key && d.limit)
        .map(d => this.checkDimension(d))
    );

    // 任一维度被限流则拒绝
    const blocked = results.find(r => !r.allowed);
    if (blocked) {
      return {
        allowed: false,
        dimension: blocked.dimension,
        retryAfter: blocked.retryAfter
      };
    }

    return { allowed: true };
  }

  async checkDimension(dimension) {
    const limiter = this.getLimiter(dimension.limit);
    const result = await limiter.acquire(dimension.key);

    return {
      ...result,
      dimension: dimension.type
    };
  }

  getLimiter(limit) {
    const key = limit.maxRequests + ':' + limit.windowSize;
    if (!this.limiters.has(key)) {
      this.limiters.set(key, new RedisRateLimiter({
        redis: this.redis,
        ...limit
      }));
    }
    return this.limiters.get(key);
  }

  getIp(req) {
    return req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  }
}
```

---

## 限流响应策略

### 直接拒绝

```javascript
function rejectStrategy(req, res, limitInfo) {
  res.status(429).json({
    error: 'Too Many Requests',
    code: 'RATE_LIMIT_EXCEEDED',
    message: '请求过于频繁，请稍后重试',
    retryAfter: limitInfo.retryAfter,
    limit: limitInfo.limit,
    remaining: limitInfo.remaining,
    reset: limitInfo.resetTime
  });
}
```

### 排队等待

```javascript
class QueuedRateLimiter {
  constructor(options) {
    this.limiter = new TokenBucketRateLimiter(options.capacity, options.refillRate);
    this.maxQueueSize = options.maxQueueSize || 100;
    this.maxWaitTime = options.maxWaitTime || 30000;
    this.queues = new Map();
  }

  async acquire(key) {
    const result = this.limiter.isAllowed(key);
    if (result) {
      return { allowed: true, queued: false };
    }

    // 检查队列大小
    let queue = this.queues.get(key);
    if (!queue) {
      queue = [];
      this.queues.set(key, queue);
    }

    if (queue.length >= this.maxQueueSize) {
      return { allowed: false, queued: false, reason: 'queue_full' };
    }

    // 加入队列等待
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        const index = queue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          queue.splice(index, 1);
        }
        resolve({ allowed: false, queued: true, reason: 'timeout' });
      }, this.maxWaitTime);

      queue.push({ resolve, timeout });
      this.processQueue(key);
    });
  }

  processQueue(key) {
    const queue = this.queues.get(key);
    if (!queue || queue.length === 0) return;

    const interval = setInterval(() => {
      if (queue.length === 0) {
        clearInterval(interval);
        return;
      }

      if (this.limiter.isAllowed(key)) {
        const { resolve, timeout } = queue.shift();
        clearTimeout(timeout);
        resolve({ allowed: true, queued: true });
      }
    }, 100);
  }
}
```

### 降级处理

```javascript
function degradeStrategy(req, res, limitInfo, cache) {
  // 返回缓存数据或简化版响应
  const cachedData = cache.get(req.path);

  if (cachedData) {
    res.set('X-Degraded', 'true');
    res.set('X-Cache', 'HIT');
    return res.json({
      ...cachedData,
      _degraded: true,
      _message: '当前为缓存数据，完整功能稍后恢复'
    });
  }

  // 无缓存时返回最小化响应
  res.status(200).json({
    _degraded: true,
    _message: '服务繁忙，功能受限',
    retryAfter: limitInfo.retryAfter
  });
}
```

### 惩罚策略

```javascript
class PenaltyRateLimiter {
  constructor(options) {
    this.baseLimiter = new RedisRateLimiter(options);
    this.redis = options.redis;
    this.penaltyMultiplier = options.penaltyMultiplier || 2;
    this.penaltyDuration = options.penaltyDuration || 300000;
  }

  async acquire(key) {
    // 检查是否在惩罚期
    const penaltyKey = 'penalty:' + key;
    const penaltyLevel = await this.redis.get(penaltyKey);

    const effectiveLimit = penaltyLevel
      ? Math.floor(this.baseLimiter.maxRequests / Math.pow(this.penaltyMultiplier, penaltyLevel))
      : this.baseLimiter.maxRequests;

    const result = await this.baseLimiter.isAllowed(key);

    if (!result.allowed) {
      // 触发限流，增加惩罚等级
      const newLevel = (parseInt(penaltyLevel) || 0) + 1;
      await this.redis.setex(penaltyKey, this.penaltyDuration / 1000, newLevel);
    }

    return result;
  }
}
```

---

## 框架集成

### Express 集成

```javascript
const express = require('express');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const app = express();
const redis = new Redis();

// 基础限流配置
const basicLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1分钟
  max: 100,             // 每个 IP 100次请求
  standardHeaders: true, // 返回标准 RateLimit 响应头
  legacyHeaders: false,

  // Redis 存储
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),

  // 自定义 key 生成
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },

  // 自定义错误处理
  handler: (req, res, next, options) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: '请求过于频繁，请 ' + Math.ceil(options.windowMs / 1000) + ' 秒后重试',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  },

  // 跳过某些请求
  skip: (req) => {
    return req.user?.role === 'admin';
  }
});

// API 路由限流
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  })
});

// 登录接口严格限流
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: '登录尝试次数过多，请15分钟后重试'
});

// 应用中间件
app.use('/api/', apiLimiter);
app.post('/api/login', loginLimiter);
app.use(basicLimiter);
```

### Nginx 限流配置

```nginx
# nginx.conf

# 定义限流区域
http {
    # 基于 IP 的限流区域（10MB 共享内存，每秒10个请求）
    limit_req_zone $binary_remote_addr zone=ip_limit:10m rate=10r/s;

    # 基于服务器的全局限流
    limit_req_zone $server_name zone=server_limit:10m rate=1000r/s;

    # 基于 API Key 的限流
    map $http_x_api_key $api_key_limit {
        default         "default_zone";
        "premium_key"   "premium_zone";
        "basic_key"     "basic_zone";
    }

    limit_req_zone $api_key_limit zone=default_zone:10m rate=10r/s;
    limit_req_zone $api_key_limit zone=basic_zone:10m rate=100r/s;
    limit_req_zone $api_key_limit zone=premium_zone:10m rate=1000r/s;

    # 连接数限制
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    server {
        listen 80;
        server_name api.example.com;

        # 应用限流
        location /api/ {
            # 限制请求速率，burst 允许突发，nodelay 立即处理
            limit_req zone=ip_limit burst=20 nodelay;

            # 限制并发连接数
            limit_conn conn_limit 10;

            # 自定义限流响应
            limit_req_status 429;

            proxy_pass http://backend;
        }

        # 不同路径不同限流策略
        location /api/upload {
            limit_req zone=ip_limit burst=5 nodelay;
            limit_conn conn_limit 2;

            client_max_body_size 10M;
            proxy_pass http://upload_backend;
        }

        # 登录接口严格限流
        location /api/auth/login {
            limit_req zone=ip_limit burst=3;
            limit_req_status 429;

            proxy_pass http://auth_backend;
        }

        # 自定义 429 错误页面
        error_page 429 /429.json;
        location = /429.json {
            internal;
            default_type application/json;
            return 429 '{"error":"Too Many Requests","message":"请求过于频繁"}';
        }
    }
}
```

### Nginx 限流日志分析

```nginx
# 限流日志格式
log_format rate_limit '$remote_addr - $remote_user [$time_local] '
                      '"$request" $status $body_bytes_sent '
                      '"$http_referer" "$http_user_agent" '
                      'limit_req_status=$limit_req_status';

access_log /var/log/nginx/rate_limit.log rate_limit;
```

---

## 监控与告警

### 限流指标采集

```javascript
const prometheus = require('prom-client');

// 注册指标
const rateLimitTotal = new prometheus.Counter({
  name: 'rate_limit_requests_total',
  help: 'Total rate limit requests',
  labelNames: ['key', 'result']
});

const rateLimitLatency = new prometheus.Histogram({
  name: 'rate_limit_latency_seconds',
  help: 'Rate limit check latency',
  labelNames: ['key'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1]
});

const currentTokens = new prometheus.Gauge({
  name: 'rate_limit_current_tokens',
  help: 'Current available tokens',
  labelNames: ['key']
});

// 包装限流器
class MonitoredRateLimiter {
  constructor(limiter) {
    this.limiter = limiter;
  }

  async acquire(key, tokens = 1) {
    const timer = rateLimitLatency.startTimer({ key });

    try {
      const result = await this.limiter.acquire(key, tokens);

      rateLimitTotal.inc({
        key,
        result: result.allowed ? 'allowed' : 'rejected'
      });

      currentTokens.set({ key }, result.remaining);

      return result;
    } finally {
      timer();
    }
  }
}

// Prometheus 端点
const express = require('express');
const app = express();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

### 告警规则配置

```yaml
# prometheus/rules/rate_limit.yml
groups:
  - name: rate_limit_alerts
    rules:
      # 限流拒绝率过高
      - alert: HighRateLimitRejectionRate
        expr: |
          sum(rate(rate_limit_requests_total{result="rejected"}[5m]))
          /
          sum(rate(rate_limit_requests_total[5m])) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "限流拒绝率过高"
          description: "过去5分钟限流拒绝率超过10%"

      # 特定用户/IP 触发限流
      - alert: UserRateLimited
        expr: |
          increase(rate_limit_requests_total{result="rejected"}[1m]) > 50
        for: 1m
        labels:
          severity: info
        annotations:
          summary: "用户频繁触发限流"
          description: "用户 {{ $labels.key }} 在1分钟内被限流超过50次"

      # 限流检查延迟过高
      - alert: RateLimitLatencyHigh
        expr: |
          histogram_quantile(0.99, rate(rate_limit_latency_seconds_bucket[5m])) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "限流检查延迟过高"
          description: "P99延迟超过100ms"
```

### 日志记录

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'rate-limit.log' })
  ]
});

class LoggedRateLimiter {
  constructor(limiter) {
    this.limiter = limiter;
  }

  async acquire(key, tokens = 1) {
    const result = await this.limiter.acquire(key, tokens);

    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        key,
        tokens,
        remaining: result.remaining,
        waitTime: result.waitTime,
        timestamp: new Date().toISOString()
      });
    }

    return result;
  }
}
```

---

## 最佳实践

### 设计原则

```javascript
// 好的实践：多层限流
const rateLimitConfig = {
  // 全局保护层
  global: {
    maxRequests: 10000,
    windowSize: 1000  // 每秒
  },

  // IP 层限流
  ip: {
    maxRequests: 100,
    windowSize: 60000  // 每分钟
  },

  // 用户层限流（根据等级）
  user: {
    free: { maxRequests: 100, windowSize: 3600000 },
    paid: { maxRequests: 1000, windowSize: 3600000 }
  },

  // API 层限流
  api: {
    'POST:/upload': { maxRequests: 10, windowSize: 60000 },
    'GET:/search': { maxRequests: 30, windowSize: 60000 }
  }
};
```

### 优雅降级

```javascript
class ResilientRateLimiter {
  constructor(primaryLimiter, fallbackLimiter) {
    this.primary = primaryLimiter;
    this.fallback = fallbackLimiter;
    this.circuitBreaker = {
      failures: 0,
      lastFailure: 0,
      threshold: 5,
      timeout: 30000
    };
  }

  async acquire(key, tokens = 1) {
    // 熔断检查
    if (this.isCircuitOpen()) {
      return this.fallback.acquire(key, tokens);
    }

    try {
      const result = await Promise.race([
        this.primary.acquire(key, tokens),
        this.timeout(1000)
      ]);

      this.resetCircuit();
      return result;
    } catch (error) {
      this.recordFailure();
      return this.fallback.acquire(key, tokens);
    }
  }

  isCircuitOpen() {
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      const elapsed = Date.now() - this.circuitBreaker.lastFailure;
      return elapsed < this.circuitBreaker.timeout;
    }
    return false;
  }

  recordFailure() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();
  }

  resetCircuit() {
    this.circuitBreaker.failures = 0;
  }

  timeout(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), ms);
    });
  }
}
```

### 客户端友好

```javascript
// 响应头最佳实践
function setRateLimitHeaders(res, limitInfo) {
  // 标准 RateLimit 响应头（draft-ietf-httpapi-ratelimit-headers）
  res.set({
    'RateLimit-Limit': limitInfo.limit,
    'RateLimit-Remaining': limitInfo.remaining,
    'RateLimit-Reset': Math.ceil(limitInfo.resetTime / 1000),

    // 传统响应头（兼容性）
    'X-RateLimit-Limit': limitInfo.limit,
    'X-RateLimit-Remaining': limitInfo.remaining,
    'X-RateLimit-Reset': limitInfo.resetTime
  });

  // 被限流时添加 Retry-After
  if (limitInfo.remaining <= 0) {
    res.set('Retry-After', limitInfo.retryAfter);
  }
}

// 客户端重试逻辑
async function fetchWithRetry(url, options, maxRetries) {
  options = options || {};
  maxRetries = maxRetries || 3;
  
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 1000;

      console.log('Rate limited, waiting ' + waitTime + 'ms before retry');
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

### 测试策略

```javascript
describe('RateLimiter', () => {
  let limiter;

  beforeEach(() => {
    limiter = new TokenBucketRateLimiter(10, 1);  // 容量10，每秒1个
  });

  test('should allow requests within limit', async () => {
    for (let i = 0; i < 10; i++) {
      const result = await limiter.acquire('test-key');
      expect(result.allowed).toBe(true);
    }
  });

  test('should reject requests exceeding limit', async () => {
    // 消耗所有令牌
    for (let i = 0; i < 10; i++) {
      await limiter.acquire('test-key');
    }

    const result = await limiter.acquire('test-key');
    expect(result.allowed).toBe(false);
  });

  test('should refill tokens over time', async () => {
    // 消耗所有令牌
    for (let i = 0; i < 10; i++) {
      await limiter.acquire('test-key');
    }

    // 等待令牌恢复
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await limiter.acquire('test-key');
    expect(result.allowed).toBe(true);
  });

  test('should handle concurrent requests', async () => {
    const results = await Promise.all(
      Array(20).fill().map(() => limiter.acquire('concurrent-key'))
    );

    const allowed = results.filter(r => r.allowed).length;
    expect(allowed).toBe(10);
  });
});
```

---

## 面试要点

### 常见面试问题

**Q1：请解释限流的作用和常见算法**

> 限流的核心作用是保护系统免受过载，常见算法有：
> - 固定窗口：简单但有临界问题
> - 滑动窗口：解决临界问题，更平滑
> - 漏桶：恒定输出速率，适合保护下游
> - 令牌桶：允许突发，最为灵活

**Q2：令牌桶和漏桶的区别是什么？**

> - 漏桶以恒定速率处理请求，不支持突发
> - 令牌桶允许一定程度的突发流量
> - 漏桶适合需要严格控制输出速率的场景
> - 令牌桶更适合一般的 API 限流

**Q3：如何实现分布式限流？**

> - 使用 Redis 作为共享存储
> - 通过 Lua 脚本保证原子性
> - 考虑 Redis 故障时的降级策略
> - 可以使用本地缓存减少 Redis 请求

**Q4：限流会影响用户体验吗？如何优化？**

> 优化策略：
> - 返回清晰的错误信息和重试时间
> - 设置合理的限流阈值
> - 提供排队等待机制
> - 对 VIP 用户提供更高配额
> - 使用降级策略返回缓存数据

**Q5：如何设计一个多维度限流系统？**

> 1. 定义限流维度：全局、IP、用户、API
> 2. 每个维度独立配置限流策略
> 3. 请求需要通过所有维度的检查
> 4. 记录是哪个维度触发的限流
> 5. 支持动态调整配置

### 设计题思路

```
问题：设计一个支持百万 QPS 的限流系统

解题思路：

1. 架构设计
   ┌─────────┐     ┌─────────────┐     ┌─────────┐
   │  客户端  │ ──> │  网关层限流  │ ──> │  服务层  │
   └─────────┘     └─────────────┘     └─────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Redis集群   │
                   └─────────────┘

2. 关键技术点
   - 多级缓存：本地缓存 + Redis
   - 令牌桶算法：支持突发流量
   - Lua 脚本：保证原子性
   - 熔断降级：Redis 故障时本地限流

3. 性能优化
   - 批量获取令牌减少 Redis 请求
   - 本地预取令牌
   - 异步更新计数

4. 高可用保证
   - Redis 集群部署
   - 本地降级策略
   - 监控告警
```

---

## 总结

限流是保护系统稳定性的重要手段。本文介绍了四种主流限流算法（固定窗口、滑动窗口、漏桶、令牌桶），以及单机和分布式环境下的实现方案。在实际应用中，需要根据业务场景选择合适的算法和限流维度，同时配合监控告警和优雅降级策略，构建一个完整的限流体系。

**核心要点：**
1. 理解各种限流算法的原理和适用场景
2. 分布式场景使用 Redis + Lua 保证原子性
3. 多维度限流提供更精细的控制
4. 友好的限流响应提升用户体验
5. 完善的监控告警保障系统稳定
