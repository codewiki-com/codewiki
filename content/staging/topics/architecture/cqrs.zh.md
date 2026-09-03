---
title: CQRS 命令查询职责分离
description: 掌握CQRS架构模式，优化读写分离场景
track: architecture
section: design-patterns
difficulty: advanced
tags:
  - CQRS
  - 架构模式
  - 读写分离
  - Event Sourcing
status: imported
origin: old/src/content/docs/architecture/cqrs.zh.md
divergence: 0.228
issues: []
legacy:
  category: Architecture
  subcategory: Patterns
  order: 14
  lastUpdated: 2026-01-07
---

## 概念解释

CQRS (Command Query Responsibility Segregation，命令查询职责分离) 是一种架构模式，其核心思想是将系统的读操作（查询）和写操作（命令）分离到不同的模型中。这种分离使得每个模型可以独立优化，以满足各自场景的特定需求。

### 什么是 CQRS？

在传统的 CRUD 架构中，我们使用同一个数据模型来处理所有操作：

```
┌─────────────────────────────────────────┐
│              传统 CRUD 架构               │
├─────────────────────────────────────────┤
│                                         │
│    ┌─────────┐     ┌─────────────┐      │
│    │  用户界面 │────▶│  统一模型    │      │
│    └─────────┘     └──────┬──────┘      │
│                          │              │
│                    ┌─────▼─────┐        │
│                    │  数据库    │        │
│                    └───────────┘        │
│                                         │
│   Create / Read / Update / Delete       │
│   都通过同一个模型处理                    │
└─────────────────────────────────────────┘
```

而 CQRS 架构则将读写操作完全分离：

```
┌─────────────────────────────────────────────────────────────┐
│                      CQRS 架构                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌─────────┐                      ┌─────────┐             │
│    │ 命令请求 │                      │ 查询请求 │             │
│    └────┬────┘                      └────┬────┘             │
│         │                                │                  │
│         ▼                                ▼                  │
│  ┌──────────────┐                ┌──────────────┐           │
│  │  Command     │                │   Query      │           │
│  │  Handler     │                │   Handler    │           │
│  └──────┬───────┘                └──────┬───────┘           │
│         │                                │                  │
│         ▼                                ▼                  │
│  ┌──────────────┐                ┌──────────────┐           │
│  │  写模型       │                │  读模型       │           │
│  │ (Domain      │                │ (Optimized   │           │
│  │  Model)      │                │  Views)      │           │
│  └──────┬───────┘                └──────┬───────┘           │
│         │                                │                  │
│         ▼                                ▼                  │
│  ┌──────────────┐   同步/异步    ┌──────────────┐           │
│  │  写数据库     │ ───────────▶  │  读数据库     │           │
│  └──────────────┘                └──────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 核心概念

**1. 命令（Command）**

命令代表改变系统状态的意图。命令是动词形式，表达"做什么"：

```typescript
// 命令的特征：
// 1. 改变系统状态
// 2. 不返回数据（或仅返回标识符）
// 3. 可能失败

interface CreateOrderCommand {
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: Address;
}

interface ConfirmOrderCommand {
  orderId: string;
  confirmedBy: string;
}

interface CancelOrderCommand {
  orderId: string;
  reason: string;
}
```

**2. 查询（Query）**

查询用于读取数据，不会改变系统状态：

```typescript
// 查询的特征：
// 1. 不改变系统状态
// 2. 返回数据
// 3. 幂等（多次执行结果相同）

interface GetOrderByIdQuery {
  orderId: string;
}

interface GetOrdersByCustomerQuery {
  customerId: string;
  status?: OrderStatus;
  page: number;
  pageSize: number;
}

interface GetOrderStatisticsQuery {
  startDate: Date;
  endDate: Date;
}
```

**3. 读模型与写模型**

写模型关注业务逻辑的正确性，读模型关注查询效率：

```typescript
// 写模型：领域模型，包含业务逻辑
class Order {
  private id: OrderId;
  private status: OrderStatus;
  private items: OrderItem[];

  // 业务行为和规则验证
  confirm(): void {
    if (this.status !== OrderStatus.Pending) {
      throw new InvalidOrderStateError();
    }
    this.status = OrderStatus.Confirmed;
  }
}

// 读模型：针对查询优化的扁平化数据结构
interface OrderReadModel {
  orderId: string;
  customerName: string;      // 非规范化，包含客户名称
  customerEmail: string;     // 非规范化，包含客户邮箱
  status: string;
  itemCount: number;         // 预计算的统计值
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 命令处理

命令处理是 CQRS 中负责修改系统状态的核心组件。它接收命令，验证业务规则，并执行相应的领域操作。

### 命令处理器设计

```typescript
// 命令接口
interface Command {
  readonly commandId: string;
  readonly timestamp: Date;
}

// 命令处理器接口
interface CommandHandler<TCommand extends Command> {
  handle(command: TCommand): Promise<void>;
}

// 命令总线接口
interface CommandBus {
  dispatch<TCommand extends Command>(command: TCommand): Promise<void>;
  register<TCommand extends Command>(
    commandType: string,
    handler: CommandHandler<TCommand>
  ): void;
}
```

### 命令总线实现

```typescript
// 命令总线实现
class InMemoryCommandBus implements CommandBus {
  private handlers: Map<string, CommandHandler<any>> = new Map();

  register<TCommand extends Command>(
    commandType: string,
    handler: CommandHandler<TCommand>
  ): void {
    if (this.handlers.has(commandType)) {
      throw new Error(`Handler for ${commandType} is already registered`);
    }
    this.handlers.set(commandType, handler);
  }

  async dispatch<TCommand extends Command>(command: TCommand): Promise<void> {
    const commandType = command.constructor.name;
    const handler = this.handlers.get(commandType);

    if (!handler) {
      throw new Error(`No handler registered for ${commandType}`);
    }

    await handler.handle(command);
  }
}

// 带中间件支持的命令总线
class CommandBusWithMiddleware implements CommandBus {
  private handlers: Map<string, CommandHandler<any>> = new Map();
  private middlewares: CommandMiddleware[] = [];

  use(middleware: CommandMiddleware): void {
    this.middlewares.push(middleware);
  }

  register<TCommand extends Command>(
    commandType: string,
    handler: CommandHandler<TCommand>
  ): void {
    this.handlers.set(commandType, handler);
  }

  async dispatch<TCommand extends Command>(command: TCommand): Promise<void> {
    const commandType = command.constructor.name;
    const handler = this.handlers.get(commandType);

    if (!handler) {
      throw new Error(`No handler registered for ${commandType}`);
    }

    // 构建中间件链
    const chain = this.middlewares.reduceRight(
      (next, middleware) => () => middleware.execute(command, next),
      () => handler.handle(command)
    );

    await chain();
  }
}

// 命令中间件接口
interface CommandMiddleware {
  execute<TCommand extends Command>(
    command: TCommand,
    next: () => Promise<void>
  ): Promise<void>;
}

// 日志中间件
class LoggingMiddleware implements CommandMiddleware {
  async execute<TCommand extends Command>(
    command: TCommand,
    next: () => Promise<void>
  ): Promise<void> {
    const commandType = command.constructor.name;
    console.log(`[Command] Executing: ${commandType}`, {
      commandId: command.commandId,
      timestamp: command.timestamp
    });

    const startTime = Date.now();
    try {
      await next();
      console.log(`[Command] Completed: ${commandType} in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error(`[Command] Failed: ${commandType}`, error);
      throw error;
    }
  }
}

