---
title: 领域事件
description: 理解和实现领域驱动设计中的领域事件
track: architecture
section: ddd
difficulty: advanced
tags:
  - 领域事件
  - DDD
  - 事件驱动
  - 解耦
status: imported
origin: old/src/content/docs/architecture/domain-events.zh.md
divergence: 0.265
issues: []
legacy:
  category: Architecture
  subcategory: DDD
  order: 19
  lastUpdated: 2026-01-07
---

## 概念解释

领域事件是领域驱动设计 (DDD) 中的核心概念之一，它表示在领域中发生的有业务意义的事情。领域事件是连接不同聚合、实现系统解耦、支撑最终一致性的关键机制。

### 什么是领域事件？

领域事件代表了在业务领域中已经发生的事实。它是对"过去已发生的事情"的描述，具有不可变性。领域事件通常由聚合根在执行业务操作后产生，然后被其他组件消费和处理。

**领域事件的核心特征：**

- **表示已发生的事实**：使用过去时态命名（如 OrderPlaced、PaymentCompleted）
- **不可变性**：一旦创建就不能修改
- **包含上下文信息**：携带事件发生时的相关数据
- **业务语义明确**：使用统一语言命名，业务人员能够理解

### 为什么需要领域事件？

```
传统方式（紧耦合）：
┌─────────┐     ┌─────────┐     ┌─────────┐
│  订单   │────▶│  库存   │────▶│  通知   │
│  服务   │     │  服务   │     │  服务   │
└─────────┘     └─────────┘     └─────────┘
订单服务直接调用库存服务，库存服务再调用通知服务
问题：高耦合、难以扩展、单点故障影响全局

事件驱动方式（松耦合）：
┌─────────┐     ┌─────────────────┐     ┌─────────┐
│  订单   │────▶│   事件总线      │◀────│  库存   │
│  服务   │     │ OrderPlaced事件 │     │  服务   │
└─────────┘     └─────────────────┘     └─────────┘
                        │
                        ▼
                ┌─────────┐
                │  通知   │
                │  服务   │
                └─────────┘
各服务独立监听事件，互不依赖
优势：低耦合、易扩展、故障隔离
```

领域事件解决的核心问题：

1. **聚合间解耦**：不同聚合通过事件通信，无需直接引用
2. **实现最终一致性**：跨聚合的业务规则可以异步执行
3. **系统可扩展性**：新功能只需订阅现有事件，无需修改原有代码
4. **审计与追溯**：事件序列可以重建业务流程的完整历史

---

## 领域事件的设计

### 事件命名规范

领域事件应该使用业务语言命名，采用过去时态，清晰表达发生了什么：

```typescript
// 好的命名：使用过去时态，业务语义明确
OrderPlaced          // 订单已下达
PaymentReceived      // 付款已收到
InventoryReserved    // 库存已预留
ShipmentDispatched   // 货物已发出
CustomerRegistered   // 客户已注册

// 不好的命名：命令式、技术化
CreateOrder          // 这是命令，不是事件
OrderCreation        // 名词化，不清晰
SaveOrderToDatabase  // 技术实现细节
OrderHandler         // 处理器命名
```

### 事件结构设计

一个完整的领域事件应包含以下信息：

```typescript
// 领域事件基类
abstract class DomainEvent {
  // 事件唯一标识
  public readonly eventId: string;

  // 事件类型
  public readonly eventType: string;

  // 事件发生时间
  public readonly occurredOn: Date;

  // 事件版本（用于事件演进）
  public readonly eventVersion: number;

  constructor() {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.eventType = this.constructor.name;
    this.eventVersion = 1;
  }

  // 获取聚合根标识
  abstract getAggregateId(): string;

  // 获取聚合类型
  abstract getAggregateType(): string;
}

// 事件元数据
interface EventMetadata {
  // 关联ID：追踪一系列相关事件
  correlationId: string;

  // 因果ID：引起此事件的事件ID
  causationId?: string;

  // 操作用户
  userId?: string;

  // 请求来源
  source?: string;

  // 追踪ID（分布式追踪）
  traceId?: string;
}
```

### 具体事件实现

```typescript
// 订单已下达事件
class OrderPlacedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly items: OrderItemSnapshot[],
    public readonly totalAmount: Money,
    public readonly shippingAddress: Address,
    public readonly metadata?: EventMetadata
  ) {
    super();
  }

  getAggregateId(): string {
    return this.orderId;
  }

  getAggregateType(): string {
    return 'Order';
  }
}

// 订单项快照（事件中使用的值对象）
interface OrderItemSnapshot {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

// 付款已完成事件
class PaymentCompletedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly amount: Money,
    public readonly paymentMethod: string,
    public readonly transactionId: string,
    public readonly paidAt: Date
  ) {
    super();
  }

  getAggregateId(): string {
    return this.paymentId;
  }

  getAggregateType(): string {
    return 'Payment';
  }
}

// 库存已预留事件
class InventoryReservedEvent extends DomainEvent {
  constructor(
    public readonly reservationId: string,
    public readonly orderId: string,
    public readonly items: ReservationItemSnapshot[],
    public readonly warehouseId: string,
    public readonly expiresAt: Date
  ) {
    super();
  }

  getAggregateId(): string {
    return this.reservationId;
  }

  getAggregateType(): string {
    return 'InventoryReservation';
  }
}

// 订单已发货事件
class OrderShippedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly trackingNumber: string,
    public readonly carrier: string,
    public readonly estimatedDelivery: Date,
    public readonly shippedFrom: string
  ) {
    super();
  }

  getAggregateId(): string {
    return this.orderId;
  }

  getAggregateType(): string {
    return 'Order';
  }
}
```

