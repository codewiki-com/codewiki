---
title: 系统韧性设计指南
description: 掌握系统韧性设计，构建高可用的分布式系统
track: architecture
section: distributed
difficulty: advanced
tags:
  - 韧性
  - 高可用
  - 熔断
  - 降级
status: imported
origin: old/src/content/docs/architecture/resiliency.zh.md
divergence: 0.259
issues: []
legacy:
  category: Architecture
  subcategory: Distributed
  order: 16
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是系统韧性

系统韧性（System Resiliency）是指系统在面对故障、异常或意外情况时，能够保持核心功能正常运行并快速恢复的能力。在分布式系统中，故障是不可避免的——网络会抖动、服务会宕机、资源会耗尽。韧性设计的目标不是消除故障，而是接受故障的存在并优雅地处理它们。

韧性设计遵循"为失败而设计"（Design for Failure）的理念，这一思想源自于 Netflix、Amazon 等互联网巨头在大规模分布式系统中的实践经验。Michael Nygard 在其著作《Release It!》中系统性地阐述了这些模式。

### 韧性设计的核心原则

```
┌─────────────────────────────────────────────────────────────┐
│                    韧性设计金字塔                            │
│                                                             │
│                     ┌─────────┐                             │
│                     │ 自愈能力 │                             │
│                   ┌─┴─────────┴─┐                           │
│                   │  优雅降级   │                           │
│                 ┌─┴─────────────┴─┐                         │
│                 │   故障隔离      │                         │
│               ┌─┴─────────────────┴─┐                       │
│               │    快速失败         │                       │
│             ┌─┴─────────────────────┴─┐                     │
│             │      冗余备份           │                     │
│           ┌─┴─────────────────────────┴─┐                   │
│           │        监控告警             │                   │
│         ─────────────────────────────────                   │
└─────────────────────────────────────────────────────────────┘
```

1. **快速失败（Fail Fast）**：尽早发现问题，快速返回错误
2. **故障隔离（Fault Isolation）**：防止故障在系统中蔓延
3. **优雅降级（Graceful Degradation）**：在部分功能不可用时保持核心功能
4. **自愈能力（Self-Healing）**：系统能够自动检测并恢复故障

### 韧性与可用性的关系

| 概念 | 定义 | 关注点 |
|------|------|--------|
| 可用性（Availability） | 系统正常运行的时间比例 | 正常运行时间 |
| 可靠性（Reliability） | 系统按预期工作的能力 | 正确性 |
| 韧性（Resiliency） | 系统从故障中恢复的能力 | 恢复能力 |

韧性是实现高可用的关键手段。通过韧性设计，系统可以在故障发生时保持可用，从而提高整体可用性。

## 熔断器模式

### 熔断器原理

熔断器模式（Circuit Breaker Pattern）的灵感来自电气系统中的断路器。当检测到下游服务故障率过高时，熔断器会"跳闸"，暂时阻止对该服务的调用，避免故障蔓延和资源浪费。

```
                    熔断器状态机
    ┌──────────────────────────────────────┐
    │                                      │
    │   ┌─────────┐    失败率超阈值       │
    │   │  关闭   │──────────────────┐    │
    │   │ CLOSED  │                  │    │
    │   └────┬────┘                  ▼    │
    │        │              ┌─────────────┐│
    │        │              │    打开     ││
    │   成功  │              │   OPEN     ││
    │        │              └──────┬──────┘│
    │        │                     │       │
    │        │                超时后│       │
    │        ▼                     ▼       │
    │   ┌─────────────────────────────┐    │
    │   │         半开                 │    │
    │   │      HALF-OPEN              │    │
    │   └──────────────┬──────────────┘    │
    │                  │                   │
    │          探测请求│成功/失败          │
    │                  │                   │
    │    成功：回到关闭  失败：回到打开      │
    └──────────────────────────────────────┘
```

### 熔断器状态详解

- **关闭状态（Closed）**：正常状态，请求正常通过，同时统计成功/失败率
- **打开状态（Open）**：熔断状态，所有请求立即失败，不会调用下游服务
- **半开状态（Half-Open）**：恢复探测状态，允许少量请求通过以测试服务是否恢复

### TypeScript 实现完整熔断器

