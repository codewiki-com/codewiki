---
title: Event Sourcing Complete Guide
description: Master event sourcing for audit trails and state reconstruction
track: architecture
section: design-patterns
difficulty: advanced
tags:
  - Event Sourcing
  - CQRS
  - Events
  - Architecture
status: imported
origin: old/src/content/docs/architecture/event-sourcing.en.md
divergence: 0.248
issues: []
legacy:
  category: Architecture
  subcategory: Patterns
  order: 7
  lastUpdated: 2026-01-07
---

## Concept Overview

Event Sourcing is a revolutionary data persistence pattern that fundamentally changes how we think about storing application state. Instead of storing the current state of an entity, we store a sequence of events that led to that state. By replaying these events, we can reconstruct the system state at any point in time.

### What is Event Sourcing?

Consider a bank account system. In the traditional approach, we only store the current balance:

```
Account Table: { id: "001", balance: 1000, lastUpdated: 2026-01-07
```

With Event Sourcing, we store all events that have occurred:

```
Event Stream:
1. AccountOpened { accountId: "001", initialBalance: 0, timestamp: "2024-01-01" }
2. MoneyDeposited { accountId: "001", amount: 500, timestamp: "2024-01-05" }
3. MoneyDeposited { accountId: "001", amount: 800, timestamp: "2024-01-10" }
4. MoneyWithdrawn { accountId: "001", amount: 300, timestamp: "2024-01-15" }
```

The current balance of $1000 can be calculated by replaying these events: 0 + 500 + 800 - 300 = 1000.

### Core Characteristics

Event Sourcing has the following fundamental characteristics:

1. **Event Immutability**: Once an event is recorded, it can never be modified or deleted
2. **Event Ordering**: Events are stored in the order they occurred
3. **Complete History**: The system maintains a complete history of all state changes
4. **State Reconstruction**: The state at any point in time can be rebuilt by replaying events

### Comparison with Traditional CRUD

| Aspect | Traditional CRUD | Event Sourcing |
|--------|------------------|----------------|
| Storage Content | Current state | Event sequence |
| Historical Tracking | Requires additional audit tables | Native support |
| Data Correction | Directly modify data | Append compensating events |
| Concurrency Handling | Optimistic/Pessimistic locking | Event version control |
| Debugging Capability | Difficult to reproduce issues | Can precisely replay problem scenarios |

---

## Event Store Design

The Event Store is the core component of an event sourcing architecture, responsible for persisting and retrieving events.

### Event Structure Design

A complete event should contain the following information:

```typescript
interface DomainEvent {
  // Unique event identifier
  eventId: string;

  // Event type
  eventType: string;

  // Aggregate root identifier
  aggregateId: string;

  // Aggregate type
  aggregateType: string;

  // Event version number (for optimistic concurrency control)
  version: number;

  // Event occurrence timestamp
  timestamp: Date;

  // Event payload (business data)
  payload: Record<string, unknown>;

  // Metadata (user ID, correlation ID, etc.)
  metadata: EventMetadata;
}

interface EventMetadata {
  userId?: string;
  correlationId: string;  // Track related events
  causationId: string;    // ID of the event that caused this event
  schemaVersion: number;  // Event schema version
}
```

### Event Store Table Design

```sql
CREATE TABLE event_store (
    -- Globally unique event ID
    event_id UUID PRIMARY KEY,

    -- Aggregate identifiers
    aggregate_id VARCHAR(255) NOT NULL,
    aggregate_type VARCHAR(255) NOT NULL,

    -- Event information
    event_type VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    metadata JSONB NOT NULL,

    -- Version control (event sequence within aggregate)
    version BIGINT NOT NULL,

    -- Global sequence number (for projection processing)
    global_sequence BIGSERIAL NOT NULL,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique version per aggregate
    CONSTRAINT unique_aggregate_version
        UNIQUE (aggregate_id, aggregate_type, version)
);

-- Index for querying by aggregate
CREATE INDEX idx_event_store_aggregate
    ON event_store (aggregate_id, aggregate_type, version);

-- Index for querying by event type
CREATE INDEX idx_event_store_type
    ON event_store (event_type, created_at);

-- Global sequence index (for projections)
CREATE INDEX idx_event_store_global_sequence
    ON event_store (global_sequence);
```

