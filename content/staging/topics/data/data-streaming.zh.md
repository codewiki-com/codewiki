---
title: 实时数据流处理
description: 了解实时数据流处理架构和模式
track: data
section: data-engineering
difficulty: advanced
tags:
  - 流处理
  - Kafka
  - 实时数据
  - 事件驱动
status: imported
origin: old/src/content/docs/data/data-streaming.zh.md
divergence: 0.13
issues: []
legacy:
  category: Data
  subcategory: Streaming
  order: 25
  lastUpdated: 2026-01-07
---

在当今数据驱动的世界中，企业越来越需要实时处理和分析数据。传统的批处理模式虽然在某些场景下仍然有效，但无法满足对即时洞察的需求。实时数据流处理已成为现代数据架构的核心组件，本文将深入探讨流处理的概念、架构模式、技术生态和最佳实践。

## 流处理 vs 批处理

### 基本概念对比

```
批处理（Batch Processing）
┌─────────────────────────────────────────────────────────────┐
│  数据累积  ──▶  定期处理  ──▶  结果输出                      │
│                                                             │
│  [数据1][数据2][数据3]...[数据N]  ──▶  [批量处理]  ──▶  结果  │
│                                                             │
│  特点：高吞吐量、高延迟、资源利用率高                         │
└─────────────────────────────────────────────────────────────┘

流处理（Stream Processing）
┌─────────────────────────────────────────────────────────────┐
│  数据到达  ──▶  即时处理  ──▶  结果输出                      │
│                                                             │
│  数据1 ──▶ 处理 ──▶ 结果1                                   │
│  数据2 ──▶ 处理 ──▶ 结果2                                   │
│  数据3 ──▶ 处理 ──▶ 结果3                                   │
│                                                             │
│  特点：低延迟、持续处理、实时响应                            │
└─────────────────────────────────────────────────────────────┘
```

### 详细对比

| 维度 | 批处理 | 流处理 |
|------|--------|--------|
| 数据处理方式 | 有界数据集，一次性处理 | 无界数据流，持续处理 |
| 延迟 | 分钟到小时级 | 毫秒到秒级 |
| 吞吐量 | 非常高 | 高（但需要优化） |
| 容错机制 | 重新处理整个批次 | 检查点和精确一次语义 |
| 资源使用 | 周期性高峰 | 持续稳定 |
| 复杂度 | 相对简单 | 需要处理时间、状态、乱序等问题 |
| 典型场景 | 日报表、月度汇总、历史分析 | 实时监控、欺诈检测、推荐系统 |
| 代表技术 | Hadoop MapReduce, Spark Batch | Kafka Streams, Flink, Spark Streaming |

### 处理模式选择

```python
def choose_processing_mode(requirements):
    """
    选择数据处理模式的决策逻辑
    """
    # 延迟要求
    if requirements.latency < "1 second":
        return "真实时流处理 (True Streaming)"
    elif requirements.latency < "1 minute":
        return "微批处理 (Micro-batch)"
    elif requirements.latency < "1 hour":
        return "近实时批处理 (Near Real-time Batch)"
    else:
        return "传统批处理 (Batch Processing)"

# 常见场景映射
scenarios = {
    "欺诈检测": "真实时流处理",      # 毫秒级响应
    "实时推荐": "真实时流处理",      # 用户体验要求
    "实时仪表板": "微批处理",        # 秒级刷新
    "日报表生成": "传统批处理",      # 每日运行
    "历史数据分析": "传统批处理",    # 无实时要求
    "IoT 设备监控": "真实时流处理",  # 即时告警
}
```

### Lambda 架构与 Kappa 架构

#### Lambda 架构

Lambda 架构结合了批处理和流处理的优势：

```
                    ┌─────────────────────────────────┐
                    │         数据源（Data Source）    │
                    └─────────────────┬───────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
     │    批处理层      │     │    速度层       │     │    服务层       │
     │  (Batch Layer)  │     │ (Speed Layer)  │     │ (Serving Layer) │
     │                 │     │                 │     │                 │
     │  Hadoop/Spark   │     │  Storm/Flink   │     │   查询服务      │
     │  完整历史数据    │     │  增量实时数据   │     │   合并视图      │
     └────────┬────────┘     └────────┬────────┘     └────────┬────────┘
              │                       │                       │
              └───────────────────────┴───────────────────────┘
                                      │
                              ┌───────▼───────┐
                              │   最终结果    │
                              │  批视图+实时视图 │
                              └───────────────┘
```

**Lambda 架构优缺点**：

```python
lambda_architecture = {
    "优点": [
        "容错性强 - 批处理层可以重新计算",
        "处理延迟数据 - 批处理层可以修正",
        "高吞吐量和低延迟兼顾"
    ],
    "缺点": [
        "维护两套代码逻辑（批处理+流处理）",
        "系统复杂度高",
        "数据一致性难以保证",
        "开发和运维成本高"
    ]
}
```

#### Kappa 架构

Kappa 架构简化了 Lambda 架构，只使用流处理：

```
                    ┌─────────────────────────────────┐
                    │         数据源（Data Source）    │
                    └─────────────────┬───────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────┐
                    │     消息队列（如 Kafka）         │
                    │     保留完整历史数据             │
                    └─────────────────┬───────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────┐
                    │         流处理层                 │
                    │    (Stream Processing Layer)    │
                    │                                 │
                    │    统一的流处理逻辑              │
                    └─────────────────┬───────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────┐
                    │         服务层                   │
                    │     (Serving Layer)             │
                    └─────────────────────────────────┘
```

**Kappa 架构优缺点**：

```python
kappa_architecture = {
    "优点": [
        "单一代码库 - 降低维护成本",
        "架构简单清晰",
        "重新处理只需重放消息",
        "更容易保证数据一致性"
    ],
    "缺点": [
        "需要消息队列支持长期存储",
        "历史数据重处理可能较慢",
        "不适合极其复杂的批处理逻辑"
    ]
}
```

---

## 事件驱动架构

### 事件驱动架构概述

事件驱动架构（Event-Driven Architecture, EDA）是一种设计模式，系统组件通过事件进行通信和协作。

```
┌─────────────────────────────────────────────────────────────────────┐
│                        事件驱动架构                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    事件     ┌──────────────┐    事件    ┌──────────┐ │
│  │ 事件生产者 │ ─────────▶ │   事件通道    │ ─────────▶│ 事件消费者│ │
│  │ (Producer)│            │ (Event Bus)  │           │(Consumer)│ │
│  └──────────┘             └──────────────┘           └──────────┘ │
│                                  │                                 │
│                                  ▼                                 │
│                           ┌──────────────┐                        │
│                           │   事件存储    │                        │
│                           │(Event Store) │                        │
│                           └──────────────┘                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 核心概念

#### 事件（Event）

```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any
import uuid

@dataclass
class Event:
    """事件基类"""
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str = ""
    timestamp: datetime = field(default_factory=datetime.now)
    source: str = ""
    data: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "timestamp": self.timestamp.isoformat(),
            "source": self.source,
            "data": self.data,
            "metadata": self.metadata
        }

# 具体事件示例
@dataclass
class OrderCreatedEvent(Event):
    event_type: str = "order.created"

    def __post_init__(self):
        self.source = "order-service"

# 使用示例
order_event = OrderCreatedEvent(
    data={
        "order_id": "ORD-12345",
        "customer_id": "CUST-001",
        "items": [
            {"product_id": "PROD-A", "quantity": 2, "price": 99.99},
            {"product_id": "PROD-B", "quantity": 1, "price": 149.99}
        ],
        "total_amount": 349.97
    },
    metadata={
        "correlation_id": "sess-abc123",
        "user_agent": "Mozilla/5.0..."
    }
)
```

#### 事件通道模式

```python
from abc import ABC, abstractmethod
from typing import Callable, List
import asyncio

class EventChannel(ABC):
    """事件通道抽象基类"""

    @abstractmethod
    async def publish(self, event: Event) -> None:
        """发布事件"""
        pass

    @abstractmethod
    async def subscribe(self, event_type: str, handler: Callable) -> None:
        """订阅事件"""
        pass

