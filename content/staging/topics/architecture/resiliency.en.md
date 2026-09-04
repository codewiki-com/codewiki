---
title: System Resiliency Design Guide
description: Master resiliency patterns for highly available systems
track: architecture
section: distributed
difficulty: advanced
tags:
  - Resiliency
  - High Availability
  - Circuit Breaker
  - Fallback
status: imported
origin: old/src/content/docs/architecture/resiliency.en.md
divergence: 0.259
issues: []
legacy:
  category: Architecture
  subcategory: Distributed
  order: 16
  lastUpdated: 2026-01-07
---

## Introduction

System resiliency is the ability of a system to handle failures gracefully and continue operating, possibly in a degraded mode, rather than failing completely. In distributed systems where network partitions, service failures, and hardware issues are inevitable, building resilient applications is not optional but essential for providing reliable user experiences.

The key insight driving resiliency engineering is that failures are not exceptions but expected behaviors. Rather than trying to prevent all failures, resilient systems are designed to detect, isolate, and recover from failures quickly. We'll cover the essential patterns that form the foundation of resilient distributed systems: circuit breakers, retries, timeouts, fallbacks, and rate limiting.

## Understanding Failure Modes

Before implementing resiliency patterns, it is crucial to understand the types of failures that can occur in distributed systems.

### Types of Failures

```
+----------------------------------------------------------+
|                    Failure Categories                      |
+----------------------------------------------------------+
|                                                           |
|  Transient Failures          Persistent Failures          |
|  +-------------------+       +-------------------+        |
|  | Network glitches  |       | Service crashes   |        |
|  | Timeout spikes    |       | Database down     |        |
|  | Resource contention|      | Configuration error|       |
|  | Garbage collection|       | Dependency failure |       |
|  +-------------------+       +-------------------+        |
|                                                           |
|  Cascading Failures          Byzantine Failures           |
|  +-------------------+       +-------------------+        |
|  | Chain reactions   |       | Corrupt responses |        |
|  | Resource exhaustion|      | Inconsistent state|        |
|  | Retry storms      |       | Partial failures  |        |
|  +-------------------+       +-------------------+        |
+----------------------------------------------------------+
```

### The Cost of Not Being Resilient

When systems lack resiliency, a single component failure can cascade through the entire system:

```
Single Point of Failure Cascade:

Service A (fails)
    |
    v
Service B (waiting) -----> Timeout
    |
    v
Service C (waiting) -----> Thread pool exhausted
    |
    v
Service D (waiting) -----> Memory pressure
    |
    v
Complete System Outage
```

A well-designed resilient system isolates failures and prevents this cascade effect through the patterns we will explore.

---

## Circuit Breaker Pattern

The circuit breaker pattern is inspired by electrical circuit breakers that prevent electrical fires by cutting power when a fault is detected. In software, circuit breakers prevent a system from repeatedly trying to execute an operation that is likely to fail.

### How Circuit Breakers Work

A circuit breaker maintains three states:

```
+----------------------------------------------------------+
|                Circuit Breaker States                      |
+----------------------------------------------------------+
|                                                           |
|   CLOSED                 OPEN                 HALF-OPEN   |
|   +--------+            +--------+            +--------+  |
|   | Normal |  Failures  | Block  |  Timeout  | Test    |  |
|   | Flow   | ---------> | All    | --------> | Single  |  |
|   +--------+  exceed    +--------+  expires  +--------+  |
|       ^       threshold      |                    |       |
|       |                      |                    |       |
|       +----------------------+--------------------+       |
|              Success              Failure                 |
|                                   returns to OPEN         |
+----------------------------------------------------------+
```

- **Closed**: Requests flow normally. Failures are counted.
- **Open**: Requests are immediately rejected without attempting the operation.
- **Half-Open**: A limited number of test requests are allowed through to check if the issue has been resolved.

### Implementation

