---
title: 领域驱动设计完全指南
description: 掌握 DDD，用于复杂业务领域建模
track: architecture
section: ddd
difficulty: advanced
tags:
  - DDD
  - Domain
  - Architecture
  - Modeling
status: imported
origin: old/src/content/docs/architecture/domain-driven-design.zh.md
divergence: 0.212
issues: []
legacy:
  category: Architecture
  subcategory: DDD
  order: 6
  lastUpdated: 2026-01-07
---

## 什么是领域驱动设计？

领域驱动设计（Domain-Driven Design，DDD）是一种软件开发方法论，由 Eric Evans 在其 2003 年的经典著作《领域驱动设计：软件核心复杂性应对之道》中首次系统性地提出。它不仅仅是一套技术框架或设计模式，而是一种将业务领域置于开发工作核心的软件设计哲学。

### 核心理念

DDD 的核心前提是：**软件的复杂性来源于业务领域本身，而非技术实现**。因此，开发团队应该将主要精力投入到理解和建模业务领域上，确保代码结构直接反映业务概念和规则。

### DDD 解决的问题

1. **业务与技术的鸿沟**：业务相关方和技术团队常常使用不同的语言，导致需求理解偏差
2. **软件腐化**：随着业务演进，代码结构逐渐与业务逻辑脱节
3. **复杂性失控**：在大型系统中，模块边界不清晰导致高度耦合
4. **知识流失**：业务知识分散在代码各处，新成员难以理解系统

### DDD 的两大支柱

DDD 在两个层面运作：

- **战略设计**：关注如何划分系统边界、识别核心领域以及建立团队协作模式
- **战术设计**：关注如何在代码层面实现领域模型，包括实体、值对象、聚合等构建块

---

## 通用语言

通用语言是 DDD 的基础，贯穿整个设计过程。

### 什么是通用语言？

通用语言是由领域专家和开发团队在特定限界上下文内共同创建的精确术语体系。这种语言：

- 出现在需求文档中
- 出现在代码命名中
- 出现在团队沟通中
- 出现在用户界面中

### 为什么通用语言重要

```
业务相关方说："当用户下单时，系统应该冻结库存"
开发人员理解："好的，我把 stock 字段减 1"

// 这就是语言不一致导致的问题！
// "冻结库存" != "减少库存"
// 冻结意味着预留——库存还在但不可售卖
```

### 如何建立通用语言

1. **与领域专家紧密协作**：不要闭门造车
2. **记录术语表**：维护领域词汇表
3. **代码即文档**：代码命名必须使用通用语言
4. **持续演进**：语言随着理解的深入而演化

```typescript
// 不好的示例：技术命名
class DataManager {
  updateRecord(id: string, data: object) {}
  deleteRecord(id: string) {}
}

// 好的示例：使用通用语言
class OrderService {
  placeOrder(customerId: string, items: OrderItem[]) {}
  cancelOrder(orderId: string, reason: CancellationReason) {}
}
```

---

## 限界上下文

限界上下文是 DDD 战略设计中最重要的概念。它定义了一个模型的适用边界——在这个边界内，通用语言保持一致。

### 为什么需要限界上下文？

同一个术语在不同业务场景中可能有不同的含义：

```
"产品"在不同上下文中的含义：

产品目录上下文：
- 名称、描述、图片、分类、规格

库存上下文：
- SKU、库存数量、仓库位置

订单上下文：
- 购买数量、单价、折扣

物流上下文：
- 重量、尺寸、包装方式
```

### 限界上下文的边界

每个限界上下文应该：

1. **拥有自己的代码库或模块**
2. **拥有自己的数据存储**
3. **有明确的团队负责人**
4. **定义清晰的对外接口**

```typescript
// 目录上下文中的产品
namespace CatalogContext {
  interface Product {
    id: string;
    name: string;
    description: string;
    images: string[];
    category: Category;
    specifications: Specification[];
  }
}

// 库存上下文中的产品（这里更适合叫 StockItem）
namespace InventoryContext {
  interface StockItem {
    sku: string;
    productId: string; // 引用目录上下文的产品 ID
    quantity: number;
    warehouseId: string;
    reorderPoint: number;
  }
}
```

### 上下文映射

上下文映射描述了不同限界上下文之间的关系和集成模式。

#### 常见的上下文映射模式

##### 合作关系（Partnership）

两个团队共同成功或失败，需要紧密协作。

```
订单上下文 <--合作关系--> 库存上下文
双方需要同步接口设计，确保订单流程顺畅
```

##### 共享内核（Shared Kernel）

两个上下文共享一部分模型代码。

```typescript
// shared-kernel/money.ts
// 被多个上下文共享的值对象
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: Currency
  ) {}

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Currency mismatch');
    }
    return new Money(this.amount + other.amount, this.currency);
  }
}
```

