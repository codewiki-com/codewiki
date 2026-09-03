---
title: Temporal Workflow Engine
description: A comprehensive guide to Temporal - the durable execution platform for building reliable distributed applications
track: backend
section: caching-queues
difficulty: intermediate
tags:
  - Temporal
  - Workflow
  - Distributed Systems
  - Microservices
  - Orchestration
status: imported
origin: old/src/content/docs/backend/temporal.en.md
divergence: 0.223
issues: []
legacy:
  category: Backend
  subcategory: Workflow
  order: 32
  lastUpdated: 2026-01-20
---

Temporal is a durable execution platform that enables developers to build reliable distributed applications without the complexity of managing state, handling failures, or implementing retry logic manually. Unlike traditional message queues or workflow engines, Temporal guarantees that your code will run to completion, even in the face of failures, making it an excellent choice for building mission-critical business processes.

## Understanding Temporal

### What is Temporal?

Temporal is an open-source durable execution system that abstracts away the complexity of building reliable distributed systems. At its core, Temporal provides a programming model where your application code can be written as simple functions, while the platform handles all the hard parts of distributed computing: state persistence, failure recovery, retries, and more.

Think of Temporal as a "time machine" for your code. When your application crashes, Temporal can replay the execution history and restore your workflow to exactly where it was, then continue execution. This is fundamentally different from traditional approaches where failures mean lost state and manual recovery.

### Temporal vs Traditional Approaches

| Aspect | Traditional Message Queue | Traditional Workflow Engine | Temporal |
|--------|--------------------------|----------------------------|----------|
| Programming Model | Async message handlers | State machines / BPMN | Native code (functions) |
| State Management | External (database) | Built-in (limited) | Built-in (unlimited) |
| Failure Handling | Manual retry logic | Limited retry policies | Automatic with replay |
| Long-running Tasks | Complex patterns needed | Supported | Native support |
| Debugging | Log analysis | Workflow diagrams | Event history + replay |
| Testing | Integration tests | Specialized tools | Unit tests |
| Versioning | Message schemas | Workflow definitions | Code versioning |

### Problems Temporal Solves

**1. Distributed Transaction Complexity**

Without Temporal, coordinating transactions across multiple services requires implementing complex patterns like Saga, two-phase commit, or event sourcing from scratch. Temporal handles this natively.

**2. Failure Recovery**

Traditional systems lose state when processes crash. Temporal persists every state transition, enabling automatic recovery without data loss.

**3. Long-running Processes**

Business processes that span hours, days, or even years are naturally modeled in Temporal. No special patterns required for handling timeouts or keeping connections alive.

**4. Visibility and Debugging**

Temporal provides complete execution history, making it possible to understand exactly what happened in any workflow at any point in time.

## Core Architecture

### Key Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Temporal Cluster                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Frontend   │  │   History   │  │       Matching          │ │
│  │  Service    │  │   Service   │  │       Service           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Persistence Layer                     │   │
│  │        (PostgreSQL / MySQL / Cassandra / etc.)          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ gRPC
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Worker Process                          │
│  ┌─────────────────────┐      ┌─────────────────────┐          │
│  │  Workflow Worker    │      │  Activity Worker     │          │
│  │  (Deterministic)    │      │  (Side Effects OK)   │          │
│  └─────────────────────┘      └─────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow

A Workflow is the central unit of orchestration in Temporal. It's a function that defines the sequence and logic of your business process. Workflows must be **deterministic** - given the same input, they must always produce the same sequence of commands.

```typescript
// TypeScript Workflow Definition
import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

const { sendEmail, processPayment, updateInventory } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 3,
  },
});

export async function orderWorkflow(order: Order): Promise<OrderResult> {
  // Step 1: Process payment
  const paymentResult = await processPayment(order.paymentInfo);

  // Step 2: Update inventory
  await updateInventory(order.items);

  // Step 3: Send confirmation email
  await sendEmail(order.customerEmail, 'Order confirmed!');

  // Step 4: Wait for shipping (could be days)
  await sleep('3 days');

  // Step 5: Send shipping reminder if needed
  await sendEmail(order.customerEmail, 'Your order is on its way!');

  return { status: 'completed', paymentId: paymentResult.id };
}
```

### Activity

Activities are the building blocks that perform the actual work - calling external services, accessing databases, or any operation with side effects. Unlike Workflows, Activities can be non-deterministic and can fail.

```typescript
// TypeScript Activity Definitions
import { Context } from '@temporalio/activity';

export async function processPayment(paymentInfo: PaymentInfo): Promise<PaymentResult> {
  const context = Context.current();

  // Heartbeat for long-running activities
  context.heartbeat('Processing payment...');

  // Call external payment service
  const response = await fetch('https://api.stripe.com/v1/charges', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STRIPE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: paymentInfo.amount,
      currency: paymentInfo.currency,
      source: paymentInfo.token,
    }),
  });

  if (!response.ok) {
    throw new Error(`Payment failed: ${response.statusText}`);
  }

  return await response.json();
}

export async function sendEmail(to: string, subject: string): Promise<void> {
  // Email sending logic
  await emailService.send({ to, subject });
}

export async function updateInventory(items: OrderItem[]): Promise<void> {
  for (const item of items) {
    await inventoryDb.decrement(item.sku, item.quantity);
  }
}
```

### Worker

Workers are the processes that host and execute Workflows and Activities. They poll the Temporal server for tasks and execute them.

