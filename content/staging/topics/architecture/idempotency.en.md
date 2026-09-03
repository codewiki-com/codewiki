---
title: Idempotency Design
description: A comprehensive guide to designing idempotent APIs and operations for reliable distributed systems
track: architecture
section: distributed
difficulty: intermediate
tags:
  - Idempotency
  - API Design
  - Distributed Systems
  - Reliability
  - Fault Tolerance
  - Retry Logic
  - Microservices
status: imported
origin: old/src/content/docs/architecture/idempotency.en.md
divergence: 0.228
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Architecture
  subcategory: ""
  order: 6
  lastUpdated: 2026-01-21
---

In distributed systems, network failures, timeouts, and retries are inevitable. Idempotency is a critical design principle that ensures operations can be safely retried without causing unintended side effects. This article explores idempotency concepts, implementation patterns, and best practices for building reliable systems that gracefully handle the realities of distributed computing.

## Concept Explanation

### What is Idempotency?

**Idempotency** is the property of an operation where performing it multiple times produces the same result as performing it once. In mathematical terms, an operation `f` is idempotent if `f(f(x)) = f(x)`.

```
Idempotent Operation:
Request 1: Create user with ID=123 → User created (201)
Request 2: Create user with ID=123 → User already exists (200 or 409)
Request 3: Create user with ID=123 → User already exists (200 or 409)
                                      ↓
              Result: Only ONE user exists with ID=123

Non-Idempotent Operation:
Request 1: Increment counter → Counter = 1
Request 2: Increment counter → Counter = 2
Request 3: Increment counter → Counter = 3
                                ↓
              Result: Counter incremented THREE times!
```

### Why Idempotency Matters

In distributed systems, several scenarios make idempotency essential:

```
Scenario 1: Network Timeout
┌────────┐                        ┌────────┐
│ Client │ ─── Request ───────▶  │ Server │
│        │                        │        │
│        │ ← (timeout, no        │ (Processed!)
│        │    response)           │        │
│        │                        │        │
│        │ ─── Retry Request ──▶  │        │
│        │                        │ (Duplicate!)
└────────┘                        └────────┘

Without idempotency: Payment charged twice!
With idempotency: Payment charged once, second request ignored.

Scenario 2: Client Retry After Crash
┌────────┐                        ┌────────┐
│ Client │ ─── Request ───────▶  │ Server │
│        │                        │        │
│ CRASH! │ ← Response (lost)     │ (Processed!)
│        │                        │        │
│(Restart)│                       │        │
│        │ ─── Same Request ────▶ │        │
└────────┘                        └────────┘

Without idempotency: Order created twice!
With idempotency: Same order returned.
```

### HTTP Methods and Idempotency

According to HTTP specifications:

| Method | Idempotent | Safe | Description |
|--------|------------|------|-------------|
| GET | Yes | Yes | Retrieve resource, no side effects |
| HEAD | Yes | Yes | Like GET but no body |
| PUT | Yes | No | Replace entire resource |
| DELETE | Yes | No | Remove resource |
| POST | **No** | No | Create resource, process data |
| PATCH | **No** | No | Partial update |
| OPTIONS | Yes | Yes | Get communication options |

```typescript
// GET - Naturally idempotent
GET /users/123
// Returns same user regardless of how many times called

// PUT - Idempotent by design
PUT /users/123
{ "name": "John", "email": "john@example.com" }
// Replaces user 123 completely - same result each time

// DELETE - Idempotent
DELETE /users/123
// First call: Deletes user, returns 200/204
// Subsequent calls: User not found, returns 404 (but state is same)

// POST - NOT idempotent by default
POST /orders
{ "items": [...] }
// Each call creates a NEW order - dangerous for retries!
```

### The Problem with Non-Idempotent Operations

```typescript
// Payment processing without idempotency
async function processPayment(amount: number, cardId: string): Promise<Payment> {
  const payment = await paymentGateway.charge({
    amount,
    cardId,
    timestamp: new Date()
  });

  return payment;
}

// Client code with retry logic
async function makePayment(amount: number, cardId: string): Promise<Payment> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await processPayment(amount, cardId);
    } catch (error) {
      if (error.code === 'TIMEOUT' && attempt < 2) {
        continue; // Retry - DANGER! Payment might have succeeded!
      }
      throw error;
    }
  }
}

// Result: Customer might be charged 3 times for 1 purchase!
```

