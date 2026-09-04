---
title: 系统设计案例分析
description: 通过经典系统设计案例，掌握大规模系统设计方法
track: architecture
section: system-design
difficulty: advanced
tags:
  - 系统设计
  - 案例分析
  - 架构
  - 面试
status: imported
origin: old/src/content/docs/architecture/system-design-cases.zh.md
divergence: 0.228
issues: []
legacy:
  category: Architecture
  subcategory: System Design
  order: 10
  lastUpdated: 2026-01-07
---

系统设计是衡量高级工程师能力的重要标准。通过分析经典系统设计案例，我们能够掌握大规模分布式系统的设计思路、常见问题的解决方案以及各种技术选型的权衡。本文将深入剖析多个经典系统设计案例，帮助你建立系统性的设计思维。

## 系统设计面试方法论

### RADIO 框架

在系统设计面试中，推荐使用 RADIO 框架来组织你的思路和回答：

```
+-------------------------------------------------------------------+
|                        RADIO 框架                                  |
+-------------------------------------------------------------------+
|  R - Requirements (需求澄清)                                       |
|      |-- 功能性需求：核心功能、用户场景                              |
|      +-- 非功能性需求：QPS、延迟、可用性、数据量                      |
+-------------------------------------------------------------------+
|  A - Architecture (高层架构)                                       |
|      |-- 核心组件识别                                              |
|      +-- 组件间交互关系                                            |
+-------------------------------------------------------------------+
|  D - Data Model (数据模型)                                         |
|      |-- 数据库选型                                                |
|      +-- Schema 设计                                               |
+-------------------------------------------------------------------+
|  I - Interface (接口设计)                                          |
|      |-- API 设计                                                  |
|      +-- 协议选择                                                  |
+-------------------------------------------------------------------+
|  O - Optimization (优化与扩展)                                     |
|      |-- 性能优化                                                  |
|      |-- 可扩展性                                                  |
|      +-- 容错与高可用                                              |
+-------------------------------------------------------------------+
```

### 需求量化估算

在开始设计前，必须对系统规模进行量化估算：

```typescript
// 系统规模估算示例
interface SystemEstimation {
  // 用户规模
  dailyActiveUsers: number;      // 日活用户
  monthlyActiveUsers: number;    // 月活用户

  // 流量估算
  readQPS: number;               // 读请求 QPS
  writeQPS: number;              // 写请求 QPS
  peakMultiplier: number;        // 峰值倍数

  // 存储估算
  dataPerRecord: number;         // 单条数据大小 (bytes)
  recordsPerDay: number;         // 每日新增记录数
  retentionPeriod: number;       // 数据保留期限 (years)

  // 带宽估算
  inboundBandwidth: number;      // 入站带宽 (Mbps)
  outboundBandwidth: number;     // 出站带宽 (Mbps)
}

// 计算示例：社交媒体平台
const estimation: SystemEstimation = {
  dailyActiveUsers: 100_000_000,      // 1亿日活
  monthlyActiveUsers: 500_000_000,    // 5亿月活
  readQPS: 100_000,                   // 10万读QPS
  writeQPS: 10_000,                   // 1万写QPS
  peakMultiplier: 3,                  // 峰值是平均的3倍
  dataPerRecord: 500,                 // 500字节/条
  recordsPerDay: 50_000_000,          // 每天5000万条新数据
  retentionPeriod: 5,                 // 保留5年
  inboundBandwidth: 500,              // 500 Mbps 入站
  outboundBandwidth: 5000,            // 5 Gbps 出站
};

// 存储容量计算
const dailyStorage = estimation.dataPerRecord * estimation.recordsPerDay;
// = 500 * 50,000,000 = 25 GB/天
const yearlyStorage = dailyStorage * 365;
// = 25 * 365 = 9.125 TB/年
const totalStorage = yearlyStorage * estimation.retentionPeriod;
// = 9.125 * 5 = 45.625 TB (5年总存储)
```

### 常用数字速查表

在估算时，以下数字非常有用：

| 指标 | 数值 | 说明 |
|------|------|------|
| L1 缓存访问 | 0.5 ns | CPU 一级缓存 |
| L2 缓存访问 | 7 ns | CPU 二级缓存 |
| 内存访问 | 100 ns | RAM 随机访问 |
| SSD 随机读 | 150 us | 固态硬盘 |
| HDD 随机读 | 10 ms | 机械硬盘寻道 |
| 同机房网络往返 | 0.5 ms | 数据中心内部 |
| 跨机房网络往返 | 100 ms | 跨地域 |
| 1 GB 内存顺序读 | 250 us | 内存带宽约 4 GB/s |
| 1 GB SSD 顺序读 | 1 ms | SSD 带宽约 1 GB/s |

## URL 短链系统设计

### 需求分析

**功能性需求：**
- 给定长 URL，生成短链接
- 访问短链接时，重定向到原始 URL
- 支持自定义短链接（可选）
- 支持链接过期时间设置

**非功能性需求：**
- 高可用性：99.99%
- 低延迟：重定向延迟 < 100ms
- 短链不可预测（安全性）

**规模估算：**
```
- 每天生成 1 亿条短链
- 读写比 100:1
- 写 QPS: 1亿 / 86400 = 1200
- 读 QPS: 1200 * 100 = 120,000
- 峰值读 QPS: 120,000 * 3 = 360,000
- 每条记录约 500 字节
- 5年存储: 500 * 1亿 * 365 * 5 = 90 TB
```

### 高层架构设计

```
                        +-------------------+
                        |   DNS + CDN       |
                        +---------+---------+
                                  |
                        +---------v---------+
                        |  Load Balancer    |
                        +---------+---------+
                                  |
              +-------------------+-------------------+
              |                   |                   |
      +-------v-------+   +-------v-------+   +-------v-------+
      |  API Server   |   |  API Server   |   |  API Server   |
      |   (写服务)     |   |   (读服务)    |   |   (读服务)    |
      +-------+-------+   +-------+-------+   +-------+-------+
              |                   |                   |
              |           +-------v-------+           |
              |           |    Redis      |           |
              |           |   (缓存层)    |           |
              |           +-------+-------+           |
              |                   |                   |
              +-------------------+-------------------+
                                  |
                         +--------v--------+
                         |   MySQL 集群    |
                         |  (主从复制)     |
                         +-----------------+
```

### 核心算法：短链生成

**方案一：哈希算法**

```typescript
import crypto from 'crypto';

class HashBasedShortener {
  private readonly BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  generateShortUrl(longUrl: string): string {
    // 使用 MD5 生成哈希
    const hash = crypto.createHash('md5').update(longUrl).digest('hex');

    // 取前 43 位（约 7 个字符的 Base62）
    const hashInt = BigInt('0x' + hash.substring(0, 11));

    // 转换为 Base62
    return this.toBase62(hashInt, 7);
  }

  private toBase62(num: bigint, length: number): string {
    let result = '';
    const base = BigInt(62);

    while (num > 0 && result.length < length) {
      result = this.BASE62[Number(num % base)] + result;
      num = num / base;
    }

    // 补齐长度
    while (result.length < length) {
      result = '0' + result;
    }

    return result;
  }
}
```

