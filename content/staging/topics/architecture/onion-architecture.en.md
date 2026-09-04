---
title: Onion Architecture
description: Deep dive into onion architecture layers and dependency rules
track: architecture
section: design-patterns
difficulty: advanced
tags:
  - onion architecture
  - layered
  - dependency inversion
  - DDD
status: imported
origin: old/src/content/docs/architecture/onion-architecture.en.md
divergence: 0.198
issues: []
legacy:
  category: Architecture
  subcategory: Patterns
  order: 18
  lastUpdated: 2026-01-07
---

## Concept Overview

Onion Architecture is a software architecture pattern introduced by Jeffrey Palermo in 2008. It emphasizes the separation of concerns and the dependency inversion principle, organizing code into concentric layers where dependencies flow inward toward the core domain. The name "Onion" comes from its visual representation: layers wrapped around a central core, like the layers of an onion.

### The Problem It Solves

Traditional layered architectures (Presentation -> Business Logic -> Data Access) suffer from several issues:

1. **Tight Coupling to Infrastructure**: Business logic depends directly on data access, making it hard to test
2. **Database-Centric Design**: The database becomes the center of the architecture, driving design decisions
3. **Difficult Testing**: Unit testing business logic requires mocking database connections
4. **Technology Lock-in**: Changing databases or frameworks requires extensive rewrites
5. **Unclear Dependencies**: Layer boundaries are often violated, with presentation code accessing data directly

Onion Architecture addresses these problems by inverting the traditional dependency direction and placing the domain model at the center.

### Core Philosophy

The fundamental principle of Onion Architecture is:

> **The domain model is the core of the application, and all dependencies point inward toward it. The domain has no knowledge of outer layers.**

This means:
- Business logic is completely independent of infrastructure
- External concerns (databases, UIs, frameworks) are pushed to the outer layers
- The application can be tested without any infrastructure
- Technology choices can change without affecting the domain

---

## The Layers of Onion Architecture

Onion Architecture consists of four concentric layers, from innermost to outermost:

```
                +--------------------------------------------------+
                |              Infrastructure Layer                |
                |  +------------------------------------------+   |
                |  |           Application Services           |   |
                |  |  +----------------------------------+    |   |
                |  |  |        Domain Services           |    |   |
                |  |  |  +--------------------------+   |    |   |
                |  |  |  |       Domain Model       |   |    |   |
                |  |  |  |    (Entities & Values)   |   |    |   |
                |  |  |  +--------------------------+   |    |   |
                |  |  +----------------------------------+    |   |
                |  +------------------------------------------+   |
                +--------------------------------------------------+

                Dependencies flow INWARD only.
                Inner layers know nothing about outer layers.
```

### Domain Model Layer (Core)

The innermost layer contains the heart of the application: **entities**, **value objects**, and **domain events**. This layer has zero dependencies on anything else - it is pure business logic expressed in code.

```typescript
// domain/entities/Product.ts
// Entity: Has identity, mutable state, and lifecycle
export class Product {
  private readonly id: ProductId;
  private name: string;
  private description: string;
  private price: Money;
  private stockQuantity: number;
  private status: ProductStatus;

  private constructor(
    id: ProductId,
    name: string,
    description: string,
    price: Money,
    stockQuantity: number,
    status: ProductStatus
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.stockQuantity = stockQuantity;
    this.status = status;
  }

  // Factory method for creating new products
  static create(
    id: ProductId,
    name: string,
    description: string,
    price: Money,
    initialStock: number
  ): Product {
    if (name.trim().length === 0) {
      throw new InvalidProductNameError('Product name cannot be empty');
    }
    if (price.isNegative()) {
      throw new InvalidPriceError('Price cannot be negative');
    }

    return new Product(
      id,
      name.trim(),
      description,
      price,
      initialStock,
      ProductStatus.DRAFT
    );
  }

  // Factory for reconstituting from persistence
  static reconstitute(
    id: ProductId,
    name: string,
    description: string,
    price: Money,
    stockQuantity: number,
    status: ProductStatus
  ): Product {
    return new Product(id, name, description, price, stockQuantity, status);
  }

  // Business logic: Publish product
  publish(): void {
    if (this.status !== ProductStatus.DRAFT) {
      throw new InvalidProductStateError(
        `Cannot publish product in ${this.status} status`
      );
    }
    if (this.stockQuantity <= 0) {
      throw new InsufficientStockError(
        'Cannot publish product with zero stock'
      );
    }
    this.status = ProductStatus.ACTIVE;
  }

  // Business logic: Discontinue product
  discontinue(): void {
    if (this.status === ProductStatus.DISCONTINUED) {
      throw new InvalidProductStateError('Product is already discontinued');
    }
    this.status = ProductStatus.DISCONTINUED;
  }

  // Business logic: Update price
  updatePrice(newPrice: Money): void {
    if (newPrice.isNegative()) {
      throw new InvalidPriceError('Price cannot be negative');
    }
    this.price = newPrice;
  }

  // Business logic: Add stock
  addStock(quantity: number): void {
    if (quantity <= 0) {
      throw new InvalidQuantityError('Quantity must be positive');
    }
    this.stockQuantity += quantity;
  }

  // Business logic: Reserve stock
  reserveStock(quantity: number): void {
    if (quantity <= 0) {
      throw new InvalidQuantityError('Quantity must be positive');
    }
    if (this.stockQuantity < quantity) {
      throw new InsufficientStockError(
        `Cannot reserve ${quantity} items, only ${this.stockQuantity} available`
      );
    }
    this.stockQuantity -= quantity;
  }

  // Business logic: Check if available for sale
  isAvailableForSale(): boolean {
    return this.status === ProductStatus.ACTIVE && this.stockQuantity > 0;
  }

  // Getters
  getId(): ProductId { return this.id; }
  getName(): string { return this.name; }
  getDescription(): string { return this.description; }
  getPrice(): Money { return this.price; }
  getStockQuantity(): number { return this.stockQuantity; }
  getStatus(): ProductStatus { return this.status; }
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DISCONTINUED = 'DISCONTINUED'
}
```

