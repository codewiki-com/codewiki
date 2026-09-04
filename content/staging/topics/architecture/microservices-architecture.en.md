---
title: Microservices Architecture Complete Guide
description: Master microservices architecture for scalable distributed systems
track: architecture
section: distributed
difficulty: advanced
tags:
  - Microservices
  - Distributed
  - Architecture
  - Scalability
status: imported
origin: old/src/content/docs/architecture/microservices-architecture.en.md
divergence: 0.322
issues:
  - order-mismatch
legacy:
  category: Architecture
  subcategory: Microservices
  order: 4
  lastUpdated: 2026-01-07
---

## Introduction

Microservices architecture is an architectural style that structures an application as a collection of loosely coupled, independently deployable services. Each service runs in its own process, communicates through lightweight mechanisms (typically HTTP REST APIs or message queues), and is built around specific business capabilities.

This concept was formally introduced by Martin Fowler and James Lewis in 2014, though its roots trace back to earlier Service-Oriented Architecture (SOA) principles. The rise of microservices is closely tied to the evolution of containerization (Docker), container orchestration (Kubernetes), and DevOps culture.

## Monolith vs Microservices

Understanding the differences between monolithic and microservices architectures is fundamental to making informed architectural decisions.

### Comparison Overview

| Characteristic | Monolithic Architecture | Microservices Architecture |
|---------------|------------------------|---------------------------|
| Code Organization | All functionality in a single codebase | Split into multiple independent services by business capability |
| Deployment | Deploy as a whole; changes affect everything | Independent deployment; services don't affect each other |
| Technology Stack | Unified technology stack | Can use different stacks (technology heterogeneity) |
| Scalability | Scale entire application; low resource efficiency | Scale specific services on demand |
| Fault Isolation | Single failure can crash entire system | Faults are isolated; single service failure doesn't bring down the system |
| Team Collaboration | High coupling between teams; frequent conflicts | Team autonomy; each team owns independent services |
| Development Complexity | Simple initially; complex over time | Complex initially; better long-term maintainability |
| Operational Complexity | Relatively simple | Requires mature DevOps capabilities |

### Pain Points of Monolithic Architecture

```
+------------------------------------------+
|           Monolithic Application          |
|  +----------+----------+----------+      |
|  |   User   |  Order   | Payment  |      |
|  |  Module  |  Module  |  Module  |      |
|  +----------+----------+----------+      |
|  | Product  | Inventory| Shipping |      |
|  |  Module  |  Module  |  Module  |      |
|  +----------+----------+----------+      |
|                   |                       |
|           Shared Database                 |
+------------------------------------------+
```

**Common challenges include:**

- **High modification risk**: Any small change requires redeploying the entire application
- **Technical debt accumulation**: Codebase grows unwieldy and difficult to understand
- **Limited scalability**: Cannot scale hot modules independently
- **Technology lock-in**: Difficult to introduce new technologies
- **Team coordination difficulties**: Multiple teams working on the same codebase leads to frequent conflicts

### Core Problems Microservices Solve

1. **Organizational alignment**: Follows Conway's Law; small teams can own end-to-end services
2. **Technology evolution**: Allows gradual refactoring and technology stack upgrades
3. **Elastic scaling**: Scale high-load services on demand
4. **Fault isolation**: Prevents failure propagation
5. **Rapid iteration**: Independent deployment accelerates delivery

## Service Decomposition

Service decomposition is one of the most challenging aspects of microservices. Getting the boundaries wrong can lead to a distributed monolith that has the drawbacks of both architectures.

### Domain-Driven Design and Bounded Contexts

Domain-Driven Design (DDD) provides the gold standard for service decomposition through Bounded Contexts. Each bounded context represents an independent business domain and naturally maps to one or more microservices.

```
E-commerce Domain Bounded Contexts:

+----------------------------------------------------------------+
|                       E-commerce Domain                         |
|                                                                 |
|  +--------------+  +--------------+  +--------------+          |
|  | User Context |  |Product Context| | Order Context|          |
|  |              |  |              |  |              |          |
|  | - Registration|  | - Product CRUD|  | - Order Creation|     |
|  | - Authentication| | - Categories |  | - Order Status |      |
|  | - User Profile|  | - Inventory  |  | - Order Query  |       |
|  +--------------+  +--------------+  +--------------+          |
|                                                                 |
|  +--------------+  +--------------+  +--------------+          |
|  |Payment Context|  |Shipping Context| |Marketing Context|     |
|  |              |  |              |  |              |          |
|  | - Processing |  | - Fulfillment|  | - Coupons    |          |
|  | - Refunds    |  | - Tracking   |  | - Promotions |          |
|  | - Billing    |  | - Warehousing|  | - Loyalty    |          |
|  +--------------+  +--------------+  +--------------+          |
+----------------------------------------------------------------+
```

