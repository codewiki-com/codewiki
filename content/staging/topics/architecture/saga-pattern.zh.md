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
origin: old/src/content/docs/architecture/saga-pattern.zh.md
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

## 概念概述

Saga 模式是一种用于管理跨多个微服务的分布式事务的设计模式。与依赖单一数据库的传统 ACID 事务不同，Saga 协调一系列本地事务，其中每个服务执行自己的事务并发布事件以触发下一步操作。如果任何步骤失败，将执行补偿事务以撤销之前步骤所做的更改。

### 什么是 Saga 模式？

在微服务架构中，每个服务通常拥有自己的数据库。当一个业务操作跨越多个服务时，我们无法使用传统的数据库事务，因为它们只能在单个数据库内工作。Saga 模式通过将分布式事务分解为一系列本地事务来解决这个问题。

考虑一个电商订单工作流：

```
传统单体事务：
BEGIN TRANSACTION
  1. 创建订单
  2. 预留库存
  3. 处理支付
  4. 确认订单
COMMIT

Saga 模式：
步骤 1：创建订单（订单服务）
  -> 发布 OrderCreated 事件
步骤 2：预留库存（库存服务）
  -> 发布 InventoryReserved 事件
步骤 3：处理支付（支付服务）
  -> 发布 PaymentProcessed 事件
步骤 4：确认订单（订单服务）
  -> 发布 OrderConfirmed 事件

如果支付失败：
  补偿步骤 2：释放库存
  补偿步骤 1：取消订单
```

### 核心特征

Saga 模式具有以下基本特征：

1. **本地事务**：每个步骤都是单个服务内的本地 ACID 事务
2. **补偿事务**：每个步骤都有对应的补偿操作用于回滚
3. **最终一致性**：系统随时间达到一致性，而非立即一致
4. **无分布式锁**：避免两阶段提交（2PC）的性能开销

### 与两阶段提交的比较

| 方面 | 两阶段提交（2PC） | Saga 模式 |
|------|------------------|-----------|
| 一致性模型 | 强一致性 | 最终一致性 |
| 性能 | 较低（阻塞、锁） | 较高（无分布式锁） |
| 可用性 | 较低（协调器单点） | 较高（去中心化） |
| 复杂性 | 协议复杂性 | 业务逻辑复杂性 |
| 故障处理 | 自动回滚 | 需要补偿事务 |
| 可扩展性 | 有限 | 高 |
| 适用场景 | 传统数据库 | 微服务 |

---

## 编排式 vs 协调式

实现 Saga 模式主要有两种方法：编排式（Choreography）和协调式（Orchestration）。每种方法都有其优缺点，适用于不同的场景。

### 编排式 Saga

在编排式方法中，每个服务生产和监听事件。没有中央协调器；服务对事件做出响应并知道下一步该做什么。

```
编排式流程：

+-------------+    OrderCreated    +-------------+
|   订单      | ------------------> |   库存      |
|   服务      |                     |   服务      |
+-------------+                     +------+------+
                                          |
                                  InventoryReserved
                                          |
                                          v
+-------------+    PaymentProcessed +-------------+
|   订单      | <------------------ |   支付      |
|   服务      |                     |   服务      |
+------+------+                     +-------------+
       |
OrderConfirmed
       |
       v
+-------------+
|   通知      |
|   服务      |
+-------------+
```

#### 实现示例