```typescript
// domain/value-objects/Money.ts
// Value Object: Immutable, no identity, compared by value
export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: Currency
  ) {}

  static of(amount: number, currency: Currency = Currency.USD): Money {
    return new Money(Math.round(amount * 100) / 100, currency);
  }

  static zero(currency: Currency = Currency.USD): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  isNegative(): boolean {
    return this.amount < 0;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
  }

  getAmount(): number { return this.amount; }
  getCurrency(): Currency { return this.currency; }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP'
}
```

```typescript
// domain/value-objects/ProductId.ts
export class ProductId {
  private constructor(readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new InvalidIdentifierError('ProductId cannot be empty');
    }
  }

  static create(value: string): ProductId {
    return new ProductId(value);
  }

  static generate(): ProductId {
    return new ProductId(crypto.randomUUID());
  }

  equals(other: ProductId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

```typescript
// domain/events/ProductCreatedEvent.ts
// Domain Event: Records something that happened in the domain
export class ProductCreatedEvent implements DomainEvent {
  readonly occurredOn: Date;
  readonly eventType = 'ProductCreated';

  constructor(
    readonly productId: ProductId,
    readonly name: string,
    readonly price: Money
  ) {
    this.occurredOn = new Date();
  }
}

export class ProductPublishedEvent implements DomainEvent {
  readonly occurredOn: Date;
  readonly eventType = 'ProductPublished';

  constructor(readonly productId: ProductId) {
    this.occurredOn = new Date();
  }
}
```

### Domain Services Layer

The second layer contains **domain services** - operations that don't naturally belong to a single entity but represent important domain logic. This layer depends only on the Domain Model layer.

```typescript
// domain/services/PricingService.ts
// Domain Service: Encapsulates domain logic that spans multiple entities
export class PricingService {
  // Calculate discounted price based on customer tier
  calculateDiscountedPrice(
    product: Product,
    customer: Customer,
    quantity: number
  ): Money {
    const basePrice = product.getPrice();
    const discount = this.getDiscountRate(customer.getTier(), quantity);
    const discountedAmount = basePrice.getAmount() * (1 - discount);
    return Money.of(discountedAmount * quantity, basePrice.getCurrency());
  }

  private getDiscountRate(tier: CustomerTier, quantity: number): number {
    // Volume discount
    let volumeDiscount = 0;
    if (quantity >= 100) {
      volumeDiscount = 0.15;
    } else if (quantity >= 50) {
      volumeDiscount = 0.10;
    } else if (quantity >= 10) {
      volumeDiscount = 0.05;
    }

    // Tier discount
    const tierDiscount = {
      [CustomerTier.BRONZE]: 0,
      [CustomerTier.SILVER]: 0.05,
      [CustomerTier.GOLD]: 0.10,
      [CustomerTier.PLATINUM]: 0.15
    }[tier];

    // Apply the higher discount
    return Math.max(volumeDiscount, tierDiscount);
  }
}
```

```typescript
// domain/services/InventoryDomainService.ts
export class InventoryDomainService {
  // Check if an order can be fulfilled
  canFulfillOrder(
    products: Map<Product, number>,
    warehouse: Warehouse
  ): FulfillmentResult {
    const unavailableItems: UnavailableItem[] = [];

    for (const [product, requestedQuantity] of products) {
      const availableStock = warehouse.getStockFor(product.getId());

      if (availableStock < requestedQuantity) {
        unavailableItems.push({
          productId: product.getId(),
          productName: product.getName(),
          requested: requestedQuantity,
          available: availableStock
        });
      }
    }

    return {
      canFulfill: unavailableItems.length === 0,
      unavailableItems
    };
  }

  // Calculate reorder point for a product
  calculateReorderPoint(
    product: Product,
    averageDailySales: number,
    leadTimeDays: number,
    safetyStockDays: number
  ): number {
    const demandDuringLeadTime = averageDailySales * leadTimeDays;
    const safetyStock = averageDailySales * safetyStockDays;
    return Math.ceil(demandDuringLeadTime + safetyStock);
  }
}
```

```typescript
// domain/services/OrderDomainService.ts
export class OrderDomainService {
  // Split order across multiple warehouses
  splitOrderByWarehouse(
    order: Order,
    warehouseInventory: Map<WarehouseId, Map<ProductId, number>>
  ): OrderSplit[] {
    const splits: OrderSplit[] = [];
    const remainingItems = new Map(
      order.getItems().map(item => [item.productId, item.quantity])
    );

    for (const [warehouseId, inventory] of warehouseInventory) {
      const warehouseItems: OrderItem[] = [];

      for (const [productId, needed] of remainingItems) {
        const available = inventory.get(productId) || 0;
        if (available > 0) {
          const allocated = Math.min(needed, available);
          warehouseItems.push({
            productId,
            quantity: allocated,
            unitPrice: order.getItemPrice(productId)
          });
          remainingItems.set(productId, needed - allocated);
        }
      }

      if (warehouseItems.length > 0) {
        splits.push({ warehouseId, items: warehouseItems });
      }
    }

    return splits;
  }
}
```

### Application Services Layer

The third layer contains **application services** (also called use cases or interactors). These orchestrate domain objects to accomplish specific application tasks. This layer defines interfaces for external dependencies (repositories, external services) but does not implement them.

```typescript
// application/interfaces/IProductRepository.ts
// Repository Interface: Defined in Application layer, implemented in Infrastructure
export interface IProductRepository {
  findById(id: ProductId): Promise<Product | null>;
  findByIds(ids: ProductId[]): Promise<Product[]>;
  findAll(options?: FindOptions): Promise<Product[]>;
  findByCategory(categoryId: CategoryId): Promise<Product[]>;
  save(product: Product): Promise<void>;
  delete(id: ProductId): Promise<void>;
  nextIdentity(): ProductId;
}

export interface FindOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}
```

```typescript
// application/interfaces/IEventPublisher.ts
export interface IEventPublisher {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}