```typescript
// TypeScript Worker Setup
import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'order-processing',
    // Worker configuration
    maxConcurrentActivityTaskExecutions: 100,
    maxConcurrentWorkflowTaskExecutions: 100,
  });

  console.log('Worker started');
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Event Sourcing and Deterministic Replay

Temporal uses event sourcing to persist workflow state. Every action in a workflow generates events that are stored in the event history.

```
Event History for Order Workflow:
┌────┬──────────────────────────────────────────┬─────────────────────┐
│ ID │ Event Type                               │ Timestamp           │
├────┼──────────────────────────────────────────┼─────────────────────┤
│ 1  │ WorkflowExecutionStarted                 │ 2024-01-15 10:00:00 │
│ 2  │ WorkflowTaskScheduled                    │ 2024-01-15 10:00:00 │
│ 3  │ WorkflowTaskStarted                      │ 2024-01-15 10:00:01 │
│ 4  │ WorkflowTaskCompleted                    │ 2024-01-15 10:00:01 │
│ 5  │ ActivityTaskScheduled (processPayment)   │ 2024-01-15 10:00:01 │
│ 6  │ ActivityTaskStarted                      │ 2024-01-15 10:00:02 │
│ 7  │ ActivityTaskCompleted                    │ 2024-01-15 10:00:05 │
│ 8  │ ActivityTaskScheduled (updateInventory)  │ 2024-01-15 10:00:05 │
│ ...│ ...                                      │ ...                 │
└────┴──────────────────────────────────────────┴─────────────────────┘
```

When a workflow needs to be recovered (e.g., after a worker crash), Temporal replays the event history. The workflow code runs again, but instead of executing activities, it retrieves the results from the history. This is why workflows must be deterministic - any non-determinism would cause replay to diverge from the original execution.

## Core Concepts in Depth

### Workflow Definition

**TypeScript Example:**

```typescript
import {
  proxyActivities,
  defineSignal,
  defineQuery,
  setHandler,
  condition,
  sleep
} from '@temporalio/workflow';

// Define signals and queries
export const updateStatusSignal = defineSignal<[string]>('updateStatus');
export const getStatusQuery = defineQuery<string>('getStatus');

interface OrderState {
  status: string;
  items: Item[];
}

export async function orderWorkflow(initialOrder: Order): Promise<OrderResult> {
  // Workflow state
  const state: OrderState = {
    status: 'pending',
    items: initialOrder.items,
  };

  // Signal handler - allows external input
  setHandler(updateStatusSignal, (newStatus: string) => {
    state.status = newStatus;
  });

  // Query handler - allows external reads
  setHandler(getStatusQuery, () => state.status);

  // Workflow logic
  const activities = proxyActivities<typeof import('./activities')>({
    startToCloseTimeout: '1 minute',
  });

  // Process order
  await activities.validateOrder(state.items);
  state.status = 'validated';

  await activities.chargeCustomer(initialOrder.payment);
  state.status = 'charged';

  // Wait for shipment confirmation or timeout
  const shipped = await condition(() => state.status === 'shipped', '7 days');

  if (!shipped) {
    // Handle timeout - maybe refund
    await activities.refundCustomer(initialOrder.payment);
    return { success: false, reason: 'Shipment timeout' };
  }

  return { success: true };
}
```

**Go Example:**

```go
package workflows

import (
    "time"
    "go.temporal.io/sdk/workflow"
)

type OrderState struct {
    Status string
    Items  []Item
}

func OrderWorkflow(ctx workflow.Context, order Order) (*OrderResult, error) {
    logger := workflow.GetLogger(ctx)

    state := &OrderState{
        Status: "pending",
        Items:  order.Items,
    }

    // Activity options
    ao := workflow.ActivityOptions{
        StartToCloseTimeout: time.Minute,
        RetryPolicy: &temporal.RetryPolicy{
            MaximumAttempts: 3,
        },
    }
    ctx = workflow.WithActivityOptions(ctx, ao)

    // Signal channel for status updates
    statusChan := workflow.GetSignalChannel(ctx, "updateStatus")

    // Query handler
    err := workflow.SetQueryHandler(ctx, "getStatus", func() (string, error) {
        return state.Status, nil
    })
    if err != nil {
        return nil, err
    }

    // Process order
    var validationResult ValidationResult
    err = workflow.ExecuteActivity(ctx, ValidateOrder, state.Items).Get(ctx, &validationResult)
    if err != nil {
        return nil, err
    }
    state.Status = "validated"

    // Charge customer
    var chargeResult ChargeResult
    err = workflow.ExecuteActivity(ctx, ChargeCustomer, order.Payment).Get(ctx, &chargeResult)
    if err != nil {
        return nil, err
    }
    state.Status = "charged"

    // Wait for shipment or timeout
    selector := workflow.NewSelector(ctx)
    timerFuture := workflow.NewTimer(ctx, 7*24*time.Hour)

    var shipped bool
    selector.AddReceive(statusChan, func(c workflow.ReceiveChannel, more bool) {
        var newStatus string
        c.Receive(ctx, &newStatus)
        if newStatus == "shipped" {
            shipped = true
        }
    })
    selector.AddFuture(timerFuture, func(f workflow.Future) {
        // Timeout reached
    })
    selector.Select(ctx)

    if !shipped {
        // Refund on timeout
        err = workflow.ExecuteActivity(ctx, RefundCustomer, order.Payment).Get(ctx, nil)
        if err != nil {
            logger.Error("Failed to refund", "error", err)
        }
        return &OrderResult{Success: false, Reason: "Shipment timeout"}, nil
    }

    return &OrderResult{Success: true}, nil
}
```

**Python Example:**

```python
from datetime import timedelta
from temporalio import workflow
from temporalio.common import RetryPolicy
from dataclasses import dataclass