// 验证中间件
class ValidationMiddleware implements CommandMiddleware {
  constructor(private validator: CommandValidator) {}

  async execute<TCommand extends Command>(
    command: TCommand,
    next: () => Promise<void>
  ): Promise<void> {
    const errors = await this.validator.validate(command);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
    await next();
  }
}

// 事务中间件
class TransactionMiddleware implements CommandMiddleware {
  constructor(private unitOfWork: UnitOfWork) {}

  async execute<TCommand extends Command>(
    command: TCommand,
    next: () => Promise<void>
  ): Promise<void> {
    await this.unitOfWork.begin();
    try {
      await next();
      await this.unitOfWork.commit();
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }
}
```

### 具体命令处理器实现

```typescript
// 创建订单命令
class CreateOrderCommand implements Command {
  readonly commandId: string;
  readonly timestamp: Date;

  constructor(
    readonly customerId: string,
    readonly items: Array<{ productId: string; quantity: number }>,
    readonly shippingAddress: Address
  ) {
    this.commandId = uuid();
    this.timestamp = new Date();
  }
}

// 创建订单命令处理器
class CreateOrderCommandHandler implements CommandHandler<CreateOrderCommand> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  async handle(command: CreateOrderCommand): Promise<void> {
    // 1. 验证客户存在
    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(command.customerId);
    }

    // 2. 验证并获取商品信息
    const orderItems: OrderItem[] = [];
    for (const item of command.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new ProductNotFoundError(item.productId);
      }
      if (!product.isAvailable()) {
        throw new ProductNotAvailableError(item.productId);
      }
      if (product.getStock() < item.quantity) {
        throw new InsufficientStockError(item.productId, item.quantity);
      }

      orderItems.push(
        OrderItem.create(
          product.getId(),
          product.getName(),
          product.getPrice(),
          item.quantity
        )
      );
    }

    // 3. 创建订单聚合
    const orderId = this.orderRepository.nextId();
    const order = Order.create(
      orderId,
      new CustomerId(command.customerId),
      orderItems,
      command.shippingAddress
    );

    // 4. 保存订单
    await this.orderRepository.save(order);

    // 5. 发布领域事件
    const events = order.pullDomainEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }
  }
}

// 确认订单命令
class ConfirmOrderCommand implements Command {
  readonly commandId: string;
  readonly timestamp: Date;

  constructor(
    readonly orderId: string,
    readonly confirmedBy: string
  ) {
    this.commandId = uuid();
    this.timestamp = new Date();
  }
}

// 确认订单命令处理器
class ConfirmOrderCommandHandler implements CommandHandler<ConfirmOrderCommand> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryService: InventoryService,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  async handle(command: ConfirmOrderCommand): Promise<void> {
    // 1. 加载订单聚合
    const order = await this.orderRepository.findById(new OrderId(command.orderId));
    if (!order) {
      throw new OrderNotFoundError(command.orderId);
    }

    // 2. 预留库存
    for (const item of order.getItems()) {
      await this.inventoryService.reserve(
        item.getProductId(),
        item.getQuantity(),
        order.getId()
      );
    }

    // 3. 执行业务操作
    order.confirm(command.confirmedBy);

    // 4. 保存订单
    await this.orderRepository.save(order);

    // 5. 发布领域事件
    const events = order.pullDomainEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }
  }
}

// 取消订单命令处理器
class CancelOrderCommandHandler implements CommandHandler<CancelOrderCommand> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryService: InventoryService,
    private readonly paymentService: PaymentService,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  async handle(command: CancelOrderCommand): Promise<void> {
    const order = await this.orderRepository.findById(new OrderId(command.orderId));
    if (!order) {
      throw new OrderNotFoundError(command.orderId);
    }

    // 执行取消操作
    order.cancel(new CancellationReason(command.reason));

    // 释放库存
    if (order.hasReservedInventory()) {
      for (const item of order.getItems()) {
        await this.inventoryService.release(
          item.getProductId(),
          item.getQuantity(),
          order.getId()
        );
      }
    }

    // 退款（如果已支付）
    if (order.isPaid()) {
      await this.paymentService.refund(order.getId(), order.getTotalAmount());
    }

    await this.orderRepository.save(order);

    const events = order.pullDomainEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }
  }
}
```

---

## 查询处理

查询处理负责高效地读取数据，通常直接操作读模型数据库，绕过领域模型以获得最佳性能。

### 查询处理器设计

```typescript
// 查询接口
interface Query<TResult> {
  readonly queryId: string;
}

// 查询处理器接口
interface QueryHandler<TQuery extends Query<TResult>, TResult> {
  handle(query: TQuery): Promise<TResult>;
}

// 查询总线接口
interface QueryBus {
  execute<TResult>(query: Query<TResult>): Promise<TResult>;
  register<TQuery extends Query<TResult>, TResult>(
    queryType: string,
    handler: QueryHandler<TQuery, TResult>
  ): void;
}

// 查询总线实现
class InMemoryQueryBus implements QueryBus {
  private handlers: Map<string, QueryHandler<any, any>> = new Map();

  register<TQuery extends Query<TResult>, TResult>(
    queryType: string,
    handler: QueryHandler<TQuery, TResult>
  ): void {
    this.handlers.set(queryType, handler);
  }

