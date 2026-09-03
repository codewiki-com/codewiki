---
title: API Composition Pattern
description: A comprehensive guide to the API Composition Pattern for aggregating data from multiple microservices
track: architecture
section: design-patterns
difficulty: intermediate
tags:
  - API Composition
  - Microservices
  - Data Aggregation
  - API Gateway
  - BFF
  - Query Patterns
status: imported
origin: old/src/content/docs/architecture/api-composition.en.md
divergence: 0.22
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Architecture
  subcategory: ""
  order: 3
  lastUpdated: 2026-01-21
---

The API Composition pattern is a fundamental technique in microservices architecture for implementing queries that need to retrieve data from multiple services. When data ownership is distributed across services, this pattern provides a way to aggregate information while maintaining service autonomy. This article explores implementation strategies, trade-offs, and best practices for effective API composition.

## Concept Explanation

### What is API Composition?

**API Composition** is a pattern where an API composer (aggregator) invokes multiple microservices and combines their results into a single response. This is essential in microservices architectures where data that was once in a single database is now distributed across multiple services.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Request                           │
│              "Get order details with customer and items"         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Composer                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Composition Logic                       │ │
│  │  1. Parse request                                          │ │
│  │  2. Call Order Service → Get order                         │ │
│  │  3. Call Customer Service → Get customer details           │ │
│  │  4. Call Inventory Service → Get item details              │ │
│  │  5. Merge results                                          │ │
│  │  6. Return aggregated response                             │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │           │           │
         ┌──────────┘           │           └──────────┐
         ▼                      ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Order Service  │  │Customer Service │  │Inventory Service│
│                 │  │                 │  │                 │
│  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │
│  │  Orders   │  │  │  │ Customers │  │  │  │   Items   │  │
│  │    DB     │  │  │  │    DB     │  │  │  │    DB     │  │
│  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### The Problem It Solves

In a monolithic application, complex queries joining multiple tables are straightforward:

```sql
-- Monolithic: Simple join query
SELECT
  o.id, o.total, o.status,
  c.name, c.email,
  i.name as item_name, i.quantity
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN order_items oi ON o.id = oi.order_id
JOIN items i ON oi.item_id = i.id
WHERE o.id = 12345;
```

In microservices, this data is split across services:

```
Problem: Data is distributed
├── Order Service owns: orders, order_items
├── Customer Service owns: customers
└── Inventory Service owns: items

Challenge: How to get a complete order view?
```

### Composer Location Options

The API composer can be implemented in different locations:

| Location | Description | Best For |
|----------|-------------|----------|
| API Gateway | Gateway handles composition | Simple aggregations, caching |
| BFF (Backend for Frontend) | Frontend-specific aggregator | UI-specific data needs |
| Dedicated Service | Standalone composition service | Complex business logic |
| Client-Side | Client makes multiple calls | Simple UIs, offline-capable apps |
| GraphQL Layer | GraphQL resolvers compose | Flexible client queries |

```
┌─────────────────────────────────────────────────────────────────┐
│                      Composer Locations                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────────┐ │
│  │ Client  │───▶│   BFF   │───▶│ Gateway │───▶│  Services   │ │
│  │ (Web)   │    │  (Web)  │    │         │    │             │ │
│  └─────────┘    └─────────┘    └─────────┘    └─────────────┘ │
│                                                                  │
│  ┌─────────┐    ┌─────────┐                                    │
│  │ Client  │───▶│   BFF   │───────────────────────────────────▶│
│  │(Mobile) │    │(Mobile) │                                    │
│  └─────────┘    └─────────┘                                    │
│                                                                  │
│  ┌─────────┐    ┌─────────┐                                    │
│  │ Client  │───▶│ GraphQL │───────────────────────────────────▶│
│  │  (Any)  │    │  Layer  │                                    │
│  └─────────┘    └─────────┘                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Principles

### Principle 1: Parallel Execution

Minimize latency by executing independent service calls in parallel:

```typescript
// Sequential execution (slow)
async function getOrderDetailsSequential(orderId: string): Promise<OrderDetails> {
  const order = await orderService.getOrder(orderId);        // 100ms
  const customer = await customerService.getCustomer(order.customerId); // 100ms
  const items = await inventoryService.getItems(order.itemIds);  // 100ms
  // Total: ~300ms

  return { order, customer, items };
}

// Parallel execution (fast)
async function getOrderDetailsParallel(orderId: string): Promise<OrderDetails> {
  const order = await orderService.getOrder(orderId);  // 100ms

  // These can run in parallel since they're independent
  const [customer, items] = await Promise.all([
    customerService.getCustomer(order.customerId),  // 100ms
    inventoryService.getItems(order.itemIds)        // 100ms
  ]);
  // Total: ~200ms (order + max(customer, items))

  return { order, customer, items };
}
```

### Principle 2: Graceful Degradation

Handle partial failures gracefully:

```typescript
interface CompositionResult<T> {
  data: Partial<T>;
  errors: ServiceError[];
  completeness: number; // 0-100%
}

