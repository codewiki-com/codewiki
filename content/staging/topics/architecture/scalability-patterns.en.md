---
title: Scalability Patterns
description: Learn architectural patterns for building scalable systems
track: architecture
section: system-design
difficulty: advanced
tags:
  - scalability
  - horizontal scaling
  - vertical scaling
  - distributed
status: imported
origin: old/src/content/docs/architecture/scalability-patterns.en.md
divergence: 0.453
issues:
  - divergent
legacy:
  category: Architecture
  subcategory: Scalability
  order: 21
  lastUpdated: 2026-01-07
---

Scalability is one of the most critical aspects of modern software architecture. It refers to a system's ability to handle increased load by adding resources, whether through more powerful hardware or additional machines. We'll explore scalability patterns, strategies, and practical techniques for building systems that can grow with your business needs.

## What is Scalability?

Scalability is the property of a system to handle a growing amount of work by adding resources to the system. A scalable system maintains or improves its performance and efficiency as the workload increases. There are several dimensions to consider:

- **Load Scalability**: The ability to handle increasing numbers of concurrent users or requests
- **Data Scalability**: The ability to manage growing data volumes efficiently
- **Geographic Scalability**: The ability to maintain performance across distributed locations
- **Administrative Scalability**: The ability to manage the system as it grows in complexity

The goal is not just to handle more load, but to do so in a cost-effective and maintainable way.

## Horizontal vs Vertical Scaling

The two fundamental approaches to scaling are vertical scaling (scaling up) and horizontal scaling (scaling out). Each has distinct characteristics, advantages, and trade-offs.

### Vertical Scaling (Scale Up)

Vertical scaling involves increasing the capacity of a single machine by adding more resources such as CPU, RAM, or storage.

```
Vertical Scaling Illustration:

    Before                          After
┌─────────────┐              ┌─────────────────┐
│   Server    │              │     Server      │
│  4 CPU cores│    -->       │  64 CPU cores   │
│   16GB RAM  │              │   512GB RAM     │
│   500GB SSD │              │   8TB NVMe SSD  │
└─────────────┘              └─────────────────┘
```

**Advantages of Vertical Scaling**:

| Advantage | Description |
|-----------|-------------|
| Simplicity | No application changes required; same deployment model |
| No distributed complexity | Avoids challenges of distributed systems |
| Data consistency | Single machine means no replication lag |
| Licensing | May be cheaper for per-server licensed software |
| Latency | No network overhead between components |

**Disadvantages of Vertical Scaling**:

| Disadvantage | Description |
|--------------|-------------|
| Hardware limits | Physical constraints on how much you can scale |
| Single point of failure | One machine failure affects everything |
| Cost curve | High-end hardware has exponentially higher costs |
| Downtime | Upgrades typically require system downtime |
| Diminishing returns | Performance gains decrease as you approach limits |

**When to Choose Vertical Scaling**:

```python
# Decision framework for vertical scaling
class ScalingDecision:
    @staticmethod
    def prefer_vertical_scaling(context):
        indicators = [
            context.application_is_monolithic,
            context.data_fits_in_single_machine,
            context.team_lacks_distributed_expertise,
            context.budget_for_premium_hardware,
            context.strong_consistency_required,
            context.low_latency_critical,
            context.startup_or_mvp_phase
        ]
        return sum(indicators) >= 4
```

### Horizontal Scaling (Scale Out)

Horizontal scaling involves adding more machines to distribute the workload across multiple nodes.

```
Horizontal Scaling Illustration:

    Before                                After
┌─────────────┐              ┌─────────────────────────────────┐
│   Server    │              │         Load Balancer           │
│  (single)   │    -->       └────────────┬────────────────────┘
└─────────────┘                ┌──────────┼──────────┐
                               v          v          v
                          ┌────────┐ ┌────────┐ ┌────────┐
                          │Server 1│ │Server 2│ │Server 3│
                          └────────┘ └────────┘ └────────┘
```

**Advantages of Horizontal Scaling**:

| Advantage | Description |
|-----------|-------------|
| Unlimited capacity | Theoretically no upper bound on scaling |
| Fault tolerance | System survives individual node failures |
| Cost efficiency | Commodity hardware is more cost-effective |
| Gradual scaling | Add capacity incrementally as needed |
| Geographic distribution | Deploy closer to users worldwide |

**Disadvantages of Horizontal Scaling**:

| Disadvantage | Description |
|--------------|-------------|
| Complexity | Requires handling distributed system challenges |
| Data consistency | Harder to maintain strong consistency |
| Operational overhead | More machines to monitor and manage |
| Network dependency | Inter-node communication adds latency |
| Application changes | May require architectural modifications |

**Scaling Strategy Comparison**:

```
                    Cost vs Capacity

     |                              .------ Horizontal
Cost |                        .----'        (Linear)
     |                  .----'
     |            .----'
     |      .----'        .------------ Vertical
     |  .--'         .---'              (Exponential)
     |.'        .---'
     |     .---'
     |.---'
     +---------------------------------> Capacity
```

### Hybrid Scaling Approach

In practice, most systems use a combination of both approaches:

```javascript
// Hybrid scaling strategy example
class HybridScalingStrategy {
  constructor() {
    this.verticalLimit = {
      cpu: 64,      // cores
      memory: 512,  // GB
      storage: 10   // TB
    };
  }

  determineScalingAction(currentLoad, currentResources) {
    const utilizationThreshold = 0.75;
    const cpuUtilization = currentLoad.cpu / currentResources.cpu;
    const memoryUtilization = currentLoad.memory / currentResources.memory;

    if (cpuUtilization > utilizationThreshold || memoryUtilization > utilizationThreshold) {
      // Check if vertical scaling is still viable
      if (this.canScaleVertically(currentResources)) {
        return {
          type: 'VERTICAL',
          action: this.calculateVerticalUpgrade(currentResources, currentLoad)
        };
      } else {
        return {
          type: 'HORIZONTAL',
          action: this.calculateHorizontalExpansion(currentLoad)
        };
      }
    }

    return { type: 'NONE', action: null };
  }

  canScaleVertically(currentResources) {
    return (
      currentResources.cpu < this.verticalLimit.cpu &&
      currentResources.memory < this.verticalLimit.memory
    );
  }

  calculateVerticalUpgrade(currentResources, currentLoad) {
    return {
      cpu: Math.min(currentResources.cpu * 2, this.verticalLimit.cpu),
      memory: Math.min(currentResources.memory * 2, this.verticalLimit.memory)
    };
  }

  calculateHorizontalExpansion(currentLoad) {
    const currentNodes = currentLoad.nodes || 1;
    const additionalNodes = Math.ceil(currentNodes * 0.5); // 50% increase
    return { additionalNodes, totalNodes: currentNodes + additionalNodes };
  }
}
```

## Stateless Design

Stateless design is a foundational principle for horizontal scalability. When servers do not maintain session state, any server can handle any request, making load balancing and scaling straightforward.

### Principles of Stateless Architecture

