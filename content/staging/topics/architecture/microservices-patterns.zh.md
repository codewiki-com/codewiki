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
origin: old/src/content/docs/backend/microservices-patterns.zh.md
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

微服务架构将复杂的单体应用拆分为多个独立的服务,每个服务专注于特定的业务功能。然而,这种架构也带来了新的挑战:服务间通信、数据一致性、故障隔离等。本文将深入探讨微服务架构中的核心设计模式,帮助您构建健壮、可扩展的分布式系统。

---

## Saga 模式

### 问题背景

在微服务架构中,一个业务操作可能需要跨越多个服务。传统的分布式事务(如两阶段提交)在微服务环境中难以实现,因为每个服务都有自己的数据库,且服务之间通过网络通信。

### 解决方案

Saga 模式将一个分布式事务拆分为一系列本地事务,每个本地事务更新单个服务的数据库。如果某个步骤失败,Saga 会执行补偿事务来撤销之前的更改。

### Saga 的两种实现方式

#### 编排式 Saga (Choreography)

每个服务发布事件,其他服务监听并响应这些事件。

```typescript
// 订单服务 - 发布订单创建事件
class OrderService {
  private eventBus: EventBus;
  private orderRepository: OrderRepository;

  async createOrder(orderData: CreateOrderDTO): Promise<Order> {
    // 创建订单(待确认状态)
    const order = await this.orderRepository.create({
      ...orderData,
      status: OrderStatus.PENDING,
    });

    // 发布订单创建事件
    await this.eventBus.publish('order.created', {
      orderId: order.id,
      customerId: order.customerId,
      amount: order.totalAmount,
      items: order.items,
    });

    return order;
  }

  // 监听库存预留失败事件
  @EventHandler('inventory.reservation.failed')
  async handleInventoryFailed(event: InventoryFailedEvent): Promise<void> {
    // 补偿操作:取消订单
    await this.orderRepository.updateStatus(
      event.orderId,
      OrderStatus.CANCELLED
    );

    // 发布订单取消事件
    await this.eventBus.publish('order.cancelled', {
      orderId: event.orderId,
      reason: 'Inventory reservation failed',
    });
  }

  // 监听支付失败事件
  @EventHandler('payment.failed')
  async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
    await this.orderRepository.updateStatus(
      event.orderId,
      OrderStatus.CANCELLED
    );
  }

  // 监听支付成功事件
  @EventHandler('payment.completed')
  async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    await this.orderRepository.updateStatus(
      event.orderId,
      OrderStatus.CONFIRMED
    );
  }
}

// 库存服务 - 监听订单创建事件
class InventoryService {
  private eventBus: EventBus;
  private inventoryRepository: InventoryRepository;

  @EventHandler('order.created')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      // 预留库存
      for (const item of event.items) {
        await this.inventoryRepository.reserve(item.productId, item.quantity);
      }

      // 发布库存预留成功事件
      await this.eventBus.publish('inventory.reserved', {
        orderId: event.orderId,
        items: event.items,
      });
    } catch (error) {
      // 发布库存预留失败事件
      await this.eventBus.publish('inventory.reservation.failed', {
        orderId: event.orderId,
        reason: error.message,
      });
    }
  }

  // 监听订单取消事件 - 补偿操作
  @EventHandler('order.cancelled')
  async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    // 释放已预留的库存
    await this.inventoryRepository.releaseReservation(event.orderId);
  }
}

// 支付服务 - 监听库存预留成功事件
class PaymentService {
  private eventBus: EventBus;
  private paymentGateway: PaymentGateway;

  @EventHandler('inventory.reserved')
  async handleInventoryReserved(event: InventoryReservedEvent): Promise<void> {
    try {
      // 处理支付
      const payment = await this.paymentGateway.charge({
        orderId: event.orderId,
        amount: event.amount,
      });

      // 发布支付成功事件
      await this.eventBus.publish('payment.completed', {
        orderId: event.orderId,
        paymentId: payment.id,
      });
    } catch (error) {
      // 发布支付失败事件
      await this.eventBus.publish('payment.failed', {
        orderId: event.orderId,
        reason: error.message,
      });
    }
  }
}
```

