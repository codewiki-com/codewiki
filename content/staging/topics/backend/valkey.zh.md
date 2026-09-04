---
title: Valkey (Redis 替代方案)
description: Valkey 完全指南 - Linux 基金会主导的 Redis 开源分支，采用 BSD 许可证
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
origin: old/src/content/docs/backend/valkey.zh.md
divergence: 0.217
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 36
  lastUpdated: 2026-01-20
---

Valkey 是一个开源、高性能的内存数据结构存储系统，源自 Redis 7.2.4 的社区驱动分支。在 Linux 基金会和众多科技巨头的支持下，Valkey 保持了原有的 BSD 3-clause 许可证，确保其真正的开源属性。无论你是构建缓存系统、消息队列还是实时应用，Valkey 都能在提供卓越性能和可靠性的同时，保障真正开源软件应有的自由。

## Valkey 的诞生：背景解读

### Redis 许可证变更

2024 年 3 月，Redis Inc. 对其许可策略做出重大调整。公司将原本宽松的 BSD 3-clause 许可证改为 Redis Source Available License (RSALv2) 和 Server Side Public License (SSPLv1) 双许可模式。虽然源代码仍然可以访问，但这些许可证对以下情况施加了限制：

- 云服务提供商提供 Redis 托管服务
- 企业在商业产品中嵌入 Redis
- 竞争对手构建 Redis 兼容服务

这一变化在开源社区引发了对 Redis 未来可访问性和自由度的担忧。

### Valkey 的创立

作为回应，Linux 基金会于 2024 年 3 月宣布 Valkey 项目，从 Redis 7.2.4 分支而来。该项目立即获得了主要科技公司的支持：

| 支持者 | 角色 |
|--------|------|
| Linux 基金会 | 项目治理和管理 |
| Amazon Web Services | 开发和托管服务 (ElastiCache) |
| Google Cloud | 开发支持 |
| Oracle | 开发支持 |
| Ericsson | 企业采用 |
| Snap Inc. | 生产环境使用 |

### Valkey vs Redis：核心差异

| 方面 | Valkey | Redis (2024年后) |
|------|--------|-----------------|
| 许可证 | BSD 3-clause | RSALv2 + SSPLv1 (2025年5月新增 AGPLv3 选项) |
| 治理 | Linux 基金会 | Redis Inc. |
| 基础版本 | 从 Redis 7.2.4 分支 | 持续开发 |
| 命令兼容性 | 100% 兼容 | 不适用 |
| 社区 | 开放贡献模式 | 企业控制 |

## 核心原理与架构

### 内存数据模型

Valkey 将所有数据存储在内存中，提供亚毫秒级响应时间。其架构组成如下：

```
+----------------------------------------------------------+
|                    Valkey 服务器                          |
+----------------------------------------------------------+
|  +-----------+  +-----------+  +-----------+             |
|  |  字符串   |  |   列表    |  |   集合    |             |
|  +-----------+  +-----------+  +-----------+             |
|  +-----------+  +-----------+  +-----------+             |
|  |   哈希    |  | 有序集合  |  |   流      |             |
|  +-----------+  +-----------+  +-----------+             |
|  +-----------+  +-----------+  +-----------+             |
|  |  位图     |  |HyperLogLog|  |  地理空间 |             |
|  +-----------+  +-----------+  +-----------+             |
+----------------------------------------------------------+
|              事件循环 (单线程核心)                         |
+----------------------------------------------------------+
|  +--------------------+  +-------------------------+     |
|  |   I/O 线程         |  |   后台线程              |     |
|  |   (读/写)          |  |   (持久化/清理)         |     |
|  +--------------------+  +-------------------------+     |
+----------------------------------------------------------+
```

### 支持的数据结构

Valkey 原生支持多种数据结构：

**字符串 (Strings)**：存储文本、数字或二进制数据的基本键值对

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

**列表 (Lists)**：支持 push/pop 操作的有序集合

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

**集合 (Sets)**：唯一元素的无序集合

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

**哈希 (Hashes)**：适合表示对象的字段-值对

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

**有序集合 (Sorted Sets)**：带分数的有序集合，用于排名

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

### 持久化机制

Valkey 提供两种持久化选项：

**RDB (Redis 数据库备份)**：时间点快照

```conf
# valkey.conf
save 900 1      # 900秒后如果至少1个键改变则保存
save 300 10     # 300秒后如果至少10个键改变则保存
save 60 10000   # 60秒后如果至少10000个键改变则保存

dbfilename dump.rdb
dir /var/lib/valkey
```

**AOF (追加日志文件)**：所有操作的写入日志

