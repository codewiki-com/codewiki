---
title: 洋葱架构
description: 深入理解洋葱架构的层次和依赖规则
track: architecture
section: design-patterns
difficulty: advanced
tags:
  - 洋葱架构
  - 分层
  - 依赖倒置
  - 领域驱动
status: imported
origin: old/src/content/docs/architecture/onion-architecture.zh.md
divergence: 0.198
issues: []
legacy:
  category: Architecture
  subcategory: Patterns
  order: 18
  lastUpdated: 2026-01-07
---

## 概念解释

洋葱架构（Onion Architecture）是由 Jeffrey Palermo 在 2008 年提出的一种软件架构模式。它的核心思想是将应用程序构建为一系列同心圆层次，每一层只能依赖更内层的组件，绝不能依赖外层。这种架构模式强调**领域模型**的核心地位，将基础设施关注点推到架构的最外层。

### 为什么叫"洋葱"架构？

洋葱架构得名于其分层结构的视觉表现形式，就像切开一颗洋葱，你会看到多层同心圆环绕着中心核心。在软件架构中：

- **中心核心**：代表领域模型，是系统最稳定、最重要的部分
- **外层圆环**：代表越来越接近外部世界的组件，如应用服务、基础设施等
- **依赖方向**：始终从外向内，内层对外层完全无感知

### 洋葱架构要解决的问题

传统分层架构（如经典的三层架构）存在以下问题：

1. **紧耦合**：业务逻辑层通常直接依赖数据访问层的具体实现
2. **测试困难**：测试业务逻辑需要数据库等基础设施就位
3. **关注点混杂**：技术细节渗透到业务逻辑中
4. **框架锁定**：更换框架或数据库需要大范围重构

```
传统三层架构的问题：

┌─────────────────────────────────────┐
│          表示层 (UI)                │
└──────────────────┬──────────────────┘
                   │ 依赖
                   ▼
┌─────────────────────────────────────┐
│         业务逻辑层 (BLL)            │
└──────────────────┬──────────────────┘
                   │ 依赖 (问题所在!)
                   ▼
┌─────────────────────────────────────┐
│        数据访问层 (DAL)             │
└─────────────────────────────────────┘

业务逻辑层依赖数据访问层的具体实现，
导致业务规则与数据库技术紧密耦合。
```

洋葱架构通过**依赖倒置**原则，彻底颠覆了这种依赖关系：

```
洋葱架构的依赖方向：

        ┌─────────────────────────────────────────────────┐
        │               基础设施层                         │
        │   (数据库、外部服务、UI、框架)                    │
        │     ┌─────────────────────────────────────┐     │
        │     │           应用服务层                 │     │
        │     │      (用例、应用逻辑)                │     │
        │     │     ┌─────────────────────────┐     │     │
        │     │     │      领域服务层          │     │     │
        │     │     │    (领域服务)            │     │     │
        │     │     │   ┌───────────────┐     │     │     │
        │     │     │   │   领域模型    │     │     │     │
        │     │     │   │  (实体+值对象) │     │     │     │
        │     │     │   └───────────────┘     │     │     │
        │     │     └─────────────────────────┘     │     │
        │     └─────────────────────────────────────┘     │
        └─────────────────────────────────────────────────┘

        所有依赖都指向圆心，内层永远不知道外层的存在
```

---

## 核心原理：四层同心圆架构

洋葱架构将应用程序分为四个主要层次，从内到外分别是：

### 第一层：领域模型层（Domain Model）

这是架构的核心，包含：

- **实体（Entities）**：具有唯一标识的业务对象
- **值对象（Value Objects）**：无标识的不可变对象
- **领域事件（Domain Events）**：领域中发生的重要事件

```typescript
// domain/model/entities/User.ts
// 领域实体：封装核心业务规则

import { Email } from '../value-objects/Email';
import { UserId } from '../value-objects/UserId';
import { Password } from '../value-objects/Password';
import { UserRegisteredEvent } from '../events/UserRegisteredEvent';

export class User {
  private readonly id: UserId;
  private email: Email;
  private passwordHash: Password;
  private isActive: boolean;
  private readonly createdAt: Date;
  private domainEvents: DomainEvent[] = [];

  private constructor(
    id: UserId,
    email: Email,
    passwordHash: Password
  ) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.isActive = true;
    this.createdAt = new Date();
  }

  // 工厂方法：创建新用户
  static create(email: Email, password: Password): User {
    const id = UserId.generate();
    const user = new User(id, email, password);

    // 发布领域事件
    user.addDomainEvent(new UserRegisteredEvent(id, email));

    return user;
  }

  // 业务规则：验证密码
  validatePassword(plainPassword: string): boolean {
    return this.passwordHash.matches(plainPassword);
  }

  // 业务规则：更改邮箱
  changeEmail(newEmail: Email): void {
    if (!this.isActive) {
      throw new UserInactiveError(this.id);
    }
    this.email = newEmail;
    this.addDomainEvent(new UserEmailChangedEvent(this.id, newEmail));
  }

  // 业务规则：停用账户
  deactivate(): void {
    if (!this.isActive) {
      throw new UserAlreadyInactiveError(this.id);
    }
    this.isActive = false;
    this.addDomainEvent(new UserDeactivatedEvent(this.id));
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  // Getters
  getId(): UserId { return this.id; }
  getEmail(): Email { return this.email; }
  getIsActive(): boolean { return this.isActive; }
}
```

```typescript
// domain/model/value-objects/Email.ts
// 值对象：不可变，通过值比较相等性

export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Email {
    // 业务规则：邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new InvalidEmailError(value);
    }

    // 业务规则：邮箱长度限制
    if (value.length > 255) {
      throw new EmailTooLongError(value);
    }

    return new Email(value.toLowerCase());
  }

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

```typescript
// domain/model/value-objects/Money.ts
// 值对象：处理金额计算