```typescript
// circuit-breaker.ts
interface CircuitBreakerConfig {
  failureThreshold: number;      // 触发熔断的失败次数
  successThreshold: number;      // 恢复关闭状态需要的成功次数
  timeout: number;               // 熔断持续时间（毫秒）
  monitoringWindow: number;      // 监控窗口时间（毫秒）
}

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

interface CircuitStats {
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  consecutiveSuccesses: number;
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private stats: CircuitStats = {
    failures: 0,
    successes: 0,
    lastFailureTime: null,
    consecutiveSuccesses: 0
  };
  private stateChangeTime: number = Date.now();
  private readonly config: CircuitBreakerConfig;
  private readonly name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      successThreshold: config.successThreshold ?? 3,
      timeout: config.timeout ?? 30000,
      monitoringWindow: config.monitoringWindow ?? 60000
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // 检查是否应该允许请求通过
    if (!this.shouldAllowRequest()) {
      throw new CircuitBreakerOpenError(
        `Circuit breaker '${this.name}' is OPEN`
      );
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private shouldAllowRequest(): boolean {
    switch (this.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // 检查是否超过熔断超时时间
        if (Date.now() - this.stateChangeTime >= this.config.timeout) {
          this.transitionTo(CircuitState.HALF_OPEN);
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        // 半开状态允许请求通过以进行探测
        return true;

      default:
        return false;
    }
  }

  private recordSuccess(): void {
    this.stats.successes++;
    this.stats.consecutiveSuccesses++;

    if (this.state === CircuitState.HALF_OPEN) {
      // 在半开状态，达到成功阈值后恢复关闭状态
      if (this.stats.consecutiveSuccesses >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  private recordFailure(): void {
    this.stats.failures++;
    this.stats.lastFailureTime = Date.now();
    this.stats.consecutiveSuccesses = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      // 半开状态下任何失败都会重新打开熔断器
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      // 检查是否需要打开熔断器
      if (this.stats.failures >= this.config.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.stateChangeTime = Date.now();

    // 重置统计数据
    if (newState === CircuitState.CLOSED) {
      this.stats = {
        failures: 0,
        successes: 0,
        lastFailureTime: null,
        consecutiveSuccesses: 0
      };
    } else if (newState === CircuitState.HALF_OPEN) {
      this.stats.consecutiveSuccesses = 0;
    }

    console.log(
      `Circuit breaker '${this.name}' transitioned from ${oldState} to ${newState}`
    );
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats(): Readonly<CircuitStats> {
    return { ...this.stats };
  }
}

class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

// 使用示例
const paymentCircuitBreaker = new CircuitBreaker('payment-service', {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 30000
});

async function processPayment(orderId: string, amount: number): Promise<void> {
  await paymentCircuitBreaker.execute(async () => {
    const response = await fetch('https://payment-service/pay', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount })
    });

    if (!response.ok) {
      throw new Error(`Payment failed: ${response.status}`);
    }

    return response.json();
  });
}
```

### 熔断器与健康检查结合

```typescript
// 增强版熔断器，集成健康检查
class EnhancedCircuitBreaker extends CircuitBreaker {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private healthCheckFn: (() => Promise<boolean>) | null = null;

  enableHealthCheck(
    checkFn: () => Promise<boolean>,
    intervalMs: number = 5000
  ): void {
    this.healthCheckFn = checkFn;
    this.healthCheckInterval = setInterval(async () => {
      if (this.getState() === CircuitState.OPEN) {
        try {
          const isHealthy = await checkFn();
          if (isHealthy) {
            console.log('Health check passed, transitioning to HALF_OPEN');
            // 主动转换到半开状态
            this.transitionTo(CircuitState.HALF_OPEN);
          }
        } catch (error) {
          console.log('Health check failed:', error);
        }
      }
    }, intervalMs);
  }

  dispose(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}
```

## 重试策略

### 重试的必要性与风险

在分布式系统中，临时性故障（如网络抖动、服务过载）是常见的。合理的重试策略可以提高请求的成功率，但不当的重试可能导致：

- **雪崩效应**：大量重试请求压垮已经过载的服务
- **重复操作**：非幂等操作被多次执行
- **资源浪费**：对永久性故障进行无意义的重试

### 重试策略类型

```
┌───────────────────────────────────────────────────────────────┐
│                     重试策略对比                               │
├─────────────────┬─────────────────┬───────────────────────────┤
│   固定间隔重试   │   指数退避重试   │      抖动退避重试          │
│                 │                 │                           │
│  ──●──●──●──●   │  ─●──●────●────│  ─●──●─────●───────●──    │
│                 │       ────●────│                           │
│  间隔固定       │  间隔指数增长   │  间隔随机化，避免惊群效应    │
│                 │                 │                           │
│  适用：简单场景  │  适用：大多数场景│  适用：高并发场景           │
└─────────────────┴─────────────────┴───────────────────────────┘
```

### 完整重试机制实现