with workflow.unsafe.imports_passed_through():
    from activities import validate_order, charge_customer, refund_customer

@dataclass
class OrderState:
    status: str = "pending"
    items: list = None

@workflow.defn
class OrderWorkflow:
    def __init__(self):
        self.state = OrderState()

    @workflow.run
    async def run(self, order: Order) -> OrderResult:
        self.state.items = order.items

        # Configure activities
        retry_policy = RetryPolicy(maximum_attempts=3)

        # Validate order
        await workflow.execute_activity(
            validate_order,
            self.state.items,
            start_to_close_timeout=timedelta(minutes=1),
            retry_policy=retry_policy,
        )
        self.state.status = "validated"

        # Charge customer
        await workflow.execute_activity(
            charge_customer,
            order.payment,
            start_to_close_timeout=timedelta(minutes=1),
            retry_policy=retry_policy,
        )
        self.state.status = "charged"

        # Wait for shipment or timeout
        try:
            await workflow.wait_condition(
                lambda: self.state.status == "shipped",
                timeout=timedelta(days=7),
            )
        except asyncio.TimeoutError:
            # Refund on timeout
            await workflow.execute_activity(
                refund_customer,
                order.payment,
                start_to_close_timeout=timedelta(minutes=1),
            )
            return OrderResult(success=False, reason="Shipment timeout")

        return OrderResult(success=True)

    @workflow.signal
    async def update_status(self, new_status: str):
        self.state.status = new_status

    @workflow.query
    def get_status(self) -> str:
        return self.state.status
```

### Activity Implementation

Activities should be designed with idempotency and proper error handling:

```typescript
// TypeScript Activity with Best Practices
import { Context } from '@temporalio/activity';
import { ApplicationFailure } from '@temporalio/common';

interface PaymentResult {
  transactionId: string;
  status: 'success' | 'failed';
}

export async function processPayment(
  orderId: string,
  amount: number,
  idempotencyKey: string
): Promise<PaymentResult> {
  const context = Context.current();
  const { attempt } = context.info;

  console.log(`Processing payment for order ${orderId}, attempt ${attempt}`);

  try {
    // Check for existing transaction (idempotency)
    const existing = await paymentDb.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      console.log(`Returning existing transaction: ${existing.transactionId}`);
      return existing;
    }

    // Heartbeat for long operations
    context.heartbeat('Initiating payment...');

    // Process payment with external provider
    const result = await paymentProvider.charge({
      amount,
      currency: 'USD',
      idempotencyKey,
    });

    context.heartbeat('Payment processed, saving result...');

    // Save transaction for idempotency
    await paymentDb.save({
      idempotencyKey,
      transactionId: result.id,
      orderId,
      amount,
      status: 'success',
    });

    return {
      transactionId: result.id,
      status: 'success',
    };

  } catch (error) {
    // Distinguish between retryable and non-retryable errors
    if (error.code === 'CARD_DECLINED') {
      // Non-retryable business error
      throw ApplicationFailure.nonRetryable(
        'Payment declined',
        'PAYMENT_DECLINED',
        { orderId, reason: error.message }
      );
    }

    if (error.code === 'NETWORK_ERROR') {
      // Retryable infrastructure error
      throw ApplicationFailure.retryable(
        'Payment service unavailable',
        'PAYMENT_SERVICE_UNAVAILABLE'
      );
    }

    // Unknown error - let retry policy handle it
    throw error;
  }
}
```

### Signals and Queries

Signals allow external systems to send data to running workflows:

```typescript
// Sending a signal from a client
import { Client } from '@temporalio/client';

async function approveOrder(workflowId: string) {
  const client = new Client();
  const handle = client.workflow.getHandle(workflowId);

  // Send signal to workflow
  await handle.signal('approval', { approved: true, approver: 'admin@company.com' });
}

// Querying workflow state
async function getOrderStatus(workflowId: string): Promise<string> {
  const client = new Client();
  const handle = client.workflow.getHandle(workflowId);

  // Query workflow
  return await handle.query('getStatus');
}
```

### Timers and Sleep

Temporal timers are durable - they survive process restarts:

```typescript
import { sleep, condition } from '@temporalio/workflow';

export async function subscriptionWorkflow(userId: string): Promise<void> {
  // Sleep for 30 days - workflow will wake up automatically
  await sleep('30 days');

  // Charge for next billing cycle
  await activities.chargeSubscription(userId);

  // Continue indefinitely
  await subscriptionWorkflow(userId); // Recursive call (use Continue-As-New for long-running)
}

// Better pattern for long-running workflows
export async function subscriptionWorkflowWithContinueAsNew(
  userId: string,
  billingCycle: number = 1
): Promise<void> {
  await sleep('30 days');
  await activities.chargeSubscription(userId);

  // Continue as new to avoid history growth
  await workflow.continueAsNew<typeof subscriptionWorkflowWithContinueAsNew>(
    userId,
    billingCycle + 1
  );
}
```

### Child Workflows

Complex workflows can spawn child workflows for modularity:

```typescript
import { executeChild, startChild, ParentClosePolicy } from '@temporalio/workflow';

