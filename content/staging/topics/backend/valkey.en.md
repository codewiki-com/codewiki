---
title: Valkey (Redis Alternative)
description: A comprehensive guide to Valkey - the Linux Foundation fork of Redis with open-source BSD license
track: backend
section: databases
difficulty: intermediate
tags:
  - Valkey
  - Redis
  - In-Memory Database
  - Caching
  - Key-Value Store
status: imported
origin: old/src/content/docs/backend/valkey.en.md
divergence: 0.217
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 36
  lastUpdated: 2026-01-20
---

Valkey is an open-source, high-performance, in-memory data structure store that emerged as a community-driven fork of Redis 7.2.4. Backed by the Linux Foundation and major technology companies, Valkey maintains the original BSD 3-clause license, ensuring it remains truly open source. Whether you're building caching systems, message queues, or real-time applications, Valkey provides the performance and reliability you need with the freedom of genuine open-source software.

## The Birth of Valkey: Understanding the Context

### The Redis License Change

In March 2024, Redis Inc. made a significant change to its licensing strategy. The company moved from the permissive BSD 3-clause license to a dual-license model combining the Redis Source Available License (RSALv2) and Server Side Public License (SSPLv1). While the source code remained accessible, these licenses imposed restrictions on:

- Cloud providers offering Redis as a managed service
- Companies embedding Redis in commercial products
- Competitors building Redis-compatible services

This change sparked concerns within the open-source community about the future accessibility and freedom of Redis.

### Valkey's Formation

In response, the Linux Foundation announced Valkey in March 2024, forking from Redis 7.2.4. The project received immediate backing from major technology companies:

| Supporter | Role |
|-----------|------|
| Linux Foundation | Project governance and stewardship |
| Amazon Web Services | Development and managed service (ElastiCache) |
| Google Cloud | Development support |
| Oracle | Development support |
| Ericsson | Enterprise adoption |
| Snap Inc. | Production usage |

### Valkey vs Redis: Key Differences

| Aspect | Valkey | Redis (post-2024) |
|--------|--------|-------------------|
| License | BSD 3-clause | RSALv2 + SSPLv1 (AGPLv3 option added May 2025) |
| Governance | Linux Foundation | Redis Inc. |
| Base Version | Fork of Redis 7.2.4 | Continued development |
| Command Compatibility | 100% compatible | N/A |
| Community | Open contribution model | Corporate-controlled |

## Core Principles and Architecture

### In-Memory Data Model

Valkey stores all data in memory, providing sub-millisecond response times. The architecture consists of:

```
+----------------------------------------------------------+
|                    Valkey Server                          |
+----------------------------------------------------------+
|  +-----------+  +-----------+  +-----------+             |
|  |  Strings  |  |   Lists   |  |   Sets    |             |
|  +-----------+  +-----------+  +-----------+             |
|  +-----------+  +-----------+  +-----------+             |
|  |  Hashes   |  |Sorted Sets|  |  Streams  |             |
|  +-----------+  +-----------+  +-----------+             |
|  +-----------+  +-----------+  +-----------+             |
|  |  Bitmaps  |  |HyperLogLog|  | Geospatial|             |
|  +-----------+  +-----------+  +-----------+             |
+----------------------------------------------------------+
|              Event Loop (Single-Threaded Core)            |
+----------------------------------------------------------+
|  +--------------------+  +-------------------------+     |
|  |   I/O Threads      |  |   Background Threads    |     |
|  |   (Read/Write)     |  |   (Persistence/Cleanup) |     |
|  +--------------------+  +-------------------------+     |
+----------------------------------------------------------+
```

### Supported Data Structures

Valkey provides native support for multiple data structures:

**Strings**: Basic key-value storage for text, numbers, or binary data

```shell
127.0.0.1:6379> SET greeting "Hello, Valkey!"
OK
127.0.0.1:6379> GET greeting
"Hello, Valkey!"
127.0.0.1:6379> INCR counter
(integer) 1
127.0.0.1:6379> INCRBY counter 10
(integer) 11
```

**Lists**: Ordered collections supporting push/pop operations

```shell
127.0.0.1:6379> LPUSH tasks "task1" "task2" "task3"
(integer) 3
127.0.0.1:6379> LRANGE tasks 0 -1
1) "task3"
2) "task2"
3) "task1"
127.0.0.1:6379> RPOP tasks
"task1"
```

**Sets**: Unordered collections of unique elements

```shell
127.0.0.1:6379> SADD tags "valkey" "database" "caching"
(integer) 3
127.0.0.1:6379> SMEMBERS tags
1) "caching"
2) "database"
3) "valkey"
127.0.0.1:6379> SISMEMBER tags "valkey"
(integer) 1
```

**Hashes**: Field-value pairs ideal for representing objects

```shell
127.0.0.1:6379> HSET user:1000 name "Alice" email "alice@example.com" age "30"
(integer) 3
127.0.0.1:6379> HGET user:1000 name
"Alice"
127.0.0.1:6379> HGETALL user:1000
1) "name"
2) "Alice"
3) "email"
4) "alice@example.com"
5) "age"
6) "30"
```

**Sorted Sets**: Ordered sets with scores for ranking