### 事件内容设计原则

**1. 包含足够的上下文信息**

```typescript
// 不好的设计：信息不足，处理器需要额外查询
class OrderPlacedEvent extends DomainEvent {
  constructor(public readonly orderId: string) {
    super();
  }
}

// 好的设计：包含处理所需的关键信息
class OrderPlacedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly items: OrderItemSnapshot[],
    public readonly totalAmount: Money,
    public readonly shippingAddress: Address
  ) {
    super();
  }
}
```

**2. 使用快照而非引用**

```typescript
// 不好的设计：包含实体引用
class OrderPlacedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly customer: Customer,  // 实体引用
    public readonly items: OrderItem[]   // 实体引用
  ) {
    super();
  }
}

// 好的设计：使用不可变的快照数据
class OrderPlacedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,        // ID引用
    public readonly customerName: string,      // 快照数据
    public readonly items: OrderItemSnapshot[] // 快照数据
  ) {
    super();
  }
}
```

**3. 避免敏感信息**

```typescript
// 不好的设计：包含敏感信息
class PaymentCompletedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly cardNumber: string,    // 敏感：完整卡号
    public readonly cvv: string            // 敏感：CVV码
  ) {
    super();
  }
}

// 好的设计：脱敏或省略敏感信息
class PaymentCompletedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly cardLastFour: string,  // 只保留后四位
    public readonly paymentMethod: string  // 支付方式
  ) {
    super();
  }
}
```

---

## 发布与订阅机制

### 事件发布

#### 聚合内部收集事件

```typescript
// 聚合根基类：支持事件收集
abstract class AggregateRoot {
  private readonly _domainEvents: DomainEvent[] = [];

  // 获取待发布的事件
  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  // 添加领域事件
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  // 清除已发布的事件
  clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }
}

// 订单聚合根
class Order extends AggregateRoot {
  private readonly id: OrderId;
  private status: OrderStatus;
  private items: OrderItem[];
  private customerId: CustomerId;
  private shippingAddress: Address;
  private totalAmount: Money;

  // 下单
  place(): void {
    if (this.items.length === 0) {
      throw new EmptyOrderError('订单不能为空');
    }

    if (this.status !== OrderStatus.Draft) {
      throw new InvalidOrderStateError('只有草稿订单可以提交');
    }

    this.status = OrderStatus.Placed;

    // 添加领域事件
    this.addDomainEvent(new OrderPlacedEvent(
      this.id.value,
      this.customerId.value,
      this.items.map(item => item.toSnapshot()),
      this.totalAmount,
      this.shippingAddress
    ));
  }

  // 确认订单
  confirm(): void {
    if (this.status !== OrderStatus.Placed) {
      throw new InvalidOrderStateError('只有已下单的订单可以确认');
    }

    this.status = OrderStatus.Confirmed;

    this.addDomainEvent(new OrderConfirmedEvent(
      this.id.value,
      new Date()
    ));
  }

  // 发货
  ship(trackingNumber: string, carrier: string): void {
    if (this.status !== OrderStatus.Confirmed) {
      throw new InvalidOrderStateError('只有已确认的订单可以发货');
    }

    this.status = OrderStatus.Shipped;

    this.addDomainEvent(new OrderShippedEvent(
      this.id.value,
      trackingNumber,
      carrier,
      this.calculateEstimatedDelivery(),
      this.warehouseId
    ));
  }

  // 取消订单
  cancel(reason: CancellationReason): void {
    if (!this.canBeCancelled()) {
      throw new InvalidOrderStateError('当前状态不允许取消');
    }

    const previousStatus = this.status;
    this.status = OrderStatus.Cancelled;

    this.addDomainEvent(new OrderCancelledEvent(
      this.id.value,
      reason,
      previousStatus
    ));
  }

  private canBeCancelled(): boolean {
    return [OrderStatus.Draft, OrderStatus.Placed, OrderStatus.Confirmed]
      .includes(this.status);
  }
}
```

#### 仓储层发布事件

```typescript
// 事件发布器接口
interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}

// 订单仓储实现
class PostgresOrderRepository implements OrderRepository {
  constructor(
    private readonly db: Database,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  async save(order: Order): Promise<void> {
    await this.db.transaction(async (tx) => {
      // 1. 持久化聚合状态
      await this.persistOrder(tx, order);

      // 2. 持久化领域事件（事件表）
      const events = order.domainEvents;
      for (const event of events) {
        await this.persistEvent(tx, event);
      }
    });

    // 3. 发布领域事件（事务提交后）
    const events = order.domainEvents;
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }

    // 4. 清除已发布的事件
    order.clearDomainEvents();
  }

  private async persistEvent(tx: Transaction, event: DomainEvent): Promise<void> {
    await tx.query(
      `INSERT INTO domain_events
       (event_id, event_type, aggregate_id, aggregate_type, payload, occurred_on)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        event.eventId,
        event.eventType,
        event.getAggregateId(),
        event.getAggregateType(),
        JSON.stringify(event),
        event.occurredOn
      ]
    );
  }
}
```

### 事件订阅

#### 事件处理器接口

```typescript
// 事件处理器接口
interface DomainEventHandler<T extends DomainEvent> {
  // 处理事件
  handle(event: T): Promise<void>;

  // 获取处理的事件类型
  getEventType(): string;
}

// 事件总线接口
interface EventBus {
  // 发布事件
  publish(event: DomainEvent): Promise<void>;

