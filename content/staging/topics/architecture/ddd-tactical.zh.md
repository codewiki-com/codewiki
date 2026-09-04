---
title: DDD 战术设计模式
description: 掌握领域驱动设计的战术模式，实现复杂业务逻辑
track: architecture
section: ddd
difficulty: advanced
tags:
  - DDD
  - 战术设计
  - 实体
  - 聚合
status: imported
origin: old/src/content/docs/architecture/ddd-tactical.zh.md
divergence: 0.224
issues: []
legacy:
  category: Architecture
  subcategory: DDD
  order: 6
  lastUpdated: 2026-01-07
---

## 概述

领域驱动设计 (DDD) 的战术模式是一套在代码层面实现领域模型的构建块 (Building Blocks)。这些模式帮助开发者将复杂的业务逻辑以清晰、可维护的方式组织在代码中，使代码结构与业务概念保持一致。

战术设计的核心目标是：**让代码成为业务知识的载体，而非仅仅是技术实现。**

本文将深入探讨 DDD 的七大战术模式，并通过一个完整的订单领域建模案例来展示这些模式的实际应用。

---

## 实体（Entity）与值对象（Value Object）

### 实体（Entity）

实体是具有唯一标识的领域对象，其生命周期中标识保持不变。实体的相等性由标识决定，而非属性值。

**实体的核心特征：**

- 具有唯一标识（ID）
- 可变性：状态可以改变，但标识不变
- 生命周期：从创建到删除的完整过程
- 相等性：通过标识判断是否相等

```typescript
// 订单实体
class Order {
  private readonly id: OrderId;
  private status: OrderStatus;
  private items: OrderItem[];
  private totalAmount: Money;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: OrderId,
    customerId: CustomerId,
    items: OrderItem[]
  ) {
    this.id = id;
    this.customerId = customerId;
    this.items = items;
    this.status = OrderStatus.PENDING;
    this.totalAmount = this.calculateTotal();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // 唯一标识
  getId(): OrderId {
    return this.id;
  }

  // 业务行为：确认订单
  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStateError(
        `Cannot confirm order in ${this.status} status`
      );
    }
    this.status = OrderStatus.CONFIRMED;
    this.updatedAt = new Date();
  }

  // 业务行为：取消订单
  cancel(reason: CancellationReason): void {
    if (!this.canBeCancelled()) {
      throw new InvalidOrderStateError('Order cannot be cancelled');
    }
    this.status = OrderStatus.CANCELLED;
    this.cancellationReason = reason;
    this.updatedAt = new Date();
  }

  private canBeCancelled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(this.status);
  }

  private calculateTotal(): Money {
    return this.items.reduce(
      (sum, item) => sum.add(item.getSubtotal()),
      Money.zero()
    );
  }

  // 实体相等性：基于标识比较
  equals(other: Order): boolean {
    return this.id.equals(other.id);
  }
}
```

### 值对象（Value Object）

值对象是没有唯一标识的领域对象，其相等性由所有属性值共同决定。值对象是不可变的，任何修改都会创建新的实例。

**值对象的核心特征：**

- 无唯一标识
- 不可变性：创建后不可修改
- 相等性：通过所有属性值判断
- 可替换性：相等的值对象可以互换

```typescript
// 金额值对象
class Money {
  private readonly amount: number;
  private readonly currency: Currency;

  private constructor(amount: number, currency: Currency) {
    if (amount < 0) {
      throw new InvalidMoneyError('Amount cannot be negative');
    }
    this.amount = amount;
    this.currency = currency;
  }

  static of(amount: number, currency: Currency = Currency.CNY): Money {
    return new Money(amount, currency);
  }

  static zero(currency: Currency = Currency.CNY): Money {
    return new Money(0, currency);
  }

  // 不可变操作：返回新的值对象
  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(
        `Cannot operate on different currencies: ${this.currency} and ${other.currency}`
      );
    }
  }

  // 值对象相等性：基于所有属性比较
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}

// 地址值对象
class Address {
  private readonly province: string;
  private readonly city: string;
  private readonly district: string;
  private readonly street: string;
  private readonly zipCode: string;

  constructor(
    province: string,
    city: string,
    district: string,
    street: string,
    zipCode: string
  ) {
    this.validateAddress(province, city, district, street, zipCode);
    this.province = province;
    this.city = city;
    this.district = district;
    this.street = street;
    this.zipCode = zipCode;
  }

  private validateAddress(...parts: string[]): void {
    if (parts.some(part => !part || part.trim().length === 0)) {
      throw new InvalidAddressError('Address parts cannot be empty');
    }
  }

  // 创建新地址（值对象不可变）
  withStreet(newStreet: string): Address {
    return new Address(
      this.province,
      this.city,
      this.district,
      newStreet,
      this.zipCode
    );
  }

  equals(other: Address): boolean {
    return (
      this.province === other.province &&
      this.city === other.city &&
      this.district === other.district &&
      this.street === other.street &&
      this.zipCode === other.zipCode
    );
  }

  getFullAddress(): string {
    return `${this.province}${this.city}${this.district}${this.street}`;
  }
}
```

