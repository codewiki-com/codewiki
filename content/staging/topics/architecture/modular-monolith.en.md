---
title: Modular Monolith Architecture
description: Learn modular monolith architecture as an alternative to microservices
track: architecture
section: design-patterns
difficulty: intermediate
tags:
  - modular monolith
  - architecture
  - microservices alternative
  - decoupling
status: imported
origin: old/src/content/docs/architecture/modular-monolith.en.md
divergence: 0.23
issues: []
legacy:
  category: Architecture
  subcategory: Patterns
  order: 20
  lastUpdated: 2026-01-07
---

## Introduction

Modular Monolith is an architectural style that combines the simplicity of monolithic deployment with the organizational benefits of well-defined module boundaries. It represents a middle ground between traditional monoliths and distributed microservices, offering many advantages of both approaches while avoiding their most significant drawbacks.

The term gained prominence through the work of Simon Brown and has been advocated by many thought leaders including Martin Fowler, who suggests that most systems should start as well-structured monoliths before considering microservices decomposition.

## Monolith vs Microservices vs Modular Monolith

Understanding how modular monoliths fit into the architectural landscape requires comparing them with their alternatives.

### Traditional Monolith

A traditional monolith is a single deployable unit where all code is tightly coupled:

```
+------------------------------------------+
|           Traditional Monolith            |
|                                          |
|  +--------+--------+--------+--------+   |
|  | Users  | Orders |Products|Payments|   |
|  +--------+--------+--------+--------+   |
|  |            Shared Code             |   |
|  +------------------------------------+   |
|  |          Shared Database           |   |
|  +------------------------------------+   |
+------------------------------------------+

- All modules directly access each other
- Shared database with no boundaries
- Any change can affect everything
```

**Problems:**
- High coupling between components
- Difficult to understand and maintain as it grows
- Changes in one area can break unrelated features
- Hard to scale development across multiple teams
- Monolithic thinking leads to spaghetti code

### Microservices

Microservices split the application into independently deployable services:

```
+------------+    +------------+    +------------+
|   Users    |    |   Orders   |    |  Products  |
|  Service   |    |  Service   |    |  Service   |
+-----+------+    +-----+------+    +-----+------+
      |                 |                 |
      v                 v                 v
+------------+    +------------+    +------------+
|  Users DB  |    |  Orders DB |    | Products DB|
+------------+    +------------+    +------------+

- Independent deployment and scaling
- Technology heterogeneity
- Complex distributed systems challenges
```

**Problems:**
- Network latency and reliability issues
- Distributed transaction complexity
- Operational overhead (deployment, monitoring, debugging)
- Data consistency challenges
- Requires mature DevOps capabilities

### Modular Monolith

A modular monolith maintains a single deployable unit but enforces strict module boundaries:

```
+--------------------------------------------------+
|              Modular Monolith                     |
|                                                  |
|  +----------+  +----------+  +----------+        |
|  |  Users   |  |  Orders  |  | Products |        |
|  |  Module  |  |  Module  |  |  Module  |        |
|  |          |  |          |  |          |        |
|  | +------+ |  | +------+ |  | +------+ |        |
|  | |Public| |  | |Public| |  | |Public| |        |
|  | | API  | |  | | API  | |  | | API  | |        |
|  | +------+ |  | +------+ |  | +------+ |        |
|  +----+-----+  +----+-----+  +----+-----+        |
|       |             |             |              |
|       v             v             v              |
|  +----------+  +----------+  +----------+        |
|  |  Users   |  |  Orders  |  | Products |        |
|  |  Schema  |  |  Schema  |  |  Schema  |        |
|  +----------+  +----------+  +----------+        |
|  +------------------------------------------+   |
|  |           Shared Database                 |   |
|  +------------------------------------------+   |
+--------------------------------------------------+

- Single deployment unit
- Strong module boundaries
- Communication through defined interfaces
- Shared database with schema separation
```

### Comparison Overview

| Aspect | Traditional Monolith | Modular Monolith | Microservices |
|--------|---------------------|------------------|---------------|
| Deployment | Single unit | Single unit | Multiple units |
| Module Boundaries | None/Weak | Strong, enforced | Service boundaries |
| Communication | Direct method calls | In-process APIs | Network calls |
| Data Consistency | ACID transactions | ACID transactions | Eventual consistency |
| Operational Complexity | Low | Low | High |
| Team Scalability | Limited | Good | Excellent |
| Technology Flexibility | Single stack | Single stack | Heterogeneous |
| Initial Complexity | Low | Medium | High |
| Refactoring Ease | Difficult | Moderate | Difficult |

## Module Boundaries

The key differentiator of a modular monolith is its strong, enforced module boundaries. Without proper boundaries, a modular monolith degrades into a traditional monolith.

### Defining Module Boundaries

Module boundaries should be defined based on business capabilities, following Domain-Driven Design (DDD) principles:

```
+----------------------------------------------------------------+
|                    E-Commerce Application                       |
|                                                                 |
|  +------------------+  +------------------+  +----------------+ |
|  |    Catalog       |  |     Orders       |  |   Customers    | |
|  |     Module       |  |     Module       |  |    Module      | |
|  |                  |  |                  |  |                | |
|  | - Products       |  | - Order Mgmt     |  | - Registration | |
|  | - Categories     |  | - Cart           |  | - Profiles     | |
|  | - Pricing        |  | - Checkout       |  | - Addresses    | |
|  | - Inventory      |  | - Fulfillment    |  | - Preferences  | |
|  +------------------+  +------------------+  +----------------+ |
|                                                                 |
|  +------------------+  +------------------+  +----------------+ |
|  |    Payments      |  |   Notifications  |  |   Analytics    | |
|  |     Module       |  |     Module       |  |    Module      | |
|  |                  |  |                  |  |                | |
|  | - Processing     |  | - Email          |  | - Reporting    | |
|  | - Refunds        |  | - SMS            |  | - Dashboards   | |
|  | - Reconciliation |  | - Push           |  | - Tracking     | |
|  +------------------+  +------------------+  +----------------+ |
+----------------------------------------------------------------+
```