#### 协调式 Saga (Orchestration)

使用一个 Saga 协调器来集中管理事务流程。

```typescript
// Saga 协调器
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
      // 步骤 1: 创建订单
      const order = await this.orderService.createOrder(orderData);
      sagaLog.push({ step: 'CREATE_ORDER', status: 'COMPLETED', data: order });

      // 步骤 2: 预留库存
      const reservation = await this.inventoryService.reserveInventory({
        orderId: order.id,
        items: orderData.items,
      });
      sagaLog.push({
        step: 'RESERVE_INVENTORY',
        status: 'COMPLETED',
        data: reservation
      });

      // 步骤 3: 处理支付
      const payment = await this.paymentService.processPayment({
        orderId: order.id,
        amount: order.totalAmount,
        customerId: orderData.customerId,
      });
      sagaLog.push({ step: 'PROCESS_PAYMENT', status: 'COMPLETED', data: payment });

      // 步骤 4: 确认订单
      await this.orderService.confirmOrder(order.id);
      sagaLog.push({ step: 'CONFIRM_ORDER', status: 'COMPLETED' });

      // 保存成功的 Saga 日志
      await this.sagaRepository.save({
        sagaId,
        status: 'COMPLETED',
        steps: sagaLog,
      });

      return { success: true, orderId: order.id };
    } catch (error) {
      // 执行补偿操作
      await this.compensate(sagaLog);

      // 保存失败的 Saga 日志
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
    // 按相反顺序执行补偿操作
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
        // 记录补偿失败,可能需要人工介入
        console.error(`Compensation failed for step ${step.step}:`, compensationError);
      }
    }
  }
}

// 使用示例
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

### Saga 模式对比

| 特性 | 编排式 (Choreography) | 协调式 (Orchestration) |
|------|----------------------|----------------------|
| 耦合度 | 低,服务间松耦合 | 中,依赖协调器 |
| 复杂度 | 分散在各服务中 | 集中在协调器中 |
| 可见性 | 难以追踪整体流程 | 流程清晰可见 |
| 单点故障 | 无 | 协调器可能成为瓶颈 |
| 适用场景 | 简单流程,少量服务 | 复杂流程,多个服务 |

---

## 断路器模式 (Circuit Breaker)

### 问题背景

在分布式系统中,服务之间的调用可能因为网络问题、下游服务故障等原因失败。如果不加以控制,失败的请求会持续重试,消耗系统资源,甚至导致级联故障。

### 解决方案

断路器模式模仿电路断路器的工作原理,在检测到持续的失败后"断开"电路,阻止进一步的请求,给下游服务恢复的时间。

### 断路器状态

```
     ┌─────────────────┐
     │     CLOSED      │ ─── 正常状态,请求正常通过
     └────────┬────────┘
              │ 失败次数达到阈值
              ▼
     ┌─────────────────┐
     │      OPEN       │ ─── 断开状态,请求直接失败
     └────────┬────────┘
              │ 等待超时后
              ▼
     ┌─────────────────┐
     │   HALF-OPEN     │ ─── 半开状态,允许少量请求测试
     └────────┬────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
  成功               失败
    │                   │
    ▼                   ▼
  CLOSED              OPEN
