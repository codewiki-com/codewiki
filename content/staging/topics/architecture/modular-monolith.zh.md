---
title: 模块化单体架构
description: 学习模块化单体架构作为微服务的替代方案
track: architecture
section: design-patterns
difficulty: intermediate
tags:
  - 模块化单体
  - 架构
  - 微服务替代
  - 解耦
status: imported
origin: old/src/content/docs/architecture/modular-monolith.zh.md
divergence: 0.23
issues: []
legacy:
  category: Architecture
  subcategory: Patterns
  order: 20
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是模块化单体架构

模块化单体架构（Modular Monolith）是一种介于传统单体架构和微服务架构之间的架构模式。它在单一部署单元内保持模块化的组织结构，每个模块拥有明确的边界、独立的业务逻辑和数据存储，但所有模块仍然运行在同一个进程中。

这种架构模式结合了单体架构的简单性和微服务架构的模块化优势，被越来越多的团队视为构建复杂系统的务实选择。

### 核心设计原则

1. **高内聚、低耦合**：每个模块专注于单一业务领域，模块间依赖最小化
2. **明确的边界**：模块之间通过定义良好的接口通信，禁止直接访问内部实现
3. **独立的数据所有权**：每个模块拥有并管理自己的数据，禁止跨模块直接访问数据库表
4. **单一部署单元**：所有模块打包为一个应用程序进行部署

---

## 三种架构对比

### 传统单体 vs 微服务 vs 模块化单体

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           传统单体架构                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        紧密耦合的代码                                  │   │
│  │   User ←→ Order ←→ Payment ←→ Inventory ←→ Shipping                 │   │
│  │        ↘      ↙         ↘       ↙          ↘      ↙                  │   │
│  │              共享数据库（所有表混在一起）                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           微服务架构                                         │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐               │
│  │ User   │  │ Order  │  │Payment │  │Inventory│ │Shipping│               │
│  │Service │  │Service │  │Service │  │Service │  │Service │               │
│  └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘               │
│      │           │           │           │           │                     │
│      ↓           ↓           ↓           ↓           ↓                     │
│  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐                 │
│  │ DB   │    │ DB   │    │ DB   │    │ DB   │    │ DB   │                 │
│  └──────┘    └──────┘    └──────┘    └──────┘    └──────┘                 │
│          网络通信 (HTTP/gRPC/消息队列)                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        模块化单体架构                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      单一部署单元                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │   User   │  │  Order   │  │ Payment  │  │Inventory │            │   │
│  │  │  Module  │  │  Module  │  │  Module  │  │  Module  │            │   │
│  │  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │            │   │
│  │  │ │Public│ │  │ │Public│ │  │ │Public│ │  │ │Public│ │            │   │
│  │  │ │ API  │ │  │ │ API  │ │  │ │ API  │ │  │ │ API  │ │            │   │
│  │  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │            │   │
│  │  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │            │   │
│  │  │ │Schema│ │  │ │Schema│ │  │ │Schema│ │  │ │Schema│ │            │   │
│  │  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │            │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│  │              进程内通信（方法调用/事件）                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                           同一数据库（不同 Schema）                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 详细对比表

| 特征 | 传统单体 | 模块化单体 | 微服务 |
|------|---------|-----------|--------|
| **部署单元** | 单一 | 单一 | 多个独立服务 |
| **代码组织** | 按技术层分层 | 按业务模块划分 | 独立代码库 |
| **模块边界** | 模糊或无 | 明确强制 | 服务边界 |
| **数据隔离** | 共享所有表 | 模块独立 Schema | 独立数据库 |
| **通信方式** | 直接方法调用 | 公共接口/事件 | 网络调用 |
| **技术栈** | 统一 | 统一 | 可异构 |
| **扩展性** | 整体扩展 | 整体扩展 | 独立扩展 |
| **部署复杂度** | 低 | 低 | 高 |
| **运维成本** | 低 | 低 | 高 |
| **开发复杂度** | 低→高 | 中 | 高 |
| **团队自治** | 低 | 中 | 高 |
| **故障隔离** | 无 | 有限 | 强 |

### 何时选择模块化单体

**适合模块化单体的场景**：

- 团队规模中等（5-30人）
- 业务复杂度适中，需要清晰的边界
- 希望保持部署简单性
- 暂时不需要独立扩展单个模块
- 作为未来微服务化的过渡方案
- DevOps 能力尚未成熟

**不适合的场景**：

