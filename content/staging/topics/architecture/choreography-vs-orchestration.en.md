---
title: Choreography vs Orchestration
description: A comprehensive guide to understanding choreography and orchestration patterns in distributed systems and microservices architecture
track: architecture
section: distributed
difficulty: intermediate
tags:
  - Choreography
  - Orchestration
  - Microservices
  - Event-Driven
  - Saga Pattern
  - Distributed Systems
  - Service Coordination
status: imported
origin: old/src/content/docs/architecture/choreography-vs-orchestration.en.md
divergence: 0.228
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Architecture
  subcategory: ""
  order: 5
  lastUpdated: 2026-01-21
---

In distributed systems and microservices architectures, coordinating workflows across multiple services is a fundamental challenge. Two primary patterns have emerged to address this: **Choreography** and **Orchestration**. Understanding when to use each pattern and their trade-offs is crucial for building scalable, maintainable systems. This article provides an in-depth exploration of both patterns, their implementations, and real-world applications.

## Concept Explanation

### What is Service Coordination?

Service coordination refers to how multiple independent services work together to complete a business process. In a monolithic application, a single transaction can span multiple operations within the same process. In microservices, these operations are distributed across services, each with its own database and business logic.

```
Monolithic Approach:
┌────────────────────────────────────────────────────────┐
│                    Single Process                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ Create  │→ │ Reserve │→ │ Charge  │→ │  Send   │  │
│  │  Order  │  │  Stock  │  │ Payment │  │  Email  │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
│                   Single Transaction                    │
└────────────────────────────────────────────────────────┘

Microservices Approach:
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│   Order   │   │ Inventory │   │  Payment  │   │  Email    │
│  Service  │   │  Service  │   │  Service  │   │  Service  │
├───────────┤   ├───────────┤   ├───────────┤   ├───────────┤
│  Orders   │   │   Stock   │   │ Payments  │   │  Emails   │
│    DB     │   │    DB     │   │    DB     │   │   Queue   │
└───────────┘   └───────────┘   └───────────┘   └───────────┘
      ?               ?               ?               ?
              How do they coordinate?
```

### Orchestration Pattern

**Orchestration** uses a central coordinator (orchestrator) that explicitly controls the workflow. The orchestrator tells each service what to do and when, similar to a conductor leading an orchestra.

```
Orchestration Pattern:

                    ┌─────────────────────┐
                    │    Orchestrator     │
                    │  (Order Saga/BPM)   │
                    └─────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │   Service   │    │   Service   │    │   Service   │
    │      A      │    │      B      │    │      C      │
    └─────────────┘    └─────────────┘    └─────────────┘

Commands flow: Orchestrator → Services (Direct calls)
Responses flow: Services → Orchestrator (Results/Status)
```

**Key Characteristics:**
- Centralized control flow
- Explicit workflow definition
- Services are passive - they respond to commands
- Easy to understand and debug
- Single point of visibility

### Choreography Pattern

**Choreography** is a decentralized approach where each service knows what to do when it receives certain events. Services react to events and publish their own events, like dancers performing a rehearsed routine without a director.

```
Choreography Pattern:

┌─────────────┐  event   ┌─────────────┐  event   ┌─────────────┐
│   Service   │ ───────▶ │   Service   │ ───────▶ │   Service   │
│      A      │          │      B      │          │      C      │
└─────────────┘          └─────────────┘          └─────────────┘
       │                        │                        │
       │    ┌───────────────────┴────────────────────┐   │
       └───▶│            Event Bus / Broker           │◀──┘
            │     (Kafka, RabbitMQ, EventBridge)      │
            └─────────────────────────────────────────┘

Events flow: Services ↔ Event Bus (Publish/Subscribe)
No central coordinator - services react autonomously
```

**Key Characteristics:**
- Decentralized control
- Implicit workflow through event reactions
- Services are autonomous - they decide when to act
- Highly loosely coupled
- Complex workflows harder to visualize

### Historical Context

The terms come from different domains:

- **Orchestration**: From music - a conductor (orchestrator) coordinates musicians
- **Choreography**: From dance - dancers follow a shared understanding of the routine

In software, these patterns emerged as SOA (Service-Oriented Architecture) evolved into microservices, with the need to coordinate distributed transactions without the luxury of ACID guarantees.

## Core Principles

### Orchestration Principles

#### 1. Centralized Workflow Management

```typescript
// Orchestrator knows the complete workflow
class OrderOrchestrator {
  async processOrder(order: Order): Promise<OrderResult> {
    const saga = new OrderSaga(order);

    try {
      // Step 1: Create order
      await saga.createOrder();

      // Step 2: Reserve inventory
      await saga.reserveInventory();

      // Step 3: Process payment
      await saga.processPayment();

      // Step 4: Confirm order
      await saga.confirmOrder();

      // Step 5: Send notifications
      await saga.sendNotifications();

      return saga.getResult();
    } catch (error) {
      // Orchestrator handles compensation
      await saga.compensate();
      throw error;
    }
  }
}
```

#### 2. Command-Based Communication

The orchestrator sends explicit commands to services:

```typescript
// Orchestrator sends commands
interface InventoryCommand {
  type: 'RESERVE_STOCK' | 'RELEASE_STOCK';
  orderId: string;
  items: Array<{ sku: string; quantity: number }>;
}

class InventoryClient {
  async reserveStock(command: ReserveStockCommand): Promise<ReservationResult> {
    return this.httpClient.post('/inventory/reserve', command);
  }

  async releaseStock(command: ReleaseStockCommand): Promise<void> {
    return this.httpClient.post('/inventory/release', command);
  }
}

// Service responds to commands
class InventoryService {
  @Post('/inventory/reserve')
  async handleReserve(command: ReserveStockCommand): Promise<ReservationResult> {
    // Execute the command
    const reservation = await this.reserveItems(command.items);
    return { reservationId: reservation.id, success: true };
  }
}
```

#### 3. State Machine Management

Orchestrators often use state machines to track workflow progress:

```typescript
enum OrderState {
  CREATED = 'CREATED',
  INVENTORY_RESERVED = 'INVENTORY_RESERVED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  COMPENSATING = 'COMPENSATING',
  COMPENSATED = 'COMPENSATED'
}

interface StateTransition {
  from: OrderState;
  to: OrderState;
  action: string;
  guard?: () => boolean;
}

class OrderStateMachine {
  private state: OrderState = OrderState.CREATED;

  private transitions: StateTransition[] = [
    { from: OrderState.CREATED, to: OrderState.INVENTORY_RESERVED, action: 'reserveInventory' },
    { from: OrderState.INVENTORY_RESERVED, to: OrderState.PAYMENT_PROCESSED, action: 'processPayment' },
    { from: OrderState.PAYMENT_PROCESSED, to: OrderState.CONFIRMED, action: 'confirmOrder' },
    // Compensation transitions
    { from: OrderState.PAYMENT_PROCESSED, to: OrderState.COMPENSATING, action: 'compensate' },
    { from: OrderState.INVENTORY_RESERVED, to: OrderState.COMPENSATING, action: 'compensate' },
    { from: OrderState.COMPENSATING, to: OrderState.COMPENSATED, action: 'complete' }
  ];

  canTransition(action: string): boolean {
    return this.transitions.some(
      t => t.from === this.state && t.action === action
    );
  }

  transition(action: string): void {
    const transition = this.transitions.find(
      t => t.from === this.state && t.action === action
    );

    if (!transition) {
      throw new Error(`Invalid transition: ${action} from ${this.state}`);
    }

    this.state = transition.to;
  }
}
```

### Choreography Principles

#### 1. Event-Driven Communication

Services communicate through events, not commands:

```typescript
// Events - facts that happened
interface OrderCreatedEvent {
  type: 'ORDER_CREATED';
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  timestamp: Date;
}

interface InventoryReservedEvent {
  type: 'INVENTORY_RESERVED';
  orderId: string;
  reservationId: string;
  items: ReservedItem[];
  timestamp: Date;
}

interface PaymentCompletedEvent {
  type: 'PAYMENT_COMPLETED';
  orderId: string;
  paymentId: string;
  amount: number;
  timestamp: Date;
}
```

#### 2. Autonomous Service Reactions

Each service decides independently how to react to events:

```typescript
// Inventory Service - reacts to OrderCreated
class InventoryService {
  @Subscribe('ORDER_CREATED')
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      // Autonomously decide to reserve inventory
      const reservation = await this.reserveInventory(event.items);

      // Publish result as event
      await this.eventBus.publish({
        type: 'INVENTORY_RESERVED',
        orderId: event.orderId,
        reservationId: reservation.id,
        items: reservation.items,
        timestamp: new Date()
      });
    } catch (error) {
      // Publish failure event
      await this.eventBus.publish({
        type: 'INVENTORY_RESERVATION_FAILED',
        orderId: event.orderId,
        reason: error.message,
        timestamp: new Date()
      });
    }
  }
}

// Payment Service - reacts to InventoryReserved
class PaymentService {
  @Subscribe('INVENTORY_RESERVED')
  async onInventoryReserved(event: InventoryReservedEvent): Promise<void> {
    // Need order details - fetch or receive in event
    const order = await this.orderClient.getOrder(event.orderId);

    try {
      const payment = await this.processPayment(order);

      await this.eventBus.publish({
        type: 'PAYMENT_COMPLETED',
        orderId: event.orderId,
        paymentId: payment.id,
        amount: payment.amount,
        timestamp: new Date()
      });
    } catch (error) {
      await this.eventBus.publish({
        type: 'PAYMENT_FAILED',
        orderId: event.orderId,
        reason: error.message,
        timestamp: new Date()
      });
    }
  }
}
```

#### 3. Event Correlation

Events are correlated by business identifiers:

```typescript
// Event correlation through orderId
class OrderSagaTracker {
  private sagaStates: Map<string, SagaState> = new Map();

  @Subscribe('ORDER_CREATED')
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    this.sagaStates.set(event.orderId, {
      orderId: event.orderId,
      steps: {
        orderCreated: true,
        inventoryReserved: false,
        paymentCompleted: false
      },
      startedAt: event.timestamp
    });
  }

  @Subscribe('INVENTORY_RESERVED')
  async onInventoryReserved(event: InventoryReservedEvent): Promise<void> {
    const state = this.sagaStates.get(event.orderId);
    if (state) {
      state.steps.inventoryReserved = true;
      this.checkCompletion(event.orderId);
    }
  }

  @Subscribe('PAYMENT_COMPLETED')
  async onPaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    const state = this.sagaStates.get(event.orderId);
    if (state) {
      state.steps.paymentCompleted = true;
      this.checkCompletion(event.orderId);
    }
  }

  private checkCompletion(orderId: string): void {
    const state = this.sagaStates.get(orderId);
    if (state && Object.values(state.steps).every(v => v)) {
      // Saga completed
      this.eventBus.publish({
        type: 'ORDER_SAGA_COMPLETED',
        orderId,
        duration: Date.now() - state.startedAt.getTime()
      });
    }
  }
}
```

## Core Concepts

### Comparison Matrix

| Aspect | Orchestration | Choreography |
|--------|--------------|--------------|
| **Coupling** | Higher (orchestrator knows all services) | Lower (services only know events) |
| **Complexity Location** | Centralized in orchestrator | Distributed across services |
| **Workflow Visibility** | Clear, explicit | Implicit, harder to trace |
| **Single Point of Failure** | Orchestrator | None (but event bus is critical) |
| **Scalability** | Limited by orchestrator | Highly scalable |
| **Testing** | Easier (test orchestrator) | Harder (test event flows) |
| **Change Impact** | Orchestrator changes for new flows | Multiple services may change |
| **Debugging** | Easier (single point of logging) | Harder (distributed traces needed) |
| **Error Handling** | Centralized | Distributed |
| **Latency** | Higher (sequential by default) | Lower (parallel by nature) |

