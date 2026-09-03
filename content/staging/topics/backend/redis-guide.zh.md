---
title: Redis 深入实战
description: 掌握Redis数据结构、持久化、集群和常见应用场景
track: backend
section: databases
difficulty: intermediate
tags:
  - Redis
  - 缓存
  - NoSQL
status: imported
origin: old/src/content/docs/backend/redis-guide.zh.md
divergence: 0.251
issues:
  - order-mismatch
legacy:
  category: Backend
  subcategory: Database
  order: 13
  lastUpdated: 2026-01-07
---

## 概念解释

Redis（Remote Dictionary Server）是一个开源的、基于内存的高性能键值存储数据库。它支持多种数据结构，具备持久化能力，并提供丰富的功能特性，被广泛应用于缓存、会话管理、消息队列、实时分析等场景。

### Redis 的核心特性

- **高性能**：基于内存操作，单线程模型避免了上下文切换，读写性能可达 10 万+ QPS
- **丰富的数据结构**：支持 String、List、Hash、Set、Sorted Set、Stream 等多种数据类型
- **原子性操作**：所有操作都是原子性的，支持事务和 Lua 脚本
- **持久化**：支持 RDB 快照和 AOF 日志两种持久化方式
- **高可用**：支持主从复制、哨兵模式和集群模式
- **丰富的功能**：发布订阅、Lua 脚本、过期键、慢查询日志等

### 单线程模型

Redis 的核心处理采用单线程模型，这带来了几个优势：

1. 避免了多线程的上下文切换开销
2. 不需要考虑加锁和死锁问题
3. 代码更清晰，维护更简单

但这也意味着要避免执行耗时的命令（如 KEYS *），否则会阻塞其他请求。Redis 6.0 引入了多线程 IO，但核心处理仍然是单线程的。

---

## 数据结构详解

Redis 提供了五种基础数据结构和多种高级数据结构，每种都有其特定的应用场景。

### String（字符串）

String 是 Redis 最基本的数据类型，可以存储字符串、整数或浮点数，最大容量为 512MB。

```bash
# 基本操作
SET name "redis"
GET name

# 设置过期时间（秒）
SETEX session:123 3600 "user_data"

# 原子递增/递减
INCR counter
INCRBY counter 10
DECR counter

# 批量操作
MSET key1 "value1" key2 "value2"
MGET key1 key2

# 仅当键不存在时设置（常用于分布式锁）
SETNX lock:resource "holder_id"
```

**底层实现**：Redis 使用 SDS（Simple Dynamic String）而非 C 语言原生字符串，具备以下优势：
- O(1) 时间复杂度获取字符串长度
- 杜绝缓冲区溢出
- 减少内存重分配次数
- 二进制安全

**应用场景**：缓存对象、计数器、分布式锁、会话管理

### List（列表）

List 是一个双向链表结构，支持从两端进行插入和删除操作。

```bash
# 从左/右插入
LPUSH mylist "a" "b" "c"
RPUSH mylist "x" "y" "z"

# 从左/右弹出
LPOP mylist
RPOP mylist

# 获取指定范围元素
LRANGE mylist 0 -1

# 获取列表长度
LLEN mylist

# 阻塞式弹出（常用于消息队列）
BLPOP queue 30

# 从一个列表弹出并推入另一个列表
RPOPLPUSH source destination
```

**底层实现**：Redis 3.2 之前使用 ziplist 或 linkedlist，之后统一使用 quicklist（ziplist + linkedlist 的结合）。

**应用场景**：消息队列、文章列表、最新动态

### Hash（哈希）

Hash 适合存储对象，可以对单个字段进行操作。

```bash
# 设置/获取字段
HSET user:1001 name "张三" age 25 city "北京"
HGET user:1001 name
HGETALL user:1001

# 批量操作
HMSET user:1002 name "李四" age 30
HMGET user:1002 name age

# 字段递增
HINCRBY user:1001 age 1

# 检查字段是否存在
HEXISTS user:1001 email

# 获取所有字段/值
HKEYS user:1001
HVALS user:1001
```