  async execute<TResult>(query: Query<TResult>): Promise<TResult> {
    const queryType = query.constructor.name;
    const handler = this.handlers.get(queryType);

    if (!handler) {
      throw new Error(`No handler registered for ${queryType}`);
    }

    return handler.handle(query);
  }
}
```

### 读模型设计

```typescript
// 订单列表读模型
interface OrderListReadModel {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: string;
  itemCount: number;
  totalAmount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

// 订单详情读模型
interface OrderDetailReadModel {
  orderId: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  status: string;
  items: Array<{
    productId: string;
    productName: string;
    productImage: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  shippingAddress: {
    province: string;
    city: string;
    district: string;
    street: string;
    zipCode: string;
  };
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  totalAmount: number;
  createdAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
}

// 订单统计读模型
interface OrderStatisticsReadModel {
  period: string;
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
}

// 分页结果
interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

### 具体查询处理器实现

```typescript
// 获取订单详情查询
class GetOrderByIdQuery implements Query<OrderDetailReadModel | null> {
  readonly queryId: string = uuid();

  constructor(readonly orderId: string) {}
}

// 获取订单详情查询处理器
class GetOrderByIdQueryHandler
  implements QueryHandler<GetOrderByIdQuery, OrderDetailReadModel | null>
{
  constructor(private readonly readDb: ReadDatabase) {}

  async handle(query: GetOrderByIdQuery): Promise<OrderDetailReadModel | null> {
    const result = await this.readDb.query<OrderDetailReadModel>(
      `SELECT
        o.id as "orderId",
        o.order_number as "orderNumber",
        o.status,
        o.subtotal,
        o.discount,
        o.shipping_fee as "shippingFee",
        o.tax,
        o.total_amount as "totalAmount",
        o.created_at as "createdAt",
        o.confirmed_at as "confirmedAt",
        o.shipped_at as "shippedAt",
        o.delivered_at as "deliveredAt",
        o.cancelled_at as "cancelledAt",
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email,
          'phone', c.phone
        ) as customer,
        json_build_object(
          'province', o.shipping_province,
          'city', o.shipping_city,
          'district', o.shipping_district,
          'street', o.shipping_street,
          'zipCode', o.shipping_zip_code
        ) as "shippingAddress",
        (
          SELECT json_agg(
            json_build_object(
              'productId', oi.product_id,
              'productName', oi.product_name,
              'productImage', oi.product_image,
              'quantity', oi.quantity,
              'unitPrice', oi.unit_price,
              'totalPrice', oi.total_price
            )
          )
          FROM order_items_read oi
          WHERE oi.order_id = o.id
        ) as items
      FROM orders_read o
      JOIN customers_read c ON o.customer_id = c.id
      WHERE o.id = $1`,
      [query.orderId]
    );

    return result.rows[0] || null;
  }
}

// 获取客户订单列表查询
class GetOrdersByCustomerQuery
  implements Query<PaginatedResult<OrderListReadModel>>
{
  readonly queryId: string = uuid();

  constructor(
    readonly customerId: string,
    readonly status?: string,
    readonly page: number = 1,
    readonly pageSize: number = 20,
    readonly sortBy: string = 'createdAt',
    readonly sortOrder: 'asc' | 'desc' = 'desc'
  ) {}
}

// 获取客户订单列表查询处理器
class GetOrdersByCustomerQueryHandler
  implements
    QueryHandler<GetOrdersByCustomerQuery, PaginatedResult<OrderListReadModel>>
{
  constructor(private readonly readDb: ReadDatabase) {}

  async handle(
    query: GetOrdersByCustomerQuery
  ): Promise<PaginatedResult<OrderListReadModel>> {
    const offset = (query.page - 1) * query.pageSize;

    // 构建动态查询条件
    const conditions: string[] = ['customer_id = $1'];
    const params: any[] = [query.customerId];
    let paramIndex = 2;

    if (query.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(query.status);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const orderClause = `${this.mapSortField(query.sortBy)} ${query.sortOrder.toUpperCase()}`;

    // 并行执行数据查询和计数查询
    const [dataResult, countResult] = await Promise.all([
      this.readDb.query<OrderListReadModel>(
        `SELECT
          id as "orderId",
          order_number as "orderNumber",
          customer_id as "customerId",
          customer_name as "customerName",
          status,
          item_count as "itemCount",
          total_amount as "totalAmount",
          currency,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM orders_read
        WHERE ${whereClause}
        ORDER BY ${orderClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, query.pageSize, offset]
      ),
      this.readDb.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM orders_read WHERE ${whereClause}`,
        params
      ),
    ]);

    const total = countResult.rows[0].count;
    const totalPages = Math.ceil(total / query.pageSize);

    return {
      items: dataResult.rows,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages,
      hasNext: query.page < totalPages,
      hasPrevious: query.page > 1,
    };
  }

  private mapSortField(field: string): string {
    const fieldMap: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      totalAmount: 'total_amount',
      status: 'status',
    };
    return fieldMap[field] || 'created_at';
  }
}

// 订单统计查询
class GetOrderStatisticsQuery implements Query<OrderStatisticsReadModel> {
  readonly queryId: string = uuid();

  constructor(
    readonly startDate: Date,
    readonly endDate: Date,
    readonly customerId?: string
  ) {}
}

// 订单统计查询处理器
class GetOrderStatisticsQueryHandler
  implements QueryHandler<GetOrderStatisticsQuery, OrderStatisticsReadModel>
{
  constructor(private readonly readDb: ReadDatabase) {}

  async handle(query: GetOrderStatisticsQuery): Promise<OrderStatisticsReadModel> {
    const customerCondition = query.customerId
      ? 'AND customer_id = $3'
      : '';
    const params = query.customerId
      ? [query.startDate, query.endDate, query.customerId]
      : [query.startDate, query.endDate];

    // 基础统计
    const statsResult = await this.readDb.query<{
      totalOrders: number;
      totalRevenue: number;
      averageOrderValue: number;
    }>(
      `SELECT
        COUNT(*) as "totalOrders",
        COALESCE(SUM(total_amount), 0) as "totalRevenue",
        COALESCE(AVG(total_amount), 0) as "averageOrderValue"
      FROM orders_read
      WHERE created_at BETWEEN $1 AND $2 ${customerCondition}`,
      params
    );

    // 按状态分组统计
    const statusResult = await this.readDb.query<{
      status: string;
      count: number;
    }>(
      `SELECT status, COUNT(*) as count
      FROM orders_read
      WHERE created_at BETWEEN $1 AND $2 ${customerCondition}
      GROUP BY status`,
      params
    );

    // 热销商品统计
    const topProductsResult = await this.readDb.query<{
      productId: string;
      productName: string;
      quantity: number;
      revenue: number;
    }>(
      `SELECT
        oi.product_id as "productId",
        oi.product_name as "productName",
        SUM(oi.quantity) as quantity,
        SUM(oi.total_price) as revenue
      FROM order_items_read oi
      JOIN orders_read o ON oi.order_id = o.id
      WHERE o.created_at BETWEEN $1 AND $2 ${customerCondition}
      GROUP BY oi.product_id, oi.product_name
      ORDER BY revenue DESC
      LIMIT 10`,
      params
    );

    const stats = statsResult.rows[0];
    const ordersByStatus: Record<string, number> = {};
    for (const row of statusResult.rows) {
      ordersByStatus[row.status] = row.count;
    }

    return {
      period: `${query.startDate.toISOString()} - ${query.endDate.toISOString()}`,
      totalOrders: stats.totalOrders,
      totalRevenue: stats.totalRevenue,
      averageOrderValue: stats.averageOrderValue,
      ordersByStatus,
      topProducts: topProductsResult.rows,
    };
  }
}
```

