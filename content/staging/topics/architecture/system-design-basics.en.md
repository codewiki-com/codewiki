---
title: System Design Fundamentals
description: Master system design principles for scalable applications
track: architecture
section: system-design
difficulty: advanced
tags:
  - System Design
  - Scalability
  - Architecture
  - Interview
status: imported
origin: old/src/content/docs/architecture/system-design-basics.en.md
divergence: 0.233
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Architecture
  subcategory: System Design
  order: 5
  lastUpdated: 2026-01-07
---

System design is one of the most challenging yet valuable skills in software engineering. It requires engineers to think holistically about how to build scalable, reliable, and high-performance distributed systems. We'll explore core system design concepts, methodologies, and practical techniques.

## What is System Design?

System design is the process of defining the architecture, components, modules, interfaces, and data flow of a system to satisfy specified requirements within given constraints. It involves multi-layered decision-making across several dimensions:

- **Architecture Selection**: Choosing appropriate architectural patterns (microservices, monolith, event-driven, etc.)
- **Technology Selection**: Selecting suitable databases, caching solutions, message queues, and other infrastructure components
- **Capacity Planning**: Estimating data volumes and traffic the system needs to handle
- **Reliability Design**: Ensuring the system continues to function under various failure scenarios
- **Performance Optimization**: Guaranteeing the system meets latency and throughput requirements

System design is not about finding the "one correct answer" but rather the art of making reasonable trade-offs among competing concerns.

## System Design Methodology

### The Four-Step Framework

When approaching system design, follow this structured methodology:

#### Step 1: Clarify Requirements

Before beginning any design, thoroughly understand the requirements:

**Functional Requirements**:
- What core features must the system support?
- What are the primary user scenarios?
- Which platforms need support (Web, Mobile, API)?

**Non-Functional Requirements**:
- What is the expected user scale?
- How many QPS (Queries Per Second) must be supported?
- What are the latency requirements (e.g., P99 < 100ms)?
- How long must data be retained?
- What availability level is required (99.9% vs 99.99%)?

#### Step 2: High-Level Design

After confirming requirements, create a high-level architecture:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Clients   │────>│Load Balancer│────>│ App Servers │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    v                         v                         v
              ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
              │    Cache    │           │  Database   │           │Message Queue│
              └─────────────┘           └─────────────┘           └─────────────┘
```

During this phase:
- Identify the system's major components
- Define interactions between components
- Select appropriate communication protocols (HTTP, gRPC, WebSocket, etc.)

#### Step 3: Deep Dive Design

Select critical components for detailed design:

- Data model design
- API design
- Database schema design
- Caching strategy design
- Message queue design

#### Step 4: Wrap Up and Extensions

- Identify system bottlenecks
- Discuss monitoring and alerting strategies
- Explore future extension possibilities

## Core Theoretical Concepts

### CAP Theorem

The CAP theorem is a fundamental principle of distributed systems design. It states that a distributed system can only simultaneously satisfy two of these three properties:

- **Consistency**: All nodes see the same data at the same time
- **Availability**: Every request receives a response (not guaranteeing the latest data)
- **Partition Tolerance**: The system continues to operate despite network partitions

```
                        CAP Theorem

         ┌─────────────────┬─────────────────┐
         │                 │                 │
         │       CA        │       CP        │
         │ (Single-node)   │(Strong Consistency)
         │                 │                 │
         ├─────────────────┴─────────────────┤
         │                                   │
         │              AP                   │
         │    (High Availability Systems)    │
         │                                   │
         └───────────────────────────────────┘
