---
title: 编排 vs 编舞模式
description: 深入理解分布式系统和微服务架构中的编排与编舞模式
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
origin: old/src/content/docs/architecture/choreography-vs-orchestration.zh.md
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

在分布式系统和微服务架构中，跨多个服务协调工作流是一个基本挑战。两种主要模式应运而生：**编排（Orchestration）** 和 **编舞（Choreography）**。理解何时使用每种模式及其权衡对于构建可扩展、可维护的系统至关重要。本文深入探讨这两种模式、它们的实现以及实际应用。

## 概念解释

### 什么是服务协调？

服务协调是指多个独立服务如何协同工作以完成业务流程。在单体应用中，单个事务可以跨越同一进程内的多个操作。在微服务中，这些操作分布在各个服务中，每个服务都有自己的数据库和业务逻辑。

```
单体方式：
┌────────────────────────────────────────────────────────┐
│                      单一进程                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │  创建   │→ │  预留   │→ │  收款   │→ │  发送   │  │
│  │  订单   │  │  库存   │  │  付款   │  │  邮件   │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
│                      单一事务                           │
└────────────────────────────────────────────────────────┘

微服务方式：
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│   订单    │   │   库存    │   │   支付    │   │   邮件    │
│   服务    │   │   服务    │   │   服务    │   │   服务    │
├───────────┤   ├───────────┤   ├───────────┤   ├───────────┤
│  订单库   │   │  库存库   │   │  支付库   │   │  邮件队列 │
└───────────┘   └───────────┘   └───────────┘   └───────────┘
      ?               ?               ?               ?
              它们如何协调？
```

### 编排模式

**编排（Orchestration）** 使用中央协调器（编排器）显式控制工作流。编排器告诉每个服务做什么以及何时做，类似于指挥家指挥乐队。

```
编排模式：

                    ┌─────────────────────┐
                    │      编排器         │
                    │  (Order Saga/BPM)   │
                    └─────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │   服务 A    │    │   服务 B    │    │   服务 C    │
    └─────────────┘    └─────────────┘    └─────────────┘

命令流：编排器 → 服务（直接调用）
响应流：服务 → 编排器（结果/状态）
```

**关键特征：**
- 集中式控制流
- 显式工作流定义
- 服务是被动的 - 响应命令
- 易于理解和调试
- 单点可见性

### 编舞模式

**编舞（Choreography）** 是一种去中心化方式，每个服务知道在收到特定事件时该做什么。服务对事件做出反应并发布自己的事件，就像舞者在没有导演的情况下表演排练好的舞蹈。

```
编舞模式：

┌─────────────┐   事件   ┌─────────────┐   事件   ┌─────────────┐
│   服务 A    │ ───────▶ │   服务 B    │ ───────▶ │   服务 C    │
└─────────────┘          └─────────────┘          └─────────────┘
       │                        │                        │
       │    ┌───────────────────┴────────────────────┐   │
       └───▶│            事件总线 / 消息代理           │◀──┘
            │     (Kafka, RabbitMQ, EventBridge)      │
            └─────────────────────────────────────────┘

事件流：服务 ↔ 事件总线（发布/订阅）
无中央协调器 - 服务自主反应
```

**关键特征：**
- 去中心化控制
- 通过事件反应的隐式工作流
- 服务是自治的 - 自己决定何时行动
- 高度松耦合
- 复杂工作流更难可视化

### 历史背景

这些术语来自不同领域：

- **编排（Orchestration）**：来自音乐 - 指挥（编排者）协调音乐家
- **编舞（Choreography）**：来自舞蹈 - 舞者遵循对舞蹈套路的共同理解

在软件中，随着 SOA（面向服务架构）演变为微服务，这些模式应运而生，需要在没有 ACID 保证的情况下协调分布式事务。

## 核心原理

### 编排原理

#### 1. 集中式工作流管理