```shell
127.0.0.1:6379> ZADD leaderboard 100 "player1" 200 "player2" 150 "player3"
(integer) 3
127.0.0.1:6379> ZRANGE leaderboard 0 -1 WITHSCORES
1) "player1"
2) "100"
3) "player3"
4) "150"
5) "player2"
6) "200"
127.0.0.1:6379> ZREVRANK leaderboard "player2"
(integer) 0
```

### Persistence Mechanisms

Valkey offers two persistence options:

**RDB (Redis Database Backup)**: Point-in-time snapshots

```conf
# valkey.conf
save 900 1      # Save after 900 seconds if at least 1 key changed
save 300 10     # Save after 300 seconds if at least 10 keys changed
save 60 10000   # Save after 60 seconds if at least 10000 keys changed

dbfilename dump.rdb
dir /var/lib/valkey
```

**AOF (Append-Only File)**: Write log of all operations

```conf
# valkey.conf
appendonly yes
appendfilename "appendonly.aof"

# Sync options: always, everysec, no
appendfsync everysec

# Auto-rewrite configuration
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

**Hybrid Persistence** (Recommended for production):

```conf
# Enable both RDB and AOF
save 900 1
appendonly yes
aof-use-rdb-preamble yes  # Uses RDB for faster loading with AOF for durability
```

### Replication Architecture

Valkey supports asynchronous primary-replica replication:

```
+-----------+     Async Replication    +-----------+
|  Primary  | ---------------------->  | Replica 1 |
|  (Write)  |                          |  (Read)   |
+-----------+                          +-----------+
      |
      |         Async Replication      +-----------+
      +------------------------------> | Replica 2 |
                                       |  (Read)   |
                                       +-----------+
```

Configure replication in replica's configuration:

```conf
# On replica server
replicaof 192.168.1.100 6379

# Optional: Read-only replica (recommended)
replica-read-only yes

# Authentication if primary requires password
masterauth your_password
```

Or configure dynamically:

```shell
valkey-cli> REPLICAOF 192.168.1.100 6379
OK
valkey-cli> INFO REPLICATION
# Replication
role:slave
master_host:192.168.1.100
master_port:6379
master_link_status:up
```

### Cluster Mode

Valkey Cluster provides automatic data sharding across multiple nodes:

```
+----------------------------------------------------------+
|                    Valkey Cluster                         |
+----------------------------------------------------------+
|  Node 1 (Primary)     Node 2 (Primary)     Node 3 (Primary)
|  Slots: 0-5460        Slots: 5461-10922    Slots: 10923-16383
|       |                     |                    |
|       v                     v                    v
|  Node 1 (Replica)     Node 2 (Replica)     Node 3 (Replica)
+----------------------------------------------------------+
```

Cluster configuration:

```conf
# valkey.conf for cluster node
port 6379
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
```

## Key Features and Configuration

### Installation

**From Source:**

```bash
# Clone the repository
git clone https://github.com/valkey-io/valkey.git
cd valkey

# Build
make

# Run tests (optional)
make test

# Install
sudo make install
```

**Using Docker:**

```bash
# Pull the official image
docker pull valkey/valkey:latest

# Run a container
docker run -d --name valkey -p 6379:6379 valkey/valkey

# Run with custom configuration
docker run -d \
  -v /path/to/valkey.conf:/usr/local/etc/valkey/valkey.conf \
  --name valkey \
  -p 6379:6379 \
  valkey/valkey valkey-server /usr/local/etc/valkey/valkey.conf
```

**Using Package Managers:**

```bash
# Ubuntu/Debian (via Valkey PPA)
sudo add-apt-repository ppa:valkey/valkey
sudo apt-get update
sudo apt-get install valkey

# macOS (Homebrew)
brew tap valkey-io/valkey
brew install valkey

# Start the server
valkey-server
```

### Basic Configuration

```conf
# valkey.conf - Essential settings

# Network
bind 127.0.0.1 -::1
port 6379
protected-mode yes

# Security
requirepass your_strong_password

# Memory Management
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes

# Logging
loglevel notice
logfile /var/log/valkey/valkey.log

# Performance
tcp-keepalive 300
timeout 0
```

### Command Compatibility with Redis

Valkey maintains 100% command compatibility with Redis 7.2.4. All existing Redis commands work without modification:

```shell
# All standard commands work identically
SET key value
GET key
HSET hash field value
LPUSH list value
ZADD sortedset score member
PUBLISH channel message
SUBSCRIBE channel
```

### Valkey 8.0+ New Features

Valkey 8.0 introduced significant improvements:

**Enhanced I/O Threading:**

```conf
# Enable multi-threaded I/O
io-threads 4
io-threads-do-reads yes
```

**RDMA Support (Experimental):**

```conf
# Remote Direct Memory Access for high-performance networking
rdma-enabled yes
rdma-port 6380
```

**Per-Slot Metrics:**

```shell
# Get detailed metrics for cluster slots
CLUSTER SLOT-STATS SLOTSRANGE 0 16383
```

### Migration from Redis

**Step 1: Set Up Valkey Instance**

```bash
# valkey.conf
port 6379
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
```

```bash
docker run -d \
  -v myvalkey/conf:/usr/local/etc/valkey \
  --name valkey-1 \
  --net mynetwork \
  valkey/valkey valkey-server /usr/local/etc/valkey/valkey.conf