```typescript
// circuit-breaker.ts
interface CircuitBreakerOptions {
  failureThreshold: number;      // Number of failures before opening
  successThreshold: number;      // Successes needed to close from half-open
  timeout: number;               // Time in ms before attempting half-open
  monitorInterval: number;       // Window for counting failures
}

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

class CircuitBreaker<T> {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(
    private readonly operation: () => Promise<T>,
    options: Partial<CircuitBreakerOptions> = {}
  ) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      successThreshold: options.successThreshold ?? 2,
      timeout: options.timeout ?? 30000,
      monitorInterval: options.monitorInterval ?? 10000
    };
  }

  async execute(): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        console.log('Circuit breaker entering HALF_OPEN state');
      } else {
        throw new CircuitOpenError('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await this.operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.options.timeout;
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.reset();
        console.log('Circuit breaker CLOSED after successful recovery');
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.successCount = 0;
      console.log('Circuit breaker returned to OPEN state');
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.log('Circuit breaker OPENED due to failures');
    }
  }

  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
}
```

### Using the Circuit Breaker

```typescript
// payment-service.ts
class PaymentService {
  private circuitBreaker: CircuitBreaker<PaymentResult>;

  constructor(private readonly paymentGateway: PaymentGateway) {
    this.circuitBreaker = new CircuitBreaker(
      () => this.paymentGateway.processPayment(),
      {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 30000
      }
    );
  }

  async processPayment(amount: number, cardToken: string): Promise<PaymentResult> {
    try {
      return await this.circuitBreaker.execute();
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        // Circuit is open - use fallback strategy
        console.log('Payment gateway unavailable, queuing payment');
        return this.queuePaymentForRetry(amount, cardToken);
      }
      throw error;
    }
  }

  private async queuePaymentForRetry(
    amount: number,
    cardToken: string
  ): Promise<PaymentResult> {
    // Queue the payment for later processing
    await this.paymentQueue.add({
      amount,
      cardToken,
      createdAt: new Date()
    });

    return {
      status: 'pending',
      message: 'Payment queued for processing'
    };
  }
}
```

### Using Existing Libraries

In production, consider using battle-tested libraries like opossum:

```typescript
import CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(asyncFunctionThatMightFail, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

breaker.on('open', () => console.log('Circuit opened'));
breaker.on('halfOpen', () => console.log('Circuit half-opened'));
breaker.on('close', () => console.log('Circuit closed'));

breaker.fallback(() => 'Fallback response');

const result = await breaker.fire();
```

---

## Retry Pattern

The retry pattern handles transient failures by automatically retrying failed operations. However, naive retry implementations can make problems worse, so careful design is essential.

### Retry Strategies

```
+----------------------------------------------------------+
|                    Retry Strategies                        |
+----------------------------------------------------------+
|                                                           |
|  Immediate Retry     Fixed Delay      Exponential Backoff |
|  +-----------+      +-----------+      +-----------+      |
|  | Attempt 1 |      | Attempt 1 |      | Attempt 1 |      |
|  | Attempt 2 |      | 1s delay  |      | 1s delay  |      |
|  | Attempt 3 |      | Attempt 2 |      | Attempt 2 |      |
|  +-----------+      | 1s delay  |      | 2s delay  |      |
|                     | Attempt 3 |      | Attempt 3 |      |
|                     +-----------+      | 4s delay  |      |
|                                        | Attempt 4 |      |
|                                        +-----------+      |
|                                                           |
|  Best for: Quick    Best for:         Best for:          |
|  transient issues   Known delays      Unknown/variable   |
|                                        recovery times     |
+----------------------------------------------------------+
```

### Exponential Backoff with Jitter

Exponential backoff increases the delay between retries exponentially, reducing the load on a struggling service. Adding jitter (randomization) prevents the "thundering herd" problem where all clients retry at the same time.

```typescript
// retry.ts
interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number;          // 0 to 1, amount of randomization
  retryableErrors?: string[];    // Error types that should trigger retry
}

const defaultRetryOptions: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1
};

async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...defaultRetryOptions, ...options };
  let lastError: Error | null = null;
  let delay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if this error should be retried
      if (!isRetryable(error, config.retryableErrors)) {
        throw error;
      }

      if (attempt === config.maxAttempts) {
        break;
      }

      // Calculate delay with jitter
      const jitter = delay * config.jitterFactor * (Math.random() * 2 - 1);
      const actualDelay = Math.min(delay + jitter, config.maxDelayMs);

      console.log(
        `Attempt ${attempt} failed, retrying in ${actualDelay.toFixed(0)}ms...`
      );

      await sleep(actualDelay);

      // Exponential backoff
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  throw new RetryExhaustedError(
    `All ${config.maxAttempts} retry attempts failed`,
    lastError!
  );
}

function isRetryable(error: unknown, retryableErrors?: string[]): boolean {
  if (!retryableErrors || retryableErrors.length === 0) {
    // Default: retry on network and timeout errors
    if (error instanceof Error) {
      return (
        error.name === 'NetworkError' ||
        error.name === 'TimeoutError' ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT')
      );
    }
  }

  if (error instanceof Error && retryableErrors) {
    return retryableErrors.includes(error.name);
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class RetryExhaustedError extends Error {
  constructor(message: string, public readonly lastError: Error) {
    super(message);
    this.name = 'RetryExhaustedError';
  }
}
```

