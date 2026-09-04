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
origin: old/src/content/docs/architecture/system-design-basics.zh.md
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

系统设计是软件工程中最具挑战性但也最有价值的技能之一。它要求工程师从整体上思考如何构建可扩展、可靠且高性能的分布式系统。本文将全面探讨系统设计的核心概念、方法论和实践技术。

## 什么是系统设计？

系统设计是在给定约束条件下，定义系统架构、组件、模块、接口和数据流以满足特定需求的过程。它涉及多个维度的多层次决策：

- **架构选择**：选择合适的架构模式（微服务、单体、事件驱动等）
- **技术选型**：选择合适的数据库、缓存方案、消息队列等基础设施组件
- **容量规划**：估算系统需要处理的数据量和流量
- **可靠性设计**：确保系统在各种故障场景下仍能正常运行
- **性能优化**：保证系统满足延迟和吞吐量要求

系统设计不是寻找"唯一正确答案"，而是在相互竞争的关注点之间做出合理权衡的艺术。

## 系统设计方法论

### 四步框架

在进行系统设计时，遵循以下结构化方法论：

#### 第一步：明确需求

在开始任何设计之前，彻底理解需求：

**功能性需求**：
- 系统必须支持哪些核心功能？
- 主要的用户场景是什么？
- 需要支持哪些平台（Web、移动端、API）？

**非功能性需求**：
- 预期的用户规模是多少？
- 需要支持多少 QPS（每秒查询数）？
- 延迟要求是什么（例如，P99 < 100ms）？
- 数据需要保留多长时间？
- 需要什么级别的可用性（99.9% vs 99.99%）？

#### 第二步：高层设计

确认需求后，创建高层架构：

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   客户端    │────>│  负载均衡器  │────>│  应用服务器  │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    v                         v                         v
              ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
              │    缓存     │           │   数据库    │           │   消息队列   │
              └─────────────┘           └─────────────┘           └─────────────┘
```

在这个阶段：
- 识别系统的主要组件
- 定义组件之间的交互
- 选择合适的通信协议（HTTP、gRPC、WebSocket 等）

#### 第三步：深入设计

选择关键组件进行详细设计：

- 数据模型设计
- API 设计
- 数据库 Schema 设计
- 缓存策略设计
- 消息队列设计

#### 第四步：总结与扩展

- 识别系统瓶颈
- 讨论监控和告警策略
- 探索未来扩展的可能性

## 核心理论概念

### CAP 定理

CAP 定理是分布式系统设计的基本原则。它指出分布式系统只能同时满足以下三个属性中的两个：

- **一致性（Consistency）**：所有节点同时看到相同的数据
- **可用性（Availability）**：每个请求都能收到响应（不保证是最新数据）
- **分区容错性（Partition Tolerance）**：系统在网络分区情况下仍能继续运行

```
                        CAP 定理

         ┌─────────────────┬─────────────────┐
         │                 │                 │
         │       CA        │       CP        │
         │   （单节点）     │  （强一致性）    │
         │                 │                 │
         ├─────────────────┴─────────────────┤
         │                                   │
         │              AP                   │
         │      （高可用系统）                │
         │                                   │
         └───────────────────────────────────┘