- 需要不同模块使用不同技术栈
- 单个模块需要独立扩展
- 团队分布在不同地区，需要完全自治
- 系统规模极大，单体难以维护

---

## 模块边界设计

### 边界划分原则

模块边界的设计是模块化单体架构成功的关键。遵循领域驱动设计（DDD）的限界上下文（Bounded Context）概念来划分模块。

```typescript
// 项目结构示例
src/
├── modules/
│   ├── user/                    // 用户模块
│   │   ├── api/                 // 公开接口
│   │   │   ├── UserFacade.ts
│   │   │   └── dto/
│   │   ├── application/         // 应用服务
│   │   │   ├── commands/
│   │   │   └── queries/
│   │   ├── domain/              // 领域模型
│   │   │   ├── entities/
│   │   │   ├── valueObjects/
│   │   │   └── events/
│   │   ├── infrastructure/      // 基础设施
│   │   │   ├── repositories/
│   │   │   └── persistence/
│   │   └── index.ts             // 模块入口（只导出公共API）
│   │
│   ├── order/                   // 订单模块
│   │   ├── api/
│   │   ├── application/
│   │   ├── domain/
│   │   ├── infrastructure/
│   │   └── index.ts
│   │
│   ├── payment/                 // 支付模块
│   │   └── ...
│   │
│   └── inventory/               // 库存模块
│       └── ...
│
├── shared/                      // 共享内核
│   ├── kernel/
│   └── infrastructure/
│
└── bootstrap/                   // 应用启动
    └── Application.ts
```

### 模块公开接口设计

每个模块只能通过其公开的 Facade 接口与外部通信：

```typescript
// modules/user/api/UserFacade.ts
// 这是用户模块的唯一对外接口

import { Injectable } from '@nestjs/common';
import { CreateUserCommand } from '../application/commands/CreateUserCommand';
import { GetUserQuery } from '../application/queries/GetUserQuery';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserDto, CreateUserDto } from './dto';

@Injectable()
export class UserFacade {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  // 公开方法：创建用户
  async createUser(dto: CreateUserDto): Promise<UserDto> {
    const command = new CreateUserCommand(
      dto.email,
      dto.password,
      dto.name
    );
    return this.commandBus.execute(command);
  }

  // 公开方法：获取用户信息
  async getUserById(userId: string): Promise<UserDto | null> {
    const query = new GetUserQuery(userId);
    return this.queryBus.execute(query);
  }

  // 公开方法：检查用户是否存在
  async userExists(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user !== null;
  }

  // 公开方法：获取用户基本信息（用于其他模块）
  async getUserBasicInfo(userId: string): Promise<UserBasicInfoDto | null> {
    const query = new GetUserBasicInfoQuery(userId);
    return this.queryBus.execute(query);
  }
}
```

```typescript
// modules/user/index.ts
// 模块入口文件 - 只导出公共 API

// 导出 Facade（唯一的对外接口）
export { UserFacade } from './api/UserFacade';

// 导出 DTO（数据传输对象）
export { UserDto, CreateUserDto, UserBasicInfoDto } from './api/dto';

// 导出领域事件（供其他模块订阅）
export { UserCreatedEvent, UserUpdatedEvent } from './domain/events';

// 导出模块定义
export { UserModule } from './UserModule';

// 注意：不导出内部实现细节
// - 不导出 Repository
// - 不导出 Entity
// - 不导出内部 Service
```

### 边界强制执行

使用架构测试工具强制模块边界：

```typescript
// arch.spec.ts
// 使用 ts-arch 或类似工具进行架构测试

import { filesOfProject } from 'tsarch';

describe('模块边界架构测试', () => {

  it('订单模块不应直接访问用户模块内部实现', async () => {
    const rule = filesOfProject()
      .inFolder('modules/order')
      .shouldNot()
      .dependOnFiles()
      .inFolder('modules/user/domain')
      .inFolder('modules/user/infrastructure')
      .inFolder('modules/user/application');

    await expect(rule).toPassAsync();
  });

  it('模块只能依赖其他模块的公开 API', async () => {
    const rule = filesOfProject()
      .inFolder('modules/order')
      .that()
      .dependOnFiles()
      .inFolder('modules/user')
      .should()
      .dependOnFiles()
      .matchingPattern('modules/user/index.ts')
      .matchingPattern('modules/user/api/**');

    await expect(rule).toPassAsync();
  });

  it('领域层不应依赖基础设施层', async () => {
    const rule = filesOfProject()
      .inFolder('modules/**/domain')
      .shouldNot()
      .dependOnFiles()
      .inFolder('modules/**/infrastructure');

    await expect(rule).toPassAsync();
  });
});
```

