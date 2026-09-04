---
title: Saga Pattern
description: Master Saga pattern for distributed transactions
track: architecture
section: design-patterns
difficulty: advanced
tags:
  - Saga
  - distributed transactions
  - microservices
  - eventual consistency
status: imported
origin: old/src/content/docs/architecture/saga-pattern.en.md
divergence: 0.223
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Architecture
  subcategory: Patterns
  order: 15
  lastUpdated: 2026-01-07
---

## Concept Overview

The Saga pattern is a design pattern for managing distributed transactions across multiple microservices. Unlike traditional ACID transactions that rely on a single database, Sagas coordinate a series of local transactions where each service performs its own transaction and publishes events to trigger the next step. If any step fails, compensating transactions are executed to undo the changes made by preceding steps.

### What is the Saga Pattern?

In a microservices architecture, each service typically owns its own database. When a business operation spans multiple services, we cannot use traditional database transactions because they only work within a single database. The Saga pattern solves this by breaking a distributed transaction into a sequence of local transactions.

Consider an e-commerce order workflow:

```
Traditional Monolithic Transaction:
BEGIN TRANSACTION
  1. Create Order
  2. Reserve Inventory
  3. Process Payment
  4. Confirm Order
COMMIT

Saga Pattern:
Step 1: Create Order (Order Service)
  -> Publish OrderCreated event
Step 2: Reserve Inventory (Inventory Service)
  -> Publish InventoryReserved event
Step 3: Process Payment (Payment Service)
  -> Publish PaymentProcessed event
Step 4: Confirm Order (Order Service)
  -> Publish OrderConfirmed event

If Payment fails:
  Compensate Step 2: Release Inventory
  Compensate Step 1: Cancel Order
```

### Core Characteristics

The Saga pattern has the following fundamental characteristics:

1. **Local Transactions**: Each step is a local ACID transaction within a single service
2. **Compensating Transactions**: Each step has a corresponding compensation action for rollback
3. **Eventual Consistency**: The system achieves consistency over time, not immediately
4. **No Distributed Locks**: Avoids the performance overhead of two-phase commit (2PC)

### Comparison with Two-Phase Commit

| Aspect | Two-Phase Commit (2PC) | Saga Pattern |
|--------|------------------------|--------------|
| Consistency Model | Strong consistency | Eventual consistency |
| Performance | Lower (blocking, locks) | Higher (no distributed locks) |
| Availability | Lower (coordinator single point) | Higher (decentralized) |
| Complexity | Protocol complexity | Business logic complexity |
| Failure Handling | Automatic rollback | Requires compensating transactions |
| Scalability | Limited | High |
| Use Case | Traditional databases | Microservices |

---

## Choreography vs Orchestration

There are two primary approaches to implementing the Saga pattern: Choreography and Orchestration. Each has its own trade-offs and is suited for different scenarios.

### Choreography-Based Saga

In the choreography approach, each service produces and listens to events. There is no central coordinator; services react to events and know what to do next.

```
Choreography Flow:

+-------------+    OrderCreated    +-------------+
|   Order     | ------------------> | Inventory   |
|   Service   |                     |   Service   |
+-------------+                     +------+------+
                                           |
                                   InventoryReserved
                                           |
                                           v
+-------------+    PaymentProcessed +-------------+
|   Order     | <------------------ |   Payment   |
|   Service   |                     |   Service   |
+------+------+                     +-------------+
       |
OrderConfirmed
       |
       v
+-------------+
| Notification|
|   Service   |
+-------------+
```

#### Implementation Example

```typescript
// Order Service - Initiates the Saga
class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private eventBus: EventBus
  ) {}

  async createOrder(orderData: CreateOrderDTO): Promise<Order> {
    // Step 1: Create order in PENDING state
    const order = await this.orderRepository.create({
      ...orderData,
      status: OrderStatus.PENDING
    });

    // Publish event for next step
    await this.eventBus.publish({
      type: 'OrderCreated',
      payload: {
        orderId: order.id,
        customerId: order.customerId,
        items: order.items,
        totalAmount: order.totalAmount,
        timestamp: new Date().toISOString()
      }
    });

    return order;
  }

  // Event handlers for saga continuation
  @EventHandler('InventoryReserved')
  async onInventoryReserved(event: InventoryReservedEvent): Promise<void> {
    // Update order status
    await this.orderRepository.updateStatus(
      event.orderId,
      OrderStatus.INVENTORY_RESERVED
    );
  }

  @EventHandler('PaymentProcessed')
  async onPaymentProcessed(event: PaymentProcessedEvent): Promise<void> {
    // Confirm the order
    await this.orderRepository.updateStatus(
      event.orderId,
      OrderStatus.CONFIRMED
    );

    // Publish confirmation event
    await this.eventBus.publish({
      type: 'OrderConfirmed',
      payload: {
        orderId: event.orderId,
        confirmedAt: new Date().toISOString()
      }
    });
  }

  // Compensation handlers
  @EventHandler('InventoryReserveFailed')
  async onInventoryReserveFailed(event: InventoryReserveFailedEvent): Promise<void> {
    // Compensate: Cancel the order
    await this.orderRepository.updateStatus(
      event.orderId,
      OrderStatus.CANCELLED
    );

    await this.eventBus.publish({
      type: 'OrderCancelled',
      payload: {
        orderId: event.orderId,
        reason: event.reason,
        cancelledAt: new Date().toISOString()
      }
    });
  }

  @EventHandler('PaymentFailed')
  async onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    // Order stays in pending, will be handled by inventory service compensation
    await this.orderRepository.updateStatus(
      event.orderId,
      OrderStatus.PAYMENT_FAILED
    );
  }
}

// Inventory Service - Second step in Saga
class InventoryService {
  constructor(
    private inventoryRepository: InventoryRepository,
    private eventBus: EventBus
  ) {}

  @EventHandler('OrderCreated')
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      // Check and reserve inventory
      for (const item of event.items) {
        const inventory = await this.inventoryRepository.findByProductId(item.productId);

        if (inventory.available < item.quantity) {
          throw new InsufficientInventoryError(item.productId, item.quantity, inventory.available);
        }
      }

      // Reserve inventory
      const reservation = await this.inventoryRepository.reserve({
        orderId: event.orderId,
        items: event.items,
        reservedAt: new Date()
      });

      // Publish success event
      await this.eventBus.publish({
        type: 'InventoryReserved',
        payload: {
          orderId: event.orderId,
          reservationId: reservation.id,
          items: event.items,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      // Publish failure event
      await this.eventBus.publish({
        type: 'InventoryReserveFailed',
        payload: {
          orderId: event.orderId,
          reason: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Compensation handler
  @EventHandler('PaymentFailed')
  async onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    // Release reserved inventory
    await this.inventoryRepository.releaseReservation(event.orderId);

    await this.eventBus.publish({
      type: 'InventoryReleased',
      payload: {
        orderId: event.orderId,
        reason: 'Payment failed',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Payment Service - Third step in Saga
class PaymentService {
  constructor(
    private paymentGateway: PaymentGateway,
    private paymentRepository: PaymentRepository,
    private eventBus: EventBus
  ) {}

  @EventHandler('InventoryReserved')
  async onInventoryReserved(event: InventoryReservedEvent): Promise<void> {
    try {
      // Process payment
      const paymentResult = await this.paymentGateway.charge({
        orderId: event.orderId,
        amount: event.totalAmount,
        currency: 'USD'
      });

      // Record payment
      await this.paymentRepository.create({
        orderId: event.orderId,
        transactionId: paymentResult.transactionId,
        amount: event.totalAmount,
        status: PaymentStatus.COMPLETED
      });

      // Publish success event
      await this.eventBus.publish({
        type: 'PaymentProcessed',
        payload: {
          orderId: event.orderId,
          transactionId: paymentResult.transactionId,
          amount: event.totalAmount,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      // Publish failure event to trigger compensation
      await this.eventBus.publish({
        type: 'PaymentFailed',
        payload: {
          orderId: event.orderId,
          reason: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}
```

#### Choreography Advantages and Disadvantages

| Advantages | Disadvantages |
|------------|---------------|
| Simple to implement for small sagas | Difficult to track saga state |
| No single point of failure | Risk of cyclic dependencies |
| Services are loosely coupled | Hard to understand overall flow |
| Easy to add new services | Testing becomes complex |
| Good for simple workflows | Difficult to implement complex logic |

### Orchestration-Based Saga

In the orchestration approach, a central Saga Orchestrator coordinates the entire transaction flow. It tells each service what to do and handles the compensation logic.

