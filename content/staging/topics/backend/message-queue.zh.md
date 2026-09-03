---
title: 消息队列完全指南
description: 掌握消息队列核心概念，实现系统解耦与异步处理
track: backend
section: caching-queues
difficulty: advanced
tags:
  - 消息队列
  - RabbitMQ
  - Kafka
  - 异步
status: imported
origin: old/src/content/docs/backend/message-queue.zh.md
divergence: 0.23
issues: []
legacy:
  category: Backend
  subcategory: Infrastructure
  order: 16
  lastUpdated: 2026-01-07
---

## 概念解释

消息队列（Message Queue，简称 MQ）是一种应用程序间的通信方式，允许发送者将消息发送到队列中，接收者从队列中获取消息进行处理。它是分布式系统中实现**异步通信**、**系统解耦**和**流量削峰**的核心基础设施。

### 为什么需要消息队列

在传统的同步调用模式中，服务 A 调用服务 B 必须等待响应才能继续执行，这带来了几个问题：

1. **高耦合**：服务之间直接依赖，任何变更都可能影响调用方
2. **低可用**：被调用方故障会导致整个调用链失败
3. **性能瓶颈**：同步等待造成资源浪费，吞吐量受限
4. **流量冲击**：突发流量直接打到下游服务，容易造成雪崩

消息队列通过引入中间层，优雅地解决了这些问题：

```
传统同步模式：
用户请求 → 订单服务 → 库存服务 → 支付服务 → 通知服务 → 响应用户
           (等待)      (等待)      (等待)      (等待)

异步消息模式：
用户请求 → 订单服务 → 响应用户
              ↓
           消息队列
          ↙   ↓   ↘
     库存服务 支付服务 通知服务（并行异步处理）
```

### 消息队列的核心价值

**1. 异步处理**
将耗时操作从主流程中剥离，用户无需等待所有操作完成即可获得响应。

**2. 应用解耦**
生产者和消费者通过队列通信，彼此不直接依赖，可以独立开发、部署和扩展。

**3. 流量削峰**
队列作为缓冲层，平滑处理突发流量，保护下游服务不被压垮。

**4. 可靠传递**
消息持久化保证即使系统故障，数据也不会丢失。

**5. 广播通信**
一条消息可以被多个消费者同时处理，实现发布订阅模式。

---

## 常见消息队列对比

市面上有多种消息队列产品，每种都有其特点和适用场景。以下是三种主流消息队列的详细对比。

### RabbitMQ

RabbitMQ 是基于 AMQP 协议实现的开源消息代理，由 Erlang 语言编写，以其可靠性和灵活的路由机制著称。

**核心特点：**
- 支持多种消息协议（AMQP、MQTT、STOMP）
- 丰富的路由规则（Direct、Topic、Fanout、Headers）
- 支持消息确认和持久化
- 提供管理界面和丰富的插件生态
- 单机吞吐量约 1-2 万 QPS

**适用场景：**
- 需要复杂路由逻辑的业务
- 对消息可靠性要求高的场景
- 中小规模的消息处理
- 传统企业应用集成

### Apache Kafka

Kafka 是一个分布式流处理平台，最初由 LinkedIn 开发，专为高吞吐量场景设计。

**核心特点：**
- 超高吞吐量，单机可达百万级 TPS
- 消息持久化到磁盘，支持消息回溯
- 分布式架构，天然支持水平扩展
- 消息顺序保证（分区内有序）
- 支持消费者组实现负载均衡

**适用场景：**
- 大数据日志收集和处理
- 实时数据流处理
- 事件溯源架构
- 高吞吐量的消息传递

### Redis Streams

Redis 5.0 引入的 Streams 数据结构，为 Redis 增添了消息队列能力。

**核心特点：**
- 基于内存，延迟极低
- 支持消费者组
- 消息持久化（依赖 Redis 持久化机制）
- 部署简单，运维成本低
- 功能相对简单

**适用场景：**
- 对延迟要求极高的场景
- 已使用 Redis 的项目
- 轻量级消息队列需求
- 简单的发布订阅场景

### 对比总结

