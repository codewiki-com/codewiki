---
title: 六边形架构完全指南
description: 掌握六边形架构（端口适配器），构建可测试的系统
track: architecture
section: design-patterns
difficulty: advanced
tags:
  - 六边形架构
  - 端口适配器
  - 架构模式
  - DDD
status: imported
origin: old/src/content/docs/architecture/hexagonal.zh.md
divergence: 0.219
issues:
  - title-lang-en
  - title-language
legacy:
  category: Architecture
  subcategory: Patterns
  order: 15
  lastUpdated: 2026-01-07
---

## 概念解释

六边形架构（Hexagonal Architecture）是由 Alistair Cockburn 在 2005 年提出的一种软件架构模式，又称为"端口与适配器架构"（Ports and Adapters Architecture）。这一架构的核心目标是将应用程序的核心业务逻辑与外部世界（如数据库、用户界面、消息队列等）彻底隔离，使得系统更易于测试、维护和扩展。

### 为什么需要六边形架构？

在传统的分层架构中，我们经常遇到以下问题：

1. **紧耦合**：业务逻辑与数据库访问、UI 框架紧密绑定
2. **测试困难**：需要启动数据库、Web 服务器才能测试业务逻辑
3. **技术锁定**：更换数据库或 UI 框架代价极高
4. **边界模糊**：业务规则分散在各个层次，难以识别核心逻辑
5. **依赖方向混乱**：高层模块依赖低层模块的具体实现

六边形架构通过明确的边界定义和依赖倒置，解决了这些问题。其核心理念是：

> **应用程序应该以相同的方式对待所有外部系统，无论它们是人类用户、自动化测试、数据库还是外部服务。**

### 六边形架构的核心思想

六边形架构将系统分为三个主要区域：

```
                              外部世界
                                 │
                    ┌────────────┼────────────┐
                    │            ▼            │
                    │    ┌─────────────┐      │
                    │    │   适配器    │      │
          用户 ─────┼───►│  (Adapter)  │      │
                    │    └──────┬──────┘      │
                    │           │             │
                    │    ┌──────▼──────┐      │
                    │    │    端口     │      │
                    │    │   (Port)    │      │
                    │    └──────┬──────┘      │
        ┌───────────┼───────────┼─────────────┼───────────┐
        │           │    ┌──────▼──────┐      │           │
        │           │    │             │      │           │
        │           │    │   应用核心   │      │           │
        │  数据库 ◄─┼────│  (Domain)   │◄─────┼──── API   │
        │           │    │             │      │           │
        │           │    └─────────────┘      │           │
        └───────────┼─────────────────────────┼───────────┘
                    │                         │
                    └─────────────────────────┘
                           六边形边界
```

---

## 核心原理：端口与适配器

六边形架构的精髓在于"端口与适配器"的设计模式。理解这两个概念是掌握六边形架构的关键。

### 端口（Ports）

端口是应用核心与外部世界通信的接口定义。端口分为两种类型：

#### 主端口（Primary Ports / Driving Ports）

主端口定义了应用程序**对外提供的功能**，即外部世界如何驱动应用程序。

```typescript
// application/ports/in/OrderService.ts
// 主端口：定义应用程序提供的服务

export interface CreateOrderCommand {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: Address;
}

export interface CreateOrderResult {
  orderId: string;
  totalAmount: number;
  estimatedDelivery: Date;
}

// 主端口接口
export interface OrderService {
  createOrder(command: CreateOrderCommand): Promise<CreateOrderResult>;
  cancelOrder(orderId: string, reason: string): Promise<void>;
  getOrderDetails(orderId: string): Promise<OrderDetails | null>;
  listCustomerOrders(customerId: string): Promise<OrderSummary[]>;
}
```

```typescript
// application/ports/in/InventoryService.ts
export interface InventoryService {
  checkAvailability(productId: string, quantity: number): Promise<boolean>;
  reserveStock(orderId: string, items: StockReservation[]): Promise<void>;
  releaseStock(orderId: string): Promise<void>;
}
```

#### 次端口（Secondary Ports / Driven Ports）

次端口定义了应用程序**需要的外部能力**，即应用程序需要驱动哪些外部系统。

```typescript
// application/ports/out/OrderRepository.ts
// 次端口：定义应用程序需要的持久化能力

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  delete(id: OrderId): Promise<void>;
  nextId(): OrderId;
}
```

```typescript
// application/ports/out/PaymentGateway.ts
// 次端口：定义应用程序需要的支付能力

export interface PaymentRequest {
  orderId: string;
  amount: Money;
  customerId: string;
  paymentMethod: PaymentMethod;
}

export interface PaymentResult {
  transactionId: string;
  status: 'success' | 'failed' | 'pending';
  processedAt: Date;
}

export interface PaymentGateway {
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
  refund(transactionId: string, amount: Money): Promise<RefundResult>;
  getTransactionStatus(transactionId: string): Promise<TransactionStatus>;
}
```

```typescript
// application/ports/out/NotificationService.ts
// 次端口：定义应用程序需要的通知能力

export interface NotificationService {
  sendOrderConfirmation(orderId: string, customerEmail: string): Promise<void>;
  sendShipmentNotification(orderId: string, trackingNumber: string): Promise<void>;
  sendPaymentFailedAlert(orderId: string, reason: string): Promise<void>;
}
```

### 适配器（Adapters）

适配器是端口的具体实现，负责将外部系统的技术细节与应用核心隔离。

#### 主适配器（Primary Adapters / Driving Adapters）

主适配器实现主端口，将外部请求转换为应用程序可理解的格式。

```typescript
// adapters/in/web/OrderController.ts
// 主适配器：HTTP 控制器

import { Router, Request, Response } from 'express';

export class OrderController {
  private router: Router;

  constructor(
    private readonly orderService: OrderService
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/orders', this.createOrder.bind(this));
    this.router.delete('/orders/:id', this.cancelOrder.bind(this));
    this.router.get('/orders/:id', this.getOrder.bind(this));
    this.router.get('/customers/:customerId/orders', this.listOrders.bind(this));
  }

  // POST /orders
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      // 将 HTTP 请求转换为应用层命令
      const command: CreateOrderCommand = {
        customerId: req.body.customerId,
        items: req.body.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        shippingAddress: {
          province: req.body.shippingAddress.province,
          city: req.body.shippingAddress.city,
          district: req.body.shippingAddress.district,
          street: req.body.shippingAddress.street,
          postalCode: req.body.shippingAddress.postalCode
        }
      };

      // 调用应用服务
      const result = await this.orderService.createOrder(command);

      // 将结果转换为 HTTP 响应
      res.status(201).json({
        success: true,
        data: {
          orderId: result.orderId,
          totalAmount: result.totalAmount,
          estimatedDelivery: result.estimatedDelivery.toISOString()
        }
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // DELETE /orders/:id
  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.id;
      const reason = req.body.reason || 'Customer requested cancellation';

      await this.orderService.cancelOrder(orderId, reason);

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /orders/:id
  async getOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.id;
      const order = await this.orderService.getOrderDetails(orderId);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof OrderNotFoundError) {
      res.status(404).json({ success: false, error: error.message });
    } else if (error instanceof ValidationError) {
      res.status(400).json({ success: false, error: error.message });
    } else if (error instanceof InsufficientStockError) {
      res.status(409).json({ success: false, error: error.message });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  getRouter(): Router {
    return this.router;
  }
}
```

