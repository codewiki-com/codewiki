---
title: NATS 消息系统
description: NATS 完全指南 - 面向微服务和边缘计算的云原生消息系统
track: backend
section: caching-queues
difficulty: intermediate
tags:
  - NATS
  - Messaging
  - Pub/Sub
  - JetStream
  - Microservices
status: imported
origin: old/src/content/docs/backend/nats.zh.md
divergence: 0.22
issues: []
legacy:
  category: Backend
  subcategory: Messaging
  order: 35
  lastUpdated: 2026-01-20
---

NATS 是一个高性能的云原生消息系统，专为现代分布式系统设计。以其简洁性、速度和可靠性著称，NATS 为全球一些最大的微服务架构和物联网部署提供支持。本指南涵盖了使用 NATS 构建健壮消息解决方案所需的所有内容。

## 什么是 NATS？

NATS（Neural Autonomic Transport System，神经自主传输系统）是一个用 Go 语言编写的开源消息系统，为数字系统、服务和设备提供简单、安全且高性能的通信基础设施。NATS 最初由 Derek Collison 在 Synadia 开发，现已成为云原生计算基金会（CNCF）的一部分。

### 核心设计哲学

NATS 采用了以简洁性和性能为中心的独特设计哲学：

**始终在线，始终可用**：NATS 设计为以最小配置实现高可用性。NATS 服务器可以用一条命令启动，并立即开始接受连接。

**发射后不管**：核心 NATS 使用最多一次（at-most-once）的投递模型，优先考虑性能和简洁性而非保证投递（JetStream 在需要时提供至少一次和精确一次语义）。

**位置透明性**：客户端不需要知道服务在哪里。NATS 自动处理路由和负载均衡。

**默认安全**：NATS 内置支持 TLS、认证和多租户授权。

### NATS vs. Kafka vs. RabbitMQ

| 特性 | NATS | Kafka | RabbitMQ |
|------|------|-------|----------|
| 主要模型 | 发布/订阅、请求/响应 | 分布式日志 | 基于队列 |
| 延迟 | 亚毫秒级 | 毫秒级 | 毫秒级 |
| 消息持久化 | 可选（JetStream） | 是（默认） | 可选 |
| 顺序保证 | 按主题（JetStream） | 按分区 | 按队列 |
| 协议 | 简单文本协议 | 二进制 | AMQP（二进制） |
| 集群 | 内置自动化 | ZooKeeper/KRaft | Erlang 集群 |
| 内存占用 | ~10-50MB | 1GB+ | 100MB+ |
| 复杂度 | 低 | 高 | 中等 |
| 最佳场景 | 实时、微服务 | 事件溯源、流处理 | 任务队列 |

**何时选择 NATS**：
- 需要极低延迟（亚毫秒级）
- 构建需要请求/响应模式的微服务
- 希望以最小配置实现简单运维
- 在边缘或物联网场景部署
- 需要轻量级消息解决方案

**何时选择 Kafka**：
- 需要持久化事件日志和重放能力
- 事件溯源是核心需求
- 需要大数据管道的精确一次语义

**何时选择 RabbitMQ**：
- 需要交换机和绑定的复杂路由
- 有现有的 AMQP 集成
- 需要带确认的传统队列语义

## 核心概念与架构

### 主题（Subjects）

主题是 NATS 中的基本寻址机制。它们是区分大小写的字符串，定义消息发布的位置和订阅者监听的内容。

```
# 简单主题
orders
users.created
payments.processed

# 分层主题
store.inventory.product.123
services.auth.login.success
```

**主题命名最佳实践**：
- 使用小写字母，用点作为分隔符
- 具体且描述性强
- 遵循一致的分层模式
- 避免除点以外的特殊字符

### 发布/订阅模式

发布/订阅模式是 NATS 消息传递的基础。发布者向主题发送消息，所有订阅该主题的订阅者都会收到消息。