### Using the Retry Pattern

```typescript
// api-client.ts
class ApiClient {
  async fetchUserData(userId: string): Promise<User> {
    return withRetry(
      async () => {
        const response = await fetch(`/api/users/${userId}`, {
          signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
          if (response.status >= 500) {
            throw new RetryableHttpError(response.status);
          }
          throw new HttpError(response.status);
        }

        return response.json();
      },
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        retryableErrors: ['RetryableHttpError', 'NetworkError']
      }
    );
  }
}

class RetryableHttpError extends Error {
  constructor(public readonly statusCode: number) {
    super(`HTTP ${statusCode}`);
    this.name = 'RetryableHttpError';
  }
}

class HttpError extends Error {
  constructor(public readonly statusCode: number) {
    super(`HTTP ${statusCode}`);
    this.name = 'HttpError';
  }
}
```

### Retry Considerations

When implementing retries, keep these principles in mind:

1. **Idempotency**: Only retry operations that are safe to repeat. Non-idempotent operations (like payments) need special handling.

2. **Retry Budget**: Limit the total number of retries across the system to prevent retry storms.

3. **Selective Retrying**: Not all errors should be retried. A 404 Not Found will never succeed no matter how many times you retry.

```typescript
// Idempotency key for safe retries
async function createOrderWithIdempotency(
  orderData: OrderData,
  idempotencyKey: string
): Promise<Order> {
  return withRetry(async () => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      throw new Error(`Order creation failed: ${response.status}`);
    }

    return response.json();
  });
}
```

---

## Timeout Pattern

Timeouts prevent requests from hanging indefinitely and help maintain system responsiveness. They are essential for freeing up resources when dependencies are slow or unresponsive.

### Timeout Strategy

```
+----------------------------------------------------------+
|                    Timeout Hierarchy                       |
+----------------------------------------------------------+
|                                                           |
|  Client Request                                           |
|  +----------------------------------------------------+   |
|  | Overall Request Timeout: 30s                       |   |
|  |                                                    |   |
|  |  Service A Call          Service B Call            |   |
|  |  +------------------+    +------------------+      |   |
|  |  | Timeout: 5s      |    | Timeout: 10s     |      |   |
|  |  |                  |    |                  |      |   |
|  |  |  DB Query: 2s    |    |  External API    |      |   |
|  |  |  Cache: 100ms    |    |  Timeout: 8s     |      |   |
|  |  +------------------+    +------------------+      |   |
|  +----------------------------------------------------+   |
|                                                           |
|  Rule: Inner timeouts < Outer timeouts                    |
|  Always leave buffer for processing                       |
+----------------------------------------------------------+
```

### Implementation

```typescript
// timeout.ts
class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  operationName: string = 'Operation'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(
        `${operationName} timed out after ${timeoutMs}ms`
      ));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

// Cancellable timeout with AbortController
async function withCancellableTimeout<T>(
  operationFactory: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await operationFactory(controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### Practical Usage

```typescript
// user-service.ts
class UserService {
  private readonly httpTimeout = 5000;
  private readonly cacheTimeout = 100;