```typescript
// retry.ts
interface RetryConfig {
  maxAttempts: number;           // 最大重试次数
  baseDelay: number;             // 基础延迟（毫秒）
  maxDelay: number;              // 最大延迟（毫秒）
  backoffMultiplier: number;     // 退避乘数
  jitterFactor: number;          // 抖动因子 (0-1)
  retryableErrors?: string[];    // 可重试的错误类型
}

type RetryStrategy = 'fixed' | 'exponential' | 'exponential-jitter';

class RetryPolicy {
  private readonly config: RetryConfig;
  private readonly strategy: RetryStrategy;

  constructor(strategy: RetryStrategy, config: Partial<RetryConfig> = {}) {
    this.strategy = strategy;
    this.config = {
      maxAttempts: config.maxAttempts ?? 3,
      baseDelay: config.baseDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      jitterFactor: config.jitterFactor ?? 0.5,
      retryableErrors: config.retryableErrors
    };
  }

  async execute<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // 检查是否是可重试的错误
        if (!this.isRetryable(lastError)) {
          throw lastError;
        }

        // 最后一次尝试失败，不再重试
        if (attempt === this.config.maxAttempts) {
          break;
        }

        const delay = this.calculateDelay(attempt);
        console.log(
          `[${context ?? 'Retry'}] Attempt ${attempt} failed, ` +
          `retrying in ${delay}ms. Error: ${lastError.message}`
        );

        await this.sleep(delay);
      }
    }

    throw new RetryExhaustedError(
      `All ${this.config.maxAttempts} attempts failed`,
      lastError!
    );
  }

  private calculateDelay(attempt: number): number {
    let delay: number;

    switch (this.strategy) {
      case 'fixed':
        delay = this.config.baseDelay;
        break;

      case 'exponential':
        delay = this.config.baseDelay *
          Math.pow(this.config.backoffMultiplier, attempt - 1);
        break;

      case 'exponential-jitter':
        const exponentialDelay = this.config.baseDelay *
          Math.pow(this.config.backoffMultiplier, attempt - 1);
        const jitter = exponentialDelay * this.config.jitterFactor * Math.random();
        delay = exponentialDelay + jitter;
        break;

      default:
        delay = this.config.baseDelay;
    }

    return Math.min(delay, this.config.maxDelay);
  }

  private isRetryable(error: Error): boolean {
    // 如果没有配置可重试错误类型，默认所有错误都可重试
    if (!this.config.retryableErrors?.length) {
      return true;
    }

    return this.config.retryableErrors.some(
      type => error.name === type || error.message.includes(type)
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class RetryExhaustedError extends Error {
  readonly lastError: Error;

  constructor(message: string, lastError: Error) {
    super(message);
    this.name = 'RetryExhaustedError';
    this.lastError = lastError;
  }
}

// 使用示例
const retryPolicy = new RetryPolicy('exponential-jitter', {
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  jitterFactor: 0.3,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ServiceUnavailable']
});

async function fetchUserData(userId: string): Promise<User> {
  return retryPolicy.execute(
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (response.status === 503) {
        throw new Error('ServiceUnavailable');
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    },
    `fetchUser:${userId}`
  );
}
```

### 重试与幂等性

```typescript
// 确保幂等性的重试策略
interface IdempotentRequest {
  idempotencyKey: string;
  operation: () => Promise<any>;
}

class IdempotentRetryPolicy {
  private readonly processedKeys = new Map<string, any>();
  private readonly retryPolicy: RetryPolicy;

  constructor(retryPolicy: RetryPolicy) {
    this.retryPolicy = retryPolicy;
  }

  async execute<T>(request: IdempotentRequest): Promise<T> {
    // 检查是否已经处理过
    if (this.processedKeys.has(request.idempotencyKey)) {
      console.log(`Request ${request.idempotencyKey} already processed`);
      return this.processedKeys.get(request.idempotencyKey);
    }

    const result = await this.retryPolicy.execute(request.operation);

    // 缓存结果
    this.processedKeys.set(request.idempotencyKey, result);

    return result;
  }
}

// 使用幂等性密钥
async function createOrder(orderData: OrderData): Promise<Order> {
  const idempotencyKey = `order:${orderData.userId}:${orderData.timestamp}`;

  return idempotentRetry.execute({
    idempotencyKey,
    operation: async () => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(orderData)
      });
      return response.json();
    }
  });
}
```

## 超时处理

### 超时的重要性

在分布式系统中，没有超时的调用是危险的。一个无响应的下游服务可能导致：

- 线程/连接池耗尽
- 级联故障
- 用户体验恶化

### 超时策略设计

```
┌────────────────────────────────────────────────────────────────┐
│                    超时层次架构                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   客户端                服务A                服务B             │
│     │                    │                    │               │
│     │   总超时: 10s      │                    │               │
│     ├──────────────────▶│                    │               │
│     │                    │  调用超时: 3s      │               │
│     │                    ├──────────────────▶│               │
│     │                    │                    │               │
│     │                    │◀────响应───────────┤               │
│     │                    │                    │               │
│     │                    │  调用超时: 3s      │               │
│     │                    ├──────────────────▶│  (可能重试)   │
│     │◀────最终响应───────┤                    │               │
│     │                    │                    │               │
│                                                                │
│   注意：下游超时之和 < 上游总超时（留有余量）                    │
└────────────────────────────────────────────────────────────────┘
```

