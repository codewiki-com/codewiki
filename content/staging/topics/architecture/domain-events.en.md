---
title: Domain Events
description: Understand and implement domain events in DDD
track: architecture
section: ddd
difficulty: advanced
tags:
  - domain events
  - DDD
  - event-driven
  - decoupling
status: imported
origin: old/src/content/docs/architecture/domain-events.en.md
divergence: 0.265
issues: []
legacy:
  category: Architecture
  subcategory: DDD
  order: 19
  lastUpdated: 2026-01-07
---

## Overview

Domain Events are a fundamental building block in Domain-Driven Design that capture something significant that happened in the domain. They represent facts about business occurrences that domain experts care about and provide a powerful mechanism for achieving loose coupling between different parts of a system.

The core principle of domain events is: **Events represent things that have already happened, not things that might happen.**

We'll cover the design, implementation, and integration of domain events in DDD systems, from basic concepts to advanced patterns like eventual consistency and event sourcing integration.

---

## What Are Domain Events?

### Definition and Characteristics

A Domain Event is an immutable record of something significant that occurred within the domain. Unlike commands (which express intent) or queries (which request data), events describe facts that have already taken place.

**Core Characteristics of Domain Events:**

- **Past tense naming**: Events are named using past tense verbs (e.g., `OrderPlaced`, `PaymentReceived`)
- **Immutability**: Once created, an event cannot be modified
- **Timestamped**: Events carry the time of occurrence
- **Self-contained**: Events include all information needed to understand what happened
- **Business-meaningful**: Events represent concepts that domain experts understand

```typescript
// Domain Event base class
abstract class DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventType: string;

  protected constructor() {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.eventType = this.constructor.name;
  }

  abstract getAggregateId(): string;
}

// Concrete domain event example
class OrderPlacedEvent extends DomainEvent {
  constructor(
    readonly orderId: string,
    readonly customerId: string,
    readonly items: OrderItemSnapshot[],
    readonly totalAmount: Money,
    readonly shippingAddress: Address
  ) {
    super();
  }

  getAggregateId(): string {
    return this.orderId;
  }
}
```

### Why Domain Events Matter

Domain events solve several architectural challenges:

| Challenge | How Domain Events Help |
|-----------|----------------------|
| Tight coupling | Events decouple producers from consumers |
| Cross-aggregate consistency | Enable eventual consistency without distributed transactions |
| Audit requirements | Provide natural audit trail of business activities |
| System integration | Standardized way to communicate between bounded contexts |
| Extensibility | New functionality can subscribe to existing events |

### Events vs Commands vs Queries

Understanding the distinction between these patterns is crucial:

```typescript
// Command: Express intent (imperative, future)
interface PlaceOrderCommand {
  customerId: string;
  items: OrderItem[];
  shippingAddress: Address;
}

// Event: Record what happened (declarative, past)
interface OrderPlacedEvent {
  orderId: string;
  customerId: string;
  items: OrderItemSnapshot[];
  placedAt: Date;
}

// Query: Request information (interrogative, present)
interface GetOrderQuery {
  orderId: string;
}
```

---

## Designing Domain Events

### Event Naming Conventions

Event names should clearly communicate what happened using the ubiquitous language of the domain:

```typescript
// Good: Clear, business-meaningful names
class OrderPlaced extends DomainEvent { }
class PaymentReceived extends DomainEvent { }
class ShipmentDispatched extends DomainEvent { }
class InventoryReserved extends DomainEvent { }
class CustomerAccountSuspended extends DomainEvent { }

// Bad: Technical or vague names
class OrderEvent extends DomainEvent { }  // Too vague
class OrderStatusChanged extends DomainEvent { }  // Implementation detail
class OrderUpdated extends DomainEvent { }  // Not specific enough
class HandleOrder extends DomainEvent { }  // Sounds like a command
```

### Event Structure Design

Events should be self-contained and include all relevant context:

```typescript
// Well-designed event structure
class OrderCancelledEvent extends DomainEvent {
  constructor(
    // Identity information
    readonly orderId: string,
    readonly customerId: string,

    // What happened
    readonly cancellationReason: CancellationReason,
    readonly cancelledBy: string,

    // Context at the time of cancellation
    readonly orderStatus: OrderStatus,
    readonly totalAmount: Money,
    readonly itemCount: number,

    // Timing
    readonly originalPlacedAt: Date
  ) {
    super();
  }

  getAggregateId(): string {
    return this.orderId;
  }
}

// Event metadata for infrastructure concerns
interface EventMetadata {
  correlationId: string;  // Track related operations
  causationId: string;    // ID of event that caused this one
  userId?: string;        // Who triggered the action
  schemaVersion: number;  // For event versioning
}

class EnrichedDomainEvent extends DomainEvent {
  readonly metadata: EventMetadata;

  constructor(metadata: EventMetadata) {
    super();
    this.metadata = metadata;
  }
}
```

### Event Granularity

Finding the right level of granularity is important:

```typescript
// Too fine-grained: Creates noise, hard to understand business meaning
class OrderItemQuantityChanged extends DomainEvent { }
class OrderItemPriceUpdated extends DomainEvent { }
class OrderShippingAddressLineOneChanged extends DomainEvent { }

// Too coarse-grained: Loses important business context
class OrderModified extends DomainEvent { }  // What exactly changed?

// Just right: Business-meaningful granularity
class OrderItemAdded extends DomainEvent {
  constructor(
    readonly orderId: string,
    readonly productId: string,
    readonly quantity: number,
    readonly unitPrice: Money
  ) {
    super();
  }
}

class OrderShippingAddressChanged extends DomainEvent {
  constructor(
    readonly orderId: string,
    readonly previousAddress: Address,
    readonly newAddress: Address
  ) {
    super();
  }
}
```

