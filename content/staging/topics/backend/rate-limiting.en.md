---
title: Rate Limiting Complete Guide
description: Master rate limiting to protect APIs from abuse
track: backend
section: auth
difficulty: intermediate
tags:
  - Rate Limiting
  - Token Bucket
  - Sliding Window
  - API Protection
status: imported
origin: old/src/content/docs/backend/rate-limiting.en.md
divergence: 0.205
issues: []
legacy:
  category: Backend
  subcategory: Security
  order: 24
  lastUpdated: 2026-01-07
---

## Concept Overview

Rate limiting is a technique for controlling the rate at which resources in a system are accessed. By limiting the number of requests within a given time period, it protects backend services from overload, malicious attacks, and resource abuse. In modern distributed systems and API design, rate limiting is a core defensive mechanism for ensuring system stability and availability.

---

## Why Rate Limiting Matters

### System Protection

Without rate limiting mechanisms, systems face multiple threats:

```
                    +-------------------------------------+
                    |      System Without Rate Limiting   |
                    +-------------------------------------+
                                      |
          +---------------------------+---------------------------+
          |                           |                           |
          v                           v                           v
    +-----------+             +-----------+             +-----------+
    |  Malicious |            |   Traffic  |            |  Resource  |
    |   Attacks  |            |   Spikes   |            |   Abuse    |
    |    DDoS    |            | Viral Event|            | Bots/Scrape|
    +-----------+             +-----------+             +-----------+
          |                           |                           |
          +---------------------------+---------------------------+
                                      v
                    +-------------------------------------+
                    |      System Crash / Unavailable     |
                    +-------------------------------------+
```

### Core Value of Rate Limiting

| Scenario | Without Rate Limiting | With Rate Limiting |
|----------|----------------------|-------------------|
| DDoS Attack | Service paralysis | Attack traffic blocked |
| Traffic Spikes | System overload crash | Smooth handling, queuing |
| Resource Abuse | Normal users affected | Fair resource allocation |
| Cost Control | Cloud costs skyrocket | Predictable resource consumption |
| API Monetization | Cannot bill | Supports tiered pricing |

### Real-World Examples

**Scenario 1: E-commerce Flash Sale**
```
Normal traffic: 1,000 QPS
Flash sale peak: 100,000 QPS (100x increase)

Without rate limiting: Database connection pool exhausted, service crashes
With rate limiting: Excess requests queued or shown "High demand" message
```

**Scenario 2: API Service Monetization**
```
Free tier: 100 requests/hour
Basic tier: 1,000 requests/hour
Pro tier: 10,000 requests/hour
Enterprise: Unlimited (dedicated channel)
```

---

## Rate Limiting Algorithms Compared

### Fixed Window Algorithm

The fixed window is the simplest rate limiting algorithm. It divides time into fixed-size windows and counts requests within each window.

```
Timeline:
|-------- Window 1 --------|-------- Window 2 --------|-------- Window 3 --------|
0s                        60s                       120s                       180s
     Requests: 98              Requests: 45              Requests: 100
     Limit: 100                Limit: 100                Limit: 100
     Status: Pass              Status: Pass              Status: Pass
```

**JavaScript Implementation:**

```javascript
class FixedWindowRateLimiter {
  constructor(windowSize, maxRequests) {
    this.windowSize = windowSize;  // Window size (milliseconds)
    this.maxRequests = maxRequests;
    this.windows = new Map();  // key -> { count, windowStart }
  }

  isAllowed(key) {
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowSize) * this.windowSize;

    let record = this.windows.get(key);

    // New window or expired window, reset counter
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

  // Get remaining quota
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

// Usage example
const limiter = new FixedWindowRateLimiter(60000, 100);  // 100 per minute

function handleRequest(userId) {
  if (limiter.isAllowed(userId)) {
    console.log('Request allowed');
    return processRequest();
  } else {
    console.log('Request rate limited');
    return { error: 'Rate limit exceeded', retryAfter: 60 };
  }
}
```

**Advantages:**
- Simple implementation, low memory usage
- High computational efficiency

**Disadvantages:**
- Boundary problem (burst at window edges)

```
Boundary problem example:
Last second of Window 1: 100 requests
First second of Window 2: 100 requests
Actual 2-second period: 200 requests (exceeds expected limit)

|-------- Window 1 --------|-------- Window 2 --------|
                       [100][100]
                          ^
                    Boundary burst
```

