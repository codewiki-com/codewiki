---
title: API 组合模式
description: 深入理解 API 组合模式：从多个微服务聚合数据的完整指南
track: architecture
section: design-patterns
difficulty: intermediate
tags:
  - API组合
  - 微服务
  - 数据聚合
  - API网关
  - BFF
  - 查询模式
status: imported
origin: old/src/content/docs/architecture/api-composition.zh.md
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

API 组合模式是微服务架构中实现跨多个服务检索数据的基本技术。当数据所有权分布在各个服务中时，此模式提供了一种在保持服务自治的同时聚合信息的方法。本文探讨 API 组合的实现策略、权衡和最佳实践。

## 概念解释

### 什么是 API 组合？

**API 组合**是一种模式，其中 API 组合器（聚合器）调用多个微服务并将它们的结果组合成单个响应。这在微服务架构中至关重要，因为曾经在单个数据库中的数据现在分布在多个服务中。

```
┌─────────────────────────────────────────────────────────────────┐
│                          客户端请求                              │
│              "获取包含客户和商品的订单详情"                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API 组合器                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                       组合逻辑                             │ │
│  │  1. 解析请求                                               │ │
│  │  2. 调用订单服务 → 获取订单                                │ │
│  │  3. 调用客户服务 → 获取客户详情                            │ │
│  │  4. 调用库存服务 → 获取商品详情                            │ │
│  │  5. 合并结果                                               │ │
│  │  6. 返回聚合响应                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │           │           │
         ┌──────────┘           │           └──────────┐
         ▼                      ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    订单服务     │  │    客户服务     │  │    库存服务     │
│                 │  │                 │  │                 │
│  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │
│  │   订单    │  │  │  │   客户    │  │  │  │   商品    │  │
│  │   数据库  │  │  │  │   数据库  │  │  │  │   数据库  │  │
│  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 解决的问题

在单体应用中，连接多个表的复杂查询很简单：

```sql
-- 单体应用：简单的连接查询
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

在微服务中，这些数据分布在各个服务中：

```
问题：数据是分布式的
├── 订单服务拥有：orders, order_items
├── 客户服务拥有：customers
└── 库存服务拥有：items

挑战：如何获取完整的订单视图？
```

### 组合器位置选项

API 组合器可以在不同位置实现：

| 位置 | 描述 | 最适合 |
|-----|------|-------|
| API 网关 | 网关处理组合 | 简单聚合、缓存 |
| BFF（后端服务于前端） | 前端特定的聚合器 | UI 特定的数据需求 |
| 专用服务 | 独立的组合服务 | 复杂业务逻辑 |
| 客户端 | 客户端进行多次调用 | 简单 UI、离线能力的应用 |
| GraphQL 层 | GraphQL 解析器组合 | 灵活的客户端查询 |

```
┌─────────────────────────────────────────────────────────────────┐
│                        组合器位置                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────────┐ │
│  │  客户端  │───▶│   BFF   │───▶│   网关  │───▶│    服务     │ │
│  │  (Web)  │    │  (Web)  │    │         │    │             │ │
│  └─────────┘    └─────────┘    └─────────┘    └─────────────┘ │
│                                                                  │
│  ┌─────────┐    ┌─────────┐                                    │
│  │  客户端  │───▶│   BFF   │───────────────────────────────────▶│
│  │ (移动)  │    │ (移动)  │                                    │
│  └─────────┘    └─────────┘                                    │
│                                                                  │
│  ┌─────────┐    ┌─────────┐                                    │
│  │  客户端  │───▶│ GraphQL │───────────────────────────────────▶│
│  │  (任意) │    │   层    │                                    │
│  └─────────┘    └─────────┘                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 核心原理

### 原则 1：并行执行

通过并行执行独立的服务调用来最小化延迟：

```typescript
// 顺序执行（慢）
async function getOrderDetailsSequential(orderId: string): Promise<OrderDetails> {
  const order = await orderService.getOrder(orderId);        // 100ms
  const customer = await customerService.getCustomer(order.customerId); // 100ms
  const items = await inventoryService.getItems(order.itemIds);  // 100ms
  // 总计：~300ms

  return { order, customer, items };
}