**方案二：分布式 ID 生成器（推荐）**

```typescript
// 基于 Snowflake 的分布式 ID 生成
class SnowflakeIdGenerator {
  private readonly EPOCH = 1609459200000n; // 2021-01-01 00:00:00
  private readonly WORKER_ID_BITS = 10n;
  private readonly SEQUENCE_BITS = 12n;

  private readonly MAX_WORKER_ID = (1n << this.WORKER_ID_BITS) - 1n;
  private readonly MAX_SEQUENCE = (1n << this.SEQUENCE_BITS) - 1n;

  private readonly WORKER_ID_SHIFT = this.SEQUENCE_BITS;
  private readonly TIMESTAMP_SHIFT = this.SEQUENCE_BITS + this.WORKER_ID_BITS;

  private workerId: bigint;
  private sequence = 0n;
  private lastTimestamp = -1n;

  constructor(workerId: number) {
    if (workerId < 0 || BigInt(workerId) > this.MAX_WORKER_ID) {
      throw new Error(`Worker ID must be between 0 and ${this.MAX_WORKER_ID}`);
    }
    this.workerId = BigInt(workerId);
  }

  nextId(): bigint {
    let timestamp = this.currentTimestamp();

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & this.MAX_SEQUENCE;
      if (this.sequence === 0n) {
        // 等待下一毫秒
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    return ((timestamp - this.EPOCH) << this.TIMESTAMP_SHIFT) |
           (this.workerId << this.WORKER_ID_SHIFT) |
           this.sequence;
  }

  private currentTimestamp(): bigint {
    return BigInt(Date.now());
  }

  private waitNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = this.currentTimestamp();
    while (timestamp <= lastTimestamp) {
      timestamp = this.currentTimestamp();
    }
    return timestamp;
  }
}

// 短链服务实现
class UrlShortenerService {
  private readonly BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  private idGenerator: SnowflakeIdGenerator;

  constructor(workerId: number) {
    this.idGenerator = new SnowflakeIdGenerator(workerId);
  }

  createShortUrl(longUrl: string): string {
    const id = this.idGenerator.nextId();
    return this.encode(id);
  }

  private encode(id: bigint): string {
    let result = '';
    const base = 62n;

    while (id > 0n) {
      result = this.BASE62[Number(id % base)] + result;
      id = id / base;
    }

    return result || '0';
  }

  decode(shortUrl: string): bigint {
    let result = 0n;
    const base = 62n;

    for (const char of shortUrl) {
      result = result * base + BigInt(this.BASE62.indexOf(char));
    }

    return result;
  }
}
```

### 数据库设计

```sql
-- 短链映射表
CREATE TABLE url_mappings (
    id BIGINT PRIMARY KEY,              -- Snowflake ID
    short_code VARCHAR(10) NOT NULL,    -- 短链编码
    long_url VARCHAR(2048) NOT NULL,    -- 原始URL
    user_id BIGINT,                     -- 创建用户（可选）
    expires_at TIMESTAMP,               -- 过期时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_short_code (short_code),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;

-- 访问统计表（可选）
CREATE TABLE url_analytics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    short_code VARCHAR(10) NOT NULL,
    visitor_ip VARCHAR(45),
    user_agent VARCHAR(512),
    referer VARCHAR(2048),
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_short_code_time (short_code, visited_at)
) ENGINE=InnoDB;
```

### 缓存策略

```typescript
class UrlShortenerWithCache {
  private redis: Redis;
  private db: Database;
  private readonly CACHE_TTL = 86400; // 24小时

  async getLongUrl(shortCode: string): Promise<string | null> {
    // 1. 先查缓存
    const cached = await this.redis.get(`url:${shortCode}`);
    if (cached) {
      return cached;
    }

    // 2. 缓存未命中，查数据库
    const result = await this.db.query(
      'SELECT long_url FROM url_mappings WHERE short_code = ? AND (expires_at IS NULL OR expires_at > NOW())',
      [shortCode]
    );

    if (result.length === 0) {
      // 缓存空值防止缓存穿透
      await this.redis.setex(`url:${shortCode}`, 60, 'NULL');
      return null;
    }

    const longUrl = result[0].long_url;

    // 3. 写入缓存
    await this.redis.setex(`url:${shortCode}`, this.CACHE_TTL, longUrl);

    return longUrl;
  }

  async createShortUrl(longUrl: string): Promise<string> {
    // 1. 检查是否已存在（去重）
    const existing = await this.redis.get(`reverse:${longUrl}`);
    if (existing) {
      return existing;
    }

    // 2. 生成新短链
    const shortCode = this.generateShortCode();

    // 3. 写入数据库
    await this.db.execute(
      'INSERT INTO url_mappings (short_code, long_url) VALUES (?, ?)',
      [shortCode, longUrl]
    );

    // 4. 写入缓存
    await Promise.all([
      this.redis.setex(`url:${shortCode}`, this.CACHE_TTL, longUrl),
      this.redis.setex(`reverse:${longUrl}`, this.CACHE_TTL, shortCode),
    ]);

    return shortCode;
  }
}
```

## 即时通讯系统设计

### 需求分析

**功能性需求：**
- 一对一聊天
- 群聊（最多 500 人）
- 消息状态（已发送、已送达、已读）
- 离线消息存储
- 消息历史记录
- 文件/图片传输

**非功能性需求：**
- 消息延迟 < 200ms
- 99.99% 可用性
- 支持 5000 万日活用户
- 消息不丢失、不重复

### 高层架构

```
+-----------------------------------------------------------------------------+
|                              即时通讯系统架构                                 |
+-----------------------------------------------------------------------------+
|                                                                             |
|  +---------+     +-------------+     +---------------------------------+    |
|  | Client  |---->| API Gateway |---->|         Service Layer           |    |
|  |  App    |     | (认证/路由)  |     |  +---------+   +-------------+  |    |
|  +---------+     +-------------+     |  | User    |   | Group       |  |    |
|       |                              |  | Service |   | Service     |  |    |
|       |                              |  +---------+   +-------------+  |    |
|       |                              |  +---------+   +-------------+  |    |
|       |                              |  | Message |   | Presence    |  |    |
|       |                              |  | Service |   | Service     |  |    |
|       |                              |  +---------+   +-------------+  |    |
|       |                              +---------------------------------+    |
|       |                                            |                        |
|       |          +----------------------------------------------------+    |
|       |          |                                 v                   |    |
|       |     +----v----+  +-------------+  +-------------+              |    |
|       +---->|WebSocket|  |   Kafka     |  |   Redis     |              |    |
|             | Gateway |--|  (消息队列) |--|  (会话状态) |              |    |
|             +---------+  +-------------+  +-------------+              |    |
|                                  |                                     |    |
|                          +-------v-------+                             |    |
|                          |   MySQL/      |                             |    |
|                          |   Cassandra   |                             |    |
|                          |  (消息存储)   |                             |    |
|                          +---------------+                             |    |
+-----------------------------------------------------------------------------+
```