```typescript
// 编排器知道完整的工作流
class OrderOrchestrator {
  async processOrder(order: Order): Promise<OrderResult> {
    const saga = new OrderSaga(order);

    try {
      // 步骤 1：创建订单
      await saga.createOrder();

      // 步骤 2：预留库存
      await saga.reserveInventory();

      // 步骤 3：处理支付
      await saga.processPayment();

      // 步骤 4：确认订单
      await saga.confirmOrder();

      // 步骤 5：发送通知
      await saga.sendNotifications();

      return saga.getResult();
    } catch (error) {
      // 编排器处理补偿
      await saga.compensate();
      throw error;
    }
  }
}
```

#### 2. 基于命令的通信

编排器向服务发送显式命令：

```typescript
// 编排器发送命令
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

// 服务响应命令
class InventoryService {
  @Post('/inventory/reserve')
  async handleReserve(command: ReserveStockCommand): Promise<ReservationResult> {
    // 执行命令
    const reservation = await this.reserveItems(command.items);
    return { reservationId: reservation.id, success: true };
  }
}
```

#### 3. 状态机管理

编排器通常使用状态机来跟踪工作流进度：

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
    // 补偿转换
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
      throw new Error(`无效转换：从 ${this.state} 执行 ${action}`);
    }

    this.state = transition.to;
  }
}
```

### 编舞原理

#### 1. 事件驱动通信

服务通过事件而非命令进行通信：

```typescript
// 事件 - 发生的事实
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

#### 2. 自治服务反应

每个服务独立决定如何响应事件：

```typescript
// 库存服务 - 响应 OrderCreated
class InventoryService {
  @Subscribe('ORDER_CREATED')
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      // 自主决定预留库存
      const reservation = await this.reserveInventory(event.items);

      // 将结果作为事件发布
      await this.eventBus.publish({
        type: 'INVENTORY_RESERVED',
        orderId: event.orderId,
        reservationId: reservation.id,
        items: reservation.items,
        timestamp: new Date()
      });
    } catch (error) {
      // 发布失败事件
      await this.eventBus.publish({
        type: 'INVENTORY_RESERVATION_FAILED',
        orderId: event.orderId,
        reason: error.message,
        timestamp: new Date()
      });
    }
  }
}

// 支付服务 - 响应 InventoryReserved
class PaymentService {
  @Subscribe('INVENTORY_RESERVED')
  async onInventoryReserved(event: InventoryReservedEvent): Promise<void> {
    // 需要订单详情 - 获取或在事件中接收
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

#### 3. 事件关联

事件通过业务标识符进行关联：

```typescript
// 通过 orderId 进行事件关联
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
      // Saga 完成
      this.eventBus.publish({
        type: 'ORDER_SAGA_COMPLETED',
        orderId,
        duration: Date.now() - state.startedAt.getTime()
      });
    }
  }
}
```

## 核心要点

### 对比矩阵

| 方面 | 编排 | 编舞 |
|------|------|------|
| **耦合度** | 较高（编排器了解所有服务） | 较低（服务只了解事件） |
| **复杂性位置** | 集中在编排器 | 分布在各服务 |
| **工作流可见性** | 清晰、显式 | 隐式、难以追踪 |
| **单点故障** | 编排器 | 无（但事件总线很关键） |
| **可扩展性** | 受编排器限制 | 高度可扩展 |
| **测试** | 较容易（测试编排器） | 较难（测试事件流） |
| **变更影响** | 新流程需修改编排器 | 可能需修改多个服务 |
| **调试** | 较容易（单点日志） | 较难（需要分布式追踪） |
| **错误处理** | 集中式 | 分布式 |
| **延迟** | 较高（默认顺序执行） | 较低（天然并行） |

### 何时使用编排

1. **复杂工作流**：具有条件逻辑的多步骤流程
2. **严格顺序**：操作必须按特定顺序执行
3. **集中控制**：需要显式工作流管理
4. **错误恢复**：复杂的补偿逻辑
5. **合规要求**：需要审计跟踪和工作流可见性

```typescript
// 示例：复杂贷款审批工作流
class LoanApprovalOrchestrator {
  async processLoanApplication(application: LoanApplication): Promise<LoanDecision> {
    // 复杂条件工作流
    const creditCheck = await this.creditService.checkCredit(application.customerId);

    if (creditCheck.score < 600) {
      return this.rejectLoan(application, '信用评分过低');
    }

    const incomeVerification = await this.incomeService.verifyIncome(application);

    if (incomeVerification.debtToIncomeRatio > 0.43) {
      return this.rejectLoan(application, '负债收入比过高');
    }

    // 基于贷款金额的不同路径
    if (application.amount > 100000) {
      const manualReview = await this.reviewService.requestManualReview(application);
      if (!manualReview.approved) {
        return this.rejectLoan(application, manualReview.reason);
      }
    }

    const propertyAppraisal = await this.appraisalService.appraise(application.propertyId);

    // 更多复杂逻辑...
    return this.approveLoan(application, { creditCheck, incomeVerification, propertyAppraisal });
  }
}
```

### 何时使用编舞

1. **简单流程**：线性事件链
2. **高可扩展性**：需要处理高吞吐量
3. **松耦合**：服务应该独立
4. **实时处理**：事件触发即时反应
5. **可扩展性**：易于添加响应事件的新服务

```typescript
// 示例：电商事件流
// 每个服务独立并响应事件