export async function parentWorkflow(order: Order): Promise<void> {
  // Execute child and wait for result
  const result = await executeChild(paymentWorkflow, {
    args: [order.payment],
    workflowId: `payment-${order.id}`,
  });

  // Start child without waiting (fire-and-forget)
  const childHandle = await startChild(notificationWorkflow, {
    args: [order.customerEmail],
    workflowId: `notification-${order.id}`,
    parentClosePolicy: ParentClosePolicy.ABANDON, // Child continues if parent completes
  });

  // Process multiple items in parallel
  const itemPromises = order.items.map((item, index) =>
    executeChild(processItemWorkflow, {
      args: [item],
      workflowId: `item-${order.id}-${index}`,
    })
  );

  await Promise.all(itemPromises);
}
```

## Best Practices

### Workflow Design Patterns

**1. Saga Pattern for Distributed Transactions:**

```typescript
interface SagaStep {
  execute: () => Promise<void>;
  compensate: () => Promise<void>;
}

export async function orderSagaWorkflow(order: Order): Promise<OrderResult> {
  const completedSteps: SagaStep[] = [];

  const steps: SagaStep[] = [
    {
      execute: () => activities.reserveInventory(order.items),
      compensate: () => activities.releaseInventory(order.items),
    },
    {
      execute: () => activities.chargePayment(order.payment),
      compensate: () => activities.refundPayment(order.payment),
    },
    {
      execute: () => activities.scheduleShipping(order),
      compensate: () => activities.cancelShipping(order.id),
    },
  ];

  try {
    for (const step of steps) {
      await step.execute();
      completedSteps.push(step);
    }

    return { success: true };

  } catch (error) {
    // Compensate in reverse order
    for (const step of completedSteps.reverse()) {
      try {
        await step.compensate();
      } catch (compensateError) {
        // Log but continue compensating
        console.error('Compensation failed:', compensateError);
      }
    }

    return { success: false, error: error.message };
  }
}
```

**2. State Machine Pattern:**

```typescript
type OrderState = 'created' | 'validated' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

interface StateMachine {
  state: OrderState;
  transitions: Record<OrderState, OrderState[]>;
}

export async function orderStateMachineWorkflow(order: Order): Promise<void> {
  const machine: StateMachine = {
    state: 'created',
    transitions: {
      created: ['validated', 'cancelled'],
      validated: ['paid', 'cancelled'],
      paid: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    },
  };

  const transition = (newState: OrderState) => {
    const allowed = machine.transitions[machine.state];
    if (!allowed.includes(newState)) {
      throw new Error(`Invalid transition from ${machine.state} to ${newState}`);
    }
    machine.state = newState;
  };

  // Query for current state
  setHandler(getStateQuery, () => machine.state);

  // Signal to trigger transitions
  setHandler(transitionSignal, async (event: TransitionEvent) => {
    try {
      transition(event.targetState);
    } catch (error) {
      // Invalid transition - ignore or handle
    }
  });

  // Automatic transitions based on activities
  await activities.validateOrder(order);
  transition('validated');

  await activities.processPayment(order.payment);
  transition('paid');

  // Wait for external shipping confirmation
  await condition(() => machine.state === 'shipped', '30 days');

  // Final delivery confirmation
  await condition(() => machine.state === 'delivered', '14 days');
}
```

**3. Polling Pattern:**

```typescript
export async function pollingWorkflow(resourceId: string): Promise<Resource> {
  const maxAttempts = 100;
  const pollInterval = '30 seconds';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const status = await activities.checkResourceStatus(resourceId);

    if (status === 'ready') {
      return await activities.getResource(resourceId);
    }

    if (status === 'failed') {
      throw ApplicationFailure.nonRetryable('Resource creation failed');
    }

    // Wait before next poll
    await sleep(pollInterval);
  }

  throw ApplicationFailure.nonRetryable('Resource creation timed out');
}
```

### Error Handling

```typescript
import {
  ApplicationFailure,
  ActivityFailure,
  ChildWorkflowFailure,
  CancelledFailure
} from '@temporalio/common';

export async function robustWorkflow(input: Input): Promise<Output> {
  try {
    return await activities.riskyOperation(input);

  } catch (error) {
    if (error instanceof ActivityFailure) {
      const cause = error.cause;

      if (cause instanceof ApplicationFailure) {
        // Application-level error
        if (cause.type === 'BUSINESS_RULE_VIOLATION') {
          // Handle business error
          return { status: 'rejected', reason: cause.message };
        }
      }

      // Activity failed after all retries
      await activities.notifyFailure(input, error.message);
      throw error;
    }

    if (error instanceof CancelledFailure) {
      // Workflow was cancelled
      await activities.cleanup(input);
      throw error;
    }

    // Unexpected error
    throw error;
  }
}

// Activity with detailed error types
export async function processOrder(orderId: string): Promise<void> {
  const order = await db.getOrder(orderId);

  if (!order) {
    throw ApplicationFailure.nonRetryable(
      'Order not found',
      'ORDER_NOT_FOUND',
      { orderId }
    );
  }

  if (order.status === 'cancelled') {
    throw ApplicationFailure.nonRetryable(
      'Order already cancelled',
      'ORDER_CANCELLED',
      { orderId, cancelledAt: order.cancelledAt }
    );
  }

  if (!await inventoryService.checkAvailability(order.items)) {
    throw ApplicationFailure.retryable(
      'Inventory temporarily unavailable',
      'INVENTORY_UNAVAILABLE'
    );
  }

  // Process order...
}
```

### Versioning Workflows

When updating workflow logic, use versioning to maintain backward compatibility:

```typescript
import { patched, deprecatePatch } from '@temporalio/workflow';