## Core Principles

### Principle 1: Idempotency Keys

Use client-generated unique keys to identify requests:

```typescript
// Client generates a unique key for each logical operation
interface IdempotentRequest {
  idempotencyKey: string;  // Client-generated UUID
  payload: any;
}

// Server checks if request was already processed
class IdempotentHandler {
  private processedRequests: Map<string, ProcessedResult> = new Map();

  async handle(request: IdempotentRequest): Promise<Response> {
    const { idempotencyKey, payload } = request;

    // Check if already processed
    const existing = await this.getProcessedResult(idempotencyKey);
    if (existing) {
      // Return cached result
      return existing.response;
    }

    // Process new request
    const result = await this.processRequest(payload);

    // Store result for future duplicate requests
    await this.storeResult(idempotencyKey, result);

    return result;
  }
}
```

### Principle 2: Atomic Check-and-Process

The check for existing request and processing must be atomic:

```typescript
// Anti-pattern: Race condition
async function nonAtomicHandler(key: string, payload: any): Promise<Result> {
  const existing = await cache.get(key);
  if (existing) return existing;

  // Race condition window! Another request might process between check and store
  const result = await process(payload);
  await cache.set(key, result);

  return result;
}

// Better: Use database transactions or locks
async function atomicHandler(key: string, payload: any): Promise<Result> {
  return await database.transaction(async (tx) => {
    // Atomic: lock the key
    const existing = await tx.query(
      'SELECT result FROM idempotency_keys WHERE key = $1 FOR UPDATE',
      [key]
    );

    if (existing.rows.length > 0) {
      return JSON.parse(existing.rows[0].result);
    }

    // Insert key to prevent duplicates
    await tx.query(
      'INSERT INTO idempotency_keys (key, status) VALUES ($1, $2)',
      [key, 'processing']
    );

    // Process
    const result = await process(payload);

    // Update with result
    await tx.query(
      'UPDATE idempotency_keys SET result = $1, status = $2 WHERE key = $3',
      [JSON.stringify(result), 'completed', key]
    );

    return result;
  });
}
```

### Principle 3: Natural Idempotency

Design operations to be naturally idempotent when possible:

```typescript
// Non-idempotent: Incremental operation
UPDATE accounts SET balance = balance + 100 WHERE id = 123;
// Each execution changes the state

// Idempotent: Absolute operation
UPDATE accounts SET balance = 1100 WHERE id = 123;
// Multiple executions result in same state

// Non-idempotent: Status change
UPDATE orders SET status = 'next_status' WHERE id = 123;
// Depends on current state

// Idempotent: Conditional status change
UPDATE orders
SET status = 'shipped'
WHERE id = 123 AND status = 'paid';
// Only changes if in expected state
```

### Principle 4: Request Deduplication Window

Store idempotency results for a reasonable time window:

```typescript
interface IdempotencyConfig {
  ttl: number;  // Time to live for stored results
  storageType: 'memory' | 'redis' | 'database';
}

class IdempotencyStore {
  private readonly ttl: number;

  constructor(config: IdempotencyConfig) {
    this.ttl = config.ttl || 24 * 60 * 60 * 1000; // Default: 24 hours
  }

  async store(key: string, result: any): Promise<void> {
    await this.storage.set(key, {
      result,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ttl
    });
  }

  async get(key: string): Promise<any | null> {
    const entry = await this.storage.get(key);

    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      await this.storage.delete(key);
      return null;
    }

    return entry.result;
  }

  // Cleanup expired entries
  async cleanup(): Promise<void> {
    const now = Date.now();
    await this.storage.deleteWhere({ expiresAt: { $lt: now } });
  }
}
```

## Core Concepts

### Idempotency Key Strategies

Different strategies for generating and managing idempotency keys:

| Strategy | Example | Use Case |
|----------|---------|----------|
| UUID | `550e8400-e29b-41d4-a716-446655440000` | General purpose, client-generated |
| Business Key | `order-2024-001-payment` | Business logic-driven uniqueness |
| Hash of Request | `sha256(payload)` | Automatic deduplication of identical requests |
| Timestamp + Nonce | `1705123456789-abc123` | Time-bounded operations |
| Composite | `user-123-action-pay-ref-456` | Combining multiple identifiers |

