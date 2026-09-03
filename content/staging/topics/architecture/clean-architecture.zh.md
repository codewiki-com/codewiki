---
title: 整洁架构完全指南
description: 掌握整洁架构原则，构建可维护可测试的软件系统
track: architecture
section: design-patterns
difficulty: advanced
tags:
  - 整洁架构
  - 分层
  - 依赖倒置
  - 架构
status: imported
origin: old/src/content/docs/architecture/clean-architecture.zh.md
divergence: 0.214
issues: []
legacy:
  category: Architecture
  subcategory: Patterns
  order: 11
  lastUpdated: 2026-01-07
---

## 概念解释

整洁架构（Clean Architecture）是由 Robert C. Martin（Uncle Bob）在 2012 年提出的软件架构模式。它综合了多种经典架构思想，包括六边形架构（Hexagonal Architecture）、洋葱架构（Onion Architecture）以及 DCI 架构等，形成了一套统一的架构原则。

### 为什么需要整洁架构？

在软件开发实践中，我们经常面临以下挑战：

1. **框架绑定**：业务逻辑与特定框架紧密耦合，更换框架代价高昂
2. **数据库依赖**：业务规则与数据存储方式紧密关联
3. **外部服务耦合**：第三方 API 变更导致大量代码修改
4. **测试困难**：需要启动完整环境才能测试业务逻辑
5. **UI 变更影响**：界面修改波及核心业务代码

整洁架构的核心目标是**关注点分离**（Separation of Concerns），通过合理的分层和依赖管理，使系统具备以下特性：

- **框架无关性**：框架只是工具，不应该主导架构
- **可测试性**：业务规则可以脱离 UI、数据库等外部因素进行测试
- **UI 无关性**：UI 可以轻松更换，不影响系统其他部分
- **数据库无关性**：可以切换不同的数据存储方案
- **外部代理无关性**：业务规则不依赖外部世界的任何接口

---

## 核心原理：同心圆架构层次

整洁架构最著名的表示形式是同心圆图，从内到外分为四个主要层次：

```
                    ┌─────────────────────────────────────────────┐
                    │           Frameworks & Drivers               │
                    │  ┌─────────────────────────────────────┐    │
                    │  │        Interface Adapters            │    │
                    │  │  ┌─────────────────────────────┐    │    │
                    │  │  │      Application Business    │    │    │
                    │  │  │        (Use Cases)          │    │    │
                    │  │  │  ┌───────────────────┐      │    │    │
                    │  │  │  │    Enterprise     │      │    │    │
                    │  │  │  │     Business      │      │    │    │
                    │  │  │  │    (Entities)     │      │    │    │
                    │  │  │  └───────────────────┘      │    │    │
                    │  │  └─────────────────────────────┘    │    │
                    │  └─────────────────────────────────────┘    │
                    └─────────────────────────────────────────────┘

                    外层依赖内层，内层不知道外层的存在
```

### 实体层（Entities）- 最内层

实体层包含**企业级业务规则**，是整个系统中最稳定、最核心的部分。

```typescript
// domain/entities/Order.ts
// 实体：封装企业级业务规则
export class Order {
  private readonly id: string;
  private items: OrderItem[];
  private status: OrderStatus;
  private readonly customerId: string;
  private readonly createdAt: Date;

  constructor(
    id: string,
    customerId: string,
    items: OrderItem[] = []
  ) {
    this.id = id;
    this.customerId = customerId;
    this.items = items;
    this.status = OrderStatus.PENDING;
    this.createdAt = new Date();
  }

  // 业务规则：计算订单总金额
  calculateTotal(): Money {
    return this.items.reduce(
      (total, item) => total.add(item.getSubtotal()),
      Money.zero()
    );
  }

  // 业务规则：添加商品
  addItem(item: OrderItem): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new OrderCannotBeModifiedError(this.id);
    }

    const existingItem = this.items.find(
      i => i.productId === item.productId
    );

    if (existingItem) {
      existingItem.increaseQuantity(item.quantity);
    } else {
      this.items.push(item);
    }
  }

  // 业务规则：确认订单
  confirm(): void {
    if (this.items.length === 0) {
      throw new EmptyOrderError(this.id);
    }
    if (this.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStateTransitionError(
        this.status,
        OrderStatus.CONFIRMED
      );
    }
    this.status = OrderStatus.CONFIRMED;
  }

  // 业务规则：取消订单
  cancel(): void {
    if (this.status === OrderStatus.SHIPPED) {
      throw new ShippedOrderCannotBeCancelledError(this.id);
    }
    this.status = OrderStatus.CANCELLED;
  }

  // Getters
  getId(): string { return this.id; }
  getStatus(): OrderStatus { return this.status; }
  getItems(): ReadonlyArray<OrderItem> { return [...this.items]; }
  getCustomerId(): string { return this.customerId; }
}
```

