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
origin: old/src/content/docs/architecture/getting-started.zh.md
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

欢迎来到 Code Wiki 的软件架构板块！本综合指南将帮助您理解构建健壮、可扩展和可维护软件系统所必需的核心概念、设计原则和架构模式。

## 什么是软件架构

软件架构是指软件系统的高层结构，包含软件元素、它们之间的关系以及两者的属性。它是指导系统开发、部署和演进的蓝图。

良好的架构使团队能够：

- 独立且并行地开发功能
- 扩展系统以满足不断增长的需求
- 长期维护和演进代码库
- 高效地培训新团队成员
- 做出明智的技术决策

架构不仅仅关乎技术选择；它是关于做出与业务目标、团队能力和运营需求相一致的战略决策。

### 软件架构师的角色

软件架构师在业务需求和技术实现之间架起桥梁。他们的职责包括：

- **技术愿景**：确定整体技术方向
- **系统设计**：定义系统结构和组件交互
- **技术选型**：选择合适的技术和框架
- **质量属性**：确保可扩展性、安全性、性能和可靠性
- **技术领导**：指导开发人员并建立标准
- **文档编写**：创建和维护架构文档
- **风险管理**：识别和缓解技术风险
- **利益相关者沟通**：为非技术人员解释技术概念

## 核心设计原则

理解基本设计原则对于创建架构良好的系统至关重要。

### SOLID 原则

SOLID 原则为创建可维护和可扩展的代码提供了指导方针。

```typescript
// 单一职责原则 (SRP)
// 每个类应该只有一个改变的理由

// 错误示范：一个类承担多个职责
class User {
  constructor(public name: string, public email: string) {}

  save() { /* 保存到数据库 */ }
  sendEmail() { /* 发送邮件 */ }
  generateReport() { /* 生成PDF报告 */ }
}

// 正确示范：职责分离
class User {
  constructor(public name: string, public email: string) {}
}

class UserRepository {
  save(user: User): Promise<void> {
    // 仅处理数据库操作
  }

  findById(id: string): Promise<User | null> {
    // 查询操作
  }
}

class EmailService {
  sendWelcomeEmail(user: User): Promise<void> {
    // 仅处理邮件发送逻辑
  }
}

class UserReportGenerator {
  generateReport(user: User): Buffer {
    // 仅处理报告生成
  }
}
```

```typescript
// 开闭原则 (OCP)
// 对扩展开放，对修改关闭

// 错误示范：添加新折扣类型需要修改代码
class DiscountCalculator {
  calculate(type: string, amount: number): number {
    if (type === 'percentage') return amount * 0.1;
    if (type === 'fixed') return 10;
    if (type === 'seasonal') return amount * 0.15; // 后来添加的
    return 0;
  }
}

// 正确示范：通过新类进行扩展
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

// 无需修改现有代码即可添加新折扣类型
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
// 里氏替换原则 (LSP)
// 子类型必须能够替换其基类型

// 错误示范：Square 替换 Rectangle 时违反 LSP
class Rectangle {
  constructor(protected width: number, protected height: number) {}

  setWidth(width: number) { this.width = width; }
  setHeight(height: number) { this.height = height; }
  getArea() { return this.width * this.height; }
}

class Square extends Rectangle {
  setWidth(width: number) {
    this.width = width;
    this.height = width; // 违反预期行为
  }
  setHeight(height: number) {
    this.width = height;
    this.height = height;
  }
}

// 正确示范：使用组合或分离的抽象
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
// 接口隔离原则 (ISP)
// 客户端不应该依赖它们不使用的接口

// 错误示范：臃肿的接口强制实现不必要的方法
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

class Robot implements Worker {
  work() { /* 工作中 */ }
  eat() { /* 机器人不吃东西 - 被迫实现 */ }
  sleep() { /* 机器人不睡觉 - 被迫实现 */ }
}

// 正确示范：接口隔离
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
  work() { /* 工作中 */ }
  eat() { /* 吃饭中 */ }
  sleep() { /* 睡觉中 */ }
}

class Robot implements Workable {
  work() { /* 工作中 - 只实现需要的接口 */ }
}
```

```typescript
// 依赖倒置原则 (DIP)
// 依赖于抽象，而非具体实现

// 错误示范：高层模块依赖低层模块
class MySQLDatabase {
  query(sql: string) { /* MySQL 特定实现 */ }
}

class UserService {
  private database = new MySQLDatabase(); // 紧耦合

  getUsers() {
    return this.database.query('SELECT * FROM users');
  }
}

// 正确示范：两者都依赖于抽象
interface Database {
  query(sql: string): Promise<any>;
}

class MySQLDatabase implements Database {
  async query(sql: string) { /* MySQL 实现 */ }
}

class PostgreSQLDatabase implements Database {
  async query(sql: string) { /* PostgreSQL 实现 */ }
}

class UserService {
  constructor(private database: Database) {} // 依赖注入

  async getUsers() {
    return this.database.query('SELECT * FROM users');
  }
}

// 轻松切换实现
const mysqlService = new UserService(new MySQLDatabase());
const postgresService = new UserService(new PostgreSQLDatabase());
```

### 其他重要原则

