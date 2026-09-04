---
title: Redis Complete Guide
description: Master Redis in-memory data store for caching and real-time applications
track: backend
section: databases
difficulty: intermediate
tags:
  - Redis
  - Cache
  - NoSQL
  - In-memory
status: imported
origin: old/src/content/docs/backend/redis-guide.en.md
divergence: 0.251
issues:
  - order-mismatch
legacy:
  category: Backend
  subcategory: Database
  order: 13
  lastUpdated: 2026-01-07
---

## Introduction

Redis (Remote Dictionary Server) is an open-source, in-memory data structure store that serves as a database, cache, message broker, and streaming engine. Originally created by Salvatore Sanfilippo in 2009, Redis has become one of the most popular NoSQL databases due to its exceptional performance, versatility, and rich feature set.

### Core Characteristics

- **High Performance**: With all data residing in memory and a single-threaded event loop, Redis can handle 100,000+ operations per second
- **Rich Data Structures**: Supports Strings, Lists, Sets, Hashes, Sorted Sets, Streams, Bitmaps, and HyperLogLogs
- **Atomic Operations**: All operations are atomic, with support for transactions and Lua scripting
- **Persistence**: Offers RDB snapshots and AOF (Append Only File) for data durability
- **High Availability**: Supports master-replica replication, Sentinel for automatic failover, and Redis Cluster for horizontal scaling
- **Extensibility**: Modules system allows adding custom data types and commands

### Single-Threaded Architecture

Redis uses a single-threaded event loop for command processing. This design choice offers several advantages:

1. No context switching overhead between threads
2. No need for locks or synchronization primitives
3. Simpler, more maintainable codebase
4. Predictable latency characteristics

However, this means you should avoid long-running commands like `KEYS *` on large datasets, as they will block all other operations. Redis 6.0 introduced threaded I/O for network operations, but command execution remains single-threaded.

---

## Data Structures

Redis provides five fundamental data structures plus several advanced types, each optimized for specific use cases.

### Strings

Strings are the most basic Redis data type, capable of storing text, integers, or binary data up to 512MB.

```bash
# Basic operations
SET name "redis"
GET name

# Set with expiration (seconds)
SETEX session:123 3600 "user_data"

# Set with expiration (milliseconds)
PSETEX temp:key 60000 "temporary"

# Atomic increment/decrement
INCR counter
INCRBY counter 10
DECR counter
INCRBYFLOAT price 0.5

# Batch operations
MSET key1 "value1" key2 "value2"
MGET key1 key2

# Set only if key doesn't exist (useful for distributed locks)
SETNX lock:resource "holder_id"

# Set with options (NX=not exists, XX=exists, EX=seconds)
SET lock:resource "holder" NX EX 10
```

**Internal Implementation**: Redis uses SDS (Simple Dynamic String) instead of C strings, providing:
- O(1) length retrieval
- Buffer overflow protection
- Reduced memory reallocations
- Binary safety

**Use Cases**: Caching objects, counters, rate limiters, distributed locks, session storage

### Lists

Lists are doubly-linked lists of strings, supporting O(1) insertions and deletions at both ends.

```bash
# Push from left/right
LPUSH mylist "a" "b" "c"
RPUSH mylist "x" "y" "z"

# Pop from left/right
LPOP mylist
RPOP mylist

# Get range of elements
LRANGE mylist 0 -1

# Get list length
LLEN mylist

# Blocking pop (useful for message queues)
BLPOP queue 30
BRPOP queue 30

# Move element between lists atomically
RPOPLPUSH source destination
LMOVE source destination LEFT RIGHT

# Get element by index
LINDEX mylist 0

# Trim list to specified range
LTRIM mylist 0 99
```

**Internal Implementation**: Redis uses quicklist (a linked list of ziplists) since version 3.2, combining memory efficiency with fast operations.

**Use Cases**: Message queues, activity feeds, recent items lists, task queues

### Hashes

Hashes store field-value pairs, ideal for representing objects with multiple attributes.