```
发布者                      NATS 服务器                     订阅者
    |                            |                              |
    |--- PUB orders.new -------->|-----> orders.new ----------->| 订阅者 1
    |    {"id": 1}               |-----> orders.new ----------->| 订阅者 2
    |                            |-----> orders.new ----------->| 订阅者 3
```

### 请求/响应模式

NATS 原生支持请求/响应（RPC 风格）通信。请求者发布带有唯一回复主题的消息，响应者将回复发送到该主题。

```
请求者                      NATS 服务器                     响应者
    |                            |                              |
    |--- REQ api.users.get ----->|-----> api.users.get -------->|
    |    reply: _INBOX.abc       |                              |
    |                            |<----- _INBOX.abc ------------|
    |<---------------------------|       {"name": "John"}       |
```

### 队列组（Queue Groups）

队列组通过在多个订阅者之间分发消息来实现负载均衡。队列组中只有一个订阅者接收每条消息。

```
发布者                      NATS 服务器                 队列组 "workers"
    |                            |                              |
    |--- PUB tasks.process ----->|-----> Worker 1（接收）-------|
    |                            |       Worker 2               |
    |                            |       Worker 3               |
    |                            |                              |
    |--- PUB tasks.process ----->|       Worker 1               |
    |                            |-----> Worker 2（接收）-------|
    |                            |       Worker 3               |
```

### JetStream - 持久化消息

JetStream 是 NATS 的内置持久化层，提供：
- 至少一次和精确一次投递
- 消息持久化和重放
- 消费者确认跟踪
- 跨集群的流复制

```
            JetStream 架构

┌─────────────────────────────────────────────┐
│                   Stream                     │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┐     │
│  │ M1  │ M2  │ M3  │ M4  │ M5  │ M6  │     │
│  └─────┴─────┴─────┴─────┴─────┴─────┘     │
│                    │                         │
│         ┌─────────┴─────────┐               │
│         ▼                   ▼               │
│  ┌────────────┐      ┌────────────┐         │
│  │ Consumer A │      │ Consumer B │         │
│  │ （Push）   │      │ （Pull）   │         │
│  └────────────┘      └────────────┘         │
└─────────────────────────────────────────────┘
```

## 核心要点深入解析

### 主题通配符

NATS 支持两种通配符令牌用于灵活订阅：

**单令牌通配符（`*`）**：精确匹配主题中的一个令牌。

```
orders.*           匹配: orders.new, orders.completed
                   不匹配: orders, orders.us.new

store.*.inventory  匹配: store.west.inventory, store.east.inventory
                   不匹配: store.inventory, store.west.us.inventory
```

**多令牌通配符（`>`）**：匹配一个或多个令牌（必须是最后一个令牌）。

```
orders.>           匹配: orders.new, orders.us.new, orders.us.west.new
                   不匹配: orders

store.west.>       匹配: store.west.inventory, store.west.sales.daily
```

### 队列组实现负载均衡

队列组在服务的多个实例之间分发工作：

```go
// 所有三个实例共享工作
// 每条消息只有一个接收
nc.QueueSubscribe("tasks.process", "workers", func(m *nats.Msg) {
    // 处理任务
})
```

**关键特性**：
- 消息在组成员之间随机分发
- 如果成员断开连接，消息发送给剩余成员
- 多个队列组可以订阅同一主题
- 每个队列组收到每条消息的一个副本

### JetStream Streams

Streams 是消息存储，用于捕获和持久化一个或多个主题的消息：

```javascript
// Stream 配置
const streamConfig = {
    name: "ORDERS",
    subjects: ["orders.*", "payments.>"],
    storage: "file",        // 或 "memory"
    retention: "limits",    // "limits", "interest", "workqueue"
    maxMsgs: 1000000,
    maxBytes: 1024 * 1024 * 1024, // 1GB
    maxAge: 24 * 60 * 60 * 1000000000, // 24小时（纳秒）
    replicas: 3,
    discard: "old",         // "old" 或 "new"
};
```