  // 订阅事件
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): void;

  // 取消订阅
  unsubscribe(eventType: string, handlerId: string): void;
}
```

#### 内存事件总线实现

```typescript
// 简单的内存事件总线（适合单体应用）
class InMemoryEventBus implements EventBus {
  private handlers: Map<string, DomainEventHandler<DomainEvent>[]> = new Map();

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler as DomainEventHandler<DomainEvent>);
    this.handlers.set(eventType, handlers);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];

    // 并行执行所有处理器
    const results = await Promise.allSettled(
      handlers.map(handler => handler.handle(event))
    );

    // 记录失败的处理
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `Handler failed for event ${event.eventId}:`,
          result.reason
        );
      }
    });
  }

  unsubscribe(eventType: string, handlerId: string): void {
    const handlers = this.handlers.get(eventType) || [];
    const index = handlers.findIndex(h => h.constructor.name === handlerId);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }
}
```

#### 消息队列事件总线实现

```typescript
// 基于 RabbitMQ 的事件总线（适合分布式系统）
class RabbitMQEventBus implements EventBus {
  private channel: Channel;
  private readonly exchange = 'domain_events';

  constructor(private connection: Connection) {}

  async initialize(): Promise<void> {
    this.channel = await this.connection.createChannel();

    // 创建事件交换机
    await this.channel.assertExchange(this.exchange, 'topic', {
      durable: true
    });
  }

  async publish(event: DomainEvent): Promise<void> {
    const routingKey = `${event.getAggregateType()}.${event.eventType}`;
    const message = Buffer.from(JSON.stringify({
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.getAggregateId(),
      aggregateType: event.getAggregateType(),
      occurredOn: event.occurredOn,
      payload: event
    }));

    this.channel.publish(this.exchange, routingKey, message, {
      persistent: true,
      messageId: event.eventId,
      timestamp: event.occurredOn.getTime(),
      contentType: 'application/json'
    });
  }

  async subscribe<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): Promise<void> {
    // 为每个处理器创建队列
    const queueName = `${handler.constructor.name}_${eventType}`;

    await this.channel.assertQueue(queueName, {
      durable: true,
      deadLetterExchange: 'domain_events_dlx'
    });

    // 绑定到交换机
    await this.channel.bindQueue(queueName, this.exchange, `*.${eventType}`);

    // 消费消息
    this.channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const eventData = JSON.parse(msg.content.toString());
        await handler.handle(eventData.payload as T);
        this.channel.ack(msg);
      } catch (error) {
        console.error(`Failed to handle event:`, error);
        // 拒绝消息，进入死信队列
        this.channel.nack(msg, false, false);
      }
    });
  }
}
```

---

## 事件处理器实现

### 基础事件处理器

```typescript
// 库存预留处理器：监听订单下达事件
class InventoryReservationHandler implements DomainEventHandler<OrderPlacedEvent> {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly orderRepository: OrderRepository
  ) {}

  getEventType(): string {
    return 'OrderPlacedEvent';
  }

  async handle(event: OrderPlacedEvent): Promise<void> {
    try {
      // 为订单预留库存
      const reservation = await this.inventoryService.reserveForOrder(
        event.orderId,
        event.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      );

      console.log(`Inventory reserved for order ${event.orderId}`);
    } catch (error) {
      if (error instanceof InsufficientInventoryError) {
        // 库存不足，取消订单
        const order = await this.orderRepository.getById(
          new OrderId(event.orderId)
        );
        order.cancel(CancellationReason.InsufficientInventory);
        await this.orderRepository.save(order);
      }
      throw error;
    }
  }
}

// 通知发送处理器：监听订单确认事件
class OrderConfirmationNotificationHandler
  implements DomainEventHandler<OrderConfirmedEvent> {

  constructor(
    private readonly notificationService: NotificationService,
    private readonly customerRepository: CustomerRepository,
    private readonly orderRepository: OrderRepository
  ) {}

  getEventType(): string {
    return 'OrderConfirmedEvent';
  }

  async handle(event: OrderConfirmedEvent): Promise<void> {
    const order = await this.orderRepository.getById(
      new OrderId(event.orderId)
    );
    const customer = await this.customerRepository.getById(
      order.getCustomerId()
    );

    await this.notificationService.send({
      to: customer.getEmail(),
      template: 'order-confirmed',
      data: {
        customerName: customer.getName(),
        orderId: event.orderId,
        totalAmount: order.getTotalAmount().toString(),
        confirmedAt: event.confirmedAt
      }
    });
  }
}

// 物流处理器：监听订单发货事件
class ShipmentTrackingHandler implements DomainEventHandler<OrderShippedEvent> {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly notificationService: NotificationService
  ) {}

  getEventType(): string {
    return 'OrderShippedEvent';
  }

  async handle(event: OrderShippedEvent): Promise<void> {
    // 创建物流追踪记录
    await this.trackingService.createTracking({
      orderId: event.orderId,
      trackingNumber: event.trackingNumber,
      carrier: event.carrier,
      estimatedDelivery: event.estimatedDelivery
    });

    // 发送发货通知
    await this.notificationService.sendShipmentNotification(
      event.orderId,
      event.trackingNumber
    );
  }
}
```

### 幂等性处理

由于事件可能被重复投递，处理器必须保证幂等性：

```typescript
// 幂等事件处理器基类
abstract class IdempotentEventHandler<T extends DomainEvent>
  implements DomainEventHandler<T> {

  constructor(
    private readonly processedEventStore: ProcessedEventStore
  ) {}

  async handle(event: T): Promise<void> {
    // 检查事件是否已处理
    const isProcessed = await this.processedEventStore.isProcessed(
      this.getHandlerId(),
      event.eventId
    );

    if (isProcessed) {
      console.log(`Event ${event.eventId} already processed by ${this.getHandlerId()}`);
      return;
    }

    // 处理事件
    await this.doHandle(event);

    // 标记为已处理
    await this.processedEventStore.markAsProcessed(
      this.getHandlerId(),
      event.eventId
    );
  }

  abstract getEventType(): string;
  abstract getHandlerId(): string;
  protected abstract doHandle(event: T): Promise<void>;
}