### WebSocket 连接管理

```typescript
// WebSocket 网关服务
class WebSocketGateway {
  private connections: Map<string, WebSocket> = new Map();
  private redis: Redis;
  private kafka: KafkaProducer;

  constructor(redis: Redis, kafka: KafkaProducer) {
    this.redis = redis;
    this.kafka = kafka;
  }

  async onConnection(ws: WebSocket, userId: string): Promise<void> {
    // 1. 存储连接映射
    this.connections.set(userId, ws);

    // 2. 在 Redis 中注册用户所在的网关节点
    const gatewayId = process.env.GATEWAY_ID;
    await this.redis.hset('user_gateway', userId, gatewayId);

    // 3. 更新用户在线状态
    await this.redis.sadd('online_users', userId);

    // 4. 推送离线消息
    await this.pushOfflineMessages(userId, ws);

    // 5. 通知好友上线
    await this.notifyPresenceChange(userId, 'online');

    console.log(`User ${userId} connected to gateway ${gatewayId}`);
  }

  async onDisconnect(userId: string): Promise<void> {
    // 1. 移除连接
    this.connections.delete(userId);

    // 2. 清除 Redis 映射
    await this.redis.hdel('user_gateway', userId);
    await this.redis.srem('online_users', userId);

    // 3. 通知好友下线
    await this.notifyPresenceChange(userId, 'offline');
  }

  async sendMessage(targetUserId: string, message: Message): Promise<void> {
    // 1. 检查目标用户是否在本网关
    const localConnection = this.connections.get(targetUserId);
    if (localConnection) {
      localConnection.send(JSON.stringify(message));
      return;
    }

    // 2. 查找目标用户所在网关
    const targetGateway = await this.redis.hget('user_gateway', targetUserId);
    if (targetGateway) {
      // 通过消息队列转发到目标网关
      await this.kafka.send('gateway_messages', {
        targetGateway,
        targetUserId,
        message,
      });
    } else {
      // 用户离线，存储离线消息
      await this.storeOfflineMessage(targetUserId, message);
    }
  }

  private async pushOfflineMessages(userId: string, ws: WebSocket): Promise<void> {
    const messages = await this.redis.lrange(`offline:${userId}`, 0, -1);
    for (const msg of messages) {
      ws.send(msg);
    }
    await this.redis.del(`offline:${userId}`);
  }

  private async storeOfflineMessage(userId: string, message: Message): Promise<void> {
    const key = `offline:${userId}`;
    await this.redis.rpush(key, JSON.stringify(message));
    // 设置过期时间，避免离线消息无限累积
    await this.redis.expire(key, 7 * 24 * 60 * 60); // 7天
  }
}
```

### 消息存储设计

```typescript
// 消息数据模型
interface Message {
  messageId: string;         // 全局唯一消息ID
  conversationId: string;    // 会话ID
  senderId: string;          // 发送者
  receiverId: string;        // 接收者（群聊时为群ID）
  messageType: 'text' | 'image' | 'file' | 'voice';
  content: string;           // 消息内容或资源URL
  timestamp: number;         // 消息时间戳
  status: 'sent' | 'delivered' | 'read';
  clientMessageId: string;   // 客户端消息ID（用于去重）
}

// Cassandra Schema 设计（适合高写入场景）
/*
CREATE KEYSPACE im WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'dc1': 3
};

-- 按会话分区，按时间排序
CREATE TABLE messages (
    conversation_id text,
    message_id timeuuid,
    sender_id text,
    receiver_id text,
    message_type text,
    content text,
    status text,
    created_at timestamp,
    PRIMARY KEY (conversation_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);

-- 按用户索引，用于查询用户的所有会话
CREATE TABLE user_conversations (
    user_id text,
    conversation_id text,
    last_message_id timeuuid,
    last_message_preview text,
    unread_count int,
    updated_at timestamp,
    PRIMARY KEY (user_id, updated_at, conversation_id)
) WITH CLUSTERING ORDER BY (updated_at DESC, conversation_id ASC);
*/

class MessageService {
  private cassandra: CassandraClient;
  private kafka: KafkaProducer;

  async sendMessage(message: Message): Promise<void> {
    // 1. 消息去重检查
    const exists = await this.checkDuplicate(message.clientMessageId);
    if (exists) {
      return;
    }

    // 2. 生成服务端消息ID
    message.messageId = this.generateMessageId();
    message.timestamp = Date.now();
    message.status = 'sent';

    // 3. 写入消息队列（异步持久化）
    await this.kafka.send('messages', {
      key: message.conversationId,
      value: message,
    });

    // 4. 推送给接收方
    await this.pushToReceiver(message);
  }

  async getConversationHistory(
    conversationId: string,
    beforeMessageId?: string,
    limit: number = 50
  ): Promise<Message[]> {
    let query = `
      SELECT * FROM messages
      WHERE conversation_id = ?
    `;
    const params: any[] = [conversationId];

    if (beforeMessageId) {
      query += ` AND message_id < ?`;
      params.push(beforeMessageId);
    }

    query += ` ORDER BY message_id DESC LIMIT ?`;
    params.push(limit);

    return this.cassandra.execute(query, params);
  }
}
```

### 消息可靠性保证

```
消息发送流程（保证不丢失、不重复）：

+--------+   1.发送消息    +--------+   2.存储消息   +--------+
| Client |--------------->| Server |--------------->| Queue  |
+--------+                +--------+                +--------+
    |                         |                         |
    |   3.ACK(消息ID)         |                         |
    |<------------------------|                         |
    |                         |                         |
    |                         |   4.消费消息            |
    |                         |<------------------------|
    |                         |                         |
    |                         |   5.持久化到DB          |
    |                         |----------+              |
    |                         |          |              |
    |                         |<---------+              |
    |                         |                         |
    |                         |   6.推送给接收方        |
    |                         |------------------------>|
    |                         |                         |
```

**去重机制：**
```typescript
class MessageDeduplication {
  private redis: Redis;
  private readonly DEDUP_TTL = 3600; // 1小时

  async isDuplicate(clientMessageId: string): Promise<boolean> {
    const key = `dedup:${clientMessageId}`;
    const result = await this.redis.set(key, '1', 'NX', 'EX', this.DEDUP_TTL);
    return result === null; // 如果设置失败，说明已存在
  }
}
```

## Feed 流系统设计

### 需求分析

**功能性需求：**
- 用户发布动态
- 关注/取消关注其他用户
- 查看关注用户的动态流（Timeline）
- 点赞、评论、转发

**非功能性需求：**
- 支持 1 亿日活用户
- Feed 获取延迟 < 500ms
- 新发布内容在 5 秒内可见
- 支持用户关注数万人的场景

### Feed 流推拉模式对比

