---
title: CQRS Command Query Responsibility Segregation
description: Master CQRS pattern for read-write separation
track: architecture
section: design-patterns
difficulty: advanced
tags:
  - CQRS
  - Architecture Pattern
  - Read-Write Separation
  - Event Sourcing
status: imported
origin: old/src/content/docs/architecture/cqrs.en.md
divergence: 0.228
issues: []
legacy:
  category: Architecture
  subcategory: Patterns
  order: 14
  lastUpdated: 2026-01-07
---

## Understanding CQRS

Command Query Responsibility Segregation (CQRS) is an architectural pattern that separates read and write operations into distinct models. This separation allows each model to be optimized independently for its specific purpose, leading to improved scalability, performance, and maintainability in complex systems.

### The Core Principle

At its heart, CQRS builds upon Bertrand Meyer's Command Query Separation (CQS) principle, which states that every method should either be a command that performs an action, or a query that returns data, but never both. CQRS takes this concept to the architectural level by applying it to the entire system design.

Traditional CRUD-based architectures use a single model for both reading and writing data. While this approach works well for simple applications, it becomes problematic as systems grow in complexity:

```
Traditional Architecture:
┌─────────────────────────────────────────────────────────┐
│                    Single Model                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Domain Model / DTO                   │   │
│  │  - Used for reads AND writes                     │   │
│  │  - Optimized for neither                         │   │
│  │  - Complex mapping logic                         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

CQRS Architecture:
┌────────────────────────┐    ┌────────────────────────────┐
│     Command Side       │    │        Query Side          │
│  ┌──────────────────┐  │    │  ┌──────────────────────┐  │
│  │   Write Model    │  │    │  │     Read Model       │  │
│  │  - Rich domain   │  │    │  │  - Denormalized      │  │
│  │  - Validation    │  │    │  │  - Query optimized   │  │
│  │  - Business rules│  │    │  │  - Fast retrieval    │  │
│  └──────────────────┘  │    │  └──────────────────────┘  │
└────────────────────────┘    └────────────────────────────┘
```

### When to Use CQRS

CQRS is particularly valuable in scenarios where:

1. **Read and write patterns differ significantly**: When queries require complex joins or aggregations that conflict with write optimization
2. **Scaling requirements differ**: When read operations vastly outnumber writes (or vice versa)
3. **Domain complexity is high**: When the write model requires rich domain logic that complicates read operations
4. **Team specialization**: When different teams handle read-optimized views versus domain logic
5. **Audit and compliance needs**: When you need complete traceability of all state changes

However, CQRS adds complexity and should be avoided for simple CRUD applications where a single model suffices.

---

## Commands and Command Handlers

Commands represent intentions to change the system state. They are named using imperative verbs that clearly express the desired action.

### Defining Commands

A well-designed command is:
- **Immutable**: Once created, its properties cannot change
- **Task-based**: Represents a specific user intention, not just data
- **Self-validating**: Contains validation logic for its own data

```typescript
// Base command interface
interface Command {
  readonly commandId: string;
  readonly timestamp: Date;
  readonly correlationId: string;  // For tracing related operations
}

// Specific command implementations
class CreateOrderCommand implements Command {
  readonly commandId: string;
  readonly timestamp: Date;
  readonly correlationId: string;

  constructor(
    public readonly customerId: string,
    public readonly items: ReadonlyArray<OrderItemDTO>,
    public readonly shippingAddress: AddressDTO,
    correlationId?: string
  ) {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
    this.correlationId = correlationId ?? crypto.randomUUID();

    this.validate();
  }

  private validate(): void {
    if (!this.customerId?.trim()) {
      throw new ValidationError('Customer ID is required');
    }
    if (!this.items?.length) {
      throw new ValidationError('At least one item is required');
    }
    if (!this.shippingAddress) {
      throw new ValidationError('Shipping address is required');
    }
  }
}

class ConfirmOrderCommand implements Command {
  readonly commandId: string;
  readonly timestamp: Date;
  readonly correlationId: string;

  constructor(
    public readonly orderId: string,
    correlationId?: string
  ) {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
    this.correlationId = correlationId ?? crypto.randomUUID();

    if (!orderId?.trim()) {
      throw new ValidationError('Order ID is required');
    }
  }
}

class CancelOrderCommand implements Command {
  readonly commandId: string;
  readonly timestamp: Date;
  readonly correlationId: string;

  constructor(
    public readonly orderId: string,
    public readonly reason: string,
    correlationId?: string
  ) {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
    this.correlationId = correlationId ?? crypto.randomUUID();

    if (!orderId?.trim()) {
      throw new ValidationError('Order ID is required');
    }
    if (!reason?.trim()) {
      throw new ValidationError('Cancellation reason is required');
    }
  }
}
```

### Implementing Command Handlers

Command handlers contain the business logic for processing commands. Each handler is responsible for exactly one command type.