### 如何选择实体还是值对象？

| 考量因素 | 选择实体 | 选择值对象 |
|---------|---------|-----------|
| 是否需要唯一标识 | 需要跟踪生命周期 | 只关心属性值 |
| 是否需要可变性 | 状态会变化 | 创建后不变 |
| 相等性判断 | 同一个对象 | 属性值相同 |
| 例子 | 用户、订单、商品 | 金额、地址、日期范围 |

---

## 聚合（Aggregate）与聚合根

### 聚合的概念

聚合是一组相关对象的集合，被视为数据修改的单元。聚合定义了一个清晰的边界，边界内的对象保持一致性约束。

**聚合的核心原则：**

- **边界清晰**：明确哪些对象属于聚合
- **一致性保证**：聚合内部保持业务规则的一致性
- **事务边界**：一个事务只修改一个聚合
- **通过聚合根访问**：外部只能通过聚合根操作聚合内部对象

### 聚合根（Aggregate Root）

聚合根是聚合的入口点，是外部访问聚合的唯一途径。聚合根是一个实体，负责维护聚合的完整性。

```typescript
// 订单聚合根
class Order {
  private readonly id: OrderId;
  private readonly customerId: CustomerId;
  private status: OrderStatus;
  private items: OrderItem[]; // 聚合内部对象
  private shippingAddress: Address; // 值对象
  private totalAmount: Money;
  private readonly domainEvents: DomainEvent[] = [];

  constructor(props: OrderProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.items = [];
    this.status = OrderStatus.DRAFT;
    this.shippingAddress = props.shippingAddress;
    this.totalAmount = Money.zero();
  }

  // 通过聚合根添加订单项
  addItem(product: Product, quantity: number): void {
    this.ensureOrderIsDraft();

    const existingItem = this.findItemByProductId(product.getId());

    if (existingItem) {
      existingItem.increaseQuantity(quantity);
    } else {
      const newItem = new OrderItem(
        OrderItemId.generate(),
        product.getId(),
        product.getName(),
        product.getPrice(),
        quantity
      );
      this.items.push(newItem);
    }

    this.recalculateTotal();
  }

  // 通过聚合根移除订单项
  removeItem(itemId: OrderItemId): void {
    this.ensureOrderIsDraft();

    const index = this.items.findIndex(item => item.getId().equals(itemId));
    if (index === -1) {
      throw new OrderItemNotFoundError(itemId);
    }

    this.items.splice(index, 1);
    this.recalculateTotal();
  }

  // 提交订单
  submit(): void {
    this.ensureOrderIsDraft();

    if (this.items.length === 0) {
      throw new EmptyOrderError('Cannot submit an empty order');
    }

    this.status = OrderStatus.PENDING;

    // 发布领域事件
    this.addDomainEvent(new OrderSubmittedEvent(this.id, this.customerId, this.totalAmount));
  }

  // 确认订单
  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStateError(`Order must be pending to confirm`);
    }

    this.status = OrderStatus.CONFIRMED;
    this.addDomainEvent(new OrderConfirmedEvent(this.id));
  }

  // 聚合内部：查找订单项
  private findItemByProductId(productId: ProductId): OrderItem | undefined {
    return this.items.find(item => item.getProductId().equals(productId));
  }

  private ensureOrderIsDraft(): void {
    if (this.status !== OrderStatus.DRAFT) {
      throw new InvalidOrderStateError('Order can only be modified in draft status');
    }
  }

  private recalculateTotal(): void {
    this.totalAmount = this.items.reduce(
      (sum, item) => sum.add(item.getSubtotal()),
      Money.zero()
    );
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }
}

// 订单项（聚合内部实体）
class OrderItem {
  private readonly id: OrderItemId;
  private readonly productId: ProductId;
  private readonly productName: string;
  private readonly unitPrice: Money;
  private quantity: number;

  constructor(
    id: OrderItemId,
    productId: ProductId,
    productName: string,
    unitPrice: Money,
    quantity: number
  ) {
    if (quantity <= 0) {
      throw new InvalidQuantityError('Quantity must be positive');
    }
    this.id = id;
    this.productId = productId;
    this.productName = productName;
    this.unitPrice = unitPrice;
    this.quantity = quantity;
  }

  increaseQuantity(amount: number): void {
    if (amount <= 0) {
      throw new InvalidQuantityError('Amount must be positive');
    }
    this.quantity += amount;
  }

  getSubtotal(): Money {
    return this.unitPrice.multiply(this.quantity);
  }

  getId(): OrderItemId {
    return this.id;
  }

  getProductId(): ProductId {
    return this.productId;
  }
}
```