### 缓存优化

```typescript
// 带缓存的查询处理器装饰器
class CachedQueryHandler<TQuery extends Query<TResult>, TResult>
  implements QueryHandler<TQuery, TResult>
{
  constructor(
    private readonly innerHandler: QueryHandler<TQuery, TResult>,
    private readonly cache: Cache,
    private readonly options: CacheOptions
  ) {}

  async handle(query: TQuery): Promise<TResult> {
    const cacheKey = this.buildCacheKey(query);

    // 尝试从缓存获取
    const cached = await this.cache.get<TResult>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // 执行实际查询
    const result = await this.innerHandler.handle(query);

    // 存入缓存
    await this.cache.set(cacheKey, result, this.options.ttl);

    return result;
  }

  private buildCacheKey(query: TQuery): string {
    const queryType = query.constructor.name;
    const queryHash = this.hashObject(query);
    return `${this.options.prefix}:${queryType}:${queryHash}`;
  }

  private hashObject(obj: any): string {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(obj))
      .digest('hex');
  }
}

interface CacheOptions {
  prefix: string;
  ttl: number; // 秒
}

// 使用示例
const cachedHandler = new CachedQueryHandler(
  new GetOrderByIdQueryHandler(readDb),
  redisCache,
  { prefix: 'order', ttl: 300 }
);
```

---

## 读写模型同步

在 CQRS 架构中，读模型和写模型的同步是关键问题。常见的同步策略有同步更新和异步更新。

### 同步更新策略

在同一事务中同时更新写模型和读模型：

```typescript
// 同步更新实现
class SynchronousProjection {
  constructor(
    private readonly writeDb: Database,
    private readonly readDb: Database
  ) {}

  async updateOrderReadModel(order: Order): Promise<void> {
    await this.writeDb.transaction(async (tx) => {
      // 更新读模型
      await tx.query(
        `INSERT INTO orders_read (
          id, order_number, customer_id, customer_name, status,
          item_count, total_amount, currency, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          status = $5,
          item_count = $6,
          total_amount = $7,
          updated_at = $10`,
        [
          order.getId().getValue(),
          order.getOrderNumber(),
          order.getCustomerId().getValue(),
          order.getCustomerName(),
          order.getStatus(),
          order.getItemCount(),
          order.getTotalAmount().getAmount(),
          order.getCurrency(),
          order.getCreatedAt(),
          new Date()
        ]
      );

      // 更新订单项读模型
      await tx.query(
        'DELETE FROM order_items_read WHERE order_id = $1',
        [order.getId().getValue()]
      );

      for (const item of order.getItems()) {
        await tx.query(
          `INSERT INTO order_items_read (
            id, order_id, product_id, product_name, product_image,
            quantity, unit_price, total_price
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            item.getId().getValue(),
            order.getId().getValue(),
            item.getProductId().getValue(),
            item.getProductName(),
            item.getProductImage(),
            item.getQuantity(),
            item.getUnitPrice().getAmount(),
            item.getTotalPrice().getAmount()
          ]
        );
      }
    });
  }
}
```

### 异步更新策略（推荐）

通过领域事件异步更新读模型，实现最终一致性：

```typescript
// 投影处理器
abstract class Projection {
  abstract readonly projectionName: string;
  abstract getSubscribedEvents(): string[];
  abstract handle(event: DomainEvent): Promise<void>;

  // 检查点管理
  abstract getCheckpoint(): Promise<number>;
  abstract saveCheckpoint(position: number): Promise<void>;
}

// 订单读模型投影
class OrderReadModelProjection extends Projection {
  readonly projectionName = 'OrderReadModel';

  constructor(private readonly readDb: Database) {
    super();
  }

  getSubscribedEvents(): string[] {
    return [
      'OrderCreatedEvent',
      'OrderConfirmedEvent',
      'OrderShippedEvent',
      'OrderDeliveredEvent',
      'OrderCancelledEvent',
      'OrderItemAddedEvent',
      'OrderItemRemovedEvent'
    ];
  }

  async handle(event: DomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'OrderCreatedEvent':
        await this.handleOrderCreated(event as OrderCreatedEvent);
        break;
      case 'OrderConfirmedEvent':
        await this.handleOrderConfirmed(event as OrderConfirmedEvent);
        break;
      case 'OrderShippedEvent':
        await this.handleOrderShipped(event as OrderShippedEvent);
        break;
      case 'OrderDeliveredEvent':
        await this.handleOrderDelivered(event as OrderDeliveredEvent);
        break;
      case 'OrderCancelledEvent':
        await this.handleOrderCancelled(event as OrderCancelledEvent);
        break;
    }
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // 获取客户信息（可能需要查询其他服务）
    const customer = await this.getCustomerInfo(event.customerId);

    await this.readDb.query(
      `INSERT INTO orders_read (
        id, order_number, customer_id, customer_name, status,
        item_count, total_amount, currency,
        shipping_province, shipping_city, shipping_district,
        shipping_street, shipping_zip_code,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        event.orderId,
        event.orderNumber,
        event.customerId,
        customer.name,
        'pending',
        event.items.length,
        event.totalAmount,
        event.currency,
        event.shippingAddress.province,
        event.shippingAddress.city,
        event.shippingAddress.district,
        event.shippingAddress.street,
        event.shippingAddress.zipCode,
        event.timestamp,
        event.timestamp
      ]
    );

    // 插入订单项
    for (const item of event.items) {
      await this.readDb.query(
        `INSERT INTO order_items_read (
          id, order_id, product_id, product_name, product_image,
          quantity, unit_price, total_price
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          item.itemId,
          event.orderId,
          item.productId,
          item.productName,
          item.productImage,
          item.quantity,
          item.unitPrice,
          item.totalPrice
        ]
      );
    }
  }

  private async handleOrderConfirmed(event: OrderConfirmedEvent): Promise<void> {
    await this.readDb.query(
      `UPDATE orders_read
       SET status = 'confirmed', confirmed_at = $2, updated_at = $2
       WHERE id = $1`,
      [event.orderId, event.timestamp]
    );
  }

  private async handleOrderShipped(event: OrderShippedEvent): Promise<void> {
    await this.readDb.query(
      `UPDATE orders_read
       SET status = 'shipped',
           shipped_at = $2,
           tracking_number = $3,
           carrier = $4,
           updated_at = $2
       WHERE id = $1`,
      [event.orderId, event.timestamp, event.trackingNumber, event.carrier]
    );
  }

  private async handleOrderDelivered(event: OrderDeliveredEvent): Promise<void> {
    await this.readDb.query(
      `UPDATE orders_read
       SET status = 'delivered', delivered_at = $2, updated_at = $2
       WHERE id = $1`,
      [event.orderId, event.timestamp]
    );
  }

  private async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    await this.readDb.query(
      `UPDATE orders_read
       SET status = 'cancelled',
           cancelled_at = $2,
           cancellation_reason = $3,
           updated_at = $2
       WHERE id = $1`,
      [event.orderId, event.timestamp, event.reason]
    );
  }

  async getCheckpoint(): Promise<number> {
    const result = await this.readDb.query(
      'SELECT position FROM projection_checkpoints WHERE name = $1',
      [this.projectionName]
    );
    return result.rows[0]?.position ?? 0;
  }

  async saveCheckpoint(position: number): Promise<void> {
    await this.readDb.query(
      `INSERT INTO projection_checkpoints (name, position, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (name) DO UPDATE SET position = $2, updated_at = NOW()`,
      [this.projectionName, position]
    );
  }

  private async getCustomerInfo(customerId: string): Promise<CustomerInfo> {
    // 从缓存或其他服务获取客户信息
    const result = await this.readDb.query(
      'SELECT name, email FROM customers_read WHERE id = $1',
      [customerId]
    );
    return result.rows[0];
  }
}