// 已处理事件存储
interface ProcessedEventStore {
  isProcessed(handlerId: string, eventId: string): Promise<boolean>;
  markAsProcessed(handlerId: string, eventId: string): Promise<void>;
}

// PostgreSQL 实现
class PostgresProcessedEventStore implements ProcessedEventStore {
  constructor(private readonly db: Database) {}

  async isProcessed(handlerId: string, eventId: string): Promise<boolean> {
    const result = await this.db.query(
      `SELECT 1 FROM processed_events
       WHERE handler_id = $1 AND event_id = $2`,
      [handlerId, eventId]
    );
    return result.rows.length > 0;
  }

  async markAsProcessed(handlerId: string, eventId: string): Promise<void> {
    await this.db.query(
      `INSERT INTO processed_events (handler_id, event_id, processed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT DO NOTHING`,
      [handlerId, eventId]
    );
  }
}

// 使用幂等处理器
class IdempotentInventoryHandler extends IdempotentEventHandler<OrderPlacedEvent> {
  constructor(
    processedEventStore: ProcessedEventStore,
    private readonly inventoryService: InventoryService
  ) {
    super(processedEventStore);
  }

  getEventType(): string {
    return 'OrderPlacedEvent';
  }

  getHandlerId(): string {
    return 'InventoryReservationHandler';
  }

  protected async doHandle(event: OrderPlacedEvent): Promise<void> {
    await this.inventoryService.reserveForOrder(
      event.orderId,
      event.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    );
  }
}
```

### 事件处理器注册

```typescript
// 事件处理器注册器
class EventHandlerRegistry {
  constructor(private readonly eventBus: EventBus) {}

  registerHandlers(
    inventoryService: InventoryService,
    notificationService: NotificationService,
    orderRepository: OrderRepository,
    customerRepository: CustomerRepository,
    trackingService: TrackingService,
    processedEventStore: ProcessedEventStore
  ): void {
    // 注册库存处理器
    this.eventBus.subscribe(
      'OrderPlacedEvent',
      new IdempotentInventoryHandler(processedEventStore, inventoryService)
    );

    // 注册通知处理器
    this.eventBus.subscribe(
      'OrderConfirmedEvent',
      new OrderConfirmationNotificationHandler(
        notificationService,
        customerRepository,
        orderRepository
      )
    );

    // 注册物流处理器
    this.eventBus.subscribe(
      'OrderShippedEvent',
      new ShipmentTrackingHandler(trackingService, notificationService)
    );

    // 注册取消处理器
    this.eventBus.subscribe(
      'OrderCancelledEvent',
      new OrderCancellationHandler(inventoryService, notificationService)
    );
  }
}
```

---

## 最终一致性

### 理解最终一致性

在领域事件驱动的架构中，不同聚合之间的一致性通常是最终一致的，而非强一致。

```
强一致性（同步）：
┌─────────┐  同步调用  ┌─────────┐
│  订单   │──────────▶│  库存   │
│  服务   │◀──────────│  服务   │
└─────────┘   响应    └─────────┘
特点：调用完成后数据立即一致
问题：高耦合、性能瓶颈、单点故障

最终一致性（异步）：
┌─────────┐   事件    ┌─────────┐
│  订单   │──────────▶│ 事件总线│
│  服务   │           └────┬────┘
└─────────┘                │
  状态：已下单              │ 异步
                          ▼
                    ┌─────────┐
                    │  库存   │
                    │  服务   │
                    └─────────┘
                    状态：已预留（稍后一致）
特点：订单服务完成后，库存服务最终会保持一致
优势：低耦合、高性能、故障隔离
```

### 最终一致性的实现策略

#### Saga 模式

Saga 是一系列本地事务，通过事件协调跨聚合的业务流程：

```typescript
// 订单 Saga：协调订单创建流程
class OrderSaga {
  private state: SagaState = SagaState.Started;
  private orderId: string;

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryService: InventoryService,
    private readonly paymentService: PaymentService,
    private readonly eventBus: EventBus
  ) {}

  // 处理订单下达事件
  async handleOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    this.orderId = event.orderId;

    try {
      // 步骤1：预留库存
      await this.reserveInventory(event);
      this.state = SagaState.InventoryReserved;

      // 步骤2：处理支付（如果是货到付款则跳过）
      // 支付通常由用户触发，这里只是示例
    } catch (error) {
      await this.compensate();
      throw error;
    }
  }

  // 处理支付完成事件
  async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    if (event.orderId !== this.orderId) return;

    try {
      // 步骤3：确认库存扣减
      await this.confirmInventory();
      this.state = SagaState.InventoryConfirmed;

      // 步骤4：确认订单
      await this.confirmOrder();
      this.state = SagaState.Completed;
    } catch (error) {
      await this.compensate();
      throw error;
    }
  }

  // 处理支付失败事件
  async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
    if (event.orderId !== this.orderId) return;

    await this.compensate();
  }

  // 补偿操作
  private async compensate(): Promise<void> {
    switch (this.state) {
      case SagaState.InventoryConfirmed:
        await this.rollbackInventoryConfirmation();
        // 继续往下补偿
      case SagaState.InventoryReserved:
        await this.releaseInventory();
        // 继续往下补偿
      case SagaState.Started:
        await this.cancelOrder();
        break;
    }
    this.state = SagaState.Compensated;
  }

  private async reserveInventory(event: OrderPlacedEvent): Promise<void> {
    await this.inventoryService.reserve(event.orderId, event.items);
  }

  private async releaseInventory(): Promise<void> {
    await this.inventoryService.release(this.orderId);
  }

  private async confirmInventory(): Promise<void> {
    await this.inventoryService.confirm(this.orderId);
  }

  private async rollbackInventoryConfirmation(): Promise<void> {
    await this.inventoryService.rollbackConfirmation(this.orderId);
  }

  private async confirmOrder(): Promise<void> {
    const order = await this.orderRepository.getById(new OrderId(this.orderId));
    order.confirm();
    await this.orderRepository.save(order);
  }

  private async cancelOrder(): Promise<void> {
    const order = await this.orderRepository.getById(new OrderId(this.orderId));
    order.cancel(CancellationReason.SagaCompensation);
    await this.orderRepository.save(order);
  }
}