// 并行执行（快）
async function getOrderDetailsParallel(orderId: string): Promise<OrderDetails> {
  const order = await orderService.getOrder(orderId);  // 100ms

  // 这些可以并行运行，因为它们是独立的
  const [customer, items] = await Promise.all([
    customerService.getCustomer(order.customerId),  // 100ms
    inventoryService.getItems(order.itemIds)        // 100ms
  ]);
  // 总计：~200ms（订单 + max(客户, 商品)）

  return { order, customer, items };
}
```

### 原则 2：优雅降级

优雅地处理部分失败：

```typescript
interface CompositionResult<T> {
  data: Partial<T>;
  errors: ServiceError[];
  completeness: number; // 0-100%
}

async function getOrderWithDegradation(orderId: string): Promise<CompositionResult<OrderDetails>> {
  const errors: ServiceError[] = [];
  let completeness = 0;

  // 核心数据 - 必需
  let order: Order;
  try {
    order = await orderService.getOrder(orderId);
    completeness += 40;
  } catch (error) {
    // 订单是必需的，重新抛出
    throw new Error(`无法组合：订单服务不可用`);
  }

  // 客户数据 - 可选增强
  let customer: Customer | null = null;
  try {
    customer = await customerService.getCustomer(order.customerId);
    completeness += 30;
  } catch (error) {
    errors.push({
      service: 'customer',
      error: error.message,
      fallback: '客户详情不可用'
    });
    customer = { id: order.customerId, name: '未知', email: null };
  }

  // 商品数据 - 可选增强
  let items: Item[] = [];
  try {
    items = await inventoryService.getItems(order.itemIds);
    completeness += 30;
  } catch (error) {
    errors.push({
      service: 'inventory',
      error: error.message,
      fallback: '商品详情不可用'
    });
    // 从订单返回最小商品信息
    items = order.itemIds.map(id => ({ id, name: '未知', details: null }));
  }

  return {
    data: { order, customer, items },
    errors,
    completeness
  };
}
```

### 原则 3：高效数据传输

最小化服务之间的数据传输：

```typescript
// 反模式：获取完整实体
async function inefficientComposition(orderIds: string[]): Promise<OrderSummary[]> {
  // 获取所有订单的所有字段
  const orders = await Promise.all(
    orderIds.map(id => orderService.getOrder(id))  // 返回完整订单实体
  );

  // 然后获取所有客户字段
  const customers = await Promise.all(
    orders.map(o => customerService.getCustomer(o.customerId))  // 返回完整客户
  );

  // 只使用 name 和 total！
  return orders.map((order, i) => ({
    orderId: order.id,
    customerName: customers[i].name,
    total: order.total
  }));
}

// 更好：只请求需要的字段
async function efficientComposition(orderIds: string[]): Promise<OrderSummary[]> {
  // 带字段选择的批量请求
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

### 原则 4：一致的响应结构

无论部分失败如何，都提供一致的响应结构：

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

    // 执行所有服务调用
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

    // 合并结果
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

## 核心要点

### 组合策略

组合 API 响应的不同策略：

```typescript
// 策略 1：简单合并
// 最适合：可以简单组合的独立数据
interface SimpleMergeStrategy {
  type: 'simple-merge';
  services: ServiceCall[];
  merge: (results: any[]) => any;
}

// 策略 2：瀑布式（顺序依赖）
// 最适合：当一个调用依赖于另一个的结果时
interface WaterfallStrategy {
  type: 'waterfall';
  steps: WaterfallStep[];
}

interface WaterfallStep {
  service: string;
  call: (previousResults: Map<string, any>) => Promise<any>;
  required: boolean;
}

// 策略 3：分散-聚集
// 最适合：从多个源聚合相同类型的数据
interface ScatterGatherStrategy {
  type: 'scatter-gather';
  targets: ServiceCall[];
  gather: (results: any[]) => any;
  timeout: number;
}

// 策略 4：层次化
// 最适合：嵌套数据结构
interface HierarchicalStrategy {
  type: 'hierarchical';
  root: ServiceCall;
  children: Map<string, (parent: any) => ServiceCall[]>;
}

// 实现示例
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

### 缓存策略

实现缓存以减少服务调用：

```typescript
interface CacheConfig {
  ttl: number;           // 生存时间（秒）
  staleWhileRevalidate: number;  // 刷新时允许过期数据
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

    // 新鲜缓存命中
    if (cached && !this.isStale(cached, config.ttl)) {
      return {
        data: cached.data,
        fromCache: true,
        age: Date.now() - cached.timestamp
      };
    }

    // 过期但在重新验证窗口内
    if (cached && this.isWithinRevalidation(cached, config)) {
      // 立即返回过期数据
      const staleResult = {
        data: cached.data,
        fromCache: true,
        stale: true,
        age: Date.now() - cached.timestamp
      };

      // 后台重新验证
      this.revalidateInBackground(cacheKey, composition, config);

      return staleResult;
    }

    // 缓存未命中或过期 - 获取新数据
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
      // 记录但不失败 - 我们已经返回了过期数据
      console.error('后台重新验证失败:', error);
    }
  }
}
```

### 错误处理模式

组合的全面错误处理：

```typescript
// 错误类型
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