export class Money {
  private readonly amount: number;
  private readonly currency: Currency;

  private constructor(amount: number, currency: Currency) {
    this.amount = amount;
    this.currency = currency;
  }

  static of(amount: number, currency: Currency): Money {
    if (amount < 0) {
      throw new NegativeAmountError(amount);
    }
    // 保留两位小数
    const roundedAmount = Math.round(amount * 100) / 100;
    return new Money(roundedAmount, currency);
  }

  static zero(currency: Currency = Currency.CNY): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.of(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new InsufficientFundsError(this.amount, other.amount);
    }
    return Money.of(result, this.currency);
  }

  multiply(factor: number): Money {
    return Money.of(this.amount * factor, this.currency);
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
  }

  getAmount(): number { return this.amount; }
  getCurrency(): Currency { return this.currency; }

  equals(other: Money): boolean {
    return this.amount === other.amount &&
           this.currency === other.currency;
  }
}
```

### 第二层：领域服务层（Domain Services）

当业务逻辑不自然地属于任何单一实体时，使用领域服务来封装：

```typescript
// domain/services/TransferService.ts
// 领域服务：跨实体的业务逻辑

import { Account } from '../model/entities/Account';
import { Money } from '../model/value-objects/Money';
import { TransferCompletedEvent } from '../model/events/TransferCompletedEvent';

export class TransferService {

  // 领域服务方法：处理转账业务逻辑
  transfer(
    sourceAccount: Account,
    targetAccount: Account,
    amount: Money
  ): TransferResult {
    // 业务规则：检查源账户状态
    if (!sourceAccount.isActive()) {
      throw new AccountInactiveError(sourceAccount.getId());
    }

    // 业务规则：检查目标账户状态
    if (!targetAccount.isActive()) {
      throw new AccountInactiveError(targetAccount.getId());
    }

    // 业务规则：检查是否为同一账户
    if (sourceAccount.getId().equals(targetAccount.getId())) {
      throw new SameAccountTransferError();
    }

    // 业务规则：检查每日转账限额
    if (sourceAccount.exceedsDailyLimit(amount)) {
      throw new DailyLimitExceededError(sourceAccount.getDailyLimit());
    }

    // 执行转账
    sourceAccount.debit(amount);
    targetAccount.credit(amount);

    return new TransferResult(
      sourceAccount.getId(),
      targetAccount.getId(),
      amount,
      new Date()
    );
  }
}
```

```typescript
// domain/services/PricingService.ts
// 领域服务：复杂定价逻辑

import { Product } from '../model/entities/Product';
import { Customer } from '../model/entities/Customer';
import { Money } from '../model/value-objects/Money';
import { Discount } from '../model/value-objects/Discount';

export class PricingService {

  calculatePrice(
    product: Product,
    customer: Customer,
    quantity: number
  ): PriceCalculation {
    // 基础价格
    let price = product.getBasePrice().multiply(quantity);
    const appliedDiscounts: Discount[] = [];

    // 业务规则：会员等级折扣
    const memberDiscount = this.getMemberDiscount(customer.getMemberLevel());
    if (memberDiscount) {
      price = this.applyDiscount(price, memberDiscount);
      appliedDiscounts.push(memberDiscount);
    }

    // 业务规则：批量购买折扣
    const bulkDiscount = this.getBulkDiscount(quantity);
    if (bulkDiscount) {
      price = this.applyDiscount(price, bulkDiscount);
      appliedDiscounts.push(bulkDiscount);
    }

    // 业务规则：促销活动折扣
    const promotionDiscount = product.getActivePromotion()?.getDiscount();
    if (promotionDiscount) {
      price = this.applyDiscount(price, promotionDiscount);
      appliedDiscounts.push(promotionDiscount);
    }

    return new PriceCalculation(
      product.getBasePrice().multiply(quantity),
      price,
      appliedDiscounts
    );
  }

  private getMemberDiscount(level: MemberLevel): Discount | null {
    const discountMap: Record<MemberLevel, number> = {
      [MemberLevel.BRONZE]: 0.02,
      [MemberLevel.SILVER]: 0.05,
      [MemberLevel.GOLD]: 0.10,
      [MemberLevel.PLATINUM]: 0.15,
    };

    const rate = discountMap[level];
    return rate ? Discount.percentage(rate, '会员折扣') : null;
  }

  private getBulkDiscount(quantity: number): Discount | null {
    if (quantity >= 100) return Discount.percentage(0.20, '大批量折扣');
    if (quantity >= 50) return Discount.percentage(0.15, '批量折扣');
    if (quantity >= 10) return Discount.percentage(0.05, '小批量折扣');
    return null;
  }

  private applyDiscount(price: Money, discount: Discount): Money {
    return price.multiply(1 - discount.getRate());
  }
}
```

### 第三层：应用服务层（Application Services）

应用服务层编排领域对象来完成用例，是领域模型与外部世界的桥梁：

```typescript
// application/services/UserApplicationService.ts
// 应用服务：编排用例流程

import { User } from '../../domain/model/entities/User';
import { Email } from '../../domain/model/value-objects/Email';
import { Password } from '../../domain/model/value-objects/Password';
import { IUserRepository } from '../ports/out/IUserRepository';
import { IEventPublisher } from '../ports/out/IEventPublisher';
import { IEmailService } from '../ports/out/IEmailService';
import { IUnitOfWork } from '../ports/out/IUnitOfWork';

// 命令对象
export interface RegisterUserCommand {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterUserResult {
  userId: string;
  email: string;
}

export class UserApplicationService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly emailService: IEmailService,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  // 用例：用户注册
  async registerUser(command: RegisterUserCommand): Promise<RegisterUserResult> {
    // 输入验证
    if (command.password !== command.confirmPassword) {
      throw new PasswordMismatchError();
    }

    // 创建值对象
    const email = Email.create(command.email);
    const password = Password.create(command.password);

    // 业务规则检查：邮箱唯一性
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new EmailAlreadyExistsError(email.getValue());
    }