```

**Step 2: Configure Replication from Redis**

```bash
docker exec -it myvalkey valkey-cli
valkey 127.0.0.1:6379> REPLICAOF 172.17.0.2 6379
OK
```

**Step 3: Verify Synchronization**

```bash
valkey 127.0.0.1:6379> INFO REPLICATION
# Replication
role:slave
master_host:172.17.0.2
master_port:6379
master_link_status:up
master_last_io_seconds_ago:4
master_sync_in_progress:0
```

**Step 4: Promote Valkey to Primary**

```bash
valkey 127.0.0.1:6379> REPLICAOF NO ONE
OK
```

**Step 5: Update Application Connection Strings**

```python
# Before (Redis)
redis_client = redis.Redis(host='redis-server', port=6379)

# After (Valkey) - Same API, just update host
valkey_client = redis.Redis(host='valkey-server', port=6379)
```

## Code Examples

### Python with Valkey GLIDE

**Installation:**

```bash
pip install valkey-glide
```

**Standalone Connection:**

```python
import asyncio
from glide import GlideClientConfiguration, NodeAddress, GlideClient

async def main():
    # Configure connection
    addresses = [
        NodeAddress("localhost", 6379)
    ]
    config = GlideClientConfiguration(
        addresses,
        request_timeout=500  # 500ms timeout
    )

    # Create client
    client = await GlideClient.create(config)

    try:
        # Basic operations
        await client.set("user:session:123", "active")
        status = await client.get("user:session:123")
        print(f"Session status: {status}")  # Output: Session status: active

        # Set with expiration
        await client.set("cache:data", "temporary", ex=3600)  # Expires in 1 hour

        # Hash operations
        await client.hset("user:1000", {"name": "Alice", "email": "alice@example.com"})
        user_name = await client.hget("user:1000", "name")
        print(f"User name: {user_name}")  # Output: User name: Alice

        # List operations
        await client.lpush("queue:tasks", ["task1", "task2", "task3"])
        task = await client.rpop("queue:tasks")
        print(f"Processing: {task}")  # Output: Processing: task1

    finally:
        client.close()

asyncio.run(main())
```

**Cluster Connection:**

```python
import asyncio
from glide import GlideClusterClientConfiguration, NodeAddress, GlideClusterClient

async def cluster_example():
    addresses = [
        NodeAddress("node1.example.com", 6379),
        NodeAddress("node2.example.com", 6379),
        NodeAddress("node3.example.com", 6379)
    ]

    config = GlideClusterClientConfiguration(
        addresses,
        request_timeout=500
    )

    client = await GlideClusterClient.create(config)

    try:
        # Cluster-aware operations
        await client.set("distributed:key", "value")
        result = await client.get("distributed:key")
        print(f"Cluster result: {result}")

    finally:
        client.close()

asyncio.run(cluster_example())
```

### Python with redis-py (Compatible)

```python
import redis

# redis-py works with Valkey without modification
client = redis.Redis(
    host='localhost',
    port=6379,
    password='your_password',
    decode_responses=True
)

# String operations
client.set('greeting', 'Hello from Valkey!')
print(client.get('greeting'))

# Hash operations
client.hset('product:1', mapping={
    'name': 'Laptop',
    'price': '999.99',
    'stock': '50'
})
product = client.hgetall('product:1')
print(f"Product: {product}")

# Sorted set for leaderboard
client.zadd('leaderboard', {'player1': 100, 'player2': 250, 'player3': 175})
top_players = client.zrevrange('leaderboard', 0, 2, withscores=True)
print(f"Top players: {top_players}")

# Pipeline for batch operations
pipe = client.pipeline()
pipe.set('key1', 'value1')
pipe.set('key2', 'value2')
pipe.get('key1')
pipe.get('key2')
results = pipe.execute()
print(f"Pipeline results: {results}")
```

### Node.js with Valkey GLIDE

**Installation:**

```bash
npm install @valkey/valkey-glide
```

**Usage:**

```typescript
import { GlideClient, GlideClusterClient } from "@valkey/valkey-glide";

// Standalone connection
async function standaloneExample() {
    const client = await GlideClient.createClient({
        addresses: [{ host: "localhost", port: 6379 }],
        requestTimeout: 500,
        useTLS: false
    });

    try {
        // Basic operations
        await client.set("session:token", "abc123xyz");
        const token = await client.get("session:token");
        console.log(`Token: ${token}`);

        // With expiration
        await client.set("cache:result", JSON.stringify({ data: "cached" }), {
            EX: 3600 // 1 hour
        });

        // Hash operations
        await client.hset("user:profile", {
            username: "johndoe",
            created: Date.now().toString()
        });

        const username = await client.hget("user:profile", "username");
        console.log(`Username: ${username}`);

    } finally {
        client.close();
    }
}

// Cluster connection
async function clusterExample() {
    const client = await GlideClusterClient.createClient({
        addresses: [
            { host: "node1.cluster.local", port: 6379 },
            { host: "node2.cluster.local", port: 6379 },
            { host: "node3.cluster.local", port: 6379 }
        ],
        requestTimeout: 500
    });

    try {
        await client.set("distributed:data", "cluster-value");
        const value = await client.get("distributed:data");
        console.log(`Cluster value: ${value}`);
    } finally {
        client.close();
    }
}

standaloneExample().catch(console.error);
```

### Node.js with ioValkey

**Installation:**

```bash
npm install iovalkey
```

**Usage:**

```typescript
import Valkey from "iovalkey";

// Basic connection
const valkey = new Valkey({
    host: "localhost",
    port: 6379,
    password: "your_password"
});

