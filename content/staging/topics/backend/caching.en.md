---
title: Caching Strategies Complete Guide
description: Master caching techniques for high-performance applications
track: backend
section: caching-queues
difficulty: intermediate
tags:
  - Caching
  - Redis
  - Performance
  - CDN
status: imported
origin: old/src/content/docs/backend/caching.en.md
divergence: 0.322
issues: []
legacy:
  category: Backend
  subcategory: Performance
  order: 17
  lastUpdated: 2026-01-07
---

## Why Caching Matters

Caching is one of the most effective techniques for improving application performance and scalability. At its core, caching stores frequently accessed data in a faster storage layer, reducing the need to fetch data from slower sources like databases or external APIs.

### The Performance Impact

Consider a typical web application without caching:

1. User requests data
2. Application queries database (10-100ms)
3. Database processes query and returns results
4. Application formats and returns response

With caching:

1. User requests data
2. Application checks cache (0.1-1ms)
3. If cached, returns immediately
4. If not cached, queries database and stores result

The difference can be dramatic. A database query might take 50ms, while a cache lookup takes 0.5ms - a **100x improvement**. When multiplied across millions of requests, caching can transform application performance.

### Key Benefits of Caching

- **Reduced Latency**: Serve data from memory instead of disk or network
- **Lower Database Load**: Fewer queries mean databases can handle more concurrent users
- **Cost Reduction**: Less database infrastructure required for the same traffic
- **Improved Availability**: Cache can serve stale data during backend outages
- **Better User Experience**: Faster response times lead to higher engagement

### When to Use Caching

Caching is most effective when:

- Data is read frequently but written infrequently
- Computing or fetching data is expensive
- Data can tolerate some staleness
- The same data is accessed by multiple users

---

## Caching Strategies

Choosing the right caching strategy depends on your application's requirements for consistency, performance, and complexity.

### Cache-Aside (Lazy Loading)

The most common pattern where the application manages the cache directly.

```javascript
async function getUser(userId) {
  const cacheKey = `user:${userId}`;

  // Try to get from cache first
  let user = await cache.get(cacheKey);

  if (user) {
    return JSON.parse(user);
  }

  // Cache miss - fetch from database
  user = await database.query('SELECT * FROM users WHERE id = ?', [userId]);

  if (user) {
    // Store in cache for future requests
    await cache.setex(cacheKey, 3600, JSON.stringify(user));
  }

  return user;
}
```

**Pros:**
- Only requested data is cached
- Cache failures don't break the application
- Simple to implement

**Cons:**
- Initial requests are slower (cache miss)
- Data can become stale
- Potential for cache stampede

### Read-Through Cache

The cache sits between the application and database. On a cache miss, the cache itself fetches from the database.

```javascript
// Configuration for read-through cache
const cacheConfig = {
  loadFunction: async (key) => {
    const userId = key.replace('user:', '');
    return database.query('SELECT * FROM users WHERE id = ?', [userId]);
  },
  ttl: 3600
};

// Usage is simpler - cache handles loading
async function getUser(userId) {
  return cache.get(`user:${userId}`);
}
```

**Pros:**
- Simplifies application code
- Consistent data loading logic
- Cache library handles loading

**Cons:**
- Cache library must support this pattern
- Less flexibility in loading logic

### Write-Through Cache

Data is written to cache and database simultaneously. The cache entry is always up-to-date.

```javascript
async function updateUser(userId, userData) {
  const cacheKey = `user:${userId}`;

  // Write to both cache and database
  await Promise.all([
    cache.setex(cacheKey, 3600, JSON.stringify(userData)),
    database.query('UPDATE users SET ? WHERE id = ?', [userData, userId])
  ]);

  return userData;
}
```

**Pros:**
- Cache is always consistent with database
- No stale data issues
- Read operations are always fast

**Cons:**
- Higher write latency
- Cache may store data that's never read
- More complex failure handling