    // 创建领域实体
    const user = User.create(email, password);

    // 持久化
    await this.unitOfWork.begin();
    try {
      await this.userRepository.save(user);

      // 发布领域事件
      const events = user.pullDomainEvents();
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }

      // 发送欢迎邮件（可以是异步的）
      await this.emailService.sendWelcomeEmail(email.getValue());

      await this.unitOfWork.commit();
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }

    return {
      userId: user.getId().getValue(),
      email: user.getEmail().getValue()
    };
  }

  // 用例：用户登录
  async authenticateUser(
    email: string,
    password: string
  ): Promise<AuthenticationResult> {
    const emailVO = Email.create(email);

    const user = await this.userRepository.findByEmail(emailVO);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.getIsActive()) {
      throw new UserInactiveError(user.getId().getValue());
    }

    if (!user.validatePassword(password)) {
      throw new InvalidCredentialsError();
    }

    // 生成认证令牌（这里只是示例）
    const token = await this.generateToken(user);

    return {
      userId: user.getId().getValue(),
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  // 用例：更改邮箱
  async changeUserEmail(
    userId: string,
    newEmail: string
  ): Promise<void> {
    const user = await this.userRepository.findById(UserId.from(userId));
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const emailVO = Email.create(newEmail);

    // 检查新邮箱是否已被使用
    const existingUser = await this.userRepository.findByEmail(emailVO);
    if (existingUser && !existingUser.getId().equals(user.getId())) {
      throw new EmailAlreadyExistsError(newEmail);
    }

    // 调用领域方法
    user.changeEmail(emailVO);

    // 持久化
    await this.unitOfWork.begin();
    try {
      await this.userRepository.save(user);

      const events = user.pullDomainEvents();
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }

      await this.unitOfWork.commit();
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }

  private async generateToken(user: User): Promise<string> {
    // 实际实现会使用 JWT 等
    return `token_${user.getId().getValue()}_${Date.now()}`;
  }
}
```

```typescript
// application/ports/out/IUserRepository.ts
// 仓储接口：定义在应用层，实现在基础设施层

import { User } from '../../../domain/model/entities/User';
import { Email } from '../../../domain/model/value-objects/Email';
import { UserId } from '../../../domain/model/value-objects/UserId';

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findAll(criteria?: UserSearchCriteria): Promise<User[]>;
  delete(id: UserId): Promise<void>;
  exists(id: UserId): Promise<boolean>;
}

export interface UserSearchCriteria {
  isActive?: boolean;
  emailDomain?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}
```

### 第四层：基础设施层（Infrastructure）

基础设施层包含所有外部关注点的具体实现：

```typescript
// infrastructure/persistence/TypeOrmUserRepository.ts
// 仓储实现：使用 TypeORM

import { Repository } from 'typeorm';
import { IUserRepository, UserSearchCriteria } from '../../application/ports/out/IUserRepository';
import { User } from '../../domain/model/entities/User';
import { Email } from '../../domain/model/value-objects/Email';
import { UserId } from '../../domain/model/value-objects/UserId';
import { UserEntity } from './entities/UserEntity';
import { UserMapper } from './mappers/UserMapper';

export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    private readonly repository: Repository<UserEntity>
  ) {}

  async save(user: User): Promise<void> {
    const entity = UserMapper.toEntity(user);
    await this.repository.save(entity);
  }

  async findById(id: UserId): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { id: id.getValue() }
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { email: email.getValue() }
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findAll(criteria?: UserSearchCriteria): Promise<User[]> {
    const queryBuilder = this.repository.createQueryBuilder('user');

    if (criteria?.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', {
        isActive: criteria.isActive
      });
    }

    if (criteria?.emailDomain) {
      queryBuilder.andWhere('user.email LIKE :domain', {
        domain: `%@${criteria.emailDomain}`
      });
    }

    if (criteria?.createdAfter) {
      queryBuilder.andWhere('user.createdAt >= :after', {
        after: criteria.createdAfter
      });
    }

    if (criteria?.createdBefore) {
      queryBuilder.andWhere('user.createdAt <= :before', {
        before: criteria.createdBefore
      });
    }

    if (criteria?.limit) {
      queryBuilder.take(criteria.limit);
    }

    if (criteria?.offset) {
      queryBuilder.skip(criteria.offset);
    }

    const entities = await queryBuilder.getMany();
    return entities.map(UserMapper.toDomain);
  }

  async delete(id: UserId): Promise<void> {
    await this.repository.delete({ id: id.getValue() });
  }

  async exists(id: UserId): Promise<boolean> {
    const count = await this.repository.count({
      where: { id: id.getValue() }
    });
    return count > 0;
  }
}
```

```typescript
// infrastructure/persistence/mappers/UserMapper.ts
// 映射器：领域模型与持久化实体之间的转换

import { User } from '../../../domain/model/entities/User';
import { Email } from '../../../domain/model/value-objects/Email';
import { Password } from '../../../domain/model/value-objects/Password';
import { UserId } from '../../../domain/model/value-objects/UserId';
import { UserEntity } from '../entities/UserEntity';

export class UserMapper {

  static toEntity(domain: User): UserEntity {
    const entity = new UserEntity();
    entity.id = domain.getId().getValue();
    entity.email = domain.getEmail().getValue();
    entity.passwordHash = domain.getPasswordHash();
    entity.isActive = domain.getIsActive();
    entity.createdAt = domain.getCreatedAt();
    return entity;
  }