// application/interfaces/IUnitOfWork.ts
export interface IUnitOfWork {
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
```

```typescript
// application/use-cases/CreateProductUseCase.ts
export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  currency: string;
  initialStock: number;
  categoryId: string;
}

export interface CreateProductOutput {
  productId: string;
  name: string;
  status: string;
}

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(input: CreateProductInput): Promise<CreateProductOutput> {
    // 1. Validate category exists
    const category = await this.categoryRepository.findById(
      CategoryId.create(input.categoryId)
    );
    if (!category) {
      throw new CategoryNotFoundError(input.categoryId);
    }

    // 2. Create product entity
    const productId = this.productRepository.nextIdentity();
    const price = Money.of(input.price, input.currency as Currency);

    const product = Product.create(
      productId,
      input.name,
      input.description,
      price,
      input.initialStock
    );

    // 3. Persist product
    await this.productRepository.save(product);

    // 4. Publish domain event
    await this.eventPublisher.publish(
      new ProductCreatedEvent(productId, input.name, price)
    );

    // 5. Return result
    return {
      productId: productId.toString(),
      name: product.getName(),
      status: product.getStatus()
    };
  }
}
```

```typescript
// application/use-cases/PublishProductUseCase.ts
export interface PublishProductInput {
  productId: string;
}

export interface PublishProductOutput {
  productId: string;
  status: string;
  publishedAt: Date;
}

export class PublishProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly inventoryService: IInventoryService,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(input: PublishProductInput): Promise<PublishProductOutput> {
    // 1. Retrieve product
    const productId = ProductId.create(input.productId);
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new ProductNotFoundError(input.productId);
    }

    // 2. Verify inventory is properly set up
    const inventorySetup = await this.inventoryService.isInventoryConfigured(productId);
    if (!inventorySetup) {
      throw new InventoryNotConfiguredError(input.productId);
    }

    // 3. Publish product (domain logic)
    product.publish();

    // 4. Save changes
    await this.productRepository.save(product);

    // 5. Publish domain event
    await this.eventPublisher.publish(
      new ProductPublishedEvent(productId)
    );

    return {
      productId: productId.toString(),
      status: product.getStatus(),
      publishedAt: new Date()
    };
  }
}
```

```typescript
// application/use-cases/ProcessOrderUseCase.ts
export interface ProcessOrderInput {
  orderId: string;
  paymentMethodId: string;
}

export interface ProcessOrderOutput {
  orderId: string;
  status: string;
  totalAmount: number;
  paymentId: string;
}

export class ProcessOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductRepository,
    private readonly paymentService: IPaymentService,
    private readonly inventoryService: IInventoryService,
    private readonly notificationService: INotificationService,
    private readonly eventPublisher: IEventPublisher,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(input: ProcessOrderInput): Promise<ProcessOrderOutput> {
    await this.unitOfWork.beginTransaction();

    try {
      // 1. Retrieve order
      const orderId = OrderId.create(input.orderId);
      const order = await this.orderRepository.findById(orderId);

      if (!order) {
        throw new OrderNotFoundError(input.orderId);
      }

      // 2. Verify all products are still available
      const productIds = order.getItems().map(item => item.productId);
      const products = await this.productRepository.findByIds(productIds);

      for (const item of order.getItems()) {
        const product = products.find(p => p.getId().equals(item.productId));
        if (!product || !product.isAvailableForSale()) {
          throw new ProductNotAvailableError(item.productId.toString());
        }
      }

      // 3. Reserve inventory
      for (const item of order.getItems()) {
        await this.inventoryService.reserveStock(
          item.productId,
          item.quantity
        );
      }

      // 4. Process payment
      const paymentResult = await this.paymentService.processPayment({
        orderId,
        amount: order.calculateTotal(),
        paymentMethodId: input.paymentMethodId
      });

      if (!paymentResult.success) {
        // Release reserved inventory
        for (const item of order.getItems()) {
          await this.inventoryService.releaseStock(
            item.productId,
            item.quantity
          );
        }
        throw new PaymentFailedError(paymentResult.errorMessage);
      }

      // 5. Confirm order
      order.confirm(paymentResult.paymentId);

      // 6. Save order
      await this.orderRepository.save(order);

      // 7. Commit transaction
      await this.unitOfWork.commit();

      // 8. Send confirmation (outside transaction)
      await this.notificationService.sendOrderConfirmation(
        order.getCustomerId(),
        order
      );

      // 9. Publish events
      await this.eventPublisher.publish(
        new OrderProcessedEvent(orderId, paymentResult.paymentId)
      );

      return {
        orderId: orderId.toString(),
        status: order.getStatus(),
        totalAmount: order.calculateTotal().getAmount(),
        paymentId: paymentResult.paymentId.toString()
      };

    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }
}
```

### Infrastructure Layer (Outermost)

The outermost layer contains all infrastructure concerns: database access, external APIs, web frameworks, messaging systems, and file I/O. This layer implements the interfaces defined in the Application Services layer.

```typescript
// infrastructure/persistence/TypeOrmProductRepository.ts
import { Repository } from 'typeorm';
import { ProductEntity } from './entities/ProductEntity';

export class TypeOrmProductRepository implements IProductRepository {
  constructor(
    private readonly ormRepository: Repository<ProductEntity>
  ) {}

  async findById(id: ProductId): Promise<Product | null> {
    const entity = await this.ormRepository.findOne({
      where: { id: id.value }
    });

    if (!entity) {
      return null;
    }

    return this.toDomain(entity);
  }

  async findByIds(ids: ProductId[]): Promise<Product[]> {
    const entities = await this.ormRepository.findBy({
      id: In(ids.map(id => id.value))
    });

    return entities.map(entity => this.toDomain(entity));
  }