```

**Practical Application Choices**:

| System Type | CAP Choice | Representative Examples |
|------------|-----------|------------------------|
| Traditional RDBMS | CA | MySQL (single-node) |
| Distributed Database | CP | ZooKeeper, etcd, HBase |
| NoSQL Database | AP | Cassandra, DynamoDB |

Since network partitions are unavoidable in distributed systems, we typically choose between CP and AP in practice.

### BASE Theory

BASE theory extends the AP approach of CAP, providing a more practical consistency model:

- **Basically Available**: The system allows partial availability degradation during failures while maintaining core functionality
- **Soft State**: Data in the system may exist in intermediate states without affecting overall availability
- **Eventually Consistent**: Data replicas across the system will eventually reach a consistent state

BASE vs ACID comparison:

| Property | ACID | BASE |
|----------|------|------|
| Consistency | Strong consistency | Eventual consistency |
| Availability | May block | Basically available |
| Use Cases | Financial transactions | Social networks, e-commerce |
| Scalability | Limited | Good |

### Consistency Models

Distributed systems support multiple consistency levels:

**Strong Consistency**
- Every read returns the most recently written data
- High implementation cost, lower performance
- Suitable for financial transactions

**Eventual Consistency**
- Without new updates, all accesses eventually return the last updated value
- Simple implementation, good performance
- Suitable for social media, comment systems

**Causal Consistency**
- Operations with causal relationships maintain consistent order across all nodes
- Falls between strong and eventual consistency

**Read-Your-Writes Consistency**
- Users always read their own written data
- Common for user personal data scenarios

## Scalability Design

When system load increases, scaling is necessary to handle the demand. There are two primary scaling approaches:

### Vertical Scaling (Scale Up)

Vertical scaling means increasing hardware resources of a single machine:

**Advantages**:
- Simple implementation, no code changes required
- Avoids distributed system complexity

**Disadvantages**:
- Hardware limits exist
- Non-linear cost growth (high-end hardware is more expensive)
- Single point of failure risk

```
Vertical Scaling Illustration:

    ┌─────────┐         ┌─────────────┐
    │ 4 CPUs  │   -->   │  32 CPUs    │
    │ 8GB RAM │         │  256GB RAM  │
    │ 100GB   │         │  10TB SSD   │
    └─────────┘         └─────────────┘
```

### Horizontal Scaling (Scale Out)

Horizontal scaling means adding more machines:

**Advantages**:
- Theoretically unlimited scaling
- Linear cost growth
- Improved fault tolerance

**Disadvantages**:
- Requires handling distributed challenges
- Data consistency becomes more complex
- Increased operational costs

```
Horizontal Scaling Illustration:

    ┌─────────┐         ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ Server  │   -->   │ Server1 │ │ Server2 │ │ Server3 │
    │    A    │         └─────────┘ └─────────┘ └─────────┘
    └─────────┘                │         │         │
                               └─────────┴─────────┘
                                        │
                               ┌─────────────────┐
                               │  Load Balancer  │
                               └─────────────────┘
```

### Scaling Strategy Selection

| Scenario | Recommended Strategy | Reason |
|----------|---------------------|--------|
| Startup MVP | Vertical Scaling | Faster launch, reduced complexity |
| Compute-Intensive | Vertical Scaling | Reduces distributed computing overhead |
| Stateless Services | Horizontal Scaling | Easy scaling, no data sync issues |
| Large-Scale Systems | Horizontal Scaling | Overcomes single-machine limits |

## Load Balancing

Load balancing distributes requests across multiple servers to improve system throughput and availability.

### Load Balancing Algorithms

| Algorithm | Description | Use Case |
|-----------|-------------|----------|
| Round Robin | Distributes requests sequentially | Servers with similar performance |
| Weighted Round Robin | Distributes by weight ratio | Servers with different performance |
| Least Connections | Routes to server with fewest connections | Long-connection scenarios |
| IP Hash | Same IP routes to same server | Session persistence required |
| Consistent Hashing | Hash ring distribution | Cache and storage services |

### Load Balancing Layers

```
User Request
    │
    v
┌─────────────────────────────────────────────┐
│         DNS Load Balancing (L4/L7)          │
│     (Geographic, ISP-based routing)         │
└──────────────────────┬──────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────┐
│      Hardware Load Balancing (L4)           │
│           (F5, A10, etc.)                   │
└──────────────────────┬──────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────┐
│       Software Load Balancing (L7)          │
│        (Nginx, HAProxy, etc.)               │
└──────────────────────┬──────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        v              v              v
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │ Server1 │    │ Server2 │    │ Server3 │
   └─────────┘    └─────────┘    └─────────┘
```

### Load Balancer Implementation Example

```javascript
// Simple load balancer implementation with health checks
class LoadBalancer {
  constructor(servers) {
    this.servers = servers;
    this.currentIndex = 0;
    this.healthyServers = new Set(servers);
  }

  // Round-robin selection
  getNextServer() {
    const healthy = Array.from(this.healthyServers);
    if (healthy.length === 0) {
      throw new Error('No healthy servers available');
    }

    const server = healthy[this.currentIndex % healthy.length];
    this.currentIndex++;
    return server;
  }

  // Weighted round-robin
  getWeightedServer(weights) {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (const [server, weight] of Object.entries(weights)) {
      if (this.healthyServers.has(server)) {
        random -= weight;
        if (random <= 0) return server;
      }
    }
    return this.getNextServer();
  }