```typescript
// Command handler interface
interface CommandHandler<T extends Command> {
  handle(command: T): Promise<CommandResult>;
}

// Command result for returning execution status
interface CommandResult {
  success: boolean;
  aggregateId?: string;
  version?: number;
  error?: string;
}

// Order command handlers
class CreateOrderHandler implements CommandHandler<CreateOrderCommand> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly productService: ProductService,
    private readonly eventBus: EventBus
  ) {}

  async handle(command: CreateOrderCommand): Promise<CommandResult> {
    try {
      // Validate customer exists
      const customer = await this.customerRepository.findById(command.customerId);
      if (!customer) {
        return {
          success: false,
          error: `Customer not found: ${command.customerId}`
        };
      }

      // Validate products and get current prices
      const orderItems: OrderItem[] = [];
      for (const item of command.items) {
        const product = await this.productService.getProduct(item.productId);
        if (!product) {
          return {
            success: false,
            error: `Product not found: ${item.productId}`
          };
        }
        if (!product.isAvailable) {
          return {
            success: false,
            error: `Product not available: ${item.productId}`
          };
        }

        orderItems.push(new OrderItem(
          product.id,
          product.name,
          item.quantity,
          Money.create(product.price, product.currency)
        ));
      }

      // Create the order aggregate
      const orderId = this.orderRepository.nextId();
      const order = Order.create(
        orderId,
        command.customerId,
        orderItems,
        Address.fromDTO(command.shippingAddress)
      );

      // Persist the order
      await this.orderRepository.save(order);

      // Publish domain events
      for (const event of order.domainEvents) {
        await this.eventBus.publish(event);
      }
      order.clearEvents();

      return {
        success: true,
        aggregateId: orderId.value,
        version: order.version
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

class ConfirmOrderHandler implements CommandHandler<ConfirmOrderCommand> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentService: PaymentService,
    private readonly eventBus: EventBus
  ) {}

  async handle(command: ConfirmOrderCommand): Promise<CommandResult> {
    try {
      const order = await this.orderRepository.findById(
        new OrderId(command.orderId)
      );

      if (!order) {
        return {
          success: false,
          error: `Order not found: ${command.orderId}`
        };
      }

      // Execute domain logic
      order.confirm();

      // Persist changes
      await this.orderRepository.save(order);

      // Publish events
      for (const event of order.domainEvents) {
        await this.eventBus.publish(event);
      }
      order.clearEvents();

      return {
        success: true,
        aggregateId: order.id.value,
        version: order.version
      };
    } catch (error) {
      if (error instanceof DomainError) {
        return { success: false, error: error.message };
      }
      throw error;
    }
  }
}
```

### Command Bus Pattern

A command bus routes commands to their appropriate handlers, providing a clean separation between command dispatch and execution:

```typescript
// Command bus interface
interface CommandBus {
  dispatch<T extends Command>(command: T): Promise<CommandResult>;
  register<T extends Command>(
    commandType: new (...args: any[]) => T,
    handler: CommandHandler<T>
  ): void;
}

// Implementation with middleware support
class InMemoryCommandBus implements CommandBus {
  private handlers = new Map<string, CommandHandler<any>>();
  private middlewares: CommandMiddleware[] = [];

  register<T extends Command>(
    commandType: new (...args: any[]) => T,
    handler: CommandHandler<T>
  ): void {
    this.handlers.set(commandType.name, handler);
  }

  use(middleware: CommandMiddleware): void {
    this.middlewares.push(middleware);
  }

  async dispatch<T extends Command>(command: T): Promise<CommandResult> {
    const handler = this.handlers.get(command.constructor.name);

    if (!handler) {
      throw new Error(`No handler registered for ${command.constructor.name}`);
    }

    // Build middleware chain
    let next = () => handler.handle(command);

    for (const middleware of [...this.middlewares].reverse()) {
      const currentNext = next;
      next = () => middleware.execute(command, currentNext);
    }

    return next();
  }
}

// Middleware for cross-cutting concerns
interface CommandMiddleware {
  execute<T extends Command>(
    command: T,
    next: () => Promise<CommandResult>
  ): Promise<CommandResult>;
}

// Logging middleware
class LoggingMiddleware implements CommandMiddleware {
  constructor(private readonly logger: Logger) {}

  async execute<T extends Command>(
    command: T,
    next: () => Promise<CommandResult>
  ): Promise<CommandResult> {
    const startTime = Date.now();

    this.logger.info('Executing command', {
      commandType: command.constructor.name,
      commandId: command.commandId,
      correlationId: command.correlationId
    });

    try {
      const result = await next();

      this.logger.info('Command executed', {
        commandType: command.constructor.name,
        commandId: command.commandId,
        success: result.success,
        duration: Date.now() - startTime
      });

      return result;
    } catch (error) {
      this.logger.error('Command failed', {
        commandType: command.constructor.name,
        commandId: command.commandId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
      throw error;
    }
  }
}

// Validation middleware
class ValidationMiddleware implements CommandMiddleware {
  async execute<T extends Command>(
    command: T,
    next: () => Promise<CommandResult>
  ): Promise<CommandResult> {
    // Commands self-validate in constructor, but we can add
    // additional cross-cutting validation here
    if (!command.commandId || !command.timestamp) {
      return {
        success: false,
        error: 'Invalid command: missing required metadata'
      };
    }

    return next();
  }
}

// Transaction middleware
class TransactionMiddleware implements CommandMiddleware {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute<T extends Command>(
    command: T,
    next: () => Promise<CommandResult>
  ): Promise<CommandResult> {
    await this.unitOfWork.begin();

    try {
      const result = await next();

      if (result.success) {
        await this.unitOfWork.commit();
      } else {
        await this.unitOfWork.rollback();
      }

      return result;
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }
}
```

---

## Queries and Query Handlers

Queries represent requests for data without modifying system state. Unlike commands, queries return data and are designed for optimal read performance.

### Defining Queries

```typescript
// Base query interface with generic result type
interface Query<TResult> {
  readonly queryId: string;
  readonly timestamp: Date;
}

// Specific query implementations
class GetOrderByIdQuery implements Query<OrderReadModel | null> {
  readonly queryId: string;
  readonly timestamp: Date;

  constructor(public readonly orderId: string) {
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

class GetOrdersByCustomerQuery implements Query<PaginatedResult<OrderSummary>> {
  readonly queryId: string;
  readonly timestamp: Date;

  constructor(
    public readonly customerId: string,
    public readonly page: number = 1,
    public readonly pageSize: number = 20,
    public readonly status?: OrderStatus,
    public readonly sortBy: 'date' | 'amount' = 'date',
    public readonly sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

class GetOrderStatisticsQuery implements Query<OrderStatistics> {
  readonly queryId: string;
  readonly timestamp: Date;

  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly customerId?: string
  ) {
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

class SearchOrdersQuery implements Query<PaginatedResult<OrderSearchResult>> {
  readonly queryId: string;
  readonly timestamp: Date;

  constructor(
    public readonly searchTerm: string,
    public readonly filters: OrderFilters,
    public readonly page: number = 1,
    public readonly pageSize: number = 20
  ) {
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}
```

### Read Models

Read models are optimized data structures for specific query needs. They are often denormalized for fast retrieval:

```typescript
// Read model for order details
interface OrderReadModel {
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: string;
  statusLabel: string;  // Human-readable status
  items: Array<{
    productId: string;
    productName: string;
    productImageUrl: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  currency: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

// Read model for order list/summary
interface OrderSummary {
  orderId: string;
  customerName: string;
  status: string;
  statusLabel: string;
  itemCount: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

// Statistics read model
interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orderCount: number;
  }>;
}
```

### Implementing Query Handlers

Query handlers retrieve data from read-optimized storage:

```typescript
// Query handler interface
interface QueryHandler<TQuery extends Query<TResult>, TResult> {
  handle(query: TQuery): Promise<TResult>;
}

// Order query handlers
class GetOrderByIdHandler
  implements QueryHandler<GetOrderByIdQuery, OrderReadModel | null> {

  constructor(private readonly readDb: ReadDatabase) {}

  async handle(query: GetOrderByIdQuery): Promise<OrderReadModel | null> {
    const result = await this.readDb.query<OrderReadModel>(
      `SELECT
        o.order_id as "orderId",
        o.customer_id as "customerId",
        o.customer_name as "customerName",
        o.customer_email as "customerEmail",
        o.status,
        o.status_label as "statusLabel",
        o.items,
        o.subtotal,
        o.shipping_cost as "shippingCost",
        o.tax,
        o.total_amount as "totalAmount",
        o.currency,
        o.shipping_address as "shippingAddress",
        o.created_at as "createdAt",
        o.confirmed_at as "confirmedAt",
        o.shipped_at as "shippedAt",
        o.delivered_at as "deliveredAt",
        o.cancelled_at as "cancelledAt",
        o.cancellation_reason as "cancellationReason"
      FROM order_read_model o
      WHERE o.order_id = $1`,
      [query.orderId]
    );

    return result.rows[0] || null;
  }
}

class GetOrdersByCustomerHandler
  implements QueryHandler<GetOrdersByCustomerQuery, PaginatedResult<OrderSummary>> {

  constructor(private readonly readDb: ReadDatabase) {}

  async handle(
    query: GetOrdersByCustomerQuery
  ): Promise<PaginatedResult<OrderSummary>> {
    const offset = (query.page - 1) * query.pageSize;

    // Build dynamic query
    let whereClause = 'WHERE o.customer_id = $1';
    const params: any[] = [query.customerId];
    let paramIndex = 2;

    if (query.status) {
      whereClause += ` AND o.status = $${paramIndex}`;
      params.push(query.status);
      paramIndex++;
    }

    const orderByColumn = query.sortBy === 'amount'
      ? 'o.total_amount'
      : 'o.created_at';

    const [ordersResult, countResult] = await Promise.all([
      this.readDb.query<OrderSummary>(
        `SELECT
          o.order_id as "orderId",
          o.customer_name as "customerName",
          o.status,
          o.status_label as "statusLabel",
          o.item_count as "itemCount",
          o.total_amount as "totalAmount",
          o.currency,
          o.created_at as "createdAt"
        FROM order_summary_view o
        ${whereClause}
        ORDER BY ${orderByColumn} ${query.sortOrder.toUpperCase()}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, query.pageSize, offset]
      ),
      this.readDb.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM order_summary_view o ${whereClause}`,
        params
      )
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    return {
      items: ordersResult.rows,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize)
    };
  }
}

class GetOrderStatisticsHandler
  implements QueryHandler<GetOrderStatisticsQuery, OrderStatistics> {

  constructor(private readonly readDb: ReadDatabase) {}

  async handle(query: GetOrderStatisticsQuery): Promise<OrderStatistics> {
    const baseCondition = query.customerId
      ? 'AND customer_id = $3'
      : '';
    const params = query.customerId
      ? [query.startDate, query.endDate, query.customerId]
      : [query.startDate, query.endDate];

    const [summary, byStatus, topProducts, byDay] = await Promise.all([
      // Overall summary
      this.readDb.query(
        `SELECT
          COUNT(*) as total_orders,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(AVG(total_amount), 0) as average_order_value
        FROM order_read_model
        WHERE created_at BETWEEN $1 AND $2 ${baseCondition}`,
        params
      ),

      // Orders by status
      this.readDb.query(
        `SELECT status, COUNT(*) as count
        FROM order_read_model
        WHERE created_at BETWEEN $1 AND $2 ${baseCondition}
        GROUP BY status`,
        params
      ),

      // Top products
      this.readDb.query(
        `SELECT
          p.product_id,
          p.product_name,
          SUM(p.quantity) as quantity,
          SUM(p.total_price) as revenue
        FROM order_read_model o,
          jsonb_to_recordset(o.items) as p(
            product_id text,
            product_name text,
            quantity int,
            total_price numeric
          )
        WHERE o.created_at BETWEEN $1 AND $2 ${baseCondition}
        GROUP BY p.product_id, p.product_name
        ORDER BY revenue DESC
        LIMIT 10`,
        params
      ),

      // Revenue by day
      this.readDb.query(
        `SELECT
          DATE(created_at) as date,
          SUM(total_amount) as revenue,
          COUNT(*) as order_count
        FROM order_read_model
        WHERE created_at BETWEEN $1 AND $2 ${baseCondition}
        GROUP BY DATE(created_at)
        ORDER BY date`,
        params
      )
    ]);

    return {
      totalOrders: parseInt(summary.rows[0].total_orders, 10),
      totalRevenue: parseFloat(summary.rows[0].total_revenue),
      averageOrderValue: parseFloat(summary.rows[0].average_order_value),
      ordersByStatus: Object.fromEntries(
        byStatus.rows.map(r => [r.status, parseInt(r.count, 10)])
      ),
      topProducts: topProducts.rows.map(r => ({
        productId: r.product_id,
        productName: r.product_name,
        quantity: parseInt(r.quantity, 10),
        revenue: parseFloat(r.revenue)
      })),
      revenueByDay: byDay.rows.map(r => ({
        date: r.date,
        revenue: parseFloat(r.revenue),
        orderCount: parseInt(r.order_count, 10)
      }))
    };
  }
}
```