async function getOrderWithDegradation(orderId: string): Promise<CompositionResult<OrderDetails>> {
  const errors: ServiceError[] = [];
  let completeness = 0;

  // Core data - required
  let order: Order;
  try {
    order = await orderService.getOrder(orderId);
    completeness += 40;
  } catch (error) {
    // Order is required, rethrow
    throw new Error(`Cannot compose: Order service unavailable`);
  }

  // Customer data - optional enrichment
  let customer: Customer | null = null;
  try {
    customer = await customerService.getCustomer(order.customerId);
    completeness += 30;
  } catch (error) {
    errors.push({
      service: 'customer',
      error: error.message,
      fallback: 'Customer details unavailable'
    });
    customer = { id: order.customerId, name: 'Unknown', email: null };
  }

  // Item data - optional enrichment
  let items: Item[] = [];
  try {
    items = await inventoryService.getItems(order.itemIds);
    completeness += 30;
  } catch (error) {
    errors.push({
      service: 'inventory',
      error: error.message,
      fallback: 'Item details unavailable'
    });
    // Return minimal item info from order
    items = order.itemIds.map(id => ({ id, name: 'Unknown', details: null }));
  }

  return {
    data: { order, customer, items },
    errors,
    completeness
  };
}
```

### Principle 3: Efficient Data Transfer

Minimize data transfer between services:

```typescript
// Anti-pattern: Fetching full entities
async function inefficientComposition(orderIds: string[]): Promise<OrderSummary[]> {
  // Fetches ALL order fields for ALL orders
  const orders = await Promise.all(
    orderIds.map(id => orderService.getOrder(id))  // Returns full order entity
  );

  // Then fetches ALL customer fields
  const customers = await Promise.all(
    orders.map(o => customerService.getCustomer(o.customerId))  // Returns full customer
  );

  // Only uses name and total!
  return orders.map((order, i) => ({
    orderId: order.id,
    customerName: customers[i].name,
    total: order.total
  }));
}

// Better: Request only needed fields
async function efficientComposition(orderIds: string[]): Promise<OrderSummary[]> {
  // Batch request with field selection
  const orders = await orderService.getOrders(orderIds, {
    fields: ['id', 'customerId', 'total']
  });

  const customerIds = [...new Set(orders.map(o => o.customerId))];
  const customers = await customerService.getCustomers(customerIds, {
    fields: ['id', 'name']
  });

  const customerMap = new Map(customers.map(c => [c.id, c]));

  return orders.map(order => ({
    orderId: order.id,
    customerName: customerMap.get(order.customerId)?.name,
    total: order.total
  }));
}
```

### Principle 4: Consistent Response Structure

Provide a consistent response structure regardless of partial failures:

```typescript
interface ComposedResponse<T> {
  data: T;
  meta: {
    composedAt: string;
    latency: number;
    sources: SourceInfo[];
  };
  warnings?: Warning[];
}

interface SourceInfo {
  service: string;
  status: 'success' | 'partial' | 'failed';
  latency: number;
  cached: boolean;
}

class APIComposer {
  async compose<T>(
    composition: CompositionDefinition<T>
  ): Promise<ComposedResponse<T>> {
    const startTime = Date.now();
    const sources: SourceInfo[] = [];

    // Execute all service calls
    const results = await Promise.allSettled(
      composition.sources.map(async (source) => {
        const sourceStart = Date.now();
        try {
          const data = await source.fetch();
          sources.push({
            service: source.name,
            status: 'success',
            latency: Date.now() - sourceStart,
            cached: false
          });
          return { name: source.name, data };
        } catch (error) {
          sources.push({
            service: source.name,
            status: 'failed',
            latency: Date.now() - sourceStart,
            cached: false
          });
          throw error;
        }
      })
    );

    // Merge results
    const data = composition.merge(results);

    return {
      data,
      meta: {
        composedAt: new Date().toISOString(),
        latency: Date.now() - startTime,
        sources
      },
      warnings: this.extractWarnings(results)
    };
  }
}
```

## Core Concepts

### Composition Strategies

Different strategies for composing API responses:

```typescript
// Strategy 1: Simple Merge
// Best for: Independent data that can be combined simply
interface SimpleMergeStrategy {
  type: 'simple-merge';
  services: ServiceCall[];
  merge: (results: any[]) => any;
}

// Strategy 2: Waterfall (Sequential Dependencies)
// Best for: When one call depends on another's result
interface WaterfallStrategy {
  type: 'waterfall';
  steps: WaterfallStep[];
}

interface WaterfallStep {
  service: string;
  call: (previousResults: Map<string, any>) => Promise<any>;
  required: boolean;
}

// Strategy 3: Scatter-Gather
// Best for: Aggregating same type of data from multiple sources
interface ScatterGatherStrategy {
  type: 'scatter-gather';
  targets: ServiceCall[];
  gather: (results: any[]) => any;
  timeout: number;
}

// Strategy 4: Hierarchical
// Best for: Nested data structures
interface HierarchicalStrategy {
  type: 'hierarchical';
  root: ServiceCall;
  children: Map<string, (parent: any) => ServiceCall[]>;
}

// Implementation examples
class CompositionEngine {
  async executeSimpleMerge(strategy: SimpleMergeStrategy): Promise<any> {
    const results = await Promise.all(
      strategy.services.map(s => s.execute())
    );
    return strategy.merge(results);
  }

  async executeWaterfall(strategy: WaterfallStrategy): Promise<any> {
    const results = new Map<string, any>();

    for (const step of strategy.steps) {
      try {
        const result = await step.call(results);
        results.set(step.service, result);
      } catch (error) {
        if (step.required) throw error;
        results.set(step.service, null);
      }
    }

    return Object.fromEntries(results);
  }

  async executeScatterGather(strategy: ScatterGatherStrategy): Promise<any> {
    const results = await Promise.race([
      Promise.allSettled(strategy.targets.map(t => t.execute())),
      this.timeout(strategy.timeout)
    ]);

    return strategy.gather(
      results.filter(r => r.status === 'fulfilled').map(r => r.value)
    );
  }
}
```

### Caching Strategies

Implement caching to reduce service calls:

```typescript
interface CacheConfig {
  ttl: number;           // Time to live in seconds
  staleWhileRevalidate: number;  // Allow stale data while refreshing
  key: (params: any) => string;
}