使用 ESLint 规则强制导入限制：

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // 禁止从其他模块的内部目录导入
          {
            target: './src/modules/order',
            from: './src/modules/user/domain',
            message: '只能通过 UserFacade 访问用户模块'
          },
          {
            target: './src/modules/order',
            from: './src/modules/user/infrastructure',
            message: '只能通过 UserFacade 访问用户模块'
          },
          {
            target: './src/modules/order',
            from: './src/modules/user/application',
            message: '只能通过 UserFacade 访问用户模块'
          }
        ]
      }
    ]
  }
};
```

---

## 模块间通信

### 通信模式概览

```
┌─────────────────────────────────────────────────────────────────┐
│                     模块间通信模式                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 同步通信：通过 Facade 接口                                    │
│  ┌──────────┐    直接调用     ┌──────────┐                      │
│  │  Order   │ ──────────────→ │   User   │                      │
│  │  Module  │    UserFacade   │  Module  │                      │
│  └──────────┘                 └──────────┘                      │
│                                                                 │
│  2. 异步通信：通过领域事件                                        │
│  ┌──────────┐    发布事件     ┌──────────┐                      │
│  │  Order   │ ══════════════> │ Payment  │                      │
│  │  Module  │  OrderCreated   │  Module  │                      │
│  └──────────┘                 └──────────┘                      │
│                 ↓ Event Bus ↓                                   │
│                ┌──────────────┐                                 │
│                │  Inventory   │                                 │
│                │   Module     │                                 │
│                └──────────────┘                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 同步通信：Facade 模式

当模块 A 需要模块 B 的数据时，通过 Facade 同步调用：

```typescript
// modules/order/application/services/OrderService.ts

import { Injectable } from '@nestjs/common';
import { UserFacade } from '@modules/user';  // 从用户模块的公开 API 导入
import { InventoryFacade } from '@modules/inventory';
import { OrderRepository } from '../infrastructure/repositories/OrderRepository';
import { Order } from '../domain/entities/Order';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly userFacade: UserFacade,      // 注入用户模块 Facade
    private readonly inventoryFacade: InventoryFacade  // 注入库存模块 Facade
  ) {}

  async createOrder(userId: string, items: OrderItemDto[]): Promise<Order> {
    // 1. 通过 Facade 验证用户是否存在
    const userExists = await this.userFacade.userExists(userId);
    if (!userExists) {
      throw new UserNotFoundException(userId);
    }

    // 2. 通过 Facade 检查库存
    for (const item of items) {
      const available = await this.inventoryFacade.checkAvailability(
        item.productId,
        item.quantity
      );
      if (!available) {
        throw new InsufficientInventoryException(item.productId);
      }
    }

    // 3. 创建订单
    const order = Order.create(userId, items);

    // 4. 保存订单
    await this.orderRepository.save(order);

    return order;
  }
}
```

### 异步通信：领域事件

使用事件总线实现模块间的松耦合通信：

```typescript
// shared/kernel/events/DomainEvent.ts

export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;

  constructor() {
    this.occurredOn = new Date();
    this.eventId = generateUUID();
  }

  abstract get eventName(): string;
}
```

```typescript
// modules/order/domain/events/OrderCreatedEvent.ts

import { DomainEvent } from '@shared/kernel/events';

export class OrderCreatedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>,
    public readonly totalAmount: number
  ) {
    super();
  }

  get eventName(): string {
    return 'order.created';
  }
}
```

```typescript
// modules/order/domain/entities/Order.ts

import { AggregateRoot } from '@shared/kernel/domain';
import { OrderCreatedEvent } from '../events/OrderCreatedEvent';

export class Order extends AggregateRoot {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private items: OrderItem[],
    private status: OrderStatus
  ) {
    super();
  }

  static create(userId: string, items: OrderItemDto[]): Order {
    const order = new Order(
      generateOrderId(),
      userId,
      items.map(item => OrderItem.create(item)),
      OrderStatus.PENDING
    );

    // 发布领域事件
    order.addDomainEvent(
      new OrderCreatedEvent(
        order.id,
        order.userId,
        order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price.value
        })),
        order.calculateTotal().value
      )
    );

    return order;
  }
}
```