### Query Bus Implementation

```typescript
// Query bus interface
interface QueryBus {
  execute<TResult>(query: Query<TResult>): Promise<TResult>;
  register<TQuery extends Query<TResult>, TResult>(
    queryType: new (...args: any[]) => TQuery,
    handler: QueryHandler<TQuery, TResult>
  ): void;
}

class InMemoryQueryBus implements QueryBus {
  private handlers = new Map<string, QueryHandler<any, any>>();
  private middlewares: QueryMiddleware[] = [];

  register<TQuery extends Query<TResult>, TResult>(
    queryType: new (...args: any[]) => TQuery,
    handler: QueryHandler<TQuery, TResult>
  ): void {
    this.handlers.set(queryType.name, handler);
  }

  use(middleware: QueryMiddleware): void {
    this.middlewares.push(middleware);
  }

  async execute<TResult>(query: Query<TResult>): Promise<TResult> {
    const handler = this.handlers.get(query.constructor.name);

    if (!handler) {
      throw new Error(`No handler registered for ${query.constructor.name}`);
    }

    // Build middleware chain
    let next = () => handler.handle(query);

    for (const middleware of [...this.middlewares].reverse()) {
      const currentNext = next;
      next = () => middleware.execute(query, currentNext);
    }

    return next();
  }
}

// Caching middleware for queries
class CachingMiddleware implements QueryMiddleware {
  constructor(
    private readonly cache: Cache,
    private readonly ttlSeconds: number = 60
  ) {}

  async execute<TResult>(
    query: Query<TResult>,
    next: () => Promise<TResult>
  ): Promise<TResult> {
    const cacheKey = this.buildCacheKey(query);

    // Check cache
    const cached = await this.cache.get<TResult>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute query
    const result = await next();

    // Cache result
    await this.cache.set(cacheKey, result, this.ttlSeconds);

    return result;
  }

  private buildCacheKey(query: Query<any>): string {
    const queryData = JSON.stringify(query);
    return `query:${query.constructor.name}:${this.hash(queryData)}`;
  }

  private hash(str: string): string {
    // Simple hash function for cache key generation
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
```

---

## Synchronizing Read and Write Models

One of the key challenges in CQRS is keeping read models synchronized with the write model. There are several strategies for this synchronization.

### Synchronous Projections

The simplest approach updates read models in the same transaction as the write operation:

```typescript
class SynchronousOrderProjector {
  constructor(
    private readonly writeDb: Database,
    private readonly readDb: Database
  ) {}

  async projectOrder(order: Order): Promise<void> {
    await this.writeDb.transaction(async (tx) => {
      // Save to write model
      await tx.query(
        `INSERT INTO orders (id, customer_id, status, items, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           status = $3,
           items = $4`,
        [
          order.id.value,
          order.customerId,
          order.status,
          JSON.stringify(order.items),
          order.createdAt
        ]
      );

      // Update read model in same transaction
      const readModel = await this.buildReadModel(order);
      await tx.query(
        `INSERT INTO order_read_model (order_id, customer_id, customer_name, ...)
         VALUES ($1, $2, $3, ...)
         ON CONFLICT (order_id) DO UPDATE SET ...`,
        [readModel.orderId, readModel.customerId, readModel.customerName, ...]
      );
    });
  }
}
```

**Pros**: Simple, strongly consistent, no eventual consistency to handle
**Cons**: Tightly coupled, slower writes, limited scalability

### Asynchronous Projections via Events

A more scalable approach uses domain events to update read models asynchronously:

```typescript
// Event-driven projection
class OrderProjection {
  constructor(
    private readonly readDb: Database,
    private readonly customerService: CustomerService,
    private readonly productService: ProductService
  ) {}

  @EventHandler('OrderCreated')
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // Fetch additional data for denormalization
    const customer = await this.customerService.getCustomer(event.customerId);

    const items = await Promise.all(
      event.items.map(async (item) => {
        const product = await this.productService.getProduct(item.productId);
        return {
          productId: item.productId,
          productName: product.name,
          productImageUrl: product.imageUrl,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        };
      })
    );

    await this.readDb.query(
      `INSERT INTO order_read_model (
        order_id, customer_id, customer_name, customer_email,
        status, status_label, items, subtotal, total_amount,
        currency, shipping_address, created_at, item_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        event.orderId,
        event.customerId,
        customer.name,
        customer.email,
        'PENDING',
        'Pending',
        JSON.stringify(items),
        event.subtotal,
        event.totalAmount,
        event.currency,
        JSON.stringify(event.shippingAddress),
        event.timestamp,
        items.reduce((sum, i) => sum + i.quantity, 0)
      ]
    );
  }

  @EventHandler('OrderConfirmed')
  async onOrderConfirmed(event: OrderConfirmedEvent): Promise<void> {
    await this.readDb.query(
      `UPDATE order_read_model
       SET status = $1, status_label = $2, confirmed_at = $3
       WHERE order_id = $4`,
      ['CONFIRMED', 'Confirmed', event.timestamp, event.orderId]
    );
  }

  @EventHandler('OrderShipped')
  async onOrderShipped(event: OrderShippedEvent): Promise<void> {
    await this.readDb.query(
      `UPDATE order_read_model
       SET status = $1, status_label = $2, shipped_at = $3,
           tracking_number = $4, carrier = $5
       WHERE order_id = $6`,
      [
        'SHIPPED',
        'Shipped',
        event.timestamp,
        event.trackingNumber,
        event.carrier,
        event.orderId
      ]
    );
  }

  @EventHandler('OrderCancelled')
  async onOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    await this.readDb.query(
      `UPDATE order_read_model
       SET status = $1, status_label = $2, cancelled_at = $3,
           cancellation_reason = $4
       WHERE order_id = $5`,
      [
        'CANCELLED',
        'Cancelled',
        event.timestamp,
        event.reason,
        event.orderId
      ]
    );
  }
}
```

### Projection Infrastructure

A robust projection system handles failures, retries, and checkpointing:

```typescript
// Projection manager with checkpoint tracking
class ProjectionManager {
  private projections: Map<string, Projection> = new Map();