### 完整超时处理实现

```typescript
// timeout.ts
interface TimeoutConfig {
  connectTimeout: number;    // 连接超时
  readTimeout: number;       // 读取超时
  writeTimeout: number;      // 写入超时
  totalTimeout: number;      // 总超时
}

class TimeoutError extends Error {
  readonly timeoutType: string;
  readonly timeoutMs: number;

  constructor(type: string, timeoutMs: number) {
    super(`${type} timeout after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
    this.timeoutType = type;
    this.timeoutMs = timeoutMs;
  }
}

class TimeoutManager {
  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutType: string = 'Operation'
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new TimeoutError(timeoutType, timeoutMs));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId!);
    }
  }

  static async withAbort<T>(
    fn: (signal: AbortSignal) => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fn(controller.signal);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError('Request', timeoutMs);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// 带超时的 HTTP 客户端
class TimeoutHttpClient {
  private readonly config: TimeoutConfig;

  constructor(config: Partial<TimeoutConfig> = {}) {
    this.config = {
      connectTimeout: config.connectTimeout ?? 5000,
      readTimeout: config.readTimeout ?? 10000,
      writeTimeout: config.writeTimeout ?? 10000,
      totalTimeout: config.totalTimeout ?? 30000
    };
  }

  async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    return TimeoutManager.withTimeout(
      TimeoutManager.withAbort(
        async (signal) => {
          const response = await fetch(url, {
            ...options,
            signal
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return response.json();
        },
        this.config.readTimeout
      ),
      this.config.totalTimeout,
      'Total request'
    );
  }
}

// 使用示例
const httpClient = new TimeoutHttpClient({
  connectTimeout: 3000,
  readTimeout: 5000,
  totalTimeout: 10000
});

async function getProductDetails(productId: string): Promise<Product> {
  try {
    return await httpClient.request(`/api/products/${productId}`);
  } catch (error) {
    if (error instanceof TimeoutError) {
      console.error(`Request timed out: ${error.timeoutType}`);
      // 返回缓存数据或默认值
      return getCachedProduct(productId);
    }
    throw error;
  }
}
```

### 自适应超时

```typescript
// 基于历史响应时间动态调整超时
class AdaptiveTimeout {
  private responseTimes: number[] = [];
  private readonly windowSize: number;
  private readonly percentile: number;
  private readonly multiplier: number;
  private readonly minTimeout: number;
  private readonly maxTimeout: number;

  constructor(options: {
    windowSize?: number;
    percentile?: number;
    multiplier?: number;
    minTimeout?: number;
    maxTimeout?: number;
  } = {}) {
    this.windowSize = options.windowSize ?? 100;
    this.percentile = options.percentile ?? 99;
    this.multiplier = options.multiplier ?? 1.5;
    this.minTimeout = options.minTimeout ?? 1000;
    this.maxTimeout = options.maxTimeout ?? 30000;
  }

  recordResponseTime(ms: number): void {
    this.responseTimes.push(ms);
    if (this.responseTimes.length > this.windowSize) {
      this.responseTimes.shift();
    }
  }

  getTimeout(): number {
    if (this.responseTimes.length < 10) {
      return this.maxTimeout; // 样本不足时使用最大超时
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const index = Math.ceil((this.percentile / 100) * sorted.length) - 1;
    const p99 = sorted[index];

    const timeout = Math.round(p99 * this.multiplier);
    return Math.max(this.minTimeout, Math.min(timeout, this.maxTimeout));
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const timeout = this.getTimeout();
    const startTime = Date.now();

    try {
      const result = await TimeoutManager.withTimeout(fn(), timeout);
      this.recordResponseTime(Date.now() - startTime);
      return result;
    } catch (error) {
      if (!(error instanceof TimeoutError)) {
        this.recordResponseTime(Date.now() - startTime);
      }
      throw error;
    }
  }
}
```

## 降级方案

### 降级策略类型

降级是在系统过载或部分功能不可用时，有选择地关闭或简化某些功能，以保证核心功能的可用性。

```
┌─────────────────────────────────────────────────────────────────┐
│                      降级策略金字塔                              │
│                                                                 │
│                        ┌───────┐                                │
│                        │ 拒绝  │  Level 4: 完全拒绝服务         │
│                      ┌─┴───────┴─┐                              │
│                      │ 静态响应  │  Level 3: 返回静态/缓存数据   │
│                    ┌─┴───────────┴─┐                            │
│                    │  功能降级     │  Level 2: 简化功能          │
│                  ┌─┴───────────────┴─┐                          │
│                  │    延迟处理       │  Level 1: 异步/排队处理   │
│                ─────────────────────────                        │
│                       正常服务                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 完整降级系统实现

```typescript
// degradation.ts
enum DegradationLevel {
  NORMAL = 0,       // 正常服务
  DELAYED = 1,      // 延迟处理
  SIMPLIFIED = 2,   // 功能简化
  STATIC = 3,       // 静态响应
  REJECTED = 4      // 拒绝服务
}

interface DegradationConfig {
  level: DegradationLevel;
  message?: string;
  fallbackData?: any;
}

interface DegradationRule {
  condition: () => boolean;
  level: DegradationLevel;
  priority: number;
}

class DegradationManager {
  private currentLevel: DegradationLevel = DegradationLevel.NORMAL;
  private rules: DegradationRule[] = [];
  private readonly healthMetrics: HealthMetrics;

  constructor(healthMetrics: HealthMetrics) {
    this.healthMetrics = healthMetrics;
    this.setupDefaultRules();
    this.startMonitoring();
  }

  private setupDefaultRules(): void {
    // 基于系统负载的降级规则
    this.addRule({
      condition: () => this.healthMetrics.getCpuUsage() > 90,
      level: DegradationLevel.SIMPLIFIED,
      priority: 1
    });

    this.addRule({
      condition: () => this.healthMetrics.getMemoryUsage() > 95,
      level: DegradationLevel.STATIC,
      priority: 2
    });

    this.addRule({
      condition: () => this.healthMetrics.getErrorRate() > 50,
      level: DegradationLevel.REJECTED,
      priority: 3
    });
  }

  addRule(rule: DegradationRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  private startMonitoring(): void {
    setInterval(() => {
      this.evaluateRules();
    }, 5000);
  }

  private evaluateRules(): void {
    let newLevel = DegradationLevel.NORMAL;

    for (const rule of this.rules) {
      if (rule.condition()) {
        newLevel = Math.max(newLevel, rule.level);
      }
    }

    if (newLevel !== this.currentLevel) {
      console.log(
        `Degradation level changed: ${DegradationLevel[this.currentLevel]} -> ${DegradationLevel[newLevel]}`
      );
      this.currentLevel = newLevel;
    }
  }

  getLevel(): DegradationLevel {
    return this.currentLevel;
  }

  setLevel(level: DegradationLevel): void {
    this.currentLevel = level;
  }

  async executeWithDegradation<T>(
    normalFn: () => Promise<T>,
    fallbacks: {
      delayed?: () => Promise<T>;
      simplified?: () => Promise<T>;
      static?: () => T;
    }
  ): Promise<T> {
    switch (this.currentLevel) {
      case DegradationLevel.NORMAL:
        return normalFn();

      case DegradationLevel.DELAYED:
        if (fallbacks.delayed) {
          return fallbacks.delayed();
        }
        return normalFn();

      case DegradationLevel.SIMPLIFIED:
        if (fallbacks.simplified) {
          return fallbacks.simplified();
        }
        if (fallbacks.static) {
          return fallbacks.static();
        }
        return normalFn();

      case DegradationLevel.STATIC:
        if (fallbacks.static) {
          return fallbacks.static();
        }
        throw new DegradationError('Service degraded to static mode');

      case DegradationLevel.REJECTED:
        throw new DegradationError('Service temporarily unavailable');

      default:
        return normalFn();
    }
  }
}

class DegradationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DegradationError';
  }
}

// 使用示例
class ProductService {
  private readonly degradationManager: DegradationManager;
  private readonly cache: Map<string, Product> = new Map();

  constructor(degradationManager: DegradationManager) {
    this.degradationManager = degradationManager;
  }

  async getProduct(productId: string): Promise<Product> {
    return this.degradationManager.executeWithDegradation(
      // 正常模式：完整查询
      async () => {
        const product = await this.fetchProductFromDB(productId);
        const reviews = await this.fetchReviews(productId);
        const recommendations = await this.fetchRecommendations(productId);

        return {
          ...product,
          reviews,
          recommendations
        };
      },
      {
        // 延迟模式：异步获取非核心数据
        delayed: async () => {
          const product = await this.fetchProductFromDB(productId);
          // 异步获取评论和推荐，不阻塞响应
          this.fetchReviewsAsync(productId);
          return product;
        },

        // 简化模式：只返回核心数据
        simplified: async () => {
          return this.fetchProductFromDB(productId);
        },

        // 静态模式：返回缓存数据
        static: () => {
          const cached = this.cache.get(productId);
          if (cached) {
            return cached;
          }
          throw new Error('Product not found in cache');
        }
      }
    );
  }

  private async fetchProductFromDB(id: string): Promise<Product> {
    // 数据库查询实现
    return {} as Product;
  }

  private async fetchReviews(id: string): Promise<Review[]> {
    return [];
  }

  private async fetchRecommendations(id: string): Promise<Product[]> {
    return [];
  }

  private fetchReviewsAsync(id: string): void {
    // 异步获取，结果存入缓存
  }
}
```

### 功能开关与降级

```typescript
// feature-flag.ts
interface FeatureFlag {
  name: string;
  enabled: boolean;
  degradedBehavior?: 'disable' | 'simplify' | 'cache';
  conditions?: {
    userPercentage?: number;
    regions?: string[];
    userTiers?: string[];
  };
}

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();

  setFlag(flag: FeatureFlag): void {
    this.flags.set(flag.name, flag);
  }

  isEnabled(flagName: string, context?: UserContext): boolean {
    const flag = this.flags.get(flagName);
    if (!flag) return false;
    if (!flag.enabled) return false;

    if (flag.conditions && context) {
      if (flag.conditions.userPercentage !== undefined) {
        const hash = this.hashUser(context.userId);
        if (hash > flag.conditions.userPercentage) return false;
      }

      if (flag.conditions.regions?.length) {
        if (!flag.conditions.regions.includes(context.region)) return false;
      }

      if (flag.conditions.userTiers?.length) {
        if (!flag.conditions.userTiers.includes(context.tier)) return false;
      }
    }

    return true;
  }

  private hashUser(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }
}

// 使用功能开关进行降级
async function getSearchResults(
  query: string,
  context: UserContext
): Promise<SearchResults> {
  const featureFlags = new FeatureFlagManager();

  if (featureFlags.isEnabled('advanced-search', context)) {
    return advancedSearch(query);
  } else if (featureFlags.isEnabled('basic-search', context)) {
    return basicSearch(query);
  } else {
    return { results: [], message: 'Search temporarily unavailable' };
  }
}
```

## 限流

### 限流算法对比

```
┌──────────────────────────────────────────────────────────────────┐
│                      限流算法对比                                 │
├────────────┬─────────────────────────────────────────────────────┤
│ 固定窗口    │  ████████░░░░░░░░████████░░░░░░░░               │
│            │  |--窗口1---|--窗口2---|                          │
│            │  简单，但窗口边界可能突发                          │
├────────────┼─────────────────────────────────────────────────────┤
│ 滑动窗口    │  ░░██████████████████░░░░░░░░░░                   │
│            │    ←──────窗口滑动──────→                          │
│            │  平滑，但实现复杂                                  │
├────────────┼─────────────────────────────────────────────────────┤
│ 令牌桶     │    ●●●●●                                          │
│            │  [桶] ←─ 固定速率添加令牌                          │
│            │    ↓                                               │
│            │  请求消耗令牌，允许突发                            │
├────────────┼─────────────────────────────────────────────────────┤
│ 漏桶       │  请求 → [桶] → 固定速率流出                        │
│            │           ↓                                        │
│            │  严格平滑，不允许突发                              │
└────────────┴─────────────────────────────────────────────────────┘
```

### 令牌桶算法实现

```typescript
// rate-limiter.ts
class TokenBucket {
  private tokens: number;
  private readonly capacity: number;
  private readonly refillRate: number; // 每秒添加的令牌数
  private lastRefillTime: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.lastRefillTime = Date.now();
  }

  tryAcquire(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefillTime) / 1000;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }
}

// 滑动窗口限流器
class SlidingWindowRateLimiter {
  private readonly windowSize: number;
  private readonly limit: number;
  private requests: number[] = [];

  constructor(windowSizeMs: number, limit: number) {
    this.windowSize = windowSizeMs;
    this.limit = limit;
  }

  tryAcquire(): boolean {
    const now = Date.now();
    const windowStart = now - this.windowSize;

    // 清理过期的请求记录
    this.requests = this.requests.filter(time => time > windowStart);

    if (this.requests.length < this.limit) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const windowStart = now - this.windowSize;
    this.requests = this.requests.filter(time => time > windowStart);
    return Math.max(0, this.limit - this.requests.length);
  }
}
```

### 分布式限流

```typescript
// distributed-rate-limiter.ts
interface RedisClient {
  runLuaScript(script: string, keys: string[], args: (string | number)[]): Promise<number>;
}

class DistributedRateLimiter {
  private readonly redis: RedisClient;
  private readonly keyPrefix: string;

  // Lua 脚本确保原子性
  private readonly luaScript = `
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local window = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])

    -- 清理过期的请求
    redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)

    -- 获取当前窗口内的请求数
    local count = redis.call('ZCARD', key)

    if count < limit then
      -- 添加新请求
      redis.call('ZADD', key, now, now .. '-' .. math.random())
      redis.call('EXPIRE', key, math.ceil(window / 1000))
      return 1
    else
      return 0
    end
  `;

  constructor(redis: RedisClient, keyPrefix: string = 'ratelimit') {
    this.redis = redis;
    this.keyPrefix = keyPrefix;
  }

  async tryAcquire(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<boolean> {
    const key = `${this.keyPrefix}:${identifier}`;
    const now = Date.now();

    const result = await this.redis.runLuaScript(
      this.luaScript,
      [key],
      [limit, windowMs, now]
    );

    return result === 1;
  }
}

// 多层限流策略
class MultiTierRateLimiter {
  private readonly tiers: Map<string, TokenBucket> = new Map();

  constructor() {
    // 不同层级的限流配置
    this.tiers.set('global', new TokenBucket(10000, 1000));  // 全局：10000请求/秒
    this.tiers.set('ip', new TokenBucket(100, 10));          // 单IP：100请求/秒
    this.tiers.set('user', new TokenBucket(50, 5));          // 单用户：50请求/秒
    this.tiers.set('api', new TokenBucket(20, 2));           // 单API：20请求/秒
  }

  tryAcquire(context: {
    ip: string;
    userId?: string;
    apiPath: string;
  }): { allowed: boolean; tier?: string } {
    // 按优先级检查各层限流
    const checks = [
      { tier: 'global', key: 'global' },
      { tier: 'ip', key: `ip:${context.ip}` },
      { tier: 'user', key: context.userId ? `user:${context.userId}` : null },
      { tier: 'api', key: `api:${context.apiPath}` }
    ];

    for (const check of checks) {
      if (!check.key) continue;

      let bucket = this.tiers.get(check.key);
      if (!bucket) {
        // 为新的 key 创建桶
        bucket = this.tiers.get(check.tier)!;
        this.tiers.set(check.key, new TokenBucket(
          bucket['capacity'],
          bucket['refillRate']
        ));
        bucket = this.tiers.get(check.key)!;
      }

      if (!bucket.tryAcquire()) {
        return { allowed: false, tier: check.tier };
      }
    }

    return { allowed: true };
  }
}
```

