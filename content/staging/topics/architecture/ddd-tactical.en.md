---
title: DDD Tactical Design Patterns
description: Master DDD tactical patterns for complex domain modeling
track: architecture
section: ddd
difficulty: advanced
tags:
  - DDD
  - Tactical Design
  - Entity
  - Aggregate
status: imported
origin: old/src/content/docs/architecture/ddd-tactical.en.md
divergence: 0.224
issues: []
legacy:
  category: Architecture
  subcategory: DDD
  order: 6
  lastUpdated: 2026-01-07
---

## Overview

Domain-Driven Design (DDD) tactical patterns are a set of building blocks for implementing domain models at the code level. These patterns help developers organize complex business logic in a clear, maintainable manner, ensuring that code structure aligns with business concepts.

The core goal of tactical design is: **Make code the carrier of business knowledge, not merely a technical implementation.**

We'll explore the seven major tactical patterns in DDD and demonstrate their practical application through a comprehensive order domain modeling example.

---

## Entities and Value Objects

### Entity

An Entity is a domain object with a unique identity that remains constant throughout its lifecycle. Entity equality is determined by identity, not by attribute values.

**Core Characteristics of Entities:**

- Has a unique identifier (ID)
- Mutable: state can change, but identity remains constant
- Lifecycle: complete process from creation to deletion
- Equality: determined by comparing identities

```typescript
// Order Entity
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

  // Unique identifier
  getId(): OrderId {
    return this.id;
  }

  // Business behavior: confirm order
  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStateError(
        `Cannot confirm order in ${this.status} status`
      );
    }
    this.status = OrderStatus.CONFIRMED;
    this.updatedAt = new Date();
  }

  // Business behavior: cancel order
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

  // Entity equality: based on identity comparison
  equals(other: Order): boolean {
    return this.id.equals(other.id);
  }
}
```

### Value Object

A Value Object is a domain object without a unique identity, where equality is determined by all attribute values together. Value Objects are immutable - any modification creates a new instance.

**Core Characteristics of Value Objects:**

- No unique identity
- Immutable: cannot be modified after creation
- Equality: determined by comparing all attribute values
- Interchangeable: equal value objects can be substituted for each other

```typescript
// Money Value Object
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

  static of(amount: number, currency: Currency = Currency.USD): Money {
    return new Money(amount, currency);
  }

  static zero(currency: Currency = Currency.USD): Money {
    return new Money(0, currency);
  }

  // Immutable operation: returns new value object
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

  // Value object equality: based on all attribute comparison
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}

// Address Value Object
class Address {
  private readonly street: string;
  private readonly city: string;
  private readonly state: string;
  private readonly zipCode: string;
  private readonly country: string;

  constructor(
    street: string,
    city: string,
    state: string,
    zipCode: string,
    country: string
  ) {
    this.validateAddress(street, city, state, zipCode, country);
    this.street = street;
    this.city = city;
    this.state = state;
    this.zipCode = zipCode;
    this.country = country;
  }

  private validateAddress(...parts: string[]): void {
    if (parts.some(part => !part || part.trim().length === 0)) {
      throw new InvalidAddressError('Address parts cannot be empty');
    }
  }

  // Create new address (value objects are immutable)
  withStreet(newStreet: string): Address {
    return new Address(
      newStreet,
      this.city,
      this.state,
      this.zipCode,
      this.country
    );
  }

  equals(other: Address): boolean {
    return (
      this.street === other.street &&
      this.city === other.city &&
      this.state === other.state &&
      this.zipCode === other.zipCode &&
      this.country === other.country
    );
  }

  getFullAddress(): string {
    return `${this.street}, ${this.city}, ${this.state} ${this.zipCode}, ${this.country}`;
  }
}
```

### How to Choose Between Entity and Value Object?

| Consideration | Choose Entity | Choose Value Object |
|--------------|---------------|---------------------|
| Need unique identity? | Need to track lifecycle | Only care about attribute values |
| Need mutability? | State changes over time | Immutable after creation |
| Equality determination | Same object | Same attribute values |
| Examples | User, Order, Product | Money, Address, Date Range |

---

## Aggregates and Aggregate Roots

### The Concept of Aggregate

An Aggregate is a cluster of related objects treated as a unit for data modification. Aggregates define a clear boundary within which objects maintain consistency constraints.

**Core Principles of Aggregates:**