##### 客户-供应商（Customer-Supplier）

上游供应商提供服务，下游客户消费服务。

```
支付上下文（供应商） --> 订单上下文（客户）
订单上下文依赖支付上下文提供的支付能力
```

##### 遵奉者（Conformist）

下游完全遵从上游的模型，没有任何转换层。

```
当集成第三方支付 API 时，我们可能选择直接使用其数据结构
```

##### 防腐层（Anti-Corruption Layer，ACL）

下游创建一个转换层来隔离上游模型的影响。

```typescript
// 防腐层示例：隔离第三方物流 API
class LogisticsAntiCorruptionLayer {
  constructor(private thirdPartyClient: ThirdPartyLogisticsClient) {}

  // 将第三方 API 的数据结构转换为我们的领域模型
  async getShipmentStatus(orderId: string): Promise<ShipmentStatus> {
    const externalStatus = await this.thirdPartyClient.queryStatus(orderId);

    // 将第三方状态码转换为我们的领域概念
    return this.translateStatus(externalStatus);
  }

  private translateStatus(external: ExternalStatus): ShipmentStatus {
    const statusMap: Record<string, ShipmentStatus> = {
      'PICKED_UP': ShipmentStatus.InTransit,
      'IN_TRANSIT': ShipmentStatus.InTransit,
      'OUT_FOR_DELIVERY': ShipmentStatus.OutForDelivery,
      'DELIVERED': ShipmentStatus.Delivered,
      'FAILED': ShipmentStatus.DeliveryFailed,
    };
    return statusMap[external.code] ?? ShipmentStatus.Unknown;
  }
}
```

##### 开放主机服务（Open Host Service，OHS）

上游提供标准化的协议/API 供多个下游消费。

```typescript
// 开放主机服务：提供标准化的 REST API
@Controller('/api/v1/products')
class ProductCatalogAPI {
  @Get('/:id')
  async getProduct(@Param('id') id: string): Promise<ProductDTO> {
    const product = await this.productService.findById(id);
    return this.toDTO(product);
  }

  @Get('/')
  async searchProducts(@Query() query: SearchQuery): Promise<ProductDTO[]> {
    // 提供标准化的搜索接口
  }
}
```

##### 发布语言（Published Language）

定义标准化的数据交换格式。

```typescript
// 发布语言：定义标准事件格式
interface OrderPlacedEvent {
  eventType: 'ORDER_PLACED';
  eventVersion: '1.0';
  timestamp: string;
  payload: {
    orderId: string;
    customerId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: Money;
    }>;
    totalAmount: Money;
  };
}
```

---

## 实体与值对象

### 实体（Entity）

实体是具有唯一标识的领域对象，其标识在整个生命周期内保持不变。

```typescript
// 实体的特征：
// 1. 有唯一标识
// 2. 有生命周期
// 3. 状态可变

class Order {
  private _id: OrderId;
  private _status: OrderStatus;
  private _items: OrderItem[];
  private _placedAt: Date;
  private _customerId: CustomerId;

  constructor(
    id: OrderId,
    customerId: CustomerId,
    items: OrderItem[]
  ) {
    this._id = id;
    this._customerId = customerId;
    this._items = items;
    this._status = OrderStatus.Pending;
    this._placedAt = new Date();

    this.validate();
  }

  get id(): OrderId {
    return this._id;
  }

  get totalAmount(): Money {
    return this._items.reduce(
      (sum, item) => sum.add(item.subtotal),
      Money.zero('USD')
    );
  }

  // 实体行为方法，封装业务规则
  confirm(): void {
    if (this._status !== OrderStatus.Pending) {
      throw new DomainError('Only pending orders can be confirmed');
    }
    this._status = OrderStatus.Confirmed;
    // 可以发布领域事件
  }

  cancel(reason: CancellationReason): void {
    if (this._status === OrderStatus.Shipped) {
      throw new DomainError('Shipped orders cannot be cancelled');
    }
    this._status = OrderStatus.Cancelled;
  }

  // 实体相等性基于 ID
  equals(other: Order): boolean {
    return this._id.equals(other._id);
  }

  private validate(): void {
    if (this._items.length === 0) {
      throw new DomainError('Order must contain at least one item');
    }
  }
}
```

### 值对象（Value Object）

值对象没有唯一标识，由其属性值定义。它是不可变的。