### Decomposition Strategies

#### Single Responsibility Principle

Each service should have only one reason to change:

```typescript
// BAD: Service with too many responsibilities
class EverythingService {
  createUser() { /* ... */ }
  processOrder() { /* ... */ }
  handlePayment() { /* ... */ }
  sendNotification() { /* ... */ }
  generateReport() { /* ... */ }
}

// GOOD: Split by responsibility
// user-service
class UserService {
  createUser() { /* ... */ }
  updateProfile() { /* ... */ }
}

// order-service
class OrderService {
  createOrder() { /* ... */ }
  cancelOrder() { /* ... */ }
}

// notification-service
class NotificationService {
  sendEmail() { /* ... */ }
  sendSMS() { /* ... */ }
}
```

#### Business Capability Decomposition

Identify core business capabilities and map each to a service:

```
Business Capability Analysis:
+-- User Management Capability --> User Service
|   +-- Registration/Login
|   +-- Profile Management
|   +-- Permission Management
+-- Product Management Capability --> Product Service
|   +-- Product CRUD
|   +-- Category Management
|   +-- Product Search
+-- Order Processing Capability --> Order Service
|   +-- Shopping Cart
|   +-- Order Placement
|   +-- Order Status
+-- Payment Capability --> Payment Service
    +-- Payment Processing
    +-- Refunds
    +-- Reconciliation
```

#### Subdomain Decomposition

Identify core, supporting, and generic domains:

- **Core Domain**: Business core competency; requires custom development
- **Supporting Domain**: Supports core business; can be outsourced or purchased
- **Generic Domain**: Generic functionality like authentication and notifications

```
+--------------------------------------------+
|              Core Domain                    |
|  +-------------+  +-------------+          |
|  |Order Service|  |Recommendation| <- Core |
|  |             |  |   Service   | Competency|
|  +-------------+  +-------------+          |
+--------------------------------------------+
|           Supporting Domain                 |
|  +-------------+  +-------------+          |
|  |Product      |  | Inventory   | <- Business|
|  | Service     |  |  Service    |   Support |
|  +-------------+  +-------------+          |
+--------------------------------------------+
|            Generic Domain                   |
|  +----------+ +----------+ +----------+    |
|  |   Auth   | |  Notify  | |   File   |    |
|  | Service  | | Service  | | Service  |    |
|  +----------+ +----------+ +----------+    |
+--------------------------------------------+
```

### Service Granularity Considerations

Services are not better when smaller. Balance is needed:

| Too Coarse | Too Fine |
|-----------|----------|
| Still has monolithic problems | High network overhead |
| Team coordination difficulties | Complex distributed transactions |
| Hard to deploy independently | High operational cost |
| Limited scalability | Difficult debugging |

**Rules of thumb:**

- A service should be fully understood and maintained by a small team (2-8 people)
- Service rewrite time should be within 2 weeks
- Avoid the "distributed monolith" anti-pattern

## Communication Patterns

Services must communicate to fulfill business requirements. Choosing the right communication pattern is critical for system reliability and performance.

### Synchronous Communication

#### REST API

The most common synchronous communication method, simple and intuitive:

```typescript
// order-service calling user-service
class OrderService {
  async createOrder(userId: string, items: OrderItem[]) {
    // Synchronous call to user service for validation
    const userResponse = await fetch(
      `http://user-service/api/users/${userId}`
    );

    if (!userResponse.ok) {
      throw new Error('User not found');
    }

    const user = await userResponse.json();

    // Create order logic
    const order = await this.orderRepository.create({
      userId: user.id,
      items,
      status: 'created'
    });

    return order;
  }
}
```

#### gRPC

High-performance RPC framework, suitable for internal service communication:

```protobuf
// user.proto
syntax = "proto3";

package user;

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc CreateUser (CreateUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
}

message GetUserRequest {
  string user_id = 1;
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
  int64 created_at = 4;
}
```

```typescript
// gRPC client call
import { UserServiceClient } from './generated/user_grpc_pb';
import { GetUserRequest } from './generated/user_pb';
import * as grpc from '@grpc/grpc-js';