### 限流中间件

```typescript
// Express 限流中间件
import { Request, Response, NextFunction } from 'express';

function rateLimitMiddleware(
  limiter: MultiTierRateLimiter
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const context = {
      ip: req.ip || 'unknown',
      userId: (req as any).user?.id,
      apiPath: req.path
    };

    const result = limiter.tryAcquire(context);

    if (!result.allowed) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded at ${result.tier} tier`,
        retryAfter: 60
      });
      return;
    }

    next();
  };
}
```

## 综合实践：构建韧性服务

### 将所有模式组合在一起

```typescript
// resilient-service.ts
class ResilientServiceClient {
  private readonly circuitBreaker: CircuitBreaker;
  private readonly retryPolicy: RetryPolicy;
  private readonly rateLimiter: TokenBucket;
  private readonly timeoutMs: number;
  private readonly degradationManager: DegradationManager;

  constructor(serviceName: string, config: {
    circuitBreaker?: Partial<CircuitBreakerConfig>;
    retry?: Partial<RetryConfig>;
    rateLimit?: { capacity: number; refillRate: number };
    timeoutMs?: number;
  } = {}) {
    this.circuitBreaker = new CircuitBreaker(serviceName, config.circuitBreaker);
    this.retryPolicy = new RetryPolicy('exponential-jitter', config.retry);
    this.rateLimiter = new TokenBucket(
      config.rateLimit?.capacity ?? 100,
      config.rateLimit?.refillRate ?? 10
    );
    this.timeoutMs = config.timeoutMs ?? 5000;
    this.degradationManager = new DegradationManager(new HealthMetrics());
  }