```

**实际应用选择**：

| 系统类型 | CAP 选择 | 代表示例 |
|---------|---------|---------|
| 传统关系型数据库 | CA | MySQL（单节点）|
| 分布式数据库 | CP | ZooKeeper、etcd、HBase |
| NoSQL 数据库 | AP | Cassandra、DynamoDB |

由于分布式系统中网络分区是不可避免的，实践中我们通常在 CP 和 AP 之间做选择。

### BASE 理论

BASE 理论扩展了 CAP 的 AP 方案，提供了更实用的一致性模型：

- **基本可用（Basically Available）**：系统在故障时允许部分可用性降级，同时维持核心功能
- **软状态（Soft State）**：系统中的数据可能存在中间状态，而不影响整体可用性
- **最终一致性（Eventually Consistent）**：系统中的数据副本最终会达到一致状态

BASE 与 ACID 对比：

| 属性 | ACID | BASE |
|-----|------|------|
| 一致性 | 强一致性 | 最终一致性 |
| 可用性 | 可能阻塞 | 基本可用 |
| 适用场景 | 金融交易 | 社交网络、电商 |
| 可扩展性 | 有限 | 良好 |

### 一致性模型

分布式系统支持多种一致性级别：

**强一致性**
- 每次读取都返回最近写入的数据
- 实现成本高，性能较低
- 适用于金融交易

**最终一致性**
- 在没有新更新的情况下，所有访问最终返回最后更新的值
- 实现简单，性能良好
- 适用于社交媒体、评论系统

**因果一致性**
- 具有因果关系的操作在所有节点上保持一致的顺序
- 介于强一致性和最终一致性之间

**读己之写一致性**
- 用户总能读到自己写入的数据
- 常见于用户个人数据场景

## 可扩展性设计

当系统负载增加时，需要通过扩展来处理需求。有两种主要的扩展方式：

### 垂直扩展（Scale Up）

垂直扩展意味着增加单台机器的硬件资源：

**优点**：
- 实现简单，无需修改代码
- 避免分布式系统的复杂性

**缺点**：
- 存在硬件上限
- 成本增长不是线性的（高端硬件更贵）
- 单点故障风险

```
垂直扩展示意图：

    ┌─────────┐         ┌─────────────┐
    │ 4 CPUs  │   -->   │  32 CPUs    │
    │ 8GB RAM │         │  256GB RAM  │
    │ 100GB   │         │  10TB SSD   │
    └─────────┘         └─────────────┘
```

### 水平扩展（Scale Out）

水平扩展意味着增加更多机器：

**优点**：
- 理论上可无限扩展
- 成本线性增长
- 提高容错能力

**缺点**：
- 需要处理分布式挑战
- 数据一致性变得更复杂
- 运维成本增加

```
水平扩展示意图：

    ┌─────────┐         ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ 服务器  │   -->   │ 服务器1 │ │ 服务器2 │ │ 服务器3 │
    │    A    │         └─────────┘ └─────────┘ └─────────┘
    └─────────┘                │         │         │
                               └─────────┴─────────┘
                                        │
                               ┌─────────────────┐
                               │    负载均衡器    │
                               └─────────────────┘
```

### 扩展策略选择

| 场景 | 推荐策略 | 原因 |
|-----|---------|-----|
| 创业公司 MVP | 垂直扩展 | 更快上线，降低复杂性 |
| 计算密集型 | 垂直扩展 | 减少分布式计算开销 |
| 无状态服务 | 水平扩展 | 易于扩展，无数据同步问题 |
| 大规模系统 | 水平扩展 | 突破单机限制 |

## 负载均衡

负载均衡将请求分发到多台服务器，以提高系统吞吐量和可用性。

### 负载均衡算法

| 算法 | 描述 | 适用场景 |
|-----|------|---------|
| 轮询 | 按顺序分发请求 | 性能相近的服务器 |
| 加权轮询 | 按权重比例分发 | 性能不同的服务器 |
| 最少连接 | 路由到连接数最少的服务器 | 长连接场景 |
| IP 哈希 | 相同 IP 路由到相同服务器 | 需要会话保持 |
| 一致性哈希 | 哈希环分布 | 缓存和存储服务 |

### 负载均衡层次

```
用户请求
    │
    v
┌─────────────────────────────────────────────┐
│          DNS 负载均衡 (L4/L7)               │
│       （地理位置、运营商路由）               │
└──────────────────────┬──────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────┐
│        硬件负载均衡 (L4)                    │
│          (F5、A10 等)                       │
└──────────────────────┬──────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────┐
│        软件负载均衡 (L7)                    │
│       (Nginx、HAProxy 等)                   │
└──────────────────────┬──────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        v              v              v
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │ 服务器1 │    │ 服务器2 │    │ 服务器3 │
   └─────────┘    └─────────┘    └─────────┘