| 特性 | RabbitMQ | Kafka | Redis Streams |
|------|----------|-------|---------------|
| 吞吐量 | 万级 | 百万级 | 十万级 |
| 延迟 | 毫秒级 | 毫秒级 | 亚毫秒级 |
| 消息可靠性 | 高 | 高 | 中 |
| 消息顺序 | 单队列有序 | 分区内有序 | 有序 |
| 消息回溯 | 不支持 | 支持 | 支持 |
| 路由功能 | 强大 | 简单 | 简单 |
| 运维复杂度 | 中 | 高 | 低 |
| 生态系统 | 丰富 | 丰富 | 一般 |

---

## RabbitMQ 详解

### 核心架构

RabbitMQ 的架构围绕以下核心概念构建：

```
                    ┌─────────────────────────────────────────┐
                    │              RabbitMQ Broker            │
                    │                                         │
Producer ────────►  │  Exchange ────► Binding ────► Queue  ────────► Consumer
                    │     │                           │       │
                    │   路由键匹配                   消息存储   │
                    │                                         │
                    └─────────────────────────────────────────┘
```

**Producer（生产者）**：发送消息的应用程序

**Exchange（交换机）**：接收消息并根据路由规则分发到队列

**Queue（队列）**：存储消息的缓冲区

**Binding（绑定）**：Exchange 和 Queue 之间的关联规则

**Consumer（消费者）**：接收并处理消息的应用程序

### Exchange 类型详解

#### Direct Exchange（直连交换机）

根据消息的 Routing Key 精确匹配队列。

```javascript
// Node.js + amqplib 示例
const amqp = require('amqplib');

async function directExchangeExample() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const exchange = 'direct_logs';
  const queue = 'error_logs';
  const routingKey = 'error';

  // 声明交换机
  await channel.assertExchange(exchange, 'direct', { durable: true });

  // 声明队列并绑定
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, routingKey);

  // 发送消息
  channel.publish(exchange, 'error', Buffer.from('Error occurred!'));
  channel.publish(exchange, 'info', Buffer.from('Info message'));  // 不会到达 error_logs 队列

  console.log('Messages sent');
}
```

#### Topic Exchange（主题交换机）

支持通配符匹配的路由规则，`*` 匹配一个单词，`#` 匹配零个或多个单词。

```javascript
async function topicExchangeExample() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const exchange = 'topic_logs';

  await channel.assertExchange(exchange, 'topic', { durable: true });

  // 队列1: 接收所有订单相关消息
  await channel.assertQueue('all_orders');
  await channel.bindQueue('all_orders', exchange, 'order.#');

  // 队列2: 只接收订单创建消息
  await channel.assertQueue('order_created');
  await channel.bindQueue('order_created', exchange, 'order.created');

  // 队列3: 接收所有错误消息
  await channel.assertQueue('all_errors');
  await channel.bindQueue('all_errors', exchange, '*.error');

  // 发送消息
  channel.publish(exchange, 'order.created', Buffer.from('New order'));     // 到达 all_orders, order_created
  channel.publish(exchange, 'order.shipped', Buffer.from('Order shipped')); // 到达 all_orders
  channel.publish(exchange, 'order.error', Buffer.from('Order error'));     // 到达 all_orders, all_errors
  channel.publish(exchange, 'payment.error', Buffer.from('Payment error')); // 到达 all_errors
}
```

#### Fanout Exchange（扇出交换机）

将消息广播到所有绑定的队列，忽略 Routing Key。

```javascript
async function fanoutExchangeExample() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const exchange = 'broadcast';

  await channel.assertExchange(exchange, 'fanout', { durable: true });

  // 多个服务订阅同一个广播
  const services = ['email_service', 'sms_service', 'push_service'];

  for (const service of services) {
    await channel.assertQueue(service);
    await channel.bindQueue(service, exchange, '');  // Routing Key 被忽略
  }

  // 发送广播消息 - 所有服务都会收到
  channel.publish(exchange, '', Buffer.from(JSON.stringify({
    event: 'user_registered',
    userId: 12345
  })));
}
```

#### Headers Exchange（头交换机）

根据消息头属性进行路由，而非 Routing Key。