```typescript
// 订单服务 - 发起 Saga
class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private eventBus: EventBus
  ) {}

  async createOrder(orderData: CreateOrderDTO): Promise<Order> {
    // 步骤 1：创建 PENDING 状态的订单
    const order = await this.orderRepository.create({
      ...orderData,
      status: OrderStatus.PENDING
    });

    // 发布事件触发下一步
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

  // Saga 继续执行的事件处理器
  @EventHandler('InventoryReserved')
  async onInventoryReserved(event: InventoryReservedEvent): Promise<void> {
    // 更新订单状态
    await this.orderRepository.updateStatus(
      event.orderId,
      OrderStatus.INVENTORY_RESERVED
    );
  }

  @EventHandler('PaymentProcessed')
  async onPaymentProcessed(event: PaymentProcessedEvent): Promise<void> {
    // 确认订单
    await this.orderRepository.updateStatus(
      event.orderId,
      OrderStatus.CONFIRMED
    );

    // 发布确认事件
    await this.eventBus.publish({
      type: 'OrderConfirmed',
      payload: {
        orderId: event.orderId,
        confirmedAt: new Date().toISOString()
      }
    });
  }

  // 补偿处理器
  @EventHandler('InventoryReserveFailed')
  async onInventoryReserveFailed(event: InventoryReserveFailedEvent): Promise<void> {
    // 补偿：取消订单
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
    // 订单保持待处理状态，将由库存服务补偿处理
    await this.orderRepository.updateStatus(
      event.orderId,
      OrderStatus.PAYMENT_FAILED
    );
  }
}

// 库存服务 - Saga 中的第二步
class InventoryService {
  constructor(
    private inventoryRepository: InventoryRepository,
    private eventBus: EventBus
  ) {}

  @EventHandler('OrderCreated')
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      // 检查并预留库存
      for (const item of event.items) {
        const inventory = await this.inventoryRepository.findByProductId(item.productId);

        if (inventory.available < item.quantity) {
          throw new InsufficientInventoryError(item.productId, item.quantity, inventory.available);
        }
      }

      // 预留库存
      const reservation = await this.inventoryRepository.reserve({
        orderId: event.orderId,
        items: event.items,
        reservedAt: new Date()
      });

      // 发布成功事件
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
      // 发布失败事件
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

  // 补偿处理器
  @EventHandler('PaymentFailed')
  async onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    // 释放预留的库存
    await this.inventoryRepository.releaseReservation(event.orderId);

    await this.eventBus.publish({
      type: 'InventoryReleased',
      payload: {
        orderId: event.orderId,
        reason: '支付失败',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// 支付服务 - Saga 中的第三步
class PaymentService {
  constructor(
    private paymentGateway: PaymentGateway,
    private paymentRepository: PaymentRepository,
    private eventBus: EventBus
  ) {}

  @EventHandler('InventoryReserved')
  async onInventoryReserved(event: InventoryReservedEvent): Promise<void> {
    try {
      // 处理支付
      const paymentResult = await this.paymentGateway.charge({
        orderId: event.orderId,
        amount: event.totalAmount,
        currency: 'USD'
      });

      // 记录支付
      await this.paymentRepository.create({
        orderId: event.orderId,
        transactionId: paymentResult.transactionId,
        amount: event.totalAmount,
        status: PaymentStatus.COMPLETED
      });

      // 发布成功事件
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
      // 发布失败事件以触发补偿
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

#### 编排式的优缺点

| 优点 | 缺点 |
|------|------|
| 对于小型 saga 实现简单 | 难以跟踪 saga 状态 |
| 没有单点故障 | 存在循环依赖风险 |
| 服务松耦合 | 难以理解整体流程 |
| 易于添加新服务 | 测试变得复杂 |
| 适合简单工作流 | 难以实现复杂逻辑 |

### 协调式 Saga

在协调式方法中，一个中央 Saga 协调器协调整个事务流程。它告诉每个服务该做什么，并处理补偿逻辑。

```
协调式流程：

                     +-------------------+
                     | Saga 协调器       |
                     +--------+----------+
                              |
      +-----------+-----------+-----------+-----------+
      |           |           |           |           |
      v           v           v           v           v
+----------+ +----------+ +----------+ +----------+ +----------+
|  订单    | |  库存    | |  支付    | |  物流    | |  通知    |
|  服务    | |  服务    | |  服务    | |  服务    | |  服务    |
+----------+ +----------+ +----------+ +----------+ +----------+
```

#### 实现示例

```typescript
// Saga 步骤定义
interface SagaStep<TContext> {
  name: string;
  action: (context: TContext) => Promise<void>;
  compensation: (context: TContext) => Promise<void>;
}

// Saga 执行状态
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