```typescript
// domain/entities/OrderItem.ts
export class OrderItem {
  readonly productId: string;
  private _quantity: number;
  private readonly unitPrice: Money;

  constructor(productId: string, quantity: number, unitPrice: Money) {
    if (quantity <= 0) {
      throw new InvalidQuantityError(quantity);
    }
    this.productId = productId;
    this._quantity = quantity;
    this.unitPrice = unitPrice;
  }

  get quantity(): number {
    return this._quantity;
  }

  getSubtotal(): Money {
    return this.unitPrice.multiply(this._quantity);
  }

  increaseQuantity(amount: number): void {
    if (amount <= 0) {
      throw new InvalidQuantityError(amount);
    }
    this._quantity += amount;
  }
}
```

```typescript
// domain/value-objects/Money.ts
// 值对象：不可变，通过值比较
export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string
  ) {
    if (amount < 0) {
      throw new NegativeMoneyError(amount);
    }
  }

  static of(amount: number, currency: string = 'CNY'): Money {
    return new Money(amount, currency);
  }

  static zero(currency: string = 'CNY'): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount &&
           this.currency === other.currency;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
  }

  getAmount(): number { return this.amount; }
  getCurrency(): string { return this.currency; }
}
```

### 用例层（Use Cases）- 应用业务规则

用例层包含**应用级业务规则**，编排实体来完成特定的业务目标。

```typescript
// application/use-cases/CreateOrderUseCase.ts
export interface CreateOrderInput {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface CreateOrderOutput {
  orderId: string;
  totalAmount: number;
  status: string;
}

// 用例接口（输入端口）
export interface CreateOrderUseCase {
  execute(input: CreateOrderInput): Promise<CreateOrderOutput>;
}

// 用例实现
export class CreateOrderInteractor implements CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly idGenerator: IdGenerator,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    // 1. 验证客户存在
    const customer = await this.customerRepository.findById(input.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(input.customerId);
    }

    // 2. 获取商品信息并创建订单项
    const orderItems: OrderItem[] = [];
    for (const item of input.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new ProductNotFoundError(item.productId);
      }
      if (!product.isAvailable()) {
        throw new ProductNotAvailableError(item.productId);
      }

      orderItems.push(new OrderItem(
        product.getId(),
        item.quantity,
        product.getPrice()
      ));
    }

    // 3. 创建订单实体
    const orderId = this.idGenerator.generate();
    const order = new Order(orderId, input.customerId, orderItems);

    // 4. 持久化订单
    await this.orderRepository.save(order);

    // 5. 发布领域事件
    await this.eventPublisher.publish(
      new OrderCreatedEvent(order.getId(), order.getCustomerId())
    );

    // 6. 返回结果
    return {
      orderId: order.getId(),
      totalAmount: order.calculateTotal().getAmount(),
      status: order.getStatus()
    };
  }
}
```

```typescript
// application/use-cases/ConfirmOrderUseCase.ts
export interface ConfirmOrderInput {
  orderId: string;
  paymentId: string;
}

export interface ConfirmOrderOutput {
  orderId: string;
  status: string;
  confirmedAt: Date;
}

export class ConfirmOrderInteractor implements ConfirmOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentService: PaymentService,
    private readonly inventoryService: InventoryService,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  async execute(input: ConfirmOrderInput): Promise<ConfirmOrderOutput> {
    // 1. 获取订单
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    // 2. 验证支付
    const paymentValid = await this.paymentService.verify(input.paymentId);
    if (!paymentValid) {
      throw new PaymentVerificationFailedError(input.paymentId);
    }

    // 3. 检查库存
    for (const item of order.getItems()) {
      const available = await this.inventoryService.checkAvailability(
        item.productId,
        item.quantity
      );
      if (!available) {
        throw new InsufficientInventoryError(item.productId);
      }
    }

    // 4. 扣减库存
    for (const item of order.getItems()) {
      await this.inventoryService.reserve(item.productId, item.quantity);
    }

    // 5. 确认订单（调用实体业务方法）
    order.confirm();

    // 6. 保存订单
    await this.orderRepository.save(order);

    // 7. 发布事件
    await this.eventPublisher.publish(
      new OrderConfirmedEvent(order.getId())
    );

    return {
      orderId: order.getId(),
      status: order.getStatus(),
      confirmedAt: new Date()
    };
  }
}
```