```

### 负载均衡器实现示例

```javascript
// 带健康检查的简单负载均衡器实现
class LoadBalancer {
  constructor(servers) {
    this.servers = servers;
    this.currentIndex = 0;
    this.healthyServers = new Set(servers);
  }

  // 轮询选择
  getNextServer() {
    const healthy = Array.from(this.healthyServers);
    if (healthy.length === 0) {
      throw new Error('No healthy servers available');
    }

    const server = healthy[this.currentIndex % healthy.length];
    this.currentIndex++;
    return server;
  }

  // 加权轮询
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

  // 最少连接
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

  // 健康检查
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

// 使用示例
const lb = new LoadBalancer([
  'http://server1:3000',
  'http://server2:3000',
  'http://server3:3000'
]);

// 定期健康检查
setInterval(() => lb.performHealthCheck(), 10000);
```

## 缓存策略

缓存是提高系统性能的关键技术，但它也引入了数据一致性的挑战。

### 缓存模式

**旁路缓存（Cache-Aside，懒加载）**：
```python
def get_data(key):
    # 1. 首先检查缓存
    data = cache.get(key)
    if data:
        return data

    # 2. 缓存未命中 - 查询数据库
    data = db.query(key)

    # 3. 写入缓存
    cache.set(key, data, ttl=3600)

    return data

def update_data(key, value):
    # 1. 首先更新数据库
    db.update(key, value)

    # 2. 使缓存失效
    cache.delete(key)
```

**写穿透（Write-Through）**：
```python
def write_through(key, value):
    # 同时写入缓存和数据库
    cache.set(key, value)
    db.update(key, value)

# 优点：缓存数据始终最新
# 缺点：写入延迟较高
```

**写回（Write-Behind / Write-Back）**：
```python
import asyncio
from collections import deque

class WriteBackCache:
    def __init__(self):
        self.cache = {}
        self.write_queue = deque()
        self.batch_size = 100
        self.flush_interval = 5  # 秒

    def set(self, key, value):
        # 立即写入缓存
        self.cache[key] = value
        # 加入队列异步写入数据库
        self.write_queue.append((key, value))

    async def flush_to_database(self):
        while True:
            await asyncio.sleep(self.flush_interval)
            batch = []
            while self.write_queue and len(batch) < self.batch_size:
                batch.append(self.write_queue.popleft())

            if batch:
                await self.db.batch_update(batch)

# 优点：写入性能高
# 缺点：故障时有数据丢失风险
```

**读穿透（Read-Through）**：
```python
class ReadThroughCache:
    def __init__(self, cache, db):
        self.cache = cache
        self.db = db

    def get(self, key):
        # 缓存层负责处理数据库加载
        data = self.cache.get(key)
        if data is None:
            data = self.db.query(key)
            if data:
                self.cache.set(key, data)
        return data
```

### 缓存淘汰策略

| 策略 | 描述 | 适用场景 |
|-----|------|---------|
| TTL（生存时间）| 固定时间后过期 | 大多数场景 |
| LRU（最近最少使用）| 淘汰最近最少访问的数据 | 内存有限场景 |
| LFU（最不经常使用）| 淘汰访问次数最少的数据 | 热点数据场景 |
| 主动失效 | 数据更新时删除 | 强一致性要求 |

### 常见缓存问题及解决方案

**缓存穿透**：
- 问题：查询不存在的数据绕过缓存直接访问数据库
- 解决方案：布隆过滤器、缓存空值

```python
from pybloom_live import BloomFilter

class CacheWithBloomFilter:
    def __init__(self):
        self.cache = {}
        self.bloom = BloomFilter(capacity=1000000, error_rate=0.001)
        self.null_cache = set()  # 空值缓存