const client = new UserServiceClient(
  'user-service:50051',
  grpc.credentials.createInsecure()
);

async function getUser(userId: string): Promise<User> {
  return new Promise((resolve, reject) => {
    const request = new GetUserRequest();
    request.setUserId(userId);

    client.getUser(request, (error, response) => {
      if (error) reject(error);
      else resolve(response.toObject());
    });
  });
}
```

### Asynchronous Communication

#### Message Queues

Use message queues for service decoupling:

```typescript
// Order service publishing events
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['kafka:9092']
});

const producer = kafka.producer();

class OrderService {
  async createOrder(orderData: CreateOrderDTO) {
    // 1. Create order
    const order = await this.orderRepository.create(orderData);

    // 2. Publish order created event
    await producer.send({
      topic: 'order-events',
      messages: [{
        key: order.id,
        value: JSON.stringify({
          type: 'ORDER_CREATED',
          payload: {
            orderId: order.id,
            userId: order.userId,
            items: order.items,
            totalAmount: order.totalAmount,
            timestamp: new Date().toISOString()
          }
        })
      }]
    });

    return order;
  }
}

// Inventory service consuming events
const consumer = kafka.consumer({ groupId: 'inventory-service' });

await consumer.subscribe({ topic: 'order-events' });

await consumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value.toString());

    if (event.type === 'ORDER_CREATED') {
      // Reserve inventory
      await inventoryService.reserveStock(event.payload.items);
    }
  }
});
```

#### Event-Driven Architecture

```
Order Creation Flow (Event-Driven):

+-----------+     ORDER_CREATED     +-----------+
|  Order    | --------------------> | Message   |
|  Service  |                       |    Bus    |
+-----------+                       +-----------+
                                          |
         +----------------+---------------+---------------+
         v                v               v               v
   +-----------+   +-----------+   +-----------+   +-----------+
   | Inventory |   |  Payment  |   |  Notify   |   |   Log     |
   |  Service  |   |  Service  |   |  Service  |   |  Service  |
   |  Reserve  |   |  Process  |   |   Send    |   |   Record  |
   +-----------+   +-----------+   +-----------+   +-----------+
```

### Communication Pattern Comparison

| Feature | Synchronous (REST/gRPC) | Asynchronous (Message Queue) |
|---------|------------------------|----------------------------|
| Coupling | Higher (needs target address) | Low (decoupled via message broker) |
| Real-time | Immediate response | Has latency |
| Reliability | Network dependent | Message persistence guarantees |
| Complexity | Simple | Requires idempotency handling |
| Use Case | Operations requiring immediate response | Operations that can be processed asynchronously |

## Data Management

### Database per Service

This is the core principle of microservices data management: each service owns its private database, and other services cannot access it directly.

```
+---------------+     +---------------+     +---------------+
|  User Service |     | Order Service |     |Product Service|
+-------+-------+     +-------+-------+     +-------+-------+
        |                     |                     |
        v                     v                     v
+---------------+     +---------------+     +---------------+
| User Database |     | Order Database|     |Product Database|
|  (PostgreSQL) |     |   (MongoDB)   |     |    (MySQL)    |
+---------------+     +---------------+     +---------------+
```

### Eventual Consistency with Outbox Pattern

```typescript
// Order service - using events for eventual consistency
class OrderService {
  async createOrder(orderData: CreateOrderDTO) {
    // 1. Create order and outbox message in same local transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          ...orderData,
          status: 'PENDING'
        }
      });

      // Write event to outbox table (same transaction)
      await tx.outbox.create({
        data: {
          aggregateType: 'Order',
          aggregateId: order.id,
          eventType: 'OrderCreated',
          payload: JSON.stringify(order),
          createdAt: new Date()
        }
      });

      return order;
    });

    return result;
  }
}

