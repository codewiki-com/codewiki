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
origin: old/src/content/docs/architecture/hexagonal.en.md
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

## Concept Explanation

Hexagonal Architecture is a software architecture pattern proposed by Alistair Cockburn in 2005, also known as "Ports and Adapters Architecture". The core goal of this architecture is to completely isolate the application's core business logic from the external world (such as databases, user interfaces, message queues, etc.), making the system easier to test, maintain, and extend.

### Why Do We Need Hexagonal Architecture?

In traditional layered architecture, we often encounter the following problems:

1. **Tight Coupling**: Business logic is tightly bound to database access and UI frameworks
2. **Testing Difficulties**: Need to start databases and web servers to test business logic
3. **Technology Lock-in**: Extremely high cost to switch databases or UI frameworks
4. **Blurred Boundaries**: Business rules scattered across different layers, making core logic hard to identify
5. **Confused Dependency Direction**: High-level modules depend on concrete implementations of low-level modules

Hexagonal architecture solves these problems through clear boundary definitions and dependency inversion. Its core concept is:

> **An application should treat all external systems in the same way, whether they are human users, automated tests, databases, or external services.**

### Core Ideas of Hexagonal Architecture

Hexagonal architecture divides the system into three main areas:

```
                              External World
                                 │
                    ┌────────────┼────────────┐
                    │            ▼            │
                    │    ┌─────────────┐      │
                    │    │   Adapter   │      │
          User ─────┼───►│  (Adapter)  │      │
                    │    └──────┬──────┘      │
                    │           │             │
                    │    ┌──────▼──────┐      │
                    │    │    Port     │      │
                    │    │   (Port)    │      │
                    │    └──────┬──────┘      │
        ┌───────────┼───────────┼─────────────┼───────────┐
        │           │    ┌──────▼──────┐      │           │
        │           │    │             │      │           │
        │           │    │    Core     │      │           │
        │  Database ◄─┼────│  (Domain)   │◄─────┼──── API   │
        │           │    │             │      │           │
        │           │    └─────────────┘      │           │
        └───────────┼─────────────────────────┼───────────┘
                    │                         │
                    └─────────────────────────┘
                           Hexagon Boundary
```

---

## Core Principles: Ports and Adapters

The essence of hexagonal architecture lies in the "Ports and Adapters" design pattern. Understanding these two concepts is key to mastering hexagonal architecture.

### Ports

Ports are interface definitions for communication between the application core and the external world. Ports are divided into two types:

#### Primary Ports (Driving Ports)

Primary ports define **the functionality that the application provides**, i.e., how the external world drives the application.

```typescript
// application/ports/in/OrderService.ts
// Primary port: Defines services provided by the application

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

// Primary port interface
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

#### Secondary Ports (Driven Ports)

Secondary ports define **the external capabilities the application needs**, i.e., which external systems the application needs to drive.

```typescript
// application/ports/out/OrderRepository.ts
// Secondary port: Defines persistence capabilities the application needs

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
// Secondary port: Defines payment capabilities the application needs

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
// Secondary port: Defines notification capabilities the application needs