// 错误处理策略
class ResilientComposer {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryConfig: RetryConfig;

  async callService<T>(
    serviceName: string,
    call: () => Promise<T>,
    options: CallOptions = {}
  ): Promise<T> {
    const breaker = this.getCircuitBreaker(serviceName);

    // 检查断路器
    if (breaker.isOpen()) {
      if (options.fallback) {
        return options.fallback();
      }
      throw new ServiceError(serviceName, 'unavailable', '断路器打开', true);
    }

    try {
      // 带重试执行
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
        setTimeout(() => reject(new Error('超时')), timeoutMs)
      )
    ]);
  }
}
```

## 代码示例

### 完整的 API 组合器实现

```typescript
import { EventEmitter } from 'events';

// 类型定义
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

// 主组合器类
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

    // 构建依赖图
    const graph = this.buildDependencyGraph(steps);

    // 按拓扑顺序执行
    const executionOrder = this.topologicalSort(graph);

    for (const level of executionOrder) {
      // 并行执行此级别的所有步骤
      await Promise.all(
        level.map(stepName => this.executeStep(
          steps.find(s => s.service === stepName)!,
          context
        ))
      );
    }

    // 构建结果
    const result = this.buildResult(steps, context);

    // 记录指标
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
      throw new Error(`服务未注册: ${step.service}`);
    }

    const breaker = this.circuitBreakers.get(step.service)!;

    // 检查断路器
    if (breaker.isOpen()) {
      if (step.required) {
        throw new Error(`必需服务不可用: ${step.service}`);
      }
      context.errors.set(step.service, new Error('断路器打开'));
      return;
    }

    // 检查缓存
    if (step.cache) {
      const cached = await this.checkCache(step, context);
      if (cached) {
        context.results.set(step.service, cached);
        return;
      }
    }

    try {
      // 构建请求
      const url = this.buildUrl(service, step, context);
      const options = this.buildRequestOptions(step, context);

      // 带超时执行
      const response = await this.executeWithTimeout(
        () => fetch(url, options),
        service.timeout || 5000
      );

      if (!response.ok) {
        throw new Error(`服务返回 ${response.status}`);
      }

      let data = await response.json();

      // 如果需要则转换
      if (step.transform) {
        data = step.transform(data);
      }

      // 缓存结果
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

    // 初始化入度
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

// 使用示例
const composer = new APIComposer({
  cache: { type: 'redis', url: 'redis://localhost:6379' }
});

// 注册服务
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

// 定义组合
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

// 执行组合
app.get('/api/orders/:orderId/details', async (req, res) => {
  const result = await composer.compose('order-details', orderDetailsComposition, req);
  res.json(result);
});
```

### 基于 GraphQL 的组合

```typescript
import { ApolloServer } from '@apollo/server';
import { GraphQLError } from 'graphql';
import DataLoader from 'dataloader';

// 类型定义
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

// 用于批处理的数据加载器
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

// 解析器
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
    // 组合客户数据
    customer: async (order, _, { loaders }) => {
      if (!order.customerId) return null;
      return loaders.customers.load(order.customerId);
    },

    // 组合商品数据和产品详情
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
    // 组合客户的订单
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

// 带上下文的服务器设置
const server = new ApolloServer({
  typeDefs,
  resolvers
});

// Express 集成
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

### BFF（后端服务于前端）组合

```typescript
// 移动 BFF - 为移动客户端优化
class MobileBFF {
  private orderService: OrderService;
  private customerService: CustomerService;
  private inventoryService: InventoryService;
  private cache: Cache;

  // 移动优化的订单列表
  async getOrderList(
    customerId: string,
    options: { page: number; pageSize: number }
  ): Promise<MobileOrderListResponse> {
    // 获取最小字段的订单
    const orders = await this.orderService.getOrders({
      customerId,
      page: options.page,
      pageSize: options.pageSize,
      fields: ['id', 'status', 'total', 'createdAt', 'itemCount']
    });

    // 移动端在列表视图中不需要完整商品详情
    return {
      orders: orders.map(order => ({
        id: order.id,
        status: order.status,
        total: this.formatCurrency(order.total),
        date: this.formatDate(order.createdAt),
        itemCount: order.itemCount,
        // 只包含第一个商品的缩略图
        thumbnail: order.thumbnailUrl
      })),
      pagination: {
        page: options.page,
        pageSize: options.pageSize,
        hasMore: orders.length === options.pageSize
      }
    };
  }

  // 移动优化的订单详情
  async getOrderDetail(orderId: string): Promise<MobileOrderDetailResponse> {
    const [order, deliveryStatus] = await Promise.all([
      this.orderService.getOrder(orderId),
      this.orderService.getDeliveryStatus(orderId)
    ]);

    // 并行获取客户和商品
    const [customer, items] = await Promise.all([
      this.customerService.getCustomer(order.customerId, {
        fields: ['name', 'phone']  // 只获取移动端需要的
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
      // 移动特定操作
      actions: this.getAvailableActions(order.status)
    };
  }

  private getAvailableActions(status: string): MobileAction[] {
    const actions: MobileAction[] = [];

    switch (status) {
      case 'pending':
        actions.push({ type: 'cancel', label: '取消订单' });
        break;
      case 'shipped':
        actions.push({ type: 'track', label: '追踪包裹' });
        break;
      case 'delivered':
        actions.push({ type: 'return', label: '退货' });
        actions.push({ type: 'review', label: '写评价' });
        break;
    }

    actions.push({ type: 'support', label: '联系客服' });
    return actions;
  }
}

// Web BFF - 为 Web 客户端优化
class WebBFF {
  // Web 获取更详细的数据
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

## 最佳实践

### 1. 为失败而设计

```typescript
// 始终预期服务失败
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
      // 首先尝试缓存
      const cached = await this.cache.get<T>(name);
      if (cached) {
        return { data: cached, source: 'cache', fresh: false };
      }

      // 从服务获取
      const data = await fetch();
      await this.cache.set(name, data);
      return { data, source: 'service', fresh: true };
    } catch (error) {
      // 尝试过期缓存
      const stale = await this.cache.getStale<T>(name);
      if (stale) {
        return { data: stale, source: 'stale-cache', fresh: false };
      }

      // 返回默认/空值
      return { data: this.getDefault<T>(name), source: 'default', fresh: false };
    }
  }
}
```

### 2. 实现请求合并

```typescript
// 合并短时间窗口内的相同请求
class RequestCoalescer {
  private pending: Map<string, Promise<any>> = new Map();
  private coalescingWindow = 50; // ms