### Designing for Evolution

Events must evolve as the business changes. Design with versioning in mind:

```typescript
// Version 1: Original event
interface OrderPlacedEventV1 {
  eventType: 'OrderPlaced';
  schemaVersion: 1;
  orderId: string;
  customerId: string;
  totalAmount: number;  // Primitive type
}

// Version 2: Added currency support
interface OrderPlacedEventV2 {
  eventType: 'OrderPlaced';
  schemaVersion: 2;
  orderId: string;
  customerId: string;
  totalAmount: {
    value: number;
    currency: string;
  };
}

// Version 3: Added items detail
interface OrderPlacedEventV3 {
  eventType: 'OrderPlaced';
  schemaVersion: 3;
  orderId: string;
  customerId: string;
  totalAmount: {
    value: number;
    currency: string;
  };
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

// Event upcaster for backward compatibility
class OrderPlacedEventUpcaster {
  upcast(event: any): OrderPlacedEventV3 {
    if (event.schemaVersion === 1) {
      return this.upcastV1ToV3(event);
    }
    if (event.schemaVersion === 2) {
      return this.upcastV2ToV3(event);
    }
    return event;
  }

  private upcastV1ToV3(v1: OrderPlacedEventV1): OrderPlacedEventV3 {
    return {
      eventType: 'OrderPlaced',
      schemaVersion: 3,
      orderId: v1.orderId,
      customerId: v1.customerId,
      totalAmount: {
        value: v1.totalAmount,
        currency: 'USD'  // Default currency for legacy events
      },
      items: []  // Items unknown for legacy events
    };
  }

  private upcastV2ToV3(v2: OrderPlacedEventV2): OrderPlacedEventV3 {
    return {
      ...v2,
      schemaVersion: 3,
      items: []
    };
  }
}
```

---

## Publishing and Subscribing

### Raising Events from Aggregates

Aggregates are the source of domain events. Events should be raised during business operations:

```typescript
class Order {
  private readonly id: OrderId;
  private status: OrderStatus;
  private items: OrderItem[];
  private readonly domainEvents: DomainEvent[] = [];

  // Business operation that raises an event
  place(): void {
    if (this.items.length === 0) {
      throw new DomainError('Cannot place an empty order');
    }

    if (this.status !== OrderStatus.Draft) {
      throw new DomainError('Only draft orders can be placed');
    }

    this.status = OrderStatus.Placed;

    // Raise domain event
    this.addDomainEvent(new OrderPlacedEvent(
      this.id.value,
      this.customerId,
      this.items.map(item => item.toSnapshot()),
      this.calculateTotal(),
      this.shippingAddress
    ));
  }

  cancel(reason: CancellationReason): void {
    if (!this.canBeCancelled()) {
      throw new DomainError('Order cannot be cancelled');
    }

    const previousStatus = this.status;
    this.status = OrderStatus.Cancelled;

    this.addDomainEvent(new OrderCancelledEvent(
      this.id.value,
      this.customerId,
      reason,
      previousStatus,
      this.calculateTotal(),
      this.items.length
    ));
  }

  // Event collection methods
  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }

  private canBeCancelled(): boolean {
    return this.status === OrderStatus.Draft ||
           this.status === OrderStatus.Placed ||
           this.status === OrderStatus.Confirmed;
  }
}
```

### Event Publisher Interface

Define a clear interface for publishing events:

```typescript
// Publisher interface
interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}

// Subscriber interface
interface DomainEventSubscriber<T extends DomainEvent> {
  subscribedToEventType(): string;
  handleEvent(event: T): Promise<void>;
}

// Simple in-memory publisher for single-process applications
class InMemoryDomainEventPublisher implements DomainEventPublisher {
  private subscribers: Map<string, DomainEventSubscriber<any>[]> = new Map();

  subscribe<T extends DomainEvent>(subscriber: DomainEventSubscriber<T>): void {
    const eventType = subscriber.subscribedToEventType();
    const existing = this.subscribers.get(eventType) || [];
    existing.push(subscriber);
    this.subscribers.set(eventType, existing);
  }

  async publish(event: DomainEvent): Promise<void> {
    const subscribers = this.subscribers.get(event.eventType) || [];

    for (const subscriber of subscribers) {
      try {
        await subscriber.handleEvent(event);
      } catch (error) {
        console.error(`Error handling event ${event.eventType}:`, error);
        // Depending on requirements: retry, dead letter, etc.
      }
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
```

### Message Queue-Based Publisher

For distributed systems, use a message queue:

```typescript
class RabbitMQEventPublisher implements DomainEventPublisher {
  private channel: Channel;

  constructor(private connection: Connection) {}

  async initialize(): Promise<void> {
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange('domain_events', 'topic', {
      durable: true
    });
  }

  async publish(event: DomainEvent): Promise<void> {
    const message = this.serialize(event);
    const routingKey = `${event.eventType}.${event.getAggregateId()}`;

    this.channel.publish(
      'domain_events',
      routingKey,
      Buffer.from(message),
      {
        persistent: true,
        messageId: event.eventId,
        timestamp: event.occurredOn.getTime(),
        contentType: 'application/json'
      }
    );
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  private serialize(event: DomainEvent): string {
    return JSON.stringify({
      eventId: event.eventId,
      eventType: event.eventType,
      occurredOn: event.occurredOn.toISOString(),
      aggregateId: event.getAggregateId(),
      payload: event
    });
  }
}

// Consumer setup
class RabbitMQEventSubscriber {
  constructor(
    private channel: Channel,
    private handlers: Map<string, DomainEventSubscriber<any>>
  ) {}

  async subscribe(eventType: string, queueName: string): Promise<void> {
    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.bindQueue(queueName, 'domain_events', `${eventType}.*`);

    this.channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        const handler = this.handlers.get(event.eventType);

        if (handler) {
          await handler.handleEvent(event.payload);
        }

        this.channel.ack(msg);
      } catch (error) {
        // Handle failure: retry, dead letter, etc.
        this.channel.nack(msg, false, false);
      }
    });
  }
}
```