class InMemoryEventChannel(EventChannel):
    """内存事件通道（用于演示）"""

    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}
        self._event_store: List[Event] = []

    async def publish(self, event: Event) -> None:
        # 存储事件
        self._event_store.append(event)

        # 通知订阅者
        handlers = self._subscribers.get(event.event_type, [])
        for handler in handlers:
            await handler(event)

    async def subscribe(self, event_type: str, handler: Callable) -> None:
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)

# 使用示例
async def order_notification_handler(event: Event):
    print(f"发送订单通知: {event.data['order_id']}")

async def inventory_update_handler(event: Event):
    print(f"更新库存: {event.data['items']}")

async def main():
    channel = InMemoryEventChannel()

    # 订阅事件
    await channel.subscribe("order.created", order_notification_handler)
    await channel.subscribe("order.created", inventory_update_handler)

    # 发布事件
    await channel.publish(order_event)
```

#### 事件溯源（Event Sourcing）

```python
from typing import List, Optional
from abc import ABC, abstractmethod

class EventStore:
    """事件存储"""

    def __init__(self):
        self._events: Dict[str, List[Event]] = {}

    def append(self, aggregate_id: str, event: Event) -> None:
        """追加事件到聚合"""
        if aggregate_id not in self._events:
            self._events[aggregate_id] = []
        self._events[aggregate_id].append(event)

    def get_events(self, aggregate_id: str) -> List[Event]:
        """获取聚合的所有事件"""
        return self._events.get(aggregate_id, [])

class Aggregate(ABC):
    """聚合根基类"""

    def __init__(self, aggregate_id: str):
        self.aggregate_id = aggregate_id
        self._uncommitted_events: List[Event] = []

    @abstractmethod
    def apply(self, event: Event) -> None:
        """应用事件到当前状态"""
        pass

    def load_from_history(self, events: List[Event]) -> None:
        """从历史事件重建状态"""
        for event in events:
            self.apply(event)

    def raise_event(self, event: Event) -> None:
        """触发新事件"""
        self._uncommitted_events.append(event)
        self.apply(event)

    def get_uncommitted_events(self) -> List[Event]:
        """获取未提交的事件"""
        return self._uncommitted_events.copy()

    def mark_events_as_committed(self) -> None:
        """标记事件已提交"""
        self._uncommitted_events.clear()

# 订单聚合示例
class Order(Aggregate):
    def __init__(self, order_id: str):
        super().__init__(order_id)
        self.status = "pending"
        self.items = []
        self.total_amount = 0

    def apply(self, event: Event) -> None:
        if event.event_type == "order.created":
            self.items = event.data["items"]
            self.total_amount = event.data["total_amount"]
            self.status = "created"
        elif event.event_type == "order.confirmed":
            self.status = "confirmed"
        elif event.event_type == "order.shipped":
            self.status = "shipped"
        elif event.event_type == "order.cancelled":
            self.status = "cancelled"

    def create(self, items: List[Dict], total_amount: float) -> None:
        event = OrderCreatedEvent(data={
            "order_id": self.aggregate_id,
            "items": items,
            "total_amount": total_amount
        })
        self.raise_event(event)

    def confirm(self) -> None:
        if self.status != "created":
            raise ValueError("只有已创建的订单可以确认")
        event = Event(
            event_type="order.confirmed",
            data={"order_id": self.aggregate_id}
        )
        self.raise_event(event)
```

### CQRS 模式

命令查询职责分离（Command Query Responsibility Segregation）：

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CQRS 架构                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│         命令端（Write Side）          查询端（Read Side）            │
│  ┌─────────────────────────────┐   ┌─────────────────────────────┐ │
│  │                             │   │                             │ │
│  │  ┌────────┐   ┌──────────┐ │   │  ┌──────────┐  ┌─────────┐ │ │
│  │  │ Command│──▶│ Aggregate │ │   │  │  Query   │◀─│Read Model│ │ │
│  │  │Handler │   │          │ │   │  │ Handler  │  │         │ │ │
│  │  └────────┘   └─────┬────┘ │   │  └──────────┘  └────▲────┘ │ │
│  │                     │      │   │                     │      │ │
│  │                     ▼      │   │                     │      │ │
│  │              ┌──────────┐  │   │              ┌──────┴────┐ │ │
│  │              │Event Store│──────────────────▶│ Projector  │ │ │
│  │              └──────────┘  │   │              └───────────┘ │ │
│  │                            │   │                            │ │
│  └─────────────────────────────┘   └─────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

```python
from typing import Any, Dict

# 命令处理
class CreateOrderCommand:
    def __init__(self, customer_id: str, items: List[Dict]):
        self.customer_id = customer_id
        self.items = items

class OrderCommandHandler:
    def __init__(self, event_store: EventStore):
        self.event_store = event_store

    def handle_create_order(self, command: CreateOrderCommand) -> str:
        order_id = str(uuid.uuid4())
        order = Order(order_id)

        total = sum(item["quantity"] * item["price"] for item in command.items)
        order.create(command.items, total)

        # 持久化事件
        for event in order.get_uncommitted_events():
            self.event_store.append(order_id, event)

        order.mark_events_as_committed()
        return order_id

# 查询处理 - 读模型
class OrderReadModel:
    """订单读模型 - 针对查询优化"""

    def __init__(self):
        self._orders: Dict[str, Dict[str, Any]] = {}

    def apply_event(self, event: Event) -> None:
        """投影事件到读模型"""
        if event.event_type == "order.created":
            self._orders[event.data["order_id"]] = {
                "order_id": event.data["order_id"],
                "items": event.data["items"],
                "total_amount": event.data["total_amount"],
                "status": "created",
                "created_at": event.timestamp
            }
        elif event.event_type == "order.confirmed":
            order_id = event.data["order_id"]
            if order_id in self._orders:
                self._orders[order_id]["status"] = "confirmed"
                self._orders[order_id]["confirmed_at"] = event.timestamp

    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        return self._orders.get(order_id)

    def get_orders_by_status(self, status: str) -> List[Dict[str, Any]]:
        return [o for o in self._orders.values() if o["status"] == status]
```

---

## Kafka 生态系统

### Apache Kafka 概述

Apache Kafka 是一个分布式流处理平台，提供高吞吐量、低延迟的消息传递。

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Kafka 集群架构                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  生产者集群                    Kafka 集群                 消费者集群  │
│  ┌─────────┐               ┌───────────────┐           ┌─────────┐ │
│  │Producer1│──┐            │   Broker 1    │      ┌────│Consumer1│ │
│  └─────────┘  │            │  ┌─────────┐  │      │    └─────────┘ │
│  ┌─────────┐  │            │  │Partition│  │      │    ┌─────────┐ │
│  │Producer2│──┼───────────▶│  │   0     │──┼──────┼────│Consumer2│ │
│  └─────────┘  │            │  └─────────┘  │      │    └─────────┘ │
│  ┌─────────┐  │            └───────────────┘      │    ┌─────────┐ │
│  │Producer3│──┘            ┌───────────────┐      └────│Consumer3│ │
│  └─────────┘               │   Broker 2    │           └─────────┘ │
│                            │  ┌─────────┐  │                       │
│                            │  │Partition│  │                       │
│       ZooKeeper /          │  │   1     │  │          消费者组     │
│       KRaft                │  └─────────┘  │         (Consumer     │
│  ┌───────────────┐         └───────────────┘          Group)       │
│  │ 集群元数据管理  │         ┌───────────────┐                      │
│  │ Leader 选举    │         │   Broker 3    │                      │
│  │ 配置管理       │         │  ┌─────────┐  │                      │
│  └───────────────┘         │  │Partition│  │                      │
│                            │  │   2     │  │                      │
│                            │  └─────────┘  │                      │
│                            └───────────────┘                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Kafka 核心概念

#### Topic 和 Partition

```python
from confluent_kafka.admin import AdminClient, NewTopic

# 创建 Topic
def create_topic(bootstrap_servers: str, topic_name: str,
                 num_partitions: int = 3, replication_factor: int = 3):
    """创建 Kafka Topic"""
    admin_client = AdminClient({
        'bootstrap.servers': bootstrap_servers
    })

    topic = NewTopic(
        topic_name,
        num_partitions=num_partitions,
        replication_factor=replication_factor,
        config={
            'retention.ms': str(7 * 24 * 60 * 60 * 1000),  # 7 天
            'cleanup.policy': 'delete',
            'min.insync.replicas': '2'
        }
    )

    futures = admin_client.create_topics([topic])
    for topic_name, future in futures.items():
        try:
            future.result()
            print(f"Topic {topic_name} 创建成功")
        except Exception as e:
            print(f"Topic {topic_name} 创建失败: {e}")

