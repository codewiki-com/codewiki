---
title: Temporal 工作流引擎
description: Temporal 完全指南 - 用于构建可靠分布式应用的持久执行平台
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
origin: old/src/content/docs/backend/temporal.zh.md
divergence: 0.223
issues: []
legacy:
  category: Backend
  subcategory: Workflow
  order: 32
  lastUpdated: 2026-01-20
---

Temporal 是一个持久执行平台，它使开发者能够构建可靠的分布式应用，而无需手动管理状态、处理故障或实现重试逻辑。与传统的消息队列或工作流引擎不同，Temporal 保证你的代码即使在发生故障的情况下也能运行到完成，这使其成为构建关键业务流程的绝佳选择。

## 理解 Temporal

### 什么是 Temporal？

Temporal 是一个开源的持久执行系统，它抽象了构建可靠分布式系统的复杂性。从本质上讲，Temporal 提供了一种编程模型，你的应用代码可以编写为简单的函数，而平台处理分布式计算的所有困难部分：状态持久化、故障恢复、重试等等。

可以把 Temporal 看作是代码的"时间机器"。当你的应用崩溃时，Temporal 可以重放执行历史，将你的工作流恢复到崩溃前的精确位置，然后继续执行。这与传统方法有本质区别，传统方法中故障意味着状态丢失和手动恢复。

### Temporal 与传统方案对比

| 方面 | 传统消息队列 | 传统工作流引擎 | Temporal |
|------|-------------|---------------|----------|
| 编程模型 | 异步消息处理器 | 状态机 / BPMN | 原生代码（函数） |
| 状态管理 | 外部（数据库） | 内置（有限） | 内置（无限制） |
| 故障处理 | 手动重试逻辑 | 有限的重试策略 | 自动重放恢复 |
| 长时间运行任务 | 需要复杂模式 | 支持 | 原生支持 |
| 调试 | 日志分析 | 工作流图 | 事件历史 + 重放 |
| 测试 | 集成测试 | 专用工具 | 单元测试 |
| 版本控制 | 消息模式 | 工作流定义 | 代码版本控制 |

### Temporal 解决的问题

**1. 分布式事务复杂性**

没有 Temporal，协调跨多个服务的事务需要从头实现复杂的模式，如 Saga、两阶段提交或事件溯源。Temporal 原生处理这些问题。

**2. 故障恢复**

传统系统在进程崩溃时会丢失状态。Temporal 持久化每个状态转换，实现无数据丢失的自动恢复。

**3. 长时间运行的流程**

跨越数小时、数天甚至数年的业务流程在 Temporal 中可以自然建模。处理超时或保持连接存活不需要特殊模式。

**4. 可见性和调试**

Temporal 提供完整的执行历史，使得可以准确了解任何工作流在任何时间点发生了什么。

## 核心架构

### 关键组件

```
┌─────────────────────────────────────────────────────────────────┐
│                        Temporal 集群                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Frontend   │  │   History   │  │       Matching          │ │
│  │  Service    │  │   Service   │  │       Service           │ │
│  │  前端服务    │  │   历史服务   │  │       匹配服务           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    持久化层                              │   │
│  │        (PostgreSQL / MySQL / Cassandra / 等)            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ gRPC
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Worker 进程                             │
│  ┌─────────────────────┐      ┌─────────────────────┐          │
│  │  Workflow Worker    │      │  Activity Worker     │          │
│  │  （确定性）          │      │  （可有副作用）       │          │
│  └─────────────────────┘      └─────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow（工作流）

Workflow 是 Temporal 中编排的核心单元。它是一个定义业务流程序列和逻辑的函数。工作流必须是**确定性的**——给定相同的输入，它们必须始终产生相同的命令序列。

```typescript
// TypeScript 工作流定义
import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

const { sendEmail, processPayment, updateInventory } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 3,
  },
});