// 投影运行器
class ProjectionRunner {
  private running = false;
  private projections: Projection[] = [];

  constructor(private readonly eventStore: EventStore) {}

  register(projection: Projection): void {
    this.projections.push(projection);
  }

  async start(): Promise<void> {
    this.running = true;
    console.log('Projection runner started');

    while (this.running) {
      for (const projection of this.projections) {
        try {
          await this.processProjection(projection);
        } catch (error) {
          console.error(
            `Error processing projection ${projection.projectionName}:`,
            error
          );
        }
      }
      await this.sleep(100); // 轮询间隔
    }
  }

  stop(): void {
    this.running = false;
    console.log('Projection runner stopped');
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
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### 投影重建

当读模型结构变化或数据损坏时，需要重建投影：

```typescript
// 投影重建服务
class ProjectionRebuilder {
  constructor(
    private readonly eventStore: EventStore,
    private readonly readDb: Database
  ) {}

  async rebuild(projection: Projection): Promise<RebuildResult> {
    const startTime = Date.now();
    let processedEvents = 0;

    console.log(`Starting rebuild of projection: ${projection.projectionName}`);

    try {
      // 1. 清空读模型数据
      await this.clearProjectionData(projection);

      // 2. 重置检查点
      await projection.saveCheckpoint(0);

      // 3. 重新处理所有事件
      let position = 0;
      const subscribedEvents = projection.getSubscribedEvents();

      while (true) {
        const events = await this.eventStore.readAllEvents(position, 1000);
        if (events.length === 0) break;

        for (const event of events) {
          if (subscribedEvents.includes(event.eventType)) {
            await projection.handle(event);
            processedEvents++;
          }
          position = event.globalSequence;
        }

        await projection.saveCheckpoint(position);
        console.log(`Processed ${processedEvents} events, position: ${position}`);
      }

      const duration = Date.now() - startTime;
      console.log(
        `Rebuild complete. Processed ${processedEvents} events in ${duration}ms`
      );

      return {
        projectionName: projection.projectionName,
        processedEvents,
        duration,
        success: true
      };
    } catch (error) {
      console.error(`Rebuild failed for ${projection.projectionName}:`, error);
      return {
        projectionName: projection.projectionName,
        processedEvents,
        duration: Date.now() - startTime,
        success: false,
        error: error.message
      };
    }
  }

  private async clearProjectionData(projection: Projection): Promise<void> {
    // 根据投影类型清空相应的表
    if (projection.projectionName === 'OrderReadModel') {
      await this.readDb.query('TRUNCATE TABLE orders_read CASCADE');
      await this.readDb.query('TRUNCATE TABLE order_items_read CASCADE');
    }
  }
}

interface RebuildResult {
  projectionName: string;
  processedEvents: number;
  duration: number;
  success: boolean;
  error?: string;
}
```

---

## 与 Event Sourcing 结合

CQRS 与 Event Sourcing 是天然的搭档。Event Sourcing 提供了完美的写模型，而 CQRS 的投影机制则可以从事件流中构建任意的读模型。

### 完整架构

```
┌────────────────────────────────────────────────────────────────────────┐
│                     CQRS + Event Sourcing 架构                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│     ┌─────────┐                              ┌─────────┐               │
│     │ 命令API  │                              │ 查询API  │               │
│     └────┬────┘                              └────┬────┘               │
│          │                                        │                    │
│          ▼                                        ▼                    │
│   ┌──────────────┐                        ┌──────────────┐             │
│   │ Command      │                        │  Query       │             │
│   │ Handler      │                        │  Handler     │             │
│   └──────┬───────┘                        └──────┬───────┘             │
│          │                                        │                    │
│          ▼                                        ▼                    │
│   ┌──────────────┐                        ┌──────────────┐             │
│   │   聚合根      │                        │   读模型      │             │
│   │ (从事件重建)  │                        │  (非规范化)   │             │
│   └──────┬───────┘                        └──────┬───────┘             │
│          │                                        ▲                    │
│          │ 产生事件                                │ 投影更新           │
│          ▼                                        │                    │
│   ┌──────────────┐     订阅事件            ┌──────┴───────┐             │
│   │ Event Store  │ ─────────────────────▶ │  Projection   │             │
│   │  (事件存储)   │                        │   Runner      │             │
│   └──────────────┘                        └──────────────┘             │
│          │                                                             │
│          ▼                                                             │
│   ┌──────────────┐                                                     │
│   │ 事件消息队列  │ ─────────────▶ 其他服务 / 外部系统                   │
│   └──────────────┘                                                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 事件溯源聚合

```typescript
// 事件溯源聚合基类
abstract class EventSourcedAggregate {
  protected id: string;
  protected version: number = 0;
  private uncommittedEvents: DomainEvent[] = [];

  // 从事件历史重建状态
  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.apply(event, false);
    }
  }

  // 获取未提交的事件
  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  // 清除未提交的事件
  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  // 应用事件
  protected applyChange(event: DomainEvent): void {
    this.apply(event, true);
  }

  private apply(event: DomainEvent, isNew: boolean): void {
    this.when(event);
    this.version = event.version;
    if (isNew) {
      this.uncommittedEvents.push(event);
    }
  }

  // 子类实现事件处理
  protected abstract when(event: DomainEvent): void;
}