**底层实现**：当字段较少且值较小时使用 ziplist，否则使用 hashtable。

**应用场景**：存储用户信息、商品详情、配置信息

### Set（集合）

Set 是无序的字符串集合，元素唯一，支持集合运算。

```bash
# 添加/移除元素
SADD tags "redis" "database" "nosql"
SREM tags "nosql"

# 判断元素是否存在
SISMEMBER tags "redis"

# 获取所有元素
SMEMBERS tags

# 集合运算
SINTER set1 set2        # 交集
SUNION set1 set2        # 并集
SDIFF set1 set2         # 差集

# 随机获取元素
SRANDMEMBER tags 2
SPOP tags               # 随机弹出
```

**底层实现**：当元素都是整数且数量较少时使用 intset，否则使用 hashtable。

**应用场景**：标签系统、共同好友、点赞用户、抽奖活动

### Sorted Set（有序集合）

Sorted Set 在 Set 基础上为每个元素关联一个分数（score），元素按分数排序。

```bash
# 添加元素（带分数）
ZADD leaderboard 100 "player:1" 85 "player:2" 95 "player:3"

# 获取排名（从低到高）
ZRANK leaderboard "player:1"
# 获取排名（从高到低）
ZREVRANK leaderboard "player:1"

# 按排名范围获取
ZRANGE leaderboard 0 2 WITHSCORES
ZREVRANGE leaderboard 0 2 WITHSCORES

# 按分数范围获取
ZRANGEBYSCORE leaderboard 80 100

# 增加分数
ZINCRBY leaderboard 10 "player:2"

# 获取元素数量
ZCARD leaderboard
```

**底层实现**：使用 skiplist（跳跃表）+ hashtable 实现，跳跃表支持 O(logN) 的插入和查找。

**应用场景**：排行榜、延时队列、范围查询

### Stream（流）

Stream 是 Redis 5.0 引入的数据类型，专为消息队列设计，支持消费者组。

```bash
# 添加消息
XADD mystream * field1 value1 field2 value2

# 读取消息
XREAD COUNT 10 STREAMS mystream 0

# 创建消费者组
XGROUP CREATE mystream mygroup $ MKSTREAM

# 消费者读取消息
XREADGROUP GROUP mygroup consumer1 COUNT 1 STREAMS mystream >

# 确认消息
XACK mystream mygroup 1526569495631-0

# 获取流信息
XINFO STREAM mystream
```

**应用场景**：消息队列、事件溯源、日志收集

---

## 持久化

Redis 提供两种持久化机制，确保数据不会因服务重启而丢失。

### RDB（Redis Database）

RDB 通过快照方式将某一时刻的内存数据保存到磁盘的 RDB 文件中。

**配置方式**：

```bash
# redis.conf
save 900 1      # 900秒内有1次修改
save 300 10     # 300秒内有10次修改
save 60 10000   # 60秒内有10000次修改

dbfilename dump.rdb
dir /var/lib/redis
```

**触发方式**：
- 自动触发：满足 save 配置条件
- 手动触发：执行 SAVE（阻塞）或 BGSAVE（后台）命令
- 关闭服务时自动触发

**优点**：
- RDB 文件紧凑，适合备份和恢复
- 恢复速度快于 AOF
- 对性能影响较小（fork 子进程处理）

**缺点**：
- 可能丢失最后一次快照后的数据
- 数据量大时 fork 操作可能阻塞主进程

### AOF（Append Only File）

AOF 以追加方式记录每个写操作命令，重启时重新执行这些命令恢复数据。

**配置方式**：

```bash
# redis.conf
appendonly yes
appendfilename "appendonly.aof"

# 同步策略
appendfsync always    # 每个命令都同步（最安全，最慢）
appendfsync everysec  # 每秒同步（推荐，平衡性能和安全）
appendfsync no        # 由操作系统决定（最快，可能丢失数据）
```

**AOF 重写**：