```

### 实现示例

```typescript
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitBreakerConfig {
  failureThreshold: number;      // 失败阈值
  successThreshold: number;      // 半开状态成功阈值
  timeout: number;               // 断路器打开持续时间 (ms)
  requestTimeout: number;        // 单次请求超时时间 (ms)
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private nextAttempt: number = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // 检查断路器状态
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new CircuitOpenError('Circuit breaker is OPEN');
      }
      // 超时后转为半开状态
      this.state = CircuitState.HALF_OPEN;
      console.log('Circuit breaker transitioning to HALF_OPEN');
    }

    try {
      // 使用超时包装请求
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

// 带降级策略的断路器装饰器
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

// 使用示例
class ProductService {
  private inventoryCircuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000,
    requestTimeout: 5000,
  });

  @withCircuitBreaker(
    this.inventoryCircuitBreaker,
    () => ({ available: false, cached: true }) // 降级响应
  )
  async checkInventory(productId: string): Promise<InventoryStatus> {
    const response = await fetch(
      `http://inventory-service/products/${productId}/stock`
    );
    return response.json();
  }
}
```

### 使用 Resilience4j (Java)

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
            // 降级逻辑
            log.warn("Circuit breaker fallback for product: {}", productId);
            return InventoryResponse.unavailable();
        }).get();
    }
}
```

---

## 舱壁模式 (Bulkhead)

### 问题背景

在微服务系统中,如果一个服务的故障导致资源(如线程池、连接池)被耗尽,可能会影响到其他正常的服务调用,造成级联故障。

### 解决方案

舱壁模式借鉴了船舶设计中的概念——船体被分割成多个水密隔舱,即使一个隔舱进水,也不会影响其他隔舱。在微服务中,我们为不同的服务调用分配独立的资源池。

### 实现方式

#### 线程池隔离

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
    // 检查是否有可用容量
    if (this.activeCount < this.config.maxConcurrent) {
      return this.runTask(task);
    }

    // 检查等待队列是否已满
    if (this.waitingQueue.length >= this.config.maxWait) {
      throw new BulkheadFullError(
        `Bulkhead '${this.config.name}' is full`
      );
    }

    // 加入等待队列
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

// 为不同服务创建独立的舱壁
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

#### 信号量隔离

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

// 使用信号量隔离数据库连接
class DatabaseService {
  private readSemaphore = new SemaphoreBulkhead(20);
  private writeSemaphore = new SemaphoreBulkhead(10);

  async query<T>(sql: string): Promise<T[]> {
    return this.readSemaphore.withPermit(async () => {
      // 执行只读查询
      return this.db.query(sql);
    });
  }

  async execute(sql: string): Promise<void> {
    return this.writeSemaphore.withPermit(async () => {
      // 执行写操作
      return this.db.execute(sql);
    });
  }
}
```

---

## 绞杀者模式 (Strangler Fig)

### 问题背景

将一个大型单体应用迁移到微服务架构是一个复杂且高风险的过程。一次性重写整个系统不仅耗时,而且可能导致长时间的服务中断。

### 解决方案

绞杀者模式允许逐步将单体应用的功能迁移到新的微服务,同时保持系统持续运行。新旧系统并行存在,直到所有功能都迁移完成。

```
          第一阶段                    第二阶段                    第三阶段
    ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
    │   API Gateway    │      │   API Gateway    │      │   API Gateway    │
    └────────┬─────────┘      └────────┬─────────┘      └────────┬─────────┘
             │                         │                         │
    ┌────────┴─────────┐      ┌────────┴─────────┐      ┌────────┴─────────┐
    │                  │      │        │         │      │                  │
    ▼                  ▼      ▼        ▼         ▼      ▼                  ▼
┌───────┐         ┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐
│ 单体  │         │ 单体  ││ 用户  ││ 单体  ││ 订单  ││ 用户  ││ 订单  ││ 支付  │
│ 应用  │         │ 应用  ││ 服务  ││ 应用  ││ 服务  ││ 服务  ││ 服务  ││ 服务  │
│ 100%  │         │ 70%   ││ 30%   ││ 40%   ││ 30%   ││  ...  ││  ...  ││  ...  │
└───────┘         └───────┘└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘
```

### 实现示例

```typescript
// API Gateway 路由配置
interface RouteConfig {
  path: string;
  target: 'legacy' | 'new';
  newServiceUrl?: string;
  legacyUrl: string;
  featureFlag?: string;
}