```typescript
// Strategy 1: Client-generated UUID
const request = {
  idempotencyKey: crypto.randomUUID(),
  action: 'createPayment',
  amount: 100
};

// Strategy 2: Business key
const businessKey = `payment-${orderId}-${paymentAttempt}`;

// Strategy 3: Hash of request body
import { createHash } from 'crypto';
const requestHash = createHash('sha256')
  .update(JSON.stringify(requestBody))
  .digest('hex');

// Strategy 4: Composite key
const compositeKey = [
  userId,
  'transfer',
  destinationAccount,
  amount,
  new Date().toISOString().split('T')[0]  // Date component
].join(':');
```

### State Management

Track the state of idempotent operations:

```typescript
enum IdempotencyState {
  PENDING = 'pending',      // Request received, processing started
  PROCESSING = 'processing', // Actively being processed
  COMPLETED = 'completed',   // Successfully completed
  FAILED = 'failed'          // Failed (might be retryable)
}

interface IdempotencyRecord {
  key: string;
  state: IdempotencyState;
  request: any;
  response?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

class IdempotencyManager {
  async process<T>(
    key: string,
    request: any,
    operation: () => Promise<T>
  ): Promise<T> {
    // Try to acquire the key
    const acquired = await this.tryAcquire(key, request);

    if (!acquired.isNew) {
      // Key exists - return based on state
      switch (acquired.record.state) {
        case IdempotencyState.COMPLETED:
          return acquired.record.response as T;

        case IdempotencyState.FAILED:
          throw new Error(acquired.record.error);

        case IdempotencyState.PROCESSING:
          // Still processing - client should retry later
          throw new ProcessingInProgressError(key);

        case IdempotencyState.PENDING:
          // Stuck in pending - might need cleanup
          await this.handleStalePending(acquired.record);
          break;
      }
    }

    try {
      // Mark as processing
      await this.updateState(key, IdempotencyState.PROCESSING);

      // Execute operation
      const result = await operation();

      // Mark as completed
      await this.updateState(key, IdempotencyState.COMPLETED, { response: result });

      return result;
    } catch (error) {
      // Mark as failed
      await this.updateState(key, IdempotencyState.FAILED, {
        error: error.message
      });
      throw error;
    }
  }
}
```

### Handling In-Flight Requests

When a duplicate request arrives while the original is still processing:

```typescript
class ConcurrentRequestHandler {
  private processingLocks: Map<string, Promise<any>> = new Map();

  async handle<T>(key: string, operation: () => Promise<T>): Promise<T> {
    // Check if same request is already in flight
    const existingPromise = this.processingLocks.get(key);
    if (existingPromise) {
      // Wait for existing operation to complete
      return existingPromise;
    }

    // Check persistent storage
    const stored = await this.storage.get(key);
    if (stored?.state === 'completed') {
      return stored.response;
    }

    // Create new promise for this operation
    const promise = this.executeWithLock(key, operation);
    this.processingLocks.set(key, promise);

    try {
      return await promise;
    } finally {
      this.processingLocks.delete(key);
    }
  }

  private async executeWithLock<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // Use distributed lock for multi-instance scenarios
    const lock = await this.distributedLock.acquire(key, {
      ttl: 30000,  // 30 second lock
      retries: 3
    });

    try {
      // Double-check storage after acquiring lock
      const stored = await this.storage.get(key);
      if (stored?.state === 'completed') {
        return stored.response;
      }

      const result = await operation();
      await this.storage.set(key, {
        state: 'completed',
        response: result
      });

      return result;
    } finally {
      await lock.release();
    }
  }
}
```

## Code Examples

### Complete Idempotent API Implementation

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';

// Idempotency key header
const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';

// Storage interface
interface IdempotencyEntry {
  status: 'processing' | 'completed' | 'failed';
  statusCode?: number;
  headers?: Record<string, string>;
  body?: any;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  private readonly redis: Redis;
  private readonly ttl = 24 * 60 * 60; // 24 hours

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // Only apply to POST, PUT, PATCH
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers[IDEMPOTENCY_KEY_HEADER.toLowerCase()] as string;

    if (!idempotencyKey) {
      // No idempotency key - proceed without protection
      return next();
    }

    const storageKey = this.buildStorageKey(req, idempotencyKey);

    // Try to get existing entry
    const existingEntry = await this.getEntry(storageKey);

    if (existingEntry) {
      return this.handleExistingEntry(res, existingEntry, storageKey);
    }