### Module Structure

Each module should have a clear internal structure:

```
src/
├── modules/
│   ├── catalog/
│   │   ├── api/                    # Public API (facades, DTOs)
│   │   │   ├── CatalogFacade.ts
│   │   │   ├── ProductDTO.ts
│   │   │   └── index.ts            # Explicit exports
│   │   │
│   │   ├── application/            # Use cases
│   │   │   ├── CreateProductUseCase.ts
│   │   │   └── UpdateInventoryUseCase.ts
│   │   │
│   │   ├── domain/                 # Domain model
│   │   │   ├── entities/
│   │   │   │   ├── Product.ts
│   │   │   │   └── Category.ts
│   │   │   ├── value-objects/
│   │   │   │   └── Price.ts
│   │   │   └── events/
│   │   │       └── ProductCreatedEvent.ts
│   │   │
│   │   ├── infrastructure/         # Technical concerns
│   │   │   ├── persistence/
│   │   │   │   └── ProductRepository.ts
│   │   │   └── http/
│   │   │       └── ProductController.ts
│   │   │
│   │   └── internal/               # Private implementation
│   │       └── PricingService.ts
│   │
│   ├── orders/
│   │   ├── api/
│   │   ├── application/
│   │   ├── domain/
│   │   └── infrastructure/
│   │
│   └── shared/                     # Shared kernel
│       ├── domain/
│       │   └── Money.ts
│       └── infrastructure/
│           └── EventBus.ts
```

### Implementing Module Boundaries in TypeScript

```typescript
// modules/catalog/api/index.ts
// Only export what should be public
export { CatalogFacade } from './CatalogFacade';
export { ProductDTO, ProductListDTO } from './ProductDTO';
export { CategoryDTO } from './CategoryDTO';
export type { CreateProductRequest, UpdateProductRequest } from './requests';

// Internal implementations are NOT exported
// Other modules CANNOT import from internal paths
```

```typescript
// modules/catalog/api/CatalogFacade.ts
// The public interface for the catalog module
export class CatalogFacade {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly updateInventoryUseCase: UpdateInventoryUseCase
  ) {}

  async createProduct(request: CreateProductRequest): Promise<ProductDTO> {
    const product = await this.createProductUseCase.execute(request);
    return ProductDTO.fromDomain(product);
  }

  async getProduct(productId: string): Promise<ProductDTO | null> {
    const product = await this.getProductUseCase.execute(productId);
    return product ? ProductDTO.fromDomain(product) : null;
  }

  async getProductsForOrder(productIds: string[]): Promise<ProductListDTO> {
    // Optimized method for order module
    const products = await this.getProductUseCase.executeMany(productIds);
    return ProductListDTO.fromDomain(products);
  }

  async reserveInventory(productId: string, quantity: number): Promise<boolean> {
    return this.updateInventoryUseCase.reserve(productId, quantity);
  }

  async releaseInventory(productId: string, quantity: number): Promise<void> {
    await this.updateInventoryUseCase.release(productId, quantity);
  }
}
```

```typescript
// modules/catalog/api/ProductDTO.ts
// Data Transfer Object - decouples internal model from external contracts
export class ProductDTO {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly currency: string,
    public readonly availableQuantity: number,
    public readonly categoryId: string,
    public readonly isActive: boolean
  ) {}

  static fromDomain(product: Product): ProductDTO {
    return new ProductDTO(
      product.getId(),
      product.getName(),
      product.getDescription(),
      product.getPrice().getAmount(),
      product.getPrice().getCurrency(),
      product.getInventory().getAvailable(),
      product.getCategoryId(),
      product.isActive()
    );
  }
}
```

### Enforcing Boundaries with Architecture Tests

```typescript
// tests/architecture/module-boundaries.test.ts
import { Project, SyntaxKind } from 'ts-morph';

describe('Module Boundary Enforcement', () => {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json'
  });

  const modules = ['catalog', 'orders', 'customers', 'payments', 'notifications'];

  it('should not import internal module code directly', () => {
    const violations: string[] = [];

    for (const sourceFile of project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();
      const fileModule = modules.find(m => filePath.includes(`/modules/${m}/`));

      if (!fileModule) continue;

      const imports = sourceFile.getImportDeclarations();

      for (const imp of imports) {
        const moduleSpecifier = imp.getModuleSpecifierValue();

        for (const otherModule of modules) {
          if (otherModule === fileModule) continue;

          // Check for direct imports of internal module code
          if (
            moduleSpecifier.includes(`/modules/${otherModule}/`) &&
            !moduleSpecifier.includes(`/modules/${otherModule}/api`)
          ) {
            violations.push(
              `${filePath} imports internal code from ${otherModule}: ${moduleSpecifier}`
            );
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('should only export through api/index.ts', () => {
    const violations: string[] = [];

    for (const module of modules) {
      const apiIndexPath = `./src/modules/${module}/api/index.ts`;
      const apiIndex = project.getSourceFile(apiIndexPath);

      if (!apiIndex) {
        violations.push(`Module ${module} missing api/index.ts`);
        continue;
      }

      // Verify exports are properly defined
      const exports = apiIndex.getExportDeclarations();
      if (exports.length === 0) {
        const exportStatements = apiIndex.getStatements().filter(
          s => s.getKind() === SyntaxKind.ExportDeclaration ||
               s.getText().startsWith('export')
        );
        if (exportStatements.length === 0) {
          violations.push(`Module ${module} has no exports in api/index.ts`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
```