// Outbox processor - ensures reliable message delivery
class OutboxProcessor {
  async processOutbox() {
    const messages = await this.prisma.outbox.findMany({
      where: { processedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    for (const message of messages) {
      try {
        // Send to message queue
        await this.kafka.send({
          topic: `${message.aggregateType.toLowerCase()}-events`,
          messages: [{
            key: message.aggregateId,
            value: JSON.stringify({
              type: message.eventType,
              payload: JSON.parse(message.payload)
            })
          }]
        });

        // Mark as processed
        await this.prisma.outbox.update({
          where: { id: message.id },
          data: { processedAt: new Date() }
        });
      } catch (error) {
        console.error('Failed to process outbox message:', error);
      }
    }
  }
}
```

### CQRS Pattern

Command Query Responsibility Segregation separates read and write operations:

```typescript
// Write model - handles commands
class OrderCommandHandler {
  async handle(command: CreateOrderCommand) {
    const order = Order.create(command);
    await this.orderRepository.save(order);

    // Publish domain event
    await this.eventBus.publish(new OrderCreatedEvent(order));
  }
}

// Read model - handles queries
class OrderQueryHandler {
  async getOrderSummary(orderId: string): Promise<OrderSummaryDTO> {
    // Read from query-optimized data store
    return this.readDatabase.query(`
      SELECT o.id, o.status, o.total_amount,
             u.name as customer_name,
             GROUP_CONCAT(p.name) as product_names
      FROM order_view o
      JOIN user_view u ON o.user_id = u.id
      JOIN order_item_view oi ON o.id = oi.order_id
      JOIN product_view p ON oi.product_id = p.id
      WHERE o.id = ?
      GROUP BY o.id
    `, [orderId]);
  }
}

// Event handler - synchronizes read model
class OrderEventHandler {
  @EventHandler(OrderCreatedEvent)
  async onOrderCreated(event: OrderCreatedEvent) {
    // Update read database
    await this.readDatabase.execute(`
      INSERT INTO order_view (id, user_id, status, total_amount, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [event.orderId, event.userId, event.status, event.totalAmount, event.createdAt]);
  }
}
```

### Saga Pattern for Distributed Transactions

Saga manages cross-service transactions through a series of local transactions and compensating actions.

#### Choreography-based Saga

Services coordinate through events without a central coordinator:

```typescript
// Inventory service - choreography saga participant
class InventoryService {
  @EventHandler('OrderCreated')
  async handleOrderCreated(event: OrderCreatedEvent) {
    try {
      // Reserve inventory
      await this.reserveStock(event.items);

      // Publish success event
      await this.eventBus.publish({
        type: 'StockReserved',
        orderId: event.orderId,
        items: event.items
      });
    } catch (error) {
      // Publish failure event
      await this.eventBus.publish({
        type: 'StockReserveFailed',
        orderId: event.orderId,
        reason: error.message
      });
    }
  }

  @EventHandler('PaymentFailed')
  async handlePaymentFailed(event: PaymentFailedEvent) {
    // Compensation: release reserved inventory
    await this.releaseStock(event.orderId);
  }
}
```

#### Orchestration-based Saga

A central coordinator controls the entire transaction flow:

```typescript
// Saga orchestrator
class CreateOrderSaga {
  private steps: SagaStep[] = [
    {
      action: this.createOrder.bind(this),
      compensation: this.cancelOrder.bind(this)
    },
    {
      action: this.reserveStock.bind(this),
      compensation: this.releaseStock.bind(this)
    },
    {
      action: this.processPayment.bind(this),
      compensation: this.refundPayment.bind(this)
    },
    {
      action: this.confirmOrder.bind(this),
      compensation: null // Last step needs no compensation
    }
  ];

  async execute(orderData: CreateOrderDTO) {
    const context: SagaContext = {
      orderId: null,
      stockReservationId: null,
      paymentId: null
    };

    const completedSteps: number[] = [];

    for (let i = 0; i < this.steps.length; i++) {
      try {
        await this.steps[i].action(orderData, context);
        completedSteps.push(i);

        // Record saga state
        await this.saveSagaState(context.orderId, i, 'COMPLETED');
      } catch (error) {
        console.error(`Step ${i} failed:`, error);

        // Execute compensations in reverse order
        await this.compensate(completedSteps.reverse(), orderData, context);

        throw new SagaFailedException(error.message);
      }
    }

    return context;
  }

  private async compensate(
    steps: number[],
    orderData: CreateOrderDTO,
    context: SagaContext
  ) {
    for (const stepIndex of steps) {
      const compensation = this.steps[stepIndex].compensation;
      if (compensation) {
        try {
          await compensation(orderData, context);
          await this.saveSagaState(context.orderId, stepIndex, 'COMPENSATED');
        } catch (error) {
          console.error(`Compensation for step ${stepIndex} failed:`, error);
          // Log compensation failure for manual intervention
          await this.alertOps(context.orderId, stepIndex, error);
        }
      }
    }
  }

  private async createOrder(data: CreateOrderDTO, ctx: SagaContext) {
    const order = await this.orderService.create(data);
    ctx.orderId = order.id;
  }

  private async cancelOrder(data: CreateOrderDTO, ctx: SagaContext) {
    await this.orderService.cancel(ctx.orderId);
  }

  private async reserveStock(data: CreateOrderDTO, ctx: SagaContext) {
    const reservation = await this.inventoryService.reserve(ctx.orderId, data.items);
    ctx.stockReservationId = reservation.id;
  }

  private async releaseStock(data: CreateOrderDTO, ctx: SagaContext) {
    await this.inventoryService.release(ctx.stockReservationId);
  }

  private async processPayment(data: CreateOrderDTO, ctx: SagaContext) {
    const payment = await this.paymentService.process(ctx.orderId, data.amount);
    ctx.paymentId = payment.id;
  }

  private async refundPayment(data: CreateOrderDTO, ctx: SagaContext) {
    await this.paymentService.refund(ctx.paymentId);
  }

  private async confirmOrder(data: CreateOrderDTO, ctx: SagaContext) {
    await this.orderService.confirm(ctx.orderId);
  }
}
```

## Service Discovery

In dynamic microservices environments, service instances are frequently created and destroyed. Service discovery mechanisms allow services to find each other.

### Client-Side Discovery

The client queries the service registry to get available instances and performs load balancing:

```typescript
// Client-side service discovery using Consul
import Consul from 'consul';

class ServiceDiscovery {
  private consul: Consul.Consul;
  private serviceCache: Map<string, ServiceInstance[]> = new Map();

  constructor() {
    this.consul = new Consul({
      host: process.env.CONSUL_HOST || 'localhost',
      port: process.env.CONSUL_PORT || '8500'
    });
  }

  // Service registration
  async register(serviceName: string, port: number) {
    const serviceId = `${serviceName}-${process.env.HOSTNAME}`;

    await this.consul.agent.service.register({
      id: serviceId,
      name: serviceName,
      address: process.env.HOSTNAME,
      port,
      check: {
        http: `http://${process.env.HOSTNAME}:${port}/health`,
        interval: '10s',
        timeout: '5s',
        deregistercriticalserviceafter: '1m'
      }
    });

    console.log(`Service ${serviceName} registered with ID ${serviceId}`);
  }

  // Service discovery
  async discover(serviceName: string): Promise<ServiceInstance[]> {
    const result = await this.consul.health.service({
      service: serviceName,
      passing: true
    });

    const instances = result.map((entry: any) => ({
      id: entry.Service.ID,
      address: entry.Service.Address,
      port: entry.Service.Port
    }));

    this.serviceCache.set(serviceName, instances);
    return instances;
  }

  // Load balancing (round-robin)
  private roundRobinIndex: Map<string, number> = new Map();

  async getServiceUrl(serviceName: string): Promise<string> {
    let instances = this.serviceCache.get(serviceName);

    if (!instances || instances.length === 0) {
      instances = await this.discover(serviceName);
    }

    if (instances.length === 0) {
      throw new Error(`No healthy instances for service: ${serviceName}`);
    }

    // Round-robin instance selection
    const currentIndex = this.roundRobinIndex.get(serviceName) || 0;
    const instance = instances[currentIndex % instances.length];
    this.roundRobinIndex.set(serviceName, currentIndex + 1);

    return `http://${instance.address}:${instance.port}`;
  }
}
```

### Server-Side Discovery

Using a load balancer (like Kubernetes Service) for service discovery:

```yaml
# Kubernetes Service definition
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
    - port: 80
      targetPort: 3001
  type: ClusterIP

---
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
        - name: user-service
          image: myregistry/user-service:latest
          ports:
            - containerPort: 3001
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 5
          readinessProbe:
            httpGet:
              path: /ready
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 3
```

```typescript
// In Kubernetes, use service name directly
const userServiceUrl = 'http://user-service';
const response = await fetch(`${userServiceUrl}/api/users/123`);
```

## API Gateway

The API Gateway is a critical component in microservices architecture, serving as the single entry point for all client requests.

### Core Functions

```
                        +--------------------------------------+
                        |            API Gateway               |
                        |                                      |
Client Request -------> |  +--------------------------------+  |
                        |  | Authentication (JWT/OAuth)     |  |
                        |  +--------------------------------+  |
                        |  | Request Routing                |  |
                        |  +--------------------------------+  |
                        |  | Load Balancing                 |  |
                        |  +--------------------------------+  |
                        |  | Rate Limiting & Circuit Breaking| |
                        |  +--------------------------------+  |
                        |  | Request/Response Transformation|  |
                        |  +--------------------------------+  |
                        |  | Logging & Monitoring           |  |
                        |  +--------------------------------+  |
                        +---------------+----------------------+
                                        |
          +----------------+------------+------------+----------------+
          v                v                         v                v
    +-----------+   +-----------+             +-----------+   +-----------+
    |   User    |   |   Order   |             |  Product  |   |  Payment  |
    |  Service  |   |  Service  |             |  Service  |   |  Service  |
    +-----------+   +-----------+             +-----------+   +-----------+
```

### Implementation Example

```typescript
// Simplified API Gateway implementation
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

const app = express();

// 1. Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per IP
  message: 'Too many requests'
});
app.use(limiter);