```
+-------------------------------------------------------------------------+
|                    推模式 (Push / Fanout-on-Write)                       |
+-------------------------------------------------------------------------+
|                                                                         |
|   用户A发布动态                                                          |
|        |                                                                |
|        v                                                                |
|   +---------+     +---------------------------------------------+       |
|   | 写入DB  |---->| 推送到所有粉丝的 Feed 队列                    |       |
|   +---------+     |  粉丝1的Feed: [A的动态, ...]                  |       |
|                   |  粉丝2的Feed: [A的动态, ...]                  |       |
|                   |  粉丝3的Feed: [A的动态, ...]                  |       |
|                   |  ...                                         |       |
|                   +---------------------------------------------+       |
|                                                                         |
|   优点：读取快（直接从用户Feed队列读取）                                   |
|   缺点：写入慢（大V发布需要推送给数百万粉丝）、存储冗余                      |
|                                                                         |
+-------------------------------------------------------------------------+
|                    拉模式 (Pull / Fanout-on-Read)                        |
+-------------------------------------------------------------------------+
|                                                                         |
|   用户B查看Feed                                                          |
|        |                                                                |
|        v                                                                |
|   +-------------+     +---------------------------------------------+   |
|   | 获取关注列表 |---->| 从每个关注用户拉取最新动态并合并排序          |   |
|   +-------------+     |  关注1的动态: [...]                          |   |
|                       |  关注2的动态: [...]                          |   |
|                       |  关注3的动态: [...]                          |   |
|                       |  合并 + 排序 = 最终Feed                      |   |
|                       +---------------------------------------------+   |
|                                                                         |
|   优点：写入快、无存储冗余                                                |
|   缺点：读取慢（需要实时聚合多个数据源）                                   |
|                                                                         |
+-------------------------------------------------------------------------+
|                    推拉结合 (Hybrid) - 推荐方案                           |
+-------------------------------------------------------------------------+
|                                                                         |
|   - 普通用户（粉丝数 < 10000）：采用推模式                                 |
|   - 大V用户（粉丝数 > 10000）：采用拉模式                                  |
|   - 活跃用户：推模式优先                                                  |
|   - 非活跃用户：拉模式（节省存储）                                         |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 系统架构

```
                           +-----------------+
                           |   API Gateway   |
                           +--------+--------+
                                    |
           +------------------------+------------------------+
           |                        |                        |
    +------v------+          +------v------+          +------v------+
    | Post Service|          | Feed Service|          |Graph Service|
    | (发布动态)   |          | (获取Feed)  |          | (关注关系)  |
    +------+------+          +------+------+          +------+------+
           |                        |                        |
           |                 +------v------+                 |
           |                 |    Redis    |                 |
           |                 | (Feed缓存)  |                 |
           |                 +-------------+                 |
           |                                                 |
    +------v-------------------------------------------------v------+
    |                        消息队列 (Kafka)                        |
    |                   +---------------------+                     |
    |                   | Feed Fanout Worker  |                     |
    |                   | (异步推送Feed)       |                     |
    |                   +---------------------+                     |
    +-------------------------------+-------------------------------+
                                    |
                           +--------v--------+
                           |     数据库      |
                           |  Posts/Feeds   |
                           +-----------------+
```

### 核心实现

```typescript
// Feed 服务核心实现
class FeedService {
  private redis: Redis;
  private db: Database;
  private graphService: GraphService;

  private readonly FEED_CACHE_SIZE = 1000;
  private readonly BIG_V_THRESHOLD = 10000;

  // 获取用户 Feed
  async getFeed(userId: string, cursor?: string, limit: number = 20): Promise<FeedItem[]> {
    // 1. 从缓存获取推送的 Feed
    const pushedFeed = await this.getPushedFeed(userId, cursor, limit);

    // 2. 获取用户关注的大V列表
    const bigVFollowings = await this.getBigVFollowings(userId);

    if (bigVFollowings.length === 0) {
      return pushedFeed;
    }

    // 3. 实时拉取大V的最新动态
    const pulledFeed = await this.pullBigVPosts(bigVFollowings, cursor, limit);

    // 4. 合并并排序
    return this.mergeFeed(pushedFeed, pulledFeed, limit);
  }

  // 发布动态
  async publishPost(userId: string, content: PostContent): Promise<Post> {
    // 1. 创建动态
    const post: Post = {
      id: this.generatePostId(),
      userId,
      content,
      createdAt: Date.now(),
      likeCount: 0,
      commentCount: 0,
    };

    // 2. 写入数据库
    await this.db.posts.insert(post);

    // 3. 更新用户动态列表缓存
    await this.redis.lpush(`user_posts:${userId}`, JSON.stringify(post));
    await this.redis.ltrim(`user_posts:${userId}`, 0, this.FEED_CACHE_SIZE - 1);

    // 4. 判断是否需要推送
    const followerCount = await this.graphService.getFollowerCount(userId);

    if (followerCount < this.BIG_V_THRESHOLD) {
      // 普通用户：异步推送给所有粉丝
      await this.queueFanout(post);
    }
    // 大V用户：不推送，粉丝读取时实时拉取

    return post;
  }

  // 异步 Fanout Worker
  async processFanout(post: Post): Promise<void> {
    const followers = await this.graphService.getFollowers(post.userId);

    // 批量处理，避免一次性处理太多
    const batchSize = 1000;
    for (let i = 0; i < followers.length; i += batchSize) {
      const batch = followers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(followerId => this.pushToUserFeed(followerId, post))
      );
    }
  }

  private async pushToUserFeed(userId: string, post: Post): Promise<void> {
    const key = `feed:${userId}`;
    const feedItem = JSON.stringify({
      postId: post.id,
      userId: post.userId,
      createdAt: post.createdAt,
    });

    await this.redis.zadd(key, post.createdAt, feedItem);
    await this.redis.zremrangebyrank(key, 0, -this.FEED_CACHE_SIZE - 1);
  }

  private async getPushedFeed(
    userId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<FeedItem[]> {
    const key = `feed:${userId}`;
    const maxScore = cursor ? parseInt(cursor) - 1 : '+inf';

    const items = await this.redis.zrevrangebyscore(
      key, maxScore, '-inf', 'LIMIT', 0, limit
    );

    return items.map(item => JSON.parse(item));
  }

  private async pullBigVPosts(
    bigVIds: string[],
    cursor?: string,
    limit: number = 20
  ): Promise<FeedItem[]> {
    const allPosts: FeedItem[] = [];

    await Promise.all(
      bigVIds.map(async (bigVId) => {
        const posts = await this.redis.lrange(`user_posts:${bigVId}`, 0, limit - 1);
        posts.forEach(post => {
          const parsed = JSON.parse(post);
          if (!cursor || parsed.createdAt < parseInt(cursor)) {
            allPosts.push(parsed);
          }
        });
      })
    );

    return allPosts.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }

  private mergeFeed(
    pushed: FeedItem[],
    pulled: FeedItem[],
    limit: number
  ): FeedItem[] {
    const merged = [...pushed, ...pulled];

    // 去重
    const seen = new Set<string>();
    const unique = merged.filter(item => {
      if (seen.has(item.postId)) return false;
      seen.add(item.postId);
      return true;
    });

    // 按时间排序
    return unique.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }
}
```

## 秒杀系统设计

### 需求分析

**业务特点：**
- 瞬时高并发（百万级 QPS）
- 库存有限（几百到几千件）
- 时间集中（秒级内完成）
- 安全要求高（防刷、防超卖）

**技术挑战：**
- 读多写少，但写操作需要强一致性
- 热点数据集中（单个商品）
- 需要防止恶意请求

### 系统架构

```
+-----------------------------------------------------------------------------+
|                              秒杀系统架构                                    |
+-----------------------------------------------------------------------------+
|                                                                             |
|                            +-------------+                                  |
|                            |   CDN 层    |  <- 静态资源缓存                  |
|                            +------+------+                                  |
|                                   |                                         |
|                            +------v------+                                  |
|                            |   WAF 层    |  <- 恶意请求过滤                  |
|                            +------+------+                                  |
|                                   |                                         |
|                            +------v------+                                  |
|                            |  负载均衡   |                                  |
|                            +------+------+                                  |
|                                   |                                         |
|    +-----------------------------+------------------------------+           |
|    |                             |                              |           |
|    v                             v                              v           |
|  +------------+            +------------+            +------------+         |
|  |   接入层   |            |   接入层   |            |   接入层   |         |
|  | (限流/鉴权)|            | (限流/鉴权)|            | (限流/鉴权)|         |
|  +-----+------+            +-----+------+            +-----+------+         |
|        |                         |                         |                |
|        +--------------------------+-------------------------+               |
|                                  |                                          |
|                           +------v------+                                   |
|                           |   Redis     |  <- 库存预扣减                    |
|                           |  (集群)     |                                   |
|                           +------+------+                                   |
|                                  |                                          |
|                           +------v------+                                   |
|                           |   Kafka     |  <- 异步处理                      |
|                           +------+------+                                   |
|                                  |                                          |
|                           +------v------+                                   |
|                           |  订单服务   |  <- 创建订单                       |
|                           +------+------+                                   |
|                                  |                                          |
|                           +------v------+                                   |
|                           |   MySQL     |  <- 持久化                        |
|                           +-------------+                                   |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### 多级限流策略