### Using ESLint for Boundary Enforcement

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['import', 'boundaries'],
  settings: {
    'boundaries/elements': [
      { type: 'catalog', pattern: 'src/modules/catalog/*' },
      { type: 'orders', pattern: 'src/modules/orders/*' },
      { type: 'customers', pattern: 'src/modules/customers/*' },
      { type: 'payments', pattern: 'src/modules/payments/*' },
      { type: 'shared', pattern: 'src/modules/shared/*' },
    ],
    'boundaries/ignore': ['**/*.test.ts', '**/*.spec.ts'],
  },
  rules: {
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          // Modules can only import from other modules' api folders
          {
            from: 'catalog',
            allow: [
              ['orders', { importKind: 'value', pattern: 'api/*' }],
              ['shared', { importKind: 'value' }],
            ],
          },
          {
            from: 'orders',
            allow: [
              ['catalog', { importKind: 'value', pattern: 'api/*' }],
              ['customers', { importKind: 'value', pattern: 'api/*' }],
              ['payments', { importKind: 'value', pattern: 'api/*' }],
              ['shared', { importKind: 'value' }],
            ],
          },
          // Shared can be imported by anyone
          {
            from: ['catalog', 'orders', 'customers', 'payments'],
            allow: [['shared']],
          },
        ],
      },
    ],
  },
};
```

## Inter-Module Communication

Modules in a modular monolith communicate through well-defined interfaces. There are several patterns for this communication.

### Synchronous Communication via Facades

The simplest approach is direct method calls through module facades:

```typescript
// modules/orders/application/CreateOrderUseCase.ts
export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly catalogFacade: CatalogFacade,  // Import from catalog module
    private readonly customerFacade: CustomerFacade, // Import from customer module
    private readonly paymentFacade: PaymentFacade    // Import from payment module
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    // 1. Validate customer exists
    const customer = await this.customerFacade.getCustomer(input.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(input.customerId);
    }

    // 2. Get product information and validate availability
    const products = await this.catalogFacade.getProductsForOrder(
      input.items.map(i => i.productId)
    );

    // 3. Reserve inventory (synchronous within same transaction)
    for (const item of input.items) {
      const reserved = await this.catalogFacade.reserveInventory(
        item.productId,
        item.quantity
      );
      if (!reserved) {
        throw new InsufficientInventoryError(item.productId);
      }
    }

    // 4. Create order
    const order = Order.create(
      this.idGenerator.generate(),
      input.customerId,
      input.items.map(item => {
        const product = products.find(p => p.id === item.productId)!;
        return OrderItem.create(
          item.productId,
          item.quantity,
          Money.of(product.price, product.currency)
        );
      })
    );

    // 5. Save order
    await this.orderRepository.save(order);

    return CreateOrderOutput.from(order);
  }
}
```

### Asynchronous Communication via Events

For loosely coupled communication, use domain events:

```typescript
// modules/shared/infrastructure/EventBus.ts
export interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly eventType: string;
}

export interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

export interface EventBus {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void;
}

// In-process event bus implementation
export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, EventHandler<any>[]> = new Map();

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    const existing = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];

    // Execute handlers asynchronously but wait for completion
    await Promise.all(
      handlers.map(handler => handler.handle(event))
    );
  }
}
```

```typescript
// modules/orders/domain/events/OrderCreatedEvent.ts
export class OrderCreatedEvent implements DomainEvent {
  readonly eventType = 'OrderCreated';
  readonly eventId: string;
  readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly customerId: string,
    public readonly items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>,
    public readonly totalAmount: number
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date();
  }
}
```

```typescript
// modules/orders/application/CreateOrderUseCase.ts
export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly catalogFacade: CatalogFacade,
    private readonly eventBus: EventBus
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    // ... create order logic ...

    await this.orderRepository.save(order);

    // Publish event for other modules to react
    await this.eventBus.publish(
      new OrderCreatedEvent(
        order.getId(),
        order.getCustomerId(),
        order.getItems().map(item => ({
          productId: item.getProductId(),
          quantity: item.getQuantity(),
          unitPrice: item.getUnitPrice().getAmount()
        })),
        order.getTotal().getAmount()
      )
    );

    return CreateOrderOutput.from(order);
  }
}
```

```typescript
// modules/notifications/application/handlers/OrderCreatedHandler.ts
export class OrderCreatedHandler implements EventHandler<OrderCreatedEvent> {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly customerFacade: CustomerFacade
  ) {}

  async handle(event: OrderCreatedEvent): Promise<void> {
    const customer = await this.customerFacade.getCustomer(event.customerId);
    if (!customer) return;

    await this.notificationService.sendEmail({
      to: customer.email,
      template: 'order-confirmation',
      data: {
        orderId: event.aggregateId,
        customerName: customer.name,
        totalAmount: event.totalAmount,
        items: event.items
      }
    });
  }
}

// modules/analytics/application/handlers/OrderCreatedHandler.ts
export class OrderAnalyticsHandler implements EventHandler<OrderCreatedEvent> {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async handle(event: OrderCreatedEvent): Promise<void> {
    await this.analyticsRepository.recordOrderCreated({
      orderId: event.aggregateId,
      customerId: event.customerId,
      totalAmount: event.totalAmount,
      itemCount: event.items.length,
      timestamp: event.occurredAt
    });
  }
}
```

### Mediator Pattern

For more complex scenarios, use a mediator to decouple request/response handling:

```typescript
// modules/shared/infrastructure/Mediator.ts
export interface Request<TResponse> {
  readonly requestType: string;
}

export interface RequestHandler<TRequest extends Request<TResponse>, TResponse> {
  handle(request: TRequest): Promise<TResponse>;
}

export interface Mediator {
  send<TResponse>(request: Request<TResponse>): Promise<TResponse>;
}

export class InMemoryMediator implements Mediator {
  private handlers: Map<string, RequestHandler<any, any>> = new Map();