```
Orchestration Flow:

                     +-------------------+
                     | Saga Orchestrator |
                     +--------+----------+
                              |
      +-----------+-----------+-----------+-----------+
      |           |           |           |           |
      v           v           v           v           v
+----------+ +----------+ +----------+ +----------+ +----------+
|  Order   | |Inventory | | Payment  | | Shipping | |  Notify  |
| Service  | | Service  | | Service  | | Service  | | Service  |
+----------+ +----------+ +----------+ +----------+ +----------+
```

#### Implementation Example

```typescript
// Saga Step Definition
interface SagaStep<TContext> {
  name: string;
  action: (context: TContext) => Promise<void>;
  compensation: (context: TContext) => Promise<void>;
}

// Saga Execution State
interface SagaState {
  sagaId: string;
  sagaType: string;
  currentStep: number;
  status: 'RUNNING' | 'COMPLETED' | 'COMPENSATING' | 'FAILED';
  context: Record<string, unknown>;
  completedSteps: string[];
  compensatedSteps: string[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

// Generic Saga Orchestrator
class SagaOrchestrator<TContext> {
  private steps: SagaStep<TContext>[] = [];

  constructor(
    private sagaName: string,
    private sagaRepository: SagaRepository,
    private eventBus: EventBus
  ) {}

  addStep(step: SagaStep<TContext>): this {
    this.steps.push(step);
    return this;
  }

  async execute(initialContext: TContext): Promise<TContext> {
    const sagaId = generateUUID();
    const context = { ...initialContext, sagaId };

    // Initialize saga state
    let sagaState: SagaState = {
      sagaId,
      sagaType: this.sagaName,
      currentStep: 0,
      status: 'RUNNING',
      context: context as Record<string, unknown>,
      completedSteps: [],
      compensatedSteps: [],
      startedAt: new Date()
    };

    await this.sagaRepository.save(sagaState);

    try {
      // Execute each step
      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        sagaState.currentStep = i;

        console.log(`[Saga ${sagaId}] Executing step: ${step.name}`);

        try {
          await step.action(context);
          sagaState.completedSteps.push(step.name);
          await this.sagaRepository.save(sagaState);

          await this.eventBus.publish({
            type: 'SagaStepCompleted',
            payload: { sagaId, step: step.name, stepIndex: i }
          });
        } catch (stepError) {
          console.error(`[Saga ${sagaId}] Step ${step.name} failed:`, stepError);

          // Start compensation
          sagaState.status = 'COMPENSATING';
          sagaState.error = stepError.message;
          await this.sagaRepository.save(sagaState);

          await this.compensate(sagaState, context);

          throw new SagaExecutionError(
            `Saga ${sagaId} failed at step ${step.name}: ${stepError.message}`
          );
        }
      }

      // Saga completed successfully
      sagaState.status = 'COMPLETED';
      sagaState.completedAt = new Date();
      await this.sagaRepository.save(sagaState);

      await this.eventBus.publish({
        type: 'SagaCompleted',
        payload: { sagaId, sagaType: this.sagaName }
      });

      return context;
    } catch (error) {
      sagaState.status = 'FAILED';
      sagaState.completedAt = new Date();
      await this.sagaRepository.save(sagaState);

      await this.eventBus.publish({
        type: 'SagaFailed',
        payload: { sagaId, sagaType: this.sagaName, error: error.message }
      });

      throw error;
    }
  }

  private async compensate(sagaState: SagaState, context: TContext): Promise<void> {
    console.log(`[Saga ${sagaState.sagaId}] Starting compensation...`);

    // Compensate in reverse order
    const stepsToCompensate = [...sagaState.completedSteps].reverse();

    for (const stepName of stepsToCompensate) {
      const step = this.steps.find(s => s.name === stepName);

      if (!step) continue;

      try {
        console.log(`[Saga ${sagaState.sagaId}] Compensating step: ${stepName}`);
        await step.compensation(context);
        sagaState.compensatedSteps.push(stepName);
        await this.sagaRepository.save(sagaState);

        await this.eventBus.publish({
          type: 'SagaStepCompensated',
          payload: { sagaId: sagaState.sagaId, step: stepName }
        });
      } catch (compError) {
        console.error(
          `[Saga ${sagaState.sagaId}] Compensation failed for ${stepName}:`,
          compError
        );

        // Log for manual intervention
        await this.alertOperations(sagaState.sagaId, stepName, compError);
      }
    }
  }

  private async alertOperations(
    sagaId: string,
    stepName: string,
    error: Error
  ): Promise<void> {
    await this.eventBus.publish({
      type: 'SagaCompensationFailed',
      payload: {
        sagaId,
        step: stepName,
        error: error.message,
        requiresManualIntervention: true
      }
    });
  }
}

// Order Creation Saga Context
interface CreateOrderSagaContext {
  sagaId?: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  orderId?: string;
  reservationId?: string;
  paymentId?: string;
  shipmentId?: string;
}

// Order Creation Saga Implementation
class CreateOrderSaga {
  private orchestrator: SagaOrchestrator<CreateOrderSagaContext>;

  constructor(
    private orderService: OrderService,
    private inventoryService: InventoryService,
    private paymentService: PaymentService,
    private shippingService: ShippingService,
    private notificationService: NotificationService,
    sagaRepository: SagaRepository,
    eventBus: EventBus
  ) {
    this.orchestrator = new SagaOrchestrator<CreateOrderSagaContext>(
      'CreateOrderSaga',
      sagaRepository,
      eventBus
    );

    this.buildSaga();
  }

  private buildSaga(): void {
    this.orchestrator
      .addStep({
        name: 'CreateOrder',
        action: async (ctx) => {
          const order = await this.orderService.create({
            customerId: ctx.customerId,
            items: ctx.items,
            totalAmount: ctx.totalAmount,
            status: OrderStatus.PENDING
          });
          ctx.orderId = order.id;
        },
        compensation: async (ctx) => {
          if (ctx.orderId) {
            await this.orderService.cancel(ctx.orderId, 'Saga compensation');
          }
        }
      })
      .addStep({
        name: 'ReserveInventory',
        action: async (ctx) => {
          const reservation = await this.inventoryService.reserve({
            orderId: ctx.orderId!,
            items: ctx.items
          });
          ctx.reservationId = reservation.id;
        },
        compensation: async (ctx) => {
          if (ctx.reservationId) {
            await this.inventoryService.releaseReservation(ctx.reservationId);
          }
        }
      })
      .addStep({
        name: 'ProcessPayment',
        action: async (ctx) => {
          const payment = await this.paymentService.process({
            orderId: ctx.orderId!,
            customerId: ctx.customerId,
            amount: ctx.totalAmount
          });
          ctx.paymentId = payment.id;
        },
        compensation: async (ctx) => {
          if (ctx.paymentId) {
            await this.paymentService.refund(ctx.paymentId);
          }
        }
      })
      .addStep({
        name: 'CreateShipment',
        action: async (ctx) => {
          const shipment = await this.shippingService.create({
            orderId: ctx.orderId!,
            items: ctx.items
          });
          ctx.shipmentId = shipment.id;
        },
        compensation: async (ctx) => {
          if (ctx.shipmentId) {
            await this.shippingService.cancel(ctx.shipmentId);
          }
        }
      })
      .addStep({
        name: 'ConfirmOrder',
        action: async (ctx) => {
          await this.orderService.confirm(ctx.orderId!);
        },
        compensation: async (ctx) => {
          // Confirmation is the final step, typically no compensation needed
          // Or revert to previous status
        }
      })
      .addStep({
        name: 'SendNotification',
        action: async (ctx) => {
          await this.notificationService.sendOrderConfirmation({
            orderId: ctx.orderId!,
            customerId: ctx.customerId
          });
        },
        compensation: async (ctx) => {
          // Notifications are typically not compensated
          // Could send a cancellation notification instead
        }
      });
  }

  async execute(orderData: CreateOrderDTO): Promise<CreateOrderSagaContext> {
    return this.orchestrator.execute({
      customerId: orderData.customerId,
      items: orderData.items,
      totalAmount: orderData.totalAmount
    });
  }
}

// Usage
const saga = new CreateOrderSaga(
  orderService,
  inventoryService,
  paymentService,
  shippingService,
  notificationService,
  sagaRepository,
  eventBus
);

try {
  const result = await saga.execute({
    customerId: 'customer-123',
    items: [
      { productId: 'product-1', quantity: 2, price: 29.99 },
      { productId: 'product-2', quantity: 1, price: 49.99 }
    ],
    totalAmount: 109.97
  });

  console.log('Order created:', result.orderId);
} catch (error) {
  console.error('Order creation failed:', error.message);
}
```

