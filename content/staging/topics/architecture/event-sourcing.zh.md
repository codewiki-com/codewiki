---
title: Event Sourcing 事件溯源
description: 掌握事件溯源架构模式，实现完整的状态追溯与审计
track: architecture
section: design-patterns
difficulty: advanced
tags:
  - Event Sourcing
  - CQRS
  - 事件
  - 架构
status: imported
origin: old/src/content/docs/architecture/event-sourcing.zh.md
divergence: 0.248
issues: []
legacy:
  category: Architecture
  subcategory: Patterns
  order: 7
  lastUpdated: 2026-01-07
---

## 概念解释

事件溯源 (Event Sourcing) 是一种革命性的数据持久化模式，它颠覆了传统的"存储当前状态"的思维方式。在事件溯源架构中，我们不再存储实体的最终状态，而是存储导致状态变化的所有事件序列。通过重放这些事件，我们可以在任意时间点重建系统状态。

### 什么是事件溯源？

想象一个银行账户系统。传统方式下，我们只存储账户的当前余额：

```
账户表: { id: "001", balance: 1000, lastUpdated: 2026-01-07
```

而在事件溯源模式下，我们存储的是所有发生过的事件：

```
事件流:
1. AccountOpened { accountId: "001", initialBalance: 0, timestamp: "2024-01-01" }
2. MoneyDeposited { accountId: "001", amount: 500, timestamp: "2024-01-05" }
3. MoneyDeposited { accountId: "001", amount: 800, timestamp: "2024-01-10" }
4. MoneyWithdrawn { accountId: "001", amount: 300, timestamp: "2024-01-15" }
```

当前余额 1000 元可以通过重放这些事件计算得出：0 + 500 + 800 - 300 = 1000。

### 核心特征

事件溯源具有以下核心特征：

1. **事件不可变性**：一旦事件被记录，就永远不能修改或删除
2. **事件时序性**：事件按照发生的时间顺序存储
3. **完整历史**：系统保留了所有状态变化的完整历史
4. **状态可重建**：任意时间点的状态都可以通过重放事件来重建

### 与传统 CRUD 的对比

| 特性 | 传统 CRUD | 事件溯源 |
|------|----------|---------|
| 存储内容 | 当前状态 | 事件序列 |
| 历史追溯 | 需要额外审计表 | 原生支持 |
| 数据修复 | 直接修改数据 | 追加补偿事件 |
| 并发处理 | 乐观锁/悲观锁 | 事件版本控制 |
| 调试能力 | 难以重现问题 | 可精确重放问题场景 |

---

## 事件存储设计

事件存储 (Event Store) 是事件溯源架构的核心组件，负责持久化和检索事件。

### 事件结构设计

一个完整的事件应包含以下信息：

```typescript
interface DomainEvent {
  // 事件唯一标识
  eventId: string;

  // 事件类型
  eventType: string;

  // 聚合根标识
  aggregateId: string;

  // 聚合类型
  aggregateType: string;

  // 事件版本号（用于乐观并发控制）
  version: number;

  // 事件发生时间
  timestamp: Date;

  // 事件负载（业务数据）
  payload: Record<string, unknown>;

  // 元数据（用户ID、关联ID等）
  metadata: EventMetadata;
}

interface EventMetadata {
  userId?: string;
  correlationId: string;  // 追踪相关事件
  causationId: string;    // 引起此事件的事件ID
  schemaVersion: number;  // 事件模式版本
}
```

### 事件存储表设计

```sql
CREATE TABLE event_store (
    -- 全局唯一事件ID
    event_id UUID PRIMARY KEY,

    -- 聚合标识
    aggregate_id VARCHAR(255) NOT NULL,
    aggregate_type VARCHAR(255) NOT NULL,

    -- 事件信息
    event_type VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    metadata JSONB NOT NULL,

    -- 版本控制（聚合内的事件序号）
    version BIGINT NOT NULL,

    -- 全局序号（用于投影处理）
    global_sequence BIGSERIAL NOT NULL,

    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 确保同一聚合的版本唯一
    CONSTRAINT unique_aggregate_version
        UNIQUE (aggregate_id, aggregate_type, version)
);

-- 按聚合查询的索引
CREATE INDEX idx_event_store_aggregate
    ON event_store (aggregate_id, aggregate_type, version);

-- 按事件类型查询的索引
CREATE INDEX idx_event_store_type
    ON event_store (event_type, created_at);

-- 全局序号索引（用于投影）
CREATE INDEX idx_event_store_global_sequence
    ON event_store (global_sequence);
```

### 事件存储接口实现