### 接口适配器层（Interface Adapters）

接口适配器层负责**数据格式转换**，将外部数据格式转换为内部用例所需的格式，反之亦然。

```typescript
// adapters/controllers/OrderController.ts
// 控制器：处理 HTTP 请求，调用用例
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly confirmOrderUseCase: ConfirmOrderUseCase,
    private readonly getOrderUseCase: GetOrderUseCase
  ) {}

  // POST /orders
  async createOrder(req: HttpRequest): Promise<HttpResponse> {
    try {
      // 1. 解析请求数据
      const input: CreateOrderInput = {
        customerId: req.body.customerId,
        items: req.body.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      // 2. 执行用例
      const output = await this.createOrderUseCase.execute(input);

      // 3. 转换为 HTTP 响应
      return {
        statusCode: 201,
        body: {
          success: true,
          data: {
            orderId: output.orderId,
            totalAmount: output.totalAmount,
            status: output.status
          }
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // POST /orders/:id/confirm
  async confirmOrder(req: HttpRequest): Promise<HttpResponse> {
    try {
      const input: ConfirmOrderInput = {
        orderId: req.params.id,
        paymentId: req.body.paymentId
      };

      const output = await this.confirmOrderUseCase.execute(input);

      return {
        statusCode: 200,
        body: {
          success: true,
          data: output
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: Error): HttpResponse {
    if (error instanceof OrderNotFoundError) {
      return { statusCode: 404, body: { error: error.message } };
    }
    if (error instanceof ValidationError) {
      return { statusCode: 400, body: { error: error.message } };
    }
    // 未知错误
    console.error('Unexpected error:', error);
    return { statusCode: 500, body: { error: 'Internal server error' } };
  }
}
```

```typescript
// adapters/presenters/OrderPresenter.ts
// Presenter：将用例输出转换为视图模型
export interface OrderViewModel {
  id: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    subtotal: string;
  }>;
  total: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  canCancel: boolean;
  canModify: boolean;
}

export class OrderPresenter {
  present(order: OrderDTO): OrderViewModel {
    return {
      id: order.id,
      customerName: order.customerName,
      items: order.items.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        price: this.formatCurrency(item.unitPrice),
        subtotal: this.formatCurrency(item.unitPrice * item.quantity)
      })),
      total: this.formatCurrency(order.totalAmount),
      status: order.status,
      statusLabel: this.getStatusLabel(order.status),
      createdAt: this.formatDate(order.createdAt),
      canCancel: this.canCancel(order.status),
      canModify: order.status === 'PENDING'
    };
  }

  private formatCurrency(amount: number): string {
    return `¥${amount.toFixed(2)}`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: '待确认',
      CONFIRMED: '已确认',
      SHIPPED: '已发货',
      DELIVERED: '已送达',
      CANCELLED: '已取消'
    };
    return labels[status] || status;
  }

  private canCancel(status: string): boolean {
    return ['PENDING', 'CONFIRMED'].includes(status);
  }
}
```

```typescript
// adapters/repositories/TypeOrmOrderRepository.ts
// 仓储实现：将领域对象转换为数据库记录
import { Repository } from 'typeorm';

export class TypeOrmOrderRepository implements OrderRepository {
  constructor(
    private readonly ormRepository: Repository<OrderEntity>
  ) {}

  async findById(id: string): Promise<Order | null> {
    const entity = await this.ormRepository.findOne({
      where: { id },
      relations: ['items']
    });

    if (!entity) {
      return null;
    }

    return this.toDomain(entity);
  }

  async save(order: Order): Promise<void> {
    const entity = this.toEntity(order);
    await this.ormRepository.save(entity);
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const entities = await this.ormRepository.find({
      where: { customerId },
      relations: ['items'],
      order: { createdAt: 'DESC' }
    });

    return entities.map(e => this.toDomain(e));
  }

  // 数据库实体 -> 领域对象
  private toDomain(entity: OrderEntity): Order {
    const items = entity.items.map(
      item => new OrderItem(
        item.productId,
        item.quantity,
        Money.of(item.unitPrice)
      )
    );

    return Order.reconstitute(
      entity.id,
      entity.customerId,
      items,
      entity.status as OrderStatus,
      entity.createdAt
    );
  }

  // 领域对象 -> 数据库实体
  private toEntity(order: Order): OrderEntity {
    const entity = new OrderEntity();
    entity.id = order.getId();
    entity.customerId = order.getCustomerId();
    entity.status = order.getStatus();
    entity.totalAmount = order.calculateTotal().getAmount();
    entity.items = order.getItems().map(item => {
      const itemEntity = new OrderItemEntity();
      itemEntity.productId = item.productId;
      itemEntity.quantity = item.quantity;
      itemEntity.unitPrice = item.getSubtotal().getAmount() / item.quantity;
      return itemEntity;
    });
    return entity;
  }
}
```