// 通用 Saga 协调器
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

    // 初始化 saga 状态
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
      // 执行每个步骤
      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        sagaState.currentStep = i;

        console.log(`[Saga ${sagaId}] 执行步骤：${step.name}`);

        try {
          await step.action(context);
          sagaState.completedSteps.push(step.name);
          await this.sagaRepository.save(sagaState);

          await this.eventBus.publish({
            type: 'SagaStepCompleted',
            payload: { sagaId, step: step.name, stepIndex: i }
          });
        } catch (stepError) {
          console.error(`[Saga ${sagaId}] 步骤 ${step.name} 失败：`, stepError);

          // 开始补偿
          sagaState.status = 'COMPENSATING';
          sagaState.error = stepError.message;
          await this.sagaRepository.save(sagaState);

          await this.compensate(sagaState, context);

          throw new SagaExecutionError(
            `Saga ${sagaId} 在步骤 ${step.name} 失败：${stepError.message}`
          );
        }
      }

      // Saga 成功完成
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
    console.log(`[Saga ${sagaState.sagaId}] 开始补偿...`);

    // 按逆序补偿
    const stepsToCompensate = [...sagaState.completedSteps].reverse();

    for (const stepName of stepsToCompensate) {
      const step = this.steps.find(s => s.name === stepName);

      if (!step) continue;

      try {
        console.log(`[Saga ${sagaState.sagaId}] 补偿步骤：${stepName}`);
        await step.compensation(context);
        sagaState.compensatedSteps.push(stepName);
        await this.sagaRepository.save(sagaState);

        await this.eventBus.publish({
          type: 'SagaStepCompensated',
          payload: { sagaId: sagaState.sagaId, step: stepName }
        });
      } catch (compError) {
        console.error(
          `[Saga ${sagaState.sagaId}] 步骤 ${stepName} 补偿失败：`,
          compError
        );

        // 记录以便人工干预
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

// 创建订单 Saga 上下文
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

// 创建订单 Saga 实现
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
            await this.orderService.cancel(ctx.orderId, 'Saga 补偿');
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
          // 确认是最后一步，通常不需要补偿
          // 或者恢复到之前的状态
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
          // 通知通常不需要补偿
          // 可以发送取消通知作为替代
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

// 使用示例
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

  console.log('订单已创建：', result.orderId);
} catch (error) {
  console.error('订单创建失败：', error.message);
}
```

#### 协调式的优缺点

| 优点 | 缺点 |
|------|------|
| 事务流程清晰 | 单点故障（协调器） |
| 易于跟踪 saga 状态 | 与协调器耦合度高 |
| 错误处理更简单 | 需要维护额外服务 |
| 更适合复杂 saga | 协调器可能变得复杂 |
| 更易测试 | 额外的延迟 |

### 何时使用哪种方法

| 场景 | 推荐方法 |
|------|----------|
| 简单工作流（2-4 步） | 编排式 |
| 复杂工作流（5+ 步） | 协调式 |
| 需要 saga 状态可见性 | 协调式 |
| 高度独立的服务 | 编排式 |
| 需要复杂回滚逻辑 | 协调式 |
| 事件驱动架构 | 编排式 |
| 频繁变更工作流 | 协调式 |

---

## 补偿事务

补偿事务是 Saga 模式的基石。它们是语义上撤销先前事务效果的操作。

### 设计补偿事务

并非所有操作都能简单地"撤销"。补偿是关于实现语义等价的逆转：

```typescript
// 示例：不同类型的补偿事务

// 1. 直接逆转 - 简单撤销
class InventoryCompensation {
  // 原始操作：预留 10 件商品
  async reserve(productId: string, quantity: number): Promise<void> {
    await this.db.query(
      'UPDATE inventory SET reserved = reserved + $1 WHERE product_id = $2',
      [quantity, productId]
    );
  }

  // 补偿：释放预留的 10 件商品
  async releaseReservation(productId: string, quantity: number): Promise<void> {
    await this.db.query(
      'UPDATE inventory SET reserved = reserved - $1 WHERE product_id = $2',
      [quantity, productId]
    );
  }
}

// 2. 逻辑逆转 - 创建相反的事务
class PaymentCompensation {
  // 原始操作：向客户收费
  async charge(customerId: string, amount: number): Promise<Payment> {
    const payment = await this.paymentGateway.charge({
      customerId,
      amount,
      type: 'CHARGE'
    });
    return payment;
  }

  // 补偿：发起退款（创建新事务，不删除原事务）
  async refund(paymentId: string): Promise<Refund> {
    const originalPayment = await this.paymentRepository.findById(paymentId);

    const refund = await this.paymentGateway.refund({
      originalTransactionId: originalPayment.transactionId,
      amount: originalPayment.amount,
      type: 'REFUND'
    });

    // 记录退款，不删除原支付记录
    await this.refundRepository.create({
      originalPaymentId: paymentId,
      refundTransactionId: refund.transactionId,
      amount: refund.amount,
      refundedAt: new Date()
    });

    return refund;
  }
}

// 3. 状态转换 - 修改状态而非删除
class OrderCompensation {
  // 原始操作：创建订单
  async createOrder(orderData: OrderDTO): Promise<Order> {
    return this.orderRepository.create({
      ...orderData,
      status: OrderStatus.CREATED
    });
  }

  // 补偿：将订单标记为已取消（不删除）
  async cancelOrder(orderId: string, reason: string): Promise<void> {
    await this.orderRepository.update(orderId, {
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: reason
    });

    // 记录取消操作以供审计
    await this.orderAuditRepository.create({
      orderId,
      action: 'CANCELLED',
      reason,
      timestamp: new Date()
    });
  }
}

// 4. 通知补偿 - 发送更正通知
class NotificationCompensation {
  // 原始操作：发送确认邮件
  async sendConfirmation(orderId: string, email: string): Promise<void> {
    await this.emailService.send({
      to: email,
      template: 'order-confirmation',
      data: { orderId }
    });
  }

  // 补偿：发送取消邮件
  async sendCancellation(orderId: string, email: string, reason: string): Promise<void> {
    await this.emailService.send({
      to: email,
      template: 'order-cancelled',
      data: { orderId, reason }
    });
  }
}
```

### 幂等补偿

补偿事务必须是幂等的，因为它们可能由于重试而被执行多次：

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
    // 检查补偿是否已执行
    const existing = await this.compensationLog.find(sagaId, stepName);

    if (existing && existing.status === 'COMPLETED') {
      console.log(`${stepName} 的补偿已完成，跳过`);
      return;
    }

    // 记录补偿尝试
    await this.compensationLog.upsert({
      sagaId,
      stepName,
      status: 'IN_PROGRESS',
      attemptedAt: new Date()
    });

    try {
      await compensation();

      // 标记为已完成
      await this.compensationLog.upsert({
        sagaId,
        stepName,
        status: 'COMPLETED',
        completedAt: new Date()
      });
    } catch (error) {
      // 标记为失败以便重试
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

// 幂等库存释放
class InventoryService {
  async releaseReservation(reservationId: string): Promise<void> {
    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      console.log(`预留 ${reservationId} 未找到，可能已被释放`);
      return;
    }

    if (reservation.status === 'RELEASED') {
      console.log(`预留 ${reservationId} 已被释放`);
      return;
    }

    // 使用乐观锁防止重复释放
    const updated = await this.reservationRepository.updateWithVersion(
      reservationId,
      reservation.version,
      { status: 'RELEASED', releasedAt: new Date() }
    );

    if (!updated) {
      // 并发修改，重新检查状态
      const current = await this.reservationRepository.findById(reservationId);
      if (current?.status === 'RELEASED') {
        return; // 已被其他进程释放
      }
      throw new ConcurrencyError('由于并发修改，释放预留失败');
    }

    // 恢复库存
    await this.inventoryRepository.increaseAvailable(
      reservation.productId,
      reservation.quantity
    );
  }
}
```

### 补偿顺序

补偿必须按照原始事务的逆序执行：

```typescript
class SagaCompensationManager {
  async compensate(saga: SagaState): Promise<void> {
    const completedSteps = saga.completedSteps;

    // 逆序
    const stepsToCompensate = [...completedSteps].reverse();

    console.log(`按顺序补偿 ${stepsToCompensate.length} 个步骤：`,
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
        console.log(`[Saga ${sagaId}] 补偿 ${stepName}，尝试 ${attempt}`);

        const compensation = this.getCompensation(stepName);
        await compensation(context);

        console.log(`[Saga ${sagaId}] 成功补偿 ${stepName}`);
        return;
      } catch (error) {
        lastError = error;
        console.error(
          `[Saga ${sagaId}] ${stepName} 补偿尝试 ${attempt} 失败：`,
          error
        );

        if (attempt < maxRetries) {
          // 指数退避
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // 所有重试都失败，提醒人工干预
    await this.alertManualIntervention(sagaId, stepName, lastError!);
  }

  private async alertManualIntervention(
    sagaId: string,
    stepName: string,
    error: Error
  ): Promise<void> {
    await this.alertService.send({
      severity: 'CRITICAL',
      title: 'Saga 补偿失败',
      message: `Saga ${sagaId} 需要人工干预步骤 ${stepName}`,
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

## 故障处理

健壮的故障处理对于 saga 的可靠性至关重要。不同类型的故障需要不同的处理策略。

### 故障类型

```typescript
// 1. 瞬态故障 - 可以重试
class TransientFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransientFailure';
  }
}