```typescript
// modules/inventory/application/handlers/OrderCreatedHandler.ts

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OrderCreatedEvent } from '@modules/order';  // 从订单模块导入事件
import { InventoryService } from '../services/InventoryService';

@EventsHandler(OrderCreatedEvent)
export class OrderCreatedHandler implements IEventHandler<OrderCreatedEvent> {
  constructor(private readonly inventoryService: InventoryService) {}

  async handle(event: OrderCreatedEvent): Promise<void> {
    // 处理订单创建事件：预留库存
    for (const item of event.items) {
      await this.inventoryService.reserveStock(
        item.productId,
        item.quantity,
        event.orderId
      );
    }
  }
}
```

```typescript
// modules/payment/application/handlers/OrderCreatedHandler.ts

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OrderCreatedEvent } from '@modules/order';
import { PaymentService } from '../services/PaymentService';

@EventsHandler(OrderCreatedEvent)
export class OrderCreatedHandler implements IEventHandler<OrderCreatedEvent> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(event: OrderCreatedEvent): Promise<void> {
    // 处理订单创建事件：创建待支付记录
    await this.paymentService.createPendingPayment(
      event.orderId,
      event.userId,
      event.totalAmount
    );
  }
}
```

### 进程内事件总线实现

```typescript
// shared/infrastructure/events/InMemoryEventBus.ts

import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { DomainEvent } from '@shared/kernel/events';

@Injectable()
export class InMemoryEventBus {
  constructor(private readonly eventBus: EventBus) {}

  async publish(event: DomainEvent): Promise<void> {
    await this.eventBus.publish(event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
```

```typescript
// shared/infrastructure/persistence/UnitOfWork.ts

import { Injectable } from '@nestjs/common';
import { InMemoryEventBus } from '../events/InMemoryEventBus';
import { AggregateRoot } from '@shared/kernel/domain';

@Injectable()
export class UnitOfWork {
  private aggregates: AggregateRoot[] = [];

  constructor(
    private readonly eventBus: InMemoryEventBus,
    private readonly dataSource: DataSource
  ) {}

  registerAggregate(aggregate: AggregateRoot): void {
    this.aggregates.push(aggregate);
  }

  async commit(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // 1. 保存所有聚合根的变更
      // ... 持久化逻辑

      // 2. 收集所有领域事件
      const events = this.aggregates.flatMap(
        agg => agg.getDomainEvents()
      );

      // 3. 提交事务
      await queryRunner.commitTransaction();

      // 4. 发布领域事件（事务提交后）
      await this.eventBus.publishAll(events);

      // 5. 清空事件
      this.aggregates.forEach(agg => agg.clearDomainEvents());
      this.aggregates = [];

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

---

## 共享内核（Shared Kernel）

### 什么是共享内核

共享内核是多个模块共同依赖的代码，包含通用的值对象、基础类型和工具函数。共享内核应该保持最小化，过度使用会导致模块间的隐式耦合。

```
┌─────────────────────────────────────────────────────────────────┐
│                        共享内核结构                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  shared/                                                        │
│  ├── kernel/                    # 核心共享代码                   │
│  │   ├── domain/                                                │
│  │   │   ├── AggregateRoot.ts   # 聚合根基类                    │
│  │   │   ├── Entity.ts          # 实体基类                      │
│  │   │   ├── ValueObject.ts     # 值对象基类                    │
│  │   │   └── DomainEvent.ts     # 领域事件基类                  │
│  │   │                                                          │
│  │   ├── valueObjects/          # 通用值对象                     │
│  │   │   ├── Money.ts           # 金额                          │
│  │   │   ├── Email.ts           # 邮箱                          │
│  │   │   ├── PhoneNumber.ts     # 电话号码                      │
│  │   │   └── Address.ts         # 地址                          │
│  │   │                                                          │
│  │   ├── types/                 # 通用类型                       │
│  │   │   ├── Result.ts          # 结果类型                      │
│  │   │   └── Optional.ts        # 可选类型                      │
│  │   │                                                          │
│  │   └── errors/                # 通用错误                       │
│  │       ├── DomainError.ts                                     │
│  │       └── ApplicationError.ts                                │
│  │                                                              │
│  └── infrastructure/            # 共享基础设施                   │
│      ├── persistence/                                           │
│      │   └── Repository.ts      # 仓储接口                      │
│      ├── events/                                                │
│      │   └── EventBus.ts        # 事件总线                      │
│      └── utils/                                                 │
│          └── DateUtils.ts       # 日期工具                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 通用值对象实现

