---
title: 微服务设计模式
description: 深入理解微服务架构中的常用设计模式
track: architecture
section: design-patterns
difficulty: advanced
tags:
  - 微服务
  - 设计模式
  - Saga
  - CQRS
status: imported
origin: old/src/content/docs/backend/microservices-patterns.en.md
divergence: 0.23
issues:
  - title-lang-en
  - title-language
legacy:
  category: Backend
  subcategory: Patterns
  order: 22
  lastUpdated: 2026-01-07
---

Microservices architecture breaks down complex monolithic applications into multiple independent services, each focusing on specific business functionality. However, this architecture also brings new challenges: inter-service communication, data consistency, fault isolation, and more. We'll dive deep into core design patterns in microservices architecture to help you build robust and scalable distributed systems.

---

## Saga Pattern

### Problem Background

In microservices architecture, a business operation may need to span multiple services. Traditional distributed transactions (like two-phase commit) are difficult to implement in microservices environments because each service has its own database and services communicate over the network.

### Solution

The Saga pattern splits a distributed transaction into a series of local transactions, where each local transaction updates a single service's database. If a step fails, the Saga executes compensating transactions to undo previous changes.

### Two Implementation Approaches for Saga

#### Choreography-Based Saga

Each service publishes events, and other services listen and respond to these events.

```typescript
// Order Service - Publishes order created event
class OrderService {
  private eventBus: EventBus;
  private orderRepository: OrderRepository;

  async createOrder(orderData: CreateOrderDTO): Promise<Order> {
    // Create order (pending status)
    const order = await this.orderRepository.create({
      ...orderData,
      status: OrderStatus.PENDING,
    });

    // Publish order created event
    await this.eventBus.publish('order.created', {
      orderId: order.id,
      customerId: order.customerId,
      amount: order.totalAmount,
      items: order.items,
    });

    return order;
  }

  // Listen for inventory reservation failed event
  @EventHandler('inventory.reservation.failed')
  async handleInventoryFailed(event: InventoryFailedEvent): Promise<void> {
    // Compensating action: cancel order
    await this.orderRepository.updateStatus(
      event.orderId,
      OrderStatus.CANCELLED
    );

    // Publish order cancelled event
    await this.eventBus.publish('order.cancelled', {
      orderId: event.orderId,
      reason: 'Inventory reservation failed',
    });
  }

  // Listen for payment failed event
  @EventHandler('payment.failed')
  async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
    await this.orderRepository.updateStatus(
      event.orderId,
      OrderStatus.CANCELLED
    );
  }

  // Listen for payment completed event
  @EventHandler('payment.completed')
  async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    await this.orderRepository.updateStatus(
      event.orderId,
      OrderStatus.CONFIRMED
    );
  }
}

// Inventory Service - Listens for order created event
class InventoryService {
  private eventBus: EventBus;
  private inventoryRepository: InventoryRepository;

  @EventHandler('order.created')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      // Reserve inventory
      for (const item of event.items) {
        await this.inventoryRepository.reserve(item.productId, item.quantity);
      }

      // Publish inventory reserved event
      await this.eventBus.publish('inventory.reserved', {
        orderId: event.orderId,
        items: event.items,
      });
    } catch (error) {
      // Publish inventory reservation failed event
      await this.eventBus.publish('inventory.reservation.failed', {
        orderId: event.orderId,
        reason: error.message,
      });
    }
  }

  // Listen for order cancelled event - compensating action
  @EventHandler('order.cancelled')
  async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    // Release reserved inventory
    await this.inventoryRepository.releaseReservation(event.orderId);
  }
}

// Payment Service - Listens for inventory reserved event
class PaymentService {
  private eventBus: EventBus;
  private paymentGateway: PaymentGateway;

  @EventHandler('inventory.reserved')
  async handleInventoryReserved(event: InventoryReservedEvent): Promise<void> {
    try {
      // Process payment
      const payment = await this.paymentGateway.charge({
        orderId: event.orderId,
        amount: event.amount,
      });

      // Publish payment completed event
      await this.eventBus.publish('payment.completed', {
        orderId: event.orderId,
        paymentId: payment.id,
      });
    } catch (error) {
      // Publish payment failed event
      await this.eventBus.publish('payment.failed', {
        orderId: event.orderId,
        reason: error.message,
      });
    }
  }
}
```

#### Orchestration-Based Saga

Uses a Saga orchestrator to centrally manage the transaction flow.

```typescript
// Saga Orchestrator
class OrderSagaOrchestrator {
  constructor(
    private orderService: OrderServiceClient,
    private inventoryService: InventoryServiceClient,
    private paymentService: PaymentServiceClient,
    private sagaRepository: SagaRepository
  ) {}

  async execute(orderData: CreateOrderDTO): Promise<SagaResult> {
    const sagaId = generateUUID();
    const sagaLog: SagaStep[] = [];

    try {
      // Step 1: Create order
      const order = await this.orderService.createOrder(orderData);
      sagaLog.push({ step: 'CREATE_ORDER', status: 'COMPLETED', data: order });

      // Step 2: Reserve inventory
      const reservation = await this.inventoryService.reserveInventory({
        orderId: order.id,
        items: orderData.items,
      });
      sagaLog.push({
        step: 'RESERVE_INVENTORY',
        status: 'COMPLETED',
        data: reservation
      });

      // Step 3: Process payment
      const payment = await this.paymentService.processPayment({
        orderId: order.id,
        amount: order.totalAmount,
        customerId: orderData.customerId,
      });
      sagaLog.push({ step: 'PROCESS_PAYMENT', status: 'COMPLETED', data: payment });

      // Step 4: Confirm order
      await this.orderService.confirmOrder(order.id);
      sagaLog.push({ step: 'CONFIRM_ORDER', status: 'COMPLETED' });

      // Save successful Saga log
      await this.sagaRepository.save({
        sagaId,
        status: 'COMPLETED',
        steps: sagaLog,
      });

      return { success: true, orderId: order.id };
    } catch (error) {
      // Execute compensating actions
      await this.compensate(sagaLog);

      // Save failed Saga log
      await this.sagaRepository.save({
        sagaId,
        status: 'COMPENSATED',
        steps: sagaLog,
        error: error.message,
      });

      return { success: false, error: error.message };
    }
  }

  private async compensate(sagaLog: SagaStep[]): Promise<void> {
    // Execute compensating actions in reverse order
    const completedSteps = sagaLog
      .filter(step => step.status === 'COMPLETED')
      .reverse();

    for (const step of completedSteps) {
      try {
        switch (step.step) {
          case 'PROCESS_PAYMENT':
            await this.paymentService.refund(step.data.paymentId);
            break;
          case 'RESERVE_INVENTORY':
            await this.inventoryService.releaseReservation(step.data.reservationId);
            break;
          case 'CREATE_ORDER':
            await this.orderService.cancelOrder(step.data.id);
            break;
        }
        step.compensationStatus = 'COMPLETED';
      } catch (compensationError) {
        step.compensationStatus = 'FAILED';
        step.compensationError = compensationError.message;
        // Log compensation failure, may require manual intervention
        console.error(`Compensation failed for step ${step.step}:`, compensationError);
      }
    }
  }
}

// Usage example
const orchestrator = new OrderSagaOrchestrator(
  orderService,
  inventoryService,
  paymentService,
  sagaRepository
);

const result = await orchestrator.execute({
  customerId: 'customer-123',
  items: [
    { productId: 'prod-1', quantity: 2 },
    { productId: 'prod-2', quantity: 1 },
  ],
});
```

### Saga Pattern Comparison

| Feature | Choreography | Orchestration |
|---------|--------------|---------------|
| Coupling | Low, services are loosely coupled | Medium, depends on orchestrator |
| Complexity | Distributed across services | Centralized in orchestrator |
| Visibility | Difficult to track overall flow | Clear and visible process |
| Single Point of Failure | None | Orchestrator may become bottleneck |
| Use Case | Simple flows, few services | Complex flows, many services |

---

## Circuit Breaker Pattern