```javascript
async function headersExchangeExample() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const exchange = 'headers_exchange';

  await channel.assertExchange(exchange, 'headers', { durable: true });

  // 绑定时指定匹配的 headers
  await channel.assertQueue('pdf_processor');
  await channel.bindQueue('pdf_processor', exchange, '', {
    'x-match': 'all',  // 'all' 表示所有条件都要匹配，'any' 表示任一条件匹配
    'format': 'pdf',
    'type': 'report'
  });

  // 发送带 headers 的消息
  channel.publish(exchange, '', Buffer.from('PDF Report Data'), {
    headers: {
      'format': 'pdf',
      'type': 'report'
    }
  });
}
```

### 消息确认机制

RabbitMQ 提供了完善的消息确认机制，确保消息可靠传递。

```javascript
async function messageAcknowledgement() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const queue = 'task_queue';

  await channel.assertQueue(queue, { durable: true });

  // 设置预取数量，实现负载均衡
  channel.prefetch(1);

  // 消费消息
  channel.consume(queue, async (msg) => {
    const content = msg.content.toString();
    console.log(`Processing: ${content}`);

    try {
      // 模拟处理耗时
      await processTask(content);

      // 处理成功，确认消息
      channel.ack(msg);
      console.log('Message acknowledged');
    } catch (error) {
      console.error('Processing failed:', error);

      // 处理失败，拒绝消息
      // requeue: true 重新入队，false 丢弃或进入死信队列
      channel.nack(msg, false, false);
    }
  }, { noAck: false });  // noAck: false 启用手动确认
}

async function processTask(content) {
  // 业务处理逻辑
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

---

## Kafka 详解

### 核心架构

Kafka 采用分布式架构，由以下核心组件构成：

```
                    ┌─────────────────────────────────────────────────┐
                    │                 Kafka Cluster                   │
                    │                                                 │
                    │   Topic: orders                                 │
                    │   ┌─────────────────────────────────────────┐   │
Producer ─────────► │   │  Partition 0: [msg1][msg2][msg3]...     │   │
                    │   │  Partition 1: [msg4][msg5][msg6]...     │ ◄─────── Consumer Group
Producer ─────────► │   │  Partition 2: [msg7][msg8][msg9]...     │   │
                    │   └─────────────────────────────────────────┘   │
                    │                                                 │
                    └─────────────────────────────────────────────────┘
                                          │
                                    ZooKeeper / KRaft
                                    (元数据管理)
```

**Broker**：Kafka 服务器节点，负责存储和转发消息

**Topic**：消息的逻辑分类，类似于数据库的表

**Partition**：Topic 的物理分片，实现并行处理和水平扩展

**Replica**：分区副本，提供高可用性

**Consumer Group**：消费者组，实现消息的负载均衡

### 分区与副本机制

```javascript
// Node.js + kafkajs 示例
const { Kafka, Partitioners } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092', 'localhost:9093', 'localhost:9094']
});

// 创建 Topic（通常通过命令行或配置文件）
const admin = kafka.admin();

async function createTopic() {
  await admin.connect();

  await admin.createTopics({
    topics: [{
      topic: 'orders',
      numPartitions: 3,        // 3个分区
      replicationFactor: 2,   // 2个副本
      configEntries: [
        { name: 'retention.ms', value: '604800000' },  // 保留7天
        { name: 'cleanup.policy', value: 'delete' }
      ]
    }]
  });

  await admin.disconnect();
}
```

### 生产者详解

```javascript
const producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner,
  allowAutoTopicCreation: false,
  transactionTimeout: 30000
});

async function produceMessages() {
  await producer.connect();

  // 发送单条消息
  await producer.send({
    topic: 'orders',
    messages: [
      {
        key: 'order-123',      // 相同 key 的消息会发送到同一分区
        value: JSON.stringify({
          orderId: '123',
          userId: 'user-456',
          amount: 99.99,
          timestamp: Date.now()
        }),
        headers: {
          'source': 'web-app',
          'version': '1.0'
        }
      }
    ]
  });

  // 批量发送
  await producer.sendBatch({
    topicMessages: [
      {
        topic: 'orders',
        messages: [
          { key: 'order-124', value: JSON.stringify({ orderId: '124' }) },
          { key: 'order-125', value: JSON.stringify({ orderId: '125' }) }
        ]
      },
      {
        topic: 'inventory',
        messages: [
          { key: 'sku-001', value: JSON.stringify({ sku: '001', quantity: -1 }) }
        ]
      }
    ]
  });

  await producer.disconnect();
}