export async function orderWorkflow(order: Order): Promise<void> {
  // Original logic
  await activities.validateOrder(order);

  // Version 1: Added fraud check
  if (patched('fraud-check-v1')) {
    await activities.checkFraud(order);
  }

  await activities.processPayment(order.payment);

  // Version 2: Changed shipping logic
  if (patched('new-shipping-v2')) {
    // New shipping logic with carrier selection
    const carrier = await activities.selectCarrier(order);
    await activities.shipWithCarrier(order, carrier);
  } else {
    // Old shipping logic
    await activities.ship(order);
  }

  // After all workflows using old version complete,
  // deprecate the patch
  // deprecatePatch('fraud-check-v1');
}
```

## Common Pitfalls

### 1. Non-Deterministic Code

Workflows must be deterministic. Avoid these patterns:

```typescript
// WRONG: Non-deterministic operations
export async function badWorkflow(): Promise<void> {
  // Random values change on replay
  const id = Math.random(); // WRONG
  const id2 = crypto.randomUUID(); // WRONG

  // Current time changes on replay
  const now = new Date(); // WRONG

  // External state can change
  const config = process.env.SOME_CONFIG; // WRONG

  // Network calls in workflow
  const data = await fetch('https://api.example.com'); // WRONG
}

// CORRECT: Deterministic patterns
import { uuid4, sleep } from '@temporalio/workflow';

export async function goodWorkflow(): Promise<void> {
  // Use workflow-provided random
  const id = uuid4();

  // Use workflow time (consistent on replay)
  const now = new Date(); // Actually OK - Temporal patches Date

  // Get configuration via activities
  const config = await activities.getConfig();

  // All external calls go through activities
  const data = await activities.fetchData();
}
```

### 2. Activity Timeout Misconfiguration

```typescript
// WRONG: No timeout specified
const activities = proxyActivities({
  // Missing timeout - will use defaults
});

// WRONG: Timeout too short for operation
const activities = proxyActivities({
  startToCloseTimeout: '5 seconds', // Too short for payment processing
});

// CORRECT: Appropriate timeouts
const quickActivities = proxyActivities<typeof import('./activities')>({
  startToCloseTimeout: '30 seconds',
});

const longActivities = proxyActivities<typeof import('./activities')>({
  startToCloseTimeout: '10 minutes',
  heartbeatTimeout: '30 seconds', // For progress tracking
});

// Activity with heartbeat
export async function longRunningActivity(): Promise<void> {
  const ctx = Context.current();

  for (let i = 0; i < 1000; i++) {
    await processItem(i);
    ctx.heartbeat(`Processed ${i + 1}/1000 items`);
  }
}
```

### 3. Workflow History Too Large

```typescript
// WRONG: Unbounded loop creates huge history
export async function badLoopWorkflow(): Promise<void> {
  while (true) {
    await activities.poll();
    await sleep('1 minute');
    // History grows forever!
  }
}

// CORRECT: Use Continue-As-New
export async function goodLoopWorkflow(iteration: number = 0): Promise<void> {
  const maxIterations = 1000;

  for (let i = 0; i < maxIterations; i++) {
    await activities.poll();
    await sleep('1 minute');
  }

  // Reset history with Continue-As-New
  await workflow.continueAsNew<typeof goodLoopWorkflow>(iteration + maxIterations);
}

// Also CORRECT: External orchestration
export async function singleIterationWorkflow(): Promise<void> {
  await activities.poll();
  // External scheduler starts new workflow each time
}
```

### 4. Missing Idempotency

```typescript
// WRONG: Activity not idempotent
export async function chargeCustomer(amount: number): Promise<void> {
  // Double-charging possible on retry
  await paymentService.charge(amount);
}

// CORRECT: Idempotent activity
export async function chargeCustomer(
  amount: number,
  idempotencyKey: string
): Promise<ChargeResult> {
  // Check if already charged
  const existing = await db.findCharge(idempotencyKey);
  if (existing) {
    return existing;
  }

  const result = await paymentService.charge(amount, { idempotencyKey });
  await db.saveCharge(idempotencyKey, result);

  return result;
}
```

## Performance Considerations

### Worker Tuning

```typescript
import { Worker, NativeConnection } from '@temporalio/worker';

async function createOptimizedWorker() {
  // Create connection with tuning
  const connection = await NativeConnection.connect({
    address: 'temporal:7233',
  });

  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'high-throughput',

    // Concurrency settings
    maxConcurrentActivityTaskExecutions: 200,
    maxConcurrentWorkflowTaskExecutions: 200,
    maxConcurrentLocalActivityExecutions: 200,

    // Sticky queue optimization
    maxCachedWorkflows: 2000,
    stickyQueueScheduleToStartTimeout: '10 seconds',

    // Rate limiting
    maxTaskQueueActivitiesPerSecond: 1000,
    maxActivitiesPerSecond: 500,
  });

  return worker;
}
```

### Batch Processing

```typescript
export async function batchProcessingWorkflow(items: Item[]): Promise<void> {
  const BATCH_SIZE = 100;
  const CONCURRENT_BATCHES = 10;

  // Split into batches
  const batches: Item[][] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }

  // Process batches with controlled concurrency
  for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
    const currentBatches = batches.slice(i, i + CONCURRENT_BATCHES);

    await Promise.all(
      currentBatches.map((batch, index) =>
        activities.processBatch(batch, i + index)
      )
    );
  }
}