export async function orderWorkflow(order: Order): Promise<OrderResult> {
  // 步骤 1: 处理支付
  const paymentResult = await processPayment(order.paymentInfo);

  // 步骤 2: 更新库存
  await updateInventory(order.items);

  // 步骤 3: 发送确认邮件
  await sendEmail(order.customerEmail, '订单已确认！');

  // 步骤 4: 等待发货（可能需要几天）
  await sleep('3 days');

  // 步骤 5: 如需要发送发货提醒
  await sendEmail(order.customerEmail, '您的订单正在配送中！');

  return { status: 'completed', paymentId: paymentResult.id };
}
```

### Activity（活动）

Activity 是执行实际工作的构建块——调用外部服务、访问数据库或任何有副作用的操作。与 Workflow 不同，Activity 可以是非确定性的，并且可能失败。

```typescript
// TypeScript Activity 定义
import { Context } from '@temporalio/activity';

export async function processPayment(paymentInfo: PaymentInfo): Promise<PaymentResult> {
  const context = Context.current();

  // 长时间运行的活动发送心跳
  context.heartbeat('正在处理支付...');

  // 调用外部支付服务
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
    throw new Error(`支付失败: ${response.statusText}`);
  }

  return await response.json();
}

export async function sendEmail(to: string, subject: string): Promise<void> {
  // 邮件发送逻辑
  await emailService.send({ to, subject });
}

export async function updateInventory(items: OrderItem[]): Promise<void> {
  for (const item of items) {
    await inventoryDb.decrement(item.sku, item.quantity);
  }
}
```

### Worker（工作器）

Worker 是托管和执行 Workflow 和 Activity 的进程。它们从 Temporal 服务器轮询任务并执行它们。

```typescript
// TypeScript Worker 设置
import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'order-processing',
    // Worker 配置
    maxConcurrentActivityTaskExecutions: 100,
    maxConcurrentWorkflowTaskExecutions: 100,
  });

  console.log('Worker 已启动');
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### 事件溯源与确定性重放

Temporal 使用事件溯源来持久化工作流状态。工作流中的每个操作都会生成存储在事件历史中的事件。

```
订单工作流的事件历史:
┌────┬──────────────────────────────────────────┬─────────────────────┐
│ ID │ 事件类型                                  │ 时间戳              │
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

当工作流需要恢复时（例如，在 worker 崩溃后），Temporal 重放事件历史。工作流代码再次运行，但不是执行活动，而是从历史中检索结果。这就是为什么工作流必须是确定性的——任何非确定性都会导致重放与原始执行产生分歧。

## 核心概念深入

### Workflow 定义

**TypeScript 示例：**

```typescript
import {
  proxyActivities,
  defineSignal,
  defineQuery,
  setHandler,
  condition,
  sleep
} from '@temporalio/workflow';

// 定义信号和查询
export const updateStatusSignal = defineSignal<[string]>('updateStatus');
export const getStatusQuery = defineQuery<string>('getStatus');

interface OrderState {
  status: string;
  items: Item[];
}

export async function orderWorkflow(initialOrder: Order): Promise<OrderResult> {
  // 工作流状态
  const state: OrderState = {
    status: 'pending',
    items: initialOrder.items,
  };

  // 信号处理器 - 允许外部输入
  setHandler(updateStatusSignal, (newStatus: string) => {
    state.status = newStatus;
  });

  // 查询处理器 - 允许外部读取
  setHandler(getStatusQuery, () => state.status);

  // 工作流逻辑
  const activities = proxyActivities<typeof import('./activities')>({
    startToCloseTimeout: '1 minute',
  });

  // 处理订单
  await activities.validateOrder(state.items);
  state.status = 'validated';

  await activities.chargeCustomer(initialOrder.payment);
  state.status = 'charged';

  // 等待发货确认或超时
  const shipped = await condition(() => state.status === 'shipped', '7 days');

  if (!shipped) {
    // 处理超时 - 可能需要退款
    await activities.refundCustomer(initialOrder.payment);
    return { success: false, reason: '发货超时' };
  }

  return { success: true };
}
```

**Go 示例：**

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

    // Activity 选项
    ao := workflow.ActivityOptions{
        StartToCloseTimeout: time.Minute,
        RetryPolicy: &temporal.RetryPolicy{
            MaximumAttempts: 3,
        },
    }
    ctx = workflow.WithActivityOptions(ctx, ao)

    // 状态更新的信号通道
    statusChan := workflow.GetSignalChannel(ctx, "updateStatus")

    // 查询处理器
    err := workflow.SetQueryHandler(ctx, "getStatus", func() (string, error) {
        return state.Status, nil
    })
    if err != nil {
        return nil, err
    }

    // 处理订单
    var validationResult ValidationResult
    err = workflow.ExecuteActivity(ctx, ValidateOrder, state.Items).Get(ctx, &validationResult)
    if err != nil {
        return nil, err
    }
    state.Status = "validated"

    // 向客户收费
    var chargeResult ChargeResult
    err = workflow.ExecuteActivity(ctx, ChargeCustomer, order.Payment).Get(ctx, &chargeResult)
    if err != nil {
        return nil, err
    }
    state.Status = "charged"

    // 等待发货或超时
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
        // 达到超时
    })
    selector.Select(ctx)

    if !shipped {
        // 超时退款
        err = workflow.ExecuteActivity(ctx, RefundCustomer, order.Payment).Get(ctx, nil)
        if err != nil {
            logger.Error("退款失败", "error", err)
        }
        return &OrderResult{Success: false, Reason: "发货超时"}, nil
    }

    return &OrderResult{Success: true}, nil
}
```