### 聚合设计原则

1. **小聚合原则**：聚合应该尽可能小，只包含必要的对象
2. **通过标识引用其他聚合**：不要在聚合内持有其他聚合的直接引用
3. **最终一致性**：跨聚合的业务规则可以通过领域事件实现最终一致性
4. **一个事务一个聚合**：避免在一个事务中修改多个聚合

```typescript
// 错误示例：聚合过大，直接引用其他聚合
class Order {
  private customer: Customer; // 错误：直接引用 Customer 聚合
  private products: Product[]; // 错误：直接引用 Product 聚合
}

// 正确示例：通过标识引用
class Order {
  private customerId: CustomerId; // 正确：通过 ID 引用
  private items: OrderItem[]; // 正确：OrderItem 包含 productId
}
```

---

## 领域服务（Domain Service）

### 什么是领域服务

领域服务封装不属于任何实体或值对象的领域逻辑。当一个操作：
- 涉及多个聚合
- 不自然地属于任何实体
- 是无状态的

就应该考虑使用领域服务。

### 领域服务示例

```typescript
// 订单定价服务
class OrderPricingService {
  constructor(
    private readonly discountPolicy: DiscountPolicy,
    private readonly taxCalculator: TaxCalculator
  ) {}

  // 计算订单最终价格（涉及折扣和税费计算）
  calculateFinalPrice(order: Order, customer: Customer): PriceBreakdown {
    const subtotal = order.getSubtotal();

    // 应用折扣策略
    const discount = this.discountPolicy.calculateDiscount(order, customer);
    const afterDiscount = subtotal.subtract(discount);

    // 计算税费
    const tax = this.taxCalculator.calculate(afterDiscount, order.getShippingAddress());

    // 返回价格明细
    return new PriceBreakdown(subtotal, discount, tax, afterDiscount.add(tax));
  }
}

// 库存分配服务
class InventoryAllocationService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly warehouseSelector: WarehouseSelector
  ) {}

  // 为订单分配库存（涉及多个仓库的协调）
  async allocateForOrder(order: Order): Promise<AllocationResult> {
    const allocations: InventoryAllocation[] = [];

    for (const item of order.getItems()) {
      const warehouses = await this.warehouseSelector.selectForProduct(
        item.getProductId(),
        item.getQuantity()
      );

      for (const warehouse of warehouses) {
        const inventory = await this.inventoryRepository.findByWarehouseAndProduct(
          warehouse.getId(),
          item.getProductId()
        );

        const allocated = inventory.allocate(item.getQuantity());
        allocations.push(allocated);

        await this.inventoryRepository.save(inventory);
      }
    }

    return new AllocationResult(order.getId(), allocations);
  }
}

// 订单转移服务
class OrderTransferService {
  constructor(
    private readonly orderRepository: OrderRepository
  ) {}

  // 转移订单所有权（涉及两个聚合：订单和客户）
  async transferOrder(
    orderId: OrderId,
    fromCustomerId: CustomerId,
    toCustomerId: CustomerId
  ): Promise<void> {
    const order = await this.orderRepository.findById(orderId);

    if (!order.getCustomerId().equals(fromCustomerId)) {
      throw new UnauthorizedOrderAccessError();
    }

    order.transferTo(toCustomerId);

    await this.orderRepository.save(order);
  }
}
```

### 领域服务 vs 应用服务

| 特征 | 领域服务 | 应用服务 |
|-----|---------|---------|
| 所在层 | 领域层 | 应用层 |
| 包含的逻辑 | 核心业务逻辑 | 用例编排、事务管理 |
| 依赖 | 只依赖领域对象 | 依赖领域对象和基础设施 |
| 状态 | 无状态 | 无状态 |
| 例子 | 定价计算、库存分配 | 创建订单用例、支付流程编排 |

---

## 仓储（Repository）模式

### 仓储的概念