**DRY（不要重复自己）**：通过将通用逻辑抽象为可重用模块来避免代码重复。但是，要警惕过早抽象——有时候重复比错误的抽象更好。

**KISS（保持简单）**：优先选择简单的解决方案而非复杂的解决方案。只有在满足需求确实必要时才引入复杂性。

**YAGNI（你不会需要它）**：在实际需要之前不要实现功能。避免投机性的泛化。

**关注点分离**：将系统划分为处理不同关注点的独立部分。每个组件应该有单一、明确定义的职责。

## 常见架构模式

### 分层架构

最传统的模式，将代码组织成具有明确职责的水平层次。

```
┌─────────────────────────────────────────┐
│           表现层                         │  UI、API 控制器
├─────────────────────────────────────────┤
│           应用层                         │  用例、服务
├─────────────────────────────────────────┤
│           领域层                         │  业务逻辑、实体
├─────────────────────────────────────────┤
│           基础设施层                     │  数据库、外部服务
└─────────────────────────────────────────┘
```

```typescript
// 分层架构示例

// 领域层 - 业务实体和规则
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

// 应用层 - 用例
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

// 基础设施层 - 具体实现
class PostgresOrderRepository implements OrderRepository {
  async findById(id: string): Promise<Order | null> {
    // PostgreSQL 特定实现
  }

  async save(order: Order): Promise<void> {
    // PostgreSQL 特定实现
  }
}

// 表现层 - 控制器
class OrderController {
  constructor(private cancelOrderUseCase: CancelOrderUseCase) {}

  async cancelOrder(req: Request, res: Response) {
    try {
      await this.cancelOrderUseCase.execute(req.params.id, req.user.id);
      res.status(200).json({ message: '订单已取消' });
    } catch (error) {
      // 错误处理
    }
  }
}
```

### 微服务架构

将应用程序分解为小型、独立的服务，通过网络进行通信。

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│    用户     │   │    订单     │   │    支付     │
│    服务     │   │    服务     │   │    服务     │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └────────────┬────┴────────────────┘
                    │
            ┌───────┴───────┐
            │   API 网关    │
            └───────────────┘
```

优势：
- 独立部署和扩展
- 技术多样性
- 故障隔离
- 团队自治

挑战：
- 分布式系统复杂性
- 数据一致性
- 服务通信开销
- 运维复杂性

### 事件驱动架构

服务通过事件进行通信，实现松耦合和异步处理。

```typescript
// 事件驱动架构示例

// 事件
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

// 事件发布器
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

// 事件处理器
class InventoryService {
  constructor(private eventBus: EventBus) {
    this.eventBus.subscribe('OrderCreatedEvent', this.handleOrderCreated.bind(this));
  }

  async handleOrderCreated(event: OrderCreatedEvent) {
    // 为订单预留库存
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

### 整洁架构 / 六边形架构

围绕领域组织代码，依赖关系指向内部。

```
                    ┌─────────────────────────┐
                    │       外部代理          │
                    │  (UI、数据库、API 等)   │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │         适配器           │
                    │   (控制器、仓储)         │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │        应用层            │
                    │       (用例)             │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │        领域层            │
                    │    (实体、规则)          │
                    └─────────────────────────┘
```

核心原则：领域核心不依赖于外层。

## 学习路径建议

### 基础阶段（1-3 个月）

1. **设计原则** - 掌握 SOLID、DRY、KISS、YAGNI
2. **设计模式** - 学习四人帮（GoF）设计模式
3. **代码组织** - 了解模块、包和命名空间
4. **重构** - 练习改进现有代码

### 中级阶段（3-6 个月）

1. **架构模式** - 理解分层架构、六边形架构和整洁架构
2. **领域驱动设计** - 学习 DDD 概念和战术模式
3. **系统设计基础** - 学习分布式系统基础知识
4. **文档编写** - 练习创建架构决策记录（ADR）

### 高级阶段（6-12 个月）

1. **微服务** - 深入研究微服务模式和陷阱
2. **事件驱动系统** - 学习事件溯源和 CQRS
3. **可扩展性** - 学习水平扩展、缓存和负载均衡
4. **云架构** - 理解云原生模式

## 面试要点

准备以下主题的架构讨论：

### 设计原则和模式

- 用实际例子解释 SOLID 原则
- 何时使用不同的设计模式
- 模式之间的权衡

### 架构风格

- 单体架构 vs 微服务：权衡和迁移策略
- 事件驱动架构的优势和挑战
- API 设计（REST vs GraphQL vs gRPC）

### 系统设计

- CAP 定理及其影响
- 数据库扩展策略
- 缓存层和失效策略
- 负载均衡方法
- 消息队列和异步处理

### 质量属性

- 如何实现高可用性
- 安全架构考虑因素
- 性能优化策略
- 可观测性和监控

## 延伸阅读

继续探索 Code Wiki，深入了解：

- 设计模式目录
- 领域驱动设计
- 微服务模式
- 系统设计案例研究
- 云架构模式

软件架构既是艺术也是科学。它需要在技术卓越性和实际约束之间取得平衡。专注于理解权衡，因为每个架构决策都涉及妥协。构建小型项目，研究现有系统，并不断完善你的架构思维。