  register<TRequest extends Request<TResponse>, TResponse>(
    requestType: string,
    handler: RequestHandler<TRequest, TResponse>
  ): void {
    this.handlers.set(requestType, handler);
  }

  async send<TResponse>(request: Request<TResponse>): Promise<TResponse> {
    const handler = this.handlers.get(request.requestType);
    if (!handler) {
      throw new Error(`No handler registered for ${request.requestType}`);
    }
    return handler.handle(request);
  }
}
```

```typescript
// modules/catalog/api/queries/GetProductQuery.ts
export class GetProductQuery implements Request<ProductDTO | null> {
  readonly requestType = 'Catalog.GetProduct';

  constructor(public readonly productId: string) {}
}

// modules/catalog/application/handlers/GetProductQueryHandler.ts
export class GetProductQueryHandler
  implements RequestHandler<GetProductQuery, ProductDTO | null>
{
  constructor(private readonly productRepository: ProductRepository) {}

  async handle(query: GetProductQuery): Promise<ProductDTO | null> {
    const product = await this.productRepository.findById(query.productId);
    return product ? ProductDTO.fromDomain(product) : null;
  }
}

// Usage in orders module
export class CreateOrderUseCase {
  constructor(private readonly mediator: Mediator) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    // Use mediator instead of direct facade call
    const product = await this.mediator.send(
      new GetProductQuery(input.productId)
    );
    // ...
  }
}
```

### Communication Pattern Comparison

| Pattern | Coupling | Complexity | Transaction Support | Use Case |
|---------|----------|------------|---------------------|----------|
| Facade | Medium | Low | Full ACID | Simple queries, commands |
| Events | Low | Medium | Eventual | Notifications, side effects |
| Mediator | Low | Medium | Full ACID | Complex orchestration |

## Shared Kernel

The Shared Kernel is code that is intentionally shared between modules. It should be minimal and contain only truly common concepts.

### What Belongs in Shared Kernel

```
modules/shared/
├── domain/
│   ├── value-objects/
│   │   ├── Money.ts           # Currency and monetary calculations
│   │   ├── Email.ts           # Email validation
│   │   ├── PhoneNumber.ts     # Phone number formatting
│   │   └── Address.ts         # Address structure
│   │
│   ├── primitives/
│   │   ├── Entity.ts          # Base entity class
│   │   ├── AggregateRoot.ts   # Aggregate root with events
│   │   ├── ValueObject.ts     # Value object base
│   │   └── DomainEvent.ts     # Domain event interface
│   │
│   └── errors/
│       ├── DomainError.ts     # Base domain error
│       └── ValidationError.ts # Validation error
│
├── application/
│   ├── UseCase.ts             # Use case interface
│   └── UnitOfWork.ts          # Unit of work pattern
│
└── infrastructure/
    ├── EventBus.ts            # Event bus interface
    ├── Mediator.ts            # Mediator interface
    └── IdGenerator.ts         # ID generation
```

### Implementing Shared Domain Primitives

```typescript
// modules/shared/domain/primitives/Entity.ts
export abstract class Entity<TId> {
  protected constructor(protected readonly _id: TId) {}

  get id(): TId {
    return this._id;
  }

  equals(other: Entity<TId>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (this === other) {
      return true;
    }
    return this._id === other._id;
  }
}
```

```typescript
// modules/shared/domain/primitives/AggregateRoot.ts
export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
```

```typescript
// modules/shared/domain/value-objects/Money.ts
export class Money extends ValueObject {
  private constructor(
    private readonly amount: number,
    private readonly currency: string
  ) {
    super();
    this.validate();
  }