  // Least connections
  getLeastConnectionsServer(connectionCounts) {
    let minConnections = Infinity;
    let selectedServer = null;

    for (const server of this.healthyServers) {
      const connections = connectionCounts.get(server) || 0;
      if (connections < minConnections) {
        minConnections = connections;
        selectedServer = server;
      }
    }
    return selectedServer;
  }

  // Health check
  async performHealthCheck() {
    for (const server of this.servers) {
      try {
        const response = await fetch(`${server}/health`, { timeout: 5000 });
        if (response.ok) {
          this.healthyServers.add(server);
        } else {
          this.healthyServers.delete(server);
        }
      } catch (error) {
        this.healthyServers.delete(server);
        console.error(`Server ${server} health check failed:`, error.message);
      }
    }
  }
}

// Usage
const lb = new LoadBalancer([
  'http://server1:3000',
  'http://server2:3000',
  'http://server3:3000'
]);

// Periodic health checks
setInterval(() => lb.performHealthCheck(), 10000);
```

## Caching Strategies

Caching is a crucial technique for improving system performance, but it introduces data consistency challenges.

### Caching Patterns

**Cache-Aside (Lazy Loading)**:
```python
def get_data(key):
    # 1. Check cache first
    data = cache.get(key)
    if data:
        return data

    # 2. Cache miss - query database
    data = db.query(key)

    # 3. Write to cache
    cache.set(key, data, ttl=3600)

    return data

def update_data(key, value):
    # 1. Update database first
    db.update(key, value)

    # 2. Invalidate cache
    cache.delete(key)
```

**Write-Through**:
```python
def write_through(key, value):
    # Write to cache and database simultaneously
    cache.set(key, value)
    db.update(key, value)

# Advantages: Cache data always fresh
# Disadvantages: Higher write latency
```

**Write-Behind (Write-Back)**:
```python
import asyncio
from collections import deque

class WriteBackCache:
    def __init__(self):
        self.cache = {}
        self.write_queue = deque()
        self.batch_size = 100
        self.flush_interval = 5  # seconds

    def set(self, key, value):
        # Write to cache immediately
        self.cache[key] = value
        # Queue for async database write
        self.write_queue.append((key, value))

    async def flush_to_database(self):
        while True:
            await asyncio.sleep(self.flush_interval)
            batch = []
            while self.write_queue and len(batch) < self.batch_size:
                batch.append(self.write_queue.popleft())

            if batch:
                await self.db.batch_update(batch)

# Advantages: High write performance
# Disadvantages: Risk of data loss on failure
```

**Read-Through**:
```python
class ReadThroughCache:
    def __init__(self, cache, db):
        self.cache = cache
        self.db = db

    def get(self, key):
        # Cache layer handles database loading
        data = self.cache.get(key)
        if data is None:
            data = self.db.query(key)
            if data:
                self.cache.set(key, data)
        return data
```

### Cache Eviction Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| TTL (Time-To-Live) | Expires after fixed time | Most scenarios |
| LRU (Least Recently Used) | Evicts least recently accessed data | Limited memory scenarios |
| LFU (Least Frequently Used) | Evicts least accessed data | Hot data scenarios |
| Active Invalidation | Delete on data update | Strong consistency requirements |

### Common Cache Problems and Solutions

**Cache Penetration**:
- Problem: Queries for non-existent data bypass cache and hit database
- Solutions: Bloom filter, cache null values

```python
from pybloom_live import BloomFilter

class CacheWithBloomFilter:
    def __init__(self):
        self.cache = {}
        self.bloom = BloomFilter(capacity=1000000, error_rate=0.001)
        self.null_cache = set()  # Cache for null values

    def get(self, key):
        # Check bloom filter first
        if key not in self.bloom:
            return None  # Definitely not in database

        # Check null cache
        if key in self.null_cache:
            return None

        # Check cache
        if key in self.cache:
            return self.cache[key]

        # Query database
        data = self.db.query(key)
        if data:
            self.cache[key] = data
            self.bloom.add(key)
        else:
            self.null_cache.add(key)  # Cache null result

        return data
```

**Cache Breakdown**:
- Problem: Hot data expires, massive concurrent requests hit database
- Solutions: Mutex lock, never-expire hot data

```python
import threading
import time