```conf
# valkey.conf
appendonly yes
appendfilename "appendonly.aof"

# 同步选项：always, everysec, no
appendfsync everysec

# 自动重写配置
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

**混合持久化** (生产环境推荐)：

```conf
# 同时启用 RDB 和 AOF
save 900 1
appendonly yes
aof-use-rdb-preamble yes  # 使用 RDB 加速加载，AOF 保证持久性
```

### 复制架构

Valkey 支持异步主从复制：

```
+-----------+       异步复制        +-----------+
|   主节点  | ------------------->  |  从节点 1 |
|  (写入)   |                       |  (读取)   |
+-----------+                       +-----------+
      |
      |             异步复制        +-----------+
      +-------------------------->  |  从节点 2 |
                                    |  (读取)   |
                                    +-----------+
```

在从节点配置文件中配置复制：

```conf
# 在从服务器上
replicaof 192.168.1.100 6379

# 可选：只读从节点（推荐）
replica-read-only yes

# 如果主节点需要密码认证
masterauth your_password
```

或动态配置：

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

### 集群模式

Valkey Cluster 提供跨多节点的自动数据分片：

```
+----------------------------------------------------------+
|                    Valkey 集群                            |
+----------------------------------------------------------+
|  节点 1 (主)          节点 2 (主)          节点 3 (主)
|  槽位: 0-5460         槽位: 5461-10922     槽位: 10923-16383
|       |                     |                    |
|       v                     v                    v
|  节点 1 (从)          节点 2 (从)          节点 3 (从)
+----------------------------------------------------------+
```

集群配置：

```conf
# 集群节点的 valkey.conf
port 6379
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
```

## 核心要点与配置

### 安装

**从源码编译：**

```bash
# 克隆仓库
git clone https://github.com/valkey-io/valkey.git
cd valkey

# 编译
make

# 运行测试（可选）
make test

# 安装
sudo make install
```

**使用 Docker：**

```bash
# 拉取官方镜像
docker pull valkey/valkey:latest

# 运行容器
docker run -d --name valkey -p 6379:6379 valkey/valkey

# 使用自定义配置运行
docker run -d \
  -v /path/to/valkey.conf:/usr/local/etc/valkey/valkey.conf \
  --name valkey \
  -p 6379:6379 \
  valkey/valkey valkey-server /usr/local/etc/valkey/valkey.conf
```

**使用包管理器：**

```bash
# Ubuntu/Debian (通过 Valkey PPA)
sudo add-apt-repository ppa:valkey/valkey
sudo apt-get update
sudo apt-get install valkey

# macOS (Homebrew)
brew tap valkey-io/valkey
brew install valkey

# 启动服务器
valkey-server
```

### 基本配置

```conf
# valkey.conf - 基本设置

# 网络
bind 127.0.0.1 -::1
port 6379
protected-mode yes

# 安全
requirepass your_strong_password

# 内存管理
maxmemory 2gb
maxmemory-policy allkeys-lru

# 持久化
save 900 1
save 300 10
save 60 10000
appendonly yes

# 日志
loglevel notice
logfile /var/log/valkey/valkey.log

# 性能
tcp-keepalive 300
timeout 0
```

### 与 Redis 的命令兼容性

Valkey 与 Redis 7.2.4 保持 100% 命令兼容。所有现有的 Redis 命令无需修改即可使用：

```shell
# 所有标准命令工作方式完全相同
SET key value
GET key
HSET hash field value
LPUSH list value
ZADD sortedset score member
PUBLISH channel message
SUBSCRIBE channel
```

### Valkey 8.0+ 新特性

Valkey 8.0 引入了重大改进：

**增强的 I/O 线程：**

```conf
# 启用多线程 I/O
io-threads 4
io-threads-do-reads yes
```

**RDMA 支持（实验性）：**

```conf
# 用于高性能网络的远程直接内存访问
rdma-enabled yes
rdma-port 6380
```

**每槽位指标：**

```shell
# 获取集群槽位的详细指标
CLUSTER SLOT-STATS SLOTSRANGE 0 16383
```

### 从 Redis 迁移

**步骤 1：设置 Valkey 实例**

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

**步骤 2：配置从 Redis 复制**

```bash
docker exec -it myvalkey valkey-cli
valkey 127.0.0.1:6379> REPLICAOF 172.17.0.2 6379
OK
```

**步骤 3：验证同步**

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

**步骤 4：将 Valkey 提升为主节点**

```bash
valkey 127.0.0.1:6379> REPLICAOF NO ONE
OK
```

**步骤 5：更新应用程序连接字符串**

```python
# 之前 (Redis)
redis_client = redis.Redis(host='redis-server', port=6379)