**Python 示例：**

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

        # 配置 activities
        retry_policy = RetryPolicy(maximum_attempts=3)

        # 验证订单
        await workflow.execute_activity(
            validate_order,
            self.state.items,
            start_to_close_timeout=timedelta(minutes=1),
            retry_policy=retry_policy,
        )
        self.state.status = "validated"

        # 向客户收费
        await workflow.execute_activity(
            charge_customer,
            order.payment,
            start_to_close_timeout=timedelta(minutes=1),
            retry_policy=retry_policy,
        )
        self.state.status = "charged"

        # 等待发货或超时
        try:
            await workflow.wait_condition(
                lambda: self.state.status == "shipped",
                timeout=timedelta(days=7),
            )
        except asyncio.TimeoutError:
            # 超时退款
            await workflow.execute_activity(
                refund_customer,
                order.payment,
                start_to_close_timeout=timedelta(minutes=1),
            )
            return OrderResult(success=False, reason="发货超时")

        return OrderResult(success=True)

    @workflow.signal
    async def update_status(self, new_status: str):
        self.state.status = new_status

    @workflow.query
    def get_status(self) -> str:
        return self.state.status
```

### Activity 实现

Activity 应该设计为具有幂等性和适当的错误处理：

```typescript
// 具有最佳实践的 TypeScript Activity
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

  console.log(`处理订单 ${orderId} 的支付，第 ${attempt} 次尝试`);

  try {
    // 检查现有事务（幂等性）
    const existing = await paymentDb.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      console.log(`返回现有事务: ${existing.transactionId}`);
      return existing;
    }

    // 长时间操作发送心跳
    context.heartbeat('正在发起支付...');

    // 使用外部提供商处理支付
    const result = await paymentProvider.charge({
      amount,
      currency: 'USD',
      idempotencyKey,
    });

    context.heartbeat('支付已处理，正在保存结果...');

    // 保存事务以确保幂等性
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
    // 区分可重试和不可重试的错误
    if (error.code === 'CARD_DECLINED') {
      // 不可重试的业务错误
      throw ApplicationFailure.nonRetryable(
        '支付被拒绝',
        'PAYMENT_DECLINED',
        { orderId, reason: error.message }
      );
    }

    if (error.code === 'NETWORK_ERROR') {
      // 可重试的基础设施错误
      throw ApplicationFailure.retryable(
        '支付服务不可用',
        'PAYMENT_SERVICE_UNAVAILABLE'
      );
    }

    // 未知错误 - 让重试策略处理
    throw error;
  }
}
```

### 信号与查询

信号允许外部系统向运行中的工作流发送数据：

```typescript
// 从客户端发送信号
import { Client } from '@temporalio/client';

async function approveOrder(workflowId: string) {
  const client = new Client();
  const handle = client.workflow.getHandle(workflowId);

  // 向工作流发送信号
  await handle.signal('approval', { approved: true, approver: 'admin@company.com' });
}

// 查询工作流状态
async function getOrderStatus(workflowId: string): Promise<string> {
  const client = new Client();
  const handle = client.workflow.getHandle(workflowId);

  // 查询工作流
  return await handle.query('getStatus');
}
```

### 定时器与休眠

Temporal 定时器是持久的——它们在进程重启后仍然存在：

```typescript
import { sleep, condition } from '@temporalio/workflow';