```typescript
// shared/kernel/valueObjects/Money.ts

import { ValueObject } from '../domain/ValueObject';

interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  static create(amount: number, currency: string = 'CNY'): Money {
    if (amount < 0) {
      throw new Error('金额不能为负数');
    }
    // 保留两位小数
    const roundedAmount = Math.round(amount * 100) / 100;
    return new Money({ amount: roundedAmount, currency });
  }

  static zero(currency: string = 'CNY'): Money {
    return new Money({ amount: 0, currency });
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('金额不能为负数');
    }
    return Money.create(result, this.currency);
  }

  multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`货币类型不匹配: ${this.currency} vs ${other.currency}`);
    }
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}
```

```typescript
// shared/kernel/valueObjects/Email.ts

import { ValueObject } from '../domain/ValueObject';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(email: string): Email {
    const normalizedEmail = email.toLowerCase().trim();

    if (!this.EMAIL_REGEX.test(normalizedEmail)) {
      throw new InvalidEmailError(email);
    }

    return new Email({ value: normalizedEmail });
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }
}
```

### 基础领域类

```typescript
// shared/kernel/domain/Entity.ts

export abstract class Entity<T> {
  protected readonly _id: T;

  constructor(id: T) {
    this._id = id;
  }

  get id(): T {
    return this._id;
  }

  equals(other: Entity<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof Entity)) {
      return false;
    }
    return this._id === other._id;
  }
}
```

```typescript
// shared/kernel/domain/AggregateRoot.ts

import { Entity } from './Entity';
import { DomainEvent } from './DomainEvent';

export abstract class AggregateRoot<T = string> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }
}
```

```typescript
// shared/kernel/domain/ValueObject.ts

export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
```

### Result 类型

```typescript
// shared/kernel/types/Result.ts

export class Result<T, E = Error> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get value(): T {
    if (!this._isSuccess) {
      throw new Error('不能从失败的结果中获取值');
    }
    return this._value as T;
  }

  get error(): E {
    if (this._isSuccess) {
      throw new Error('不能从成功的结果中获取错误');
    }
    return this._error as E;
  }

  static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isSuccess) {
      return Result.ok(fn(this._value as T));
    }
    return Result.fail(this._error as E);
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._isSuccess) {
      return fn(this._value as T);
    }
    return Result.fail(this._error as E);
  }
}
```

---

## 数据隔离策略

### Schema 级别隔离

每个模块使用独立的数据库 Schema：

```typescript
// modules/user/infrastructure/persistence/UserSchema.ts

import { EntitySchema } from 'typeorm';
import { User } from '../../domain/entities/User';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  tableName: 'users',
  schema: 'user_module',  // 使用独立 Schema
  columns: {
    id: {
      type: 'uuid',
      primary: true
    },
    email: {
      type: 'varchar',
      length: 255,
      unique: true
    },
    passwordHash: {
      type: 'varchar',
      length: 255
    },
    name: {
      type: 'varchar',
      length: 100
    },
    createdAt: {
      type: 'timestamp',
      createDate: true
    }
  }
});
```

```typescript
// modules/order/infrastructure/persistence/OrderSchema.ts

import { EntitySchema } from 'typeorm';
import { Order } from '../../domain/entities/Order';

export const OrderSchema = new EntitySchema<Order>({
  name: 'Order',
  tableName: 'orders',
  schema: 'order_module',  // 订单模块独立 Schema
  columns: {
    id: {
      type: 'uuid',
      primary: true
    },
    userId: {
      type: 'uuid'
      // 注意：不使用外键约束到 user_module.users
      // 通过应用层维护数据一致性
    },
    status: {
      type: 'varchar',
      length: 50
    },
    totalAmount: {
      type: 'decimal',
      precision: 10,
      scale: 2
    },
    createdAt: {
      type: 'timestamp',
      createDate: true
    }
  }
});
```

### 数据库迁移管理

每个模块管理自己的迁移文件：

```typescript
// modules/user/infrastructure/migrations/1700000000000-CreateUserSchema.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建模块专属 Schema
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS user_module`);

    // 创建用户表
    await queryRunner.query(`
      CREATE TABLE user_module.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    await queryRunner.query(`
      CREATE INDEX idx_users_email ON user_module.users(email)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS user_module.users`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS user_module`);
  }
}
```

### 跨模块数据查询

当需要跨模块查询数据时，使用专门的查询服务：

```typescript
// modules/order/application/queries/GetOrderWithUserQuery.ts

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserFacade } from '@modules/user';
import { OrderRepository } from '../../infrastructure/repositories/OrderRepository';

export class GetOrderWithUserQuery {
  constructor(public readonly orderId: string) {}
}