# 之后 (Valkey) - 相同的 API，只需更新主机名
valkey_client = redis.Redis(host='valkey-server', port=6379)
```

## 代码示例

### Python 使用 Valkey GLIDE

**安装：**

```bash
pip install valkey-glide
```

**单机连接：**

```python
import asyncio
from glide import GlideClientConfiguration, NodeAddress, GlideClient

async def main():
    # 配置连接
    addresses = [
        NodeAddress("localhost", 6379)
    ]
    config = GlideClientConfiguration(
        addresses,
        request_timeout=500  # 500ms 超时
    )

    # 创建客户端
    client = await GlideClient.create(config)

    try:
        # 基本操作
        await client.set("user:session:123", "active")
        status = await client.get("user:session:123")
        print(f"会话状态: {status}")  # 输出: 会话状态: active

        # 带过期时间设置
        await client.set("cache:data", "temporary", ex=3600)  # 1小时后过期

        # 哈希操作
        await client.hset("user:1000", {"name": "Alice", "email": "alice@example.com"})
        user_name = await client.hget("user:1000", "name")
        print(f"用户名: {user_name}")  # 输出: 用户名: Alice

        # 列表操作
        await client.lpush("queue:tasks", ["task1", "task2", "task3"])
        task = await client.rpop("queue:tasks")
        print(f"处理中: {task}")  # 输出: 处理中: task1

    finally:
        client.close()

asyncio.run(main())
```

**集群连接：**

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
        # 集群感知操作
        await client.set("distributed:key", "value")
        result = await client.get("distributed:key")
        print(f"集群结果: {result}")

    finally:
        client.close()

asyncio.run(cluster_example())
```

### Python 使用 redis-py（兼容）

```python
import redis

# redis-py 无需修改即可与 Valkey 配合使用
client = redis.Redis(
    host='localhost',
    port=6379,
    password='your_password',
    decode_responses=True
)

# 字符串操作
client.set('greeting', 'Hello from Valkey!')
print(client.get('greeting'))

# 哈希操作
client.hset('product:1', mapping={
    'name': '笔记本电脑',
    'price': '999.99',
    'stock': '50'
})
product = client.hgetall('product:1')
print(f"产品: {product}")

# 用于排行榜的有序集合
client.zadd('leaderboard', {'player1': 100, 'player2': 250, 'player3': 175})
top_players = client.zrevrange('leaderboard', 0, 2, withscores=True)
print(f"顶级玩家: {top_players}")

# 批量操作的管道
pipe = client.pipeline()
pipe.set('key1', 'value1')
pipe.set('key2', 'value2')
pipe.get('key1')
pipe.get('key2')
results = pipe.execute()
print(f"管道结果: {results}")
```

### Node.js 使用 Valkey GLIDE

**安装：**

```bash
npm install @valkey/valkey-glide
```

**使用：**

```typescript
import { GlideClient, GlideClusterClient } from "@valkey/valkey-glide";

// 单机连接
async function standaloneExample() {
    const client = await GlideClient.createClient({
        addresses: [{ host: "localhost", port: 6379 }],
        requestTimeout: 500,
        useTLS: false
    });

    try {
        // 基本操作
        await client.set("session:token", "abc123xyz");
        const token = await client.get("session:token");
        console.log(`令牌: ${token}`);

        // 带过期时间
        await client.set("cache:result", JSON.stringify({ data: "cached" }), {
            EX: 3600 // 1小时
        });

        // 哈希操作
        await client.hset("user:profile", {
            username: "johndoe",
            created: Date.now().toString()
        });

        const username = await client.hget("user:profile", "username");
        console.log(`用户名: ${username}`);

    } finally {
        client.close();
    }
}

// 集群连接
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
        console.log(`集群值: ${value}`);
    } finally {
        client.close();
    }
}

standaloneExample().catch(console.error);
```

### Node.js 使用 ioValkey

**安装：**

```bash
npm install iovalkey
```

**使用：**

```typescript
import Valkey from "iovalkey";

// 基本连接
const valkey = new Valkey({
    host: "localhost",
    port: 6379,
    password: "your_password"
});

// 事件处理
valkey.on("connect", () => console.log("已连接到 Valkey"));
valkey.on("error", (err) => console.error("Valkey 错误:", err));

// 基本操作
async function basicOperations() {
    await valkey.set("message", "Hello, Valkey!");
    const message = await valkey.get("message");
    console.log(message);

    // 带过期时间
    await valkey.setex("temp:data", 60, "60秒后过期");

    // 递增
    await valkey.incr("counter");
    await valkey.incrby("counter", 10);
}

// 集群模式
import Valkey from "iovalkey";

const cluster = new Valkey.Cluster([
    { host: "node1", port: 6379 },
    { host: "node2", port: 6379 },
    { host: "node3", port: 6379 }
]);

cluster.set("cluster:key", "cluster:value");
```