  private validate(): void {
    if (this.amount < 0) {
      throw new ValidationError('Money amount cannot be negative');
    }
    if (!['USD', 'EUR', 'GBP'].includes(this.currency)) {
      throw new ValidationError(`Unsupported currency: ${this.currency}`);
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

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new ValidationError('Subtraction would result in negative money');
    }
    return new Money(result, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new ValidationError('Cannot multiply by negative factor');
    }
    return new Money(this.amount * factor, this.currency);
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new ValidationError(
        `Cannot operate on different currencies: ${this.currency} and ${other.currency}`
      );
    }
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  protected getEqualityComponents(): unknown[] {
    return [this.amount, this.currency];
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}
```

### Rules for Shared Kernel

1. **Keep it minimal**: Only share what is truly common
2. **High stability**: Changes to shared kernel affect all modules
3. **No business logic**: Only technical primitives and value objects
4. **Version carefully**: Consider the shared kernel as a contract
5. **Team ownership**: Assign clear ownership for changes

```typescript
// GOOD: Generic value objects in shared kernel
class Money { /* ... */ }
class Email { /* ... */ }
class DateRange { /* ... */ }

// BAD: Business-specific concepts should NOT be in shared kernel
class OrderStatus { /* ... */ }  // Move to orders module
class CustomerTier { /* ... */ } // Move to customers module
class ProductCategory { /* ... */ } // Move to catalog module
```

## Data Management

In a modular monolith, data management strategies determine how well modules stay decoupled.

### Schema-per-Module Pattern

Each module owns its database schema, even within a shared database:

```sql
-- Catalog module schema
CREATE SCHEMA catalog;

CREATE TABLE catalog.products (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_amount DECIMAL(10, 2) NOT NULL,
    price_currency VARCHAR(3) NOT NULL,
    category_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE catalog.categories (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES catalog.categories(id)
);

CREATE TABLE catalog.inventory (
    product_id UUID PRIMARY KEY REFERENCES catalog.products(id),
    available_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders module schema
CREATE SCHEMA orders;

CREATE TABLE orders.orders (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,  -- Reference by ID only, no FK
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    total_currency VARCHAR(3) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders.order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders.orders(id),
    product_id UUID NOT NULL,   -- Reference by ID only, no FK
    quantity INTEGER NOT NULL,
    unit_price_amount DECIMAL(10, 2) NOT NULL,
    unit_price_currency VARCHAR(3) NOT NULL
);

-- Customers module schema
CREATE SCHEMA customers;

CREATE TABLE customers.customers (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE customers.addresses (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers.customers(id),
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) NOT NULL,
    is_default BOOLEAN DEFAULT false
);
```

### Cross-Module Data Access Rules

```typescript
// RULE 1: Never create foreign keys across module schemas
// BAD
CREATE TABLE orders.orders (
    customer_id UUID REFERENCES customers.customers(id)  -- NO!
);

// GOOD - Reference by ID only
CREATE TABLE orders.orders (
    customer_id UUID NOT NULL  -- No foreign key constraint
);

// RULE 2: Use module APIs to get related data
// BAD - Direct table access
class OrderRepository {
  async getOrderWithCustomer(orderId: string) {
    return db.query(`
      SELECT o.*, c.name, c.email
      FROM orders.orders o
      JOIN customers.customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [orderId]);
  }
}

// GOOD - Use module facade
class OrderQueryService {
  constructor(
    private orderRepository: OrderRepository,
    private customerFacade: CustomerFacade
  ) {}

  async getOrderWithCustomer(orderId: string): Promise<OrderWithCustomerDTO> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) return null;

    const customer = await this.customerFacade.getCustomer(order.customerId);

    return {
      order: OrderDTO.fromDomain(order),
      customer: customer
    };
  }
}
```

### Handling Transactions Across Modules

Since all modules share a database, you can use ACID transactions:

```typescript
// modules/shared/application/UnitOfWork.ts
export interface UnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  getConnection(): DatabaseConnection;
}

// modules/orders/application/CreateOrderUseCase.ts
export class CreateOrderUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly orderRepository: OrderRepository,
    private readonly catalogFacade: CatalogFacade
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    await this.unitOfWork.begin();

    try {
      // All operations share the same transaction
      const products = await this.catalogFacade.getProductsForOrder(
        input.items.map(i => i.productId)
      );

      for (const item of input.items) {
        await this.catalogFacade.reserveInventory(
          item.productId,
          item.quantity
        );
      }

      const order = Order.create(/* ... */);
      await this.orderRepository.save(order);

      await this.unitOfWork.commit();
      return CreateOrderOutput.from(order);

    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }
}
```

### Read Models for Cross-Module Queries

For complex queries spanning multiple modules, create dedicated read models:

```typescript
// modules/reporting/infrastructure/OrderReportRepository.ts
// This is a READ-ONLY query that spans modules for reporting purposes
export class OrderReportRepository {
  async getOrderSummaryReport(
    startDate: Date,
    endDate: Date
  ): Promise<OrderSummaryReport[]> {
    // Read-only cross-module query is acceptable for reporting
    return this.db.query(`
      SELECT
        o.id,
        o.created_at,
        o.total_amount,
        o.status,
        c.name as customer_name,
        c.email as customer_email,
        COUNT(oi.id) as item_count,
        SUM(oi.quantity) as total_items
      FROM orders.orders o
      LEFT JOIN customers.customers c ON o.customer_id = c.id
      LEFT JOIN orders.order_items oi ON o.id = oi.order_id
      WHERE o.created_at BETWEEN $1 AND $2
      GROUP BY o.id, c.name, c.email
      ORDER BY o.created_at DESC
    `, [startDate, endDate]);
  }
}
```

## Migration Strategies

One of the key advantages of modular monolith is that it provides a clear path to microservices if needed.

### From Monolith to Modular Monolith

```
Step 1: Identify Boundaries
+------------------------------------------+
|           Existing Monolith              |
|                                          |
|   User code mixed with Order code        |
|   Product code mixed with Payment code   |
|                                          |
+------------------------------------------+
            |
            v
Step 2: Create Module Structure
+------------------------------------------+
|           Structured Monolith            |
|                                          |
|  modules/                                |
|  ├── users/                              |
|  ├── orders/                             |
|  ├── products/                           |
|  └── payments/                           |
|                                          |
+------------------------------------------+
            |
            v
Step 3: Move Code to Modules
+------------------------------------------+
|         Modular Monolith                 |
|                                          |
|  +------+ +------+ +------+ +------+    |
|  |Users | |Orders| |Prods | |Pay   |    |
|  +------+ +------+ +------+ +------+    |
|                                          |
+------------------------------------------+
            |
            v
Step 4: Enforce Boundaries
+------------------------------------------+
|     Modular Monolith (Enforced)          |
|                                          |
|  [Users] --API--> [Orders] --API--> ...  |
|                                          |
+------------------------------------------+
```

### Migration Steps

```typescript
// Step 1: Create facade for existing code
// This wraps existing code without changing it
export class LegacyUserFacade implements UserFacade {
  constructor(private readonly legacyUserService: LegacyUserService) {}

  async getUser(userId: string): Promise<UserDTO | null> {
    const legacyUser = await this.legacyUserService.findById(userId);
    if (!legacyUser) return null;

    // Transform legacy format to new DTO
    return {
      id: legacyUser.user_id,
      name: `${legacyUser.first_name} ${legacyUser.last_name}`,
      email: legacyUser.email_address
    };
  }
}

// Step 2: Gradually move consumers to use facade
// Before
class OrderService {
  createOrder(userId: string) {
    const user = await this.db.query(
      'SELECT * FROM users WHERE user_id = $1',
      [userId]
    );
    // ...
  }
}

// After
class OrderService {
  constructor(private readonly userFacade: UserFacade) {}

  createOrder(userId: string) {
    const user = await this.userFacade.getUser(userId);
    // ...
  }
}

// Step 3: Once all consumers migrated, refactor internals
export class UserFacade {
  constructor(private readonly userRepository: UserRepository) {}

  async getUser(userId: string): Promise<UserDTO | null> {
    const user = await this.userRepository.findById(userId);
    return user ? UserDTO.fromDomain(user) : null;
  }
}
```

### From Modular Monolith to Microservices

When a module needs to become a microservice:

```
Modular Monolith                    Microservices
+------------------+              +------------------+
|  +-----------+   |              |  +-----------+   |
|  |  Orders   |   |              |  |  Orders   |   |
|  |  Module   |---+--+           |  |  Service  |   |
|  +-----------+   |  |           |  +-----------+   |
|                  |  |           |       |          |
|  +-----------+   |  |   ===>    |       | HTTP/gRPC|
|  | Payments  |   |  |           |       v          |
|  |  Module   |---+--+           |  +-----------+   |
|  +-----------+   |              |  | Payments  |   |
|                  |              |  |  Service  |   |
+------------------+              |  +-----------+   |
                                  +------------------+
```

```typescript
// Step 1: Replace in-process facade with HTTP client
// Before: In-process facade
import { PaymentFacade } from '@modules/payments/api';

const paymentFacade = new PaymentFacade(/* dependencies */);

// After: HTTP client with same interface
import { PaymentFacade } from '@modules/payments/api'; // Same interface!

const paymentFacade = new HttpPaymentClient({
  baseUrl: process.env.PAYMENT_SERVICE_URL,
  timeout: 5000,
  retries: 3
});

// Step 2: HTTP client implements same interface
export class HttpPaymentClient implements PaymentFacade {
  constructor(private readonly config: ClientConfig) {}

  async processPayment(request: ProcessPaymentRequest): Promise<PaymentResult> {
    const response = await fetch(
      `${this.config.baseUrl}/api/payments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      }
    );

    if (!response.ok) {
      throw new PaymentServiceError(response.statusText);
    }

    return response.json();
  }
}

// Step 3: Feature flag for gradual migration
const paymentFacade = featureFlags.isEnabled('use-payment-service')
  ? new HttpPaymentClient(config)
  : new PaymentFacade(/* in-process dependencies */);
```

### Deciding When to Extract a Microservice

Consider extracting a module to a microservice when:

| Factor | Extract if... |
|--------|---------------|
| Scale Requirements | Module needs independent scaling |
| Team Ownership | Dedicated team wants full autonomy |
| Technology Needs | Module requires different tech stack |
| Deployment Frequency | Module deploys much more often |
| Failure Isolation | Module failures should not affect others |
| Resource Intensity | Module is CPU/memory intensive |

Do NOT extract if:
- The module has heavy transactional dependencies
- Team lacks operational maturity
- Communication patterns are not well-defined
- The module is too small to justify overhead

## Testing Strategy

A modular monolith enables comprehensive testing at multiple levels.

### Unit Tests for Domain Logic

```typescript
// modules/orders/domain/__tests__/Order.test.ts
describe('Order', () => {
  describe('addItem', () => {
    it('should add item to empty order', () => {
      const order = Order.create('order-1', 'customer-1');
      const item = OrderItem.create('product-1', 2, Money.of(100));

      order.addItem(item);

      expect(order.getItems()).toHaveLength(1);
      expect(order.getTotal()).toEqual(Money.of(200));
    });

    it('should increase quantity for existing product', () => {
      const order = Order.create('order-1', 'customer-1');
      order.addItem(OrderItem.create('product-1', 2, Money.of(100)));
      order.addItem(OrderItem.create('product-1', 3, Money.of(100)));

      expect(order.getItems()).toHaveLength(1);
      expect(order.getItems()[0].getQuantity()).toBe(5);
    });

    it('should reject items for confirmed orders', () => {
      const order = Order.create('order-1', 'customer-1');
      order.addItem(OrderItem.create('product-1', 1, Money.of(100)));
      order.confirm();

      expect(() =>
        order.addItem(OrderItem.create('product-2', 1, Money.of(50)))
      ).toThrow(OrderCannotBeModifiedError);
    });
  });
});
```

### Integration Tests for Use Cases

```typescript
// modules/orders/application/__tests__/CreateOrderUseCase.test.ts
describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let orderRepository: InMemoryOrderRepository;
  let catalogFacade: jest.Mocked<CatalogFacade>;
  let customerFacade: jest.Mocked<CustomerFacade>;
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    orderRepository = new InMemoryOrderRepository();
    catalogFacade = createMockCatalogFacade();
    customerFacade = createMockCustomerFacade();
    eventBus = new InMemoryEventBus();

    useCase = new CreateOrderUseCase(
      orderRepository,
      catalogFacade,
      customerFacade,
      eventBus,
      new UuidIdGenerator()
    );
  });

  it('should create order successfully', async () => {
    // Arrange
    customerFacade.getCustomer.mockResolvedValue({
      id: 'customer-1',
      name: 'John Doe',
      email: 'john@example.com'
    });

    catalogFacade.getProductsForOrder.mockResolvedValue({
      products: [
        { id: 'product-1', name: 'Widget', price: 100, currency: 'USD' }
      ]
    });

    catalogFacade.reserveInventory.mockResolvedValue(true);

    // Act
    const result = await useCase.execute({
      customerId: 'customer-1',
      items: [{ productId: 'product-1', quantity: 2 }]
    });

    // Assert
    expect(result.orderId).toBeDefined();
    expect(result.totalAmount).toBe(200);
    expect(orderRepository.findById(result.orderId)).toBeDefined();
    expect(eventBus.getPublishedEvents()).toContainEqual(
      expect.objectContaining({ eventType: 'OrderCreated' })
    );
  });

  it('should rollback inventory on failure', async () => {
    customerFacade.getCustomer.mockResolvedValue({
      id: 'customer-1',
      name: 'John',
      email: 'john@example.com'
    });

    catalogFacade.getProductsForOrder.mockResolvedValue({
      products: [
        { id: 'product-1', price: 100 },
        { id: 'product-2', price: 200 }
      ]
    });

    // First product reserves successfully, second fails
    catalogFacade.reserveInventory
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await expect(
      useCase.execute({
        customerId: 'customer-1',
        items: [
          { productId: 'product-1', quantity: 1 },
          { productId: 'product-2', quantity: 1 }
        ]
      })
    ).rejects.toThrow(InsufficientInventoryError);

    // Verify first reservation was released
    expect(catalogFacade.releaseInventory).toHaveBeenCalledWith('product-1', 1);
  });
});
```

### Module Integration Tests

```typescript
// modules/orders/__tests__/OrderModule.integration.test.ts
describe('Order Module Integration', () => {
  let app: TestApplication;
  let catalogModule: CatalogModule;
  let customerModule: CustomerModule;
  let orderModule: OrderModule;

  beforeAll(async () => {
    app = await TestApplication.create({
      modules: [CatalogModule, CustomerModule, OrderModule]
    });

    catalogModule = app.get(CatalogModule);
    customerModule = app.get(CustomerModule);
    orderModule = app.get(OrderModule);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await app.resetDatabase();
  });

  it('should create order with real module dependencies', async () => {
    // Setup test data through module facades
    const customer = await customerModule.facade.createCustomer({
      name: 'John Doe',
      email: 'john@example.com'
    });

    const product = await catalogModule.facade.createProduct({
      name: 'Test Product',
      price: 99.99,
      currency: 'USD',
      initialStock: 100
    });

    // Execute order creation
    const order = await orderModule.facade.createOrder({
      customerId: customer.id,
      items: [{ productId: product.id, quantity: 2 }]
    });

    // Verify order created
    expect(order.totalAmount).toBe(199.98);
    expect(order.status).toBe('PENDING');

    // Verify inventory updated
    const updatedProduct = await catalogModule.facade.getProduct(product.id);
    expect(updatedProduct.availableQuantity).toBe(98);
  });
});
```

### End-to-End API Tests

```typescript
// e2e/orders.e2e.test.ts
describe('Orders API E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/orders - should create order', async () => {
    // Create test data
    const customer = await createTestCustomer(app);
    const product = await createTestProduct(app);

    // Create order via API
    const response = await request(app.getHttpServer())
      .post('/api/orders')
      .send({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 2 }]
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      customerId: customer.id,
      status: 'PENDING',
      totalAmount: product.price * 2
    });

    // Verify order persisted
    const getResponse = await request(app.getHttpServer())
      .get(`/api/orders/${response.body.id}`)
      .expect(200);

    expect(getResponse.body.id).toBe(response.body.id);
  });
});
```

## Common Pitfalls and Best Practices

### Pitfalls to Avoid

#### Leaky Module Boundaries

```typescript
// BAD: Exposing internal implementation details
export class CatalogFacade {
  // Exposes internal repository - other modules can bypass facade
  getRepository(): ProductRepository {
    return this.productRepository;
  }
}