**保留策略**：
- `limits`：保留消息直到达到限制（大小、数量、时间）
- `interest`：仅在有活跃消费者时保留消息
- `workqueue`：确认后删除消息（队列语义）

### JetStream Consumers

Consumers 跟踪流的投递和确认状态：

**Push Consumers**：服务器将消息推送到投递主题
```javascript
const pushConfig = {
    durable_name: "order-processor",
    deliver_subject: "orders.push",
    ack_policy: "explicit",
    ack_wait: 30000000000, // 30秒
    max_deliver: 5,
    filter_subject: "orders.new"
};
```

**Pull Consumers**：客户端显式请求消息
```javascript
const pullConfig = {
    durable_name: "order-processor",
    ack_policy: "explicit",
    max_waiting: 512,
    max_ack_pending: 1000
};
```

**确认策略**：
- `none`：不需要确认（最多一次）
- `all`：确认所有先前的消息
- `explicit`：单独确认每条消息（至少一次）

## 代码示例

### Go 客户端

**安装**：
```bash
go get github.com/nats-io/nats.go
```

**基本发布/订阅**：
```go
package main

import (
    "fmt"
    "log"
    "time"

    "github.com/nats-io/nats.go"
)

func main() {
    // 连接到 NATS
    nc, err := nats.Connect(nats.DefaultURL)
    if err != nil {
        log.Fatal(err)
    }
    defer nc.Close()

    // 简单订阅者
    sub, err := nc.Subscribe("updates", func(m *nats.Msg) {
        fmt.Printf("收到: %s\n", string(m.Data))
    })
    if err != nil {
        log.Fatal(err)
    }
    defer sub.Unsubscribe()

    // 发布消息
    err = nc.Publish("updates", []byte("Hello NATS!"))
    if err != nil {
        log.Fatal(err)
    }

    // 确保消息发送
    nc.Flush()

    // 等待消息
    time.Sleep(time.Second)
}
```

**请求/响应**：
```go
package main

import (
    "fmt"
    "log"
    "time"

    "github.com/nats-io/nats.go"
)

func main() {
    nc, _ := nats.Connect(nats.DefaultURL)
    defer nc.Close()

    // 服务响应者
    nc.Subscribe("api.users.get", func(m *nats.Msg) {
        userID := string(m.Data)
        response := fmt.Sprintf(`{"id": "%s", "name": "John Doe"}`, userID)
        m.Respond([]byte(response))
    })

    // 客户端请求，2秒超时
    msg, err := nc.Request("api.users.get", []byte("123"), 2*time.Second)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("响应: %s\n", string(msg.Data))
}
```

**队列组**：
```go
package main

import (
    "fmt"
    "sync"
    "time"

    "github.com/nats-io/nats.go"
)

func main() {
    nc, _ := nats.Connect(nats.DefaultURL)
    defer nc.Close()

    var wg sync.WaitGroup

    // 在同一队列组中创建3个工作者
    for i := 1; i <= 3; i++ {
        workerID := i
        nc.QueueSubscribe("tasks", "workers", func(m *nats.Msg) {
            fmt.Printf("Worker %d 处理: %s\n", workerID, string(m.Data))
            wg.Done()
        })
    }

    // 发布10个任务
    wg.Add(10)
    for i := 1; i <= 10; i++ {
        nc.Publish("tasks", []byte(fmt.Sprintf("Task %d", i)))
    }

    nc.Flush()
    wg.Wait()
}
```