### Java 使用 Valkey GLIDE

**Maven 依赖：**

```xml
<dependency>
    <groupId>io.valkey</groupId>
    <artifactId>valkey-glide</artifactId>
    <version>1.0.0</version>
</dependency>
```

**使用：**

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
            // 基本操作
            client.set(gs("java:key"), gs("java:value")).get();
            String value = client.get(gs("java:key")).get().toString();
            System.out.println("值: " + value);

            // 哈希操作
            client.hset(gs("user:java"), Map.of(
                gs("name"), gs("Bob"),
                gs("language"), gs("Java")
            )).get();

            String name = client.hget(gs("user:java"), gs("name")).get().toString();
            System.out.println("姓名: " + name);

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
            System.out.println("集群操作成功");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 发布/订阅模式

**发布者：**

```python
import asyncio
from glide import GlideClient, GlideClientConfiguration, NodeAddress

async def publisher():
    config = GlideClientConfiguration([NodeAddress("localhost", 6379)])
    client = await GlideClient.create(config)

    try:
        # 发布消息
        for i in range(10):
            message = f"事件 {i}: {asyncio.get_event_loop().time()}"
            subscribers = await client.publish("events:channel", message)
            print(f"发布到 {subscribers} 个订阅者: {message}")
            await asyncio.sleep(1)
    finally:
        client.close()

asyncio.run(publisher())
```

**订阅者（使用 redis-py）：**

```python
import redis

def subscriber():
    client = redis.Redis(host='localhost', port=6379, decode_responses=True)
    pubsub = client.pubsub()

    # 订阅频道
    pubsub.subscribe('events:channel')

    print("等待消息...")
    for message in pubsub.listen():
        if message['type'] == 'message':
            print(f"收到: {message['data']}")

subscriber()
```

### Streams 示例

```python
import redis
import time

client = redis.Redis(host='localhost', port=6379, decode_responses=True)

# 生产者：向流添加条目
def produce_events():
    for i in range(5):
        entry_id = client.xadd('mystream', {
            'sensor': 'temp_1',
            'value': str(20 + i),
            'timestamp': str(time.time())
        })
        print(f"添加条目: {entry_id}")
        time.sleep(0.5)

# 消费者：从流读取
def consume_events():
    # 读取所有条目
    entries = client.xrange('mystream', '-', '+')
    for entry_id, data in entries:
        print(f"条目 {entry_id}: {data}")

# 用于分布式处理的消费者组
def setup_consumer_group():
    try:
        client.xgroup_create('mystream', 'mygroup', id='0', mkstream=True)
    except redis.ResponseError:
        pass  # 组已存在

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
                    print(f"[{consumer_name}] 处理中: {data}")
                    # 确认消息
                    client.xack('mystream', 'mygroup', msg_id)
        else:
            print(f"[{consumer_name}] 没有新消息")

# 运行生产者和消费者
produce_events()
consume_events()
```

## 最佳实践

### 内存管理

**配置最大内存：**

```conf
# 设置内存限制
maxmemory 4gb

# 淘汰策略：
# volatile-lru    - 删除设置了过期时间的最近最少使用的键
# allkeys-lru     - 删除最近最少使用的键（任意键）
# volatile-lfu    - 删除设置了过期时间的最不常用的键
# allkeys-lfu     - 删除最不常用的键（任意键）
# volatile-random - 随机删除设置了过期时间的键
# allkeys-random  - 随机删除键
# volatile-ttl    - 删除 TTL 最短的键
# noeviction      - 内存满时返回错误

maxmemory-policy allkeys-lru

# LRU/LFU 算法的采样大小
maxmemory-samples 10
```

**监控内存使用：**

```shell
# 检查内存使用情况
127.0.0.1:6379> INFO memory
# Memory
used_memory:1024000
used_memory_human:1000.00K
used_memory_rss:2048000
used_memory_peak:1500000
maxmemory:4294967296
maxmemory_policy:allkeys-lru

# 分析键的内存使用
127.0.0.1:6379> MEMORY USAGE mykey
(integer) 72
```

**内存效率的键设计：**

```python
# 不好：冗长的键名
client.set('user:profile:information:details:12345', data)

# 好：简短、有意义的键名
client.set('u:p:12345', data)

# 使用哈希对相关数据进行分组（更节省内存）
# 不要这样做：
client.set('user:1000:name', 'Alice')
client.set('user:1000:email', 'alice@example.com')
client.set('user:1000:age', '30')

# 而是：
client.hset('user:1000', mapping={
    'name': 'Alice',
    'email': 'alice@example.com',
    'age': '30'
})
```

### 持久化策略

**开发环境：**

```conf
# 不持久化以获得最快性能
save ""
appendonly no
```