随着时间推移，AOF 文件会不断增大。Redis 提供重写机制来压缩 AOF 文件：

```bash
# 手动触发重写
BGREWRITEAOF

# 自动触发配置
auto-aof-rewrite-percentage 100  # 文件增长100%时触发
auto-aof-rewrite-min-size 64mb   # 最小重写大小
```

**优点**：
- 数据安全性更高
- 即使文件损坏也可以部分恢复
- AOF 文件可读性好，便于分析

**缺点**：
- 文件通常比 RDB 大
- 恢复速度慢于 RDB
- 写入性能略低于 RDB

### 混合持久化

Redis 4.0 引入混合持久化，结合两者优点：

```bash
aof-use-rdb-preamble yes
```

重写后的 AOF 文件前半部分是 RDB 格式的全量数据，后半部分是 AOF 格式的增量数据。

---

## 内存管理与淘汰策略

### 内存配置

```bash
# 设置最大内存
maxmemory 4gb

# 查看内存使用
INFO memory
```

### 淘汰策略

当内存达到上限时，Redis 会根据配置的策略淘汰键：

| 策略 | 描述 |
|------|------|
| noeviction | 不淘汰，写操作返回错误（默认） |
| allkeys-lru | 所有键中淘汰最近最少使用的 |
| volatile-lru | 设置过期时间的键中淘汰最近最少使用的 |
| allkeys-lfu | 所有键中淘汰最不经常使用的（Redis 4.0+） |
| volatile-lfu | 设置过期时间的键中淘汰最不经常使用的 |
| allkeys-random | 随机淘汰任意键 |
| volatile-random | 随机淘汰设置过期时间的键 |
| volatile-ttl | 淘汰即将过期的键 |

```bash
maxmemory-policy allkeys-lru
```

### 过期键删除策略

Redis 采用惰性删除 + 定期删除的组合策略：

- **惰性删除**：访问键时检查是否过期，过期则删除
- **定期删除**：每 100ms 随机检查部分键，删除过期的键

---

## 主从复制与哨兵

### 主从复制

主从复制实现数据的多副本备份，从节点可以分担读压力。

```bash
# 从节点配置
replicaof 192.168.1.100 6379

# 或运行时设置
REPLICAOF 192.168.1.100 6379

# 查看复制信息
INFO replication
```

**复制过程**：
1. 从节点发送 PSYNC 命令
2. 主节点执行 BGSAVE 生成 RDB 文件
3. 主节点发送 RDB 文件给从节点
4. 主节点发送复制期间的写命令
5. 从节点加载 RDB 并执行后续命令

### 哨兵模式（Sentinel）

哨兵用于监控主从节点，实现自动故障转移。

```bash
# sentinel.conf
sentinel monitor mymaster 192.168.1.100 6379 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
sentinel parallel-syncs mymaster 1
```

**工作原理**：
1. 哨兵定期向主从节点发送 PING 命令
2. 当主节点在指定时间内未响应，标记为主观下线
3. 多数哨兵确认后，标记为客观下线
4. 选举领导哨兵执行故障转移
5. 选择一个从节点升级为主节点
6. 通知其他从节点和客户端

---

## Redis Cluster

Redis Cluster 是官方提供的分布式解决方案，支持数据分片和高可用。

### 数据分片

Cluster 将数据分布在 16384 个哈希槽中，每个节点负责部分槽位：

```bash
# 计算键属于哪个槽
CLUSTER KEYSLOT mykey
```

### 集群搭建

```bash
# 创建集群（至少6个节点：3主3从）
redis-cli --cluster create \
  192.168.1.101:6379 192.168.1.102:6379 192.168.1.103:6379 \
  192.168.1.104:6379 192.168.1.105:6379 192.168.1.106:6379 \
  --cluster-replicas 1
```

### 集群操作

```bash
# 查看集群信息
CLUSTER INFO
CLUSTER NODES

# 添加节点
redis-cli --cluster add-node new_host:port existing_host:port

# 重新分片
redis-cli --cluster reshard host:port
```