// Activity optimized for batches
export async function processBatch(items: Item[], batchId: number): Promise<void> {
  const ctx = Context.current();

  // Bulk database operation
  await db.bulkInsert(items);

  ctx.heartbeat(`Batch ${batchId} complete`);
}
```

### Sharding Strategy

```typescript
// Distribute load across multiple task queues
function getTaskQueue(workflowId: string): string {
  const shardCount = 10;
  const hash = simpleHash(workflowId);
  const shard = hash % shardCount;
  return `orders-shard-${shard}`;
}

// Start worker per shard
async function startShardedWorkers() {
  const shardCount = 10;
  const workers = [];

  for (let shard = 0; shard < shardCount; shard++) {
    const worker = await Worker.create({
      workflowsPath: require.resolve('./workflows'),
      activities,
      taskQueue: `orders-shard-${shard}`,
    });
    workers.push(worker.run());
  }

  await Promise.all(workers);
}

// Client starts workflow on appropriate shard
async function startOrder(order: Order) {
  const taskQueue = getTaskQueue(order.id);

  await client.workflow.start(orderWorkflow, {
    workflowId: order.id,
    taskQueue,
    args: [order],
  });
}
```

## Real-World Scenarios

### E-Commerce Order Processing

```typescript
import {
  proxyActivities,
  defineSignal,
  defineQuery,
  setHandler,
  condition,
  sleep,
  ApplicationFailure
} from '@temporalio/workflow';

export const cancelOrderSignal = defineSignal('cancelOrder');
export const getOrderStatusQuery = defineQuery<OrderStatus>('getOrderStatus');

export async function ecommerceOrderWorkflow(order: Order): Promise<OrderResult> {
  const state: OrderStatus = {
    phase: 'created',
    paymentStatus: 'pending',
    shippingStatus: 'pending',
    cancelled: false,
  };

  let cancellationRequested = false;

  setHandler(cancelOrderSignal, () => {
    cancellationRequested = true;
  });

  setHandler(getOrderStatusQuery, () => state);

  const activities = proxyActivities<typeof import('./activities')>({
    startToCloseTimeout: '5 minutes',
    retry: { maximumAttempts: 3 },
  });

  try {
    // Phase 1: Validate order
    state.phase = 'validating';
    await activities.validateOrder(order);

    if (cancellationRequested) {
      return await handleCancellation(state, order, activities);
    }

    // Phase 2: Reserve inventory
    state.phase = 'reserving_inventory';
    await activities.reserveInventory(order.items);

    if (cancellationRequested) {
      await activities.releaseInventory(order.items);
      return await handleCancellation(state, order, activities);
    }

    // Phase 3: Process payment
    state.phase = 'processing_payment';
    const payment = await activities.processPayment({
      orderId: order.id,
      amount: order.total,
      method: order.paymentMethod,
    });
    state.paymentStatus = 'completed';

    if (cancellationRequested) {
      await activities.refundPayment(payment.transactionId);
      await activities.releaseInventory(order.items);
      return await handleCancellation(state, order, activities);
    }

    // Phase 4: Fulfill order
    state.phase = 'fulfilling';
    const shipment = await activities.createShipment(order);
    state.shippingStatus = 'in_progress';

    // Phase 5: Wait for delivery (with timeout)
    state.phase = 'shipping';
    const delivered = await condition(
      () => state.shippingStatus === 'delivered',
      '30 days'
    );

    if (!delivered) {
      // Handle delivery timeout
      await activities.investigateShipment(shipment.trackingId);
    }

    // Phase 6: Complete
    state.phase = 'completed';
    await activities.sendConfirmationEmail(order.customerEmail);

    return {
      success: true,
      orderId: order.id,
      transactionId: payment.transactionId,
      trackingNumber: shipment.trackingId,
    };

  } catch (error) {
    state.phase = 'failed';
    await activities.notifySupport(order.id, error.message);
    throw error;
  }
}

async function handleCancellation(
  state: OrderStatus,
  order: Order,
  activities: any
): Promise<OrderResult> {
  state.cancelled = true;
  state.phase = 'cancelled';
  await activities.sendCancellationEmail(order.customerEmail);
  return { success: false, cancelled: true, orderId: order.id };
}
```

### Payment Processing with Saga

```typescript
interface PaymentSagaInput {
  orderId: string;
  customerId: string;
  amount: number;
  items: LineItem[];
}