#### Orchestration Advantages and Disadvantages

| Advantages | Disadvantages |
|------------|---------------|
| Clear transaction flow | Single point of failure (orchestrator) |
| Easy to track saga state | Higher coupling to orchestrator |
| Simpler error handling | Additional service to maintain |
| Better for complex sagas | Orchestrator can become complex |
| Easier testing | Additional latency |

### When to Use Each Approach

| Scenario | Recommended Approach |
|----------|---------------------|
| Simple workflows (2-4 steps) | Choreography |
| Complex workflows (5+ steps) | Orchestration |
| Need visibility into saga state | Orchestration |
| Highly independent services | Choreography |
| Need complex rollback logic | Orchestration |
| Event-driven architecture | Choreography |
| Frequent workflow changes | Orchestration |

---

## Compensating Transactions

Compensating transactions are the cornerstone of the Saga pattern. They are operations that semantically undo the effects of a previous transaction.

### Designing Compensating Transactions

Not all operations can be simply "undone." Compensation is about achieving a semantically equivalent reversal:

```typescript
// Example: Different types of compensating transactions

// 1. Direct reversal - straightforward undo
class InventoryCompensation {
  // Original action: Reserve 10 items
  async reserve(productId: string, quantity: number): Promise<void> {
    await this.db.query(
      'UPDATE inventory SET reserved = reserved + $1 WHERE product_id = $2',
      [quantity, productId]
    );
  }

  // Compensation: Release the 10 reserved items
  async releaseReservation(productId: string, quantity: number): Promise<void> {
    await this.db.query(
      'UPDATE inventory SET reserved = reserved - $1 WHERE product_id = $2',
      [quantity, productId]
    );
  }
}

// 2. Logical reversal - create opposing transaction
class PaymentCompensation {
  // Original action: Charge customer
  async charge(customerId: string, amount: number): Promise<Payment> {
    const payment = await this.paymentGateway.charge({
      customerId,
      amount,
      type: 'CHARGE'
    });
    return payment;
  }

  // Compensation: Issue refund (creates new transaction, doesn't delete original)
  async refund(paymentId: string): Promise<Refund> {
    const originalPayment = await this.paymentRepository.findById(paymentId);

    const refund = await this.paymentGateway.refund({
      originalTransactionId: originalPayment.transactionId,
      amount: originalPayment.amount,
      type: 'REFUND'
    });

    // Record the refund, don't delete the original payment
    await this.refundRepository.create({
      originalPaymentId: paymentId,
      refundTransactionId: refund.transactionId,
      amount: refund.amount,
      refundedAt: new Date()
    });

    return refund;
  }
}

// 3. State transition - change status instead of delete
class OrderCompensation {
  // Original action: Create order
  async createOrder(orderData: OrderDTO): Promise<Order> {
    return this.orderRepository.create({
      ...orderData,
      status: OrderStatus.CREATED
    });
  }

  // Compensation: Mark order as cancelled (don't delete)
  async cancelOrder(orderId: string, reason: string): Promise<void> {
    await this.orderRepository.update(orderId, {
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: reason
    });

    // Record the cancellation for audit
    await this.orderAuditRepository.create({
      orderId,
      action: 'CANCELLED',
      reason,
      timestamp: new Date()
    });
  }
}

// 4. Notification compensation - send correction
class NotificationCompensation {
  // Original action: Send confirmation email
  async sendConfirmation(orderId: string, email: string): Promise<void> {
    await this.emailService.send({
      to: email,
      template: 'order-confirmation',
      data: { orderId }
    });
  }

  // Compensation: Send cancellation email
  async sendCancellation(orderId: string, email: string, reason: string): Promise<void> {
    await this.emailService.send({
      to: email,
      template: 'order-cancelled',
      data: { orderId, reason }
    });
  }
}
```

### Idempotent Compensations

Compensating transactions must be idempotent because they may be executed multiple times due to retries:

```typescript
class IdempotentCompensation {
  constructor(
    private db: Database,
    private compensationLog: CompensationLogRepository
  ) {}

  async compensateWithIdempotency(
    sagaId: string,
    stepName: string,
    compensation: () => Promise<void>
  ): Promise<void> {
    // Check if compensation already executed
    const existing = await this.compensationLog.find(sagaId, stepName);

    if (existing && existing.status === 'COMPLETED') {
      console.log(`Compensation for ${stepName} already completed, skipping`);
      return;
    }

    // Record compensation attempt
    await this.compensationLog.upsert({
      sagaId,
      stepName,
      status: 'IN_PROGRESS',
      attemptedAt: new Date()
    });

    try {
      await compensation();

      // Mark as completed
      await this.compensationLog.upsert({
        sagaId,
        stepName,
        status: 'COMPLETED',
        completedAt: new Date()
      });
    } catch (error) {
      // Mark as failed for retry
      await this.compensationLog.upsert({
        sagaId,
        stepName,
        status: 'FAILED',
        error: error.message,
        failedAt: new Date()
      });
      throw error;
    }
  }
}

// Idempotent inventory release
class InventoryService {
  async releaseReservation(reservationId: string): Promise<void> {
    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      console.log(`Reservation ${reservationId} not found, possibly already released`);
      return;
    }

    if (reservation.status === 'RELEASED') {
      console.log(`Reservation ${reservationId} already released`);
      return;
    }

    // Use optimistic locking to prevent double release
    const updated = await this.reservationRepository.updateWithVersion(
      reservationId,
      reservation.version,
      { status: 'RELEASED', releasedAt: new Date() }
    );

    if (!updated) {
      // Concurrent modification, re-check status
      const current = await this.reservationRepository.findById(reservationId);
      if (current?.status === 'RELEASED') {
        return; // Already released by another process
      }
      throw new ConcurrencyError('Failed to release reservation due to concurrent modification');
    }

    // Restore inventory
    await this.inventoryRepository.increaseAvailable(
      reservation.productId,
      reservation.quantity
    );
  }
}
```

### Compensation Ordering

Compensations must be executed in reverse order of the original transactions:

```typescript
class SagaCompensationManager {
  async compensate(saga: SagaState): Promise<void> {
    const completedSteps = saga.completedSteps;

    // Reverse the order
    const stepsToCompensate = [...completedSteps].reverse();

    console.log(`Compensating ${stepsToCompensate.length} steps in order:`,
      stepsToCompensate);

    for (const stepName of stepsToCompensate) {
      await this.compensateStep(saga.sagaId, stepName, saga.context);
    }
  }

  private async compensateStep(
    sagaId: string,
    stepName: string,
    context: SagaContext
  ): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Saga ${sagaId}] Compensating ${stepName}, attempt ${attempt}`);

        const compensation = this.getCompensation(stepName);
        await compensation(context);

        console.log(`[Saga ${sagaId}] Successfully compensated ${stepName}`);
        return;
      } catch (error) {
        lastError = error;
        console.error(
          `[Saga ${sagaId}] Compensation attempt ${attempt} failed for ${stepName}:`,
          error
        );

        if (attempt < maxRetries) {
          // Exponential backoff
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // All retries failed, alert for manual intervention
    await this.alertManualIntervention(sagaId, stepName, lastError!);
  }

  private async alertManualIntervention(
    sagaId: string,
    stepName: string,
    error: Error
  ): Promise<void> {
    await this.alertService.send({
      severity: 'CRITICAL',
      title: 'Saga Compensation Failed',
      message: `Saga ${sagaId} requires manual intervention for step ${stepName}`,
      details: {
        sagaId,
        stepName,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}
```

---

## Failure Handling

Robust failure handling is critical for saga reliability. Different types of failures require different handling strategies.

### Types of Failures

```typescript
// 1. Transient failures - can be retried
class TransientFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransientFailure';
  }
}

// 2. Business failures - require compensation
class BusinessFailure extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'BusinessFailure';
  }
}

// 3. System failures - require investigation
class SystemFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SystemFailure';
  }
}

// Failure classifier
class FailureClassifier {
  classify(error: Error): 'TRANSIENT' | 'BUSINESS' | 'SYSTEM' {
    if (error instanceof TransientFailure) return 'TRANSIENT';
    if (error instanceof BusinessFailure) return 'BUSINESS';
    if (error instanceof SystemFailure) return 'SYSTEM';

    // Classify based on error characteristics
    if (this.isTransient(error)) return 'TRANSIENT';
    if (this.isBusiness(error)) return 'BUSINESS';
    return 'SYSTEM';
  }

  private isTransient(error: Error): boolean {
    const transientPatterns = [
      /timeout/i,
      /connection refused/i,
      /network/i,
      /ECONNRESET/,
      /ETIMEDOUT/,
      /503/,
      /429/
    ];
    return transientPatterns.some(p => p.test(error.message));
  }