// 订单服务
class OrderService {
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    const order = await this.orderRepository.create(request);

    // 只发布 - 不关心谁监听
    await this.eventBus.publish({
      type: 'ORDER_CREATED',
      order
    });

    return order;
  }
}

// 库存服务 - 独立订阅
class InventoryService {
  @Subscribe('ORDER_CREATED')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.reserveStock(event.order.items);
    await this.eventBus.publish({ type: 'STOCK_RESERVED', orderId: event.order.id });
  }
}

// 分析服务 - 也独立订阅
class AnalyticsService {
  @Subscribe('ORDER_CREATED')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.recordOrderMetrics(event.order);
  }
}

// 通知服务 - 订阅多个事件
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

### 混合方式

许多实际系统同时使用两种模式：

```typescript
// 混合：跨域用编舞，域内用编排

// 跨域：编舞
// 订单域发布事件，其他域响应
class OrderDomain {
  async completeOrder(orderId: string): Promise<void> {
    // 订单域内部编排
    const orchestrator = new OrderFulfillmentOrchestrator();
    await orchestrator.fulfill(orderId);

    // 跨域编舞
    await this.eventBus.publish({
      type: 'ORDER_FULFILLED',
      orderId,
      timestamp: new Date()
    });
  }
}

// 域内：编排
class OrderFulfillmentOrchestrator {
  async fulfill(orderId: string): Promise<void> {
    // 订单域内的编排步骤
    await this.validateOrder(orderId);
    await this.calculateTaxes(orderId);
    await this.applyDiscounts(orderId);
    await this.finalizeOrder(orderId);
  }
}

// 物流域通过编舞响应
class ShippingDomain {
  @Subscribe('ORDER_FULFILLED')
  async onOrderFulfilled(event: OrderFulfilledEvent): Promise<void> {
    // 物流域内部编排
    const orchestrator = new ShippingOrchestrator();
    await orchestrator.processShipment(event.orderId);
  }
}
```

## 代码示例

### 完整编排实现