```
Stateful vs Stateless Architecture:

Stateful (Problematic for Scaling):
┌────────┐         ┌─────────────────────┐
│ Client │────────>│ Server with Session │
└────────┘         │   (State in Memory) │
                   └─────────────────────┘
                   If this server fails, session is lost!

Stateless (Scalable):
┌────────┐         ┌──────────────┐         ┌────────────┐
│ Client │────────>│ Load Balancer│────────>│  Server 1  │
└────────┘         └──────────────┘    │    └────────────┘
     │                                 │    ┌────────────┐
     │                                 ├───>│  Server 2  │
     │                                 │    └────────────┘
     │                                 │    ┌────────────┐
     │                                 └───>│  Server 3  │
     │                                      └────────────┘
     │                                           │
     │              ┌────────────────────────────┘
     │              v
     │         ┌──────────────────┐
     └────────>│  External State  │
               │  (Redis/Database)│
               └──────────────────┘
```

### Implementing Stateless Services

```python
from flask import Flask, request
import redis
import json
import uuid
import time

app = Flask(__name__)
redis_client = redis.Redis(host='redis-cluster', port=6379, decode_responses=True)

class SessionManager:
    """
    Externalized session management for stateless services.
    Session data is stored in Redis, not in application memory.
    """

    def __init__(self, redis_client, ttl=3600):
        self.redis = redis_client
        self.ttl = ttl

    def create_session(self, user_id, data):
        """Create a new session with externalized storage."""
        session_id = str(uuid.uuid4())
        session_data = {
            'user_id': user_id,
            'created_at': time.time(),
            **data
        }
        self.redis.setex(
            f'session:{session_id}',
            self.ttl,
            json.dumps(session_data)
        )
        return session_id

    def get_session(self, session_id):
        """Retrieve session from external storage."""
        data = self.redis.get(f'session:{session_id}')
        if data:
            # Refresh TTL on access
            self.redis.expire(f'session:{session_id}', self.ttl)
            return json.loads(data)
        return None

    def update_session(self, session_id, data):
        """Update session in external storage."""
        current = self.get_session(session_id)
        if current:
            current.update(data)
            self.redis.setex(
                f'session:{session_id}',
                self.ttl,
                json.dumps(current)
            )
            return True
        return False

    def destroy_session(self, session_id):
        """Remove session from external storage."""
        return self.redis.delete(f'session:{session_id}') > 0


session_manager = SessionManager(redis_client)


@app.route('/api/login', methods=['POST'])
def login():
    """
    Stateless login endpoint.
    Session is stored externally, not in server memory.
    """
    credentials = request.json
    user = authenticate(credentials)  # Validate credentials

    if user:
        session_id = session_manager.create_session(
            user['id'],
            {'roles': user['roles'], 'preferences': user['preferences']}
        )
        return {'session_id': session_id, 'user': user}

    return {'error': 'Invalid credentials'}, 401


@app.route('/api/protected-resource')
def protected_resource():
    """
    Any server can handle this request because state is external.
    """
    session_id = request.headers.get('X-Session-ID')
    session = session_manager.get_session(session_id)

    if not session:
        return {'error': 'Invalid or expired session'}, 401

    # Process request with session context
    return {'data': 'protected content', 'user_id': session['user_id']}
```

### Stateless Design Patterns

```javascript
// Pattern 1: Token-Based Authentication (JWT)
class JWTAuthHandler {
  constructor(secretKey) {
    this.secretKey = secretKey;
  }

  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };
    return jwt.sign(payload, this.secretKey);
  }

  validateToken(token) {
    try {
      return jwt.verify(token, this.secretKey);
    } catch (error) {
      return null;
    }
  }
}

// Pattern 2: Request-Scoped Context
class RequestContext {
  static fromRequest(req) {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwtHandler.validateToken(token);

    return {
      userId: decoded?.userId,
      traceId: req.headers['x-trace-id'] || generateTraceId(),
      timestamp: Date.now(),
      locale: req.headers['accept-language'] || 'en-US'
    };
  }
}

// Pattern 3: Idempotent Operations
class IdempotentOrderService {
  async createOrder(idempotencyKey, orderData) {
    // Check if operation was already performed
    const existing = await this.cache.get(`idempotency:${idempotencyKey}`);
    if (existing) {
      return JSON.parse(existing); // Return cached result
    }

    // Perform the operation
    const order = await this.orderRepository.create(orderData);

    // Cache the result with the idempotency key
    await this.cache.setex(
      `idempotency:${idempotencyKey}`,
      86400, // 24 hours
      JSON.stringify(order)
    );

    return order;
  }
}
```

### Externalizing State Checklist

| State Type | Storage Solution | Considerations |
|------------|------------------|----------------|
| User sessions | Redis, Memcached | TTL, clustering, persistence |
| Shopping carts | Redis with persistence | Expiration, recovery |
| File uploads | Object storage (S3, GCS) | CDN integration, lifecycle |
| Temporary data | Redis, in-memory cache | TTL, eviction policies |
| Configuration | etcd, Consul, ConfigMaps | Versioning, hot reload |
| Feature flags | LaunchDarkly, Unleash | Real-time updates, targeting |

## Caching Strategies

Caching is one of the most effective techniques for improving system performance and scalability. A well-designed caching strategy can reduce database load by orders of magnitude.

### Multi-Layer Caching Architecture

```
Multi-Layer Caching:

┌────────────────────────────────────────────────────────────────┐
│                         Client Side                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │Browser Cache │  │ Service      │  │ Local Storage/       │  │
│  │(HTTP Cache)  │  │ Worker Cache │  │ IndexedDB            │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
                              v
┌────────────────────────────────────────────────────────────────┐
│                           CDN                                   │
│              (Edge caching for static content)                  │
└────────────────────────────────────────────────────────────────┘
                              │
                              v
┌────────────────────────────────────────────────────────────────┐
│                      Load Balancer                              │
└────────────────────────────────────────────────────────────────┘
                              │
                              v
┌────────────────────────────────────────────────────────────────┐
│                    Application Layer                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Local Cache (L1)                       │  │
│  │              (In-process, per-instance cache)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
                              v
┌────────────────────────────────────────────────────────────────┐
│                  Distributed Cache (L2)                         │
│                 (Redis Cluster, Memcached)                      │
└────────────────────────────────────────────────────────────────┘
                              │
                              v
┌────────────────────────────────────────────────────────────────┐
│                     Database Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │Query Cache   │  │ Buffer Pool  │  │ Materialized Views   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Caching Patterns Implementation

```python
from abc import ABC, abstractmethod
from functools import wraps
import hashlib
import time


class CacheStrategy(ABC):
    """Abstract base class for caching strategies."""

    @abstractmethod
    def get(self, key):
        pass

    @abstractmethod
    def set(self, key, value, ttl=None):
        pass

    @abstractmethod
    def delete(self, key):
        pass


class CacheAside:
    """
    Cache-Aside (Lazy Loading) Pattern

    Application manages both cache and database.
    - On read: Check cache first, if miss, load from DB and populate cache
    - On write: Update DB first, then invalidate cache
    """

    def __init__(self, cache: CacheStrategy, database, default_ttl=3600):
        self.cache = cache
        self.database = database
        self.default_ttl = default_ttl

    def get(self, key):
        # 1. Try cache first
        cached = self.cache.get(key)
        if cached is not None:
            return cached

        # 2. Cache miss - load from database
        data = self.database.get(key)
        if data is not None:
            # 3. Populate cache for future requests
            self.cache.set(key, data, self.default_ttl)

        return data

    def update(self, key, value):
        # 1. Update database first (source of truth)
        self.database.update(key, value)

        # 2. Invalidate cache (delete, don't update)
        # This avoids race conditions between concurrent updates
        self.cache.delete(key)

    def delete(self, key):
        self.database.delete(key)
        self.cache.delete(key)