**JetStream**：
```go
package main

import (
    "context"
    "fmt"
    "log"
    "time"

    "github.com/nats-io/nats.go"
    "github.com/nats-io/nats.go/jetstream"
)

func main() {
    nc, _ := nats.Connect(nats.DefaultURL)
    defer nc.Close()

    // 创建 JetStream 上下文
    js, err := jetstream.New(nc)
    if err != nil {
        log.Fatal(err)
    }

    ctx := context.Background()

    // 创建或获取 stream
    stream, err := js.CreateOrUpdateStream(ctx, jetstream.StreamConfig{
        Name:     "ORDERS",
        Subjects: []string{"orders.>"},
        Storage:  jetstream.FileStorage,
        MaxMsgs:  10000,
    })
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Stream: %s 已创建\n", stream.CachedInfo().Config.Name)

    // 发布消息
    for i := 1; i <= 5; i++ {
        ack, err := js.Publish(ctx, "orders.new",
            []byte(fmt.Sprintf(`{"order_id": %d}`, i)))
        if err != nil {
            log.Fatal(err)
        }
        fmt.Printf("已发布 seq: %d\n", ack.Sequence)
    }

    // 创建 consumer
    consumer, err := stream.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
        Durable:   "order-processor",
        AckPolicy: jetstream.AckExplicitPolicy,
    })
    if err != nil {
        log.Fatal(err)
    }

    // 消费消息
    msgs, err := consumer.Fetch(10)
    if err != nil {
        log.Fatal(err)
    }

    for msg := range msgs.Messages() {
        fmt.Printf("收到: %s\n", string(msg.Data()))
        msg.Ack()
    }
}
```

### Node.js 客户端

**安装**：
```bash
npm install nats
```

**基本发布/订阅**：
```javascript
import { connect, StringCodec } from "nats";

async function main() {
    // 连接到 NATS
    const nc = await connect({ servers: "localhost:4222" });
    const sc = StringCodec();

    // 订阅主题
    const sub = nc.subscribe("updates");
    (async () => {
        for await (const msg of sub) {
            console.log(`收到: ${sc.decode(msg.data)}`);
        }
    })();

    // 发布消息
    nc.publish("updates", sc.encode("Hello from Node.js!"));
    nc.publish("updates", sc.encode("另一条消息"));

    // 等待后关闭
    await nc.flush();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await nc.close();
}

main();
```

**请求/响应**：
```javascript
import { connect, StringCodec } from "nats";

async function main() {
    const nc = await connect({ servers: "localhost:4222" });
    const sc = StringCodec();

    // 服务处理器
    const sub = nc.subscribe("api.echo");
    (async () => {
        for await (const msg of sub) {
            const request = sc.decode(msg.data);
            console.log(`收到请求: ${request}`);
            msg.respond(sc.encode(`Echo: ${request}`));
        }
    })();

    // 发送请求
    const response = await nc.request(
        "api.echo",
        sc.encode("Hello!"),
        { timeout: 2000 }
    );
    console.log(`响应: ${sc.decode(response.data)}`);

    await nc.close();
}

main();
```

**JetStream**：
```javascript
import { connect, StringCodec, AckPolicy, DeliverPolicy } from "nats";

async function main() {
    const nc = await connect({ servers: "localhost:4222" });
    const js = nc.jetstream();
    const jsm = await nc.jetstreamManager();
    const sc = StringCodec();

    // 创建 stream
    await jsm.streams.add({
        name: "EVENTS",
        subjects: ["events.>"],
        storage: "file",
        max_msgs: 10000,
    });

    // 发布到 JetStream
    const pa = await js.publish("events.user.created",
        sc.encode(JSON.stringify({ userId: "123", name: "Alice" })));
    console.log(`已发布 seq: ${pa.seq}`);

    // 创建持久化 consumer
    await jsm.consumers.add("EVENTS", {
        durable_name: "event-processor",
        ack_policy: AckPolicy.Explicit,
        deliver_policy: DeliverPolicy.All,
    });

    // 消费消息
    const consumer = await js.consumers.get("EVENTS", "event-processor");
    const messages = await consumer.fetch({ max_messages: 10 });

    for await (const msg of messages) {
        console.log(`收到: ${sc.decode(msg.data)}`);
        msg.ack();
    }

    await nc.close();
}

main();
```

### Python 客户端

**安装**：
```bash
pip install nats-py
```