export async function subscriptionWorkflow(userId: string): Promise<void> {
  // 休眠 30 天 - 工作流会自动唤醒
  await sleep('30 days');

  // 收取下一个计费周期的费用
  await activities.chargeSubscription(userId);

  // 无限继续
  await subscriptionWorkflow(userId); // 递归调用（长时间运行使用 Continue-As-New）
}

// 长时间运行工作流的更好模式
export async function subscriptionWorkflowWithContinueAsNew(
  userId: string,
  billingCycle: number = 1
): Promise<void> {
  await sleep('30 days');
  await activities.chargeSubscription(userId);

  // Continue-As-New 避免历史增长
  await workflow.continueAsNew<typeof subscriptionWorkflowWithContinueAsNew>(
    userId,
    billingCycle + 1
  );
}
```

### 子工作流

复杂的工作流可以生成子工作流以实现模块化：

```typescript
import { executeChild, startChild, ParentClosePolicy } from '@temporalio/workflow';

export async function parentWorkflow(order: Order): Promise<void> {
  // 执行子工作流并等待结果
  const result = await executeChild(paymentWorkflow, {
    args: [order.payment],
    workflowId: `payment-${order.id}`,
  });

  // 启动子工作流但不等待（即发即忘）
  const childHandle = await startChild(notificationWorkflow, {
    args: [order.customerEmail],
    workflowId: `notification-${order.id}`,
    parentClosePolicy: ParentClosePolicy.ABANDON, // 父工作流完成后子工作流继续
  });

  // 并行处理多个项目
  const itemPromises = order.items.map((item, index) =>
    executeChild(processItemWorkflow, {
      args: [item],
      workflowId: `item-${order.id}-${index}`,
    })
  );

  await Promise.all(itemPromises);
}
```

## 最佳实践

### 工作流设计模式

**1. 分布式事务的 Saga 模式：**

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
    // 按相反顺序补偿
    for (const step of completedSteps.reverse()) {
      try {
        await step.compensate();
      } catch (compensateError) {
        // 记录但继续补偿
        console.error('补偿失败:', compensateError);
      }
    }

    return { success: false, error: error.message };
  }
}
```

**2. 状态机模式：**

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
      throw new Error(`无效的状态转换：从 ${machine.state} 到 ${newState}`);
    }
    machine.state = newState;
  };

  // 当前状态查询
  setHandler(getStateQuery, () => machine.state);

  // 触发转换的信号
  setHandler(transitionSignal, async (event: TransitionEvent) => {
    try {
      transition(event.targetState);
    } catch (error) {
      // 无效转换 - 忽略或处理
    }
  });

  // 基于活动的自动转换
  await activities.validateOrder(order);
  transition('validated');

  await activities.processPayment(order.payment);
  transition('paid');

  // 等待外部发货确认
  await condition(() => machine.state === 'shipped', '30 days');

  // 最终交付确认
  await condition(() => machine.state === 'delivered', '14 days');
}
```

**3. 轮询模式：**

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
      throw ApplicationFailure.nonRetryable('资源创建失败');
    }

    // 下次轮询前等待
    await sleep(pollInterval);
  }

  throw ApplicationFailure.nonRetryable('资源创建超时');
}
```

### 错误处理

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
        // 应用级错误
        if (cause.type === 'BUSINESS_RULE_VIOLATION') {
          // 处理业务错误
          return { status: 'rejected', reason: cause.message };
        }
      }

      // Activity 在所有重试后失败
      await activities.notifyFailure(input, error.message);
      throw error;
    }

    if (error instanceof CancelledFailure) {
      // 工作流被取消
      await activities.cleanup(input);
      throw error;
    }

    // 意外错误
    throw error;
  }
}

// 具有详细错误类型的 Activity
export async function processOrder(orderId: string): Promise<void> {
  const order = await db.getOrder(orderId);

  if (!order) {
    throw ApplicationFailure.nonRetryable(
      '订单未找到',
      'ORDER_NOT_FOUND',
      { orderId }
    );
  }

  if (order.status === 'cancelled') {
    throw ApplicationFailure.nonRetryable(
      '订单已取消',
      'ORDER_CANCELLED',
      { orderId, cancelledAt: order.cancelledAt }
    );
  }

  if (!await inventoryService.checkAvailability(order.items)) {
    throw ApplicationFailure.retryable(
      '库存暂时不可用',
      'INVENTORY_UNAVAILABLE'
    );
  }

  // 处理订单...
}
```

### 工作流版本控制

更新工作流逻辑时，使用版本控制来保持向后兼容性：

```typescript
import { patched, deprecatePatch } from '@temporalio/workflow';