**生产环境 - 高持久性：**

```conf
# 频繁快照 + AOF
save 300 1
save 60 1000

appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes
```

**生产环境 - 性能优先：**

```conf
# 较少频率的快照
save 900 1
save 300 10

appendonly no
```

### 集群部署

**最小生产环境配置：**

```bash
# 创建 6 个节点（3 主 3 从）
valkey-server --port 7000 --cluster-enabled yes --cluster-config-file nodes-7000.conf
valkey-server --port 7001 --cluster-enabled yes --cluster-config-file nodes-7001.conf
valkey-server --port 7002 --cluster-enabled yes --cluster-config-file nodes-7002.conf
valkey-server --port 7003 --cluster-enabled yes --cluster-config-file nodes-7003.conf
valkey-server --port 7004 --cluster-enabled yes --cluster-config-file nodes-7004.conf
valkey-server --port 7005 --cluster-enabled yes --cluster-config-file nodes-7005.conf

# 创建集群
valkey-cli --cluster create \
    127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
    127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
    --cluster-replicas 1
```

**集群健康监控：**

```shell
# 检查集群状态
valkey-cli -c -p 7000 CLUSTER INFO

# 检查节点状态
valkey-cli -c -p 7000 CLUSTER NODES

# 检查槽位分布
valkey-cli -c -p 7000 CLUSTER SLOTS
```

### 连接池

```python
import redis

# 配置连接池
pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    max_connections=50,
    socket_timeout=5,
    socket_connect_timeout=5,
    retry_on_timeout=True
)

# 对所有操作使用连接池
client = redis.Redis(connection_pool=pool)

# 集群的连接池
from redis.cluster import RedisCluster

cluster = RedisCluster(
    host='node1',
    port=6379,
    max_connections=20,
    max_connections_per_node=True
)
```

## 常见陷阱

### 迁移陷阱

**1. 客户端库兼容性**

```python
# 大多数 Redis 客户端无需更改即可工作
# 但需要验证你的具体客户端版本

# redis-py 4.x+ 可与 Valkey 配合使用
import redis
client = redis.Redis(host='valkey-server', port=6379)

# 使用 GLIDE 客户端（最佳性能）
from glide import GlideClient
```

**2. 模块兼容性**

```shell
# 检查是否使用了 Redis 模块
# Valkey 可能不支持所有专有 Redis 模块

# 支持：核心命令、Lua 脚本
# 可能需要替代方案：RedisJSON、RediSearch、RedisTimeSeries

# 检查已加载的模块
127.0.0.1:6379> MODULE LIST
```

**3. 配置差异**

```conf
# 将 redis.conf 重命名为 valkey.conf
# 大多数指令是相同的

# 二进制文件名变更：
# redis-server -> valkey-server
# redis-cli -> valkey-cli
# redis-benchmark -> valkey-benchmark
```

### 性能陷阱

**1. 大键上的阻塞操作**

```python
# 不好：KEYS 命令会阻塞服务器
keys = client.keys('user:*')  # 生产环境中绝不使用！

# 好：使用 SCAN 进行迭代
cursor = 0
all_keys = []
while True:
    cursor, keys = client.scan(cursor, match='user:*', count=100)
    all_keys.extend(keys)
    if cursor == 0:
        break
```

**2. 大键反模式**

```python
# 不好：包含数百万元素的巨大列表
client.lpush('huge_list', *range(10000000))

# 好：分区大数据集
def partition_key(base_key, item_id, partition_size=10000):
    partition = item_id // partition_size
    return f"{base_key}:{partition}"
```

**3. 缺少连接池**

```python
# 不好：每次请求创建新连接
def bad_get_user(user_id):
    client = redis.Redis(host='localhost', port=6379)
    return client.get(f'user:{user_id}')

# 好：复用连接池
pool = redis.ConnectionPool(host='localhost', port=6379, max_connections=20)

def good_get_user(user_id):
    client = redis.Redis(connection_pool=pool)
    return client.get(f'user:{user_id}')
```

### 集群陷阱

**1. 跨槽位的多键操作**

```python
# 不好：键可能在不同节点上
client.mget('user:1', 'user:2', 'user:3')  # 在集群中可能失败

# 好：使用哈希标签确保同一槽位
client.mget('{user}:1', '{user}:2', '{user}:3')  # 全部到同一槽位
```

**2. 跨槽位键的 Lua 脚本**

```lua
-- 不好：键在不同槽位
local val1 = redis.call('GET', KEYS[1])  -- user:1
local val2 = redis.call('GET', KEYS[2])  -- order:1

-- 好：使用哈希标签
local val1 = redis.call('GET', KEYS[1])  -- {entity}:user:1
local val2 = redis.call('GET', KEYS[2])  -- {entity}:order:1
```