```typescript
// adapters/in/cli/OrderCLI.ts
// 主适配器：命令行接口

import { Command } from 'commander';

export class OrderCLI {
  private program: Command;

  constructor(
    private readonly orderService: OrderService
  ) {
    this.program = new Command();
    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .command('create-order')
      .description('Create a new order')
      .requiredOption('-c, --customer <id>', 'Customer ID')
      .requiredOption('-p, --products <items>', 'Products (format: id:qty,id:qty)')
      .action(async (options) => {
        const items = this.parseProducts(options.products);

        const result = await this.orderService.createOrder({
          customerId: options.customer,
          items,
          shippingAddress: await this.promptShippingAddress()
        });

        console.log(`Order created successfully!`);
        console.log(`Order ID: ${result.orderId}`);
        console.log(`Total: ${result.totalAmount}`);
      });

    this.program
      .command('cancel-order')
      .description('Cancel an existing order')
      .requiredOption('-o, --order <id>', 'Order ID')
      .option('-r, --reason <reason>', 'Cancellation reason')
      .action(async (options) => {
        await this.orderService.cancelOrder(
          options.order,
          options.reason || 'Cancelled via CLI'
        );
        console.log('Order cancelled successfully!');
      });
  }

  private parseProducts(productsStr: string): Array<{ productId: string; quantity: number }> {
    return productsStr.split(',').map(item => {
      const [productId, qty] = item.split(':');
      return { productId, quantity: parseInt(qty, 10) };
    });
  }

  async run(): Promise<void> {
    await this.program.parseAsync(process.argv);
  }
}
```

```typescript
// adapters/in/message/OrderMessageConsumer.ts
// 主适配器：消息队列消费者

export class OrderMessageConsumer {
  constructor(
    private readonly orderService: OrderService,
    private readonly messageQueue: MessageQueue
  ) {}

  async start(): Promise<void> {
    await this.messageQueue.subscribe('order.commands', async (message) => {
      switch (message.type) {
        case 'CREATE_ORDER':
          await this.handleCreateOrder(message.payload);
          break;
        case 'CANCEL_ORDER':
          await this.handleCancelOrder(message.payload);
          break;
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    });
  }

  private async handleCreateOrder(payload: any): Promise<void> {
    try {
      const result = await this.orderService.createOrder({
        customerId: payload.customerId,
        items: payload.items,
        shippingAddress: payload.shippingAddress
      });

      // 发布成功事件
      await this.messageQueue.publish('order.events', {
        type: 'ORDER_CREATED',
        payload: result
      });
    } catch (error) {
      // 发布失败事件
      await this.messageQueue.publish('order.events', {
        type: 'ORDER_CREATION_FAILED',
        payload: { error: (error as Error).message }
      });
    }
  }

  private async handleCancelOrder(payload: any): Promise<void> {
    await this.orderService.cancelOrder(payload.orderId, payload.reason);
  }
}
```

#### 次适配器（Secondary Adapters / Driven Adapters）

次适配器实现次端口，将应用程序的请求转换为外部系统可理解的格式。

```typescript
// adapters/out/persistence/PostgresOrderRepository.ts
// 次适配器：PostgreSQL 实现

import { Pool, PoolClient } from 'pg';

export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}

  async save(order: Order): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const snapshot = order.toSnapshot();

      // 保存订单主表
      await client.query(`
        INSERT INTO orders (id, customer_id, status, shipping_address, total_amount, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          shipping_address = EXCLUDED.shipping_address,
          total_amount = EXCLUDED.total_amount,
          updated_at = NOW()
      `, [
        snapshot.id,
        snapshot.customerId,
        snapshot.status,
        JSON.stringify(snapshot.shippingAddress),
        snapshot.totalAmount,
        snapshot.createdAt
      ]);

      // 删除旧的订单项
      await client.query('DELETE FROM order_items WHERE order_id = $1', [snapshot.id]);

      // 插入新的订单项
      for (const item of snapshot.items) {
        await client.query(`
          INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          snapshot.id,
          item.productId,
          item.productName,
          item.quantity,
          item.unitPrice,
          item.subtotal
        ]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: OrderId): Promise<Order | null> {
    const orderResult = await this.pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id.value]
    );

    if (orderResult.rows.length === 0) {
      return null;
    }

    const orderRow = orderResult.rows[0];

    const itemsResult = await this.pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id.value]
    );

    return this.toDomain(orderRow, itemsResult.rows);
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const ordersResult = await this.pool.query(
      'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
      [customerId]
    );

    const orders: Order[] = [];

    for (const orderRow of ordersResult.rows) {
      const itemsResult = await this.pool.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [orderRow.id]
      );
      orders.push(this.toDomain(orderRow, itemsResult.rows));
    }

    return orders;
  }

  async delete(id: OrderId): Promise<void> {
    await this.pool.query('DELETE FROM order_items WHERE order_id = $1', [id.value]);
    await this.pool.query('DELETE FROM orders WHERE id = $1', [id.value]);
  }

  nextId(): OrderId {
    return new OrderId(crypto.randomUUID());
  }

  private toDomain(orderRow: any, itemRows: any[]): Order {
    return Order.reconstitute({
      id: orderRow.id,
      customerId: orderRow.customer_id,
      status: orderRow.status,
      shippingAddress: JSON.parse(orderRow.shipping_address),
      items: itemRows.map(item => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        currency: 'CNY'
      })),
      totalAmount: orderRow.total_amount,
      createdAt: orderRow.created_at.toISOString()
    });
  }
}
```

```typescript
// adapters/out/persistence/InMemoryOrderRepository.ts
// 次适配器：内存实现（用于测试）

export class InMemoryOrderRepository implements OrderRepository {
  private orders: Map<string, Order> = new Map();
  private idCounter: number = 0;

  async save(order: Order): Promise<void> {
    this.orders.set(order.id.value, order);
  }

  async findById(id: OrderId): Promise<Order | null> {
    return this.orders.get(id.value) || null;
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.customerId === customerId);
  }

  async delete(id: OrderId): Promise<void> {
    this.orders.delete(id.value);
  }

  nextId(): OrderId {
    return new OrderId(`order-${++this.idCounter}`);
  }

  // 测试辅助方法
  clear(): void {
    this.orders.clear();
    this.idCounter = 0;
  }

  getAll(): Order[] {
    return Array.from(this.orders.values());
  }
}
```

```typescript
// adapters/out/payment/StripePaymentGateway.ts
// 次适配器：Stripe 支付实现

import Stripe from 'stripe';

export class StripePaymentGateway implements PaymentGateway {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' });
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount.value * 100), // Stripe 使用分
        currency: request.amount.currency.toLowerCase(),
        metadata: {
          orderId: request.orderId,
          customerId: request.customerId
        },
        payment_method: this.mapPaymentMethod(request.paymentMethod),
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      });

      return {
        transactionId: paymentIntent.id,
        status: this.mapStatus(paymentIntent.status),
        processedAt: new Date()
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        return {
          transactionId: '',
          status: 'failed',
          processedAt: new Date()
        };
      }
      throw error;
    }
  }

  async refund(transactionId: string, amount: Money): Promise<RefundResult> {
    const refund = await this.stripe.refunds.create({
      payment_intent: transactionId,
      amount: Math.round(amount.value * 100)
    });

    return {
      refundId: refund.id,
      status: refund.status === 'succeeded' ? 'completed' : 'pending',
      processedAt: new Date()
    };
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(transactionId);

    return {
      transactionId,
      status: this.mapStatus(paymentIntent.status),
      amount: Money.create(paymentIntent.amount / 100, paymentIntent.currency.toUpperCase())
    };
  }

  private mapPaymentMethod(method: PaymentMethod): string {
    // 映射内部支付方式到 Stripe 支付方式
    const mapping: Record<string, string> = {
      'CREDIT_CARD': 'pm_card_visa',
      'DEBIT_CARD': 'pm_card_visa_debit',
      'ALIPAY': 'pm_alipay'
    };
    return mapping[method] || 'pm_card_visa';
  }

  private mapStatus(stripeStatus: string): 'success' | 'failed' | 'pending' {
    switch (stripeStatus) {
      case 'succeeded':
        return 'success';
      case 'canceled':
      case 'requires_payment_method':
        return 'failed';
      default:
        return 'pending';
    }
  }
}
```

```typescript
// adapters/out/notification/SendGridNotificationService.ts
// 次适配器：SendGrid 邮件实现

import sgMail from '@sendgrid/mail';

export class SendGridNotificationService implements NotificationService {
  constructor(apiKey: string, private readonly fromEmail: string) {
    sgMail.setApiKey(apiKey);
  }

  async sendOrderConfirmation(orderId: string, customerEmail: string): Promise<void> {
    await sgMail.send({
      to: customerEmail,
      from: this.fromEmail,
      subject: `订单确认 - ${orderId}`,
      templateId: 'd-order-confirmation-template',
      dynamicTemplateData: {
        orderId,
        orderDate: new Date().toLocaleDateString('zh-CN')
      }
    });
  }