  async getUser(userId: string): Promise<User> {
    // Try cache first with short timeout
    try {
      const cached = await withTimeout(
        this.cache.get(`user:${userId}`),
        this.cacheTimeout,
        'Cache lookup'
      );
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      // Cache miss or timeout - continue to database
      if (!(error instanceof TimeoutError)) {
        console.warn('Cache error:', error);
      }
    }

    // Fetch from database with longer timeout
    const user = await withTimeout(
      this.database.findUser(userId),
      this.httpTimeout,
      'Database query'
    );

    // Update cache asynchronously (fire and forget)
    this.cache.set(`user:${userId}`, JSON.stringify(user)).catch(err => {
      console.warn('Failed to update cache:', err);
    });

    return user;
  }
}
```

### Timeout with Fetch API

```typescript
// Modern fetch with timeout using AbortController
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Usage
try {
  const response = await fetchWithTimeout(
    'https://api.example.com/data',
    { method: 'GET' },
    3000
  );
  const data = await response.json();
} catch (error) {
  if (error instanceof TimeoutError) {
    console.log('Request timed out, using cached data');
    return getCachedData();
  }
  throw error;
}
```

---

## Fallback Pattern

The fallback pattern provides alternative behavior when the primary operation fails. This ensures the system can continue to function, even if in a degraded mode.

### Fallback Strategies

```
+----------------------------------------------------------+
|                   Fallback Strategies                      |
+----------------------------------------------------------+
|                                                           |
|  1. Cached Data         2. Default Value                  |
|  +----------------+     +----------------+                |
|  | Return last    |     | Return safe    |                |
|  | known good     |     | default        |                |
|  | response       |     | response       |                |
|  +----------------+     +----------------+                |
|                                                           |
|  3. Degraded Service    4. Alternative Service            |
|  +----------------+     +----------------+                |
|  | Reduced        |     | Use backup     |                |
|  | functionality  |     | service or     |                |
|  | subset of data |     | provider       |                |
|  +----------------+     +----------------+                |
|                                                           |
|  5. Queue for Later     6. Graceful Error                 |
|  +----------------+     +----------------+                |
|  | Accept request |     | Informative    |                |
|  | process async  |     | error message  |                |
|  +----------------+     +----------------+                |
+----------------------------------------------------------+
```

### Implementation

```typescript
// fallback.ts
interface FallbackOptions<T> {
  cache?: () => Promise<T | null>;
  defaultValue?: T;
  alternativeService?: () => Promise<T>;
  onFallback?: (strategy: string, error: Error) => void;
}

async function withFallback<T>(
  primaryOperation: () => Promise<T>,
  options: FallbackOptions<T>
): Promise<T> {
  try {
    return await primaryOperation();
  } catch (primaryError) {
    const error = primaryError as Error;

    // Strategy 1: Try cache
    if (options.cache) {
      try {
        const cachedValue = await options.cache();
        if (cachedValue !== null) {
          options.onFallback?.('cache', error);
          return cachedValue;
        }
      } catch (cacheError) {
        console.warn('Cache fallback failed:', cacheError);
      }
    }

    // Strategy 2: Try alternative service
    if (options.alternativeService) {
      try {
        const result = await options.alternativeService();
        options.onFallback?.('alternative', error);
        return result;
      } catch (altError) {
        console.warn('Alternative service fallback failed:', altError);
      }
    }

    // Strategy 3: Return default value
    if (options.defaultValue !== undefined) {
      options.onFallback?.('default', error);
      return options.defaultValue;
    }

    // No fallback available
    throw error;
  }
}
```

### Practical Examples

```typescript
// product-service.ts
class ProductService {
  async getProductRecommendations(userId: string): Promise<Product[]> {
    return withFallback(
      // Primary: personalized recommendations from ML service
      () => this.mlService.getPersonalizedRecommendations(userId),
      {
        // Fallback 1: cached recommendations
        cache: () => this.cache.get(`recommendations:${userId}`),

        // Fallback 2: popular products (degraded experience)
        alternativeService: () => this.getPopularProducts(),

        // Fallback 3: empty array (system still works)
        defaultValue: [],

        onFallback: (strategy, error) => {
          this.metrics.increment('recommendations.fallback', {
            strategy,
            error: error.name
          });
        }
      }
    );
  }

  private async getPopularProducts(): Promise<Product[]> {
    // Return top 10 popular products as fallback
    return this.productRepository.findPopular({ limit: 10 });
  }
}

// search-service.ts
class SearchService {
  async search(query: string): Promise<SearchResults> {
    return withFallback(
      // Primary: full-text search with Elasticsearch
      () => this.elasticsearch.search(query),
      {
        // Fallback: basic database search
        alternativeService: () => this.databaseSearch(query),

        // Default: empty results
        defaultValue: {
          items: [],
          total: 0,
          message: 'Search is temporarily unavailable'
        },

        onFallback: (strategy) => {
          console.log(`Search using fallback: ${strategy}`);
        }
      }
    );
  }