enum SagaState {
  Started = 'STARTED',
  InventoryReserved = 'INVENTORY_RESERVED',
  InventoryConfirmed = 'INVENTORY_CONFIRMED',
  Completed = 'COMPLETED',
  Compensated = 'COMPENSATED'
}
```

#### 补偿事件模式

通过追加补偿事件来"撤销"之前的操作：

```typescript
// 库存已释放事件（补偿事件）
class InventoryReleasedEvent extends DomainEvent {
  constructor(
    public readonly reservationId: string,
    public readonly orderId: string,
    public readonly reason: string,
    public readonly items: ReservationItemSnapshot[]
  ) {
    super();
  }

  getAggregateId(): string {
    return this.reservationId;
  }

  getAggregateType(): string {
    return 'InventoryReservation';
  }
}

// 库存预留聚合
class InventoryReservation extends AggregateRoot {
  private id: ReservationId;
  private orderId: OrderId;
  private items: ReservationItem[];
  private status: ReservationStatus;

  // 预留库存
  static create(
    id: ReservationId,
    orderId: OrderId,
    items: ReservationItem[]
  ): InventoryReservation {
    const reservation = new InventoryReservation();
    reservation.id = id;
    reservation.orderId = orderId;
    reservation.items = items;
    reservation.status = ReservationStatus.Reserved;

    reservation.addDomainEvent(new InventoryReservedEvent(
      id.value,
      orderId.value,
      items.map(i => i.toSnapshot()),
      'default-warehouse',
      new Date(Date.now() + 30 * 60 * 1000) // 30分钟过期
    ));

    return reservation;
  }

  // 释放库存（补偿操作）
  release(reason: string): void {
    if (this.status !== ReservationStatus.Reserved) {
      throw new InvalidReservationStateError('只有已预留的库存可以释放');
    }

    this.status = ReservationStatus.Released;

    // 追加补偿事件
    this.addDomainEvent(new InventoryReleasedEvent(
      this.id.value,
      this.orderId.value,
      reason,
      this.items.map(i => i.toSnapshot())
    ));
  }

  // 确认扣减
  confirm(): void {
    if (this.status !== ReservationStatus.Reserved) {
      throw new InvalidReservationStateError('只有已预留的库存可以确认');
    }

    this.status = ReservationStatus.Confirmed;

    this.addDomainEvent(new InventoryDeductedEvent(
      this.id.value,
      this.orderId.value,
      this.items.map(i => i.toSnapshot())
    ));
  }
}
```

#### 事件重试与死信队列

```typescript
// 带重试的事件处理器
class RetryableEventHandler<T extends DomainEvent> implements DomainEventHandler<T> {
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 5000, 30000]; // 1秒, 5秒, 30秒

  constructor(
    private readonly innerHandler: DomainEventHandler<T>,
    private readonly deadLetterQueue: DeadLetterQueue
  ) {}

  getEventType(): string {
    return this.innerHandler.getEventType();
  }

  async handle(event: T): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await this.innerHandler.handle(event);
        return; // 成功
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt + 1} failed:`, error);

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelays[attempt]);
        }
      }
    }

    // 所有重试都失败，发送到死信队列
    await this.deadLetterQueue.send({
      event,
      error: lastError!.message,
      attempts: this.maxRetries + 1,
      timestamp: new Date()
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 死信队列接口
interface DeadLetterQueue {
  send(message: DeadLetterMessage): Promise<void>;
  process(handler: (message: DeadLetterMessage) => Promise<void>): Promise<void>;
}

interface DeadLetterMessage {
  event: DomainEvent;
  error: string;
  attempts: number;
  timestamp: Date;
}
```

---

## 与事件溯源的集成

领域事件是事件溯源 (Event Sourcing) 的基础。在事件溯源架构中，领域事件不仅用于通知，还是持久化状态的主要方式。

### 事件溯源中的聚合