**基本发布/订阅**：
```python
import asyncio
from nats.aio.client import Client as NATS

async def main():
    nc = NATS()
    await nc.connect("nats://localhost:4222")

    # 消息处理器
    async def message_handler(msg):
        subject = msg.subject
        data = msg.data.decode()
        print(f"收到 [{subject}]: {data}")

    # 订阅
    await nc.subscribe("updates", cb=message_handler)

    # 发布
    await nc.publish("updates", b"Hello from Python!")
    await nc.publish("updates", b"Another message")

    # 等待消息
    await asyncio.sleep(1)
    await nc.close()

asyncio.run(main())
```

**请求/响应**：
```python
import asyncio
from nats.aio.client import Client as NATS

async def main():
    nc = NATS()
    await nc.connect("nats://localhost:4222")

    # 服务处理器
    async def echo_handler(msg):
        response = f"Echo: {msg.data.decode()}"
        await msg.respond(response.encode())

    await nc.subscribe("api.echo", cb=echo_handler)

    # 发送请求
    response = await nc.request("api.echo", b"Hello!", timeout=2)
    print(f"响应: {response.data.decode()}")

    await nc.close()

asyncio.run(main())
```

**JetStream**：
```python
import asyncio
from nats.aio.client import Client as NATS
from nats.js.api import StreamConfig, ConsumerConfig, AckPolicy

async def main():
    nc = NATS()
    await nc.connect("nats://localhost:4222")
    js = nc.jetstream()

    # 创建 stream
    await js.add_stream(
        config=StreamConfig(
            name="ORDERS",
            subjects=["orders.>"],
            max_msgs=10000,
        )
    )

    # 带确认的发布
    ack = await js.publish("orders.new", b'{"order_id": 1}')
    print(f"已发布 seq: {ack.seq}")

    # 创建 consumer
    consumer = await js.pull_subscribe(
        "orders.>",
        durable="order-processor",
        config=ConsumerConfig(ack_policy=AckPolicy.EXPLICIT),
    )

    # 获取并处理消息
    messages = await consumer.fetch(batch=10, timeout=5)
    for msg in messages:
        print(f"收到: {msg.data.decode()}")
        await msg.ack()

    await nc.close()

asyncio.run(main())
```

## 最佳实践

### 集群部署

**三节点集群配置**：

```yaml
# node1.conf
server_name: node1
listen: 0.0.0.0:4222
http: 8222

cluster {
    name: production
    listen: 0.0.0.0:6222
    routes: [
        nats://node2.example.com:6222
        nats://node3.example.com:6222
    ]
}

jetstream {
    store_dir: /data/jetstream
    max_mem: 4GB
    max_file: 100GB
}
```

**使用 Helm 进行 Kubernetes 部署**：
```bash
# 添加 NATS Helm 仓库
helm repo add nats https://nats-io.github.io/k8s/helm/charts/
helm repo update

# 安装 NATS 集群
helm install nats nats/nats \
    --set cluster.enabled=true \
    --set cluster.replicas=3 \
    --set jetstream.enabled=true \
    --set jetstream.fileStore.pvc.size=10Gi
```

### 安全配置

**TLS 配置**：
```yaml
# server.conf
tls {
    cert_file: "/etc/nats/certs/server.crt"
    key_file: "/etc/nats/certs/server.key"
    ca_file: "/etc/nats/certs/ca.crt"
    verify: true
}
```

**使用 NKeys 认证**：
```yaml
# 生成 NKey 密钥对
# nk -gen user -pubout

authorization {
    users: [
        {
            nkey: UAKYB4XGQKBQR7XGNAVWVTRHPG3WVJKJQB6C5XVJQWZ7PJXDTWVDVWYQ
            permissions: {
                publish: ["orders.>", "events.>"]
                subscribe: ["notifications.>"]
            }
        }
    ]
}
```

**使用账户实现多租户**：
```yaml
accounts {
    TENANT_A: {
        jetstream: enabled
        users: [
            { user: admin_a, password: $2a$11$... }
        ]
        exports: [
            { service: "api.>" }
        ]
    }

    TENANT_B: {
        jetstream: enabled
        users: [
            { user: admin_b, password: $2a$11$... }
        ]
        imports: [
            { service: { account: TENANT_A, subject: "api.>" } }
        ]
    }
}
```