  private isBusiness(error: Error): boolean {
    const businessPatterns = [
      /insufficient funds/i,
      /out of stock/i,
      /invalid/i,
      /not found/i,
      /already exists/i
    ];
    return businessPatterns.some(p => p.test(error.message));
  }
}
```

### Retry Strategy

```typescript
interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

class RetryExecutor {
  constructor(private config: RetryConfig) {}

  async execute<T>(
    operation: () => Promise<T>,
    context: { sagaId: string; step: string }
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = this.config.initialDelayMs;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        const failureType = new FailureClassifier().classify(error);

        if (failureType !== 'TRANSIENT') {
          // Non-retryable error, fail immediately
          throw error;
        }

        if (attempt === this.config.maxAttempts) {
          throw new Error(
            `Max retries (${this.config.maxAttempts}) exceeded for ` +
            `saga ${context.sagaId} step ${context.step}: ${error.message}`
          );
        }

        console.log(
          `[Saga ${context.sagaId}] Retry ${attempt}/${this.config.maxAttempts} ` +
          `for ${context.step} after ${delay}ms`
        );

        await this.sleep(delay);

        // Calculate next delay with jitter
        delay = Math.min(
          delay * this.config.backoffMultiplier + Math.random() * 100,
          this.config.maxDelayMs
        );
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage in saga step
class SagaStepExecutor {
  private retryExecutor = new RetryExecutor({
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2
  });

  async executeStep(
    step: SagaStep,
    context: SagaContext
  ): Promise<void> {
    try {
      await this.retryExecutor.execute(
        () => step.action(context),
        { sagaId: context.sagaId!, step: step.name }
      );
    } catch (error) {
      // Determine if compensation is needed
      const failureType = new FailureClassifier().classify(error);

      if (failureType === 'BUSINESS') {
        // Business failure - trigger compensation
        throw new SagaCompensationRequired(step.name, error.message);
      }

      // System failure - may need manual intervention
      throw new SagaCriticalFailure(step.name, error.message);
    }
  }
}
```

### Saga State Recovery

```typescript
// Saga state recovery for system restarts
class SagaRecoveryService {
  constructor(
    private sagaRepository: SagaRepository,
    private sagaExecutors: Map<string, SagaExecutor>
  ) {}

  async recoverIncompleteSagas(): Promise<void> {
    // Find all incomplete sagas
    const incompleteSagas = await this.sagaRepository.findByStatus([
      'RUNNING',
      'COMPENSATING'
    ]);

    console.log(`Found ${incompleteSagas.length} incomplete sagas to recover`);

    for (const saga of incompleteSagas) {
      try {
        await this.recoverSaga(saga);
      } catch (error) {
        console.error(`Failed to recover saga ${saga.sagaId}:`, error);
        await this.markForManualIntervention(saga);
      }
    }
  }

  private async recoverSaga(saga: SagaState): Promise<void> {
    console.log(`Recovering saga ${saga.sagaId} in state ${saga.status}`);

    const executor = this.sagaExecutors.get(saga.sagaType);
    if (!executor) {
      throw new Error(`No executor found for saga type ${saga.sagaType}`);
    }

    if (saga.status === 'RUNNING') {
      // Saga was interrupted during forward execution
      // Option 1: Resume from last completed step
      // Option 2: Compensate and start over
      // Here we choose to compensate for safety
      saga.status = 'COMPENSATING';
      await this.sagaRepository.save(saga);
    }

    if (saga.status === 'COMPENSATING') {
      // Continue compensation
      await executor.compensate(saga);
    }
  }

  private async markForManualIntervention(saga: SagaState): Promise<void> {
    saga.status = 'FAILED';
    saga.error = 'Recovery failed - requires manual intervention';
    await this.sagaRepository.save(saga);

    await this.alertService.critical({
      title: 'Saga Recovery Failed',
      sagaId: saga.sagaId,
      sagaType: saga.sagaType
    });
  }
}

// Periodic recovery job
class SagaRecoveryJob {
  constructor(
    private recoveryService: SagaRecoveryService,
    private intervalMs: number = 60000
  ) {}

  start(): void {
    setInterval(async () => {
      try {
        await this.recoveryService.recoverIncompleteSagas();
      } catch (error) {
        console.error('Saga recovery job failed:', error);
      }
    }, this.intervalMs);

    console.log(`Saga recovery job started with interval ${this.intervalMs}ms`);
  }
}
```

### Timeout Handling

```typescript
class SagaTimeoutManager {
  private readonly DEFAULT_STEP_TIMEOUT = 30000; // 30 seconds
  private readonly DEFAULT_SAGA_TIMEOUT = 300000; // 5 minutes

  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    context: { sagaId: string; step: string }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new SagaTimeoutError(
          `Step ${context.step} timed out after ${timeoutMs}ms ` +
          `in saga ${context.sagaId}`
        ));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }
}

// Timeout detection for stale sagas
class StaleSagaDetector {
  constructor(
    private sagaRepository: SagaRepository,
    private alertService: AlertService
  ) {}

  async detectStaleSagas(maxAgeMs: number = 3600000): Promise<void> {
    const staleSagas = await this.sagaRepository.findStale(maxAgeMs);

    for (const saga of staleSagas) {
      console.warn(`Detected stale saga: ${saga.sagaId}, age: ${
        Date.now() - saga.startedAt.getTime()
      }ms`);

      await this.alertService.warn({
        title: 'Stale Saga Detected',
        sagaId: saga.sagaId,
        sagaType: saga.sagaType,
        currentStep: saga.currentStep,
        age: Date.now() - saga.startedAt.getTime()
      });
    }
  }
}
```

---

## Implementation Strategies

### Message-Based Implementation

Using a message broker for reliable saga execution:

```typescript
// Kafka-based saga implementation
import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';

class KafkaSagaCoordinator {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor(brokers: string[], groupId: string) {
    this.kafka = new Kafka({
      clientId: 'saga-coordinator',
      brokers
    });
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId });
  }

  async start(): Promise<void> {
    await this.producer.connect();
    await this.consumer.connect();

    // Subscribe to saga topics
    await this.consumer.subscribe({
      topics: [
        'saga-commands',
        'saga-events',
        'saga-compensations'
      ],
      fromBeginning: false
    });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      }
    });
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;
    const event = JSON.parse(message.value!.toString());

    switch (topic) {
      case 'saga-commands':
        await this.handleCommand(event);
        break;
      case 'saga-events':
        await this.handleEvent(event);
        break;
      case 'saga-compensations':
        await this.handleCompensation(event);
        break;
    }
  }

  async startSaga(sagaType: string, data: Record<string, unknown>): Promise<string> {
    const sagaId = generateUUID();

    await this.producer.send({
      topic: 'saga-commands',
      messages: [{
        key: sagaId,
        value: JSON.stringify({
          type: 'START_SAGA',
          sagaId,
          sagaType,
          data,
          timestamp: new Date().toISOString()
        })
      }]
    });

    return sagaId;
  }

  async publishStepResult(
    sagaId: string,
    stepName: string,
    success: boolean,
    data?: Record<string, unknown>,
    error?: string
  ): Promise<void> {
    await this.producer.send({
      topic: 'saga-events',
      messages: [{
        key: sagaId,
        value: JSON.stringify({
          type: success ? 'STEP_COMPLETED' : 'STEP_FAILED',
          sagaId,
          stepName,
          data,
          error,
          timestamp: new Date().toISOString()
        })
      }]
    });
  }
}

// Service participant with Kafka
class InventoryServiceParticipant {
  constructor(
    private inventoryService: InventoryService,
    private sagaCoordinator: KafkaSagaCoordinator
  ) {}

  async handleReserveInventory(event: SagaCommandEvent): Promise<void> {
    const { sagaId, data } = event;

    try {
      const reservation = await this.inventoryService.reserve({
        orderId: data.orderId,
        items: data.items
      });

      await this.sagaCoordinator.publishStepResult(
        sagaId,
        'ReserveInventory',
        true,
        { reservationId: reservation.id }
      );
    } catch (error) {
      await this.sagaCoordinator.publishStepResult(
        sagaId,
        'ReserveInventory',
        false,
        undefined,
        error.message
      );
    }
  }

