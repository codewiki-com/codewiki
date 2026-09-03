---
title: Software Architecture Getting Started Guide
description: Master software architecture core concepts, design principles, and common patterns
track: architecture
section: principles
difficulty: intermediate
tags:
  - Getting Started
  - Architecture
  - Design Patterns
  - System Design
status: imported
origin: old/src/content/docs/architecture/getting-started.en.md
divergence: 0.234
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Architecture
  subcategory: Introduction
  order: 0
  lastUpdated: 2026-01-07
---

Welcome to the Software Architecture section of Code Wiki! This comprehensive guide will help you understand the core concepts, design principles, and architectural patterns essential for building robust, scalable, and maintainable software systems.

## What is Software Architecture

Software architecture refers to the high-level structure of a software system, encompassing the software elements, the relationships among them, and the properties of both. It is the blueprint that guides development, deployment, and evolution of a system.

Good architecture enables teams to:

- Develop features independently and in parallel
- Scale the system to meet growing demands
- Maintain and evolve the codebase over time
- Onboard new team members efficiently
- Make informed technical decisions

Architecture is not just about technical choices; it is about making strategic decisions that align with business goals, team capabilities, and operational requirements.

### The Role of a Software Architect

Software architects bridge the gap between business requirements and technical implementation. Their responsibilities include:

- **Technical Vision**: Setting the overall technical direction
- **System Design**: Defining system structure and component interactions
- **Technology Selection**: Choosing appropriate technologies and frameworks
- **Quality Attributes**: Ensuring scalability, security, performance, and reliability
- **Technical Leadership**: Mentoring developers and establishing standards
- **Documentation**: Creating and maintaining architectural documentation
- **Risk Management**: Identifying and mitigating technical risks
- **Stakeholder Communication**: Translating technical concepts for non-technical audiences

## Core Design Principles

Understanding fundamental design principles is essential for creating well-architected systems.

### SOLID Principles

The SOLID principles provide guidelines for creating maintainable and extensible code.

```typescript
// Single Responsibility Principle (SRP)
// Each class should have only one reason to change

// BAD: One class with multiple responsibilities
class User {
  constructor(public name: string, public email: string) {}

  save() { /* saves to database */ }
  sendEmail() { /* sends email */ }
  generateReport() { /* generates PDF report */ }
}

// GOOD: Separated responsibilities
class User {
  constructor(public name: string, public email: string) {}
}

class UserRepository {
  save(user: User): Promise<void> {
    // Database operations only
  }

  findById(id: string): Promise<User | null> {
    // Query operations
  }
}

class EmailService {
  sendWelcomeEmail(user: User): Promise<void> {
    // Email sending logic only
  }
}

class UserReportGenerator {
  generateReport(user: User): Buffer {
    // Report generation only
  }
}
```

```typescript
// Open/Closed Principle (OCP)
// Open for extension, closed for modification

// BAD: Requires modification to add new discount types
class DiscountCalculator {
  calculate(type: string, amount: number): number {
    if (type === 'percentage') return amount * 0.1;
    if (type === 'fixed') return 10;
    if (type === 'seasonal') return amount * 0.15; // Added later
    return 0;
  }
}

// GOOD: Extensible through new classes
interface DiscountStrategy {
  calculate(amount: number): number;
}

class PercentageDiscount implements DiscountStrategy {
  constructor(private percentage: number) {}
  calculate(amount: number): number {
    return amount * (this.percentage / 100);
  }
}

class FixedDiscount implements DiscountStrategy {
  constructor(private discountAmount: number) {}
  calculate(amount: number): number {
    return Math.min(this.discountAmount, amount);
  }
}

// New discount type without modifying existing code
class SeasonalDiscount implements DiscountStrategy {
  calculate(amount: number): number {
    return amount * 0.15;
  }
}

class DiscountCalculator {
  constructor(private strategy: DiscountStrategy) {}
  calculate(amount: number): number {
    return this.strategy.calculate(amount);
  }
}
```

```typescript
// Liskov Substitution Principle (LSP)
// Subtypes must be substitutable for their base types

// BAD: Square violates LSP when substituted for Rectangle
class Rectangle {
  constructor(protected width: number, protected height: number) {}

  setWidth(width: number) { this.width = width; }
  setHeight(height: number) { this.height = height; }
  getArea() { return this.width * this.height; }
}

class Square extends Rectangle {
  setWidth(width: number) {
    this.width = width;
    this.height = width; // Violates expected behavior
  }
  setHeight(height: number) {
    this.width = height;
    this.height = height;
  }
}

// GOOD: Use composition or separate abstractions
interface Shape {
  getArea(): number;
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  getArea() { return this.width * this.height; }
}

class Square implements Shape {
  constructor(private side: number) {}
  getArea() { return this.side * this.side; }
}
```