  constructor(
    private readonly eventStore: EventStore,
    private readonly checkpointStore: CheckpointStore
  ) {}

  register(projection: Projection): void {
    this.projections.set(projection.name, projection);
  }

  async start(): Promise<void> {
    for (const [name, projection] of this.projections) {
      this.runProjection(name, projection);
    }
  }

  private async runProjection(
    name: string,
    projection: Projection
  ): Promise<void> {
    while (true) {
      try {
        const checkpoint = await this.checkpointStore.get(name);
        const events = await this.eventStore.readFromPosition(
          checkpoint,
          100  // batch size
        );

        if (events.length === 0) {
          await this.sleep(100);  // Wait for new events
          continue;
        }

        for (const event of events) {
          if (projection.canHandle(event.eventType)) {
            await this.handleWithRetry(projection, event);
          }
          await this.checkpointStore.save(name, event.globalPosition);
        }
      } catch (error) {
        console.error(`Projection ${name} error:`, error);
        await this.sleep(5000);  // Back off on error
      }
    }
  }

  private async handleWithRetry(
    projection: Projection,
    event: DomainEvent,
    maxRetries: number = 3
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await projection.handle(event);
        return;
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `Projection failed (attempt ${attempt}/${maxRetries}):`,
          error
        );
        await this.sleep(Math.pow(2, attempt) * 1000);  // Exponential backoff
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Checkpoint storage
interface CheckpointStore {
  get(projectionName: string): Promise<number>;
  save(projectionName: string, position: number): Promise<void>;
}

class PostgresCheckpointStore implements CheckpointStore {
  constructor(private readonly db: Database) {}

  async get(projectionName: string): Promise<number> {
    const result = await this.db.query(
      'SELECT position FROM projection_checkpoints WHERE name = $1',
      [projectionName]
    );
    return result.rows[0]?.position ?? 0;
  }

  async save(projectionName: string, position: number): Promise<void> {
    await this.db.query(
      `INSERT INTO projection_checkpoints (name, position, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (name) DO UPDATE SET position = $2, updated_at = NOW()`,
      [projectionName, position]
    );
  }
}
```

### Rebuilding Projections

When read model schemas change or projections have bugs, you need to rebuild them:

```typescript
class ProjectionRebuilder {
  constructor(
    private readonly eventStore: EventStore,
    private readonly checkpointStore: CheckpointStore
  ) {}