```bash
# Set/get fields
HSET user:1001 name "John" age 25 city "New York"
HGET user:1001 name
HGETALL user:1001

# Batch operations
HMSET user:1002 name "Jane" age 30
HMGET user:1002 name age

# Increment field value
HINCRBY user:1001 age 1
HINCRBYFLOAT user:1001 balance 10.50

# Check field existence
HEXISTS user:1001 email

# Get all fields/values
HKEYS user:1001
HVALS user:1001

# Get number of fields
HLEN user:1001

# Delete fields
HDEL user:1001 city
```

**Internal Implementation**: Small hashes use ziplist encoding; larger ones use hash tables.

**Use Cases**: User profiles, product details, configuration settings, session data

### Sets

Sets are unordered collections of unique strings with O(1) membership testing.

```bash
# Add/remove elements
SADD tags "redis" "database" "nosql"
SREM tags "nosql"

# Check membership
SISMEMBER tags "redis"

# Get all members
SMEMBERS tags

# Set operations
SINTER set1 set2        # Intersection
SUNION set1 set2        # Union
SDIFF set1 set2         # Difference

# Store operation results
SINTERSTORE dest set1 set2

# Get set size
SCARD tags

# Random elements
SRANDMEMBER tags 2
SPOP tags               # Random pop
```

**Internal Implementation**: Small sets of integers use intset; otherwise, hash tables are used.

**Use Cases**: Tags, unique visitors, social connections, voting systems, lottery systems

### Sorted Sets

Sorted Sets combine set uniqueness with ordered elements, where each member has an associated score.

```bash
# Add elements with scores
ZADD leaderboard 100 "player:1" 85 "player:2" 95 "player:3"

# Get rank (0-indexed, low to high)
ZRANK leaderboard "player:1"
# Get rank (high to low)
ZREVRANK leaderboard "player:1"

# Get by rank range
ZRANGE leaderboard 0 2 WITHSCORES
ZREVRANGE leaderboard 0 2 WITHSCORES

# Get by score range
ZRANGEBYSCORE leaderboard 80 100
ZRANGEBYSCORE leaderboard -inf +inf LIMIT 0 10

# Increment score
ZINCRBY leaderboard 10 "player:2"

# Get cardinality
ZCARD leaderboard

# Count by score range
ZCOUNT leaderboard 80 100

# Remove elements
ZREM leaderboard "player:2"
ZREMRANGEBYRANK leaderboard 0 1
ZREMRANGEBYSCORE leaderboard 0 50
```

**Internal Implementation**: Uses skip list combined with a hash table, providing O(log N) insertions and lookups with O(1) score retrieval.

**Use Cases**: Leaderboards, priority queues, time-series data, rate limiting with sliding windows

### Streams

Introduced in Redis 5.0, Streams are append-only log structures designed for message streaming with consumer groups.

```bash
# Add messages
XADD mystream * field1 value1 field2 value2

# Read messages
XREAD COUNT 10 STREAMS mystream 0
XREAD BLOCK 5000 STREAMS mystream $

# Create consumer group
XGROUP CREATE mystream mygroup $ MKSTREAM

# Read as consumer in group
XREADGROUP GROUP mygroup consumer1 COUNT 1 STREAMS mystream >

# Acknowledge message
XACK mystream mygroup 1526569495631-0

# Get stream info
XINFO STREAM mystream
XINFO GROUPS mystream
XINFO CONSUMERS mystream mygroup

# Get stream length
XLEN mystream

# Trim stream
XTRIM mystream MAXLEN 1000
```

**Use Cases**: Event sourcing, activity streams, log aggregation, real-time messaging

---

## Pub/Sub Messaging

Redis Pub/Sub implements the publish-subscribe messaging paradigm for real-time communication.

### Basic Operations

```bash
# Subscribe to channels
SUBSCRIBE news sports weather

# Subscribe with pattern matching
PSUBSCRIBE news:* sports:*

# Publish messages
PUBLISH news "Breaking news!"

# Unsubscribe
UNSUBSCRIBE news
PUNSUBSCRIBE news:*
```

### Implementation Example

```python
import redis

# Publisher
def publish_message(channel, message):
    r = redis.Redis()
    r.publish(channel, message)

# Subscriber
def subscribe_channel(channel):
    r = redis.Redis()
    pubsub = r.pubsub()
    pubsub.subscribe(channel)

    for message in pubsub.listen():
        if message['type'] == 'message':
            print(f"Received: {message['data']}")
```