### 监控

**Prometheus 指标**：
```yaml
# 启用监控端点
http: 8222

# 访问 http://localhost:8222/varz 获取指标
# 访问 http://localhost:8222/jsz 获取 JetStream 指标
```

**需要监控的关键指标**：
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'nats'
    static_configs:
      - targets: ['nats-1:8222', 'nats-2:8222', 'nats-3:8222']
    metrics_path: /metrics
```

**核心指标**：
- `nats_server_connections`：活跃客户端连接数
- `nats_server_subscriptions`：总订阅数
- `nats_server_messages_received`：每秒接收消息数
- `nats_server_messages_sent`：每秒发送消息数
- `nats_server_bytes_received/sent`：字节吞吐量
- `jetstream_server_streams`：Stream 数量
- `jetstream_server_consumers`：Consumer 数量

## 常见陷阱

### 消息丢失场景

**问题**：订阅者慢或断开连接时消息丢失。

```go
// 错误做法：无缓冲，慢消费者丢弃消息
sub, _ := nc.Subscribe("events", func(m *nats.Msg) {
    time.Sleep(time.Second) // 慢处理
})

// 正确做法：使用 JetStream 进行持久化
js, _ := jetstream.New(nc)
consumer, _ := stream.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
    Durable:   "reliable-processor",
    AckPolicy: jetstream.AckExplicitPolicy,
    MaxDeliver: 5, // 最多重试5次
})
```

**预防策略**：
1. 对关键消息使用 JetStream
2. 实现正确的确认处理
3. 监控消费者延迟
4. 设置适当的待处理消息限制

### 背压处理

**问题**：发布者压垮慢消费者。

```go
// 错误做法：无限制发布
for i := 0; i < 1000000; i++ {
    nc.Publish("data", largePayload)
}

// 正确做法：使用 JetStream 处理背压
for i := 0; i < 1000000; i++ {
    _, err := js.Publish(ctx, "data", largePayload)
    if err != nil {
        // 处理背压
        if errors.Is(err, jetstream.ErrNoStreamResponse) {
            time.Sleep(100 * time.Millisecond)
            continue
        }
        log.Printf("发布错误: %v", err)
    }
}
```

### 连接管理

**问题**：未正确处理重连。

```go
// 错误做法：无错误处理
nc, _ := nats.Connect(nats.DefaultURL)

// 正确做法：正确的连接处理
nc, err := nats.Connect(
    "nats://host1:4222,nats://host2:4222,nats://host3:4222",
    nats.MaxReconnects(-1), // 无限重连
    nats.ReconnectWait(2*time.Second),
    nats.ReconnectBufSize(8*1024*1024), // 重连期间8MB缓冲
    nats.DisconnectErrHandler(func(nc *nats.Conn, err error) {
        log.Printf("已断开: %v", err)
    }),
    nats.ReconnectHandler(func(nc *nats.Conn) {
        log.Printf("已重连到 %s", nc.ConnectedUrl())
    }),
    nats.ErrorHandler(func(nc *nats.Conn, sub *nats.Subscription, err error) {
        log.Printf("错误: %v", err)
    }),
)
```

### 消费者确认问题

**问题**：由于确认处理不当导致消息重复投递。

```go
// 错误做法：处理可能在确认后失败
for msg := range msgs.Messages() {
    msg.Ack() // 处理前确认
    process(msg) // 如果失败，消息已丢失
}

// 正确做法：成功处理后再确认
for msg := range msgs.Messages() {
    if err := process(msg); err != nil {
        msg.Nak() // 否定确认，触发重投递
        continue
    }
    msg.Ack() // 仅在成功时确认
}
```

## 性能考量

### 高吞吐量配置

**服务器配置**：
```yaml
# 高性能服务器设置
max_payload: 8MB
max_pending: 64MB
write_deadline: 10s