// 订单聚合（事件溯源版本）
class Order extends EventSourcedAggregate {
  private status: OrderStatus;
  private customerId: string;
  private items: Map<string, OrderItemData> = new Map();
  private totalAmount: number = 0;
  private shippingAddress: Address;

  // 工厂方法：创建新订单
  static create(
    orderId: string,
    customerId: string,
    items: OrderItemData[],
    shippingAddress: Address
  ): Order {
    const order = new Order();

    const totalAmount = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    order.applyChange({
      eventId: uuid(),
      eventType: 'OrderCreatedEvent',
      aggregateId: orderId,
      aggregateType: 'Order',
      version: 1,
      timestamp: new Date(),
      payload: {
        orderId,
        customerId,
        items,
        shippingAddress,
        totalAmount
      },
      metadata: {
        correlationId: uuid(),
        causationId: '',
        schemaVersion: 1
      }
    });

    return order;
  }

  // 确认订单
  confirm(confirmedBy: string): void {
    if (this.status !== OrderStatus.Pending) {
      throw new InvalidOrderStateError(
        `Cannot confirm order in ${this.status} status`
      );
    }

    this.applyChange({
      eventId: uuid(),
      eventType: 'OrderConfirmedEvent',
      aggregateId: this.id,
      aggregateType: 'Order',
      version: this.version + 1,
      timestamp: new Date(),
      payload: {
        orderId: this.id,
        confirmedBy,
        confirmedAt: new Date()
      },
      metadata: {
        correlationId: uuid(),
        causationId: '',
        schemaVersion: 1
      }
    });
  }

  // 发货
  ship(trackingNumber: string, carrier: string): void {
    if (this.status !== OrderStatus.Confirmed) {
      throw new InvalidOrderStateError('Order must be confirmed before shipping');
    }

    this.applyChange({
      eventId: uuid(),
      eventType: 'OrderShippedEvent',
      aggregateId: this.id,
      aggregateType: 'Order',
      version: this.version + 1,
      timestamp: new Date(),
      payload: {
        orderId: this.id,
        trackingNumber,
        carrier,
        shippedAt: new Date()
      },
      metadata: {
        correlationId: uuid(),
        causationId: '',
        schemaVersion: 1
      }
    });
  }

  // 取消订单
  cancel(reason: string): void {
    if (!this.canBeCancelled()) {
      throw new InvalidOrderStateError('Order cannot be cancelled');
    }

    this.applyChange({
      eventId: uuid(),
      eventType: 'OrderCancelledEvent',
      aggregateId: this.id,
      aggregateType: 'Order',
      version: this.version + 1,
      timestamp: new Date(),
      payload: {
        orderId: this.id,
        reason,
        cancelledAt: new Date()
      },
      metadata: {
        correlationId: uuid(),
        causationId: '',
        schemaVersion: 1
      }
    });
  }

  private canBeCancelled(): boolean {
    return [OrderStatus.Pending, OrderStatus.Confirmed].includes(this.status);
  }

  // 事件处理
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'OrderCreatedEvent':
        this.whenOrderCreated(event);
        break;
      case 'OrderConfirmedEvent':
        this.whenOrderConfirmed(event);
        break;
      case 'OrderShippedEvent':
        this.whenOrderShipped(event);
        break;
      case 'OrderDeliveredEvent':
        this.whenOrderDelivered(event);
        break;
      case 'OrderCancelledEvent':
        this.whenOrderCancelled(event);
        break;
    }
  }

  private whenOrderCreated(event: DomainEvent): void {
    const payload = event.payload as OrderCreatedPayload;
    this.id = payload.orderId;
    this.customerId = payload.customerId;
    this.shippingAddress = payload.shippingAddress;
    this.totalAmount = payload.totalAmount;
    this.status = OrderStatus.Pending;

    for (const item of payload.items) {
      this.items.set(item.productId, item);
    }
  }

  private whenOrderConfirmed(event: DomainEvent): void {
    this.status = OrderStatus.Confirmed;
  }

  private whenOrderShipped(event: DomainEvent): void {
    this.status = OrderStatus.Shipped;
  }

  private whenOrderDelivered(event: DomainEvent): void {
    this.status = OrderStatus.Delivered;
  }

  private whenOrderCancelled(event: DomainEvent): void {
    this.status = OrderStatus.Cancelled;
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getVersion(): number {
    return this.version;
  }

  getStatus(): OrderStatus {
    return this.status;
  }

  getItems(): OrderItemData[] {
    return Array.from(this.items.values());
  }
}
```

### 事件存储仓储

```typescript
// 事件溯源仓储
class EventSourcedOrderRepository implements OrderRepository {
  constructor(
    private readonly eventStore: EventStore,
    private readonly snapshotStore: SnapshotStore
  ) {}

  async findById(orderId: OrderId): Promise<Order | null> {
    const aggregateId = orderId.getValue();

    // 尝试加载快照
    const snapshot = await this.snapshotStore.getSnapshot(aggregateId, 'Order');

    // 从快照版本开始加载事件
    const fromVersion = snapshot?.version ?? 0;
    const events = await this.eventStore.readStream(
      aggregateId,
      'Order',
      fromVersion
    );

    if (events.length === 0 && !snapshot) {
      return null;
    }

    // 重建聚合
    const order = new Order();

    if (snapshot) {
      order.restoreFromSnapshot(snapshot);
    }

    order.loadFromHistory(events);

    return order;
  }

  async save(order: Order): Promise<void> {
    const uncommittedEvents = order.getUncommittedEvents();

    if (uncommittedEvents.length === 0) {
      return;
    }

    // 保存事件
    await this.eventStore.appendToStream(
      order.getId(),
      'Order',
      uncommittedEvents,
      order.getVersion() - uncommittedEvents.length
    );

    // 清除未提交事件
    order.clearUncommittedEvents();

    // 定期保存快照
    if (order.getVersion() % 100 === 0) {
      await this.snapshotStore.saveSnapshot({
        aggregateId: order.getId(),
        aggregateType: 'Order',
        version: order.getVersion(),
        state: order.toSnapshot(),
        createdAt: new Date()
      });
    }
  }

  nextId(): OrderId {
    return new OrderId(uuid());
  }
}
```

### 多种读模型投影

```typescript
// 订单列表投影
class OrderListProjection extends Projection {
  readonly projectionName = 'OrderList';

  // ... 实现见前文
}

// 客户订单统计投影
class CustomerOrderStatsProjection extends Projection {
  readonly projectionName = 'CustomerOrderStats';

  constructor(private readonly readDb: Database) {
    super();
  }

  getSubscribedEvents(): string[] {
    return ['OrderCreatedEvent', 'OrderConfirmedEvent', 'OrderCancelledEvent'];
  }