  async call<T>(
    operation: () => Promise<T>,
    options: {
      fallback?: () => T | Promise<T>;
      skipRetry?: boolean;
      skipCircuitBreaker?: boolean;
    } = {}
  ): Promise<T> {
    // 1. 限流检查
    if (!this.rateLimiter.tryAcquire()) {
      if (options.fallback) {
        return options.fallback();
      }
      throw new Error('Rate limit exceeded');
    }

    // 2. 降级检查
    const degradationLevel = this.degradationManager.getLevel();
    if (degradationLevel >= DegradationLevel.STATIC && options.fallback) {
      return options.fallback();
    }

    // 3. 构建带韧性的操作
    const resilientOperation = async (): Promise<T> => {
      // 应用超时
      return TimeoutManager.withTimeout(operation(), this.timeoutMs);
    };

    // 4. 应用熔断器
    const circuitBreakerWrapped = options.skipCircuitBreaker
      ? resilientOperation
      : () => this.circuitBreaker.execute(resilientOperation);

    // 5. 应用重试
    try {
      if (options.skipRetry) {
        return await circuitBreakerWrapped();
      }
      return await this.retryPolicy.execute(circuitBreakerWrapped);
    } catch (error) {
      // 6. 降级到 fallback
      if (options.fallback) {
        console.warn('Operation failed, using fallback:', error);
        return options.fallback();
      }
      throw error;
    }
  }
}