- **Clear boundaries**: Explicitly define which objects belong to the aggregate
- **Consistency guarantee**: Maintain business rule consistency within the aggregate
- **Transaction boundary**: One transaction modifies only one aggregate
- **Access through aggregate root**: External access to internal objects only through the aggregate root

### Aggregate Root

The Aggregate Root is the entry point to the aggregate and the only way for external entities to access the aggregate. The aggregate root is an entity responsible for maintaining aggregate integrity.

```typescript
// Order Aggregate Root
class Order {
  private readonly id: OrderId;
  private readonly customerId: CustomerId;
  private status: OrderStatus;
  private items: OrderItem[]; // Internal aggregate objects
  private shippingAddress: Address; // Value object
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

  // Add order item through aggregate root
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

  // Remove order item through aggregate root
  removeItem(itemId: OrderItemId): void {
    this.ensureOrderIsDraft();

    const index = this.items.findIndex(item => item.getId().equals(itemId));
    if (index === -1) {
      throw new OrderItemNotFoundError(itemId);
    }

    this.items.splice(index, 1);
    this.recalculateTotal();
  }

  // Submit order
  submit(): void {
    this.ensureOrderIsDraft();

    if (this.items.length === 0) {
      throw new EmptyOrderError('Cannot submit an empty order');
    }

    this.status = OrderStatus.PENDING;

    // Publish domain event
    this.addDomainEvent(new OrderSubmittedEvent(this.id, this.customerId, this.totalAmount));
  }

  // Confirm order
  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStateError(`Order must be pending to confirm`);
    }

    this.status = OrderStatus.CONFIRMED;
    this.addDomainEvent(new OrderConfirmedEvent(this.id));
  }

  // Internal to aggregate: find order item
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

// Order Item (Entity within the aggregate)
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

### Aggregate Design Principles

1. **Small aggregate principle**: Aggregates should be as small as possible, containing only necessary objects
2. **Reference other aggregates by identity**: Do not hold direct references to other aggregates within an aggregate
3. **Eventual consistency**: Cross-aggregate business rules can achieve eventual consistency through domain events
4. **One transaction per aggregate**: Avoid modifying multiple aggregates in a single transaction

```typescript
// Bad example: Aggregate too large, directly referencing other aggregates
class Order {
  private customer: Customer; // Wrong: directly referencing Customer aggregate
  private products: Product[]; // Wrong: directly referencing Product aggregate
}

// Good example: Reference by identity
class Order {
  private customerId: CustomerId; // Correct: reference by ID
  private items: OrderItem[]; // Correct: OrderItem contains productId
}
```

---

## Domain Services

### What is a Domain Service?

A Domain Service encapsulates domain logic that does not naturally belong to any entity or value object. Consider using a domain service when an operation:

- Involves multiple aggregates
- Does not naturally belong to any entity
- Is stateless

### Domain Service Examples

```typescript
// Order Pricing Service
class OrderPricingService {
  constructor(
    private readonly discountPolicy: DiscountPolicy,
    private readonly taxCalculator: TaxCalculator
  ) {}

  // Calculate final order price (involves discount and tax calculations)
  calculateFinalPrice(order: Order, customer: Customer): PriceBreakdown {
    const subtotal = order.getSubtotal();

    // Apply discount policy
    const discount = this.discountPolicy.calculateDiscount(order, customer);
    const afterDiscount = subtotal.subtract(discount);

    // Calculate tax
    const tax = this.taxCalculator.calculate(afterDiscount, order.getShippingAddress());

    // Return price breakdown
    return new PriceBreakdown(subtotal, discount, tax, afterDiscount.add(tax));
  }
}

// Inventory Allocation Service
class InventoryAllocationService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly warehouseSelector: WarehouseSelector
  ) {}

  // Allocate inventory for order (involves coordinating multiple warehouses)
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

// Order Transfer Service
class OrderTransferService {
  constructor(
    private readonly orderRepository: OrderRepository
  ) {}