### Publishing Events from Repository

Events are typically published after the aggregate is persisted:

```typescript
class OrderRepository {
  constructor(
    private db: Database,
    private eventPublisher: DomainEventPublisher
  ) {}

  async save(order: Order): Promise<void> {
    // 1. Persist the aggregate
    await this.db.transaction(async (tx) => {
      await this.persistOrder(tx, order);
    });

    // 2. Publish domain events after successful persistence
    const events = order.pullDomainEvents();
    await this.eventPublisher.publishAll(events);
  }

  private async persistOrder(tx: Transaction, order: Order): Promise<void> {
    const snapshot = order.toSnapshot();
    await tx.query(
      `INSERT INTO orders (id, customer_id, status, total_amount, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         status = $3, total_amount = $4`,
      [snapshot.id, snapshot.customerId, snapshot.status,
       snapshot.totalAmount, snapshot.createdAt]
    );
  }
}
```

---

## Event Handlers

### Handler Design Patterns

Event handlers react to domain events and perform side effects:

```typescript
// Handler interface
interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

// Notification handler: Send email when order is placed
class OrderPlacedNotificationHandler implements EventHandler<OrderPlacedEvent> {
  constructor(
    private customerRepository: CustomerRepository,
    private emailService: EmailService
  ) {}

  async handle(event: OrderPlacedEvent): Promise<void> {
    const customer = await this.customerRepository.findById(event.customerId);

    if (!customer) {
      console.warn(`Customer not found: ${event.customerId}`);
      return;
    }

    await this.emailService.send({
      to: customer.email,
      template: 'order-confirmation',
      data: {
        orderNumber: event.orderId,
        items: event.items,
        totalAmount: event.totalAmount,
        shippingAddress: event.shippingAddress
      }
    });
  }
}

// Inventory handler: Reserve stock when order is placed
class OrderPlacedInventoryHandler implements EventHandler<OrderPlacedEvent> {
  constructor(private inventoryService: InventoryService) {}

  async handle(event: OrderPlacedEvent): Promise<void> {
    for (const item of event.items) {
      await this.inventoryService.reserve({
        productId: item.productId,
        quantity: item.quantity,
        orderId: event.orderId
      });
    }
  }
}

// Analytics handler: Track business metrics
class OrderPlacedAnalyticsHandler implements EventHandler<OrderPlacedEvent> {
  constructor(private analytics: AnalyticsService) {}

  async handle(event: OrderPlacedEvent): Promise<void> {
    await this.analytics.track('order_placed', {
      orderId: event.orderId,
      customerId: event.customerId,
      orderValue: event.totalAmount.amount,
      itemCount: event.items.length,
      timestamp: event.occurredOn
    });
  }
}
```

### Handler Registration

Organize handlers using a registry or dependency injection:

```typescript
// Handler registry
class EventHandlerRegistry {
  private handlers: Map<string, EventHandler<any>[]> = new Map();

  register<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  getHandlers(eventType: string): EventHandler<any>[] {
    return this.handlers.get(eventType) || [];
  }
}

// Application setup
function configureEventHandlers(container: Container): EventHandlerRegistry {
  const registry = new EventHandlerRegistry();

  // Register handlers for OrderPlacedEvent
  registry.register(
    'OrderPlacedEvent',
    container.resolve(OrderPlacedNotificationHandler)
  );
  registry.register(
    'OrderPlacedEvent',
    container.resolve(OrderPlacedInventoryHandler)
  );
  registry.register(
    'OrderPlacedEvent',
    container.resolve(OrderPlacedAnalyticsHandler)
  );

  // Register handlers for OrderCancelledEvent
  registry.register(
    'OrderCancelledEvent',
    container.resolve(OrderCancelledRefundHandler)
  );
  registry.register(
    'OrderCancelledEvent',
    container.resolve(OrderCancelledInventoryHandler)
  );

  return registry;
}

// Event dispatcher using the registry
class EventDispatcher {
  constructor(private registry: EventHandlerRegistry) {}

  async dispatch(event: DomainEvent): Promise<void> {
    const handlers = this.registry.getHandlers(event.eventType);

    const results = await Promise.allSettled(
      handlers.map(handler => handler.handle(event))
    );

    // Log failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `Handler ${index} failed for ${event.eventType}:`,
          result.reason
        );
      }
    });
  }
}
```

### Idempotent Handlers

Handlers must be idempotent since events may be delivered multiple times:

```typescript
class IdempotentEventHandler<T extends DomainEvent> implements EventHandler<T> {
  constructor(
    private innerHandler: EventHandler<T>,
    private processedEventStore: ProcessedEventStore
  ) {}

  async handle(event: T): Promise<void> {
    // Check if already processed
    if (await this.processedEventStore.isProcessed(event.eventId)) {
      console.log(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    // Process the event
    await this.innerHandler.handle(event);

    // Mark as processed
    await this.processedEventStore.markProcessed(event.eventId);
  }
}

// Processed event store implementation
class ProcessedEventStore {
  constructor(private db: Database) {}

  async isProcessed(eventId: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT 1 FROM processed_events WHERE event_id = $1',
      [eventId]
    );
    return result.rows.length > 0;
  }

  async markProcessed(eventId: string): Promise<void> {
    await this.db.query(
      `INSERT INTO processed_events (event_id, processed_at)
       VALUES ($1, NOW())
       ON CONFLICT (event_id) DO NOTHING`,
      [eventId]
    );
  }
}
```

### Handler Error Handling

Implement robust error handling strategies:

```typescript
class RetryableEventHandler<T extends DomainEvent> implements EventHandler<T> {
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 1000;

  constructor(
    private innerHandler: EventHandler<T>,
    private deadLetterQueue: DeadLetterQueue
  ) {}

  async handle(event: T): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.innerHandler.handle(event);
        return;  // Success
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `Attempt ${attempt}/${this.maxRetries} failed for ${event.eventType}:`,
          error
        );

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelayMs * attempt);
        }
      }
    }

    // All retries exhausted, send to dead letter queue
    await this.deadLetterQueue.enqueue({
      event,
      error: lastError?.message || 'Unknown error',
      failedAt: new Date(),
      retryCount: this.maxRetries
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Eventual Consistency

### Understanding Eventual Consistency

Domain events enable eventual consistency between aggregates and bounded contexts. Instead of enforcing immediate consistency (which requires distributed transactions), the system accepts temporary inconsistency that resolves over time.

```
Traditional (Strong Consistency):
Order Service --Transaction--> [Order DB + Inventory DB + Notification DB]
                                        (All or Nothing)

Event-Driven (Eventual Consistency):
Order Service --> Order DB --> OrderPlacedEvent -->
                                    |
                    +---------------+---------------+
                    v               v               v
             Inventory Service  Notification    Analytics
                    |           Service         Service
                    v               v               v
             Inventory DB      Email Sent       Metrics
```

### Saga Pattern for Complex Workflows

When a business process spans multiple aggregates, use the Saga pattern:

```typescript
// Saga: Order fulfillment process
class OrderFulfillmentSaga {
  private state: SagaState = SagaState.Started;

  constructor(
    private orderService: OrderService,
    private paymentService: PaymentService,
    private inventoryService: InventoryService
  ) {}

  // Handle order placed - start the saga
  async onOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    this.state = SagaState.AwaitingPayment;

    try {
      // Step 1: Reserve inventory
      await this.inventoryService.reserve(event.orderId, event.items);
      this.state = SagaState.InventoryReserved;

      // Step 2: Process payment
      await this.paymentService.processPayment(
        event.orderId,
        event.customerId,
        event.totalAmount
      );
      this.state = SagaState.PaymentProcessed;

      // Step 3: Confirm order
      await this.orderService.confirmOrder(event.orderId);
      this.state = SagaState.Completed;

    } catch (error) {
      await this.compensate(event, error);
    }
  }

  // Compensating transactions
  private async compensate(event: OrderPlacedEvent, error: Error): Promise<void> {
    console.error(`Saga failed: ${error.message}, compensating...`);

    if (this.state >= SagaState.InventoryReserved) {
      await this.inventoryService.releaseReservation(event.orderId);
    }

    if (this.state >= SagaState.PaymentProcessed) {
      await this.paymentService.refund(event.orderId);
    }

    await this.orderService.markOrderFailed(event.orderId, error.message);
    this.state = SagaState.Compensated;
  }
}