// 2. Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// 3. Route configuration
const services = {
  '/api/users': 'http://user-service:3001',
  '/api/orders': 'http://order-service:3002',
  '/api/products': 'http://product-service:3003',
  '/api/payments': 'http://payment-service:3004'
};

// 4. Setup proxies
Object.entries(services).forEach(([path, target]) => {
  app.use(
    path,
    authMiddleware,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^${path}`]: '' },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(503).json({ error: 'Service temporarily unavailable' });
      }
    })
  );
});

// 5. Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(8080, () => {
  console.log('API Gateway running on port 8080');
});
```

### Backend for Frontend (BFF) Pattern

Provide customized API gateways for different clients:

```
+-----------+  +-----------+  +-----------+
|    Web    |  |    iOS    |  |  Android  |
+-----+-----+  +-----+-----+  +-----+-----+
      |              |              |
      v              v              v
+-----------+  +-----------+  +-----------+
|  Web BFF  |  |  iOS BFF  |  |Android BFF|
+-----+-----+  +-----+-----+  +-----+-----+
      |              |              |
      +--------------+--------------+
                     v
            +---------------+
            | Microservices |
            |    Cluster    |
            +---------------+
```

## Observability

Observability is essential for operating microservices effectively in production.

### Distributed Tracing

Using OpenTelemetry for cross-service tracing:

```typescript
// tracing.ts - OpenTelemetry configuration
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME,
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION,
  }),
  traceExporter: new JaegerExporter({
    endpoint: 'http://jaeger:14268/api/traces',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        requestHook: (span, request) => {
          span.setAttribute('http.request.header.x-request-id',
            request.headers['x-request-id']);
        },
      },
      '@opentelemetry/instrumentation-express': {},
    }),
  ],
});

sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

```typescript
// Manual span creation
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service');

class OrderService {
  async createOrder(orderData: CreateOrderDTO) {
    return tracer.startActiveSpan('createOrder', async (span) => {
      try {
        span.setAttribute('order.user_id', orderData.userId);
        span.setAttribute('order.items_count', orderData.items.length);

        // Validate user
        const user = await tracer.startActiveSpan('validateUser', async (userSpan) => {
          const result = await this.userClient.getUser(orderData.userId);
          userSpan.end();
          return result;
        });

        // Check inventory
        await tracer.startActiveSpan('checkInventory', async (invSpan) => {
          await this.inventoryClient.checkStock(orderData.items);
          invSpan.end();
        });

        // Create order
        const order = await this.orderRepository.create(orderData);
        span.setAttribute('order.id', order.id);

        span.setStatus({ code: SpanStatusCode.OK });
        return order;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message
        });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
```

### Structured Logging

```typescript
// logger.ts - Structured logging
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: process.env.SERVICE_NAME,
    version: process.env.SERVICE_VERSION,
    environment: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Usage examples
logger.info({
  event: 'order_created',
  orderId: order.id,
  userId: order.userId,
  totalAmount: order.totalAmount,
  itemCount: order.items.length,
}, 'Order created successfully');

logger.error({
  event: 'payment_failed',
  orderId: order.id,
  errorCode: error.code,
  errorMessage: error.message,
}, 'Payment processing failed');
```

### Metrics and Health Checks

```typescript
// metrics.ts - Prometheus metrics
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

// HTTP request counter
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

// Request latency histogram
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Business metrics
const ordersCreated = new Counter({
  name: 'orders_created_total',
  help: 'Total number of orders created',
  labelNames: ['status'],
  registers: [register],
});

const activeConnections = new Gauge({
  name: 'active_database_connections',
  help: 'Number of active database connections',
  registers: [register],
});

// Express middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestsTotal.inc({
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode,
    });

    httpRequestDuration.observe({
      method: req.method,
      path: req.route?.path || req.path,
    }, duration);
  });

  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Readiness check endpoint
app.get('/ready', async (req, res) => {
  try {
    // Check dependent services
    await Promise.all([
      database.ping(),
      redis.ping(),
      kafka.admin().listTopics(),
    ]);
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});
```

## Deployment Strategies

### CI/CD Pipeline

```yaml
# .github/workflows/user-service.yml
name: User Service CI/CD

on:
  push:
    paths:
      - 'services/user-service/**'
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Tests
        run: |
          cd services/user-service
          npm ci
          npm test

      - name: Build Docker Image
        run: |
          docker build -t user-service:${{ github.sha }} ./services/user-service

      - name: Push to Registry
        run: |
          docker push myregistry/user-service:${{ github.sha }}

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/user-service \
            user-service=myregistry/user-service:${{ github.sha }}
```

### Fault Tolerance with Circuit Breaker

```typescript
// Using circuit breaker pattern for fault tolerance
import CircuitBreaker from 'opossum';

class OrderService {
  private paymentServiceBreaker: CircuitBreaker;

  constructor() {
    // Configure circuit breaker
    this.paymentServiceBreaker = new CircuitBreaker(
      this.callPaymentService.bind(this),
      {
        timeout: 3000,                    // Timeout duration
        errorThresholdPercentage: 50,     // Error rate threshold
        resetTimeout: 30000               // Circuit reset time
      }
    );

    // Fallback when circuit is open
    this.paymentServiceBreaker.fallback(() => {
      return { status: 'pending', message: 'Payment service temporarily unavailable, order is pending' };
    });
  }

  async processPayment(orderId: string, amount: number) {
    return this.paymentServiceBreaker.fire(orderId, amount);
  }

  private async callPaymentService(orderId: string, amount: number) {
    const response = await fetch('http://payment-service/api/pay', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount }),
    });
    return response.json();
  }
}
```

### Common Anti-Patterns to Avoid

#### Distributed Monolith

**Problem**: Services are deployed separately but highly coupled, requiring simultaneous deployment.

```typescript
// BAD: Sharing database between services
// order-service directly accessing user table
const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