// Event handlers
valkey.on("connect", () => console.log("Connected to Valkey"));
valkey.on("error", (err) => console.error("Valkey error:", err));

// Basic operations
async function basicOperations() {
    await valkey.set("message", "Hello, Valkey!");
    const message = await valkey.get("message");
    console.log(message);

    // With expiration
    await valkey.setex("temp:data", 60, "expires in 60 seconds");

    // Increment
    await valkey.incr("counter");
    await valkey.incrby("counter", 10);
}

// Cluster mode
import Valkey from "iovalkey";

const cluster = new Valkey.Cluster([
    { host: "node1", port: 6379 },
    { host: "node2", port: 6379 },
    { host: "node3", port: 6379 }
]);

cluster.set("cluster:key", "cluster:value");
```

### Java with Valkey GLIDE

**Maven Dependency:**

```xml
<dependency>
    <groupId>io.valkey</groupId>
    <artifactId>valkey-glide</artifactId>
    <version>1.0.0</version>
</dependency>
```

**Usage:**

```java
import glide.api.GlideClient;
import glide.api.GlideClusterClient;
import glide.api.models.configuration.GlideClientConfiguration;
import glide.api.models.configuration.GlideClusterClientConfiguration;
import glide.api.models.configuration.NodeAddress;

import static glide.api.models.GlideString.gs;

public class ValkeyExample {

    public static void main(String[] args) {
        standaloneExample();
        clusterExample();
    }