# Partition 分配策略
"""
Partition 分配策略：

1. 指定 Key：hash(key) % num_partitions
   - 相同 Key 总是进入同一分区
   - 保证消息顺序性

2. Round Robin：轮询分配
   - 无 Key 时默认行为
   - 均匀分布

3. 自定义 Partitioner
"""

class OrderPartitioner:
    """自定义订单分区器"""

    def __init__(self, num_partitions: int):
        self.num_partitions = num_partitions

    def partition(self, key: str, value: Any) -> int:
        """
        根据订单类型分区:
        - 普通订单: 分区 0-5
        - VIP 订单: 分区 6-9 (优先处理)
        """
        if "vip" in value.get("customer_type", "").lower():
            # VIP 订单使用后面的分区
            vip_partitions = range(6, 10)
            return vip_partitions[hash(key) % len(vip_partitions)]
        else:
            # 普通订单使用前面的分区
            normal_partitions = range(0, 6)
            return normal_partitions[hash(key) % len(normal_partitions)]
```

#### Producer 和 Consumer

```python
from confluent_kafka import Producer, Consumer, KafkaError
import json

# Producer 配置和使用
class KafkaProducerWrapper:
    """Kafka 生产者封装"""

    def __init__(self, bootstrap_servers: str):
        self.producer = Producer({
            'bootstrap.servers': bootstrap_servers,
            'acks': 'all',                    # 等待所有副本确认
            'retries': 3,                     # 重试次数
            'retry.backoff.ms': 100,          # 重试间隔
            'enable.idempotence': True,       # 启用幂等性
            'max.in.flight.requests.per.connection': 5,
            'compression.type': 'snappy',     # 压缩类型
            'linger.ms': 5,                   # 批量发送延迟
            'batch.size': 16384               # 批量大小
        })

    def send(self, topic: str, key: str, value: Dict[str, Any],
             callback: Callable = None) -> None:
        """发送消息"""
        try:
            self.producer.produce(
                topic=topic,
                key=key.encode('utf-8'),
                value=json.dumps(value).encode('utf-8'),
                callback=callback or self._delivery_report
            )
            self.producer.poll(0)  # 触发回调
        except Exception as e:
            print(f"发送消息失败: {e}")
            raise

    def _delivery_report(self, err, msg):
        """投递报告回调"""
        if err is not None:
            print(f"消息投递失败: {err}")
        else:
            print(f"消息已投递到 {msg.topic()} [{msg.partition()}]")

    def flush(self, timeout: float = 10.0):
        """刷新缓冲区"""
        self.producer.flush(timeout)

# Consumer 配置和使用
class KafkaConsumerWrapper:
    """Kafka 消费者封装"""

    def __init__(self, bootstrap_servers: str, group_id: str,
                 topics: List[str], auto_offset_reset: str = 'earliest'):
        self.consumer = Consumer({
            'bootstrap.servers': bootstrap_servers,
            'group.id': group_id,
            'auto.offset.reset': auto_offset_reset,
            'enable.auto.commit': False,      # 手动提交偏移量
            'max.poll.interval.ms': 300000,   # 最大轮询间隔
            'session.timeout.ms': 45000,      # 会话超时
            'heartbeat.interval.ms': 15000,   # 心跳间隔
            'fetch.min.bytes': 1,
            'fetch.max.wait.ms': 500
        })
        self.consumer.subscribe(topics)
        self.running = True

    def consume(self, handler: Callable[[Dict[str, Any]], bool],
                batch_size: int = 100) -> None:
        """消费消息"""
        while self.running:
            try:
                msg = self.consumer.poll(timeout=1.0)

                if msg is None:
                    continue

                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        print(f"消费错误: {msg.error()}")
                        continue

                # 解析消息
                value = json.loads(msg.value().decode('utf-8'))

                # 处理消息
                success = handler(value)

                if success:
                    # 手动提交偏移量
                    self.consumer.commit(asynchronous=False)
                else:
                    # 处理失败，不提交偏移量，消息将被重新消费
                    print(f"消息处理失败，将重试")

            except Exception as e:
                print(f"消费异常: {e}")

    def stop(self):
        """停止消费"""
        self.running = False
        self.consumer.close()

# 使用示例
def process_order(order: Dict[str, Any]) -> bool:
    try:
        print(f"处理订单: {order['order_id']}")
        # 业务逻辑处理
        return True
    except Exception as e:
        print(f"订单处理失败: {e}")
        return False

# 生产者
producer = KafkaProducerWrapper("localhost:9092")
producer.send(
    topic="orders",
    key="order-123",
    value={"order_id": "123", "customer_id": "cust-001", "amount": 99.99}
)
producer.flush()

# 消费者
consumer = KafkaConsumerWrapper(
    bootstrap_servers="localhost:9092",
    group_id="order-processor",
    topics=["orders"]
)
consumer.consume(process_order)
```

### Kafka Streams

Kafka Streams 是一个用于构建流处理应用的客户端库：

```java
// Java 示例 - Kafka Streams API
import org.apache.kafka.streams.*;
import org.apache.kafka.streams.kstream.*;
import org.apache.kafka.common.serialization.Serdes;

public class OrderStreamProcessor {

    public static void main(String[] args) {
        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "order-stream-processor");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);

        StreamsBuilder builder = new StreamsBuilder();

        // 读取订单流
        KStream<String, String> orders = builder.stream("orders");

        // 过滤高价值订单
        KStream<String, String> highValueOrders = orders
            .filter((key, value) -> {
                Order order = parseOrder(value);
                return order.getAmount() > 1000;
            });

        // 按客户分组并聚合
        KTable<String, Long> orderCountByCustomer = orders
            .groupBy((key, value) -> parseOrder(value).getCustomerId())
            .count();

        // 订单金额统计（滑动窗口）
        KTable<Windowed<String>, Double> hourlyRevenue = orders
            .groupBy((key, value) -> "all")
            .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofHours(1)))
            .aggregate(
                () -> 0.0,
                (key, value, aggregate) -> aggregate + parseOrder(value).getAmount(),
                Materialized.with(Serdes.String(), Serdes.Double())
            );

        // 输出结果
        highValueOrders.to("high-value-orders");
        orderCountByCustomer.toStream().to("order-count-by-customer");

        KafkaStreams streams = new KafkaStreams(builder.build(), props);
        streams.start();

        Runtime.getRuntime().addShutdownHook(new Thread(streams::close));
    }
}
```

```python
# Python 示例 - 使用 Faust 库实现类似 Kafka Streams 的功能
import faust
from typing import Optional

# 创建 Faust 应用
app = faust.App(
    'order-stream-processor',
    broker='kafka://localhost:9092',
    store='rocksdb://',
    processing_guarantee='exactly_once'
)

# 定义数据模型
class Order(faust.Record):
    order_id: str
    customer_id: str
    amount: float
    status: str

# 定义 Topic
orders_topic = app.topic('orders', value_type=Order)
high_value_orders_topic = app.topic('high-value-orders', value_type=Order)

# 定义状态表
order_count_table = app.Table(
    'order-count-by-customer',
    default=int,
    partitions=8
)

# 流处理 Agent
@app.agent(orders_topic)
async def process_orders(orders):
    """处理订单流"""
    async for order in orders:
        # 更新客户订单计数
        order_count_table[order.customer_id] += 1

        # 过滤高价值订单
        if order.amount > 1000:
            await high_value_orders_topic.send(value=order)

        print(f"处理订单 {order.order_id}, "
              f"客户 {order.customer_id} 总订单数: {order_count_table[order.customer_id]}")

# 窗口聚合
class HourlyStats(faust.Record):
    total_amount: float = 0.0
    order_count: int = 0

hourly_stats_table = app.Table(
    'hourly-stats',
    default=HourlyStats,
    partitions=1
).tumbling(3600.0)  # 1小时滚动窗口