```typescript
// 限流实现
class RateLimiter {
  private redis: Redis;

  // 令牌桶算法实现
  async isAllowed(
    key: string,
    capacity: number,
    refillRate: number
  ): Promise<boolean> {
    const now = Date.now();
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])

      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(bucket[1]) or capacity
      local lastRefill = tonumber(bucket[2]) or now

      -- 计算需要补充的令牌
      local elapsed = (now - lastRefill) / 1000
      local refill = math.floor(elapsed * refillRate)
      tokens = math.min(capacity, tokens + refill)

      if tokens < 1 then
        return 0
      end

      tokens = tokens - 1
      redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
      redis.call('EXPIRE', key, 60)

      return 1
    `;

    const result = await this.redis.runScript(
      script, 1, key, capacity, refillRate, now
    );
    return result === 1;
  }

  // 滑动窗口限流
  async slidingWindowLimit(
    key: string,
    windowMs: number,
    maxRequests: number
  ): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowMs;

    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local windowStart = tonumber(ARGV[2])
      local maxRequests = tonumber(ARGV[3])

      -- 移除窗口外的请求
      redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

      -- 获取当前窗口内的请求数
      local count = redis.call('ZCARD', key)

      if count >= maxRequests then
        return 0
      end

      -- 添加当前请求
      redis.call('ZADD', key, now, now .. '-' .. math.random())
      redis.call('EXPIRE', key, math.ceil(windowMs / 1000))

      return 1
    `;

    const result = await this.redis.runScript(
      script, 1, key, now, windowStart, maxRequests
    );
    return result === 1;
  }
}
```

### 库存扣减核心逻辑

```typescript
class SeckillService {
  private redis: Redis;
  private kafka: KafkaProducer;

  // 预扣库存（Redis 原子操作）
  async tryDeductStock(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<{ success: boolean; orderId?: string }> {
    // 1. 检查用户是否已购买（防止重复购买）
    const hasBought = await this.redis.sismember(
      `seckill:bought:${productId}`, userId
    );
    if (hasBought) {
      return { success: false };
    }

    // 2. Lua 脚本原子扣减库存
    const script = `
      local stockKey = KEYS[1]
      local boughtKey = KEYS[2]
      local userId = ARGV[1]
      local quantity = tonumber(ARGV[2])

      -- 检查库存
      local stock = tonumber(redis.call('GET', stockKey) or 0)
      if stock < quantity then
        return -1  -- 库存不足
      end

      -- 扣减库存
      local newStock = redis.call('DECRBY', stockKey, quantity)
      if newStock < 0 then
        -- 恢复库存（并发场景下的保护）
        redis.call('INCRBY', stockKey, quantity)
        return -1
      end

      -- 记录用户已购买
      redis.call('SADD', boughtKey, userId)

      return newStock
    `;

    const result = await this.redis.runScript(
      script,
      2,
      `seckill:stock:${productId}`,
      `seckill:bought:${productId}`,
      userId,
      quantity
    );

    if (result === -1) {
      return { success: false };
    }

    // 3. 生成订单ID并发送到消息队列
    const orderId = this.generateOrderId();
    await this.kafka.send('seckill_orders', {
      orderId,
      userId,
      productId,
      quantity,
      timestamp: Date.now(),
    });

    return { success: true, orderId };
  }

  // 异步订单处理 Worker
  async processOrder(message: SeckillOrderMessage): Promise<void> {
    const { orderId, userId, productId, quantity } = message;

    try {
      // 1. 创建订单
      await this.createOrder({
        id: orderId,
        userId,
        productId,
        quantity,
        status: 'pending_payment',
        createdAt: new Date(),
        expiredAt: new Date(Date.now() + 15 * 60 * 1000), // 15分钟支付超时
      });

      // 2. 扣减数据库库存
      await this.deductDbStock(productId, quantity);

      // 3. 发送订单创建通知
      await this.notifyUser(userId, orderId);

    } catch (error) {
      // 回滚 Redis 库存
      await this.redis.incrby(`seckill:stock:${productId}`, quantity);
      await this.redis.srem(`seckill:bought:${productId}`, userId);
      throw error;
    }
  }

  // 库存预热
  async warmupStock(productId: string, stock: number): Promise<void> {
    await this.redis.set(`seckill:stock:${productId}`, stock);
    await this.redis.del(`seckill:bought:${productId}`);
  }
}
```

### 防刷策略