    // Try to acquire processing lock
    const acquired = await this.acquireLock(storageKey);

    if (!acquired) {
      // Another request is processing
      return res.status(409).json({
        error: 'Conflict',
        message: 'Request with this idempotency key is currently being processed'
      });
    }

    // Capture the response
    this.captureResponse(res, storageKey);

    next();
  }

  private buildStorageKey(req: Request, idempotencyKey: string): string {
    // Include method and path to prevent key collisions across endpoints
    return `idempotency:${req.method}:${req.path}:${idempotencyKey}`;
  }

  private async getEntry(key: string): Promise<IdempotencyEntry | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  private async acquireLock(key: string): Promise<boolean> {
    // Use SET NX (set if not exists) for atomic lock acquisition
    const result = await this.redis.set(
      key,
      JSON.stringify({
        status: 'processing',
        createdAt: Date.now()
      }),
      'EX', this.ttl,
      'NX'
    );

    return result === 'OK';
  }

  private handleExistingEntry(
    res: Response,
    entry: IdempotencyEntry,
    key: string
  ) {
    switch (entry.status) {
      case 'processing':
        // Still processing - return conflict
        return res.status(409).json({
          error: 'Conflict',
          message: 'Request is still being processed',
          retryAfter: 5
        });

      case 'completed':
        // Return cached response
        res.set('X-Idempotency-Replayed', 'true');
        if (entry.headers) {
          Object.entries(entry.headers).forEach(([k, v]) => {
            if (k.toLowerCase() !== 'content-length') {
              res.set(k, v);
            }
          });
        }
        return res.status(entry.statusCode || 200).json(entry.body);

      case 'failed':
        // Return cached error
        res.set('X-Idempotency-Replayed', 'true');
        return res.status(entry.statusCode || 500).json({
          error: entry.error
        });
    }
  }

  private captureResponse(res: Response, storageKey: string) {
    const originalJson = res.json.bind(res);

    res.json = (body: any) => {
      // Store the response
      const entry: IdempotencyEntry = {
        status: res.statusCode >= 400 ? 'failed' : 'completed',
        statusCode: res.statusCode,
        headers: this.extractHeaders(res),
        body,
        createdAt: Date.now(),
        completedAt: Date.now()
      };

      // Store asynchronously - don't block response
      this.redis.setex(
        storageKey,
        this.ttl,
        JSON.stringify(entry)
      ).catch(err => console.error('Failed to store idempotency entry:', err));

      return originalJson(body);
    };
  }

  private extractHeaders(res: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    const headerNames = res.getHeaderNames();

    for (const name of headerNames) {
      const value = res.getHeader(name);
      if (typeof value === 'string') {
        headers[name] = value;
      }
    }

    return headers;
  }
}

// Usage in NestJS controller
@Controller('payments')
export class PaymentController {
  @Post()
  async createPayment(
    @Headers('Idempotency-Key') idempotencyKey: string,
    @Body() createPaymentDto: CreatePaymentDto
  ): Promise<Payment> {
    // The middleware handles idempotency
    // This code only runs for new requests
    return this.paymentService.create(createPaymentDto);
  }
}
```

### Database-Based Idempotency

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

@Entity('idempotency_keys')
export class IdempotencyKey {
  @PrimaryColumn()
  key: string;

  @Column()
  requestPath: string;

  @Column()
  requestMethod: string;

  @Column('jsonb')
  requestBody: any;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  status: string;

  @Column('jsonb', { nullable: true })
  response: any;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;
}

@Injectable()
export class DatabaseIdempotencyService {
  constructor(
    @InjectRepository(IdempotencyKey)
    private readonly repository: Repository<IdempotencyKey>,
    private readonly dataSource: DataSource
  ) {}

  async executeIdempotent<T>(
    key: string,
    request: { path: string; method: string; body: any },
    operation: () => Promise<T>,
    ttlMs: number = 24 * 60 * 60 * 1000
  ): Promise<{ result: T; isReplay: boolean }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Try to insert new key with advisory lock
      const existing = await queryRunner.manager.findOne(IdempotencyKey, {
        where: { key },
        lock: { mode: 'pessimistic_write' }
      });

      if (existing) {
        await queryRunner.commitTransaction();
        return this.handleExisting(existing);
      }

      // Insert new record
      const record = new IdempotencyKey();
      record.key = key;
      record.requestPath = request.path;
      record.requestMethod = request.method;
      record.requestBody = request.body;
      record.status = 'processing';
      record.createdAt = new Date();
      record.expiresAt = new Date(Date.now() + ttlMs);

      await queryRunner.manager.save(record);
      await queryRunner.commitTransaction();

      // Execute operation outside transaction
      try {
        const result = await operation();

        // Update record with result
        await this.repository.update(key, {
          status: 'completed',
          response: result,
          completedAt: new Date()
        });

        return { result, isReplay: false };
      } catch (error) {
        // Update record with error
        await this.repository.update(key, {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date()
        });
        throw error;
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async handleExisting<T>(
    existing: IdempotencyKey
  ): Promise<{ result: T; isReplay: boolean }> {
    switch (existing.status) {
      case 'completed':
        return {
          result: existing.response as T,
          isReplay: true
        };

      case 'failed':
        throw new Error(existing.errorMessage);

      case 'processing':
        // Wait and retry
        await this.sleep(1000);
        const updated = await this.repository.findOne({
          where: { key: existing.key }
        });
        if (updated) {
          return this.handleExisting(updated);
        }
        throw new Error('Idempotency key processing timeout');

      default:
        throw new Error(`Unknown status: ${existing.status}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup expired keys
  async cleanupExpired(): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: LessThan(new Date())
    });
    return result.affected || 0;
  }
}
```

### Idempotent Message Processing

```typescript
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