  static toDomain(entity: UserEntity): User {
    return User.reconstitute(
      UserId.from(entity.id),
      Email.create(entity.email),
      Password.fromHash(entity.passwordHash),
      entity.isActive,
      entity.createdAt
    );
  }
}
```

```typescript
// infrastructure/external/SmtpEmailService.ts
// 外部服务适配器：邮件服务

import { IEmailService } from '../../application/ports/out/IEmailService';
import * as nodemailer from 'nodemailer';

export class SmtpEmailService implements IEmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(config: SmtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password
      }
    });
  }

  async sendWelcomeEmail(to: string): Promise<void> {
    await this.transporter.sendMail({
      from: '"My App" <noreply@myapp.com>',
      to,
      subject: '欢迎加入！',
      html: this.getWelcomeEmailTemplate()
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetLink = `https://myapp.com/reset-password?token=${resetToken}`;

    await this.transporter.sendMail({
      from: '"My App" <noreply@myapp.com>',
      to,
      subject: '重置密码',
      html: this.getPasswordResetTemplate(resetLink)
    });
  }

  private getWelcomeEmailTemplate(): string {
    return `
      <h1>欢迎加入！</h1>
      <p>感谢您的注册，期待与您一起成长。</p>
    `;
  }

  private getPasswordResetTemplate(resetLink: string): string {
    return `
      <h1>重置密码</h1>
      <p>点击下面的链接重置您的密码：</p>
      <a href="${resetLink}">重置密码</a>
      <p>如果您没有请求重置密码，请忽略此邮件。</p>
    `;
  }
}
```

---

## 依赖规则：洋葱架构的核心法则

洋葱架构最重要的原则是**依赖规则**（Dependency Rule）：

> **依赖只能从外向内，内层不能知道外层的任何信息。**

### 依赖规则的具体表现

```
┌────────────────────────────────────────────────────────────────┐
│                        基础设施层                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                      应用服务层                          │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │                  领域服务层                      │    │  │
│  │  │  ┌─────────────────────────────────────────┐    │    │  │
│  │  │  │              领域模型层                  │    │    │  │
│  │  │  │                                         │    │    │  │
│  │  │  │   实体、值对象、领域事件                 │    │    │  │
│  │  │  │   不依赖任何外层                        │    │    │  │
│  │  │  │                                         │    │    │  │
│  │  │  └─────────────────────────────────────────┘    │    │  │
│  │  │                      ▲                          │    │  │
│  │  │                      │ 依赖                     │    │  │
│  │  └──────────────────────┼──────────────────────────┘    │  │
│  │                         ▲                               │  │
│  │                         │ 依赖                          │  │
│  └─────────────────────────┼───────────────────────────────┘  │
│                            ▲                                  │
│                            │ 依赖                             │
└────────────────────────────┼──────────────────────────────────┘

                    箭头指向被依赖的层
```

### 如何实现依赖倒置

关键在于**在内层定义接口，在外层实现接口**：

```typescript
// 1. 在应用层定义接口（抽象）
// application/ports/out/IOrderRepository.ts

export interface IOrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
  findByCustomerId(customerId: CustomerId): Promise<Order[]>;
}
```

```typescript
// 2. 应用服务依赖抽象接口
// application/services/OrderApplicationService.ts

export class OrderApplicationService {
  constructor(
    // 依赖接口，而非具体实现
    private readonly orderRepository: IOrderRepository
  ) {}

  async createOrder(command: CreateOrderCommand): Promise<OrderId> {
    const order = Order.create(/* ... */);
    await this.orderRepository.save(order);
    return order.getId();
  }
}
```

```typescript
// 3. 在基础设施层提供具体实现
// infrastructure/persistence/PostgresOrderRepository.ts

export class PostgresOrderRepository implements IOrderRepository {
  constructor(private readonly db: Pool) {}

  async save(order: Order): Promise<void> {
    await this.db.query(
      'INSERT INTO orders (...) VALUES (...)',
      [/* ... */]
    );
  }

  async findById(id: OrderId): Promise<Order | null> {
    const result = await this.db.query(
      'SELECT * FROM orders WHERE id = $1',
      [id.getValue()]
    );
    return result.rows[0] ? OrderMapper.toDomain(result.rows[0]) : null;
  }

  async findByCustomerId(customerId: CustomerId): Promise<Order[]> {
    const result = await this.db.query(
      'SELECT * FROM orders WHERE customer_id = $1',
      [customerId.getValue()]
    );
    return result.rows.map(OrderMapper.toDomain);
  }
}
```

```typescript
// 4. 在组合根（Composition Root）中进行依赖注入
// infrastructure/di/Container.ts

import { Container } from 'inversify';

const container = new Container();

// 注册仓储实现
container.bind<IOrderRepository>(TYPES.OrderRepository)
  .to(PostgresOrderRepository)
  .inSingletonScope();

// 注册应用服务
container.bind<OrderApplicationService>(TYPES.OrderApplicationService)
  .to(OrderApplicationService);

export { container };
```

---

## 与其他架构的对比

### 洋葱架构 vs 传统分层架构

| 特性 | 传统分层架构 | 洋葱架构 |
|-----|------------|---------|
| 依赖方向 | 上层依赖下层（UI -> BLL -> DAL） | 外层依赖内层（Infrastructure -> Domain） |
| 核心层 | 数据访问层 | 领域模型层 |
| 业务逻辑位置 | 业务逻辑层（可能泄漏到其他层） | 领域模型和领域服务 |
| 数据库依赖 | 业务层直接依赖数据层 | 业务层通过接口抽象，完全解耦 |
| 可测试性 | 需要模拟数据库 | 领域层可独立测试 |
| 框架依赖 | 框架渗透各层 | 框架仅在最外层 |

### 洋葱架构 vs 六边形架构

```
洋葱架构：                           六边形架构：

  同心圆分层结构                       端口与适配器结构

  ┌─────────────────┐                 ┌─────────────────┐
  │  Infrastructure │                 │    Adapters     │
  │ ┌─────────────┐ │                 │   ┌───────┐     │
  │ │ Application │ │                 │   │ Ports │     │
  │ │ ┌─────────┐ │ │                 │   │┌─────┐│     │
  │ │ │ Domain  │ │ │        vs       │   ││Core ││     │
  │ │ │ Service │ │ │                 │   │└─────┘│     │
  │ │ │┌───────┐│ │ │                 │   └───────┘     │
  │ │ ││Model  ││ │ │                 │                 │
  │ │ │└───────┘│ │ │                 │                 │
  │ │ └─────────┘ │ │                 └─────────────────┘
  │ └─────────────┘ │
  └─────────────────┘

  强调层次和依赖方向                    强调端口和适配器