// 幂等生产者配置（防止重复消息）
const idempotentProducer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 5,
  transactionalId: 'my-transactional-id'  // 启用事务
});
```

### 消费者组详解

```javascript
const consumer = kafka.consumer({
  groupId: 'order-processing-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxBytesPerPartition: 1048576,  // 1MB
  minBytes: 1,
  maxBytes: 10485760,  // 10MB
  maxWaitTimeInMs: 5000
});

async function consumeMessages() {
  await consumer.connect();

  // 订阅 Topic
  await consumer.subscribe({
    topics: ['orders'],
    fromBeginning: false  // true: 从头消费; false: 从最新位置消费
  });

  // 处理消息
  await consumer.run({
    partitionsConsumedConcurrently: 3,  // 并行消费分区数
    eachMessage: async ({ topic, partition, message, heartbeat }) => {
      const order = JSON.parse(message.value.toString());

      console.log({
        topic,
        partition,
        offset: message.offset,
        key: message.key?.toString(),
        order
      });

      // 处理业务逻辑
      await processOrder(order);

      // 长时间处理时发送心跳，避免被踢出消费者组
      await heartbeat();
    }
  });
}

// 批量消费模式
await consumer.run({
  eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
    for (const message of batch.messages) {
      if (!isRunning() || isStale()) break;

      await processMessage(message);
      resolveOffset(message.offset);
      await heartbeat();
    }
  }
});
```

### 消费者组再平衡

当消费者组成员变化时，Kafka 会触发再平衡，重新分配分区。

```javascript
const consumer = kafka.consumer({
  groupId: 'order-processing-group'
});

// 监听再平衡事件
consumer.on('consumer.group_join', ({ duration, groupId, memberId }) => {
  console.log(`Consumer joined group ${groupId}, member: ${memberId}`);
});

consumer.on('consumer.rebalancing', ({ groupId }) => {
  console.log(`Rebalancing group ${groupId}`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('Shutting down consumer...');
  await consumer.disconnect();
  process.exit(0);
});
```

---

## 消息模式

### 点对点模式（Point-to-Point）

一条消息只能被一个消费者处理，适用于任务分发场景。

```javascript
// RabbitMQ 实现
async function pointToPoint() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const queue = 'task_queue';
  await channel.assertQueue(queue, { durable: true });

  // 多个消费者竞争消费
  channel.prefetch(1);  // 每次只获取一条消息

  channel.consume(queue, async (msg) => {
    console.log(`Worker ${process.pid} processing: ${msg.content.toString()}`);
    await processTask(msg.content);
    channel.ack(msg);
  });
}

// Kafka 实现（同一消费者组内的消费者竞争消费）
async function kafkaPointToPoint() {
  const consumer = kafka.consumer({ groupId: 'task-workers' });
  await consumer.connect();
  await consumer.subscribe({ topics: ['tasks'] });

  await consumer.run({
    eachMessage: async ({ message }) => {
      console.log(`Worker processing: ${message.value.toString()}`);
    }
  });
}
```

### 发布订阅模式（Publish-Subscribe）

一条消息可以被多个消费者同时处理，适用于事件广播场景。

```javascript
// RabbitMQ 实现 - 使用 Fanout Exchange
async function publishSubscribe() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const exchange = 'events';
  await channel.assertExchange(exchange, 'fanout', { durable: true });

  // 每个服务创建自己的队列
  const { queue } = await channel.assertQueue('', { exclusive: true });
  await channel.bindQueue(queue, exchange, '');

  channel.consume(queue, (msg) => {
    const event = JSON.parse(msg.content.toString());
    console.log(`Received event: ${event.type}`);
  });
}