class StranglerFigRouter {
  private routes: RouteConfig[] = [
    // 已迁移到新服务
    {
      path: '/api/users/*',
      target: 'new',
      newServiceUrl: 'http://user-service',
      legacyUrl: 'http://monolith',
    },
    // 正在迁移中,使用功能开关
    {
      path: '/api/orders/*',
      target: 'new',
      newServiceUrl: 'http://order-service',
      legacyUrl: 'http://monolith',
      featureFlag: 'orders-new-service',
    },
    // 尚未迁移
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
    // 如果有功能开关,检查是否启用
    if (route.featureFlag) {
      const isEnabled = await this.featureFlagService.isEnabled(
        route.featureFlag,
        {
          userId: request.userId,
          percentage: 20, // 20% 流量走新服务
        }
      );

      if (isEnabled && route.newServiceUrl) {
        return route.newServiceUrl;
      }
      return route.legacyUrl;
    }

    // 根据目标返回 URL
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
      // 如果新服务失败,可以回退到旧服务
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

// 数据同步器 - 确保新旧系统数据一致
class DataSynchronizer {
  constructor(
    private legacyDb: Database,
    private newServiceClient: ServiceClient,
    private eventBus: EventBus
  ) {}

  // 监听单体应用的数据变更
  @EventHandler('legacy.user.updated')
  async syncUserToNewService(event: UserUpdatedEvent): Promise<void> {
    try {
      await this.newServiceClient.updateUser(event.userId, event.data);
    } catch (error) {
      // 记录同步失败,后续重试
      await this.eventBus.publish('sync.failed', {
        type: 'user',
        id: event.userId,
        error: error.message,
      });
    }
  }

  // 双写策略 - 同时写入新旧系统
  async createUser(userData: CreateUserDTO): Promise<User> {
    // 先写入旧系统(主)
    const legacyUser = await this.legacyDb.users.create(userData);

    // 异步写入新系统
    this.newServiceClient.createUser(userData).catch(error => {
      console.error('Failed to sync to new service:', error);
    });

    return legacyUser;
  }
}
```

### 迁移策略

```typescript
// 渐进式迁移管理器
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
      // 将所有流量切回旧服务
      await this.updateRouting(phase.features, 'legacy');
    }
  }
}
```

---

## 边车模式 (Sidecar)

### 问题背景

微服务需要处理许多横切关注点:日志、监控、配置管理、服务发现、TLS 等。如果每个服务都自己实现这些功能,会导致大量重复代码和维护负担。

### 解决方案

边车模式将这些通用功能提取到一个独立的进程(边车),与主服务部署在同一个主机或容器中。边车代理所有进出主服务的流量。

```
                    Pod / Host
    ┌─────────────────────────────────────────┐
    │                                         │
    │  ┌─────────────┐    ┌─────────────┐    │
    │  │             │    │             │    │
    │  │  主服务     │◄───►│   Sidecar   │◄───┼──── 外部流量
    │  │  (业务逻辑) │    │  (代理)     │    │
    │  │             │    │             │    │
    │  └─────────────┘    └─────────────┘    │
    │         │                  │            │
    │         │                  │            │
    │         ▼                  ▼            │
    │  ┌─────────────────────────────────┐   │
    │  │       共享存储 / 本地通信        │   │
    │  └─────────────────────────────────┘   │
    │                                         │
    └─────────────────────────────────────────┘
```

### Kubernetes Sidecar 示例

```yaml
# Envoy Sidecar 配置
apiVersion: v1
kind: Pod
metadata:
  name: my-service-pod
  labels:
    app: my-service
spec:
  containers:
    # 主服务容器
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

    # Envoy Sidecar 容器
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
                      # 限流
                      - name: envoy.filters.http.local_ratelimit
                        typed_config:
                          "@type": type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
                          stat_prefix: http_local_rate_limiter
                          token_bucket:
                            max_tokens: 100
                            tokens_per_fill: 100
                            fill_interval: 1s
                      # 路由
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