  async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // 检查是否有待处理的相同请求
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    // 创建新请求
    const promise = fetcher().finally(() => {
      // 合并窗口后清理
      setTimeout(() => this.pending.delete(key), this.coalescingWindow);
    });

    this.pending.set(key, promise);
    return promise;
  }
}

// 在组合器中使用
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

### 3. 使用批量 API

```typescript
// 批量多个单独请求
class BatchingComposer {
  private batchQueue: Map<string, BatchRequest[]> = new Map();
  private batchTimeout = 10; // ms

  async getItems(itemIds: string[]): Promise<Item[]> {
    // 如果是小请求，与其他请求批量
    if (itemIds.length < 10) {
      return this.batchedFetch(itemIds);
    }

    // 大请求直接发送
    return this.inventoryService.getItems(itemIds);
  }

  private async batchedFetch(itemIds: string[]): Promise<Item[]> {
    return new Promise((resolve, reject) => {
      const requests = itemIds.map(id => ({
        id,
        resolve: (item: Item) => resolve([item]),
        reject
      }));

      // 添加到队列
      if (!this.batchQueue.has('items')) {
        this.batchQueue.set('items', []);

        // 安排批量执行
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
          request.reject(new Error(`商品未找到: ${request.id}`));
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

### 4. 监控组合性能

```typescript
// 组合的全面监控
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

      // 记录成功指标
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
      // 记录失败指标
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
}
```

## 常见陷阱

### 1. N+1 查询问题

```typescript
// 反模式：N+1 查询
async function badComposition(orderIds: string[]): Promise<OrderWithCustomer[]> {
  const orders = await orderService.getOrders(orderIds);  // 1 次查询

  // N 次额外查询！
  const results = [];
  for (const order of orders) {
    const customer = await customerService.getCustomer(order.customerId);
    results.push({ ...order, customer });
  }
  return results;
}