### Event Store Interface Implementation

```typescript
interface EventStore {
  // Append events to stream
  appendToStream(
    aggregateId: string,
    aggregateType: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void>;

  // Read all events for an aggregate
  readStream(
    aggregateId: string,
    aggregateType: string,
    fromVersion?: number
  ): Promise<DomainEvent[]>;

  // Read all events (for projections)
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

      // Check current version (optimistic concurrency control)
      const currentVersion = await this.getCurrentVersion(
        client, aggregateId, aggregateType
      );

      if (currentVersion !== expectedVersion) {
        throw new ConcurrencyError(
          `Expected version ${expectedVersion}, but found ${currentVersion}`
        );
      }

      // Insert events
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

## Aggregate Reconstruction

### Basic Aggregate Reconstruction

In Event Sourcing, the state of an Aggregate Root must be rebuilt by replaying events:

```typescript
abstract class AggregateRoot {
  protected id: string;
  protected version: number = 0;
  private changes: DomainEvent[] = [];

  // Get uncommitted events
  getUncommittedChanges(): DomainEvent[] {
    return [...this.changes];
  }

  // Mark events as committed
  markChangesAsCommitted(): void {
    this.changes = [];
  }

  // Rebuild state from historical events
  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.applyChange(event, false);
    }
  }

  // Apply an event
  protected applyChange(event: DomainEvent, isNew: boolean = true): void {
    this.apply(event);
    this.version = event.version;

    if (isNew) {
      this.changes.push(event);
    }
  }

  // Subclasses implement specific event handling logic
  protected abstract apply(event: DomainEvent): void;
}

// Order aggregate example
class Order extends AggregateRoot {
  private status: OrderStatus;
  private items: OrderItem[] = [];
  private totalAmount: number = 0;
  private customerId: string;

  // Create order (command handling)
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