    def get(self, key):
        # 首先检查布隆过滤器
        if key not in self.bloom:
            return None  # 肯定不在数据库中

        # 检查空值缓存
        if key in self.null_cache:
            return None

        # 检查缓存
        if key in self.cache:
            return self.cache[key]

        # 查询数据库
        data = self.db.query(key)
        if data:
            self.cache[key] = data
            self.bloom.add(key)
        else:
            self.null_cache.add(key)  # 缓存空结果

        return data
```

**缓存击穿**：
- 问题：热点数据过期，大量并发请求直接访问数据库
- 解决方案：互斥锁、热点数据永不过期

```python
import threading
import time

class CacheWithMutex:
    def __init__(self):
        self.cache = {}
        self.locks = {}
        self.lock_map_mutex = threading.Lock()

    def get_with_mutex(self, key):
        # 首先尝试缓存
        data = self.cache.get(key)
        if data and data['expire_at'] > time.time():
            return data['value']

        # 获取该 key 的锁
        with self.lock_map_mutex:
            if key not in self.locks:
                self.locks[key] = threading.Lock()
            lock = self.locks[key]

        # 只有一个线程查询数据库
        with lock:
            # 获取锁后再次检查
            data = self.cache.get(key)
            if data and data['expire_at'] > time.time():
                return data['value']

            # 查询数据库
            value = self.db.query(key)
            self.cache[key] = {
                'value': value,
                'expire_at': time.time() + 3600
            }
            return value
```

**缓存雪崩**：
- 问题：大量缓存条目同时过期
- 解决方案：随机 TTL 偏移、多级缓存

```python
import random

# 原始方式（有问题）
# cache.set(key, value, ttl=3600)

# 优化方式（添加随机偏移）
def set_with_random_ttl(cache, key, value, base_ttl=3600):
    # TTL 在 3600-4200 秒之间
    random_offset = random.randint(0, 600)
    cache.set(key, value, ttl=base_ttl + random_offset)

# 多级缓存
class MultiLevelCache:
    def __init__(self):
        self.l1_cache = {}  # 本地内存缓存
        self.l2_cache = redis_client  # 分布式缓存

    def get(self, key):
        # 首先检查 L1
        if key in self.l1_cache:
            return self.l1_cache[key]

        # 检查 L2
        value = self.l2_cache.get(key)
        if value:
            self.l1_cache[key] = value  # 填充 L1
            return value

        # 查询数据库
        value = self.db.query(key)
        if value:
            self.l2_cache.set(key, value, ex=3600)
            self.l1_cache[key] = value
        return value
```

## 数据库分片

当单个数据库无法满足性能要求时，就需要进行分片。

### 垂直分片（按功能分片）

按业务模块拆分数据库：

```
原始数据库                       拆分后
┌──────────────┐           ┌───────────┐
│   users      │    -->    │ 用户数据库 │
│   orders     │           └───────────┘
│   products   │           ┌───────────┐
│   reviews    │    -->    │ 订单数据库 │
└──────────────┘           └───────────┘
                           ┌───────────┐
                    -->    │ 产品数据库 │
                           └───────────┘
```

### 水平分片（按数据分片）

将数据分散到多个数据库：

```
常见分片策略：

1. 范围分片
   - user_0: id 1-1000000
   - user_1: id 1000001-2000000

2. 哈希分片
   - shard = hash(user_id) % shard_count

3. 一致性哈希
   - 节点变化时最小化数据迁移
```

### 一致性哈希实现

```javascript
class ConsistentHash {
  constructor(replicas = 100) {
    this.replicas = replicas;  // 每个物理节点的虚拟节点数
    this.ring = new Map();     // 哈希环
    this.sortedKeys = [];      // 排序后的哈希值
  }

  // 哈希函数
  hash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // 添加节点到环
  addNode(node) {
    for (let i = 0; i < this.replicas; i++) {
      const virtualKey = `${node}:${i}`;
      const hashValue = this.hash(virtualKey);
      this.ring.set(hashValue, node);
      this.sortedKeys.push(hashValue);
    }
    this.sortedKeys.sort((a, b) => a - b);
  }