**Limitations**:
- Messages are fire-and-forget (no persistence)
- No message acknowledgment
- Subscribers must be connected to receive messages

For more robust messaging, consider using Redis Streams or dedicated message brokers.

---

## Transactions

Redis transactions group multiple commands for atomic execution using MULTI/EXEC blocks.

### Basic Transactions

```bash
# Start transaction
MULTI

# Queue commands
SET key1 "value1"
SET key2 "value2"
INCR counter

# Execute all commands atomically
EXEC

# Or discard the transaction
DISCARD
```

### Optimistic Locking with WATCH

```bash
WATCH mykey
val = GET mykey
val = val + 1
MULTI
SET mykey val
EXEC
# EXEC returns nil if mykey changed since WATCH
```

### Implementation Example

```python
import redis

def transfer_funds(from_account, to_account, amount):
    r = redis.Redis()

    with r.pipeline() as pipe:
        while True:
            try:
                # Watch both accounts
                pipe.watch(from_account, to_account)

                from_balance = int(pipe.get(from_account) or 0)
                if from_balance < amount:
                    pipe.unwatch()
                    return False

                # Start transaction
                pipe.multi()
                pipe.decrby(from_account, amount)
                pipe.incrby(to_account, amount)
                pipe.execute()
                return True

            except redis.WatchError:
                # Retry if watched keys changed
                continue
```

**Note**: Redis transactions do not support rollback. If a command fails during EXEC, other commands still execute.

---

## Persistence

Redis offers two persistence mechanisms to ensure data durability across restarts.

### RDB (Redis Database)

RDB creates point-in-time snapshots of the dataset at specified intervals.

**Configuration**:

```bash
# redis.conf
save 900 1      # Save if 1+ changes in 900 seconds
save 300 10     # Save if 10+ changes in 300 seconds
save 60 10000   # Save if 10000+ changes in 60 seconds

dbfilename dump.rdb
dir /var/lib/redis

# Compression and checksum
rdbcompression yes
rdbchecksum yes
```

**Trigger Methods**:
- Automatic: Based on save configuration
- Manual: `SAVE` (blocking) or `BGSAVE` (background)
- Shutdown: Automatic RDB save on graceful shutdown

**Advantages**:
- Compact single-file backup
- Fast recovery for large datasets
- Minimal performance impact (fork-based)

**Disadvantages**:
- Potential data loss between snapshots
- Fork can be slow with large datasets on systems with limited memory

### AOF (Append Only File)

AOF logs every write operation, allowing complete data reconstruction.

**Configuration**:

```bash
# redis.conf
appendonly yes
appendfilename "appendonly.aof"

# Sync policies
appendfsync always    # Sync every command (safest, slowest)
appendfsync everysec  # Sync every second (recommended)
appendfsync no        # OS decides when to sync (fastest)
```

**AOF Rewriting**:

As the AOF file grows, Redis can rewrite it to contain only the minimal commands needed:

```bash
# Manual rewrite
BGREWRITEAOF

# Automatic rewrite configuration
auto-aof-rewrite-percentage 100  # Rewrite when 100% larger
auto-aof-rewrite-min-size 64mb   # Minimum size for rewrite
```

**Advantages**:
- Higher data safety (minimal loss with everysec)
- Human-readable format
- Recoverable from partial corruption

**Disadvantages**:
- Larger file size than RDB
- Slower recovery
- Slight write performance impact

### Hybrid Persistence

Redis 4.0+ supports combining RDB and AOF in a single file:

```bash
aof-use-rdb-preamble yes
```

The rewritten AOF file contains an RDB snapshot prefix followed by AOF commands, combining fast loading with recent durability.

---

## Clustering

Redis provides multiple approaches for scaling and high availability.

### Master-Replica Replication

```bash
# On replica server
replicaof 192.168.1.100 6379

# Or at runtime
REPLICAOF 192.168.1.100 6379

# View replication status
INFO replication
```