// GOOD: API call
const user = await userServiceClient.getUser(userId);
```

#### Over-decomposition

**Problem**: Service granularity too fine, causing high network overhead and operational complexity.

```typescript
// BAD: Creating service for each entity
// address-service, phone-service, email-service...

// GOOD: Reasonable aggregation by business capability
// user-profile-service (includes address, phone, email, etc.)
```

#### Synchronous Chain Calls

**Problem**: Service A calls B, B calls C... forming long chains where any failure breaks everything.

```typescript
// BAD: Long synchronous call chain
async function processOrder(orderId: string) {
  const order = await orderService.getOrder(orderId);        // Call 1
  const user = await userService.getUser(order.userId);      // Call 2
  const inventory = await inventoryService.check(order);     // Call 3
  const payment = await paymentService.process(order);       // Call 4
  const shipping = await shippingService.create(order);      // Call 5
  const notification = await notifyService.send(order);      // Call 6
  return { order, user, payment, shipping };
}

// GOOD: Use asynchronous events
async function processOrder(orderId: string) {
  const order = await orderService.createOrder(orderId);
  await eventBus.publish('OrderCreated', order);
  return order;
}
// Other services subscribe to events and process in parallel
```

#### Ignoring Network Unreliability

**Problem**: Not handling network timeouts, retries, or circuit breaking.

```typescript
// BAD: Assuming network is always reliable
const user = await fetch(`http://user-service/users/${id}`);