## 性能考量

### 基准测试结果 (Valkey 8.0)

Valkey 8.0 增强的 I/O 线程显示出显著改进：

| 指标 | Valkey 7.2 | Valkey 8.0 | 提升 |
|------|------------|------------|------|
| 吞吐量 (RPS) | 360,000 | 1,190,000 | 230% |
| 延迟 (p99) | 1.2ms | 0.8ms | 33% |
| CPU 利用率 | 25% | 85% | 多核心 |

*在 AWS c7g.4xlarge (Graviton3, 16 vCPUs) 上测试*

### I/O 线程配置

```conf
# 启用 I/O 线程以提高吞吐量
io-threads 4

# 启用线程读取（默认禁用）
io-threads-do-reads yes

# 建议：将 io-threads 设置为 CPU 核心数 - 1
# 为主线程保留一个核心
```

### 延迟优化

```conf
# 禁用透明大页（Linux）
# echo never > /sys/kernel/mm/transparent_hugepage/enabled

# 增加 TCP 积压
tcp-backlog 511

# 非调试场景禁用慢日志
slowlog-log-slower-than 10000
slowlog-max-len 128

# 主动碎片整理
activedefrag yes
active-defrag-ignore-bytes 100mb
active-defrag-threshold-lower 10
active-defrag-threshold-upper 100
```

### 内存优化

```conf
# 使用 jemalloc（Linux 默认）
# 编译时使用：make MALLOC=jemalloc

# 启用惰性释放以获得更好性能
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes

# 优化哈希存储
hash-max-listpack-entries 512
hash-max-listpack-value 64

# 优化列表存储
list-max-listpack-size -2
list-compress-depth 0

# 优化集合存储
set-max-intset-entries 512
set-max-listpack-entries 128
set-max-listpack-value 64
```

### 性能监控

```shell
# 实时统计
valkey-cli INFO stats

# 慢查询日志
valkey-cli SLOWLOG GET 10

# 内存分析
valkey-cli MEMORY DOCTOR

# 客户端连接
valkey-cli CLIENT LIST

# 命令统计
valkey-cli INFO commandstats
```

## 实战场景

### 缓存层

```python
import redis
import json
import hashlib
from functools import wraps

client = redis.Redis(host='localhost', port=6379, decode_responses=True)

def cache(ttl=3600):
    """缓存函数结果的装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 生成缓存键
            key_data = f"{func.__name__}:{args}:{sorted(kwargs.items())}"
            cache_key = f"cache:{hashlib.md5(key_data.encode()).hexdigest()}"

            # 尝试从缓存获取
            cached = client.get(cache_key)
            if cached:
                return json.loads(cached)

            # 执行函数并缓存结果
            result = func(*args, **kwargs)
            client.setex(cache_key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator

@cache(ttl=300)
def get_user_profile(user_id):
    # 昂贵的数据库查询
    return {"id": user_id, "name": "Alice", "email": "alice@example.com"}
```

### 会话存储

```python
import redis
import json
import uuid
from datetime import datetime

class SessionManager:
    def __init__(self, host='localhost', port=6379):
        self.client = redis.Redis(host=host, port=port, decode_responses=True)
        self.session_ttl = 3600  # 1小时

    def create_session(self, user_id, data=None):
        session_id = str(uuid.uuid4())
        session_data = {
            'user_id': user_id,
            'created_at': datetime.utcnow().isoformat(),
            'data': data or {}
        }

        key = f"session:{session_id}"
        self.client.setex(key, self.session_ttl, json.dumps(session_data))

        # 跟踪用户的会话
        self.client.sadd(f"user:sessions:{user_id}", session_id)

        return session_id

    def get_session(self, session_id):
        key = f"session:{session_id}"
        data = self.client.get(key)

        if data:
            # 访问时刷新 TTL
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

### 消息队列

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
        """添加任务到队列，可选优先级"""
        task = {
            'id': str(uuid.uuid4()),
            'data': task_data,
            'created_at': time.time()
        }
        # 使用有序集合实现优先级队列
        self.client.zadd(self.queue_name, {json.dumps(task): priority})
        return task['id']

    def dequeue(self, timeout: int = 0):
        """从队列获取下一个任务（阻塞）"""
        # 从队列移动到处理中
        result = self.client.bzpopmin(self.queue_name, timeout)
        if result:
            _, task_json, _ = result
            task = json.loads(task_json)
            # 在处理中集合跟踪
            self.client.hset(self.processing_name, task['id'], task_json)
            return task
        return None

    def complete(self, task_id: str):
        """标记任务完成"""
        self.client.hdel(self.processing_name, task_id)

    def fail(self, task_id: str, requeue: bool = True):
        """处理失败的任务"""
        task_json = self.client.hget(self.processing_name, task_id)
        self.client.hdel(self.processing_name, task_id)

        if requeue and task_json:
            task = json.loads(task_json)
            task['retries'] = task.get('retries', 0) + 1
            if task['retries'] < 3:
                self.client.zadd(self.queue_name, {json.dumps(task): -1})  # 高优先级重试

# 工作者实现
def worker(queue: SimpleQueue, handler: Callable[[dict], Any]):
    while True:
        task = queue.dequeue(timeout=5)
        if task:
            try:
                handler(task['data'])
                queue.complete(task['id'])
            except Exception as e:
                print(f"任务失败: {e}")
                queue.fail(task['id'], requeue=True)
```