  private async databaseSearch(query: string): Promise<SearchResults> {
    // Simple LIKE query as fallback
    const results = await this.db.query(
      `SELECT * FROM products WHERE name ILIKE $1 LIMIT 20`,
      [`%${query}%`]
    );
    return { items: results, total: results.length };
  }
}
```

### Combining Fallback with Circuit Breaker

```typescript
// resilient-service.ts
class ResilientPaymentService {
  private primaryBreaker: CircuitBreaker<PaymentResult>;
  private backupBreaker: CircuitBreaker<PaymentResult>;

  constructor(
    private primaryGateway: PaymentGateway,
    private backupGateway: PaymentGateway
  ) {
    this.primaryBreaker = new CircuitBreaker(
      () => this.primaryGateway.process(),
      { failureThreshold: 3, timeout: 30000 }
    );

    this.backupBreaker = new CircuitBreaker(
      () => this.backupGateway.process(),
      { failureThreshold: 5, timeout: 60000 }
    );
  }

  async processPayment(payment: PaymentRequest): Promise<PaymentResult> {
    // Try primary gateway
    try {
      return await this.primaryBreaker.execute();
    } catch (primaryError) {
      console.log('Primary payment gateway failed, trying backup');

      // Fallback to backup gateway
      try {
        return await this.backupBreaker.execute();
      } catch (backupError) {
        console.log('Backup payment gateway also failed');

        // Final fallback: queue for manual processing
        return this.queueForManualProcessing(payment);
      }
    }
  }

  private async queueForManualProcessing(
    payment: PaymentRequest
  ): Promise<PaymentResult> {
    await this.paymentQueue.add(payment);
    return {
      status: 'pending_manual_review',
      message: 'Payment queued for processing. You will be notified.'
    };
  }
}
```

---

## Rate Limiting

Rate limiting controls the rate at which requests are processed, protecting services from being overwhelmed and ensuring fair resource allocation.

### Rate Limiting Strategies

```
+----------------------------------------------------------+
|                Rate Limiting Algorithms                    |
+----------------------------------------------------------+
|                                                           |
|  Token Bucket              Sliding Window                 |
|  +------------------+      +------------------+           |
|  | Tokens added at  |      | Count requests   |           |
|  | fixed rate       |      | in sliding time  |           |
|  | Burst allowed    |      | window           |           |
|  +------------------+      +------------------+           |
|                                                           |
|  Fixed Window              Leaky Bucket                   |
|  +------------------+      +------------------+           |
|  | Reset counter at |      | Process at       |           |
|  | fixed intervals  |      | constant rate    |           |
|  | Simple to impl   |      | Smooth output    |           |
|  +------------------+      +------------------+           |
+----------------------------------------------------------+
```

### Token Bucket Implementation

```typescript
// rate-limiter.ts
class TokenBucket {
  private tokens: number;
  private lastRefillTime: number;

  constructor(
    private readonly capacity: number,
    private readonly refillRate: number  // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefillTime = Date.now();
  }

  tryConsume(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTime) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }
}

// Sliding window rate limiter
class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    let timestamps = this.requests.get(identifier) || [];

    // Remove expired timestamps
    timestamps = timestamps.filter(ts => ts > windowStart);

    if (timestamps.length >= this.maxRequests) {
      this.requests.set(identifier, timestamps);
      return false;
    }

    // Add current request
    timestamps.push(now);
    this.requests.set(identifier, timestamps);
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = this.requests.get(identifier) || [];
    const validRequests = timestamps.filter(ts => ts > windowStart).length;
    return Math.max(0, this.maxRequests - validRequests);
  }
}
```

### Rate Limiting Middleware

```typescript
// rate-limit-middleware.ts
import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
}