### When to Use Orchestration

1. **Complex Workflows**: Multi-step processes with conditional logic
2. **Strict Sequencing**: Operations must happen in a specific order
3. **Centralized Control**: Need for explicit workflow management
4. **Error Recovery**: Complex compensation logic
5. **Compliance**: Audit trails and workflow visibility required

```typescript
// Example: Complex loan approval workflow
class LoanApprovalOrchestrator {
  async processLoanApplication(application: LoanApplication): Promise<LoanDecision> {
    // Complex conditional workflow
    const creditCheck = await this.creditService.checkCredit(application.customerId);

    if (creditCheck.score < 600) {
      return this.rejectLoan(application, 'Low credit score');
    }

    const incomeVerification = await this.incomeService.verifyIncome(application);

    if (incomeVerification.debtToIncomeRatio > 0.43) {
      return this.rejectLoan(application, 'High debt-to-income ratio');
    }

    // Different paths based on loan amount
    if (application.amount > 100000) {
      const manualReview = await this.reviewService.requestManualReview(application);
      if (!manualReview.approved) {
        return this.rejectLoan(application, manualReview.reason);
      }
    }

    const propertyAppraisal = await this.appraisalService.appraise(application.propertyId);

    // More complex logic...
    return this.approveLoan(application, { creditCheck, incomeVerification, propertyAppraisal });
  }
}
```

### When to Use Choreography

1. **Simple Flows**: Linear event chains
2. **High Scalability**: Need to handle high throughput
3. **Loose Coupling**: Services should be independent
4. **Real-Time Processing**: Events trigger immediate reactions
5. **Extensibility**: Easy to add new services that react to events

```typescript
// Example: E-commerce event flow
// Each service is independent and reacts to events

// Order Service
class OrderService {
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    const order = await this.orderRepository.create(request);

    // Just publish - don't care who listens
    await this.eventBus.publish({
      type: 'ORDER_CREATED',
      order
    });

    return order;
  }
}

// Inventory Service - independently subscribes
class InventoryService {
  @Subscribe('ORDER_CREATED')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.reserveStock(event.order.items);
    await this.eventBus.publish({ type: 'STOCK_RESERVED', orderId: event.order.id });
  }
}

// Analytics Service - also independently subscribes
class AnalyticsService {
  @Subscribe('ORDER_CREATED')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.recordOrderMetrics(event.order);
  }
}

// Notification Service - subscribes to multiple events
class NotificationService {
  @Subscribe('ORDER_CREATED')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.sendOrderConfirmation(event.order.customerId, event.order.id);
  }

  @Subscribe('PAYMENT_COMPLETED')
  async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    await this.sendPaymentReceipt(event.customerId, event.paymentId);
  }
}
```

### Hybrid Approaches

Many real-world systems use both patterns:

```typescript
// Hybrid: Choreography for cross-domain, Orchestration within domain

// Cross-domain: Choreography
// Order domain publishes events, other domains react
class OrderDomain {
  async completeOrder(orderId: string): Promise<void> {
    // Internal orchestration within order domain
    const orchestrator = new OrderFulfillmentOrchestrator();
    await orchestrator.fulfill(orderId);

    // Cross-domain choreography
    await this.eventBus.publish({
      type: 'ORDER_FULFILLED',
      orderId,
      timestamp: new Date()
    });
  }
}

// Within domain: Orchestration
class OrderFulfillmentOrchestrator {
  async fulfill(orderId: string): Promise<void> {
    // Orchestrated steps within the order domain
    await this.validateOrder(orderId);
    await this.calculateTaxes(orderId);
    await this.applyDiscounts(orderId);
    await this.finalizeOrder(orderId);
  }
}

// Shipping domain reacts via choreography
class ShippingDomain {
  @Subscribe('ORDER_FULFILLED')
  async onOrderFulfilled(event: OrderFulfilledEvent): Promise<void> {
    // Internal orchestration within shipping domain
    const orchestrator = new ShippingOrchestrator();
    await orchestrator.processShipment(event.orderId);
  }
}
```

## Code Examples

### Complete Orchestration Implementation