@app.agent(orders_topic)
async def aggregate_hourly(orders):
    """每小时聚合统计"""
    async for order in orders:
        stats = hourly_stats_table['global']
        stats.total_amount += order.amount
        stats.order_count += 1
        hourly_stats_table['global'] = stats

# 启动应用
if __name__ == '__main__':
    app.main()
```

### Kafka Connect

Kafka Connect 用于连接外部系统：

```json
// Source Connector 配置示例 - MySQL CDC
{
  "name": "mysql-source-connector",
  "config": {
    "connector.class": "io.debezium.connector.mysql.MySqlConnector",
    "database.hostname": "mysql-server",
    "database.port": "3306",
    "database.user": "debezium",
    "database.password": "dbz",
    "database.server.id": "184054",
    "database.server.name": "dbserver1",
    "database.include.list": "inventory",
    "database.history.kafka.bootstrap.servers": "kafka:9092",
    "database.history.kafka.topic": "schema-changes.inventory",
    "include.schema.changes": "true",
    "transforms": "route",
    "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
    "transforms.route.regex": "([^.]+)\\.([^.]+)\\.([^.]+)",
    "transforms.route.replacement": "$3"
  }
}
```

```json
// Sink Connector 配置示例 - Elasticsearch
{
  "name": "elasticsearch-sink-connector",
  "config": {
    "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
    "connection.url": "http://elasticsearch:9200",
    "topics": "orders,customers",
    "type.name": "_doc",
    "key.ignore": "true",
    "schema.ignore": "true",
    "behavior.on.malformed.documents": "warn",
    "write.method": "upsert",
    "batch.size": 2000,
    "max.buffered.records": 20000,
    "linger.ms": 1000
  }
}
```

---

## 流处理模式

### 窗口操作

流处理中的窗口用于对无界数据流进行有界的聚合操作：

```
┌─────────────────────────────────────────────────────────────────────┐
│                        窗口类型                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  滚动窗口 (Tumbling Window)                                         │
│  ┌────────┐┌────────┐┌────────┐┌────────┐                          │
│  │Window 1││Window 2││Window 3││Window 4│                          │
│  │ 0-10s  ││ 10-20s ││ 20-30s ││ 30-40s │                          │
│  └────────┘└────────┘└────────┘└────────┘                          │
│  ──────────────────────────────────────────▶ 时间                   │
│  特点：固定大小，不重叠                                              │
│                                                                     │
│  滑动窗口 (Sliding Window)                                          │
│  ┌──────────────┐                                                   │
│  │   Window 1   │                                                   │
│  └──────────────┘                                                   │
│       ┌──────────────┐                                              │
│       │   Window 2   │                                              │
│       └──────────────┘                                              │
│            ┌──────────────┐                                         │
│            │   Window 3   │                                         │
│            └──────────────┘                                         │
│  ──────────────────────────────────────────▶ 时间                   │
│  特点：固定大小，按滑动步长重叠                                       │
│                                                                     │
│  会话窗口 (Session Window)                                          │
│  ┌────────┐        ┌──────────────┐    ┌────┐                      │
│  │Session1│  gap   │   Session2   │gap │S3  │                      │
│  └────────┘        └──────────────┘    └────┘                      │
│  ──────────────────────────────────────────▶ 时间                   │
│  特点：基于活动间隙动态确定窗口                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

```python
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict
from dataclasses import dataclass

@dataclass
class WindowedEvent:
    """带窗口信息的事件"""
    timestamp: datetime
    key: str
    value: Any
    window_start: Optional[datetime] = None
    window_end: Optional[datetime] = None

class TumblingWindow:
    """滚动窗口实现"""

    def __init__(self, window_size: timedelta):
        self.window_size = window_size
        self.windows: Dict[datetime, List[WindowedEvent]] = defaultdict(list)

    def get_window_start(self, timestamp: datetime) -> datetime:
        """计算事件所属窗口的起始时间"""
        epoch = datetime(1970, 1, 1)
        elapsed = timestamp - epoch
        window_number = int(elapsed.total_seconds() // self.window_size.total_seconds())
        return epoch + timedelta(seconds=window_number * self.window_size.total_seconds())

    def add_event(self, event: WindowedEvent) -> None:
        """添加事件到对应窗口"""
        window_start = self.get_window_start(event.timestamp)
        event.window_start = window_start
        event.window_end = window_start + self.window_size
        self.windows[window_start].append(event)

    def get_window_result(self, window_start: datetime) -> List[WindowedEvent]:
        """获取窗口结果"""
        return self.windows.get(window_start, [])

class SlidingWindow:
    """滑动窗口实现"""

    def __init__(self, window_size: timedelta, slide_interval: timedelta):
        self.window_size = window_size
        self.slide_interval = slide_interval
        self.events: List[WindowedEvent] = []

    def add_event(self, event: WindowedEvent) -> None:
        """添加事件"""
        self.events.append(event)
        # 保持事件按时间排序
        self.events.sort(key=lambda e: e.timestamp)

    def get_windows_for_event(self, event: WindowedEvent) -> List[tuple]:
        """获取事件所属的所有窗口"""
        windows = []
        # 计算事件可能属于的窗口
        earliest_window_start = event.timestamp - self.window_size + self.slide_interval
        current_window = self.align_to_slide(earliest_window_start)

        while current_window <= event.timestamp:
            window_end = current_window + self.window_size
            if current_window <= event.timestamp < window_end:
                windows.append((current_window, window_end))
            current_window += self.slide_interval

        return windows

    def align_to_slide(self, timestamp: datetime) -> datetime:
        """对齐到滑动间隔"""
        epoch = datetime(1970, 1, 1)
        elapsed = timestamp - epoch
        slide_number = int(elapsed.total_seconds() // self.slide_interval.total_seconds())
        return epoch + timedelta(seconds=slide_number * self.slide_interval.total_seconds())

class SessionWindow:
    """会话窗口实现"""

    def __init__(self, gap: timedelta):
        self.gap = gap
        self.sessions: Dict[str, List[WindowedEvent]] = defaultdict(list)

    def add_event(self, event: WindowedEvent) -> None:
        """添加事件到会话"""
        key = event.key
        session = self.sessions[key]

        if not session:
            session.append(event)
        else:
            last_event = session[-1]
            if event.timestamp - last_event.timestamp <= self.gap:
                # 在同一会话内
                session.append(event)
            else:
                # 开始新会话
                self._close_session(key)
                self.sessions[key] = [event]

    def _close_session(self, key: str) -> List[WindowedEvent]:
        """关闭并返回会话"""
        session = self.sessions.pop(key, [])
        if session:
            # 设置窗口边界
            window_start = session[0].timestamp
            window_end = session[-1].timestamp
            for event in session:
                event.window_start = window_start
                event.window_end = window_end
        return session

# 使用示例
def window_aggregation_example():
    # 创建滚动窗口 (5秒)
    tumbling = TumblingWindow(timedelta(seconds=5))

    # 模拟事件流
    events = [
        WindowedEvent(datetime.now(), "user1", {"action": "click"}),
        WindowedEvent(datetime.now() + timedelta(seconds=2), "user1", {"action": "view"}),
        WindowedEvent(datetime.now() + timedelta(seconds=6), "user1", {"action": "purchase"}),
    ]

    for event in events:
        tumbling.add_event(event)

    # 聚合窗口结果
    for window_start, window_events in tumbling.windows.items():
        count = len(window_events)
        print(f"窗口 {window_start}: {count} 个事件")
```

### 状态管理

流处理中的状态管理是核心挑战之一：