### 日志收集 Sidecar

```yaml
# Fluentd Sidecar 用于日志收集
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

## 大使模式 (Ambassador)

### 问题背景

当服务需要连接到外部系统(如数据库、消息队列、第三方 API)时,通常需要处理连接池、重试、断路器等复杂逻辑。

### 解决方案

大使模式在服务和外部资源之间放置一个代理,处理所有与外部通信相关的复杂性。

```
    ┌─────────────────────────────────────────┐
    │                  Pod                    │
    │                                         │
    │  ┌─────────────┐    ┌─────────────┐    │
    │  │             │    │             │    │
    │  │   服务      │───►│  Ambassador │───────────►  外部数据库
    │  │             │    │   (代理)    │    │
    │  └─────────────┘    └─────────────┘    │
    │                           │            │
    │                           └────────────────────►  外部 API
    │                                         │
    └─────────────────────────────────────────┘
```

### 实现示例

```typescript
// Ambassador 代理实现
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

// 服务使用 Ambassador
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
      // 创建用户
      const userResult = await client.query(
        'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
        [userData.name, userData.email]
      );

      // 创建用户配置
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

### Kubernetes 中的 Ambassador 部署

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-service
spec:
  template:
    spec:
      containers:
        # 主服务
        - name: my-service
          image: my-service:1.0
          env:
            # 服务通过 localhost 连接 Ambassador
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

## 防腐层模式 (Anti-Corruption Layer)

### 问题背景

当集成遗留系统或第三方系统时,这些系统的领域模型和接口可能与我们的系统不匹配。直接依赖它们会导致我们的代码被外部系统的设计"污染"。

### 解决方案

防腐层在我们的系统和外部系统之间创建一个适配层,将外部概念翻译成我们内部的领域概念。

```
    ┌──────────────────────────────────────────────────────┐
    │                     我们的系统                        │
    │                                                      │
    │  ┌─────────────┐    ┌─────────────────────────────┐ │
    │  │             │    │       防腐层 (ACL)           │ │
    │  │  领域服务   │───►│  ┌─────────┐ ┌───────────┐ │ │
    │  │             │    │  │ 适配器  │ │ 翻译器    │ │ │
    │  └─────────────┘    │  └─────────┘ └───────────┘ │ │
    │                     └──────────────┬──────────────┘ │
    └────────────────────────────────────┼────────────────┘
                                         │
                                         ▼
                            ┌─────────────────────────┐
                            │       遗留系统           │
                            │  (不同的模型和接口)      │
                            └─────────────────────────┘
```

### 实现示例

```typescript
// 遗留系统的数据结构 (我们无法控制)
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
  CUST_CR_DT: string;   // YYYYMMDD 格式
  CUST_LST_ORD_AMT: number; // 金额以分为单位
}

// 我们的领域模型
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

// 防腐层实现
class CustomerAntiCorruptionLayer {
  private legacyClient: LegacySystemClient;
  private translator: CustomerTranslator;

  constructor(legacyClient: LegacySystemClient) {
    this.legacyClient = legacyClient;
    this.translator = new CustomerTranslator();
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    try {
      // 调用遗留系统
      const legacyRecord = await this.legacyClient.fetchCustomer(customerId);

      if (!legacyRecord) {
        return null;
      }

      // 翻译为我们的领域模型
      return this.translator.translateFromLegacy(legacyRecord);
    } catch (error) {
      // 将遗留系统的错误翻译为我们的异常
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
    // 翻译为遗留系统格式
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
    // 将我们的查询条件翻译为遗留系统的格式
    const legacyQuery = this.translator.translateSearchCriteria(criteria);

    const legacyResults = await this.legacyClient.searchCustomers(legacyQuery);

    return legacyResults.map(record =>
      this.translator.translateFromLegacy(record)
    );
  }
}

// 翻译器
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
        amount: legacy.CUST_LST_ORD_AMT / 100, // 分转元
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
    // 将 "1234567890" 格式化为 "+86 123-4567-890"
    if (phone.length === 11) {
      return `+86 ${phone.substring(0, 3)}-${phone.substring(3, 7)}-${phone.substring(7)}`;
    }
    return phone;
  }

  private unformatPhone(phone: string): string {
    return phone.replace(/[\s\-\+86]/g, '');
  }
}

// 领域服务使用防腐层
class CustomerService {
  constructor(private acl: CustomerAntiCorruptionLayer) {}

  async getCustomerProfile(customerId: string): Promise<CustomerProfile> {
    const customer = await this.acl.getCustomer(customerId);

    if (!customer) {
      throw new CustomerNotFoundError(customerId);
    }

    // 使用干净的领域模型进行业务逻辑
    return {
      ...customer,
      isVIP: customer.lastOrderAmount.amount > 10000,
      canOrder: customer.status === CustomerStatus.ACTIVE,
    };
  }
}
```