  async sendShipmentNotification(orderId: string, trackingNumber: string): Promise<void> {
    // 实现发货通知
    await sgMail.send({
      to: await this.getCustomerEmail(orderId),
      from: this.fromEmail,
      subject: `发货通知 - ${orderId}`,
      templateId: 'd-shipment-notification-template',
      dynamicTemplateData: {
        orderId,
        trackingNumber
      }
    });
  }

  async sendPaymentFailedAlert(orderId: string, reason: string): Promise<void> {
    await sgMail.send({
      to: await this.getCustomerEmail(orderId),
      from: this.fromEmail,
      subject: `支付失败通知 - ${orderId}`,
      templateId: 'd-payment-failed-template',
      dynamicTemplateData: {
        orderId,
        reason
      }
    });
  }

  private async getCustomerEmail(orderId: string): Promise<string> {
    // 实际实现中需要查询订单获取客户邮箱
    return 'customer@example.com';
  }
}
```

---

## 领域隔离：应用核心的设计

六边形架构的核心优势在于将领域逻辑与外部世界完全隔离。应用核心不依赖任何框架、数据库或外部服务的具体实现。

### 应用核心结构

```
domain/
├── entities/              # 实体
│   ├── Order.ts
│   ├── OrderItem.ts
│   └── Customer.ts
├── value-objects/         # 值对象
│   ├── OrderId.ts
│   ├── Money.ts
│   └── Address.ts
├── events/                # 领域事件
│   ├── OrderCreated.ts
│   ├── OrderShipped.ts
│   └── OrderCancelled.ts
├── services/              # 领域服务
│   └── PricingService.ts
└── errors/                # 领域异常
    ├── OrderNotFoundError.ts
    ├── InsufficientStockError.ts
    └── InvalidOrderStateError.ts

application/
├── ports/
│   ├── in/                # 主端口（入站）
│   │   ├── OrderService.ts
│   │   └── InventoryService.ts
│   └── out/               # 次端口（出站）
│       ├── OrderRepository.ts
│       ├── PaymentGateway.ts
│       └── NotificationService.ts
├── services/              # 应用服务（用例实现）
│   ├── OrderApplicationService.ts
│   └── InventoryApplicationService.ts
└── dto/                   # 数据传输对象
    ├── CreateOrderCommand.ts
    └── OrderResponse.ts
```

### 领域实体

```typescript
// domain/entities/Order.ts
// 领域实体：完全不依赖任何外部框架

import { OrderId } from '../value-objects/OrderId';
import { Money } from '../value-objects/Money';
import { Address } from '../value-objects/Address';
import { OrderItem } from './OrderItem';
import { DomainEvent } from '../events/DomainEvent';
import { OrderCreatedEvent } from '../events/OrderCreatedEvent';
import { OrderCancelledEvent } from '../events/OrderCancelledEvent';
import { InvalidOrderStateError } from '../errors/InvalidOrderStateError';

export enum OrderStatus {
  Draft = 'DRAFT',
  Placed = 'PLACED',
  Paid = 'PAID',
  Shipped = 'SHIPPED',
  Delivered = 'DELIVERED',
  Cancelled = 'CANCELLED'
}

export class Order {
  private readonly _id: OrderId;
  private readonly _customerId: string;
  private _items: OrderItem[];
  private _status: OrderStatus;
  private _shippingAddress: Address | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _events: DomainEvent[] = [];

  private constructor(props: {
    id: OrderId;
    customerId: string;
    items: OrderItem[];
    status: OrderStatus;
    shippingAddress: Address | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = props.id;
    this._customerId = props.customerId;
    this._items = props.items;
    this._status = props.status;
    this._shippingAddress = props.shippingAddress;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // 工厂方法：创建新订单
  static create(id: OrderId, customerId: string): Order {
    const now = new Date();
    const order = new Order({
      id,
      customerId,
      items: [],
      status: OrderStatus.Draft,
      shippingAddress: null,
      createdAt: now,
      updatedAt: now
    });

    order.addEvent(new OrderCreatedEvent(id.value, customerId, now));
    return order;
  }

  // 工厂方法：从持久化数据恢复
  static reconstitute(props: OrderSnapshot): Order {
    return new Order({
      id: new OrderId(props.id),
      customerId: props.customerId,
      items: props.items.map(item => OrderItem.reconstitute(item)),
      status: props.status as OrderStatus,
      shippingAddress: props.shippingAddress
        ? Address.create(props.shippingAddress)
        : null,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt || props.createdAt)
    });
  }

  // 属性访问器
  get id(): OrderId { return this._id; }
  get customerId(): string { return this._customerId; }
  get status(): OrderStatus { return this._status; }
  get shippingAddress(): Address | null { return this._shippingAddress; }
  get items(): ReadonlyArray<OrderItem> { return [...this._items]; }
  get createdAt(): Date { return this._createdAt; }

  // 计算属性
  get totalAmount(): Money {
    if (this._items.length === 0) {
      return Money.zero('CNY');
    }
    return this._items.reduce(
      (total, item) => total.add(item.subtotal),
      Money.zero('CNY')
    );
  }

  get itemCount(): number {
    return this._items.reduce((count, item) => count + item.quantity, 0);
  }

  get isEmpty(): boolean {
    return this._items.length === 0;
  }

  // 业务行为
  addItem(productId: string, productName: string, quantity: number, unitPrice: Money): void {
    this.ensureModifiable();

    if (quantity <= 0) {
      throw new InvalidOrderStateError('商品数量必须大于零');
    }

    const existingItem = this._items.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.addQuantity(quantity);
    } else {
      this._items.push(OrderItem.create(productId, productName, quantity, unitPrice));
    }

    this._updatedAt = new Date();
  }

  removeItem(productId: string): void {
    this.ensureModifiable();

    const index = this._items.findIndex(item => item.productId === productId);
    if (index === -1) {
      throw new InvalidOrderStateError(`商品 ${productId} 不在订单中`);
    }

    this._items.splice(index, 1);
    this._updatedAt = new Date();
  }

  updateItemQuantity(productId: string, newQuantity: number): void {
    this.ensureModifiable();

    if (newQuantity <= 0) {
      this.removeItem(productId);
      return;
    }

    const item = this._items.find(item => item.productId === productId);
    if (!item) {
      throw new InvalidOrderStateError(`商品 ${productId} 不在订单中`);
    }

    item.updateQuantity(newQuantity);
    this._updatedAt = new Date();
  }

  setShippingAddress(address: Address): void {
    this.ensureModifiable();
    this._shippingAddress = address;
    this._updatedAt = new Date();
  }

  // 订单状态转换
  place(): void {
    this.ensureModifiable();

    if (this.isEmpty) {
      throw new InvalidOrderStateError('订单不能为空');
    }

    if (!this._shippingAddress) {
      throw new InvalidOrderStateError('必须设置收货地址');
    }

    this._status = OrderStatus.Placed;
    this._updatedAt = new Date();

    this.addEvent(new OrderPlacedEvent(
      this._id.value,
      this._customerId,
      this.totalAmount.value,
      this._updatedAt
    ));
  }

  confirmPayment(transactionId: string): void {
    if (this._status !== OrderStatus.Placed) {
      throw new InvalidOrderStateError('只有已下单的订单可以确认支付');
    }

    this._status = OrderStatus.Paid;
    this._updatedAt = new Date();

    this.addEvent(new OrderPaidEvent(
      this._id.value,
      transactionId,
      this.totalAmount.value,
      this._updatedAt
    ));
  }

  ship(trackingNumber: string, carrier: string): void {
    if (this._status !== OrderStatus.Paid) {
      throw new InvalidOrderStateError('只有已支付的订单可以发货');
    }

    this._status = OrderStatus.Shipped;
    this._updatedAt = new Date();

    this.addEvent(new OrderShippedEvent(
      this._id.value,
      trackingNumber,
      carrier,
      this._updatedAt
    ));
  }