// 2. 业务故障 - 需要补偿
class BusinessFailure extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'BusinessFailure';
  }
}

// 3. 系统故障 - 需要调查
class SystemFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SystemFailure';
  }
}

// 故障分类器
class FailureClassifier {
  classify(error: Error): 'TRANSIENT' | 'BUSINESS' | 'SYSTEM' {
    if (error instanceof TransientFailure) return 'TRANSIENT';
    if (error instanceof BusinessFailure) return 'BUSINESS';
    if (error instanceof SystemFailure) return 'SYSTEM';

    // 基于错误特征分类
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

### 重试策略

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
          // 不可重试的错误，立即失败
          throw error;
        }

        if (attempt === this.config.maxAttempts) {
          throw new Error(
            `saga ${context.sagaId} 步骤 ${context.step} 达到最大重试次数` +
            `（${this.config.maxAttempts}）：${error.message}`
          );
        }

        console.log(
          `[Saga ${context.sagaId}] ${context.step} 重试 ${attempt}/${this.config.maxAttempts}，` +
          `${delay}ms 后重试`
        );

        await this.sleep(delay);

        // 计算带抖动的下一个延迟
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

// 在 saga 步骤中使用
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
      // 确定是否需要补偿
      const failureType = new FailureClassifier().classify(error);

      if (failureType === 'BUSINESS') {
        // 业务故障 - 触发补偿
        throw new SagaCompensationRequired(step.name, error.message);
      }

      // 系统故障 - 可能需要人工干预
      throw new SagaCriticalFailure(step.name, error.message);
    }
  }
}
```

### Saga 状态恢复

```typescript
// 系统重启时的 Saga 状态恢复
class SagaRecoveryService {
  constructor(
    private sagaRepository: SagaRepository,
    private sagaExecutors: Map<string, SagaExecutor>
  ) {}

  async recoverIncompleteSagas(): Promise<void> {
    // 查找所有未完成的 saga
    const incompleteSagas = await this.sagaRepository.findByStatus([
      'RUNNING',
      'COMPENSATING'
    ]);

    console.log(`发现 ${incompleteSagas.length} 个未完成的 saga 需要恢复`);

    for (const saga of incompleteSagas) {
      try {
        await this.recoverSaga(saga);
      } catch (error) {
        console.error(`恢复 saga ${saga.sagaId} 失败：`, error);
        await this.markForManualIntervention(saga);
      }
    }
  }

  private async recoverSaga(saga: SagaState): Promise<void> {
    console.log(`恢复处于 ${saga.status} 状态的 saga ${saga.sagaId}`);

    const executor = this.sagaExecutors.get(saga.sagaType);
    if (!executor) {
      throw new Error(`未找到 saga 类型 ${saga.sagaType} 的执行器`);
    }

    if (saga.status === 'RUNNING') {
      // Saga 在正向执行期间被中断
      // 选项 1：从最后完成的步骤继续
      // 选项 2：补偿并重新开始
      // 这里我们选择补偿以确保安全
      saga.status = 'COMPENSATING';
      await this.sagaRepository.save(saga);
    }

    if (saga.status === 'COMPENSATING') {
      // 继续补偿
      await executor.compensate(saga);
    }
  }

  private async markForManualIntervention(saga: SagaState): Promise<void> {
    saga.status = 'FAILED';
    saga.error = '恢复失败 - 需要人工干预';
    await this.sagaRepository.save(saga);

    await this.alertService.critical({
      title: 'Saga 恢复失败',
      sagaId: saga.sagaId,
      sagaType: saga.sagaType
    });
  }
}