  async handleReleaseInventory(event: SagaCompensationEvent): Promise<void> {
    const { sagaId, data } = event;

    try {
      await this.inventoryService.releaseReservation(data.reservationId);

      await this.sagaCoordinator.publishStepResult(
        sagaId,
        'ReleaseInventory',
        true
      );
    } catch (error) {
      // Log error but don't fail - compensation must eventually succeed
      console.error(`Compensation failed for saga ${sagaId}:`, error);
      // Retry or alert
    }
  }
}
```

### Database-Based State Machine

```typescript
// State machine-based saga with database persistence
enum SagaStepStatus {
  PENDING = 'PENDING',
  EXECUTING = 'EXECUTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  COMPENSATING = 'COMPENSATING',
  COMPENSATED = 'COMPENSATED'
}

interface SagaStepRecord {
  id: string;
  sagaId: string;
  stepName: string;
  status: SagaStepStatus;
  requestData?: Record<string, unknown>;
  responseData?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

class DatabaseSagaStateMachine {
  constructor(
    private db: Database,
    private stepHandlers: Map<string, SagaStepHandler>
  ) {}

  async transitionStep(
    sagaId: string,
    stepName: string,
    fromStatus: SagaStepStatus,
    toStatus: SagaStepStatus,
    data?: Record<string, unknown>
  ): Promise<boolean> {
    // Use optimistic locking for state transition
    const result = await this.db.query(
      `UPDATE saga_steps
       SET status = $1, response_data = $2, updated_at = NOW()
       WHERE saga_id = $3 AND step_name = $4 AND status = $5
       RETURNING *`,
      [toStatus, JSON.stringify(data), sagaId, stepName, fromStatus]
    );

    return result.rowCount > 0;
  }

  async executeStep(sagaId: string, stepName: string): Promise<void> {
    // Transition to EXECUTING
    const started = await this.transitionStep(
      sagaId,
      stepName,
      SagaStepStatus.PENDING,
      SagaStepStatus.EXECUTING
    );

    if (!started) {
      console.log(`Step ${stepName} in saga ${sagaId} not in PENDING state`);
      return;
    }

    const handler = this.stepHandlers.get(stepName);
    if (!handler) {
      throw new Error(`No handler for step ${stepName}`);
    }

    const stepRecord = await this.getStepRecord(sagaId, stepName);

    try {
      const result = await handler.execute(stepRecord.requestData!);

      await this.transitionStep(
        sagaId,
        stepName,
        SagaStepStatus.EXECUTING,
        SagaStepStatus.COMPLETED,
        result
      );

      // Trigger next step
      await this.triggerNextStep(sagaId, stepName);
    } catch (error) {
      await this.db.query(
        `UPDATE saga_steps
         SET status = $1, error = $2, updated_at = NOW()
         WHERE saga_id = $3 AND step_name = $4`,
        [SagaStepStatus.FAILED, error.message, sagaId, stepName]
      );

      // Trigger compensation
      await this.triggerCompensation(sagaId);
    }
  }

  async compensateStep(sagaId: string, stepName: string): Promise<void> {
    const transitioned = await this.transitionStep(
      sagaId,
      stepName,
      SagaStepStatus.COMPLETED,
      SagaStepStatus.COMPENSATING
    );

    if (!transitioned) return;

    const handler = this.stepHandlers.get(stepName);
    const stepRecord = await this.getStepRecord(sagaId, stepName);

    try {
      await handler!.compensate(stepRecord.responseData!);

      await this.transitionStep(
        sagaId,
        stepName,
        SagaStepStatus.COMPENSATING,
        SagaStepStatus.COMPENSATED
      );
    } catch (error) {
      console.error(`Compensation failed for ${stepName}:`, error);
      // Retry logic or manual intervention
    }
  }
}
```

### Event Sourcing Integration

```typescript
// Saga with event sourcing
interface SagaEvent {
  eventId: string;
  sagaId: string;
  eventType: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

class EventSourcedSaga {
  private events: SagaEvent[] = [];
  private state: SagaState;

  constructor(sagaId: string) {
    this.state = {
      sagaId,
      status: 'CREATED',
      completedSteps: [],
      compensatedSteps: []
    };
  }

  // Apply event to update state
  private apply(event: SagaEvent): void {
    switch (event.eventType) {
      case 'SagaStarted':
        this.state.status = 'RUNNING';
        break;
      case 'StepCompleted':
        this.state.completedSteps.push(event.data.stepName as string);
        break;
      case 'StepFailed':
        this.state.status = 'COMPENSATING';
        this.state.failedStep = event.data.stepName as string;
        break;
      case 'StepCompensated':
        this.state.compensatedSteps.push(event.data.stepName as string);
        break;
      case 'SagaCompleted':
        this.state.status = 'COMPLETED';
        break;
      case 'SagaFailed':
        this.state.status = 'FAILED';
        break;
    }
  }

  // Rebuild state from events
  static fromEvents(events: SagaEvent[]): EventSourcedSaga {
    if (events.length === 0) {
      throw new Error('Cannot rebuild saga from empty events');
    }

    const saga = new EventSourcedSaga(events[0].sagaId);
    for (const event of events) {
      saga.apply(event);
      saga.events.push(event);
    }
    return saga;
  }

  // Record new event
  private recordEvent(eventType: string, data: Record<string, unknown>): SagaEvent {
    const event: SagaEvent = {
      eventId: generateUUID(),
      sagaId: this.state.sagaId,
      eventType,
      timestamp: new Date(),
      data
    };
    this.events.push(event);
    this.apply(event);
    return event;
  }

  startSaga(context: Record<string, unknown>): SagaEvent {
    return this.recordEvent('SagaStarted', { context });
  }

  completeStep(stepName: string, result: Record<string, unknown>): SagaEvent {
    return this.recordEvent('StepCompleted', { stepName, result });
  }

  failStep(stepName: string, error: string): SagaEvent {
    return this.recordEvent('StepFailed', { stepName, error });
  }

  compensateStep(stepName: string): SagaEvent {
    return this.recordEvent('StepCompensated', { stepName });
  }

  completeSaga(): SagaEvent {
    return this.recordEvent('SagaCompleted', {});
  }

  failSaga(error: string): SagaEvent {
    return this.recordEvent('SagaFailed', { error });
  }

  getUncommittedEvents(): SagaEvent[] {
    return this.events;
  }

  getState(): SagaState {
    return { ...this.state };
  }
}

// Event store for saga events
class SagaEventStore {
  constructor(private db: Database) {}