// GOOD: Only expose DTOs and operations
export class CatalogFacade {
  async getProduct(id: string): Promise<ProductDTO | null> {
    const product = await this.productRepository.findById(id);
    return product ? ProductDTO.fromDomain(product) : null;
  }
}
```

#### Circular Dependencies

```typescript
// BAD: Circular dependency between modules
// orders/OrderService.ts
import { CustomerFacade } from '@modules/customers';
class OrderService {
  constructor(private customers: CustomerFacade) {}
}

// customers/CustomerService.ts
import { OrderFacade } from '@modules/orders';  // Circular!
class CustomerService {
  constructor(private orders: OrderFacade) {}
}

// GOOD: Use events to break circular dependencies
// customers/CustomerService.ts
class CustomerService {
  constructor(private eventBus: EventBus) {}

  async deleteCustomer(customerId: string) {
    // Publish event instead of calling orders module
    await this.eventBus.publish(
      new CustomerDeletedEvent(customerId)
    );
  }
}

// orders/handlers/CustomerDeletedHandler.ts
class CustomerDeletedHandler implements EventHandler<CustomerDeletedEvent> {
  async handle(event: CustomerDeletedEvent) {
    await this.orderService.cancelPendingOrders(event.customerId);
  }
}
```

#### Shared Database Tables

```typescript
// BAD: Multiple modules writing to same table
// catalog module
await db.query('UPDATE products SET stock = stock - 1 WHERE id = $1', [productId]);