### Write-Behind (Write-Back) Cache

Writes go to cache immediately, then asynchronously to the database.

```javascript
async function updateUser(userId, userData) {
  const cacheKey = `user:${userId}`;

  // Write to cache immediately
  await cache.setex(cacheKey, 3600, JSON.stringify(userData));

  // Queue database write for async processing
  await messageQueue.publish('db-writes', {
    operation: 'UPDATE',
    table: 'users',
    data: userData,
    id: userId
  });

  return userData;
}

// Background worker processes writes
async function processDbWrites() {
  const message = await messageQueue.consume('db-writes');
  await database.query('UPDATE users SET ? WHERE id = ?',
    [message.data, message.id]);
}
```

**Pros:**
- Lowest write latency
- Batching opportunities
- Resilient to database slowdowns

**Cons:**
- Risk of data loss if cache fails
- Complex consistency guarantees
- Harder to debug

### Refresh-Ahead Cache

Proactively refreshes cache entries before they expire.

```javascript
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  const entry = await cache.getWithMetadata(cacheKey);

  if (entry) {
    const timeToExpiry = entry.ttl;
    const refreshThreshold = 300; // 5 minutes

    // If close to expiry, refresh in background
    if (timeToExpiry < refreshThreshold) {
      refreshInBackground(userId, cacheKey);
    }

    return JSON.parse(entry.value);
  }

  return fetchAndCacheUser(userId, cacheKey);
}

async function refreshInBackground(userId, cacheKey) {
  // Don't await - fire and forget
  database.query('SELECT * FROM users WHERE id = ?', [userId])
    .then(user => cache.setex(cacheKey, 3600, JSON.stringify(user)))
    .catch(err => console.error('Background refresh failed:', err));
}
```

**Pros:**
- Eliminates cache miss latency for hot data
- Smoother performance under load
- Better user experience

**Cons:**
- More complex implementation
- May refresh data that won't be accessed
- Higher resource usage

---

## Cache Invalidation

Cache invalidation is famously one of the two hard problems in computer science. The challenge is keeping cached data consistent with the source of truth.

### Time-Based Expiration (TTL)

The simplest approach - data expires after a fixed time.

```javascript
// Set with 1 hour TTL
await cache.setex('user:123', 3600, userData);

// Variable TTL based on data type
const ttlConfig = {
  userProfile: 3600,      // 1 hour
  productCatalog: 86400,  // 24 hours
  stockPrice: 60,         // 1 minute
  staticContent: 604800   // 1 week
};
```

**Best Practices:**
- Use shorter TTLs for frequently changing data
- Add randomization to prevent thundering herd
- Consider business requirements for staleness

### Event-Based Invalidation

Invalidate cache when data changes.

```javascript
// When user is updated
async function updateUser(userId, userData) {
  await database.query('UPDATE users SET ? WHERE id = ?', [userData, userId]);

  // Invalidate related caches
  await Promise.all([
    cache.del(`user:${userId}`),
    cache.del(`user-profile:${userId}`),
    cache.del(`user-permissions:${userId}`)
  ]);
}

// Using pub/sub for distributed invalidation
async function handleUserUpdate(userId) {
  await pubsub.publish('cache-invalidation', {
    pattern: `user:${userId}:*`,
    timestamp: Date.now()
  });
}

// All cache nodes subscribe
pubsub.subscribe('cache-invalidation', async (message) => {
  await cache.deletePattern(message.pattern);
});
```

### Version-Based Invalidation

Embed version in cache keys to invalidate by changing version.

```javascript
let schemaVersion = 'v2';

function getCacheKey(entity, id) {
  return `${schemaVersion}:${entity}:${id}`;
}

// Changing schemaVersion effectively invalidates all caches
// Old entries expire naturally via TTL
```

### Cache Tags

Group related cache entries for bulk invalidation.