enum SagaState {
  Started,
  AwaitingPayment,
  InventoryReserved,
  PaymentProcessed,
  Completed,
  Compensated
}
```

### Handling Out-of-Order Events

Events may arrive out of order in distributed systems:

```typescript
class OrderedEventProcessor {
  private expectedVersions: Map<string, number> = new Map();
  private pendingEvents: Map<string, DomainEvent[]> = new Map();

  constructor(private handler: EventHandler<DomainEvent>) {}

  async process(event: DomainEvent & { version: number }): Promise<void> {
    const aggregateId = event.getAggregateId();
    const expectedVersion = this.expectedVersions.get(aggregateId) || 1;

    if (event.version === expectedVersion) {
      // Process in order
      await this.handler.handle(event);
      this.expectedVersions.set(aggregateId, expectedVersion + 1);

      // Process any pending events that are now in order
      await this.processPending(aggregateId);

    } else if (event.version > expectedVersion) {
      // Out of order - save for later
      const pending = this.pendingEvents.get(aggregateId) || [];
      pending.push(event);
      pending.sort((a, b) => (a as any).version - (b as any).version);
      this.pendingEvents.set(aggregateId, pending);

    } else {
      // Duplicate or old event
      console.log(`Skipping old event version ${event.version}`);
    }
  }

  private async processPending(aggregateId: string): Promise<void> {
    const pending = this.pendingEvents.get(aggregateId) || [];
    const expectedVersion = this.expectedVersions.get(aggregateId) || 1;

    while (pending.length > 0 && (pending[0] as any).version === expectedVersion) {
      const event = pending.shift()!;
      await this.handler.handle(event);
      this.expectedVersions.set(aggregateId, expectedVersion + 1);
    }
  }
}
```

### Compensating Events

When something goes wrong, use compensating events to undo effects:

```typescript
// Original event
class PaymentReceivedEvent extends DomainEvent {
  constructor(
    readonly orderId: string,
    readonly paymentId: string,
    readonly amount: Money
  ) {
    super();
  }
}

// Compensating event
class PaymentRefundedEvent extends DomainEvent {
  constructor(
    readonly orderId: string,
    readonly paymentId: string,
    readonly originalPaymentId: string,
    readonly amount: Money,
    readonly reason: RefundReason
  ) {
    super();
  }
}