class WriteThrough:
    """
    Write-Through Pattern

    Writes go to both cache and database synchronously.
    - Guarantees cache is always consistent with database
    - Higher write latency but simpler consistency model
    """

    def __init__(self, cache: CacheStrategy, database, default_ttl=3600):
        self.cache = cache
        self.database = database
        self.default_ttl = default_ttl

    def get(self, key):
        # Always check cache first
        cached = self.cache.get(key)
        if cached is not None:
            return cached

        # If not in cache, load from DB and cache it
        data = self.database.get(key)
        if data is not None:
            self.cache.set(key, data, self.default_ttl)
        return data

    def write(self, key, value):
        # Write to both cache and database atomically
        self.database.update(key, value)
        self.cache.set(key, value, self.default_ttl)


class WriteBehind:
    """
    Write-Behind (Write-Back) Pattern

    Writes are queued and asynchronously written to database.
    - Very fast writes (only to cache)
    - Risk of data loss if cache fails before flush
    """

    def __init__(self, cache: CacheStrategy, database, batch_size=100, flush_interval=5):
        self.cache = cache
        self.database = database
        self.write_queue = []
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self._start_flush_worker()

    def write(self, key, value):
        # Immediate write to cache
        self.cache.set(key, value)

        # Queue for async database write
        self.write_queue.append({
            'key': key,
            'value': value,
            'timestamp': time.time()
        })

        # Flush if batch is full
        if len(self.write_queue) >= self.batch_size:
            self._flush()

    def _flush(self):
        if not self.write_queue:
            return

        batch = self.write_queue[:self.batch_size]
        self.write_queue = self.write_queue[self.batch_size:]

        try:
            self.database.batch_update(batch)
        except Exception as e:
            # On failure, re-queue for retry
            self.write_queue = batch + self.write_queue
            raise

    def _start_flush_worker(self):
        import threading

        def worker():
            while True:
                time.sleep(self.flush_interval)
                try:
                    self._flush()
                except Exception as e:
                    print(f"Flush failed: {e}")

        thread = threading.Thread(target=worker, daemon=True)
        thread.start()


class ReadThrough:
    """
    Read-Through Pattern

    Cache sits between application and database.
    Application only talks to cache; cache handles DB loading.
    """

    def __init__(self, cache: CacheStrategy, loader_fn, default_ttl=3600):
        self.cache = cache
        self.loader_fn = loader_fn  # Function to load from database
        self.default_ttl = default_ttl

    def get(self, key):
        # Check cache
        cached = self.cache.get(key)
        if cached is not None:
            return cached

        # Cache handles loading from underlying data source
        data = self.loader_fn(key)
        if data is not None:
            self.cache.set(key, data, self.default_ttl)

        return data


# Decorator for method-level caching
def cached(ttl=3600, key_prefix=''):
    """Decorator to add caching to any function."""

    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            # Generate cache key from function name and arguments
            key_parts = [key_prefix, func.__name__] + [str(a) for a in args]
            key_parts += [f"{k}={v}" for k, v in sorted(kwargs.items())]
            cache_key = hashlib.md5(':'.join(key_parts).encode()).hexdigest()

            # Try cache first
            cached_result = self.cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # Execute function and cache result
            result = func(self, *args, **kwargs)
            self.cache.set(cache_key, result, ttl)
            return result

        return wrapper
    return decorator
```

### Cache Invalidation Strategies

```python
class CacheInvalidator:
    """
    Strategies for cache invalidation.
    "There are only two hard things in Computer Science:
    cache invalidation and naming things." - Phil Karlton
    """

    def __init__(self, cache):
        self.cache = cache

    # Strategy 1: Time-Based (TTL)
    def set_with_ttl(self, key, value, ttl):
        """Let cache entries expire automatically."""
        self.cache.set(key, value, ttl=ttl)

    # Strategy 2: Event-Based Invalidation
    def on_data_changed(self, entity_type, entity_id, change_type):
        """Invalidate cache when data changes."""
        # Invalidate specific entity
        self.cache.delete(f"{entity_type}:{entity_id}")

        # Invalidate related collections
        self.cache.delete(f"{entity_type}:list")
        self.cache.delete(f"{entity_type}:count")

        # Publish invalidation event for distributed caches
        self.publish_invalidation_event(entity_type, entity_id, change_type)

    # Strategy 3: Version-Based Keys
    def get_versioned(self, key, version):
        """Use version in cache key to avoid stale data."""
        versioned_key = f"{key}:v{version}"
        return self.cache.get(versioned_key)

    def set_versioned(self, key, version, value, ttl=3600):
        versioned_key = f"{key}:v{version}"
        self.cache.set(versioned_key, value, ttl=ttl)

    # Strategy 4: Tag-Based Invalidation
    def set_with_tags(self, key, value, tags, ttl=3600):
        """Associate cache entries with tags for bulk invalidation."""
        self.cache.set(key, value, ttl=ttl)

        for tag in tags:
            # Store mapping from tag to keys
            self.cache.sadd(f"tag:{tag}", key)

    def invalidate_by_tag(self, tag):
        """Invalidate all entries with a specific tag."""
        keys = self.cache.smembers(f"tag:{tag}")
        for key in keys:
            self.cache.delete(key)
        self.cache.delete(f"tag:{tag}")


# Example: E-commerce product cache with tags
class ProductCache:
    def __init__(self, cache, invalidator):
        self.cache = cache
        self.invalidator = invalidator

    def cache_product(self, product):
        key = f"product:{product['id']}"
        tags = [
            f"category:{product['category_id']}",
            f"brand:{product['brand_id']}",
            "products"
        ]
        self.invalidator.set_with_tags(key, product, tags, ttl=3600)

    def invalidate_category(self, category_id):
        """When a category changes, invalidate all its products."""
        self.invalidator.invalidate_by_tag(f"category:{category_id}")
```

### Solving Common Cache Problems

```python
import random
import threading