### Sliding Window Algorithm

The sliding window algorithm solves the fixed window's boundary problem by dividing the window into multiple smaller buckets.

```
Sliding window diagram:
Time ->
|--Bucket 1--|--Bucket 2--|--Bucket 3--|--Bucket 4--|--Bucket 5--|--Bucket 6--|
     10          25          30          15          20          ?
     +----------------------------------------------+
                    Current counting window (100 requests total)
                                                +----------------------+
                                                    Next moment's window
```

**JavaScript Implementation:**

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

    // Calculate total requests in current window
    const totalRequests = buckets.reduce((sum, b) => sum + b.count, 0);

    if (totalRequests < this.maxRequests) {
      // Add to current bucket
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

    // Remove expired buckets
    const validBuckets = buckets.filter(b => b.index > oldestValidIndex);
    this.buckets.set(key, validBuckets);
  }
}
```

**Optimized Sliding Window Counter (Weighted Calculation):**

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

    // If entering new window, slide the data
    if (record.currWindow < currentWindow) {
      record.prevCount = record.currWindow === currentWindow - 1 ? record.currCount : 0;
      record.currCount = 0;
      record.currWindow = currentWindow;
    }

    // Weighted calculation: previous window's remaining weight + current window count
    const estimatedCount = record.prevCount * (1 - windowProgress) + record.currCount;

    if (estimatedCount < this.maxRequests) {
      record.currCount++;
      return true;
    }

    return false;
  }
}
```

**Advantages:**
- Solves boundary burst problem
- Smoother rate limiting

**Disadvantages:**
- Higher memory usage
- More complex implementation

### Leaky Bucket Algorithm

The leaky bucket algorithm treats requests like water drops, flowing out (processing requests) at a constant rate. Requests exceeding bucket capacity are discarded.

```
Leaky bucket model:
         +------------------+
         |   Request Inflow  |  <- Irregular inflow
         +---------+---------+
                   v
         +------------------+
         |                  |
         |   ############   |  <- Bucket (buffer)
         |   ############   |
         |   ############   |
         +---------+---------+
                   |
                   v Constant rate outflow
         +------------------+
         |  Process Request  |
         +------------------+
```

**JavaScript Implementation:**

```javascript
class LeakyBucketRateLimiter {
  constructor(capacity, leakRate) {
    this.capacity = capacity;      // Bucket capacity
    this.leakRate = leakRate;      // Leak rate (requests/second)
    this.buckets = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { water: 0, lastLeakTime: now };
      this.buckets.set(key, bucket);
    }

    // Calculate water leaked
    const elapsed = (now - bucket.lastLeakTime) / 1000;
    const leaked = elapsed * this.leakRate;
    bucket.water = Math.max(0, bucket.water - leaked);
    bucket.lastLeakTime = now;

    // Try to add new request
    if (bucket.water < this.capacity) {
      bucket.water += 1;
      return true;
    }

    return false;
  }

  // Get wait time
  getWaitTime(key) {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.water < this.capacity) {
      return 0;
    }

    // Need to wait until bucket has space
    const overflow = bucket.water - this.capacity + 1;
    return (overflow / this.leakRate) * 1000;  // milliseconds
  }
}

// Leaky bucket with queue implementation
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
    // Request processing logic
    return { success: true, data: request };
  }
}
```

**Advantages:**
- Constant output rate protects downstream services
- Can buffer burst traffic

**Disadvantages:**
- Cannot handle legitimate burst traffic
- May increase request latency

### Token Bucket Algorithm

The token bucket is the most flexible rate limiting algorithm. It generates tokens at a constant rate, and requests need to acquire tokens to be processed. It supports a certain degree of burst traffic.

```
Token bucket model:
         +------------------+
         |  Token Generator  |  <- Constant rate generation
         +---------+---------+
                   v
         +------------------+
         |  o o o o o o o   |
         |  o o o o o o o   |  <- Token bucket (has upper limit)
         |  o o o o o o o   |
         +---------+---------+
                   |
         +---------+---------+
         |                   |
    Token acquired       Token failed
         |                   |
         v                   v
    Process request     Reject request
```

**JavaScript Implementation:**