  async rebuild(projection: Projection): Promise<void> {
    console.log(`Starting rebuild of projection: ${projection.name}`);

    // Clear existing data
    await projection.reset();

    // Reset checkpoint to beginning
    await this.checkpointStore.save(projection.name, 0);

    let position = 0;
    let processedCount = 0;
    const startTime = Date.now();

    while (true) {
      const events = await this.eventStore.readFromPosition(position, 1000);

      if (events.length === 0) {
        break;
      }

      for (const event of events) {
        if (projection.canHandle(event.eventType)) {
          await projection.handle(event);
          processedCount++;
        }
        position = event.globalPosition;
      }

      await this.checkpointStore.save(projection.name, position);

      console.log(`Processed ${processedCount} events, position: ${position}`);
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(
      `Rebuild complete. Processed ${processedCount} events in ${duration}s`
    );
  }
}
```

---

## CQRS with Event Sourcing

CQRS pairs naturally with Event Sourcing, where the write model stores events rather than current state. This combination provides powerful capabilities for audit trails, temporal queries, and debugging.

### The Combined Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                            Client                                    │
└─────────────────────────────────────────────────────────────────────┘
              │                                    │
              │ Commands                           │ Queries
              ▼                                    ▼
┌─────────────────────────────┐    ┌─────────────────────────────────┐
│       Command Side          │    │          Query Side             │
│                             │    │                                 │
│  ┌───────────────────────┐  │    │  ┌───────────────────────────┐  │
│  │   Command Handler     │  │    │  │     Query Handler         │  │
│  └───────────┬───────────┘  │    │  └───────────┬───────────────┘  │
│              │              │    │              │                  │
│  ┌───────────▼───────────┐  │    │  ┌───────────▼───────────────┐  │
│  │   Aggregate Root      │  │    │  │     Read Model Store      │  │
│  │   (Domain Model)      │  │    │  │   (PostgreSQL/Redis/ES)   │  │
│  └───────────┬───────────┘  │    │  └───────────────────────────┘  │
│              │              │    │              ▲                  │
│  ┌───────────▼───────────┐  │    │              │ Projections      │
│  │     Event Store       │──┼────┼──────────────┘                  │
│  │   (Append-only log)   │  │    │                                 │
│  └───────────────────────┘  │    │                                 │
└─────────────────────────────┘    └─────────────────────────────────┘
```

### Event-Sourced Aggregate

```typescript
// Base class for event-sourced aggregates
abstract class EventSourcedAggregate {
  private _id: string;
  private _version: number = 0;
  private _uncommittedEvents: DomainEvent[] = [];

  get id(): string {
    return this._id;
  }

  get version(): number {
    return this._version;
  }

  get uncommittedEvents(): ReadonlyArray<DomainEvent> {
    return [...this._uncommittedEvents];
  }

  clearUncommittedEvents(): void {
    this._uncommittedEvents = [];
  }

  // Load aggregate from event history
  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.applyEvent(event, false);
    }
  }

  // Apply a new event
  protected apply(event: DomainEvent): void {
    this.applyEvent(event, true);
  }

  private applyEvent(event: DomainEvent, isNew: boolean): void {
    this.when(event);
    this._version = event.version;

    if (isNew) {
      this._uncommittedEvents.push(event);
    }
  }

  // Subclasses implement event handling
  protected abstract when(event: DomainEvent): void;
}

// Event-sourced Order aggregate
class Order extends EventSourcedAggregate {
  private customerId: string;
  private items: Map<string, OrderItem> = new Map();
  private status: OrderStatus;
  private shippingAddress: Address;
  private confirmedAt?: Date;

  static create(
    id: string,
    customerId: string,
    items: OrderItem[],
    shippingAddress: Address
  ): Order {
    const order = new Order();

    order.apply(new OrderCreatedEvent({
      aggregateId: id,
      version: 1,
      customerId,
      items: items.map(i => i.toSnapshot()),
      shippingAddress: shippingAddress.toSnapshot(),
      timestamp: new Date()
    }));

    return order;
  }

  confirm(): void {
    if (this.status !== OrderStatus.Pending) {
      throw new DomainError('Only pending orders can be confirmed');
    }

    this.apply(new OrderConfirmedEvent({
      aggregateId: this.id,
      version: this.version + 1,
      timestamp: new Date()
    }));
  }

  addItem(item: OrderItem): void {
    if (this.status !== OrderStatus.Pending) {
      throw new DomainError('Cannot modify confirmed order');
    }

    this.apply(new OrderItemAddedEvent({
      aggregateId: this.id,
      version: this.version + 1,
      item: item.toSnapshot(),
      timestamp: new Date()
    }));
  }

  protected when(event: DomainEvent): void {
    if (event instanceof OrderCreatedEvent) {
      this._id = event.aggregateId;
      this.customerId = event.customerId;
      this.status = OrderStatus.Pending;
      this.shippingAddress = Address.fromSnapshot(event.shippingAddress);
      for (const itemData of event.items) {
        const item = OrderItem.fromSnapshot(itemData);
        this.items.set(item.productId, item);
      }
    } else if (event instanceof OrderConfirmedEvent) {
      this.status = OrderStatus.Confirmed;
      this.confirmedAt = event.timestamp;
    } else if (event instanceof OrderItemAddedEvent) {
      const item = OrderItem.fromSnapshot(event.item);
      const existing = this.items.get(item.productId);
      if (existing) {
        this.items.set(
          item.productId,
          existing.withQuantity(existing.quantity + item.quantity)
        );
      } else {
        this.items.set(item.productId, item);
      }
    }
  }

  // Snapshot for faster loading
  toSnapshot(): OrderSnapshot {
    return {
      id: this.id,
      version: this.version,
      customerId: this.customerId,
      items: Array.from(this.items.values()).map(i => i.toSnapshot()),
      status: this.status,
      shippingAddress: this.shippingAddress.toSnapshot(),
      confirmedAt: this.confirmedAt?.toISOString()
    };
  }

  static fromSnapshot(snapshot: OrderSnapshot): Order {
    const order = new Order();
    order._id = snapshot.id;
    order._version = snapshot.version;
    order.customerId = snapshot.customerId;
    order.status = snapshot.status;
    order.shippingAddress = Address.fromSnapshot(snapshot.shippingAddress);
    order.confirmedAt = snapshot.confirmedAt
      ? new Date(snapshot.confirmedAt)
      : undefined;
    for (const itemData of snapshot.items) {
      const item = OrderItem.fromSnapshot(itemData);
      order.items.set(item.productId, item);
    }
    return order;
  }
}
```

### Event-Sourced Repository

```typescript
class EventSourcedOrderRepository implements OrderRepository {
  private readonly SNAPSHOT_INTERVAL = 50;

  constructor(
    private readonly eventStore: EventStore,
    private readonly snapshotStore: SnapshotStore
  ) {}

  async findById(id: string): Promise<Order | null> {
    // Try to load from snapshot first
    const snapshot = await this.snapshotStore.getLatest(id, 'Order');

    let order: Order;
    let fromVersion: number;

    if (snapshot) {
      order = Order.fromSnapshot(snapshot.data);
      fromVersion = snapshot.version;
    } else {
      order = new Order();
      fromVersion = 0;
    }

    // Load events since snapshot
    const events = await this.eventStore.getEvents(
      id,
      'Order',
      fromVersion
    );

    if (events.length === 0 && !snapshot) {
      return null;
    }

    order.loadFromHistory(events);

    return order;
  }

  async save(order: Order): Promise<void> {
    const events = order.uncommittedEvents;

    if (events.length === 0) {
      return;
    }

    const expectedVersion = order.version - events.length;

    // Append events with optimistic concurrency
    await this.eventStore.appendEvents(
      order.id,
      'Order',
      events,
      expectedVersion
    );

    order.clearUncommittedEvents();

    // Create snapshot if needed
    if (order.version % this.SNAPSHOT_INTERVAL === 0) {
      await this.snapshotStore.save({
        aggregateId: order.id,
        aggregateType: 'Order',
        version: order.version,
        data: order.toSnapshot(),
        createdAt: new Date()
      });
    }
  }

  nextId(): string {
    return crypto.randomUUID();
  }
}
```

### Benefits of CQRS + Event Sourcing

1. **Complete Audit Trail**: Every change is captured as an immutable event
2. **Temporal Queries**: Reconstruct state at any point in time
3. **Debug Production Issues**: Replay events to understand what happened
4. **Flexible Projections**: Create new read models from existing events
5. **Scalability**: Scale read and write sides independently
6. **Event-Driven Integration**: Easy to integrate with other systems via events

---

## Practical Implementation Example

Let's build a complete order management system using CQRS:

### API Layer

```typescript
// Express.js controller
@Controller('/api/orders')
class OrderController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post('/')
  async createOrder(
    @Body() dto: CreateOrderDTO,
    @Req() req: Request
  ): Promise<ApiResponse> {
    const command = new CreateOrderCommand(
      req.user.customerId,
      dto.items,
      dto.shippingAddress
    );

    const result = await this.commandBus.dispatch(command);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      success: true,
      data: { orderId: result.aggregateId }
    };
  }

  @Post('/:orderId/confirm')
  async confirmOrder(
    @Param('orderId') orderId: string
  ): Promise<ApiResponse> {
    const command = new ConfirmOrderCommand(orderId);
    const result = await this.commandBus.dispatch(command);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return { success: true };
  }

  @Get('/:orderId')
  async getOrder(
    @Param('orderId') orderId: string
  ): Promise<ApiResponse<OrderReadModel>> {
    const query = new GetOrderByIdQuery(orderId);
    const order = await this.queryBus.execute(query);

    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }

    return { success: true, data: order };
  }

  @Get('/')
  async getOrders(
    @Query() params: GetOrdersQueryParams,
    @Req() req: Request
  ): Promise<ApiResponse<PaginatedResult<OrderSummary>>> {
    const query = new GetOrdersByCustomerQuery(
      req.user.customerId,
      params.page,
      params.pageSize,
      params.status,
      params.sortBy,
      params.sortOrder
    );

    const result = await this.queryBus.execute(query);

    return { success: true, data: result };
  }

  @Get('/statistics')
  async getStatistics(
    @Query() params: StatisticsQueryParams,
    @Req() req: Request
  ): Promise<ApiResponse<OrderStatistics>> {
    const query = new GetOrderStatisticsQuery(
      new Date(params.startDate),
      new Date(params.endDate),
      req.user.isAdmin ? params.customerId : req.user.customerId
    );

    const result = await this.queryBus.execute(query);

    return { success: true, data: result };
  }
}
```

### Application Setup

```typescript
// Dependency injection setup
class ApplicationContainer {
  private container = new Container();

  setup(): void {
    // Databases
    this.container.bind(WriteDatabase).toSelf().inSingletonScope();
    this.container.bind(ReadDatabase).toSelf().inSingletonScope();

    // Event infrastructure
    this.container.bind(EventStore).to(PostgresEventStore).inSingletonScope();
    this.container.bind(EventBus).to(RabbitMQEventBus).inSingletonScope();

    // Repositories
    this.container.bind(OrderRepository)
      .to(EventSourcedOrderRepository)
      .inSingletonScope();

    // Command handlers
    this.container.bind(CreateOrderHandler).toSelf();
    this.container.bind(ConfirmOrderHandler).toSelf();
    this.container.bind(CancelOrderHandler).toSelf();

    // Query handlers
    this.container.bind(GetOrderByIdHandler).toSelf();
    this.container.bind(GetOrdersByCustomerHandler).toSelf();
    this.container.bind(GetOrderStatisticsHandler).toSelf();

    // Buses
    this.container.bind(CommandBus).toDynamicValue(() => {
      const bus = new InMemoryCommandBus();

      // Register middleware
      bus.use(this.container.get(LoggingMiddleware));
      bus.use(this.container.get(ValidationMiddleware));
      bus.use(this.container.get(TransactionMiddleware));

      // Register handlers
      bus.register(CreateOrderCommand, this.container.get(CreateOrderHandler));
      bus.register(ConfirmOrderCommand, this.container.get(ConfirmOrderHandler));
      bus.register(CancelOrderCommand, this.container.get(CancelOrderHandler));

      return bus;
    }).inSingletonScope();

    this.container.bind(QueryBus).toDynamicValue(() => {
      const bus = new InMemoryQueryBus();

      // Register middleware
      bus.use(this.container.get(CachingMiddleware));

      // Register handlers
      bus.register(GetOrderByIdQuery, this.container.get(GetOrderByIdHandler));
      bus.register(
        GetOrdersByCustomerQuery,
        this.container.get(GetOrdersByCustomerHandler)
      );
      bus.register(
        GetOrderStatisticsQuery,
        this.container.get(GetOrderStatisticsHandler)
      );

      return bus;
    }).inSingletonScope();

    // Projections
    this.container.bind(OrderProjection).toSelf();
    this.container.bind(ProjectionManager).toSelf().inSingletonScope();
  }

  async startProjections(): Promise<void> {
    const manager = this.container.get(ProjectionManager);
    manager.register(this.container.get(OrderProjection));
    await manager.start();
  }

  get<T>(type: new (...args: any[]) => T): T {
    return this.container.get(type);
  }
}
```

### Database Schema

```sql
-- Write-side: Event Store
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_id VARCHAR(255) NOT NULL,
    aggregate_type VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    metadata JSONB NOT NULL,
    version INTEGER NOT NULL,
    global_position BIGSERIAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_aggregate_version
        UNIQUE (aggregate_id, aggregate_type, version)
);

CREATE INDEX idx_events_aggregate
    ON events (aggregate_id, aggregate_type, version);
CREATE INDEX idx_events_global_position
    ON events (global_position);
CREATE INDEX idx_events_type
    ON events (event_type, created_at);

-- Snapshots
CREATE TABLE snapshots (
    aggregate_id VARCHAR(255) NOT NULL,
    aggregate_type VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (aggregate_id, aggregate_type)
);

-- Read-side: Order Read Model
CREATE TABLE order_read_model (
    order_id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    status_label VARCHAR(100) NOT NULL,
    items JSONB NOT NULL,
    item_count INTEGER NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    shipping_cost DECIMAL(12, 2) DEFAULT 0,
    tax DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    shipping_address JSONB NOT NULL,
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT
);

CREATE INDEX idx_order_read_customer ON order_read_model (customer_id);
CREATE INDEX idx_order_read_status ON order_read_model (status);
CREATE INDEX idx_order_read_created ON order_read_model (created_at DESC);

-- Summary view for list queries
CREATE VIEW order_summary_view AS
SELECT
    order_id,
    customer_id,
    customer_name,
    status,
    status_label,
    item_count,
    total_amount,
    currency,
    created_at
FROM order_read_model;

-- Projection checkpoints
CREATE TABLE projection_checkpoints (
    name VARCHAR(255) PRIMARY KEY,
    position BIGINT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Best Practices and Considerations

### Design Guidelines

1. **Start Simple**: Begin with synchronous projections and add complexity as needed
2. **One Command, One Aggregate**: Each command should modify only one aggregate
3. **Idempotent Handlers**: Design handlers to safely handle duplicate events
4. **Task-Based Commands**: Model commands after user intentions, not CRUD operations
5. **Rich Read Models**: Denormalize aggressively for query performance
6. **Version Events**: Plan for schema evolution from the start

### Common Pitfalls

```typescript
// WRONG: Command that spans multiple aggregates
class TransferMoneyCommand {
  constructor(
    public readonly fromAccountId: string,
    public readonly toAccountId: string,
    public readonly amount: Money
  ) {}
}

// CORRECT: Use saga/process manager for cross-aggregate operations
class DebitAccountCommand {
  constructor(
    public readonly accountId: string,
    public readonly amount: Money,
    public readonly transactionId: string
  ) {}
}

class CreditAccountCommand {
  constructor(
    public readonly accountId: string,
    public readonly amount: Money,
    public readonly transactionId: string
  ) {}
}

class MoneyTransferSaga {
  async handle(initiateTransfer: InitiateTransferCommand): Promise<void> {
    const transactionId = crypto.randomUUID();

    // Step 1: Debit source account
    const debitResult = await this.commandBus.dispatch(
      new DebitAccountCommand(
        initiateTransfer.fromAccountId,
        initiateTransfer.amount,
        transactionId
      )
    );

    if (!debitResult.success) {
      // Transaction ends here
      return;
    }

    // Step 2: Credit destination account
    const creditResult = await this.commandBus.dispatch(
      new CreditAccountCommand(
        initiateTransfer.toAccountId,
        initiateTransfer.amount,
        transactionId
      )
    );

    if (!creditResult.success) {
      // Compensate by reversing the debit
      await this.commandBus.dispatch(
        new RefundAccountCommand(
          initiateTransfer.fromAccountId,
          initiateTransfer.amount,
          transactionId
        )
      );
    }
  }
}
```

### Handling Eventual Consistency

```typescript
// Client-side: Handle stale reads gracefully
class OrderService {
  async createAndGetOrder(dto: CreateOrderDTO): Promise<OrderReadModel> {
    // Create the order
    const result = await this.commandBus.dispatch(
      new CreateOrderCommand(dto.customerId, dto.items, dto.shippingAddress)
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    // Poll for read model with exponential backoff
    const order = await this.waitForReadModel(
      result.aggregateId!,
      result.version!
    );

    return order;
  }

  private async waitForReadModel(
    orderId: string,
    expectedVersion: number,
    maxAttempts: number = 10
  ): Promise<OrderReadModel> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const order = await this.queryBus.execute(
        new GetOrderByIdQuery(orderId)
      );

      if (order && order.version >= expectedVersion) {
        return order;
      }

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.min(100 * Math.pow(2, attempt), 5000))
      );
    }