### 框架与驱动层（Frameworks & Drivers）- 最外层

这是最外层，包含所有技术细节：Web 框架、数据库、外部服务等。

```typescript
// infrastructure/web/ExpressApp.ts
import express from 'express';

export function createExpressApp(
  orderController: OrderController
): express.Application {
  const app = express();

  app.use(express.json());

  // 路由配置
  app.post('/api/orders', async (req, res) => {
    const response = await orderController.createOrder({
      body: req.body,
      params: req.params,
      query: req.query
    });
    res.status(response.statusCode).json(response.body);
  });

  app.post('/api/orders/:id/confirm', async (req, res) => {
    const response = await orderController.confirmOrder({
      body: req.body,
      params: req.params,
      query: req.query
    });
    res.status(response.statusCode).json(response.body);
  });

  app.get('/api/orders/:id', async (req, res) => {
    const response = await orderController.getOrder({
      body: req.body,
      params: req.params,
      query: req.query
    });
    res.status(response.statusCode).json(response.body);
  });

  return app;
}
```

```typescript
// infrastructure/database/TypeOrmConfig.ts
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [OrderEntity, OrderItemEntity, CustomerEntity, ProductEntity],
  migrations: ['./migrations/*.ts'],
  synchronize: false
});
```

```typescript
// infrastructure/services/StripePaymentService.ts
import Stripe from 'stripe';

export class StripePaymentService implements PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });
  }

  async verify(paymentId: string): Promise<boolean> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);
      return paymentIntent.status === 'succeeded';
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  async createPaymentIntent(amount: number, currency: string): Promise<string> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe 使用分为单位
      currency: currency.toLowerCase()
    });
    return paymentIntent.id;
  }
}
```

---

## 依赖规则

整洁架构最重要的规则是**依赖规则**（The Dependency Rule）：

> **源代码依赖只能指向内层，内层不能知道外层的任何信息。**

```
                外层                              内层
    ┌──────────────────────┐             ┌──────────────────────┐
    │                      │             │                      │
    │   Frameworks         │ ─────────►  │     Entities         │
    │   Controllers        │             │     Use Cases        │
    │   Repositories Impl  │             │     Interfaces       │
    │                      │             │                      │
    └──────────────────────┘             └──────────────────────┘

    外层了解内层                          内层不知道外层存在
```

### 依赖倒置原则的应用

为了遵守依赖规则，我们大量使用**依赖倒置原则**（DIP）：

```typescript
// application/ports/OrderRepository.ts
// 接口定义在内层（用例层）
export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
  findByCustomerId(customerId: string): Promise<Order[]>;
}

// adapters/repositories/TypeOrmOrderRepository.ts
// 实现在外层（适配器层）
export class TypeOrmOrderRepository implements OrderRepository {
  // ... 实现细节
}
```

```typescript
// application/ports/PaymentService.ts
// 外部服务接口定义在内层
export interface PaymentService {
  verify(paymentId: string): Promise<boolean>;
  createPaymentIntent(amount: number, currency: string): Promise<string>;
}

// infrastructure/services/StripePaymentService.ts
// 具体实现在外层
export class StripePaymentService implements PaymentService {
  // ... Stripe 具体实现
}
```

### 跨越边界

当控制流需要跨越边界时，我们使用**接口**和**依赖注入**：

```typescript
// main.ts - 组合根（Composition Root）
async function bootstrap() {
  // 初始化数据源
  await AppDataSource.initialize();

  // 创建基础设施组件
  const idGenerator = new UuidIdGenerator();
  const eventPublisher = new RabbitMQEventPublisher();

  // 创建仓储
  const orderRepository = new TypeOrmOrderRepository(
    AppDataSource.getRepository(OrderEntity)
  );
  const productRepository = new TypeOrmProductRepository(
    AppDataSource.getRepository(ProductEntity)
  );
  const customerRepository = new TypeOrmCustomerRepository(
    AppDataSource.getRepository(CustomerEntity)
  );

  // 创建外部服务
  const paymentService = new StripePaymentService();
  const inventoryService = new InventoryServiceClient();

  // 创建用例
  const createOrderUseCase = new CreateOrderInteractor(
    orderRepository,
    productRepository,
    customerRepository,
    idGenerator,
    eventPublisher
  );

  const confirmOrderUseCase = new ConfirmOrderInteractor(
    orderRepository,
    paymentService,
    inventoryService,
    eventPublisher
  );

  // 创建控制器
  const orderController = new OrderController(
    createOrderUseCase,
    confirmOrderUseCase,
    getOrderUseCase
  );

  // 创建并启动应用
  const app = createExpressApp(orderController);

  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}

bootstrap();
```