class CacheWithMutex:
    def __init__(self):
        self.cache = {}
        self.locks = {}
        self.lock_map_mutex = threading.Lock()

    def get_with_mutex(self, key):
        # Try cache first
        data = self.cache.get(key)
        if data and data['expire_at'] > time.time():
            return data['value']

        # Get lock for this key
        with self.lock_map_mutex:
            if key not in self.locks:
                self.locks[key] = threading.Lock()
            lock = self.locks[key]

        # Only one thread queries database
        with lock:
            # Double-check after acquiring lock
            data = self.cache.get(key)
            if data and data['expire_at'] > time.time():
                return data['value']

            # Query database
            value = self.db.query(key)
            self.cache[key] = {
                'value': value,
                'expire_at': time.time() + 3600
            }
            return value
```

**Cache Avalanche**:
- Problem: Many cache entries expire simultaneously
- Solutions: Random TTL offsets, multi-level caching

```python
import random

# Original approach (problematic)
# cache.set(key, value, ttl=3600)

# Optimized approach (add random offset)
def set_with_random_ttl(cache, key, value, base_ttl=3600):
    # TTL between 3600-4200 seconds
    random_offset = random.randint(0, 600)
    cache.set(key, value, ttl=base_ttl + random_offset)

# Multi-level caching
class MultiLevelCache:
    def __init__(self):
        self.l1_cache = {}  # Local memory cache
        self.l2_cache = redis_client  # Distributed cache

    def get(self, key):
        # Check L1 first
        if key in self.l1_cache:
            return self.l1_cache[key]

        # Check L2
        value = self.l2_cache.get(key)
        if value:
            self.l1_cache[key] = value  # Populate L1
            return value

        # Query database
        value = self.db.query(key)
        if value:
            self.l2_cache.set(key, value, ex=3600)
            self.l1_cache[key] = value
        return value
```

## Database Sharding

When a single database cannot meet performance requirements, sharding becomes necessary.

### Vertical Partitioning (Sharding by Feature)

Split database by business modules:

```
Original Database                    After Splitting
┌──────────────┐           ┌───────────┐
│   users      │    -->    │ User DB   │
│   orders     │           └───────────┘
│   products   │           ┌───────────┐
│   reviews    │    -->    │ Order DB  │
└──────────────┘           └───────────┘
                           ┌───────────┐
                    -->    │Product DB │
                           └───────────┘
```

### Horizontal Partitioning (Sharding by Data)

Split data across multiple databases:

```
Common Sharding Strategies:

1. Range Sharding
   - user_0: id 1-1000000
   - user_1: id 1000001-2000000

2. Hash Sharding
   - shard = hash(user_id) % shard_count

3. Consistent Hashing
   - Minimizes data migration when nodes change
```

### Consistent Hashing Implementation

```javascript
class ConsistentHash {
  constructor(replicas = 100) {
    this.replicas = replicas;  // Virtual nodes per physical node
    this.ring = new Map();     // Hash ring
    this.sortedKeys = [];      // Sorted hash values
  }

  // Hash function
  hash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Add a node to the ring
  addNode(node) {
    for (let i = 0; i < this.replicas; i++) {
      const virtualKey = `${node}:${i}`;
      const hashValue = this.hash(virtualKey);
      this.ring.set(hashValue, node);
      this.sortedKeys.push(hashValue);
    }
    this.sortedKeys.sort((a, b) => a - b);
  }

  // Remove a node from the ring
  removeNode(node) {
    for (let i = 0; i < this.replicas; i++) {
      const virtualKey = `${node}:${i}`;
      const hashValue = this.hash(virtualKey);
      this.ring.delete(hashValue);
      const index = this.sortedKeys.indexOf(hashValue);
      if (index !== -1) {
        this.sortedKeys.splice(index, 1);
      }
    }
  }

  // Get the node responsible for a key
  getNode(key) {
    if (this.ring.size === 0) {
      return null;
    }

    const hashValue = this.hash(key);

    // Binary search for the first node >= hashValue
    let left = 0;
    let right = this.sortedKeys.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.sortedKeys[mid] < hashValue) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    // Wrap around if necessary
    const index = left === this.sortedKeys.length ? 0 : left;
    return this.ring.get(this.sortedKeys[index]);
  }
}

// Usage
const hash = new ConsistentHash(150);
hash.addNode('db-server-1');
hash.addNode('db-server-2');
hash.addNode('db-server-3');