```typescript
import { Injectable } from '@nestjs/common';

// Saga State
interface OrderSagaState {
  orderId: string;
  status: 'PENDING' | 'INVENTORY_RESERVED' | 'PAYMENT_PROCESSED' | 'COMPLETED' | 'FAILED' | 'COMPENSATED';
  order?: Order;
  reservationId?: string;
  paymentId?: string;
  error?: string;
  compensationSteps: string[];
}

// Saga Step Definition
interface SagaStep<T> {
  name: string;
  execute: (state: OrderSagaState) => Promise<T>;
  compensate: (state: OrderSagaState) => Promise<void>;
}

// Orchestrator Implementation
@Injectable()
export class OrderSagaOrchestrator {
  private readonly steps: SagaStep<any>[];

  constructor(
    private readonly orderService: OrderService,
    private readonly inventoryService: InventoryService,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
    private readonly sagaRepository: SagaRepository
  ) {
    this.steps = this.defineSteps();
  }

  private defineSteps(): SagaStep<any>[] {
    return [
      {
        name: 'CREATE_ORDER',
        execute: async (state) => {
          const order = await this.orderService.create(state.orderId);
          state.order = order;
          state.compensationSteps.push('CREATE_ORDER');
          return order;
        },
        compensate: async (state) => {
          await this.orderService.cancel(state.orderId);
        }
      },
      {
        name: 'RESERVE_INVENTORY',
        execute: async (state) => {
          const reservation = await this.inventoryService.reserve({
            orderId: state.orderId,
            items: state.order!.items
          });
          state.reservationId = reservation.id;
          state.compensationSteps.push('RESERVE_INVENTORY');
          return reservation;
        },
        compensate: async (state) => {
          if (state.reservationId) {
            await this.inventoryService.release(state.reservationId);
          }
        }
      },
      {
        name: 'PROCESS_PAYMENT',
        execute: async (state) => {
          const payment = await this.paymentService.process({
            orderId: state.orderId,
            amount: state.order!.totalAmount,
            customerId: state.order!.customerId
          });
          state.paymentId = payment.id;
          state.compensationSteps.push('PROCESS_PAYMENT');
          return payment;
        },
        compensate: async (state) => {
          if (state.paymentId) {
            await this.paymentService.refund(state.paymentId);
          }
        }
      },
      {
        name: 'CONFIRM_ORDER',
        execute: async (state) => {
          await this.orderService.confirm(state.orderId);
          state.status = 'COMPLETED';
        },
        compensate: async () => {
          // No compensation needed - order was never confirmed
        }
      },
      {
        name: 'SEND_NOTIFICATIONS',
        execute: async (state) => {
          await this.notificationService.sendOrderConfirmation({
            orderId: state.orderId,
            customerId: state.order!.customerId
          });
        },
        compensate: async () => {
          // Notifications don't need compensation
        }
      }
    ];
  }

  async execute(orderId: string): Promise<OrderSagaResult> {
    const state: OrderSagaState = {
      orderId,
      status: 'PENDING',
      compensationSteps: []
    };

    // Persist initial state
    await this.sagaRepository.save(state);

    try {
      for (const step of this.steps) {
        console.log(`Executing step: ${step.name}`);
        await step.execute(state);

        // Persist state after each step
        await this.sagaRepository.save(state);
      }

      return {
        success: true,
        orderId,
        paymentId: state.paymentId!,
        reservationId: state.reservationId!
      };
    } catch (error) {
      console.error(`Saga failed at step, starting compensation`, error);
      state.status = 'FAILED';
      state.error = error.message;
      await this.sagaRepository.save(state);

      // Execute compensation in reverse order
      await this.compensate(state);

      throw new SagaExecutionError(orderId, error.message);
    }
  }

  private async compensate(state: OrderSagaState): Promise<void> {
    const stepsToCompensate = [...state.compensationSteps].reverse();

    for (const stepName of stepsToCompensate) {
      const step = this.steps.find(s => s.name === stepName);
      if (step) {
        try {
          console.log(`Compensating step: ${stepName}`);
          await step.compensate(state);
        } catch (error) {
          console.error(`Compensation failed for ${stepName}`, error);
          // Log but continue - try to compensate remaining steps
        }
      }
    }

    state.status = 'COMPENSATED';
    await this.sagaRepository.save(state);
  }

  // Recovery method for crashed sagas
  async recover(orderId: string): Promise<void> {
    const state = await this.sagaRepository.find(orderId);

    if (!state) {
      throw new Error(`Saga not found: ${orderId}`);
    }

    if (state.status === 'FAILED') {
      await this.compensate(state);
    }
  }
}

// Usage
@Controller('orders')
export class OrderController {
  constructor(private readonly orchestrator: OrderSagaOrchestrator) {}

  @Post()
  async createOrder(@Body() request: CreateOrderRequest): Promise<OrderResponse> {
    const result = await this.orchestrator.execute(request.orderId);
    return {
      orderId: result.orderId,
      status: 'CONFIRMED',
      paymentId: result.paymentId
    };
  }
}
```

### Complete Choreography Implementation

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

// Event Definitions
interface DomainEvent {
  eventId: string;
  type: string;
  timestamp: Date;
  correlationId: string;
}

interface OrderCreatedEvent extends DomainEvent {
  type: 'ORDER_CREATED';
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
}

interface InventoryReservedEvent extends DomainEvent {
  type: 'INVENTORY_RESERVED';
  orderId: string;
  reservationId: string;
}

interface InventoryReservationFailedEvent extends DomainEvent {
  type: 'INVENTORY_RESERVATION_FAILED';
  orderId: string;
  reason: string;
}

interface PaymentCompletedEvent extends DomainEvent {
  type: 'PAYMENT_COMPLETED';
  orderId: string;
  paymentId: string;
}

interface PaymentFailedEvent extends DomainEvent {
  type: 'PAYMENT_FAILED';
  orderId: string;
  reason: string;
}

// Event Bus Abstraction
@Injectable()
export class EventBus {
  constructor(
    private readonly emitter: EventEmitter2,
    private readonly eventStore: EventStore
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    // Persist event
    await this.eventStore.append(event);

    // Emit to local handlers
    this.emitter.emit(event.type, event);

    // Publish to message broker (Kafka, RabbitMQ, etc.)
    await this.publishToExternalBroker(event);
  }

  private async publishToExternalBroker(event: DomainEvent): Promise<void> {
    // Implementation depends on your message broker
  }
}

// Order Service - Initiator
@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async createOrder(request: CreateOrderRequest): Promise<Order> {
    const order = await this.orderRepository.create({
      id: generateId(),
      customerId: request.customerId,
      items: request.items,
      totalAmount: this.calculateTotal(request.items),
      status: 'PENDING'
    });

    // Publish event - don't care who reacts
    await this.eventBus.publish({
      eventId: generateId(),
      type: 'ORDER_CREATED',
      correlationId: order.id,
      timestamp: new Date(),
      orderId: order.id,
      customerId: order.customerId,
      items: order.items,
      totalAmount: order.totalAmount
    });

    return order;
  }

  @OnEvent('PAYMENT_COMPLETED')
  async onPaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    await this.orderRepository.updateStatus(event.orderId, 'CONFIRMED');

    await this.eventBus.publish({
      eventId: generateId(),
      type: 'ORDER_CONFIRMED',
      correlationId: event.orderId,
      timestamp: new Date(),
      orderId: event.orderId
    });
  }

  @OnEvent('PAYMENT_FAILED')
  async onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    await this.orderRepository.updateStatus(event.orderId, 'FAILED');
  }

  @OnEvent('INVENTORY_RESERVATION_FAILED')
  async onInventoryFailed(event: InventoryReservationFailedEvent): Promise<void> {
    await this.orderRepository.updateStatus(event.orderId, 'FAILED');
  }
}