// orders module
await db.query('UPDATE products SET stock = stock - 1 WHERE id = $1', [productId]);

// GOOD: Single module owns the table, others use its API
// Only catalog module modifies inventory
class CatalogFacade {
  async reserveInventory(productId: string, quantity: number): Promise<boolean> {
    return this.inventoryService.reserve(productId, quantity);
  }
}
```

### Best Practices

#### Start with Module Design

```typescript
// Before writing code, define module boundaries and APIs
interface CatalogModule {
  // Public API contract
  facade: {
    getProduct(id: string): Promise<ProductDTO | null>;
    searchProducts(query: SearchQuery): Promise<ProductListDTO>;
    reserveInventory(productId: string, qty: number): Promise<boolean>;
    releaseInventory(productId: string, qty: number): Promise<void>;
  };

  // Events this module publishes
  events: {
    ProductCreated: ProductCreatedEvent;
    InventoryLow: InventoryLowEvent;
  };

  // Events this module subscribes to
  subscriptions: {
    OrderCancelled: (event: OrderCancelledEvent) => void;
  };
}
```

#### Use Dependency Injection

```typescript
// modules/orders/OrderModule.ts
export class OrderModule {
  static register(container: Container): void {
    // Register internal dependencies
    container.register(OrderRepository, TypeOrmOrderRepository);
    container.register(CreateOrderUseCase, CreateOrderInteractor);

    // Register facade as public interface
    container.register(OrderFacade, {
      useFactory: (c) => new OrderFacade(
        c.resolve(CreateOrderUseCase),
        c.resolve(GetOrderUseCase),
        c.resolve(CancelOrderUseCase)
      )
    });
  }
}