```typescript
interface EventStore {
  // 追加事件到流
  appendToStream(
    aggregateId: string,
    aggregateType: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void>;

  // 读取聚合的所有事件
  readStream(
    aggregateId: string,
    aggregateType: string,
    fromVersion?: number
  ): Promise<DomainEvent[]>;

  // 读取所有事件（用于投影）
  readAllEvents(
    fromPosition: number,
    batchSize: number
  ): Promise<DomainEvent[]>;
}

class PostgresEventStore implements EventStore {
  constructor(private db: Database) {}

  async appendToStream(
    aggregateId: string,
    aggregateType: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    const client = await this.db.getClient();

    try {
      await client.query('BEGIN');

      // 检查当前版本（乐观并发控制）
      const currentVersion = await this.getCurrentVersion(
        client, aggregateId, aggregateType
      );

      if (currentVersion !== expectedVersion) {
        throw new ConcurrencyError(
          `Expected version ${expectedVersion}, but found ${currentVersion}`
        );
      }

      // 插入事件
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const version = expectedVersion + i + 1;

        await client.query(
          `INSERT INTO event_store
           (event_id, aggregate_id, aggregate_type, event_type,
            event_data, metadata, version)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            event.eventId,
            aggregateId,
            aggregateType,
            event.eventType,
            JSON.stringify(event.payload),
            JSON.stringify(event.metadata),
            version
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async readStream(
    aggregateId: string,
    aggregateType: string,
    fromVersion: number = 0
  ): Promise<DomainEvent[]> {
    const result = await this.db.query(
      `SELECT * FROM event_store
       WHERE aggregate_id = $1 AND aggregate_type = $2 AND version > $3
       ORDER BY version ASC`,
      [aggregateId, aggregateType, fromVersion]
    );

    return result.rows.map(this.mapToEvent);
  }

  private async getCurrentVersion(
    client: any,
    aggregateId: string,
    aggregateType: string
  ): Promise<number> {
    const result = await client.query(
      `SELECT COALESCE(MAX(version), 0) as version
       FROM event_store
       WHERE aggregate_id = $1 AND aggregate_type = $2`,
      [aggregateId, aggregateType]
    );
    return result.rows[0].version;
  }

  private mapToEvent(row: any): DomainEvent {
    return {
      eventId: row.event_id,
      eventType: row.event_type,
      aggregateId: row.aggregate_id,
      aggregateType: row.aggregate_type,
      version: row.version,
      timestamp: row.created_at,
      payload: row.event_data,
      metadata: row.metadata
    };
  }
}
```

---

## 聚合重建与快照

### 聚合重建

在事件溯源中，聚合根 (Aggregate Root) 的状态需要通过重放事件来重建：

```typescript
abstract class AggregateRoot {
  protected id: string;
  protected version: number = 0;
  private changes: DomainEvent[] = [];

  // 获取未提交的事件
  getUncommittedChanges(): DomainEvent[] {
    return [...this.changes];
  }

  // 标记事件已提交
  markChangesAsCommitted(): void {
    this.changes = [];
  }

  // 从历史事件重建状态
  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.applyChange(event, false);
    }
  }

  // 应用事件
  protected applyChange(event: DomainEvent, isNew: boolean = true): void {
    this.apply(event);
    this.version = event.version;

    if (isNew) {
      this.changes.push(event);
    }
  }

  // 子类实现具体的事件处理逻辑
  protected abstract apply(event: DomainEvent): void;
}

// 订单聚合示例
class Order extends AggregateRoot {
  private status: OrderStatus;
  private items: OrderItem[] = [];
  private totalAmount: number = 0;
  private customerId: string;

  // 创建订单（命令处理）
  static create(orderId: string, customerId: string): Order {
    const order = new Order();
    order.applyChange({
      eventId: uuid(),
      eventType: 'OrderCreated',
      aggregateId: orderId,
      aggregateType: 'Order',
      version: 1,
      timestamp: new Date(),
      payload: { customerId },
      metadata: { correlationId: uuid(), causationId: '', schemaVersion: 1 }
    });
    return order;
  }

  // 添加商品
  addItem(productId: string, quantity: number, price: number): void {
    if (this.status !== OrderStatus.Draft) {
      throw new Error('只能在草稿状态添加商品');
    }

    this.applyChange({
      eventId: uuid(),
      eventType: 'OrderItemAdded',
      aggregateId: this.id,
      aggregateType: 'Order',
      version: this.version + 1,
      timestamp: new Date(),
      payload: { productId, quantity, price },
      metadata: { correlationId: uuid(), causationId: '', schemaVersion: 1 }
    });
  }

  // 确认订单
  confirm(): void {
    if (this.status !== OrderStatus.Draft) {
      throw new Error('只能确认草稿订单');
    }
    if (this.items.length === 0) {
      throw new Error('订单不能为空');
    }

    this.applyChange({
      eventId: uuid(),
      eventType: 'OrderConfirmed',
      aggregateId: this.id,
      aggregateType: 'Order',
      version: this.version + 1,
      timestamp: new Date(),
      payload: { confirmedAt: new Date() },
      metadata: { correlationId: uuid(), causationId: '', schemaVersion: 1 }
    });
  }

  // 事件处理器
  protected apply(event: DomainEvent): void {
    switch (event.eventType) {
      case 'OrderCreated':
        this.id = event.aggregateId;
        this.customerId = event.payload.customerId as string;
        this.status = OrderStatus.Draft;
        break;

      case 'OrderItemAdded':
        const item = event.payload as OrderItem;
        this.items.push(item);
        this.totalAmount += item.quantity * item.price;
        break;

      case 'OrderConfirmed':
        this.status = OrderStatus.Confirmed;
        break;

      case 'OrderCancelled':
        this.status = OrderStatus.Cancelled;
        break;
    }
  }
}