// Inventory Service - Reactor
@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly eventBus: EventBus
  ) {}

  @OnEvent('ORDER_CREATED')
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      const reservation = await this.reserveStock(event.items);

      await this.eventBus.publish({
        eventId: generateId(),
        type: 'INVENTORY_RESERVED',
        correlationId: event.orderId,
        timestamp: new Date(),
        orderId: event.orderId,
        reservationId: reservation.id
      });
    } catch (error) {
      await this.eventBus.publish({
        eventId: generateId(),
        type: 'INVENTORY_RESERVATION_FAILED',
        correlationId: event.orderId,
        timestamp: new Date(),
        orderId: event.orderId,
        reason: error.message
      });
    }
  }

  @OnEvent('PAYMENT_FAILED')
  async onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    // Release reserved inventory
    const reservation = await this.inventoryRepository.findByOrderId(event.orderId);
    if (reservation) {
      await this.inventoryRepository.release(reservation.id);
    }
  }

  private async reserveStock(items: OrderItem[]): Promise<Reservation> {
    // Check and reserve stock for each item
    for (const item of items) {
      const stock = await this.inventoryRepository.findBySku(item.sku);
      if (stock.available < item.quantity) {
        throw new Error(`Insufficient stock for ${item.sku}`);
      }
    }

    return this.inventoryRepository.createReservation(items);
  }
}

// Payment Service - Reactor
@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentGateway: PaymentGateway,
    private readonly eventBus: EventBus
  ) {}

  @OnEvent('INVENTORY_RESERVED')
  async onInventoryReserved(event: InventoryReservedEvent): Promise<void> {
    // Need order details - could be in event or fetched
    const order = await this.orderClient.getOrder(event.orderId);

    try {
      const payment = await this.paymentGateway.charge({
        customerId: order.customerId,
        amount: order.totalAmount,
        orderId: event.orderId
      });

      await this.eventBus.publish({
        eventId: generateId(),
        type: 'PAYMENT_COMPLETED',
        correlationId: event.orderId,
        timestamp: new Date(),
        orderId: event.orderId,
        paymentId: payment.id
      });
    } catch (error) {
      await this.eventBus.publish({
        eventId: generateId(),
        type: 'PAYMENT_FAILED',
        correlationId: event.orderId,
        timestamp: new Date(),
        orderId: event.orderId,
        reason: error.message
      });
    }
  }
}

// Notification Service - Observer (doesn't affect flow)
@Injectable()
export class NotificationService {
  constructor(private readonly emailService: EmailService) {}

  @OnEvent('ORDER_CREATED')
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.emailService.send({
      to: event.customerId,
      template: 'order-received',
      data: { orderId: event.orderId }
    });
  }

  @OnEvent('ORDER_CONFIRMED')
  async onOrderConfirmed(event: OrderConfirmedEvent): Promise<void> {
    await this.emailService.send({
      to: event.customerId,
      template: 'order-confirmed',
      data: { orderId: event.orderId }
    });
  }

  @OnEvent('PAYMENT_FAILED')
  async onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    await this.emailService.send({
      to: event.customerId,
      template: 'payment-failed',
      data: { orderId: event.orderId, reason: event.reason }
    });
  }
}

// Saga State Tracker (for monitoring/debugging)
@Injectable()
export class SagaStateTracker {
  private states: Map<string, ChoreographySagaState> = new Map();

  @OnEvent('ORDER_CREATED')
  onOrderCreated(event: OrderCreatedEvent): void {
    this.states.set(event.orderId, {
      orderId: event.orderId,
      startedAt: event.timestamp,
      events: [event],
      completed: false
    });
  }

  @OnEvent('INVENTORY_RESERVED')
  @OnEvent('INVENTORY_RESERVATION_FAILED')
  @OnEvent('PAYMENT_COMPLETED')
  @OnEvent('PAYMENT_FAILED')
  @OnEvent('ORDER_CONFIRMED')
  onAnyEvent(event: DomainEvent): void {
    const state = this.states.get(event.correlationId);
    if (state) {
      state.events.push(event);

      if (event.type === 'ORDER_CONFIRMED' ||
          event.type === 'PAYMENT_FAILED' ||
          event.type === 'INVENTORY_RESERVATION_FAILED') {
        state.completed = true;
        state.completedAt = event.timestamp;
      }
    }
  }

  getState(orderId: string): ChoreographySagaState | undefined {
    return this.states.get(orderId);
  }
}
```

### Hybrid Pattern Implementation

```typescript
// Domain boundary: Use choreography between domains
// Within domain: Use orchestration

// ============= ORDERING DOMAIN =============
@Injectable()
export class OrderingDomainService {
  constructor(
    private readonly orchestrator: OrderFulfillmentOrchestrator,
    private readonly eventBus: DomainEventBus
  ) {}

  async submitOrder(request: SubmitOrderRequest): Promise<Order> {
    // Orchestrated workflow within domain
    const result = await this.orchestrator.execute(request);

    // Publish domain event for other bounded contexts
    await this.eventBus.publish({
      type: 'OrderSubmitted',
      orderId: result.orderId,
      timestamp: new Date()
    });

    return result;
  }
}

// Internal orchestrator
class OrderFulfillmentOrchestrator {
  async execute(request: SubmitOrderRequest): Promise<OrderResult> {
    // Step 1: Validate order
    const validation = await this.validateOrder(request);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }

    // Step 2: Apply business rules
    const pricing = await this.calculatePricing(request);

    // Step 3: Create order aggregate
    const order = await this.createOrder(request, pricing);

    // Step 4: Internal domain events
    await this.applyPromotions(order);

    return order;
  }
}

// ============= SHIPPING DOMAIN =============
@Injectable()
export class ShippingDomainService implements OnModuleInit {
  // React to events from other domains (choreography)
  @OnEvent('OrderSubmitted')
  async onOrderSubmitted(event: OrderSubmittedEvent): Promise<void> {
    // Internal orchestration within shipping domain
    const orchestrator = new ShipmentOrchestrator(this.dependencies);
    await orchestrator.planShipment(event.orderId);
  }
}