  async append(events: SagaEvent[]): Promise<void> {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      for (const event of events) {
        await client.query(
          `INSERT INTO saga_events
           (event_id, saga_id, event_type, timestamp, data)
           VALUES ($1, $2, $3, $4, $5)`,
          [event.eventId, event.sagaId, event.eventType,
           event.timestamp, JSON.stringify(event.data)]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getEvents(sagaId: string): Promise<SagaEvent[]> {
    const result = await this.db.query(
      `SELECT * FROM saga_events
       WHERE saga_id = $1
       ORDER BY timestamp ASC`,
      [sagaId]
    );

    return result.rows.map(row => ({
      eventId: row.event_id,
      sagaId: row.saga_id,
      eventType: row.event_type,
      timestamp: row.timestamp,
      data: row.data
    }));
  }
}
```

---

## Real-World Scenarios

### E-Commerce Order Processing

```typescript
// Complete e-commerce order saga
interface OrderSagaContext {
  orderId: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;

  // Populated during saga execution
  inventoryReservationId?: string;
  paymentTransactionId?: string;
  shippingLabelId?: string;
  loyaltyPointsTransactionId?: string;
}

class ECommerceOrderSaga {
  constructor(
    private orderService: OrderService,
    private inventoryService: InventoryService,
    private paymentService: PaymentService,
    private shippingService: ShippingService,
    private loyaltyService: LoyaltyService,
    private notificationService: NotificationService
  ) {}

  async execute(orderRequest: CreateOrderRequest): Promise<OrderResult> {
    const context: OrderSagaContext = {
      orderId: generateUUID(),
      customerId: orderRequest.customerId,
      items: orderRequest.items,
      totalAmount: this.calculateTotal(orderRequest.items),
      shippingAddress: orderRequest.shippingAddress,
      paymentMethod: orderRequest.paymentMethod
    };

    const saga = new SagaOrchestrator<OrderSagaContext>('ECommerceOrder');

    saga
      // Step 1: Validate and create order
      .addStep({
        name: 'CreateOrder',
        action: async (ctx) => {
          const order = await this.orderService.create({
            orderId: ctx.orderId,
            customerId: ctx.customerId,
            items: ctx.items,
            totalAmount: ctx.totalAmount,
            status: 'PENDING'
          });
          console.log(`Order ${order.id} created`);
        },
        compensation: async (ctx) => {
          await this.orderService.updateStatus(ctx.orderId, 'CANCELLED');
          console.log(`Order ${ctx.orderId} cancelled`);
        }
      })

      // Step 2: Reserve inventory
      .addStep({
        name: 'ReserveInventory',
        action: async (ctx) => {
          const reservation = await this.inventoryService.reserve({
            orderId: ctx.orderId,
            items: ctx.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity
            }))
          });
          ctx.inventoryReservationId = reservation.id;
          console.log(`Inventory reserved: ${reservation.id}`);
        },
        compensation: async (ctx) => {
          if (ctx.inventoryReservationId) {
            await this.inventoryService.release(ctx.inventoryReservationId);
            console.log(`Inventory released: ${ctx.inventoryReservationId}`);
          }
        }
      })

      // Step 3: Process payment
      .addStep({
        name: 'ProcessPayment',
        action: async (ctx) => {
          const payment = await this.paymentService.charge({
            orderId: ctx.orderId,
            customerId: ctx.customerId,
            amount: ctx.totalAmount,
            method: ctx.paymentMethod
          });
          ctx.paymentTransactionId = payment.transactionId;
          console.log(`Payment processed: ${payment.transactionId}`);
        },
        compensation: async (ctx) => {
          if (ctx.paymentTransactionId) {
            await this.paymentService.refund(ctx.paymentTransactionId);
            console.log(`Payment refunded: ${ctx.paymentTransactionId}`);
          }
        }
      })

      // Step 4: Create shipping label
      .addStep({
        name: 'CreateShipping',
        action: async (ctx) => {
          const shipping = await this.shippingService.createLabel({
            orderId: ctx.orderId,
            items: ctx.items,
            address: ctx.shippingAddress
          });
          ctx.shippingLabelId = shipping.labelId;
          console.log(`Shipping label created: ${shipping.labelId}`);
        },
        compensation: async (ctx) => {
          if (ctx.shippingLabelId) {
            await this.shippingService.cancelLabel(ctx.shippingLabelId);
            console.log(`Shipping label cancelled: ${ctx.shippingLabelId}`);
          }
        }
      })

      // Step 5: Award loyalty points
      .addStep({
        name: 'AwardLoyaltyPoints',
        action: async (ctx) => {
          const points = Math.floor(ctx.totalAmount); // 1 point per dollar
          const transaction = await this.loyaltyService.awardPoints({
            customerId: ctx.customerId,
            orderId: ctx.orderId,
            points
          });
          ctx.loyaltyPointsTransactionId = transaction.id;
          console.log(`Loyalty points awarded: ${points}`);
        },
        compensation: async (ctx) => {
          if (ctx.loyaltyPointsTransactionId) {
            await this.loyaltyService.revokePoints(ctx.loyaltyPointsTransactionId);
            console.log(`Loyalty points revoked`);
          }
        }
      })

      // Step 6: Confirm order and reduce inventory
      .addStep({
        name: 'ConfirmOrder',
        action: async (ctx) => {
          // Convert reservation to actual reduction
          await this.inventoryService.confirmReservation(ctx.inventoryReservationId!);
          await this.orderService.updateStatus(ctx.orderId, 'CONFIRMED');
          console.log(`Order ${ctx.orderId} confirmed`);
        },
        compensation: async (ctx) => {
          // This is a complex compensation - may need manual intervention
          console.warn(`Order confirmation compensation needed for ${ctx.orderId}`);
        }
      })

      // Step 7: Send confirmation notification (no compensation needed)
      .addStep({
        name: 'SendNotification',
        action: async (ctx) => {
          await this.notificationService.sendOrderConfirmation({
            orderId: ctx.orderId,
            customerId: ctx.customerId,
            items: ctx.items,
            totalAmount: ctx.totalAmount,
            shippingAddress: ctx.shippingAddress
          });
          console.log(`Confirmation email sent`);
        },
        compensation: async (ctx) => {
          // Send cancellation notification instead
          await this.notificationService.sendOrderCancellation({
            orderId: ctx.orderId,
            customerId: ctx.customerId,
            reason: 'Order processing failed'
          });
        }
      });

    try {
      const result = await saga.execute(context);
      return {
        success: true,
        orderId: result.orderId,
        status: 'CONFIRMED'
      };
    } catch (error) {
      return {
        success: false,
        orderId: context.orderId,
        status: 'FAILED',
        error: error.message
      };
    }
  }

  private calculateTotal(items: OrderSagaContext['items']): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
```

### Travel Booking System

```typescript
// Travel booking saga - booking flight, hotel, and car together
interface TravelBookingSagaContext {
  bookingId: string;
  customerId: string;
  tripDetails: {
    destination: string;
    startDate: Date;
    endDate: Date;
  };

  flightReservation?: {
    outboundFlight: FlightDetails;
    returnFlight: FlightDetails;
  };
  flightBookingId?: string;

  hotelReservation?: HotelDetails;
  hotelBookingId?: string;

  carRentalReservation?: CarRentalDetails;
  carRentalBookingId?: string;

  totalAmount: number;
  paymentTransactionId?: string;
}

class TravelBookingSaga {
  constructor(
    private flightService: FlightService,
    private hotelService: HotelService,
    private carRentalService: CarRentalService,
    private paymentService: PaymentService
  ) {}

  buildSaga(): SagaOrchestrator<TravelBookingSagaContext> {
    const saga = new SagaOrchestrator<TravelBookingSagaContext>('TravelBooking');

    saga
      // Book flights first (most constrained resource)
      .addStep({
        name: 'BookFlights',
        action: async (ctx) => {
          const booking = await this.flightService.book({
            customerId: ctx.customerId,
            outbound: ctx.flightReservation!.outboundFlight,
            return: ctx.flightReservation!.returnFlight
          });
          ctx.flightBookingId = booking.id;
          ctx.totalAmount += booking.totalPrice;
        },
        compensation: async (ctx) => {
          if (ctx.flightBookingId) {
            await this.flightService.cancel(ctx.flightBookingId);
          }
        }
      })

      // Book hotel
      .addStep({
        name: 'BookHotel',
        action: async (ctx) => {
          const booking = await this.hotelService.book({
            customerId: ctx.customerId,
            hotel: ctx.hotelReservation!,
            checkIn: ctx.tripDetails.startDate,
            checkOut: ctx.tripDetails.endDate
          });
          ctx.hotelBookingId = booking.id;
          ctx.totalAmount += booking.totalPrice;
        },
        compensation: async (ctx) => {
          if (ctx.hotelBookingId) {
            await this.hotelService.cancel(ctx.hotelBookingId);
          }
        }
      })

      // Book car rental (optional)
      .addStep({
        name: 'BookCarRental',
        action: async (ctx) => {
          if (!ctx.carRentalReservation) {
            console.log('No car rental requested, skipping');
            return;
          }

          const booking = await this.carRentalService.book({
            customerId: ctx.customerId,
            carDetails: ctx.carRentalReservation,
            pickupDate: ctx.tripDetails.startDate,
            returnDate: ctx.tripDetails.endDate
          });
          ctx.carRentalBookingId = booking.id;
          ctx.totalAmount += booking.totalPrice;
        },
        compensation: async (ctx) => {
          if (ctx.carRentalBookingId) {
            await this.carRentalService.cancel(ctx.carRentalBookingId);
          }
        }
      })

      // Process payment for entire trip
      .addStep({
        name: 'ProcessPayment',
        action: async (ctx) => {
          const payment = await this.paymentService.charge({
            customerId: ctx.customerId,
            amount: ctx.totalAmount,
            description: `Travel booking ${ctx.bookingId}`
          });
          ctx.paymentTransactionId = payment.transactionId;
        },
        compensation: async (ctx) => {
          if (ctx.paymentTransactionId) {
            await this.paymentService.refund(ctx.paymentTransactionId);
          }
        }
      })

      // Confirm all bookings
      .addStep({
        name: 'ConfirmBookings',
        action: async (ctx) => {
          await Promise.all([
            this.flightService.confirm(ctx.flightBookingId!),
            this.hotelService.confirm(ctx.hotelBookingId!),
            ctx.carRentalBookingId &&
              this.carRentalService.confirm(ctx.carRentalBookingId)
          ].filter(Boolean));
        },
        compensation: async (ctx) => {
          // Confirmation compensation is complex
          // May require manual intervention
          console.warn('Booking confirmation compensation needed');
        }
      });

    return saga;
  }
}
```

### Money Transfer Between Accounts

```typescript
// Inter-bank money transfer saga
interface MoneyTransferSagaContext {
  transferId: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  currency: string;

  sourceDebitId?: string;
  destinationCreditId?: string;
  exchangeRate?: number;
  fees?: number;
}

class MoneyTransferSaga {
  constructor(
    private accountService: AccountService,
    private fxService: ForeignExchangeService,
    private feeService: FeeService,
    private auditService: AuditService
  ) {}