```

| 特性 | 洋葱架构 | 六边形架构 |
|-----|---------|----------|
| 核心概念 | 同心圆层次 | 端口与适配器 |
| 层次数量 | 4 层明确定义 | 3 个区域（核心、端口、适配器） |
| 领域服务 | 独立层次 | 属于应用核心 |
| 关注点 | 层次间的依赖规则 | 应用与外部世界的交互方式 |
| 视角 | 从内向外的依赖视角 | 从外向内的适配视角 |

### 洋葱架构 vs 整洁架构

```
整洁架构是洋葱架构的演进和综合：

整洁架构 = 洋葱架构 + 六边形架构 + 更明确的用例层

┌─────────────────────────────────────────────────────┐
│            Frameworks & Drivers (最外层)            │
│  ┌─────────────────────────────────────────────┐   │
│  │         Interface Adapters (适配器层)        │   │
│  │  ┌───────────────────────────────────────┐  │   │
│  │  │     Application Business (用例层)      │  │   │
│  │  │  ┌─────────────────────────────────┐  │  │   │
│  │  │  │    Enterprise Business (实体层)  │  │  │   │
│  │  │  └─────────────────────────────────┘  │  │   │
│  │  └───────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

| 特性 | 洋葱架构 | 整洁架构 |
|-----|---------|---------|
| 提出者 | Jeffrey Palermo (2008) | Robert C. Martin (2012) |
| 层次 | 4 层 | 4 层（更细化） |
| 接口适配器 | 属于基础设施层 | 独立的接口适配器层 |
| 用例 | 在应用服务层 | 独立强调用例层 |
| 企业规则 vs 应用规则 | 领域模型 vs 应用服务 | 实体 vs 用例 |

---

## 实际项目结构

### 推荐的目录结构

```
src/
├── domain/                          # 领域层（最内层）
│   ├── model/
│   │   ├── entities/                # 领域实体
│   │   │   ├── User.ts
│   │   │   ├── Order.ts
│   │   │   └── Product.ts
│   │   ├── value-objects/           # 值对象
│   │   │   ├── Email.ts
│   │   │   ├── Money.ts
│   │   │   └── Address.ts
│   │   ├── aggregates/              # 聚合根
│   │   │   └── OrderAggregate.ts
│   │   └── events/                  # 领域事件
│   │       ├── OrderCreatedEvent.ts
│   │       └── UserRegisteredEvent.ts
│   └── services/                    # 领域服务
│       ├── PricingService.ts
│       └── TransferService.ts
│
├── application/                     # 应用层
│   ├── services/                    # 应用服务
│   │   ├── UserApplicationService.ts
│   │   └── OrderApplicationService.ts
│   ├── ports/                       # 端口定义
│   │   ├── in/                      # 入站端口（主端口）
│   │   │   ├── IUserService.ts
│   │   │   └── IOrderService.ts
│   │   └── out/                     # 出站端口（次端口）
│   │       ├── IUserRepository.ts
│   │       ├── IOrderRepository.ts
│   │       ├── IEmailService.ts
│   │       └── IPaymentGateway.ts
│   ├── commands/                    # 命令对象
│   │   ├── CreateOrderCommand.ts
│   │   └── RegisterUserCommand.ts
│   ├── queries/                     # 查询对象
│   │   ├── GetOrderQuery.ts
│   │   └── SearchUsersQuery.ts
│   └── dto/                         # 数据传输对象
│       ├── OrderDto.ts
│       └── UserDto.ts
│
├── infrastructure/                  # 基础设施层（最外层）
│   ├── persistence/                 # 持久化
│   │   ├── repositories/
│   │   │   ├── TypeOrmUserRepository.ts
│   │   │   └── TypeOrmOrderRepository.ts
│   │   ├── entities/                # ORM 实体
│   │   │   ├── UserEntity.ts
│   │   │   └── OrderEntity.ts
│   │   └── mappers/                 # 映射器
│   │       ├── UserMapper.ts
│   │       └── OrderMapper.ts
│   ├── external/                    # 外部服务
│   │   ├── SmtpEmailService.ts
│   │   ├── StripePaymentGateway.ts
│   │   └── RedisCache.ts
│   ├── messaging/                   # 消息队列
│   │   ├── RabbitMqEventPublisher.ts
│   │   └── KafkaEventConsumer.ts
│   ├── web/                         # Web 层
│   │   ├── controllers/
│   │   │   ├── UserController.ts
│   │   │   └── OrderController.ts
│   │   ├── middleware/
│   │   │   ├── AuthMiddleware.ts
│   │   │   └── ErrorHandler.ts
│   │   └── routes/
│   │       └── index.ts
│   └── di/                          # 依赖注入
│       ├── Container.ts
│       └── types.ts
│
└── main.ts                          # 应用入口
```

### 完整的用例实现示例