class ShipmentOrchestrator {
  async planShipment(orderId: string): Promise<Shipment> {
    // Orchestrated steps within shipping domain
    const order = await this.orderClient.getOrder(orderId);

    // Step 1: Calculate shipping options
    const options = await this.calculateOptions(order);

    // Step 2: Select carrier
    const carrier = await this.selectCarrier(options);

    // Step 3: Create shipment
    const shipment = await this.createShipment(order, carrier);

    // Step 4: Schedule pickup
    await this.schedulePickup(shipment);

    return shipment;
  }
}

// ============= NOTIFICATION DOMAIN =============
@Injectable()
export class NotificationDomainService {
  // Pure choreography - just react to events
  @OnEvent('OrderSubmitted')
  async onOrderSubmitted(event: OrderSubmittedEvent): Promise<void> {
    await this.sendEmail('order-confirmation', event);
  }

  @OnEvent('ShipmentCreated')
  async onShipmentCreated(event: ShipmentCreatedEvent): Promise<void> {
    await this.sendEmail('shipment-notification', event);
    await this.sendSMS('shipment-tracking', event);
  }
}
```

## Best Practices

### Orchestration Best Practices

#### 1. Implement Idempotent Steps

```typescript
class IdempotentSagaStep {
  async execute(state: SagaState): Promise<void> {
    // Check if already executed
    const execution = await this.executionRepository.find(
      state.sagaId,
      this.stepName
    );

    if (execution?.status === 'COMPLETED') {
      // Already done - return cached result
      return execution.result;
    }

    // Use idempotency key
    const result = await this.service.execute({
      idempotencyKey: `${state.sagaId}-${this.stepName}`,
      ...state.data
    });

    await this.executionRepository.save({
      sagaId: state.sagaId,
      step: this.stepName,
      status: 'COMPLETED',
      result
    });

    return result;
  }
}
```

#### 2. Persist Saga State

```typescript
interface SagaState {
  id: string;
  type: string;
  currentStep: number;
  data: any;
  compensationLog: CompensationEntry[];
  createdAt: Date;
  updatedAt: Date;
}

class PersistentSagaOrchestrator {
  async execute(sagaId: string): Promise<void> {
    let state = await this.sagaRepository.find(sagaId);

    if (!state) {
      state = await this.initializeSaga(sagaId);
    }

    // Resume from where we left off
    const startStep = state.currentStep;

    for (let i = startStep; i < this.steps.length; i++) {
      try {
        await this.steps[i].execute(state);

        state.currentStep = i + 1;
        state.updatedAt = new Date();
        await this.sagaRepository.save(state);
      } catch (error) {
        state.status = 'FAILED';
        state.error = error.message;
        await this.sagaRepository.save(state);
        throw error;
      }
    }
  }
}
```

### Choreography Best Practices

#### 1. Include Sufficient Event Data

```typescript
// Bad: Insufficient data requires additional calls
interface BadOrderCreatedEvent {
  orderId: string;  // Other services need to fetch order details
}

// Good: Include data consumers need
interface GoodOrderCreatedEvent {
  eventId: string;
  type: 'ORDER_CREATED';
  timestamp: Date;
  orderId: string;
  customerId: string;
  items: Array<{
    sku: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress: Address;
  // Include what downstream services need
}
```

#### 2. Implement Event Versioning

```typescript
// Event versioning for evolution
interface OrderCreatedEventV1 {
  version: 1;
  type: 'ORDER_CREATED';
  orderId: string;
  items: string[];  // Just SKUs
}

interface OrderCreatedEventV2 {
  version: 2;
  type: 'ORDER_CREATED';
  orderId: string;
  items: Array<{ sku: string; quantity: number; price: number }>;
}

type OrderCreatedEvent = OrderCreatedEventV1 | OrderCreatedEventV2;

// Handler that supports both versions
class InventoryEventHandler {
  @OnEvent('ORDER_CREATED')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    const items = this.normalizeItems(event);
    await this.reserveStock(items);
  }

  private normalizeItems(event: OrderCreatedEvent): NormalizedItem[] {
    if (event.version === 1) {
      // V1: Fetch full item details
      return this.enrichItems(event.items);
    } else {
      // V2: Already has full details
      return event.items;
    }
  }
}
```

#### 3. Handle Out-of-Order Events

```typescript
class OrderedEventHandler {
  private eventBuffer: Map<string, DomainEvent[]> = new Map();
  private processedSequences: Map<string, number> = new Map();

  async handle(event: SequencedEvent): Promise<void> {
    const lastProcessed = this.processedSequences.get(event.correlationId) || 0;

    if (event.sequence === lastProcessed + 1) {
      // In order - process immediately
      await this.processEvent(event);
      this.processedSequences.set(event.correlationId, event.sequence);

      // Check buffer for next events
      await this.processBuffered(event.correlationId);
    } else if (event.sequence > lastProcessed + 1) {
      // Out of order - buffer
      this.bufferEvent(event);
    }
    // Duplicate (sequence <= lastProcessed) - ignore
  }

  private async processBuffered(correlationId: string): Promise<void> {
    const buffer = this.eventBuffer.get(correlationId) || [];
    let lastProcessed = this.processedSequences.get(correlationId) || 0;

    // Sort and process in order
    buffer.sort((a, b) => a.sequence - b.sequence);

    while (buffer.length > 0 && buffer[0].sequence === lastProcessed + 1) {
      const event = buffer.shift()!;
      await this.processEvent(event);
      lastProcessed = event.sequence;
      this.processedSequences.set(correlationId, lastProcessed);
    }
  }
}
```

## Common Pitfalls

### Orchestration Pitfalls

#### 1. Orchestrator Becoming a Bottleneck

```typescript
// Anti-pattern: Orchestrator does too much
class MonolithicOrchestrator {
  async processOrder(order: Order): Promise<void> {
    // Orchestrator contains business logic
    const discount = this.calculateDiscount(order);  // Should be in Order service
    const tax = this.calculateTax(order);  // Should be in Tax service
    const shipping = this.calculateShipping(order);  // Should be in Shipping service

    // All logic centralized - becomes a monolith
  }
}