---

## 每服务一数据库 (Database per Service)

### 问题背景

在微服务架构中,如果多个服务共享同一个数据库,会导致服务之间紧密耦合,难以独立部署和扩展。

### 解决方案

每个微服务拥有自己的私有数据库。服务之间通过 API 或事件进行数据交换,而不是直接访问其他服务的数据库。

```
    ┌─────────────────────────────────────────────────────────────┐
    │                                                             │
    │    ┌──────────┐     ┌──────────┐     ┌──────────┐         │
    │    │ 用户服务 │     │ 订单服务 │     │ 产品服务 │         │
    │    └────┬─────┘     └────┬─────┘     └────┬─────┘         │
    │         │                │                │               │
    │         ▼                ▼                ▼               │
    │    ┌──────────┐     ┌──────────┐     ┌──────────┐         │
    │    │ PostgreSQL│    │  MongoDB │     │   MySQL  │         │
    │    │  用户库   │    │  订单库  │     │  产品库  │         │
    │    └──────────┘     └──────────┘     └──────────┘         │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
```

### 数据一致性策略

```typescript
// 使用事件驱动保持数据一致性
// 订单服务
class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private eventBus: EventBus
  ) {}

  async createOrder(orderData: CreateOrderDTO): Promise<Order> {
    // 1. 验证产品存在(通过 API 调用产品服务)
    const products = await this.validateProducts(orderData.items);

    // 2. 创建订单
    const order = await this.orderRepository.create({
      userId: orderData.userId,
      items: products.map(p => ({
        productId: p.id,
        name: p.name,        // 冗余存储产品名称
        price: p.price,      // 冗余存储价格(订单时刻的快照)
        quantity: orderData.items.find(i => i.productId === p.id)!.quantity,
      })),
      status: OrderStatus.PENDING,
      createdAt: new Date(),
    });

    // 3. 发布订单创建事件
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

// 产品服务 - 监听订单事件更新销量
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

// 用户服务 - 监听订单事件更新统计
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

### 查询跨服务数据

```typescript
// API 组合模式 - 在 API Gateway 层组合数据
class OrderQueryService {
  constructor(
    private orderRepository: OrderRepository,
    private userServiceClient: UserServiceClient,
    private productServiceClient: ProductServiceClient
  ) {}

