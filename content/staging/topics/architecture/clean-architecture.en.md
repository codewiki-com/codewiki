---
title: Clean Architecture Complete Guide
description: Master Clean Architecture for maintainable software systems
track: architecture
section: design-patterns
difficulty: advanced
tags:
  - Clean Architecture
  - Layered
  - Dependency Inversion
  - Architecture
status: imported
origin: old/src/content/docs/architecture/clean-architecture.en.md
divergence: 0.214
issues: []
legacy:
  category: Architecture
  subcategory: Patterns
  order: 11
  lastUpdated: 2026-01-07
---

## Concept Overview

Clean Architecture is a software architecture pattern proposed by Robert C. Martin (Uncle Bob) in 2012. It synthesizes multiple classic architectural ideas, including Hexagonal Architecture (Ports and Adapters), Onion Architecture, and DCI Architecture, forming a unified set of architectural principles.

### Why Do We Need Clean Architecture?

In software development practice, we frequently face the following challenges:

1. **Framework Lock-in**: Business logic tightly coupled with specific frameworks, making framework changes costly
2. **Database Dependency**: Business rules closely tied to data storage mechanisms
3. **External Service Coupling**: Third-party API changes requiring extensive code modifications
4. **Testing Difficulties**: Needing to spin up complete environments just to test business logic
5. **UI Change Impact**: Interface modifications affecting core business code

The core goal of Clean Architecture is **Separation of Concerns**. Through proper layering and dependency management, the system achieves the following characteristics:

- **Framework Independence**: Frameworks are tools, not the architecture driver
- **Testability**: Business rules can be tested without UI, databases, or other external factors
- **UI Independence**: The UI can be easily swapped without affecting other system parts
- **Database Independence**: Different data storage solutions can be substituted
- **External Agency Independence**: Business rules do not depend on any external world interfaces

---

## Core Principles: The Concentric Circle Architecture

The most famous representation of Clean Architecture is the concentric circles diagram, divided into four main layers from inside to outside:

```
                    +---------------------------------------------+
                    |           Frameworks & Drivers               |
                    |  +-------------------------------------+    |
                    |  |        Interface Adapters            |    |
                    |  |  +-----------------------------+    |    |
                    |  |  |      Application Business    |    |    |
                    |  |  |        (Use Cases)          |    |    |
                    |  |  |  +-------------------+      |    |    |
                    |  |  |  |    Enterprise     |      |    |    |
                    |  |  |  |     Business      |      |    |    |
                    |  |  |  |    (Entities)     |      |    |    |
                    |  |  |  +-------------------+      |    |    |
                    |  |  +-----------------------------+    |    |
                    |  +-------------------------------------+    |
                    +---------------------------------------------+

                    Outer layers depend on inner layers.
                    Inner layers know nothing about outer layers.
```

### Entities Layer - The Innermost Circle

The Entities layer contains **enterprise-wide business rules** and is the most stable, core part of the entire system. Entities encapsulate the most general and high-level rules that would exist regardless of the application.