class CachedComposer {
  private cache: Cache;

  async compose<T>(
    compositionId: string,
    params: any,
    composition: () => Promise<T>,
    config: CacheConfig
  ): Promise<CachedResult<T>> {
    const cacheKey = config.key(params);
    const cached = await this.cache.get<CachedEntry<T>>(cacheKey);

    // Fresh cache hit
    if (cached && !this.isStale(cached, config.ttl)) {
      return {
        data: cached.data,
        fromCache: true,
        age: Date.now() - cached.timestamp
      };
    }

    // Stale but within revalidation window
    if (cached && this.isWithinRevalidation(cached, config)) {
      // Return stale data immediately
      const staleResult = {
        data: cached.data,
        fromCache: true,
        stale: true,
        age: Date.now() - cached.timestamp
      };

      // Revalidate in background
      this.revalidateInBackground(cacheKey, composition, config);

      return staleResult;
    }

    // Cache miss or expired - fetch fresh
    const data = await composition();
    await this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    }, config.ttl + config.staleWhileRevalidate);

    return {
      data,
      fromCache: false,
      age: 0
    };
  }

  private async revalidateInBackground<T>(
    key: string,
    composition: () => Promise<T>,
    config: CacheConfig
  ): Promise<void> {
    try {
      const data = await composition();
      await this.cache.set(key, {
        data,
        timestamp: Date.now()
      }, config.ttl + config.staleWhileRevalidate);
    } catch (error) {
      // Log but don't fail - we already returned stale data
      console.error('Background revalidation failed:', error);
    }
  }
}
```

### Error Handling Patterns

Comprehensive error handling for compositions:

```typescript
// Error types
class CompositionError extends Error {
  constructor(
    message: string,
    public readonly serviceErrors: ServiceError[],
    public readonly partialData?: any
  ) {
    super(message);
    this.name = 'CompositionError';
  }
}

interface ServiceError {
  service: string;
  type: 'timeout' | 'unavailable' | 'invalid_response' | 'unknown';
  message: string;
  retryable: boolean;
}

// Error handling strategies
class ResilientComposer {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryConfig: RetryConfig;

  async callService<T>(
    serviceName: string,
    call: () => Promise<T>,
    options: CallOptions = {}
  ): Promise<T> {
    const breaker = this.getCircuitBreaker(serviceName);

    // Check circuit breaker
    if (breaker.isOpen()) {
      if (options.fallback) {
        return options.fallback();
      }
      throw new ServiceError(serviceName, 'unavailable', 'Circuit breaker open', true);
    }

    try {
      // Execute with retry
      const result = await this.withRetry(
        () => this.withTimeout(call, options.timeout || 5000),
        this.retryConfig
      );

      breaker.recordSuccess();
      return result;
    } catch (error) {
      breaker.recordFailure();

      if (options.fallback) {
        return options.fallback();
      }
      throw error;
    }
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (!this.isRetryable(error) || attempt === config.maxRetries) {
          throw error;
        }

        const delay = config.baseDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ]);
  }
}
```

## Code Examples

### Complete API Composer Implementation

```typescript
import { EventEmitter } from 'events';

// Types
interface ServiceDefinition {
  name: string;
  baseUrl: string;
  timeout?: number;
  retries?: number;
}

interface CompositionStep {
  service: string;
  endpoint: string;
  method: 'GET' | 'POST';
  params?: (context: CompositionContext) => Record<string, any>;
  body?: (context: CompositionContext) => any;
  transform?: (response: any) => any;
  required?: boolean;
  dependsOn?: string[];
  cache?: CacheConfig;
}

interface CompositionContext {
  request: Request;
  results: Map<string, any>;
  errors: Map<string, Error>;
}

// Main Composer Class
class APIComposer extends EventEmitter {
  private services: Map<string, ServiceDefinition> = new Map();
  private cache: Cache;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private metrics: MetricsCollector;

  constructor(config: ComposerConfig) {
    super();
    this.cache = new Cache(config.cache);
    this.metrics = new MetricsCollector();
  }