### Problem Background

In distributed systems, calls between services may fail due to network issues, downstream service failures, etc. Without proper control, failed requests will continue to retry, consuming system resources and potentially causing cascading failures.

### Solution

The Circuit Breaker pattern mimics the behavior of electrical circuit breakers, "opening" the circuit when continuous failures are detected, preventing further requests and giving downstream services time to recover.

### Circuit Breaker States

```
     ┌─────────────────┐
     │     CLOSED      │ ─── Normal state, requests pass through
     └────────┬────────┘
              │ Failure count reaches threshold
              ▼
     ┌─────────────────┐
     │      OPEN       │ ─── Open state, requests fail immediately
     └────────┬────────┘
              │ After timeout expires
              ▼
     ┌─────────────────┐
     │   HALF-OPEN     │ ─── Half-open state, allows limited test requests
     └────────┬────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
  Success             Failure
    │                   │
    ▼                   ▼
  CLOSED              OPEN
```

### Implementation Example

```typescript
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitBreakerConfig {
  failureThreshold: number;      // Failure threshold
  successThreshold: number;      // Success threshold in half-open state
  timeout: number;               // Circuit breaker open duration (ms)
  requestTimeout: number;        // Single request timeout (ms)
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private nextAttempt: number = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check circuit breaker state
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new CircuitOpenError('Circuit breaker is OPEN');
      }
      // Transition to half-open state after timeout
      this.state = CircuitState.HALF_OPEN;
      console.log('Circuit breaker transitioning to HALF_OPEN');
    }

    try {
      // Wrap request with timeout
      const result = await this.executeWithTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new TimeoutError('Request timed out'));
        }, this.config.requestTimeout);
      }),
    ]);
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.reset();
        console.log('Circuit breaker CLOSED');
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.trip();
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.trip();
    }
  }

  private trip(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.config.timeout;
    console.log(`Circuit breaker OPEN until ${new Date(this.nextAttempt)}`);
  }

  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics(): CircuitMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// Circuit breaker decorator with fallback strategy
function withCircuitBreaker<T>(
  circuitBreaker: CircuitBreaker,
  fallback?: () => T | Promise<T>
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await circuitBreaker.execute(() =>
          originalMethod.apply(this, args)
        );
      } catch (error) {
        if (error instanceof CircuitOpenError && fallback) {
          console.log('Circuit open, using fallback');
          return fallback();
        }
        throw error;
      }
    };

    return descriptor;
  };
}

// Usage example
class ProductService {
  private inventoryCircuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000,
    requestTimeout: 5000,
  });

  @withCircuitBreaker(
    this.inventoryCircuitBreaker,
    () => ({ available: false, cached: true }) // Fallback response
  )
  async checkInventory(productId: string): Promise<InventoryStatus> {
    const response = await fetch(
      `http://inventory-service/products/${productId}/stock`
    );
    return response.json();
  }
}
```

### Using Resilience4j (Java)

```java
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;

@Service
public class OrderService {

    private final CircuitBreaker circuitBreaker;
    private final InventoryClient inventoryClient;

    public OrderService(CircuitBreakerRegistry registry, InventoryClient client) {
        this.circuitBreaker = registry.circuitBreaker("inventoryService",
            CircuitBreakerConfig.custom()
                .failureRateThreshold(50)
                .waitDurationInOpenState(Duration.ofSeconds(30))
                .permittedNumberOfCallsInHalfOpenState(3)
                .slidingWindowSize(10)
                .recordExceptions(IOException.class, TimeoutException.class)
                .build()
        );
        this.inventoryClient = client;
    }

    public InventoryResponse checkInventory(String productId) {
        return CircuitBreaker.decorateSupplier(circuitBreaker,
            () -> inventoryClient.getInventory(productId)
        ).recover(throwable -> {
            // Fallback logic
            log.warn("Circuit breaker fallback for product: {}", productId);
            return InventoryResponse.unavailable();
        }).get();
    }
}
```

---

## Bulkhead Pattern

### Problem Background

In microservices systems, if a service failure causes resources (like thread pools, connection pools) to be exhausted, it may affect other normal service calls, causing cascading failures.

### Solution

The Bulkhead pattern borrows from ship design concepts - ship hulls are divided into multiple watertight compartments so that even if one compartment takes on water, it won't affect other compartments. In microservices, we allocate independent resource pools for different service calls.

### Implementation Approaches

#### Thread Pool Isolation

```typescript
import { Worker } from 'worker_threads';

interface BulkheadConfig {
  maxConcurrent: number;
  maxWait: number;
  name: string;
}

class ThreadPoolBulkhead {
  private activeCount: number = 0;
  private waitingQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    task: () => Promise<any>;
    timeout: NodeJS.Timeout;
  }> = [];

  constructor(private config: BulkheadConfig) {}

  async execute<T>(task: () => Promise<T>): Promise<T> {
    // Check if capacity is available
    if (this.activeCount < this.config.maxConcurrent) {
      return this.runTask(task);
    }

    // Check if waiting queue is full
    if (this.waitingQueue.length >= this.config.maxWait) {
      throw new BulkheadFullError(
        `Bulkhead '${this.config.name}' is full`
      );
    }

    // Add to waiting queue
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(
          item => item.resolve === resolve
        );
        if (index > -1) {
          this.waitingQueue.splice(index, 1);
          reject(new BulkheadTimeoutError(
            `Waiting timeout for bulkhead '${this.config.name}'`
          ));
        }
      }, this.config.maxWait);

      this.waitingQueue.push({ resolve, reject, task, timeout });
    });
  }

  private async runTask<T>(task: () => Promise<T>): Promise<T> {
    this.activeCount++;

    try {
      return await task();
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.waitingQueue.length > 0 &&
        this.activeCount < this.config.maxConcurrent) {
      const next = this.waitingQueue.shift()!;
      clearTimeout(next.timeout);

      this.runTask(next.task)
        .then(next.resolve)
        .catch(next.reject);
    }
  }

  getMetrics(): BulkheadMetrics {
    return {
      name: this.config.name,
      activeCount: this.activeCount,
      waitingCount: this.waitingQueue.length,
      maxConcurrent: this.config.maxConcurrent,
    };
  }
}

// Create independent bulkheads for different services
class ServiceClient {
  private orderBulkhead = new ThreadPoolBulkhead({
    name: 'order-service',
    maxConcurrent: 10,
    maxWait: 5,
  });

  private paymentBulkhead = new ThreadPoolBulkhead({
    name: 'payment-service',
    maxConcurrent: 5,
    maxWait: 3,
  });

  private inventoryBulkhead = new ThreadPoolBulkhead({
    name: 'inventory-service',
    maxConcurrent: 15,
    maxWait: 10,
  });

  async getOrder(orderId: string): Promise<Order> {
    return this.orderBulkhead.execute(async () => {
      const response = await fetch(`http://order-service/orders/${orderId}`);
      return response.json();
    });
  }

  async processPayment(payment: PaymentRequest): Promise<PaymentResult> {
    return this.paymentBulkhead.execute(async () => {
      const response = await fetch('http://payment-service/payments', {
        method: 'POST',
        body: JSON.stringify(payment),
      });
      return response.json();
    });
  }

  async checkInventory(productId: string): Promise<InventoryStatus> {
    return this.inventoryBulkhead.execute(async () => {
      const response = await fetch(
        `http://inventory-service/products/${productId}`
      );
      return response.json();
    });
  }
}
```

#### Semaphore Isolation

```typescript
class SemaphoreBulkhead {
  private permits: number;
  private waitingQueue: Array<() => void> = [];

  constructor(private maxPermits: number) {
    this.permits = maxPermits;
  }

  async acquire(timeout: number = 5000): Promise<boolean> {
    if (this.permits > 0) {
      this.permits--;
      return true;
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        const index = this.waitingQueue.indexOf(tryAcquire);
        if (index > -1) {
          this.waitingQueue.splice(index, 1);
        }
        resolve(false);
      }, timeout);