---

## 与六边形架构对比

整洁架构和六边形架构有很多相似之处，但也有一些关键区别：

```
              六边形架构                           整洁架构
    ┌─────────────────────────┐       ┌─────────────────────────┐
    │                         │       │      Frameworks          │
    │  ┌───────────────────┐  │       │  ┌───────────────────┐  │
    │  │    Adapters       │  │       │  │  Interface         │  │
    │  │  ┌───────────┐    │  │       │  │   Adapters         │  │
    │  │  │           │    │  │       │  │  ┌───────────┐    │  │
    │  │  │   Core    │    │  │       │  │  │ Use Cases │    │  │
    │  │  │  Domain   │    │  │       │  │  │┌─────────┐│    │  │
    │  │  │           │    │  │       │  │  ││Entities ││    │  │
    │  │  └───────────┘    │  │       │  │  │└─────────┘│    │  │
    │  └───────────────────┘  │       │  │  └───────────┘    │  │
    │                         │       │  └───────────────────┘  │
    └─────────────────────────┘       └─────────────────────────┘

    两层结构：                          四层结构：
    - 核心域（Ports）                   - Entities
    - 适配器                            - Use Cases
                                        - Interface Adapters
                                        - Frameworks & Drivers
```

### 主要区别

| 特性 | 六边形架构 | 整洁架构 |
|------|-----------|---------|
| 层次数量 | 2层（核心 + 适配器） | 4层明确定义 |
| 关注点 | 端口和适配器 | 依赖方向和层次职责 |
| 实体与用例 | 合并在核心域 | 明确分离 |
| 可视化 | 六边形 | 同心圆 |
| 规范程度 | 更灵活 | 更规范 |

### 如何选择？

```typescript
// 六边形架构风格 - 强调端口
interface OrderPort {
  createOrder(command: CreateOrderCommand): Promise<OrderId>;
  findOrder(query: FindOrderQuery): Promise<OrderReadModel>;
}

// 整洁架构风格 - 强调用例分离
interface CreateOrderUseCase {
  execute(input: CreateOrderInput): Promise<CreateOrderOutput>;
}

interface FindOrderUseCase {
  execute(input: FindOrderInput): Promise<FindOrderOutput>;
}
```

实际项目中，两种架构可以混合使用，重要的是理解核心原则：**隔离业务逻辑，控制依赖方向**。

---

## 完整订单系统示例

### 项目结构

```
src/
├── domain/                          # 实体层
│   ├── entities/
│   │   ├── Order.ts
│   │   ├── OrderItem.ts
│   │   ├── Customer.ts
│   │   └── Product.ts
│   ├── value-objects/
│   │   ├── Money.ts
│   │   ├── Address.ts
│   │   └── OrderId.ts
│   ├── events/
│   │   ├── OrderCreatedEvent.ts
│   │   └── OrderConfirmedEvent.ts
│   └── errors/
│       ├── OrderNotFoundError.ts
│       └── InvalidOrderStateError.ts
│
├── application/                     # 用例层
│   ├── use-cases/
│   │   ├── CreateOrderUseCase.ts
│   │   ├── ConfirmOrderUseCase.ts
│   │   ├── CancelOrderUseCase.ts
│   │   └── GetOrderUseCase.ts
│   ├── ports/                       # 接口定义
│   │   ├── repositories/
│   │   │   ├── OrderRepository.ts
│   │   │   └── ProductRepository.ts
│   │   └── services/
│   │       ├── PaymentService.ts
│   │       └── NotificationService.ts
│   └── dto/
│       ├── CreateOrderInput.ts
│       └── OrderDTO.ts
│
├── adapters/                        # 接口适配器层
│   ├── controllers/
│   │   └── OrderController.ts
│   ├── presenters/
│   │   └── OrderPresenter.ts
│   ├── repositories/
│   │   └── TypeOrmOrderRepository.ts
│   └── gateways/
│       └── OrderApiGateway.ts
│
├── infrastructure/                  # 框架与驱动层
│   ├── web/
│   │   ├── ExpressApp.ts
│   │   └── middleware/
│   ├── database/
│   │   ├── TypeOrmConfig.ts
│   │   └── entities/
│   ├── services/
│   │   ├── StripePaymentService.ts
│   │   └── SendGridNotificationService.ts
│   └── messaging/
│       └── RabbitMQEventPublisher.ts
│
└── main.ts                          # 组合根
```