// Handler that reacts to refunds
class PaymentRefundedHandler implements EventHandler<PaymentRefundedEvent> {
  constructor(
    private orderService: OrderService,
    private accountingService: AccountingService
  ) {}

  async handle(event: PaymentRefundedEvent): Promise<void> {
    // Update order status
    await this.orderService.markPaymentRefunded(event.orderId);

    // Create accounting entry to reverse the original
    await this.accountingService.createReversalEntry({
      originalTransactionId: event.originalPaymentId,
      reversalAmount: event.amount,
      reason: event.reason
    });
  }
}
```

---

## Integration with Event Sourcing

### Events as the Source of Truth

In Event Sourcing, domain events become the primary source of truth. State is reconstructed by replaying events:

```typescript
// Event-sourced aggregate
class EventSourcedOrder {
  private id: string;
  private status: OrderStatus;
  private items: OrderItem[] = [];
  private version: number = 0;
  private uncommittedEvents: DomainEvent[] = [];

  // Reconstruct from event history
  static fromHistory(events: DomainEvent[]): EventSourcedOrder {
    const order = new EventSourcedOrder();
    for (const event of events) {
      order.apply(event, false);
    }
    return order;
  }

  // Apply event to update state
  private apply(event: DomainEvent, isNew: boolean = true): void {
    switch (event.constructor.name) {
      case 'OrderCreatedEvent':
        this.applyOrderCreated(event as OrderCreatedEvent);
        break;
      case 'OrderItemAddedEvent':
        this.applyOrderItemAdded(event as OrderItemAddedEvent);
        break;
      case 'OrderPlacedEvent':
        this.applyOrderPlaced(event as OrderPlacedEvent);
        break;
      case 'OrderCancelledEvent':
        this.applyOrderCancelled(event as OrderCancelledEvent);
        break;
    }

    this.version++;

    if (isNew) {
      this.uncommittedEvents.push(event);
    }
  }

  private applyOrderCreated(event: OrderCreatedEvent): void {
    this.id = event.orderId;
    this.status = OrderStatus.Draft;
  }

  private applyOrderItemAdded(event: OrderItemAddedEvent): void {
    this.items.push(new OrderItem(
      event.productId,
      event.quantity,
      event.unitPrice
    ));
  }

  private applyOrderPlaced(event: OrderPlacedEvent): void {
    this.status = OrderStatus.Placed;
  }

  private applyOrderCancelled(event: OrderCancelledEvent): void {
    this.status = OrderStatus.Cancelled;
  }

  // Business operations raise events
  static create(orderId: string, customerId: string): EventSourcedOrder {
    const order = new EventSourcedOrder();
    order.apply(new OrderCreatedEvent(orderId, customerId));
    return order;
  }

  addItem(productId: string, quantity: number, unitPrice: Money): void {
    if (this.status !== OrderStatus.Draft) {
      throw new DomainError('Cannot modify non-draft order');
    }
    this.apply(new OrderItemAddedEvent(this.id, productId, quantity, unitPrice));
  }

  place(): void {
    if (this.items.length === 0) {
      throw new DomainError('Cannot place empty order');
    }
    this.apply(new OrderPlacedEvent(
      this.id,
      this.items.map(i => i.toSnapshot()),
      this.calculateTotal()
    ));
  }

  // Get uncommitted events for persistence
  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }
}
```

### Event Store Integration

The event store persists all events:

```typescript
interface EventStore {
  appendToStream(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void>;

  readStream(streamId: string): Promise<DomainEvent[]>;

  readAllEvents(fromPosition: number, batchSize: number): Promise<DomainEvent[]>;
}

class PostgresEventStore implements EventStore {
  constructor(private db: Database) {}