仓储是聚合的持久化接口，为领域层提供类似集合的访问方式来获取和存储聚合。仓储封装了数据访问的具体实现，使领域层不依赖于持久化技术。

**仓储的核心职责：**

- 提供聚合的获取和存储
- 封装查询逻辑
- 保证聚合的完整性
- 隔离持久化技术

### 仓储接口设计

```typescript
// 仓储接口（定义在领域层）
interface OrderRepository {
  // 根据 ID 查找
  findById(id: OrderId): Promise<Order | null>;

  // 根据 ID 查找，不存在则抛出异常
  getById(id: OrderId): Promise<Order>;

  // 保存聚合
  save(order: Order): Promise<void>;

  // 删除聚合
  delete(order: Order): Promise<void>;

  // 检查是否存在
  exists(id: OrderId): Promise<boolean>;

  // 根据客户 ID 查找订单
  findByCustomerId(customerId: CustomerId): Promise<Order[]>;

  // 根据状态查找订单
  findByStatus(status: OrderStatus): Promise<Order[]>;

  // 生成新的订单 ID
  nextId(): OrderId;
}

// 仓储实现（基础设施层）
class PostgresOrderRepository implements OrderRepository {
  constructor(
    private readonly db: Database,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  async findById(id: OrderId): Promise<Order | null> {
    const row = await this.db.query(
      'SELECT * FROM orders WHERE id = $1',
      [id.getValue()]
    );

    if (!row) {
      return null;
    }

    const items = await this.db.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id.getValue()]
    );

    return this.mapToOrder(row, items);
  }

  async getById(id: OrderId): Promise<Order> {
    const order = await this.findById(id);
    if (!order) {
      throw new OrderNotFoundError(id);
    }
    return order;
  }

  async save(order: Order): Promise<void> {
    await this.db.transaction(async (tx) => {
      // 保存订单主表
      await tx.query(
        `INSERT INTO orders (id, customer_id, status, total_amount, shipping_address, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           status = $3, total_amount = $4, shipping_address = $5, updated_at = $7`,
        [
          order.getId().getValue(),
          order.getCustomerId().getValue(),
          order.getStatus(),
          order.getTotalAmount().getAmount(),
          JSON.stringify(order.getShippingAddress()),
          order.getCreatedAt(),
          order.getUpdatedAt()
        ]
      );

      // 删除旧的订单项
      await tx.query(
        'DELETE FROM order_items WHERE order_id = $1',
        [order.getId().getValue()]
      );

      // 插入新的订单项
      for (const item of order.getItems()) {
        await tx.query(
          `INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            item.getId().getValue(),
            order.getId().getValue(),
            item.getProductId().getValue(),
            item.getProductName(),
            item.getUnitPrice().getAmount(),
            item.getQuantity()
          ]
        );
      }
    });

    // 发布领域事件
    const events = order.pullDomainEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }
  }

  async delete(order: Order): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.query('DELETE FROM order_items WHERE order_id = $1', [order.getId().getValue()]);
      await tx.query('DELETE FROM orders WHERE id = $1', [order.getId().getValue()]);
    });
  }

  async exists(id: OrderId): Promise<boolean> {
    const result = await this.db.query(
      'SELECT 1 FROM orders WHERE id = $1',
      [id.getValue()]
    );
    return result !== null;
  }

  async findByCustomerId(customerId: CustomerId): Promise<Order[]> {
    const rows = await this.db.queryAll(
      'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
      [customerId.getValue()]
    );

    return Promise.all(rows.map(row => this.loadOrderWithItems(row)));
  }

  nextId(): OrderId {
    return OrderId.generate();
  }

  private async loadOrderWithItems(row: any): Promise<Order> {
    const items = await this.db.queryAll(
      'SELECT * FROM order_items WHERE order_id = $1',
      [row.id]
    );
    return this.mapToOrder(row, items);
  }

  private mapToOrder(row: any, itemRows: any[]): Order {
    // 将数据库行映射为领域对象
    const items = itemRows.map(itemRow => new OrderItem(
      new OrderItemId(itemRow.id),
      new ProductId(itemRow.product_id),
      itemRow.product_name,
      Money.of(itemRow.unit_price),
      itemRow.quantity
    ));

    return Order.reconstitute({
      id: new OrderId(row.id),
      customerId: new CustomerId(row.customer_id),
      status: row.status as OrderStatus,
      items,
      shippingAddress: Address.fromJson(row.shipping_address),
      totalAmount: Money.of(row.total_amount),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
```

---

## 工厂（Factory）模式

### 工厂的概念

工厂封装复杂对象的创建逻辑，使创建过程与使用过程分离。当对象创建逻辑复杂时，使用工厂可以保持领域对象的简洁。

### 工厂实现

```typescript
// 订单工厂
class OrderFactory {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly pricingService: OrderPricingService
  ) {}

  // 从购物车创建订单
  async createFromCart(
    cart: ShoppingCart,
    shippingAddress: Address
  ): Promise<Order> {
    // 生成订单 ID
    const orderId = this.orderRepository.nextId();

    // 创建订单
    const order = new Order({
      id: orderId,
      customerId: cart.getCustomerId(),
      shippingAddress
    });

    // 添加订单项
    for (const cartItem of cart.getItems()) {
      const product = await this.productRepository.getById(cartItem.getProductId());

      // 验证商品可购买
      if (!product.isAvailable()) {
        throw new ProductNotAvailableError(product.getId());
      }

      order.addItem(product, cartItem.getQuantity());
    }

    return order;
  }

  // 复制订单
  async cloneOrder(originalOrderId: OrderId): Promise<Order> {
    const original = await this.orderRepository.getById(originalOrderId);

    const newOrderId = this.orderRepository.nextId();
    const clonedOrder = new Order({
      id: newOrderId,
      customerId: original.getCustomerId(),
      shippingAddress: original.getShippingAddress()
    });

    // 复制订单项（需要检查商品是否仍然可用）
    for (const item of original.getItems()) {
      const product = await this.productRepository.findById(item.getProductId());

      if (product && product.isAvailable()) {
        clonedOrder.addItem(product, item.getQuantity());
      }
    }

    return clonedOrder;
  }
}

// 值对象工厂
class AddressFactory {
  // 从用户输入创建地址
  static createFromInput(input: AddressInput): Address {
    return new Address(
      input.province.trim(),
      input.city.trim(),
      input.district.trim(),
      input.street.trim(),
      input.zipCode.trim()
    );
  }

  // 从 GPS 坐标创建地址（调用地理编码服务）
  static async createFromCoordinates(
    latitude: number,
    longitude: number,
    geocodingService: GeocodingService
  ): Promise<Address> {
    const result = await geocodingService.reverseGeocode(latitude, longitude);

    return new Address(
      result.province,
      result.city,
      result.district,
      result.street,
      result.zipCode
    );
  }
}
```

---

## 领域事件（Domain Event）

### 领域事件的概念

领域事件表示领域中发生的有意义的业务事件。它是实现聚合间最终一致性和系统解耦的关键机制。

**领域事件的特征：**

- 表示已经发生的事实
- 不可变
- 包含事件发生的上下文信息
- 命名使用过去时态

### 领域事件实现

```typescript
// 领域事件基类
abstract class DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventType: string;

  constructor() {
    this.eventId = uuid();
    this.occurredOn = new Date();
    this.eventType = this.constructor.name;
  }

  abstract getAggregateId(): string;
}

// 订单已提交事件
class OrderSubmittedEvent extends DomainEvent {
  constructor(
    readonly orderId: OrderId,
    readonly customerId: CustomerId,
    readonly totalAmount: Money,
    readonly items: OrderItemSnapshot[]
  ) {
    super();
  }

  getAggregateId(): string {
    return this.orderId.getValue();
  }
}

// 订单已确认事件
class OrderConfirmedEvent extends DomainEvent {
  constructor(
    readonly orderId: OrderId,
    readonly confirmedAt: Date
  ) {
    super();
  }

  getAggregateId(): string {
    return this.orderId.getValue();
  }
}

// 订单已取消事件
class OrderCancelledEvent extends DomainEvent {
  constructor(
    readonly orderId: OrderId,
    readonly reason: CancellationReason,
    readonly cancelledBy: UserId
  ) {
    super();
  }

  getAggregateId(): string {
    return this.orderId.getValue();
  }
}

// 领域事件发布器
interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}