console.log(hash.getNode('user:12345'));  // Returns responsible server
console.log(hash.getNode('order:67890')); // Returns responsible server
```

### Sharding Challenges

- **Cross-shard transactions**: Difficult to maintain ACID properties
- **Cross-shard queries**: Complex aggregation operations
- **Global unique IDs**: Need distributed ID generation
- **Data migration and rebalancing**: Complex when adding/removing shards

### Distributed ID Generation

```javascript
// Snowflake ID Generator
class SnowflakeIdGenerator {
  constructor(workerId, datacenterId) {
    // Bit allocation: 1 sign + 41 timestamp + 5 datacenter + 5 worker + 12 sequence
    this.workerId = BigInt(workerId);
    this.datacenterId = BigInt(datacenterId);
    this.sequence = 0n;
    this.lastTimestamp = -1n;

    // Constants
    this.epoch = 1609459200000n; // 2021-01-01 00:00:00 UTC
    this.workerIdBits = 5n;
    this.datacenterIdBits = 5n;
    this.sequenceBits = 12n;

    this.maxWorkerId = (1n << this.workerIdBits) - 1n;
    this.maxDatacenterId = (1n << this.datacenterIdBits) - 1n;
    this.sequenceMask = (1n << this.sequenceBits) - 1n;

    this.workerIdShift = this.sequenceBits;
    this.datacenterIdShift = this.sequenceBits + this.workerIdBits;
    this.timestampShift = this.sequenceBits + this.workerIdBits + this.datacenterIdBits;

    // Validation
    if (this.workerId > this.maxWorkerId || this.workerId < 0n) {
      throw new Error(`Worker ID must be between 0 and ${this.maxWorkerId}`);
    }
    if (this.datacenterId > this.maxDatacenterId || this.datacenterId < 0n) {
      throw new Error(`Datacenter ID must be between 0 and ${this.maxDatacenterId}`);
    }
  }

  currentTimestamp() {
    return BigInt(Date.now());
  }

  waitNextMillis(lastTimestamp) {
    let timestamp = this.currentTimestamp();
    while (timestamp <= lastTimestamp) {
      timestamp = this.currentTimestamp();
    }
    return timestamp;
  }