export class OrderWithUserDto {
  orderId: string;
  status: string;
  totalAmount: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItemDto[];
}

@QueryHandler(GetOrderWithUserQuery)
export class GetOrderWithUserHandler
  implements IQueryHandler<GetOrderWithUserQuery, OrderWithUserDto | null> {

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly userFacade: UserFacade  // 通过 Facade 获取用户数据
  ) {}

  async execute(query: GetOrderWithUserQuery): Promise<OrderWithUserDto | null> {
    // 1. 从订单模块获取订单数据
    const order = await this.orderRepository.findById(query.orderId);
    if (!order) {
      return null;
    }

    // 2. 通过 UserFacade 获取用户基本信息
    const userInfo = await this.userFacade.getUserBasicInfo(order.userId);
    if (!userInfo) {
      throw new Error(`用户不存在: ${order.userId}`);
    }

    // 3. 组装返回数据
    return {
      orderId: order.id,
      status: order.status,
      totalAmount: order.totalAmount.value,
      user: {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email
      },
      items: order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price.value
      }))
    };
  }
}
```

---

## 迁移策略

### 从传统单体迁移到模块化单体

```
┌─────────────────────────────────────────────────────────────────┐
│                    迁移路径图                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  阶段1: 识别边界                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • 分析现有代码库，识别业务领域                              │  │
│  │  • 使用事件风暴（Event Storming）发现限界上下文              │  │
│  │  • 绘制模块依赖关系图                                       │  │
│  │  • 确定模块划分方案                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  阶段2: 建立边界                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • 创建模块目录结构                                         │  │
│  │  • 定义模块公共接口（Facade）                               │  │
│  │  • 逐步迁移代码到对应模块                                   │  │
│  │  • 添加架构测试                                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  阶段3: 解耦数据                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • 为每个模块创建独立 Schema                                │  │
│  │  • 迁移数据库表到对应 Schema                                │  │
│  │  • 移除跨模块的外键约束                                     │  │
│  │  • 通过应用层维护数据一致性                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  阶段4: 引入事件                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • 实现领域事件机制                                         │  │
│  │  • 将同步调用逐步替换为事件驱动                              │  │
│  │  • 实现最终一致性                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 迁移实战：提取用户模块

**步骤1：创建模块结构**

```bash
# 创建用户模块目录
mkdir -p src/modules/user/{api,application,domain,infrastructure}
mkdir -p src/modules/user/api/dto
mkdir -p src/modules/user/application/{commands,queries,handlers}
mkdir -p src/modules/user/domain/{entities,valueObjects,events}
mkdir -p src/modules/user/infrastructure/{repositories,persistence}
```

**步骤2：迁移领域模型**

```typescript
// 将原有的 User 实体迁移到 modules/user/domain/entities/User.ts

import { AggregateRoot } from '@shared/kernel/domain';
import { Email } from '@shared/kernel/valueObjects';
import { UserCreatedEvent } from '../events/UserCreatedEvent';

export class User extends AggregateRoot<string> {
  private email: Email;
  private passwordHash: string;
  private name: string;
  private readonly createdAt: Date;

  private constructor(
    id: string,
    email: Email,
    passwordHash: string,
    name: string,
    createdAt: Date
  ) {
    super(id);
    this.email = email;
    this.passwordHash = passwordHash;
    this.name = name;
    this.createdAt = createdAt;
  }

  static create(email: string, passwordHash: string, name: string): User {
    const user = new User(
      generateUserId(),
      Email.create(email),
      passwordHash,
      name,
      new Date()
    );

    user.addDomainEvent(new UserCreatedEvent(user.id, email, name));

    return user;
  }

  // ... 其他方法
}
```

**步骤3：创建 Facade**

```typescript
// modules/user/api/UserFacade.ts

@Injectable()
export class UserFacade {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  async createUser(dto: CreateUserDto): Promise<UserDto> {
    const command = new CreateUserCommand(dto.email, dto.password, dto.name);
    return this.commandBus.execute(command);
  }

  async getUserById(userId: string): Promise<UserDto | null> {
    return this.queryBus.execute(new GetUserQuery(userId));
  }

  // 为其他模块提供的接口
  async userExists(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user !== null;
  }
}
```

**步骤4：更新其他模块的依赖**

```typescript
// 修改前：直接访问用户仓储
class OrderService {
  constructor(private userRepository: UserRepository) {}

  async createOrder(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');
    // ...
  }
}

// 修改后：通过 Facade 访问
class OrderService {
  constructor(private userFacade: UserFacade) {}

  async createOrder(userId: string) {
    const exists = await this.userFacade.userExists(userId);
    if (!exists) throw new UserNotFoundException(userId);
    // ...
  }
}
```

