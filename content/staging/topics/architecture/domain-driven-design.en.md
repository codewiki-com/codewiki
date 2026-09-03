---
title: Domain-Driven Design Complete Guide
description: Master DDD for complex business domain modeling
track: architecture
section: ddd
difficulty: advanced
tags:
  - DDD
  - Domain
  - Architecture
  - Modeling
status: imported
origin: old/src/content/docs/architecture/domain-driven-design.en.md
divergence: 0.212
issues: []
legacy:
  category: Architecture
  subcategory: DDD
  order: 6
  lastUpdated: 2026-01-07
---

## What is Domain-Driven Design?

Domain-Driven Design (DDD) is a software development methodology first systematically introduced by Eric Evans in his seminal 2003 book "Domain-Driven Design: Tackling Complexity in the Heart of Software." It is not merely a set of technical frameworks or design patterns, but rather a software design philosophy that places the business domain at the center of development efforts.

### The Core Philosophy

DDD's central premise is that **software complexity stems from the business domain itself, not from technical implementation**. Therefore, development teams should focus their primary efforts on understanding and modeling the business domain, ensuring that code structure directly reflects business concepts and rules.

### Problems DDD Solves

1. **The Business-Technology Gap**: Business stakeholders and technical teams often speak different languages, leading to misunderstandings in requirements
2. **Software Decay**: As business evolves, code structure gradually becomes disconnected from business logic
3. **Uncontrolled Complexity**: In large systems, unclear module boundaries lead to high coupling
4. **Knowledge Loss**: Business knowledge becomes scattered across the codebase, making it difficult for new team members to understand the system

### The Two Pillars of DDD

DDD operates on two levels:

- **Strategic Design**: Focuses on how to define system boundaries, identify core domains, and establish team collaboration patterns
- **Tactical Design**: Focuses on implementing domain models at the code level, including building blocks like Entities, Value Objects, and Aggregates

---

## Ubiquitous Language

Ubiquitous Language is the foundation of DDD, permeating the entire design process.

### What is Ubiquitous Language?

Ubiquitous Language is a precise terminology system created collaboratively by domain experts and the development team within a specific Bounded Context. This language:

- Appears in requirements documents
- Appears in code naming conventions
- Appears in team communications
- Appears in user interfaces

### Why Ubiquitous Language Matters

```
Business stakeholder says: "When a user places an order, the system should freeze the inventory"
Developer understands: "OK, I'll decrement the stock field by one"

// This is the problem caused by inconsistent language!
// "Freeze inventory" != "Reduce inventory"
// Freezing means reserving - the inventory still exists but is not available for sale
```

### How to Establish Ubiquitous Language

1. **Collaborate closely with domain experts**: Don't work in isolation
2. **Document terminology**: Maintain a domain glossary
3. **Code as documentation**: Code naming must use Ubiquitous Language
4. **Continuous evolution**: Language evolves as understanding deepens

```typescript
// Bad example: Technical naming
class DataManager {
  updateRecord(id: string, data: object) {}
  deleteRecord(id: string) {}
}

// Good example: Using Ubiquitous Language
class OrderService {
  placeOrder(customerId: string, items: OrderItem[]) {}
  cancelOrder(orderId: string, reason: CancellationReason) {}
}
```

---

## Bounded Context

Bounded Context is the most important concept in DDD strategic design. It defines the applicable boundary for a model - within this boundary, the Ubiquitous Language remains consistent.

### Why Do We Need Bounded Contexts?

The same term may have different meanings in different business scenarios:

```
"Product" in different contexts:

Product Catalog Context:
- Name, description, images, category, specifications

Inventory Context:
- SKU, stock quantity, warehouse location

Order Context:
- Purchase quantity, unit price, discount

Shipping Context:
- Weight, dimensions, packaging method
```

### Boundaries of a Bounded Context

Each Bounded Context should:

1. **Have its own codebase or module**
2. **Have its own data storage**
3. **Have clear team ownership**
4. **Have well-defined external interfaces**

```typescript
// Product in the Catalog Context
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

// Product in the Inventory Context (better named StockItem here)
namespace InventoryContext {
  interface StockItem {
    sku: string;
    productId: string; // Reference to Catalog's Product ID
    quantity: number;
    warehouseId: string;
    reorderPoint: number;
  }
}
```

### Context Mapping

Context Mapping describes the relationships and integration patterns between different Bounded Contexts.

#### Common Context Mapping Patterns

##### Partnership

Two teams succeed or fail together, requiring close collaboration.

```
Order Context <--Partnership--> Inventory Context
Both teams need to synchronize interface design to ensure smooth order flow
```