```typescript
// Interface Segregation Principle (ISP)
// Clients shouldn't depend on interfaces they don't use

// BAD: Fat interface forces unnecessary implementations
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

class Robot implements Worker {
  work() { /* working */ }
  eat() { /* robots don't eat - forced to implement */ }
  sleep() { /* robots don't sleep - forced to implement */ }
}

// GOOD: Segregated interfaces
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

class Human implements Workable, Eatable, Sleepable {
  work() { /* working */ }
  eat() { /* eating */ }
  sleep() { /* sleeping */ }
}

class Robot implements Workable {
  work() { /* working - only implements what's needed */ }
}
```

```typescript
// Dependency Inversion Principle (DIP)
// Depend on abstractions, not concretions

// BAD: High-level module depends on low-level module
class MySQLDatabase {
  query(sql: string) { /* MySQL specific */ }
}

class UserService {
  private database = new MySQLDatabase(); // Tight coupling

  getUsers() {
    return this.database.query('SELECT * FROM users');
  }
}

// GOOD: Both depend on abstraction
interface Database {
  query(sql: string): Promise<any>;
}

class MySQLDatabase implements Database {
  async query(sql: string) { /* MySQL implementation */ }
}

class PostgreSQLDatabase implements Database {
  async query(sql: string) { /* PostgreSQL implementation */ }
}

class UserService {
  constructor(private database: Database) {} // Dependency injection

  async getUsers() {
    return this.database.query('SELECT * FROM users');
  }
}

// Easy to swap implementations
const mysqlService = new UserService(new MySQLDatabase());
const postgresService = new UserService(new PostgreSQLDatabase());
```

### Other Important Principles

**DRY (Don't Repeat Yourself)**: Avoid code duplication by abstracting common logic into reusable modules. However, beware of premature abstraction - sometimes duplication is better than the wrong abstraction.

**KISS (Keep It Simple, Stupid)**: Prefer simple solutions over complex ones. Complexity should be introduced only when necessary to meet requirements.

**YAGNI (You Aren't Gonna Need It)**: Don't implement features until they are actually needed. Avoid speculative generalization.

**Separation of Concerns**: Divide systems into distinct sections that address separate concerns. Each component should have a single, well-defined responsibility.

## Common Architecture Patterns

### Layered Architecture

The most traditional pattern, organizing code into horizontal layers with clear responsibilities.

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │  UI, API Controllers
├─────────────────────────────────────────┤
│           Application Layer             │  Use Cases, Services
├─────────────────────────────────────────┤
│             Domain Layer                │  Business Logic, Entities
├─────────────────────────────────────────┤
│          Infrastructure Layer           │  Database, External Services
└─────────────────────────────────────────┘
```

```typescript
// Layered Architecture Example

// Domain Layer - Business entities and rules
class Order {
  constructor(
    public readonly id: string,
    public readonly items: OrderItem[],
    public status: OrderStatus
  ) {}

  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  canBeCancelled(): boolean {
    return this.status === OrderStatus.Pending;
  }
}

// Application Layer - Use cases
class CancelOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private notificationService: NotificationService
  ) {}

  async execute(orderId: string, userId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (!order.canBeCancelled()) {
      throw new OrderCannotBeCancelledError(orderId);
    }

    order.status = OrderStatus.Cancelled;
    await this.orderRepository.save(order);
    await this.notificationService.sendCancellationEmail(order);
  }
}

// Infrastructure Layer - Implementations
class PostgresOrderRepository implements OrderRepository {
  async findById(id: string): Promise<Order | null> {
    // PostgreSQL specific implementation
  }

  async save(order: Order): Promise<void> {
    // PostgreSQL specific implementation
  }
}

// Presentation Layer - Controllers
class OrderController {
  constructor(private cancelOrderUseCase: CancelOrderUseCase) {}

  async cancelOrder(req: Request, res: Response) {
    try {
      await this.cancelOrderUseCase.execute(req.params.id, req.user.id);
      res.status(200).json({ message: 'Order cancelled' });
    } catch (error) {
      // Error handling
    }
  }
}
```

### Microservices Architecture

Decompose applications into small, independent services that communicate over networks.

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│    User     │   │   Order     │   │   Payment   │
│   Service   │   │   Service   │   │   Service   │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └────────────┬────┴────────────────┘
                    │
            ┌───────┴───────┐
            │  API Gateway  │
            └───────────────┘
```

Benefits:
- Independent deployment and scaling
- Technology diversity
- Fault isolation
- Team autonomy