  async findAll(options?: FindOptions): Promise<Product[]> {
    const queryBuilder = this.ormRepository.createQueryBuilder('product');

    if (options?.filters?.status) {
      queryBuilder.where('product.status = :status', {
        status: options.filters.status
      });
    }

    if (options?.sortBy) {
      queryBuilder.orderBy(
        `product.${options.sortBy}`,
        options.sortOrder?.toUpperCase() as 'ASC' | 'DESC'
      );
    }

    if (options?.page && options?.pageSize) {
      queryBuilder
        .skip((options.page - 1) * options.pageSize)
        .take(options.pageSize);
    }

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async findByCategory(categoryId: CategoryId): Promise<Product[]> {
    const entities = await this.ormRepository.find({
      where: { categoryId: categoryId.value }
    });

    return entities.map(entity => this.toDomain(entity));
  }

  async save(product: Product): Promise<void> {
    const entity = this.toEntity(product);
    await this.ormRepository.save(entity);
  }

  async delete(id: ProductId): Promise<void> {
    await this.ormRepository.delete({ id: id.value });
  }

  nextIdentity(): ProductId {
    return ProductId.generate();
  }

  private toDomain(entity: ProductEntity): Product {
    return Product.reconstitute(
      ProductId.create(entity.id),
      entity.name,
      entity.description,
      Money.of(entity.priceAmount, entity.priceCurrency as Currency),
      entity.stockQuantity,
      entity.status as ProductStatus
    );
  }

  private toEntity(product: Product): ProductEntity {
    const entity = new ProductEntity();
    entity.id = product.getId().value;
    entity.name = product.getName();
    entity.description = product.getDescription();
    entity.priceAmount = product.getPrice().getAmount();
    entity.priceCurrency = product.getPrice().getCurrency();
    entity.stockQuantity = product.getStockQuantity();
    entity.status = product.getStatus();
    return entity;
  }
}
```

```typescript
// infrastructure/persistence/entities/ProductEntity.ts
import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('products')
export class ProductEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAmount: number;

  @Column({ length: 3 })
  priceCurrency: string;

  @Column({ type: 'int' })
  stockQuantity: number;

  @Column()
  status: string;

  @Column({ nullable: true })
  categoryId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
```

```typescript
// infrastructure/external/StripePaymentService.ts
import Stripe from 'stripe';

export class StripePaymentService implements IPaymentService {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' });
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount.getAmount() * 100),
        currency: request.amount.getCurrency().toLowerCase(),
        payment_method: request.paymentMethodId,
        confirm: true,
        metadata: {
          orderId: request.orderId.toString()
        }
      });

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          paymentId: PaymentId.create(paymentIntent.id),
          transactionReference: paymentIntent.id
        };
      }

      return {
        success: false,
        errorMessage: `Payment status: ${paymentIntent.status}`
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeCardError) {
        return {
          success: false,
          errorMessage: error.message
        };
      }
      throw error;
    }
  }

  async refund(paymentId: PaymentId, amount: Money): Promise<RefundResult> {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentId.value,
      amount: Math.round(amount.getAmount() * 100)
    });

    return {
      success: refund.status === 'succeeded',
      refundId: refund.id
    };
  }
}
```

```typescript
// infrastructure/web/ExpressProductController.ts
import { Router, Request, Response } from 'express';