// 定期恢复任务
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
        console.error('Saga 恢复任务失败：', error);
      }
    }, this.intervalMs);

    console.log(`Saga 恢复任务已启动，间隔 ${this.intervalMs}ms`);
  }
}
```

### 超时处理

```typescript
class SagaTimeoutManager {
  private readonly DEFAULT_STEP_TIMEOUT = 30000; // 30 秒
  private readonly DEFAULT_SAGA_TIMEOUT = 300000; // 5 分钟

  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    context: { sagaId: string; step: string }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new SagaTimeoutError(
          `步骤 ${context.step} 在 saga ${context.sagaId} 中超时，` +
          `超过 ${timeoutMs}ms`
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

// 检测过期 saga
class StaleSagaDetector {
  constructor(
    private sagaRepository: SagaRepository,
    private alertService: AlertService
  ) {}

  async detectStaleSagas(maxAgeMs: number = 3600000): Promise<void> {
    const staleSagas = await this.sagaRepository.findStale(maxAgeMs);

    for (const saga of staleSagas) {
      console.warn(`检测到过期 saga：${saga.sagaId}，年龄：${
        Date.now() - saga.startedAt.getTime()
      }ms`);

      await this.alertService.warn({
        title: '检测到过期 Saga',
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

## 实现策略

### 基于消息的实现

使用消息代理实现可靠的 saga 执行：

```typescript
// 基于 Kafka 的 saga 实现
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

    // 订阅 saga 主题
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

// 使用 Kafka 的服务参与者
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
      // 记录错误但不失败 - 补偿必须最终成功
      console.error(`saga ${sagaId} 补偿失败：`, error);
      // 重试或告警
    }
  }
}
```

### 基于数据库的状态机

```typescript
// 带数据库持久化的状态机式 saga
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
    // 使用乐观锁进行状态转换
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
    // 转换到 EXECUTING 状态
    const started = await this.transitionStep(
      sagaId,
      stepName,
      SagaStepStatus.PENDING,
      SagaStepStatus.EXECUTING
    );

    if (!started) {
      console.log(`saga ${sagaId} 中的步骤 ${stepName} 不处于 PENDING 状态`);
      return;
    }

    const handler = this.stepHandlers.get(stepName);
    if (!handler) {
      throw new Error(`未找到步骤 ${stepName} 的处理器`);
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

      // 触发下一步
      await this.triggerNextStep(sagaId, stepName);
    } catch (error) {
      await this.db.query(
        `UPDATE saga_steps
         SET status = $1, error = $2, updated_at = NOW()
         WHERE saga_id = $3 AND step_name = $4`,
        [SagaStepStatus.FAILED, error.message, sagaId, stepName]
      );

      // 触发补偿
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
      console.error(`${stepName} 补偿失败：`, error);
      // 重试逻辑或人工干预
    }
  }
}
```

### 事件溯源集成

```typescript
// 带事件溯源的 Saga
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

  // 应用事件更新状态
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

  // 从事件重建状态
  static fromEvents(events: SagaEvent[]): EventSourcedSaga {
    if (events.length === 0) {
      throw new Error('无法从空事件重建 saga');
    }

    const saga = new EventSourcedSaga(events[0].sagaId);
    for (const event of events) {
      saga.apply(event);
      saga.events.push(event);
    }
    return saga;
  }

  // 记录新事件
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

// Saga 事件存储
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

## 实际应用场景

### 电商订单处理

```typescript
// 完整的电商订单 saga
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

  // 在 saga 执行期间填充
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
      // 步骤 1：验证并创建订单
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
          console.log(`订单 ${order.id} 已创建`);
        },
        compensation: async (ctx) => {
          await this.orderService.updateStatus(ctx.orderId, 'CANCELLED');
          console.log(`订单 ${ctx.orderId} 已取消`);
        }
      })

      // 步骤 2：预留库存
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
          console.log(`库存已预留：${reservation.id}`);
        },
        compensation: async (ctx) => {
          if (ctx.inventoryReservationId) {
            await this.inventoryService.release(ctx.inventoryReservationId);
            console.log(`库存已释放：${ctx.inventoryReservationId}`);
          }
        }
      })