### 集群限制

- 不支持多键操作（除非使用 hash tag）
- 不支持 SELECT 命令（只有 db0）
- 事务仅支持同一节点的键

```bash
# 使用 hash tag 确保键在同一节点
SET {user:1000}.name "张三"
SET {user:1000}.age 25
```

---

## 常见应用场景

### 缓存

缓存是 Redis 最常见的应用场景：

```python
def get_user(user_id):
    # 先从缓存获取
    cache_key = f"user:{user_id}"
    cached = redis.get(cache_key)
    if cached:
        return json.loads(cached)

    # 缓存未命中，查询数据库
    user = db.query_user(user_id)
    if user:
        # 写入缓存，设置过期时间
        redis.setex(cache_key, 3600, json.dumps(user))
    return user
```

### 分布式锁

使用 SETNX 实现分布式锁：

```python
def acquire_lock(lock_name, timeout=10):
    lock_key = f"lock:{lock_name}"
    identifier = str(uuid.uuid4())

    # 设置锁，带过期时间防止死锁
    if redis.set(lock_key, identifier, nx=True, ex=timeout):
        return identifier
    return None

def release_lock(lock_name, identifier):
    lock_key = f"lock:{lock_name}"
    # 使用 Lua 脚本保证原子性
    script = """
    if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
    else
        return 0
    end
    """
    return redis.execute_script(script, 1, lock_key, identifier)
```

更推荐使用 Redlock 算法或 Redisson 等成熟的分布式锁实现。

### 排行榜

利用 Sorted Set 实现排行榜：

```python
# 更新分数
def update_score(user_id, score):
    redis.zadd("leaderboard", {user_id: score})

# 获取排行榜 TOP 10
def get_top10():
    return redis.zrevrange("leaderboard", 0, 9, withscores=True)

# 获取用户排名
def get_rank(user_id):
    rank = redis.zrevrank("leaderboard", user_id)
    return rank + 1 if rank is not None else None

# 获取用户周围的排名
def get_around_rank(user_id, n=5):
    rank = redis.zrevrank("leaderboard", user_id)
    if rank is None:
        return []
    start = max(0, rank - n)
    end = rank + n
    return redis.zrevrange("leaderboard", start, end, withscores=True)
```

### 消息队列

使用 List 实现简单消息队列：

```python
# 生产者
def produce(queue_name, message):
    redis.lpush(queue_name, json.dumps(message))

# 消费者
def consume(queue_name, timeout=0):
    result = redis.brpop(queue_name, timeout)
    if result:
        return json.loads(result[1])
    return None
```

对于复杂场景，推荐使用 Stream 或专业的消息队列如 RabbitMQ、Kafka。

---

## Lua 脚本

Lua 脚本可以保证多个命令的原子性执行，避免竞态条件。

### 基本使用

```bash
# 执行 Lua 脚本
redis-cli --eval script.lua key1 key2 , arg1 arg2

# 复杂脚本示例：原子性的库存扣减
# script.lua
local stock = tonumber(redis.call('GET', KEYS[1]))
if stock >= tonumber(ARGV[1]) then
    redis.call('DECRBY', KEYS[1], ARGV[1])
    return 1
else
    return 0
end
```

### 脚本管理

```bash
# 加载脚本（返回 SHA1）
SCRIPT LOAD "return redis.call('GET', KEYS[1])"

# 通过 SHA1 执行
EVALSHA sha1_value 1 mykey

# 检查脚本是否存在
SCRIPT EXISTS sha1_value

# 清除所有脚本缓存
SCRIPT FLUSH
```

### 注意事项

- 脚本执行期间会阻塞其他命令
- 避免在脚本中执行耗时操作
- 脚本应该是纯函数，便于重试

---

## 缓存问题

### 缓存穿透

缓存穿透指查询一个不存在的数据，导致请求直接打到数据库。

**解决方案**：

1. **缓存空值**：