  // Add item
  addItem(productId: string, quantity: number, price: number): void {
    if (this.status !== OrderStatus.Draft) {
      throw new Error('Can only add items in draft status');
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

  // Confirm order
  confirm(): void {
    if (this.status !== OrderStatus.Draft) {
      throw new Error('Can only confirm draft orders');
    }
    if (this.items.length === 0) {
      throw new Error('Order cannot be empty');
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

  // Event handlers
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

---

## Snapshots

When an aggregate has many events, replaying all events from the beginning for each reconstruction becomes very time-consuming. The Snapshot mechanism solves this problem:

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

// Repository with snapshot support
class OrderRepository {
  private readonly SNAPSHOT_INTERVAL = 100; // Create snapshot every 100 events

  constructor(
    private eventStore: EventStore,
    private snapshotStore: SnapshotStore
  ) {}

  async getById(orderId: string): Promise<Order> {
    // 1. Try to load snapshot
    const snapshot = await this.snapshotStore.getSnapshot(orderId, 'Order');

    // 2. Load events from snapshot version
    const fromVersion = snapshot?.version ?? 0;
    const events = await this.eventStore.readStream(
      orderId, 'Order', fromVersion
    );

    // 3. Rebuild aggregate
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

    // Save events
    await this.eventStore.appendToStream(
      order.id,
      'Order',
      changes,
      order.version - changes.length
    );

    order.markChangesAsCommitted();

    // Check if snapshot is needed
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

### Snapshot Strategies

There are several strategies for creating snapshots:

```typescript
// Strategy 1: Time-based snapshots
class TimeBasedSnapshotStrategy {
  private readonly SNAPSHOT_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  shouldCreateSnapshot(lastSnapshotTime: Date): boolean {
    return Date.now() - lastSnapshotTime.getTime() > this.SNAPSHOT_INTERVAL_MS;
  }
}

// Strategy 2: Event count-based snapshots
class EventCountSnapshotStrategy {
  private readonly EVENT_THRESHOLD = 100;

  shouldCreateSnapshot(eventsSinceLastSnapshot: number): boolean {
    return eventsSinceLastSnapshot >= this.EVENT_THRESHOLD;
  }
}

// Strategy 3: Aggregate size-based snapshots
class SizeBasedSnapshotStrategy {
  private readonly SIZE_THRESHOLD_KB = 100;

  shouldCreateSnapshot(aggregateState: any): boolean {
    const sizeInKB = JSON.stringify(aggregateState).length / 1024;
    return sizeInKB >= this.SIZE_THRESHOLD_KB;
  }
}

// Combined strategy
class CompositeSnapshotStrategy {
  constructor(
    private timeStrategy: TimeBasedSnapshotStrategy,
    private countStrategy: EventCountSnapshotStrategy
  ) {}

  shouldCreateSnapshot(
    lastSnapshotTime: Date,
    eventsSinceLastSnapshot: number
  ): boolean {
    return this.timeStrategy.shouldCreateSnapshot(lastSnapshotTime) ||
           this.countStrategy.shouldCreateSnapshot(eventsSinceLastSnapshot);
  }
}
```

---

## CQRS Integration

Event Sourcing is commonly combined with CQRS (Command Query Responsibility Segregation) to build high-performance, scalable systems.

### CQRS Architecture Overview

```
+------------------------------------------------------------------+
|                        Client Application                          |
+------------------------------------------------------------------+
                |                              |
                | Commands                     | Queries
                v                              v
+-------------------------+        +---------------------------+
|     Command Side        |        |       Query Side          |
|  +------------------+   |        |  +--------------------+   |
|  | Command Handler  |   |        |  |   Query Handler    |   |
|  +--------+---------+   |        |  +----------+---------+   |
|           |             |        |             |             |
|  +--------v---------+   |        |  +----------v---------+   |
|  | Aggregate/Domain |   |        |  |     Read Model     |   |
|  +--------+---------+   |        |  | (Optimized Views)  |   |
|           |             |        |  +----------+---------+   |
|  +--------v---------+   |        |             |             |
|  |   Event Store    |---+--------+-------------+             |
|  +------------------+   |   Events (Async Projection)        |
+-------------------------+        +---------------------------+
```

### Command Side Implementation

```typescript
// Command definitions
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

// Command handler
class OrderCommandHandler {
  constructor(
    private orderRepository: OrderRepository,
    private productService: ProductService,
    private customerService: CustomerService
  ) {}

  async handle(command: CreateOrderCommand): Promise<string> {
    // Validate customer
    const customer = await this.customerService.getById(command.customerId);
    if (!customer) {
      throw new Error('Customer does not exist');
    }

    // Create order
    const order = Order.create(uuid(), command.customerId);

    // Add items
    for (const item of command.items) {
      const product = await this.productService.getById(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} does not exist`);
      }
      order.addItem(item.productId, item.quantity, product.price);
    }

    // Save order
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

### Query Side Implementation

```typescript
// Query model (denormalized data structure optimized for queries)
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

// Query handler
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

## Event Versioning

As business evolves, event structures inevitably need to change. Since events are immutable, we need special strategies to handle event version changes.

### Event Versioning Strategies

```typescript
// Event registry
class EventRegistry {
  private upcasters: Map<string, EventUpcaster[]> = new Map();

  // Register event upcaster
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

  // Upgrade event to latest version
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

// Example: Order item added event version evolution
const registry = new EventRegistry();

// V1 -> V2: Add currency field
registry.registerUpcaster('OrderItemAdded', 1, 2, (event) => ({
  ...event,
  payload: {
    ...event.payload,
    currency: 'USD'  // Default currency
  }
}));

// V2 -> V3: Rename price to unitPrice, add discount
registry.registerUpcaster('OrderItemAdded', 2, 3, (event) => ({
  ...event,
  payload: {
    productId: event.payload.productId,
    quantity: event.payload.quantity,
    unitPrice: event.payload.price,  // Rename
    currency: event.payload.currency,
    discount: 0  // New field default value
  }
}));
```

### Event Migration Strategies

For large-scale event structure changes, the following strategies can be adopted:

```typescript
// Strategy 1: Lazy upcasting (upgrade on read)
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

    // Upgrade events on read
    return events.map(event => this.registry.upcast(event));
  }
}

// Strategy 2: Event copying (create new event stream)
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
    // Read original events
    const events = await this.sourceStore.readStream(
      aggregateId, aggregateType
    );

    // Upgrade all events
    const upgradedEvents = events.map(event => this.registry.upcast(event));

    // Write to new store
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

## Eventual Consistency

Event sourcing systems are typically eventually consistent, especially when using CQRS where read model updates are asynchronous.

### Event Publishing and Subscription

```typescript
// Event bus
interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(
    eventType: string,
    handler: EventHandler
  ): void;
}

type EventHandler = (event: DomainEvent) => Promise<void>;

// Message queue-based event bus
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
        // Processing failed, move to dead letter queue
        this.channel.nack(msg, false, false);
      }
    });
  }
}
```

### Idempotency Handling

Since events may be delivered multiple times, handlers must be idempotent:

```typescript
// Idempotent handler decorator
class IdempotentEventHandler {
  constructor(
    private handler: EventHandler,
    private processedStore: ProcessedEventStore
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    // Check if event has been processed
    const isProcessed = await this.processedStore.isProcessed(event.eventId);

    if (isProcessed) {
      console.log(`Event ${event.eventId} already processed, skipping`);
      return;
    }

    // Process event
    await this.handler(event);

    // Mark as processed
    await this.processedStore.markAsProcessed(event.eventId);
  }
}

// Processed event store
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

### Compensating Events Pattern

When problems occur, "undo" previous operations by appending compensating events:

```typescript
// Compensating event example
class OrderSaga {
  async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
    // Get order
    const order = await this.orderRepository.getById(event.orderId);

    // Cancel order (append compensating event)
    order.cancel(CancellationReason.PaymentFailed);
    await this.orderRepository.save(order);

    // Release inventory (append compensating event)
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

## Projections

Projections transform event streams into read models and are the core of the CQRS query side.

### Projection Processor

```typescript
// Projection processor base class
abstract class Projection {
  abstract readonly projectionName: string;

  // Get current processing position
  abstract getCheckpoint(): Promise<number>;

  // Update processing position
  abstract saveCheckpoint(position: number): Promise<void>;

  // Handle event
  abstract handle(event: DomainEvent): Promise<void>;

  // Get subscribed event types
  abstract getSubscribedEvents(): string[];
}

// Order list projection
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

    // Get product name
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

### Projection Runner

```typescript
// Projection runner
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

      // Brief sleep to avoid empty polling
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

// Projection rebuilder
class ProjectionRebuilder {
  constructor(
    private eventStore: EventStore,
    private projection: Projection
  ) {}

  async rebuild(): Promise<void> {
    console.log(`Rebuilding projection: ${this.projection.projectionName}`);

    // Clear projection data
    await this.projection.reset();

    // Reset checkpoint
    await this.projection.saveCheckpoint(0);

    // Reprocess all events
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

## Framework Selection

### Axon Framework (Java)

Axon is the most mature event sourcing framework in the Java ecosystem:

```java
// Aggregate definition
@Aggregate
public class OrderAggregate {

    @AggregateIdentifier
    private String orderId;
    private OrderStatus status;
    private List<OrderItem> items = new ArrayList<>();

    // Command handling
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

    // Event handling
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

// Projection handling
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

EventStoreDB is a database specifically designed for event sourcing:

```typescript
import { EventStoreDBClient, jsonEvent } from '@eventstore/db-client';

// Connect to EventStoreDB
const client = EventStoreDBClient.connectionString(
  'esdb://localhost:2113?tls=false'
);

// Append events
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

// Read event stream
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

// Subscribe to event stream
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

### Framework Comparison

| Feature | Axon Framework | EventStoreDB | Marten (C#) |
|---------|---------------|--------------|-------------|
| Language | Java | Multi-language | C# |
| Type | Application Framework | Database | ORM + ES |
| Learning Curve | Medium | Low | Medium |
| Feature Completeness | High | High | High |
| Distributed Support | Axon Server | Native Clustering | Depends on PostgreSQL |
| Community Activity | High | High | Medium |

---

## Use Cases and Trade-offs

### When to Use Event Sourcing

**1. Systems with Strict Audit Requirements**

Financial, healthcare, and legal domains require complete operation history:

```typescript
// Financial trading system
class TradingAccount extends AggregateRoot {
  // Every transaction is recorded as an event, meeting regulatory requirements
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

**2. Systems Requiring Time Travel**

Scenarios where you need to view state at any point in time:

```typescript
// View account balance at a specific time
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

**3. Complex Business Processes**

Business processes involving multiple steps that require compensation:

```typescript
// Order processing Saga
class OrderProcessingSaga {
  private steps: SagaStep[] = [];

  async execute(): Promise<void> {
    for (const step of this.steps) {
      try {
        await step.execute();
        // Successful execution event is recorded
      } catch (error) {
        // Execute compensation
        await this.compensate();
        throw error;
      }
    }
  }

  private async compensate(): Promise<void> {
    // Execute compensation in reverse order
    for (const step of [...this.steps].reverse()) {
      if (step.executed) {
        await step.compensate();
      }
    }
  }
}
```

**4. Event-Driven Integration Scenarios**

Integration between microservices through events:

```typescript
// Inventory service listening to order events
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

### When NOT to Use Event Sourcing

1. **Simple CRUD Applications**: The added complexity is not worth it
2. **Frequently Updated Data**: Such as real-time counters, session data
3. **Storage Space Constraints**: Event stores grow continuously
4. **Inexperienced Teams**: Requires familiarity with DDD and event-driven architecture

### Trade-off Analysis

| Advantages | Disadvantages |
|------------|---------------|
| Complete audit trail | Storage space grows continuously |
| Time travel capability | Increased query complexity |
| Easy to debug issues | Steep learning curve |
| Natural event-driven support | Complex eventual consistency handling |
| High write performance | Reading requires reconstruction or projections |
| Easy to extend and integrate | Difficult event version evolution |

---

## Interview Key Points

### Common Interview Questions

**1. What is Event Sourcing? How does it differ from traditional CRUD?**

Key points:
- Stores event sequence instead of final state
- Immutability and complete history
- Can rebuild state at any point in time
- Data model comparison with CRUD

**2. How do you handle concurrency in Event Sourcing?**

```typescript
// Using optimistic concurrency control
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

  // Continue saving events...
}
```

**3. How do you address performance issues in Event Sourcing?**

Key points:
- Snapshot mechanism to reduce replay time
- Projections to optimize read performance
- Event partitioning and archiving strategies
- Asynchronous projection processing

**4. How do you handle event version evolution?**

Key points:
- Upcasting strategy
- Event version number management
- Backward compatibility design
- Event migration tools

**5. What is the relationship between Event Sourcing and CQRS?**

Key points:
- Can be used independently but often combined
- CQRS separates read and write models
- Event sourcing provides the write model
- Projections build the read model

### System Design Question Example

**Design an order system supporting Event Sourcing**

```
Design points:

1. Event Store Design
   - PostgreSQL/EventStoreDB as event store
   - Event table structure design
   - Index optimization

2. Aggregate Design
   - Order aggregate root
   - Command and event definitions
   - Business rule validation

3. Read Model Design
   - Order list projection
   - Order detail projection
   - Statistics report projection

4. Consistency Handling
   - Optimistic concurrency control
   - Idempotency handling
   - Event publishing guarantees

5. Scalability Considerations
   - Snapshot strategy
   - Event archiving
   - Distributed deployment
```

### Key Concepts Summary

```
+--------------------------------------------------------------+
|                 Event Sourcing Core Concepts                  |
+--------------------------------------------------------------+
|  Event Store                                                  |
|  +-- Event structure: eventId, type, aggregateId, version,   |
|  |   payload                                                  |
|  +-- Concurrency control: Optimistic locking + version number |
|  +-- Storage options: PostgreSQL, EventStoreDB, DynamoDB      |
+--------------------------------------------------------------+
|  Aggregate Reconstruction                                     |
|  +-- Rebuild state from event stream                          |
|  +-- Snapshot optimization: Periodic snapshot + incremental   |
|  |   events                                                   |
|  +-- Repository pattern: Load -> Modify -> Save               |
+--------------------------------------------------------------+
|  CQRS Integration                                             |
|  +-- Command side: Aggregates + Event store                   |
|  +-- Query side: Projections + Read models                    |
|  +-- Synchronization: Sync/Async projections                  |
+--------------------------------------------------------------+
|  Version Evolution                                            |
|  +-- Upcasting: Upgrade on read                               |
|  +-- Event migration: Batch transformation                    |
|  +-- Backward compatibility: Add fields + default values      |
+--------------------------------------------------------------+
|  Eventual Consistency                                         |
|  +-- Event publishing: Message queue + Event bus              |
|  +-- Idempotency handling: Deduplication table + Idempotent   |
|  |   key                                                      |
|  +-- Compensation mechanism: Compensating events + Saga       |
+--------------------------------------------------------------+
```

---

## Further Reading

### Classic Books

1. **"Domain-Driven Design: Tackling Complexity in the Heart of Software"** - Eric Evans
   - The foundational DDD book, essential reading

2. **"Implementing Domain-Driven Design"** - Vaughn Vernon
   - More practice-focused with extensive code examples

3. **"Event Sourcing"** - Martin Fowler (online article)
   - Concise introduction to the pattern

4. **"Building Event-Driven Microservices"** - Adam Bellemare
   - Comprehensive guide to event-driven architecture

### Online Resources

- [EventStoreDB Documentation](https://developers.eventstore.com/) - Official EventStoreDB docs
- [Axon Framework Reference](https://docs.axoniq.io/) - Axon Framework documentation
- [Martin Fowler's Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) - Foundational article
- [CQRS Journey](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/jj554200(v=pandp.10)) - Microsoft's CQRS guide

### Related Patterns

- **CQRS (Command Query Responsibility Segregation)**: Separate read and write operations
- **Saga Pattern**: Manage distributed transactions
- **Event-Driven Architecture**: Build loosely coupled systems
- **Domain-Driven Design**: Model complex business domains

### Recommended Practice Projects

- [EventStoreDB Samples](https://github.com/EventStore/samples) - Official EventStoreDB examples
- [Axon Quick Start](https://github.com/AxonFramework/AxonFramework) - Axon Framework examples
- [eShopOnContainers](https://github.com/dotnet-architecture/eShopOnContainers) - Microsoft's microservices reference application

---

## Summary

Event Sourcing is a powerful architectural pattern that provides complete audit trails, time travel capabilities, and high scalability by storing event sequences instead of current state. While it adds system complexity, this complexity is worthwhile in scenarios with strict audit requirements and complex business processes.

Mastering Event Sourcing requires understanding these core concepts:

1. **Events are First-Class Citizens**: Events are immutable and represent facts that have occurred
2. **State is Derived**: State is rebuilt by replaying events
3. **Complements CQRS**: Read-write separation improves performance
4. **Handle Version Evolution Carefully**: Event structure changes require careful planning
5. **Eventual Consistency is the Norm**: Accept and properly handle consistency delays

Event Sourcing is not a silver bullet and should be weighed based on specific scenarios. However, once mastered, it becomes a powerful tool for building complex, reliable systems.