```javascript
class TokenBucketRateLimiter {
  constructor(capacity, refillRate) {
    this.capacity = capacity;          // Bucket capacity (max tokens)
    this.refillRate = refillRate;      // Token generation rate (tokens/second)
    this.buckets = new Map();
  }

  isAllowed(key, tokens = 1) {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: this.capacity,  // Initially full bucket
        lastRefillTime: now
      };
      this.buckets.set(key, bucket);
    }

    // Calculate new tokens
    const elapsed = (now - bucket.lastRefillTime) / 1000;
    const newTokens = elapsed * this.refillRate;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + newTokens);
    bucket.lastRefillTime = now;

    // Try to acquire tokens
    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return true;
    }

    return false;
  }

  // Get currently available tokens
  getAvailableTokens(key) {
    const bucket = this.buckets.get(key);
    if (!bucket) return this.capacity;

    const now = Date.now();
    const elapsed = (now - bucket.lastRefillTime) / 1000;
    const newTokens = elapsed * this.refillRate;

    return Math.min(this.capacity, bucket.tokens + newTokens);
  }

  // Get next available time
  getNextAvailableTime(key, tokens = 1) {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.tokens >= tokens) return 0;

    const needed = tokens - bucket.tokens;
    return (needed / this.refillRate) * 1000;
  }
}

// Token bucket with warm-up support
class WarmUpTokenBucket {
  constructor(capacity, refillRate, warmUpPeriod) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.warmUpPeriod = warmUpPeriod;  // Warm-up time (seconds)
    this.buckets = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: 0,  // Cold start, begin from 0
        lastRefillTime: now,
        startTime: now
      };
      this.buckets.set(key, bucket);
    }

    // During warm-up phase, rate gradually increases
    const elapsed = (now - bucket.startTime) / 1000;
    const warmUpFactor = Math.min(1, elapsed / this.warmUpPeriod);
    const currentRate = this.refillRate * warmUpFactor;

    // Calculate new tokens
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

**Advantages:**
- Allows a certain degree of burst traffic
- Controllable average rate
- High flexibility

**Disadvantages:**
- More complex implementation
- Requires precise time calculations

### Algorithm Comparison Summary

| Algorithm | Burst Traffic | Smoothness | Complexity | Memory | Use Case |
|-----------|---------------|------------|------------|--------|----------|
| Fixed Window | Has boundary issues | Low | Simple | Low | Simple scenarios |
| Sliding Window | Good | High | Medium | Medium | API rate limiting |
| Leaky Bucket | Not supported | Highest | Medium | Low | Protecting downstream |
| Token Bucket | Supported | High | Higher | Low | General purpose |

---

## Single-Node Rate Limiting Implementation

### Memory-Based Rate Limiter

```javascript
// Complete single-node rate limiter implementation
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

    // Record metrics
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

### Express Middleware Implementation

```javascript
const express = require('express');
const app = express();

// Create rate limiter instance
const rateLimiter = new SingleNodeRateLimiter({
  algorithm: 'token-bucket',
  capacity: 100,
  refillRate: 10
});

// Rate limiting middleware
function rateLimitMiddleware(options = {}) {
  const { keyGenerator, cost = 1, skipFailedRequests = false } = options;

  return async (req, res, next) => {
    // Generate rate limit key
    const key = keyGenerator ? keyGenerator(req) : getDefaultKey(req);

    try {
      const result = await rateLimiter.acquire(key, cost);

      // Set response headers
      res.set({
        'X-RateLimit-Limit': rateLimiter.capacity,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': result.resetTime
      });

      if (!result.allowed) {
        res.set('Retry-After', result.retryAfter);
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.retryAfter
        });
      }

      // If configured to skip failed requests, check on response finish
      if (skipFailedRequests) {
        res.on('finish', () => {
          if (res.statusCode >= 400) {
            // Logic to refund tokens
          }
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      next();  // Allow through on rate limiter failure
    }
  };
}

// Default key generator (IP-based)
function getDefaultKey(req) {
  return req.ip ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.connection.remoteAddress;
}

// Apply rate limiting
app.use('/api/', rateLimitMiddleware({
  keyGenerator: (req) => 'api:' + getDefaultKey(req)
}));

// Stricter rate limiting for specific routes
app.use('/api/login', rateLimitMiddleware({
  keyGenerator: (req) => 'login:' + getDefaultKey(req),
  cost: 5  // Login requests consume more quota
}));
```

---

## Distributed Rate Limiting (Redis)