jetstream {
    max_mem: 8GB
    max_file: 1TB
    sync_interval: 60s  # 降低同步频率以提高吞吐量
}
```

**客户端优化（Go）**：
```go
nc, _ := nats.Connect(
    nats.DefaultURL,
    nats.MaxReconnects(-1),
    nats.ReconnectBufSize(64*1024*1024), // 64MB重连缓冲
    nats.PingInterval(20*time.Second),
    nats.MaxPingsOutstanding(5),
)

// 使用异步发布提高吞吐量
for i := 0; i < 1000000; i++ {
    nc.Publish("data", payload) // 发射后不管
}
nc.Flush() // 确保全部发送
```

### 延迟优化

**最小化网络跳数**：
```go
// 使用叶子节点进行边缘部署
// 叶子节点连接到集群，提供本地发布/订阅
```

**优化消息大小**：
```go
// 使用高效序列化
import "github.com/vmihailenco/msgpack/v5"

data, _ := msgpack.Marshal(event)
nc.Publish("events", data)
```

**连接池**：
```go
// 复用连接，不要每次请求创建
var nc *nats.Conn

func init() {
    nc, _ = nats.Connect(nats.DefaultURL)
}

func HandleRequest(w http.ResponseWriter, r *http.Request) {
    nc.Publish("requests", []byte(r.URL.Path))
}
```

### 基准测试

```bash
# NATS 基准测试工具
nats bench test --pub 4 --sub 4 --msgs 10000000 --size 256

# 现代硬件的预期结果：
# - 核心 NATS：10-20 百万消息/秒
# - JetStream（带确认）：10万-50万消息/秒
```

## 实战场景

### 微服务通信

```go
// 服务发现和请求路由
package main

import (
    "encoding/json"
    "log"
    "github.com/nats-io/nats.go"
)

type OrderService struct {
    nc *nats.Conn
}

func (s *OrderService) Start() {
    // 处理订单创建
    s.nc.QueueSubscribe("orders.create", "order-service", func(m *nats.Msg) {
        var order Order
        json.Unmarshal(m.Data, &order)

        // 处理订单
        order.ID = generateID()
        order.Status = "created"

        // 响应请求者
        response, _ := json.Marshal(order)
        m.Respond(response)

        // 发布事件给其他服务
        s.nc.Publish("events.order.created", response)
    })
}

// 客户端服务发起请求
func CreateOrder(nc *nats.Conn, items []Item) (*Order, error) {
    request, _ := json.Marshal(map[string]interface{}{
        "items": items,
    })

    msg, err := nc.Request("orders.create", request, 5*time.Second)
    if err != nil {
        return nil, err
    }

    var order Order
    json.Unmarshal(msg.Data, &order)
    return &order, nil
}
```

### IoT 数据采集

```python
import asyncio
import json
from nats.aio.client import Client as NATS

async def iot_gateway():
    nc = NATS()
    await nc.connect("nats://edge-server:4222")
    js = nc.jetstream()

    # 为传感器数据创建 stream
    await js.add_stream(
        name="SENSORS",
        subjects=["sensors.>"],
        max_age=86400 * 1000000000,  # 24小时
    )

    async def collect_sensor_data():
        while True:
            reading = {
                "device_id": "sensor-001",
                "temperature": read_temperature(),
                "humidity": read_humidity(),
                "timestamp": time.time()
            }

            await js.publish(
                f"sensors.{reading['device_id']}",
                json.dumps(reading).encode()
            )

            await asyncio.sleep(1)

    await collect_sensor_data()
```

### 边缘计算

```yaml
# 边缘部署的叶子节点配置
server_name: edge-node-1

leafnodes {
    remotes: [
        {
            url: "nats://cloud-cluster.example.com:7422"
            credentials: "/etc/nats/edge.creds"
        }
    ]
}