### 实时排行榜

```python
import redis
from datetime import datetime

class Leaderboard:
    def __init__(self, name, host='localhost', port=6379):
        self.client = redis.Redis(host=host, port=port, decode_responses=True)
        self.leaderboard_key = f"leaderboard:{name}"

    def update_score(self, player_id: str, score: float):
        """更新玩家分数（或添加新玩家）"""
        self.client.zadd(self.leaderboard_key, {player_id: score})

    def increment_score(self, player_id: str, increment: float):
        """增加玩家分数"""
        return self.client.zincrby(self.leaderboard_key, increment, player_id)

    def get_rank(self, player_id: str) -> int:
        """获取玩家排名（0索引，最高分 = 排名 0）"""
        rank = self.client.zrevrank(self.leaderboard_key, player_id)
        return rank if rank is not None else -1

    def get_score(self, player_id: str) -> float:
        """获取玩家分数"""
        return self.client.zscore(self.leaderboard_key, player_id)

    def get_top_players(self, count: int = 10):
        """获取前 N 名玩家"""
        return self.client.zrevrange(
            self.leaderboard_key,
            0,
            count - 1,
            withscores=True
        )

    def get_players_around(self, player_id: str, count: int = 5):
        """获取特定玩家周围的玩家"""
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
        """获取玩家总数"""
        return self.client.zcard(self.leaderboard_key)

# 使用
leaderboard = Leaderboard('game:daily')
leaderboard.update_score('player:alice', 1500)
leaderboard.update_score('player:bob', 2200)
leaderboard.update_score('player:charlie', 1800)

print(f"顶级玩家: {leaderboard.get_top_players(3)}")
print(f"Alice 的排名: {leaderboard.get_rank('player:alice')}")
```

### 限流

```python
import redis
import time

class RateLimiter:
    def __init__(self, host='localhost', port=6379):
        self.client = redis.Redis(host=host, port=port)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """滑动窗口限流器"""
        now = time.time()
        window_start = now - window_seconds

        pipe = self.client.pipeline()

        # 移除旧条目
        pipe.zremrangebyscore(key, 0, window_start)

        # 计算当前条目
        pipe.zcard(key)

        # 添加当前请求
        pipe.zadd(key, {str(now): now})

        # 设置过期
        pipe.expire(key, window_seconds)

        results = pipe.execute()
        current_count = results[1]

        return current_count < max_requests

    def get_remaining(self, key: str, max_requests: int, window_seconds: int) -> int:
        """获取当前窗口中的剩余请求数"""
        now = time.time()
        window_start = now - window_seconds

        # 清理并计数
        self.client.zremrangebyscore(key, 0, window_start)
        current_count = self.client.zcard(key)

        return max(0, max_requests - current_count)

# 与 Flask 一起使用
from flask import Flask, request, jsonify

app = Flask(__name__)
limiter = RateLimiter()

@app.before_request
def rate_limit():
    key = f"rate_limit:{request.remote_addr}"
    if not limiter.is_allowed(key, max_requests=100, window_seconds=60):
        return jsonify({"error": "超出速率限制"}), 429
```

## 面试要点

### 常见面试问题

**Q1：什么是 Valkey，为什么创建它？**

Valkey 是 Linux 基金会支持的 Redis 7.2.4 分支，于 2024 年 3 月创建，起因是 Redis Inc. 将许可证从 BSD 3-clause 更改为 RSALv2/SSPLv1。它保持原始的开源 BSD 许可证，并与 Redis 完全命令兼容。

**Q2：解释 Valkey 的数据结构及其用例。**

| 数据结构 | 描述 | 用例 |
|---------|------|------|
| 字符串 | 二进制安全的字节序列 | 缓存、计数器、会话令牌 |
| 列表 | 有序集合 | 队列、活动流、日志 |
| 集合 | 无序唯一元素 | 标签、独立访客、社交图谱 |
| 有序集合 | 带分数的有序唯一元素 | 排行榜、优先级队列、时间序列 |
| 哈希 | 字段-值映射 | 用户档案、对象、配置 |
| 流 | 追加日志结构 | 事件溯源、消息队列 |
| 位图 | 位数组 | 功能标志、用户在线状态 |
| HyperLogLog | 概率基数估计 | 唯一计数估算 |