export async function orderWorkflow(order: Order): Promise<void> {
  // 原始逻辑
  await activities.validateOrder(order);

  // 版本 1: 添加欺诈检查
  if (patched('fraud-check-v1')) {
    await activities.checkFraud(order);
  }

  await activities.processPayment(order.payment);

  // 版本 2: 更改发货逻辑
  if (patched('new-shipping-v2')) {
    // 新的发货逻辑，带承运商选择
    const carrier = await activities.selectCarrier(order);
    await activities.shipWithCarrier(order, carrier);
  } else {
    // 旧的发货逻辑
    await activities.ship(order);
  }

  // 所有使用旧版本的工作流完成后，
  // 弃用该补丁
  // deprecatePatch('fraud-check-v1');
}
```

## 常见陷阱

### 1. 非确定性代码

工作流必须是确定性的。避免这些模式：

```typescript
// 错误: 非确定性操作
export async function badWorkflow(): Promise<void> {
  // 随机值在重放时会改变
  const id = Math.random(); // 错误
  const id2 = crypto.randomUUID(); // 错误

  // 当前时间在重放时会改变
  const now = new Date(); // 错误

  // 外部状态可能会改变
  const config = process.env.SOME_CONFIG; // 错误

  // 工作流中的网络调用
  const data = await fetch('https://api.example.com'); // 错误
}

// 正确: 确定性模式
import { uuid4, sleep } from '@temporalio/workflow';

export async function goodWorkflow(): Promise<void> {
  // 使用工作流提供的随机数
  const id = uuid4();

  // 使用工作流时间（重放时一致）
  const now = new Date(); // 实际上是可以的 - Temporal 会修补 Date

  // 通过 activities 获取配置
  const config = await activities.getConfig();

  // 所有外部调用都通过 activities
  const data = await activities.fetchData();
}
```

### 2. Activity 超时配置错误

```typescript
// 错误: 未指定超时
const activities = proxyActivities({
  // 缺少超时 - 将使用默认值
});

// 错误: 超时对于操作来说太短
const activities = proxyActivities({
  startToCloseTimeout: '5 seconds', // 对支付处理来说太短
});

// 正确: 适当的超时
const quickActivities = proxyActivities<typeof import('./activities')>({
  startToCloseTimeout: '30 seconds',
});

const longActivities = proxyActivities<typeof import('./activities')>({
  startToCloseTimeout: '10 minutes',
  heartbeatTimeout: '30 seconds', // 用于进度跟踪
});

// 带心跳的 Activity
export async function longRunningActivity(): Promise<void> {
  const ctx = Context.current();

  for (let i = 0; i < 1000; i++) {
    await processItem(i);
    ctx.heartbeat(`已处理 ${i + 1}/1000 项`);
  }
}
```

### 3. 工作流历史过大

```typescript
// 错误: 无界循环创建巨大的历史
export async function badLoopWorkflow(): Promise<void> {
  while (true) {
    await activities.poll();
    await sleep('1 minute');
    // 历史无限增长！
  }
}

// 正确: 使用 Continue-As-New
export async function goodLoopWorkflow(iteration: number = 0): Promise<void> {
  const maxIterations = 1000;

  for (let i = 0; i < maxIterations; i++) {
    await activities.poll();
    await sleep('1 minute');
  }

  // 使用 Continue-As-New 重置历史
  await workflow.continueAsNew<typeof goodLoopWorkflow>(iteration + maxIterations);
}

// 也正确: 外部编排
export async function singleIterationWorkflow(): Promise<void> {
  await activities.poll();
  // 外部调度器每次启动新工作流
}
```

### 4. 缺少幂等性

```typescript
// 错误: Activity 不是幂等的
export async function chargeCustomer(amount: number): Promise<void> {
  // 重试时可能重复扣费
  await paymentService.charge(amount);
}