```javascript
// Store with tags
await cache.set('product:123', productData, {
  tags: ['products', 'category:electronics', 'brand:apple']
});

// Invalidate all products in a category
await cache.invalidateByTag('category:electronics');

// Implementation using sets
async function setWithTags(key, value, tags) {
  const pipeline = cache.pipeline();
  pipeline.set(key, value);

  for (const tag of tags) {
    pipeline.sadd(`tag:${tag}`, key);
  }

  await pipeline.exec();
}

async function invalidateByTag(tag) {
  const keys = await cache.smembers(`tag:${tag}`);
  if (keys.length > 0) {
    await cache.del(...keys);
    await cache.del(`tag:${tag}`);
  }
}
```

---

## Local vs Distributed Cache

Understanding when to use local or distributed caching is crucial for system design.

### Local Cache

Data stored in application memory (e.g., in-process HashMap, Guava Cache, Caffeine).

```javascript
// Simple in-memory cache with Map
const localCache = new Map();

function getFromLocalCache(key) {
  const entry = localCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    localCache.delete(key);
    return null;
  }

  return entry.value;
}

function setInLocalCache(key, value, ttlSeconds) {
  localCache.set(key, {
    value,
    expiresAt: Date.now() + (ttlSeconds * 1000)
  });
}
```

**Pros:**
- Extremely fast (no network latency)
- No external dependencies
- Simple to implement

**Cons:**
- Limited by application memory
- Inconsistent across instances
- Lost on application restart

### Distributed Cache

Shared cache accessible by all application instances (e.g., Redis, Memcached).

```javascript
const Redis = require('ioredis');
const redis = new Redis({
  host: 'redis-cluster.example.com',
  port: 6379,
  password: process.env.REDIS_PASSWORD
});

async function getFromDistributedCache(key) {
  return redis.get(key);
}

async function setInDistributedCache(key, value, ttlSeconds) {
  return redis.setex(key, ttlSeconds, value);
}
```

**Pros:**
- Shared across all instances
- Survives application restarts
- Can scale independently

**Cons:**
- Network latency overhead
- Additional infrastructure
- Potential single point of failure

### Multi-Level Caching

Combine both for optimal performance.

```javascript
class MultiLevelCache {
  constructor(localCache, distributedCache) {
    this.local = localCache;
    this.distributed = distributedCache;
  }

  async get(key) {
    // Try local first
    let value = this.local.get(key);
    if (value) {
      return value;
    }

    // Try distributed
    value = await this.distributed.get(key);
    if (value) {
      // Populate local cache
      this.local.set(key, value, 60); // Shorter TTL for local
      return JSON.parse(value);
    }

    return null;
  }

  async set(key, value, ttlSeconds) {
    // Write to both
    this.local.set(key, value, Math.min(ttlSeconds, 300));
    await this.distributed.setex(key, ttlSeconds, value);
  }

  async invalidate(key) {
    this.local.delete(key);
    await this.distributed.del(key);

    // Notify other instances
    await this.distributed.publish('cache-invalidation', key);
  }
}
```

---

## Redis Caching

Redis is the most popular distributed caching solution, offering rich data structures and features.

### Basic Caching Operations

```javascript
const Redis = require('ioredis');
const redis = new Redis();

// String caching
await redis.set('session:abc123', JSON.stringify(sessionData));
await redis.expire('session:abc123', 3600);

// Or combined
await redis.setex('session:abc123', 3600, JSON.stringify(sessionData));

// Get with default
const session = await redis.get('session:abc123');
const data = session ? JSON.parse(session) : null;
```

### Hash for Object Caching

```javascript
// Store user object as hash
await redis.hset('user:1001', {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin'
});
await redis.expire('user:1001', 3600);

// Get specific fields
const email = await redis.hget('user:1001', 'email');

// Get all fields
const user = await redis.hgetall('user:1001');

// Update single field
await redis.hset('user:1001', 'lastLogin', Date.now());
```