### 从模块化单体迁移到微服务

当业务发展需要时，可以将模块化单体逐步拆分为微服务：

```
┌─────────────────────────────────────────────────────────────────┐
│              模块化单体 → 微服务迁移策略                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    模块化单体                           │    │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐              │    │
│  │  │ User │  │Order │  │Payment│ │Inventory│            │    │
│  │  └──────┘  └──────┘  └──────┘  └──────┘              │    │
│  └────────────────────────────────────────────────────────┘    │
│                            │                                    │
│                            ↓                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │               阶段1: 提取第一个服务                      │    │
│  │  ┌──────────────────────────────────┐  ┌──────────┐   │    │
│  │  │         模块化单体               │  │ Payment  │   │    │
│  │  │  ┌──────┐  ┌──────┐  ┌──────┐  │  │  Service │   │    │
│  │  │  │ User │  │Order │  │Inventory│ │  │  (独立)  │   │    │
│  │  │  └──────┘  └──────┘  └──────┘  │  └──────────┘   │    │
│  │  └──────────────────────────────────┘       ↑         │    │
│  │                    │                        │         │    │
│  │                    └────── HTTP/gRPC ───────┘         │    │
│  └────────────────────────────────────────────────────────┘    │
│                            │                                    │
│                            ↓                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │               阶段2: 继续拆分                            │    │
│  │  ┌──────────────────┐  ┌────────┐  ┌──────────┐       │    │
│  │  │    模块化单体    │  │Payment │  │Inventory │       │    │
│  │  │  ┌────┐ ┌─────┐ │  │Service │  │ Service  │       │    │
│  │  │  │User│ │Order│ │  └────────┘  └──────────┘       │    │
│  │  │  └────┘ └─────┘ │                                   │    │
│  │  └──────────────────┘                                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**关键步骤**：

1. **选择拆分候选模块**
   - 高负载模块（需要独立扩展）
   - 独立团队负责的模块
   - 技术栈需要差异化的模块

2. **引入防腐层**

```typescript
// 在模块化单体中创建防腐层，为将来拆分做准备
// modules/payment/api/PaymentFacade.ts

@Injectable()
export class PaymentFacade {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly config: ConfigService
  ) {}

  private get useExternalService(): boolean {
    return this.config.get('PAYMENT_SERVICE_URL') !== undefined;
  }

  async processPayment(orderId: string, amount: number): Promise<PaymentResult> {
    if (this.useExternalService) {
      // 调用外部微服务
      return this.httpClient.post(
        `${this.config.get('PAYMENT_SERVICE_URL')}/payments`,
        { orderId, amount }
      );
    } else {
      // 使用内部实现
      return this.internalPaymentService.process(orderId, amount);
    }
  }
}
```

3. **数据迁移**

```typescript
// 数据同步服务
@Injectable()
export class PaymentDataSyncService {
  constructor(
    private readonly localPaymentRepo: PaymentRepository,
    private readonly externalPaymentClient: PaymentServiceClient
  ) {}

  async syncToExternalService(): Promise<void> {
    const payments = await this.localPaymentRepo.findUnsyncedPayments();

    for (const payment of payments) {
      await this.externalPaymentClient.createPayment(payment);
      await this.localPaymentRepo.markAsSynced(payment.id);
    }
  }
}
```

---

## 最佳实践

### 模块设计原则

```typescript
// 好的实践：模块提供清晰的契约
// modules/user/api/UserFacade.ts

export interface IUserFacade {
  // 明确的方法签名
  createUser(dto: CreateUserDto): Promise<Result<UserDto, CreateUserError>>;
  getUserById(userId: string): Promise<UserDto | null>;
  userExists(userId: string): Promise<boolean>;
}

// 使用 Result 类型明确可能的错误
export type CreateUserError =
  | { type: 'EMAIL_ALREADY_EXISTS'; email: string }
  | { type: 'INVALID_EMAIL'; email: string }
  | { type: 'WEAK_PASSWORD' };
```

### 避免循环依赖

```typescript
// 错误：模块 A 依赖模块 B，模块 B 又依赖模块 A
// OrderModule → UserModule → OrderModule ❌

// 正确：使用事件打破循环依赖
// OrderModule 发布 OrderCreatedEvent
// UserModule 订阅 OrderCreatedEvent，更新用户统计