```typescript
// 完整的订单创建流程示例

// ============ 领域层 ============

// domain/model/entities/Order.ts
export class Order {
  private readonly id: OrderId;
  private readonly customerId: CustomerId;
  private items: OrderItem[];
  private status: OrderStatus;
  private totalAmount: Money;
  private readonly createdAt: Date;
  private domainEvents: DomainEvent[] = [];

  private constructor(
    id: OrderId,
    customerId: CustomerId,
    items: OrderItem[]
  ) {
    this.id = id;
    this.customerId = customerId;
    this.items = items;
    this.status = OrderStatus.PENDING;
    this.totalAmount = this.calculateTotal();
    this.createdAt = new Date();
  }

  static create(customerId: CustomerId, items: OrderItem[]): Order {
    if (items.length === 0) {
      throw new EmptyOrderError();
    }

    const order = new Order(OrderId.generate(), customerId, items);
    order.addDomainEvent(new OrderCreatedEvent(order.id, customerId));
    return order;
  }

  private calculateTotal(): Money {
    return this.items.reduce(
      (total, item) => total.add(item.getSubtotal()),
      Money.zero()
    );
  }

  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStateError(this.id, this.status, 'confirm');
    }
    this.status = OrderStatus.CONFIRMED;
    this.addDomainEvent(new OrderConfirmedEvent(this.id));
  }

  ship(trackingNumber: string): void {
    if (this.status !== OrderStatus.CONFIRMED) {
      throw new InvalidOrderStateError(this.id, this.status, 'ship');
    }
    this.status = OrderStatus.SHIPPED;
    this.addDomainEvent(new OrderShippedEvent(this.id, trackingNumber));
  }

  cancel(reason: string): void {
    if (this.status === OrderStatus.SHIPPED || this.status === OrderStatus.DELIVERED) {
      throw new OrderCannotBeCancelledError(this.id, this.status);
    }
    this.status = OrderStatus.CANCELLED;
    this.addDomainEvent(new OrderCancelledEvent(this.id, reason));
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  // Getters
  getId(): OrderId { return this.id; }
  getCustomerId(): CustomerId { return this.customerId; }
  getItems(): ReadonlyArray<OrderItem> { return [...this.items]; }
  getStatus(): OrderStatus { return this.status; }
  getTotalAmount(): Money { return this.totalAmount; }
}

// ============ 应用层 ============

// application/services/OrderApplicationService.ts
export class OrderApplicationService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly productRepository: IProductRepository,
    private readonly paymentGateway: IPaymentGateway,
    private readonly eventPublisher: IEventPublisher,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async createOrder(command: CreateOrderCommand): Promise<CreateOrderResult> {
    // 1. 验证客户存在
    const customer = await this.customerRepository.findById(
      CustomerId.from(command.customerId)
    );
    if (!customer) {
      throw new CustomerNotFoundError(command.customerId);
    }

    // 2. 验证并获取商品信息
    const orderItems: OrderItem[] = [];
    for (const item of command.items) {
      const product = await this.productRepository.findById(
        ProductId.from(item.productId)
      );
      if (!product) {
        throw new ProductNotFoundError(item.productId);
      }
      if (!product.hasStock(item.quantity)) {
        throw new InsufficientStockError(item.productId, item.quantity);
      }

      orderItems.push(OrderItem.create(product, item.quantity));
    }

    // 3. 创建订单（领域逻辑）
    const order = Order.create(customer.getId(), orderItems);

    // 4. 持久化
    await this.unitOfWork.begin();
    try {
      // 扣减库存
      for (const item of command.items) {
        await this.productRepository.decreaseStock(
          ProductId.from(item.productId),
          item.quantity
        );
      }

      // 保存订单
      await this.orderRepository.save(order);

      // 发布领域事件
      const events = order.pullDomainEvents();
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }

      await this.unitOfWork.commit();
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }

    return {
      orderId: order.getId().getValue(),
      totalAmount: order.getTotalAmount().getAmount(),
      status: order.getStatus()
    };
  }

  async confirmOrder(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(OrderId.from(orderId));
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    order.confirm();

    await this.unitOfWork.begin();
    try {
      await this.orderRepository.save(order);

      const events = order.pullDomainEvents();
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }

      await this.unitOfWork.commit();
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }

  async payOrder(orderId: string, paymentInfo: PaymentInfo): Promise<PaymentResult> {
    const order = await this.orderRepository.findById(OrderId.from(orderId));
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    // 调用支付网关
    const paymentResult = await this.paymentGateway.processPayment({
      orderId: order.getId().getValue(),
      amount: order.getTotalAmount(),
      paymentMethod: paymentInfo.method,
      paymentDetails: paymentInfo.details
    });

    if (paymentResult.success) {
      order.confirm();
      await this.orderRepository.save(order);
    }

    return paymentResult;
  }
}

// ============ 基础设施层 ============

// infrastructure/web/controllers/OrderController.ts
import { Request, Response } from 'express';

export class OrderController {
  constructor(
    private readonly orderService: OrderApplicationService
  ) {}

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const command: CreateOrderCommand = {
        customerId: req.body.customerId,
        items: req.body.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      const result = await this.orderService.createOrder(command);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async confirmOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      await this.orderService.confirmOrder(orderId);

      res.status(200).json({
        success: true,
        message: '订单已确认'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: any, res: Response): void {
    if (error instanceof OrderNotFoundError) {
      res.status(404).json({ success: false, error: error.message });
    } else if (error instanceof InsufficientStockError) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: '服务器内部错误' });
    }
  }
}
```

---

## 测试策略

洋葱架构的一大优势是支持不同层次的隔离测试：

### 领域层单元测试