In distributed systems, shared storage is needed for cross-node rate limiting. Redis is the most common choice.

### Redis Sliding Window Implementation

```javascript
const Redis = require('ioredis');
const redis = new Redis();

class RedisRateLimiter {
  constructor(options = {}) {
    this.redis = options.redis || redis;
    this.prefix = options.prefix || 'ratelimit:';
    this.windowSize = options.windowSize || 60000;  // milliseconds
    this.maxRequests = options.maxRequests || 100;
  }

  async isAllowed(key) {
    const fullKey = this.prefix + key;
    const now = Date.now();
    const windowStart = now - this.windowSize;

    // Use Lua script to ensure atomicity
    const luaScript = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local windowStart = tonumber(ARGV[2])
      local maxRequests = tonumber(ARGV[3])
      local windowSize = tonumber(ARGV[4])

      -- Remove expired request records
      redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

      -- Get current request count in window
      local currentCount = redis.call('ZCARD', key)

      if currentCount < maxRequests then
        -- Add new request
        redis.call('ZADD', key, now, now .. ':' .. math.random())
        -- Set expiration time
        redis.call('PEXPIRE', key, windowSize)
        return {1, maxRequests - currentCount - 1}
      else
        return {0, 0}
      end
    `;

    // Execute Lua script using Redis EVALSHA or EVAL
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

### Redis Token Bucket Implementation

```javascript
class RedisTokenBucket {
  constructor(options = {}) {
    this.redis = options.redis || redis;
    this.prefix = options.prefix || 'tokenbucket:';
    this.capacity = options.capacity || 100;
    this.refillRate = options.refillRate || 10;  // tokens/second
  }

  async acquire(key, tokens = 1) {
    const fullKey = this.prefix + key;

    const luaScript = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local requested = tonumber(ARGV[4])

      -- Get current state
      local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(data[1])
      local lastRefill = tonumber(data[2])

      -- Initialize
      if tokens == nil then
        tokens = capacity
        lastRefill = now
      end

      -- Calculate new tokens
      local elapsed = (now - lastRefill) / 1000
      local newTokens = elapsed * refillRate
      tokens = math.min(capacity, tokens + newTokens)

      local allowed = 0
      local remaining = tokens

      -- Try to acquire tokens
      if tokens >= requested then
        tokens = tokens - requested
        allowed = 1
        remaining = tokens
      end

      -- Update state
      redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
      redis.call('EXPIRE', key, 3600)  -- 1 hour expiration

      -- Calculate next available time
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

### Redis Cluster Distributed Rate Limiting

```javascript
class ClusterRateLimiter {
  constructor(options = {}) {
    this.redis = new Redis.Cluster(options.nodes, {
      redisOptions: options.redisOptions
    });
    this.limiter = new RedisTokenBucket({ redis: this.redis, ...options });

    // Local cache to reduce Redis requests
    this.localCache = new Map();
    this.localCacheTTL = options.localCacheTTL || 100;  // milliseconds
  }