  buildSaga(): SagaOrchestrator<MoneyTransferSagaContext> {
    const saga = new SagaOrchestrator<MoneyTransferSagaContext>('MoneyTransfer');

    saga
      // Validate accounts exist and are active
      .addStep({
        name: 'ValidateAccounts',
        action: async (ctx) => {
          const [sourceAccount, destAccount] = await Promise.all([
            this.accountService.get(ctx.sourceAccountId),
            this.accountService.get(ctx.destinationAccountId)
          ]);

          if (!sourceAccount || sourceAccount.status !== 'ACTIVE') {
            throw new Error('Source account invalid or inactive');
          }
          if (!destAccount || destAccount.status !== 'ACTIVE') {
            throw new Error('Destination account invalid or inactive');
          }
          if (sourceAccount.balance < ctx.amount) {
            throw new Error('Insufficient funds');
          }
        },
        compensation: async (ctx) => {
          // Validation has no side effects, no compensation needed
        }
      })

      // Calculate fees and exchange rate if needed
      .addStep({
        name: 'CalculateFeesAndFX',
        action: async (ctx) => {
          const sourceAccount = await this.accountService.get(ctx.sourceAccountId);
          const destAccount = await this.accountService.get(ctx.destinationAccountId);

          // Calculate fees
          ctx.fees = await this.feeService.calculate({
            amount: ctx.amount,
            sourceAccountType: sourceAccount.type,
            destinationAccountType: destAccount.type,
            isInternational: sourceAccount.country !== destAccount.country
          });

          // Get exchange rate if different currencies
          if (sourceAccount.currency !== destAccount.currency) {
            ctx.exchangeRate = await this.fxService.getRate(
              sourceAccount.currency,
              destAccount.currency
            );
          } else {
            ctx.exchangeRate = 1;
          }
        },
        compensation: async (ctx) => {
          // Calculations have no side effects
        }
      })

      // Debit source account
      .addStep({
        name: 'DebitSourceAccount',
        action: async (ctx) => {
          const totalDebit = ctx.amount + (ctx.fees || 0);

          const debit = await this.accountService.debit({
            accountId: ctx.sourceAccountId,
            amount: totalDebit,
            reference: ctx.transferId,
            description: `Transfer to ${ctx.destinationAccountId}`
          });

          ctx.sourceDebitId = debit.transactionId;

          // Record audit entry
          await this.auditService.record({
            type: 'DEBIT',
            transferId: ctx.transferId,
            accountId: ctx.sourceAccountId,
            amount: totalDebit,
            transactionId: debit.transactionId
          });
        },
        compensation: async (ctx) => {
          if (ctx.sourceDebitId) {
            // Credit back the source account
            await this.accountService.credit({
              accountId: ctx.sourceAccountId,
              amount: ctx.amount + (ctx.fees || 0),
              reference: `REVERSAL-${ctx.transferId}`,
              description: 'Transfer reversal'
            });

            await this.auditService.record({
              type: 'DEBIT_REVERSAL',
              transferId: ctx.transferId,
              accountId: ctx.sourceAccountId,
              originalTransactionId: ctx.sourceDebitId
            });
          }
        }
      })

      // Credit destination account
      .addStep({
        name: 'CreditDestinationAccount',
        action: async (ctx) => {
          const creditAmount = ctx.amount * (ctx.exchangeRate || 1);

          const credit = await this.accountService.credit({
            accountId: ctx.destinationAccountId,
            amount: creditAmount,
            reference: ctx.transferId,
            description: `Transfer from ${ctx.sourceAccountId}`
          });

          ctx.destinationCreditId = credit.transactionId;

          await this.auditService.record({
            type: 'CREDIT',
            transferId: ctx.transferId,
            accountId: ctx.destinationAccountId,
            amount: creditAmount,
            transactionId: credit.transactionId
          });
        },
        compensation: async (ctx) => {
          if (ctx.destinationCreditId) {
            // Debit back the destination account
            const creditAmount = ctx.amount * (ctx.exchangeRate || 1);

            await this.accountService.debit({
              accountId: ctx.destinationAccountId,
              amount: creditAmount,
              reference: `REVERSAL-${ctx.transferId}`,
              description: 'Transfer reversal'
            });

            await this.auditService.record({
              type: 'CREDIT_REVERSAL',
              transferId: ctx.transferId,
              accountId: ctx.destinationAccountId,
              originalTransactionId: ctx.destinationCreditId
            });
          }
        }
      })

      // Finalize transfer
      .addStep({
        name: 'FinalizeTransfer',
        action: async (ctx) => {
          await this.auditService.record({
            type: 'TRANSFER_COMPLETE',
            transferId: ctx.transferId,
            sourceAccountId: ctx.sourceAccountId,
            destinationAccountId: ctx.destinationAccountId,
            amount: ctx.amount,
            fees: ctx.fees,
            exchangeRate: ctx.exchangeRate
          });
        },
        compensation: async (ctx) => {
          await this.auditService.record({
            type: 'TRANSFER_REVERSED',
            transferId: ctx.transferId
          });
        }
      });

    return saga;
  }
}
```

---

## Best Practices

### Design Principles

1. **Keep Steps Idempotent**: Every action and compensation must be safe to retry

```typescript
// Good: Idempotent reservation
async reserve(orderId: string, productId: string, quantity: number) {
  // Check if already reserved
  const existing = await this.findReservation(orderId, productId);
  if (existing) {
    return existing; // Return existing reservation
  }

  return this.createReservation(orderId, productId, quantity);
}
```

2. **Use Semantic Locks**: Prevent concurrent saga operations on same resources

```typescript
class SemanticLock {
  async acquireLock(resource: string, sagaId: string): Promise<boolean> {
    const result = await this.db.query(
      `INSERT INTO saga_locks (resource, saga_id, acquired_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (resource) DO NOTHING
       RETURNING *`,
      [resource, sagaId]
    );
    return result.rowCount > 0;
  }