### 取消订单用例完整实现

```typescript
// application/use-cases/CancelOrderUseCase.ts
export interface CancelOrderInput {
  orderId: string;
  reason: string;
  requestedBy: string;
}

export interface CancelOrderOutput {
  orderId: string;
  status: string;
  cancelledAt: Date;
  refundInitiated: boolean;
}

export class CancelOrderInteractor implements CancelOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentService: PaymentService,
    private readonly inventoryService: InventoryService,
    private readonly notificationService: NotificationService,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  async execute(input: CancelOrderInput): Promise<CancelOrderOutput> {
    // 1. 获取订单
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    // 2. 执行领域逻辑（实体方法）
    order.cancel();

    // 3. 释放库存
    for (const item of order.getItems()) {
      await this.inventoryService.release(item.productId, item.quantity);
    }

    // 4. 发起退款（如果已支付）
    let refundInitiated = false;
    if (order.isPaid()) {
      await this.paymentService.refund(order.getPaymentId()!);
      refundInitiated = true;
    }

    // 5. 保存订单
    await this.orderRepository.save(order);

    // 6. 发送通知
    await this.notificationService.sendOrderCancelled(
      order.getCustomerId(),
      order.getId(),
      input.reason
    );

    // 7. 发布领域事件
    await this.eventPublisher.publish(
      new OrderCancelledEvent(order.getId(), input.reason, input.requestedBy)
    );

    return {
      orderId: order.getId(),
      status: order.getStatus(),
      cancelledAt: new Date(),
      refundInitiated
    };
  }
}
```

---

## 测试策略

整洁架构的一大优势是**可测试性**。不同层次有不同的测试策略：

### 实体层测试（单元测试）

```typescript
// domain/entities/__tests__/Order.test.ts
describe('Order', () => {
  describe('calculateTotal', () => {
    it('should calculate total correctly', () => {
      const order = new Order('order-1', 'customer-1');
      order.addItem(new OrderItem('product-1', 2, Money.of(100)));
      order.addItem(new OrderItem('product-2', 1, Money.of(50)));

      const total = order.calculateTotal();

      expect(total.getAmount()).toBe(250);
    });

    it('should return zero for empty order', () => {
      const order = new Order('order-1', 'customer-1');

      const total = order.calculateTotal();

      expect(total.getAmount()).toBe(0);
    });
  });

  describe('confirm', () => {
    it('should change status to CONFIRMED', () => {
      const order = new Order('order-1', 'customer-1');
      order.addItem(new OrderItem('product-1', 1, Money.of(100)));

      order.confirm();

      expect(order.getStatus()).toBe(OrderStatus.CONFIRMED);
    });

    it('should throw error for empty order', () => {
      const order = new Order('order-1', 'customer-1');

      expect(() => order.confirm()).toThrow(EmptyOrderError);
    });

    it('should throw error if not in PENDING status', () => {
      const order = new Order('order-1', 'customer-1');
      order.addItem(new OrderItem('product-1', 1, Money.of(100)));
      order.confirm();

      expect(() => order.confirm()).toThrow(InvalidOrderStateTransitionError);
    });
  });

  describe('cancel', () => {
    it('should allow cancellation of pending order', () => {
      const order = new Order('order-1', 'customer-1');

      order.cancel();

      expect(order.getStatus()).toBe(OrderStatus.CANCELLED);
    });

    it('should not allow cancellation of shipped order', () => {
      const order = Order.reconstitute(
        'order-1',
        'customer-1',
        [],
        OrderStatus.SHIPPED,
        new Date()
      );

      expect(() => order.cancel()).toThrow(ShippedOrderCannotBeCancelledError);
    });
  });
});
```

### 用例层测试（集成测试）