  async acquire(key, tokens = 1) {
    // Check local cache
    const cached = this.localCache.get(key);
    if (cached && Date.now() - cached.time < this.localCacheTTL) {
      if (cached.remaining <= 0) {
        return { allowed: false, remaining: 0, waitTime: cached.waitTime };
      }
    }

    try {
      const result = await this.limiter.acquire(key, tokens);

      // Update local cache
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

  // Local fallback when Redis fails
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

## Rate Limiting Dimensions

Based on business requirements, rate limiting can be applied across multiple dimensions:

### IP-Based Rate Limiting

```javascript
function ipKeyGenerator(req) {
  // Consider proxy scenarios
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return 'ip:' + forwarded.split(',')[0].trim();
  }
  return 'ip:' + (req.ip || req.connection.remoteAddress);
}

// Configuration
const ipLimiter = rateLimitMiddleware({
  keyGenerator: ipKeyGenerator,
  maxRequests: 1000,
  windowSize: 60000
});
```

### User-Based Rate Limiting

```javascript
function userKeyGenerator(req) {
  // Get user ID from JWT or Session
  const userId = req.user?.id || req.session?.userId;
  if (userId) {
    return 'user:' + userId;
  }
  // Fall back to IP rate limiting for unauthenticated users
  return ipKeyGenerator(req);
}

// Configure different limits based on user tier
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

### API Endpoint Rate Limiting

```javascript
function apiKeyGenerator(req) {
  const method = req.method;
  const path = req.route?.path || req.path;
  const userId = req.user?.id || 'anonymous';

  return 'api:' + method + ':' + path + ':' + userId;
}

// Configure different limits for different APIs
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

### Multi-Dimensional Combined Rate Limiting

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

    // Reject if any dimension is rate limited
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

## Rate Limiting Response Strategies

### Direct Rejection

```javascript
function rejectStrategy(req, res, limitInfo) {
  res.status(429).json({
    error: 'Too Many Requests',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.',
    retryAfter: limitInfo.retryAfter,
    limit: limitInfo.limit,
    remaining: limitInfo.remaining,
    reset: limitInfo.resetTime
  });
}
```

### Queue and Wait

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

    // Check queue size
    let queue = this.queues.get(key);
    if (!queue) {
      queue = [];
      this.queues.set(key, queue);
    }

    if (queue.length >= this.maxQueueSize) {
      return { allowed: false, queued: false, reason: 'queue_full' };
    }

    // Join queue and wait
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

### Graceful Degradation

```javascript
function degradeStrategy(req, res, limitInfo, cache) {
  // Return cached data or simplified response
  const cachedData = cache.get(req.path);

  if (cachedData) {
    res.set('X-Degraded', 'true');
    res.set('X-Cache', 'HIT');
    return res.json({
      ...cachedData,
      _degraded: true,
      _message: 'Cached data. Full functionality will resume shortly.'
    });
  }

  // Return minimal response when no cache available
  res.status(200).json({
    _degraded: true,
    _message: 'Service busy. Limited functionality.',
    retryAfter: limitInfo.retryAfter
  });
}
```

### Penalty Strategy

```javascript
class PenaltyRateLimiter {
  constructor(options) {
    this.baseLimiter = new RedisRateLimiter(options);
    this.redis = options.redis;
    this.penaltyMultiplier = options.penaltyMultiplier || 2;
    this.penaltyDuration = options.penaltyDuration || 300000;
  }

  async acquire(key) {
    // Check if in penalty period
    const penaltyKey = 'penalty:' + key;
    const penaltyLevel = await this.redis.get(penaltyKey);

    const effectiveLimit = penaltyLevel
      ? Math.floor(this.baseLimiter.maxRequests / Math.pow(this.penaltyMultiplier, penaltyLevel))
      : this.baseLimiter.maxRequests;

    const result = await this.baseLimiter.isAllowed(key);

    if (!result.allowed) {
      // Triggered rate limit, increase penalty level
      const newLevel = (parseInt(penaltyLevel) || 0) + 1;
      await this.redis.setex(penaltyKey, this.penaltyDuration / 1000, newLevel);
    }

    return result;
  }
}
```

---

## Framework Integration

### Express Integration

```javascript
const express = require('express');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const app = express();
const redis = new Redis();

// Basic rate limiting configuration
const basicLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,             // 100 requests per IP
  standardHeaders: true, // Return standard RateLimit headers
  legacyHeaders: false,

  // Redis storage
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),

  // Custom key generation
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },

  // Custom error handling
  handler: (req, res, next, options) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many requests. Please try again in ' + Math.ceil(options.windowMs / 1000) + ' seconds.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  },

  // Skip certain requests
  skip: (req) => {
    return req.user?.role === 'admin';
  }
});

// API route rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  })
});

// Strict login endpoint rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.'
});

// Apply middleware
app.use('/api/', apiLimiter);
app.post('/api/login', loginLimiter);
app.use(basicLimiter);
```

### Nginx Rate Limiting Configuration

```nginx
# nginx.conf

# Define rate limiting zones
http {
    # IP-based rate limiting zone (10MB shared memory, 10 requests/second)
    limit_req_zone $binary_remote_addr zone=ip_limit:10m rate=10r/s;

    # Server-level global rate limiting
    limit_req_zone $server_name zone=server_limit:10m rate=1000r/s;

    # API Key-based rate limiting
    map $http_x_api_key $api_key_limit {
        default         "default_zone";
        "premium_key"   "premium_zone";
        "basic_key"     "basic_zone";
    }

    limit_req_zone $api_key_limit zone=default_zone:10m rate=10r/s;
    limit_req_zone $api_key_limit zone=basic_zone:10m rate=100r/s;
    limit_req_zone $api_key_limit zone=premium_zone:10m rate=1000r/s;

    # Connection limit
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    server {
        listen 80;
        server_name api.example.com;

        # Apply rate limiting
        location /api/ {
            # Limit request rate, burst allows bursts, nodelay processes immediately
            limit_req zone=ip_limit burst=20 nodelay;

            # Limit concurrent connections
            limit_conn conn_limit 10;

            # Custom rate limit response status
            limit_req_status 429;

            proxy_pass http://backend;
        }

        # Different rate limiting for different paths
        location /api/upload {
            limit_req zone=ip_limit burst=5 nodelay;
            limit_conn conn_limit 2;

            client_max_body_size 10M;
            proxy_pass http://upload_backend;
        }

        # Strict rate limiting for login endpoint
        location /api/auth/login {
            limit_req zone=ip_limit burst=3;
            limit_req_status 429;

            proxy_pass http://auth_backend;
        }

        # Custom 429 error page
        error_page 429 /429.json;
        location = /429.json {
            internal;
            default_type application/json;
            return 429 '{"error":"Too Many Requests","message":"Rate limit exceeded"}';
        }
    }
}
```

### Nginx Rate Limiting Log Analysis

```nginx
# Rate limiting log format
log_format rate_limit '$remote_addr - $remote_user [$time_local] '
                      '"$request" $status $body_bytes_sent '
                      '"$http_referer" "$http_user_agent" '
                      'limit_req_status=$limit_req_status';

access_log /var/log/nginx/rate_limit.log rate_limit;
```

---

## Monitoring and Alerting

### Rate Limiting Metrics Collection

```javascript
const prometheus = require('prom-client');

// Register metrics
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

// Wrap rate limiter
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

// Prometheus endpoint
const express = require('express');
const app = express();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

### Alert Rule Configuration

```yaml
# prometheus/rules/rate_limit.yml
groups:
  - name: rate_limit_alerts
    rules:
      # High rate limit rejection rate
      - alert: HighRateLimitRejectionRate
        expr: |
          sum(rate(rate_limit_requests_total{result="rejected"}[5m]))
          /
          sum(rate(rate_limit_requests_total[5m])) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High rate limit rejection rate"
          description: "Rate limit rejection rate exceeded 10% over the last 5 minutes"

      # Specific user/IP triggering rate limits
      - alert: UserRateLimited
        expr: |
          increase(rate_limit_requests_total{result="rejected"}[1m]) > 50
        for: 1m
        labels:
          severity: info
        annotations:
          summary: "User frequently triggering rate limits"
          description: "User {{ $labels.key }} was rate limited over 50 times in 1 minute"

      # High rate limit check latency
      - alert: RateLimitLatencyHigh
        expr: |
          histogram_quantile(0.99, rate(rate_limit_latency_seconds_bucket[5m])) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High rate limit check latency"
          description: "P99 latency exceeded 100ms"
```

### Logging

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

## Best Practices

### Design Principles

```javascript
// Good practice: Multi-layer rate limiting
const rateLimitConfig = {
  // Global protection layer
  global: {
    maxRequests: 10000,
    windowSize: 1000  // per second
  },

  // IP layer rate limiting
  ip: {
    maxRequests: 100,
    windowSize: 60000  // per minute
  },

  // User layer rate limiting (by tier)
  user: {
    free: { maxRequests: 100, windowSize: 3600000 },
    paid: { maxRequests: 1000, windowSize: 3600000 }
  },

  // API layer rate limiting
  api: {
    'POST:/upload': { maxRequests: 10, windowSize: 60000 },
    'GET:/search': { maxRequests: 30, windowSize: 60000 }
  }
};
```

### Graceful Degradation

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
    // Circuit breaker check
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

### Client-Friendly Responses

```javascript
// Response header best practices
function setRateLimitHeaders(res, limitInfo) {
  // Standard RateLimit headers (draft-ietf-httpapi-ratelimit-headers)
  res.set({
    'RateLimit-Limit': limitInfo.limit,
    'RateLimit-Remaining': limitInfo.remaining,
    'RateLimit-Reset': Math.ceil(limitInfo.resetTime / 1000),

    // Legacy headers (backwards compatibility)
    'X-RateLimit-Limit': limitInfo.limit,
    'X-RateLimit-Remaining': limitInfo.remaining,
    'X-RateLimit-Reset': limitInfo.resetTime
  });

  // Add Retry-After when rate limited
  if (limitInfo.remaining <= 0) {
    res.set('Retry-After', limitInfo.retryAfter);
  }
}

// Client retry logic
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

### Testing Strategy

```javascript
describe('RateLimiter', () => {
  let limiter;

  beforeEach(() => {
    limiter = new TokenBucketRateLimiter(10, 1);  // Capacity 10, 1 token/second
  });

  test('should allow requests within limit', async () => {
    for (let i = 0; i < 10; i++) {
      const result = await limiter.acquire('test-key');
      expect(result.allowed).toBe(true);
    }
  });

  test('should reject requests exceeding limit', async () => {
    // Consume all tokens
    for (let i = 0; i < 10; i++) {
      await limiter.acquire('test-key');
    }

    const result = await limiter.acquire('test-key');
    expect(result.allowed).toBe(false);
  });

  test('should refill tokens over time', async () => {
    // Consume all tokens
    for (let i = 0; i < 10; i++) {
      await limiter.acquire('test-key');
    }

    // Wait for token refill
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

## Interview Key Points

### Common Interview Questions

**Q1: Explain the purpose and common algorithms for rate limiting**

> Rate limiting's core purpose is to protect systems from overload. Common algorithms include:
> - Fixed Window: Simple but has boundary issues
> - Sliding Window: Solves boundary issues, smoother limiting
> - Leaky Bucket: Constant output rate, good for protecting downstream
> - Token Bucket: Allows bursts, most flexible

**Q2: What is the difference between token bucket and leaky bucket?**

> - Leaky bucket processes requests at a constant rate, doesn't support bursts
> - Token bucket allows a certain degree of burst traffic
> - Leaky bucket is suitable for scenarios requiring strict output rate control
> - Token bucket is more suitable for general API rate limiting

**Q3: How do you implement distributed rate limiting?**

> - Use Redis as shared storage
> - Use Lua scripts to ensure atomicity
> - Consider fallback strategies when Redis fails
> - Use local caching to reduce Redis requests

**Q4: Does rate limiting affect user experience? How can it be optimized?**

> Optimization strategies:
> - Return clear error messages and retry times
> - Set reasonable rate limiting thresholds
> - Provide queuing mechanisms
> - Offer higher quotas for VIP users
> - Use graceful degradation to return cached data

**Q5: How would you design a multi-dimensional rate limiting system?**

> 1. Define rate limiting dimensions: Global, IP, User, API
> 2. Configure rate limiting policies independently for each dimension
> 3. Requests must pass all dimension checks
> 4. Record which dimension triggered the rate limit
> 5. Support dynamic configuration adjustments

### Design Problem Approach

```
Problem: Design a rate limiting system supporting millions of QPS

Solution approach:

1. Architecture Design
   +---------+     +---------------+     +---------+
   | Client  | --> | Gateway Layer | --> | Service |
   +---------+     | Rate Limiting |     |  Layer  |
                   +---------------+     +---------+
                          |
                          v
                   +---------------+
                   | Redis Cluster |
                   +---------------+

2. Key Technical Points
   - Multi-level caching: Local cache + Redis
   - Token bucket algorithm: Supports burst traffic
   - Lua scripts: Ensure atomicity
   - Circuit breaker fallback: Local rate limiting when Redis fails

3. Performance Optimization
   - Batch token acquisition to reduce Redis requests
   - Local token prefetching
   - Asynchronous counter updates

4. High Availability Guarantees
   - Redis cluster deployment
   - Local fallback strategy
   - Monitoring and alerting
```

---

## Summary

Rate limiting is a crucial mechanism for protecting system stability. This article covered four mainstream rate limiting algorithms (Fixed Window, Sliding Window, Leaky Bucket, Token Bucket), as well as implementation approaches for both single-node and distributed environments. In practice, you need to choose the appropriate algorithm and rate limiting dimensions based on your business scenarios, while combining monitoring, alerting, and graceful degradation strategies to build a complete rate limiting system.

**Key Takeaways:**
1. Understand the principles and use cases for each rate limiting algorithm
2. Use Redis + Lua for atomicity in distributed scenarios
3. Multi-dimensional rate limiting provides finer-grained control
4. Friendly rate limiting responses improve user experience
5. Comprehensive monitoring and alerting ensure system stability