// Kafka 实现 - 不同消费者组独立消费
async function kafkaPubSub() {
  // 消费者组1: 发送邮件
  const emailConsumer = kafka.consumer({ groupId: 'email-service' });
  await emailConsumer.subscribe({ topics: ['user-events'] });

  // 消费者组2: 更新缓存
  const cacheConsumer = kafka.consumer({ groupId: 'cache-service' });
  await cacheConsumer.subscribe({ topics: ['user-events'] });

  // 两个服务独立消费同一消息
  await emailConsumer.run({
    eachMessage: async ({ message }) => {
      await sendEmail(JSON.parse(message.value.toString()));
    }
  });

  await cacheConsumer.run({
    eachMessage: async ({ message }) => {
      await updateCache(JSON.parse(message.value.toString()));
    }
  });
}
```

---

## 消息可靠性保证

确保消息不丢失是消息队列系统的核心要求，需要从生产者、Broker、消费者三个环节进行保障。

### 生产者端保障

```javascript
// RabbitMQ - Publisher Confirms
async function reliablePublish() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createConfirmChannel();  // 使用确认通道

  const queue = 'important_tasks';
  await channel.assertQueue(queue, { durable: true });

  try {
    // 发送消息并等待确认
    await new Promise((resolve, reject) => {
      channel.sendToQueue(
        queue,
        Buffer.from('Important message'),
        { persistent: true },  // 消息持久化
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    console.log('Message confirmed');
  } catch (error) {
    console.error('Message failed:', error);
    // 重试逻辑
  }
}

// Kafka - ACK 配置
const producer = kafka.producer({
  acks: -1,  // -1 (all): 等待所有副本确认; 1: Leader确认; 0: 不等待
  timeout: 30000,
  compression: 'gzip'
});
```

### Broker 端保障

```javascript
// RabbitMQ - 队列和消息持久化
await channel.assertQueue('durable_queue', {
  durable: true,      // 队列持久化
  arguments: {
    'x-queue-mode': 'lazy'  // 懒加载模式，消息直接写入磁盘
  }
});

channel.sendToQueue('durable_queue', Buffer.from('Message'), {
  persistent: true,   // 消息持久化
  deliveryMode: 2     // 等同于 persistent: true
});

// Kafka - 副本配置
// 在 server.properties 中配置
// min.insync.replicas=2  // 最小同步副本数
// default.replication.factor=3  // 默认副本数
```

### 消费者端保障

```javascript
// RabbitMQ - 手动确认
channel.consume(queue, async (msg) => {
  try {
    await processMessage(msg.content);
    channel.ack(msg);  // 处理成功才确认
  } catch (error) {
    // 处理失败，重新入队或进入死信队列
    channel.nack(msg, false, true);  // requeue: true
  }
}, { noAck: false });

// Kafka - 手动提交 Offset
const consumer = kafka.consumer({
  groupId: 'my-group',
  autoCommit: false  // 关闭自动提交
});

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    await processMessage(message);

    // 手动提交 offset
    await consumer.commitOffsets([{
      topic,
      partition,
      offset: (parseInt(message.offset) + 1).toString()
    }]);
  }
});
```

---

## 幂等性处理

由于网络波动或重试机制，消费者可能收到重复消息，必须保证处理的幂等性。

### 幂等性实现方案

```javascript
// 方案1: 数据库唯一约束
async function processOrderIdempotent(order) {
  const pool = require('pg').Pool;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 使用唯一约束防止重复处理
    await client.query(`
      INSERT INTO processed_orders (order_id, status, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (order_id) DO NOTHING
    `, [order.orderId, 'processing']);

    // 检查是否插入成功（非重复消息）
    const result = await client.query(
      'SELECT * FROM processed_orders WHERE order_id = $1 AND status = $2',
      [order.orderId, 'processing']
    );

    if (result.rowCount === 0) {
      console.log(`Order ${order.orderId} already processed, skipping`);
      await client.query('ROLLBACK');
      return;
    }

    // 处理订单业务逻辑
    await processOrderLogic(order, client);

    // 更新状态
    await client.query(
      'UPDATE processed_orders SET status = $1 WHERE order_id = $2',
      ['completed', order.orderId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// 方案2: Redis 去重
const Redis = require('ioredis');
const redis = new Redis();

async function processWithRedisDedup(message) {
  const messageId = message.headers['message-id'];
  const dedupKey = `dedup:${messageId}`;

  // SET NX 实现原子性去重
  const acquired = await redis.set(dedupKey, '1', 'EX', 86400, 'NX');

  if (!acquired) {
    console.log(`Message ${messageId} already processed`);
    return;
  }

  try {
    await processBusinessLogic(message);
  } catch (error) {
    // 处理失败，删除去重标记，允许重试
    await redis.del(dedupKey);
    throw error;
  }
}

// 方案3: 乐观锁版本控制
async function updateWithVersion(entity) {
  const result = await db.query(`
    UPDATE accounts
    SET balance = balance + $1, version = version + 1
    WHERE id = $2 AND version = $3
  `, [entity.amount, entity.id, entity.version]);

  if (result.rowCount === 0) {
    throw new Error('Concurrent modification detected');
  }
}
```

---

## 死信队列与延迟队列

### 死信队列（Dead Letter Queue）

死信队列用于存储无法正常处理的消息，便于后续排查和重试。

```javascript
// RabbitMQ 死信队列配置
async function setupDeadLetterQueue() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  // 1. 创建死信交换机和队列
  await channel.assertExchange('dlx_exchange', 'direct', { durable: true });
  await channel.assertQueue('dead_letter_queue', { durable: true });
  await channel.bindQueue('dead_letter_queue', 'dlx_exchange', 'dead_letter');

  // 2. 创建业务队列，配置死信参数
  await channel.assertQueue('business_queue', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'dlx_exchange',
      'x-dead-letter-routing-key': 'dead_letter',
      'x-message-ttl': 60000,  // 消息TTL: 60秒
      'x-max-length': 10000    // 队列最大长度
    }
  });

  // 3. 消费业务队列
  channel.consume('business_queue', async (msg) => {
    try {
      await processMessage(msg);
      channel.ack(msg);
    } catch (error) {
      // 消息被拒绝且不重新入队，会进入死信队列
      channel.nack(msg, false, false);
    }
  });

  // 4. 消费死信队列，记录或告警
  channel.consume('dead_letter_queue', (msg) => {
    console.error('Dead letter:', {
      content: msg.content.toString(),
      headers: msg.properties.headers,
      deathReason: msg.properties.headers?.['x-death']
    });

    // 记录到日志或发送告警
    alertDeadLetter(msg);
    channel.ack(msg);
  });
}
```

### 延迟队列

延迟队列用于实现定时任务、延迟重试等场景。

```javascript
// RabbitMQ 延迟队列 - 使用 TTL + 死信实现
async function setupDelayQueue() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  // 实际处理队列
  await channel.assertExchange('process_exchange', 'direct', { durable: true });
  await channel.assertQueue('process_queue', { durable: true });
  await channel.bindQueue('process_queue', 'process_exchange', 'process');

  // 延迟队列（消息在此等待，过期后转发到处理队列）
  await channel.assertQueue('delay_queue_30s', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'process_exchange',
      'x-dead-letter-routing-key': 'process',
      'x-message-ttl': 30000  // 30秒延迟
    }
  });

  // 发送延迟消息
  channel.sendToQueue('delay_queue_30s', Buffer.from(JSON.stringify({
    task: 'send_reminder',
    userId: 123
  })), { persistent: true });

  console.log('Message will be processed after 30 seconds');
}