```typescript
class AntiCheatService {
  private redis: Redis;

  async validateRequest(req: SeckillRequest): Promise<ValidationResult> {
    const checks = await Promise.all([
      this.checkUserRateLimit(req.userId),
      this.checkIpRateLimit(req.ip),
      this.checkDeviceFingerprint(req.deviceId),
      this.checkRequestPattern(req),
    ]);

    const failed = checks.find(c => !c.passed);
    if (failed) {
      return { valid: false, reason: failed.reason };
    }

    return { valid: true };
  }

  // 用户级别限流
  private async checkUserRateLimit(userId: string): Promise<CheckResult> {
    const key = `anticheat:user:${userId}`;
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, 1); // 1秒窗口
    }

    if (count > 5) { // 每秒最多5次请求
      return { passed: false, reason: 'user_rate_limit' };
    }

    return { passed: true };
  }

  // IP 级别限流
  private async checkIpRateLimit(ip: string): Promise<CheckResult> {
    const key = `anticheat:ip:${ip}`;
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, 1);
    }

    if (count > 100) { // 每IP每秒最多100次请求
      return { passed: false, reason: 'ip_rate_limit' };
    }

    return { passed: true };
  }

  // 设备指纹检查
  private async checkDeviceFingerprint(deviceId: string): Promise<CheckResult> {
    const key = `anticheat:device:${deviceId}`;
    const buyCount = await this.redis.get(key);

    if (parseInt(buyCount || '0') >= 3) { // 每设备最多购买3次
      return { passed: false, reason: 'device_limit' };
    }

    return { passed: true };
  }

  // 请求模式检查（检测机器人）
  private async checkRequestPattern(req: SeckillRequest): Promise<CheckResult> {
    // 检查请求时间间隔是否过于规律
    const key = `anticheat:pattern:${req.userId}`;
    const timestamps = await this.redis.lrange(key, 0, 9);

    await this.redis.lpush(key, req.timestamp);
    await this.redis.ltrim(key, 0, 9);
    await this.redis.expire(key, 60);

    if (timestamps.length >= 5) {
      const intervals = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(parseInt(timestamps[i-1]) - parseInt(timestamps[i]));
      }

      // 计算标准差，过小说明是机器人
      const stdDev = this.calculateStdDev(intervals);
      if (stdDev < 10) { // 间隔方差小于10ms
        return { passed: false, reason: 'bot_detected' };
      }
    }

    return { passed: true };
  }
}
```

## 搜索引擎设计要点

### 核心架构

```
+-------------------------------------------------------------------------+
|                           搜索引擎架构                                   |
+-------------------------------------------------------------------------+
|                                                                         |
|   +-------------+                          +-------------+              |
|   |   数据源    |                          |  搜索请求   |              |
|   | (DB/Files) |                          |  (Query)    |              |
|   +------+------+                          +------+------+              |
|          |                                        |                     |
|          v                                        v                     |
|   +-------------+                          +-------------+              |
|   |   爬虫/     |                          |  查询解析   |              |
|   |  数据抽取   |                          | Query Parser|              |
|   +------+------+                          +------+------+              |
|          |                                        |                     |
|          v                                        v                     |
|   +-------------+                          +-------------+              |
|   |  文档处理   |                          |  查询改写   |              |
|   | (分词/NER) |                          | (同义词/纠错)|              |
|   +------+------+                          +------+------+              |
|          |                                        |                     |
|          v                                        v                     |
|   +-------------+                          +-------------+              |
|   |  索引构建   |<-------------------------|  索引检索   |              |
|   | (倒排索引)  |                          |             |              |
|   +------+------+                          +------+------+              |
|          |                                        |                     |
|          v                                        v                     |
|   +----------------------------------------------------------+         |
|   |                    索引存储                               |         |
|   |   +-----------------------------------------------+      |         |
|   |   |  Shard 1   |  Shard 2  |  Shard 3  |   ...   |      |         |
|   |   |  Replica A |  Replica A |  Replica A |        |      |         |
|   |   |  Replica B |  Replica B |  Replica B |        |      |         |
|   |   +-----------------------------------------------+      |         |
|   +----------------------------------------------------------+         |
|                                  |                                      |
|                                  v                                      |
|                          +-------------+                               |
|                          |  结果排序   |                               |
|                          |  (Ranking) |                               |
|                          +------+------+                               |
|                                 |                                       |
|                                 v                                       |
|                          +-------------+                               |
|                          |  搜索结果   |                               |
|                          +-------------+                               |
+-------------------------------------------------------------------------+
```

### 倒排索引原理

```typescript
// 倒排索引数据结构
interface InvertedIndex {
  // 词项 -> 包含该词项的文档列表
  [term: string]: PostingList;
}

interface PostingList {
  documentFrequency: number;  // 包含该词的文档数
  postings: Posting[];        // 具体的文档信息
}

interface Posting {
  docId: string;              // 文档ID
  termFrequency: number;      // 词在文档中出现的次数
  positions: number[];        // 词在文档中的位置（用于短语查询）
}

// 索引构建示例
class InvertedIndexBuilder {
  private index: InvertedIndex = {};
  private docCount = 0;

  // 添加文档到索引
  addDocument(docId: string, content: string): void {
    // 1. 分词
    const tokens = this.tokenize(content);

    // 2. 统计词频和位置
    const termPositions: Map<string, number[]> = new Map();
    tokens.forEach((token, position) => {
      const positions = termPositions.get(token) || [];
      positions.push(position);
      termPositions.set(token, positions);
    });

    // 3. 更新倒排索引
    termPositions.forEach((positions, term) => {
      if (!this.index[term]) {
        this.index[term] = {
          documentFrequency: 0,
          postings: [],
        };
      }

      this.index[term].documentFrequency++;
      this.index[term].postings.push({
        docId,
        termFrequency: positions.length,
        positions,
      });
    });

    this.docCount++;
  }

  // 搜索
  search(query: string): SearchResult[] {
    const queryTerms = this.tokenize(query);
    const scores: Map<string, number> = new Map();

    // 计算 TF-IDF 分数
    for (const term of queryTerms) {
      const postingList = this.index[term];
      if (!postingList) continue;

      // IDF: log(N / df)
      const idf = Math.log(this.docCount / postingList.documentFrequency);

      for (const posting of postingList.postings) {
        // TF: 词频
        const tf = posting.termFrequency;

        // TF-IDF 得分
        const score = tf * idf;

        const currentScore = scores.get(posting.docId) || 0;
        scores.set(posting.docId, currentScore + score);
      }
    }

    // 排序返回
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([docId, score]) => ({ docId, score }));
  }

  private tokenize(text: string): string[] {
    // 简化的分词实现
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }
}
```

### 相关性排序

```typescript
// BM25 算法实现（比 TF-IDF 更先进）
class BM25Ranker {
  private k1 = 1.2;  // 词频饱和参数
  private b = 0.75;  // 文档长度归一化参数
  private avgDocLength: number;

  calculateScore(
    term: string,
    docId: string,
    tf: number,           // 词在文档中的频率
    df: number,           // 包含该词的文档数
    docLength: number,    // 文档长度
    totalDocs: number     // 总文档数
  ): number {
    // IDF 部分
    const idf = Math.log(
      (totalDocs - df + 0.5) / (df + 0.5) + 1
    );

    // TF 部分（考虑文档长度归一化）
    const tfNorm = (tf * (this.k1 + 1)) /
      (tf + this.k1 * (1 - this.b + this.b * docLength / this.avgDocLength));

    return idf * tfNorm;
  }
}
```

## 分布式文件存储设计

### 核心架构