  async releaseLock(resource: string, sagaId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM saga_locks WHERE resource = $1 AND saga_id = $2`,
      [resource, sagaId]
    );
  }
}
```

3. **Countermeasures for Dirty Reads**: Handle reading uncommitted saga data

```typescript
// Use saga status to filter reads
async getOrder(orderId: string): Promise<Order | null> {
  const order = await this.orderRepository.findById(orderId);

  // Check if order is part of an active saga
  const activeSaga = await this.sagaRepository.findActiveForOrder(orderId);

  if (activeSaga) {
    // Order is being processed, return pending status
    return {
      ...order,
      status: 'PROCESSING',
      sagaStatus: activeSaga.status
    };
  }

  return order;
}
```

4. **Timeouts and Deadlines**: Prevent sagas from running indefinitely

```typescript
class SagaWithDeadline {
  async execute(context: SagaContext, deadline: Date): Promise<void> {
    for (const step of this.steps) {
      if (new Date() > deadline) {
        throw new SagaDeadlineExceeded(
          `Saga ${context.sagaId} exceeded deadline at step ${step.name}`
        );
      }

      await step.execute(context);
    }
  }
}
```

### Testing Strategies

```typescript
// Unit testing saga steps
describe('CreateOrderSaga', () => {
  let saga: CreateOrderSaga;
  let mockOrderService: jest.Mocked<OrderService>;
  let mockInventoryService: jest.Mocked<InventoryService>;
  let mockPaymentService: jest.Mocked<PaymentService>;

  beforeEach(() => {
    mockOrderService = createMock<OrderService>();
    mockInventoryService = createMock<InventoryService>();
    mockPaymentService = createMock<PaymentService>();

    saga = new CreateOrderSaga(
      mockOrderService,
      mockInventoryService,
      mockPaymentService
    );
  });

  it('should complete successfully when all steps succeed', async () => {
    mockOrderService.create.mockResolvedValue({ id: 'order-1' });
    mockInventoryService.reserve.mockResolvedValue({ id: 'res-1' });
    mockPaymentService.charge.mockResolvedValue({ id: 'pay-1' });

    const result = await saga.execute({
      customerId: 'cust-1',
      items: [{ productId: 'prod-1', quantity: 1 }],
      amount: 100
    });

    expect(result.status).toBe('COMPLETED');
    expect(mockOrderService.create).toHaveBeenCalled();
    expect(mockInventoryService.reserve).toHaveBeenCalled();
    expect(mockPaymentService.charge).toHaveBeenCalled();
  });

  it('should compensate when payment fails', async () => {
    mockOrderService.create.mockResolvedValue({ id: 'order-1' });
    mockInventoryService.reserve.mockResolvedValue({ id: 'res-1' });
    mockPaymentService.charge.mockRejectedValue(new Error('Insufficient funds'));

    await expect(saga.execute({
      customerId: 'cust-1',
      items: [{ productId: 'prod-1', quantity: 1 }],
      amount: 100
    })).rejects.toThrow();

    // Verify compensations were called in reverse order
    expect(mockInventoryService.release).toHaveBeenCalledWith('res-1');
    expect(mockOrderService.cancel).toHaveBeenCalledWith('order-1');
  });

  it('should handle compensation failures gracefully', async () => {
    mockOrderService.create.mockResolvedValue({ id: 'order-1' });
    mockInventoryService.reserve.mockResolvedValue({ id: 'res-1' });
    mockPaymentService.charge.mockRejectedValue(new Error('Payment failed'));
    mockInventoryService.release.mockRejectedValue(new Error('Release failed'));

    await expect(saga.execute({
      customerId: 'cust-1',
      items: [{ productId: 'prod-1', quantity: 1 }],
      amount: 100
    })).rejects.toThrow();

    // Compensation failure should be logged but not prevent other compensations
    expect(mockOrderService.cancel).toHaveBeenCalled();
  });
});

// Integration testing with actual services
describe('CreateOrderSaga Integration', () => {
  it('should create order end-to-end', async () => {
    const saga = new CreateOrderSaga(/* real services */);

    const result = await saga.execute({
      customerId: 'test-customer',
      items: [
        { productId: 'test-product', quantity: 1, price: 10.00 }
      ],
      amount: 10.00
    });

    // Verify final state
    const order = await orderRepository.findById(result.orderId);
    expect(order.status).toBe('CONFIRMED');

    const inventory = await inventoryRepository.getStock('test-product');
    expect(inventory.reserved).toBe(0); // Reservation converted to actual reduction
  });
});
```

---

## Interview Key Points

### Common Interview Questions

**1. What is the Saga pattern and when should you use it?**

Key points:
- Pattern for managing distributed transactions without 2PC
- Used when multiple microservices need to coordinate
- Each step is a local transaction with a compensating action
- Achieves eventual consistency rather than strong consistency
- Use when: cross-service operations, long-running transactions, high availability needed

**2. Explain the difference between choreography and orchestration approaches.**

Key points:
- **Choreography**: Decentralized, services react to events
  - Pros: Loose coupling, no single point of failure
  - Cons: Hard to understand flow, difficult to test
- **Orchestration**: Centralized coordinator
  - Pros: Clear flow, easy to track state
  - Cons: Single point of failure, more coupling
- Choose based on complexity and visibility requirements

**3. How do you handle failures in a saga?**

```typescript
// Key failure handling concepts:
// 1. Classification
const failureType = classifyFailure(error); // TRANSIENT, BUSINESS, SYSTEM

// 2. Retry for transient failures
if (failureType === 'TRANSIENT') {
  await retryWithBackoff(operation);
}

// 3. Compensate for business failures
if (failureType === 'BUSINESS') {
  await compensateInReverseOrder(completedSteps);
}

// 4. Alert for system failures
if (failureType === 'SYSTEM') {
  await alertForManualIntervention(sagaId, error);
}
```

**4. How do you ensure saga data consistency?**

Key points:
- Compensating transactions semantically undo previous actions
- Idempotent operations handle retries safely
- Semantic locks prevent concurrent modifications
- Saga state persistence allows recovery
- Audit logging tracks all state changes

**5. What are the challenges of implementing sagas?**

Key points:
- Designing correct compensations
- Handling partial failures
- Dealing with non-compensatable actions (e.g., sent emails)
- Testing complexity
- Observability and debugging
- Handling concurrent sagas on same data

### System Design Example

**Design an order fulfillment system using Saga pattern**

```
Requirements:
- Order creation with inventory, payment, shipping
- Handle partial failures gracefully
- Provide order status tracking
- Support high throughput

Solution:
1. Services: Order, Inventory, Payment, Shipping, Notification

2. Saga Steps:
   - ValidateOrder -> CreateOrder -> ReserveInventory
   -> ProcessPayment -> CreateShipment -> ConfirmOrder -> Notify

3. Compensation Chain:
   - CancelNotification <- CancelShipment <- RefundPayment
   <- ReleaseInventory <- CancelOrder

4. State Management:
   - Saga state stored in database with saga_id, step, status
   - Each service publishes events after completing step
   - Orchestrator listens and manages flow

5. Failure Handling:
   - Retry transient failures 3 times with exponential backoff
   - Compensate on business failures
   - Dead letter queue for failed compensations
   - Alert system for manual intervention

6. Observability:
   - Correlation IDs across all services
   - Saga timeline visualization
   - Metrics: completion rate, average duration, failure rate
```

### Key Concepts Summary

```
+--------------------------------------------------------------+
|                    Saga Pattern Core Concepts                 |
+--------------------------------------------------------------+
|  Pattern Types                                                |
|  +-- Choreography: Event-based, decentralized coordination   |
|  +-- Orchestration: Centralized saga coordinator             |
+--------------------------------------------------------------+
|  Key Components                                               |
|  +-- Saga Steps: Local transactions in each service          |
|  +-- Compensations: Semantic undo for each step              |
|  +-- Saga State: Track progress and enable recovery          |
|  +-- Event Bus: Communication between participants           |
+--------------------------------------------------------------+
|  Failure Handling                                             |
|  +-- Retry: For transient failures with backoff              |
|  +-- Compensate: For business failures, reverse order        |
|  +-- Recovery: Detect and resume incomplete sagas            |
|  +-- Timeout: Prevent indefinitely running sagas             |
+--------------------------------------------------------------+
|  Implementation Patterns                                      |
|  +-- Message-based: Kafka/RabbitMQ for reliability           |
|  +-- State machine: Database-backed step tracking            |
|  +-- Event sourcing: Replay saga from events                 |
+--------------------------------------------------------------+
|  Best Practices                                               |
|  +-- Idempotent operations and compensations                 |
|  +-- Semantic locks to prevent concurrent modifications      |
|  +-- Comprehensive logging and monitoring                    |
|  +-- Testing: Unit, integration, and chaos testing           |
+--------------------------------------------------------------+
```

---

## Further Reading

### Classic Books

1. **"Microservices Patterns"** - Chris Richardson
   - Comprehensive coverage of saga pattern and variations
   - Includes detailed implementation examples

2. **"Enterprise Integration Patterns"** - Gregor Hohpe, Bobby Woolf
   - Foundation for understanding message-based coordination

3. **"Designing Data-Intensive Applications"** - Martin Kleppmann
   - Deep dive into distributed systems concepts

4. **"Building Microservices"** - Sam Newman
   - Practical guidance on microservices architecture

### Online Resources

- [Microservices.io - Saga Pattern](https://microservices.io/patterns/data/saga.html) - Pattern definition by Chris Richardson
- [Microsoft - Saga Pattern](https://docs.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga) - Azure architecture guidance
- [Eventuate.io](https://eventuate.io/) - Saga framework and examples

### Related Patterns

- **Event Sourcing**: Store all changes as events for full audit trail
- **CQRS**: Separate read and write models for scalability
- **Outbox Pattern**: Reliable event publishing with database
- **Two-Phase Commit**: Traditional distributed transaction (contrast with saga)
- **Circuit Breaker**: Prevent cascade failures between services

### Open Source Implementations

- [Eventuate Tram](https://github.com/eventuate-tram/eventuate-tram-core) - Java saga framework
- [Temporal](https://temporal.io/) - Workflow orchestration platform
- [Camunda](https://camunda.com/) - BPMN-based workflow automation
- [MassTransit](https://masstransit-project.com/) - .NET distributed application framework

---

## Summary

The Saga pattern is an essential tool for managing distributed transactions in microservices architectures. By breaking complex transactions into a series of local transactions with compensating actions, sagas achieve eventual consistency while maintaining system availability and loose coupling.

Key takeaways:

1. **Choose the Right Approach**: Use choreography for simple flows and orchestration for complex ones
2. **Design Compensations Carefully**: Every action needs a semantic undo that is idempotent
3. **Handle Failures Gracefully**: Classify failures, retry transients, compensate business failures
4. **Ensure Observability**: Log all saga events, track state, provide visibility
5. **Test Thoroughly**: Unit test steps, integration test flows, chaos test failures

The saga pattern requires more upfront design effort but provides the flexibility and resilience needed for modern distributed systems. When implemented correctly, it enables complex business workflows to execute reliably across multiple services while maintaining the autonomy and independence that make microservices valuable.