  deliver(): void {
    if (this._status !== OrderStatus.Shipped) {
      throw new InvalidOrderStateError('只有已发货的订单可以确认送达');
    }

    this._status = OrderStatus.Delivered;
    this._updatedAt = new Date();
  }

  cancel(reason: string): void {
    if (this._status === OrderStatus.Shipped || this._status === OrderStatus.Delivered) {
      throw new InvalidOrderStateError('已发货或已送达的订单无法取消');
    }

    if (this._status === OrderStatus.Cancelled) {
      throw new InvalidOrderStateError('订单已经取消');
    }

    this._status = OrderStatus.Cancelled;
    this._updatedAt = new Date();

    this.addEvent(new OrderCancelledEvent(
      this._id.value,
      reason,
      this._updatedAt
    ));
  }

  // 状态检查
  canBeCancelled(): boolean {
    return this._status !== OrderStatus.Shipped &&
           this._status !== OrderStatus.Delivered &&
           this._status !== OrderStatus.Cancelled;
  }

  isPaid(): boolean {
    return this._status === OrderStatus.Paid ||
           this._status === OrderStatus.Shipped ||
           this._status === OrderStatus.Delivered;
  }

  // 领域事件
  get domainEvents(): DomainEvent[] {
    return [...this._events];
  }

  clearEvents(): void {
    this._events = [];
  }

  private addEvent(event: DomainEvent): void {
    this._events.push(event);
  }

  private ensureModifiable(): void {
    if (this._status !== OrderStatus.Draft) {
      throw new InvalidOrderStateError('只有草稿状态的订单可以修改');
    }
  }

  // 快照
  toSnapshot(): OrderSnapshot {
    return {
      id: this._id.value,
      customerId: this._customerId,
      status: this._status,
      items: this._items.map(item => item.toSnapshot()),
      shippingAddress: this._shippingAddress?.toSnapshot() ?? null,
      totalAmount: this.totalAmount.value,
      currency: this.totalAmount.currency,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }
}
```

### 值对象

```typescript
// domain/value-objects/Money.ts
// 值对象：不可变，通过值比较

export class Money {
  private constructor(
    private readonly _value: number,
    private readonly _currency: string
  ) {}

  static create(value: number, currency: string): Money {
    if (value < 0) {
      throw new Error('金额不能为负数');
    }
    if (!['CNY', 'USD', 'EUR', 'JPY'].includes(currency)) {
      throw new Error(`不支持的货币类型: ${currency}`);
    }
    return new Money(value, currency);
  }

  static zero(currency: string): Money {
    return new Money(0, currency);
  }

  get value(): number {
    return this._value;
  }

  get currency(): string {
    return this._currency;
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(
      Math.round((this._value + other._value) * 100) / 100,
      this._currency
    );
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this._value - other._value;
    if (result < 0) {
      throw new Error('余额不足');
    }
    return new Money(Math.round(result * 100) / 100, this._currency);
  }

  multiply(factor: number): Money {
    return new Money(
      Math.round(this._value * factor * 100) / 100,
      this._currency
    );
  }

  equals(other: Money): boolean {
    return this._value === other._value && this._currency === other._currency;
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._value > other._value;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._value < other._value;
  }

  format(): string {
    const formatter = new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: this._currency
    });
    return formatter.format(this._value);
  }

  private ensureSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(`货币类型不匹配: ${this._currency} vs ${other._currency}`);
    }
  }
}
```

```typescript
// domain/value-objects/Address.ts

export interface AddressProps {
  province: string;
  city: string;
  district: string;
  street: string;
  postalCode: string;
}

export class Address {
  private constructor(
    public readonly province: string,
    public readonly city: string,
    public readonly district: string,
    public readonly street: string,
    public readonly postalCode: string
  ) {}

  static create(props: AddressProps): Address {
    if (!props.province || !props.city) {
      throw new Error('省市不能为空');
    }
    if (!props.postalCode || !/^\d{6}$/.test(props.postalCode)) {
      throw new Error('邮政编码格式无效');
    }
    return new Address(
      props.province,
      props.city,
      props.district,
      props.street,
      props.postalCode
    );
  }

  get fullAddress(): string {
    return `${this.province}${this.city}${this.district}${this.street}`;
  }

  equals(other: Address): boolean {
    return this.province === other.province &&
           this.city === other.city &&
           this.district === other.district &&
           this.street === other.street &&
           this.postalCode === other.postalCode;
  }

  toSnapshot(): AddressProps {
    return {
      province: this.province,
      city: this.city,
      district: this.district,
      street: this.street,
      postalCode: this.postalCode
    };
  }
}
```

### 应用服务（用例实现）

```typescript
// application/services/OrderApplicationService.ts
// 应用服务：实现主端口，协调领域对象和次端口

export class OrderApplicationService implements OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productCatalog: ProductCatalog,
    private readonly inventoryService: InventoryServicePort,
    private readonly paymentGateway: PaymentGateway,
    private readonly notificationService: NotificationService,
    private readonly eventPublisher: EventPublisher
  ) {}

  async createOrder(command: CreateOrderCommand): Promise<CreateOrderResult> {
    // 1. 创建订单聚合根
    const orderId = this.orderRepository.nextId();
    const order = Order.create(orderId, command.customerId);

    // 2. 添加订单项
    for (const item of command.items) {
      // 从商品目录获取商品信息
      const product = await this.productCatalog.findById(item.productId);
      if (!product) {
        throw new ProductNotFoundError(item.productId);
      }

      // 检查库存
      const available = await this.inventoryService.checkAvailability(
        item.productId,
        item.quantity
      );
      if (!available) {
        throw new InsufficientStockError(item.productId, item.quantity);
      }

      order.addItem(
        product.id,
        product.name,
        item.quantity,
        Money.create(product.price, 'CNY')
      );
    }

    // 3. 设置收货地址
    order.setShippingAddress(Address.create(command.shippingAddress));

    // 4. 保存订单
    await this.orderRepository.save(order);

    // 5. 发布领域事件
    await this.publishEvents(order);

    // 6. 返回结果
    return {
      orderId: order.id.value,
      totalAmount: order.totalAmount.value,
      estimatedDelivery: this.calculateEstimatedDelivery(command.shippingAddress)
    };
  }

  async placeOrder(orderId: string): Promise<PlaceOrderResult> {
    // 1. 获取订单
    const order = await this.getOrderOrThrow(orderId);

    // 2. 预留库存
    const reservations = order.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));
    await this.inventoryService.reserveStock(orderId, reservations);

    try {
      // 3. 下单
      order.place();

      // 4. 保存订单
      await this.orderRepository.save(order);

      // 5. 发布事件
      await this.publishEvents(order);

      return {
        orderId: order.id.value,
        status: order.status,
        totalAmount: order.totalAmount.value
      };
    } catch (error) {
      // 如果下单失败，释放库存
      await this.inventoryService.releaseStock(orderId);
      throw error;
    }
  }

  async processPayment(orderId: string, paymentMethod: PaymentMethod): Promise<PaymentResult> {
    const order = await this.getOrderOrThrow(orderId);

    // 处理支付
    const paymentResult = await this.paymentGateway.processPayment({
      orderId: order.id.value,
      amount: order.totalAmount,
      customerId: order.customerId,
      paymentMethod
    });

    if (paymentResult.status === 'success') {
      // 确认支付
      order.confirmPayment(paymentResult.transactionId);
      await this.orderRepository.save(order);
      await this.publishEvents(order);

      // 发送确认邮件
      await this.notificationService.sendOrderConfirmation(
        orderId,
        await this.getCustomerEmail(order.customerId)
      );
    } else {
      // 支付失败，释放库存
      await this.inventoryService.releaseStock(orderId);

      await this.notificationService.sendPaymentFailedAlert(
        orderId,
        'Payment processing failed'
      );
    }

    return paymentResult;
  }

  async cancelOrder(orderId: string, reason: string): Promise<void> {
    const order = await this.getOrderOrThrow(orderId);

    // 如果已支付，需要退款
    if (order.isPaid()) {
      const transaction = await this.getOrderTransaction(orderId);
      if (transaction) {
        await this.paymentGateway.refund(transaction.id, order.totalAmount);
      }
    }

    // 释放库存
    await this.inventoryService.releaseStock(orderId);

    // 取消订单
    order.cancel(reason);

    await this.orderRepository.save(order);
    await this.publishEvents(order);
  }

  async getOrderDetails(orderId: string): Promise<OrderDetails | null> {
    const order = await this.orderRepository.findById(new OrderId(orderId));
    if (!order) {
      return null;
    }

    return {
      id: order.id.value,
      customerId: order.customerId,
      status: order.status,
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.value,
        subtotal: item.subtotal.value
      })),
      shippingAddress: order.shippingAddress?.toSnapshot() ?? null,
      totalAmount: order.totalAmount.value,
      createdAt: order.createdAt
    };
  }

  async listCustomerOrders(customerId: string): Promise<OrderSummary[]> {
    const orders = await this.orderRepository.findByCustomerId(customerId);

    return orders.map(order => ({
      id: order.id.value,
      status: order.status,
      totalAmount: order.totalAmount.value,
      itemCount: order.itemCount,
      createdAt: order.createdAt
    }));
  }

  private async getOrderOrThrow(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(new OrderId(orderId));
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }
    return order;
  }

  private async publishEvents(order: Order): Promise<void> {
    for (const event of order.domainEvents) {
      await this.eventPublisher.publish(event);
    }
    order.clearEvents();
  }

  private calculateEstimatedDelivery(address: AddressProps): Date {
    // 简化计算，实际需要根据地址计算
    const days = address.province === '上海' ? 1 : 3;
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + days);
    return delivery;
  }

  private async getCustomerEmail(customerId: string): Promise<string> {
    // 实际实现需要查询客户信息
    return 'customer@example.com';
  }

  private async getOrderTransaction(orderId: string): Promise<{ id: string } | null> {
    // 实际实现需要查询交易记录
    return null;
  }
}
```

---

## 与 Clean Architecture 对比

六边形架构和整洁架构（Clean Architecture）都旨在实现业务逻辑与技术细节的分离，但它们有不同的侧重点和表达方式。

### 架构对比图

```
        六边形架构                              整洁架构

   ┌─────────────────────┐            ┌──────────────────────────┐
   │                     │            │   Frameworks & Drivers    │
   │  ┌───────────────┐  │            │  ┌────────────────────┐  │
   │  │   Adapters    │  │            │  │ Interface Adapters │  │
   │  │  ┌─────────┐  │  │            │  │  ┌──────────────┐  │  │
   │  │  │  Core   │  │  │            │  │  │  Use Cases   │  │  │
   │  │  │ Domain  │  │  │            │  │  │  ┌────────┐  │  │  │
   │  │  │         │  │  │            │  │  │  │Entities│  │  │  │
   │  │  └─────────┘  │  │            │  │  │  └────────┘  │  │  │
   │  └───────────────┘  │            │  │  └──────────────┘  │  │
   │                     │            │  └────────────────────┘  │
   └─────────────────────┘            └──────────────────────────┘

   两层结构：                           四层结构：
   - 应用核心 (Ports)                   - Entities（实体）
   - 适配器 (Adapters)                  - Use Cases（用例）
                                        - Interface Adapters（接口适配器）
                                        - Frameworks & Drivers（框架与驱动）