// 正确: 幂等 Activity
export async function chargeCustomer(
  amount: number,
  idempotencyKey: string
): Promise<ChargeResult> {
  // 检查是否已扣费
  const existing = await db.findCharge(idempotencyKey);
  if (existing) {
    return existing;
  }

  const result = await paymentService.charge(amount, { idempotencyKey });
  await db.saveCharge(idempotencyKey, result);

  return result;
}
```

## 性能考量

### Worker 调优

```typescript
import { Worker, NativeConnection } from '@temporalio/worker';

async function createOptimizedWorker() {
  // 创建带调优的连接
  const connection = await NativeConnection.connect({
    address: 'temporal:7233',
  });

  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'high-throughput',

    // 并发设置
    maxConcurrentActivityTaskExecutions: 200,
    maxConcurrentWorkflowTaskExecutions: 200,
    maxConcurrentLocalActivityExecutions: 200,

    // 粘性队列优化
    maxCachedWorkflows: 2000,
    stickyQueueScheduleToStartTimeout: '10 seconds',

    // 速率限制
    maxTaskQueueActivitiesPerSecond: 1000,
    maxActivitiesPerSecond: 500,
  });

  return worker;
}
```

### 批量处理

```typescript
export async function batchProcessingWorkflow(items: Item[]): Promise<void> {
  const BATCH_SIZE = 100;
  const CONCURRENT_BATCHES = 10;

  // 分割成批次
  const batches: Item[][] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }

  // 使用受控并发处理批次
  for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
    const currentBatches = batches.slice(i, i + CONCURRENT_BATCHES);

    await Promise.all(
      currentBatches.map((batch, index) =>
        activities.processBatch(batch, i + index)
      )
    );
  }
}

// 为批次优化的 Activity
export async function processBatch(items: Item[], batchId: number): Promise<void> {
  const ctx = Context.current();

  // 批量数据库操作
  await db.bulkInsert(items);

  ctx.heartbeat(`批次 ${batchId} 完成`);
}
```

### 分片策略

```typescript
// 将负载分布到多个任务队列
function getTaskQueue(workflowId: string): string {
  const shardCount = 10;
  const hash = simpleHash(workflowId);
  const shard = hash % shardCount;
  return `orders-shard-${shard}`;
}

// 每个分片启动 worker
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

// 客户端在适当的分片上启动工作流
async function startOrder(order: Order) {
  const taskQueue = getTaskQueue(order.id);

  await client.workflow.start(orderWorkflow, {
    workflowId: order.id,
    taskQueue,
    args: [order],
  });
}
```

## 实战场景

### 电商订单处理

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
    // 阶段 1: 验证订单
    state.phase = 'validating';
    await activities.validateOrder(order);

    if (cancellationRequested) {
      return await handleCancellation(state, order, activities);
    }

    // 阶段 2: 预留库存
    state.phase = 'reserving_inventory';
    await activities.reserveInventory(order.items);

    if (cancellationRequested) {
      await activities.releaseInventory(order.items);
      return await handleCancellation(state, order, activities);
    }

    // 阶段 3: 处理支付
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

    // 阶段 4: 履行订单
    state.phase = 'fulfilling';
    const shipment = await activities.createShipment(order);
    state.shippingStatus = 'in_progress';

    // 阶段 5: 等待交付（带超时）
    state.phase = 'shipping';
    const delivered = await condition(
      () => state.shippingStatus === 'delivered',
      '30 days'
    );

    if (!delivered) {
      // 处理交付超时
      await activities.investigateShipment(shipment.trackingId);
    }

    // 阶段 6: 完成
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

### 使用 Saga 的支付处理

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
    // 步骤 1: 创建支付意向
    const intent = await activities.createPaymentIntent({
      amount: input.amount,
      customerId: input.customerId,
    });
    saga.addCompensation(() => activities.cancelPaymentIntent(intent.id));

    // 步骤 2: 验证欺诈
    const fraudCheck = await activities.performFraudCheck({
      customerId: input.customerId,
      amount: input.amount,
      items: input.items,
    });

    if (fraudCheck.riskScore > 0.8) {
      throw ApplicationFailure.nonRetryable(
        '检测到高欺诈风险',
        'FRAUD_DETECTED'
      );
    }

    // 步骤 3: 预留资金
    const reservation = await activities.reserveFunds({
      intentId: intent.id,
      amount: input.amount,
    });
    saga.addCompensation(() => activities.releaseFunds(reservation.id));

    // 步骤 4: 分配库存
    const allocation = await activities.allocateInventory(input.items);
    saga.addCompensation(() => activities.deallocateInventory(allocation.id));

    // 步骤 5: 捕获支付
    const capture = await activities.capturePayment(intent.id);
    // 捕获没有补偿 - 这是最后一步

    // 步骤 6: 确认订单
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
    // 按相反顺序执行补偿
    await saga.compensate();

    throw error;
  }
}

class SagaBuilder {
  private compensations: (() => Promise<void>)[] = [];

  addCompensation(fn: () => Promise<void>) {
    this.compensations.unshift(fn); // 添加到前面以实现相反顺序
  }

  async compensate() {
    for (const compensation of this.compensations) {
      try {
        await compensation();
      } catch (error) {
        // 记录但继续
        console.error('补偿失败:', error);
      }
    }
  }
}
```