// 使用示例
const orderServiceClient = new ResilientServiceClient('order-service', {
  circuitBreaker: {
    failureThreshold: 5,
    timeout: 30000
  },
  retry: {
    maxAttempts: 3,
    baseDelay: 1000
  },
  rateLimit: {
    capacity: 100,
    refillRate: 10
  },
  timeoutMs: 5000
});

async function getOrderDetails(orderId: string): Promise<Order> {
  return orderServiceClient.call(
    async () => {
      const response = await fetch(`/api/orders/${orderId}`);
      return response.json();
    },
    {
      fallback: async () => {
        // 从缓存获取或返回默认值
        return getCachedOrder(orderId) ?? createDefaultOrder(orderId);
      }
    }
  );
}
```

## 监控与可观测性

### 韧性指标收集

```typescript
// metrics.ts
interface ResiliencyMetrics {
  circuitBreakerState: string;
  circuitBreakerStateChanges: number;
  retryAttempts: number;
  retrySuccesses: number;
  timeouts: number;
  rateLimitRejections: number;
  degradationLevel: number;
  fallbackInvocations: number;
}

class ResiliencyMetricsCollector {
  private metrics: ResiliencyMetrics = {
    circuitBreakerState: 'CLOSED',
    circuitBreakerStateChanges: 0,
    retryAttempts: 0,
    retrySuccesses: 0,
    timeouts: 0,
    rateLimitRejections: 0,
    degradationLevel: 0,
    fallbackInvocations: 0
  };