  async handle(event: DomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'OrderCreatedEvent':
        await this.handleOrderCreated(event);
        break;
      case 'OrderConfirmedEvent':
        await this.handleOrderConfirmed(event);
        break;
      case 'OrderCancelledEvent':
        await this.handleOrderCancelled(event);
        break;
    }
  }

  private async handleOrderCreated(event: DomainEvent): Promise<void> {
    const payload = event.payload as OrderCreatedPayload;

    await this.readDb.query(
      `INSERT INTO customer_order_stats (
        customer_id, total_orders, pending_orders, total_spent, last_order_at
      )
      VALUES ($1, 1, 1, 0, $2)
      ON CONFLICT (customer_id) DO UPDATE SET
        total_orders = customer_order_stats.total_orders + 1,
        pending_orders = customer_order_stats.pending_orders + 1,
        last_order_at = $2`,
      [payload.customerId, event.timestamp]
    );
  }

  private async handleOrderConfirmed(event: DomainEvent): Promise<void> {
    const payload = event.payload as OrderConfirmedPayload;

    // 获取订单金额
    const orderResult = await this.readDb.query(
      'SELECT customer_id, total_amount FROM orders_read WHERE id = $1',
      [payload.orderId]
    );

    if (orderResult.rows.length > 0) {
      const { customer_id, total_amount } = orderResult.rows[0];

      await this.readDb.query(
        `UPDATE customer_order_stats
         SET pending_orders = pending_orders - 1,
             confirmed_orders = confirmed_orders + 1,
             total_spent = total_spent + $2
         WHERE customer_id = $1`,
        [customer_id, total_amount]
      );
    }
  }

  private async handleOrderCancelled(event: DomainEvent): Promise<void> {
    const payload = event.payload as OrderCancelledPayload;

    const orderResult = await this.readDb.query(
      'SELECT customer_id FROM orders_read WHERE id = $1',
      [payload.orderId]
    );

    if (orderResult.rows.length > 0) {
      await this.readDb.query(
        `UPDATE customer_order_stats
         SET pending_orders = GREATEST(pending_orders - 1, 0),
             cancelled_orders = cancelled_orders + 1
         WHERE customer_id = $1`,
        [orderResult.rows[0].customer_id]
      );
    }
  }

  // 检查点方法...
}

// 商品销售统计投影
class ProductSalesProjection extends Projection {
  readonly projectionName = 'ProductSales';

  constructor(private readonly readDb: Database) {
    super();
  }

  getSubscribedEvents(): string[] {
    return ['OrderConfirmedEvent'];
  }

  async handle(event: DomainEvent): Promise<void> {
    if (event.eventType === 'OrderConfirmedEvent') {
      await this.handleOrderConfirmed(event);
    }
  }

  private async handleOrderConfirmed(event: DomainEvent): Promise<void> {
    const payload = event.payload as OrderConfirmedPayload;

    // 获取订单项
    const itemsResult = await this.readDb.query(
      'SELECT product_id, product_name, quantity, total_price FROM order_items_read WHERE order_id = $1',
      [payload.orderId]
    );

    for (const item of itemsResult.rows) {
      await this.readDb.query(
        `INSERT INTO product_sales_stats (
          product_id, product_name, total_quantity, total_revenue, order_count
        )
        VALUES ($1, $2, $3, $4, 1)
        ON CONFLICT (product_id) DO UPDATE SET
          total_quantity = product_sales_stats.total_quantity + $3,
          total_revenue = product_sales_stats.total_revenue + $4,
          order_count = product_sales_stats.order_count + 1`,
        [item.product_id, item.product_name, item.quantity, item.total_price]
      );
    }
  }

  // 检查点方法...
}
```

---

## 适用场景与最佳实践

### 适用场景

**1. 读写负载不均衡的系统**

当查询频率远高于更新频率时，CQRS 允许独立扩展读取端：

```typescript
// 场景：电商商品目录
// 写操作：商家更新商品（低频）
// 读操作：用户浏览商品（高频）

// 可以部署多个只读副本
const readReplicas = [
  new QueryHandler(readDb1),
  new QueryHandler(readDb2),
  new QueryHandler(readDb3)
];

// 负载均衡分发读请求
const loadBalancer = new RoundRobinLoadBalancer(readReplicas);
```

**2. 复杂查询需求**

需要多种查询视图的场景：

```typescript
// 场景：订单系统需要多种视图
// 1. 订单列表（简单）
// 2. 订单详情（包含所有关联数据）
// 3. 销售报表（聚合统计）
// 4. 物流追踪（专门优化）

// 每种视图都有专门的读模型
const projections = [
  new OrderListProjection(readDb),
  new OrderDetailProjection(readDb),
  new SalesReportProjection(analyticsDb),
  new ShippingTrackingProjection(trackingDb)
];
```

**3. 需要审计追踪的系统**

结合 Event Sourcing 使用：

```typescript
// 金融系统：每笔交易都需要完整记录
class TransactionAggregate extends EventSourcedAggregate {
  // 所有状态变化都通过事件记录
  // 可以重放任意时间点的状态
  // 满足合规审计要求
}
```

**4. 协作型应用**

多用户同时编辑的场景：

```typescript
// 在线文档编辑
// 每个用户的操作都是命令
// 读模型实时更新展示最新状态
class DocumentCommandHandler {
  async handle(command: EditDocumentCommand): Promise<void> {
    const doc = await this.repository.findById(command.documentId);
    doc.applyEdit(command.operation, command.userId);
    await this.repository.save(doc);
  }
}
```

### 不适用场景

1. **简单 CRUD 应用**：增加了不必要的复杂性
2. **强一致性要求**：CQRS 通常采用最终一致性
3. **小型团队/项目**：维护成本较高
4. **读写比例相近**：CQRS 优势不明显

### 最佳实践

**1. 从简单开始**

```typescript
// 初始阶段：同一数据库，不同表
// 写模型
class Order { /* 领域模型 */ }
// 读模型
interface OrderView { /* 扁平化视图 */ }