```typescript
import { Injectable } from '@nestjs/common';

// Saga 状态
interface OrderSagaState {
  orderId: string;
  status: 'PENDING' | 'INVENTORY_RESERVED' | 'PAYMENT_PROCESSED' | 'COMPLETED' | 'FAILED' | 'COMPENSATED';
  order?: Order;
  reservationId?: string;
  paymentId?: string;
  error?: string;
  compensationSteps: string[];
}

// Saga 步骤定义
interface SagaStep<T> {
  name: string;
  execute: (state: OrderSagaState) => Promise<T>;
  compensate: (state: OrderSagaState) => Promise<void>;
}

// 编排器实现
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
          // 无需补偿 - 订单从未确认
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
          // 通知不需要补偿
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

    // 持久化初始状态
    await this.sagaRepository.save(state);

    try {
      for (const step of this.steps) {
        console.log(`执行步骤：${step.name}`);
        await step.execute(state);

        // 每步后持久化状态
        await this.sagaRepository.save(state);
      }

      return {
        success: true,
        orderId,
        paymentId: state.paymentId!,
        reservationId: state.reservationId!
      };
    } catch (error) {
      console.error(`Saga 在步骤失败，开始补偿`, error);
      state.status = 'FAILED';
      state.error = error.message;
      await this.sagaRepository.save(state);

      // 反序执行补偿
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
          console.log(`补偿步骤：${stepName}`);
          await step.compensate(state);
        } catch (error) {
          console.error(`${stepName} 补偿失败`, error);
          // 记录但继续 - 尝试补偿剩余步骤
        }
      }
    }

    state.status = 'COMPENSATED';
    await this.sagaRepository.save(state);
  }

  // 崩溃 saga 的恢复方法
  async recover(orderId: string): Promise<void> {
    const state = await this.sagaRepository.find(orderId);

    if (!state) {
      throw new Error(`未找到 Saga：${orderId}`);
    }

    if (state.status === 'FAILED') {
      await this.compensate(state);
    }
  }
}

// 使用
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

### 完整编舞实现

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

// 事件定义
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

// 事件总线抽象
@Injectable()
export class EventBus {
  constructor(
    private readonly emitter: EventEmitter2,
    private readonly eventStore: EventStore
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    // 持久化事件
    await this.eventStore.append(event);

    // 发射到本地处理器
    this.emitter.emit(event.type, event);

    // 发布到消息代理（Kafka、RabbitMQ 等）
    await this.publishToExternalBroker(event);
  }

  private async publishToExternalBroker(event: DomainEvent): Promise<void> {
    // 实现取决于你的消息代理
  }
}

// 订单服务 - 发起者
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

    // 发布事件 - 不关心谁响应
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

// 库存服务 - 响应者
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
    // 释放预留库存
    const reservation = await this.inventoryRepository.findByOrderId(event.orderId);
    if (reservation) {
      await this.inventoryRepository.release(reservation.id);
    }
  }

  private async reserveStock(items: OrderItem[]): Promise<Reservation> {
    // 检查并为每个商品预留库存
    for (const item of items) {
      const stock = await this.inventoryRepository.findBySku(item.sku);
      if (stock.available < item.quantity) {
        throw new Error(`${item.sku} 库存不足`);
      }
    }

    return this.inventoryRepository.createReservation(items);
  }
}

// 支付服务 - 响应者
@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentGateway: PaymentGateway,
    private readonly eventBus: EventBus
  ) {}

  @OnEvent('INVENTORY_RESERVED')
  async onInventoryReserved(event: InventoryReservedEvent): Promise<void> {
    // 需要订单详情 - 可以在事件中或获取
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

// 通知服务 - 观察者（不影响流程）
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

// Saga 状态追踪器（用于监控/调试）
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

### 混合模式实现

```typescript
// 域边界：域间使用编舞
// 域内：使用编排

// ============= 订单域 =============
@Injectable()
export class OrderingDomainService {
  constructor(
    private readonly orchestrator: OrderFulfillmentOrchestrator,
    private readonly eventBus: DomainEventBus
  ) {}

  async submitOrder(request: SubmitOrderRequest): Promise<Order> {
    // 域内编排工作流
    const result = await this.orchestrator.execute(request);

    // 发布域事件给其他限界上下文
    await this.eventBus.publish({
      type: 'OrderSubmitted',
      orderId: result.orderId,
      timestamp: new Date()
    });

    return result;
  }
}