Challenges:
- Distributed system complexity
- Data consistency
- Service communication overhead
- Operational complexity

### Event-Driven Architecture

Services communicate through events, enabling loose coupling and asynchronous processing.

```typescript
// Event-Driven Architecture Example

// Events
interface DomainEvent {
  eventId: string;
  timestamp: Date;
  aggregateId: string;
}

class OrderCreatedEvent implements DomainEvent {
  constructor(
    public eventId: string,
    public timestamp: Date,
    public aggregateId: string,
    public customerId: string,
    public items: OrderItem[],
    public totalAmount: number
  ) {}
}

class PaymentReceivedEvent implements DomainEvent {
  constructor(
    public eventId: string,
    public timestamp: Date,
    public aggregateId: string,
    public orderId: string,
    public amount: number
  ) {}
}

// Event Publisher
class EventBus {
  private handlers: Map<string, Function[]> = new Map();

  subscribe(eventType: string, handler: Function) {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  async publish(event: DomainEvent) {
    const eventType = event.constructor.name;
    const handlers = this.handlers.get(eventType) || [];

    for (const handler of handlers) {
      await handler(event);
    }
  }
}

// Event Handlers
class InventoryService {
  constructor(private eventBus: EventBus) {
    this.eventBus.subscribe('OrderCreatedEvent', this.handleOrderCreated.bind(this));
  }

  async handleOrderCreated(event: OrderCreatedEvent) {
    // Reserve inventory for the order
    for (const item of event.items) {
      await this.reserveStock(item.productId, item.quantity);
    }
  }
}

class NotificationService {
  constructor(private eventBus: EventBus) {
    this.eventBus.subscribe('OrderCreatedEvent', this.handleOrderCreated.bind(this));
    this.eventBus.subscribe('PaymentReceivedEvent', this.handlePaymentReceived.bind(this));
  }

  async handleOrderCreated(event: OrderCreatedEvent) {
    await this.sendOrderConfirmationEmail(event.customerId, event.aggregateId);
  }

  async handlePaymentReceived(event: PaymentReceivedEvent) {
    await this.sendPaymentConfirmationEmail(event.orderId);
  }
}
```

### Clean Architecture / Hexagonal Architecture

Organize code around the domain, with dependencies pointing inward.

```
                    ┌─────────────────────────┐
                    │    External Agents      │
                    │  (UI, DB, APIs, etc.)   │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │        Adapters          │
                    │  (Controllers, Repos)    │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │      Application         │
                    │     (Use Cases)          │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │        Domain            │
                    │  (Entities, Rules)       │
                    └─────────────────────────┘
```

Key principle: The domain core has no dependencies on outer layers.

## Learning Path Recommendations

### Foundation (1-3 Months)

1. **Design Principles** - Master SOLID, DRY, KISS, YAGNI
2. **Design Patterns** - Study the Gang of Four patterns
3. **Code Organization** - Learn about modules, packages, and namespaces
4. **Refactoring** - Practice improving existing code

### Intermediate (3-6 Months)

1. **Architecture Patterns** - Understand layered, hexagonal, and clean architecture
2. **Domain-Driven Design** - Learn DDD concepts and tactical patterns
3. **System Design Basics** - Study distributed systems fundamentals
4. **Documentation** - Practice creating architecture decision records (ADRs)

### Advanced (6-12 Months)

1. **Microservices** - Deep dive into microservices patterns and pitfalls
2. **Event-Driven Systems** - Learn event sourcing and CQRS
3. **Scalability** - Study horizontal scaling, caching, and load balancing
4. **Cloud Architecture** - Understand cloud-native patterns

## Interview Key Points

Prepare for architecture discussions on these topics:

### Design Principles and Patterns

- Explain SOLID principles with real-world examples
- When to use different design patterns
- Trade-offs between patterns

### Architecture Styles

- Monolith vs Microservices: trade-offs and migration strategies
- Event-driven architecture benefits and challenges
- API design (REST vs GraphQL vs gRPC)

### System Design

- CAP theorem and its implications
- Database scaling strategies
- Caching layers and invalidation
- Load balancing approaches
- Message queues and async processing

### Quality Attributes

- How to achieve high availability
- Security architecture considerations
- Performance optimization strategies
- Observability and monitoring

## Further Reading

Continue exploring Code Wiki for deep dives into:

- Design patterns catalog
- Domain-Driven Design
- Microservices patterns
- System design case studies
- Cloud architecture patterns

Software architecture is both an art and a science. It requires balancing technical excellence with practical constraints. Focus on understanding trade-offs, as every architectural decision involves compromises. Build small projects, study existing systems, and continuously refine your architectural thinking.