  // Transfer order ownership (involves two aggregates: order and customer)
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

### Domain Service vs Application Service

| Characteristic | Domain Service | Application Service |
|---------------|----------------|---------------------|
| Layer | Domain Layer | Application Layer |
| Logic contained | Core business logic | Use case orchestration, transaction management |
| Dependencies | Only depends on domain objects | Depends on domain objects and infrastructure |
| State | Stateless | Stateless |
| Examples | Pricing calculation, inventory allocation | Create order use case, payment flow orchestration |

---

## Repository Pattern

### The Concept of Repository

A Repository is a persistence interface for aggregates, providing collection-like access for retrieving and storing aggregates to the domain layer. Repositories encapsulate the specific implementation of data access, making the domain layer independent of persistence technology.

**Core Responsibilities of Repositories:**

- Provide retrieval and storage of aggregates
- Encapsulate query logic
- Ensure aggregate integrity
- Isolate persistence technology

### Repository Interface Design

```typescript
// Repository interface (defined in domain layer)
interface OrderRepository {
  // Find by ID
  findById(id: OrderId): Promise<Order | null>;

  // Find by ID, throw exception if not found
  getById(id: OrderId): Promise<Order>;

  // Save aggregate
  save(order: Order): Promise<void>;

  // Delete aggregate
  delete(order: Order): Promise<void>;

  // Check if exists
  exists(id: OrderId): Promise<boolean>;

  // Find orders by customer ID
  findByCustomerId(customerId: CustomerId): Promise<Order[]>;

  // Find orders by status
  findByStatus(status: OrderStatus): Promise<Order[]>;

  // Generate new order ID
  nextId(): OrderId;
}

// Repository implementation (infrastructure layer)
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
      // Save order main table
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

      // Delete old order items
      await tx.query(
        'DELETE FROM order_items WHERE order_id = $1',
        [order.getId().getValue()]
      );

      // Insert new order items
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

    // Publish domain events
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
    // Map database rows to domain objects
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

## Factory Pattern

### The Concept of Factory

A Factory encapsulates complex object creation logic, separating the creation process from the usage process. When object creation logic is complex, using a factory keeps domain objects clean and simple.

### Factory Implementation

```typescript
// Order Factory
class OrderFactory {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly pricingService: OrderPricingService
  ) {}

  // Create order from shopping cart
  async createFromCart(
    cart: ShoppingCart,
    shippingAddress: Address
  ): Promise<Order> {
    // Generate order ID
    const orderId = this.orderRepository.nextId();

    // Create order
    const order = new Order({
      id: orderId,
      customerId: cart.getCustomerId(),
      shippingAddress
    });

    // Add order items
    for (const cartItem of cart.getItems()) {
      const product = await this.productRepository.getById(cartItem.getProductId());

      // Verify product is available
      if (!product.isAvailable()) {
        throw new ProductNotAvailableError(product.getId());
      }

      order.addItem(product, cartItem.getQuantity());
    }

    return order;
  }

  // Clone order
  async cloneOrder(originalOrderId: OrderId): Promise<Order> {
    const original = await this.orderRepository.getById(originalOrderId);

    const newOrderId = this.orderRepository.nextId();
    const clonedOrder = new Order({
      id: newOrderId,
      customerId: original.getCustomerId(),
      shippingAddress: original.getShippingAddress()
    });

    // Clone order items (check if products are still available)
    for (const item of original.getItems()) {
      const product = await this.productRepository.findById(item.getProductId());

      if (product && product.isAvailable()) {
        clonedOrder.addItem(product, item.getQuantity());
      }
    }

    return clonedOrder;
  }
}

// Value Object Factory
class AddressFactory {
  // Create address from user input
  static createFromInput(input: AddressInput): Address {
    return new Address(
      input.street.trim(),
      input.city.trim(),
      input.state.trim(),
      input.zipCode.trim(),
      input.country.trim()
    );
  }

  // Create address from GPS coordinates (calls geocoding service)
  static async createFromCoordinates(
    latitude: number,
    longitude: number,
    geocodingService: GeocodingService
  ): Promise<Address> {
    const result = await geocodingService.reverseGeocode(latitude, longitude);

    return new Address(
      result.street,
      result.city,
      result.state,
      result.zipCode,
      result.country
    );
  }
}
```

---

## Domain Events

### The Concept of Domain Events

Domain Events represent meaningful business events that have occurred in the domain. They are a key mechanism for achieving eventual consistency between aggregates and system decoupling.

**Characteristics of Domain Events:**

- Represent facts that have already occurred
- Immutable
- Contain contextual information about when the event occurred
- Named using past tense

### Domain Event Implementation

```typescript
// Domain Event base class
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

// Order Submitted Event
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

// Order Confirmed Event
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

// Order Cancelled Event
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

// Domain Event Publisher interface
interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}