  recordCircuitBreakerStateChange(newState: string): void {
    this.metrics.circuitBreakerState = newState;
    this.metrics.circuitBreakerStateChanges++;
  }

  recordRetryAttempt(success: boolean): void {
    this.metrics.retryAttempts++;
    if (success) {
      this.metrics.retrySuccesses++;
    }
  }

  recordTimeout(): void {
    this.metrics.timeouts++;
  }

  recordRateLimitRejection(): void {
    this.metrics.rateLimitRejections++;
  }

  recordDegradationLevel(level: number): void {
    this.metrics.degradationLevel = level;
  }

  recordFallbackInvocation(): void {
    this.metrics.fallbackInvocations++;
  }

  getMetrics(): ResiliencyMetrics {
    return { ...this.metrics };
  }

  // 导出为 Prometheus 格式
  toPrometheusFormat(): string {
    return `
# HELP circuit_breaker_state Current circuit breaker state
circuit_breaker_state{state="${this.metrics.circuitBreakerState}"} 1

# HELP retry_attempts_total Total number of retry attempts
retry_attempts_total ${this.metrics.retryAttempts}

# HELP retry_success_total Total number of successful retries
retry_success_total ${this.metrics.retrySuccesses}

# HELP timeout_total Total number of timeouts
timeout_total ${this.metrics.timeouts}

# HELP rate_limit_rejections_total Total number of rate limit rejections
rate_limit_rejections_total ${this.metrics.rateLimitRejections}

# HELP degradation_level Current degradation level
degradation_level ${this.metrics.degradationLevel}

# HELP fallback_invocations_total Total number of fallback invocations
fallback_invocations_total ${this.metrics.fallbackInvocations}
    `.trim();
  }
}
```

## 最佳实践总结

### 设计原则

1. **快速失败**：设置合理的超时，避免长时间等待
2. **隔离故障**：使用熔断器和舱壁模式隔离故障域
3. **优雅降级**：准备多级降级策略，确保核心功能可用
4. **限制资源**：使用限流保护系统免受过载
5. **可观测性**：收集关键指标，建立告警机制

### 配置建议

| 组件 | 推荐配置 | 说明 |
|------|----------|------|
| 熔断器 | 失败阈值 5-10 次，超时 30-60 秒 | 根据服务 SLA 调整 |
| 重试 | 最多 3 次，指数退避 + 抖动 | 避免重试风暴 |
| 超时 | P99 响应时间的 1.5-2 倍 | 使用自适应超时 |
| 限流 | 基于容量测试结果 | 留 20% 余量 |

### 测试韧性

使用混沌工程实践验证系统韧性：

```typescript
// 混沌测试示例
class ChaosMonkey {
  private failureRate: number = 0;

  setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }

  shouldFail(): boolean {
    return Math.random() < this.failureRate;
  }

  maybeThrow(error: Error = new Error('Chaos induced failure')): void {
    if (this.shouldFail()) {
      throw error;
    }
  }

  async maybeDelay(maxDelayMs: number): Promise<void> {
    if (this.shouldFail()) {
      const delay = Math.random() * maxDelayMs;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## 结语

系统韧性设计是构建可靠分布式系统的关键。通过熔断器、重试、超时、降级和限流等模式的组合使用，我们可以构建出能够优雅应对故障的系统。记住：故障是不可避免的，但系统崩溃是可以预防的。

在实践中，应该根据具体业务场景选择合适的韧性模式，并通过监控和混沌工程持续验证和优化系统的韧性能力。最终目标是让系统在面对各种异常情况时，仍能保持核心功能的可用性，为用户提供可靠的服务体验。