### 数据管道

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

  // 设置监控查询
  setHandler(getMetricsQuery, () => metrics);

  // 步骤 1: 提取数据
  const extractResult = await activities.extractData({
    source: config.source,
    query: config.extractQuery,
    batchSize: config.batchSize,
  });

  // 步骤 2: 并行批次转换
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

  // 步骤 3: 加载成功的批次
  const successfulBatches = transformedBatches
    .filter((r): r is PromiseFulfilledResult<TransformResult> => r.status === 'fulfilled')
    .map(r => r.value);

  for (const batch of successfulBatches) {
    await activities.loadData({
      destination: config.destination,
      data: batch.data,
    });
  }

  // 步骤 4: 处理失败
  const failedBatches = transformedBatches
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected');

  if (failedBatches.length > 0) {
    await activities.reportFailures({
      pipelineId: config.id,
      failures: failedBatches.map(f => f.reason),
    });
  }

  // 步骤 5: 生成报告
  metrics.endTime = Date.now();
  await activities.generateReport(metrics);

  return {
    success: failedBatches.length === 0,
    metrics,
  };
}
```

### 订阅计费

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
    // 等待计费日期
    await sleep(subscription.billingInterval);

    if (cancelled) break;

    currentPeriod++;

    try {
      // 尝试计费
      await activities.chargeSubscription({
        subscriptionId: subscription.id,
        amount: subscription.amount,
        period: currentPeriod,
      });

      // 发送收据
      await activities.sendReceipt({
        email: subscription.customerEmail,
        amount: subscription.amount,
        period: currentPeriod,
      });

    } catch (error) {
      // 支付失败 - 进入催款流程
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

    // Continue-As-New 防止历史增长
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

      return true; // 支付成功
    } catch {
      // 继续下一次尝试
    }
  }

  return false; // 所有重试都失败
}
```

## 面试要点

### 概念问题

**Q1: Temporal 与 RabbitMQ 或 Kafka 等传统消息队列有什么不同？**

答：关键区别包括：
- **编程模型**：Temporal 使用原生代码函数 vs 事件处理器
- **状态管理**：Temporal 自动持久化工作流状态 vs 手动数据库管理
- **故障处理**：自动重放和恢复 vs 手动重试逻辑
- **长时间运行流程**：原生支持持久定时器 vs 需要复杂模式
- **调试**：完整的事件历史 vs 分散的日志

**Q2: 解释确定性重放的概念及其重要性。**

答：确定性重放是 Temporal 在故障后恢复工作流状态的方式。当工作流需要恢复时，Temporal 重放历史中的所有事件。工作流代码再次运行，但活动结果来自历史而不是再次执行。这要求工作流是确定性的——相同的输入必须产生相同的命令序列。非确定性（如没有 Temporal 包装器的 `Math.random()` 或 `Date.now()`）会导致重放与原始执行产生分歧，破坏恢复。

**Q3: Workflow 和 Activity 有什么区别？**

答：
- **Workflow**：编排逻辑，必须是确定性的，没有 I/O 操作，自动持久化和可恢复
- **Activity**：实际工作执行，可以有副作用，与外部系统交互，有重试策略，可能失败并重试

**Q4: Temporal 如何处理"恰好一次"语义问题？**