// RabbitMQ 延迟插件（推荐）
async function setupDelayPlugin() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  // 使用 x-delayed-message 插件
  await channel.assertExchange('delayed_exchange', 'x-delayed-message', {
    durable: true,
    arguments: {
      'x-delayed-type': 'direct'
    }
  });

  await channel.assertQueue('delayed_queue', { durable: true });
  await channel.bindQueue('delayed_queue', 'delayed_exchange', 'delayed');

  // 发送延迟消息，通过 headers 指定延迟时间
  channel.publish('delayed_exchange', 'delayed', Buffer.from('Delayed message'), {
    headers: {
      'x-delay': 60000  // 延迟60秒
    }
  });
}
```

---

## 实战场景

### 场景一：电商订单处理

```javascript
// order-service.js - 订单服务
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['kafka1:9092', 'kafka2:9092']
});

const producer = kafka.producer({ acks: -1 });

class OrderService {
  async createOrder(orderData) {
    // 1. 保存订单到数据库
    const order = await db.orders.create({
      ...orderData,
      status: 'pending',
      createdAt: new Date()
    });

    // 2. 发送订单创建事件
    await producer.send({
      topic: 'order-events',
      messages: [{
        key: order.id,
        value: JSON.stringify({
          type: 'ORDER_CREATED',
          orderId: order.id,
          userId: order.userId,
          items: order.items,
          totalAmount: order.totalAmount,
          timestamp: Date.now()
        }),
        headers: {
          'event-type': 'ORDER_CREATED',
          'source': 'order-service'
        }
      }]
    });

    return order;
  }
}