```typescript
// 事件溯源聚合基类
abstract class EventSourcedAggregate {
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
    this.version++;

    if (isNew) {
      this.changes.push(event);
    }
  }

  // 子类实现具体的事件应用逻辑
  protected abstract apply(event: DomainEvent): void;
}

// 事件溯源订单聚合
class EventSourcedOrder extends EventSourcedAggregate {
  private status: OrderStatus;
  private items: Map<string, OrderItem> = new Map();
  private customerId: string;
  private totalAmount: Money;

  // 创建订单
  static create(orderId: string, customerId: string): EventSourcedOrder {
    const order = new EventSourcedOrder();
    order.applyChange(new OrderCreatedEvent(orderId, customerId));
    return order;
  }

  // 添加商品
  addItem(productId: string, productName: string, quantity: number, price: Money): void {
    if (this.status !== OrderStatus.Draft) {
      throw new InvalidOrderStateError('只能在草稿状态添加商品');
    }

    this.applyChange(new OrderItemAddedEvent(
      this.id,
      productId,
      productName,
      quantity,
      price.amount,
      price.currency
    ));
  }

  // 下单
  place(): void {
    if (this.items.size === 0) {
      throw new EmptyOrderError('订单不能为空');
    }

    this.applyChange(new OrderPlacedEvent(
      this.id,
      this.customerId,
      Array.from(this.items.values()).map(i => i.toSnapshot()),
      this.totalAmount,
      null // 地址在这里省略
    ));
  }

  // 应用事件到状态
  protected apply(event: DomainEvent): void {
    switch (event.eventType) {
      case 'OrderCreatedEvent':
        this.applyOrderCreated(event as OrderCreatedEvent);
        break;
      case 'OrderItemAddedEvent':
        this.applyOrderItemAdded(event as OrderItemAddedEvent);
        break;
      case 'OrderPlacedEvent':
        this.applyOrderPlaced(event as OrderPlacedEvent);
        break;
      case 'OrderConfirmedEvent':
        this.applyOrderConfirmed(event as OrderConfirmedEvent);
        break;
      case 'OrderCancelledEvent':
        this.applyOrderCancelled(event as OrderCancelledEvent);
        break;
    }
  }

  private applyOrderCreated(event: OrderCreatedEvent): void {
    this.id = event.orderId;
    this.customerId = event.customerId;
    this.status = OrderStatus.Draft;
    this.totalAmount = Money.zero();
  }

  private applyOrderItemAdded(event: OrderItemAddedEvent): void {
    const item = new OrderItem(
      event.productId,
      event.productName,
      event.quantity,
      new Money(event.price, event.currency)
    );
    this.items.set(event.productId, item);
    this.recalculateTotal();
  }

  private applyOrderPlaced(event: OrderPlacedEvent): void {
    this.status = OrderStatus.Placed;
  }

  private applyOrderConfirmed(event: OrderConfirmedEvent): void {
    this.status = OrderStatus.Confirmed;
  }

  private applyOrderCancelled(event: OrderCancelledEvent): void {
    this.status = OrderStatus.Cancelled;
  }

  private recalculateTotal(): void {
    this.totalAmount = Array.from(this.items.values())
      .reduce((sum, item) => sum.add(item.getSubtotal()), Money.zero());
  }
}
```

### 事件存储

```typescript
// 事件存储接口
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
}

// 事件溯源仓储
class EventSourcedOrderRepository implements OrderRepository {
  constructor(
    private readonly eventStore: EventStore,
    private readonly eventBus: EventBus
  ) {}

  async findById(id: OrderId): Promise<EventSourcedOrder | null> {
    const events = await this.eventStore.readStream(id.value, 'Order');

    if (events.length === 0) {
      return null;
    }

    const order = new EventSourcedOrder();
    order.loadFromHistory(events);
    return order;
  }

  async save(order: EventSourcedOrder): Promise<void> {
    const changes = order.getUncommittedChanges();

    if (changes.length === 0) {
      return;
    }

    // 保存事件到事件存储
    await this.eventStore.appendToStream(
      order.id,
      'Order',
      changes,
      order.version - changes.length
    );

    // 发布事件
    for (const event of changes) {
      await this.eventBus.publish(event);
    }

    order.markChangesAsCommitted();
  }

  nextId(): OrderId {
    return new OrderId(crypto.randomUUID());
  }
}
```

### 投影（Read Model）

```typescript
// 订单列表投影
class OrderListProjection {
  constructor(private readonly db: Database) {}

  // 处理订单创建事件
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.db.query(
      `INSERT INTO order_read_model
       (order_id, customer_id, status, total_amount, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [event.orderId, event.customerId, 'draft', 0, event.occurredOn]
    );
  }

  // 处理订单下达事件
  async handleOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    await this.db.query(
      `UPDATE order_read_model
       SET status = $1, total_amount = $2, items = $3, updated_at = $4
       WHERE order_id = $5`,
      [
        'placed',
        event.totalAmount.amount,
        JSON.stringify(event.items),
        event.occurredOn,
        event.orderId
      ]
    );
  }

  // 处理订单确认事件
  async handleOrderConfirmed(event: OrderConfirmedEvent): Promise<void> {
    await this.db.query(
      `UPDATE order_read_model
       SET status = $1, confirmed_at = $2, updated_at = $2
       WHERE order_id = $3`,
      ['confirmed', event.confirmedAt, event.orderId]
    );
  }

  // 处理订单取消事件
  async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    await this.db.query(
      `UPDATE order_read_model
       SET status = $1, cancellation_reason = $2, updated_at = $3
       WHERE order_id = $4`,
      ['cancelled', event.reason, event.occurredOn, event.orderId]
    );
  }
}

// 投影处理器注册
class ProjectionHandlerRegistry {
  constructor(
    private readonly eventBus: EventBus,
    private readonly orderListProjection: OrderListProjection
  ) {}

  register(): void {
    this.eventBus.subscribe('OrderCreatedEvent', {
      getEventType: () => 'OrderCreatedEvent',
      handle: (e: OrderCreatedEvent) => this.orderListProjection.handleOrderCreated(e)
    });

    this.eventBus.subscribe('OrderPlacedEvent', {
      getEventType: () => 'OrderPlacedEvent',
      handle: (e: OrderPlacedEvent) => this.orderListProjection.handleOrderPlaced(e)
    });

    this.eventBus.subscribe('OrderConfirmedEvent', {
      getEventType: () => 'OrderConfirmedEvent',
      handle: (e: OrderConfirmedEvent) => this.orderListProjection.handleOrderConfirmed(e)
    });

    this.eventBus.subscribe('OrderCancelledEvent', {
      getEventType: () => 'OrderCancelledEvent',
      handle: (e: OrderCancelledEvent) => this.orderListProjection.handleOrderCancelled(e)
    });
  }
}
```

---

## 最佳实践

### 事件设计原则

```typescript
// 原则一：事件应该是过去时态
// 好
OrderPlaced, PaymentReceived, InventoryReserved
// 不好
PlaceOrder, ReceivePayment, ReserveInventory