  nextId() {
    let timestamp = this.currentTimestamp();

    if (timestamp < this.lastTimestamp) {
      throw new Error('Clock moved backwards');
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & this.sequenceMask;
      if (this.sequence === 0n) {
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    const id = ((timestamp - this.epoch) << this.timestampShift) |
               (this.datacenterId << this.datacenterIdShift) |
               (this.workerId << this.workerIdShift) |
               this.sequence;

    return id.toString();
  }
}

// Usage
const idGen = new SnowflakeIdGenerator(1, 1);
console.log(idGen.nextId()); // "6789012345678901234"
```

## Rate Limiting

Rate limiting protects systems from being overwhelmed by sudden traffic spikes.

### Common Rate Limiting Algorithms

**Fixed Window Counter**:
```python
import time

class FixedWindowCounter:
    def __init__(self, limit, window_size):
        self.limit = limit
        self.window_size = window_size
        self.counter = 0
        self.window_start = time.time()

    def allow_request(self):
        current = time.time()
        if current - self.window_start >= self.window_size:
            self.counter = 0
            self.window_start = current

        if self.counter < self.limit:
            self.counter += 1
            return True
        return False
```

**Sliding Window Counter**:
```python
import time
from collections import deque

class SlidingWindowCounter:
    def __init__(self, limit, window_size):
        self.limit = limit
        self.window_size = window_size
        self.requests = deque()

    def allow_request(self):
        current = time.time()

        # Remove expired timestamps
        while self.requests and self.requests[0] <= current - self.window_size:
            self.requests.popleft()

        if len(self.requests) < self.limit:
            self.requests.append(current)
            return True
        return False
```

**Token Bucket**:
```python
import time

class TokenBucket:
    def __init__(self, capacity, rate):
        self.capacity = capacity  # Bucket capacity
        self.rate = rate          # Token generation rate (per second)
        self.tokens = capacity
        self.last_time = time.time()

    def allow_request(self, tokens_needed=1):
        current = time.time()

        # Generate new tokens
        elapsed = current - self.last_time
        self.tokens += elapsed * self.rate
        self.tokens = min(self.tokens, self.capacity)
        self.last_time = current

        if self.tokens >= tokens_needed:
            self.tokens -= tokens_needed
            return True
        return False

# Usage
bucket = TokenBucket(capacity=100, rate=10)  # 100 max, 10 per second
if bucket.allow_request():
    process_request()
else:
    return_429_too_many_requests()
```

**Leaky Bucket**:
```python
import time
import threading
from collections import deque

class LeakyBucket:
    def __init__(self, capacity, leak_rate):
        self.capacity = capacity
        self.leak_rate = leak_rate  # Requests processed per second
        self.queue = deque()
        self.lock = threading.Lock()
        self._start_leak_thread()

    def _start_leak_thread(self):
        def leak():
            while True:
                time.sleep(1 / self.leak_rate)
                with self.lock:
                    if self.queue:
                        request = self.queue.popleft()
                        self._process(request)

        thread = threading.Thread(target=leak, daemon=True)
        thread.start()

    def add_request(self, request):
        with self.lock:
            if len(self.queue) < self.capacity:
                self.queue.append(request)
                return True
            return False  # Bucket full, request dropped

    def _process(self, request):
        # Process the request
        pass
```

### Rate Limiting Strategies

| Strategy | Description |
|----------|-------------|
| User-level limiting | Limit request rate per user |
| API-level limiting | Limit specific API call frequency |
| IP-level limiting | Limit request rate per IP address |
| Global limiting | Limit total system request volume |

## High Availability Design

High Availability (HA) refers to a system's ability to remain operational for extended periods.

### Availability Metrics

Availability is typically expressed as "number of nines":

| Availability | Annual Downtime | Use Case |
|--------------|-----------------|----------|
| 99% (two 9s) | 3.65 days | Internal tools |
| 99.9% (three 9s) | 8.76 hours | Regular business systems |
| 99.99% (four 9s) | 52.6 minutes | Core business systems |
| 99.999% (five 9s) | 5.26 minutes | Financial, medical critical systems |

### Redundancy Design

Redundancy is the fundamental strategy for achieving high availability:

**Service Redundancy**:
```
                    ┌─────────────┐
                    │Load Balancer│
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           v               v               v
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │ Server 1 │    │ Server 2 │    │ Server 3 │
     │ (Active) │    │ (Active) │    │ (Active) │
     └──────────┘    └──────────┘    └──────────┘
```

**Data Redundancy**:
- Master-Slave Replication
- Multi-Master Replication
- Cross-datacenter Replication

**Geographic Redundancy**:
- Multi-datacenter deployment
- Active-Active architecture across regions

### Failover Patterns

**Active-Passive (Hot Standby)**:
```
Normal State:                    After Failover:
┌──────────┐                 ┌──────────┐
│  Master  │ <-- writes      │  Master  │ X Failed
│ (Active) │                 │ (Failed) │
└────┬─────┘                 └──────────┘
     │ replication
     v                             v
┌──────────┐                 ┌──────────┐
│  Slave   │                 │  Slave   │ <-- Promoted to Master
│(Standby) │                 │(Promoted)│
└──────────┘                 └──────────┘
```

**Active-Active**:
- All nodes process requests simultaneously
- Better load distribution
- More complex data consistency

### Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(options) {
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 30000;

    this.state = 'CLOSED';  // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
      }
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage
const breaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000
});

async function callExternalService() {
  return breaker.execute(async () => {
    const response = await fetch('http://external-service/api');
    if (!response.ok) throw new Error('Service error');
    return response.json();
  });
}
```

## Common Design Patterns

### API Gateway Pattern

Provides a single entry point for all clients:

```
Client --> API Gateway --> Microservices

Responsibilities:
- Authentication/Authorization
- Rate limiting
- Request routing
- Protocol translation
- Response aggregation
```

### Database per Service

Each service owns its private database:

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ User Service  │     │ Order Service │     │Product Service│
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        v                     v                     v
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   User DB     │     │   Order DB    │     │  Product DB   │
│ (PostgreSQL)  │     │  (MongoDB)    │     │   (MySQL)     │
└───────────────┘     └───────────────┘     └───────────────┘
```

### Event Sourcing

Store state changes as a sequence of events:

```javascript
class EventStore {
  constructor() {
    this.events = [];
  }

  append(event) {
    this.events.push({
      ...event,
      timestamp: Date.now(),
      version: this.events.length + 1
    });
  }

  getEvents(aggregateId) {
    return this.events.filter(e => e.aggregateId === aggregateId);
  }

  replay(aggregateId) {
    const events = this.getEvents(aggregateId);
    let state = {};

    for (const event of events) {
      state = this.applyEvent(state, event);
    }

    return state;
  }

  applyEvent(state, event) {
    switch (event.type) {
      case 'OrderCreated':
        return { ...state, ...event.data, status: 'created' };
      case 'OrderPaid':
        return { ...state, status: 'paid', paidAt: event.timestamp };
      case 'OrderShipped':
        return { ...state, status: 'shipped', shippedAt: event.timestamp };
      default:
        return state;
    }
  }
}
```

### CQRS (Command Query Responsibility Segregation)

Separate read and write models:

```javascript
// Command Handler (Write Side)
class OrderCommandHandler {
  async handle(command) {
    switch (command.type) {
      case 'CreateOrder':
        const order = Order.create(command.data);
        await this.orderRepository.save(order);
        await this.eventBus.publish(new OrderCreatedEvent(order));
        break;
      case 'CancelOrder':
        const existing = await this.orderRepository.findById(command.orderId);
        existing.cancel();
        await this.orderRepository.save(existing);
        await this.eventBus.publish(new OrderCancelledEvent(existing));
        break;
    }
  }
}

// Query Handler (Read Side)
class OrderQueryHandler {
  async getOrderSummary(orderId) {
    // Query from read-optimized database
    return this.readDatabase.query(`
      SELECT o.id, o.status, o.total_amount,
             u.name as customer_name,
             p.name as product_name
      FROM order_view o
      JOIN user_view u ON o.user_id = u.id
      JOIN product_view p ON o.product_id = p.id
      WHERE o.id = ?
    `, [orderId]);
  }
}

// Event Handler (Sync Read Model)
class OrderEventHandler {
  async onOrderCreated(event) {
    await this.readDatabase.execute(`
      INSERT INTO order_view (id, user_id, status, total_amount, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [event.orderId, event.userId, event.status, event.totalAmount, event.createdAt]);
  }
}
```

### Saga Pattern

Manage distributed transactions across services:

```javascript
class CreateOrderSaga {
  constructor() {
    this.steps = [
      { action: this.createOrder, compensation: this.cancelOrder },
      { action: this.reserveStock, compensation: this.releaseStock },
      { action: this.processPayment, compensation: this.refundPayment },
      { action: this.confirmOrder, compensation: null }
    ];
  }

  async execute(orderData) {
    const context = { orderId: null, stockReservationId: null, paymentId: null };
    const completedSteps = [];

    for (let i = 0; i < this.steps.length; i++) {
      try {
        await this.steps[i].action.call(this, orderData, context);
        completedSteps.push(i);
      } catch (error) {
        console.error(`Step ${i} failed:`, error);
        await this.compensate(completedSteps.reverse(), orderData, context);
        throw new Error('Saga failed: ' + error.message);
      }
    }

    return context;
  }

  async compensate(steps, orderData, context) {
    for (const stepIndex of steps) {
      const compensation = this.steps[stepIndex].compensation;
      if (compensation) {
        try {
          await compensation.call(this, orderData, context);
        } catch (error) {
          console.error(`Compensation for step ${stepIndex} failed:`, error);
          // Alert operations team for manual intervention
        }
      }
    }
  }

  async createOrder(data, ctx) {
    const order = await this.orderService.create(data);
    ctx.orderId = order.id;
  }

  async cancelOrder(data, ctx) {
    await this.orderService.cancel(ctx.orderId);
  }

  async reserveStock(data, ctx) {
    const reservation = await this.inventoryService.reserve(ctx.orderId, data.items);
    ctx.stockReservationId = reservation.id;
  }

  async releaseStock(data, ctx) {
    await this.inventoryService.release(ctx.stockReservationId);
  }

  async processPayment(data, ctx) {
    const payment = await this.paymentService.process(ctx.orderId, data.amount);
    ctx.paymentId = payment.id;
  }

  async refundPayment(data, ctx) {
    await this.paymentService.refund(ctx.paymentId);
  }

  async confirmOrder(data, ctx) {
    await this.orderService.confirm(ctx.orderId);
  }
}
```

## System Design Interview Framework

In interviews, system design questions typically need to be completed in 45-60 minutes.

### Time Allocation

```
┌─────────────────────────────────────────────────────────────┐
│  Requirements Clarification (5-10 minutes)                  │
├─────────────────────────────────────────────────────────────┤
│  High-Level Design (10-15 minutes)                          │
├─────────────────────────────────────────────────────────────┤
│  Deep Dive Design (20-25 minutes)                           │
├─────────────────────────────────────────────────────────────┤
│  Wrap Up & Extensions (5-10 minutes)                        │
└─────────────────────────────────────────────────────────────┘
```

### Common Interview Questions

1. **Design a URL Shortener**
   - Key points: Hash algorithm, distributed ID, caching strategy

2. **Design a Message Queue**
   - Key points: Message persistence, delivery semantics, ordering guarantees

3. **Design a Distributed Cache**
   - Key points: Consistent hashing, data sharding, eviction policies

4. **Design a Social News Feed**
   - Key points: Push vs pull model, timeline merging, hot data handling

5. **Design a Flash Sale System**
   - Key points: Rate limiting, inventory deduction, queue-based peak shaving

## Interview Key Points

### Communication Skills

1. **Proactively clarify requirements**: Don't assume, ask questions
2. **Explain trade-offs**: Articulate why you chose A over B
3. **Start simple**: Design MVP first, then iterate
4. **Use diagrams**: Architecture diagrams help convey ideas
5. **Quantify estimates**: Provide concrete numbers

### Common Pitfalls

| Pitfall | How to Avoid |
|---------|--------------|
| Jumping straight to code | First clarify requirements and high-level design |
| Over-engineering | Meet requirements without unnecessary complexity |
| Ignoring non-functional requirements | Proactively ask about performance, availability |
| Silent too long | Think aloud, let interviewer follow your thought process |
| Only discussing tech, not business | Connect technical choices to business context |

### Evaluation Criteria

Interviewers typically evaluate on:

- **Problem Analysis**: Can you accurately understand and decompose problems?
- **Technical Depth**: How well do you understand core technologies?
- **Trade-off Ability**: Can you make reasonable choices among alternatives?
- **Communication**: Can you clearly express design ideas?
- **Scalability Thinking**: Do you consider future extension needs?

### Back-of-the-Envelope Calculations

Essential estimates for system design:

```
Common Metrics to Know:

Read/Write Ratio: Typically 10:1 to 100:1 for read-heavy systems

Storage Calculations:
- 1 ASCII character = 1 byte
- 1 million users x 1KB profile = 1 GB
- 1 billion users x 1KB profile = 1 TB

QPS Estimations:
- 100 million daily users
- Average 10 requests per user per day
- = 1 billion requests per day
- = 1 billion / 86400 seconds
- = ~12,000 QPS average
- Peak QPS typically 2-3x average = ~30,000 QPS

Latency Numbers:
- L1 cache: 0.5 ns
- L2 cache: 7 ns
- Main memory: 100 ns
- SSD random read: 150 microseconds
- HDD seek: 10 ms
- Round-trip same datacenter: 0.5 ms
- Round-trip cross-continent: 150 ms
```

## Further Reading

### Classic Books

- **"Designing Data-Intensive Applications"** - Martin Kleppmann
  - Comprehensive coverage of distributed systems fundamentals

- **"System Design Interview"** - Alex Xu
  - Practical guide with step-by-step design examples

- **"Building Microservices"** - Sam Newman
  - Essential guide to microservices architecture

- **"The Art of Scalability"** - Martin Abbott & Michael Fisher
  - Scale cube and organizational scaling patterns

### Online Resources

- [System Design Primer](https://github.com/donnemartin/system-design-primer) - Most popular system design learning resource on GitHub
- [High Scalability](http://highscalability.com/) - Real-world architecture case studies
- [Martin Fowler's Blog](https://martinfowler.com/) - Authoritative articles on architecture patterns
- [AWS Architecture Center](https://aws.amazon.com/architecture/) - Cloud architecture best practices
- [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework) - Enterprise architecture guidance

### Practice Platforms

1. Read architecture documentation of open-source projects
2. Analyze tech blogs from major companies (Netflix, Uber, Airbnb)
3. Participate in architecture discussions in open-source communities
4. Apply learned concepts in real-world work

## Summary

System design is a skill that requires continuous practice. Key takeaways:

1. **No perfect design exists**: Only designs suited to specific contexts
2. **Trade-offs are central**: Performance vs cost, consistency vs availability
3. **Start from requirements**: Deep understanding of business needs is the foundation
4. **Evolve iteratively**: System architecture should evolve with business growth
5. **Measure everything**: Use data to drive design decisions

Mastering system design helps in interviews and enhances your daily architectural capabilities, making you a more effective engineer. The best system designers combine theoretical knowledge with practical experience, always learning from production systems and continuously refining their approach.

Remember: good system design is about finding the right balance between simplicity and capability, between current needs and future scalability, and between ideal solutions and practical constraints.