  registerService(service: ServiceDefinition): void {
    this.services.set(service.name, service);
    this.circuitBreakers.set(
      service.name,
      new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 30000
      })
    );
  }

  async compose(
    compositionId: string,
    steps: CompositionStep[],
    request: Request
  ): Promise<CompositionResult> {
    const startTime = Date.now();
    const context: CompositionContext = {
      request,
      results: new Map(),
      errors: new Map()
    };

    // Build dependency graph
    const graph = this.buildDependencyGraph(steps);

    // Execute in topological order
    const executionOrder = this.topologicalSort(graph);

    for (const level of executionOrder) {
      // Execute all steps at this level in parallel
      await Promise.all(
        level.map(stepName => this.executeStep(
          steps.find(s => s.service === stepName)!,
          context
        ))
      );
    }

    // Build result
    const result = this.buildResult(steps, context);

    // Record metrics
    this.metrics.recordComposition(compositionId, {
      latency: Date.now() - startTime,
      stepCount: steps.length,
      successCount: context.results.size,
      errorCount: context.errors.size
    });

    return result;
  }

  private async executeStep(
    step: CompositionStep,
    context: CompositionContext
  ): Promise<void> {
    const service = this.services.get(step.service);
    if (!service) {
      throw new Error(`Service not registered: ${step.service}`);
    }

    const breaker = this.circuitBreakers.get(step.service)!;

    // Check circuit breaker
    if (breaker.isOpen()) {
      if (step.required) {
        throw new Error(`Required service unavailable: ${step.service}`);
      }
      context.errors.set(step.service, new Error('Circuit breaker open'));
      return;
    }

    // Check cache
    if (step.cache) {
      const cached = await this.checkCache(step, context);
      if (cached) {
        context.results.set(step.service, cached);
        return;
      }
    }

    try {
      // Build request
      const url = this.buildUrl(service, step, context);
      const options = this.buildRequestOptions(step, context);

      // Execute with timeout
      const response = await this.executeWithTimeout(
        () => fetch(url, options),
        service.timeout || 5000
      );

      if (!response.ok) {
        throw new Error(`Service returned ${response.status}`);
      }

      let data = await response.json();

      // Transform if needed
      if (step.transform) {
        data = step.transform(data);
      }

      // Cache result
      if (step.cache) {
        await this.cacheResult(step, context, data);
      }

      context.results.set(step.service, data);
      breaker.recordSuccess();
    } catch (error) {
      breaker.recordFailure();

      if (step.required) {
        throw error;
      }

      context.errors.set(step.service, error);
      this.emit('stepError', { step: step.service, error });
    }
  }

  private buildDependencyGraph(steps: CompositionStep[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const step of steps) {
      graph.set(step.service, step.dependsOn || []);
    }

    return graph;
  }

  private topologicalSort(graph: Map<string, string[]>): string[][] {
    const levels: string[][] = [];
    const inDegree = new Map<string, number>();
    const queue: string[] = [];

    // Initialize in-degrees
    for (const [node, deps] of graph) {
      inDegree.set(node, deps.length);
      if (deps.length === 0) {
        queue.push(node);
      }
    }

    while (queue.length > 0) {
      const level = [...queue];
      levels.push(level);
      queue.length = 0;

      for (const node of level) {
        for (const [other, deps] of graph) {
          if (deps.includes(node)) {
            const newDegree = inDegree.get(other)! - 1;
            inDegree.set(other, newDegree);
            if (newDegree === 0) {
              queue.push(other);
            }
          }
        }
      }
    }

    return levels;
  }

  private buildResult(
    steps: CompositionStep[],
    context: CompositionContext
  ): CompositionResult {
    const data: Record<string, any> = {};
    const errors: ServiceError[] = [];

    for (const step of steps) {
      if (context.results.has(step.service)) {
        data[step.service] = context.results.get(step.service);
      } else if (context.errors.has(step.service)) {
        errors.push({
          service: step.service,
          message: context.errors.get(step.service)!.message,
          required: step.required || false
        });
      }
    }

    return {
      data,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        totalSteps: steps.length,
        successfulSteps: context.results.size,
        failedSteps: context.errors.size
      }
    };
  }
}

// Usage Example
const composer = new APIComposer({
  cache: { type: 'redis', url: 'redis://localhost:6379' }
});

// Register services
composer.registerService({
  name: 'orders',
  baseUrl: 'http://order-service:8080',
  timeout: 3000
});

composer.registerService({
  name: 'customers',
  baseUrl: 'http://customer-service:8080',
  timeout: 2000
});

composer.registerService({
  name: 'inventory',
  baseUrl: 'http://inventory-service:8080',
  timeout: 2000
});

// Define composition
const orderDetailsComposition: CompositionStep[] = [
  {
    service: 'orders',
    endpoint: '/orders/:orderId',
    method: 'GET',
    params: (ctx) => ({ orderId: ctx.request.params.orderId }),
    required: true
  },
  {
    service: 'customers',
    endpoint: '/customers/:customerId',
    method: 'GET',
    params: (ctx) => ({
      customerId: ctx.results.get('orders')?.customerId
    }),
    dependsOn: ['orders'],
    cache: { ttl: 300 }
  },
  {
    service: 'inventory',
    endpoint: '/items/batch',
    method: 'POST',
    body: (ctx) => ({
      itemIds: ctx.results.get('orders')?.items.map(i => i.itemId)
    }),
    dependsOn: ['orders'],
    transform: (response) => response.items
  }
];

// Execute composition
app.get('/api/orders/:orderId/details', async (req, res) => {
  const result = await composer.compose('order-details', orderDetailsComposition, req);
  res.json(result);
});
```

### GraphQL-Based Composition

```typescript
import { ApolloServer } from '@apollo/server';
import { GraphQLError } from 'graphql';
import DataLoader from 'dataloader';

// Type definitions
const typeDefs = `#graphql
  type Order {
    id: ID!
    status: String!
    total: Float!
    customer: Customer
    items: [OrderItem!]!
    createdAt: String!
  }

  type Customer {
    id: ID!
    name: String!
    email: String!
    orders: [Order!]!
  }

  type OrderItem {
    id: ID!
    product: Product!
    quantity: Int!
    price: Float!
  }

  type Product {
    id: ID!
    name: String!
    description: String
    price: Float!
    inStock: Boolean!
  }

  type Query {
    order(id: ID!): Order
    orders(customerId: ID, status: String, limit: Int): [Order!]!
    customer(id: ID!): Customer
  }
`;

// Data loaders for batching
interface DataLoaders {
  customers: DataLoader<string, Customer>;
  products: DataLoader<string, Product>;
  orders: DataLoader<string, Order>;
}

function createDataLoaders(services: Services): DataLoaders {
  return {
    customers: new DataLoader(async (ids) => {
      const customers = await services.customer.getCustomers(ids as string[]);
      const customerMap = new Map(customers.map(c => [c.id, c]));
      return ids.map(id => customerMap.get(id) || null);
    }),

    products: new DataLoader(async (ids) => {
      const products = await services.inventory.getProducts(ids as string[]);
      const productMap = new Map(products.map(p => [p.id, p]));
      return ids.map(id => productMap.get(id) || null);
    }),

    orders: new DataLoader(async (ids) => {
      const orders = await services.order.getOrders(ids as string[]);
      const orderMap = new Map(orders.map(o => [o.id, o]));
      return ids.map(id => orderMap.get(id) || null);
    })
  };
}