```python
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional
import json

K = TypeVar('K')
V = TypeVar('V')

class StateStore(ABC, Generic[K, V]):
    """状态存储抽象基类"""

    @abstractmethod
    def get(self, key: K) -> Optional[V]:
        pass

    @abstractmethod
    def put(self, key: K, value: V) -> None:
        pass

    @abstractmethod
    def delete(self, key: K) -> None:
        pass

    @abstractmethod
    def all(self) -> Dict[K, V]:
        pass

class InMemoryStateStore(StateStore[K, V]):
    """内存状态存储"""

    def __init__(self):
        self._store: Dict[K, V] = {}

    def get(self, key: K) -> Optional[V]:
        return self._store.get(key)

    def put(self, key: K, value: V) -> None:
        self._store[key] = value

    def delete(self, key: K) -> None:
        self._store.pop(key, None)

    def all(self) -> Dict[K, V]:
        return self._store.copy()

class FileBasedStateStore(StateStore[str, Any]):
    """基于文件的持久化状态存储（使用 JSON 序列化）"""

    def __init__(self, file_path: str):
        self.file_path = file_path
        self._cache: Dict[str, Any] = {}
        self._load()

    def _load(self) -> None:
        """从文件加载状态"""
        try:
            with open(self.file_path, 'r') as f:
                self._cache = json.load(f)
        except FileNotFoundError:
            self._cache = {}

    def _save(self) -> None:
        """保存状态到文件"""
        with open(self.file_path, 'w') as f:
            json.dump(self._cache, f)

    def get(self, key: str) -> Optional[Any]:
        return self._cache.get(key)

    def put(self, key: str, value: Any) -> None:
        self._cache[key] = value
        self._save()

    def delete(self, key: str) -> None:
        self._cache.pop(key, None)
        self._save()

    def all(self) -> Dict[str, Any]:
        return self._cache.copy()

# 有状态的流处理器
class StatefulStreamProcessor:
    """有状态的流处理器"""

    def __init__(self, state_store: StateStore):
        self.state_store = state_store
        self.checkpoint_interval = 1000  # 每1000条消息检查点
        self.processed_count = 0

    def process(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """处理事件并维护状态"""
        key = event.get("key")
        value = event.get("value")

        # 获取当前状态
        current_state = self.state_store.get(key) or {
            "count": 0,
            "total": 0,
            "last_seen": None
        }

        # 更新状态
        current_state["count"] += 1
        current_state["total"] += value.get("amount", 0)
        current_state["last_seen"] = datetime.now().isoformat()

        # 保存状态
        self.state_store.put(key, current_state)

        self.processed_count += 1

        # 定期检查点
        if self.processed_count % self.checkpoint_interval == 0:
            self._checkpoint()

        return {
            "key": key,
            "state": current_state
        }

    def _checkpoint(self):
        """创建检查点"""
        print(f"创建检查点，已处理 {self.processed_count} 条消息")
        # 实际实现中会持久化检查点信息
```

### Join 操作

流与流、流与表的 Join 操作：

```python
from typing import Callable, Optional, Tuple
from collections import defaultdict
from datetime import datetime, timedelta

class StreamStreamJoin:
    """流-流 Join"""

    def __init__(self, join_window: timedelta):
        self.join_window = join_window
        self.left_buffer: Dict[str, List[Tuple[datetime, Any]]] = defaultdict(list)
        self.right_buffer: Dict[str, List[Tuple[datetime, Any]]] = defaultdict(list)

    def add_left(self, key: str, value: Any, timestamp: datetime) -> List[Dict]:
        """添加左流事件"""
        self.left_buffer[key].append((timestamp, value))
        self._cleanup(key, timestamp)
        return self._match(key, value, timestamp, "left")

    def add_right(self, key: str, value: Any, timestamp: datetime) -> List[Dict]:
        """添加右流事件"""
        self.right_buffer[key].append((timestamp, value))
        self._cleanup(key, timestamp)
        return self._match(key, value, timestamp, "right")

    def _match(self, key: str, value: Any, timestamp: datetime, side: str) -> List[Dict]:
        """匹配并生成 Join 结果"""
        results = []
        other_buffer = self.right_buffer if side == "left" else self.left_buffer

        for other_ts, other_value in other_buffer.get(key, []):
            if abs((timestamp - other_ts).total_seconds()) <= self.join_window.total_seconds():
                if side == "left":
                    results.append({
                        "key": key,
                        "left": value,
                        "right": other_value,
                        "left_time": timestamp,
                        "right_time": other_ts
                    })
                else:
                    results.append({
                        "key": key,
                        "left": other_value,
                        "right": value,
                        "left_time": other_ts,
                        "right_time": timestamp
                    })

        return results

    def _cleanup(self, key: str, current_time: datetime) -> None:
        """清理过期数据"""
        cutoff = current_time - self.join_window * 2

        self.left_buffer[key] = [
            (ts, v) for ts, v in self.left_buffer[key]
            if ts > cutoff
        ]
        self.right_buffer[key] = [
            (ts, v) for ts, v in self.right_buffer[key]
            if ts > cutoff
        ]

class StreamTableJoin:
    """流-表 Join"""

    def __init__(self, table: StateStore):
        self.table = table

    def join(self, stream_event: Dict[str, Any],
             key_extractor: Callable[[Dict], str]) -> Optional[Dict]:
        """流与表 Join"""
        key = key_extractor(stream_event)
        table_value = self.table.get(key)

        if table_value:
            return {
                "stream": stream_event,
                "table": table_value,
                "key": key
            }
        return None

    def left_join(self, stream_event: Dict[str, Any],
                  key_extractor: Callable[[Dict], str]) -> Dict:
        """左 Join（流事件总是输出）"""
        key = key_extractor(stream_event)
        table_value = self.table.get(key)

        return {
            "stream": stream_event,
            "table": table_value,  # 可能为 None
            "key": key
        }

# 使用示例：订单流与客户表 Join
class OrderEnricher:
    """订单信息丰富器"""

    def __init__(self, customer_store: StateStore):
        self.stream_table_join = StreamTableJoin(customer_store)

    def enrich_order(self, order: Dict[str, Any]) -> Dict[str, Any]:
        """丰富订单信息"""
        result = self.stream_table_join.left_join(
            order,
            key_extractor=lambda o: o["customer_id"]
        )

        enriched_order = order.copy()
        if result["table"]:
            enriched_order["customer_name"] = result["table"].get("name")
            enriched_order["customer_tier"] = result["table"].get("tier")
            enriched_order["customer_email"] = result["table"].get("email")
        else:
            enriched_order["customer_name"] = "Unknown"
            enriched_order["customer_tier"] = "standard"

        return enriched_order
```

---

## Exactly-Once 语义

### 消息传递语义

```
┌─────────────────────────────────────────────────────────────────────┐
│                     消息传递语义                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  At-Most-Once（最多一次）                                           │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                    │
│  │ Producer │────▶│  Broker  │────▶│ Consumer │                    │
│  └──────────┘     └──────────┘     └──────────┘                    │
│  特点：消息可能丢失，不会重复                                        │
│  实现：发送后不确认，消费前提交偏移量                                 │
│  场景：日志收集、指标上报（允许丢失）                                 │
│                                                                     │
│  At-Least-Once（至少一次）                                          │
│  ┌──────────┐  确认  ┌──────────┐  确认  ┌──────────┐              │
│  │ Producer │◀─────│  Broker  │◀─────│ Consumer │              │
│  └──────────┘       └──────────┘       └──────────┘              │
│  特点：消息不会丢失，可能重复                                        │
│  实现：发送后等待确认，处理后提交偏移量                               │
│  场景：大多数业务场景（需要幂等处理）                                 │
│                                                                     │
│  Exactly-Once（精确一次）                                           │
│  ┌──────────┐  事务  ┌──────────┐  事务  ┌──────────┐              │
│  │ Producer │◀═════▶│  Broker  │◀═════▶│ Consumer │              │
│  └──────────┘       └──────────┘       └──────────┘              │
│  特点：消息不丢失，不重复                                            │
│  实现：事务、幂等生产者、事务性消费                                   │
│  场景：金融交易、账户操作（高一致性要求）                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Kafka Exactly-Once 实现

```python
from confluent_kafka import Producer, Consumer
import json
from typing import List, Dict, Any

class ExactlyOnceProducer:
    """支持 Exactly-Once 语义的生产者"""

    def __init__(self, bootstrap_servers: str, transactional_id: str):
        self.producer = Producer({
            'bootstrap.servers': bootstrap_servers,
            'transactional.id': transactional_id,
            'enable.idempotence': True,
            'acks': 'all',
            'max.in.flight.requests.per.connection': 5,
            'retries': 2147483647,  # 无限重试
        })
        # 初始化事务
        self.producer.init_transactions()

    def send_batch_transactionally(self, messages: List[Dict[str, Any]]) -> bool:
        """事务性批量发送"""
        try:
            # 开始事务
            self.producer.begin_transaction()

            for msg in messages:
                self.producer.produce(
                    topic=msg['topic'],
                    key=msg['key'].encode() if msg.get('key') else None,
                    value=json.dumps(msg['value']).encode()
                )

            # 提交事务
            self.producer.commit_transaction()
            return True

        except Exception as e:
            # 中止事务
            self.producer.abort_transaction()
            print(f"事务失败: {e}")
            return False