```typescript
// 值对象的特征：
// 1. 没有唯一标识
// 2. 不可变
// 3. 相等性由属性值决定
// 4. 可替换

class Money {
  constructor(
    private readonly _amount: number,
    private readonly _currency: Currency
  ) {
    if (_amount < 0) {
      throw new DomainError('Amount cannot be negative');
    }
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): Currency {
    return this._currency;
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount + other._amount, this._currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this._amount - other._amount;
    if (result < 0) {
      throw new DomainError('Insufficient balance');
    }
    return new Money(result, this._currency);
  }

  multiply(factor: number): Money {
    return new Money(this._amount * factor, this._currency);
  }

  // 值对象相等性基于属性值
  equals(other: Money): boolean {
    return this._amount === other._amount &&
           this._currency === other._currency;
  }

  static zero(currency: Currency): Money {
    return new Money(0, currency);
  }

  private ensureSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new DomainError('Currency mismatch');
    }
  }
}

// 另一个值对象示例：地址
class Address {
  constructor(
    public readonly street: string,
    public readonly city: string,
    public readonly state: string,
    public readonly zipCode: string,
    public readonly country: string
  ) {
    this.validate();
  }

  get fullAddress(): string {
    return `${this.street}, ${this.city}, ${this.state} ${this.zipCode}, ${this.country}`;
  }

  equals(other: Address): boolean {
    return this.street === other.street &&
           this.city === other.city &&
           this.state === other.state &&
           this.zipCode === other.zipCode &&
           this.country === other.country;
  }

  // 值对象是不可变的；修改返回新实例
  withStreet(newStreet: string): Address {
    return new Address(
      newStreet,
      this.city,
      this.state,
      this.zipCode,
      this.country
    );
  }

  private validate(): void {
    if (!this.city || !this.country) {
      throw new DomainError('City and country are required');
    }
  }
}
```

---

## 聚合

聚合是一组相关对象的集合，作为数据修改的单元。聚合有一个聚合根，外部通过聚合根访问聚合内的对象。

```typescript
// 聚合设计原则：
// 1. 聚合根是唯一入口
// 2. 聚合维护内部一致性
// 3. 聚合之间通过 ID 引用
// 4. 一个事务只修改一个聚合

// 订单聚合
class Order {  // 聚合根
  private readonly _id: OrderId;
  private readonly _customerId: CustomerId; // 跨聚合引用使用 ID
  private _items: OrderItem[]; // 聚合内部对象
  private _status: OrderStatus;
  private _shippingAddress: Address;
  private readonly _events: DomainEvent[] = [];

  constructor(props: OrderProps) {
    this._id = props.id;
    this._customerId = props.customerId;
    this._items = props.items;
    this._shippingAddress = props.shippingAddress;
    this._status = OrderStatus.Draft;
  }

  // 通过聚合根操作内部对象
  addItem(productId: ProductId, quantity: number, unitPrice: Money): void {
    if (this._status !== OrderStatus.Draft) {
      throw new DomainError('Only draft orders can have items added');
    }

    const existingItem = this._items.find(
      item => item.productId.equals(productId)
    );

    if (existingItem) {
      existingItem.increaseQuantity(quantity);
    } else {
      this._items.push(new OrderItem(productId, quantity, unitPrice));
    }
  }

  removeItem(productId: ProductId): void {
    if (this._status !== OrderStatus.Draft) {
      throw new DomainError('Only draft orders can have items removed');
    }

    this._items = this._items.filter(
      item => !item.productId.equals(productId)
    );
  }

  // 业务行为
  place(): void {
    if (this._items.length === 0) {
      throw new DomainError('Order cannot be empty');
    }

    if (this._status !== OrderStatus.Draft) {
      throw new DomainError('Only draft orders can be placed');
    }

    this._status = OrderStatus.Placed;

    // 发布领域事件
    this._events.push(new OrderPlacedEvent({
      orderId: this._id,
      customerId: this._customerId,
      items: this._items.map(item => item.toSnapshot()),
      totalAmount: this.totalAmount,
      occurredAt: new Date()
    }));
  }

  get domainEvents(): DomainEvent[] {
    return [...this._events];
  }

  clearEvents(): void {
    this._events.length = 0;
  }
}

// 聚合内的实体
class OrderItem {
  private readonly _productId: ProductId;
  private _quantity: number;
  private readonly _unitPrice: Money;

  constructor(productId: ProductId, quantity: number, unitPrice: Money) {
    this._productId = productId;
    this._quantity = quantity;
    this._unitPrice = unitPrice;
    this.validate();
  }

  get productId(): ProductId {
    return this._productId;
  }

  get subtotal(): Money {
    return this._unitPrice.multiply(this._quantity);
  }

  increaseQuantity(amount: number): void {
    this._quantity += amount;
    this.validate();
  }

  toSnapshot(): OrderItemSnapshot {
    return {
      productId: this._productId.value,
      quantity: this._quantity,
      unitPrice: this._unitPrice.amount,
      currency: this._unitPrice.currency
    };
  }

  private validate(): void {
    if (this._quantity <= 0) {
      throw new DomainError('Item quantity must be greater than 0');
    }
    if (this._quantity > 99) {
      throw new DomainError('Item quantity cannot exceed 99');
    }
  }
}
```