答：Temporal 通过以下方式提供"有效一次"语义：
1. **工作流 ID 唯一性**：每个工作流 ID 只能有一个运行中的执行
2. **Activity 幂等性令牌**：内置支持幂等性键
3. **确定性重放**：失败的工作流从中断处精确恢复
4. **事件溯源**：完整的历史防止重复处理

### 技术问题

**Q5: 如何处理需要无限期运行的工作流？**

答：使用 Continue-As-New 防止无界历史增长：

```typescript
export async function longRunningWorkflow(state: State): Promise<void> {
  const maxIterations = 1000;

  for (let i = 0; i < maxIterations; i++) {
    await activities.processItem();
    state.processed++;
  }

  // 使用新历史继续
  await workflow.continueAsNew<typeof longRunningWorkflow>(state);
}
```

**Q6: 如何在不破坏运行中工作流的情况下对工作流代码进行版本控制？**

答：使用 `patched` API 进行逻辑分支：

```typescript
if (patched('v2-shipping')) {
  // 新逻辑
  await activities.newShippingMethod();
} else {
  // 旧逻辑
  await activities.oldShippingMethod();
}
```

**Q7: 存在哪些超时类型，何时应该使用每种类型？**

答：
- **Schedule-To-Start**：从任务创建到 worker 接收的时间（检测队列问题）
- **Start-To-Close**：从 worker 接收到完成的时间（主要执行超时）
- **Schedule-To-Close**：从创建到完成的总时间（端到端超时）
- **Heartbeat**：对于长活动，检测执行中的 worker 故障

**Q8: 如何使用 Temporal 实现分布式事务？**

答：使用 Saga 模式与补偿事务：

```typescript
const saga = [];
try {
  await step1(); saga.push(compensate1);
  await step2(); saga.push(compensate2);
  await step3(); // 最后一步，没有补偿
} catch {
  // 按相反顺序补偿
  for (const compensate of saga.reverse()) {
    await compensate();
  }
}
```

### 架构问题

**Q9: 如何为高吞吐量扩展 Temporal？**

答：
1. **多任务队列**：按 ID 哈希将工作流分片到队列
2. **Worker 扩展**：每个任务队列水平扩展 worker
3. **调优并发**：调整 `maxConcurrentActivityTaskExecutions`
4. **数据库优化**：适当的索引、连接池
5. **Activity 批处理**：在单个活动中处理多个项目

**Q10: 使用 Temporal 的权衡是什么？**

答：
- **优点**：可靠性、可见性、简化的错误处理、持久定时器
- **缺点**：基础设施复杂性、确定性约束、学习曲线、长工作流的事件历史大小
- **何时使用**：关键任务流程、长时间运行操作、分布式事务
- **何时不使用**：简单的请求-响应、实时低延迟需求、无状态操作

## 延伸阅读

### 官方资源

- [Temporal 文档](https://docs.temporal.io/)
- [Temporal TypeScript SDK](https://typescript.temporal.io/)
- [Temporal Go SDK](https://pkg.go.dev/go.temporal.io/sdk)
- [Temporal Python SDK](https://python.temporal.io/)
- [Temporal Java SDK](https://www.javadoc.io/doc/io.temporal/temporal-sdk/latest/index.html)

### 学习资源

- [Temporal 101 课程](https://learn.temporal.io/courses/temporal_101/)
- [Temporal 示例仓库](https://github.com/temporalio/samples-typescript)
- [Temporal 社区论坛](https://community.temporal.io/)
- [Temporal 博客](https://temporal.io/blog)

### 相关主题

- [事件溯源模式](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Saga 模式](https://microservices.io/patterns/data/saga.html)
- [分布式系统概念](https://dataintensive.net/)

### 生产部署

- [Temporal Cloud](https://temporal.io/cloud)
- [自托管部署指南](https://docs.temporal.io/self-hosted-guide)
- [Kubernetes Helm Charts](https://github.com/temporalio/helm-charts)
- [可观测性设置](https://docs.temporal.io/production-deployment/observability)

通过掌握 Temporal，你获得了构建天生可靠、可观察和可维护的应用的能力。当构建需要优雅处理故障并在分布式操作中保持一致性的系统时，学习其概念的投资将获得巨大回报。