**Replication Process**:
1. Replica sends PSYNC command
2. Master performs BGSAVE, creating RDB
3. Master sends RDB to replica
4. Master sends buffered write commands
5. Replica loads RDB and applies commands

### Sentinel (Automatic Failover)

Sentinel monitors master-replica setups and performs automatic failover.

```bash
# sentinel.conf
sentinel monitor mymaster 192.168.1.100 6379 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
sentinel parallel-syncs mymaster 1
```

**Sentinel Workflow**:
1. Sentinels ping master/replicas
2. If master doesn't respond, mark as subjectively down
3. When quorum agrees, mark as objectively down
4. Elect leader sentinel
5. Leader promotes replica to master
6. Notify clients of new master

### Redis Cluster

Redis Cluster provides automatic sharding across multiple nodes with built-in replication.

```bash
# Create cluster (minimum 6 nodes: 3 masters + 3 replicas)
redis-cli --cluster create \
  192.168.1.101:6379 192.168.1.102:6379 192.168.1.103:6379 \
  192.168.1.104:6379 192.168.1.105:6379 192.168.1.106:6379 \
  --cluster-replicas 1
```

**Data Distribution**:
- 16384 hash slots distributed across masters
- Keys mapped to slots using CRC16 algorithm
- Each master handles a subset of slots

```bash
# Check slot for a key
CLUSTER KEYSLOT mykey

# Cluster information
CLUSTER INFO
CLUSTER NODES
```

**Cluster Limitations**:
- Multi-key operations require keys in same slot
- Only database 0 supported
- Transactions limited to same node

```bash
# Use hash tags to ensure keys are on same node
SET {user:1000}.name "John"
SET {user:1000}.email "john@example.com"
```

---

## Common Use Cases

### Caching

The most common Redis use case is caching database queries or API responses:

```python
import redis
import json

r = redis.Redis()

def get_user(user_id):
    cache_key = f"user:{user_id}"

    # Try cache first
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    # Cache miss - query database
    user = db.query_user(user_id)
    if user:
        # Cache with 1-hour expiration
        r.setex(cache_key, 3600, json.dumps(user))

    return user
```

### Distributed Locking

```python
import redis
import uuid
import time

def acquire_lock(lock_name, timeout=10):
    r = redis.Redis()
    lock_key = f"lock:{lock_name}"
    identifier = str(uuid.uuid4())

    if r.set(lock_key, identifier, nx=True, ex=timeout):
        return identifier
    return None

def release_lock(lock_name, identifier):
    r = redis.Redis()
    lock_key = f"lock:{lock_name}"

    # Use Lua script for atomic check-and-delete
    script = """
    if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
    else
        return 0
    end
    """
    return r.execute_command('EVAL', script, 1, lock_key, identifier)
```

For production use, consider the Redlock algorithm or libraries like Redisson.

### Rate Limiting

```python
def is_rate_limited(user_id, limit=100, window=60):
    r = redis.Redis()
    key = f"rate:{user_id}"

    current = r.incr(key)
    if current == 1:
        r.expire(key, window)

    return current > limit
```

### Session Storage

```python
def save_session(session_id, data, ttl=3600):
    r = redis.Redis()
    r.hset(f"session:{session_id}", mapping=data)
    r.expire(f"session:{session_id}", ttl)

def get_session(session_id):
    r = redis.Redis()
    return r.hgetall(f"session:{session_id}")
```

### Leaderboards

```python
def update_score(user_id, score):
    r = redis.Redis()
    r.zadd("leaderboard", {user_id: score})

def get_top_players(n=10):
    r = redis.Redis()
    return r.zrevrange("leaderboard", 0, n-1, withscores=True)

def get_user_rank(user_id):
    r = redis.Redis()
    rank = r.zrevrank("leaderboard", user_id)
    return rank + 1 if rank is not None else None
```

---

## Best Practices

### Memory Management

```bash
# Set maximum memory
maxmemory 4gb

# Configure eviction policy
maxmemory-policy allkeys-lru
```