// Resolvers
const resolvers = {
  Query: {
    order: async (_, { id }, { loaders }) => {
      return loaders.orders.load(id);
    },

    orders: async (_, { customerId, status, limit }, { services }) => {
      return services.order.searchOrders({ customerId, status, limit });
    },

    customer: async (_, { id }, { loaders }) => {
      return loaders.customers.load(id);
    }
  },

  Order: {
    // Compose customer data
    customer: async (order, _, { loaders }) => {
      if (!order.customerId) return null;
      return loaders.customers.load(order.customerId);
    },

    // Compose item data with product details
    items: async (order, _, { loaders }) => {
      const productIds = order.items.map(item => item.productId);
      const products = await loaders.products.loadMany(productIds);

      return order.items.map((item, index) => ({
        ...item,
        product: products[index]
      }));
    }
  },

  Customer: {
    // Compose orders for customer
    orders: async (customer, _, { services }) => {
      return services.order.getOrdersByCustomer(customer.id);
    }
  },

  OrderItem: {
    product: async (item, _, { loaders }) => {
      return loaders.products.load(item.productId);
    }
  }
};

// Server setup with context
const server = new ApolloServer({
  typeDefs,
  resolvers
});

// Express integration
app.use('/graphql', expressMiddleware(server, {
  context: async ({ req }) => ({
    services: {
      order: new OrderService(),
      customer: new CustomerService(),
      inventory: new InventoryService()
    },
    loaders: createDataLoaders(services)
  })
}));
```

### BFF (Backend for Frontend) Composition

```typescript
// Mobile BFF - optimized for mobile clients
class MobileBFF {
  private orderService: OrderService;
  private customerService: CustomerService;
  private inventoryService: InventoryService;
  private cache: Cache;

  // Mobile-optimized order list
  async getOrderList(
    customerId: string,
    options: { page: number; pageSize: number }
  ): Promise<MobileOrderListResponse> {
    // Get orders with minimal fields
    const orders = await this.orderService.getOrders({
      customerId,
      page: options.page,
      pageSize: options.pageSize,
      fields: ['id', 'status', 'total', 'createdAt', 'itemCount']
    });

    // Mobile doesn't need full item details in list view
    return {
      orders: orders.map(order => ({
        id: order.id,
        status: order.status,
        total: this.formatCurrency(order.total),
        date: this.formatDate(order.createdAt),
        itemCount: order.itemCount,
        // Include thumbnail of first item only
        thumbnail: order.thumbnailUrl
      })),
      pagination: {
        page: options.page,
        pageSize: options.pageSize,
        hasMore: orders.length === options.pageSize
      }
    };
  }

  // Mobile-optimized order detail
  async getOrderDetail(orderId: string): Promise<MobileOrderDetailResponse> {
    const [order, deliveryStatus] = await Promise.all([
      this.orderService.getOrder(orderId),
      this.orderService.getDeliveryStatus(orderId)
    ]);

    // Get customer and items in parallel
    const [customer, items] = await Promise.all([
      this.customerService.getCustomer(order.customerId, {
        fields: ['name', 'phone']  // Only what's needed for mobile
      }),
      this.inventoryService.getItems(order.itemIds, {
        fields: ['id', 'name', 'thumbnailUrl', 'price']
      })
    ]);

    return {
      order: {
        id: order.id,
        status: order.status,
        total: this.formatCurrency(order.total),
        date: this.formatDate(order.createdAt)
      },
      customer: {
        name: customer.name,
        phone: this.maskPhone(customer.phone)
      },
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        thumbnail: item.thumbnailUrl,
        price: this.formatCurrency(item.price),
        quantity: order.items.find(i => i.itemId === item.id)?.quantity
      })),
      delivery: {
        status: deliveryStatus.status,
        estimatedDate: this.formatDate(deliveryStatus.estimatedDelivery),
        trackingUrl: deliveryStatus.trackingUrl
      },
      // Mobile-specific actions
      actions: this.getAvailableActions(order.status)
    };
  }

  private getAvailableActions(status: string): MobileAction[] {
    const actions: MobileAction[] = [];

    switch (status) {
      case 'pending':
        actions.push({ type: 'cancel', label: 'Cancel Order' });
        break;
      case 'shipped':
        actions.push({ type: 'track', label: 'Track Package' });
        break;
      case 'delivered':
        actions.push({ type: 'return', label: 'Return Items' });
        actions.push({ type: 'review', label: 'Leave Review' });
        break;
    }

    actions.push({ type: 'support', label: 'Contact Support' });
    return actions;
  }
}

// Web BFF - optimized for web clients
class WebBFF {
  // Web gets more detailed data
  async getOrderDetail(orderId: string): Promise<WebOrderDetailResponse> {
    const order = await this.orderService.getOrder(orderId);

    const [customer, items, orderHistory, recommendations] = await Promise.all([
      this.customerService.getCustomer(order.customerId),
      this.inventoryService.getItemsWithDetails(order.itemIds),
      this.orderService.getOrderHistory(order.customerId, { limit: 5 }),
      this.recommendationService.getRelatedProducts(order.itemIds)
    ]);

    return {
      order: {
        ...order,
        timeline: this.buildOrderTimeline(order)
      },
      customer: {
        ...customer,
        memberSince: customer.createdAt,
        totalOrders: orderHistory.length
      },
      items: items.map(item => ({
        ...item,
        reviews: item.reviews.slice(0, 3),
        relatedItems: recommendations.filter(r => r.sourceItemId === item.id)
      })),
      sidebar: {
        recentOrders: orderHistory,
        recommendations: recommendations.slice(0, 4)
      }
    };
  }
}
```

## Best Practices

### 1. Design for Failure

```typescript
// Always expect service failures
class ResilientComposer {
  async compose(request: CompositionRequest): Promise<CompositionResponse> {
    const results = await Promise.allSettled([
      this.fetchWithFallback('orders', () => this.orderService.get(request.orderId)),
      this.fetchWithFallback('customer', () => this.customerService.get(request.customerId)),
      this.fetchWithFallback('inventory', () => this.inventoryService.get(request.itemIds))
    ]);

    return this.mergeResults(results);
  }