interface Message {
  id: string;
  payload: any;
  timestamp: number;
}

@Injectable()
export class IdempotentMessageProcessor {
  private readonly redis: Redis;
  private readonly processingTimeout = 30000; // 30 seconds
  private readonly deduplicationWindow = 7 * 24 * 60 * 60; // 7 days

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async processMessage<T>(
    message: Message,
    handler: (payload: any) => Promise<T>
  ): Promise<{ result: T | null; status: 'processed' | 'duplicate' | 'error' }> {
    const messageKey = `msg:${message.id}`;

    // Check if message was already processed
    const existing = await this.redis.get(messageKey);

    if (existing) {
      const record = JSON.parse(existing);

      if (record.status === 'completed') {
        console.log(`Message ${message.id} already processed, skipping`);
        return { result: record.result, status: 'duplicate' };
      }

      if (record.status === 'processing') {
        // Check if processing is stale
        if (Date.now() - record.startedAt > this.processingTimeout) {
          // Stale processing - take over
          console.log(`Taking over stale processing of message ${message.id}`);
        } else {
          // Still being processed by another consumer
          return { result: null, status: 'duplicate' };
        }
      }
    }

    // Mark as processing
    const processingRecord = {
      status: 'processing',
      startedAt: Date.now()
    };

    const acquired = await this.redis.set(
      messageKey,
      JSON.stringify(processingRecord),
      'EX', this.deduplicationWindow,
      'NX'
    );

    if (!acquired) {
      // Lost race - another consumer got it
      return { result: null, status: 'duplicate' };
    }

    try {
      // Process the message
      const result = await handler(message.payload);

      // Mark as completed
      await this.redis.setex(
        messageKey,
        this.deduplicationWindow,
        JSON.stringify({
          status: 'completed',
          result,
          processedAt: Date.now()
        })
      );

      return { result, status: 'processed' };
    } catch (error) {
      // Mark as failed
      await this.redis.setex(
        messageKey,
        this.deduplicationWindow,
        JSON.stringify({
          status: 'failed',
          error: error.message,
          failedAt: Date.now()
        })
      );

      throw error;
    }
  }

  // For ordered message processing with exactly-once semantics
  async processOrderedMessages<T>(
    consumerId: string,
    streamKey: string,
    handler: (message: Message) => Promise<T>
  ): Promise<void> {
    const lastProcessedKey = `consumer:${consumerId}:lastProcessed`;

    while (true) {
      // Get last processed message ID
      const lastId = await this.redis.get(lastProcessedKey) || '0';

      // Read new messages
      const messages = await this.redis.xread(
        'BLOCK', 5000,
        'STREAMS', streamKey, lastId
      );

      if (!messages) continue;

      for (const [streamName, entries] of messages) {
        for (const [messageId, fields] of entries) {
          const message: Message = {
            id: messageId,
            payload: this.parseFields(fields),
            timestamp: this.extractTimestamp(messageId)
          };

          // Process with idempotency
          const { status } = await this.processMessage(message, handler);

          if (status === 'processed' || status === 'duplicate') {
            // Update checkpoint
            await this.redis.set(lastProcessedKey, messageId);
          }
        }
      }
    }
  }