// inventory-service.js - 库存服务
const inventoryConsumer = kafka.consumer({ groupId: 'inventory-service' });

async function startInventoryService() {
  await inventoryConsumer.connect();
  await inventoryConsumer.subscribe({ topics: ['order-events'] });

  await inventoryConsumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());

      if (event.type === 'ORDER_CREATED') {
        await handleOrderCreated(event);
      }
    }
  });
}

async function handleOrderCreated(event) {
  const { orderId, items } = event;

  try {
    // 扣减库存
    for (const item of items) {
      await db.inventory.decrement(item.sku, item.quantity);
    }

    // 发送库存扣减成功事件
    await producer.send({
      topic: 'inventory-events',
      messages: [{
        key: orderId,
        value: JSON.stringify({
          type: 'INVENTORY_RESERVED',
          orderId,
          items,
          timestamp: Date.now()
        })
      }]
    });
  } catch (error) {
    // 库存不足，发送失败事件
    await producer.send({
      topic: 'inventory-events',
      messages: [{
        key: orderId,
        value: JSON.stringify({
          type: 'INVENTORY_RESERVATION_FAILED',
          orderId,
          reason: error.message,
          timestamp: Date.now()
        })
      }]
    });
  }
}

// payment-service.js - 支付服务
const paymentConsumer = kafka.consumer({ groupId: 'payment-service' });

async function startPaymentService() {
  await paymentConsumer.connect();
  await paymentConsumer.subscribe({ topics: ['inventory-events'] });

  await paymentConsumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());

      if (event.type === 'INVENTORY_RESERVED') {
        await processPayment(event.orderId);
      }
    }
  });
}
```

### 场景二：分布式日志收集

```javascript
// log-producer.js - 应用日志生产者
const { Kafka, CompressionTypes } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'app-server',
  brokers: ['kafka1:9092', 'kafka2:9092', 'kafka3:9092']
});

const producer = kafka.producer({
  compression: CompressionTypes.GZIP,  // 压缩日志
  acks: 1,  // 日志场景可以接受少量丢失
  maxInFlightRequests: 5,
  batchSize: 16384,  // 批量发送
  lingerMs: 10  // 等待10ms凑批
});

class LogCollector {
  constructor() {
    this.buffer = [];
    this.flushInterval = setInterval(() => this.flush(), 5000);
  }

  log(level, message, metadata = {}) {
    this.buffer.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      service: process.env.SERVICE_NAME,
      host: require('os').hostname(),
      ...metadata
    });

    if (this.buffer.length >= 100) {
      this.flush();
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const logs = this.buffer;
    this.buffer = [];

    try {
      await producer.send({
        topic: 'application-logs',
        messages: logs.map(log => ({
          key: log.service,
          value: JSON.stringify(log),
          timestamp: Date.parse(log.timestamp).toString()
        }))
      });
    } catch (error) {
      console.error('Failed to send logs:', error);
      // 失败的日志写入本地文件作为备份
      this.writeToLocalFile(logs);
    }
  }

  info(message, metadata) { this.log('INFO', message, metadata); }
  warn(message, metadata) { this.log('WARN', message, metadata); }
  error(message, metadata) { this.log('ERROR', message, metadata); }
}

// log-consumer.js - 日志消费者（写入 Elasticsearch）
const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({ node: 'http://elasticsearch:9200' });
const logConsumer = kafka.consumer({ groupId: 'log-processor' });