  private async fetchWithFallback<T>(
    name: string,
    fetch: () => Promise<T>
  ): Promise<FetchResult<T>> {
    try {
      // Try cache first
      const cached = await this.cache.get<T>(name);
      if (cached) {
        return { data: cached, source: 'cache', fresh: false };
      }

      // Fetch from service
      const data = await fetch();
      await this.cache.set(name, data);
      return { data, source: 'service', fresh: true };
    } catch (error) {
      // Try stale cache
      const stale = await this.cache.getStale<T>(name);
      if (stale) {
        return { data: stale, source: 'stale-cache', fresh: false };
      }

      // Return default/empty
      return { data: this.getDefault<T>(name), source: 'default', fresh: false };
    }
  }
}
```

### 2. Implement Request Coalescing

```typescript
// Coalesce identical requests made within a short window
class RequestCoalescer {
  private pending: Map<string, Promise<any>> = new Map();
  private coalescingWindow = 50; // ms

  async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Check for pending identical request
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    // Create new request
    const promise = fetcher().finally(() => {
      // Clean up after coalescing window
      setTimeout(() => this.pending.delete(key), this.coalescingWindow);
    });

    this.pending.set(key, promise);
    return promise;
  }
}

// Usage in composer
class CoalescingComposer {
  private coalescer = new RequestCoalescer();

  async getCustomer(customerId: string): Promise<Customer> {
    return this.coalescer.fetch(
      `customer:${customerId}`,
      () => this.customerService.getCustomer(customerId)
    );
  }
}
```

### 3. Use Batch APIs

```typescript
// Batch multiple individual requests
class BatchingComposer {
  private batchQueue: Map<string, BatchRequest[]> = new Map();
  private batchTimeout = 10; // ms

  async getItems(itemIds: string[]): Promise<Item[]> {
    // If small request, batch with others
    if (itemIds.length < 10) {
      return this.batchedFetch(itemIds);
    }

    // Large request goes directly
    return this.inventoryService.getItems(itemIds);
  }

  private async batchedFetch(itemIds: string[]): Promise<Item[]> {
    return new Promise((resolve, reject) => {
      const requests = itemIds.map(id => ({
        id,
        resolve: (item: Item) => resolve([item]),
        reject
      }));

      // Add to queue
      if (!this.batchQueue.has('items')) {
        this.batchQueue.set('items', []);

        // Schedule batch execution
        setTimeout(() => this.executeBatch('items'), this.batchTimeout);
      }

      this.batchQueue.get('items')!.push(...requests);
    });
  }

  private async executeBatch(type: string): Promise<void> {
    const requests = this.batchQueue.get(type) || [];
    this.batchQueue.delete(type);

    if (requests.length === 0) return;

    try {
      const ids = requests.map(r => r.id);
      const items = await this.inventoryService.getItems(ids);
      const itemMap = new Map(items.map(i => [i.id, i]));

      for (const request of requests) {
        const item = itemMap.get(request.id);
        if (item) {
          request.resolve(item);
        } else {
          request.reject(new Error(`Item not found: ${request.id}`));
        }
      }
    } catch (error) {
      for (const request of requests) {
        request.reject(error);
      }
    }
  }
}
```

### 4. Monitor Composition Performance

```typescript
// Comprehensive monitoring for compositions
class MonitoredComposer {
  private metrics: MetricsClient;
  private tracer: Tracer;