  private parseFields(fields: string[]): any {
    const obj: any = {};
    for (let i = 0; i < fields.length; i += 2) {
      obj[fields[i]] = JSON.parse(fields[i + 1]);
    }
    return obj;
  }

  private extractTimestamp(messageId: string): number {
    return parseInt(messageId.split('-')[0], 10);
  }
}
```

## Best Practices

### 1. Always Use Idempotency Keys for Mutations

```typescript
// Client-side: Generate key for each unique operation
class ApiClient {
  async createOrder(order: CreateOrderRequest): Promise<Order> {
    // Generate key once and reuse for retries
    const idempotencyKey = this.generateIdempotencyKey(order);

    return this.retryWithIdempotency(
      () => this.http.post('/orders', order, {
        headers: { 'Idempotency-Key': idempotencyKey }
      }),
      { maxRetries: 3 }
    );
  }

  private generateIdempotencyKey(order: CreateOrderRequest): string {
    // Option 1: UUID
    return crypto.randomUUID();

    // Option 2: Deterministic from content
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(order))
      .digest('hex');
  }
}
```

### 2. Validate Idempotency Key Request Matching

```typescript
class StrictIdempotencyService {
  async process(
    key: string,
    request: { method: string; path: string; body: any },
    operation: () => Promise<any>
  ): Promise<any> {
    const existing = await this.storage.get(key);

    if (existing) {
      // Verify request matches
      const requestHash = this.hashRequest(request);

      if (existing.requestHash !== requestHash) {
        throw new IdempotencyKeyConflictError(
          'Idempotency key already used with different request parameters'
        );
      }

      return existing.response;
    }

    // Store with request hash for verification
    const result = await operation();

    await this.storage.set(key, {
      requestHash: this.hashRequest(request),
      response: result,
      createdAt: Date.now()
    });

    return result;
  }

  private hashRequest(request: { method: string; path: string; body: any }): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify({
        method: request.method,
        path: request.path,
        body: request.body
      }))
      .digest('hex');
  }
}
```

### 3. Handle Partial Failures

```typescript
class IdempotentSagaExecutor {
  async execute(
    sagaId: string,
    steps: SagaStep[]
  ): Promise<SagaResult> {
    const saga = await this.getSagaState(sagaId);

    if (saga?.status === 'completed') {
      return saga.result;
    }

    // Resume from where we left off
    const startIndex = saga?.completedSteps?.length || 0;

    for (let i = startIndex; i < steps.length; i++) {
      const step = steps[i];
      const stepKey = `${sagaId}:step:${i}`;

      // Each step is idempotent
      const stepResult = await this.executeIdempotentStep(stepKey, step);

      // Update saga state after each step
      await this.updateSagaState(sagaId, {
        completedSteps: [...(saga?.completedSteps || []), stepResult],
        currentStep: i + 1
      });
    }

    // Mark saga as completed
    const finalState = await this.getSagaState(sagaId);
    await this.updateSagaState(sagaId, {
      status: 'completed',
      result: this.buildResult(finalState.completedSteps)
    });

    return finalState.result;
  }
}
```

### 4. Set Appropriate TTLs

```typescript
// Different TTLs for different use cases
const IDEMPOTENCY_TTLS = {
  // Short-lived: API requests (might retry within minutes)
  apiRequest: 24 * 60 * 60,  // 24 hours

  // Medium: Webhook deliveries (might retry over hours)
  webhookDelivery: 7 * 24 * 60 * 60,  // 7 days

  // Long: Financial transactions (regulatory requirements)
  financialTransaction: 90 * 24 * 60 * 60,  // 90 days

  // Very long: Compliance-sensitive operations
  auditableOperation: 365 * 24 * 60 * 60  // 1 year
};