enum OrderStatus {
  Draft = 'draft',
  Confirmed = 'confirmed',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled'
}
```

### 快照优化

当聚合的事件数量很大时，每次重建都从头重放所有事件会非常耗时。快照 (Snapshot) 机制可以解决这个问题：

```typescript
interface Snapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  state: Record<string, unknown>;
  createdAt: Date;
}

class SnapshotStore {
  constructor(private db: Database) {}

  async saveSnapshot(snapshot: Snapshot): Promise<void> {
    await this.db.query(
      `INSERT INTO snapshots
       (aggregate_id, aggregate_type, version, state, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (aggregate_id, aggregate_type)
       DO UPDATE SET version = $3, state = $4, created_at = $5`,
      [
        snapshot.aggregateId,
        snapshot.aggregateType,
        snapshot.version,
        JSON.stringify(snapshot.state),
        snapshot.createdAt
      ]
    );
  }

  async getSnapshot(
    aggregateId: string,
    aggregateType: string
  ): Promise<Snapshot | null> {
    const result = await this.db.query(
      `SELECT * FROM snapshots
       WHERE aggregate_id = $1 AND aggregate_type = $2`,
      [aggregateId, aggregateType]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      aggregateId: row.aggregate_id,
      aggregateType: row.aggregate_type,
      version: row.version,
      state: row.state,
      createdAt: row.created_at
    };
  }
}

// 带快照的聚合仓储
class OrderRepository {
  private readonly SNAPSHOT_INTERVAL = 100; // 每100个事件创建快照

  constructor(
    private eventStore: EventStore,
    private snapshotStore: SnapshotStore
  ) {}

  async getById(orderId: string): Promise<Order> {
    // 1. 尝试加载快照
    const snapshot = await this.snapshotStore.getSnapshot(orderId, 'Order');

    // 2. 从快照版本开始加载事件
    const fromVersion = snapshot?.version ?? 0;
    const events = await this.eventStore.readStream(
      orderId, 'Order', fromVersion
    );

    // 3. 重建聚合
    const order = new Order();

    if (snapshot) {
      order.restoreFromSnapshot(snapshot);
    }

    order.loadFromHistory(events);

    return order;
  }

  async save(order: Order): Promise<void> {
    const changes = order.getUncommittedChanges();

    if (changes.length === 0) return;

    // 保存事件
    await this.eventStore.appendToStream(
      order.id,
      'Order',
      changes,
      order.version - changes.length
    );

    order.markChangesAsCommitted();

    // 检查是否需要创建快照
    if (order.version % this.SNAPSHOT_INTERVAL === 0) {
      await this.snapshotStore.saveSnapshot({
        aggregateId: order.id,
        aggregateType: 'Order',
        version: order.version,
        state: order.toSnapshot(),
        createdAt: new Date()
      });
    }
  }
}
```

---

## 与 CQRS 结合

事件溯源通常与 CQRS (Command Query Responsibility Segregation，命令查询职责分离) 模式结合使用，构建高性能、可扩展的系统。

### CQRS 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户端应用                               │
└─────────────────────────────────────────────────────────────────┘
                │                              │
                │ Commands                     │ Queries
                ▼                              ▼
┌───────────────────────┐        ┌───────────────────────────────┐
│     Command Side      │        │         Query Side            │
│  ┌─────────────────┐  │        │  ┌─────────────────────────┐  │
│  │ Command Handler │  │        │  │     Query Handler       │  │
│  └────────┬────────┘  │        │  └───────────┬─────────────┘  │
│           │           │        │              │                │
│  ┌────────▼────────┐  │        │  ┌───────────▼─────────────┐  │
│  │   聚合根/领域    │  │        │  │       读模型            │  │
│  └────────┬────────┘  │        │  │   (Optimized Views)     │  │
│           │           │        │  └───────────┬─────────────┘  │
│  ┌────────▼────────┐  │        │              │                │
│  │   Event Store   │──┼────────┼──────────────┘                │
│  └─────────────────┘  │   Events (异步投影)                    │
└───────────────────────┘        └───────────────────────────────┘
```

### 命令端实现

```typescript
// 命令定义
interface Command {
  commandId: string;
  timestamp: Date;
}

interface CreateOrderCommand extends Command {
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
}

interface ConfirmOrderCommand extends Command {
  orderId: string;
}

// 命令处理器
class OrderCommandHandler {
  constructor(
    private orderRepository: OrderRepository,
    private productService: ProductService
  ) {}

  async handle(command: CreateOrderCommand): Promise<string> {
    // 验证客户
    const customer = await this.customerService.getById(command.customerId);
    if (!customer) {
      throw new Error('客户不存在');
    }

    // 创建订单
    const order = Order.create(uuid(), command.customerId);

    // 添加商品
    for (const item of command.items) {
      const product = await this.productService.getById(item.productId);
      if (!product) {
        throw new Error(`商品 ${item.productId} 不存在`);
      }
      order.addItem(item.productId, item.quantity, product.price);
    }

    // 保存订单
    await this.orderRepository.save(order);

    return order.id;
  }

  async handleConfirm(command: ConfirmOrderCommand): Promise<void> {
    const order = await this.orderRepository.getById(command.orderId);
    order.confirm();
    await this.orderRepository.save(order);
  }
}
```