function rateLimitMiddleware(config: RateLimitConfig) {
  const limiter = new SlidingWindowRateLimiter(
    config.windowMs,
    config.maxRequests
  );

  const getKey = config.keyGenerator || ((req) => {
    return req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  });

  return (req: Request, res: Response, next: NextFunction) => {
    const key = getKey(req);

    if (!limiter.isAllowed(key)) {
      const remaining = limiter.getRemainingRequests(key);

      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('Retry-After', Math.ceil(config.windowMs / 1000));

      if (config.handler) {
        return config.handler(req, res);
      }

      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(config.windowMs / 1000)} seconds.`
      });
    }

    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', limiter.getRemainingRequests(key));

    next();
  };
}

// Usage
app.use('/api/', rateLimitMiddleware({
  windowMs: 60 * 1000,     // 1 minute
  maxRequests: 100,        // 100 requests per minute
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: 60
    });
  }
}));
```

### Distributed Rate Limiting with Redis

```typescript
// redis-rate-limiter.ts
import Redis from 'ioredis';

class RedisRateLimiter {
  constructor(private readonly redis: Redis) {}

  async isAllowed(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / (windowSeconds * 1000))}`;

    const pipeline = this.redis.pipeline();
    pipeline.incr(windowKey);
    pipeline.pttl(windowKey);

    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Redis pipeline failed');
    }

    const [[, count], [, ttl]] = results as [[null, number], [null, number]];

    // Set expiry on first request in window
    if (ttl === -1) {
      await this.redis.expire(windowKey, windowSeconds);
    }

    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetTime = now + (ttl > 0 ? ttl : windowSeconds * 1000);

    return { allowed, remaining, resetTime };
  }
}

// Usage in middleware
async function distributedRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const rateLimiter = new RedisRateLimiter(redisClient);
  const key = req.user?.id || req.ip;

  const { allowed, remaining, resetTime } = await rateLimiter.isAllowed(
    key,
    100,  // 100 requests
    60    // per 60 seconds
  );

  res.setHeader('X-RateLimit-Limit', 100);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

  if (!allowed) {
    return res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
    });
  }

  next();
}
```

---

## Combining Patterns

In production systems, these patterns are often combined to create comprehensive resiliency strategies.

### Resilient HTTP Client

```typescript
// resilient-http-client.ts
interface ResilientClientOptions {
  baseUrl: string;
  timeout: number;
  retryOptions: Partial<RetryOptions>;
  circuitBreakerOptions: Partial<CircuitBreakerOptions>;
  rateLimitPerSecond?: number;
}

class ResilientHttpClient {
  private circuitBreaker: CircuitBreaker<Response>;
  private rateLimiter: TokenBucket;

  constructor(private readonly options: ResilientClientOptions) {
    this.circuitBreaker = new CircuitBreaker(
      async () => new Response(),  // Placeholder
      options.circuitBreakerOptions
    );

    this.rateLimiter = new TokenBucket(
      options.rateLimitPerSecond || 100,
      options.rateLimitPerSecond || 100
    );
  }

  async request<T>(
    path: string,
    requestOptions: RequestInit = {}
  ): Promise<T> {
    // 1. Check rate limit
    if (!this.rateLimiter.tryConsume()) {
      throw new RateLimitExceededError('Client rate limit exceeded');
    }

    // 2. Execute with circuit breaker
    const operation = async () => {
      // 3. With retry
      return withRetry(
        async () => {
          // 4. With timeout
          const response = await fetchWithTimeout(
            `${this.options.baseUrl}${path}`,
            requestOptions,
            this.options.timeout
          );

          if (!response.ok) {
            throw new HttpError(response.status);
          }

          return response.json();
        },
        this.options.retryOptions
      );
    };

    // 5. Execute through circuit breaker with fallback
    try {
      return await this.circuitBreaker.execute();
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        // Return cached data or throw
        const cached = await this.getCachedResponse(path);
        if (cached) {
          return cached as T;
        }
      }
      throw error;
    }
  }

  private async getCachedResponse(path: string): Promise<unknown> {
    // Implementation depends on your caching strategy
    return null;
  }
}

class RateLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitExceededError';
  }
}
```

### Complete Service Example

```typescript
// order-service.ts
class ResilientOrderService {
  private inventoryClient: ResilientHttpClient;
  private paymentClient: ResilientHttpClient;
  private notificationClient: ResilientHttpClient;