    private static void standaloneExample() {
        GlideClientConfiguration config = GlideClientConfiguration.builder()
            .address(NodeAddress.builder()
                .host("localhost")
                .port(6379)
                .build())
            .useTLS(false)
            .requestTimeout(500)
            .build();

        try (GlideClient client = GlideClient.createClient(config).get()) {
            // Basic operations
            client.set(gs("java:key"), gs("java:value")).get();
            String value = client.get(gs("java:key")).get().toString();
            System.out.println("Value: " + value);

            // Hash operations
            client.hset(gs("user:java"), Map.of(
                gs("name"), gs("Bob"),
                gs("language"), gs("Java")
            )).get();

            String name = client.hget(gs("user:java"), gs("name")).get().toString();
            System.out.println("Name: " + name);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void clusterExample() {
        GlideClusterClientConfiguration config = GlideClusterClientConfiguration.builder()
            .address(NodeAddress.builder().host("node1").port(6379).build())
            .address(NodeAddress.builder().host("node2").port(6379).build())
            .address(NodeAddress.builder().host("node3").port(6379).build())
            .requestTimeout(500)
            .build();

        try (GlideClusterClient client = GlideClusterClient.createClient(config).get()) {
            client.set(gs("cluster:java"), gs("distributed")).get();
            System.out.println("Cluster operation successful");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### Pub/Sub Pattern

**Publisher:**

```python
import asyncio
from glide import GlideClient, GlideClientConfiguration, NodeAddress

async def publisher():
    config = GlideClientConfiguration([NodeAddress("localhost", 6379)])
    client = await GlideClient.create(config)

    try:
        # Publish messages
        for i in range(10):
            message = f"Event {i}: {asyncio.get_event_loop().time()}"
            subscribers = await client.publish("events:channel", message)
            print(f"Published to {subscribers} subscribers: {message}")
            await asyncio.sleep(1)
    finally:
        client.close()

asyncio.run(publisher())
```

**Subscriber (using redis-py):**

```python
import redis

def subscriber():
    client = redis.Redis(host='localhost', port=6379, decode_responses=True)
    pubsub = client.pubsub()

    # Subscribe to channel
    pubsub.subscribe('events:channel')

    print("Waiting for messages...")
    for message in pubsub.listen():
        if message['type'] == 'message':
            print(f"Received: {message['data']}")

subscriber()
```

### Streams Example

```python
import redis
import time

client = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Producer: Add entries to stream
def produce_events():
    for i in range(5):
        entry_id = client.xadd('mystream', {
            'sensor': 'temp_1',
            'value': str(20 + i),
            'timestamp': str(time.time())
        })
        print(f"Added entry: {entry_id}")
        time.sleep(0.5)

# Consumer: Read from stream
def consume_events():
    # Read all entries
    entries = client.xrange('mystream', '-', '+')
    for entry_id, data in entries:
        print(f"Entry {entry_id}: {data}")

# Consumer group for distributed processing
def setup_consumer_group():
    try:
        client.xgroup_create('mystream', 'mygroup', id='0', mkstream=True)
    except redis.ResponseError:
        pass  # Group already exists

def consume_with_group(consumer_name):
    while True:
        entries = client.xreadgroup(
            groupname='mygroup',
            consumername=consumer_name,
            streams={'mystream': '>'},
            count=1,
            block=5000
        )

        if entries:
            for stream, messages in entries:
                for msg_id, data in messages:
                    print(f"[{consumer_name}] Processing: {data}")
                    # Acknowledge the message
                    client.xack('mystream', 'mygroup', msg_id)
        else:
            print(f"[{consumer_name}] No new messages")

# Run producer and consumer
produce_events()
consume_events()
```

## Best Practices

### Memory Management

**Configure Maximum Memory:**

```conf
# Set memory limit
maxmemory 4gb

# Eviction policies:
# volatile-lru    - Remove least recently used keys with expiration
# allkeys-lru     - Remove least recently used keys (any key)
# volatile-lfu    - Remove least frequently used keys with expiration
# allkeys-lfu     - Remove least frequently used keys (any key)
# volatile-random - Remove random keys with expiration
# allkeys-random  - Remove random keys
# volatile-ttl    - Remove keys with shortest TTL
# noeviction      - Return errors when memory limit reached

maxmemory-policy allkeys-lru

# Sample size for LRU/LFU algorithms
maxmemory-samples 10
```

**Monitor Memory Usage:**

```shell
# Check memory usage
127.0.0.1:6379> INFO memory
# Memory
used_memory:1024000
used_memory_human:1000.00K
used_memory_rss:2048000
used_memory_peak:1500000
maxmemory:4294967296
maxmemory_policy:allkeys-lru

# Analyze key memory usage
127.0.0.1:6379> MEMORY USAGE mykey
(integer) 72
```

**Key Design for Memory Efficiency:**

```python
# Bad: Long, verbose keys
client.set('user:profile:information:details:12345', data)

# Good: Short, meaningful keys
client.set('u:p:12345', data)

# Use hashes to group related data (more memory efficient)
# Instead of:
client.set('user:1000:name', 'Alice')
client.set('user:1000:email', 'alice@example.com')
client.set('user:1000:age', '30')

# Use:
client.hset('user:1000', mapping={
    'name': 'Alice',
    'email': 'alice@example.com',
    'age': '30'
})
```

### Persistence Strategy

**Development Environment:**

```conf
# No persistence for fastest performance
save ""
appendonly no
```

**Production - High Durability:**

```conf
# Frequent snapshots + AOF
save 300 1
save 60 1000

appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes
```

**Production - Performance Priority:**

```conf
# Less frequent snapshots
save 900 1
save 300 10

appendonly no
```

### Cluster Deployment

**Minimum Production Setup:**

```bash
# Create 6 nodes (3 primaries, 3 replicas)
valkey-server --port 7000 --cluster-enabled yes --cluster-config-file nodes-7000.conf
valkey-server --port 7001 --cluster-enabled yes --cluster-config-file nodes-7001.conf
valkey-server --port 7002 --cluster-enabled yes --cluster-config-file nodes-7002.conf
valkey-server --port 7003 --cluster-enabled yes --cluster-config-file nodes-7003.conf
valkey-server --port 7004 --cluster-enabled yes --cluster-config-file nodes-7004.conf
valkey-server --port 7005 --cluster-enabled yes --cluster-config-file nodes-7005.conf

# Create cluster
valkey-cli --cluster create \
    127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
    127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
    --cluster-replicas 1
```

**Cluster Health Monitoring:**

```shell
# Check cluster status
valkey-cli -c -p 7000 CLUSTER INFO

# Check node status
valkey-cli -c -p 7000 CLUSTER NODES

# Check slot distribution
valkey-cli -c -p 7000 CLUSTER SLOTS
```

### Connection Pooling

```python
import redis

# Configure connection pool
pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    max_connections=50,
    socket_timeout=5,
    socket_connect_timeout=5,
    retry_on_timeout=True
)

# Use pool for all operations
client = redis.Redis(connection_pool=pool)

# Connection pool for cluster
from redis.cluster import RedisCluster

cluster = RedisCluster(
    host='node1',
    port=6379,
    max_connections=20,
    max_connections_per_node=True
)
```

## Common Pitfalls

### Migration Pitfalls

**1. Client Library Compatibility**

```python
# Most Redis clients work without changes
# But verify your specific client version

# redis-py 4.x+ works with Valkey
import redis
client = redis.Redis(host='valkey-server', port=6379)

# For GLIDE client (optimal performance)
from glide import GlideClient
```

**2. Module Compatibility**

```shell
# Check if you use Redis modules
# Valkey may not support all proprietary Redis modules

# Supported: Core commands, Lua scripting
# May need alternatives: RedisJSON, RediSearch, RedisTimeSeries

# Check loaded modules
127.0.0.1:6379> MODULE LIST
```

**3. Configuration Differences**

```conf
# Rename redis.conf to valkey.conf
# Most directives are identical

# Binary names change:
# redis-server -> valkey-server
# redis-cli -> valkey-cli
# redis-benchmark -> valkey-benchmark
```

### Performance Pitfalls

**1. Blocking Operations on Large Keys**

```python
# Bad: KEYS command blocks the server
keys = client.keys('user:*')  # Never use in production!

# Good: Use SCAN for iteration
cursor = 0
all_keys = []
while True:
    cursor, keys = client.scan(cursor, match='user:*', count=100)
    all_keys.extend(keys)
    if cursor == 0:
        break
```

**2. Large Key Anti-Patterns**

```python
# Bad: Huge list with millions of elements
client.lpush('huge_list', *range(10000000))

# Good: Partition large datasets
def partition_key(base_key, item_id, partition_size=10000):
    partition = item_id // partition_size
    return f"{base_key}:{partition}"
```

**3. Missing Connection Pooling**

```python
# Bad: Creating new connection per request
def bad_get_user(user_id):
    client = redis.Redis(host='localhost', port=6379)
    return client.get(f'user:{user_id}')

# Good: Reuse connection pool
pool = redis.ConnectionPool(host='localhost', port=6379, max_connections=20)

def good_get_user(user_id):
    client = redis.Redis(connection_pool=pool)
    return client.get(f'user:{user_id}')
```

### Cluster Pitfalls

**1. Multi-Key Operations Across Slots**

```python
# Bad: Keys may be on different nodes
client.mget('user:1', 'user:2', 'user:3')  # May fail in cluster

# Good: Use hash tags to ensure same slot
client.mget('{user}:1', '{user}:2', '{user}:3')  # All go to same slot
```

**2. Lua Scripts with Cross-Slot Keys**

```lua
-- Bad: Keys on different slots
local val1 = redis.call('GET', KEYS[1])  -- user:1
local val2 = redis.call('GET', KEYS[2])  -- order:1

-- Good: Use hash tags
local val1 = redis.call('GET', KEYS[1])  -- {entity}:user:1
local val2 = redis.call('GET', KEYS[2])  -- {entity}:order:1
```

## Performance Considerations

### Benchmark Results (Valkey 8.0)

Valkey 8.0 with enhanced I/O threading shows significant improvements:

| Metric | Valkey 7.2 | Valkey 8.0 | Improvement |
|--------|------------|------------|-------------|
| Throughput (RPS) | 360,000 | 1,190,000 | 230% |
| Latency (p99) | 1.2ms | 0.8ms | 33% |
| CPU Utilization | 25% | 85% | Multi-core |

*Tested on AWS c7g.4xlarge (Graviton3, 16 vCPUs)*

### I/O Threading Configuration

```conf
# Enable I/O threads for improved throughput
io-threads 4

# Enable threaded reads (disabled by default)
io-threads-do-reads yes

# Recommended: Set io-threads to number of CPU cores - 1
# Leave one core for main thread
```

### Latency Optimization

```conf
# Disable transparent huge pages (Linux)
# echo never > /sys/kernel/mm/transparent_hugepage/enabled

# Increase TCP backlog
tcp-backlog 511

# Disable slow log for non-debug scenarios
slowlog-log-slower-than 10000
slowlog-max-len 128

# Active defragmentation
activedefrag yes
active-defrag-ignore-bytes 100mb
active-defrag-threshold-lower 10
active-defrag-threshold-upper 100
```

### Memory Optimization

```conf
# Use jemalloc (default on Linux)
# Compile with: make MALLOC=jemalloc

# Enable lazy freeing for better performance
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes

# Optimize hash storage
hash-max-listpack-entries 512
hash-max-listpack-value 64

# Optimize list storage
list-max-listpack-size -2
list-compress-depth 0

# Optimize set storage
set-max-intset-entries 512
set-max-listpack-entries 128
set-max-listpack-value 64
```

### Monitoring Performance

```shell
# Real-time stats
valkey-cli INFO stats

# Slow queries log
valkey-cli SLOWLOG GET 10

# Memory analysis
valkey-cli MEMORY DOCTOR

# Client connections
valkey-cli CLIENT LIST

# Command statistics
valkey-cli INFO commandstats
```

## Real-World Use Cases

### Caching Layer

```python
import redis
import json
import hashlib
from functools import wraps

client = redis.Redis(host='localhost', port=6379, decode_responses=True)

def cache(ttl=3600):
    """Decorator for caching function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            key_data = f"{func.__name__}:{args}:{sorted(kwargs.items())}"
            cache_key = f"cache:{hashlib.md5(key_data.encode()).hexdigest()}"

            # Try to get from cache
            cached = client.get(cache_key)
            if cached:
                return json.loads(cached)

            # Execute function and cache result
            result = func(*args, **kwargs)
            client.setex(cache_key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator

@cache(ttl=300)
def get_user_profile(user_id):
    # Expensive database query
    return {"id": user_id, "name": "Alice", "email": "alice@example.com"}
```

### Session Storage

```python
import redis
import json
import uuid
from datetime import datetime

class SessionManager:
    def __init__(self, host='localhost', port=6379):
        self.client = redis.Redis(host=host, port=port, decode_responses=True)
        self.session_ttl = 3600  # 1 hour

    def create_session(self, user_id, data=None):
        session_id = str(uuid.uuid4())
        session_data = {
            'user_id': user_id,
            'created_at': datetime.utcnow().isoformat(),
            'data': data or {}
        }

        key = f"session:{session_id}"
        self.client.setex(key, self.session_ttl, json.dumps(session_data))

        # Track user's sessions
        self.client.sadd(f"user:sessions:{user_id}", session_id)

        return session_id

    def get_session(self, session_id):
        key = f"session:{session_id}"
        data = self.client.get(key)

        if data:
            # Refresh TTL on access
            self.client.expire(key, self.session_ttl)
            return json.loads(data)
        return None

    def destroy_session(self, session_id):
        session = self.get_session(session_id)
        if session:
            self.client.delete(f"session:{session_id}")
            self.client.srem(f"user:sessions:{session['user_id']}", session_id)

    def destroy_all_user_sessions(self, user_id):
        sessions = self.client.smembers(f"user:sessions:{user_id}")
        for session_id in sessions:
            self.client.delete(f"session:{session_id}")
        self.client.delete(f"user:sessions:{user_id}")
```

### Message Queue

```python
import redis
import json
import time
import uuid
from typing import Callable, Any

class SimpleQueue:
    def __init__(self, name, host='localhost', port=6379):
        self.client = redis.Redis(host=host, port=port, decode_responses=True)
        self.queue_name = f"queue:{name}"
        self.processing_name = f"queue:{name}:processing"

    def enqueue(self, task_data: dict, priority: int = 0):
        """Add task to queue with optional priority"""
        task = {
            'id': str(uuid.uuid4()),
            'data': task_data,
            'created_at': time.time()
        }
        # Use sorted set for priority queue
        self.client.zadd(self.queue_name, {json.dumps(task): priority})
        return task['id']

    def dequeue(self, timeout: int = 0):
        """Get next task from queue (blocking)"""
        # Move from queue to processing
        result = self.client.bzpopmin(self.queue_name, timeout)
        if result:
            _, task_json, _ = result
            task = json.loads(task_json)
            # Track in processing set
            self.client.hset(self.processing_name, task['id'], task_json)
            return task
        return None

    def complete(self, task_id: str):
        """Mark task as complete"""
        self.client.hdel(self.processing_name, task_id)

    def fail(self, task_id: str, requeue: bool = True):
        """Handle failed task"""
        task_json = self.client.hget(self.processing_name, task_id)
        self.client.hdel(self.processing_name, task_id)

        if requeue and task_json:
            task = json.loads(task_json)
            task['retries'] = task.get('retries', 0) + 1
            if task['retries'] < 3:
                self.client.zadd(self.queue_name, {json.dumps(task): -1})  # High priority retry

# Worker implementation
def worker(queue: SimpleQueue, handler: Callable[[dict], Any]):
    while True:
        task = queue.dequeue(timeout=5)
        if task:
            try:
                handler(task['data'])
                queue.complete(task['id'])
            except Exception as e:
                print(f"Task failed: {e}")
                queue.fail(task['id'], requeue=True)
```

### Real-Time Leaderboard

```python
import redis
from datetime import datetime

class Leaderboard:
    def __init__(self, name, host='localhost', port=6379):
        self.client = redis.Redis(host=host, port=port, decode_responses=True)
        self.leaderboard_key = f"leaderboard:{name}"

    def update_score(self, player_id: str, score: float):
        """Update player score (or add new player)"""
        self.client.zadd(self.leaderboard_key, {player_id: score})

    def increment_score(self, player_id: str, increment: float):
        """Increment player score"""
        return self.client.zincrby(self.leaderboard_key, increment, player_id)

    def get_rank(self, player_id: str) -> int:
        """Get player rank (0-indexed, highest score = rank 0)"""
        rank = self.client.zrevrank(self.leaderboard_key, player_id)
        return rank if rank is not None else -1

    def get_score(self, player_id: str) -> float:
        """Get player score"""
        return self.client.zscore(self.leaderboard_key, player_id)

    def get_top_players(self, count: int = 10):
        """Get top N players"""
        return self.client.zrevrange(
            self.leaderboard_key,
            0,
            count - 1,
            withscores=True
        )

    def get_players_around(self, player_id: str, count: int = 5):
        """Get players around a specific player"""
        rank = self.get_rank(player_id)
        if rank == -1:
            return []

        start = max(0, rank - count // 2)
        end = rank + count // 2

        return self.client.zrevrange(
            self.leaderboard_key,
            start,
            end,
            withscores=True
        )

    def get_player_count(self) -> int:
        """Get total number of players"""
        return self.client.zcard(self.leaderboard_key)

# Usage
leaderboard = Leaderboard('game:daily')
leaderboard.update_score('player:alice', 1500)
leaderboard.update_score('player:bob', 2200)
leaderboard.update_score('player:charlie', 1800)

print(f"Top players: {leaderboard.get_top_players(3)}")
print(f"Alice's rank: {leaderboard.get_rank('player:alice')}")
```

### Rate Limiting

```python
import redis
import time

class RateLimiter:
    def __init__(self, host='localhost', port=6379):
        self.client = redis.Redis(host=host, port=port)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """Sliding window rate limiter"""
        now = time.time()
        window_start = now - window_seconds

        pipe = self.client.pipeline()

        # Remove old entries
        pipe.zremrangebyscore(key, 0, window_start)

        # Count current entries
        pipe.zcard(key)

        # Add current request
        pipe.zadd(key, {str(now): now})

        # Set expiry
        pipe.expire(key, window_seconds)

        results = pipe.execute()
        current_count = results[1]

        return current_count < max_requests

    def get_remaining(self, key: str, max_requests: int, window_seconds: int) -> int:
        """Get remaining requests in current window"""
        now = time.time()
        window_start = now - window_seconds

        # Clean and count
        self.client.zremrangebyscore(key, 0, window_start)
        current_count = self.client.zcard(key)

        return max(0, max_requests - current_count)

# Usage with Flask
from flask import Flask, request, jsonify

app = Flask(__name__)
limiter = RateLimiter()

@app.before_request
def rate_limit():
    key = f"rate_limit:{request.remote_addr}"
    if not limiter.is_allowed(key, max_requests=100, window_seconds=60):
        return jsonify({"error": "Rate limit exceeded"}), 429
```

## Interview Essentials

### Common Interview Questions

**Q1: What is Valkey and why was it created?**

Valkey is a Linux Foundation-backed fork of Redis 7.2.4, created in March 2024 after Redis Inc. changed its licensing from BSD 3-clause to RSALv2/SSPLv1. It maintains the original open-source BSD license and provides full command compatibility with Redis.

**Q2: Explain Valkey's data structures and their use cases.**

| Data Structure | Description | Use Cases |
|---------------|-------------|-----------|
| Strings | Binary-safe byte sequences | Caching, counters, session tokens |
| Lists | Ordered collections | Queues, activity feeds, logs |
| Sets | Unordered unique elements | Tags, unique visitors, social graphs |
| Sorted Sets | Ordered unique elements with scores | Leaderboards, priority queues, time-series |
| Hashes | Field-value maps | User profiles, objects, configuration |
| Streams | Append-only log structures | Event sourcing, message queues |
| Bitmaps | Bit arrays | Feature flags, user presence |
| HyperLogLog | Probabilistic cardinality | Unique count estimation |

**Q3: How does Valkey persistence work?**

Two mechanisms:
- **RDB**: Point-in-time snapshots, faster recovery, potential data loss
- **AOF**: Append-only log, better durability, larger files

Best practice: Use both with `aof-use-rdb-preamble yes` for optimal balance.

**Q4: Explain Valkey cluster architecture.**

- Data is divided into 16,384 hash slots
- Each primary node handles a subset of slots
- Replicas provide redundancy for each primary
- Minimum recommended: 3 primaries + 3 replicas
- Automatic failover when primary fails
- Use hash tags `{tag}:key` to co-locate related keys

**Q5: What are the eviction policies in Valkey?**

| Policy | Description |
|--------|-------------|
| volatile-lru | Evict LRU keys with TTL |
| allkeys-lru | Evict LRU keys (any) |
| volatile-lfu | Evict LFU keys with TTL |
| allkeys-lfu | Evict LFU keys (any) |
| volatile-random | Evict random keys with TTL |
| allkeys-random | Evict random keys |
| volatile-ttl | Evict shortest TTL first |
| noeviction | Return errors when full |

**Q6: How would you implement distributed locking with Valkey?**

```python
import redis
import uuid
import time

class DistributedLock:
    def __init__(self, client, lock_name, ttl=10):
        self.client = client
        self.lock_name = f"lock:{lock_name}"
        self.ttl = ttl
        self.token = str(uuid.uuid4())

    def acquire(self, timeout=0):
        end_time = time.time() + timeout if timeout else time.time()

        while time.time() <= end_time:
            if self.client.set(self.lock_name, self.token, nx=True, ex=self.ttl):
                return True
            time.sleep(0.1)

        return False

    def release(self):
        # Lua script ensures atomicity
        script = """
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
        else
            return 0
        end
        """
        return self.client.execute_command('EVAL', script, 1, self.lock_name, self.token)
```

**Q7: What are the key differences between Valkey 8.0 and earlier versions?**

- Enhanced I/O threading (230% throughput improvement)
- Experimental RDMA support
- Per-slot metrics for better observability
- Improved multi-core CPU utilization
- Better memory efficiency

**Q8: How do you handle cache stampede?**

```python
import random
import time

def get_with_probabilistic_early_expiration(client, key, ttl, compute_fn):
    """Probabilistic early expiration to prevent stampede"""
    cached = client.get(key)

    if cached:
        value, expire_time = json.loads(cached)

        # Probabilistic early refresh
        remaining = expire_time - time.time()
        delta = ttl * 0.1  # 10% of TTL

        if remaining < delta * random.random():
            # Early refresh
            new_value = compute_fn()
            store_value(client, key, new_value, ttl)
            return new_value

        return value

    # Cache miss - compute and store
    value = compute_fn()
    store_value(client, key, value, ttl)
    return value
```

## Further Reading

### Official Resources

- [Valkey Official Website](https://valkey.io/) - Documentation and downloads
- [Valkey GitHub Repository](https://github.com/valkey-io/valkey) - Source code
- [Valkey GLIDE Client](https://github.com/valkey-io/valkey-glide) - Official multi-language client
- [Valkey Documentation](https://valkey.io/docs/) - Complete reference

### Managed Services

- [Amazon ElastiCache for Valkey](https://aws.amazon.com/elasticache/) - AWS managed service
- [Aiven for Valkey](https://aiven.io/valkey) - Multi-cloud managed service
- [DigitalOcean Valkey](https://docs.digitalocean.com/products/databases/valkey/) - DigitalOcean managed service

### Community Resources

- [Valkey Discussion Forum](https://github.com/valkey-io/valkey/discussions) - Community Q&A
- [Linux Foundation Valkey Page](https://www.linuxfoundation.org/projects/valkey) - Project governance
- [iovalkey](https://github.com/valkey-io/iovalkey) - Node.js client
- [valkey-py](https://github.com/valkey-io/valkey-py) - Python client

### Migration Resources

- [Redis to Valkey Migration Guide](https://valkey.io/docs/migration/) - Official migration documentation
- [Valkey Compatibility Documentation](https://valkey.io/docs/compatibility/) - Command compatibility reference

### Performance and Benchmarks

- [Valkey 8.0 Performance Analysis](https://valkey.io/blog/valkey-8-performance/) - Official benchmarks
- [Valkey vs Redis Comparison](https://betterstack.com/community/comparisons/redis-vs-valkey/) - Independent analysis

Valkey represents the continued evolution of in-memory data storage under genuine open-source governance. With its strong community backing, enterprise adoption, and active development, it provides a reliable foundation for building high-performance applications while ensuring the freedom that open-source software should provide.