async function startLogProcessor() {
  await logConsumer.connect();
  await logConsumer.subscribe({ topics: ['application-logs'] });

  await logConsumer.run({
    eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
      const operations = [];

      for (const message of batch.messages) {
        const log = JSON.parse(message.value.toString());

        operations.push(
          { index: { _index: `logs-${log.timestamp.slice(0, 10)}` } },
          log
        );

        resolveOffset(message.offset);
      }

      // 批量写入 Elasticsearch
      if (operations.length > 0) {
        await esClient.bulk({ operations });
      }

      await heartbeat();
    }
  });
}
```

---

## 面试要点

### 消息队列如何保证消息不丢失？

**答案要点：**
- **生产者端**：开启消息确认机制（RabbitMQ 的 Publisher Confirms，Kafka 的 acks=-1）
- **Broker 端**：消息持久化、多副本机制
- **消费者端**：手动确认/提交 offset，确保消息处理完成后再确认

### 如何保证消息的顺序性？

**答案要点：**
- **RabbitMQ**：单队列天然有序，但多消费者时需要限制为单消费者
- **Kafka**：同一分区内有序，使用相同的 key 保证相关消息进入同一分区
- **业务层面**：添加序列号，消费者端按序处理

### 如何处理消息积压？

**答案要点：**
- 临时扩容消费者数量
- 降低非核心消息的处理优先级
- 增加分区/队列数量
- 优化消费者处理逻辑
- 建立消息积压告警机制

### RabbitMQ 和 Kafka 如何选型？

**答案要点：**
- 需要复杂路由、消息可靠性优先 -> RabbitMQ
- 需要高吞吐量、消息回溯、流处理 -> Kafka
- 团队技术栈和运维能力
- 业务场景特点

### 如何实现延迟消息？

**答案要点：**
- **RabbitMQ**：TTL + 死信队列 或 延迟插件
- **Kafka**：时间轮算法 + 多级延迟 Topic
- **Redis**：Sorted Set 按时间戳排序

### 消息队列的事务如何实现？

**答案要点：**
- **RabbitMQ**：事务模式（性能差）或 Publisher Confirms
- **Kafka**：事务 API，支持原子写入多个 Topic
- **本地消息表**：业务表和消息表在同一事务中操作

```javascript
// Kafka 事务示例
const producer = kafka.producer({
  transactionalId: 'order-transaction',
  maxInFlightRequests: 1,
  idempotent: true
});

await producer.connect();

const transaction = await producer.transaction();

try {
  await transaction.send({
    topic: 'orders',
    messages: [{ value: JSON.stringify(order) }]
  });

  await transaction.send({
    topic: 'inventory',
    messages: [{ value: JSON.stringify(inventoryUpdate) }]
  });

  await transaction.commit();
} catch (error) {
  await transaction.abort();
  throw error;
}
```

### 什么是消息的幂等性？如何保证？

**答案要点：**
- 幂等性指同一消息处理多次与处理一次的结果相同
- 实现方式：唯一消息 ID 去重、数据库唯一约束、乐观锁版本控制
- Kafka 生产者幂等配置：`idempotent: true`

### 消费者组的作用是什么？

**答案要点：**
- 实现消息的负载均衡
- 同组消费者竞争消费
- 不同组消费者独立消费
- 支持消费者故障时自动再平衡

---

## 总结

消息队列是现代分布式系统的核心组件，合理使用可以显著提升系统的可扩展性、可用性和性能。选择合适的消息队列产品，并正确处理消息的可靠性、顺序性和幂等性，是构建健壮系统的关键。

**核心要点回顾：**

1. 消息队列解决异步处理、系统解耦、流量削峰三大问题
2. RabbitMQ 适合复杂路由场景，Kafka 适合高吞吐量场景
3. 消息可靠性需要从生产者、Broker、消费者三端保障
4. 幂等性处理是消费者端的必备能力
5. 死信队列用于异常消息的兜底处理
6. 实际应用中要根据业务特点选择合适的消息模式

掌握这些知识，你就能在分布式系统开发中游刃有余地使用消息队列技术。