export class ExpressProductController {
  private router: Router;

  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly publishProductUseCase: PublishProductUseCase,
    private readonly getProductUseCase: GetProductUseCase
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/products', this.createProduct.bind(this));
    this.router.post('/products/:id/publish', this.publishProduct.bind(this));
    this.router.get('/products/:id', this.getProduct.bind(this));
  }

  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const input: CreateProductInput = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        currency: req.body.currency || 'USD',
        initialStock: req.body.initialStock || 0,
        categoryId: req.body.categoryId
      };

      const output = await this.createProductUseCase.execute(input);

      res.status(201).json({
        success: true,
        data: output
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async publishProduct(req: Request, res: Response): Promise<void> {
    try {
      const input: PublishProductInput = {
        productId: req.params.id
      };

      const output = await this.publishProductUseCase.execute(input);

      res.status(200).json({
        success: true,
        data: output
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getProduct(req: Request, res: Response): Promise<void> {
    try {
      const output = await this.getProductUseCase.execute({
        productId: req.params.id
      });

      if (!output) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: output
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof ProductNotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof InvalidProductStateError) {
      res.status(422).json({ error: error.message });
    } else if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  getRouter(): Router {
    return this.router;
  }
}
```

```typescript
// infrastructure/messaging/RabbitMQEventPublisher.ts
import amqp from 'amqplib';

export class RabbitMQEventPublisher implements IEventPublisher {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  constructor(private readonly connectionUrl: string) {}

  async connect(): Promise<void> {
    this.connection = await amqp.connect(this.connectionUrl);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange('domain_events', 'topic', { durable: true });
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }

    const message = {
      eventType: event.eventType,
      occurredOn: event.occurredOn.toISOString(),
      payload: event
    };

    this.channel.publish(
      'domain_events',
      event.eventType,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
```

---

## The Dependency Rule

The most critical rule in Onion Architecture is the **Dependency Rule**:

> **Dependencies can only point inward. Source code in inner layers cannot reference anything in outer layers.**

```
                    +-----------------------+
                    |    Infrastructure     |
                    |          |            |
                    |          v            |
                    |  +-----------------+  |
                    |  |   Application   |  |
                    |  |        |        |  |
                    |  |        v        |  |
                    |  |  +-----------+  |  |
                    |  |  |  Domain   |  |  |
                    |  |  | Services  |  |  |
                    |  |  |     |     |  |  |
                    |  |  |     v     |  |  |
                    |  |  | +------+  |  |  |
                    |  |  | |Domain|  |  |  |
                    |  |  | |Model |  |  |  |
                    |  |  | +------+  |  |  |
                    |  |  +-----------+  |  |
                    |  +-----------------+  |
                    +-----------------------+

        All arrows (dependencies) point toward the center.
```

### Implementing Dependency Inversion

To respect the Dependency Rule, we use **interfaces** defined in inner layers and **implementations** in outer layers:

```typescript
// Application layer defines the interface
// application/interfaces/IProductRepository.ts
export interface IProductRepository {
  findById(id: ProductId): Promise<Product | null>;
  save(product: Product): Promise<void>;
}

// Infrastructure layer provides the implementation
// infrastructure/persistence/TypeOrmProductRepository.ts
export class TypeOrmProductRepository implements IProductRepository {
  async findById(id: ProductId): Promise<Product | null> {
    // TypeORM-specific implementation
  }

  async save(product: Product): Promise<void> {
    // TypeORM-specific implementation
  }
}
```

### Composition Root

Dependencies are wired together at the **Composition Root**, typically in the application's entry point:

```typescript
// main.ts - Composition Root
import { DataSource } from 'typeorm';
import express from 'express';

async function bootstrap() {
  // Initialize data source
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [ProductEntity, OrderEntity, CategoryEntity],
    synchronize: false
  });

  await dataSource.initialize();

  // Create infrastructure components
  const productRepository = new TypeOrmProductRepository(
    dataSource.getRepository(ProductEntity)
  );
  const categoryRepository = new TypeOrmCategoryRepository(
    dataSource.getRepository(CategoryEntity)
  );
  const orderRepository = new TypeOrmOrderRepository(
    dataSource.getRepository(OrderEntity)
  );

  const paymentService = new StripePaymentService(
    process.env.STRIPE_API_KEY!
  );
  const inventoryService = new WarehouseInventoryService(
    process.env.INVENTORY_API_URL!
  );
  const notificationService = new SendGridNotificationService(
    process.env.SENDGRID_API_KEY!
  );

  const eventPublisher = new RabbitMQEventPublisher(
    process.env.RABBITMQ_URL!
  );
  await eventPublisher.connect();

  const unitOfWork = new TypeOrmUnitOfWork(dataSource);

  // Create use cases
  const createProductUseCase = new CreateProductUseCase(
    productRepository,
    categoryRepository,
    eventPublisher
  );

  const publishProductUseCase = new PublishProductUseCase(
    productRepository,
    inventoryService,
    eventPublisher
  );

  const processOrderUseCase = new ProcessOrderUseCase(
    orderRepository,
    productRepository,
    paymentService,
    inventoryService,
    notificationService,
    eventPublisher,
    unitOfWork
  );

  // Create controllers
  const productController = new ExpressProductController(
    createProductUseCase,
    publishProductUseCase,
    new GetProductUseCase(productRepository)
  );

  const orderController = new ExpressOrderController(
    processOrderUseCase,
    new GetOrderUseCase(orderRepository)
  );

  // Setup Express app
  const app = express();
  app.use(express.json());
  app.use('/api', productController.getRouter());
  app.use('/api', orderController.getRouter());

  // Start server
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

bootstrap().catch(console.error);
```

---

## Comparison with Other Architectures

### Onion vs Clean Architecture

Onion Architecture and Clean Architecture share the same fundamental principles but differ in their layer definitions:

```
        Onion Architecture              Clean Architecture

    +------------------------+     +------------------------+
    |     Infrastructure     |     |   Frameworks/Drivers   |
    |  +------------------+  |     |  +------------------+  |
    |  |   Application    |  |     |  | Interface        |  |
    |  |    Services      |  |     |  |   Adapters       |  |
    |  |  +------------+  |  |     |  |  +------------+  |  |
    |  |  |  Domain    |  |  |     |  |  | Use Cases  |  |  |
    |  |  | Services   |  |  |     |  |  +------------+  |  |
    |  |  | +--------+ |  |  |     |  |  | Entities   |  |  |
    |  |  | | Domain | |  |  |     |  |  +------------+  |  |
    |  |  | | Model  | |  |  |     |  +------------------+  |
    |  |  | +--------+ |  |  |     +------------------------+
    |  |  +------------+  |  |
    |  +------------------+  |
    +------------------------+
```

| Aspect | Onion Architecture | Clean Architecture |
|--------|-------------------|-------------------|
| **Layers** | 4 (Domain Model, Domain Services, Application Services, Infrastructure) | 4 (Entities, Use Cases, Interface Adapters, Frameworks) |
| **Core Focus** | Domain Model at center | Entities at center |
| **Domain Services** | Explicit layer | Part of Use Cases layer |
| **Terminology** | Repository, Domain Service | Gateway, Interactor |
| **Origin** | Jeffrey Palermo (2008) | Robert C. Martin (2012) |

### Onion vs Hexagonal Architecture

```
        Onion Architecture           Hexagonal Architecture

    +------------------------+            +--------+
    |     Infrastructure     |           /  REST   \
    |  +------------------+  |          /  Adapter  \
    |  |   Application    |  |         +            +
    |  |    Services      |  |        /              \
    |  |  +------------+  |  |   +---+  Application  +---+
    |  |  |  Domain    |  |  |   |CLI|     Core     |DB |
    |  |  | Services   |  |  |   +---+   (Domain)   +---+
    |  |  | +--------+ |  |  |        \              /
    |  |  | | Domain | |  |  |         +            +
    |  |  | | Model  | |  |  |          \  Event   /
    |  |  | +--------+ |  |  |           \  Queue /
    |  |  +------------+  |  |            +------+
    |  +------------------+  |
    +------------------------+
```

| Aspect | Onion Architecture | Hexagonal Architecture |
|--------|-------------------|------------------------|
| **Structure** | Concentric circles | Hexagon with ports |
| **Layer Count** | 4 explicit layers | 2 conceptual layers (Core + Adapters) |
| **Vocabulary** | Layers, Domain Services | Ports, Adapters |
| **Focus** | Layer hierarchy | Pluggable interfaces |
| **Flexibility** | More prescriptive | More flexible |

### When to Choose Onion Architecture

**Choose Onion Architecture when:**
- You have complex domain logic requiring careful organization
- You want explicit separation between domain services and application services
- Your team benefits from prescriptive layer guidelines
- You're building enterprise applications with long-term maintenance needs

**Consider alternatives when:**
- The project is simple CRUD with minimal business logic
- Speed of initial development is prioritized over maintainability
- The team is small and can maintain consistency without strict layers

---

## Complete Project Structure

```
src/
├── domain/                              # Domain Model Layer (Core)
│   ├── entities/
│   │   ├── Product.ts
│   │   ├── Order.ts
│   │   ├── Customer.ts
│   │   └── Category.ts
│   ├── value-objects/
│   │   ├── ProductId.ts
│   │   ├── OrderId.ts
│   │   ├── CustomerId.ts
│   │   ├── Money.ts
│   │   ├── Address.ts
│   │   └── Email.ts
│   ├── events/
│   │   ├── DomainEvent.ts
│   │   ├── ProductCreatedEvent.ts
│   │   ├── ProductPublishedEvent.ts
│   │   ├── OrderCreatedEvent.ts
│   │   └── OrderProcessedEvent.ts
│   ├── errors/
│   │   ├── DomainError.ts
│   │   ├── InvalidProductStateError.ts
│   │   ├── InsufficientStockError.ts
│   │   └── ProductNotFoundError.ts
│   └── services/                        # Domain Services Layer
│       ├── PricingService.ts
│       ├── InventoryDomainService.ts
│       └── OrderDomainService.ts
│
├── application/                         # Application Services Layer
│   ├── use-cases/
│   │   ├── products/
│   │   │   ├── CreateProductUseCase.ts
│   │   │   ├── PublishProductUseCase.ts
│   │   │   ├── UpdateProductUseCase.ts
│   │   │   └── GetProductUseCase.ts
│   │   └── orders/
│   │       ├── CreateOrderUseCase.ts
│   │       ├── ProcessOrderUseCase.ts
│   │       └── GetOrderUseCase.ts
│   ├── interfaces/                      # Port definitions
│   │   ├── repositories/
│   │   │   ├── IProductRepository.ts
│   │   │   ├── IOrderRepository.ts
│   │   │   └── ICategoryRepository.ts
│   │   ├── services/
│   │   │   ├── IPaymentService.ts
│   │   │   ├── IInventoryService.ts
│   │   │   └── INotificationService.ts
│   │   ├── IEventPublisher.ts
│   │   └── IUnitOfWork.ts
│   └── dto/
│       ├── ProductDTO.ts
│       └── OrderDTO.ts
│
├── infrastructure/                      # Infrastructure Layer
│   ├── persistence/
│   │   ├── typeorm/
│   │   │   ├── TypeOrmProductRepository.ts
│   │   │   ├── TypeOrmOrderRepository.ts
│   │   │   ├── TypeOrmUnitOfWork.ts
│   │   │   └── entities/
│   │   │       ├── ProductEntity.ts
│   │   │       └── OrderEntity.ts
│   │   └── in-memory/
│   │       ├── InMemoryProductRepository.ts
│   │       └── InMemoryOrderRepository.ts
│   ├── external/
│   │   ├── StripePaymentService.ts
│   │   ├── WarehouseInventoryService.ts
│   │   └── SendGridNotificationService.ts
│   ├── messaging/
│   │   └── RabbitMQEventPublisher.ts
│   ├── web/
│   │   ├── ExpressProductController.ts
│   │   ├── ExpressOrderController.ts
│   │   └── middleware/
│   │       ├── authMiddleware.ts
│   │       └── errorHandler.ts
│   └── config/
│       ├── database.ts
│       └── environment.ts
│
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   └── services/
│   │   └── application/
│   │       └── use-cases/
│   ├── integration/
│   │   └── infrastructure/
│   └── e2e/
│
└── main.ts                              # Composition Root
```

---

## Testing Strategy

Onion Architecture enables comprehensive testing at each layer with appropriate isolation.

### Domain Model Testing (Unit Tests)

```typescript
// tests/unit/domain/entities/Product.test.ts
describe('Product', () => {
  describe('create', () => {
    it('should create a product with valid data', () => {
      const product = Product.create(
        ProductId.create('prod-1'),
        'Widget',
        'A useful widget',
        Money.of(29.99),
        100
      );

      expect(product.getName()).toBe('Widget');
      expect(product.getPrice().getAmount()).toBe(29.99);
      expect(product.getStockQuantity()).toBe(100);
      expect(product.getStatus()).toBe(ProductStatus.DRAFT);
    });

    it('should throw error for empty name', () => {
      expect(() =>
        Product.create(
          ProductId.create('prod-1'),
          '',
          'Description',
          Money.of(29.99),
          100
        )
      ).toThrow(InvalidProductNameError);
    });

    it('should throw error for negative price', () => {
      expect(() =>
        Product.create(
          ProductId.create('prod-1'),
          'Widget',
          'Description',
          Money.of(-10),
          100
        )
      ).toThrow(InvalidPriceError);
    });
  });

  describe('publish', () => {
    it('should change status to ACTIVE', () => {
      const product = Product.create(
        ProductId.create('prod-1'),
        'Widget',
        'Description',
        Money.of(29.99),
        100
      );

      product.publish();

      expect(product.getStatus()).toBe(ProductStatus.ACTIVE);
    });

    it('should throw error if not in DRAFT status', () => {
      const product = Product.create(
        ProductId.create('prod-1'),
        'Widget',
        'Description',
        Money.of(29.99),
        100
      );
      product.publish();

      expect(() => product.publish()).toThrow(InvalidProductStateError);
    });

    it('should throw error if stock is zero', () => {
      const product = Product.create(
        ProductId.create('prod-1'),
        'Widget',
        'Description',
        Money.of(29.99),
        0
      );

      expect(() => product.publish()).toThrow(InsufficientStockError);
    });
  });

  describe('reserveStock', () => {
    it('should decrease stock quantity', () => {
      const product = Product.create(
        ProductId.create('prod-1'),
        'Widget',
        'Description',
        Money.of(29.99),
        100
      );

      product.reserveStock(30);

      expect(product.getStockQuantity()).toBe(70);
    });

    it('should throw error if insufficient stock', () => {
      const product = Product.create(
        ProductId.create('prod-1'),
        'Widget',
        'Description',
        Money.of(29.99),
        10
      );

      expect(() => product.reserveStock(20)).toThrow(InsufficientStockError);
    });
  });
});
```

### Domain Services Testing (Unit Tests)

```typescript
// tests/unit/domain/services/PricingService.test.ts
describe('PricingService', () => {
  let pricingService: PricingService;

  beforeEach(() => {
    pricingService = new PricingService();
  });

  describe('calculateDiscountedPrice', () => {
    it('should apply volume discount for large quantities', () => {
      const product = createTestProduct(Money.of(100));
      const customer = createTestCustomer(CustomerTier.BRONZE);

      const price = pricingService.calculateDiscountedPrice(
        product,
        customer,
        100
      );

      // 15% volume discount: 100 * 100 * 0.85 = 8500
      expect(price.getAmount()).toBe(8500);
    });

    it('should apply tier discount for premium customers', () => {
      const product = createTestProduct(Money.of(100));
      const customer = createTestCustomer(CustomerTier.PLATINUM);

      const price = pricingService.calculateDiscountedPrice(
        product,
        customer,
        5
      );

      // 15% tier discount: 100 * 5 * 0.85 = 425
      expect(price.getAmount()).toBe(425);
    });

    it('should apply higher discount when volume exceeds tier', () => {
      const product = createTestProduct(Money.of(100));
      const customer = createTestCustomer(CustomerTier.SILVER);

      // Silver tier = 5%, but 100 items = 15% volume discount
      const price = pricingService.calculateDiscountedPrice(
        product,
        customer,
        100
      );

      expect(price.getAmount()).toBe(8500);
    });
  });
});
```

### Application Use Case Testing (Integration with Mocks)

```typescript
// tests/unit/application/use-cases/CreateProductUseCase.test.ts
describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let productRepository: MockProductRepository;
  let categoryRepository: MockCategoryRepository;
  let eventPublisher: MockEventPublisher;

  beforeEach(() => {
    productRepository = new MockProductRepository();
    categoryRepository = new MockCategoryRepository();
    eventPublisher = new MockEventPublisher();

    useCase = new CreateProductUseCase(
      productRepository,
      categoryRepository,
      eventPublisher
    );

    // Setup test data
    categoryRepository.addCategory({
      id: 'cat-1',
      name: 'Electronics'
    });
  });

  it('should create product and publish event', async () => {
    const input: CreateProductInput = {
      name: 'Laptop',
      description: 'A powerful laptop',
      price: 999.99,
      currency: 'USD',
      initialStock: 50,
      categoryId: 'cat-1'
    };

    const output = await useCase.execute(input);

    expect(output.productId).toBeDefined();
    expect(output.name).toBe('Laptop');
    expect(output.status).toBe('DRAFT');

    // Verify product was saved
    const savedProduct = await productRepository.findById(
      ProductId.create(output.productId)
    );
    expect(savedProduct).not.toBeNull();

    // Verify event was published
    const events = eventPublisher.getPublishedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ProductCreatedEvent);
  });

  it('should throw error if category not found', async () => {
    const input: CreateProductInput = {
      name: 'Laptop',
      description: 'A powerful laptop',
      price: 999.99,
      currency: 'USD',
      initialStock: 50,
      categoryId: 'non-existent'
    };

    await expect(useCase.execute(input)).rejects.toThrow(CategoryNotFoundError);
  });

  it('should throw error for invalid price', async () => {
    const input: CreateProductInput = {
      name: 'Laptop',
      description: 'A powerful laptop',
      price: -100,
      currency: 'USD',
      initialStock: 50,
      categoryId: 'cat-1'
    };

    await expect(useCase.execute(input)).rejects.toThrow(InvalidPriceError);
  });
});
```

### Infrastructure Testing (Integration Tests)

```typescript
// tests/integration/infrastructure/TypeOrmProductRepository.test.ts
describe('TypeOrmProductRepository Integration', () => {
  let repository: TypeOrmProductRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [ProductEntity],
      synchronize: true
    });
    await dataSource.initialize();
    repository = new TypeOrmProductRepository(
      dataSource.getRepository(ProductEntity)
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.getRepository(ProductEntity).clear();
  });

  it('should save and retrieve product', async () => {
    const product = Product.create(
      ProductId.create('prod-test-1'),
      'Test Product',
      'A test product',
      Money.of(49.99),
      25
    );

    await repository.save(product);
    const retrieved = await repository.findById(product.getId());

    expect(retrieved).not.toBeNull();
    expect(retrieved!.getName()).toBe('Test Product');
    expect(retrieved!.getPrice().getAmount()).toBe(49.99);
    expect(retrieved!.getStockQuantity()).toBe(25);
  });

  it('should update existing product', async () => {
    const product = Product.create(
      ProductId.create('prod-test-1'),
      'Test Product',
      'A test product',
      Money.of(49.99),
      25
    );

    await repository.save(product);

    product.updatePrice(Money.of(59.99));
    product.addStock(10);

    await repository.save(product);
    const retrieved = await repository.findById(product.getId());

    expect(retrieved!.getPrice().getAmount()).toBe(59.99);
    expect(retrieved!.getStockQuantity()).toBe(35);
  });

  it('should return null for non-existent product', async () => {
    const result = await repository.findById(ProductId.create('non-existent'));
    expect(result).toBeNull();
  });
});
```

### End-to-End Testing

```typescript
// tests/e2e/product.e2e.test.ts
describe('Product API E2E', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('should create, publish, and retrieve product', async () => {
    // Create product
    const createResponse = await request(app)
      .post('/api/products')
      .send({
        name: 'E2E Test Product',
        description: 'Created during E2E test',
        price: 79.99,
        currency: 'USD',
        initialStock: 100,
        categoryId: 'test-category'
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.productId).toBeDefined();

    const productId = createResponse.body.data.productId;

    // Publish product
    const publishResponse = await request(app)
      .post(`/api/products/${productId}/publish`)
      .send();

    expect(publishResponse.status).toBe(200);
    expect(publishResponse.body.data.status).toBe('ACTIVE');

    // Retrieve product
    const getResponse = await request(app)
      .get(`/api/products/${productId}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.name).toBe('E2E Test Product');
    expect(getResponse.body.data.status).toBe('ACTIVE');
  });

  it('should return 404 for non-existent product', async () => {
    const response = await request(app)
      .get('/api/products/non-existent-id');

    expect(response.status).toBe(404);
  });

  it('should return 422 when publishing product with no stock', async () => {
    const createResponse = await request(app)
      .post('/api/products')
      .send({
        name: 'No Stock Product',
        description: 'Has no stock',
        price: 49.99,
        currency: 'USD',
        initialStock: 0,
        categoryId: 'test-category'
      });

    const productId = createResponse.body.data.productId;

    const publishResponse = await request(app)
      .post(`/api/products/${productId}/publish`)
      .send();

    expect(publishResponse.status).toBe(422);
  });
});
```

---

## Implementation Best Practices

### Keep Domain Model Pure

The domain model should have no dependencies on frameworks or infrastructure:

```typescript
// Good: Pure domain entity
export class Product {
  private readonly id: ProductId;
  private name: string;
  private price: Money;

  publish(): void {
    // Pure business logic
    if (this.status !== ProductStatus.DRAFT) {
      throw new InvalidProductStateError('...');
    }
    this.status = ProductStatus.ACTIVE;
  }
}

// Bad: Domain with infrastructure dependencies
export class Product {
  @Column()  // ORM decorator pollutes domain
  private name: string;

  async publish(): Promise<void> {
    await this.repository.save(this);  // Infrastructure in domain
    await this.logger.info('Published');  // Logging concern in domain
  }
}
```

### Use Value Objects for Domain Concepts

Prefer value objects over primitive types:

```typescript
// Good: Strong typing with value objects
class Order {
  constructor(
    private readonly id: OrderId,
    private readonly customerId: CustomerId,
    private total: Money,
    private shippingAddress: Address
  ) {}
}

// Bad: Primitive obsession
class Order {
  constructor(
    private readonly id: string,
    private readonly customerId: string,
    private total: number,
    private shippingAddress: string
  ) {}
}
```

### Define Interfaces in Application Layer

Interfaces for external dependencies belong in the application layer, not infrastructure:

```typescript
// application/interfaces/IProductRepository.ts (Correct)
export interface IProductRepository {
  findById(id: ProductId): Promise<Product | null>;
  save(product: Product): Promise<void>;
}

// infrastructure/IProductRepository.ts (Wrong - creates circular dependency)
```

### Handle Cross-Cutting Concerns Properly

Logging, caching, and metrics belong in infrastructure or as decorators:

```typescript
// infrastructure/persistence/CachingProductRepository.ts
export class CachingProductRepository implements IProductRepository {
  constructor(
    private readonly inner: IProductRepository,
    private readonly cache: Cache
  ) {}

  async findById(id: ProductId): Promise<Product | null> {
    const cacheKey = `product:${id.value}`;
    const cached = await this.cache.get<Product>(cacheKey);

    if (cached) {
      return cached;
    }

    const product = await this.inner.findById(id);

    if (product) {
      await this.cache.set(cacheKey, product, { ttl: 3600 });
    }

    return product;
  }

  async save(product: Product): Promise<void> {
    await this.inner.save(product);
    await this.cache.invalidate(`product:${product.getId().value}`);
  }
}
```

### Use Factory Methods for Entity Creation

Encapsulate entity creation logic in factory methods:

```typescript
export class Order {
  // Private constructor prevents invalid instantiation
  private constructor(
    private readonly id: OrderId,
    private readonly customerId: CustomerId,
    private items: OrderItem[],
    private status: OrderStatus
  ) {}

  // Factory for new orders
  static create(id: OrderId, customerId: CustomerId): Order {
    return new Order(id, customerId, [], OrderStatus.DRAFT);
  }

  // Factory for reconstituting from persistence
  static reconstitute(
    id: OrderId,
    customerId: CustomerId,
    items: OrderItem[],
    status: OrderStatus
  ): Order {
    return new Order(id, customerId, items, status);
  }
}
```

---

## Summary

Onion Architecture provides a robust pattern for building maintainable, testable software by:

1. **Placing Domain at the Center**: Business logic is isolated from infrastructure concerns
2. **Enforcing Inward Dependencies**: Outer layers depend on inner layers, never the reverse
3. **Defining Clear Layer Responsibilities**:
   - Domain Model: Entities, value objects, domain events
   - Domain Services: Cross-entity domain logic
   - Application Services: Use case orchestration
   - Infrastructure: Technical implementations
4. **Enabling Testability**: Each layer can be tested in isolation with appropriate mocking
5. **Supporting Technology Changes**: Infrastructure can be swapped without affecting business logic

The key to successful Onion Architecture implementation is discipline in maintaining layer boundaries and keeping the domain model free of external dependencies. When done correctly, it produces systems that are:

- **Maintainable**: Changes are localized to specific layers
- **Testable**: Business logic can be tested without infrastructure
- **Flexible**: Technology choices can evolve independently
- **Understandable**: Clear separation of concerns aids comprehension

---

## Further Reading

### Books

- **"Implementing Domain-Driven Design"** - Vaughn Vernon
- **"Domain-Driven Design: Tackling Complexity in the Heart of Software"** - Eric Evans
- **"Clean Architecture: A Craftsman's Guide to Software Structure and Design"** - Robert C. Martin
- **"Patterns of Enterprise Application Architecture"** - Martin Fowler

### Online Resources

- [The Onion Architecture - Jeffrey Palermo](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/)
- [Onion Architecture Part 2](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-2/)
- [Onion Architecture Part 3](https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/)
- [The Clean Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

### Related Topics

- Clean Architecture
- Hexagonal Architecture (Ports and Adapters)
- Domain-Driven Design (DDD)
- SOLID Principles
- Dependency Inversion Principle
- Repository Pattern
- CQRS (Command Query Responsibility Segregation)