// Domain Event Handler interface
interface DomainEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

// Order Confirmed Event Handler: Send notification
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

// Order Submitted Event Handler: Reserve inventory
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

## Specification Pattern

### The Concept of Specification Pattern

The Specification Pattern encapsulates business rules, making rules composable, reusable, and testable. The Specification Pattern is particularly suitable for complex query conditions and business validation.

### Specification Pattern Implementation

```typescript
// Specification interface
interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
  and(other: Specification<T>): Specification<T>;
  or(other: Specification<T>): Specification<T>;
  not(): Specification<T>;
}

// Specification base class
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

// Composite specifications
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

// Order specification implementations
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

// Using Specification Pattern
class OrderQueryService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async findEligibleForPromotion(): Promise<Order[]> {
    const allOrders = await this.orderRepository.findAll();

    // Compose specifications: confirmed + amount > 100 + within last 30 days
    const spec = new OrderStatusSpecification(OrderStatus.CONFIRMED)
      .and(new OrderMinAmountSpecification(Money.of(100)))
      .and(new OrderCreatedWithinSpecification(30));

    return allOrders.filter(order => spec.isSatisfiedBy(order));
  }

  async findCancellableOrders(customerId: CustomerId): Promise<Order[]> {
    const orders = await this.orderRepository.findByCustomerId(customerId);

    // Cancellable orders: pending or confirmed status
    const spec = new OrderStatusSpecification(OrderStatus.PENDING)
      .or(new OrderStatusSpecification(OrderStatus.CONFIRMED));

    return orders.filter(order => spec.isSatisfiedBy(order));
  }
}
```

---

## Complete Order Domain Modeling Example

### Domain Model Structure

```
order-domain/
├── aggregates/
│   └── Order.ts              # Order Aggregate Root
├── entities/
│   └── OrderItem.ts          # Order Item Entity
├── value-objects/
│   ├── OrderId.ts            # Order ID
│   ├── Money.ts              # Money
│   ├── Address.ts            # Address
│   └── OrderStatus.ts        # Order Status
├── domain-services/
│   ├── OrderPricingService.ts    # Pricing Service
│   └── InventoryAllocationService.ts  # Inventory Allocation Service
├── repositories/
│   └── OrderRepository.ts    # Repository Interface
├── factories/
│   └── OrderFactory.ts       # Order Factory
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

### Application Layer Integration

```typescript
// Application Service: Create Order Use Case
class CreateOrderUseCase {
  constructor(
    private readonly orderFactory: OrderFactory,
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly unitOfWork: UnitOfWork
  ) {}

  async execute(command: CreateOrderCommand): Promise<CreateOrderResult> {
    return this.unitOfWork.execute(async () => {
      // Get shopping cart
      const cart = await this.cartRepository.getByCustomerId(command.customerId);

      if (cart.isEmpty()) {
        throw new EmptyCartError();
      }

      // Create address value object
      const shippingAddress = AddressFactory.createFromInput(command.shippingAddress);

      // Use factory to create order
      const order = await this.orderFactory.createFromCart(cart, shippingAddress);

      // Submit order
      order.submit();

      // Save order
      await this.orderRepository.save(order);

      // Clear shopping cart
      cart.clear();
      await this.cartRepository.save(cart);

      return new CreateOrderResult(
        order.getId(),
        order.getTotalAmount()
      );
    });
  }
}

// Application Service: Confirm Order Use Case
class ConfirmOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository
  ) {}

  async execute(command: ConfirmOrderCommand): Promise<void> {
    const order = await this.orderRepository.getById(command.orderId);

    // Call aggregate root's business method
    order.confirm();

    // Save (repository will automatically publish domain events)
    await this.orderRepository.save(order);
  }
}
```

---

## Best Practices and Anti-Patterns

### Best Practices

#### Keep Aggregates Small and Focused

```typescript
// Good practice: Small aggregate, reference by ID
class Order {
  private customerId: CustomerId;  // Reference, not containment
  private items: OrderItem[];      // Only contains directly related objects
}

// Bad practice: Giant aggregate
class Order {
  private customer: Customer;      // Directly contains entire customer
  private products: Product[];     // Directly contains entire product list
  private warehouse: Warehouse;    // Directly contains warehouse
}
```

#### Business Logic Belongs in Domain Objects

```typescript
// Good practice: Business logic in entity
class Order {
  cancel(reason: CancellationReason): void {
    if (!this.canBeCancelled()) {
      throw new InvalidOrderStateError();
    }
    this.status = OrderStatus.CANCELLED;
    this.cancellationReason = reason;
  }
}