```

### 核心概念对比

| 概念 | 六边形架构 | 整洁架构 |
|------|-----------|---------|
| 核心理念 | 端口与适配器 | 依赖规则 |
| 层次划分 | 二层（核心 + 适配器） | 四层明确定义 |
| 业务逻辑 | 统一在核心域 | 分为实体和用例 |
| 外部交互 | 端口定义接口 | 接口适配器 |
| 技术细节 | 适配器实现 | 框架与驱动层 |
| 可视化 | 六边形 | 同心圆 |
| 强调点 | 对称性（进出相同） | 依赖方向（由外向内） |

### 代码结构对比

```typescript
// 六边形架构的结构
src/
├── domain/                    # 应用核心
│   ├── entities/
│   ├── value-objects/
│   └── services/
├── application/
│   └── ports/                 # 端口定义
│       ├── in/               # 主端口
│       └── out/              # 次端口
└── adapters/                  # 适配器
    ├── in/                   # 主适配器
    │   ├── web/
    │   ├── cli/
    │   └── message/
    └── out/                  # 次适配器
        ├── persistence/
        ├── payment/
        └── notification/

// 整洁架构的结构
src/
├── domain/                    # 实体层
│   ├── entities/
│   └── value-objects/
├── application/               # 用例层
│   ├── use-cases/
│   └── ports/
├── adapters/                  # 接口适配器层
│   ├── controllers/
│   ├── presenters/
│   └── gateways/
└── infrastructure/            # 框架与驱动层
    ├── web/
    ├── database/
    └── external/
```

### 设计哲学对比

**六边形架构强调：**

1. **对称性**：所有外部系统（用户、数据库、API）都通过相同的方式与核心交互
2. **可替换性**：任何适配器都可以在不影响核心的情况下替换
3. **端口是契约**：端口定义了应用程序的能力边界

```typescript
// 六边形架构：强调端口的对称性
// 无论是 HTTP、CLI 还是消息队列，都通过相同的端口与核心交互

interface OrderService {  // 主端口
  createOrder(command: CreateOrderCommand): Promise<CreateOrderResult>;
}

// HTTP 适配器
class HttpOrderAdapter implements OrderService { ... }

// CLI 适配器
class CliOrderAdapter implements OrderService { ... }

// 消息队列适配器
class MessageQueueOrderAdapter implements OrderService { ... }
```

**整洁架构强调：**

1. **依赖规则**：源代码依赖只能指向内层
2. **层次职责**：每层有明确的职责定义
3. **用例分离**：明确区分实体和用例

```typescript
// 整洁架构：强调用例与实体的分离

// 实体层 - 企业级业务规则
class Order {
  calculateTotal(): Money { ... }
  confirm(): void { ... }
}

// 用例层 - 应用级业务规则
class CreateOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private inventoryService: InventoryService
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    // 编排实体完成业务目标
  }
}
```

### 如何选择？

| 场景 | 推荐架构 | 原因 |
|------|---------|------|
| 多渠道接入 | 六边形架构 | 强调端口对称性 |
| 复杂业务规则 | 整洁架构 | 明确分离实体与用例 |
| 微服务 | 六边形架构 | 适配器模式便于集成 |
| DDD 项目 | 均可 | 两者都与 DDD 兼容 |
| 简单项目 | 六边形架构 | 两层结构更简单 |
| 大型团队 | 整洁架构 | 四层结构边界更清晰 |

### 混合使用

实际项目中，两种架构可以混合使用。核心原则是相同的：**隔离业务逻辑，控制依赖方向**。

```typescript
// 混合架构示例

// 使用整洁架构的四层概念
// 使用六边形架构的端口适配器模式

// domain/entities - 整洁架构的实体层
class Order { ... }

// application/use-cases - 整洁架构的用例层
// application/ports - 六边形架构的端口
class CreateOrderUseCase implements CreateOrderPort { ... }

// adapters - 六边形架构的适配器
class HttpOrderAdapter { ... }
class PostgresOrderRepository implements OrderRepository { ... }

// infrastructure - 整洁架构的框架层
class ExpressApp { ... }
class TypeOrmConfig { ... }
```

---

## 测试策略

六边形架构的一大优势是出色的可测试性。通过替换适配器，我们可以在不同层次进行隔离测试。

### 领域层单元测试

```typescript
// domain/entities/__tests__/Order.test.ts