### 聚合设计指南

1. **保持聚合小巧**：过大的聚合导致并发问题和性能问题
2. **通过 ID 引用其他聚合**：永远不要持有对其他聚合根的直接引用
3. **一个事务一个聚合**：聚合之间使用最终一致性
4. **围绕不变量设计**：聚合边界应包含强制执行业务规则所需的所有对象

```typescript
// 不好：聚合太大
class Customer {
  orders: Order[];       // 客户可能有数千个订单
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  reviews: Review[];
}

// 好：小聚合通过 ID 引用
class Customer {
  id: CustomerId;
  name: string;
  defaultAddressId: AddressId;
}

class Order {
  customerId: CustomerId; // 通过 ID 引用
}
```

---

## 领域事件

领域事件表示在领域中发生的业务事件。它们用于实现聚合之间的最终一致性。

```typescript
// 领域事件基类
abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public abstract readonly eventType: string;

  constructor() {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date();
  }
}

// 具体领域事件
class OrderPlacedEvent extends DomainEvent {
  public readonly eventType = 'ORDER_PLACED';

  constructor(
    public readonly orderId: OrderId,
    public readonly customerId: CustomerId,
    public readonly items: OrderItemSnapshot[],
    public readonly totalAmount: Money
  ) {
    super();
  }
}

class OrderShippedEvent extends DomainEvent {
  public readonly eventType = 'ORDER_SHIPPED';

  constructor(
    public readonly orderId: OrderId,
    public readonly trackingNumber: string,
    public readonly carrier: string
  ) {
    super();
  }
}

// 事件处理器
class InventoryEventHandler {
  constructor(private inventoryService: InventoryService) {}

  @EventHandler(OrderPlacedEvent)
  async onOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    // 扣减库存
    for (const item of event.items) {
      await this.inventoryService.deductStock(
        new ProductId(item.productId),
        item.quantity
      );
    }
  }
}

class NotificationEventHandler {
  constructor(private notificationService: NotificationService) {}

  @EventHandler(OrderShippedEvent)
  async onOrderShipped(event: OrderShippedEvent): Promise<void> {
    // 发送发货通知
    await this.notificationService.sendShipmentNotification(
      event.orderId,
      event.trackingNumber
    );
  }
}
```

### 领域事件的好处

1. **解耦**：生产者和消费者松散耦合
2. **可审计性**：事件提供自然的审计跟踪
3. **可扩展性**：支持异步处理和微服务通信
4. **最终一致性**：允许跨聚合边界的一致性

---

## 战略设计 vs 战术设计

### 战略设计

战略设计关注系统的宏观架构，帮助我们理解业务全景并合理划分系统边界。

#### 领域和子域

领域是软件旨在解决的业务问题空间。复杂的领域可以分解为多个子域：

##### 核心域（Core Domain）

业务的核心竞争优势；应该投入最多精力的地方。

```
对于电商平台，核心域可能是：
- 个性化推荐系统
- 智能定价策略
- 供应链优化
```

##### 支撑子域（Supporting Subdomain）

支持核心业务运作，但不是竞争优势。

```
电商支撑子域：
- 订单管理
- 库存管理
- 物流跟踪
```

##### 通用子域（Generic Subdomain）

通用功能，可以使用现成解决方案。

```
电商通用子域：
- 用户认证
- 支付网关
- 短信/邮件通知
```

### 战术设计

战术设计提供在代码层面实现领域模型的构建块：

| 构建块 | 用途 |
|----------------|---------|
| 实体 | 具有唯一标识和生命周期的对象 |
| 值对象 | 由属性定义的不可变对象 |
| 聚合 | 带根的一致性边界 |
| 领域事件 | 发生的重要事情的记录 |
| 仓储 | 聚合持久化的类集合接口 |
| 工厂 | 封装复杂对象创建 |
| 领域服务 | 不属于任何实体的操作 |

---

## 实现示例

### 完整的订单领域模型