**Eviction Policies**:
| Policy | Description |
|--------|-------------|
| noeviction | Return errors when memory limit reached (default) |
| allkeys-lru | Evict least recently used keys |
| volatile-lru | Evict LRU keys with expiration set |
| allkeys-lfu | Evict least frequently used keys |
| volatile-lfu | Evict LFU keys with expiration set |
| allkeys-random | Evict random keys |
| volatile-random | Evict random keys with expiration |
| volatile-ttl | Evict keys with shortest TTL |

### Key Naming Conventions

- Use colons as separators: `user:1000:profile`
- Keep names short but descriptive
- Use consistent naming across your application
- Avoid special characters and spaces

### Avoiding Common Pitfalls

1. **Avoid blocking commands on production**: Don't use `KEYS *`, prefer `SCAN`
2. **Set appropriate TTLs**: Prevent unbounded memory growth
3. **Use pipelining**: Batch multiple commands to reduce round trips
4. **Monitor slow queries**: Configure `slowlog-log-slower-than`
5. **Handle connection pooling**: Reuse connections in your application

### Cache Consistency Patterns

**Cache-Aside Pattern**:
```python
def get_data(key):
    data = cache.get(key)
    if data is None:
        data = db.get(key)
        cache.set(key, data, ttl=3600)
    return data
```

**Cache Invalidation**:
- Update database first, then delete cache
- Use delayed double-delete for high-concurrency scenarios
- Consider eventual consistency with message queues

---

## Interview Key Points

### Frequently Asked Questions

1. **Why is Redis so fast?**
   - In-memory operations
   - Single-threaded event loop (no locking)
   - Efficient data structures
   - I/O multiplexing (epoll/kqueue)

2. **Redis vs Memcached?**
   - Redis: Rich data types, persistence, clustering, Lua scripting
   - Memcached: Multi-threaded, simpler, pure caching use case

3. **How to handle cache penetration?**
   - Cache null values with short TTL
   - Use Bloom filters to check existence
   - Rate limit requests for non-existent keys

4. **How to handle cache stampede/breakdown?**
   - Use distributed locks for rebuilding
   - Implement logical expiration with background refresh
   - Pre-warm cache before expiration

5. **How to handle cache avalanche?**
   - Randomize TTLs to prevent simultaneous expiration
   - Implement multi-level caching
   - Use circuit breakers and rate limiting

6. **How to ensure cache-database consistency?**
   - Cache-aside with delete-on-write
   - Subscribe to database binlog for async updates
   - Accept eventual consistency for most use cases

### Production Considerations

- Disable dangerous commands: `rename-command FLUSHALL ""`
- Enable authentication: `requirepass your_password`
- Configure proper `maxmemory` and eviction policies
- Set up monitoring for memory, connections, and hit rate
- Implement regular RDB/AOF backups
- Use TLS for encrypted connections

---

## Further Reading

### Official Resources

- [Redis Documentation](https://redis.io/docs/)
- [Redis Commands Reference](https://redis.io/commands/)
- [Redis GitHub Repository](https://github.com/redis/redis)

### Recommended Books

- *Redis in Action* by Josiah Carlson
- *Mastering Redis* by Jeremy Nelson
- *Redis Essentials* by Maxwell Dayvson Da Silva

### Related Tools

- **Redis Insight**: Official GUI management tool
- **RedisBloom**: Probabilistic data structures module
- **RedisJSON**: Native JSON support module
- **RedisTimeSeries**: Time-series data module
- **Redisson**: Java client with distributed objects
- **ioredis**: Feature-rich Node.js client

### Advanced Topics

- Redis Module development
- Redis source code analysis
- Performance tuning and benchmarking
- Security hardening
- Redis on Kubernetes deployment

---

## Conclusion

Redis is a versatile, high-performance data store that excels in caching, real-time analytics, messaging, and many other use cases. Its rich set of data structures, combined with features like persistence, replication, and clustering, make it suitable for both simple caching scenarios and complex distributed systems.

Key takeaways:
- Choose the right data structure for your use case
- Configure persistence based on your durability requirements
- Plan for high availability with Sentinel or Cluster
- Follow best practices for memory management and key design
- Monitor and tune your Redis deployment continuously

As you continue working with Redis, explore its module ecosystem and stay updated with new features in each release. The combination of simplicity and power makes Redis an essential tool in modern application development.