      // 步骤 3：处理支付
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
          console.log(`支付已处理：${payment.transactionId}`);
        },
        compensation: async (ctx) => {
          if (ctx.paymentTransactionId) {
            await this.paymentService.refund(ctx.paymentTransactionId);
            console.log(`支付已退款：${ctx.paymentTransactionId}`);
          }
        }
      })

      // 步骤 4：创建物流单
      .addStep({
        name: 'CreateShipping',
        action: async (ctx) => {
          const shipping = await this.shippingService.createLabel({
            orderId: ctx.orderId,
            items: ctx.items,
            address: ctx.shippingAddress
          });
          ctx.shippingLabelId = shipping.labelId;
          console.log(`物流单已创建：${shipping.labelId}`);
        },
        compensation: async (ctx) => {
          if (ctx.shippingLabelId) {
            await this.shippingService.cancelLabel(ctx.shippingLabelId);
            console.log(`物流单已取消：${ctx.shippingLabelId}`);
          }
        }
      })

      // 步骤 5：奖励积分
      .addStep({
        name: 'AwardLoyaltyPoints',
        action: async (ctx) => {
          const points = Math.floor(ctx.totalAmount); // 每美元 1 积分
          const transaction = await this.loyaltyService.awardPoints({
            customerId: ctx.customerId,
            orderId: ctx.orderId,
            points
          });
          ctx.loyaltyPointsTransactionId = transaction.id;
          console.log(`积分已奖励：${points}`);
        },
        compensation: async (ctx) => {
          if (ctx.loyaltyPointsTransactionId) {
            await this.loyaltyService.revokePoints(ctx.loyaltyPointsTransactionId);
            console.log(`积分已撤销`);
          }
        }
      })

      // 步骤 6：确认订单并扣减库存
      .addStep({
        name: 'ConfirmOrder',
        action: async (ctx) => {
          // 将预留转换为实际扣减
          await this.inventoryService.confirmReservation(ctx.inventoryReservationId!);
          await this.orderService.updateStatus(ctx.orderId, 'CONFIRMED');
          console.log(`订单 ${ctx.orderId} 已确认`);
        },
        compensation: async (ctx) => {
          // 这是一个复杂的补偿 - 可能需要人工干预
          console.warn(`订单确认补偿需要处理 ${ctx.orderId}`);
        }
      })

      // 步骤 7：发送确认通知（不需要补偿）
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
          console.log(`确认邮件已发送`);
        },
        compensation: async (ctx) => {
          // 发送取消通知作为替代
          await this.notificationService.sendOrderCancellation({
            orderId: ctx.orderId,
            customerId: ctx.customerId,
            reason: '订单处理失败'
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

### 旅行预订系统

```typescript
// 旅行预订 saga - 同时预订机票、酒店和租车
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
      // 首先预订机票（最受限的资源）
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

      // 预订酒店
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

      // 预订租车（可选）
      .addStep({
        name: 'BookCarRental',
        action: async (ctx) => {
          if (!ctx.carRentalReservation) {
            console.log('未请求租车，跳过');
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

      // 处理整个行程的支付
      .addStep({
        name: 'ProcessPayment',
        action: async (ctx) => {
          const payment = await this.paymentService.charge({
            customerId: ctx.customerId,
            amount: ctx.totalAmount,
            description: `旅行预订 ${ctx.bookingId}`
          });
          ctx.paymentTransactionId = payment.transactionId;
        },
        compensation: async (ctx) => {
          if (ctx.paymentTransactionId) {
            await this.paymentService.refund(ctx.paymentTransactionId);
          }
        }
      })

      // 确认所有预订
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
          // 确认补偿是复杂的
          // 可能需要人工干预
          console.warn('预订确认补偿需要处理');
        }
      });

    return saga;
  }
}
```

### 账户间转账

```typescript
// 跨行转账 saga
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
      // 验证账户存在且处于活跃状态
      .addStep({
        name: 'ValidateAccounts',
        action: async (ctx) => {
          const [sourceAccount, destAccount] = await Promise.all([
            this.accountService.get(ctx.sourceAccountId),
            this.accountService.get(ctx.destinationAccountId)
          ]);

          if (!sourceAccount || sourceAccount.status !== 'ACTIVE') {
            throw new Error('源账户无效或未激活');
          }
          if (!destAccount || destAccount.status !== 'ACTIVE') {
            throw new Error('目标账户无效或未激活');
          }
          if (sourceAccount.balance < ctx.amount) {
            throw new Error('余额不足');
          }
        },
        compensation: async (ctx) => {
          // 验证没有副作用，不需要补偿
        }
      })

      // 计算费用和汇率（如需要）
      .addStep({
        name: 'CalculateFeesAndFX',
        action: async (ctx) => {
          const sourceAccount = await this.accountService.get(ctx.sourceAccountId);
          const destAccount = await this.accountService.get(ctx.destinationAccountId);

          // 计算费用
          ctx.fees = await this.feeService.calculate({
            amount: ctx.amount,
            sourceAccountType: sourceAccount.type,
            destinationAccountType: destAccount.type,
            isInternational: sourceAccount.country !== destAccount.country
          });

          // 如果货币不同，获取汇率
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
          // 计算没有副作用
        }
      })

      // 从源账户扣款
      .addStep({
        name: 'DebitSourceAccount',
        action: async (ctx) => {
          const totalDebit = ctx.amount + (ctx.fees || 0);

          const debit = await this.accountService.debit({
            accountId: ctx.sourceAccountId,
            amount: totalDebit,
            reference: ctx.transferId,
            description: `转账到 ${ctx.destinationAccountId}`
          });

          ctx.sourceDebitId = debit.transactionId;

          // 记录审计条目
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
            // 将金额返还到源账户
            await this.accountService.credit({
              accountId: ctx.sourceAccountId,
              amount: ctx.amount + (ctx.fees || 0),
              reference: `REVERSAL-${ctx.transferId}`,
              description: '转账撤销'
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

      // 向目标账户入账
      .addStep({
        name: 'CreditDestinationAccount',
        action: async (ctx) => {
          const creditAmount = ctx.amount * (ctx.exchangeRate || 1);

          const credit = await this.accountService.credit({
            accountId: ctx.destinationAccountId,
            amount: creditAmount,
            reference: ctx.transferId,
            description: `来自 ${ctx.sourceAccountId} 的转账`
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
            // 从目标账户扣回
            const creditAmount = ctx.amount * (ctx.exchangeRate || 1);

            await this.accountService.debit({
              accountId: ctx.destinationAccountId,
              amount: creditAmount,
              reference: `REVERSAL-${ctx.transferId}`,
              description: '转账撤销'
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

      // 完成转账
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

## 最佳实践

### 设计原则

1. **保持步骤幂等**：每个操作和补偿都必须可以安全重试

```typescript
// 好的做法：幂等预留
async reserve(orderId: string, productId: string, quantity: number) {
  // 检查是否已预留
  const existing = await this.findReservation(orderId, productId);
  if (existing) {
    return existing; // 返回现有预留
  }

  return this.createReservation(orderId, productId, quantity);
}
```

2. **使用语义锁**：防止对同一资源的并发 saga 操作

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

3. **脏读对策**：处理读取未提交的 saga 数据

```typescript
// 使用 saga 状态过滤读取
async getOrder(orderId: string): Promise<Order | null> {
  const order = await this.orderRepository.findById(orderId);

  // 检查订单是否属于活跃的 saga
  const activeSaga = await this.sagaRepository.findActiveForOrder(orderId);

  if (activeSaga) {
    // 订单正在处理中，返回待处理状态
    return {
      ...order,
      status: 'PROCESSING',
      sagaStatus: activeSaga.status
    };
  }

  return order;
}
```

4. **超时和截止时间**：防止 saga 无限运行

```typescript
class SagaWithDeadline {
  async execute(context: SagaContext, deadline: Date): Promise<void> {
    for (const step of this.steps) {
      if (new Date() > deadline) {
        throw new SagaDeadlineExceeded(
          `Saga ${context.sagaId} 在步骤 ${step.name} 超过截止时间`
        );
      }

      await step.execute(context);
    }
  }
}
```

### 测试策略

```typescript
// Saga 步骤单元测试
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

  it('当所有步骤成功时应该成功完成', async () => {
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

  it('当支付失败时应该补偿', async () => {
    mockOrderService.create.mockResolvedValue({ id: 'order-1' });
    mockInventoryService.reserve.mockResolvedValue({ id: 'res-1' });
    mockPaymentService.charge.mockRejectedValue(new Error('余额不足'));

    await expect(saga.execute({
      customerId: 'cust-1',
      items: [{ productId: 'prod-1', quantity: 1 }],
      amount: 100
    })).rejects.toThrow();

    // 验证补偿按逆序调用
    expect(mockInventoryService.release).toHaveBeenCalledWith('res-1');
    expect(mockOrderService.cancel).toHaveBeenCalledWith('order-1');
  });

  it('应该优雅处理补偿失败', async () => {
    mockOrderService.create.mockResolvedValue({ id: 'order-1' });
    mockInventoryService.reserve.mockResolvedValue({ id: 'res-1' });
    mockPaymentService.charge.mockRejectedValue(new Error('支付失败'));
    mockInventoryService.release.mockRejectedValue(new Error('释放失败'));

    await expect(saga.execute({
      customerId: 'cust-1',
      items: [{ productId: 'prod-1', quantity: 1 }],
      amount: 100
    })).rejects.toThrow();

    // 补偿失败应该被记录但不阻止其他补偿
    expect(mockOrderService.cancel).toHaveBeenCalled();
  });
});

// 使用实际服务的集成测试
describe('CreateOrderSaga 集成测试', () => {
  it('应该端到端创建订单', async () => {
    const saga = new CreateOrderSaga(/* 真实服务 */);

    const result = await saga.execute({
      customerId: 'test-customer',
      items: [
        { productId: 'test-product', quantity: 1, price: 10.00 }
      ],
      amount: 10.00
    });

    // 验证最终状态
    const order = await orderRepository.findById(result.orderId);
    expect(order.status).toBe('CONFIRMED');

    const inventory = await inventoryRepository.getStock('test-product');
    expect(inventory.reserved).toBe(0); // 预留已转换为实际扣减
  });
});
```

---

## 面试要点

### 常见面试问题

**1. 什么是 Saga 模式，何时应该使用它？**

要点：
- 用于管理分布式事务而不使用 2PC 的模式
- 当多个微服务需要协调时使用
- 每个步骤是带有补偿操作的本地事务
- 实现最终一致性而非强一致性
- 适用场景：跨服务操作、长时间运行的事务、需要高可用性

**2. 解释编排式和协调式方法的区别。**

要点：
- **编排式**：去中心化，服务对事件做出响应
  - 优点：松耦合，无单点故障
  - 缺点：难以理解流程，难以测试
- **协调式**：中央协调器
  - 优点：流程清晰，易于跟踪状态
  - 缺点：单点故障，耦合度更高
- 根据复杂性和可见性需求选择

**3. 如何处理 saga 中的故障？**

```typescript
// 关键故障处理概念：
// 1. 分类
const failureType = classifyFailure(error); // TRANSIENT, BUSINESS, SYSTEM

// 2. 对瞬态故障重试
if (failureType === 'TRANSIENT') {
  await retryWithBackoff(operation);
}

// 3. 对业务故障补偿
if (failureType === 'BUSINESS') {
  await compensateInReverseOrder(completedSteps);
}

// 4. 对系统故障告警
if (failureType === 'SYSTEM') {
  await alertForManualIntervention(sagaId, error);
}
```

**4. 如何确保 saga 数据一致性？**

要点：
- 补偿事务语义上撤销先前操作
- 幂等操作安全处理重试
- 语义锁防止并发修改
- Saga 状态持久化允许恢复
- 审计日志跟踪所有状态变更

**5. 实现 saga 的挑战是什么？**

要点：
- 设计正确的补偿
- 处理部分失败
- 处理不可补偿的操作（如已发送的邮件）
- 测试复杂性
- 可观测性和调试
- 处理同一数据上的并发 saga

### 系统设计示例

**使用 Saga 模式设计订单履行系统**

```
需求：
- 带库存、支付、物流的订单创建
- 优雅处理部分失败
- 提供订单状态跟踪
- 支持高吞吐量

解决方案：
1. 服务：订单、库存、支付、物流、通知

2. Saga 步骤：
   - ValidateOrder -> CreateOrder -> ReserveInventory
   -> ProcessPayment -> CreateShipment -> ConfirmOrder -> Notify

3. 补偿链：
   - CancelNotification <- CancelShipment <- RefundPayment
   <- ReleaseInventory <- CancelOrder

4. 状态管理：
   - Saga 状态存储在数据库中，包含 saga_id、step、status
   - 每个服务完成步骤后发布事件
   - 协调器监听并管理流程

5. 故障处理：
   - 对瞬态故障使用指数退避重试 3 次
   - 对业务故障进行补偿
   - 对失败补偿使用死信队列
   - 对人工干预使用告警系统

6. 可观测性：
   - 所有服务使用关联 ID
   - Saga 时间线可视化
   - 指标：完成率、平均时长、失败率
```

### 关键概念总结

```
+--------------------------------------------------------------+
|                    Saga 模式核心概念                          |
+--------------------------------------------------------------+
|  模式类型                                                     |
|  +-- 编排式：基于事件的去中心化协调                           |
|  +-- 协调式：中央 saga 协调器                                 |
+--------------------------------------------------------------+
|  关键组件                                                     |
|  +-- Saga 步骤：每个服务中的本地事务                          |
|  +-- 补偿：每个步骤的语义撤销                                 |
|  +-- Saga 状态：跟踪进度并启用恢复                            |
|  +-- 事件总线：参与者之间的通信                               |
+--------------------------------------------------------------+
|  故障处理                                                     |
|  +-- 重试：对瞬态故障使用退避                                 |
|  +-- 补偿：对业务故障逆序执行                                 |
|  +-- 恢复：检测并恢复未完成的 saga                            |
|  +-- 超时：防止 saga 无限运行                                 |
+--------------------------------------------------------------+
|  实现模式                                                     |
|  +-- 基于消息：Kafka/RabbitMQ 提供可靠性                      |
|  +-- 状态机：数据库支持的步骤跟踪                             |
|  +-- 事件溯源：从事件重放 saga                                |
+--------------------------------------------------------------+
|  最佳实践                                                     |
|  +-- 幂等的操作和补偿                                         |
|  +-- 语义锁防止并发修改                                       |
|  +-- 全面的日志记录和监控                                     |
|  +-- 测试：单元测试、集成测试和混沌测试                       |
+--------------------------------------------------------------+
```

---

## 延伸阅读

### 经典书籍

1. **《微服务模式》** - Chris Richardson
   - 全面介绍 saga 模式及其变体
   - 包含详细的实现示例

2. **《企业集成模式》** - Gregor Hohpe, Bobby Woolf
   - 理解基于消息协调的基础

3. **《数据密集型应用设计》** - Martin Kleppmann
   - 深入探讨分布式系统概念

4. **《构建微服务》** - Sam Newman
   - 微服务架构的实践指导

### 在线资源

- [Microservices.io - Saga 模式](https://microservices.io/patterns/data/saga.html) - Chris Richardson 的模式定义
- [Microsoft - Saga 模式](https://docs.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga) - Azure 架构指南
- [Eventuate.io](https://eventuate.io/) - Saga 框架和示例

### 相关模式

- **事件溯源**：将所有变更存储为事件以便完整审计
- **CQRS**：分离读写模型以提高可扩展性
- **发件箱模式**：通过数据库可靠发布事件
- **两阶段提交**：传统分布式事务（与 saga 对比）
- **断路器**：防止服务间级联故障

### 开源实现

- [Eventuate Tram](https://github.com/eventuate-tram/eventuate-tram-core) - Java saga 框架
- [Temporal](https://temporal.io/) - 工作流编排平台
- [Camunda](https://camunda.com/) - 基于 BPMN 的工作流自动化
- [MassTransit](https://masstransit-project.com/) - .NET 分布式应用框架

---

## 总结

Saga 模式是在微服务架构中管理分布式事务的必备工具。通过将复杂事务分解为一系列带有补偿操作的本地事务，saga 在保持系统可用性和松耦合的同时实现了最终一致性。

关键要点：

1. **选择正确的方法**：简单流程使用编排式，复杂流程使用协调式
2. **仔细设计补偿**：每个操作都需要幂等的语义撤销
3. **优雅处理故障**：分类故障、重试瞬态故障、补偿业务故障
4. **确保可观测性**：记录所有 saga 事件、跟踪状态、提供可见性
5. **全面测试**：单元测试步骤、集成测试流程、混沌测试故障

Saga 模式需要更多的前期设计工作，但为现代分布式系统提供了所需的灵活性和弹性。正确实现后，它使复杂的业务工作流能够在多个服务之间可靠执行，同时保持使微服务有价值的自主性和独立性。