```typescript
// ==================== 值对象 ====================

class OrderId {
  constructor(public readonly value: string) {
    if (!value || value.trim() === '') {
      throw new DomainError('OrderId cannot be empty');
    }
  }

  equals(other: OrderId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {}

  static create(amount: number, currency: string): Money {
    if (amount < 0) {
      throw new DomainError('Amount cannot be negative');
    }
    if (!['USD', 'EUR', 'GBP'].includes(currency)) {
      throw new DomainError('Unsupported currency');
    }
    return new Money(amount, currency);
  }

  static zero(currency: string): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new DomainError('Currency mismatch');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(
      Math.round(this.amount * factor * 100) / 100,
      this.currency
    );
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}

// ==================== 聚合根 ====================

enum OrderStatus {
  Draft = 'DRAFT',
  Placed = 'PLACED',
  Paid = 'PAID',
  Shipped = 'SHIPPED',
  Delivered = 'DELIVERED',
  Cancelled = 'CANCELLED'
}

class Order {
  private readonly _id: OrderId;
  private readonly _customerId: string;
  private _items: OrderItem[] = [];
  private _status: OrderStatus;
  private _shippingAddress: Address | null = null;
  private readonly _createdAt: Date;
  private _events: DomainEvent[] = [];

  private constructor(props: {
    id: OrderId;
    customerId: string;
    status: OrderStatus;
    createdAt: Date;
    items?: OrderItem[];
    shippingAddress?: Address;
  }) {
    this._id = props.id;
    this._customerId = props.customerId;
    this._status = props.status;
    this._createdAt = props.createdAt;
    this._items = props.items ?? [];
    this._shippingAddress = props.shippingAddress ?? null;
  }

  // 创建新订单的工厂方法
  static create(id: OrderId, customerId: string): Order {
    const order = new Order({
      id,
      customerId,
      status: OrderStatus.Draft,
      createdAt: new Date()
    });

    order.addEvent(new OrderCreatedEvent(id, customerId));
    return order;
  }

  // 从持久化重建
  static reconstitute(props: OrderSnapshot): Order {
    return new Order({
      id: new OrderId(props.id),
      customerId: props.customerId,
      status: props.status as OrderStatus,
      createdAt: new Date(props.createdAt),
      items: props.items.map(i => OrderItem.reconstitute(i)),
      shippingAddress: props.shippingAddress
        ? new Address(
            props.shippingAddress.street,
            props.shippingAddress.city,
            props.shippingAddress.state,
            props.shippingAddress.zipCode,
            props.shippingAddress.country
          )
        : undefined
    });
  }

  get id(): OrderId {
    return this._id;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get totalAmount(): Money {
    return this._items.reduce(
      (sum, item) => sum.add(item.subtotal),
      Money.zero('USD')
    );
  }

  get itemCount(): number {
    return this._items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // 业务行为
  addItem(productId: string, productName: string, quantity: number, unitPrice: Money): void {
    this.ensureCanModify();

    const existingItem = this._items.find(i => i.productId === productId);
    if (existingItem) {
      existingItem.addQuantity(quantity);
    } else {
      this._items.push(OrderItem.create(productId, productName, quantity, unitPrice));
    }
  }

  removeItem(productId: string): void {
    this.ensureCanModify();
    this._items = this._items.filter(i => i.productId !== productId);
  }

  setShippingAddress(address: Address): void {
    this.ensureCanModify();
    this._shippingAddress = address;
  }

  place(): void {
    this.ensureCanModify();

    if (this._items.length === 0) {
      throw new DomainError('Order must contain at least one item');
    }

    if (!this._shippingAddress) {
      throw new DomainError('Shipping address is required');
    }

    this._status = OrderStatus.Placed;
    this.addEvent(new OrderPlacedEvent(
      this._id,
      this._customerId,
      this._items.map(i => i.toSnapshot()),
      this.totalAmount
    ));
  }

  markAsPaid(paymentId: string): void {
    if (this._status !== OrderStatus.Placed) {
      throw new DomainError('Only placed orders can be marked as paid');
    }

    this._status = OrderStatus.Paid;
    this.addEvent(new OrderPaidEvent(this._id, paymentId, this.totalAmount));
  }

  ship(trackingNumber: string, carrier: string): void {
    if (this._status !== OrderStatus.Paid) {
      throw new DomainError('Only paid orders can be shipped');
    }

    this._status = OrderStatus.Shipped;
    this.addEvent(new OrderShippedEvent(this._id, trackingNumber, carrier));
  }

  cancel(reason: string): void {
    if (this._status === OrderStatus.Shipped || this._status === OrderStatus.Delivered) {
      throw new DomainError('Shipped or delivered orders cannot be cancelled');
    }

    if (this._status === OrderStatus.Cancelled) {
      throw new DomainError('Order is already cancelled');
    }

    this._status = OrderStatus.Cancelled;
    this.addEvent(new OrderCancelledEvent(this._id, reason));
  }

  // 领域事件
  get domainEvents(): DomainEvent[] {
    return [...this._events];
  }

  clearEvents(): void {
    this._events = [];
  }

  private addEvent(event: DomainEvent): void {
    this._events.push(event);
  }

  private ensureCanModify(): void {
    if (this._status !== OrderStatus.Draft) {
      throw new DomainError('Only draft orders can be modified');
    }
  }

  // 持久化快照
  toSnapshot(): OrderSnapshot {
    return {
      id: this._id.value,
      customerId: this._customerId,
      status: this._status,
      items: this._items.map(i => i.toSnapshot()),
      shippingAddress: this._shippingAddress ? {
        street: this._shippingAddress.street,
        city: this._shippingAddress.city,
        state: this._shippingAddress.state,
        zipCode: this._shippingAddress.zipCode,
        country: this._shippingAddress.country
      } : null,
      totalAmount: this.totalAmount.amount,
      currency: this.totalAmount.currency,
      createdAt: this._createdAt.toISOString()
    };
  }
}

// ==================== 仓储 ====================

interface OrderRepository {
  findById(id: OrderId): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  save(order: Order): Promise<void>;
  delete(id: OrderId): Promise<void>;
  nextId(): OrderId;
}

class PostgresOrderRepository implements OrderRepository {
  constructor(
    private db: Database,
    private eventBus: EventBus
  ) {}

  async findById(id: OrderId): Promise<Order | null> {
    const row = await this.db.query(
      'SELECT * FROM orders WHERE id = $1',
      [id.value]
    );

    if (!row) return null;

    const items = await this.db.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id.value]
    );

    return this.toDomain(row, items);
  }

  async save(order: Order): Promise<void> {
    const snapshot = order.toSnapshot();

    await this.db.transaction(async (tx) => {
      await tx.query(`
        INSERT INTO orders (id, customer_id, status, shipping_address, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          status = $3,
          shipping_address = $4
      `, [
        snapshot.id,
        snapshot.customerId,
        snapshot.status,
        JSON.stringify(snapshot.shippingAddress),
        snapshot.createdAt
      ]);

      await tx.query('DELETE FROM order_items WHERE order_id = $1', [snapshot.id]);
      for (const item of snapshot.items) {
        await tx.query(`
          INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, currency)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [snapshot.id, item.productId, item.productName, item.quantity, item.unitPrice, item.currency]);
      }
    });

    // 发布领域事件
    for (const event of order.domainEvents) {
      await this.eventBus.publish(event);
    }
    order.clearEvents();
  }

  nextId(): OrderId {
    return new OrderId(crypto.randomUUID());
  }
}