describe('Order', () => {
  describe('create', () => {
    it('should create a new order in draft status', () => {
      const orderId = new OrderId('order-123');
      const order = Order.create(orderId, 'customer-456');

      expect(order.id.value).toBe('order-123');
      expect(order.customerId).toBe('customer-456');
      expect(order.status).toBe(OrderStatus.Draft);
      expect(order.isEmpty).toBe(true);
    });

    it('should emit OrderCreatedEvent', () => {
      const orderId = new OrderId('order-123');
      const order = Order.create(orderId, 'customer-456');

      const events = order.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OrderCreatedEvent);
    });
  });

  describe('addItem', () => {
    it('should add item to draft order', () => {
      const order = createTestOrder();
      const unitPrice = Money.create(100, 'CNY');

      order.addItem('product-1', 'Test Product', 2, unitPrice);

      expect(order.items).toHaveLength(1);
      expect(order.items[0].productId).toBe('product-1');
      expect(order.items[0].quantity).toBe(2);
    });

    it('should increase quantity for existing item', () => {
      const order = createTestOrder();
      const unitPrice = Money.create(100, 'CNY');

      order.addItem('product-1', 'Test Product', 2, unitPrice);
      order.addItem('product-1', 'Test Product', 3, unitPrice);

      expect(order.items).toHaveLength(1);
      expect(order.items[0].quantity).toBe(5);
    });

    it('should throw error for non-draft order', () => {
      const order = createPlacedOrder();
      const unitPrice = Money.create(100, 'CNY');

      expect(() => {
        order.addItem('product-1', 'Test Product', 1, unitPrice);
      }).toThrow(InvalidOrderStateError);
    });
  });

  describe('place', () => {
    it('should place order with items and address', () => {
      const order = createTestOrder();
      order.addItem('product-1', 'Test Product', 1, Money.create(100, 'CNY'));
      order.setShippingAddress(createTestAddress());

      order.place();

      expect(order.status).toBe(OrderStatus.Placed);
    });

    it('should throw error for empty order', () => {
      const order = createTestOrder();
      order.setShippingAddress(createTestAddress());

      expect(() => order.place()).toThrow(InvalidOrderStateError);
    });

    it('should throw error without shipping address', () => {
      const order = createTestOrder();
      order.addItem('product-1', 'Test Product', 1, Money.create(100, 'CNY'));

      expect(() => order.place()).toThrow(InvalidOrderStateError);
    });
  });

  describe('cancel', () => {
    it('should cancel draft order', () => {
      const order = createTestOrder();

      order.cancel('Customer request');

      expect(order.status).toBe(OrderStatus.Cancelled);
    });

    it('should cancel placed order', () => {
      const order = createPlacedOrder();

      order.cancel('Customer request');

      expect(order.status).toBe(OrderStatus.Cancelled);
    });

    it('should not cancel shipped order', () => {
      const order = createShippedOrder();

      expect(() => {
        order.cancel('Customer request');
      }).toThrow(InvalidOrderStateError);
    });
  });

  describe('totalAmount', () => {
    it('should calculate total correctly', () => {
      const order = createTestOrder();
      order.addItem('product-1', 'Product 1', 2, Money.create(100, 'CNY'));
      order.addItem('product-2', 'Product 2', 3, Money.create(50, 'CNY'));

      expect(order.totalAmount.value).toBe(350); // 2*100 + 3*50
    });
  });
});

// 测试辅助函数
function createTestOrder(): Order {
  return Order.create(new OrderId('test-order'), 'test-customer');
}

function createTestAddress(): Address {
  return Address.create({
    province: '上海',
    city: '上海市',
    district: '浦东新区',
    street: '张江高科技园区',
    postalCode: '201203'
  });
}

function createPlacedOrder(): Order {
  const order = createTestOrder();
  order.addItem('product-1', 'Product', 1, Money.create(100, 'CNY'));
  order.setShippingAddress(createTestAddress());
  order.place();
  return order;
}

function createShippedOrder(): Order {
  const order = createPlacedOrder();
  order.confirmPayment('txn-123');
  order.ship('TRACK-123', 'SF Express');
  return order;
}
```

### 应用服务测试（使用模拟适配器）

```typescript
// application/services/__tests__/OrderApplicationService.test.ts

describe('OrderApplicationService', () => {
  let orderService: OrderApplicationService;
  let orderRepository: InMemoryOrderRepository;
  let productCatalog: MockProductCatalog;
  let inventoryService: MockInventoryService;
  let paymentGateway: MockPaymentGateway;
  let notificationService: MockNotificationService;
  let eventPublisher: MockEventPublisher;

  beforeEach(() => {
    orderRepository = new InMemoryOrderRepository();
    productCatalog = new MockProductCatalog();
    inventoryService = new MockInventoryService();
    paymentGateway = new MockPaymentGateway();
    notificationService = new MockNotificationService();
    eventPublisher = new MockEventPublisher();

    orderService = new OrderApplicationService(
      orderRepository,
      productCatalog,
      inventoryService,
      paymentGateway,
      notificationService,
      eventPublisher
    );
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      // Arrange
      productCatalog.addProduct({
        id: 'product-1',
        name: 'Test Product',
        price: 100
      });
      inventoryService.setAvailability('product-1', true);

      // Act
      const result = await orderService.createOrder({
        customerId: 'customer-1',
        items: [{ productId: 'product-1', quantity: 2 }],
        shippingAddress: {
          province: '上海',
          city: '上海市',
          district: '浦东新区',
          street: '测试街道',
          postalCode: '200000'
        }
      });

      // Assert
      expect(result.orderId).toBeDefined();
      expect(result.totalAmount).toBe(200);

      const savedOrder = await orderRepository.findById(new OrderId(result.orderId));
      expect(savedOrder).not.toBeNull();
      expect(savedOrder!.items).toHaveLength(1);
    });

    it('should throw error if product not found', async () => {
      await expect(
        orderService.createOrder({
          customerId: 'customer-1',
          items: [{ productId: 'non-existent', quantity: 1 }],
          shippingAddress: createTestAddressProps()
        })
      ).rejects.toThrow(ProductNotFoundError);
    });

    it('should throw error if insufficient stock', async () => {
      productCatalog.addProduct({
        id: 'product-1',
        name: 'Test Product',
        price: 100
      });
      inventoryService.setAvailability('product-1', false);

      await expect(
        orderService.createOrder({
          customerId: 'customer-1',
          items: [{ productId: 'product-1', quantity: 100 }],
          shippingAddress: createTestAddressProps()
        })
      ).rejects.toThrow(InsufficientStockError);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order and release stock', async () => {
      // Arrange
      const order = await createTestOrderInRepository();
      await orderService.placeOrder(order.id.value);

      // Act
      await orderService.cancelOrder(order.id.value, 'Customer request');

      // Assert
      const cancelledOrder = await orderRepository.findById(order.id);
      expect(cancelledOrder!.status).toBe(OrderStatus.Cancelled);
      expect(inventoryService.wasStockReleased(order.id.value)).toBe(true);
    });

    it('should refund if order was paid', async () => {
      // Arrange
      const order = await createPaidOrderInRepository();

      // Act
      await orderService.cancelOrder(order.id.value, 'Customer request');

      // Assert
      expect(paymentGateway.wasRefunded(order.id.value)).toBe(true);
    });

    it('should throw error for non-existent order', async () => {
      await expect(
        orderService.cancelOrder('non-existent', 'reason')
      ).rejects.toThrow(OrderNotFoundError);
    });
  });

  describe('processPayment', () => {
    it('should process payment and confirm order', async () => {
      // Arrange
      const order = await createTestOrderInRepository();
      await orderService.placeOrder(order.id.value);
      paymentGateway.setNextPaymentResult('success');

      // Act
      const result = await orderService.processPayment(
        order.id.value,
        'CREDIT_CARD'
      );

      // Assert
      expect(result.status).toBe('success');

      const paidOrder = await orderRepository.findById(order.id);
      expect(paidOrder!.status).toBe(OrderStatus.Paid);
      expect(notificationService.wasSent('order-confirmation')).toBe(true);
    });

    it('should release stock if payment fails', async () => {
      // Arrange
      const order = await createTestOrderInRepository();
      await orderService.placeOrder(order.id.value);
      paymentGateway.setNextPaymentResult('failed');

      // Act
      const result = await orderService.processPayment(
        order.id.value,
        'CREDIT_CARD'
      );

      // Assert
      expect(result.status).toBe('failed');
      expect(inventoryService.wasStockReleased(order.id.value)).toBe(true);
      expect(notificationService.wasSent('payment-failed')).toBe(true);
    });
  });
});

// 模拟适配器
class MockProductCatalog implements ProductCatalog {
  private products: Map<string, Product> = new Map();

  addProduct(product: { id: string; name: string; price: number }): void {
    this.products.set(product.id, product as Product);
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }
}