### List for Recent Items

```javascript
// Cache recent orders (keep last 100)
async function cacheRecentOrder(userId, order) {
  const key = `recent-orders:${userId}`;
  await redis.lpush(key, JSON.stringify(order));
  await redis.ltrim(key, 0, 99);
  await redis.expire(key, 86400);
}

// Get recent orders
async function getRecentOrders(userId, limit = 10) {
  const key = `recent-orders:${userId}`;
  const orders = await redis.lrange(key, 0, limit - 1);
  return orders.map(JSON.parse);
}
```

### Sorted Set for Leaderboards

```javascript
// Update player score
async function updateScore(playerId, score) {
  await redis.zadd('leaderboard', score, playerId);
}

// Get top players
async function getTopPlayers(count = 10) {
  return redis.zrevrange('leaderboard', 0, count - 1, 'WITHSCORES');
}

// Get player rank
async function getPlayerRank(playerId) {
  const rank = await redis.zrevrank('leaderboard', playerId);
  return rank !== null ? rank + 1 : null;
}
```

### Pipeline for Batch Operations

```javascript
// Batch get multiple keys efficiently
async function getMultipleUsers(userIds) {
  const pipeline = redis.pipeline();

  for (const id of userIds) {
    pipeline.get(`user:${id}`);
  }

  const results = await pipeline.exec();
  return results.map(([err, data]) => data ? JSON.parse(data) : null);
}
```

### Lua Scripts for Atomic Operations

```javascript
// Rate limiting with Lua
const rateLimitScript = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])

  local current = tonumber(redis.call('GET', key) or '0')

  if current >= limit then
    return 0
  end

  current = redis.call('INCR', key)
  if current == 1 then
    redis.call('EXPIRE', key, window)
  end

  return 1
`;

async function checkRateLimit(userId, limit = 100, windowSeconds = 60) {
  const result = await redis.eval(
    rateLimitScript,
    1,
    `ratelimit:${userId}`,
    limit,
    windowSeconds
  );
  return result === 1;
}
```

---

## Cache Penetration, Breakdown, and Avalanche

These are the three classic caching problems that can bring down systems.

### Cache Penetration

**Problem:** Requests for non-existent data bypass cache and hit database repeatedly.

```javascript
// Attacker requests: /api/user/-1, /api/user/-2, /api/user/-3...
// These IDs don't exist, so every request hits the database
```

**Solution 1: Cache Null Values**

```javascript
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  const cached = await cache.get(cacheKey);

  if (cached !== null) {
    if (cached === 'NULL') return null;
    return JSON.parse(cached);
  }

  const user = await database.query('SELECT * FROM users WHERE id = ?', [userId]);

  if (user) {
    await cache.setex(cacheKey, 3600, JSON.stringify(user));
  } else {
    // Cache the null result with shorter TTL
    await cache.setex(cacheKey, 300, 'NULL');
  }

  return user;
}
```

**Solution 2: Bloom Filter**

```javascript
const BloomFilter = require('bloom-filter');

// Initialize with existing IDs
const userIdFilter = new BloomFilter(1000000, 0.01);
existingUserIds.forEach(id => userIdFilter.add(id.toString()));