  constructor() {
    this.inventoryClient = new ResilientHttpClient({
      baseUrl: 'http://inventory-service',
      timeout: 3000,
      retryOptions: { maxAttempts: 3 },
      circuitBreakerOptions: { failureThreshold: 5 }
    });

    this.paymentClient = new ResilientHttpClient({
      baseUrl: 'http://payment-service',
      timeout: 10000,
      retryOptions: { maxAttempts: 2 },
      circuitBreakerOptions: { failureThreshold: 3 }
    });

    this.notificationClient = new ResilientHttpClient({
      baseUrl: 'http://notification-service',
      timeout: 2000,
      retryOptions: { maxAttempts: 1 },
      circuitBreakerOptions: { failureThreshold: 10 }
    });
  }

  async createOrder(orderData: CreateOrderData): Promise<Order> {
    // Check inventory with fallback
    const inventoryAvailable = await withFallback(
      () => this.inventoryClient.request<boolean>(
        `/check/${orderData.productId}`
      ),
      {
        cache: () => this.getLastKnownInventory(orderData.productId),
        defaultValue: true  // Optimistic - accept order, verify later
      }
    );

    if (!inventoryAvailable) {
      throw new OutOfStockError(orderData.productId);
    }

    // Create order in database
    const order = await this.orderRepository.create(orderData);

    // Process payment (critical - no fallback to default)
    try {
      await this.paymentClient.request('/process', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order.id,
          amount: order.total,
          idempotencyKey: order.id
        })
      });
    } catch (error) {
      // Mark order for manual review
      await this.orderRepository.update(order.id, {
        status: 'payment_pending',
        paymentError: (error as Error).message
      });
    }

    // Send notification (non-critical - fire and forget with fallback)
    this.sendNotificationAsync(order).catch(err => {
      console.warn('Notification failed:', err);
    });

    return order;
  }

  private async sendNotificationAsync(order: Order): Promise<void> {
    await withFallback(
      () => this.notificationClient.request('/send', {
        method: 'POST',
        body: JSON.stringify({
          type: 'order_created',
          userId: order.userId,
          orderId: order.id
        })
      }),
      {
        alternativeService: () => this.queueNotification(order),
        defaultValue: undefined  // Silently fail
      }
    );
  }
}
```

---

## Monitoring and Observability

Resiliency patterns must be observable to be effective. Monitor these key metrics:

### Key Metrics

```typescript
// metrics.ts
import { Counter, Histogram, Gauge } from 'prom-client';

// Circuit breaker metrics
const circuitBreakerState = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Current circuit breaker state (0=closed, 1=open, 2=half-open)',
  labelNames: ['service', 'operation']
});

const circuitBreakerTransitions = new Counter({
  name: 'circuit_breaker_transitions_total',
  help: 'Number of circuit breaker state transitions',
  labelNames: ['service', 'from_state', 'to_state']
});

// Retry metrics
const retryAttempts = new Counter({
  name: 'retry_attempts_total',
  help: 'Number of retry attempts',
  labelNames: ['service', 'operation', 'attempt']
});

const retryExhausted = new Counter({
  name: 'retry_exhausted_total',
  help: 'Number of times retries were exhausted',
  labelNames: ['service', 'operation']
});

// Timeout metrics
const timeoutCount = new Counter({
  name: 'timeout_total',
  help: 'Number of timeouts',
  labelNames: ['service', 'operation']
});

// Fallback metrics
const fallbackActivations = new Counter({
  name: 'fallback_activations_total',
  help: 'Number of fallback activations',
  labelNames: ['service', 'operation', 'strategy']
});

// Rate limiting metrics
const rateLimitRejections = new Counter({
  name: 'rate_limit_rejections_total',
  help: 'Number of rate limit rejections',
  labelNames: ['endpoint', 'client_type']
});