class ExactlyOnceProcessor:
    """Exactly-Once 流处理器"""

    def __init__(self, bootstrap_servers: str, group_id: str,
                 input_topic: str, output_topic: str):
        self.consumer = Consumer({
            'bootstrap.servers': bootstrap_servers,
            'group.id': group_id,
            'enable.auto.commit': False,
            'isolation.level': 'read_committed',  # 只读取已提交的消息
            'auto.offset.reset': 'earliest'
        })
        self.consumer.subscribe([input_topic])

        self.producer = Producer({
            'bootstrap.servers': bootstrap_servers,
            'transactional.id': f'{group_id}-processor',
            'enable.idempotence': True,
            'acks': 'all'
        })
        self.producer.init_transactions()

        self.output_topic = output_topic

    def process(self, transform_fn):
        """处理消息（Exactly-Once 语义）"""
        while True:
            msg = self.consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                continue

            try:
                # 开始事务
                self.producer.begin_transaction()

                # 处理消息
                input_value = json.loads(msg.value().decode())
                output_value = transform_fn(input_value)

                # 发送输出
                self.producer.produce(
                    topic=self.output_topic,
                    key=msg.key(),
                    value=json.dumps(output_value).encode()
                )

                # 在事务中提交消费者偏移量
                self.producer.send_offsets_to_transaction(
                    self.consumer.position(self.consumer.assignment()),
                    self.consumer.consumer_group_metadata()
                )

                # 提交事务
                self.producer.commit_transaction()

            except Exception as e:
                # 中止事务，消息将被重新处理
                self.producer.abort_transaction()
                print(f"处理失败，将重试: {e}")
```

### 端到端 Exactly-Once

实现端到端 Exactly-Once 需要整个数据管道的协调：

```python
import hashlib
from typing import Optional
from datetime import datetime