class RobustCache:
    """
    Cache implementation that handles common cache problems:
    - Cache Penetration: Queries for non-existent data
    - Cache Breakdown: Hot key expires under heavy load
    - Cache Avalanche: Mass expiration causing DB overload
    """

    def __init__(self, cache, database):
        self.cache = cache
        self.database = database
        self.bloom_filter = BloomFilter(max_elements=10_000_000, error_rate=0.01)
        self.locks = {}
        self.lock_mutex = threading.Lock()

    # Solution 1: Bloom Filter for Cache Penetration
    def get_with_bloom_filter(self, key):
        """
        Use bloom filter to check if data might exist.
        Prevents queries for data that definitely doesn't exist.
        """
        # Fast check: definitely not in database
        if key not in self.bloom_filter:
            return None

        # Might be in cache/database
        cached = self.cache.get(key)
        if cached is not None:
            return cached if cached != '__NULL__' else None

        # Query database
        data = self.database.get(key)
        if data is not None:
            self.cache.set(key, data, ttl=3600)
            self.bloom_filter.add(key)
        else:
            # Cache null result to prevent repeated DB queries
            self.cache.set(key, '__NULL__', ttl=300)  # Shorter TTL for nulls

        return data

    # Solution 2: Mutex Lock for Cache Breakdown
    def get_with_mutex(self, key):
        """
        Use mutex to prevent thundering herd on hot key expiration.
        Only one thread queries database; others wait for cache.
        """
        cached = self.cache.get(key)
        if cached is not None:
            return cached

        # Get or create lock for this key
        with self.lock_mutex:
            if key not in self.locks:
                self.locks[key] = threading.Lock()
            lock = self.locks[key]

        # Only one thread proceeds to query database
        acquired = lock.acquire(timeout=5)
        try:
            if acquired:
                # Double-check cache after acquiring lock
                cached = self.cache.get(key)
                if cached is not None:
                    return cached

                # Query database and populate cache
                data = self.database.get(key)
                if data is not None:
                    self.cache.set(key, data, ttl=3600)
                return data
            else:
                # Couldn't acquire lock, try cache again
                return self.cache.get(key)
        finally:
            if acquired:
                lock.release()

    # Solution 3: Random TTL for Cache Avalanche
    def set_with_jitter(self, key, value, base_ttl=3600, jitter_range=600):
        """
        Add random jitter to TTL to prevent mass expiration.
        Keys expire at different times, spreading database load.
        """
        jitter = random.randint(0, jitter_range)
        actual_ttl = base_ttl + jitter
        self.cache.set(key, value, ttl=actual_ttl)

    # Solution 4: Logical Expiration for Hot Keys
    def get_with_logical_expiration(self, key):
        """
        Don't actually expire hot data; use logical expiration.
        Background thread refreshes data before expiration.
        """
        cached = self.cache.get(key)
        if cached is None:
            return self._load_and_cache(key)

        data, logical_expiry = cached['data'], cached['expires_at']

        if time.time() > logical_expiry:
            # Start async refresh, but return stale data immediately
            self._async_refresh(key)

        return data

    def _async_refresh(self, key):
        def refresh():
            data = self.database.get(key)
            if data:
                self._set_with_logical_expiry(key, data, ttl=3600)

        thread = threading.Thread(target=refresh, daemon=True)
        thread.start()

    def _set_with_logical_expiry(self, key, data, ttl):
        value = {
            'data': data,
            'expires_at': time.time() + ttl
        }
        # Set physical TTL longer than logical TTL
        self.cache.set(key, value, ttl=ttl * 2)
```

## Database Scaling

As applications grow, the database often becomes the primary bottleneck. Database scaling requires careful consideration of data consistency, query patterns, and operational complexity.

### Read Replicas

```
Read Replica Architecture:

                    ┌─────────────────────────────────┐
                    │         Write Queries           │
                    └───────────────┬─────────────────┘
                                    v
                    ┌─────────────────────────────────┐
                    │        Primary (Master)         │
                    │    Handles all write operations │
                    └───────────────┬─────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │     Replication     │     Replication     │
              v                     v                     v
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │   Replica 1     │   │   Replica 2     │   │   Replica 3     │
    │  (Read-only)    │   │  (Read-only)    │   │  (Read-only)    │
    └────────┬────────┘   └────────┬────────┘   └────────┬────────┘
             │                     │                     │
             └─────────────────────┼─────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │        Read Queries         │
                    └─────────────────────────────┘
```

```python
class ReadWriteSplitter:
    """
    Database connection router for read/write splitting.
    Routes writes to primary, reads to replicas.
    """

    def __init__(self, primary_conn, replica_conns):
        self.primary = primary_conn
        self.replicas = replica_conns
        self.current_replica = 0

    def get_connection(self, operation_type='read'):
        if operation_type == 'write':
            return self.primary
        else:
            # Round-robin across replicas
            replica = self.replicas[self.current_replica]
            self.current_replica = (self.current_replica + 1) % len(self.replicas)
            return replica

    def execute_read(self, query, params=None):
        conn = self.get_connection('read')
        return conn.execute(query, params)

    def execute_write(self, query, params=None):
        conn = self.get_connection('write')
        return conn.execute(query, params)

    def execute_read_after_write(self, read_query, params=None):
        """
        For read-your-writes consistency, route to primary.
        Use when you need to immediately read just-written data.
        """
        conn = self.primary
        return conn.execute(read_query, params)


# ORM Integration Example (SQLAlchemy-style)
class ReplicaAwareSession:
    def __init__(self, primary_engine, replica_engines):
        self.splitter = ReadWriteSplitter(primary_engine, replica_engines)
        self._force_primary = False

    def force_primary(self):
        """Force all queries to primary (for read-your-writes)."""
        self._force_primary = True
        return self

    def query(self, model):
        if self._force_primary:
            return Query(model, self.splitter.primary)
        return Query(model, self.splitter.get_connection('read'))

    def add(self, obj):
        # Writes always go to primary
        return self.splitter.primary.add(obj)

    def commit(self):
        return self.splitter.primary.commit()
```

### Database Sharding

```
Sharding Strategies:

1. Range-Based Sharding:
   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
   │   Shard 0      │  │   Shard 1      │  │   Shard 2      │
   │ user_id: 1-1M  │  │user_id: 1M-2M  │  │user_id: 2M-3M  │
   └────────────────┘  └────────────────┘  └────────────────┘

2. Hash-Based Sharding:
   shard_id = hash(user_id) % num_shards

   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
   │   Shard 0      │  │   Shard 1      │  │   Shard 2      │
   │ hash % 3 == 0  │  │ hash % 3 == 1  │  │ hash % 3 == 2  │
   └────────────────┘  └────────────────┘  └────────────────┘

3. Directory-Based Sharding:
   ┌─────────────────────────────────────────────────────────┐
   │                   Lookup Service                         │
   │   user_id -> shard_id mapping                           │
   └──────────────────────┬──────────────────────────────────┘
                          │
     ┌────────────────────┼────────────────────┐
     v                    v                    v
   ┌──────────┐      ┌──────────┐      ┌──────────┐
   │ Shard 0  │      │ Shard 1  │      │ Shard 2  │
   └──────────┘      └──────────┘      └──────────┘
```

```python
import hashlib