// Better: Orchestrator only coordinates, services contain logic
class LeanOrchestrator {
  async processOrder(order: Order): Promise<void> {
    // Just coordinate - services handle their own logic
    await this.orderService.processOrder(order);
    await this.inventoryService.reserve(order);
    await this.paymentService.charge(order);
    // No business logic in orchestrator
  }
}
```

#### 2. Missing Compensation Logic

```typescript
// Anti-pattern: Incomplete compensation
class IncompleteOrchestrator {
  async execute(): Promise<void> {
    try {
      await this.step1();
      await this.step2();
      await this.step3();
    } catch (error) {
      // Only compensates step3!
      await this.compensateStep3();
      throw error;
    }
  }
}

// Better: Track all steps that need compensation
class CompleteOrchestrator {
  async execute(): Promise<void> {
    const completed: string[] = [];

    try {
      await this.step1();
      completed.push('step1');

      await this.step2();
      completed.push('step2');

      await this.step3();
      completed.push('step3');
    } catch (error) {
      // Compensate all completed steps in reverse
      for (const step of completed.reverse()) {
        await this.compensate(step);
      }
      throw error;
    }
  }
}
```

### Choreography Pitfalls

#### 1. Cyclic Event Dependencies

```typescript
// Anti-pattern: Events create a cycle
// Service A: ORDER_CREATED -> Service B
// Service B: INVENTORY_RESERVED -> Service C
// Service C: PAYMENT_COMPLETED -> Service A
// Service A: ORDER_CONFIRMED -> Service B (for some reason)
// Service B: SOMETHING_HAPPENED -> Service C
// ... potential infinite loop or complex debugging

// Better: Clear event flow with no cycles
// Define clear event ownership and flow direction
/*
ORDER_CREATED
  -> INVENTORY_RESERVED
    -> PAYMENT_COMPLETED
      -> ORDER_CONFIRMED (terminal event)

Failure events:
INVENTORY_RESERVATION_FAILED -> ORDER_FAILED
PAYMENT_FAILED -> INVENTORY_RELEASED -> ORDER_FAILED
*/
```

#### 2. Missing Event Handlers

```typescript
// Anti-pattern: Events with no handlers
class IncompleteChoreography {
  @OnEvent('ORDER_CREATED')
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // Reserve inventory
    await this.reserveInventory(event.orderId);

    await this.eventBus.publish({
      type: 'INVENTORY_RESERVED',
      orderId: event.orderId
    });
  }

  // PAYMENT_FAILED is published but nothing handles it!
  // Inventory stays reserved forever
}

// Better: Handle all possible events
class CompleteChoreography {
  @OnEvent('PAYMENT_FAILED')
  async onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    // Release reserved inventory
    await this.releaseInventory(event.orderId);

    // Notify that reservation is released
    await this.eventBus.publish({
      type: 'INVENTORY_RELEASED',
      orderId: event.orderId
    });
  }
}
```

#### 3. Lack of Correlation Tracking

```typescript
// Anti-pattern: Can't trace event flow
interface UntrackedEvent {
  type: string;
  orderId: string;
  timestamp: Date;
}

// Better: Include correlation and causation
interface TrackedEvent {
  eventId: string;           // Unique event identifier
  type: string;
  correlationId: string;     // Groups related events (e.g., orderId)
  causationId: string;       // ID of event that caused this one
  timestamp: Date;
  source: string;            // Service that emitted the event
}

// Now you can trace:
// Event A (causationId: null) -> Event B (causationId: A.eventId) -> Event C (causationId: B.eventId)
```

## Performance Considerations

### Orchestration Performance

```typescript
// Optimize orchestration latency
class OptimizedOrchestrator {
  async execute(order: Order): Promise<void> {
    // Sequential where necessary
    const reservation = await this.inventoryService.reserve(order);

    // Parallel where possible
    const [payment, shipping] = await Promise.all([
      this.paymentService.charge(order, reservation),
      this.shippingService.calculate(order)
    ]);

    // Continue with results
    await this.orderService.confirm(order, { payment, shipping });
  }
}

// Add timeouts to prevent hanging
class TimeoutOrchestrator {
  async executeWithTimeout(order: Order): Promise<void> {
    const stepTimeout = 5000; // 5 seconds per step

    await this.withTimeout(
      () => this.inventoryService.reserve(order),
      stepTimeout,
      'Inventory reservation timeout'
    );

    await this.withTimeout(
      () => this.paymentService.charge(order),
      stepTimeout,
      'Payment processing timeout'
    );
  }

  private async withTimeout<T>(
    operation: () => Promise<T>,
    timeout: number,
    message: string
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(message)), timeout)
      )
    ]);
  }
}
```

### Choreography Performance

```typescript
// Optimize event processing throughput
class OptimizedEventHandler {
  private readonly concurrency = 10;
  private readonly batchSize = 100;

  async processEvents(events: DomainEvent[]): Promise<void> {
    // Batch processing
    for (let i = 0; i < events.length; i += this.batchSize) {
      const batch = events.slice(i, i + this.batchSize);

      // Process batch with controlled concurrency
      await this.processBatch(batch);
    }
  }

  private async processBatch(events: DomainEvent[]): Promise<void> {
    const semaphore = new Semaphore(this.concurrency);

    await Promise.all(
      events.map(async (event) => {
        await semaphore.acquire();
        try {
          await this.processEvent(event);
        } finally {
          semaphore.release();
        }
      })
    );
  }
}

// Optimize with event batching at producer
class BatchingEventBus {
  private buffer: DomainEvent[] = [];
  private flushInterval = 100; // ms