// ==================== 应用服务 ====================

class OrderApplicationService {
  constructor(
    private orderRepository: OrderRepository,
    private productService: ProductService,
    private eventBus: EventBus
  ) {}

  async createOrder(command: CreateOrderCommand): Promise<string> {
    const orderId = this.orderRepository.nextId();
    const order = Order.create(orderId, command.customerId);

    for (const item of command.items) {
      const product = await this.productService.getProduct(item.productId);
      order.addItem(
        product.id,
        product.name,
        item.quantity,
        Money.create(product.price, 'USD')
      );
    }

    order.setShippingAddress(new Address(
      command.shippingAddress.street,
      command.shippingAddress.city,
      command.shippingAddress.state,
      command.shippingAddress.zipCode,
      command.shippingAddress.country
    ));

    await this.orderRepository.save(order);
    await this.publishEvents(order);

    return orderId.value;
  }

  async placeOrder(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(new OrderId(orderId));
    if (!order) {
      throw new ApplicationError('Order not found');
    }

    order.place();

    await this.orderRepository.save(order);
    await this.publishEvents(order);
  }

  async cancelOrder(orderId: string, reason: string): Promise<void> {
    const order = await this.orderRepository.findById(new OrderId(orderId));
    if (!order) {
      throw new ApplicationError('Order not found');
    }

    order.cancel(reason);

    await this.orderRepository.save(order);
    await this.publishEvents(order);
  }

  private async publishEvents(order: Order): Promise<void> {
    for (const event of order.domainEvents) {
      await this.eventBus.publish(event);
    }
    order.clearEvents();
  }
}
```

---

## 事件风暴

事件风暴是由 Alberto Brandolini 创建的协作领域建模技术。它通过识别领域事件来探索业务流程。

### 事件风暴流程

#### 阶段 1：混沌探索

在橙色便利贴上写下所有能想到的领域事件（过去式动词短语）：

```
- 订单已创建（OrderCreated）
- 订单已确认（OrderConfirmed）
- 付款已完成（PaymentCompleted）
- 库存已扣减（InventoryDeducted）
- 订单已发货（OrderShipped）
- 订单已送达（OrderDelivered）
- 退款已申请（RefundRequested）
- 退款已完成（RefundCompleted）
```

#### 阶段 2：时间线排列

按时间顺序排列事件，形成业务流程：

```
OrderCreated -> InventoryReserved -> PaymentCompleted -> InventoryDeducted -> OrderConfirmed -> OrderShipped -> OrderDelivered
                                           |
                                    PaymentFailed -> InventoryReleased -> OrderCancelled