// Request latency
const requestLatency = new Histogram({
  name: 'request_latency_seconds',
  help: 'Request latency in seconds',
  labelNames: ['service', 'operation', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});
```

### Dashboard Alerts

Set up alerts for these conditions:

```yaml
# prometheus-alerts.yml
groups:
  - name: resiliency
    rules:
      - alert: CircuitBreakerOpen
        expr: circuit_breaker_state == 1
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Circuit breaker is open for {{ $labels.service }}"

      - alert: HighRetryRate
        expr: rate(retry_attempts_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High retry rate for {{ $labels.service }}"

      - alert: HighTimeoutRate
        expr: rate(timeout_total[5m]) > 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High timeout rate for {{ $labels.service }}"

      - alert: FallbackActivated
        expr: increase(fallback_activations_total[5m]) > 0
        labels:
          severity: info
        annotations:
          summary: "Fallback activated for {{ $labels.service }}"
```

---

## Best Practices

### Design Principles

1. **Fail Fast**: Detect failures quickly and respond immediately rather than letting requests hang.

2. **Fail Gracefully**: When failure is unavoidable, degrade gracefully rather than crash completely.

3. **Isolate Failures**: Prevent failures in one component from cascading to others.

4. **Recovery Oriented**: Design for quick recovery, not just failure prevention.

### Configuration Guidelines

```typescript
// Recommended defaults based on service criticality
const resilencyProfiles = {
  critical: {
    // Payment, authentication
    circuitBreaker: {
      failureThreshold: 3,
      timeout: 60000,
      successThreshold: 5
    },
    retry: {
      maxAttempts: 2,
      initialDelayMs: 500
    },
    timeout: 10000
  },
  standard: {
    // Most business services
    circuitBreaker: {
      failureThreshold: 5,
      timeout: 30000,
      successThreshold: 2
    },
    retry: {
      maxAttempts: 3,
      initialDelayMs: 1000
    },
    timeout: 5000
  },
  nonCritical: {
    // Notifications, analytics
    circuitBreaker: {
      failureThreshold: 10,
      timeout: 15000,
      successThreshold: 1
    },
    retry: {
      maxAttempts: 1,
      initialDelayMs: 500
    },
    timeout: 2000
  }
};
```

### Testing Resiliency

```typescript
// chaos-testing.ts
class ChaosMonkey {
  private failureRate: number = 0;
  private latencyMs: number = 0;

  injectFailure(rate: number): void {
    this.failureRate = rate;
  }

  injectLatency(ms: number): void {
    this.latencyMs = ms;
  }

  async maybeApplyChaos(): Promise<void> {
    if (this.latencyMs > 0) {
      await sleep(this.latencyMs);
    }

    if (Math.random() < this.failureRate) {
      throw new Error('Chaos monkey struck!');
    }
  }
}

// Use in tests
describe('OrderService Resiliency', () => {
  const chaos = new ChaosMonkey();

  it('should handle payment service failures', async () => {
    chaos.injectFailure(1.0);  // 100% failure rate

    const result = await orderService.createOrder(testOrder);

    expect(result.status).toBe('payment_pending');
    expect(result.paymentError).toBeDefined();
  });

  it('should handle high latency gracefully', async () => {
    chaos.injectLatency(10000);  // 10 second delay

    await expect(orderService.createOrder(testOrder))
      .rejects
      .toThrow('timeout');
  });
});
```

---

## Summary

Building resilient systems requires a combination of patterns working together:

| Pattern | Purpose | When to Use |
|---------|---------|-------------|
| Circuit Breaker | Prevent cascade failures | External service calls |
| Retry | Handle transient failures | Idempotent operations |
| Timeout | Prevent resource exhaustion | All remote calls |
| Fallback | Maintain functionality | Non-critical features |
| Rate Limiting | Protect from overload | API endpoints, shared resources |

Remember these key principles:

1. **Expect Failure**: Design for failure from the start, not as an afterthought
2. **Degrade Gracefully**: Provide reduced functionality rather than complete failure
3. **Recover Quickly**: Focus on mean time to recovery (MTTR) not just mean time between failures (MTBF)
4. **Monitor Everything**: You cannot improve what you cannot measure
5. **Test Resiliency**: Use chaos engineering to validate your patterns work

## Further Reading

### Books

- "Release It!" by Michael T. Nygard - The definitive guide to designing for production
- "Site Reliability Engineering" by Google - SRE practices and principles
- "Designing Data-Intensive Applications" by Martin Kleppmann - Distributed systems foundations

### Resources

- [Microsoft Azure - Cloud Design Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/) - Comprehensive pattern catalog
- [Netflix Tech Blog](https://netflixtechblog.com/) - Real-world resiliency engineering
- [AWS Well-Architected Framework - Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/) - Cloud resiliency best practices
- [Hystrix Wiki](https://github.com/Netflix/Hystrix/wiki) - Circuit breaker concepts (archived but educational)
- [Resilience4j](https://resilience4j.readme.io/) - Modern fault tolerance library documentation