class MockInventoryService implements InventoryServicePort {
  private availability: Map<string, boolean> = new Map();
  private releasedOrders: Set<string> = new Set();

  setAvailability(productId: string, available: boolean): void {
    this.availability.set(productId, available);
  }

  async checkAvailability(productId: string, quantity: number): Promise<boolean> {
    return this.availability.get(productId) ?? false;
  }

  async reserveStock(orderId: string, items: StockReservation[]): Promise<void> {
    // 模拟预留库存
  }

  async releaseStock(orderId: string): Promise<void> {
    this.releasedOrders.add(orderId);
  }

  wasStockReleased(orderId: string): boolean {
    return this.releasedOrders.has(orderId);
  }
}

class MockPaymentGateway implements PaymentGateway {
  private nextResult: 'success' | 'failed' = 'success';
  private refundedOrders: Set<string> = new Set();

  setNextPaymentResult(result: 'success' | 'failed'): void {
    this.nextResult = result;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    return {
      transactionId: `txn-${request.orderId}`,
      status: this.nextResult,
      processedAt: new Date()
    };
  }

  async refund(transactionId: string, amount: Money): Promise<RefundResult> {
    const orderId = transactionId.replace('txn-', '');
    this.refundedOrders.add(orderId);
    return {
      refundId: `ref-${transactionId}`,
      status: 'completed',
      processedAt: new Date()
    };
  }

  wasRefunded(orderId: string): boolean {
    return this.refundedOrders.has(orderId);
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
    return {
      transactionId,
      status: 'success',
      amount: Money.create(100, 'CNY')
    };
  }
}
```

### 适配器集成测试

```typescript
// adapters/out/persistence/__tests__/PostgresOrderRepository.integration.test.ts

describe('PostgresOrderRepository Integration', () => {
  let repository: PostgresOrderRepository;
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL
    });

    // 创建测试表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        status VARCHAR(20) NOT NULL,
        shipping_address JSONB,
        total_amount DECIMAL(10,2),
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL REFERENCES orders(id),
        product_id VARCHAR(36) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL
      )
    `);

    repository = new PostgresOrderRepository(pool);
  });

  afterAll(async () => {
    await pool.query('DROP TABLE IF EXISTS order_items');
    await pool.query('DROP TABLE IF EXISTS orders');
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM orders');
  });

  describe('save and findById', () => {
    it('should save and retrieve order', async () => {
      // Arrange
      const order = Order.create(repository.nextId(), 'customer-1');
      order.addItem('product-1', 'Test Product', 2, Money.create(100, 'CNY'));
      order.setShippingAddress(Address.create({
        province: '上海',
        city: '上海市',
        district: '浦东新区',
        street: '测试街道',
        postalCode: '200000'
      }));

      // Act
      await repository.save(order);
      const retrieved = await repository.findById(order.id);

      // Assert
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id.value).toBe(order.id.value);
      expect(retrieved!.customerId).toBe('customer-1');
      expect(retrieved!.items).toHaveLength(1);
      expect(retrieved!.items[0].productId).toBe('product-1');
      expect(retrieved!.totalAmount.value).toBe(200);
    });

    it('should update existing order', async () => {
      // Arrange
      const order = Order.create(repository.nextId(), 'customer-1');
      order.addItem('product-1', 'Test Product', 1, Money.create(100, 'CNY'));
      order.setShippingAddress(createTestAddress());
      await repository.save(order);

      // Act
      order.addItem('product-2', 'Another Product', 2, Money.create(50, 'CNY'));
      await repository.save(order);

      // Assert
      const retrieved = await repository.findById(order.id);
      expect(retrieved!.items).toHaveLength(2);
      expect(retrieved!.totalAmount.value).toBe(200);
    });
  });

  describe('findByCustomerId', () => {
    it('should find all orders for customer', async () => {
      // Arrange
      const order1 = Order.create(repository.nextId(), 'customer-1');
      order1.addItem('product-1', 'Product', 1, Money.create(100, 'CNY'));

      const order2 = Order.create(repository.nextId(), 'customer-1');
      order2.addItem('product-2', 'Product', 1, Money.create(200, 'CNY'));

      const order3 = Order.create(repository.nextId(), 'customer-2');
      order3.addItem('product-3', 'Product', 1, Money.create(300, 'CNY'));

      await repository.save(order1);
      await repository.save(order2);
      await repository.save(order3);

      // Act
      const orders = await repository.findByCustomerId('customer-1');

      // Assert
      expect(orders).toHaveLength(2);
      expect(orders.map(o => o.id.value)).toContain(order1.id.value);
      expect(orders.map(o => o.id.value)).toContain(order2.id.value);
    });
  });

  describe('delete', () => {
    it('should delete order and its items', async () => {
      // Arrange
      const order = Order.create(repository.nextId(), 'customer-1');
      order.addItem('product-1', 'Product', 1, Money.create(100, 'CNY'));
      await repository.save(order);

      // Act
      await repository.delete(order.id);

      // Assert
      const retrieved = await repository.findById(order.id);
      expect(retrieved).toBeNull();
    });
  });
});
```

### 端到端测试