// 内部编排器
class OrderFulfillmentOrchestrator {
  async execute(request: SubmitOrderRequest): Promise<OrderResult> {
    // 步骤 1：验证订单
    const validation = await this.validateOrder(request);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }

    // 步骤 2：应用业务规则
    const pricing = await this.calculatePricing(request);

    // 步骤 3：创建订单聚合
    const order = await this.createOrder(request, pricing);

    // 步骤 4：内部域事件
    await this.applyPromotions(order);

    return order;
  }
}

// ============= 物流域 =============
@Injectable()
export class ShippingDomainService implements OnModuleInit {
  // 响应其他域的事件（编舞）
  @OnEvent('OrderSubmitted')
  async onOrderSubmitted(event: OrderSubmittedEvent): Promise<void> {
    // 物流域内部编排
    const orchestrator = new ShipmentOrchestrator(this.dependencies);
    await orchestrator.planShipment(event.orderId);
  }
}

class ShipmentOrchestrator {
  async planShipment(orderId: string): Promise<Shipment> {
    // 物流域内的编排步骤
    const order = await this.orderClient.getOrder(orderId);

    // 步骤 1：计算配送选项
    const options = await this.calculateOptions(order);

    // 步骤 2：选择承运商
    const carrier = await this.selectCarrier(options);

    // 步骤 3：创建发货单
    const shipment = await this.createShipment(order, carrier);

    // 步骤 4：安排取件
    await this.schedulePickup(shipment);

    return shipment;
  }
}

// ============= 通知域 =============
@Injectable()
export class NotificationDomainService {
  // 纯编舞 - 只响应事件
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

## 最佳实践

### 编排最佳实践

#### 1. 实现幂等步骤

```typescript
class IdempotentSagaStep {
  async execute(state: SagaState): Promise<void> {
    // 检查是否已执行
    const execution = await this.executionRepository.find(
      state.sagaId,
      this.stepName
    );

    if (execution?.status === 'COMPLETED') {
      // 已完成 - 返回缓存结果
      return execution.result;
    }

    // 使用幂等键
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

#### 2. 持久化 Saga 状态

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

    // 从上次中断处恢复
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

### 编舞最佳实践

#### 1. 包含足够的事件数据

```typescript
// 不好：数据不足需要额外调用
interface BadOrderCreatedEvent {
  orderId: string;  // 其他服务需要获取订单详情
}

// 好：包含消费者需要的数据
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
  // 包含下游服务需要的内容
}
```

#### 2. 实现事件版本控制

```typescript
// 事件版本控制以支持演进
interface OrderCreatedEventV1 {
  version: 1;
  type: 'ORDER_CREATED';
  orderId: string;
  items: string[];  // 只有 SKU
}

interface OrderCreatedEventV2 {
  version: 2;
  type: 'ORDER_CREATED';
  orderId: string;
  items: Array<{ sku: string; quantity: number; price: number }>;
}

type OrderCreatedEvent = OrderCreatedEventV1 | OrderCreatedEventV2;

// 支持两个版本的处理器
class InventoryEventHandler {
  @OnEvent('ORDER_CREATED')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    const items = this.normalizeItems(event);
    await this.reserveStock(items);
  }

  private normalizeItems(event: OrderCreatedEvent): NormalizedItem[] {
    if (event.version === 1) {
      // V1：获取完整商品详情
      return this.enrichItems(event.items);
    } else {
      // V2：已有完整详情
      return event.items;
    }
  }
}
```

#### 3. 处理乱序事件

```typescript
class OrderedEventHandler {
  private eventBuffer: Map<string, DomainEvent[]> = new Map();
  private processedSequences: Map<string, number> = new Map();