// modules/user/application/handlers/UpdateUserStatsHandler.ts
@EventsHandler(OrderCreatedEvent)
export class UpdateUserStatsHandler implements IEventHandler<OrderCreatedEvent> {
  constructor(private readonly userStatsService: UserStatsService) {}

  async handle(event: OrderCreatedEvent): Promise<void> {
    await this.userStatsService.incrementOrderCount(event.userId);
  }
}
```

### 测试策略

```typescript
// 模块级集成测试
// modules/order/__tests__/OrderModule.integration.test.ts

describe('OrderModule Integration', () => {
  let orderFacade: OrderFacade;
  let userFacadeMock: jest.Mocked<UserFacade>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [OrderModule],
    })
    .overrideProvider(UserFacade)
    .useValue({
      userExists: jest.fn(),
      getUserBasicInfo: jest.fn()
    })
    .compile();

    orderFacade = module.get<OrderFacade>(OrderFacade);
    userFacadeMock = module.get(UserFacade);
  });

  it('should create order when user exists', async () => {
    // Arrange
    userFacadeMock.userExists.mockResolvedValue(true);

    // Act
    const result = await orderFacade.createOrder({
      userId: 'user-123',
      items: [{ productId: 'prod-1', quantity: 2 }]
    });

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(userFacadeMock.userExists).toHaveBeenCalledWith('user-123');
  });

  it('should fail when user does not exist', async () => {
    // Arrange
    userFacadeMock.userExists.mockResolvedValue(false);

    // Act
    const result = await orderFacade.createOrder({
      userId: 'invalid-user',
      items: [{ productId: 'prod-1', quantity: 2 }]
    });

    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.error.type).toBe('USER_NOT_FOUND');
  });
});
```

### 监控与可观测性

```typescript
// shared/infrastructure/observability/ModuleMetrics.ts

@Injectable()
export class ModuleMetrics {
  private readonly callDuration: Histogram;
  private readonly callCounter: Counter;

  constructor(private readonly metricsRegistry: Registry) {
    this.callDuration = new Histogram({
      name: 'module_call_duration_seconds',
      help: '模块调用耗时',
      labelNames: ['source_module', 'target_module', 'method'],
      registers: [metricsRegistry]
    });

    this.callCounter = new Counter({
      name: 'module_call_total',
      help: '模块调用次数',
      labelNames: ['source_module', 'target_module', 'method', 'status'],
      registers: [metricsRegistry]
    });
  }

  async trackCall<T>(
    sourceModule: string,
    targetModule: string,
    method: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const end = this.callDuration.startTimer({
      source_module: sourceModule,
      target_module: targetModule,
      method
    });

    try {
      const result = await fn();
      this.callCounter.inc({
        source_module: sourceModule,
        target_module: targetModule,
        method,
        status: 'success'
      });
      return result;
    } catch (error) {
      this.callCounter.inc({
        source_module: sourceModule,
        target_module: targetModule,
        method,
        status: 'error'
      });
      throw error;
    } finally {
      end();
    }
  }
}
```

---

## 总结

### 模块化单体的优势

1. **保持简单性**：单一部署单元，无需分布式系统复杂性
2. **清晰的边界**：模块化组织，易于理解和维护
3. **高效通信**：进程内调用，性能优于网络通信
4. **事务一致性**：可以使用数据库事务保证一致性
5. **渐进式演进**：为未来微服务化奠定基础

### 适用场景决策树

```
                开始
                  │
                  ↓
        ┌─────────────────┐
        │  团队规模 > 50人? │
        └────────┬────────┘
                 │
        ┌────────┴────────┐
        ↓ 是              ↓ 否
   考虑微服务        ┌─────────────────┐
                    │ 需要独立扩展模块? │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    ↓ 是              ↓ 否
               考虑微服务      ┌─────────────────┐
                              │  业务复杂度高?   │
                              └────────┬────────┘
                                       │
                              ┌────────┴────────┐
                              ↓ 是              ↓ 否
                         模块化单体          传统单体
```

### 关键要点

- 模块化单体是微服务的**务实替代方案**，而非退化选择
- 成功的关键是**严格的模块边界**和**数据隔离**
- 使用**架构测试**强制边界约束
- 通过**Facade**和**领域事件**实现模块间通信
- 保持**共享内核最小化**
- 为**未来微服务化**做好准备

模块化单体架构代表了一种平衡的架构选择，它在保持单体架构简单性的同时，引入了模块化设计的优势。对于大多数中等规模的项目来说，这是一个值得认真考虑的架构模式。