    throw new Error('Read model not available after command execution');
  }
}

// Alternative: Return write model data immediately
class CreateOrderHandler {
  async handle(command: CreateOrderCommand): Promise<CommandResult> {
    // ... create order logic ...

    return {
      success: true,
      aggregateId: order.id.value,
      version: order.version,
      // Include essential data for immediate display
      data: {
        orderId: order.id.value,
        status: 'PENDING',
        totalAmount: order.totalAmount.amount,
        createdAt: new Date().toISOString()
      }
    };
  }
}
```

### Testing CQRS Applications

```typescript
describe('CreateOrderHandler', () => {
  let handler: CreateOrderHandler;
  let orderRepository: MockOrderRepository;
  let customerRepository: MockCustomerRepository;
  let eventBus: MockEventBus;

  beforeEach(() => {
    orderRepository = new MockOrderRepository();
    customerRepository = new MockCustomerRepository();
    eventBus = new MockEventBus();

    handler = new CreateOrderHandler(
      orderRepository,
      customerRepository,
      new MockProductService(),
      eventBus
    );
  });

  it('should create order successfully', async () => {
    // Arrange
    customerRepository.addCustomer({
      id: 'customer-1',
      name: 'John Doe',
      email: 'john@example.com'
    });

    const command = new CreateOrderCommand(
      'customer-1',
      [{ productId: 'product-1', quantity: 2 }],
      { street: '123 Main St', city: 'NYC', postalCode: '10001' }
    );

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(result.success).toBe(true);
    expect(result.aggregateId).toBeDefined();

    const savedOrder = await orderRepository.findById(result.aggregateId!);
    expect(savedOrder).toBeDefined();
    expect(savedOrder!.status).toBe(OrderStatus.Pending);

    expect(eventBus.publishedEvents).toHaveLength(1);
    expect(eventBus.publishedEvents[0]).toBeInstanceOf(OrderCreatedEvent);
  });

  it('should fail when customer not found', async () => {
    const command = new CreateOrderCommand(
      'non-existent-customer',
      [{ productId: 'product-1', quantity: 1 }],
      { street: '123 Main St', city: 'NYC', postalCode: '10001' }
    );

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Customer not found');
  });
});