```python
def get_data(key):
    cached = redis.get(key)
    if cached is not None:
        if cached == "":  # 空值标记
            return None
        return json.loads(cached)

    data = db.query(key)
    if data is None:
        redis.setex(key, 300, "")  # 缓存空值
    else:
        redis.setex(key, 3600, json.dumps(data))
    return data
```

2. **布隆过滤器**：

```python
# 使用 RedisBloom 模块
bf = redis.bf()
bf.add("user_filter", user_id)

def get_user(user_id):
    if not bf.exists("user_filter", user_id):
        return None  # 一定不存在
    # 继续正常查询流程
```

### 缓存击穿

缓存击穿指热点数据过期瞬间，大量请求打到数据库。

**解决方案**：

1. **互斥锁**：

```python
def get_hot_data(key):
    cached = redis.get(key)
    if cached:
        return json.loads(cached)

    # 获取锁
    lock_key = f"lock:{key}"
    if redis.setnx(lock_key, 1):
        redis.expire(lock_key, 10)
        try:
            data = db.query(key)
            redis.setex(key, 3600, json.dumps(data))
            return data
        finally:
            redis.delete(lock_key)
    else:
        # 等待重试
        time.sleep(0.1)
        return get_hot_data(key)
```

2. **逻辑过期**：缓存永不过期，但存储逻辑过期时间，后台异步更新。

### 缓存雪崩

缓存雪崩指大量缓存同时过期或 Redis 服务不可用，导致数据库压力骤增。

**解决方案**：

1. **过期时间随机化**：

```python
base_ttl = 3600
random_ttl = base_ttl + random.randint(0, 300)
redis.setex(key, random_ttl, value)
```

2. **多级缓存**：本地缓存 + Redis + 数据库

3. **限流降级**：使用限流器保护后端服务

4. **高可用部署**：使用哨兵或集群模式

---

## 面试要点

### 常见面试题

1. **Redis 为什么这么快？**
   - 基于内存操作
   - 单线程模型避免上下文切换
   - 高效的数据结构
   - IO 多路复用

2. **Redis 和 Memcached 的区别？**
   - Redis 支持更丰富的数据结构
   - Redis 支持持久化
   - Redis 支持集群
   - Memcached 多线程，适合纯缓存场景

3. **如何保证缓存和数据库一致性？**
   - Cache Aside Pattern（旁路缓存）
   - 先更新数据库，后删除缓存
   - 延迟双删
   - 订阅 binlog 异步更新缓存

4. **大 Key 问题如何处理？**
   - 拆分成多个小 Key
   - 使用 Hash 存储
   - 设置合理的过期时间
   - 使用 SCAN 代替 KEYS

5. **热 Key 问题如何处理？**
   - 本地缓存
   - 读写分离
   - 热点数据复制到多个节点

### 生产环境注意事项

- 禁用危险命令：KEYS、FLUSHALL、FLUSHDB
- 设置合理的 maxmemory 和淘汰策略
- 开启慢查询日志
- 监控内存、连接数、命中率等指标
- 定期备份 RDB/AOF 文件

---

## 延伸阅读

### 官方资源

- [Redis 官方文档](https://redis.io/documentation)
- [Redis 命令参考](https://redis.io/commands)
- [Redis GitHub](https://github.com/redis/redis)

### 推荐书籍

- 《Redis 设计与实现》- 黄健宏
- 《Redis 实战》- Josiah Carlson
- 《Redis 开发与运维》- 付磊、张益军

### 相关工具

- **Redis Insight**：官方 GUI 管理工具
- **RedisBloom**：布隆过滤器模块
- **Redisson**：Java Redis 客户端，支持分布式锁等高级功能
- **Twemproxy**：代理层分片方案

### 进阶主题

- Redis Module 开发
- Redis 源码分析
- Redis 性能调优
- Redis 安全最佳实践

---

通过本文的学习，你应该对 Redis 的核心概念、数据结构、持久化、高可用方案以及常见应用场景有了全面的了解。在实际工作中，建议根据具体业务需求选择合适的数据结构和架构方案，并持续关注 Redis 的最新发展。