**Q3：Valkey 的持久化是如何工作的？**

两种机制：
- **RDB**：时间点快照，恢复更快，可能丢失数据
- **AOF**：追加日志，持久性更好，文件更大

最佳实践：同时使用两者，配置 `aof-use-rdb-preamble yes` 以获得最佳平衡。

**Q4：解释 Valkey 集群架构。**

- 数据被分成 16,384 个哈希槽
- 每个主节点处理一部分槽位
- 副本为每个主节点提供冗余
- 最小推荐配置：3 主 + 3 从
- 主节点故障时自动故障转移
- 使用哈希标签 `{tag}:key` 将相关键放在同一位置

**Q5：Valkey 中的淘汰策略有哪些？**

| 策略 | 描述 |
|------|------|
| volatile-lru | 淘汰设置了 TTL 的 LRU 键 |
| allkeys-lru | 淘汰 LRU 键（任意） |
| volatile-lfu | 淘汰设置了 TTL 的 LFU 键 |
| allkeys-lfu | 淘汰 LFU 键（任意） |
| volatile-random | 随机淘汰设置了 TTL 的键 |
| allkeys-random | 随机淘汰键 |
| volatile-ttl | 先淘汰 TTL 最短的键 |
| noeviction | 内存满时返回错误 |

**Q6：如何使用 Valkey 实现分布式锁？**

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
        # Lua 脚本确保原子性
        script = """
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
        else
            return 0
        end
        """
        return self.client.execute_command('EVAL', script, 1, self.lock_name, self.token)
```

**Q7：Valkey 8.0 与早期版本有哪些主要区别？**

- 增强的 I/O 线程（吞吐量提升 230%）
- 实验性 RDMA 支持
- 每槽位指标以获得更好的可观测性
- 改进的多核 CPU 利用率
- 更好的内存效率

**Q8：如何处理缓存惊群？**

```python
import random
import time

def get_with_probabilistic_early_expiration(client, key, ttl, compute_fn):
    """概率性提前过期以防止惊群"""
    cached = client.get(key)

    if cached:
        value, expire_time = json.loads(cached)

        # 概率性提前刷新
        remaining = expire_time - time.time()
        delta = ttl * 0.1  # TTL 的 10%

        if remaining < delta * random.random():
            # 提前刷新
            new_value = compute_fn()
            store_value(client, key, new_value, ttl)
            return new_value

        return value

    # 缓存未命中 - 计算并存储
    value = compute_fn()
    store_value(client, key, value, ttl)
    return value
```

## 延伸阅读

### 官方资源

- [Valkey 官方网站](https://valkey.io/) - 文档和下载
- [Valkey GitHub 仓库](https://github.com/valkey-io/valkey) - 源代码
- [Valkey GLIDE 客户端](https://github.com/valkey-io/valkey-glide) - 官方多语言客户端
- [Valkey 文档](https://valkey.io/docs/) - 完整参考

### 托管服务

- [Amazon ElastiCache for Valkey](https://aws.amazon.com/elasticache/) - AWS 托管服务
- [Aiven for Valkey](https://aiven.io/valkey) - 多云托管服务
- [DigitalOcean Valkey](https://docs.digitalocean.com/products/databases/valkey/) - DigitalOcean 托管服务

### 社区资源

- [Valkey 讨论论坛](https://github.com/valkey-io/valkey/discussions) - 社区问答
- [Linux 基金会 Valkey 页面](https://www.linuxfoundation.org/projects/valkey) - 项目治理
- [iovalkey](https://github.com/valkey-io/iovalkey) - Node.js 客户端
- [valkey-py](https://github.com/valkey-io/valkey-py) - Python 客户端

### 迁移资源

- [Redis 到 Valkey 迁移指南](https://valkey.io/docs/migration/) - 官方迁移文档
- [Valkey 兼容性文档](https://valkey.io/docs/compatibility/) - 命令兼容性参考

### 性能与基准测试

- [Valkey 8.0 性能分析](https://valkey.io/blog/valkey-8-performance/) - 官方基准测试
- [Valkey vs Redis 对比](https://betterstack.com/community/comparisons/redis-vs-valkey/) - 独立分析

Valkey 代表了在真正开源治理下内存数据存储的持续演进。凭借其强大的社区支持、企业采用和积极开发，它为构建高性能应用程序提供了可靠的基础，同时确保开源软件应有的自由。