```typescript
// domain/model/entities/__tests__/Order.test.ts
describe('Order', () => {
  describe('create', () => {
    it('应该创建一个待处理状态的订单', () => {
      const customerId = CustomerId.generate();
      const items = [
        OrderItem.create(createMockProduct(), 2)
      ];

      const order = Order.create(customerId, items);

      expect(order.getStatus()).toBe(OrderStatus.PENDING);
      expect(order.getCustomerId()).toEqual(customerId);
      expect(order.getItems()).toHaveLength(1);
    });

    it('空订单项应该抛出异常', () => {
      const customerId = CustomerId.generate();

      expect(() => Order.create(customerId, []))
        .toThrow(EmptyOrderError);
    });
  });

  describe('confirm', () => {
    it('待处理订单可以确认', () => {
      const order = createPendingOrder();

      order.confirm();

      expect(order.getStatus()).toBe(OrderStatus.CONFIRMED);
    });

    it('已发货订单不能再确认', () => {
      const order = createShippedOrder();

      expect(() => order.confirm())
        .toThrow(InvalidOrderStateError);
    });
  });

  describe('cancel', () => {
    it('待处理订单可以取消', () => {
      const order = createPendingOrder();

      order.cancel('用户取消');

      expect(order.getStatus()).toBe(OrderStatus.CANCELLED);
    });

    it('已发货订单不能取消', () => {
      const order = createShippedOrder();

      expect(() => order.cancel('想取消'))
        .toThrow(OrderCannotBeCancelledError);
    });
  });

  describe('domain events', () => {
    it('创建订单应该产生 OrderCreatedEvent', () => {
      const customerId = CustomerId.generate();
      const items = [OrderItem.create(createMockProduct(), 1)];

      const order = Order.create(customerId, items);
      const events = order.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OrderCreatedEvent);
    });
  });
});
```

### 领域服务测试

```typescript
// domain/services/__tests__/PricingService.test.ts
describe('PricingService', () => {
  let pricingService: PricingService;

  beforeEach(() => {
    pricingService = new PricingService();
  });

  describe('calculatePrice', () => {
    it('普通会员购买 1 件商品应返回原价', () => {
      const product = createProduct(Money.of(100, Currency.CNY));
      const customer = createCustomer(MemberLevel.BRONZE);

      const result = pricingService.calculatePrice(product, customer, 1);

      // 2% 会员折扣
      expect(result.finalPrice.getAmount()).toBe(98);
    });

    it('金卡会员批量购买应叠加折扣', () => {
      const product = createProduct(Money.of(100, Currency.CNY));
      const customer = createCustomer(MemberLevel.GOLD);

      const result = pricingService.calculatePrice(product, customer, 50);

      // 10% 金卡折扣 + 15% 批量折扣
      // 100 * 50 = 5000
      // 5000 * 0.90 * 0.85 = 3825
      expect(result.finalPrice.getAmount()).toBe(3825);
    });
  });
});
```

### 应用服务集成测试

```typescript
// application/services/__tests__/OrderApplicationService.test.ts
describe('OrderApplicationService', () => {
  let orderService: OrderApplicationService;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockCustomerRepository: jest.Mocked<ICustomerRepository>;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockPaymentGateway: jest.Mocked<IPaymentGateway>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;

  beforeEach(() => {
    mockOrderRepository = createMockOrderRepository();
    mockCustomerRepository = createMockCustomerRepository();
    mockProductRepository = createMockProductRepository();
    mockPaymentGateway = createMockPaymentGateway();
    mockEventPublisher = createMockEventPublisher();
    mockUnitOfWork = createMockUnitOfWork();

    orderService = new OrderApplicationService(
      mockOrderRepository,
      mockCustomerRepository,
      mockProductRepository,
      mockPaymentGateway,
      mockEventPublisher,
      mockUnitOfWork
    );
  });

  describe('createOrder', () => {
    it('成功创建订单', async () => {
      // Arrange
      const customer = createCustomer();
      const product = createProduct();
      mockCustomerRepository.findById.mockResolvedValue(customer);
      mockProductRepository.findById.mockResolvedValue(product);

      const command: CreateOrderCommand = {
        customerId: customer.getId().getValue(),
        items: [{ productId: product.getId().getValue(), quantity: 2 }]
      };

      // Act
      const result = await orderService.createOrder(command);

      // Assert
      expect(result.orderId).toBeDefined();
      expect(mockOrderRepository.save).toHaveBeenCalled();
      expect(mockUnitOfWork.commit).toHaveBeenCalled();
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.any(OrderCreatedEvent)
      );
    });

    it('客户不存在应抛出异常', async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      const command: CreateOrderCommand = {
        customerId: 'non-existent',
        items: [{ productId: 'product-1', quantity: 1 }]
      };

      await expect(orderService.createOrder(command))
        .rejects.toThrow(CustomerNotFoundError);
    });

    it('库存不足应回滚事务', async () => {
      const customer = createCustomer();
      const product = createProductWithoutStock();
      mockCustomerRepository.findById.mockResolvedValue(customer);
      mockProductRepository.findById.mockResolvedValue(product);

      const command: CreateOrderCommand = {
        customerId: customer.getId().getValue(),
        items: [{ productId: product.getId().getValue(), quantity: 100 }]
      };

      await expect(orderService.createOrder(command))
        .rejects.toThrow(InsufficientStockError);
      expect(mockUnitOfWork.rollback).toHaveBeenCalled();
    });
  });
});
```

---

## 最佳实践

### 保持领域模型纯净

```typescript
// 正确：领域实体只包含业务逻辑
export class Product {
  private readonly id: ProductId;
  private name: string;
  private price: Money;
  private stock: number;

  // 业务方法
  decreaseStock(quantity: number): void {
    if (quantity > this.stock) {
      throw new InsufficientStockError(this.id, quantity);
    }
    this.stock -= quantity;
  }
}

// 错误：领域实体包含基础设施关注点
export class Product {
  @Column()  // 不要有 ORM 注解
  private name: string;

  async save(): Promise<void> {  // 不要有持久化方法
    await database.save(this);
  }
}
```

### 接口定义在内层