// 领域事件处理器
interface DomainEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

// 订单确认事件处理器：发送通知
class OrderConfirmedNotificationHandler implements DomainEventHandler<OrderConfirmedEvent> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly notificationService: NotificationService
  ) {}

  async handle(event: OrderConfirmedEvent): Promise<void> {
    const order = await this.orderRepository.getById(event.orderId);
    const customer = await this.customerRepository.getById(order.getCustomerId());

    await this.notificationService.send({
      to: customer.getEmail(),
      template: 'order-confirmed',
      data: {
        orderNumber: order.getOrderNumber(),
        confirmedAt: event.confirmedAt
      }
    });
  }
}

// 订单提交事件处理器：扣减库存
class OrderSubmittedInventoryHandler implements DomainEventHandler<OrderSubmittedEvent> {
  constructor(
    private readonly inventoryService: InventoryService
  ) {}

  async handle(event: OrderSubmittedEvent): Promise<void> {
    for (const item of event.items) {
      await this.inventoryService.reserve(
        item.productId,
        item.quantity,
        event.orderId
      );
    }
  }
}
```

---

## 规格（Specification）模式

### 规格模式的概念

规格模式封装业务规则，使规则可以组合、复用和测试。规格模式特别适合复杂的查询条件和业务验证。

### 规格模式实现

```typescript
// 规格接口
interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
  and(other: Specification<T>): Specification<T>;
  or(other: Specification<T>): Specification<T>;
  not(): Specification<T>;
}