```typescript
// e2e/order-flow.e2e.test.ts

describe('Order Flow E2E', () => {
  let app: Express;
  let server: Server;

  beforeAll(async () => {
    // 启动测试服务器
    app = await createTestApplication();
    server = app.listen(0);
  });

  afterAll(async () => {
    server.close();
  });

  it('should complete full order flow', async () => {
    const baseUrl = `http://localhost:${(server.address() as any).port}`;

    // 1. 创建订单
    const createResponse = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'customer-1',
        items: [{ productId: 'product-1', quantity: 2 }],
        shippingAddress: {
          province: '上海',
          city: '上海市',
          district: '浦东新区',
          street: '测试街道',
          postalCode: '200000'
        }
      })
    });

    expect(createResponse.status).toBe(201);
    const createResult = await createResponse.json();
    const orderId = createResult.data.orderId;

    // 2. 查询订单
    const getResponse = await fetch(`${baseUrl}/api/orders/${orderId}`);
    expect(getResponse.status).toBe(200);
    const orderDetails = await getResponse.json();
    expect(orderDetails.data.status).toBe('DRAFT');

    // 3. 下单
    const placeResponse = await fetch(`${baseUrl}/api/orders/${orderId}/place`, {
      method: 'POST'
    });
    expect(placeResponse.status).toBe(200);

    // 4. 支付
    const payResponse = await fetch(`${baseUrl}/api/orders/${orderId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod: 'CREDIT_CARD' })
    });
    expect(payResponse.status).toBe(200);
    const payResult = await payResponse.json();
    expect(payResult.data.status).toBe('success');

    // 5. 验证最终状态
    const finalResponse = await fetch(`${baseUrl}/api/orders/${orderId}`);
    const finalOrder = await finalResponse.json();
    expect(finalOrder.data.status).toBe('PAID');
  });

  it('should handle cancellation', async () => {
    const baseUrl = `http://localhost:${(server.address() as any).port}`;

    // 创建并下单
    const orderId = await createAndPlaceOrder(baseUrl);

    // 取消订单
    const cancelResponse = await fetch(`${baseUrl}/api/orders/${orderId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Changed my mind' })
    });

    expect(cancelResponse.status).toBe(200);

    // 验证状态
    const getResponse = await fetch(`${baseUrl}/api/orders/${orderId}`);
    const order = await getResponse.json();
    expect(order.data.status).toBe('CANCELLED');
  });
});
```

---

## 完整项目结构

```
src/
├── domain/                              # 领域层（应用核心）
│   ├── entities/
│   │   ├── Order.ts
│   │   ├── OrderItem.ts
│   │   └── Customer.ts
│   ├── value-objects/
│   │   ├── OrderId.ts
│   │   ├── Money.ts
│   │   ├── Address.ts
│   │   └── Email.ts
│   ├── events/
│   │   ├── DomainEvent.ts
│   │   ├── OrderCreatedEvent.ts
│   │   ├── OrderPlacedEvent.ts
│   │   ├── OrderPaidEvent.ts
│   │   ├── OrderShippedEvent.ts
│   │   └── OrderCancelledEvent.ts
│   ├── services/
│   │   └── PricingService.ts
│   └── errors/
│       ├── DomainError.ts
│       ├── OrderNotFoundError.ts
│       ├── InvalidOrderStateError.ts
│       └── InsufficientStockError.ts
│
├── application/                         # 应用层
│   ├── ports/
│   │   ├── in/                         # 主端口
│   │   │   ├── OrderService.ts
│   │   │   ├── InventoryService.ts
│   │   │   └── PaymentService.ts
│   │   └── out/                        # 次端口
│   │       ├── OrderRepository.ts
│   │       ├── ProductCatalog.ts
│   │       ├── PaymentGateway.ts
│   │       ├── NotificationService.ts
│   │       └── EventPublisher.ts
│   ├── services/                       # 用例实现
│   │   ├── OrderApplicationService.ts
│   │   └── InventoryApplicationService.ts
│   └── dto/
│       ├── commands/
│       │   ├── CreateOrderCommand.ts
│       │   └── CancelOrderCommand.ts
│       └── responses/
│           ├── OrderDetails.ts
│           └── OrderSummary.ts
│
├── adapters/                            # 适配器层
│   ├── in/                             # 主适配器
│   │   ├── web/
│   │   │   ├── OrderController.ts
│   │   │   ├── InventoryController.ts
│   │   │   └── middleware/
│   │   │       ├── errorHandler.ts
│   │   │       └── authentication.ts
│   │   ├── cli/
│   │   │   └── OrderCLI.ts
│   │   └── message/
│   │       └── OrderMessageConsumer.ts
│   └── out/                            # 次适配器
│       ├── persistence/
│       │   ├── PostgresOrderRepository.ts
│       │   ├── InMemoryOrderRepository.ts
│       │   └── entities/
│       │       └── OrderEntity.ts
│       ├── catalog/
│       │   └── RestProductCatalog.ts
│       ├── payment/
│       │   ├── StripePaymentGateway.ts
│       │   └── AlipayPaymentGateway.ts
│       ├── notification/
│       │   ├── SendGridNotificationService.ts
│       │   └── ConsoleNotificationService.ts
│       └── messaging/
│           └── RabbitMQEventPublisher.ts
│
├── infrastructure/                      # 基础设施
│   ├── config/
│   │   ├── database.ts
│   │   ├── messaging.ts
│   │   └── environment.ts
│   ├── web/
│   │   ├── express.ts
│   │   └── routes.ts
│   └── di/
│       └── container.ts
│
├── main.ts                              # 入口文件
└── __tests__/                           # 测试
    ├── unit/
    │   ├── domain/
    │   └── application/
    ├── integration/
    │   └── adapters/
    └── e2e/
        └── order-flow.test.ts
```

---

## 面试要点

### 什么是六边形架构？核心思想是什么？

**答**：六边形架构（也叫端口与适配器架构）是由 Alistair Cockburn 提出的软件架构模式。核心思想是将应用程序的业务逻辑与外部世界完全隔离，使得：

- 业务逻辑不依赖任何框架、数据库或外部服务
- 所有外部交互通过端口（接口）定义，适配器（实现）可替换
- 系统具有对称性，无论是用户界面还是数据库都以相同方式与核心交互

### 什么是端口？什么是适配器？它们有什么区别？

**答**：
- **端口**是应用核心定义的接口，分为主端口（定义应用提供的能力）和次端口（定义应用需要的能力）
- **适配器**是端口的具体实现，负责与外部系统交互
- 区别：端口是抽象，定义在应用核心；适配器是具体实现，依赖外部技术

```typescript
// 端口（接口）
interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
}

// 适配器（实现）
class PostgresOrderRepository implements OrderRepository { ... }
class InMemoryOrderRepository implements OrderRepository { ... }
```

### 主端口/主适配器与次端口/次适配器有什么区别？

**答**：
- **主端口/主适配器**：外部世界驱动应用程序
  - 主端口定义应用提供的服务（如 `OrderService`）
  - 主适配器处理外部请求（如 HTTP Controller、CLI）

- **次端口/次适配器**：应用程序驱动外部世界
  - 次端口定义应用需要的能力（如 `OrderRepository`）
  - 次适配器实现与外部系统的交互（如 PostgreSQL 实现）

### 六边形架构如何实现可测试性？

**答**：
- 领域逻辑不依赖外部系统，可以纯单元测试
- 次端口是接口，可以用模拟适配器替换真实实现
- 可以为测试提供内存实现（如 `InMemoryOrderRepository`）
- 不同层次可以独立测试：领域层、应用层、适配器层

### 六边形架构与整洁架构有什么区别？

**答**：
- **层次数量**：六边形是两层（核心 + 适配器），整洁是四层
- **强调点**：六边形强调对称性和端口适配器，整洁强调依赖方向
- **业务逻辑**：六边形统一在核心，整洁明确区分实体和用例
- **适用场景**：六边形适合多渠道接入，整洁适合复杂业务规则

### 如何处理跨端口的事务？

**答**：
- 使用领域事件实现最终一致性
- 使用 Saga 模式处理分布式事务
- 在应用服务层协调多个端口操作
- 必要时使用本地事务 + 事件发布

```typescript
class OrderApplicationService {
  async placeOrder(orderId: string): Promise<void> {
    // 预留库存
    await this.inventoryService.reserveStock(orderId, items);
    try {
      order.place();
      await this.orderRepository.save(order);
    } catch (error) {
      // 回滚库存
      await this.inventoryService.releaseStock(orderId);
      throw error;
    }
  }
}
```

### 什么场景适合使用六边形架构？

**答**：
适合场景：
- 需要多渠道接入（Web、CLI、消息队列）
- 需要支持多种数据存储
- 业务逻辑需要高可测试性
- 预期会更换技术栈
- 微服务架构

不适合场景：
- 简单 CRUD 应用
- 原型或短期项目
- 小型团队的简单项目

### 六边形架构的缺点是什么？

**答**：
- **代码量增加**：需要定义大量接口和适配器
- **间接性**：所有调用都通过端口，增加理解成本
- **过度抽象风险**：简单场景可能过度设计
- **学习曲线**：团队需要理解架构原则
- **初期开发较慢**：前期需要搭建基础架构

---

## 总结

六边形架构的核心价值在于**隔离业务逻辑**和**控制依赖方向**。通过端口与适配器的设计模式，我们可以：

1. **实现技术无关性**：业务逻辑不依赖任何框架或外部服务
2. **提高可测试性**：核心逻辑可以在完全隔离的环境下测试
3. **支持多渠道接入**：同一业务逻辑可以通过不同方式访问
4. **简化技术更换**：更换数据库或框架只需要替换适配器
5. **明确边界**：端口清晰定义了应用程序的能力边界

记住 Alistair Cockburn 的设计意图：

> "允许一个应用程序可以被用户、程序、自动化测试或批处理脚本平等地驱动，并且可以在与其最终运行时设备和数据库隔离的情况下进行开发和测试。"

六边形架构让我们的应用程序成为一个独立的、可测试的、可维护的核心，与外部世界保持适当的距离。

---

## 参考资源

### 经典文章

1. **《Hexagonal Architecture》** - Alistair Cockburn 原文
2. **《Ports and Adapters Pattern》** - Alistair Cockburn 详解
3. **《DDD, Hexagonal, Onion, Clean, CQRS》** - 架构模式对比

### 推荐书籍

1. **《实现领域驱动设计》** - Vaughn Vernon
2. **《架构整洁之道》** - Robert C. Martin
3. **《软件架构：架构模式、特征及实践指南》** - Mark Richards & Neal Ford

### 示例项目

- [buckpal](https://github.com/thombergs/buckpal) - Java 六边形架构示例
- [go-hexagonal](https://github.com/iDevoid/go-hexagonal) - Go 六边形架构示例
- [hexagonal-architecture-typescript](https://github.com/Sairyss/hexagonal-architecture-typescript) - TypeScript 示例

### 相关模式

- **整洁架构 (Clean Architecture)**：四层同心圆架构
- **洋葱架构 (Onion Architecture)**：类似的分层理念
- **CQRS**：命令查询职责分离
- **Event Sourcing**：事件溯源