class ShardingRouter:
    """
    Routes database operations to the correct shard.
    Supports multiple sharding strategies.
    """

    def __init__(self, shard_connections, strategy='hash'):
        self.shards = shard_connections
        self.num_shards = len(shard_connections)
        self.strategy = strategy
        self.directory = {}  # For directory-based sharding

    def get_shard(self, shard_key):
        """Get the shard connection for a given key."""
        if self.strategy == 'hash':
            return self._hash_shard(shard_key)
        elif self.strategy == 'range':
            return self._range_shard(shard_key)
        elif self.strategy == 'directory':
            return self._directory_shard(shard_key)
        else:
            raise ValueError(f"Unknown sharding strategy: {self.strategy}")

    def _hash_shard(self, shard_key):
        """Consistent hashing for even distribution."""
        if isinstance(shard_key, str):
            hash_value = int(hashlib.md5(shard_key.encode()).hexdigest(), 16)
        else:
            hash_value = hash(shard_key)

        shard_id = hash_value % self.num_shards
        return self.shards[shard_id]

    def _range_shard(self, shard_key):
        """Range-based sharding for sequential access patterns."""
        # Assuming integer shard_key
        items_per_shard = 1_000_000
        shard_id = min(shard_key // items_per_shard, self.num_shards - 1)
        return self.shards[shard_id]

    def _directory_shard(self, shard_key):
        """Lookup-based sharding for flexible placement."""
        if shard_key not in self.directory:
            # Assign to least loaded shard
            shard_id = self._get_least_loaded_shard()
            self.directory[shard_key] = shard_id

        return self.shards[self.directory[shard_key]]

    def execute_single(self, shard_key, query, params=None):
        """Execute query on a single shard."""
        shard = self.get_shard(shard_key)
        return shard.execute(query, params)

    def execute_scatter_gather(self, query, params=None):
        """Execute query on all shards and aggregate results."""
        results = []
        for shard in self.shards:
            result = shard.execute(query, params)
            results.extend(result)
        return results


class ShardedRepository:
    """Example repository using sharding."""

    def __init__(self, router: ShardingRouter):
        self.router = router

    def create_user(self, user_data):
        # Generate ID that includes shard information
        user_id = self._generate_sharded_id(user_data)

        shard = self.router.get_shard(user_id)
        shard.execute(
            "INSERT INTO users (id, name, email) VALUES (%s, %s, %s)",
            [user_id, user_data['name'], user_data['email']]
        )
        return user_id

    def get_user(self, user_id):
        shard = self.router.get_shard(user_id)
        return shard.execute(
            "SELECT * FROM users WHERE id = %s",
            [user_id]
        )

    def get_all_users(self, limit=100):
        """Scatter-gather across all shards."""
        all_users = self.router.execute_scatter_gather(
            f"SELECT * FROM users ORDER BY created_at DESC LIMIT {limit}"
        )
        # Sort aggregated results
        return sorted(all_users, key=lambda u: u['created_at'], reverse=True)[:limit]

    def _generate_sharded_id(self, user_data):
        """Generate ID that encodes shard information."""
        # Snowflake-like ID with shard bits
        timestamp = int(time.time() * 1000)
        shard_id = hash(user_data['email']) % self.router.num_shards
        sequence = self._get_next_sequence()

        # Bit layout: timestamp (41) | shard_id (10) | sequence (12)
        return (timestamp << 22) | (shard_id << 12) | sequence
```

### Database Partitioning vs Sharding

| Aspect | Partitioning | Sharding |
|--------|-------------|----------|
| Location | Single database instance | Multiple database instances |
| Management | Database handles automatically | Application must route queries |
| Transactions | Full ACID support | Limited cross-shard transactions |
| Complexity | Low | High |
| Scale | Limited by single server | Unlimited horizontal scale |
| Use Case | Large tables in single DB | Massive scale requirements |

## Asynchronous Processing

Asynchronous processing decouples time-consuming operations from the request-response cycle, improving responsiveness and enabling better resource utilization.

### Message Queue Architecture

```
Asynchronous Processing with Message Queues:

┌──────────────────────────────────────────────────────────────────┐
│                        Producers                                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐     │
│  │ API Server│  │ API Server│  │ Scheduler │  │  Webhook  │     │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘     │
└────────┼──────────────┼──────────────┼──────────────┼────────────┘
         │              │              │              │
         v              v              v              v
┌──────────────────────────────────────────────────────────────────┐
│                      Message Broker                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Topic: orders                            │  │
│  │  [msg1] [msg2] [msg3] [msg4] [msg5] [msg6] [msg7] [msg8]   │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  Topic: notifications                       │  │
│  │  [msg1] [msg2] [msg3] [msg4] [msg5]                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Topic: analytics                         │  │
│  │  [msg1] [msg2] [msg3]                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
         │              │              │              │
         v              v              v              v
┌──────────────────────────────────────────────────────────────────┐
│                        Consumers                                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐     │
│  │  Order    │  │ Inventory │  │  Email    │  │ Analytics │     │
│  │ Processor │  │  Service  │  │  Worker   │  │  Worker   │     │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

### Implementing Async Processing

```python
import json
import time
from dataclasses import dataclass
from enum import Enum
from typing import Callable, Dict, Any
import redis
import uuid


class MessageStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DEAD_LETTER = "dead_letter"


@dataclass
class Message:
    id: str
    topic: str
    payload: Dict[str, Any]
    created_at: float
    retry_count: int = 0
    max_retries: int = 3
    status: MessageStatus = MessageStatus.PENDING


class MessageQueue:
    """
    Simple message queue implementation using Redis.
    Supports multiple topics, retries, and dead-letter queues.
    """

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    def publish(self, topic: str, payload: Dict[str, Any], delay_seconds: int = 0):
        """Publish a message to a topic."""
        message = Message(
            id=f"{topic}:{int(time.time() * 1000)}:{uuid.uuid4().hex[:8]}",
            topic=topic,
            payload=payload,
            created_at=time.time()
        )

        message_data = json.dumps({
            'id': message.id,
            'topic': message.topic,
            'payload': message.payload,
            'created_at': message.created_at,
            'retry_count': message.retry_count,
            'max_retries': message.max_retries
        })

        if delay_seconds > 0:
            # Delayed message using sorted set
            execute_at = time.time() + delay_seconds
            self.redis.zadd(f"delayed:{topic}", {message_data: execute_at})
        else:
            # Immediate message
            self.redis.lpush(f"queue:{topic}", message_data)

        return message.id

    def consume(self, topic: str, handler: Callable, batch_size: int = 1):
        """Consume messages from a topic."""
        while True:
            # Check for delayed messages ready to process
            self._process_delayed_messages(topic)

            # Block waiting for messages
            result = self.redis.brpop(f"queue:{topic}", timeout=5)
            if result is None:
                continue

            _, message_data = result
            message = json.loads(message_data)

            try:
                # Move to processing queue
                self.redis.hset(f"processing:{topic}", message['id'], message_data)

                # Process message
                handler(message['payload'])

                # Mark as completed
                self.redis.hdel(f"processing:{topic}", message['id'])

            except Exception as e:
                self._handle_failure(topic, message, str(e))

    def _handle_failure(self, topic: str, message: Dict, error: str):
        """Handle failed message processing."""
        message['retry_count'] += 1
        message['last_error'] = error

        if message['retry_count'] >= message['max_retries']:
            # Move to dead letter queue
            self.redis.lpush(
                f"dead_letter:{topic}",
                json.dumps(message)
            )
        else:
            # Retry with exponential backoff
            delay = 2 ** message['retry_count']
            self.publish(topic, message['payload'], delay_seconds=delay)

        # Remove from processing queue
        self.redis.hdel(f"processing:{topic}", message['id'])

    def _process_delayed_messages(self, topic: str):
        """Move delayed messages that are ready to the main queue."""
        now = time.time()
        ready = self.redis.zrangebyscore(f"delayed:{topic}", 0, now)

        for message_data in ready:
            self.redis.lpush(f"queue:{topic}", message_data)
            self.redis.zrem(f"delayed:{topic}", message_data)


class TaskWorker:
    """
    Background task worker with support for different task types.
    """

    def __init__(self, queue: MessageQueue):
        self.queue = queue
        self.handlers: Dict[str, Callable] = {}

    def register_handler(self, task_type: str):
        """Decorator to register a task handler."""
        def decorator(func):
            self.handlers[task_type] = func
            return func
        return decorator

    def process_task(self, payload: Dict):
        """Route task to appropriate handler."""
        task_type = payload.get('task_type')
        handler = self.handlers.get(task_type)

        if handler is None:
            raise ValueError(f"Unknown task type: {task_type}")

        return handler(payload.get('data', {}))

    def start(self, topic: str, num_workers: int = 4):
        """Start worker processes."""
        import multiprocessing

        processes = []
        for _ in range(num_workers):
            p = multiprocessing.Process(
                target=self.queue.consume,
                args=(topic, self.process_task)
            )
            p.start()
            processes.append(p)

        return processes


# Example usage
queue = MessageQueue(redis.Redis())
worker = TaskWorker(queue)


@worker.register_handler('send_email')
def handle_send_email(data):
    """Send email asynchronously."""
    send_email(
        to=data['to'],
        subject=data['subject'],
        body=data['body']
    )


@worker.register_handler('process_image')
def handle_process_image(data):
    """Process uploaded image asynchronously."""
    image = download_image(data['image_url'])
    resized = resize_image(image, data['dimensions'])
    thumbnail = create_thumbnail(image)

    upload_to_cdn(resized, f"images/{data['image_id']}.jpg")
    upload_to_cdn(thumbnail, f"thumbnails/{data['image_id']}.jpg")


@worker.register_handler('generate_report')
def handle_generate_report(data):
    """Generate large report asynchronously."""
    report = generate_report(data['report_type'], data['parameters'])
    save_report(report, data['user_id'])
    notify_user(data['user_id'], "Your report is ready!")
```

### Event-Driven Architecture

```python
from dataclasses import dataclass, field
from typing import List, Callable
from datetime import datetime


@dataclass
class DomainEvent:
    """Base class for domain events."""
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    occurred_at: datetime = field(default_factory=datetime.utcnow)
    aggregate_id: str = ""
    aggregate_type: str = ""


@dataclass
class OrderPlaced(DomainEvent):
    aggregate_type: str = "Order"
    order_id: str = ""
    customer_id: str = ""
    items: List[dict] = field(default_factory=list)
    total_amount: float = 0.0


@dataclass
class PaymentReceived(DomainEvent):
    aggregate_type: str = "Payment"
    payment_id: str = ""
    order_id: str = ""
    amount: float = 0.0


@dataclass
class OrderShipped(DomainEvent):
    aggregate_type: str = "Order"
    order_id: str = ""
    tracking_number: str = ""
    carrier: str = ""


class EventBus:
    """
    Event bus for publishing and subscribing to domain events.
    Enables loose coupling between components.
    """

    def __init__(self):
        self._handlers: Dict[type, List[Callable]] = {}
        self._async_queue: MessageQueue = None

    def subscribe(self, event_type: type, handler: Callable):
        """Subscribe to an event type."""
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    def publish(self, event: DomainEvent):
        """Publish event to all subscribers."""
        handlers = self._handlers.get(type(event), [])

        for handler in handlers:
            try:
                handler(event)
            except Exception as e:
                # Log error but don't fail other handlers
                print(f"Handler failed for {type(event).__name__}: {e}")

    def publish_async(self, event: DomainEvent):
        """Publish event for async processing."""
        if self._async_queue:
            self._async_queue.publish(
                topic='domain_events',
                payload={
                    'event_type': type(event).__name__,
                    'data': event.__dict__
                }
            )


class OrderService:
    """Order service using event-driven architecture."""

    def __init__(self, event_bus: EventBus, order_repo):
        self.event_bus = event_bus
        self.order_repo = order_repo

    def place_order(self, customer_id: str, items: List[dict]) -> str:
        # Create order
        order = Order(customer_id=customer_id, items=items)
        self.order_repo.save(order)

        # Publish event
        event = OrderPlaced(
            aggregate_id=order.id,
            order_id=order.id,
            customer_id=customer_id,
            items=items,
            total_amount=order.total_amount
        )
        self.event_bus.publish(event)

        return order.id


# Event handlers (subscribers)
class InventoryEventHandler:
    def __init__(self, inventory_service):
        self.inventory = inventory_service

    def on_order_placed(self, event: OrderPlaced):
        """Reserve inventory when order is placed."""
        for item in event.items:
            self.inventory.reserve(
                product_id=item['product_id'],
                quantity=item['quantity'],
                order_id=event.order_id
            )


class NotificationEventHandler:
    def __init__(self, notification_service):
        self.notifications = notification_service

    def on_order_placed(self, event: OrderPlaced):
        """Send confirmation email when order is placed."""
        self.notifications.send_order_confirmation(
            customer_id=event.customer_id,
            order_id=event.order_id
        )

    def on_order_shipped(self, event: OrderShipped):
        """Send shipping notification."""
        self.notifications.send_shipping_notification(
            order_id=event.order_id,
            tracking_number=event.tracking_number,
            carrier=event.carrier
        )
```

## Content Delivery Networks (CDN)

CDNs distribute content to edge locations worldwide, reducing latency and offloading origin servers.

### CDN Architecture

```
CDN Architecture Overview:

                            ┌─────────────────────────┐
                            │      Origin Server      │
                            │   (Your Application)    │
                            └────────────┬────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    v                    v                    v
            ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
            │  CDN Edge    │     │  CDN Edge    │     │  CDN Edge    │
            │   (US-East)  │     │  (EU-West)   │     │ (Asia-Pac)   │
            └──────────────┘     └──────────────┘     └──────────────┘
                    │                    │                    │
         ┌──────────┼──────────┐        │         ┌──────────┼──────────┐
         │          │          │        │         │          │          │
         v          v          v        v         v          v          v
      ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐
      │User1│   │User2│   │User3│   │User4│   │User5│   │User6│   │User7│
      │ NYC │   │Miami│   │Boston│  │London│  │Tokyo│   │Seoul│   │Sydney│
      └─────┘   └─────┘   └─────┘   └─────┘   └─────┘   └─────┘   └─────┘


Cache Flow:
1. User requests content from nearest edge
2. Edge checks local cache
3. If cache miss, edge requests from origin
4. Origin responds, edge caches and serves
5. Subsequent requests served from edge cache
```

### CDN Implementation Strategies

```python
class CDNIntegration:
    """
    Strategies for integrating CDN with your application.
    """

    def __init__(self, cdn_client, origin_base_url):
        self.cdn = cdn_client
        self.origin_base_url = origin_base_url

    # Strategy 1: Static Asset Versioning
    def get_static_url(self, asset_path: str, version: str = None) -> str:
        """
        Generate CDN URL with cache-busting version.
        Changes version when content changes to invalidate cache.
        """
        if version is None:
            # Use content hash as version
            version = self._get_content_hash(asset_path)

        return f"https://cdn.example.com/{asset_path}?v={version}"

    def _get_content_hash(self, asset_path: str) -> str:
        """Generate hash of file content for versioning."""
        import hashlib
        with open(f"static/{asset_path}", 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()[:8]

    # Strategy 2: Dynamic Content Caching with Headers
    def set_cache_headers(self, response, cache_type: str):
        """
        Set appropriate cache headers based on content type.
        """
        cache_policies = {
            'static': {
                'Cache-Control': 'public, max-age=31536000, immutable',
                'CDN-Cache-Control': 'max-age=31536000'
            },
            'dynamic_private': {
                'Cache-Control': 'private, no-cache, must-revalidate',
                'CDN-Cache-Control': 'private'
            },
            'dynamic_public': {
                'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
                'CDN-Cache-Control': 'max-age=300'  # CDN caches longer
            },
            'api': {
                'Cache-Control': 'no-store',
                'CDN-Cache-Control': 'no-store'
            },
            'personalized': {
                'Cache-Control': 'private, max-age=0',
                'Vary': 'Cookie, Authorization'
            }
        }

        headers = cache_policies.get(cache_type, cache_policies['api'])
        for key, value in headers.items():
            response.headers[key] = value

        return response

    # Strategy 3: Purge/Invalidation
    def invalidate_content(self, paths: List[str]):
        """
        Invalidate CDN cache for specific paths.
        Use sparingly - prefer versioned URLs when possible.
        """
        # Batch invalidation requests
        batch_size = 100
        for i in range(0, len(paths), batch_size):
            batch = paths[i:i + batch_size]
            self.cdn.create_invalidation(
                DistributionId=self.distribution_id,
                InvalidationBatch={
                    'Paths': {'Quantity': len(batch), 'Items': batch},
                    'CallerReference': str(time.time())
                }
            )

    def invalidate_by_tag(self, tags: List[str]):
        """
        Invalidate all content with specific cache tags.
        Requires CDN support for cache tags (Surrogate-Key header).
        """
        for tag in tags:
            self.cdn.purge_by_tag(tag)
```

### CDN Best Practices

| Practice | Description | Implementation |
|----------|-------------|----------------|
| Immutable Assets | Use content-based URLs that never change | Hash filename or query param |
| Long Cache Duration | Cache static assets for a year | `max-age=31536000, immutable` |
| Vary Header | Cache different versions by header | `Vary: Accept-Encoding, Accept-Language` |
| Cache Tags | Group content for bulk invalidation | `Surrogate-Key` header |
| Stale-While-Revalidate | Serve stale while fetching fresh | `stale-while-revalidate=60` |
| Origin Shield | Reduce origin load with intermediate cache | Configure shield region |
| Compression | Enable gzip/brotli at edge | `Accept-Encoding` negotiation |

## Real-World Scaling Examples

### Example 1: E-Commerce Flash Sale System

```python
"""
Flash Sale System Design

Requirements:
- Handle 100,000+ concurrent users
- Process 10,000 orders per second at peak
- Prevent overselling
- Ensure fair access
- Maintain responsive user experience
"""

class FlashSaleSystem:
    """
    Architecture for handling flash sales at scale.
    """

    def __init__(self):
        self.cache = redis.Redis()
        self.queue = MessageQueue(self.cache)
        self.inventory_key = "flash_sale:{sale_id}:inventory"

    # Layer 1: Traffic Control
    def request_throttle(self, user_id: str, sale_id: str) -> bool:
        """
        Control traffic at entry point.
        - Rate limiting per user
        - Random rejection when overloaded
        """
        # Check user rate limit
        user_key = f"rate_limit:{user_id}"
        requests = self.cache.incr(user_key)
        if requests == 1:
            self.cache.expire(user_key, 10)  # 10 second window

        if requests > 5:  # Max 5 requests per 10 seconds
            return False

        # Random rejection when system is overloaded
        current_load = self.cache.get("system_load")
        if current_load and int(current_load) > 80:
            # Reject 50% of requests when load > 80%
            if random.random() < 0.5:
                return False

        return True

    # Layer 2: Inventory Check with Caching
    def check_inventory(self, sale_id: str) -> bool:
        """
        Fast inventory check using cache.
        Actual inventory is reserved in Layer 3.
        """
        inventory = self.cache.get(self.inventory_key.format(sale_id=sale_id))
        return inventory and int(inventory) > 0

    # Layer 3: Atomic Inventory Reservation
    def reserve_inventory(self, sale_id: str, user_id: str) -> str:
        """
        Atomically reserve inventory using Lua script.
        Returns reservation ID or None if failed.
        """
        # Lua script for atomic decrement with check
        lua_script = """
        local inventory = tonumber(redis.call('get', KEYS[1]) or 0)
        if inventory <= 0 then
            return nil
        end

        -- Decrement inventory
        redis.call('decr', KEYS[1])

        -- Create reservation
        local reservation_id = ARGV[1]
        redis.call('setex', 'reservation:' .. reservation_id, 300, ARGV[2])

        return reservation_id
        """

        reservation_id = str(uuid.uuid4())
        # Note: Redis eval() runs Lua on the server - this is safe
        result = self.cache.execute_command(
            'EVAL',
            lua_script,
            1,
            self.inventory_key.format(sale_id=sale_id),
            reservation_id,
            user_id
        )

        return result

    # Layer 4: Queue-Based Order Processing
    def create_order(self, reservation_id: str, user_id: str, sale_id: str):
        """
        Queue order for async processing.
        Immediate response to user, actual processing later.
        """
        self.queue.publish('flash_sale_orders', {
            'reservation_id': reservation_id,
            'user_id': user_id,
            'sale_id': sale_id,
            'timestamp': time.time()
        })

        return {
            'status': 'queued',
            'reservation_id': reservation_id,
            'message': 'Your order is being processed'
        }

    # Full flow
    def handle_purchase_request(self, user_id: str, sale_id: str):
        """Complete purchase flow for flash sale."""

        # Layer 1: Traffic control
        if not self.request_throttle(user_id, sale_id):
            return {'error': 'Too many requests, please try again'}

        # Layer 2: Fast inventory check
        if not self.check_inventory(sale_id):
            return {'error': 'Sold out'}

        # Layer 3: Reserve inventory
        reservation_id = self.reserve_inventory(sale_id, user_id)
        if not reservation_id:
            return {'error': 'Failed to reserve, sold out'}

        # Layer 4: Queue order
        return self.create_order(reservation_id, user_id, sale_id)
```

### Example 2: Social Media Feed System

```python
"""
Social Media Feed System Design

Requirements:
- Support 100M+ users
- Sub-second feed loading
- Real-time updates for new posts
- Handle viral content spikes
"""

class FeedSystem:
    """
    Hybrid push-pull feed architecture.

    - Push: Pre-compute feeds for most users
    - Pull: Fan-out on read for celebrity users (many followers)
    """

    def __init__(self):
        self.cache = redis.Redis()
        self.timeline_cache_size = 800  # Posts per user feed
        self.celebrity_threshold = 100000  # Followers to be considered celebrity

    def post_created(self, post: dict):
        """
        Handle new post creation.
        Determines push vs pull based on author's follower count.
        """
        author_id = post['author_id']
        follower_count = self.get_follower_count(author_id)

        if follower_count > self.celebrity_threshold:
            # Celebrity: just cache the post, pull on read
            self.cache_post(post)
        else:
            # Regular user: fan-out to all followers
            self.fan_out_post(post)

    def fan_out_post(self, post: dict):
        """
        Push post to all followers' timelines.
        Done asynchronously via message queue.
        """
        followers = self.get_follower_ids(post['author_id'])

        # Batch followers for efficient processing
        batch_size = 1000
        for i in range(0, len(followers), batch_size):
            batch = followers[i:i + batch_size]
            self.queue.publish('feed_fanout', {
                'post_id': post['id'],
                'post_data': post,
                'follower_ids': batch
            })

    def process_fanout(self, data: dict):
        """Worker: Add post to followers' timelines."""
        post_data = json.dumps({
            'id': data['post_id'],
            'author_id': data['post_data']['author_id'],
            'content': data['post_data']['content'],
            'created_at': data['post_data']['created_at']
        })

        pipeline = self.cache.pipeline()
        for follower_id in data['follower_ids']:
            key = f"timeline:{follower_id}"
            pipeline.lpush(key, post_data)
            pipeline.ltrim(key, 0, self.timeline_cache_size - 1)

        pipeline.execute()

    def get_feed(self, user_id: str, page: int = 0, size: int = 20) -> List[dict]:
        """
        Get user's feed using hybrid approach.
        1. Get pre-computed timeline (pushed posts)
        2. Merge with celebrity posts (pulled on demand)
        3. Apply ranking and return
        """
        start = page * size
        end = start + size - 1

        # Get pushed posts from cache
        timeline_posts = self.cache.lrange(f"timeline:{user_id}", start, end)
        posts = [json.loads(p) for p in timeline_posts]

        # Get celebrity posts (pull model)
        celebrity_followings = self.get_celebrity_followings(user_id)
        for celebrity_id in celebrity_followings[:10]:  # Top 10 celebrities
            celebrity_posts = self.get_recent_posts(celebrity_id, limit=5)
            posts.extend(celebrity_posts)

        # Merge, deduplicate, and rank
        posts = self.deduplicate(posts)
        posts = self.rank_posts(posts, user_id)

        return posts[:size]

    def rank_posts(self, posts: List[dict], user_id: str) -> List[dict]:
        """
        Rank posts for relevance.
        Factors: recency, engagement, user affinity
        """
        user_preferences = self.get_user_preferences(user_id)

        for post in posts:
            # Base score from recency (decay over time)
            age_hours = (time.time() - post['created_at']) / 3600
            recency_score = 1 / (1 + age_hours / 24)

            # Engagement score
            engagement = post.get('likes', 0) + post.get('comments', 0) * 2
            engagement_score = min(engagement / 1000, 1)

            # Affinity score (how much user interacts with author)
            affinity = user_preferences.get(post['author_id'], 0.5)

            # Combined score
            post['score'] = (
                recency_score * 0.4 +
                engagement_score * 0.3 +
                affinity * 0.3
            )

        return sorted(posts, key=lambda p: p['score'], reverse=True)
```

### Example 3: Real-Time Analytics Pipeline

```python
"""
Real-Time Analytics Pipeline

Requirements:
- Process 1M+ events per second
- Sub-minute latency for dashboards
- Historical data for batch analysis
- Cost-effective storage
"""

class AnalyticsPipeline:
    """
    Lambda architecture for real-time and batch analytics.

    - Speed layer: Real-time aggregations
    - Batch layer: Complete, accurate historical data
    - Serving layer: Query results
    """

    def __init__(self):
        self.speed_store = redis.Redis()

    # Speed Layer: Real-time processing
    def process_event_realtime(self, event: dict):
        """
        Process event for real-time aggregations.
        Updates counters and time-windowed aggregates.
        """
        timestamp = event['timestamp']
        minute_bucket = timestamp // 60 * 60
        hour_bucket = timestamp // 3600 * 3600

        pipeline = self.speed_store.pipeline()

        # Real-time counters
        pipeline.incr(f"events:total")
        pipeline.incr(f"events:{event['event_type']}")

        # Time-windowed aggregates (1-minute resolution)
        pipeline.hincrby(
            f"events:minute:{minute_bucket}",
            event['event_type'],
            1
        )
        pipeline.expire(f"events:minute:{minute_bucket}", 86400)  # 24h retention

        # Hourly aggregates
        pipeline.hincrby(
            f"events:hour:{hour_bucket}",
            event['event_type'],
            1
        )
        pipeline.expire(f"events:hour:{hour_bucket}", 604800)  # 7d retention

        # Cardinality estimation (unique users)
        pipeline.pfadd(f"users:unique:{hour_bucket}", event['user_id'])

        pipeline.execute()

    # Serving Layer: Query interface
    def get_metrics(self, metric_type: str, time_range: str) -> dict:
        """
        Get metrics with automatic source selection.
        Uses speed layer for recent data, batch layer for historical.
        """
        now = time.time()

        if time_range == 'last_hour':
            # Speed layer: real-time data
            return self._get_realtime_metrics(metric_type, now - 3600, now)

        elif time_range == 'last_24h':
            # Hybrid: batch for complete hours + speed for current hour
            complete_hours = self._get_batch_metrics(
                metric_type,
                now - 86400,
                now - 3600
            )
            current_hour = self._get_realtime_metrics(
                metric_type,
                now - 3600,
                now
            )
            return self._merge_metrics(complete_hours, current_hour)

        else:
            # Batch layer: historical data
            return self._get_batch_metrics(metric_type, *self._parse_range(time_range))

    def _get_realtime_metrics(self, metric_type: str, start: float, end: float):
        """Query speed layer for real-time metrics."""
        results = {}
        current = start

        while current < end:
            hour_bucket = int(current // 3600 * 3600)
            data = self.speed_store.hgetall(f"events:hour:{hour_bucket}")

            if data:
                results[hour_bucket] = {
                    k.decode(): int(v) for k, v in data.items()
                }

            current += 3600

        return results
```

## Scalability Checklist

Use this checklist when designing scalable systems:

### Architecture

- [ ] Services are stateless and can be horizontally scaled
- [ ] State is externalized to appropriate data stores
- [ ] Clear separation between read and write paths
- [ ] Asynchronous processing for non-critical operations
- [ ] Circuit breakers for external service calls

### Data Layer

- [ ] Database read replicas configured for read-heavy workloads
- [ ] Sharding strategy defined for data growth
- [ ] Caching layer implemented with appropriate patterns
- [ ] Cache invalidation strategy documented
- [ ] Connection pooling configured properly

### Infrastructure

- [ ] Load balancers with health checks
- [ ] Auto-scaling policies based on metrics
- [ ] CDN configured for static content
- [ ] Geographic distribution for global users
- [ ] Monitoring and alerting in place

### Performance

- [ ] Response time SLAs defined
- [ ] Bottlenecks identified and addressed
- [ ] Database queries optimized with indexes
- [ ] N+1 query problems resolved
- [ ] Batch operations used where appropriate

## Summary

Scalability is not a feature you add later; it is a design principle that should inform architectural decisions from the start. Key takeaways:

1. **Start Simple, Scale as Needed**: Begin with the simplest architecture that meets your requirements. Over-engineering for scale you may never need is wasteful.

2. **Measure Before Optimizing**: Use monitoring and profiling to identify actual bottlenecks rather than assumed ones. Data-driven decisions lead to better outcomes.

3. **Choose the Right Scaling Strategy**: Vertical scaling is simpler but has limits. Horizontal scaling offers unlimited growth but adds complexity. Most systems benefit from a hybrid approach.

4. **Design for Statelessness**: Stateless services are easier to scale, deploy, and operate. Externalize state to purpose-built data stores.

5. **Cache Strategically**: Caching can dramatically improve performance, but requires careful consideration of consistency, invalidation, and failure modes.

6. **Embrace Asynchronous Processing**: Decouple time-consuming operations from the request path to improve responsiveness and enable independent scaling.

7. **Use CDNs for Global Reach**: CDNs reduce latency for users worldwide and offload significant traffic from origin servers.

8. **Plan for Failure**: At scale, failures are inevitable. Design systems that gracefully degrade and recover automatically.

The patterns and strategies in this article provide a foundation for building scalable systems. However, every system is unique, and the right approach depends on your specific requirements, constraints, and trade-offs. Continuously monitor, measure, and iterate on your architecture as your system evolves.