  // 从环中移除节点
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

  // 获取负责某个 key 的节点
  getNode(key) {
    if (this.ring.size === 0) {
      return null;
    }

    const hashValue = this.hash(key);

    // 二分查找第一个 >= hashValue 的节点
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

    // 必要时环绕
    const index = left === this.sortedKeys.length ? 0 : left;
    return this.ring.get(this.sortedKeys[index]);
  }
}

// 使用示例
const hash = new ConsistentHash(150);
hash.addNode('db-server-1');
hash.addNode('db-server-2');
hash.addNode('db-server-3');

console.log(hash.getNode('user:12345'));  // 返回负责的服务器
console.log(hash.getNode('order:67890')); // 返回负责的服务器
```

### 分片挑战

- **跨分片事务**：难以维护 ACID 属性
- **跨分片查询**：复杂的聚合操作
- **全局唯一 ID**：需要分布式 ID 生成
- **数据迁移和再平衡**：添加/移除分片时的复杂性

### 分布式 ID 生成

```javascript
// 雪花算法 ID 生成器
class SnowflakeIdGenerator {
  constructor(workerId, datacenterId) {
    // 位分配：1 符号位 + 41 时间戳 + 5 数据中心 + 5 工作节点 + 12 序列号
    this.workerId = BigInt(workerId);
    this.datacenterId = BigInt(datacenterId);
    this.sequence = 0n;
    this.lastTimestamp = -1n;

    // 常量
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

    // 验证
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

// 使用示例
const idGen = new SnowflakeIdGenerator(1, 1);
console.log(idGen.nextId()); // "6789012345678901234"
```

## 限流

限流保护系统免受突发流量高峰的冲击。

### 常见限流算法

**固定窗口计数器**：
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

**滑动窗口计数器**：
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

        # 移除过期的时间戳
        while self.requests and self.requests[0] <= current - self.window_size:
            self.requests.popleft()

        if len(self.requests) < self.limit:
            self.requests.append(current)
            return True
        return False
```

**令牌桶**：
```python
import time

class TokenBucket:
    def __init__(self, capacity, rate):
        self.capacity = capacity  # 桶容量
        self.rate = rate          # 令牌生成速率（每秒）
        self.tokens = capacity
        self.last_time = time.time()

    def allow_request(self, tokens_needed=1):
        current = time.time()

        # 生成新令牌
        elapsed = current - self.last_time
        self.tokens += elapsed * self.rate
        self.tokens = min(self.tokens, self.capacity)
        self.last_time = current

        if self.tokens >= tokens_needed:
            self.tokens -= tokens_needed
            return True
        return False

# 使用示例
bucket = TokenBucket(capacity=100, rate=10)  # 最大 100 个，每秒 10 个
if bucket.allow_request():
    process_request()
else:
    return_429_too_many_requests()
```

**漏桶**：
```python
import time
import threading
from collections import deque

class LeakyBucket:
    def __init__(self, capacity, leak_rate):
        self.capacity = capacity
        self.leak_rate = leak_rate  # 每秒处理的请求数
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
            return False  # 桶满，请求丢弃

    def _process(self, request):
        # 处理请求
        pass
```

### 限流策略

| 策略 | 描述 |
|-----|------|
| 用户级限流 | 限制每个用户的请求速率 |
| API 级限流 | 限制特定 API 的调用频率 |
| IP 级限流 | 限制每个 IP 地址的请求速率 |
| 全局限流 | 限制系统总请求量 |

## 高可用设计

高可用（HA）是指系统能够长时间持续运行的能力。

### 可用性指标

可用性通常用"几个9"来表示：

| 可用性 | 年停机时间 | 适用场景 |
|-------|----------|---------|
| 99%（两个9）| 3.65 天 | 内部工具 |
| 99.9%（三个9）| 8.76 小时 | 常规业务系统 |
| 99.99%（四个9）| 52.6 分钟 | 核心业务系统 |
| 99.999%（五个9）| 5.26 分钟 | 金融、医疗关键系统 |

### 冗余设计

冗余是实现高可用的基本策略：

**服务冗余**：
```
                    ┌─────────────┐
                    │  负载均衡器  │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           v               v               v
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │ 服务器 1 │    │ 服务器 2 │    │ 服务器 3 │
     │ （活跃） │    │ （活跃） │    │ （活跃） │
     └──────────┘    └──────────┘    └──────────┘
```

**数据冗余**：
- 主从复制
- 多主复制
- 跨数据中心复制

**地理冗余**：
- 多数据中心部署
- 跨区域双活架构

### 故障转移模式

**主备模式（热备）**：
```
正常状态：                     故障转移后：
┌──────────┐                 ┌──────────┐
│   主节点  │ <-- 写入        │   主节点  │ X 故障
│ （活跃） │                 │ （故障） │
└────┬─────┘                 └──────────┘
     │ 复制
     v                             v
┌──────────┐                 ┌──────────┐
│   从节点  │                 │   从节点  │ <-- 提升为主节点
│ （备用） │                 │（已提升）│
└──────────┘                 └──────────┘
```

**双活模式**：
- 所有节点同时处理请求
- 更好的负载分布
- 数据一致性更复杂

### 熔断器模式

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

// 使用示例
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

## 常见设计模式

### API 网关模式

为所有客户端提供单一入口点：

```
客户端 --> API 网关 --> 微服务

职责：
- 认证/授权
- 限流
- 请求路由
- 协议转换
- 响应聚合
```

### 服务独立数据库

每个服务拥有自己的私有数据库：

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   用户服务    │     │   订单服务    │     │   产品服务    │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        v                     v                     v
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   用户数据库   │     │   订单数据库   │     │   产品数据库   │
│ (PostgreSQL)  │     │  (MongoDB)    │     │   (MySQL)     │
└───────────────┘     └───────────────┘     └───────────────┘
```

### 事件溯源

将状态变化存储为事件序列：

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

### CQRS（命令查询职责分离）

分离读写模型：

```javascript
// 命令处理器（写入端）
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

// 查询处理器（读取端）
class OrderQueryHandler {
  async getOrderSummary(orderId) {
    // 从读优化数据库查询
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

// 事件处理器（同步读模型）
class OrderEventHandler {
  async onOrderCreated(event) {
    await this.readDatabase.execute(`
      INSERT INTO order_view (id, user_id, status, total_amount, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [event.orderId, event.userId, event.status, event.totalAmount, event.createdAt]);
  }
}
```

### Saga 模式

管理跨服务的分布式事务：

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
          // 提醒运维团队进行人工干预
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

## 系统设计面试框架

在面试中，系统设计问题通常需要在 45-60 分钟内完成。

### 时间分配

```
┌─────────────────────────────────────────────────────────────┐
│  需求澄清（5-10 分钟）                                       │
├─────────────────────────────────────────────────────────────┤
│  高层设计（10-15 分钟）                                      │
├─────────────────────────────────────────────────────────────┤
│  深入设计（20-25 分钟）                                      │
├─────────────────────────────────────────────────────────────┤
│  总结与扩展（5-10 分钟）                                     │
└─────────────────────────────────────────────────────────────┘
```

### 常见面试题目

1. **设计短链接服务**
   - 关键点：哈希算法、分布式 ID、缓存策略

2. **设计消息队列**
   - 关键点：消息持久化、投递语义、顺序保证

3. **设计分布式缓存**
   - 关键点：一致性哈希、数据分片、淘汰策略

4. **设计社交信息流**
   - 关键点：推拉模式、时间线合并、热点数据处理

5. **设计秒杀系统**
   - 关键点：限流、库存扣减、队列削峰

## 面试要点

### 沟通技巧

1. **主动澄清需求**：不要假设，多问问题
2. **解释权衡**：说明为什么选择 A 而不是 B
3. **从简单开始**：先设计 MVP，再迭代
4. **使用图表**：架构图有助于传达想法
5. **量化估算**：提供具体数字

### 常见陷阱

| 陷阱 | 如何避免 |
|-----|---------|
| 直接跳到写代码 | 先澄清需求和高层设计 |
| 过度设计 | 满足需求即可，避免不必要的复杂性 |
| 忽略非功能性需求 | 主动询问性能、可用性要求 |
| 沉默太久 | 边思考边说，让面试官跟上你的思路 |
| 只讨论技术，不谈业务 | 将技术选择与业务背景联系起来 |

### 评估标准

面试官通常从以下方面进行评估：

- **问题分析**：能否准确理解和分解问题？
- **技术深度**：对核心技术的理解程度如何？
- **权衡能力**：能否在各种方案中做出合理选择？
- **沟通能力**：能否清晰表达设计思路？
- **扩展性思维**：是否考虑未来扩展需求？

### 快速估算

系统设计必备的估算：

```
需要了解的常见指标：

读写比例：读密集型系统通常为 10:1 到 100:1

存储计算：
- 1 个 ASCII 字符 = 1 字节
- 100 万用户 x 1KB 档案 = 1 GB
- 10 亿用户 x 1KB 档案 = 1 TB

QPS 估算：
- 1 亿日活用户
- 平均每用户每天 10 个请求
- = 每天 10 亿请求
- = 10 亿 / 86400 秒
- = 约 12,000 QPS 平均值
- 峰值 QPS 通常是平均值的 2-3 倍 = 约 30,000 QPS

延迟数字：
- L1 缓存：0.5 纳秒
- L2 缓存：7 纳秒
- 主内存：100 纳秒
- SSD 随机读：150 微秒
- HDD 寻道：10 毫秒
- 同数据中心往返：0.5 毫秒
- 跨大陆往返：150 毫秒
```

## 延伸阅读

### 经典书籍

- **《设计数据密集型应用》** - Martin Kleppmann
  - 全面涵盖分布式系统基础

- **《系统设计面试》** - Alex Xu
  - 包含逐步设计示例的实用指南

- **《构建微服务》** - Sam Newman
  - 微服务架构必读指南

- **《可扩展的艺术》** - Martin Abbott & Michael Fisher
  - 扩展立方体和组织扩展模式

### 在线资源

- [System Design Primer](https://github.com/donnemartin/system-design-primer) - GitHub 上最受欢迎的系统设计学习资源
- [High Scalability](http://highscalability.com/) - 真实世界架构案例研究
- [Martin Fowler 的博客](https://martinfowler.com/) - 架构模式权威文章
- [AWS 架构中心](https://aws.amazon.com/architecture/) - 云架构最佳实践
- [Google Cloud 架构框架](https://cloud.google.com/architecture/framework) - 企业架构指导

### 实践平台

1. 阅读开源项目的架构文档
2. 分析大公司的技术博客（Netflix、Uber、Airbnb）
3. 参与开源社区的架构讨论
4. 在实际工作中应用所学概念

## 总结

系统设计是一项需要持续练习的技能。核心要点：

1. **不存在完美设计**：只有适合特定场景的设计
2. **权衡是核心**：性能与成本、一致性与可用性
3. **从需求出发**：深入理解业务需求是基础
4. **迭代演进**：系统架构应随业务增长而演进
5. **度量一切**：用数据驱动设计决策

掌握系统设计不仅有助于面试，还能提升日常架构能力，使你成为更有效的工程师。最好的系统设计师将理论知识与实践经验相结合，不断从生产系统中学习，持续改进自己的方法。

记住：好的系统设计是在简单与能力之间、当前需求与未来可扩展性之间、理想解决方案与实际约束之间找到正确的平衡。