```typescript
// 正确：接口定义在应用层
// application/ports/out/IOrderRepository.ts
export interface IOrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
}

// 错误：接口定义在基础设施层
// infrastructure/repositories/IOrderRepository.ts  // 位置错误
```

### 使用工厂方法创建聚合

```typescript
// 使用工厂方法确保实体创建的完整性
export class Order {
  private constructor(/* ... */) {}

  // 工厂方法
  static create(customerId: CustomerId, items: OrderItem[]): Order {
    // 验证不变量
    if (items.length === 0) {
      throw new EmptyOrderError();
    }

    const order = new Order(/* ... */);
    order.addDomainEvent(new OrderCreatedEvent(/* ... */));
    return order;
  }

  // 重建方法（从持久化恢复）
  static reconstitute(
    id: OrderId,
    customerId: CustomerId,
    items: OrderItem[],
    status: OrderStatus
  ): Order {
    // 不触发领域事件
    return new Order(id, customerId, items, status);
  }
}
```

### 应用服务协调，不实现业务逻辑

```typescript
// 正确：应用服务只协调
export class OrderApplicationService {
  async createOrder(command: CreateOrderCommand): Promise<OrderId> {
    const customer = await this.customerRepo.findById(/* ... */);
    const items = await this.buildOrderItems(command.items);

    // 业务逻辑在领域实体中
    const order = Order.create(customer.getId(), items);

    await this.orderRepo.save(order);
    return order.getId();
  }
}

// 错误：应用服务包含业务逻辑
export class OrderApplicationService {
  async createOrder(command: CreateOrderCommand): Promise<OrderId> {
    // 这些逻辑应该在 Order 实体中
    if (command.items.length === 0) {
      throw new EmptyOrderError();
    }

    const total = command.items.reduce((sum, item) =>
      sum + item.price * item.quantity, 0
    );

    // ...
  }
}
```

### 依赖注入配置集中管理

```typescript
// infrastructure/di/Container.ts
import { Container } from 'inversify';
import 'reflect-metadata';

const container = new Container();

// 仓储
container.bind<IOrderRepository>(TYPES.OrderRepository)
  .to(PostgresOrderRepository)
  .inRequestScope();

container.bind<ICustomerRepository>(TYPES.CustomerRepository)
  .to(PostgresCustomerRepository)
  .inRequestScope();

// 外部服务
container.bind<IPaymentGateway>(TYPES.PaymentGateway)
  .to(StripePaymentGateway)
  .inSingletonScope();

container.bind<IEmailService>(TYPES.EmailService)
  .to(SendGridEmailService)
  .inSingletonScope();

// 应用服务
container.bind<OrderApplicationService>(TYPES.OrderApplicationService)
  .to(OrderApplicationService);

container.bind<UserApplicationService>(TYPES.UserApplicationService)
  .to(UserApplicationService);

export { container };
```

---

## 常见陷阱与解决方案

### 陷阱 1：贫血领域模型

```typescript
// 反模式：贫血模型（只有 getter/setter）
class Order {
  private id: string;
  private status: string;
  private items: any[];

  getId() { return this.id; }
  setId(id: string) { this.id = id; }
  getStatus() { return this.status; }
  setStatus(status: string) { this.status = status; }  // 危险！
}

// 解决方案：充血模型（封装业务行为）
class Order {
  private readonly id: OrderId;
  private status: OrderStatus;

  // 通过业务方法改变状态
  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStateError(/* ... */);
    }
    this.status = OrderStatus.CONFIRMED;
  }
}
```

### 陷阱 2：领域层依赖基础设施

```typescript
// 反模式：领域实体依赖数据库
class User {
  async save(): Promise<void> {
    await db.query('INSERT INTO users...');  // 错误！
  }
}

// 解决方案：通过仓储接口解耦
// 应用层
interface IUserRepository {
  save(user: User): Promise<void>;
}

// 基础设施层
class PostgresUserRepository implements IUserRepository {
  async save(user: User): Promise<void> {
    await this.db.query('INSERT INTO users...');
  }
}
```

### 陷阱 3：过度分层

```typescript
// 反模式：为每个操作创建过多的层次
UserController -> UserFacade -> UserService -> UserManager
  -> UserHandler -> UserRepository

// 解决方案：保持四层结构
UserController -> UserApplicationService -> Domain Model
  -> UserRepository (interface)
```

### 陷阱 4：跨层直接调用

```typescript
// 反模式：Controller 直接调用 Repository
class OrderController {
  constructor(private orderRepo: IOrderRepository) {}  // 错误！

  async getOrder(req: Request, res: Response) {
    const order = await this.orderRepo.findById(/* ... */);
    res.json(order);
  }
}

// 解决方案：通过应用服务协调
class OrderController {
  constructor(private orderService: OrderApplicationService) {}

  async getOrder(req: Request, res: Response) {
    const order = await this.orderService.getOrderById(/* ... */);
    res.json(order);
  }
}
```

---

## 总结

洋葱架构通过明确的层次划分和严格的依赖规则，帮助我们构建可维护、可测试、可扩展的软件系统。其核心要点包括：

1. **领域模型是核心**：所有其他层都围绕领域模型构建，领域逻辑是最稳定的部分

2. **依赖向内**：外层依赖内层，内层对外层无感知，通过依赖倒置实现解耦

3. **基础设施在外层**：数据库、框架、外部服务等技术细节被推到最外层，成为可替换的插件

4. **接口定义在内层**：在应用层定义接口，在基础设施层实现，遵循依赖倒置原则

5. **测试友好**：各层可以独立测试，领域层的单元测试不需要任何外部依赖

洋葱架构与六边形架构、整洁架构一脉相承，都强调将业务逻辑与技术细节分离。在实际项目中，可以根据具体需求灵活运用这些架构思想，重要的是理解其背后的原则：**关注点分离**和**依赖倒置**。