// 规格基类
abstract class CompositeSpecification<T> implements Specification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  not(): Specification<T> {
    return new NotSpecification(this);
  }
}

// 组合规格
class AndSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

class OrSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

class NotSpecification<T> extends CompositeSpecification<T> {
  constructor(private readonly spec: Specification<T>) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate);
  }
}

// 订单规格实现
class OrderStatusSpecification extends CompositeSpecification<Order> {
  constructor(private readonly status: OrderStatus) {
    super();
  }

  isSatisfiedBy(order: Order): boolean {
    return order.getStatus() === this.status;
  }
}

class OrderMinAmountSpecification extends CompositeSpecification<Order> {
  constructor(private readonly minAmount: Money) {
    super();
  }

  isSatisfiedBy(order: Order): boolean {
    return order.getTotalAmount().isGreaterThanOrEqual(this.minAmount);
  }
}

class OrderCreatedWithinSpecification extends CompositeSpecification<Order> {
  constructor(private readonly days: number) {
    super();
  }

  isSatisfiedBy(order: Order): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.days);
    return order.getCreatedAt() >= cutoffDate;
  }
}

class CustomerOrderCountSpecification extends CompositeSpecification<Order> {
  constructor(
    private readonly customerId: CustomerId,
    private readonly orderRepository: OrderRepository
  ) {
    super();
  }

  async isSatisfiedBy(order: Order): Promise<boolean> {
    const orders = await this.orderRepository.findByCustomerId(this.customerId);
    return orders.length > 0;
  }
}

// 使用规格模式
class OrderQueryService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async findEligibleForPromotion(): Promise<Order[]> {
    const allOrders = await this.orderRepository.findAll();

    // 组合规格：已确认 + 金额大于100 + 最近30天内
    const spec = new OrderStatusSpecification(OrderStatus.CONFIRMED)
      .and(new OrderMinAmountSpecification(Money.of(100)))
      .and(new OrderCreatedWithinSpecification(30));

    return allOrders.filter(order => spec.isSatisfiedBy(order));
  }

  async findCancellableOrders(customerId: CustomerId): Promise<Order[]> {
    const orders = await this.orderRepository.findByCustomerId(customerId);

    // 可取消订单：待处理或已确认状态
    const spec = new OrderStatusSpecification(OrderStatus.PENDING)
      .or(new OrderStatusSpecification(OrderStatus.CONFIRMED));

    return orders.filter(order => spec.isSatisfiedBy(order));
  }
}
```

---

## 完整订单领域建模示例

### 领域模型结构

```
order-domain/
├── aggregates/
│   └── Order.ts              # 订单聚合根
├── entities/
│   └── OrderItem.ts          # 订单项实体
├── value-objects/
│   ├── OrderId.ts            # 订单ID
│   ├── Money.ts              # 金额
│   ├── Address.ts            # 地址
│   └── OrderStatus.ts        # 订单状态
├── domain-services/
│   ├── OrderPricingService.ts    # 定价服务
│   └── InventoryAllocationService.ts  # 库存分配服务
├── repositories/
│   └── OrderRepository.ts    # 仓储接口
├── factories/
│   └── OrderFactory.ts       # 订单工厂
├── events/
│   ├── OrderSubmittedEvent.ts
│   ├── OrderConfirmedEvent.ts
│   └── OrderCancelledEvent.ts
├── specifications/
│   ├── OrderStatusSpecification.ts
│   └── OrderAmountSpecification.ts
└── exceptions/
    ├── OrderNotFoundError.ts
    └── InvalidOrderStateError.ts
```

### 应用层集成

```typescript
// 应用服务：创建订单用例
class CreateOrderUseCase {
  constructor(
    private readonly orderFactory: OrderFactory,
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly unitOfWork: UnitOfWork
  ) {}