export async function paymentSagaWorkflow(input: PaymentSagaInput): Promise<PaymentResult> {
  const activities = proxyActivities<typeof import('./activities')>({
    startToCloseTimeout: '2 minutes',
  });

  const saga = new SagaBuilder();

  try {
    // Step 1: Create payment intent
    const intent = await activities.createPaymentIntent({
      amount: input.amount,
      customerId: input.customerId,
    });
    saga.addCompensation(() => activities.cancelPaymentIntent(intent.id));

    // Step 2: Verify fraud
    const fraudCheck = await activities.performFraudCheck({
      customerId: input.customerId,
      amount: input.amount,
      items: input.items,
    });

    if (fraudCheck.riskScore > 0.8) {
      throw ApplicationFailure.nonRetryable(
        'High fraud risk detected',
        'FRAUD_DETECTED'
      );
    }

    // Step 3: Reserve funds
    const reservation = await activities.reserveFunds({
      intentId: intent.id,
      amount: input.amount,
    });
    saga.addCompensation(() => activities.releaseFunds(reservation.id));

    // Step 4: Allocate inventory
    const allocation = await activities.allocateInventory(input.items);
    saga.addCompensation(() => activities.deallocateInventory(allocation.id));

    // Step 5: Capture payment
    const capture = await activities.capturePayment(intent.id);
    // No compensation for capture - it's the final step

    // Step 6: Confirm order
    await activities.confirmOrder({
      orderId: input.orderId,
      paymentId: capture.id,
      allocationId: allocation.id,
    });

    return {
      success: true,
      paymentId: capture.id,
      orderId: input.orderId,
    };

  } catch (error) {
    // Execute compensations in reverse order
    await saga.compensate();

    throw error;
  }
}

class SagaBuilder {
  private compensations: (() => Promise<void>)[] = [];

  addCompensation(fn: () => Promise<void>) {
    this.compensations.unshift(fn); // Add to front for reverse order
  }

  async compensate() {
    for (const compensation of this.compensations) {
      try {
        await compensation();
      } catch (error) {
        // Log but continue
        console.error('Compensation failed:', error);
      }
    }
  }
}
```

### Data Pipeline

```typescript
export async function dataPipelineWorkflow(config: PipelineConfig): Promise<PipelineResult> {
  const activities = proxyActivities<typeof import('./activities')>({
    startToCloseTimeout: '30 minutes',
    heartbeatTimeout: '1 minute',
  });

  const metrics: PipelineMetrics = {
    recordsProcessed: 0,
    recordsFailed: 0,
    startTime: Date.now(),
  };

  // Set up query for monitoring
  setHandler(getMetricsQuery, () => metrics);

  // Step 1: Extract data
  const extractResult = await activities.extractData({
    source: config.source,
    query: config.extractQuery,
    batchSize: config.batchSize,
  });

  // Step 2: Transform in parallel batches
  const transformPromises = extractResult.batches.map(async (batch, index) => {
    try {
      const transformed = await activities.transformBatch({
        data: batch,
        transformations: config.transformations,
      });
      metrics.recordsProcessed += transformed.count;
      return transformed;
    } catch (error) {
      metrics.recordsFailed += batch.length;
      throw error;
    }
  });

  const transformedBatches = await Promise.allSettled(transformPromises);

  // Step 3: Load successful batches
  const successfulBatches = transformedBatches
    .filter((r): r is PromiseFulfilledResult<TransformResult> => r.status === 'fulfilled')
    .map(r => r.value);

  for (const batch of successfulBatches) {
    await activities.loadData({
      destination: config.destination,
      data: batch.data,
    });
  }

  // Step 4: Handle failures
  const failedBatches = transformedBatches
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected');

  if (failedBatches.length > 0) {
    await activities.reportFailures({
      pipelineId: config.id,
      failures: failedBatches.map(f => f.reason),
    });
  }

  // Step 5: Generate report
  metrics.endTime = Date.now();
  await activities.generateReport(metrics);

  return {
    success: failedBatches.length === 0,
    metrics,
  };
}
```

### Subscription Billing

```typescript
export async function subscriptionWorkflow(
  subscription: Subscription
): Promise<void> {
  const activities = proxyActivities<typeof import('./activities')>({
    startToCloseTimeout: '5 minutes',
  });

  let currentPeriod = 0;
  let cancelled = false;

  setHandler(cancelSubscriptionSignal, () => {
    cancelled = true;
  });

  setHandler(getSubscriptionStatusQuery, () => ({
    active: !cancelled,
    currentPeriod,
    nextBillingDate: calculateNextBillingDate(subscription, currentPeriod),
  }));

  while (!cancelled) {
    // Wait for billing date
    await sleep(subscription.billingInterval);

    if (cancelled) break;

    currentPeriod++;

    try {
      // Attempt billing
      await activities.chargeSubscription({
        subscriptionId: subscription.id,
        amount: subscription.amount,
        period: currentPeriod,
      });

      // Send receipt
      await activities.sendReceipt({
        email: subscription.customerEmail,
        amount: subscription.amount,
        period: currentPeriod,
      });

    } catch (error) {
      // Payment failed - enter dunning flow
      const recovered = await handleFailedPayment(
        subscription,
        currentPeriod,
        activities
      );

      if (!recovered) {
        cancelled = true;
        await activities.cancelSubscription(subscription.id);
        await activities.sendCancellationNotice(subscription.customerEmail);
      }
    }

    // Continue-As-New to prevent history growth
    if (currentPeriod % 12 === 0) {
      await workflow.continueAsNew<typeof subscriptionWorkflow>({
        ...subscription,
        startPeriod: currentPeriod,
      });
    }
  }
}