  async compose(
    compositionId: string,
    request: Request
  ): Promise<CompositionResult> {
    const span = this.tracer.startSpan(`compose:${compositionId}`);
    const startTime = Date.now();

    try {
      const result = await this.executeComposition(compositionId, request, span);

      // Record success metrics
      this.metrics.histogram('composition.latency', Date.now() - startTime, {
        compositionId,
        status: 'success'
      });

      this.metrics.counter('composition.requests', 1, {
        compositionId,
        status: 'success'
      });

      return result;
    } catch (error) {
      // Record failure metrics
      this.metrics.counter('composition.requests', 1, {
        compositionId,
        status: 'error',
        errorType: error.name
      });

      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  }

  private async executeComposition(
    compositionId: string,
    request: Request,
    parentSpan: Span
  ): Promise<CompositionResult> {
    const steps = this.getCompositionSteps(compositionId);
    const results = new Map<string, any>();

    for (const step of steps) {
      const stepSpan = this.tracer.startSpan(`step:${step.service}`, {
        parent: parentSpan
      });

      try {
        const stepStart = Date.now();
        const result = await step.execute(request, results);
        results.set(step.service, result);

        // Record step metrics
        this.metrics.histogram('composition.step.latency', Date.now() - stepStart, {
          compositionId,
          step: step.service,
          status: 'success'
        });
      } catch (error) {
        this.metrics.counter('composition.step.errors', 1, {
          compositionId,
          step: step.service,
          errorType: error.name
        });

        if (step.required) throw error;
      } finally {
        stepSpan.end();
      }
    }

    return this.buildResult(results);
  }
}
```

## Common Pitfalls

### 1. N+1 Query Problem

```typescript
// Anti-pattern: N+1 queries
async function badComposition(orderIds: string[]): Promise<OrderWithCustomer[]> {
  const orders = await orderService.getOrders(orderIds);  // 1 query

  // N additional queries!
  const results = [];
  for (const order of orders) {
    const customer = await customerService.getCustomer(order.customerId);
    results.push({ ...order, customer });
  }
  return results;
}

// Better: Batch queries
async function goodComposition(orderIds: string[]): Promise<OrderWithCustomer[]> {
  const orders = await orderService.getOrders(orderIds);  // 1 query

  // Collect unique customer IDs
  const customerIds = [...new Set(orders.map(o => o.customerId))];

  // Single batch query
  const customers = await customerService.getCustomers(customerIds);  // 1 query
  const customerMap = new Map(customers.map(c => [c.id, c]));

  return orders.map(order => ({
    ...order,
    customer: customerMap.get(order.customerId)
  }));
}
```

### 2. Cascading Failures

```typescript
// Anti-pattern: No isolation between service calls
async function fragileComposition(): Promise<ComposedData> {
  const order = await orderService.getOrder(id);
  const customer = await customerService.getCustomer(order.customerId);  // If this fails...
  const items = await inventoryService.getItems(order.itemIds);  // ...this never runs

  return { order, customer, items };
}

// Better: Isolated failures with fallbacks
async function resilientComposition(): Promise<ComposedData> {
  const order = await orderService.getOrder(id);

  const [customerResult, itemsResult] = await Promise.allSettled([
    customerService.getCustomer(order.customerId),
    inventoryService.getItems(order.itemIds)
  ]);

  return {
    order,
    customer: customerResult.status === 'fulfilled'
      ? customerResult.value
      : { id: order.customerId, name: 'Unknown' },
    items: itemsResult.status === 'fulfilled'
      ? itemsResult.value
      : order.itemIds.map(id => ({ id, name: 'Unknown' }))
  };
}
```

### 3. Unbounded Data Aggregation

```typescript
// Anti-pattern: Fetching unbounded data
async function dangerousComposition(customerId: string): Promise<CustomerData> {
  const customer = await customerService.getCustomer(customerId);
  const orders = await orderService.getAllOrders(customerId);  // Could be thousands!
  const items = await inventoryService.getItems(
    orders.flatMap(o => o.itemIds)  // Could be tens of thousands!
  );

  return { customer, orders, items };
}

// Better: Paginated and limited
async function safeComposition(
  customerId: string,
  options: { orderLimit: number; itemLimit: number }
): Promise<CustomerData> {
  const customer = await customerService.getCustomer(customerId);

  // Limit orders
  const orders = await orderService.getOrders(customerId, {
    limit: options.orderLimit,
    sort: 'createdAt:desc'
  });

  // Limit items (take from most recent orders)
  const itemIds = orders
    .flatMap(o => o.itemIds)
    .slice(0, options.itemLimit);

  const items = await inventoryService.getItems(itemIds);

  return {
    customer,
    orders,
    items,
    hasMore: orders.length === options.orderLimit
  };
}
```

## Performance Considerations

### Latency Optimization

```typescript
// Optimize composition latency
class LatencyOptimizedComposer {
  // Strategy 1: Speculative execution
  async speculativeCompose(orderId: string): Promise<OrderDetails> {
    // Start fetching order
    const orderPromise = this.orderService.getOrder(orderId);

    // Speculatively fetch commonly associated customer
    // (using cached mapping if available)
    const speculativeCustomerPromise = this.speculativelyFetchCustomer(orderId);

    const order = await orderPromise;

    // Either use speculative result or fetch actual
    let customer: Customer;
    const speculativeCustomer = await speculativeCustomerPromise;
    if (speculativeCustomer?.id === order.customerId) {
      customer = speculativeCustomer;
    } else {
      customer = await this.customerService.getCustomer(order.customerId);
    }

    const items = await this.inventoryService.getItems(order.itemIds);

    return { order, customer, items };
  }

  // Strategy 2: Predictive caching
  async predictiveCacheCompose(orderId: string): Promise<OrderDetails> {
    const order = await this.orderService.getOrder(orderId);

    // Trigger background caching for likely next requests
    this.backgroundCacheRelatedData(order);

    const [customer, items] = await Promise.all([
      this.customerService.getCustomer(order.customerId),
      this.inventoryService.getItems(order.itemIds)
    ]);

    return { order, customer, items };
  }