describe('OrderProjection', () => {
  let projection: OrderProjection;
  let readDb: MockReadDatabase;

  beforeEach(() => {
    readDb = new MockReadDatabase();
    projection = new OrderProjection(
      readDb,
      new MockCustomerService(),
      new MockProductService()
    );
  });

  it('should project OrderCreated event', async () => {
    const event = new OrderCreatedEvent({
      aggregateId: 'order-1',
      version: 1,
      customerId: 'customer-1',
      items: [{ productId: 'p1', quantity: 2, unitPrice: 10 }],
      shippingAddress: { street: '123 Main St' },
      timestamp: new Date()
    });

    await projection.handle(event);

    const readModel = await readDb.findById('order-1');
    expect(readModel).toBeDefined();
    expect(readModel.status).toBe('PENDING');
    expect(readModel.customerId).toBe('customer-1');
  });
});
```

---

## Summary

CQRS is a powerful architectural pattern that enables building scalable, maintainable systems by separating read and write concerns. Key takeaways:

1. **Separation of Concerns**: Commands and queries have different requirements; separating them allows independent optimization

2. **Commands are Intentions**: Model commands after user actions, not database operations

3. **Read Models are Projections**: Build query-optimized views from domain events

4. **Event Sourcing Synergy**: CQRS and Event Sourcing complement each other naturally

5. **Eventual Consistency**: Accept and design for eventual consistency between write and read models

6. **Not Always Necessary**: Use CQRS when complexity justifies it; simple CRUD apps do not need it

The pattern requires more infrastructure and introduces eventual consistency challenges, but provides significant benefits for complex domains with differing read/write requirements. Start simple, measure bottlenecks, and evolve toward full CQRS as your system demands grow.