// Bad practice: Anemic model + logic in service
class Order {
  status: OrderStatus;  // Only data, no behavior
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

#### Prefer Value Objects

```typescript
// Good practice: Use value objects
class Order {
  private totalAmount: Money;        // Value object
  private shippingAddress: Address;  // Value object
  private orderId: OrderId;          // Value object (strongly-typed ID)
}

// Bad practice: Use primitive types
class Order {
  private totalAmount: number;       // Lost currency information
  private shippingAddress: string;   // Lost structured information
  private orderId: string;           // Easily confused with other IDs
}
```

#### Explicitly Express Business Rules

```typescript
// Good practice: Use specification pattern to explicitly express rules
const canShipSpec = new OrderPaidSpecification()
  .and(new InventoryAllocatedSpecification())
  .and(new NoDeliveryBlockSpecification());

if (canShipSpec.isSatisfiedBy(order)) {
  order.markReadyForShipment();
}

// Bad practice: Implicit rules scattered in code
if (order.isPaid && order.inventoryAllocated && !order.hasDeliveryBlock) {
  order.status = 'ready_for_shipment';
}
```

### Common Anti-Patterns

#### Anemic Domain Model

Entities with only data and no behavior, with all logic in the service layer.

```typescript
// Anti-pattern: Anemic model
class Order {
  id: string;
  status: string;
  items: any[];
  // Only getters and setters
}

class OrderService {
  // All logic is here
  addItem(order: Order, item: any) { ... }
  submit(order: Order) { ... }
  cancel(order: Order) { ... }
}
```

#### Unclear Aggregate Boundaries

```typescript
// Anti-pattern: Unclear boundaries, directly manipulating internal objects
class Order {
  public items: OrderItem[];  // Exposing internal collection
}

// External direct modification
order.items.push(new OrderItem(...));  // Bypassing aggregate root
order.items[0].quantity = 10;          // Without validation
```

#### Ignoring Invariant Validation

```typescript
// Anti-pattern: No business rule validation
class Order {
  addItem(item: OrderItem): void {
    this.items.push(item);  // No validation at all
  }
}

// Correct approach
class Order {
  addItem(product: Product, quantity: number): void {
    this.ensureOrderIsDraft();
    this.ensureNotExceedMaxItems();
    this.ensureQuantityValid(quantity);
    // ... business logic
  }
}
```

#### Overusing Domain Events

```typescript
// Anti-pattern: Event granularity too fine
class Order {
  setCustomerName(name: string) {
    this.customerName = name;
    this.addEvent(new CustomerNameChangedEvent(...));  // Too trivial
  }
}

// Correct approach: Meaningful business events
class Order {
  submit() {
    // ... business logic
    this.addEvent(new OrderSubmittedEvent(...));  // Business significance
  }
}
```

---

## Interview Key Points

### Core Concept Questions

**Q1: What is the difference between Entity and Value Object? How do you choose between them?**

Answer: Entities have unique identities that remain constant throughout their lifecycle, with equality determined by identity. Value Objects have no identity, with equality determined by all attribute values, and they are immutable. Selection criteria: If you need to track an object's lifecycle and state changes, use an Entity; if you only care about attribute values, use a Value Object.

**Q2: What is an Aggregate? What is the role of an Aggregate Root?**

Answer: An Aggregate is a cluster of related objects that defines the boundary for data modification and consistency. The Aggregate Root is the entry point to the aggregate - external code can only access and modify internal objects through the aggregate root. The aggregate root is responsible for maintaining business rules and invariants within the aggregate.

**Q3: What is the difference between Domain Service and Application Service?**

Answer: Domain Services encapsulate core business logic that doesn't belong to any entity, located in the domain layer, depending only on domain objects. Application Services orchestrate use case flows, located in the application layer, responsible for transaction management, security validation, and other technical concerns, and can depend on infrastructure.

### Design Questions

**Q4: Design aggregate boundaries for an e-commerce order system**

Answer:
1. Order Aggregate
   - Aggregate Root: Order
   - Internal Entity: OrderItem
   - Value Objects: OrderId, Money, Address, OrderStatus

2. Design Principles:
   - Order references Customer via CustomerId, not containing Customer
   - OrderItem references Product via ProductId, not containing Product
   - One transaction modifies only one Order aggregate

3. Cross-Aggregate Coordination:
   - Use domain events for eventual consistency
   - OrderSubmittedEvent triggers inventory deduction
   - OrderConfirmedEvent triggers notification sending

**Q5: How do you handle cross-aggregate business rules?**

Answer:
1. If the rule requires strong consistency, consider adjusting aggregate boundaries
2. If eventual consistency is acceptable, use domain events
3. Use domain services to coordinate reading and validation across multiple aggregates
4. Use Saga pattern for long-running transactions

### Practical Questions

**Q6: How do you avoid anemic domain models?**

Answer:
1. Put business logic in entities and value objects
2. Use meaningful method names that express business intent
3. Validate invariants in constructors
4. Hide internal state, expose behavior through methods
5. Use specification pattern to encapsulate complex business rules

**Q7: Should repositories return domain objects or DTOs?**

Answer: Repositories should return complete domain objects (aggregate roots). Reasons:
1. Repositories are domain layer interfaces, should operate on domain objects
2. DTO conversion should happen in application or presentation layer
3. Domain objects contain business behavior, DTOs are just data carriers

### Scenario Questions

**Q8: When confirming an order, you need to verify sufficient inventory. How would you design this?**

```typescript
// Approach 1: Application layer coordination
class ConfirmOrderUseCase {
  async execute(orderId: OrderId): Promise<void> {
    const order = await this.orderRepository.getById(orderId);

    // Use domain service to verify inventory
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

// Approach 2: Using specification pattern
class InventoryAvailableSpecification {
  constructor(private inventoryService: InventoryService) {}

  async isSatisfiedBy(order: Order): Promise<boolean> {
    return this.inventoryService.checkAvailability(order.getItems());
  }
}
```

---

## Summary

DDD tactical design patterns are powerful tools for transforming business logic into high-quality code. By properly using Entities, Value Objects, Aggregates, Domain Services, Repositories, Factories, Domain Events, and Specifications, we can build software systems that accurately express business intent while maintaining excellent maintainability.

Key Takeaways:
1. **Entities** express business objects with lifecycles
2. **Value Objects** encapsulate concepts without identity
3. **Aggregates** define consistency boundaries
4. **Domain Services** handle cross-entity business logic
5. **Repositories** isolate persistence technology
6. **Factories** encapsulate complex creation logic
7. **Domain Events** enable decoupling and eventual consistency
8. **Specifications** explicitly express business rules

Mastering these patterns requires extensive practice. It's recommended to start with small projects and gradually apply and deepen understanding in real business scenarios.

---

## Further Reading

### Classic Books

1. **"Domain-Driven Design: Tackling Complexity in the Heart of Software"** - Eric Evans
   - The foundational work on DDD, essential reading

2. **"Implementing Domain-Driven Design"** - Vaughn Vernon
   - More practice-focused, includes extensive code examples

3. **"Domain-Driven Design Distilled"** - Vaughn Vernon
   - A condensed introduction to DDD

4. **"Patterns, Principles, and Practices of Domain-Driven Design"** - Scott Millett & Nick Tune
   - Comprehensive coverage with .NET examples

### Online Resources

- [Domain-Driven Design Reference](https://www.domainlanguage.com/ddd/reference/) - Eric Evans' official reference
- [Awesome DDD](https://github.com/heynickc/awesome-ddd) - Curated list of DDD resources
- [Martin Fowler's DDD Articles](https://martinfowler.com/tags/domain%20driven%20design.html) - Martin Fowler's DDD article collection
- [DDD Community](https://dddcommunity.org/) - DDD Community website

### Related Topics

- **CQRS (Command Query Responsibility Segregation)**: Separating read and write operations
- **Event Sourcing**: Rebuilding state through event sequences
- **Hexagonal Architecture**: Making domain models independent of technical infrastructure
- **Clean Architecture**: Dependency inversion, core business independent of frameworks

### Recommended Practice Projects

- [eShopOnContainers](https://github.com/dotnet-architecture/eShopOnContainers) - Microsoft's DDD sample project
- [EventFlow](https://github.com/eventflow/EventFlow) - DDD+CQRS+Event Sourcing framework
- [ddd-starter-modelling-process](https://github.com/ddd-crew/ddd-starter-modelling-process) - DDD modeling process guide