jetstream {
    store_dir: /data/jetstream
    max_mem: 1GB
    max_file: 50GB
}
```

```go
// 带本地缓存的边缘应用
func EdgeProcessor(nc *nats.Conn) {
    js, _ := jetstream.New(nc)

    // 用于离线操作的本地 stream
    js.CreateOrUpdateStream(context.Background(), jetstream.StreamConfig{
        Name:     "LOCAL_EVENTS",
        Subjects: []string{"local.>"},
        Storage:  jetstream.FileStorage,
    })

    // 本地处理，连接时同步到云端
    nc.Subscribe("sensors.>", func(m *nats.Msg) {
        // 本地存储
        js.Publish(context.Background(), "local."+m.Subject, m.Data)

        // 如果已连接则转发到云端
        if nc.IsConnected() {
            nc.Publish("cloud."+m.Subject, m.Data)
        }
    })
}
```

## 面试要点

### 概念性问题

**问：NATS 如何实现比其他消息系统更低的延迟？**

答：NATS 通过以下设计选择实现亚毫秒级延迟：
1. 简单的文本协议，最小化解析开销
2. 默认最多一次投递（无持久化开销）
3. 直接 TCP 连接，无中间持久化
4. Go 语言高效的 goroutine 连接处理
5. 尽可能实现零拷贝消息转发

**问：解释最多一次、至少一次和精确一次投递的区别。**

答：
- **最多一次**（核心 NATS）：消息投递 0 或 1 次。快速但可能丢失消息。
- **至少一次**（JetStream 默认）：消息投递 1 次以上。需要确认和重投递逻辑。
- **精确一次**（JetStream 带去重）：消息精确投递 1 次。需要消息去重和幂等消费者。

**问：什么时候选择 NATS 而不是 Kafka？**

答：选择 NATS 当：
- 需要亚毫秒级延迟
- 请求/响应模式很常见
- 运维简单性很重要
- 进行边缘计算或物联网
- 内存占用很重要

选择 Kafka 当：
- 需要无限消息保留
- 事件溯源是核心模式
- 需要跨分区的强顺序保证
- 构建需要重放的数据管道

### 技术性问题

**问：队列组与 Kafka 消费者组有何不同？**

答：关键区别：
- NATS 队列组随机分发消息；Kafka 按键分区消息
- NATS 不需要预分区；Kafka 需要分区配置
- NATS 队列组适用于任何主题；Kafka 组绑定到主题分区
- NATS 核心订阅没有偏移量跟踪；Kafka 维护消费者偏移量

**问：解释 JetStream stream 的保留策略。**

答：三种保留策略：
- **Limits**：保留消息直到达到限制（max_msgs、max_bytes、max_age）
- **Interest**：仅在有活跃消费者时保留消息
- **WorkQueue**：确认后立即删除消息（队列语义）

**问：如何使用 NATS 实现精确一次处理？**

答：结合以下策略：
1. 在 stream 上启用消息去重，设置 `Duplicates` 窗口
2. 使用显式确认
3. 使用消息 ID 实现幂等消息处理器
4. 对多步操作使用事务或 saga 模式

## 延伸阅读

### 官方资源

- [NATS 文档](https://docs.nats.io/) - 全面的官方文档
- [NATS GitHub 仓库](https://github.com/nats-io/nats-server) - 服务器源代码和问题
- [NATS By Example](https://natsbyexample.com/) - 多语言交互示例
- [NATS 客户端](https://github.com/nats-io) - Go、Python、JavaScript 等官方客户端库

### 社区资源

- [NATS Slack 社区](https://slack.nats.io/) - 活跃的问题和讨论社区
- [Synadia 博客](https://www.synadia.com/blog) - NATS 维护者的技术文章
- [CNCF NATS 项目](https://www.cncf.io/projects/nats/) - 云原生计算基金会项目页面

### 书籍和教程

- "Practical NATS" by Waldemar Quevedo - 深入了解 NATS 内部原理
- [Kubernetes Native Microservices with NATS](https://nats.io/blog/) - 集成指南

NATS 为现代分布式系统提供了强大、简洁且高性能的基础。通过理解其核心概念并遵循最佳实践，您可以构建从边缘设备到全球云部署的弹性消息架构。