// 原则二：事件应该包含足够的上下文
// 好：包含处理所需的关键信息
class OrderPlacedEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly items: OrderItemSnapshot[],
    public readonly totalAmount: Money
  ) {}
}

// 不好：信息不足，需要额外查询
class OrderPlacedEvent {
  constructor(public readonly orderId: string) {}
}

// 原则三：事件应该是不可变的
// 好：使用 readonly
class OrderPlacedEvent {
  public readonly orderId: string;
  public readonly customerId: string;
}

// 不好：允许修改
class OrderPlacedEvent {
  public orderId: string;  // 可修改
  public customerId: string;
}
```

### 事件处理器设计

```typescript
// 原则一：处理器应该是幂等的
class IdempotentHandler {
  async handle(event: DomainEvent): Promise<void> {
    if (await this.isProcessed(event.eventId)) {
      return; // 已处理，直接返回
    }
    await this.doHandle(event);
    await this.markAsProcessed(event.eventId);
  }
}

// 原则二：处理器应该是单一职责的
// 好：每个处理器只做一件事
class InventoryHandler { /* 只处理库存 */ }
class NotificationHandler { /* 只处理通知 */ }
class AnalyticsHandler { /* 只处理统计 */ }

// 不好：一个处理器做太多事
class OrderHandler {
  async handle(event: OrderPlacedEvent) {
    await this.reserveInventory();
    await this.sendNotification();
    await this.updateAnalytics();
    await this.createInvoice();
  }
}

// 原则三：处理失败应该有明确的处理策略
class ResilientHandler {
  async handle(event: DomainEvent): Promise<void> {
    try {
      await this.doHandle(event);
    } catch (error) {
      if (this.isRetryable(error)) {
        await this.scheduleRetry(event);
      } else {
        await this.sendToDeadLetter(event, error);
      }
    }
  }
}
```

### 事件版本演进

```typescript
// 事件版本化
interface VersionedEvent {
  eventVersion: number;
}

// 事件升级器
class EventUpcaster {
  upcast(event: DomainEvent): DomainEvent {
    const version = (event as VersionedEvent).eventVersion || 1;

    switch (event.eventType) {
      case 'OrderPlacedEvent':
        return this.upcastOrderPlaced(event, version);
      default:
        return event;
    }
  }

  private upcastOrderPlaced(event: DomainEvent, fromVersion: number): DomainEvent {
    let result = event;

    // V1 -> V2: 添加 currency 字段
    if (fromVersion < 2) {
      result = {
        ...result,
        currency: 'CNY', // 默认值
        eventVersion: 2
      };
    }

    // V2 -> V3: 重命名 totalAmount 为 total
    if (fromVersion < 3) {
      const { totalAmount, ...rest } = result as any;
      result = {
        ...rest,
        total: totalAmount,
        eventVersion: 3
      };
    }

    return result;
  }
}
```

### 监控与可观测性

```typescript
// 事件追踪装饰器
class TracingEventHandler<T extends DomainEvent> implements DomainEventHandler<T> {
  constructor(
    private readonly inner: DomainEventHandler<T>,
    private readonly tracer: Tracer,
    private readonly metrics: Metrics
  ) {}

  getEventType(): string {
    return this.inner.getEventType();
  }

  async handle(event: T): Promise<void> {
    const span = this.tracer.startSpan(`handle_${event.eventType}`, {
      attributes: {
        'event.id': event.eventId,
        'event.type': event.eventType,
        'aggregate.id': event.getAggregateId()
      }
    });

    const startTime = Date.now();

    try {
      await this.inner.handle(event);

      this.metrics.recordEventHandled(event.eventType, 'success');
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      this.metrics.recordEventHandled(event.eventType, 'failure');
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.metrics.recordEventDuration(event.eventType, duration);
      span.end();
    }
  }
}
```

---

## 常见陷阱

### 事件风暴（Event Storm）

```typescript
// 问题：产生过多细粒度事件
class Order {
  updateCustomerName(name: string) {
    this.customerName = name;
    this.addEvent(new CustomerNameUpdatedEvent(...)); // 过于琐碎
  }

  updateCustomerEmail(email: string) {
    this.customerEmail = email;
    this.addEvent(new CustomerEmailUpdatedEvent(...)); // 过于琐碎
  }
}

// 解决：只发布有业务意义的事件
class Order {
  updateCustomerInfo(name: string, email: string) {
    this.customerName = name;
    this.customerEmail = email;
    // 不需要为每个字段发布事件
  }

  place() {
    // 只在关键业务节点发布事件
    this.addEvent(new OrderPlacedEvent(...));
  }
}
```

### 循环依赖

```typescript
// 问题：事件处理形成循环
// OrderPlacedEvent -> 触发库存预留 -> InventoryReservedEvent -> 触发订单确认 -> ...

// 解决：明确事件流向，避免循环
// 使用 Saga 或 Process Manager 协调复杂流程
class OrderProcessSaga {
  // 明确的状态机，避免循环
  private state: 'STARTED' | 'INVENTORY_RESERVED' | 'COMPLETED';