```
+-------------------------------------------------------------------------+
|                        分布式文件存储架构                                 |
+-------------------------------------------------------------------------+
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   |                        Client SDK                                |   |
|   +--------------------------------+--------------------------------+   |
|                                    |                                    |
|              +---------------------+---------------------+              |
|              |                     |                     |              |
|              v                     v                     v              |
|   +-----------------+   +-----------------+   +-----------------+       |
|   |   Name Node     |   |   Name Node     |   |   Name Node     |       |
|   |   (Master)      |   |   (Standby)     |   |   (Standby)     |       |
|   |                 |   |                 |   |                 |       |
|   | - 文件元数据    |   | - 元数据同步    |   | - 元数据同步    |       |
|   | - 目录结构     |   | - 故障转移      |   | - 故障转移      |       |
|   | - 分块映射     |   |                 |   |                 |       |
|   +--------+--------+   +-----------------+   +-----------------+       |
|            |                                                            |
|            | 元数据操作                                                  |
|            |                                                            |
|   +--------v--------------------------------------------------------+   |
|   |                        ZooKeeper Cluster                        |   |
|   |                    (协调、选主、配置管理)                          |   |
|   +-----------------------------------------------------------------+   |
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   |                        Data Nodes                                |   |
|   |                                                                  |   |
|   |   +----------+   +----------+   +----------+   +----------+     |   |
|   |   | Node 1   |   | Node 2   |   | Node 3   |   | Node N   |     |   |
|   |   |          |   |          |   |          |   |          |     |   |
|   |   | Block A  |   | Block A  |   | Block B  |   | Block C  |     |   |
|   |   | Block D  |   | Block B  |   | Block C  |   | Block A  |     |   |
|   |   | Block E  |   | Block E  |   | Block D  |   | Block E  |     |   |
|   |   +----------+   +----------+   +----------+   +----------+     |   |
|   |                                                                  |   |
|   |   * 每个 Block 默认 64MB-128MB                                   |   |
|   |   * 每个 Block 有 3 个副本分布在不同节点                           |   |
|   +-----------------------------------------------------------------+   |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 文件上传流程

```typescript
// 客户端文件上传实现
class DistributedFileClient {
  private nameNode: NameNodeClient;
  private readonly BLOCK_SIZE = 64 * 1024 * 1024; // 64MB

  async uploadFile(filePath: string, destPath: string): Promise<void> {
    const fileSize = await this.getFileSize(filePath);
    const blockCount = Math.ceil(fileSize / this.BLOCK_SIZE);

    // 1. 向 NameNode 申请写入
    const uploadPlan = await this.nameNode.createFile({
      path: destPath,
      fileSize,
      blockSize: this.BLOCK_SIZE,
      replicationFactor: 3,
    });

    // 2. 分块上传
    const fileHandle = await fs.open(filePath, 'r');

    for (let i = 0; i < blockCount; i++) {
      const blockInfo = uploadPlan.blocks[i];
      const offset = i * this.BLOCK_SIZE;
      const length = Math.min(this.BLOCK_SIZE, fileSize - offset);

      // 读取文件块
      const buffer = Buffer.alloc(length);
      await fileHandle.read(buffer, 0, length, offset);

      // 上传到 DataNode（流水线复制）
      await this.uploadBlock(blockInfo, buffer);
    }

    await fileHandle.close();

    // 3. 通知 NameNode 上传完成
    await this.nameNode.completeFile(destPath);
  }

  private async uploadBlock(
    blockInfo: BlockInfo,
    data: Buffer
  ): Promise<void> {
    // 流水线复制：Client -> Node1 -> Node2 -> Node3
    const [primary, ...replicas] = blockInfo.locations;

    // 连接主节点
    const socket = await this.connectDataNode(primary);

    // 发送块信息和副本列表
    await socket.write(JSON.stringify({
      blockId: blockInfo.blockId,
      replicas: replicas,
      checksum: this.calculateChecksum(data),
    }));

    // 发送数据
    await socket.write(data);

    // 等待确认（所有副本写入成功后返回）
    const ack = await socket.read();
    if (!ack.success) {
      throw new Error(`Block upload failed: ${ack.error}`);
    }
  }
}

// NameNode 元数据管理
class NameNodeService {
  private metadata: FileSystemMetadata;
  private blockMap: Map<string, BlockInfo[]> = new Map();

  async createFile(request: CreateFileRequest): Promise<UploadPlan> {
    // 1. 检查目录是否存在
    const parentDir = path.dirname(request.path);
    if (!this.metadata.exists(parentDir)) {
      throw new Error('Parent directory does not exist');
    }

    // 2. 检查文件是否已存在
    if (this.metadata.exists(request.path)) {
      throw new Error('File already exists');
    }

    // 3. 计算需要多少个块
    const blockCount = Math.ceil(request.fileSize / request.blockSize);
    const blocks: BlockInfo[] = [];

    // 4. 为每个块分配 DataNode
    for (let i = 0; i < blockCount; i++) {
      const blockId = this.generateBlockId();
      const locations = await this.selectDataNodes(
        request.replicationFactor
      );

      blocks.push({
        blockId,
        index: i,
        locations,
      });
    }

    // 5. 创建文件元数据（状态为 CREATING）
    await this.metadata.createFile({
      path: request.path,
      status: 'CREATING',
      blocks,
      createdAt: Date.now(),
    });

    return { blocks };
  }

  // 选择 DataNode（考虑负载均衡和机架感知）
  private async selectDataNodes(count: number): Promise<DataNodeInfo[]> {
    const allNodes = await this.getAvailableDataNodes();

    // 按可用空间和负载排序
    const sortedNodes = allNodes.sort((a, b) => {
      const scoreA = a.availableSpace * 0.6 + (1 - a.load) * 0.4;
      const scoreB = b.availableSpace * 0.6 + (1 - b.load) * 0.4;
      return scoreB - scoreA;
    });

    // 机架感知：尽量选择不同机架的节点
    const selected: DataNodeInfo[] = [];
    const racks = new Set<string>();

    for (const node of sortedNodes) {
      if (selected.length >= count) break;

      // 前两个副本尽量在不同机架
      if (selected.length < 2 && racks.has(node.rack)) {
        continue;
      }

      selected.push(node);
      racks.add(node.rack);
    }

    // 如果节点不足，放宽机架限制
    if (selected.length < count) {
      for (const node of sortedNodes) {
        if (selected.length >= count) break;
        if (!selected.includes(node)) {
          selected.push(node);
        }
      }
    }

    return selected;
  }
}
```

### 数据一致性与容错

```typescript
// DataNode 心跳与块报告
class DataNodeHeartbeat {
  private nameNode: NameNodeClient;
  private readonly HEARTBEAT_INTERVAL = 3000; // 3秒