### 查询端实现

```typescript
// 查询模型（针对查询优化的非规范化数据结构）
interface OrderReadModel {
  orderId: string;
  customerId: string;
  customerName: string;
  status: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  createdAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
}

// 查询处理器
class OrderQueryHandler {
  constructor(private readDb: Database) {}

  async getOrderById(orderId: string): Promise<OrderReadModel | null> {
    const result = await this.readDb.query(
      `SELECT * FROM order_read_model WHERE order_id = $1`,
      [orderId]
    );
    return result.rows[0] || null;
  }

  async getOrdersByCustomer(
    customerId: string,
    pagination: { page: number; size: number }
  ): Promise<{ orders: OrderReadModel[]; total: number }> {
    const offset = (pagination.page - 1) * pagination.size;

    const [ordersResult, countResult] = await Promise.all([
      this.readDb.query(
        `SELECT * FROM order_read_model
         WHERE customer_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [customerId, pagination.size, offset]
      ),
      this.readDb.query(
        `SELECT COUNT(*) as total FROM order_read_model WHERE customer_id = $1`,
        [customerId]
      )
    ]);

    return {
      orders: ordersResult.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  async getOrderStatistics(): Promise<OrderStatistics> {
    const result = await this.readDb.query(`
      SELECT
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_count,
        AVG(total_amount) as average_order_value
      FROM order_read_model
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    return result.rows[0];
  }
}
```

---

## 事件版本控制与演进

随着业务发展，事件结构不可避免地需要演进。由于事件是不可变的，我们需要特殊的策略来处理事件版本变化。

### 事件版本化策略

```typescript
// 事件版本注册表
class EventRegistry {
  private upcasters: Map<string, EventUpcaster[]> = new Map();

  // 注册事件升级器
  registerUpcaster(
    eventType: string,
    fromVersion: number,
    toVersion: number,
    upcaster: (event: DomainEvent) => DomainEvent
  ): void {
    const key = `${eventType}:${fromVersion}:${toVersion}`;
    if (!this.upcasters.has(eventType)) {
      this.upcasters.set(eventType, []);
    }
    this.upcasters.get(eventType)!.push({
      fromVersion,
      toVersion,
      transform: upcaster
    });
  }

  // 将事件升级到最新版本
  upcast(event: DomainEvent): DomainEvent {
    const currentVersion = event.metadata.schemaVersion || 1;
    const upcasters = this.upcasters.get(event.eventType) || [];

    let result = event;
    for (const upcaster of upcasters) {
      if (upcaster.fromVersion >= currentVersion) {
        result = upcaster.transform(result);
        result.metadata.schemaVersion = upcaster.toVersion;
      }
    }

    return result;
  }
}

interface EventUpcaster {
  fromVersion: number;
  toVersion: number;
  transform: (event: DomainEvent) => DomainEvent;
}

// 示例：订单项添加事件的版本演进
const registry = new EventRegistry();

// V1 -> V2: 添加 currency 字段
registry.registerUpcaster('OrderItemAdded', 1, 2, (event) => ({
  ...event,
  payload: {
    ...event.payload,
    currency: 'CNY'  // 默认货币
  }
}));

// V2 -> V3: 将 price 重命名为 unitPrice，添加 discount
registry.registerUpcaster('OrderItemAdded', 2, 3, (event) => ({
  ...event,
  payload: {
    productId: event.payload.productId,
    quantity: event.payload.quantity,
    unitPrice: event.payload.price,  // 重命名
    currency: event.payload.currency,
    discount: 0  // 新字段默认值
  }
}));
```

### 事件迁移策略

对于大规模的事件结构变更，可以采用以下策略：

```typescript
// 策略1：懒加载升级（读取时升级）
class LazyUpcastingEventStore implements EventStore {
  constructor(
    private innerStore: EventStore,
    private registry: EventRegistry
  ) {}

  async readStream(
    aggregateId: string,
    aggregateType: string,
    fromVersion?: number
  ): Promise<DomainEvent[]> {
    const events = await this.innerStore.readStream(
      aggregateId, aggregateType, fromVersion
    );

    // 读取时升级事件
    return events.map(event => this.registry.upcast(event));
  }
}

// 策略2：事件复制（创建新的事件流）
class EventMigrationService {
  constructor(
    private sourceStore: EventStore,
    private targetStore: EventStore,
    private registry: EventRegistry
  ) {}

  async migrateAggregate(
    aggregateId: string,
    aggregateType: string
  ): Promise<void> {
    // 读取原始事件
    const events = await this.sourceStore.readStream(
      aggregateId, aggregateType
    );

    // 升级所有事件
    const upgradedEvents = events.map(event => this.registry.upcast(event));

    // 写入新存储
    await this.targetStore.appendToStream(
      aggregateId,
      aggregateType,
      upgradedEvents,
      0
    );
  }

  async migrateAll(aggregateType: string): Promise<void> {
    const aggregateIds = await this.sourceStore.getAllAggregateIds(
      aggregateType
    );

    for (const id of aggregateIds) {
      await this.migrateAggregate(id, aggregateType);
      console.log(`Migrated aggregate: ${id}`);
    }
  }
}
```

---

## 最终一致性处理

事件溯源系统通常是最终一致的，特别是当使用 CQRS 时，读模型的更新是异步的。

### 事件发布与订阅

```typescript
// 事件总线
interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(
    eventType: string,
    handler: EventHandler
  ): void;
}

type EventHandler = (event: DomainEvent) => Promise<void>;

// 基于消息队列的事件总线
class RabbitMQEventBus implements EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private channel: Channel;

  async publish(event: DomainEvent): Promise<void> {
    const exchange = 'domain_events';
    const routingKey = event.eventType;

    await this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true }
    );
  }

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
      this.setupConsumer(eventType);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  private async setupConsumer(eventType: string): Promise<void> {
    const queue = `${eventType}_handlers`;

    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, 'domain_events', eventType);

    this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      const event = JSON.parse(msg.content.toString());
      const handlers = this.handlers.get(eventType) || [];

      try {
        await Promise.all(handlers.map(h => h(event)));
        this.channel.ack(msg);
      } catch (error) {
        // 处理失败，进入死信队列
        this.channel.nack(msg, false, false);
      }
    });
  }
}
```

### 幂等性处理

由于事件可能被重复投递，处理器必须是幂等的：

```typescript
// 幂等性处理器装饰器
class IdempotentEventHandler {
  constructor(
    private handler: EventHandler,
    private processedStore: ProcessedEventStore
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    // 检查事件是否已处理
    const isProcessed = await this.processedStore.isProcessed(event.eventId);

    if (isProcessed) {
      console.log(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    // 处理事件
    await this.handler(event);

    // 标记为已处理
    await this.processedStore.markAsProcessed(event.eventId);
  }
}

// 已处理事件存储
class ProcessedEventStore {
  constructor(private db: Database) {}

  async isProcessed(eventId: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT 1 FROM processed_events WHERE event_id = $1',
      [eventId]
    );
    return result.rows.length > 0;
  }

  async markAsProcessed(eventId: string): Promise<void> {
    await this.db.query(
      'INSERT INTO processed_events (event_id, processed_at) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [eventId, new Date()]
    );
  }
}
```

### 补偿事件模式

当出现问题时，通过追加补偿事件来"撤销"之前的操作：

```typescript
// 补偿事件示例
class OrderSaga {
  async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
    // 获取订单
    const order = await this.orderRepository.getById(event.orderId);

    // 取消订单（追加补偿事件）
    order.cancel(CancellationReason.PaymentFailed);
    await this.orderRepository.save(order);

    // 释放库存（追加补偿事件）
    for (const item of order.items) {
      await this.inventoryService.releaseReservation(
        item.productId,
        item.quantity
      );
    }
  }
}
```

---

## 投影（Projection）构建

投影是将事件流转换为读模型的过程，是 CQRS 查询端的核心。

### 投影处理器

```typescript
// 投影处理器基类
abstract class Projection {
  abstract readonly projectionName: string;

  // 获取当前处理位置
  abstract getCheckpoint(): Promise<number>;

  // 更新处理位置
  abstract saveCheckpoint(position: number): Promise<void>;

  // 处理事件
  abstract handle(event: DomainEvent): Promise<void>;

  // 获取感兴趣的事件类型
  abstract getSubscribedEvents(): string[];
}

// 订单列表投影
class OrderListProjection extends Projection {
  readonly projectionName = 'OrderList';

  constructor(private db: Database) {
    super();
  }

  async getCheckpoint(): Promise<number> {
    const result = await this.db.query(
      'SELECT position FROM projection_checkpoints WHERE name = $1',
      [this.projectionName]
    );
    return result.rows[0]?.position ?? 0;
  }

  async saveCheckpoint(position: number): Promise<void> {
    await this.db.query(
      `INSERT INTO projection_checkpoints (name, position, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (name) DO UPDATE SET position = $2, updated_at = NOW()`,
      [this.projectionName, position]
    );
  }

  getSubscribedEvents(): string[] {
    return [
      'OrderCreated',
      'OrderItemAdded',
      'OrderConfirmed',
      'OrderShipped',
      'OrderDelivered',
      'OrderCancelled'
    ];
  }

  async handle(event: DomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'OrderCreated':
        await this.handleOrderCreated(event);
        break;
      case 'OrderItemAdded':
        await this.handleOrderItemAdded(event);
        break;
      case 'OrderConfirmed':
        await this.handleOrderConfirmed(event);
        break;
      case 'OrderCancelled':
        await this.handleOrderCancelled(event);
        break;
    }
  }

  private async handleOrderCreated(event: DomainEvent): Promise<void> {
    await this.db.query(
      `INSERT INTO order_read_model
       (order_id, customer_id, status, total_amount, items, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        event.aggregateId,
        event.payload.customerId,
        'draft',
        0,
        JSON.stringify([]),
        event.timestamp
      ]
    );
  }

  private async handleOrderItemAdded(event: DomainEvent): Promise<void> {
    const { productId, quantity, price } = event.payload as any;

    // 获取商品名称
    const product = await this.db.query(
      'SELECT name FROM products WHERE id = $1',
      [productId]
    );

    const newItem = {
      productId,
      productName: product.rows[0]?.name || 'Unknown',
      quantity,
      unitPrice: price,
      totalPrice: quantity * price
    };

    await this.db.query(
      `UPDATE order_read_model
       SET items = items || $1::jsonb,
           total_amount = total_amount + $2
       WHERE order_id = $3`,
      [JSON.stringify([newItem]), newItem.totalPrice, event.aggregateId]
    );
  }

  private async handleOrderConfirmed(event: DomainEvent): Promise<void> {
    await this.db.query(
      `UPDATE order_read_model
       SET status = 'confirmed', confirmed_at = $1
       WHERE order_id = $2`,
      [event.timestamp, event.aggregateId]
    );
  }

  private async handleOrderCancelled(event: DomainEvent): Promise<void> {
    await this.db.query(
      `UPDATE order_read_model
       SET status = 'cancelled', cancelled_at = $1
       WHERE order_id = $2`,
      [event.timestamp, event.aggregateId]
    );
  }
}
```

### 投影运行器

```typescript
// 投影运行器
class ProjectionRunner {
  private running = false;
  private projections: Projection[] = [];

  constructor(private eventStore: EventStore) {}

  register(projection: Projection): void {
    this.projections.push(projection);
  }

  async start(): Promise<void> {
    this.running = true;

    while (this.running) {
      for (const projection of this.projections) {
        await this.processProjection(projection);
      }

      // 短暂休眠，避免空轮询
      await this.sleep(100);
    }
  }

  stop(): void {
    this.running = false;
  }

  private async processProjection(projection: Projection): Promise<void> {
    const checkpoint = await projection.getCheckpoint();
    const events = await this.eventStore.readAllEvents(checkpoint, 100);

    const subscribedEvents = projection.getSubscribedEvents();

    for (const event of events) {
      if (subscribedEvents.includes(event.eventType)) {
        await projection.handle(event);
      }
      await projection.saveCheckpoint(event.globalSequence);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 投影重建
class ProjectionRebuilder {
  constructor(
    private eventStore: EventStore,
    private projection: Projection
  ) {}

  async rebuild(): Promise<void> {
    console.log(`Rebuilding projection: ${this.projection.projectionName}`);

    // 清空投影数据
    await this.projection.reset();

    // 重置检查点
    await this.projection.saveCheckpoint(0);

    // 重新处理所有事件
    let position = 0;
    let processedCount = 0;

    while (true) {
      const events = await this.eventStore.readAllEvents(position, 1000);

      if (events.length === 0) break;

      for (const event of events) {
        if (this.projection.getSubscribedEvents().includes(event.eventType)) {
          await this.projection.handle(event);
          processedCount++;
        }
        position = event.globalSequence;
      }

      await this.projection.saveCheckpoint(position);
      console.log(`Processed ${processedCount} events, position: ${position}`);
    }

    console.log(`Projection rebuild complete. Total events: ${processedCount}`);
  }
}
```

---

## 框架选择

### Axon Framework (Java)

Axon 是 Java 生态中最成熟的事件溯源框架：

```java
// 聚合定义
@Aggregate
public class OrderAggregate {

    @AggregateIdentifier
    private String orderId;
    private OrderStatus status;
    private List<OrderItem> items = new ArrayList<>();

    // 命令处理
    @CommandHandler
    public OrderAggregate(CreateOrderCommand command) {
        AggregateLifecycle.apply(new OrderCreatedEvent(
            command.getOrderId(),
            command.getCustomerId()
        ));
    }

    @CommandHandler
    public void handle(AddItemCommand command) {
        if (status != OrderStatus.DRAFT) {
            throw new IllegalStateException("Cannot add items to non-draft order");
        }
        AggregateLifecycle.apply(new ItemAddedEvent(
            orderId,
            command.getProductId(),
            command.getQuantity(),
            command.getPrice()
        ));
    }

    @CommandHandler
    public void handle(ConfirmOrderCommand command) {
        if (items.isEmpty()) {
            throw new IllegalStateException("Cannot confirm empty order");
        }
        AggregateLifecycle.apply(new OrderConfirmedEvent(orderId));
    }

    // 事件处理
    @EventSourcingHandler
    public void on(OrderCreatedEvent event) {
        this.orderId = event.getOrderId();
        this.status = OrderStatus.DRAFT;
    }

    @EventSourcingHandler
    public void on(ItemAddedEvent event) {
        this.items.add(new OrderItem(
            event.getProductId(),
            event.getQuantity(),
            event.getPrice()
        ));
    }

    @EventSourcingHandler
    public void on(OrderConfirmedEvent event) {
        this.status = OrderStatus.CONFIRMED;
    }
}

// 投影处理
@Component
public class OrderProjection {

    private final OrderReadRepository repository;

    @EventHandler
    public void on(OrderCreatedEvent event) {
        OrderReadModel model = new OrderReadModel();
        model.setOrderId(event.getOrderId());
        model.setCustomerId(event.getCustomerId());
        model.setStatus("DRAFT");
        repository.save(model);
    }

    @EventHandler
    public void on(OrderConfirmedEvent event) {
        OrderReadModel model = repository.findById(event.getOrderId())
            .orElseThrow();
        model.setStatus("CONFIRMED");
        model.setConfirmedAt(Instant.now());
        repository.save(model);
    }
}
```

### EventStoreDB

EventStoreDB 是专门为事件溯源设计的数据库：

```typescript
import { EventStoreDBClient, jsonEvent } from '@eventstore/db-client';

// 连接 EventStoreDB
const client = EventStoreDBClient.connectionString(
  'esdb://localhost:2113?tls=false'
);

// 追加事件
async function appendEvents(
  streamName: string,
  events: DomainEvent[],
  expectedRevision: bigint | 'no_stream' | 'any'
): Promise<void> {
  const esEvents = events.map(event =>
    jsonEvent({
      type: event.eventType,
      data: event.payload,
      metadata: event.metadata
    })
  );

  await client.appendToStream(streamName, esEvents, {
    expectedRevision
  });
}

// 读取事件流
async function readStream(streamName: string): Promise<DomainEvent[]> {
  const events: DomainEvent[] = [];

  const readResult = client.readStream(streamName, {
    direction: 'forwards',
    fromRevision: 'start'
  });

  for await (const resolvedEvent of readResult) {
    if (resolvedEvent.event) {
      events.push({
        eventId: resolvedEvent.event.id,
        eventType: resolvedEvent.event.type,
        aggregateId: streamName.split('-')[1],
        aggregateType: streamName.split('-')[0],
        version: Number(resolvedEvent.event.revision),
        timestamp: resolvedEvent.event.created,
        payload: resolvedEvent.event.data as Record<string, unknown>,
        metadata: resolvedEvent.event.metadata as EventMetadata
      });
    }
  }

  return events;
}

// 订阅事件流
async function subscribeToAll(
  handler: (event: DomainEvent) => Promise<void>
): Promise<void> {
  const subscription = client.subscribeToAll({
    fromPosition: 'start'
  });

  for await (const resolvedEvent of subscription) {
    if (resolvedEvent.event && !resolvedEvent.event.type.startsWith('$')) {
      const event: DomainEvent = {
        eventId: resolvedEvent.event.id,
        eventType: resolvedEvent.event.type,
        aggregateId: '',
        aggregateType: '',
        version: 0,
        timestamp: resolvedEvent.event.created,
        payload: resolvedEvent.event.data as Record<string, unknown>,
        metadata: resolvedEvent.event.metadata as EventMetadata
      };

      await handler(event);
    }
  }
}
```

### 框架对比

| 特性 | Axon Framework | EventStoreDB | Marten (C#) |
|------|---------------|--------------|-------------|
| 语言 | Java | 多语言 | C# |
| 类型 | 应用框架 | 数据库 | ORM + ES |
| 学习曲线 | 中等 | 低 | 中等 |
| 功能完整性 | 高 | 高 | 高 |
| 分布式支持 | Axon Server | 原生集群 | 依赖 PostgreSQL |
| 社区活跃度 | 高 | 高 | 中等 |

---

## 适用场景与权衡

### 适用场景

**1. 审计要求严格的系统**

金融、医疗、法律等领域需要完整的操作历史：

```typescript
// 金融交易系统
class TradingAccount extends AggregateRoot {
  // 每笔交易都被记录为事件，满足监管要求
  deposit(amount: Money, source: string): void {
    this.applyChange({
      eventType: 'MoneyDeposited',
      payload: {
        amount: amount.value,
        currency: amount.currency,
        source,
        balanceAfter: this.balance.add(amount).value
      }
    });
  }
}
```

**2. 需要时间旅行的系统**

需要查看任意时间点状态的场景：

```typescript
// 查看某个时间点的账户余额
async function getBalanceAtTime(
  accountId: string,
  timestamp: Date
): Promise<Money> {
  const events = await eventStore.readStream(accountId, 'Account');

  const account = new Account();
  for (const event of events) {
    if (event.timestamp <= timestamp) {
      account.apply(event);
    } else {
      break;
    }
  }

  return account.balance;
}
```

**3. 复杂业务流程**

涉及多步骤、需要补偿的业务流程：

```typescript
// 订单处理 Saga
class OrderProcessingSaga {
  private steps: SagaStep[] = [];

  async execute(): Promise<void> {
    for (const step of this.steps) {
      try {
        await step.execute();
        // 执行成功事件被记录
      } catch (error) {
        // 执行补偿
        await this.compensate();
        throw error;
      }
    }
  }

  private async compensate(): Promise<void> {
    // 反向执行补偿操作
    for (const step of [...this.steps].reverse()) {
      if (step.executed) {
        await step.compensate();
      }
    }
  }
}
```

**4. 事件驱动的集成场景**

微服务间通过事件进行集成：

```typescript
// 库存服务监听订单事件
class InventoryEventHandler {
  @EventHandler('OrderConfirmed')
  async handleOrderConfirmed(event: OrderConfirmedEvent): Promise<void> {
    for (const item of event.items) {
      await this.inventoryService.reserve(
        item.productId,
        item.quantity
      );
    }
  }

  @EventHandler('OrderCancelled')
  async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    for (const item of event.items) {
      await this.inventoryService.release(
        item.productId,
        item.quantity
      );
    }
  }
}
```

### 不适用场景

1. **简单 CRUD 应用**：事件溯源增加的复杂性不值得
2. **需要频繁更新的数据**：如实时计数器、会话数据
3. **存储空间受限**：事件存储会不断增长
4. **团队经验不足**：需要团队熟悉 DDD 和事件驱动架构

### 权衡分析

| 优势 | 劣势 |
|------|------|
| 完整审计追踪 | 存储空间持续增长 |
| 时间旅行能力 | 查询复杂度增加 |
| 易于调试问题 | 学习曲线陡峭 |
| 自然支持事件驱动 | 最终一致性处理复杂 |
| 高性能写入 | 读取需要重建或投影 |
| 易于扩展和集成 | 事件版本演进困难 |

---

## 面试要点

### 常见面试题

**1. 什么是事件溯源？它与传统 CRUD 有什么区别？**

答题要点：
- 存储事件序列而非最终状态
- 不可变性和完整历史
- 可以重建任意时间点状态
- 与 CRUD 的数据模型对比

**2. 事件溯源中如何处理并发问题？**

```typescript
// 使用乐观并发控制
async function appendEvents(
  aggregateId: string,
  events: DomainEvent[],
  expectedVersion: number
): Promise<void> {
  const currentVersion = await getCurrentVersion(aggregateId);

  if (currentVersion !== expectedVersion) {
    throw new ConcurrencyError(
      `Aggregate ${aggregateId} has been modified. ` +
      `Expected version: ${expectedVersion}, Current: ${currentVersion}`
    );
  }

  // 继续保存事件...
}
```

**3. 如何处理事件溯源中的性能问题？**

答题要点：
- 快照机制减少重放时间
- 投影优化读取性能
- 事件分区和归档策略
- 异步投影处理

**4. 事件版本演进如何处理？**

答题要点：
- Upcasting 升级策略
- 事件版本号管理
- 向后兼容性设计
- 事件迁移工具

**5. 事件溯源与 CQRS 是什么关系？**

答题要点：
- 可以独立使用，但经常结合
- CQRS 分离读写模型
- 事件溯源提供写模型
- 投影构建读模型

### 系统设计题示例

**设计一个支持事件溯源的订单系统**

```
设计要点：

1. 事件存储设计
   - PostgreSQL/EventStoreDB 作为事件存储
   - 事件表结构设计
   - 索引优化

2. 聚合设计
   - Order 聚合根
   - 命令和事件定义
   - 业务规则校验

3. 读模型设计
   - 订单列表投影
   - 订单详情投影
   - 统计报表投影

4. 一致性处理
   - 乐观并发控制
   - 幂等性处理
   - 事件发布保证

5. 扩展性考虑
   - 快照策略
   - 事件归档
   - 分布式部署
```

### 关键概念总结

```
┌─────────────────────────────────────────────────────────────┐
│                    Event Sourcing 核心概念                   │
├─────────────────────────────────────────────────────────────┤
│  事件存储                                                    │
│  ├── 事件结构：eventId, type, aggregateId, version, payload │
│  ├── 并发控制：乐观锁 + 版本号                              │
│  └── 存储选型：PostgreSQL, EventStoreDB, DynamoDB           │
├─────────────────────────────────────────────────────────────┤
│  聚合重建                                                    │
│  ├── 从事件流重建状态                                        │
│  ├── 快照优化：定期快照 + 增量事件                          │
│  └── 仓储模式：加载 -> 修改 -> 保存                         │
├─────────────────────────────────────────────────────────────┤
│  CQRS 结合                                                   │
│  ├── 命令端：聚合 + 事件存储                                │
│  ├── 查询端：投影 + 读模型                                  │
│  └── 同步方式：同步/异步投影                                │
├─────────────────────────────────────────────────────────────┤
│  版本演进                                                    │
│  ├── Upcasting：读取时升级                                  │
│  ├── 事件迁移：批量转换                                      │
│  └── 向后兼容：添加字段 + 默认值                            │
├─────────────────────────────────────────────────────────────┤
│  最终一致性                                                  │
│  ├── 事件发布：消息队列 + 事件总线                          │
│  ├── 幂等处理：去重表 + 幂等键                              │
│  └── 补偿机制：补偿事件 + Saga                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 总结

事件溯源是一种强大的架构模式，它通过存储事件序列而非当前状态，为系统提供了完整的审计追踪、时间旅行和高可扩展性。虽然它增加了系统复杂性，但在审计要求严格、业务流程复杂的场景中，这种复杂性是值得的。

掌握事件溯源需要理解以下核心要点：

1. **事件是一等公民**：事件不可变，代表已发生的事实
2. **状态是派生的**：通过重放事件重建状态
3. **与 CQRS 互补**：读写分离提升性能
4. **版本演进谨慎**：事件结构变更需要周密计划
5. **最终一致性是常态**：接受并正确处理一致性延迟

事件溯源不是银弹，需要根据具体场景权衡使用。但一旦掌握，它将成为构建复杂、可靠系统的有力工具。