```

#### 阶段 3：识别命令和聚合

蓝色便利贴代表命令（触发事件的动作）；黄色便利贴代表聚合：

```
[用户] --下单--> [订单] --订单已创建-->
[用户] --付款--> [支付] --付款已完成-->
[系统] --扣减库存--> [库存] --库存已扣减-->
```

#### 阶段 4：识别限界上下文

根据聚合关系划分限界上下文：

```
+-------------------+  +-------------------+  +-------------------+
|    订单上下文     |  |    支付上下文     |  |    库存上下文     |
|                   |  |                   |  |                   |
| - Order           |  | - Payment         |  | - Inventory       |
| - OrderItem       |  | - PaymentMethod   |  | - StockItem       |
| - ShippingInfo    |  | - Transaction     |  | - Warehouse       |
+-------------------+  +-------------------+  +-------------------+
```

---

## 常见陷阱

### 贫血领域模型

将领域对象视为纯数据载体，所有业务逻辑放在服务层。

```typescript
// 错误：贫血模型
class Order {
  id: string;
  status: string;
  items: OrderItem[];
}

class OrderService {
  placeOrder(order: Order) {
    if (order.items.length === 0) {
      throw new Error('Order cannot be empty');
    }
    order.status = 'PLACED';
    this.repository.save(order);
  }
}

// 正确：充血模型
class Order {
  private _status: OrderStatus;
  private _items: OrderItem[];

  place(): void {
    if (this._items.length === 0) {
      throw new DomainError('Order cannot be empty');
    }
    this._status = OrderStatus.Placed;
  }
}
```

### 聚合过大

在同一个聚合中放置太多实体，导致并发冲突和性能问题。

```typescript
// 错误：聚合太大
class Customer {
  orders: Order[];       // 客户可能有数千个订单
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  reviews: Review[];
}

// 正确：小聚合通过 ID 引用
class Customer {
  id: CustomerId;
  name: string;
  defaultAddressId: AddressId;
}

class Order {
  customerId: CustomerId; // 通过 ID 引用
}
```

### 忽视限界上下文

在不同上下文中使用相同的模型，导致模型过于复杂。

```typescript
// 错误：一个 Product 模型试图满足所有场景
class Product {
  // 目录属性
  name: string;
  description: string;
  images: string[];

  // 库存属性
  stockQuantity: number;
  warehouseId: string;

  // 物流属性
  weight: number;
  dimensions: Dimensions;

  // 财务属性
  costPrice: Money;
  salesPrice: Money;
}

// 正确：每个上下文有自己的模型
// catalog-context/product.ts
class CatalogProduct { ... }

// inventory-context/stock-item.ts
class StockItem { ... }

// shipping-context/shipment-item.ts
class ShipmentItem { ... }
```

### 过度工程

在简单的 CRUD 场景中强行使用所有 DDD 模式。

```typescript
// 对于简单的配置管理，DDD 是过度设计
// 简单的 CRUD 就足够了

// 只在核心域使用完整的 DDD 模式
```

### 技术驱动而非业务驱动

先设计技术架构，然后将业务逻辑塞入其中。

```
错误的方法：
1. 决定使用微服务架构
2. 设计数据库表
3. 编写 CRUD API
4. 添加业务逻辑