// 成熟阶段：独立数据库
// 写：PostgreSQL + Event Store
// 读：Elasticsearch / MongoDB / Redis
```

**2. 命令验证前置**

```typescript
// 在命令处理器之前验证
class CreateOrderCommandValidator {
  validate(command: CreateOrderCommand): ValidationResult {
    const errors: ValidationError[] = [];

    if (!command.customerId) {
      errors.push({ field: 'customerId', message: '客户ID不能为空' });
    }
    if (!command.items || command.items.length === 0) {
      errors.push({ field: 'items', message: '订单项不能为空' });
    }

    return { isValid: errors.length === 0, errors };
  }
}
```

**3. 幂等性处理**

```typescript
// 命令处理器应该是幂等的
class CreateOrderCommandHandler {
  async handle(command: CreateOrderCommand): Promise<void> {
    // 检查命令是否已处理
    const exists = await this.processedCommands.exists(command.commandId);
    if (exists) {
      console.log(`Command ${command.commandId} already processed`);
      return;
    }

    // 处理命令...

    // 记录已处理
    await this.processedCommands.add(command.commandId);
  }
}
```

**4. 处理最终一致性**

```typescript
// 客户端处理最终一致性
class OrderService {
  async createOrder(data: CreateOrderData): Promise<OrderResult> {
    // 发送命令
    await this.commandBus.dispatch(new CreateOrderCommand(data));

    // 返回命令ID，让客户端轮询
    return {
      commandId: command.commandId,
      status: 'processing',
      message: '订单正在处理中，请稍后查询'
    };
  }

  async getOrderStatus(commandId: string): Promise<OrderStatus> {
    // 客户端可以轮询这个接口
    const result = await this.commandStatusStore.get(commandId);
    return result;
  }
}
```

**5. 监控和告警**

```typescript
// 监控投影延迟
class ProjectionMonitor {
  async checkLag(): Promise<ProjectionLagReport[]> {
    const reports: ProjectionLagReport[] = [];

    for (const projection of this.projections) {
      const checkpoint = await projection.getCheckpoint();
      const latestPosition = await this.eventStore.getLatestPosition();
      const lag = latestPosition - checkpoint;

      reports.push({
        projectionName: projection.projectionName,
        checkpoint,
        latestPosition,
        lag,
        status: lag > 1000 ? 'warning' : 'healthy'
      });
    }

    return reports;
  }
}
```

---

## 面试要点

### 常见面试题

**1. 什么是 CQRS？它解决了什么问题？**

答题要点：
- CQRS 将读操作和写操作分离到不同的模型
- 解决读写需求不同的问题（性能、数据结构、扩展性）
- 允许独立优化和扩展读写两端
- 适合读写负载不均衡、需要多种查询视图的场景

**2. CQRS 与传统三层架构有什么区别？**

答题要点：
- 传统架构使用统一模型处理所有操作
- CQRS 使用分离的模型：命令模型处理业务逻辑，查询模型优化读取
- CQRS 可以使用不同的数据存储
- CQRS 通常涉及最终一致性

**3. 如何处理 CQRS 中的一致性问题？**

```typescript
// 方案一：同步更新（强一致性，但耦合度高）
async function handleCommand(command: Command): Promise<void> {
  await writeModel.save(aggregate);
  await readModel.update(aggregate); // 同一事务
}

// 方案二：异步更新（最终一致性，解耦）
async function handleCommand(command: Command): Promise<void> {
  await writeModel.save(aggregate);
  await eventBus.publish(event); // 异步处理
}

// 客户端处理最终一致性
async function queryWithRetry(orderId: string): Promise<Order> {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    const order = await readModel.findById(orderId);
    if (order) return order;
    await sleep(100 * (i + 1)); // 指数退避
  }
  throw new Error('Order not found');
}
```

**4. CQRS 与 Event Sourcing 有什么关系？**

答题要点：
- 可以独立使用，但经常结合
- Event Sourcing 提供完美的写模型（事件存储）
- CQRS 的投影机制可以从事件流构建读模型
- 结合使用提供完整的审计能力和灵活的查询支持

**5. 什么时候应该使用 CQRS？**

答题要点：
- 读写负载差异大
- 需要多种查询视图
- 需要独立扩展读写端
- 复杂的业务领域，需要丰富的领域模型
- 需要审计追踪（配合 Event Sourcing）

不适合使用的场景：
- 简单 CRUD 应用
- 强一致性要求
- 小型项目/团队

### 系统设计题

**设计一个支持 CQRS 的电商订单系统**

```
设计要点：

1. 命令端设计
   - 命令定义：CreateOrder, ConfirmOrder, ShipOrder, CancelOrder
   - 命令处理器：验证、业务逻辑、持久化
   - 领域模型：Order 聚合、OrderItem 实体

2. 查询端设计
   - 读模型：OrderList, OrderDetail, OrderStatistics
   - 查询处理器：优化查询、分页、缓存
   - 数据存储：可以使用 Elasticsearch 做全文搜索

3. 同步机制
   - 事件发布：使用 Kafka/RabbitMQ
   - 投影处理：消费事件更新读模型
   - 幂等性：事件去重

4. 一致性处理
   - 最终一致性接受策略
   - 客户端重试机制
   - 补偿机制

5. 扩展性考虑
   - 读端水平扩展
   - 投影分区
   - 缓存策略
```

### 关键概念总结

```
┌─────────────────────────────────────────────────────────────┐
│                     CQRS 核心概念                            │
├─────────────────────────────────────────────────────────────┤
│  命令（Command）                                             │
│  ├── 改变系统状态的意图                                      │
│  ├── 不返回数据（或仅返回标识符）                            │
│  └── 通过命令处理器执行                                      │
├─────────────────────────────────────────────────────────────┤
│  查询（Query）                                               │
│  ├── 读取数据，不改变状态                                    │
│  ├── 幂等性                                                  │
│  └── 直接访问读模型                                          │
├─────────────────────────────────────────────────────────────┤
│  读模型                                                      │
│  ├── 针对查询优化的非规范化数据                              │
│  ├── 可以有多个不同的读模型                                  │
│  └── 通过投影从事件/写模型同步                               │
├─────────────────────────────────────────────────────────────┤
│  写模型                                                      │
│  ├── 领域模型，包含业务逻辑                                  │
│  ├── 保证数据一致性和业务规则                                │
│  └── 产生领域事件                                            │
├─────────────────────────────────────────────────────────────┤
│  同步策略                                                    │
│  ├── 同步更新：强一致性，同一事务                            │
│  ├── 异步更新：最终一致性，事件驱动                          │
│  └── 投影重建：读模型可以随时重建                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 总结

CQRS 是一种强大的架构模式，通过分离读写职责，使系统能够针对不同需求独立优化。它特别适合读写负载不均衡、需要多种查询视图、以及复杂业务领域的场景。

关键要点：

1. **命令与查询分离**：不同的模型处理不同的职责
2. **读模型优化**：可以根据查询需求设计多个非规范化视图
3. **独立扩展**：读写端可以独立扩展和部署
4. **最终一致性**：通常需要接受读写之间的延迟
5. **与 Event Sourcing 结合**：提供完整的审计能力和灵活性

CQRS 不是银弹，它增加了系统复杂性。在采用之前，需要评估是否真正需要这种分离，以及团队是否有能力处理最终一致性带来的挑战。但一旦正确实施，CQRS 可以显著提升系统的性能、可扩展性和可维护性。