```typescript
// application/use-cases/__tests__/CreateOrderUseCase.test.ts
describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderInteractor;
  let orderRepository: jest.Mocked<OrderRepository>;
  let productRepository: jest.Mocked<ProductRepository>;
  let customerRepository: jest.Mocked<CustomerRepository>;
  let idGenerator: jest.Mocked<IdGenerator>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;

  beforeEach(() => {
    orderRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findByCustomerId: jest.fn()
    };
    productRepository = {
      findById: jest.fn()
    };
    customerRepository = {
      findById: jest.fn()
    };
    idGenerator = {
      generate: jest.fn().mockReturnValue('generated-order-id')
    };
    eventPublisher = {
      publish: jest.fn()
    };

    useCase = new CreateOrderInteractor(
      orderRepository,
      productRepository,
      customerRepository,
      idGenerator,
      eventPublisher
    );
  });

  it('should create order successfully', async () => {
    // Arrange
    const customer = new Customer('customer-1', 'John Doe', 'john@example.com');
    const product = new Product('product-1', 'Widget', Money.of(100), true);

    customerRepository.findById.mockResolvedValue(customer);
    productRepository.findById.mockResolvedValue(product);
    orderRepository.save.mockResolvedValue();
    eventPublisher.publish.mockResolvedValue();

    const input: CreateOrderInput = {
      customerId: 'customer-1',
      items: [{ productId: 'product-1', quantity: 2 }]
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.orderId).toBe('generated-order-id');
    expect(result.totalAmount).toBe(200);
    expect(result.status).toBe('PENDING');
    expect(orderRepository.save).toHaveBeenCalled();
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'generated-order-id',
        customerId: 'customer-1'
      })
    );
  });

  it('should throw error if customer not found', async () => {
    customerRepository.findById.mockResolvedValue(null);

    const input: CreateOrderInput = {
      customerId: 'non-existent',
      items: [{ productId: 'product-1', quantity: 1 }]
    };

    await expect(useCase.execute(input)).rejects.toThrow(CustomerNotFoundError);
  });

  it('should throw error if product not available', async () => {
    const customer = new Customer('customer-1', 'John Doe', 'john@example.com');
    const unavailableProduct = new Product('product-1', 'Widget', Money.of(100), false);

    customerRepository.findById.mockResolvedValue(customer);
    productRepository.findById.mockResolvedValue(unavailableProduct);

    const input: CreateOrderInput = {
      customerId: 'customer-1',
      items: [{ productId: 'product-1', quantity: 1 }]
    };

    await expect(useCase.execute(input)).rejects.toThrow(ProductNotAvailableError);
  });
});
```

### 适配器层测试（集成测试）

```typescript
// adapters/repositories/__tests__/TypeOrmOrderRepository.test.ts
describe('TypeOrmOrderRepository', () => {
  let repository: TypeOrmOrderRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    // 使用测试数据库
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [OrderEntity, OrderItemEntity],
      synchronize: true
    });
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    repository = new TypeOrmOrderRepository(
      dataSource.getRepository(OrderEntity)
    );
    // 清理数据
    await dataSource.getRepository(OrderEntity).clear();
  });

  it('should save and retrieve order', async () => {
    const order = new Order('order-1', 'customer-1');
    order.addItem(new OrderItem('product-1', 2, Money.of(100)));

    await repository.save(order);
    const retrieved = await repository.findById('order-1');

    expect(retrieved).not.toBeNull();
    expect(retrieved!.getId()).toBe('order-1');
    expect(retrieved!.getItems()).toHaveLength(1);
    expect(retrieved!.calculateTotal().getAmount()).toBe(200);
  });

  it('should return null for non-existent order', async () => {
    const result = await repository.findById('non-existent');

    expect(result).toBeNull();
  });

  it('should find orders by customer id', async () => {
    const order1 = new Order('order-1', 'customer-1');
    const order2 = new Order('order-2', 'customer-1');
    const order3 = new Order('order-3', 'customer-2');

    await repository.save(order1);
    await repository.save(order2);
    await repository.save(order3);

    const orders = await repository.findByCustomerId('customer-1');

    expect(orders).toHaveLength(2);
    expect(orders.map(o => o.getId())).toContain('order-1');
    expect(orders.map(o => o.getId())).toContain('order-2');
  });
});
```

### 端到端测试