class IdempotentProcessor:
    """幂等处理器 - 基于去重实现 Exactly-Once"""

    def __init__(self, dedup_store: StateStore):
        self.dedup_store = dedup_store
        self.dedup_window = 24 * 60 * 60  # 24小时去重窗口

    def _generate_dedup_key(self, event: Dict[str, Any]) -> str:
        """生成去重键"""
        # 基于事件内容生成唯一标识
        content = json.dumps(event, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()

    def process_idempotently(self, event: Dict[str, Any],
                             processor_fn) -> Optional[Any]:
        """幂等处理"""
        dedup_key = self._generate_dedup_key(event)

        # 检查是否已处理
        existing = self.dedup_store.get(dedup_key)
        if existing:
            print(f"跳过重复事件: {dedup_key[:16]}...")
            return existing.get("result")

        # 处理事件
        result = processor_fn(event)

        # 记录已处理
        self.dedup_store.put(dedup_key, {
            "processed_at": datetime.now().isoformat(),
            "result": result
        })

        return result

class OutboxPattern:
    """发件箱模式 - 确保数据库操作和消息发送的原子性"""

    def __init__(self, db_connection, message_relay):
        self.db = db_connection
        self.relay = message_relay

    def execute_with_outbox(self, business_logic, events_to_publish: List[Dict]):
        """
        使用发件箱模式执行业务逻辑

        1. 在同一数据库事务中执行业务逻辑和写入发件箱表
        2. 后台进程读取发件箱表并发送消息
        3. 发送成功后标记为已发送
        """
        try:
            # 开始事务
            self.db.begin_transaction()

            # 执行业务逻辑
            result = business_logic()

            # 写入发件箱表
            for event in events_to_publish:
                self.db.execute("""
                    INSERT INTO outbox (
                        event_id, event_type, payload,
                        created_at, status
                    ) VALUES (?, ?, ?, ?, 'pending')
                """, (
                    event['id'],
                    event['type'],
                    json.dumps(event['payload']),
                    datetime.now()
                ))

            # 提交事务
            self.db.commit()

            # 触发消息中继（可选，也可以由后台任务处理）
            self.relay.process_outbox()

            return result

        except Exception as e:
            self.db.rollback()
            raise

class OutboxRelay:
    """发件箱消息中继"""

    def __init__(self, db_connection, producer: ExactlyOnceProducer):
        self.db = db_connection
        self.producer = producer

    def process_outbox(self, batch_size: int = 100):
        """处理发件箱中的待发送消息"""
        # 获取待发送消息
        pending = self.db.query("""
            SELECT event_id, event_type, payload
            FROM outbox
            WHERE status = 'pending'
            ORDER BY created_at
            LIMIT ?
        """, (batch_size,))

        if not pending:
            return

        messages = []
        for row in pending:
            messages.append({
                'topic': f"events.{row['event_type']}",
                'key': row['event_id'],
                'value': json.loads(row['payload'])
            })

        # 事务性发送
        success = self.producer.send_batch_transactionally(messages)

        if success:
            # 更新状态
            event_ids = [row['event_id'] for row in pending]
            self.db.execute("""
                UPDATE outbox
                SET status = 'sent', sent_at = ?
                WHERE event_id IN (?)
            """, (datetime.now(), event_ids))
            self.db.commit()
```

---

## 实际应用场景

### 实时欺诈检测

```python
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime, timedelta

@dataclass
class Transaction:
    transaction_id: str
    user_id: str
    amount: float
    merchant: str
    location: str
    timestamp: datetime
    card_type: str

class FraudDetectionSystem:
    """实时欺诈检测系统"""

    def __init__(self, state_store: StateStore):
        self.state_store = state_store
        self.rules = [
            self._rule_velocity_check,
            self._rule_amount_anomaly,
            self._rule_location_anomaly,
            self._rule_merchant_blacklist
        ]

    def analyze(self, transaction: Transaction) -> Dict[str, Any]:
        """分析交易是否存在欺诈风险"""
        user_profile = self._get_or_create_profile(transaction.user_id)
        risk_factors = []
        risk_score = 0

        for rule in self.rules:
            result = rule(transaction, user_profile)
            if result["triggered"]:
                risk_factors.append(result)
                risk_score += result["score"]

        # 更新用户档案
        self._update_profile(user_profile, transaction)

        decision = "block" if risk_score > 80 else "review" if risk_score > 50 else "approve"

        return {
            "transaction_id": transaction.transaction_id,
            "risk_score": min(risk_score, 100),
            "decision": decision,
            "risk_factors": risk_factors,
            "analyzed_at": datetime.now().isoformat()
        }

    def _rule_velocity_check(self, txn: Transaction, profile: Dict) -> Dict:
        """规则：交易频率检查"""
        recent_txns = profile.get("recent_transactions", [])
        # 过去1小时的交易数
        one_hour_ago = datetime.now() - timedelta(hours=1)
        recent_count = sum(1 for t in recent_txns
                         if datetime.fromisoformat(t["timestamp"]) > one_hour_ago)

        if recent_count > 10:
            return {
                "rule": "velocity_check",
                "triggered": True,
                "score": 40,
                "reason": f"过去1小时内有 {recent_count} 笔交易"
            }
        return {"rule": "velocity_check", "triggered": False, "score": 0}

    def _rule_amount_anomaly(self, txn: Transaction, profile: Dict) -> Dict:
        """规则：金额异常检查"""
        avg_amount = profile.get("average_amount", 100)
        std_amount = profile.get("std_amount", 50)

        if txn.amount > avg_amount + 3 * std_amount:
            return {
                "rule": "amount_anomaly",
                "triggered": True,
                "score": 35,
                "reason": f"交易金额 {txn.amount} 远超平均值 {avg_amount:.2f}"
            }
        return {"rule": "amount_anomaly", "triggered": False, "score": 0}

    def _rule_location_anomaly(self, txn: Transaction, profile: Dict) -> Dict:
        """规则：地理位置异常检查"""
        last_location = profile.get("last_location")
        last_txn_time = profile.get("last_transaction_time")

        if last_location and last_txn_time:
            # 检查是否可能在短时间内从一个地点到达另一个地点
            if last_location != txn.location:
                last_time = datetime.fromisoformat(last_txn_time)
                time_diff = (txn.timestamp - last_time).total_seconds() / 3600
                if time_diff < 1:  # 1小时内在不同城市
                    return {
                        "rule": "location_anomaly",
                        "triggered": True,
                        "score": 50,
                        "reason": f"在 {time_diff:.1f} 小时内从 {last_location} 到 {txn.location}"
                    }
        return {"rule": "location_anomaly", "triggered": False, "score": 0}

    def _rule_merchant_blacklist(self, txn: Transaction, profile: Dict) -> Dict:
        """规则：商户黑名单检查"""
        blacklist = {"suspicious_merchant_1", "fraud_store_xyz"}
        if txn.merchant.lower() in blacklist:
            return {
                "rule": "merchant_blacklist",
                "triggered": True,
                "score": 60,
                "reason": f"商户 {txn.merchant} 在黑名单中"
            }
        return {"rule": "merchant_blacklist", "triggered": False, "score": 0}

    def _get_or_create_profile(self, user_id: str) -> Dict:
        """获取或创建用户档案"""
        profile = self.state_store.get(f"user:{user_id}")
        if not profile:
            profile = {
                "user_id": user_id,
                "recent_transactions": [],
                "average_amount": 100,
                "std_amount": 50,
                "last_location": None,
                "last_transaction_time": None
            }
        return profile

    def _update_profile(self, profile: Dict, txn: Transaction) -> None:
        """更新用户档案"""
        # 添加最近交易
        profile["recent_transactions"].append({
            "amount": txn.amount,
            "location": txn.location,
            "timestamp": txn.timestamp.isoformat()
        })

        # 只保留最近100笔交易
        profile["recent_transactions"] = profile["recent_transactions"][-100:]

        # 更新平均值和标准差
        amounts = [t["amount"] for t in profile["recent_transactions"]]
        if amounts:
            profile["average_amount"] = sum(amounts) / len(amounts)
            if len(amounts) > 1:
                mean = profile["average_amount"]
                variance = sum((x - mean) ** 2 for x in amounts) / len(amounts)
                profile["std_amount"] = variance ** 0.5

        # 更新最后位置和时间
        profile["last_location"] = txn.location
        profile["last_transaction_time"] = txn.timestamp.isoformat()

        self.state_store.put(f"user:{profile['user_id']}", profile)
```

### 实时推荐系统

```python
from collections import defaultdict
from typing import Tuple

class RealTimeRecommender:
    """实时推荐系统"""

    def __init__(self, user_state: StateStore, item_state: StateStore):
        self.user_state = user_state
        self.item_state = item_state
        self.decay_factor = 0.95  # 时间衰减因子

    def process_event(self, event: Dict[str, Any]) -> None:
        """处理用户行为事件"""
        event_type = event["type"]
        user_id = event["user_id"]
        item_id = event["item_id"]
        timestamp = datetime.fromisoformat(event["timestamp"])

        # 事件权重
        weights = {
            "view": 1,
            "click": 2,
            "add_to_cart": 5,
            "purchase": 10
        }
        weight = weights.get(event_type, 1)

        # 更新用户兴趣
        self._update_user_interests(user_id, item_id, weight, timestamp)

        # 更新物品热度
        self._update_item_popularity(item_id, weight, timestamp)

        # 更新协同过滤数据
        self._update_collaborative_data(user_id, item_id)

    def _update_user_interests(self, user_id: str, item_id: str,
                                weight: float, timestamp: datetime) -> None:
        """更新用户兴趣模型"""
        user_profile = self.user_state.get(f"user:{user_id}") or {
            "interests": {},
            "recent_items": [],
            "last_updated": None
        }

        # 获取物品标签
        item_info = self.item_state.get(f"item:{item_id}") or {}
        categories = item_info.get("categories", [])

        # 时间衰减
        if user_profile["last_updated"]:
            last_updated = datetime.fromisoformat(user_profile["last_updated"])
            hours_passed = (timestamp - last_updated).total_seconds() / 3600
            decay = self.decay_factor ** hours_passed
            for key in user_profile["interests"]:
                user_profile["interests"][key] *= decay

        # 更新兴趣分数
        for category in categories:
            current_score = user_profile["interests"].get(category, 0)
            user_profile["interests"][category] = current_score + weight

        # 更新最近浏览
        user_profile["recent_items"].append({
            "item_id": item_id,
            "timestamp": timestamp.isoformat()
        })
        user_profile["recent_items"] = user_profile["recent_items"][-50:]
        user_profile["last_updated"] = timestamp.isoformat()

        self.user_state.put(f"user:{user_id}", user_profile)

    def _update_item_popularity(self, item_id: str, weight: float,
                                 timestamp: datetime) -> None:
        """更新物品热度"""
        item_stats = self.item_state.get(f"stats:{item_id}") or {
            "popularity_score": 0,
            "interaction_count": 0,
            "last_interaction": None
        }

        # 时间衰减
        if item_stats["last_interaction"]:
            last_interaction = datetime.fromisoformat(item_stats["last_interaction"])
            hours_passed = (timestamp - last_interaction).total_seconds() / 3600
            decay = self.decay_factor ** hours_passed
            item_stats["popularity_score"] *= decay

        item_stats["popularity_score"] += weight
        item_stats["interaction_count"] += 1
        item_stats["last_interaction"] = timestamp.isoformat()

        self.item_state.put(f"stats:{item_id}", item_stats)

    def _update_collaborative_data(self, user_id: str, item_id: str) -> None:
        """更新协同过滤数据"""
        # 更新用户-物品交互矩阵
        interaction_key = f"interaction:{user_id}:{item_id}"
        current = self.user_state.get(interaction_key) or 0
        self.user_state.put(interaction_key, current + 1)

    def get_recommendations(self, user_id: str, limit: int = 10) -> List[Dict]:
        """获取实时推荐"""
        user_profile = self.user_state.get(f"user:{user_id}")

        if not user_profile:
            # 冷启动：返回热门商品
            return self._get_popular_items(limit)

        # 基于用户兴趣的推荐
        interest_based = self._get_interest_based_recommendations(
            user_profile["interests"], limit * 2
        )

        # 基于协同过滤的推荐
        cf_based = self._get_collaborative_recommendations(user_id, limit * 2)

        # 合并并去重
        seen = set(item["item_id"] for item in user_profile.get("recent_items", []))
        recommendations = []

        for item in interest_based + cf_based:
            if item["item_id"] not in seen and len(recommendations) < limit:
                recommendations.append(item)
                seen.add(item["item_id"])

        return recommendations

    def _get_popular_items(self, limit: int) -> List[Dict]:
        """获取热门商品"""
        all_stats = self.item_state.all()
        items = [
            (k.replace("stats:", ""), v["popularity_score"])
            for k, v in all_stats.items()
            if k.startswith("stats:")
        ]
        items.sort(key=lambda x: x[1], reverse=True)
        return [{"item_id": item_id, "score": score} for item_id, score in items[:limit]]

    def _get_interest_based_recommendations(self, interests: Dict[str, float],
                                            limit: int) -> List[Dict]:
        """基于兴趣的推荐"""
        recommendations = []
        top_interests = sorted(interests.items(), key=lambda x: x[1], reverse=True)[:5]

        for category, score in top_interests:
            category_items = self._get_items_by_category(category, limit // 5)
            for item in category_items:
                item["score"] = score * item.get("popularity", 1)
                recommendations.append(item)

        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:limit]

    def _get_items_by_category(self, category: str, limit: int) -> List[Dict]:
        """根据类别获取商品"""
        # 实际实现需要索引支持
        return []

    def _get_collaborative_recommendations(self, user_id: str,
                                           limit: int) -> List[Dict]:
        """基于协同过滤的推荐"""
        # 简化的协同过滤实现
        return []
```

### IoT 数据处理

```python
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum

class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

@dataclass
class SensorReading:
    device_id: str
    sensor_type: str
    value: float
    unit: str
    timestamp: datetime
    location: str

@dataclass
class Alert:
    alert_id: str
    device_id: str
    severity: AlertSeverity
    message: str
    timestamp: datetime
    metadata: Dict[str, Any]

class IoTStreamProcessor:
    """IoT 数据流处理器"""

    def __init__(self, state_store: StateStore, alert_publisher):
        self.state_store = state_store
        self.alert_publisher = alert_publisher

        # 传感器阈值配置
        self.thresholds = {
            "temperature": {"min": -20, "max": 50, "critical_max": 60},
            "humidity": {"min": 0, "max": 100, "critical_max": 95},
            "pressure": {"min": 900, "max": 1100, "critical_max": 1200},
            "vibration": {"min": 0, "max": 5, "critical_max": 8}
        }

    def process_reading(self, reading: SensorReading) -> Optional[Alert]:
        """处理传感器读数"""
        # 1. 数据验证
        if not self._validate_reading(reading):
            return None

        # 2. 更新设备状态
        self._update_device_state(reading)

        # 3. 异常检测
        alert = self._detect_anomaly(reading)
        if alert:
            self.alert_publisher.publish(alert)
            return alert

        # 4. 聚合计算
        self._aggregate_metrics(reading)

        return None

    def _validate_reading(self, reading: SensorReading) -> bool:
        """验证读数有效性"""
        if reading.value is None:
            return False

        # 检查数值范围
        thresholds = self.thresholds.get(reading.sensor_type)
        if thresholds:
            if reading.value < thresholds["min"] - 100 or \
               reading.value > thresholds["critical_max"] + 100:
                # 明显异常值，可能是传感器故障
                return False

        return True

    def _update_device_state(self, reading: SensorReading) -> None:
        """更新设备状态"""
        device_state = self.state_store.get(f"device:{reading.device_id}") or {
            "device_id": reading.device_id,
            "location": reading.location,
            "sensors": {},
            "last_seen": None,
            "status": "online"
        }

        device_state["sensors"][reading.sensor_type] = {
            "value": reading.value,
            "unit": reading.unit,
            "timestamp": reading.timestamp.isoformat()
        }
        device_state["last_seen"] = reading.timestamp.isoformat()
        device_state["status"] = "online"

        self.state_store.put(f"device:{reading.device_id}", device_state)

    def _detect_anomaly(self, reading: SensorReading) -> Optional[Alert]:
        """检测异常"""
        thresholds = self.thresholds.get(reading.sensor_type)
        if not thresholds:
            return None

        # 检查临界值
        if reading.value >= thresholds["critical_max"]:
            return Alert(
                alert_id=str(uuid.uuid4()),
                device_id=reading.device_id,
                severity=AlertSeverity.CRITICAL,
                message=f"{reading.sensor_type} 达到临界值: {reading.value}{reading.unit}",
                timestamp=reading.timestamp,
                metadata={
                    "sensor_type": reading.sensor_type,
                    "value": reading.value,
                    "threshold": thresholds["critical_max"],
                    "location": reading.location
                }
            )

        # 检查警告阈值
        if reading.value >= thresholds["max"]:
            return Alert(
                alert_id=str(uuid.uuid4()),
                device_id=reading.device_id,
                severity=AlertSeverity.WARNING,
                message=f"{reading.sensor_type} 超过阈值: {reading.value}{reading.unit}",
                timestamp=reading.timestamp,
                metadata={
                    "sensor_type": reading.sensor_type,
                    "value": reading.value,
                    "threshold": thresholds["max"],
                    "location": reading.location
                }
            )

        # 趋势检测
        trend_alert = self._check_trend(reading)
        if trend_alert:
            return trend_alert

        return None

    def _check_trend(self, reading: SensorReading) -> Optional[Alert]:
        """检测数值趋势"""
        history_key = f"history:{reading.device_id}:{reading.sensor_type}"
        history = self.state_store.get(history_key) or []

        # 添加当前读数
        history.append({
            "value": reading.value,
            "timestamp": reading.timestamp.isoformat()
        })

        # 只保留最近60个读数
        history = history[-60:]
        self.state_store.put(history_key, history)

        if len(history) < 10:
            return None

        # 计算趋势
        recent_values = [h["value"] for h in history[-10:]]
        older_values = [h["value"] for h in history[-20:-10]] if len(history) >= 20 else recent_values

        recent_avg = sum(recent_values) / len(recent_values)
        older_avg = sum(older_values) / len(older_values)

        # 如果最近平均值比之前高出30%，发出警告
        if older_avg > 0 and (recent_avg - older_avg) / older_avg > 0.3:
            return Alert(
                alert_id=str(uuid.uuid4()),
                device_id=reading.device_id,
                severity=AlertSeverity.WARNING,
                message=f"{reading.sensor_type} 持续上升趋势",
                timestamp=reading.timestamp,
                metadata={
                    "sensor_type": reading.sensor_type,
                    "recent_avg": recent_avg,
                    "older_avg": older_avg,
                    "increase_percent": (recent_avg - older_avg) / older_avg * 100
                }
            )

        return None

    def _aggregate_metrics(self, reading: SensorReading) -> None:
        """聚合指标（分钟级）"""
        minute_key = reading.timestamp.strftime("%Y-%m-%d-%H-%M")
        agg_key = f"agg:{reading.device_id}:{reading.sensor_type}:{minute_key}"

        agg_data = self.state_store.get(agg_key) or {
            "count": 0,
            "sum": 0,
            "min": float('inf'),
            "max": float('-inf')
        }

        agg_data["count"] += 1
        agg_data["sum"] += reading.value
        agg_data["min"] = min(agg_data["min"], reading.value)
        agg_data["max"] = max(agg_data["max"], reading.value)
        agg_data["avg"] = agg_data["sum"] / agg_data["count"]

        self.state_store.put(agg_key, agg_data)
```

---

## 最佳实践总结

### 设计原则

```python
streaming_best_practices = {
    "架构设计": [
        "选择合适的架构（Lambda vs Kappa）",
        "考虑端到端的一致性语义",
        "设计可水平扩展的处理逻辑",
        "分离关注点：摄入、处理、存储"
    ],

    "数据建模": [
        "使用 Schema Registry 管理数据契约",
        "设计演进友好的数据格式（Avro/Protobuf）",
        "包含必要的元数据（时间戳、来源、版本）",
        "考虑数据压缩和序列化效率"
    ],

    "容错处理": [
        "实现幂等性处理逻辑",
        "使用检查点进行状态恢复",
        "设置合理的重试策略",
        "建立死信队列处理失败消息"
    ],

    "性能优化": [
        "合理设置分区数和并行度",
        "使用批量处理减少网络开销",
        "优化状态存储访问模式",
        "监控和调优背压机制"
    ],

    "监控告警": [
        "监控消费延迟和吞吐量",
        "设置关键指标告警阈值",
        "记录处理日志和审计跟踪",
        "建立数据质量检查机制"
    ]
}
```

### 技术选型指南

| 场景 | 推荐技术 | 说明 |
|------|----------|------|
| 消息队列 | Apache Kafka | 高吞吐、持久化、生态完善 |
| 流处理引擎 | Apache Flink | 低延迟、精确一次、强大的窗口支持 |
| 轻量级流处理 | Kafka Streams | 无需额外集群、易于部署 |
| 云原生方案 | AWS Kinesis / GCP Dataflow | 托管服务、弹性伸缩 |
| 实时数据库 | Apache Druid / ClickHouse | 实时 OLAP 查询 |
| 时序数据库 | InfluxDB / TimescaleDB | IoT 和监控场景 |

---

## 总结

实时数据流处理已成为现代数据架构不可或缺的组成部分。通过本文的学习，你应该掌握了：

1. **流处理与批处理的区别和选择**：根据延迟、吞吐量和复杂度需求选择合适的处理模式

2. **事件驱动架构的核心概念**：事件、事件通道、事件溯源和 CQRS 模式的设计与实现

3. **Kafka 生态系统**：Topic、Partition、Producer、Consumer、Kafka Streams 和 Kafka Connect 的使用

4. **流处理核心模式**：窗口操作、状态管理、Join 操作等关键技术

5. **Exactly-Once 语义**：理解和实现端到端的精确一次处理保证

6. **实际应用场景**：欺诈检测、实时推荐、IoT 数据处理等典型应用

在实际项目中，要根据具体的业务需求、数据规模、延迟要求和团队能力来选择合适的技术方案。始终关注数据质量、系统可靠性和可维护性，构建稳健的实时数据处理系统。