// 更好：批量查询
async function goodComposition(orderIds: string[]): Promise<OrderWithCustomer[]> {
  const orders = await orderService.getOrders(orderIds);  // 1 次查询

  // 收集唯一客户 ID
  const customerIds = [...new Set(orders.map(o => o.customerId))];

  // 单次批量查询
  const customers = await customerService.getCustomers(customerIds);  // 1 次查询
  const customerMap = new Map(customers.map(c => [c.id, c]));

  return orders.map(order => ({
    ...order,
    customer: customerMap.get(order.customerId)
  }));
}
```

### 2. 级联失败

```typescript
// 反模式：服务调用之间没有隔离
async function fragileComposition(): Promise<ComposedData> {
  const order = await orderService.getOrder(id);
  const customer = await customerService.getCustomer(order.customerId);  // 如果这失败了...
  const items = await inventoryService.getItems(order.itemIds);  // ...这永远不会运行

  return { order, customer, items };
}

// 更好：带回退的隔离失败
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
      : { id: order.customerId, name: '未知' },
    items: itemsResult.status === 'fulfilled'
      ? itemsResult.value
      : order.itemIds.map(id => ({ id, name: '未知' }))
  };
}
```

### 3. 无界数据聚合

```typescript
// 反模式：获取无界数据
async function dangerousComposition(customerId: string): Promise<CustomerData> {
  const customer = await customerService.getCustomer(customerId);
  const orders = await orderService.getAllOrders(customerId);  // 可能有数千个！
  const items = await inventoryService.getItems(
    orders.flatMap(o => o.itemIds)  // 可能有数万个！
  );

  return { customer, orders, items };
}