  async handle(event: SequencedEvent): Promise<void> {
    const lastProcessed = this.processedSequences.get(event.correlationId) || 0;

    if (event.sequence === lastProcessed + 1) {
      // 有序 - 立即处理
      await this.processEvent(event);
      this.processedSequences.set(event.correlationId, event.sequence);

      // 检查缓冲区是否有后续事件
      await this.processBuffered(event.correlationId);
    } else if (event.sequence > lastProcessed + 1) {
      // 乱序 - 缓冲
      this.bufferEvent(event);
    }
    // 重复（sequence <= lastProcessed）- 忽略
  }

  private async processBuffered(correlationId: string): Promise<void> {
    const buffer = this.eventBuffer.get(correlationId) || [];
    let lastProcessed = this.processedSequences.get(correlationId) || 0;

    // 排序并按序处理
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

## 常见陷阱

### 编排陷阱

#### 1. 编排器成为瓶颈

```typescript
// 反模式：编排器做太多事
class MonolithicOrchestrator {
  async processOrder(order: Order): Promise<void> {
    // 编排器包含业务逻辑
    const discount = this.calculateDiscount(order);  // 应该在订单服务
    const tax = this.calculateTax(order);  // 应该在税务服务
    const shipping = this.calculateShipping(order);  // 应该在物流服务

    // 所有逻辑集中 - 变成单体
  }
}

// 更好：编排器只协调，服务包含逻辑
class LeanOrchestrator {
  async processOrder(order: Order): Promise<void> {
    // 只协调 - 服务处理自己的逻辑
    await this.orderService.processOrder(order);
    await this.inventoryService.reserve(order);
    await this.paymentService.charge(order);
    // 编排器无业务逻辑
  }
}
```

#### 2. 缺少补偿逻辑

```typescript
// 反模式：不完整的补偿
class IncompleteOrchestrator {
  async execute(): Promise<void> {
    try {
      await this.step1();
      await this.step2();
      await this.step3();
    } catch (error) {
      // 只补偿了 step3！
      await this.compensateStep3();
      throw error;
    }
  }
}

// 更好：跟踪所有需要补偿的步骤
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
      // 反序补偿所有已完成步骤
      for (const step of completed.reverse()) {
        await this.compensate(step);
      }
      throw error;
    }
  }
}
```

### 编舞陷阱

#### 1. 循环事件依赖

```typescript
// 反模式：事件形成循环
// 服务 A：ORDER_CREATED -> 服务 B
// 服务 B：INVENTORY_RESERVED -> 服务 C
// 服务 C：PAYMENT_COMPLETED -> 服务 A
// 服务 A：ORDER_CONFIRMED -> 服务 B（某种原因）
// 服务 B：SOMETHING_HAPPENED -> 服务 C
// ... 可能无限循环或复杂调试

// 更好：清晰的事件流，无循环
// 定义清晰的事件所有权和流向
/*
ORDER_CREATED
  -> INVENTORY_RESERVED
    -> PAYMENT_COMPLETED
      -> ORDER_CONFIRMED（终端事件）

失败事件：
INVENTORY_RESERVATION_FAILED -> ORDER_FAILED
PAYMENT_FAILED -> INVENTORY_RELEASED -> ORDER_FAILED
*/
```

#### 2. 缺少事件处理器

```typescript
// 反模式：事件无处理器
class IncompleteChoreography {
  @OnEvent('ORDER_CREATED')
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // 预留库存
    await this.reserveInventory(event.orderId);

    await this.eventBus.publish({
      type: 'INVENTORY_RESERVED',
      orderId: event.orderId
    });
  }

  // PAYMENT_FAILED 被发布但没有处理！
  // 库存永远被预留
}

// 更好：处理所有可能的事件
class CompleteChoreography {
  @OnEvent('PAYMENT_FAILED')
  async onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    // 释放预留库存
    await this.releaseInventory(event.orderId);

    // 通知预留已释放
    await this.eventBus.publish({
      type: 'INVENTORY_RELEASED',
      orderId: event.orderId
    });
  }
}
```

#### 3. 缺乏关联追踪

```typescript
// 反模式：无法追踪事件流
interface UntrackedEvent {
  type: string;
  orderId: string;
  timestamp: Date;
}

// 更好：包含关联和因果关系
interface TrackedEvent {
  eventId: string;           // 唯一事件标识
  type: string;
  correlationId: string;     // 分组相关事件（如 orderId）
  causationId: string;       // 导致此事件的事件 ID
  timestamp: Date;
  source: string;            // 发出事件的服务
}

// 现在可以追踪：
// 事件 A (causationId: null) -> 事件 B (causationId: A.eventId) -> 事件 C (causationId: B.eventId)
```

## 性能考量

### 编排性能

```typescript
// 优化编排延迟
class OptimizedOrchestrator {
  async execute(order: Order): Promise<void> {
    // 必要时顺序执行
    const reservation = await this.inventoryService.reserve(order);

    // 可能时并行执行
    const [payment, shipping] = await Promise.all([
      this.paymentService.charge(order, reservation),
      this.shippingService.calculate(order)
    ]);

    // 继续使用结果
    await this.orderService.confirm(order, { payment, shipping });
  }
}

// 添加超时防止挂起
class TimeoutOrchestrator {
  async executeWithTimeout(order: Order): Promise<void> {
    const stepTimeout = 5000; // 每步 5 秒

    await this.withTimeout(
      () => this.inventoryService.reserve(order),
      stepTimeout,
      '库存预留超时'
    );

    await this.withTimeout(
      () => this.paymentService.charge(order),
      stepTimeout,
      '支付处理超时'
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

### 编舞性能

```typescript
// 优化事件处理吞吐量
class OptimizedEventHandler {
  private readonly concurrency = 10;
  private readonly batchSize = 100;

  async processEvents(events: DomainEvent[]): Promise<void> {
    // 批量处理
    for (let i = 0; i < events.length; i += this.batchSize) {
      const batch = events.slice(i, i + this.batchSize);

      // 受控并发处理批次
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

// 生产者端事件批量优化
class BatchingEventBus {
  private buffer: DomainEvent[] = [];
  private flushInterval = 100; // 毫秒

  async publish(event: DomainEvent): Promise<void> {
    this.buffer.push(event);

    if (this.buffer.length >= 100) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    const events = this.buffer;
    this.buffer = [];

    // 批量发布到消息代理
    await this.broker.publishBatch(events);
  }
}
```

## 实战场景

### 场景：电商订单处理

```typescript
// 电商混合方式

// 1. 订单域内部使用编排
class OrderDomainOrchestrator {
  async submitOrder(cart: Cart, customer: Customer): Promise<Order> {
    // 编排：验证 -> 定价 -> 创建
    const validation = await this.validateCart(cart);
    const pricing = await this.calculatePricing(cart, customer);
    const order = await this.createOrder(cart, pricing, customer);

    // 发布给外部域
    await this.eventBus.publish({
      type: 'OrderSubmitted',
      order
    });

    return order;
  }
}

// 2. 跨域使用编舞
// 库存域
@OnEvent('OrderSubmitted')
async onOrderSubmitted(event: OrderSubmittedEvent): Promise<void> {
  await this.reserveInventory(event.order);
  await this.eventBus.publish({ type: 'InventoryReserved', orderId: event.order.id });
}

// 支付域
@OnEvent('InventoryReserved')
async onInventoryReserved(event: InventoryReservedEvent): Promise<void> {
  const payment = await this.processPayment(event.orderId);
  await this.eventBus.publish({ type: 'PaymentCompleted', orderId: event.orderId, paymentId: payment.id });
}

// 履约域
@OnEvent('PaymentCompleted')
async onPaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
  // 履约内部编排
  await this.fulfillmentOrchestrator.startFulfillment(event.orderId);
}
```

### 场景：银行交易处理

```typescript
// 银行通常偏好编排以获得控制和审计

class TransferOrchestrator {
  async executeTransfer(transfer: Transfer): Promise<TransferResult> {
    const saga = new TransferSaga(transfer);

    try {
      // 步骤 1：验证账户
      await saga.validateAccounts();

      // 步骤 2：欺诈检测
      const fraudCheck = await saga.checkFraud();
      if (fraudCheck.flagged) {
        return saga.flagForReview();
      }

      // 步骤 3：扣款
      await saga.debitSource();

      // 步骤 4：入账
      await saga.creditDestination();

      // 步骤 5：记录交易
      await saga.recordTransaction();

      // 步骤 6：发送通知
      await saga.sendNotifications();

      return saga.complete();
    } catch (error) {
      // 带审计的完整补偿
      await saga.compensateWithAudit();
      throw error;
    }
  }
}
```

## 面试要点

### 理解性问题

**问题 1：解释编舞和编排的区别。**

编排使用中央协调器显式控制工作流，告诉每个服务做什么以及何时做。编舞是去中心化的 - 服务响应事件并发布自己的事件，没有中央控制。

**问题 2：什么时候选择编排而非编舞？**

选择编排当：
- 工作流复杂，有条件逻辑
- 需要显式控制和可见性
- 错误处理和补偿复杂
- 需要审计跟踪
- 团队偏好显式工作流定义

**问题 3：编舞的主要挑战是什么？**

- 工作流可见性是隐式的，难以追踪
- 调试需要分布式追踪
- 确保所有事件都被处理
- 管理事件顺序
- 避免循环依赖
- 跨服务协调补偿

### 技术性问题

**问题 4：如何处理编舞中的失败？**

```typescript
// 使用补偿事件
@OnEvent('PAYMENT_FAILED')
async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
  // 发布补偿事件
  await this.eventBus.publish({
    type: 'RELEASE_INVENTORY_REQUESTED',
    orderId: event.orderId
  });
}

// 库存服务响应补偿
@OnEvent('RELEASE_INVENTORY_REQUESTED')
async handleReleaseRequest(event: ReleaseInventoryEvent): Promise<void> {
  await this.releaseInventory(event.orderId);
}
```

**问题 5：如何确保编舞中的精确一次处理？**

```typescript
// 幂等事件处理
class IdempotentHandler {
  async handle(event: DomainEvent): Promise<void> {
    // 检查是否已处理
    const processed = await this.eventLog.exists(event.eventId);
    if (processed) {
      return; // 已处理
    }

    // 使用幂等键处理
    await this.processEvent(event);

    // 标记为已处理
    await this.eventLog.markProcessed(event.eventId);
  }
}
```

## 延伸阅读

### 官方资源

- [Microsoft - Saga 模式](https://docs.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga)
- [AWS - Saga 编排](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/saga-pattern.html)
- [Temporal.io 文档](https://docs.temporal.io/) - 工作流编排平台

### 书籍

- 《微服务架构设计模式》Chris Richardson 著 - Saga 模式章节
- 《企业集成模式》Gregor Hohpe 著 - 事件驱动模式
- 《构建事件驱动微服务》Adam Bellemare 著

### 技术文章

- [Saga 模式 - microservices.io](https://microservices.io/patterns/data/saga.html)
- [无服务器领域的编舞 vs 编排](https://theburningmonk.com/2020/08/choreography-vs-orchestration-in-the-land-of-serverless/)
- [事件编舞 - Martin Fowler](https://martinfowler.com/articles/201701-event-driven.html)

### 工具

- [Temporal](https://temporal.io/) - 工作流编排平台
- [Camunda](https://camunda.com/) - BPM 和工作流自动化
- [Apache Kafka](https://kafka.apache.org/) - 用于编舞的事件流
- [AWS Step Functions](https://aws.amazon.com/step-functions/) - 无服务器编排

---

编舞和编排都是协调分布式工作流的强大模式。选择哪种取决于你对控制、可见性、耦合和可扩展性的具体需求。许多成功的系统使用混合方式，在限界上下文内应用编排，跨域边界使用编舞。理解每种模式的权衡使你能够为分布式系统做出明智的架构决策。