async function getUser(userId) {
  // Check bloom filter first
  if (!userIdFilter.test(userId.toString())) {
    return null; // Definitely doesn't exist
  }

  // Might exist - check cache and database
  return fetchUser(userId);
}
```

### Cache Breakdown

**Problem:** A hot key expires, causing a thundering herd of requests to database.

```javascript
// Popular product cache expires
// 1000 concurrent requests hit database simultaneously
```

**Solution 1: Mutex Lock**

```javascript
async function getHotProduct(productId) {
  const cacheKey = `product:${productId}`;
  let product = await cache.get(cacheKey);

  if (product) {
    return JSON.parse(product);
  }

  const lockKey = `lock:${cacheKey}`;
  const lockAcquired = await cache.set(lockKey, '1', 'NX', 'EX', 10);

  if (lockAcquired) {
    try {
      // Double-check cache
      product = await cache.get(cacheKey);
      if (product) return JSON.parse(product);

      product = await database.query('SELECT * FROM products WHERE id = ?', [productId]);
      await cache.setex(cacheKey, 3600, JSON.stringify(product));
      return product;
    } finally {
      await cache.del(lockKey);
    }
  } else {
    // Wait and retry
    await sleep(50);
    return getHotProduct(productId);
  }
}
```

**Solution 2: Logical Expiration**

```javascript
async function getHotProductWithLogicalExpiry(productId) {
  const cacheKey = `product:${productId}`;
  const cached = await cache.get(cacheKey);

  if (!cached) {
    return refreshProduct(productId, cacheKey);
  }

  const { data, logicalExpiry } = JSON.parse(cached);

  if (Date.now() > logicalExpiry) {
    // Expired - refresh in background
    refreshProductInBackground(productId, cacheKey);
  }

  return data;
}

async function refreshProductInBackground(productId, cacheKey) {
  // Use lock to prevent multiple refreshes
  const lockKey = `refresh-lock:${cacheKey}`;
  const acquired = await cache.set(lockKey, '1', 'NX', 'EX', 60);

  if (acquired) {
    const product = await database.query('SELECT * FROM products WHERE id = ?', [productId]);
    await cache.set(cacheKey, JSON.stringify({
      data: product,
      logicalExpiry: Date.now() + 3600000
    }));
  }
}
```

### Cache Avalanche

**Problem:** Many cache entries expire simultaneously, or cache server fails, overwhelming database.

**Solution 1: Staggered Expiration**

```javascript
function setWithJitter(key, value, baseTtlSeconds) {
  // Add random jitter: base TTL +/- 10%
  const jitter = Math.floor(baseTtlSeconds * 0.1 * (Math.random() * 2 - 1));
  const ttl = baseTtlSeconds + jitter;
  return cache.setex(key, ttl, value);
}

// Instead of all products expiring at 3600s
// They expire between 3240s and 3960s
```

**Solution 2: Multi-Level Caching**

```javascript
async function getWithFallback(key, fetchFn) {
  // Level 1: Local cache
  let value = localCache.get(key);
  if (value) return value;

  // Level 2: Distributed cache
  value = await redis.get(key);
  if (value) {
    localCache.set(key, value, 60);
    return JSON.parse(value);
  }

  // Level 3: Database with circuit breaker
  if (circuitBreaker.isOpen()) {
    throw new Error('Service temporarily unavailable');
  }

  try {
    value = await fetchFn();
    await redis.setex(key, 3600, JSON.stringify(value));
    localCache.set(key, value, 60);
    circuitBreaker.recordSuccess();
    return value;
  } catch (err) {
    circuitBreaker.recordFailure();
    throw err;
  }
}
```

**Solution 3: Redis High Availability**

```javascript
// Redis Sentinel configuration
const redis = new Redis({
  sentinels: [
    { host: 'sentinel-1', port: 26379 },
    { host: 'sentinel-2', port: 26379 },
    { host: 'sentinel-3', port: 26379 }
  ],
  name: 'mymaster',
  sentinelPassword: process.env.SENTINEL_PASSWORD,
  password: process.env.REDIS_PASSWORD
});

// Redis Cluster configuration
const cluster = new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  { host: 'redis-3', port: 6379 }
]);
```

---

## HTTP Caching

HTTP caching is crucial for web performance, reducing server load and improving response times.

### Cache-Control Header

```javascript
// Express.js example
app.get('/api/products/:id', async (req, res) => {
  const product = await getProduct(req.params.id);

  // Public cache, valid for 1 hour
  res.set('Cache-Control', 'public, max-age=3600');

  res.json(product);
});