  async appendToStream(
    streamId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Optimistic concurrency check
      const currentVersion = await this.getCurrentVersion(tx, streamId);
      if (currentVersion !== expectedVersion) {
        throw new ConcurrencyError(
          `Expected version ${expectedVersion}, found ${currentVersion}`
        );
      }

      // Append events
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const version = expectedVersion + i + 1;

        await tx.query(
          `INSERT INTO event_store
           (stream_id, event_id, event_type, event_data, version, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [streamId, event.eventId, event.eventType,
           JSON.stringify(event), version]
        );
      }
    });
  }

  async readStream(streamId: string): Promise<DomainEvent[]> {
    const result = await this.db.query(
      `SELECT event_data FROM event_store
       WHERE stream_id = $1
       ORDER BY version ASC`,
      [streamId]
    );

    return result.rows.map(row => this.deserialize(row.event_data));
  }

  private async getCurrentVersion(
    tx: Transaction,
    streamId: string
  ): Promise<number> {
    const result = await tx.query(
      'SELECT COALESCE(MAX(version), 0) as version FROM event_store WHERE stream_id = $1',
      [streamId]
    );
    return result.rows[0].version;
  }

  private deserialize(data: any): DomainEvent {
    // Implement event deserialization with upcasting
    return data as DomainEvent;
  }
}
```

### Projections for Read Models

Events are projected into optimized read models:

```typescript
// Projection: Build a denormalized order view
class OrderProjection {
  constructor(private db: Database) {}

  async apply(event: DomainEvent): Promise<void> {
    switch (event.constructor.name) {
      case 'OrderCreatedEvent':
        await this.handleOrderCreated(event as OrderCreatedEvent);
        break;
      case 'OrderItemAddedEvent':
        await this.handleOrderItemAdded(event as OrderItemAddedEvent);
        break;
      case 'OrderPlacedEvent':
        await this.handleOrderPlaced(event as OrderPlacedEvent);
        break;
      case 'OrderCancelledEvent':
        await this.handleOrderCancelled(event as OrderCancelledEvent);
        break;
    }
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.db.query(
      `INSERT INTO order_read_model
       (order_id, customer_id, status, item_count, total_amount, created_at)
       VALUES ($1, $2, 'DRAFT', 0, 0, $3)`,
      [event.orderId, event.customerId, event.occurredOn]
    );
  }

  private async handleOrderItemAdded(event: OrderItemAddedEvent): Promise<void> {
    const itemTotal = event.quantity * event.unitPrice.amount;

    await this.db.query(
      `UPDATE order_read_model
       SET item_count = item_count + 1,
           total_amount = total_amount + $1
       WHERE order_id = $2`,
      [itemTotal, event.orderId]
    );
  }

  private async handleOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    await this.db.query(
      `UPDATE order_read_model
       SET status = 'PLACED', placed_at = $1
       WHERE order_id = $2`,
      [event.occurredOn, event.orderId]
    );
  }

  private async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    await this.db.query(
      `UPDATE order_read_model
       SET status = 'CANCELLED',
           cancellation_reason = $1,
           cancelled_at = $2
       WHERE order_id = $3`,
      [event.reason, event.occurredOn, event.orderId]
    );
  }
}

// Projection runner
class ProjectionRunner {
  private checkpoint: number = 0;

  constructor(
    private eventStore: EventStore,
    private projections: Projection[]
  ) {}

  async run(): Promise<void> {
    while (true) {
      const events = await this.eventStore.readAllEvents(
        this.checkpoint,
        100
      );

      if (events.length === 0) {
        await this.sleep(1000);
        continue;
      }

      for (const event of events) {
        for (const projection of this.projections) {
          await projection.apply(event);
        }
        this.checkpoint++;
      }

      await this.saveCheckpoint();
    }
  }

  private async saveCheckpoint(): Promise<void> {
    // Persist checkpoint for recovery
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Snapshots for Performance

Snapshots optimize aggregate reconstruction:

```typescript
interface Snapshot {
  aggregateId: string;
  version: number;
  state: any;
  createdAt: Date;
}

class EventSourcedOrderRepository {
  private readonly SNAPSHOT_INTERVAL = 100;

  constructor(
    private eventStore: EventStore,
    private snapshotStore: SnapshotStore
  ) {}

  async getById(orderId: string): Promise<EventSourcedOrder> {
    // Try to load from snapshot first
    const snapshot = await this.snapshotStore.getLatest(orderId);

    let order: EventSourcedOrder;
    let fromVersion: number;

    if (snapshot) {
      order = EventSourcedOrder.fromSnapshot(snapshot.state);
      fromVersion = snapshot.version;
    } else {
      order = new EventSourcedOrder();
      fromVersion = 0;
    }

    // Load events since snapshot
    const events = await this.eventStore.readStream(orderId, fromVersion);
    for (const event of events) {
      order.apply(event, false);
    }

    return order;
  }

  async save(order: EventSourcedOrder): Promise<void> {
    const events = order.getUncommittedEvents();
    if (events.length === 0) return;

    // Append events
    await this.eventStore.appendToStream(
      order.id,
      events,
      order.version - events.length
    );

    order.markEventsAsCommitted();

    // Create snapshot if needed
    if (order.version % this.SNAPSHOT_INTERVAL === 0) {
      await this.snapshotStore.save({
        aggregateId: order.id,
        version: order.version,
        state: order.toSnapshot(),
        createdAt: new Date()
      });
    }
  }
}
```

---

## Best Practices and Anti-Patterns

### Best Practices

#### Keep Events Focused on Business Meaning

```typescript
// Good: Business-focused event
class CustomerBecameVIP extends DomainEvent {
  constructor(
    readonly customerId: string,
    readonly previousTier: CustomerTier,
    readonly totalPurchases: Money,
    readonly memberSince: Date
  ) {
    super();
  }
}

// Bad: Technical/implementation-focused event
class CustomerTierFieldUpdated extends DomainEvent {
  constructor(
    readonly customerId: string,
    readonly fieldName: string,
    readonly oldValue: string,
    readonly newValue: string
  ) {
    super();
  }
}
```

#### Include Sufficient Context

```typescript
// Good: Self-contained event with context
class OrderShipped extends DomainEvent {
  constructor(
    readonly orderId: string,
    readonly customerId: string,
    readonly shippingAddress: Address,
    readonly carrier: string,
    readonly trackingNumber: string,
    readonly estimatedDelivery: Date,
    readonly items: ShippedItem[]
  ) {
    super();
  }
}

// Bad: Missing important context
class OrderShipped extends DomainEvent {
  constructor(readonly orderId: string) {
    super();
  }
}
```

#### Design for Immutability

```typescript
// Good: Immutable event
class OrderPlaced extends DomainEvent {
  // All fields readonly
  constructor(
    readonly orderId: string,
    readonly items: readonly OrderItemSnapshot[]
  ) {
    super();
    // Defensive copy for arrays
    Object.freeze(this);
  }
}

// Bad: Mutable event
class OrderPlaced extends DomainEvent {
  orderId: string;
  items: OrderItemSnapshot[];

  updateItems(items: OrderItemSnapshot[]) {
    this.items = items;  // Events should never be modified!
  }
}
```

#### Handle Event Ordering Correctly

```typescript
// Include version for ordering
class VersionedDomainEvent extends DomainEvent {
  constructor(
    readonly aggregateVersion: number,
    readonly globalSequence: number
  ) {
    super();
  }
}
```

### Common Anti-Patterns

#### Using Events for Queries

```typescript
// Anti-pattern: Query disguised as event
class GetOrderDetailsEvent extends DomainEvent {  // Wrong!
  constructor(readonly orderId: string) {
    super();
  }
}

// Correct: Use a query
interface GetOrderDetailsQuery {
  orderId: string;
}
```

#### Fat Events

```typescript
// Anti-pattern: Event with too much data
class OrderPlaced extends DomainEvent {
  constructor(
    readonly order: Order,  // Entire aggregate!
    readonly customer: Customer,  // Related aggregate!
    readonly products: Product[]  // More aggregates!
  ) {
    super();
  }
}

// Correct: Include only necessary data
class OrderPlaced extends DomainEvent {
  constructor(
    readonly orderId: string,
    readonly customerId: string,
    readonly items: OrderItemSnapshot[],
    readonly totalAmount: Money
  ) {
    super();
  }
}
```

#### Synchronous Event Handling Blocking Operations

```typescript
// Anti-pattern: Slow handler blocks order placement
class OrderPlacedHandler {
  async handle(event: OrderPlacedEvent): Promise<void> {
    // This takes 30 seconds and blocks the response!
    await this.generatePDFInvoice(event);
    await this.sendToExternalERP(event);
    await this.notifyAllStakeholders(event);
  }
}

// Correct: Handle asynchronously
class OrderPlacedHandler {
  async handle(event: OrderPlacedEvent): Promise<void> {
    // Queue for async processing
    await this.messageQueue.enqueue('generate-invoice', event);
    await this.messageQueue.enqueue('sync-erp', event);
    await this.messageQueue.enqueue('notify-stakeholders', event);
  }
}
```

#### Coupling Handlers to Event Internals

```typescript
// Anti-pattern: Handler coupled to event structure
class InventoryHandler {
  async handle(event: OrderPlacedEvent): Promise<void> {
    // Coupled to internal structure
    for (const item of event.items) {
      await this.inventory.reserve(
        item.productId,
        item.quantity
      );
    }
  }
}

// Better: Use event methods
class OrderPlacedEvent extends DomainEvent {
  // Encapsulate how to iterate items
  forEachItem(callback: (productId: string, quantity: number) => void): void {
    for (const item of this.items) {
      callback(item.productId, item.quantity);
    }
  }
}
```

---

## Complete Example: Order Domain Events

### Domain Model Structure

```
order-domain/
├── events/
│   ├── DomainEvent.ts           # Base event class
│   ├── OrderCreated.ts          # Order created event
│   ├── OrderItemAdded.ts        # Item added event
│   ├── OrderPlaced.ts           # Order placed event
│   ├── OrderConfirmed.ts        # Order confirmed event
│   ├── OrderShipped.ts          # Order shipped event
│   └── OrderCancelled.ts        # Order cancelled event
├── handlers/
│   ├── NotificationHandler.ts   # Send notifications
│   ├── InventoryHandler.ts      # Update inventory
│   ├── AnalyticsHandler.ts      # Track metrics
│   └── IntegrationHandler.ts    # External system sync
├── infrastructure/
│   ├── EventPublisher.ts        # Event publishing
│   ├── EventStore.ts            # Event persistence
│   └── MessageBroker.ts         # Message queue integration
└── sagas/
    └── OrderFulfillmentSaga.ts  # Order fulfillment process
```

### Complete Implementation

```typescript
// ==================== Domain Events ====================

abstract class DomainEvent {
  readonly eventId: string = crypto.randomUUID();
  readonly occurredOn: Date = new Date();
  abstract readonly eventType: string;
  abstract getAggregateId(): string;
}

class OrderPlacedEvent extends DomainEvent {
  readonly eventType = 'OrderPlaced';

  constructor(
    readonly orderId: string,
    readonly customerId: string,
    readonly items: readonly OrderItemSnapshot[],
    readonly totalAmount: Money,
    readonly shippingAddress: Address
  ) {
    super();
    Object.freeze(this);
  }

  getAggregateId(): string {
    return this.orderId;
  }
}

// ==================== Event Publisher ====================

interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}

class ReliableEventPublisher implements EventPublisher {
  constructor(
    private eventStore: EventStore,
    private messageBroker: MessageBroker,
    private outbox: OutboxStore
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    // Transactional outbox pattern for reliability
    await this.outbox.save(event);

    try {
      await this.messageBroker.send(event);
      await this.outbox.markPublished(event.eventId);
    } catch (error) {
      // Will be retried by outbox processor
      console.error('Failed to publish event:', error);
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}

// ==================== Event Handlers ====================

class OrderPlacedNotificationHandler implements EventHandler<OrderPlacedEvent> {
  constructor(
    private customerService: CustomerService,
    private emailService: EmailService,
    private smsService: SMSService
  ) {}

  async handle(event: OrderPlacedEvent): Promise<void> {
    const customer = await this.customerService.getById(event.customerId);

    // Send email confirmation
    await this.emailService.send({
      to: customer.email,
      template: 'order-confirmation',
      data: {
        customerName: customer.name,
        orderId: event.orderId,
        items: event.items,
        total: event.totalAmount,
        shippingAddress: event.shippingAddress
      }
    });

    // Send SMS if opted in
    if (customer.smsNotificationsEnabled) {
      await this.smsService.send({
        to: customer.phone,
        message: `Your order ${event.orderId} has been placed. Total: ${event.totalAmount}`
      });
    }
  }
}

class OrderPlacedInventoryHandler implements EventHandler<OrderPlacedEvent> {
  constructor(private inventoryService: InventoryService) {}

  async handle(event: OrderPlacedEvent): Promise<void> {
    for (const item of event.items) {
      await this.inventoryService.reserveStock({
        productId: item.productId,
        quantity: item.quantity,
        orderId: event.orderId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min reservation
      });
    }
  }
}

// ==================== Application Service ====================

class OrderApplicationService {
  constructor(
    private orderRepository: OrderRepository,
    private eventPublisher: EventPublisher
  ) {}

  async placeOrder(command: PlaceOrderCommand): Promise<string> {
    // Create and place order
    const order = Order.create(
      this.orderRepository.nextId(),
      command.customerId
    );

    for (const item of command.items) {
      order.addItem(item.productId, item.quantity, item.unitPrice);
    }

    order.setShippingAddress(command.shippingAddress);
    order.place();

    // Save and publish events
    await this.orderRepository.save(order);

    const events = order.pullDomainEvents();
    await this.eventPublisher.publishAll(events);

    return order.id.value;
  }
}
```

---

## Interview Key Points

### Core Concept Questions

**Q1: What are Domain Events and why are they important?**

Answer: Domain Events are records of significant occurrences in the business domain. They are important because they:
1. Enable loose coupling between system components
2. Provide a natural audit trail
3. Support eventual consistency between aggregates
4. Allow asynchronous processing and scalability
5. Facilitate integration with other bounded contexts

**Q2: What is the difference between Domain Events and Integration Events?**

Answer:
- **Domain Events**: Internal to a bounded context, use domain language, may contain rich domain objects
- **Integration Events**: Cross bounded context boundaries, use a published language, contain only primitive types and simple DTOs for serialization compatibility

**Q3: How do you ensure events are not lost?**

Answer: Use the Transactional Outbox pattern:
1. Save events to an outbox table within the same transaction as the aggregate
2. A separate process reads from the outbox and publishes to the message broker
3. Mark events as published after successful broker acknowledgment
4. Use at-least-once delivery with idempotent handlers

### Design Questions

**Q4: How do you handle event versioning when the schema changes?**

Answer:
1. Include schema version in event metadata
2. Support multiple versions simultaneously
3. Use upcasters to transform old events to new format on read
4. Follow backward compatibility principles (adding fields is safe, removing is not)
5. Consider event copying for major migrations

**Q5: Design an event-driven order fulfillment system**

Answer:
```
Events:
- OrderPlaced -> Triggers inventory reservation
- InventoryReserved -> Triggers payment processing
- PaymentReceived -> Confirms order
- OrderConfirmed -> Triggers shipping
- OrderShipped -> Sends notification

Saga handles compensation:
- If payment fails: release inventory, cancel order
- If shipping fails: refund payment, release inventory
```

### Practical Questions

**Q6: How do you test event-driven systems?**

Answer:
1. Unit test aggregates: verify correct events are raised
2. Unit test handlers: mock dependencies, verify behavior
3. Integration test: use test event bus, verify end-to-end flow
4. Use event sourcing test patterns: given-when-then with events

```typescript
// Example test
describe('Order', () => {
  it('should raise OrderPlaced when placing order', () => {
    const order = Order.create(new OrderId('123'), 'customer-1');
    order.addItem('product-1', 2, Money.of(100));

    order.place();

    const events = order.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(OrderPlacedEvent);
  });
});
```

---

## Summary

Domain Events are a powerful pattern in DDD that enable:

1. **Decoupling**: Producers and consumers operate independently
2. **Extensibility**: New functionality subscribes to existing events
3. **Auditability**: Natural history of business activities
4. **Scalability**: Asynchronous processing across services
5. **Eventual Consistency**: Safe cross-aggregate coordination

Key Implementation Points:

1. **Design events around business meaning**, not technical operations
2. **Make events immutable** and self-contained
3. **Use idempotent handlers** for reliability
4. **Plan for event versioning** from the start
5. **Consider eventual consistency implications** in your design
6. **Integrate with Event Sourcing** for full history and audit

Domain Events bridge the gap between immediate consistency within aggregates and eventual consistency across system boundaries, making them essential for building scalable, maintainable distributed systems.

---

## Further Reading

### Classic Books

1. **"Domain-Driven Design: Tackling Complexity in the Heart of Software"** - Eric Evans
   - The foundational DDD book introducing domain events

2. **"Implementing Domain-Driven Design"** - Vaughn Vernon
   - Detailed coverage of domain events implementation

3. **"Enterprise Integration Patterns"** - Hohpe & Woolf
   - Messaging patterns that complement domain events

4. **"Building Event-Driven Microservices"** - Adam Bellemare
   - Modern event-driven architecture patterns

### Online Resources

- [Martin Fowler's Domain Event](https://martinfowler.com/eaaDev/DomainEvent.html) - Original pattern description
- [Microsoft's Domain Events Guide](https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation) - .NET implementation guide
- [Awesome DDD](https://github.com/heynickc/awesome-ddd) - Curated DDD resources
- [Event Storming](https://www.eventstorming.com/) - Collaborative modeling with events

### Related Patterns

- **Event Sourcing**: Store all domain events as the source of truth
- **CQRS**: Separate read and write models, often event-driven
- **Saga Pattern**: Coordinate long-running transactions with events
- **Outbox Pattern**: Reliable event publishing with databases
- **Event Choreography**: Decentralized event-based coordination

### Recommended Practice Projects

- [eShopOnContainers](https://github.com/dotnet-architecture/eShopOnContainers) - Microsoft's event-driven microservices sample
- [EventStoreDB Samples](https://github.com/EventStore/samples) - Event sourcing with domain events
- [Axon Framework](https://github.com/AxonFramework/AxonFramework) - Java framework for event-driven applications