      const tryAcquire = () => {
        clearTimeout(timer);
        resolve(true);
      };

      this.waitingQueue.push(tryAcquire);
    });
  }

  release(): void {
    if (this.waitingQueue.length > 0) {
      const next = this.waitingQueue.shift()!;
      next();
    } else {
      this.permits++;
    }
  }

  async withPermit<T>(fn: () => Promise<T>, timeout?: number): Promise<T> {
    const acquired = await this.acquire(timeout);
    if (!acquired) {
      throw new Error('Failed to acquire permit');
    }

    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// Using semaphore isolation for database connections
class DatabaseService {
  private readSemaphore = new SemaphoreBulkhead(20);
  private writeSemaphore = new SemaphoreBulkhead(10);

  async query<T>(sql: string): Promise<T[]> {
    return this.readSemaphore.withPermit(async () => {
      // Execute read-only query
      return this.db.query(sql);
    });
  }

  async execute(sql: string): Promise<void> {
    return this.writeSemaphore.withPermit(async () => {
      // Execute write operation
      return this.db.execute(sql);
    });
  }
}
```

---

## Strangler Fig Pattern

### Problem Background

Migrating a large monolithic application to microservices architecture is a complex and high-risk process. Rewriting the entire system at once is not only time-consuming but may also cause extended service disruptions.

### Solution

The Strangler Fig pattern allows gradual migration of monolithic application functionality to new microservices while keeping the system continuously running. Old and new systems coexist until all functionality has been migrated.

```
          Phase 1                      Phase 2                      Phase 3
    ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
    │   API Gateway    │      │   API Gateway    │      │   API Gateway    │
    └────────┬─────────┘      └────────┬─────────┘      └────────┬─────────┘
             │                         │                         │
    ┌────────┴─────────┐      ┌────────┴─────────┐      ┌────────┴─────────┐
    │                  │      │        │         │      │                  │
    ▼                  ▼      ▼        ▼         ▼      ▼                  ▼
┌───────┐         ┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐
│ Mono- │         │ Mono- ││ User  ││ Mono- ││ Order ││ User  ││ Order ││Payment│
│ lith  │         │ lith  ││Service││ lith  ││Service││Service││Service││Service│
│ 100%  │         │ 70%   ││ 30%   ││ 40%   ││ 30%   ││  ...  ││  ...  ││  ...  │
└───────┘         └───────┘└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘
```

### Implementation Example

```typescript
// API Gateway routing configuration
interface RouteConfig {
  path: string;
  target: 'legacy' | 'new';
  newServiceUrl?: string;
  legacyUrl: string;
  featureFlag?: string;
}

class StranglerFigRouter {
  private routes: RouteConfig[] = [
    // Already migrated to new service
    {
      path: '/api/users/*',
      target: 'new',
      newServiceUrl: 'http://user-service',
      legacyUrl: 'http://monolith',
    },
    // Migration in progress, using feature flag
    {
      path: '/api/orders/*',
      target: 'new',
      newServiceUrl: 'http://order-service',
      legacyUrl: 'http://monolith',
      featureFlag: 'orders-new-service',
    },
    // Not yet migrated
    {
      path: '/api/payments/*',
      target: 'legacy',
      legacyUrl: 'http://monolith',
    },
  ];

  constructor(
    private featureFlagService: FeatureFlagService,
    private httpClient: HttpClient
  ) {}

  async route(request: Request): Promise<Response> {
    const route = this.findRoute(request.path);

    if (!route) {
      return { status: 404, body: 'Not Found' };
    }

    const targetUrl = await this.resolveTarget(route, request);
    return this.forwardRequest(request, targetUrl);
  }

  private findRoute(path: string): RouteConfig | undefined {
    return this.routes.find(route =>
      this.matchPath(path, route.path)
    );
  }

  private async resolveTarget(
    route: RouteConfig,
    request: Request
  ): Promise<string> {
    // If there's a feature flag, check if it's enabled
    if (route.featureFlag) {
      const isEnabled = await this.featureFlagService.isEnabled(
        route.featureFlag,
        {
          userId: request.userId,
          percentage: 20, // 20% traffic goes to new service
        }
      );

      if (isEnabled && route.newServiceUrl) {
        return route.newServiceUrl;
      }
      return route.legacyUrl;
    }

    // Return URL based on target
    if (route.target === 'new' && route.newServiceUrl) {
      return route.newServiceUrl;
    }
    return route.legacyUrl;
  }

  private async forwardRequest(
    request: Request,
    targetUrl: string
  ): Promise<Response> {
    const url = `${targetUrl}${request.path}`;

    try {
      return await this.httpClient.request({
        method: request.method,
        url,
        headers: request.headers,
        body: request.body,
      });
    } catch (error) {
      // If new service fails, can fall back to old service
      if (targetUrl !== request.legacyUrl) {
        console.warn('New service failed, falling back to legacy');
        return this.forwardRequest(request, request.legacyUrl);
      }
      throw error;
    }
  }

  private matchPath(path: string, pattern: string): boolean {
    const regex = new RegExp(
      '^' + pattern.replace('*', '.*') + '$'
    );
    return regex.test(path);
  }
}

// Data synchronizer - ensures data consistency between old and new systems
class DataSynchronizer {
  constructor(
    private legacyDb: Database,
    private newServiceClient: ServiceClient,
    private eventBus: EventBus
  ) {}

  // Listen for data changes from monolithic application
  @EventHandler('legacy.user.updated')
  async syncUserToNewService(event: UserUpdatedEvent): Promise<void> {
    try {
      await this.newServiceClient.updateUser(event.userId, event.data);
    } catch (error) {
      // Record sync failure for later retry
      await this.eventBus.publish('sync.failed', {
        type: 'user',
        id: event.userId,
        error: error.message,
      });
    }
  }

  // Dual-write strategy - write to both old and new systems
  async createUser(userData: CreateUserDTO): Promise<User> {
    // Write to old system first (primary)
    const legacyUser = await this.legacyDb.users.create(userData);

    // Async write to new system
    this.newServiceClient.createUser(userData).catch(error => {
      console.error('Failed to sync to new service:', error);
    });

    return legacyUser;
  }
}
```

### Migration Strategy

```typescript
// Progressive migration manager
class MigrationManager {
  private migrationPhases: MigrationPhase[] = [
    {
      phase: 1,
      features: ['user-registration', 'user-profile'],
      targetService: 'user-service',
      status: 'completed',
    },
    {
      phase: 2,
      features: ['order-creation', 'order-history'],
      targetService: 'order-service',
      status: 'in-progress',
      trafficPercentage: 50,
    },
    {
      phase: 3,
      features: ['payment-processing'],
      targetService: 'payment-service',
      status: 'planned',
    },
  ];

  async getMigrationStatus(): Promise<MigrationReport> {
    const completed = this.migrationPhases.filter(
      p => p.status === 'completed'
    );
    const inProgress = this.migrationPhases.filter(
      p => p.status === 'in-progress'
    );
    const planned = this.migrationPhases.filter(
      p => p.status === 'planned'
    );

    const totalFeatures = this.migrationPhases.reduce(
      (acc, phase) => acc + phase.features.length,
      0
    );
    const completedFeatures = completed.reduce(
      (acc, phase) => acc + phase.features.length,
      0
    );

    return {
      overallProgress: (completedFeatures / totalFeatures) * 100,
      phases: {
        completed: completed.length,
        inProgress: inProgress.length,
        planned: planned.length,
      },
      currentPhase: inProgress[0] || planned[0],
    };
  }

  async rollbackPhase(phaseId: number): Promise<void> {
    const phase = this.migrationPhases.find(p => p.phase === phaseId);
    if (phase) {
      phase.status = 'rolled-back';
      phase.trafficPercentage = 0;
      // Route all traffic back to old service
      await this.updateRouting(phase.features, 'legacy');
    }
  }
}
```

---

## Sidecar Pattern

### Problem Background

Microservices need to handle many cross-cutting concerns: logging, monitoring, configuration management, service discovery, TLS, etc. If each service implements these features on its own, it leads to significant code duplication and maintenance burden.

### Solution

The Sidecar pattern extracts these common features into an independent process (sidecar), deployed alongside the main service on the same host or container. The sidecar proxies all traffic to and from the main service.

```
                    Pod / Host
    ┌─────────────────────────────────────────┐
    │                                         │
    │  ┌─────────────┐    ┌─────────────┐    │
    │  │             │    │             │    │
    │  │Main Service │◄───►│   Sidecar   │◄───┼──── External Traffic
    │  │(Business    │    │  (Proxy)    │    │
    │  │ Logic)      │    │             │    │
    │  └─────────────┘    └─────────────┘    │
    │         │                  │            │
    │         │                  │            │
    │         ▼                  ▼            │
    │  ┌─────────────────────────────────┐   │
    │  │  Shared Storage / Local Comms   │   │
    │  └─────────────────────────────────┘   │
    │                                         │
    └─────────────────────────────────────────┘
```

### Kubernetes Sidecar Example

```yaml
# Envoy Sidecar Configuration
apiVersion: v1
kind: Pod
metadata:
  name: my-service-pod
  labels:
    app: my-service
spec:
  containers:
    # Main service container
    - name: my-service
      image: my-service:1.0
      ports:
        - containerPort: 8080
      env:
        - name: SERVICE_PORT
          value: "8080"
      resources:
        limits:
          memory: "256Mi"
          cpu: "500m"

    # Envoy Sidecar container
    - name: envoy-sidecar
      image: envoyproxy/envoy:v1.25.0
      ports:
        - containerPort: 9901  # Admin
        - containerPort: 10000 # Ingress
      volumeMounts:
        - name: envoy-config
          mountPath: /etc/envoy
      args:
        - "-c"
        - "/etc/envoy/envoy.yaml"
      resources:
        limits:
          memory: "128Mi"
          cpu: "250m"

  volumes:
    - name: envoy-config
      configMap:
        name: envoy-sidecar-config

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: envoy-sidecar-config
data:
  envoy.yaml: |
    admin:
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 9901

    static_resources:
      listeners:
        - name: ingress_listener
          address:
            socket_address:
              address: 0.0.0.0
              port_value: 10000
          filter_chains:
            - filters:
                - name: envoy.filters.network.http_connection_manager
                  typed_config:
                    "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                    stat_prefix: ingress_http
                    access_log:
                      - name: envoy.access_loggers.stdout
                        typed_config:
                          "@type": type.googleapis.com/envoy.extensions.access_loggers.stream.v3.StdoutAccessLog
                    route_config:
                      name: local_route
                      virtual_hosts:
                        - name: local_service
                          domains: ["*"]
                          routes:
                            - match:
                                prefix: "/"
                              route:
                                cluster: local_service
                    http_filters:
                      # Rate limiting
                      - name: envoy.filters.http.local_ratelimit
                        typed_config:
                          "@type": type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
                          stat_prefix: http_local_rate_limiter
                          token_bucket:
                            max_tokens: 100
                            tokens_per_fill: 100
                            fill_interval: 1s
                      # Routing
                      - name: envoy.filters.http.router
                        typed_config:
                          "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

      clusters:
        - name: local_service
          connect_timeout: 0.25s
          type: STATIC
          lb_policy: ROUND_ROBIN
          load_assignment:
            cluster_name: local_service
            endpoints:
              - lb_endpoints:
                  - endpoint:
                      address:
                        socket_address:
                          address: 127.0.0.1
                          port_value: 8080
```

### Log Collection Sidecar

```yaml
# Fluentd Sidecar for log collection
apiVersion: v1
kind: Pod
metadata:
  name: app-with-logging
spec:
  containers:
    - name: app
      image: my-app:1.0
      volumeMounts:
        - name: app-logs
          mountPath: /var/log/app

    - name: fluentd-sidecar
      image: fluent/fluentd:v1.14
      volumeMounts:
        - name: app-logs
          mountPath: /var/log/app
          readOnly: true
        - name: fluentd-config
          mountPath: /fluentd/etc
      env:
        - name: ELASTICSEARCH_HOST
          value: "elasticsearch.logging.svc.cluster.local"

  volumes:
    - name: app-logs
      emptyDir: {}
    - name: fluentd-config
      configMap:
        name: fluentd-config

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/app/*.log
      pos_file /var/log/app/app.log.pos
      tag app.logs
      <parse>
        @type json
      </parse>
    </source>

    <filter app.logs>
      @type record_transformer
      <record>
        hostname ${hostname}
        service my-app
      </record>
    </filter>

    <match app.logs>
      @type elasticsearch
      host "#{ENV['ELASTICSEARCH_HOST']}"
      port 9200
      index_name app-logs
      <buffer>
        @type file
        path /var/log/fluentd-buffers
        flush_interval 5s
      </buffer>
    </match>
```

---

## Ambassador Pattern

### Problem Background

When services need to connect to external systems (like databases, message queues, third-party APIs), they typically need to handle complex logic like connection pooling, retries, circuit breakers, etc.

### Solution

The Ambassador pattern places a proxy between the service and external resources, handling all the complexity related to external communication.

```
    ┌─────────────────────────────────────────┐
    │                  Pod                    │
    │                                         │
    │  ┌─────────────┐    ┌─────────────┐    │
    │  │             │    │             │    │
    │  │   Service   │───►│  Ambassador │───────────►  External Database
    │  │             │    │   (Proxy)   │    │
    │  └─────────────┘    └─────────────┘    │
    │                           │            │
    │                           └────────────────────►  External API
    │                                         │
    └─────────────────────────────────────────┘
```

### Implementation Example

```typescript
// Ambassador proxy implementation
class DatabaseAmbassador {
  private connectionPool: ConnectionPool;
  private circuitBreaker: CircuitBreaker;
  private retryPolicy: RetryPolicy;
  private metrics: MetricsCollector;

  constructor(config: AmbassadorConfig) {
    this.connectionPool = new ConnectionPool({
      host: config.database.host,
      port: config.database.port,
      maxConnections: config.database.maxConnections,
      minConnections: config.database.minConnections,
      idleTimeout: config.database.idleTimeout,
    });

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      timeout: 30000,
    });

    this.retryPolicy = new RetryPolicy({
      maxRetries: 3,
      backoffMs: 1000,
      maxBackoffMs: 10000,
    });

    this.metrics = new MetricsCollector('database_ambassador');
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    const startTime = Date.now();

    try {
      const result = await this.circuitBreaker.execute(async () => {
        return this.retryPolicy.execute(async () => {
          const connection = await this.connectionPool.acquire();
          try {
            const queryResult = await connection.query(sql, params);
            return queryResult.rows;
          } finally {
            await this.connectionPool.release(connection);
          }
        });
      });

      this.metrics.recordSuccess('query', Date.now() - startTime);
      return result;
    } catch (error) {
      this.metrics.recordFailure('query', error.message);
      throw error;
    }
  }

  async transaction<T>(
    operations: (client: DatabaseClient) => Promise<T>
  ): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      const connection = await this.connectionPool.acquire();

      try {
        await connection.query('BEGIN');
        const result = await operations(connection);
        await connection.query('COMMIT');
        return result;
      } catch (error) {
        await connection.query('ROLLBACK');
        throw error;
      } finally {
        await this.connectionPool.release(connection);
      }
    });
  }

  getMetrics(): AmbassadorMetrics {
    return {
      pool: this.connectionPool.getStats(),
      circuitBreaker: this.circuitBreaker.getMetrics(),
      requests: this.metrics.getSummary(),
    };
  }
}

// Service using Ambassador
class UserRepository {
  constructor(private dbAmbassador: DatabaseAmbassador) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.dbAmbassador.query<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result[0] ? this.mapToUser(result[0]) : null;
  }

  async create(userData: CreateUserDTO): Promise<User> {
    return this.dbAmbassador.transaction(async (client) => {
      // Create user
      const userResult = await client.query(
        'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
        [userData.name, userData.email]
      );

      // Create user settings
      await client.query(
        'INSERT INTO user_settings (user_id) VALUES ($1)',
        [userResult.rows[0].id]
      );

      return this.mapToUser(userResult.rows[0]);
    });
  }

  private mapToUser(row: UserRow): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: new Date(row.created_at),
    };
  }
}
```

### Ambassador Deployment in Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-service
spec:
  template:
    spec:
      containers:
        # Main service
        - name: my-service
          image: my-service:1.0
          env:
            # Service connects to Ambassador via localhost
            - name: DATABASE_URL
              value: "postgres://localhost:5432/mydb"

        # PostgreSQL Ambassador
        - name: pgbouncer-ambassador
          image: edoburu/pgbouncer:1.18.0
          ports:
            - containerPort: 5432
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
            - name: POOL_MODE
              value: "transaction"
            - name: DEFAULT_POOL_SIZE
              value: "20"
            - name: MAX_CLIENT_CONN
              value: "100"
```

---

## Anti-Corruption Layer Pattern

### Problem Background

When integrating with legacy systems or third-party systems, these systems' domain models and interfaces may not match our system. Direct dependency on them can cause our code to be "polluted" by external system designs.

### Solution

The Anti-Corruption Layer creates an adaptation layer between our system and external systems, translating external concepts into our internal domain concepts.

```
    ┌──────────────────────────────────────────────────────┐
    │                     Our System                        │
    │                                                      │
    │  ┌─────────────┐    ┌─────────────────────────────┐ │
    │  │             │    │    Anti-Corruption Layer     │ │
    │  │Domain       │───►│  ┌─────────┐ ┌───────────┐ │ │
    │  │Service      │    │  │ Adapter │ │Translator │ │ │
    │  └─────────────┘    │  └─────────┘ └───────────┘ │ │
    │                     └──────────────┬──────────────┘ │
    └────────────────────────────────────┼────────────────┘
                                         │
                                         ▼
                            ┌─────────────────────────┐
                            │      Legacy System       │
                            │  (Different model and    │
                            │   interface)             │
                            └─────────────────────────┘
```

### Implementation Example

```typescript
// Legacy system data structure (we cannot control)
interface LegacyCustomerRecord {
  CUST_ID: string;
  CUST_NM: string;
  CUST_ADDR_LN1: string;
  CUST_ADDR_LN2: string;
  CUST_CTY: string;
  CUST_ST: string;
  CUST_ZIP: string;
  CUST_TEL: string;
  CUST_STAT_CD: string; // 'A' = Active, 'I' = Inactive, 'S' = Suspended
  CUST_CR_DT: string;   // YYYYMMDD format
  CUST_LST_ORD_AMT: number; // Amount in cents
}

// Our domain model
interface Customer {
  id: string;
  name: string;
  address: Address;
  phone: string;
  status: CustomerStatus;
  createdAt: Date;
  lastOrderAmount: Money;
}

interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
}

enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

interface Money {
  amount: number;
  currency: string;
}

// Anti-Corruption Layer implementation
class CustomerAntiCorruptionLayer {
  private legacyClient: LegacySystemClient;
  private translator: CustomerTranslator;

  constructor(legacyClient: LegacySystemClient) {
    this.legacyClient = legacyClient;
    this.translator = new CustomerTranslator();
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    try {
      // Call legacy system
      const legacyRecord = await this.legacyClient.fetchCustomer(customerId);

      if (!legacyRecord) {
        return null;
      }

      // Translate to our domain model
      return this.translator.translateFromLegacy(legacyRecord);
    } catch (error) {
      // Translate legacy system errors to our exceptions
      if (error.code === 'CUST_NOT_FOUND') {
        return null;
      }
      throw new CustomerServiceError(
        'Failed to fetch customer',
        error
      );
    }
  }

  async updateCustomer(customer: Customer): Promise<void> {
    // Translate to legacy system format
    const legacyRecord = this.translator.translateToLegacy(customer);

    try {
      await this.legacyClient.updateCustomer(legacyRecord);
    } catch (error) {
      throw new CustomerServiceError(
        'Failed to update customer',
        error
      );
    }
  }

  async searchCustomers(criteria: CustomerSearchCriteria): Promise<Customer[]> {
    // Translate our query criteria to legacy system format
    const legacyQuery = this.translator.translateSearchCriteria(criteria);

    const legacyResults = await this.legacyClient.searchCustomers(legacyQuery);

    return legacyResults.map(record =>
      this.translator.translateFromLegacy(record)
    );
  }
}

// Translator
class CustomerTranslator {
  private statusMap: Map<string, CustomerStatus> = new Map([
    ['A', CustomerStatus.ACTIVE],
    ['I', CustomerStatus.INACTIVE],
    ['S', CustomerStatus.SUSPENDED],
  ]);

  private reverseStatusMap: Map<CustomerStatus, string> = new Map([
    [CustomerStatus.ACTIVE, 'A'],
    [CustomerStatus.INACTIVE, 'I'],
    [CustomerStatus.SUSPENDED, 'S'],
  ]);

  translateFromLegacy(legacy: LegacyCustomerRecord): Customer {
    return {
      id: legacy.CUST_ID,
      name: legacy.CUST_NM.trim(),
      address: {
        line1: legacy.CUST_ADDR_LN1.trim(),
        line2: legacy.CUST_ADDR_LN2?.trim() || undefined,
        city: legacy.CUST_CTY.trim(),
        state: legacy.CUST_ST.trim(),
        zipCode: legacy.CUST_ZIP.trim(),
      },
      phone: this.formatPhone(legacy.CUST_TEL),
      status: this.statusMap.get(legacy.CUST_STAT_CD) || CustomerStatus.INACTIVE,
      createdAt: this.parseDate(legacy.CUST_CR_DT),
      lastOrderAmount: {
        amount: legacy.CUST_LST_ORD_AMT / 100, // Cents to dollars/yuan
        currency: 'CNY',
      },
    };
  }

  translateToLegacy(customer: Customer): LegacyCustomerRecord {
    return {
      CUST_ID: customer.id,
      CUST_NM: customer.name.padEnd(50),
      CUST_ADDR_LN1: customer.address.line1.padEnd(100),
      CUST_ADDR_LN2: (customer.address.line2 || '').padEnd(100),
      CUST_CTY: customer.address.city.padEnd(50),
      CUST_ST: customer.address.state.padEnd(2),
      CUST_ZIP: customer.address.zipCode.padEnd(10),
      CUST_TEL: this.unformatPhone(customer.phone),
      CUST_STAT_CD: this.reverseStatusMap.get(customer.status) || 'I',
      CUST_CR_DT: this.formatDate(customer.createdAt),
      CUST_LST_ORD_AMT: Math.round(customer.lastOrderAmount.amount * 100),
    };
  }

  translateSearchCriteria(criteria: CustomerSearchCriteria): LegacySearchQuery {
    const query: LegacySearchQuery = {};

    if (criteria.name) {
      query.CUST_NM_LIKE = `%${criteria.name}%`;
    }
    if (criteria.status) {
      query.CUST_STAT_CD = this.reverseStatusMap.get(criteria.status);
    }
    if (criteria.city) {
      query.CUST_CTY = criteria.city;
    }

    return query;
  }

  private parseDate(dateStr: string): Date {
    // YYYYMMDD -> Date
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  private formatPhone(phone: string): string {
    // Format "1234567890" to "+86 123-4567-890"
    if (phone.length === 11) {
      return `+86 ${phone.substring(0, 3)}-${phone.substring(3, 7)}-${phone.substring(7)}`;
    }
    return phone;
  }

  private unformatPhone(phone: string): string {
    return phone.replace(/[\s\-\+86]/g, '');
  }
}

// Domain service using Anti-Corruption Layer
class CustomerService {
  constructor(private acl: CustomerAntiCorruptionLayer) {}

  async getCustomerProfile(customerId: string): Promise<CustomerProfile> {
    const customer = await this.acl.getCustomer(customerId);

    if (!customer) {
      throw new CustomerNotFoundError(customerId);
    }

    // Use clean domain model for business logic
    return {
      ...customer,
      isVIP: customer.lastOrderAmount.amount > 10000,
      canOrder: customer.status === CustomerStatus.ACTIVE,
    };
  }
}
```

---

## Database per Service

### Problem Background

In microservices architecture, if multiple services share the same database, it leads to tight coupling between services, making independent deployment and scaling difficult.

### Solution

Each microservice owns its own private database. Services exchange data through APIs or events rather than directly accessing other services' databases.

```
    ┌─────────────────────────────────────────────────────────────┐
    │                                                             │
    │    ┌──────────┐     ┌──────────┐     ┌──────────┐         │
    │    │  User    │     │  Order   │     │ Product  │         │
    │    │ Service  │     │ Service  │     │ Service  │         │
    │    └────┬─────┘     └────┬─────┘     └────┬─────┘         │
    │         │                │                │               │
    │         ▼                ▼                ▼               │
    │    ┌──────────┐     ┌──────────┐     ┌──────────┐         │
    │    │PostgreSQL│     │  MongoDB │     │   MySQL  │         │
    │    │ User DB  │     │ Order DB │     │Product DB│         │
    │    └──────────┘     └──────────┘     └──────────┘         │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
```

### Data Consistency Strategy

```typescript
// Using event-driven approach to maintain data consistency
// Order Service
class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private eventBus: EventBus
  ) {}

  async createOrder(orderData: CreateOrderDTO): Promise<Order> {
    // 1. Validate products exist (via API call to Product Service)
    const products = await this.validateProducts(orderData.items);

    // 2. Create order
    const order = await this.orderRepository.create({
      userId: orderData.userId,
      items: products.map(p => ({
        productId: p.id,
        name: p.name,        // Redundantly store product name
        price: p.price,      // Redundantly store price (snapshot at order time)
        quantity: orderData.items.find(i => i.productId === p.id)!.quantity,
      })),
      status: OrderStatus.PENDING,
      createdAt: new Date(),
    });

    // 3. Publish order created event
    await this.eventBus.publish('order.created', {
      orderId: order.id,
      userId: order.userId,
      items: order.items,
      totalAmount: order.totalAmount,
    });

    return order;
  }

  private async validateProducts(items: OrderItem[]): Promise<Product[]> {
    const productIds = items.map(i => i.productId);
    const response = await fetch(
      `http://product-service/products?ids=${productIds.join(',')}`
    );

    if (!response.ok) {
      throw new Error('Failed to validate products');
    }

    return response.json();
  }
}

// Product Service - Listens for order events to update sales count
class ProductEventHandler {
  constructor(private productRepository: ProductRepository) {}

  @EventHandler('order.created')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    for (const item of event.items) {
      await this.productRepository.incrementSalesCount(
        item.productId,
        item.quantity
      );
    }
  }

  @EventHandler('order.cancelled')
  async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    for (const item of event.items) {
      await this.productRepository.decrementSalesCount(
        item.productId,
        item.quantity
      );
    }
  }
}

// User Service - Listens for order events to update statistics
class UserEventHandler {
  constructor(private userRepository: UserRepository) {}

  @EventHandler('order.created')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.userRepository.updateOrderStats(event.userId, {
      $inc: {
        totalOrders: 1,
        totalSpent: event.totalAmount,
      },
      $set: {
        lastOrderAt: new Date(),
      },
    });
  }
}
```

### Querying Cross-Service Data

```typescript
// API Composition Pattern - Compose data at the API Gateway layer
class OrderQueryService {
  constructor(
    private orderRepository: OrderRepository,
    private userServiceClient: UserServiceClient,
    private productServiceClient: ProductServiceClient
  ) {}

  async getOrderDetails(orderId: string): Promise<OrderDetailsDTO> {
    // Get order basic information
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    // Fetch related data in parallel
    const [user, products] = await Promise.all([
      this.userServiceClient.getUser(order.userId),
      this.productServiceClient.getProducts(
        order.items.map(i => i.productId)
      ),
    ]);

    // Compose and return
    return {
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      items: order.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          currentProduct: product ? {
            currentPrice: product.price,
            inStock: product.stockQuantity > 0,
          } : null,
        };
      }),
      totalAmount: order.totalAmount,
    };
  }
}

// CQRS Read Model - Maintain pre-aggregated query views
class OrderReadModelUpdater {
  constructor(private readModelRepository: ReadModelRepository) {}

  @EventHandler('order.created')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // Also fetch user info to create read model
    const user = await this.userServiceClient.getUser(event.userId);

    await this.readModelRepository.upsert('order-details', event.orderId, {
      orderId: event.orderId,
      userId: event.userId,
      userName: user.name,
      userEmail: user.email,
      items: event.items,
      totalAmount: event.totalAmount,
      status: 'PENDING',
      createdAt: new Date(),
    });
  }

  @EventHandler('user.updated')
  async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    // Update read model for all orders belonging to this user
    await this.readModelRepository.updateMany(
      'order-details',
      { userId: event.userId },
      {
        userName: event.name,
        userEmail: event.email,
      }
    );
  }
}
```

---

## Event-Driven Pattern

### Problem Background

Synchronous communication between microservices leads to service coupling and performance bottlenecks. The problem becomes more pronounced when one service needs to notify multiple other services.

### Solution

Use event-driven architecture where services communicate by publishing and subscribing to events, achieving loose coupling and high scalability.

### Event Types

```typescript
// 1. Domain Event - Represents something that happened in the business
interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  payload: unknown;
  metadata: EventMetadata;
}

// 2. Integration Event - For inter-service communication
interface IntegrationEvent extends DomainEvent {
  sourceService: string;
  version: string;
}

// 3. Command Event - Requests execution of an operation
interface CommandEvent {
  commandId: string;
  commandType: string;
  targetService: string;
  payload: unknown;
  replyTo?: string;
}

// Event definition example
class OrderCreatedEvent implements IntegrationEvent {
  readonly eventType = 'order.created';
  readonly aggregateType = 'Order';
  readonly sourceService = 'order-service';
  readonly version = '1.0';

  constructor(
    public readonly eventId: string,
    public readonly aggregateId: string,
    public readonly occurredAt: Date,
    public readonly payload: {
      customerId: string;
      items: Array<{
        productId: string;
        quantity: number;
        price: number;
      }>;
      totalAmount: number;
      shippingAddress: Address;
    },
    public readonly metadata: EventMetadata
  ) {}
}
```

### Event Bus Implementation

```typescript
// Event bus using RabbitMQ
import amqp from 'amqplib';

class RabbitMQEventBus implements EventBus {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private handlers: Map<string, EventHandler[]> = new Map();

  async connect(url: string): Promise<void> {
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();

    // Create exchange
    await this.channel.assertExchange('events', 'topic', {
      durable: true,
    });

    // Create dead letter exchange
    await this.channel.assertExchange('events.dlx', 'topic', {
      durable: true,
    });
  }

  async publish(event: IntegrationEvent): Promise<void> {
    const message = JSON.stringify({
      ...event,
      publishedAt: new Date().toISOString(),
    });

    this.channel.publish(
      'events',
      event.eventType,
      Buffer.from(message),
      {
        persistent: true,
        messageId: event.eventId,
        contentType: 'application/json',
        headers: {
          'x-source-service': event.sourceService,
          'x-event-version': event.version,
        },
      }
    );
  }

  async subscribe(
    eventType: string,
    handler: EventHandler,
    options: SubscriptionOptions = {}
  ): Promise<void> {
    const queueName = `${options.serviceName || 'default'}.${eventType}`;

    // Create queue
    await this.channel.assertQueue(queueName, {
      durable: true,
      deadLetterExchange: 'events.dlx',
      deadLetterRoutingKey: `${queueName}.dlq`,
    });

    // Bind to exchange
    await this.channel.bindQueue(queueName, 'events', eventType);

    // Set up consumer
    await this.channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        await handler(event);
        this.channel.ack(msg);
      } catch (error) {
        console.error(`Error processing event: ${error.message}`);

        // Check retry count
        const retryCount = (msg.properties.headers?.['x-retry-count'] || 0);

        if (retryCount < (options.maxRetries || 3)) {
          // Re-queue with increased retry count
          this.channel.nack(msg, false, false);
          await this.republishWithRetry(msg, retryCount + 1);
        } else {
          // Send to dead letter queue
          this.channel.nack(msg, false, false);
        }
      }
    });
  }

  private async republishWithRetry(
    originalMsg: amqp.ConsumeMessage,
    retryCount: number
  ): Promise<void> {
    await new Promise(resolve =>
      setTimeout(resolve, Math.pow(2, retryCount) * 1000)
    );

    this.channel.publish(
      'events',
      originalMsg.fields.routingKey,
      originalMsg.content,
      {
        ...originalMsg.properties,
        headers: {
          ...originalMsg.properties.headers,
          'x-retry-count': retryCount,
        },
      }
    );
  }
}

// Event processor example
class OrderEventProcessor {
  constructor(
    private eventBus: EventBus,
    private inventoryService: InventoryService,
    private notificationService: NotificationService
  ) {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    this.eventBus.subscribe(
      'order.created',
      this.handleOrderCreated.bind(this),
      { serviceName: 'inventory-service', maxRetries: 3 }
    );

    this.eventBus.subscribe(
      'order.shipped',
      this.handleOrderShipped.bind(this),
      { serviceName: 'notification-service', maxRetries: 5 }
    );
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // Process order created event
    await this.inventoryService.reserveStock(event.payload.items);

    // Publish stock reserved event
    await this.eventBus.publish(new StockReservedEvent(event.aggregateId));
  }

  private async handleOrderShipped(event: OrderShippedEvent): Promise<void> {
    // Send shipping notification
    await this.notificationService.sendShipmentNotification({
      orderId: event.aggregateId,
      customerId: event.payload.customerId,
      trackingNumber: event.payload.trackingNumber,
    });
  }
}
```

### Event Sourcing

```typescript
// Event Store
interface EventStore {
  append(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
  read(streamId: string, fromVersion?: number): Promise<DomainEvent[]>;
  subscribe(streamId: string, handler: EventHandler): Promise<void>;
}

// Aggregate Root base class
abstract class AggregateRoot {
  private uncommittedEvents: DomainEvent[] = [];
  protected version: number = 0;

  protected apply(event: DomainEvent): void {
    this.when(event);
    this.version++;
    this.uncommittedEvents.push(event);
  }

  protected abstract when(event: DomainEvent): void;

  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.when(event);
      this.version++;
    }
  }
}

// Order Aggregate
class Order extends AggregateRoot {
  private id: string;
  private customerId: string;
  private items: OrderItem[] = [];
  private status: OrderStatus;
  private totalAmount: number;

  static create(command: CreateOrderCommand): Order {
    const order = new Order();
    order.apply(new OrderCreatedEvent(
      generateUUID(),
      command.orderId,
      new Date(),
      {
        customerId: command.customerId,
        items: command.items,
        totalAmount: command.totalAmount,
        shippingAddress: command.shippingAddress,
      },
      { correlationId: command.correlationId }
    ));
    return order;
  }

  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStateError('Order must be pending to confirm');
    }

    this.apply(new OrderConfirmedEvent(
      generateUUID(),
      this.id,
      new Date(),
      { confirmedAt: new Date() },
      {}
    ));
  }

  ship(trackingNumber: string): void {
    if (this.status !== OrderStatus.CONFIRMED) {
      throw new InvalidOrderStateError('Order must be confirmed to ship');
    }

    this.apply(new OrderShippedEvent(
      generateUUID(),
      this.id,
      new Date(),
      { trackingNumber, shippedAt: new Date() },
      {}
    ));
  }

  cancel(reason: string): void {
    if (this.status === OrderStatus.SHIPPED) {
      throw new InvalidOrderStateError('Cannot cancel shipped order');
    }

    this.apply(new OrderCancelledEvent(
      generateUUID(),
      this.id,
      new Date(),
      { reason, cancelledAt: new Date() },
      {}
    ));
  }

  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'order.created':
        this.id = event.aggregateId;
        this.customerId = (event as OrderCreatedEvent).payload.customerId;
        this.items = (event as OrderCreatedEvent).payload.items;
        this.totalAmount = (event as OrderCreatedEvent).payload.totalAmount;
        this.status = OrderStatus.PENDING;
        break;

      case 'order.confirmed':
        this.status = OrderStatus.CONFIRMED;
        break;

      case 'order.shipped':
        this.status = OrderStatus.SHIPPED;
        break;

      case 'order.cancelled':
        this.status = OrderStatus.CANCELLED;
        break;
    }
  }
}

// Repository implementation
class EventSourcedOrderRepository {
  constructor(private eventStore: EventStore) {}

  async save(order: Order): Promise<void> {
    const events = order.getUncommittedEvents();

    if (events.length > 0) {
      await this.eventStore.append(
        `order-${order.id}`,
        events,
        order.version - events.length
      );
      order.clearUncommittedEvents();
    }
  }

  async getById(orderId: string): Promise<Order | null> {
    const events = await this.eventStore.read(`order-${orderId}`);

    if (events.length === 0) {
      return null;
    }

    const order = new Order();
    order.loadFromHistory(events);
    return order;
  }
}
```

---

## CQRS Pattern

### Problem Background

In complex business systems, read and write operations often have very different requirements. Write operations need to validate business rules and ensure data consistency; while read operations need high performance and flexible query capabilities.

### Solution

CQRS (Command Query Responsibility Segregation) separates read and write operations into different models:

- **Command Model (Write Model)**: Handles create, update, delete operations
- **Query Model (Read Model)**: Optimizes query operations

```
                    ┌──────────────────┐
                    │      Client      │
                    └────────┬─────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                  │
            ▼                                  ▼
    ┌───────────────┐                 ┌───────────────┐
    │Command (Write)│                 │ Query (Read)  │
    └───────┬───────┘                 └───────┬───────┘
            │                                  │
            ▼                                  ▼
    ┌───────────────┐                 ┌───────────────┐
    │   Command     │                 │    Query      │
    │   Handler     │                 │   Handler     │
    └───────┬───────┘                 └───────┬───────┘
            │                                  │
            ▼                                  ▼
    ┌───────────────┐    Event Sync   ┌───────────────┐
    │ Write Database│ ────────────► │ Read Database │
    │(Normalized    │                │(Denormalized  │
    │ Model)        │                │ Views)        │
    └───────────────┘                 └───────────────┘
```

### Implementation Example

```typescript
// Command definitions
interface Command {
  commandId: string;
  timestamp: Date;
}

class CreateOrderCommand implements Command {
  commandId: string = generateUUID();
  timestamp: Date = new Date();

  constructor(
    public readonly customerId: string,
    public readonly items: OrderItemDTO[],
    public readonly shippingAddress: Address
  ) {}
}

class UpdateOrderStatusCommand implements Command {
  commandId: string = generateUUID();
  timestamp: Date = new Date();

  constructor(
    public readonly orderId: string,
    public readonly newStatus: OrderStatus
  ) {}
}

// Command Handler
class OrderCommandHandler {
  constructor(
    private orderRepository: OrderRepository,
    private eventBus: EventBus
  ) {}

  async handle(command: CreateOrderCommand): Promise<string> {
    // Validate business rules
    await this.validateCustomerCanOrder(command.customerId);
    await this.validateItemsAvailable(command.items);

    // Create order
    const order = Order.create({
      orderId: generateUUID(),
      customerId: command.customerId,
      items: command.items,
      shippingAddress: command.shippingAddress,
      totalAmount: this.calculateTotal(command.items),
      correlationId: command.commandId,
    });

    // Save to write store
    await this.orderRepository.save(order);

    // Publish events to update read model
    for (const event of order.getUncommittedEvents()) {
      await this.eventBus.publish(event);
    }

    return order.id;
  }

  async handleStatusUpdate(command: UpdateOrderStatusCommand): Promise<void> {
    const order = await this.orderRepository.getById(command.orderId);

    if (!order) {
      throw new OrderNotFoundError(command.orderId);
    }

    // Call appropriate method based on new status
    switch (command.newStatus) {
      case OrderStatus.CONFIRMED:
        order.confirm();
        break;
      case OrderStatus.SHIPPED:
        order.ship(command.trackingNumber);
        break;
      case OrderStatus.CANCELLED:
        order.cancel(command.reason);
        break;
    }

    await this.orderRepository.save(order);

    for (const event of order.getUncommittedEvents()) {
      await this.eventBus.publish(event);
    }
  }

  private calculateTotal(items: OrderItemDTO[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  private async validateCustomerCanOrder(customerId: string): Promise<void> {
    // Validate customer account status, etc.
  }

  private async validateItemsAvailable(items: OrderItemDTO[]): Promise<void> {
    // Validate product inventory, etc.
  }
}

// Query definitions
interface Query {
  queryId: string;
}

class GetOrderDetailsQuery implements Query {
  queryId: string = generateUUID();

  constructor(public readonly orderId: string) {}
}

class GetCustomerOrdersQuery implements Query {
  queryId: string = generateUUID();

  constructor(
    public readonly customerId: string,
    public readonly page: number = 1,
    public readonly pageSize: number = 20,
    public readonly status?: OrderStatus
  ) {}
}

// Read Model
interface OrderReadModel {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    imageUrl: string;
  }>;
  status: string;
  statusHistory: Array<{
    status: string;
    changedAt: Date;
    note?: string;
  }>;
  shippingAddress: Address;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Query Handler
class OrderQueryHandler {
  constructor(private readModelRepository: ReadModelRepository) {}

  async handle(query: GetOrderDetailsQuery): Promise<OrderReadModel | null> {
    return this.readModelRepository.findById('orders', query.orderId);
  }

  async handleCustomerOrders(
    query: GetCustomerOrdersQuery
  ): Promise<PaginatedResult<OrderReadModel>> {
    const filter: any = { customerId: query.customerId };

    if (query.status) {
      filter.status = query.status;
    }

    const [orders, total] = await Promise.all([
      this.readModelRepository.find('orders', filter, {
        skip: (query.page - 1) * query.pageSize,
        limit: query.pageSize,
        sort: { createdAt: -1 },
      }),
      this.readModelRepository.count('orders', filter),
    ]);

    return {
      data: orders,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }
}

// Read Model Updater - Listens for events to update read model
class OrderReadModelUpdater {
  constructor(
    private readModelRepository: ReadModelRepository,
    private customerClient: CustomerServiceClient,
    private productClient: ProductServiceClient
  ) {}

  @EventHandler('order.created')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // Get customer information
    const customer = await this.customerClient.getCustomer(
      event.payload.customerId
    );

    // Get product details
    const products = await this.productClient.getProducts(
      event.payload.items.map(i => i.productId)
    );

    // Create read model
    const readModel: OrderReadModel = {
      id: event.aggregateId,
      customerId: event.payload.customerId,
      customerName: customer.name,
      customerEmail: customer.email,
      items: event.payload.items.map(item => {
        const product = products.find(p => p.id === item.productId)!;
        return {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          price: item.price,
          imageUrl: product.imageUrl,
        };
      }),
      status: 'PENDING',
      statusHistory: [
        { status: 'PENDING', changedAt: event.occurredAt },
      ],
      shippingAddress: event.payload.shippingAddress,
      totalAmount: event.payload.totalAmount,
      createdAt: event.occurredAt,
      updatedAt: event.occurredAt,
    };

    await this.readModelRepository.upsert('orders', event.aggregateId, readModel);
  }

  @EventHandler('order.confirmed')
  async handleOrderConfirmed(event: OrderConfirmedEvent): Promise<void> {
    await this.readModelRepository.update('orders', event.aggregateId, {
      status: 'CONFIRMED',
      $push: {
        statusHistory: {
          status: 'CONFIRMED',
          changedAt: event.payload.confirmedAt,
        },
      },
      updatedAt: event.occurredAt,
    });
  }

  @EventHandler('order.shipped')
  async handleOrderShipped(event: OrderShippedEvent): Promise<void> {
    await this.readModelRepository.update('orders', event.aggregateId, {
      status: 'SHIPPED',
      trackingNumber: event.payload.trackingNumber,
      $push: {
        statusHistory: {
          status: 'SHIPPED',
          changedAt: event.payload.shippedAt,
          note: `Tracking: ${event.payload.trackingNumber}`,
        },
      },
      updatedAt: event.occurredAt,
    });
  }

  @EventHandler('customer.updated')
  async handleCustomerUpdated(event: CustomerUpdatedEvent): Promise<void> {
    // Update customer info for all orders belonging to this customer
    await this.readModelRepository.updateMany(
      'orders',
      { customerId: event.aggregateId },
      {
        customerName: event.payload.name,
        customerEmail: event.payload.email,
      }
    );
  }
}

// API Controller
@Controller('/orders')
class OrderController {
  constructor(
    private commandHandler: OrderCommandHandler,
    private queryHandler: OrderQueryHandler
  ) {}

  @Post('/')
  async createOrder(@Body() body: CreateOrderDTO): Promise<{ orderId: string }> {
    const command = new CreateOrderCommand(
      body.customerId,
      body.items,
      body.shippingAddress
    );

    const orderId = await this.commandHandler.handle(command);
    return { orderId };
  }

  @Get('/:id')
  async getOrder(@Param('id') id: string): Promise<OrderReadModel> {
    const query = new GetOrderDetailsQuery(id);
    const order = await this.queryHandler.handle(query);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  @Get('/customer/:customerId')
  async getCustomerOrders(
    @Param('customerId') customerId: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('status') status?: OrderStatus
  ): Promise<PaginatedResult<OrderReadModel>> {
    const query = new GetCustomerOrdersQuery(customerId, page, pageSize, status);
    return this.queryHandler.handleCustomerOrders(query);
  }
}
```

---

## Pattern Selection Guide

| Pattern | Use Case | Main Benefits |
|---------|----------|---------------|
| Saga | Cross-service business transactions | Eventual data consistency |
| Circuit Breaker | Inter-service calls | Fault isolation, fail fast |
| Bulkhead | Resource-intensive operations | Resource isolation, prevent cascading failures |
| Strangler Fig | Monolith to microservices migration | Progressive migration, reduced risk |
| Sidecar | Cross-cutting concerns | Separation of concerns, reusability |
| Ambassador | External system connections | Connection management, retry strategies |
| Anti-Corruption Layer | Legacy/third-party system integration | Domain model isolation |
| Database per Service | High service independence requirements | Service decoupling, technology diversity |
| Event-Driven | Loose coupling, high scalability needs | Async communication, scalability |
| CQRS | Complex query requirements | Read/write performance optimization |

## Summary

Microservices design patterns are effective tools for addressing the complexity of distributed systems. In practice, these patterns often need to be used in combination:

1. **Infrastructure Layer**: Sidecar + Ambassador patterns handle cross-cutting concerns
2. **Service Communication Layer**: Circuit Breaker + Bulkhead ensure system resilience
3. **Data Consistency Layer**: Saga + Event-Driven ensure eventual consistency
4. **Query Optimization Layer**: CQRS + Database per Service optimize read/write performance
5. **System Evolution Layer**: Strangler Fig + Anti-Corruption Layer support progressive migration

Choosing the right patterns requires consideration of specific business requirements, team capabilities, and system constraints. No single pattern is universal; the key is to understand the trade-offs of each pattern and use them in the right scenarios.

## Further Reading

- [Building Microservices](https://www.oreilly.com/library/view/building-microservices-2nd/9781492034018/) - Sam Newman
- [Microservices Patterns](https://microservices.io/patterns/) - Chris Richardson
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/) - Eric Evans
- [Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/) - Gregor Hohpe