  private async backgroundCacheRelatedData(order: Order): Promise<void> {
    // Don't await - run in background
    Promise.all([
      this.cacheRecentOrders(order.customerId),
      this.cacheRelatedProducts(order.itemIds)
    ]).catch(error => {
      console.error('Background caching failed:', error);
    });
  }
}
```

### Memory Efficiency

```typescript
// Stream large compositions
class StreamingComposer {
  async *streamOrderDetails(
    orderIds: string[]
  ): AsyncGenerator<OrderDetails> {
    // Process in chunks to avoid memory issues
    const chunkSize = 100;

    for (let i = 0; i < orderIds.length; i += chunkSize) {
      const chunk = orderIds.slice(i, i + chunkSize);

      // Fetch chunk
      const orders = await this.orderService.getOrders(chunk);
      const customerIds = [...new Set(orders.map(o => o.customerId))];
      const itemIds = [...new Set(orders.flatMap(o => o.itemIds))];

      const [customers, items] = await Promise.all([
        this.customerService.getCustomers(customerIds),
        this.inventoryService.getItems(itemIds)
      ]);

      const customerMap = new Map(customers.map(c => [c.id, c]));
      const itemMap = new Map(items.map(i => [i.id, i]));

      // Yield composed results one by one
      for (const order of orders) {
        yield {
          order,
          customer: customerMap.get(order.customerId),
          items: order.itemIds.map(id => itemMap.get(id))
        };
      }

      // Allow GC between chunks
      await this.sleep(0);
    }
  }
}
```

## Real-World Scenarios

### Scenario: E-Commerce Product Page

```typescript
// Complete product page composition
class ProductPageComposer {
  async composeProductPage(
    productId: string,
    userId?: string
  ): Promise<ProductPageResponse> {
    // Core product data (required)
    const product = await this.productService.getProduct(productId);

    // Parallel fetch of enrichment data
    const [
      inventory,
      reviews,
      relatedProducts,
      pricing,
      userContext
    ] = await Promise.allSettled([
      this.inventoryService.getStock(productId),
      this.reviewService.getReviews(productId, { limit: 10 }),
      this.recommendationService.getRelated(productId, { limit: 8 }),
      this.pricingService.getPrice(productId, userId),
      userId ? this.userService.getContext(userId, productId) : null
    ]);

    return {
      product: {
        ...product,
        inStock: this.extractValue(inventory)?.quantity > 0,
        stockLevel: this.extractValue(inventory)?.quantity,
        price: this.extractValue(pricing) || product.basePrice,
        hasDiscount: this.extractValue(pricing)?.discount > 0
      },
      reviews: {
        items: this.extractValue(reviews)?.items || [],
        average: this.extractValue(reviews)?.average || 0,
        total: this.extractValue(reviews)?.total || 0
      },
      related: this.extractValue(relatedProducts) || [],
      user: userId ? {
        inWishlist: this.extractValue(userContext)?.wishlisted,
        inCart: this.extractValue(userContext)?.inCart,
        previouslyPurchased: this.extractValue(userContext)?.purchased,
        personalizedPrice: this.extractValue(pricing)?.personalizedPrice
      } : null,
      meta: {
        composedAt: new Date().toISOString(),
        partialData: this.hasPartialData([inventory, reviews, relatedProducts, pricing])
      }
    };
  }

  private extractValue<T>(result: PromiseSettledResult<T>): T | null {
    return result.status === 'fulfilled' ? result.value : null;
  }

  private hasPartialData(results: PromiseSettledResult<any>[]): boolean {
    return results.some(r => r.status === 'rejected');
  }
}
```

## Interview Key Points

### Core Understanding

**Q1: What is API Composition and when should you use it?**

API Composition is a pattern for aggregating data from multiple microservices into a single response. Use it when:

1. **Data is distributed**: Information needed for a single view is owned by multiple services
2. **Query requirements span services**: You need to join data that can't be joined at the database level
3. **Client simplicity**: You want to shield clients from the complexity of calling multiple services

**Q2: What are the main challenges with API Composition?**

1. **Latency**: Multiple network calls add latency
2. **Partial failures**: Some services may fail while others succeed
3. **Data consistency**: Aggregated data may be temporarily inconsistent
4. **Complexity**: Managing dependencies, retries, and fallbacks
5. **N+1 queries**: Risk of inefficient data fetching patterns

### Technical Questions

**Q3: How do you handle partial failures in API Composition?**

```typescript
// Strategy: Graceful degradation with fallbacks
async function resilientComposition(): Promise<ComposedResult> {
  const results = await Promise.allSettled([
    orderService.get(id),
    customerService.get(customerId),
    inventoryService.get(itemIds)
  ]);

  return {
    data: mergeResults(results),
    completeness: calculateCompleteness(results),
    warnings: extractWarnings(results)
  };
}
```

**Q4: How do you optimize API Composition performance?**

1. **Parallel execution**: Run independent calls concurrently
2. **Caching**: Cache frequently accessed data
3. **Batching**: Combine multiple small requests
4. **Field selection**: Request only needed fields
5. **Request coalescing**: Deduplicate identical requests

**Q5: What's the difference between API Composition and CQRS?**

- **API Composition**: Query-time aggregation from multiple services; data stays in source services
- **CQRS**: Pre-built read models; data is denormalized into dedicated query stores

API Composition is simpler but has higher query latency. CQRS has lower latency but higher complexity and eventual consistency.

## Further Reading

### Official Resources

- [Microservices Patterns](https://microservices.io/patterns/data/api-composition.html) - Chris Richardson
- [Microsoft - API Gateway Pattern](https://docs.microsoft.com/en-us/azure/architecture/microservices/design/gateway)

### Books

- "Microservices Patterns" by Chris Richardson - Chapter 7
- "Building Microservices" by Sam Newman
- "Designing Data-Intensive Applications" by Martin Kleppmann

### Technical Articles

- [API Composition in Microservices](https://www.nginx.com/blog/building-microservices-inter-process-communication/)
- [BFF Pattern](https://samnewman.io/patterns/architectural/bff/)
- [GraphQL for API Composition](https://www.apollographql.com/blog/backend/microservices/graphql-microservices/)

### Tools

- [Apollo GraphQL](https://www.apollographql.com/) - GraphQL-based composition
- [DataLoader](https://github.com/graphql/dataloader) - Batching and caching utility
- [Netflix Zuul](https://github.com/Netflix/zuul) - API Gateway

---

The API Composition pattern is essential for building effective microservices architectures. By carefully designing your composition layer with proper error handling, caching, and performance optimizations, you can provide seamless data aggregation while maintaining service autonomy. Remember to measure composition performance and iterate based on real-world usage patterns.