  async execute(command: CreateOrderCommand): Promise<CreateOrderResult> {
    return this.unitOfWork.execute(async () => {
      // 获取购物车
      const cart = await this.cartRepository.getByCustomerId(command.customerId);

      if (cart.isEmpty()) {
        throw new EmptyCartError();
      }

      // 创建地址值对象
      const shippingAddress = AddressFactory.createFromInput(command.shippingAddress);

      // 使用工厂创建订单
      const order = await this.orderFactory.createFromCart(cart, shippingAddress);

      // 提交订单
      order.submit();

      // 保存订单
      await this.orderRepository.save(order);

      // 清空购物车
      cart.clear();
      await this.cartRepository.save(cart);

      return new CreateOrderResult(
        order.getId(),
        order.getTotalAmount()
      );
    });
  }
}

// 应用服务：确认订单用例
class ConfirmOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository
  ) {}

  async execute(command: ConfirmOrderCommand): Promise<void> {
    const order = await this.orderRepository.getById(command.orderId);

    // 调用聚合根的业务方法
    order.confirm();

    // 保存（仓储会自动发布领域事件）
    await this.orderRepository.save(order);
  }
}
```

---

## 最佳实践与反模式

### 最佳实践

#### 保持聚合的小而精

```typescript
// 好的实践：小聚合，通过 ID 引用
class Order {
  private customerId: CustomerId;  // 引用，而非包含
  private items: OrderItem[];      // 只包含直接相关的对象
}

// 不好的实践：巨型聚合
class Order {
  private customer: Customer;      // 直接包含整个客户
  private products: Product[];     // 直接包含整个商品列表
  private warehouse: Warehouse;    // 直接包含仓库
}
```

#### 业务逻辑放在领域对象中

```typescript
// 好的实践：业务逻辑在实体中
class Order {
  cancel(reason: CancellationReason): void {
    if (!this.canBeCancelled()) {
      throw new InvalidOrderStateError();
    }
    this.status = OrderStatus.CANCELLED;
    this.cancellationReason = reason;
  }
}

// 不好的实践：贫血模型 + 服务中的逻辑
class Order {
  status: OrderStatus;  // 只有数据，没有行为
}

class OrderService {
  cancelOrder(order: Order, reason: string): void {
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      throw new Error('Cannot cancel');
    }
    order.status = 'cancelled';
    order.cancellationReason = reason;
  }
}
```

#### 值对象优先

```typescript
// 好的实践：使用值对象
class Order {
  private totalAmount: Money;        // 值对象
  private shippingAddress: Address;  // 值对象
  private orderId: OrderId;          // 值对象（强类型ID）
}

// 不好的实践：使用基本类型
class Order {
  private totalAmount: number;       // 失去了货币信息
  private shippingAddress: string;   // 失去了结构化信息
  private orderId: string;           // 容易与其他 ID 混淆
}
```

#### 显式表达业务规则

```typescript
// 好的实践：使用规格模式显式表达规则
const canShipSpec = new OrderPaidSpecification()
  .and(new InventoryAllocatedSpecification())
  .and(new NoDeliveryBlockSpecification());

if (canShipSpec.isSatisfiedBy(order)) {
  order.markReadyForShipment();
}

// 不好的实践：隐式规则散落在代码中
if (order.isPaid && order.inventoryAllocated && !order.hasDeliveryBlock) {
  order.status = 'ready_for_shipment';
}
```

### 常见反模式

#### 贫血领域模型

只有数据没有行为的实体，所有逻辑都在服务层。

```typescript
// 反模式：贫血模型
class Order {
  id: string;
  status: string;
  items: any[];
  // 只有 getter 和 setter
}

class OrderService {
  // 所有逻辑都在这里
  addItem(order: Order, item: any) { ... }
  submit(order: Order) { ... }
  cancel(order: Order) { ... }
}
```

#### 聚合边界不清晰

```typescript
// 反模式：边界不清晰，直接操作内部对象
class Order {
  public items: OrderItem[];  // 暴露内部集合
}

// 外部直接修改
order.items.push(new OrderItem(...));  // 绕过了聚合根
order.items[0].quantity = 10;          // 没有经过验证
```

#### 忽略不变式验证

```typescript
// 反模式：没有验证业务规则
class Order {
  addItem(item: OrderItem): void {
    this.items.push(item);  // 没有任何验证
  }
}