// Private data - only browser can cache
app.get('/api/user/profile', authenticateUser, async (req, res) => {
  const profile = await getUserProfile(req.user.id);

  res.set('Cache-Control', 'private, max-age=300');

  res.json(profile);
});

// No caching for sensitive data
app.get('/api/user/transactions', authenticateUser, async (req, res) => {
  const transactions = await getTransactions(req.user.id);

  res.set('Cache-Control', 'no-store');

  res.json(transactions);
});
```

### ETag and Conditional Requests

```javascript
const crypto = require('crypto');

app.get('/api/products/:id', async (req, res) => {
  const product = await getProduct(req.params.id);

  // Generate ETag from content
  const etag = crypto
    .createHash('md5')
    .update(JSON.stringify(product))
    .digest('hex');

  // Check if client has current version
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  res.set('ETag', etag);
  res.set('Cache-Control', 'public, max-age=0, must-revalidate');
  res.json(product);
});
```

### Last-Modified Header

```javascript
app.get('/api/articles/:id', async (req, res) => {
  const article = await getArticle(req.params.id);
  const lastModified = new Date(article.updatedAt);

  // Check if content has been modified
  const ifModifiedSince = req.headers['if-modified-since'];
  if (ifModifiedSince) {
    const clientDate = new Date(ifModifiedSince);
    if (lastModified <= clientDate) {
      return res.status(304).end();
    }
  }

  res.set('Last-Modified', lastModified.toUTCString());
  res.set('Cache-Control', 'public, max-age=300');
  res.json(article);
});
```

### Stale-While-Revalidate

```javascript
// Allow serving stale content while fetching fresh
app.get('/api/news', async (req, res) => {
  const news = await getNews();

  // Cache for 60s, but serve stale for up to 24h while revalidating
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=86400');

  res.json(news);
});
```

---

## CDN Caching

Content Delivery Networks cache content at edge locations worldwide, reducing latency for global users.

### CDN Integration

```javascript
// Configure CDN-friendly cache headers
app.get('/static/:file', (req, res) => {
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.set('CDN-Cache-Control', 'max-age=31536000');
  res.sendFile(req.params.file);
});

// Vary header for content negotiation
app.get('/api/data', (req, res) => {
  res.set('Vary', 'Accept-Encoding, Accept-Language');
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(data);
});
```

### Cache Key Customization

```javascript
// Cloudflare Workers example
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // Create custom cache key (ignore certain query params)
  const cacheKey = new Request(
    `${url.origin}${url.pathname}?version=${url.searchParams.get('v')}`,
    request
  );

  const cache = caches.default;
  let response = await cache.match(cacheKey);

  if (!response) {
    response = await fetch(request);

    // Clone and cache
    const responseToCache = response.clone();
    event.waitUntil(cache.put(cacheKey, responseToCache));
  }

  return response;
}
```

### CDN Cache Invalidation

```javascript
// Cloudflare API example
async function purgeCache(urls) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: urls
      })
    }
  );

  return response.json();
}

// Purge by tag
async function purgeCacheByTag(tags) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tags: tags
      })
    }
  );

  return response.json();
}
```

### Edge Caching Best Practices

```javascript
// Surrogate-Key for cache tagging (Fastly, Varnish)
app.get('/api/products/:id', async (req, res) => {
  const product = await getProduct(req.params.id);

  res.set('Surrogate-Key', `product-${product.id} category-${product.categoryId}`);
  res.set('Surrogate-Control', 'max-age=86400');
  res.set('Cache-Control', 'max-age=0'); // Browser doesn't cache

  res.json(product);
});