```typescript
// e2e/order.e2e.test.ts
describe('Order API E2E', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('should create and confirm order', async () => {
    // 创建订单
    const createResponse = await request(app)
      .post('/api/orders')
      .send({
        customerId: 'customer-1',
        items: [
          { productId: 'product-1', quantity: 2 }
        ]
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.orderId).toBeDefined();

    const orderId = createResponse.body.data.orderId;

    // 确认订单
    const confirmResponse = await request(app)
      .post(`/api/orders/${orderId}/confirm`)
      .send({
        paymentId: 'payment-123'
      });

    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body.data.status).toBe('CONFIRMED');

    // 查询订单
    const getResponse = await request(app)
      .get(`/api/orders/${orderId}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.status).toBe('CONFIRMED');
  });
});
```

---

## 面试要点

### 什么是整洁架构？核心思想是什么？

**答**：整洁架构是 Robert C. Martin 提出的一种软件架构模式，核心思想是**关注点分离**和**依赖方向控制**。它将系统分为四个同心圆层次：实体、用例、接口适配器、框架与驱动。最重要的规则是**依赖规则**：源代码依赖只能指向内层，内层不知道外层的存在。

### 整洁架构的四个层次分别是什么？各自的职责是什么？

**答**：
- **实体层（Entities）**：包含企业级业务规则，最稳定的部分
- **用例层（Use Cases）**：包含应用级业务规则，编排实体完成业务目标
- **接口适配器层（Interface Adapters）**：数据格式转换，包括控制器、展示器、仓储实现
- **框架与驱动层（Frameworks & Drivers）**：技术细节，如 Web 框架、数据库、外部服务

### 如何实现依赖规则？

**答**：通过**依赖倒置原则**（DIP）实现。在内层定义接口（抽象），在外层提供实现。例如，`OrderRepository` 接口定义在用例层，而 `TypeOrmOrderRepository` 实现在适配器层。通过依赖注入，外层实现被注入到内层使用。

### 整洁架构和六边形架构有什么区别？

**答**：
- 六边形架构是两层结构（核心域 + 适配器），整洁架构是四层结构
- 六边形架构强调端口和适配器的概念，整洁架构强调层次和依赖方向
- 整洁架构明确分离了实体和用例，六边形架构通常将它们合并在核心域
- 两者核心理念相同：隔离业务逻辑，控制依赖方向

### 实体和用例有什么区别？

**答**：
- **实体**包含**企业级业务规则**，是跨应用的通用规则，如"订单必须有商品才能确认"
- **用例**包含**应用级业务规则**，是特定应用的业务流程，如"创建订单需要验证客户、检查库存、发送通知"
- 实体更稳定，很少变化；用例可能随应用需求变化

### 如何测试整洁架构的系统？

**答**：
- **实体层**：纯单元测试，不需要任何模拟
- **用例层**：使用模拟对象替代外部依赖，测试业务逻辑编排
- **适配器层**：集成测试，使用测试数据库或模拟服务
- **端到端测试**：测试完整流程
- 内层代码因为不依赖外部，非常容易测试

### 什么是组合根（Composition Root）？

**答**：组合根是应用程序中**组装所有依赖**的唯一位置，通常是 `main` 函数或启动模块。在这里创建所有具体实现并通过依赖注入连接起来。这样做的好处是依赖配置集中管理，便于切换实现（如切换数据库、切换测试环境）。

### 整洁架构的缺点是什么？

**答**：
- **代码量增加**：需要定义大量接口和 DTO
- **学习成本**：团队需要理解架构原则
- **过度设计风险**：简单项目可能不需要这么多层次
- **数据转换开销**：层间数据转换带来一定性能开销
- **初期开发慢**：前期搭建架构需要时间

### 什么场景适合使用整洁架构？

**答**：
- 复杂的业务逻辑系统
- 需要长期维护的项目
- 可能更换技术栈的项目
- 需要高测试覆盖率的项目
- 团队规模较大，需要明确边界的项目

简单的 CRUD 应用、原型项目、短期项目可能不需要整洁架构。

### 如何处理跨层数据传递？

**答**：
- 使用 **DTO（数据传输对象）** 在层间传递数据
- 每层定义自己的数据结构，在边界处转换
- 避免让实体直接暴露给外层，使用 Presenter 转换
- Input/Output 对象定义用例的输入输出格式

---

## 总结

整洁架构是一种强调**依赖方向控制**和**关注点分离**的架构模式。通过将系统分为实体、用例、接口适配器、框架与驱动四个层次，并严格遵守依赖规则，我们可以构建出：

1. **可测试**：核心业务逻辑可以脱离外部依赖进行测试
2. **可维护**：变更被限制在特定层次，不会波及全系统
3. **灵活**：可以轻松更换框架、数据库、外部服务
4. **独立**：业务逻辑不受技术决策影响

记住 Uncle Bob 的名言：

> "架构师的工作不是做决定，而是尽可能延迟决定。"

整洁架构正是让我们能够延迟技术决定，专注于业务价值的架构方式。

---

## 参考资源

- 《Clean Architecture》 - Robert C. Martin
- 《Implementing Domain-Driven Design》 - Vaughn Vernon
- 《架构整洁之道》 - Robert C. Martin（中文版）
- Uncle Bob's Clean Architecture Blog Post