// 正确做法
class Order {
  addItem(product: Product, quantity: number): void {
    this.ensureOrderIsDraft();
    this.ensureNotExceedMaxItems();
    this.ensureQuantityValid(quantity);
    // ... 业务逻辑
  }
}
```

#### 过度使用领域事件

```typescript
// 反模式：事件粒度过细
class Order {
  setCustomerName(name: string) {
    this.customerName = name;
    this.addEvent(new CustomerNameChangedEvent(...));  // 过于琐碎
  }
}

// 正确做法：有意义的业务事件
class Order {
  submit() {
    // ... 业务逻辑
    this.addEvent(new OrderSubmittedEvent(...));  // 有业务意义
  }
}
```

---

## 面试要点

### 核心概念题

**Q1: 实体和值对象的区别是什么？如何选择？**

答：实体具有唯一标识，生命周期中标识不变，相等性由标识决定；值对象没有标识，相等性由所有属性决定，是不可变的。选择依据：如果需要跟踪对象的生命周期和状态变化，使用实体；如果只关心属性值，使用值对象。

**Q2: 什么是聚合？聚合根的作用是什么？**

答：聚合是一组相关对象的集合，定义了数据修改的边界和一致性边界。聚合根是聚合的入口点，外部只能通过聚合根访问和修改聚合内部对象，聚合根负责维护聚合的业务规则和不变式。

**Q3: 领域服务和应用服务有什么区别？**

答：领域服务封装不属于任何实体的核心业务逻辑，位于领域层，只依赖领域对象。应用服务编排用例流程，位于应用层，负责事务管理、安全验证等技术关注点，可以依赖基础设施。

### 设计题

**Q4: 设计一个电商订单系统的聚合边界**

答：
1. 订单聚合（Order Aggregate）
   - 聚合根：Order
   - 内部实体：OrderItem
   - 值对象：OrderId, Money, Address, OrderStatus

2. 设计原则：
   - 订单通过 CustomerId 引用客户，不包含 Customer
   - OrderItem 通过 ProductId 引用商品，不包含 Product
   - 一个事务只修改一个订单聚合

3. 跨聚合协调：
   - 使用领域事件实现最终一致性
   - OrderSubmittedEvent 触发库存扣减
   - OrderConfirmedEvent 触发通知发送

**Q5: 如何处理跨聚合的业务规则？**

答：
1. 如果规则是强一致性要求，考虑调整聚合边界
2. 如果可以接受最终一致性，使用领域事件
3. 使用领域服务协调多个聚合的读取和验证
4. 使用 Saga 模式处理长事务

### 实践题

**Q6: 如何避免贫血领域模型？**

答：
1. 将业务逻辑放在实体和值对象中
2. 使用有意义的方法名表达业务意图
3. 在构造函数中验证不变式
4. 隐藏内部状态，通过方法暴露行为
5. 使用规格模式封装复杂业务规则

**Q7: 仓储应该返回领域对象还是 DTO？**

答：仓储应该返回完整的领域对象（聚合根）。原因：
1. 仓储是领域层的接口，应该操作领域对象
2. DTO 转换应该在应用层或表示层进行
3. 领域对象包含业务行为，DTO 只是数据载体

### 场景题

**Q8: 订单确认时需要验证库存充足，如何设计？**

```typescript
// 方案一：应用层协调
class ConfirmOrderUseCase {
  async execute(orderId: OrderId): Promise<void> {
    const order = await this.orderRepository.getById(orderId);

    // 使用领域服务验证库存
    const isAvailable = await this.inventoryService.checkAvailability(
      order.getItems()
    );

    if (!isAvailable) {
      throw new InsufficientInventoryError();
    }

    order.confirm();
    await this.orderRepository.save(order);
  }
}

// 方案二：使用规格模式
class InventoryAvailableSpecification {
  constructor(private inventoryService: InventoryService) {}

  async isSatisfiedBy(order: Order): Promise<boolean> {
    return this.inventoryService.checkAvailability(order.getItems());
  }
}
```

---

## 总结

DDD 战术设计模式是将业务逻辑转化为高质量代码的强大工具。通过合理运用实体、值对象、聚合、领域服务、仓储、工厂、领域事件和规格模式，我们可以构建出既能准确表达业务意图、又具有良好可维护性的软件系统。

关键要点：
1. **实体**表达有生命周期的业务对象
2. **值对象**封装无标识的概念
3. **聚合**定义一致性边界
4. **领域服务**处理跨实体的业务逻辑
5. **仓储**隔离持久化技术
6. **工厂**封装复杂创建逻辑
7. **领域事件**实现解耦和最终一致性
8. **规格**显式表达业务规则

掌握这些模式需要大量实践，建议从小型项目开始，逐步在真实业务场景中应用和深化理解。