  async publish(event: DomainEvent): Promise<void> {
    this.buffer.push(event);

    if (this.buffer.length >= 100) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    const events = this.buffer;
    this.buffer = [];

    // Batch publish to message broker
    await this.broker.publishBatch(events);
  }
}
```

## Real-World Scenarios

### Scenario: E-Commerce Order Processing

```typescript
// Hybrid approach for e-commerce

// 1. Order domain uses orchestration internally
class OrderDomainOrchestrator {
  async submitOrder(cart: Cart, customer: Customer): Promise<Order> {
    // Orchestrated: validate -> price -> create
    const validation = await this.validateCart(cart);
    const pricing = await this.calculatePricing(cart, customer);
    const order = await this.createOrder(cart, pricing, customer);

    // Publish for external domains
    await this.eventBus.publish({
      type: 'OrderSubmitted',
      order
    });

    return order;
  }
}

// 2. Cross-domain uses choreography
// Inventory domain
@OnEvent('OrderSubmitted')
async onOrderSubmitted(event: OrderSubmittedEvent): Promise<void> {
  await this.reserveInventory(event.order);
  await this.eventBus.publish({ type: 'InventoryReserved', orderId: event.order.id });
}

// Payment domain
@OnEvent('InventoryReserved')
async onInventoryReserved(event: InventoryReservedEvent): Promise<void> {
  const payment = await this.processPayment(event.orderId);
  await this.eventBus.publish({ type: 'PaymentCompleted', orderId: event.orderId, paymentId: payment.id });
}

// Fulfillment domain
@OnEvent('PaymentCompleted')
async onPaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
  // Internal orchestration for fulfillment
  await this.fulfillmentOrchestrator.startFulfillment(event.orderId);
}
```

### Scenario: Banking Transaction Processing

```typescript
// Banks often prefer orchestration for control and audit

class TransferOrchestrator {
  async executeTransfer(transfer: Transfer): Promise<TransferResult> {
    const saga = new TransferSaga(transfer);

    try {
      // Step 1: Validate accounts
      await saga.validateAccounts();

      // Step 2: Check fraud
      const fraudCheck = await saga.checkFraud();
      if (fraudCheck.flagged) {
        return saga.flagForReview();
      }

      // Step 3: Debit source account
      await saga.debitSource();

      // Step 4: Credit destination account
      await saga.creditDestination();

      // Step 5: Record transaction
      await saga.recordTransaction();

      // Step 6: Send notifications
      await saga.sendNotifications();

      return saga.complete();
    } catch (error) {
      // Full audit trail of compensation
      await saga.compensateWithAudit();
      throw error;
    }
  }
}
```

## Interview Key Points

### Understanding Questions

**Q1: Explain the difference between choreography and orchestration.**

Orchestration uses a central coordinator that explicitly controls the workflow, telling each service what to do and when. Choreography is decentralized - services react to events and publish their own events without central control.

**Q2: When would you choose orchestration over choreography?**

Choose orchestration when:
- Workflows are complex with conditional logic
- You need explicit control and visibility
- Error handling and compensation are complex
- Audit trails are required
- The team prefers explicit workflow definitions

**Q3: What are the main challenges with choreography?**

- Workflow visibility is implicit and hard to trace
- Debugging requires distributed tracing
- Ensuring all events are handled
- Managing event ordering
- Avoiding cyclic dependencies
- Coordinating compensation across services

### Technical Questions

**Q4: How do you handle failures in choreography?**

```typescript
// Use compensating events
@OnEvent('PAYMENT_FAILED')
async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
  // Publish compensation event
  await this.eventBus.publish({
    type: 'RELEASE_INVENTORY_REQUESTED',
    orderId: event.orderId
  });
}

// Inventory service reacts to compensation
@OnEvent('RELEASE_INVENTORY_REQUESTED')
async handleReleaseRequest(event: ReleaseInventoryEvent): Promise<void> {
  await this.releaseInventory(event.orderId);
}
```

**Q5: How do you ensure exactly-once processing in choreography?**

```typescript
// Idempotent event handling
class IdempotentHandler {
  async handle(event: DomainEvent): Promise<void> {
    // Check if already processed
    const processed = await this.eventLog.exists(event.eventId);
    if (processed) {
      return; // Already handled
    }

    // Process with idempotency key
    await this.processEvent(event);

    // Mark as processed
    await this.eventLog.markProcessed(event.eventId);
  }
}
```

## Further Reading

### Official Resources

- [Microsoft - Saga Pattern](https://docs.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga)
- [AWS - Saga Orchestration](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/saga-pattern.html)
- [Temporal.io Documentation](https://docs.temporal.io/) - Workflow orchestration platform

### Books

- "Microservices Patterns" by Chris Richardson - Chapters on Saga patterns
- "Enterprise Integration Patterns" by Gregor Hohpe - Event-driven patterns
- "Building Event-Driven Microservices" by Adam Bellemare

### Technical Articles

- [Saga Pattern - microservices.io](https://microservices.io/patterns/data/saga.html)
- [Choreography vs Orchestration in the land of serverless](https://theburningmonk.com/2020/08/choreography-vs-orchestration-in-the-land-of-serverless/)
- [Event Choreography - Martin Fowler](https://martinfowler.com/articles/201701-event-driven.html)

### Tools

- [Temporal](https://temporal.io/) - Workflow orchestration platform
- [Camunda](https://camunda.com/) - BPM and workflow automation
- [Apache Kafka](https://kafka.apache.org/) - Event streaming for choreography
- [AWS Step Functions](https://aws.amazon.com/step-functions/) - Serverless orchestration

---

Both choreography and orchestration are powerful patterns for coordinating distributed workflows. The choice between them depends on your specific requirements for control, visibility, coupling, and scalability. Many successful systems use a hybrid approach, applying orchestration within bounded contexts and choreography across domain boundaries. Understanding the trade-offs of each pattern enables you to make informed architectural decisions for your distributed systems.