class ConfigurableIdempotencyService {
  async process(
    key: string,
    operation: () => Promise<any>,
    options: { ttlSeconds?: number; category?: keyof typeof IDEMPOTENCY_TTLS }
  ): Promise<any> {
    const ttl = options.ttlSeconds ||
      IDEMPOTENCY_TTLS[options.category || 'apiRequest'];

    // ... implementation with configured TTL
  }
}
```

## Common Pitfalls

### 1. Not Handling In-Progress State

```typescript
// Anti-pattern: Ignoring in-progress requests
class BrokenIdempotency {
  async process(key: string, operation: () => Promise<any>): Promise<any> {
    const existing = await this.storage.get(key);
    if (existing) {
      return existing.result; // What if status is 'processing'?
    }

    await this.storage.set(key, { status: 'processing' });
    const result = await operation();
    await this.storage.set(key, { status: 'completed', result });

    return result;
  }
}

// Better: Handle all states
class RobustIdempotency {
  async process(key: string, operation: () => Promise<any>): Promise<any> {
    const existing = await this.storage.get(key);

    if (existing) {
      switch (existing.status) {
        case 'completed':
          return existing.result;

        case 'failed':
          throw new Error(existing.error);

        case 'processing':
          // Wait and check again, or return specific response
          if (Date.now() - existing.startedAt > 30000) {
            // Stale - clean up and retry
            await this.storage.delete(key);
            break;
          }
          throw new RequestInProgressError(key);
      }
    }

    // ... rest of implementation
  }
}
```

### 2. Race Conditions in Check-and-Set

```typescript
// Anti-pattern: Non-atomic check-and-set
async function racyIdempotency(key: string): Promise<void> {
  const exists = await cache.exists(key);  // Check
  if (exists) return;

  // Gap where another process could insert!

  await cache.set(key, 'processing');  // Set
  await doOperation();
}

// Better: Atomic operation
async function atomicIdempotency(key: string): Promise<void> {
  // SET NX is atomic - set only if not exists
  const acquired = await redis.set(key, 'processing', 'NX', 'EX', 3600);

  if (!acquired) {
    // Key already exists
    return;
  }

  await doOperation();
}
```

### 3. Using Mutable Keys

```typescript
// Anti-pattern: Key that changes with timestamp
const badKey = `order:${userId}:${Date.now()}`;
// Every retry generates a new key!

// Better: Stable key from request content
const goodKey = `order:${userId}:${cartId}:${checkoutSessionId}`;
// Same key for retries of the same logical operation
```

### 4. Not Persisting Before Processing

```typescript
// Anti-pattern: Process before persisting key
async function badOrder(key: string): Promise<void> {
  const result = await processOrder();  // What if this succeeds...
  await saveIdempotencyKey(key, result);  // ...but this fails?
  // Retry will process the order again!
}

// Better: Persist key first
async function goodOrder(key: string): Promise<void> {
  // Mark as processing first
  const acquired = await tryAcquireKey(key);
  if (!acquired) return getExistingResult(key);

  try {
    const result = await processOrder();
    await markKeyCompleted(key, result);
    return result;
  } catch (error) {
    await markKeyFailed(key, error);
    throw error;
  }
}
```

## Performance Considerations

### Caching Strategy

```typescript
class TieredIdempotencyCache {
  private localCache: LRUCache<string, IdempotencyRecord>;
  private redis: Redis;

  async get(key: string): Promise<IdempotencyRecord | null> {
    // L1: Local cache (fastest)
    const local = this.localCache.get(key);
    if (local) return local;

    // L2: Redis (shared across instances)
    const remote = await this.redis.get(key);
    if (remote) {
      const record = JSON.parse(remote);
      this.localCache.set(key, record);
      return record;
    }

    return null;
  }