// 更好：分页和限制
async function safeComposition(
  customerId: string,
  options: { orderLimit: number; itemLimit: number }
): Promise<CustomerData> {
  const customer = await customerService.getCustomer(customerId);

  // 限制订单
  const orders = await orderService.getOrders(customerId, {
    limit: options.orderLimit,
    sort: 'createdAt:desc'
  });

  // 限制商品（从最近的订单中获取）
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

## 性能考量

### 延迟优化

```typescript
// 优化组合延迟
class LatencyOptimizedComposer {
  // 策略 1：推测执行
  async speculativeCompose(orderId: string): Promise<OrderDetails> {
    // 开始获取订单
    const orderPromise = this.orderService.getOrder(orderId);

    // 推测性获取常关联的客户
    // （如果可用使用缓存映射）
    const speculativeCustomerPromise = this.speculativelyFetchCustomer(orderId);

    const order = await orderPromise;

    // 使用推测结果或获取实际
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

  // 策略 2：预测性缓存
  async predictiveCacheCompose(orderId: string): Promise<OrderDetails> {
    const order = await this.orderService.getOrder(orderId);

    // 触发后台缓存可能的下一个请求
    this.backgroundCacheRelatedData(order);

    const [customer, items] = await Promise.all([
      this.customerService.getCustomer(order.customerId),
      this.inventoryService.getItems(order.itemIds)
    ]);

    return { order, customer, items };
  }

  private async backgroundCacheRelatedData(order: Order): Promise<void> {
    // 不等待 - 后台运行
    Promise.all([
      this.cacheRecentOrders(order.customerId),
      this.cacheRelatedProducts(order.itemIds)
    ]).catch(error => {
      console.error('后台缓存失败:', error);
    });
  }
}
```

### 内存效率

```typescript
// 流式处理大型组合
class StreamingComposer {
  async *streamOrderDetails(
    orderIds: string[]
  ): AsyncGenerator<OrderDetails> {
    // 分块处理以避免内存问题
    const chunkSize = 100;

    for (let i = 0; i < orderIds.length; i += chunkSize) {
      const chunk = orderIds.slice(i, i + chunkSize);

      // 获取块
      const orders = await this.orderService.getOrders(chunk);
      const customerIds = [...new Set(orders.map(o => o.customerId))];
      const itemIds = [...new Set(orders.flatMap(o => o.itemIds))];

      const [customers, items] = await Promise.all([
        this.customerService.getCustomers(customerIds),
        this.inventoryService.getItems(itemIds)
      ]);

      const customerMap = new Map(customers.map(c => [c.id, c]));
      const itemMap = new Map(items.map(i => [i.id, i]));

      // 逐个产出组合结果
      for (const order of orders) {
        yield {
          order,
          customer: customerMap.get(order.customerId),
          items: order.itemIds.map(id => itemMap.get(id))
        };
      }

      // 允许块之间进行 GC
      await this.sleep(0);
    }
  }
}
```

## 实战场景

### 场景：电商产品页面

```typescript
// 完整的产品页面组合
class ProductPageComposer {
  async composeProductPage(
    productId: string,
    userId?: string
  ): Promise<ProductPageResponse> {
    // 核心产品数据（必需）
    const product = await this.productService.getProduct(productId);

    // 并行获取增强数据
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

## 面试要点

### 核心理解

**Q1：什么是 API 组合，何时应该使用它？**

API 组合是一种将来自多个微服务的数据聚合成单个响应的模式。使用场景：

1. **数据分布式**：单个视图所需的信息由多个服务拥有
2. **查询需求跨服务**：需要连接无法在数据库级别连接的数据
3. **客户端简化**：希望将调用多个服务的复杂性对客户端屏蔽

**Q2：API 组合的主要挑战是什么？**

1. **延迟**：多个网络调用增加延迟
2. **部分失败**：某些服务可能失败而其他服务成功
3. **数据一致性**：聚合的数据可能暂时不一致
4. **复杂性**：管理依赖关系、重试和回退
5. **N+1 查询**：低效数据获取模式的风险

### 技术问题

**Q3：如何处理 API 组合中的部分失败？**

```typescript
// 策略：带回退的优雅降级
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

**Q4：如何优化 API 组合性能？**

1. **并行执行**：并发运行独立调用
2. **缓存**：缓存频繁访问的数据
3. **批处理**：合并多个小请求
4. **字段选择**：只请求需要的字段
5. **请求合并**：去重相同的请求

**Q5：API 组合和 CQRS 有什么区别？**

- **API 组合**：查询时从多个服务聚合；数据保留在源服务中
- **CQRS**：预构建的读取模型；数据反规范化到专用查询存储

API 组合更简单但查询延迟更高。CQRS 延迟更低但复杂性更高且存在最终一致性。

## 延伸阅读

### 官方资源

- [微服务模式](https://microservices.io/patterns/data/api-composition.html) - Chris Richardson
- [Microsoft - API 网关模式](https://docs.microsoft.com/en-us/azure/architecture/microservices/design/gateway)

### 书籍

- 《微服务模式》 by Chris Richardson - 第 7 章
- 《构建微服务》 by Sam Newman
- 《设计数据密集型应用》 by Martin Kleppmann

### 技术文章

- [微服务中的 API 组合](https://www.nginx.com/blog/building-microservices-inter-process-communication/)
- [BFF 模式](https://samnewman.io/patterns/architectural/bff/)
- [用于 API 组合的 GraphQL](https://www.apollographql.com/blog/backend/microservices/graphql-microservices/)

### 工具

- [Apollo GraphQL](https://www.apollographql.com/) - 基于 GraphQL 的组合
- [DataLoader](https://github.com/graphql/dataloader) - 批处理和缓存工具
- [Netflix Zuul](https://github.com/Netflix/zuul) - API 网关

---

API 组合模式对于构建有效的微服务架构至关重要。通过精心设计带有适当错误处理、缓存和性能优化的组合层，你可以提供无缝的数据聚合，同时保持服务自治。记住要衡量组合性能并根据实际使用模式进行迭代。