export interface NotificationService {
  sendOrderConfirmation(orderId: string, customerEmail: string): Promise<void>;
  sendShipmentNotification(orderId: string, trackingNumber: string): Promise<void>;
  sendPaymentFailedAlert(orderId: string, reason: string): Promise<void>;
}
```

### Adapters

Adapters are concrete implementations of ports, responsible for isolating external system technical details from the application core.

#### Primary Adapters (Driving Adapters)

Primary adapters implement primary ports, converting external requests into formats the application can understand.

```typescript
// adapters/in/web/OrderController.ts
// Primary adapter: HTTP controller

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
      // Convert HTTP request to application layer command
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

      // Call application service
      const result = await this.orderService.createOrder(command);

      // Convert result to HTTP response
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
// Primary adapter: Command line interface

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
// Primary adapter: Message queue consumer

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

      // Publish success event
      await this.messageQueue.publish('order.events', {
        type: 'ORDER_CREATED',
        payload: result
      });
    } catch (error) {
      // Publish failure event
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

#### Secondary Adapters (Driven Adapters)

Secondary adapters implement secondary ports, converting application requests into formats that external systems can understand.

```typescript
// adapters/out/persistence/PostgresOrderRepository.ts
// Secondary adapter: PostgreSQL implementation

import { Pool, PoolClient } from 'pg';

export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}

  async save(order: Order): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const snapshot = order.toSnapshot();

      // Save order main table
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

      // Delete old order items
      await client.query('DELETE FROM order_items WHERE order_id = $1', [snapshot.id]);

      // Insert new order items
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
// Secondary adapter: In-memory implementation (for testing)

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

  // Test helper methods
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
// Secondary adapter: Stripe payment implementation

import Stripe from 'stripe';

export class StripePaymentGateway implements PaymentGateway {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' });
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount.value * 100), // Stripe uses cents
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
    // Map internal payment methods to Stripe payment methods
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
// Secondary adapter: SendGrid email implementation

import sgMail from '@sendgrid/mail';

export class SendGridNotificationService implements NotificationService {
  constructor(apiKey: string, private readonly fromEmail: string) {
    sgMail.setApiKey(apiKey);
  }

  async sendOrderConfirmation(orderId: string, customerEmail: string): Promise<void> {
    await sgMail.send({
      to: customerEmail,
      from: this.fromEmail,
      subject: `Order Confirmation - ${orderId}`,
      templateId: 'd-order-confirmation-template',
      dynamicTemplateData: {
        orderId,
        orderDate: new Date().toLocaleDateString('en-US')
      }
    });
  }

  async sendShipmentNotification(orderId: string, trackingNumber: string): Promise<void> {
    // Implement shipment notification
    await sgMail.send({
      to: await this.getCustomerEmail(orderId),
      from: this.fromEmail,
      subject: `Shipment Notification - ${orderId}`,
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
      subject: `Payment Failed Notification - ${orderId}`,
      templateId: 'd-payment-failed-template',
      dynamicTemplateData: {
        orderId,
        reason
      }
    });
  }

  private async getCustomerEmail(orderId: string): Promise<string> {
    // In actual implementation, need to query order to get customer email
    return 'customer@example.com';
  }
}
```

---

## Domain Isolation: Designing the Application Core

The core advantage of hexagonal architecture is completely isolating domain logic from the external world. The application core does not depend on any specific implementation of frameworks, databases, or external services.

### Application Core Structure

```
domain/
├── entities/              # Entities
│   ├── Order.ts
│   ├── OrderItem.ts
│   └── Customer.ts
├── value-objects/         # Value Objects
│   ├── OrderId.ts
│   ├── Money.ts
│   └── Address.ts
├── events/                # Domain Events
│   ├── OrderCreated.ts
│   ├── OrderShipped.ts
│   └── OrderCancelled.ts
├── services/              # Domain Services
│   └── PricingService.ts
└── errors/                # Domain Errors
    ├── OrderNotFoundError.ts
    ├── InsufficientStockError.ts
    └── InvalidOrderStateError.ts

application/
├── ports/
│   ├── in/                # Primary Ports (Inbound)
│   │   ├── OrderService.ts
│   │   └── InventoryService.ts
│   └── out/               # Secondary Ports (Outbound)
│       ├── OrderRepository.ts
│       ├── PaymentGateway.ts
│       └── NotificationService.ts
├── services/              # Application Services (Use Case Implementation)
│   ├── OrderApplicationService.ts
│   └── InventoryApplicationService.ts
└── dto/                   # Data Transfer Objects
    ├── CreateOrderCommand.ts
    └── OrderResponse.ts
```

### Domain Entity

```typescript
// domain/entities/Order.ts
// Domain entity: Completely independent of any external framework

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

  // Factory method: Create new order
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

  // Factory method: Reconstitute from persistence data
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

  // Property accessors
  get id(): OrderId { return this._id; }
  get customerId(): string { return this._customerId; }
  get status(): OrderStatus { return this._status; }
  get shippingAddress(): Address | null { return this._shippingAddress; }
  get items(): ReadonlyArray<OrderItem> { return [...this._items]; }
  get createdAt(): Date { return this._createdAt; }

  // Computed properties
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

  // Business behaviors
  addItem(productId: string, productName: string, quantity: number, unitPrice: Money): void {
    this.ensureModifiable();

    if (quantity <= 0) {
      throw new InvalidOrderStateError('Product quantity must be greater than zero');
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
      throw new InvalidOrderStateError(`Product ${productId} is not in the order`);
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
      throw new InvalidOrderStateError(`Product ${productId} is not in the order`);
    }

    item.updateQuantity(newQuantity);
    this._updatedAt = new Date();
  }

  setShippingAddress(address: Address): void {
    this.ensureModifiable();
    this._shippingAddress = address;
    this._updatedAt = new Date();
  }

  // Order state transitions
  place(): void {
    this.ensureModifiable();

    if (this.isEmpty) {
      throw new InvalidOrderStateError('Order cannot be empty');
    }

    if (!this._shippingAddress) {
      throw new InvalidOrderStateError('Shipping address must be set');
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
      throw new InvalidOrderStateError('Only placed orders can confirm payment');
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
      throw new InvalidOrderStateError('Only paid orders can be shipped');
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
      throw new InvalidOrderStateError('Only shipped orders can be confirmed as delivered');
    }

    this._status = OrderStatus.Delivered;
    this._updatedAt = new Date();
  }

  cancel(reason: string): void {
    if (this._status === OrderStatus.Shipped || this._status === OrderStatus.Delivered) {
      throw new InvalidOrderStateError('Shipped or delivered orders cannot be cancelled');
    }

    if (this._status === OrderStatus.Cancelled) {
      throw new InvalidOrderStateError('Order is already cancelled');
    }

    this._status = OrderStatus.Cancelled;
    this._updatedAt = new Date();

    this.addEvent(new OrderCancelledEvent(
      this._id.value,
      reason,
      this._updatedAt
    ));
  }

  // State checks
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

  // Domain events
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
      throw new InvalidOrderStateError('Only draft orders can be modified');
    }
  }

  // Snapshot
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

### Value Objects

```typescript
// domain/value-objects/Money.ts
// Value object: Immutable, compared by value

export class Money {
  private constructor(
    private readonly _value: number,
    private readonly _currency: string
  ) {}

  static create(value: number, currency: string): Money {
    if (value < 0) {
      throw new Error('Amount cannot be negative');
    }
    if (!['CNY', 'USD', 'EUR', 'JPY'].includes(currency)) {
      throw new Error(`Unsupported currency type: ${currency}`);
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
      throw new Error('Insufficient balance');
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
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this._currency
    });
    return formatter.format(this._value);
  }

  private ensureSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(`Currency mismatch: ${this._currency} vs ${other._currency}`);
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
      throw new Error('Province and city cannot be empty');
    }
    if (!props.postalCode || !/^\d{6}$/.test(props.postalCode)) {
      throw new Error('Invalid postal code format');
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

### Application Service (Use Case Implementation)

```typescript
// application/services/OrderApplicationService.ts
// Application service: Implements primary port, coordinates domain objects and secondary ports

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
    // 1. Create order aggregate root
    const orderId = this.orderRepository.nextId();
    const order = Order.create(orderId, command.customerId);

    // 2. Add order items
    for (const item of command.items) {
      // Get product info from product catalog
      const product = await this.productCatalog.findById(item.productId);
      if (!product) {
        throw new ProductNotFoundError(item.productId);
      }

      // Check inventory
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

    // 3. Set shipping address
    order.setShippingAddress(Address.create(command.shippingAddress));

    // 4. Save order
    await this.orderRepository.save(order);

    // 5. Publish domain events
    await this.publishEvents(order);

    // 6. Return result
    return {
      orderId: order.id.value,
      totalAmount: order.totalAmount.value,
      estimatedDelivery: this.calculateEstimatedDelivery(command.shippingAddress)
    };
  }

  async placeOrder(orderId: string): Promise<PlaceOrderResult> {
    // 1. Get order
    const order = await this.getOrderOrThrow(orderId);

    // 2. Reserve inventory
    const reservations = order.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));
    await this.inventoryService.reserveStock(orderId, reservations);

    try {
      // 3. Place order
      order.place();

      // 4. Save order
      await this.orderRepository.save(order);

      // 5. Publish events
      await this.publishEvents(order);

      return {
        orderId: order.id.value,
        status: order.status,
        totalAmount: order.totalAmount.value
      };
    } catch (error) {
      // If placing order fails, release inventory
      await this.inventoryService.releaseStock(orderId);
      throw error;
    }
  }

  async processPayment(orderId: string, paymentMethod: PaymentMethod): Promise<PaymentResult> {
    const order = await this.getOrderOrThrow(orderId);

    // Process payment
    const paymentResult = await this.paymentGateway.processPayment({
      orderId: order.id.value,
      amount: order.totalAmount,
      customerId: order.customerId,
      paymentMethod
    });

    if (paymentResult.status === 'success') {
      // Confirm payment
      order.confirmPayment(paymentResult.transactionId);
      await this.orderRepository.save(order);
      await this.publishEvents(order);

      // Send confirmation email
      await this.notificationService.sendOrderConfirmation(
        orderId,
        await this.getCustomerEmail(order.customerId)
      );
    } else {
      // Payment failed, release inventory
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

    // If already paid, need to refund
    if (order.isPaid()) {
      const transaction = await this.getOrderTransaction(orderId);
      if (transaction) {
        await this.paymentGateway.refund(transaction.id, order.totalAmount);
      }
    }

    // Release inventory
    await this.inventoryService.releaseStock(orderId);

    // Cancel order
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
    // Simplified calculation, actual implementation needs to calculate based on address
    const days = address.province === 'Shanghai' ? 1 : 3;
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + days);
    return delivery;
  }

  private async getCustomerEmail(customerId: string): Promise<string> {
    // Actual implementation needs to query customer info
    return 'customer@example.com';
  }

  private async getOrderTransaction(orderId: string): Promise<{ id: string } | null> {
    // Actual implementation needs to query transaction records
    return null;
  }
}
```

---

## Comparison with Clean Architecture

Both hexagonal architecture and Clean Architecture aim to separate business logic from technical details, but they have different emphases and expressions.

### Architecture Comparison Diagram

```
        Hexagonal Architecture                    Clean Architecture

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

   Two-layer structure:                Four-layer structure:
   - Application Core (Ports)          - Entities
   - Adapters                          - Use Cases
                                       - Interface Adapters
                                       - Frameworks & Drivers
```

### Core Concept Comparison

| Concept | Hexagonal Architecture | Clean Architecture |
|---------|----------------------|-------------------|
| Core Idea | Ports and Adapters | Dependency Rule |
| Layer Division | Two layers (Core + Adapters) | Four clearly defined layers |
| Business Logic | Unified in core domain | Separated into Entities and Use Cases |
| External Interaction | Ports define interfaces | Interface Adapters |
| Technical Details | Adapter implementation | Frameworks & Drivers layer |
| Visualization | Hexagon | Concentric circles |
| Emphasis | Symmetry (same in/out) | Dependency direction (outside to inside) |

### Code Structure Comparison

```typescript
// Hexagonal Architecture structure
src/
├── domain/                    # Application Core
│   ├── entities/
│   ├── value-objects/
│   └── services/
├── application/
│   └── ports/                 # Port definitions
│       ├── in/               # Primary Ports
│       └── out/              # Secondary Ports
└── adapters/                  # Adapters
    ├── in/                   # Primary Adapters
    │   ├── web/
    │   ├── cli/
    │   └── message/
    └── out/                  # Secondary Adapters
        ├── persistence/
        ├── payment/
        └── notification/

// Clean Architecture structure
src/
├── domain/                    # Entity Layer
│   ├── entities/
│   └── value-objects/
├── application/               # Use Case Layer
│   ├── use-cases/
│   └── ports/
├── adapters/                  # Interface Adapters Layer
│   ├── controllers/
│   ├── presenters/
│   └── gateways/
└── infrastructure/            # Frameworks & Drivers Layer
    ├── web/
    ├── database/
    └── external/
```

### Design Philosophy Comparison

**Hexagonal Architecture emphasizes:**

1. **Symmetry**: All external systems (users, databases, APIs) interact with the core in the same way
2. **Replaceability**: Any adapter can be replaced without affecting the core
3. **Ports are contracts**: Ports define the capability boundaries of the application

```typescript
// Hexagonal Architecture: Emphasizes port symmetry
// Whether HTTP, CLI, or message queue, all interact with the core through the same ports

interface OrderService {  // Primary port
  createOrder(command: CreateOrderCommand): Promise<CreateOrderResult>;
}

// HTTP adapter
class HttpOrderAdapter implements OrderService { ... }

// CLI adapter
class CliOrderAdapter implements OrderService { ... }

// Message queue adapter
class MessageQueueOrderAdapter implements OrderService { ... }
```

**Clean Architecture emphasizes:**

1. **Dependency Rule**: Source code dependencies can only point inward
2. **Layer Responsibilities**: Each layer has clearly defined responsibilities
3. **Use Case Separation**: Clear distinction between entities and use cases

```typescript
// Clean Architecture: Emphasizes separation of use cases and entities

// Entity Layer - Enterprise-level business rules
class Order {
  calculateTotal(): Money { ... }
  confirm(): void { ... }
}

// Use Case Layer - Application-level business rules
class CreateOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private inventoryService: InventoryService
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    // Orchestrate entities to achieve business goals
  }
}
```

### How to Choose?

| Scenario | Recommended Architecture | Reason |
|----------|-------------------------|--------|
| Multi-channel access | Hexagonal Architecture | Emphasizes port symmetry |
| Complex business rules | Clean Architecture | Clear separation of entities and use cases |
| Microservices | Hexagonal Architecture | Adapter pattern facilitates integration |
| DDD projects | Either | Both are compatible with DDD |
| Simple projects | Hexagonal Architecture | Two-layer structure is simpler |
| Large teams | Clean Architecture | Four-layer structure has clearer boundaries |

### Hybrid Approach

In actual projects, the two architectures can be used together. The core principles are the same: **isolate business logic and control dependency direction**.

```typescript
// Hybrid architecture example

// Using Clean Architecture's four-layer concept
// Using Hexagonal Architecture's ports and adapters pattern

// domain/entities - Clean Architecture's Entity Layer
class Order { ... }

// application/use-cases - Clean Architecture's Use Case Layer
// application/ports - Hexagonal Architecture's Ports
class CreateOrderUseCase implements CreateOrderPort { ... }

// adapters - Hexagonal Architecture's Adapters
class HttpOrderAdapter { ... }
class PostgresOrderRepository implements OrderRepository { ... }

// infrastructure - Clean Architecture's Frameworks Layer
class ExpressApp { ... }
class TypeOrmConfig { ... }
```

---

## Testing Strategy

One of the major advantages of hexagonal architecture is excellent testability. By replacing adapters, we can perform isolated testing at different levels.

### Domain Layer Unit Tests

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

// Test helper functions
function createTestOrder(): Order {
  return Order.create(new OrderId('test-order'), 'test-customer');
}

function createTestAddress(): Address {
  return Address.create({
    province: 'Shanghai',
    city: 'Shanghai',
    district: 'Pudong New Area',
    street: 'Zhangjiang Hi-Tech Park',
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

### Application Service Tests (Using Mock Adapters)

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
          province: 'Shanghai',
          city: 'Shanghai',
          district: 'Pudong New Area',
          street: 'Test Street',
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

// Mock adapters
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
    // Mock reserve stock
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

### Adapter Integration Tests

```typescript
// adapters/out/persistence/__tests__/PostgresOrderRepository.integration.test.ts

describe('PostgresOrderRepository Integration', () => {
  let repository: PostgresOrderRepository;
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL
    });

    // Create test tables
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
        province: 'Shanghai',
        city: 'Shanghai',
        district: 'Pudong New Area',
        street: 'Test Street',
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

### End-to-End Tests

```typescript
// e2e/order-flow.e2e.test.ts

describe('Order Flow E2E', () => {
  let app: Express;
  let server: Server;

  beforeAll(async () => {
    // Start test server
    app = await createTestApplication();
    server = app.listen(0);
  });

  afterAll(async () => {
    server.close();
  });

  it('should complete full order flow', async () => {
    const baseUrl = `http://localhost:${(server.address() as any).port}`;

    // 1. Create order
    const createResponse = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'customer-1',
        items: [{ productId: 'product-1', quantity: 2 }],
        shippingAddress: {
          province: 'Shanghai',
          city: 'Shanghai',
          district: 'Pudong New Area',
          street: 'Test Street',
          postalCode: '200000'
        }
      })
    });

    expect(createResponse.status).toBe(201);
    const createResult = await createResponse.json();
    const orderId = createResult.data.orderId;

    // 2. Query order
    const getResponse = await fetch(`${baseUrl}/api/orders/${orderId}`);
    expect(getResponse.status).toBe(200);
    const orderDetails = await getResponse.json();
    expect(orderDetails.data.status).toBe('DRAFT');

    // 3. Place order
    const placeResponse = await fetch(`${baseUrl}/api/orders/${orderId}/place`, {
      method: 'POST'
    });
    expect(placeResponse.status).toBe(200);

    // 4. Payment
    const payResponse = await fetch(`${baseUrl}/api/orders/${orderId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod: 'CREDIT_CARD' })
    });
    expect(payResponse.status).toBe(200);
    const payResult = await payResponse.json();
    expect(payResult.data.status).toBe('success');

    // 5. Verify final status
    const finalResponse = await fetch(`${baseUrl}/api/orders/${orderId}`);
    const finalOrder = await finalResponse.json();
    expect(finalOrder.data.status).toBe('PAID');
  });

  it('should handle cancellation', async () => {
    const baseUrl = `http://localhost:${(server.address() as any).port}`;

    // Create and place order
    const orderId = await createAndPlaceOrder(baseUrl);

    // Cancel order
    const cancelResponse = await fetch(`${baseUrl}/api/orders/${orderId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Changed my mind' })
    });

    expect(cancelResponse.status).toBe(200);

    // Verify status
    const getResponse = await fetch(`${baseUrl}/api/orders/${orderId}`);
    const order = await getResponse.json();
    expect(order.data.status).toBe('CANCELLED');
  });
});
```

---

## Complete Project Structure

```
src/
├── domain/                              # Domain Layer (Application Core)
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
├── application/                         # Application Layer
│   ├── ports/
│   │   ├── in/                         # Primary Ports
│   │   │   ├── OrderService.ts
│   │   │   ├── InventoryService.ts
│   │   │   └── PaymentService.ts
│   │   └── out/                        # Secondary Ports
│   │       ├── OrderRepository.ts
│   │       ├── ProductCatalog.ts
│   │       ├── PaymentGateway.ts
│   │       ├── NotificationService.ts
│   │       └── EventPublisher.ts
│   ├── services/                       # Use Case Implementation
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
├── adapters/                            # Adapter Layer
│   ├── in/                             # Primary Adapters
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
│   └── out/                            # Secondary Adapters
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
├── infrastructure/                      # Infrastructure
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
├── main.ts                              # Entry File
└── __tests__/                           # Tests
    ├── unit/
    │   ├── domain/
    │   └── application/
    ├── integration/
    │   └── adapters/
    └── e2e/
        └── order-flow.test.ts
```

---

## Interview Key Points

### What is Hexagonal Architecture? What is its core idea?

**Answer**: Hexagonal Architecture (also called Ports and Adapters Architecture) is a software architecture pattern proposed by Alistair Cockburn. The core idea is to completely isolate the application's business logic from the external world, enabling:

- Business logic does not depend on any framework, database, or external service
- All external interactions are defined through ports (interfaces), and adapters (implementations) are replaceable
- The system has symmetry; whether user interface or database, all interact with the core in the same way

### What are Ports? What are Adapters? What's the difference?

**Answer**:
- **Ports** are interfaces defined by the application core, divided into primary ports (defining capabilities the application provides) and secondary ports (defining capabilities the application needs)
- **Adapters** are concrete implementations of ports, responsible for interacting with external systems
- Difference: Ports are abstractions defined in the application core; adapters are concrete implementations that depend on external technology

```typescript
// Port (interface)
interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
}

// Adapter (implementation)
class PostgresOrderRepository implements OrderRepository { ... }
class InMemoryOrderRepository implements OrderRepository { ... }
```

### What's the difference between Primary Ports/Adapters and Secondary Ports/Adapters?

**Answer**:
- **Primary Ports/Adapters**: External world drives the application
  - Primary ports define services the application provides (e.g., `OrderService`)
  - Primary adapters handle external requests (e.g., HTTP Controller, CLI)

- **Secondary Ports/Adapters**: Application drives the external world
  - Secondary ports define capabilities the application needs (e.g., `OrderRepository`)
  - Secondary adapters implement interactions with external systems (e.g., PostgreSQL implementation)

### How does Hexagonal Architecture achieve testability?

**Answer**:
- Domain logic doesn't depend on external systems, enabling pure unit testing
- Secondary ports are interfaces, allowing mock adapters to replace real implementations
- Can provide in-memory implementations for testing (e.g., `InMemoryOrderRepository`)
- Different layers can be tested independently: domain layer, application layer, adapter layer

### What's the difference between Hexagonal Architecture and Clean Architecture?

**Answer**:
- **Layer count**: Hexagonal has two layers (core + adapters), Clean has four layers
- **Emphasis**: Hexagonal emphasizes symmetry and ports/adapters, Clean emphasizes dependency direction
- **Business logic**: Hexagonal unifies in core, Clean clearly separates entities and use cases
- **Use cases**: Hexagonal suits multi-channel access, Clean suits complex business rules

### How to handle transactions across ports?

**Answer**:
- Use domain events for eventual consistency
- Use Saga pattern for distributed transactions
- Coordinate multiple port operations in the application service layer
- Use local transactions + event publishing when necessary

```typescript
class OrderApplicationService {
  async placeOrder(orderId: string): Promise<void> {
    // Reserve inventory
    await this.inventoryService.reserveStock(orderId, items);
    try {
      order.place();
      await this.orderRepository.save(order);
    } catch (error) {
      // Rollback inventory
      await this.inventoryService.releaseStock(orderId);
      throw error;
    }
  }
}
```

### What scenarios are suitable for Hexagonal Architecture?

**Answer**:
Suitable scenarios:
- Need multi-channel access (Web, CLI, message queue)
- Need to support multiple data stores
- Business logic requires high testability
- Expected to change technology stack
- Microservices architecture

Unsuitable scenarios:
- Simple CRUD applications
- Prototypes or short-term projects
- Simple projects with small teams

### What are the drawbacks of Hexagonal Architecture?

**Answer**:
- **Increased code volume**: Need to define many interfaces and adapters
- **Indirection**: All calls go through ports, increasing comprehension cost
- **Over-abstraction risk**: May be over-designed for simple scenarios
- **Learning curve**: Team needs to understand architecture principles
- **Slower initial development**: Requires building infrastructure upfront

---

## Summary

The core value of hexagonal architecture lies in **isolating business logic** and **controlling dependency direction**. Through the ports and adapters design pattern, we can:

1. **Achieve technology independence**: Business logic doesn't depend on any framework or external service
2. **Improve testability**: Core logic can be tested in completely isolated environments
3. **Support multi-channel access**: Same business logic can be accessed through different methods
4. **Simplify technology changes**: Changing databases or frameworks only requires replacing adapters
5. **Clear boundaries**: Ports clearly define the capability boundaries of the application

Remember Alistair Cockburn's design intent:

> "Allow an application to equally be driven by users, programs, automated test or batch scripts, and to be developed and tested in isolation from its eventual run-time devices and databases."

Hexagonal architecture makes our applications independent, testable, and maintainable cores that maintain appropriate distance from the external world.

---

## Reference Resources

### Classic Articles

1. **"Hexagonal Architecture"** - Alistair Cockburn's original article
2. **"Ports and Adapters Pattern"** - Detailed explanation by Alistair Cockburn
3. **"DDD, Hexagonal, Onion, Clean, CQRS"** - Architecture pattern comparison

### Recommended Books

1. **"Implementing Domain-Driven Design"** - Vaughn Vernon
2. **"Clean Architecture"** - Robert C. Martin
3. **"Fundamentals of Software Architecture"** - Mark Richards & Neal Ford

### Example Projects

- [buckpal](https://github.com/thombergs/buckpal) - Java hexagonal architecture example
- [go-hexagonal](https://github.com/iDevoid/go-hexagonal) - Go hexagonal architecture example
- [hexagonal-architecture-typescript](https://github.com/Sairyss/hexagonal-architecture-typescript) - TypeScript example

### Related Patterns

- **Clean Architecture**: Four-layer concentric circle architecture
- **Onion Architecture**: Similar layering concept
- **CQRS**: Command Query Responsibility Segregation
- **Event Sourcing**: Event sourcing pattern