// GOOD: Handle network failures
import retry from 'async-retry';

const user = await retry(
  async (bail) => {
    const res = await fetch(`http://user-service/users/${id}`, {
      timeout: 3000,
    });

    if (res.status === 404) {
      bail(new Error('User not found'));
      return;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
  },
  {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 5000,
  }
);
```

#### Lack of Idempotency Design

**Problem**: Duplicate requests cause data inconsistency.

```typescript
// BAD: Non-idempotent operation
app.post('/api/orders', async (req, res) => {
  const order = await orderService.create(req.body);
  res.json(order);
});

// GOOD: Idempotent design
app.post('/api/orders', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];

  // Check if already processed
  const existing = await cache.get(`order:${idempotencyKey}`);
  if (existing) {
    return res.json(JSON.parse(existing));
  }

  const order = await orderService.create(req.body);

  // Cache result
  await cache.set(`order:${idempotencyKey}`, JSON.stringify(order), 'EX', 86400);

  res.json(order);
});
```

## Interview Key Points

### Common Interview Questions

#### What is microservices architecture? How does it differ from monolithic architecture?

**Key points:**
- Microservices splits applications into small independent services
- Each service is independently developed, deployed, and scaled
- Services communicate via APIs
- Comparison with monolith: independent vs. whole deployment, technology heterogeneity vs. unified stack, team autonomy vs. team coupling

#### How do you determine service boundaries?

**Key points:**
- Based on DDD bounded contexts
- Decompose by business capability
- Single responsibility principle
- Team size (2-pizza team)
- Change frequency and independence

#### How do microservices communicate?

**Key points:**
- **Synchronous**: REST API, gRPC
- **Asynchronous**: Message queues (Kafka, RabbitMQ)
- Selection criteria: real-time requirements, coupling degree, reliability needs

#### How do you handle distributed transactions?

**Key points:**
- Avoid distributed transactions; use eventual consistency
- Saga pattern (choreography/orchestration)
- Outbox pattern
- Compensating transactions

#### What is service discovery? How is it implemented?

**Key points:**
- Dynamically locating service instances
- Client-side discovery (Consul, Eureka)
- Server-side discovery (Kubernetes Service, load balancer)

#### How do you ensure microservice reliability?

**Key points:**
- Circuit breaker pattern
- Retry mechanism (exponential backoff)
- Timeout control
- Rate limiting
- Degradation strategy

#### How do you monitor and debug microservices?

**Key points:**
- Centralized logging (ELK Stack)
- Distributed tracing (Jaeger, Zipkin, OpenTelemetry)
- Metrics monitoring (Prometheus + Grafana)
- Health checks

#### When should you NOT use microservices?

**Key points:**
- Small team, insufficient experience
- Unclear business domain
- High operational requirements
- Startup projects with frequently changing requirements
- Monolith can meet current needs

### System Design Example

**Question**: Design an e-commerce order system

**Reference answer framework:**

1. **Requirements analysis**: Order placement, payment, inventory, shipping

2. **Service decomposition**:
   - Order Service
   - Inventory Service
   - Payment Service
   - Shipping Service
   - Notification Service

3. **Data design**: Each service has independent database

4. **Key process**: Order creation Saga

5. **Technology selection**:
   - API Gateway: Kong/Nginx
   - Service Discovery: Kubernetes Service
   - Message Queue: Kafka
   - Cache: Redis
   - Monitoring: Prometheus + Grafana + Jaeger

6. **Reliability design**: Circuit breaker, retry, idempotency, degradation

## Further Reading

### Classic Books

1. **"Building Microservices"** - Sam Newman
   - Essential reading for microservices beginners; comprehensive coverage of all aspects

2. **"Domain-Driven Design"** - Eric Evans
   - DDD classic; foundation for understanding bounded contexts and service decomposition

3. **"Implementing Domain-Driven Design"** - Vaughn Vernon
   - DDD practical guide with more code examples

4. **"Microservices Patterns"** - Chris Richardson
   - 44 microservices design patterns; highly practical

5. **"Release It!"** - Michael T. Nygard
   - Distributed system reliability design

### Official Documentation and Resources

- [Martin Fowler - Microservices](https://martinfowler.com/articles/microservices.html) - Authoritative definition of microservices concepts
- [Microsoft - Microservices Architecture](https://docs.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices) - Microsoft cloud architecture guide
- [Kubernetes Documentation](https://kubernetes.io/docs/) - Container orchestration platform
- [OpenTelemetry](https://opentelemetry.io/docs/) - Observability framework
- [Chris Richardson's Microservices.io](https://microservices.io/) - Comprehensive microservices patterns

### Quality Articles

- [The Twelve-Factor App](https://12factor.net/) - Cloud-native application development methodology
- [Netflix Tech Blog](https://netflixtechblog.com/) - Netflix microservices practices
- [Uber Engineering Blog](https://eng.uber.com/) - Uber engineering practices
- [AWS Microservices Whitepaper](https://docs.aws.amazon.com/whitepapers/latest/microservices-on-aws/microservices-on-aws.html) - AWS microservices whitepaper

### Open Source Project References

- [eShopOnContainers](https://github.com/dotnet-architecture/eShopOnContainers) - Microsoft's microservices sample project
- [Sock Shop](https://github.com/microservices-demo/microservices-demo) - Classic microservices demo project
- [Spring Cloud](https://spring.io/projects/spring-cloud) - Java microservices framework
- [Dapr](https://dapr.io/) - Distributed Application Runtime