```typescript
// domain/entities/Order.ts
// Entity: Encapsulates enterprise business rules
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

  // Business rule: Calculate order total
  calculateTotal(): Money {
    return this.items.reduce(
      (total, item) => total.add(item.getSubtotal()),
      Money.zero()
    );
  }

  // Business rule: Add item to order
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

  // Business rule: Confirm order
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

  // Business rule: Cancel order
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
// Value Object: Immutable, compared by value
export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string
  ) {
    if (amount < 0) {
      throw new NegativeMoneyError(amount);
    }
  }

  static of(amount: number, currency: string = 'USD'): Money {
    return new Money(amount, currency);
  }

  static zero(currency: string = 'USD'): Money {
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

### Use Cases Layer - Application Business Rules

The Use Cases layer contains **application-specific business rules**. It orchestrates entities to accomplish specific business goals. This layer encapsulates and implements all the use cases of the system.

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

// Use Case interface (Input Port)
export interface CreateOrderUseCase {
  execute(input: CreateOrderInput): Promise<CreateOrderOutput>;
}

// Use Case implementation (Interactor)
export class CreateOrderInteractor implements CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly idGenerator: IdGenerator,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    // 1. Validate customer exists
    const customer = await this.customerRepository.findById(input.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(input.customerId);
    }

    // 2. Get product information and create order items
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

    // 3. Create order entity
    const orderId = this.idGenerator.generate();
    const order = new Order(orderId, input.customerId, orderItems);

    // 4. Persist order
    await this.orderRepository.save(order);

    // 5. Publish domain event
    await this.eventPublisher.publish(
      new OrderCreatedEvent(order.getId(), order.getCustomerId())
    );

    // 6. Return result
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
    // 1. Retrieve order
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    // 2. Verify payment
    const paymentValid = await this.paymentService.verify(input.paymentId);
    if (!paymentValid) {
      throw new PaymentVerificationFailedError(input.paymentId);
    }

    // 3. Check inventory
    for (const item of order.getItems()) {
      const available = await this.inventoryService.checkAvailability(
        item.productId,
        item.quantity
      );
      if (!available) {
        throw new InsufficientInventoryError(item.productId);
      }
    }

    // 4. Reserve inventory
    for (const item of order.getItems()) {
      await this.inventoryService.reserve(item.productId, item.quantity);
    }

    // 5. Confirm order (invoke entity business method)
    order.confirm();

    // 6. Save order
    await this.orderRepository.save(order);

    // 7. Publish event
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

### Interface Adapters Layer

The Interface Adapters layer handles **data format conversion**. It transforms external data formats into formats required by use cases, and vice versa. This layer contains Controllers, Presenters, and Gateways.

```typescript
// adapters/controllers/OrderController.ts
// Controller: Handles HTTP requests, invokes use cases
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly confirmOrderUseCase: ConfirmOrderUseCase,
    private readonly getOrderUseCase: GetOrderUseCase
  ) {}

  // POST /orders
  async createOrder(req: HttpRequest): Promise<HttpResponse> {
    try {
      // 1. Parse request data
      const input: CreateOrderInput = {
        customerId: req.body.customerId,
        items: req.body.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      // 2. Execute use case
      const output = await this.createOrderUseCase.execute(input);

      // 3. Transform to HTTP response
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
    // Unknown error
    console.error('Unexpected error:', error);
    return { statusCode: 500, body: { error: 'Internal server error' } };
  }
}
```

```typescript
// adapters/presenters/OrderPresenter.ts
// Presenter: Transforms use case output to view models
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
    return `$${amount.toFixed(2)}`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pending Confirmation',
      CONFIRMED: 'Confirmed',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled'
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
// Repository Implementation: Transforms domain objects to database records
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

  // Database Entity -> Domain Object
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

  // Domain Object -> Database Entity
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

### Frameworks & Drivers Layer - The Outermost Circle

This is the outermost layer, containing all technical details: web frameworks, databases, external services, etc. This is where all the details go. The web is a detail. The database is a detail.

```typescript
// infrastructure/web/ExpressApp.ts
import express from 'express';

export function createExpressApp(
  orderController: OrderController
): express.Application {
  const app = express();

  app.use(express.json());

  // Route configuration
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
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency.toLowerCase()
    });
    return paymentIntent.id;
  }
}
```

---

## The Dependency Rule

The most important rule in Clean Architecture is **The Dependency Rule**:

> **Source code dependencies can only point inward. Nothing in an inner circle can know anything at all about something in an outer circle.**

```
                Outer Layers                           Inner Layers
    +----------------------+             +----------------------+
    |                      |             |                      |
    |   Frameworks         |-----------> |     Entities         |
    |   Controllers        |             |     Use Cases        |
    |   Repositories Impl  |             |     Interfaces       |
    |                      |             |                      |
    +----------------------+             +----------------------+

    Outer layers know about              Inner layers know nothing
    inner layers                         about outer layers
```

### Applying Dependency Inversion Principle

To comply with the Dependency Rule, we extensively use the **Dependency Inversion Principle (DIP)**:

```typescript
// application/ports/OrderRepository.ts
// Interface defined in inner layer (Use Cases layer)
export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
  findByCustomerId(customerId: string): Promise<Order[]>;
}

// adapters/repositories/TypeOrmOrderRepository.ts
// Implementation in outer layer (Adapters layer)
export class TypeOrmOrderRepository implements OrderRepository {
  // ... implementation details
}
```

```typescript
// application/ports/PaymentService.ts
// External service interface defined in inner layer
export interface PaymentService {
  verify(paymentId: string): Promise<boolean>;
  createPaymentIntent(amount: number, currency: string): Promise<string>;
}

// infrastructure/services/StripePaymentService.ts
// Concrete implementation in outer layer
export class StripePaymentService implements PaymentService {
  // ... Stripe-specific implementation
}
```

### Crossing Boundaries

When control flow needs to cross boundaries, we use **interfaces** and **dependency injection**:

```typescript
// main.ts - Composition Root
async function bootstrap() {
  // Initialize data source
  await AppDataSource.initialize();

  // Create infrastructure components
  const idGenerator = new UuidIdGenerator();
  const eventPublisher = new RabbitMQEventPublisher();

  // Create repositories
  const orderRepository = new TypeOrmOrderRepository(
    AppDataSource.getRepository(OrderEntity)
  );
  const productRepository = new TypeOrmProductRepository(
    AppDataSource.getRepository(ProductEntity)
  );
  const customerRepository = new TypeOrmCustomerRepository(
    AppDataSource.getRepository(CustomerEntity)
  );

  // Create external services
  const paymentService = new StripePaymentService();
  const inventoryService = new InventoryServiceClient();

  // Create use cases
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

  // Create controllers
  const orderController = new OrderController(
    createOrderUseCase,
    confirmOrderUseCase,
    getOrderUseCase
  );

  // Create and start application
  const app = createExpressApp(orderController);

  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}

bootstrap();
```

---

## Comparison with Hexagonal Architecture

Clean Architecture and Hexagonal Architecture share many similarities but have some key differences:

```
              Hexagonal Architecture                Clean Architecture
    +-------------------------+       +-------------------------+
    |                         |       |      Frameworks          |
    |  +-------------------+  |       |  +-------------------+  |
    |  |    Adapters       |  |       |  |  Interface         |  |
    |  |  +-----------+    |  |       |  |   Adapters         |  |
    |  |  |           |    |  |       |  |  +-----------+    |  |
    |  |  |   Core    |    |  |       |  |  | Use Cases |    |  |
    |  |  |  Domain   |    |  |       |  |  |+---------+|    |  |
    |  |  |           |    |  |       |  |  ||Entities ||    |  |
    |  |  +-----------+    |  |       |  |  |+---------+|    |  |
    |  +-------------------+  |       |  |  +-----------+    |  |
    |                         |       |  +-------------------+  |
    +-------------------------+       +-------------------------+

    Two-layer structure:                Four-layer structure:
    - Core Domain (Ports)               - Entities
    - Adapters                          - Use Cases
                                        - Interface Adapters
                                        - Frameworks & Drivers
```

### Key Differences

| Aspect | Hexagonal Architecture | Clean Architecture |
|--------|------------------------|-------------------|
| Number of Layers | 2 layers (Core + Adapters) | 4 explicitly defined layers |
| Focus | Ports and Adapters | Dependency direction and layer responsibilities |
| Entities vs Use Cases | Combined in core domain | Explicitly separated |
| Visualization | Hexagon | Concentric circles |
| Formality | More flexible | More prescriptive |

### How to Choose?

```typescript
// Hexagonal Architecture style - emphasizes ports
interface OrderPort {
  createOrder(command: CreateOrderCommand): Promise<OrderId>;
  findOrder(query: FindOrderQuery): Promise<OrderReadModel>;
}

// Clean Architecture style - emphasizes use case separation
interface CreateOrderUseCase {
  execute(input: CreateOrderInput): Promise<CreateOrderOutput>;
}

interface FindOrderUseCase {
  execute(input: FindOrderInput): Promise<FindOrderOutput>;
}
```

In practice, both architectures can be mixed. What matters is understanding the core principles: **isolate business logic and control dependency direction**.

---

## Complete Order System Example

### Project Structure

```
src/
├── domain/                          # Entities Layer
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
├── application/                     # Use Cases Layer
│   ├── use-cases/
│   │   ├── CreateOrderUseCase.ts
│   │   ├── ConfirmOrderUseCase.ts
│   │   ├── CancelOrderUseCase.ts
│   │   └── GetOrderUseCase.ts
│   ├── ports/                       # Interface definitions
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
├── adapters/                        # Interface Adapters Layer
│   ├── controllers/
│   │   └── OrderController.ts
│   ├── presenters/
│   │   └── OrderPresenter.ts
│   ├── repositories/
│   │   └── TypeOrmOrderRepository.ts
│   └── gateways/
│       └── OrderApiGateway.ts
│
├── infrastructure/                  # Frameworks & Drivers Layer
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
└── main.ts                          # Composition Root
```

### Cancel Order Use Case - Complete Implementation

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
    // 1. Retrieve order
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    // 2. Execute domain logic (entity method)
    order.cancel();

    // 3. Release inventory
    for (const item of order.getItems()) {
      await this.inventoryService.release(item.productId, item.quantity);
    }

    // 4. Initiate refund (if already paid)
    let refundInitiated = false;
    if (order.isPaid()) {
      await this.paymentService.refund(order.getPaymentId()!);
      refundInitiated = true;
    }

    // 5. Save order
    await this.orderRepository.save(order);

    // 6. Send notification
    await this.notificationService.sendOrderCancelled(
      order.getCustomerId(),
      order.getId(),
      input.reason
    );

    // 7. Publish domain event
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

## Testing Strategy

One major advantage of Clean Architecture is **testability**. Different layers have different testing strategies:

### Entities Layer Testing (Unit Tests)

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

### Use Cases Layer Testing (Integration Tests with Mocks)

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

### Adapters Layer Testing (Integration Tests)

```typescript
// adapters/repositories/__tests__/TypeOrmOrderRepository.test.ts
describe('TypeOrmOrderRepository', () => {
  let repository: TypeOrmOrderRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Use test database
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
    // Clean data
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

### End-to-End Tests

```typescript
// e2e/order.e2e.test.ts
describe('Order API E2E', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('should create and confirm order', async () => {
    // Create order
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

    // Confirm order
    const confirmResponse = await request(app)
      .post(`/api/orders/${orderId}/confirm`)
      .send({
        paymentId: 'payment-123'
      });

    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body.data.status).toBe('CONFIRMED');

    // Query order
    const getResponse = await request(app)
      .get(`/api/orders/${orderId}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.status).toBe('CONFIRMED');
  });
});
```

---

## Interview Key Points

### What is Clean Architecture? What are its core ideas?

**Answer**: Clean Architecture is a software architecture pattern proposed by Robert C. Martin. Its core ideas are **Separation of Concerns** and **Dependency Direction Control**. It divides the system into four concentric circle layers: Entities, Use Cases, Interface Adapters, and Frameworks & Drivers. The most important rule is **The Dependency Rule**: source code dependencies can only point inward; inner layers know nothing about outer layers.

### What are the four layers of Clean Architecture? What are their responsibilities?

**Answer**:
- **Entities Layer**: Contains enterprise-wide business rules, the most stable part
- **Use Cases Layer**: Contains application-specific business rules, orchestrates entities to achieve business goals
- **Interface Adapters Layer**: Data format conversion, includes Controllers, Presenters, Repository implementations
- **Frameworks & Drivers Layer**: Technical details like web frameworks, databases, external services

### How do you implement the Dependency Rule?

**Answer**: Through the **Dependency Inversion Principle (DIP)**. Define interfaces (abstractions) in inner layers, provide implementations in outer layers. For example, the `OrderRepository` interface is defined in the Use Cases layer, while `TypeOrmOrderRepository` implementation resides in the Adapters layer. Through dependency injection, outer layer implementations are injected for use in inner layers.

### What are the differences between Clean Architecture and Hexagonal Architecture?

**Answer**:
- Hexagonal Architecture has a two-layer structure (Core Domain + Adapters), Clean Architecture has four layers
- Hexagonal Architecture emphasizes Ports and Adapters concepts, Clean Architecture emphasizes layer hierarchy and dependency direction
- Clean Architecture explicitly separates Entities from Use Cases, Hexagonal Architecture typically combines them in the core domain
- Both share the same core philosophy: isolate business logic, control dependency direction

### What is the difference between Entities and Use Cases?

**Answer**:
- **Entities** contain **enterprise-wide business rules** - universal rules across applications, e.g., "an order must have items before confirmation"
- **Use Cases** contain **application-specific business rules** - business flows for a specific application, e.g., "creating an order requires validating customer, checking inventory, sending notifications"
- Entities are more stable and rarely change; Use Cases may change with application requirements

### How do you test systems built with Clean Architecture?

**Answer**:
- **Entities Layer**: Pure unit tests, no mocking needed
- **Use Cases Layer**: Use mock objects to replace external dependencies, test business logic orchestration
- **Adapters Layer**: Integration tests, use test databases or mock services
- **End-to-End Tests**: Test complete flows
- Inner layer code is very easy to test because it has no external dependencies

### What is the Composition Root?

**Answer**: The Composition Root is the **single place in the application where all dependencies are assembled**, typically the `main` function or bootstrap module. Here, all concrete implementations are created and connected through dependency injection. This approach centralizes dependency configuration management, making it easy to switch implementations (e.g., switching databases, switching to test environments).

### What are the disadvantages of Clean Architecture?

**Answer**:
- **Increased code volume**: Requires defining many interfaces and DTOs
- **Learning curve**: Team needs to understand architectural principles
- **Over-engineering risk**: Simple projects may not need so many layers
- **Data conversion overhead**: Layer-to-layer data conversion has some performance cost
- **Slower initial development**: Building the architecture takes time upfront

### What scenarios are suitable for Clean Architecture?

**Answer**:
- Systems with complex business logic
- Projects requiring long-term maintenance
- Projects that may need technology stack changes
- Projects requiring high test coverage
- Larger teams needing clear boundaries

Simple CRUD applications, prototypes, and short-term projects may not need Clean Architecture.

### How do you handle cross-layer data transfer?

**Answer**:
- Use **DTOs (Data Transfer Objects)** to pass data between layers
- Each layer defines its own data structures, converting at boundaries
- Avoid exposing entities directly to outer layers, use Presenters to transform
- Input/Output objects define the input and output formats for use cases

---

## Summary

Clean Architecture is an architectural pattern emphasizing **dependency direction control** and **separation of concerns**. By dividing the system into Entities, Use Cases, Interface Adapters, and Frameworks & Drivers layers, and strictly following the Dependency Rule, we can build systems that are:

1. **Testable**: Core business logic can be tested without external dependencies
2. **Maintainable**: Changes are confined to specific layers, not rippling through the entire system
3. **Flexible**: Frameworks, databases, and external services can be easily swapped
4. **Independent**: Business logic is unaffected by technical decisions

Remember Uncle Bob's famous quote:

> "The job of the architect is not to make decisions, but to defer decisions for as long as possible."

Clean Architecture is precisely the architectural approach that allows us to defer technical decisions and focus on business value.

---

## Further Reading

### Books

- **"Clean Architecture: A Craftsman's Guide to Software Structure and Design"** - Robert C. Martin
- **"Implementing Domain-Driven Design"** - Vaughn Vernon
- **"Domain-Driven Design: Tackling Complexity in the Heart of Software"** - Eric Evans
- **"Patterns of Enterprise Application Architecture"** - Martin Fowler

### Online Resources

- [The Clean Architecture - Uncle Bob's Blog](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Clean Architecture on Wikipedia](https://en.wikipedia.org/wiki/Clean_architecture)
- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)

### Related Topics

- Hexagonal Architecture (Ports and Adapters)
- Onion Architecture
- Domain-Driven Design (DDD)
- SOLID Principles
- Dependency Injection Containers
- CQRS (Command Query Responsibility Segregation)
- Event Sourcing