##### Shared Kernel

Two contexts share a portion of model code.

```typescript
// shared-kernel/money.ts
// Value Object shared by multiple contexts
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

##### Customer-Supplier

The upstream supplier provides services; the downstream customer consumes them.

```
Payment Context (Supplier) --> Order Context (Customer)
Order Context depends on payment capabilities provided by Payment Context
```

##### Conformist

The downstream completely follows the upstream's model without any translation layer.

```
When integrating a third-party payment API, we might choose to use its data structures directly
```

##### Anti-Corruption Layer (ACL)

The downstream creates a translation layer to isolate the influence of the upstream model.

```typescript
// Anti-Corruption Layer example: Isolating third-party logistics API
class LogisticsAntiCorruptionLayer {
  constructor(private thirdPartyClient: ThirdPartyLogisticsClient) {}

  // Convert third-party API data structures to our domain model
  async getShipmentStatus(orderId: string): Promise<ShipmentStatus> {
    const externalStatus = await this.thirdPartyClient.queryStatus(orderId);

    // Translate third-party status codes to our domain concepts
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

##### Open Host Service (OHS)

The upstream provides a standardized protocol/API for multiple downstream consumers.

```typescript
// Open Host Service: Providing standardized REST API
@Controller('/api/v1/products')
class ProductCatalogAPI {
  @Get('/:id')
  async getProduct(@Param('id') id: string): Promise<ProductDTO> {
    const product = await this.productService.findById(id);
    return this.toDTO(product);
  }

  @Get('/')
  async searchProducts(@Query() query: SearchQuery): Promise<ProductDTO[]> {
    // Provide standardized search interface
  }
}
```

##### Published Language

Defines standardized data exchange formats.

```typescript
// Published Language: Define standard event format
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

## Entities and Value Objects

### Entity

An Entity is a domain object with a unique identity that remains constant throughout its lifecycle.

```typescript
// Entity characteristics:
// 1. Has a unique identity
// 2. Has a lifecycle
// 3. Has mutable state

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

  // Entity behavior methods that encapsulate business rules
  confirm(): void {
    if (this._status !== OrderStatus.Pending) {
      throw new DomainError('Only pending orders can be confirmed');
    }
    this._status = OrderStatus.Confirmed;
    // Can publish domain events
  }

  cancel(reason: CancellationReason): void {
    if (this._status === OrderStatus.Shipped) {
      throw new DomainError('Shipped orders cannot be cancelled');
    }
    this._status = OrderStatus.Cancelled;
  }

  // Entity equality is based on ID
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

### Value Object

A Value Object has no unique identity and is defined by its attribute values. It is immutable.

```typescript
// Value Object characteristics:
// 1. No unique identity
// 2. Immutable
// 3. Equality determined by attribute values
// 4. Replaceable

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

  // Value Object equality is based on attribute values
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

// Another Value Object example: Address
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

  // Value Objects are immutable; modifications return new instances
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

## Aggregates

An Aggregate is a cluster of related objects treated as a unit for data modification. An Aggregate has an Aggregate Root through which external parties access objects within the Aggregate.

```typescript
// Aggregate design principles:
// 1. The Aggregate Root is the only entry point
// 2. Aggregates maintain internal consistency
// 3. Aggregates reference each other by ID
// 4. One transaction modifies only one Aggregate

// Order Aggregate
class Order {  // Aggregate Root
  private readonly _id: OrderId;
  private readonly _customerId: CustomerId; // Cross-aggregate reference uses ID
  private _items: OrderItem[]; // Internal Aggregate objects
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

  // Operate on internal objects through the Aggregate Root
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

  // Business behavior
  place(): void {
    if (this._items.length === 0) {
      throw new DomainError('Order cannot be empty');
    }

    if (this._status !== OrderStatus.Draft) {
      throw new DomainError('Only draft orders can be placed');
    }

    this._status = OrderStatus.Placed;

    // Publish domain event
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

// Entity within the Aggregate
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

### Aggregate Design Guidelines

1. **Keep Aggregates small**: Large Aggregates cause concurrency issues and performance problems
2. **Reference other Aggregates by ID**: Never hold direct references to other Aggregate Roots
3. **One transaction, one Aggregate**: Use eventual consistency between Aggregates
4. **Design around invariants**: Aggregate boundaries should encompass all objects needed to enforce business rules

```typescript
// Bad: Aggregate too large
class Customer {
  orders: Order[];       // Customer might have thousands of orders
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  reviews: Review[];
}

// Good: Small Aggregates referencing by ID
class Customer {
  id: CustomerId;
  name: string;
  defaultAddressId: AddressId;
}

class Order {
  customerId: CustomerId; // Reference by ID
}
```

---

## Domain Events

Domain Events represent business events that have occurred in the domain. They are used to implement eventual consistency between Aggregates.

```typescript
// Domain Event base class
abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public abstract readonly eventType: string;

  constructor() {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date();
  }
}

// Concrete domain events
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

// Event handlers
class InventoryEventHandler {
  constructor(private inventoryService: InventoryService) {}

  @EventHandler(OrderPlacedEvent)
  async onOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    // Deduct inventory
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
    // Send shipment notification
    await this.notificationService.sendShipmentNotification(
      event.orderId,
      event.trackingNumber
    );
  }
}
```

### Benefits of Domain Events

1. **Decoupling**: Producers and consumers are loosely coupled
2. **Auditability**: Events provide a natural audit trail
3. **Scalability**: Enable asynchronous processing and microservices communication
4. **Eventual Consistency**: Allow consistency across Aggregate boundaries

---

## Strategic vs Tactical Design

### Strategic Design

Strategic Design focuses on the macro architecture of the system, helping us understand the business landscape and appropriately divide system boundaries.

#### Domain and Subdomains

A Domain is the business problem space that software aims to solve. Complex domains can be decomposed into multiple Subdomains:

##### Core Domain

The core competitive advantage of the business; this is where you should invest the most effort.

```
For an e-commerce platform, core domains might be:
- Personalized recommendation system
- Smart pricing strategy
- Supply chain optimization
```

##### Supporting Subdomain

Supports core business operations but is not a competitive advantage.

```
E-commerce supporting subdomains:
- Order management
- Inventory management
- Shipment tracking
```

##### Generic Subdomain

Generic functionality that can use off-the-shelf solutions.

```
E-commerce generic subdomains:
- User authentication
- Payment gateway
- SMS/Email notifications
```

### Tactical Design

Tactical Design provides building blocks for implementing domain models at the code level:

| Building Block | Purpose |
|----------------|---------|
| Entity | Object with unique identity and lifecycle |
| Value Object | Immutable object defined by attributes |
| Aggregate | Consistency boundary with a Root |
| Domain Event | Record of something significant that happened |
| Repository | Collection-like interface for Aggregate persistence |
| Factory | Encapsulates complex object creation |
| Domain Service | Operations that don't belong to any Entity |

---

## Implementation Examples

### Complete Order Domain Model

```typescript
// ==================== Value Objects ====================

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

// ==================== Aggregate Root ====================

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

  // Factory method for creating new orders
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

  // Reconstitute from persistence
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

  // Business behavior
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

  // Domain events
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

  // Snapshot for persistence
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

// ==================== Repository ====================

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

    // Publish domain events
    for (const event of order.domainEvents) {
      await this.eventBus.publish(event);
    }
    order.clearEvents();
  }

  nextId(): OrderId {
    return new OrderId(crypto.randomUUID());
  }
}

// ==================== Application Service ====================

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

## Event Storming

Event Storming is a collaborative domain modeling technique created by Alberto Brandolini. It explores business processes by identifying domain events.

### Event Storming Process

#### Phase 1: Chaotic Exploration

Write down all conceivable domain events on orange sticky notes (past tense verb phrases):

```
- Order Created (OrderCreated)
- Order Confirmed (OrderConfirmed)
- Payment Completed (PaymentCompleted)
- Inventory Deducted (InventoryDeducted)
- Order Shipped (OrderShipped)
- Order Delivered (OrderDelivered)
- Refund Requested (RefundRequested)
- Refund Completed (RefundCompleted)
```

#### Phase 2: Timeline Arrangement

Arrange events in chronological order to form business processes:

```
OrderCreated -> InventoryReserved -> PaymentCompleted -> InventoryDeducted -> OrderConfirmed -> OrderShipped -> OrderDelivered
                                           |
                                    PaymentFailed -> InventoryReleased -> OrderCancelled
```

#### Phase 3: Identify Commands and Aggregates

Blue sticky notes represent commands (actions triggering events); yellow sticky notes represent aggregates:

```
[User] --PlaceOrder--> [Order] --OrderCreated-->
[User] --Pay--> [Payment] --PaymentCompleted-->
[System] --DeductInventory--> [Inventory] --InventoryDeducted-->
```

#### Phase 4: Identify Bounded Contexts

Based on aggregate relationships, divide into Bounded Contexts:

```
+-------------------+  +-------------------+  +-------------------+
|   Order Context   |  |  Payment Context  |  | Inventory Context |
|                   |  |                   |  |                   |
| - Order           |  | - Payment         |  | - Inventory       |
| - OrderItem       |  | - PaymentMethod   |  | - StockItem       |
| - ShippingInfo    |  | - Transaction     |  | - Warehouse       |
+-------------------+  +-------------------+  +-------------------+
```

---

## Common Pitfalls

### Anemic Domain Model

Treating domain objects as pure data carriers with all business logic in the service layer.

```typescript
// Wrong: Anemic model
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

// Correct: Rich model
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

### Oversized Aggregates

Placing too many entities in the same Aggregate, causing concurrency conflicts and performance issues.

```typescript
// Wrong: Aggregate too large
class Customer {
  orders: Order[];       // Customer might have thousands of orders
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  reviews: Review[];
}

// Correct: Small Aggregates with ID references
class Customer {
  id: CustomerId;
  name: string;
  defaultAddressId: AddressId;
}

class Order {
  customerId: CustomerId; // Reference by ID
}
```

### Ignoring Bounded Contexts

Using the same model across different contexts, leading to overly complex models.

```typescript
// Wrong: One Product model trying to satisfy all scenarios
class Product {
  // Catalog attributes
  name: string;
  description: string;
  images: string[];

  // Inventory attributes
  stockQuantity: number;
  warehouseId: string;

  // Shipping attributes
  weight: number;
  dimensions: Dimensions;

  // Financial attributes
  costPrice: Money;
  salesPrice: Money;
}

// Correct: Each context has its own model
// catalog-context/product.ts
class CatalogProduct { ... }

// inventory-context/stock-item.ts
class StockItem { ... }

// shipping-context/shipment-item.ts
class ShipmentItem { ... }
```

### Over-engineering

Forcing all DDD patterns in simple CRUD scenarios.

```typescript
// For simple configuration management, DDD is overkill
// Simple CRUD is sufficient

// Only use full DDD patterns in the Core Domain
```

### Technology-Driven Instead of Business-Driven

Designing technical architecture first, then fitting business logic into it.

```
Wrong approach:
1. Decide to use microservices architecture
2. Design database tables
3. Write CRUD APIs
4. Add business logic

Correct approach:
1. Understand the business domain
2. Build domain models
3. Divide Bounded Contexts
4. Choose appropriate technical implementation
```

---

## Best Practices

### Start with the Core Domain

Focus DDD investment on the Core Domain; Supporting Domains can be simplified.

### Continuously Evolve the Domain Model

Domain models are not designed once and done; they need continuous refactoring as business understanding deepens.

### Keep Aggregates Small and Focused

- Prefer small Aggregates
- Use domain events for eventual consistency between Aggregates
- One transaction should modify only one Aggregate

### Use Factories for Complex Creation Logic

When Aggregate creation involves complex logic, use the Factory pattern.

### Use Domain Events for Decoupling

Use domain events instead of direct calls to achieve loose coupling between Bounded Contexts.

### Layer Your Architecture

```
+--------------------------------------------------+
|                  User Interface                   |
+--------------------------------------------------+
|                Application Layer                  |
|  (Orchestrates use cases, transactions, DTOs)    |
+--------------------------------------------------+
|                  Domain Layer                     |
| (Entities, Value Objects, Aggregates, Events)    |
+--------------------------------------------------+
|               Infrastructure Layer                |
| (Repositories, External Services, Persistence)   |
+--------------------------------------------------+
```

---

## Interview Key Points

### Q1: What is Domain-Driven Design? What problems does it solve?

**Answer**: Domain-Driven Design is a software design methodology centered on the business domain. The core problems it solves are the disconnect between business logic and technical implementation in complex software systems. Through establishing Ubiquitous Language, identifying Bounded Contexts, and using tactical design patterns, it ensures that code structure directly reflects business concepts.

### Q2: What is the difference between Entity and Value Object?

**Answer**:
- **Entity**: Has unique identity, identity remains constant throughout lifecycle, has mutable state. Equality is determined by ID. Examples: Order, User.
- **Value Object**: No unique identity, defined by attribute values, immutable. Equality is determined by attribute values. Examples: Money, Address.

### Q3: What is an Aggregate? How do you design Aggregates?

**Answer**: An Aggregate is a cluster of related objects that is a boundary for data consistency. Design principles:
1. The Aggregate Root is the only entry point
2. Keep Aggregates as small as possible
3. Aggregates guarantee strong consistency internally
4. Aggregates reference each other by ID
5. Aggregates achieve eventual consistency through domain events

### Q4: What is a Bounded Context? Why is it important?

**Answer**: A Bounded Context is the applicable boundary for a model; within this boundary, Ubiquitous Language remains consistent. The same term may have different meanings in different contexts (e.g., "Product" means different things in Catalog and Inventory contexts). Bounded Contexts help us:
1. Avoid overly complex models
2. Support independent team development
3. Support technology stack diversity
4. Clearly define integration boundaries

### Q5: What is the difference between Anemic Model and Rich Model?

**Answer**:
- **Anemic Model**: Domain objects contain only data, no behavior; business logic resides in the service layer. Violates OOP principles.
- **Rich Model**: Domain objects contain both data and behavior; business rules are encapsulated within entities. Aligns with DDD philosophy.

### Q6: How do you decide whether to use DDD?

**Answer**: DDD is suitable for:
- Complex business logic in core domains
- Systems requiring long-term maintenance and evolution
- Projects with domain expert involvement

Not suitable for:
- Simple CRUD applications
- Technology-driven infrastructure projects
- Short-term temporary projects

### Q7: Explain the relationship between Strategic and Tactical Design

**Answer**:
- **Strategic Design** addresses the "what" and "why" - identifying subdomains, defining bounded contexts, and establishing context relationships
- **Tactical Design** addresses the "how" - implementing the domain model using building blocks like Entities, Value Objects, and Aggregates
- Strategic Design should come first; without proper boundaries, tactical patterns become harder to apply correctly

### Q8: What are Domain Events and why use them?

**Answer**: Domain Events represent significant occurrences in the domain. Benefits include:
1. Decoupling between Aggregates and Bounded Contexts
2. Enabling eventual consistency
3. Providing an audit trail
4. Supporting asynchronous processing
5. Facilitating event-driven architectures and microservices

---

## Further Reading

### Classic Books

1. **"Domain-Driven Design: Tackling Complexity in the Heart of Software"** - Eric Evans
   - The foundational DDD book, essential reading

2. **"Implementing Domain-Driven Design"** - Vaughn Vernon
   - More practice-oriented with extensive code examples

3. **"Domain-Driven Design Distilled"** - Vaughn Vernon
   - A condensed introduction to DDD

4. **"Introducing EventStorming"** - Alberto Brandolini
   - Detailed explanation of the Event Storming methodology

5. **"Patterns, Principles, and Practices of Domain-Driven Design"** - Scott Millett
   - Comprehensive coverage with .NET examples

### Online Resources

- [Domain-Driven Design Reference](https://www.domainlanguage.com/ddd/reference/) - Eric Evans' official reference
- [Awesome DDD](https://github.com/heynickc/awesome-ddd) - Curated DDD resources
- [Martin Fowler's DDD Articles](https://martinfowler.com/tags/domain%20driven%20design.html) - Martin Fowler's DDD article collection
- [DDD Community](https://dddcommunity.org/) - DDD community resources
- [Virtual DDD](https://virtualddd.com/) - Community meetups and discussions

### Related Patterns and Concepts

- **CQRS (Command Query Responsibility Segregation)**: Separates read and write operations
- **Event Sourcing**: Reconstructs state through event sequences
- **Hexagonal Architecture (Ports and Adapters)**: Keeps domain model independent of technical infrastructure
- **Clean Architecture**: Dependency inversion; core business doesn't depend on frameworks
- **Onion Architecture**: Layers with dependencies pointing inward

### Recommended Practice Projects

- [eShopOnContainers](https://github.com/dotnet-architecture/eShopOnContainers) - Microsoft's DDD sample project
- [Equinox Project](https://github.com/EduardoPires/EquinoxProject) - .NET DDD practice
- [ddd-starter-modelling-process](https://github.com/ddd-crew/ddd-starter-modelling-process) - DDD modeling process guide
- [EventStoreDB Samples](https://github.com/EventStore/samples) - Event Sourcing examples

---

## Summary

Domain-Driven Design is a powerful methodology for tackling complexity in software systems with rich business domains. Key takeaways:

1. **Focus on the Domain**: Software complexity comes from business complexity, not technical complexity
2. **Ubiquitous Language**: Create a shared vocabulary between business and technical teams
3. **Bounded Contexts**: Define clear boundaries where models and language are consistent
4. **Strategic before Tactical**: Understand your domains and their relationships before diving into code
5. **Rich Domain Models**: Encapsulate business rules within domain objects
6. **Aggregates for Consistency**: Design consistency boundaries around business invariants
7. **Events for Integration**: Use domain events for loose coupling between contexts

Remember that DDD is not a silver bullet. Apply it where complexity warrants the investment - typically in your Core Domain. For simpler parts of your system, a straightforward approach may be more appropriate. The goal is always to manage complexity effectively while delivering business value.