正确的方法：
1. 理解业务领域
2. 构建领域模型
3. 划分限界上下文
4. 选择适当的技术实现
```

---

## 最佳实践

### 从核心域开始

将 DDD 投入集中在核心域；支撑域可以简化处理。

### 持续演进领域模型

领域模型不是一次设计完成的；需要随着业务理解的深入持续重构。

### 保持聚合小而专注

- 优先使用小聚合
- 使用领域事件在聚合之间实现最终一致性
- 一个事务只应修改一个聚合

### 复杂创建逻辑使用工厂

当聚合创建涉及复杂逻辑时，使用工厂模式。

### 使用领域事件解耦

使用领域事件而非直接调用来实现限界上下文之间的松耦合。

### 分层架构

```
+--------------------------------------------------+
|                    用户界面                       |
+--------------------------------------------------+
|                    应用层                         |
|  （编排用例、事务、DTO）                          |
+--------------------------------------------------+
|                    领域层                         |
| （实体、值对象、聚合、事件）                      |
+--------------------------------------------------+
|                   基础设施层                      |
| （仓储、外部服务、持久化）                        |
+--------------------------------------------------+
```

---

## 面试要点

### Q1：什么是领域驱动设计？它解决什么问题？

**答案**：领域驱动设计是一种以业务领域为中心的软件设计方法论。它解决的核心问题是复杂软件系统中业务逻辑与技术实现之间的脱节。通过建立通用语言、识别限界上下文以及使用战术设计模式，确保代码结构直接反映业务概念。

### Q2：实体和值对象有什么区别？

**答案**：
- **实体**：有唯一标识，标识在整个生命周期内保持不变，状态可变。相等性由 ID 决定。例如：订单、用户。
- **值对象**：没有唯一标识，由属性值定义，不可变。相等性由属性值决定。例如：货币、地址。

### Q3：什么是聚合？如何设计聚合？

**答案**：聚合是一组相关对象的集合，是数据一致性的边界。设计原则：
1. 聚合根是唯一入口
2. 尽可能保持聚合小
3. 聚合内部保证强一致性
4. 聚合之间通过 ID 引用
5. 聚合通过领域事件实现最终一致性

### Q4：什么是限界上下文？为什么重要？

**答案**：限界上下文是模型的适用边界；在此边界内，通用语言保持一致。同一术语在不同上下文中可能有不同含义（如"产品"在目录和库存上下文中含义不同）。限界上下文帮助我们：
1. 避免模型过于复杂
2. 支持团队独立开发
3. 支持技术栈多样性
4. 清晰定义集成边界

### Q5：贫血模型和充血模型有什么区别？

**答案**：
- **贫血模型**：领域对象只包含数据，没有行为；业务逻辑在服务层。违反 OOP 原则。
- **充血模型**：领域对象同时包含数据和行为；业务规则封装在实体内。符合 DDD 理念。

### Q6：如何决定是否使用 DDD？

**答案**：DDD 适用于：
- 核心域有复杂业务逻辑
- 系统需要长期维护和演进
- 有领域专家参与的项目

不适用于：
- 简单的 CRUD 应用
- 技术驱动的基础设施项目
- 短期临时项目

### Q7：解释战略设计和战术设计的关系

**答案**：
- **战略设计**解决"是什么"和"为什么"——识别子域、定义限界上下文以及建立上下文关系
- **战术设计**解决"如何做"——使用实体、值对象、聚合等构建块实现领域模型
- 战略设计应该先行；没有适当的边界，战术模式更难正确应用

### Q8：什么是领域事件，为什么使用它们？

**答案**：领域事件表示领域中发生的重要事情。好处包括：
1. 聚合和限界上下文之间的解耦
2. 实现最终一致性
3. 提供审计跟踪
4. 支持异步处理
5. 促进事件驱动架构和微服务

---

## 延伸阅读

### 经典书籍

1. **《领域驱动设计：软件核心复杂性应对之道》** - Eric Evans
   - DDD 奠基之作，必读

2. **《实现领域驱动设计》** - Vaughn Vernon
   - 更偏重实践，有大量代码示例

3. **《领域驱动设计精粹》** - Vaughn Vernon
   - DDD 入门精简版

4. **《Introducing EventStorming》** - Alberto Brandolini
   - 详细讲解事件风暴方法论

5. **《Patterns, Principles, and Practices of Domain-Driven Design》** - Scott Millett
   - 全面覆盖，有 .NET 示例

### 在线资源

- [Domain-Driven Design Reference](https://www.domainlanguage.com/ddd/reference/) - Eric Evans 的官方参考
- [Awesome DDD](https://github.com/heynickc/awesome-ddd) - DDD 资源精选
- [Martin Fowler 的 DDD 文章](https://martinfowler.com/tags/domain%20driven%20design.html) - Martin Fowler 的 DDD 文章集
- [DDD 社区](https://dddcommunity.org/) - DDD 社区资源
- [Virtual DDD](https://virtualddd.com/) - 社区聚会和讨论

### 相关模式和概念

- **CQRS（命令查询职责分离）**：分离读写操作
- **Event Sourcing（事件溯源）**：通过事件序列重建状态
- **六边形架构（端口和适配器）**：保持领域模型独立于技术基础设施
- **整洁架构**：依赖反转；核心业务不依赖框架
- **洋葱架构**：分层，依赖向内

### 推荐实践项目

- [eShopOnContainers](https://github.com/dotnet-architecture/eShopOnContainers) - 微软的 DDD 示例项目
- [Equinox Project](https://github.com/EduardoPires/EquinoxProject) - .NET DDD 实践
- [ddd-starter-modelling-process](https://github.com/ddd-crew/ddd-starter-modelling-process) - DDD 建模流程指南
- [EventStoreDB Samples](https://github.com/EventStore/samples) - 事件溯源示例

---

## 总结

领域驱动设计是应对具有丰富业务领域的软件系统复杂性的强大方法论。关键要点：

1. **聚焦领域**：软件复杂性来自业务复杂性，而非技术复杂性
2. **通用语言**：在业务和技术团队之间创建共享词汇
3. **限界上下文**：定义模型和语言保持一致的清晰边界
4. **战略先于战术**：在深入代码之前理解领域及其关系
5. **充血领域模型**：将业务规则封装在领域对象内
6. **聚合保证一致性**：围绕业务不变量设计一致性边界
7. **事件实现集成**：使用领域事件实现上下文之间的松耦合

记住 DDD 不是银弹。在复杂性值得投入的地方应用它——通常是在核心域。对于系统中较简单的部分，直接的方法可能更合适。目标始终是在交付业务价值的同时有效管理复杂性。