// main.ts - Composition Root
const container = new Container();

// Register all modules
CatalogModule.register(container);
CustomerModule.register(container);
OrderModule.register(container);
PaymentModule.register(container);

// Wire up cross-module dependencies
container.register(CreateOrderUseCase, {
  useFactory: (c) => new CreateOrderInteractor(
    c.resolve(OrderRepository),
    c.resolve(CatalogFacade),  // From catalog module
    c.resolve(CustomerFacade), // From customer module
    c.resolve(EventBus)
  )
});
```

#### Document Module Contracts

```typescript
/**
 * Catalog Module Public API
 *
 * @module Catalog
 * @description Manages product catalog, categories, and inventory
 *
 * @dependencies
 * - None (core module)
 *
 * @consumers
 * - Orders Module: Gets product info, reserves/releases inventory
 * - Analytics Module: Subscribes to product events
 *
 * @events-published
 * - ProductCreated: When a new product is added
 * - ProductUpdated: When product details change
 * - InventoryLow: When stock falls below threshold
 *
 * @events-subscribed
 * - OrderCancelled: To release reserved inventory
 */
export interface CatalogFacade {
  // ... methods
}
```

## Interview Key Points

### Common Interview Questions

#### What is a Modular Monolith?

**Key points:**
- Single deployment unit with strong internal module boundaries
- Middle ground between monolith and microservices
- Modules communicate through well-defined APIs
- Shares database but with schema separation
- Easier to develop and operate than microservices

#### When should you choose Modular Monolith over Microservices?

**Key points:**
- Small to medium team size
- Need for strong consistency (ACID transactions)
- Unclear domain boundaries
- Limited DevOps maturity
- Starting a new project
- When simplicity matters more than independent scaling

#### How do you enforce module boundaries?

**Key points:**
- Architecture tests (ArchUnit, ts-morph)
- ESLint rules (eslint-plugin-boundaries)
- Code review processes
- Module-specific packages or namespaces
- Public API through facade pattern

#### How do modules communicate in a Modular Monolith?

**Key points:**
- Synchronous: Direct method calls through facades
- Asynchronous: In-process event bus
- Data: Read through APIs, no cross-module foreign keys
- Shared kernel for common concepts

#### How do you migrate from Modular Monolith to Microservices?

**Key points:**
- Extract one module at a time
- Replace in-process facade with HTTP/gRPC client
- Same interface, different implementation
- Use feature flags for gradual rollout
- Consider which modules truly need extraction

### Design Discussion Points

**Question**: Design an e-commerce system using Modular Monolith

**Reference answer:**

1. **Module Identification**:
   - Catalog (products, categories, inventory)
   - Orders (cart, checkout, order management)
   - Customers (accounts, addresses, preferences)
   - Payments (processing, refunds)
   - Shipping (fulfillment, tracking)
   - Notifications (email, SMS, push)

2. **Key Design Decisions**:
   - Use facade pattern for all inter-module communication
   - Event-driven for notifications and analytics
   - Schema-per-module in single PostgreSQL database
   - Shared kernel for Money, Address value objects

3. **Critical Flows**:
   - Order creation uses synchronous calls to Catalog, Customers
   - Payment processing publishes events for notifications
   - Inventory updates are transactional with orders

4. **Future Evolution**:
   - Payments module likely candidate for extraction (PCI compliance)
   - Notifications can easily become separate service
   - Core modules (Catalog, Orders) stay together longer

## Summary

Modular Monolith architecture offers a pragmatic approach to building maintainable software systems. It provides:

- **Simplicity**: Single deployment, no distributed systems complexity
- **Strong Consistency**: ACID transactions across modules
- **Clear Boundaries**: Well-defined module interfaces
- **Evolution Path**: Clear migration path to microservices when needed
- **Team Scalability**: Modules can be owned by different teams

The key success factors are:

1. **Enforce boundaries religiously** - Use tooling and code reviews
2. **Design modules around business capabilities** - Follow DDD principles
3. **Keep the shared kernel minimal** - Only truly common concepts
4. **Use events for loose coupling** - Especially for cross-cutting concerns
5. **Plan for the future** - Design interfaces that could become network boundaries

Remember Martin Fowler's advice:

> "If you can't build a well-structured monolith, what makes you think you can build a well-structured set of microservices?"

Start with a modular monolith, prove your boundaries work, then extract microservices only when you have a compelling reason.

---

## Further Reading

### Books

- **"Fundamentals of Software Architecture"** - Mark Richards & Neal Ford
- **"Building Evolutionary Architectures"** - Neal Ford, Rebecca Parsons, Patrick Kua
- **"Domain-Driven Design"** - Eric Evans
- **"Implementing Domain-Driven Design"** - Vaughn Vernon
- **"Monolith to Microservices"** - Sam Newman

### Online Resources

- [Modular Monolith: A Primer - Kamil Grzybek](https://www.kamilgrzybek.com/design/modular-monolith-primer/)
- [MonolithFirst - Martin Fowler](https://martinfowler.com/bliki/MonolithFirst.html)
- [Modular Monoliths - Simon Brown](https://www.youtube.com/watch?v=5OjqD-ow8GE)
- [Majestic Modular Monoliths - Axel Fontaine](https://www.youtube.com/watch?v=BOvxJaklcr0)

### Related Topics

- Domain-Driven Design (DDD)
- Hexagonal Architecture
- Clean Architecture
- CQRS and Event Sourcing
- Microservices Architecture
- Bounded Contexts