async function handleFailedPayment(
  subscription: Subscription,
  period: number,
  activities: any
): Promise<boolean> {
  const maxRetries = 3;
  const retryDelays = ['3 days', '5 days', '7 days'];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await activities.sendPaymentFailureNotice({
      email: subscription.customerEmail,
      attempt: attempt + 1,
      nextRetryDate: retryDelays[attempt],
    });

    await sleep(retryDelays[attempt]);

    try {
      await activities.chargeSubscription({
        subscriptionId: subscription.id,
        amount: subscription.amount,
        period,
        retryAttempt: attempt + 1,
      });

      return true; // Payment succeeded
    } catch {
      // Continue to next attempt
    }
  }

  return false; // All retries failed
}
```

## Interview Questions

### Conceptual Questions

**Q1: What makes Temporal different from traditional message queues like RabbitMQ or Kafka?**

A: Key differences include:
- **Programming model**: Temporal uses native code functions vs event handlers
- **State management**: Temporal automatically persists workflow state vs manual database management
- **Failure handling**: Automatic replay and recovery vs manual retry logic
- **Long-running processes**: Native support with durable timers vs complex patterns needed
- **Debugging**: Complete event history vs scattered logs

**Q2: Explain the concept of deterministic replay and why it matters.**

A: Deterministic replay is how Temporal recovers workflow state after failures. When a workflow needs to resume, Temporal replays all events from history. The workflow code runs again, but activity results come from history instead of executing again. This requires workflows to be deterministic - the same inputs must produce the same sequence of commands. Non-determinism (like `Math.random()` or `Date.now()` without Temporal's wrapper) would cause replay to diverge from the original execution, breaking recovery.

**Q3: What's the difference between a Workflow and an Activity?**

A:
- **Workflows**: Orchestration logic, must be deterministic, no I/O operations, automatically persisted and recoverable
- **Activities**: Actual work execution, can have side effects, interact with external systems, have retry policies, can fail and be retried

**Q4: How does Temporal handle the "exactly-once" semantics problem?**

A: Temporal provides "effectively once" semantics through:
1. **Workflow ID uniqueness**: Each workflow ID can only have one running execution
2. **Activity idempotency tokens**: Built-in support for idempotency keys
3. **Deterministic replay**: Failed workflows resume exactly where they left off
4. **Event sourcing**: Complete history prevents duplicate processing

### Technical Questions

**Q5: How would you handle a workflow that needs to run indefinitely?**

A: Use Continue-As-New to prevent unbounded history growth:

```typescript
export async function longRunningWorkflow(state: State): Promise<void> {
  const maxIterations = 1000;

  for (let i = 0; i < maxIterations; i++) {
    await activities.processItem();
    state.processed++;
  }

  // Continue with new history
  await workflow.continueAsNew<typeof longRunningWorkflow>(state);
}
```

**Q6: How do you version workflow code without breaking running workflows?**

A: Use the `patched` API for branching logic:

```typescript
if (patched('v2-shipping')) {
  // New logic
  await activities.newShippingMethod();
} else {
  // Old logic
  await activities.oldShippingMethod();
}
```

**Q7: What timeout types exist and when should you use each?**

A:
- **Schedule-To-Start**: Time from task creation to worker pickup (detect queue issues)
- **Start-To-Close**: Time from worker pickup to completion (main execution timeout)
- **Schedule-To-Close**: Total time from creation to completion (end-to-end timeout)
- **Heartbeat**: For long activities, detect worker failures mid-execution

**Q8: How do you implement distributed transactions with Temporal?**

A: Use the Saga pattern with compensating transactions:

```typescript
const saga = [];
try {
  await step1(); saga.push(compensate1);
  await step2(); saga.push(compensate2);
  await step3(); // Final step, no compensation
} catch {
  // Compensate in reverse
  for (const compensate of saga.reverse()) {
    await compensate();
  }
}
```

### Architecture Questions

**Q9: How would you scale Temporal for high throughput?**

A:
1. **Multiple task queues**: Shard workflows across queues by ID hash
2. **Worker scaling**: Horizontal scaling of workers per task queue
3. **Tuning concurrency**: Adjust `maxConcurrentActivityTaskExecutions`
4. **Database optimization**: Proper indexing, connection pooling
5. **Activity batching**: Process multiple items in single activity

**Q10: What are the trade-offs of using Temporal?**

A:
- **Pros**: Reliability, visibility, simplified error handling, durable timers
- **Cons**: Infrastructure complexity, determinism constraints, learning curve, event history size for long workflows
- **When to use**: Mission-critical processes, long-running operations, distributed transactions
- **When not to use**: Simple request-response, real-time low-latency requirements, stateless operations

## Further Reading

### Official Resources

- [Temporal Documentation](https://docs.temporal.io/)
- [Temporal TypeScript SDK](https://typescript.temporal.io/)
- [Temporal Go SDK](https://pkg.go.dev/go.temporal.io/sdk)
- [Temporal Python SDK](https://python.temporal.io/)
- [Temporal Java SDK](https://www.javadoc.io/doc/io.temporal/temporal-sdk/latest/index.html)

### Learning Resources

- [Temporal 101 Course](https://learn.temporal.io/courses/temporal_101/)
- [Temporal Samples Repository](https://github.com/temporalio/samples-typescript)
- [Temporal Community Forum](https://community.temporal.io/)
- [Temporal Blog](https://temporal.io/blog)

### Related Topics

- [Event Sourcing Pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [Distributed Systems Concepts](https://dataintensive.net/)

### Production Deployment

- [Temporal Cloud](https://temporal.io/cloud)
- [Self-hosted Deployment Guide](https://docs.temporal.io/self-hosted-guide)
- [Kubernetes Helm Charts](https://github.com/temporalio/helm-charts)
- [Observability Setup](https://docs.temporal.io/production-deployment/observability)

By mastering Temporal, you gain the ability to build applications that are inherently reliable, observable, and maintainable. The investment in learning its concepts pays off tremendously when building systems that need to handle failures gracefully and maintain consistency across distributed operations.