  async handle(event: DomainEvent) {
    switch (this.state) {
      case 'STARTED':
        if (event instanceof InventoryReservedEvent) {
          this.state = 'INVENTORY_RESERVED';
          // 不再触发新的事件循环
        }
        break;
    }
  }
}
```

### 事件丢失

```typescript
// 问题：先发布事件后持久化，可能导致事件丢失
async save(order: Order) {
  // 错误：先发布事件
  for (const event of order.domainEvents) {
    await this.eventBus.publish(event);
  }
  // 如果这里失败，事件已发布但状态未保存
  await this.db.save(order);
}

// 解决：使用事务性发件箱模式
async save(order: Order) {
  await this.db.transaction(async (tx) => {
    // 保存聚合状态
    await tx.save(order);

    // 保存事件到发件箱表
    for (const event of order.domainEvents) {
      await tx.insertOutbox(event);
    }
  });

  // 事务提交后，由后台任务发布事件
}

// 发件箱处理器
class OutboxProcessor {
  async process() {
    const events = await this.db.getUnpublishedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
      await this.db.markAsPublished(event.id);
    }
  }
}
```

### 忽略事件顺序

```typescript
// 问题：并行处理导致顺序问题
// OrderPlacedEvent 和 OrderCancelledEvent 可能乱序到达

// 解决：使用版本号或时间戳确保顺序
class OrderProjection {
  async handle(event: DomainEvent) {
    const currentVersion = await this.getVersion(event.getAggregateId());

    if (event.version <= currentVersion) {
      // 旧事件，忽略
      return;
    }

    if (event.version > currentVersion + 1) {
      // 有缺失的事件，延迟处理
      await this.scheduleRetry(event);
      return;
    }

    await this.apply(event);
  }
}
```

---

## 面试要点

### Q1: 什么是领域事件？它与消息有什么区别？

**答**：领域事件是在业务领域中发生的有意义的事实，使用过去时态命名，表示已经发生的事情。与普通消息的区别：

1. **语义不同**：领域事件有明确的业务含义，消息可能只是技术传输载体
2. **不可变性**：领域事件一旦创建就不可修改
3. **命名规范**：领域事件使用统一语言，过去时态命名
4. **上下文完整**：领域事件包含事件发生时的完整上下文信息

### Q2: 如何保证事件处理的幂等性？

**答**：幂等性保证方法：

1. **事件ID去重**：记录已处理的事件ID，重复事件直接跳过
2. **业务幂等**：业务逻辑本身支持重复执行（如使用 UPSERT）
3. **版本控制**：使用乐观锁确保不会重复应用
4. **唯一约束**：数据库层面的唯一约束防止重复

```typescript
async handle(event: DomainEvent) {
  // 方法1：事件ID去重
  if (await this.isProcessed(event.eventId)) {
    return;
  }

  // 方法2：业务幂等（UPSERT）
  await this.db.query(
    `INSERT INTO orders (...)
     ON CONFLICT (id) DO UPDATE SET ...`
  );

  await this.markAsProcessed(event.eventId);
}
```

### Q3: 领域事件如何实现聚合间的最终一致性？

**答**：

1. **事件驱动**：聚合A发布事件，聚合B通过事件处理器响应
2. **Saga模式**：协调多个聚合的操作，支持补偿回滚
3. **异步处理**：通过消息队列异步传递事件，解耦聚合
4. **补偿机制**：失败时发布补偿事件撤销操作

```typescript
// 订单下达 -> 库存预留（异步）
// OrderPlacedEvent -> InventoryReservationHandler -> 预留库存
// 如果预留失败 -> OrderCancellationHandler -> 取消订单
```

### Q4: 事件溯源与领域事件有什么关系？

**答**：

1. **领域事件是事件溯源的基础**：事件溯源通过存储领域事件序列来持久化状态
2. **双重作用**：在事件溯源中，领域事件既用于重建状态，也用于通知其他组件
3. **不可变性**：两者都强调事件的不可变性
4. **区别**：普通DDD可以不用事件溯源，但事件溯源必须使用领域事件

### Q5: 如何处理事件处理失败的情况？

**答**：

1. **重试机制**：配置重试策略（次数、间隔、退避算法）
2. **死信队列**：多次重试失败后进入死信队列，人工处理
3. **补偿事件**：发布补偿事件撤销之前的操作
4. **监控告警**：失败时触发告警，及时人工介入
5. **幂等设计**：确保重试不会造成副作用

```typescript
class ResilientHandler {
  maxRetries = 3;

  async handle(event: DomainEvent) {
    for (let i = 0; i <= this.maxRetries; i++) {
      try {
        await this.doHandle(event);
        return;
      } catch (error) {
        if (i === this.maxRetries) {
          await this.deadLetterQueue.send(event, error);
          await this.alertService.notify(event, error);
        }
        await this.delay(Math.pow(2, i) * 1000); // 指数退避
      }
    }
  }
}
```

---

## 总结

领域事件是DDD中实现系统解耦、支撑最终一致性的核心机制。通过合理设计和实现领域事件，可以构建出松耦合、可扩展、易于维护的系统。

**关键要点：**

1. **事件设计**：使用过去时态命名，包含完整上下文，保持不可变性
2. **发布订阅**：通过事件总线解耦发布者和订阅者
3. **幂等处理**：确保事件处理器可以安全重复执行
4. **最终一致性**：通过Saga、补偿事件等机制实现跨聚合一致性
5. **事件溯源集成**：领域事件可以作为事件溯源的基础
6. **可观测性**：完善的监控、追踪和告警机制

掌握领域事件需要在实际项目中不断实践，建议从简单场景开始，逐步引入复杂的事件处理模式。