  async startHeartbeat(): Promise<void> {
    setInterval(async () => {
      try {
        const response = await this.nameNode.heartbeat({
          nodeId: this.nodeId,
          capacity: this.getTotalCapacity(),
          usedSpace: this.getUsedSpace(),
          blockCount: this.getBlockCount(),
        });

        // 处理 NameNode 的指令
        for (const command of response.commands) {
          await this.executeCommand(command);
        }
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  // 定期发送块报告
  async sendBlockReport(): Promise<void> {
    const blocks = await this.scanLocalBlocks();

    await this.nameNode.blockReport({
      nodeId: this.nodeId,
      blocks: blocks.map(b => ({
        blockId: b.id,
        size: b.size,
        checksum: b.checksum,
      })),
    });
  }

  private async executeCommand(command: NodeCommand): Promise<void> {
    switch (command.type) {
      case 'REPLICATE':
        // 复制块到其他节点
        await this.replicateBlock(command.blockId, command.targetNode);
        break;
      case 'DELETE':
        // 删除本地块
        await this.deleteBlock(command.blockId);
        break;
      case 'INVALIDATE':
        // 标记块为无效
        await this.invalidateBlock(command.blockId);
        break;
    }
  }
}
```

## 评估与权衡

### 技术选型决策矩阵

在系统设计中，我们经常需要在不同方案之间做出权衡。以下是常见的决策维度：

```
+-------------------------------------------------------------------------+
|                          技术选型决策矩阵                                 |
+-----------------+---------------+---------------+-----------------------+
|      维度       |    选项 A     |    选项 B     |        权衡点         |
+-----------------+---------------+---------------+-----------------------+
| 一致性 vs 可用性 |  强一致性     |   最终一致性  | 金融系统选A,社交选B   |
+-----------------+---------------+---------------+-----------------------+
|  延迟 vs 吞吐量 |  低延迟优先   |  高吞吐优先   | 实时系统选A,批处理选B |
+-----------------+---------------+---------------+-----------------------+
|  SQL vs NoSQL  |  关系型数据库  |   非关系型    | 复杂查询选A,高扩展选B |
+-----------------+---------------+---------------+-----------------------+
|  同步 vs 异步  |  同步调用     |   消息队列    | 实时性选A,解耦选B     |
+-----------------+---------------+---------------+-----------------------+
|  垂直 vs 水平  |  垂直扩展     |   水平扩展    | 初期选A,规模化选B     |
+-----------------+---------------+---------------+-----------------------+
|   推 vs 拉     |  推模式       |   拉模式      | 实时性选A,大扇出选B   |
+-----------------+---------------+---------------+-----------------------+
```

### 常见系统设计问题与解决方案

| 问题 | 常见解决方案 | 适用场景 |
|------|-------------|----------|
| 高并发读 | 缓存、CDN、读写分离 | 电商商品详情、新闻资讯 |
| 高并发写 | 消息队列、批量写入、分库分表 | 日志系统、秒杀 |
| 热点数据 | 本地缓存、多级缓存、数据分片 | 明星微博、热门商品 |
| 大文件传输 | 分块上传、断点续传、P2P | 视频上传、大文件下载 |
| 数据一致性 | 分布式事务、事件溯源、SAGA | 支付系统、订单系统 |
| 高可用 | 主从复制、多活部署、故障转移 | 核心业务系统 |
| 数据安全 | 加密传输、访问控制、审计日志 | 金融、医疗系统 |

## 设计文档模板

在实际工作中，系统设计需要文档化。以下是推荐的设计文档模板：

```markdown
# [系统名称] 设计文档

## 概述
### 背景
[描述业务背景和设计目的]

### 术语定义
| 术语 | 定义 |
|------|------|
| XXX | XXX |

## 需求分析
### 功能需求
- FR-1: [功能需求1]
- FR-2: [功能需求2]

### 非功能需求
| 指标 | 目标值 | 说明 |
|------|--------|------|
| QPS | 10,000 | 峰值请求量 |
| 延迟 | P99 < 100ms | 响应时间 |
| 可用性 | 99.99% | SLA |

### 约束条件
- 技术栈限制
- 成本预算
- 时间限制

## 高层架构
### 架构图
[ASCII 图或链接]

### 组件说明
| 组件 | 职责 | 技术选型 |
|------|------|----------|
| XXX | XXX | XXX |

## 详细设计
### 数据模型
[ER 图、Schema 设计]

### API 设计
[API 定义]

### 核心流程
[时序图、流程图]

## 关键设计决策
### [决策点1]
- 问题描述
- 备选方案
- 决策结果
- 理由

## 容量规划
### 存储估算
### 带宽估算
### 计算资源估算

## 监控告警
### 关键指标
### 告警策略

## 风险与缓解
| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| XXX | XXX | XXX |

## 里程碑
| 阶段 | 交付物 | 时间 |
|------|--------|------|
| XXX | XXX | XXX |
```

## 面试要点

### 系统设计面试评分维度

面试官通常从以下维度评估候选人：

1. **问题分析能力（20%）**
   - 能否提出正确的澄清问题
   - 能否识别关键需求和约束
   - 能否合理估算系统规模

2. **架构设计能力（30%）**
   - 高层架构是否合理
   - 组件划分是否清晰
   - 是否考虑了可扩展性

3. **深入设计能力（25%）**
   - 数据模型是否合理
   - API 设计是否规范
   - 核心算法是否正确

4. **权衡与决策（15%）**
   - 能否识别多种方案
   - 能否分析各方案优缺点
   - 决策是否有理有据

5. **沟通表达（10%）**
   - 思路是否清晰
   - 能否有效利用白板/图示
   - 能否主动推进讨论

### 常见面试问题清单

**入门级：**
- 设计一个 URL 短链服务
- 设计一个 Pastebin 服务
- 设计一个限流器

**中级：**
- 设计 Twitter/微博的 Feed 流
- 设计一个即时通讯系统
- 设计一个视频流服务（Netflix）

**高级：**
- 设计一个搜索引擎
- 设计一个分布式消息队列
- 设计一个分布式任务调度系统
- 设计一个实时推荐系统

### 面试技巧总结

1. **主动沟通**
   - 不要默默思考太久，边想边说
   - 遇到不确定的地方主动询问
   - 定期总结已讨论的内容

2. **结构化表达**
   - 使用 RADIO 框架组织回答
   - 先给出高层方案，再深入细节
   - 使用图示辅助表达

3. **展示深度**
   - 在被问到的地方展示技术深度
   - 主动提及可能的问题和解决方案
   - 分享相关的实际经验

4. **保持灵活**
   - 接受面试官的建议和约束
   - 能够根据反馈调整方案
   - 展示迭代改进的能力

## 总结

系统设计是一门综合性很强的技能，需要理论知识与实践经验的结合。通过学习经典系统设计案例，我们可以：

1. **掌握设计方法论**：RADIO 框架提供了系统化的设计思路
2. **积累解决方案**：经典案例提供了可复用的设计模式
3. **培养权衡思维**：理解不同方案的优缺点和适用场景
4. **提升沟通能力**：学会结构化表达复杂的技术方案

记住，系统设计没有标准答案，关键是在给定约束下做出合理的权衡和决策。持续学习、多做练习、总结反思是提升系统设计能力的最佳途径。

## 参考资源

- System Design Interview by Alex Xu
- Designing Data-Intensive Applications by Martin Kleppmann
- Google SRE Book
- AWS Well-Architected Framework
- 各大公司技术博客（Meta Engineering, Netflix Tech Blog, Uber Engineering 等）