  async set(key: string, record: IdempotencyRecord): Promise<void> {
    // Write to both caches
    await Promise.all([
      this.redis.setex(key, 86400, JSON.stringify(record)),
      this.localCache.set(key, record)
    ]);
  }
}
```

### Batch Processing

```typescript
class BatchIdempotencyChecker {
  async checkBatch(keys: string[]): Promise<Map<string, IdempotencyRecord | null>> {
    // Single round trip for multiple keys
    const results = await this.redis.mget(keys);

    return new Map(
      keys.map((key, i) => [
        key,
        results[i] ? JSON.parse(results[i]) : null
      ])
    );
  }
}
```

## Real-World Scenarios

### Scenario: Payment Processing

```typescript
class PaymentService {
  async processPayment(
    idempotencyKey: string,
    payment: PaymentRequest
  ): Promise<PaymentResult> {
    return this.idempotency.execute(
      idempotencyKey,
      async () => {
        // Validate payment
        await this.validatePayment(payment);

        // Check for duplicate based on business rules
        const existingPayment = await this.findExistingPayment(
          payment.orderId,
          payment.amount
        );

        if (existingPayment) {
          return existingPayment;
        }

        // Process with payment gateway
        const gatewayResult = await this.paymentGateway.charge({
          amount: payment.amount,
          currency: payment.currency,
          cardToken: payment.cardToken,
          idempotencyKey  // Pass to gateway too!
        });

        // Store result
        const paymentRecord = await this.savePayment({
          id: generateId(),
          orderId: payment.orderId,
          amount: payment.amount,
          gatewayTransactionId: gatewayResult.transactionId,
          status: 'completed'
        });

        return paymentRecord;
      }
    );
  }
}
```

### Scenario: Order Creation

```typescript
class OrderService {
  async createOrder(
    idempotencyKey: string,
    request: CreateOrderRequest
  ): Promise<Order> {
    return this.idempotency.execute(
      idempotencyKey,
      async () => {
        // Create order with nested idempotent operations
        const order = await this.orderRepository.create({
          id: generateId(),
          customerId: request.customerId,
          items: request.items,
          status: 'pending'
        });

        // Reserve inventory (idempotent)
        await this.inventoryService.reserve({
          orderId: order.id,
          items: request.items,
          idempotencyKey: `${idempotencyKey}:inventory`
        });

        // Initialize payment (idempotent)
        await this.paymentService.initiate({
          orderId: order.id,
          amount: order.total,
          idempotencyKey: `${idempotencyKey}:payment`
        });

        return order;
      }
    );
  }
}
```

## Interview Key Points

### Core Understanding

**Q1: What is idempotency and why is it important?**

Idempotency means an operation produces the same result whether executed once or multiple times. It's crucial in distributed systems because:
- Network failures require retries
- Duplicate messages can occur
- Clients may retry on timeout without knowing if the operation succeeded
- It enables safe retry logic without data corruption

**Q2: How do you implement idempotency for a POST endpoint?**

Use idempotency keys:
1. Client sends unique key in request header
2. Server checks if key was seen before
3. If seen, return cached response
4. If new, process request and cache response with key
5. Use atomic operations to prevent race conditions

**Q3: What's the difference between natural and explicit idempotency?**

- **Natural idempotency**: Operation is inherently idempotent (e.g., setting a value to 100)
- **Explicit idempotency**: Using mechanisms like idempotency keys to make non-idempotent operations safe for retry

### Technical Questions

**Q4: How do you handle concurrent duplicate requests?**

```typescript
// Use distributed locking
const lock = await redis.set(key, 'processing', 'NX', 'EX', 30);
if (!lock) {
  // Wait and check for result, or return 409 Conflict
}
// Process and store result
```

**Q5: What happens if the idempotency store fails?**

Options:
1. Fail the request (safest for financial operations)
2. Proceed without idempotency (acceptable for less critical operations)
3. Use a fallback store
4. Implement circuit breaker pattern

## Further Reading

### Official Resources

- [Stripe Idempotency](https://stripe.com/docs/api/idempotent_requests) - Industry-leading implementation
- [AWS API Gateway Idempotency](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-private.html)
- [Google Cloud API Design Guide](https://cloud.google.com/apis/design/design_patterns#request_duplication)

### Books

- "Designing Data-Intensive Applications" by Martin Kleppmann - Chapter on transactions
- "Building Microservices" by Sam Newman - Distributed systems patterns
- "Release It!" by Michael Nygard - Stability patterns

### Technical Articles

- [Implementing Stripe-like Idempotency Keys](https://brandur.org/idempotency-keys)
- [Exactly-Once Semantics in Kafka](https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-kafka-does-it/)
- [Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)

### Tools

- [Redis](https://redis.io/) - For distributed idempotency key storage
- [Temporal](https://temporal.io/) - Workflow engine with built-in idempotency
- [AWS Lambda Powertools](https://awslabs.github.io/aws-lambda-powertools-python/latest/utilities/idempotency/) - Idempotency utilities

---

Idempotency is a fundamental principle for building reliable distributed systems. By implementing proper idempotency mechanisms, you can create APIs that gracefully handle retries, network failures, and duplicate requests without causing unintended side effects. Remember that idempotency is not just about preventing duplicate operations - it's about providing a consistent and predictable experience for clients in an unreliable distributed environment.