// Invalidate by tag at edge
async function invalidateProductCategory(categoryId) {
  await fastly.purgeKey(`category-${categoryId}`);
}
```

---

## Interview Key Points

### Common Interview Questions

**1. What is cache invalidation and why is it difficult?**

Cache invalidation ensures cached data stays consistent with the source. It is difficult because:
- Distributed systems make coordination complex
- Race conditions between updates and reads
- Trade-off between consistency and performance
- Cascading invalidations in dependent data

**2. Explain the difference between Cache-Aside and Read-Through patterns.**

- Cache-Aside: Application manages cache directly, deciding when to read/write
- Read-Through: Cache automatically loads data on miss via configured loader
- Cache-Aside offers more control; Read-Through simplifies application code

**3. How would you handle cache stampede?**

```javascript
// Solution: Distributed lock with single-flight pattern
async function singleFlight(key, fetchFn) {
  const lockKey = `lock:${key}`;

  // Try to acquire lock
  const acquired = await cache.set(lockKey, '1', 'NX', 'EX', 30);

  if (!acquired) {
    // Wait for other request to populate cache
    await sleep(100);
    const cached = await cache.get(key);
    if (cached) return JSON.parse(cached);
    return singleFlight(key, fetchFn);
  }

  try {
    const data = await fetchFn();
    await cache.setex(key, 3600, JSON.stringify(data));
    return data;
  } finally {
    await cache.del(lockKey);
  }
}
```

**4. How do you ensure cache consistency with database?**

- Delete cache after database update (not before)
- Use eventual consistency with pub/sub invalidation
- Implement delayed double-delete pattern
- Consider CDC (Change Data Capture) for guaranteed consistency

```javascript
// Double-delete pattern
async function updateWithDoubleDelete(key, updateFn) {
  await cache.del(key);
  await updateFn();
  await cache.del(key);

  // Schedule delayed delete to handle race conditions
  setTimeout(() => cache.del(key), 500);
}
```

**5. When would you choose Redis over Memcached?**

Choose Redis when you need:
- Rich data structures (lists, sets, sorted sets, hashes)
- Persistence and durability
- Pub/sub messaging
- Lua scripting for atomic operations
- Cluster mode for horizontal scaling

Choose Memcached when:
- Simple key-value caching is sufficient
- Multi-threaded performance is critical
- Memory efficiency is paramount

### System Design Considerations

**Capacity Planning:**
```javascript
// Estimate cache size
const avgObjectSize = 1024; // 1KB per object
const numberOfObjects = 1000000;
const replicationFactor = 3;

const totalMemory = avgObjectSize * numberOfObjects * replicationFactor;
// = 3GB for 1M objects with 3x replication
```

**Monitoring Metrics:**
- Hit rate (should be > 90% for effective caching)
- Latency (p50, p95, p99)
- Memory usage and eviction rate
- Connection pool utilization
- Keys distribution across cluster

---

## Further Reading

### Official Documentation

- [Redis Documentation](https://redis.io/documentation)
- [Memcached Wiki](https://github.com/memcached/memcached/wiki)
- [HTTP Caching - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Cloudflare Cache Documentation](https://developers.cloudflare.com/cache/)

### Recommended Books

- "Designing Data-Intensive Applications" by Martin Kleppmann
- "Redis in Action" by Josiah Carlson
- "High Performance Browser Networking" by Ilya Grigorik

### Tools and Libraries

- **Redis Clients**: ioredis (Node.js), redis-py (Python), Jedis (Java)
- **Local Caching**: Caffeine (Java), node-cache (Node.js), cachetools (Python)
- **Monitoring**: Redis Insight, Prometheus + Grafana
- **CDN Providers**: Cloudflare, Fastly, AWS CloudFront, Akamai

### Related Topics

- Database query optimization
- Message queues and event-driven architecture
- Microservices data management
- Distributed systems consistency patterns

---

Caching is a fundamental technique for building scalable, high-performance applications. By understanding the various strategies, trade-offs, and common pitfalls covered in this guide, you will be equipped to design and implement effective caching solutions for your applications. Remember that caching is not a silver bullet - always measure and monitor to ensure your caching strategy delivers the expected benefits.