  async getOrderDetails(orderId: string): Promise<OrderDetailsDTO> {
    // 获取订单基本信息
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    // 并行获取关联数据
    const [user, products] = await Promise.all([
      this.userServiceClient.getUser(order.userId),
      this.productServiceClient.getProducts(
        order.items.map(i => i.productId)
      ),
    ]);

    // 组合返回
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

// CQRS 读模型 - 维护预聚合的查询视图
class OrderReadModelUpdater {
  constructor(private readModelRepository: ReadModelRepository) {}

  @EventHandler('order.created')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // 同时获取用户信息来创建读模型
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
    // 更新所有该用户订单的读模型
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

## 事件驱动模式 (Event-Driven)

### 问题背景

微服务之间的同步通信会导致服务耦合和性能瓶颈。当一个服务需要通知多个其他服务时,问题更加突出。

### 解决方案

使用事件驱动架构,服务通过发布和订阅事件来通信,实现松耦合和高扩展性。

### 事件类型

```typescript
// 1. 领域事件 - 表示业务中发生的事情
interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  payload: unknown;
  metadata: EventMetadata;
}

// 2. 集成事件 - 用于服务间通信
interface IntegrationEvent extends DomainEvent {
  sourceService: string;
  version: string;
}

// 3. 命令事件 - 请求执行某个操作
interface CommandEvent {
  commandId: string;
  commandType: string;
  targetService: string;
  payload: unknown;
  replyTo?: string;
}

// 事件定义示例
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

### 事件总线实现

```typescript
// 使用 RabbitMQ 的事件总线
import amqp from 'amqplib';

class RabbitMQEventBus implements EventBus {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private handlers: Map<string, EventHandler[]> = new Map();

  async connect(url: string): Promise<void> {
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();

    // 创建交换机
    await this.channel.assertExchange('events', 'topic', {
      durable: true,
    });

    // 创建死信交换机
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

    // 创建队列
    await this.channel.assertQueue(queueName, {
      durable: true,
      deadLetterExchange: 'events.dlx',
      deadLetterRoutingKey: `${queueName}.dlq`,
    });

    // 绑定到交换机
    await this.channel.bindQueue(queueName, 'events', eventType);

    // 设置消费者
    await this.channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        await handler(event);
        this.channel.ack(msg);
      } catch (error) {
        console.error(`Error processing event: ${error.message}`);

        // 检查重试次数
        const retryCount = (msg.properties.headers?.['x-retry-count'] || 0);

        if (retryCount < (options.maxRetries || 3)) {
          // 重新入队并增加重试计数
          this.channel.nack(msg, false, false);
          await this.republishWithRetry(msg, retryCount + 1);
        } else {
          // 发送到死信队列
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

// 事件处理器示例
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
    // 处理订单创建事件
    await this.inventoryService.reserveStock(event.payload.items);

    // 发布库存预留成功事件
    await this.eventBus.publish(new StockReservedEvent(event.aggregateId));
  }

  private async handleOrderShipped(event: OrderShippedEvent): Promise<void> {
    // 发送发货通知
    await this.notificationService.sendShipmentNotification({
      orderId: event.aggregateId,
      customerId: event.payload.customerId,
      trackingNumber: event.payload.trackingNumber,
    });
  }
}
```

### 事件溯源 (Event Sourcing)

```typescript
// 事件存储
interface EventStore {
  append(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
  read(streamId: string, fromVersion?: number): Promise<DomainEvent[]>;
  subscribe(streamId: string, handler: EventHandler): Promise<void>;
}

// 聚合根基类
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

// 订单聚合
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

// 仓储实现
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

## CQRS 模式

### 问题背景

在复杂的业务系统中,读取和写入操作的需求往往差异很大。写入操作需要验证业务规则、保证数据一致性;而读取操作需要高性能、灵活的查询能力。

### 解决方案

CQRS (Command Query Responsibility Segregation) 将读写操作分离到不同的模型中:

- **命令模型 (Write Model)**: 处理创建、更新、删除操作
- **查询模型 (Read Model)**: 优化查询操作

```
                    ┌──────────────────┐
                    │     客户端        │
                    └────────┬─────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                  │
            ▼                                  ▼
    ┌───────────────┐                 ┌───────────────┐
    │  命令 (写入)   │                 │  查询 (读取)   │
    └───────┬───────┘                 └───────┬───────┘
            │                                  │
            ▼                                  ▼
    ┌───────────────┐                 ┌───────────────┐
    │  命令处理器    │                 │  查询处理器    │
    └───────┬───────┘                 └───────┬───────┘
            │                                  │
            ▼                                  ▼
    ┌───────────────┐    事件同步     ┌───────────────┐
    │   写入数据库   │ ────────────► │   读取数据库   │
    │  (规范化模型)  │                │  (非规范化视图) │
    └───────────────┘                 └───────────────┘
```

### 实现示例

```typescript
// 命令定义
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

// 命令处理器
class OrderCommandHandler {
  constructor(
    private orderRepository: OrderRepository,
    private eventBus: EventBus
  ) {}

  async handle(command: CreateOrderCommand): Promise<string> {
    // 验证业务规则
    await this.validateCustomerCanOrder(command.customerId);
    await this.validateItemsAvailable(command.items);

    // 创建订单
    const order = Order.create({
      orderId: generateUUID(),
      customerId: command.customerId,
      items: command.items,
      shippingAddress: command.shippingAddress,
      totalAmount: this.calculateTotal(command.items),
      correlationId: command.commandId,
    });

    // 保存到写入存储
    await this.orderRepository.save(order);

    // 发布事件以更新读模型
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

    // 根据新状态调用相应方法
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
    // 验证客户账户状态等
  }

  private async validateItemsAvailable(items: OrderItemDTO[]): Promise<void> {
    // 验证商品库存等
  }
}

// 查询定义
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

// 读模型
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

// 查询处理器
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

// 读模型更新器 - 监听事件更新读模型
class OrderReadModelUpdater {
  constructor(
    private readModelRepository: ReadModelRepository,
    private customerClient: CustomerServiceClient,
    private productClient: ProductServiceClient
  ) {}

  @EventHandler('order.created')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // 获取客户信息
    const customer = await this.customerClient.getCustomer(
      event.payload.customerId
    );

    // 获取产品详情
    const products = await this.productClient.getProducts(
      event.payload.items.map(i => i.productId)
    );

    // 创建读模型
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
    // 更新所有该客户订单的客户信息
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

// API 控制器
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

## 模式选择指南

| 模式 | 适用场景 | 主要收益 |
|------|---------|---------|
| Saga | 跨服务的业务事务 | 数据最终一致性 |
| 断路器 | 服务间调用 | 故障隔离、快速失败 |
| 舱壁 | 资源密集型操作 | 资源隔离、防止级联故障 |
| 绞杀者 | 单体到微服务迁移 | 渐进式迁移、降低风险 |
| 边车 | 横切关注点 | 关注点分离、可重用 |
| 大使 | 外部系统连接 | 连接管理、重试策略 |
| 防腐层 | 集成遗留/第三方系统 | 领域模型隔离 |
| 每服务一数据库 | 服务独立性要求高 | 服务解耦、技术多样性 |
| 事件驱动 | 松耦合、高扩展需求 | 异步通信、可扩展性 |
| CQRS | 复杂查询需求 | 读写性能优化 |

## 总结

微服务设计模式是解决分布式系统复杂性的有效工具。在实际应用中,这些模式往往需要组合使用:

1. **基础架构层**: 边车 + 大使模式处理横切关注点
2. **服务通信层**: 断路器 + 舱壁保证系统弹性
3. **数据一致性层**: Saga + 事件驱动保证最终一致性
4. **查询优化层**: CQRS + 每服务一数据库优化读写性能
5. **系统演进层**: 绞杀者 + 防腐层支持渐进式迁移

选择合适的模式需要根据具体的业务需求、团队能力和系统约束来决定。没有一种模式是万能的,关键是理解每种模式的权衡,并在正确的场景下使用它们。

## 延伸阅读

- [Building Microservices](https://www.oreilly.com/library/view/building-microservices-2nd/9781492034018/) - Sam Newman
- [Microservices Patterns](https://microservices.io/patterns/) - Chris Richardson
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/) - Eric Evans
- [Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/) - Gregor Hohpe
